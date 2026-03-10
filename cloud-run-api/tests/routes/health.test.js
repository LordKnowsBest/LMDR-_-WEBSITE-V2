import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('GET /health', () => {
  let app;
  beforeEach(() => { app = createApp(); });

  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.db).toBe('ok');
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
  });

  it('returns 401 for /v1 without auth', async () => {
    const res = await request(app).get('/v1/carriers/count');
    expect(res.status).toBe(401);
  });
});
