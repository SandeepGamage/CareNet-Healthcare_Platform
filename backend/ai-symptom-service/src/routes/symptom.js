const express = require("express");
const rateLimit = require("express-rate-limit");
const { checkSymptoms } = require("../services/gemini.js");

const router = express.Router();

// Rate limit: max 20 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many requests. Please wait a moment." },
});

// Emergency keywords — bypass AI and flag immediately
const EMERGENCY_KEYWORDS = [
  "chest pain",
  "can't breathe",
  "cannot breathe",
  "difficulty breathing",
  "heart attack",
  "stroke",
  "unconscious",
  "not breathing",
  "severe bleeding",
  "coughing blood",
  "vomiting blood",
  "seizure",
  "paralysis",
  "sudden numbness",
];

const isEmergency = (symptoms) => {
  const lower = symptoms.toLowerCase();
  return EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));
};

// POST /api/symptoms/check
router.post("/check", limiter, async (req, res) => {
  const { symptoms, age, gender } = req.body;

  // Validate input
  if (!symptoms || typeof symptoms !== "string" || symptoms.trim().length < 5) {
    return res.status(400).json({
      success: false,
      message: "Please describe your symptoms in at least a few words.",
    });
  }

  if (symptoms.trim().length > 1000) {
    return res.status(400).json({
      success: false,
      message: "Symptom description is too long. Please keep it under 1000 characters.",
    });
  }

  // Emergency keyword fast-path — don't wait for AI
  if (isEmergency(symptoms)) {
    return res.status(200).json({
      success: true,
      emergency: true,
      data: {
        possibleConditions: [
          {
            name: "Potentially life-threatening condition",
            likelihood: "high",
            reason: "Your symptoms may indicate a medical emergency.",
          },
        ],
        recommendedSpecialty: "Emergency Medicine",
        urgency: "emergency",
        urgencyReason: "Your symptoms require immediate medical attention.",
        followUpQuestions: [],
        disclaimer:
          "This is a preliminary AI assessment only and not a medical diagnosis. Please consult a qualified doctor.",
      },
    });
  }

  try {
    const result = await checkSymptoms(symptoms.trim(), age, gender);
    return res.status(200).json({ success: true, emergency: false, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
