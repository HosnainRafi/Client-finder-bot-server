module.exports = (app) => {
  const outreachController = require('../controllers/outreachController');

  const router = require('express').Router();

  // Route to send a cold email
  router.post('/send-email', outreachController.sendColdEmail);

  // Route to track outreach responses
  router.post('/track-response', outreachController.trackResponse);

  // Route to get outreach statistics
  router.get('/statistics', outreachController.getOutreachStatistics);

  app.use('/api/outreach', router);
};