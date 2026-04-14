const asyncHandler = require('../utils/asyncHandler');
const { createDoctor, getAllDoctors, updateDoctor, deleteDoctor } = require('../services/doctorService');

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

const getAllProfiles = asyncHandler(async (_req, res) => {
  const profiles = await getAllDoctors();

  res.status(200).json({
    success: true,
    message: 'Doctor profiles fetched successfully',
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

module.exports = {
  normalizeDoctorPayload,
  createProfile,
  getAllProfiles,
  updateProfile,
  deleteProfile,
};
