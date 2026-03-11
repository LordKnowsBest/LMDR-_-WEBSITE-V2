import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { insertLog, insertAuditEvent } from '../../db/bigquery.js';

const router = Router();

/** Query that returns empty rows if table doesn't exist yet */
async function safeQuery(sql, params) {
  try {
    return await query(sql, params);
  } catch (err) {
    if (err.message?.includes('does not exist')) {
      return { rows: [{ total: 0, count: 0 }] };
    }
    throw err;
  }
}

function formatRecord(row) {
  if (!row) return null;
  const { _id, airtable_id, _created_at, _updated_at, data } = row;
  return { _id, airtable_id, _createdAt: _created_at, _updatedAt: _updated_at, ...data };
}

function handleError(res, context, err) {
  console.error(`[admin/ai-router] ${context}:`, err.message);
  insertLog({ service: 'admin', level: 'ERROR', message: `ai-router/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

let configCache = null;
let configCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

router.get('/config', async (req, res) => {
  try {
    const now = Date.now();
    if (configCache && (now - configCacheTime) < CACHE_TTL) return res.json(configCache);

    const table = getTableName('aiRouterConfig');
    const result = await safeQuery(`SELECT * FROM "${table}" ORDER BY _created_at DESC LIMIT 50`);
    const config = { providers: result.rows.map(formatRecord) };
    configCache = config;
    configCacheTime = now;
    return res.json(config);
  } catch (err) { return handleError(res, 'get-config', err); }
});

router.put('/config', async (req, res) => {
  try {
    const table = getTableName('aiRouterConfig');
    const { providerId, ...updates } = req.body;
    if (!providerId) return res.status(400).json({ error: 'providerId required' });

    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [providerId, JSON.stringify(updates)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'PROVIDER_NOT_FOUND' });

    configCache = null; // bust cache
    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_UPDATE_AI_CONFIG', resource_type: 'ai_router', resource_id: providerId, after_state: updates });
    return res.json({ provider: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'update-config', err); }
});

router.post('/test', async (req, res) => {
  try {
    const { providerId, prompt = 'Health check test' } = req.body;
    if (!providerId) return res.status(400).json({ error: 'providerId required' });

    const start = Date.now();
    // Call lmdr-ai-service for actual provider test
    const aiServiceUrl = process.env.LMDR_AI_SERVICE_URL || 'https://lmdr-ai-service-140035137711.us-central1.run.app';
    const internalKey = process.env.LMDR_INTERNAL_KEY;

    const aiRes = await fetch(`${aiServiceUrl}/v1/health`, {
      headers: { 'Authorization': `Bearer ${internalKey}` },
    });
    const health = await aiRes.json();
    const latencyMs = Date.now() - start;

    return res.json({ providerId, status: health.status || 'ok', latencyMs, response: health });
  } catch (err) { return handleError(res, 'test-provider', err); }
});

router.get('/costs', async (req, res) => {
  try {
    const table = getTableName('aiUsageLog');
    const result = await safeQuery(
      `SELECT data->>'provider' AS provider,
        COUNT(*) AS calls,
        ROUND(AVG((data->>'latency_ms')::numeric)) AS avg_latency,
        SUM((data->>'cost_usd')::numeric) AS total_cost
      FROM "${table}"
      WHERE _created_at >= NOW() - INTERVAL '30 days'
      GROUP BY data->>'provider'
      ORDER BY total_cost DESC`
    );
    return res.json({
      providers: result.rows.map(r => ({
        provider: r.provider,
        calls: parseInt(r.calls, 10),
        avgLatencyMs: parseInt(r.avg_latency, 10) || 0,
        totalCostUsd: parseFloat(r.total_cost) || 0,
      })),
    });
  } catch (err) { return handleError(res, 'costs', err); }
});

router.get('/optimizer', async (req, res) => {
  try {
    const table = getTableName('platformSettings');
    const result = await safeQuery(`SELECT data FROM "${table}" WHERE data->>'setting_key' = 'cost_optimizer_config' LIMIT 1`);
    const config = result.rows[0]?.data?.value ? JSON.parse(result.rows[0].data.value) : { enabled: false, mode: 'balanced' };
    return res.json(config);
  } catch (err) { return handleError(res, 'get-optimizer', err); }
});

router.put('/optimizer', async (req, res) => {
  try {
    const table = getTableName('platformSettings');
    const existing = await safeQuery(`SELECT _id FROM "${table}" WHERE data->>'setting_key' = 'cost_optimizer_config' LIMIT 1`);
    const serialized = JSON.stringify({ setting_key: 'cost_optimizer_config', value: JSON.stringify(req.body), updated_at: new Date().toISOString() });

    if (existing.rows.length > 0) {
      await query(`UPDATE "${table}" SET data = $2, _updated_at = NOW() WHERE _id = $1`, [existing.rows[0]._id, serialized]);
    } else {
      const id = `setting_cost_optimizer_${Date.now()}`;
      await query(`INSERT INTO "${table}" (_id, airtable_id, data, _created_at, _updated_at) VALUES ($1, $1, $2, NOW(), NOW())`, [id, serialized]);
    }

    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_UPDATE_OPTIMIZER', resource_type: 'ai_router', after_state: req.body });
    return res.json({ success: true });
  } catch (err) { return handleError(res, 'update-optimizer', err); }
});

export default router;
