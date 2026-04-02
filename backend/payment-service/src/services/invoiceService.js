const PDFDocument = require('pdfkit');
const Invoice     = require('../models/Invoice');
const logger      = require('../utils/logger');

/**
 * Generate a PDF invoice buffer using PDFKit.
 * Returns a Buffer (stored in Invoice.pdfBuffer).
 */
const generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    const doc     = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];

    doc.on('data',  (chunk) => buffers.push(chunk));
    doc.on('end',   ()      => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // ── Header ────────────────────────────────────────────────────────────────
    doc.fontSize(26).font('Helvetica-Bold').fillColor('#1a73e8').text('INVOICE', 50, 50);
    doc.fontSize(10).font('Helvetica').fillColor('#666666');
    doc.text('Healthcare Telemedicine Platform', 50, 84);
    doc.text('support@yourhealthcare.com', 50, 98);

    // Invoice meta (top-right)
    doc.fontSize(10).fillColor('#333333');
    doc.text(`Invoice No: ${invoice.invoiceNumber}`,              350, 50, { align: 'right', width: 200 });
    doc.text(`Issued: ${new Date(invoice.issuedAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })}`,                                                          350, 65, { align: 'right', width: 200 });
    doc.text(`Status: ${invoice.status.toUpperCase()}`,           350, 80, { align: 'right', width: 200 });

    // ── Divider ───────────────────────────────────────────────────────────────
    doc.moveTo(50, 120).lineTo(550, 120).strokeColor('#e0e0e0').stroke();

    // ── Bill To ───────────────────────────────────────────────────────────────
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333').text('BILL TO', 50, 140);
    doc.fontSize(10).font('Helvetica');
    doc.text(invoice.billingDetails?.patientName || 'Patient', 50, 158);
    if (invoice.billingDetails?.email)   doc.text(invoice.billingDetails.email,   50, 173);
    if (invoice.billingDetails?.address) doc.text(invoice.billingDetails.address, 50, 188);

    // ── Service By ────────────────────────────────────────────────────────────
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333').text('SERVICE BY', 300, 140);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Dr. ${invoice.doctorDetails?.name || 'N/A'}`,    300, 158);
    doc.text(invoice.doctorDetails?.specialty || '',           300, 173);
    doc.text(`Appointment: ${invoice.appointmentDate || 'N/A'}`, 300, 188);

    // ── Table Header ──────────────────────────────────────────────────────────
    const tableTop = 232;
    doc.fillColor('#1a73e8').rect(50, tableTop, 500, 26).fill();
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
    doc.text('Description',       60,  tableTop + 8);
    doc.text('Qty',               330, tableTop + 8, { width: 50,  align: 'right' });
    doc.text('Unit Price',        380, tableTop + 8, { width: 80,  align: 'right' });
    doc.text('Total',             460, tableTop + 8, { width: 80,  align: 'right' });

    // ── Line Items ────────────────────────────────────────────────────────────
    let y = tableTop + 34;
    doc.font('Helvetica').fontSize(10);

    invoice.lineItems.forEach((item, i) => {
      if (i % 2 === 1) {
        doc.fillColor('#f4f7ff').rect(50, y - 5, 500, 24).fill();
      }
      doc.fillColor('#333333');
      doc.text(item.description,                        60,  y, { width: 260 });
      doc.text(String(item.quantity),                   330, y, { width: 50,  align: 'right' });
      doc.text(`$${(item.unitPrice / 100).toFixed(2)}`, 380, y, { width: 80,  align: 'right' });
      doc.text(`$${(item.total    / 100).toFixed(2)}`,  460, y, { width: 80,  align: 'right' });
      y += 26;
    });

    // ── Totals ────────────────────────────────────────────────────────────────
    y += 10;
    doc.moveTo(350, y).lineTo(550, y).strokeColor('#e0e0e0').stroke();
    y += 14;

    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    doc.text('Subtotal:',                                    380, y, { width: 80 });
    doc.text(`$${(invoice.subtotal / 100).toFixed(2)}`,     460, y, { width: 80, align: 'right' });
    y += 18;

    if (invoice.tax > 0) {
      doc.text('Tax:',                                       380, y, { width: 80 });
      doc.text(`$${(invoice.tax / 100).toFixed(2)}`,        460, y, { width: 80, align: 'right' });
      y += 18;
    }

    doc.moveTo(350, y).lineTo(550, y).strokeColor('#aaaaaa').stroke();
    y += 12;

    doc.fontSize(13).font('Helvetica-Bold').fillColor('#1a73e8');
    doc.text('TOTAL:',                                                380, y, { width: 80 });
    doc.text(
      `$${(invoice.totalAmount / 100).toFixed(2)} ${invoice.currency.toUpperCase()}`,
      460, y, { width: 80, align: 'right' }
    );

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.moveTo(50, 720).lineTo(550, 720).strokeColor('#e0e0e0').stroke();
    doc.fontSize(9).font('Helvetica').fillColor('#999999');
    doc.text(
      'Thank you for choosing our Healthcare Platform. Questions? Contact support@yourhealthcare.com',
      50, 728, { align: 'center', width: 500 }
    );

    doc.end();
  });
};

/**
 * Create an Invoice record and generate its PDF, linked to a Transaction.
 *
 * @param {object} transaction - Mongoose Transaction document
 * @returns {Promise<Invoice>}
 */
const createInvoice = async (transaction) => {
  try {
    const lineItems = [
      {
        description: `Telemedicine consultation – Dr. ${transaction.metadata.doctorName} (${transaction.metadata.specialty || 'General'})`,
        quantity   : 1,
        unitPrice  : transaction.amount,
        total      : transaction.amount,
      },
    ];

    const invoice = new Invoice({
      transactionId : transaction._id,
      patientId     : transaction.patientId,
      lineItems,
      subtotal      : transaction.amount,
      tax           : 0,
      totalAmount   : transaction.amount,
      currency      : transaction.currency,
      status        : 'issued',
      billingDetails: { patientName: transaction.metadata.patientName },
      doctorDetails : {
        name     : transaction.metadata.doctorName,
        specialty: transaction.metadata.specialty,
      },
      appointmentDate: transaction.metadata.appointmentDate,
      issuedAt       : new Date(),
    });

    await invoice.save(); // triggers auto invoiceNumber pre-save hook

    // Generate PDF and attach buffer
    const pdfBuffer = await generateInvoicePDF(invoice);
    invoice.pdfBuffer = pdfBuffer;
    await invoice.save();

    logger.info(`Invoice created: ${invoice.invoiceNumber} for transaction ${transaction._id}`);
    return invoice;
  } catch (error) {
    logger.error(`Invoice creation failed: ${error.message}`);
    throw error;
  }
};

module.exports = { createInvoice, generateInvoicePDF };
