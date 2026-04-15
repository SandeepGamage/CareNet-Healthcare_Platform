const jwt = require('jsonwebtoken');
const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');
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
    const { name, email, password, role, specialty, adminSecretKey, phone } = req.body;

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
      // If the account exists but was never OTP-verified, allow re-registration
      // by deleting the stale unverified record and its pending codes
      if (!existingUser.isOtpVerified) {
        await VerificationCode.deleteMany({ userId: existingUser._id });
        await User.findByIdAndDelete(existingUser._id);
      } else {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }
    }

    // Create user (doctor accounts need admin verification)
    const userData = { name, email, password, role: role || 'patient', phone: phone || null };
    if (role === 'doctor') {
      userData.specialty = specialty || null;
      userData.isVerified = false; // Doctor must be verified by admin
    }

    const user = await User.create(userData);

    // Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Always send OTP via email by default
    await VerificationCode.create({
      userId: user._id,
      code: otpCode,
      type: 'email',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
    });

    // Send OTP to email (primary channel)
    await sendNotification({
      to: email,
      subject: 'CareNet Healthcare - Verify Your Account',
      body: `Hello ${name}, your verification code is: ${otpCode}. It expires in 10 minutes.`,
      type: 'EMAIL',
      apiPath: 'verify'
    });

    res.status(201).json({
      success: true,
      message: `Account created successfully. A verification code has been sent to your email.`,
      userId: user._id,
      type: 'email',
      hasPhone: !!phone, // let frontend know SMS fallback is available
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password, isGoogle } = req.body;

    if (!email || (!isGoogle && !password)) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find user
    let user;
    if (isGoogle) {
      user = await User.findOne({ email });
    } else {
      user = await User.findOne({ email }).select('+password');
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!isGoogle) {
      // Compare password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
    }

    // Block login if OTP was never completed (standard accounts only)
    // Google logins are exempt — they verify identity via Google OAuth
    if (!isGoogle && !user.isOtpVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your account. Check your email for the OTP code.',
        requiresOtp: true,
        userId: user._id,
        hasPhone: !!user.phone,
      });
    }

    // Reactivate account if it was deactivated
    if (user.isActive === false) {
      user.isActive = true;
      await user.save();
    }

    if (user.role === 'doctor' && !user.isVerified) {
      return res.status(403).json({ success: false, message: 'Your doctor account is pending admin verification.' });
    }

    if (isGoogle) {
      // For Google login, mark as OTP-verified (Google already verifies the identity)
      if (!user.isOtpVerified) {
        user.isOtpVerified = true;
        await user.save();
      }
      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        message: 'Google login successful.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
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

// ── ADMIN: GET /api/auth/doctors ────────────────────────────────────
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' });
    res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    console.error('getAllDoctors error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching doctors.' });
  }
};

// ── PUBLIC: GET /api/auth/doctors/verified ───────────────────────────
// Returns only admin-approved doctors — accessible to any logged-in user (patients included)
exports.getVerifiedDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', isVerified: true })
      .select('name email specialty consultationFee fee rating experience');
    res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    console.error('getVerifiedDoctors error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching doctors.' });
  }
};

// ── ADMIN: GET /api/auth/patients ───────────────────────────────────
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' });
    res.status(200).json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    console.error('getAllPatients error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching patients.' });
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
      type: 'EMAIL',
      apiPath: 'account',
      eventType: 'ACCOUNT_UPDATE'
    });

    res.status(200).json({ success: true, message: 'Doctor verified successfully.', data: doctor });
  } catch (error) {
    console.error('approveDoctor error:', error.message);
    res.status(500).json({ success: false, message: 'Server error verifying doctors.' });
  }
};

// ── ADMIN: DELETE /api/auth/doctors/:id/reject ──────────────────────────────
exports.rejectDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await User.findById(doctorId);

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    await User.findByIdAndDelete(doctorId);

    // Notify doctor
    sendNotification({
      to: doctor.email,
      subject: 'CareNet Account Application Update',
      body: `Hello ${doctor.name}, your doctor account registration has been rejected by an admin. For more details, please contact our support.`,
      type: 'EMAIL',
      apiPath: 'account',
      eventType: 'ACCOUNT_UPDATE'
    });

    res.status(200).json({ success: true, message: 'Doctor rejected successfully.' });
  } catch (error) {
    console.error('rejectDoctor error:', error.message);
    res.status(500).json({ success: false, message: 'Server error rejecting doctors.' });
  }
};

// ── GET /api/auth/verify-email or verify-phone ─────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) {
      return res.status(400).json({ success: false, message: 'User ID and code are required.' });
    }

    const record = await VerificationCode.findOne({ userId, code });
    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    }

    // Mark as verified
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isOtpVerified = true;
    await user.save();
    await VerificationCode.deleteMany({ userId }); // clear codes

    let token = null;
    if (user.role !== 'doctor' || user.isVerified) {
      token = generateToken(user);
    }

    sendNotification({
      to: user.email,
      subject: 'Welcome to CareNet Healthcare',
      body: `Hello ${user.name}, your account is now fully verified. ${user.role === 'doctor' ? 'Please wait for an admin to verify your doctor credentials.' : ''}`,
      type: 'EMAIL'
    });

    res.status(200).json({
      success: true,
      message: 'Account verified successfully.',
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
    console.error('verifyOTP error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during verification.' });
  }
};

// ── POST /api/auth/resend-otp ─────────────────────────────────
exports.resendOTP = async (req, res) => {
  try {
    const { userId, type } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID required.' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await VerificationCode.deleteMany({ userId });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Default to email; only use SMS if user explicitly requested 'phone' and has a number
    const usePhone = type === 'phone' && user.phone;
    const sendType = usePhone ? 'SMS' : 'EMAIL';

    await VerificationCode.create({
      userId: user._id,
      code: otpCode,
      type: sendType === 'SMS' ? 'phone' : 'email',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const notifSuccess = await sendNotification({
      to: usePhone ? user.phone : user.email,
      subject: 'CareNet Healthcare - New Verification Code',
      body: `Hello ${user.name}, your new verification code is: ${otpCode}. It expires in 10 minutes.`,
      type: sendType,
      apiPath: 'verify'
    });

    // If SMS failed, fall back to email and let frontend know
    if (!notifSuccess && sendType === 'SMS') {
      await VerificationCode.deleteMany({ userId });
      await VerificationCode.create({
        userId: user._id,
        code: otpCode,
        type: 'email',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
      await sendNotification({
        to: user.email,
        subject: 'CareNet Healthcare - New Verification Code',
        body: `Hello ${user.name}, your new verification code is: ${otpCode}. It expires in 10 minutes.`,
        type: 'EMAIL',
        apiPath: 'verify'
      });
      return res.status(200).json({
        success: true,
        sentVia: 'email',
        message: 'SMS delivery failed. Verification code sent to your email instead.'
      });
    }

    res.status(200).json({
      success: true,
      sentVia: sendType === 'SMS' ? 'phone' : 'email',
      message: `New code sent via ${sendType === 'SMS' ? 'SMS to your phone' : 'email'}.`
    });
  } catch (error) {
    console.error('resendOTP error:', error.message);
    res.status(500).json({ success: false, message: 'Server error resending OTP.' });
  }
};

// ── POST /api/auth/deactivate ─────────────────────────────────
exports.deactivateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isActive = false;
    await user.save();

    res.status(200).json({ success: true, message: 'Account deactivated. Logging out...' });
  } catch (error) {
    console.error('deactivateAccount error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during deactivation.' });
  }
};
