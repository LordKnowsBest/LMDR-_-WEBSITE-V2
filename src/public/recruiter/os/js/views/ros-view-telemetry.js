// ============================================================================
// ROS-VIEW-TELEMETRY — Call Telemetry Dashboard
// Total calls, avg duration, success rate, recent calls, log call
// ============================================================================

(function() {
  'use strict';

  const VIEW_ID = 'telemetry';
  const MESSAGES = ['callAnalyticsLoaded', 'recentCallsLoaded', 'callOutcomeLogged', 'driverCallHistoryLoaded'];

  let analytics = null;
  let recentCalls = [];

  function render() {
    return `
      <div class="flex items-center gap-3">
        <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-[16px]">phone_in_talk</span>
        </div>
        <h2 class="text-lg font-bold text-lmdr-dark">Call Telemetry</h2>
        <button onclick="ROS.views._telemetry.openLogCall()" class="ml-auto px-4 py-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white text-[11px] font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-shadow flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[14px]">add_call</span> Log Call
        </button>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-4 gap-4 mt-4">
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Total Calls</p>
          <h3 class="text-[28px] font-black text-lmdr-dark mt-1" id="tel-total">--</h3>
          <span class="text-[11px] text-sg font-bold" id="tel-total-trend"></span>
        </div>
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Avg Duration</p>
          <h3 class="text-[28px] font-black text-lmdr-blue mt-1" id="tel-duration">--</h3>
          <span class="text-[11px] text-tan font-medium">minutes</span>
        </div>
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Success Rate</p>
          <h3 class="text-[28px] font-black text-sg mt-1" id="tel-success">--</h3>
          <div class="h-1.5 w-full neu-ins rounded-full overflow-hidden mt-2">
            <div class="h-full bg-sg rounded-full transition-all" id="tel-success-bar" style="width:0%"></div>
          </div>
        </div>
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Callbacks</p>
          <h3 class="text-[28px] font-black text-amber-500 mt-1" id="tel-callbacks">--</h3>
          <span class="text-[11px] text-tan font-medium">pending</span>
        </div>
      </div>

      <!-- Recent Calls List -->
      <div class="neu rounded-2xl p-5 mt-4 flex-1">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-[14px] font-bold text-lmdr-dark">Recent Calls</h3>
          <span class="text-[10px] text-tan font-medium" id="tel-call-count">0 calls</span>
        </div>
        <div class="flex flex-col gap-2" id="tel-calls-list">
          <div class="text-center py-8 text-tan text-[13px]">Loading call data...</div>
        </div>
      </div>

      <!-- Log Call Modal (hidden by default) -->
      <div id="tel-log-modal" style="display:none" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
        <div class="neu-s rounded-2xl p-6 w-[400px] max-w-[90vw] bg-beige">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-[16px] font-bold text-lmdr-dark">Log a Call</h3>
            <button onclick="ROS.views._telemetry.closeLogCall()" class="text-tan hover:text-lmdr-dark">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div class="flex flex-col gap-3">
            <input id="tel-log-driver" class="px-4 py-3 neu-in rounded-xl text-sm text-lmdr-dark placeholder-tan/50 outline-none font-medium" placeholder="Driver name or ID" />
            <select id="tel-log-outcome" class="px-4 py-3 neu-in rounded-xl text-sm text-lmdr-dark outline-none font-medium">
              <option value="">Select outcome...</option>
              <option value="connected">Connected</option>
              <option value="voicemail">Voicemail</option>
              <option value="no_answer">No Answer</option>
              <option value="interested">Interested</option>
              <option value="not_interested">Not Interested</option>
              <option value="callback">Callback Requested</option>
            </select>
            <input id="tel-log-duration" type="number" class="px-4 py-3 neu-in rounded-xl text-sm text-lmdr-dark placeholder-tan/50 outline-none font-medium" placeholder="Duration (minutes)" />
            <textarea id="tel-log-notes" class="px-4 py-3 neu-in rounded-xl text-sm text-lmdr-dark placeholder-tan/50 outline-none font-medium resize-none h-20" placeholder="Notes..."></textarea>
            <button onclick="ROS.views._telemetry.submitLogCall()" class="px-5 py-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white text-sm font-bold shadow-lg">
              Log Call
            </button>
          </div>
        </div>
      </div>`;
  }

  function onMount() {
    ROS.bridge.sendToVelo('getCallAnalytics', {});
    ROS.bridge.sendToVelo('getRecentCalls', {});
  }

  function onUnmount() {
    analytics = null;
    recentCalls = [];
    closeLogCallModal();
  }

  function onMessage(type, data) {
    switch (type) {
      case 'callAnalyticsLoaded':
        analytics = data;
        renderAnalytics(data);
        break;

      case 'recentCallsLoaded':
        recentCalls = (data && data.calls) || data || [];
        if (Array.isArray(recentCalls)) renderRecentCalls();
        break;

      case 'callOutcomeLogged':
        showToast(data && data.success ? 'Call logged successfully' : 'Failed to log call');
        closeLogCallModal();
        ROS.bridge.sendToVelo('getCallAnalytics', {});
        ROS.bridge.sendToVelo('getRecentCalls', {});
        break;

      case 'driverCallHistoryLoaded':
        // Future: show call history for specific driver
        break;
    }
  }

  function renderAnalytics(data) {
    if (!data) return;
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    setText('tel-total', data.totalCalls || '0');
    setText('tel-total-trend', data.totalTrend || '');
    setText('tel-duration', data.avgDuration ? data.avgDuration.toFixed(1) : '--');
    setText('tel-callbacks', data.pendingCallbacks || '0');

    // Success rate
    const rate = data.successRate || 0;
    setText('tel-success', rate + '%');
    const bar = document.getElementById('tel-success-bar');
    if (bar) bar.style.width = rate + '%';
  }

  function renderRecentCalls() {
    const list = document.getElementById('tel-calls-list');
    const countEl = document.getElementById('tel-call-count');
    if (!list) return;

    if (countEl) countEl.textContent = recentCalls.length + ' calls';

    if (recentCalls.length === 0) {
      list.innerHTML = '<div class="text-center py-8 text-tan text-[13px]">No recent calls</div>';
      return;
    }

    const outcomeConfig = {
      'connected':      { icon: 'call',          color: 'text-sg' },
      'voicemail':      { icon: 'voicemail',     color: 'text-amber-500' },
      'no_answer':      { icon: 'call_missed',   color: 'text-red-400' },
      'interested':     { icon: 'thumb_up',      color: 'text-sg' },
      'not_interested': { icon: 'thumb_down',    color: 'text-red-400' },
      'callback':       { icon: 'schedule',      color: 'text-lmdr-blue' }
    };

    list.innerHTML = recentCalls.map(c => {
      const name = c.driver_name || c.name || 'Unknown';
      const outcome = c.outcome || c.status || 'connected';
      const config = outcomeConfig[outcome] || outcomeConfig['connected'];
      const duration = c.duration ? c.duration + ' min' : '';
      const time = c.time || c.created_at || '';
      const notes = c.notes || '';

      return `
        <div class="flex items-center gap-3 p-3 neu-x rounded-xl">
          <span class="material-symbols-outlined ${config.color} text-[20px]">${config.icon}</span>
          <div class="flex-1">
            <div class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(name)}</div>
            <div class="text-[10px] text-tan">${escapeHtml(outcome.replace(/_/g, ' '))} ${duration ? '\u00b7 ' + duration : ''} ${notes ? '\u00b7 ' + escapeHtml(notes.substring(0, 40)) : ''}</div>
          </div>
          <span class="text-[10px] text-tan font-medium">${escapeHtml(time)}</span>
        </div>`;
    }).join('');
  }

  function closeLogCallModal() {
    const modal = document.getElementById('tel-log-modal');
    if (modal) modal.style.display = 'none';
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
  ROS.views._telemetry = {
    openLogCall: function() {
      const modal = document.getElementById('tel-log-modal');
      if (modal) modal.style.display = 'flex';
    },
    closeLogCall: function() {
      closeLogCallModal();
    },
    submitLogCall: function() {
      const driver = document.getElementById('tel-log-driver');
      const outcome = document.getElementById('tel-log-outcome');
      const duration = document.getElementById('tel-log-duration');
      const notes = document.getElementById('tel-log-notes');

      if (!outcome || !outcome.value) {
        showToast('Please select an outcome');
        return;
      }

      ROS.bridge.sendToVelo('logCallOutcome', {
        driverName: driver ? driver.value.trim() : '',
        outcome: outcome.value,
        duration: duration ? Number(duration.value) || 0 : 0,
        notes: notes ? notes.value.trim() : ''
      });
    }
  };

  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
