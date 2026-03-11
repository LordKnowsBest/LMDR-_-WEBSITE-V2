import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { insertLog } from '../../db/bigquery.js';

const router = Router();

// ── Helpers ──

function formatRecord(row) {
  if (!row) return null;
  const { _id, airtable_id, _created_at, _updated_at, data } = row;
  return { _id, airtable_id, _createdAt: _created_at, _updatedAt: _updated_at, ...data };
}

/** Query that returns empty rows if table doesn't exist yet */
async function safeQuery(sql, params) {
  try {
    return await query(sql, params);
  } catch (err) {
    if (err.message?.includes('does not exist')) {
      return { rows: [{ total: 0, count: 0, active: 0, pending: 0, flagged: 0 }] };
    }
    throw err;
  }
}

// 5-minute in-memory cache
let dashCache = null;
let dashCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

function handleError(res, context, err) {
  console.error(`[admin/dashboard] ${context}:`, err.message);
  insertLog({ service: 'admin', level: 'ERROR', message: `dashboard/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── GET /dashboard/overview ──
router.get('/overview', async (req, res) => {
  try {
    const now = Date.now();
    if (dashCache && (now - dashCacheTime) < CACHE_TTL) {
      return res.json(dashCache);
    }

    const driversTable = getTableName('driverProfiles');
    const carriersTable = getTableName('carriers');
    const matchesTable = getTableName('matchEvents');
    const enrichTable = getTableName('carrierEnrichments');
    const auditTable = getTableName('auditLog');
    const alertsTable = getTableName('systemAlerts');

    const [drivers, carriers, matches, enrichments, activity, alerts] = await Promise.all([
      safeQuery(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE data->>'status' = 'active') AS active,
        COUNT(*) FILTER (WHERE data->>'verification_status' = 'pending') AS pending
        FROM "${driversTable}"`),
      safeQuery(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE data->>'status' = 'active') AS active,
        COUNT(*) FILTER (WHERE data->>'flagged' = 'true') AS flagged
        FROM "${carriersTable}"`),
      safeQuery(`SELECT COUNT(*) AS total FROM "${matchesTable}"
        WHERE _created_at >= NOW() - INTERVAL '7 days'`),
      safeQuery(`SELECT COUNT(*) AS total FROM "${enrichTable}"`),
      safeQuery(`SELECT _id, data, _created_at FROM "${auditTable}"
        ORDER BY _created_at DESC LIMIT 10`),
      safeQuery(`SELECT COUNT(*) AS total FROM "${alertsTable}"
        WHERE data->>'status' != 'resolved'`),
    ]);

    const d = drivers.rows[0];
    const c = carriers.rows[0];
    const carrierTotal = parseInt(c.total, 10) || 1;
    const enrichTotal = parseInt(enrichments.rows[0]?.total, 10) || 0;

    const overview = {
      drivers: {
        total: parseInt(d.total, 10),
        active: parseInt(d.active, 10),
        pending: parseInt(d.pending, 10),
        activePct: Math.round((parseInt(d.active, 10) / Math.max(parseInt(d.total, 10), 1)) * 100),
      },
      carriers: {
        total: parseInt(c.total, 10),
        active: parseInt(c.active, 10),
        flagged: parseInt(c.flagged, 10),
      },
      matchesThisWeek: parseInt(matches.rows[0]?.total, 10),
      enrichmentCoverage: Math.round((enrichTotal / carrierTotal) * 100),
      unresolvedAlerts: parseInt(alerts.rows[0]?.total, 10),
      recentActivity: activity.rows.map(formatRecord),
    };

    dashCache = overview;
    dashCacheTime = now;

    return res.json(overview);
  } catch (err) {
    return handleError(res, 'overview', err);
  }
});

// ── GET /dashboard/quick-stats ──
router.get('/quick-stats', async (req, res) => {
  try {
    const driversTable = getTableName('driverProfiles');
    const carriersTable = getTableName('carriers');

    const [drivers, carriers] = await Promise.all([
      query(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE data->>'verification_status' = 'pending') AS pending,
        COUNT(*) FILTER (WHERE data->>'flagged' = 'true') AS flagged
        FROM "${driversTable}"`),
      query(`SELECT COUNT(*) AS total FROM "${carriersTable}"`),
    ]);

    const d = drivers.rows[0];
    return res.json({
      totalDrivers: parseInt(d.total, 10),
      totalCarriers: parseInt(carriers.rows[0]?.total, 10),
      pendingReview: parseInt(d.pending, 10),
      flaggedDrivers: parseInt(d.flagged, 10),
    });
  } catch (err) {
    return handleError(res, 'quick-stats', err);
  }
});

// ── GET /dashboard/ai-usage?period=7d ──
router.get('/ai-usage', async (req, res) => {
  try {
    const period = req.query.period || '7d';
    const days = parseInt(period) || 7;
    const aiTable = getTableName('aiUsageLog');

    const result = await query(
      `SELECT
        data->>'provider' AS provider,
        COUNT(*) AS calls,
        SUM((data->>'input_tokens')::numeric) AS input_tokens,
        SUM((data->>'output_tokens')::numeric) AS output_tokens,
        ROUND(AVG((data->>'latency_ms')::numeric)) AS avg_latency,
        SUM((data->>'cost_usd')::numeric) AS total_cost
      FROM "${aiTable}"
      WHERE _created_at >= NOW() - make_interval(days => $1)
      GROUP BY data->>'provider'
      ORDER BY total_cost DESC`,
      [days]
    );

    return res.json({
      period: `${days}d`,
      providers: result.rows.map(r => ({
        provider: r.provider,
        calls: parseInt(r.calls, 10),
        inputTokens: parseInt(r.input_tokens, 10) || 0,
        outputTokens: parseInt(r.output_tokens, 10) || 0,
        avgLatencyMs: parseInt(r.avg_latency, 10) || 0,
        totalCostUsd: parseFloat(r.total_cost) || 0,
      })),
    });
  } catch (err) {
    return handleError(res, 'ai-usage', err);
  }
});

export default router;
