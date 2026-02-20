/* =========================================
   ADMIN PLATFORM CONFIG — Logic Module
   Depends on: PlatformConfigConfig, PlatformConfigBridge, PlatformConfigRender
   State management, event handlers, message routing
   ========================================= */
var PlatformConfigLogic = (function () {
  'use strict';

  var state = {
    currentTab: 'carrier-weights',
    carrierWeights: {},
    driverWeights: {},
    systemSettings: {},
    tierLimits: {},
    uiSettings: {},
    jobs: []
  };

  function init() {
    setupEventListeners();
    setupMessageHandlers();
  }

  function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.dataset.tab); });
    });

    document.getElementById('saveAllBtn').addEventListener('click', saveAll);

    document.getElementById('resetAllBtn').addEventListener('click', function () {
      if (confirm('Are you sure you want to reset all settings to defaults?')) {
        PlatformConfigBridge.resetSettings();
      }
    });

    document.getElementById('maintenanceToggle').addEventListener('click', function () {
      var active = !state.systemSettings.maintenance_mode;
      PlatformConfigBridge.toggleMaintenance(active);
    });
  }

  function setupMessageHandlers() {
    PlatformConfigBridge.listen({
      init: function () {
        PlatformConfigBridge.loadInitialData();
      },
      carrierWeightsLoaded: function (data) {
        state.carrierWeights = data.payload;
        PlatformConfigRender.renderWeightSliders('carrier', state.carrierWeights, PlatformConfigConfig.CARRIER_WEIGHT_LABELS);
      },
      driverWeightsLoaded: function (data) {
        state.driverWeights = data.payload;
        PlatformConfigRender.renderWeightSliders('driver', state.driverWeights, PlatformConfigConfig.DRIVER_WEIGHT_LABELS);
      },
      systemSettingsLoaded: function (data) {
        state.systemSettings = data.payload;
        PlatformConfigRender.populateSystemSettings(data.payload);
      },
      tierLimitsLoaded: function (data) {
        state.tierLimits = data.payload;
        PlatformConfigRender.renderTierLimits(data.payload);
      },
      uiSettingsLoaded: function (data) {
        state.uiSettings = data.payload;
        PlatformConfigRender.populateUISettings(data.payload);
      },
      jobsLoaded: function (data) {
        state.jobs = data.payload;
        PlatformConfigRender.renderJobs(data.payload);
      },
      jobTriggered: function () {
        PlatformConfigRender.showToast('Job triggered successfully', 'success');
        PlatformConfigBridge.getJobs();
      },
      settingsSaved: function () {
        PlatformConfigRender.setLoading(false);
        PlatformConfigRender.showToast('Settings saved successfully', 'success');
      },
      actionError: function (data) {
        PlatformConfigRender.setLoading(false);
        PlatformConfigRender.showToast(data.message || 'An error occurred', 'error');
      }
    });
  }

  function switchTab(tab) {
    state.currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(function (content) {
      content.classList.add('hidden');
    });
    document.getElementById(tab + 'Tab').classList.remove('hidden');
  }

  function triggerJob(id) {
    if (confirm('Trigger manual run for ' + id + '?')) {
      PlatformConfigBridge.triggerJob(id);
    }
  }

  function saveAll() {
    PlatformConfigRender.setLoading(true);

    var newCarrierWeights = {};
    document.querySelectorAll('.carrier-weight-slider').forEach(function (s) {
      newCarrierWeights[s.dataset.key] = parseInt(s.value);
    });

    var newDriverWeights = {};
    document.querySelectorAll('.driver-weight-slider').forEach(function (s) {
      newDriverWeights[s.dataset.key] = parseInt(s.value);
    });

    var newSystemSettings = {
      cache_ttl_minutes: parseInt(document.getElementById('cache_ttl_minutes').value),
      enrichment_batch_size: parseInt(document.getElementById('enrichment_batch_size').value),
      email_batch_size: parseInt(document.getElementById('email_batch_size').value),
      fmcsa_refresh_days: parseInt(document.getElementById('fmcsa_refresh_days').value),
      api_rate_limit_per_second: parseInt(document.getElementById('api_rate_limit_per_second').value),
      maintenance_mode: state.systemSettings.maintenance_mode
    };

    var newTierLimits = {};
    document.querySelectorAll('.tier-input').forEach(function (input) {
      var tier = input.dataset.tier;
      if (!newTierLimits[tier]) newTierLimits[tier] = {};
      newTierLimits[tier][input.dataset.field] = parseInt(input.value);
    });

    var newUISettings = {
      announcement_banner: {
        enabled: document.getElementById('banner_enabled').checked,
        text: document.getElementById('banner_text').value,
        link: document.getElementById('banner_link').value,
        type: document.getElementById('banner_type').value
      }
    };

    PlatformConfigBridge.saveAllSettings({
      carrierWeights: newCarrierWeights,
      driverWeights: newDriverWeights,
      systemSettings: newSystemSettings,
      tierLimits: newTierLimits,
      uiSettings: newUISettings
    });
  }

  return {
    init: init,
    triggerJob: triggerJob
  };
})();
