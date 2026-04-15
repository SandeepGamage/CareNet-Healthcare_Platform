const { customAlphabet } = require("nanoid");
const TelemedicineSession = require("../models/TelemedicineSession");
const { fetchAppointmentById } = require("../services/appointmentService");
const {
  buildRoomName,
  buildRoomUrl,
  buildParticipantConfig,
  signJitsiJwt,
} = require("../services/jitsiService");

const sessionToken = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);

const normalizeRole = (role) => String(role || "").toLowerCase();

const isUserAllowedForAppointment = (appointment, user) => {
  const role = normalizeRole(user.role);

  if (role === "admin") {
    return true;
  }

  if (role === "doctor") {
    return String(appointment.doctorId) === String(user.id);
  }

  if (role === "patient") {
    return String(appointment.patientId) === String(user.id);
  }

  return false;
};

const validateTelemedicineAppointment = (appointment) => {
  if (!appointment) {
    return "Appointment not found.";
  }

  if (appointment.type && String(appointment.type).toUpperCase() !== "TELEMEDICINE") {
    return "Appointment is not marked as TELEMEDICINE.";
  }

  const blockedStatuses = ["CANCELLED", "COMPLETED"];
  if (blockedStatuses.includes(String(appointment.status || "").toUpperCase())) {
    return `Cannot start session for ${String(appointment.status).toLowerCase()} appointment.`;
  }

  return null;
};

const addParticipantJoin = (session, user) => {
  const role = normalizeRole(user.role);
  const existing = session.participants.find(
    (participant) =>
      String(participant.userId) === String(user.id) &&
      String(participant.role) === role &&
      participant.leftAt === null
  );

  if (!existing) {
    session.participants.push({
      userId: String(user.id),
      role,
      joinedAt: new Date(),
      leftAt: null,
    });
  }
};

exports.createSessionForAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "appointmentId is required.",
      });
    }

    const role = normalizeRole(req.user.role);
    if (!["doctor", "admin", "patient"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Only doctor, patient, or admin can create/view telemedicine session.",
      });
    }

    let session = await TelemedicineSession.findOne({ appointmentId: String(appointmentId) });

    const appointmentResponse = await fetchAppointmentById(
      appointmentId,
      req.headers.authorization
    );
    const appointment = appointmentResponse?.appointment || appointmentResponse;

    if (!isUserAllowedForAppointment(appointment, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this appointment.",
      });
    }

    const validationError = validateTelemedicineAppointment(appointment);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    if (!session) {
      const roomName = buildRoomName(appointmentId);
      const roomUrl = buildRoomUrl(roomName);

      session = await TelemedicineSession.create({
        sessionId: `TM-${sessionToken()}`,
        appointmentId: String(appointmentId),
        roomName,
        roomUrl,
        doctorId: String(appointment.doctorId),
        patientId: String(appointment.patientId),
        doctorName: appointment.doctorName || null,
        patientName: appointment.patientName || null,
        scheduledAt: appointment.appointmentDate ? new Date(appointment.appointmentDate) : null,
        status: "SCHEDULED",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Telemedicine session prepared successfully.",
      data: session,
    });
  } catch (error) {
    console.error("createSessionForAppointment error:", error.message);

    if (error.response) {
      return res.status(error.response.status || 502).json({
        success: false,
        message: error.response.data?.message || "Appointment service request failed.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error creating telemedicine session.",
    });
  }
};

exports.joinSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const session = await TelemedicineSession.findOne({ appointmentId: String(appointmentId) });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Telemedicine session not found for this appointment.",
      });
    }

    const appointmentResponse = await fetchAppointmentById(
      appointmentId,
      req.headers.authorization
    );
    const appointment = appointmentResponse?.appointment || appointmentResponse;

    if (!isUserAllowedForAppointment(appointment, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this appointment.",
      });
    }

    if (session.status === "ENDED" || session.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: `Cannot join a ${session.status.toLowerCase()} session.`,
      });
    }

    if (session.status === "SCHEDULED") {
      session.status = "LIVE";
      session.startedAt = session.startedAt || new Date();
    }

    addParticipantJoin(session, req.user);
    await session.save();

    const userRole = normalizeRole(req.user.role);
    const enforceJitsiJwt =
      String(process.env.JITSI_ENFORCE_JWT || "false").toLowerCase() === "true";

    const jitsiJwt = signJitsiJwt({
      roomName: session.roomName,
      userId: req.user.id,
      role: userRole,
      name: req.user.name,
      email: req.user.email,
    });

    if (enforceJitsiJwt && !jitsiJwt) {
      return res.status(500).json({
        success: false,
        message:
          "Jitsi secure mode is enabled but JITSI_APP_ID/JITSI_APP_SECRET are not configured.",
      });
    }

    const joinPayload = {
      domain: process.env.JITSI_DOMAIN || "meet.jit.si",
      roomName: session.roomName,
      roomUrl: session.roomUrl,
      jwt: jitsiJwt || null,
      participant: buildParticipantConfig({
        role: userRole,
        name: req.user.name,
        email: req.user.email,
      }),
      session: {
        sessionId: session.sessionId,
        appointmentId: session.appointmentId,
        status: session.status,
        startedAt: session.startedAt,
      },
    };

    return res.status(200).json({
      success: true,
      message: "Session join configuration generated successfully.",
      data: joinPayload,
    });
  } catch (error) {
    console.error("joinSession error:", error.message);

    if (error.response) {
      return res.status(error.response.status || 502).json({
        success: false,
        message: error.response.data?.message || "Appointment service request failed.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error generating session join configuration.",
    });
  }
};

exports.endSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const session = await TelemedicineSession.findOne({ appointmentId: String(appointmentId) });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Telemedicine session not found for this appointment.",
      });
    }

    const appointmentResponse = await fetchAppointmentById(
      appointmentId,
      req.headers.authorization
    );
    const appointment = appointmentResponse?.appointment || appointmentResponse;

    if (!isUserAllowedForAppointment(appointment, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this appointment.",
      });
    }

    const role = normalizeRole(req.user.role);
    if (!["doctor", "admin"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Only doctor or admin can end the session.",
      });
    }

    session.status = "ENDED";
    session.endedAt = new Date();

    session.participants = session.participants.map((participant) => {
      if (!participant.leftAt) {
        return {
          ...participant.toObject(),
          leftAt: new Date(),
        };
      }
      return participant;
    });

    await session.save();

    return res.status(200).json({
      success: true,
      message: "Session ended successfully.",
      data: session,
    });
  } catch (error) {
    console.error("endSession error:", error.message);

    if (error.response) {
      return res.status(error.response.status || 502).json({
        success: false,
        message: error.response.data?.message || "Appointment service request failed.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error ending telemedicine session.",
    });
  }
};

exports.getMySessions = async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    const userId = String(req.user.id);

    const query = {};
    if (role === "doctor") {
      query.doctorId = userId;
    } else if (role === "patient") {
      query.patientId = userId;
    }

    const sessions = await TelemedicineSession.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    console.error("getMySessions error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching telemedicine sessions.",
    });
  }
};

exports.getSessionByAppointmentId = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const session = await TelemedicineSession.findOne({ appointmentId: String(appointmentId) });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Telemedicine session not found.",
      });
    }

    const appointmentResponse = await fetchAppointmentById(
      appointmentId,
      req.headers.authorization
    );
    const appointment = appointmentResponse?.appointment || appointmentResponse;

    if (!isUserAllowedForAppointment(appointment, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this appointment.",
      });
    }

    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("getSessionByAppointmentId error:", error.message);

    if (error.response) {
      return res.status(error.response.status || 502).json({
        success: false,
        message: error.response.data?.message || "Appointment service request failed.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error fetching telemedicine session.",
    });
  }
};
