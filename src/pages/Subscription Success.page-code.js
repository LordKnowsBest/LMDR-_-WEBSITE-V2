/**
 * Subscription Success Page Code
 * Handles post-payment flow for subscription checkouts
 *
 * Setup Instructions:
 * 1. Create a new page in Wix Editor called "Subscription Success" (URL: /subscription-success)
 * 2. Add an HTML iframe component and embed Subscription_Success.html
 * 3. Copy this code to the page code panel in Wix Editor
 * 4. After syncing, rename this file to match the page's generated filename (e.g., Subscription Success.xxxxx.js)
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

  // Initialize HTML component handler
  initSubscriptionSuccessHandler(sessionId, plan, sessionData);
});

/**
 * Initialize the subscription success HTML component handler
 * Handles messages from Subscription_Success.html
 */
function initSubscriptionSuccessHandler(sessionId, plan, sessionData) {
  // Try multiple possible HTML component IDs
  const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlComponent', '#successHtml'];
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
          wixWindow.trackEvent('SubscriptionPurchased', {
            sessionId: msg.data?.sessionId || sessionId,
            plan: msg.data?.plan || plan,
            amount: sessionData?.amountTotal || null
          });
        }
      } catch (e) {
        console.log('Analytics tracking not available');
      }
    }

    // Handle request for session data
    if (msg.type === 'getSubscriptionData') {
      htmlComponent.postMessage({
        type: 'subscriptionData',
        data: {
          sessionId: sessionId,
          plan: plan || sessionData?.metadata?.plan_type || 'pro',
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
    if (msg.type === 'redirectToSearch') {
      wixLocation.to('/recruiter-driver-search');
    }

    // Handle redirect to any URL
    if (msg.type === 'redirectToUrl' && msg.data?.url) {
      wixLocation.to(msg.data.url);
    }
  });

  // Send initial data to HTML component after a short delay
  setTimeout(() => {
    htmlComponent.postMessage({
      type: 'subscriptionData',
      data: {
        sessionId: sessionId,
        plan: plan || sessionData?.metadata?.plan_type || 'pro',
        amountPaid: sessionData?.amountTotal || null,
        customerEmail: sessionData?.customerEmail || null,
        companyName: sessionData?.metadata?.company_name || null
      }
    });
  }, 500);
}
