require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(morgan('dev'));

// Define service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3006';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5004';
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:5002';
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:5005';
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:5001';

// Service routes mapping
const services = [
  { prefix: '/api/auth', target: AUTH_SERVICE_URL },
  { prefix: '/api/notifications', target: NOTIFICATION_SERVICE_URL },
  { prefix: '/api/appointments', target: APPOINTMENT_SERVICE_URL },
  { prefix: '/api/patients', target: PATIENT_SERVICE_URL },
  { prefix: '/api/doctors', target: DOCTOR_SERVICE_URL },
];

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API Gateway is following orders', timestamp: new Date() });
});

// Setup proxies
services.forEach(({ prefix, target }) => {
  app.use(
    prefix,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: (path, req) => path, // keep the path as is since services handle /api/...
      onError: (err, req, res) => {
        console.error(`Proxy Error for ${prefix}:`, err.message);
        res.status(502).json({ success: false, message: `Service at ${prefix} is currently unreachable.` });
      },
    })
  );
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`🔗 Routing /api/auth to ${AUTH_SERVICE_URL}`);
  console.log(`🔗 Routing /api/notifications to ${NOTIFICATION_SERVICE_URL}`);
});
