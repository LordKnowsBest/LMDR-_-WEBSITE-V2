/* =========================================
   RECRUITER ONBOARDING DASHBOARD — Logic Module
   Depends on: OnboardingConfig, OnboardingBridge, OnboardingRender
   Business logic, event handlers, state management
   ========================================= */
var OnboardingLogic = (function () {
  'use strict';

  var Config = OnboardingConfig;
  var Bridge = OnboardingBridge;
  var Render = OnboardingRender;

  var state = Config.createInitialState();

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    Bridge.listen(handleMessage);

    // Send ready signal to Wix
    Bridge.sendReady();
    console.log('[ONBOARD] Ready signal sent to Wix');

    // Standalone mode (development/testing without Wix)
    if (window.parent === window) {
      console.log('[ONBOARD] Running in standalone mode - loading test data');
      setTimeout(function () { loadTestData(); }, 500);
    }
  }

  // ============================================
  // MESSAGE HANDLING (type/data protocol)
  // ============================================
  function handleMessage(type, data) {
    switch (type) {
      case 'initOnboardingDashboard':
        handleInit(data);
        break;
      case 'workflowList':
        handleWorkflowList(data);
        break;
      case 'documentDetails':
        handleDocumentDetails(data);
        break;
      case 'actionResult':
        handleActionResult(data);
        break;
      case 'workflowUpdate':
        handleWorkflowUpdate(data);
        break;
    }
  }

  function handleInit(data) {
    state.recruiterId = data.recruiterId;
    state.carriers = data.carriers || [];
    Render.populateCarrierFilter(state.carriers);
    Bridge.getWorkflows(state.recruiterId);
  }

  function handleWorkflowList(data) {
    state.workflows = data.workflows || [];
    state.filteredWorkflows = state.workflows.slice();
    Render.updateStats(state.workflows);
    Render.renderWorkflows(state.filteredWorkflows);
  }

  function handleDocumentDetails(data) {
    Render.showDocumentInModal(data);
  }

  function handleActionResult(data) {
    var action = data.action;
    var success = data.success;
    var error = data.error;

    if (success) {
      Render.showToast(action + ' completed successfully!', 'success');
      Bridge.getWorkflows(state.recruiterId);
    } else {
      Render.showToast(error || action + ' failed. Please try again.', 'error');
    }

    closeDocModal();
    closeReminderModal();
  }

  function handleWorkflowUpdate(data) {
    var workflowId = data.workflowId;
    var updates = data.updates;
    var workflow = null;
    for (var i = 0; i < state.workflows.length; i++) {
      if (state.workflows[i].id === workflowId) {
        workflow = state.workflows[i];
        break;
      }
    }
    if (workflow) {
      for (var key in updates) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
          workflow[key] = updates[key];
        }
      }
      Render.updateStats(state.workflows);
      Render.renderWorkflows(state.filteredWorkflows);
    }
  }

  // ============================================
  // FILTERS
  // ============================================
  function toggleFilters() {
    document.querySelector('.filters-section').classList.toggle('show');
  }

  function applyFilters() {
    var statusFilter = document.getElementById('filterStatus').value;
    var carrierFilter = document.getElementById('filterCarrier').value;
    var searchTerm = document.getElementById('searchDriver').value.toLowerCase();

    state.filteredWorkflows = state.workflows.filter(function (w) {
      if (statusFilter && w.status !== statusFilter) return false;
      if (carrierFilter && w.carrierId !== carrierFilter) return false;
      if (searchTerm) {
        var nameMatch = w.driverName.toLowerCase().indexOf(searchTerm) !== -1;
        var emailMatch = (w.driverEmail || '').toLowerCase().indexOf(searchTerm) !== -1;
        if (!nameMatch && !emailMatch) return false;
      }
      return true;
    });

    Render.renderWorkflows(state.filteredWorkflows);
  }

  function clearFilters() {
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterCarrier').value = '';
    document.getElementById('searchDriver').value = '';
    state.filteredWorkflows = state.workflows.slice();
    Render.renderWorkflows(state.filteredWorkflows);
  }

  // ============================================
  // WORKFLOW ACTIONS
  // ============================================
  function toggleWorkflow(workflowId) {
    var card = document.getElementById('workflow-' + workflowId);
    if (card) {
      card.classList.toggle('expanded');
    }
  }

  function contactDriver(workflowId) {
    Bridge.navigateTo('messaging', { workflowId: workflowId });
  }

  function putOnHold(workflowId) {
    if (confirm('Are you sure you want to put this onboarding on hold?')) {
      Bridge.putOnHold(workflowId);
    }
  }

  function resumeWorkflow(workflowId) {
    Bridge.resumeWorkflow(workflowId);
  }

  function cancelWorkflow(workflowId) {
    if (confirm('Are you sure you want to cancel this onboarding? This action cannot be undone.')) {
      Bridge.cancelWorkflow(workflowId);
    }
  }

  function markStarted(workflowId) {
    Bridge.markStarted(workflowId);
  }

  function refreshData() {
    Render.showLoading();
    Bridge.getWorkflows(state.recruiterId);
  }

  function showNewOnboardingModal() {
    Bridge.navigateTo('new-onboarding');
  }

  // ============================================
  // DOCUMENT MODAL
  // ============================================
  function openDocModal(workflowId, documentId) {
    state.currentWorkflowId = workflowId;
    state.currentDocumentId = documentId;

    document.getElementById('rejectionSection').classList.add('hidden');
    document.getElementById('rejectionReason').value = '';
    document.getElementById('ocrDataSection').classList.add('hidden');

    Bridge.getDocumentDetails(workflowId, documentId);

    document.getElementById('docModal').classList.remove('hidden');
    document.getElementById('docModal').classList.add('flex');
  }

  function closeDocModal() {
    document.getElementById('docModal').classList.add('hidden');
    document.getElementById('docModal').classList.remove('flex');
    state.currentWorkflowId = null;
    state.currentDocumentId = null;
  }

  function verifyDocument() {
    Bridge.verifyDocument(state.currentWorkflowId, state.currentDocumentId);
  }

  function rejectDocument() {
    var rejectionSection = document.getElementById('rejectionSection');
    if (rejectionSection.classList.contains('hidden')) {
      rejectionSection.classList.remove('hidden');
      document.getElementById('rejectionReason').focus();
      return;
    }

    var reason = document.getElementById('rejectionReason').value.trim();
    if (!reason) {
      Render.showToast('Please provide a rejection reason.', 'error');
      return;
    }

    Bridge.rejectDocument(state.currentWorkflowId, state.currentDocumentId, reason);
  }

  // ============================================
  // REMINDER MODAL
  // ============================================
  function showReminderModal(workflowId) {
    state.currentWorkflowId = workflowId;
    document.getElementById('reminderEmail').checked = true;
    document.getElementById('reminderSms').checked = false;
    document.getElementById('reminderMessage').value = '';

    document.getElementById('reminderModal').classList.remove('hidden');
    document.getElementById('reminderModal').classList.add('flex');
  }

  function closeReminderModal() {
    document.getElementById('reminderModal').classList.add('hidden');
    document.getElementById('reminderModal').classList.remove('flex');
  }

  function sendReminder() {
    var email = document.getElementById('reminderEmail').checked;
    var sms = document.getElementById('reminderSms').checked;
    var message = document.getElementById('reminderMessage').value.trim();

    if (!email && !sms) {
      Render.showToast('Please select at least one delivery method.', 'error');
      return;
    }

    Bridge.sendReminder(state.currentWorkflowId, { email: email, sms: sms }, message);
  }

  // ============================================
  // STANDALONE TEST DATA
  // ============================================
  function loadTestData() {
    handleInit({
      recruiterId: 'test-recruiter-123',
      carriers: [
        { id: 'carrier-1', name: 'ABC Transport' },
        { id: 'carrier-2', name: 'XYZ Logistics' }
      ]
    });
    handleWorkflowList({
      workflows: [
        {
          id: 'wf-001', driverName: 'John Smith', driverEmail: 'john@email.com',
          carrierId: 'carrier-1', carrierName: 'ABC Transport',
          status: 'documents_requested', documentsStatus: 'partial', documentsProgress: '3/5',
          backgroundStatus: 'ordered', drugTestStatus: 'scheduled', orientationStatus: 'not_started',
          createdDate: '2026-01-18', startDate: '2026-02-01',
          documents: [
            { id: 'doc-1', documentType: 'cdl_front', displayName: 'CDL - Front', status: 'verified' },
            { id: 'doc-2', documentType: 'cdl_back', displayName: 'CDL - Back', status: 'verified' },
            { id: 'doc-3', documentType: 'mvr', displayName: 'MVR', status: 'requested' },
            { id: 'doc-4', documentType: 'medical_card', displayName: 'Medical Card', status: 'submitted' },
            { id: 'doc-5', documentType: 'psp', displayName: 'PSP Report', status: 'rejected', rejectionReason: 'Document expired' }
          ],
          backgroundCheck: { provider: 'HireRight', status: 'processing', orderedDate: '2026-01-18', estimatedCompletion: '2026-01-24' },
          drugTest: { status: 'scheduled', appointmentDate: '2026-01-23T09:00:00', collectionSite: { name: 'Quest Diagnostics - Dallas Main' } },
          complianceIssues: ['Missing MVR document', 'PSP rejected - needs re-upload']
        },
        {
          id: 'wf-002', driverName: 'Maria Garcia', driverEmail: 'maria@email.com',
          carrierId: 'carrier-2', carrierName: 'XYZ Logistics',
          status: 'ready_to_start', documentsStatus: 'complete', documentsProgress: '5/5',
          backgroundStatus: 'passed', drugTestStatus: 'passed', orientationStatus: 'completed',
          createdDate: '2026-01-10', startDate: '2026-01-27',
          documents: [
            { id: 'doc-6', documentType: 'cdl_front', displayName: 'CDL - Front', status: 'verified' },
            { id: 'doc-7', documentType: 'cdl_back', displayName: 'CDL - Back', status: 'verified' },
            { id: 'doc-8', documentType: 'mvr', displayName: 'MVR', status: 'verified' },
            { id: 'doc-9', documentType: 'medical_card', displayName: 'Medical Card', status: 'verified' },
            { id: 'doc-10', documentType: 'psp', displayName: 'PSP Report', status: 'verified' }
          ],
          backgroundCheck: { provider: 'Checkr', status: 'passed', orderedDate: '2026-01-10', completedDate: '2026-01-15' },
          drugTest: { status: 'passed', completedDate: '2026-01-14' }
        },
        {
          id: 'wf-003', driverName: 'Robert Taylor', driverEmail: 'robert@email.com',
          carrierId: 'carrier-1', carrierName: 'ABC Transport',
          status: 'on_hold', documentsStatus: 'pending', documentsProgress: '0/5',
          backgroundStatus: 'not_started', drugTestStatus: 'not_started', orientationStatus: 'not_started',
          createdDate: '2026-01-20',
          documents: [
            { id: 'doc-11', documentType: 'cdl_front', displayName: 'CDL - Front', status: 'requested' },
            { id: 'doc-12', documentType: 'cdl_back', displayName: 'CDL - Back', status: 'requested' },
            { id: 'doc-13', documentType: 'mvr', displayName: 'MVR', status: 'requested' },
            { id: 'doc-14', documentType: 'medical_card', displayName: 'Medical Card', status: 'requested' },
            { id: 'doc-15', documentType: 'psp', displayName: 'PSP Report', status: 'requested' }
          ]
        }
      ]
    });
  }

  // ============================================
  // EXPOSE GLOBALS (for onclick handlers in HTML)
  // ============================================
  function exposeGlobals() {
    window.refreshData = refreshData;
    window.showNewOnboardingModal = showNewOnboardingModal;
    window.toggleFilters = toggleFilters;
    window.applyFilters = applyFilters;
    window.clearFilters = clearFilters;
    window.closeDocModal = closeDocModal;
    window.verifyDocument = verifyDocument;
    window.rejectDocument = rejectDocument;
    window.closeReminderModal = closeReminderModal;
    window.sendReminder = sendReminder;
  }

  return {
    init: init,
    exposeGlobals: exposeGlobals,
    toggleWorkflow: toggleWorkflow,
    contactDriver: contactDriver,
    putOnHold: putOnHold,
    resumeWorkflow: resumeWorkflow,
    cancelWorkflow: cancelWorkflow,
    markStarted: markStarted,
    openDocModal: openDocModal,
    showReminderModal: showReminderModal
  };
})();
