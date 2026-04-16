const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getAppointmentById,
  updateStatus,
  cancelAppointment,
  getAllAppointments,
  getAvailableSlots,
  adminDeleteAppointment,
  updateAppointmentByPatient,
  deleteAppointmentByPatient
} = require('../controllers/appointmentController');

// Public-ish (still needs JWT, but any role)
router.get('/slots',   protect, getAvailableSlots);

// Admin only
router.get('/all',     protect, restrictTo('ADMIN'),   getAllAppointments);
router.delete('/admin/:id', protect, restrictTo('ADMIN'), adminDeleteAppointment);


// Doctor routes
router.get('/doctor',  protect, restrictTo('DOCTOR'),  getDoctorAppointments);

// Patient routes
router.post('/',       protect, restrictTo('PATIENT'), createAppointment);
router.get('/my',      protect, restrictTo('PATIENT'), getMyAppointments);
router.delete('/:id/patient', protect, restrictTo('PATIENT'), deleteAppointmentByPatient);
router.patch('/update/:id', protect, restrictTo('PATIENT'), updateAppointmentByPatient);


// Shared (patient + doctor + admin can view single)
router.get('/:id',     protect, getAppointmentById);

// Doctor updates status (confirm / complete / cancel)
router.patch('/:id/status', protect, restrictTo('DOCTOR', 'ADMIN'), updateStatus);

module.exports = router;