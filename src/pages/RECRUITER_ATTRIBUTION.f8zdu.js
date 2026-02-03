/**
 * RECRUITER_ATTRIBUTION Page Code
 * Handles PostMessage bridge for source attribution analytics
 */

import { getAttributionBreakdown, recordTouchpoint, recordHireAttribution, convertSessionToDriver } from 'backend/recruiterAnalyticsService.jsw';
import wixUsers from 'wix-users';

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  htmlComponentId: 'html1',
  debugMessages: true
};

// ============================================================================
// MESSAGE REGISTRY
// ============================================================================
const MESSAGE_REGISTRY = {
  inbound: [
    'attributionReady',
    'getAttributionData',
    'recordTouchpoint',
    'recordHireAttribution'
  ],
  outbound: [
    'attributionData',
    'attributionError',
    'touchpointResult',
    'hireAttributionResult'
  ]
};

// ============================================================================
// GLOBAL STATE
// ============================================================================
let carrierDot = null;

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================
$w.onReady(async function () {
  console.log('RECRUITER_ATTRIBUTION page ready');

  const htmlComponent = getHtmlComponent();
  if (!htmlComponent) {
    console.error('HTML component not found');
    return;
  }

  htmlComponent.onMessage((event) => {
    handleMessage(event.data);
  });
});

// ============================================================================
// HTML COMPONENT FINDER
// ============================================================================
function getHtmlComponent() {
  const possibleIds = [CONFIG.htmlComponentId, 'html1', 'html2', 'html3', 'htmlEmbed1'];
  for (const id of possibleIds) {
    try {
      const el = $w(`#${id}`);
      if (el && typeof el.onMessage === 'function') {
        CONFIG.htmlComponentId = id;
        return el;
      }
    } catch (e) { }
  }
  return null;
}

function getComponent() {
  return $w(`#${CONFIG.htmlComponentId}`);
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================
async function handleMessage(msg) {
  if (!msg || !msg.type) return;

  const action = msg.type;
  if (CONFIG.debugMessages) {
    console.log('📥 [Velo] Received:', action, msg.data || '(no data)');
  }

  switch (action) {
    case 'attributionReady':
      console.log('Attribution HTML ready');
      if (carrierDot) {
        sendToHtml('carrierContext', { carrierDot });
      }
      break;

    case 'getAttributionData':
      await handleGetAttributionData(msg.data);
      break;

    case 'recordTouchpoint':
      await handleRecordTouchpoint(msg.data);
      break;

    case 'recordHireAttribution':
      await handleRecordHireAttribution(msg.data);
      break;

    default:
      console.log('Unknown message type:', action);
  }
}

// ============================================================================
// HANDLERS
// ============================================================================
async function handleGetAttributionData(data) {
  try {
    const dot = data?.carrierDot || carrierDot;
    if (!dot) {
      sendToHtml('attributionError', { error: 'No carrier context' });
      return;
    }

    carrierDot = dot;

    const dateRange = data?.dateRange || { start: null, end: null };
    const metric = data?.metric || 'applications';

    const result = await getAttributionBreakdown(dot, dateRange, metric);

    if (!result.success) {
      sendToHtml('attributionError', { error: result.error || 'Failed to fetch attribution data' });
      return;
    }

    sendToHtml('attributionData', {
      success: true,
      breakdown: result.breakdown || [],
      totals: result.totals || {},
      metric: metric
    });

  } catch (error) {
    console.error('Error fetching attribution data:', error);
    sendToHtml('attributionError', { error: error.message });
  }
}

async function handleRecordTouchpoint(data) {
  try {
    const { driverId, utmParams, pageUrl, sessionId } = data;

    if (!utmParams && !sessionId) {
      sendToHtml('touchpointResult', { success: false, error: 'Missing UTM params or session' });
      return;
    }

    const result = await recordTouchpoint(driverId, utmParams, pageUrl, sessionId);
    sendToHtml('touchpointResult', result);

  } catch (error) {
    console.error('Error recording touchpoint:', error);
    sendToHtml('touchpointResult', { success: false, error: error.message });
  }
}

async function handleRecordHireAttribution(data) {
  try {
    const { driverId, attributionModel } = data;
    const dot = data?.carrierDot || carrierDot;

    if (!driverId || !dot) {
      sendToHtml('hireAttributionResult', { success: false, error: 'Missing required fields' });
      return;
    }

    const result = await recordHireAttribution(driverId, dot, attributionModel || 'first_touch');
    sendToHtml('hireAttributionResult', result);

  } catch (error) {
    console.error('Error recording hire attribution:', error);
    sendToHtml('hireAttributionResult', { success: false, error: error.message });
  }
}

// ============================================================================
// UTILITIES
// ============================================================================
function sendToHtml(type, data) {
  if (CONFIG.debugMessages) {
    console.log('📤 [Velo] Sending:', type, data ? Object.keys(data) : '(no data)');
  }

  try {
    const component = getComponent();
    if (component && typeof component.postMessage === 'function') {
      component.postMessage({ type, data, timestamp: Date.now() });
    }
  } catch (error) {
    console.error('Error sending to HTML:', error);
  }
}
