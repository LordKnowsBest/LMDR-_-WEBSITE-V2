// ============================================================================
// B2B OUTREACH PAGE - Sequence builder and outreach workspace
//
// Connects to B2B_OUTREACH.html iframe via PostMessage bridge.
// Routes actions through b2bBridgeService for sequence management,
// throttle checking, and AI content generation.
// ============================================================================

import { handleB2BAction } from 'backend/b2bBridgeService';

// HTML component IDs to try
const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#htmlEmbed1', '#b2bOutreach'];

// Message types this page handles
const MESSAGE_REGISTRY = {
  // Inbound from HTML
  inbound: [
    'getSequences', 'getSequence', 'saveSequence', 'addStep',
    'getThrottleStatus',
    'generateEmailContent', 'generateSmsContent', 'generateCallScript',
    'saveDraft', 'approveDraft', 'getPendingDrafts',
    'getSequenceRecommendation', 'getOptimalSendTime'
  ],
  // Outbound to HTML
  outbound: [
    'init', 'sequencesLoaded', 'sequenceLoaded', 'sequenceSaved', 'stepAdded',
    'throttleStatus', 'throttleLoaded',
    'emailContentGenerated', 'smsContentGenerated', 'callScriptGenerated',
    'draftSaved', 'draftApproved', 'draftsLoaded',
    'recommendationLoaded', 'sendTimeLoaded',
    'actionSuccess', 'actionError'
  ]
};

let htmlComponent = null;

$w.onReady(function () {
  // Find the HTML component
  for (const id of HTML_COMPONENT_IDS) {
    try {
      const el = $w(id);
      if (el && typeof el.onMessage === 'function') {
        htmlComponent = el;
        break;
      }
    } catch (e) {
      // Element doesn't exist on this page
    }
  }

  if (!htmlComponent) {
    console.warn('[B2B Outreach] No HTML component found');
    return;
  }

  // Set up message listener
  htmlComponent.onMessage(async (event) => {
    const data = event?.data;
    if (!data || !data.action) return;

    await routeMessage(data);
  });

  // Send init signal
  safeSend({ action: 'init' });
});

/**
 * Route incoming messages to the bridge service
 */
async function routeMessage(message) {
  const { action, ...params } = message;

  if (!MESSAGE_REGISTRY.inbound.includes(action)) {
    console.warn(`[B2B Outreach] Unknown action: ${action}`);
    return;
  }

  try {
    const response = await handleB2BAction(action, params);
    safeSend(response);

    // Special handling for throttle status - rename action for HTML compatibility
    if (action === 'getThrottleStatus' && response.action === 'throttleLoaded') {
      safeSend({ action: 'throttleStatus', payload: response.payload });
    }
  } catch (error) {
    console.error(`[B2B Outreach] Error handling ${action}:`, error);
    safeSend({ action: 'actionError', message: error.message || 'Action failed' });
  }
}

/**
 * Safely send a message to the HTML component
 */
function safeSend(message) {
  try {
    if (htmlComponent && htmlComponent.postMessage) {
      htmlComponent.postMessage(message);
    }
  } catch (e) {
    console.warn('[B2B Outreach] Failed to send message:', e);
  }
}
