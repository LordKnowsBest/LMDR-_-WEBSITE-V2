/* =========================================
   ADMIN AI ROUTER — Logic Module
   Depends on: AiRouterConfig, AiRouterBridge, AiRouterRender
   State management, event handlers, initialization
   ========================================= */
var AiRouterLogic = (function () {
  'use strict';

  // --- State ---
  var currentTab = 'functions';
  var providers = {};
  var config = {};
  var optimizerConfig = {};
  var selectedCategory = 'all';
  var editingFunctionId = null;

  // --- Theme ---
  function initTheme() {
    var saved = localStorage.getItem(AiRouterConfig.THEME_KEY);
    var theme = saved || 'dark';
    applyTheme(theme);
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    updateThemeIcon(theme);
  }

  function toggleTheme() {
    var current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    var newTheme = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(AiRouterConfig.THEME_KEY, newTheme);
    applyTheme(newTheme);
  }

  function updateThemeIcon(theme) {
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }
  }

  // --- Tab switching ---
  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(function (content) {
      content.classList.add('hidden');
    });
    document.getElementById(tab + 'Tab').classList.remove('hidden');
  }

  // --- Data loading ---
  function loadInitialData() {
    AiRouterBridge.getProviders();
    AiRouterBridge.getConfig();
    AiRouterBridge.getUsageStats('week');
    loadOptimizerData();
  }

  function loadOptimizerData() {
    AiRouterBridge.getOptimizerConfig();
    AiRouterBridge.getSavingsReport('month');
    AiRouterBridge.getProviderMetrics();
  }

  // --- Config Modal ---
  function openConfigModal(functionId) {
    editingFunctionId = functionId;
    var func = config[functionId];

    document.getElementById('modalTitle').textContent = 'Configure: ' + func.name;
    document.getElementById('configFunctionId').value = functionId;

    var providerSelect = document.getElementById('configProvider');
    providerSelect.innerHTML = '<option value="">Select provider...</option>' +
      Object.entries(providers).map(function (entry) {
        return '<option value="' + entry[0] + '"' + (entry[0] === func.provider ? ' selected' : '') + '>' + entry[1].name + '</option>';
      }).join('');

    if (func.provider) {
      AiRouterBridge.getModels(func.provider);
    }

    var fallbackSelect = document.getElementById('configFallbackProvider');
    fallbackSelect.innerHTML = '<option value="">No fallback</option>' +
      Object.entries(providers).map(function (entry) {
        return '<option value="' + entry[0] + '"' + (entry[0] === func.fallbackProvider ? ' selected' : '') + '>' + entry[1].name + '</option>';
      }).join('');

    if (func.fallbackProvider) {
      document.getElementById('fallbackModelSection').classList.remove('hidden');
      var provider = providers[func.fallbackProvider];
      if (provider) {
        document.getElementById('configFallbackModel').innerHTML =
          '<option value="">Select model...</option>' +
          provider.models.map(function (m) {
            return '<option value="' + m.id + '"' + (m.id === func.fallbackModel ? ' selected' : '') + '>' + m.name + '</option>';
          }).join('');
      }
    } else {
      document.getElementById('fallbackModelSection').classList.add('hidden');
    }

    document.getElementById('modalBackdrop').classList.add('open');
    document.getElementById('configModal').classList.add('open');
  }

  function closeModal() {
    document.getElementById('modalBackdrop').classList.remove('open');
    document.getElementById('configModal').classList.remove('open');
    editingFunctionId = null;
  }

  function saveConfiguration() {
    var functionId = document.getElementById('configFunctionId').value;
    var newConfig = {
      provider: document.getElementById('configProvider').value,
      model: document.getElementById('configModel').value,
      fallbackProvider: document.getElementById('configFallbackProvider').value || null,
      fallbackModel: document.getElementById('configFallbackModel').value || null,
      enabled: true
    };

    if (!newConfig.provider || !newConfig.model) {
      AiRouterRender.showToast('Please select a provider and model', 'error');
      return;
    }

    AiRouterBridge.updateConfig(functionId, newConfig);
  }

  function testProvider(providerId) {
    AiRouterBridge.testProvider(providerId);
  }

  function saveOptimizerConfig() {
    var excludedCheckboxes = document.querySelectorAll('.excluded-provider-checkbox:checked');
    var excludedProviders = Array.from(excludedCheckboxes).map(function (cb) { return cb.dataset.provider; });

    var newConfig = {
      enabled: document.getElementById('optimizerToggle').classList.contains('active'),
      qualityThreshold: parseFloat(document.getElementById('qualityThreshold').value),
      maxCostPerRequest: parseFloat(document.getElementById('maxCostInput').value),
      excludedProviders: excludedProviders
    };

    AiRouterBridge.updateOptimizerConfig(newConfig);
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.dataset.tab); });
    });

    // Category filter
    document.querySelectorAll('.category-filter').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectedCategory = btn.dataset.category;
        document.querySelectorAll('.category-filter').forEach(function (b) {
          b.classList.remove('bg-slate-700', 'text-white');
          b.classList.add('bg-transparent');
        });
        btn.classList.add('bg-slate-700', 'text-white');
        AiRouterRender.renderFunctions(config, providers, selectedCategory);
      });
    });

    // Test all providers
    document.getElementById('testAllBtn').addEventListener('click', function () {
      AiRouterBridge.testAllProviders();
    });

    // Modal
    document.getElementById('modalBackdrop').addEventListener('click', closeModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);

    // Provider select change
    document.getElementById('configProvider').addEventListener('change', function (e) {
      if (e.target.value) {
        AiRouterBridge.getModels(e.target.value);
      }
    });

    // Model select change
    document.getElementById('configModel').addEventListener('change', function () {
      AiRouterRender.updateModelInfo();
    });

    // Fallback provider change
    document.getElementById('configFallbackProvider').addEventListener('change', function (e) {
      var section = document.getElementById('fallbackModelSection');
      if (e.target.value) {
        section.classList.remove('hidden');
        var provider = providers[e.target.value];
        if (provider) {
          var select = document.getElementById('configFallbackModel');
          select.innerHTML = '<option value="">Select model...</option>' +
            provider.models.map(function (m) { return '<option value="' + m.id + '">' + m.name + '</option>'; }).join('');
        }
      } else {
        section.classList.add('hidden');
      }
    });

    // Config form submit
    document.getElementById('configForm').addEventListener('submit', function (e) {
      e.preventDefault();
      saveConfiguration();
    });

    // Reset config
    document.getElementById('resetConfigBtn').addEventListener('click', function () {
      if (editingFunctionId) {
        AiRouterBridge.resetConfig(editingFunctionId);
      }
    });

    // Usage period buttons
    document.querySelectorAll('.usage-period-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.usage-period-btn').forEach(function (b) {
          b.classList.remove('bg-indigo-600', 'text-white');
          b.classList.add('bg-slate-700', 'text-slate-300');
        });
        btn.classList.remove('bg-slate-700', 'text-slate-300');
        btn.classList.add('bg-indigo-600', 'text-white');
        AiRouterBridge.getUsageStats(btn.dataset.period);
      });
    });

    // Optimizer toggle
    document.getElementById('optimizerToggle').addEventListener('click', function () {
      var toggle = document.getElementById('optimizerToggle');
      toggle.classList.toggle('active');
      var isActive = toggle.classList.contains('active');
      var text = document.getElementById('optimizerStatusText');
      text.textContent = isActive ? 'Enabled' : 'Disabled';
      text.className = 'text-sm font-medium ' + (isActive ? 'text-emerald-400' : 'text-slate-400');
    });

    // Quality threshold slider
    document.getElementById('qualityThreshold').addEventListener('input', function (e) {
      document.getElementById('qualityThresholdValue').textContent = parseFloat(e.target.value).toFixed(2);
    });

    // Save optimizer config
    document.getElementById('saveOptimizerConfigBtn').addEventListener('click', saveOptimizerConfig);

    // Refresh metrics
    document.getElementById('refreshMetricsBtn').addEventListener('click', loadOptimizerData);
  }

  // --- Message handler ---
  function setupMessageListener() {
    AiRouterBridge.listen({
      init: function () {
        loadInitialData();
      },
      configLoaded: function (msg) {
        config = msg.payload;
        AiRouterRender.renderFunctions(config, providers, selectedCategory);
      },
      providersLoaded: function (msg) {
        providers = msg.payload;
        AiRouterRender.renderProviders(providers);
      },
      functionsLoaded: function () {
        // functions meta stored if needed
      },
      modelsLoaded: function (msg) {
        var func = config[editingFunctionId];
        AiRouterRender.populateModelSelect(msg.payload.models, func ? func.model : null);
        AiRouterRender.updateModelInfo();
      },
      usageStatsLoaded: function (msg) {
        AiRouterRender.renderUsageStats(msg.payload, config, providers);
      },
      configUpdated: function () {
        AiRouterRender.showToast('Configuration saved successfully', 'success');
        closeModal();
        AiRouterBridge.getConfig();
      },
      configReset: function () {
        AiRouterRender.showToast('Configuration reset to default', 'success');
        closeModal();
        AiRouterBridge.getConfig();
      },
      testingProvider: function (msg) {
        AiRouterRender.updateProviderStatus(msg.payload.providerId);
      },
      providerTestResult: function (msg) {
        AiRouterRender.handleTestResult(msg.payload);
      },
      testingAllProviders: function () {
        AiRouterRender.showToast('Testing all providers...', 'success');
      },
      allProvidersTestResult: function (msg) {
        Object.entries(msg.payload).forEach(function (entry) {
          AiRouterRender.handleTestResult({ provider: entry[0], status: entry[1].status, latencyMs: entry[1].latencyMs, message: entry[1].message });
        });
        AiRouterRender.showToast('All provider tests complete', 'success');
      },
      actionError: function (msg) {
        AiRouterRender.showToast(msg.message, 'error');
      },
      optimizerConfigLoaded: function (msg) {
        optimizerConfig = msg.payload;
        AiRouterRender.renderOptimizerConfig(optimizerConfig);
        AiRouterRender.renderExcludedProviders(providers, optimizerConfig);
      },
      optimizerConfigUpdated: function () {
        AiRouterRender.showToast('Optimizer config saved', 'success');
      },
      savingsReportLoaded: function (msg) {
        AiRouterRender.renderSavingsReport(msg.payload);
      },
      providerMetricsLoaded: function (msg) {
        AiRouterRender.renderProviderMetrics(msg.payload);
      }
    });
  }

  // --- Init ---
  function init() {
    initTheme();
    setupEventListeners();
    setupMessageListener();
  }

  // --- Expose globals for onclick handlers in HTML ---
  function exposeGlobals() {
    window.toggleTheme = toggleTheme;
    window.AiRouterLogic = {
      openConfigModal: openConfigModal,
      testProvider: testProvider
    };
  }

  return {
    init: init,
    exposeGlobals: exposeGlobals,
    openConfigModal: openConfigModal,
    testProvider: testProvider
  };
})();
