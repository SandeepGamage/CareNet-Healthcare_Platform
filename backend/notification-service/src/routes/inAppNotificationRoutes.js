const express = require('express');
const router = express.Router();
const inAppNotificationController = require('../controllers/inAppNotificationController');
const { protect } = require('../middleware/authMiddleware');

/**
 * All routes are protected and require a valid JWT
 */
router.use(protect);

// GET /api/notifications/in-app - Fetch my notifications
router.get('/', inAppNotificationController.getMyNotifications);

// PATCH /api/notifications/in-app/read-all - Mark all as read
router.patch('/read-all', inAppNotificationController.markAllAsRead);

// PATCH /api/notifications/in-app/:id/read - Mark single as read
router.patch('/:id/read', inAppNotificationController.markAsRead);

module.exports = router;
