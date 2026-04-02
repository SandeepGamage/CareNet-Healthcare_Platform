require('dotenv').config();
const { sendSMS } = require('./src/services/smsService');

const sendTestMessage = async () => {
    // ⚠️ IMPORTANT: Replace this number with your VERIFIED Twilio personal phone number!
    // Example format: '+94771234567'
    const recipientNumber = '+940769139719';

    console.log(`Sending test SMS to ${recipientNumber}...`);

    try {
        const result = await sendSMS(recipientNumber, 'Hello from CareNet! Your SMS gateway is successfully configured.');

        if (result.success) {
            console.log('✅ SMS Sent Successfully!');
            console.log(`Message SID: ${result.messageSid}`);
        } else {
            console.log('❌ Failed to send SMS:', result.error);
        }
    } catch (error) {
        console.error('Crash during SMS send:', error.message);
    }
};

sendTestMessage();
