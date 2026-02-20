/* =========================================
   ADMIN AI ROUTER — Bridge Module
   Depends on: AiRouterConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var AiRouterBridge = (function () {
  'use strict';

  function sendToVelo(message) {
    window.parent.postMessage(message, '*');
  }

  function getProviders() {
    sendToVelo({ action: 'getProviders' });
  }

  function getConfig() {
    sendToVelo({ action: 'getConfig' });
  }

  function getUsageStats(period) {
    sendToVelo({ action: 'getUsageStats', period: period });
  }

  function getModels(providerId) {
    sendToVelo({ action: 'getModels', providerId: providerId });
  }

  function updateConfig(functionId, config) {
    sendToVelo({ action: 'updateConfig', functionId: functionId, config: config });
  }

  function resetConfig(functionId) {
    sendToVelo({ action: 'resetConfig', functionId: functionId });
  }

  function testProvider(providerId) {
    sendToVelo({ action: 'testProvider', providerId: providerId });
  }

  function testAllProviders() {
    sendToVelo({ action: 'testAllProviders' });
  }

  function getOptimizerConfig() {
    sendToVelo({ action: 'getOptimizerConfig' });
  }

  function getSavingsReport(period) {
    sendToVelo({ action: 'getSavingsReport', period: period });
  }

  function getProviderMetrics() {
    sendToVelo({ action: 'getProviderMetrics' });
  }

  function updateOptimizerConfig(config) {
    sendToVelo({ action: 'updateOptimizerConfig', config: config });
  }

  function listen(handlers) {
    window.onmessage = function (event) {
      var data = event.data;
      var action = data && data.action;
      if (action && handlers[action]) {
        handlers[action](data);
      }
    };
  }

  return {
    sendToVelo: sendToVelo,
    getProviders: getProviders,
    getConfig: getConfig,
    getUsageStats: getUsageStats,
    getModels: getModels,
    updateConfig: updateConfig,
    resetConfig: resetConfig,
    testProvider: testProvider,
    testAllProviders: testAllProviders,
    getOptimizerConfig: getOptimizerConfig,
    getSavingsReport: getSavingsReport,
    getProviderMetrics: getProviderMetrics,
    updateOptimizerConfig: updateOptimizerConfig,
    listen: listen
  };
})();
