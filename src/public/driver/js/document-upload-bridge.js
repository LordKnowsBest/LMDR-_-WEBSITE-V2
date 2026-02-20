/* =========================================
   DRIVER DOCUMENT UPLOAD — Bridge Module
   Depends on: DocUploadConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var DocUploadBridge = (function () {
  'use strict';

  function isValidOrigin(event) {
    if (window.parent === window) {
      console.warn('[DOCS] Not running in iframe context');
      return false;
    }
    if (event.source !== window.parent) {
      return false;
    }
    return true;
  }

  function logMessageFlow(direction, type, data) {
    var icon = direction === 'in' ? '<<' : '>>';
    console.log('[DOCS] ' + icon + ' ' + type, data || '');
  }

  function sendToWix(type, data) {
    if (!DocUploadConfig.MESSAGE_REGISTRY.outbound.includes(type)) {
      console.warn('[DOCS] UNREGISTERED OUTBOUND MESSAGE: "' + type + '"');
    }
    logMessageFlow('out', type, data);
    if (window.parent) {
      window.parent.postMessage({ type: type, data: data || {} }, '*');
    }
  }

  function listen(handlers) {
    window.addEventListener('message', function (event) {
      if (!isValidOrigin(event)) return;
      if (!event.data || typeof event.data !== 'object') return;

      var type = event.data.type;
      var data = event.data.data;
      logMessageFlow('in', type, data);

      if (type && handlers[type]) {
        handlers[type](data);
      }
    });
  }

  function signalReady() {
    sendToWix('documentUploadReady');
    console.log('[DOCS] Ready signal sent to Wix');
  }

  function requestDocumentList(workflowId) {
    sendToWix('requestDocumentList', { workflowId: workflowId });
  }

  function uploadDocument(payload) {
    sendToWix('uploadDocument', payload);
  }

  return {
    sendToWix: sendToWix,
    listen: listen,
    signalReady: signalReady,
    requestDocumentList: requestDocumentList,
    uploadDocument: uploadDocument
  };
})();
