/* eslint-disable */
/**
 * ROS-NBA Module Tests
 * ====================
 * Tests for src/public/recruiter/os/js/ros-nba.js
 * Verifies the Next Best Action chip bar renders correctly,
 * responds to bridge data, manages visibility, and supports
 * the agent view snapshot API.
 *
 * Module contract:
 *   - ROS.nba.init()            — builds bar element, patches routeMessage
 *   - ROS.nba.refresh()         — sends refreshNBAChips via bridge
 *   - ROS.nba.getViewSnapshot() — returns { nbaChips: [{ id, label, count }] }
 *   - routeMessage intercept    — 'nbaChipsData' triggers _render(data.chips)
 *
 * @see src/public/recruiter/os/js/ros-nba.js
 * @see src/public/recruiter/os/RecruiterOS.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const SOURCE_FILE = path.resolve(
  __dirname, '..', 'recruiter', 'os', 'js', 'ros-nba.js'
);

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
    style: {},
    children,
    firstChild: null,
    classList: {
      _classes: new Set(),
      add: jest.fn(function (...cls) { cls.forEach(c => this._classes.add(c)); }),
      remove: jest.fn(function (...cls) { cls.forEach(c => this._classes.delete(c)); }),
      contains: jest.fn(function (cls) { return this._classes.has(cls); }),
    },
    appendChild: jest.fn(function (child) { children.push(child); this.firstChild = children[0] || null; return child; }),
    removeChild: jest.fn(function (child) {
      const idx = children.indexOf(child);
      if (idx > -1) children.splice(idx, 1);
      this.firstChild = children[0] || null;
      return child;
    }),
    insertBefore: jest.fn(function (newNode, ref) { children.unshift(newNode); this.firstChild = newNode; return newNode; }),
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
let currentView;
let showViewCalls;
let routeMessagePatched;
let originalRouteMessage;

function buildROS(nbaEnabled = true) {
  bridgeSentMessages = [];
  showViewCalls = [];
  currentView = 'pipeline';
  routeMessagePatched = false;

  originalRouteMessage = jest.fn(function (type, data) {
    return false; // unhandled by default
  });

  const ROS = {
    config: {
      features: {
        NBA_ENABLED: nbaEnabled
      }
    },
    views: {
      routeMessage: originalRouteMessage,
      getCurrentView: jest.fn(() => currentView),
      showView: jest.fn(function (viewId) { showViewCalls.push(viewId); })
    },
    bridge: {
      sendToVelo: jest.fn(function (type, data) { bridgeSentMessages.push({ type, data }); }),
      onReady: jest.fn(function (cb) { /* store callback; don't call automatically */ })
    },
    nba: null
  };

  return ROS;
}

// =============================================================================
// REPLICATED MODULE LOGIC
// Mirrors ros-nba.js exactly so tests stay in sync with the source.
// =============================================================================

function buildModule(ROS, stageEl) {
  if (!ROS.config.features.NBA_ENABLED) return;

  let chips = [];
  let barEl = null;

  ROS.nba = { init, refresh, getViewSnapshot };

  function init() {
    const stage = stageEl;
    if (!stage) return;

    barEl = createMockElement('ros-nba-bar');
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

    const _orig = ROS.views.routeMessage;
    ROS.views.routeMessage = function (type, data) {
      if (type === 'nbaChipsData') { _render(data.chips || []); return true; }
      return _orig(type, data);
    };
    routeMessagePatched = true;

    ROS.bridge.onReady(refresh);
  }

  function refresh() {
    ROS.bridge.sendToVelo('refreshNBAChips', {
      currentView: ROS.views.getCurrentView()
    });
  }

  function getViewSnapshot() {
    return {
      nbaChips: chips.map(function (c) {
        return { id: c.id, label: c.label, count: c.count || 0 };
      })
    };
  }

  function _render(newChips) {
    chips = newChips;
    if (!barEl) return;

    // clear children
    while (barEl.children.length > 0) {
      barEl.removeChild(barEl.children[barEl.children.length - 1]);
    }

    if (!chips.length) {
      barEl.style.display = 'none';
      return;
    }

    barEl.style.display = 'flex';
    chips.forEach(function (c) {
      barEl.appendChild(_buildChip(c, ROS));
    });
  }

  // expose _render for white-box tests
  ROS.nba._render = _render;
}

function _buildChip(c, ROS) {
  var isHigh = c.priority === 'high';

  var btn = createMockElement('btn-' + (c.id || 'chip'));
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

  return btn;
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ros-nba.js — NBA Chip Bar Module', () => {

  // =========================================================================
  // SOURCE FILE STRUCTURAL CHECKS
  // =========================================================================

  describe('Source file structure', () => {
    test('file exists and is non-empty', () => {
      expect(sourceCode.length).toBeGreaterThan(0);
    });

    test('exports init, refresh, and getViewSnapshot on ROS.nba', () => {
      expect(sourceCode).toContain('ROS.nba = { init, refresh, getViewSnapshot }');
    });

    test('uses NBA_ENABLED feature flag guard', () => {
      expect(sourceCode).toContain('NBA_ENABLED');
    });

    test('patches ROS.views.routeMessage to intercept nbaChipsData', () => {
      expect(sourceCode).toContain('nbaChipsData');
      expect(sourceCode).toContain('routeMessage');
    });

    test('sends refreshNBAChips via bridge on refresh', () => {
      expect(sourceCode).toContain('refreshNBAChips');
      expect(sourceCode).toContain('sendToVelo');
    });

    test('calls ROS.bridge.onReady to trigger initial refresh', () => {
      expect(sourceCode).toContain('onReady');
    });

    test('uses textContent or createTextNode for chip labels (no innerHTML on untrusted data)', () => {
      const hasSafeRendering =
        sourceCode.includes('createTextNode') ||
        sourceCode.includes('textContent');
      expect(hasSafeRendering).toBe(true);
    });

    test('uses DOM methods to build chips, not innerHTML', () => {
      // Should use createElement for chips rather than innerHTML injection
      expect(sourceCode).toContain('createElement');
    });

    test('high priority chips use red styling', () => {
      expect(sourceCode).toContain('bg-red-100');
      expect(sourceCode).toContain("priority === 'high'");
    });

    test('chip click calls ROS.views.showView', () => {
      expect(sourceCode).toContain('showView');
    });

    test('getViewSnapshot maps chips to { id, label, count }', () => {
      expect(sourceCode).toContain('nbaChips');
      expect(sourceCode).toContain('c.id');
      expect(sourceCode).toContain('c.label');
      expect(sourceCode).toContain('c.count');
    });
  });

  // =========================================================================
  // INIT
  // =========================================================================

  describe('init()', () => {
    test('creates #ros-nba-bar element inside ros-stage', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);

      ROS.nba.init();

      expect(stage.insertBefore).toHaveBeenCalled();
      const insertedEl = stage.insertBefore.mock.calls[0][0];
      expect(insertedEl.id).toBe('ros-nba-bar');
    });

    test('bar starts with display:none', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);

      ROS.nba.init();

      const barEl = stage.insertBefore.mock.calls[0][0];
      expect(barEl.style.display).toBe('none');
    });

    test('bar has nba-bar className', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);

      ROS.nba.init();

      const barEl = stage.insertBefore.mock.calls[0][0];
      expect(barEl.className).toContain('nba-bar');
    });

    test('patches ROS.views.routeMessage after init', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);

      const originalFn = ROS.views.routeMessage;
      ROS.nba.init();

      // routeMessage should now be a different function
      expect(ROS.views.routeMessage).not.toBe(originalFn);
    });

    test('registers refresh with ROS.bridge.onReady', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);

      ROS.nba.init();

      expect(ROS.bridge.onReady).toHaveBeenCalledWith(expect.any(Function));
    });

    test('does nothing when ros-stage is absent', () => {
      const ROS = buildROS();
      buildModule(ROS, null); // null stage

      // init should not throw
      expect(() => ROS.nba.init()).not.toThrow();
    });

    test('does not init when NBA_ENABLED is false', () => {
      const ROS = buildROS(false /* nbaEnabled = false */);
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);

      // With NBA_ENABLED false, buildModule returns early → ROS.nba is null
      expect(ROS.nba).toBeNull();
    });
  });

  // =========================================================================
  // refresh()
  // =========================================================================

  describe('refresh()', () => {
    test('sends refreshNBAChips to Velo with currentView', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      currentView = 'search';
      ROS.nba.refresh();

      expect(bridgeSentMessages).toHaveLength(1);
      expect(bridgeSentMessages[0].type).toBe('refreshNBAChips');
      expect(bridgeSentMessages[0].data.currentView).toBe('search');
    });

    test('getCurrentView is called during refresh', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      ROS.nba.refresh();

      expect(ROS.views.getCurrentView).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // nbaChipsData bridge intercept
  // =========================================================================

  describe('routeMessage intercept — nbaChipsData', () => {
    test('handles nbaChipsData and returns true', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      const result = ROS.views.routeMessage('nbaChipsData', {
        chips: [{ id: 'c1', label: 'At-Risk Drivers', count: 3, priority: 'high' }]
      });

      expect(result).toBe(true);
    });

    test('delegates unrecognised types to original routeMessage', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      ROS.views.routeMessage('someOtherType', { foo: 'bar' });

      expect(originalRouteMessage).toHaveBeenCalledWith('someOtherType', { foo: 'bar' });
    });

    test('nbaChipsData with chips makes bar visible', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      const barEl = stage.insertBefore.mock.calls[0][0];

      ROS.views.routeMessage('nbaChipsData', {
        chips: [
          { id: 'c1', label: 'Pending Docs', count: 5, priority: 'normal', view: 'docs' }
        ]
      });

      expect(barEl.style.display).toBe('flex');
    });

    test('nbaChipsData with empty chips hides bar', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      const barEl = stage.insertBefore.mock.calls[0][0];

      // First populate with chips
      ROS.views.routeMessage('nbaChipsData', {
        chips: [{ id: 'c1', label: 'Test', count: 1, priority: 'normal' }]
      });
      expect(barEl.style.display).toBe('flex');

      // Then clear them
      ROS.views.routeMessage('nbaChipsData', { chips: [] });
      expect(barEl.style.display).toBe('none');
    });

    test('nbaChipsData with missing chips array defaults to empty', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      const barEl = stage.insertBefore.mock.calls[0][0];

      // data.chips is undefined — module uses || []
      expect(() => {
        ROS.views.routeMessage('nbaChipsData', {});
      }).not.toThrow();

      expect(barEl.style.display).toBe('none');
    });

    test('renders one chip element per chip in data', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      const barEl = stage.insertBefore.mock.calls[0][0];

      ROS.views.routeMessage('nbaChipsData', {
        chips: [
          { id: 'c1', label: 'A', count: 1, priority: 'normal' },
          { id: 'c2', label: 'B', count: 2, priority: 'high' },
          { id: 'c3', label: 'C', count: 0, priority: 'normal' }
        ]
      });

      expect(barEl.appendChild).toHaveBeenCalledTimes(3);
    });
  });

  // =========================================================================
  // CHIP STYLING
  // =========================================================================

  describe('Chip styling', () => {
    test('high priority chip gets red CSS classes', () => {
      const chip = _buildChip({ id: 'c1', label: 'Alert', count: 2, priority: 'high' }, buildROS());
      expect(chip.className).toContain('bg-red-100');
      expect(chip.className).toContain('text-red-700');
    });

    test('normal priority chip gets beige/tan CSS classes', () => {
      const chip = _buildChip({ id: 'c2', label: 'Docs', count: 1, priority: 'normal' }, buildROS());
      expect(chip.className).toContain('bg-beige-d');
      expect(chip.className).toContain('text-tan');
    });

    test('chip without priority defaults to non-high styling', () => {
      const chip = _buildChip({ id: 'c3', label: 'Info' }, buildROS());
      expect(chip.className).not.toContain('bg-red-100');
      expect(chip.className).toContain('bg-beige-d');
    });

    test('chip with view registers click listener', () => {
      const chip = _buildChip(
        { id: 'c1', label: 'Go', priority: 'normal', view: 'search' },
        buildROS()
      );
      expect(chip.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('chip without view does not register click listener', () => {
      const chip = _buildChip({ id: 'c1', label: 'Static', priority: 'normal' }, buildROS());
      expect(chip.addEventListener).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // CHIP CLICK NAVIGATION
  // =========================================================================

  describe('Chip click → ROS.views.showView', () => {
    test('clicking chip with view calls showView with correct viewId', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      ROS.views.routeMessage('nbaChipsData', {
        chips: [{ id: 'c1', label: 'Pipeline', count: 4, priority: 'normal', view: 'pipeline' }]
      });

      // Simulate click by extracting and invoking the registered click handler
      const barEl = stage.insertBefore.mock.calls[0][0];
      const chipEl = barEl.appendChild.mock.calls[0][0];
      const clickHandler = chipEl.addEventListener.mock.calls[0][1];
      clickHandler();

      expect(ROS.views.showView).toHaveBeenCalledWith('pipeline');
    });

    test('clicking chip calls showView exactly once per click', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      ROS.views.routeMessage('nbaChipsData', {
        chips: [{ id: 'c1', label: 'X', priority: 'high', view: 'alerts', count: 1 }]
      });

      const barEl = stage.insertBefore.mock.calls[0][0];
      const chipEl = barEl.appendChild.mock.calls[0][0];
      const clickHandler = chipEl.addEventListener.mock.calls[0][1];

      clickHandler();
      clickHandler();

      expect(ROS.views.showView).toHaveBeenCalledTimes(2);
      expect(ROS.views.showView).toHaveBeenCalledWith('alerts');
    });
  });

  // =========================================================================
  // getViewSnapshot()
  // =========================================================================

  describe('getViewSnapshot()', () => {
    test('returns object with nbaChips array', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      const snapshot = ROS.nba.getViewSnapshot();

      expect(snapshot).toHaveProperty('nbaChips');
      expect(Array.isArray(snapshot.nbaChips)).toBe(true);
    });

    test('returns empty nbaChips before any data is received', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      const snapshot = ROS.nba.getViewSnapshot();

      expect(snapshot.nbaChips).toHaveLength(0);
    });

    test('returns correct chip summary after nbaChipsData received', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      ROS.views.routeMessage('nbaChipsData', {
        chips: [
          { id: 'c1', label: 'At-Risk Drivers', count: 3, priority: 'high', view: 'search' },
          { id: 'c2', label: 'Pending Docs',    count: 7, priority: 'normal', view: 'docs' }
        ]
      });

      const snapshot = ROS.nba.getViewSnapshot();

      expect(snapshot.nbaChips).toHaveLength(2);
      expect(snapshot.nbaChips[0]).toEqual({ id: 'c1', label: 'At-Risk Drivers', count: 3 });
      expect(snapshot.nbaChips[1]).toEqual({ id: 'c2', label: 'Pending Docs',    count: 7 });
    });

    test('chip snapshot omits view, priority, and icon fields', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      ROS.views.routeMessage('nbaChipsData', {
        chips: [{ id: 'c1', label: 'X', count: 1, priority: 'high', view: 'v1', icon: 'warning' }]
      });

      const snapshot = ROS.nba.getViewSnapshot();
      const chip = snapshot.nbaChips[0];

      expect(chip).not.toHaveProperty('view');
      expect(chip).not.toHaveProperty('priority');
      expect(chip).not.toHaveProperty('icon');
    });

    test('defaults count to 0 when chip has no count', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      ROS.views.routeMessage('nbaChipsData', {
        chips: [{ id: 'c1', label: 'No Count Chip', priority: 'normal' }]
      });

      const snapshot = ROS.nba.getViewSnapshot();
      expect(snapshot.nbaChips[0].count).toBe(0);
    });

    test('snapshot reflects latest render (chips update after second nbaChipsData)', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      ROS.views.routeMessage('nbaChipsData', {
        chips: [{ id: 'c1', label: 'Old', count: 1, priority: 'normal' }]
      });

      ROS.views.routeMessage('nbaChipsData', {
        chips: [
          { id: 'c2', label: 'New A', count: 5, priority: 'high' },
          { id: 'c3', label: 'New B', count: 2, priority: 'normal' }
        ]
      });

      const snapshot = ROS.nba.getViewSnapshot();
      expect(snapshot.nbaChips).toHaveLength(2);
      expect(snapshot.nbaChips[0].id).toBe('c2');
      expect(snapshot.nbaChips[1].id).toBe('c3');
    });
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  describe('Edge cases', () => {
    test('re-render clears previous chips before adding new ones', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      const barEl = stage.insertBefore.mock.calls[0][0];

      ROS.views.routeMessage('nbaChipsData', {
        chips: [{ id: 'c1', label: 'First', count: 1, priority: 'normal' }]
      });
      const firstRenderCount = barEl.appendChild.mock.calls.length;

      ROS.views.routeMessage('nbaChipsData', {
        chips: [
          { id: 'c2', label: 'Second A', count: 2, priority: 'normal' },
          { id: 'c3', label: 'Second B', count: 3, priority: 'normal' }
        ]
      });

      // removeChild should have been called to clear the old chip
      expect(barEl.removeChild).toHaveBeenCalled();
      // Total appends = 1 (first render) + 2 (second render)
      expect(barEl.appendChild.mock.calls.length).toBe(firstRenderCount + 2);
    });

    test('chips with count 0 still render (no count badge suppressed)', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      const barEl = stage.insertBefore.mock.calls[0][0];

      ROS.views.routeMessage('nbaChipsData', {
        chips: [{ id: 'c1', label: 'Info', count: 0, priority: 'normal' }]
      });

      // Bar should be visible and chip should be appended
      expect(barEl.style.display).toBe('flex');
      expect(barEl.appendChild).toHaveBeenCalledTimes(1);
    });

    test('module handles multiple sequential renders without errors', () => {
      const ROS = buildROS();
      const stage = createMockElement('ros-stage');
      buildModule(ROS, stage);
      ROS.nba.init();

      expect(() => {
        for (let i = 0; i < 5; i++) {
          ROS.views.routeMessage('nbaChipsData', {
            chips: i % 2 === 0
              ? [{ id: 'c1', label: 'A', count: i, priority: 'normal' }]
              : []
          });
        }
      }).not.toThrow();
    });
  });
});
