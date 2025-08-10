// This file contains the AIService class that interacts with the OpenRouter Haiku AI for analyzing jobs, generating emails, and more.

const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const { logger, aiLogger } = require("../config/logger");

class AIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.BASE_URL || "http://localhost:5001",
        "X-Title": "Client Finder Bot",
      },
    });

    this.model = process.env.AI_MODEL || "anthropic/claude-3-haiku-20240307";
    this.resume = this.loadResume();
    this.prompts = this.initializePrompts();
  }

  loadResume() {
    try {
      const resumePath = path.join(__dirname, "..", "..", "resume.txt");
      return fs.readFileSync(resumePath, "utf-8");
    } catch (error) {
      logger.error("Failed to load resume:", error);
      return "Full-stack web developer specializing in MERN stack development.";
    }
  }

  initializePrompts() {
    return {
      jobAnalysis: `
        Based on my resume below, analyze this job description and determine if it's a good match.
        
        My Resume: {resume}
        
        Job Description: {jobDescription}
        
        Please provide your analysis in JSON format with these fields:
        - isMatch (boolean): Is this a good fit?
        - matchScore (number 0-100): How well does it match?
        - reasoning (string): Brief explanation
        - keyRequirements (array): Key requirements from the job
        - myStrengths (array): My relevant strengths
        - gaps (array): Any gaps or concerns
        - projectType (string): Type of project (web-development, e-commerce, etc.)
        - estimatedBudget (object): {min: number, max: number, currency: string}
      `,

      clientAnalysis: `
        Analyze this job posting to extract client information and business intelligence.
        
        Job Data: {jobData}
        
        Extract and analyze in JSON format:
        - companyName (string): Company name if mentioned
        - industry (string): What industry/sector
        - projectScope (string): Small/Medium/Large project
        - urgency (string): Low/Medium/High urgency
        - clientType (string): Startup/SMB/Enterprise/Individual
        - techStack (array): Technologies mentioned
        - painPoints (array): Problems they're trying to solve
        - leadQuality (string): hot/warm/cold based on project details
        - suggestedApproach (string): How to approach this client
      `,

      emailGeneration: `
        Generate a personalized cold email for this client based on the information provided.
        
        My Background: {resume}
        Client Information: {clientInfo}
        Email Type: {emailType}
        
        Requirements:
        - Professional but friendly tone
        - Personalized based on their company/industry
        - Highlight relevant experience
        - Clear call-to-action
        - Keep it concise (under 200 words)
        - Include subject line
        
        Provide response in JSON format:
        - subject (string): Email subject line
        - body (string): Email body content
        - keyPersonalizationPoints (array): What made it personalized
        - callToAction (string): The main CTA used
      `,

      followUpGeneration: `
        Generate a follow-up email based on the previous outreach.
        
        Original Email: {originalEmail}
        Client Info: {clientInfo}
        Days Since Last Contact: {daysSince}
        Follow-up Number: {followUpNumber}
        
        Create a follow-up that:
        - References the previous email appropriately
        - Adds new value or perspective
        - Maintains professional persistence
        - Includes a different angle or benefit
        
        JSON response:
        - subject (string): Follow-up subject line
        - body (string): Follow-up email body
        - strategy (string): The approach used for this follow-up
      `,

      proposalGeneration: `
        Generate a project proposal based on the job requirements and client information.
        
        My Background: {resume}
        Job Requirements: {jobDescription}
        Client Info: {clientInfo}
        Proposed Budget: {budget}
        
        Create a comprehensive proposal with:
        - Executive summary
        - Understanding of requirements
        - Proposed solution approach
        - Timeline and milestones
        - Technology stack
        - Investment/pricing
        - Next steps
        
        JSON response:
        - proposal (string): Full proposal content
        - timeline (string): Estimated timeline
        - keyDeliverables (array): Main deliverables
        - riskFactors (array): Potential risks/challenges
      `,
    };
  }

  async analyzeJobMatch(jobDescription) {
    try {
      const prompt = this.prompts.jobAnalysis
        .replace("{resume}", this.resume)
        .replace("{jobDescription}", jobDescription);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const analysis = JSON.parse(response.choices[0].message.content);

      aiLogger.info("Job analysis completed", {
        matchScore: analysis.matchScore,
        isMatch: analysis.isMatch,
        projectType: analysis.projectType,
      });

      return analysis;
    } catch (error) {
      logger.error("Job analysis failed:", error);
      return {
        isMatch: false,
        matchScore: 0,
        reasoning: "AI analysis failed",
        keyRequirements: [],
        myStrengths: [],
        gaps: ["Analysis unavailable"],
        projectType: "unknown",
        estimatedBudget: { min: 0, max: 0, currency: "USD" },
      };
    }
  }

  async analyzeJobForClientInfo(jobData) {
    try {
      const prompt = this.prompts.clientAnalysis.replace(
        "{jobData}",
        JSON.stringify(jobData)
      );

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const analysis = JSON.parse(response.choices[0].message.content);

      aiLogger.info("Client analysis completed", {
        companyName: analysis.companyName,
        industry: analysis.industry,
        leadQuality: analysis.leadQuality,
      });

      return {
        company: analysis.companyName,
        industry: analysis.industry,
        projectType: [analysis.projectScope?.toLowerCase()],
        leadQuality: analysis.leadQuality,
        aiAnalysis: {
          matchScore: this.calculateMatchScore(analysis),
          reasoning: analysis.suggestedApproach,
          keyPoints: analysis.painPoints || [],
          suggestedApproach: analysis.suggestedApproach,
        },
        technologies: analysis.techStack || [],
        notes: [
          {
            content: `AI Analysis: ${analysis.suggestedApproach}`,
            type: "general",
          },
        ],
      };
    } catch (error) {
      logger.error("Client info analysis failed:", error);
      return null;
    }
  }

  async generatePersonalizedEmail(clientInfo, emailType = "cold_email") {
    try {
      const prompt = this.prompts.emailGeneration
        .replace("{resume}", this.resume)
        .replace("{clientInfo}", JSON.stringify(clientInfo))
        .replace("{emailType}", emailType);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const emailData = JSON.parse(response.choices[0].message.content);

      aiLogger.info("Personalized email generated", {
        clientId: clientInfo._id,
        emailType,
        subject: emailData.subject,
      });

      return emailData;
    } catch (error) {
      logger.error("Email generation failed:", error);
      return {
        subject: `Web Development Services for ${
          clientInfo.company || "Your Company"
        }`,
        body: this.getFallbackEmailBody(clientInfo),
        keyPersonalizationPoints: ["Fallback template used"],
        callToAction: "Schedule a brief call",
      };
    }
  }

  async generateFollowUpEmail(
    originalOutreach,
    clientInfo,
    followUpNumber = 1
  ) {
    try {
      const daysSince = Math.floor(
        (new Date() - new Date(originalOutreach.sentAt)) / (1000 * 60 * 60 * 24)
      );

      const prompt = this.prompts.followUpGeneration
        .replace("{originalEmail}", originalOutreach.emailContent)
        .replace("{clientInfo}", JSON.stringify(clientInfo))
        .replace("{daysSince}", daysSince)
        .replace("{followUpNumber}", followUpNumber);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.6,
      });

      const followUpData = JSON.parse(response.choices[0].message.content);

      aiLogger.info("Follow-up email generated", {
        clientId: clientInfo._id,
        followUpNumber,
        strategy: followUpData.strategy,
      });

      return followUpData;
    } catch (error) {
      logger.error("Follow-up email generation failed:", error);
      return {
        subject: `Following up on web development discussion`,
        body: this.getFallbackFollowUpBody(clientInfo),
        strategy: "Fallback template",
      };
    }
  }

  async generateProposal(jobDescription, clientInfo, budget) {
    try {
      const prompt = this.prompts.proposalGeneration
        .replace("{resume}", this.resume)
        .replace("{jobDescription}", jobDescription)
        .replace("{clientInfo}", JSON.stringify(clientInfo))
        .replace("{budget}", JSON.stringify(budget));

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      const proposalData = JSON.parse(response.choices[0].message.content);

      aiLogger.info("Proposal generated", {
        clientId: clientInfo._id,
        timeline: proposalData.timeline,
        deliverables: proposalData.keyDeliverables?.length,
      });

      return proposalData;
    } catch (error) {
      logger.error("Proposal generation failed:", error);
      return {
        proposal: "Proposal generation failed. Please create manually.",
        timeline: "TBD",
        keyDeliverables: [],
        riskFactors: ["Manual review required"],
      };
    }
  }

  async analyzeSentiment(text) {
    try {
      const prompt = `
        Analyze the sentiment of this message and categorize it:
        
        Message: "${text}"
        
        Provide JSON response:
        - sentiment (string): positive/neutral/negative
        - confidence (number 0-100): How confident you are
        - indicators (array): Key words/phrases that influenced the decision
        - responseType (string): interested/not_interested/need_more_info/pricing_inquiry
      `;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error("Sentiment analysis failed:", error);
      return {
        sentiment: "neutral",
        confidence: 0,
        indicators: [],
        responseType: "unknown",
      };
    }
  }

  async optimizeEmailContent(
    emailContent,
    clientInfo,
    goal = "increase_response_rate"
  ) {
    try {
      const prompt = `
        Optimize this email content to improve its effectiveness:
        
        Current Email: ${emailContent}
        Client Info: ${JSON.stringify(clientInfo)}
        Optimization Goal: ${goal}
        
        Provide suggestions in JSON format:
        - optimizedSubject (string): Improved subject line
        - optimizedBody (string): Improved email body
        - improvements (array): List of changes made
        - expectedImpact (string): Why these changes should help
        - alternativeVersions (array): 2-3 alternative approaches
      `;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.6,
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error("Email optimization failed:", error);
      return null;
    }
  }

  // Helper methods
  calculateMatchScore(analysis) {
    let score = 50; // Base score

    if (analysis.leadQuality === "hot") score += 30;
    else if (analysis.leadQuality === "warm") score += 15;

    if (analysis.projectScope === "Large") score += 20;
    else if (analysis.projectScope === "Medium") score += 10;

    if (analysis.urgency === "High") score += 15;
    else if (analysis.urgency === "Medium") score += 5;

    return Math.min(100, Math.max(0, score));
  }

  getFallbackEmailBody(clientInfo) {
    return `Hi ${clientInfo.name || "there"},

I came across ${
      clientInfo.company || "your company"
    } and was impressed by your work in ${
      clientInfo.industry || "your industry"
    }. 

As a full-stack web developer specializing in the MERN stack, I help businesses build modern, scalable web applications. I'd love to discuss how I can help you achieve your development goals.

Are you available for a brief 15-minute call this week?

Best regards,
${process.env.EMAIL_FROM_NAME}`;
  }

  getFallbackFollowUpBody(clientInfo) {
    return `Hi ${clientInfo.name || "there"},

I wanted to follow up on my previous email about web development services for ${
      clientInfo.company || "your company"
    }.

I understand you're busy, but I believe I can help you with your development needs. Would you be open to a quick conversation?

Best regards,
${process.env.EMAIL_FROM_NAME}`;
  }

  // API usage tracking
  async trackApiUsage(endpoint, tokens) {
    try {
      aiLogger.info("API usage tracked", {
        endpoint,
        tokens,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Failed to track API usage:", error);
    }
  }

  // Batch processing for multiple analyses
  async batchAnalyzeJobs(jobDescriptions) {
    const results = [];
    const batchSize = 5; // Process in batches to avoid rate limits

    for (let i = 0; i < jobDescriptions.length; i += batchSize) {
      const batch = jobDescriptions.slice(i, i + batchSize);
      const batchPromises = batch.map((job) =>
        this.analyzeJobMatch(job.description)
      );

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);

      // Rate limiting delay
      if (i + batchSize < jobDescriptions.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return results;
  }
}

module.exports = new AIService();