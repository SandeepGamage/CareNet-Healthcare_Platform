const mongoose = require('mongoose');

/**
 * InAppNotification Model
 * Stores notifications displayed in the dashboard bell.
 */
const inAppNotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    eventType: {
      type: String,
      enum: [
        'APPOINTMENT_BOOKED',
        'APPOINTMENT_CANCELLED',
        'APPOINTMENT_CONFIRMED',
        'PAYMENT_SUCCESS',
        'CONSULTATION_STARTED',
        'CONSULTATION_COMPLETED',
        'PRESCRIPTION_ISSUED',
        'SYSTEM_ALERT'
      ],
      required: true,
    },
    referenceId: {
      type: String, // e.g. appointmentId
      default: null,
    },
    link: {
      type: String, // UI route to navigate e.g. /dashboard/appointments/123
      default: null,
    }
  },
  { timestamps: true }
);

// Index for fetching unread notifications quickly
inAppNotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('InAppNotification', inAppNotificationSchema);
