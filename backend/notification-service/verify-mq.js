const amqp = require('amqplib');

async function sendTestEvent() {
  const rabbitUrl = 'amqp://user:password@localhost:5672'; // Using credentials from docker-compose
  try {
    const connection = await amqp.connect(rabbitUrl);
    const channel = await connection.createChannel();
    const queue = 'notification_queue';

    const event = {
      eventType: 'APPOINTMENT_BOOKED',
      recipientId: '65f1a2b3c4d5e6f7a8b9c0d1', // Replace with a real User ID if testing manually
      recipientRole: 'patient',
      data: {
        patientName: 'John Doe',
        doctorName: 'Dr. Smith',
        date: '2026-05-20',
        time: '10:00 AM'
      },
      email: 'john.doe@example.com',
      referenceId: 'APPT-12345'
    };

    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(event)));

    console.log(" [x] Sent test notification event to RabbitMQ");
    
    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  } catch (error) {
    console.error("Error sending test event:", error);
  }
}

sendTestEvent();
