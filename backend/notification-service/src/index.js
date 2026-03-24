const app = require('./app');
const logger = require('./utils/logger');

// Entry point for the Notification Service
// Most logic is in app.js, index.js just ensures the server scale/lifecycle is handled.

const PORT = process.env.PORT || 5004;

const server = app.listen(PORT, () => {
  logger.info(`Notification Service is up and running on port ${PORT}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
  });
});
