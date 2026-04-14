const fs = require("fs");
const path = require("path");
const axios = require("axios");

const PatientProfile = require("../models/PatientProfile");
const MedicalReport = require("../models/MedicalReport");

/**
 * Helper: safely normalize incoming array-like fields.
 * Supports:
 * - already an array
 * - comma-separated string
 * - single string
 */
const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    // Try parsing JSON array first
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch (err) {
      // ignore JSON parse error and continue
    }

    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

/**
 * Fetch prescription data from doctor-service.
 * Endpoint template supports :patientUserId placeholder.
 */
const fetchPrescriptionsFromDoctorService = async (patientUserId, authHeader) => {
  const doctorServiceBaseUrl =
    process.env.DOCTOR_SERVICE_URL || process.env.PRESCRIPTION_SERVICE_URL || "http://localhost:5001";
  const endpointTemplate =
    process.env.DOCTOR_PRESCRIPTION_ENDPOINT_TEMPLATE ||
    "/api/doctors/prescriptions/patient/:patientUserId";

  const endpoint = endpointTemplate.replace(":patientUserId", String(patientUserId));
  const url = `${doctorServiceBaseUrl.replace(/\/$/, "")}${endpoint}`;

  try {
    const response = await axios.get(url, {
      headers: authHeader ? { Authorization: authHeader } : {},
      timeout: 5000,
    });

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (Array.isArray(response.data?.data)) {
      return response.data.data;
    }

    if (Array.isArray(response.data?.prescriptions)) {
      return response.data.prescriptions;
    }

    return [];
  } catch (error) {
    console.error("fetchPrescriptionsFromDoctorService error:", error.message);
    return [];
  }
};

/**
 * @desc    Get logged-in patient's profile
 * @route   GET /api/patients/me/profile
 * @access  Private (patient)
 */
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await PatientProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found. Create profile first.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient profile fetched successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("getMyProfile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching patient profile.",
    });
  }
};

/**
 * @desc    Create logged-in patient's profile with required fields
 * @route   POST /api/patients/me/profile
 * @access  Private (patient)
 */
exports.createMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      dateOfBirth,
      gender,
      address,
      bloodGroup,
      allergies,
      chronicConditions,
      emergencyContactName,
      emergencyContactPhone,
      profileImage,
    } = req.body;

    const existingProfile = await PatientProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: "Patient profile already exists. Use update profile endpoint.",
      });
    }

    if (!dateOfBirth || !gender || !address || !emergencyContactName || !emergencyContactPhone) {
      return res.status(400).json({
        success: false,
        message:
          "dateOfBirth, gender, address, emergencyContactName, and emergencyContactPhone are required.",
      });
    }

    const allowedGenders = ["male", "female", "other"];
    const normalizedGender = String(gender).toLowerCase();
    if (!allowedGenders.includes(normalizedGender)) {
      return res.status(400).json({
        success: false,
        message: "gender must be one of: male, female, other.",
      });
    }

    const profile = await PatientProfile.create({
      userId,
      dateOfBirth,
      gender: normalizedGender,
      address,
      bloodGroup: bloodGroup || null,
      allergies: normalizeStringArray(allergies),
      chronicConditions: normalizeStringArray(chronicConditions),
      emergencyContactName,
      emergencyContactPhone,
      profileImage: profileImage || null,
    });

    return res.status(201).json({
      success: true,
      message: "Patient profile created successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("createMyProfile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error creating patient profile.",
    });
  }
};

/**
 * @desc    Update logged-in patient's profile
 * @route   PUT /api/patients/me/profile
 * @access  Private (patient)
 */
exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      dateOfBirth,
      gender,
      address,
      bloodGroup,
      allergies,
      chronicConditions,
      emergencyContactName,
      emergencyContactPhone,
      profileImage,
    } = req.body;

    const profile = await PatientProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found. Create profile first.",
      });
    }

    // Update only patient-service-owned fields
    if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth || null;
    if (gender !== undefined) profile.gender = gender || null;
    if (address !== undefined) profile.address = address || null;
    if (bloodGroup !== undefined) profile.bloodGroup = bloodGroup || null;
    if (allergies !== undefined) profile.allergies = normalizeStringArray(allergies);
    if (chronicConditions !== undefined) {
      profile.chronicConditions = normalizeStringArray(chronicConditions);
    }
    if (emergencyContactName !== undefined) {
      profile.emergencyContactName = emergencyContactName || null;
    }
    if (emergencyContactPhone !== undefined) {
      profile.emergencyContactPhone = emergencyContactPhone || null;
    }
    if (profileImage !== undefined) profile.profileImage = profileImage || null;

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Patient profile updated successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("updateMyProfile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error updating patient profile.",
    });
  }
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

    const reports = await MedicalReport.find({ patientUserId: userId }).sort({
      createdAt: -1,
    });

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
      _id: reportId,
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
      _id: reportId,
      patientUserId: userId,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Medical report not found.",
      });
    }

    // Delete physical file if it exists locally
    if (report.fileUrl) {
      const relativePath = report.fileUrl.replace(/^\/+/, "");
      const absolutePath = path.join(process.cwd(), relativePath);

      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    await MedicalReport.findByIdAndDelete(reportId);

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
 * @desc    Get patient history summary
 * @route   GET /api/patients/me/history
 * @access  Private (patient)
 */
exports.getMyHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await PatientProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found. Create profile first.",
      });
    }

    const reports = await MedicalReport.find({ patientUserId: userId }).sort({
      createdAt: -1,
    });

    const prescriptions = await fetchPrescriptionsFromDoctorService(
      userId,
      req.headers.authorization
    );
    const appointments = [];

    return res.status(200).json({
      success: true,
      message: "Patient history fetched successfully.",
      data: {
        profile,
        reports,
        prescriptions,
        appointments,
      },
    });
  } catch (error) {
    console.error("getMyHistory error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching patient history.",
    });
  }
};

/**
 * @desc    Get logged-in patient's prescriptions
 * @route   GET /api/patients/me/prescriptions
 * @access  Private (patient)
 */
exports.getMyPrescriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const prescriptions = await fetchPrescriptionsFromDoctorService(
      userId,
      req.headers.authorization
    );

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    console.error("getMyPrescriptions error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching prescriptions.",
    });
  }
};

/**
 * @desc    Doctor/Admin/Internal - get patient profile by user id
 * @route   GET /api/patients/:patientUserId/profile
 * @access  Private (doctor/admin/internal)
 */
exports.getPatientProfileByUserId = async (req, res) => {
  try {
    const { patientUserId } = req.params;

    const profile = await PatientProfile.findOne({ userId: patientUserId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("getPatientProfileByUserId error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching patient profile.",
    });
  }
};

/**
 * @desc    Doctor/Admin/Internal - get patient reports by user id
 * @route   GET /api/patients/:patientUserId/reports
 * @access  Private (doctor/admin/internal)
 */
exports.getPatientReportsByUserId = async (req, res) => {
  try {
    const { patientUserId } = req.params;

    const reports = await MedicalReport.find({ patientUserId }).sort({
      createdAt: -1,
    });

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
 * @desc    Doctor/Admin/Internal - get patient history by user id
 * @route   GET /api/patients/:patientUserId/history
 * @access  Private (doctor/admin/internal)
 */
exports.getPatientHistoryByUserId = async (req, res) => {
  try {
    const { patientUserId } = req.params;

    const profile = await PatientProfile.findOne({ userId: patientUserId });
    const reports = await MedicalReport.find({ patientUserId }).sort({
      createdAt: -1,
    });

    const prescriptions = await fetchPrescriptionsFromDoctorService(
      patientUserId,
      req.headers.authorization
    );

    return res.status(200).json({
      success: true,
      data: {
        profile,
        reports,
        prescriptions,
        appointments: [],
      },
    });
  } catch (error) {
    console.error("getPatientHistoryByUserId error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching patient history.",
    });
  }
};

/**
 * @desc    Doctor/Admin - get patient prescriptions by user id
 * @route   GET /api/patients/:patientUserId/prescriptions
 * @access  Private (doctor/admin)
 */
exports.getPatientPrescriptionsByUserId = async (req, res) => {
  try {
    const { patientUserId } = req.params;
    const prescriptions = await fetchPrescriptionsFromDoctorService(
      patientUserId,
      req.headers.authorization
    );

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    console.error("getPatientPrescriptionsByUserId error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching patient prescriptions.",
    });
  }
};