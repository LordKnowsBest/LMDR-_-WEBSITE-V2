/* =========================================
   ADMIN BILLING MANAGEMENT — Logic Module
   Depends on: BillingConfig, BillingBridge, BillingRender
   State management, event handlers, initialization
   ========================================= */
var BillingLogic = (function () {
  'use strict';

  // --- State ---
  var state = {
    currentCustomer: null,
    searchDebounce: null,
    approvalsOpen: false,
    pendingApprovals: []
  };

  // --- Search ---
  function handleSearchInput(value) {
    clearTimeout(state.searchDebounce);
    var clearBtn = document.getElementById('searchClear');

    if (value.length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
      document.getElementById('searchDropdown').classList.add('hidden');
      return;
    }

    if (value.length < 2) return;

    state.searchDebounce = setTimeout(function () {
      BillingBridge.searchCustomer(value);
    }, 300);
  }

  function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchClear').classList.add('hidden');
    document.getElementById('searchDropdown').classList.add('hidden');
  }

  function selectCustomer(dot) {
    document.getElementById('searchDropdown').classList.add('hidden');
    document.getElementById('loadingSkeleton').classList.remove('hidden');
    document.getElementById('customerPanel').classList.add('hidden');
    state.currentCustomer = dot;
    BillingBridge.getBillingDetails(dot);
  }

  // --- Approvals ---
  function loadPendingApprovals() {
    BillingBridge.getPendingApprovals();
  }

  function toggleApprovals() {
    state.approvalsOpen = !state.approvalsOpen;
    document.getElementById('approvalsContent').classList.toggle('hidden', !state.approvalsOpen);
    document.getElementById('approvalsChevron').style.transform = state.approvalsOpen ? 'rotate(180deg)' : '';
  }

  function handleApprove(id) {
    BillingBridge.approveAdjustment(id);
  }

  function handleReject(id) {
    var notes = prompt('Rejection reason:');
    if (notes === null) return;
    BillingBridge.rejectAdjustment(id, notes);
  }

  // --- Modals ---
  function openModal(type) {
    if (!state.currentCustomer) {
      BillingRender.showToast('Select a customer first', 'error');
      return;
    }
    document.getElementById('modalOverlay').classList.remove('hidden');
    BillingConfig.ALL_MODAL_IDS.forEach(function (m) {
      document.getElementById(m).classList.add('hidden');
    });
    var modalId = BillingConfig.MODAL_MAP[type];
    if (modalId) document.getElementById(modalId).classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
  }

  function checkCreditWarning() {
    var amount = parseFloat(document.getElementById('creditAmount').value) || 0;
    document.getElementById('creditWarning').classList.toggle('hidden', amount <= 100);
  }

  // --- Modal Submit Handlers ---
  function submitChangePlan() {
    var newPlan = document.getElementById('newPlanSelect').value;
    var immediate = document.getElementById('immediateChange').checked;
    BillingBridge.changePlan(state.currentCustomer, newPlan, immediate);
    closeModal();
  }

  function submitCredit() {
    var amount = parseFloat(document.getElementById('creditAmount').value);
    var reason = document.getElementById('creditReason').value.trim();
    if (!amount || amount <= 0) { BillingRender.showToast('Enter a valid amount', 'error'); return; }
    if (!reason) { BillingRender.showToast('Reason is required', 'error'); return; }
    BillingBridge.applyCredit(state.currentCustomer, amount, reason);
    closeModal();
  }

  function submitPause() {
    var days = parseInt(document.getElementById('pauseDuration').value);
    var reason = document.getElementById('pauseReason').value.trim();
    BillingBridge.pauseSubscription(state.currentCustomer, days, reason);
    closeModal();
  }

  function submitCancel() {
    var reason = document.getElementById('cancelReason').value.trim();
    var confirmed = document.getElementById('cancelConfirm').checked;
    if (!reason) { BillingRender.showToast('Reason is required', 'error'); return; }
    if (!confirmed) { BillingRender.showToast('Please confirm the cancellation', 'error'); return; }
    var immediate = document.getElementById('immediateCancel').checked;
    BillingBridge.cancelSubscription(state.currentCustomer, immediate, reason);
    closeModal();
  }

  function submitRefund() {
    var invoiceId = document.getElementById('refundInvoice').value.trim();
    var amount = parseFloat(document.getElementById('refundAmount').value);
    var reason = document.getElementById('refundReason').value.trim();
    if (!invoiceId) { BillingRender.showToast('Invoice ID is required', 'error'); return; }
    if (!amount || amount <= 0) { BillingRender.showToast('Enter a valid amount', 'error'); return; }
    if (!reason) { BillingRender.showToast('Reason is required', 'error'); return; }
    BillingBridge.processRefund(state.currentCustomer, invoiceId, amount, reason);
    closeModal();
  }

  // --- Refresh ---
  function refreshCurrentCustomer() {
    if (state.currentCustomer) {
      BillingBridge.getBillingDetails(state.currentCustomer);
    }
    loadPendingApprovals();
  }

  // --- Message Listener ---
  function setupMessageListener() {
    BillingBridge.listen({
      init: function () {
        loadPendingApprovals();
      },
      searchResults: function (msg) {
        BillingRender.renderSearchResults(msg.payload);
      },
      customerLoaded: function (msg) {
        BillingRender.renderCustomerDetails(msg.payload, state.currentCustomer);
      },
      billingHistoryLoaded: function (msg) {
        BillingRender.renderBillingHistory(msg.payload);
      },
      adjustmentsLoaded: function (msg) {
        BillingRender.renderAdjustments(msg.payload);
      },
      pendingApprovalsLoaded: function (msg) {
        state.pendingApprovals = BillingRender.renderApprovals(msg.payload) || [];
      },
      actionSuccess: function (msg) {
        BillingRender.showToast(msg.message, 'success');
        refreshCurrentCustomer();
      },
      actionError: function (msg) {
        BillingRender.showToast(msg.message, 'error');
      }
    });
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // Modal overlay click to close
    document.getElementById('modalOverlay').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) closeModal();
    });

    // Close search dropdown when clicking outside
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#searchInput') && !e.target.closest('#searchDropdown')) {
        document.getElementById('searchDropdown').classList.add('hidden');
      }
    });
  }

  // --- Init ---
  function init() {
    setupEventListeners();
    setupMessageListener();
  }

  function exposeGlobals() {
    window.closeModal = closeModal;
    window.BillingLogic = {
      handleSearchInput: handleSearchInput,
      clearSearch: clearSearch,
      selectCustomer: selectCustomer,
      loadPendingApprovals: loadPendingApprovals,
      toggleApprovals: toggleApprovals,
      handleApprove: handleApprove,
      handleReject: handleReject,
      openModal: openModal,
      checkCreditWarning: checkCreditWarning,
      submitChangePlan: submitChangePlan,
      submitCredit: submitCredit,
      submitPause: submitPause,
      submitCancel: submitCancel,
      submitRefund: submitRefund
    };
  }

  return {
    init: init,
    exposeGlobals: exposeGlobals,
    handleSearchInput: handleSearchInput,
    clearSearch: clearSearch,
    selectCustomer: selectCustomer,
    loadPendingApprovals: loadPendingApprovals,
    toggleApprovals: toggleApprovals,
    handleApprove: handleApprove,
    handleReject: handleReject,
    openModal: openModal,
    closeModal: closeModal,
    checkCreditWarning: checkCreditWarning,
    submitChangePlan: submitChangePlan,
    submitCredit: submitCredit,
    submitPause: submitPause,
    submitCancel: submitCancel,
    submitRefund: submitRefund
  };
})();
