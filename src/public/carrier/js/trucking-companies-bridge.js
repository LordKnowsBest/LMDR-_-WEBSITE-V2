/* =========================================
   TRUCKING COMPANIES — Bridge Module
   VelocityMatch Carrier Landing Page
   Depends on: TruckingConfig
   ========================================= */
var TruckingBridge = (function () {
  'use strict';

  function sendToParent(type, data) {
    window.parent.postMessage({ type: type, data: data }, '*');
  }

  function notifyReady() {
    sendToParent('staffingFormReady');
  }

  function submitStaffingRequest(formData) {
    window.parent.postMessage({
      type: 'submitCarrierStaffingRequest',
      data: formData
    }, '*');
  }

  function listen(handlers) {
    window.addEventListener('message', function (event) {
      if (event.data && event.data.type && handlers[event.data.type]) {
        handlers[event.data.type](event.data);
      }
    });
  }

  return {
    sendToParent: sendToParent,
    notifyReady: notifyReady,
    submitStaffingRequest: submitStaffingRequest,
    listen: listen
  };
})();
