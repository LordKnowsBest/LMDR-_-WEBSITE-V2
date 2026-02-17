// ============================================================================
// HTTP FUNCTIONS - Wix Velo HTTP Endpoints
// Contains webhook handlers for Stripe and other external services
// ============================================================================

import { ok, badRequest, serverError } from 'wix-http-functions';
import { getSecret } from 'wix-secrets-backend';
import crypto from 'crypto';
import {
  upsertSubscription,
  upsertApiSubscriptionFromStripe,
  resetQuota,
  getApiBillingSummary,
  updateSubscriptionStatus,
  updateApiSubscriptionStatus,
  recordBillingEvent,
  isEventProcessed,
  logStripeEvent,
  updatePaymentStatus
} from 'backend/stripeCore';
import { updateLeadStatus } from 'backend/carrierLeadsService';
import { sendPaymentReceivedEmail } from 'backend/emailService';
import {
  trackAbandonedCheckout,
  markCheckoutRecovered
} from 'backend/abandonmentEmailService';
import { handleGatewayRequest } from 'backend/apiGateway';
import { handleAgentTurn } from 'backend/agentService';
import * as dataAccess from 'backend/dataAccess';

// Data source configuration imports
// Note: http-functions.js uses standard imports (not .jsw)
// The stripeService and abandonmentEmailService handle data source routing internally

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
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('hex');

    // Compare signatures (timing-safe comparison)
    // We convert hex strings to buffers for timingSafeEqual
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const signatureBuffer = Buffer.from(signatureHash, 'hex');

    if (expectedBuffer.length !== signatureBuffer.length ||
        !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return { success: false, error: 'Signature mismatch' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Webhook] Signature verification error:', error);
    return { success: false, error: error.message };
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
  const partnerId = subscription.metadata?.partner_id;
  if (partnerId) {
    const result = await upsertApiSubscriptionFromStripe(subscription, subscription.customer);
    if (result.success) {
      await recordBillingEvent(partnerId, 'api_subscription_created', {
        description: `API subscription ${subscription.id} created`
      });
    }
    return {
      status: result.success ? 'created' : 'error',
      carrierDot: null
    };
  }

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
  const partnerId = subscription.metadata?.partner_id;
  if (partnerId) {
    const result = await upsertApiSubscriptionFromStripe(subscription, subscription.customer);
    if (subscription.cancel_at_period_end) {
      await recordBillingEvent(partnerId, 'api_subscription_cancel_scheduled', {
        description: 'API subscription scheduled for cancellation at period end'
      });
    }
    return {
      status: result.success ? 'updated' : 'error',
      carrierDot: null
    };
  }

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
  const partnerId = subscription.metadata?.partner_id;
  if (partnerId) {
    const result = await updateApiSubscriptionStatus(subscription.id, 'cancelled');
    if (result.success) {
      await recordBillingEvent(partnerId, 'api_subscription_canceled', {
        description: 'API subscription has been canceled'
      });
    }
    return {
      status: result.success ? 'deleted' : 'error',
      carrierDot: null
    };
  }

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
  const partnerId = invoice.subscription_details?.metadata?.partner_id ||
    invoice.lines?.data[0]?.metadata?.partner_id;

  if (partnerId) {
    const summary = await getApiBillingSummary(partnerId).catch(() => null);
    await recordBillingEvent(partnerId, 'api_payment_succeeded', {
      amount: invoice.amount_paid,
      currency: invoice.currency,
      invoiceId: invoice.id,
      overageAmount: summary?.overage_amount || 0,
      description: `API payment for ${invoice.lines?.data[0]?.description || 'API subscription'}`
    });
    return {
      status: 'paid',
      carrierDot: null
    };
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
  const partnerId = invoice.subscription_details?.metadata?.partner_id ||
    invoice.lines?.data[0]?.metadata?.partner_id;

  if (partnerId) {
    await updateApiSubscriptionStatus(invoice.subscription, 'past_due');
    await recordBillingEvent(partnerId, 'api_payment_failed', {
      amount: invoice.amount_due,
      currency: invoice.currency,
      invoiceId: invoice.id,
      description: `API payment failed: ${invoice.last_finalization_error?.message || 'Unknown error'}`
    });
    return {
      status: 'payment_failed',
      carrierDot: null
    };
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

  // Fulfilment: Update Carrier Lead status and Payment status
  // 1. Update CarrierPayment status if this was a payment session
  try {
    if (session.mode === 'payment' && session.payment_status === 'paid') {
      await updatePaymentStatus(session.id, 'completed', {
        paymentIntentId: session.payment_intent,
        amount: session.amount_total,
        currency: session.currency
      });
    }
  } catch (e) { console.error('Error updating payment status', e); }

  // 2. Update Carrier Lead Status
  const leadId = session.metadata?.leadId; // Ensure we passed this in metadata
  if (leadId) {
    // Update status to activated_paid
    await updateLeadStatus(leadId, 'activated_paid',
      `Payment received: ${(session.amount_total / 100).toFixed(2)} ${session.currency.toUpperCase()}`);

    // Send receipt email
    if (customerEmail) {
      await sendPaymentReceivedEmail(customerEmail, {
        amount: `$${(session.amount_total / 100).toFixed(2)}`,
        description: 'Driver Placement Deposit',
        transactionId: session.payment_intent,
        date: new Date().toLocaleDateString()
      });
    }
  }

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

// ============================================================================
// EXTERNAL API GATEWAY ENDPOINT
// Base route: /_functions/api_gateway/v1/*
// ============================================================================

export async function get_api_gateway(request) {
  return handleGatewayRequest(request);
}

export async function post_api_gateway(request) {
  return handleGatewayRequest(request);
}

export async function delete_api_gateway(request) {
  return handleGatewayRequest(request);
}

export async function options_api_gateway(request) {
  return handleGatewayRequest(request);
}

// ============================================================================
// VAPI VOICE WEBHOOK ENDPOINT
// POST https://www.lastmiledeliveryrecruiting.com/_functions/vapi_webhook
// ============================================================================

export async function post_vapi_webhook(request) {
  try {
    const body = await request.body.json();
    const messageType = body.message?.type;

    switch (messageType) {
      case 'end-of-call-report': {
        // Save transcript and summary to voiceCallLogs
        const callData = body.message;
        await dataAccess.insertRecord('voiceCallLogs', {
          callId: callData.call?.id || '',
          transcript: JSON.stringify(callData.transcript || ''),
          summary: callData.summary || '',
          duration: callData.call?.duration || 0,
          endedReason: callData.endedReason || '',
          recordingUrl: callData.recordingUrl || '',
          completedAt: new Date().toISOString()
        }, { suppressAuth: true });
        return ok({ success: true });
      }

      case 'function-call':
      case 'tool-calls': {
        // Execute backend service and return result within 7.5s
        const toolCall = body.message.toolCallList?.[0] || body.message.functionCall;
        if (!toolCall) return ok({ results: [] });

        const toolName = toolCall.function?.name || toolCall.name;
        const toolArgs = typeof toolCall.function?.arguments === 'string'
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function?.arguments || toolCall.arguments || {};

        // Determine role from metadata
        const role = body.message.call?.metadata?.role || 'driver';
        const userId = body.message.call?.metadata?.userId || 'voice-user';

        // Use agent service for tool execution
        const result = await handleAgentTurn(role, userId, `Execute tool: ${toolName}`, {
          directToolCall: { name: toolName, input: toolArgs }
        });

        return ok({
          results: [{
            toolCallId: toolCall.id,
            result: result.response
          }]
        });
      }

      case 'assistant-request': {
        // Return dynamic assistant config
        return ok({
          assistant: {
            model: {
              provider: 'anthropic',
              model: 'claude-sonnet-4-20250514',
              messages: [{
                role: 'system',
                content: 'You are an AI assistant for Last Mile Driver Recruiting. Help callers with carrier matching, job information, and trucking industry questions.'
              }]
            },
            voice: {
              provider: '11labs',
              voiceId: 'paula'
            }
          }
        });
      }

      default:
        return ok({ success: true });
    }
  } catch (error) {
    console.error('[VAPI Webhook] Error:', error);
    return serverError({ error: error.message });
  }
}

export function get_vapi_webhook(request) {
  return ok({
    status: 'healthy',
    service: 'vapi-webhook',
    timestamp: new Date().toISOString()
  });
}
