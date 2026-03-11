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

const DEFAULTS = {
  carrierWeights: { location: 25, pay: 20, operation: 15, turnover: 12, safety: 10, truckAge: 8, fleetSize: 5, qualityScore: 5 },
  driverWeights: { qualifications: 30, experience: 20, location: 20, availability: 15, salary: 10, engagement: 5 },
  system: { cacheTtl: 300, batchSize: 10, fmcsaRefreshDays: 30, rateLimit: 60, maintenanceMode: false },
  tiers: {
    free: { matchResults: 10, profileViews: 50 },
    pro: { matchResults: 100, profileViews: 500 },
    enterprise: { matchResults: -1, profileViews: -1 },
  },
};

async function getSetting(key) {
  const table = getTableName('platformSettings');
  const result = await safeQuery(`SELECT data FROM "${table}" WHERE data->>'setting_key' = $1 LIMIT 1`, [key]);
  if (result.rows.length === 0) return null;
  const val = result.rows[0].data?.value;
  return typeof val === 'string' ? JSON.parse(val) : val;
}

async function setSetting(key, value, actorId) {
  const table = getTableName('platformSettings');
  const existing = await safeQuery(`SELECT _id FROM "${table}" WHERE data->>'setting_key' = $1 LIMIT 1`, [key]);
  const serialized = JSON.stringify({ setting_key: key, value: JSON.stringify(value), updated_at: new Date().toISOString() });

  if (existing.rows.length > 0) {
    await query(`UPDATE "${table}" SET data = $2, _updated_at = NOW() WHERE _id = $1`, [existing.rows[0]._id, serialized]);
  } else {
    const id = `setting_${key}_${Date.now()}`;
    await query(`INSERT INTO "${table}" (_id, airtable_id, data, _created_at, _updated_at) VALUES ($1, $1, $2, NOW(), NOW())`, [id, serialized]);
  }

  insertAuditEvent({ actor_id: actorId, actor_role: 'admin', action: 'ADMIN_UPDATE_CONFIG', resource_type: 'config', resource_id: key, after_state: value });
}

function handleError(res, context, err) {
  console.error(`[admin/config] ${context}:`, err.message);
  insertLog({ service: 'admin', level: 'ERROR', message: `config/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

router.get('/matching-weights', async (req, res) => {
  try {
    const carrier = await getSetting('carrier_matching_weights') || DEFAULTS.carrierWeights;
    const driver = await getSetting('driver_matching_weights') || DEFAULTS.driverWeights;
    return res.json({ carrier, driver });
  } catch (err) { return handleError(res, 'get-weights', err); }
});

router.put('/matching-weights', async (req, res) => {
  try {
    const { carrier, driver } = req.body;
    if (carrier) await setSetting('carrier_matching_weights', carrier, req.auth.uid);
    if (driver) await setSetting('driver_matching_weights', driver, req.auth.uid);
    return res.json({ success: true });
  } catch (err) { return handleError(res, 'update-weights', err); }
});

router.get('/system', async (req, res) => {
  try {
    const settings = await getSetting('system_settings') || DEFAULTS.system;
    return res.json(settings);
  } catch (err) { return handleError(res, 'get-system', err); }
});

router.put('/system', async (req, res) => {
  try {
    await setSetting('system_settings', req.body, req.auth.uid);
    return res.json({ success: true });
  } catch (err) { return handleError(res, 'update-system', err); }
});

router.get('/tiers', async (req, res) => {
  try {
    const tiers = await getSetting('tier_limits') || DEFAULTS.tiers;
    return res.json(tiers);
  } catch (err) { return handleError(res, 'get-tiers', err); }
});

router.put('/tiers', async (req, res) => {
  try {
    await setSetting('tier_limits', req.body, req.auth.uid);
    return res.json({ success: true });
  } catch (err) { return handleError(res, 'update-tiers', err); }
});

export default router;
