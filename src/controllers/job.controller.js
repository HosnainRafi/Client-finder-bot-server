// This controller uses the official 'openai' package as a CLIENT library
// to connect to the 'OpenRouter' SERVICE. This is the correct and standard way.

const { chromium } = require("playwright");
// STEP 1: REQUIRE THE TOOL
// You need the 'openai' package because OpenRouter's API is designed to be compatible
// with it. Think of this package as a universal remote control.
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const Job = require("../models/job.model");

// --- 1. INITIAL SETUP: AI and RESUME ---

// STEP 2: CONFIGURE THE TOOL TO USE OPENROUTER
// Here, you create an instance of the client and tell it to talk to
// OpenRouter's servers, not OpenAI's.
const openrouterClient = new OpenAI({
  // Use your OpenRouter key, not an OpenAI key.
  apiKey: process.env.OPENROUTER_API_KEY,

  // THIS IS THE MOST IMPORTANT LINE: It points the "universal remote" to the
  // OpenRouter service instead of the default OpenAI service.
  baseURL: "https://openrouter.ai/api/v1",

  // These headers are specific to OpenRouter and are good practice.
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5001", // Or your future app's URL
    "X-Title": "Client Finder Bot",
  },
});

// Load resume content from the text file once when the server starts
const resumePath = path.join(__dirname, "..", "..", "resume.txt");
const myResume = fs.readFileSync(resumePath, "utf-8");

// --- 2. CORE LOGIC FUNCTIONS ---

/**
 * Uses AI to analyze if a job description is a good match for the resume.
 * @param {string} jobDescription - The full text of the job description.
 * @returns {Promise<{isMatch: boolean, reasoning: string}>} - The AI's analysis.
 */
async function analyzeJobWithAI(jobDescription) {
  try {
    const prompt = `
      Based on my resume below, please analyze the following job description.
      My Resume: --- ${myResume} ---
      Job Description: --- ${jobDescription} ---
      Is this job a good fit for me, specifically for a "Junior Web Developer" or "Web Developer" role?
      Provide your answer in a JSON object with two keys: "isMatch" (boolean) and "reasoning" (a brief, one-sentence explanation).
    `;

    // STEP 3: USE THE CONFIGURED TOOL WITH THE HAIKU MODEL
    // The request is sent to OpenRouter because of the baseURL you set earlier.
    const response = await openrouterClient.chat.completions.create({
      // You are correctly specifying the model ID for Claude 3 Haiku on OpenRouter.
      model: "anthropic/claude-3-haiku-20240307",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    const analysis = JSON.parse(response.choices[0].message.content);
    return { isMatch: analysis.isMatch, reasoning: analysis.reasoning };
  } catch (error) {
    console.error("AI analysis failed:", error);
    return { isMatch: false, reasoning: "AI analysis failed." };
  }
}

/**
 * Uses AI to generate a professional cover letter.
 * @param {string} jobDescription - The full text of the job description.
 * @returns {Promise<string>} - The generated cover letter.
 */
async function generateCoverLetter(jobDescription) {
  try {
    const prompt = `
      Based on my resume below, write a professional and concise cover letter for the following job.
      Make it enthusiastic and directly address the requirements in the job description.
      Do not use placeholders like "[Your Name]". Start directly with the letter content.
      My Resume: --- ${myResume} ---
      Job Description: --- ${jobDescription} ---
    `;
    // This call also correctly uses the OpenRouter client.
    const response = await openrouterClient.chat.completions.create({
      model: "anthropic/claude-3-haiku-20240307",
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("AI cover letter generation failed:", error);
    return "I am very interested in this opportunity and believe my skills are a strong match for your requirements. I look forward to discussing my qualifications further.";
  }
}

/**
 * The main scraper function that finds jobs and sends them for AI analysis.
 */
const scrapeAndAnalyze = async () => {
  // ... (This entire function is correct and does not need changes)
  console.log("Scraper & Analyzer function started...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(
    "https://www.upwork.com/nx/jobs/search/?q=MERN%20Stack%20developer&sort=recency"
  );

  let hasNextPage = true;
  while (hasNextPage) {
    await page.waitForSelector(".job-tile a", { timeout: 60000 });
    const jobLinks = await page.$$eval(".job-tile a", (links) =>
      links.map((a) => "https://www.upwork.com" + a.getAttribute("href"))
    );

    for (const link of jobLinks) {
      if (await Job.findOne({ link })) {
        console.log(
          `- Skipping already processed job: ${link.substring(0, 50)}...`
        );
        continue;
      }
      const jobPage = await context.newPage();
      try {
        console.log(`\nNavigating to job details: ${link.substring(0, 50)}...`);
        await jobPage.goto(link, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });
        const title = await jobPage
          .locator('h1[data-test="job-title-visitor"]')
          .innerText();
        const description = await jobPage
          .locator('[data-test="job-description"]')
          .innerText();
        console.log(`Analyzing job: ${title}`);
        const { isMatch, reasoning } = await analyzeJobWithAI(description);
        await Job.create({
          title,
          link,
          description,
          isMatch,
          matchReasoning: reasoning,
          status: "processed",
        });
        console.log(
          `✅ Job processed. AI Match: ${isMatch}. Reason: ${reasoning}`
        );
      } catch (error) {
        console.error(`Failed to process job at ${link}:`, error.message);
        await Job.create({ link, title: "Scraping Failed", status: "error" });
      } finally {
        await jobPage.close();
      }
    }
    const nextButton = await page.$(".next-page-selector:not([disabled])");
    if (nextButton) {
      await nextButton.click();
      console.log("\nNavigating to next search page...\n");
      await page.waitForTimeout(3000);
    } else {
      hasNextPage = false;
    }
  }
  await browser.close();
  console.log("Scraping and analysis finished.");
};

/**
 * The main application function. Logs in, generates a cover letter, and applies.
 * @param {string} jobId - The MongoDB ID of the job to apply for.
 */
const applyToJob = async (jobId) => {
  // ... (This entire function is correct and does not need changes)
  const job = await Job.findById(jobId);
  if (!job) {
    return console.error(`Job with ID ${jobId} not found.`);
  }

  console.log(`\n--- STARTING APPLICATION FOR: ${job.title} ---`);
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("Step 1: Logging in to Upwork...");
    await page.goto("https://www.upwork.com/ab/account-security/login");
    await page.locator("#login_username").fill(process.env.UPWORK_EMAIL);
    await page.locator("#login_password_continue").click();
    await page.waitForSelector("#login_password", { timeout: 10000 });
    await page.locator("#login_password").fill(process.env.UPWORK_PASSWORD);
    await page.locator("#login_control_continue").click();
    await page.waitForNavigation({
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });
    console.log("Login successful.");

    console.log(`Step 2: Navigating to job application page...`);
    const applyLink = job.link.endsWith("/")
      ? `${job.link}apply`
      : `${job.link}/apply`;
    await page.goto(applyLink);

    console.log("Step 3: Generating cover letter with AI...");
    const coverLetter = await generateCoverLetter(job.description);

    console.log("Step 4: Filling out application form...");
    await page.waitForSelector(
      'textarea[aria-labelledby="cover_letter_description"]',
      { timeout: 60000 }
    );
    await page
      .locator('textarea[aria-labelledby="cover_letter_description"]')
      .fill(coverLetter);
    console.log("Filled cover letter.");

    console.log("Step 5: Submitting application...");
    await page
      .locator('button[data-test="btn-submit"], button:has-text("Send for")')
      .first()
      .click();
    await page.waitForNavigation({ timeout: 60000 });

    console.log(`✅ Application for "${job.title}" submitted successfully!`);
    job.status = "applied";
  } catch (error) {
    console.error(`❌ Failed to apply for job "${job.title}":`, error.message);
    job.status = "application_failed";
  } finally {
    await job.save();
    await browser.close();
    console.log("Browser closed. Application process finished.");
  }
};

// --- 3. CONTROLLER FUNCTIONS (EXPORTED TO ROUTER) ---

// @desc      Start the scraping and analysis process
// @route     POST /api/jobs/scrape
const startScraping = (req, res) => {
  res.status(202).json({ message: "Scraping and analysis process initiated." });
  scrapeAndAnalyze().catch((error) =>
    console.error("An error occurred during background scraping:", error)
  );
};

// @desc      Get all saved jobs from the database (can be filtered)
// @route     GET /api/jobs
const getJobs = async (req, res) => {
  try {
    const filter = req.query.matchesOnly === "true" ? { isMatch: true } : {};
    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching jobs", error: error.message });
  }
};

// @desc      Start the application process for a specific job
// @route     POST /api/jobs/:id/apply
const startApplication = (req, res) => {
  const { id } = req.params;
  res
    .status(202)
    .json({ message: `Application process initiated for job ID: ${id}.` });
  applyToJob(id).catch((error) =>
    console.error("An error occurred during background application:", error)
  );
};

module.exports = {
  startScraping,
  getJobs,
  startApplication,
};
