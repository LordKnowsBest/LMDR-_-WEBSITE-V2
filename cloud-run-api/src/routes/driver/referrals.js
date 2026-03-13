import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { insertLog, insertAuditEvent } from '../../db/bigquery.js';
import { v4 as uuidv4 } from 'uuid';

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
  console.error(`[driver/referrals] ${context}:`, err.message);
  insertLog({ service: 'driver', level: 'ERROR', message: `referrals/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── POST /:id/submit ── Submit a referral
router.post('/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, cdlClass, notes } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'name and phone are required' });

    const table = getTableName('driverReferrals');
    const referralId = uuidv4();
    const now = new Date().toISOString();

    await safeQuery(
      `INSERT INTO "${table}" (_id, _created_at, _updated_at, data) VALUES ($1, $2, $2, $3)`,
      [referralId, now, JSON.stringify({
        referrer_id: id,
        referred_name: name,
        referred_phone: phone,
        referred_email: email || null,
        cdl_class: cdlClass || null,
        notes: notes || null,
        status: 'invited',
        submitted_at: now,
      })]
    );

    insertAuditEvent({ actor: id, action: 'referral_submitted', target: referralId, data: { referred_name: name } });

    return res.status(201).json({ referralId, status: 'invited' });
  } catch (err) { return handleError(res, 'submit-referral', err); }
});

// ── GET /:id ── List driver's referrals
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const table = getTableName('driverReferrals');
    const result = await safeQuery(
      `SELECT * FROM "${table}" WHERE data->>'referrer_id' = $1 ORDER BY _created_at DESC`,
      [id]
    );
    return res.json({ referrals: formatRecords(result.rows) });
  } catch (err) { return handleError(res, 'list-referrals', err); }
});

// ── GET /:id/:refId ── Get referral detail
router.get('/:id/:refId', async (req, res) => {
  try {
    const { id, refId } = req.params;
    const table = getTableName('driverReferrals');
    const result = await safeQuery(
      `SELECT * FROM "${table}" WHERE _id = $1 AND data->>'referrer_id' = $2`,
      [refId, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'REFERRAL_NOT_FOUND' });
    return res.json({ referral: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'get-referral', err); }
});

export default router;
