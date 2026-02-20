/* =========================================
   ADMIN COMMISSIONS — Logic Module
   Depends on: CommissionsConfig, CommissionsBridge, CommissionsRender
   State management, event handlers, initialization
   ========================================= */
var CommissionsLogic = (function () {
  'use strict';

  // --- State ---
  var currentTab = 'leaderboard';
  var currentPeriod = 'month';
  var commissionsData = [];
  var rulesData = [];
  var repsData = [];
  var payoutReportData = null;
  var selectedCommissions = new Set();

  // --- Helpers ---
  function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
  }

  function getCommissionFilters() {
    var filters = {};
    var status = document.getElementById('filterStatus').value;
    if (status !== 'all') filters.status = status;
    var dateFrom = document.getElementById('filterDateFrom').value;
    if (dateFrom) filters.dateFrom = dateFrom;
    var dateTo = document.getElementById('filterDateTo').value;
    if (dateTo) filters.dateTo = dateTo;
    var rep = document.getElementById('filterRep').value;
    if (rep !== 'all') filters.repId = rep;
    return filters;
  }

  function updateBulkApproveBtn() {
    var btn = document.getElementById('btnBulkApprove');
    if (selectedCommissions.size > 0) {
      btn.classList.remove('hidden');
      btn.textContent = 'Approve Selected (' + selectedCommissions.size + ')';
    } else {
      btn.classList.add('hidden');
    }
  }

  function updateCalculatedCommission() {
    var dealValue = Number(document.getElementById('formDealValue').value) || 0;
    var rateInput = document.getElementById('formRate').value;
    var eventType = document.getElementById('formEventType').value;
    var rate = rateInput ? Number(rateInput) / 100 : (CommissionsConfig.DEFAULT_RATES[eventType] || 10) / 100;
    var amount = dealValue * rate;
    document.getElementById('formCalculatedAmount').textContent = CommissionsRender.formatCurrency(amount);
  }

  function refreshCurrentTab() {
    CommissionsBridge.getSummary(currentPeriod);
    switch (currentTab) {
      case 'leaderboard': CommissionsBridge.getLeaderboard(currentPeriod); break;
      case 'commissions': CommissionsBridge.getCommissions(getCommissionFilters()); break;
      case 'rules': CommissionsBridge.getRules(); break;
      case 'reps': CommissionsBridge.getReps(); break;
    }
  }

  // --- Actions ---
  function viewCommission(id) {
    CommissionsBridge.getCommissionDetail(id);
  }

  function approveFromDetail(id) {
    CommissionsBridge.approveCommission(id);
    closeModal('commissionDetailModal');
  }

  function editRule(id) {
    var rule = rulesData.find(function (r) { return r._id === id; });
    if (!rule) return;
    document.getElementById('ruleId').value = rule._id || '';
    document.getElementById('ruleName').value = rule.rule_name || '';
    document.getElementById('ruleEventType').value = rule.event_type || 'new_subscription';
    document.getElementById('ruleBaseRate').value = (Number(rule.base_rate) * 100) || '';
    document.getElementById('rulePriority').value = rule.priority || 10;
    document.getElementById('ruleTierBonuses').value = rule.tier_bonuses ? (typeof rule.tier_bonuses === 'string' ? rule.tier_bonuses : JSON.stringify(rule.tier_bonuses, null, 2)) : '';
    document.getElementById('ruleStatus').value = rule.status || 'active';
    document.getElementById('ruleModalTitle').textContent = 'Edit Rule';
    document.getElementById('ruleModal').classList.remove('hidden');
  }

  function editRep(id) {
    var rep = repsData.find(function (r) { return r._id === id; });
    if (!rep) return;
    document.getElementById('repId').value = rep._id || '';
    document.getElementById('repName').value = rep.name || '';
    document.getElementById('repEmail').value = rep.email || '';
    document.getElementById('repPhone').value = rep.phone || '';
    document.getElementById('repRole').value = rep.role || '';
    document.getElementById('repPaymentMethod').value = rep.payment_method || 'direct_deposit';
    document.getElementById('repPaymentDetails').value = rep.payment_details || '';
    document.getElementById('repStatus').value = rep.status || 'active';
    document.getElementById('repModalTitle').textContent = 'Edit Sales Rep';
    document.getElementById('repModal').classList.remove('hidden');
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) { b.className = b.className.replace('tab-active', 'tab-inactive'); });
        btn.className = btn.className.replace('tab-inactive', 'tab-active');
        document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.add('hidden'); });
        currentTab = btn.dataset.tab;
        document.getElementById('tab-' + currentTab).classList.remove('hidden');
      });
    });

    // Period selector
    document.getElementById('periodSelector').addEventListener('change', function (e) {
      currentPeriod = e.target.value;
      CommissionsBridge.getSummary(currentPeriod);
      CommissionsBridge.getLeaderboard(currentPeriod);
    });

    // Filter changes
    ['filterStatus', 'filterDateFrom', 'filterDateTo', 'filterRep'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        CommissionsBridge.getCommissions(getCommissionFilters());
      });
    });

    // Check all
    document.getElementById('checkAll').addEventListener('change', function (e) {
      var checks = document.querySelectorAll('.comm-check:not(:disabled)');
      checks.forEach(function (cb) {
        cb.checked = e.target.checked;
        var id = cb.dataset.id;
        if (e.target.checked) selectedCommissions.add(id);
        else selectedCommissions.delete(id);
      });
      updateBulkApproveBtn();
    });

    // Bulk approve
    document.getElementById('btnBulkApprove').addEventListener('click', function () {
      if (selectedCommissions.size === 0) return;
      CommissionsBridge.bulkApprove(Array.from(selectedCommissions));
    });

    // Record commission modal
    document.getElementById('btnRecordCommission').addEventListener('click', function () {
      document.getElementById('recordCommissionForm').reset();
      document.getElementById('formCalculatedAmount').textContent = '$0.00';
      document.getElementById('recordCommissionModal').classList.remove('hidden');
    });

    document.getElementById('formDealValue').addEventListener('input', updateCalculatedCommission);
    document.getElementById('formRate').addEventListener('input', updateCalculatedCommission);
    document.getElementById('formEventType').addEventListener('change', function () {
      var eventType = document.getElementById('formEventType').value;
      if (!document.getElementById('formRate').value) {
        document.getElementById('formRate').placeholder = CommissionsConfig.DEFAULT_RATES[eventType] || 10;
      }
      updateCalculatedCommission();
    });

    document.getElementById('recordCommissionForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var eventType = document.getElementById('formEventType').value;
      var rateInput = document.getElementById('formRate').value;
      var rate = rateInput ? Number(rateInput) / 100 : (CommissionsConfig.DEFAULT_RATES[eventType] || 10) / 100;
      CommissionsBridge.recordCommission({
        sales_rep_id: document.getElementById('formRepId').value,
        carrier_dot: document.getElementById('formCarrierDot').value,
        event_type: eventType,
        deal_value: Number(document.getElementById('formDealValue').value),
        commission_rate: rate,
        notes: document.getElementById('formNotes').value
      });
      closeModal('recordCommissionModal');
    });

    // Rule modal
    document.getElementById('btnAddRule').addEventListener('click', function () {
      document.getElementById('ruleForm').reset();
      document.getElementById('ruleId').value = '';
      document.getElementById('ruleModalTitle').textContent = 'Add Rule';
      document.getElementById('ruleModal').classList.remove('hidden');
    });

    document.getElementById('ruleForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var rule = {
        rule_name: document.getElementById('ruleName').value,
        event_type: document.getElementById('ruleEventType').value,
        base_rate: Number(document.getElementById('ruleBaseRate').value) / 100,
        priority: Number(document.getElementById('rulePriority').value) || 10,
        tier_bonuses: document.getElementById('ruleTierBonuses').value || '',
        status: document.getElementById('ruleStatus').value
      };
      var id = document.getElementById('ruleId').value;
      if (id) rule._id = id;
      CommissionsBridge.saveRule(rule);
      closeModal('ruleModal');
    });

    // Rep modal
    document.getElementById('btnAddRep').addEventListener('click', function () {
      document.getElementById('repForm').reset();
      document.getElementById('repId').value = '';
      document.getElementById('repModalTitle').textContent = 'Add Sales Rep';
      document.getElementById('repModal').classList.remove('hidden');
    });

    document.getElementById('repForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var rep = {
        name: document.getElementById('repName').value,
        email: document.getElementById('repEmail').value,
        phone: document.getElementById('repPhone').value,
        role: document.getElementById('repRole').value,
        payment_method: document.getElementById('repPaymentMethod').value,
        payment_details: document.getElementById('repPaymentDetails').value,
        status: document.getElementById('repStatus').value
      };
      var id = document.getElementById('repId').value;
      if (id) rep._id = id;
      CommissionsBridge.saveRep(rep);
      closeModal('repModal');
    });

    // Payout report
    document.getElementById('btnPayoutReport').addEventListener('click', function () {
      CommissionsBridge.generatePayout(currentPeriod);
    });

    document.getElementById('btnMarkAllPaid').addEventListener('click', function () {
      if (!payoutReportData || !payoutReportData.report) return;
      var allIds = [];
      payoutReportData.report.forEach(function (rep) {
        (rep.commissions || []).forEach(function (c) { allIds.push(c._id); });
      });
      if (!allIds.length) return;
      var ref = document.getElementById('payoutReference').value;
      CommissionsBridge.markPaid(allIds, ref);
      closeModal('payoutModal');
    });

    document.getElementById('btnExportCSV').addEventListener('click', function () {
      if (!payoutReportData || !payoutReportData.report) return;
      CommissionsBridge.exportCSV(payoutReportData);
    });
  }

  // --- Message listener ---
  function setupMessageListener() {
    CommissionsBridge.listen({
      init: function () {
        CommissionsBridge.getSummary(currentPeriod);
        CommissionsBridge.getLeaderboard(currentPeriod);
        CommissionsBridge.getCommissions({});
        CommissionsBridge.getRules();
        CommissionsBridge.getReps();
      },
      summaryLoaded: function (msg) { CommissionsRender.renderSummary(msg.payload); },
      leaderboardLoaded: function (msg) { CommissionsRender.renderLeaderboard(msg.payload); },
      commissionsLoaded: function (msg) {
        commissionsData = CommissionsRender.renderCommissions(msg.payload, selectedCommissions, updateBulkApproveBtn);
      },
      rulesLoaded: function (msg) { rulesData = CommissionsRender.renderRules(msg.payload); },
      repsLoaded: function (msg) { repsData = CommissionsRender.renderReps(msg.payload); },
      commissionDetailLoaded: function (msg) { CommissionsRender.showCommissionDetail(msg.payload); },
      payoutReportReady: function (msg) { payoutReportData = CommissionsRender.renderPayoutReport(msg.payload); },
      actionSuccess: function (msg) {
        CommissionsRender.showToast(msg.message, 'success');
        refreshCurrentTab();
      },
      actionError: function (msg) { CommissionsRender.showToast(msg.message, 'error'); }
    });
  }

  // --- Init ---
  function init() {
    setupEventListeners();
    setupMessageListener();
  }

  function exposeGlobals() {
    window.closeModal = closeModal;
    window.CommissionsLogic = {
      viewCommission: viewCommission,
      approveFromDetail: approveFromDetail,
      editRule: editRule,
      editRep: editRep
    };
  }

  return {
    init: init,
    exposeGlobals: exposeGlobals,
    viewCommission: viewCommission,
    approveFromDetail: approveFromDetail,
    editRule: editRule,
    editRep: editRep
  };
})();
