/* =========================================
   ADMIN PROMPTS — Bridge Module
   Depends on: AdminPromptsConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var AdminPromptsBridge = (function () {
  'use strict';

  function sendToVelo(message) {
    window.parent.postMessage(message, '*');
  }

  function listen(handlers) {
    window.addEventListener('message', function (event) {
      var data = event.data;
      if (!data || !AdminPromptsConfig.VALID_ACTIONS.includes(data.action)) return;
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
