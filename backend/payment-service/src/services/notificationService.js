const axios = require('axios');
const logger = require('../utils/logger');

const NOTIFICATION_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5004';

/**
 * Notify patient and doctor after a successful payment.
 * Non-fatal: errors are logged but do NOT fail the payment flow.
 *
 * @param {object} options
 * @param {object} options.transaction  - Mongoose Transaction document
 * @param {string} options.patientEmail
 * @param {string} options.doctorEmail
 * @param {string} [options.patientPhone]
 * @param {string} [options.doctorPhone]
 */
const sendPaymentConfirmation = async ({
  transaction,
  patientEmail,
  doctorEmail,
  patientPhone,
  doctorPhone,
}) => {
  try {
    await axios.post(`${NOTIFICATION_URL}/api/notifications/payment`, {
      type: 'PAYMENT_SUCCESS',
      recipients: [
        {
          email: patientEmail,
          phone: patientPhone || null,
          role: 'patient',
          recipientId: transaction.patientId, // Added for dashboard notifications
          data: {
            patientName: transaction.metadata.patientName,
            doctorName: transaction.metadata.doctorName,
            amount: (transaction.amount / 100).toFixed(2),
            currency: transaction.currency.toUpperCase(),
            appointmentDate: transaction.metadata.appointmentDate,
            transactionId: transaction._id,
            invoiceNumber: transaction.invoiceId || 'Generating...',
          },
        },
        {
          email: doctorEmail,
          phone: doctorPhone || null,
          role: 'doctor',
          recipientId: transaction.doctorId, // Added for dashboard notifications
          data: {
            doctorName: transaction.metadata.doctorName,
            patientName: transaction.metadata.patientName,
            amount: (transaction.amount / 100).toFixed(2),
            currency: transaction.currency.toUpperCase(),
            appointmentDate: transaction.metadata.appointmentDate,
          },
        },
      ],
    });

    logger.info(`Payment confirmation notifications sent for transaction: ${transaction._id}`);
  } catch (error) {
    // Non-blocking — a notification failure must not undo a completed payment
    logger.error(`Failed to send payment confirmation notifications: ${error.message}`);
  }
};

/**
 * Notify patient after a successful refund.
 *
 * @param {object} options
 * @param {object} options.refund       - Mongoose Refund document
 * @param {object} options.transaction  - Mongoose Transaction document
 * @param {string} options.patientEmail
 * @param {string} [options.patientPhone]
 */
const sendRefundConfirmation = async ({
  refund,
  transaction,
  patientEmail,
  patientPhone,
}) => {
  try {
    await axios.post(`${NOTIFICATION_URL}/api/notifications/refund`, {
      type: 'REFUND_SUCCESS',
      recipients: [
        {
          email: patientEmail,
          phone: patientPhone || null,
          role: 'patient',
          data: {
            patientName: transaction.metadata.patientName,
            refundAmount: (refund.amount / 100).toFixed(2),
            currency: transaction.currency.toUpperCase(),
            refundId: refund._id,
            reason: refund.reason,
          },
        },
      ],
    });

    logger.info(`Refund confirmation notification sent for refund: ${refund._id}`);
  } catch (error) {
    logger.error(`Failed to send refund notification: ${error.message}`);
  }
};

module.exports = { sendPaymentConfirmation, sendRefundConfirmation };
