const stripe = require('../config/stripe');
const logger = require('../utils/logger');

/**
 * Create a Stripe PaymentIntent.
 * Amount must be in the smallest currency unit (cents for USD).
 */
const createPaymentIntent = async ({ amount, currency = 'usd', metadata = {} }) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount             : Math.round(amount), // ensure integer
      currency,
      metadata,
      payment_method_types: ['card'],
      description        : `Healthcare consultation - ${metadata.doctorName || ''}`,
    });

    logger.info(`PaymentIntent created: ${paymentIntent.id}`);
    return paymentIntent;
  } catch (error) {
    logger.error(`Stripe createPaymentIntent error: ${error.message}`);
    throw error;
  }
};

/**
 * Retrieve a PaymentIntent from Stripe by its ID.
 */
const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    logger.error(`Stripe retrievePaymentIntent error: ${error.message}`);
    throw error;
  }
};

/**
 * Create a refund via Stripe.
 * If amount is omitted, a full refund is issued.
 */
const createRefund = async ({ paymentIntentId, amount, reason }) => {
  try {
    const payload = {
      payment_intent: paymentIntentId,
      reason        : mapRefundReason(reason),
    };

    if (amount) payload.amount = Math.round(amount); // partial refund

    const refund = await stripe.refunds.create(payload);
    logger.info(`Stripe refund created: ${refund.id} for PaymentIntent: ${paymentIntentId}`);
    return refund;
  } catch (error) {
    logger.error(`Stripe createRefund error: ${error.message}`);
    throw error;
  }
};

/**
 * Construct and verify a Stripe webhook event (validates signature).
 */
const constructWebhookEvent = (payload, signature) => {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    logger.error(`Webhook signature verification failed: ${error.message}`);
    throw new Error(`Webhook Error: ${error.message}`);
  }
};

/**
 * Map internal refund reason codes to Stripe-accepted reasons.
 */
const mapRefundReason = (reason) => {
  const map = {
    duplicate              : 'duplicate',
    fraudulent             : 'fraudulent',
    requested_by_customer  : 'requested_by_customer',
    appointment_cancelled  : 'requested_by_customer',
    doctor_unavailable     : 'requested_by_customer',
  };
  return map[reason] || 'requested_by_customer';
};

module.exports = {
  createPaymentIntent,
  retrievePaymentIntent,
  createRefund,
  constructWebhookEvent,
};
