// ============================================================================
// ROS-VIEW-COST-ANALYSIS — Cost Per Hire Deep-Dive
// Ported from: RECRUITER_COST_ANALYSIS.html
// ============================================================================

(function () {
    'use strict';

    const VIEW_ID = 'cost-analysis';
    const MESSAGES = ['costAnalysisLoaded'];

    let data = { avgCost: 0, totalSpend: 0, hires: 0, channels: [] };

    function render() {
        return `
      <div class="flex items-center gap-3">
        <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
          <span class="material-symbols-outlined text-amber-400 text-[16px]">payments</span>
        </div>
        <h2 class="text-lg font-bold text-lmdr-dark">Cost Analysis</h2>
      </div>

      <div class="grid grid-cols-3 gap-3 mt-4">
        <div class="neu rounded-2xl p-5 text-center">
          <span class="material-symbols-outlined text-amber-400 text-[22px]">payments</span>
          <h3 class="text-[24px] font-black text-lmdr-dark mt-1">$${data.avgCost.toLocaleString()}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Avg Cost/Hire</p>
        </div>
        <div class="neu rounded-2xl p-5 text-center">
          <span class="material-symbols-outlined text-red-400 text-[22px]">account_balance_wallet</span>
          <h3 class="text-[24px] font-black text-lmdr-dark mt-1">$${data.totalSpend.toLocaleString()}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Total Spend</p>
        </div>
        <div class="neu rounded-2xl p-5 text-center">
          <span class="material-symbols-outlined text-emerald-500 text-[22px]">person_add</span>
          <h3 class="text-[24px] font-black text-lmdr-dark mt-1">${data.hires}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Total Hires</p>
        </div>
      </div>

      <div class="mt-4 neu rounded-2xl p-5">
        <h3 class="text-[14px] font-bold text-lmdr-dark mb-3">Cost by Channel</h3>
        ${data.channels.length ? renderChannels() : `<div class="neu-in rounded-xl p-6 text-center"><span class="material-symbols-outlined text-tan/30 text-[28px]">bar_chart</span><p class="text-[12px] text-tan mt-1">No channel data yet.</p></div>`}
      </div>

      <div class="mt-4 neu rounded-2xl p-5">
        <h3 class="text-[14px] font-bold text-lmdr-dark mb-3">Cost Optimization Tips</h3>
        <div class="space-y-2">
          ${renderTip('Referral Program', 'Employee referrals cost 40% less than job boards', 'group_add', 'text-emerald-500')}
          ${renderTip('Time-to-Fill', 'Reduce time-to-fill by 20% with AI matching', 'speed', 'text-lmdr-blue')}
          ${renderTip('Source Attribution', 'Track which channels deliver quality hires', 'pie_chart', 'text-purple-400')}
        </div>
      </div>`;
    }

    function renderChannels() {
        const max = Math.max(...data.channels.map(c => c.cost || 1));
        return `<div class="space-y-2">${data.channels.map(c => `
      <div class="flex items-center gap-3">
        <p class="text-[11px] font-bold text-lmdr-dark w-24">${escapeHtml(c.name)}</p>
        <div class="flex-1 h-4 rounded-full neu-ins overflow-hidden">
          <div class="h-full bg-gradient-to-r from-lmdr-blue to-lmdr-deep rounded-full" style="width: ${((c.cost / max) * 100)}%"></div>
        </div>
        <p class="text-[11px] font-bold text-lmdr-dark w-16 text-right">$${c.cost.toLocaleString()}</p>
      </div>`).join('')}</div>`;
    }

    function renderTip(title, desc, icon, color) {
        return `<div class="neu-x rounded-xl p-3 flex items-center gap-3"><span class="material-symbols-outlined ${color} text-[18px]">${icon}</span><div><p class="text-[11px] font-bold text-lmdr-dark">${title}</p><p class="text-[9px] text-tan">${desc}</p></div></div>`;
    }

    function onMount() { ROS.bridge.sendToVelo('fetchCostAnalysis', {}); }
    function onUnmount() { data = { avgCost: 0, totalSpend: 0, hires: 0, channels: [] }; }
    function onMessage(type, payload) { if (type === 'costAnalysisLoaded') { data = { ...data, ...payload }; const s = document.getElementById('ros-stage'); if (s) s.innerHTML = render(); } }
    function escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
