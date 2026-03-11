import { jest } from '@jest/globals';

// ── Mock pool.js and bigquery.js before importing the router ──
const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: mockQuery,
}));

const mockInsertLog = jest.fn();
jest.unstable_mockModule('../../../src/db/bigquery.js', () => ({
  insertLog: mockInsertLog,
  insertAuditEvent: jest.fn(),
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
const { default: retentionRouter } = await import('../../../src/routes/driver/retention.js');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.auth = { uid: 'test-driver', role: 'driver', type: 'firebase' };
    next();
  });
  app.use('/v1/driver/retention', retentionRouter);
  return app;
}

describe('Driver Retention Routes', () => {
  let app;
  beforeAll(() => { app = createTestApp(); });
  afterEach(() => jest.clearAllMocks());

  describe('GET /v1/driver/retention/:id/risk', () => {
    it('returns risk score and level from performance data', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          _id: 'perf1', airtable_id: null, _created_at: '2026-03-01T00:00:00Z', _updated_at: '2026-03-01T00:00:00Z',
          data: { driver_id: 'drv-1', dnps_score: '30', activity_drop_pct: '40', safety_incidents: '2', pay_volatility_pct: '20', home_time_pct: '60' },
        }],
      });

      const res = await request(app).get('/v1/driver/retention/drv-1/risk');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('riskScore');
      expect(res.body).toHaveProperty('riskLevel');
      expect(res.body).toHaveProperty('factors');
      expect(res.body).toHaveProperty('recommendations');
      expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(res.body.riskLevel);
      expect(typeof res.body.riskScore).toBe('number');
      expect(res.body.factors).toHaveProperty('dnps');
      expect(res.body.factors).toHaveProperty('activityDrop');
      expect(res.body.factors).toHaveProperty('safetyIncidents');
      expect(res.body.factors).toHaveProperty('payVolatility');
      expect(res.body.factors).toHaveProperty('homeTime');
    });

    it('returns defaults when no performance data exists', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/v1/driver/retention/drv-none/risk');
      expect(res.status).toBe(200);
      expect(res.body.riskScore).toBeGreaterThanOrEqual(0);
      expect(res.body.riskLevel).toBeDefined();
      expect(Array.isArray(res.body.recommendations)).toBe(true);
    });

    it('handles table-not-exist gracefully via safeQuery', async () => {
      mockQuery.mockRejectedValueOnce(new Error('relation "airtable_driver_performance" does not exist'));

      const res = await request(app).get('/v1/driver/retention/drv-1/risk');
      expect(res.status).toBe(200);
      expect(res.body.riskScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /v1/driver/retention/:id/risk/history', () => {
    it('returns risk log list', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { _id: 'log1', airtable_id: null, _created_at: '2026-03-01T00:00:00Z', _updated_at: '2026-03-01T00:00:00Z', data: { driver_id: 'drv-1', risk_score: 55, risk_level: 'MEDIUM' } },
          { _id: 'log2', airtable_id: null, _created_at: '2026-02-15T00:00:00Z', _updated_at: '2026-02-15T00:00:00Z', data: { driver_id: 'drv-1', risk_score: 70, risk_level: 'HIGH' } },
        ],
      });

      const res = await request(app).get('/v1/driver/retention/drv-1/risk/history');
      expect(res.status).toBe(200);
      expect(res.body.records).toHaveLength(2);
      expect(res.body.records[0].risk_score).toBe(55);
      expect(res.body.records[1].risk_level).toBe('HIGH');
    });

    it('respects limit param', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/v1/driver/retention/drv-1/risk/history?limit=5');
      expect(res.status).toBe(200);
      expect(res.body.records).toEqual([]);
      // Verify the limit was passed to query
      const lastCall = mockQuery.mock.calls[0];
      expect(lastCall[1]).toContain(5);
    });

    it('returns empty when table does not exist', async () => {
      mockQuery.mockRejectedValueOnce(new Error('relation "airtable_retention_risk_logs" does not exist'));

      const res = await request(app).get('/v1/driver/retention/drv-1/risk/history');
      expect(res.status).toBe(200);
      expect(res.body.records).toEqual([]);
    });
  });

  describe('GET /v1/driver/retention/:id/performance', () => {
    it('returns performance metrics', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          _id: 'perf1', airtable_id: null, _created_at: '2026-03-01T00:00:00Z', _updated_at: '2026-03-01T00:00:00Z',
          data: { driver_id: 'drv-1', on_time_pct: 95, safety_incidents: 1, revenue_per_mile: 0.62, home_time_pct: 48 },
        }],
      });

      const res = await request(app).get('/v1/driver/retention/drv-1/performance');
      expect(res.status).toBe(200);
      expect(res.body.on_time_pct).toBe(95);
      expect(res.body.safety_incidents).toBe(1);
      expect(res.body.revenue_per_mile).toBe(0.62);
      expect(res.body.home_time_pct).toBe(48);
    });

    it('returns 404 when no performance data found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/v1/driver/retention/drv-none/performance');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('No performance data found');
    });
  });

  describe('GET /v1/driver/retention/:id/carrier-comparison', () => {
    it('returns carrier metrics and industry averages', async () => {
      // First call: driver profile lookup
      mockQuery.mockResolvedValueOnce({ rows: [{ carrier_dot: '123456' }] });
      // Second call: carrier data lookup
      mockQuery.mockResolvedValueOnce({
        rows: [{
          _id: 'car1', airtable_id: null, _created_at: '2026-03-01T00:00:00Z', _updated_at: '2026-03-01T00:00:00Z',
          data: { dot_number: '123456', name: 'Test Carrier', avg_pay_per_mile: '0.58', safety_rating: 'Satisfactory', driver_satisfaction: '72', home_time_pct: '50', turnover_rate: '85' },
        }],
      });

      const res = await request(app).get('/v1/driver/retention/drv-1/carrier-comparison');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('carrierMetrics');
      expect(res.body).toHaveProperty('industryAverage');
      expect(res.body.carrierMetrics.name).toBe('Test Carrier');
      expect(res.body.carrierMetrics.avg_pay_per_mile).toBe(0.58);
      expect(res.body.industryAverage.avg_pay_per_mile).toBe(0.55);
    });

    it('returns 404 when no carrier assigned', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/v1/driver/retention/drv-1/carrier-comparison');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });
});
