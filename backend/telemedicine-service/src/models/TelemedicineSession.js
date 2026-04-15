const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    role: {
      type: String,
      enum: ["doctor", "patient", "admin"],
      required: true,
    },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date, default: null },
  },
  { _id: false }
);

const telemedicineSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    appointmentId: { type: String, required: true, unique: true, index: true },
    roomName: { type: String, required: true, unique: true },
    roomUrl: { type: String, required: true },

    doctorId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    doctorName: { type: String, default: null },
    patientName: { type: String, default: null },

    status: {
      type: String,
      enum: ["SCHEDULED", "LIVE", "ENDED", "CANCELLED"],
      default: "SCHEDULED",
      index: true,
    },

    scheduledAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },

    participants: {
      type: [participantSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TelemedicineSession", telemedicineSessionSchema);
