/* =========================================
   ADMIN REVENUE DASHBOARD — Render Module
   Depends on: RevenueConfig
   DOM rendering, Chart.js instances, utilities
   ========================================= */
var RevenueRender = (function () {
  'use strict';

  var mrrChartInstance = null;
  var tierChartInstance = null;
  var churnChartInstance = null;

  /* --- Utilities --- */
  function formatCurrency(value) {
    if (value === null || value === undefined) return '$0';
    return '$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function formatDateLabel(dateStr) {
    try {
      var d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    } catch (_) { return dateStr; }
  }

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }

  function showToast(message, type) {
    var container = document.getElementById('toastContainer');
    var toast = document.createElement('div');
    var bgColor = type === 'error' ? 'bg-red-600' : 'bg-green-600';
    var icon = type === 'error' ? 'error' : 'check_circle';
    toast.className = 'toast flex items-center gap-2 px-4 py-3 ' + bgColor + ' rounded-lg shadow-lg text-sm max-w-sm';
    toast.innerHTML = '<span class="material-symbols-outlined text-lg">' + icon + '</span><span>' + message + '</span>';
    container.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 4000);
  }

  /* --- KPI Cards --- */
  function renderKPICards(data) {
    if (!data) return;

    var fields = [
      { id: 'mrrValue', value: formatCurrency(data.mrr) },
      { id: 'arrValue', value: formatCurrency(data.arr) },
      { id: 'churnRateValue', value: (data.churnRate * 100).toFixed(2) + '%' },
      { id: 'activeSubsValue', value: (data.totalActive || 0).toLocaleString() },
      { id: 'arpuValue', value: formatCurrency(data.arpu) },
      { id: 'ltvValue', value: formatCurrency(data.ltv) }
    ];

    for (var i = 0; i < fields.length; i++) {
      var el = document.getElementById(fields[i].id);
      el.textContent = fields[i].value;
      el.classList.remove('skeleton');
    }

    renderChangeBadge('mrrChange', data.mrrChange);
    renderChangeBadge('subChange', data.subscriberChange);

    var churnDir = document.getElementById('churnDirection');
    if (data.churnRate > 0.05) {
      churnDir.textContent = 'High';
      churnDir.className = 'text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/20 text-red-400';
    } else if (data.churnRate > 0.02) {
      churnDir.textContent = 'Moderate';
      churnDir.className = 'text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400';
    } else {
      churnDir.textContent = 'Low';
      churnDir.className = 'text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/20 text-green-400';
    }
  }

  function renderChangeBadge(elementId, changePercent) {
    var el = document.getElementById(elementId);
    if (changePercent === undefined || changePercent === null) return;

    var isPositive = changePercent >= 0;
    var arrow = isPositive ? '\u2191' : '\u2193';
    el.textContent = arrow + ' ' + Math.abs(changePercent).toFixed(1) + '%';
    el.className = 'text-xs font-medium px-2 py-0.5 rounded-full ' +
      (isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400');
  }

  /* --- MRR Trend Chart --- */
  function renderMRRChart(data) {
    if (!data || !data.length) return;

    var ctx = document.getElementById('mrrChart').getContext('2d');
    if (mrrChartInstance) mrrChartInstance.destroy();

    mrrChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(function (d) { return formatDateLabel(d.date); }),
        datasets: [{
          label: 'MRR',
          data: data.map(function (d) { return d.mrr; }),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) { return 'MRR: ' + formatCurrency(ctx.raw); }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(71, 85, 105, 0.3)' },
            ticks: { color: '#94a3b8', maxTicksLimit: 12 }
          },
          y: {
            grid: { color: 'rgba(71, 85, 105, 0.3)' },
            ticks: {
              color: '#94a3b8',
              callback: function (v) { return '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v); }
            }
          }
        }
      }
    });
  }

  /* --- Tier Chart --- */
  function renderTierChart(data) {
    if (!data || !data.length) return;

    var ctx = document.getElementById('tierChart').getContext('2d');
    if (tierChartInstance) tierChartInstance.destroy();

    tierChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(function (d) { return capitalize(d.tier); }),
        datasets: [{
          label: 'Revenue',
          data: data.map(function (d) { return d.revenue; }),
          backgroundColor: data.map(function (d) { return RevenueConfig.TIER_COLORS[d.tier] || '#64748b'; }),
          borderRadius: 6,
          barPercentage: 0.6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) { return formatCurrency(ctx.raw) + ' (' + data[ctx.dataIndex].count + ' subs)'; }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(71, 85, 105, 0.3)' },
            ticks: {
              color: '#94a3b8',
              callback: function (v) { return '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v); }
            }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    });
  }

  /* --- Cohort Table --- */
  function renderCohortTable(data) {
    if (!data || !data.length) {
      document.getElementById('cohortBody').innerHTML =
        '<tr><td colspan="8" class="text-center py-8 text-slate-500">No cohort data available</td></tr>';
      return;
    }

    var maxMonths = 0;
    for (var c = 0; c < data.length; c++) {
      if (data[c].retention.length > maxMonths) maxMonths = data[c].retention.length;
    }

    var thead = document.getElementById('cohortTable').querySelector('thead tr');
    thead.innerHTML = '<th class="text-left py-3 px-3 font-medium">Cohort</th><th class="text-center py-3 px-3 font-medium">Size</th>';
    for (var i = 0; i < maxMonths; i++) {
      thead.innerHTML += '<th class="text-center py-3 px-3 font-medium">M' + i + '</th>';
    }

    var tbody = document.getElementById('cohortBody');
    tbody.innerHTML = '';

    for (var j = 0; j < data.length; j++) {
      var cohort = data[j];
      var row = document.createElement('tr');
      row.className = 'border-b border-slate-700/50 hover:bg-slate-700/30';

      var cells = '<td class="py-3 px-3 font-medium">' + cohort.cohort + '</td>';
      cells += '<td class="text-center py-3 px-3">' + cohort.total + '</td>';

      for (var m = 0; m < maxMonths; m++) {
        var pct = cohort.retention[m];
        if (pct !== undefined) {
          var cls = pct >= 70 ? 'cohort-high' : pct >= 40 ? 'cohort-mid' : 'cohort-low';
          cells += '<td class="text-center py-3 px-3"><span class="px-2 py-0.5 rounded text-xs font-medium ' + cls + '">' + pct + '%</span></td>';
        } else {
          cells += '<td class="text-center py-3 px-3 text-slate-600">-</td>';
        }
      }

      row.innerHTML = cells;
      tbody.appendChild(row);
    }
  }

  /* --- Churn Panel --- */
  function renderChurnPanel(data) {
    if (!data) return;

    var ctx = document.getElementById('churnChart').getContext('2d');
    if (churnChartInstance) churnChartInstance.destroy();

    var reasons = data.reasons || [];
    var colors = RevenueConfig.CHURN_COLORS;

    if (reasons.length > 0) {
      churnChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: reasons.map(function (r) { return r.reason; }),
          datasets: [{
            data: reasons.map(function (r) { return r.count; }),
            backgroundColor: reasons.map(function (_, i) { return colors[i % colors.length]; }),
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#94a3b8', padding: 12, usePointStyle: true }
            }
          }
        }
      });
    }

    var list = document.getElementById('churnReasonsList');
    if (reasons.length === 0) {
      list.innerHTML = '<p class="text-slate-500 text-sm">No churn data in the period</p>';
    } else {
      var html = '';
      for (var i = 0; i < reasons.length; i++) {
        html +=
          '<div class="flex items-center justify-between bg-slate-700/30 rounded-lg px-4 py-3">' +
            '<div class="flex items-center gap-3">' +
              '<div class="w-3 h-3 rounded-full" style="background:' + colors[i % colors.length] + '"></div>' +
              '<span class="text-sm">' + reasons[i].reason + '</span>' +
            '</div>' +
            '<span class="text-sm font-semibold">' + reasons[i].count + '</span>' +
          '</div>';
      }
      list.innerHTML = html;
    }

    var summary = document.getElementById('churnSummary');
    summary.classList.remove('hidden');
    document.getElementById('churnTotal').textContent = data.totalChurned || 0;
    document.getElementById('churnRateSummary').textContent = ((data.churnRate || 0) * 100).toFixed(2) + '%';
  }

  /* --- CSV Download --- */
  function downloadCSV(payload) {
    if (!payload || !payload.csv) return;
    var blob = new Blob([payload.csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = payload.filename || 'revenue_export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully', 'success');
  }

  return {
    renderKPICards: renderKPICards,
    renderMRRChart: renderMRRChart,
    renderTierChart: renderTierChart,
    renderCohortTable: renderCohortTable,
    renderChurnPanel: renderChurnPanel,
    downloadCSV: downloadCSV,
    showToast: showToast
  };
})();
