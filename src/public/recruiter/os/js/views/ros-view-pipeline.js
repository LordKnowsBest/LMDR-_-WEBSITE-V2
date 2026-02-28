// ============================================================================
// ROS-VIEW-PIPELINE — Kanban Pipeline
// Extracted from Recruiter_Pipeline_Page.html
// ============================================================================

(function () {
  'use strict';

  const VIEW_ID = 'pipeline';
  const MESSAGES = [
    'pipelineLoaded', 'statusUpdated', 'statsLoaded', 'candidateDetails',
    'notesAdded', 'error'
  ];

  const STAGES = [
    { id: 'interested', label: 'Interested', color: 'text-amber-600' },
    { id: 'contacted',  label: 'Contacted',  color: 'text-lmdr-blue' },
    { id: 'review',     label: 'Review',     color: 'text-violet-600' },
    { id: 'offer',      label: 'Offer',      color: 'text-orange-600' },
    { id: 'hired',      label: 'Hired',      color: 'text-emerald-600' }
  ];

  let candidates = {};
  let stats = {};

  // All user-supplied strings are passed through escapeHtml() before HTML interpolation
  function escapeHtml(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  function showToast(msg, isError) {
    const t = document.createElement('div');
    t.className = 'fixed top-[80px] right-6 z-[9999] px-4 py-3 rounded-xl neu text-[12px] font-bold text-lmdr-dark flex items-center gap-2';
    t.style.animation = 'fadeUp .3s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined text-[16px] ' + (isError ? 'text-red-500' : 'text-emerald-500');
    icon.textContent = isError ? 'error' : 'check_circle';
    t.appendChild(icon);
    t.appendChild(document.createTextNode(' ' + msg));
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(-10px)';
      t.style.transition = 'all 0.3s';
      setTimeout(() => t.remove(), 300);
    }, 3000);
  }

  // ── Render (all interpolated values are escaped) ──
  function render() {
    const columns = STAGES.map(s => `
      <div class="flex flex-col flex-1 min-w-[180px] pipe-column" data-stage="${s.id}"
           ondragover="ROS.views._pipeline.allowDrop(event)"
           ondrop="ROS.views._pipeline.drop(event)">
        <div class="px-3 py-2 rounded-lg neu-in text-[10px] font-black uppercase tracking-wider ${s.color} text-center mb-3">
          ${s.label} &middot; <span id="pipe-count-${s.id}">0</span>
        </div>
        <div class="flex-1 flex flex-col gap-2 min-h-[100px] pb-10" id="pipe-col-${s.id}"></div>
      </div>`).join('');

    return `
      <div class="flex items-center gap-3 relative z-10">
        <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center hover:scale-105 transition-transform">
          <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-[16px]">view_kanban</span>
        </div>
        <h2 class="text-lg font-bold text-lmdr-dark">Candidate Pipeline</h2>
        <span class="text-[11px] text-tan font-medium ml-auto" id="pipe-total">0 total</span>
      </div>

      <div class="grid grid-cols-4 gap-4 mt-4 relative z-10">
        <div class="neu-x p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Total</p>
          <h3 class="text-[22px] font-black text-lmdr-dark mt-1" id="stat-total">--</h3>
        </div>
        <div class="neu-x p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">This Week</p>
          <h3 class="text-[22px] font-black text-lmdr-blue mt-1" id="stat-week">--</h3>
        </div>
        <div class="neu-x p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Conversion</p>
          <h3 class="text-[22px] font-black text-emerald-600 mt-1" id="stat-conversion">--</h3>
        </div>
        <div class="neu-x p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Avg Days</p>
          <h3 class="text-[22px] font-black text-lmdr-dark mt-1" id="stat-days">--</h3>
        </div>
      </div>

      <div class="flex gap-4 mt-4 flex-1 overflow-x-auto thin-scroll relative z-10 pb-4">${columns}</div>

      <div id="pipe-drawer-overlay" class="fixed inset-0 bg-black/20 z-[90] hidden opacity-0 transition-opacity"
           onclick="ROS.views._pipeline.closeDrawer()"></div>

      <div id="pipe-drawer"
           class="fixed top-0 right-0 h-full w-full max-w-[400px] bg-beige shadow-2xl border-l border-tan/20 z-[100] transform translate-x-full transition-transform duration-300 flex flex-col">
        <div class="p-6 border-b border-tan/15 flex justify-between items-center bg-beige">
          <div class="flex items-center gap-3">
            <div id="drawer-initials" class="w-10 h-10 rounded-full bg-gradient-to-br from-lmdr-blue to-lmdr-deep text-white font-bold flex items-center justify-center text-[12px]"></div>
            <div>
              <h3 id="drawer-name" class="font-bold text-[16px] text-lmdr-dark leading-tight">--</h3>
              <p id="drawer-subtitle" class="text-[11px] font-bold text-tan mt-0.5">--</p>
            </div>
          </div>
          <button onclick="ROS.views._pipeline.closeDrawer()" class="w-8 h-8 rounded-full neu-x flex items-center justify-center text-tan hover:text-lmdr-dark transition-colors">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto thin-scroll p-6 space-y-6">
          <div>
            <h4 class="text-[10px] font-bold uppercase tracking-widest text-tan mb-3">Status</h4>
            <div class="neu-in rounded-xl p-2">
              <select id="drawer-status" onchange="ROS.views._pipeline.changeDrawerStatus()"
                      class="w-full bg-transparent text-[12px] font-bold text-lmdr-dark focus:outline-none px-2 py-1 border-none">
                ${STAGES.map(s => `<option value="${s.id}">${s.label}</option>`).join('')}
              </select>
            </div>
          </div>
          <div>
            <h4 class="text-[10px] font-bold uppercase tracking-widest text-tan mb-3">Contact Info</h4>
            <div class="neu-x p-4 rounded-xl space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded neu-ins flex items-center justify-center text-tan flex-none">
                  <span class="material-symbols-outlined text-[12px]">phone</span>
                </div>
                <span id="drawer-phone" class="text-[12px] font-bold text-lmdr-dark">--</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded neu-ins flex items-center justify-center text-tan flex-none">
                  <span class="material-symbols-outlined text-[12px]">mail</span>
                </div>
                <span id="drawer-email" class="text-[12px] font-bold text-lmdr-dark break-all">--</span>
              </div>
            </div>
          </div>
          <div>
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-[10px] font-bold uppercase tracking-widest text-tan">Recruiter Notes</h4>
              <button onclick="ROS.views._pipeline.openNoteModal()" class="text-[10px] font-bold text-lmdr-blue hover:underline">Add Note</button>
            </div>
            <div id="drawer-notes" class="space-y-3">
              <div class="text-[11px] text-tan italic text-center py-4">No notes yet.</div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-tan/15 bg-beige flex gap-3">
          <button onclick="ROS.views._pipeline.openNoteModal()" class="flex-1 neu-x px-4 py-2.5 rounded-xl text-[12px] font-bold text-lmdr-blue">Add Note</button>
          <button onclick="ROS.views._pipeline.viewFullProfile()" class="flex-1 bg-gradient-to-r from-lmdr-blue to-lmdr-deep text-white px-4 py-2.5 rounded-xl text-[12px] font-bold">Full Profile</button>
        </div>
      </div>

      <div id="pipe-notes-modal" class="fixed inset-0 bg-black/50 z-[120] hidden flex items-center justify-center backdrop-blur-sm opacity-0 transition-opacity">
        <div class="neu rounded-2xl w-full max-w-sm overflow-hidden transform scale-95 transition-transform" id="pipe-notes-content">
          <div class="p-5 border-b border-tan/15 flex justify-between items-center">
            <h3 class="font-bold text-[15px] text-lmdr-dark">Add Note</h3>
            <button onclick="ROS.views._pipeline.closeNoteModal()" class="text-tan hover:text-lmdr-dark transition">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div class="p-6">
            <textarea id="pipe-new-note" rows="4"
              class="w-full neu-in rounded-xl px-4 py-3 text-[13px] font-medium text-lmdr-dark bg-transparent border-none placeholder-tan/50 focus:outline-none focus:ring-2 focus:ring-lmdr-blue/50 resize-none"
              placeholder="Type your note here..."></textarea>
          </div>
          <div class="p-5 border-t border-tan/15 flex justify-end gap-3">
            <button onclick="ROS.views._pipeline.closeNoteModal()" class="px-4 py-2 text-[12px] font-bold text-tan hover:text-lmdr-dark transition">Cancel</button>
            <button onclick="ROS.views._pipeline.saveNote()" class="bg-lmdr-blue text-white px-5 py-2 rounded-xl text-[12px] font-bold hover:bg-blue-600 transition">Save Note</button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Lifecycle ──
  function onMount() {
    ROS.bridge.sendToVelo('getPipeline', {});
    ROS.bridge.sendToVelo('getStats', {});
  }

  function onUnmount() {
    candidates = {};
    stats = {};
  }

  function onMessage(type, data) {
    switch (type) {
      case 'pipelineLoaded':
        if (data && data.candidates) { groupCandidates(data.candidates); renderColumns(); }
        break;
      case 'statsLoaded':
        stats = data || {};
        renderStats();
        break;
      case 'statusUpdated':
        showToast('Moved to ' + (data && data.status ? data.status : 'new stage'));
        ROS.bridge.sendToVelo('getPipeline', {});
        break;
      case 'candidateDetails':
        if (data) renderCandidateDrawerDetails(data);
        break;
      case 'notesAdded': {
        showToast('Note saved');
        ROS.views._pipeline.closeNoteModal();
        const drawer = document.getElementById('pipe-drawer');
        const cid = drawer ? drawer.dataset.candidateId : null;
        if (cid) ROS.bridge.sendToVelo('getCandidateDetails', { candidateId: cid });
        break;
      }
      case 'error':
        showToast((data && data.message) || 'Something went wrong', true);
        break;
    }
  }

  function groupCandidates(list) {
    candidates = {};
    STAGES.forEach(s => { candidates[s.id] = []; });
    (list || []).forEach(c => {
      const stage = (c.status || c.stage || 'interested').toLowerCase();
      if (candidates[stage]) { candidates[stage].push(c); }
      else { candidates['interested'].push(c); }
    });
  }

  function renderColumns() {
    let total = 0;
    STAGES.forEach(s => {
      const col   = document.getElementById('pipe-col-' + s.id);
      const count = document.getElementById('pipe-count-' + s.id);
      const items = candidates[s.id] || [];
      total += items.length;
      if (count) count.textContent = items.length;
      if (col) {
        col.innerHTML = items.length === 0
          ? '<div class="text-center text-[10px] text-tan/50 py-4 border-2 border-dashed border-tan/20 rounded-xl m-2">Drop here</div>'
          : items.map(c => renderCard(c)).join('');
      }
    });
    const totalEl = document.getElementById('pipe-total');
    if (totalEl) totalEl.textContent = total + ' total';
  }

  function renderCard(candidate) {
    const name     = candidate.name || candidate.driver_name || 'Unknown';
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const details  = candidate.cdl_type || candidate.location || 'CDL-A Driver';
    const id       = candidate._id || candidate.id || '';
    const badge    = candidate.badge || '';
    const badgeColors = {
      'New Match': 'bg-amber-500/10 text-amber-600',
      'AI Found':  'bg-blue-500/10 text-lmdr-blue',
      'Replied':   'bg-emerald-500/10 text-emerald-600'
    };
    const badgeClass = badgeColors[badge] || 'bg-tan/10 text-tan';
    const badgeHtml  = badge ? `<div class="mt-2 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-block ${badgeClass}">${escapeHtml(badge)}</div>` : '';

    return `
      <div draggable="true" ondragstart="ROS.views._pipeline.drag(event)"
           id="pipe-card-${escapeHtml(id)}" data-id="${escapeHtml(id)}"
           class="p-4 neu-x rounded-xl cursor-grab hover:scale-[1.01] transition-transform group"
           onclick="ROS.views._pipeline.viewCandidate('${escapeHtml(id)}')">
        <div class="flex gap-3">
          <div class="w-8 h-8 rounded-full neu-ins flex items-center justify-center text-[10px] font-black text-tan flex-none">${escapeHtml(initials)}</div>
          <div class="flex-1 min-w-0">
            <div class="text-[12px] font-bold text-lmdr-dark truncate group-hover:text-lmdr-blue transition-colors">${escapeHtml(name)}</div>
            <div class="text-[10px] text-tan mt-0.5 truncate">${escapeHtml(details)}</div>
            ${badgeHtml}
          </div>
        </div>
      </div>`;
  }

  function renderStats() {
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('stat-total',      stats.totalCandidates || stats.total || '--');
    el('stat-week',       stats.thisWeek || '--');
    el('stat-conversion', stats.conversionRate ? stats.conversionRate + '%' : '--');
    el('stat-days',       stats.avgDays || '--');
  }

  function renderCandidateDrawerDetails(data) {
    const name = data.name || data.driver_name || 'Unknown';
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    set('drawer-name',     name);
    set('drawer-initials', name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase());
    set('drawer-subtitle', data.location || data.cdl_type || 'Potential Candidate');
    set('drawer-phone',    data.phone || 'No phone provided');
    set('drawer-email',    data.email || 'No email provided');

    const statusEl = document.getElementById('drawer-status');
    if (statusEl) statusEl.value = (data.status || 'interested').toLowerCase();

    const notesEl = document.getElementById('drawer-notes');
    if (notesEl) {
      if (data.notes && data.notes.length > 0) {
        // Notes: user content sanitized via escapeHtml
        notesEl.innerHTML = data.notes.map(n => {
          const txt    = escapeHtml(n.text || n.content || '');
          const author = escapeHtml(n.author || 'Me');
          const date   = (n.date || n.createdAt) ? new Date(n.date || n.createdAt).toLocaleString() : '';
          return `<div class="neu-in p-3 rounded-xl"><p class="text-[11px] text-lmdr-dark leading-relaxed">${txt}</p><p class="text-[9px] font-bold text-tan mt-2 uppercase tracking-wider">${date} &middot; ${author}</p></div>`;
        }).join('');
      } else {
        notesEl.innerHTML = '<div class="text-[11px] font-medium text-tan italic text-center py-4 neu-ins rounded-xl">No notes yet. Click Add Note to create one.</div>';
      }
    }

    const drawer = document.getElementById('pipe-drawer');
    if (drawer) drawer.dataset.candidateId = data._id || data.id || '';

    const overlay = document.getElementById('pipe-drawer-overlay');
    if (overlay) { overlay.classList.remove('hidden'); void overlay.offsetWidth; overlay.classList.remove('opacity-0'); }
    if (drawer)  { drawer.classList.remove('translate-x-full'); }
  }

  // ── Drag-and-drop ──
  let draggedCardId = null;

  document.addEventListener('dragend', function (e) {
    if (e.target.classList && e.target.classList.contains('cursor-grab')) {
      e.target.classList.remove('opacity-50');
      document.querySelectorAll('.pipe-column').forEach(c => c.classList.remove('bg-tan/5', 'rounded-xl'));
    }
  });

  // ── Public API ──
  ROS.views._pipeline = {
    viewCandidate: function (id) {
      ROS.bridge.sendToVelo('getCandidateDetails', { candidateId: id });
    },
    viewFullProfile: function () {
      const drawer = document.getElementById('pipe-drawer');
      const nameEl = document.getElementById('drawer-name');
      const statEl = document.getElementById('drawer-status');
      const cid    = drawer ? drawer.dataset.candidateId : null;
      if (!ROS.state) ROS.state = {};
      ROS.state.lifecycleContext = {
        driverId:   cid,
        driverName: nameEl ? nameEl.textContent : '',
        status:     statEl ? statEl.value : ''
      };
      this.closeDrawer();
      ROS.views.showView('lifecycle');
    },
    updateStatus: function (id, status) {
      ROS.bridge.sendToVelo('updateCandidateStatus', { candidateId: id, status });
    },
    closeDrawer: function () {
      const drawer  = document.getElementById('pipe-drawer');
      const overlay = document.getElementById('pipe-drawer-overlay');
      if (drawer)  drawer.classList.add('translate-x-full');
      if (overlay) { overlay.classList.add('opacity-0'); setTimeout(() => overlay.classList.add('hidden'), 300); }
    },
    changeDrawerStatus: function () {
      const drawer = document.getElementById('pipe-drawer');
      const select = document.getElementById('drawer-status');
      const cid    = drawer ? drawer.dataset.candidateId : null;
      const status = select ? select.value : null;
      if (cid && status) this.updateStatus(cid, status);
    },
    openNoteModal: function () {
      const modal   = document.getElementById('pipe-notes-modal');
      const content = document.getElementById('pipe-notes-content');
      const input   = document.getElementById('pipe-new-note');
      if (input) input.value = '';
      if (modal)   { modal.classList.remove('hidden'); void modal.offsetWidth; modal.classList.remove('opacity-0'); }
      if (content) content.classList.remove('scale-95');
    },
    closeNoteModal: function () {
      const modal   = document.getElementById('pipe-notes-modal');
      const content = document.getElementById('pipe-notes-content');
      if (modal)   modal.classList.add('opacity-0');
      if (content) content.classList.add('scale-95');
      setTimeout(() => { if (modal) modal.classList.add('hidden'); }, 200);
    },
    saveNote: function () {
      const input  = document.getElementById('pipe-new-note');
      const drawer = document.getElementById('pipe-drawer');
      const text   = input  ? input.value.trim() : '';
      const cid    = drawer ? drawer.dataset.candidateId : null;
      if (text && cid) {
        ROS.bridge.sendToVelo('addCandidateNote', { candidateId: cid, note: text });
        if (input) input.value = 'Saving...';
      }
    },
    drag: function (ev) {
      draggedCardId = ev.target.dataset.id;
      ev.dataTransfer.setData('text', ev.target.id);
      ev.target.classList.add('opacity-50');
    },
    allowDrop: function (ev) {
      ev.preventDefault();
      const col = ev.target.closest('.pipe-column');
      if (col) col.classList.add('bg-tan/5', 'rounded-xl');
    },
    drop: function (ev) {
      ev.preventDefault();
      document.querySelectorAll('.pipe-column').forEach(c => c.classList.remove('bg-tan/5', 'rounded-xl'));
      const col = ev.target.closest('.pipe-column');
      if (col && draggedCardId) this.updateStatus(draggedCardId, col.dataset.stage);
    }
  };

  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
