# Driver OS Backend Wiring — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create 12 Cloud Run driver route files + scoring lib + barrel/manifest + Next.js server actions that replace 16 Wix .jsw driver services with unified REST endpoints serving both the driver frontend and AI agent layer.

**Architecture:** Express route directory at `cloud-run-api/src/routes/driver/` mounted in `app.js` before the catch-all collection router. No auth gate — any authenticated user can access driver endpoints. Dual-layer engagement logging (implicit middleware + explicit events). Config-driven scoring weights from `matching_model_weights` table. Next.js server actions in `frontend/src/app/(driver)/actions/` call Cloud Run via `LMDR_INTERNAL_KEY`.

**Tech Stack:** Express 4, PostgreSQL (JSONB via `pg`), BigQuery streaming, supertest + Jest (ESM), Next.js 14 server actions, TypeScript (frontend)

**Design Doc:** `docs/plans/2026-03-11-driver-os-wiring-design.md`

---

## Reference Files (Read These First)

| File | Purpose |
|------|---------|
| `cloud-run-api/src/app.js` | Express app factory — mount new routes here |
| `cloud-run-api/src/routes/admin/dashboard.js` | Reference pattern for route files (safeQuery, formatRecord, handleError) |
| `cloud-run-api/src/routes/admin/index.js` | Reference barrel pattern (manifest, sub-router mounting) |
| `cloud-run-api/src/db/pool.js` | `query(sql, params)` — parameterized SQL execution |
| `cloud-run-api/src/db/query.js` | `buildSelectQuery()`, `buildCountQuery()`, `buildWhereClause()`, `buildUpdateQuery()` |
| `cloud-run-api/src/db/schema.js` | `getTableName(key)` — maps camelCase to `airtable_<snake_case>` table |
| `cloud-run-api/src/db/bigquery.js` | `insertLog()`, `insertAuditEvent()` — async BigQuery streaming |
| `cloud-run-api/src/middleware/auth.js` | `authenticate()` — auth middleware (no requireAdmin for driver) |
| `frontend/src/lib/admin-api.ts` | Reference server-side BFF client pattern |

## Shared Patterns

### Route File Boilerplate

Every driver route file uses this pattern:

```javascript
import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { insertLog, insertAuditEvent } from '../../db/bigquery.js';

const router = Router();

function formatRecord(row) {
  if (!row) return null;
  const { _id, airtable_id, _created_at, _updated_at, data } = row;
  return { _id, airtable_id, _createdAt: _created_at, _updatedAt: _updated_at, ...data };
}

function formatRecords(rows) {
  return (rows || []).map(formatRecord);
}

async function safeQuery(sql, params) {
  try {
    return await query(sql, params);
  } catch (err) {
    if (err.message?.includes('does not exist')) {
      return { rows: [] };
    }
    throw err;
  }
}

function handleError(res, context, err) {
  console.error(`[driver/<file>] ${context}:`, err.message);
  insertLog({ service: 'driver', level: 'ERROR', message: `<file>/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

export default router;
```

No auth guard on individual routes — barrel `index.js` does NOT apply `requireAdmin()`.

### Test Pattern

```javascript
import request from 'supertest';
import express from 'express';
import router from '../../../src/routes/driver/<file>.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.auth = { uid: 'test-driver', type: 'firebase' };
    next();
  });
  app.use('/v1/driver', router);
  return app;
}
```

---

## Dependency Map — What Can Run in Parallel

```
PHASE 1 (parallel — no dependencies):
├── Task 1: lib/driver-scoring.js (scoring pure function)
├── Task 2: driver/profile.js (12 endpoints)
├── Task 3: driver/matching.js (8 endpoints — depends on Task 1 conceptually but can mock)
├── Task 4: driver/cockpit.js (11 endpoints)
├── Task 5: driver/gamification.js (10 endpoints)
├── Task 6: driver/lifecycle.js (5 endpoints)
├── Task 7: driver/community.js (12 endpoints)
├── Task 8: driver/wellness.js (10 endpoints)
├── Task 9: driver/financial.js (5 endpoints)
├── Task 10: driver/scorecard.js (4 endpoints)
├── Task 11: driver/retention.js (4 endpoints)
└── Task 12: driver/documents.js (5 endpoints)

PHASE 2 (depends on Phase 1):
├── Task 13: driver/index.js (barrel + engagement middleware + manifest)
├── Task 14: Mount in app.js
└── Task 15: Add missing collections to schema.js

PHASE 3 (depends on Phase 2):
├── Task 16: Next.js driver-api.ts client
└── Task 17: Next.js server actions (11 files)

PHASE 4 (depends on Phase 2):
└── Task 18: Deploy to Cloud Run + smoke test
```

---

## Task 1: lib/driver-scoring.js (scoring pure function)

**Files:**
- Create: `cloud-run-api/src/lib/driver-scoring.js`
- Test: `cloud-run-api/tests/lib/driver-scoring.test.js`

**Step 1: Create the scoring module**

```javascript
/**
 * Driver-Carrier Match Scoring — Pure function.
 * Weights come from matching_model_weights table (ML pipeline updates weekly).
 * No hardcoded weights. All factor functions return 0-1 score.
 */

const DEFAULT_WEIGHTS = {
  location: 0.25,
  pay: 0.22,
  safety: 0.20,
  culture: 0.15,
  routeType: 0.10,
  fleetAge: 0.08,
};

/**
 * Location score: inverse distance decay.
 * Perfect = same city/state, 0 = >500 miles.
 */
function computeLocationScore(driver, carrier) {
  if (!driver.home_state || !carrier.state) return 0.5;
  if (driver.home_state === carrier.state) {
    if (driver.home_city && carrier.city && driver.home_city.toLowerCase() === carrier.city.toLowerCase()) return 1.0;
    return 0.8;
  }
  return 0.3;
}

/**
 * Pay score: how well carrier pay meets driver minimum.
 * carrier.cpm >= driver.min_cpm → 1.0, decreasing linearly below.
 */
function computePayScore(driver, carrier) {
  const driverMin = parseFloat(driver.min_cpm || driver.minimum_pay) || 0.45;
  const carrierPay = parseFloat(carrier.avg_cpm || carrier.pay_per_mile) || 0.50;
  if (carrierPay >= driverMin) return 1.0;
  const ratio = carrierPay / driverMin;
  return Math.max(0, ratio);
}

/**
 * Safety score: based on FMCSA data.
 * OOS rate < 5% = 1.0, > 30% = 0.
 */
function computeSafetyScore(carrier) {
  const oosRate = parseFloat(carrier.vehicle_oos_rate || carrier.oos_rate) || 0;
  if (oosRate <= 5) return 1.0;
  if (oosRate >= 30) return 0.0;
  return 1.0 - ((oosRate - 5) / 25);
}

/**
 * Culture score: sentiment + driver reviews.
 * Uses enrichment data (AI-analyzed carrier sentiment 0-100).
 */
function computeCultureScore(driver, carrier) {
  const sentiment = parseFloat(carrier.sentiment_score || carrier.culture_score) || 50;
  return sentiment / 100;
}

/**
 * Route type score: match driver preference to carrier offering.
 * Perfect match = 1.0, partial = 0.5, no data = 0.5.
 */
function computeRouteScore(driver, carrier) {
  const pref = (driver.preferred_route || driver.route_type || '').toLowerCase();
  const offers = (carrier.route_types || carrier.run_type || '').toLowerCase();
  if (!pref || !offers) return 0.5;
  if (offers.includes(pref)) return 1.0;
  return 0.3;
}

/**
 * Fleet age score: newer trucks score higher.
 * avg_truck_age <= 2 = 1.0, >= 10 = 0.2.
 */
function computeFleetAgeScore(carrier) {
  const age = parseFloat(carrier.avg_truck_age || carrier.equipment_age) || 5;
  if (age <= 2) return 1.0;
  if (age >= 10) return 0.2;
  return 1.0 - ((age - 2) / 10);
}

/**
 * Score a single driver-carrier match.
 * @param {object} driver - driver profile data (flattened from JSONB)
 * @param {object} carrier - carrier data (flattened from JSONB, may include enrichments)
 * @param {object} weights - { location, pay, safety, culture, routeType, fleetAge } summing to ~1.0
 * @returns {{ score: number, factors: object }}
 */
export function scoreMatch(driver, carrier, weights = DEFAULT_WEIGHTS) {
  const factors = {
    location: computeLocationScore(driver, carrier),
    pay: computePayScore(driver, carrier),
    safety: computeSafetyScore(carrier),
    culture: computeCultureScore(driver, carrier),
    routeType: computeRouteScore(driver, carrier),
    fleetAge: computeFleetAgeScore(carrier),
  };

  let total = 0;
  for (const [key, value] of Object.entries(factors)) {
    total += value * (weights[key] || 0);
  }

  return { score: Math.round(total * 100), factors };
}

/**
 * Score multiple carriers for a driver, return sorted by score descending.
 */
export function rankMatches(driver, carriers, weights = DEFAULT_WEIGHTS) {
  return carriers
    .map(carrier => ({
      carrier,
      ...scoreMatch(driver, carrier, weights),
    }))
    .sort((a, b) => b.score - a.score);
}

export { DEFAULT_WEIGHTS };
```

**Step 2: Create the test file**

```javascript
import { scoreMatch, rankMatches, DEFAULT_WEIGHTS } from '../../src/lib/driver-scoring.js';

describe('driver-scoring', () => {
  const mockDriver = {
    home_state: 'TX',
    home_city: 'Dallas',
    min_cpm: '0.55',
    preferred_route: 'OTR',
  };

  const mockCarrier = {
    state: 'TX',
    city: 'Dallas',
    avg_cpm: '0.65',
    vehicle_oos_rate: '3',
    sentiment_score: '85',
    route_types: 'OTR, Regional',
    avg_truck_age: '3',
  };

  test('scoreMatch returns score 0-100 with factor breakdown', () => {
    const result = scoreMatch(mockDriver, mockCarrier, DEFAULT_WEIGHTS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.factors).toHaveProperty('location');
    expect(result.factors).toHaveProperty('pay');
    expect(result.factors).toHaveProperty('safety');
    expect(result.factors).toHaveProperty('culture');
    expect(result.factors).toHaveProperty('routeType');
    expect(result.factors).toHaveProperty('fleetAge');
  });

  test('perfect match scores high', () => {
    const result = scoreMatch(mockDriver, mockCarrier, DEFAULT_WEIGHTS);
    expect(result.score).toBeGreaterThan(80);
  });

  test('rankMatches returns sorted array', () => {
    const carriers = [
      { ...mockCarrier, avg_cpm: '0.40' },
      { ...mockCarrier, avg_cpm: '0.70' },
      mockCarrier,
    ];
    const ranked = rankMatches(mockDriver, carriers, DEFAULT_WEIGHTS);
    expect(ranked.length).toBe(3);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    expect(ranked[1].score).toBeGreaterThanOrEqual(ranked[2].score);
  });
});
```

---

## Task 2: driver/profile.js (12 endpoints)

**Files:**
- Create: `cloud-run-api/src/routes/driver/profile.js`
- Test: `cloud-run-api/tests/routes/driver/profile.test.js`

```javascript
import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { buildSelectQuery, buildCountQuery } from '../../db/query.js';
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
```

**Test file:**

```javascript
import request from 'supertest';
import express from 'express';

// Mock dependencies before importing router
const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/db/pool.js', () => ({ query: mockQuery }));
jest.unstable_mockModule('../../../src/db/bigquery.js', () => ({
  insertLog: jest.fn(),
  insertAuditEvent: jest.fn(),
}));

const { default: router } = await import('../../../src/routes/driver/profile.js');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => { req.auth = { uid: 'test-driver', type: 'firebase' }; next(); });
  app.use('/v1/driver/profile', router);
  return app;
}

describe('driver/profile', () => {
  let app;
  beforeEach(() => { app = createTestApp(); jest.clearAllMocks(); });

  test('GET /profile/:id returns driver', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ _id: 'drv1', airtable_id: 'drv1', _created_at: new Date(), _updated_at: new Date(), data: { first_name: 'Marcus', email: 'marcus@test.com', cdl_class: 'A' } }] });
    const res = await request(app).get('/v1/driver/profile/drv1');
    expect(res.status).toBe(200);
    expect(res.body.first_name).toBe('Marcus');
    expect(res.body.completeness_score).toBeGreaterThan(0);
  });

  test('GET /profile/:id returns 404 for missing driver', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/v1/driver/profile/nonexistent');
    expect(res.status).toBe(404);
  });

  test('GET /profile/:id/strength returns score and missing fields', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ _id: 'drv1', data: { first_name: 'Marcus', email: 'marcus@test.com' } }] });
    const res = await request(app).get('/v1/driver/profile/drv1/strength');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('score');
    expect(res.body).toHaveProperty('missingFields');
    expect(Array.isArray(res.body.missingFields)).toBe(true);
  });
});
```

---

## Task 3: driver/matching.js (8 endpoints)

**Files:**
- Create: `cloud-run-api/src/routes/driver/matching.js`
- Test: `cloud-run-api/tests/routes/driver/matching.test.js`

```javascript
import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { buildSelectQuery, buildCountQuery } from '../../db/query.js';
import { insertLog } from '../../db/bigquery.js';
import { scoreMatch, rankMatches, DEFAULT_WEIGHTS } from '../../lib/driver-scoring.js';

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
  console.error(`[driver/matching] ${context}:`, err.message);
  insertLog({ service: 'driver', level: 'ERROR', message: `matching/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

/** Load active weights from matching_model_weights table, fall back to defaults */
async function getActiveWeights() {
  try {
    const result = await query(`SELECT weights FROM "matching_model_weights" WHERE is_active = true LIMIT 1`);
    if (result.rows.length > 0) return result.rows[0].weights;
  } catch { /* table may not exist yet */ }
  return DEFAULT_WEIGHTS;
}

// ── POST /matching/find-jobs ──
router.post('/find-jobs', async (req, res) => {
  try {
    const { driverId, filters, limit = 20 } = req.body;
    const driversTable = getTableName('driverProfiles');
    const carriersTable = getTableName('carriers');
    const enrichTable = getTableName('carrierEnrichments');

    // Get driver profile
    const driverResult = await safeQuery(`SELECT * FROM "${driversTable}" WHERE _id = $1`, [driverId]);
    if (driverResult.rows.length === 0) return res.status(404).json({ error: 'DRIVER_NOT_FOUND' });
    const driver = driverResult.rows[0].data || {};

    // Get carriers (with optional filters)
    let carrierSql = `SELECT c.*, e.data AS enrichment_data FROM "${carriersTable}" c LEFT JOIN "${enrichTable}" e ON c.data->>'dot_number' = e.data->>'dot_number'`;
    const carrierResult = await safeQuery(`${carrierSql} LIMIT $1`, [Math.min(parseInt(limit) * 5, 500)]);

    // Score and rank
    const weights = await getActiveWeights();
    const carriers = carrierResult.rows.map(row => {
      const data = row.data || {};
      const enrichment = row.enrichment_data || {};
      return { ...data, ...enrichment, _id: row._id };
    });

    const ranked = rankMatches(driver, carriers, weights).slice(0, parseInt(limit));

    return res.json({
      matches: ranked.map((r, i) => ({
        position: i + 1,
        carrierId: r.carrier._id,
        carrierName: r.carrier.legal_name || r.carrier.carrier_name || 'Unknown',
        score: r.score,
        factors: r.factors,
        dotNumber: r.carrier.dot_number,
        state: r.carrier.state,
        fleetSize: r.carrier.fleet_size || r.carrier.power_units,
      })),
      totalScored: carriers.length,
      modelVersion: 'default',
    });
  } catch (err) { return handleError(res, 'find-jobs', err); }
});

// ── POST /matching/find-drivers ──
router.post('/find-drivers', async (req, res) => {
  try {
    const { carrierDot, filters, limit = 20 } = req.body;
    const driversTable = getTableName('driverProfiles');
    const carriersTable = getTableName('carriers');

    const carrierResult = await safeQuery(`SELECT * FROM "${carriersTable}" WHERE data->>'dot_number' = $1 LIMIT 1`, [String(carrierDot)]);
    if (carrierResult.rows.length === 0) return res.status(404).json({ error: 'CARRIER_NOT_FOUND' });
    const carrier = carrierResult.rows[0].data || {};

    const driversResult = await safeQuery(`SELECT * FROM "${driversTable}" WHERE data->>'is_discoverable' = 'Yes' LIMIT $1`, [Math.min(parseInt(limit) * 3, 300)]);
    const weights = await getActiveWeights();
    const drivers = driversResult.rows.map(r => ({ ...(r.data || {}), _id: r._id }));

    const ranked = drivers.map(d => ({ driver: d, ...scoreMatch(d, carrier, weights) })).sort((a, b) => b.score - a.score).slice(0, parseInt(limit));

    return res.json({
      drivers: ranked.map((r, i) => ({
        position: i + 1,
        driverId: r.driver._id,
        name: `${r.driver.first_name || ''} ${r.driver.last_name || ''}`.trim() || 'Driver',
        score: r.score,
        factors: r.factors,
        cdlClass: r.driver.cdl_class,
        yearsExperience: r.driver.years_experience,
        state: r.driver.home_state,
      })),
      totalScored: drivers.length,
    });
  } catch (err) { return handleError(res, 'find-drivers', err); }
});

// ── GET /matching/explain/:driverId/:carrierDot ──
router.get('/explain/:driverId/:carrierDot', async (req, res) => {
  try {
    const { driverId, carrierDot } = req.params;
    const driversTable = getTableName('driverProfiles');
    const carriersTable = getTableName('carriers');
    const enrichTable = getTableName('carrierEnrichments');

    const [driverR, carrierR, enrichR] = await Promise.all([
      safeQuery(`SELECT * FROM "${driversTable}" WHERE _id = $1`, [driverId]),
      safeQuery(`SELECT * FROM "${carriersTable}" WHERE data->>'dot_number' = $1 LIMIT 1`, [carrierDot]),
      safeQuery(`SELECT * FROM "${enrichTable}" WHERE data->>'dot_number' = $1 LIMIT 1`, [carrierDot]),
    ]);

    if (driverR.rows.length === 0) return res.status(404).json({ error: 'DRIVER_NOT_FOUND' });
    if (carrierR.rows.length === 0) return res.status(404).json({ error: 'CARRIER_NOT_FOUND' });

    const driver = driverR.rows[0].data || {};
    const carrier = { ...(carrierR.rows[0].data || {}), ...(enrichR.rows[0]?.data || {}) };
    const weights = await getActiveWeights();
    const { score, factors } = scoreMatch(driver, carrier, weights);

    const categories = [
      { key: 'location', label: 'Location', score: Math.round(factors.location * 100), status: factors.location >= 0.8 ? 'good' : factors.location >= 0.5 ? 'average' : 'poor' },
      { key: 'pay', label: 'Pay Match', score: Math.round(factors.pay * 100), status: factors.pay >= 0.8 ? 'good' : 'average' },
      { key: 'safety', label: 'Safety Record', score: Math.round(factors.safety * 100), status: factors.safety >= 0.8 ? 'good' : factors.safety >= 0.5 ? 'average' : 'poor' },
      { key: 'culture', label: 'Culture Fit', score: Math.round(factors.culture * 100), status: factors.culture >= 0.7 ? 'good' : 'average' },
      { key: 'routeType', label: 'Route Type', score: Math.round(factors.routeType * 100), status: factors.routeType >= 0.8 ? 'perfect' : 'partial' },
      { key: 'fleetAge', label: 'Fleet Quality', score: Math.round(factors.fleetAge * 100), status: factors.fleetAge >= 0.8 ? 'good' : 'average' },
    ];

    const tier = score >= 85 ? 'Strong' : score >= 70 ? 'Good' : score >= 50 ? 'Potential' : 'Partial';

    return res.json({
      overallScore: score,
      summary: `You are a ${tier} match for ${carrier.legal_name || 'this carrier'} (${score}%)`,
      categories,
      carrierDot,
      carrierName: carrier.legal_name || carrier.carrier_name,
    });
  } catch (err) { return handleError(res, 'explain', err); }
});

// ── GET /matching/weights ──
router.get('/weights', async (req, res) => {
  try {
    const weights = await getActiveWeights();
    return res.json({ weights, isDefault: weights === DEFAULT_WEIGHTS });
  } catch (err) { return handleError(res, 'get-weights', err); }
});

// ── GET /matching/search/jobs ──
router.get('/search/jobs', async (req, res) => {
  try {
    const table = getTableName('jobPostings');
    const { cdlClass, jobType, state, payType, limit = 20, skip = 0 } = req.query;
    const filters = [];
    if (cdlClass) filters.push({ field: 'cdl_class', operator: 'eq', value: cdlClass });
    if (jobType) filters.push({ field: 'job_type', operator: 'eq', value: jobType });
    if (state) filters.push({ field: 'state', operator: 'eq', value: state });
    if (payType) filters.push({ field: 'pay_type', operator: 'eq', value: payType });
    const selectQ = buildSelectQuery(table, { filters, limit: parseInt(limit), skip: parseInt(skip) });
    const countQ = buildCountQuery(table, { filters });
    const [data, count] = await Promise.all([safeQuery(selectQ.sql, selectQ.params), safeQuery(countQ.sql, countQ.params)]);
    return res.json({ items: formatRecords(data.rows), totalCount: parseInt(count.rows[0]?.count) || 0 });
  } catch (err) { return handleError(res, 'search-jobs', err); }
});

// ── GET /matching/search/drivers ──
router.get('/search/drivers', async (req, res) => {
  try {
    const table = getTableName('driverProfiles');
    const { cdlClass, state, endorsements, limit = 20, skip = 0 } = req.query;
    const filters = [{ field: 'is_discoverable', operator: 'eq', value: 'Yes' }];
    if (cdlClass) filters.push({ field: 'cdl_class', operator: 'eq', value: cdlClass });
    if (state) filters.push({ field: 'home_state', operator: 'eq', value: state });
    const selectQ = buildSelectQuery(table, { filters, limit: parseInt(limit), skip: parseInt(skip) });
    const countQ = buildCountQuery(table, { filters });
    const [data, count] = await Promise.all([safeQuery(selectQ.sql, selectQ.params), safeQuery(countQ.sql, countQ.params)]);
    return res.json({ items: formatRecords(data.rows), totalCount: parseInt(count.rows[0]?.count) || 0 });
  } catch (err) { return handleError(res, 'search-drivers', err); }
});

// ── POST /matching/detect-mutual ──
router.post('/detect-mutual', async (req, res) => {
  try {
    const { driverId, carrierDot } = req.body;
    const interestsTable = getTableName('driverCarrierInterests');
    const viewsTable = getTableName('carrierDriverViews');
    const [driverInterest, carrierView] = await Promise.all([
      safeQuery(`SELECT * FROM "${interestsTable}" WHERE data->>'driver_id' = $1 AND data->>'carrier_dot' = $2 LIMIT 1`, [driverId, carrierDot]),
      safeQuery(`SELECT * FROM "${viewsTable}" WHERE data->>'driver_id' = $1 AND data->>'carrier_dot' = $2 LIMIT 1`, [driverId, carrierDot]),
    ]);
    return res.json({ isMutualMatch: driverInterest.rows.length > 0 && carrierView.rows.length > 0, driverInterested: driverInterest.rows.length > 0, carrierViewed: carrierView.rows.length > 0 });
  } catch (err) { return handleError(res, 'detect-mutual', err); }
});

// ── GET /matching/model-info ──
router.get('/model-info', async (req, res) => {
  try {
    const result = await safeQuery(`SELECT model_version, weights, training_metrics, promoted_at, created_at FROM "matching_model_weights" WHERE is_active = true LIMIT 1`);
    if (result.rows.length === 0) return res.json({ modelVersion: 'default', weights: DEFAULT_WEIGHTS, trainingMetrics: null });
    const row = result.rows[0];
    return res.json({ modelVersion: row.model_version, weights: row.weights, trainingMetrics: row.training_metrics, promotedAt: row.promoted_at });
  } catch (err) { return handleError(res, 'model-info', err); }
});

export default router;
```

---

## Tasks 4-12: Remaining Route Files

Each of the following tasks creates one route file + one test file following the exact same patterns as Tasks 2-3. Due to the plan length, I provide the file path, endpoint count, and key implementation notes for each. The subagent building each file should reference the design doc for the complete endpoint map and use the patterns from Tasks 1-3.

### Task 4: driver/cockpit.js (11 endpoints)

**Files:**
- Create: `cloud-run-api/src/routes/driver/cockpit.js`
- Test: `cloud-run-api/tests/routes/driver/cockpit.test.js`

**Collections:** `jobPostings`, `driverCarrierInterests`, `driverProfiles`, `driverNotifications`

**Key endpoints:** `GET /:id/dashboard` (aggregates matchCount + appCount + savedCount), `POST /:id/apply/:jobId` (creates interest record with status='applied'), `POST /:id/withdraw/:appId` (updates status to 'withdrawn'), `GET /:id/applications` (paginated with filters), `POST /:id/save-job/:jobId` (upsert saved job)

**Explicit engagement events:** `application_submitted`, `application_withdrawn`, `job_saved`

### Task 5: driver/gamification.js (10 endpoints)

**Files:**
- Create: `cloud-run-api/src/routes/driver/gamification.js`
- Test: `cloud-run-api/tests/routes/driver/gamification.test.js`

**Collections:** `driverProgression`, `driverAchievements`, `gamificationEvents`, `achievementDefinitions`, `seasonalEvents`

**XP System Constants (inline):**
```javascript
const XP_ACTIONS = {
  update_profile: 10, upload_document: 15, first_application: 25,
  daily_login: 5, complete_survey: 25, forum_post: 10,
  referral_signup: 200, referral_hire: 500, first_dispatch: 50,
};

const LEVELS = [
  { level: 1, name: 'Rookie', minXP: 0 },
  { level: 2, name: 'Road Ready', minXP: 100 },
  { level: 3, name: 'Mile Maker', minXP: 300 },
  { level: 4, name: 'Highway Hero', minXP: 600 },
  { level: 5, name: 'Road Warrior', minXP: 1000 },
  { level: 6, name: 'Fleet Legend', minXP: 2000 },
];
```

**Streak formula:** `multiplier = Math.min(1.0 + (streakDays * 0.1), 2.5)`

**Explicit engagement event:** `daily_login`

### Task 6: driver/lifecycle.js (5 endpoints)

**Files:**
- Create: `cloud-run-api/src/routes/driver/lifecycle.js`
- Test: `cloud-run-api/tests/routes/driver/lifecycle.test.js`

**Collections:** `lifecycleEvents`, `driverProfiles`, `driverMatchFeedback`, `carrierDriverViews`, `driverCarrierInterests`, `matchEvents`

**Disposition states:** `actively_looking`, `passively_open`, `not_looking`, `hired`, `active`, `dispatched`

### Task 7: driver/community.js (12 endpoints)

**Files:**
- Create: `cloud-run-api/src/routes/driver/community.js`
- Test: `cloud-run-api/tests/routes/driver/community.test.js`

**Collections:** `forumCategories`, `forumThreads`, `forumPosts`, `carrierAnnouncements`, `announcementReadReceipts`, `announcementComments`, `driverSurveys`, `driverSurveyResponses`

**Explicit engagement events:** `forum_post_created`, `survey_completed`

### Task 8: driver/wellness.js (10 endpoints)

**Files:**
- Create: `cloud-run-api/src/routes/driver/wellness.js`
- Test: `cloud-run-api/tests/routes/driver/wellness.test.js`

**Collections:** `healthResources`, `healthTips`, `petFriendlyLocations`, `petFriendlyReviews`, `mentorProfiles`, `mentorMatches`

**Key features:** Haversine proximity search for pet-friendly stops, published date filtering for health resources, mentor eligibility check (5+ years exp)

### Task 9: driver/financial.js (5 endpoints)

**Files:**
- Create: `cloud-run-api/src/routes/driver/financial.js`
- Test: `cloud-run-api/tests/routes/driver/financial.test.js`

**Collections:** `driverExpenses`

**Expense categories:** `fuel`, `tolls`, `lumper`, `scales`, `meals`, `lodging`, `maintenance`, `insurance`, `equipment`, `communications`, `medical`, `other`

### Task 10: driver/scorecard.js (4 endpoints)

**Files:**
- Create: `cloud-run-api/src/routes/driver/scorecard.js`
- Test: `cloud-run-api/tests/routes/driver/scorecard.test.js`

**Collections:** `driverScores`, `fleetDrivers`

**Score categories:** `overall_score`, `safety_score`, `efficiency_score`, `service_score`, `compliance_score`

**Period types:** `weekly`, `monthly`, `quarterly`

### Task 11: driver/retention.js (4 endpoints)

**Files:**
- Create: `cloud-run-api/src/routes/driver/retention.js`
- Test: `cloud-run-api/tests/routes/driver/retention.test.js`

**Collections:** `driverPerformance`, `retentionRiskLogs`, `carriers`

**Risk factors:** dNPS (weight 0.3), activity drop (0.25), safety incidents (0.2), pay volatility (0.15), home time (0.1)

**Risk levels:** CRITICAL (>80), HIGH (60-80), MEDIUM (40-60), LOW (<40)

### Task 12: driver/documents.js (5 endpoints)

**Files:**
- Create: `cloud-run-api/src/routes/driver/documents.js`
- Test: `cloud-run-api/tests/routes/driver/documents.test.js`

**Collections:** `driverProfiles` (document fields), `qualificationFiles`

**Document types:** `cdl`, `medical_card`, `mvr`, `employment_history`, `drug_test`, `training_cert`, `background_check`, `w9`

**Explicit engagement event:** `document_uploaded`

---

## Task 13: driver/index.js (barrel + engagement middleware + manifest)

**Files:**
- Create: `cloud-run-api/src/routes/driver/index.js`

**Depends on:** Tasks 1-12 (all route files must exist)

```javascript
import { Router } from 'express';
import { insertLog } from '../../db/bigquery.js';
import profileRouter from './profile.js';
import matchingRouter from './matching.js';
import cockpitRouter from './cockpit.js';
import gamificationRouter from './gamification.js';
import lifecycleRouter from './lifecycle.js';
import communityRouter from './community.js';
import wellnessRouter from './wellness.js';
import financialRouter from './financial.js';
import scorecardRouter from './scorecard.js';
import retentionRouter from './retention.js';
import documentsRouter from './documents.js';

const router = Router();

// ── Layer 1: Implicit engagement logging ──
router.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    try {
      insertLog({
        service: 'driver-engagement',
        level: 'INFO',
        message: `${req.method} ${req.originalUrl}`,
        data: {
          driver_id: req.auth?.driverId || req.params?.id || 'anonymous',
          endpoint: req.originalUrl,
          method: req.method,
          status_code: res.statusCode,
          response_ms: Date.now() - start,
          session_id: req.headers['x-session-id'] || null,
          user_agent: req.headers['user-agent']?.substring(0, 100) || null,
        },
      });
    } catch { /* non-blocking */ }
  });
  next();
});

// No requireAdmin() — any authenticated user can access driver routes

// Mount sub-routers
router.use('/profile', profileRouter);
router.use('/matching', matchingRouter);
router.use('/cockpit', cockpitRouter);
router.use('/gamification', gamificationRouter);
router.use('/lifecycle', lifecycleRouter);
router.use('/community', communityRouter);
router.use('/wellness', wellnessRouter);
router.use('/financial', financialRouter);
router.use('/scorecard', scorecardRouter);
router.use('/retention', retentionRouter);
router.use('/documents', documentsRouter);

// ── GET /driver/manifest — AI tool definitions ──
const TOOL_DEFINITIONS = [
  // Profile (6 tools)
  { name: 'driver_get_profile', description: 'Get a driver profile by ID with completeness score', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/profile/:id' } },
  { name: 'driver_update_profile', description: 'Update driver profile fields (name, CDL, preferences)', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, fields: { type: 'object' } }, required: ['driverId'] }, endpoint: { method: 'PUT', path: '/v1/driver/profile/:id' } },
  { name: 'driver_get_strength', description: 'Get profile completeness score and missing fields', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/profile/:id/strength' } },
  { name: 'driver_set_visibility', description: 'Toggle whether recruiters can find this driver', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, visible: { type: 'boolean' } }, required: ['driverId', 'visible'] }, endpoint: { method: 'PUT', path: '/v1/driver/profile/:id/visibility' } },
  { name: 'driver_get_activity', description: 'Get driver activity stats (applications, views, matches)', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/profile/:id/activity' } },
  { name: 'driver_who_viewed_me', description: 'Show which recruiters viewed this driver profile', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, limit: { type: 'number', default: 10 } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/profile/:id/views' } },

  // Matching (5 tools)
  { name: 'driver_find_jobs', description: 'Find matching carrier jobs for a driver based on profile and preferences', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, limit: { type: 'number', default: 10 } }, required: ['driverId'] }, endpoint: { method: 'POST', path: '/v1/driver/matching/find-jobs' } },
  { name: 'driver_explain_match', description: 'Explain why a driver matched with a specific carrier', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, carrierDot: { type: 'string' } }, required: ['driverId', 'carrierDot'] }, endpoint: { method: 'GET', path: '/v1/driver/matching/explain/:driverId/:carrierDot' } },
  { name: 'driver_search_jobs', description: 'Search available job postings with filters', input_schema: { type: 'object', properties: { cdlClass: { type: 'string' }, state: { type: 'string' }, jobType: { type: 'string' } } }, endpoint: { method: 'GET', path: '/v1/driver/matching/search/jobs' } },
  { name: 'driver_detect_mutual', description: 'Check if driver and carrier have mutual interest', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, carrierDot: { type: 'string' } }, required: ['driverId', 'carrierDot'] }, endpoint: { method: 'POST', path: '/v1/driver/matching/detect-mutual' } },
  { name: 'driver_get_model_info', description: 'Get current matching model version and weights', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/driver/matching/model-info' } },

  // Cockpit (5 tools)
  { name: 'driver_get_dashboard', description: 'Get driver dashboard summary (match count, applications, saved jobs)', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/cockpit/:id/dashboard' } },
  { name: 'driver_apply_job', description: 'Submit a job application for a driver', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, jobId: { type: 'string' } }, required: ['driverId', 'jobId'] }, endpoint: { method: 'POST', path: '/v1/driver/cockpit/:id/apply/:jobId' } },
  { name: 'driver_get_applications', description: 'List driver job applications with status', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/cockpit/:id/applications' } },
  { name: 'driver_withdraw_app', description: 'Withdraw a job application', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, appId: { type: 'string' } }, required: ['driverId', 'appId'] }, endpoint: { method: 'POST', path: '/v1/driver/cockpit/:id/withdraw/:appId' } },
  { name: 'driver_get_notifications', description: 'Get driver notification queue', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/cockpit/:id/notifications' } },

  // Gamification (4 tools)
  { name: 'driver_get_progression', description: 'Get driver XP, level, streak, and multiplier', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/gamification/:id/progression' } },
  { name: 'driver_get_achievements', description: 'Get all achievements with earned status and progress', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/gamification/:id/achievements' } },
  { name: 'driver_get_streak', description: 'Get streak status (days, freeze availability, next milestone)', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/gamification/:id/streak' } },
  { name: 'driver_get_leaderboard', description: 'Get top drivers by XP', input_schema: { type: 'object', properties: { limit: { type: 'number', default: 10 } } }, endpoint: { method: 'GET', path: '/v1/driver/gamification/leaderboard' } },

  // Lifecycle (2 tools)
  { name: 'driver_get_timeline', description: 'Get driver lifecycle timeline (status changes, milestones)', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/lifecycle/:id/timeline' } },
  { name: 'driver_update_disposition', description: 'Update driver disposition (actively_looking, hired, etc.)', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, disposition: { type: 'string', enum: ['actively_looking', 'passively_open', 'not_looking', 'hired'] } }, required: ['driverId', 'disposition'] }, endpoint: { method: 'PUT', path: '/v1/driver/lifecycle/:id/disposition' } },

  // Community (3 tools)
  { name: 'driver_get_forums', description: 'Get forum categories with thread counts', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/driver/community/forums' } },
  { name: 'driver_get_announcements', description: 'Get carrier announcements for driver', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/driver/community/announcements' } },
  { name: 'driver_get_surveys', description: 'Get pending surveys for driver', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/driver/community/surveys' } },

  // Wellness (2 tools)
  { name: 'driver_search_pet_friendly', description: 'Search pet-friendly truck stops near a location', input_schema: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' }, radiusMiles: { type: 'number', default: 50 } } }, endpoint: { method: 'GET', path: '/v1/driver/wellness/pets/nearby' } },
  { name: 'driver_get_health_resources', description: 'Get trucker health and wellness resources by category', input_schema: { type: 'object', properties: { category: { type: 'string' } } }, endpoint: { method: 'GET', path: '/v1/driver/wellness/health' } },

  // Financial (2 tools)
  { name: 'driver_log_expense', description: 'Log a driver expense (fuel, tolls, meals, etc.)', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, amount: { type: 'number' }, category: { type: 'string' }, description: { type: 'string' } }, required: ['driverId', 'amount', 'category'] }, endpoint: { method: 'POST', path: '/v1/driver/financial/:id/expenses' } },
  { name: 'driver_get_expenses', description: 'Get driver expense history', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/financial/:id/expenses' } },

  // Retention (1 tool)
  { name: 'driver_get_risk_score', description: 'Get driver retention risk assessment', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/retention/:id/risk' } },
];

router.get('/manifest', (req, res) => {
  return res.json({ tools: TOOL_DEFINITIONS, version: '1.0.0', generatedAt: new Date().toISOString() });
});

export default router;
```

---

## Task 14: Mount driver router in app.js

**Files:**
- Modify: `cloud-run-api/src/app.js`

Add after `import adminRouter`:
```javascript
import driverRouter from './routes/driver/index.js';
```

Add after `protectedRouter.use('/admin', adminRouter)`:
```javascript
protectedRouter.use('/driver', driverRouter);
```

---

## Task 15: Add missing collections to schema.js

**Files:**
- Modify: `cloud-run-api/src/db/schema.js`

Add to `KNOWN_COLLECTIONS`:
```javascript
// Driver OS route collections
'driverExpenses', 'driverSurveys', 'driverSurveyResponses',
'driverMatchFeedback', 'driverConversations', 'driverNotifications',
'driverActivityFeed', 'savedJobs', 'driverRecognitions',
'driverQuickResponses',
```

Note: `matching_model_weights` is NOT an airtable_ table — it uses its own table name directly and doesn't go through `getTableName()`.

---

## Task 16: Next.js driver-api.ts client

**Files:**
- Create: `frontend/src/lib/driver-api.ts`

```typescript
'use server';

const CLOUD_RUN_URL = process.env.LMDR_API_URL || 'https://lmdr-api-140035137711.us-central1.run.app';
const INTERNAL_KEY = process.env.LMDR_INTERNAL_KEY || '';

class DriverApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, body: unknown) {
    super(`Driver API error ${status}`);
    this.status = status;
    this.detail = body;
  }
}

export async function driverFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${CLOUD_RUN_URL}/v1/driver${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${INTERNAL_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new DriverApiError(res.status, body);
  }
  return res.json() as Promise<T>;
}
```

---

## Task 17: Next.js server actions (11 files)

**Files:**
- Create: `frontend/src/app/(driver)/actions/profile.ts`
- Create: `frontend/src/app/(driver)/actions/matching.ts`
- Create: `frontend/src/app/(driver)/actions/cockpit.ts`
- Create: `frontend/src/app/(driver)/actions/gamification.ts`
- Create: `frontend/src/app/(driver)/actions/lifecycle.ts`
- Create: `frontend/src/app/(driver)/actions/community.ts`
- Create: `frontend/src/app/(driver)/actions/wellness.ts`
- Create: `frontend/src/app/(driver)/actions/documents.ts`
- Create: `frontend/src/app/(driver)/actions/financial.ts`
- Create: `frontend/src/app/(driver)/actions/scorecard.ts`
- Create: `frontend/src/app/(driver)/actions/retention.ts`

Each file follows the same pattern as the admin server actions — `'use server'` directive, imports `driverFetch` from `@/lib/driver-api`, wraps each Cloud Run endpoint with typed function signatures.

---

## Task 18: Deploy to Cloud Run + smoke test

**Step 1: Deploy**
```bash
cd cloud-run-api
gcloud run deploy lmdr-api --source . --project ldmr-velocitymatch --region us-central1 --allow-unauthenticated
```

**Step 2: Smoke test**
```bash
INTERNAL_KEY=$(gcloud secrets versions access latest --secret=lmdr-internal-key --project=ldmr-velocitymatch)
API_URL="https://lmdr-api-140035137711.us-central1.run.app"

# Test manifest
curl -s -H "Authorization: Bearer $INTERNAL_KEY" "$API_URL/v1/driver/manifest" | jq '.tools | length'
# Expected: 30

# Test profile
curl -s -H "Authorization: Bearer $INTERNAL_KEY" "$API_URL/v1/driver/profile/demo-driver-001" | jq .

# Test matching weights
curl -s -H "Authorization: Bearer $INTERNAL_KEY" "$API_URL/v1/driver/matching/weights" | jq .

# Test gamification leaderboard
curl -s -H "Authorization: Bearer $INTERNAL_KEY" "$API_URL/v1/driver/gamification/leaderboard" | jq .
```
