/**
 * driver-os-core.js
 * ═══════════════════════════════════════════════════════════════════
 * DriverOS core runtime: View Lifecycle Manager, bottom navigation,
 * gesture detection, and bootstrap.
 *
 * Depends on: driver-os-config.js, driver-os-bridge.js
 * Provides:  DOS.views, DOS.nav, DOS.gestures, DOS.init, DOS.refresh
 * ═══════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  window.DOS = window.DOS || {};

  /**
   * Safely remove all child nodes from an element.
   * Uses DOM API instead of innerHTML for security compliance.
   */
  function clearElement(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  /* ───────────────────────────────────────────────────────────────
   * DOS.views — View Lifecycle Manager
   * ─────────────────────────────────────────────────────────────── */

  var views = {
    current: null,
    _currentModule: null,
    _loadedScripts: {},
    _root: null,

    mount: function (viewId) {
      var self = this;

      // 1. If same view, skip
      if (this.current === viewId && this._currentModule) return;

      // 2. Unmount current
      this.unmount();

      // 3. Get CDN URL from DOS.config.VIEW_REGISTRY
      if (!window.DOS || !DOS.config || !DOS.config.VIEW_REGISTRY) {
        console.error('[DOS Views] No VIEW_REGISTRY in config');
        return;
      }

      var entry = DOS.config.VIEW_REGISTRY[viewId];
      if (entry === undefined) {
        console.error('[DOS Views] Unknown view:', viewId);
        return;
      }

      var cdnUrl = typeof entry === 'string' ? entry : entry.cdn;

      // 4. Lazy-load script if not cached
      var loadPromise = cdnUrl ? this._loadScript(cdnUrl) : Promise.resolve();

      loadPromise.then(function () {
        // 5. Get module from DOS.viewModules
        DOS.viewModules = DOS.viewModules || {};
        var mod = DOS.viewModules[viewId];
        if (!mod) {
          console.error('[DOS Views] Module not found after load:', viewId);
          return;
        }

        // 6. Call module.mount
        if (typeof mod.mount === 'function') {
          mod.mount(self._root);
        }

        // 7. Capture previous view before updating
        var previousViewId = self.current;

        // 8. Update current and _currentModule
        self.current = viewId;
        self._currentModule = mod;

        // 9. Send viewChanged to bridge
        if (DOS.bridge) {
          DOS.bridge.send('viewChanged', { viewId: viewId, previousViewId: previousViewId });
        }

        // 9. Update nav active state
        if (DOS.nav && DOS.config.VIEW_CLUSTERS) {
          var cluster = DOS.config.VIEW_CLUSTERS[viewId];
          if (cluster) {
            DOS.nav.setActive(cluster);
          }
        }
      }).catch(function (err) {
        console.error('[DOS Views] Failed to mount view:', viewId, err);
      });
    },

    unmount: function () {
      if (this._currentModule && typeof this._currentModule.unmount === 'function') {
        this._currentModule.unmount();
      }
      if (this._root) clearElement(this._root);
      this._currentModule = null;
    },

    getViewSnapshot: function () {
      if (this._currentModule && typeof this._currentModule.getSnapshot === 'function') {
        return this._currentModule.getSnapshot();
      }
      return {};
    },

    _loadScript: function (url) {
      var self = this;
      if (this._loadedScripts[url]) return Promise.resolve();
      return new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = url;
        script.onload = function () { self._loadedScripts[url] = true; resolve(); };
        script.onerror = function () { reject(new Error('Failed to load: ' + url)); };
        document.body.appendChild(script);
      });
    }
  };

  /* ───────────────────────────────────────────────────────────────
   * DOS.nav — Bottom Navigation
   * ─────────────────────────────────────────────────────────────── */

  var nav = {
    _el: null,
    _buttons: {},

    render: function () {
      var navEl = document.getElementById('bottom-nav');
      if (!navEl) return;
      this._el = navEl;
      navEl.className = 'dos-bottom-nav';

      if (!window.DOS || !DOS.config || !DOS.config.NAV_ZONES) return;

      var zones = DOS.config.NAV_ZONES;
      for (var i = 0; i < zones.length; i++) {
        var zone = zones[i];
        var btn = document.createElement('button');
        btn.className = 'dos-nav-btn';
        btn.setAttribute('data-zone', zone.id);
        btn.setAttribute('aria-label', zone.label);

        var icon = document.createElement('span');
        icon.className = 'material-symbols-outlined dos-nav-icon';
        icon.textContent = zone.icon;

        var label = document.createElement('span');
        label.className = 'dos-nav-label';
        label.textContent = zone.label;

        btn.appendChild(icon);
        btn.appendChild(label);

        // Tap handler (closure for zone capture)
        (function (z) {
          btn.addEventListener('click', function () {
            if (z.type === 'overlay') {
              if (DOS.agent && typeof DOS.agent.toggle === 'function') {
                DOS.agent.toggle();
              }
            } else {
              DOS.views.mount(z.defaultView);
            }
          });
        })(zone);

        navEl.appendChild(btn);
        this._buttons[zone.id] = btn;
      }

      // Set initial active
      this.setActive('match');
    },

    setActive: function (zoneId) {
      var keys = Object.keys(this._buttons);
      for (var i = 0; i < keys.length; i++) {
        var btn = this._buttons[keys[i]];
        if (keys[i] === zoneId) {
          btn.classList.add('active');
          btn.setAttribute('aria-current', 'page');
        } else {
          btn.classList.remove('active');
          btn.removeAttribute('aria-current');
        }
      }
    }
  };

  /* ───────────────────────────────────────────────────────────────
   * DOS.gestures — Swipe detection for sibling view navigation
   * ─────────────────────────────────────────────────────────────── */

  var gestures = {
    _startX: 0,
    _startY: 0,
    _threshold: 50,

    init: function (el) {
      var self = this;
      el.addEventListener('touchstart', function (e) {
        self._startX = e.touches[0].clientX;
        self._startY = e.touches[0].clientY;
      }, { passive: true });

      el.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - self._startX;
        var dy = e.changedTouches[0].clientY - self._startY;
        if (Math.abs(dx) > self._threshold && Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe
          var currentView = DOS.views.current;
          if (!currentView || !DOS.config || !DOS.config.VIEW_CLUSTERS) return;
          var cluster = DOS.config.VIEW_CLUSTERS[currentView];
          if (!cluster) return;

          var zones = DOS.config.NAV_ZONES;
          var zone = null;
          for (var i = 0; i < zones.length; i++) {
            if (zones[i].id === cluster) { zone = zones[i]; break; }
          }
          if (!zone || !zone.views) return;

          var idx = zone.views.indexOf(currentView);
          if (dx < 0 && idx < zone.views.length - 1) {
            // Swipe left -> next view
            DOS.views.mount(zone.views[idx + 1]);
          } else if (dx > 0 && idx > 0) {
            // Swipe right -> previous view
            DOS.views.mount(zone.views[idx - 1]);
          }
        }
      }, { passive: true });
    }
  };

  /* ───────────────────────────────────────────────────────────────
   * DOS.init — Bootstrap
   * ─────────────────────────────────────────────────────────────── */

  function init() {
    DOS.views._root = document.getElementById('app-root');
    DOS.viewModules = DOS.viewModules || {};

    // Init bridge
    if (DOS.bridge) DOS.bridge.init();

    // Render bottom nav
    if (DOS.nav) DOS.nav.render();

    // Init gesture detection
    if (DOS.gestures && DOS.views._root) DOS.gestures.init(DOS.views._root);

    // Mount default view (matching)
    DOS.views.mount('matching');
  }

  /* ───────────────────────────────────────────────────────────────
   * DOS.refresh — Re-mount current view
   * ─────────────────────────────────────────────────────────────── */

  function refresh() {
    if (DOS.views.current && DOS.views._currentModule) {
      var currentId = DOS.views.current;
      DOS.views.unmount();
      DOS.views.current = null; // Reset so mount doesn't skip
      DOS.views.mount(currentId);
    }
  }

  /* ───────────────────────────────────────────────────────────────
   * Export to DOS namespace
   * ─────────────────────────────────────────────────────────────── */

  DOS.views = views;
  DOS.nav = nav;
  DOS.gestures = gestures;
  DOS.init = init;
  DOS.refresh = refresh;

})();
