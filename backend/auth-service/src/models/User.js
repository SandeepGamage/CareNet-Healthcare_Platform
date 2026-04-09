const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Exclude password from query results by default
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
    },
    isOtpVerified: {
      type: Boolean,
      default: false, // Checks if email or phone is verified via OTP
    },
    // Doctor-specific fields
    isVerified: {
      type: Boolean,
      default: false, // Admins must verify doctors
    },
    specialty: {
      type: String,
      default: null, // Only applicable for doctors
    },
    consultationFee: {
      type: Number,
      default: null, // Consultation fee in USD
    },
    rating: {
      type: Number,
      default: null, // Average rating out of 5
    },
    experience: {
      type: String,
      default: null, // e.g. "5 years"
    },
    qualifications: {
      type: String,
      default: null, // e.g. "MBBS, MD"
    },
    profilePicture: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true, // Account deactivation flag
    },
  },
  {
    timestamps: true, // Auto-manage createdAt and updatedAt
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
