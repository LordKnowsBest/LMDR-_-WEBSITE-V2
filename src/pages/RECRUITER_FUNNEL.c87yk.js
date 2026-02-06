/**
 * RECRUITER_FUNNEL Page Code
 * Handles PostMessage bridge between HTML embed and backend services
 */

import { getFunnelMetrics, getBottleneckAnalysis, recordStageChange } from 'backend/recruiterAnalyticsService.jsw';
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
    'funnelReady',
    'getFunnelData',
    'recordStageChange'
  ],
  outbound: [
    'funnelData',
    'funnelError',
    'stageChangeResult'
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
  console.log('RECRUITER_FUNNEL page ready');

  const htmlComponent = getHtmlComponent();
  if (!htmlComponent) {
    console.error('HTML component not found');
    return;
  }

  // Get carrier context
  const user = wixUsers.currentUser;
  if (user.loggedIn) {
    // In a real implementation, fetch carrier DOT from user's carrier account
    // For now, we'll wait for it from the HTML or use a default
  }

  htmlComponent.onMessage((event) => {
    handleMessage(event.data);
  });
});

// ============================================================================
// HTML COMPONENT FINDER
// ============================================================================
function getHtmlComponent() {
  const possibleIds = [CONFIG.htmlComponentId, 'html1', 'html2', 'html3', 'html4', 'html5', 'htmlEmbed1'];
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
    case 'funnelReady':
      console.log('Funnel HTML ready');
      // Send initial carrier context if available
      if (carrierDot) {
        sendToHtml('carrierContext', { carrierDot });
      }
      break;

    case 'getFunnelData':
      await handleGetFunnelData(msg.data);
      break;

    case 'recordStageChange':
      await handleRecordStageChange(msg.data);
      break;

    default:
      console.log('Unknown message type:', action);
  }
}

// ============================================================================
// HANDLERS
// ============================================================================
async function handleGetFunnelData(data) {
  try {
    const dot = data?.carrierDot || carrierDot;
    if (!dot) {
      sendToHtml('funnelError', { error: 'No carrier context' });
      return;
    }

    carrierDot = dot;

    const dateRange = data?.dateRange || { start: null, end: null };

    // Fetch funnel metrics and bottleneck analysis in parallel
    const [metricsResult, bottleneckResult] = await Promise.all([
      getFunnelMetrics(dot, dateRange),
      getBottleneckAnalysis(dot, dateRange)
    ]);

    if (!metricsResult.success) {
      sendToHtml('funnelError', { error: metricsResult.error || 'Failed to fetch funnel metrics' });
      return;
    }

    sendToHtml('funnelData', {
      success: true,
      stages: metricsResult.stages || [],
      totals: metricsResult.totals || {},
      bottlenecks: bottleneckResult.success ? bottleneckResult.bottlenecks : []
    });

  } catch (error) {
    console.error('Error fetching funnel data:', error);
    sendToHtml('funnelError', { error: error.message });
  }
}

async function handleRecordStageChange(data) {
  try {
    const { driverId, toStage, dropReason } = data;
    const dot = data?.carrierDot || carrierDot;

    if (!driverId || !toStage || !dot) {
      sendToHtml('stageChangeResult', { success: false, error: 'Missing required fields' });
      return;
    }

    const result = await recordStageChange(driverId, dot, toStage, dropReason);
    sendToHtml('stageChangeResult', result);

  } catch (error) {
    console.error('Error recording stage change:', error);
    sendToHtml('stageChangeResult', { success: false, error: error.message });
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
