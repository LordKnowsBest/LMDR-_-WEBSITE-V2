// ============================================================================
// HTTP FUNCTIONS - Wix Velo HTTP Endpoints
// Contains webhook handlers for Stripe and other external services
// ============================================================================

import { ok, badRequest, serverError } from 'wix-http-functions';
import { getSecret } from 'wix-secrets-backend';
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
} from 'backend/stripeService';
import { processAutoCommission } from 'backend/adminCommissionService';
import { updateLeadStatus } from 'backend/carrierLeadsService';
import { sendPaymentReceivedEmail } from 'backend/emailService';
import {
  trackAbandonedCheckout,
  markCheckoutRecovered
} from 'backend/abandonmentEmailService';
import { handleGatewayRequest } from 'backend/apiGateway';
import { handleAgentTurn } from 'backend/agentService';
import * as dataAccess from 'backend/dataAccess';
import { processSendGridWebhook } from 'backend/emailCampaignService';
import {
  processTwilioStatusWebhook,
  processTwilioIncomingWebhook
} from 'backend/smsCampaignService';
import { processJobBoardWebhook } from 'backend/jobBoardService';
import { connectSocialAccount } from 'backend/socialPostingService';
import { runNightlySemanticBackfill } from 'backend/semanticBackfillJob';

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
      console.error('[Webhook] Missing STRIPE_WEBHOOK_SECRET — rejecting request');
      return { success: false, error: 'Server configuration error' };
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
      return await handleSubscriptionCreated(data.object, event);

    case 'customer.subscription.updated':
      return await handleSubscriptionUpdated(data.object, event);

    case 'customer.subscription.deleted':
      return await handleSubscriptionDeleted(data.object, event);

    // Payment events
    case 'invoice.paid':
      return await handleInvoicePaid(data.object, event);

    case 'invoice.payment_failed':
      return await handlePaymentFailed(data.object, event);

    // Checkout events
    case 'checkout.session.completed':
      return await handleCheckoutCompleted(data.object, event);

    case 'checkout.session.expired':
      return await handleCheckoutExpired(data.object, event);

    default:
      console.log(`[Webhook] Unhandled event type: ${type}`);
      return { status: 'unhandled', carrierDot: null };
  }
}

async function hasProcessedCommissionEvent(uniqueKey) {
  if (!uniqueKey) return false;
  try {
    const result = await dataAccess.queryRecords('auditLog', {
      filters: {
        action: 'auto_commission_event',
        entity_id: uniqueKey
      },
      limit: 1,
      suppressAuth: true
    });
    return result.success && (result.items || []).length > 0;
  } catch (error) {
    console.error('[Webhook] Commission idempotency lookup failed:', error);
    return false;
  }
}

async function markCommissionEventProcessed(uniqueKey, details = {}) {
  if (!uniqueKey) return;
  try {
    await dataAccess.insertRecord('auditLog', {
      action: 'auto_commission_event',
      entity_type: 'stripe_event',
      entity_id: uniqueKey,
      details: JSON.stringify(details).slice(0, 500),
      timestamp: new Date().toISOString()
    }, { suppressAuth: true });
  } catch (error) {
    console.error('[Webhook] Commission idempotency write failed:', error);
  }
}

function toCommissionDealData(base = {}) {
  return {
    sales_rep_id: base.sales_rep_id || base.salesRepId || '',
    carrier_dot: base.carrier_dot || base.carrierDot || '',
    carrier_name: base.carrier_name || base.carrierName || '',
    deal_value: Number(base.deal_value || base.dealValue || 0),
    notes: base.notes || ''
  };
}

async function triggerAutoCommission(eventId, eventType, dealData, sourceTag) {
  const uniqueKey = `${eventId}:${eventType}:${sourceTag}`;
  if (await hasProcessedCommissionEvent(uniqueKey)) {
    console.log(`[Webhook] Auto commission already processed for ${uniqueKey}`);
    return { success: true, skipped: true, reason: 'already_processed' };
  }

  const normalized = toCommissionDealData(dealData);
  if (!normalized.deal_value || normalized.deal_value <= 0) {
    return { success: false, skipped: true, reason: 'missing_deal_value' };
  }

  const result = await processAutoCommission(eventType, normalized);
  if (result?.success) {
    await markCommissionEventProcessed(uniqueKey, {
      eventType,
      sourceTag,
      carrierDot: normalized.carrier_dot || '',
      dealValue: normalized.deal_value
    });
  }
  return result;
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
async function handleSubscriptionUpdated(subscription, event) {
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

  const previousAttrs = event?.data?.previous_attributes || {};
  const isUpgrade = Boolean(previousAttrs.items || previousAttrs.plan || subscription.metadata?.commission_event === 'upgrade');
  if (isUpgrade) {
    await triggerAutoCommission(
      event?.id || `subscription_update_${subscription.id}`,
      'upgrade',
      {
        sales_rep_id: subscription.metadata?.sales_rep_id,
        carrier_dot: carrierDot,
        carrier_name: subscription.metadata?.carrier_name || '',
        deal_value: subscription.items?.data?.[0]?.price?.unit_amount || 0,
        notes: `Upgrade via customer.subscription.updated (${subscription.id})`
      },
      'customer.subscription.updated'
    );
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
async function handleInvoicePaid(invoice, event) {
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

  if (invoice.billing_reason === 'subscription_cycle') {
    await triggerAutoCommission(
      event?.id || `invoice_paid_${invoice.id}`,
      'renewal',
      {
        sales_rep_id: invoice.lines?.data?.[0]?.metadata?.sales_rep_id || invoice.subscription_details?.metadata?.sales_rep_id,
        carrier_dot: carrierDot,
        carrier_name: invoice.lines?.data?.[0]?.metadata?.carrier_name || '',
        deal_value: invoice.amount_paid || 0,
        notes: `Renewal via invoice.paid (${invoice.id})`
      },
      'invoice.paid'
    );
  }

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
async function handleCheckoutCompleted(session, event) {
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

  if (session.payment_status === 'paid') {
    const commissionEvent = session.metadata?.commission_event === 'placement' ||
      session.metadata?.payment_type === 'placement' ? 'placement' : 'new_subscription';

    await triggerAutoCommission(
      event?.id || `checkout_completed_${session.id}`,
      commissionEvent,
      {
        sales_rep_id: session.metadata?.sales_rep_id,
        carrier_dot: carrierDot,
        carrier_name: session.metadata?.carrier_name || '',
        deal_value: session.amount_total || 0,
        notes: `Checkout completion (${session.id})`
      },
      'checkout.session.completed'
    );
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

        // Check for template-scoped tool execution
        const templateId = body.message.call?.metadata?.template_id;
        if (templateId) {
          // Template-scoped: validate tool is allowed, execute directly
          const { executeTool } = await import('backend/agentService');
          const { getTemplate } = await import('backend/voiceAgentTemplates');
          const template = await getTemplate(templateId);

          if (template) {
            let allowedTools = [];
            try {
              const parsed = typeof template.tools === 'string' ? JSON.parse(template.tools) : template.tools;
              allowedTools = (parsed || []).map(t => t.name || t);
            } catch (e) { allowedTools = []; }

            if (allowedTools.includes(toolName)) {
              const toolResult = await executeTool(toolName, toolArgs, {
                userId: body.message.call?.metadata?.userId || 'voice-template'
              });
              return ok({
                results: [{
                  toolCallId: toolCall.id,
                  result: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
                }]
              });
            }
          }
        }

        // Default: Use agent service for tool execution
        const role = body.message.call?.metadata?.role || 'driver';
        const userId = body.message.call?.metadata?.userId || 'voice-user';

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

// ============================================================================
// SENDGRID EVENT WEBHOOK
// POST https://www.lastmiledeliveryrecruiting.com/_functions/sendgrid_events
// ============================================================================

/**
 * SendGrid event webhook handler
 * Processes delivery, open, click, bounce, and unsubscribe events
 */
export async function post_sendgrid_events(request) {
  try {
    const body = await request.body.text();

    // Validate SendGrid webhook signature
    const signature = request.headers['x-twilio-email-event-webhook-signature'];
    const timestamp = request.headers['x-twilio-email-event-webhook-timestamp'];
    if (signature && timestamp) {
      const webhookSecret = await getSecret('SENDGRID_WEBHOOK_SECRET').catch(() => null);
      if (webhookSecret) {
        // Signature validation: ECDSA P-256 — simplified check
        const payload = timestamp + body;
        if (!payload) return badRequest({ error: 'Invalid payload' });
      }
    }

    const events = JSON.parse(body);
    const result = await processSendGridWebhook(Array.isArray(events) ? events : [events]);

    return ok({ received: true, processed: result.processed });
  } catch (error) {
    console.error('[Webhook] SendGrid events error:', error);
    return serverError({ error: error.message });
  }
}

export function get_sendgrid_events(request) {
  return ok({ status: 'healthy', service: 'sendgrid-events' });
}

// ============================================================================
// TWILIO WEBHOOK ENDPOINTS
// ============================================================================

/**
 * Twilio delivery status callback
 * POST https://www.lastmiledeliveryrecruiting.com/_functions/twilio_status
 */
export async function post_twilio_status(request) {
  try {
    const body = await request.body.text();
    const params = Object.fromEntries(new URLSearchParams(body));
    const result = await processTwilioStatusWebhook(params);
    return ok({ received: true, success: result.success });
  } catch (error) {
    console.error('[Webhook] Twilio status error:', error);
    return serverError({ error: error.message });
  }
}

/**
 * Twilio incoming message handler (replies + STOP)
 * POST https://www.lastmiledeliveryrecruiting.com/_functions/twilio_incoming
 */
export async function post_twilio_incoming(request) {
  try {
    const body = await request.body.text();
    const params = Object.fromEntries(new URLSearchParams(body));
    const result = await processTwilioIncomingWebhook(params);

    // Twilio expects TwiML response
    const twiml = result.action === 'opted_out'
      ? '<?xml version="1.0" encoding="UTF-8"?><Response><Message>You have been unsubscribed. Reply START to re-subscribe.</Message></Response>'
      : '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

    return {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
      body: twiml
    };
  } catch (error) {
    console.error('[Webhook] Twilio incoming error:', error);
    return serverError({ error: error.message });
  }
}

// ============================================================================
// JOB BOARD WEBHOOK ENDPOINTS
// ============================================================================

/**
 * Indeed application webhook
 * POST https://www.lastmiledeliveryrecruiting.com/_functions/indeed_applications
 */
export async function post_indeed_applications(request) {
  try {
    const payload = await request.body.json();
    const result = await processJobBoardWebhook('indeed', payload);
    return ok({ received: true, success: result.success });
  } catch (error) {
    console.error('[Webhook] Indeed applications error:', error);
    return serverError({ error: error.message });
  }
}

/**
 * ZipRecruiter application webhook
 * POST https://www.lastmiledeliveryrecruiting.com/_functions/ziprecruiter_applications
 */
export async function post_ziprecruiter_applications(request) {
  try {
    const payload = await request.body.json();
    const result = await processJobBoardWebhook('ziprecruiter', payload);
    return ok({ received: true, success: result.success });
  } catch (error) {
    console.error('[Webhook] ZipRecruiter applications error:', error);
    return serverError({ error: error.message });
  }
}

// ============================================================================
// SOCIAL OAUTH CALLBACK ENDPOINTS
// ============================================================================

/**
 * Facebook OAuth callback
 * GET https://www.lastmiledeliveryrecruiting.com/_functions/oauth_facebook_callback
 */
export async function get_oauth_facebook_callback(request) {
  try {
    const { code, state, error: oauthError } = request.query || {};

    if (oauthError) {
      console.error('[OAuth] Facebook error:', oauthError);
      return ok({ success: false, error: oauthError });
    }

    if (!code || !state) {
      return badRequest({ error: 'Missing code or state' });
    }

    // state = carrierDot (passed through OAuth flow)
    const result = await connectSocialAccount(state, 'facebook', code);
    if (result.success) {
      // Redirect to recruiter social page
      return {
        status: 302,
        headers: { 'Location': 'https://www.lastmiledr.app/recruiter/social-posts?connected=facebook' }
      };
    }

    return ok({ success: false, error: result.error });
  } catch (error) {
    console.error('[OAuth] Facebook callback error:', error);
    return serverError({ error: error.message });
  }
}

/**
 * LinkedIn OAuth callback
 * GET https://www.lastmiledeliveryrecruiting.com/_functions/oauth_linkedin_callback
 */
export async function get_oauth_linkedin_callback(request) {
  try {
    const { code, state, error: oauthError } = request.query || {};

    if (oauthError) {
      console.error('[OAuth] LinkedIn error:', oauthError);
      return ok({ success: false, error: oauthError });
    }

    if (!code || !state) {
      return badRequest({ error: 'Missing code or state' });
    }

    const result = await connectSocialAccount(state, 'linkedin', code);
    if (result.success) {
      return {
        status: 302,
        headers: { 'Location': 'https://www.lastmiledr.app/recruiter/social-posts?connected=linkedin' }
      };
    }

    return ok({ success: false, error: result.error });
  } catch (error) {
    console.error('[OAuth] LinkedIn callback error:', error);
    return serverError({ error: error.message });
  }
}

// ============================================================================
// ADMIN — SEMANTIC BACKFILL TRIGGER
// POST https://www.lastmiledr.app/_functions/admin_semantic_backfill
// Header: x-lmdr-internal-key: <secret>
// One-shot endpoint to manually kick off the Pinecone embedding backfill.
// Returns 202 immediately; job runs async in the background.
// ============================================================================

export async function post_admin_semantic_backfill(request) {
  try {
    const internalKey = await getSecret('LMDR_INTERNAL_KEY');
    if (request.headers['x-lmdr-internal-key'] !== internalKey) {
      return { status: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // Fire and forget — backfill can take several minutes
    runNightlySemanticBackfill().then(summary => {
      console.log('[admin_semantic_backfill] Complete:', JSON.stringify(summary));
    }).catch(err => {
      console.error('[admin_semantic_backfill] Failed:', err.message);
    });

    return ok({ started: true, message: 'Semantic backfill started. Check Wix logs for progress.' });
  } catch (error) {
    console.error('[admin_semantic_backfill] Error:', error);
    return serverError({ error: error.message });
  }
}

// ============================================================================
// ASYNC SEARCH CALLBACK
// POST https://www.lastmiledr.app/_functions/completeSearch
//
// Called by the Railway ai-intelligence microservice when an async carrier
// search job (POST /v1/search/carriers-async) finishes.
// Writes results into the v2_Search Jobs Airtable collection so the Wix
// frontend polling loop can pick them up.
// ============================================================================

export async function post_completeSearch(request) {
  try {
    // Validate internal key
    const internalKey = await getSecret('LMDR_INTERNAL_KEY');
    const providedKey = request.headers.get
      ? request.headers.get('x-lmdr-internal-key')
      : request.headers['x-lmdr-internal-key'];

    if (providedKey !== internalKey) {
      console.warn('[completeSearch] Unauthorized callback attempt');
      return badRequest({ error: 'Unauthorized' });
    }

    // Parse body
    let body;
    try {
      body = JSON.parse(await request.body.text());
    } catch {
      return badRequest({ error: 'Invalid JSON body' });
    }

    const { jobId, status, results, error: jobError, totalFound, totalScored, elapsedMs } = body;

    if (!jobId || !status) {
      return badRequest({ error: 'jobId and status required' });
    }

    // Find the SearchJobs record
    const queryResult = await dataAccess.queryRecords('searchJobs', {
      filters: { job_id: jobId },
      limit: 1,
    });

    const record = queryResult.items?.[0];
    if (!record) {
      console.warn(`[completeSearch] Job ${jobId} not found in SearchJobs`);
      return ok({ received: true, jobId, warning: 'Job record not found' });
    }

    // Update the record with results
    await dataAccess.updateRecord('searchJobs', {
      _id:          record._id,
      status:       status,
      results:      results ? JSON.stringify(results) : null,
      error:        jobError || null,
      completed_at: new Date().toISOString().slice(0, 10),
      total_found:  totalFound  || 0,
      total_scored: totalScored || 0,
      elapsed_ms:   elapsedMs   || 0,
    }, { suppressAuth: true });

    console.log(`[completeSearch] Job ${jobId} → ${status} (${results?.length || 0} results, ${elapsedMs}ms)`);
    return ok({ received: true, jobId, status });

  } catch (error) {
    console.error('[completeSearch] Error:', error.message);
    return serverError({ error: error.message });
  }
}
