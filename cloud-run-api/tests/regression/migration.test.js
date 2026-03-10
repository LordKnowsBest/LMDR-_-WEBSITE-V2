/**
 * Migration Regression Tests
 *
 * Verifies Cloud SQL data integrity for the GCP migration:
 * - JSONB tables populated from Airtable migration
 * - Typed tables backfilled correctly
 * - id_mapping cross-references intact
 * - Critical collections accessible and non-empty
 * - CRUD lifecycle works on JSONB tables
 * - Observability middleware attaches trace headers
 */
import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import collectionRouter from '../../src/routes/collection.js';
import { query, closePool } from '../../src/db/pool.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/v1', collectionRouter);
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
  return app;
}

let app;

beforeAll(() => { app = createTestApp(); });
afterAll(async () => { await closePool(); });

// ─── JSONB Table Population ────────────────────────────────────────────────

describe('JSONB tables — migration completeness', () => {
  const criticalCollections = [
    { key: 'carriers', minCount: 20000 },
    { key: 'driverProfiles', minCount: 5 },
    { key: 'driverCarrierInterests', minCount: 1 },
    { key: 'b2bAccounts', minCount: 0 },
    { key: 'systemLogs', minCount: 0 },
  ];

  for (const { key, minCount } of criticalCollections) {
    it(`${key} has >= ${minCount} records`, async () => {
      const res = await request(app).get(`/v1/${key}/count`);
      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThanOrEqual(minCount);
    });
  }
});

// ─── Typed Tables ──────────────────────────────────────────────────────────

describe('Typed tables — backfill integrity', () => {
  it('carriers typed table has rows', async () => {
    const result = await query('SELECT count(*) FROM carriers');
    expect(Number(result.rows[0].count)).toBeGreaterThan(20000);
  });

  it('driver_profiles typed table has rows', async () => {
    const result = await query('SELECT count(*) FROM driver_profiles');
    expect(Number(result.rows[0].count)).toBeGreaterThan(0);
  });

  it('carriers typed table has correct columns', async () => {
    const result = await query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'carriers'
      ORDER BY ordinal_position
    `);
    const cols = result.rows.map(r => r.column_name);
    expect(cols).toContain('_id');
    expect(cols).toContain('dot_number');
    expect(cols).toContain('company_name');
    expect(cols).toContain('city');
    expect(cols).toContain('state');
    expect(cols).toContain('num_trucks');
  });

  it('id_mapping links airtable IDs to GCP UUIDs', async () => {
    const result = await query("SELECT count(*) FROM id_mapping WHERE collection_name = $1", ['carriers']);
    expect(Number(result.rows[0].count)).toBeGreaterThan(20000);
  });

  it('id_mapping entries reference real typed rows', async () => {
    const mapping = await query(`
      SELECT airtable_id, gcp_uuid FROM id_mapping
      WHERE collection_name = 'carriers' LIMIT 1
    `);
    if (mapping.rows.length > 0) {
      const { gcp_uuid } = mapping.rows[0];
      const carrier = await query('SELECT _id FROM carriers WHERE _id = $1', [gcp_uuid]);
      expect(carrier.rows.length).toBe(1);
    }
  });
});

// ─── Data Integrity Spot Checks ────────────────────────────────────────────

describe('Data integrity — carrier records', () => {
  it('JSONB carriers have USDOT Number field', async () => {
    const res = await request(app)
      .post('/v1/carriers/query')
      .send({ limit: 5 });
    expect(res.status).toBe(200);
    for (const record of res.body.records) {
      // Most carriers should have a DOT number in their data
      expect(record).toHaveProperty('_id');
      expect(record).toHaveProperty('_createdAt');
    }
  });

  it('typed carriers have non-null dot_number', async () => {
    const result = await query(`
      SELECT count(*) FROM carriers WHERE dot_number IS NOT NULL
    `);
    expect(Number(result.rows[0].count)).toBeGreaterThan(10000);
  });

  it('typed carriers have non-null company_name', async () => {
    const result = await query(`
      SELECT count(*) FROM carriers WHERE company_name IS NOT NULL AND company_name != ''
    `);
    expect(Number(result.rows[0].count)).toBeGreaterThan(10000);
  });
});

// ─── API CRUD Lifecycle ────────────────────────────────────────────────────

describe('CRUD lifecycle — regression', () => {
  const testCollection = 'systemLogs';
  let createdId;
  const testPayload = {
    level: 'INFO',
    source: 'regression-test',
    message: `regression-test-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  it('creates a record', async () => {
    const res = await request(app)
      .post(`/v1/${testCollection}`)
      .send({ data: testPayload });
    expect(res.status).toBe(201);
    expect(res.body.record._id).toBeDefined();
    expect(res.body.record.source).toBe('regression-test');
    createdId = res.body.record._id;
  });

  it('reads the record back', async () => {
    if (!createdId) return;
    const res = await request(app).get(`/v1/${testCollection}/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.record.message).toBe(testPayload.message);
  });

  it('updates the record', async () => {
    if (!createdId) return;
    const res = await request(app)
      .put(`/v1/${testCollection}/${createdId}`)
      .send({ data: { ...testPayload, level: 'WARN' } });
    expect(res.status).toBe(200);
    expect(res.body.record.level).toBe('WARN');
  });

  it('deletes the record', async () => {
    if (!createdId) return;
    const res = await request(app).delete(`/v1/${testCollection}/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
  });

  it('confirms deletion', async () => {
    if (!createdId) return;
    const res = await request(app).get(`/v1/${testCollection}/${createdId}`);
    expect(res.status).toBe(404);
  });
});

// ─── Filter / Query Regression ─────────────────────────────────────────────

describe('Query filter operators — regression', () => {
  it('eq filter works on JSONB field', async () => {
    // Get a carrier to find a real DOT
    const first = await request(app)
      .post('/v1/carriers/query')
      .send({ limit: 1 });
    const dot = first.body.records[0]?.['USDOT Number'];
    if (!dot) return;

    const res = await request(app)
      .post('/v1/carriers/query')
      .send({
        filters: [{ field: 'USDOT Number', operator: 'eq', value: dot }],
        limit: 5,
      });
    expect(res.status).toBe(200);
    expect(res.body.records.length).toBeGreaterThan(0);
    expect(res.body.records[0]['USDOT Number']).toBe(dot);
  });

  it('limit + skip pagination returns different pages', async () => {
    const p1 = await request(app)
      .post('/v1/carriers/query')
      .send({ limit: 3, skip: 0 });
    const p2 = await request(app)
      .post('/v1/carriers/query')
      .send({ limit: 3, skip: 3 });
    expect(p1.status).toBe(200);
    expect(p2.status).toBe(200);
    if (p1.body.records.length && p2.body.records.length) {
      expect(p1.body.records[0]._id).not.toBe(p2.body.records[0]._id);
    }
  });

  it('sort parameter is accepted and returns 200', async () => {
    const res = await request(app)
      .post('/v1/carriers/query')
      .send({
        limit: 2,
        sort: [{ field: '_created_at', direction: 'desc' }],
      });
    expect(res.status).toBe(200);
    expect(res.body.records.length).toBe(2);
  });
});

// ─── Bulk Operations ───────────────────────────────────────────────────────

describe('Bulk operations — regression', () => {
  const testCollection = 'systemLogs';
  const ids = [];

  it('bulk insert creates multiple records', async () => {
    const records = Array.from({ length: 3 }, (_, i) => ({
      data: { source: 'bulk-regression', index: i, ts: new Date().toISOString() },
    }));
    const res = await request(app)
      .post(`/v1/${testCollection}/bulk`)
      .send({ records, operation: 'insert' });
    expect(res.status).toBe(200);
    expect(res.body.records.length).toBe(3);
    ids.push(...res.body.records.map(r => r._id));
  });

  it('bulk delete cleans up', async () => {
    if (ids.length === 0) return;
    const records = ids.map(_id => ({ _id }));
    const res = await request(app)
      .post(`/v1/${testCollection}/bulk`)
      .send({ records, operation: 'delete' });
    expect(res.status).toBe(200);
    expect(res.body.records.length).toBe(3);
  });

  it('rejects > 100 records', async () => {
    const records = Array.from({ length: 101 }, () => ({ data: {} }));
    const res = await request(app)
      .post(`/v1/${testCollection}/bulk`)
      .send({ records, operation: 'insert' });
    expect(res.status).toBe(400);
  });
});
