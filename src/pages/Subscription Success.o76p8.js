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
 * Initialize the subscription success HTML component handler
 * Handles messages from Subscription_Success.html
 */
function initSubscriptionSuccessHandler(sessionId, planType, sessionData) {
  // Try multiple possible HTML component IDs
  const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlComponent', '#subscriptionHtml'];
  let htmlComponent = null;

  for (const id of possibleIds) {
    try {
      const component = $w(id);
      if (component && typeof component.onMessage === 'function') {
        htmlComponent = component;
        console.log(`Subscription success handler attached to ${id}`);
        break;
      }
    } catch (e) {
      // Component doesn't exist, try next
    }
  }

  if (!htmlComponent) {
    console.log('No HTML component found for subscription success page');
    return;
  }

  // Listen for messages from the HTML component
  htmlComponent.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || !msg.type) return;

    console.log('Subscription success page received message:', msg.type);

    // Handle subscription success notification from HTML
    if (msg.type === 'subscriptionSuccess') {
      console.log('Subscription confirmed:', msg.data);

      // Track successful subscription
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

    // Handle request for session data
    if (msg.type === 'getSubscriptionSuccessData') {
      htmlComponent.postMessage({
        type: 'subscriptionSuccessData',
        data: {
          sessionId: sessionId,
          plan: planType,
          amountPaid: sessionData?.amountTotal || null,
          customerEmail: sessionData?.customerEmail || null,
          companyName: sessionData?.metadata?.company_name || null
        }
      });
    }

    // Handle redirect to dashboard
    if (msg.type === 'redirectToDashboard') {
      wixLocation.to('/recruiter-console');
    }

    // Handle redirect to driver search
    if (msg.type === 'redirectToDriverSearch') {
      wixLocation.to('/recruiter-driver-search');
    }
  });

  // Send initial data to HTML component after a short delay
  setTimeout(() => {
    htmlComponent.postMessage({
      type: 'subscriptionSuccessData',
      data: {
        sessionId: sessionId,
        plan: planType,
        amountPaid: sessionData?.amountTotal || null,
        customerEmail: sessionData?.customerEmail || null,
        companyName: sessionData?.metadata?.company_name || null
      }
    });
  }, 500);
}
