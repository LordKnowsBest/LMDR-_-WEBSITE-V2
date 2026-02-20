/* =========================================
   TRUCK DRIVER PAGE — Bridge Module
   Depends on: TruckDriverConfig
   ========================================= */
/* global TruckDriverConfig */
var TruckDriverBridge = (function () {
  'use strict';

  var MT = TruckDriverConfig.MESSAGE_TYPES;
  var PROTOCOL_VERSION = TruckDriverConfig.PROTOCOL_VERSION;
  var ALLOWED_ORIGIN_PATTERNS = TruckDriverConfig.ALLOWED_PARENT_ORIGIN_PATTERNS || [];
  var ALLOWED_INBOUND_TYPES = {
    submitResult: true,
    ocrResult: true,
    matchResults: true,
    matchError: true
  };

  function isAllowedOrigin(origin) {
    if (!origin) return false;
    // Wix sandboxed iframes deliver messages with origin === 'null'.
    // The source check (event.source !== window.parent) already guards against
    // rogue senders, so null-origin messages from the verified parent are safe.
    if (origin === 'null') return true;
    return ALLOWED_ORIGIN_PATTERNS.some(function (pattern) {
      return pattern.test(origin);
    });
  }

  function sendToWix(action, data) {
    console.log('[TDP] Sending:', action);
    if (window.parent) {
      window.parent.postMessage({
        type: 'quickApply',
        action: action,
        data: data,
        protocolVersion: PROTOCOL_VERSION
      }, '*');
    }
  }

  function sendPageReady() {
    // Compatibility across current parent page handlers.
    sendToWix(MT.CARRIER_READY, {});
    sendToWix(MT.QUICK_APPLY_READY, {});
    sendToWix(MT.QUICK_APPLY_FORM_READY, {});
    sendToWix(MT.PAGE_READY, {});
    if (window.parent) {
      window.parent.postMessage({ type: 'pageReady', protocolVersion: PROTOCOL_VERSION }, '*');
    }
  }

  function submitApplication(formData) {
    sendToWix(MT.SUBMIT, formData);
  }

  function requestOCR(base64Data, docType, inputId) {
    sendToWix(MT.OCR, { base64Data: base64Data, docType: docType, inputId: inputId });
  }

  function listen(handlers) {
    window.addEventListener('message', function (event) {
      if (event.source !== window.parent) return;
      if (!isAllowedOrigin(event.origin)) {
        console.warn('[TDP] Ignoring message from disallowed origin:', event.origin);
        return;
      }

      var msg = event.data;
      if (!msg || !msg.type) return;
      if (!ALLOWED_INBOUND_TYPES[msg.type]) return;
      console.log('[TDP] Received:', msg.type);

      if (msg.type === 'submitResult' && handlers.onSubmitResult) {
        handlers.onSubmitResult(msg.data);
      } else if (msg.type === 'ocrResult' && handlers.onOCRResult) {
        handlers.onOCRResult(msg.data);
      } else if (msg.type === 'matchResults' && handlers.onMatchResults) {
        handlers.onMatchResults(msg.data);
      } else if (msg.type === 'matchError' && handlers.onMatchError) {
        handlers.onMatchError(msg.data);
      }
    });
  }

  return {
    sendToWix: sendToWix,
    sendPageReady: sendPageReady,
    submitApplication: submitApplication,
    requestOCR: requestOCR,
    listen: listen
  };
})();
