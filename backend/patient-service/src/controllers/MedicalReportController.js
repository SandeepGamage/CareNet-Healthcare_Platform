const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { customAlphabet } = require("nanoid");

const MedicalReport = require("../models/MedicalReport");

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema, "counters");
const nanoToken = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 4);

const generateMedicalReportId = async () => {
  const counter = await Counter.findByIdAndUpdate(
    "medicalReportId",
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return `MR-${String(counter.seq).padStart(6, "0")}-${nanoToken()}`;
};

const getReportsByPatientUserId = async (patientUserId) => {
  return MedicalReport.find({ patientUserId }).sort({ createdAt: -1 });
};

/**
 * @desc    Upload a medical report
 * @route   POST /api/patients/me/reports
 * @access  Private (patient)
 */
exports.uploadMedicalReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, reportType, description } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Report title is required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Medical report file is required.",
      });
    }

    const fileUrl = `/uploads/reports/${req.file.filename}`;

    const report = await MedicalReport.create({
      medicalReportId: await generateMedicalReportId(),
      patientUserId: userId,
      title,
      reportType: reportType || "general",
      description: description || null,
      fileUrl,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Medical report uploaded successfully.",
      data: report,
    });
  } catch (error) {
    console.error("uploadMedicalReport error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error uploading medical report.",
    });
  }
};

/**
 * @desc    Get all reports of logged-in patient
 * @route   GET /api/patients/me/reports
 * @access  Private (patient)
 */
exports.getMyReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const reports = await getReportsByPatientUserId(userId);

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("getMyReports error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching medical reports.",
    });
  }
};

/**
 * @desc    Get a specific report of logged-in patient
 * @route   GET /api/patients/me/reports/:reportId
 * @access  Private (patient)
 */
exports.getMyReportById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reportId } = req.params;

    const report = await MedicalReport.findOne({
      $or: [{ _id: reportId }, { medicalReportId: reportId }],
      patientUserId: userId,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Medical report not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("getMyReportById error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching medical report.",
    });
  }
};

/**
 * @desc    Delete a specific report of logged-in patient
 * @route   DELETE /api/patients/me/reports/:reportId
 * @access  Private (patient)
 */
exports.deleteMyReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reportId } = req.params;

    const report = await MedicalReport.findOne({
      $or: [{ _id: reportId }, { medicalReportId: reportId }],
      patientUserId: userId,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Medical report not found.",
      });
    }

    if (report.fileUrl) {
      const relativePath = report.fileUrl.replace(/^\/+/, "");
      const absolutePath = path.join(process.cwd(), relativePath);

      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    await MedicalReport.findByIdAndDelete(report._id);

    return res.status(200).json({
      success: true,
      message: "Medical report deleted successfully.",
    });
  } catch (error) {
    console.error("deleteMyReport error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error deleting medical report.",
    });
  }
};

/**
 * @desc    Doctor/Admin - get patient reports by user id
 * @route   GET /api/patients/:patientUserId/reports
 * @access  Private (doctor/admin)
 */
exports.getPatientReportsByUserId = async (req, res) => {
  try {
    const { patientUserId } = req.params;
    const reports = await getReportsByPatientUserId(patientUserId);

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("getPatientReportsByUserId error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching patient reports.",
    });
  }
};

exports.getReportsByPatientUserId = getReportsByPatientUserId;
