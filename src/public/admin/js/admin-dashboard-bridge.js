/* =========================================
   ADMIN DASHBOARD — Bridge Module
   Depends on: AdminDashboardConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var AdminDashboardBridge = (function () {
    'use strict';

    function sendToVelo(message) {
        window.parent.postMessage(message, '*');
    }

    function isValidMessage(data) {
        return data && typeof data === 'object' &&
            typeof data.action === 'string' &&
            AdminDashboardConfig.VALID_ACTIONS.includes(data.action);
    }

    /* --- Outbound messages --- */

    function getDashboard() {
        sendToVelo({ action: 'getDashboard' });
    }

    function getChartData(period) {
        sendToVelo({ action: 'getChartData', period: period });
    }

    function getAIUsage(period) {
        sendToVelo({ action: 'getAIUsage', period: period });
    }

    function getFeatureStats() {
        sendToVelo({ action: 'getFeatureStats' });
    }

    function getMetaGovernanceSummary() {
        sendToVelo({ action: 'getMetaGovernanceSummary' });
    }

    function getMetaApprovalInbox(days) {
        sendToVelo({ action: 'getMetaApprovalInbox', days: days });
    }

    function getMetaPolicyEditorData() {
        sendToVelo({ action: 'getMetaPolicyEditorData' });
    }

    function getMetaErrorDigest(hours, limit) {
        sendToVelo({ action: 'getMetaErrorDigest', hours: hours, limit: limit });
    }

    function getMetaRateLimitPosture(windowHours) {
        sendToVelo({ action: 'getMetaRateLimitPosture', windowHours: windowHours });
    }

    function navigateTo(destination) {
        sendToVelo({ action: 'navigateTo', destination: destination });
    }

    function resolveAlert(alertId) {
        sendToVelo({ action: 'resolveAlert', alertId: alertId });
    }

    function setMetaApprovalThresholds(payload) {
        sendToVelo({ action: 'setMetaApprovalThresholds', payload: payload });
    }

    function setMetaDailyBudgetCaps(payload) {
        sendToVelo({ action: 'setMetaDailyBudgetCaps', payload: payload });
    }

    function setMetaCampaignGuardrails(payload) {
        sendToVelo({ action: 'setMetaCampaignGuardrails', payload: payload });
    }

    function quarantineMetaIntegration(payload) {
        sendToVelo({ action: 'quarantineMetaIntegration', payload: payload });
    }

    function refreshMetaSystemUserToken(payload) {
        sendToVelo({ action: 'refreshMetaSystemUserToken', payload: payload });
    }

    function rebindMetaAdAccount(payload) {
        sendToVelo({ action: 'rebindMetaAdAccount', payload: payload });
    }

    function disableMetaIntegration(payload) {
        sendToVelo({ action: 'disableMetaIntegration', payload: payload });
    }

    function getFeatureLifecycleReport() {
        sendToVelo({ action: 'getFeatureLifecycleReport' });
    }

    function getAtRiskFeatures() {
        sendToVelo({ action: 'getAtRiskFeatures' });
    }

    function getFunnelsList() {
        sendToVelo({ action: 'getFunnelsList' });
    }

    function getFunnelConversion(funnelId, timeRange) {
        sendToVelo({ action: 'getFunnelConversion', funnelId: funnelId, timeRange: timeRange });
    }

    function getFeatureStatsDetail(featureId, timeRange, groupBy) {
        sendToVelo({ action: 'getFeatureStats', featureId: featureId, timeRange: timeRange, groupBy: groupBy });
    }

    function updateFeatureStatus(featureId, status, reason) {
        sendToVelo({ action: 'updateFeatureStatus', featureId: featureId, status: status, reason: reason });
    }

    /* --- Unified message listener --- */
    function listen(handlers) {
        window.addEventListener('message', function (event) {
            var data = event.data;
            if (!isValidMessage(data)) return;
            if (handlers[data.action]) {
                handlers[data.action](data);
            }
        });
    }

    return {
        sendToVelo: sendToVelo,
        isValidMessage: isValidMessage,
        listen: listen,
        getDashboard: getDashboard,
        getChartData: getChartData,
        getAIUsage: getAIUsage,
        getFeatureStats: getFeatureStats,
        getMetaGovernanceSummary: getMetaGovernanceSummary,
        getMetaApprovalInbox: getMetaApprovalInbox,
        getMetaPolicyEditorData: getMetaPolicyEditorData,
        getMetaErrorDigest: getMetaErrorDigest,
        getMetaRateLimitPosture: getMetaRateLimitPosture,
        navigateTo: navigateTo,
        resolveAlert: resolveAlert,
        setMetaApprovalThresholds: setMetaApprovalThresholds,
        setMetaDailyBudgetCaps: setMetaDailyBudgetCaps,
        setMetaCampaignGuardrails: setMetaCampaignGuardrails,
        quarantineMetaIntegration: quarantineMetaIntegration,
        refreshMetaSystemUserToken: refreshMetaSystemUserToken,
        rebindMetaAdAccount: rebindMetaAdAccount,
        disableMetaIntegration: disableMetaIntegration,
        getFeatureLifecycleReport: getFeatureLifecycleReport,
        getAtRiskFeatures: getAtRiskFeatures,
        getFunnelsList: getFunnelsList,
        getFunnelConversion: getFunnelConversion,
        getFeatureStatsDetail: getFeatureStatsDetail,
        updateFeatureStatus: updateFeatureStatus
    };
})();
