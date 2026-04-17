const http = require('http');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'test-image.png');
if (!fs.existsSync(filePath)) {
  // Create a tiny 1x1 PNG from base64 as a test image
  const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
  fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
  console.log('Wrote test image at', filePath);
}

const fileBuffer = fs.readFileSync(filePath);
const boundary = '----WebKitFormBoundary' + Date.now();
const CRLF = '\r\n';
const pre = `--${boundary}${CRLF}Content-Disposition: form-data; name="profileImage"; filename="test-image.png"${CRLF}Content-Type: image/png${CRLF}${CRLF}`;
const post = `${CRLF}--${boundary}--${CRLF}`;

const bodyLength = Buffer.byteLength(pre) + fileBuffer.length + Buffer.byteLength(post);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/me/avatar',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': bodyLength,
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxOTFlODEwYzE5NzI5ZGU4NjBlYSIsImVtYWlsIjoiZHJwZXJlcmFAZ21haWwuY29tIiwicm9sZSI6IkRPQ1RPUiIsImlhdCI6MTc3NjQxMDYyNCwiZXhwIjoxNzc2NDk3MDI0fQ.NPiadsv2eIPUVei3Y2puCEISP6LyLFIMTgmg9nC0dn4'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('HEADERS', res.headers);
    console.log('BODY', data);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('Request error:', err);
  process.exit(1);
});

req.write(pre);
req.write(fileBuffer);
req.write(post);
req.end();
