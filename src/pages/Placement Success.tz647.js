/**
 * Placement Success Page Code
 * Handles post-payment flow for VelocityMatch Full Service placement deposits
 *
 * Setup Instructions:
 * 1. This page should exist at URL: /placement-success
 * 2. Add an HTML iframe component and embed Placement_Success.html
 * 3. This code handles messages from the HTML component
 *
 * Element IDs:
 * - #html1 (or similar) - HTML component containing Placement_Success.html
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixUsers from 'wix-users';
import { getCheckoutSession } from 'backend/stripeService';

$w.onReady(async function () {
  console.log('Placement Success page initialized');

  // Get URL parameters
  const sessionId = wixLocation.query.session_id || null;
  const driverCount = wixLocation.query.drivers || null;

  console.log(`Placement success - Session: ${sessionId}, Drivers: ${driverCount}`);

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
  initPlacementSuccessHandler(sessionId, driverCount, sessionData);
});

/**
 * Initialize the placement success HTML component handler
 * Handles messages from Placement_Success.html
 */
function initPlacementSuccessHandler(sessionId, driverCount, sessionData) {
  // Try multiple possible HTML component IDs
  const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlComponent', '#placementHtml'];
  let htmlComponent = null;

  for (const id of possibleIds) {
    try {
      const component = $w(id);
      if (component && typeof component.onMessage === 'function') {
        htmlComponent = component;
        console.log(`Placement success handler attached to ${id}`);
        break;
      }
    } catch (e) {
      // Component doesn't exist, try next
    }
  }

  if (!htmlComponent) {
    console.log('No HTML component found for placement success page');
    return;
  }

  // Listen for messages from the HTML component
  htmlComponent.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || !msg.type) return;

    console.log('Placement success page received message:', msg.type);

    // Handle request for session data
    if (msg.type === 'getPlacementSuccessData') {
      htmlComponent.postMessage({
        type: 'placementSuccessData',
        data: {
          sessionId: sessionId,
          driverCount: driverCount || sessionData?.metadata?.driver_count || '1',
          amountPaid: sessionData?.amountTotal || null,
          customerEmail: sessionData?.customerEmail || null,
          companyName: sessionData?.metadata?.company_name || null
        }
      });

      // Track successful payment
      try {
        if (typeof wixWindow !== 'undefined' && wixWindow.trackEvent) {
          wixWindow.trackEvent('PlacementDepositPaid', {
            sessionId: sessionId,
            driverCount: driverCount,
            amount: sessionData?.amountTotal
          });
        }
      } catch (e) {
        console.log('Analytics tracking not available');
      }
    }

    // Handle account creation request
    if (msg.type === 'createAccount') {
      try {
        const { email, password } = msg.data;

        // Register the user
        const result = await wixUsers.register(email, password, {
          contactInfo: {
            emails: [email]
          }
        });

        console.log('Account created:', result.status);

        // Notify HTML component of success
        htmlComponent.postMessage({
          type: 'accountCreated',
          data: { success: true }
        });

        // Log the user in
        await wixUsers.login(email, password);

      } catch (error) {
        console.error('Account creation failed:', error);
        htmlComponent.postMessage({
          type: 'accountError',
          data: { error: error.message || 'Failed to create account' }
        });
      }
    }

    // Handle redirect to dashboard
    if (msg.type === 'redirectToDashboard') {
      wixLocation.to('/carrier-dashboard');
    }

    // Handle redirect to login
    if (msg.type === 'redirectToLogin') {
      wixLocation.to('/login');
    }

    // Handle skip account creation
    if (msg.type === 'skipAccountCreation') {
      // Track the skip
      try {
        if (typeof wixWindow !== 'undefined' && wixWindow.trackEvent) {
          wixWindow.trackEvent('PlacementAccountSkipped', {
            sessionId: sessionId
          });
        }
      } catch (e) {
        // Non-critical
      }

      // Redirect to home or pricing page
      wixLocation.to('/');
    }
  });

  // Send initial data to HTML component after a short delay
  setTimeout(() => {
    htmlComponent.postMessage({
      type: 'placementSuccessData',
      data: {
        sessionId: sessionId,
        driverCount: driverCount || sessionData?.metadata?.driver_count || '1',
        amountPaid: sessionData?.amountTotal || null,
        customerEmail: sessionData?.customerEmail || null,
        companyName: sessionData?.metadata?.company_name || null
      }
    });
  }, 500);
}
