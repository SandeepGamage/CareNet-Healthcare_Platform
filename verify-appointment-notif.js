const mongoose = require('mongoose');
const axios = require('axios');

// Shared Mongo URI from docker-compose
const MONGO_URI = 'mongodb+srv://whitedeviltest0940:Qwer11223344@cluster0.bqkmeme.mongodb.net/carenet_db?appName=Cluster0';
const NOTIFICATION_SERVICE_URL = 'http://localhost:3006';

async function verify() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    // 1. Create/Find a test user with a phone number
    const testUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439012');
    await mongoose.connection.db.collection('users').updateOne(
      { _id: testUserId },
      { 
        $set: { 
          name: 'Test Patient', 
          email: 'sandeepgamage811@gmail.com', 
          phone: '94769139719', 
          role: 'patient' 
        } 
      },
      { upsert: true }
    );
    console.log('Test User upserted');

    const appointment = {
      patientId: testUserId.toString(),
      patientName: 'Test Patient',
      patientEmail: 'sandeepgamage811@gmail.com',
      doctorName: 'Dr. Test Acceptance',
      appointmentDate: new Date(),
      timeSlot: '11:00 - 11:30',
      appointmentId: 'VERIFY-ACCEPT',
      type: 'TELEMEDICINE',
      meetingLink: 'https://meet.jit.si/carenet-test'
    };

    console.log('Triggering notification via REST...');
    const url = `${NOTIFICATION_SERVICE_URL}/api/notifications/appointments/confirmed`;
    const response = await axios.post(url, {
      patientEmail: appointment.patientEmail,
      patientPhone: '94769139719',
      patientId:    appointment.patientId,
      patientName:  appointment.patientName,
      doctorName:   appointment.doctorName,
      appointmentDate: appointment.appointmentDate.toDateString(),
      appointmentTime: appointment.timeSlot,
      appointmentId:   appointment.appointmentId,
      joinUrl:         appointment.meetingLink
    });
    
    console.log('Result:', response.data);
    process.exit(0);
  } catch (err) {
    console.error('Verification Failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

verify();
