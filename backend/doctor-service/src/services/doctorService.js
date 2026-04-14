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
  updateDoctor,
  deleteDoctor,
};
