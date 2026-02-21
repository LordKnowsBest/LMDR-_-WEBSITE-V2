/**
 * Subscription Canceled Page Code
 * Handles checkout abandonment recovery flow
 *
 * Setup Instructions:
 * 1. Create a new page in Wix called "Subscription Canceled" (URL: /subscription-canceled)
 * 2. Add an HTML iframe component and embed Subscription_Canceled.html
 * 3. Copy this code to the page code panel in Wix Editor
 *
 * Element IDs:
 * - #html1 (or similar) - HTML component containing Subscription_Canceled.html
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { recordCheckoutAbandonment, markAbandonmentRecovered } from 'backend/scheduler';

$w.onReady(async function () {
  console.log('Subscription Canceled page initialized');

  // Get URL parameters
  const sessionId = wixLocation.query.session_id || null;
  const plan = wixLocation.query.plan || null;

  console.log(`Abandonment page loaded - Session: ${sessionId}, Plan: ${plan}`);

  // Initialize HTML component handler
  initAbandonmentPageHandler(sessionId, plan);
});

/**
 * Initialize the abandonment page HTML component handler
 * Handles messages from Subscription_Canceled.html
 */
function initAbandonmentPageHandler(sessionId, plan) {
  // Try multiple possible HTML component IDs
  const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlComponent', '#abandonmentHtml'];
  let htmlComponent = null;

  for (const id of possibleIds) {
    try {
      const component = $w(id);
      if (component && typeof component.onMessage === 'function') {
        htmlComponent = component;
        console.log(`Abandonment handler attached to ${id}`);
        break;
      }
    } catch (e) {
      // Component doesn't exist, try next
    }
  }

  if (!htmlComponent) {
    console.log('No HTML component found for abandonment page');
    return;
  }

  // Listen for messages from the HTML component
  htmlComponent.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || !msg.type) return;

    console.log('Abandonment page received message:', msg.type);

    // Handle page ready signal - HTML component is loaded
    if (msg.type === 'abandonmentPageReady') {
      console.log('Abandonment page HTML ready:', msg.data);

      // Record the abandonment if we have session data
      // Note: The actual tracking happens via Stripe webhook (checkout.session.expired)
      // This is just for analytics/logging on the client side
      try {
        if (typeof wixWindow !== 'undefined' && wixWindow.trackEvent) {
          wixWindow.trackEvent('CheckoutAbandoned', {
            sessionId: msg.data?.sessionId || sessionId,
            plan: msg.data?.plan || plan,
            page: 'subscription-canceled'
          });
        }
      } catch (e) {
        console.log('Analytics tracking not available');
      }
    }

    // Handle return to checkout action
    if (msg.type === 'returnToCheckout') {
      console.log('User returning to checkout');

      // Track the recovery attempt
      try {
        if (typeof wixWindow !== 'undefined' && wixWindow.trackEvent) {
          wixWindow.trackEvent('AbandonmentRecoveryAttempt', {
            action: 'returnToCheckout',
            sessionId: sessionId,
            plan: plan
          });
        }
      } catch (e) {
        // Non-critical
      }

      // Redirect back to pricing page
      wixLocation.to('/pricing');
    }

    // Handle schedule demo action
    if (msg.type === 'scheduleDemo') {
      console.log('User requesting demo');

      // Track demo request
      try {
        if (typeof wixWindow !== 'undefined' && wixWindow.trackEvent) {
          wixWindow.trackEvent('AbandonmentRecoveryAttempt', {
            action: 'scheduleDemo',
            sessionId: sessionId,
            plan: plan
          });
        }
      } catch (e) {
        // Non-critical
      }

      // Redirect to contact/demo page
      // Update this URL if you have a dedicated demo scheduling page
      wixLocation.to('/contact');
    }

    // Handle compare plans action
    if (msg.type === 'comparePlans') {
      console.log('User comparing plans');

      // Track comparison request
      try {
        if (typeof wixWindow !== 'undefined' && wixWindow.trackEvent) {
          wixWindow.trackEvent('AbandonmentRecoveryAttempt', {
            action: 'comparePlans',
            sessionId: sessionId,
            plan: plan
          });
        }
      } catch (e) {
        // Non-critical
      }

      // Redirect to pricing page
      wixLocation.to('/pricing');
    }

    // Handle abandonment feedback submission
    if (msg.type === 'abandonmentFeedback') {
      try {
        const { reason, sessionId: feedbackSessionId, plan: feedbackPlan, timestamp } = msg.data;

        console.log('Abandonment feedback received:', reason);

        // Track the feedback
        try {
          if (typeof wixWindow !== 'undefined' && wixWindow.trackEvent) {
            wixWindow.trackEvent('AbandonmentFeedback', {
              reason: reason,
              sessionId: feedbackSessionId || sessionId,
              plan: feedbackPlan || plan,
              timestamp: timestamp
            });
          }
        } catch (e) {
          // Non-critical
        }

        // Store feedback in database (optional - uncomment if you want to persist feedback)
        // await saveAbandonmentFeedback(feedbackSessionId || sessionId, reason, feedbackPlan || plan);

        // Send confirmation back to HTML component
        htmlComponent.postMessage({
          type: 'feedbackSubmitted',
          data: { success: true }
        });

        console.log('Feedback submitted successfully');

      } catch (error) {
        console.error('Error submitting feedback:', error);
        htmlComponent.postMessage({
          type: 'feedbackSubmitted',
          data: { success: false, error: 'Failed to submit feedback' }
        });
      }
    }

    // Handle redirect requests from HTML component
    if (msg.type === 'redirectToUrl' && msg.data?.url) {
      wixLocation.to(msg.data.url);
    }
  });

  // Send initial data to HTML component (session info if available)
  setTimeout(() => {
    htmlComponent.postMessage({
      type: 'initAbandonmentPage',
      data: {
        sessionId: sessionId,
        plan: plan,
        baseUrl: wixLocation.baseUrl
      }
    });
  }, 500);
}

/**
 * Optional: Save abandonment feedback to database
 * Uncomment and customize if you want to persist feedback
 */
// async function saveAbandonmentFeedback(sessionId, reason, plan) {
//   try {
//     const wixData = await import('wix-data');
//     await wixData.insert('AbandonmentFeedback', {
//       sessionId: sessionId,
//       reason: reason,
//       plan: plan,
//       submittedAt: new Date()
//     }, { suppressAuth: true });
//   } catch (e) {
//     console.error('Failed to save feedback:', e);
//   }
// }
