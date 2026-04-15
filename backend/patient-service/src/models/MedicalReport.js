const mongoose = require("mongoose");

const medicalReportSchema = new mongoose.Schema(
  {
    medicalReportId: {
      type: String,
      required: [true, "Medical report ID is required"],
      unique: true,
      index: true,
      trim: true,
    },
    patientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Patient user ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Report title is required"],
      trim: true,
    },
    reportType: {
      type: String,
      trim: true,
      default: "general",
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    fileName: {
      type: String,
      default: null,
    },
    mimeType: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Uploader ID is required"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MedicalReport", medicalReportSchema);