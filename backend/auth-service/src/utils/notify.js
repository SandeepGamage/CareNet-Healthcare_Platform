// Simple utility to abstract the communication with the generic notification-service
// Make sure you're using Node v18+ for native fetch to work
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';

exports.sendNotification = async ({ to, subject, body, type = 'EMAIL' }) => {
  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: to,      // can be email or user ID depending on notification-service
        message: body,
        subject: subject,
        type: type       // 'EMAIL' or 'SMS'
      })
    });
    
    if (!response.ok) {
      console.warn(`[Auth Service] Notification Service responded with ${response.status}`);
    } else {
      console.log(`[Auth Service] Notification sent successfully to ${to}`);
    }
  } catch (error) {
    // We catch it and log so that if Notification Service is down,
    // the auth process doesn't fail.
    console.error('[Auth Service] Failed to reach Notification Service:', error.message);
  }
};
