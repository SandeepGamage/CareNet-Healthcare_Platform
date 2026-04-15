const express = require('express');
const router = express.Router();
const { register, login, getMe, getPendingDoctors, getAllDoctors, getVerifiedDoctors, approveDoctor, rejectDoctor, verifyOTP, resendOTP, deactivateAccount, getAllPatients, forgotPassword, resetPassword } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyOTP);
router.post('/verify-phone', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes – require valid JWT
router.get('/me', protect, getMe);
router.post('/deactivate', protect, deactivateAccount);

// Public-facing: list only approved doctors (any logged-in user, including patients)
router.get('/doctors/verified', protect, getVerifiedDoctors);

// Admin Action: Setup Routes to manage doctors
router.get('/admin/doctors', protect, authorize('admin'), getAllDoctors);
router.get('/admin/patients', protect, authorize('admin'), getAllPatients);
router.get('/admin/doctors/pending', protect, authorize('admin'), getPendingDoctors);
router.put('/admin/doctors/:id/verify', protect, authorize('admin'), approveDoctor);
router.delete('/admin/doctors/:id/reject', protect, authorize('admin'), rejectDoctor);

module.exports = router;

