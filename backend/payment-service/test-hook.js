const crypto = require('crypto');
const http = require('http');
require('dotenv').config({ path: '.env' });

const merchant_id = '1234825';
const merchant_secret = 'Mzc5NTA2OTc3MDQ4NjgzMDYwODM3NDU1OTczOTMxNjI0MzU5MjY4';
const order_id = '507f1f77bcf86cd799439011'; // Valid ObjectId
const payhere_amount = '1500.00';
const payhere_currency = 'LKR';
const status_code = '2'; // 2 means success in PayHere

// Generate the proper MD5 signature that PayHere would normally create
const hashedSecret = crypto.createHash('md5').update(merchant_secret).digest('hex').toUpperCase();
const local_sig = crypto.createHash('md5')
  .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret)
  .digest('hex').toUpperCase();

const postData = new URLSearchParams({
  merchant_id: merchant_id,
  order_id: order_id,
  payhere_amount: payhere_amount,
  payhere_currency: payhere_currency,
  status_code: status_code,
  md5sig: local_sig,
  method: 'VISA',
  card_no: '491621xxxxxx1292'
}).toString();

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/payments/payhere/notify',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log("Simulating PayHere Webhook request...");
const req = http.request(options, (res) => {
  console.log(`Backend Response Code: ${res.statusCode}`);
  res.on('data', (chunk) => { 
    console.log(`Backend Response Body: ${chunk}`); 
    console.log("\nIf it says 200 and OK, the email was just sent successfully!");
  });
});

req.on('error', (e) => { 
  console.error(`Problem with request: ${e.message}`); 
});

req.write(postData);
req.end();
