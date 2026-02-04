import wixLocation from 'wix-location';
import { getAccount, getContactsByAccount } from 'backend/b2bAccountService';
import { getSignalByCarrier } from 'backend/b2bMatchSignalService';
import { getOpportunitiesByAccount, getDealsAtRisk } from 'backend/b2bPipelineService';
import { getAccountTimeline, logActivity, logCall, logEmail, logSms, logTask } from 'backend/b2bActivityService';
import { generateBrief } from 'backend/b2bResearchAgentService';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
  const accountId = wixLocation.query?.accountId || wixLocation.query?.id || '';

  if (!accountId) {
    console.warn('B2B Account Detail: No accountId in URL query');
    wixLocation.to('/b2b-dashboard');
    return;
  }

  const components = getHtmlComponents();

  if (!components.length) {
    console.warn('B2B Account Detail: No HTML component found');
    return;
  }

  for (const component of components) {
    component.onMessage(async (event) => {
      await routeMessage(component, accountId, event?.data);
    });

    // Send init with accountId so the HTML knows which account to load
    component.postMessage({ action: 'init', accountId });
  }
});

/**
 * Safely discover HTML components from known IDs
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
      // Element may not exist on this page variant
    }
  }
  return found;
}

/**
 * Route messages from the HTML component to backend services
 */
async function routeMessage(component, accountId, message) {
  if (!message?.action) return;

  switch (message.action) {
    case 'getAccount':
      await handleGetAccount(component, message.accountId || accountId);
      break;
    case 'getSignal':
      await handleGetSignal(component, message.accountId || accountId);
      break;
    case 'getOpportunity':
      await handleGetOpportunity(component, message.accountId || accountId);
      break;
    case 'getContacts':
      await handleGetContacts(component, message.accountId || accountId);
      break;
    case 'getTimeline':
      await handleGetTimeline(component, message.accountId || accountId, message.limit);
      break;
    case 'getRisks':
      await handleGetRisks(component, message.accountId || accountId);
      break;
    case 'accountAction':
      await handleAccountAction(component, message.accountId || accountId, message.type);
      break;
    case 'navigate':
      handleNavigation(message.target);
      break;
    default:
      console.warn('B2B Account Detail: Unknown message action', message.action);
  }
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

async function handleGetAccount(component, accountId) {
  try {
    const result = await getAccount(accountId);
    if (result.success && result.account) {
      component.postMessage({ action: 'accountLoaded', payload: result.account });
    } else {
      component.postMessage({ action: 'actionError', message: result.error || 'Account not found' });
    }
  } catch (error) {
    console.error('B2B Account Detail: getAccount error', error);
    component.postMessage({ action: 'actionError', message: 'Failed to load account' });
  }
}

async function handleGetSignal(component, accountId) {
  try {
    // First get the account to find the carrier DOT
    const accountResult = await getAccount(accountId);
    if (!accountResult.success || !accountResult.account?.carrier_dot) {
      component.postMessage({ action: 'signalLoaded', payload: null });
      return;
    }

    const signalResult = await getSignalByCarrier(accountResult.account.carrier_dot);
    if (signalResult.success && signalResult.signal) {
      component.postMessage({ action: 'signalLoaded', payload: signalResult.signal });
    } else {
      component.postMessage({ action: 'signalLoaded', payload: null });
    }
  } catch (error) {
    console.error('B2B Account Detail: getSignal error', error);
    component.postMessage({ action: 'signalLoaded', payload: null });
  }
}

async function handleGetOpportunity(component, accountId) {
  try {
    const result = await getOpportunitiesByAccount(accountId);
    if (result.success && result.opportunities && result.opportunities.length > 0) {
      // Send the most recent/active opportunity (not closed)
      const active = result.opportunities.find(
        o => o.stage !== 'closed_won' && o.stage !== 'closed_lost'
      );
      component.postMessage({
        action: 'opportunityLoaded',
        payload: active || result.opportunities[0]
      });
    } else {
      component.postMessage({ action: 'opportunityLoaded', payload: null });
    }
  } catch (error) {
    console.error('B2B Account Detail: getOpportunity error', error);
    component.postMessage({ action: 'opportunityLoaded', payload: null });
  }
}

async function handleGetContacts(component, accountId) {
  try {
    const result = await getContactsByAccount(accountId);
    if (result.success) {
      component.postMessage({ action: 'contactsLoaded', payload: result.contacts || [] });
    } else {
      component.postMessage({ action: 'contactsLoaded', payload: [] });
    }
  } catch (error) {
    console.error('B2B Account Detail: getContacts error', error);
    component.postMessage({ action: 'contactsLoaded', payload: [] });
  }
}

async function handleGetTimeline(component, accountId, limit) {
  try {
    const result = await getAccountTimeline(accountId, { limit: limit || 30 });
    if (result.success) {
      component.postMessage({ action: 'timelineLoaded', payload: result.activities || [] });
    } else {
      component.postMessage({ action: 'timelineLoaded', payload: [] });
    }
  } catch (error) {
    console.error('B2B Account Detail: getTimeline error', error);
    component.postMessage({ action: 'timelineLoaded', payload: [] });
  }
}

async function handleGetRisks(component, accountId) {
  try {
    const result = await getDealsAtRisk({ accountId });
    if (result.success && result.atRisk) {
      // Flatten risk flags from all at-risk opportunities for this account
      const risks = [];
      for (const opp of result.atRisk) {
        if (opp.account_id === accountId && opp.risk_flags) {
          risks.push(...opp.risk_flags);
        }
      }
      component.postMessage({ action: 'risksLoaded', payload: risks });
    } else {
      // Fallback: get opportunities and compute risks locally
      await handleGetRisksFallback(component, accountId);
    }
  } catch (error) {
    console.error('B2B Account Detail: getRisks error', error);
    component.postMessage({ action: 'risksLoaded', payload: [] });
  }
}

async function handleGetRisksFallback(component, accountId) {
  try {
    const oppResult = await getOpportunitiesByAccount(accountId);
    if (!oppResult.success || !oppResult.opportunities) {
      component.postMessage({ action: 'risksLoaded', payload: [] });
      return;
    }

    const risks = [];
    const now = new Date();
    for (const opp of oppResult.opportunities) {
      if (opp.stage === 'closed_won' || opp.stage === 'closed_lost') continue;

      // Stalled check
      if (opp.updated_at) {
        const daysSince = (now - new Date(opp.updated_at)) / (1000 * 60 * 60 * 24);
        if (daysSince > 10) {
          risks.push({ type: 'stalled', message: `No activity in ${Math.round(daysSince)} days` });
        }
      }
      // Overdue next step
      if (opp.next_step_at && new Date(opp.next_step_at) < now) {
        const daysOverdue = Math.round((now - new Date(opp.next_step_at)) / (1000 * 60 * 60 * 24));
        risks.push({ type: 'overdue', message: `Next step overdue by ${daysOverdue} days` });
      }
      // No next step
      if (!opp.next_step || !opp.next_step.trim()) {
        risks.push({ type: 'no_next_step', message: 'No next step defined' });
      }
    }
    component.postMessage({ action: 'risksLoaded', payload: risks });
  } catch (error) {
    component.postMessage({ action: 'risksLoaded', payload: [] });
  }
}

// ============================================================================
// ACCOUNT ACTIONS
// ============================================================================

async function handleAccountAction(component, accountId, actionType) {
  if (!actionType) {
    component.postMessage({ action: 'actionError', message: 'No action type specified' });
    return;
  }

  try {
    switch (actionType) {
      case 'call':
        await logCall(accountId, '', { outcome: 'completed' });
        component.postMessage({ action: 'actionSuccess', message: 'Call logged' });
        refreshTimeline(component, accountId);
        break;

      case 'email':
        await logEmail(accountId, '', 'Outreach email', 'sent');
        component.postMessage({ action: 'actionSuccess', message: 'Email logged' });
        refreshTimeline(component, accountId);
        break;

      case 'sms':
        await logSms(accountId, '', 'Text message', 'sent');
        component.postMessage({ action: 'actionSuccess', message: 'SMS logged' });
        refreshTimeline(component, accountId);
        break;

      case 'task':
        await logTask(accountId, 'Follow-up task', 'scheduled');
        component.postMessage({ action: 'actionSuccess', message: 'Task created' });
        refreshTimeline(component, accountId);
        break;

      case 'brief':
        await handleGenerateBrief(component, accountId);
        break;

      case 'addContact':
        // Log a note for now; contact creation needs a form in the HTML
        await logActivity({
          account_id: accountId,
          type: 'note',
          subject: 'Contact add requested',
          notes: 'New contact addition initiated from account detail'
        });
        component.postMessage({ action: 'actionSuccess', message: 'Contact request logged' });
        break;

      case 'logActivity':
        await logActivity({
          account_id: accountId,
          type: 'note',
          subject: 'Manual activity log',
          notes: 'Activity logged from account detail'
        });
        component.postMessage({ action: 'actionSuccess', message: 'Activity logged' });
        refreshTimeline(component, accountId);
        break;

      default:
        component.postMessage({ action: 'actionError', message: `Unknown action: ${actionType}` });
    }
  } catch (error) {
    console.error('B2B Account Detail: action error', actionType, error);
    component.postMessage({ action: 'actionError', message: error.message || `Failed to execute ${actionType}` });
  }
}

async function handleGenerateBrief(component, accountId) {
  try {
    const result = await generateBrief(accountId);
    if (result.success) {
      component.postMessage({ action: 'actionSuccess', message: 'Research brief generated' });
      // Refresh timeline since brief generation may log an activity
      refreshTimeline(component, accountId);
    } else {
      component.postMessage({ action: 'actionError', message: result.error || 'Brief generation failed' });
    }
  } catch (error) {
    console.error('B2B Account Detail: generateBrief error', error);
    component.postMessage({ action: 'actionError', message: 'Failed to generate brief' });
  }
}

// ============================================================================
// NAVIGATION
// ============================================================================

function handleNavigation(target) {
  if (!target) return;

  const routes = {
    dashboard: '/b2b-dashboard',
    pipeline: '/b2b-pipeline',
    analytics: '/b2b-analytics'
  };

  const path = routes[target] || `/${target}`;
  wixLocation.to(path);
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Refresh the timeline section after an action
 */
function refreshTimeline(component, accountId) {
  handleGetTimeline(component, accountId, 30).catch(err => {
    console.warn('B2B Account Detail: timeline refresh failed', err.message);
  });
}
