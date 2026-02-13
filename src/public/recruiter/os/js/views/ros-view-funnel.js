// ============================================================================
// ROS-VIEW-FUNNEL — Analytics: Funnel + Cost/Hire (merged)
// ============================================================================

(function() {
  'use strict';

  const VIEW_ID = 'funnel';
  const MESSAGES = ['funnelDataLoaded', 'costDataLoaded', 'bottleneckAnalysis'];

  let funnelData = null;
  let costData = null;

  function render() {
    return `
      <div class="flex items-center gap-3">
        <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-lmdr-dark to-slate-700 flex items-center justify-center">
          <span class="material-symbols-outlined text-lmdr-yellow text-[16px]">insights</span>
        </div>
        <h2 class="text-lg font-bold text-lmdr-dark">Analytics Dashboard</h2>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-4 gap-4 mt-4">
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Pipeline</p>
          <h3 class="text-[28px] font-black text-lmdr-dark mt-1" id="funnel-pipeline">--</h3>
          <span class="text-[11px] text-sg font-bold" id="funnel-pipeline-trend"></span>
        </div>
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Hires/Mo</p>
          <h3 class="text-[28px] font-black text-lmdr-dark mt-1" id="funnel-hires">--</h3>
          <div class="h-1.5 w-full neu-ins rounded-full overflow-hidden mt-2"><div class="h-full bg-lmdr-blue rounded-full" style="width:0%" id="funnel-hires-bar"></div></div>
        </div>
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Cost/Hire</p>
          <h3 class="text-[28px] font-black text-lmdr-dark mt-1" id="funnel-cost">--</h3>
          <span class="text-[11px] text-sg font-bold" id="funnel-cost-trend"></span>
        </div>
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Conversion</p>
          <h3 class="text-[28px] font-black text-sg mt-1" id="funnel-conversion">--</h3>
        </div>
      </div>

      <!-- Funnel Chart + Conversion -->
      <div class="grid grid-cols-3 gap-5 mt-4">
        <div class="col-span-2 neu rounded-2xl p-6">
          <h3 class="text-[14px] font-bold text-lmdr-dark mb-4">Hiring Funnel</h3>
          <div id="funnel-bars" class="flex flex-col gap-2">
            <div class="text-center text-[12px] text-tan py-4">Loading funnel data...</div>
          </div>
        </div>
        <div class="neu rounded-2xl p-6">
          <h3 class="text-[14px] font-bold text-lmdr-dark mb-4">Conversion</h3>
          <div class="flex flex-col items-center justify-center h-[calc(100%-30px)]">
            <div class="text-[48px] font-black text-lmdr-blue leading-none" id="funnel-rate">--</div>
            <div class="text-[11px] font-bold text-tan uppercase mt-2">Overall Rate</div>
            <div class="text-[11px] text-sg font-bold mt-1 italic" id="funnel-rate-trend"></div>
          </div>
        </div>
      </div>`;
  }

  function onMount() {
    ROS.bridge.sendToVelo('getFunnelData', {});
    ROS.bridge.sendToVelo('getCostData', {});
  }

  function onUnmount() {
    funnelData = null;
    costData = null;
  }

  function onMessage(type, data) {
    switch (type) {
      case 'funnelDataLoaded':
        funnelData = data;
        renderFunnel(data);
        break;
      case 'costDataLoaded':
        costData = data;
        renderCost(data);
        break;
      case 'bottleneckAnalysis':
        // Future: render bottleneck insights
        break;
    }
  }

  function renderFunnel(data) {
    if (!data) return;
    const stages = data.stages || [
      { label: 'Applied', count: data.applied || 0 },
      { label: 'Screened', count: data.screened || 0 },
      { label: 'Offered', count: data.offered || 0 },
      { label: 'Hired', count: data.hired || 0 }
    ];

    const max = Math.max(...stages.map(s => s.count), 1);
    const bars = document.getElementById('funnel-bars');
    if (bars) {
      bars.innerHTML = stages.map(s => {
        const pct = Math.round((s.count / max) * 100);
        return `
          <div class="flex items-center gap-3">
            <span class="w-16 text-right text-[10px] font-bold text-tan uppercase">${s.label}</span>
            <div class="flex-1 h-8 neu-ins rounded-lg relative overflow-hidden">
              <div class="absolute inset-y-0 left-0 bg-lmdr-blue/25 rounded-lg" style="width:${pct}%"></div>
              <span class="absolute inset-0 flex items-center justify-end pr-3 text-[12px] font-bold">${s.count}</span>
            </div>
          </div>`;
      }).join('');
    }

    // Update KPIs
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('funnel-pipeline', data.totalPipeline || stages[0].count || '--');
    setText('funnel-hires', data.hired || stages[stages.length - 1].count || '--');
    setText('funnel-conversion', data.conversionRate ? data.conversionRate + '%' : '--');
    setText('funnel-rate', data.conversionRate ? data.conversionRate + '%' : '--');
  }

  function renderCost(data) {
    if (!data) return;
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('funnel-cost', data.costPerHire ? '$' + data.costPerHire : '--');
    setText('funnel-cost-trend', data.trend || '');
  }

  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
