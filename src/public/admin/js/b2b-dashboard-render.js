/* =========================================
   B2B DASHBOARD — Render Module
   Depends on: B2BDashboardConfig
   DOM rendering functions
   ========================================= */
var B2BDashboardRender = (function () {
  'use strict';

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function esc(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function formatCurrency(val) {
    var num = Number(val) || 0;
    if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return '$' + (num / 1000).toFixed(0) + 'k';
    return '$' + num;
  }

  function getScoreBadgeClass(score) {
    var s = Number(score) || 0;
    if (s >= 80) return 'bg-emerald-500/20 text-emerald-400';
    if (s >= 50) return 'bg-amber-500/20 text-amber-400';
    return 'bg-slate-700 text-slate-400';
  }

  function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    var colors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-blue-600', warning: 'bg-amber-600' };
    var toast = document.createElement('div');
    toast.className = 'toast ' + (colors[type] || colors.info) + ' text-white text-sm px-4 py-3 rounded-lg shadow-lg flex items-center gap-2';
    toast.innerHTML = '<span class="material-symbols-outlined text-[18px]">' +
      (type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info') +
      '</span>' + esc(message);
    container.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  function renderKPIs(kpis) {
    if (!kpis) return;
    setText('kpiPipelineCoverage', kpis.pipeline_coverage ? kpis.pipeline_coverage + 'x' : '0x');
    setText('kpiWinRate', (kpis.win_rate || 0) + '%');
    setText('kpiAvgCycle', (kpis.avg_cycle_days || 0) + 'd');
    setText('kpiPipelineValue', formatCurrency(kpis.pipeline_value || 0));
    setText('kpiVelocity', (kpis.activity_velocity || 0) + '/wk');
    setText('kpiResponses', String(kpis.responses_period || 0));
  }

  function renderProspects(prospects) {
    var container = document.getElementById('prospectList');
    if (!prospects || prospects.length === 0) {
      container.innerHTML = '<div class="p-6 text-center text-slate-500"><span class="material-symbols-outlined text-3xl mb-2 block">search_off</span><p class="text-sm">No prospects found</p></div>';
      setText('prospectCount', '0 prospects');
      return;
    }
    setText('prospectCount', prospects.length + ' prospects');
    container.innerHTML = prospects.map(function (p) {
      var urgencyDot = p.urgency === 'high'
        ? '<span class="inline-block w-2 h-2 rounded-full bg-red-500 pulse-dot mr-1.5" title="High urgency"></span>'
        : '';
      var newBadge = p.is_new_this_week
        ? '<span class="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 uppercase">New</span>'
        : '';
      var driverCount = p.driver_count_high_match ? p.driver_count_high_match + ' matching drivers' : '';
      var subtitle = [
        'DOT ' + esc(p.carrier_dot || '\u2014'),
        esc(p.region || '\u2014'),
        'Fleet ' + (p.fleet_size || '?'),
        driverCount
      ].filter(Boolean).join(' \u00b7 ');

      return '<div class="prospect-row px-4 md:px-5 py-3 flex items-center justify-between gap-3">' +
        '<div class="flex-1 min-w-0">' +
          '<p class="text-sm font-semibold text-slate-100 truncate flex items-center">' + urgencyDot + esc(p.carrier_name || p.carrier_dot || 'Unknown') + newBadge + '</p>' +
          '<p class="text-xs text-slate-400 mt-0.5">' + subtitle + '</p>' +
        '</div>' +
        '<div class="flex-shrink-0 text-right">' +
          '<span class="inline-block px-2 py-0.5 rounded-full text-xs font-bold ' + getScoreBadgeClass(p.signal_score) + '">' + (p.signal_score || '\u2014') + '</span>' +
          '<p class="text-[10px] text-slate-500 mt-0.5">AI Score</p>' +
        '</div>' +
        '<div class="flex-shrink-0 flex items-center gap-1">' +
          '<button onclick="B2BDashboardLogic.quickAction(\'call\', \'' + esc(p.carrier_dot) + '\')" class="touch-active p-1.5 rounded-lg hover:bg-slate-800 transition-colors" title="Call"><span class="material-symbols-outlined text-[18px] text-emerald-400">call</span></button>' +
          '<button onclick="B2BDashboardLogic.quickAction(\'email\', \'' + esc(p.carrier_dot) + '\')" class="touch-active p-1.5 rounded-lg hover:bg-slate-800 transition-colors" title="Email"><span class="material-symbols-outlined text-[18px] text-blue-400">mail</span></button>' +
          '<button onclick="B2BDashboardLogic.quickAction(\'sms\', \'' + esc(p.carrier_dot) + '\')" class="touch-active p-1.5 rounded-lg hover:bg-slate-800 transition-colors" title="Text"><span class="material-symbols-outlined text-[18px] text-amber-400">sms</span></button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderAlerts(alerts) {
    var container = document.getElementById('alertList');
    if (!alerts || alerts.length === 0) {
      container.innerHTML = '<div class="p-6 text-center text-slate-500"><span class="material-symbols-outlined text-3xl mb-2 block">check_circle</span><p class="text-sm">No active alerts</p></div>';
      return;
    }
    container.innerHTML = alerts.map(function (a) {
      return '<div class="px-4 py-3 border-l-4 ' + (a.severity === 'HIGH' ? 'border-red-500 bg-red-500/5' : 'border-amber-500 bg-amber-500/5') + '">' +
        '<p class="text-xs font-bold ' + (a.severity === 'HIGH' ? 'text-red-400' : 'text-amber-400') + ' uppercase">' + esc(a.severity) + '</p>' +
        '<p class="text-sm text-slate-300 mt-0.5">' + esc(a.message) + '</p>' +
      '</div>';
    }).join('');
  }

  function renderOpportunities(opps) {
    var container = document.getElementById('opportunityList');
    if (!opps || opps.length === 0) {
      container.innerHTML = '<div class="p-6 text-center text-slate-500"><span class="material-symbols-outlined text-3xl mb-2 block">inventory_2</span><p class="text-sm">No open opportunities</p></div>';
      return;
    }
    container.innerHTML = opps.map(function (o) {
      var risks = o.risk_flags || [];
      var riskBadge = risks.length > 0
        ? '<span class="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">' + esc(risks[0].type) + '</span>'
        : '<span class="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">On track</span>';
      return '<div class="px-4 md:px-5 py-3 flex items-center justify-between gap-3 prospect-row cursor-pointer" onclick="B2BDashboardLogic.viewAccount(\'' + esc(o.account_id) + '\')">' +
        '<div class="flex-1 min-w-0">' +
          '<p class="text-sm font-semibold text-slate-100 truncate">' + esc(o.account_name || o.account_id) + '</p>' +
          '<p class="text-xs text-slate-400 mt-0.5">Stage: ' + esc(o.stage) + ' &middot; ' + formatCurrency(o.value_estimate || 0) + '</p>' +
        '</div>' +
        '<div class="flex-shrink-0">' + riskBadge + '</div>' +
      '</div>';
    }).join('');
  }

  function renderAINextActions(data, actionsRef) {
    var container = document.getElementById('nextActionsList');
    var countEl = document.getElementById('actionCount');
    var actions = data?.actions || [];
    var totalScored = data?.totalScored || actions.length;

    if (countEl) {
      countEl.textContent = totalScored > 0 ? actions.length + ' of ' + totalScored + ' shown' : '';
    }

    if (!actions || actions.length === 0) {
      container.innerHTML = '<div class="p-6 text-center text-slate-500"><span class="material-symbols-outlined text-3xl mb-2 block">event_available</span><p class="text-sm">All caught up! No actions needed.</p></div>';
      actionsRef.list = [];
      return;
    }

    actionsRef.list = actions;
    var channelIcon = { call: 'call', email: 'mail', sms: 'sms' };

    function priorityColor(score) {
      if (score >= 70) return 'bg-red-500/20 text-red-400';
      if (score >= 50) return 'bg-amber-500/20 text-amber-400';
      if (score >= 30) return 'bg-blue-500/20 text-blue-400';
      return 'bg-slate-700 text-slate-400';
    }

    container.innerHTML = actions.map(function (a, idx) {
      var icon = channelIcon[a.recommendedChannel] || 'task_alt';
      var topReason = a.reasons && a.reasons[0] ? a.reasons[0].text : '';
      var reasonPriority = a.reasons && a.reasons[0] ? a.reasons[0].priority : 'low';
      var reasonColor = reasonPriority === 'critical' ? 'text-red-400' :
                        reasonPriority === 'high' ? 'text-amber-400' : 'text-cyan-400';
      var daysText = a.daysSinceTouch !== undefined
        ? (a.daysSinceTouch === 0 ? 'Today' : a.daysSinceTouch === 1 ? 'Yesterday' : a.daysSinceTouch + 'd ago')
        : '';

      return '<div class="px-4 md:px-5 py-3 hover:bg-slate-800/50 transition-colors">' +
        '<div class="flex items-start gap-3">' +
          '<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">' +
            '<span class="material-symbols-outlined text-[18px] text-cyan-400">' + icon + '</span>' +
          '</div>' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center gap-2">' +
              '<p class="text-sm font-medium text-slate-100 truncate cursor-pointer hover:text-cyan-400" onclick="B2BDashboardLogic.startAction(' + idx + ')">' + esc(a.accountName) + '</p>' +
              '<span class="text-xs px-1.5 py-0.5 rounded font-medium ' + priorityColor(a.score) + '">' + a.score + '</span>' +
            '</div>' +
            '<p class="text-xs ' + reasonColor + ' mt-0.5 flex items-center gap-1">' +
              '<span class="material-symbols-outlined text-[14px]">lightbulb</span>' + esc(topReason) +
            '</p>' +
            '<div class="flex items-center gap-2 mt-1">' +
              (a.stage ? '<span class="text-xs text-slate-500">' + esc(a.stage) + '</span>' : '') +
              (a.value ? '<span class="text-xs text-slate-500">' + formatCurrency(a.value) + '</span>' : '') +
              (daysText ? '<span class="text-xs text-slate-600">\u2022 ' + daysText + '</span>' : '') +
            '</div>' +
          '</div>' +
          '<div class="flex-shrink-0 flex items-center gap-1">' +
            '<button onclick="B2BDashboardLogic.startAction(' + idx + ')" class="p-1.5 rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors" title="Start action"><span class="material-symbols-outlined text-[18px]">play_arrow</span></button>' +
            '<button onclick="B2BDashboardLogic.snoozeAction(' + idx + ')" class="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition-colors" title="Snooze 1 day"><span class="material-symbols-outlined text-[18px]">snooze</span></button>' +
            '<button onclick="B2BDashboardLogic.skipAction(' + idx + ')" class="p-1.5 rounded hover:bg-slate-500/20 text-slate-500 transition-colors" title="Skip"><span class="material-symbols-outlined text-[18px]">close</span></button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  return {
    setText: setText,
    esc: esc,
    formatCurrency: formatCurrency,
    showToast: showToast,
    renderKPIs: renderKPIs,
    renderProspects: renderProspects,
    renderAlerts: renderAlerts,
    renderOpportunities: renderOpportunities,
    renderAINextActions: renderAINextActions
  };
})();
