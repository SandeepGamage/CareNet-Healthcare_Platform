require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(morgan('dev'));

// Define service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004';
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:3002';
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3003';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005';
const TELEMEDICINE_SERVICE_URL = process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:3007';
const SYMPTOM_SERVICE_URL = process.env.SYMPTOM_SERVICE_URL || 'http://localhost:3008';

// Service routes mapping
const services = [
  { prefix: '/api/auth', target: AUTH_SERVICE_URL },
  { prefix: '/api/notifications', target: NOTIFICATION_SERVICE_URL },
  { prefix: '/api/appointments', target: APPOINTMENT_SERVICE_URL },
  { prefix: '/api/patients', target: PATIENT_SERVICE_URL },
  { prefix: '/api/doctors', target: DOCTOR_SERVICE_URL },
  { prefix: '/api/payments', target: PAYMENT_SERVICE_URL },
  { prefix: '/api/refunds',  target: PAYMENT_SERVICE_URL },
  { prefix: '/api/telemedicine', target: TELEMEDICINE_SERVICE_URL },
  { prefix: '/api/symptoms', target: SYMPTOM_SERVICE_URL },
  { prefix: '/socket.io', target: NOTIFICATION_SERVICE_URL, ws: true },
];
// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API Gateway is following orders', timestamp: new Date() });
});

// Setup proxies
services.forEach(({ prefix, target, ws }) => {
  app.use(
    prefix,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      ws: ws || false,
      pathRewrite: (path, req) => req.originalUrl,
      onError: (err, req, res) => {
        console.error(`Proxy Error for ${prefix}:`, err.message);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(502).json({ success: false, message: `Service at ${prefix} is currently unreachable. Error: ${err.message}` });
      },
    })
  );
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`🔗 Routing /api/auth to ${AUTH_SERVICE_URL}`);
  console.log(`🔗 Routing /api/notifications to ${NOTIFICATION_SERVICE_URL}`);
  console.log("Routing /api/doctors")
});
