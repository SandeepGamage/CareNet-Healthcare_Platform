const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendNotification } = require('../utils/notify');

// ── Helper: Generate JWT ──────────────────────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, specialty, adminSecretKey } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    // Validate admin registration with secret key
    if (role === 'admin') {
      const expectedKey = process.env.ADMIN_SECRET_KEY || 'carenet-admin-secret-2026';
      if (adminSecretKey !== expectedKey) {
        return res.status(403).json({ success: false, message: 'Invalid Admin Access Key.' });
      }
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Create user (doctor accounts need admin verification)
    const userData = { name, email, password, role: role || 'patient' };
    if (role === 'doctor') {
      userData.specialty = specialty || null;
      userData.isVerified = false; // Doctor must be verified by admin
    }

    const user = await User.create(userData);
    const token = generateToken(user);

    // Send a welcome / registration notification asynchronously
    sendNotification({
      to: email, // or user._id depending on the notification service's expectation
      subject: 'Welcome to CareNet Healthcare',
      body: `Hello ${name}, your ${role} account has been successfully created. ${role === 'doctor' ? 'Please wait for an admin to verify your account.' : ''}`,
      type: 'EMAIL'
    });

    res.status(201).json({
      success: true,
      message: role === 'doctor'
        ? 'Doctor account created. Awaiting admin verification before full access is granted.'
        : 'Account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find user with password included
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    // Send a notification asynchronously (for security alerts, etc.)
    sendNotification({
      to: email,
      subject: 'New Login to your CareNet Account',
      body: `Hello ${user.name}, we detected a new login to your CareNet account.`,
      type: 'EMAIL'
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ── GET /api/auth/me (Protected: verify token) ────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── ADMIN: GET /api/auth/doctors/pending ────────────────────────────────────
exports.getPendingDoctors = async (req, res) => {
  try {
    const pendingDoctors = await User.find({ role: 'doctor', isVerified: false });
    res.status(200).json({ success: true, count: pendingDoctors.length, data: pendingDoctors });
  } catch (error) {
    console.error('getPendingDoctors error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching doctors.' });
  }
};

// ── ADMIN: PUT /api/auth/doctors/:id/verify ─────────────────────────────────
exports.approveDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await User.findById(doctorId);

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    doctor.isVerified = true;
    await doctor.save();

    // Notify doctor
    sendNotification({
      to: doctor.email,
      subject: 'CareNet Account Verified',
      body: `Hello ${doctor.name}, your doctor account has been verified by an admin. You can now access telemedicine features.`,
      type: 'EMAIL'
    });

    res.status(200).json({ success: true, message: 'Doctor verified successfully.', data: doctor });
  } catch (error) {
    console.error('approveDoctor error:', error.message);
    res.status(500).json({ success: false, message: 'Server error verifying doctors.' });
  }
};
