/* =========================================
   RECRUITER PIPELINE — Config Module
   No dependencies
   ========================================= */
var PipelineConfig = (function () {
  'use strict';

  var TRIGGER_LABELS = {
    status_change: 'Status Change',
    document_uploaded: 'Document Uploaded',
    cdl_verified: 'CDL Verified',
    background_check_clear: 'Background Clear',
    no_response_7d: 'No Response (7d)',
    driver_message: 'Driver Message'
  };

  var TOAST_COLORS = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
  };

  var MESSAGE_REGISTRY = {
    inbound: [
      'recruiterProfile',
      'automationRulesLoaded',
      'automationRuleCreated',
      'automationRuleUpdated',
      'automationRuleDeleted',
      'automationRuleToggled',
      'automationLogLoaded'
    ],
    outbound: [
      'pipelinePageReady',
      'navigateTo',
      'getAutomationRules',
      'getAutomationLog',
      'createAutomationRule',
      'updateAutomationRule',
      'deleteAutomationRule',
      'toggleRuleStatus'
    ]
  };

  return {
    TRIGGER_LABELS: TRIGGER_LABELS,
    TOAST_COLORS: TOAST_COLORS,
    MESSAGE_REGISTRY: MESSAGE_REGISTRY
  };
})();
