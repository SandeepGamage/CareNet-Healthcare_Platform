const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema(
  {
    transactionId: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : 'Transaction',
      required: true,
      index   : true,
    },
    stripeRefundId: {
      type  : String,
      unique: true,
      sparse: true,
    },
    amount: {
      type    : Number,
      required: true,
      min     : 0,
      // in cents, same unit as Transaction.amount
    },
    reason: {
      type    : String,
      enum    : ['duplicate', 'fraudulent', 'requested_by_customer', 'appointment_cancelled', 'doctor_unavailable'],
      required: true,
    },
    status: {
      type   : String,
      enum   : ['pending', 'succeeded', 'failed', 'cancelled'],
      default: 'pending',
    },
    requestedBy: {
      userId: { type: String, required: true },
      role  : { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
    },
    notes      : { type: String, default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Refund', refundSchema);
