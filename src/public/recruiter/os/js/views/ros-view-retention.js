// ============================================================================
// ROS-VIEW-RETENTION — Driver Retention Dashboard
// Retention rate, at-risk count, avg tenure, NPS, intervention actions
// ============================================================================

(function() {
  'use strict';

  const VIEW_ID = 'retention';
  const MESSAGES = ['retentionDataLoaded', 'atRiskDriversLoaded', 'interventionSent'];

  let retentionData = null;
  let atRiskDrivers = [];

  function render() {
    return `
      <div class="flex items-center gap-3">
        <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-[16px]">shield</span>
        </div>
        <h2 class="text-lg font-bold text-lmdr-dark">Retention Dashboard</h2>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-4 gap-4 mt-4">
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Retention Rate</p>
          <h3 class="text-[28px] font-black text-sg mt-1" id="ret-rate">--</h3>
          <div class="h-1.5 w-full neu-ins rounded-full overflow-hidden mt-2">
            <div class="h-full bg-sg rounded-full transition-all" id="ret-rate-bar" style="width:0%"></div>
          </div>
        </div>
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">At-Risk</p>
          <h3 class="text-[28px] font-black text-red-400 mt-1" id="ret-atrisk">--</h3>
          <span class="text-[11px] text-tan font-medium">drivers flagged</span>
        </div>
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Avg Tenure</p>
          <h3 class="text-[28px] font-black text-lmdr-dark mt-1" id="ret-tenure">--</h3>
          <span class="text-[11px] text-tan font-medium">months</span>
        </div>
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">NPS Score</p>
          <h3 class="text-[28px] font-black text-lmdr-blue mt-1" id="ret-nps">--</h3>
          <span class="text-[11px] font-bold" id="ret-nps-label">--</span>
        </div>
      </div>

      <!-- At-Risk Drivers -->
      <div class="neu rounded-2xl p-5 mt-4 flex-1">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-[14px] font-bold text-lmdr-dark">At-Risk Drivers</h3>
          <span class="text-[10px] text-tan font-medium" id="ret-atrisk-count">0 flagged</span>
        </div>
        <div class="flex flex-col gap-2" id="ret-atrisk-list">
          <div class="text-center py-8 text-tan text-[13px]">Loading retention data...</div>
        </div>
      </div>`;
  }

  function onMount() {
    ROS.bridge.sendToVelo('getRetentionData', {});
    ROS.bridge.sendToVelo('getAtRiskDrivers', {});
  }

  function onUnmount() {
    retentionData = null;
    atRiskDrivers = [];
  }

  function onMessage(type, data) {
    switch (type) {
      case 'retentionDataLoaded':
        retentionData = data;
        renderRetentionStats(data);
        break;

      case 'atRiskDriversLoaded':
        atRiskDrivers = (data && data.drivers) || data || [];
        if (Array.isArray(atRiskDrivers)) renderAtRiskDrivers();
        break;

      case 'interventionSent':
        showToast(data && data.success ? 'Intervention sent successfully' : 'Failed to send intervention');
        ROS.bridge.sendToVelo('getAtRiskDrivers', {});
        break;
    }
  }

  function renderRetentionStats(data) {
    if (!data) return;
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    // Retention Rate
    const rate = data.retentionRate || 0;
    setText('ret-rate', rate + '%');
    const rateBar = document.getElementById('ret-rate-bar');
    if (rateBar) rateBar.style.width = rate + '%';

    // At-Risk Count
    setText('ret-atrisk', data.atRiskCount || '0');

    // Avg Tenure
    setText('ret-tenure', data.avgTenure ? data.avgTenure.toFixed(1) : '--');

    // NPS
    const nps = data.npsScore;
    setText('ret-nps', nps !== undefined && nps !== null ? nps : '--');
    const npsLabel = document.getElementById('ret-nps-label');
    if (npsLabel && nps !== undefined && nps !== null) {
      if (nps >= 50) {
        npsLabel.textContent = 'Excellent';
        npsLabel.className = 'text-[11px] font-bold text-sg';
      } else if (nps >= 0) {
        npsLabel.textContent = 'Good';
        npsLabel.className = 'text-[11px] font-bold text-amber-500';
      } else {
        npsLabel.textContent = 'Needs Work';
        npsLabel.className = 'text-[11px] font-bold text-red-400';
      }
    }
  }

  function renderAtRiskDrivers() {
    const list = document.getElementById('ret-atrisk-list');
    const countEl = document.getElementById('ret-atrisk-count');
    if (!list) return;

    if (countEl) countEl.textContent = atRiskDrivers.length + ' flagged';

    if (atRiskDrivers.length === 0) {
      list.innerHTML = `
        <div class="text-center py-8 text-sg text-[13px]">
          <span class="material-symbols-outlined text-[32px] block mb-2">verified_user</span>
          No at-risk drivers detected
        </div>`;
      return;
    }

    const riskConfig = {
      'Critical': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-l-red-500' },
      'High':     { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-l-orange-500' },
      'Medium':   { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-l-amber-500' },
      'Low':      { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-l-emerald-500' }
    };

    list.innerHTML = atRiskDrivers.map(d => {
      const name = d.name || d.driver_name || 'Unknown';
      const risk = d.risk_level || d.riskLevel || 'Medium';
      const config = riskConfig[risk] || riskConfig['Medium'];
      const reason = d.reason || d.risk_reason || 'Multiple risk factors detected';
      const tenure = d.tenure ? d.tenure + ' mo' : '';
      const lastContact = d.last_contact || d.lastContact || '';
      const driverId = d._id || d.id || d.driver_id || '';

      return `
        <div class="flex items-center gap-3 p-3 neu-x rounded-xl border-l-4 ${config.border}">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-[13px] font-bold text-lmdr-dark">${escapeHtml(name)}</span>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${config.bg} ${config.text}">${risk}</span>
            </div>
            <div class="text-[10px] text-tan mt-1">${escapeHtml(reason)}</div>
            <div class="text-[10px] text-tan mt-0.5">${tenure ? 'Tenure: ' + tenure : ''} ${lastContact ? '\u00b7 Last contact: ' + escapeHtml(lastContact) : ''}</div>
          </div>
          <button onclick="ROS.views._retention.sendIntervention('${driverId}', '${escapeAttr(name)}')"
                  class="px-3 py-2 rounded-lg bg-gradient-to-br from-red-600 to-rose-700 text-white text-[10px] font-bold shadow-md hover:shadow-lg transition-shadow flex items-center gap-1">
            <span class="material-symbols-outlined text-[12px]">outgoing_mail</span> Intervene
          </button>
        </div>`;
    }).join('');
  }

  function escapeAttr(s) {
    if (!s) return '';
    return s.replace(/'/g, "\\'").replace(/"/g, '&quot;');
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
  ROS.views._retention = {
    sendIntervention: function(driverId, driverName) {
      if (!driverId) return;
      ROS.bridge.sendToVelo('sendIntervention', { driverId, driverName });
    }
  };

  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
