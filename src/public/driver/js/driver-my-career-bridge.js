/* =========================================
   DRIVER MY CAREER — Bridge Module
   Depends on: nothing
   Handles postMessage communication with Wix page code
   ========================================= */
var DriverMyCareerBridge = (function () {
  'use strict';

  function send(type, data) {
    window.parent.postMessage({ type: type, data: data }, '*');
  }

  function submitResignation(reason, notes) {
    send('submitResignation', { reason: reason, notes: notes });
  }

  function requestTimeline() {
    send('getCareerTimeline');
  }

  function requestSurveys() {
    send('getActiveSurveys');
  }

  function ready() {
    send('driverMyCareerReady');
  }

  return {
    send: send,
    submitResignation: submitResignation,
    requestTimeline: requestTimeline,
    requestSurveys: requestSurveys,
    ready: ready
  };
})();
