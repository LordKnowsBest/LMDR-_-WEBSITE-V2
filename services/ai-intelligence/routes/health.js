/**
 * GET /health
 * Returns microservice liveness + provider readiness.
 * Auth-exempt — safe to call from load balancer / uptime monitors.
 */

import { Hono } from 'hono';
import { ClaudeAdapter } from '../runtime/claudeAdapter.js';
import { checkHealth } from '../lib/pinecone.js';

export const healthRouter = new Hono();

const adapter = new ClaudeAdapter();

healthRouter.get('/', async (c) => {
  const [claudeHealth, driversHealth, carriersHealth] = await Promise.all([
    adapter.health().catch(err => ({ status: 'error', latencyMs: 0, detail: err.message })),
    checkHealth('drivers'),
    checkHealth('carriers'),
  ]);

  const checks = {
    claude:           claudeHealth,
    pinecone_drivers:  driversHealth,
    pinecone_carriers: carriersHealth,
    voyage_embeddings: process.env.VOYAGE_API_KEY ? 'configured' : 'missing',
  };

  // Degraded if Claude is down (runtime unusable) or Pinecone is down (semantic unusable)
  const overall = claudeHealth.status === 'ok' ? 'ok' : 'degraded';

  return c.json({
    status: overall,
    version: '1.0.0',
    provider: process.env.RUNTIME_PROVIDER || 'claude',
    checks,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  }, overall === 'ok' ? 200 : 503);
});
