const mongoose = require('mongoose');
const Doctor = require('../models/doctor');
const ApiError = require('../utils/ApiError');

const resolveUserId = (user = {}) => user.id || user.userId || user._id || null;

const ensureObjectId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
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

  const { specialization, bio, qualifications, experienceYears, availability } = payload;

  if (!specialization) {
    throw new ApiError(400, 'specialization is required');
  }

  return Doctor.create({
    userId,
    specialization,
    bio: bio || '',
    qualifications: qualifications || '',
    experienceYears: Number.isFinite(Number(experienceYears)) ? Number(experienceYears) : 0,
    availability: availability || '',
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

  const allowedFields = ['specialization', 'bio', 'qualifications', 'experienceYears', 'availability'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) updates[field] = payload[field];
  });

  if (updates.experienceYears !== undefined) {
    updates.experienceYears = Number(updates.experienceYears);
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
