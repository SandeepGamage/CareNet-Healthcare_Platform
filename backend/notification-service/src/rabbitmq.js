const amqp = require('amqplib');
const logger = require('./utils/logger');
const { processIncomingEvent } = require('./services/eventConsumer');

let connection;
let channel;

const QUEUE_NAME = 'notification_queue';

const initRabbitMQ = async () => {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });
    
    logger.info(`Connected to RabbitMQ at ${rabbitUrl}. Waiting for messages in ${QUEUE_NAME}...`);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString());
          logger.info(`Received RabbitMQ event: ${content.eventType}`);
          
          await processIncomingEvent(content);
          
          channel.ack(msg);
        } catch (err) {
          logger.error(`Error processing message: ${err.message}`);
          // Negative ack, requeue if it's potentially transient
          channel.nack(msg, false, true); 
        }
      }
    });

    connection.on('error', (err) => {
      logger.error(`RabbitMQ connection error: ${err.message}`);
    });

  } catch (err) {
    logger.error(`Failed to connect to RabbitMQ: ${err.message}`);
    // Retry logic could be added here
  }
};

module.exports = { initRabbitMQ };
