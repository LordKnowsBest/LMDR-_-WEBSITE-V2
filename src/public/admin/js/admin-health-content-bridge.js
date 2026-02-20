/* =========================================
   Admin Health Content — Bridge Module
   No dependencies
   NOTE: This page uses type/data protocol, NOT action/payload
   ========================================= */
var HealthContentBridge = (function () {
  'use strict';

  function sendToVelo(type, data) {
    if (window.parent) window.parent.postMessage({ type: type, data: data || {} }, '*');
  }

  function listen(handlers) {
    window.addEventListener('message', function (e) {
      var msg = e.data || {};
      if (msg.type && handlers[msg.type]) handlers[msg.type](msg.data);
    });
  }

  return { sendToVelo: sendToVelo, listen: listen };
})();
