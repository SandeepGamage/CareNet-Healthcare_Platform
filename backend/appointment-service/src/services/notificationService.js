const axios = require('axios');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006';

/**
 * Common function to send notifications via REST API
 */
const sendNotification = async (path, payload) => {
  try {
    const url = `${NOTIFICATION_SERVICE_URL}/api/notifications/appointments${path}`;
    const response = await axios.post(url, payload);
    return response.data;
  } catch (error) {
    console.error(`Notification Error [${path}]:`, error.response?.data || error.message);
    return null;
  }
};

/**
 * Notify when an appointment is booked
 */
exports.notifyAppointmentBooked = async (appointment, patientPhone = null) => {
  return sendNotification('/booked', {
    patientEmail: appointment.patientEmail,
    patientPhone: patientPhone,
    patientId:    appointment.patientId,
    patientName:  appointment.patientName,
    doctorName:   appointment.doctorName,
    specialty:    appointment.specialty,
    appointmentDate: appointment.appointmentDate.toDateString(),
    appointmentTime: appointment.timeSlot,
    appointmentId:   appointment.appointmentId,
    consultationType: appointment.type
  });
};

/**
 * Notify when an appointment is confirmed (Accepted by doctor)
 */
exports.notifyAppointmentConfirmed = async (appointment, patientPhone = null) => {
  return sendNotification('/confirmed', {
    patientEmail: appointment.patientEmail,
    patientPhone: patientPhone,
    patientId:    appointment.patientId,
    patientName:  appointment.patientName,
    doctorName:   appointment.doctorName,
    appointmentDate: appointment.appointmentDate.toDateString(),
    appointmentTime: appointment.timeSlot,
    appointmentId:   appointment.appointmentId,
    joinUrl:         appointment.meetingLink
  });
};

/**
 * Notify when an appointment is cancelled
 */
exports.notifyAppointmentCancelled = async (appointment, patientPhone = null, cancelledBy, reason) => {
  return sendNotification('/cancelled', {
    patientEmail: appointment.patientEmail,
    patientPhone: patientPhone,
    patientId:    appointment.patientId,
    patientName:  appointment.patientName,
    doctorName:   appointment.doctorName,
    appointmentDate: appointment.appointmentDate.toDateString(),
    appointmentId:   appointment.appointmentId,
    cancelledBy,
    reason
  });
};
