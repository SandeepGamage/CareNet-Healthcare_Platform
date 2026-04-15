const express = require("express");
const router = express.Router();

const medicalReportController = require("../controllers/MedicalReportController");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

/**
 * ----------------------------------------------------------------
 * Medical report routes
 * ----------------------------------------------------------------
 */

// Upload medical report
router.post(
  "/me/reports",
  protect,
  authorize("patient"),
  upload.single("report"),
  medicalReportController.uploadMedicalReport
);

// Get all my medical reports
router.get(
  "/me/reports",
  protect,
  authorize("patient"),
  medicalReportController.getMyReports
);

// Get one of my reports
router.get(
  "/me/reports/:reportId",
  protect,
  authorize("patient"),
  medicalReportController.getMyReportById
);

// Update one of my reports
router.put(
  "/me/reports/:reportId",
  protect,
  authorize("patient"),
  upload.single("report"),
  medicalReportController.updateMyReport
);

// Delete one of my reports
router.delete(
  "/me/reports/:reportId",
  protect,
  authorize("patient"),
  medicalReportController.deleteMyReport
);

// Doctor/Admin: get all reports from all patients
router.get(
  "/reports/all",
  protect,
  authorize("doctor", "admin"),
  medicalReportController.getAllMedicalReports
);

// Doctor/Admin: get patient reports by user id
router.get(
  "/:patientUserId/reports",
  protect,
  authorize("doctor", "admin"),
  medicalReportController.getPatientReportsByUserId
);

module.exports = router;
