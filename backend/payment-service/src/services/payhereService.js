const axios = require('axios');
const logger = require('../utils/logger');

const PAYHERE_APP_ID = process.env.PAYHERE_APP_ID;
const PAYHERE_APP_SECRET = process.env.PAYHERE_APP_SECRET;
const IS_SANDBOX = process.env.NODE_ENV !== 'production';

const BASE_URL = IS_SANDBOX 
  ? 'https://sandbox.payhere.lk/merchant/v1' 
  : 'https://www.payhere.lk/merchant/v1';

/**
 * Get OAuth Access Token from PayHere
 */
const getAccessToken = async () => {
  try {
    if (!PAYHERE_APP_ID || !PAYHERE_APP_SECRET) {
      throw new Error('PayHere App ID or Secret missing in environment variables.');
    }

    // Base64 encode ID:Secret
    const auth = Buffer.from(`${PAYHERE_APP_ID}:${PAYHERE_APP_SECRET}`).toString('base64');

    const response = await axios.post(
      `${BASE_URL}/oauth/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data.access_token;
  } catch (error) {
    logger.error('PayHere OAuth Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Request a refund from PayHere
 * 
 * @param {string} paymentId - The PayHere Payment ID (from transaction)
 * @param {number} amount - Amount to refund
 * @param {string} reason - Reason for refund
 */
const refundPayment = async (paymentId, amount, reason) => {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.post(
      `${BASE_URL}/payment/refund`,
      {
        payment_id: paymentId,
        amount: amount,
        description: reason
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // PayHere response format: { status: 1, msg: 'Success', data: { refund_id: '...' } }
    if (response.data.status === 1) {
      logger.info(`PayHere Refund Successful: ${paymentId}`);
      return {
        success: true,
        refundId: response.data.data.refund_id,
        message: response.data.msg
      };
    } else {
      logger.warn(`PayHere Refund Declined: ${response.data.msg}`);
      return {
        success: false,
        message: response.data.msg
      };
    }
  } catch (error) {
    logger.error(`PayHere Refund API Error [${paymentId}]:`, error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.msg || error.message
    };
  }
};

module.exports = { refundPayment };
