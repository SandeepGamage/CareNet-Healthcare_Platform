const mongoose = require("mongoose");


const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    qualifications: {
      type: String,
      trim: true,
      default: "",
    },
    experienceYears: {
      type: Number,
      min: 0,
      default: 0,
    },
    availableHours: {
      type: String,
      trim: true,
      default: "",
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    consultationFee: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true },
);



module.exports = mongoose.model("Doctor", doctorSchema);