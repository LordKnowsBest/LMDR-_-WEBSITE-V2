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
const { default: router } = await import('../../../src/routes/driver/community.js');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => { req.auth = { uid: 'test-driver', type: 'firebase' }; next(); });
  app.use('/v1/driver/community', router);
  return app;
}

describe('driver/community', () => {
  let app;
  beforeEach(() => { app = createTestApp(); jest.clearAllMocks(); });

  // ── Forums ──

  test('GET /forums returns categories with thread counts', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { _id: 'cat1', airtable_id: null, _created_at: '2026-01-01', _updated_at: '2026-01-01', data: { name: 'General', description: 'General discussion' }, thread_count: '5' },
        { _id: 'cat2', airtable_id: null, _created_at: '2026-01-02', _updated_at: '2026-01-02', data: { name: 'Safety', description: 'Safety topics' }, thread_count: '3' },
      ],
    });
    const res = await request(app).get('/v1/driver/community/forums');
    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(2);
    expect(res.body.categories[0].name).toBe('General');
    expect(res.body.categories[0].threadCount).toBe(5);
    expect(res.body.categories[1].threadCount).toBe(3);
  });

  test('GET /forums returns empty array when table missing', async () => {
    mockQuery.mockRejectedValueOnce(new Error('relation "airtable_forum_categories" does not exist'));
    const res = await request(app).get('/v1/driver/community/forums');
    expect(res.status).toBe(200);
    expect(res.body.categories).toEqual([]);
  });

  // ── Announcements ──

  test('GET /announcements returns list ordered by date', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { _id: 'ann1', airtable_id: null, _created_at: '2026-03-10', _updated_at: '2026-03-10', data: { title: 'New Policy', body: 'Details here' } },
        { _id: 'ann2', airtable_id: null, _created_at: '2026-03-09', _updated_at: '2026-03-09', data: { title: 'Older Update', body: 'More info' } },
      ],
    });
    const res = await request(app).get('/v1/driver/community/announcements');
    expect(res.status).toBe(200);
    expect(res.body.announcements).toHaveLength(2);
    expect(res.body.announcements[0].title).toBe('New Policy');
  });

  test('GET /announcements respects limit param', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/v1/driver/community/announcements?limit=5');
    expect(res.status).toBe(200);
    // Verify limit was passed to query
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('LIMIT'), [5]);
  });

  // ── Surveys ──

  test('GET /surveys returns active surveys', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { _id: 'srv1', airtable_id: null, _created_at: '2026-03-01', _updated_at: '2026-03-01', data: { title: 'Driver Satisfaction', status: 'active', questions: [{ id: 'q1', text: 'How satisfied?' }] } },
      ],
    });
    const res = await request(app).get('/v1/driver/community/surveys');
    expect(res.status).toBe(200);
    expect(res.body.surveys).toHaveLength(1);
    expect(res.body.surveys[0].title).toBe('Driver Satisfaction');
    expect(res.body.surveys[0].status).toBe('active');
  });

  test('GET /surveys/:id returns 404 for missing survey', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/v1/driver/community/surveys/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('SURVEY_NOT_FOUND');
  });

  test('POST /surveys/:id/respond creates response', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ _id: 'resp1' }] });
    const res = await request(app)
      .post('/v1/driver/community/surveys/srv1/respond')
      .send({ driverId: 'drv1', answers: { q1: 'Very satisfied' } });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('responseId');
  });

  test('POST /surveys/:id/respond returns 400 without required fields', async () => {
    const res = await request(app)
      .post('/v1/driver/community/surveys/srv1/respond')
      .send({ driverId: 'drv1' });
    expect(res.status).toBe(400);
  });
});
