const { sendTemplatedEmail } = require('./emailService');
const { sendSMS, getSMSBody } = require('./smsService');
const NotificationLog = require('../models/NotificationLog');
const logger = require('../utils/logger');

/**
 * Dispatch a notification to a single recipient via all available channels.
 *
 * @param {object} options
 * @param {string}  options.eventType       - e.g. 'PAYMENT_SUCCESS'
 * @param {string}  [options.email]         - Recipient email address
 * @param {string}  [options.phone]         - Recipient phone (E.164)
 * @param {string}  options.role            - 'patient' | 'doctor' | 'admin'
 * @param {string}  [options.recipientId]   - Internal user ID
 * @param {object}  options.data            - Template variables
 * @param {string}  [options.referenceId]   - e.g. appointmentId or transactionId
 * @param {string}  [options.referenceType] - 'appointment' | 'transaction' | etc.
 * @returns {Promise<NotificationLog>}
 */
const dispatchNotification = async ({
  eventType,
  email,
  phone,
  role,
  recipientId,
  data,
  referenceId,
  referenceType,
}) => {
  const emailResult  = { sent: false, messageId: null, error: null };
  const smsResult    = { sent: false, messageSid: null, error: null };

  // ── Email ─────────────────────────────────────────────────────────────────
  if (email) {
    const result = await sendTemplatedEmail(email, eventType, data);
    emailResult.sent      = result.success;
    emailResult.messageId = result.messageId || null;
    emailResult.error     = result.error || null;
  }

  // ── SMS ───────────────────────────────────────────────────────────────────
  if (phone) {
    const smsBody  = getSMSBody(eventType, data);
    const result   = await sendSMS(phone, smsBody);
    smsResult.sent       = result.success;
    smsResult.messageSid = result.messageSid || null;
    smsResult.error      = result.error || null;
  }

  // ── Determine overall status ──────────────────────────────────────────────
  const bothFailed  = (email && !emailResult.sent) && (phone && !smsResult.sent);
  const anySuccess  = emailResult.sent || smsResult.sent;
  const status      = bothFailed ? 'failed' : anySuccess ? 'success' : 'partial';

  // ── Persist log ───────────────────────────────────────────────────────────
  let log = null;
  try {
    log = await NotificationLog.create({
      eventType,
      recipientEmail  : email  || null,
      recipientPhone  : phone  || null,
      recipientRole   : role,
      recipientId     : recipientId || null,
      channels        : { email: emailResult, sms: smsResult },
      referenceId     : referenceId   || null,
      referenceType   : referenceType || null,
      payload         : data,
      status,
    });
  } catch (error) {
    logger.error(`Failed to persist notification log: ${error.message}`);
  }

  logger.info(`Notification dispatched [${eventType}] → ${email || phone} | status: ${status}`);
  return log;
};

/**
 * Dispatch a notification to multiple recipients at once.
 *
 * @param {string}   eventType   - Notification type
 * @param {Array}    recipients  - Array of { email, phone, role, recipientId, data }
 * @param {string}   [referenceId]
 * @param {string}   [referenceType]
 */
const dispatchBulk = async (eventType, recipients, referenceId, referenceType) => {
  const results = await Promise.allSettled(
    recipients.map((r) =>
      dispatchNotification({
        eventType,
        email         : r.email,
        phone         : r.phone,
        role          : r.role,
        recipientId   : r.recipientId,
        data          : r.data,
        referenceId,
        referenceType,
      })
    )
  );
  return results;
};

module.exports = { dispatchNotification, dispatchBulk };
