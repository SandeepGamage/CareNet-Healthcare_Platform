const { validationResult }          = require('express-validator');
const Transaction                   = require('../models/Transaction');
const Refund                        = require('../models/Refund');
const { sendRefundConfirmation }    = require('../services/notificationService');
const logger                        = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/refunds
// Role: patient (own transactions only), admin (any)
// ─────────────────────────────────────────────────────────────────────────────
const requestRefund = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { transactionId, reason, amount, notes } = req.body;

    // ── 1. Fetch transaction ────────────────────────────────────────────────
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    // ── 2. Authorization ────────────────────────────────────────────────────
    if (req.user.role === 'patient' && transaction.patientId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // ── 3. Status guard ─────────────────────────────────────────────────────
    if (!['succeeded', 'partially_refunded'].includes(transaction.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot refund a transaction with status: ${transaction.status}`,
      });
    }

    // ── 4. Duplicate pending refund guard ───────────────────────────────────
    const pendingRefund = await Refund.findOne({ transactionId, status: 'pending' });
    if (pendingRefund) {
      return res.status(400).json({
        success: false,
        message: 'A refund is already pending for this transaction.',
      });
    }

    // ── 5. Amount validation ────────────────────────────────────────────────
    const refundAmount = amount ? Number(amount) : transaction.amount;
    if (refundAmount > transaction.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed the original transaction amount.',
      });
    }

    // ── 6. Create Refund record (pending) ───────────────────────────────────
    // NOTE: For the scope of this assignment using PayHere, refunds must be processed 
    // manually via the PayHere Merchant Portal. This creates a request for the admin.
    const refund = await Refund.create({
      transactionId,
      amount       : refundAmount,
      reason,
      notes,
      status       : 'pending',
      requestedBy  : { userId: req.user.userId, role: req.user.role },
    });

    // ── 7. Notify patient (non-blocking) ────────────────────────────────────
    try {
      await sendRefundConfirmation({
        refund,
        transaction,
        patientEmail: req.user.email,
      });
    } catch (err) {
      logger.error(`Refund notification failed: ${err.message}`);
    }

    logger.info(`Refund request ${refund._id} created for transaction ${transactionId} (Manual processing required via PayHere)`);

    res.status(201).json({
      success: true,
      message: 'Refund request submitted. An administrator will process it manually via PayHere.',
      data   : refund,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/refunds/:id
// Role: patient (own), admin
// ─────────────────────────────────────────────────────────────────────────────
const getRefund = async (req, res, next) => {
  try {
    const refund = await Refund.findById(req.params.id).populate('transactionId');

    if (!refund) {
      return res.status(404).json({ success: false, message: 'Refund not found.' });
    }

    const transaction = refund.transactionId;
    if (req.user.role === 'patient' && transaction.patientId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: refund });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/refunds/transaction/:transactionId
// Role: patient (own), admin
// ─────────────────────────────────────────────────────────────────────────────
const getRefundsByTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    if (req.user.role === 'patient' && transaction.patientId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const refunds = await Refund.find({ transactionId: req.params.transactionId })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: refunds });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/refunds/admin/all
// Role: admin — paginated list of all refunds
// ─────────────────────────────────────────────────────────────────────────────
const getAllRefunds = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const [refunds, total] = await Promise.all([
      Refund.find(query)
        .populate('transactionId', 'amount currency metadata patientId')
        .sort({ createdAt: -1 })
        .skip((page - 1) * Number(limit))
        .limit(Number(limit)),
      Refund.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data   : refunds,
      pagination: {
        total,
        page : Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { requestRefund, getRefund, getRefundsByTransaction, getAllRefunds };
