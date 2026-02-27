/**
 * POST /v1/jobs/wix/:jobName
 *
 * Proxy trigger for Wix backend scheduled jobs that have been moved off
 * Wix's jobs.config (20-job hard limit) onto Railway's internal scheduler.
 *
 * Calls POST https://www.lastmiledr.app/_functions/runScheduledJob
 * with { jobName } — Wix authenticates via x-lmdr-internal-key and
 * dispatches to the corresponding backend function.
 *
 * Jobs proxied (removed from Wix jobs.config):
 *   runNightlySemanticBackfill  — daily 04:00 UTC
 *   ingestAllCarrierIntel       — every 8 hours (00, 08, 16 UTC)
 *   ingestDriverMarketAggregate — daily 03:00 UTC
 *   ingestLaneMarket            — every 6 hours (06, 12, 18 UTC)
 *   runRagFreshnessCheck        — every hour (was 30 min in Wix)
 *   runWeeklyRagAnalyticsRollup — Monday 05:00 UTC
 *   runAnomalyDetection         — every hour (was 5 min in Wix)
 */

import { Hono } from 'hono';

export const wixProxyRouter = new Hono();

const WIX_BASE = 'https://www.lastmiledr.app';
const TIMEOUT_MS = 120_000; // 2 min — some jobs are long-running

async function callWixJob(jobName) {
  const key = process.env.LMDR_INTERNAL_KEY;
  const res = await fetch(`${WIX_BASE}/_functions/runScheduledJob`, {
    method: 'POST',
    headers: {
      'Content-Type':        'application/json',
      'x-lmdr-internal-key': key || '',
      'x-lmdr-timestamp':    Date.now().toString(),
    },
    body: JSON.stringify({ jobName }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(body).slice(0, 200)}`);
  }
  return body;
}

wixProxyRouter.post('/:jobName', async (c) => {
  const jobName = c.req.param('jobName');
  console.log(`[wix-proxy] Triggering Wix job: ${jobName}`);

  try {
    const result = await callWixJob(jobName);
    console.log(`[wix-proxy] ${jobName} completed:`, JSON.stringify(result).slice(0, 200));
    return c.json({ jobName, status: 'ok', result });
  } catch (err) {
    console.error(`[wix-proxy] ${jobName} failed:`, err.message);
    return c.json({ jobName, status: 'error', error: err.message }, 500);
  }
});
