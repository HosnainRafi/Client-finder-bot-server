// jobRoutes.js

const express = require('express');
const JobController = require('../controllers/jobController');

const router = express.Router();
const jobController = new JobController();

// Route to create a new job posting
router.post('/jobs', jobController.createJob);

// Route to get all job postings
router.get('/jobs', jobController.getAllJobs);

// Route to get a specific job posting by ID
router.get('/jobs/:id', jobController.getJobById);

// Route to update a job posting by ID
router.put('/jobs/:id', jobController.updateJob);

// Route to delete a job posting by ID
router.delete('/jobs/:id', jobController.deleteJob);

// Route to analyze a job match
router.post('/jobs/analyze', jobController.analyzeJobMatch);

module.exports = router;