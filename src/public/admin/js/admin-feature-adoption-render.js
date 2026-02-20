/* =========================================
   ADMIN FEATURE ADOPTION — Render Module
   Depends on: FeatureAdoptionConfig
   DOM rendering functions
   ========================================= */
var FeatureAdoptionRender = (function () {
  'use strict';

  function getStatusBadge(status) {
    var colors = FeatureAdoptionConfig.STATUS_COLORS;
    return '<span class="text-xs px-2 py-0.5 rounded ' + (colors[status] || colors.active) + '">' + (status || 'active') + '</span>';
  }

  function formatDuration(ms) {
    if (!ms || ms === 0) return '0s';
    if (ms < 1000) return ms + 'ms';
    if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
    return (ms / 60000).toFixed(1) + 'm';
  }

  function renderSummaryCards(summary) {
    document.getElementById('totalFeatures').textContent = summary.total || 0;
    document.getElementById('totalFeaturesDetail').textContent =
      (summary.byStatus?.active || 0) + ' active, ' + (summary.byStatus?.beta || 0) + ' beta';
    document.getElementById('healthyCount').textContent = summary.byHealth?.healthy || 0;
    document.getElementById('warningCount').textContent = summary.byHealth?.warning || 0;
    document.getElementById('criticalCount').textContent = summary.byHealth?.critical || 0;
  }

  function renderLifecycleChart(byStatus, chartsRef) {
    var ctx = document.getElementById('lifecycleChart');
    if (chartsRef.lifecycle) chartsRef.lifecycle.destroy();

    chartsRef.lifecycle = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Active', 'Beta', 'Deprecated', 'Sunset'],
        datasets: [{
          data: [byStatus.active || 0, byStatus.beta || 0, byStatus.deprecated || 0, byStatus.sunset || 0],
          backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, font: { size: 11 } } } },
        cutout: '65%'
      }
    });
  }

  function renderHealthDistChart(features, chartsRef) {
    var ctx = document.getElementById('healthDistChart');
    if (chartsRef.healthDist) chartsRef.healthDist.destroy();

    var buckets = { '0-19': 0, '20-39': 0, '40-59': 0, '60-79': 0, '80-100': 0 };
    features.forEach(function (f) {
      var s = f.healthScore || 0;
      if (s < 20) buckets['0-19']++;
      else if (s < 40) buckets['20-39']++;
      else if (s < 60) buckets['40-59']++;
      else if (s < 80) buckets['60-79']++;
      else buckets['80-100']++;
    });

    chartsRef.healthDist = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(buckets),
        datasets: [{
          data: Object.values(buckets),
          backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981'],
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
          y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8', stepSize: 1, font: { size: 11 } } }
        }
      }
    });
  }

  function renderHealthGrid(features, onClickFeature) {
    var container = document.getElementById('healthGrid');
    if (!features.length) {
      container.innerHTML = '<div class="col-span-full text-center text-slate-500 py-8">No features registered yet</div>';
      return;
    }

    container.innerHTML = features.map(function (f) {
      var color = f.healthScore >= 70 ? 'emerald' : f.healthScore >= 40 ? 'amber' : 'red';
      var trendIcon = f.trend?.startsWith('+') ? 'trending_up' : f.trend?.startsWith('-') ? 'trending_down' : 'trending_flat';
      var trendColor = f.trend?.startsWith('+') ? 'text-emerald-400' : f.trend?.startsWith('-') ? 'text-red-400' : 'text-slate-400';
      var statusBadge = getStatusBadge(f.status);

      return '<div class="card p-4 cursor-pointer hover:bg-slate-800/50 transition-colors" onclick="FeatureAdoptionLogic.showFeatureDetail(\'' + f.featureId + '\')">' +
        '<div class="flex items-start justify-between mb-2">' +
          '<div class="text-sm font-medium text-white truncate pr-2">' + (f.displayName || f.featureId) + '</div>' +
          statusBadge +
        '</div>' +
        '<div class="flex items-center gap-2 mb-2">' +
          '<span class="text-2xl font-bold text-' + color + '-400">' + f.healthScore + '</span>' +
          '<span class="material-symbols-outlined text-sm ' + trendColor + '">' + trendIcon + '</span>' +
          '<span class="text-xs ' + trendColor + '">' + (f.trend || '0%') + '</span>' +
        '</div>' +
        '<div class="health-bar"><div class="health-bar-fill bg-' + color + '-400" style="width:' + f.healthScore + '%"></div></div>' +
        '<div class="flex justify-between mt-2 text-xs text-slate-500">' +
          '<span>' + (f.last30DaysUsers || 0) + ' users</span>' +
          '<span>' + (f.category || 'uncategorized') + '</span>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderRegistryTable(features) {
    var tbody = document.getElementById('registryTableBody');
    if (!features.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-500">No features registered</td></tr>';
      return;
    }

    tbody.innerHTML = features.map(function (f) {
      var color = f.healthScore >= 70 ? 'emerald' : f.healthScore >= 40 ? 'amber' : 'red';
      var trendColor = f.trend?.startsWith('+') ? 'text-emerald-400' : f.trend?.startsWith('-') ? 'text-red-400' : 'text-slate-400';

      return '<tr class="border-b border-slate-800 hover:bg-slate-800/30 cursor-pointer" onclick="FeatureAdoptionLogic.showFeatureDetail(\'' + f.featureId + '\')">' +
        '<td class="p-3"><div class="font-medium text-white">' + (f.displayName || f.featureId) + '</div><div class="text-xs text-slate-500">' + f.featureId + '</div></td>' +
        '<td class="p-3">' + getStatusBadge(f.status) + '</td>' +
        '<td class="p-3 text-slate-400">' + (f.category || '--') + '</td>' +
        '<td class="p-3"><span class="font-bold text-' + color + '-400">' + f.healthScore + '</span></td>' +
        '<td class="p-3 text-slate-300">' + (f.last30DaysUsers || 0) + '</td>' +
        '<td class="p-3 ' + trendColor + '">' + (f.trend || '0%') + '</td>' +
        '<td class="p-3"><button onclick="event.stopPropagation(); FeatureAdoptionLogic.changeFeatureStatus(\'' + f.featureId + '\')" class="text-xs text-slate-400 hover:text-white"><span class="material-symbols-outlined text-sm">edit</span></button></td>' +
      '</tr>';
    }).join('');
  }

  function renderAtRiskFeatures(features) {
    var list = document.getElementById('atRiskList');
    if (!features.length) {
      list.innerHTML = '<div class="card p-6 text-center">' +
        '<span class="material-symbols-outlined text-4xl text-emerald-400 mb-2">check_circle</span>' +
        '<p class="text-slate-300">No at-risk features detected</p>' +
        '<p class="text-xs text-slate-500 mt-1">All features are performing within acceptable thresholds</p>' +
      '</div>';
      return;
    }

    list.innerHTML = features.map(function (f) {
      var riskFactors = f.riskFactors || [];
      return '<div class="card p-4 border-l-4 border-red-400 cursor-pointer hover:bg-slate-800/50" onclick="FeatureAdoptionLogic.showFeatureDetail(\'' + f.featureId + '\')">' +
        '<div class="flex items-start justify-between">' +
          '<div><div class="font-medium text-white">' + (f.displayName || f.featureId) + '</div>' +
          '<div class="text-xs text-slate-500 mt-1">' + (f.recommendation || 'Needs investigation') + '</div></div>' +
          '<span class="text-2xl font-bold text-red-400">' + (f.healthScore || 0) + '</span>' +
        '</div>' +
        (riskFactors.length ? '<div class="flex flex-wrap gap-1 mt-2">' +
          riskFactors.map(function (r) { return '<span class="text-xs bg-red-900/30 text-red-300 px-2 py-0.5 rounded">' + r + '</span>'; }).join('') +
        '</div>' : '') +
      '</div>';
    }).join('');
  }

  function renderFunnelsList(funnels) {
    var selector = document.getElementById('funnelSelector');
    selector.innerHTML = '<option value="">Select a funnel...</option>' +
      funnels.map(function (f) { return '<option value="' + f.funnelId + '">' + (f.displayName || f.funnelId) + '</option>'; }).join('');
  }

  function renderFunnelConversion(data) {
    var container = document.getElementById('funnelContent');
    if (!data || data.error) {
      container.innerHTML = '<div class="text-center py-8 text-red-400">' + (data?.error || 'Failed to load funnel') + '</div>';
      return;
    }

    var steps = data.steps || [];
    var dropoff = data.dropoffAnalysis?.biggestDropoff;

    var html =
      '<div class="mb-4">' +
        '<div class="text-sm text-white font-medium">' + (data.displayName || data.funnelId) + '</div>' +
        '<div class="text-xs text-slate-500">' + (data.timeRange?.start || '') + ' to ' + (data.timeRange?.end || '') + '</div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3 mb-4">' +
        '<div class="bg-slate-800/50 rounded-lg p-3 text-center">' +
          '<div class="text-xs text-slate-400">Total Entered</div>' +
          '<div class="text-xl font-bold text-white">' + (data.totalEntered || 0) + '</div>' +
        '</div>' +
        '<div class="bg-slate-800/50 rounded-lg p-3 text-center">' +
          '<div class="text-xs text-slate-400">Overall Conversion</div>' +
          '<div class="text-xl font-bold text-emerald-400">' + (data.overallConversionRate || 0) + '%</div>' +
        '</div>' +
      '</div>' +
      '<div class="flex items-center gap-2 overflow-x-auto pb-4">';

    steps.forEach(function (step) {
      var barHeight = Math.max(20, Math.round((step.completed / (steps[0]?.entered || 1)) * 100));
      var color = step.conversionRate >= 80 ? 'bg-emerald-500' : step.conversionRate >= 50 ? 'bg-amber-500' : 'bg-red-500';
      html +=
        '<div class="funnel-step flex-shrink-0 text-center min-w-[120px]">' +
          '<div class="text-xs text-slate-400 mb-1 truncate">' + (step.displayName || step.featureId) + '</div>' +
          '<div class="mx-auto w-16 bg-slate-800 rounded-md overflow-hidden" style="height:100px">' +
            '<div class="' + color + ' w-full rounded-md transition-all" style="height:' + barHeight + '%; margin-top:' + (100 - barHeight) + '%"></div>' +
          '</div>' +
          '<div class="text-sm font-bold text-white mt-1">' + step.completed + '</div>' +
          '<div class="text-xs text-slate-500">' + step.conversionRate + '%</div>' +
        '</div>';
    });

    html += '</div>';

    if (dropoff) {
      html +=
        '<div class="mt-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg">' +
          '<div class="flex items-center gap-2 text-sm text-red-300">' +
            '<span class="material-symbols-outlined text-sm">warning</span>' +
            'Biggest drop-off at step ' + dropoff.step + ': ' + dropoff.lostUsers + ' users lost' +
          '</div>' +
        '</div>';
    }

    container.innerHTML = html;
  }

  function renderFeatureDetailHeader(feature) {
    var score = feature.healthScore || 0;
    var color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
    document.getElementById('detailFeatureName').textContent = feature.displayName || feature.featureId;
    document.getElementById('detailHealthScore').textContent = score;
    document.getElementById('detailHealthScore').style.color = color;
    var bar = document.getElementById('detailHealthBar');
    bar.style.width = score + '%';
    bar.style.backgroundColor = color;
  }

  function renderFeatureStats(data) {
    if (!data || data.error) return;
    var s = data.summary || data;
    document.getElementById('detailUsers').textContent = s.uniqueUsers || 0;
    document.getElementById('detailCompletion').textContent = (s.completionRate || 0) + '%';
    document.getElementById('detailErrorRate').textContent = (s.errorRate || 0) + '%';
    document.getElementById('detailDuration').textContent = formatDuration(s.avgDurationMs || 0);
    document.getElementById('detailAbandon').textContent = (s.abandonRate || 0) + '%';
  }

  function renderHealthBreakdown(data) {
    if (!data || data.error) return;
    var bd = data.breakdown || {};
    var labels = {
      adoptionRate: 'Adoption',
      completionRate: 'Completion',
      errorRate: 'Error (inv)',
      retentionRate: 'Retention',
      engagementDepth: 'Engagement'
    };
    var html = '';
    for (var key in labels) {
      if (!labels.hasOwnProperty(key)) continue;
      var label = labels[key];
      var val = bd[key] || 0;
      var barColor = val >= 70 ? 'bg-emerald-400' : val >= 40 ? 'bg-amber-400' : 'bg-red-400';
      html += '<div class="flex items-center gap-2">' +
        '<span class="w-20 text-slate-400">' + label + '</span>' +
        '<div class="flex-1 health-bar"><div class="health-bar-fill ' + barColor + '" style="width:' + val + '%"></div></div>' +
        '<span class="w-8 text-right text-slate-300">' + val + '</span>' +
      '</div>';
    }
    document.getElementById('detailBreakdown').innerHTML = html;
    document.getElementById('detailRecommendation').textContent = data.recommendation || '--';
  }

  return {
    getStatusBadge: getStatusBadge,
    formatDuration: formatDuration,
    renderSummaryCards: renderSummaryCards,
    renderLifecycleChart: renderLifecycleChart,
    renderHealthDistChart: renderHealthDistChart,
    renderHealthGrid: renderHealthGrid,
    renderRegistryTable: renderRegistryTable,
    renderAtRiskFeatures: renderAtRiskFeatures,
    renderFunnelsList: renderFunnelsList,
    renderFunnelConversion: renderFunnelConversion,
    renderFeatureDetailHeader: renderFeatureDetailHeader,
    renderFeatureStats: renderFeatureStats,
    renderHealthBreakdown: renderHealthBreakdown
  };
})();
