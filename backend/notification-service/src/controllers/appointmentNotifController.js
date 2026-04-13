const { dispatchNotification } = require('../services/notificationDispatcher');
const logger = require('../utils/logger');

/**
 * POST /api/notifications/appointments/booked
 * Called by appointment-service when a new appointment is created
 *
 * Body: {
 *   patientEmail, patientPhone, patientId, patientName,
 *   doctorEmail,  doctorPhone,  doctorId,  doctorName,
 *   specialty, appointmentDate, appointmentTime, appointmentId, consultationType,
 *   joinUrl (optional)
 * }
 */
const notifyAppointmentBooked = async (req, res, next) => {
  try {
    const {
      patientEmail, patientPhone, patientId, patientName,
      doctorEmail,  doctorPhone,  doctorId,  doctorName,
      specialty, appointmentDate, appointmentTime,
      appointmentId, consultationType, joinUrl,
    } = req.body;

    const sharedData = {
      patientName, doctorName, specialty,
      appointmentDate, appointmentTime,
      appointmentId, consultationType, joinUrl,
    };

    // Notify patient
    dispatchNotification({
      eventType     : 'APPOINTMENT_BOOKED',
      email         : patientEmail,
      phone         : patientPhone,
      role          : 'patient',
      recipientId   : patientId,
      data          : sharedData,
      referenceId   : appointmentId,
      referenceType : 'appointment',
    }).catch((e) => logger.error(`Patient booking notif error: ${e.message}`));

    // Notify doctor
    dispatchNotification({
      eventType     : 'APPOINTMENT_BOOKED_DOCTOR',
      email         : doctorEmail,
      phone         : doctorPhone,
      role          : 'doctor',
      recipientId   : doctorId,
      data          : { ...sharedData, patientName },
      referenceId   : appointmentId,
      referenceType : 'appointment',
    }).catch((e) => logger.error(`Doctor booking notif error: ${e.message}`));

    res.status(202).json({ success: true, message: 'Appointment booked notifications queued' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/appointments/confirmed
 * Called when a doctor confirms an appointment
 */
const notifyAppointmentConfirmed = async (req, res, next) => {
  try {
    const {
      patientEmail, patientPhone, patientId, patientName,
      doctorName, appointmentDate, appointmentTime,
      appointmentId, joinUrl,
    } = req.body;

    dispatchNotification({
      eventType     : 'APPOINTMENT_CONFIRMED',
      email         : patientEmail,
      phone         : patientPhone,
      role          : 'patient',
      recipientId   : patientId,
      data          : { patientName, doctorName, appointmentDate, appointmentTime, joinUrl },
      referenceId   : appointmentId,
      referenceType : 'appointment',
    }).catch((e) => logger.error(`Confirm notif error: ${e.message}`));

    res.status(202).json({ success: true, message: 'Confirmation notification queued' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/appointments/cancelled
 * Called when an appointment is cancelled by patient, doctor, or admin
 */
const notifyAppointmentCancelled = async (req, res, next) => {
  try {
    const {
      patientEmail, patientPhone, patientId, patientName,
      doctorEmail,  doctorPhone,  doctorId,  doctorName,
      appointmentDate, appointmentId, cancelledBy, reason, refundMessage,
    } = req.body;

    const sharedData = {
      patientName, doctorName, appointmentDate,
      cancelledBy, reason, refundMessage,
    };

    // Notify patient
    dispatchNotification({
      eventType     : 'APPOINTMENT_CANCELLED',
      email         : patientEmail,
      phone         : patientPhone,
      role          : 'patient',
      recipientId   : patientId,
      data          : sharedData,
      referenceId   : appointmentId,
      referenceType : 'appointment',
    }).catch((e) => logger.error(e.message));

    // Notify doctor (only if not the one who cancelled)
    if (cancelledBy !== 'doctor') {
      dispatchNotification({
        eventType     : 'APPOINTMENT_CANCELLED',
        email         : doctorEmail,
        phone         : doctorPhone,
        role          : 'doctor',
        recipientId   : doctorId,
        data          : sharedData,
        referenceId   : appointmentId,
        referenceType : 'appointment',
      }).catch((e) => logger.error(e.message));
    }

    res.status(202).json({ success: true, message: 'Cancellation notifications queued' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/appointments/reminder
 * Called by a scheduler 1 hour before the appointment
 */
const notifyAppointmentReminder = async (req, res, next) => {
  try {
    const {
      patientEmail, patientPhone, patientId, patientName,
      doctorName, appointmentTime, appointmentId, joinUrl,
    } = req.body;

    dispatchNotification({
      eventType     : 'APPOINTMENT_REMINDER',
      email         : patientEmail,
      phone         : patientPhone,
      role          : 'patient',
      recipientId   : patientId,
      data          : { patientName, doctorName, appointmentTime, joinUrl },
      referenceId   : appointmentId,
      referenceType : 'appointment',
    }).catch((e) => logger.error(e.message));

    res.status(202).json({ success: true, message: 'Reminder notification queued' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/appointments/prescription
 * Called when doctor issues a digital prescription
 */
const notifyPrescriptionIssued = async (req, res, next) => {
  try {
    const {
      patientEmail, patientPhone, patientId, patientName,
      doctorName, prescriptionId, issuedDate, appointmentId,
    } = req.body;

    dispatchNotification({
      eventType     : 'PRESCRIPTION_ISSUED',
      email         : patientEmail,
      phone         : patientPhone,
      role          : 'patient',
      recipientId   : patientId,
      data          : { patientName, doctorName, prescriptionId, issuedDate },
      referenceId   : appointmentId,
      referenceType : 'prescription',
    }).catch((e) => logger.error(e.message));

    res.status(202).json({ success: true, message: 'Prescription notification queued' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/appointments/consultation-completed
 * Called when a telemedicine session ends
 */
const notifyConsultationCompleted = async (req, res, next) => {
  try {
    const {
      patientEmail, patientPhone, patientId, patientName,
      doctorEmail, doctorPhone, doctorId, doctorName,
      appointmentDate, duration, appointmentId,
    } = req.body;

    const sharedData = { patientName, doctorName, appointmentDate, duration };

    // Notify patient
    dispatchNotification({
      eventType     : 'CONSULTATION_COMPLETED',
      email         : patientEmail,
      phone         : patientPhone,
      role          : 'patient',
      recipientId   : patientId,
      data          : sharedData,
      referenceId   : appointmentId,
      referenceType : 'consultation',
    }).catch((e) => logger.error(`Patient consultation completion notif error: ${e.message}`));

    // Notify doctor
    dispatchNotification({
      eventType     : 'CONSULTATION_COMPLETED_DOCTOR',
      email         : doctorEmail,
      phone         : doctorPhone,
      role          : 'doctor',
      recipientId   : doctorId,
      data          : sharedData,
      referenceId   : appointmentId,
      referenceType : 'consultation',
    }).catch((e) => logger.error(`Doctor consultation completion notif error: ${e.message}`));

    res.status(202).json({ success: true, message: 'Consultation completed notifications queued' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  notifyAppointmentBooked,
  notifyAppointmentConfirmed,
  notifyAppointmentCancelled,
  notifyAppointmentReminder,
  notifyPrescriptionIssued,
  notifyConsultationCompleted,
};
