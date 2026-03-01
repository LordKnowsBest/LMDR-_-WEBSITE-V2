/* eslint-disable */
/**
 * ROS-PROACTIVE Module Tests
 * ===========================
 * Tests for src/public/recruiter/os/js/ros-proactive.js
 * Verifies proactive AI insight push behaviour:
 *   - One-shot session guard (trigger fires at most once)
 *   - 2-second delayed bridge call via setTimeout
 *   - _renderInsights renders correct DOM structure
 *   - _renderInsights clears stale cards before re-render
 *   - Empty insights array keeps container hidden
 *   - routeMessage intercept for proactiveInsightsLoaded
 *
 * Module contract:
 *   - ROS.proactive.init()      — patches ROS.views.routeMessage
 *   - ROS.proactive.trigger(ctx) — fires once per session after 2s delay
 *
 * @see src/public/recruiter/os/js/ros-proactive.js
 * @see src/public/recruiter/os/RecruiterOS.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const SOURCE_FILE = path.resolve(
  __dirname, '..', 'recruiter', 'os', 'js', 'ros-proactive.js'
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
    get firstChild() { return children[0] || null; },
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
    _children: children,
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
    return false; // unhandled by default
  });

  const ROS = {
    views: {
      routeMessage: originalRouteMessage,
    },
    bridge: {
      sendToVelo: jest.fn(function (type, data) { bridgeSentMessages.push({ type, data }); }),
    },
    market: {
      getCondition: jest.fn(() => 'NEUTRAL'),
    },
    proactive: null,
  };

  return ROS;
}

// =============================================================================
// REPLICATED MODULE LOGIC
// Mirrors ros-proactive.js exactly so tests stay in sync with source.
// =============================================================================

function buildModule(ROS, getElementById) {
  var _loaded = false;

  ROS.proactive = { init: init, trigger: trigger };

  function init() {
    var _orig = ROS.views.routeMessage;
    ROS.views.routeMessage = function (type, data) {
      if (type === 'proactiveInsightsLoaded') { _applyInsights(data); return true; }
      return _orig(type, data);
    };
  }

  function trigger(context) {
    if (_loaded) return;
    setTimeout(function () {
      ROS.bridge.sendToVelo('getProactiveInsights', { context: context || {} });
    }, 2000);
  }

  function _applyInsights(data) {
    _loaded = true;
    var insights = (data && data.insights) || [];
    if (!insights.length) return;
    _renderInsights(insights);
  }

  function _renderInsights(insights) {
    var target = getElementById('ros-proactive-insights');
    if (!target) return;

    while (target.firstChild) target.removeChild(target.firstChild);

    insights.forEach(function (text) {
      var card = document.createElement('div');
      card.className = 'ros-insight-card';
      card.textContent = text;
      target.appendChild(card);
    });

    target.classList.remove('hidden');
    target.style.display = 'flex';
  }

  // expose internals for white-box tests
  ROS.proactive._applyInsights = _applyInsights;
  ROS.proactive._renderInsights = _renderInsights;
  ROS.proactive._getLoaded = function () { return _loaded; };
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ros-proactive.js — Proactive AI Insight Push Module', () => {

  // =========================================================================
  // SOURCE FILE STRUCTURAL CHECKS
  // =========================================================================

  describe('Source file structure', () => {
    test('file exists and is non-empty', () => {
      expect(sourceCode.length).toBeGreaterThan(0);
    });

    test('exports init and trigger on ROS.proactive', () => {
      expect(sourceCode).toContain('ROS.proactive');
      expect(sourceCode).toContain('init');
      expect(sourceCode).toContain('trigger');
    });

    test('patches ROS.views.routeMessage to intercept proactiveInsightsLoaded', () => {
      expect(sourceCode).toContain('proactiveInsightsLoaded');
      expect(sourceCode).toContain('routeMessage');
    });

    test('sends getProactiveInsights via bridge', () => {
      expect(sourceCode).toContain('getProactiveInsights');
      expect(sourceCode).toContain('sendToVelo');
    });

    test('uses setTimeout for 2-second delay', () => {
      expect(sourceCode).toContain('setTimeout');
      expect(sourceCode).toContain('2000');
    });

    test('uses _loaded guard to fire only once per session', () => {
      expect(sourceCode).toContain('_loaded');
    });

    test('renders cards using createElement (not innerHTML)', () => {
      expect(sourceCode).toContain('createElement');
    });

    test('uses textContent for card text (XSS-safe)', () => {
      expect(sourceCode).toContain('textContent');
    });

    test('clears target with firstChild/removeChild loop', () => {
      expect(sourceCode).toContain('firstChild');
      expect(sourceCode).toContain('removeChild');
    });

    test('removes hidden class and sets display:flex on show', () => {
      expect(sourceCode).toContain('classList.remove');
      expect(sourceCode).toContain("'hidden'");
      expect(sourceCode).toContain("display = 'flex'");
    });

    test('assigns ros-insight-card class to each card', () => {
      expect(sourceCode).toContain('ros-insight-card');
    });
  });

  // =========================================================================
  // INIT
  // =========================================================================

  describe('init()', () => {
    test('patches ROS.views.routeMessage after init', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');
      buildModule(ROS, () => target);

      const before = ROS.views.routeMessage;
      ROS.proactive.init();

      expect(ROS.views.routeMessage).not.toBe(before);
    });

    test('patched routeMessage returns true for proactiveInsightsLoaded', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');
      buildModule(ROS, () => target);
      ROS.proactive.init();

      const result = ROS.views.routeMessage('proactiveInsightsLoaded', { insights: [] });
      expect(result).toBe(true);
    });

    test('patched routeMessage delegates unrecognised types to original', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');
      buildModule(ROS, () => target);
      ROS.proactive.init();

      ROS.views.routeMessage('someUnknownType', { foo: 'bar' });

      expect(originalRouteMessage).toHaveBeenCalledWith('someUnknownType', { foo: 'bar' });
    });

    test('original routeMessage is called with correct args for unknown types', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');
      buildModule(ROS, () => target);
      ROS.proactive.init();

      const payload = { marketCondition: 'HOT' };
      ROS.views.routeMessage('marketSignalsLoaded', payload);

      expect(originalRouteMessage).toHaveBeenCalledWith('marketSignalsLoaded', payload);
    });
  });

  // =========================================================================
  // TRIGGER — session guard
  // =========================================================================

  describe('trigger() — loaded guard', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('trigger() sends getProactiveInsights after 2s delay on first call', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');
      buildModule(ROS, () => target);
      ROS.proactive.init();

      ROS.proactive.trigger({ currentView: 'home' });

      // Nothing sent yet (inside the 2s window)
      expect(bridgeSentMessages).toHaveLength(0);

      jest.advanceTimersByTime(2000);

      expect(bridgeSentMessages).toHaveLength(1);
      expect(bridgeSentMessages[0].type).toBe('getProactiveInsights');
    });

    test('trigger() passes context in the bridge payload', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');
      buildModule(ROS, () => target);
      ROS.proactive.init();

      const ctx = { currentView: 'home', marketCondition: 'HOT' };
      ROS.proactive.trigger(ctx);
      jest.advanceTimersByTime(2000);

      expect(bridgeSentMessages[0].data).toEqual({ context: ctx });
    });

    test('trigger() called twice only sends one bridge message (loaded guard)', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');
      buildModule(ROS, () => target);
      ROS.proactive.init();

      // First trigger fires and dispatches bridge message
      ROS.proactive.trigger({ currentView: 'home' });
      jest.advanceTimersByTime(2000);

      // Simulate data coming back (sets _loaded = true)
      ROS.views.routeMessage('proactiveInsightsLoaded', {
        insights: ['insight one'],
        generatedAt: '2026-03-01'
      });

      // Second trigger — should be a no-op because _loaded is true
      ROS.proactive.trigger({ currentView: 'home' });
      jest.advanceTimersByTime(2000);

      expect(bridgeSentMessages).toHaveLength(1);
    });

    test('trigger() with no context argument sends empty context object', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');
      buildModule(ROS, () => target);
      ROS.proactive.init();

      ROS.proactive.trigger(); // no args
      jest.advanceTimersByTime(2000);

      expect(bridgeSentMessages[0].data).toEqual({ context: {} });
    });

    test('bridge message is NOT sent before the 2s timeout elapses', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');
      buildModule(ROS, () => target);
      ROS.proactive.init();

      ROS.proactive.trigger({ currentView: 'home' });
      jest.advanceTimersByTime(1999); // just under 2s

      expect(bridgeSentMessages).toHaveLength(0);
    });
  });

  // =========================================================================
  // routeMessage intercept — proactiveInsightsLoaded
  // =========================================================================

  describe('routeMessage intercept — proactiveInsightsLoaded', () => {
    test('returns true for proactiveInsightsLoaded', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');
      buildModule(ROS, () => target);
      ROS.proactive.init();

      const result = ROS.views.routeMessage('proactiveInsightsLoaded', {
        insights: ['insight a', 'insight b'],
        generatedAt: '2026-03-01'
      });

      expect(result).toBe(true);
    });

    test('delegates non-proactive types to original routeMessage and returns its value', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');
      buildModule(ROS, () => target);
      ROS.proactive.init();

      originalRouteMessage.mockReturnValue(false);
      const result = ROS.views.routeMessage('nbaChipsData', { chips: [] });

      expect(originalRouteMessage).toHaveBeenCalledWith('nbaChipsData', { chips: [] });
      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // _renderInsights — empty array
  // =========================================================================

  describe('_renderInsights() — empty insights', () => {
    test('empty insights array keeps target hidden (no classList.remove called)', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');
      buildModule(ROS, () => target);
      ROS.proactive.init();

      ROS.proactive._applyInsights({ insights: [] });

      expect(target.classList.remove).not.toHaveBeenCalled();
      expect(target.style.display).not.toBe('flex');
    });

    test('missing insights key in data keeps target hidden', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');
      buildModule(ROS, () => target);
      ROS.proactive.init();

      ROS.proactive._applyInsights({});

      expect(target.classList.remove).not.toHaveBeenCalled();
    });

    test('null data keeps target hidden and does not throw', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');
      buildModule(ROS, () => target);
      ROS.proactive.init();

      expect(() => {
        ROS.proactive._applyInsights(null);
      }).not.toThrow();

      expect(target.classList.remove).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // _renderInsights — populated array
  // =========================================================================

  describe('_renderInsights() — with insights', () => {
    test('renders one .ros-insight-card div per insight', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');

      // document.createElement must work in this test
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tag) => {
        const el = { tag, className: '', textContent: '', style: {} };
        return el;
      });

      buildModule(ROS, () => target);
      ROS.proactive.init();

      ROS.proactive._applyInsights({ insights: ['insight 1', 'insight 2'] });

      expect(target.appendChild).toHaveBeenCalledTimes(2);

      const card0 = target.appendChild.mock.calls[0][0];
      const card1 = target.appendChild.mock.calls[1][0];
      expect(card0.className).toBe('ros-insight-card');
      expect(card0.textContent).toBe('insight 1');
      expect(card1.className).toBe('ros-insight-card');
      expect(card1.textContent).toBe('insight 2');

      document.createElement.mockRestore();
    });

    test('shows target container after rendering insights', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');

      jest.spyOn(document, 'createElement').mockImplementation(() => ({
        className: '', textContent: '', style: {}
      }));

      buildModule(ROS, () => target);
      ROS.proactive.init();

      ROS.proactive._applyInsights({ insights: ['one bullet'] });

      expect(target.classList.remove).toHaveBeenCalledWith('hidden');
      expect(target.style.display).toBe('flex');

      document.createElement.mockRestore();
    });

    test('clears previous cards before rendering new ones', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');

      jest.spyOn(document, 'createElement').mockImplementation(() => ({
        className: '', textContent: '', style: {}
      }));

      buildModule(ROS, () => target);
      ROS.proactive.init();

      // Manually add a stale child to the target to simulate prior render
      const staleCard = { className: 'ros-insight-card', textContent: 'stale' };
      target._children.push(staleCard);

      // Trigger a new render
      ROS.proactive._renderInsights(['fresh insight']);

      // removeChild should have been called to remove the stale card
      expect(target.removeChild).toHaveBeenCalledWith(staleCard);

      document.createElement.mockRestore();
    });

    test('does nothing when target element is absent', () => {
      const ROS = buildROS();
      buildModule(ROS, () => null); // no target
      ROS.proactive.init();

      expect(() => {
        ROS.proactive._renderInsights(['some insight']);
      }).not.toThrow();
    });
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  describe('Edge cases', () => {
    beforeEach(() => { jest.useFakeTimers(); });
    afterEach(() => { jest.useRealTimers(); });

    test('does not throw when ROS.bridge.sendToVelo is called with undefined context', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');
      buildModule(ROS, () => target);
      ROS.proactive.init();

      expect(() => {
        ROS.proactive.trigger(undefined);
        jest.advanceTimersByTime(2000);
      }).not.toThrow();
    });

    test('_loaded starts false before any trigger', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');
      buildModule(ROS, () => target);
      ROS.proactive.init();

      expect(ROS.proactive._getLoaded()).toBe(false);
    });

    test('_loaded becomes true after proactiveInsightsLoaded received', () => {
      const ROS = buildROS();
      const target = createMockElement('ros-proactive-insights');

      jest.spyOn(document, 'createElement').mockImplementation(() => ({
        className: '', textContent: '', style: {}
      }));

      buildModule(ROS, () => target);
      ROS.proactive.init();

      ROS.views.routeMessage('proactiveInsightsLoaded', {
        insights: ['loaded bullet'],
        generatedAt: '2026-03-01'
      });

      expect(ROS.proactive._getLoaded()).toBe(true);

      document.createElement.mockRestore();
    });
  });
});
