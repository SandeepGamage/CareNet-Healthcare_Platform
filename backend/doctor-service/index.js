const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./src/config/db');
const prescriptionRoutes = require('./src/routes/prescriptionRoutes');
const doctorRoutes = require('./src/routes/doctorRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) =>
  res.json({ status: 'doctor-service running', timestamp: new Date() })
);

app.use('/api/doctors/prescriptions', prescriptionRoutes);
app.use('/api/doctors/profile', doctorRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

connectDB()
  .then(() => {
    console.log('Connected to MongoDB - CareNet_DB');
    app.listen(process.env.PORT || 5001, () =>
      console.log(`Doctor service running on port ${process.env.PORT || 5001}`)
    );
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });