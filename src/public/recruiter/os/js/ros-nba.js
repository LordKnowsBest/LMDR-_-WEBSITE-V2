// ============================================================================
// ROS-NBA — Next Best Action Chip Bar
// Renders a horizontally-scrollable row of action chips just below the topbar.
// Chips are driven by real backend data: at-risk drivers, pending docs,
// unread messages, active alerts. Enabled when NBA_ENABLED: true.
// ============================================================================

(function () {
  'use strict';

  if (!ROS.config.features.NBA_ENABLED) return;

  // ── State ──
  let chips = [];
  let barEl = null;

  ROS.nba = { init, refresh, getViewSnapshot };

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    const stage = document.getElementById('ros-stage');
    if (!stage) return;

    barEl = document.createElement('div');
    barEl.id = 'ros-nba-bar';
    barEl.className = 'nba-bar';
    Object.assign(barEl.style, {
      display: 'none',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '8px',
      overflowX: 'auto',
      padding: '8px 4px 6px',
      flexShrink: '0'
    });
    stage.insertBefore(barEl, stage.firstChild);

    // Patch bridge routing to intercept nbaChipsData
    const _orig = ROS.views.routeMessage;
    ROS.views.routeMessage = function (type, data) {
      if (type === 'nbaChipsData') { _render(data.chips || []); return true; }
      return _orig(type, data);
    };

    ROS.bridge.onReady(refresh);
  }

  // ── Refresh ───────────────────────────────────────────────────────────────
  function refresh() {
    ROS.bridge.sendToVelo('refreshNBAChips', {
      currentView: ROS.views.getCurrentView()
    });
  }

  // ── View snapshot for agent context ──────────────────────────────────────
  function getViewSnapshot() {
    return {
      nbaChips: chips.map(function (c) {
        return { id: c.id, label: c.label, count: c.count || 0 };
      })
    };
  }

  // ── Render using DOM methods (no innerHTML on untrusted data) ─────────────
  function _render(newChips) {
    chips = newChips;
    if (!barEl) return;

    while (barEl.firstChild) barEl.removeChild(barEl.firstChild);

    if (!chips.length) {
      barEl.style.display = 'none';
      return;
    }

    barEl.style.display = 'flex';
    chips.forEach(function (c) {
      barEl.appendChild(_buildChip(c));
    });
  }

  function _buildChip(c) {
    var isHigh = c.priority === 'high';

    var btn = document.createElement('button');
    btn.className = [
      'nba-chip inline-flex items-center gap-1.5',
      'px-3 py-1.5 rounded-full',
      'text-[11px] font-bold whitespace-nowrap cursor-pointer',
      'transition-all duration-150 select-none',
      isHigh
        ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
        : 'bg-beige-d text-tan border border-tan/20 hover:text-lmdr-blue hover:border-lmdr-blue/30'
    ].join(' ');

    if (c.view) {
      btn.addEventListener('click', function () { ROS.views.showView(c.view); });
    }

    // Icon
    var icon = document.createElement('span');
    icon.className = 'material-symbols-outlined text-[13px]';
    icon.textContent = c.icon || 'info';
    btn.appendChild(icon);

    // Label
    var label = document.createTextNode('\u00a0' + (c.label || ''));
    btn.appendChild(label);

    // Count badge
    if (c.count > 0) {
      var badge = document.createElement('span');
      badge.className = [
        'ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black',
        isHigh ? 'bg-red-600 text-white' : 'bg-lmdr-blue text-white'
      ].join(' ');
      badge.textContent = String(c.count);
      btn.appendChild(badge);
    }

    return btn;
  }

})();
