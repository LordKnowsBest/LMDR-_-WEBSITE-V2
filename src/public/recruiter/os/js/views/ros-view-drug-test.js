// ============================================================================
// ROS-VIEW-DRUG-TEST — Drug Testing Integration (Quest/LabCorp)
// ============================================================================

(function () {
    'use strict';

    const VIEW_ID = 'drug-test';
    const MESSAGES = ['drugTestsLoaded', 'drugTestOrdered'];

    let tests = [];
    let stats = { pending: 0, passed: 0, failed: 0, total: 0 };

    function render() {
        return `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
          </button>
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[16px]">biotech</span>
          </div>
          <h2 class="text-lg font-bold text-lmdr-dark">Drug Testing</h2>
        </div>
        <button onclick="ROS.views._drugTest.order()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[12px] font-bold">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">add</span>Order Test
        </button>
      </div>

      <!-- DOT Compliance Banner -->
      <div class="mt-3 neu-ins rounded-xl p-3 flex items-center gap-3 border border-emerald-500/20">
        <span class="material-symbols-outlined text-emerald-400 text-[18px]">verified_user</span>
        <div>
          <p class="text-[11px] font-bold text-lmdr-dark">DOT Compliant Testing</p>
          <p class="text-[10px] text-tan">5-panel or 10-panel DOT-compliant drug screenings via Quest/LabCorp network.</p>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-3 mt-4">
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-amber-400 text-[18px]">hourglass_top</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.pending}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Pending</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.passed}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Passed</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-red-400 text-[18px]">cancel</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.failed}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Failed</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-lmdr-blue text-[18px]">biotech</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.total}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Total</p>
        </div>
      </div>

      <div class="mt-4">
        <h3 class="text-[12px] font-bold text-lmdr-dark mb-2">Test History</h3>
        ${tests.length ? `<div class="space-y-2">${tests.map(t => `
          <div class="neu-x rounded-xl p-3 flex items-center justify-between">
            <div class="flex items-center gap-2"><span class="material-symbols-outlined text-emerald-400 text-[16px]">person</span><div><p class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(t.driverName)}</p><p class="text-[9px] text-tan">${t.panel || '5-Panel DOT'} · ${t.provider || 'Quest'} · ${t.date || 'Today'}</p></div></div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === 'passed' ? 'bg-emerald-500/15 text-emerald-500' : t.status === 'failed' ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500'}">${t.status || 'pending'}</span>
          </div>`).join('')}</div>` :
                `<div class="neu-in rounded-xl p-8 text-center"><span class="material-symbols-outlined text-tan/30 text-[32px]">biotech</span><p class="text-[12px] text-tan mt-2">No drug tests ordered yet.</p></div>`}
      </div>`;
    }

    function onMount() { ROS.bridge.sendToVelo('fetchDrugTests', {}); }
    function onUnmount() { tests = []; }
    function onMessage(type, payload) {
        if (type === 'drugTestsLoaded') { tests = payload.tests || []; stats = payload.stats || stats; const s = document.getElementById('ros-stage'); if (s) s.innerHTML = render(); }
        if (type === 'drugTestOrdered') { showToast('Drug test ordered!'); ROS.bridge.sendToVelo('fetchDrugTests', {}); }
    }
    function escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function showToast(msg) { const t = document.createElement('div'); t.className = 'fixed top-16 right-4 z-[9999] px-4 py-2.5 rounded-xl neu-s text-[12px] font-bold text-lmdr-dark flex items-center gap-2'; t.style.animation = 'fadeUp .3s ease'; t.innerHTML = `<span class="material-symbols-outlined text-emerald-500 text-[16px]">check_circle</span>${msg}`; document.body.appendChild(t); setTimeout(() => t.remove(), 3000); }

    ROS.views._drugTest = { order() { showToast('Drug test — opening vendor portal...'); } };
    ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
