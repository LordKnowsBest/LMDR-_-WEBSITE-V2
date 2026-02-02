// ============================================================================
// RECRUITER CONSOLE - Page Code
// Supports Agency Model: Recruiters can manage multiple carriers
// ============================================================================

import {
  getOrCreateRecruiterProfile,
  addCarrier,
  removeCarrier,
  getRecruiterCarriers,
  validateCarrierDOT,
  getPipelineCandidates,
  updateCandidateStatus,
  getPipelineStats,
  getCandidateDetails,
  addRecruiterNotes,
  updateRecruiterProfile
} from 'backend/recruiter_service';

import {
  requestAvailability,
  confirmTimeSlot as confirmInterviewSlot,
  getInterviewState
} from 'backend/interviewScheduler.jsw';

import { sendMessage, getConversation, markAsRead } from 'backend/messaging.jsw';
import { logFeatureInteraction } from 'backend/featureAdoptionService';
import { setupRecruiterGamification } from 'public/js/gamificationPageHandlers';

// Driver Search imports
import { findMatchingDrivers, getDriverProfile } from 'backend/driverMatching.jsw';
import {
  saveToRecruiterPipeline,
  sendMessageToDriver,
  getQuotaStatus
} from 'backend/driverOutreach.jsw';

// Saved Search imports
import {
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  getSavedSearches,
  executeSavedSearch
} from 'backend/savedSearchService';

// Call Outcome imports
import {
  logCallOutcome,
  getCarrierOutcomes,
  getOutcomeAnalytics,
  getDriverOutcomes
} from 'backend/callOutcomeService';

// Intervention imports
import {
  getTemplates as getInterventionTemplates,
  getAllTemplates,
  createTemplate,
  updateTemplate as updateInterventionTemplate,
  deleteTemplate,
  sendIntervention,
  logInterventionOutcome,
  getDriverInterventions
} from 'backend/interventionService';

// Pipeline Automation imports
import {
  getAutomationRules,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  toggleRuleStatus,
  getAutomationLog
} from 'backend/pipelineAutomationService';

import { getRecruiterHealthStatus } from 'backend/recruiterHealthService.jsw';

import wixLocation from 'wix-location';

let wixUsers;
try {
  wixUsers = require('wix-users');
} catch (e) {
  console.log('wix-users not available');
}

// ============================================================================
// STATE
// ============================================================================

let cachedRecruiterProfile = null;
let cachedCarriers = [];
let currentCarrierDOT = null;

// ============================================================================
// MESSAGE VALIDATION SYSTEM
// ============================================================================
const DEBUG_MESSAGES = true; // Set to false in production

// Registry of all valid messages - single source of truth
const MESSAGE_REGISTRY = {
  // Messages FROM HTML that page code handles
  inbound: [
    'recruiterDashboardReady',
    'validateCarrier',
    'addCarrier',
    'removeCarrier',
    'switchCarrier',
    'getCarriers',
    'getPipeline',
    'updateCandidateStatus',
    'getStats',
    'getCandidateDetails',
    'addNotes',
    'sendMessage',
    'getConversation',
    'getNewMessages',    // Smart polling request
    'getUnreadCount',    // Unread badge request
    'markAsRead',
    'requestAvailability',
    'confirmTimeSlot',
    'ping', // Health check
    // Driver Search messages
    'driverSearchReady',
    'searchDrivers',
    'viewDriverProfile',
    'saveDriver',
    'contactDriver',
    'getQuotaStatus',
    'getWeightPreferences',
    'saveWeightPreferences',
    'navigateTo',
    'logFeatureInteraction', // Feature adoption tracking
    // Saved Search messages
    'saveSearch',
    'loadSavedSearches',
    'runSavedSearch',
    'deleteSavedSearch',
    'updateSavedSearch',
    // Call Outcome messages
    'logCallOutcome',
    'getCallAnalytics',
    'getRecentCalls',
    'getDriverCallHistory',
    // Intervention messages
    'getInterventionTemplates',
    'sendIntervention',
    'saveTemplate',
    'deleteTemplate',
    'logInterventionOutcome',
    'getDriverInterventions',
    // Pipeline Automation messages
    'getAutomationRules',
    'createAutomationRule',
    'updateAutomationRule',
    'deleteAutomationRule',
    'toggleRuleStatus',
    'getAutomationLog',
    'getSystemHealth' // New System Health Check
  ],
  // Messages TO HTML that page code sends
  outbound: [
    'recruiterReady',
    'carrierValidated',
    'carrierAdded',
    'carrierRemoved',
    'carrierSwitched',
    'carriersLoaded',
    'pipelineLoaded',
    'statusUpdated',
    'statsLoaded',
    'candidateDetails',
    'notesAdded',
    'conversationData',
    'messageSent',
    'newMessagesData',   // Smart polling response
    'unreadCountData',   // Unread badge data
    'error',
    'pong', // Health check response
    // Driver Search responses
    'driverSearchInit',
    'searchDriversResult',
    'viewDriverProfileResult',
    'saveDriverResult',
    'contactDriverResult',
    'getQuotaStatusResult',
    'getWeightPreferencesResult',
    'saveWeightPreferencesResult',
    'recruiterProfile',
    // Saved Search responses
    'saveSearchResult',
    'savedSearchesLoaded',
    'savedSearchExecuted',
    'savedSearchDeleted',
    'savedSearchUpdated',
    // Call Outcome responses
    'callOutcomeLogged',
    'callAnalyticsLoaded',
    'recentCallsLoaded',
    'driverCallHistoryLoaded',
    // Intervention responses
    'interventionTemplatesLoaded',
    'interventionSent',
    'templateSaved',
    'templateDeleted',
    'interventionOutcomeLogged',
    'driverInterventionsLoaded',
    // Pipeline Automation responses
    'automationRulesLoaded',
    'automationRuleCreated',
    'automationRuleUpdated',
    'automationRuleDeleted',
    'automationRuleToggled',
    'automationLogLoaded',
    'systemHealthUpdate' // New System Health Response
  ]
};

function validateInboundMessage(action) {
  if (!MESSAGE_REGISTRY.inbound.includes(action)) {
    console.warn(`⚠️ UNREGISTERED INBOUND MESSAGE: "${action}" - Add to MESSAGE_REGISTRY.inbound`);
    return false;
  }
  return true;
}

function logMessageFlow(direction, type, data) {
  if (!DEBUG_MESSAGES) return;
  const arrow = direction === 'in' ? '📥' : '📤';
  const label = direction === 'in' ? 'HTML→Velo' : 'Velo→HTML';
  console.log(`${arrow} [${label}] ${type}`, data ? Object.keys(data) : '(no data)');
}

function sendToHtml(component, type, data) {
  // Validate outbound message is registered
  if (!MESSAGE_REGISTRY.outbound.includes(type)) {
    console.warn(`⚠️ UNREGISTERED OUTBOUND MESSAGE: "${type}" - Add to MESSAGE_REGISTRY.outbound`);
  }
  logMessageFlow('out', type, data);
  component.postMessage({ type, data, timestamp: Date.now() });
}

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

$w.onReady(async function () {
  console.log('Recruiter Console Ready');

  const htmlComponent = $w('#htmlRecruiterDashboard');

  if (!htmlComponent) {
    console.error('HTML component #htmlRecruiterDashboard not found');
    return;
  }

  // Set up message listener
  htmlComponent.onMessage(async (event) => {
    await handleHtmlMessage(event.data, htmlComponent);
  });

  // Set up gamification widget if present
  // Add an HTML component with ID #gamificationHtml pointing to public/recruiter/RECRUITER_GAMIFICATION.html
  try {
    const gamificationWidget = $w('#gamificationHtml');
    if (gamificationWidget && typeof gamificationWidget.onMessage === 'function') {
      setupRecruiterGamification(gamificationWidget);
      console.log('🎮 Recruiter gamification widget initialized');
    }
  } catch (e) {
    // Gamification widget not present on page, that's OK
  }
});

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

async function handleHtmlMessage(msg, component) {
  if (!msg || !msg.type) return;

  const action = msg.action || msg.type;

  // Validate and log inbound message
  validateInboundMessage(action);
  logMessageFlow('in', action, msg.data);

  try {
    switch (action) {
      // Health check - respond immediately
      case 'ping':
        sendToHtml(component, 'pong', {
          timestamp: Date.now(),
          registeredInbound: MESSAGE_REGISTRY.inbound.length,
          registeredOutbound: MESSAGE_REGISTRY.outbound.length
        });
        break;

      case 'recruiterDashboardReady':
        await handleDashboardReady(component);
        break;

      case 'validateCarrier':
        await handleValidateCarrier(msg.data, component);
        break;

      case 'addCarrier':
        await handleAddCarrier(msg.data, component);
        break;

      case 'removeCarrier':
        await handleRemoveCarrier(msg.data, component);
        break;

      case 'switchCarrier':
        await handleSwitchCarrier(msg.data, component);
        break;

      case 'getCarriers':
        await handleGetCarriers(component);
        break;

      case 'getPipeline':
        await handleGetPipeline(msg.data, component);
        break;

      case 'updateCandidateStatus':
        await handleUpdateStatus(msg.data, component);
        break;

      case 'getStats':
        await handleGetStats(component);
        break;

      case 'getCandidateDetails':
        await handleGetDetails(msg.data, component);
        break;

      case 'addNotes':
        await handleAddNotes(msg.data, component);
        break;

      case 'sendMessage':
        await handleSendMessage(msg.data, component);
        break;

      case 'getConversation':
        await handleGetConversation(msg.data, component);
        break;

      case 'markAsRead':
        await handleMarkAsRead(msg.data, component);
        break;

      case 'getNewMessages':
        await handleGetNewMessages(msg.data, component);
        break;

      case 'getUnreadCount':
        await handleGetUnreadCount(component);
        break;

      case 'requestAvailability':
        await handleRequestAvailability(msg.data, component);
        break;

      case 'confirmTimeSlot':
        await handleConfirmTimeSlot(msg.data, component);
        break;

      // ========== Driver Search Handlers ==========
      case 'driverSearchReady':
        await handleDriverSearchReady(component);
        break;

      case 'searchDrivers':
        await handleSearchDrivers(msg.data, component);
        break;

      case 'viewDriverProfile':
        await handleViewDriverProfile(msg.data, component);
        break;

      case 'saveDriver':
        await handleSaveDriver(msg.data, component);
        break;

      case 'contactDriver':
        await handleContactDriver(msg.data, component);
        break;

      case 'getQuotaStatus':
        await handleGetQuotaStatus(component);
        break;

      case 'getWeightPreferences':
        await handleGetWeightPreferences(component);
        break;

      case 'saveWeightPreferences':
        await handleSaveWeightPreferences(msg.data, component);
        break;

      case 'navigateTo':
        handleNavigateTo(msg.data);
        break;

      case 'logFeatureInteraction':
        // Non-blocking feature tracking
        logFeatureInteraction(msg.data.featureId, msg.data.userId, msg.data.action, msg.data)
          .catch(err => console.warn('Feature tracking failed:', err.message));
        break;

      // ========== Saved Search Handlers ==========
      case 'saveSearch':
        await handleSaveSearch(msg.data, component);
        break;
      case 'loadSavedSearches':
        await handleLoadSavedSearches(component);
        break;
      case 'runSavedSearch':
        await handleRunSavedSearch(msg.data, component);
        break;
      case 'deleteSavedSearch':
        await handleDeleteSavedSearch(msg.data, component);
        break;
      case 'updateSavedSearch':
        await handleUpdateSavedSearch(msg.data, component);
        break;

      // ========== Call Outcome Handlers ==========
      case 'logCallOutcome':
        await handleLogCallOutcome(msg.data, component);
        break;
      case 'getCallAnalytics':
        await handleGetCallAnalytics(msg.data, component);
        break;
      case 'getRecentCalls':
        await handleGetRecentCalls(msg.data, component);
        break;
      case 'getDriverCallHistory':
        await handleGetDriverCallHistory(msg.data, component);
        break;

      // ========== Intervention Handlers ==========
      case 'getInterventionTemplates':
        await handleGetInterventionTemplates(msg.data, component);
        break;
      case 'sendIntervention':
        await handleSendIntervention(msg.data, component);
        break;
      case 'saveTemplate':
        await handleSaveTemplate(msg.data, component);
        break;
      case 'deleteTemplate':
        await handleDeleteTemplate(msg.data, component);
        break;
      case 'logInterventionOutcome':
        await handleLogInterventionOutcome(msg.data, component);
        break;
      case 'getDriverInterventions':
        await handleGetDriverInterventions(msg.data, component);
        break;

      // ========== Pipeline Automation Handlers ==========
      case 'getAutomationRules':
        await handleGetAutomationRules(component);
        break;
      case 'createAutomationRule':
        await handleCreateAutomationRule(msg.data, component);
        break;
      case 'updateAutomationRule':
        await handleUpdateAutomationRule(msg.data, component);
        break;
      case 'deleteAutomationRule':
        await handleDeleteAutomationRule(msg.data, component);
        break;
      case 'toggleRuleStatus':
        await handleToggleRuleStatus(msg.data, component);
        break;
      case 'getAutomationLog':
        await handleGetAutomationLog(component);
        break;

      case 'getSystemHealth':
        await handleGetSystemHealth(msg.data, component);
        break;

      default:
        console.warn('⚠️ Unhandled action:', action);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendToHtml(component, 'error', { message: error.message });
  }
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

async function handleDashboardReady(component) {
  console.log('Dashboard ready, checking auth...');

  // Check if user is logged in
  if (!wixUsers || !wixUsers.currentUser.loggedIn) {
    console.log('User not logged in, redirecting...');
    wixLocation.to('/account/my-account');
    return;
  }

  // Get recruiter profile and carriers
  const result = await getOrCreateRecruiterProfile();
  console.log('Profile result:', result);

  if (!result.success) {
    console.error('Failed to get profile:', result.error);
    sendToHtml(component, 'error', { message: result.error });
    return;
  }

  // Cache profile data
  cachedRecruiterProfile = result.profile;
  cachedCarriers = result.carriers || [];

  // Set current carrier to first one (if any)
  if (cachedCarriers.length > 0) {
    currentCarrierDOT = result.defaultCarrierDOT || cachedCarriers[0].carrier_dot;
  }

  console.log(`Recruiter authenticated with ${cachedCarriers.length} carriers`);

  // Send ready message to HTML
  sendToHtml(component, 'recruiterReady', {
    recruiterProfile: result.profile,
    carriers: cachedCarriers,
    defaultCarrier: result.defaultCarrier,
    currentCarrierDOT: currentCarrierDOT,
    needsSetup: result.needsSetup,
    memberId: wixUsers?.currentUser?.id || null
  });
}

async function handleValidateCarrier(data, component) {
  console.log('Validating carrier:', data.carrierDOT);

  const result = await validateCarrierDOT(data.carrierDOT);
  sendToHtml(component, 'carrierValidated', result);
}

async function handleAddCarrier(data, component) {
  console.log('Adding carrier:', data.carrierDOT);

  const result = await addCarrier(data.carrierDOT);

  if (result.success) {
    // Add to cached carriers
    cachedCarriers.unshift({
      carrier_dot: data.carrierDOT,
      carrier_name: result.carrierInfo?.legal_name || result.carrierInfo?.title || 'Unknown',
      added_date: new Date()
    });

    // Set as current if first carrier
    if (!currentCarrierDOT) {
      currentCarrierDOT = data.carrierDOT;
    }
  }

  sendToHtml(component, 'carrierAdded', {
    ...result,
    carriers: cachedCarriers,
    currentCarrierDOT: currentCarrierDOT
  });
}

async function handleRemoveCarrier(data, component) {
  console.log('Removing carrier:', data.carrierDOT);

  const result = await removeCarrier(data.carrierDOT);

  if (result.success) {
    // Remove from cached carriers
    cachedCarriers = cachedCarriers.filter(c => c.carrier_dot !== data.carrierDOT);

    // If current carrier was removed, switch to first available
    if (currentCarrierDOT === data.carrierDOT) {
      currentCarrierDOT = cachedCarriers.length > 0 ? cachedCarriers[0].carrier_dot : null;
    }
  }

  sendToHtml(component, 'carrierRemoved', {
    ...result,
    carriers: cachedCarriers,
    currentCarrierDOT: currentCarrierDOT
  });
}

async function handleSwitchCarrier(data, component) {
  console.log('Switching to carrier:', data.carrierDOT);

  currentCarrierDOT = data.carrierDOT;

  // Get carrier info
  const carrier = cachedCarriers.find(c => c.carrier_dot === data.carrierDOT);

  sendToHtml(component, 'carrierSwitched', {
    success: true,
    currentCarrierDOT: currentCarrierDOT,
    carrier: carrier
  });

  // Auto-load pipeline for new carrier
  await handleGetPipeline({}, component);
}

async function handleGetCarriers(component) {
  console.log('Getting carriers list');

  const result = await getRecruiterCarriers();

  if (result.success) {
    cachedCarriers = result.carriers;
  }

  sendToHtml(component, 'carriersLoaded', {
    ...result,
    currentCarrierDOT: currentCarrierDOT
  });
}

async function handleGetPipeline(data, component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'pipelineLoaded', {
      success: true,
      candidates: [],
      groupedByStatus: {},
      totalCount: 0,
      noCarrier: true
    });
    return;
  }

  console.log('Loading pipeline for carrier:', currentCarrierDOT);

  const result = await getPipelineCandidates(currentCarrierDOT, data?.filters || {});
  sendToHtml(component, 'pipelineLoaded', result);
}

async function handleUpdateStatus(data, component) {
  console.log('Updating status:', data.interestId, '->', data.newStatus);

  const result = await updateCandidateStatus(data.interestId, data.newStatus, data.notes || '');
  sendToHtml(component, 'statusUpdated', result);
}

async function handleGetStats(component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'statsLoaded', { success: true, stats: {} });
    return;
  }

  console.log('Loading stats for carrier:', currentCarrierDOT);

  const result = await getPipelineStats(currentCarrierDOT);
  sendToHtml(component, 'statsLoaded', result);
}

async function handleGetDetails(data, component) {
  console.log('Loading candidate details:', data.interestId);

  const result = await getCandidateDetails(data.interestId);
  sendToHtml(component, 'candidateDetails', result);
}

async function handleAddNotes(data, component) {
  console.log('Adding notes to:', data.interestId);

  const result = await addRecruiterNotes(data.interestId, data.notes);
  sendToHtml(component, 'notesAdded', result);
}

async function handleSendMessage(data, component) {
  try {
    const result = await sendMessage(data.applicationId, data.content, data.receiverId, 'recruiter');
    if (result.success) {
      sendToHtml(component, 'messageSent', { success: true, message: result.message });
    } else {
      sendToHtml(component, 'error', { message: result.error });
    }
  } catch (error) {
    sendToHtml(component, 'error', { message: error.message });
  }
}

async function handleGetConversation(data, component) {
  try {
    const result = await getConversation(data.applicationId);
    if (result.success) {
      sendToHtml(component, 'conversationData', { applicationId: data.applicationId, messages: result.messages });
    } else {
      sendToHtml(component, 'error', { message: result.error });
    }
  } catch (error) {
    sendToHtml(component, 'error', { message: error.message });
  }
}

async function handleMarkAsRead(data, component) {
  try {
    await markAsRead(data.applicationId);
  } catch (error) {
    console.error('Error marking as read:', error);
  }
}

async function handleRequestAvailability(data, component) {
  const result = await requestAvailability(data.applicationId);
  if (!result.success) {
    sendToHtml(component, 'error', { message: result.error });
  } else {
    // Refresh conversation to show system message
    await handleGetConversation(data, component);
  }
}

async function handleConfirmTimeSlot(data, component) {
  const result = await confirmInterviewSlot(data.applicationId, data.slotIndex);
  if (!result.success) {
    sendToHtml(component, 'error', { message: result.error });
  } else {
    // Refresh conversation to show system message
    await handleGetConversation(data, component);
  }
}

async function handleGetNewMessages(data, component) {
  if (!data || !data.applicationId) {
    return;
  }

  try {
    const { getNewMessages } = await import('backend/messagingRealtime');
    const result = await getNewMessages(data.applicationId, data.sinceTimestamp);

    sendToHtml(component, 'newMessagesData', {
      messages: result.messages || [],
      hasNew: result.hasNew || false,
      latestTimestamp: result.latestTimestamp,
      applicationId: data.applicationId
    });
  } catch (error) {
    console.warn('Could not fetch new messages:', error.message);
    sendToHtml(component, 'newMessagesData', {
      messages: [],
      hasNew: false,
      applicationId: data.applicationId
    });
  }
}

async function handleGetUnreadCount(component) {
  try {
    const { getUnreadCountForUser } = await import('backend/messagingRealtime');
    const result = await getUnreadCountForUser();

    sendToHtml(component, 'unreadCountData', {
      count: result.count || 0,
      byApplication: result.byApplication || {}
    });
  } catch (error) {
    console.warn('Could not fetch unread count:', error.message);
    sendToHtml(component, 'unreadCountData', { count: 0, byApplication: {} });
  }
}

// ============================================================================
// DRIVER SEARCH HANDLERS
// ============================================================================

async function handleDriverSearchReady(component) {
  console.log('Driver Search ready, initializing...');

  // Check authentication
  if (!wixUsers || !wixUsers.currentUser.loggedIn) {
    sendToHtml(component, 'error', { message: 'Not authenticated' });
    return;
  }

  // If profile not loaded yet, load it
  if (!cachedRecruiterProfile) {
    const result = await getOrCreateRecruiterProfile();
    if (result.success) {
      cachedRecruiterProfile = result.profile;
      cachedCarriers = result.carriers || [];
      if (cachedCarriers.length > 0 && !currentCarrierDOT) {
        currentCarrierDOT = result.defaultCarrierDOT || cachedCarriers[0].carrier_dot;
      }
    }
  }

  // Get initial quota status
  let quotaStatus = { tier: 'free', used: 0, limit: 5, remaining: 5 };
  if (currentCarrierDOT) {
    try {
      quotaStatus = await getQuotaStatus(currentCarrierDOT);
    } catch (e) {
      console.warn('Could not get quota status:', e.message);
    }
  }

  // Send initialization data
  sendToHtml(component, 'driverSearchInit', {
    success: true,
    carriers: cachedCarriers,
    currentCarrierDOT: currentCarrierDOT,
    quotaStatus: quotaStatus,
    recruiterProfile: cachedRecruiterProfile
  });

  // Also send profile for sidebar
  if (cachedRecruiterProfile) {
    sendToHtml(component, 'recruiterProfile', {
      name: cachedRecruiterProfile.display_name || cachedRecruiterProfile.first_name || 'Recruiter',
      email: cachedRecruiterProfile.email || ''
    });
  }
}

async function handleSearchDrivers(data, component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'searchDriversResult', {
      success: false,
      error: 'No carrier selected. Please add a carrier first.'
    });
    return;
  }

  console.log('Searching drivers for carrier:', currentCarrierDOT);

  try {
    const result = await findMatchingDrivers(currentCarrierDOT, data, { includeQuotaStatus: true });

    // Get quota status
    const quotaStatus = await getQuotaStatus(currentCarrierDOT);

    sendToHtml(component, 'searchDriversResult', {
      success: result.success,
      drivers: result.success ? result.drivers : [],
      total: result.success ? result.total : 0,
      quotaStatus: quotaStatus,
      error: result.error
    });
  } catch (error) {
    console.error('Search drivers error:', error);
    sendToHtml(component, 'searchDriversResult', {
      success: false,
      error: error.message
    });
  }
}

async function handleViewDriverProfile(data, component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'viewDriverProfileResult', {
      success: false,
      error: 'No carrier selected'
    });
    return;
  }

  if (!data || !data.driverId) {
    sendToHtml(component, 'viewDriverProfileResult', {
      success: false,
      error: 'Driver ID required'
    });
    return;
  }

  console.log('Viewing driver profile:', data.driverId);

  try {
    const result = await getDriverProfile(currentCarrierDOT, data.driverId, { recordView: true });

    // Get updated quota status
    const quotaStatus = await getQuotaStatus(currentCarrierDOT);

    if (result.success) {
      sendToHtml(component, 'viewDriverProfileResult', {
        success: true,
        driver: result.driver,
        quotaStatus: quotaStatus
      });
    } else if (result.error === 'QUOTA_EXCEEDED') {
      sendToHtml(component, 'viewDriverProfileResult', {
        success: false,
        quotaExceeded: true,
        quotaStatus: quotaStatus,
        error: 'Monthly profile view quota exceeded'
      });
    } else {
      sendToHtml(component, 'viewDriverProfileResult', {
        success: false,
        error: result.error,
        quotaStatus: quotaStatus
      });
    }
  } catch (error) {
    console.error('View profile error:', error);
    sendToHtml(component, 'viewDriverProfileResult', {
      success: false,
      error: error.message
    });
  }
}

async function handleSaveDriver(data, component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'saveDriverResult', {
      success: false,
      error: 'No carrier selected'
    });
    return;
  }

  if (!data || !data.driverId) {
    sendToHtml(component, 'saveDriverResult', {
      success: false,
      error: 'Driver ID required'
    });
    return;
  }

  console.log('Saving driver to pipeline:', data.driverId);

  try {
    const result = await saveToRecruiterPipeline(
      currentCarrierDOT,
      data.driverId,
      data.matchScore || 0,
      data.notes || ''
    );

    sendToHtml(component, 'saveDriverResult', {
      success: result.success,
      interestId: result.interestId,
      alreadyExists: result.alreadyExists,
      error: result.error
    });
  } catch (error) {
    console.error('Save driver error:', error);
    sendToHtml(component, 'saveDriverResult', {
      success: false,
      error: error.message
    });
  }
}

async function handleContactDriver(data, component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'contactDriverResult', {
      success: false,
      error: 'No carrier selected'
    });
    return;
  }

  if (!data || !data.driverId || !data.message) {
    sendToHtml(component, 'contactDriverResult', {
      success: false,
      error: 'Driver ID and message required'
    });
    return;
  }

  console.log('Sending message to driver:', data.driverId);

  try {
    const result = await sendMessageToDriver(currentCarrierDOT, data.driverId, data.message);

    sendToHtml(component, 'contactDriverResult', {
      success: result.success,
      messageId: result.messageId,
      error: result.error
    });
  } catch (error) {
    console.error('Contact driver error:', error);
    sendToHtml(component, 'contactDriverResult', {
      success: false,
      error: error.message
    });
  }
}

async function handleGetQuotaStatus(component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'getQuotaStatusResult', {
      success: true,
      tier: 'free',
      used: 0,
      limit: 5,
      remaining: 5,
      hasQuota: true
    });
    return;
  }

  try {
    const result = await getQuotaStatus(currentCarrierDOT);
    sendToHtml(component, 'getQuotaStatusResult', result);
  } catch (error) {
    console.error('Get quota status error:', error);
    sendToHtml(component, 'getQuotaStatusResult', {
      success: false,
      error: error.message,
      tier: 'free',
      used: 0,
      limit: 5,
      remaining: 5
    });
  }
}

async function handleGetWeightPreferences(component) {
  // Get weight preferences from recruiter profile
  const preferences = cachedRecruiterProfile?.weight_preferences || {
    weight_qualifications: 25,
    weight_experience: 20,
    weight_location: 20,
    weight_availability: 15,
    weight_salary_fit: 10,
    weight_engagement: 10
  };

  sendToHtml(component, 'getWeightPreferencesResult', {
    success: true,
    preferences: preferences
  });
}

async function handleSaveWeightPreferences(data, component) {
  if (!data) {
    sendToHtml(component, 'saveWeightPreferencesResult', {
      success: false,
      error: 'Preferences data required'
    });
    return;
  }

  try {
    // Update recruiter profile with new weight preferences
    const result = await updateRecruiterProfile({
      weight_preferences: {
        weight_qualifications: data.weight_qualifications || 25,
        weight_experience: data.weight_experience || 20,
        weight_location: data.weight_location || 20,
        weight_availability: data.weight_availability || 15,
        weight_salary_fit: data.weight_salary_fit || 10,
        weight_engagement: data.weight_engagement || 10
      }
    });

    if (result.success && result.profile) {
      cachedRecruiterProfile = result.profile;
    }

    sendToHtml(component, 'saveWeightPreferencesResult', {
      success: result.success,
      error: result.error
    });
  } catch (error) {
    console.error('Save weight preferences error:', error);
    sendToHtml(component, 'saveWeightPreferencesResult', {
      success: false,
      error: error.message
    });
  }
}

function handleNavigateTo(data) {
  if (!data || !data.page) return;

  console.log('Navigating to:', data.page);

  // Map page names to Wix routes
  const pageRoutes = {
    'dashboard': '/recruiter-console',
    'driver-search': '/recruiter-driver-search',
    'pipeline': '/recruiter-console',
    'retention': '/carrier-retention',
    'settings': '/account/my-account',
    'compliance-calendar': '/carrier-compliance-calendar',
    'document-vault': '/carrier-document-vault',
    'dq-tracker': '/carrier-dq-tracker',
    'csa-monitor': '/carrier-csa-monitor',
    'incident-reporting': '/carrier-incident-reporting',
    'carrier-welcome': '/carrier-welcome'
  };

  const route = pageRoutes[data.page] || data.page;
  wixLocation.to(route);
}

// ============================================================================
// SAVED SEARCH HANDLERS
// ============================================================================

async function handleSaveSearch(data, component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'saveSearchResult', { success: false, error: 'No carrier selected' });
    return;
  }
  try {
    const result = await createSavedSearch(currentCarrierDOT, data);
    sendToHtml(component, 'saveSearchResult', result);
  } catch (error) {
    sendToHtml(component, 'saveSearchResult', { success: false, error: error.message });
  }
}

async function handleLoadSavedSearches(component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'savedSearchesLoaded', { success: true, searches: [] });
    return;
  }
  try {
    const result = await getSavedSearches(currentCarrierDOT);
    sendToHtml(component, 'savedSearchesLoaded', result);
  } catch (error) {
    sendToHtml(component, 'savedSearchesLoaded', { success: false, error: error.message });
  }
}

async function handleRunSavedSearch(data, component) {
  try {
    const result = await executeSavedSearch(data.searchId);
    sendToHtml(component, 'savedSearchExecuted', result);
  } catch (error) {
    sendToHtml(component, 'savedSearchExecuted', { success: false, error: error.message });
  }
}

async function handleDeleteSavedSearch(data, component) {
  try {
    const result = await deleteSavedSearch(data.searchId);
    sendToHtml(component, 'savedSearchDeleted', { ...result, searchId: data.searchId });
  } catch (error) {
    sendToHtml(component, 'savedSearchDeleted', { success: false, error: error.message });
  }
}

async function handleUpdateSavedSearch(data, component) {
  try {
    const result = await updateSavedSearch(data.searchId, data);
    sendToHtml(component, 'savedSearchUpdated', result);
  } catch (error) {
    sendToHtml(component, 'savedSearchUpdated', { success: false, error: error.message });
  }
}

// ============================================================================
// CALL OUTCOME HANDLERS
// ============================================================================

async function handleLogCallOutcome(data, component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'callOutcomeLogged', { success: false, error: 'No carrier selected' });
    return;
  }
  try {
    const result = await logCallOutcome(currentCarrierDOT, data);
    sendToHtml(component, 'callOutcomeLogged', result);
  } catch (error) {
    sendToHtml(component, 'callOutcomeLogged', { success: false, error: error.message });
  }
}

async function handleGetCallAnalytics(data, component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'callAnalyticsLoaded', { success: true, analytics: {} });
    return;
  }
  try {
    const result = await getOutcomeAnalytics(currentCarrierDOT, data || {});
    sendToHtml(component, 'callAnalyticsLoaded', result);
  } catch (error) {
    sendToHtml(component, 'callAnalyticsLoaded', { success: false, error: error.message });
  }
}

async function handleGetRecentCalls(data, component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'recentCallsLoaded', { success: true, outcomes: [] });
    return;
  }
  try {
    const result = await getCarrierOutcomes(currentCarrierDOT, data || {});
    sendToHtml(component, 'recentCallsLoaded', result);
  } catch (error) {
    sendToHtml(component, 'recentCallsLoaded', { success: false, error: error.message });
  }
}

async function handleGetDriverCallHistory(data, component) {
  try {
    const result = await getDriverOutcomes(data.driverId);
    sendToHtml(component, 'driverCallHistoryLoaded', result);
  } catch (error) {
    sendToHtml(component, 'driverCallHistoryLoaded', { success: false, error: error.message });
  }
}

// ============================================================================
// INTERVENTION HANDLERS
// ============================================================================

async function handleGetInterventionTemplates(data, component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'interventionTemplatesLoaded', { success: true, templatesByRiskType: {} });
    return;
  }
  try {
    const result = data && data.riskType
      ? await getInterventionTemplates(currentCarrierDOT, data.riskType)
      : await getAllTemplates(currentCarrierDOT);
    sendToHtml(component, 'interventionTemplatesLoaded', result);
  } catch (error) {
    sendToHtml(component, 'interventionTemplatesLoaded', { success: false, error: error.message });
  }
}

async function handleSendIntervention(data, component) {
  try {
    const result = await sendIntervention(data.templateId, data.driverId, data.overrides || {});
    sendToHtml(component, 'interventionSent', result);
  } catch (error) {
    sendToHtml(component, 'interventionSent', { success: false, error: error.message });
  }
}

async function handleSaveTemplate(data, component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'templateSaved', { success: false, error: 'No carrier selected' });
    return;
  }
  try {
    let result;
    if (data.templateId) {
      result = await updateInterventionTemplate(data.templateId, data);
    } else {
      result = await createTemplate(currentCarrierDOT, data);
    }
    sendToHtml(component, 'templateSaved', result);
  } catch (error) {
    sendToHtml(component, 'templateSaved', { success: false, error: error.message });
  }
}

async function handleDeleteTemplate(data, component) {
  try {
    const result = await deleteTemplate(data.templateId);
    sendToHtml(component, 'templateDeleted', { ...result, templateId: data.templateId });
  } catch (error) {
    sendToHtml(component, 'templateDeleted', { success: false, error: error.message });
  }
}

async function handleLogInterventionOutcome(data, component) {
  try {
    const result = await logInterventionOutcome(data.interventionId, data.outcome);
    sendToHtml(component, 'interventionOutcomeLogged', result);
  } catch (error) {
    sendToHtml(component, 'interventionOutcomeLogged', { success: false, error: error.message });
  }
}

async function handleGetDriverInterventions(data, component) {
  try {
    const result = await getDriverInterventions(data.driverId);
    sendToHtml(component, 'driverInterventionsLoaded', result);
  } catch (error) {
    sendToHtml(component, 'driverInterventionsLoaded', { success: false, error: error.message });
  }
}

// ============================================================================
// PIPELINE AUTOMATION HANDLERS
// ============================================================================

async function handleGetAutomationRules(component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'automationRulesLoaded', { success: true, rules: [] });
    return;
  }
  try {
    const result = await getAutomationRules(currentCarrierDOT);
    sendToHtml(component, 'automationRulesLoaded', result);
  } catch (error) {
    sendToHtml(component, 'automationRulesLoaded', { success: false, error: error.message });
  }
}

async function handleCreateAutomationRule(data, component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'automationRuleCreated', { success: false, error: 'No carrier selected' });
    return;
  }
  try {
    const result = await createAutomationRule(currentCarrierDOT, data);
    sendToHtml(component, 'automationRuleCreated', result);
  } catch (error) {
    sendToHtml(component, 'automationRuleCreated', { success: false, error: error.message });
  }
}

async function handleUpdateAutomationRule(data, component) {
  try {
    const result = await updateAutomationRule(data.ruleId, data);
    sendToHtml(component, 'automationRuleUpdated', result);
  } catch (error) {
    sendToHtml(component, 'automationRuleUpdated', { success: false, error: error.message });
  }
}

async function handleDeleteAutomationRule(data, component) {
  try {
    const result = await deleteAutomationRule(data.ruleId);
    sendToHtml(component, 'automationRuleDeleted', { ...result, ruleId: data.ruleId });
  } catch (error) {
    sendToHtml(component, 'automationRuleDeleted', { success: false, error: error.message });
  }
}

async function handleToggleRuleStatus(data, component) {
  try {
    const result = await toggleRuleStatus(data.ruleId, data.isActive);
    sendToHtml(component, 'automationRuleToggled', { ...result, ruleId: data.ruleId });
  } catch (error) {
    sendToHtml(component, 'automationRuleToggled', { success: false, error: error.message });
  }
}

async function handleGetAutomationLog(component) {
  if (!currentCarrierDOT) return;
  const result = await getAutomationLog(currentCarrierDOT);
  sendToHtml(component, 'automationLogLoaded', result);
}

// ============================================================================
// SYSTEM HEALTH HANDLERS
// ============================================================================

async function handleGetSystemHealth(data, component) {
  // Use currentCarrierDOT as context if not provided
  const carrierDot = data?.carrierDot || currentCarrierDOT;

  try {
    const result = await getRecruiterHealthStatus(carrierDot);
    sendToHtml(component, 'systemHealthUpdate', result);
  } catch (error) {
    console.warn('Health check failed:', error);
    sendToHtml(component, 'systemHealthUpdate', {
      status: 'unknown',
      error: error.message
    });
  }
}
