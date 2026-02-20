/* =========================================
   B2B DASHBOARD — Logic Module
   Depends on: B2BDashboardConfig, B2BDashboardBridge, B2BDashboardRender
   Business logic, state, event handlers
   ========================================= */
var B2BDashboardLogic = (function () {
  'use strict';

  var aiActionsRef = { list: [] };

  function init() {
    setupBridgeListeners();
    refreshDashboard();
  }

  function setupBridgeListeners() {
    B2BDashboardBridge.listen({
      init: function () { refreshDashboard(); },
      kpisLoaded: function (data) { B2BDashboardRender.renderKPIs(data.payload); },
      topProspectsLoaded: function (data) { B2BDashboardRender.renderProspects(data.payload); },
      alertsLoaded: function (data) { B2BDashboardRender.renderAlerts(data.payload); },
      topOpportunitiesLoaded: function (data) { B2BDashboardRender.renderOpportunities(data.payload); },
      nextActionsLoaded: function (data) { B2BDashboardRender.renderAINextActions({ actions: data.payload || [] }, aiActionsRef); },
      signalSpikesLoaded: function () { /* Could enhance alerts */ },
      aiNextActionsLoaded: function (data) { B2BDashboardRender.renderAINextActions(data.payload, aiActionsRef); },
      actionSnoozed: function () {
        B2BDashboardRender.showToast('Action snoozed', 'info');
        refreshAIActions();
      },
      actionSkipped: function () {
        B2BDashboardRender.showToast('Action skipped', 'info');
        refreshAIActions();
      },
      actionRecorded: function () { /* No UI feedback */ },
      actionSuccess: function (data) { B2BDashboardRender.showToast(data.message || 'Done', 'success'); },
      actionError: function (data) { B2BDashboardRender.showToast(data.message || 'Error', 'error'); }
    });
  }

  function refreshDashboard() {
    var days = parseInt(document.getElementById('dateRange').value) || 30;
    B2BDashboardBridge.sendToVelo({ action: 'getDashboardKPIs', days: days });
    B2BDashboardBridge.sendToVelo({ action: 'getTopProspects', limit: 15 });
    B2BDashboardBridge.sendToVelo({ action: 'getAlerts' });
    B2BDashboardBridge.sendToVelo({ action: 'getTopOpportunities', limit: 10 });
    B2BDashboardBridge.sendToVelo({ action: 'getAINextActions', limit: 15 });
  }

  function refreshAIActions() {
    B2BDashboardBridge.sendToVelo({ action: 'getAINextActions', limit: 15 });
  }

  function handleDateRangeChange() {
    refreshDashboard();
  }

  function quickAction(type, carrierDot) {
    B2BDashboardBridge.sendToVelo({ action: 'quickAction', type: type, carrierDot: carrierDot });
    B2BDashboardRender.showToast(type + ' action initiated', 'info');
  }

  function viewAccount(accountId) {
    B2BDashboardBridge.sendToVelo({ action: 'viewAccount', accountId: accountId });
  }

  function startAction(idx) {
    var action = aiActionsRef.list[idx];
    if (!action) return;

    B2BDashboardBridge.sendToVelo({
      action: 'recordActionTaken',
      accountId: action.accountId,
      opportunityId: action.opportunityId,
      recommendedChannel: action.recommendedChannel,
      actualChannel: action.recommendedChannel,
      score: action.score,
      reasons: action.reasons
    });

    viewAccount(action.accountId);
  }

  function snoozeAction(idx) {
    var action = aiActionsRef.list[idx];
    if (!action) return;

    B2BDashboardBridge.sendToVelo({
      action: 'snoozeAction',
      accountId: action.accountId,
      opportunityId: action.opportunityId,
      snoozeDays: 1
    });
  }

  function skipAction(idx) {
    var action = aiActionsRef.list[idx];
    if (!action) return;

    B2BDashboardBridge.sendToVelo({
      action: 'skipAction',
      accountId: action.accountId,
      opportunityId: action.opportunityId,
      skipReason: 'User skipped'
    });
  }

  // Expose globals for onclick handlers
  function exposeGlobals() {
    window.refreshDashboard = refreshDashboard;
    window.handleDateRangeChange = handleDateRangeChange;
  }

  return {
    init: init,
    quickAction: quickAction,
    viewAccount: viewAccount,
    startAction: startAction,
    snoozeAction: snoozeAction,
    skipAction: skipAction,
    exposeGlobals: exposeGlobals
  };
})();
