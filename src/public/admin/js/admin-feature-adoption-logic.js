/* =========================================
   ADMIN FEATURE ADOPTION — Logic Module
   Depends on: FeatureAdoptionConfig, FeatureAdoptionBridge, FeatureAdoptionRender
   Business logic, state, event handlers
   NOTE: Uses type/data protocol (NOT action/payload)
   ========================================= */
var FeatureAdoptionLogic = (function () {
  'use strict';

  var state = {
    features: [],
    funnels: [],
    atRiskFeatures: [],
    selectedTimeRange: '30d',
    selectedFeatureId: null,
    charts: {}
  };

  function init() {
    setupBridgeListeners();
    FeatureAdoptionBridge.sendToVelo('featureAdoptionReady');
    refreshAll();
  }

  function setupBridgeListeners() {
    FeatureAdoptionBridge.listen({
      featureLifecycleReportResult: function (data) { handleLifecycleReport(data); },
      featureStatsResult: function (data) { FeatureAdoptionRender.renderFeatureStats(data); },
      featureHealthScoreResult: function (data) { FeatureAdoptionRender.renderHealthBreakdown(data); },
      atRiskFeaturesResult: function (data) { handleAtRiskFeatures(data); },
      funnelsListResult: function (data) { handleFunnelsList(data); },
      funnelConversionResult: function (data) { FeatureAdoptionRender.renderFunnelConversion(data); },
      registerFeatureResult: function (data) { handleRegisterResult(data); },
      updateFeatureStatusResult: function (data) { handleStatusUpdateResult(data); }
    });
  }

  function refreshAll() {
    var icon = document.getElementById('refreshIcon');
    icon.classList.add('animate-spin');
    setTimeout(function () { icon.classList.remove('animate-spin'); }, 2000);

    FeatureAdoptionBridge.sendToVelo('getFeatureLifecycleReport');
    FeatureAdoptionBridge.sendToVelo('getAtRiskFeatures');
    FeatureAdoptionBridge.sendToVelo('getFunnelsList');
  }

  // Tabs
  function switchTab(tab) {
    var tabs = ['Overview', 'Registry', 'Funnels', 'AtRisk'];
    tabs.forEach(function (t) {
      var panel = document.getElementById('panel' + t);
      var tabBtn = document.getElementById('tab' + t);
      if (t.toLowerCase() === tab) {
        panel.classList.remove('hidden');
        tabBtn.className = 'pb-3 tab-active';
      } else {
        panel.classList.add('hidden');
        tabBtn.className = 'pb-3 tab-inactive';
      }
    });
  }

  // Time range
  function setTimeRange(range) {
    state.selectedTimeRange = range;
    ['7d', '30d', '90d'].forEach(function (r) {
      var btn = document.getElementById('tr' + r);
      if (r === range) {
        btn.className = 'px-3 py-1.5 rounded-md bg-lmdr-blue text-white';
      } else {
        btn.className = 'px-3 py-1.5 rounded-md transition-colors text-slate-400 hover:text-white';
      }
    });
    refreshAll();
  }

  // Lifecycle report
  function handleLifecycleReport(data) {
    if (!data || data.error) {
      console.warn('Lifecycle report error:', data?.error);
      return;
    }
    state.features = data.features || [];
    var summary = data.summary || {};

    FeatureAdoptionRender.renderSummaryCards(summary);
    FeatureAdoptionRender.renderLifecycleChart(summary.byStatus || {}, state.charts);
    FeatureAdoptionRender.renderHealthDistChart(state.features, state.charts);
    FeatureAdoptionRender.renderHealthGrid(state.features);
    FeatureAdoptionRender.renderRegistryTable(state.features);
  }

  // Sort
  function sortFeatures() {
    var sort = document.getElementById('sortBy').value;
    var sorted = state.features.slice();
    switch (sort) {
      case 'health-asc': sorted.sort(function (a, b) { return (a.healthScore || 0) - (b.healthScore || 0); }); break;
      case 'health-desc': sorted.sort(function (a, b) { return (b.healthScore || 0) - (a.healthScore || 0); }); break;
      case 'users-desc': sorted.sort(function (a, b) { return (b.last30DaysUsers || 0) - (a.last30DaysUsers || 0); }); break;
      case 'name-asc': sorted.sort(function (a, b) { return (a.displayName || a.featureId).localeCompare(b.displayName || b.featureId); }); break;
    }
    FeatureAdoptionRender.renderHealthGrid(sorted);
  }

  // Registry filter
  function filterRegistry() {
    var search = document.getElementById('registrySearch').value.toLowerCase();
    var status = document.getElementById('registryStatusFilter').value;
    var filtered = state.features;
    if (search) {
      filtered = filtered.filter(function (f) {
        return (f.displayName || '').toLowerCase().includes(search) ||
               f.featureId.toLowerCase().includes(search);
      });
    }
    if (status !== 'all') {
      filtered = filtered.filter(function (f) { return f.status === status; });
    }
    FeatureAdoptionRender.renderRegistryTable(filtered);
  }

  // Feature detail
  function showFeatureDetail(featureId) {
    state.selectedFeatureId = featureId;
    var feature = state.features.find(function (f) { return f.featureId === featureId; });
    if (!feature) return;

    FeatureAdoptionRender.renderFeatureDetailHeader(feature);
    FeatureAdoptionBridge.sendToVelo('getFeatureStats', { featureId: featureId, timeRange: state.selectedTimeRange });
    FeatureAdoptionBridge.sendToVelo('getFeatureHealthScore', { featureId: featureId });

    var panel = document.getElementById('featureDetailPanel');
    panel.classList.add('open');
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function closeDetailPanel() {
    document.getElementById('featureDetailPanel').classList.remove('open');
    state.selectedFeatureId = null;
  }

  // At-risk
  function handleAtRiskFeatures(data) {
    var features = Array.isArray(data) ? data : data?.features || [];
    state.atRiskFeatures = features;
    FeatureAdoptionRender.renderAtRiskFeatures(features);
  }

  // Funnels
  function handleFunnelsList(data) {
    var funnels = Array.isArray(data) ? data : data?.funnels || [];
    state.funnels = funnels;
    FeatureAdoptionRender.renderFunnelsList(funnels);
  }

  function loadFunnelData() {
    var funnelId = document.getElementById('funnelSelector').value;
    if (!funnelId) return;

    document.getElementById('funnelContent').innerHTML =
      '<div class="text-center py-8 text-slate-500">Loading funnel data...</div>';

    var days = state.selectedTimeRange === '7d' ? 7 : state.selectedTimeRange === '90d' ? 90 : 30;
    var end = new Date();
    var start = new Date();
    start.setDate(start.getDate() - days);

    FeatureAdoptionBridge.sendToVelo('getFunnelConversion', {
      funnelId: funnelId,
      timeRange: { start: start.toISOString(), end: end.toISOString() }
    });
  }

  // Register feature
  function showRegisterModal() {
    document.getElementById('registerModal').classList.remove('hidden');
  }

  function closeRegisterModal() {
    document.getElementById('registerModal').classList.add('hidden');
    document.getElementById('regError').classList.add('hidden');
  }

  function submitRegisterFeature() {
    var featureId = document.getElementById('regFeatureId').value.trim();
    var displayName = document.getElementById('regDisplayName').value.trim();
    var category = document.getElementById('regCategory').value;
    var status = document.getElementById('regStatus').value;
    var expectedUsers = parseInt(document.getElementById('regExpectedUsers').value) || 50;

    if (!featureId || !displayName) {
      var err = document.getElementById('regError');
      err.textContent = 'Feature ID and Display Name are required';
      err.classList.remove('hidden');
      return;
    }

    FeatureAdoptionBridge.sendToVelo('registerFeature', {
      featureData: { featureId: featureId, displayName: displayName, category: category, status: status, expectedUsers: expectedUsers }
    });
  }

  function handleRegisterResult(data) {
    if (data?.success) {
      closeRegisterModal();
      refreshAll();
    } else {
      var err = document.getElementById('regError');
      err.textContent = data?.error || 'Registration failed';
      err.classList.remove('hidden');
    }
  }

  // Status change
  function changeFeatureStatus(featureId) {
    var feature = state.features.find(function (f) { return f.featureId === featureId; });
    var currentStatus = feature?.status || 'active';
    var newStatus = prompt('Change status for "' + featureId + '"\nCurrent: ' + currentStatus + '\nOptions: beta, active, deprecated, sunset');
    if (!newStatus || !['beta', 'active', 'deprecated', 'sunset'].includes(newStatus)) return;
    FeatureAdoptionBridge.sendToVelo('updateFeatureStatus', { featureId: featureId, status: newStatus, reason: 'Admin dashboard update' });
  }

  function handleStatusUpdateResult(data) {
    if (data?.success) {
      refreshAll();
    }
  }

  // Expose globals for onclick handlers
  function exposeGlobals() {
    window.setTimeRange = setTimeRange;
    window.refreshAll = refreshAll;
    window.switchTab = switchTab;
    window.sortFeatures = sortFeatures;
    window.filterRegistry = filterRegistry;
    window.showRegisterModal = showRegisterModal;
    window.closeRegisterModal = closeRegisterModal;
    window.submitRegisterFeature = submitRegisterFeature;
    window.closeDetailPanel = closeDetailPanel;
    window.loadFunnelData = loadFunnelData;
  }

  return {
    init: init,
    showFeatureDetail: showFeatureDetail,
    changeFeatureStatus: changeFeatureStatus,
    exposeGlobals: exposeGlobals
  };
})();
