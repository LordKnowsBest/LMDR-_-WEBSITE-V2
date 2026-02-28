// ============================================================================
// AOS-BRIDGE — Pure Wix Velo PostMessage Bridge
// Ensures ZERO MOCK DATA and strong Promise-based communication
// ============================================================================

(function () {
    'use strict';

    let initialized = false;
    let isReady = false;
    let nextMsgId = 1;

    // Callbacks waiting for velocityReady from Velo
    const readyCallbacks = [];

    // Pending requests keyed by correlationId
    const pendingRequests = new Map();

    // Default timeout for bridge requests (15s)
    const REQUEST_TIMEOUT = 15000;

    window.AOS = window.AOS || {};

    // Expose the new Promise-based API
    AOS.bridge = {
        init,
        send,          // THE ONLY WAY to request data now (returns Promise)
        onReady,
        get status() { return isReady ? 'CONNECTED' : 'WAITING'; }
    };

    /**
     * Initializes the bridge listener (called by App Shell on DOMContentLoaded)
     */
    function init() {
        if (initialized) return;
        initialized = true;

        window.addEventListener('message', handleInboundMessage);

        // Announce presence immediately
        _postMessageToParent({ action: 'aosInit', payload: { version: '2.0.0', mode: 'strict' } });
        console.log('[AOS Bridge] Initialized. Awaiting vReady signal.');
    }

    /**
     * Helper to actually dispatch the message securely to the parent frame
     */
    function _postMessageToParent(msg) {
        try {
            window.parent.postMessage(msg, '*');
        } catch (e) {
            console.error('[AOS Bridge] Critical postMessage failure:', e);
        }
    }

    /**
     * The core asynchronous request method.
     * All views MUST use this to get data. No mocked fallback allowed.
     * 
     * @param {string} action The action verb mapped in Velo (e.g., 'getDashboardData')
     * @param {Object} payload Optional parameters for the Velo function
     * @param {number} timeoutOverride Optional custom timeout in ms
     * @returns {Promise<any>} Resolves with payload from Velo, or rejects on error/timeout
     */
    function send(action, payload = {}, timeoutOverride = null) {
        return new Promise((resolve, reject) => {
            if (!action || typeof action !== 'string') {
                return reject(new Error('AOS Bridge: Invalid action string.'));
            }

            // ZERO MOCK GUARD: Prevent known bad patterns
            if (action.toLowerCase().includes('mock') || payload.mock === true) {
                console.error(`[AOS Bridge] ⛔ ZERO MOCK VIOLATION: Blocked attempt to send mock request for ${action}`);
                return reject(new Error('MOCK_DATA_PROHIBITED'));
            }

            const correlationId = `aos-${Date.now()}-${nextMsgId++}`;
            const timeoutMs = timeoutOverride || REQUEST_TIMEOUT;

            // Setup timeout
            const timeoutTimer = setTimeout(() => {
                if (pendingRequests.has(correlationId)) {
                    pendingRequests.delete(correlationId);
                    console.error(`[AOS Bridge] ⏱️ Timeout (${timeoutMs}ms) waiting for Velo response: ${action}`);
                    reject(new Error('BRIDGE_TIMEOUT'));
                }
            }, timeoutMs);

            // Register request
            pendingRequests.set(correlationId, { resolve, reject, timeoutTimer, action });

            // Dispatch
            _postMessageToParent({
                action: action,
                payload: payload,
                correlationId: correlationId,
                timestamp: Date.now()
            });
        });
    }

    /**
     * Inbound message handler for postMessage events from Velo
     */
    function handleInboundMessage(event) {
        const msg = event.data;
        if (!msg || typeof msg !== 'object') return;

        // Velo Lifecycle Event: Page is ready and security verified
        if (msg.action === 'vReady') {
            isReady = true;
            console.log(`[AOS Bridge] 🟢 Velo Link Established. Security Context: ${msg.payload?.role || 'Unknown'}`);

            // Flush queued ready callbacks
            while (readyCallbacks.length > 0) {
                const cb = readyCallbacks.shift();
                try { cb(msg.payload); } catch (e) { console.error('AOS Bridge OnReady callback error:', e); }
            }
            return;
        }

        // Bridge Response matched by correlationId
        if (msg.correlationId && pendingRequests.has(msg.correlationId)) {
            const req = pendingRequests.get(msg.correlationId);
            clearTimeout(req.timeoutTimer);
            pendingRequests.delete(msg.correlationId);

            if (msg.error) {
                console.error(`[AOS Bridge] ❌ Velo returned error for ${req.action}:`, msg.error);
                req.reject(new Error(msg.error.message || msg.error || 'VELO_ERROR'));
            } else {
                req.resolve(msg.payload);
            }
            return;
        }

        // Push Event: Unsolicited data from Velo (e.g., realtime notifications, stream updates)
        if (msg.action && !msg.correlationId) {
            // First try AOS.views router for global events
            const handled = AOS.views && AOS.views.routeMessage(msg.action, msg.payload);
            if (!handled) {
                console.log(`[AOS Bridge] 📩 Unsolicited push event received: ${msg.action}`);
            }
        }
    }

    /**
     * Subscribe to the Velo Ready event
     */
    function onReady(callback) {
        if (typeof callback !== 'function') return;
        if (isReady) {
            callback();
        } else {
            readyCallbacks.push(callback);
        }
    }

})();
