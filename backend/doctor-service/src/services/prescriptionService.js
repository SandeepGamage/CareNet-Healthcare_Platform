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

  const { patientId, patientReportId, diagnosis, medications } = payload;

  if (!patientId || !patientReportId || !diagnosis) {
    throw new ApiError(400, 'patientId, patientReportId and diagnosis are required');
  }

  // Accept either an array of medications or fallback to singular medication fields
  let medsArray = [];
  if (Array.isArray(medications) && medications.length > 0) {
    medsArray = medications.map((m) => ({
      medicationName: (m.medicationName || m.name || '').toString(),
      dosage: (m.dosage || '').toString(),
      frequency: (m.frequency || '').toString(),
      duration: (m.duration || '').toString(),
      instructions: (m.instructions || '').toString(),
      notes: (m.notes || '').toString(),
    }));
    // basic validation: ensure required fields exist on first med
    const first = medsArray[0];
    if (!first.medicationName || !first.dosage || !first.frequency || !first.duration) {
      throw new ApiError(400, 'Each medication requires medicationName, dosage, frequency and duration');
    }
  } else {
    // Try to read legacy single medication fields
    const { medicationName, dosage, frequency, duration, instructions, notes } = payload;
    if (!medicationName || !dosage || !frequency || !duration) {
      throw new ApiError(400, 'patientId, patientReportId, diagnosis and at least one medication (medications array or medicationName/dosage/frequency/duration) are required');
    }
    medsArray = [{ medicationName, dosage, frequency, duration, instructions: instructions || '', notes: notes || '' }];
  }

  return DigitalPrescription.create({
    doctorId,
    patientId,
    patientReportId,
    diagnosis,
    medications: medsArray,
    // keep legacy top-level fields for compatibility (populate from first med)
    medicationName: medsArray[0].medicationName,
    dosage: medsArray[0].dosage,
    frequency: medsArray[0].frequency,
    duration: medsArray[0].duration,
    instructions: medsArray[0].instructions || '',
    notes: medsArray[0].notes || '',
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

  const allowedFields = ['patientReportId', 'diagnosis', 'medicationName', 'dosage', 'frequency', 'duration', 'instructions', 'notes', 'medications'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) updates[field] = payload[field];
  });

  // If medications array is provided, keep legacy top-level single-med fields in sync
  if (Array.isArray(payload.medications) && payload.medications.length > 0) {
    const first = payload.medications[0];
    updates.medicationName = first.medicationName || first.name || updates.medicationName;
    updates.dosage = first.dosage || updates.dosage;
    updates.frequency = first.frequency || updates.frequency;
    updates.duration = first.duration || updates.duration;
    updates.instructions = first.instructions || updates.instructions || '';
    updates.notes = first.notes || updates.notes || '';
  }

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
