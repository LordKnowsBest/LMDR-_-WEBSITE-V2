// ============================================================================
// ROS-CONTRACT — Canonical Message Registry v2.0.0
// Single source of truth for all HTML ↔ Velo message types.
// Mirrors MESSAGE_REGISTRY in Recruiter Console.zriuj.js.
//
// Dev-mode validation: set window.__ROS_DEV__ = true in browser console to
// log warnings for unregistered messages. Never throws in production.
// ============================================================================

(function () {
  'use strict';

  // ── Inbound: HTML → Velo (ROS.bridge.sendToVelo calls) ──────────────────
  const INBOUND = [
    // Handshake
    'recruiterOSReady', 'ping',
    // Carrier management
    'validateCarrier', 'addCarrier', 'removeCarrier', 'switchCarrier', 'getCarriers',
    // Pipeline
    'getPipeline', 'updateCandidateStatus', 'getStats', 'getCandidateDetails',
    'addCandidateNote', 'addNotes',
    // Messaging
    'getConversations', 'getConversation', 'sendMessage', 'markAsRead',
    'getUnreadCount', 'getNewMessages',
    // Driver search
    'driverSearchReady', 'searchDrivers', 'searchDriversAsync', 'checkSearchStatus',
    'viewDriverProfile', 'saveDriver', 'contactDriver',
    'getQuotaStatus', 'getWeightPreferences', 'saveWeightPreferences',
    'getCarrierPreferences', 'generateAIDraft', 'navigateTo', 'logFeatureInteraction',
    // Saved searches
    'saveSearch', 'loadSavedSearches', 'runSavedSearch', 'deleteSavedSearch', 'updateSavedSearch',
    // Call outcomes / telemetry
    'logCallOutcome', 'getCallAnalytics', 'getRecentCalls', 'getDriverCallHistory',
    // Interventions
    'getInterventionTemplates', 'sendIntervention', 'saveTemplate', 'deleteTemplate',
    'logInterventionOutcome', 'getDriverInterventions',
    // Automation
    'getAutomationRules', 'createAutomationRule', 'updateAutomationRule',
    'deleteAutomationRule', 'toggleRuleStatus', 'getAutomationLog',
    'fetchAutomations', 'toggleAutomation',
    // System
    'getSystemHealth', 'getSettingsData',
    // Onboarding & compliance (individual tools)
    'fetchCompliance', 'fetchDriverDocs', 'fetchBgChecks', 'fetchDrugTests',
    'fetchOrientations', 'fetchCostAnalysis',
    'requestAvailability', 'confirmTimeSlot',
    // Outreach
    'fetchEmailCampaigns', 'sendEmailCampaign',
    'fetchSmsCampaigns', 'sendSmsCampaign',
    'fetchJobBoards', 'connectJobBoard',
    'fetchSocialPosts', 'connectSocialAccount', 'publishSocialPost',
    'generateSocialCopy', 'generateSocialImage',
    'saveSocialCredentials', 'testSocialConnection', 'getSocialCredentialStatus',
    // Gamification & leaderboard
    'fetchGamification', 'getLeaderboard', 'getBadges',
    // AI matches & alerts
    'getAIMatches', 'regenerateAIMatch', 'regenerateAIMatches',
    'getAlerts', 'markAlertRead', 'markAllAlertsRead', 'updateAlertPrefs',
    // Paid media / attribution
    'getPaidMediaState', 'createPaidMediaDraft', 'updatePaidMediaAdSet',
    'createPaidMediaCreative', 'launchPaidMediaCampaign',
    'getPaidMediaInsights', 'createPaidMediaReportJob', 'getPaidMediaReportStatus',
    'downloadPaidMediaReport', 'getPaidMediaOptimizationSuggestions',
    // Consolidate views
    'getFunnelData', 'getCostData',
    'getCompetitorData', 'saveIntel',
    'getTimelineEvents', 'logLifecycleEvent', 'terminateDriver',
    'getPredictionsData',
    'getWorkflows', 'updateWorkflowStep',
    'getRetentionData', 'getAtRiskDrivers',
    // Agent & voice
    'agentMessage', 'resolveApprovalGate',
    'getVoiceConfig', 'getCampaigns', 'createCampaign', 'startCampaign', 'getCampaignStatus',
    // Wave 3 (not yet wired)
    'refreshNBAChips', 'getMarketSignals',
    // Wave 4 (not yet wired)
    'getAgentMemory', 'getProactiveInsights'
  ];

  // ── Outbound: Velo → HTML (sendToHtml calls) ────────────────────────────
  const OUTBOUND = [
    // Handshake
    'recruiterOSInit', 'pong',
    // Carrier management
    'carriersLoaded', 'carrierValidated', 'carrierAdded', 'carrierRemoved', 'carrierSwitched',
    // Pipeline
    'pipelineLoaded', 'statusUpdated', 'statsLoaded', 'candidateDetails', 'notesAdded',
    // Messaging
    'conversationData', 'messageSent', 'unreadCountData', 'newMessagesData',
    // Driver search
    'driverSearchInit', 'searchDriversResult', 'searchJobStarted', 'searchStatusUpdate',
    'viewDriverProfileResult', 'saveDriverResult', 'contactDriverResult',
    'getQuotaStatusResult', 'getWeightPreferencesResult', 'saveWeightPreferencesResult',
    'generateAIDraftResult', 'recruiterProfile',
    // Saved searches
    'savedSearchesLoaded', 'saveSearchResult', 'savedSearchExecuted',
    'savedSearchDeleted', 'savedSearchUpdated',
    // Call outcomes / telemetry
    'callOutcomeLogged', 'callAnalyticsLoaded', 'recentCallsLoaded', 'driverCallHistoryLoaded',
    // Interventions
    'interventionTemplatesLoaded', 'interventionSent', 'templateSaved', 'templateDeleted',
    'interventionOutcomeLogged', 'driverInterventionsLoaded',
    // Automation
    'automationRulesLoaded', 'automationRuleCreated', 'automationRuleUpdated',
    'automationRuleDeleted', 'automationRuleToggled', 'automationLogLoaded',
    'automationsLoaded', 'automationCreated', 'automationToggled',
    // System
    'systemHealthUpdate', 'settingsDataLoaded',
    // Onboarding & compliance (individual tools)
    'complianceLoaded', 'driverDocsLoaded', 'ocrComplete',
    'bgChecksLoaded', 'bgCheckInitiated',
    'drugTestsLoaded', 'drugTestOrdered',
    'orientationsLoaded', 'orientationScheduled',
    'costAnalysisLoaded',
    // Outreach
    'emailCampaignsLoaded', 'emailCampaignSent', 'emailStatsLoaded',
    'smsCampaignsLoaded', 'smsCampaignSent', 'smsStatsLoaded',
    'jobBoardsLoaded', 'jobPostingsLoaded', 'jobPosted', 'jobBoardConnected',
    'socialPostsLoaded', 'socialPostPublished', 'socialAccountConnected',
    'socialCopyGenerated', 'socialImageGenerated',
    'socialCredentialsSaved', 'socialConnectionTested', 'socialCredentialStatusLoaded',
    // Gamification & leaderboard
    'gamificationLoaded', 'leaderboardLoaded', 'badgesLoaded', 'progressionLoaded',
    // AI matches & alerts
    'aiMatchesLoaded', 'aiMatchRegenerated',
    'alertsLoaded', 'alertMarkedRead', 'allAlertsMarkedRead',
    // Paid media / attribution
    'paidMediaStateLoaded', 'paidMediaDraftCreated', 'paidMediaAdSetUpdated',
    'paidMediaCreativeCreated', 'paidMediaLaunchResult',
    'paidMediaInsightsLoaded', 'paidMediaReportJobCreated', 'paidMediaReportStatusLoaded',
    'paidMediaReportDownloaded', 'paidMediaSuggestionsLoaded',
    // Consolidate views
    'funnelDataLoaded', 'costDataLoaded', 'bottleneckAnalysis',
    'competitorDataLoaded', 'intelAdded',
    'timelineLoaded', 'lifecycleEventLogged', 'driverTerminated',
    'predictionsLoaded', 'forecastGenerated',
    'workflowsLoaded', 'workflowUpdated', 'documentStatusLoaded',
    'retentionDataLoaded', 'atRiskDriversLoaded', 'interventionSent',
    // Agent & voice
    'agentResponse', 'agentTyping', 'agentApprovalRequired',
    'voiceReady', 'campaignsLoaded', 'campaignCreated', 'campaignStarted', 'campaignStatusLoaded',
    // Wave 3 (not yet wired)
    'nbaChipsData', 'marketSignalsLoaded',
    // Wave 4 (not yet wired)
    'agentMemoryLoaded', 'proactiveInsightsReady',
    // Generic
    'error'
  ];

  const contract = {
    version: '2.0.0',
    inbound: INBOUND,
    outbound: OUTBOUND,

    /**
     * Validate an inbound message type (HTML → Velo).
     * Only logs in dev mode — never throws.
     */
    assertInbound(type) {
      if (!window.__ROS_DEV__) return true;
      if (!INBOUND.includes(type)) {
        console.warn('[ROS Contract] ⚠️ Unregistered INBOUND message:', type,
          '— add to ros-contract.js and MESSAGE_REGISTRY.inbound');
        return false;
      }
      return true;
    },

    /**
     * Validate an outbound message type (Velo → HTML).
     * Only logs in dev mode — never throws.
     */
    assertOutbound(type) {
      if (!window.__ROS_DEV__) return true;
      if (!OUTBOUND.includes(type)) {
        console.warn('[ROS Contract] ⚠️ Unregistered OUTBOUND message:', type,
          '— add to ros-contract.js and MESSAGE_REGISTRY.outbound');
        return false;
      }
      return true;
    }
  };

  // Attach to global ROS namespace
  ROS.contract = contract;

  if (window.__ROS_DEV__) {
    console.log('[ROS Contract] v' + contract.version + ' loaded —',
      INBOUND.length + ' inbound, ' + OUTBOUND.length + ' outbound messages registered');
  }
})();
