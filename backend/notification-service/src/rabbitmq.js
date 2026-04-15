const amqp = require('amqplib');
const logger = require('./utils/logger');
const { processIncomingEvent } = require('./services/eventConsumer');

let connection;
let channel;

const QUEUE_NAME = 'notification_queue';

const initRabbitMQ = async () => {
  logger.info('RabbitMQ is disabled. Using REST endpoints for notifications.');
};

module.exports = { initRabbitMQ };
