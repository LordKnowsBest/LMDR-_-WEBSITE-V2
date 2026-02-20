/* =========================================
   RECRUITER DRIVER SEARCH — Bridge Module
   Depends on: DriverSearchConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var DriverSearchBridge = (function () {
  'use strict';

  var pendingCallback = null;
  var pendingTimeout = null;

  function log() {
    if (!DriverSearchConfig.DEBUG) return;
    var args = ['[SEARCH]'];
    for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
    console.log.apply(console, args);
  }

  /* --- Send message to Wix page code (fire-and-forget) --- */
  function send(action, data) {
    if (data === undefined) data = {};
    log('Sending:', action, data);
    if (window.parent) {
      window.parent.postMessage({ type: action, data: data }, '*');
    }
  }

  /* --- Send message to Wix and wait for a *Result response (Promise-based) --- */
  function sendAndWait(action, data) {
    if (data === undefined) data = {};
    return new Promise(function (resolve, reject) {
      if (pendingTimeout) clearTimeout(pendingTimeout);

      pendingTimeout = setTimeout(function () {
        pendingCallback = null;
        pendingTimeout = null;
        reject(new Error('Request timed out'));
      }, DriverSearchConfig.VELO_TIMEOUT);

      pendingCallback = function (result) {
        clearTimeout(pendingTimeout);
        pendingTimeout = null;
        resolve(result);
      };

      log('Sending (await):', action, data);
      if (window.parent) {
        window.parent.postMessage({ type: action, data: data }, '*');
      }
    });
  }

  /* --- Unified message listener --- */
  function listen(handlers) {
    window.addEventListener('message', function (event) {
      var msg = event.data;
      if (!msg || !msg.type) return;
      log('Received:', msg.type, msg.data);

      // Resolve pending Promise callback for *Result messages
      if (pendingCallback && msg.type.endsWith('Result')) {
        pendingCallback(msg.data);
        pendingCallback = null;
      }

      // Route to named handler
      if (msg.type && handlers[msg.type]) {
        handlers[msg.type](msg.data, msg);
      }
    });
  }

  return {
    log: log,
    send: send,
    sendAndWait: sendAndWait,
    listen: listen
  };
})();
