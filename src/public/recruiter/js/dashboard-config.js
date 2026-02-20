/* =========================================
   RECRUITER DASHBOARD — Config Module
   No dependencies
   ========================================= */
var DashboardConfig = (function () {
  'use strict';

  var STAGE_CONFIG = {
    interested: { label: 'AI Sourced', color: 'blue', icon: 'fa-robot' },
    applied: { label: 'Applied', color: 'purple', icon: 'fa-file-alt' },
    in_review: { label: 'In Review', color: 'yellow', icon: 'fa-eye' },
    contacted: { label: 'Contacted', color: 'emerald', icon: 'fa-phone' },
    offer: { label: 'Offer', color: 'cyan', icon: 'fa-file-signature' },
    hired: { label: 'Hired', color: 'green', icon: 'fa-check-circle' }
  };

  var STAGE_ORDER = ['interested', 'applied', 'in_review', 'contacted', 'offer', 'hired'];

  var POLL_CONFIG = {
    baseInterval: 2000,
    maxInterval: 30000,
    backoffMultiplier: 1.5,
    resetOnActivity: true
  };

  var DEBUG_MESSAGES = true;

  var MESSAGE_REGISTRY = {
    inbound: [
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
      'newMessagesData',
      'unreadCountData',
      'getWeightPreferencesResult',
      'saveWeightPreferencesResult',
      'error',
      'pong',
      'systemHealthUpdate'
    ],
    outbound: [
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
      'getNewMessages',
      'getUnreadCount',
      'markAsRead',
      'getWeightPreferences',
      'saveWeightPreferences',
      'navigateTo',
      'logFeatureInteraction',
      'ping',
      'getSystemHealth'
    ]
  };

  var SIDEBAR_PRESETS = {
    balanced: { qualifications: 30, experience: 20, location: 20, availability: 15, salaryFit: 10, engagement: 5 },
    quality: { qualifications: 40, experience: 30, location: 10, availability: 10, salaryFit: 5, engagement: 5 },
    urgent: { qualifications: 15, experience: 10, location: 20, availability: 40, salaryFit: 10, engagement: 5 },
    local: { qualifications: 20, experience: 15, location: 40, availability: 15, salaryFit: 5, engagement: 5 }
  };

  var DEFAULT_WEIGHTS = {
    qualifications: 30,
    experience: 20,
    location: 20,
    availability: 15,
    salaryFit: 10,
    engagement: 5
  };

  var THEME_KEY = 'lmdr-recruiter-theme';

  return {
    STAGE_CONFIG: STAGE_CONFIG,
    STAGE_ORDER: STAGE_ORDER,
    POLL_CONFIG: POLL_CONFIG,
    DEBUG_MESSAGES: DEBUG_MESSAGES,
    MESSAGE_REGISTRY: MESSAGE_REGISTRY,
    SIDEBAR_PRESETS: SIDEBAR_PRESETS,
    DEFAULT_WEIGHTS: DEFAULT_WEIGHTS,
    THEME_KEY: THEME_KEY
  };
})();
