import { jest } from '@jest/globals';

// Mock dependencies before importing router
const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/db/pool.js', () => ({ query: mockQuery }));
jest.unstable_mockModule('../../../src/db/bigquery.js', () => ({
  insertLog: jest.fn(),
  insertAuditEvent: jest.fn(),
}));

const { default: express } = await import('express');
const { default: request } = await import('supertest');
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
