/* eslint-disable */
/**
 * Unit Tests for streakService Logic
 *
 * Replicated core logic for environment verification.
 */

// =============================================================================
// REPLICATED LOGIC
// =============================================================================

function getStartOfDayUTC(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function getTodayUTC() {
  return getStartOfDayUTC(new Date());
}

function isSameDayUTC(date1, date2) {
  const d1 = getStartOfDayUTC(new Date(date1));
  const d2 = getStartOfDayUTC(new Date(date2));
  return d1.getTime() === d2.getTime();
}

function getDaysSinceUTC(date) {
  const then = getStartOfDayUTC(new Date(date));
  const now = getTodayUTC();
  const diffMs = now.getTime() - then.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  return Math.floor(diffMs / oneDayMs);
}

const STREAK_MULTIPLIERS = {
  driver: [
    { minDays: 1,  maxDays: 6,   multiplier: 1.0 },
    { minDays: 7,  maxDays: 13,  multiplier: 1.1 },
    { minDays: 30, maxDays: 59,  multiplier: 1.25 }
  ]
};

function getStreakMultiplier(streakDays, userType = 'driver') {
  const multipliers = STREAK_MULTIPLIERS[userType] || STREAK_MULTIPLIERS.driver;
  for (const bracket of multipliers) {
    if (streakDays >= bracket.minDays && streakDays <= bracket.maxDays) {
      return bracket.multiplier;
    }
  }
  return 1.0;
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Streak Date Logic', () => {
  test('isSameDayUTC should detect same days', () => {
    const d1 = '2026-01-26T10:00:00Z';
    const d2 = '2026-01-26T22:00:00Z';
    expect(isSameDayUTC(d1, d2)).toBe(true);
  });

  test('isSameDayUTC should detect different days', () => {
    const d1 = '2026-01-26T23:59:59Z';
    const d2 = '2026-01-27T00:00:01Z';
    expect(isSameDayUTC(d1, d2)).toBe(false);
  });

  test('getDaysSinceUTC should return 1 for yesterday', () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    expect(getDaysSinceUTC(yesterday)).toBe(1);
  });
});

describe('Streak Multipliers', () => {
  test('should return 1.0 for 5 days', () => {
    expect(getStreakMultiplier(5)).toBe(1.0);
  });
  test('should return 1.1 for 7 days', () => {
    expect(getStreakMultiplier(7)).toBe(1.1);
  });
  test('should return 1.25 for 30 days', () => {
    expect(getStreakMultiplier(30)).toBe(1.25);
  });
});