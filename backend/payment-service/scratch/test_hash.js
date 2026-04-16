const crypto = require('crypto');

// Values from backend/payment-service/.env
const merchantId = '1235186';
const merchantSecret = 'MzE1MzcwODU2MjQxNTQxNDc1NzYzMTE1NzI4ODcyMzE5OTY2MTU4Mw==';

// Test values
const appointmentId = '661e5a5a1234567890abcdef'; // Example ObjectId
const amount = 1500;
const currency = 'LKR';

const amountFormatted = parseFloat(amount).toFixed(2);
const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
const hashInput = `${merchantId}${appointmentId}${amountFormatted}${currency}${hashedSecret}`;
const hash = crypto.createHash('md5').update(hashInput).digest('hex').toUpperCase();

console.log('--- PayHere Hash Test ---');
console.log('Merchant ID:', merchantId);
console.log('Order ID:', appointmentId);
console.log('Amount:', amountFormatted);
console.log('Hashed Secret (MD5 of Secret):', hashedSecret);
console.log('Hash Input String:', hashInput);
console.log('Final MD5 Hash:', hash);
console.log('-------------------------');
