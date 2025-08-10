class OutreachController {
  constructor(emailService, aiService) {
    this.emailService = emailService;
    this.aiService = aiService;
  }

  async sendColdEmail(req, res) {
    try {
      const { clientInfo, emailType } = req.body;
      const emailData = await this.aiService.generatePersonalizedEmail(clientInfo, emailType);
      const response = await this.emailService.sendEmail(emailData);
      
      res.status(200).json({
        message: 'Cold email sent successfully',
        response,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to send cold email',
        error: error.message,
      });
    }
  }

  async trackResponse(req, res) {
    try {
      const { outreachId, responseData } = req.body;
      // Logic to track the response based on outreachId
      // This could involve updating the Outreach model in the database

      res.status(200).json({
        message: 'Response tracked successfully',
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to track response',
        error: error.message,
      });
    }
  }
}

module.exports = OutreachController;