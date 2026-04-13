const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({

  patientId: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientEmail: {
    type: String,
    required: true
  },

  doctorId: {
    type: String,
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  specialty: {
    type: String,
    required: true
  },

  appointmentDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,   // e.g. "09:00 - 09:30"
    required: true
  },

  type: {
    type: String,
    enum: ['IN_PERSON', 'TELEMEDICINE'],
    default: 'IN_PERSON'
  },

  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
    default: 'PENDING'
  },

  reason: {
    type: String 
  },

  notes: {
    type: String   // doctor's notes after consultation
  },

  consultationFee: {
    type: Number,
    required: true
  },

  isPaid: {
    type: Boolean,
    default: false
  },

  // if type is TELEMEDICINE, store the room link here
  meetingLink: {
    type: String
  },

  cancelledBy: {
    type: String,
    enum: ['PATIENT', 'DOCTOR', 'ADMIN', null],
    default: null
  },

  cancelReason: {
    type: String
  }

}, { timestamps: true }); 

module.exports = mongoose.model('Appointment', appointmentSchema);