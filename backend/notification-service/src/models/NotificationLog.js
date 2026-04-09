const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema(
  {
    // What triggered this notification
    eventType: {
      type: String,
      enum: [
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'REFUND_SUCCESS',
        'APPOINTMENT_BOOKED',
        'APPOINTMENT_CONFIRMED',
        'APPOINTMENT_CANCELLED',
        'APPOINTMENT_REMINDER',
        'CONSULTATION_STARTED',
        'CONSULTATION_COMPLETED',
        'PRESCRIPTION_ISSUED',
      ],
      required: true,
      index: true,
    },

    // Who received it
    recipientEmail: { type: String, default: null },
    recipientPhone: { type: String, default: null },
    recipientRole: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      required: true,
    },
    recipientId: { type: String, default: null, index: true },

    // Channels used
    channels: {
      email: {
        sent: { type: Boolean, default: false },
        messageId: { type: String, default: null },
        error: { type: String, default: null },
      },
      sms: {
        sent: { type: Boolean, default: false },
        messageSid: { type: String, default: null },
        error: { type: String, default: null },
      },
    },

    // Reference IDs for traceability
    referenceId: { type: String, default: null },  // appointmentId / transactionId / etc.
    referenceType: {
      type: String,
      enum: ['appointment', 'transaction', 'refund', 'consultation', 'prescription'],
      default: null,
    },

    // Payload snapshot (for debugging/resend)
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Overall status
    status: {
      type: String,
      enum: ['success', 'partial', 'failed'],
      default: 'success',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
