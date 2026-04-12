
// Native fetch since node v18+

async function testNotification() {
  const url = 'http://localhost:3006/api/notifications/verify';
  const body = {
    userId: 'test@example.com',
    message: 'Hello, your verification code is: 123456. It expires in 10 minutes.',
    subject: 'CareNet Healthcare - Test OTP',
    type: 'EMAIL'
  };

  try {
    console.log(`Attempting to reach ${url}...`);
    const result3006 = await tryNotify('http://localhost:3006/api/notifications/verify');
    console.log('Result 3006:', result3006);

    const result5004 = await tryNotify('http://localhost:5004/api/notifications/verify');
    console.log('Result 5004:', result5004);
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

async function tryNotify(url) {
  try {
    console.log(`Attempting to reach ${url}...`);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test@example.com',
        message: 'Hello, your verification code is: 123456.',
        type: 'EMAIL'
      })
    });
    return { status: res.status, data: await res.json() };
  } catch (err) {
    return { error: err.message };
  }
}

testNotification();
