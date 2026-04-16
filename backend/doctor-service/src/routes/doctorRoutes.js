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
  freeSlot,
  resetAllSlots,
} = require("../controllers/doctorController");

const { getPrescriptionsByDoctor } = require('../controllers/prescriptionController');

const router = express.Router();
router.get("/", protect, authorizeDoctorAdminPatient, getAllProfiles);
// Route to get prescriptions for a doctor (doctorId optional, defaults to logged-in doctor)
router.get('/prescriptions/:doctorId?', protect, authorizeDoctor, getPrescriptionsByDoctor);
router.get("/me", protect, authorizeDoctor, getMyProfile);
router.get("/available", protect, authorizeDoctorAdminPatient, getAvailableProfilesByTime);
router.get("/user/:userId", protect, authorizeDoctorAdminPatient, getProfileByUserId);
router.get("/details/:id", protect, authorizeDoctorAdminPatient, getProfileById);
router.patch("/me/available-hours", protect, authorizeDoctor, updateMyProfileAvailableHours);
router.post("/", protect, authorizeDoctor, normalizeDoctorPayload, createProfile);
router.put("/:id", protect, authorizeDoctor, normalizeDoctorPayload, updateProfile);
router.patch("/book-slot/:id", protect, bookSlot); // Can be called by appointment service
router.patch("/free-slot/:id", protect, freeSlot); // Can be called by appointment service
router.post("/reset-slots", protect, resetAllSlots);
router.delete("/:id", protect, authorizeDoctor, deleteProfile);

module.exports = router;
