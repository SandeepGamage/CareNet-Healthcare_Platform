const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type    : String,
      required: [true, 'Appointment ID is required'],
      index   : true,
    },
    patientId: {
      type    : String,
      required: [true, 'Patient ID is required'],
      index   : true,
    },
    doctorId: {
      type    : String,
      required: [true, 'Doctor ID is required'],
    },
    payhereOrderId: {
      type    : String,
      required: true,
      unique  : true,
    },
    paymentId: {
      type   : String,
      default: null,
    },
    amount: {
      type    : Number,
      required: [true, 'Amount is required'],
      min     : [0, 'Amount must be positive'],
    },
    currency: {
      type    : String,
      required: true,
      default : 'lkr',
      lowercase: true,
    },
    status: {
      type   : String,
      enum   : ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type   : String,
      default: 'card',
    },
    metadata: {
      doctorName      : String,
      patientName     : String,
      patientEmail    : String,
      specialty       : String,
      appointmentDate : String,
      consultationType: { type: String, default: 'telemedicine' },
    },
    failureReason: {
      type   : String,
      default: null,
    },
    invoiceId: {
      type   : mongoose.Schema.Types.ObjectId,
      ref    : 'Invoice',
      default: null,
    },
  },
  { timestamps: true }
);

// Ensure virtuals are included in JSON output
transactionSchema.set('toJSON', { virtuals: true });
transactionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Transaction', transactionSchema);
