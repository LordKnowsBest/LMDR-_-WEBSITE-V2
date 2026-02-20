/* =========================================
   DRIVER POLICIES — Logic Module
   Depends on: DriverPoliciesBridge
   Config, rendering, event handling, modal logic
   ========================================= */
var DriverPoliciesLogic = (function () {
  'use strict';

  var state = {
    policies: [],
    filtered: [],
    selectedPolicy: null,
    driverId: null,
    carrierId: null
  };

  // ── Data ──
  function refreshPolicies() {
    if (!state.driverId || !state.carrierId) return;
    DriverPoliciesBridge.getPolicies(state.driverId, state.carrierId);
  }

  function applyFilters() {
    var statusFilter = document.getElementById('statusFilter').value;
    state.filtered = state.policies.filter(function (policy) {
      if (statusFilter === 'required') return policy.requires_acknowledgment && !policy.acknowledged;
      if (statusFilter === 'acknowledged') return policy.acknowledged;
      return true;
    });
    renderPolicyList();
  }

  // ── Render ──
  function renderRequiredList() {
    var required = state.policies.filter(function (p) { return p.requires_acknowledgment && !p.acknowledged; });
    document.getElementById('requiredCount').textContent = required.length + ' pending';
    var container = document.getElementById('requiredList');
    if (!required.length) {
      container.innerHTML = '<div class="p-3 rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">No pending items.</div>';
      return;
    }
    container.innerHTML = required.map(function (policy) {
      var deadline = policy.acknowledgment_deadline ? new Date(policy.acknowledgment_deadline).toLocaleDateString() : 'No deadline';
      return (
        '<div class="p-3 rounded-xl border border-slate-200 flex items-center justify-between">' +
          '<div>' +
            '<div class="text-sm font-semibold">' + (policy.title || 'Untitled Policy') + '</div>' +
            '<div class="text-xs text-slate-500">Deadline: ' + deadline + '</div>' +
          '</div>' +
          '<button class="text-xs text-lmdr-blue" onclick="DriverPoliciesLogic.openPolicy(\'' + policy._id + '\')">Review</button>' +
        '</div>'
      );
    }).join('');
  }

  function renderPolicyList() {
    var list = document.getElementById('policyList');
    if (!state.filtered.length) {
      list.innerHTML = '<div class="p-6 rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">No policies match your filter.</div>';
      return;
    }
    list.innerHTML = state.filtered.map(function (policy) {
      var statusBadge = policy.acknowledged
        ? '<span class="pill bg-emerald-100 text-emerald-700">Acknowledged</span>'
        : policy.requires_acknowledgment
          ? '<span class="pill bg-amber-100 text-amber-700">Action Required</span>'
          : '<span class="pill bg-slate-100 text-slate-600">Optional</span>';
      var updated = policy.updated_at ? new Date(policy.updated_at).toLocaleDateString() : '';
      return (
        '<div class="p-4 rounded-xl border border-slate-200 hover:border-lmdr-blue cursor-pointer" onclick="DriverPoliciesLogic.openPolicy(\'' + policy._id + '\')">' +
          '<div class="flex items-center justify-between">' +
            '<div>' +
              '<div class="text-sm font-semibold">' + (policy.title || 'Untitled Policy') + '</div>' +
              '<div class="text-xs text-slate-500">Updated ' + updated + '</div>' +
            '</div>' +
            statusBadge +
          '</div>' +
          '<p class="text-xs text-slate-500 mt-2">' + (policy.description || 'No description provided.') + '</p>' +
        '</div>'
      );
    }).join('');
  }

  function renderPolicyDetail(policy) {
    var detail = document.getElementById('policyDetail');
    if (!policy) {
      detail.innerHTML = '<div class="text-sm text-slate-500">Select a policy to view details.</div>';
      return;
    }
    var deadline = policy.acknowledgment_deadline ? new Date(policy.acknowledgment_deadline).toLocaleDateString() : 'No deadline';
    detail.innerHTML =
      '<div>' +
        '<div class="text-lg font-semibold">' + (policy.title || 'Untitled Policy') + '</div>' +
        '<div class="text-xs text-slate-500">Category: ' + (policy.category || 'general') + '</div>' +
      '</div>' +
      '<div class="text-sm text-slate-600">' + (policy.description || 'No description provided.') + '</div>' +
      '<div class="text-xs text-slate-500">Deadline: ' + deadline + '</div>' +
      '<button class="mt-2 px-3 py-2 rounded-lg bg-lmdr-blue text-white text-sm" onclick="DriverPoliciesLogic.openModal()">View Full Policy</button>';
  }

  // ── Actions ──
  function openPolicy(policyId) {
    var policy = state.policies.find(function (p) { return p._id === policyId; });
    if (!policy) return;
    state.selectedPolicy = policy;
    renderPolicyDetail(policy);
    DriverPoliciesBridge.getPolicyContent(policyId);
    openModal();
  }

  function clearSelection() {
    state.selectedPolicy = null;
    renderPolicyDetail(null);
  }

  function openModal() {
    var modal = document.getElementById('policyModal');
    if (!state.selectedPolicy) return;
    modal.classList.add('active');
    updateModalContent(state.selectedPolicy);
  }

  function closeModal() {
    document.getElementById('policyModal').classList.remove('active');
    document.getElementById('ackConfirm').checked = false;
    document.getElementById('ackStatus').textContent = '';
  }

  function updateModalContent(policy) {
    document.getElementById('modalTitle').textContent = policy.title || 'Policy';
    document.getElementById('modalCategory').textContent = (policy.category || 'general').toUpperCase();
    var contentEl = document.getElementById('modalContent');
    var linkEl = document.getElementById('modalLink');
    contentEl.textContent = '';
    linkEl.classList.add('hidden');

    if (policy.content_type === 'pdf' && policy.content) {
      linkEl.textContent = 'Open PDF';
      linkEl.onclick = function () { window.open(policy.content, '_blank'); };
      linkEl.classList.remove('hidden');
    } else if (policy.content_type === 'external_link' && policy.external_url) {
      linkEl.textContent = 'Open Link';
      linkEl.onclick = function () { window.open(policy.external_url, '_blank'); };
      linkEl.classList.remove('hidden');
    } else {
      contentEl.textContent = policy.content || 'No content available.';
    }

    var ackCheckbox = document.getElementById('ackCheckbox');
    if (policy.requires_acknowledgment && !policy.acknowledged) {
      ackCheckbox.classList.remove('hidden');
    } else {
      ackCheckbox.classList.add('hidden');
    }
  }

  function submitAcknowledgment() {
    if (!state.selectedPolicy) return;
    if (state.selectedPolicy.requires_acknowledgment && !document.getElementById('ackConfirm').checked) {
      document.getElementById('ackStatus').textContent = 'Please confirm acknowledgment.';
      return;
    }
    DriverPoliciesBridge.acknowledgePolicy(
      state.selectedPolicy._id,
      state.driverId,
      'checkbox',
      'web'
    );
  }

  // ── Message Handler ──
  function handleMessage(event) {
    var msg = event.data || {};
    var type = msg.type;
    var data = msg.data;

    if (type === 'driverPoliciesData') {
      state.policies = (data && data.policies) || [];
      state.filtered = state.policies.slice();
      renderRequiredList();
      applyFilters();
    }
    if (type === 'policyContentData' && data && data.policy && state.selectedPolicy) {
      state.selectedPolicy = Object.assign({}, state.selectedPolicy, data.policy);
      updateModalContent(state.selectedPolicy);
    }
    if (type === 'policyAcknowledgeResult') {
      document.getElementById('ackStatus').textContent = (data && data.success) ? 'Acknowledgment saved.' : ((data && data.error) || 'Unable to acknowledge.');
      if (data && data.success && state.selectedPolicy) {
        state.selectedPolicy.acknowledged = true;
        renderRequiredList();
        applyFilters();
      }
    }
    if (type === 'driverContext') {
      state.driverId = (data && data.driverId) || state.driverId;
      state.carrierId = (data && data.carrierId) || state.carrierId;
      refreshPolicies();
    }
  }

  // ── Expose Globals for onclick ──
  function exposeGlobals() {
    window.refreshPolicies = refreshPolicies;
    window.applyFilters = applyFilters;
    window.clearSelection = clearSelection;
    window.closeModal = closeModal;
    window.submitAcknowledgment = submitAcknowledgment;
  }

  // ── Init ──
  function init() {
    exposeGlobals();
    window.addEventListener('message', handleMessage);
    DriverPoliciesBridge.ready();
  }

  return {
    init: init,
    openPolicy: openPolicy,
    openModal: openModal,
    closeModal: closeModal,
    applyFilters: applyFilters
  };
})();
