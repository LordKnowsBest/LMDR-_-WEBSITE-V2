import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { insertLog, insertAuditEvent } from '../../db/bigquery.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const ALLOWED_DISPOSITIONS = [
  'actively_looking', 'passively_open', 'not_looking',
  'hired', 'active', 'dispatched',
];

function formatRecord(row) {
  if (!row) return null;
  const { _id, airtable_id, _created_at, _updated_at, data } = row;
  return { _id, airtable_id, _createdAt: _created_at, _updatedAt: _updated_at, ...data };
}

function formatRecords(rows) { return (rows || []).map(formatRecord); }

async function safeQuery(sql, params) {
  try { return await query(sql, params); }
  catch (err) { if (err.message?.includes('does not exist')) return { rows: [{ total: 0, count: 0 }] }; throw err; }
}

function handleError(res, context, err) {
  console.error(`[driver/lifecycle] ${context}:`, err.message);
  insertLog({ service: 'driver', level: 'ERROR', message: `lifecycle/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── GET /:id/timeline ──
// Returns lifecycle events for a driver, ordered by most recent first.
router.get('/:id/timeline', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const table = getTableName('lifecycleEvents');

    const result = await safeQuery(
      `SELECT * FROM "${table}"
       WHERE data->>'driver_id' = $1
       ORDER BY _created_at DESC
       LIMIT $2`,
      [req.params.id, limit]
    );

    return res.json({
      events: formatRecords(result.rows),
      count: result.rows.length,
    });
  } catch (err) {
    return handleError(res, 'timeline', err);
  }
});

// ── PUT /:id/disposition ──
// Update driver disposition and create a lifecycle event recording the change.
router.put('/:id/disposition', async (req, res) => {
  try {
    const { disposition } = req.body;
    if (!disposition) {
      return res.status(400).json({ error: 'disposition is required' });
    }
    if (!ALLOWED_DISPOSITIONS.includes(disposition)) {
      return res.status(400).json({
        error: `Invalid disposition. Allowed: ${ALLOWED_DISPOSITIONS.join(', ')}`,
      });
    }

    const profileTable = getTableName('driverProfiles');

    // Get current disposition
    const before = await safeQuery(
      `SELECT data FROM "${profileTable}" WHERE _id = $1`,
      [req.params.id]
    );
    if (!before.rows.length || !before.rows[0].data) {
      return res.status(404).json({ error: 'DRIVER_NOT_FOUND', message: `No driver with id ${req.params.id}` });
    }

    const oldDisposition = before.rows[0].data?.disposition || 'unknown';

    // Update driver profile
    const updated = await query(
      `UPDATE "${profileTable}" SET data = data || $2, _updated_at = NOW()
       WHERE _id = $1 RETURNING *`,
      [req.params.id, JSON.stringify({ disposition, disposition_changed_at: new Date().toISOString() })]
    );

    // Create lifecycle event
    const eventTable = getTableName('lifecycleEvents');
    const eventId = uuidv4();
    await query(
      `INSERT INTO "${eventTable}" (_id, _created_at, _updated_at, data)
       VALUES ($1, NOW(), NOW(), $2)`,
      [eventId, JSON.stringify({
        driver_id: req.params.id,
        event_type: 'disposition_change',
        old_value: oldDisposition,
        new_value: disposition,
        changed_at: new Date().toISOString(),
      })]
    );

    insertAuditEvent({
      actor_id: req.auth?.uid || 'system',
      actor_role: req.auth?.role || 'driver',
      action: 'DRIVER_DISPOSITION_CHANGED',
      resource_type: 'driver',
      resource_id: req.params.id,
      before_state: { disposition: oldDisposition },
      after_state: { disposition },
    });

    return res.json({ driver: formatRecord(updated.rows[0]) });
  } catch (err) {
    return handleError(res, 'disposition', err);
  }
});

// ── GET /:id/milestones ──
// Compute milestones from various tables: profile creation, first application,
// first match, first carrier view.
router.get('/:id/milestones', async (req, res) => {
  try {
    const profileTable = getTableName('driverProfiles');
    const interestsTable = getTableName('driverCarrierInterests');
    const matchTable = getTableName('matchEvents');
    const viewsTable = getTableName('carrierDriverViews');

    const [profile, firstApp, firstMatch, firstView] = await Promise.all([
      safeQuery(`SELECT _created_at FROM "${profileTable}" WHERE _id = $1`, [req.params.id]),
      safeQuery(
        `SELECT _created_at FROM "${interestsTable}" WHERE data->>'driver_id' = $1 ORDER BY _created_at ASC LIMIT 1`,
        [req.params.id]
      ),
      safeQuery(
        `SELECT _created_at FROM "${matchTable}" WHERE data->>'driver_id' = $1 ORDER BY _created_at ASC LIMIT 1`,
        [req.params.id]
      ),
      safeQuery(
        `SELECT _created_at FROM "${viewsTable}" WHERE data->>'driver_id' = $1 ORDER BY _created_at ASC LIMIT 1`,
        [req.params.id]
      ),
    ]);

    const milestones = [
      {
        milestone: 'first_profile_created',
        date: profile.rows[0]?._created_at || null,
        achieved: profile.rows.length > 0 && !!profile.rows[0]?._created_at,
      },
      {
        milestone: 'first_application',
        date: firstApp.rows[0]?._created_at || null,
        achieved: firstApp.rows.length > 0 && !!firstApp.rows[0]?._created_at,
      },
      {
        milestone: 'first_match',
        date: firstMatch.rows[0]?._created_at || null,
        achieved: firstMatch.rows.length > 0 && !!firstMatch.rows[0]?._created_at,
      },
      {
        milestone: 'first_view',
        date: firstView.rows[0]?._created_at || null,
        achieved: firstView.rows.length > 0 && !!firstView.rows[0]?._created_at,
      },
    ];

    return res.json({ milestones });
  } catch (err) {
    return handleError(res, 'milestones', err);
  }
});

// ── POST /:id/feedback ──
// Submit match feedback for a carrier.
router.post('/:id/feedback', async (req, res) => {
  try {
    const { carrierDot, rating, comment, wouldRecommend } = req.body;
    if (!carrierDot || rating == null) {
      return res.status(400).json({ error: 'carrierDot and rating are required' });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be a number between 1 and 5' });
    }

    const table = getTableName('driverMatchFeedback');
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO "${table}" (_id, _created_at, _updated_at, data)
       VALUES ($1, NOW(), NOW(), $2) RETURNING *`,
      [id, JSON.stringify({
        driver_id: req.params.id,
        carrier_dot: carrierDot,
        rating,
        comment: comment || '',
        would_recommend: wouldRecommend ?? null,
        submitted_at: now,
      })]
    );

    insertLog({
      service: 'driver',
      level: 'INFO',
      message: `Driver ${req.params.id} submitted feedback for carrier ${carrierDot}`,
      data: { driver_id: req.params.id, carrier_dot: carrierDot, rating },
    });

    return res.status(201).json({ feedback: formatRecord(result.rows[0]) });
  } catch (err) {
    return handleError(res, 'feedback', err);
  }
});

// ── GET /:id/stats ──
// Aggregate stats: applications, matches, views, days since registration, disposition.
router.get('/:id/stats', async (req, res) => {
  try {
    const profileTable = getTableName('driverProfiles');
    const interestsTable = getTableName('driverCarrierInterests');
    const matchTable = getTableName('matchEvents');
    const viewsTable = getTableName('carrierDriverViews');

    const [profile, apps, matches, views] = await Promise.all([
      safeQuery(`SELECT _created_at, data FROM "${profileTable}" WHERE _id = $1`, [req.params.id]),
      safeQuery(
        `SELECT COUNT(*)::int AS count FROM "${interestsTable}" WHERE data->>'driver_id' = $1`,
        [req.params.id]
      ),
      safeQuery(
        `SELECT COUNT(*)::int AS count FROM "${matchTable}" WHERE data->>'driver_id' = $1`,
        [req.params.id]
      ),
      safeQuery(
        `SELECT COUNT(*)::int AS count FROM "${viewsTable}" WHERE data->>'driver_id' = $1`,
        [req.params.id]
      ),
    ]);

    if (!profile.rows.length || !profile.rows[0].data) {
      return res.status(404).json({ error: 'DRIVER_NOT_FOUND', message: `No driver with id ${req.params.id}` });
    }

    const createdAt = profile.rows[0]._created_at;
    const daysSinceRegistration = createdAt
      ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return res.json({
      totalApplications: apps.rows[0]?.count ?? 0,
      totalMatches: matches.rows[0]?.count ?? 0,
      totalViews: views.rows[0]?.count ?? 0,
      daysSinceRegistration,
      disposition: profile.rows[0].data?.disposition || 'unknown',
    });
  } catch (err) {
    return handleError(res, 'stats', err);
  }
});

export default router;
