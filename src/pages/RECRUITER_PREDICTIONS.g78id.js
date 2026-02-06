/**
 * RECRUITER_PREDICTIONS Page Code
 * Handles PostMessage bridge for predictive hiring analytics
 */

import { generateHiringForecast, getHiringForecast, getTurnoverRiskAnalysis } from 'backend/recruiterAnalyticsService.jsw';
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
    'predictionsReady',
    'getPredictionsData',
    'generateForecast',
    'getTurnoverRisk'
  ],
  outbound: [
    'predictionsData',
    'predictionsError',
    'forecastResult',
    'turnoverRiskData'
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
  console.log('RECRUITER_PREDICTIONS page ready');

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
    case 'predictionsReady':
      console.log('Predictions HTML ready');
      if (carrierDot) {
        sendToHtml('carrierContext', { carrierDot });
      }
      break;

    case 'getPredictionsData':
      await handleGetPredictionsData(msg.data);
      break;

    case 'generateForecast':
      await handleGenerateForecast(msg.data);
      break;

    case 'getTurnoverRisk':
      await handleGetTurnoverRisk(msg.data);
      break;

    default:
      console.log('Unknown message type:', action);
  }
}

// ============================================================================
// HANDLERS
// ============================================================================
async function handleGetPredictionsData(data) {
  try {
    const dot = data?.carrierDot || carrierDot;
    if (!dot) {
      sendToHtml('predictionsError', { error: 'No carrier context' });
      return;
    }

    carrierDot = dot;

    // Fetch forecast and turnover risk in parallel
    const [forecastResult, riskResult] = await Promise.all([
      getHiringForecast(dot),
      getTurnoverRiskAnalysis(dot)
    ]);

    sendToHtml('predictionsData', {
      success: true,
      forecast: forecastResult.success ? forecastResult.forecast : null,
      turnoverRisk: riskResult.success ? riskResult.analysis : null
    });

  } catch (error) {
    console.error('Error fetching predictions data:', error);
    sendToHtml('predictionsError', { error: error.message });
  }
}

async function handleGenerateForecast(data) {
  try {
    const dot = data?.carrierDot || carrierDot;
    if (!dot) {
      sendToHtml('forecastResult', { success: false, error: 'No carrier context' });
      return;
    }

    carrierDot = dot;

    const monthsAhead = data?.monthsAhead || 6;
    const result = await generateHiringForecast(dot, monthsAhead);
    sendToHtml('forecastResult', result);

  } catch (error) {
    console.error('Error generating forecast:', error);
    sendToHtml('forecastResult', { success: false, error: error.message });
  }
}

async function handleGetTurnoverRisk(data) {
  try {
    const dot = data?.carrierDot || carrierDot;
    if (!dot) {
      sendToHtml('turnoverRiskData', { success: false, error: 'No carrier context' });
      return;
    }

    const result = await getTurnoverRiskAnalysis(dot);
    sendToHtml('turnoverRiskData', result);

  } catch (error) {
    console.error('Error fetching turnover risk:', error);
    sendToHtml('turnoverRiskData', { success: false, error: error.message });
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
