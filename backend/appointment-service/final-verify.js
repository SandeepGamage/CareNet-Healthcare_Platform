const mongoose = require('mongoose');
const axios = require('axios');

async function finalVerify() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const patientId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439012');
    const doctorId  = new mongoose.Types.ObjectId('507f1f77bcf86cd799439013');

    // 1. Setup Patient Profile
    await mongoose.connection.db.collection('users').updateOne(
      { _id: patientId },
      { $set: { name: 'Sandeep Patient', email: 'sandeepgamage811@gmail.com', phone: '94769139719', role: 'patient' } },
      { upsert: true }
    );
    console.log('Patient Profile set');

    // 2. Setup Doctor Profile
    await mongoose.connection.db.collection('users').updateOne(
      { _id: doctorId },
      { $set: { name: 'Dr. Expert', email: 'carenet.admin.support@gmail.com', phone: '94769139719', role: 'doctor' } },
      { upsert: true }
    );
    console.log('Doctor Profile set');

    const appointmentId = 'FINAL-TEST-001';
    const payload = {
      patientEmail: 'sandeepgamage811@gmail.com',
      patientPhone: '94769139719',
      patientId:    patientId.toString(),
      patientName:  'Sandeep Patient',
      doctorEmail:  'carenet.admin.support@gmail.com',
      doctorPhone:  '94769139719',
      doctorId:     doctorId.toString(),
      doctorName:   'Dr. Expert',
      appointmentDate: new Date().toDateString(),
      appointmentId:   appointmentId,
      duration:        '45 mins'
    };

    console.log('--- TEST 1: Booking Notification ---');
    await axios.post('http://notification-service:3006/api/notifications/appointments/booked', payload);
    console.log('Booking Notification Sent');

    console.log('--- TEST 2: Completion Notification ---');
    await axios.post('http://notification-service:3006/api/notifications/appointments/consultation-completed', payload);
    console.log('Completion Notification Sent');
    
    process.exit(0);
  } catch (err) {
    console.error('Final Verification Failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

finalVerify();
