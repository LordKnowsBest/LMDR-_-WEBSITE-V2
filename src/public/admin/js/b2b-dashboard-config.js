/* =========================================
   B2B DASHBOARD — Config Module
   No dependencies
   ========================================= */
var B2BDashboardConfig = (function () {
  'use strict';

  var VALID_ACTIONS = [
    'init', 'kpisLoaded', 'topProspectsLoaded', 'alertsLoaded',
    'topOpportunitiesLoaded', 'nextActionsLoaded',
    'signalSpikesLoaded', 'actionSuccess', 'actionError',
    'aiNextActionsLoaded', 'actionSnoozed', 'actionSkipped', 'actionRecorded'
  ];

  return {
    VALID_ACTIONS: VALID_ACTIONS
  };
})();
