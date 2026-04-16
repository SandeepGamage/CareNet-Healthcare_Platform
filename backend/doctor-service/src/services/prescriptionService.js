const mongoose = require('mongoose');
const DigitalPrescription = require('../models/Prescription');
const ApiError = require('../utils/ApiError');

const resolveUserId = (user = {}) => user.id || user.userId || user._id || null;

const ensureObjectId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
};

const createPrescription = async (user, payload) => {
  const doctorId = resolveUserId(user);
  if (!doctorId) {
    throw new ApiError(401, 'Invalid token payload: missing user id');
  }

  const { patientId, patientReportId, diagnosis, medicationName, dosage, frequency, duration, instructions, notes } = payload;

  if (!patientId || !patientReportId || !diagnosis || !medicationName || !dosage || !frequency || !duration) {
    throw new ApiError(400, 'patientId, patientReportId, diagnosis, medicationName, dosage, frequency and duration are required');
  }

  return DigitalPrescription.create({
    doctorId,
    patientId,
    patientReportId,
    diagnosis,
    medicationName,
    dosage,
    frequency,
    duration,
    instructions: instructions || '',
    notes: notes || '',
  });
};

const getAllPrescriptions = async () => {
  return DigitalPrescription.find().sort({ createdAt: -1 });
};

const getPrescriptionsByPatientId = async (user, patientId) => {
  const role = (user?.role || '').toUpperCase();
  const requesterId = resolveUserId(user);

  if (!patientId) {
    throw new ApiError(400, 'patient id is required');
  }

  if (role === 'PATIENT' && requesterId !== patientId) {
    throw new ApiError(403, 'Patients can only view their own prescriptions');
  }

  return DigitalPrescription.find({ patientId }).sort({ createdAt: -1 });
};

const updatePrescription = async (user, prescriptionId, payload) => {
  const doctorId = resolveUserId(user);
  ensureObjectId(prescriptionId, 'prescription id');

  const existing = await DigitalPrescription.findById(prescriptionId);
  if (!existing) {
    throw new ApiError(404, 'Prescription not found');
  }

  if (existing.doctorId.toString() !== doctorId) {
    throw new ApiError(403, 'You can update only your own prescriptions');
  }

  const allowedFields = ['patientReportId', 'diagnosis', 'medicationName', 'dosage', 'frequency', 'duration', 'instructions', 'notes'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) updates[field] = payload[field];
  });

  return DigitalPrescription.findByIdAndUpdate(prescriptionId, updates, {
    new: true,
    runValidators: true,
  });
};

const deletePrescription = async (user, prescriptionId) => {
  const doctorId = resolveUserId(user);
  ensureObjectId(prescriptionId, 'prescription id');

  const existing = await DigitalPrescription.findById(prescriptionId);
  if (!existing) {
    throw new ApiError(404, 'Prescription not found');
  }

  if (existing.doctorId.toString() !== doctorId) {
    throw new ApiError(403, 'You can delete only your own prescriptions');
  }

  await DigitalPrescription.findByIdAndDelete(prescriptionId);
};


// Get prescriptions by doctorId
const getPrescriptionsByDoctorId = async (user, doctorId) => {
  const role = (user?.role || '').toUpperCase();
  const requesterId = resolveUserId(user);

  if (!doctorId) {
    throw new ApiError(400, 'doctor id is required');
  }

  // Only the doctor themselves or an admin can view their prescriptions
  if (role === 'DOCTOR' && requesterId !== doctorId) {
    throw new ApiError(403, 'Doctors can only view their own prescriptions');
  }

  return DigitalPrescription.find({ doctorId }).sort({ createdAt: -1 });
};

module.exports = {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionsByPatientId,
  getPrescriptionsByDoctorId,
  updatePrescription,
  deletePrescription,
};
