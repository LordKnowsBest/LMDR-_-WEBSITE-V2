/* =========================================
   RECRUITER ONBOARDING DASHBOARD — Bridge Module
   Depends on: OnboardingConfig
   CRITICAL: uses { type, data } protocol, NOT { action, payload }
   ========================================= */
var OnboardingBridge = (function () {
  'use strict';

  var Config = OnboardingConfig;

  function isValidOrigin(event) {
    if (window.parent === window) {
      console.warn('[ONBOARD] Not running in iframe context');
      return false;
    }
    if (event.source !== window.parent) {
      return false;
    }
    return true;
  }

  function logMessageFlow(direction, type, data) {
    var icon = direction === 'in' ? '\uD83D\uDCE5' : '\uD83D\uDCE4';
    console.log('[ONBOARD] ' + icon + ' ' + type, data || '');
  }

  function sendToWix(type, data) {
    if (!data) data = {};
    if (!Config.isValidOutbound(type)) {
      console.warn('[ONBOARD] UNREGISTERED OUTBOUND MESSAGE: "' + type + '"');
    }
    logMessageFlow('out', type, data);
    if (window.parent) {
      window.parent.postMessage({ type: type, data: data }, '*');
    }
  }

  function listen(handler) {
    window.addEventListener('message', function (event) {
      if (!isValidOrigin(event)) return;
      if (!event.data || typeof event.data !== 'object') return;

      var type = event.data.type;
      var data = event.data.data;
      logMessageFlow('in', type, data);
      handler(type, data);
    });
  }

  // Convenience methods
  function sendReady() {
    sendToWix('onboardingDashboardReady');
  }

  function getWorkflows(recruiterId) {
    sendToWix('getWorkflows', { recruiterId: recruiterId });
  }

  function verifyDocument(workflowId, documentId) {
    sendToWix('verifyDocument', { workflowId: workflowId, documentId: documentId });
  }

  function rejectDocument(workflowId, documentId, rejectionReason) {
    sendToWix('rejectDocument', { workflowId: workflowId, documentId: documentId, rejectionReason: rejectionReason });
  }

  function sendReminder(workflowId, methods, customMessage) {
    sendToWix('sendReminder', { workflowId: workflowId, methods: methods, customMessage: customMessage });
  }

  function getDocumentDetails(workflowId, documentId) {
    sendToWix('getDocumentDetails', { workflowId: workflowId, documentId: documentId });
  }

  function cancelWorkflow(workflowId) {
    sendToWix('cancelWorkflow', { workflowId: workflowId });
  }

  function putOnHold(workflowId) {
    sendToWix('putOnHold', { workflowId: workflowId });
  }

  function resumeWorkflow(workflowId) {
    sendToWix('resumeWorkflow', { workflowId: workflowId });
  }

  function markStarted(workflowId) {
    sendToWix('markStarted', { workflowId: workflowId });
  }

  function navigateTo(page, extra) {
    var data = { page: page };
    if (extra) {
      for (var key in extra) {
        if (extra.hasOwnProperty(key)) data[key] = extra[key];
      }
    }
    sendToWix('navigateTo', data);
  }

  return {
    sendToWix: sendToWix,
    listen: listen,
    sendReady: sendReady,
    getWorkflows: getWorkflows,
    verifyDocument: verifyDocument,
    rejectDocument: rejectDocument,
    sendReminder: sendReminder,
    getDocumentDetails: getDocumentDetails,
    cancelWorkflow: cancelWorkflow,
    putOnHold: putOnHold,
    resumeWorkflow: resumeWorkflow,
    markStarted: markStarted,
    navigateTo: navigateTo
  };
})();
