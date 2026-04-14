const express = require("express");
const router = express.Router();

const patientController = require("../controllers/PatientController");

// Adjust these imports to match your project
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

/**
 * ----------------------------------------------------------------
 * Patient self-service routes
 * ----------------------------------------------------------------
 */

// Get logged-in patient profile
router.get(
  "/me/profile",
  protect,
  authorize("patient"),
  patientController.getMyProfile
);

// Create logged-in patient profile
router.post(
  "/me/profile",
  protect,
  authorize("patient"),
  patientController.createMyProfile
);

// Update logged-in patient profile
router.put(
  "/me/profile",
  protect,
  authorize("patient"),
  patientController.updateMyProfile
);

// Upload medical report
router.post(
  "/me/reports",
  protect,
  authorize("patient"),
  upload.single("report"),
  patientController.uploadMedicalReport
);

// Get all my medical reports
router.get(
  "/me/reports",
  protect,
  authorize("patient"),
  patientController.getMyReports
);

// Get one of my reports
router.get(
  "/me/reports/:reportId",
  protect,
  authorize("patient"),
  patientController.getMyReportById
);

// Delete one of my reports
router.delete(
  "/me/reports/:reportId",
  protect,
  authorize("patient"),
  patientController.deleteMyReport
);

// Get patient history summary
router.get(
  "/me/history",
  protect,
  authorize("patient"),
  patientController.getMyHistory
);

// Get logged-in patient's prescriptions
router.get(
  "/me/prescriptions",
  protect,
  authorize("patient"),
  patientController.getMyPrescriptions
);

/**
 * ----------------------------------------------------------------
 * Doctor/Admin access routes
 * ----------------------------------------------------------------
 * Doctors and admins can view patient records.
 * You can later tighten this further by checking appointment ownership.
 */
router.get(
  "/:patientUserId/profile",
  protect,
  authorize("doctor", "admin"),
  patientController.getPatientProfileByUserId
);

router.get(
  "/:patientUserId/reports",
  protect,
  authorize("doctor", "admin"),
  patientController.getPatientReportsByUserId
);

router.get(
  "/:patientUserId/history",
  protect,
  authorize("doctor", "admin"),
  patientController.getPatientHistoryByUserId
);

router.get(
  "/:patientUserId/prescriptions",
  protect,
  authorize("doctor", "admin"),
  patientController.getPatientPrescriptionsByUserId
);

module.exports = router;