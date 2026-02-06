/**
 * RECRUITER_COMPETITOR_INTEL Page Code
 * Handles PostMessage bridge for competitor intelligence
 */

import { addCompetitorIntel, updateCompetitorIntel, verifyCompetitorIntel, getCompetitorComparison, getPayBenchmarks, triggerCompetitorScrape } from 'backend/recruiterAnalyticsService.jsw';
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
    'competitorIntelReady',
    'getCompetitorData',
    'addIntel',
    'updateIntel',
    'verifyIntel',
    'getPayBenchmarks',
    'triggerScrape'
  ],
  outbound: [
    'competitorData',
    'competitorError',
    'intelResult',
    'payBenchmarksData',
    'scrapeResult'
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
  console.log('RECRUITER_COMPETITOR_INTEL page ready');

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
    case 'competitorIntelReady':
      console.log('Competitor Intel HTML ready');
      if (carrierDot) {
        sendToHtml('carrierContext', { carrierDot });
      }
      break;

    case 'getCompetitorData':
      await handleGetCompetitorData(msg.data);
      break;

    case 'addIntel':
      await handleAddIntel(msg.data);
      break;

    case 'updateIntel':
      await handleUpdateIntel(msg.data);
      break;

    case 'verifyIntel':
      await handleVerifyIntel(msg.data);
      break;

    case 'getPayBenchmarks':
      await handleGetPayBenchmarks(msg.data);
      break;

    case 'triggerScrape':
      await handleTriggerScrape(msg.data);
      break;

    default:
      console.log('Unknown message type:', action);
  }
}

// ============================================================================
// HANDLERS
// ============================================================================
async function handleGetCompetitorData(data) {
  try {
    const dot = data?.carrierDot || carrierDot;
    if (dot) carrierDot = dot;

    const region = data?.region || 'national';
    const jobType = data?.jobType || 'OTR';

    // Fetch competitor comparison and benchmarks in parallel
    const [comparisonResult, benchmarksResult] = await Promise.all([
      getCompetitorComparison(region, jobType),
      getPayBenchmarks(region, jobType)
    ]);

    sendToHtml('competitorData', {
      success: true,
      competitors: comparisonResult.success ? comparisonResult.competitors : [],
      benchmarks: benchmarksResult.success ? benchmarksResult.benchmarks : {},
      region,
      jobType
    });

  } catch (error) {
    console.error('Error fetching competitor data:', error);
    sendToHtml('competitorError', { error: error.message });
  }
}

async function handleAddIntel(data) {
  try {
    if (!data) {
      sendToHtml('intelResult', { success: false, error: 'No data provided' });
      return;
    }

    const result = await addCompetitorIntel(data);
    sendToHtml('intelResult', result);

  } catch (error) {
    console.error('Error adding intel:', error);
    sendToHtml('intelResult', { success: false, error: error.message });
  }
}

async function handleUpdateIntel(data) {
  try {
    const { intelId, updates } = data;

    if (!intelId || !updates) {
      sendToHtml('intelResult', { success: false, error: 'Missing required fields' });
      return;
    }

    const result = await updateCompetitorIntel(intelId, updates);
    sendToHtml('intelResult', result);

  } catch (error) {
    console.error('Error updating intel:', error);
    sendToHtml('intelResult', { success: false, error: error.message });
  }
}

async function handleVerifyIntel(data) {
  try {
    const { intelId, verifierId } = data;

    if (!intelId) {
      sendToHtml('intelResult', { success: false, error: 'Missing intel ID' });
      return;
    }

    const currentUser = wixUsers.currentUser;
    const result = await verifyCompetitorIntel(intelId, verifierId || currentUser.id);
    sendToHtml('intelResult', result);

  } catch (error) {
    console.error('Error verifying intel:', error);
    sendToHtml('intelResult', { success: false, error: error.message });
  }
}

async function handleGetPayBenchmarks(data) {
  try {
    const region = data?.region || 'national';
    const jobType = data?.jobType || 'OTR';

    const result = await getPayBenchmarks(region, jobType);
    sendToHtml('payBenchmarksData', result);

  } catch (error) {
    console.error('Error fetching pay benchmarks:', error);
    sendToHtml('payBenchmarksData', { success: false, error: error.message });
  }
}

async function handleTriggerScrape(data) {
  try {
    const { urls } = data;

    if (!Array.isArray(urls) || urls.length === 0) {
      sendToHtml('scrapeResult', { success: false, error: 'No URLs provided' });
      return;
    }

    const result = await triggerCompetitorScrape(urls);
    sendToHtml('scrapeResult', result);

  } catch (error) {
    console.error('Error triggering scrape:', error);
    sendToHtml('scrapeResult', { success: false, error: error.message });
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
