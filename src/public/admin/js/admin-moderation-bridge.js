/* =========================================
   ADMIN MODERATION — Bridge Module
   Depends on: ModerationConfig
   Handles all postMessage communication with Wix page code
   Uses type/payload protocol
   ========================================= */
var ModerationBridge = (function () {
  'use strict';

  function send(type, payload) {
    if (window.parent) {
      window.parent.postMessage({ type: type, payload: payload || {} }, '*');
    }
  }

  function sendReady() {
    send('ready');
  }

  function requestQueue(status) {
    send('getQueue', { status: status });
  }

  function moderateReport(reportId, action, notes) {
    send('moderateReport', {
      reportId: reportId,
      action: action,
      notes: notes
    });
  }

  function listen(handlers) {
    window.addEventListener('message', function (event) {
      var msg = event.data || {};
      var type = msg.type;
      var payload = msg.payload;
      if (type && handlers[type]) {
        handlers[type](payload, msg);
      }
    });
  }

  return {
    send: send,
    sendReady: sendReady,
    requestQueue: requestQueue,
    moderateReport: moderateReport,
    listen: listen
  };
})();
