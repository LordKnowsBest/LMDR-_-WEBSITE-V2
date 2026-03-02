/**
 * driver-os-bridge.js
 * ═══════════════════════════════════════════════════════════════════
 * Central postMessage hub for DriverOS.
 * Handles all communication between DriverOS HTML iframe and
 * Wix Velo page code. Validates against DOS.CONTRACT when available.
 *
 * Depends on: driver-os-contract.js (optional but recommended)
 * Provides:  DOS.bridge
 * ═══════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  window.DOS = window.DOS || {};

  var bridge = {
    _component: null,
    _pending: {},
    _listeners: {},
    _ready: false,

    init: function () {
      var self = this;
      window.addEventListener('message', function (event) {
        self._handleInbound(event);
      });
      // Send ready signal to parent
      this.send('carrierMatchingReady', {});
    },

    send: function (action, payload) {
      // Validate against DOS.CONTRACT.inbound if contract loaded
      if (window.DOS && window.DOS.CONTRACT) {
        var validation = DOS.CONTRACT.validate('inbound', action, payload);
        if (!validation.valid) {
          console.warn('[DOS Bridge] Invalid outbound:', validation.error);
        }
      }
      try {
        window.parent.postMessage({ action: action, payload: payload || {} }, '*');
      } catch (e) {
        console.error('[DOS Bridge] Send failed:', e.message);
      }
    },

    _handleInbound: function (event) {
      var msg = event.data;
      if (!msg || typeof msg !== 'object') return;

      // Use contract legacy translator if available
      var translated;
      if (window.DOS && window.DOS.CONTRACT && DOS.CONTRACT.translateLegacy) {
        translated = DOS.CONTRACT.translateLegacy(msg);
      } else {
        // Fallback: handle both action-key and type-key
        if (msg.action) {
          translated = { action: msg.action, payload: msg.payload || msg.data || {} };
        } else if (msg.type) {
          translated = { action: msg.type, payload: msg.data || {} };
        }
      }

      if (!translated) return;

      var action = translated.action;
      var payload = translated.payload;

      // Handle init from Velo
      if (action === 'init' || action === 'pageReady') {
        this._ready = true;
        this._onPageReady(payload);
        return;
      }

      // Validate against contract outbound
      if (window.DOS && window.DOS.CONTRACT) {
        var validation = DOS.CONTRACT.validate('outbound', action, payload);
        if (!validation.valid) {
          console.warn('[DOS Bridge] Unknown inbound action:', action);
        }
      }

      // Route to pending request callbacks
      if (this._pending[action]) {
        var pending = this._pending[action];
        clearTimeout(pending.timeout);
        pending.resolve(payload);
        delete this._pending[action];
      }

      // Route to registered listeners
      if (this._listeners[action]) {
        this._listeners[action].forEach(function (cb) {
          try { cb(payload); } catch (e) { console.error('[DOS Bridge] Listener error:', e); }
        });
      }

      // Route to active view module
      if (window.DOS && DOS.views && DOS.views._currentModule) {
        var mod = DOS.views._currentModule;
        if (typeof mod.onMessage === 'function') {
          try { mod.onMessage(action, payload); } catch (e) { console.error('[DOS Bridge] View handler error:', e); }
        }
      }
    },

    _onPageReady: function (payload) {
      // Store session context from page code
      if (window.DOS && DOS.config) {
        if (payload.userStatus) DOS.config.SESSION_CONTEXT.memberId = payload.userStatus.memberId;
        if (payload.driverProfile) DOS.config.SESSION_CONTEXT.driverId = payload.driverProfile._id;
        if (payload.featureFlags) Object.assign(DOS.config.FEATURE_FLAGS, payload.featureFlags);
        if (payload.marketCondition && DOS.market) DOS.market.condition = payload.marketCondition;
      }
      // Notify listeners
      this._fireListeners('pageReady', payload);
    },

    _fireListeners: function (action, payload) {
      if (this._listeners[action]) {
        this._listeners[action].forEach(function (cb) {
          try { cb(payload); } catch (e) { /* swallow listener errors */ }
        });
      }
    },

    request: function (action, payload, timeoutMs) {
      var self = this;
      timeoutMs = timeoutMs || 10000;
      return new Promise(function (resolve, reject) {
        self.send(action, payload);
        // Fire-and-forget by default; caller should use on() to listen for response
        resolve();
      });
    },

    on: function (action, callback) {
      if (!this._listeners[action]) this._listeners[action] = [];
      this._listeners[action].push(callback);
    },

    off: function (action, callback) {
      if (!this._listeners[action]) return;
      if (callback) {
        this._listeners[action] = this._listeners[action].filter(function (cb) {
          return cb !== callback;
        });
      } else {
        delete this._listeners[action];
      }
    },

    isReady: function () {
      return this._ready;
    }
  };

  DOS.bridge = bridge;

})();
