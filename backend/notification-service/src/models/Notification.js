const mongoose = require('mongoose');

/**
 * Notification Model
 * Stores a log of every notification sent (email or SMS).
 * Useful for re-sending, auditing, and admin dashboards.
 */
const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'APPOINTMENT_BOOKED',
        'APPOINTMENT_CANCELLED',
        'APPOINTMENT_REMINDER',
        'PAYMENT_SUCCESS',
        'REFUND_SUCCESS',
        'CONSULTATION_STARTED',
        'CONSULTATION_COMPLETED',
        'PRESCRIPTION_ISSUED',
        'GENERAL',
      ],
      required: true,
    },
    channel: {
      type: String,
      enum: ['email', 'sms', 'both'],
      required: true,
    },
    recipientEmail: {
      type: String,
      default: null,
    },
    recipientPhone: {
      type: String,
      default: null,
    },
    recipientRole: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      required: true,
    },
    subject: {
      type: String,
      default: null,
    },
    // Store the plain-text body for SMS / audit
    body: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
    },
    // Reference IDs from other services
    referenceId: {
      type: String,        // e.g. appointmentId, transactionId
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for quick lookups
notificationSchema.index({ recipientEmail: 1, type: 1, createdAt: -1 });
notificationSchema.index({ referenceId: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
