const https = require('https');
const logger = require('../utils/logger');

/**
 * Send an SMS message via Text.lk API
 * @param {string} to      - Recipient phone number format (e.g. +94771234567)
 * @param {string} body    - SMS text body
 * @returns {Promise<{success, messageSid, error}>}
 */
const sendSMS = (to, body) => {
  return new Promise((resolve) => {
    try {
      const token = process.env.TEXTLK_API_TOKEN;
      const sender_id = process.env.TEXTLK_SENDER_ID || 'TextLKDemo';
      
      if (!token) {
        logger.warn('Text.lk API Token not configured - skipping SMS send');
        return resolve({ success: false, error: 'Text.lk API Token missing' });
      }

      // Format number to numbers only as Text.lk commonly expects e.g. 94769139719 without '+'
      const formattedNumber = to.replace(/\D/g, ''); 

      const postData = JSON.stringify({
        recipient: formattedNumber,
        sender_id: sender_id,
        message: body
      });

      const options = {
        hostname: 'app.text.lk',
        path: '/api/v3/sms/send',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(rawData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              logger.info(`SMS sent to ${formattedNumber} via Text.lk`);
              resolve({ success: true, messageSid: 'OK' });
            } else {
              logger.error(`Text.lk Error: ${rawData}`);
              resolve({ success: false, error: data.message || 'API Error' });
            }
          } catch (e) {
            resolve({ success: false, error: 'Failed to parse Text.lk response' });
          }
        });
      });

      req.on('error', (e) => {
        logger.error(`Text.lk API Request Failed: ${e.message}`);
        resolve({ success: false, error: e.message });
      });

      req.write(postData);
      req.end();

    } catch (error) {
      logger.error(`Code execution error in sendSMS: ${error.message}`);
      resolve({ success: false, error: error.message });
    }
  });
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

    case 'APPOINTMENT_BOOKED_DOCTOR':
      return `📅 New Appointment Request! ${data.patientName} has requested a consultation on ${data.appointmentDate} at ${data.appointmentTime}. Please log in to confirm.`;

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

    case 'CONSULTATION_COMPLETED_DOCTOR':
      return `✅ Consultation with ${data.patientName} completed. Duration: ${data.duration || 'N/A'}. Thank you for your service!`;

    case 'PRESCRIPTION_ISSUED':
      return `💊 Dr. ${data.doctorName} has issued a prescription for you. Log in to view and download it.`;

    default:
      return `Healthcare Platform notification. Please check your email for details.`;
  }
};

module.exports = { sendSMS, getSMSBody };
