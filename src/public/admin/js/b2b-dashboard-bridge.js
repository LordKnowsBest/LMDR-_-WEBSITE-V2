/* =========================================
   B2B DASHBOARD — Bridge Module
   Depends on: B2BDashboardConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var B2BDashboardBridge = (function () {
  'use strict';

  function sendToVelo(message) {
    window.parent.postMessage(message, '*');
  }

  function isValidMessage(data) {
    return data && typeof data === 'object' && typeof data.action === 'string' &&
           B2BDashboardConfig.VALID_ACTIONS.includes(data.action);
  }

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
    listen: listen
  };
})();
