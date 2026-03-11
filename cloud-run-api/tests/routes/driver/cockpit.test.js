import { jest } from '@jest/globals';

// ── Mock pool.js and bigquery.js before importing the router ──
const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: mockQuery,
}));

const mockInsertLog = jest.fn();
const mockInsertAuditEvent = jest.fn();
jest.unstable_mockModule('../../../src/db/bigquery.js', () => ({
  insertLog: mockInsertLog,
  insertAuditEvent: mockInsertAuditEvent,
}));

// Mock schema.js — return predictable table names without KNOWN_COLLECTIONS validation
jest.unstable_mockModule('../../../src/db/schema.js', () => ({
  getTableName: (key) => `airtable_${key.replace(/([A-Z])/g, '_$1').toLowerCase()}`,
  pgTableName: (key) => `airtable_${key.replace(/([A-Z])/g, '_$1').toLowerCase()}`,
  toSnakeCase: (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase(),
  KNOWN_COLLECTIONS: new Set(),
}));

// Dynamic imports after mocks are registered
const { default: express } = await import('express');
const { default: request } = await import('supertest');
const { default: cockpitRouter } = await import('../../../src/routes/driver/cockpit.js');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.auth = { uid: 'test-driver', role: 'driver', type: 'firebase' };
    next();
  });
  app.use('/v1/driver/cockpit', cockpitRouter);
  return app;
}

describe('Driver Cockpit Routes', () => {
  let app;
  beforeAll(() => { app = createTestApp(); });
  afterEach(() => jest.clearAllMocks());

  describe('GET /v1/driver/cockpit/:id/dashboard', () => {
    it('returns aggregated counts', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })   // matches
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })   // applications
        .mockResolvedValueOnce({ rows: [{ count: '2' }] });  // saved

      const res = await request(app).get('/v1/driver/cockpit/drv-1/dashboard');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        matchCount: 5,
        applicationCount: 3,
        savedCount: 2,
      });
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it('returns zeros when tables do not exist', async () => {
      const notExist = new Error('relation "airtable_match_events" does not exist');
      mockQuery
        .mockRejectedValueOnce(notExist)
        .mockRejectedValueOnce(notExist)
        .mockRejectedValueOnce(notExist);

      const res = await request(app).get('/v1/driver/cockpit/drv-1/dashboard');
      expect(res.status).toBe(200);
      expect(res.body.matchCount).toBe(0);
      expect(res.body.applicationCount).toBe(0);
      expect(res.body.savedCount).toBe(0);
    });
  });

  describe('GET /v1/driver/cockpit/:id/applications', () => {
    it('returns paginated application list', async () => {
      const row = {
        _id: 'app-1',
        airtable_id: null,
        _created_at: '2026-03-01T00:00:00Z',
        _updated_at: '2026-03-01T00:00:00Z',
        data: { driver_id: 'drv-1', job_id: 'job-1', status: 'applied' },
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [row] })          // data
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // count

      const res = await request(app).get('/v1/driver/cockpit/drv-1/applications?limit=10&skip=0');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.records)).toBe(true);
      expect(res.body.records.length).toBe(1);
      expect(res.body.records[0].status).toBe('applied');
      expect(res.body.total).toBe(1);
      expect(res.body.page).toEqual({ limit: 10, skip: 0 });
    });

    it('respects max limit of 100', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const res = await request(app).get('/v1/driver/cockpit/drv-1/applications?limit=999');
      expect(res.status).toBe(200);
      expect(res.body.page.limit).toBe(100);
    });
  });

  describe('GET /v1/driver/cockpit/:id/notifications', () => {
    it('returns notification list', async () => {
      const notif = {
        _id: 'notif-1',
        airtable_id: null,
        _created_at: '2026-03-01T00:00:00Z',
        _updated_at: '2026-03-01T00:00:00Z',
        data: { driver_id: 'drv-1', title: 'New match', read: false },
      };

      mockQuery.mockResolvedValueOnce({ rows: [notif] });

      const res = await request(app).get('/v1/driver/cockpit/drv-1/notifications');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.records)).toBe(true);
      expect(res.body.records.length).toBe(1);
      expect(res.body.records[0].title).toBe('New match');
    });

    it('returns empty array when table does not exist', async () => {
      mockQuery.mockRejectedValueOnce(new Error('relation "airtable_driver_notifications" does not exist'));

      const res = await request(app).get('/v1/driver/cockpit/drv-1/notifications');
      expect(res.status).toBe(200);
      expect(res.body.records).toEqual([]);
    });
  });

  describe('POST /v1/driver/cockpit/:id/apply/:jobId', () => {
    it('creates application and logs audit event', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // INSERT

      const res = await request(app).post('/v1/driver/cockpit/drv-1/apply/job-42');
      expect(res.status).toBe(201);
      expect(res.body.driver_id).toBe('drv-1');
      expect(res.body.job_id).toBe('job-42');
      expect(res.body.status).toBe('applied');
      expect(res.body._id).toBeDefined();
      expect(mockInsertAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'APPLICATION_SUBMITTED', actor_id: 'drv-1' })
      );
    });
  });

  describe('GET /v1/driver/cockpit/:id/recommended', () => {
    it('returns top 10 job postings', async () => {
      const job = {
        _id: 'job-1',
        airtable_id: null,
        _created_at: '2026-03-01T00:00:00Z',
        _updated_at: '2026-03-01T00:00:00Z',
        data: { title: 'OTR Driver', company: 'ACME' },
      };
      mockQuery.mockResolvedValueOnce({ rows: [job] });

      const res = await request(app).get('/v1/driver/cockpit/drv-1/recommended');
      expect(res.status).toBe(200);
      expect(res.body.records.length).toBe(1);
      expect(res.body.records[0].title).toBe('OTR Driver');
    });
  });
});
