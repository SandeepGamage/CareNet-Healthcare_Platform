require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

const patientRoutes = require("./routes/PatientRoutes");
const medicalReportRoutes = require("./routes/MedicalReportRoutes");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
	return res.status(200).json({
		status: "patient-service running",
		timestamp: new Date(),
	});
});

app.use("/api/patients", patientRoutes);
app.use("/api/patients", medicalReportRoutes);

// File upload and other middleware errors
app.use((error, req, res, next) => {
	if (error) {
		return res.status(400).json({
			success: false,
			message: error.message || "Request failed.",
		});
	}

	return next();
});

const startServer = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log(`MongoDB connected: ${mongoose.connection.readyState === 1 ? "YES" : "NO"}`);
		const port = process.env.PORT || 3002;
		app.listen(port, () => {
			console.log(`Patient service running on port ${port}`);
		});
	} catch (error) {
		console.error("Failed to start patient-service:", error.message);
		process.exit(1);
	}
};

if (require.main === module) {
	startServer();
}

module.exports = app;