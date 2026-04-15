const axios = require("axios");

const APPOINTMENT_SERVICE_URL =
  process.env.APPOINTMENT_SERVICE_URL || "http://localhost:3004";

const fetchAppointmentById = async (appointmentId, authHeader) => {
  const url = `${APPOINTMENT_SERVICE_URL.replace(/\/$/, "")}/api/appointments/${appointmentId}`;

  const response = await axios.get(url, {
    headers: authHeader ? { Authorization: authHeader } : {},
    timeout: 6000,
  });

  return response.data;
};

module.exports = {
  fetchAppointmentById,
};
