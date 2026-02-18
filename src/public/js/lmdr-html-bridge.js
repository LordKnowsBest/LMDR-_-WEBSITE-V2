/**
 * LMDR HTML Component Bridge
 * 
 * Provides a standardized way for HTML components to communicate with Wix Velo Page Code.
 * Supports Feature Flags, Feature Tracking, and common navigation.
 */

(function(global) {
  'use strict';

  var _handlers = {};
  var _initialized = false;

  /**
   * Initialize the bridge listener
   */
  function init() {
    if (_initialized) return;
    
    window.addEventListener('message', function(event) {
      var message = event.data;
      if (!message) return;

      // Handle action-based protocol
      if (message.action && _handlers[message.action]) {
        _handlers[message.action](message.payload);
      }
      
      // Handle type-based protocol (Recruiter Onboarding)
      if (message.type && _handlers[message.type]) {
        _handlers[message.type](message.data || message.payload);
      }
    });

    _initialized = true;
  }

  /**
   * Send a message to Wix Velo
   */
  function sendToWix(action, payload) {
    try {
      window.parent.postMessage({
        action: action,
        payload: payload
      }, '*');
    } catch (e) {
      console.error('[LMDRBridge] Failed to send message to Wix:', e.message);
    }
  }

  global.LMDRBridge = {
    init: init,
    
    /**
     * Register a handler for a message from Wix
     */
    on: function(action, handler) {
      _handlers[action] = handler;
      return this;
    },
    
    /**
     * Send a request to Wix
     */
    send: sendToWix,
    
    /**
     * Request feature flag evaluations
     */
    requestFlags: function(userId, context) {
      sendToWix('getFeatureFlags', { userId: userId, context: context });
    },

    evaluateFlag: function(flagKey, userId, context) {
      sendToWix('evaluateFeatureFlag', { flagKey: flagKey, userId: userId, context: context || {} });
    },

    getExperimentVariant: function(testKey, userId, context) {
      sendToWix('getExperimentVariant', { testKey: testKey, userId: userId, context: context || {} });
    },

    getExperimentConfig: function(testKey, userId, context) {
      sendToWix('getExperimentConfig', { testKey: testKey, userId: userId, context: context || {} });
    },

    trackExperimentConversion: function(testKey, userId, metric, value) {
      sendToWix('trackExperimentConversion', {
        testKey: testKey,
        userId: userId,
        metric: metric,
        value: value
      });
    },
    
    /**
     * Helper for navigation
     */
    navigateTo: function(destination) {
      sendToWix('navigateTo', { destination: destination });
    }
  };

  // Start listener immediately
  init();

  // Connect to LMDRFlags if it exists
  if (global.LMDRFlags) {
    global.LMDRBridge.on('featureFlagsLoaded', function(evaluations) {
      global.LMDRFlags.init(global.LMDRFlags.userId, global.LMDRFlags.context, evaluations);
    });
    
    // Override the internal fetcher to use the bridge
    global.lmdrFetchFlags = function(userId, context) {
      return new Promise(function(resolve) {
        // One-time listener for this specific request
        var originalHandler = _handlers['featureFlagsLoaded'];
        _handlers['featureFlagsLoaded'] = function(evaluations) {
          if (originalHandler) _handlers['featureFlagsLoaded'] = originalHandler;
          resolve(evaluations);
        };
        
        global.LMDRBridge.requestFlags(userId, context);
        
        // Timeout after 5s
        setTimeout(function() {
          if (_handlers['featureFlagsLoaded'] !== originalHandler) {
             _handlers['featureFlagsLoaded'] = originalHandler;
             resolve({});
          }
        }, 5000);
      });
    };
    
    // Hook up flag tracking to feature tracker if available, else send to Wix
    global.lmdrTrackFlag = function(flagKey, event, metadata) {
      if (global.FeatureTracker && global.FeatureTracker.isInitialized()) {
        global.FeatureTracker.click(flagKey, { event: event, ...metadata });
      } else {
        sendToWix('logFeatureInteraction', {
          featureId: flagKey,
          action: event,
          metadata: metadata
        });
      }
    };
  }

  global.lmdrEvaluateFlag = function(flagKey, userId, context) {
    return new Promise(function(resolve) {
      var originalHandler = _handlers['featureFlagEvaluated'];
      _handlers['featureFlagEvaluated'] = function(payload) {
        if (originalHandler) _handlers['featureFlagEvaluated'] = originalHandler;
        resolve(!!payload);
      };
      global.LMDRBridge.evaluateFlag(flagKey, userId, context || {});
      setTimeout(function() {
        if (_handlers['featureFlagEvaluated'] !== originalHandler) {
          _handlers['featureFlagEvaluated'] = originalHandler;
          resolve(false);
        }
      }, 5000);
    });
  };

  global.lmdrGetExperimentVariant = function(testKey, userId, context) {
    return new Promise(function(resolve) {
      var originalHandler = _handlers['experimentVariantLoaded'];
      _handlers['experimentVariantLoaded'] = function(payload) {
        if (originalHandler) _handlers['experimentVariantLoaded'] = originalHandler;
        resolve(payload || 'control');
      };
      global.LMDRBridge.getExperimentVariant(testKey, userId, context || {});
      setTimeout(function() {
        if (_handlers['experimentVariantLoaded'] !== originalHandler) {
          _handlers['experimentVariantLoaded'] = originalHandler;
          resolve('control');
        }
      }, 5000);
    });
  };

  global.lmdrGetExperimentConfig = function(testKey, userId, context) {
    return new Promise(function(resolve) {
      var originalHandler = _handlers['experimentConfigLoaded'];
      _handlers['experimentConfigLoaded'] = function(payload) {
        if (originalHandler) _handlers['experimentConfigLoaded'] = originalHandler;
        resolve(payload || { variantId: 'control' });
      };
      global.LMDRBridge.getExperimentConfig(testKey, userId, context || {});
      setTimeout(function() {
        if (_handlers['experimentConfigLoaded'] !== originalHandler) {
          _handlers['experimentConfigLoaded'] = originalHandler;
          resolve({ variantId: 'control' });
        }
      }, 5000);
    });
  };

  global.lmdrTrackExperimentConversion = function(testKey, userId, metric, value) {
    return new Promise(function(resolve) {
      var originalHandler = _handlers['experimentConversionTracked'];
      _handlers['experimentConversionTracked'] = function(payload) {
        if (originalHandler) _handlers['experimentConversionTracked'] = originalHandler;
        resolve(payload || { success: true });
      };
      global.LMDRBridge.trackExperimentConversion(testKey, userId, metric, value);
      setTimeout(function() {
        if (_handlers['experimentConversionTracked'] !== originalHandler) {
          _handlers['experimentConversionTracked'] = originalHandler;
          resolve({ success: false, timeout: true });
        }
      }, 5000);
    });
  };

})(window);
