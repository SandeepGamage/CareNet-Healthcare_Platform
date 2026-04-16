const Appointment = require('../models/Appointment');
const axios = require('axios');

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006';

// ─── HELPER: Send Notifications ───────────────────────────
const sendNotification = async (path, payload) => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/appointments${path}`, payload);
  } catch (err) {
    console.error(`Failed to send notification to ${path}:`, err.message);
  }
};

// ─── HELPERS ─────────────────────────────────────────────

const parseTimeToMinutes = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();

  // 1. HH:mm (24h)
  const twentyFourMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourMatch) {
    const hh = Number(twentyFourMatch[1]);
    const mm = Number(twentyFourMatch[2]);
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) return hh * 60 + mm;
  }

  // 2. HH:mm AM/PM
  const twelveMatch = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (twelveMatch) {
    let hh = Number(twelveMatch[1]);
    const mm = Number(twelveMatch[2]);
    const ampm = twelveMatch[3];
    if (hh >= 1 && hh <= 12 && mm >= 0 && mm <= 59) {
      if (ampm === 'PM' && hh < 12) hh += 12;
      if (ampm === 'AM' && hh === 12) hh = 0;
      return hh * 60 + mm;
    }
  }
  return null;
};

const formatMinutesToTime = (minutes) => {
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
};

const generateSlots = (startMinutes, endMinutes, duration) => {
  const slots = [];
  let current = startMinutes;
  while (current + duration <= endMinutes) {
    const slotStart = formatMinutesToTime(current);
    const slotEnd = formatMinutesToTime(current + duration);
    slots.push(`${slotStart} - ${slotEnd}`);
    current += duration;
  }
  return slots;
};

// ─── POST /api/appointments ───────────────────────────────
// Patient books an appointment
exports.createAppointment = async (req, res) => {
  try {
    const {
      doctorId, doctorName, specialty,
      appointmentDate, timeSlot, type,
      reason, consultationFee, patientName, patientEmail
    } = req.body;

    // 1. Fetch Doctor Config
    let doctorConfig;
    try {
      const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/profile/user/${doctorId}`, {
        headers: { Authorization: req.headers.authorization }
      });
      doctorConfig = response.data.data;
    } catch (err) {
      console.error('Failed to fetch doctor config:', err.response?.data || err.message);
      const status = err.response?.status || 500;
      const message = err.response?.data?.message || 'Could not verify doctor availability.';
      return res.status(status).json({ message, details: err.message });
    }

    if (!doctorConfig.isAvailable) {
      return res.status(400).json({ message: 'Doctor is not currently available for bookings.' });
    }

    // 2. Validate Slot
    if (!doctorConfig.availableSlots || !doctorConfig.availableSlots.includes(timeSlot)) {
      return res.status(400).json({ message: 'Selected time slot is no longer available.' });
    }

    // 4. Prevent double-booking
    const conflict = await Appointment.findOne({
      doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      status: { $in: ['PENDING', 'CONFIRMED'] }
    });

    if (conflict) {
      return res.status(409).json({
        message: 'This time slot is already booked. Please choose another.'
      });
    }

    const appointment = await Appointment.create({
      patientId: req.user.id,      // from JWT token
      patientName,
      patientEmail,
      doctorId,
      doctorName,
      specialty,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      type: type || 'IN_PERSON',
      reason,
      consultationFee
    });

    // 5. Remove slot from doctor service
    try {
      await axios.patch(`${DOCTOR_SERVICE_URL}/api/doctors/profile/book-slot/${doctorId}`, {
        slot: timeSlot
      }, {
        headers: { Authorization: req.headers.authorization }
      });
    } catch (err) {
      console.error('Failed to remove slot from doctor config:', err.message);
      // We still proceed as the appointment is created
    }

    // Notify patient + doctor via direct REST call
    sendNotification('/booked', {
      patientId: req.user.id,
      patientName: patientName,
      patientEmail: patientEmail,
      doctorId: doctorId,
      doctorName: doctorName,
      appointmentId: appointment._id,
      appointmentDate: appointmentDate,
      appointmentTime: timeSlot,
      specialty: specialty,
      consultationType: type || 'IN_PERSON'
    });

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/appointments/my ─────────────────────────────
// Patient sees their own appointments
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment
      .find({ patientId: req.user.id })
      .sort({ appointmentDate: -1 });   // newest first

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/appointments/doctor ─────────────────────────
// Doctor sees appointments assigned to them
exports.getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment
      .find({ doctorId: req.user.id })
      .sort({ appointmentDate: 1 });    // upcoming first

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//GET /api/appoint

// ─── GET /api/appointments/:id ────────────────────────────
// Get single appointment detail
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only the patient, doctor, or admin can view it
    const isOwner =
      appointment.patientId === req.user.id ||
      appointment.doctorId === req.user.id ||
      req.user.role === 'ADMIN';

    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── PATCH /api/appointments/:id/status ──────────────────
// Doctor confirms or completes; patient or doctor can cancel
exports.updateStatus = async (req, res) => {
  try {
    const { status, notes, cancelReason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Role-based status rules
    if (status === 'CONFIRMED' && req.user.role !== 'DOCTOR') {
      return res.status(403).json({ message: 'Only doctors can confirm appointments' });
    }
    if (status === 'COMPLETED' && req.user.role !== 'DOCTOR') {
      return res.status(403).json({ message: 'Only doctors can mark as completed' });
    }

    appointment.status = status;
    if (notes) appointment.notes = notes;
    if (cancelReason) appointment.cancelReason = cancelReason;
    if (status === 'CANCELLED') {
      appointment.cancelledBy = req.user.role;
    }

    await appointment.save();

    // Notify about status change
    if (status === 'CONFIRMED') {
      sendNotification('/confirmed', {
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        patientEmail: appointment.patientEmail,
        doctorName: appointment.doctorName,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.timeSlot,
        appointmentId: appointment._id
      });
    }

    res.json({ message: `Appointment ${status.toLowerCase()}`, appointment });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── DELETE /api/appointments/:id ────────────────────────
// Patient cancels their own appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.patientId !== req.user.id) {
      return res.status(403).json({ message: 'You can only cancel your own appointments' });
    }

    if (appointment.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Cannot cancel a completed appointment' });
    }

    appointment.status = 'CANCELLED';
    appointment.cancelledBy = 'PATIENT';
    appointment.cancelReason = req.body.reason || 'Cancelled by patient';
    await appointment.save();

    sendNotification('/cancelled', {
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      patientEmail: appointment.patientEmail,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      appointmentDate: appointment.appointmentDate,
      appointmentId: appointment._id,
      cancelledBy: 'patient',
      reason: appointment.cancelReason
    });

    res.json({ message: 'Appointment cancelled successfully' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/appointments/all ────────────────────────────
// Admin sees all appointments
exports.getAllAppointments = async (req, res) => {
  try {
    const { status, date, specialty } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (specialty) filter.specialty = specialty;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.appointmentDate = { $gte: start, $lt: end };
    }

    const appointments = await Appointment
      .find(filter)
      .sort({ appointmentDate: -1 });

    res.json({ total: appointments.length, appointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/appointments/slots ──────────────────────────
// Check which slots are already taken for a doctor on a date
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ message: 'doctorId and date are required' });
    }

    // 1. Fetch Doctor Config
    let doctorConfig;
    try {
      const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/profile/user/${doctorId}`, {
        headers: { Authorization: req.headers.authorization }
      });
      doctorConfig = response.data.data;
      console.log("Doctor Config------>", doctorConfig);
    } catch (err) {
      console.error('Failed to fetch doctor config:', err.response?.data || err.message);
      const status = err.response?.status || 500;
      const message = err.response?.data?.message || 'Could not fetch doctor availability.';
      return res.status(status).json({ message, details: err.message });
    }

    // 2. Fetch Existing Appointments for this doctor on this day
    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      doctorId: doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['PENDING', 'CONFIRMED', 'COMPLETED'] }
    });

    const bookedSlots = existingAppointments.map(app => app.timeSlot);

    // 3. Filter available slots
    const templateSlots = doctorConfig.availableSlots || [];
    const availableSlots = templateSlots.filter(slot => !bookedSlots.includes(slot));

    console.log("Available slots---------->", availableSlots)

    // 4. Return the filtered list
    res.json({
      date,
      doctorId,
      availableSlots,
      availableHours: doctorConfig.availableHours || '',
      slotDuration: doctorConfig.slotDuration || 30
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};