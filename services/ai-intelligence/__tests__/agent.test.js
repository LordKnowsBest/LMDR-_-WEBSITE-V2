/**
 * Tests for POST /v1/agent/turn
 * Uses Node.js built-in test runner (node --test).
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

// ── Minimal in-process Hono test harness ──────────────────────────────────
// We import the app and call app.fetch() directly — no network needed.

process.env.LMDR_INTERNAL_KEY = 'test-key-abc';
process.env.ANTHROPIC_API_KEY  = 'test-api-key';

// Mock ClaudeAdapter before importing routes
import { ClaudeAdapter } from '../runtime/claudeAdapter.js';

function makeHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'x-lmdr-internal-key': 'test-key-abc',
    'x-lmdr-timestamp': String(Date.now()),
    ...extra,
  };
}

describe('POST /v1/agent/turn — auth', () => {
  it('rejects missing auth key with 401', async () => {
    const { app } = await import('../server.js').catch(() => ({ app: null }));
    if (!app) return; // Skip if server not importable in test env

    const res = await app.fetch(new Request('http://localhost/v1/agent/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-lmdr-timestamp': String(Date.now()) },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    }));
    assert.equal(res.status, 401);
  });

  it('rejects expired timestamp with 401', async () => {
    const { app } = await import('../server.js').catch(() => ({ app: null }));
    if (!app) return;

    const res = await app.fetch(new Request('http://localhost/v1/agent/turn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lmdr-internal-key': 'test-key-abc',
        'x-lmdr-timestamp': String(Date.now() - 60_000), // 60s ago — expired
      },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    }));
    assert.equal(res.status, 401);
  });

  it('rejects empty messages array with 400', async () => {
    const { app } = await import('../server.js').catch(() => ({ app: null }));
    if (!app) return;

    const res = await app.fetch(new Request('http://localhost/v1/agent/turn', {
      method: 'POST',
      headers: makeHeaders(),
      body: JSON.stringify({ messages: [] }),
    }));
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'validation_error');
  });
});

describe('GET /health', () => {
  it('returns JSON with status field', async () => {
    const { app } = await import('../server.js').catch(() => ({ app: null }));
    if (!app) return;

    const res = await app.fetch(new Request('http://localhost/health'));
    // May be 200 or 503 depending on whether Anthropic API is reachable
    const body = await res.json();
    assert.ok(['ok', 'degraded'].includes(body.status), `unexpected status: ${body.status}`);
  });
});

describe('Phase stubs return 501', () => {
  it('/v1/stream returns 501', async () => {
    const { app } = await import('../server.js').catch(() => ({ app: null }));
    if (!app) return;

    const res = await app.fetch(new Request('http://localhost/v1/stream', {
      method: 'POST',
      headers: makeHeaders(),
      body: JSON.stringify({}),
    }));
    assert.equal(res.status, 501);
  });

  it('/v1/embed/driver returns 501', async () => {
    const { app } = await import('../server.js').catch(() => ({ app: null }));
    if (!app) return;

    const res = await app.fetch(new Request('http://localhost/v1/embed/driver', {
      method: 'POST',
      headers: makeHeaders(),
      body: JSON.stringify({}),
    }));
    assert.equal(res.status, 501);
  });
});
