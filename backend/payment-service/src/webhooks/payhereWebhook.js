const crypto        = require('crypto');
const Transaction   = require('../models/Transaction');
const { createInvoice }           = require('../services/invoiceService');
const { sendPaymentConfirmation } = require('../services/notificationService');
const logger        = require('../utils/logger');

/**
 * POST /api/payments/payhere/notify
 *
 * Called by PayHere sandbox servers after a payment is completed.
 * PayHere sends a form-encoded POST with payment details + md5sig.
 * We verify the signature using PAYHERE_SECRET before trusting the data.
 */
const handlePayhereWebhook = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
    } = req.body;

    // ── 1. Verify PayHere MD5 signature ───────────────────────────────────────
    const merchant_secret = process.env.PAYHERE_SECRET || process.env.PAYHERE_MERCHANT_SECRET;
    if (!merchant_secret) {
      logger.error('PAYHERE_SECRET/PAYHERE_MERCHANT_SECRET is not set in environment');
      return res.status(500).send('Server configuration error');
    }

    const hashedSecret  = crypto.createHash('md5').update(merchant_secret).digest('hex').toUpperCase();
    const amountFormatted = parseFloat(payhere_amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      useGrouping: false,
    });
    const local_sig = crypto
      .createHash('md5')
      .update(merchant_id + order_id + amountFormatted + payhere_currency + status_code + hashedSecret)
      .digest('hex')
      .toUpperCase();

    if (local_sig !== md5sig) {
      logger.error(`PayHere signature mismatch for order: ${order_id}`);
      return res.status(400).send('Invalid signature');
    }

    // ── 2. Handle payment status ──────────────────────────────────────────────
    // status_code: 2 = Success, 0 = Pending, -1 = Cancelled, -2 = Failed, -3 = Chargedback
    if (status_code === '2') {
      // Payment Successful
      const transaction = await Transaction.findOne({ appointmentId: order_id });

      if (!transaction) {
        logger.warn(`No transaction found for PayHere order: ${order_id}`);
        return res.status(200).send('OK');
      }

      transaction.status = 'succeeded';
      transaction.paymentId = req.body.payment_id;
      transaction.payhereOrderId = order_id;
      await transaction.save();

      // Generate invoice (non-fatal if fails)
      try {
        const invoice = await createInvoice(transaction);
        transaction.invoiceId = invoice._id;
        await transaction.save();
      } catch (err) {
        logger.error(`Invoice generation failed: ${err.message}`);
      }

      // Send email/SMS notifications
      try {
        await sendPaymentConfirmation({ 
          transaction,
          patientEmail: transaction.metadata.patientEmail,
        });
      } catch (err) {
        logger.error(`Notification failed: ${err.message}`);
      }

      logger.info(`PayHere Payment Confirmed — Order: ${order_id}`);

    } else if (status_code === '0') {
      logger.info(`PayHere Payment Pending — Order: ${order_id}`);

    } else {
      // -1=Cancelled, -2=Failed, -3=Chargedback
      await Transaction.findOneAndUpdate(
        { appointmentId: order_id },
        { status: 'failed' }
      );
      logger.warn(`PayHere Payment Failed/Cancelled — Order: ${order_id}, Status: ${status_code}`);
    }

    // PayHere requires a 200 OK, otherwise it keeps retrying
    res.status(200).send('OK');

  } catch (error) {
    logger.error(`PayHere webhook error: ${error.message}`);
    res.status(500).send('Error');
  }
};

module.exports = { handlePayhereWebhook };
