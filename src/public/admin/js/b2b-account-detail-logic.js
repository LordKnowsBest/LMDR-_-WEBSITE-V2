/* =========================================
   B2B Account Detail — Logic Module
   Depends on: AccountDetailBridge
   ========================================= */
var AccountDetailLogic = (function () {
  'use strict';

  var currentAccountId = null;

  function init() {
    AccountDetailBridge.listen({
      init: function (d) { if (d.accountId) { currentAccountId = d.accountId; loadAccount(d.accountId); } },
      accountLoaded: function (d) { renderAccount(d.payload); },
      signalLoaded: function (d) { renderSignal(d.payload); },
      opportunityLoaded: function (d) { renderOpportunity(d.payload); },
      contactsLoaded: function (d) { renderContacts(d.payload); },
      timelineLoaded: function (d) { renderTimeline(d.payload); },
      risksLoaded: function (d) { renderRisks(d.payload); },
      summaryLoaded: function (d) { renderSummary(d.payload); },
      actionSuccess: function (d) { showToast(d.message || 'Done', 'success'); },
      actionError: function (d) { showToast(d.message || 'Error', 'error'); }
    });
  }

  function loadAccount(accountId) {
    AccountDetailBridge.sendToVelo({ action: 'getAccount', accountId: accountId });
    AccountDetailBridge.sendToVelo({ action: 'getSignal', accountId: accountId });
    AccountDetailBridge.sendToVelo({ action: 'getOpportunity', accountId: accountId });
    AccountDetailBridge.sendToVelo({ action: 'getContacts', accountId: accountId });
    AccountDetailBridge.sendToVelo({ action: 'getTimeline', accountId: accountId, limit: 30 });
    AccountDetailBridge.sendToVelo({ action: 'getRisks', accountId: accountId });
    AccountDetailBridge.sendToVelo({ action: 'getAccountSummary', accountId: accountId });
  }

  function renderAccount(account) {
    if (!account) return;
    currentAccountId = account._id || account.id;
    setText('accountName', account.carrier_name || 'Unknown');
    setText('accountMeta', 'DOT ' + (account.carrier_dot || '\u2014') + ' \u00B7 ' + (account.segment || '\u2014') + ' \u00B7 ' + (account.region || '\u2014') + ' \u00B7 Fleet ' + (account.fleet_size || '?'));
    var badge = document.getElementById('statusBadge');
    var statusColors = { target: 'bg-slate-700 text-slate-300', prospecting: 'bg-blue-500/20 text-blue-400', engaged: 'bg-amber-500/20 text-amber-400', client: 'bg-emerald-500/20 text-emerald-400', churned: 'bg-red-500/20 text-red-400' };
    badge.className = 'text-xs font-bold px-2.5 py-1 rounded-full ' + (statusColors[account.status] || statusColors.target);
    badge.textContent = (account.status || 'target').replace('_', ' ');
  }

  function renderSignal(signal) {
    if (!signal) return;
    setText('signalScore', signal.signal_score || '\u2014');
    setText('signalDrivers', (signal.driver_count_high_match || 0) + ' matching drivers');
    setText('signalRegions', 'Regions: ' + (signal.top_regions || '\u2014'));
    setText('signalEquipment', 'Equipment: ' + (signal.top_equipment || '\u2014'));
  }

  function renderOpportunity(opp) {
    if (!opp) { setText('oppStage', 'None'); return; }
    setText('oppStage', opp.stage || '\u2014');
    setText('oppValue', formatCurrency(opp.value_estimate || 0));
    setText('oppNextStep', opp.next_step || 'Not set');
    setText('oppNextStepDate', opp.next_step_at ? 'Due: ' + new Date(opp.next_step_at).toLocaleDateString() : '');
  }

  function renderContacts(contacts) {
    var container = document.getElementById('contactList');
    if (!contacts || contacts.length === 0) { container.innerHTML = '<div class="p-4 text-center text-slate-500 text-sm">No contacts yet</div>'; return; }
    container.innerHTML = contacts.map(function (c) {
      return '<div class="px-4 py-3"><p class="text-sm font-semibold text-slate-100">' + esc(c.name) + '</p><p class="text-xs text-slate-400">' + esc(c.role || 'No role') + '</p><div class="flex items-center gap-3 mt-1.5">' + (c.phone ? '<a href="tel:' + esc(c.phone) + '" class="text-xs text-blue-400 hover:underline">' + esc(c.phone) + '</a>' : '') + (c.email ? '<span class="text-xs text-slate-500">' + esc(c.email) + '</span>' : '') + '</div><span class="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded ' + (c.consent_status === 'opted_out' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400') + '">' + esc(c.consent_status || 'pending') + '</span></div>';
    }).join('');
  }

  function renderTimeline(activities) {
    var container = document.getElementById('timeline');
    if (!activities || activities.length === 0) { container.innerHTML = '<div class="text-center text-slate-500 text-sm py-4">No activities yet</div>'; return; }
    var iconMap = { email: 'mail', sms: 'sms', call: 'call', meeting: 'groups', task: 'task_alt', note: 'sticky_note_2', stage_change: 'swap_horiz', signal: 'auto_awesome' };
    var colorMap = { email: 'border-blue-500', sms: 'border-amber-500', call: 'border-emerald-500', meeting: 'border-purple-500', task: 'border-cyan-500', note: 'border-slate-500', stage_change: 'border-pink-500' };

    container.innerHTML = activities.map(function (a) {
      var d = a.created_at ? new Date(a.created_at) : null;
      var dateStr = d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
      return '<div class="timeline-item"><div class="timeline-dot ' + (colorMap[a.type] || 'border-slate-600') + '"></div><div><div class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px] text-slate-400">' + (iconMap[a.type] || 'circle') + '</span><span class="text-xs text-slate-500">' + dateStr + '</span></div><p class="text-sm text-slate-200 mt-0.5">' + esc(a.subject || a.type) + '</p>' + (a.notes ? '<p class="text-xs text-slate-500 mt-0.5">' + esc(a.notes) + '</p>' : '') + (a.outcome ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mt-1 inline-block">' + esc(a.outcome) + '</span>' : '') + '</div></div>';
    }).join('');
  }

  function renderRisks(risks) {
    var container = document.getElementById('riskList');
    if (!risks || risks.length === 0) { container.innerHTML = '<p class="text-sm text-emerald-400">No risks identified</p>'; return; }
    container.innerHTML = risks.map(function (r) {
      var isHigh = r.type === 'sla_breach' || r.type === 'overdue';
      return '<div class="flex items-start gap-2 px-3 py-2 rounded-lg ' + (isHigh ? 'bg-red-500/10' : 'bg-amber-500/10') + '"><span class="material-symbols-outlined text-[16px] mt-0.5 ' + (isHigh ? 'text-red-400' : 'text-amber-400') + '">warning</span><p class="text-sm ' + (isHigh ? 'text-red-300' : 'text-amber-300') + '">' + esc(r.message) + '</p></div>';
    }).join('');
  }

  function renderSummary(payload) {
    var summary = payload && payload.summary;
    if (!summary) return;
    setText('aiSummaryText', summary.summary || 'No summary available.');
    setText('aiSummaryMeta', 'Status: ' + (summary.relationshipStatus || 'unknown') + ' • Updated: ' + (summary.updatedAt ? new Date(summary.updatedAt).toLocaleString() : 'now'));
  }

  function action(type) {
    AccountDetailBridge.sendToVelo({ action: 'accountAction', type: type, accountId: currentAccountId });
  }

  function goBack() { AccountDetailBridge.sendToVelo({ action: 'navigate', target: 'dashboard' }); }

  function refreshSummary() {
    if (!currentAccountId) return;
    AccountDetailBridge.sendToVelo({ action: 'getAccountSummary', accountId: currentAccountId, forceRefresh: true });
  }

  function setText(id, t) { var el = document.getElementById(id); if (el) el.textContent = t; }
  function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
  function formatCurrency(v) { var n = Number(v) || 0; if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'; if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'k'; return '$' + n; }
  function showToast(m, t) { t = t || 'info'; var c = document.getElementById('toastContainer'); var cl = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-blue-600' }; var el = document.createElement('div'); el.className = 'toast ' + (cl[t] || cl.info) + ' text-white text-sm px-4 py-3 rounded-lg shadow-lg'; el.textContent = m; c.appendChild(el); setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(function () { el.remove(); }, 300); }, 3000); }

  function exposeGlobals() {
    window.action = action;
    window.goBack = goBack;
    window.refreshSummary = refreshSummary;
  }

  return { init: init, exposeGlobals: exposeGlobals };
})();
