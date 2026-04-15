require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

const telemedicineRoutes = require("./routes/telemedicineRoutes");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
	return res.status(200).json({
		status: "telemedicine-service running",
		timestamp: new Date(),
	});
});

app.use("/api/telemedicine", telemedicineRoutes);

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

		const port = process.env.PORT || 3007;
		app.listen(port, () => {
			console.log(`Telemedicine service running on port ${port}`);
		});
	} catch (error) {
		console.error("Failed to start telemedicine-service:", error.message);
		process.exit(1);
	}
};

if (require.main === module) {
	startServer();
}

module.exports = app;
