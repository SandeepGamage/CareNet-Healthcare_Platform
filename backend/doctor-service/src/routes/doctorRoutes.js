const express = require("express");
const {
  protect,
  authorizeDoctor,
  authorizeDoctorAdminPatient,
} = require("../middleware/authMiddleware");
const {
  normalizeDoctorPayload,
  createProfile,
  getProfileMe,
  getAllProfiles,
  getMyProfile,
  getAvailableProfilesByTime,
  updateMyProfileAvailableHours,
  updateProfile,
  deleteProfile,
} = require("../controllers/doctorController");

const router = express.Router();

router.get("/", protect, authorizeDoctorAdminPatient, getAllProfiles);
// Returns formatted doctor profile for frontend
router.get("/me", protect, authorizeDoctor, getProfileMe);
router.get("/available", protect, authorizeDoctorAdminPatient, getAvailableProfilesByTime);
router.patch("/me/available-hours", protect, authorizeDoctor, updateMyProfileAvailableHours);
router.post("/", protect, authorizeDoctor, normalizeDoctorPayload, createProfile);
router.put("/:id", protect, authorizeDoctor, normalizeDoctorPayload, updateProfile);
router.delete("/:id", protect, authorizeDoctor, deleteProfile);

module.exports = router;
