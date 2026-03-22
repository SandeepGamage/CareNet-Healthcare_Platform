// src/routes/appointmentRoutes.js
const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  getAllAppointments
} = require('../controllers/appointmentController');

// // Public-ish (still needs JWT, but any role)
// router.get('/slots',   protect, getAvailableSlots);

// // Patient routes
// router.post('/',       protect, restrictTo('PATIENT'), createAppointment);
// router.get('/my',      protect, restrictTo('PATIENT'), getMyAppointments);
// router.delete('/:id',  protect, restrictTo('PATIENT'), cancelAppointment);

// // Doctor routes
// router.get('/doctor',  protect, restrictTo('DOCTOR'),  getDoctorAppointments);

// // Shared (patient + doctor + admin can view single)
// router.get('/:id',     protect, getAppointmentById);

// // Doctor updates status (confirm / complete / cancel)
// router.patch('/:id/status', protect, restrictTo('DOCTOR', 'ADMIN'), updateStatus);

// Admin only
router.get('/all',     protect, restrictTo('ADMIN'),   getAllAppointments);

module.exports = router;