// ============================================================================
// ROS-VIEW-AUTOMATE — Workflow Automation Rules Engine
// ============================================================================

(function () {
    'use strict';

    const VIEW_ID = 'automate';
    const MESSAGES = ['automationsLoaded', 'automationCreated', 'automationToggled'];

    let rules = [];
    let stats = { active: 0, paused: 0, triggered: 0, saved: 0 };

    function render() {
        return `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
          </button>
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[16px]">bolt</span>
          </div>
          <h2 class="text-lg font-bold text-lmdr-dark">Automate</h2>
        </div>
        <button onclick="ROS.views._automate.create()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-[12px] font-bold">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">add</span>New Rule
        </button>
      </div>

      <div class="grid grid-cols-4 gap-3 mt-4">
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-emerald-500 text-[18px]">play_circle</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.active}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Active Rules</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-amber-400 text-[18px]">pause_circle</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.paused}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Paused</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-lmdr-blue text-[18px]">electric_bolt</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.triggered.toLocaleString()}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Triggered</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-purple-400 text-[18px]">schedule</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.saved}h</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Hours Saved</p>
        </div>
      </div>

      <div class="mt-4 neu rounded-2xl p-5">
        <h3 class="text-[14px] font-bold text-lmdr-dark mb-3">Quick Automations</h3>
        <div class="grid grid-cols-2 gap-3">
          ${renderTemplate('Auto-Reply to Applications', 'Send personalized reply when a driver applies', 'reply_all', 'text-blue-400')}
          ${renderTemplate('Pipeline Stage Alerts', 'Notify when driver stuck in stage 5+ days', 'notification_important', 'text-amber-400')}
          ${renderTemplate('Interview Reminders', 'Send SMS 24hr before scheduled interview', 'alarm', 'text-emerald-500')}
          ${renderTemplate('Doc Expiry Warnings', 'Alert when CDL/medical card expires in 30 days', 'event_busy', 'text-red-400')}
          ${renderTemplate('Follow-Up Sequences', 'Auto-send follow-up after 3 days no response', 'forward_to_inbox', 'text-purple-400')}
          ${renderTemplate('Hot Driver Alerts', 'Notify when high-match driver enters pipeline', 'local_fire_department', 'text-orange-400')}
        </div>
      </div>

      <div class="mt-4">
        <h3 class="text-[12px] font-bold text-lmdr-dark mb-2">Active Rules</h3>
        ${renderRules()}
      </div>`;
    }

    function renderTemplate(name, desc, icon, color) {
        return `<div onclick="ROS.views._automate.useTemplate('${name}')" class="neu-x rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform">
      <span class="material-symbols-outlined ${color} text-[20px]">${icon}</span>
      <div><p class="text-[11px] font-bold text-lmdr-dark">${name}</p><p class="text-[9px] text-tan">${desc}</p></div>
    </div>`;
    }

    function renderRules() {
        if (!rules.length) return `<div class="neu-in rounded-xl p-8 text-center"><span class="material-symbols-outlined text-tan/30 text-[32px]">bolt</span><p class="text-[12px] text-tan mt-2">No automation rules yet. Create one or use a template above.</p></div>`;
        return `<div class="space-y-2">${rules.map(r => `
      <div class="neu-x rounded-xl p-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined ${r.active ? 'text-emerald-500' : 'text-tan/40'} text-[18px]">${r.active ? 'play_circle' : 'pause_circle'}</span>
          <div><p class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(r.name)}</p><p class="text-[9px] text-tan">${r.triggered || 0} times triggered · ${r.lastRun || 'Never'}</p></div>
        </div>
        <button onclick="ROS.views._automate.toggle('${r.id}')" class="px-3 py-1 rounded-lg text-[10px] font-bold ${r.active ? 'neu-ins text-emerald-500' : 'neu-x text-amber-400'}">${r.active ? 'Active' : 'Paused'}</button>
      </div>`).join('')}</div>`;
    }

    function onMount() { ROS.bridge.sendToVelo('fetchAutomations', {}); }
    function onUnmount() { rules = []; }
    function onMessage(type, payload) {
        if (type === 'automationsLoaded') { rules = payload.rules || []; stats = payload.stats || stats; const s = document.getElementById('ros-stage'); if (s) s.innerHTML = render(); }
        if (type === 'automationCreated' || type === 'automationToggled') { showToast(type === 'automationCreated' ? 'Automation created!' : 'Automation updated!'); ROS.bridge.sendToVelo('fetchAutomations', {}); }
    }
    function escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function showToast(msg) { const t = document.createElement('div'); t.className = 'fixed top-16 right-4 z-[9999] px-4 py-2.5 rounded-xl neu-s text-[12px] font-bold text-lmdr-dark flex items-center gap-2'; t.style.animation = 'fadeUp .3s ease'; t.innerHTML = `<span class="material-symbols-outlined text-emerald-500 text-[16px]">check_circle</span>${msg}`; document.body.appendChild(t); setTimeout(() => t.remove(), 3000); }

    ROS.views._automate = {
        create() { /* builder UI — bridge wiring in progress */ },
        useTemplate(name) { showToast('Setting up: ' + name); },
        toggle(id) { ROS.bridge.sendToVelo('toggleAutomation', { id }); }
    };
    ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
