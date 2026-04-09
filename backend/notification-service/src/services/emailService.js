const transporter = require('../config/mailer');
const logger = require('../utils/logger');
const { getEmailTemplate } = require('../templates/emailTemplates');

/**
 * Send a single email
 * @param {object} options
 * @param {string} options.to          - Recipient email
 * @param {string} options.subject     - Email subject
 * @param {string} options.html        - HTML body
 * @param {string} [options.text]      - Plain text fallback
 * @returns {Promise<{success, messageId, error}>}
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.EMAIL_USER) {
      logger.warn('EMAIL_USER not set — skipping email send');
      return { success: false, error: 'Email not configured' };
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `Healthcare Platform <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''), // strip tags as fallback
    });

    logger.info(`Email sent to ${to} | messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Email send error to ${to}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Send a templated email using a named template
 * @param {string} to          - Recipient email
 * @param {string} eventType   - Template key (e.g. 'PAYMENT_SUCCESS')
 * @param {object} data        - Template variables
 */
const sendTemplatedEmail = async (to, eventType, data) => {
  const template = getEmailTemplate(eventType, data);
  if (!template) {
    logger.warn(`No email template found for event: ${eventType}`);
    return { success: false, error: 'Template not found' };
  }
  return sendEmail({ to, subject: template.subject, html: template.html });
};

module.exports = { sendEmail, sendTemplatedEmail };
