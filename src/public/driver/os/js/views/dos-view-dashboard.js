/**
 * dos-view-dashboard.js
 * DriverOS Dashboard / Home screen.
 * Profile completion, match stats, activity, messages preview.
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  var state = {
    loading: true,
    profileStrength: 0,
    activeMatches: 0,
    newMessages: 0,
    upcomingInterviews: 0,
    applications: [],
    recentActivity: [],
    isDiscoverable: false
  };

  function icon(name) {
    var s = document.createElement('span');
    s.className = 'material-symbols-outlined';
    s.textContent = name;
    return s;
  }

  function skeleton() {
    var wrap = document.createElement('div');
    for (var i = 0; i < 4; i++) {
      var sk = document.createElement('div');
      sk.className = 'dos-card';
      sk.style.height = '100px';
      sk.style.marginBottom = '12px';
      sk.style.background = 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)';
      sk.style.backgroundSize = '200% 100%';
      sk.style.animation = 'dosShimmer 1.5s infinite';
      wrap.appendChild(sk);
    }
    return wrap;
  }

  function buildStatCard(iconName, label, value, color) {
    var card = document.createElement('div');
    card.className = 'dos-card';
    card.style.display = 'flex';
    card.style.alignItems = 'center';
    card.style.gap = '12px';

    var iconWrap = document.createElement('div');
    iconWrap.style.width = '48px';
    iconWrap.style.height = '48px';
    iconWrap.style.borderRadius = '12px';
    iconWrap.style.background = color || '#dbeafe';
    iconWrap.style.display = 'flex';
    iconWrap.style.alignItems = 'center';
    iconWrap.style.justifyContent = 'center';
    iconWrap.style.flexShrink = '0';
    var ic = icon(iconName);
    ic.style.fontSize = '24px';
    ic.style.color = '#1e40af';
    iconWrap.appendChild(ic);
    card.appendChild(iconWrap);

    var textWrap = document.createElement('div');
    var val = document.createElement('p');
    val.className = 'dos-text-heading';
    val.style.fontSize = '20px';
    val.style.marginBottom = '2px';
    val.textContent = String(value);
    textWrap.appendChild(val);

    var lab = document.createElement('p');
    lab.className = 'dos-text-small';
    lab.textContent = label;
    textWrap.appendChild(lab);

    card.appendChild(textWrap);
    return card;
  }

  function buildProfileStrengthCard(strength, self) {
    var card = document.createElement('div');
    card.className = 'dos-card';
    card.style.marginBottom = '12px';

    var header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '10px';

    var title = document.createElement('h3');
    title.className = 'dos-text-subheading';
    title.textContent = 'Profile Strength';
    header.appendChild(title);

    var pct = document.createElement('span');
    pct.className = 'dos-text-subheading';
    pct.style.color = strength >= 80 ? '#22c55e' : strength >= 50 ? '#f59e0b' : '#ef4444';
    pct.textContent = strength + '%';
    header.appendChild(pct);
    card.appendChild(header);

    // Progress bar
    var barBg = document.createElement('div');
    barBg.style.height = '8px';
    barBg.style.borderRadius = '4px';
    barBg.style.background = '#f1f5f9';
    barBg.style.overflow = 'hidden';
    barBg.style.marginBottom = '12px';

    var barFill = document.createElement('div');
    barFill.style.height = '100%';
    barFill.style.borderRadius = '4px';
    barFill.style.width = Math.min(strength, 100) + '%';
    barFill.style.background = strength >= 80 ? '#22c55e' : strength >= 50 ? '#f59e0b' : '#ef4444';
    barFill.style.transition = 'width 0.5s ease';
    barBg.appendChild(barFill);
    card.appendChild(barBg);

    if (strength < 100) {
      var cta = document.createElement('button');
      cta.className = 'dos-btn-secondary dos-full-width';
      cta.style.padding = '10px';
      cta.textContent = 'Complete Your Profile';
      var handler = function () {
        if (DOS.views) DOS.views.mount('career');
      };
      cta.addEventListener('click', handler);
      self._listeners.push({ el: cta, type: 'click', fn: handler });
      card.appendChild(cta);
    }

    return card;
  }

  function buildDiscoverabilityToggle(isOn, self) {
    var card = document.createElement('div');
    card.className = 'dos-card';
    card.style.marginBottom = '12px';
    card.style.display = 'flex';
    card.style.justifyContent = 'space-between';
    card.style.alignItems = 'center';

    var left = document.createElement('div');
    var label = document.createElement('p');
    label.className = 'dos-text-body';
    label.style.fontWeight = '600';
    label.textContent = 'Discoverable by Recruiters';
    left.appendChild(label);
    var sub = document.createElement('p');
    sub.className = 'dos-text-small';
    sub.textContent = isOn ? 'Recruiters can find your profile' : 'Your profile is hidden';
    left.appendChild(sub);
    card.appendChild(left);

    var toggle = document.createElement('button');
    toggle.className = 'dos-touch-target';
    toggle.style.width = '52px';
    toggle.style.height = '32px';
    toggle.style.borderRadius = '16px';
    toggle.style.border = 'none';
    toggle.style.cursor = 'pointer';
    toggle.style.position = 'relative';
    toggle.style.background = isOn ? '#22c55e' : '#cbd5e1';
    toggle.style.transition = 'background 0.2s';
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-checked', String(isOn));

    var knob = document.createElement('span');
    knob.style.width = '26px';
    knob.style.height = '26px';
    knob.style.borderRadius = '13px';
    knob.style.background = '#ffffff';
    knob.style.position = 'absolute';
    knob.style.top = '3px';
    knob.style.left = isOn ? '23px' : '3px';
    knob.style.transition = 'left 0.2s';
    knob.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
    toggle.appendChild(knob);

    var currentState = isOn;
    var toggleHandler = function () {
      currentState = !currentState;
      toggle.style.background = currentState ? '#22c55e' : '#cbd5e1';
      knob.style.left = currentState ? '23px' : '3px';
      toggle.setAttribute('aria-checked', String(currentState));
      sub.textContent = currentState ? 'Recruiters can find your profile' : 'Your profile is hidden';
      DOS.bridge.send('setDiscoverability', { isDiscoverable: currentState });
    };
    toggle.addEventListener('click', toggleHandler);
    self._listeners.push({ el: toggle, type: 'click', fn: toggleHandler });

    card.appendChild(toggle);
    return card;
  }

  function buildApplicationsList(apps, self) {
    var card = document.createElement('div');
    card.className = 'dos-card';
    card.style.marginBottom = '12px';

    var title = document.createElement('h3');
    title.className = 'dos-text-subheading';
    title.textContent = 'Active Applications';
    title.style.marginBottom = '10px';
    card.appendChild(title);

    if (!apps || apps.length === 0) {
      var none = document.createElement('p');
      none.className = 'dos-text-body';
      none.style.color = '#94a3b8';
      none.textContent = 'No active applications';
      card.appendChild(none);
      return card;
    }

    var shown = apps.slice(0, 5);
    shown.forEach(function (app, idx) {
      if (idx > 0) {
        var divider = document.createElement('div');
        divider.className = 'dos-divider';
        card.appendChild(divider);
      }

      var row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';

      var left = document.createElement('div');
      var name = document.createElement('p');
      name.className = 'dos-text-body';
      name.style.fontWeight = '600';
      name.textContent = app.carrierName || 'Carrier';
      left.appendChild(name);

      var statusText = app.status || 'pending';
      var statusChip = document.createElement('span');
      var chipClass = statusText === 'accepted' ? 'dos-chip-green' : statusText === 'rejected' ? 'dos-chip-red' : statusText === 'interview' ? 'dos-chip-blue' : 'dos-chip-amber';
      statusChip.className = 'dos-chip ' + chipClass;
      statusChip.style.marginTop = '4px';
      statusChip.textContent = statusText.charAt(0).toUpperCase() + statusText.slice(1);
      left.appendChild(statusChip);
      row.appendChild(left);

      var viewBtn = document.createElement('button');
      viewBtn.className = 'dos-btn-ghost dos-touch-target';
      viewBtn.style.padding = '8px 12px';
      viewBtn.style.fontSize = '14px';
      viewBtn.textContent = 'View';
      var viewHandler = function () {
        DOS.bridge.send('getConversation', { applicationId: app._id || app.id });
      };
      viewBtn.addEventListener('click', viewHandler);
      self._listeners.push({ el: viewBtn, type: 'click', fn: viewHandler });
      row.appendChild(viewBtn);

      card.appendChild(row);
    });

    return card;
  }

  DOS.viewModules['dashboard'] = {
    _listeners: [],
    _root: null,

    mount: function (root) {
      var self = this;
      while (root.firstChild) root.removeChild(root.firstChild);
      self._root = root;

      var container = document.createElement('div');
      container.className = 'dos-container';
      container.style.paddingTop = '16px';
      container.style.paddingBottom = '100px';

      var heading = document.createElement('h1');
      heading.className = 'dos-text-heading';
      heading.textContent = 'Dashboard';
      heading.style.marginBottom = '16px';
      container.appendChild(heading);

      self._content = document.createElement('div');
      container.appendChild(self._content);
      root.appendChild(container);

      // Show skeleton
      state.loading = true;
      self._content.appendChild(skeleton());
      DOS.bridge.send('refreshDashboard', {});
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      this._root = null;
      this._content = null;
    },

    _render: function () {
      var self = this;
      if (!this._content) return;
      while (this._content.firstChild) this._content.removeChild(this._content.firstChild);

      // Profile strength
      this._content.appendChild(buildProfileStrengthCard(state.profileStrength, self));

      // Discoverability
      this._content.appendChild(buildDiscoverabilityToggle(state.isDiscoverable, self));

      // Stats grid
      var statsGrid = document.createElement('div');
      statsGrid.className = 'dos-grid';
      statsGrid.style.marginBottom = '12px';
      statsGrid.appendChild(buildStatCard('handshake', 'Active Matches', state.activeMatches, '#dbeafe'));
      statsGrid.appendChild(buildStatCard('mail', 'New Messages', state.newMessages, '#dcfce7'));
      statsGrid.appendChild(buildStatCard('event', 'Interviews', state.upcomingInterviews, '#fef3c7'));
      statsGrid.appendChild(buildStatCard('description', 'Applications', state.applications.length, '#f3e8ff'));
      this._content.appendChild(statsGrid);

      // Applications list
      this._content.appendChild(buildApplicationsList(state.applications, self));
    },

    onMessage: function (action, payload) {
      if (action === 'dashboardData') {
        state.loading = false;
        var stats = payload.stats || {};
        state.profileStrength = stats.profileStrength || stats.profileCompletion || 0;
        state.activeMatches = stats.activeMatches || 0;
        state.newMessages = stats.newMessages || stats.unreadMessages || 0;
        state.upcomingInterviews = stats.upcomingInterviews || 0;
        state.applications = payload.applications || [];
        state.isDiscoverable = stats.isDiscoverable || false;
        state.recentActivity = payload.recentActivity || [];
        this._render();
      } else if (action === 'profileStrengthLoaded') {
        state.profileStrength = payload.strength || 0;
        this._render();
      } else if (action === 'unreadCountData') {
        state.newMessages = payload.totalUnread || 0;
        this._render();
      } else if (action === 'discoverabilityUpdated') {
        // Toggle already handled inline
      }
    },

    getSnapshot: function () {
      return {
        profileStrength: state.profileStrength,
        activeMatches: state.activeMatches,
        applicationCount: state.applications.length
      };
    }
  };
})();
