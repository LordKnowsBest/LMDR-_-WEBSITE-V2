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

import { sendMessage, getConversation, markAsRead, getRecruiterConversations, getUnreadCount } from 'backend/messaging.jsw';
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
import { routeAIRequest } from 'backend/aiRouterService';
import { handleAgentTurn, resumeAfterApproval, executeTool } from 'backend/agentService';
import { getVoiceConfig } from 'backend/voiceService';
import { getCampaigns, createCampaign, startCampaign, getCampaignStatus } from 'backend/voiceCampaignService';

// Recruiter OS — Analytics imports
import {
  getFunnelMetrics,
  getBottleneckAnalysis,
  calculateCostPerHire,
  getCompetitorComparison,
  addCompetitorIntel,
  generateHiringForecast,
  getTurnoverRiskAnalysis,
  getPayBenchmarks,
  recordRecruitingSpend
} from 'backend/recruiterAnalyticsService.jsw';

// Recruiter OS — New View imports
import { getBGCStatus, getDrugTestStatus, getOrientationSlots } from 'backend/recruiterOnboardingService';
import { getFMCSAAlerts } from 'backend/complianceService';
import { requestDocuments } from 'backend/documentCollectionService';
import { createEmailCampaign, sendEmailCampaign } from 'backend/emailCampaignService';
import { initializeProgression } from 'backend/gamificationService';
import { getJobPostings, connectJobBoard } from 'backend/jobBoardService';
import { createSMSCampaign, sendSMSCampaign } from 'backend/smsCampaignService';
import { getSocialPosts, connectSocialAccount, publishSocialPost } from 'backend/socialPostingService';

// Recruiter OS — Onboarding imports
import {
  getActiveWorkflows,
  updateWorkflowStatus
} from 'backend/onboardingWorkflowService.jsw';

// Recruiter OS — Retention imports
import {
  getCarrierRetentionDashboard,
  getInterventionSuggestions
} from 'backend/retentionService.jsw';

// Recruiter OS — Leaderboard imports
import {
  getLeaderboard,
  getLeaderboardSummary,
  getUserLeaderboardPosition
} from 'backend/leaderboardService.jsw';

import { getCarrierPreferences } from 'backend/carrierPreferences.jsw';

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
    'generateAIDraft',
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
    'getSystemHealth', // New System Health Check
    // ── Recruiter OS Messages ──
    'recruiterOSReady',
    'getFunnelData',
    'getCostData',
    'getCompetitorData',
    'getPredictionsData',
    'getWorkflows',
    'updateWorkflowStep',
    'getRetentionData',
    'getAtRiskDrivers',
    'getLeaderboard',
    'getBadges',
    'getSettingsData',
    // ── Agent & Voice Messages ──
    'agentMessage',
    'resolveApprovalGate',
    'getVoiceConfig',
    'getCampaigns',
    'createCampaign',
    'startCampaign',
    'getCampaignStatus',
    'getPaidMediaState',
    'createPaidMediaDraft',
    'updatePaidMediaAdSet',
    'createPaidMediaCreative',
    'launchPaidMediaCampaign',
    'getPaidMediaInsights',
    'createPaidMediaReportJob',
    'getPaidMediaReportStatus',
    'downloadPaidMediaReport',
    'getPaidMediaOptimizationSuggestions',
    'saveIntel',
    'getTimelineEvents',
    // ── New View Messages ──
    'fetchAutomations',
    'toggleAutomation',
    'fetchCompliance',
    'fetchDriverDocs',
    'fetchBgChecks',
    'fetchDrugTests',
    'fetchOrientations',
    'fetchCostAnalysis',
    'fetchEmailCampaigns',
    'sendEmailCampaign',
    'fetchGamification',
    'fetchJobBoards',
    'connectJobBoard',
    'fetchSmsCampaigns',
    'sendSmsCampaign',
    'fetchSocialPosts',
    'connectSocialAccount',
    'publishSocialPost'
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
    'generateAIDraftResult',
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
    'systemHealthUpdate', // New System Health Response
    // ── Recruiter OS Responses ──
    'recruiterOSInit',
    'funnelDataLoaded',
    'costDataLoaded',
    'competitorDataLoaded',
    'predictionsLoaded',
    'workflowsLoaded',
    'workflowUpdated',
    'retentionDataLoaded',
    'atRiskDriversLoaded',
    'leaderboardLoaded',
    'badgesLoaded',
    'settingsDataLoaded',
    // ── Agent & Voice Responses ──
    'agentResponse',
    'agentTyping',
    'agentApprovalRequired',
    'voiceReady',
    'campaignsLoaded',
    'campaignCreated',
    'campaignStarted',
    'campaignStatusLoaded',
    'paidMediaStateLoaded',
    'paidMediaDraftCreated',
    'paidMediaAdSetUpdated',
    'paidMediaCreativeCreated',
    'paidMediaLaunchResult',
    'paidMediaInsightsLoaded',
    'paidMediaReportJobCreated',
    'paidMediaReportStatusLoaded',
    'paidMediaReportDownloaded',
    'paidMediaSuggestionsLoaded',
    // ── New View Responses ──
    'automationsLoaded',
    'automationToggled',
    'complianceLoaded',
    'driverDocsLoaded',
    'bgChecksLoaded',
    'drugTestsLoaded',
    'orientationsLoaded',
    'costAnalysisLoaded',
    'emailCampaignsLoaded',
    'emailCampaignSent',
    'gamificationLoaded',
    'jobBoardsLoaded',
    'jobBoardConnected',
    'smsCampaignsLoaded',
    'smsCampaignSent',
    'socialPostsLoaded',
    'socialAccountConnected',
    'socialPostPublished'
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

  if (!htmlComponent.rendered) {
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
    if (gamificationWidget.rendered && typeof gamificationWidget.onMessage === 'function') {
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
      case 'addCandidateNote':
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

      case 'getConversations':
        await handleGetConversations(component);
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

      case 'getCarrierPreferences':
        await handleGetCarrierPreferences(component);
        break;

      case 'generateAIDraft':
        await handleGenerateAIDraft(msg.data, component);
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

      // ========== Recruiter OS Handlers ==========
      case 'recruiterOSReady':
        await handleRecruiterOSReady(component);
        break;
      case 'getFunnelData':
        await handleGetFunnelData(msg.data, component);
        break;
      case 'getCostData':
        await handleGetCostData(msg.data, component);
        break;
      case 'getCompetitorData':
        await handleGetCompetitorData(msg.data, component);
        break;
      case 'saveIntel':
        await handleSaveIntel(msg.data, component);
        break;
      case 'getTimelineEvents':
        sendToHtml(component, 'timelineEventsLoaded', { events: [] });
        break;
      case 'getPredictionsData':
        await handleGetPredictionsData(msg.data, component);
        break;
      case 'getWorkflows':
        await handleGetWorkflows(msg.data, component);
        break;
      case 'updateWorkflowStep':
        await handleUpdateWorkflowStep(msg.data, component);
        break;
      case 'getRetentionData':
        await handleGetRetentionData(msg.data, component);
        break;
      case 'getAtRiskDrivers':
        await handleGetAtRiskDrivers(msg.data, component);
        break;
      case 'getLeaderboard':
        await handleGetLeaderboardData(msg.data, component);
        break;
      case 'getBadges':
        await handleGetBadges(msg.data, component);
        break;
      case 'getSettingsData':
        await handleGetSettingsData(component);
        break;

      // ── Agent & Voice ──
      case 'agentMessage': {
        const agentText = msg.data?.text || '';
        const agentCtx = msg.data?.context || {};
        const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id || 'recruiter';
        sendToHtml(component, 'agentTyping', {});
        try {
          const agentResult = await handleAgentTurn('recruiter', recruiterId, agentText, {
            ...agentCtx,
            carrierDot: currentCarrierDOT
          });
          if (agentResult.type === 'approval_required') {
            sendToHtml(component, 'agentApprovalRequired', agentResult);
          } else {
            sendToHtml(component, 'agentResponse', agentResult);
          }
        } catch (err) {
          sendToHtml(component, 'agentResponse', { error: err.message });
        }
        break;
      }

      case 'resolveApprovalGate': {
        const { approvalContext, decision, decidedBy } = msg.data || {};
        sendToHtml(component, 'agentTyping', {});
        try {
          const result = await resumeAfterApproval(approvalContext, decision, decidedBy || 'user');
          sendToHtml(component, 'agentResponse', result);
        } catch (err) {
          sendToHtml(component, 'agentResponse', { error: err.message });
        }
        break;
      }
      case 'getVoiceConfig': {
        try {
          const voiceConf = await getVoiceConfig();
          sendToHtml(component, 'voiceReady', voiceConf);
        } catch (err) {
          console.warn('Voice config failed:', err.message);
        }
        break;
      }
      case 'getCampaigns': {
        const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id;
        if (!recruiterId) { sendToHtml(component, 'campaignsLoaded', { campaigns: [] }); break; }
        const campaigns = await getCampaigns(recruiterId);
        sendToHtml(component, 'campaignsLoaded', { campaigns });
        break;
      }
      case 'createCampaign': {
        const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id;
        const result = await createCampaign(recruiterId, msg.data);
        sendToHtml(component, 'campaignCreated', result);
        break;
      }
      case 'startCampaign': {
        const result = await startCampaign(msg.data?.campaignId);
        sendToHtml(component, 'campaignStarted', result);
        break;
      }
      case 'getCampaignStatus': {
        const result = await getCampaignStatus(msg.data?.campaignId);
        sendToHtml(component, 'campaignStatusLoaded', result);
        break;
      }
      case 'getPaidMediaState': {
        const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id || 'recruiter';
        await handleGetPaidMediaState(recruiterId, msg.data, component);
        break;
      }
      case 'createPaidMediaDraft': {
        const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id || 'recruiter';
        await handleCreatePaidMediaDraft(recruiterId, msg.data, component);
        break;
      }
      case 'updatePaidMediaAdSet': {
        const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id || 'recruiter';
        await handleUpdatePaidMediaAdSet(recruiterId, msg.data, component);
        break;
      }
      case 'createPaidMediaCreative': {
        const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id || 'recruiter';
        await handleCreatePaidMediaCreative(recruiterId, msg.data, component);
        break;
      }
      case 'launchPaidMediaCampaign': {
        const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id || 'recruiter';
        await handleLaunchPaidMediaCampaign(recruiterId, msg.data, component);
        break;
      }
      case 'getPaidMediaInsights': {
        const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id || 'recruiter';
        await handleGetPaidMediaInsights(recruiterId, msg.data, component);
        break;
      }
      case 'createPaidMediaReportJob': {
        const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id || 'recruiter';
        await handleCreatePaidMediaReportJob(recruiterId, msg.data, component);
        break;
      }
      case 'getPaidMediaReportStatus': {
        const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id || 'recruiter';
        await handleGetPaidMediaReportStatus(recruiterId, msg.data, component);
        break;
      }
      case 'downloadPaidMediaReport': {
        const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id || 'recruiter';
        await handleDownloadPaidMediaReport(recruiterId, msg.data, component);
        break;
      }
      case 'getPaidMediaOptimizationSuggestions': {
        const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id || 'recruiter';
        await handleGetPaidMediaOptimizationSuggestions(recruiterId, msg.data, component);
        break;
      }

      // ========== Automation Handlers (new views) ==========
      case 'fetchAutomations': {
        try {
          const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id;
          const rules = await getAutomationRules(recruiterId);
          sendToHtml(component, 'automationsLoaded', { rules });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }
      case 'toggleAutomation': {
        try {
          const rule = await toggleRuleStatus(msg.data?.ruleId, msg.data?.enable);
          sendToHtml(component, 'automationToggled', { rule });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }

      // ========== Compliance Handlers ==========
      case 'fetchCompliance': {
        try {
          const alerts = await getFMCSAAlerts(msg.data?.options || {});
          sendToHtml(component, 'complianceLoaded', { alerts });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }

      // ========== Document Collection Handlers ==========
      case 'fetchDriverDocs': {
        try {
          const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id;
          const docs = await requestDocuments(recruiterId, msg.data?.params || {});
          sendToHtml(component, 'driverDocsLoaded', { docs });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }

      // ========== Recruiter Onboarding Handlers ==========
      case 'fetchBgChecks': {
        try {
          const checks = await getBGCStatus(msg.data?.checkId || null);
          sendToHtml(component, 'bgChecksLoaded', { checks });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }
      case 'fetchDrugTests': {
        try {
          const tests = await getDrugTestStatus(msg.data?.testId || null);
          sendToHtml(component, 'drugTestsLoaded', { tests });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }
      case 'fetchOrientations': {
        try {
          const slots = await getOrientationSlots(msg.data?.carrierId || currentCarrierDOT, msg.data?.filters || {});
          sendToHtml(component, 'orientationsLoaded', { slots });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }

      // ========== Cost Analysis Handlers ==========
      case 'fetchCostAnalysis': {
        try {
          const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id;
          const analysis = await recordRecruitingSpend({ recruiterId, ...msg.data?.params });
          sendToHtml(component, 'costAnalysisLoaded', { analysis });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }

      // ========== Email Campaign Handlers ==========
      case 'fetchEmailCampaigns': {
        try {
          const campaigns = await createEmailCampaign(currentCarrierDOT, msg.data?.campaignData || {});
          sendToHtml(component, 'emailCampaignsLoaded', { campaigns });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }
      case 'sendEmailCampaign': {
        try {
          const result = await sendEmailCampaign(msg.data?.campaignId);
          sendToHtml(component, 'emailCampaignSent', { result });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }

      // ========== Gamification Handlers ==========
      case 'fetchGamification': {
        try {
          const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id;
          const progression = await initializeProgression(recruiterId, 'recruiter');
          sendToHtml(component, 'gamificationLoaded', { progression });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }

      // ========== Job Board Handlers ==========
      case 'fetchJobBoards': {
        try {
          const postings = await getJobPostings(currentCarrierDOT, msg.data?.filters || {});
          sendToHtml(component, 'jobBoardsLoaded', { postings });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }
      case 'connectJobBoard': {
        try {
          const result = await connectJobBoard(currentCarrierDOT, msg.data?.board, msg.data?.credentials || {});
          sendToHtml(component, 'jobBoardConnected', { result });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }

      // ========== SMS Campaign Handlers ==========
      case 'fetchSmsCampaigns': {
        try {
          const campaigns = await createSMSCampaign(currentCarrierDOT, msg.data?.campaignData || {});
          sendToHtml(component, 'smsCampaignsLoaded', { campaigns });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }
      case 'sendSmsCampaign': {
        try {
          const result = await sendSMSCampaign(msg.data?.campaignId);
          sendToHtml(component, 'smsCampaignSent', { result });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }

      // ========== Social Posting Handlers ==========
      case 'fetchSocialPosts': {
        try {
          const posts = await getSocialPosts(currentCarrierDOT, msg.data?.filters || {});
          sendToHtml(component, 'socialPostsLoaded', { posts });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }
      case 'connectSocialAccount': {
        try {
          const result = await connectSocialAccount(currentCarrierDOT, msg.data?.platform, msg.data?.authCode);
          sendToHtml(component, 'socialAccountConnected', { result });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }
      case 'publishSocialPost': {
        try {
          const result = await publishSocialPost(msg.data?.postId);
          sendToHtml(component, 'socialPostPublished', { result });
        } catch (err) {
          sendToHtml(component, 'error', { message: err.message });
        }
        break;
      }

      // ========== AI Match Handlers ==========
      case 'getAIMatches': {
        const mockMatches = [
          {
            id: 'mock-aim-1',
            name: 'Marcus Johnson',
            cdlClass: 'A',
            location: 'Dallas, TX',
            experience: 8,
            jobsLast3Years: 1,
            scores: { experience: 85, cdlClass: 92, safety: 88, availability: 90, location: 72, stability: 95 },
            matchPct: 89,
            synopsis: 'Top-tier CDL-A driver with 8 years OTR experience, clean MVR, and long-term stability at his last carrier. Strong hazmat endorsement and excellent safety record.',
            phone: '',
            email: ''
          },
          {
            id: 'mock-aim-2',
            name: 'Derrick Williams',
            cdlClass: 'A',
            location: 'Houston, TX',
            experience: 5,
            jobsLast3Years: 2,
            scores: { experience: 72, cdlClass: 88, safety: 95, availability: 85, location: 68, stability: 78 },
            matchPct: 81,
            synopsis: 'Safety-first driver with zero incidents in 5 years. Holds tanker and doubles/triples endorsements. Currently available for immediate placement.',
            phone: '',
            email: ''
          },
          {
            id: 'mock-aim-3',
            name: 'Sandra Torres',
            cdlClass: 'A',
            location: 'San Antonio, TX',
            experience: 12,
            jobsLast3Years: 1,
            scores: { experience: 95, cdlClass: 90, safety: 82, availability: 75, location: 88, stability: 92 },
            matchPct: 87,
            synopsis: 'Veteran regional driver with 12 years of consistent performance. Strong preference for regional routes and excellent client-facing communication skills.',
            phone: '',
            email: ''
          }
        ];
        sendToHtml(component, 'aiMatchesLoaded', { matches: mockMatches });
        break;
      }

      case 'regenerateAIMatch': {
        const regenerated = {
          id: msg.driverId || ('mock-aim-regen-' + Date.now()),
          name: 'James Patterson',
          cdlClass: 'A',
          location: 'Austin, TX',
          experience: 6,
          jobsLast3Years: 2,
          scores: { experience: 78, cdlClass: 85, safety: 91, availability: 88, location: 80, stability: 82 },
          matchPct: 84,
          synopsis: 'Dependable CDL-A driver with 6 years regional experience. Excellent attendance record and strong references from two long-term carriers.',
          phone: '',
          email: ''
        };
        sendToHtml(component, 'aiMatchRegenerated', regenerated);
        break;
      }

      case 'regenerateAIMatches': {
        // Bulk regen — re-fetch all matches
        sendToHtml(component, 'aiMatchesLoaded', { matches: [] });
        break;
      }

      // ========== Alert Handlers ==========
      case 'getAlerts': {
        const now = Date.now();
        const mockAlerts = [
          {
            id: 'alrt-001',
            category: 'matches',
            title: '3 new top matches in your area',
            preview: 'Marcus J., Derrick W., and Sandra T. match your active search criteria',
            detail: 'Based on your saved search filters, 3 new CDL-A drivers have been identified as strong matches for your open Dallas routes. All have clean MVRs and are actively seeking opportunities.',
            timestamp: new Date(now - 7200000).toISOString(),
            read: false,
            targetId: null,
            actionLabel: 'View Matches'
          },
          {
            id: 'alrt-002',
            category: 'pipeline',
            title: 'Mike R. advanced to Background Check stage',
            preview: 'Application moved from Phone Screen → Background Check',
            detail: 'Michael Roberts has been moved to the Background Check stage in your pipeline. Background check provider integration is ready — initiate from the Pipeline view.',
            timestamp: new Date(now - 14400000).toISOString(),
            read: false,
            targetId: 'rec_mike_r',
            actionLabel: 'View Pipeline'
          },
          {
            id: 'alrt-003',
            category: 'compliance',
            title: 'DOT medical card expiring in 14 days',
            preview: 'Driver David Kim — medical certification renewal needed',
            detail: 'David Kim\'s DOT medical card expires on ' + new Date(now + 1209600000).toLocaleDateString() + '. Action required: schedule renewal appointment or update documentation in the Comply view.',
            timestamp: new Date(now - 86400000).toISOString(),
            read: true,
            targetId: 'rec_david_k',
            actionLabel: 'View Compliance'
          },
          {
            id: 'alrt-004',
            category: 'retention',
            title: 'At-risk driver signal detected',
            preview: 'James T. has not logged in for 12 days — retention flag triggered',
            detail: 'James Thompson hasn\'t accessed the driver portal in 12 days and has not responded to last 2 messages. Historical data indicates this pattern precedes voluntary departure. Recommend proactive outreach within 48 hours.',
            timestamp: new Date(now - 172800000).toISOString(),
            read: false,
            targetId: 'rec_james_t',
            actionLabel: 'View Retention'
          }
        ];
        sendToHtml(component, 'alertsLoaded', { alerts: mockAlerts });
        break;
      }

      case 'markAlertRead': {
        sendToHtml(component, 'alertMarkedRead', { alertId: msg.alertId });
        break;
      }

      case 'markAllAlertsRead': {
        sendToHtml(component, 'allAlertsMarkedRead', {});
        break;
      }

      case 'updateAlertPrefs': {
        // Alert prefs stored client-side in localStorage; this hook for future Airtable persistence
        sendToHtml(component, 'actionSuccess', { message: 'Alert preferences saved' });
        break;
      }

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
  const id = data.interestId || data.candidateId;
  const status = data.newStatus || data.status;
  console.log('Updating status:', id, '->', status);

  const result = await updateCandidateStatus(id, status, data.notes || '');
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
  const id = data.interestId || data.candidateId;
  console.log('Loading candidate details:', id);

  const result = await getCandidateDetails(id);
  sendToHtml(component, 'candidateDetails', result);
}

async function handleAddNotes(data, component) {
  const id = data.interestId || data.candidateId;
  const notes = data.notes || data.note;
  console.log('Adding notes to:', id);

  const result = await addRecruiterNotes(id, notes);
  sendToHtml(component, 'notesAdded', result);
}

async function handleSendMessage(data, component) {
  try {
    const appId = data.applicationId || data.conversationId;
    const content = data.content || data.message;
    let receiverId = data.receiverId;

    // Look up receiver (driver_id) from the interest record if not provided
    if (!receiverId && appId) {
      const details = await getCandidateDetails(appId);
      const record = (details && details.candidate) || details || {};
      receiverId = record.driver_id || record.user_id;
    }

    const result = await sendMessage(appId, content, receiverId, 'recruiter');
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
    const appId = data.applicationId || data.conversationId;
    const result = await getConversation(appId);
    if (result.success) {
      sendToHtml(component, 'conversationData', { applicationId: appId, messages: result.messages });
    } else {
      sendToHtml(component, 'error', { message: result.error });
    }
  } catch (error) {
    sendToHtml(component, 'error', { message: error.message });
  }
}

async function handleMarkAsRead(data, component) {
  try {
    await markAsRead(data.applicationId || data.conversationId);
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
    const result = await getUnreadCount();
    sendToHtml(component, 'unreadCountData', {
      count: result.count || 0,
      byApplication: {}
    });
  } catch (error) {
    console.warn('Could not fetch unread count:', error.message);
    sendToHtml(component, 'unreadCountData', { count: 0, byApplication: {} });
  }
}

async function handleGetConversations(component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'newMessagesData', { conversations: [] });
    return;
  }
  try {
    const result = await getRecruiterConversations(currentCarrierDOT);
    sendToHtml(component, 'newMessagesData', { conversations: result.conversations || [] });
  } catch (error) {
    console.warn('Could not fetch conversations:', error.message);
    sendToHtml(component, 'newMessagesData', { conversations: [] });
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

// Maps HTML filter display labels → endorsement codes stored by parseEndorsements
const ENDORSEMENT_CODE_MAP = {
  'HazMat': 'H', 'Tanker': 'T', 'Doubles/Triples': 'T', 'Passenger': 'P', 'School Bus': 'S'
};

// Normalize raw driverProfiles record for HTML renderers
function normalizeDriverForHtml(d, matchScore, rationale, isMutualMatch) {
  const name = d.display_name ||
    [d.first_name, d.last_name].filter(Boolean).join(' ') ||
    d.full_name || d.name || '';
  const rawEndo = d.endorsements || [];
  const endorsements = Array.isArray(rawEndo)
    ? rawEndo
    : (typeof rawEndo === 'string' && rawEndo ? rawEndo.split(',').map(e => e.trim()) : []);
  return {
    ...d,
    name,
    cdlClass: d.cdl_class || d.cdlClass || d.cdl_type || '',
    endorsements,
    matchScore: matchScore ?? d.matchScore ?? d.match_score ?? 0,
    rationale: rationale ?? d.rationale,
    isMutualMatch: isMutualMatch ?? d.isMutualMatch ?? false
  };
}

async function handleSearchDrivers(data, component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'searchDriversResult', {
      success: false,
      error: 'No carrier selected. Please add a carrier first.'
    });
    return;
  }

  // Normalize HTML filter keys → backend filter keys
  if (data) {
    // cdlClasses → cdl_types
    if (Array.isArray(data.cdlClasses) && data.cdlClasses.length > 0) {
      data.cdl_types = data.cdlClasses;
      delete data.cdlClasses;
    }
    // minExperience → min_experience
    if (data.minExperience != null) {
      data.min_experience = Number(data.minExperience);
      delete data.minExperience;
    }
    // endorsement display labels → stored codes
    if (Array.isArray(data.endorsements) && data.endorsements.length > 0) {
      data.endorsements = data.endorsements.map(e => ENDORSEMENT_CODE_MAP[e] || e);
    }
  }

  console.log('Searching drivers for carrier:', currentCarrierDOT);

  try {
    const result = await findMatchingDrivers(currentCarrierDOT, data, { includeQuotaStatus: true });

    // Get quota status
    const quotaStatus = await getQuotaStatus(currentCarrierDOT);

    // matches is [{ driver, score, rationale, isMutualMatch }] — flatten + normalize for HTML renderer
    const flatDrivers = result.success
      ? (result.matches || []).map(m =>
          normalizeDriverForHtml(m.driver || m, m.score, m.rationale, m.isMutualMatch))
      : [];

    sendToHtml(component, 'searchDriversResult', {
      success: result.success,
      drivers: flatDrivers,
      total: result.success ? (result.pagination?.totalCount || 0) : 0,
      pagination: result.pagination,
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
        driver: normalizeDriverForHtml(result.driver),
        quota: result.quota,
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

async function handleGetCarrierPreferences(component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'carrierPreferencesLoaded', { success: true, preferences: null });
    return;
  }
  try {
    const result = await getCarrierPreferences(currentCarrierDOT);
    sendToHtml(component, 'carrierPreferencesLoaded', result);
  } catch (error) {
    sendToHtml(component, 'carrierPreferencesLoaded', { success: false, error: error.message });
  }
}

// ============================================================================
// AI DRAFT HANDLER
// ============================================================================

async function handleGenerateAIDraft(data, component) {
  try {
    const driver = data.driver || {};
    const mode = data.mode || 'email';
    const isText = mode === 'text';

    const rawEndo = driver.endorsements || [];
    const endorsementsArr = Array.isArray(rawEndo)
      ? rawEndo
      : (typeof rawEndo === 'string' && rawEndo ? rawEndo.split(',').map(e => e.trim()) : []);
    const equipmentArr = Array.isArray(driver.equipment) ? driver.equipment : [];

    const driverSummary = [
      driver.name ? `Name: ${driver.name}` : null,
      driver.cdlClass ? `CDL: Class ${driver.cdlClass}` : null,
      endorsementsArr.length ? `Endorsements: ${endorsementsArr.join(', ')}` : null,
      (driver.years_experience || driver.experienceYears) ? `Experience: ${driver.years_experience || driver.experienceYears} years` : null,
      driver.city ? `Location: ${driver.city}, ${driver.state}` : (driver.location ? `Location: ${driver.location}` : null),
      driver.availability ? `Availability: ${driver.availability}` : null,
      equipmentArr.length ? `Equipment: ${equipmentArr.join(', ')}` : null
    ].filter(Boolean).join('\n');

    const prompt = isText
      ? `Write a short, friendly SMS recruitment text message (under 160 characters) to a truck driver. Be professional but casual. Do not include subject lines or greetings like "Dear". Just a direct, compelling message. Do not use placeholder brackets like [Company Name] — just say "we" or "our team".\n\nDriver info:\n${driverSummary}\n\nWrite ONLY the text message, nothing else.`
      : `Write a brief, professional recruitment email to a truck driver. Keep it under 150 words. Be warm and specific to their qualifications. Do not use placeholder brackets like [Company Name] — just say "we" or "our team". Include a subject line on the first line prefixed with "Subject: ".\n\nDriver info:\n${driverSummary}\n\nWrite ONLY the email (subject line + body), nothing else.`;

    const aiResult = await routeAIRequest('driver_chat', {
      prompt,
      maxTokens: isText ? 100 : 300,
      temperature: 0.8
    });

    sendToHtml(component, 'generateAIDraftResult', {
      success: true,
      draft: aiResult.content?.trim() || '',
      model: aiResult.model,
      tokensUsed: aiResult.tokensUsed
    });
  } catch (error) {
    console.error('AI draft generation error:', error);
    sendToHtml(component, 'generateAIDraftResult', {
      success: false,
      error: error.message || 'AI generation failed'
    });
  }
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

// ============================================================================
// RECRUITER OS HANDLERS
// ============================================================================

async function handleRecruiterOSReady(component) {
  console.log('Recruiter OS ready, initializing...');

  if (!wixUsers || !wixUsers.currentUser.loggedIn) {
    wixLocation.to('/account/my-account');
    return;
  }

  // Reuse existing profile/carrier init
  const result = await getOrCreateRecruiterProfile();
  if (!result.success) {
    sendToHtml(component, 'error', { message: result.error });
    return;
  }

  cachedRecruiterProfile = result.profile;
  cachedCarriers = result.carriers || [];
  if (cachedCarriers.length > 0) {
    currentCarrierDOT = result.defaultCarrierDOT || cachedCarriers[0].carrier_dot;
  }

  sendToHtml(component, 'recruiterOSInit', {
    profile: {
      name: result.profile.name || result.profile.recruiter_name || '',
      tier: result.profile.subscription_tier || 'Free',
      currentCarrierDOT
    },
    carriers: cachedCarriers.map(c => ({
      dot: c.carrier_dot,
      name: c.carrier_name || c.legal_name || ''
    })),
    memberId: wixUsers?.currentUser?.id || null
  });
}

async function handleGetFunnelData(data, component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'funnelDataLoaded', { stages: [] });
    return;
  }
  try {
    const result = await getFunnelMetrics(currentCarrierDOT, data?.dateRange);
    sendToHtml(component, 'funnelDataLoaded', result);
  } catch (error) {
    sendToHtml(component, 'funnelDataLoaded', { error: error.message, stages: [] });
  }
}

async function handleGetCostData(data, component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'costDataLoaded', {});
    return;
  }
  try {
    const result = await calculateCostPerHire(currentCarrierDOT, data?.dateRange);
    sendToHtml(component, 'costDataLoaded', result);
  } catch (error) {
    sendToHtml(component, 'costDataLoaded', { error: error.message });
  }
}

async function handleGetCompetitorData(data, component) {
  try {
    const region = data?.region || 'national';
    const jobType = data?.jobType || 'CDL-A OTR';
    const result = await getCompetitorComparison(region, jobType);
    sendToHtml(component, 'competitorDataLoaded', result);
  } catch (error) {
    sendToHtml(component, 'competitorDataLoaded', { error: error.message });
  }
}

async function handleSaveIntel(data, component) {
  try {
    const result = await addCompetitorIntel({ ...data, carrier_dot: currentCarrierDOT });
    sendToHtml(component, 'intelSaved', { success: result.success, error: result.error });
  } catch (error) {
    sendToHtml(component, 'intelSaved', { success: false, error: error.message });
  }
}

async function handleGetPredictionsData(data, component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'predictionsLoaded', {});
    return;
  }
  try {
    const [forecast, risk] = await Promise.all([
      generateHiringForecast(currentCarrierDOT, data?.monthsAhead || 3),
      getTurnoverRiskAnalysis(currentCarrierDOT)
    ]);
    sendToHtml(component, 'predictionsLoaded', { forecast, risk });
  } catch (error) {
    sendToHtml(component, 'predictionsLoaded', { error: error.message });
  }
}

async function handleGetWorkflows(data, component) {
  try {
    const filters = data?.filters || {};
    if (currentCarrierDOT) filters.carrierId = currentCarrierDOT;
    const result = await getActiveWorkflows(filters);
    sendToHtml(component, 'workflowsLoaded', result);
  } catch (error) {
    sendToHtml(component, 'workflowsLoaded', { error: error.message, workflows: [] });
  }
}

async function handleUpdateWorkflowStep(data, component) {
  try {
    const result = await updateWorkflowStatus(data.workflowId, data.status, data.metadata || {});
    sendToHtml(component, 'workflowUpdated', result);
  } catch (error) {
    sendToHtml(component, 'workflowUpdated', { success: false, error: error.message });
  }
}

async function handleGetRetentionData(data, component) {
  if (!currentCarrierDOT) {
    sendToHtml(component, 'retentionDataLoaded', {});
    return;
  }
  try {
    const result = await getCarrierRetentionDashboard(currentCarrierDOT);
    sendToHtml(component, 'retentionDataLoaded', result);
  } catch (error) {
    sendToHtml(component, 'retentionDataLoaded', { error: error.message });
  }
}

async function handleGetAtRiskDrivers(data, component) {
  // At-risk drivers come from retention dashboard
  if (!currentCarrierDOT) {
    sendToHtml(component, 'atRiskDriversLoaded', { drivers: [] });
    return;
  }
  try {
    const result = await getCarrierRetentionDashboard(currentCarrierDOT);
    sendToHtml(component, 'atRiskDriversLoaded', {
      drivers: result.atRiskDrivers || result.at_risk_drivers || []
    });
  } catch (error) {
    sendToHtml(component, 'atRiskDriversLoaded', { error: error.message, drivers: [] });
  }
}

async function handleGetLeaderboardData(data, component) {
  try {
    const type = data?.type || 'overall';
    const period = data?.period || 'monthly';
    const result = await getLeaderboard(type, period);
    sendToHtml(component, 'leaderboardLoaded', result);
  } catch (error) {
    sendToHtml(component, 'leaderboardLoaded', { error: error.message, entries: [] });
  }
}

async function handleGetBadges(data, component) {
  try {
    const recruiterId = cachedRecruiterProfile?.recruiter_id || cachedRecruiterProfile?._id;
    if (!recruiterId) {
      sendToHtml(component, 'badgesLoaded', { badges: [] });
      return;
    }
    const result = await getUserLeaderboardPosition(recruiterId);
    sendToHtml(component, 'badgesLoaded', result);
  } catch (error) {
    sendToHtml(component, 'badgesLoaded', { error: error.message, badges: [] });
  }
}

async function handleGetSettingsData(component) {
  sendToHtml(component, 'settingsDataLoaded', {
    profile: cachedRecruiterProfile,
    carriers: cachedCarriers,
    currentCarrierDOT
  });
}

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

async function executePaidMediaAction(recruiterId, action, params = {}) {
  return executeTool(
    'recruiter_paid_media',
    { action, params },
    { userId: recruiterId, runId: `recruiter_paid_media_${Date.now()}` }
  );
}

function buildPaidMediaContext(data = {}) {
  return {
    carrierDot: data.carrierDot || currentCarrierDOT || '',
    integrationId: data.integrationId || '',
    adAccountId: data.adAccountId || '',
    idempotencyKey: data.idempotencyKey || `paid_media_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  };
}

async function handleGetPaidMediaState(recruiterId, data, component) {
  const payload = data || {};
  sendToHtml(component, 'paidMediaStateLoaded', {
    success: true,
    recruiterId,
    carrierDot: payload.carrierDot || currentCarrierDOT || '',
    integrationId: payload.integrationId || '',
    adAccountId: payload.adAccountId || '',
    generatedAt: new Date().toISOString()
  });
}

async function handleCreatePaidMediaDraft(recruiterId, data, component) {
  const payload = data || {};
  const context = buildPaidMediaContext(payload);
  const campaignDraft = await executePaidMediaAction(recruiterId, 'create_campaign_draft', {
    campaignId: payload.campaignId || '',
    name: payload.name || '',
    objective: payload.objective || '',
    category: payload.category || 'recruitment',
    dailyBudget: Number(payload.dailyBudget || 0),
    startTime: payload.startTime || '',
    endTime: payload.endTime || '',
    integrationId: context.integrationId,
    adAccountId: context.adAccountId,
    idempotencyKey: `${context.idempotencyKey}_campaign`
  });

  if (!campaignDraft.success) {
    sendToHtml(component, 'paidMediaDraftCreated', campaignDraft);
    return;
  }

  const campaignId = campaignDraft.campaign?.campaign_id || payload.campaignId || '';
  const adSetDraft = await executePaidMediaAction(recruiterId, 'create_ad_set_draft', {
    adSetId: payload.adSetId || '',
    campaignId,
    name: payload.adSetName || `${payload.name || 'Campaign'} - Primary Ad Set`,
    dailyBudget: Number(payload.dailyBudget || 0),
    targeting: payload.targeting || {
      regions: payload.regions || [],
      audience: payload.audience || 'broad',
      placements: payload.placements || []
    },
    schedule: payload.schedule || {
      start_time: payload.startTime || '',
      end_time: payload.endTime || ''
    },
    integrationId: context.integrationId,
    adAccountId: context.adAccountId,
    idempotencyKey: `${context.idempotencyKey}_adset`
  });

  sendToHtml(component, 'paidMediaDraftCreated', {
    success: campaignDraft.success && adSetDraft.success,
    campaign: campaignDraft.campaign || null,
    adSet: adSetDraft.adSet || null,
    errors: [campaignDraft.error, adSetDraft.error].filter(Boolean)
  });
}

async function handleUpdatePaidMediaAdSet(recruiterId, data, component) {
  const payload = data || {};
  const context = buildPaidMediaContext(payload);
  const result = await executePaidMediaAction(recruiterId, 'update_ad_set_budget', {
    adSetId: payload.adSetId || '',
    dailyBudget: Number(payload.dailyBudget || 0),
    lifetimeBudget: Number(payload.lifetimeBudget || 0),
    schedule: payload.schedule || null,
    targeting: payload.targeting || null,
    integrationId: context.integrationId,
    adAccountId: context.adAccountId,
    idempotencyKey: `${context.idempotencyKey}_adset_update`
  });

  sendToHtml(component, 'paidMediaAdSetUpdated', result);
}

async function handleCreatePaidMediaCreative(recruiterId, data, component) {
  const payload = data || {};
  const context = buildPaidMediaContext(payload);
  const creativeResult = await executePaidMediaAction(recruiterId, 'create_creative_draft', {
    creativeId: payload.creativeId || '',
    campaignId: payload.campaignId || '',
    adSetId: payload.adSetId || '',
    name: payload.creativeName || `${payload.name || 'Campaign'} Creative`,
    headline: payload.headline || '',
    body: payload.body || '',
    ctaType: payload.ctaType || 'APPLY_NOW',
    destinationUrl: payload.destinationUrl || '',
    mediaAssets: payload.mediaAssets || [],
    integrationId: context.integrationId,
    adAccountId: context.adAccountId,
    idempotencyKey: `${context.idempotencyKey}_creative`
  });

  sendToHtml(component, 'paidMediaCreativeCreated', creativeResult);
}

async function handleLaunchPaidMediaCampaign(recruiterId, data, component) {
  const payload = data || {};
  const context = buildPaidMediaContext(payload);
  const launchResult = await executePaidMediaAction(recruiterId, 'create_campaign', {
    campaignId: payload.campaignId || '',
    name: payload.name || '',
    objective: payload.objective || '',
    category: payload.category || 'recruitment',
    dailyBudget: Number(payload.dailyBudget || 0),
    startTime: payload.startTime || '',
    endTime: payload.endTime || '',
    status: 'active',
    integrationId: context.integrationId,
    adAccountId: context.adAccountId,
    idempotencyKey: `${context.idempotencyKey}_launch`
  });

  sendToHtml(component, 'paidMediaLaunchResult', launchResult);
}

async function executePaidMediaAnalyticsAction(recruiterId, action, params = {}) {
  return executeTool(
    'recruiter_paid_media_analytics',
    { action, params },
    { userId: recruiterId, runId: `recruiter_paid_media_analytics_${Date.now()}` }
  );
}

async function executePaidMediaPipelineAction(recruiterId, action, params = {}) {
  return executeTool(
    'cross_role_paid_media_pipeline',
    { action, params },
    { userId: recruiterId, runId: `cross_role_paid_media_pipeline_${Date.now()}` }
  );
}

async function handleGetPaidMediaInsights(recruiterId, data, component) {
  const params = data || {};
  const [campaign, adSet, ad, breakdown, funnel, cplTrend, sourceQuality] = await Promise.all([
    executePaidMediaAnalyticsAction(recruiterId, 'get_insights_campaign_level', params),
    executePaidMediaAnalyticsAction(recruiterId, 'get_insights_adset_level', params),
    executePaidMediaAnalyticsAction(recruiterId, 'get_insights_ad_level', params),
    executePaidMediaAnalyticsAction(recruiterId, 'get_insights_with_breakdowns', {
      ...params,
      breakdownBy: params.breakdownBy || 'placement'
    }),
    executePaidMediaPipelineAction(recruiterId, 'get_paid_media_to_pipeline_funnel', params),
    executePaidMediaPipelineAction(recruiterId, 'get_cpl_to_hire_trend', params),
    executePaidMediaPipelineAction(recruiterId, 'get_source_quality_score', params)
  ]);

  sendToHtml(component, 'paidMediaInsightsLoaded', {
    success: campaign.success && adSet.success && ad.success && breakdown.success,
    campaign,
    adSet,
    ad,
    breakdown,
    pipeline: {
      funnel,
      cplTrend,
      sourceQuality
    }
  });
}

async function handleCreatePaidMediaReportJob(recruiterId, data, component) {
  const params = data || {};
  const result = await executePaidMediaAnalyticsAction(recruiterId, 'create_async_report_job', {
    reportScope: params.reportScope || 'campaign',
    format: params.format || 'json',
    dateRange: params.dateRange || {},
    breakdownBy: params.breakdownBy || ''
  });
  sendToHtml(component, 'paidMediaReportJobCreated', result);
}

async function handleGetPaidMediaReportStatus(recruiterId, data, component) {
  const params = data || {};
  const result = await executePaidMediaAnalyticsAction(recruiterId, 'get_async_report_status', {
    jobId: params.jobId || ''
  });
  sendToHtml(component, 'paidMediaReportStatusLoaded', result);
}

async function handleDownloadPaidMediaReport(recruiterId, data, component) {
  const params = data || {};
  const result = await executePaidMediaAnalyticsAction(recruiterId, 'download_report', {
    jobId: params.jobId || ''
  });
  sendToHtml(component, 'paidMediaReportDownloaded', result);
}

async function handleGetPaidMediaOptimizationSuggestions(recruiterId, data, component) {
  const params = data || {};
  const [budget, creative, audience, fatigue, placement] = await Promise.all([
    executePaidMediaAnalyticsAction(recruiterId, 'suggest_budget_reallocation', params),
    executePaidMediaAnalyticsAction(recruiterId, 'suggest_creative_rotation', params),
    executePaidMediaAnalyticsAction(recruiterId, 'suggest_audience_narrowing', params),
    executePaidMediaAnalyticsAction(recruiterId, 'get_frequency_fatigue_alerts', params),
    executePaidMediaAnalyticsAction(recruiterId, 'get_placement_performance', params)
  ]);

  sendToHtml(component, 'paidMediaSuggestionsLoaded', {
    success: budget.success && creative.success && audience.success && fatigue.success && placement.success,
    budget,
    creative,
    audience,
    fatigue,
    placement
  });
}
