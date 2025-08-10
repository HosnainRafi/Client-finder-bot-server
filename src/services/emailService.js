// This file handles the logic for sending emails, including formatting and delivery.

const nodemailer = require('nodemailer');
const { logger } = require('../config/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to, subject, text, html) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent: %s', info.messageId);
      return info;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw new Error('Email sending failed');
    }
  }
}

module.exports = new EmailService();