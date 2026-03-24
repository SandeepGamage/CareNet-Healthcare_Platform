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
    stripePaymentIntentId: {
      type    : String,
      required: true,
      unique  : true,
    },
    stripeChargeId: {
      type   : String,
      default: null,
    },
    amount: {
      type    : Number,
      required: [true, 'Amount is required'],
      min     : [0, 'Amount must be positive'],
      // Stored in smallest currency unit (cents)
    },
    currency: {
      type    : String,
      required: true,
      default : 'usd',
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

// Virtual: amount in dollars
transactionSchema.virtual('amountInDollars').get(function () {
  return (this.amount / 100).toFixed(2);
});

transactionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Transaction', transactionSchema);
