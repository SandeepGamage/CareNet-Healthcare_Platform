const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    transactionId: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : 'Transaction',
      required: true,
    },
    patientId: {
      type    : String,
      required: true,
      index   : true,
    },
    invoiceNumber: {
      type    : String,
      unique  : true,
      required: true,
    },
    lineItems: [
      {
        description: { type: String, required: true },
        quantity   : { type: Number, default: 1 },
        unitPrice  : { type: Number, required: true },  // in cents
        total      : { type: Number, required: true },  // in cents
      },
    ],
    subtotal   : { type: Number, required: true },  // in cents
    tax        : { type: Number, default: 0 },      // in cents
    totalAmount: { type: Number, required: true },  // in cents
    currency   : { type: String, default: 'usd' },
    status: {
      type   : String,
      enum   : ['draft', 'issued', 'paid', 'void'],
      default: 'issued',
    },
    billingDetails: {
      patientName: String,
      email      : String,
      address    : String,
    },
    doctorDetails: {
      name     : String,
      specialty: String,
    },
    appointmentDate: String,
    pdfBuffer      : Buffer,
    issuedAt       : { type: Date, default: Date.now },
    dueDate        : Date,
  },
  { timestamps: true }
);

// Auto-generate invoice number before save
invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    const year  = new Date().getFullYear();
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
