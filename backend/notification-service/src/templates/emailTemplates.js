/**
 * Email templates for all notification event types.
 * Returns { subject, html } for the given eventType and data variables.
 */

// ─── Shared layout wrapper ────────────────────────────────────────────────────
const wrap = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; color: #333; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1a73e8; padding: 28px 32px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 600; }
    .header p { margin: 6px 0 0; color: #c8dcff; font-size: 13px; }
    .body { padding: 32px; }
    .body h2 { margin-top: 0; font-size: 20px; color: #1a73e8; }
    .detail-box { background: #f0f4ff; border-left: 4px solid #1a73e8; border-radius: 4px; padding: 16px 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #dde4f5; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #666; font-weight: 500; }
    .detail-value { color: #222; font-weight: 600; }
    .btn { display: inline-block; margin: 20px 0; padding: 12px 28px; background: #1a73e8; color: #fff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600; }
    .footer { background: #f0f4ff; padding: 18px 32px; text-align: center; font-size: 12px; color: #888; }
    .badge-success { color: #1e7e34; background: #d4edda; padding: 4px 10px; border-radius: 12px; font-size: 13px; font-weight: 600; }
    .badge-danger  { color: #721c24; background: #f8d7da; padding: 4px 10px; border-radius: 12px; font-size: 13px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Healthcare Platform</h1>
      <p>Smart Healthcare Appointment & Telemedicine</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Healthcare Platform. This is an automated message — please do not reply.<br />
      If you have concerns, contact support@yourhealthcare.com
    </div>
  </div>
</body>
</html>`;

// ─── Template definitions ─────────────────────────────────────────────────────

const templates = {

  // ── Payment success (patient) ─────────────────────────────────────────────
  PAYMENT_SUCCESS: (d) => ({
    subject: `✅ Payment Confirmed – ${d.currency} ${d.amount}`,
    html: wrap('Payment Confirmed', `
      <h2>Payment Successful!</h2>
      <p>Hi <strong>${d.patientName || 'Patient'}</strong>,</p>
      <p>Your consultation payment has been processed successfully. Your appointment is now waiting for approval by the doctor. Here are the details:</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Doctor</span><span class="detail-value">Dr. ${d.doctorName}</span></div>
        <div class="detail-row"><span class="detail-label">Appointment Date</span><span class="detail-value">${d.appointmentDate}</span></div>
        <div class="detail-row"><span class="detail-label">Amount Paid</span><span class="detail-value">${d.currency} ${d.amount}</span></div>
        <div class="detail-row"><span class="detail-label">Transaction ID</span><span class="detail-value">${d.transactionId}</span></div>
        <div class="detail-row"><span class="detail-label">Invoice No.</span><span class="detail-value">${d.invoiceNumber || 'Generating...'}</span></div>
        <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="badge-success">Paid</span></span></div>
      </div>
      <p>Your invoice PDF will be available to download from your account dashboard.</p>
      <p>Thank you for choosing our Healthcare Platform!</p>
    `),
  }),

  // ── Payment success (doctor) ──────────────────────────────────────────────
  PAYMENT_SUCCESS_DOCTOR: (d) => ({
    subject: `💰 Consultation Fee Received – ${d.currency} ${d.amount}`,
    html: wrap('Payment Received', `
      <h2>Consultation Fee Received</h2>
      <p>Hi <strong>Dr. ${d.doctorName}</strong>,</p>
      <p>A patient has completed payment for an upcoming consultation.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Patient</span><span class="detail-value">${d.patientName}</span></div>
        <div class="detail-row"><span class="detail-label">Appointment Date</span><span class="detail-value">${d.appointmentDate}</span></div>
        <div class="detail-row"><span class="detail-label">Amount</span><span class="detail-value">${d.currency} ${d.amount}</span></div>
      </div>
    `),
  }),

  // ── Refund success ────────────────────────────────────────────────────────
  REFUND_SUCCESS: (d) => ({
    subject: `✅ Refund Processed – ${d.currency} ${d.refundAmount}`,
    html: wrap('Refund Processed', `
      <h2>Your Refund Has Been Processed</h2>
      <p>Hi <strong>${d.patientName || 'Patient'}</strong>,</p>
      <p>Your refund has been successfully processed and will appear in your account within 5–10 business days.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Refund Amount</span><span class="detail-value">${d.currency} ${d.refundAmount}</span></div>
        <div class="detail-row"><span class="detail-label">Reason</span><span class="detail-value">${d.reason}</span></div>
        <div class="detail-row"><span class="detail-label">Refund ID</span><span class="detail-value">${d.refundId}</span></div>
        <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="badge-success">Processed</span></span></div>
      </div>
    `),
  }),

  // ── Appointment booked ────────────────────────────────────────────────────
  APPOINTMENT_BOOKED: (d) => ({
    subject: `📅 Appointment Booked – Dr. ${d.doctorName}`,
    html: wrap('Appointment Booked', `
      <h2>Appointment Booked Successfully!</h2>
      <p>Hi <strong>${d.patientName || 'Patient'}</strong>,</p>
      <p>Your appointment has been booked. Here are your appointment details:</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Doctor</span><span class="detail-value">Dr. ${d.doctorName}</span></div>
        <div class="detail-row"><span class="detail-label">Specialty</span><span class="detail-value">${d.specialty}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${d.appointmentDate}</span></div>
        <div class="detail-row"><span class="detail-label">Time</span><span class="detail-value">${d.appointmentTime}</span></div>
        <div class="detail-row"><span class="detail-label">Type</span><span class="detail-value">${d.consultationType || 'Telemedicine'}</span></div>
        <div class="detail-row"><span class="detail-label">Appointment ID</span><span class="detail-value">${d.appointmentId}</span></div>
        <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="badge-success">Pending Confirmation</span></span></div>
      </div>
      <p>Please complete your payment to confirm the appointment. You will receive a confirmation once the doctor accepts.</p>
    `),
  }),

  APPOINTMENT_BOOKED_DOCTOR: (d) => ({
    subject: `📅 New Appointment Request – Patient: ${d.patientName}`,
    html: wrap('New Appointment', `
      <h2>New Appointment Booking</h2>
      <p>Hi <strong>Dr. ${d.doctorName}</strong>,</p>
      <p>A new appointment has been requested by <strong>${d.patientName}</strong>. Please check your dashboard to confirm or reschedule.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Patient</span><span class="detail-value">${d.patientName}</span></div>
        <div class="detail-row"><span class="detail-label">Specialty</span><span class="detail-value">${d.specialty}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${d.appointmentDate}</span></div>
        <div class="detail-row"><span class="detail-label">Time</span><span class="detail-value">${d.appointmentTime}</span></div>
        <div class="detail-row"><span class="detail-label">Type</span><span class="detail-value">${d.consultationType || 'Telemedicine'}</span></div>
      </div>
      <p>Consultations are pending until you confirm them in the platform.</p>
    `),
  }),

  // ── Appointment confirmed ─────────────────────────────────────────────────
  APPOINTMENT_CONFIRMED: (d) => ({
    subject: `✅ Appointment Confirmed – ${d.appointmentDate}`,
    html: wrap('Appointment Confirmed', `
      <h2>Appointment Confirmed!</h2>
      <p>Hi <strong>${d.patientName || 'Patient'}</strong>,</p>
      <p>Dr. ${d.doctorName} has confirmed your appointment.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Doctor</span><span class="detail-value">Dr. ${d.doctorName}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${d.appointmentDate}</span></div>
        <div class="detail-row"><span class="detail-label">Time</span><span class="detail-value">${d.appointmentTime}</span></div>
        ${d.joinUrl ? `<div class="detail-row"><span class="detail-label">Join Link</span><span class="detail-value"><a href="${d.joinUrl}">${d.joinUrl}</a></span></div>` : ''}
      </div>
      ${d.joinUrl ? `<a class="btn" href="${d.joinUrl}">Join Consultation</a>` : ''}
      <p>You will receive a reminder 1 hour before the session.</p>
    `),
  }),

  // ── Appointment cancelled ─────────────────────────────────────────────────
  APPOINTMENT_CANCELLED: (d) => ({
    subject: `❌ Appointment Cancelled – ${d.appointmentDate}`,
    html: wrap('Appointment Cancelled', `
      <h2>Appointment Cancelled</h2>
      <p>Hi <strong>${d.patientName || d.doctorName || 'User'}</strong>,</p>
      <p>The following appointment has been cancelled:</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Doctor</span><span class="detail-value">Dr. ${d.doctorName}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${d.appointmentDate}</span></div>
        <div class="detail-row"><span class="detail-label">Cancelled By</span><span class="detail-value">${d.cancelledBy || 'System'}</span></div>
        ${d.reason ? `<div class="detail-row"><span class="detail-label">Reason</span><span class="detail-value">${d.reason}</span></div>` : ''}
        <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="badge-danger">Cancelled</span></span></div>
      </div>
      ${d.refundMessage ? `<p>${d.refundMessage}</p>` : ''}
    `),
  }),

  // ── Appointment reminder ──────────────────────────────────────────────────
  APPOINTMENT_REMINDER: (d) => ({
    subject: `⏰ Reminder: Appointment in 1 Hour – Dr. ${d.doctorName}`,
    html: wrap('Appointment Reminder', `
      <h2>Your Appointment is in 1 Hour</h2>
      <p>Hi <strong>${d.patientName || 'Patient'}</strong>,</p>
      <p>This is a reminder that your telemedicine consultation starts in <strong>1 hour</strong>.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Doctor</span><span class="detail-value">Dr. ${d.doctorName}</span></div>
        <div class="detail-row"><span class="detail-label">Time</span><span class="detail-value">${d.appointmentTime}</span></div>
        ${d.joinUrl ? `<div class="detail-row"><span class="detail-label">Join Link</span><span class="detail-value"><a href="${d.joinUrl}">${d.joinUrl}</a></span></div>` : ''}
      </div>
      ${d.joinUrl ? `<a class="btn" href="${d.joinUrl}">Join Now</a>` : ''}
    `),
  }),

  // ── Prescription issued ───────────────────────────────────────────────────
  PRESCRIPTION_ISSUED: (d) => ({
    subject: `💊 Prescription Issued by Dr. ${d.doctorName}`,
    html: wrap('Prescription Issued', `
      <h2>Your Prescription is Ready</h2>
      <p>Hi <strong>${d.patientName || 'Patient'}</strong>,</p>
      <p>Dr. <strong>${d.doctorName}</strong> has issued a digital prescription following your consultation.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Doctor</span><span class="detail-value">Dr. ${d.doctorName}</span></div>
        <div class="detail-row"><span class="detail-label">Issued On</span><span class="detail-value">${d.issuedDate || new Date().toLocaleDateString()}</span></div>
        <div class="detail-row"><span class="detail-label">Prescription ID</span><span class="detail-value">${d.prescriptionId}</span></div>
      </div>
      <p>Log in to your patient dashboard to view, download, and share your prescription.</p>
    `),
  }),

  // ── Consultation completed ────────────────────────────────────────────────
  CONSULTATION_COMPLETED: (d) => ({
    subject: `✅ Consultation Completed – Dr. ${d.doctorName}`,
    html: wrap('Consultation Completed', `
      <h2>Consultation Completed</h2>
      <p>Hi <strong>${d.patientName || 'Patient'}</strong>,</p>
      <p>Your telemedicine consultation with Dr. <strong>${d.doctorName}</strong> has ended.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Doctor</span><span class="detail-value">Dr. ${d.doctorName}</span></div>
        <div class="detail-row"><span class="detail-label">Duration</span><span class="detail-value">${d.duration || 'N/A'}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${d.appointmentDate}</span></div>
      </div>
      <p>Your prescription and notes (if any) will appear shortly in your dashboard.</p>
    `),
  }),

  CONSULTATION_COMPLETED_DOCTOR: (d) => ({
    subject: `✅ Consultation Session Ended – Patient: ${d.patientName}`,
    html: wrap('Consultation Summary', `
      <h2>Consultation Completed</h2>
      <p>Hi <strong>Dr. ${d.doctorName}</strong>,</p>
      <p>Your telemedicine consultation with <strong>${d.patientName}</strong> has been successfully completed.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Patient</span><span class="detail-value">${d.patientName}</span></div>
        <div class="detail-row"><span class="detail-label">Duration</span><span class="detail-value">${d.duration || 'N/A'}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${d.appointmentDate}</span></div>
      </div>
      <p>If you haven't issued a prescription yet, you can do so from your dashboard.</p>
    `),
  }),
  VERIFICATION_CODE_EMAIL: (d) => ({
    subject: d.subject || 'Verification Code',
    html: wrap('Verification Code', `
      <h2>Verification Required</h2>
      <p>Your authentication code is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1a73e8; margin: 20px 0;">${d.code || d.message}</div>
      <p>${d.message}</p>
      <p>This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
    `),
  }),
  ACCOUNT_UPDATE: (d) => ({
    subject: d.subject || 'Account Update',
    html: wrap('Account Update', `
      <h2>Account Status Update</h2>
      <p>${d.message}</p>
      <p>Thank you for using CareNet.</p>
    `),
  }),
};

/**
 * Get template for a given event type.
 * @param {string} eventType
 * @param {object} data
 * @returns {{ subject: string, html: string } | null}
 */
const getEmailTemplate = (eventType, data) => {
  const templateFn = templates[eventType];
  if (!templateFn) return null;
  return templateFn(data);
};

module.exports = { getEmailTemplate };
