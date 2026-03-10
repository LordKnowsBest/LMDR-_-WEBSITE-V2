/**
 * Integration tests for the generic collection router.
 * Requires Cloud SQL Auth Proxy running and lmdr DB populated.
 * Bypasses auth by building a test app with auth disabled.
 */
import { jest } from '@jest/globals';
import express from 'express';
import collectionRouter from '../../src/routes/collection.js';
import { closePool } from '../../src/db/pool.js';
import request from 'supertest';

function createTestApp() {
  const app = express();
  app.use(express.json());
  // Skip auth — mount collection router directly
  app.use('/v1', collectionRouter);
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
  return app;
}

describe('Collection router (integration)', () => {
  let app;
  beforeAll(() => { app = createTestApp(); });
  afterAll(async () => { await closePool(); });

  describe('POST /v1/:collection/query', () => {
    it('returns records array for carriers', async () => {
      const res = await request(app)
        .post('/v1/carriers/query')
        .send({ filters: [], limit: 5 });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.records)).toBe(true);
      expect(res.body.records.length).toBeLessThanOrEqual(5);
      expect(typeof res.body.total).toBe('number');
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('paginates with skip', async () => {
      const page1 = await request(app)
        .post('/v1/carriers/query')
        .send({ filters: [], limit: 2, skip: 0 });
      const page2 = await request(app)
        .post('/v1/carriers/query')
        .send({ filters: [], limit: 2, skip: 2 });
      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);
      // Pages should return different records
      if (page1.body.records.length && page2.body.records.length) {
        expect(page1.body.records[0]._id).not.toBe(page2.body.records[0]._id);
      }
    });

    it('returns 400 for unknown collection', async () => {
      const res = await request(app)
        .post('/v1/unknownCollection/query')
        .send({ filters: [] });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Unknown collection');
    });

    it('respects sort parameter', async () => {
      const res = await request(app)
        .post('/v1/carriers/query')
        .send({
          filters: [],
          limit: 2,
          sort: [{ field: '_created_at', direction: 'asc' }]
        });
      expect(res.status).toBe(200);
      expect(res.body.records.length).toBe(2);
    });
  });

  describe('GET /v1/:collection/count', () => {
    it('returns count for carriers', async () => {
      const res = await request(app).get('/v1/carriers/count');
      expect(res.status).toBe(200);
      expect(typeof res.body.count).toBe('number');
      expect(res.body.count).toBeGreaterThan(0);
    });

    it('returns count for b2bAccounts', async () => {
      const res = await request(app).get('/v1/b2bAccounts/count');
      expect(res.status).toBe(200);
      expect(typeof res.body.count).toBe('number');
    });

    it('returns 400 for unknown collection', async () => {
      const res = await request(app).get('/v1/fakeCollection/count');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /v1/:collection/:id', () => {
    it('returns 404 for non-existent id', async () => {
      const res = await request(app).get('/v1/carriers/does-not-exist-id');
      expect(res.status).toBe(404);
    });

    it('returns a record by id', async () => {
      // First get any carrier to get a real ID
      const queryRes = await request(app)
        .post('/v1/carriers/query')
        .send({ limit: 1 });
      const id = queryRes.body.records[0]?._id;
      if (!id) return;

      const res = await request(app).get(`/v1/carriers/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.record._id).toBe(id);
    });
  });

  describe('POST + PUT + DELETE lifecycle', () => {
    const testCollection = 'systemLogs';
    let createdId;

    it('inserts a new record', async () => {
      const res = await request(app)
        .post(`/v1/${testCollection}`)
        .send({
          data: { test_field: 'integration-test', timestamp: new Date().toISOString() }
        });
      expect(res.status).toBe(201);
      expect(res.body.record._id).toBeDefined();
      createdId = res.body.record._id;
    });

    it('updates the record', async () => {
      if (!createdId) return;
      const res = await request(app)
        .put(`/v1/${testCollection}/${createdId}`)
        .send({ data: { test_field: 'updated-value' } });
      expect(res.status).toBe(200);
      expect(res.body.record.test_field).toBe('updated-value');
    });

    it('deletes the record', async () => {
      if (!createdId) return;
      const res = await request(app)
        .delete(`/v1/${testCollection}/${createdId}`);
      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);
    });

    it('returns 404 after deletion', async () => {
      if (!createdId) return;
      const res = await request(app).get(`/v1/${testCollection}/${createdId}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /v1/:collection/field/:field/:value', () => {
    it('finds records by field value', async () => {
      // Get a carrier to find a field value to search for
      const queryRes = await request(app)
        .post('/v1/carriers/query')
        .send({ limit: 1 });
      const record = queryRes.body.records[0];
      if (!record) return;

      // Find a non-null field to search by
      const dotNumber = record['USDOT Number'];
      if (!dotNumber) return;

      const res = await request(app)
        .get(`/v1/carriers/field/USDOT Number/${dotNumber}`);
      expect(res.status).toBe(200);
      expect(res.body.records.length).toBeGreaterThan(0);
    });
  });
});
