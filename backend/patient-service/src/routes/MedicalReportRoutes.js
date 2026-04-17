const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");

const medicalReportController = require("../controllers/MedicalReportController");
const { protect, authorize } = require("../middleware/authMiddleware");

const reportUploadMiddleware = fileUpload({
  useTempFiles: false,
  abortOnLimit: false,
  limits: { fileSize: 5 * 1024 * 1024 },
});

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
  reportUploadMiddleware,
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
  reportUploadMiddleware,
  medicalReportController.updateMyReport
);

// Delete one of my reports
router.delete(
  "/me/reports/:reportId",
  protect,
  authorize("patient"),
  medicalReportController.deleteMyReport
);

// Doctor/Admin: get patient reports by user id
router.get(
  "/:patientUserId/reports",
  protect,
  authorize("doctor", "admin"),
  medicalReportController.getPatientReportsByUserId
);

// Doctor/Admin: get all reports from all patients
router.get(
  "/reports/all",
  protect,
  authorize("doctor", "admin"),
  medicalReportController.getAllMedicalReports
);

module.exports = router;
