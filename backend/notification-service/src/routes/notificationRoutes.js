const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  handlePaymentNotification,
  handleRefundNotification,
  handleVerificationNotification,
  handleAccountNotification,
  getLogs,
  getMyLogs,
  handleManualNotification,
} = require('../controllers/notificationController');

// ── Internal service-to-service routes (no auth — secured by network/API key in prod) ──
// Called by payment-service webhook handler after payment.succeeded
router.post('/payment', handlePaymentNotification);

// Called by payment-service refund controller
router.post('/refund', handleRefundNotification);

// ── Verification notifications (called by auth-service) ────────────────────
router.post('/verify', handleVerificationNotification);

// ── Account notifications (called by auth-service) ─────────────────────────
router.post('/account', handleAccountNotification);

// ── Authenticated routes ──────────────────────────────────────────────────────
// Admin: view all notification logs
router.get('/logs', protect, authorize('admin'), getLogs);

// Admin: delete a specific log
router.delete('/logs/:id', protect, authorize('admin'), deleteLog);

// Admin: send manual notification
router.post('/manual', protect, authorize('admin'), handleManualNotification);

// Patient / Doctor: view own notification history
router.get('/logs/my', protect, authorize('patient', 'doctor'), getMyLogs);

module.exports = router;
