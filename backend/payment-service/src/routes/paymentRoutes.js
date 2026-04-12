const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createPayment,
  getTransaction,
  getPaymentHistory,
  getAllTransactions,
  getPaymentByAppointment,
  downloadInvoice,
} = require('../controllers/paymentController');

// ─── Validation rules ─────────────────────────────────────────────────────────
const createPaymentValidation = [
  body('appointmentId').notEmpty().withMessage('appointmentId is required'),
  body('doctorId').notEmpty().withMessage('doctorId is required'),
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('amount must be a positive number in LKR (e.g. 1500)'),
  body('currency')
    .optional()
    .isIn(['LKR'])
    .withMessage('Only LKR currency is supported'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// NOTE: PayHere webhook is mounted in app.js BEFORE express.json()

// Patient: initiate a PayHere payment for an appointment
router.post(
  '/create',
  protect,
  authorize('patient'),
  createPaymentValidation,
  createPayment
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
