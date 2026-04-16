const mongoose = require('mongoose');
const axios = require('axios');

async function verify() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const testUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439012');
    await mongoose.connection.db.collection('users').updateOne(
      { _id: testUserId },
      { $set: { phone: '94769139719' } },
      { upsert: true }
    );
    console.log('Test User phone updated');

    const url = 'http://notification-service:3006/api/notifications/appointments/confirmed';
    const payload = {
      patientEmail: 'sandeepgamage811@gmail.com',
      patientPhone: '94769139719',
      patientId:    testUserId.toString(),
      patientName:  'Test Patient',
      doctorName:   'Dr. Verify Acceptance',
      appointmentDate: new Date().toDateString(),
      appointmentTime: '10:00 - 10:30',
      appointmentId:   'VERIFY-ACCEPT'
    };

    console.log('Dispatching notification via REST...');
    const response = await axios.post(url, payload);
    console.log('Result:', response.data);
    
    process.exit(0);
  } catch (err) {
    console.error('Verification Failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

verify();
