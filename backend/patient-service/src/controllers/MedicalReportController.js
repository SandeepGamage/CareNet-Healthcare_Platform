const path = require("path");
const mongoose = require("mongoose");
const { customAlphabet } = require("nanoid");

const MedicalReport = require("../models/MedicalReport");
const supabase = require("../utils/supabase");

const REPORT_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_REPORT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
]);

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

const buildReportLookup = (reportId, patientUserId) => {
  const orFilters = [{ medicalReportId: reportId }];

  if (mongoose.Types.ObjectId.isValid(reportId)) {
    orFilters.push({ _id: reportId });
  }

  return {
    patientUserId,
    $or: orFilters,
  };
};

const generateMedicalReportId = async () => {
  const counter = await Counter.findByIdAndUpdate(
    "medicalReportId",
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return `MR-${String(counter.seq).padStart(6, "0")}-${nanoToken()}`;
};

const getReportsBucket = () => process.env.SUPABASE_REPORTS_BUCKET || process.env.SUPABASE_BUCKET || "reports";
const isSupabaseConfigured = () => Boolean(supabase);

const getUploadedReportFile = (req) => {
  const candidate = req?.files?.report;
  if (!candidate) {
    return null;
  }

  return Array.isArray(candidate) ? candidate[0] : candidate;
};

const validateUploadedReportFile = (file) => {
  if (!file) {
    return "Medical report file is required.";
  }

  if (!ALLOWED_REPORT_MIME_TYPES.has(file.mimetype)) {
    return "Only PDF, JPG, JPEG, and PNG files are allowed.";
  }

  if (typeof file.size === "number" && file.size > REPORT_MAX_SIZE_BYTES) {
    return "Medical report file size must be 5MB or less.";
  }

  if (!file.data || !Buffer.isBuffer(file.data)) {
    return "Uploaded file payload is invalid.";
  }

  return null;
};

const buildSupabaseReportPath = (userId, originalFileName = "report") => {
  const extension = path.extname(originalFileName) || "";
  const safeUserId = String(userId || "unknown").replace(/[^a-zA-Z0-9_-]/g, "");
  return `reports/${safeUserId}/${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
};

const uploadReportToSupabase = async (file, userId) => {
  if (!supabase) {
    throw new Error("Supabase is not configured for patient-service.");
  }

  const bucket = getReportsBucket();
  const filePath = buildSupabaseReportPath(userId, file.name);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file.data, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload medical report to Supabase.");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return publicUrl;
};

const extractSupabasePathFromPublicUrl = (publicUrl, bucket) => {
  if (!publicUrl || !bucket) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex === -1) return null;

  const startIndex = markerIndex + marker.length;
  const pathWithPossibleQuery = publicUrl.slice(startIndex);
  return pathWithPossibleQuery.split("?")[0] || null;
};

const deleteReportFileFromSupabase = async (fileUrl) => {
  if (!supabase) return;

  const bucket = getReportsBucket();
  const filePath = extractSupabasePathFromPublicUrl(fileUrl, bucket);

  if (!filePath) return;

  const { error } = await supabase.storage.from(bucket).remove([filePath]);
  if (error) {
    console.warn("deleteReportFileFromSupabase warning:", error.message);
  }
};

const getReportsByPatientUserId = async (patientUserId) => {
  return MedicalReport.find({ patientUserId }).sort({ createdAt: -1 });
};

const getAllReports = async ({ skip = 0, limit = 100 }) => {
  return MedicalReport.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * @desc    Upload a medical report
 * @route   POST /api/patients/me/reports
 * @access  Private (patient)
 */
exports.uploadMedicalReport = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        success: false,
        message: "Supabase is not configured for patient-service uploads.",
      });
    }

    const userId = req.user.id;
    const { title, reportType, description } = req.body;
    const reportFile = getUploadedReportFile(req);

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Report title is required.",
      });
    }

    const fileValidationError = validateUploadedReportFile(reportFile);
    if (fileValidationError) {
      return res.status(400).json({
        success: false,
        message: fileValidationError,
      });
    }

    const fileUrl = await uploadReportToSupabase(reportFile, userId);

    const report = await MedicalReport.create({
      medicalReportId: await generateMedicalReportId(),
      patientUserId: userId,
      title,
      reportType: reportType || "general",
      description: description || null,
      fileUrl,
      fileName: reportFile.name,
      mimeType: reportFile.mimetype,
      fileSize: reportFile.size,
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
      message: error.message || "Server error uploading medical report.",
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

    const report = await MedicalReport.findOne(buildReportLookup(reportId, userId));

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
 * @desc    Update a specific report of logged-in patient
 * @route   PUT /api/patients/me/reports/:reportId
 * @access  Private (patient)
 */
exports.updateMyReport = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        success: false,
        message: "Supabase is not configured for patient-service uploads.",
      });
    }

    const userId = req.user.id;
    const { reportId } = req.params;
    const { title, reportType, description } = req.body;
    const reportFile = getUploadedReportFile(req);

    const report = await MedicalReport.findOne(buildReportLookup(reportId, userId));

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Medical report not found.",
      });
    }

    if (title !== undefined) {
      const trimmedTitle = String(title).trim();
      if (!trimmedTitle) {
        return res.status(400).json({
          success: false,
          message: "Report title cannot be empty.",
        });
      }
      report.title = trimmedTitle;
    }

    if (reportType !== undefined) {
      report.reportType = reportType || "general";
    }

    if (description !== undefined) {
      const trimmedDescription = String(description).trim();
      report.description = trimmedDescription || null;
    }

    // If a new report file is uploaded, replace file metadata and cleanup old file.
    if (reportFile) {
      const fileValidationError = validateUploadedReportFile(reportFile);
      if (fileValidationError) {
        return res.status(400).json({
          success: false,
          message: fileValidationError,
        });
      }

      await deleteReportFileFromSupabase(report.fileUrl);
      const fileUrl = await uploadReportToSupabase(reportFile, userId);

      report.fileUrl = fileUrl;
      report.fileName = reportFile.name;
      report.mimeType = reportFile.mimetype;
      report.fileSize = reportFile.size;
      report.uploadedBy = userId;
    }

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Medical report updated successfully.",
      data: report,
    });
  } catch (error) {
    console.error("updateMyReport error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error updating medical report.",
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

    const report = await MedicalReport.findOne(buildReportLookup(reportId, userId));

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Medical report not found.",
      });
    }

    await deleteReportFileFromSupabase(report.fileUrl);

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

/**
 * @desc    Admin - get all medical reports from all patients
 * @route   GET /api/patients/reports/all
 * @access  Private (admin)
 */
exports.getAllMedicalReports = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      getAllReports({ skip, limit }),
      MedicalReport.countDocuments({}),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      count: reports.length,
      totalPages: Math.ceil(total / limit) || 1,
      data: reports,
    });
  } catch (error) {
    console.error("getAllMedicalReports error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching all medical reports.",
    });
  }
};

exports.getReportsByPatientUserId = getReportsByPatientUserId;
