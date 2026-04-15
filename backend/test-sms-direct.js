
async function testSMS() {
  const url = 'http://localhost:3006/api/notifications/verify';
  const phoneNumber = '0769139719'; // User provided number
  
  const body = {
    userId: phoneNumber,
    message: 'Hello, your CareNet verification code is: 998877. It expires in 10 minutes.',
    subject: 'CareNet Healthcare - Test SMS OTP',
    type: 'SMS'
  };

  try {
    console.log(`Attempting to send SMS to ${phoneNumber} via ${url}...`);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Body:', data);
    
    if (res.ok) {
        console.log('SMS request successfully queued/sent.');
    } else {
        console.error('Failed to send SMS.');
    }
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

testSMS();
