import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { insertLog } from '../../db/bigquery.js';
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
  console.error(`[driver/wellness] ${context}:`, err.message);
  insertLog({ service: 'driver', level: 'ERROR', message: `wellness/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

/** Haversine distance in miles between two lat/lng points */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── GET /health ── Get health resources (optional category filter)
router.get('/health', async (req, res) => {
  try {
    const table = getTableName('healthResources');
    const { category } = req.query;
    let sql, params;
    if (category) {
      sql = `SELECT * FROM "${table}" WHERE data->>'category' = $1 ORDER BY _created_at DESC LIMIT 20`;
      params = [category];
    } else {
      sql = `SELECT * FROM "${table}" ORDER BY _created_at DESC LIMIT 20`;
      params = [];
    }
    const result = await safeQuery(sql, params);
    return res.json({ items: formatRecords(result.rows), totalCount: result.rows.length });
  } catch (err) { return handleError(res, 'get-health-resources', err); }
});

// ── GET /health/tips ── Get approved community health tips
router.get('/health/tips', async (req, res) => {
  try {
    const table = getTableName('healthTips');
    const result = await safeQuery(
      `SELECT * FROM "${table}" WHERE data->>'status' = 'approved' ORDER BY _created_at DESC LIMIT 20`,
      []
    );
    return res.json({ items: formatRecords(result.rows), totalCount: result.rows.length });
  } catch (err) { return handleError(res, 'get-health-tips', err); }
});

// ── GET /health/:id ── Get single health resource
router.get('/health/:id', async (req, res) => {
  try {
    const table = getTableName('healthResources');
    const result = await safeQuery(`SELECT * FROM "${table}" WHERE _id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'RESOURCE_NOT_FOUND' });
    return res.json(formatRecord(result.rows[0]));
  } catch (err) { return handleError(res, 'get-health-resource', err); }
});

// ── POST /health/tips ── Submit a health tip
router.post('/health/tips', async (req, res) => {
  try {
    const table = getTableName('healthTips');
    const { driverId, category, title, content } = req.body;
    if (!driverId || !title || !content) {
      return res.status(400).json({ error: 'Missing required fields: driverId, title, content' });
    }
    const id = uuidv4();
    const now = new Date().toISOString();
    const data = { driver_id: driverId, category: category || 'general', title, content, status: 'pending' };
    await query(
      `INSERT INTO "${table}" (_id, _created_at, _updated_at, data) VALUES ($1, $2, $3, $4)`,
      [id, now, now, JSON.stringify(data)]
    );
    insertLog({ service: 'driver', level: 'INFO', message: 'wellness/health-tip submitted', data: { tipId: id, driverId } });
    return res.status(201).json({ _id: id, ...data });
  } catch (err) { return handleError(res, 'submit-health-tip', err); }
});

// ── GET /pets/nearby ── Search pet-friendly locations by proximity
router.get('/pets/nearby', async (req, res) => {
  try {
    const table = getTableName('petFriendlyLocations');
    const { lat, lng, radiusMiles = 50 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Missing required query params: lat, lng' });
    }
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radius = parseFloat(radiusMiles);

    const result = await safeQuery(`SELECT * FROM "${table}"`, []);
    const locations = result.rows
      .map(row => {
        const record = formatRecord(row);
        const locLat = parseFloat(record.lat);
        const locLng = parseFloat(record.lng);
        if (isNaN(locLat) || isNaN(locLng)) return null;
        const distance = haversineDistance(userLat, userLng, locLat, locLng);
        return { ...record, distance: Math.round(distance * 100) / 100 };
      })
      .filter(loc => loc && loc.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return res.json({ items: locations, totalCount: locations.length });
  } catch (err) { return handleError(res, 'pets-nearby', err); }
});

// ── GET /pets/:id ── Get pet-friendly location detail with reviews
router.get('/pets/:id', async (req, res) => {
  try {
    const locTable = getTableName('petFriendlyLocations');
    const revTable = getTableName('petFriendlyReviews');
    const [locResult, revResult] = await Promise.all([
      safeQuery(`SELECT * FROM "${locTable}" WHERE _id = $1`, [req.params.id]),
      safeQuery(`SELECT * FROM "${revTable}" WHERE data->>'location_id' = $1 ORDER BY _created_at DESC`, [req.params.id]),
    ]);
    if (locResult.rows.length === 0) return res.status(404).json({ error: 'LOCATION_NOT_FOUND' });
    const location = formatRecord(locResult.rows[0]);
    const reviews = formatRecords(revResult.rows);
    return res.json({ ...location, reviews });
  } catch (err) { return handleError(res, 'get-pet-location', err); }
});

// ── POST /pets ── Submit new pet-friendly location
router.post('/pets', async (req, res) => {
  try {
    const table = getTableName('petFriendlyLocations');
    const { name, lat, lng, address, amenities, driverId } = req.body;
    if (!name || !lat || !lng || !driverId) {
      return res.status(400).json({ error: 'Missing required fields: name, lat, lng, driverId' });
    }
    const id = uuidv4();
    const now = new Date().toISOString();
    const data = { name, lat: parseFloat(lat), lng: parseFloat(lng), address: address || '', amenities: amenities || [], submitted_by: driverId };
    await query(
      `INSERT INTO "${table}" (_id, _created_at, _updated_at, data) VALUES ($1, $2, $3, $4)`,
      [id, now, now, JSON.stringify(data)]
    );
    insertLog({ service: 'driver', level: 'INFO', message: 'wellness/pet-location submitted', data: { locationId: id, driverId } });
    return res.status(201).json({ _id: id, ...data });
  } catch (err) { return handleError(res, 'submit-pet-location', err); }
});

// ── POST /pets/:id/review ── Add review for a pet-friendly location
router.post('/pets/:id/review', async (req, res) => {
  try {
    const table = getTableName('petFriendlyReviews');
    const { driverId, rating, comment, hasDogPark, hasPetArea } = req.body;
    if (!driverId || rating == null) {
      return res.status(400).json({ error: 'Missing required fields: driverId, rating' });
    }
    const id = uuidv4();
    const now = new Date().toISOString();
    const data = {
      location_id: req.params.id,
      driver_id: driverId,
      rating: parseInt(rating),
      comment: comment || '',
      has_dog_park: !!hasDogPark,
      has_pet_area: !!hasPetArea,
    };
    await query(
      `INSERT INTO "${table}" (_id, _created_at, _updated_at, data) VALUES ($1, $2, $3, $4)`,
      [id, now, now, JSON.stringify(data)]
    );
    insertLog({ service: 'driver', level: 'INFO', message: 'wellness/pet-review submitted', data: { reviewId: id, locationId: req.params.id, driverId } });
    return res.status(201).json({ _id: id, ...data });
  } catch (err) { return handleError(res, 'submit-pet-review', err); }
});

// ── GET /mentors ── List available mentors
router.get('/mentors', async (req, res) => {
  try {
    const table = getTableName('mentorProfiles');
    const result = await safeQuery(
      `SELECT * FROM "${table}" WHERE data->>'status' = 'available' ORDER BY _created_at DESC LIMIT 20`,
      []
    );
    return res.json({ items: formatRecords(result.rows), totalCount: result.rows.length });
  } catch (err) { return handleError(res, 'get-mentors', err); }
});

// ── POST /mentors/request ── Request a mentor match
router.post('/mentors/request', async (req, res) => {
  try {
    const { driverId, mentorId, goals } = req.body;
    if (!driverId || !mentorId) {
      return res.status(400).json({ error: 'Missing required fields: driverId, mentorId' });
    }

    // Check mentor eligibility (5+ years experience)
    const mentorTable = getTableName('mentorProfiles');
    const mentorResult = await safeQuery(`SELECT * FROM "${mentorTable}" WHERE _id = $1`, [mentorId]);
    if (mentorResult.rows.length === 0) return res.status(404).json({ error: 'MENTOR_NOT_FOUND' });
    const mentor = mentorResult.rows[0].data || {};
    const yearsExp = parseFloat(mentor.years_experience) || 0;
    if (yearsExp < 5) {
      return res.status(400).json({ error: 'MENTOR_NOT_ELIGIBLE', message: 'Mentor must have 5+ years of experience' });
    }

    const table = getTableName('mentorMatches');
    const id = uuidv4();
    const now = new Date().toISOString();
    const data = { driver_id: driverId, mentor_id: mentorId, goals: goals || '', status: 'pending' };
    await query(
      `INSERT INTO "${table}" (_id, _created_at, _updated_at, data) VALUES ($1, $2, $3, $4)`,
      [id, now, now, JSON.stringify(data)]
    );
    insertLog({ service: 'driver', level: 'INFO', message: 'wellness/mentor-request created', data: { matchId: id, driverId, mentorId } });
    return res.status(201).json({ _id: id, ...data });
  } catch (err) { return handleError(res, 'request-mentor', err); }
});

export default router;
