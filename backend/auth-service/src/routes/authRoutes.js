const express = require('express');
const router = express.Router();
const { register, login, getMe, getPendingDoctors, approveDoctor } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes – require valid JWT
router.get('/me', protect, getMe);

// Admin Action: Setup Routes to manage doctors
router.get('/admin/doctors/pending', protect, authorize('admin'), getPendingDoctors);
router.put('/admin/doctors/:id/verify', protect, authorize('admin'), approveDoctor);

module.exports = router;
