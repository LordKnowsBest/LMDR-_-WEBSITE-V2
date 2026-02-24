/**
 * GET /health
 * Returns microservice liveness + provider readiness.
 * Auth-exempt — safe to call from load balancer / uptime monitors.
 */

import { Hono } from 'hono';
import { ClaudeAdapter } from '../runtime/claudeAdapter.js';
import { checkHealth } from '../lib/pinecone.js';
import { PINECONE_HOSTS } from '../lib/knowledgeCorpus.js';

export const healthRouter = new Hono();

const adapter = new ClaudeAdapter();

async function checkRagIndexHealth(hostUrl) {
  if (!hostUrl) return 'not_configured';
  try {
    const res = await fetch(`${hostUrl}/describe_index_stats`, {
      method: 'POST',
      headers: { 'Api-Key': process.env.PINECONE_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return res.ok ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}

healthRouter.get('/', async (c) => {
  const [claudeHealth, driversHealth, carriersHealth, knowledgeHealth, memoryHealth] = await Promise.all([
    adapter.health().catch(err => ({ status: 'error', latencyMs: 0, detail: err.message })),
    checkHealth('drivers'),
    checkHealth('carriers'),
    checkRagIndexHealth(PINECONE_HOSTS.knowledge),
    checkRagIndexHealth(PINECONE_HOSTS.memory),
  ]);

  const checks = {
    claude:                    claudeHealth,
    pinecone_drivers:          driversHealth,
    pinecone_carriers:         carriersHealth,
    voyage_embeddings:         process.env.VOYAGE_API_KEY ? 'configured' : 'missing',
    intent_classifier:         process.env.GROQ_API_KEY ? 'configured' : 'missing',
    rag_lmdr_knowledge_index:  knowledgeHealth,
    rag_lmdr_memory_index:     memoryHealth,
  };

  const overall = claudeHealth.status === 'ok' ? 'ok' : 'degraded';

  return c.json({
    status: overall,
    version: '1.1.0',
    provider: process.env.RUNTIME_PROVIDER || 'claude',
    checks,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  }, overall === 'ok' ? 200 : 503);
});
