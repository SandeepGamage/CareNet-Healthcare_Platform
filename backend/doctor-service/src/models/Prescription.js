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
    medicationName: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      required: true,
      trim: true,
    },
    frequency: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    instructions: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model( "DigitalPrescription", digitalPrescriptionSchema,);
