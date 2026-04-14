// generate-token.js
// Run with: node generate-token.js
const jwt = require('jsonwebtoken');

const SECRET = 'ufjkrm*$&+!=JfldsJKLfesadk421!@$45922dakjfsafdafa38fjkdjasKLJKFAF';

const patientToken = jwt.sign(
  { id: '64f111111111111111111111', email: 'kamal@gmail.com', role: 'patient' },
  SECRET,
  { expiresIn: '24h' }
);

const doctorToken = jwt.sign(
  { id: '64f222222222222222222222', email: 'drperera@gmail.com', role: 'doctor' },
  SECRET,
  { expiresIn: '24h' }
);

const adminToken = jwt.sign(
  { id: '64f333333333333333333333', email: 'admin@gmail.com', role: 'admin' },
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