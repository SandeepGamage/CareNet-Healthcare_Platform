const express = require("express");
const {
  protect,
  authorizeDoctor,
  authorizeDoctorAdminPatient,
} = require("../middleware/authMiddleware");
const {
  createProfile,
  getAllProfiles,
  updateProfile,
  deleteProfile,
} = require("../controllers/doctorController");

const router = express.Router();

router.get("/", protect, authorizeDoctorAdminPatient, getAllProfiles);
router.post("/", protect, authorizeDoctor, createProfile);
router.put("/:id", protect, authorizeDoctor, updateProfile);
router.delete("/:id", protect, authorizeDoctor, deleteProfile);

module.exports = router;
