/**
 * Simple in-memory rate limiter.
 * 60 requests/minute per IP, burst of 10.
 * Production: replace with Redis for multi-instance deployments.
 */

const WINDOW_MS  = 60_000;
const MAX_REQ    = 60;

const buckets = new Map();

function getIp(c) {
  return c.req.header('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

export function rateLimitMiddleware() {
  return async (c, next) => {
    // Internal bulk operations bypass per-IP rate limiting
    if (c.req.header('x-lmdr-internal-key')) {
      return next();
    }

    const ip  = getIp(c);
    const now = Date.now();

    let bucket = buckets.get(ip);
    if (!bucket || now - bucket.windowStart > WINDOW_MS) {
      bucket = { windowStart: now, count: 0 };
    }

    bucket.count++;
    buckets.set(ip, bucket);

    if (bucket.count > MAX_REQ) {
      const retryAfter = Math.ceil((WINDOW_MS - (now - bucket.windowStart)) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json({ error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } }, 429);
    }

    await next();
  };
}
