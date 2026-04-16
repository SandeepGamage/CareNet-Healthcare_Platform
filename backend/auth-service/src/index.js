require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[Auth Service] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/carenet_auth');
    console.log('MongoDB connected for Auth Service');
  } catch (err) {
    console.error('MongoDB connection failed. Retrying in 5 seconds...', err.message);
    setTimeout(connectDB, 5000);
  }
};
connectDB();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});
