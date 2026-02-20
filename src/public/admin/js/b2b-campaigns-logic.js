/* =========================================
   B2B Campaigns — Logic Module
   Depends on: CampaignsBridge, Chart.js
   ========================================= */
var CampaignsLogic = (function () {
  'use strict';

  var channelChartInstance = null;

  function init() {
    CampaignsBridge.listen({
      init: function () { refresh(); },
      metricsLoaded: function (d) { renderMetrics(d.payload); },
      channelsLoaded: function (d) { renderChannels(d.payload); },
      repsLoaded: function (d) { renderReps(d.payload); },
      actionError: function (d) { showToast(d.message || 'Error', 'error'); }
    });
  }

  function refresh() {
    var days = parseInt(document.getElementById('dateRange').value) || 30;
    CampaignsBridge.sendToVelo({ action: 'getOutreachMetrics', days: days });
    CampaignsBridge.sendToVelo({ action: 'getChannelPerformance', days: days });
    CampaignsBridge.sendToVelo({ action: 'getRepPerformance', days: days });
  }

  function renderMetrics(m) {
    if (!m) return;
    var e = m.email || {}; var s = m.sms || {}; var c = m.call || {};
    setText('kpiEmailSent', String(e.sent || 0));
    setText('kpiOpenRate', (e.open_rate || 0) + '%');
    setText('kpiReplyRate', (e.reply_rate || 0) + '%');
    setText('kpiSmsSent', String(s.sent || 0));
    setText('kpiCalls', String(c.total || 0));
    setText('kpiConnectRate', (c.connect_rate || 0) + '%');
  }

  function renderChannels(channels) {
    if (!channels) return;
    var ctx = document.getElementById('channelChart').getContext('2d');
    if (channelChartInstance) channelChartInstance.destroy();
    var labels = channels.map(function (c) { return c.channel.charAt(0).toUpperCase() + c.channel.slice(1); });
    channelChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Sent', data: channels.map(function (c) { return c.sent; }), backgroundColor: 'rgba(59,130,246,0.6)' },
          { label: 'Replied', data: channels.map(function (c) { return c.replied; }), backgroundColor: 'rgba(34,197,94,0.6)' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } }, scales: { x: { ticks: { color: '#64748b' } }, y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(51,65,85,0.3)' } } } }
    });

    var container = document.getElementById('channelCards');
    var icons = { email: 'mail', sms: 'sms', voice: 'call' };
    var colors = { email: 'blue', sms: 'amber', voice: 'emerald' };
    container.innerHTML = channels.map(function (c) {
      var col = colors[c.channel] || 'slate';
      var replyRate = c.sent > 0 ? Math.round((c.replied / c.sent) * 100) : 0;
      return '<div class="bg-slate-900 border border-slate-800 rounded-xl p-4"><div class="flex items-center gap-2 mb-3"><span class="material-symbols-outlined text-[20px] text-' + col + '-400">' + (icons[c.channel] || 'campaign') + '</span><h3 class="text-sm font-bold text-slate-200">' + esc(c.channel.charAt(0).toUpperCase() + c.channel.slice(1)) + '</h3></div><div class="space-y-2 text-sm"><div class="flex justify-between"><span class="text-slate-400">Sent</span><span class="text-white font-semibold">' + c.sent + '</span></div><div class="flex justify-between"><span class="text-slate-400">Delivered</span><span class="text-white font-semibold">' + c.delivered + '</span></div><div class="flex justify-between"><span class="text-slate-400">Replied</span><span class="text-emerald-400 font-semibold">' + c.replied + '</span></div><div class="flex justify-between"><span class="text-slate-400">Reply Rate</span><span class="text-' + col + '-400 font-semibold">' + replyRate + '%</span></div></div></div>';
    }).join('');
  }

  function renderReps(reps) {
    var tbody = document.getElementById('repTable');
    if (!reps || reps.length === 0) { tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-6 text-center text-slate-500 text-sm">No rep data</td></tr>'; return; }
    tbody.innerHTML = reps.map(function (r) {
      return '<tr class="hover:bg-slate-800/50"><td class="px-4 py-2.5 text-slate-200 font-medium">' + esc(r.owner_id || 'Unassigned') + '</td><td class="px-4 py-2.5 text-right text-slate-300">' + r.touches + '</td><td class="px-4 py-2.5 text-right text-emerald-400">' + r.replies + '</td><td class="px-4 py-2.5 text-right text-purple-400">' + r.meetings + '</td></tr>';
    }).join('');
  }

  function setText(id, t) { var el = document.getElementById(id); if (el) el.textContent = t; }
  function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
  function showToast(m, t) { t = t || 'info'; var c = document.getElementById('toastContainer'); var cl = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-blue-600' }; var el = document.createElement('div'); el.className = 'toast ' + (cl[t] || cl.info) + ' text-white text-sm px-4 py-3 rounded-lg shadow-lg'; el.textContent = m; c.appendChild(el); setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(function () { el.remove(); }, 300); }, 3000); }

  function exposeGlobals() {
    window.refresh = refresh;
  }

  return { init: init, exposeGlobals: exposeGlobals };
})();
