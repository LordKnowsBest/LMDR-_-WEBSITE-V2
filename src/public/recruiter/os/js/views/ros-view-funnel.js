// ============================================================================
// ROS-VIEW-FUNNEL — Analytics: Funnel + Cost/Hire (merged)
// ============================================================================

(function () {
  'use strict';

  const VIEW_ID = 'funnel';
  const MESSAGES = ['funnelDataLoaded', 'costDataLoaded', 'bottleneckAnalysis'];

  let funnelData = null;
  let costData = null;
  let bottleneckData = null;

  function render() {
    return `
      <div class="flex items-center gap-3 justify-between flex-wrap">
        <div class="flex items-center gap-3">
          <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
          </button>
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-lmdr-dark to-slate-700 flex items-center justify-center">
            <span class="material-symbols-outlined text-lmdr-yellow text-[16px]">insights</span>
          </div>
          <h2 class="text-lg font-bold text-lmdr-dark">Analytics Dashboard</h2>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative group neu-in rounded-xl overflow-hidden flex items-center">
            <span class="material-symbols-outlined text-tan text-[14px] ml-3">calendar_today</span>
            <select id="funnel-date-range" onchange="ROS.views._funnel.fetchData()"
              class="appearance-none bg-transparent border-none text-[12px] font-bold text-lmdr-dark pl-2 pr-8 py-2 focus:ring-0 outline-none cursor-pointer">
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
              <option value="all">All Time</option>
            </select>
            <span class="material-symbols-outlined text-tan text-[14px] absolute right-3 pointer-events-none">expand_more</span>
          </div>
        </div>
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
        <div class="col-span-2 neu rounded-2xl p-6 relative group overflow-hidden">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-[14px] font-bold text-lmdr-dark">Hiring Funnel</h3>
            <button onclick="ROS.views._funnel.exportCSV()" class="text-tan hover:text-lmdr-blue transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
              <span class="material-symbols-outlined text-[14px]">download</span> Export CSV
            </button>
          </div>
          <div id="funnel-bars" class="flex flex-col gap-2 relative z-10">
            <div class="text-center text-[12px] text-tan py-4">Loading funnel data...</div>
          </div>
        </div>
        <div class="neu rounded-2xl p-6 flex flex-col">
          <h3 class="text-[14px] font-bold text-lmdr-dark mb-4">Conversion</h3>
          <div class="flex-1 flex flex-col items-center justify-center">
            <div class="text-[48px] font-black text-lmdr-blue leading-none" id="funnel-rate">--</div>
            <div class="text-[11px] font-bold text-tan uppercase mt-2 transform scale-90">Overall Rate</div>
            <div class="text-[11px] text-sg font-bold mt-1 italic" id="funnel-rate-trend"></div>
          </div>
        </div>
      </div>
      
      <!-- Metrics & Bottlenecks -->
      <div class="grid grid-cols-3 gap-5 mt-4">
        <div class="col-span-2 neu rounded-2xl overflow-hidden">
          <div class="p-4 border-b border-black/5 flex items-center gap-3">
             <span class="material-symbols-outlined text-lmdr-blue text-[18px]">list_alt</span>
             <h3 class="text-[14px] font-bold text-lmdr-dark">Stage Performance Matrix</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-[11px]">
              <thead class="bg-black/5">
                <tr class="text-tan font-bold uppercase tracking-wider">
                  <th class="px-4 py-3">Stage Name</th>
                  <th class="px-4 py-3 text-right">Candidates</th>
                  <th class="px-4 py-3 text-right">Conversion</th>
                  <th class="px-4 py-3 text-right">Avg Time</th>
                  <th class="px-4 py-3 text-right">Drop Off</th>
                </tr>
              </thead>
              <tbody id="funnel-metrics-rows" class="divide-y divide-black/5">
                <tr><td colspan="5" class="text-center text-tan py-4 font-medium italic">Loading...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="neu rounded-2xl p-5 flex flex-col">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <span class="material-symbols-outlined text-[16px]">bolt</span>
            </div>
            <div>
              <h3 class="font-bold text-lmdr-dark text-[14px]">Bottlenecks</h3>
              <p class="text-[9px] text-tan uppercase tracking-widest mt-0.5">Automated Insights</p>
            </div>
          </div>
          <div id="funnel-bottlenecks" class="flex-1 overflow-y-auto thin-scroll space-y-3">
            <div class="text-center text-[12px] text-tan py-4">Analyzing pipeline friction...</div>
          </div>
        </div>
      </div>`;
  }

  function getDateRange(days) {
    if (days === 'all') return { start: new Date(0).toISOString(), end: new Date().toISOString() };
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - parseInt(days));
    return { start: start.toISOString(), end: end.toISOString() };
  }

  function onMount() {
    ROS.views._funnel.fetchData();
    ROS.bridge.sendToVelo('getCostData', {});
  }

  function onUnmount() {
    funnelData = null;
    costData = null;
    bottleneckData = null;
  }

  function onMessage(type, data) {
    switch (type) {
      case 'funnelDataLoaded':
        funnelData = data;
        renderFunnel(data);
        renderMetrics(data);
        renderBottlenecks(data.bottlenecks || []);
        break;
      case 'costDataLoaded':
        costData = data;
        renderCost(data);
        break;
      case 'bottleneckAnalysis':
        bottleneckData = data.bottlenecks || [];
        renderBottlenecks(bottleneckData);
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
      bars.innerHTML = stages.map((s, idx) => {
        const pct = Math.round((s.count / max) * 100);
        const barColor = idx === stages.length - 1 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-lmdr-blue to-blue-600';
        return `
          <div class="flex items-center gap-3 group">
            <span class="w-[70px] text-right text-[10px] font-bold text-tan uppercase tracking-wider group-hover:text-lmdr-dark transition-colors">${s.label || s.stage}</span>
            <div class="flex-1 h-8 neu-ins rounded-xl relative overflow-hidden">
              <div class="absolute inset-y-0 left-0 ${barColor} rounded-xl opacity-80 group-hover:opacity-100 transition-all duration-500 ease-out" style="width:${pct}%"></div>
              <span class="absolute inset-0 flex items-center justify-end pr-3 text-[12px] font-black ${pct > 15 ? 'text-white drop-shadow-md' : 'text-lmdr-dark'} pointer-events-none">${s.count}</span>
            </div>
          </div>`;
      }).join('');
    }

    // Update KPIs
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('funnel-pipeline', data.totalPipeline || (stages[0] && stages[0].count) || '--');
    setText('funnel-hires', data.hired || (stages[stages.length - 1] && stages[stages.length - 1].count) || '--');
    setText('funnel-conversion', data.conversionRate != null ? data.conversionRate + '%' : '--');
    setText('funnel-rate', data.conversionRate != null ? data.conversionRate + '%' : '--');

    // Simulate hires bar if max is known or standard
    const hw = document.getElementById('funnel-hires-bar');
    if (hw) hw.style.width = Math.min((data.hired || 0) / 10 * 100, 100) + '%';
  }

  function renderMetrics(data) {
    const tbody = document.getElementById('funnel-metrics-rows');
    if (!tbody || !data || !data.stages) return;

    const stages = data.stages;
    const conversions = data.conversions || [];

    tbody.innerHTML = stages.map((stage, idx) => {
      const isHired = idx === stages.length - 1;
      const conversion = conversions.find(c => c.from === stage.stage || c.from === stage.label) || conversions[idx];
      const rate = conversion ? conversion.rate : null;

      let rateDisplay = '--';
      let rateClass = 'text-tan';
      if (rate !== null && !isNaN(rate)) {
        rateDisplay = rate + '%';
        rateClass = rate >= 50 ? 'text-emerald-500 font-bold' : 'text-lmdr-dark font-medium';
      } else if (isHired) {
        rateDisplay = '100%';
        rateClass = 'text-lmdr-blue font-bold';
      }

      let dropOffDisplay = '--';
      let dropClass = 'text-tan';
      if (conversion && !isNaN(conversion.rate)) {
        const drop = 100 - conversion.rate;
        dropOffDisplay = drop.toFixed(1) + '%';
        dropClass = drop > 50 ? 'text-red-500 font-bold' : 'text-tan font-medium';
      }

      const avgTime = stage.avgTime ? stage.avgTime + 'h' : '--';

      return `
        <tr class="hover:bg-black/5 transition-colors">
          <td class="px-4 py-3 font-bold text-lmdr-dark capitalize">${stage.label || stage.stage}</td>
          <td class="px-4 py-3 text-right font-black text-lmdr-dark bg-black/5 rounded mx-2 my-1">${stage.count}</td>
          <td class="px-4 py-3 text-right ${rateClass}">${rateDisplay}</td>
          <td class="px-4 py-3 text-right text-tan font-medium">${avgTime}</td>
          <td class="px-4 py-3 text-right ${dropClass}">${dropOffDisplay}</td>
        </tr>`;
    }).join('');
  }

  function renderBottlenecks(bottlenecks) {
    const container = document.getElementById('funnel-bottlenecks');
    if (!container) return;

    if (!bottlenecks || bottlenecks.length === 0) {
      container.innerHTML = `
        <div class="neu-in rounded-xl p-4 flex flex-col items-center justify-center text-center h-[120px]">
          <span class="material-symbols-outlined text-emerald-500 text-[24px] mb-2">check_circle</span>
          <p class="text-[11px] font-bold text-lmdr-dark">Optimized Pipeline</p>
          <p class="text-[10px] text-tan mt-1">Conversion rates are performing well.</p>
        </div>`;
      return;
    }

    container.innerHTML = bottlenecks.map(b => `
      <div class="neu-x rounded-xl p-3 border-l-4 border-red-500">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-red-500 text-[14px]">warning</span>
            <span class="text-[11px] font-bold text-lmdr-dark capitalize">${(b.stage || '').replace(/_/g, ' ')} Drop-off</span>
          </div>
          <span class="text-[9px] font-black px-1.5 py-0.5 bg-red-500/10 text-red-600 rounded uppercase tracking-wider">${b.dropRate || 'HIGH'} LOSS</span>
        </div>
        <p class="text-[10px] text-tan mt-1 leading-snug">${b.recommendation || 'Review this stage to reduce drop-off.'}</p>
      </div>
    `).join('');
  }

  function renderCost(data) {
    if (!data) return;
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('funnel-cost', data.costPerHire ? '$' + data.costPerHire : '--');
    setText('funnel-cost-trend', data.trend || '');
  }

  function exportCSV() {
    if (!funnelData || !funnelData.stages) {
      ROS.bridge.sendToVelo('showToast', { message: 'No data to export', type: 'error' });
      return;
    }
    const stages = funnelData.stages;
    const conversions = funnelData.conversions || [];
    let csv = 'Stage,Candidates,Conversion Rate %,Avg Time (h),Drop Off %\\n';

    stages.forEach((stage, idx) => {
      const isHired = idx === stages.length - 1;
      const conversion = conversions.find(c => c.from === stage.stage || c.from === stage.label) || conversions[idx];
      const rate = conversion ? conversion.rate : (isHired ? 100 : '');
      const drop = conversion ? (100 - conversion.rate).toFixed(1) : '';
      csv += `"${stage.label || stage.stage}",${stage.count},${rate},${stage.avgTime || ''},${drop}\n`;
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'funnel_metrics.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  ROS.views._funnel = {
    fetchData: function () {
      const sel = document.getElementById('funnel-date-range');
      const days = sel ? sel.value : '30';
      ROS.bridge.sendToVelo('getFunnelData', { dateRange: getDateRange(days) });
    },
    exportCSV
  };

  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
