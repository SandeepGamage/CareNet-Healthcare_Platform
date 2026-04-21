const mongoose = require("mongoose");

const digitalPrescriptionSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: true,
      index: true,
    },
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    patientReportId: {
      type: String,
      required: true,
      index: true,
    },
    diagnosis: {
      type: String,
      required: true,
      trim: true,
    },
    // medications array - prefer using this for multiple medicines
    medications: {
      type: [
        {
          medicationName: { type: String, required: true, trim: true },
          dosage: { type: String, required: true, trim: true },
          frequency: { type: String, required: true, trim: true },
          duration: { type: String, required: true, trim: true },
          instructions: { type: String, trim: true, default: "" },
          notes: { type: String, trim: true, default: "" },
        },
      ],
      default: [],
    },
    // Deprecated single-med fields (kept for backward compatibility)
    medicationName: { type: String, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    duration: { type: String, trim: true },
    instructions: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model( "DigitalPrescription", digitalPrescriptionSchema,);
