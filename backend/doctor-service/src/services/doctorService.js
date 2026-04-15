const mongoose = require('mongoose');
const Doctor = require('../models/doctor');
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

  const twentyFourHourMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    return hours * 60 + minutes;
  }

  return null;
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

  const { specialization, bio, qualifications, experienceYears, availableHours, isAvailable, consultationFee } = payload;

  if (!specialization) {
    throw new ApiError(400, 'specialization is required');
  }

  return Doctor.create({
    userId,
    specialization,
    bio: bio || '',
    qualifications: qualifications || '',
    experienceYears: parseNonNegativeNumber(experienceYears, 'experienceYears'),
    availableHours: availableHours || '',
    isAvailable: typeof isAvailable === 'boolean' ? isAvailable : false,
    consultationFee: parseNonNegativeNumber(consultationFee, 'consultationFee'),
  });
};

const getAllDoctors = async () => {
  return Doctor.find().sort({ createdAt: -1 });
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

  const allowedFields = ['specialization', 'bio', 'qualifications', 'experienceYears', 'availableHours', 'isAvailable', 'consultationFee'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) updates[field] = payload[field];
  });

  if (updates.experienceYears !== undefined) {
    updates.experienceYears = parseNonNegativeNumber(updates.experienceYears, 'experienceYears');
  }

  if (updates.consultationFee !== undefined) {
    updates.consultationFee = parseNonNegativeNumber(updates.consultationFee, 'consultationFee');
  }

  return Doctor.findByIdAndUpdate(doctorId, updates, {
    new: true,
    runValidators: true,
  });
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
  getAvailableDoctorsByTime,
  updateDoctor,
  deleteDoctor,
};
