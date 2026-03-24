const twilioClient = require('../config/twilio');
const logger = require('../utils/logger');

/**
 * Send an SMS message via Twilio
 * @param {string} to      - Recipient phone number (E.164 format e.g. +94771234567)
 * @param {string} body    - SMS text body (max 160 chars for single segment)
 * @returns {Promise<{success, messageSid, error}>}
 */
const sendSMS = async (to, body) => {
  try {
    if (!twilioClient) {
      logger.warn('Twilio not configured — skipping SMS send');
      return { success: false, error: 'SMS not configured' };
    }

    if (!to || !to.startsWith('+')) {
      logger.warn(`Invalid phone number format: ${to} (must be E.164)`);
      return { success: false, error: 'Invalid phone number format' };
    }

    const message = await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      body,
    });

    logger.info(`SMS sent to ${to} | SID: ${message.sid}`);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    logger.error(`SMS send error to ${to}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Get SMS body for a given event type
 */
const getSMSBody = (eventType, data) => {
  switch (eventType) {
    case 'PAYMENT_SUCCESS':
      return `✅ Payment confirmed! ${data.currency} ${data.amount} for appointment with Dr. ${data.doctorName} on ${data.appointmentDate}. Ref: ${data.transactionId}`;

    case 'REFUND_SUCCESS':
      return `✅ Refund processed! ${data.currency} ${data.refundAmount} refunded to your account. Ref: ${data.refundId}`;

    case 'APPOINTMENT_BOOKED':
      return `📅 Appointment booked with Dr. ${data.doctorName} (${data.specialty}) on ${data.appointmentDate} at ${data.appointmentTime}. Ref: ${data.appointmentId}`;

    case 'APPOINTMENT_CONFIRMED':
      return `✅ Appointment confirmed! Dr. ${data.doctorName} confirmed your appointment on ${data.appointmentDate} at ${data.appointmentTime}.`;

    case 'APPOINTMENT_CANCELLED':
      return `❌ Appointment cancelled. Your appointment with Dr. ${data.doctorName} on ${data.appointmentDate} has been cancelled. ${data.reason ? 'Reason: ' + data.reason : ''}`;

    case 'APPOINTMENT_REMINDER':
      return `⏰ Reminder: Your telemedicine appointment with Dr. ${data.doctorName} is in 1 hour (${data.appointmentTime}). Join link: ${data.joinUrl || 'Check your email'}`;

    case 'CONSULTATION_STARTED':
      return `🎥 Your video consultation with Dr. ${data.doctorName} has started. Please join now: ${data.joinUrl}`;

    case 'CONSULTATION_COMPLETED':
      return `✅ Consultation completed with Dr. ${data.doctorName}. Your prescription has been issued. Check the app to view it.`;

    case 'PRESCRIPTION_ISSUED':
      return `💊 Dr. ${data.doctorName} has issued a prescription for you. Log in to view and download it.`;

    default:
      return `Healthcare Platform notification. Please check your email for details.`;
  }
};

module.exports = { sendSMS, getSMSBody };
