// ============================================================================
// ROS-VIEW-CARRIERS — Carrier Portfolio
// Extracted from RecruiterDashboard.html
// ============================================================================

(function() {
  'use strict';

  const VIEW_ID = 'carriers';
  const MESSAGES = [
    'carriersLoaded', 'carrierAdded', 'carrierRemoved', 'carrierValidated',
    'carrierSwitched', 'error'
  ];

  let carriers = [];

  function render() {
    return `
      <div class="flex items-center gap-3">
        <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-[16px]">local_shipping</span>
        </div>
        <h2 class="text-lg font-bold text-lmdr-dark">Carrier Portfolio</h2>
        <span class="ml-auto text-[11px] text-tan font-medium" id="carrier-count">0 carriers</span>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-4 gap-4 mt-4">
        <div class="neu-s p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Active</p>
          <h3 class="text-[22px] font-black text-sg mt-1" id="carrier-active">0</h3>
        </div>
        <div class="neu-s p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Total Drivers</p>
          <h3 class="text-[22px] font-black text-lmdr-dark mt-1" id="carrier-drivers">--</h3>
        </div>
        <div class="neu-s p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Open Seats</p>
          <h3 class="text-[22px] font-black text-lmdr-blue mt-1" id="carrier-seats">--</h3>
        </div>
        <div class="neu-s p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Avg Safety</p>
          <h3 class="text-[22px] font-black text-sg mt-1" id="carrier-safety">--</h3>
        </div>
      </div>

      <!-- Add Carrier -->
      <div class="flex gap-2 mt-4">
        <input id="add-carrier-dot" class="flex-1 px-4 py-3 neu-in rounded-xl text-sm text-lmdr-dark placeholder-tan/50 outline-none font-medium"
               placeholder="Enter DOT number to add carrier..."
               onkeydown="if(event.key==='Enter')ROS.views._carriers.addCarrier()"/>
        <button onclick="ROS.views._carriers.addCarrier()" class="px-5 py-3 rounded-xl bg-gradient-to-br from-lmdr-blue to-lmdr-deep text-white text-sm font-bold shadow-lg">
          <span class="material-symbols-outlined text-[18px]">add</span> Add
        </button>
      </div>

      <!-- Carrier List -->
      <div class="neu rounded-2xl p-4 mt-4 flex-1">
        <div class="flex flex-col gap-2" id="carrier-list">
          <div class="text-center py-8 text-tan text-[13px]">Loading carriers...</div>
        </div>
      </div>`;
  }

  function onMount() {
    ROS.bridge.sendToVelo('getCarriers', {});
  }

  function onUnmount() {
    carriers = [];
  }

  function onMessage(type, data) {
    switch (type) {
      case 'carriersLoaded':
        carriers = (data && data.carriers) || data || [];
        if (Array.isArray(carriers)) {
          renderCarriers();
        }
        break;

      case 'carrierAdded':
        showToast(data && data.success ? 'Carrier added' : 'Failed to add carrier');
        ROS.bridge.sendToVelo('getCarriers', {});
        break;

      case 'carrierRemoved':
        showToast('Carrier removed');
        ROS.bridge.sendToVelo('getCarriers', {});
        break;

      case 'carrierValidated':
        if (data && data.valid) {
          showToast('DOT# ' + (data.dot || '') + ' validated');
        } else {
          showToast('Invalid DOT number');
        }
        break;

      case 'carrierSwitched':
        showToast('Switched to ' + (data && data.carrierName ? data.carrierName : 'carrier'));
        renderCarriers();
        break;
    }
  }

  function renderCarriers() {
    const list = document.getElementById('carrier-list');
    const countEl = document.getElementById('carrier-count');
    const activeEl = document.getElementById('carrier-active');
    if (!list) return;

    if (countEl) countEl.textContent = carriers.length + ' carriers';
    if (activeEl) activeEl.textContent = carriers.length;

    if (carriers.length === 0) {
      list.innerHTML = '<div class="text-center py-8 text-tan text-[13px]">No carriers added yet. Enter a DOT number above to get started.</div>';
      return;
    }

    list.innerHTML = carriers.map(c => {
      const name = c.name || c.carrier_name || c.legal_name || 'Unknown';
      const dot = c.dot || c.dot_number || c.carrierDOT || '';
      const mc = c.mc_number || '';
      const trucks = c.power_units || c.truck_count || '';
      const safety = c.safety_score || c.safetyScore || '';
      const safetyColor = safety >= 95 ? 'text-sg' : safety >= 85 ? 'text-amber-500' : 'text-red-400';
      const openSeats = c.open_seats || '';
      const type = c.operation_type || '';
      const details = ['DOT# ' + dot, mc ? 'MC# ' + mc : '', type, trucks ? trucks + ' trucks' : ''].filter(Boolean).join(' \u00b7 ');

      const colors = ['from-lmdr-blue to-lmdr-deep', 'from-amber-500 to-orange-600', 'from-emerald-500 to-teal-600', 'from-violet-500 to-purple-600'];
      const ci = name.charCodeAt(0) % colors.length;

      return `
        <div class="flex items-center gap-4 p-3 neu-x rounded-xl cursor-pointer hover:shadow-neu transition-shadow">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br ${colors[ci]} flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[18px]">local_shipping</span>
          </div>
          <div class="flex-1">
            <div class="text-[13px] font-bold text-lmdr-dark">${escapeHtml(name)}</div>
            <div class="text-[11px] text-tan">${escapeHtml(details)}</div>
          </div>
          ${safety ? `<div class="text-right"><div class="text-[16px] font-black ${safetyColor}">${safety}%</div><div class="text-[9px] text-tan uppercase font-bold">Safety</div></div>` : ''}
          ${openSeats ? `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">${openSeats} open</span>` : ''}
          <button onclick="event.stopPropagation();ROS.views._carriers.switchCarrier('${dot}')"
                  class="px-3 py-1.5 rounded-lg neu-x text-[10px] font-bold text-tan hover:text-lmdr-blue transition-colors">
            Switch
          </button>
          <button onclick="event.stopPropagation();ROS.views._carriers.removeCarrier('${dot}')"
                  class="text-tan hover:text-red-400 transition-colors">
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
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

  // Public API
  ROS.views._carriers = {
    addCarrier: function() {
      const input = document.getElementById('add-carrier-dot');
      if (!input || !input.value.trim()) return;
      ROS.bridge.sendToVelo('validateCarrier', { carrierDOT: input.value.trim() });
      ROS.bridge.sendToVelo('addCarrier', { carrierDOT: input.value.trim() });
      input.value = '';
    },
    removeCarrier: function(dot) {
      ROS.bridge.sendToVelo('removeCarrier', { carrierDOT: dot });
    },
    switchCarrier: function(dot) {
      ROS.bridge.sendToVelo('switchCarrier', { carrierDOT: dot });
    }
  };

  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
