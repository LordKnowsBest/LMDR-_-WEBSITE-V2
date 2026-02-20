/* =========================================
   ADMIN MATCHES — Render Module
   Depends on: AdminMatchesConfig
   DOM rendering functions
   ========================================= */
var AdminMatchesRender = (function () {
  'use strict';

  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getScoreClass(score) {
    if (score >= 90) return 'score-excellent';
    if (score >= 75) return 'score-good';
    if (score >= 60) return 'score-fair';
    return 'score-low';
  }

  function getRelativeTime(timestamp) {
    if (!timestamp) return '';
    var now = new Date();
    var date = new Date(timestamp);
    var diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
    return date.toLocaleDateString();
  }

  function showToast(message, type) {
    type = type || 'success';
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#dc2626' : '#1f2937';
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 3000);
  }

  function renderStats(stats) {
    document.getElementById('statToday').textContent = stats.matches.today.toLocaleString();
    document.getElementById('statWeek').textContent = stats.matches.thisWeek.toLocaleString();
    document.getElementById('statAvgScore').textContent = stats.matches.averageScore + '%';
    document.getElementById('statConversion').textContent = stats.interests.conversionRate + '%';

    var total = stats.scoreDistribution.excellent + stats.scoreDistribution.good +
                stats.scoreDistribution.fair + stats.scoreDistribution.low;
    if (total > 0) {
      updateScoreBar('Excellent', stats.scoreDistribution.excellent, total);
      updateScoreBar('Good', stats.scoreDistribution.good, total);
      updateScoreBar('Fair', stats.scoreDistribution.fair, total);
      updateScoreBar('Low', stats.scoreDistribution.low, total);
    }

    renderTopCarriers(stats.topCarriers);
    return stats;
  }

  function updateScoreBar(category, count, total) {
    var catLower = category.toLowerCase();
    var percent = Math.round((count / total) * 100);
    document.getElementById('score' + category).style.width = percent + '%';
    document.getElementById('score' + category + 'Count').textContent = count;
  }

  function renderTopCarriers(carriers) {
    var container = document.getElementById('topCarriersList');
    if (!carriers || carriers.length === 0) {
      container.innerHTML = '<p class="text-sm text-gray-500">No data available</p>';
      return;
    }
    container.innerHTML = carriers.map(function (carrier, index) {
      return '<div class="flex items-center justify-between py-2 ' + (index > 0 ? 'border-t border-gray-100' : '') + '">' +
        '<div class="flex items-center gap-3">' +
          '<span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">' + (index + 1) + '</span>' +
          '<span class="text-sm font-medium text-gray-900 truncate max-w-[180px]">' + escapeHtml(carrier.name) + '</span>' +
        '</div>' +
        '<span class="text-sm text-gray-600">' + carrier.count + ' matches</span>' +
      '</div>';
    }).join('');
  }

  function renderMatches(data) {
    var container = document.getElementById('matchList');
    var pagination = document.getElementById('matchPagination');

    if (!data.matches || data.matches.length === 0) {
      container.innerHTML =
        '<div class="bg-white rounded-xl p-8 text-center">' +
          '<i class="fas fa-handshake text-4xl text-gray-300 mb-3"></i>' +
          '<p class="text-gray-500">No matches found</p>' +
        '</div>';
      pagination.classList.add('hidden');
      return;
    }

    var mobileHtml = data.matches.map(function (match) {
      return '<div class="match-card bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer" onclick="AdminMatchesLogic.openMatchDetail(\'' + match._id + '\')">' +
        '<div class="flex items-start gap-3">' +
          '<div class="score-ring ' + getScoreClass(match.match_score) + '">' + match.match_score + '</div>' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-start justify-between">' +
              '<div>' +
                '<p class="font-semibold text-gray-900">' + escapeHtml(match.carrier_name || 'Unknown Carrier') + '</p>' +
                '<p class="text-sm text-gray-500">' + escapeHtml(match.driver_name || 'Anonymous') + '</p>' +
              '</div>' +
              '<span class="text-xs text-gray-400">' + match.relativeTime + '</span>' +
            '</div>' +
            '<div class="flex items-center gap-2 mt-2">' +
              '<span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">' + match.actionLabel + '</span>' +
              (match.carrier_dot ? '<span class="text-xs text-gray-400">DOT: ' + match.carrier_dot + '</span>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    var desktopRows = data.matches.map(function (match) {
      return '<tr class="hover:bg-gray-50 cursor-pointer" onclick="AdminMatchesLogic.openMatchDetail(\'' + match._id + '\')">' +
        '<td class="px-4 py-3"><span class="inline-flex items-center justify-center w-10 h-10 rounded-lg text-white text-sm font-bold ' + getScoreClass(match.match_score) + '">' + match.match_score + '</span></td>' +
        '<td class="px-4 py-3"><p class="font-medium text-gray-900">' + escapeHtml(match.carrier_name || 'Unknown') + '</p><p class="text-xs text-gray-500">DOT: ' + (match.carrier_dot || '-') + '</p></td>' +
        '<td class="px-4 py-3"><p class="text-gray-900">' + escapeHtml(match.driver_name || 'Anonymous') + '</p><p class="text-xs text-gray-500">' + (match.driver_zip || '-') + '</p></td>' +
        '<td class="px-4 py-3"><span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">' + match.actionLabel + '</span></td>' +
        '<td class="px-4 py-3 text-sm text-gray-500">' + match.relativeTime + '</td>' +
        '<td class="px-4 py-3 text-right"><i class="fas fa-chevron-right text-gray-400"></i></td>' +
      '</tr>';
    }).join('');

    container.innerHTML =
      '<div class="mobile-cards space-y-3">' + mobileHtml + '</div>' +
      '<div class="desktop-table bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">' +
        '<table class="w-full">' +
          '<thead class="bg-gray-50"><tr>' +
            '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>' +
            '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carrier</th>' +
            '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>' +
            '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>' +
            '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>' +
            '<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>' +
          '</tr></thead>' +
          '<tbody class="divide-y divide-gray-100">' + desktopRows + '</tbody>' +
        '</table>' +
      '</div>';

    pagination.classList.remove('hidden');
    document.getElementById('matchPageInfo').textContent = 'Page ' + data.currentPage + ' of ' + data.totalPages;
    document.getElementById('matchPrevBtn').disabled = data.currentPage <= 1;
    document.getElementById('matchNextBtn').disabled = data.currentPage >= data.totalPages;
  }

  function renderInterests(data) {
    var container = document.getElementById('interestList');
    var pagination = document.getElementById('interestPagination');

    if (!data.interests || data.interests.length === 0) {
      container.innerHTML =
        '<div class="bg-white rounded-xl p-8 text-center">' +
          '<i class="fas fa-heart text-4xl text-gray-300 mb-3"></i>' +
          '<p class="text-gray-500">No interests found</p>' +
        '</div>';
      pagination.classList.add('hidden');
      return;
    }

    container.innerHTML = data.interests.map(function (interest) {
      var driverName = interest.driver
        ? (escapeHtml(interest.driver.firstName || '') + ' ' + escapeHtml(interest.driver.lastName || '')).trim()
        : 'Unknown Driver';
      var statusLabel = (interest.statusLabel && interest.statusLabel.label) || interest.status || 'Interested';

      return '<div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">' +
        '<div class="flex items-start justify-between mb-3">' +
          '<div>' +
            '<p class="font-semibold text-gray-900">' + escapeHtml(interest.carrier_name || 'Unknown Carrier') + '</p>' +
            '<p class="text-sm text-gray-500">' + driverName + '</p>' +
          '</div>' +
          '<span class="px-2 py-1 rounded-full text-xs font-medium status-' + (interest.status || 'interested') + '">' + statusLabel + '</span>' +
        '</div>' +
        '<div class="flex items-center justify-between text-sm">' +
          '<div class="flex items-center gap-4 text-gray-500">' +
            '<span><i class="fas fa-star mr-1"></i>' + (interest.match_score || '-') + '%</span>' +
            '<span><i class="fas fa-eye mr-1"></i>' + (interest.view_count || 0) + ' views</span>' +
          '</div>' +
          '<span class="text-gray-400">' + interest.relativeTime + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    pagination.classList.remove('hidden');
    document.getElementById('interestPageInfo').textContent = 'Page ' + data.currentPage + ' of ' + data.totalPages;
    document.getElementById('interestPrevBtn').disabled = data.currentPage <= 1;
    document.getElementById('interestNextBtn').disabled = data.currentPage >= data.totalPages;
  }

  function renderTrendsChart(data, chartRef) {
    var ctx = document.getElementById('trendsChart').getContext('2d');

    if (chartRef.instance) {
      chartRef.instance.destroy();
    }

    var labels = data.labels.map(function (date) {
      var d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    chartRef.instance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Matches',
            data: data.matches,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Interests',
            data: data.interests,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
  }

  function renderTopMatches(matches) {
    var container = document.getElementById('topMatchesList');
    if (!matches || matches.length === 0) {
      container.innerHTML = '<p class="text-sm text-gray-500">No matches this week</p>';
      return;
    }
    container.innerHTML = matches.map(function (match) {
      return '<div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">' +
        '<div class="flex items-center gap-3">' +
          '<span class="w-8 h-8 rounded-lg text-white text-xs font-bold flex items-center justify-center ' + getScoreClass(match.match_score) + '">' + match.match_score + '</span>' +
          '<div>' +
            '<p class="text-sm font-medium text-gray-900">' + escapeHtml(match.carrier_name || 'Unknown') + '</p>' +
            '<p class="text-xs text-gray-500">' + escapeHtml(match.driver_name || 'Anonymous') + '</p>' +
          '</div>' +
        '</div>' +
        '<span class="text-xs text-gray-400">' + match.relativeTime + '</span>' +
      '</div>';
    }).join('');
  }

  function renderMatchDetail(match) {
    var container = document.getElementById('matchDetailContent');
    var html =
      '<div class="flex items-center gap-4 mb-6">' +
        '<div class="score-ring ' + getScoreClass(match.match_score) + '" style="width: 64px; height: 64px; font-size: 18px;">' + match.match_score + '</div>' +
        '<div>' +
          '<p class="text-lg font-bold text-gray-900">' + escapeHtml(match.carrier_name || 'Unknown Carrier') + '</p>' +
          '<p class="text-gray-500">DOT: ' + (match.carrier_dot || '-') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-4 mb-6">' +
        '<div class="bg-gray-50 rounded-lg p-3">' +
          '<p class="text-xs text-gray-500 uppercase">Driver</p>' +
          '<p class="font-medium text-gray-900">' + escapeHtml(match.driver_name || 'Anonymous') + '</p>' +
          '<p class="text-sm text-gray-500">' + (match.driver_zip || '-') + '</p>' +
        '</div>' +
        '<div class="bg-gray-50 rounded-lg p-3">' +
          '<p class="text-xs text-gray-500 uppercase">Action</p>' +
          '<p class="font-medium text-gray-900">' + (match.actionLabel || match.action || 'Match') + '</p>' +
          '<p class="text-sm text-gray-500">' + match.relativeTime + '</p>' +
        '</div>' +
      '</div>';

    if (match.carrierInfo) {
      html +=
        '<div class="border-t border-gray-200 pt-4 mb-4">' +
          '<h4 class="font-semibold text-gray-900 mb-3">Carrier Info</h4>' +
          '<div class="grid grid-cols-2 gap-3 text-sm">' +
            '<div><span class="text-gray-500">Fleet Size:</span><span class="font-medium ml-2">' + (match.carrierInfo.nbr_power_unit || '-') + '</span></div>' +
            '<div><span class="text-gray-500">Location:</span><span class="font-medium ml-2">' + (match.carrierInfo.phy_city || '') + ', ' + (match.carrierInfo.phy_state || '') + '</span></div>' +
            '<div><span class="text-gray-500">Safety Rating:</span><span class="font-medium ml-2">' + (match.carrierInfo.safety_rating || 'Not Rated') + '</span></div>' +
            '<div><span class="text-gray-500">Status:</span><span class="font-medium ml-2">' + (match.carrierInfo.status || 'Active') + '</span></div>' +
          '</div>' +
        '</div>';
    }

    if (match.relatedMatches && match.relatedMatches.length > 0) {
      html +=
        '<div class="border-t border-gray-200 pt-4">' +
          '<h4 class="font-semibold text-gray-900 mb-3">Related Matches (' + match.relatedMatches.length + ')</h4>' +
          '<div class="space-y-2 max-h-40 overflow-y-auto">' +
            match.relatedMatches.slice(0, 5).map(function (rm) {
              return '<div class="flex items-center justify-between py-2 border-b border-gray-100">' +
                '<div class="flex items-center gap-2">' +
                  '<span class="w-6 h-6 rounded text-white text-xs font-bold flex items-center justify-center ' + getScoreClass(rm.match_score) + '">' + rm.match_score + '</span>' +
                  '<span class="text-sm text-gray-900">' + escapeHtml(rm.driver_name || 'Anonymous') + '</span>' +
                '</div>' +
                '<span class="text-xs text-gray-400">' + getRelativeTime(rm.timestamp) + '</span>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>';
    }

    container.innerHTML = html;
  }

  function populateActionFilter(actions) {
    var select = document.getElementById('matchAction');
    select.innerHTML = '<option value="all">All Actions</option>';
    actions.forEach(function (action) {
      var label = action.charAt(0).toUpperCase() + action.slice(1);
      select.innerHTML += '<option value="' + action + '">' + label + '</option>';
    });
  }

  function downloadCSV(csv, filename) {
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    showToast('Export downloaded successfully');
  }

  return {
    escapeHtml: escapeHtml,
    getScoreClass: getScoreClass,
    getRelativeTime: getRelativeTime,
    showToast: showToast,
    renderStats: renderStats,
    renderMatches: renderMatches,
    renderInterests: renderInterests,
    renderTrendsChart: renderTrendsChart,
    renderTopMatches: renderTopMatches,
    renderMatchDetail: renderMatchDetail,
    populateActionFilter: populateActionFilter,
    downloadCSV: downloadCSV
  };
})();
