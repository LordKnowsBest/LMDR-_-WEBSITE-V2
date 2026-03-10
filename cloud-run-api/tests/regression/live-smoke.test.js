/**
 * Live Smoke Tests — hit the deployed Cloud Run API
 *
 * These tests require:
 *   CLOUD_RUN_URL  — e.g. https://lmdr-api-140035137711.us-central1.run.app
 *   LMDR_INTERNAL_KEY — service-to-service auth key
 *
 * Run:  CLOUD_RUN_URL=... LMDR_INTERNAL_KEY=... npm test -- tests/regression/live-smoke.test.js
 */

const BASE_URL = process.env.CLOUD_RUN_URL;
const AUTH_KEY = process.env.LMDR_INTERNAL_KEY;

const describeIf = (condition, name, fn) =>
  condition ? describe(name, fn) : describe.skip(name, fn);

describeIf(BASE_URL && AUTH_KEY, 'Live Cloud Run API smoke tests', () => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AUTH_KEY}`,
  };

  it('GET /health returns ok', async () => {
    const res = await fetch(`${BASE_URL}/health`, { headers });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.db).toBe('ok');
  });

  it('GET /v1/carriers/count returns > 20000', async () => {
    const res = await fetch(`${BASE_URL}/v1/carriers/count`, { headers });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBeGreaterThan(20000);
  });

  it('POST /v1/carriers/query returns records', async () => {
    const res = await fetch(`${BASE_URL}/v1/carriers/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ limit: 3, filters: [] }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.records.length).toBe(3);
    expect(body.total).toBeGreaterThan(20000);
  });

  it('POST /v1/driverProfiles/query returns records', async () => {
    const res = await fetch(`${BASE_URL}/v1/driverProfiles/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ limit: 5, filters: [] }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.records.length).toBeGreaterThan(0);
  });

  it('returns x-trace-id header on requests', async () => {
    const res = await fetch(`${BASE_URL}/v1/carriers/count`, { headers });
    const traceId = res.headers.get('x-trace-id');
    expect(traceId).toBeTruthy();
    expect(traceId.length).toBeGreaterThan(10);
  });

  it('rejects request without auth', async () => {
    const res = await fetch(`${BASE_URL}/v1/carriers/count`);
    expect(res.status).toBe(401);
  });

  it('returns 400 for unknown collection', async () => {
    const res = await fetch(`${BASE_URL}/v1/fakeCollection/count`, { headers });
    expect(res.status).toBe(400);
  });
});
