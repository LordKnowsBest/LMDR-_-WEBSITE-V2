# Admin OS Backend Wiring — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create 9 Cloud Run admin route files + barrel/manifest + Next.js server actions that replace 22 Wix .jsw admin services with unified REST endpoints serving both the admin frontend and AI agent layer.

**Architecture:** Express route directory at `cloud-run-api/src/routes/admin/` mounted in `app.js` before the catch-all collection router. Next.js server actions in `frontend/src/app/(admin)/actions/` call Cloud Run via `LMDR_INTERNAL_KEY`. AI agent consumes `/v1/admin/manifest` for tool definitions.

**Tech Stack:** Express 4, PostgreSQL (JSONB via `pg`), BigQuery streaming, supertest + Jest (ESM), Next.js 14 server actions, TypeScript (frontend)

**Design Doc:** `docs/plans/2026-03-10-admin-os-wiring-design.md`

---

## Reference Files (Read These First)

| File | Purpose |
|------|---------|
| `cloud-run-api/src/app.js` | Express app factory — mount new routes here |
| `cloud-run-api/src/routes/jobs.js` | Reference pattern for route files (auth guard, query, BigQuery logging) |
| `cloud-run-api/src/db/pool.js` | `query(sql, params)` — parameterized SQL execution |
| `cloud-run-api/src/db/query.js` | `buildSelectQuery()`, `buildCountQuery()`, `buildWhereClause()`, `buildUpdateQuery()` |
| `cloud-run-api/src/db/schema.js` | `getTableName(key)` — maps camelCase to `airtable_<snake_case>` table |
| `cloud-run-api/src/db/bigquery.js` | `insertLog()`, `insertAuditEvent()` — async BigQuery streaming |
| `cloud-run-api/src/middleware/auth.js` | `authenticate()`, `requireAdmin()` — auth middleware |
| `cloud-run-api/tests/routes/health.test.js` | Reference test pattern (supertest + createApp) |
| `frontend/src/lib/api.ts` | Existing API client pattern with `apiFetch()` |
| `frontend/src/lib/hooks.ts` | `useApi()` and `useMutation()` hooks |

## Shared Patterns

### Admin Auth Guard

Every admin route file starts with this pattern (matches `jobs.js` style):

```javascript
import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { buildSelectQuery, buildCountQuery, buildWhereClause } from '../../db/query.js';
import { insertLog, insertAuditEvent } from '../../db/bigquery.js';

const router = Router();
export default router;
```

Auth is handled by `requireAdmin()` from `auth.js`, applied at the barrel level (index.js), NOT per-file.

### Record Formatting

All JSONB records returned from Cloud SQL must be flattened:

```javascript
function formatRecord(row) {
  if (!row) return null;
  const { _id, airtable_id, _created_at, _updated_at, data } = row;
  return { _id, airtable_id, _createdAt: _created_at, _updatedAt: _updated_at, ...data };
}

function formatRecords(rows) {
  return rows.map(formatRecord);
}
```

### Error Handler

```javascript
function handleError(res, context, err) {
  console.error(`[admin/${context}]`, err.message);
  insertLog({ service: 'admin', level: 'ERROR', message: `${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}
```

### Test Pattern

```javascript
import request from 'supertest';
import express from 'express';
import router from '../../../src/routes/admin/<file>.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  // Mock admin auth
  app.use((req, res, next) => {
    req.auth = { uid: 'test-admin', role: 'admin', type: 'firebase' };
    next();
  });
  app.use('/v1/admin', router);
  return app;
}
```

---

## Dependency Map — What Can Run in Parallel

```
PHASE 1 (parallel — no dependencies between tasks):
├── Task 1: admin/dashboard.js
├── Task 2: admin/drivers.js
├── Task 3: admin/carriers.js
├── Task 4: admin/matches.js
├── Task 5: admin/config.js
├── Task 6: admin/observability.js
├── Task 7: admin/ai-router.js
├── Task 8: admin/audit.js
└── Task 9: admin/billing.js

PHASE 2 (depends on Phase 1):
├── Task 10: admin/index.js (barrel + manifest — imports all Phase 1 routers)
├── Task 11: Mount in app.js
└── Task 12: Add missing collections to schema.js KNOWN_COLLECTIONS

PHASE 3 (depends on Phase 2):
├── Task 13: Next.js admin-api.ts client
├── Task 14: Next.js server actions (9 files)
└── Task 15: Update Next.js admin pages to use server actions

PHASE 4 (depends on Phase 2):
└── Task 16: Deploy to Cloud Run + smoke test
```

---

## Task 1: admin/dashboard.js (3 endpoints)

**Files:**
- Create: `cloud-run-api/src/routes/admin/dashboard.js`
- Test: `cloud-run-api/tests/routes/admin/dashboard.test.js`

**Step 1: Create the route file**

```javascript
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
      query(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE data->>'status' = 'active') AS active,
        COUNT(*) FILTER (WHERE data->>'verification_status' = 'pending') AS pending
        FROM "${driversTable}"`),
      query(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE data->>'status' = 'active') AS active,
        COUNT(*) FILTER (WHERE data->>'flagged' = 'true') AS flagged
        FROM "${carriersTable}"`),
      query(`SELECT COUNT(*) AS total FROM "${matchesTable}"
        WHERE _created_at >= NOW() - INTERVAL '7 days'`),
      query(`SELECT COUNT(*) AS total FROM "${enrichTable}"`),
      query(`SELECT _id, data, _created_at FROM "${auditTable}"
        ORDER BY _created_at DESC LIMIT 10`),
      query(`SELECT COUNT(*) AS total FROM "${alertsTable}"
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
```

**Step 2: Create the test file**

```javascript
import request from 'supertest';
import express from 'express';
import dashboardRouter from '../../../src/routes/admin/dashboard.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.auth = { uid: 'test-admin', role: 'admin', type: 'firebase' };
    next();
  });
  app.use('/v1/admin/dashboard', dashboardRouter);
  return app;
}

describe('Admin Dashboard Routes', () => {
  let app;
  beforeAll(() => { app = createTestApp(); });

  describe('GET /v1/admin/dashboard/overview', () => {
    it('returns dashboard overview with driver/carrier stats', async () => {
      const res = await request(app).get('/v1/admin/dashboard/overview');
      expect(res.status).toBe(200);
      expect(res.body.drivers).toBeDefined();
      expect(typeof res.body.drivers.total).toBe('number');
      expect(res.body.carriers).toBeDefined();
      expect(typeof res.body.matchesThisWeek).toBe('number');
    });
  });

  describe('GET /v1/admin/dashboard/quick-stats', () => {
    it('returns 4 quick stats', async () => {
      const res = await request(app).get('/v1/admin/dashboard/quick-stats');
      expect(res.status).toBe(200);
      expect(typeof res.body.totalDrivers).toBe('number');
      expect(typeof res.body.totalCarriers).toBe('number');
      expect(typeof res.body.pendingReview).toBe('number');
    });
  });

  describe('GET /v1/admin/dashboard/ai-usage', () => {
    it('returns AI usage by provider', async () => {
      const res = await request(app).get('/v1/admin/dashboard/ai-usage?period=7d');
      expect(res.status).toBe(200);
      expect(res.body.period).toBe('7d');
      expect(Array.isArray(res.body.providers)).toBe(true);
    });
  });
});
```

**Step 3: Run tests**

```bash
cd cloud-run-api && npm test -- dashboard.test.js
```

**Step 4: Commit**

```bash
git add cloud-run-api/src/routes/admin/dashboard.js cloud-run-api/tests/routes/admin/dashboard.test.js
git commit -m "feat(admin): add /v1/admin/dashboard routes (overview, quick-stats, ai-usage)"
```

---

## Task 2: admin/drivers.js (9 endpoints)

**Files:**
- Create: `cloud-run-api/src/routes/admin/drivers.js`
- Test: `cloud-run-api/tests/routes/admin/drivers.test.js`

**Step 1: Create the route file**

```javascript
import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { buildSelectQuery, buildCountQuery, buildWhereClause } from '../../db/query.js';
import { insertLog, insertAuditEvent } from '../../db/bigquery.js';

const router = Router();

function formatRecord(row) {
  if (!row) return null;
  const { _id, airtable_id, _created_at, _updated_at, data } = row;
  return { _id, airtable_id, _createdAt: _created_at, _updatedAt: _updated_at, ...data };
}

function handleError(res, context, err) {
  console.error(`[admin/drivers] ${context}:`, err.message);
  insertLog({ service: 'admin', level: 'ERROR', message: `drivers/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── POST /drivers/query ──
router.post('/query', async (req, res) => {
  try {
    const { filters = [], limit = 50, skip = 0, sort = [], search } = req.body;

    const table = getTableName('driverProfiles');
    const allFilters = [...filters];
    if (search) {
      allFilters.push({ field: 'full_name', operator: 'contains', value: search });
    }

    const selectQ = buildSelectQuery(table, { filters: allFilters, limit, skip, sort });
    const countQ = buildCountQuery(table, { filters: allFilters });

    const [data, count] = await Promise.all([
      query(selectQ.sql, selectQ.params),
      query(countQ.sql, countQ.params),
    ]);

    return res.json({
      records: data.rows.map(formatRecord),
      total: parseInt(count.rows[0].count, 10),
      page: { limit, skip },
    });
  } catch (err) {
    return handleError(res, 'query', err);
  }
});

// ── GET /drivers/stats ──
router.get('/stats', async (req, res) => {
  try {
    const table = getTableName('driverProfiles');
    const result = await query(`SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE data->>'status' = 'active') AS active,
      COUNT(*) FILTER (WHERE data->>'status' = 'pending') AS pending,
      COUNT(*) FILTER (WHERE data->>'cdl_expiry' IS NOT NULL AND (data->>'cdl_expiry')::date < NOW()) AS expired,
      COUNT(*) FILTER (WHERE _created_at >= NOW() - INTERVAL '7 days') AS new_this_week
      FROM "${table}"`);

    const r = result.rows[0];
    return res.json({
      total: parseInt(r.total, 10),
      active: parseInt(r.active, 10),
      pending: parseInt(r.pending, 10),
      expired: parseInt(r.expired, 10),
      newThisWeek: parseInt(r.new_this_week, 10),
    });
  } catch (err) {
    return handleError(res, 'stats', err);
  }
});

// ── GET /drivers/analytics?period=30d ──
router.get('/analytics', async (req, res) => {
  try {
    const days = parseInt(req.query.period) || 30;
    const table = getTableName('driverProfiles');
    const result = await query(
      `SELECT DATE(_created_at) AS day, COUNT(*) AS registrations
       FROM "${table}"
       WHERE _created_at >= NOW() - make_interval(days => $1)
       GROUP BY DATE(_created_at)
       ORDER BY day`,
      [days]
    );

    return res.json({
      period: `${days}d`,
      daily: result.rows.map(r => ({ date: r.day, count: parseInt(r.registrations, 10) })),
    });
  } catch (err) {
    return handleError(res, 'analytics', err);
  }
});

// ── GET /drivers/export?status=active ──
router.get('/export', async (req, res) => {
  try {
    const table = getTableName('driverProfiles');
    const filters = [];
    if (req.query.status) filters.push({ field: 'status', operator: 'eq', value: req.query.status });

    const { sql: whereSql, params } = buildWhereClause(filters);
    let sql = `SELECT _id, data FROM "${table}"`;
    if (whereSql) sql += ` WHERE ${whereSql}`;
    sql += ' ORDER BY _created_at DESC LIMIT 10000';

    const result = await query(sql, params);
    const rows = result.rows.map(r => ({
      id: r._id,
      name: r.data?.full_name || '',
      email: r.data?.email || '',
      phone: r.data?.phone || '',
      cdl_class: r.data?.cdl_class || '',
      status: r.data?.status || '',
      state: r.data?.state || '',
      experience_years: r.data?.years_experience || '',
    }));

    const header = 'id,name,email,phone,cdl_class,status,state,experience_years';
    const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="drivers_export.csv"');
    return res.send(csv);
  } catch (err) {
    return handleError(res, 'export', err);
  }
});

// ── GET /drivers/:id ──
router.get('/:id', async (req, res) => {
  try {
    const table = getTableName('driverProfiles');
    const interestsTable = getTableName('driverCarrierInterests');
    const matchesTable = getTableName('matchEvents');

    const [driver, apps, matches] = await Promise.all([
      query(`SELECT * FROM "${table}" WHERE _id = $1`, [req.params.id]),
      query(`SELECT _id, data, _created_at FROM "${interestsTable}" WHERE data->>'driver_id' = $1 ORDER BY _created_at DESC LIMIT 20`, [req.params.id]),
      query(`SELECT _id, data, _created_at FROM "${matchesTable}" WHERE data->>'driver_id' = $1 ORDER BY _created_at DESC LIMIT 20`, [req.params.id]),
    ]);

    if (driver.rows.length === 0) {
      return res.status(404).json({ error: 'DRIVER_NOT_FOUND', message: `No driver with id ${req.params.id}` });
    }

    return res.json({
      driver: formatRecord(driver.rows[0]),
      applications: apps.rows.map(formatRecord),
      matchHistory: matches.rows.map(formatRecord),
    });
  } catch (err) {
    return handleError(res, 'detail', err);
  }
});

// ── PUT /drivers/:id/status ──
router.put('/:id/status', async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });

    const table = getTableName('driverProfiles');
    const before = await query(`SELECT data FROM "${table}" WHERE _id = $1`, [req.params.id]);
    if (before.rows.length === 0) return res.status(404).json({ error: 'DRIVER_NOT_FOUND' });

    const oldStatus = before.rows[0].data?.status;
    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.id, JSON.stringify({ status, status_reason: reason, status_changed_at: new Date().toISOString() })]
    );

    insertAuditEvent({
      actor_id: req.auth.uid,
      actor_role: req.auth.role || 'admin',
      action: 'ADMIN_UPDATE_DRIVER_STATUS',
      resource_type: 'driver',
      resource_id: req.params.id,
      before_state: { status: oldStatus },
      after_state: { status, reason },
    });

    return res.json({ driver: formatRecord(result.rows[0]) });
  } catch (err) {
    return handleError(res, 'update-status', err);
  }
});

// ── POST /drivers/:id/verify ──
router.post('/:id/verify', async (req, res) => {
  try {
    const table = getTableName('driverProfiles');
    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.id, JSON.stringify({ status: 'active', verification_status: 'verified', verified_at: new Date().toISOString() })]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'DRIVER_NOT_FOUND' });

    insertAuditEvent({
      actor_id: req.auth.uid, actor_role: 'admin',
      action: 'ADMIN_VERIFY_DRIVER', resource_type: 'driver', resource_id: req.params.id,
      after_state: { status: 'active', verification_status: 'verified' },
    });

    return res.json({ driver: formatRecord(result.rows[0]) });
  } catch (err) {
    return handleError(res, 'verify', err);
  }
});

// ── POST /drivers/:id/suspend ──
router.post('/:id/suspend', async (req, res) => {
  try {
    const { reason } = req.body;
    const table = getTableName('driverProfiles');
    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.id, JSON.stringify({ status: 'suspended', suspension_reason: reason, suspended_at: new Date().toISOString() })]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'DRIVER_NOT_FOUND' });

    insertAuditEvent({
      actor_id: req.auth.uid, actor_role: 'admin',
      action: 'ADMIN_SUSPEND_DRIVER', resource_type: 'driver', resource_id: req.params.id,
      after_state: { status: 'suspended', reason },
    });

    return res.json({ driver: formatRecord(result.rows[0]) });
  } catch (err) {
    return handleError(res, 'suspend', err);
  }
});

// ── POST /drivers/bulk ──
router.post('/bulk', async (req, res) => {
  try {
    const { driverIds, action } = req.body;
    if (!Array.isArray(driverIds) || driverIds.length === 0) {
      return res.status(400).json({ error: 'driverIds array required' });
    }
    if (!['verify', 'suspend', 'activate'].includes(action)) {
      return res.status(400).json({ error: 'action must be verify, suspend, or activate' });
    }

    const table = getTableName('driverProfiles');
    const statusMap = { verify: 'active', suspend: 'suspended', activate: 'active' };
    const newStatus = statusMap[action];
    const extraFields = action === 'verify'
      ? { verification_status: 'verified', verified_at: new Date().toISOString() }
      : {};

    const results = [];
    for (const id of driverIds.slice(0, 100)) {
      try {
        await query(
          `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1`,
          [id, JSON.stringify({ status: newStatus, ...extraFields })]
        );
        results.push({ id, success: true });
      } catch (err) {
        results.push({ id, success: false, error: err.message });
      }
    }

    insertAuditEvent({
      actor_id: req.auth.uid, actor_role: 'admin',
      action: `ADMIN_BULK_${action.toUpperCase()}`,
      resource_type: 'driver',
      after_state: { driverIds, action, results: results.length },
    });

    return res.json({ processed: results.length, results });
  } catch (err) {
    return handleError(res, 'bulk', err);
  }
});

export default router;
```

**Step 2: Create test file**

```javascript
import request from 'supertest';
import express from 'express';
import driversRouter from '../../../src/routes/admin/drivers.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.auth = { uid: 'test-admin', role: 'admin', type: 'firebase' };
    next();
  });
  app.use('/v1/admin/drivers', driversRouter);
  return app;
}

describe('Admin Drivers Routes', () => {
  let app;
  beforeAll(() => { app = createTestApp(); });

  describe('POST /v1/admin/drivers/query', () => {
    it('returns paginated driver list', async () => {
      const res = await request(app)
        .post('/v1/admin/drivers/query')
        .send({ limit: 10, skip: 0 });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.records)).toBe(true);
      expect(typeof res.body.total).toBe('number');
    });
  });

  describe('GET /v1/admin/drivers/stats', () => {
    it('returns driver counts', async () => {
      const res = await request(app).get('/v1/admin/drivers/stats');
      expect(res.status).toBe(200);
      expect(typeof res.body.total).toBe('number');
      expect(typeof res.body.active).toBe('number');
    });
  });
});
```

**Step 3: Run tests and commit**

```bash
cd cloud-run-api && npm test -- drivers.test.js
git add cloud-run-api/src/routes/admin/drivers.js cloud-run-api/tests/routes/admin/drivers.test.js
git commit -m "feat(admin): add /v1/admin/drivers routes (query, stats, detail, verify, suspend, bulk, export)"
```

---

## Task 3: admin/carriers.js (3 endpoints)

**Files:**
- Create: `cloud-run-api/src/routes/admin/carriers.js`
- Test: `cloud-run-api/tests/routes/admin/carriers.test.js`

**Step 1: Create route file**

```javascript
import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { buildSelectQuery, buildCountQuery } from '../../db/query.js';
import { insertLog } from '../../db/bigquery.js';

const router = Router();

function formatRecord(row) {
  if (!row) return null;
  const { _id, airtable_id, _created_at, _updated_at, data } = row;
  return { _id, airtable_id, _createdAt: _created_at, _updatedAt: _updated_at, ...data };
}

function handleError(res, context, err) {
  console.error(`[admin/carriers] ${context}:`, err.message);
  insertLog({ service: 'admin', level: 'ERROR', message: `carriers/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── POST /carriers/query ──
router.post('/query', async (req, res) => {
  try {
    const { filters = [], limit = 50, skip = 0, sort = [], search } = req.body;
    const table = getTableName('carriers');
    const allFilters = [...filters];
    if (search) allFilters.push({ field: 'company_name', operator: 'contains', value: search });

    const selectQ = buildSelectQuery(table, { filters: allFilters, limit, skip, sort });
    const countQ = buildCountQuery(table, { filters: allFilters });

    const [data, count] = await Promise.all([
      query(selectQ.sql, selectQ.params),
      query(countQ.sql, countQ.params),
    ]);

    return res.json({
      records: data.rows.map(formatRecord),
      total: parseInt(count.rows[0].count, 10),
      page: { limit, skip },
    });
  } catch (err) {
    return handleError(res, 'query', err);
  }
});

// ── GET /carriers/stats ──
router.get('/stats', async (req, res) => {
  try {
    const carriersTable = getTableName('carriers');
    const enrichTable = getTableName('carrierEnrichments');

    const [carriers, enrichments] = await Promise.all([
      query(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE data->>'status' = 'active') AS active,
        COUNT(*) FILTER (WHERE data->>'flagged' = 'true') AS flagged
        FROM "${carriersTable}"`),
      query(`SELECT COUNT(*) AS total FROM "${enrichTable}"`),
    ]);

    const c = carriers.rows[0];
    const total = parseInt(c.total, 10) || 1;
    const enrichCount = parseInt(enrichments.rows[0]?.total, 10) || 0;

    return res.json({
      total: parseInt(c.total, 10),
      active: parseInt(c.active, 10),
      flagged: parseInt(c.flagged, 10),
      enrichmentCoverage: Math.round((enrichCount / total) * 100),
    });
  } catch (err) {
    return handleError(res, 'stats', err);
  }
});

// ── GET /carriers/:id ──
router.get('/:id', async (req, res) => {
  try {
    const carriersTable = getTableName('carriers');
    const safetyTable = getTableName('carrierSafetyData');
    const enrichTable = getTableName('carrierEnrichments');
    const matchesTable = getTableName('matchEvents');
    const interestsTable = getTableName('driverCarrierInterests');

    const [carrier, safety, enrichment, matches, interests] = await Promise.all([
      query(`SELECT * FROM "${carriersTable}" WHERE _id = $1`, [req.params.id]),
      query(`SELECT * FROM "${safetyTable}" WHERE data->>'carrier_id' = $1 LIMIT 1`, [req.params.id]),
      query(`SELECT * FROM "${enrichTable}" WHERE data->>'carrier_id' = $1 LIMIT 1`, [req.params.id]),
      query(`SELECT _id, data, _created_at FROM "${matchesTable}" WHERE data->>'carrier_id' = $1 ORDER BY _created_at DESC LIMIT 20`, [req.params.id]),
      query(`SELECT _id, data, _created_at FROM "${interestsTable}" WHERE data->>'carrier_id' = $1 ORDER BY _created_at DESC LIMIT 20`, [req.params.id]),
    ]);

    if (carrier.rows.length === 0) {
      return res.status(404).json({ error: 'CARRIER_NOT_FOUND', message: `No carrier with id ${req.params.id}` });
    }

    return res.json({
      carrier: formatRecord(carrier.rows[0]),
      safety: formatRecord(safety.rows[0]),
      enrichment: formatRecord(enrichment.rows[0]),
      recentMatches: matches.rows.map(formatRecord),
      driverInterests: interests.rows.map(formatRecord),
    });
  } catch (err) {
    return handleError(res, 'detail', err);
  }
});

export default router;
```

**Step 2: Test + commit** (same pattern as Task 1/2, test GET /stats and POST /query)

```bash
git commit -m "feat(admin): add /v1/admin/carriers routes (query, stats, detail)"
```

---

## Task 4: admin/matches.js (5 endpoints)

**Files:**
- Create: `cloud-run-api/src/routes/admin/matches.js`
- Test: `cloud-run-api/tests/routes/admin/matches.test.js`

**Step 1: Create route file**

```javascript
import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { buildSelectQuery, buildCountQuery, buildWhereClause } from '../../db/query.js';
import { insertLog } from '../../db/bigquery.js';

const router = Router();

function formatRecord(row) {
  if (!row) return null;
  const { _id, airtable_id, _created_at, _updated_at, data } = row;
  return { _id, airtable_id, _createdAt: _created_at, _updatedAt: _updated_at, ...data };
}

function handleError(res, context, err) {
  console.error(`[admin/matches] ${context}:`, err.message);
  insertLog({ service: 'admin', level: 'ERROR', message: `matches/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── POST /matches/query ──
router.post('/query', async (req, res) => {
  try {
    const { filters = [], limit = 50, skip = 0, sort = [] } = req.body;
    const table = getTableName('matchEvents');
    const selectQ = buildSelectQuery(table, { filters, limit, skip, sort });
    const countQ = buildCountQuery(table, { filters });
    const [data, count] = await Promise.all([query(selectQ.sql, selectQ.params), query(countQ.sql, countQ.params)]);
    return res.json({ records: data.rows.map(formatRecord), total: parseInt(count.rows[0].count, 10), page: { limit, skip } });
  } catch (err) { return handleError(res, 'query', err); }
});

// ── POST /matches/interests ──
router.post('/interests', async (req, res) => {
  try {
    const { filters = [], limit = 50, skip = 0 } = req.body;
    const table = getTableName('driverCarrierInterests');
    const selectQ = buildSelectQuery(table, { filters, limit, skip });
    const countQ = buildCountQuery(table, { filters });
    const [data, count] = await Promise.all([query(selectQ.sql, selectQ.params), query(countQ.sql, countQ.params)]);
    return res.json({ records: data.rows.map(formatRecord), total: parseInt(count.rows[0].count, 10), page: { limit, skip } });
  } catch (err) { return handleError(res, 'interests', err); }
});

// ── GET /matches/stats ──
router.get('/stats', async (req, res) => {
  try {
    const matchTable = getTableName('matchEvents');
    const interestTable = getTableName('driverCarrierInterests');
    const [weeklyMatches, totalMatches, totalInterests] = await Promise.all([
      query(`SELECT COUNT(*) AS cnt FROM "${matchTable}" WHERE _created_at >= NOW() - INTERVAL '7 days'`),
      query(`SELECT COUNT(*) AS cnt FROM "${matchTable}"`),
      query(`SELECT COUNT(*) AS cnt FROM "${interestTable}"`),
    ]);
    const weekly = parseInt(weeklyMatches.rows[0].cnt, 10);
    const total = parseInt(totalMatches.rows[0].cnt, 10);
    const interests = parseInt(totalInterests.rows[0].cnt, 10);
    return res.json({
      weeklyMatches: weekly, totalMatches: total, totalInterests: interests,
      conversionRate: total > 0 ? Math.round((interests / total) * 100) : 0,
      dailyAverage: Math.round(weekly / 7),
    });
  } catch (err) { return handleError(res, 'stats', err); }
});

// ── GET /matches/export ──
router.get('/export', async (req, res) => {
  try {
    const table = getTableName('matchEvents');
    const result = await query(`SELECT _id, data, _created_at FROM "${table}" ORDER BY _created_at DESC LIMIT 10000`);
    const rows = result.rows.map(r => ({
      id: r._id, driver_id: r.data?.driver_id || '', carrier_id: r.data?.carrier_id || '',
      score: r.data?.score || '', action: r.data?.action || '', date: r._created_at,
    }));
    const header = 'id,driver_id,carrier_id,score,action,date';
    const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="matches_export.csv"');
    return res.send(csv);
  } catch (err) { return handleError(res, 'export', err); }
});

// ── GET /matches/:id ──
router.get('/:id', async (req, res) => {
  try {
    const table = getTableName('matchEvents');
    const result = await query(`SELECT * FROM "${table}" WHERE _id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'MATCH_NOT_FOUND' });

    const match = formatRecord(result.rows[0]);
    const driverId = match.driver_id;
    const carrierId = match.carrier_id;

    const [driver, carrier] = await Promise.all([
      driverId ? query(`SELECT * FROM "${getTableName('driverProfiles')}" WHERE _id = $1`, [driverId]) : { rows: [] },
      carrierId ? query(`SELECT * FROM "${getTableName('carriers')}" WHERE _id = $1`, [carrierId]) : { rows: [] },
    ]);

    return res.json({
      match,
      driver: formatRecord(driver.rows[0]),
      carrier: formatRecord(carrier.rows[0]),
    });
  } catch (err) { return handleError(res, 'detail', err); }
});

export default router;
```

**Step 2: Test + commit**

```bash
git commit -m "feat(admin): add /v1/admin/matches routes (query, interests, stats, export, detail)"
```

---

## Task 5: admin/config.js (6 endpoints)

**Files:**
- Create: `cloud-run-api/src/routes/admin/config.js`
- Test: `cloud-run-api/tests/routes/admin/config.test.js`

```javascript
import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { insertLog, insertAuditEvent } from '../../db/bigquery.js';

const router = Router();

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
  const result = await query(`SELECT data FROM "${table}" WHERE data->>'setting_key' = $1 LIMIT 1`, [key]);
  if (result.rows.length === 0) return null;
  const val = result.rows[0].data?.value;
  return typeof val === 'string' ? JSON.parse(val) : val;
}

async function setSetting(key, value, actorId) {
  const table = getTableName('platformSettings');
  const existing = await query(`SELECT _id FROM "${table}" WHERE data->>'setting_key' = $1 LIMIT 1`, [key]);
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
```

**Commit:** `git commit -m "feat(admin): add /v1/admin/config routes (matching-weights, system, tiers)"`

---

## Task 6: admin/observability.js (8 endpoints)

**Files:**
- Create: `cloud-run-api/src/routes/admin/observability.js`
- Test: `cloud-run-api/tests/routes/admin/observability.test.js`

```javascript
import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { buildSelectQuery, buildCountQuery } from '../../db/query.js';
import { insertLog, insertAuditEvent } from '../../db/bigquery.js';
import crypto from 'crypto';

const router = Router();

function formatRecord(row) {
  if (!row) return null;
  const { _id, airtable_id, _created_at, _updated_at, data } = row;
  return { _id, airtable_id, _createdAt: _created_at, _updatedAt: _updated_at, ...data };
}

function handleError(res, context, err) {
  console.error(`[admin/observability] ${context}:`, err.message);
  insertLog({ service: 'admin', level: 'ERROR', message: `observability/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── POST /observability/logs ──
router.post('/logs', async (req, res) => {
  try {
    const { filters = [], limit = 100, skip = 0 } = req.body;
    const table = getTableName('systemLogs');
    const selectQ = buildSelectQuery(table, { filters, limit, skip, sort: [{ field: '_created_at', direction: 'desc' }] });
    const countQ = buildCountQuery(table, { filters });
    const [data, count] = await Promise.all([query(selectQ.sql, selectQ.params), query(countQ.sql, countQ.params)]);
    return res.json({ records: data.rows.map(formatRecord), total: parseInt(count.rows[0].count, 10), page: { limit, skip } });
  } catch (err) { return handleError(res, 'logs', err); }
});

// ── GET /observability/anomalies ──
router.get('/anomalies', async (req, res) => {
  try {
    const table = getTableName('anomalyAlerts');
    const result = await query(`SELECT * FROM "${table}" WHERE data->>'status' != 'resolved' ORDER BY _created_at DESC LIMIT 50`);
    return res.json({ anomalies: result.rows.map(formatRecord) });
  } catch (err) { return handleError(res, 'anomalies', err); }
});

// ── POST /observability/anomalies/:id/ack ──
router.post('/anomalies/:id/ack', async (req, res) => {
  try {
    const table = getTableName('anomalyAlerts');
    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.id, JSON.stringify({ status: 'acknowledged', acknowledged_at: new Date().toISOString(), acknowledged_by: req.auth.uid })]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'ANOMALY_NOT_FOUND' });
    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_ACK_ANOMALY', resource_type: 'anomaly', resource_id: req.params.id });
    return res.json({ anomaly: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'ack-anomaly', err); }
});

// ── POST /observability/anomalies/:id/resolve ──
router.post('/anomalies/:id/resolve', async (req, res) => {
  try {
    const table = getTableName('anomalyAlerts');
    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.id, JSON.stringify({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: req.auth.uid, resolution: req.body.resolution })]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'ANOMALY_NOT_FOUND' });
    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_RESOLVE_ANOMALY', resource_type: 'anomaly', resource_id: req.params.id });
    return res.json({ anomaly: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'resolve-anomaly', err); }
});

// ── CRUD for anomaly rules ──
router.get('/rules', async (req, res) => {
  try {
    const table = getTableName('anomalyRules');
    const result = await query(`SELECT * FROM "${table}" ORDER BY _created_at DESC`);
    return res.json({ rules: result.rows.map(formatRecord) });
  } catch (err) { return handleError(res, 'get-rules', err); }
});

router.post('/rules', async (req, res) => {
  try {
    const table = getTableName('anomalyRules');
    const id = `rule_${crypto.randomUUID()}`;
    const result = await query(
      `INSERT INTO "${table}" (_id, airtable_id, data, _created_at, _updated_at) VALUES ($1, $1, $2, NOW(), NOW()) RETURNING *`,
      [id, JSON.stringify(req.body)]
    );
    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_CREATE_RULE', resource_type: 'anomaly_rule', resource_id: id });
    return res.status(201).json({ rule: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'create-rule', err); }
});

router.put('/rules/:id', async (req, res) => {
  try {
    const table = getTableName('anomalyRules');
    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.id, JSON.stringify(req.body)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'RULE_NOT_FOUND' });
    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_UPDATE_RULE', resource_type: 'anomaly_rule', resource_id: req.params.id });
    return res.json({ rule: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'update-rule', err); }
});

router.delete('/rules/:id', async (req, res) => {
  try {
    const table = getTableName('anomalyRules');
    const result = await query(`DELETE FROM "${table}" WHERE _id = $1 RETURNING _id`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'RULE_NOT_FOUND' });
    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_DELETE_RULE', resource_type: 'anomaly_rule', resource_id: req.params.id });
    return res.json({ deleted: true, _id: req.params.id });
  } catch (err) { return handleError(res, 'delete-rule', err); }
});

export default router;
```

**Commit:** `git commit -m "feat(admin): add /v1/admin/observability routes (logs, anomalies, rules CRUD)"`

---

## Task 7: admin/ai-router.js (6 endpoints)

**Files:** Create `cloud-run-api/src/routes/admin/ai-router.js`

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
    const result = await query(`SELECT * FROM "${table}" ORDER BY _created_at DESC LIMIT 50`);
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
    const result = await query(
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
    const result = await query(`SELECT data FROM "${table}" WHERE data->>'setting_key' = 'cost_optimizer_config' LIMIT 1`);
    const config = result.rows[0]?.data?.value ? JSON.parse(result.rows[0].data.value) : { enabled: false, mode: 'balanced' };
    return res.json(config);
  } catch (err) { return handleError(res, 'get-optimizer', err); }
});

router.put('/optimizer', async (req, res) => {
  try {
    const table = getTableName('platformSettings');
    const existing = await query(`SELECT _id FROM "${table}" WHERE data->>'setting_key' = 'cost_optimizer_config' LIMIT 1`);
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
```

**Commit:** `git commit -m "feat(admin): add /v1/admin/ai-router routes (config, test, costs, optimizer)"`

---

## Task 8: admin/audit.js (5 endpoints)

**Files:** Create `cloud-run-api/src/routes/admin/audit.js`

```javascript
import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { buildSelectQuery, buildCountQuery } from '../../db/query.js';
import { insertLog } from '../../db/bigquery.js';

const router = Router();

function formatRecord(row) {
  if (!row) return null;
  const { _id, airtable_id, _created_at, _updated_at, data } = row;
  return { _id, airtable_id, _createdAt: _created_at, _updatedAt: _updated_at, ...data };
}

function handleError(res, context, err) {
  console.error(`[admin/audit] ${context}:`, err.message);
  insertLog({ service: 'admin', level: 'ERROR', message: `audit/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

router.post('/query', async (req, res) => {
  try {
    const { filters = [], limit = 50, skip = 0, sort = [] } = req.body;
    const table = getTableName('auditLog');
    const selectQ = buildSelectQuery(table, { filters, limit, skip, sort: sort.length ? sort : [{ field: '_created_at', direction: 'desc' }] });
    const countQ = buildCountQuery(table, { filters });
    const [data, count] = await Promise.all([query(selectQ.sql, selectQ.params), query(countQ.sql, countQ.params)]);
    return res.json({ records: data.rows.map(formatRecord), total: parseInt(count.rows[0].count, 10), page: { limit, skip } });
  } catch (err) { return handleError(res, 'query', err); }
});

router.get('/stats', async (req, res) => {
  try {
    const table = getTableName('auditLog');
    const [today, week, month, topAdmins, topActions] = await Promise.all([
      query(`SELECT COUNT(*) AS cnt FROM "${table}" WHERE _created_at >= CURRENT_DATE`),
      query(`SELECT COUNT(*) AS cnt FROM "${table}" WHERE _created_at >= NOW() - INTERVAL '7 days'`),
      query(`SELECT COUNT(*) AS cnt FROM "${table}" WHERE _created_at >= NOW() - INTERVAL '30 days'`),
      query(`SELECT data->>'admin_email' AS admin, COUNT(*) AS cnt FROM "${table}" WHERE _created_at >= NOW() - INTERVAL '30 days' GROUP BY data->>'admin_email' ORDER BY cnt DESC LIMIT 5`),
      query(`SELECT data->>'action' AS action, COUNT(*) AS cnt FROM "${table}" WHERE _created_at >= NOW() - INTERVAL '30 days' GROUP BY data->>'action' ORDER BY cnt DESC LIMIT 5`),
    ]);
    return res.json({
      today: parseInt(today.rows[0].cnt, 10),
      thisWeek: parseInt(week.rows[0].cnt, 10),
      thisMonth: parseInt(month.rows[0].cnt, 10),
      topAdmins: topAdmins.rows.map(r => ({ admin: r.admin, count: parseInt(r.cnt, 10) })),
      topActions: topActions.rows.map(r => ({ action: r.action, count: parseInt(r.cnt, 10) })),
    });
  } catch (err) { return handleError(res, 'stats', err); }
});

router.get('/export', async (req, res) => {
  try {
    const table = getTableName('auditLog');
    const result = await query(`SELECT _id, data, _created_at FROM "${table}" ORDER BY _created_at DESC LIMIT 10000`);
    const rows = result.rows.map(r => ({
      id: r._id, action: r.data?.action || '', admin: r.data?.admin_email || '',
      target_type: r.data?.target_type || '', target_id: r.data?.target_id || '', date: r._created_at,
    }));
    const header = 'id,action,admin,target_type,target_id,date';
    const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit_export.csv"');
    return res.send(csv);
  } catch (err) { return handleError(res, 'export', err); }
});

router.post('/reports/generate', async (req, res) => {
  try {
    const { type = 'full_audit', startDate, endDate } = req.body;
    const table = getTableName('auditLog');
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);

    const result = await query(
      `SELECT data->>'action' AS action, COUNT(*) AS cnt
       FROM "${table}"
       WHERE _created_at >= $1 AND _created_at <= $2
       GROUP BY data->>'action'
       ORDER BY cnt DESC`,
      [start, end]
    );

    return res.json({
      type, period: { start, end },
      summary: result.rows.map(r => ({ action: r.action, count: parseInt(r.cnt, 10) })),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { return handleError(res, 'generate-report', err); }
});

router.get('/:id', async (req, res) => {
  try {
    const table = getTableName('auditLog');
    const result = await query(`SELECT * FROM "${table}" WHERE _id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'AUDIT_ENTRY_NOT_FOUND' });
    return res.json({ entry: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'detail', err); }
});

export default router;
```

**Commit:** `git commit -m "feat(admin): add /v1/admin/audit routes (query, stats, export, reports, detail)"`

---

## Task 9: admin/billing.js (12 endpoints)

**Files:** Create `cloud-run-api/src/routes/admin/billing.js`

```javascript
import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { buildSelectQuery, buildCountQuery } from '../../db/query.js';
import { insertLog, insertAuditEvent } from '../../db/bigquery.js';
import crypto from 'crypto';

const router = Router();

const TIER_PRICES = { free: 0, pro: 249, enterprise: 749 };

function formatRecord(row) {
  if (!row) return null;
  const { _id, airtable_id, _created_at, _updated_at, data } = row;
  return { _id, airtable_id, _createdAt: _created_at, _updatedAt: _updated_at, ...data };
}

function handleError(res, context, err) {
  console.error(`[admin/billing] ${context}:`, err.message);
  insertLog({ service: 'admin', level: 'ERROR', message: `billing/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

let revenueCache = null;
let revenueCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

// ── Revenue endpoints ──
router.get('/revenue/snapshot', async (req, res) => {
  try {
    const now = Date.now();
    if (revenueCache && (now - revenueCacheTime) < CACHE_TTL) return res.json(revenueCache);

    const subsTable = getTableName('carrierSubscriptions');
    const result = await query(`SELECT data->>'tier' AS tier, COUNT(*) AS cnt FROM "${subsTable}" WHERE data->>'status' = 'active' GROUP BY data->>'tier'`);

    let mrr = 0;
    const planMix = [];
    for (const r of result.rows) {
      const tier = r.tier || 'free';
      const count = parseInt(r.cnt, 10);
      mrr += (TIER_PRICES[tier] || 0) * count;
      planMix.push({ tier, count, price: TIER_PRICES[tier] || 0 });
    }

    const totalActive = planMix.reduce((s, p) => s + p.count, 0) || 1;
    const snapshot = { mrr, arr: mrr * 12, arpu: Math.round(mrr / totalActive), planMix };
    revenueCache = snapshot;
    revenueCacheTime = now;
    return res.json(snapshot);
  } catch (err) { return handleError(res, 'revenue-snapshot', err); }
});

router.get('/revenue/trend', async (req, res) => {
  try {
    const metricsTable = getTableName('revenueMetrics');
    const result = await query(`SELECT data, _created_at FROM "${metricsTable}" ORDER BY _created_at DESC LIMIT 90`);
    return res.json({ trend: result.rows.map(formatRecord) });
  } catch (err) { return handleError(res, 'revenue-trend', err); }
});

router.get('/revenue/churn', async (req, res) => {
  try {
    const subsTable = getTableName('carrierSubscriptions');
    const result = await query(
      `SELECT data->>'tier' AS tier,
        COUNT(*) FILTER (WHERE data->>'status' = 'cancelled' AND _updated_at >= NOW() - INTERVAL '30 days') AS churned,
        COUNT(*) AS total
      FROM "${subsTable}" GROUP BY data->>'tier'`
    );
    return res.json({
      byTier: result.rows.map(r => ({
        tier: r.tier, churned: parseInt(r.churned, 10), total: parseInt(r.total, 10),
        rate: parseInt(r.total, 10) > 0 ? Math.round((parseInt(r.churned, 10) / parseInt(r.total, 10)) * 100) : 0,
      })),
    });
  } catch (err) { return handleError(res, 'churn', err); }
});

router.get('/revenue/forecast', async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const subsTable = getTableName('carrierSubscriptions');
    const result = await query(`SELECT data->>'tier' AS tier, COUNT(*) AS cnt FROM "${subsTable}" WHERE data->>'status' = 'active' GROUP BY data->>'tier'`);
    let currentMrr = 0;
    for (const r of result.rows) currentMrr += (TIER_PRICES[r.tier] || 0) * parseInt(r.cnt, 10);

    const forecast = [];
    for (let i = 1; i <= months; i++) {
      const projected = Math.round(currentMrr * (1 + 0.05 * i)); // 5% monthly growth assumption
      forecast.push({ month: i, mrr: projected, arr: projected * 12 });
    }
    return res.json({ currentMrr, forecast });
  } catch (err) { return handleError(res, 'forecast', err); }
});

// ── Billing customer ──
router.get('/customer/:dot', async (req, res) => {
  try {
    const carriersTable = getTableName('carriers');
    const subsTable = getTableName('carrierSubscriptions');
    const billingTable = getTableName('billingHistory');

    const [carrier, sub, history] = await Promise.all([
      query(`SELECT * FROM "${carriersTable}" WHERE data->>'dot_number' = $1 LIMIT 1`, [req.params.dot]),
      query(`SELECT * FROM "${subsTable}" WHERE data->>'carrier_dot' = $1 LIMIT 1`, [req.params.dot]),
      query(`SELECT _id, data, _created_at FROM "${billingTable}" WHERE data->>'carrier_dot' = $1 ORDER BY _created_at DESC LIMIT 20`, [req.params.dot]),
    ]);

    if (carrier.rows.length === 0) return res.status(404).json({ error: 'CARRIER_NOT_FOUND' });
    return res.json({ carrier: formatRecord(carrier.rows[0]), subscription: formatRecord(sub.rows[0]), history: history.rows.map(formatRecord) });
  } catch (err) { return handleError(res, 'customer', err); }
});

// ── Adjustments ──
router.post('/adjustments', async (req, res) => {
  try {
    const { carrierDot, type, amount, reason } = req.body;
    if (!carrierDot || !type || !amount) return res.status(400).json({ error: 'carrierDot, type, amount required' });

    const table = getTableName('billingHistory');
    const id = `adj_${crypto.randomUUID()}`;
    const result = await query(
      `INSERT INTO "${table}" (_id, airtable_id, data, _created_at, _updated_at) VALUES ($1, $1, $2, NOW(), NOW()) RETURNING *`,
      [id, JSON.stringify({ carrier_dot: carrierDot, type, amount, reason, created_by: req.auth.uid })]
    );

    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_CREATE_ADJUSTMENT', resource_type: 'billing', resource_id: id, after_state: { carrierDot, type, amount } });
    return res.status(201).json({ adjustment: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'create-adjustment', err); }
});

// ── Invoices ──
router.post('/invoices', async (req, res) => {
  try {
    const table = getTableName('invoices');
    const id = `inv_${crypto.randomUUID()}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const data = { ...req.body, invoice_number: invoiceNumber, status: 'draft', created_by: req.auth.uid };
    const result = await query(
      `INSERT INTO "${table}" (_id, airtable_id, data, _created_at, _updated_at) VALUES ($1, $1, $2, NOW(), NOW()) RETURNING *`,
      [id, JSON.stringify(data)]
    );
    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_CREATE_INVOICE', resource_type: 'invoice', resource_id: id });
    return res.status(201).json({ invoice: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'create-invoice', err); }
});

router.get('/invoices/:id', async (req, res) => {
  try {
    const table = getTableName('invoices');
    const result = await query(`SELECT * FROM "${table}" WHERE _id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'INVOICE_NOT_FOUND' });
    return res.json({ invoice: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'get-invoice', err); }
});

router.put('/invoices/:id', async (req, res) => {
  try {
    const table = getTableName('invoices');
    const existing = await query(`SELECT data FROM "${table}" WHERE _id = $1`, [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'INVOICE_NOT_FOUND' });
    if (existing.rows[0].data?.status !== 'draft') return res.status(400).json({ error: 'Only draft invoices can be edited' });

    const result = await query(`UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`, [req.params.id, JSON.stringify(req.body)]);
    return res.json({ invoice: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'update-invoice', err); }
});

router.post('/invoices/:id/send', async (req, res) => {
  try {
    const table = getTableName('invoices');
    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.id, JSON.stringify({ status: 'sent', sent_at: new Date().toISOString() })]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'INVOICE_NOT_FOUND' });
    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_SEND_INVOICE', resource_type: 'invoice', resource_id: req.params.id });
    return res.json({ invoice: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'send-invoice', err); }
});

// ── Commissions ──
router.get('/commissions', async (req, res) => {
  try {
    const rulesTable = getTableName('commissionRules');
    const repsTable = getTableName('salesReps');
    const [rules, reps] = await Promise.all([
      query(`SELECT * FROM "${rulesTable}" ORDER BY _created_at`),
      query(`SELECT * FROM "${repsTable}" ORDER BY _created_at`),
    ]);
    return res.json({ rules: rules.rows.map(formatRecord), reps: reps.rows.map(formatRecord) });
  } catch (err) { return handleError(res, 'commissions', err); }
});

router.post('/commissions/calculate', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const subsTable = getTableName('carrierSubscriptions');
    const result = await query(
      `SELECT COUNT(*) AS cnt, SUM(COALESCE((data->>'monthly_amount')::numeric, 0)) AS revenue
       FROM "${subsTable}"
       WHERE _created_at >= $1 AND _created_at <= $2 AND data->>'status' = 'active'`,
      [startDate, endDate]
    );
    const subs = parseInt(result.rows[0].cnt, 10);
    const revenue = parseFloat(result.rows[0].revenue) || 0;

    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_CALCULATE_COMMISSIONS', resource_type: 'commission', after_state: { startDate, endDate, subs, revenue } });
    return res.json({ period: { startDate, endDate }, subscriptions: subs, revenue, estimatedCommission: Math.round(revenue * 0.1) });
  } catch (err) { return handleError(res, 'calculate-commissions', err); }
});

export default router;
```

**Commit:** `git commit -m "feat(admin): add /v1/admin/billing routes (revenue, customer, invoices, commissions)"`

---

## Task 10: admin/index.js (barrel + manifest)

**Files:**
- Create: `cloud-run-api/src/routes/admin/index.js`

**Depends on:** Tasks 1-9 (all route files must exist)

```javascript
import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import dashboardRouter from './dashboard.js';
import driversRouter from './drivers.js';
import carriersRouter from './carriers.js';
import matchesRouter from './matches.js';
import configRouter from './config.js';
import observabilityRouter from './observability.js';
import aiRouterRouter from './ai-router.js';
import auditRouter from './audit.js';
import billingRouter from './billing.js';

const router = Router();

// All admin routes require admin role
router.use(requireAdmin());

// Mount sub-routers
router.use('/dashboard', dashboardRouter);
router.use('/drivers', driversRouter);
router.use('/carriers', carriersRouter);
router.use('/matches', matchesRouter);
router.use('/config', configRouter);
router.use('/observability', observabilityRouter);
router.use('/ai-router', aiRouterRouter);
router.use('/audit', auditRouter);
router.use('/billing', billingRouter);

// ── GET /admin/manifest — AI tool definitions ──
const TOOL_DEFINITIONS = [
  { name: 'admin_get_dashboard_overview', description: 'Get dashboard overview with driver, carrier, match stats', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/dashboard/overview' } },
  { name: 'admin_get_quick_stats', description: 'Get 4-stat quick snapshot (drivers, carriers, pending, flagged)', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/dashboard/quick-stats' } },
  { name: 'admin_get_ai_usage', description: 'Get AI usage stats by provider', input_schema: { type: 'object', properties: { period: { type: 'string', default: '7d' } } }, endpoint: { method: 'GET', path: '/v1/admin/dashboard/ai-usage' } },
  { name: 'admin_list_drivers', description: 'List drivers with filters (status, verification, search text)', input_schema: { type: 'object', properties: { filters: { type: 'array' }, search: { type: 'string' }, limit: { type: 'number', default: 50 }, skip: { type: 'number', default: 0 } } }, endpoint: { method: 'POST', path: '/v1/admin/drivers/query' } },
  { name: 'admin_get_driver', description: 'Get full driver detail by ID (profile + applications + match history)', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/admin/drivers/:id' } },
  { name: 'admin_get_driver_stats', description: 'Get driver counts (total, active, pending, expired, new this week)', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/drivers/stats' } },
  { name: 'admin_verify_driver', description: 'Verify a driver (sets status to active + verified)', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'POST', path: '/v1/admin/drivers/:id/verify' } },
  { name: 'admin_suspend_driver', description: 'Suspend a driver with reason', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, reason: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'POST', path: '/v1/admin/drivers/:id/suspend' } },
  { name: 'admin_list_carriers', description: 'List carriers with filters', input_schema: { type: 'object', properties: { filters: { type: 'array' }, search: { type: 'string' }, limit: { type: 'number', default: 50 } } }, endpoint: { method: 'POST', path: '/v1/admin/carriers/query' } },
  { name: 'admin_get_carrier', description: 'Get full carrier detail (safety, enrichment, matches, interests)', input_schema: { type: 'object', properties: { carrierId: { type: 'string' } }, required: ['carrierId'] }, endpoint: { method: 'GET', path: '/v1/admin/carriers/:id' } },
  { name: 'admin_get_carrier_stats', description: 'Get carrier counts and enrichment coverage', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/carriers/stats' } },
  { name: 'admin_list_matches', description: 'List match events with filters', input_schema: { type: 'object', properties: { filters: { type: 'array' }, limit: { type: 'number', default: 50 } } }, endpoint: { method: 'POST', path: '/v1/admin/matches/query' } },
  { name: 'admin_get_match_stats', description: 'Get match statistics (weekly, total, conversion rate)', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/matches/stats' } },
  { name: 'admin_get_config', description: 'Get matching weights (carrier + driver)', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/config/matching-weights' } },
  { name: 'admin_update_config', description: 'Update matching weights', input_schema: { type: 'object', properties: { carrier: { type: 'object' }, driver: { type: 'object' } } }, endpoint: { method: 'PUT', path: '/v1/admin/config/matching-weights' } },
  { name: 'admin_get_anomalies', description: 'Get active anomaly alerts', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/observability/anomalies' } },
  { name: 'admin_ack_anomaly', description: 'Acknowledge an anomaly alert', input_schema: { type: 'object', properties: { anomalyId: { type: 'string' } }, required: ['anomalyId'] }, endpoint: { method: 'POST', path: '/v1/admin/observability/anomalies/:id/ack' } },
  { name: 'admin_get_revenue_snapshot', description: 'Get revenue snapshot (MRR, ARR, ARPU, plan mix)', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/billing/revenue/snapshot' } },
  { name: 'admin_get_audit_stats', description: 'Get audit log statistics (counts, top admins, top actions)', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/audit/stats' } },
  { name: 'admin_query_audit_log', description: 'Query the audit log with filters', input_schema: { type: 'object', properties: { filters: { type: 'array' }, limit: { type: 'number', default: 50 } } }, endpoint: { method: 'POST', path: '/v1/admin/audit/query' } },
  { name: 'admin_get_ai_router_config', description: 'Get AI provider routing configuration', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/ai-router/config' } },
  { name: 'admin_get_ai_costs', description: 'Get AI provider cost metrics (30-day window)', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/admin/ai-router/costs' } },
  { name: 'admin_test_ai_provider', description: 'Test an AI provider health', input_schema: { type: 'object', properties: { providerId: { type: 'string' } }, required: ['providerId'] }, endpoint: { method: 'POST', path: '/v1/admin/ai-router/test' } },
];

router.get('/manifest', (req, res) => {
  return res.json({ tools: TOOL_DEFINITIONS, version: '1.0.0', generatedAt: new Date().toISOString() });
});

export default router;
```

**Commit:** `git commit -m "feat(admin): add barrel index.js with manifest endpoint (23 AI tool definitions)"`

---

## Task 11: Mount admin router in app.js

**Files:**
- Modify: `cloud-run-api/src/app.js`

**Step 1: Add import and mount**

Add after `import jobsRouter`:
```javascript
import adminRouter from './routes/admin/index.js';
```

Add before `protectedRouter.use('/', collectionRouter)`:
```javascript
protectedRouter.use('/admin', adminRouter);
```

**Step 2: Run all existing tests to verify no breakage**

```bash
cd cloud-run-api && npm test
```

**Step 3: Commit**

```bash
git add cloud-run-api/src/app.js
git commit -m "feat(admin): mount /v1/admin router in app.js"
```

---

## Task 12: Add missing collections to schema.js

**Files:**
- Modify: `cloud-run-api/src/db/schema.js`

Check if these collections are in `KNOWN_COLLECTIONS`. Add any missing:
- `anomalyAlerts`
- `anomalyRules`
- `baselineMetrics`
- `aiProviderCosts`
- `costOptimizerConfig`
- `commissionRules`
- `salesReps`
- `commissions`
- `billingAdjustments`
- `invoices`
- `revenueMetrics`

**Step 1: Check and add missing**

```bash
cd cloud-run-api && grep -c "anomalyAlerts\|commissionRules\|salesReps\|invoices\|revenueMetrics\|billingAdjustments\|commissions" src/db/schema.js
```

Add any that return 0 hits to the `KNOWN_COLLECTIONS` set.

**Step 2: Commit**

```bash
git add cloud-run-api/src/db/schema.js
git commit -m "feat(admin): add missing admin collections to schema.js KNOWN_COLLECTIONS"
```

---

## Task 13: Next.js admin-api.ts client

**Files:**
- Create: `frontend/src/lib/admin-api.ts`

```typescript
'use server';

const CLOUD_RUN_URL = process.env.LMDR_API_URL || 'https://lmdr-api-140035137711.us-central1.run.app';
const INTERNAL_KEY = process.env.LMDR_INTERNAL_KEY || '';

class AdminApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, body: unknown) {
    super(`Admin API error ${status}`);
    this.status = status;
    this.detail = body;
  }
}

export async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${CLOUD_RUN_URL}/v1/admin${path}`, {
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
    throw new AdminApiError(res.status, body);
  }
  return res.json() as Promise<T>;
}
```

**Commit:** `git commit -m "feat(frontend): add server-side admin-api.ts client for Cloud Run"`

---

## Task 14: Next.js server actions (9 files)

**Files:**
- Create: `frontend/src/app/(admin)/actions/dashboard.ts`
- Create: `frontend/src/app/(admin)/actions/drivers.ts`
- Create: `frontend/src/app/(admin)/actions/carriers.ts`
- Create: `frontend/src/app/(admin)/actions/matches.ts`
- Create: `frontend/src/app/(admin)/actions/config.ts`
- Create: `frontend/src/app/(admin)/actions/observability.ts`
- Create: `frontend/src/app/(admin)/actions/ai-router.ts`
- Create: `frontend/src/app/(admin)/actions/audit.ts`
- Create: `frontend/src/app/(admin)/actions/billing.ts`

Each file follows this pattern (example for dashboard.ts):

```typescript
'use server';

import { adminFetch } from '@/lib/admin-api';

export async function getDashboardOverview() {
  return adminFetch<{
    drivers: { total: number; active: number; pending: number; activePct: number };
    carriers: { total: number; active: number; flagged: number };
    matchesThisWeek: number;
    enrichmentCoverage: number;
    unresolvedAlerts: number;
    recentActivity: unknown[];
  }>('/dashboard/overview');
}

export async function getQuickStats() {
  return adminFetch<{
    totalDrivers: number;
    totalCarriers: number;
    pendingReview: number;
    flaggedDrivers: number;
  }>('/dashboard/quick-stats');
}

export async function getAiUsage(period = '7d') {
  return adminFetch<{
    period: string;
    providers: Array<{ provider: string; calls: number; totalCostUsd: number }>;
  }>(`/dashboard/ai-usage?period=${period}`);
}
```

Create all 9 files following this pattern, wrapping each Cloud Run endpoint with typed server actions.

**Commit:** `git commit -m "feat(frontend): add 9 admin server action files for Cloud Run integration"`

---

## Task 15: Update Next.js admin pages to use server actions

**Files:**
- Modify: `frontend/src/app/(admin)/admin/page.tsx` (and other admin pages)

Replace mock data with server action calls. Example for the dashboard:

```typescript
import { getDashboardOverview, getAiUsage } from '../actions/dashboard';

export default async function AdminDashboard() {
  const [dashData, aiData] = await Promise.all([
    getDashboardOverview().catch(() => null),
    getAiUsage().catch(() => null),
  ]);

  // Use dashData if available, fall back to mocks
  const kpis = dashData ? [
    { label: 'Total Drivers', value: String(dashData.drivers.total), icon: 'group', trend: `${dashData.drivers.activePct}% active`, trendUp: true },
    // ... etc
  ] : mockKpis;
```

**Commit:** `git commit -m "feat(frontend): wire admin pages to live Cloud Run data via server actions"`

---

## Task 16: Deploy to Cloud Run + smoke test

**Files:** None (deployment only)

**Step 1: Build and deploy**

```bash
cd cloud-run-api
gcloud run deploy lmdr-api \
  --source . \
  --project ldmr-velocitymatch \
  --region us-central1 \
  --allow-unauthenticated
```

**Step 2: Smoke test**

```bash
INTERNAL_KEY=$(gcloud secrets versions access latest --secret=lmdr-internal-key --project=ldmr-velocitymatch)
API_URL="https://lmdr-api-140035137711.us-central1.run.app"

# Test quick-stats
curl -s -H "Authorization: Bearer $INTERNAL_KEY" "$API_URL/v1/admin/dashboard/quick-stats" | jq .

# Test manifest
curl -s -H "Authorization: Bearer $INTERNAL_KEY" "$API_URL/v1/admin/manifest" | jq '.tools | length'

# Test driver stats
curl -s -H "Authorization: Bearer $INTERNAL_KEY" "$API_URL/v1/admin/drivers/stats" | jq .
```

**Step 3: Commit updated revision to metadata**

```bash
git commit -m "chore: deploy admin routes to Cloud Run"
```

---

## Execution Summary

| Phase | Tasks | Can Parallelize? | Estimated LOC |
|-------|-------|-----------------|---------------|
| Phase 1 | Tasks 1-9 (9 route files) | YES — all independent | ~1,400 |
| Phase 2 | Tasks 10-12 (barrel, app.js, schema) | Sequential | ~200 |
| Phase 3 | Tasks 13-15 (Next.js client, actions, pages) | Tasks 13-14 parallel, 15 depends | ~400 |
| Phase 4 | Task 16 (deploy + smoke) | Sequential | 0 |
| **Total** | **16 tasks** | | **~2,000 LOC** |
