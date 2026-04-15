
require('dotenv').config();
const mongoose = require('mongoose');

// Use MONGO_URI from .env
const AUTH_MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/carenet_auth';

async function checkUser() {
  try {
    const conn = await mongoose.connect(AUTH_MONGO_URI);
    console.log('Connected to Auth DB');
    
    // We don't have the model here exactly, so we'll use the connection directly
    const user = await conn.connection.db.collection('users').findOne({ email: 'carenet.admin.support@gmail.com' });
    
    if (user) {
      console.log('User found:', {
        id: user._id,
        email: user.email,
        isOtpVerified: user.isOtpVerified,
        role: user.role
      });
      
      const codes = await conn.connection.db.collection('verificationcodes').find({ userId: user._id }).toArray();
      console.log('Pending Verification Codes:', codes.map(c => ({
        type: c.type,
        expiresAt: c.expiresAt,
        code: c.code
      })));
    } else {
      console.log('User not found.');
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkUser();
