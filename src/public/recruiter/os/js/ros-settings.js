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

  // Alert Preferences
  const ALP_STORAGE_KEY = 'ros-alert-prefs';
  const ALP_CATEGORIES = [
    { key: 'matches',    icon: 'person_search',  color: '#2563eb', label: 'New Matches',        defaultOn: true },
    { key: 'pipeline',   icon: 'view_column',    color: '#f59e0b', label: 'Pipeline Moves',     defaultOn: true },
    { key: 'onboarding', icon: 'task_alt',        color: '#059669', label: 'Onboarding Updates', defaultOn: false },
    { key: 'comms',      icon: 'chat',            color: '#f97316', label: 'Messages & Comms',   defaultOn: false },
    { key: 'compliance', icon: 'gavel',           color: '#0d9488', label: 'Compliance Alerts',  defaultOn: false },
    { key: 'retention',  icon: 'shield',          color: '#dc2626', label: 'Retention Risk',     defaultOn: false },
  ];
  let _alpPrefs = null;

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
    renderAlertPrefToggles();

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

      <div class="mb-6">
        <h3 class="text-[14px] font-bold text-lmdr-dark mb-3 flex items-center gap-2">
          <span class="material-symbols-outlined text-[16px]" style="color:#6366f1">notifications_active</span>
          Alert Preferences
        </h3>
        <div class="flex flex-col gap-2" id="alp-toggles"></div>
        <button id="alp-save" class="mt-4 w-full py-2.5 rounded-xl neu-x text-[13px] font-bold text-lmdr-dark flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-lmdr-blue text-[16px]">save</span>
          Save Preferences
        </button>
      </div>

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

  function getAlertPrefs() {
    if (_alpPrefs) return _alpPrefs;
    try {
      var saved = localStorage.getItem(ALP_STORAGE_KEY);
      if (saved) { _alpPrefs = JSON.parse(saved); return _alpPrefs; }
    } catch(e) { /* ignore */ }
    _alpPrefs = { matches: true, pipeline: true, onboarding: false, comms: false, compliance: false, retention: false };
    return _alpPrefs;
  }

  function saveAlertPrefs(prefs) {
    _alpPrefs = prefs;
    try { localStorage.setItem(ALP_STORAGE_KEY, JSON.stringify(prefs)); } catch(e) { /* ignore */ }
    if (ROS.bridge && ROS.bridge.sendToVelo) {
      ROS.bridge.sendToVelo('updateAlertPrefs', { prefs });
    }
  }

  function renderAlertPrefToggles() {
    var container = document.getElementById('alp-toggles');
    if (!container) return;
    var prefs = getAlertPrefs();
    container.innerHTML = ALP_CATEGORIES.map(function(cat) {
      return '<div class="flex items-center gap-3 py-2.5 px-3 neu-ins rounded-xl">'
        + '<span class="material-symbols-outlined text-[15px]" style="color:' + cat.color + '">' + cat.icon + '</span>'
        + '<span class="flex-1 text-[13px] font-medium text-lmdr-dark">' + cat.label + '</span>'
        + '<div class="w-10 h-5 rounded-full cursor-pointer relative" '
        + 'style="background:' + (prefs[cat.key] ? '#2563eb' : 'rgba(200,184,150,0.3)') + ';transition:background 0.2s" '
        + 'id="alp-toggle-' + cat.key + '" '
        + 'onclick="window._alpToggle(\'' + cat.key + '\')">'
        + '<div class="w-4 h-4 rounded-full absolute top-0.5" '
        + 'style="background:var(--beige-light, #FAF8F2);' + (prefs[cat.key] ? 'right:2px' : 'left:2px') + ';transition:left 0.2s,right 0.2s"></div>'
        + '</div></div>';
    }).join('');

    var saveBtn = document.getElementById('alp-save');
    if (saveBtn) {
      saveBtn.onclick = function() {
        var current = getAlertPrefs();
        saveAlertPrefs(Object.assign({}, current));
        saveBtn.innerHTML = '<span class="material-symbols-outlined text-lmdr-blue text-[16px]">check</span> Saved';
        setTimeout(function() {
          saveBtn.innerHTML = '<span class="material-symbols-outlined text-lmdr-blue text-[16px]">save</span> Save Preferences';
        }, 1500);
      };
    }

    window._alpToggle = function(key) {
      var prefs = getAlertPrefs();
      prefs[key] = !prefs[key];
      _alpPrefs = prefs;
      var toggle = document.getElementById('alp-toggle-' + key);
      var dot = toggle ? toggle.querySelector('div') : null;
      if (toggle) toggle.style.background = prefs[key] ? '#2563eb' : 'rgba(200,184,150,0.3)';
      if (dot) { dot.style.right = prefs[key] ? '2px' : ''; dot.style.left = prefs[key] ? '' : '2px'; }
    };
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
    if (panel) { panel.innerHTML = buildPanelContent(); renderAlertPrefToggles(); }
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
