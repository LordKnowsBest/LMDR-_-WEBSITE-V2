/* =========================================
   RECRUITER TELEMETRY — Config Module
   No dependencies
   ========================================= */
var TelemetryConfig = (function () {
  'use strict';

  var OUTCOME_COLORS = {
    interested: 'bg-green-500',
    callback: 'bg-blue-500',
    not_now: 'bg-yellow-500',
    wrong_fit: 'bg-red-500',
    no_answer: 'bg-gray-500',
    voicemail: 'bg-purple-500'
  };

  var OUTCOME_BADGES = {
    interested: 'bg-green-600',
    callback: 'bg-blue-600',
    not_now: 'bg-yellow-600',
    wrong_fit: 'bg-red-600',
    no_answer: 'bg-gray-600',
    voicemail: 'bg-purple-600'
  };

  var TOAST_COLORS = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
  };

  var MESSAGE_REGISTRY = {
    inbound: [
      'recruiterProfile',
      'callOutcomeLogged',
      'callAnalyticsLoaded',
      'recentCallsLoaded',
      'driverCallHistoryLoaded'
    ],
    outbound: [
      'telemetryPageReady',
      'navigateTo',
      'logCallOutcome',
      'getCallAnalytics',
      'getRecentCalls'
    ]
  };

  return {
    OUTCOME_COLORS: OUTCOME_COLORS,
    OUTCOME_BADGES: OUTCOME_BADGES,
    TOAST_COLORS: TOAST_COLORS,
    MESSAGE_REGISTRY: MESSAGE_REGISTRY
  };
})();
