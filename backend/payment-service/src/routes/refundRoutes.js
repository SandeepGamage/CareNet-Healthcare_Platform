const express = require('express');
const router  = express.Router();
const { body, param } = require('express-validator');

const { protect, authorize } = require('../middleware/authMiddleware');
const {
  requestRefund,
  getRefund,
  getRefundsByTransaction,
  getAllRefunds,
  createAutomaticRefund,
} = require('../controllers/refundController');

// ─── Validation rules ─────────────────────────────────────────────────────────
const refundValidation = [
  body('transactionId')
    .isMongoId()
    .withMessage('Invalid transactionId'),
  body('reason')
    .isIn([
      'duplicate',
      'fraudulent',
      'requested_by_customer',
      'appointment_cancelled',
      'doctor_unavailable',
    ])
    .withMessage('Invalid refund reason'),
  body('amount')
    .optional()
    .isInt({ min: 1 })
    .withMessage('amount must be a positive integer in cents'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('notes must be 500 characters or fewer'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// Patient / Admin: request a refund
router.post('/', protect, authorize('patient', 'admin'), refundValidation, requestRefund);

// Internal: automated refund request (called by other services)
router.post('/auto-request', protect, authorize('doctor', 'admin'), createAutomaticRefund);

// Admin: all refunds (paginated, filterable by status)
router.get('/admin/all', protect, authorize('admin'), getAllRefunds);

// Patient / Admin: all refunds for a specific transaction
router.get(
  '/transaction/:transactionId',
  protect,
  authorize('patient', 'admin'),
  [param('transactionId').isMongoId().withMessage('Invalid transaction ID')],
  getRefundsByTransaction
);

// Patient / Admin: single refund by ID
router.get(
  '/:id',
  protect,
  authorize('patient', 'admin'),
  [param('id').isMongoId().withMessage('Invalid refund ID')],
  getRefund
);

module.exports = router;
