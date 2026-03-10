import { Router } from 'express';
import { query } from '../db/pool.js';
import { insertLog } from '../db/bigquery.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Job auth middleware — only service-to-service (internal key) or admin role
// ─────────────────────────────────────────────────────────────────────────────

function requireJobAuth() {
  return (req, res, next) => {
    const auth = req.auth;
    if (!auth) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const isService = auth.type === 'internal' || auth.role === 'service';
    const isAdmin = auth.role === 'admin';
    if (!isService && !isAdmin) {
      return res.status(403).json({ error: 'Service or admin role required for job endpoints' });
    }
    next();
  };
}

router.use(requireJobAuth());

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function durationMs(startTime) {
  return Date.now() - startTime;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/jobs/compliance-refresh
// Query driver profiles for docs expiring within 30 days, log count to BigQuery
// ─────────────────────────────────────────────────────────────────────────────

router.post('/compliance-refresh', async (req, res) => {
  const startTime = Date.now();
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 30);

    const result = await query(
      `SELECT COUNT(*) AS cnt
       FROM airtable_driver_profiles
       WHERE (data->>'cdl_expiry')::date <= $1
         AND data->>'status' != 'inactive'`,
      [cutoff.toISOString().slice(0, 10)]
    );

    const processed = parseInt(result.rows[0]?.cnt ?? 0, 10);
    const duration_ms = durationMs(startTime);

    insertLog({
      service: 'jobs',
      message: 'compliance-refresh completed',
      data: { processed, expiry_cutoff: cutoff.toISOString().slice(0, 10) },
      duration_ms,
    });

    return res.json({ processed, duration_ms });
  } catch (err) {
    console.error('[jobs] compliance-refresh error:', err.message);
    insertLog({
      service: 'jobs',
      level: 'ERROR',
      message: 'compliance-refresh failed',
      data: { error: err.message },
      duration_ms: durationMs(startTime),
      is_error: true,
    });
    return res.status(500).json({ error: 'compliance-refresh failed', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/jobs/board-refresh
// Count active carriers, log to BigQuery
// ─────────────────────────────────────────────────────────────────────────────

router.post('/board-refresh', async (req, res) => {
  const startTime = Date.now();
  try {
    const result = await query(
      `SELECT COUNT(*) AS cnt
       FROM carriers
       WHERE is_active = true`
    );

    const processed = parseInt(result.rows[0]?.cnt ?? 0, 10);
    const duration_ms = durationMs(startTime);

    insertLog({
      service: 'jobs',
      message: 'board-refresh completed',
      data: { active_carriers: processed },
      duration_ms,
    });

    return res.json({ processed, duration_ms });
  } catch (err) {
    console.error('[jobs] board-refresh error:', err.message);
    insertLog({
      service: 'jobs',
      level: 'ERROR',
      message: 'board-refresh failed',
      data: { error: err.message },
      duration_ms: durationMs(startTime),
      is_error: true,
    });
    return res.status(500).json({ error: 'board-refresh failed', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/jobs/rtdb-cleanup
// Placeholder — cleans up stale real-time DB entries (implementation TBD)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/rtdb-cleanup', async (req, res) => {
  const startTime = Date.now();
  const duration_ms = durationMs(startTime);

  insertLog({
    service: 'jobs',
    message: 'rtdb-cleanup completed (placeholder)',
    data: { note: 'RTDB cleanup not yet implemented — wired for future use' },
    duration_ms,
  });

  return res.json({ processed: 0, duration_ms });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/jobs/weekly-earnings-digest
// Query active driver profiles, log queued count to BigQuery
// ─────────────────────────────────────────────────────────────────────────────

router.post('/weekly-earnings-digest', async (req, res) => {
  const startTime = Date.now();
  try {
    const result = await query(
      `SELECT COUNT(*) AS cnt
       FROM airtable_driver_profiles
       WHERE data->>'status' = 'active'`
    );

    const queued = parseInt(result.rows[0]?.cnt ?? 0, 10);
    const duration_ms = durationMs(startTime);

    insertLog({
      service: 'jobs',
      message: 'weekly-earnings-digest completed',
      data: { queued },
      duration_ms,
    });

    return res.json({ queued, duration_ms });
  } catch (err) {
    console.error('[jobs] weekly-earnings-digest error:', err.message);
    insertLog({
      service: 'jobs',
      level: 'ERROR',
      message: 'weekly-earnings-digest failed',
      data: { error: err.message },
      duration_ms: durationMs(startTime),
      is_error: true,
    });
    return res.status(500).json({ error: 'weekly-earnings-digest failed', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/jobs/monthly-invoices
// Query carriers with active subscriptions, log count to BigQuery
// ─────────────────────────────────────────────────────────────────────────────

router.post('/monthly-invoices', async (req, res) => {
  const startTime = Date.now();
  try {
    const result = await query(
      `SELECT COUNT(*) AS cnt
       FROM carriers
       WHERE subscription_tier IS NOT NULL
         AND subscription_tier != 'none'
         AND is_active = true`
    );

    const processed = parseInt(result.rows[0]?.cnt ?? 0, 10);
    const duration_ms = durationMs(startTime);

    insertLog({
      service: 'jobs',
      message: 'monthly-invoices completed',
      data: { carriers_with_active_subscriptions: processed },
      duration_ms,
    });

    return res.json({ processed, duration_ms });
  } catch (err) {
    console.error('[jobs] monthly-invoices error:', err.message);
    insertLog({
      service: 'jobs',
      level: 'ERROR',
      message: 'monthly-invoices failed',
      data: { error: err.message },
      duration_ms: durationMs(startTime),
      is_error: true,
    });
    return res.status(500).json({ error: 'monthly-invoices failed', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/jobs/rag-refresh
// Placeholder — refresh RAG / AI vector index (wire to AI service later)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/rag-refresh', async (req, res) => {
  const startTime = Date.now();
  const duration_ms = durationMs(startTime);

  insertLog({
    service: 'jobs',
    message: 'rag-refresh completed (placeholder)',
    data: { note: 'RAG refresh not yet wired to AI service' },
    duration_ms,
  });

  return res.json({ processed: 0, duration_ms });
});

export default router;
