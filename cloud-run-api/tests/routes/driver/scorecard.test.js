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

// Dynamic imports after mocks are registered
const { default: express } = await import('express');
const { default: request } = await import('supertest');
const { default: scorecardRouter } = await import('../../../src/routes/driver/scorecard.js');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.auth = { uid: 'test-driver', role: 'driver', type: 'firebase' };
    next();
  });
  app.use('/v1/driver/scorecard', scorecardRouter);
  return app;
}

describe('Driver Scorecard Routes', () => {
  let app;
  beforeAll(() => { app = createTestApp(); });
  afterEach(() => jest.clearAllMocks());

  describe('GET /v1/driver/scorecard/:id/current', () => {
    it('returns current scores for driver', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          _id: 'score1', airtable_id: null, _created_at: '2026-03-01T00:00:00Z', _updated_at: '2026-03-01T00:00:00Z',
          data: { driver_id: 'drv1', overall_score: 88, safety_score: 92, efficiency_score: 85, service_score: 90, compliance_score: 80, period_type: 'monthly' },
        }],
      });

      const res = await request(app).get('/v1/driver/scorecard/drv1/current');
      expect(res.status).toBe(200);
      expect(res.body.overall_score).toBe(88);
      expect(res.body.safety_score).toBe(92);
      expect(res.body.efficiency_score).toBe(85);
      expect(res.body.service_score).toBe(90);
      expect(res.body.compliance_score).toBe(80);
      expect(res.body.period_type).toBe('monthly');
    });

    it('returns 404 when no scores exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/v1/driver/scorecard/drv1/current');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /v1/driver/scorecard/:id/history', () => {
    it('returns score history with period filter', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { _id: 's1', airtable_id: null, _created_at: '2026-03-01T00:00:00Z', _updated_at: '2026-03-01T00:00:00Z', data: { driver_id: 'drv1', overall_score: 88, period_type: 'weekly' } },
          { _id: 's2', airtable_id: null, _created_at: '2026-02-22T00:00:00Z', _updated_at: '2026-02-22T00:00:00Z', data: { driver_id: 'drv1', overall_score: 85, period_type: 'weekly' } },
        ],
      });

      const res = await request(app).get('/v1/driver/scorecard/drv1/history?period=weekly&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.records).toHaveLength(2);
      expect(res.body.period).toBe('weekly');
      expect(res.body.total).toBe(2);
    });

    it('defaults to monthly period and limit 12', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/v1/driver/scorecard/drv1/history');
      expect(res.status).toBe(200);
      expect(res.body.period).toBe('monthly');
      // Verify the query was called with 'monthly' and limit 12
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('period_type'),
        expect.arrayContaining(['drv1', 'monthly', 12])
      );
    });
  });

  describe('GET /v1/driver/scorecard/:id/rank', () => {
    it('returns rank, totalDrivers, and percentile', async () => {
      // Driver's latest score
      mockQuery.mockResolvedValueOnce({
        rows: [{ _id: 's1', data: { driver_id: 'drv1', overall_score: 88 } }],
      });
      // Count of drivers with higher scores
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '2' }] });
      // Total distinct drivers
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '10' }] });

      const res = await request(app).get('/v1/driver/scorecard/drv1/rank');
      expect(res.status).toBe(200);
      expect(res.body.rank).toBe(3);
      expect(res.body.totalDrivers).toBe(10);
      expect(res.body.percentile).toBe(70);
    });

    it('returns 404 when no scores exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/v1/driver/scorecard/drv1/rank');
      expect(res.status).toBe(404);
    });
  });
});
