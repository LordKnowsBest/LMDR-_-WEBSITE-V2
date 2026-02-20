/* =========================================
   RECRUITER DASHBOARD — Bridge Module
   Depends on: DashboardConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var DashboardBridge = (function () {
  'use strict';

  /* --- Origin validation --- */
  function isValidOrigin(event) {
    if (window.parent === window) {
      console.warn('SECURITY: Not running in iframe context');
      return false;
    }
    if (event.source !== window.parent) {
      console.warn('SECURITY: Message not from parent frame');
      return false;
    }
    return true;
  }

  /* --- Schema validation --- */
  function validateMessageSchema(msg) {
    if (!msg || typeof msg !== 'object') return false;
    if (typeof msg.type !== 'string' || msg.type.length === 0) return false;
    if (msg.data !== undefined && msg.data !== null && typeof msg.data !== 'object') return false;
    return true;
  }

  /* --- HTML sanitization --- */
  function stripHtml(str) {
    if (typeof str !== 'string') return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function safeSetText(element, text) {
    if (element) element.textContent = text;
  }

  function validateInboundMessage(type) {
    if (!DashboardConfig.MESSAGE_REGISTRY.inbound.includes(type)) {
      console.warn('UNREGISTERED INBOUND MESSAGE: "' + type + '" - Add to MESSAGE_REGISTRY.inbound');
      return false;
    }
    return true;
  }

  function logMessageFlow(direction, type, data) {
    if (!DashboardConfig.DEBUG_MESSAGES) return;
    var label = direction === 'in' ? 'Velo->HTML' : 'HTML->Velo';
    console.log('[' + label + '] ' + type, data ? Object.keys(data) : '(no data)');
  }

  /* --- Send message to Wix page code --- */
  function sendToWix(action, data) {
    if (data === undefined) data = {};
    if (!DashboardConfig.MESSAGE_REGISTRY.outbound.includes(action)) {
      console.warn('UNREGISTERED OUTBOUND MESSAGE: "' + action + '" - Add to MESSAGE_REGISTRY.outbound');
    }
    logMessageFlow('out', action, data);

    if (window.parent) {
      window.parent.postMessage({
        type: 'recruiterDashboard',
        action: action,
        data: data
      }, '*');
    }
  }

  /* --- Connection health check --- */
  var connectionVerified = false;

  function verifyConnection() {
    if (connectionVerified) return;
    sendToWix('ping', { timestamp: Date.now() });
    setTimeout(function () {
      if (!connectionVerified) {
        console.warn('CONNECTION CHECK: No pong received from Velo within 3s');
      }
    }, 3000);
  }

  function markConnectionVerified() {
    connectionVerified = true;
  }

  function isConnectionVerified() {
    return connectionVerified;
  }

  /* --- Unified message listener --- */
  function listen(handlers) {
    window.addEventListener('message', function (event) {
      if (!isValidOrigin(event)) return;

      var msg = event.data;
      if (!validateMessageSchema(msg)) return;

      validateInboundMessage(msg.type);
      logMessageFlow('in', msg.type, msg.data);

      if (msg.type && handlers[msg.type]) {
        handlers[msg.type](msg.data, msg);
      }
    });
  }

  return {
    sendToWix: sendToWix,
    listen: listen,
    stripHtml: stripHtml,
    safeSetText: safeSetText,
    verifyConnection: verifyConnection,
    markConnectionVerified: markConnectionVerified,
    isConnectionVerified: isConnectionVerified
  };
})();
