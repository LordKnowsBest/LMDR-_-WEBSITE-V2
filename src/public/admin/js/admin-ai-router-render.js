/* =========================================
   ADMIN AI ROUTER — Render Module
   Depends on: AiRouterConfig
   All DOM rendering / display functions
   ========================================= */
var AiRouterRender = (function () {
  'use strict';

  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getProviderIcon(providerId) {
    return AiRouterConfig.PROVIDER_ICONS[providerId] || AiRouterConfig.DEFAULT_ICON;
  }

  function formatTokens(tokens) {
    if (tokens >= 1000000) return (tokens / 1000000).toFixed(1) + 'M';
    if (tokens >= 1000) return (tokens / 1000).toFixed(1) + 'K';
    return tokens.toString();
  }

  function showToast(message, type) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + (type || 'success') + ' show';
    setTimeout(function () { toast.classList.remove('show'); }, 3000);
  }

  function renderFunctions(config, providers, selectedCategory) {
    var container = document.getElementById('functionsList');
    var filteredConfig = Object.entries(config).filter(function (entry) {
      if (selectedCategory === 'all') return true;
      return entry[1].category === selectedCategory;
    });

    if (filteredConfig.length === 0) {
      container.innerHTML =
        '<div class="glass-card p-8 text-center">' +
          '<i class="fas fa-cogs text-4xl text-slate-600 mb-3"></i>' +
          '<p class="text-slate-400">No functions in this category</p>' +
        '</div>';
      return;
    }

    container.innerHTML = filteredConfig.map(function (entry) {
      var funcId = entry[0];
      var func = entry[1];
      var provider = providers[func.provider] || { name: func.provider };
      var providerClass = 'provider-' + func.provider;

      return (
        '<div class="function-card glass-card p-4" data-function="' + funcId + '">' +
          '<div class="flex items-start justify-between mb-3">' +
            '<div class="flex-1">' +
              '<div class="flex items-center gap-2 mb-1">' +
                '<h3 class="font-semibold text-white">' + escapeHtml(func.name) + '</h3>' +
                '<span class="px-2 py-0.5 rounded text-xs category-' + func.category + '">' + func.category + '</span>' +
                (func.isCustomized ? '<span class="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">Customized</span>' : '') +
              '</div>' +
              '<p class="text-sm text-slate-400">' + escapeHtml(func.description) + '</p>' +
            '</div>' +
            '<button class="touch-target p-2 text-slate-400 hover:text-white" onclick="AiRouterLogic.openConfigModal(\'' + funcId + '\')">' +
              '<i class="fas fa-cog"></i>' +
            '</button>' +
          '</div>' +
          '<div class="flex items-center justify-between">' +
            '<div class="flex items-center gap-3">' +
              '<span class="provider-badge ' + providerClass + '">' +
                getProviderIcon(func.provider) +
                escapeHtml(provider.name || func.provider) +
              '</span>' +
              '<span class="text-sm text-slate-500">' + escapeHtml(func.model) + '</span>' +
            '</div>' +
            '<div class="flex items-center gap-2">' +
              '<span class="text-xs text-slate-500">Priority: ' + func.priority + '</span>' +
            '</div>' +
          '</div>' +
          (func.fallbackProvider
            ? '<div class="mt-3 pt-3 border-t border-slate-700 flex items-center gap-2 text-sm text-slate-400">' +
                '<i class="fas fa-shield-alt text-xs"></i>' +
                'Fallback: ' + escapeHtml(func.fallbackProvider) + ' / ' + escapeHtml(func.fallbackModel || 'default') +
              '</div>'
            : '') +
        '</div>'
      );
    }).join('');
  }

  function renderProviders(providers) {
    var container = document.getElementById('providersList');

    container.innerHTML = Object.entries(providers).map(function (entry) {
      var id = entry[0];
      var provider = entry[1];
      var statusClass = provider.configured ? 'status-healthy' : 'status-not_configured';
      var statusIcon = provider.configured ? 'check-circle' : 'exclamation-circle';
      var statusText = provider.configured ? 'Configured' : 'Not Configured';

      return (
        '<div class="glass-card p-4 provider-card" data-provider="' + id + '">' +
          '<div class="flex items-start justify-between mb-4">' +
            '<div class="flex items-center gap-3">' +
              '<div class="w-10 h-10 rounded-lg flex items-center justify-center text-white provider-' + id + '">' +
                getProviderIcon(id) +
              '</div>' +
              '<div>' +
                '<h3 class="font-semibold text-white">' + escapeHtml(provider.name) + '</h3>' +
                '<p class="text-xs ' + statusClass + '">' +
                  '<i class="fas fa-' + statusIcon + ' mr-1"></i>' + statusText +
                '</p>' +
              '</div>' +
            '</div>' +
            '<button class="touch-target px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm" onclick="AiRouterLogic.testProvider(\'' + id + '\')">' +
              '<i class="fas fa-vial mr-1"></i>Test' +
            '</button>' +
          '</div>' +
          '<p class="text-sm text-slate-400 mb-4">' + escapeHtml(provider.description) + '</p>' +
          '<div class="space-y-2 text-sm">' +
            '<div class="flex justify-between"><span class="text-slate-500">Latency</span><span class="text-slate-300">' + ((provider.characteristics && provider.characteristics.latency) || '-') + '</span></div>' +
            '<div class="flex justify-between"><span class="text-slate-500">Cost Tier</span><span class="text-slate-300">' + ((provider.characteristics && provider.characteristics.costTier) || '-') + '</span></div>' +
            '<div class="flex justify-between"><span class="text-slate-500">Models</span><span class="text-slate-300">' + ((provider.models && provider.models.length) || 0) + '</span></div>' +
          '</div>' +
          '<div class="mt-4 pt-4 border-t border-slate-700">' +
            '<p class="text-xs text-slate-500 mb-2">Capabilities</p>' +
            '<div class="flex flex-wrap gap-1">' +
              ((provider.capabilities || []).slice(0, 5).map(function (cap) {
                return '<span class="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">' + cap + '</span>';
              }).join('')) +
            '</div>' +
          '</div>' +
          (!provider.configured
            ? '<div class="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">' +
                '<p class="text-xs text-amber-400">' +
                  '<i class="fas fa-key mr-1"></i>' +
                  'Set secret: <code class="bg-slate-800 px-1 rounded">' + provider.apiKeySecret + '</code>' +
                '</p>' +
              '</div>'
            : '') +
          '<div id="testResult-' + id + '" class="hidden mt-4 p-3 rounded-lg text-sm"></div>' +
        '</div>'
      );
    }).join('');
  }

  function renderUsageStats(stats, config, providers) {
    document.getElementById('statTotalCalls').textContent = stats.totalCalls.toLocaleString();
    document.getElementById('statTotalTokens').textContent = formatTokens(stats.totalTokens);
    document.getElementById('statAvgLatency').textContent = stats.avgLatency + 'ms';
    document.getElementById('statErrorRate').textContent = stats.errorRate + '%';

    // Provider usage
    var providerContainer = document.getElementById('providerUsageList');
    var providerEntries = Object.entries(stats.byProvider);

    if (providerEntries.length === 0) {
      providerContainer.innerHTML = '<p class="text-slate-500 text-sm">No usage data yet</p>';
    } else {
      var maxCalls = Math.max.apply(null, providerEntries.map(function (e) { return e[1].calls; }));
      providerContainer.innerHTML = providerEntries.map(function (entry) {
        var id = entry[0];
        var data = entry[1];
        var width = maxCalls > 0 ? (data.calls / maxCalls * 100) : 0;
        var provider = providers[id] || { name: id };

        return (
          '<div class="flex items-center gap-4">' +
            '<div class="w-32 flex items-center gap-2">' +
              '<span class="w-6 h-6 rounded flex items-center justify-center text-xs text-white provider-' + id + '">' +
                getProviderIcon(id) +
              '</span>' +
              '<span class="text-sm text-slate-300 truncate">' + escapeHtml(provider.name || id) + '</span>' +
            '</div>' +
            '<div class="flex-1 h-6 bg-slate-800 rounded overflow-hidden">' +
              '<div class="h-full provider-' + id + '" style="width: ' + width + '%"></div>' +
            '</div>' +
            '<div class="w-20 text-right text-sm text-slate-400">' + data.calls.toLocaleString() + '</div>' +
          '</div>'
        );
      }).join('');
    }

    // Function usage
    var functionContainer = document.getElementById('functionUsageList');
    var functionEntries = Object.entries(stats.byFunction);

    if (functionEntries.length === 0) {
      functionContainer.innerHTML = '<p class="text-slate-500 text-sm">No usage data yet</p>';
    } else {
      var maxFuncCalls = Math.max.apply(null, functionEntries.map(function (e) { return e[1].calls; }));
      functionContainer.innerHTML = functionEntries.map(function (entry) {
        var id = entry[0];
        var data = entry[1];
        var width = maxFuncCalls > 0 ? (data.calls / maxFuncCalls * 100) : 0;
        var func = config[id] || { name: id };

        return (
          '<div class="flex items-center gap-4">' +
            '<div class="w-40 text-sm text-slate-300 truncate">' + escapeHtml(func.name || id) + '</div>' +
            '<div class="flex-1 h-6 bg-slate-800 rounded overflow-hidden">' +
              '<div class="h-full bg-indigo-500" style="width: ' + width + '%"></div>' +
            '</div>' +
            '<div class="w-20 text-right text-sm text-slate-400">' + data.calls.toLocaleString() + '</div>' +
          '</div>'
        );
      }).join('');
    }
  }

  function updateProviderStatus(providerId) {
    var resultDiv = document.getElementById('testResult-' + providerId);
    if (resultDiv) {
      resultDiv.classList.remove('hidden');
      resultDiv.className = 'mt-4 p-3 rounded-lg text-sm bg-blue-500/10 border border-blue-500/30';
      resultDiv.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Testing...';
    }
  }

  function handleTestResult(result) {
    var resultDiv = document.getElementById('testResult-' + result.provider);
    if (!resultDiv) return;
    resultDiv.classList.remove('hidden');

    if (result.status === 'healthy') {
      resultDiv.className = 'mt-4 p-3 rounded-lg text-sm bg-green-500/10 border border-green-500/30 text-green-400';
      resultDiv.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Healthy (' + result.latencyMs + 'ms)';
    } else if (result.status === 'not_configured') {
      resultDiv.className = 'mt-4 p-3 rounded-lg text-sm bg-amber-500/10 border border-amber-500/30 text-amber-400';
      resultDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>' + result.message;
    } else {
      resultDiv.className = 'mt-4 p-3 rounded-lg text-sm bg-red-500/10 border border-red-500/30 text-red-400';
      resultDiv.innerHTML = '<i class="fas fa-times-circle mr-2"></i>' + result.message;
    }
  }

  function renderOptimizerConfig(optimizerConfig) {
    if (!optimizerConfig) return;

    var toggle = document.getElementById('optimizerToggle');
    if (optimizerConfig.enabled) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }

    var statusText = document.getElementById('optimizerStatusText');
    statusText.textContent = optimizerConfig.enabled ? 'Enabled' : 'Disabled';
    statusText.className = 'text-sm font-medium ' + (optimizerConfig.enabled ? 'text-emerald-400' : 'text-slate-400');

    document.getElementById('qualityThreshold').value = optimizerConfig.qualityThreshold || 0.80;
    document.getElementById('qualityThresholdValue').textContent = parseFloat(optimizerConfig.qualityThreshold || 0.80).toFixed(2);
    document.getElementById('maxCostInput').value = optimizerConfig.maxCostPerRequest || 0.10;
  }

  function renderExcludedProviders(providers, optimizerConfig) {
    var container = document.getElementById('excludedProvidersList');
    if (!container) return;

    var providerIds = Object.keys(providers);
    if (providerIds.length === 0) {
      container.innerHTML = '<p class="text-slate-500 text-sm">No providers loaded</p>';
      return;
    }

    container.innerHTML = providerIds.map(function (id) {
      var isExcluded = optimizerConfig.excludedProviders && optimizerConfig.excludedProviders.indexOf(id) !== -1;
      return (
        '<label class="flex items-center gap-3 cursor-pointer group">' +
          '<input type="checkbox" class="excluded-provider-checkbox w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500" data-provider="' + id + '"' + (isExcluded ? ' checked' : '') + '>' +
          '<span class="text-sm text-slate-300 group-hover:text-white transition-colors">' + providers[id].name + '</span>' +
        '</label>'
      );
    }).join('');
  }

  function renderSavingsReport(report) {
    if (!report) return;
    document.getElementById('statTotalSavings').textContent = '$' + (report.totalSavings || 0).toFixed(2);
    document.getElementById('statOptimizedRequests').textContent = (report.optimizedRequests || 0).toLocaleString();
    document.getElementById('statSavingsRate').textContent = Math.round((report.savingsRate || 0) * 100) + '%';
    document.getElementById('statAvgSavings').textContent = '$' + (report.avgSavingsPerRequest || 0).toFixed(3);
  }

  function renderProviderMetrics(metrics) {
    var container = document.getElementById('providerMetricsTable');
    if (!container) return;

    if (!metrics || metrics.length === 0) {
      container.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-slate-500 italic">No cost metrics available. Seed data in AI Provider Costs table.</td></tr>';
      return;
    }

    container.innerHTML = metrics.map(function (m) {
      var statusClass = m.isActive ? 'text-emerald-400' : 'text-slate-500';
      var statusIcon = m.isActive ? 'check-circle' : 'pause-circle';

      return (
        '<tr class="border-b border-slate-800/50 hover:bg-white/5 transition-colors group">' +
          '<td class="py-3 px-2">' +
            '<div class="font-medium text-slate-200">' + m.providerId + '</div>' +
            '<div class="text-[10px] text-slate-500 uppercase tracking-tighter">' + m.modelId + '</div>' +
          '</td>' +
          '<td class="py-3 px-2 text-slate-300 font-mono text-xs">$' + (m.costInput || 0).toFixed(4) + '</td>' +
          '<td class="py-3 px-2 text-slate-300 font-mono text-xs">$' + (m.costOutput || 0).toFixed(4) + '</td>' +
          '<td class="py-3 px-2">' +
            '<div class="flex items-center gap-2">' +
              '<div class="flex-1 h-1.5 w-12 bg-slate-800 rounded-full overflow-hidden">' +
                '<div class="h-full bg-indigo-500" style="width: ' + ((m.qualityScore || 0) * 100) + '%"></div>' +
              '</div>' +
              '<span class="text-xs font-bold text-slate-400">' + (m.qualityScore || 0).toFixed(2) + '</span>' +
            '</div>' +
          '</td>' +
          '<td class="py-3 px-2">' +
            '<span class="' + statusClass + ' text-xs font-bold uppercase tracking-widest">' +
              '<i class="fas fa-' + statusIcon + ' mr-1"></i>' + (m.isActive ? 'Active' : 'Paused') +
            '</span>' +
          '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function populateModelSelect(models, currentModel) {
    var select = document.getElementById('configModel');
    select.innerHTML = '<option value="">Select model...</option>' +
      models.map(function (m) {
        return '<option value="' + m.id + '" data-speed="' + m.speed + '" data-quality="' + m.quality + '"' +
          (m.id === currentModel ? ' selected' : '') + '>' +
          m.name + ' (' + m.tier + ')' +
        '</option>';
      }).join('');
  }

  function updateModelInfo() {
    var select = document.getElementById('configModel');
    var option = select.options[select.selectedIndex];
    var infoDiv = document.getElementById('modelInfo');

    if (option && option.value) {
      var speed = option.dataset.speed;
      var quality = option.dataset.quality;

      document.getElementById('modelSpeed').textContent = speed;
      document.getElementById('modelSpeed').className = 'ml-2 font-medium speed-' + speed;
      document.getElementById('modelQuality').textContent = quality;
      document.getElementById('modelQuality').className = 'ml-2 font-medium quality-' + quality;
      infoDiv.classList.remove('hidden');
    } else {
      infoDiv.classList.add('hidden');
    }
  }

  return {
    escapeHtml: escapeHtml,
    getProviderIcon: getProviderIcon,
    formatTokens: formatTokens,
    showToast: showToast,
    renderFunctions: renderFunctions,
    renderProviders: renderProviders,
    renderUsageStats: renderUsageStats,
    updateProviderStatus: updateProviderStatus,
    handleTestResult: handleTestResult,
    renderOptimizerConfig: renderOptimizerConfig,
    renderExcludedProviders: renderExcludedProviders,
    renderSavingsReport: renderSavingsReport,
    renderProviderMetrics: renderProviderMetrics,
    populateModelSelect: populateModelSelect,
    updateModelInfo: updateModelInfo
  };
})();
