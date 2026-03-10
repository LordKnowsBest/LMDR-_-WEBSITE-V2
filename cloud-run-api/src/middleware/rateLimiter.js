export const TIER_LIMITS = {
  starter:    { perMinute: 10,  perMonth: 5000 },
  growth:     { perMinute: 60,  perMonth: 50000 },
  enterprise: { perMinute: 300, perMonth: Infinity },
  custom:     { perMinute: 600, perMonth: Infinity },
};

// In-memory minute buckets: Map<partnerId, { count, windowStart }>
const minuteBuckets = new Map();

export function checkMinuteLimit(partnerId, tier, currentCount) {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.starter;
  const allowed = currentCount < limits.perMinute;
  return {
    allowed,
    remaining: Math.max(0, limits.perMinute - currentCount),
    limit: limits.perMinute,
    retryAfter: allowed ? 0 : 60,
  };
}

function getMinuteBucket(partnerId) {
  const now = Date.now();
  const windowStart = Math.floor(now / 60000) * 60000;
  const existing = minuteBuckets.get(partnerId);

  if (!existing || existing.windowStart !== windowStart) {
    const fresh = { count: 0, windowStart };
    minuteBuckets.set(partnerId, fresh);
    return fresh;
  }
  return existing;
}

/**
 * Express middleware. Applies per-minute rate limiting to API key requests.
 * Firebase Auth requests (internal) are not rate-limited at this layer.
 */
export function rateLimiter() {
  return (req, res, next) => {
    if (!req.auth || req.auth.type !== 'apiKey') return next();

    const { partnerId, tier } = req.auth;
    const bucket = getMinuteBucket(partnerId);
    bucket.count++;

    const result = checkMinuteLimit(partnerId, tier, bucket.count);
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.starter;

    res.set({
      'X-RateLimit-Limit': String(limits.perMinute),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(Math.floor(bucket.windowStart / 1000) + 60),
    });

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: result.retryAfter,
      });
    }

    next();
  };
}
