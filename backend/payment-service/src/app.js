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

// ─── Database ─────────────────────────────────────────────────────────────────
connectDB();

// ─── PayHere Webhook (no auth required — called by PayHere servers) ──────────
app.post('/api/payments/payhere/notify', express.urlencoded({ extended: true }), handlePayhereWebhook);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

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
