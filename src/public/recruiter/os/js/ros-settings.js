// ============================================================================
// ROS-SETTINGS — Bottom-left settings orb
// Avatar, carrier switcher, inline account editor + alert management, logout
// ============================================================================

(function () {
  'use strict';

  let panelOpen = false;
  let profile = null;       // normalized display object
  let _rawProfile = null;   // raw Airtable fields for editing
  let carriers = [];
  let currentDOT = null;
  let _editMode = false;

  // ── Alert Preferences ──────────────────────────────────────────────────────

  const ALP_STORAGE_KEY = 'ros-alert-prefs';
  const ALP_CATEGORIES = [
    { key: 'matches',    icon: 'person_search',  color: '#2563eb', label: 'New Matches',        defaultOn: true  },
    { key: 'pipeline',   icon: 'view_column',    color: '#f59e0b', label: 'Pipeline Moves',     defaultOn: true  },
    { key: 'onboarding', icon: 'task_alt',        color: '#059669', label: 'Onboarding Updates', defaultOn: false },
    { key: 'comms',      icon: 'chat',            color: '#f97316', label: 'Messages & Comms',   defaultOn: false },
    { key: 'compliance', icon: 'gavel',           color: '#0d9488', label: 'Compliance Alerts',  defaultOn: false },
    { key: 'retention',  icon: 'shield',          color: '#dc2626', label: 'Retention Risk',     defaultOn: false },
  ];
  let _alpPrefs = null;

  // ── Public API ─────────────────────────────────────────────────────────────

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

    if (_editMode) renderAlertPrefToggles();

    document.addEventListener('click', function (e) {
      if (panelOpen && !e.target.closest('#ros-settings-panel') && !e.target.closest('#ros-settings-orb')) {
        closePanel();
      }
    });
  }

  // ── Panel Content ──────────────────────────────────────────────────────────

  function buildPanelContent() {
    return _editMode ? buildEditContent() : buildViewContent();
  }

  function buildViewContent() {
    var name      = profile ? profile.name  : 'Recruiter';
    var tier      = profile ? (profile.tier || 'Free') : 'Free';
    var initials  = profile ? getInitials(profile.name) : '--';
    var email     = profile ? (profile.email || '') : '';

    var maskedEmail = '';
    if (email) {
      var parts = email.split('@');
      maskedEmail = parts.length === 2
        ? (parts[0].slice(0, 1) + '***@' + parts[1])
        : email;
    }

    var carrierItems = carriers.map(function (c) {
      var isActive = c.dot === currentDOT;
      return '<div class="flex items-center gap-2 p-2 rounded-lg cursor-pointer '
        + (isActive ? 'neu-ins' : 'neu-x hover:shadow-none')
        + ' transition-shadow" onclick="ROS.settings._switchCarrier(\'' + esc(c.dot) + '\')">'
        + '<span class="material-symbols-outlined text-[14px] ' + (isActive ? 'text-lmdr-blue' : 'text-tan') + '">local_shipping</span>'
        + '<span class="text-[11px] font-bold text-lmdr-dark flex-1 truncate">' + escHtml(c.name || 'DOT# ' + c.dot) + '</span>'
        + (isActive ? '<span class="w-2 h-2 rounded-full bg-lmdr-blue"></span>' : '')
        + '</div>';
    }).join('');

    // Alert summary
    var prefs = getAlertPrefs();
    var activeCount = ALP_CATEGORIES.filter(function (c) { return prefs[c.key]; }).length;

    return ''
      // ── Profile header ──
      + '<div class="flex items-center gap-3 pb-3 border-b border-beige-d">'
        + '<div class="w-10 h-10 rounded-full bg-gradient-to-br from-lmdr-yb to-lmdr-yellow flex items-center justify-center font-black text-lmdr-dark text-sm">' + initials + '</div>'
        + '<div class="flex-1 min-w-0">'
          + '<div class="text-[13px] font-bold text-lmdr-dark truncate">' + escHtml(name) + '</div>'
          + '<div class="text-[10px] text-tan font-medium">' + escHtml(tier) + ' Plan</div>'
          + (maskedEmail ? '<div class="text-[10px] truncate" style="color:rgba(200,184,150,0.7)">' + escHtml(maskedEmail) + '</div>' : '')
        + '</div>'
        + '<button class="w-8 h-8 neu-x rounded-lg flex items-center justify-center shrink-0" title="Edit profile &amp; alerts" onclick="ROS.settings._enterEdit()">'
          + '<span class="material-symbols-outlined text-tan text-[14px]">edit</span>'
        + '</button>'
      + '</div>'

      // ── Carrier switcher ──
      + (carriers.length > 0
        ? '<div>'
            + '<div class="text-[9px] font-bold text-tan uppercase tracking-widest mb-2">Carrier</div>'
            + '<div class="flex flex-col gap-1">' + carrierItems + '</div>'
          + '</div>'
        : '')

      // ── Alert summary row ──
      + '<div class="flex items-center gap-3 p-2 neu-ins rounded-xl">'
        + '<span class="material-symbols-outlined text-[15px]" style="color:#6366f1">notifications_active</span>'
        + '<span class="flex-1 text-[12px] font-medium text-lmdr-dark">Alerts</span>'
        + '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full" style="background:rgba(99,102,241,0.15);color:#6366f1">'
          + activeCount + '/' + ALP_CATEGORIES.length + ' on'
        + '</span>'
        + '<button class="text-[10px] font-bold text-lmdr-blue" onclick="ROS.settings._enterEdit()">Manage</button>'
      + '</div>'

      // ── Bottom actions ──
      + '<div class="flex flex-col gap-1 pt-1">'
        + '<button class="flex items-center gap-2 p-2 rounded-lg neu-x hover:shadow-none transition-shadow text-left" onclick="ROS.settings._openWeightPrefs()">'
          + '<span class="material-symbols-outlined text-[14px] text-tan">tune</span>'
          + '<span class="text-[11px] font-bold text-lmdr-dark">Weight Preferences</span>'
        + '</button>'
        + '<button class="flex items-center gap-2 p-2 rounded-lg neu-x hover:shadow-none transition-shadow text-left" onclick="ROS.bridge.sendToVelo(\'navigateTo\', { url: \'/\' })">'
          + '<span class="material-symbols-outlined text-[14px] text-red-400">logout</span>'
          + '<span class="text-[11px] font-bold text-red-400">Log Out</span>'
        + '</button>'
      + '</div>';
  }

  function buildEditContent() {
    var r       = _rawProfile || {};
    var dispName = r.display_name || r.name || '';
    var email    = r.email || '';
    var phone    = r.phone || '';
    var agency   = r.agency_name || '';
    var isIndep  = r.is_independent === 'Yes' || r.is_independent === true;

    var indepBg  = isIndep ? '#2563eb' : 'rgba(200,184,150,0.3)';
    var dotSide  = isIndep ? 'right:2px;left:auto' : 'left:2px;right:auto';

    return ''
      // ── Edit header ──
      + '<div class="flex items-center gap-3 pb-3 border-b border-beige-d">'
        + '<button class="w-8 h-8 neu-x rounded-lg flex items-center justify-center shrink-0" onclick="ROS.settings._cancelEdit()">'
          + '<span class="material-symbols-outlined text-tan text-[14px]">arrow_back</span>'
        + '</button>'
        + '<div class="flex-1 min-w-0">'
          + '<div class="text-[13px] font-bold text-lmdr-dark">Account &amp; Alerts</div>'
          + '<div class="text-[10px] text-tan">Profile info and notification settings</div>'
        + '</div>'
      + '</div>'

      // ── Account fields ──
      + '<div>'
        + '<div class="text-[9px] font-bold text-tan uppercase tracking-widest mb-2">Account Info</div>'
        + '<div class="flex flex-col gap-2">'

          + '<div>'
            + '<label class="text-[10px] font-bold text-tan block mb-1">Display Name</label>'
            + '<input id="se-display-name" type="text" value="' + escAttr(dispName) + '"'
              + ' class="w-full neu-ins rounded-lg px-3 py-2 text-[12px] text-lmdr-dark bg-transparent border-none outline-none"'
              + ' placeholder="Your name"/>'
          + '</div>'

          + '<div>'
            + '<label class="text-[10px] font-bold text-tan block mb-1">Email</label>'
            + '<input id="se-email" type="email" value="' + escAttr(email) + '"'
              + ' class="w-full neu-ins rounded-lg px-3 py-2 text-[12px] text-lmdr-dark bg-transparent border-none outline-none"'
              + ' placeholder="you@example.com"/>'
          + '</div>'

          + '<div>'
            + '<label class="text-[10px] font-bold text-tan block mb-1">Phone</label>'
            + '<input id="se-phone" type="tel" value="' + escAttr(phone) + '"'
              + ' class="w-full neu-ins rounded-lg px-3 py-2 text-[12px] text-lmdr-dark bg-transparent border-none outline-none"'
              + ' placeholder="(555) 000-0000"/>'
          + '</div>'

          + '<div>'
            + '<label class="text-[10px] font-bold text-tan block mb-1">Agency Name</label>'
            + '<input id="se-agency" type="text" value="' + escAttr(agency) + '"'
              + ' class="w-full neu-ins rounded-lg px-3 py-2 text-[12px] text-lmdr-dark bg-transparent border-none outline-none"'
              + ' placeholder="Agency or company name"/>'
          + '</div>'

          + '<div class="flex items-center justify-between p-2 neu-ins rounded-lg">'
            + '<span class="text-[12px] font-medium text-lmdr-dark">Independent Recruiter</span>'
            + '<div id="se-indep-toggle" data-on="' + (isIndep ? '1' : '0') + '"'
              + ' class="w-10 h-5 rounded-full cursor-pointer relative"'
              + ' style="background:' + indepBg + ';transition:background 0.2s"'
              + ' onclick="ROS.settings._toggleIndep()">'
              + '<div class="w-4 h-4 rounded-full absolute top-0.5"'
                + ' style="background:var(--beige-light,#FAF8F2);' + dotSide + ';transition:left 0.2s,right 0.2s"></div>'
            + '</div>'
          + '</div>'

        + '</div>'
      + '</div>'

      // ── Alert notifications ──
      + '<div>'
        + '<div class="text-[9px] font-bold text-tan uppercase tracking-widest mb-2">Alert Notifications</div>'
        + '<div class="flex flex-col gap-2" id="alp-toggles"></div>'
      + '</div>'

      // ── Save / Cancel ──
      + '<div class="flex gap-2 pt-1">'
        + '<button id="se-save"'
          + ' class="flex-1 py-2.5 rounded-xl neu font-bold text-[12px] text-lmdr-dark flex items-center justify-center gap-1.5"'
          + ' onclick="ROS.settings._saveAll()">'
          + '<span class="material-symbols-outlined text-lmdr-blue text-[15px]">save</span>'
          + 'Save Changes'
        + '</button>'
        + '<button class="w-10 h-10 neu-x rounded-xl flex items-center justify-center shrink-0" onclick="ROS.settings._cancelEdit()">'
          + '<span class="material-symbols-outlined text-tan text-[15px]">close</span>'
        + '</button>'
      + '</div>';
  }

  // ── Alert Prefs Helpers ────────────────────────────────────────────────────

  function getAlertPrefs() {
    if (_alpPrefs) return _alpPrefs;
    try {
      var saved = localStorage.getItem(ALP_STORAGE_KEY);
      if (saved) { _alpPrefs = JSON.parse(saved); return _alpPrefs; }
    } catch (e) { /* ignore */ }
    _alpPrefs = { matches: true, pipeline: true, onboarding: false, comms: false, compliance: false, retention: false };
    return _alpPrefs;
  }

  function saveAlertPrefsLocally(prefs) {
    _alpPrefs = prefs;
    try { localStorage.setItem(ALP_STORAGE_KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ }
  }

  function renderAlertPrefToggles() {
    var container = document.getElementById('alp-toggles');
    if (!container) return;
    var prefs = getAlertPrefs();

    container.innerHTML = ALP_CATEGORIES.map(function (cat) {
      var on = prefs[cat.key];
      return '<div class="flex items-center gap-3 py-2 px-3 neu-ins rounded-xl">'
        + '<span class="material-symbols-outlined text-[14px]" style="color:' + cat.color + '">' + cat.icon + '</span>'
        + '<span class="flex-1 text-[12px] font-medium text-lmdr-dark">' + cat.label + '</span>'
        + '<div class="w-10 h-5 rounded-full cursor-pointer relative"'
          + ' style="background:' + (on ? '#2563eb' : 'rgba(200,184,150,0.3)') + ';transition:background 0.2s"'
          + ' id="alp-toggle-' + cat.key + '"'
          + ' onclick="window._alpToggle(\'' + cat.key + '\')">'
          + '<div class="w-4 h-4 rounded-full absolute top-0.5"'
            + ' style="background:var(--beige-light,#FAF8F2);' + (on ? 'right:2px;left:auto' : 'left:2px;right:auto') + ';transition:left 0.2s,right 0.2s"></div>'
        + '</div>'
        + '</div>';
    }).join('');

    window._alpToggle = function (key) {
      var p = getAlertPrefs();
      p[key] = !p[key];
      _alpPrefs = p;
      var tog = document.getElementById('alp-toggle-' + key);
      var dot = tog ? tog.querySelector('div') : null;
      if (tog) tog.style.background = p[key] ? '#2563eb' : 'rgba(200,184,150,0.3)';
      if (dot) { dot.style.right = p[key] ? '2px' : ''; dot.style.left = p[key] ? '' : '2px'; }
    };
  }

  // ── Edit Mode Handlers ─────────────────────────────────────────────────────

  ROS.settings._enterEdit = function () {
    _editMode = true;
    refresh();
    // Allow panel to scroll in edit mode
    var panel = document.getElementById('ros-settings-panel');
    if (panel) panel.style.overflowY = 'auto';
  };

  ROS.settings._cancelEdit = function () {
    _editMode = false;
    refresh();
    var panel = document.getElementById('ros-settings-panel');
    if (panel) panel.style.overflowY = '';
  };

  ROS.settings._toggleIndep = function () {
    var tog = document.getElementById('se-indep-toggle');
    if (!tog) return;
    var isOn = tog.dataset.on !== '1';
    tog.dataset.on = isOn ? '1' : '0';
    tog.style.background = isOn ? '#2563eb' : 'rgba(200,184,150,0.3)';
    var dot = tog.querySelector('div');
    if (dot) { dot.style.right = isOn ? '2px' : ''; dot.style.left = isOn ? '' : '2px'; }
  };

  ROS.settings._saveAll = function () {
    var saveBtn = document.getElementById('se-save');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="material-symbols-outlined text-tan text-[15px]" style="animation:spin 1s linear infinite">progress_activity</span> Saving...';
    }

    var nameEl   = document.getElementById('se-display-name');
    var emailEl  = document.getElementById('se-email');
    var phoneEl  = document.getElementById('se-phone');
    var agencyEl = document.getElementById('se-agency');
    var indepTog = document.getElementById('se-indep-toggle');

    var isIndep = indepTog ? indepTog.dataset.on === '1' : false;

    var accountData = {
      displayName: nameEl  ? nameEl.value.trim()  : '',
      email:       emailEl ? emailEl.value.trim() : '',
      phone:       phoneEl ? phoneEl.value.trim() : '',
      agencyName:  agencyEl ? agencyEl.value.trim() : '',
      isIndependent: isIndep
    };

    // Persist alert prefs locally right away
    var alertPrefs = Object.assign({}, getAlertPrefs());
    saveAlertPrefsLocally(alertPrefs);

    ROS.bridge.sendToVelo('saveAccountSettings', {
      account:    accountData,
      alertPrefs: alertPrefs
    });
  };

  // Called by bridge when Velo responds
  ROS.settings.onAccountSettingsSaved = function (data) {
    _editMode = false;
    var panel = document.getElementById('ros-settings-panel');
    if (panel) panel.style.overflowY = '';

    if (data && data.profile) {
      updateProfile(data.profile);
    } else {
      refresh();
    }
  };

  ROS.settings.onAccountSettingsError = function (msg) {
    var saveBtn = document.getElementById('se-save');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span class="material-symbols-outlined text-[15px]" style="color:#ef4444">error</span> ' + (msg || 'Save failed — retry');
    }
  };

  // ── Panel Lifecycle ────────────────────────────────────────────────────────

  function toggle() {
    panelOpen ? closePanel() : openPanel();
  }

  function openPanel() {
    var panel = document.getElementById('ros-settings-panel');
    if (panel) { panel.classList.add('open'); panelOpen = true; }
  }

  function closePanel() {
    var panel = document.getElementById('ros-settings-panel');
    if (panel) { panel.classList.remove('open'); panelOpen = false; }
    // Exit edit mode when closing
    if (_editMode) {
      _editMode = false;
      refresh();
    }
  }

  function updateProfile(p) {
    _rawProfile = p;
    profile = {
      name:          p.display_name || p.name || 'Recruiter',
      email:         p.email        || '',
      phone:         p.phone        || '',
      agencyName:    p.agency_name  || '',
      isIndependent: p.is_independent === 'Yes' || p.is_independent === true,
      tier:          p.tier || p.subscription_tier || 'Free'
    };
    currentDOT = p.currentCarrierDOT || currentDOT;
    refresh();
  }

  function updateCarriers(c) {
    carriers = (c || []).map(function (item) {
      return {
        dot:  item.carrier_dot || item.dot  || '',
        name: item.carrier_name || item.name || ''
      };
    });
    refresh();
  }

  function refresh() {
    renderOrb();
    var panel = document.getElementById('ros-settings-panel');
    if (panel) {
      panel.innerHTML = buildPanelContent();
      if (_editMode) renderAlertPrefToggles();
    }
  }

  // ── Other Public Handlers ──────────────────────────────────────────────────

  ROS.settings._switchCarrier = function (dot) {
    currentDOT = dot;
    ROS.bridge.sendToVelo('switchCarrier', { carrierDOT: dot });
    refresh();
    closePanel();
  };

  ROS.settings._openWeightPrefs = function () {
    ROS.bridge.sendToVelo('getWeightPreferences', {});
    closePanel();
  };

  // ── Utilities ──────────────────────────────────────────────────────────────

  function getInitials(name) {
    if (!name) return '--';
    return name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
  }

  function escHtml(str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function escAttr(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "\\'");
  }

  // ── Auto-init + shell hook ─────────────────────────────────────────────────

  var origInit = ROS.shell.init;
  ROS.shell.init = function () {
    origInit.call(ROS.shell);
    ROS.settings.init();
  };

  // Called from ros-view-alerts.js "Manage Preferences" button
  ROS.shell.openSettings = function () {
    if (!panelOpen) openPanel();
    _editMode = true;
    refresh();
    var panel = document.getElementById('ros-settings-panel');
    if (panel) panel.style.overflowY = 'auto';
  };

})();
