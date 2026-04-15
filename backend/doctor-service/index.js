const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');
require('dotenv').config();
const cron = require('node-cron');
const { resetAllDoctorSlots } = require('./src/services/doctorService');

const connectDB = require('./src/config/db');
const prescriptionRoutes = require('./src/routes/prescriptionRoutes');
const doctorRoutes = require('./src/routes/doctorRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

const requiredServiceUrls = {
  PATIENT_SERVICE_URL: process.env.PATIENT_SERVICE_URL,
  APPOINTMENT_SERVICE_URL: process.env.APPOINTMENT_SERVICE_URL,
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
  DOCTOR_SERVICE_URL: process.env.DOCTOR_SERVICE_URL,
  NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL,
  PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL,
  SYMPTOM_SERVICE_URL: process.env.SYMPTOM_SERVICE_URL,
  TELEMEDICINE_SERVICE_URL: process.env.TELEMEDICINE_SERVICE_URL,
};

const checkServiceReachability = (serviceUrl) =>
  new Promise((resolve) => {
    if (!serviceUrl) {
      resolve({ reachable: false, reason: 'not-configured' });
      return;
    }

    try {
      const parsedUrl = new URL(serviceUrl);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const req = client.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.pathname === '/' ? '/' : parsedUrl.pathname,
          method: 'GET',
          timeout: 3000,
        },
        (res) => {
          // Any HTTP response proves DNS + network path are working.
          resolve({ reachable: true, statusCode: res.statusCode });
          res.resume();
        }
      );

      req.on('timeout', () => {
        req.destroy(new Error('timeout'));
      });

      req.on('error', (err) => {
        resolve({ reachable: false, reason: err.message });
      });

      req.end();
    } catch (err) {
      resolve({ reachable: false, reason: `invalid-url: ${err.message}` });
    }
  });

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) =>
  res.json({ status: 'doctor-service running', timestamp: new Date() })
);

app.get('/health/dependencies', async (req, res) => {
  const entries = await Promise.all(
    Object.entries(requiredServiceUrls).map(async ([name, url]) => {
      const result = await checkServiceReachability(url);
      return [name, { url: url || null, ...result }];
    })
  );

  const dependencies = Object.fromEntries(entries);
  const hasFailure = Object.values(dependencies).some((dep) => !dep.reachable);

  res.status(hasFailure ? 503 : 200).json({
    status: hasFailure ? 'degraded' : 'ok',
    service: 'doctor-service',
    checkedAt: new Date().toISOString(),
    dependencies,
  });
});

app.use('/prescriptions', prescriptionRoutes);
app.use('/profile', doctorRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

connectDB()
  .then(() => {
    const missingUrls = Object.entries(requiredServiceUrls)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingUrls.length) {
      console.warn(`Missing service URL env vars: ${missingUrls.join(', ')}`);
    } else {
      console.log('All service URL env vars are configured.');
    }

    console.log('Connected to MongoDB - CareNet_DB');

    // Schedule midnight slot renewal
    cron.schedule('0 0 * * *', async () => {
      console.log('Running midnight slot renewal for all doctors...');
      try {
        const result = await resetAllDoctorSlots();
        console.log(`Successfully reset slots for ${result.updated} doctors.`);
      } catch (err) {
        console.error('Failed to reset doctor slots:', err.message);
      }
    });

    app.listen(process.env.PORT || 3003, () =>
      console.log(`Doctor service running on port ${process.env.PORT || 3003}`)
    );
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });