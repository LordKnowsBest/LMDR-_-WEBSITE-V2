// ============================================================================
// ROS-BRIDGE — PostMessage Bridge (HTML ↔ Wix Velo)
// Uses `type` key to match Recruiter Console page code convention
// ============================================================================

(function() {
  'use strict';

  let initialized = false;

  ROS.bridge = { init, sendToVelo, onReady };

  // Callbacks queued before init
  const readyCallbacks = [];
  let isReady = false;

  /**
   * Initialize the bridge — listen for messages from Velo
   */
  function init() {
    if (initialized) return;
    initialized = true;

    window.addEventListener('message', handleInbound);

    // Tell Velo we're ready
    sendToVelo('recruiterOSReady', { version: '1.0.0' });
    console.log('[ROS Bridge] Initialized, sent recruiterOSReady');
  }

  /**
   * Send a message to Wix Velo page code
   * @param {string} type - Message type
   * @param {object} data - Payload
   */
  function sendToVelo(type, data) {
    const msg = { type, data: data || {}, timestamp: Date.now() };
    try {
      window.parent.postMessage(msg, '*');
    } catch (e) {
      console.warn('[ROS Bridge] postMessage failed:', e);
    }
  }

  /**
   * Handle inbound messages from Velo
   */
  function handleInbound(event) {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    const type = msg.type || msg.action;
    if (!type) return;

    // Handle init/ready signals from Velo
    if (type === 'recruiterOSInit' || type === 'recruiterReady') {
      isReady = true;
      const payload = msg.data || {};
      console.log('[ROS Bridge] Received', type, payload);

      // Fire queued ready callbacks
      readyCallbacks.forEach(cb => {
        try { cb(payload); } catch (e) { console.warn('[ROS Bridge] ready callback error:', e); }
      });
      readyCallbacks.length = 0;

      // Update settings if profile data came in
      if (payload.profile && ROS.settings && ROS.settings.updateProfile) {
        ROS.settings.updateProfile(payload.profile);
      }
      if (payload.carriers && ROS.settings && ROS.settings.updateCarriers) {
        ROS.settings.updateCarriers(payload.carriers);
      }
      return;
    }

    // Route to view system
    const handled = ROS.views.routeMessage(type, msg.data);

    // If no view handled it, log for debugging
    if (!handled) {
      console.log('[ROS Bridge] Unhandled message:', type);
    }
  }

  /**
   * Register a callback for when Velo connection is ready
   */
  function onReady(callback) {
    if (isReady) {
      callback();
    } else {
      readyCallbacks.push(callback);
    }
  }

})();
