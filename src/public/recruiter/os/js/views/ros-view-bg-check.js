// ============================================================================
// ROS-VIEW-BG-CHECK — Background Check Integration
// ============================================================================

(function () {
    'use strict';

    const VIEW_ID = 'bg-check';
    const MESSAGES = ['bgChecksLoaded', 'bgCheckInitiated'];

    let checks = [];
    let stats = { pending: 0, cleared: 0, flagged: 0, total: 0 };

    function render() {
        return `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
          </button>
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[16px]">shield_person</span>
          </div>
          <h2 class="text-lg font-bold text-lmdr-dark">Background Checks</h2>
        </div>
        <button onclick="ROS.views._bgCheck.initiate()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[12px] font-bold">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">add</span>New Check
        </button>
      </div>

      <div class="grid grid-cols-4 gap-3 mt-4">
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-cyan-500 text-[18px]">pending_actions</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.pending}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Pending</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-emerald-500 text-[18px]">verified_user</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.cleared}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Cleared</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-red-400 text-[18px]">flag</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.flagged}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Flagged</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-lmdr-blue text-[18px]">assignment</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.total}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Total</p>
        </div>
      </div>

      <div class="mt-4">
        <h3 class="text-[12px] font-bold text-lmdr-dark mb-2">Check History</h3>
        ${checks.length ? `<div class="space-y-2">${checks.map(c => `
          <div class="neu-x rounded-xl p-3 flex items-center justify-between">
            <div class="flex items-center gap-2"><span class="material-symbols-outlined text-cyan-400 text-[16px]">person</span><div><p class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(c.driverName)}</p><p class="text-[9px] text-tan">${c.provider || 'Standard check'} · ${c.date || 'Today'}</p></div></div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'cleared' ? 'bg-emerald-500/15 text-emerald-500' : c.status === 'flagged' ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500'}">${c.status || 'pending'}</span>
          </div>`).join('')}</div>` :
                `<div class="neu-in rounded-xl p-8 text-center"><span class="material-symbols-outlined text-tan/30 text-[32px]">shield_person</span><p class="text-[12px] text-tan mt-2">No background checks initiated yet.</p></div>`}
      </div>`;
    }

    function onMount() { ROS.bridge.sendToVelo('fetchBgChecks', {}); }
    function onUnmount() { checks = []; }
    function onMessage(type, payload) {
        if (type === 'bgChecksLoaded') { checks = payload.checks || []; stats = payload.stats || stats; const s = document.getElementById('ros-stage'); if (s) s.innerHTML = render(); }
        if (type === 'bgCheckInitiated') { showToast('Background check initiated!'); ROS.bridge.sendToVelo('fetchBgChecks', {}); }
    }
    function escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function showToast(msg) { const t = document.createElement('div'); t.className = 'fixed top-16 right-4 z-[9999] px-4 py-2.5 rounded-xl neu-s text-[12px] font-bold text-lmdr-dark flex items-center gap-2'; t.style.animation = 'fadeUp .3s ease'; t.innerHTML = `<span class="material-symbols-outlined text-emerald-500 text-[16px]">check_circle</span>${msg}`; document.body.appendChild(t); setTimeout(() => t.remove(), 3000); }

    ROS.views._bgCheck = { initiate() { showToast('Background check — opening vendor portal...'); } };
    ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
