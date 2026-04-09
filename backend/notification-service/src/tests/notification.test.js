/**
 * notification-service/src/tests/notification.test.js
 *
 * Integration tests for the notification service routes.
 * Mocks emailService and smsService so no real emails/SMS are sent.
 */

const request = require('supertest');
const app     = require('../app');

// ── Mock external channels ────────────────────────────────────────────────────
jest.mock('../services/emailService', () => ({
  sendTemplatedEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-msg-id' }),
  sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-msg-id' }),
}));

jest.mock('../services/smsService', () => ({
  sendSMS: jest.fn().mockResolvedValue({ success: true, messageSid: 'SM123' }),
  getSMSBody: jest.fn().mockReturnValue('Test SMS body'),
}));

// ── Mock DB (no real Mongo needed for unit tests) ─────────────────────────────
jest.mock('../models/NotificationLog', () => {
  const mockLog = {
    _id: 'log-id-001',
    eventType: 'PAYMENT_SUCCESS',
    status: 'success',
    createdAt: new Date(),
  };
  return {
    create: jest.fn().mockResolvedValue(mockLog),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([mockLog]),
    }),
    countDocuments: jest.fn().mockResolvedValue(1),
  };
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/notifications/payment', () => {
  const paymentPayload = {
    type: 'PAYMENT_SUCCESS',
    recipients: [
      {
        email: 'patient@test.com',
        phone: '+94771234567',
        role: 'patient',
        data: {
          patientName: 'John Doe',
          doctorName: 'Dr. Smith',
          amount: '50.00',
          currency: 'USD',
          appointmentDate: '2026-04-01',
          transactionId: 'txn-001',
          invoiceNumber: 'INV-2026-00001',
        },
      },
      {
        email: 'doctor@test.com',
        role: 'doctor',
        data: {
          doctorName: 'Dr. Smith',
          patientName: 'John Doe',
          amount: '50.00',
          currency: 'USD',
          appointmentDate: '2026-04-01',
        },
      },
    ],
  };

  it('should accept valid payment notification payload and return 202', async () => {
    const res = await request(app)
      .post('/api/notifications/payment')
      .send(paymentPayload);

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/queued/i);
  });

  it('should return 400 if type is missing', async () => {
    const res = await request(app)
      .post('/api/notifications/payment')
      .send({ recipients: paymentPayload.recipients });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if recipients array is empty', async () => {
    const res = await request(app)
      .post('/api/notifications/payment')
      .send({ type: 'PAYMENT_SUCCESS', recipients: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/notifications/refund', () => {
  const refundPayload = {
    type: 'REFUND_SUCCESS',
    recipients: [
      {
        email: 'patient@test.com',
        role: 'patient',
        data: {
          patientName: 'John Doe',
          refundAmount: '50.00',
          currency: 'USD',
          refundId: 'ref-001',
          reason: 'requested_by_customer',
        },
      },
    ],
  };

  it('should accept refund notification and return 202', async () => {
    const res = await request(app)
      .post('/api/notifications/refund')
      .send(refundPayload);

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/notifications/appointments/booked', () => {
  const bookedPayload = {
    patientEmail: 'patient@test.com',
    patientPhone: '+94771234567',
    patientId: 'pat-001',
    patientName: 'John Doe',
    doctorEmail: 'doctor@test.com',
    doctorId: 'doc-001',
    doctorName: 'Dr. Smith',
    specialty: 'Cardiology',
    appointmentDate: '2026-04-01',
    appointmentTime: '10:00 AM',
    appointmentId: 'apt-001',
    consultationType: 'telemedicine',
  };

  it('should queue appointment booked notifications and return 202', async () => {
    const res = await request(app)
      .post('/api/notifications/appointments/booked')
      .send(bookedPayload);

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/notifications/appointments/cancelled', () => {
  it('should queue cancellation notifications and return 202', async () => {
    const res = await request(app)
      .post('/api/notifications/appointments/cancelled')
      .send({
        patientEmail: 'patient@test.com',
        patientId: 'pat-001',
        patientName: 'John Doe',
        doctorEmail: 'doctor@test.com',
        doctorId: 'doc-001',
        doctorName: 'Dr. Smith',
        appointmentDate: '2026-04-01',
        appointmentId: 'apt-001',
        cancelledBy: 'patient',
        reason: 'Schedule conflict',
        refundMessage: 'A refund will be processed within 5-10 business days.',
      });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('should return 200 with service health info', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.service).toBe('notification-service');
  });
});
