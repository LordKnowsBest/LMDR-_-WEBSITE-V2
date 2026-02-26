// ============================================================================
// ROS-VIEW-ORIENT — Orientation Scheduling
// ============================================================================

(function () {
    'use strict';

    const VIEW_ID = 'orient';
    const MESSAGES = ['orientationsLoaded', 'orientationScheduled'];

    let sessions = [];
    let stats = { upcoming: 0, completed: 0, noShow: 0, capacity: 0 };

    function render() {
        return `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
          </button>
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[16px]">event_available</span>
          </div>
          <h2 class="text-lg font-bold text-lmdr-dark">Orientation</h2>
        </div>
        <button onclick="ROS.views._orient.schedule()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[12px] font-bold">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">add</span>Schedule Session
        </button>
      </div>

      <div class="grid grid-cols-4 gap-3 mt-4">
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-green-500 text-[18px]">event</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.upcoming}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Upcoming</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-emerald-500 text-[18px]">task_alt</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.completed}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Completed</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-red-400 text-[18px]">person_off</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.noShow}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">No-Shows</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-sky-400 text-[18px]">groups</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.capacity}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Avg Capacity</p>
        </div>
      </div>

      <div class="mt-4">
        <h3 class="text-[12px] font-bold text-lmdr-dark mb-2">Orientation Sessions</h3>
        ${renderSessions()}
      </div>`;
    }

    function renderSessions() {
        if (!sessions.length) return `<div class="neu-in rounded-xl p-8 text-center"><span class="material-symbols-outlined text-tan/30 text-[32px]">event</span><p class="text-[12px] text-tan mt-2">No orientation sessions scheduled.</p></div>`;
        return `<div class="space-y-2">${sessions.map(s => `
      <div class="neu-x rounded-xl p-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg neu-ins flex flex-col items-center justify-center">
            <span class="text-[10px] font-black text-lmdr-blue">${(s.date || 'TBD').split(' ')[0] || 'TBD'}</span>
            <span class="text-[8px] text-tan">${s.time || ''}</span>
          </div>
          <div><p class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(s.title || 'Orientation')}</p><p class="text-[9px] text-tan">${s.location || 'Virtual'} · ${s.attendees || 0} attendees</p></div>
        </div>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${s.status === 'completed' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-green-500/15 text-green-500'}">${s.status || 'upcoming'}</span>
      </div>`).join('')}</div>`;
    }

    function onMount() { ROS.bridge.sendToVelo('fetchOrientations', {}); }
    function onUnmount() { sessions = []; }
    function onMessage(type, payload) {
        if (type === 'orientationsLoaded') { sessions = payload.sessions || []; stats = payload.stats || stats; const s = document.getElementById('ros-stage'); if (s) s.innerHTML = render(); }
        if (type === 'orientationScheduled') { showToast('Orientation scheduled!'); ROS.bridge.sendToVelo('fetchOrientations', {}); }
    }
    function escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function showToast(msg) { const t = document.createElement('div'); t.className = 'fixed top-16 right-4 z-[9999] px-4 py-2.5 rounded-xl neu-s text-[12px] font-bold text-lmdr-dark flex items-center gap-2'; t.style.animation = 'fadeUp .3s ease'; t.innerHTML = `<span class="material-symbols-outlined text-emerald-500 text-[16px]">check_circle</span>${msg}`; document.body.appendChild(t); setTimeout(() => t.remove(), 3000); }

    ROS.views._orient = { schedule() { showToast('Orientation scheduler — opening...'); } };
    ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
