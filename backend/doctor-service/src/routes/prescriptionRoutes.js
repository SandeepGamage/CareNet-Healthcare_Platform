const express = require("express");
const { protect, authorizeDoctor, authorizeDoctorAdminPatient } = require("../middleware/authMiddleware");
const {
  createDigitalPrescription,
  getAllDigitalPrescriptions,
  getPrescriptionsByPatient,
  updateDigitalPrescription,
  deleteDigitalPrescription,
} = require("../controllers/prescriptionController");

const router = express.Router();

router.get("/", protect, authorizeDoctorAdminPatient, getAllDigitalPrescriptions);
router.get("/patient/:patientId", protect, authorizeDoctorAdminPatient, getPrescriptionsByPatient);
router.post("/", protect, authorizeDoctor, createDigitalPrescription);
router.put("/:id", protect, authorizeDoctor, updateDigitalPrescription);
router.delete("/:id", protect, authorizeDoctor, deleteDigitalPrescription);

module.exports = router;
