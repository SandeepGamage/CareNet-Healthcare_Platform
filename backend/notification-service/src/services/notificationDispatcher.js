const { sendTemplatedEmail } = require('./emailService');
const { sendSMS, getSMSBody } = require('./smsService');
const NotificationLog = require('../models/NotificationLog');
const InAppNotification = require('../models/InAppNotification');
const { sendNotificationToUser } = require('../socket');
const logger = require('../utils/logger');

const getTitle = (type) => {
  switch (type) {
    case 'APPOINTMENT_BOOKED': return 'New Appointment Booked';
    case 'APPOINTMENT_CONFIRMED': return 'Appointment Confirmed';
    case 'CONSULTATION_STARTED': return 'Consultation Started';
    case 'CONSULTATION_COMPLETED': return 'Consultation Completed';
    case 'PRESCRIPTION_ISSUED': return 'New Prescription';
    case 'PAYMENT_SUCCESS': return 'Payment Successful';
    default: return 'Healthcare Update';
  }
};

const getMessage = (type, data) => {
  switch (type) {
    case 'APPOINTMENT_BOOKED': return `A new appointment has been scheduled for ${data?.appointmentDate || 'your selected date'}.`;
    case 'CONSULTATION_STARTED': return `Dr. ${data?.doctorName || ''} is waiting for you in the virtual room.`;
    case 'CONSULTATION_COMPLETED': return `Your telemedicine session with Dr. ${data?.doctorName || ''} has ended.`;
    case 'PRESCRIPTION_ISSUED': return `You have a new prescription from Dr. ${data?.doctorName || ''}.`;
    case 'PAYMENT_SUCCESS': return `Your payment of ${data?.currency || 'LKR'} ${data?.amount || ''} for Dr. ${data?.doctorName || ''} was successful. Your appointment is now waiting for approval.`;
    case 'PAYMENT_SUCCESS_DOCTOR': return `You have received a payment of ${data?.currency || 'LKR'} ${data?.amount || ''} from ${data?.patientName || 'a patient'}.`;
    default: return 'You have a new update in your CareNet portal.';
  }
};

const getLink = (type, refId) => {
  switch (type) {
    case 'APPOINTMENT_BOOKED': 
    case 'APPOINTMENT_CONFIRMED':
    case 'CONSULTATION_COMPLETED':
      return `/dashboard/appointments/${refId}`;
    case 'PRESCRIPTION_ISSUED': return `/dashboard/prescriptions`;
    case 'PAYMENT_SUCCESS': 
    case 'PAYMENT_SUCCESS_DOCTOR':
      return `/dashboard/payments`;
    default: return '/dashboard';
  }
};

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

  // ── 0. Create In-App Notification & Push to Socket ────────────────────────
  if (recipientId) {
    try {
      const inAppNotif = await InAppNotification.create({
        recipientId,
        recipientRole: role || 'patient',
        title: getTitle(eventType),
        message: getMessage(eventType, data),
        eventType,
        referenceId,
        link: getLink(eventType, referenceId)
      });
      // Emit to user's browser in real time
      sendNotificationToUser(recipientId, inAppNotif);
    } catch (err) {
      logger.error(`InAppNotification creation error: ${err.message}`);
    }
  }

  // ── Email ─────────────────────────────────────────────────────────────────
  if (email) {
    const result = await sendTemplatedEmail(email, eventType, data);
    emailResult.sent      = result.success;
    emailResult.messageId = result.messageId || null;
    emailResult.error     = result.error || null;
  }

  // ── SMS ───────────────────────────────────────────────────────────────────
  if (phone) {
    // User requested: "sms send when only doctor approved the appointment"
    const allowedSmsEvents = ['APPOINTMENT_CONFIRMED', 'VERIFICATION_CODE_SMS']; // VERIFICATION is needed for login if any
    
    if (allowedSmsEvents.includes(eventType)) {
      const smsBody  = getSMSBody(eventType, data);
      const result   = await sendSMS(phone, smsBody);
      smsResult.sent       = result.success;
      smsResult.messageSid = result.messageSid || null;
      smsResult.error      = result.error || null;
    } else {
      smsResult.sent = false;
      smsResult.error = 'SMS bypassed (only enabled for doctor approval)';
    }
  }

  // ── Determine overall status ──────────────────────────────────────────────
  const bothFailed  = (email && !emailResult.sent) && (phone && !smsResult.sent);
  const anySuccess  = emailResult.sent || smsResult.sent;
  const status      = bothFailed ? 'failed' : anySuccess ? 'success' : 'partial';

  // ── Persist log ───────────────────────────────────────────────────────────
  let log = null;
  try {
    const renderedMsg = eventType === 'MANUAL_MESSAGE' ? (data?.message || 'New update') : getMessage(eventType, data);
    const renderedSubject = (data?.subject || getTitle(eventType));
    const name = data?.patientName || data?.doctorName || data?.name || data?.recipientName || null;

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
      message         : renderedMsg,
      subject         : renderedSubject,
      recipientName   : name,
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
