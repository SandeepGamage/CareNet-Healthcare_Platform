const { validationResult } = require('express-validator');
const crypto               = require('crypto');
const Transaction          = require('../models/Transaction');
const Invoice              = require('../models/Invoice');
const logger               = require('../utils/logger');
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/create
// Role: patient
// Creates a pending Transaction record and returns PayHere checkout details
// ─────────────────────────────────────────────────────────────────────────────
const createPayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation Errors:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    console.log('Payment Request Body:', req.body);
    console.log('Authorized User:', req.user);

    const {
      appointmentId,
      doctorId,
      amount,           // amount in LKR, e.g. 1500
      currency = 'LKR',
      metadata = {},
    } = req.body;

    const patientId = req.user.id || req.user.userId;

    // Atomic Upsert: Find and update OR create a new pending transaction
    const transaction = await Transaction.findOneAndUpdate(
      { appointmentId },
      {
        $setOnInsert: {
          payhereOrderId: appointmentId,
          patientId,
          currency: currency.toUpperCase(),
          status: 'pending',
        },
        $set: {
          doctorId,
          amount: parseFloat(amount),
          metadata: {
            doctorName: metadata.doctorName || '',
            patientName: req.user.name || '',
            patientEmail: req.user.email || '',
            specialty: metadata.specialty || '',
            appointmentDate: metadata.appointmentDate || '',
            consultationType: metadata.consultationType || 'telemedicine',
          },
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Generate PayHere MD5 Hash
    // Formula: md5(merchant_id + order_id + amount_formatted + currency + md5(secret).toUpperCase()).toUpperCase()
    const merchantId     = process.env.PAYHERE_MERCHANT_ID?.trim();
    let merchantSecret   = (process.env.PAYHERE_SECRET || process.env.PAYHERE_MERCHANT_SECRET)?.trim();
    
    // If the secret looks like it might be Base64-encoded, we keep it as is 
    // because PayHere often uses alphanumeric strings that look like Base64.
    // We just ensure there are no hidden spaces/newlines.

    if (!merchantId || !merchantSecret) {
      logger.error('PayHere credentials missing in environment variables');
      return res.status(500).json({ 
        success: false, 
        message: 'Payment gateway configuration error. Check server logs.' 
      });
    }

    const amountFormatted = parseFloat(amount).toFixed(2);
    const upperCurrency   = currency.toUpperCase();
    
    // Step 1: MD5 of Merchant Secret
    const hashedSecret   = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    
    // Step 2: MD5(merchant_id + order_id + amount_formatted + currency + hashedSecret)
    const hashInput      = `${merchantId}${appointmentId}${amountFormatted}${upperCurrency}${hashedSecret}`;
    const hash           = crypto.createHash('md5').update(hashInput).digest('hex').toUpperCase();

    // DEBUG: Log the hash input (partially masked) to verify formatting
    const maskedHashInput = `${merchantId}${appointmentId}${amountFormatted}${upperCurrency}${hashedSecret.substring(0, 4)}...`;
    logger.info(`[DEBUG] PayHere Hash Input (Masked): ${maskedHashInput}`);

    logger.info(`PayHere payment initiated for appointment ${appointmentId} (Amount: ${amountFormatted} ${upperCurrency})`);

    // Return PayHere checkout details to the frontend
    res.status(201).json({
      success       : true,
      transactionId : transaction._id,
      merchantId,
      orderId       : appointmentId,
      amount        : amountFormatted,
      currency      : upperCurrency,
      hash,
      checkoutUrl   : 'https://sandbox.payhere.lk/pay/checkout',
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

    if (req.user.role === 'patient' && transaction.patientId !== (req.user.id || req.user.userId)) {
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
    const query = { patientId: (req.user.id || req.user.userId) };
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

    if (req.user.role === 'patient' && transaction.patientId !== (req.user.id || req.user.userId)) {
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

    if (req.user.role === 'patient' && transaction.patientId !== (req.user.id || req.user.userId)) {
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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/verify-local
// Role: any (local dev only)
// Simulates the PayHere webhook success locally.
// ─────────────────────────────────────────────────────────────────────────────
const verifyLocalPayment = async (req, res, next) => {
  try {
    // if (process.env.NODE_ENV === 'production') {
    //   return res.status(403).json({ success: false, message: 'Endpoint disabled in production.' });
    // }

    const { appointmentId } = req.body;
    
    const transaction = await Transaction.findOne({ appointmentId });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    if (transaction.status !== 'succeeded') {
      transaction.status = 'succeeded';
      transaction.payhereOrderId = `${appointmentId}_LOCAL`;
      await transaction.save();

      // Trigger invoice and notification precisely as the webhook does
      try {
        const { createInvoice } = require('../services/invoiceService');
        const invoice = await createInvoice(transaction);
        transaction.invoiceId = invoice._id;
        await transaction.save();
      } catch (err) {
        logger.error(`Local Invoice generation failed: ${err.message}`);
      }

      try {
        const { sendPaymentConfirmation } = require('../services/notificationService');
        await sendPaymentConfirmation({ 
          transaction,
          patientEmail: transaction.metadata.patientEmail,
        });
      } catch (err) {
        logger.error(`Local Notification failed: ${err.message}`);
      }
    }

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  getTransaction,
  getPaymentHistory,
  getAllTransactions,
  getPaymentByAppointment,
  downloadInvoice,
  verifyLocalPayment,
};
