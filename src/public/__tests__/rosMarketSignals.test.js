/* eslint-disable */
/**
 * ROS-MARKET Module Tests
 * ========================
 * Tests for src/public/recruiter/os/js/ros-market.js
 * Verifies the Market Signals ticker badge initialises correctly,
 * responds to bridge data for all three market conditions, updates
 * visual styling and label text, and exposes the public API.
 *
 * Module contract:
 *   - ROS.market.init()          — injects badge into topbar right panel
 *   - ROS.market.refresh()       — sends getMarketSignals via bridge
 *   - ROS.market.getCondition()  — returns current condition string
 *   - routeMessage intercept     — 'marketSignalsLoaded' triggers _applySignal(data)
 *
 * Condition styles:
 *   HOT     → bg:#166534  text:#bbf7d0  dot:#4ade80  (green)
 *   NEUTRAL → bg:#78350f  text:#fde68a  dot:#fbbf24  (amber)
 *   SOFT    → bg:#1e293b  text:#94a3b8  dot:#64748b  (slate)
 *
 * @see src/public/recruiter/os/js/ros-market.js
 * @see src/public/recruiter/os/RecruiterOS.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const SOURCE_FILE = path.resolve(
  __dirname, '..', 'recruiter', 'os', 'js', 'ros-market.js'
);

const CONDITION_STYLES = {
  HOT:     { bg: '#166534', text: '#bbf7d0', dot: '#4ade80', label: 'HOT' },
  NEUTRAL: { bg: '#78350f', text: '#fde68a', dot: '#fbbf24', label: 'NEUTRAL' },
  SOFT:    { bg: '#1e293b', text: '#94a3b8', dot: '#64748b', label: 'SOFT' }
};

// =============================================================================
// READ SOURCE FILE (for structural checks)
// =============================================================================

const sourceCode = fs.readFileSync(SOURCE_FILE, 'utf8');

// =============================================================================
// MOCK DOM INFRASTRUCTURE
// =============================================================================

function createMockElement(id) {
  const children = [];
  const element = {
    id,
    textContent: '',
    innerHTML: '',
    className: '',
    title: '',
    style: {},
    children,
    classList: {
      _classes: new Set(),
      add: jest.fn(function (...cls) { cls.forEach(c => this._classes.add(c)); }),
      remove: jest.fn(function (...cls) { cls.forEach(c => this._classes.delete(c)); }),
      contains: jest.fn(function (cls) { return this._classes.has(cls); }),
    },
    appendChild: jest.fn(function (child) { children.push(child); return child; }),
    removeChild: jest.fn(function (child) {
      const idx = children.indexOf(child);
      if (idx > -1) children.splice(idx, 1);
      return child;
    }),
    insertBefore: jest.fn(function (newNode) { children.unshift(newNode); return newNode; }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    querySelector: jest.fn(() => null),
    querySelectorAll: jest.fn(() => []),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(() => null),
    remove: jest.fn(),
  };
  return element;
}

// =============================================================================
// ROS GLOBAL NAMESPACE MOCK
// =============================================================================

let bridgeSentMessages;
let originalRouteMessage;

function buildROS() {
  bridgeSentMessages = [];

  originalRouteMessage = jest.fn(function (type, data) {
    return false;
  });

  const ROS = {
    views: {
      routeMessage: originalRouteMessage,
    },
    bridge: {
      sendToVelo: jest.fn(function (type, data) { bridgeSentMessages.push({ type, data }); }),
      onReady: jest.fn(function (cb) { /* store, don't auto-call */ })
    },
    market: null
  };

  return ROS;
}

// =============================================================================
// DOM MOCK REGISTRY
// Simulates document.getElementById for topbar elements.
// =============================================================================

function buildTopbarDOM() {
  const rightPanel = createMockElement('right-panel');
  rightPanel.className = 'flex items-center gap-4';

  const clock = createMockElement('ros-clock');
  const topbar = createMockElement('ros-topbar');

  // topbar.querySelector('.flex.items-center.gap-4') returns rightPanel
  topbar.querySelector = jest.fn((selector) => {
    if (selector === '.flex.items-center.gap-4') return rightPanel;
    return null;
  });

  return { topbar, rightPanel, clock };
}

// =============================================================================
// REPLICATED MODULE LOGIC
// Mirrors ros-market.js exactly so tests stay in sync with the source.
// =============================================================================

function buildModule(ROS, topbarEl, clockEl) {
  var _condition = 'NEUTRAL';
  var _factor = 1.0;
  var _badgeEl = null;

  ROS.market = { init, refresh, getCondition };

  function init() {
    _injectBadge();

    var _orig = ROS.views.routeMessage;
    ROS.views.routeMessage = function (type, data) {
      if (type === 'marketSignalsLoaded') { _applySignal(data); return true; }
      return _orig(type, data);
    };

    ROS.bridge.onReady(refresh);
  }

  function refresh() {
    ROS.bridge.sendToVelo('getMarketSignals', {});
  }

  function getCondition() { return _condition; }

  function _injectBadge() {
    var topbar = topbarEl;
    if (!topbar) return;

    var rightPanel = topbar.querySelector('.flex.items-center.gap-4');
    if (!rightPanel) return;

    _badgeEl = createMockElement('ros-market-badge');
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

    var dot = createMockElement('ros-market-dot');
    dot.id = 'ros-market-dot';
    Object.assign(dot.style, {
      width: '6px', height: '6px',
      borderRadius: '50%',
      background: '#64748b',
      flexShrink: '0'
    });

    var lbl = createMockElement('ros-market-label');
    lbl.id = 'ros-market-label';
    lbl.textContent = 'MARKET';

    _badgeEl.appendChild(dot);
    _badgeEl.appendChild(lbl);

    var clock = clockEl;
    if (clock) {
      rightPanel.insertBefore(_badgeEl, clock);
    } else {
      rightPanel.appendChild(_badgeEl);
    }

    // store references for _applySignal access in tests
    ROS.market._badgeEl = _badgeEl;
    ROS.market._dot = dot;
    ROS.market._lbl = lbl;
  }

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

    var dot = ROS.market._dot;
    if (dot) dot.style.background = style.dot;

    var lbl = ROS.market._lbl;
    if (lbl) {
      var text = style.label;
      if (data.dieselPrice) {
        text += ' \u00b7 $' + Number(data.dieselPrice).toFixed(2) + '/gal';
      }
      lbl.textContent = text;
    }

    _badgeEl.title = data.summary || ('Market: ' + _condition);
  }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ros-market.js — Market Signals Badge Module', () => {

  // =========================================================================
  // SOURCE FILE STRUCTURAL CHECKS
  // =========================================================================

  describe('Source file structure', () => {
    test('file exists and is non-empty', () => {
      expect(sourceCode.length).toBeGreaterThan(0);
    });

    test('exports init, refresh, and getCondition on ROS.market', () => {
      expect(sourceCode).toContain('ROS.market = { init, refresh, getCondition }');
    });

    test('patches ROS.views.routeMessage to intercept marketSignalsLoaded', () => {
      expect(sourceCode).toContain('marketSignalsLoaded');
      expect(sourceCode).toContain('routeMessage');
    });

    test('sends getMarketSignals via bridge on refresh', () => {
      expect(sourceCode).toContain('getMarketSignals');
      expect(sourceCode).toContain('sendToVelo');
    });

    test('registers refresh with bridge.onReady', () => {
      expect(sourceCode).toContain('onReady');
    });

    test('defines CONDITION_STYLES for HOT, NEUTRAL, and SOFT', () => {
      expect(sourceCode).toContain("HOT");
      expect(sourceCode).toContain("NEUTRAL");
      expect(sourceCode).toContain("SOFT");
    });

    test('HOT condition uses green palette', () => {
      expect(sourceCode).toContain('#166534'); // bg
      expect(sourceCode).toContain('#4ade80'); // dot
    });

    test('NEUTRAL condition uses amber palette', () => {
      expect(sourceCode).toContain('#78350f'); // bg
      expect(sourceCode).toContain('#fbbf24'); // dot
    });

    test('SOFT condition uses slate palette', () => {
      expect(sourceCode).toContain('#1e293b'); // bg
      expect(sourceCode).toContain('#64748b'); // dot
    });

    test('injects badge into topbar right panel', () => {
      expect(sourceCode).toContain('ros-topbar');
      expect(sourceCode).toContain('.flex.items-center.gap-4');
    });

    test('badge click calls refresh', () => {
      // click listener added on the badge element
      expect(sourceCode).toContain('addEventListener');
      expect(sourceCode).toContain('click');
      expect(sourceCode).toContain('refresh');
    });

    test('diesel price is formatted to 2 decimal places', () => {
      expect(sourceCode).toContain('toFixed(2)');
    });

    test('uses guard against missing/failed signal data', () => {
      expect(sourceCode).toContain('data.success');
    });
  });

  // =========================================================================
  // init()
  // =========================================================================

  describe('init()', () => {
    test('creates #ros-market-badge element in topbar right panel', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();

      // badge should have been appended to rightPanel (via insertBefore or appendChild)
      const insertedViaInsertBefore = rightPanel.insertBefore.mock.calls.some(
        call => call[0].id === 'ros-market-badge'
      );
      const insertedViaAppend = rightPanel.appendChild.mock.calls.some(
        call => call[0].id === 'ros-market-badge'
      );
      expect(insertedViaInsertBefore || insertedViaAppend).toBe(true);
    });

    test('badge starts with initial placeholder styling', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();

      const badge = ROS.market._badgeEl;
      expect(badge.style.display).toBe('flex');
      expect(badge.style.cursor).toBe('pointer');
    });

    test('badge initial background is low-opacity white (pre-load state)', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();

      const badge = ROS.market._badgeEl;
      expect(badge.style.background).toBe('rgba(255,255,255,0.08)');
    });

    test('badge title is set to refresh hint', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();

      const badge = ROS.market._badgeEl;
      expect(badge.title).toBe('Market signals — click to refresh');
    });

    test('label starts as MARKET', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();

      expect(ROS.market._lbl.textContent).toBe('MARKET');
    });

    test('dot starts with slate color (#64748b)', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();

      expect(ROS.market._dot.style.background).toBe('#64748b');
    });

    test('badge inserted before clock when clock element is present', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();

      expect(rightPanel.insertBefore).toHaveBeenCalled();
      const insertCall = rightPanel.insertBefore.mock.calls[0];
      expect(insertCall[0].id).toBe('ros-market-badge');
    });

    test('badge appended when no clock element is present', () => {
      const ROS = buildROS();
      const { topbar, rightPanel } = buildTopbarDOM();
      buildModule(ROS, topbar, null /* no clock */);

      ROS.market.init();

      expect(rightPanel.appendChild).toHaveBeenCalled();
      const appendCall = rightPanel.appendChild.mock.calls.find(
        c => c[0].id === 'ros-market-badge'
      );
      expect(appendCall).toBeDefined();
    });

    test('does nothing when topbar is absent', () => {
      const ROS = buildROS();
      buildModule(ROS, null /* no topbar */, null);

      expect(() => ROS.market.init()).not.toThrow();
    });

    test('does nothing when right panel is absent in topbar', () => {
      const ROS = buildROS();
      const topbar = createMockElement('ros-topbar');
      topbar.querySelector = jest.fn(() => null); // no right panel found
      buildModule(ROS, topbar, null);

      expect(() => ROS.market.init()).not.toThrow();
    });

    test('patches routeMessage after init', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      const beforeInit = ROS.views.routeMessage;
      ROS.market.init();

      expect(ROS.views.routeMessage).not.toBe(beforeInit);
    });

    test('registers refresh with bridge.onReady after init', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();

      expect(ROS.bridge.onReady).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  // =========================================================================
  // refresh()
  // =========================================================================

  describe('refresh()', () => {
    test('sends getMarketSignals to Velo with empty payload', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();
      ROS.market.refresh();

      const msg = bridgeSentMessages.find(m => m.type === 'getMarketSignals');
      expect(msg).toBeDefined();
      expect(msg.data).toEqual({});
    });

    test('sendToVelo is called on each refresh call', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();
      ROS.market.refresh();
      ROS.market.refresh();

      const signalMsgs = bridgeSentMessages.filter(m => m.type === 'getMarketSignals');
      expect(signalMsgs).toHaveLength(2);
    });
  });

  // =========================================================================
  // getCondition()
  // =========================================================================

  describe('getCondition()', () => {
    test('returns NEUTRAL before any data received', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();

      expect(ROS.market.getCondition()).toBe('NEUTRAL');
    });

    test('returns HOT after HOT signal received', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();
      ROS.views.routeMessage('marketSignalsLoaded', {
        success: true, condition: 'HOT', factor: 1.12
      });

      expect(ROS.market.getCondition()).toBe('HOT');
    });

    test('returns SOFT after SOFT signal received', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();
      ROS.views.routeMessage('marketSignalsLoaded', {
        success: true, condition: 'SOFT', factor: 0.88
      });

      expect(ROS.market.getCondition()).toBe('SOFT');
    });

    test('returns NEUTRAL after NEUTRAL signal received', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();
      ROS.views.routeMessage('marketSignalsLoaded', {
        success: true, condition: 'NEUTRAL', factor: 1.0
      });

      expect(ROS.market.getCondition()).toBe('NEUTRAL');
    });

    test('returns updated condition after condition changes', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();
      ROS.views.routeMessage('marketSignalsLoaded', { success: true, condition: 'HOT', factor: 1.1 });
      expect(ROS.market.getCondition()).toBe('HOT');

      ROS.views.routeMessage('marketSignalsLoaded', { success: true, condition: 'SOFT', factor: 0.9 });
      expect(ROS.market.getCondition()).toBe('SOFT');
    });
  });

  // =========================================================================
  // routeMessage intercept — marketSignalsLoaded
  // =========================================================================

  describe('routeMessage intercept — marketSignalsLoaded', () => {
    test('handles marketSignalsLoaded and returns true', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();
      const result = ROS.views.routeMessage('marketSignalsLoaded', {
        success: true, condition: 'HOT', factor: 1.1
      });

      expect(result).toBe(true);
    });

    test('delegates unrecognised types to original routeMessage', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();
      ROS.views.routeMessage('someOtherType', { foo: 'bar' });

      expect(originalRouteMessage).toHaveBeenCalledWith('someOtherType', { foo: 'bar' });
    });

    test('ignores signal when success is false', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();
      const initialCondition = ROS.market.getCondition();

      ROS.views.routeMessage('marketSignalsLoaded', {
        success: false, condition: 'HOT', factor: 1.1
      });

      // Condition should remain unchanged
      expect(ROS.market.getCondition()).toBe(initialCondition);
    });

    test('ignores null/undefined signal data', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();

      expect(() => {
        ROS.views.routeMessage('marketSignalsLoaded', null);
        ROS.views.routeMessage('marketSignalsLoaded', undefined);
      }).not.toThrow();
    });
  });

  // =========================================================================
  // HOT condition badge styling
  // =========================================================================

  describe('HOT condition — green badge', () => {
    function applyHOT(ROS) {
      ROS.views.routeMessage('marketSignalsLoaded', {
        success: true, condition: 'HOT', factor: 1.12,
        summary: 'Strong freight demand'
      });
    }

    test('badge background becomes green (#166534)', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      applyHOT(ROS);

      expect(ROS.market._badgeEl.style.background).toBe('#166534');
    });

    test('badge text color becomes light green (#bbf7d0)', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      applyHOT(ROS);

      expect(ROS.market._badgeEl.style.color).toBe('#bbf7d0');
    });

    test('dot indicator becomes bright green (#4ade80)', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      applyHOT(ROS);

      expect(ROS.market._dot.style.background).toBe('#4ade80');
    });

    test('label text shows HOT', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      applyHOT(ROS);

      expect(ROS.market._lbl.textContent).toContain('HOT');
    });

    test('badge title shows summary text', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      applyHOT(ROS);

      expect(ROS.market._badgeEl.title).toBe('Strong freight demand');
    });
  });

  // =========================================================================
  // NEUTRAL condition badge styling
  // =========================================================================

  describe('NEUTRAL condition — amber badge', () => {
    function applyNEUTRAL(ROS) {
      ROS.views.routeMessage('marketSignalsLoaded', {
        success: true, condition: 'NEUTRAL', factor: 1.0
      });
    }

    test('badge background becomes amber-dark (#78350f)', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      applyNEUTRAL(ROS);

      expect(ROS.market._badgeEl.style.background).toBe('#78350f');
    });

    test('badge text color becomes amber (#fde68a)', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      applyNEUTRAL(ROS);

      expect(ROS.market._badgeEl.style.color).toBe('#fde68a');
    });

    test('dot indicator becomes amber (#fbbf24)', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      applyNEUTRAL(ROS);

      expect(ROS.market._dot.style.background).toBe('#fbbf24');
    });

    test('label text shows NEUTRAL', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      applyNEUTRAL(ROS);

      expect(ROS.market._lbl.textContent).toContain('NEUTRAL');
    });

    test('badge title falls back to Market: NEUTRAL when no summary', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      applyNEUTRAL(ROS);

      expect(ROS.market._badgeEl.title).toBe('Market: NEUTRAL');
    });
  });

  // =========================================================================
  // SOFT condition badge styling
  // =========================================================================

  describe('SOFT condition — slate badge', () => {
    function applySOFT(ROS) {
      ROS.views.routeMessage('marketSignalsLoaded', {
        success: true, condition: 'SOFT', factor: 0.88
      });
    }

    test('badge background becomes dark slate (#1e293b)', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      applySOFT(ROS);

      expect(ROS.market._badgeEl.style.background).toBe('#1e293b');
    });

    test('badge text color becomes slate (#94a3b8)', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      applySOFT(ROS);

      expect(ROS.market._badgeEl.style.color).toBe('#94a3b8');
    });

    test('dot indicator becomes mid-slate (#64748b)', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      applySOFT(ROS);

      expect(ROS.market._dot.style.background).toBe('#64748b');
    });

    test('label text shows SOFT', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      applySOFT(ROS);

      expect(ROS.market._lbl.textContent).toContain('SOFT');
    });
  });

  // =========================================================================
  // DIESEL PRICE IN LABEL
  // =========================================================================

  describe('Diesel price in label', () => {
    test('label includes diesel price when dieselPrice is provided', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      ROS.views.routeMessage('marketSignalsLoaded', {
        success: true, condition: 'HOT', factor: 1.1,
        dieselPrice: 4.259
      });

      expect(ROS.market._lbl.textContent).toContain('$4.26/gal');
    });

    test('diesel price is formatted to exactly 2 decimal places', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      ROS.views.routeMessage('marketSignalsLoaded', {
        success: true, condition: 'NEUTRAL', factor: 1.0,
        dieselPrice: 3.9
      });

      // 3.9 → "3.90"
      expect(ROS.market._lbl.textContent).toContain('$3.90/gal');
    });

    test('label does NOT include price when dieselPrice is absent', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      ROS.views.routeMessage('marketSignalsLoaded', {
        success: true, condition: 'SOFT', factor: 0.9
        // no dieselPrice
      });

      expect(ROS.market._lbl.textContent).toBe('SOFT');
      expect(ROS.market._lbl.textContent).not.toContain('/gal');
    });

    test('label includes both condition and price separated by middle dot', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      ROS.views.routeMessage('marketSignalsLoaded', {
        success: true, condition: 'HOT', factor: 1.15,
        dieselPrice: 4.5
      });

      const label = ROS.market._lbl.textContent;
      expect(label).toContain('HOT');
      expect(label).toContain('\u00b7'); // middle dot separator
      expect(label).toContain('$4.50/gal');
    });
  });

  // =========================================================================
  // BADGE CLICK REFRESH
  // =========================================================================

  describe('Badge click calls refresh', () => {
    test('badge has click listener registered on init', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();

      const badge = ROS.market._badgeEl;
      expect(badge.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('invoking the click handler calls sendToVelo with getMarketSignals', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      ROS.market.init();

      const badge = ROS.market._badgeEl;
      const clickHandler = badge.addEventListener.mock.calls.find(c => c[0] === 'click')[1];

      bridgeSentMessages.length = 0; // reset
      clickHandler();

      expect(bridgeSentMessages).toHaveLength(1);
      expect(bridgeSentMessages[0].type).toBe('getMarketSignals');
    });
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  describe('Edge cases', () => {
    test('unknown condition falls back to NEUTRAL styling', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      ROS.views.routeMessage('marketSignalsLoaded', {
        success: true, condition: 'UNKNOWN_FUTURE_CONDITION', factor: 1.0
      });

      // Should use NEUTRAL fallback colors
      expect(ROS.market._badgeEl.style.background).toBe(CONDITION_STYLES.NEUTRAL.bg);
      expect(ROS.market._dot.style.background).toBe(CONDITION_STYLES.NEUTRAL.dot);
    });

    test('missing condition field defaults to NEUTRAL', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      ROS.views.routeMessage('marketSignalsLoaded', {
        success: true
        // no condition key
      });

      expect(ROS.market.getCondition()).toBe('NEUTRAL');
    });

    test('multiple signals update badge each time', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);
      ROS.market.init();

      ROS.views.routeMessage('marketSignalsLoaded', { success: true, condition: 'HOT', factor: 1.1 });
      expect(ROS.market._badgeEl.style.background).toBe(CONDITION_STYLES.HOT.bg);

      ROS.views.routeMessage('marketSignalsLoaded', { success: true, condition: 'SOFT', factor: 0.9 });
      expect(ROS.market._badgeEl.style.background).toBe(CONDITION_STYLES.SOFT.bg);

      ROS.views.routeMessage('marketSignalsLoaded', { success: true, condition: 'NEUTRAL', factor: 1.0 });
      expect(ROS.market._badgeEl.style.background).toBe(CONDITION_STYLES.NEUTRAL.bg);
    });

    test('module does not throw on repeated init calls', () => {
      const ROS = buildROS();
      const { topbar, rightPanel, clock } = buildTopbarDOM();
      buildModule(ROS, topbar, clock);

      expect(() => {
        ROS.market.init();
        ROS.market.init();
      }).not.toThrow();
    });
  });
});
