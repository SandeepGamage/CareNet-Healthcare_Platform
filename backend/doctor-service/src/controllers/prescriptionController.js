
const asyncHandler = require('../utils/asyncHandler');
const {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionsByPatientId,
  getPrescriptionsByDoctorId,
  updatePrescription,
  deletePrescription,
} = require('../services/prescriptionService');

// Get prescriptions by doctor
const getPrescriptionsByDoctor = asyncHandler(async (req, res) => {
  // doctorId can be from req.user (for logged-in doctor) or from params
  const doctorId = req.params.doctorId || (req.user && (req.user.id || req.user.userId || req.user._id));
  const prescriptions = await getPrescriptionsByDoctorId(req.user, doctorId);

  res.status(200).json({
    success: true,
    message: 'Prescriptions fetched successfully for doctor',
    data: prescriptions,
  });
});

const createDigitalPrescription = asyncHandler(async (req, res) => {
  const prescription = await createPrescription(req.user, req.body);

  res.status(201).json({
    success: true,
    message: 'Digital prescription created successfully',
    data: prescription,
  });
});

const getAllDigitalPrescriptions = asyncHandler(async (_req, res) => {
  const prescriptions = await getAllPrescriptions();

  res.status(200).json({
    success: true,
    message: 'Digital prescriptions fetched successfully',
    data: prescriptions,
  });
});

const getPrescriptionsByPatient = asyncHandler(async (req, res) => {
  const prescriptions = await getPrescriptionsByPatientId(req.user, req.params.patientId);

  res.status(200).json({
    success: true,
    message: 'Prescriptions fetched successfully for patient',
    data: prescriptions,
  });
});

const updateDigitalPrescription = asyncHandler(async (req, res) => {
  const updated = await updatePrescription(req.user, req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Digital prescription updated successfully',
    data: updated,
  });
});

const deleteDigitalPrescription = asyncHandler(async (req, res) => {
  await deletePrescription(req.user, req.params.id);

  res.status(200).json({
    success: true,
    message: 'Digital prescription deleted successfully',
  });
});

module.exports = {
  createDigitalPrescription,
  getAllDigitalPrescriptions,
  getPrescriptionsByPatient,
  getPrescriptionsByDoctor,
  updateDigitalPrescription,
  deleteDigitalPrescription,
};
