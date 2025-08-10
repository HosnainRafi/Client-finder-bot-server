// src/routes/job.routes.js
const express = require("express");
const {
  getJobs,
  startScraping,
  startApplication,
} = require("../controllers/job.controller");
const router = express.Router();

// Route to get all jobs
router.get("/", getJobs);

// Route to start the scraping process
router.post("/scrape", startScraping);
router.post("/:id/apply", startApplication);

module.exports = router;
