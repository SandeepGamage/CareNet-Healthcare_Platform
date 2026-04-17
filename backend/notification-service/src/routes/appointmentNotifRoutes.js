const express = require('express');
const router = express.Router();
const {
  notifyAppointmentBooked,
  notifyAppointmentConfirmed,
  notifyAppointmentCancelled,
  notifyAppointmentReminder,
  notifyPrescriptionIssued,
  notifyConsultationCompleted,
} = require('../controllers/appointmentNotifController');



// New appointment created
router.post('/booked', notifyAppointmentBooked);

// Doctor confirmed appointment
router.post('/confirmed', notifyAppointmentConfirmed);

// Appointment cancelled (by patient/doctor/admin)
router.post('/cancelled', notifyAppointmentCancelled);

// Reminder 1 hour before session (called by scheduler)
router.post('/reminder', notifyAppointmentReminder);

// Doctor issued prescription
router.post('/prescription', notifyPrescriptionIssued);

// Telemedicine session ended
router.post('/consultation-completed', notifyConsultationCompleted);

module.exports = router;
