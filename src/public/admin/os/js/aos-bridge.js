// ============================================================================
// AOS-BRIDGE — PostMessage Bridge (HTML ↔ Wix Velo)
// ============================================================================

(function () {
    'use strict';

    let initialized = false;

    window.AOS = window.AOS || {};
    AOS.bridge = { init, sendToVelo, onReady };

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
        sendToVelo('adminOSReady', { version: '1.0.0' });
        console.log('[AOS Bridge] Initialized, sent adminOSReady');
    }

    /**
     * Send a message to Wix Velo page code
     * @param {string} action - Message action (matches older 'action' protocol)
     * @param {object} payload - Payload
     */
    function sendToVelo(action, payload) {
        // We send both action and payload to support various Velo listeners
        const msg = { action: action, type: action, payload: payload || {}, data: payload || {}, timestamp: Date.now() };
        try {
            window.parent.postMessage(msg, '*');
        } catch (e) {
            console.warn('[AOS Bridge] postMessage failed:', e);
        }
    }

    /**
     * Handle inbound messages from Velo
     */
    function handleInbound(event) {
        const msg = event.data;
        if (!msg || typeof msg !== 'object') return;

        const action = msg.action || msg.type;
        const payload = msg.payload || msg.data;
        if (!action) return;

        // Handle init/ready signals from Velo
        if (action === 'adminOSInit' || action === 'adminReady') {
            isReady = true;
            console.log('[AOS Bridge] Received', action, payload);

            // Fire queued ready callbacks
            readyCallbacks.forEach(cb => {
                try { cb(payload); } catch (e) { console.warn('[AOS Bridge] ready callback error:', e); }
            });
            readyCallbacks.length = 0;
            return;
        }

        // Route to view system
        const handled = AOS.views && AOS.views.routeMessage(action, payload);

        // If no view handled it, log for debugging
        if (!handled && action !== 'actionSuccess') {
            console.log('[AOS Bridge] Unhandled message:', action);
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
