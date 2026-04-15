const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const { publishToQueue } = require('../utils/rabbitMQ');
const notificationService = require('../services/notificationService');

// ─── POST /api/appointments ───────────────────────────────
// Patient books an appointment
exports.createAppointment = async (req, res) => {
  try {
    const {
      doctorId, doctorName, specialty,
      appointmentDate, timeSlot, type,
      reason, consultationFee, patientName, patientEmail
    } = req.body;

    // Prevent double-booking — same doctor, same date, same slot
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
      patientId:   req.user.id,      // from JWT token
      patientName,
      patientEmail,
      doctorId,
      doctorName,
      specialty,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      type:            type || 'IN_PERSON',
      reason,
      consultationFee
    });

    // Fetch patient & doctor details from profiles (users collection)
    const [patientUser, doctorUser] = await Promise.all([
      mongoose.connection.db.collection('users').findOne({ 
        $or: [
          { _id: new mongoose.Types.ObjectId(req.user.id) },
          { email: patientEmail }
        ]
      }),
      mongoose.connection.db.collection('users').findOne({ 
        _id: new mongoose.Types.ObjectId(doctorId) 
      })
    ]);

    const patientPhone = patientUser?.phone || null;
    const doctorPhone  = doctorUser?.phone || null;
    const doctorEmail  = doctorUser?.email || null;

    // Notify patient + doctor via REST
    await notificationService.notifyAppointmentBooked({
      ...appointment.toObject(),
      doctorEmail
    }, patientPhone);

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
      appointment.doctorId  === req.user.id ||
      req.user.role         === 'ADMIN';

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
    if (notes)        appointment.notes = notes;
    if (cancelReason) appointment.cancelReason = cancelReason;
    if (status === 'CANCELLED') {
      appointment.cancelledBy = req.user.role;
    }

    await appointment.save();

    // Fetch patient & doctor phone from profiles for notifications
    const [patientUser, doctorUser] = await Promise.all([
      mongoose.connection.db.collection('users').findOne({ 
        _id: new mongoose.Types.ObjectId(appointment.patientId) 
      }),
      mongoose.connection.db.collection('users').findOne({ 
        _id: new mongoose.Types.ObjectId(appointment.doctorId) 
      })
    ]);

    const patientPhone = patientUser?.phone || null;
    const doctorPhone  = doctorUser?.phone || null;
    const doctorEmail  = doctorUser?.email || null;

    // Trigger specific notifications based on status
    if (status === 'CONFIRMED') {
      await notificationService.notifyAppointmentConfirmed(appointment, patientPhone);
    } else if (status === 'COMPLETED') {
      await notificationService.notifyConsultationCompleted({
        ...appointment.toObject(),
        doctorEmail
      }, patientPhone, doctorPhone);
    } else if (status === 'CANCELLED') {
      await notificationService.notifyAppointmentCancelled(appointment, patientPhone, req.user.role, cancelReason);
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

    appointment.status      = 'CANCELLED';
    appointment.cancelledBy = 'PATIENT';
    appointment.cancelReason = req.body.reason || 'Cancelled by patient';
    await appointment.save();

    publishToQueue({
      eventType: 'APPOINTMENT_CANCELLED',
      recipientId: appointment.patientId,
      recipientRole: 'patient',
      email: appointment.patientEmail,
      referenceId: appointment._id,
      data: {
        patientName:   appointment.patientName,
        doctorName:    appointment.doctorName
      }
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

    if (status)    filter.status    = status;
    if (specialty) filter.specialty = specialty;
    if (date) {
      const start = new Date(date);
      const end   = new Date(date);
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

    const start = new Date(date);
    const end   = new Date(date);
    end.setDate(end.getDate() + 1);

    const booked = await Appointment.find({
      doctorId,
      appointmentDate: { $gte: start, $lt: end },
      status: { $in: ['PENDING', 'CONFIRMED'] }
    }).select('timeSlot');

    const bookedSlots = booked.map(a => a.timeSlot);

    // All possible slots in a day
    const allSlots = [
      '09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00',
      '11:00 - 11:30', '11:30 - 12:00', '14:00 - 14:30', '14:30 - 15:00',
      '15:00 - 15:30', '15:30 - 16:00', '16:00 - 16:30', '16:30 - 17:00'
    ];

    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({ date, doctorId, availableSlots, bookedSlots });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};