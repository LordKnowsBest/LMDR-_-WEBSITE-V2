/**
 * Streaming endpoints — Phase 3.
 *
 * Two routes (mounted at /v1/stream in server.js):
 *
 *   POST /v1/stream/agent-turn  (auth required — called from Velo)
 *     Body: { systemPrompt, messages, tools?, modelId?, maxTokens?, traceId? }
 *     Creates an in-memory session, fires async Claude streamStep, returns
 *     immediately with { token, eventsPath, requestId }.
 *
 *   GET /v1/stream/events/:token  (NO auth — browser EventSource)
 *     SSE stream. Polls session buffer every 50 ms, emits:
 *       event: token      { type:'token', token:'...' }
 *       event: done       { type:'done', totalTokens:N, providerRunId:'...' }
 *       event: error      { type:'error', message:'...' }
 *       event: heartbeat  { type:'heartbeat' }           (every 5 s)
 *     Closes automatically on 'done' or 'error'.
 *     Session TTL is 90 s — stale requests receive HTTP 410.
 *
 * The auth middleware in lib/auth.js exempts /stream/events/ so browsers
 * can subscribe directly without x-lmdr-internal-key headers.
 * The token itself (unguessable 48-char hex) is the credential.
 */

import { Hono }      from 'hono';
import { streamSSE } from 'hono/streaming';
import { ClaudeAdapter } from '../runtime/claudeAdapter.js';
import { createSession, getSession, pushEvent } from '../lib/streamSessions.js';
import crypto from 'node:crypto';

export const streamRouter = new Hono();

const adapter = new ClaudeAdapter();

const POLL_INTERVAL_MS = 50;
const HEARTBEAT_MS     = 5_000;
const MAX_STREAM_MS    = 90_000;

// ── POST /agent-turn ─────────────────────────────────────────────────────────

streamRouter.post('/agent-turn', async (c) => {
  const requestId = crypto.randomUUID();
  let body;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { code: 'validation_error', message: 'Invalid JSON body', requestId } }, 400);
  }

  const { systemPrompt, messages, tools = [], modelId, maxTokens, traceId } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return c.json({
      error: { code: 'validation_error', message: 'messages array is required and must be non-empty', requestId },
    }, 400);
  }

  const token      = createSession();
  const eventsPath = `/v1/stream/events/${token}`;

  // Fire-and-forget: stream Claude response into session buffer.
  // The SSE handler (GET /events/:token) drains the buffer on every 50 ms poll.
  (async () => {
    try {
      await adapter.streamStep(
        { systemPrompt, messages, tools, modelId, maxTokens },
        (event) => pushEvent(token, event)
      );
    } catch (err) {
      pushEvent(token, { type: 'error', message: err.message || 'Stream failed' });
      console.error(`[stream] streamStep error requestId=${requestId}:`, err.message);
    }
  })();

  console.log(`[stream] Session created token=${token.slice(0, 8)}… requestId=${requestId} traceId=${traceId || 'none'}`);

  return c.json({ token, eventsPath, requestId });
});

// ── GET /events/:token ───────────────────────────────────────────────────────

streamRouter.get('/events/:token', async (c) => {
  const { token } = c.req.param();

  const session = getSession(token);
  if (!session) {
    return c.json({ error: { code: 'session_not_found', message: 'Stream session not found or expired' } }, 410);
  }

  return streamSSE(c, async (stream) => {
    let cursor        = 0;
    let elapsed       = 0;
    let lastHeartbeat = 0;

    while (elapsed < MAX_STREAM_MS) {
      const current = getSession(token);
      if (!current) break; // session expired mid-stream

      // Drain events buffered since last poll
      const pending = current.events.slice(cursor);
      cursor += pending.length;

      for (const event of pending) {
        await stream.writeSSE({ event: event.type, data: JSON.stringify(event) });
      }

      if (current.done) break; // 'done' or 'error' already emitted above

      // Heartbeat every HEARTBEAT_MS to keep load-balancers / browsers alive
      if (elapsed > 0 && elapsed - lastHeartbeat >= HEARTBEAT_MS) {
        await stream.writeSSE({ event: 'heartbeat', data: '{"type":"heartbeat"}' });
        lastHeartbeat = elapsed;
      }

      await stream.sleep(POLL_INTERVAL_MS);
      elapsed += POLL_INTERVAL_MS;
    }
  });
});
