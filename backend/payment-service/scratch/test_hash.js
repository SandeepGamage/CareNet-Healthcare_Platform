const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the actual .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('✅ Loaded .env from:', envPath);
} else {
    console.error('❌ .env file not found at:', envPath);
    process.exit(1);
}

const merchantId = process.env.PAYHERE_MERCHANT_ID;
const merchantSecret = process.env.PAYHERE_SECRET || process.env.PAYHERE_MERCHANT_SECRET;

if (!merchantId || !merchantSecret) {
    console.error('❌ Credentials missing in .env');
    process.exit(1);
}

// Test values
const appointmentId = 'TEST_ORDER_' + Date.now(); 
const amount = 1500;
const currency = 'LKR';

const amountFormatted = parseFloat(amount).toFixed(2);
const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
const hashInput = `${merchantId}${appointmentId}${amountFormatted}${currency}${hashedSecret}`;
const hash = crypto.createHash('md5').update(hashInput).digest('hex').toUpperCase();

console.log('\n--- PayHere Current Hash Configuration ---');
console.log('Merchant ID    :', merchantId);
console.log('Merchant Secret:', merchantSecret.substring(0, 5) + '...' + merchantSecret.substring(merchantSecret.length - 5));
console.log('Order ID       :', appointmentId);
console.log('Amount         :', amountFormatted);
console.log('Currency       :', currency);
console.log('\n--- Intermediate Step ---');
console.log('Hashed Secret (MD5 of Secret):', hashedSecret);
console.log('Full Hash Input String       :', hashInput);
console.log('\n--- Final Hash ---');
console.log('Generated Hash:', hash);
console.log('------------------------------------------');
console.log('\nCopy the "Full Hash Input String" above and try to match it with your dashboard settings.');
