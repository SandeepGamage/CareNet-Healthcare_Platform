const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      default: null,
    },
    qualifications: {
      type: String,
      default: null,
    },
    experienceYears: {
      type: Number,
      default: null,
    },
    consultationFee: {
      type: Number,
      default: null,
    },
    bio: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: null,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    availableHours: {
      type: String,
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    availableSlots: {
      type: [String],
      default: [],
    },
    slotDuration: {
      type: Number,
      default: 30, // in minutes
    },
  },
  {
    timestamps: true,
  }
);

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;
