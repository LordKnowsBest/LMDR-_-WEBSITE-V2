import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { buildSelectQuery, buildCountQuery } from '../../db/query.js';
import { insertLog, insertAuditEvent } from '../../db/bigquery.js';
import { v4 as uuidv4 } from 'uuid';
import { triggerXP } from '../../lib/xp-trigger.js';

const router = Router();

function formatRecord(row) {
  if (!row) return null;
  const { _id, airtable_id, _created_at, _updated_at, data } = row;
  return { _id, airtable_id, _createdAt: _created_at, _updatedAt: _updated_at, ...data };
}

function formatRecords(rows) { return (rows || []).map(formatRecord); }

async function safeQuery(sql, params) {
  try { return await query(sql, params); }
  catch (err) { if (err.message?.includes('does not exist')) return { rows: [] }; throw err; }
}

function handleError(res, context, err) {
  console.error(`[driver/profile] ${context}:`, err.message);
  insertLog({ service: 'driver', level: 'ERROR', message: `profile/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── Profile completeness calculation ──
function computeCompleteness(data) {
  let score = 0;
  // Base (20%): name, email, phone
  if (data.first_name || data.firstName) score += 7;
  if (data.email) score += 7;
  if (data.phone) score += 6;
  // Experience (30%): CDL class, years, endorsements
  if (data.cdl_class || data.cdlClass) score += 10;
  if (data.years_experience || data.yearsExperience) score += 10;
  if (data.endorsements) score += 10;
  // Documents (30%): at least 3 docs uploaded
  const docCount = parseInt(data.documents_uploaded || data.doc_count) || 0;
  score += Math.min(docCount * 10, 30);
  // Preferences (20%): truck type, route pref, min pay, location
  if (data.preferred_truck || data.preferredTruck) score += 5;
  if (data.preferred_route || data.preferredRoute) score += 5;
  if (data.min_cpm || data.minCpm || data.minimum_pay) score += 5;
  if (data.home_zip || data.homeZip) score += 5;
  return Math.min(score, 100);
}

// ── POST /profile ──
router.post('/', async (req, res) => {
  try {
    const { sessionId, email, userId } = req.body;
    const table = getTableName('driverProfiles');
    const lookupField = userId || sessionId || email;

    if (lookupField) {
      const existing = await safeQuery(
        `SELECT * FROM "${table}" WHERE data->>'user_id' = $1 OR data->>'email' = $1 LIMIT 1`,
        [lookupField]
      );
      if (existing.rows.length > 0) {
        return res.json({ success: true, profile: formatRecord(existing.rows[0]), isNew: false });
      }
    }

    const id = uuidv4();
    const data = { user_id: userId || sessionId, email: email || '', status: 'incomplete', completeness_score: 0, created_at: new Date().toISOString() };
    await query(
      `INSERT INTO "${table}" (_id, airtable_id, _created_at, _updated_at, data) VALUES ($1, $1, NOW(), NOW(), $2)`,
      [id, JSON.stringify(data)]
    );
    insertAuditEvent({ actor_id: req.auth?.uid, action: 'DRIVER_PROFILE_CREATED', resource_type: 'driver', resource_id: id });
    return res.status(201).json({ success: true, profile: { _id: id, ...data }, isNew: true });
  } catch (err) { return handleError(res, 'create-profile', err); }
});

// ── GET /profile/:id ──
router.get('/:id', async (req, res) => {
  try {
    const table = getTableName('driverProfiles');
    const result = await safeQuery(`SELECT * FROM "${table}" WHERE _id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'DRIVER_NOT_FOUND', message: `No driver with id ${req.params.id}` });
    const profile = formatRecord(result.rows[0]);
    profile.completeness_score = computeCompleteness(profile);
    return res.json(profile);
  } catch (err) { return handleError(res, 'get-profile', err); }
});

// ── PUT /profile/:id ──
router.put('/:id', async (req, res) => {
  try {
    const table = getTableName('driverProfiles');
    const ALLOWED = ['first_name', 'last_name', 'email', 'phone', 'cdl_class', 'cdl_state', 'endorsements', 'years_experience', 'preferred_truck', 'preferred_route', 'min_cpm', 'home_city', 'home_state', 'home_zip'];
    const updates = {};
    for (const key of ALLOWED) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.id, JSON.stringify(updates)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'DRIVER_NOT_FOUND' });
    const profile = formatRecord(result.rows[0]);
    profile.completeness_score = computeCompleteness(profile);

    insertAuditEvent({ actor_id: req.auth?.uid, action: 'DRIVER_PROFILE_UPDATED', resource_type: 'driver', resource_id: req.params.id, after_state: updates });

    // Fire-and-forget XP award for profile update
    triggerXP(req.params.id, 'update_profile').catch(() => {});

    return res.json({ success: true, profile });
  } catch (err) { return handleError(res, 'update-profile', err); }
});

// ── GET /profile/:id/strength ──
router.get('/:id/strength', async (req, res) => {
  try {
    const table = getTableName('driverProfiles');
    const result = await safeQuery(`SELECT * FROM "${table}" WHERE _id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'DRIVER_NOT_FOUND' });
    const data = result.rows[0].data || {};
    const score = computeCompleteness(data);
    const missing = [];
    if (!data.first_name && !data.firstName) missing.push('first_name');
    if (!data.phone) missing.push('phone');
    if (!data.cdl_class && !data.cdlClass) missing.push('cdl_class');
    if (!data.endorsements) missing.push('endorsements');
    if (!data.preferred_route && !data.preferredRoute) missing.push('preferred_route');
    if (!data.home_zip && !data.homeZip) missing.push('home_zip');
    return res.json({ score, missingFields: missing });
  } catch (err) { return handleError(res, 'profile-strength', err); }
});

// ── PUT /profile/:id/visibility ──
router.put('/:id/visibility', async (req, res) => {
  try {
    const table = getTableName('driverProfiles');
    const { visible } = req.body;
    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.id, JSON.stringify({ is_discoverable: visible ? 'Yes' : 'No' })]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'DRIVER_NOT_FOUND' });
    insertAuditEvent({ actor_id: req.auth?.uid, action: 'DRIVER_VISIBILITY_CHANGED', resource_type: 'driver', resource_id: req.params.id, after_state: { visible } });
    return res.json({ success: true, visible });
  } catch (err) { return handleError(res, 'set-visibility', err); }
});

// ── POST /profile/:id/interest ──
router.post('/:id/interest', async (req, res) => {
  try {
    const table = getTableName('driverCarrierInterests');
    const { carrierDot, matchScore, status } = req.body;
    const id = uuidv4();
    const data = { driver_id: req.params.id, carrier_dot: carrierDot, match_score: matchScore || 0, status: status || 'interested', created_at: new Date().toISOString() };
    await query(
      `INSERT INTO "${table}" (_id, airtable_id, _created_at, _updated_at, data) VALUES ($1, $1, NOW(), NOW(), $2)`,
      [id, JSON.stringify(data)]
    );
    return res.status(201).json({ success: true, interest: { _id: id, ...data }, isNew: true });
  } catch (err) { return handleError(res, 'log-interest', err); }
});

// ── GET /profile/:id/interests ──
router.get('/:id/interests', async (req, res) => {
  try {
    const table = getTableName('driverCarrierInterests');
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = parseInt(req.query.skip) || 0;
    const [data, count] = await Promise.all([
      safeQuery(`SELECT * FROM "${table}" WHERE data->>'driver_id' = $1 ORDER BY _created_at DESC LIMIT $2 OFFSET $3`, [req.params.id, limit, skip]),
      safeQuery(`SELECT COUNT(*) AS total FROM "${table}" WHERE data->>'driver_id' = $1`, [req.params.id]),
    ]);
    return res.json({ items: formatRecords(data.rows), totalCount: parseInt(count.rows[0]?.total) || 0 });
  } catch (err) { return handleError(res, 'get-interests', err); }
});

// ── DELETE /profile/:id/interest/:dot ──
router.delete('/:id/interest/:dot', async (req, res) => {
  try {
    const table = getTableName('driverCarrierInterests');
    await query(`DELETE FROM "${table}" WHERE data->>'driver_id' = $1 AND data->>'carrier_dot' = $2`, [req.params.id, req.params.dot]);
    return res.json({ success: true });
  } catch (err) { return handleError(res, 'remove-interest', err); }
});

// ── GET /profile/:id/interest-stats/:dot ──
router.get('/:id/interest-stats/:dot', async (req, res) => {
  try {
    const table = getTableName('driverCarrierInterests');
    const result = await safeQuery(
      `SELECT data->>'status' AS status, COUNT(*) AS count FROM "${table}" WHERE data->>'carrier_dot' = $1 GROUP BY data->>'status'`,
      [req.params.dot]
    );
    return res.json({ carrierDot: req.params.dot, stats: result.rows });
  } catch (err) { return handleError(res, 'interest-stats', err); }
});

// ── GET /profile/:id/activity ──
router.get('/:id/activity', async (req, res) => {
  try {
    const interestsTable = getTableName('driverCarrierInterests');
    const viewsTable = getTableName('carrierDriverViews');
    const matchesTable = getTableName('matchEvents');
    const [interests, views, matches] = await Promise.all([
      safeQuery(`SELECT COUNT(*) AS total FROM "${interestsTable}" WHERE data->>'driver_id' = $1`, [req.params.id]),
      safeQuery(`SELECT COUNT(*) AS total FROM "${viewsTable}" WHERE data->>'driver_id' = $1`, [req.params.id]),
      safeQuery(`SELECT COUNT(*) AS total FROM "${matchesTable}" WHERE data->>'driver_id' = $1`, [req.params.id]),
    ]);
    return res.json({
      applicationCount: parseInt(interests.rows[0]?.total) || 0,
      viewCount: parseInt(views.rows[0]?.total) || 0,
      matchCount: parseInt(matches.rows[0]?.total) || 0,
    });
  } catch (err) { return handleError(res, 'activity-stats', err); }
});

// ── GET /profile/:id/views ──
router.get('/:id/views', async (req, res) => {
  try {
    const table = getTableName('carrierDriverViews');
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const result = await safeQuery(
      `SELECT * FROM "${table}" WHERE data->>'driver_id' = $1 ORDER BY _created_at DESC LIMIT $2`,
      [req.params.id, limit]
    );
    return res.json({ views: formatRecords(result.rows), totalCount: result.rows.length });
  } catch (err) { return handleError(res, 'profile-views', err); }
});

// ── GET /profile/:id/suggestions ──
router.get('/:id/suggestions', async (req, res) => {
  try {
    const table = getTableName('driverProfiles');
    const result = await safeQuery(`SELECT * FROM "${table}" WHERE _id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'DRIVER_NOT_FOUND' });
    const data = result.rows[0].data || {};
    const suggestions = [];
    if (!data.endorsements) suggestions.push({ field: 'endorsements', action: 'Add your CDL endorsements (H, T, N, P, S, X)', impact: 'high', priority: 1 });
    if (!data.preferred_route && !data.preferredRoute) suggestions.push({ field: 'preferred_route', action: 'Set your preferred route type', impact: 'medium', priority: 2 });
    if (!data.home_zip && !data.homeZip) suggestions.push({ field: 'home_zip', action: 'Add your home ZIP for location-based matching', impact: 'high', priority: 1 });
    if (!data.min_cpm && !data.minimum_pay) suggestions.push({ field: 'min_cpm', action: 'Set your minimum pay per mile', impact: 'medium', priority: 2 });
    if (!data.years_experience && !data.yearsExperience) suggestions.push({ field: 'years_experience', action: 'Add your years of driving experience', impact: 'medium', priority: 3 });
    return res.json({ suggestions });
  } catch (err) { return handleError(res, 'suggestions', err); }
});

export default router;
