/* =========================================
   ADMIN GAMIFICATION ANALYTICS — Bridge Module
   Depends on: GamificationConfig
   Handles all postMessage communication with Wix page code
   Uses type/data protocol (not action/payload)
   ========================================= */
var GamificationBridge = (function () {
  'use strict';

  function send(type, data) {
    window.parent.postMessage({ type: type, data: data }, '*');
  }

  function requestMetrics() {
    send('getGamificationMetrics');
  }

  function requestAbuseDetection() {
    send('detectAbusePatterns');
  }

  function listen(handlers) {
    window.addEventListener('message', function (event) {
      var msg = event.data || {};
      var type = msg.type;
      var data = msg.data;
      if (type && handlers[type]) {
        handlers[type](data, msg);
      }
    });
  }

  return {
    send: send,
    requestMetrics: requestMetrics,
    requestAbuseDetection: requestAbuseDetection,
    listen: listen
  };
})();
