const axios = require('axios');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005';

/**
 * Trigger an automatic refund request in the payment-service
 * 
 * @param {string} appointmentId - The ID of the cancelled appointment
 * @param {string} token - The authorization token of the actor (doctor)
 * @param {string} reason - The reason for cancellation
 */
exports.initiateRefund = async (appointmentId, token, reason = 'appointment_cancelled') => {
  try {
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/refunds/auto-request`,
      {
        appointmentId,
        reason,
        notes: `Refund initiated due to appointment rejection by doctor.`
      },
      {
        headers: { Authorization: token }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Refund Trigger Error [${appointmentId}]:`, error.response?.data || error.message);
    return null;
  }
};
