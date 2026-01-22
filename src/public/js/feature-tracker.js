/**
 * Feature Tracker Library
 *
 * Client-side feature adoption tracking for the LMDR platform.
 * Provides easy instrumentation of features to track usage patterns,
 * engagement, and user journeys.
 *
 * Key features:
 * - Lightweight, no external dependencies
 * - PostMessage communication with Wix Velo backend
 * - Automatic session management (30-minute inactivity timeout)
 * - Device type auto-detection
 * - Timer tracking for time-spent metrics
 * - Auto-instrumentation wrapper for async functions
 * - Debug mode for development
 *
 * Usage:
 *   <script src="js/feature-tracker.js"></script>
 *   <script>
 *     FeatureTracker.init({
 *       userId: 'member_xyz',
 *       userRole: 'driver',
 *       sessionId: 'auto',
 *       deviceType: 'auto',
 *       debug: false
 *     });
 *
 *     FeatureTracker.view('carrier_search', { entryPoint: 'nav_menu' });
 *     FeatureTracker.click('carrier_search', { element: 'filter_button' });
 *     FeatureTracker.complete('carrier_search', { outcome: 'success' });
 *   </script>
 *
 * @version 1.0.0
 * @author LMDR Platform Team
 */

(function(global) {
  'use strict';

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  var VERSION = '1.0.0';
  var SESSION_STORAGE_KEY = 'lmdr_feature_tracker_session';
  var LAST_ACTIVITY_KEY = 'lmdr_feature_tracker_last_activity';
  var SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  // Valid action types (from FeatureAdoptionLogs schema)
  var VALID_ACTIONS = [
    'view',
    'click',
    'complete',
    'hover',
    'scroll_to',
    'time_spent',
    'error',
    'abandon',
    'share',
    'repeat',
    'first_use'
  ];

  // ============================================================================
  // MODULE STATE
  // ============================================================================

  var _initialized = false;
  var _config = {
    userId: null,
    userRole: null,
    sessionId: null,
    deviceType: null,
    debug: false
  };
  var _timers = {};  // featureId -> { startTime, featureId }
  var _activityCheckInterval = null;

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Generate a UUID v4 style session ID
   * @returns {string} UUID string
   */
  function generateUUID() {
    // Use crypto.getRandomValues if available, otherwise fall back to Math.random
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      var arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      // Set version (4) and variant bits
      arr[6] = (arr[6] & 0x0f) | 0x40;
      arr[8] = (arr[8] & 0x3f) | 0x80;

      var hex = '';
      for (var i = 0; i < 16; i++) {
        hex += ('0' + arr[i].toString(16)).slice(-2);
      }
      return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
    } else {
      // Fallback for older browsers
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }

  /**
   * Detect device type from user agent
   * @returns {string} 'mobile', 'tablet', or 'desktop'
   */
  function detectDeviceType() {
    var ua = navigator.userAgent || '';
    var uaLower = ua.toLowerCase();

    // Check for tablets first (they often have 'mobile' in UA too)
    var isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(uaLower);
    if (isTablet) {
      return 'tablet';
    }

    // Check for mobile devices
    var isMobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(ua);
    if (isMobile) {
      return 'mobile';
    }

    return 'desktop';
  }

  /**
   * Get current timestamp in ISO format
   * @returns {string} ISO timestamp
   */
  function getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Get referrer URL, sanitized
   * @returns {string} Referrer path or empty string
   */
  function getReferrer() {
    try {
      if (document.referrer) {
        var url = new URL(document.referrer);
        return url.pathname + url.search;
      }
    } catch (e) {
      // URL parsing failed, return raw referrer
      return document.referrer || '';
    }
    return '';
  }

  /**
   * Log to console if debug mode is enabled
   * @param {string} level - Log level ('log', 'warn', 'error', 'info')
   * @param {...*} args - Arguments to log
   */
  function debugLog(level, args) {
    if (!_config.debug) return;

    var prefix = '[FeatureTracker]';
    var logArgs = [prefix].concat(Array.prototype.slice.call(args));

    switch (level) {
      case 'error':
        console.error.apply(console, logArgs);
        break;
      case 'warn':
        console.warn.apply(console, logArgs);
        break;
      case 'info':
        console.info.apply(console, logArgs);
        break;
      default:
        console.log.apply(console, logArgs);
    }
  }

  /**
   * Format event for debug output
   * @param {string} action - Action type
   * @param {string} featureId - Feature identifier
   * @param {Object} context - Event context
   * @returns {string} Formatted string
   */
  function formatEventForDebug(action, featureId, context) {
    var lines = [
      '--- Feature Event ---',
      'Action: ' + action,
      'Feature: ' + featureId,
      'User: ' + _config.userId,
      'Role: ' + _config.userRole,
      'Session: ' + _config.sessionId,
      'Device: ' + _config.deviceType,
      'Time: ' + getTimestamp()
    ];

    if (context && Object.keys(context).length > 0) {
      lines.push('Context: ' + JSON.stringify(context, null, 2));
    }

    lines.push('---------------------');
    return lines.join('\n');
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Get stored session ID from sessionStorage
   * @returns {string|null} Session ID or null
   */
  function getStoredSessionId() {
    try {
      return sessionStorage.getItem(SESSION_STORAGE_KEY);
    } catch (e) {
      // sessionStorage not available
      return null;
    }
  }

  /**
   * Store session ID in sessionStorage
   * @param {string} sessionId - Session ID to store
   */
  function storeSessionId(sessionId) {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    } catch (e) {
      // sessionStorage not available
      debugLog('warn', ['Unable to store session ID in sessionStorage']);
    }
  }

  /**
   * Get last activity timestamp from sessionStorage
   * @returns {number|null} Timestamp or null
   */
  function getLastActivity() {
    try {
      var stored = sessionStorage.getItem(LAST_ACTIVITY_KEY);
      return stored ? parseInt(stored, 10) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Update last activity timestamp
   */
  function updateLastActivity() {
    try {
      sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch (e) {
      // sessionStorage not available
    }
  }

  /**
   * Check if session has timed out and generate new if needed
   * @returns {boolean} True if session was regenerated
   */
  function checkSessionTimeout() {
    var lastActivity = getLastActivity();
    if (lastActivity) {
      var elapsed = Date.now() - lastActivity;
      if (elapsed > SESSION_TIMEOUT_MS) {
        debugLog('info', ['Session timed out after ' + Math.round(elapsed / 60000) + ' minutes of inactivity']);
        startNewSession();
        return true;
      }
    }
    return false;
  }

  /**
   * Initialize or restore session
   * @param {string} sessionIdOption - 'auto' for automatic, or specific session ID
   * @returns {string} Session ID
   */
  function initializeSession(sessionIdOption) {
    if (sessionIdOption === 'auto') {
      // Check for existing session that hasn't timed out
      var existingSession = getStoredSessionId();
      if (existingSession && !checkSessionTimeout()) {
        _config.sessionId = existingSession;
        updateLastActivity();
        debugLog('info', ['Restored existing session: ' + _config.sessionId]);
        return _config.sessionId;
      }

      // Generate new session
      _config.sessionId = 'sess_' + generateUUID();
      storeSessionId(_config.sessionId);
      updateLastActivity();
      debugLog('info', ['Generated new session: ' + _config.sessionId]);
    } else {
      _config.sessionId = sessionIdOption;
      storeSessionId(_config.sessionId);
      updateLastActivity();
    }

    return _config.sessionId;
  }

  /**
   * Start periodic session timeout check
   */
  function startActivityCheck() {
    if (_activityCheckInterval) {
      clearInterval(_activityCheckInterval);
    }

    // Check every 5 minutes
    _activityCheckInterval = setInterval(function() {
      checkSessionTimeout();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop activity check interval
   */
  function stopActivityCheck() {
    if (_activityCheckInterval) {
      clearInterval(_activityCheckInterval);
      _activityCheckInterval = null;
    }
  }

  // ============================================================================
  // POSTMESSAGE COMMUNICATION
  // ============================================================================

  /**
   * Send event to Wix Velo via PostMessage
   * @param {Object} eventData - Event data to send
   */
  function sendToWix(eventData) {
    var message = {
      type: 'logFeatureInteraction',
      data: eventData
    };

    try {
      window.parent.postMessage(message, '*');
      debugLog('log', ['Event sent to Wix:', eventData.action, eventData.featureId]);
    } catch (e) {
      debugLog('error', ['Failed to send event to Wix:', e.message]);
    }
  }

  // ============================================================================
  // CORE TRACKING FUNCTIONS
  // ============================================================================

  /**
   * Log a feature interaction event
   * @param {string} featureId - Feature identifier
   * @param {string} action - Action type (view, click, complete, etc.)
   * @param {Object} [context] - Additional context
   * @returns {boolean} Success status
   */
  function logEvent(featureId, action, context) {
    if (!_initialized) {
      debugLog('error', ['FeatureTracker not initialized. Call init() first.']);
      return false;
    }

    if (!featureId || typeof featureId !== 'string') {
      debugLog('error', ['Invalid featureId:', featureId]);
      return false;
    }

    if (VALID_ACTIONS.indexOf(action) === -1) {
      debugLog('warn', ['Invalid action type:', action, '. Valid types:', VALID_ACTIONS.join(', ')]);
      // Continue anyway but log warning
    }

    // Check session timeout and update activity
    checkSessionTimeout();
    updateLastActivity();

    // Build event data
    var eventData = {
      featureId: featureId,
      userId: _config.userId,
      action: action,
      userRole: _config.userRole,
      sessionId: _config.sessionId,
      deviceType: _config.deviceType,
      timestamp: getTimestamp(),
      referrer: getReferrer()
    };

    // Merge context data
    if (context && typeof context === 'object') {
      var contextFields = [
        'featureVersion', 'entryPoint', 'durationMs', 'scrollDepth',
        'interactionCount', 'outcome', 'conversionValue', 'nextFeature',
        'errorCode', 'errorMessage', 'metadata', 'element'
      ];

      for (var i = 0; i < contextFields.length; i++) {
        var field = contextFields[i];
        if (context[field] !== undefined) {
          eventData[field] = context[field];
        }
      }
    }

    // Debug output
    if (_config.debug) {
      console.log(formatEventForDebug(action, featureId, context));
    }

    // Send to Wix
    sendToWix(eventData);

    return true;
  }

  // ============================================================================
  // PUBLIC API - INITIALIZATION
  // ============================================================================

  /**
   * Initialize the feature tracker
   * @param {Object} options - Configuration options
   * @param {string} options.userId - Member ID or anonymous ID
   * @param {string} options.userRole - User role ('driver', 'carrier', 'recruiter')
   * @param {string} [options.sessionId='auto'] - Session ID or 'auto' for automatic
   * @param {string} [options.deviceType='auto'] - Device type or 'auto' for detection
   * @param {boolean} [options.debug=false] - Enable debug logging
   * @returns {boolean} Success status
   */
  function init(options) {
    if (!options) {
      console.error('[FeatureTracker] init() requires options object');
      return false;
    }

    if (!options.userId) {
      console.error('[FeatureTracker] userId is required');
      return false;
    }

    if (!options.userRole) {
      console.error('[FeatureTracker] userRole is required');
      return false;
    }

    // Set configuration
    _config.userId = options.userId;
    _config.userRole = options.userRole;
    _config.debug = options.debug === true;

    // Handle device type
    if (options.deviceType === 'auto' || !options.deviceType) {
      _config.deviceType = detectDeviceType();
    } else {
      _config.deviceType = options.deviceType;
    }

    // Handle session ID
    initializeSession(options.sessionId || 'auto');

    // Start activity check for session timeout
    startActivityCheck();

    // Set up beforeunload handler for auto-sending timer data
    setupBeforeUnloadHandler();

    _initialized = true;

    debugLog('info', [
      'Initialized:',
      'userId=' + _config.userId,
      'role=' + _config.userRole,
      'session=' + _config.sessionId,
      'device=' + _config.deviceType
    ]);

    return true;
  }

  /**
   * Check if tracker is initialized
   * @returns {boolean} Initialization status
   */
  function isInitialized() {
    return _initialized;
  }

  // ============================================================================
  // PUBLIC API - TRACKING METHODS
  // ============================================================================

  /**
   * Track a feature view
   * @param {string} featureId - Feature identifier
   * @param {Object} [context] - Additional context (entryPoint, referrer, metadata)
   * @returns {boolean} Success status
   */
  function view(featureId, context) {
    return logEvent(featureId, 'view', context);
  }

  /**
   * Track a click/interaction within a feature
   * @param {string} featureId - Feature identifier
   * @param {Object} [context] - Additional context (element, metadata)
   * @returns {boolean} Success status
   */
  function click(featureId, context) {
    return logEvent(featureId, 'click', context);
  }

  /**
   * Track feature completion (primary task finished)
   * @param {string} featureId - Feature identifier
   * @param {Object} [context] - Additional context (outcome, conversionValue, metadata)
   * @returns {boolean} Success status
   */
  function complete(featureId, context) {
    return logEvent(featureId, 'complete', context);
  }

  /**
   * Track an error event
   * @param {string} featureId - Feature identifier
   * @param {string} errorCode - Machine-readable error code
   * @param {string} [errorMessage] - Human-readable error message
   * @returns {boolean} Success status
   */
  function error(featureId, errorCode, errorMessage) {
    return logEvent(featureId, 'error', {
      errorCode: errorCode,
      errorMessage: errorMessage || '',
      outcome: 'failure'
    });
  }

  /**
   * Track abandonment (user left mid-process)
   * @param {string} featureId - Feature identifier
   * @param {Object} [context] - Additional context (step, totalSteps, metadata)
   * @returns {boolean} Success status
   */
  function abandon(featureId, context) {
    var abandonContext = context || {};
    abandonContext.outcome = 'abandoned';
    return logEvent(featureId, 'abandon', abandonContext);
  }

  /**
   * Track a hover event (interest signal)
   * @param {string} featureId - Feature identifier
   * @param {Object} [context] - Additional context
   * @returns {boolean} Success status
   */
  function hover(featureId, context) {
    return logEvent(featureId, 'hover', context);
  }

  /**
   * Track scroll-to event (user scrolled to element)
   * @param {string} featureId - Feature identifier
   * @param {Object} [context] - Additional context (scrollDepth, metadata)
   * @returns {boolean} Success status
   */
  function scrollTo(featureId, context) {
    return logEvent(featureId, 'scroll_to', context);
  }

  /**
   * Track share event
   * @param {string} featureId - Feature identifier
   * @param {Object} [context] - Additional context (shareType, platform, metadata)
   * @returns {boolean} Success status
   */
  function share(featureId, context) {
    return logEvent(featureId, 'share', context);
  }

  /**
   * Track first-time feature use
   * @param {string} featureId - Feature identifier
   * @param {Object} [context] - Additional context
   * @returns {boolean} Success status
   */
  function firstUse(featureId, context) {
    return logEvent(featureId, 'first_use', context);
  }

  /**
   * Track repeat visit to feature
   * @param {string} featureId - Feature identifier
   * @param {Object} [context] - Additional context
   * @returns {boolean} Success status
   */
  function repeat(featureId, context) {
    return logEvent(featureId, 'repeat', context);
  }

  // ============================================================================
  // PUBLIC API - TIMER METHODS
  // ============================================================================

  /**
   * Start a timer for tracking time spent on a feature
   * @param {string} featureId - Feature identifier
   * @returns {boolean} Success status
   */
  function startTimer(featureId) {
    if (!_initialized) {
      debugLog('error', ['FeatureTracker not initialized. Call init() first.']);
      return false;
    }

    if (!featureId) {
      debugLog('error', ['featureId is required for startTimer']);
      return false;
    }

    _timers[featureId] = {
      startTime: Date.now(),
      featureId: featureId
    };

    debugLog('info', ['Timer started for:', featureId]);
    return true;
  }

  /**
   * Stop a timer and return the duration
   * @param {string} featureId - Feature identifier
   * @returns {number|null} Duration in milliseconds, or null if no timer
   */
  function stopTimer(featureId) {
    if (!_initialized) {
      debugLog('error', ['FeatureTracker not initialized.']);
      return null;
    }

    var timer = _timers[featureId];
    if (!timer) {
      debugLog('warn', ['No timer found for:', featureId]);
      return null;
    }

    var durationMs = Date.now() - timer.startTime;
    delete _timers[featureId];

    debugLog('info', ['Timer stopped for:', featureId, '- Duration:', durationMs + 'ms']);

    // Log the time_spent event
    logEvent(featureId, 'time_spent', {
      durationMs: durationMs
    });

    return durationMs;
  }

  /**
   * Get current timer duration without stopping
   * @param {string} featureId - Feature identifier
   * @returns {number|null} Current duration in ms, or null if no timer
   */
  function getTimerDuration(featureId) {
    var timer = _timers[featureId];
    if (!timer) return null;
    return Date.now() - timer.startTime;
  }

  /**
   * Check if a timer is active for a feature
   * @param {string} featureId - Feature identifier
   * @returns {boolean} True if timer is active
   */
  function hasActiveTimer(featureId) {
    return !!_timers[featureId];
  }

  /**
   * Get all active timer feature IDs
   * @returns {string[]} Array of feature IDs with active timers
   */
  function getActiveTimers() {
    return Object.keys(_timers);
  }

  /**
   * Set up beforeunload handler to auto-send timer data
   */
  function setupBeforeUnloadHandler() {
    window.addEventListener('beforeunload', function() {
      // Stop all active timers and send time_spent events
      var activeTimers = Object.keys(_timers);
      for (var i = 0; i < activeTimers.length; i++) {
        var featureId = activeTimers[i];
        stopTimer(featureId);
      }
    });
  }

  // ============================================================================
  // PUBLIC API - SESSION MANAGEMENT
  // ============================================================================

  /**
   * Get current session ID
   * @returns {string|null} Session ID
   */
  function getSessionId() {
    return _config.sessionId;
  }

  /**
   * End current session explicitly
   */
  function endSession() {
    // Stop all timers first
    var activeTimers = Object.keys(_timers);
    for (var i = 0; i < activeTimers.length; i++) {
      stopTimer(activeTimers[i]);
    }

    // Stop activity checks
    stopActivityCheck();

    // Clear session storage
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(LAST_ACTIVITY_KEY);
    } catch (e) {
      // Ignore
    }

    debugLog('info', ['Session ended:', _config.sessionId]);
    _config.sessionId = null;
  }

  /**
   * Start a new session
   * @returns {string} New session ID
   */
  function startNewSession() {
    // Stop timers from old session
    var activeTimers = Object.keys(_timers);
    for (var i = 0; i < activeTimers.length; i++) {
      stopTimer(activeTimers[i]);
    }

    // Generate new session
    _config.sessionId = 'sess_' + generateUUID();
    storeSessionId(_config.sessionId);
    updateLastActivity();

    debugLog('info', ['New session started:', _config.sessionId]);
    return _config.sessionId;
  }

  // ============================================================================
  // PUBLIC API - DEVICE DETECTION
  // ============================================================================

  /**
   * Get current device type
   * @returns {string} Device type ('mobile', 'tablet', 'desktop')
   */
  function getDeviceType() {
    return _config.deviceType;
  }

  /**
   * Override detected device type
   * @param {string} type - Device type to set
   */
  function setDeviceType(type) {
    if (type && typeof type === 'string') {
      _config.deviceType = type;
      debugLog('info', ['Device type overridden to:', type]);
    }
  }

  // ============================================================================
  // PUBLIC API - AUTO-INSTRUMENTATION WRAPPER
  // ============================================================================

  /**
   * Wrap an async function to auto-track view/complete/error
   * @param {string} featureId - Feature identifier
   * @param {Function} asyncFn - Async function to wrap
   * @param {Object} [options] - Options for what to track
   * @param {boolean} [options.trackView=true] - Track view on function call
   * @param {boolean} [options.trackComplete=true] - Track complete on success
   * @param {boolean} [options.trackErrors=true] - Track errors on failure
   * @param {Object} [options.viewContext] - Context for view event
   * @param {Object} [options.completeContext] - Context for complete event
   * @returns {Function} Instrumented function
   */
  function instrument(featureId, asyncFn, options) {
    var opts = options || {};
    var trackView = opts.trackView !== false;
    var trackComplete = opts.trackComplete !== false;
    var trackErrors = opts.trackErrors !== false;

    return function() {
      var args = Array.prototype.slice.call(arguments);

      // Track view
      if (trackView) {
        view(featureId, opts.viewContext);
      }

      // Start timer
      startTimer(featureId);

      // Call the original function
      var result;
      try {
        result = asyncFn.apply(this, args);
      } catch (e) {
        // Synchronous error
        stopTimer(featureId);
        if (trackErrors) {
          error(featureId, 'SYNC_ERROR', e.message);
        }
        throw e;
      }

      // Handle promise result
      if (result && typeof result.then === 'function') {
        return result.then(function(value) {
          var durationMs = stopTimer(featureId);
          if (trackComplete) {
            var ctx = opts.completeContext || {};
            ctx.outcome = 'success';
            ctx.durationMs = durationMs;
            complete(featureId, ctx);
          }
          return value;
        }).catch(function(err) {
          stopTimer(featureId);
          if (trackErrors) {
            var errCode = err.code || 'ASYNC_ERROR';
            error(featureId, errCode, err.message);
          }
          throw err;
        });
      }

      // Synchronous success
      var durationMs = stopTimer(featureId);
      if (trackComplete) {
        var ctx = opts.completeContext || {};
        ctx.outcome = 'success';
        ctx.durationMs = durationMs;
        complete(featureId, ctx);
      }
      return result;
    };
  }

  // ============================================================================
  // PUBLIC API - CONFIGURATION ACCESS
  // ============================================================================

  /**
   * Get current configuration (read-only copy)
   * @returns {Object} Configuration object
   */
  function getConfig() {
    return {
      userId: _config.userId,
      userRole: _config.userRole,
      sessionId: _config.sessionId,
      deviceType: _config.deviceType,
      debug: _config.debug,
      initialized: _initialized
    };
  }

  /**
   * Enable or disable debug mode
   * @param {boolean} enabled - Whether to enable debug mode
   */
  function setDebug(enabled) {
    _config.debug = enabled === true;
    debugLog('info', ['Debug mode:', _config.debug ? 'enabled' : 'disabled']);
  }

  // ============================================================================
  // PUBLIC API - UTILITY
  // ============================================================================

  /**
   * Get library version
   * @returns {string} Version string
   */
  function getVersion() {
    return VERSION;
  }

  /**
   * Send a raw event (for advanced use cases)
   * @param {Object} eventData - Complete event data object
   * @returns {boolean} Success status
   */
  function sendRawEvent(eventData) {
    if (!_initialized) {
      debugLog('error', ['FeatureTracker not initialized.']);
      return false;
    }

    // Ensure required fields
    eventData.timestamp = eventData.timestamp || getTimestamp();
    eventData.sessionId = eventData.sessionId || _config.sessionId;
    eventData.userId = eventData.userId || _config.userId;
    eventData.userRole = eventData.userRole || _config.userRole;
    eventData.deviceType = eventData.deviceType || _config.deviceType;

    sendToWix(eventData);
    return true;
  }

  // ============================================================================
  // EXPORT PUBLIC API
  // ============================================================================

  global.FeatureTracker = {
    // Initialization
    init: init,
    isInitialized: isInitialized,
    getVersion: getVersion,

    // Core tracking methods
    view: view,
    click: click,
    complete: complete,
    error: error,
    abandon: abandon,
    hover: hover,
    scrollTo: scrollTo,
    share: share,
    firstUse: firstUse,
    repeat: repeat,

    // Timer methods
    startTimer: startTimer,
    stopTimer: stopTimer,
    getTimerDuration: getTimerDuration,
    hasActiveTimer: hasActiveTimer,
    getActiveTimers: getActiveTimers,

    // Session management
    getSessionId: getSessionId,
    endSession: endSession,
    startNewSession: startNewSession,

    // Device detection
    getDeviceType: getDeviceType,
    setDeviceType: setDeviceType,

    // Auto-instrumentation
    instrument: instrument,

    // Configuration
    getConfig: getConfig,
    setDebug: setDebug,

    // Utility
    sendRawEvent: sendRawEvent,

    // Constants
    VALID_ACTIONS: VALID_ACTIONS
  };

})(window);
