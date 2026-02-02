// ============================================================================
// B2B CONSOLE - Page Code
//
// Bridges all B2B HTML iframe panels to backend services via PostMessage.
// Each HTML component on the page gets its own message listener that routes
// through the unified b2bBridgeService.
//
// HTML Component IDs (set these in the Wix Editor):
//   #b2bDashboard        → B2B_DASHBOARD.html
//   #b2bAccountDetail    → B2B_ACCOUNT_DETAIL.html
//   #b2bPipeline         → B2B_PIPELINE.html
//   #b2bOutreach         → B2B_OUTREACH.html
//   #b2bCampaigns        → B2B_CAMPAIGNS.html
//   #b2bLeadCapture      → B2B_LEAD_CAPTURE.html
//   #b2bAnalytics        → B2B_ANALYTICS.html
//   #b2bResearchPanel    → B2B_RESEARCH_PANEL.html
//
// @see Conductor/tracks/b2b_business_development_suite_20260128/spec.md
// ============================================================================

import { handleB2BAction } from 'backend/b2bBridgeService';

// ============================================================================
// CONFIG
// ============================================================================

const DEBUG = true;

// All possible B2B HTML component IDs on this page.
// Not all need to be present — the page may only have a subset.
const B2B_COMPONENTS = [
  { id: '#b2bDashboard', label: 'Dashboard' },
  { id: '#b2bAccountDetail', label: 'Account Detail' },
  { id: '#b2bPipeline', label: 'Pipeline' },
  { id: '#b2bOutreach', label: 'Outreach' },
  { id: '#b2bCampaigns', label: 'Campaigns' },
  { id: '#b2bLeadCapture', label: 'Lead Capture' },
  { id: '#b2bAnalytics', label: 'Analytics' },
  { id: '#b2bResearchPanel', label: 'Research Panel' }
];

// Actions that are navigation commands handled by page code (not backend)
const NAVIGATION_ACTIONS = ['navigate', 'viewAccount'];

// ============================================================================
// MESSAGE VALIDATION
// ============================================================================

const MESSAGE_REGISTRY = {
  inbound: [
    // Dashboard
    'getDashboardKPIs', 'getTopProspects', 'getAlerts',
    'getTopOpportunities', 'getNextActions', 'quickAction', 'viewAccount',
    // Account
    'getAccount', 'createAccount', 'updateAccount', 'listAccounts',
    'getContacts', 'createContact', 'updateContact',
    // Signals
    'getSignal', 'generateSignal', 'generateBatchSignals', 'getSignalSpikes',
    // Pipeline
    'getPipeline', 'getForecast', 'getOpportunity', 'getOpportunitiesByAccount',
    'createOpportunity', 'moveStage', 'getPipelineKPIs',
    'getStageConversions', 'getRisks', 'getStageDefinitions',
    'getPlaybookSuggestions', 'getValueProps',
    // Activities
    'getTimeline', 'logActivity', 'getActivityVelocity',
    // Sequences
    'getSequences', 'getSequence', 'saveSequence', 'addStep', 'getThrottleStatus',
    // Outreach records
    'recordEmail', 'recordSms', 'recordCall', 'createCallCampaign',
    // Campaigns
    'getOutreachMetrics', 'getChannelPerformance', 'getRepPerformance',
    // Lead capture
    'captureLead',
    // Analytics
    'getSourcePerformance', 'getCPA', 'getCompetitorIntel',
    'addCompetitorIntel', 'saveSnapshot',
    // Research
    'generateBrief', 'getBrief',
    // Quick actions
    'accountAction',
    // Navigation
    'navigate'
  ],
  outbound: [
    'init',
    'kpisLoaded', 'topProspectsLoaded', 'alertsLoaded',
    'topOpportunitiesLoaded', 'nextActionsLoaded',
    'accountLoaded', 'accountCreated', 'accountUpdated', 'accountsLoaded',
    'contactsLoaded', 'contactCreated', 'contactUpdated',
    'signalLoaded', 'signalGenerated', 'batchSignalsGenerated', 'signalSpikesLoaded',
    'pipelineLoaded', 'forecastLoaded', 'opportunityLoaded',
    'opportunityCreated', 'stageMoved',
    'conversionsLoaded', 'risksLoaded', 'stageDefinitionsLoaded',
    'playbooksLoaded', 'valuePropsLoaded',
    'timelineLoaded', 'activityLogged', 'velocityLoaded',
    'sequencesLoaded', 'sequenceLoaded', 'sequenceSaved',
    'stepAdded', 'throttleLoaded',
    'emailRecorded', 'smsRecorded', 'callRecorded', 'callCampaignCreated',
    'metricsLoaded', 'channelsLoaded', 'repsLoaded',
    'leadCaptured',
    'sourcesLoaded', 'cpaLoaded', 'intelLoaded', 'intelAdded', 'snapshotSaved',
    'briefLoaded', 'briefGenerating',
    'actionSuccess', 'actionError'
  ]
};

// ============================================================================
// LOGGING
// ============================================================================

function log(direction, label, action, keys) {
  if (!DEBUG) return;
  const arrow = direction === 'in' ? '\u{1F4E5}' : '\u{1F4E4}';
  const flow = direction === 'in' ? 'HTML\u2192Velo' : 'Velo\u2192HTML';
  console.log(`${arrow} [B2B ${label}] [${flow}] ${action}`, keys || '');
}

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

$w.onReady(function () {
  console.log('[B2B Console] Page ready');

  let connectedCount = 0;

  B2B_COMPONENTS.forEach(({ id, label }) => {
    try {
      const component = $w(id);
      if (component && typeof component.onMessage === 'function') {
        wireComponent(component, label);
        connectedCount++;
        console.log(`[B2B] Connected: ${label} (${id})`);
      }
    } catch (e) {
      // Component not on this page — skip silently
    }
  });

  console.log(`[B2B Console] ${connectedCount} component(s) connected`);
});

// ============================================================================
// COMPONENT WIRING
// ============================================================================

function wireComponent(component, label) {
  // Listen for messages from the HTML iframe
  component.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || !msg.action) return;

    const action = msg.action;
    log('in', label, action, msg.data ? Object.keys(msg.data) : null);

    // Handle navigation locally
    if (NAVIGATION_ACTIONS.includes(action)) {
      handleNavigation(action, msg);
      return;
    }

    // Route through the backend bridge
    try {
      const response = await handleB2BAction(action, msg);
      sendToComponent(component, label, response.action, response.payload || response.message);
    } catch (err) {
      console.error(`[B2B ${label}] Error:`, err);
      sendToComponent(component, label, 'actionError', err.message || 'Internal error');
    }
  });

  // Send init to let the HTML panel know the bridge is ready
  sendToComponent(component, label, 'init', { ready: true, timestamp: Date.now() });
}

// ============================================================================
// SEND TO HTML COMPONENT
// ============================================================================

function sendToComponent(component, label, action, payloadOrMessage) {
  const msg = { action };

  if (typeof payloadOrMessage === 'string') {
    msg.message = payloadOrMessage;
  } else {
    msg.payload = payloadOrMessage;
  }

  log('out', label, action, msg.payload ? Object.keys(msg.payload) : null);
  component.postMessage(msg);
}

// ============================================================================
// NAVIGATION HANDLER
// ============================================================================

function handleNavigation(action, msg) {
  const baseUrl = 'https://www.lastmiledr.app';

  switch (action) {
    case 'viewAccount':
    case 'navigate': {
      const target = msg.target || msg.page || '';
      const accountId = msg.accountId || msg.data?.accountId || '';

      if (target === 'accountDetail' && accountId) {
        // Navigate to account detail — adjust URL to your Wix page route
        try {
          const wixLocation = require('wix-location');
          wixLocation.to(`${baseUrl}/b2b-account?id=${accountId}`);
        } catch (e) {
          console.warn('[B2B] Navigation not available:', e);
        }
      }
      break;
    }
  }
}
