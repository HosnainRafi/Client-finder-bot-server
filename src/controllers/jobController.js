const Job = require('../models/Job');
const aiService = require('../services/aiService');

class JobController {
  async createJob(req, res) {
    try {
      const jobData = req.body;
      const newJob = new Job(jobData);
      await newJob.save();
      res.status(201).json(newJob);
    } catch (error) {
      res.status(500).json({ message: 'Error creating job', error });
    }
  }

  async getJobs(req, res) {
    try {
      const jobs = await Job.find();
      res.status(200).json(jobs);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching jobs', error });
    }
  }

  async analyzeJob(req, res) {
    try {
      const { jobDescription } = req.body;
      const analysis = await aiService.analyzeJobMatch(jobDescription);
      res.status(200).json(analysis);
    } catch (error) {
      res.status(500).json({ message: 'Error analyzing job', error });
    }
  }
}

module.exports = new JobController();