const Appointment = require('../models/Appointment');
const amqplib = require('amqplib');

// Helper — publish event to RabbitMQ so notification-service
// can send email/SMS. Wrapped in try/catch so if RabbitMQ is
// down it doesn't crash the whole service.
async function publishEvent(eventType, data) {
  try {
    const conn = await amqplib.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue('appointment_events', { durable: true });
    channel.sendToQueue(
      'appointment_events',
      Buffer.from(JSON.stringify({ eventType, data })),
      { persistent: true }
    );
    await channel.close();
    await conn.close();
  } catch (err) {
    console.error('RabbitMQ publish failed (non-fatal):', err.message);
  }
}

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

    // Notify patient + doctor asynchronously
    await publishEvent('APPOINTMENT_BOOKED', {
      appointmentId:   appointment._id,
      patientName,
      patientEmail,
      doctorName,
      appointmentDate,
      timeSlot,
      type
    });

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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