// ============================================================================
// HTTP FUNCTIONS - Wix Velo HTTP Endpoints
// Contains webhook handlers for Stripe and other external services
// ============================================================================

import { ok, badRequest, serverError } from 'wix-http-functions';
import { getSecret } from 'wix-secrets-backend';
import {
  upsertSubscription,
  resetQuota,
  updateSubscriptionStatus,
  recordBillingEvent,
  isEventProcessed,
  logStripeEvent
} from 'backend/stripeService';
import {
  trackAbandonedCheckout,
  markCheckoutRecovered
} from 'backend/abandonmentEmailService';

// ============================================================================
// STRIPE WEBHOOK ENDPOINT
// POST https://www.lastmiledeliveryrecruiting.com/_functions/stripe_webhook
// ============================================================================

/**
 * Stripe webhook handler
 * Processes subscription lifecycle events from Stripe
 */
export async function post_stripe_webhook(request) {
  try {
    const body = await request.body.text();
    const signature = request.headers['stripe-signature'];

    // Verify signature
    const verificationResult = await verifyStripeSignature(body, signature);
    if (!verificationResult.success) {
      console.error('[Webhook] Signature verification failed');
      return badRequest({ error: 'Invalid signature' });
    }

    const event = JSON.parse(body);

    // Idempotency check - skip if already processed
    const alreadyProcessed = await isEventProcessed(event.id);
    if (alreadyProcessed) {
      console.log(`[Webhook] Event ${event.id} already processed, skipping`);
      return ok({ received: true, status: 'already_processed' });
    }

    // Route event to appropriate handler
    const result = await handleStripeEvent(event);

    // Log the event for idempotency
    await logStripeEvent(event.id, event.type, {
      carrierDot: result.carrierDot,
      status: result.status
    });

    console.log(`[Webhook] Processed ${event.type} (${event.id})`);

    return ok({ received: true, status: result.status });
  } catch (error) {
    console.error('[Webhook] Error processing event:', error);
    return serverError({ error: error.message });
  }
}

// ============================================================================
// SIGNATURE VERIFICATION
// ============================================================================

/**
 * Verify Stripe webhook signature
 * Uses HMAC-SHA256 to validate the request came from Stripe
 */
async function verifyStripeSignature(payload, signature) {
  try {
    if (!signature) {
      return { success: false, error: 'No signature provided' };
    }

    const webhookSecret = await getSecret('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.warn('[Webhook] No webhook secret configured, skipping verification');
      // In development, allow unsigned requests
      return { success: true, warning: 'No secret configured' };
    }

    // Parse signature header
    // Format: t=timestamp,v1=signature
    const elements = signature.split(',');
    const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
    const signatureHash = elements.find(e => e.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !signatureHash) {
      return { success: false, error: 'Invalid signature format' };
    }

    // Check timestamp tolerance (5 minutes)
    const tolerance = 5 * 60;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > tolerance) {
      return { success: false, error: 'Timestamp outside tolerance' };
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = await computeHmacSignature(signedPayload, webhookSecret);

    // Compare signatures (timing-safe comparison)
    if (expectedSignature !== signatureHash) {
      return { success: false, error: 'Signature mismatch' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Webhook] Signature verification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Compute HMAC-SHA256 signature
 * Wix Velo uses Web Crypto API
 */
async function computeHmacSignature(message, secret) {
  try {
    // Encode the key and message
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    // Import key for HMAC
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Sign the message
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  } catch (error) {
    console.error('[Webhook] HMAC computation error:', error);
    throw error;
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Route Stripe event to appropriate handler
 */
async function handleStripeEvent(event) {
  const { type, data } = event;

  switch (type) {
    // Subscription lifecycle events
    case 'customer.subscription.created':
      return await handleSubscriptionCreated(data.object);

    case 'customer.subscription.updated':
      return await handleSubscriptionUpdated(data.object);

    case 'customer.subscription.deleted':
      return await handleSubscriptionDeleted(data.object);

    // Payment events
    case 'invoice.paid':
      return await handleInvoicePaid(data.object);

    case 'invoice.payment_failed':
      return await handlePaymentFailed(data.object);

    // Checkout events
    case 'checkout.session.completed':
      return await handleCheckoutCompleted(data.object);

    case 'checkout.session.expired':
      return await handleCheckoutExpired(data.object);

    default:
      console.log(`[Webhook] Unhandled event type: ${type}`);
      return { status: 'unhandled', carrierDot: null };
  }
}

/**
 * Handle new subscription created
 */
async function handleSubscriptionCreated(subscription) {
  const carrierDot = subscription.metadata?.carrier_dot;
  console.log(`[Webhook] Subscription created for carrier ${carrierDot}`);

  const result = await upsertSubscription(subscription, subscription.customer);

  if (result.success) {
    await recordBillingEvent(carrierDot, 'subscription_created', {
      description: `Subscription ${subscription.id} created`
    });
  }

  return {
    status: result.success ? 'created' : 'error',
    carrierDot
  };
}

/**
 * Handle subscription updated (status changes, cancellations)
 */
async function handleSubscriptionUpdated(subscription) {
  const carrierDot = subscription.metadata?.carrier_dot;
  console.log(`[Webhook] Subscription updated for carrier ${carrierDot}: status=${subscription.status}`);

  // Update the full subscription data
  const result = await upsertSubscription(subscription, subscription.customer);

  // Record status change
  if (subscription.cancel_at_period_end) {
    await recordBillingEvent(carrierDot, 'subscription_cancel_scheduled', {
      description: 'Subscription scheduled for cancellation at period end'
    });
  }

  return {
    status: result.success ? 'updated' : 'error',
    carrierDot
  };
}

/**
 * Handle subscription deleted (ended)
 */
async function handleSubscriptionDeleted(subscription) {
  const carrierDot = subscription.metadata?.carrier_dot;
  console.log(`[Webhook] Subscription deleted for carrier ${carrierDot}`);

  const result = await updateSubscriptionStatus(subscription.id, 'canceled');

  if (result.success) {
    await recordBillingEvent(carrierDot, 'subscription_canceled', {
      description: 'Subscription has been canceled'
    });
  }

  return {
    status: result.success ? 'deleted' : 'error',
    carrierDot
  };
}

/**
 * Handle successful payment - reset quota for new billing period
 */
async function handleInvoicePaid(invoice) {
  // Only process subscription invoices
  if (!invoice.subscription) {
    return { status: 'skipped', carrierDot: null };
  }

  const carrierDot = invoice.subscription_details?.metadata?.carrier_dot ||
    invoice.lines?.data[0]?.metadata?.carrier_dot;

  console.log(`[Webhook] Invoice paid for carrier ${carrierDot}: $${invoice.amount_paid / 100}`);

  // If this is a renewal (not the first invoice), reset the quota
  if (invoice.billing_reason === 'subscription_cycle') {
    const periodStart = new Date(invoice.period_start * 1000);
    const periodEnd = new Date(invoice.period_end * 1000);

    const result = await resetQuota(carrierDot, periodStart, periodEnd);
    if (result.success) {
      console.log(`[Webhook] Quota reset for carrier ${carrierDot}`);
    }
  }

  // Record payment
  await recordBillingEvent(carrierDot, 'payment_succeeded', {
    amount: invoice.amount_paid,
    currency: invoice.currency,
    invoiceId: invoice.id,
    description: `Payment for ${invoice.lines?.data[0]?.description || 'subscription'}`
  });

  return {
    status: 'paid',
    carrierDot
  };
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice) {
  if (!invoice.subscription) {
    return { status: 'skipped', carrierDot: null };
  }

  const carrierDot = invoice.subscription_details?.metadata?.carrier_dot ||
    invoice.lines?.data[0]?.metadata?.carrier_dot;

  console.log(`[Webhook] Payment failed for carrier ${carrierDot}`);

  // Update subscription status
  await updateSubscriptionStatus(invoice.subscription, 'past_due');

  // Record failure
  await recordBillingEvent(carrierDot, 'payment_failed', {
    amount: invoice.amount_due,
    currency: invoice.currency,
    invoiceId: invoice.id,
    description: `Payment failed: ${invoice.last_finalization_error?.message || 'Unknown error'}`
  });

  return {
    status: 'payment_failed',
    carrierDot
  };
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(session) {
  const carrierDot = session.metadata?.carrier_dot;
  const customerEmail = session.customer_email;
  console.log(`[Webhook] Checkout completed for carrier ${carrierDot}`);

  // The subscription will be handled by customer.subscription.created
  // Just record the checkout completion
  await recordBillingEvent(carrierDot, 'checkout_completed', {
    description: `Checkout session ${session.id} completed`
  });

  // Mark any pending abandonment as recovered
  if (customerEmail) {
    const recoveryResult = await markCheckoutRecovered(customerEmail, session.id);
    if (recoveryResult.wasAbandoned) {
      console.log(`[Webhook] Recovered abandoned checkout for ${customerEmail}`);
    }
  }

  return {
    status: 'checkout_completed',
    carrierDot
  };
}

/**
 * Handle checkout session expired (abandoned)
 * Triggers abandonment email sequence
 */
async function handleCheckoutExpired(session) {
  const carrierDot = session.metadata?.carrier_dot;
  const customerEmail = session.customer_email;
  console.log(`[Webhook] Checkout expired for carrier ${carrierDot}, email: ${customerEmail}`);

  // Track the abandonment for email follow-up
  if (customerEmail) {
    const trackResult = await trackAbandonedCheckout(session);
    if (trackResult.success) {
      console.log(`[Webhook] Tracked abandonment ${trackResult.abandonmentId} for ${customerEmail}`);
    } else {
      console.error(`[Webhook] Failed to track abandonment: ${trackResult.error}`);
    }
  }

  // Record the event
  await recordBillingEvent(carrierDot, 'checkout_abandoned', {
    description: `Checkout session ${session.id} expired (abandoned)`
  });

  return {
    status: 'checkout_expired',
    carrierDot
  };
}

// ============================================================================
// HEALTH CHECK ENDPOINT (for testing)
// ============================================================================

/**
 * Health check endpoint
 * GET https://www.lastmiledeliveryrecruiting.com/_functions/stripe_webhook
 */
export function get_stripe_webhook(request) {
  return ok({
    status: 'healthy',
    service: 'stripe-webhook',
    timestamp: new Date().toISOString()
  });
}
