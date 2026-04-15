const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const appointmentRoutes = require('./src/routes/appointmentRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint — used by Docker and K8s
app.get('/health', (req, res) =>
  res.json({ status: 'appointment-service running', timestamp: new Date() })
);

app.use('/api/appointments', appointmentRoutes);

// Connect to MongoDB Atlas then start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas - appointment_db');
    const PORT = process.env.PORT || 3004;
    app.listen(PORT, () =>
      console.log(`Appointment service running on port ${PORT}`)
    );
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });