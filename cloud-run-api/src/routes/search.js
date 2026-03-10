import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

/**
 * Parse and clamp pagination params from query string.
 */
function parsePagination(qs) {
  const limit = Math.min(Math.max(parseInt(qs.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(parseInt(qs.offset) || 0, 0);
  return { limit, offset };
}

/**
 * Parse a "lat,lng" location string. Returns { lat, lng } or null.
 */
function parseLocation(locationStr) {
  if (!locationStr) return null;
  const parts = locationStr.split(',');
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

// ─── GET /v1/search/drivers ──────────────────────────────────────────────────
// Query params: q, cdlClass, minExperience, limit, offset
router.get('/drivers', async (req, res) => {
  const { q, cdlClass, minExperience } = req.query;
  const { limit, offset } = parsePagination(req.query);

  const conditions = [];
  const params = [];

  // Full-text search
  let tsQuery = null;
  if (q && q.trim()) {
    params.push(q.trim());
    tsQuery = `plainto_tsquery('english', $${params.length})`;
    conditions.push(`search_vector @@ ${tsQuery}`);
  }

  // CDL class filter
  if (cdlClass) {
    params.push(cdlClass.toUpperCase());
    conditions.push(`data->>'cdl_class' = $${params.length}`);
  }

  // Minimum experience filter
  if (minExperience !== undefined) {
    const minExp = parseFloat(minExperience);
    if (!isNaN(minExp)) {
      params.push(minExp);
      conditions.push(`(data->>'years_experience')::numeric >= $${params.length}`);
    }
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const orderClause = tsQuery
    ? `ORDER BY ts_rank(search_vector, ${tsQuery}) DESC`
    : `ORDER BY _created_at DESC`;

  // Count query (no ORDER / pagination)
  const countSql = `
    SELECT COUNT(*) AS total
    FROM airtable_driver_profiles
    ${whereClause}
  `;

  // Data query
  params.push(limit);
  const limitParam = params.length;
  params.push(offset);
  const offsetParam = params.length;

  const dataSql = `
    SELECT _id, _created_at, data
    FROM airtable_driver_profiles
    ${whereClause}
    ${orderClause}
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;

  try {
    const [dataResult, countResult] = await Promise.all([
      query(dataSql, params),
      query(countSql, params.slice(0, params.length - 2)),
    ]);

    const totalCount = Number(countResult.rows[0].total);
    const items = dataResult.rows.map((row) => ({
      _id: row._id,
      ...row.data,
      _createdAt: row._created_at,
    }));

    res.json({
      items,
      totalCount,
      hasMore: offset + items.length < totalCount,
    });
  } catch (err) {
    console.error('[search/drivers]', err.message);
    res.status(500).json({ error: 'Driver search failed', detail: err.message });
  }
});

// ─── GET /v1/search/carriers ─────────────────────────────────────────────────
// Query params: q, location (lat,lng), radius (miles), limit, offset
router.get('/carriers', async (req, res) => {
  const { q, location, radius } = req.query;
  const { limit, offset } = parsePagination(req.query);

  const conditions = [];
  const params = [];

  // Full-text search
  let tsQuery = null;
  if (q && q.trim()) {
    params.push(q.trim());
    tsQuery = `plainto_tsquery('english', $${params.length})`;
    conditions.push(`search_vector @@ ${tsQuery}`);
  }

  // Geo-radius filter
  const geo = parseLocation(location);
  if (geo) {
    const radiusMiles = parseFloat(radius) || 100;
    const radiusMeters = radiusMiles * 1609.34;
    params.push(geo.lng);
    const lngParam = params.length;
    params.push(geo.lat);
    const latParam = params.length;
    params.push(radiusMeters);
    const radiusParam = params.length;
    conditions.push(
      `ST_DWithin(location, ST_SetSRID(ST_MakePoint($${lngParam}, $${latParam}), 4326)::geography, $${radiusParam})`
    );
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const orderClause = tsQuery
    ? `ORDER BY ts_rank(search_vector, ${tsQuery}) DESC`
    : `ORDER BY company_name ASC`;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM carriers
    ${whereClause}
  `;

  params.push(limit);
  const limitParam = params.length;
  params.push(offset);
  const offsetParam = params.length;

  const dataSql = `
    SELECT
      _id, company_name, state, city, freight_type,
      pay_per_mile, pay_per_mile_max, dot_number,
      num_trucks, num_drivers, home_time,
      sign_on_bonus, combined_score, safety_score,
      "_createdDate"
    FROM carriers
    ${whereClause}
    ${orderClause}
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;

  try {
    const [dataResult, countResult] = await Promise.all([
      query(dataSql, params),
      query(countSql, params.slice(0, params.length - 2)),
    ]);

    const totalCount = Number(countResult.rows[0].total);
    const items = dataResult.rows.map((row) => ({
      _id: row._id,
      company_name: row.company_name,
      state: row.state,
      city: row.city,
      freight_type: row.freight_type,
      pay_per_mile: row.pay_per_mile,
      pay_per_mile_max: row.pay_per_mile_max,
      dot_number: row.dot_number,
      num_trucks: row.num_trucks,
      num_drivers: row.num_drivers,
      home_time: row.home_time,
      sign_on_bonus: row.sign_on_bonus,
      combined_score: row.combined_score,
      safety_score: row.safety_score,
      _createdAt: row._createdDate || row._createddate,
    }));

    res.json({
      items,
      totalCount,
      hasMore: offset + items.length < totalCount,
    });
  } catch (err) {
    console.error('[search/carriers]', err.message);
    res.status(500).json({ error: 'Carrier search failed', detail: err.message });
  }
});

// ─── GET /v1/search/suggest ──────────────────────────────────────────────────
// Query params: q, type (carrier|driver), limit
router.get('/suggest', async (req, res) => {
  const { q, type = 'carrier' } = req.query;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  const qTrimmed = q.trim();

  try {
    let result;

    if (type === 'driver') {
      result = await query(
        `SELECT
           _id,
           data->>'first_name' AS first_name,
           data->>'last_name'  AS last_name,
           GREATEST(
             similarity(data->>'first_name', $1),
             similarity(data->>'last_name',  $1)
           ) AS sim
         FROM airtable_driver_profiles
         WHERE
           data->>'first_name' % $1
           OR data->>'last_name' % $1
         ORDER BY sim DESC
         LIMIT $2`,
        [qTrimmed, limit]
      );

      const suggestions = result.rows.map((row) => ({
        _id: row._id,
        name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
        sim: parseFloat(parseFloat(row.sim).toFixed(4)),
      }));

      return res.json({ suggestions });
    }

    // Default: carrier
    result = await query(
      `SELECT
         _id,
         company_name,
         similarity(company_name, $1) AS sim
       FROM carriers
       WHERE company_name % $1
       ORDER BY sim DESC
       LIMIT $2`,
      [qTrimmed, limit]
    );

    const suggestions = result.rows.map((row) => ({
      _id: row._id,
      name: row.company_name,
      sim: parseFloat(parseFloat(row.sim).toFixed(4)),
    }));

    res.json({ suggestions });
  } catch (err) {
    console.error('[search/suggest]', err.message);
    res.status(500).json({ error: 'Suggest failed', detail: err.message });
  }
});

export default router;
