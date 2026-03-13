/**
 * In-memory stream session store.
 *
 * A session bridges the async Claude streaming process (POST /agent-turn)
 * to a browser SSE client (GET /events/:token). Both sides share a token.
 *
 * Lifecycle:
 *   1. POST creates session → token returned to Velo
 *   2. Claude streaming starts async, pushes events via pushEvent()
 *   3. Browser opens GET /events/:token → SSE handler polls for events
 *   4. On 'done' or 'error' event → session marked done
 *   5. Session auto-deleted after SESSION_TTL_MS
 *
 * The 50ms poll in the SSE handler gives < 50ms event delivery latency —
 * well within the 800ms TTFT target.
 */

import crypto from 'node:crypto';

const SESSION_TTL_MS = 90_000; // 90s max stream duration
const sessions = new Map();

/**
 * Create a new stream session. Returns the session token (48-char hex).
 * @returns {string} token
 */
export function createSession() {
  const token = crypto.randomBytes(24).toString('hex');
  const session = {
    token,
    events:    [],
    done:      false,
    createdAt: Date.now(),
  };
  sessions.set(token, session);
  setTimeout(() => sessions.delete(token), SESSION_TTL_MS);
  return token;
}

/**
 * Look up a session by token. Returns null if expired or not found.
 * @param {string} token
 * @returns {object|null}
 */
export function getSession(token) {
  return sessions.get(token) || null;
}

/**
 * Push an event into the session. The SSE handler will pick it up on next poll.
 * Marks session as done when event type is 'done' or 'error'.
 * @param {string} token
 * @param {object} event
 */
export function pushEvent(token, event) {
  const session = sessions.get(token);
  if (!session) return;
  session.events.push(event);
  if (event.type === 'done' || event.type === 'error') {
    session.done = true;
  }
}
