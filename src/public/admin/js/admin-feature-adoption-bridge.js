/* =========================================
   ADMIN FEATURE ADOPTION — Bridge Module
   Depends on: FeatureAdoptionConfig
   Uses type/data protocol (NOT action/payload)
   ========================================= */
var FeatureAdoptionBridge = (function () {
  'use strict';

  function sendToVelo(type, data) {
    data = data || {};
    window.parent.postMessage({ type: type, data: data }, '*');
  }

  function listen(handlers) {
    window.addEventListener('message', function (event) {
      var msg = event.data;
      if (!msg || !msg.type) return;
      if (handlers[msg.type]) {
        handlers[msg.type](msg.data);
      }
    });
  }

  return {
    sendToVelo: sendToVelo,
    listen: listen
  };
})();
