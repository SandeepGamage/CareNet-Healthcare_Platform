const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { createDoctor, getAllDoctors, getAvailableDoctorsByTime, getDoctorByUserId, getDoctorById, getDoctorAvailability, updateDoctor, deleteDoctor, bookDoctorSlot, resetAllDoctorSlots } = require('../services/doctorService');

const normalizeDoctorPayload = (req, _res, next) => {
  if (req.body && req.body.consultationFee !== undefined) {
    req.body.consultationFee = Number(req.body.consultationFee);
  }
  next();
};

const createProfile = asyncHandler(async (req, res) => {
  const profile = await createDoctor(req.user, req.body);

  res.status(201).json({
    success: true,
    message: 'Doctor profile created successfully',
    data: profile,
  });
});

const getProfileMe = asyncHandler(async (req, res) => {
  const profile = await getDoctorByUserId(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Doctor profile fetched successfully',
    data: profile,
  });
});

const getAllProfiles = asyncHandler(async (_req, res) => {
  const profiles = await getAllDoctors();

  res.status(200).json({
    success: true,
    message: 'Doctor profiles fetched successfully',
    data: profiles,
  });
});


// Utility to format doctor profile for frontend
const formatDoctorProfile = (doctor, user) => {
  return {
    name: user && user.name ? user.name : undefined,
    email: user && user.email ? user.email : undefined,
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

const getMyProfile = asyncHandler(async (req, res) => {
  // Populate userId to get name/email
  const doctor = await getDoctorByUser(req.user);
  await doctor.populate('userId', 'name email');
  const user = doctor.userId;
  const profile = formatDoctorProfile(doctor, user);

  res.status(200).json({
    success: true,
    message: 'Doctor profile fetched successfully',
    data: profile,
  });
});

const updateMyProfileAvailableHours = asyncHandler(async (req, res) => {
  const profile = await updateMyAvailableHours(req.user, req.body?.availableHours);

  res.status(200).json({
    success: true,
    message: 'Available hours updated successfully',
    data: profile,
  });
});

const getAvailableProfilesByTime = asyncHandler(async (req, res) => {
  const { time, specialization } = req.query;
  const profiles = await getAvailableDoctorsByTime(time, { specialization });

  res.status(200).json({
    success: true,
    message: 'Available doctor profiles fetched successfully',
    data: profiles,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await updateDoctor(req.user, req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Doctor profile updated successfully',
    data: profile,
  });
});

const deleteProfile = asyncHandler(async (req, res) => {
  await deleteDoctor(req.user, req.params.id);

  res.status(200).json({
    success: true,
    message: 'Doctor profile deleted successfully',
  });
});

const bookSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { slot } = req.body;
  const profile = await bookDoctorSlot(id, slot);

  res.status(200).json({
    success: true,
    message: 'Slot booked successfully',
    data: profile,
  });
});

const resetAllSlots = asyncHandler(async (req, res) => {
  const result = await resetAllDoctorSlots();
  res.status(200).json({
    success: true,
    message: 'All doctor slots reset successfully',
    data: result
  });
});

const getProfileByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const profile = await getDoctorByUserId(userId);

  if (!profile) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  res.status(200).json({
    success: true,
    message: 'Doctor profile fetched successfully',
    data: profile,
  });
});

const getProfileById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const profile = await getDoctorById(id);

  if (!profile) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  const availability = await getDoctorAvailability(id);

  res.status(200).json({
    success: true,
    message: 'Doctor profile fetched successfully',
    data: {
      ...profile.toObject(),
      structuredAvailability: availability?.parsedRange || null
    },
  });
});

module.exports = {
  normalizeDoctorPayload,
  createProfile,
  getProfileMe,
  getAllProfiles,
  getMyProfile,
  getAvailableProfilesByTime,
  getProfileByUserId,
  getProfileById,
  updateMyProfileAvailableHours,
  updateProfile,
  deleteProfile,
  bookSlot,
  resetAllSlots,
};
