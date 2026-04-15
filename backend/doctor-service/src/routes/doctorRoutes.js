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
  getProfileByUserId,
  getProfileById,
  updateMyProfileAvailableHours,
  updateProfile,
  deleteProfile,
  bookSlot,
  resetAllSlots,
} = require("../controllers/doctorController");

const router = express.Router();

router.get("/", protect, authorizeDoctorAdminPatient, getAllProfiles);
// Returns formatted doctor profile for frontend
router.get("/me", protect, authorizeDoctor, getProfileMe);
router.get("/available", protect, authorizeDoctorAdminPatient, getAvailableProfilesByTime);
router.get("/user/:userId", protect, authorizeDoctorAdminPatient, getProfileByUserId);
router.get("/details/:id", protect, authorizeDoctorAdminPatient, getProfileById);
router.patch("/me/available-hours", protect, authorizeDoctor, updateMyProfileAvailableHours);
router.post("/", protect, authorizeDoctor, normalizeDoctorPayload, createProfile);
router.put("/:id", protect, authorizeDoctor, normalizeDoctorPayload, updateProfile);
router.patch("/book-slot/:id", protect, bookSlot); // Can be called by appointment service
router.post("/reset-slots", protect, resetAllSlots);
router.delete("/:id", protect, authorizeDoctor, deleteProfile);

module.exports = router;
