// ============================================================================
// ROS-VIEW-COMPLY — Regulatory Compliance Dashboard (DQF/DOT)
// ============================================================================

(function () {
    'use strict';

    const VIEW_ID = 'comply';
    const MESSAGES = ['complianceLoaded'];

    let items = [];
    let stats = { compliant: 0, atRisk: 0, violations: 0, audits: 0 };

    function render() {
        return `
      <div class="flex items-center gap-3">
        <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-[16px]">gavel</span>
        </div>
        <h2 class="text-lg font-bold text-lmdr-dark">Compliance</h2>
      </div>

      <div class="grid grid-cols-4 gap-3 mt-4">
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.compliant}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Compliant</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-amber-400 text-[18px]">warning</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.atRisk}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">At Risk</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-red-400 text-[18px]">error</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.violations}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Violations</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-lmdr-blue text-[18px]">fact_check</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.audits}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Audits</p>
        </div>
      </div>

      <div class="mt-4 neu rounded-2xl p-5">
        <h3 class="text-[14px] font-bold text-lmdr-dark mb-3">Compliance Checklist</h3>
        <div class="space-y-2">
          ${renderChecklist('Driver Qualification File (DQF)', 'DQF requirements per FMCSA §391', true)}
          ${renderChecklist('Drug & Alcohol Testing', 'Random testing pool compliance', true)}
          ${renderChecklist('Hours of Service (HOS)', 'ELD compliance verification', false)}
          ${renderChecklist('Vehicle Inspection Reports', 'DVIR submission & review', false)}
          ${renderChecklist('Insurance & Authority', 'Operating authority & insurance status', true)}
          ${renderChecklist('Hazmat Credentials', 'TSA background check, endorsements', false)}
        </div>
      </div>

      <div class="mt-4">
        <h3 class="text-[12px] font-bold text-lmdr-dark mb-2">Recent Alerts</h3>
        ${renderAlerts()}
      </div>`;
    }

    function renderChecklist(title, desc, done) {
        return `<div class="neu-x rounded-xl p-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="material-symbols-outlined ${done ? 'text-emerald-500' : 'text-tan/40'} text-[18px]">${done ? 'check_circle' : 'radio_button_unchecked'}</span>
        <div><p class="text-[12px] font-bold text-lmdr-dark">${title}</p><p class="text-[9px] text-tan">${desc}</p></div>
      </div>
      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${done ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'}">${done ? 'Done' : 'Pending'}</span>
    </div>`;
    }

    function renderAlerts() {
        if (!items.length) return `<div class="neu-in rounded-xl p-6 text-center"><span class="material-symbols-outlined text-tan/30 text-[28px]">notifications_none</span><p class="text-[12px] text-tan mt-2">No compliance alerts.</p></div>`;
        return `<div class="space-y-2">${items.map(i => `<div class="neu-x rounded-xl p-3"><p class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(i.title)}</p><p class="text-[9px] text-tan">${i.detail || ''}</p></div>`).join('')}</div>`;
    }

    function onMount() { ROS.bridge.sendToVelo('fetchCompliance', {}); }
    function onUnmount() { items = []; }
    function onMessage(type, payload) { if (type === 'complianceLoaded') { items = payload.alerts || []; stats = payload.stats || stats; const s = document.getElementById('ros-stage'); if (s) s.innerHTML = render(); } }
    function escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
