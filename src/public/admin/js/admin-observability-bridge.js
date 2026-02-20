/* =========================================
   ADMIN OBSERVABILITY — Bridge Module
   Depends on: AdminObservabilityConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var AdminObservabilityBridge = (function () {
    'use strict';

    function sendToVelo(message) {
        window.parent.postMessage(message, '*');
    }

    /* --- Outbound messages --- */

    function sendInit() {
        sendToVelo({ action: 'init' });
    }

    function getLogs(options) {
        sendToVelo({ action: 'getLogs', options: options });
    }

    function getErrors(options) {
        sendToVelo({ action: 'getErrors', options: options });
    }

    function getTrace(traceId) {
        sendToVelo({ action: 'getTrace', traceId: traceId });
    }

    function getHealthMetrics(period) {
        sendToVelo({ action: 'getHealthMetrics', period: period });
    }

    function getAIAnalytics(period) {
        sendToVelo({ action: 'getAIAnalytics', period: period });
    }

    function getAgentBehavior(options) {
        sendToVelo({ action: 'getAgentBehavior', options: options });
    }

    function getActiveAnomalies() {
        sendToVelo({ action: 'getActiveAnomalies' });
    }

    function getAnomalyRules() {
        sendToVelo({ action: 'getAnomalyRules' });
    }

    function getAnomalyHistory(period) {
        sendToVelo({ action: 'getAnomalyHistory', period: period });
    }

    function acknowledgeAnomaly(alertId) {
        sendToVelo({ action: 'acknowledgeAnomaly', alertId: alertId });
    }

    function resolveAnomaly(alertId, notes) {
        sendToVelo({ action: 'resolveAnomaly', alertId: alertId, notes: notes });
    }

    /* --- Inbound message listener --- */

    function listen(handlers) {
        window.onmessage = function (event) {
            var data = event.data;
            if (!data || !data.action) return;
            console.log('[Observability] Received:', data.action);
            if (handlers[data.action]) {
                handlers[data.action](data);
            }
        };
    }

    return {
        sendToVelo: sendToVelo,
        listen: listen,
        sendInit: sendInit,
        getLogs: getLogs,
        getErrors: getErrors,
        getTrace: getTrace,
        getHealthMetrics: getHealthMetrics,
        getAIAnalytics: getAIAnalytics,
        getAgentBehavior: getAgentBehavior,
        getActiveAnomalies: getActiveAnomalies,
        getAnomalyRules: getAnomalyRules,
        getAnomalyHistory: getAnomalyHistory,
        acknowledgeAnomaly: acknowledgeAnomaly,
        resolveAnomaly: resolveAnomaly
    };
})();
