/**
 * Auth middleware for AI Intelligence microservice.
 *
 * Every request must include:
 *   x-lmdr-internal-key: <secret from LMDR_INTERNAL_KEY env var>
 *   x-lmdr-timestamp:    <Unix milliseconds>
 *
 * Rejects 401 on missing/invalid key.
 * Rejects 401 on timestamp outside ±30s window (replay protection).
 */

const TOLERANCE_MS = 30_000;

export function authMiddleware() {
  return async (c, next) => {
    // Browser EventSource cannot send custom headers — the session token in
    // the URL path is the credential for stream/events endpoints.
    if (c.req.path.includes('/stream/events/')) {
      return next();
    }

    const key = c.req.header('x-lmdr-internal-key');
    const ts  = c.req.header('x-lmdr-timestamp');

    if (!key || key !== process.env.LMDR_INTERNAL_KEY) {
      return c.json({ error: { code: 'INVALID_AUTH', message: 'Missing or invalid internal key' } }, 401);
    }

    if (!ts) {
      return c.json({ error: { code: 'INVALID_AUTH', message: 'Missing x-lmdr-timestamp header' } }, 401);
    }

    const tsNum = Number(ts);
    if (Number.isNaN(tsNum) || Math.abs(Date.now() - tsNum) > TOLERANCE_MS) {
      return c.json({ error: { code: 'TIMESTAMP_EXPIRED', message: 'Timestamp outside 30s tolerance window' } }, 401);
    }

    await next();
  };
}
