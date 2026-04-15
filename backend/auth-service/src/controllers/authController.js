const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const VerificationCode = require('../models/VerificationCode');
const { sendNotification } = require('../utils/notify');
const supabase = require('../utils/supabase');
const path = require('path');

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
    let { name, email, password, role, specialization, qualifications, experienceYears, consultationFee, adminSecretKey, phone, dateOfBirth, bloodGroup, gender, address, allergies, chronicConditions, emergencyContactName, emergencyContactPhone, profileImage } = req.body;

    // Handle profile image upload to Supabase
    if (req.file) {
      try {
        const file = req.file;
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}${fileExt}`;
        const filePath = `profiles/${fileName}`;
        const bucket = process.env.SUPABASE_BUCKET || 'profiles';

        console.log(`[Auth Service] Attempting image upload to bucket: ${bucket}, path: ${filePath}`);

        const { data, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) {
          console.error('[Auth Service] Supabase upload error:', uploadError.message);
          console.warn('[Auth Service] Continuing registration without profile image due to upload failure.');
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          profileImage = publicUrl;
          console.log('[Auth Service] Image upload successful:', profileImage);
        }
      } catch (err) {
        console.error('[Auth Service] Supabase upload exception:', err.message);
        console.warn('[Auth Service] Continuing registration without profile image.');
      }
    }

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

    // Check for existing pending registration
    await VerificationCode.deleteMany({ 'registrationData.email': email.toLowerCase() });

    // Prepare user data for later creation
    const userData = { name, email, password, role: role || 'patient', phone: phone || null };
    if (role === 'doctor') {
      userData.specialization = specialization || null;
      userData.qualifications = qualifications || null;
      userData.experienceYears = experienceYears || null;
      userData.consultationFee = consultationFee || null;
      userData.isVerified = false; // Doctor must be verified by admin
    } else if (role === 'patient') {
      userData.dateOfBirth = dateOfBirth || null;
      userData.bloodGroup = bloodGroup || null;
      userData.gender = gender || 'other';
      userData.address = address || null;
      userData.allergies = allergies || [];
      userData.chronicConditions = chronicConditions || [];
      userData.emergencyContactName = emergencyContactName || null;
      userData.emergencyContactPhone = emergencyContactPhone || null;
      userData.profileImage = profileImage || null;
    }

    // Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create VerificationCode with registration data (User not created yet!)
    const pRecord = await VerificationCode.create({
      registrationData: userData,
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
      message: `A verification code has been sent to your email. Please verify to complete registration.`,
      userId: pRecord._id, // Send the record ID as userId for frontend compatibility
      type: 'email',
      hasPhone: !!phone,
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

    // Auto-seed / Bypass for Admin User
    if (!isGoogle && email === 'carenet.admin.support@gmail.com' && password === 'CareNetAdmin123!') {
      let adminUser = await User.findOne({ email: 'carenet.admin.support@gmail.com' });
      if (!adminUser) {
        adminUser = new User({
          name: 'System Admin',
          email: 'carenet.admin.support@gmail.com',
          password: 'CareNetAdmin123!',
          role: 'admin',
          isVerified: true,
          isOtpVerified: true,
          isActive: true
        });
        await adminUser.save();
      }
      
      const token = generateToken(adminUser);
      return res.status(200).json({
        success: true,
        message: 'Admin login successful.',
        token,
        user: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          isVerified: adminUser.isVerified,
        },
      });
    }

    // Find user
    let user;
    if (isGoogle) {
      user = await User.findOne({ email });
    } else {
      user = await User.findOne({ email }).select('+password');
    }

    if (!user) {
      // Check if registration is pending verification
      const pending = await VerificationCode.findOne({ 'registrationData.email': email.toLowerCase() });
      if (pending) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your account. Check your email for the OTP code.',
          requiresOtp: true,
          userId: pending._id,
          hasPhone: !!pending.registrationData.phone,
        });
      }
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
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Attach profile data
    let profile = null;
    if (user.role === 'doctor') {
      profile = await Doctor.findOne({ userId: user._id });
    } else if (user.role === 'patient') {
      profile = await Patient.findOne({ userId: user._id });
    }

    res.status(200).json({ 
      success: true, 
      user: {
        ...user.toObject(),
        profile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── ADMIN: GET /api/auth/doctors/pending ────────────────────────────────────
exports.getPendingDoctors = async (req, res) => {
  try {
    const pendingDoctorProfiles = await Doctor.find({ isVerified: false }).populate('userId');
    const pendingDoctors = pendingDoctorProfiles.map(p => ({
      ...p.toObject(),
      ...p.userId?.toObject(),
      _id: p.userId?._id, // Ensure ID is consistent
      profileId: p._id
    }));

    res.status(200).json({ success: true, count: pendingDoctors.length, data: pendingDoctors });
  } catch (error) {
    console.error('getPendingDoctors error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching doctors.' });
  }
};

// ── ADMIN: GET /api/auth/doctors ────────────────────────────────────
exports.getAllDoctors = async (req, res) => {
  try {
    const doctorProfiles = await Doctor.find().populate('userId');
    const doctors = doctorProfiles.map(p => ({
      ...p.userId?.toObject(),
      profile: p.toObject()
    }));
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
    const doctorProfiles = await Doctor.find({ isVerified: true }).populate('userId', 'name email phone');
    const doctors = doctorProfiles.map(p => ({
      _id: p.userId?._id,
      name: p.userId?.name,
      email: p.userId?.email,
      specialization: p.specialization,
      consultationFee: p.consultationFee,
      rating: p.rating,
      experienceYears: p.experienceYears
    }));
    res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    console.error('getVerifiedDoctors error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching doctors.' });
  }
};

// ── ADMIN: GET /api/auth/patients ───────────────────────────────────
exports.getAllPatients = async (req, res) => {
  try {
    const patientProfiles = await Patient.find().populate('userId');
    const patients = patientProfiles.map(p => ({
      ...p.userId?.toObject(),
      profile: p.toObject()
    }));
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
    const doctorProfile = await Doctor.findOne({ userId: doctorId });

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    doctorProfile.isVerified = true;
    await doctorProfile.save();

    const doctor = await User.findById(doctorId);
    if (doctor) {
      doctor.isVerified = true;
      await doctor.save();
    }


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

    await Doctor.findOneAndDelete({ userId: doctorId });
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

    // Record could be a VerificationCode linked to a User OR a pending registration
    const record = await VerificationCode.findById(userId);
    if (!record || record.code !== code) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    }

    let user;
    if (record.registrationData) {
      // Finish registration: Create the user now
      user = await User.create({
        ...record.registrationData,
        isOtpVerified: true,
        isVerified: record.registrationData.role !== 'doctor' // Patients/Admins are verified by default
      });

      // Create linked profile based on role
      if (user.role === 'doctor') {
        await Doctor.create({
          userId: user._id,
          specialization: record.registrationData.specialization || null,
          qualifications: record.registrationData.qualifications || null,
          experienceYears: record.registrationData.experienceYears || null,
          consultationFee: record.registrationData.consultationFee || null,
          isVerified: false
        });
      } else if (user.role === 'patient') {
        await Patient.create({
          userId: user._id,
          dateOfBirth: record.registrationData.dateOfBirth || null,
          bloodGroup: record.registrationData.bloodGroup || null,
          gender: record.registrationData.gender || 'other',
          address: record.registrationData.address || null,
          allergies: record.registrationData.allergies || [],
          chronicConditions: record.registrationData.chronicConditions || [],
          emergencyContactName: record.registrationData.emergencyContactName || null,
          emergencyContactPhone: record.registrationData.emergencyContactPhone || null,
          profileImage: record.registrationData.profileImage || null
        });
      }

      // ── Synchronize with External Services (Best Effort) ─────────────────────
      const tempToken = generateToken(user);
      const authHeader = `Bearer ${tempToken}`;

      if (user.role === 'patient') {
        const patientServiceUrl = process.env.PATIENT_SERVICE_URL || 'http://localhost:3002';
        console.log(`[Auth Service] Syncing patient profile to: ${patientServiceUrl}`);
        await axios.post(`${patientServiceUrl}/api/patients/me/profile`, {
          dateOfBirth: record.registrationData.dateOfBirth,
          gender: record.registrationData.gender,
          address: record.registrationData.address,
          bloodGroup: record.registrationData.bloodGroup,
          allergies: record.registrationData.allergies,
          chronicConditions: record.registrationData.chronicConditions,
          emergencyContactName: record.registrationData.emergencyContactName,
          emergencyContactPhone: record.registrationData.emergencyContactPhone,
          profileImage: record.registrationData.profileImage
        }, {
          headers: { Authorization: authHeader }
        }).then(() => console.log('[Auth Service] Patient Profile synced successfully.'))
          .catch(err => console.error('[Auth Service] Patient Service sync failed:', err.response?.data?.message || err.message));

      } else if (user.role === 'doctor') {
        const doctorServiceUrl = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3003';
        console.log(`[Auth Service] Syncing doctor profile to: ${doctorServiceUrl}`);
        await axios.post(`${doctorServiceUrl}/api/doctors/profile`, {
          specialization: record.registrationData.specialization,
          qualifications: record.registrationData.qualifications,
          experienceYears: Number(record.registrationData.experienceYears || 0),
          consultationFee: Number(record.registrationData.consultationFee || 0),
          profileImage: record.registrationData.profileImage
        }, {
          headers: { Authorization: authHeader }
        }).then(() => console.log('[Auth Service] Doctor Profile synced successfully.'))
          .catch(err => console.error('[Auth Service] Doctor Service sync failed:', err.response?.data?.message || err.message));
      }
    } else {
      // Existing user verifying a new channel or re-verifying
      user = await User.findById(record.userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      user.isOtpVerified = true;
      await user.save();
    }

    await VerificationCode.deleteMany({ _id: userId }); // clear this code
    // Only clear verification codes – never touch password_reset codes
    if (user._id) await VerificationCode.deleteMany({ userId: user._id, purpose: { $ne: 'password_reset' } });

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
    
    // Check if it's a pending registration or an existing user
    let user = await User.findById(userId);
    let pending = null;
    
    if (!user) {
      pending = await VerificationCode.findById(userId);
      if (!pending || !pending.registrationData) {
        return res.status(404).json({ success: false, message: 'Registration record not found or expired.' });
      }
    }

    const email = user ? user.email : pending.registrationData.email;
    const phone = user ? user.phone : pending.registrationData.phone;
    const name = user ? user.name : pending.registrationData.name;

    await VerificationCode.deleteMany({ _id: userId });
    // Only clear verification codes – never touch password_reset codes
    if (user) await VerificationCode.deleteMany({ userId: user._id, purpose: { $ne: 'password_reset' } });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Default to email; only use SMS if user explicitly requested 'phone' and has a number
    const usePhone = type === 'phone' && phone;
    const sendType = usePhone ? 'SMS' : 'EMAIL';

    const newRecordData = {
      code: otpCode,
      type: sendType === 'SMS' ? 'phone' : 'email',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };

    if (user) newRecordData.userId = user._id;
    else newRecordData.registrationData = pending.registrationData;

    const newRecord = await VerificationCode.create(newRecordData);

    const notifSuccess = await sendNotification({
      to: usePhone ? phone : email,
      subject: 'CareNet Healthcare - New Verification Code',
      body: `Hello ${name}, your new verification code is: ${otpCode}. It expires in 10 minutes.`,
      type: sendType,
      apiPath: 'verify'
    });

    // If SMS failed, fall back to email
    if (!notifSuccess && sendType === 'SMS') {
      newRecord.type = 'email';
      await newRecord.save();
      await sendNotification({
        to: email,
        subject: 'CareNet Healthcare - New Verification Code',
        body: `Hello ${name}, your new verification code is: ${otpCode}. It expires in 10 minutes.`,
        type: 'EMAIL',
        apiPath: 'verify'
      });
      return res.status(200).json({
        success: true,
        sentVia: 'email',
        userId: newRecord._id,
        message: 'SMS delivery failed. Verification code sent to your email instead.'
      });
    }

    res.status(200).json({
      success: true,
      sentVia: sendType === 'SMS' ? 'phone' : 'email',
      userId: newRecord._id,
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

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success to prevent email enumeration attacks
    if (!user || !user.isOtpVerified) {
      return res.status(200).json({
        success: true,
        message: 'If a verified account with that email exists, a reset code has been sent.',
      });
    }

    // Clear any existing password reset codes for this user
    await VerificationCode.deleteMany({ userId: user._id, purpose: 'password_reset' });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const record = await VerificationCode.create({
      userId: user._id,
      code: otpCode,
      type: 'email',
      purpose: 'password_reset',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    await sendNotification({
      to: user.email,
      subject: 'CareNet - Password Reset Code',
      body: `Hello ${user.name},\n\nYour password reset code is: ${otpCode}\n\nThis code expires in 15 minutes. If you did not request a password reset, please ignore this email.`,
      type: 'EMAIL',
      apiPath: 'verify',
    });

    res.status(200).json({
      success: true,
      message: 'Password reset code sent to your email.',
      resetToken: record._id,
    });
  } catch (error) {
    console.error('forgotPassword error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ── POST /api/auth/reset-password ────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, code, newPassword } = req.body;

    if (!resetToken || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token, code, and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const record = await VerificationCode.findById(resetToken);
    if (!record || record.purpose !== 'password_reset' || record.code !== code) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }
    if (record.expiresAt < new Date()) {
      await VerificationCode.deleteMany({ _id: resetToken });
      return res.status(400).json({ success: false, message: 'Reset code has expired. Please request a new one.' });
    }

    const user = await User.findById(record.userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    user.password = newPassword; // pre-save hook will hash this
    await user.save();

    await VerificationCode.deleteMany({ _id: resetToken });

    // Fire-and-forget confirmation notification
    sendNotification({
      to: user.email,
      subject: 'CareNet - Password Changed Successfully',
      body: `Hello ${user.name}, your CareNet password has been successfully changed. If you did not make this change, please contact our support team immediately.`,
      type: 'EMAIL',
      apiPath: 'account',
      eventType: 'ACCOUNT_UPDATE',
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('resetPassword error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};
