/**
 * Subscription Success Page Code
 * Handles post-checkout flow for Pro and Enterprise subscription signups
 *
 * Setup Instructions:
 * 1. This page should exist at URL: /subscription-success
 * 2. Add an HTML iframe component and embed Subscription_Success.html
 * 3. This code handles messages from the HTML component
 *
 * Works with:
 * - Pro Monthly, Pro 6-Month
 * - Enterprise Monthly, Enterprise 6-Month
 *
 * Element IDs:
 * - #html1 (or similar) - HTML component containing Subscription_Success.html
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { getCheckoutSession } from 'backend/stripeService';

$w.onReady(async function () {
  console.log('Subscription Success page initialized');

  // Get URL parameters
  const sessionId = wixLocation.query.session_id || null;
  const plan = wixLocation.query.plan || null;

  console.log(`Subscription success - Session: ${sessionId}, Plan: ${plan}`);

  // Fetch session details from Stripe
  let sessionData = null;
  if (sessionId) {
    try {
      const result = await getCheckoutSession(sessionId);
      if (result.success) {
        sessionData = result.session;
        console.log('Session data retrieved:', sessionData);
      }
    } catch (e) {
      console.error('Failed to fetch session data:', e);
    }
  }

  // Determine plan type from session or URL
  const planType = determinePlanType(plan, sessionData);

  // Initialize HTML component handler
  initSubscriptionSuccessHandler(sessionId, planType, sessionData);
});

/**
 * Determine plan type from URL param or session metadata
 */
function determinePlanType(urlPlan, sessionData) {
  // Check URL param first
  if (urlPlan) {
    if (urlPlan.toLowerCase().includes('enterprise')) return 'enterprise';
    if (urlPlan.toLowerCase().includes('pro')) return 'pro';
  }

  // Check session metadata
  if (sessionData?.metadata?.plan) {
    const metaPlan = sessionData.metadata.plan.toLowerCase();
    if (metaPlan.includes('enterprise')) return 'enterprise';
    if (metaPlan.includes('pro')) return 'pro';
  }

  // Check price ID in session
  if (sessionData?.lineItems?.[0]?.price?.id) {
    const priceId = sessionData.lineItems[0].price.id.toLowerCase();
    if (priceId.includes('enterprise')) return 'enterprise';
  }

  // Default to pro
  return 'pro';
}

/**
 * Build the data payload to send to the HTML component
 */
function buildSuccessPayload(sessionId, planType, sessionData) {
  return {
    type: 'subscriptionSuccessData',
    data: {
      sessionId: sessionId,
      plan: planType,
      amountPaid: sessionData?.amountTotal || null,
      customerEmail: sessionData?.customerEmail || null,
      companyName: sessionData?.metadata?.company_name || null
    }
  };
}

/**
 * Initialize the subscription success HTML component handler
 * Broadcasts to ALL HTML components since we can't identify which is which
 */
function initSubscriptionSuccessHandler(sessionId, planType, sessionData) {
  const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlComponent', '#subscriptionHtml'];
  const htmlComponents = [];

  for (const id of possibleIds) {
    try {
      const component = $w(id);
      if (component && typeof component.onMessage === 'function') {
        htmlComponents.push({ id, component });
        console.log(`Subscription success handler attached to ${id}`);
      }
    } catch (e) {
      // Component doesn't exist, try next
    }
  }

  if (htmlComponents.length === 0) {
    console.log('No HTML component found for subscription success page');
    return;
  }

  const payload = buildSuccessPayload(sessionId, planType, sessionData);

  // Attach message handler and send data to ALL HTML components
  for (const { id, component } of htmlComponents) {
    component.onMessage(async (event) => {
      const msg = event.data;
      if (!msg || !msg.type) return;

      console.log(`Subscription success [${id}] received message:`, msg.type);

      if (msg.type === 'subscriptionSuccess') {
        console.log('Subscription confirmed:', msg.data);
        try {
          if (typeof wixWindow !== 'undefined' && wixWindow.trackEvent) {
            wixWindow.trackEvent('SubscriptionCompleted', {
              sessionId: sessionId,
              plan: planType,
              amount: sessionData?.amountTotal
            });
          }
        } catch (e) {
          console.log('Analytics tracking not available');
        }
      }

      if (msg.type === 'getSubscriptionSuccessData') {
        component.postMessage(payload);
      }

      if (msg.type === 'redirectToDashboard') {
        wixLocation.to('/recruiter-console');
      }

      if (msg.type === 'redirectToDriverSearch') {
        wixLocation.to('/recruiter-driver-search');
      }
    });

    // Send initial data to each component
    setTimeout(() => {
      component.postMessage(payload);
    }, 500);
  }
}
