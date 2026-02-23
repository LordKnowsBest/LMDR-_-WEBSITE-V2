/**
 * scheduler.js — Zero-dependency internal job scheduler.
 *
 * Polls every hour. When a job's schedule matches the current UTC time
 * it fires a POST to localhost so the job runs inside the same process.
 *
 * Schedules (all UTC):
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
  {
    name:    'fmcsa-sync',
    path:    '/v1/jobs/fmcsa-sync',
    // Every Monday (dayOfWeek === 1), hour 2
    matches: (d) => d.getUTCDay() === 1 && d.getUTCHours() === 2,
  },
  {
    name:    'eia-fuel',
    path:    '/v1/jobs/eia-fuel',
    // Every Monday (dayOfWeek === 1), hour 3
    matches: (d) => d.getUTCDay() === 1 && d.getUTCHours() === 3,
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
];

// In-memory last-run tracker: { 'job-name': 'YYYY-MM-DD' }
const lastRun = {};

function todayUTC(d) {
  return d.toISOString().split('T')[0];
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
    if (lastRun[job.name] === today) {
      console.log(`[scheduler] ${job.name} already ran today (${today}), skipping`);
      continue;
    }

    lastRun[job.name] = today;
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
  console.log('  fmcsa-sync        → Mon 02:00 UTC (weekly)');
  console.log('  eia-fuel          → Mon 03:00 UTC (weekly)');
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
