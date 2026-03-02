/**
 * driverOsViews.test.js
 * =====================================================================
 * Smoke tests for all 19 DriverOS view modules.
 * Each view is loaded in an isolated Node vm context with a minimal DOM
 * mock (no jsdom). Validates registration, API surface, mount/unmount,
 * and getSnapshot behavior.
 * =====================================================================
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const VIEWS_DIR = path.resolve(__dirname, '../driver/os/js/views');

/**
 * Ordered list of all 19 viewIds and their corresponding file names.
 */
const VIEW_MANIFEST = [
  { viewId: 'matching',       file: 'dos-view-matching.js' },
  { viewId: 'opportunities',  file: 'dos-view-opportunities.js' },
  { viewId: 'jobs',           file: 'dos-view-jobs.js' },
  { viewId: 'dashboard',      file: 'dos-view-dashboard.js' },
  { viewId: 'career',         file: 'dos-view-career.js' },
  { viewId: 'documents',      file: 'dos-view-documents.js' },
  { viewId: 'gamification',   file: 'dos-view-gamification.js' },
  { viewId: 'badges',         file: 'dos-view-badges.js' },
  { viewId: 'challenges',     file: 'dos-view-challenges.js' },
  { viewId: 'forums',         file: 'dos-view-forums.js' },
  { viewId: 'announcements',  file: 'dos-view-announcements.js' },
  { viewId: 'surveys',        file: 'dos-view-surveys.js' },
  { viewId: 'road',           file: 'dos-view-road.js' },
  { viewId: 'health',         file: 'dos-view-health.js' },
  { viewId: 'pet-friendly',   file: 'dos-view-pet-friendly.js' },
  { viewId: 'policies',       file: 'dos-view-policies.js' },
  { viewId: 'mentors',        file: 'dos-view-mentors.js' },
  { viewId: 'mentor-profile', file: 'dos-view-mentor-profile.js' },
  { viewId: 'retention',      file: 'dos-view-retention.js' }
];

// ─── Minimal DOM Mock ──────────────────────────────────────────────

/**
 * Creates a mock DOM element that supports the operations used by
 * DriverOS view modules (createElement, classList, style, children, etc.).
 */
function createMockElement(tag) {
  var _listeners = [];
  var _attrs = {};
  var _children = [];
  var _classList = new Set();

  var el = {
    tagName: (tag || 'DIV').toUpperCase(),
    className: '',
    textContent: '',
    innerHTML: '',
    id: '',
    value: '',
    type: '',
    disabled: false,
    checked: false,
    htmlFor: '',
    href: '',
    src: '',
    placeholder: '',
    selectedIndex: 0,
    children: _children,
    childNodes: _children,
    firstChild: null,
    parentNode: null,
    style: {},
    dataset: {},
    _listeners: _listeners,
    _attrs: _attrs,

    classList: {
      add: function () {
        for (var i = 0; i < arguments.length; i++) _classList.add(arguments[i]);
        el.className = Array.from(_classList).join(' ');
      },
      remove: function () {
        for (var i = 0; i < arguments.length; i++) _classList.delete(arguments[i]);
        el.className = Array.from(_classList).join(' ');
      },
      contains: function (c) { return _classList.has(c); },
      toggle: function (c) {
        if (_classList.has(c)) { _classList.delete(c); } else { _classList.add(c); }
        el.className = Array.from(_classList).join(' ');
      }
    },

    appendChild: function (child) {
      if (child) {
        _children.push(child);
        child.parentNode = el;
        el.firstChild = _children[0] || null;
      }
      return child;
    },

    removeChild: function (child) {
      var idx = _children.indexOf(child);
      if (idx !== -1) {
        _children.splice(idx, 1);
        child.parentNode = null;
      }
      el.firstChild = _children[0] || null;
      return child;
    },

    insertBefore: function (newChild, refChild) {
      var idx = _children.indexOf(refChild);
      if (idx === -1) { _children.push(newChild); } else { _children.splice(idx, 0, newChild); }
      newChild.parentNode = el;
      el.firstChild = _children[0] || null;
      return newChild;
    },

    replaceChild: function (newChild, oldChild) {
      var idx = _children.indexOf(oldChild);
      if (idx !== -1) { _children[idx] = newChild; newChild.parentNode = el; oldChild.parentNode = null; }
      el.firstChild = _children[0] || null;
      return oldChild;
    },

    cloneNode: function () { return createMockElement(tag); },

    addEventListener: function (type, fn) {
      _listeners.push({ type: type, fn: fn, el: el });
    },

    removeEventListener: function (type, fn) {
      for (var i = _listeners.length - 1; i >= 0; i--) {
        if (_listeners[i].type === type && _listeners[i].fn === fn) {
          _listeners.splice(i, 1);
        }
      }
    },

    setAttribute: function (key, val) { _attrs[key] = val; },
    getAttribute: function (key) { return _attrs[key] !== undefined ? _attrs[key] : null; },
    removeAttribute: function (key) { delete _attrs[key]; },
    hasAttribute: function (key) { return key in _attrs; },

    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    getElementsByClassName: function () { return []; },
    getElementsByTagName: function () { return []; },

    focus: function () {},
    blur: function () {},
    click: function () {},
    scrollIntoView: function () {},

    getBoundingClientRect: function () {
      return { top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100 };
    },

    // For select elements
    options: [],
    add: function (opt) { el.options.push(opt); _children.push(opt); },

    dispatchEvent: function (evt) {
      _listeners.forEach(function (l) {
        if (l.type === (evt.type || evt)) l.fn(evt);
      });
    }
  };

  return el;
}

/**
 * Builds a complete sandbox for running a DriverOS view module.
 */
function buildSandbox() {
  var elementsById = {};
  var timers = [];
  var postMessages = [];
  var windowListeners = [];

  // Pre-seed well-known elements
  elementsById['app-root'] = createMockElement('div');
  elementsById['app-root'].id = 'app-root';
  elementsById['bottom-nav'] = createMockElement('div');
  elementsById['bottom-nav'].id = 'bottom-nav';
  elementsById['agent-overlay'] = createMockElement('div');
  elementsById['agent-overlay'].id = 'agent-overlay';

  var headEl = createMockElement('head');
  var bodyEl = createMockElement('body');

  var mockDocument = {
    createElement: function (tag) { return createMockElement(tag); },
    createTextNode: function (text) {
      var node = createMockElement('#text');
      node.textContent = text;
      node.nodeType = 3;
      return node;
    },
    createDocumentFragment: function () { return createMockElement('fragment'); },
    getElementById: function (id) {
      return elementsById[id] || null;
    },
    querySelector: function (sel) {
      // Handle #id selectors
      if (sel && sel.charAt(0) === '#') {
        return elementsById[sel.slice(1)] || null;
      }
      return null;
    },
    querySelectorAll: function () { return []; },
    head: headEl,
    body: bodyEl,
    documentElement: createMockElement('html'),
    addEventListener: function () {},
    removeEventListener: function () {}
  };

  var mockWindow = {
    DOS: {
      viewModules: {},
      bridge: {
        send: function () {},
        on: function () {},
        off: function () {},
        emit: function () {}
      },
      config: {
        VIEW_CLUSTERS: {
          discover: ['matching', 'opportunities', 'jobs'],
          manage: ['dashboard', 'career', 'documents'],
          grow: ['gamification', 'badges', 'challenges'],
          connect: ['forums', 'announcements', 'surveys'],
          tools: ['road', 'health', 'pet-friendly'],
          support: ['policies', 'mentors', 'mentor-profile', 'retention']
        },
        NAV_ZONES: [
          { id: 'discover', icon: 'search', label: 'Discover' },
          { id: 'manage', icon: 'dashboard', label: 'Manage' },
          { id: 'grow', icon: 'emoji_events', label: 'Grow' },
          { id: 'connect', icon: 'forum', label: 'Connect' },
          { id: 'tools', icon: 'build', label: 'Tools' }
        ],
        SESSION_CONTEXT: {
          driverId: 'test-driver-001',
          name: 'Test Driver',
          cdlClass: 'A',
          yearsExp: 5
        }
      },
      views: {
        mount: function () {},
        current: null
      },
      state: {},
      utils: {
        timeAgo: function () { return '1m ago'; },
        formatDate: function (d) { return String(d); },
        debounce: function (fn) { return fn; }
      }
    },
    document: mockDocument,
    addEventListener: function (type, fn) {
      windowListeners.push({ type: type, fn: fn });
    },
    removeEventListener: function () {},
    parent: {
      postMessage: function (msg, origin) {
        postMessages.push({ msg: msg, origin: origin });
      }
    },
    location: { href: '', origin: 'https://test.local' },
    navigator: { userAgent: 'test' },
    innerWidth: 375,
    innerHeight: 812,
    scrollTo: function () {},
    requestAnimationFrame: function (fn) { fn(); return 1; },
    cancelAnimationFrame: function () {},
    getComputedStyle: function () { return { getPropertyValue: function () { return ''; } }; },
    matchMedia: function () { return { matches: false, addEventListener: function () {} }; },
    _postMessages: postMessages,
    _windowListeners: windowListeners
  };

  var sandbox = {
    window: mockWindow,
    document: mockDocument,
    DOS: mockWindow.DOS,
    console: {
      log: function () {},
      warn: function () {},
      error: function () {},
      info: function () {},
      debug: function () {}
    },
    setTimeout: function (fn, delay) {
      var id = timers.length + 1;
      timers.push({ id: id, fn: fn, delay: delay });
      return id;
    },
    clearTimeout: function () {},
    setInterval: function (fn, delay) {
      var id = timers.length + 1;
      timers.push({ id: id, fn: fn, delay: delay });
      return id;
    },
    clearInterval: function () {},
    Promise: Promise,
    Object: Object,
    Array: Array,
    String: String,
    Number: Number,
    Boolean: Boolean,
    Date: Date,
    Math: Math,
    JSON: JSON,
    Error: Error,
    TypeError: TypeError,
    RegExp: RegExp,
    Map: Map,
    Set: Set,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    encodeURIComponent: encodeURIComponent,
    decodeURIComponent: decodeURIComponent,
    btoa: function (s) { return Buffer.from(s).toString('base64'); },
    atob: function (s) { return Buffer.from(s, 'base64').toString(); },
    fetch: function () { return Promise.resolve({ ok: true, json: function () { return Promise.resolve({}); } }); },
    XMLHttpRequest: function () {
      return {
        open: function () {},
        send: function () {},
        setRequestHeader: function () {},
        addEventListener: function () {}
      };
    },
    Image: function () { return createMockElement('img'); },
    URL: URL,
    URLSearchParams: URLSearchParams,
    FormData: function () {
      return {
        append: function () {},
        get: function () { return null; }
      };
    },
    FileReader: function () {
      return {
        readAsDataURL: function () {},
        readAsText: function () {},
        addEventListener: function () {}
      };
    },
    _timers: timers,
    _elementsById: elementsById
  };

  vm.createContext(sandbox);
  return sandbox;
}

/**
 * Loads a view module into a sandbox and returns { sandbox, viewId }.
 */
function loadView(viewEntry) {
  var sandbox = buildSandbox();
  var filePath = path.join(VIEWS_DIR, viewEntry.file);
  var source = fs.readFileSync(filePath, 'utf8');

  vm.runInContext(source, sandbox, { filename: viewEntry.file, timeout: 5000 });

  return sandbox;
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('DriverOS View Modules', () => {

  // Verify all 19 files exist
  test('all 19 view module files exist on disk', () => {
    VIEW_MANIFEST.forEach(function (entry) {
      var filePath = path.join(VIEWS_DIR, entry.file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  // Per-view smoke tests
  describe.each(VIEW_MANIFEST)('$viewId ($file)', (entry) => {
    var sandbox;

    beforeAll(() => {
      sandbox = loadView(entry);
    });

    test('registers itself on DOS.viewModules["' + entry.viewId + '"]', () => {
      var mod = sandbox.window.DOS.viewModules[entry.viewId];
      expect(mod).toBeDefined();
    });

    test('has mount (function)', () => {
      var mod = sandbox.window.DOS.viewModules[entry.viewId];
      expect(typeof mod.mount).toBe('function');
    });

    test('has unmount (function)', () => {
      var mod = sandbox.window.DOS.viewModules[entry.viewId];
      expect(typeof mod.unmount).toBe('function');
    });

    test('has onMessage (function)', () => {
      var mod = sandbox.window.DOS.viewModules[entry.viewId];
      expect(typeof mod.onMessage).toBe('function');
    });

    test('has getSnapshot (function)', () => {
      var mod = sandbox.window.DOS.viewModules[entry.viewId];
      expect(typeof mod.getSnapshot).toBe('function');
    });

    test('mount(mockRoot) creates at least one child element', () => {
      var mod = sandbox.window.DOS.viewModules[entry.viewId];
      var root = createMockElement('div');
      root.id = 'test-root';

      // Add to sandbox's known elements
      sandbox._elementsById['test-root'] = root;

      mod.mount(root);

      expect(root.children.length).toBeGreaterThanOrEqual(1);
    });

    test('getSnapshot() returns an object', () => {
      var mod = sandbox.window.DOS.viewModules[entry.viewId];
      var snap = mod.getSnapshot();
      expect(snap).toBeDefined();
      expect(typeof snap).toBe('object');
      expect(snap).not.toBeNull();
    });

    test('unmount() executes without errors', () => {
      var mod = sandbox.window.DOS.viewModules[entry.viewId];
      expect(() => mod.unmount()).not.toThrow();
    });
  });

  // Summary check: all 19 registered
  test('all 19 viewIds are registered when loaded together', () => {
    var sandbox = buildSandbox();

    VIEW_MANIFEST.forEach(function (entry) {
      var filePath = path.join(VIEWS_DIR, entry.file);
      var source = fs.readFileSync(filePath, 'utf8');
      vm.runInContext(source, sandbox, { filename: entry.file, timeout: 5000 });
    });

    var registeredIds = Object.keys(sandbox.window.DOS.viewModules).sort();
    var expectedIds = VIEW_MANIFEST.map(function (e) { return e.viewId; }).sort();

    expect(registeredIds).toEqual(expectedIds);
  });
});
