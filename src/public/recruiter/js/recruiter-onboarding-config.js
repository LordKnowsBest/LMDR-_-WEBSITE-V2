/* =========================================
   RECRUITER ONBOARDING DASHBOARD — Config Module
   No dependencies
   CRITICAL: uses type/data protocol, NOT action/payload
   ========================================= */
var OnboardingConfig = (function () {
  'use strict';

  // Message registry — validates inbound/outbound messages
  var MESSAGE_REGISTRY = {
    inbound: [
      'initOnboardingDashboard',
      'workflowList',
      'documentDetails',
      'actionResult',
      'workflowUpdate'
    ],
    outbound: [
      'onboardingDashboardReady',
      'getWorkflows',
      'verifyDocument',
      'rejectDocument',
      'sendReminder',
      'getDocumentDetails',
      'cancelWorkflow',
      'putOnHold',
      'resumeWorkflow',
      'navigateTo',
      'markStarted'
    ]
  };

  var STATUS_LABELS = {
    offer_sent: 'Offer Sent',
    offer_accepted: 'Offer Accepted',
    documents_requested: 'Documents Requested',
    documents_complete: 'Documents Complete',
    background_ordered: 'BG Ordered',
    background_passed: 'BG Passed',
    background_failed: 'BG Failed',
    drug_test_scheduled: 'Drug Scheduled',
    drug_test_passed: 'Drug Passed',
    drug_test_failed: 'Drug Failed',
    orientation_scheduled: 'Orientation Sched.',
    orientation_completed: 'Orientation Done',
    compliance_verified: 'Compliance OK',
    ready_to_start: 'Ready to Start',
    cancelled: 'Cancelled',
    on_hold: 'On Hold'
  };

  var SUBSTATUS_LABELS = {
    pending: 'Pending',
    partial: 'Partial',
    complete: 'Complete',
    not_started: 'Not Started',
    ordered: 'Ordered',
    processing: 'Processing',
    passed: 'Passed',
    failed: 'Failed',
    scheduled: 'Scheduled',
    completed: 'Completed',
    requested: 'Requested',
    submitted: 'Submitted',
    verified: 'Verified',
    rejected: 'Rejected'
  };

  var DOC_STATUS_CONFIGS = {
    requested: { icon: 'far fa-circle', iconColor: 'text-slate-400' },
    submitted: { icon: 'fas fa-hourglass-half', iconColor: 'text-blue-500' },
    verified: { icon: 'fas fa-check-circle', iconColor: 'text-green-500' },
    rejected: { icon: 'fas fa-times-circle', iconColor: 'text-red-500' }
  };

  function createInitialState() {
    return {
      workflows: [],
      filteredWorkflows: [],
      carriers: [],
      currentWorkflowId: null,
      currentDocumentId: null,
      recruiterId: null
    };
  }

  function isValidInbound(type) {
    return MESSAGE_REGISTRY.inbound.indexOf(type) !== -1;
  }

  function isValidOutbound(type) {
    return MESSAGE_REGISTRY.outbound.indexOf(type) !== -1;
  }

  function formatStatus(status) {
    return STATUS_LABELS[status] || status;
  }

  function formatSubstatus(status) {
    return SUBSTATUS_LABELS[status] || status;
  }

  function getDocStatusConfig(status) {
    return DOC_STATUS_CONFIGS[status] || DOC_STATUS_CONFIGS.requested;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatOcrKey(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });
  }

  function calculateDays(startDate) {
    if (!startDate) return 0;
    var start = new Date(startDate);
    var now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  }

  function calculateProgress(workflow) {
    var total = 0;
    var completed = 0;

    // Documents (30%)
    total += 30;
    if (workflow.documentsStatus === 'complete') completed += 30;
    else if (workflow.documentsStatus === 'partial') completed += 15;

    // Background (25%)
    total += 25;
    if (workflow.backgroundStatus === 'passed') completed += 25;
    else if (workflow.backgroundStatus === 'ordered' || workflow.backgroundStatus === 'processing') completed += 10;

    // Drug Test (25%)
    total += 25;
    if (workflow.drugTestStatus === 'passed') completed += 25;
    else if (workflow.drugTestStatus === 'scheduled') completed += 10;

    // Orientation (20%)
    total += 20;
    if (workflow.orientationStatus === 'completed') completed += 20;
    else if (workflow.orientationStatus === 'scheduled') completed += 10;

    return Math.round((completed / total) * 100);
  }

  function getInitials(name) {
    if (!name) return '?';
    var parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  return {
    MESSAGE_REGISTRY: MESSAGE_REGISTRY,
    createInitialState: createInitialState,
    isValidInbound: isValidInbound,
    isValidOutbound: isValidOutbound,
    formatStatus: formatStatus,
    formatSubstatus: formatSubstatus,
    getDocStatusConfig: getDocStatusConfig,
    formatDate: formatDate,
    formatOcrKey: formatOcrKey,
    calculateDays: calculateDays,
    calculateProgress: calculateProgress,
    getInitials: getInitials
  };
})();
