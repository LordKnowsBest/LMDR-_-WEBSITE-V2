// ============================================================================
// ROS-VIEW-ONBOARD — Onboarding Dashboard
// Stage counters, active workflow list with progress bars
// ============================================================================

(function() {
  'use strict';

  const VIEW_ID = 'onboard';
  const MESSAGES = ['workflowsLoaded', 'workflowUpdated', 'documentStatusLoaded'];

  const STAGES = [
    { id: 'offer_sent',  label: 'Offer Sent',  icon: 'send',            color: 'text-lmdr-blue' },
    { id: 'docs_req',    label: 'Docs Req',     icon: 'description',     color: 'text-violet-600' },
    { id: 'bg_check',    label: 'BG Check',     icon: 'verified_user',   color: 'text-amber-600' },
    { id: 'drug_test',   label: 'Drug Test',    icon: 'science',         color: 'text-orange-600' },
    { id: 'orient',      label: 'Orientation',  icon: 'school',          color: 'text-teal-600' },
    { id: 'done',        label: 'Done',         icon: 'check_circle',    color: 'text-sg' }
  ];

  let workflows = [];
  let stageCounts = {};

  function render() {
    const stageCards = STAGES.map(s => `
      <div class="neu-s p-4 rounded-xl text-center">
        <span class="material-symbols-outlined ${s.color} text-[20px]">${s.icon}</span>
        <h3 class="text-[22px] font-black text-lmdr-dark mt-1" id="onb-count-${s.id}">0</h3>
        <p class="text-[9px] font-bold uppercase tracking-widest text-tan mt-1">${s.label}</p>
      </div>`).join('');

    return `
      <div class="flex items-center gap-3">
        <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-[16px]">task_alt</span>
        </div>
        <h2 class="text-lg font-bold text-lmdr-dark">Onboarding Dashboard</h2>
        <span class="ml-auto text-[11px] text-tan font-medium" id="onb-total">0 active</span>
      </div>

      <!-- Stage Counters -->
      <div class="grid grid-cols-6 gap-3 mt-4">${stageCards}</div>

      <!-- Active Workflows -->
      <div class="neu rounded-2xl p-5 mt-4 flex-1">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-[14px] font-bold text-lmdr-dark">Active Workflows</h3>
          <span class="text-[10px] text-tan font-medium" id="onb-workflow-count">0 in progress</span>
        </div>
        <div class="flex flex-col gap-3" id="onb-workflow-list">
          <div class="text-center py-8 text-tan text-[13px]">Loading onboarding data...</div>
        </div>
      </div>`;
  }

  function onMount() {
    ROS.bridge.sendToVelo('getWorkflows', {});
  }

  function onUnmount() {
    workflows = [];
    stageCounts = {};
  }

  function onMessage(type, data) {
    switch (type) {
      case 'workflowsLoaded':
        workflows = (data && data.workflows) || [];
        stageCounts = (data && data.stageCounts) || {};
        renderStageCounts();
        renderWorkflows();
        break;

      case 'workflowUpdated':
        showToast('Workflow updated');
        ROS.bridge.sendToVelo('getWorkflows', {});
        break;

      case 'documentStatusLoaded':
        if (data && data.workflowId) updateWorkflowDocs(data.workflowId, data.docs);
        break;
    }
  }

  function renderStageCounts() {
    let total = 0;
    STAGES.forEach(s => {
      const count = stageCounts[s.id] || 0;
      total += count;
      const el = document.getElementById('onb-count-' + s.id);
      if (el) el.textContent = count;
    });
    const totalEl = document.getElementById('onb-total');
    if (totalEl) totalEl.textContent = total + ' active';
  }

  function renderWorkflows() {
    const list = document.getElementById('onb-workflow-list');
    const countEl = document.getElementById('onb-workflow-count');
    if (!list) return;

    const active = workflows.filter(w => w.status !== 'done' && w.status !== 'completed');
    if (countEl) countEl.textContent = active.length + ' in progress';

    if (workflows.length === 0) {
      list.innerHTML = '<div class="text-center py-8 text-tan text-[13px]">No active onboarding workflows</div>';
      return;
    }

    list.innerHTML = workflows.map(w => {
      const name = w.driver_name || w.name || 'Unknown Driver';
      const stage = w.current_stage || w.stage || 'offer_sent';
      const stageIdx = STAGES.findIndex(s => s.id === stage);
      const progress = stageIdx >= 0 ? Math.round(((stageIdx + 1) / STAGES.length) * 100) : 0;
      const stageInfo = STAGES[stageIdx] || STAGES[0];
      const daysIn = w.days_in_stage || 0;
      const daysColor = daysIn > 7 ? 'text-red-400' : daysIn > 3 ? 'text-amber-500' : 'text-sg';

      return `
        <div class="flex items-center gap-4 p-3 neu-x rounded-xl">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[16px]">${stageInfo.icon}</span>
          </div>
          <div class="flex-1">
            <div class="text-[13px] font-bold text-lmdr-dark">${escapeHtml(name)}</div>
            <div class="text-[10px] text-tan mt-0.5">${stageInfo.label} ${daysIn ? '<span class="' + daysColor + ' font-bold">' + daysIn + 'd</span>' : ''}</div>
            <div class="h-1.5 w-full neu-ins rounded-full overflow-hidden mt-2">
              <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all" style="width:${progress}%"></div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-[16px] font-black text-lmdr-dark">${progress}%</div>
            <div class="text-[9px] text-tan uppercase font-bold">Complete</div>
          </div>
        </div>`;
    }).join('');
  }

  function updateWorkflowDocs(workflowId, docs) {
    // Future: update specific workflow's document status inline
    showToast('Documents updated for workflow');
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

  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
