/**
 * Unit Tests for gamificationConfig.js
 *
 * Tests the static configuration and helper functions for the gamification system.
 */

import {
  DRIVER_LEVELS,
  RECRUITER_RANKS,
  DRIVER_XP_ACTIONS,
  RECRUITER_POINT_ACTIONS,
  STREAK_MULTIPLIERS,
  RATE_LIMITS,
  getLevelForXP,
  getRankForPoints,
  getStreakMultiplier,
  getDriverXPConfig,
  getRecruiterPointsConfig,
  isRateLimited
} from 'backend/gamificationConfig';

// =============================================================================
// DRIVER LEVELS TESTS
// =============================================================================

describe('DRIVER_LEVELS Configuration', () => {
  test('should have 10 levels defined', () => {
    expect(DRIVER_LEVELS).toHaveLength(10);
  });

  test('should start at level 1 with 0 XP required', () => {
    expect(DRIVER_LEVELS[0].level).toBe(1);
    expect(DRIVER_LEVELS[0].xpRequired).toBe(0);
  });

  test('should end at level 10 with 10000 XP required', () => {
    expect(DRIVER_LEVELS[9].level).toBe(10);
    expect(DRIVER_LEVELS[9].xpRequired).toBe(10000);
  });

  test('levels should be in ascending order by XP', () => {
    for (let i = 1; i < DRIVER_LEVELS.length; i++) {
      expect(DRIVER_LEVELS[i].xpRequired).toBeGreaterThan(DRIVER_LEVELS[i - 1].xpRequired);
    }
  });

  test('each level should have required properties', () => {
    DRIVER_LEVELS.forEach((level) => {
      expect(level).toHaveProperty('level');
      expect(level).toHaveProperty('title');
      expect(level).toHaveProperty('xpRequired');
      expect(level).toHaveProperty('unlock');
    });
  });
});

// =============================================================================
// RECRUITER RANKS TESTS
// =============================================================================

describe('RECRUITER_RANKS Configuration', () => {
  test('should have 8 ranks defined', () => {
    expect(RECRUITER_RANKS).toHaveLength(8);
  });

  test('should start at rank 1 with 0 points required', () => {
    expect(RECRUITER_RANKS[0].rank).toBe(1);
    expect(RECRUITER_RANKS[0].pointsRequired).toBe(0);
  });

  test('should end at rank 8 with 35000 points required', () => {
    expect(RECRUITER_RANKS[7].rank).toBe(8);
    expect(RECRUITER_RANKS[7].pointsRequired).toBe(35000);
  });

  test('ranks should be in ascending order by points', () => {
    for (let i = 1; i < RECRUITER_RANKS.length; i++) {
      expect(RECRUITER_RANKS[i].pointsRequired).toBeGreaterThan(RECRUITER_RANKS[i - 1].pointsRequired);
    }
  });

  test('each rank should have required properties', () => {
    RECRUITER_RANKS.forEach((rank) => {
      expect(rank).toHaveProperty('rank');
      expect(rank).toHaveProperty('title');
      expect(rank).toHaveProperty('pointsRequired');
      expect(rank).toHaveProperty('unlock');
    });
  });
});

// =============================================================================
// getLevelForXP TESTS
// =============================================================================

describe('getLevelForXP', () => {
  test('should return level 1 for 0 XP', () => {
    const result = getLevelForXP(0);
    expect(result.level).toBe(1);
    expect(result.title).toBe('Rookie Driver');
    expect(result.isMaxLevel).toBe(false);
  });

  test('should return level 1 for 99 XP (just under level 2)', () => {
    const result = getLevelForXP(99);
    expect(result.level).toBe(1);
    expect(result.xpToNext).toBe(1);
    expect(result.progress).toBe(99);
  });

  test('should return level 2 for exactly 100 XP', () => {
    const result = getLevelForXP(100);
    expect(result.level).toBe(2);
    expect(result.title).toBe('Road Ready');
  });

  test('should return level 5 for 1000 XP', () => {
    const result = getLevelForXP(1000);
    expect(result.level).toBe(5);
    expect(result.title).toBe('Route Master');
  });

  test('should return level 10 (max) for 10000+ XP', () => {
    const result = getLevelForXP(10000);
    expect(result.level).toBe(10);
    expect(result.title).toBe('Road Legend');
    expect(result.isMaxLevel).toBe(true);
    expect(result.xpToNext).toBe(0);
    expect(result.progress).toBe(100);
  });

  test('should handle XP beyond max level', () => {
    const result = getLevelForXP(50000);
    expect(result.level).toBe(10);
    expect(result.isMaxLevel).toBe(true);
  });

  test('should calculate progress correctly mid-level', () => {
    // Level 2 is 100 XP, Level 3 is 300 XP
    // At 200 XP, should be 50% through level 2
    const result = getLevelForXP(200);
    expect(result.level).toBe(2);
    expect(result.xpInLevel).toBe(100);
    expect(result.progress).toBe(50);
  });
});

// =============================================================================
// getRankForPoints TESTS
// =============================================================================

describe('getRankForPoints', () => {
  test('should return rank 1 for 0 points', () => {
    const result = getRankForPoints(0);
    expect(result.rank).toBe(1);
    expect(result.title).toBe('Scout');
    expect(result.isMaxRank).toBe(false);
  });

  test('should return rank 1 for 499 points (just under rank 2)', () => {
    const result = getRankForPoints(499);
    expect(result.rank).toBe(1);
    expect(result.pointsToNext).toBe(1);
  });

  test('should return rank 2 for exactly 500 points', () => {
    const result = getRankForPoints(500);
    expect(result.rank).toBe(2);
    expect(result.title).toBe('Recruiter');
  });

  test('should return rank 5 for 7000 points', () => {
    const result = getRankForPoints(7000);
    expect(result.rank).toBe(5);
    expect(result.title).toBe('Staffing Expert');
  });

  test('should return rank 8 (max) for 35000+ points', () => {
    const result = getRankForPoints(35000);
    expect(result.rank).toBe(8);
    expect(result.title).toBe('Talent Champion');
    expect(result.isMaxRank).toBe(true);
    expect(result.pointsToNext).toBe(0);
    expect(result.progress).toBe(100);
  });

  test('should handle points beyond max rank', () => {
    const result = getRankForPoints(100000);
    expect(result.rank).toBe(8);
    expect(result.isMaxRank).toBe(true);
  });
});

// =============================================================================
// getStreakMultiplier TESTS
// =============================================================================

describe('getStreakMultiplier', () => {
  describe('driver multipliers', () => {
    test('should return 1.0x for days 1-6', () => {
      expect(getStreakMultiplier(1, 'driver')).toBe(1.0);
      expect(getStreakMultiplier(6, 'driver')).toBe(1.0);
    });

    test('should return 1.1x for days 7-13', () => {
      expect(getStreakMultiplier(7, 'driver')).toBe(1.1);
      expect(getStreakMultiplier(13, 'driver')).toBe(1.1);
    });

    test('should return 1.15x for days 14-29', () => {
      expect(getStreakMultiplier(14, 'driver')).toBe(1.15);
      expect(getStreakMultiplier(29, 'driver')).toBe(1.15);
    });

    test('should return 1.25x for days 30-59', () => {
      expect(getStreakMultiplier(30, 'driver')).toBe(1.25);
      expect(getStreakMultiplier(59, 'driver')).toBe(1.25);
    });

    test('should return 1.35x for days 60-89', () => {
      expect(getStreakMultiplier(60, 'driver')).toBe(1.35);
      expect(getStreakMultiplier(89, 'driver')).toBe(1.35);
    });

    test('should return 1.5x (max) for days 90+', () => {
      expect(getStreakMultiplier(90, 'driver')).toBe(1.5);
      expect(getStreakMultiplier(365, 'driver')).toBe(1.5);
    });
  });

  describe('recruiter multipliers', () => {
    test('should return 1.0x for days 1-6', () => {
      expect(getStreakMultiplier(1, 'recruiter')).toBe(1.0);
    });

    test('should return 1.05x for days 7-13', () => {
      expect(getStreakMultiplier(7, 'recruiter')).toBe(1.05);
    });

    test('should return 1.25x (max) for days 90+', () => {
      expect(getStreakMultiplier(90, 'recruiter')).toBe(1.25);
    });
  });

  test('should default to driver multipliers for unknown user type', () => {
    expect(getStreakMultiplier(30, 'unknown')).toBe(1.25);
  });

  test('should return 1.0 for 0 streak days', () => {
    expect(getStreakMultiplier(0, 'driver')).toBe(1.0);
  });
});

// =============================================================================
// getDriverXPConfig TESTS
// =============================================================================

describe('getDriverXPConfig', () => {
  test('should return config for valid action', () => {
    const config = getDriverXPConfig('daily_login');
    expect(config).not.toBeNull();
    expect(config.xp).toBe(5);
    expect(config.dailyLimit).toBe(1);
  });

  test('should return null for invalid action', () => {
    const config = getDriverXPConfig('invalid_action');
    expect(config).toBeNull();
  });

  test('profile_complete_basic should be one-time 50 XP', () => {
    const config = getDriverXPConfig('profile_complete_basic');
    expect(config.xp).toBe(50);
    expect(config.oneTime).toBe(true);
  });

  test('accept_offer should award 500 XP', () => {
    const config = getDriverXPConfig('accept_offer');
    expect(config.xp).toBe(500);
  });

  test('apply_job should award 25 XP', () => {
    const config = getDriverXPConfig('apply_job');
    expect(config.xp).toBe(25);
  });

  test('leave_review should have weekly limit of 3', () => {
    const config = getDriverXPConfig('leave_review');
    expect(config.xp).toBe(20);
    expect(config.weeklyLimit).toBe(3);
  });
});

// =============================================================================
// getRecruiterPointsConfig TESTS
// =============================================================================

describe('getRecruiterPointsConfig', () => {
  test('should return config for valid action', () => {
    const config = getRecruiterPointsConfig('view_driver_profile');
    expect(config).not.toBeNull();
    expect(config.points).toBe(2);
    expect(config.dailyLimit).toBe(20);
  });

  test('should return null for invalid action', () => {
    const config = getRecruiterPointsConfig('invalid_action');
    expect(config).toBeNull();
  });

  test('successful_hire should award 500 points', () => {
    const config = getRecruiterPointsConfig('successful_hire');
    expect(config.points).toBe(500);
  });

  test('retention_90_day should award 1000 points', () => {
    const config = getRecruiterPointsConfig('retention_90_day');
    expect(config.points).toBe(1000);
  });

  test('complete_carrier_profile should be one-time 100 points', () => {
    const config = getRecruiterPointsConfig('complete_carrier_profile');
    expect(config.points).toBe(100);
    expect(config.oneTime).toBe(true);
  });

  test('maintain_high_rating should have monthly limit of 1', () => {
    const config = getRecruiterPointsConfig('maintain_high_rating');
    expect(config.points).toBe(100);
    expect(config.monthlyLimit).toBe(1);
  });
});

// =============================================================================
// isRateLimited TESTS
// =============================================================================

describe('isRateLimited', () => {
  test('should return false when under daily limit', () => {
    expect(isRateLimited('daily_login', 0, 'daily')).toBe(false);
  });

  test('should return true when at daily limit', () => {
    expect(isRateLimited('daily_login', 1, 'daily')).toBe(true);
  });

  test('should return true when over daily limit', () => {
    expect(isRateLimited('daily_login', 5, 'daily')).toBe(true);
  });

  test('should return false for action without limit', () => {
    expect(isRateLimited('apply_job', 100, 'daily')).toBe(false);
  });

  test('should return false for unknown action', () => {
    expect(isRateLimited('unknown_action', 100, 'daily')).toBe(false);
  });

  test('should check weekly limits for leave_review', () => {
    expect(isRateLimited('leave_review', 2, 'weekly')).toBe(false);
    expect(isRateLimited('leave_review', 3, 'weekly')).toBe(true);
  });

  test('should check monthly limits for maintain_high_rating', () => {
    expect(isRateLimited('maintain_high_rating', 0, 'monthly')).toBe(false);
    expect(isRateLimited('maintain_high_rating', 1, 'monthly')).toBe(true);
  });
});

// =============================================================================
// RATE_LIMITS CONFIGURATION TESTS
// =============================================================================

describe('RATE_LIMITS Configuration', () => {
  test('should have anti-cheat limits defined', () => {
    expect(RATE_LIMITS.daily_login_xp).toBe(1);
    expect(RATE_LIMITS.profile_view_xp).toBe(10);
    expect(RATE_LIMITS.review_xp).toBe(3);
  });

  test('should have cooldown values', () => {
    expect(RATE_LIMITS.same_action_cooldown).toBe(60000); // 1 minute
    expect(RATE_LIMITS.level_up_cooldown).toBe(5000); // 5 seconds
  });
});

// =============================================================================
// STREAK_MULTIPLIERS CONFIGURATION TESTS
// =============================================================================

describe('STREAK_MULTIPLIERS Configuration', () => {
  test('driver multipliers should not exceed 1.5x', () => {
    const maxDriverMultiplier = Math.max(
      ...STREAK_MULTIPLIERS.driver.map(b => b.multiplier)
    );
    expect(maxDriverMultiplier).toBe(1.5);
  });

  test('recruiter multipliers should not exceed 1.25x', () => {
    const maxRecruiterMultiplier = Math.max(
      ...STREAK_MULTIPLIERS.recruiter.map(b => b.multiplier)
    );
    expect(maxRecruiterMultiplier).toBe(1.25);
  });

  test('multiplier brackets should cover all days from 1 to 999', () => {
    // Verify no gaps in coverage
    const driverBrackets = STREAK_MULTIPLIERS.driver;
    for (let i = 0; i < driverBrackets.length - 1; i++) {
      expect(driverBrackets[i + 1].minDays).toBe(driverBrackets[i].maxDays + 1);
    }
  });
});
