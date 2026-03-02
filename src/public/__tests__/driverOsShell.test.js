/**
 * driverOsShell.test.js
 * ═══════════════════════════════════════════════════════════════════
 * Tests for DriverOS bridge, core (VLM, nav, gestures), and bootstrap.
 * Uses vm + minimal sandbox approach (no jsdom dependency).
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Paths to source files
const CONTRACT_PATH = path.resolve(__dirname, '../driver/os/js/driver-os-contract.js');
const BRIDGE_PATH = path.resolve(__dirname, '../driver/os/js/driver-os-bridge.js');
const CORE_PATH = path.resolve(__dirname, '../driver/os/js/driver-os-core.js');

/**
 * Build a minimal DOM sandbox for IIFE modules.
 * No jsdom — just enough to satisfy the scripts.
 */
function createMockDOM() {
  var elements = {};

  var sandbox = {
    window: {},
    document: {
      getElementById: function (id) { return elements[id] || null; },
      createElement: function (tag) {
        return {
          tagName: tag.toUpperCase(),
          className: '',
          children: [],
          textContent: '',
          _attrs: {},
          _listeners: {},
          style: {},
          src: '',
          appendChild: function (child) { this.children.push(child); },
          addEventListener: function (type, fn) {
            if (!this._listeners[type]) this._listeners[type] = [];
            this._listeners[type].push(fn);
          },
          setAttribute: function (k, v) { this._attrs[k] = v; },
          getAttribute: function (k) { return this._attrs[k]; },
          removeAttribute: function (k) { delete this._attrs[k]; },
          classList: {
            _classes: [],
            add: function (c) { if (this._classes.indexOf(c) === -1) this._classes.push(c); },
            remove: function (c) { this._classes = this._classes.filter(function (x) { return x !== c; }); },
            contains: function (c) { return this._classes.indexOf(c) !== -1; }
          }
        };
      },
      body: { appendChild: function () {} }
    },
    Object: Object,
    Array: Array,
    Promise: Promise,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    console: console,
    _handlers: {},
    _sentMessages: []
  };

  // Wire window.addEventListener
  sandbox.window.addEventListener = function (type, handler) {
    if (!sandbox._handlers[type]) sandbox._handlers[type] = [];
    sandbox._handlers[type].push(handler);
  };

  // Wire window.parent.postMessage to capture sends
  sandbox.window.parent = {
    postMessage: function (data, origin) {
      sandbox._sentMessages.push(data);
    }
  };

  // Alias: scripts access window.DOS, window.parent, etc.
  sandbox.window.DOS = undefined;

  // Create app-root and bottom-nav elements
  var appRoot = sandbox.document.createElement('div');
  appRoot.id = 'app-root';
  // innerHTML support for unmount
  var appRootChildren = [];
  Object.defineProperty(appRoot, 'innerHTML', {
    get: function () { return appRootChildren.length > 0 ? '<children>' : ''; },
    set: function (v) { if (v === '') { appRootChildren.length = 0; appRoot.children = []; } }
  });
  elements['app-root'] = appRoot;

  var bottomNav = sandbox.document.createElement('nav');
  bottomNav.id = 'bottom-nav';
  elements['bottom-nav'] = bottomNav;

  var agentOverlay = sandbox.document.createElement('div');
  agentOverlay.id = 'agent-overlay';
  elements['agent-overlay'] = agentOverlay;

  return { sandbox: sandbox, elements: elements };
}

/**
 * Load all DriverOS modules into the sandbox in dependency order.
 * Returns the DOS namespace.
 */
function loadModules(mockDom) {
  var sb = mockDom.sandbox;

  // Build vm context: IIFEs reference both `window.X` and bare `X`
  // so we create a self-referencing window that proxies to the context
  var ctx = {
    document: sb.document,
    Object: Object,
    Array: Array,
    Promise: Promise,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    console: console
  };
  // window === ctx so that `window.DOS` and bare `DOS` resolve the same
  ctx.window = ctx;
  // Wire parent.postMessage
  ctx.parent = sb.window.parent;
  // Wire addEventListener
  ctx.addEventListener = sb.window.addEventListener;
  vm.createContext(ctx);

  // 1. Load contract
  var contractSrc = fs.readFileSync(CONTRACT_PATH, 'utf8');
  vm.runInContext(contractSrc, ctx, { filename: 'driver-os-contract.js' });

  // 2. Load bridge
  var bridgeSrc = fs.readFileSync(BRIDGE_PATH, 'utf8');
  vm.runInContext(bridgeSrc, ctx, { filename: 'driver-os-bridge.js' });

  // 3. Inject a minimal config for core.js to work
  vm.runInContext(`
    window.DOS.config = {
      SESSION_CONTEXT: { memberId: null, driverId: null },
      FEATURE_FLAGS: {},
      VIEW_REGISTRY: {
        'matching': '',
        'jobs': '',
        'dashboard': '',
        'career': '',
        'documents': '',
        'surveys': '',
        'road': '',
        'announcements': '',
        'policies': '',
        'retention': '',
        'gamification': '',
        'badges': '',
        'challenges': '',
        'forums': '',
        'health': '',
        'pet-friendly': '',
        'mentors': '',
        'mentor-profile': '',
        'opportunities': ''
      },
      NAV_ZONES: [
        { id: 'match', label: 'Match', icon: 'search', defaultView: 'matching', views: ['matching', 'opportunities', 'jobs'] },
        { id: 'career', label: 'Career', icon: 'dashboard', defaultView: 'dashboard', views: ['dashboard', 'career', 'documents'] },
        { id: 'play', label: 'Play', icon: 'emoji_events', defaultView: 'gamification', views: ['gamification', 'badges', 'challenges'] },
        { id: 'road', label: 'Road', icon: 'directions_car', defaultView: 'road', views: ['road', 'health', 'pet-friendly'] },
        { id: 'agent', label: 'Agent', icon: 'smart_toy', type: 'overlay' }
      ],
      VIEW_CLUSTERS: {
        'matching': 'match', 'opportunities': 'match', 'jobs': 'match',
        'dashboard': 'career', 'career': 'career', 'documents': 'career',
        'gamification': 'play', 'badges': 'play', 'challenges': 'play',
        'road': 'road', 'health': 'road', 'pet-friendly': 'road'
      }
    };
  `, ctx, { filename: 'inline-config.js' });

  // 4. Load core
  var coreSrc = fs.readFileSync(CORE_PATH, 'utf8');
  vm.runInContext(coreSrc, ctx, { filename: 'driver-os-core.js' });

  return { DOS: ctx.DOS, ctx: ctx };
}

describe('DriverOS Shell', () => {
  let mockDom, DOS, ctx;

  beforeAll(() => {
    mockDom = createMockDOM();
    var loaded = loadModules(mockDom);
    DOS = loaded.DOS;
    ctx = loaded.ctx;
  });

  // ═══ Config ═══

  describe('DOS.config', () => {
    test('exists with VIEW_REGISTRY having 19 entries', () => {
      expect(DOS.config).toBeDefined();
      expect(DOS.config.VIEW_REGISTRY).toBeDefined();
      var keys = Object.keys(DOS.config.VIEW_REGISTRY);
      expect(keys.length).toBe(19);
    });

    test('NAV_ZONES has 5 entries', () => {
      expect(DOS.config.NAV_ZONES).toBeDefined();
      expect(DOS.config.NAV_ZONES.length).toBe(5);
    });
  });

  // ═══ Bridge ═══

  describe('DOS.bridge', () => {
    test('exists with init, send, on, off methods', () => {
      expect(DOS.bridge).toBeDefined();
      expect(typeof DOS.bridge.init).toBe('function');
      expect(typeof DOS.bridge.send).toBe('function');
      expect(typeof DOS.bridge.on).toBe('function');
      expect(typeof DOS.bridge.off).toBe('function');
    });

    test('send() posts message to parent with { action, payload }', () => {
      mockDom.sandbox._sentMessages = [];
      DOS.bridge.send('findMatches', { cdlClass: 'A' });
      expect(mockDom.sandbox._sentMessages.length).toBeGreaterThanOrEqual(1);
      var lastMsg = mockDom.sandbox._sentMessages[mockDom.sandbox._sentMessages.length - 1];
      expect(lastMsg.action).toBe('findMatches');
      expect(lastMsg.payload.cdlClass).toBe('A');
    });

    test('on() registers listener that receives payload', () => {
      // Ensure bridge.init() has been called to register the message handler
      DOS.bridge.init();

      var received = null;
      DOS.bridge.on('testAction', function (payload) { received = payload; });

      // Simulate inbound message via the handler registered on ctx
      var handlers = mockDom.sandbox._handlers['message'];
      expect(handlers).toBeDefined();
      expect(handlers.length).toBeGreaterThan(0);

      // Fire an inbound message event
      handlers.forEach(function (handler) {
        handler({ data: { action: 'testAction', payload: { val: 42 } } });
      });

      // The action is not in CONTRACT.outbound so it warns but still routes
      expect(received).toBeDefined();
      expect(received.val).toBe(42);

      // Cleanup
      DOS.bridge.off('testAction');
    });

    test('off() removes listener', () => {
      var count = 0;
      var cb = function () { count++; };
      DOS.bridge.on('offTest', cb);
      DOS.bridge.off('offTest', cb);

      // Fire message via registered handlers
      var handlers = mockDom.sandbox._handlers['message'];
      handlers.forEach(function (h) {
        h({ data: { action: 'offTest', payload: {} } });
      });

      expect(count).toBe(0);
    });

    test('isReady() returns boolean', () => {
      expect(typeof DOS.bridge.isReady()).toBe('boolean');
    });
  });

  // ═══ Views ═══

  describe('DOS.views', () => {
    test('exists with mount, unmount, getViewSnapshot methods', () => {
      expect(DOS.views).toBeDefined();
      expect(typeof DOS.views.mount).toBe('function');
      expect(typeof DOS.views.unmount).toBe('function');
      expect(typeof DOS.views.getViewSnapshot).toBe('function');
    });

    test('mount() sets current view when module registered', async () => {
      // Register a fake view module
      DOS.viewModules = DOS.viewModules || {};
      DOS.viewModules['matching'] = {
        mount: function (root) { /* no-op */ },
        unmount: function () {},
        getSnapshot: function () { return { test: true }; }
      };

      // Ensure _root is set
      DOS.views._root = mockDom.elements['app-root'];
      DOS.views.current = null;
      DOS.views._currentModule = null;

      DOS.views.mount('matching');

      // mount uses Promise.resolve().then() even when cdn is null, so flush microtasks
      await new Promise(function (r) { setTimeout(r, 0); });

      expect(DOS.views.current).toBe('matching');
      expect(DOS.views._currentModule).toBe(DOS.viewModules['matching']);
    });

    test('unmount() clears current module', () => {
      DOS.views.unmount();
      expect(DOS.views._currentModule).toBeNull();
    });

    test('getViewSnapshot() returns object', () => {
      var snap = DOS.views.getViewSnapshot();
      expect(typeof snap).toBe('object');
    });
  });

  // ═══ Nav ═══

  describe('DOS.nav', () => {
    test('exists with render, setActive methods', () => {
      expect(DOS.nav).toBeDefined();
      expect(typeof DOS.nav.render).toBe('function');
      expect(typeof DOS.nav.setActive).toBe('function');
    });

    test('render() creates 5 buttons in bottom-nav element', () => {
      // Reset nav state
      DOS.nav._buttons = {};
      var navEl = mockDom.elements['bottom-nav'];
      navEl.children = [];

      DOS.nav.render();

      expect(navEl.children.length).toBe(5);
      expect(Object.keys(DOS.nav._buttons).length).toBe(5);
    });

    test('setActive("career") sets active class correctly', () => {
      DOS.nav.setActive('career');

      var careerBtn = DOS.nav._buttons['career'];
      var matchBtn = DOS.nav._buttons['match'];

      expect(careerBtn.classList.contains('active')).toBe(true);
      expect(careerBtn._attrs['aria-current']).toBe('page');
      expect(matchBtn.classList.contains('active')).toBe(false);
      expect(matchBtn._attrs['aria-current']).toBeUndefined();
    });

    test('nav buttons have correct zone data attributes', () => {
      var zoneIds = ['match', 'career', 'play', 'road', 'agent'];
      zoneIds.forEach(function (id) {
        var btn = DOS.nav._buttons[id];
        expect(btn).toBeDefined();
        expect(btn._attrs['data-zone']).toBe(id);
      });
    });
  });

  // ═══ Init & Refresh ═══

  describe('DOS.init', () => {
    test('is a function', () => {
      expect(typeof DOS.init).toBe('function');
    });
  });

  describe('DOS.refresh', () => {
    test('is a function', () => {
      expect(typeof DOS.refresh).toBe('function');
    });
  });

  // ═══ Gestures ═══

  describe('DOS.gestures', () => {
    test('exists with init method', () => {
      expect(DOS.gestures).toBeDefined();
      expect(typeof DOS.gestures.init).toBe('function');
    });
  });
});
