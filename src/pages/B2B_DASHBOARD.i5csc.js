// ============================================================================
// B2B DASHBOARD - Page Code
//
// Wires the B2B Dashboard HTML component (src/public/admin/B2B_DASHBOARD.html)
// to the b2bBridgeService backend. Routes all PostMessage actions from the
// HTML iframe through the unified bridge which handles auth, permission
// checks, and audit logging before calling the correct backend service.
//
// PostMessage contract (HTML -> Velo):
//   { action: 'getDashboardKPIs', days }
//   { action: 'getTopProspects', limit }
//   { action: 'getAlerts' }
//   { action: 'getTopOpportunities', limit }
//   { action: 'getNextActions', limit }
//   { action: 'quickAction', type, carrierDot }
//   { action: 'viewAccount', accountId }
//   { action: 'getAINextActions', ownerId?, limit? }
//   { action: 'snoozeAction', accountId, opportunityId?, snoozeDays? }
//   { action: 'skipAction', accountId, opportunityId?, skipReason? }
//   { action: 'recordActionTaken', accountId, ... }
//   { action: 'recordActionOutcome', actionLogId, outcomeType, outcomeValue? }
//
// PostMessage contract (Velo -> HTML):
//   { action: 'init' }
//   { action: 'kpisLoaded', payload }
//   { action: 'topProspectsLoaded', payload }
//   { action: 'alertsLoaded', payload }
//   { action: 'topOpportunitiesLoaded', payload }
//   { action: 'nextActionsLoaded', payload }
//   { action: 'signalSpikesLoaded', payload }
//   { action: 'aiNextActionsLoaded', payload }
//   { action: 'actionSnoozed', payload }
//   { action: 'actionSkipped', payload }
//   { action: 'actionRecorded', payload }
//   { action: 'outcomeRecorded', payload }
//   { action: 'actionSuccess', message }
//   { action: 'actionError', message }
// ============================================================================

import wixLocation from 'wix-location';
import wixUsers from 'wix-users';
import { handleB2BAction } from 'backend/b2bBridgeService';
import { handleAgentTurn, resumeAfterApproval } from 'backend/agentService';
import { getVoiceConfig } from 'backend/voiceService';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

// Actions that the HTML panel sends and should be routed through the bridge
const BRIDGE_ACTIONS = [
  'getDashboardKPIs',
  'getTopProspects',
  'getAlerts',
  'getTopOpportunities',
  'getNextActions',
  'quickAction',
  'getSignalSpikes',
  // AI Next-Best-Action Engine (Phase 11)
  'getAINextActions',
  'snoozeAction',
  'skipAction',
  'recordActionTaken',
  'recordActionOutcome'
];

$w.onReady(function () {
  const components = getHtmlComponents();

  if (!components.length) {
    console.warn('[B2B Dashboard] No HTML component found on page');
    return;
  }

  for (const component of components) {
    component.onMessage(async (event) => {
      await routeMessage(component, event?.data);
    });

    // Send init signal so the HTML knows Velo is ready
    component.postMessage({ action: 'init' });
  }
});

/**
 * Safely discover HTML components on the page.
 * Uses try-catch to satisfy the selector safety hook requirement.
 */
function getHtmlComponents() {
  const found = [];
  for (const id of HTML_COMPONENT_IDS) {
    try {
      const component = $w(id);
      if (component && typeof component.onMessage === 'function') {
        found.push(component);
      }
    } catch (error) {
      // Element does not exist on this page variant - skip
    }
  }
  return found;
}

/**
 * Route an incoming message from the HTML component to the correct handler.
 *
 * - Navigation actions (viewAccount) are handled locally via wixLocation.
 * - All other recognized actions are routed through handleB2BAction which
 *   performs authentication, authorization, and audit logging.
 */
async function routeMessage(component, message) {
  if (!message || !message.action) return;

  const { action } = message;

  // ---- Navigation: viewAccount -> B2B Account Detail page ----
  if (action === 'viewAccount') {
    const accountId = message.accountId;
    if (accountId) {
      wixLocation.to(`/b2b-account-detail?accountId=${encodeURIComponent(accountId)}`);
    }
    return;
  }

  // ---- Agent & Voice actions ----
  if (action === 'agentMessage') {
    try {
      const text = message.data?.text || message.payload?.text || '';
      const context = message.data?.context || message.payload?.context || {};
      const userId = wixUsers.currentUser.loggedIn ? wixUsers.currentUser.id : 'anonymous-b2b';
      const result = await handleAgentTurn('carrier', userId, text, context);
      if (typeof component.postMessage === 'function') {
        if (result.type === 'approval_required') {
          component.postMessage({ action: 'agentApprovalRequired', payload: result });
        } else {
          component.postMessage({ action: 'agentResponse', payload: result });
        }
      }
    } catch (error) {
      if (typeof component.postMessage === 'function') {
        component.postMessage({ action: 'agentResponse', payload: { error: error.message } });
      }
    }
    return;
  }

  if (action === 'resolveApprovalGate') {
    try {
      const { approvalContext, decision, decidedBy } = message.data || message.payload || {};
      if (typeof component.postMessage === 'function') {
        component.postMessage({ action: 'agentTyping', payload: {} });
      }
      const result = await resumeAfterApproval(approvalContext, decision, decidedBy || 'user');
      if (typeof component.postMessage === 'function') {
        component.postMessage({ action: 'agentResponse', payload: result });
      }
    } catch (error) {
      if (typeof component.postMessage === 'function') {
        component.postMessage({ action: 'agentResponse', payload: { error: error.message } });
      }
    }
    return;
  }

  if (action === 'getVoiceConfig') {
    try {
      const config = await getVoiceConfig();
      if (typeof component.postMessage === 'function') {
        component.postMessage({ action: 'voiceReady', payload: config });
      }
    } catch (error) {
      console.error('[B2B Dashboard] Voice config error:', error);
    }
    return;
  }

  // ---- Bridge-routed actions ----
  if (BRIDGE_ACTIONS.includes(action)) {
    try {
      const response = await handleB2BAction(action, message);
      if (response && typeof component.postMessage === 'function') {
        component.postMessage(response);
      }
    } catch (error) {
      console.error(`[B2B Dashboard] Error handling "${action}":`, error);
      if (typeof component.postMessage === 'function') {
        component.postMessage({
          action: 'actionError',
          message: error.message || 'An unexpected error occurred'
        });
      }
    }
    return;
  }

  // ---- Unknown action ----
  console.warn(`[B2B Dashboard] Unknown action received: ${action}`);
}
