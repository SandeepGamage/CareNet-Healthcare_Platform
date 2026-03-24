const Transaction               = require('../models/Transaction');
const { constructWebhookEvent } = require('../services/stripeService');
const { createInvoice }         = require('../services/invoiceService');
const { sendPaymentConfirmation } = require('../services/notificationService');
const logger                    = require('../utils/logger');

/**
 * POST /api/payments/webhook
 *
 * IMPORTANT: This route must be mounted BEFORE express.json() in app.js
 * because Stripe requires the raw request body to verify the signature.
 * It is mounted with:  express.raw({ type: 'application/json' })
 */
const handleWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  // ── 1. Verify signature ───────────────────────────────────────────────────
  let event;
  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    logger.error(`Webhook signature failed: ${err.message}`);
    return res.status(400).json({ error: err.message });
  }

  logger.info(`Stripe webhook received: ${event.type}`);

  // ── 2. Dispatch to the right handler ─────────────────────────────────────
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCancelled(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      default:
        logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }

    // Always acknowledge receipt to Stripe
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`Webhook handler error: ${error.message}`);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// ─── Event Handlers ────────────────────────────────────────────────────────────

/**
 * payment_intent.succeeded
 * 1. Mark transaction as succeeded
 * 2. Generate PDF invoice
 * 3. Send email/SMS notifications to patient & doctor
 */
const handlePaymentSucceeded = async (paymentIntent) => {
  const transaction = await Transaction.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntent.id },
    {
      status        : 'succeeded',
      stripeChargeId: paymentIntent.latest_charge,
    },
    { new: true }
  );

  if (!transaction) {
    logger.warn(`No transaction found for PaymentIntent: ${paymentIntent.id}`);
    return;
  }

  // Generate invoice (non-fatal if it fails)
  try {
    const invoice = await createInvoice(transaction);
    transaction.invoiceId = invoice._id;
    await transaction.save();
  } catch (err) {
    logger.error(`Invoice generation failed for transaction ${transaction._id}: ${err.message}`);
  }

  // Send notifications (non-blocking)
  await sendPaymentConfirmation({
    transaction,
    patientEmail: paymentIntent.metadata.patientEmail,
    doctorEmail : paymentIntent.metadata.doctorEmail,
  });

  logger.info(`Payment succeeded — transaction: ${transaction._id}`);
};

/**
 * payment_intent.payment_failed
 * Mark transaction as failed and store the failure reason.
 */
const handlePaymentFailed = async (paymentIntent) => {
  await Transaction.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntent.id },
    {
      status       : 'failed',
      failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
    }
  );
  logger.warn(`Payment failed — PaymentIntent: ${paymentIntent.id}`);
};

/**
 * payment_intent.canceled
 * Mark transaction as cancelled.
 */
const handlePaymentCancelled = async (paymentIntent) => {
  await Transaction.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntent.id },
    { status: 'cancelled' }
  );
  logger.info(`Payment cancelled — PaymentIntent: ${paymentIntent.id}`);
};

/**
 * charge.refunded
 * Update transaction status to 'refunded' or 'partially_refunded'.
 */
const handleChargeRefunded = async (charge) => {
  const status =
    charge.amount_refunded === charge.amount ? 'refunded' : 'partially_refunded';

  await Transaction.findOneAndUpdate(
    { stripeChargeId: charge.id },
    { status }
  );
  logger.info(`Charge refunded (${status}) — charge: ${charge.id}`);
};

module.exports = { handleWebhook };
