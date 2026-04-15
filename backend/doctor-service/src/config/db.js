const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare_doctors';
  await mongoose.connect(mongoUri);
};

module.exports = connectDB;
