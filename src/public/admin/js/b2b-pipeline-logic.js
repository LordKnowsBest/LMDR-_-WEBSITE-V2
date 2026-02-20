/* =========================================
   B2B Pipeline — Logic Module
   Depends on: PipelineBridge
   ========================================= */
var PipelineLogic = (function () {
  'use strict';

  var currentView = 'kanban';
  var pipelineData = { stages: [], summary: {} };

  function init() {
    PipelineBridge.listen({
      init: function () { refreshPipeline(); },
      pipelineLoaded: function (d) { pipelineData = d.payload || { stages: [], summary: {} }; renderPipeline(); },
      forecastLoaded: function (d) { renderForecast(d.payload); },
      stageUpdated: function () { showToast('Stage updated', 'success'); refreshPipeline(); },
      actionSuccess: function (d) { showToast(d.message || 'Done', 'success'); },
      actionError: function (d) { showToast(d.message || 'Error', 'error'); }
    });
  }

  function refreshPipeline() {
    var ownerId = document.getElementById('ownerFilter').value;
    PipelineBridge.sendToVelo({ action: 'getPipeline', ownerId: ownerId });
    PipelineBridge.sendToVelo({ action: 'getForecast', ownerId: ownerId });
  }

  function applyFilters() { refreshPipeline(); }

  function setView(view) {
    currentView = view;
    document.getElementById('kanbanView').classList.toggle('hidden', view !== 'kanban');
    document.getElementById('tableView').classList.toggle('hidden', view !== 'table');
    document.getElementById('btnKanban').className = 'px-3 py-1.5 rounded-md text-xs font-medium transition-colors ' + (view === 'kanban' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white');
    document.getElementById('btnTable').className = 'px-3 py-1.5 rounded-md text-xs font-medium transition-colors ' + (view === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white');
    renderPipeline();
  }

  function renderPipeline() {
    if (currentView === 'kanban') renderKanban();
    else renderTable();
  }

  function renderKanban() {
    var container = document.getElementById('kanbanContainer');
    var stages = pipelineData.stages || [];
    if (stages.length === 0) {
      container.innerHTML = '<div class="flex items-center justify-center w-full text-slate-500 py-12"><span class="material-symbols-outlined text-4xl mr-3">inbox</span>No pipeline data</div>';
      return;
    }
    var stageColors = { prospecting: 'border-slate-500', discovery: 'border-blue-500', proposal: 'border-amber-500', negotiation: 'border-purple-500' };
    container.innerHTML = stages.map(function (stage) {
      return '<div class="stage-column flex-shrink-0 flex flex-col"><div class="flex items-center justify-between mb-3"><div class="flex items-center gap-2"><div class="w-2.5 h-2.5 rounded-full ' + (stageColors[stage.stage_id] || 'border-slate-500') + ' bg-current opacity-60"></div><h3 class="text-sm font-bold text-slate-200">' + esc(stage.name) + '</h3></div><div class="text-right"><span class="text-xs font-semibold text-slate-300">' + stage.opportunity_count + '</span><span class="text-xs text-slate-500 ml-1">' + formatCurrency(stage.value_sum) + '</span></div></div><div class="flex-1 space-y-2 bg-slate-900/30 rounded-xl p-2 min-h-[200px]">' + (stage.opportunities || []).map(function (opp) { return renderDealCard(opp, stage.stage_id); }).join('') + (stage.opportunities.length === 0 ? '<p class="text-xs text-slate-600 text-center py-8">No deals</p>' : '') + '</div></div>';
    }).join('');
  }

  function renderDealCard(opp, stageId) {
    var risks = opp.risk_flags || [];
    var hasRisk = risks.length > 0;
    var riskColor = hasRisk ? 'border-l-red-500' : 'border-l-transparent';
    return '<div class="deal-card bg-slate-900 border border-slate-800 border-l-2 ' + riskColor + ' rounded-lg p-3" onclick="viewDeal(\'' + esc(opp._id || opp.id) + '\', \'' + esc(opp.account_id) + '\')"><p class="text-sm font-semibold text-slate-100 truncate">' + esc(opp.account_name || opp.account_id) + '</p><p class="text-xs text-slate-400 mt-1">' + formatCurrency(opp.value_estimate || 0) + '</p>' + (hasRisk ? '<div class="mt-2 flex flex-wrap gap-1">' + risks.slice(0, 2).map(function (r) { return '<span class="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">' + esc(r.type) + '</span>'; }).join('') + '</div>' : '') + (opp.next_step ? '<p class="text-[11px] text-slate-500 mt-1.5 truncate">Next: ' + esc(opp.next_step) + '</p>' : '') + '</div>';
  }

  function renderTable() {
    var tbody = document.getElementById('tableBody');
    var allOpps = [];
    (pipelineData.stages || []).forEach(function (s) {
      (s.opportunities || []).forEach(function (o) { o._stageName = s.name; allOpps.push(o); });
    });
    if (allOpps.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-500">No deals in pipeline</td></tr>';
      return;
    }
    tbody.innerHTML = allOpps.map(function (o) {
      var risks = o.risk_flags || [];
      return '<tr class="hover:bg-slate-900/50 cursor-pointer" onclick="viewDeal(\'' + esc(o._id || o.id) + '\', \'' + esc(o.account_id) + '\')"><td class="py-3 pr-4 text-slate-200 font-medium">' + esc(o.account_name || o.account_id) + '</td><td class="py-3 pr-4"><span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">' + esc(o._stageName) + '</span></td><td class="py-3 pr-4 text-emerald-400 font-semibold">' + formatCurrency(o.value_estimate || 0) + '</td><td class="py-3 pr-4 text-slate-400">' + esc(o.owner_id || '\u2014') + '</td><td class="py-3 pr-4">' + (risks.length > 0 ? '<span class="text-xs text-red-400">' + risks.length + ' risk' + (risks.length > 1 ? 's' : '') + '</span>' : '<span class="text-xs text-emerald-400">OK</span>') + '</td><td class="py-3 text-slate-400 text-xs truncate max-w-[200px]">' + esc(o.next_step || '\u2014') + '</td></tr>';
    }).join('');
  }

  function renderForecast(fc) {
    if (!fc) return;
    setText('fcCommit', formatCurrency(fc.commit || 0));
    setText('fcBest', formatCurrency(fc.best || 0));
    setText('fcPipeline', formatCurrency(fc.pipeline || 0));
    setText('fcDeals', String(fc.deal_count || 0));
    setText('fcCoverage', pipelineData.summary && pipelineData.summary.pipeline_coverage ? pipelineData.summary.pipeline_coverage + 'x' : '\u2014');
  }

  function viewDeal(oppId, accountId) {
    PipelineBridge.sendToVelo({ action: 'viewAccount', accountId: accountId });
  }

  function setText(id, t) { var el = document.getElementById(id); if (el) el.textContent = t; }
  function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
  function formatCurrency(v) { var n = Number(v) || 0; if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'; if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'k'; return '$' + n; }
  function showToast(m, t) { t = t || 'info'; var c = document.getElementById('toastContainer'); var cl = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-blue-600' }; var el = document.createElement('div'); el.className = 'toast ' + (cl[t] || cl.info) + ' text-white text-sm px-4 py-3 rounded-lg shadow-lg'; el.textContent = m; c.appendChild(el); setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(function () { el.remove(); }, 300); }, 3000); }

  function exposeGlobals() {
    window.refreshPipeline = refreshPipeline;
    window.applyFilters = applyFilters;
    window.setView = setView;
    window.viewDeal = viewDeal;
  }

  return { init: init, exposeGlobals: exposeGlobals };
})();
