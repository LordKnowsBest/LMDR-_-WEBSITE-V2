/**
 * FeatureTracker.js
 * Client-side library for Feature Adoption Logging
 * 
 * Usage:
 * FeatureTracker.init({ userId: '...', userRole: '...' });
 * FeatureTracker.view('feature_id');
 */

const FeatureTracker = (function () {
  let _config = {
    userId: null,
    userRole: 'unknown',
    sessionId: null,
    deviceType: 'desktop', // Default, detected in init
    debug: false,
    endpoint: '/_functions/logFeatureInteraction' // Fallback if direct import not used, but we likely use postMessage bridge
  };

  let _timers = {};
  let _initialized = false;

  // Generate a simple session ID if none provided
  function _generateSessionId() {
    return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // Detect basic device type
  function _detectDevice() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  // Internal logger
  function _log(msg, data) {
    if (_config.debug) {
      console.log(`[FeatureTracker] ${msg}`, data || '');
    }
  }

  // Send data to backend - via PostMessage usually for HTML components
  function _send(action, featureId, data = {}) {
    if (!_initialized) {
      console.warn('[FeatureTracker] Not initialized. Call init() first.');
    }

    const payload = {
      featureId: featureId,
      userId: _config.userId,
      action: action,
      context: {
        userRole: _config.userRole,
        sessionId: _config.sessionId,
        deviceType: _config.deviceType,
        referrer: document.referrer || null, // Capture referrer
        ...data
      }
    };

    // If we have a bridge established (e.g. standard Wix HTML component bridge)
    if (window.parent && window.parent !== window) {
      // We are in an iframe (HTML Component)
      // Standard Project Pattern: { action: 'logFeatureInteraction', payload: ... }
      window.parent.postMessage({
        action: 'logFeatureInteraction',
        payload: payload
      }, '*');
    } else {
      // We are likely in standard web environment or direct test
      _log('Sending event (mock)', payload);
    }
  }

  return {
    /**
     * Initialize the tracker
     * @param {Object} options 
     */
    init: function (options = {}) {
      _config = { ..._config, ...options };
      if (_config.sessionId === 'auto' || !_config.sessionId) {
        _config.sessionId = sessionStorage.getItem('fal_session_id') || _generateSessionId();
        sessionStorage.setItem('fal_session_id', _config.sessionId);
      }
      if (_config.deviceType === 'auto' || !_config.deviceType || _config.deviceType === 'desktop') {
        _config.deviceType = _detectDevice();
      }
      _initialized = true;
      _log('Initialized', _config);
    },

    getSessionId: function () {
      return _config.sessionId;
    },

    view: function (featureId, metadata = {}) {
      _send('view', featureId, { metadata });
    },

    click: function (featureId, metadata = {}) {
      _send('click', featureId, { metadata, interactionCount: 1 });
    },

    complete: function (featureId, metadata = {}) {
      _send('complete', featureId, {
        metadata,
        outcome: metadata.outcome || 'success',
        conversionValue: metadata.conversionValue || null
      });
    },

    error: function (featureId, errorCode, errorMessage, metadata = {}) {
      _send('error', featureId, {
        errorCode,
        errorMessage,
        metadata,
        outcome: 'failure'
      });
    },

    abandon: function (featureId, metadata = {}) {
      _send('abandon', featureId, {
        metadata,
        outcome: 'abandoned',
        durationMs: this.stopTimer(featureId) // Stop timer if running
      });
    },

    // Timer methods
    startTimer: function (featureId) {
      _timers[featureId] = Date.now();
      _log(`Timer started for ${featureId}`);
      return true;
    },

    stopTimer: function (featureId) {
      if (!_timers[featureId]) return null;
      const duration = Date.now() - _timers[featureId];
      delete _timers[featureId];
      return duration;
    },

    // Auto-instrumentation wrapper
    instrument: function (featureId, fn, options = {}) {
      return async function (...args) {
        if (options.trackView) FeatureTracker.view(featureId);
        FeatureTracker.startTimer(featureId);
        try {
          const result = await fn(...args);
          if (options.trackComplete) {
            FeatureTracker.complete(featureId, { durationMs: FeatureTracker.stopTimer(featureId) });
          }
          return result;
        } catch (error) {
          if (options.trackErrors) {
            FeatureTracker.error(featureId, 'FUNC_ERR', error.message);
          }
          throw error;
        }
      };
    }
  };
})();

// Export for module systems if needed, else attached to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeatureTracker;
} else {
  window.FeatureTracker = FeatureTracker;
}
