/**
 * LMDR AI Intelligence Microservice
 *
 * Hono server exposing the AI runtime layer for Wix Velo integration.
 * Phase 1: Claude Agent SDK runtime (/agent/turn, /health)
 * Phase 2: Semantic search (/embed/*, /search/*)     — stub
 * Phase 3: Streaming (/agent/stream)                 — stub
 * Phase 4: B2B research (/research/company)          — stub
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { authMiddleware }      from './lib/auth.js';
import { rateLimitMiddleware } from './lib/rateLimit.js';
import { agentRouter }    from './routes/agent.js';
import { healthRouter }   from './routes/health.js';
import { streamRouter }   from './routes/stream.js';
import { semanticRouter } from './routes/semantic.js';
import { researchRouter } from './routes/research.js';
import { jobsRouter }     from './jobs/index.js';
import { startScheduler } from './lib/scheduler.js';

const app = new Hono();

// ── Global middleware ──────────────────────────────────────────────────────
app.use('*', rateLimitMiddleware());

// Health check is auth-exempt (used by Railway for liveness probes)
app.route('/health', healthRouter);

// All other routes require auth
app.use('/v1/*', authMiddleware());

// ── v1 routes ─────────────────────────────────────────────────────────────
app.route('/v1/agent',    agentRouter);
app.route('/v1/stream',   streamRouter);
app.route('/v1',          semanticRouter);   // /v1/embed/*, /v1/search/*
app.route('/v1/research', researchRouter);
app.route('/v1/jobs',     jobsRouter);

// ── 404 catch-all ─────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: { code: 'not_found', message: `${c.req.method} ${c.req.path} not found` } }, 404));

// ── Error handler ─────────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('[server] Unhandled error:', err);
  return c.json({ error: { code: 'internal_error', message: 'Unexpected server error' } }, 500);
});

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`[lmdr-ai-intelligence] Listening on port ${PORT}`);
  console.log(`[lmdr-ai-intelligence] Provider: ${process.env.RUNTIME_PROVIDER || 'claude'}`);
  startScheduler(PORT);
});
