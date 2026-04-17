const twilio = require('twilio');
const logger = require('../utils/logger');

let client = null;

try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    logger.info('Twilio client initialised');
  } else {
    logger.warn('Twilio credentials not set — SMS notifications disabled');
  }
} catch (err) {
  logger.error(`Twilio init error: ${err.message}`);
}

module.exports = client;
