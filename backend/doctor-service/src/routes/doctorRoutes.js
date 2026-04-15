const express = require("express");
const {
  protect,
  authorizeDoctor,
  authorizeDoctorAdminPatient,
} = require("../middleware/authMiddleware");
const {
  normalizeDoctorPayload,
  createProfile,
  getAllProfiles,
  getAvailableProfilesByTime,
  updateProfile,
  deleteProfile,
} = require("../controllers/doctorController");

const router = express.Router();

router.get("/", protect, authorizeDoctorAdminPatient, getAllProfiles);
router.get("/available", protect, authorizeDoctorAdminPatient, getAvailableProfilesByTime);
router.post("/", protect, authorizeDoctor, normalizeDoctorPayload, createProfile);
router.put("/:id", protect, authorizeDoctor, normalizeDoctorPayload, updateProfile);
router.delete("/:id", protect, authorizeDoctor, deleteProfile);

module.exports = router;
