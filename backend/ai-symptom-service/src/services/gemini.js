const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Doctor specialties we support in our platform
const SPECIALTIES = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Orthopedic Surgeon",
  "Gastroenterologist",
  "Pulmonologist",
  "Psychiatrist",
  "Ophthalmologist",
  "ENT Specialist",
  "Urologist",
  "Gynecologist",
  "Endocrinologist",
  "Pediatrician",
  "Emergency Medicine",
];

const buildPrompt = (symptoms, age, gender) => {
  return `You are a medical triage assistant. A patient has described their symptoms. 
Analyze them and respond ONLY with a valid JSON object — no markdown, no explanation, no extra text.

Patient details:
- Age: ${age || "Not provided"}
- Gender: ${gender || "Not provided"}
- Symptoms: ${symptoms}

Available doctor specialties in our system: ${SPECIALTIES.join(", ")}

Respond with exactly this JSON structure:
{
  "possibleConditions": [
    {
      "name": "condition name",
      "likelihood": "high | moderate | low",
      "reason": "brief one-sentence reason based on symptoms"
    }
  ],
  "recommendedSpecialty": "one specialty from the list above",
  "urgency": "routine | within_48h | emergency",
  "urgencyReason": "brief reason for urgency level",
  "followUpQuestions": ["question 1", "question 2"],
  "disclaimer": "This is a preliminary AI assessment only and not a medical diagnosis. Please consult a qualified doctor."
}

Rules:
- possibleConditions: list 2 to 3 conditions maximum
- recommendedSpecialty: must be exactly one value from the provided list
- urgency: use "emergency" only for life-threatening symptoms (chest pain, difficulty breathing, stroke signs, severe bleeding)
- followUpQuestions: exactly 2 questions to help narrow the diagnosis
- Respond with ONLY the JSON object, nothing else`;
};

const checkSymptoms = async (symptoms, age, gender) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = buildPrompt(symptoms, age, gender);
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code blocks if Gemini wraps it anyway
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // Validate required fields exist
    if (
      !parsed.possibleConditions ||
      !parsed.recommendedSpecialty ||
      !parsed.urgency
    ) {
      throw new Error("Incomplete response from AI model");
    }

    return parsed;
  } catch (error) {
    // Enhanced error handling for 429 Too Many Requests
    if (error && error.message && error.message.includes("429")) {
      // Try to extract retry delay from error message (if present)
      let retryDelay = null;
      const retryMatch = error.message.match(/retryDelay\":\"(\d+)s/);
      if (retryMatch && retryMatch[1]) {
        retryDelay = parseInt(retryMatch[1], 10);
      } else {
        // Try to extract float seconds
        const floatMatch = error.message.match(/retry in ([\d.]+)s/);
        if (floatMatch && floatMatch[1]) {
          retryDelay = Math.ceil(parseFloat(floatMatch[1]));
        }
      }
      const waitMsg = retryDelay
        ? `Please wait ${retryDelay} seconds before retrying.`
        : "You have exceeded the API quota. Please try again later.";
      console.error("Gemini API quota error:", error.message);
      throw new Error(`Gemini API quota exceeded. ${waitMsg}`);
    }
    console.error("Gemini API error:", error.message);
    throw new Error(`Failed to analyse symptoms: ${error.message}`);
  }
};

module.exports = { checkSymptoms };
