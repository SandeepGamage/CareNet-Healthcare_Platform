const express = require('express');
const router  = express.Router();
const { body, param } = require('express-validator');

const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createIntent,
  getTransaction,
  getPaymentHistory,
  getAllTransactions,
  getPaymentByAppointment,
  downloadInvoice,
} = require('../controllers/paymentController');

// ─── Validation rules ─────────────────────────────────────────────────────────
const createIntentValidation = [
  body('appointmentId').notEmpty().withMessage('appointmentId is required'),
  body('doctorId').notEmpty().withMessage('doctorId is required'),
  body('amount')
    .isInt({ min: 100 })
    .withMessage('amount must be an integer in cents (min 100 = $1.00)'),
  body('currency')
    .optional()
    .isIn(['usd', 'lkr', 'eur', 'gbp'])
    .withMessage('Invalid currency'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// NOTE: Stripe webhook is mounted in app.js BEFORE express.json(), not here.

// Patient: create a Stripe PaymentIntent for an appointment
router.post(
  '/create-intent',
  protect,
  authorize('patient'),
  createIntentValidation,
  createIntent
);

// Patient: own payment history (paginated)
router.get('/history', protect, authorize('patient'), getPaymentHistory);

// Admin: all transactions with filters + stats
router.get('/admin/all', protect, authorize('admin'), getAllTransactions);

// Patient / Doctor / Admin: payment status for a specific appointment
router.get(
  '/appointment/:appointmentId',
  protect,
  authorize('patient', 'doctor', 'admin'),
  getPaymentByAppointment
);

// Patient / Admin: download PDF invoice
router.get(
  '/invoices/:transactionId',
  protect,
  authorize('patient', 'admin'),
  [param('transactionId').isMongoId().withMessage('Invalid transaction ID')],
  downloadInvoice
);

// Patient / Admin: single transaction by ID  (must be last — catches /:id)
router.get(
  '/:id',
  protect,
  authorize('patient', 'admin'),
  [param('id').isMongoId().withMessage('Invalid transaction ID')],
  getTransaction
);

module.exports = router;
