/**
 * GET /health
 * Returns microservice liveness + provider readiness.
 */

import { Hono } from 'hono';
import { ClaudeAdapter } from '../runtime/claudeAdapter.js';

export const healthRouter = new Hono();

const adapter = new ClaudeAdapter();

healthRouter.get('/', async (c) => {
  const providerHealth = await adapter.health().catch(err => ({
    status: 'error',
    latencyMs: 0,
    detail: err.message,
  }));

  const overall = providerHealth.status === 'ok' ? 'ok' : 'degraded';

  return c.json({
    status: overall,
    version: '1.0.0',
    provider: process.env.RUNTIME_PROVIDER || 'claude',
    checks: {
      claude: providerHealth,
    },
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  }, overall === 'ok' ? 200 : 503);
});
