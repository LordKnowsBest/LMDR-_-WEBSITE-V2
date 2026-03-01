// ============================================================================
// ROS-MARKET — Market Signals Ticker
// Fetches current freight market condition (HOT / NEUTRAL / SOFT) from
// the backend and injects a live badge into the topbar.
// HOT  = high demand, driver leverage — green
// NEUTRAL = balanced market — amber
// SOFT = over-supply, carrier leverage — slate
// ============================================================================

(function () {
  'use strict';

  ROS.market = { init, refresh, getCondition };

  var _condition = 'NEUTRAL';
  var _factor = 1.0;
  var _badgeEl = null;

  // Color mapping per condition
  var CONDITION_STYLES = {
    HOT:     { bg: '#166534', text: '#bbf7d0', dot: '#4ade80', label: 'HOT' },
    NEUTRAL: { bg: '#78350f', text: '#fde68a', dot: '#fbbf24', label: 'NEUTRAL' },
    SOFT:    { bg: '#1e293b', text: '#94a3b8', dot: '#64748b', label: 'SOFT' }
  };

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    _injectBadge();

    // Patch bridge routing to intercept marketSignalsLoaded
    var _orig = ROS.views.routeMessage;
    ROS.views.routeMessage = function (type, data) {
      if (type === 'marketSignalsLoaded') { _applySignal(data); return true; }
      return _orig(type, data);
    };

    ROS.bridge.onReady(refresh);
  }

  // ── Public API ───────────────────────────────────────────────────────────
  function refresh() {
    ROS.bridge.sendToVelo('getMarketSignals', {});
  }

  function getCondition() { return _condition; }

  // ── Inject badge into topbar ──────────────────────────────────────────────
  function _injectBadge() {
    var topbar = document.getElementById('ros-topbar');
    if (!topbar) return;

    // Find the right-side flex container (last child div)
    var rightPanel = topbar.querySelector('.flex.items-center.gap-4');
    if (!rightPanel) return;

    _badgeEl = document.createElement('button');
    _badgeEl.id = 'ros-market-badge';
    _badgeEl.title = 'Market signals — click to refresh';
    _badgeEl.addEventListener('click', refresh);
    Object.assign(_badgeEl.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 8px',
      borderRadius: '20px',
      fontSize: '10px',
      fontWeight: '700',
      cursor: 'pointer',
      letterSpacing: '0.5px',
      border: 'none',
      background: 'rgba(255,255,255,0.08)',
      color: 'rgba(255,255,255,0.4)',
      transition: 'all 0.2s'
    });

    // Dot indicator
    var dot = document.createElement('span');
    dot.id = 'ros-market-dot';
    Object.assign(dot.style, {
      width: '6px', height: '6px',
      borderRadius: '50%',
      background: '#64748b',
      flexShrink: '0'
    });

    // Label
    var lbl = document.createElement('span');
    lbl.id = 'ros-market-label';
    lbl.textContent = 'MARKET';

    _badgeEl.appendChild(dot);
    _badgeEl.appendChild(lbl);

    // Insert before the clock
    var clock = document.getElementById('ros-clock');
    if (clock) {
      rightPanel.insertBefore(_badgeEl, clock);
    } else {
      rightPanel.appendChild(_badgeEl);
    }
  }

  // ── Apply signal data to badge ────────────────────────────────────────────
  function _applySignal(data) {
    if (!data || !data.success) return;

    _condition = data.condition || 'NEUTRAL';
    _factor = data.factor || 1.0;

    var style = CONDITION_STYLES[_condition] || CONDITION_STYLES.NEUTRAL;

    if (!_badgeEl) return;

    Object.assign(_badgeEl.style, {
      background: style.bg,
      color: style.text
    });

    var dot = document.getElementById('ros-market-dot');
    if (dot) dot.style.background = style.dot;

    var lbl = document.getElementById('ros-market-label');
    if (lbl) {
      // Show condition + diesel price if available
      var text = style.label;
      if (data.dieselPrice) {
        text += ' \u00b7 $' + Number(data.dieselPrice).toFixed(2) + '/gal';
      }
      lbl.textContent = text;
    }

    _badgeEl.title = data.summary || ('Market: ' + _condition);
  }

})();
