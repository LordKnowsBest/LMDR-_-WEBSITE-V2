/* =========================================
   TRUCK DRIVER PAGE — Bridge Module
   Depends on: TruckDriverConfig
   ========================================= */
var TruckDriverBridge = (function () {
  'use strict';

  var MT = TruckDriverConfig.MESSAGE_TYPES;

  function sendToWix(action, data) {
    console.log('[TDP] Sending:', action);
    if (window.parent) {
      window.parent.postMessage({ type: 'quickApply', action: action, data: data }, '*');
    }
  }

  function sendPageReady() {
    sendToWix(MT.PAGE_READY, {});
    if (window.parent) {
      window.parent.postMessage({ type: 'pageReady' }, '*');
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
      var msg = event.data;
      if (!msg || !msg.type) return;
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
