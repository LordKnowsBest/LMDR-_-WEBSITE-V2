/* =========================================
   RECRUITER TELEMETRY — Render Module
   Depends on: TelemetryConfig
   ========================================= */
var TelemetryRender = (function () {
  'use strict';

  function showToast(message, type) {
    var existing = document.getElementById('toastNotification');
    if (existing) existing.remove();

    var colors = TelemetryConfig.TOAST_COLORS;
    var toast = document.createElement('div');
    toast.id = 'toastNotification';
    toast.className = 'fixed top-4 right-4 z-[100] ' + (colors[type] || colors.info) + ' text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-opacity duration-300';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  function renderCallAnalytics(analytics) {
    if (!analytics) return;
    document.getElementById('totalCallsCount').textContent = analytics.totalCalls || 0;
    document.getElementById('overallConversion').textContent = (analytics.overallConversionRate || 0) + '%';

    var sentiment = analytics.avgSentiment || 0;
    var sentimentEl = document.getElementById('avgSentimentDisplay');
    sentimentEl.textContent = sentiment > 0 ? 'Positive' : sentiment < 0 ? 'Negative' : 'Neutral';
    sentimentEl.className = 'text-2xl font-bold mt-1 ' + (sentiment > 0 ? 'text-green-400' : sentiment < 0 ? 'text-red-400' : 'text-gray-400');

    var dist = analytics.outcomeDistribution || {};
    var total = analytics.totalCalls || 1;
    var colors = TelemetryConfig.OUTCOME_COLORS;

    document.getElementById('outcomeDistribution').innerHTML = Object.entries(dist).map(function (entry) {
      var key = entry[0];
      var count = entry[1];
      var pct = Math.round((count / total) * 100);
      return '<div class="flex items-center gap-2">' +
        '<span class="text-xs text-gray-400 w-20 capitalize">' + key.replace(/_/g, ' ') + '</span>' +
        '<div class="flex-1 bg-gray-700 rounded-full h-2"><div class="' + (colors[key] || 'bg-gray-500') + ' h-2 rounded-full" style="width: ' + pct + '%"></div></div>' +
        '<span class="text-xs text-gray-400 w-8 text-right">' + count + '</span>' +
        '</div>';
    }).join('');
  }

  function renderRecentCalls(calls) {
    var list = document.getElementById('recentCallsList');
    if (!calls.length) {
      list.innerHTML = '<p class="text-sm text-gray-500">No calls logged yet</p>';
      return;
    }

    var badges = TelemetryConfig.OUTCOME_BADGES;

    list.innerHTML = calls.slice(0, 20).map(function (c) {
      var date = new Date(c.call_timestamp).toLocaleDateString();
      return '<div class="flex items-center justify-between py-2 border-b border-gray-700/50">' +
        '<div class="flex-1 min-w-0">' +
        '<span class="text-sm text-white">' + (c.driver_id || 'Unknown') + '</span>' +
        '<span class="text-xs text-gray-400 ml-2">' + date + '</span>' +
        '</div>' +
        '<span class="px-2 py-0.5 ' + (badges[c.outcome] || 'bg-gray-600') + ' text-white text-xs rounded-full capitalize">' + (c.outcome || '').replace(/_/g, ' ') + '</span>' +
        '</div>';
    }).join('');
  }

  return {
    showToast: showToast,
    renderCallAnalytics: renderCallAnalytics,
    renderRecentCalls: renderRecentCalls
  };
})();
