const { validationResult }                    = require('express-validator');
const Transaction                             = require('../models/Transaction');
const Invoice                                 = require('../models/Invoice');
const { createPaymentIntent, retrievePaymentIntent } = require('../services/stripeService');
const logger                                  = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/create-intent
// Role: patient
// ─────────────────────────────────────────────────────────────────────────────
const createIntent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      appointmentId,
      doctorId,
      amount,            // integer cents, e.g. 5000 = $50.00
      currency = 'usd',
      metadata = {},
    } = req.body;

    const patientId = req.user.userId;

    // Guard: prevent double-payment for the same appointment
    const existing = await Transaction.findOne({
      appointmentId,
      status: { $in: ['pending', 'succeeded'] },
    });

    if (existing?.status === 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'This appointment has already been paid.',
      });
    }

    // Build Stripe metadata (passed through webhook back to us)
    const stripeMetadata = {
      appointmentId,
      patientId,
      doctorId,
      patientEmail: req.user.email  || '',
      doctorEmail : metadata.doctorEmail || '',
      ...metadata,
    };

    const paymentIntent = await createPaymentIntent({ amount, currency, metadata: stripeMetadata });

    // Persist a pending Transaction record
    const transaction = await Transaction.create({
      appointmentId,
      patientId,
      doctorId,
      stripePaymentIntentId: paymentIntent.id,
      amount,
      currency,
      status  : 'pending',
      metadata: {
        doctorName      : metadata.doctorName       || '',
        patientName     : req.user.name             || '',
        specialty       : metadata.specialty        || '',
        appointmentDate : metadata.appointmentDate  || '',
        consultationType: metadata.consultationType || 'telemedicine',
      },
    });

    logger.info(`PaymentIntent created for appointment ${appointmentId}: ${paymentIntent.id}`);

    res.status(201).json({
      success        : true,
      clientSecret   : paymentIntent.client_secret,
      transactionId  : transaction._id,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/:id
// Role: patient (own only), admin (any)
// ─────────────────────────────────────────────────────────────────────────────
const getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate('invoiceId');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    if (req.user.role === 'patient' && transaction.patientId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/history
// Role: patient — returns own payment history with pagination
// ─────────────────────────────────────────────────────────────────────────────
const getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { patientId: req.user.userId };
    if (status) query.status = status;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * Number(limit))
        .limit(Number(limit))
        .populate('invoiceId', 'invoiceNumber issuedAt status'),
      Transaction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data   : transactions,
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/admin/all
// Role: admin — all transactions with filters + aggregate stats
// ─────────────────────────────────────────────────────────────────────────────
const getAllTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, patientId, doctorId, startDate, endDate } = req.query;

    const query = {};
    if (status)    query.status    = status;
    if (patientId) query.patientId = patientId;
    if (doctorId)  query.doctorId  = doctorId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate)   query.createdAt.$lte = new Date(endDate);
    }

    const [transactions, total, stats] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * Number(limit))
        .limit(Number(limit)),
      Transaction.countDocuments(query),
      Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id        : '$status',
            count      : { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data   : transactions,
      stats,
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/appointment/:appointmentId
// Role: patient (own), doctor (own), admin
// ─────────────────────────────────────────────────────────────────────────────
const getPaymentByAppointment = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      appointmentId: req.params.appointmentId,
    }).populate('invoiceId', 'invoiceNumber status issuedAt');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'No payment found for this appointment.',
      });
    }

    if (req.user.role === 'patient' && transaction.patientId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/invoices/:transactionId
// Role: patient (own), admin
// Streams the stored PDF buffer as a downloadable file
// ─────────────────────────────────────────────────────────────────────────────
const downloadInvoice = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    if (req.user.role === 'patient' && transaction.patientId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const invoice = await Invoice.findOne({ transactionId: transaction._id });

    if (!invoice || !invoice.pdfBuffer) {
      return res.status(404).json({
        success: false,
        message: 'Invoice PDF not available yet. Please try again shortly.',
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoice.invoiceNumber}.pdf"`
    );
    res.send(invoice.pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createIntent,
  getTransaction,
  getPaymentHistory,
  getAllTransactions,
  getPaymentByAppointment,
  downloadInvoice,
};
