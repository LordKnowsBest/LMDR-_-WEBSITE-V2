/**
 * RECRUITER_COST_ANALYSIS Page Code
 * Handles PostMessage bridge for cost-per-hire analytics
 */

import { recordRecruitingSpend, bulkImportSpend, calculateCostPerHire, getChannelROI, getSpendTrend, updateSpendHires } from 'backend/recruiterAnalyticsService.jsw';
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
    'costAnalysisReady',
    'getCostData',
    'recordSpend',
    'bulkImportSpend',
    'updateSpendHires',
    'getChannelROI',
    'getSpendTrend'
  ],
  outbound: [
    'costData',
    'costError',
    'spendResult',
    'bulkImportResult',
    'channelROIData',
    'spendTrendData'
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
  console.log('RECRUITER_COST_ANALYSIS page ready');

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
    case 'costAnalysisReady':
      console.log('Cost Analysis HTML ready');
      if (carrierDot) {
        sendToHtml('carrierContext', { carrierDot });
      }
      break;

    case 'getCostData':
      await handleGetCostData(msg.data);
      break;

    case 'recordSpend':
      await handleRecordSpend(msg.data);
      break;

    case 'bulkImportSpend':
      await handleBulkImportSpend(msg.data);
      break;

    case 'updateSpendHires':
      await handleUpdateSpendHires(msg.data);
      break;

    case 'getChannelROI':
      await handleGetChannelROI(msg.data);
      break;

    case 'getSpendTrend':
      await handleGetSpendTrend(msg.data);
      break;

    default:
      console.log('Unknown message type:', action);
  }
}

// ============================================================================
// HANDLERS
// ============================================================================
async function handleGetCostData(data) {
  try {
    const dot = data?.carrierDot || carrierDot;
    if (!dot) {
      sendToHtml('costError', { error: 'No carrier context' });
      return;
    }

    carrierDot = dot;

    const dateRange = data?.dateRange || { start: null, end: null };

    // Fetch cost metrics and ROI in parallel
    const [costResult, roiResult, trendResult] = await Promise.all([
      calculateCostPerHire(dot, dateRange),
      getChannelROI(dot, dateRange),
      getSpendTrend(dot, 6)
    ]);

    if (!costResult.success) {
      sendToHtml('costError', { error: costResult.error || 'Failed to fetch cost data' });
      return;
    }

    sendToHtml('costData', {
      success: true,
      metrics: costResult.metrics || {},
      channelROI: roiResult.success ? roiResult.channels : [],
      trend: trendResult.success ? trendResult.trend : []
    });

  } catch (error) {
    console.error('Error fetching cost data:', error);
    sendToHtml('costError', { error: error.message });
  }
}

async function handleRecordSpend(data) {
  try {
    const dot = data?.carrierDot || carrierDot;
    if (!dot) {
      sendToHtml('spendResult', { success: false, error: 'No carrier context' });
      return;
    }

    const spendData = {
      carrier_dot: dot,
      ...data
    };

    const result = await recordRecruitingSpend(spendData);
    sendToHtml('spendResult', result);

  } catch (error) {
    console.error('Error recording spend:', error);
    sendToHtml('spendResult', { success: false, error: error.message });
  }
}

async function handleBulkImportSpend(data) {
  try {
    const dot = data?.carrierDot || carrierDot;
    if (!dot || !Array.isArray(data?.records)) {
      sendToHtml('bulkImportResult', { success: false, error: 'Invalid import data' });
      return;
    }

    const result = await bulkImportSpend(dot, data.records);
    sendToHtml('bulkImportResult', result);

  } catch (error) {
    console.error('Error bulk importing spend:', error);
    sendToHtml('bulkImportResult', { success: false, error: error.message });
  }
}

async function handleUpdateSpendHires(data) {
  try {
    const { spendId, hires } = data;

    if (!spendId || hires === undefined) {
      sendToHtml('spendResult', { success: false, error: 'Missing required fields' });
      return;
    }

    const result = await updateSpendHires(spendId, hires);
    sendToHtml('spendResult', result);

  } catch (error) {
    console.error('Error updating spend hires:', error);
    sendToHtml('spendResult', { success: false, error: error.message });
  }
}

async function handleGetChannelROI(data) {
  try {
    const dot = data?.carrierDot || carrierDot;
    if (!dot) {
      sendToHtml('channelROIData', { success: false, error: 'No carrier context' });
      return;
    }

    const dateRange = data?.dateRange || { start: null, end: null };
    const result = await getChannelROI(dot, dateRange);
    sendToHtml('channelROIData', result);

  } catch (error) {
    console.error('Error fetching channel ROI:', error);
    sendToHtml('channelROIData', { success: false, error: error.message });
  }
}

async function handleGetSpendTrend(data) {
  try {
    const dot = data?.carrierDot || carrierDot;
    if (!dot) {
      sendToHtml('spendTrendData', { success: false, error: 'No carrier context' });
      return;
    }

    const months = data?.months || 6;
    const result = await getSpendTrend(dot, months);
    sendToHtml('spendTrendData', result);

  } catch (error) {
    console.error('Error fetching spend trend:', error);
    sendToHtml('spendTrendData', { success: false, error: error.message });
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
