/* =========================================
   ADMIN PLATFORM CONFIG — Bridge Module
   Depends on: PlatformConfigConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var PlatformConfigBridge = (function () {
  'use strict';

  function send(message) {
    window.parent.postMessage(message, '*');
  }

  function getCarrierWeights() { send({ action: 'getCarrierWeights' }); }
  function getDriverWeights() { send({ action: 'getDriverWeights' }); }
  function getSystemSettings() { send({ action: 'getSystemSettings' }); }
  function getTierLimits() { send({ action: 'getTierLimits' }); }
  function getUISettings() { send({ action: 'getUISettings' }); }
  function getJobs() { send({ action: 'getJobs' }); }

  function resetSettings() { send({ action: 'resetSettings' }); }
  function toggleMaintenance(enabled) { send({ action: 'toggleMaintenance', enabled: enabled }); }
  function triggerJob(jobId) { send({ action: 'triggerJob', jobId: jobId }); }

  function saveAllSettings(payload) {
    send({ action: 'saveAllSettings', payload: payload });
  }

  function loadInitialData() {
    getCarrierWeights();
    getDriverWeights();
    getSystemSettings();
    getTierLimits();
    getUISettings();
    getJobs();
  }

  function listen(handlers) {
    window.onmessage = function (event) {
      var data = event.data || {};
      var action = data.action;
      if (action && handlers[action]) {
        handlers[action](data);
      }
    };
  }

  return {
    send: send,
    loadInitialData: loadInitialData,
    resetSettings: resetSettings,
    toggleMaintenance: toggleMaintenance,
    triggerJob: triggerJob,
    saveAllSettings: saveAllSettings,
    getJobs: getJobs,
    listen: listen
  };
})();
