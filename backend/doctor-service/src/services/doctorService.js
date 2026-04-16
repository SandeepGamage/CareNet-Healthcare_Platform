// If populate=true, populate userId for name/email/phone/profileImage
const getDoctorByUser = async (user, populate = false) => {
  const userId = resolveUserId(user);
  if (!userId) {
    throw new ApiError(401, 'Invalid token payload: missing user id');
  }
  ensureObjectId(userId, 'user id in token payload');
  let query = Doctor.findOne({ userId });
  if (populate) {
    query = query.populate('userId', 'name email phone profileImage');
  }
  const doctor = await query;
  if (!doctor) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  // Lazy-fix for corrupted database data (slotDuration: "" or invalid slots, or string isAvailable)
  const needsFix = doctor.slotDuration === null || 
                   isNaN(Number(doctor.slotDuration)) || 
                   Number(doctor.slotDuration) <= 0 || 
                   (doctor.availableSlots.length === 1 && doctor.availableSlots[0] === "") ||
                   typeof doctor.isAvailable === 'string';

  if (needsFix) {
      console.log(`Self-healing profile for doctor ${doctor._id}...`);
      if (typeof doctor.isAvailable === 'string') {
          doctor.isAvailable = doctor.isAvailable === 'true';
      }
      
      if (doctor.slotDuration === null || isNaN(Number(doctor.slotDuration)) || Number(doctor.slotDuration) <= 0) {
          doctor.slotDuration = 30;
      }

      if (doctor.availableHours) {
          doctor.availableSlots = generateTimeSlots(doctor.availableHours, Number(doctor.slotDuration));
      } else {
          doctor.availableSlots = [];
      }
      // Final sanity check for empty string slots
      doctor.availableSlots = (doctor.availableSlots || []).filter(s => s && s.trim() !== "");
      
      await doctor.save();
  }

  return doctor;
};

// Returns doctor profile fields for current user, including populated user details
const getCurrentDoctorProfile = async (user) => {
  const doctor = await getDoctorByUser(user, true); // populate userId
  const userObj = doctor.userId;
  return {
    name: userObj && userObj.name ? userObj.name : undefined,
    email: userObj && userObj.email ? userObj.email : undefined,
    phone: userObj && userObj.phone ? userObj.phone : undefined,
    profileImage: userObj && userObj.profileImage ? userObj.profileImage : undefined,
    specialization: doctor.specialization,
    bio: doctor.bio,
    qualifications: doctor.qualifications,
    experienceYears: doctor.experienceYears,
    availableHours: doctor.availableHours,
    isAvailable: doctor.isAvailable,
    consultationFee: doctor.consultationFee,
    rating: doctor.rating,
    // Add more fields as needed
  };
};

const mongoose = require('mongoose');
const Doctor = require('../models/doctor');
// Register User model for population
require('../models/user');
const ApiError = require('../utils/ApiError');

const resolveUserId = (user = {}) => user.id || user.userId || user._id || null;

const ensureObjectId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
};

const parseNonNegativeNumber = (value, fieldName, defaultValue = 0) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ApiError(400, `${fieldName} must be a non-negative number`);
  }

  return parsed;
};

const parseTimeToMinutes = (value) => {
  if (value instanceof Date) {
    return value.getHours() * 60 + value.getMinutes();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  // 1. Handle HH:mm format (24h)
  const twentyFourHourMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return hours * 60 + minutes;
    }
  }

  // 2. Handle HH:mm AM/PM format
  const twelveHourMatch = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (twelveHourMatch) {
    let hours = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2]);
    const ampm = twelveHourMatch[3];

    if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59) {
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }
  }

  // 3. Handle HH AM/PM format
  const shortTwelveHourMatch = normalized.match(/^(\d{1,2})\s*(AM|PM)$/);
  if (shortTwelveHourMatch) {
    let hours = Number(shortTwelveHourMatch[1]);
    const ampm = shortTwelveHourMatch[2];

    if (hours >= 1 && hours <= 12) {
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return hours * 60;
    }
  }

  return null;
};

const formatMinutesToTime = (minutes) => {
  let hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  const ampm = hh >= 12 ? 'PM' : 'AM';
  hh = hh % 12;
  hh = hh ? hh : 12; // the hour '0' should be '12'
  const strMm = mm.toString().padStart(2, '0');
  return `${hh}:${strMm} ${ampm}`;
};

const generateTimeSlots = (rangeString, duration) => {
  // Guard against invalid duration to prevent infinite loops
  if (!duration || typeof duration !== 'number' || duration <= 0) {
    return [];
  }

  const range = parseAvailableHoursRange(rangeString);
  if (!range) return [];

  const slots = [];
  let current = range.startMinutes;
  const end = range.endMinutes;

  // Handle cross-midnight if necessary, but usually range is within a day
  if (range.crossesMidnight) {
    // 1. From start to midnight (1440 mins)
    while (current + duration <= 1440) {
      slots.push(formatMinutesToTime(current));
      current += duration;
    }
    // 2. From midnight to end
    current = 0;
    while (current + duration <= end) {
      slots.push(formatMinutesToTime(current));
      current += duration;
    }
  } else {
    while (current + duration <= end) {
      slots.push(formatMinutesToTime(current));
      current += duration;
    }
  }

  return slots;
};

const parseAvailableHoursRange = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const rangeMatch = normalized.match(/^(.+?)\s*(?:-|to)\s*(.+)$/i);
  if (!rangeMatch) {
    return null;
  }

  const startMinutes = parseTimeToMinutes(rangeMatch[1]);
  const endMinutes = parseTimeToMinutes(rangeMatch[2]);

  if (startMinutes === null || endMinutes === null) {
    return null;
  }

  return {
    startMinutes,
    endMinutes,
    crossesMidnight: endMinutes < startMinutes,
  };
};

const isTimeWithinRange = (targetMinutes, range) => {
  if (!range) {
    return false;
  }

  if (range.crossesMidnight) {
    return targetMinutes >= range.startMinutes || targetMinutes <= range.endMinutes;
  }

  return targetMinutes >= range.startMinutes && targetMinutes <= range.endMinutes;
};

const createDoctor = async (user, payload) => {
  const userId = resolveUserId(user);
  if (!userId) {
    throw new ApiError(401, 'Invalid token payload: missing user id');
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid user id in token payload');
  }

  const existingDoctor = await Doctor.findOne({ userId });
  if (existingDoctor) {
    throw new ApiError(409, 'Doctor profile already exists');
  }

  const duration = parseNonNegativeNumber(payload.slotDuration, 'slotDuration', 30);
  const slots = (availableHours ? generateTimeSlots(availableHours, duration) : [])
                .filter(s => s && s.trim() !== "");

  return Doctor.create({
    userId,
    specialization,
    bio: bio || '',
    qualifications: qualifications || '',
    experienceYears: parseNonNegativeNumber(experienceYears, 'experienceYears'),
    availableHours: availableHours || '',
    isAvailable: String(isAvailable) === 'true',
    consultationFee: parseNonNegativeNumber(consultationFee, 'consultationFee'),
    slotDuration: duration,
    availableSlots: slots
  });
};

const getAllDoctors = async () => {
  return Doctor.find().sort({ createdAt: -1 });
};

const getDoctorByUserId = async (userId) => {
  if (!userId) {
    throw new ApiError(400, 'User ID is required');
  }
  ensureObjectId(userId, 'user id');

  const doctor = await Doctor.findOne({ userId });
  if (!doctor) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  // Lazy-fix for corrupted database data (slotDuration: "" or invalid slots)
  if (doctor.slotDuration === null || isNaN(Number(doctor.slotDuration)) || Number(doctor.slotDuration) <= 0 || (doctor.availableSlots.length === 1 && doctor.availableSlots[0] === "")) {
    console.log(`Self-healing profile for doctor ${doctor._id} (by userId)...`);
    doctor.slotDuration = 30;
    if (doctor.availableHours) {
        doctor.availableSlots = generateTimeSlots(doctor.availableHours, 30);
    } else {
        doctor.availableSlots = [];
    }
    await doctor.save();
  }

  return doctor;
};


// Returns doctor profile with populated user (name/email/phone) and formatted for frontend
const getDoctorProfileForFrontend = async (user) => {
  const userId = resolveUserId(user);
  if (!userId) {
    throw new ApiError(401, 'Invalid token payload: missing user id');
  }
  ensureObjectId(userId, 'user id in token payload');
  const doctor = await Doctor.findOne({ userId }).populate('userId', 'name email phone');
  if (!doctor) {
    throw new ApiError(404, 'Doctor profile not found');
  }
  const userObj = doctor.userId;
  return {
    name: userObj && userObj.name ? userObj.name : undefined,
    email: userObj && userObj.email ? userObj.email : undefined,
    phone: userObj && userObj.phone ? userObj.phone : undefined,
    specialization: doctor.specialization,
    bio: doctor.bio,
    qualifications: doctor.qualifications,
    experienceYears: doctor.experienceYears,
    availableHours: doctor.availableHours,
    isAvailable: doctor.isAvailable,
    consultationFee: doctor.consultationFee,
    // Add more fields as needed
  };
};

const updateMyAvailableHours = async (user, availableHours) => {
  const doctor = await getDoctorByUser(user);

  const trimmedHours = String(availableHours || '').trim();
  if (!trimmedHours) {
    throw new ApiError(400, 'availableHours is required');
  }

  doctor.availableHours = trimmedHours;
  
  // Also regenerate slots using current duration
  const duration = parseNonNegativeNumber(doctor.slotDuration, 'slotDuration', 30);
  doctor.availableSlots = generateTimeSlots(trimmedHours, duration);
  doctor.slotDuration = duration; // Sync back cleaned duration

  await doctor.save();

  return doctor;
};

const getAvailableDoctorsByTime = async (timeValue, filters = {}) => {
  if (!timeValue) {
    throw new ApiError(400, 'time is required');
  }

  const targetMinutes = parseTimeToMinutes(timeValue);
  if (targetMinutes === null) {
    throw new ApiError(400, 'Invalid time format');
  }

  const query = {
    isAvailable: true,
    ...(filters.specialization ? { specialization: filters.specialization } : {}),
  };

  const doctors = await Doctor.find(query).sort({ createdAt: -1 });
  return doctors.filter((doctor) => {
    const range = parseAvailableHoursRange(doctor.availableHours);
    return isTimeWithinRange(targetMinutes, range);
  });
};

const getDoctorById = async (id) => {
  ensureObjectId(id, 'doctor profile id');
  return Doctor.findById(id);
};

const getDoctorAvailability = async (id) => {
  const doctor = await getDoctorById(id);
  if (!doctor) return null;

  const range = parseAvailableHoursRange(doctor.availableHours);
  return {
    doctorId: doctor._id,
    isAvailable: doctor.isAvailable,
    availableHours: doctor.availableHours,
    availableSlots: doctor.availableSlots,
    slotDuration: doctor.slotDuration,
    parsedRange: range // { startMinutes, endMinutes, crossesMidnight }
  };
};

const updateDoctor = async (user, doctorId, payload) => {
  const userId = resolveUserId(user);
  if (!userId) {
    throw new ApiError(401, 'Invalid token payload: missing user id');
  }

  ensureObjectId(userId, 'user id in token payload');
  ensureObjectId(doctorId, 'doctor profile id');

  const existingDoctor = await Doctor.findById(doctorId);
  if (!existingDoctor) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  if (existingDoctor.userId.toString() !== userId.toString()) {
    throw new ApiError(403, 'You can update only your own doctor profile');
  }

  const allowedFields = ['specialization', 'bio', 'qualifications', 'experienceYears', 'availableHours', 'isAvailable', 'consultationFee', 'maxDailyAppointments', 'slotDuration'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      if (field === 'isAvailable') {
        updates[field] = String(payload[field]) === 'true';
      } else {
        updates[field] = payload[field];
      }
    }
  });

  if (updates.experienceYears !== undefined) {
    updates.experienceYears = parseNonNegativeNumber(updates.experienceYears, 'experienceYears');
  }

  if (updates.consultationFee !== undefined) {
    updates.consultationFee = parseNonNegativeNumber(updates.consultationFee, 'consultationFee');
  }

  // If availableHours or slotDuration changed, regenerate slots
  if (updates.availableHours !== undefined || updates.slotDuration !== undefined) {
    const hours = updates.availableHours !== undefined ? updates.availableHours : existingDoctor.availableHours;
    
    // Ensure duration is handled safely via our helper
    const durationInput = updates.slotDuration !== undefined ? updates.slotDuration : existingDoctor.slotDuration;
    const duration = parseNonNegativeNumber(durationInput, 'slotDuration', 30);
    
    // If it was in updates but was invalid, sync the cleaned value back
    if (updates.slotDuration !== undefined) updates.slotDuration = duration;
    
    updates.availableSlots = generateTimeSlots(hours, duration);
  }

  return Doctor.findByIdAndUpdate(doctorId, updates, {
    new: true,
    runValidators: true,
  });
};

const bookDoctorSlot = async (doctorId, slot) => {
  ensureObjectId(doctorId, 'doctor profile id');
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  if (!doctor.availableSlots.includes(slot)) {
    throw new ApiError(400, 'Slot is not available');
  }

  return Doctor.findByIdAndUpdate(doctorId,
    { $pull: { availableSlots: slot } },
    { new: true }
  );
};

const freeDoctorSlot = async (doctorId, slot) => {
  ensureObjectId(doctorId, 'doctor profile id');
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  // Use $addToSet to add the slot only if it doesn't already exist
  return Doctor.findByIdAndUpdate(doctorId,
    { $addToSet: { availableSlots: slot } },
    { new: true }
  );
};

const resetAllDoctorSlots = async () => {
  const doctors = await Doctor.find();
  const results = await Promise.all(doctors.map(async (doc) => {
    if (doctor.availableHours) {
    const duration = parseNonNegativeNumber(doc.slotDuration, 'slotDuration', 30);
    const rawSlots = generateTimeSlots(doc.availableHours, duration);
    const slots = (rawSlots || []).filter(s => s && s.trim() !== "");
    
    // Clean up the slotDuration in DB if it was bad
    return Doctor.findByIdAndUpdate(doc._id, { 
      availableSlots: slots,
      slotDuration: duration,
      isAvailable: String(doc.isAvailable) === 'true'
    });
  }
  }));
  return { updated: results.length };
};

const deleteDoctor = async (user, doctorId) => {
  const userId = resolveUserId(user);
  if (!userId) {
    throw new ApiError(401, 'Invalid token payload: missing user id');
  }

  ensureObjectId(userId, 'user id in token payload');
  ensureObjectId(doctorId, 'doctor profile id');

  const existingDoctor = await Doctor.findById(doctorId);
  if (!existingDoctor) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  if (existingDoctor.userId.toString() !== userId.toString()) {
    throw new ApiError(403, 'You can delete only your own doctor profile');
  }

  await Doctor.findByIdAndDelete(doctorId);
};

module.exports = {
  createDoctor,
  getAllDoctors,
  getDoctorByUserId,
  getDoctorById,
  getDoctorAvailability,
  getDoctorByUser,
  getCurrentDoctorProfile,
  getAvailableDoctorsByTime,
  updateMyAvailableHours,
  updateDoctor,
  deleteDoctor,
  getDoctorProfileForFrontend,
  bookDoctorSlot,
  freeDoctorSlot,
  resetAllDoctorSlots
};
