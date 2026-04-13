const InAppNotification = require('../models/InAppNotification');
const logger = require('../utils/logger');

/**
 * GET /api/notifications/in-app
 * Get notifications for the logged-in user
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { unreadOnly, limit = 50 } = req.query;

    const query = { recipientId: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await InAppNotification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const unreadCount = await InAppNotification.countDocuments({ 
      recipientId: userId, 
      isRead: false 
    });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (err) {
    logger.error(`Error in getMyNotifications: ${err.message}`);
    next(err);
  }
};

/**
 * PATCH /api/notifications/in-app/:id/read
 * Mark a single notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await InAppNotification.findOneAndUpdate(
      { _id: id, recipientId: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (err) {
    logger.error(`Error in markAsRead: ${err.message}`);
    next(err);
  }
};

/**
 * PATCH /api/notifications/in-app/read-all
 * Mark all notifications as read for the user
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await InAppNotification.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    logger.error(`Error in markAllAsRead: ${err.message}`);
    next(err);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead
};
