const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    logger.error(`Email transporter config error: ${error.message}`);
  } else {
    logger.info('Email transporter is ready');
  }
});

module.exports = transporter;
