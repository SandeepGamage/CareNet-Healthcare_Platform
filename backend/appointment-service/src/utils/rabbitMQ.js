const amqp = require('amqplib');

let channel;
const QUEUE_NAME = 'notification_queue';

const connectRabbitMQ = async () => {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    const connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('RabbitMQ connection failed:', error.message);
  }
};

const publishToQueue = (data) => {
  if (!channel) {
    console.error('RabbitMQ channel not initialized');
    return;
  }
  channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(data)), {
    persistent: true,
  });
};

module.exports = { connectRabbitMQ, publishToQueue };
