/**
 * scheduler.js — Zero-dependency internal job scheduler.
 *
 * Polls every hour. When a job's schedule matches the current UTC time
 * it fires a POST to localhost so the job runs inside the same process.
 *
 * Schedules (all UTC):
 *   fmcsa-mass-embed   — Daily at 01:00         (Airtable → Pinecone backfill, 300/run)
 *   fmcsa-sync         — Every Monday at 02:00  (weekly safety data refresh)
 *   eia-fuel           — Every Monday at 03:00  (EIA publishes Mon morning)
 *   freight-signals    — 1st of month at 04:00  (FRED monthly data)
 *   fmcsa-roster-sync  — 1st of month at 05:00  (new carrier ingestion)
 *
 * Tracks last-run date (YYYY-MM-DD) in memory to prevent double-firing
 * if the server restarts during the trigger hour.
 */

const INTERNAL_KEY = process.env.LMDR_INTERNAL_KEY;

const SCHEDULES = [
  // ── Native Railway jobs ──────────────────────────────────────────────────
  {
    name:    'fmcsa-sync',
    path:    '/v1/jobs/fmcsa-sync',
    // Every Monday (dayOfWeek === 1), hour 2
    matches: (d) => d.getUTCDay() === 1 && d.getUTCHours() === 2,
  },
  {
    name:    'eia-fuel',
    path:    '/v1/jobs/eia-fuel',
    // Every Monday (dayOfWeek === 1), hour 3  (EIA publishes Mon morning)
    matches: (d) => d.getUTCDay() === 1 && d.getUTCHours() === 3,
  },
  {
    name:    'market-signals',
    path:    '/v1/jobs/market-signals',
    // Every Monday, hour 4 — runs AFTER eia-fuel so diesel data is fresh
    matches: (d) => d.getUTCDay() === 1 && d.getUTCHours() === 4,
  },
  {
    name:    'freight-signals',
    path:    '/v1/jobs/freight-signals',
    // 1st of every month, hour 4
    matches: (d) => d.getUTCDate() === 1 && d.getUTCHours() === 4,
  },
  {
    name:    'fmcsa-roster-sync',
    path:    '/v1/jobs/fmcsa-roster-sync',
    // 1st of every month, hour 5
    matches: (d) => d.getUTCDate() === 1 && d.getUTCHours() === 5,
  },
  {
    name:    'fmcsa-mass-embed',
    path:    '/v1/jobs/fmcsa-mass-embed',
    // Every day at 01:00 UTC — backfills Airtable carriers missing from Pinecone
    matches: (d) => d.getUTCHours() === 1,
  },

  // ── Wix-proxied jobs (moved off Wix jobs.config 20-job limit) ────────────
  {
    name:    'wix:semanticBackfill',
    path:    '/v1/jobs/wix/runNightlySemanticBackfill',
    // Daily 04:00 UTC
    matches: (d) => d.getUTCHours() === 4,
  },
  {
    name:    'wix:ingestCarrierIntel',
    path:    '/v1/jobs/wix/ingestAllCarrierIntel',
    // Every 8 hours: 00, 08, 16 UTC — use hourly key so it fires 3×/day
    hourly:  true,
    matches: (d) => [0, 8, 16].includes(d.getUTCHours()),
  },
  {
    name:    'wix:ingestDriverMarket',
    path:    '/v1/jobs/wix/ingestDriverMarketAggregate',
    // Daily 03:00 UTC
    matches: (d) => d.getUTCHours() === 3,
  },
  {
    name:    'wix:ingestLaneMarket',
    path:    '/v1/jobs/wix/ingestLaneMarket',
    // Every 6 hours: 06, 12, 18 UTC
    hourly:  true,
    matches: (d) => [6, 12, 18].includes(d.getUTCHours()),
  },
  {
    name:    'wix:ragFreshness',
    path:    '/v1/jobs/wix/runRagFreshnessCheck',
    // Every hour (was every 30 min in Wix — acceptable degradation)
    hourly:  true,
    matches: () => true,
  },
  {
    name:    'wix:ragAnalyticsRollup',
    path:    '/v1/jobs/wix/runWeeklyRagAnalyticsRollup',
    // Monday 05:00 UTC (after fmcsa-roster-sync)
    matches: (d) => d.getUTCDay() === 1 && d.getUTCHours() === 5,
  },
  {
    name:    'wix:anomalyDetection',
    path:    '/v1/jobs/wix/runAnomalyDetection',
    // Every hour (was every 5 min in Wix — acceptable for admin-facing)
    hourly:  true,
    matches: () => true,
  },
];

// In-memory last-run tracker: { 'job-name': 'YYYY-MM-DD' }
const lastRun = {};

function todayUTC(d) {
  return d.toISOString().split('T')[0];
}

// For hourly jobs, key by YYYY-MM-DDTHH so they fire once per hour not once per day
function runKey(job, d) {
  return job.hourly
    ? d.toISOString().slice(0, 13)   // "2026-02-27T04"
    : todayUTC(d);                   // "2026-02-27"
}

async function fireJob(job, port) {
  const url = `http://localhost:${port}${job.path}`;
  console.log(`[scheduler] Firing ${job.name} → ${url}`);

  try {
    const res = await fetch(url, {
      method:  'POST',
      headers: {
        'x-lmdr-internal-key': INTERNAL_KEY,
        'x-lmdr-timestamp':    Date.now().toString(),
        'Content-Type':        'application/json',
      },
    });

    const body = await res.json();
    console.log(`[scheduler] ${job.name} completed — status ${res.status}:`, JSON.stringify(body));
  } catch (err) {
    console.error(`[scheduler] ${job.name} failed:`, err.message);
  }
}

function tick(port) {
  const now   = new Date();
  const today = todayUTC(now);

  for (const job of SCHEDULES) {
    if (!job.matches(now)) continue;
    const key = runKey(job, now);
    if (lastRun[job.name] === key) {
      console.log(`[scheduler] ${job.name} already ran this window (${key}), skipping`);
      continue;
    }

    lastRun[job.name] = key;
    fireJob(job, port); // intentionally not awaited — runs in background
  }
}

/**
 * Start the scheduler. Call once after the HTTP server is listening.
 * @param {number} port — the port the Hono server is bound to
 */
export function startScheduler(port) {
  if (!INTERNAL_KEY) {
    console.warn('[scheduler] LMDR_INTERNAL_KEY not set — scheduler disabled');
    return;
  }

  console.log('[scheduler] Started — checking every hour');
  console.log('[scheduler] Schedules:');
  console.log('  fmcsa-mass-embed  → Daily 01:00 UTC (300 Airtable carriers/run → Pinecone backfill)');
  console.log('  fmcsa-sync        → Mon 02:00 UTC (weekly)');
  console.log('  eia-fuel          → Mon 03:00 UTC (weekly)');
  console.log('  market-signals    → Mon 04:00 UTC (weekly, after eia-fuel)');
  console.log('  freight-signals   → 1st 04:00 UTC (monthly)');
  console.log('  fmcsa-roster-sync → 1st 05:00 UTC (monthly)');

  // Run an immediate tick on startup in case server restarted mid-window
  tick(port);

  // Then every hour on the hour (±a few ms)
  const msUntilNextHour = (60 - new Date().getUTCMinutes()) * 60_000 - new Date().getUTCSeconds() * 1_000;
  setTimeout(() => {
    tick(port);
    setInterval(() => tick(port), 60 * 60 * 1_000);
  }, msUntilNextHour);
}
