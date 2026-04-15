const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'notification-service', '.env') });

const NotificationLog = require('./notification-service/src/models/NotificationLog');

async function checkLogs() {
  try {
    console.log('Connecting to MongoDB...', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const latestLogs = await NotificationLog.find({ recipientPhone: '0769139719' })
      .sort({ createdAt: -1 })
      .limit(1);

    if (latestLogs.length === 0) {
      console.log('No logs found for this phone number.');
    } else {
      console.log('Latest Log:', JSON.stringify(latestLogs[0], null, 2));
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error checking logs:', err.message);
  }
}

checkLogs();
