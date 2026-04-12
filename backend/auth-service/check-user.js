
const mongoose = require('mongoose');

// Auth Service DB
const AUTH_MONGO_URI = 'mongodb+srv://whitedeviltest0940:Qwer11223344@cluster0.bqkmeme.mongodb.net/?appName=Cluster0';

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
