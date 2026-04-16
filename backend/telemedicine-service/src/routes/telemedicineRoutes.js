const router = require("express").Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createSessionForAppointment,
  joinSession,
  endSession,
  getMySessions,
  getSessionByAppointmentId,
} = require("../controllers/telemedicineController");

router.post("/sessions", protect, authorize("doctor", "admin"), createSessionForAppointment);
router.get("/sessions/my", protect, authorize("doctor", "patient", "admin"), getMySessions);
router.get(
  "/sessions/appointment/:appointmentId",
  protect,
  authorize("doctor", "patient", "admin"),
  getSessionByAppointmentId
);
router.post(
  "/sessions/appointment/:appointmentId/join",
  protect,
  authorize("doctor", "patient", "admin"),
  joinSession
);
router.post(
  "/sessions/appointment/:appointmentId/end",
  protect,
  authorize("doctor", "admin"),
  endSession
);

module.exports = router;
