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
    { id: 'contacted', label: 'Contacted', color: 'text-lmdr-blue' },
    { id: 'review', label: 'Review', color: 'text-violet-600' },
    { id: 'offer', label: 'Offer', color: 'text-orange-600' },
    { id: 'hired', label: 'Hired', color: 'text-emerald-600' }
  ];

  let candidates = {};
  let stats = {};

  function render() {
    const columns = STAGES.map(s => `
      <div class="flex flex-col flex-1 min-w-[180px] pipe-column" data-stage="${s.id}" ondragover="ROS.views._pipeline.allowDrop(event)" ondrop="ROS.views._pipeline.drop(event)">
        <div class="px-3 py-2 rounded-lg ${s.id === 'interested' ? 'neu-inset' : 'neu-inset'} text-[10px] font-black uppercase tracking-wider ${s.color} text-center mb-3">
          ${s.label} \u00b7 <span id="pipe-count-${s.id}">0</span>
        </div>
        <div class="flex-1 flex flex-col gap-2 min-h-[100px] pb-10" id="pipe-col-${s.id}"></div>
      </div>`).join('');

    return `
      <div class="flex items-center gap-3 relative z-10">
        <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center hover:scale-105 transition-transform">
          <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-lmdr-yb to-amber-500 flex items-center justify-center">
          <span class="material-symbols-outlined text-lmdr-dark text-[16px]">view_kanban</span>
        </div>
        <h2 class="text-lg font-bold text-lmdr-dark">Candidate Pipeline</h2>
        <span class="text-[11px] text-tan font-medium ml-auto" id="pipe-total">0 total</span>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-4 gap-4 mt-4 relative z-10" id="pipe-stats">
        <div class="neu-xs p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Total</p>
          <h3 class="text-[22px] font-black text-lmdr-dark mt-1" id="stat-total">--</h3>
        </div>
        <div class="neu-xs p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">This Week</p>
          <h3 class="text-[22px] font-black text-lmdr-blue mt-1" id="stat-week">--</h3>
        </div>
        <div class="neu-xs p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Conversion</p>
          <h3 class="text-[22px] font-black text-emerald-600 mt-1" id="stat-conversion">--</h3>
        </div>
        <div class="neu-xs p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Avg Days</p>
          <h3 class="text-[22px] font-black text-lmdr-dark mt-1" id="stat-days">--</h3>
        </div>
      </div>

      <!-- Kanban Board -->
      <div class="flex gap-4 mt-4 flex-1 overflow-x-auto thin-scroll relative z-10 pb-4">${columns}</div>
      
      <!-- Drawer Overlay -->
      <div id="pipe-drawer-overlay" class="fixed inset-0 bg-black/20 z-[90] hidden opacity-0 transition-opacity" onclick="ROS.views._pipeline.closeDrawer()"></div>
      
      <!-- Candidate Detail Drawer -->
      <div id="pipe-drawer" class="fixed top-0 right-0 h-full w-full max-w-[400px] bg-lmdr-light dark:bg-lmdr-dark shadow-2xl border-l border-black/5 z-[100] transform translate-x-full transition-transform duration-300 flex flex-col">
        <!-- Drawer Header -->
        <div class="p-6 border-b border-black/5 flex justify-between items-center bg-white dark:bg-slate-800">
          <div class="flex items-center gap-3">
            <div id="drawer-initials" class="w-10 h-10 rounded-full bg-gradient-to-br from-lmdr-blue to-blue-800 text-white font-bold flex items-center justify-center text-[12px] shadow-sm"></div>
            <div>
              <h3 id="drawer-name" class="font-bold text-[16px] text-lmdr-dark leading-tight">--</h3>
              <p id="drawer-subtitle" class="text-[11px] font-bold text-tan mt-0.5">--</p>
            </div>
          </div>
          <button onclick="ROS.views._pipeline.closeDrawer()" class="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-tan transition-colors">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        
        <!-- Drawer Body -->
        <div class="flex-1 overflow-y-auto thin-scroll p-6 space-y-6">
          <div>
            <h4 class="text-[10px] font-bold uppercase tracking-widest text-tan mb-3">Status</h4>
            <div class="neu-inset rounded-xl p-2 flex gap-2">
              <select id="drawer-status" onchange="ROS.views._pipeline.changeDrawerStatus()" class="flex-1 bg-transparent text-[12px] font-bold text-lmdr-dark focus:outline-none px-2 py-1">
                ${STAGES.map(s => \`<option value="\${s.id}">\${s.label}</option>\`).join('')}
              </select>
            </div>
          </div>

          <div>
            <h4 class="text-[10px] font-bold uppercase tracking-widest text-tan mb-3">Contact Info</h4>
            <div class="neu-x p-4 rounded-xl space-y-3 relative overflow-hidden group">
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded bg-black/5 flex items-center justify-center text-tan"><span class="material-symbols-outlined text-[12px]">phone</span></div>
                <span id="drawer-phone" class="text-[12px] font-bold text-lmdr-dark">--</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded bg-black/5 flex items-center justify-center text-tan"><span class="material-symbols-outlined text-[12px]">mail</span></div>
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
        
        <!-- Drawer Footer -->
        <div class="p-4 border-t border-black/5 bg-white dark:bg-slate-800 flex gap-3">
          <button onclick="ROS.views._pipeline.openNoteModal()" class="flex-1 neu-btn px-4 py-2.5 rounded-xl text-[12px] font-bold text-lmdr-blue">Add Note</button>
          <button class="flex-1 bg-gradient-to-r from-lmdr-blue to-blue-700 text-white px-4 py-2.5 rounded-xl text-[12px] font-bold shadow-md shadow-blue-500/20">Full Profile</button>
        </div>
      </div>
      
      <!-- Add Note Modal -->
      <div id="pipe-notes-modal" class="fixed inset-0 bg-black/50 z-[120] hidden flex items-center justify-center backdrop-blur-sm opacity-0 transition-opacity">
        <div class="neu rounded-2xl w-full max-w-sm overflow-hidden transform scale-95 transition-transform" id="pipe-notes-content">
          <div class="p-5 border-b border-black/5 flex justify-between items-center">
            <h3 class="font-bold text-[15px] text-lmdr-dark">Add Note</h3>
            <button onclick="ROS.views._pipeline.closeNoteModal()" class="text-tan hover:text-lmdr-dark transition"><span class="material-symbols-outlined text-[18px]">close</span></button>
          </div>
          <div class="p-6">
            <textarea id="pipe-new-note" rows="4" class="w-full neu-inset rounded-xl px-4 py-3 text-[13px] font-medium text-lmdr-dark focus:outline-none focus:ring-2 focus:ring-lmdr-blue/50 resize-none" placeholder="Type your note here..."></textarea>
          </div>
          <div class="p-5 border-t border-black/5 flex justify-end gap-3 bg-white/50 dark:bg-black/10">
            <button onclick="ROS.views._pipeline.closeNoteModal()" class="px-4 py-2 text-[12px] font-bold text-tan hover:text-lmdr-dark transition">Cancel</button>
            <button onclick="ROS.views._pipeline.saveNote()" class="bg-lmdr-blue text-white px-5 py-2 rounded-xl text-[12px] font-bold shadow-md shadow-blue-500/20 hover:bg-blue-600 transition">Save Note</button>
          </div>
        </div>
      </div>
    `;
  }

  function onMount() {
    ROS.bridge.sendToVelo('getPipeline', {});
    ROS.bridge.sendToVelo('getStats', {});
  }

  function onUnmount() {
    candidates = {};
  }

  function onMessage(type, data) {
    switch (type) {
      case 'pipelineLoaded':
        if (data && data.candidates) {
          groupCandidates(data.candidates);
          renderColumns();
        }
        break;

      case 'statsLoaded':
        stats = data || {};
        renderStats();
        break;

      case 'statusUpdated':
        showToast('Moved to ' + (data.status || 'new stage'));
        // Refresh pipeline
        ROS.bridge.sendToVelo('getPipeline', {});
        break;

      case 'candidateDetails':
        if (data) renderCandidateDrawerDetails(data);
        break;

      case 'notesAdded':
        showToast('Note saved');
        ROS.views._pipeline.closeNoteModal();
        let candidateId = document.getElementById('pipe-drawer').dataset.candidateId;
        if (candidateId) ROS.bridge.sendToVelo('getCandidateDetails', { candidateId: candidateId });
        break;
    }
  }

  function groupCandidates(list) {
    candidates = {};
    STAGES.forEach(s => candidates[s.id] = []);
    (list || []).forEach(c => {
      const stage = (c.status || c.stage || 'interested').toLowerCase();
      if (candidates[stage]) {
        candidates[stage].push(c);
      } else {
        candidates['interested'].push(c);
      }
    });
  }

  function renderColumns() {
    let total = 0;
    STAGES.forEach(s => {
      const col = document.getElementById('pipe-col-' + s.id);
      const count = document.getElementById('pipe-count-' + s.id);
      const items = candidates[s.id] || [];
      total += items.length;

      if (count) count.textContent = items.length;
      if (col) {
        col.innerHTML = items.length === 0
          ? '<div class="text-center text-[10px] text-tan/50 py-4 border-2 border-dashed border-black/5 dark:border-white/5 rounded-xl m-2">Drop Here</div>'
          : items.map(c => renderCard(c, s.id)).join('');
      }
    });

    const totalEl = document.getElementById('pipe-total');
    if (totalEl) totalEl.textContent = total + ' total';
  }

  function renderCard(candidate, stage) {
    const name = candidate.name || candidate.driver_name || 'Unknown';
    const initName = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const details = candidate.cdl_type || candidate.location || 'CDL-A Driver';
    const id = candidate._id || candidate.id || '';
    const badge = candidate.badge || '';
    const badgeColors = {
      'New Match': 'bg-amber-500/10 text-amber-600',
      'AI Found': 'bg-blue-500/10 text-lmdr-blue',
      'Replied': 'bg-emerald-500/10 text-emerald-600'
    };
    const badgeClass = badgeColors[badge] || 'bg-black/5 text-slate-500';

    return `
      <div draggable="true" ondragstart="ROS.views._pipeline.drag(event)" id="pipe-card-${id}" data-id="${id}"
           class="p-4 neu-x rounded-xl cursor-grab hover:shadow-neu-hover transition-all group bg-white dark:bg-slate-800"
           onclick="ROS.views._pipeline.viewCandidate('${id}')">
        <div class="flex gap-3 relative">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-[10px] font-black text-lmdr-dark flex-none">${initName}</div>
          <div class="flex-1 min-w-0">
            <div class="text-[12px] font-bold text-lmdr-dark truncate group-hover:text-lmdr-blue transition-colors">${escapeHtml(name)}</div>
            <div class="text-[10px] text-tan mt-0.5 truncate">${escapeHtml(details)}</div>
            ${badge ? `<div class="mt-2 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-block ${badgeClass}">${escapeHtml(badge)}</div>` : ''}
          </div>
        </div>
      </div>`;
  }

  function renderStats() {
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('stat-total', stats.totalCandidates || stats.total || '--');
    el('stat-week', stats.thisWeek || '--');
    el('stat-conversion', stats.conversionRate ? stats.conversionRate + '%' : '--');
    el('stat-days', stats.avgDays || '--');
  }

  function renderCandidateDrawerDetails(data) {
    const name = data.name || data.driver_name || 'Unknown';
    document.getElementById('drawer-name').textContent = name;
    document.getElementById('drawer-initials').textContent = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('drawer-subtitle').textContent = data.location || data.cdl_type || 'Potential Candidate';

    document.getElementById('drawer-phone').textContent = data.phone || 'No phone provided';
    document.getElementById('drawer-email').textContent = data.email || 'No email provided';

    let select = document.getElementById('drawer-status');
    if (select) select.value = (data.status || 'interested').toLowerCase();

    // Notes
    let notesContainer = document.getElementById('drawer-notes');
    if (data.notes && data.notes.length > 0) {
      notesContainer.innerHTML = data.notes.map(n => `
        <div class="neu-inset p-3 rounded-xl border border-white/50 dark:border-black/50">
          <p class="text-[11px] text-lmdr-dark leading-relaxed">${escapeHtml(n.text || n.content)}</p>
          <p class="text-[9px] font-bold text-tan mt-2 uppercase tracking-wider">${new Date(n.date || n.createdAt).toLocaleString()} \u00b7 ${n.author || 'Me'}</p>
        </div>
      `).join('');
    } else {
      notesContainer.innerHTML = `<div class="text-[11px] font-medium text-tan italic text-center py-4 bg-black/5 rounded-xl border border-dashed border-black/10">No notes yet. Click 'Add Note' to create one.</div>`;
    }

    let drawer = document.getElementById('pipe-drawer');
    drawer.dataset.candidateId = data._id || data.id;

    // Show Drawer
    let overlay = document.getElementById('pipe-drawer-overlay');
    overlay.classList.remove('hidden');
    void overlay.offsetWidth;
    overlay.classList.remove('opacity-0');
    drawer.classList.remove('translate-x-full');
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'fixed top-[80px] right-6 z-[9999] px-4 py-3 rounded-xl neu shadow-xl border border-white/20 text-[12px] font-bold text-lmdr-dark flex items-center gap-2';
    t.innerHTML = `<span class="material-symbols-outlined text-emerald-500 text-[16px]">check_circle</span> ${escapeHtml(msg)}`;
    t.style.animation = 'fadeUp .3s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(-10px)';
      t.style.transition = 'all 0.3s';
      setTimeout(() => t.remove(), 300);
    }, 3000);
  }

  function escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // Drag and drop state
  let draggedCardId = null;

  // Public API
  ROS.views._pipeline = {
    viewCandidate: function (id) {
      ROS.bridge.sendToVelo('getCandidateDetails', { candidateId: id });
    },
    updateStatus: function (id, status) {
      ROS.bridge.sendToVelo('updateCandidateStatus', { candidateId: id, status });
    },
    closeDrawer: function () {
      let drawer = document.getElementById('pipe-drawer');
      let overlay = document.getElementById('pipe-drawer-overlay');
      if (drawer) drawer.classList.add('translate-x-full');
      if (overlay) {
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('hidden'), 300);
      }
    },
    changeDrawerStatus: function () {
      let candidateId = document.getElementById('pipe-drawer').dataset.candidateId;
      let newStatus = document.getElementById('drawer-status').value;
      if (candidateId && newStatus) {
        this.updateStatus(candidateId, newStatus);
      }
    },
    openNoteModal: function () {
      let modal = document.getElementById('pipe-notes-modal');
      let content = document.getElementById('pipe-notes-content');
      document.getElementById('pipe-new-note').value = '';
      modal.classList.remove('hidden');
      void modal.offsetWidth;
      modal.classList.remove('opacity-0');
      content.classList.remove('scale-95');
    },
    closeNoteModal: function () {
      let modal = document.getElementById('pipe-notes-modal');
      let content = document.getElementById('pipe-notes-content');
      modal.classList.add('opacity-0');
      content.classList.add('scale-95');
      setTimeout(() => modal.classList.add('hidden'), 200);
    },
    saveNote: function () {
      let text = document.getElementById('pipe-new-note').value.trim();
      let candidateId = document.getElementById('pipe-drawer').dataset.candidateId;
      if (text && candidateId) {
        ROS.bridge.sendToVelo('addCandidateNote', { candidateId: candidateId, note: text });
        document.getElementById('pipe-new-note').value = 'Saving...';
      }
    },
    drag: function (ev) {
      draggedCardId = ev.target.dataset.id;
      ev.dataTransfer.setData("text", ev.target.id);
      ev.target.classList.add('opacity-50');
    },
    allowDrop: function (ev) {
      ev.preventDefault();
      // Add a slight highlight class if over column
      let col = ev.target.closest('.pipe-column');
      if (col) col.classList.add('bg-black/5', 'rounded-xl');
    },
    drop: function (ev) {
      ev.preventDefault();
      let col = ev.target.closest('.pipe-column');
      if (col) {
        // cleanup highlights
        document.querySelectorAll('.pipe-column').forEach(c => c.classList.remove('bg-black/5', 'rounded-xl'));
        let newStage = col.dataset.stage;
        if (draggedCardId && newStage) {
          ROS.views._pipeline.updateStatus(draggedCardId, newStage);
        }
      }
    }
  };

  // Setup drag end listener globally to remove opacity
  document.addEventListener('dragend', function (e) {
    if (e.target.classList && e.target.classList.contains('cursor-grab')) {
      e.target.classList.remove('opacity-50');
      document.querySelectorAll('.pipe-column').forEach(c => c.classList.remove('bg-black/5', 'rounded-xl'));
    }
  });

  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
