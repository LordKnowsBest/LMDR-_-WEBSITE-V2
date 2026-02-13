// ============================================================================
// ROS-VIEW-PREDICT — AI Predictions Dashboard
// Hire Forecast, Attrition Risk, Market Demand, Pipeline Velocity
// ============================================================================

(function() {
  'use strict';

  const VIEW_ID = 'predict';
  const MESSAGES = ['predictionsLoaded', 'forecastGenerated'];

  let predictions = null;

  function render() {
    return `
      <div class="flex items-center gap-3">
        <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-[16px]">auto_awesome</span>
        </div>
        <h2 class="text-lg font-bold text-lmdr-dark">AI Predictions</h2>
        <span class="ml-auto px-3 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
          <span class="material-symbols-outlined text-[12px] align-middle">auto_awesome</span> AI-Powered
        </span>
      </div>

      <!-- Top KPI Cards -->
      <div class="grid grid-cols-4 gap-4 mt-4">
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Hire Forecast</p>
          <h3 class="text-[28px] font-black text-lmdr-dark mt-1" id="pred-hire-forecast">--</h3>
          <span class="text-[11px] font-bold" id="pred-hire-confidence">--</span>
        </div>
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Attrition Risk</p>
          <h3 class="text-[28px] font-black text-red-400 mt-1" id="pred-attrition">--</h3>
          <span class="text-[11px] text-tan font-medium">flagged drivers</span>
        </div>
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Market Demand</p>
          <h3 class="text-[28px] font-black text-lmdr-blue mt-1" id="pred-market">--</h3>
          <span class="text-[11px] text-sg font-bold" id="pred-market-trend"></span>
        </div>
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Pipeline Velocity</p>
          <h3 class="text-[28px] font-black text-sg mt-1" id="pred-velocity">--</h3>
          <span class="text-[11px] text-tan font-medium">hires/week</span>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-5 mt-4">
        <!-- Pipeline Velocity Forecast (weekly bars) -->
        <div class="col-span-2 neu rounded-2xl p-6">
          <h3 class="text-[14px] font-bold text-lmdr-dark mb-4">Weekly Pipeline Velocity</h3>
          <div class="flex items-end gap-2 h-[160px]" id="pred-velocity-bars">
            <div class="text-center text-[12px] text-tan py-4 w-full">Loading forecast...</div>
          </div>
          <div class="flex justify-between mt-2" id="pred-velocity-labels"></div>
        </div>

        <!-- At-Risk Drivers -->
        <div class="neu rounded-2xl p-6">
          <h3 class="text-[14px] font-bold text-lmdr-dark mb-4">At-Risk Drivers</h3>
          <div class="flex flex-col gap-2" id="pred-atrisk-list">
            <div class="text-center text-[12px] text-tan py-4">Loading...</div>
          </div>
        </div>
      </div>`;
  }

  function onMount() {
    ROS.bridge.sendToVelo('getPredictionsData', {});
  }

  function onUnmount() {
    predictions = null;
  }

  function onMessage(type, data) {
    switch (type) {
      case 'predictionsLoaded':
        predictions = data;
        renderPredictions(data);
        break;

      case 'forecastGenerated':
        if (data && data.weeklyForecast) renderVelocityBars(data.weeklyForecast);
        break;
    }
  }

  function renderPredictions(data) {
    if (!data) return;
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    // Hire Forecast
    setText('pred-hire-forecast', data.hireForecast || '--');
    const confEl = document.getElementById('pred-hire-confidence');
    if (confEl && data.hireConfidence) {
      const confPct = Math.round(data.hireConfidence);
      confEl.textContent = confPct + '% confidence';
      confEl.className = 'text-[11px] font-bold ' + (confPct >= 80 ? 'text-sg' : confPct >= 60 ? 'text-amber-500' : 'text-red-400');
    }

    // Attrition
    setText('pred-attrition', data.attritionCount || '0');

    // Market Demand
    setText('pred-market', data.marketDemand || '--');
    setText('pred-market-trend', data.marketTrend || '');

    // Pipeline Velocity
    setText('pred-velocity', data.pipelineVelocity || '--');

    // Render weekly bars
    if (data.weeklyForecast) renderVelocityBars(data.weeklyForecast);

    // Render at-risk drivers
    if (data.atRiskDrivers) renderAtRiskDrivers(data.atRiskDrivers);
  }

  function renderVelocityBars(weeks) {
    const container = document.getElementById('pred-velocity-bars');
    const labels = document.getElementById('pred-velocity-labels');
    if (!container || !Array.isArray(weeks) || weeks.length === 0) return;

    const max = Math.max(...weeks.map(w => w.value || w.count || 0), 1);

    container.innerHTML = weeks.map(w => {
      const val = w.value || w.count || 0;
      const pct = Math.round((val / max) * 100);
      const isPredicted = w.predicted || w.forecast;
      return `
        <div class="flex-1 flex flex-col items-center justify-end h-full">
          <span class="text-[10px] font-bold text-lmdr-dark mb-1">${val}</span>
          <div class="w-full rounded-t-lg ${isPredicted ? 'bg-purple-400/40 border-2 border-dashed border-purple-400' : 'bg-gradient-to-t from-purple-500 to-fuchsia-500'}"
               style="height:${Math.max(pct, 5)}%"></div>
        </div>`;
    }).join('');

    if (labels) {
      labels.innerHTML = weeks.map(w =>
        `<span class="flex-1 text-center text-[9px] text-tan font-bold uppercase">${w.label || w.week || ''}</span>`
      ).join('');
    }
  }

  function renderAtRiskDrivers(drivers) {
    const list = document.getElementById('pred-atrisk-list');
    if (!list) return;

    if (!drivers || drivers.length === 0) {
      list.innerHTML = '<div class="text-center text-[12px] text-sg py-4"><span class="material-symbols-outlined text-[20px] block mb-1">check_circle</span>No at-risk drivers</div>';
      return;
    }

    list.innerHTML = drivers.slice(0, 5).map(d => {
      const name = d.name || d.driver_name || 'Unknown';
      const risk = d.risk_level || d.riskLevel || 'Medium';
      const riskColors = { 'Critical': 'bg-red-100 text-red-700', 'High': 'bg-orange-100 text-orange-700', 'Medium': 'bg-amber-100 text-amber-700', 'Low': 'bg-emerald-100 text-emerald-700' };
      const riskClass = riskColors[risk] || riskColors['Medium'];

      return `
        <div class="flex items-center gap-3 p-2.5 neu-x rounded-xl">
          <span class="material-symbols-outlined text-red-400 text-[16px]">warning</span>
          <div class="flex-1">
            <div class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(name)}</div>
            <div class="text-[10px] text-tan">${escapeHtml(d.reason || '')}</div>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${riskClass}">${risk}</span>
        </div>`;
    }).join('');
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
