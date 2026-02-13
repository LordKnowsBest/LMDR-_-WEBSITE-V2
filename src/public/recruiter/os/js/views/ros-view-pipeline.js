// ============================================================================
// ROS-VIEW-PIPELINE — Kanban Pipeline
// Extracted from Recruiter_Pipeline_Page.html
// ============================================================================

(function() {
  'use strict';

  const VIEW_ID = 'pipeline';
  const MESSAGES = [
    'pipelineLoaded', 'statusUpdated', 'statsLoaded', 'candidateDetails',
    'notesAdded', 'error'
  ];

  const STAGES = [
    { id: 'interested', label: 'Interested', color: 'text-amber-600' },
    { id: 'contacted', label: 'Contacted', color: 'text-lmdr-blue' },
    { id: 'review',    label: 'Review',    color: 'text-violet-600' },
    { id: 'offer',     label: 'Offer',     color: 'text-orange-600' },
    { id: 'hired',     label: 'Hired',     color: 'text-emerald-600' }
  ];

  let candidates = {};
  let stats = {};

  function render() {
    const columns = STAGES.map(s => `
      <div class="flex flex-col flex-1 min-w-[180px]">
        <div class="px-3 py-2 rounded-lg neu-ins text-[10px] font-black uppercase tracking-wider ${s.color} text-center mb-3">
          ${s.label} \u00b7 <span id="pipe-count-${s.id}">0</span>
        </div>
        <div class="flex-1 flex flex-col gap-2 min-h-[100px]" id="pipe-col-${s.id}" data-stage="${s.id}"></div>
      </div>`).join('');

    return `
      <div class="flex items-center gap-3">
        <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-lmdr-yb to-amber-500 flex items-center justify-center">
          <span class="material-symbols-outlined text-lmdr-dark text-[16px]">view_kanban</span>
        </div>
        <h2 class="text-lg font-bold text-lmdr-dark">Candidate Pipeline</h2>
        <span class="text-[11px] text-tan font-medium ml-auto" id="pipe-total">0 total</span>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-4 gap-4 mt-4" id="pipe-stats">
        <div class="neu-s p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Total</p>
          <h3 class="text-[22px] font-black text-lmdr-dark mt-1" id="stat-total">--</h3>
        </div>
        <div class="neu-s p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">This Week</p>
          <h3 class="text-[22px] font-black text-lmdr-blue mt-1" id="stat-week">--</h3>
        </div>
        <div class="neu-s p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Conversion</p>
          <h3 class="text-[22px] font-black text-sg mt-1" id="stat-conversion">--</h3>
        </div>
        <div class="neu-s p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Avg Days</p>
          <h3 class="text-[22px] font-black text-lmdr-dark mt-1" id="stat-days">--</h3>
        </div>
      </div>

      <!-- Kanban Board -->
      <div class="grid grid-cols-5 gap-4 mt-4 flex-1 overflow-x-auto">${columns}</div>`;
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
        // Refresh pipeline
        ROS.bridge.sendToVelo('getPipeline', {});
        break;

      case 'candidateDetails':
        if (data) showCandidateDetail(data);
        break;

      case 'notesAdded':
        showToast('Note added');
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
          ? '<div class="text-center text-[10px] text-tan/50 py-4">Empty</div>'
          : items.map(c => renderCard(c, s.id)).join('');
      }
    });

    const totalEl = document.getElementById('pipe-total');
    if (totalEl) totalEl.textContent = total + ' total';
  }

  function renderCard(candidate, stage) {
    const name = candidate.name || candidate.driver_name || 'Unknown';
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const details = candidate.cdl_type || candidate.location || '';
    const id = candidate._id || candidate.id || '';
    const badge = candidate.badge || '';
    const badgeColors = {
      'New Match': 'bg-amber-100 text-amber-700',
      'AI Found': 'bg-blue-100 text-blue-700',
      'Replied': 'bg-emerald-100 text-emerald-700',
      'Docs Pending': 'bg-violet-100 text-violet-700',
      'Onboarding': 'bg-emerald-100 text-emerald-700'
    };
    const badgeClass = badgeColors[badge] || 'bg-slate-100 text-slate-600';

    return `
      <div class="p-3 neu-x rounded-xl cursor-pointer hover:shadow-neu-s transition-shadow"
           onclick="ROS.views._pipeline.viewCandidate('${id}')">
        <div class="text-[12px] font-bold">${escapeHtml(name)}</div>
        <div class="text-[10px] text-tan mt-1">${escapeHtml(details)}</div>
        ${badge ? `<span class="inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold ${badgeClass}">${escapeHtml(badge)}</span>` : ''}
      </div>`;
  }

  function renderStats() {
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('stat-total', stats.totalCandidates || stats.total || '--');
    el('stat-week', stats.thisWeek || '--');
    el('stat-conversion', stats.conversionRate ? stats.conversionRate + '%' : '--');
    el('stat-days', stats.avgDays || '--');
  }

  function showCandidateDetail(data) {
    showToast('Viewing: ' + (data.name || data.driver_name || 'candidate'));
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'fixed top-16 right-4 z-[9999] px-4 py-2.5 rounded-xl neu-s text-[12px] font-bold text-lmdr-dark';
    t.style.animation = 'fadeUp .3s ease';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  function escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // Public API
  ROS.views._pipeline = {
    viewCandidate: function(id) {
      ROS.bridge.sendToVelo('getCandidateDetails', { candidateId: id });
    },
    updateStatus: function(id, status) {
      ROS.bridge.sendToVelo('updateCandidateStatus', { candidateId: id, status });
    }
  };

  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
