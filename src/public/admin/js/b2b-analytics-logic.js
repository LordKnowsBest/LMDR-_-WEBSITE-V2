/* =========================================
   B2B Analytics — Logic Module
   Depends on: AnalyticsBridge, Chart.js
   ========================================= */
var AnalyticsLogic = (function () {
  'use strict';

  var funnelChartInstance = null;

  function init() {
    AnalyticsBridge.listen({
      init: function () { refresh(); },
      kpisLoaded: function (d) { renderKPIs(d.payload); },
      conversionsLoaded: function (d) { renderFunnel(d.payload); },
      sourcesLoaded: function (d) { renderSources(d.payload); },
      cpaLoaded: function (d) { renderCPA(d.payload); },
      intelLoaded: function (d) { renderIntel(d.payload); },
      snapshotSaved: function () { showToast('Snapshot saved', 'success'); },
      actionError: function (d) { showToast(d.message || 'Error', 'error'); }
    });
  }

  function refresh() {
    var days = parseInt(document.getElementById('dateRange').value) || 30;
    AnalyticsBridge.sendToVelo({ action: 'getDashboardKPIs', days: days });
    AnalyticsBridge.sendToVelo({ action: 'getStageConversions' });
    AnalyticsBridge.sendToVelo({ action: 'getSourcePerformance' });
    AnalyticsBridge.sendToVelo({ action: 'getCPA', days: days });
    AnalyticsBridge.sendToVelo({ action: 'getCompetitorIntel' });
  }

  function renderKPIs(k) {
    if (!k) return;
    setText('kpiCoverage', k.pipeline_coverage ? k.pipeline_coverage + 'x' : '0x');
    setText('kpiWinRate', (k.win_rate || 0) + '%');
    setText('kpiCycle', (k.avg_cycle_days || 0) + 'd');
    setText('kpiRevenue', formatCurrency(k.won_revenue || 0));
  }

  function renderFunnel(conversions) {
    if (!conversions || conversions.length === 0) return;
    var ctx = document.getElementById('funnelChart').getContext('2d');
    if (funnelChartInstance) funnelChartInstance.destroy();
    funnelChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: conversions.map(function (c) { return c.from_stage.charAt(0).toUpperCase() + c.from_stage.slice(1); }),
        datasets: [
          { label: 'Total', data: conversions.map(function (c) { return c.from_count; }), backgroundColor: 'rgba(59,130,246,0.4)' },
          { label: 'Converted', data: conversions.map(function (c) { return c.converted_count; }), backgroundColor: 'rgba(34,197,94,0.6)' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } }, scales: { x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(51,65,85,0.3)' } }, y: { ticks: { color: '#94a3b8' } } } }
    });
  }

  function renderSources(sources) {
    var tbody = document.getElementById('sourceTable');
    if (!sources || sources.length === 0) { tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-6 text-center text-slate-500 text-sm">No source data</td></tr>'; return; }
    tbody.innerHTML = sources.map(function (s) {
      return '<tr class="hover:bg-slate-800/50"><td class="px-4 py-2.5 text-slate-200 font-medium">' + esc(s.source) + '</td><td class="px-4 py-2.5 text-right text-slate-300">' + s.total + '</td><td class="px-4 py-2.5 text-right text-emerald-400">' + s.converted + '</td><td class="px-4 py-2.5 text-right text-blue-400 font-semibold">' + s.conversion_rate + '%</td></tr>';
    }).join('');
  }

  function renderCPA(cpa) {
    var c = document.getElementById('cpaList');
    if (!cpa || cpa.length === 0) { c.innerHTML = '<div class="p-4 text-center text-slate-500 text-sm">No spend data</div>'; return; }
    c.innerHTML = cpa.map(function (item) {
      return '<div class="px-4 py-3 flex items-center justify-between"><div><p class="text-sm text-slate-200 font-medium">' + esc(item.channel) + '</p><p class="text-xs text-slate-500">Spend: ' + formatCurrency(item.total_spend) + '</p></div><div class="text-right"><p class="text-sm font-bold ' + (item.cpa ? 'text-amber-400' : 'text-slate-500') + '">' + (item.cpa ? formatCurrency(item.cpa) : 'N/A') + '</p><p class="text-xs text-slate-500">per acquisition</p></div></div>';
    }).join('');
  }

  function renderIntel(intel) {
    var c = document.getElementById('intelList');
    if (!intel || intel.length === 0) { c.innerHTML = '<div class="p-4 text-center text-slate-500 text-sm">No intel captured</div>'; return; }
    c.innerHTML = intel.map(function (i) {
      return '<div class="px-4 py-3"><div class="flex items-center justify-between"><p class="text-sm text-slate-200 font-medium">' + esc(i.competitor_name) + '</p><span class="text-xs text-slate-500">' + (i.captured_at ? new Date(i.captured_at).toLocaleDateString() : '') + '</span></div>' + (i.region ? '<p class="text-xs text-slate-400 mt-0.5">Region: ' + esc(i.region) + '</p>' : '') + (i.offerings ? '<p class="text-xs text-slate-500 mt-0.5">' + esc(i.offerings) + '</p>' : '') + '</div>';
    }).join('');
  }

  function takeSnapshot() { AnalyticsBridge.sendToVelo({ action: 'saveSnapshot', days: parseInt(document.getElementById('dateRange').value) || 30 }); }
  function addIntel() { AnalyticsBridge.sendToVelo({ action: 'addCompetitorIntel' }); }

  function setText(id, t) { var el = document.getElementById(id); if (el) el.textContent = t; }
  function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
  function formatCurrency(v) { var n = Number(v) || 0; if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'; if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'k'; return '$' + n; }
  function showToast(m, t) { t = t || 'info'; var c = document.getElementById('toastContainer'); var cl = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-blue-600' }; var el = document.createElement('div'); el.className = 'toast ' + (cl[t] || cl.info) + ' text-white text-sm px-4 py-3 rounded-lg shadow-lg'; el.textContent = m; c.appendChild(el); setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(function () { el.remove(); }, 300); }, 3000); }

  function exposeGlobals() {
    window.refresh = refresh;
    window.takeSnapshot = takeSnapshot;
    window.addIntel = addIntel;
  }

  return { init: init, exposeGlobals: exposeGlobals };
})();
