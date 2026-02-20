/* =========================================
   DRIVER DASHBOARD — Config Module
   No dependencies
   Uses type/data protocol with MESSAGE_REGISTRY
   ========================================= */
var DashboardConfig = (function () {
  'use strict';

  var STATUS_LABELS = {
    interested: 'Interest Expressed',
    applied: 'Applied',
    in_review: 'In Review',
    contacted: 'Recruiter Contacted',
    offer: 'Job Offer',
    hired: 'Hired',
    rejected: 'Not Selected',
    withdrawn: 'Withdrawn'
  };

  var MESSAGE_REGISTRY = {
    inbound: [
      'dashboardData',
      'withdrawSuccess',
      'conversationData',
      'messageSent',
      'newMessagesData',
      'unreadCountData',
      'viewsData',
      'insightsData',
      'error',
      'pong'
    ],
    outbound: [
      'dashboardReady',
      'refreshDashboard',
      'navigateToMatching',
      'navigateToProfile',
      'navigateToForums',
      'navigateToMentorship',
      'navigateToPetFriendly',
      'navigateToHealth',
      'withdrawApplication',
      'sendMessage',
      'getConversation',
      'getNewMessages',
      'getUnreadCount',
      'markAsRead',
      'logFeatureInteraction',
      'setDiscoverability',
      'navigateToMyCareer',
      'proposeTimeSlots',
      'confirmTimeSlot',
      'ping'
    ]
  };

  var POLL_CONFIG = {
    baseInterval: 2000,
    maxInterval: 30000,
    backoffMultiplier: 1.5,
    resetOnActivity: true
  };

  var FILTER_LABELS = {
    all: 'All Statuses',
    active: 'Active Only',
    offer: 'Offers',
    withdrawn: 'Withdrawn'
  };

  var THEME_KEY = 'lmdr-driver-theme';

  function createInitialState() {
    return {
      applications: [],
      applicationToWithdraw: null,
      activeApplicationId: null,
      lastMessageTimestamp: null,
      currentFilter: 'all',
      isDiscoverable: false
    };
  }

  function stripHtml(str) {
    return String(str || '').replace(/<[^>]*>/g, '');
  }

  return {
    STATUS_LABELS: STATUS_LABELS,
    MESSAGE_REGISTRY: MESSAGE_REGISTRY,
    POLL_CONFIG: POLL_CONFIG,
    FILTER_LABELS: FILTER_LABELS,
    THEME_KEY: THEME_KEY,
    createInitialState: createInitialState,
    stripHtml: stripHtml
  };
})();
