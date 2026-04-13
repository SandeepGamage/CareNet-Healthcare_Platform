require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const connectDB      = require('./config/db');
const errorHandler   = require('./middleware/errorHandler');
const logger         = require('./utils/logger');
const { handlePayhereWebhook } = require('./webhooks/payhereWebhook');
const paymentRoutes  = require('./routes/paymentRoutes');
const refundRoutes   = require('./routes/refundRoutes');

const app = express();

// DEBUG: Log all requests
app.use((req, res, next) => {
  console.log(`[DEBUG] Incoming Request: ${req.method} ${req.url}`);
  next();
});

// ─── Middleware ───────────────────────────────────────────────────────────────
// Move CORS to top to catch all requests and preflights
app.use(cors({
  origin: (origin, callback) => {
    // During development, allow all origins if requested
    if (!origin || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    const allowed = process.env.ALLOWED_ORIGINS?.split(',') || [];
    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow resources to be loaded across origins
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ─── Database ─────────────────────────────────────────────────────────────────
connectDB();

// ─── PayHere Webhook (no auth required — called by PayHere servers) ──────────
app.post('/api/payments/payhere/notify', express.urlencoded({ extended: true }), handlePayhereWebhook);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status   : 'OK',
    service  : 'payment-service',
    timestamp: new Date().toISOString(),
    uptime   : process.uptime(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/payments', paymentRoutes);
app.use('/api/refunds',  refundRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
