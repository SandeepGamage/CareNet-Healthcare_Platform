require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/carenet', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected for Auth Service'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3006;

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});
