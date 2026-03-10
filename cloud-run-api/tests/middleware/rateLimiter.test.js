import { TIER_LIMITS, checkMinuteLimit } from '../../src/middleware/rateLimiter.js';

describe('TIER_LIMITS', () => {
  it('has correct starter limits', () => {
    expect(TIER_LIMITS.starter.perMinute).toBe(10);
    expect(TIER_LIMITS.starter.perMonth).toBe(5000);
  });
  it('has correct growth limits', () => {
    expect(TIER_LIMITS.growth.perMinute).toBe(60);
    expect(TIER_LIMITS.growth.perMonth).toBe(50000);
  });
  it('enterprise has unlimited monthly', () => {
    expect(TIER_LIMITS.enterprise.perMonth).toBe(Infinity);
  });
  it('custom has highest per-minute', () => {
    expect(TIER_LIMITS.custom.perMinute).toBe(600);
  });
});

describe('checkMinuteLimit', () => {
  it('allows requests under limit', () => {
    const result = checkMinuteLimit('partner-1', 'starter', 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
  });
  it('blocks when at limit', () => {
    const result = checkMinuteLimit('partner-2', 'starter', 10);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(60);
  });
  it('blocks when over limit', () => {
    const result = checkMinuteLimit('partner-3', 'starter', 15);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
  it('uses growth tier limits', () => {
    const result = checkMinuteLimit('partner-4', 'growth', 50);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(10);
  });
  it('defaults to starter for unknown tier', () => {
    const result = checkMinuteLimit('partner-5', 'unknown_tier', 11);
    expect(result.allowed).toBe(false);
  });
});
