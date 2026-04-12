const InAppNotification = require('../models/InAppNotification');
const { sendNotificationToUser } = require('../socket');
const { dispatchNotification } = require('./notificationDispatcher');
const logger = require('../utils/logger');

/**
 * Process events coming from RabbitMQ or internal triggers
 * @param {object} event - { eventType, recipientId, recipientRole, data, email, phone }
 */
const processIncomingEvent = async (event) => {
  const { eventType, recipientId, recipientRole, data, email, phone, referenceId } = event;

  try {
    // 1. Create In-App Notification (for the bell)
    const title = getTitle(eventType, data);
    const message = getMessage(eventType, data);

    const inAppNotif = await InAppNotification.create({
      recipientId,
      recipientRole,
      title,
      message,
      eventType,
      referenceId,
      link: getLink(eventType, referenceId)
    });

    // 2. Push to Socket (Real-time)
    sendNotificationToUser(recipientId, inAppNotif);

    // 3. Dispatch Email/SMS (as before)
    await dispatchNotification({
      eventType,
      email,
      phone,
      role: recipientRole,
      recipientId,
      data,
      referenceId,
      referenceType: getReferenceType(eventType)
    });

    logger.info(`Event processed and notification dispatched: ${eventType} for ${recipientId}`);
  } catch (err) {
    logger.error(`Error in processIncomingEvent: ${err.message}`);
    throw err;
  }
};

// Helper to determine titles based on event
const getTitle = (type) => {
  switch (type) {
    case 'APPOINTMENT_BOOKED': return 'New Appointment Booked';
    case 'APPOINTMENT_CONFIRMED': return 'Appointment Confirmed';
    case 'CONSULTATION_STARTED': return 'Consultation Started';
    case 'PRESCRIPTION_ISSUED': return 'New Prescription';
    case 'PAYMENT_SUCCESS': return 'Payment Successful';
    default: return 'Healthcare Update';
  }
};

const getMessage = (type, data) => {
  switch (type) {
    case 'APPOINTMENT_BOOKED': return `A new appointment has been scheduled for ${data.date} at ${data.time}.`;
    case 'CONSULTATION_STARTED': return `Dr. ${data.doctorName} is waiting for you in the virtual room.`;
    case 'PRESCRIPTION_ISSUED': return `You have a new prescription from Dr. ${data.doctorName}.`;
    default: return 'You have a new update in your CareNet portal.';
  }
};

const getLink = (type, refId) => {
  switch (type) {
    case 'APPOINTMENT_BOOKED': return `/dashboard/appointments/${refId}`;
    case 'PRESCRIPTION_ISSUED': return `/dashboard/prescriptions`;
    default: return '/dashboard';
  }
};

const getReferenceType = (type) => {
  if (type.startsWith('APPOINTMENT')) return 'appointment';
  if (type.startsWith('PAYMENT')) return 'transaction';
  if (type.startsWith('CONSULTATION')) return 'consultation';
  if (type === 'PRESCRIPTION_ISSUED') return 'prescription';
  return null;
};

module.exports = { processIncomingEvent };
