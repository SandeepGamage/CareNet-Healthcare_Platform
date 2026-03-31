const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const symptomRoutes = require("./routes/symptom");

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "symptom-service" });
});

// Routes
app.use("/api/symptoms", symptomRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Symptom Service running on port ${PORT}`);
});
