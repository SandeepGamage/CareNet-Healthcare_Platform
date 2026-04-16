const { dispatchBulk } = require('../services/notificationDispatcher');
const NotificationLog = require('../models/NotificationLog');
const logger = require('../utils/logger');

/**
 * POST /api/notifications/payment
 * Called internally by payment-service after successful payment
 *
 * Body: {
 *   type: 'PAYMENT_SUCCESS',
 *   recipients: [
 *     { email, phone, role: 'patient', data: { patientName, doctorName, amount, currency, ... } },
 *     { email, phone, role: 'doctor',  data: { ... } }
 *   ]
 * }
 */
const handlePaymentNotification = async (req, res, next) => {
  try {
    const { type, recipients } = req.body;

    if (!type || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, message: 'type and recipients[] are required' });
    }

    // Map role-specific template overrides
    const mapped = recipients.map((r) => {
      let eventType = type;
      if (type === 'PAYMENT_SUCCESS' && r.role === 'doctor') {
        eventType = 'PAYMENT_SUCCESS_DOCTOR';
      }
      return { ...r, eventType };
    });

    // Dispatch to all recipients (non-blocking — fire and respond)
    const referenceId = recipients[0]?.data?.transactionId;
    Promise.all(
      mapped.map((r) =>
        require('../services/notificationDispatcher').dispatchNotification({
          eventType     : r.eventType,
          email         : r.email,
          phone         : r.phone,
          role          : r.role,
          recipientId   : r.recipientId || r.data?.recipientId,
          data          : r.data,
          referenceId,
          referenceType : 'transaction',
        })
      )
    ).catch((err) => logger.error(`Bulk payment notification error: ${err.message}`));

    res.status(202).json({ success: true, message: 'Notifications queued' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/refund
 * Called by payment-service after successful refund
 */
const handleRefundNotification = async (req, res, next) => {
  try {
    const { type, recipients } = req.body;

    if (!type || !Array.isArray(recipients)) {
      return res.status(400).json({ success: false, message: 'type and recipients[] are required' });
    }

    const referenceId = recipients[0]?.data?.refundId;
    Promise.all(
      recipients.map((r) =>
        require('../services/notificationDispatcher').dispatchNotification({
          eventType     : type,
          email         : r.email,
          phone         : r.phone,
          role          : r.role,
          data          : r.data,
          referenceId,
          referenceType : 'refund',
        })
      )
    ).catch((err) => logger.error(`Refund notification error: ${err.message}`));

    res.status(202).json({ success: true, message: 'Refund notifications queued' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/account
 * Called by auth-service for approval/rejection
 */
const handleAccountNotification = async (req, res, next) => {
  try {
    const { userId, message, subject, eventType } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ success: false, message: 'userId and message are required' });
    }

    // Dispatch notification
    require('../services/notificationDispatcher').dispatchNotification({
      eventType: eventType || 'ACCOUNT_UPDATE',
      email: userId,
      role: 'doctor', // default role
      data: { message, subject },
    }).catch((err) => logger.error(`Account notification dispatch error: ${err.message}`));

    res.status(202).json({ success: true, message: 'Account notification queued' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/logs
 * Admin: get all notification logs with filters
 */
const getLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, eventType, status, recipientId } = req.query;
    const query = {};
    if (eventType)   query.eventType   = eventType;
    if (status)      query.status      = status;
    if (recipientId) query.recipientId = recipientId;

    const logs = await NotificationLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await NotificationLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/logs/my
 * Patient/doctor: get own notification logs
 */
const getMyLogs = async (req, res, next) => {
  try {
    const id = req.user.id || req.user.userId || req.user._id;
    const logs = await NotificationLog.find({ recipientId: id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/verify
 * Called by auth-service to send OTP codes
 */
const handleVerificationNotification = async (req, res, next) => {
  try {
    const { userId, message, subject, type } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ success: false, message: 'userId (email/phone) and message are required' });
    }

    // Extract optional 6-digit code for templates
    const codeMatch = message.match(/\d{6}/);
    const code = codeMatch ? codeMatch[0] : '';
    
    const eventType = type === 'SMS' ? 'VERIFICATION_CODE_SMS' : 'VERIFICATION_CODE_EMAIL';

    // Dispatch notification
    require('../services/notificationDispatcher').dispatchNotification({
      eventType,
      email: type === 'EMAIL' ? userId : null,
      phone: type === 'SMS' ? userId : null,
      role: 'user', // default role
      data: { message, code, subject: subject || 'Verification Code' },
    }).catch((err) => logger.error(`Verification notification dispatch error: ${err.message}`));

    res.status(202).json({ success: true, message: 'Verification notification queued' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/manual
 * Admin: send manual email or SMS or Both (Bulk supported)
 */
const handleManualNotification = async (req, res, next) => {
  try {
    const { recipients, recipient, email, phone, type, message, subject, isOtp, role, recipientId } = req.body;

    if (!message || !type) {
      return res.status(400).json({ success: false, message: 'message and type (EMAIL/SMS/BOTH) are required' });
    }

    // Normalized list of targets
    let targets = [];

    if (Array.isArray(recipients) && recipients.length > 0) {
      targets = recipients.map(r => ({
        email: r.email,
        phone: r.phone,
        recipientId: r.recipientId || r._id,
        role: r.role || role || 'user'
      }));
    } else {
      // Fallback to single recipient logic
      const targetEmail = email || (type === 'EMAIL' || type === 'BOTH' ? recipient : null);
      const targetPhone = phone || (type === 'SMS' || type === 'BOTH' ? recipient : null);
      
      if (targetEmail || targetPhone) {
        targets.push({
          email: targetEmail,
          phone: targetPhone,
          recipientId: recipientId || null,
          role: role || 'user'
        });
      }
    }

    if (targets.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one valid recipient is required' });
    }

    let eventType = 'MANUAL_MESSAGE';
    let data = { message, subject: subject || 'Notification from CareNet' };

    if (isOtp) {
      const codeMatch = message.match(/\d{6}/);
      const code = codeMatch ? codeMatch[0] : '';
      eventType = type === 'SMS' ? 'VERIFICATION_CODE_SMS' : 'VERIFICATION_CODE_EMAIL';
      data = { message, code, subject: subject || 'Verification Code' };
    }

    // Dispatch all notifications (non-blocking)
    const dispatcher = require('../services/notificationDispatcher');
    Promise.all(
      targets.map((t) => 
        dispatcher.dispatchNotification({
          eventType,
          email: (type === 'EMAIL' || type === 'BOTH') ? t.email : null,
          phone: (type === 'SMS' || type === 'BOTH') ? t.phone : null,
          role: t.role,
          recipientId: t.recipientId,
          data,
        })
      )
    ).catch((err) => logger.error(`Manual bulk notification dispatch error: ${err.message}`));

    res.status(202).json({ 
      success: true, 
      message: targets.length > 1 ? `Manual bulk notifications queued for ${targets.length} recipients` : 'Manual notification queued' 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/notifications/logs/:id
 * Admin: delete a specific notification log
 */
const deleteLog = async (req, res, next) => {
  try {
    const log = await NotificationLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log entry not found' });
    }

    await log.deleteOne();
    res.status(200).json({ success: true, message: 'Log entry deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handlePaymentNotification,
  handleRefundNotification,
  handleVerificationNotification,
  handleAccountNotification,
  getLogs,
  getMyLogs,
  handleManualNotification,
  deleteLog,
};
