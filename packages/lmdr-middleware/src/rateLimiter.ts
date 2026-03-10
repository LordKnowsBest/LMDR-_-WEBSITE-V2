import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth';

export const TIER_LIMITS: Record<string, { perMinute: number; perMonth: number }> = {
  starter:    { perMinute: 10,  perMonth: 5000 },
  growth:     { perMinute: 60,  perMonth: 50000 },
  enterprise: { perMinute: 300, perMonth: Infinity },
  custom:     { perMinute: 600, perMonth: Infinity },
};

interface MinuteBucket {
  count: number;
  windowStart: number;
}

const minuteBuckets = new Map<string, MinuteBucket>();

export function checkMinuteLimit(partnerId: string, tier: string, currentCount: number) {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.starter;
  const allowed = currentCount < limits.perMinute;
  return {
    allowed,
    remaining: Math.max(0, limits.perMinute - currentCount),
    limit: limits.perMinute,
    retryAfter: allowed ? 0 : 60,
  };
}

function getMinuteBucket(partnerId: string): MinuteBucket {
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

export function rateLimiter() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
