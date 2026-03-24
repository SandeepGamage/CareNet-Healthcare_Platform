const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  handlePaymentNotification,
  handleRefundNotification,
  getLogs,
  getMyLogs,
} = require('../controllers/notificationController');

// ── Internal service-to-service routes (no auth — secured by network/API key in prod) ──
// Called by payment-service webhook handler after payment.succeeded
router.post('/payment', handlePaymentNotification);

// Called by payment-service refund controller
router.post('/refund', handleRefundNotification);

// ── Authenticated routes ──────────────────────────────────────────────────────
// Admin: view all notification logs
router.get('/logs', protect, authorize('admin'), getLogs);

// Patient / Doctor: view own notification history
router.get('/logs/my', protect, authorize('patient', 'doctor'), getMyLogs);

module.exports = router;
