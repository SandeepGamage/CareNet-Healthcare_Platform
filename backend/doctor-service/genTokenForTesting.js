// generate-token.js
// Run with: node generate-token.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  console.error('JWT_SECRET is missing. Add it to .env and retry.');
  process.exit(1);
}

const patientToken = jwt.sign(
  { id: '507f1f77bcf86cd799439011', email: 'kamal@gmail.com', role: 'PATIENT' },
  SECRET,
  { expiresIn: '24h' }
);

const doctorToken = jwt.sign(
  { id: '507f191e810c19729de860ea', email: 'drperera@gmail.com', role: 'DOCTOR' },
  SECRET,
  { expiresIn: '24h' }
);

const adminToken = jwt.sign(
  { id: '5f43a1b2c3d4e5f60718293a', email: 'admin@gmail.com', role: 'ADMIN' },
  SECRET,
  { expiresIn: '24h' }
);

console.log('\n=== TEST TOKENS ===\n');
console.log('PATIENT TOKEN:');
console.log(patientToken);
console.log('\nDOCTOR TOKEN:');
console.log(doctorToken);
console.log('\nADMIN TOKEN:');
console.log(adminToken);