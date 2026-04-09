// generate-token.js
// Run with: node generate-token.js
const jwt = require('jsonwebtoken');

const SECRET = 'ufjkrm*$&+!=JfldsJKLfesadk421!@$45922dakjfsafdafa38fjkdjasKLJKFAF';

const patientToken = jwt.sign(
  { id: 'patient123', email: 'kamal@gmail.com', role: 'PATIENT' },
  SECRET,
  { expiresIn: '24h' }
);

const doctorToken = jwt.sign(
  { id: 'doctor456', email: 'drperera@gmail.com', role: 'DOCTOR' },
  SECRET,
  { expiresIn: '24h' }
);

const adminToken = jwt.sign(
  { id: 'admin789', email: 'admin@gmail.com', role: 'ADMIN' },
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