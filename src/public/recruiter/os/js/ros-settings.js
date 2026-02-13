// ============================================================================
// ROS-SETTINGS — Bottom-left settings orb
// Avatar, carrier switcher, weight prefs, subscription tier, logout
// ============================================================================

(function() {
  'use strict';

  let panelOpen = false;
  let profile = null;
  let carriers = [];
  let currentDOT = null;

  ROS.settings = { init, updateProfile, updateCarriers, toggle };

  function init() {
    renderOrb();
    renderPanel();
  }

  function renderOrb() {
    const existing = document.getElementById('ros-settings-orb');
    if (existing) existing.remove();

    const orb = document.createElement('div');
    orb.id = 'ros-settings-orb';
    orb.className = 'settings-orb';
    orb.textContent = profile ? getInitials(profile.name) : '--';
    orb.onclick = toggle;
    document.body.appendChild(orb);
  }

  function renderPanel() {
    const existing = document.getElementById('ros-settings-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'ros-settings-panel';
    panel.className = 'settings-panel neu';
    panel.innerHTML = buildPanelContent();
    document.body.appendChild(panel);

    // Close panel on outside click
    document.addEventListener('click', (e) => {
      if (panelOpen && !e.target.closest('#ros-settings-panel') && !e.target.closest('#ros-settings-orb')) {
        closePanel();
      }
    });
  }

  function buildPanelContent() {
    const name = profile ? profile.name : 'Recruiter';
    const tier = profile ? (profile.tier || 'Free') : 'Free';
    const initials = profile ? getInitials(profile.name) : '--';

    const carrierItems = carriers.map(c => {
      const isActive = c.dot === currentDOT;
      return `
        <div class="flex items-center gap-2 p-2 rounded-lg cursor-pointer ${isActive ? 'neu-ins' : 'neu-x hover:shadow-none'} transition-shadow"
             onclick="ROS.settings._switchCarrier('${c.dot}')">
          <span class="material-symbols-outlined text-[14px] ${isActive ? 'text-lmdr-blue' : 'text-tan'}">local_shipping</span>
          <span class="text-[11px] font-bold text-lmdr-dark flex-1 truncate">${escapeHtml(c.name || 'DOT# ' + c.dot)}</span>
          ${isActive ? '<span class="w-2 h-2 rounded-full bg-lmdr-blue"></span>' : ''}
        </div>`;
    }).join('');

    return `
      <div class="flex items-center gap-3 pb-3 border-b border-beige-d">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-lmdr-yb to-lmdr-yellow flex items-center justify-center font-black text-lmdr-dark text-sm">${initials}</div>
        <div class="flex-1 min-w-0">
          <div class="text-[13px] font-bold text-lmdr-dark truncate">${escapeHtml(name)}</div>
          <div class="text-[10px] text-tan font-medium">${escapeHtml(tier)} Plan</div>
        </div>
      </div>

      ${carriers.length > 0 ? `
      <div>
        <div class="text-[9px] font-bold text-tan uppercase tracking-widest mb-2">Carrier</div>
        <div class="flex flex-col gap-1">${carrierItems}</div>
      </div>` : ''}

      <div class="flex flex-col gap-1 pt-1">
        <button class="flex items-center gap-2 p-2 rounded-lg neu-x hover:shadow-none transition-shadow text-left"
                onclick="ROS.settings._openWeightPrefs()">
          <span class="material-symbols-outlined text-[14px] text-tan">tune</span>
          <span class="text-[11px] font-bold text-lmdr-dark">Weight Preferences</span>
        </button>
        <button class="flex items-center gap-2 p-2 rounded-lg neu-x hover:shadow-none transition-shadow text-left"
                onclick="ROS.bridge.sendToVelo('navigateTo', { url: '/account/my-account' })">
          <span class="material-symbols-outlined text-[14px] text-tan">settings</span>
          <span class="text-[11px] font-bold text-lmdr-dark">Account Settings</span>
        </button>
        <button class="flex items-center gap-2 p-2 rounded-lg neu-x hover:shadow-none transition-shadow text-left"
                onclick="ROS.bridge.sendToVelo('navigateTo', { url: '/' })">
          <span class="material-symbols-outlined text-[14px] text-red-400">logout</span>
          <span class="text-[11px] font-bold text-red-400">Log Out</span>
        </button>
      </div>`;
  }

  function toggle() {
    panelOpen ? closePanel() : openPanel();
  }

  function openPanel() {
    const panel = document.getElementById('ros-settings-panel');
    if (panel) { panel.classList.add('open'); panelOpen = true; }
  }

  function closePanel() {
    const panel = document.getElementById('ros-settings-panel');
    if (panel) { panel.classList.remove('open'); panelOpen = false; }
  }

  function updateProfile(p) {
    profile = p;
    currentDOT = p.currentCarrierDOT || currentDOT;
    refresh();
  }

  function updateCarriers(c) {
    carriers = c || [];
    refresh();
  }

  function refresh() {
    renderOrb();
    const panel = document.getElementById('ros-settings-panel');
    if (panel) panel.innerHTML = buildPanelContent();
  }

  // Public handlers
  ROS.settings._switchCarrier = function(dot) {
    currentDOT = dot;
    ROS.bridge.sendToVelo('switchCarrier', { carrierDOT: dot });
    refresh();
    closePanel();
  };

  ROS.settings._openWeightPrefs = function() {
    ROS.bridge.sendToVelo('getWeightPreferences', {});
    closePanel();
  };

  function getInitials(name) {
    if (!name) return '--';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Auto-init when shell is ready
  const origInit = ROS.shell.init;
  ROS.shell.init = function() {
    origInit.call(ROS.shell);
    ROS.settings.init();
  };

})();
