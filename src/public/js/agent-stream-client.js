/**
 * agent-stream-client.js
 *
 * Reusable browser module for consuming LMDR AI streaming sessions via SSE.
 *
 * Flow:
 *   1. Velo page code receives a { streamUrl } from agentRuntimeService.jsw
 *      (which called POST /v1/stream/agent-turn on the runtime).
 *   2. Page code sends { action: 'streamReady', payload: { streamUrl } } to HTML.
 *   3. HTML module calls AgentStreamClient.connect(streamUrl, handlers) to
 *      open an EventSource and render tokens as they arrive.
 *
 * Usage:
 *   const source = AgentStreamClient.connect(streamUrl, {
 *     onOpen:  ()                              => showTypingIndicator(),
 *     onToken: (token)                         => appendText(token),
 *     onDone:  ({ totalTokens, providerRunId })=> finalize(),
 *     onError: (message)                       => showError(message),
 *   });
 *
 *   // Abort early if user navigates away:
 *   source.close();
 *
 * The EventSource is auto-closed on 'done' or server-side 'error' events.
 * Connection-level errors (network drop) are passed to onError only when
 * the EventSource is in CLOSED state — transient drops are left to the
 * browser's built-in reconnect logic.
 */

(function (global) {
  'use strict';

  const AgentStreamClient = {
    /**
     * Open an SSE connection to a stream session.
     *
     * @param {string}   streamUrl           Full URL to /v1/stream/events/<token>
     * @param {object}   handlers
     * @param {Function} [handlers.onOpen]   Called when connection opens
     * @param {Function} [handlers.onToken]  Called with each text token string
     * @param {Function} [handlers.onDone]   Called with { totalTokens, providerRunId }
     * @param {Function} [handlers.onError]  Called with error message string
     * @returns {EventSource}
     */
    connect(streamUrl, { onOpen, onToken, onDone, onError } = {}) {
      if (!streamUrl) {
        console.error('[AgentStreamClient] connect() called without streamUrl');
        return null;
      }

      const source = new EventSource(streamUrl);

      source.onopen = () => {
        if (onOpen) onOpen();
      };

      // Text token — append to response buffer
      source.addEventListener('token', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (onToken && typeof data.token === 'string') onToken(data.token);
        } catch (err) {
          console.warn('[AgentStreamClient] token parse error:', err.message);
        }
      });

      // Stream complete
      source.addEventListener('done', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (onDone) onDone({ totalTokens: data.totalTokens || 0, providerRunId: data.providerRunId || null });
        } catch (err) {
          console.warn('[AgentStreamClient] done parse error:', err.message);
          if (onDone) onDone({ totalTokens: 0, providerRunId: null });
        }
        source.close();
      });

      // Application-level error emitted by server
      source.addEventListener('error', (e) => {
        if (e.data) {
          // Server sent an error event with a JSON payload
          try {
            const data = JSON.parse(e.data);
            if (onError) onError(data.message || 'Stream error');
          } catch {
            if (onError) onError('Stream error');
          }
          source.close();
          return;
        }
        // Connection-level error — only surface to caller if truly closed
        if (source.readyState === EventSource.CLOSED) {
          if (onError) onError('Stream connection closed unexpectedly');
        }
      });

      // Heartbeat — no-op, keeps load-balancer / idle-close timers alive
      source.addEventListener('heartbeat', () => {});

      return source;
    },
  };

  global.AgentStreamClient = AgentStreamClient;
})(window);
