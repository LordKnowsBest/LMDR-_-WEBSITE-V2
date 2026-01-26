/**
 * Unit Tests for streakService.jsw
 *
 * Tests the streak management system including:
 * - Daily login recording
 * - Streak continuation/break detection
 * - Streak freeze management
 * - Timezone handling
 */

// Mock the Airtable client
jest.mock('backend/airtableClient', () => ({
  queryRecords: jest.fn(),
  updateRecord: jest.fn()
}));

// Mock the config
jest.mock('backend/config', () => ({
  getAirtableTableName: jest.fn((key) => `v2_${key}`)
}));

// Mock gamificationService
jest.mock('backend/gamificationService', () => ({
  awardDriverXP: jest.fn().mockResolvedValue({ xp_earned: 5 }),
  logGamificationEvent: jest.fn().mockResolvedValue({})
}));

// Mock gamificationConfig
jest.mock('backend/gamificationConfig', () => ({
  getStreakMultiplier: jest.fn((days) => {
    if (days >= 90) return 1.5;
    if (days >= 60) return 1.35;
    if (days >= 30) return 1.25;
    if (days >= 14) return 1.15;
    if (days >= 7) return 1.1;
    return 1.0;
  }),
  DRIVER_XP_ACTIONS: {
    streak_7_day: { xp: 50 },
    streak_30_day: { xp: 200 },
    streak_60_day: { xp: 300 },
    streak_90_day: { xp: 500 }
  }
}));

import * as airtable from 'backend/airtableClient';
import { awardDriverXP, logGamificationEvent } from 'backend/gamificationService';
import {
  recordDailyLogin,
  getStreakStatus,
  useStreakFreeze,
  grantStreakFreeze,
  getStreaksAtRisk,
  processExpiredStreaks
} from 'backend/streakService';

// =============================================================================
// TEST HELPERS
// =============================================================================

function getTodayUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function getYesterdayUTC() {
  const d = getTodayUTC();
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

function getDaysAgoUTC(days) {
  const d = getTodayUTC();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

// =============================================================================
// SETUP / TEARDOWN
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// recordDailyLogin TESTS
// =============================================================================

describe('recordDailyLogin', () => {
  test('should return error if no progression record found', async () => {
    airtable.queryRecords.mockResolvedValue({ records: [] });

    const result = await recordDailyLogin('driver_001');

    expect(result.success).toBe(false);
    expect(result.reason).toBe('no_progression_record');
  });

  test('should return already_logged_today if same day login', async () => {
    const today = new Date().toISOString();
    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Last Login Date': today,
        'Streak Days': 5,
        'Longest Streak': 10,
        'Streak Freeze Available': 1
      }]
    });

    const result = await recordDailyLogin('driver_001');

    expect(result.success).toBe(true);
    expect(result.already_logged_today).toBe(true);
    expect(result.streak_days).toBe(5);
    expect(result.xp_earned).toBe(0);
    expect(airtable.updateRecord).not.toHaveBeenCalled();
  });

  test('should continue streak if logged in yesterday', async () => {
    const yesterday = getYesterdayUTC().toISOString();
    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Last Login Date': yesterday,
        'Streak Days': 5,
        'Longest Streak': 10,
        'Streak Freeze Available': 1
      }]
    });
    airtable.updateRecord.mockResolvedValue({});

    const result = await recordDailyLogin('driver_001');

    expect(result.success).toBe(true);
    expect(result.streak_continued).toBe(true);
    expect(result.streak_days).toBe(6);
    expect(result.previous_streak).toBe(5);
    expect(airtable.updateRecord).toHaveBeenCalled();
    expect(awardDriverXP).toHaveBeenCalledWith('driver_001', 'daily_login', expect.any(Object));
  });

  test('should break streak if more than 1 day missed', async () => {
    const threeDaysAgo = getDaysAgoUTC(3).toISOString();
    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Last Login Date': threeDaysAgo,
        'Streak Days': 15,
        'Longest Streak': 20,
        'Streak Freeze Available': 0
      }]
    });
    airtable.updateRecord.mockResolvedValue({});

    const result = await recordDailyLogin('driver_001');

    expect(result.success).toBe(true);
    expect(result.streak_broken).toBe(true);
    expect(result.streak_days).toBe(1);
    expect(result.previous_streak).toBe(15);
  });

  test('should detect streak milestone at 7 days', async () => {
    const yesterday = getYesterdayUTC().toISOString();
    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Last Login Date': yesterday,
        'Streak Days': 6, // Will become 7
        'Longest Streak': 10,
        'Streak Freeze Available': 1
      }]
    });
    airtable.updateRecord.mockResolvedValue({});

    const result = await recordDailyLogin('driver_001');

    expect(result.success).toBe(true);
    expect(result.streak_days).toBe(7);
    expect(result.streak_milestone).toBe(7);
    expect(result.milestone_xp).toBe(50);
    // Should award both daily login and milestone XP
    expect(awardDriverXP).toHaveBeenCalledTimes(2);
  });

  test('should update longest streak when exceeded', async () => {
    const yesterday = getYesterdayUTC().toISOString();
    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Last Login Date': yesterday,
        'Streak Days': 10,
        'Longest Streak': 10, // Will be exceeded
        'Streak Freeze Available': 1
      }]
    });
    airtable.updateRecord.mockResolvedValue({});

    const result = await recordDailyLogin('driver_001');

    expect(result.longest_streak).toBe(11);
    expect(airtable.updateRecord).toHaveBeenCalledWith(
      expect.any(String),
      'rec123',
      expect.objectContaining({
        'Longest Streak': 11
      })
    );
  });

  test('should start new streak on first login', async () => {
    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Last Login Date': null,
        'Streak Days': 0,
        'Longest Streak': 0,
        'Streak Freeze Available': 1
      }]
    });
    airtable.updateRecord.mockResolvedValue({});

    const result = await recordDailyLogin('driver_001');

    expect(result.success).toBe(true);
    expect(result.streak_days).toBe(1);
    expect(result.streak_continued).toBe(false);
    expect(result.streak_broken).toBe(false);
  });
});

// =============================================================================
// getStreakStatus TESTS
// =============================================================================

describe('getStreakStatus', () => {
  test('should return defaults for non-existent driver', async () => {
    airtable.queryRecords.mockResolvedValue({ records: [] });

    const result = await getStreakStatus('driver_001');

    expect(result.streak_days).toBe(0);
    expect(result.multiplier).toBe(1.0);
    expect(result.logged_in_today).toBe(false);
  });

  test('should indicate logged in today when same day', async () => {
    const today = new Date().toISOString();
    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Last Login Date': today,
        'Streak Days': 5,
        'Longest Streak': 10,
        'Streak Freeze Available': 2
      }]
    });

    const result = await getStreakStatus('driver_001');

    expect(result.logged_in_today).toBe(true);
    expect(result.streak_days).toBe(5);
    expect(result.will_break_if_no_login).toBe(false);
  });

  test('should indicate streak at risk if not logged in today', async () => {
    const yesterday = getYesterdayUTC().toISOString();
    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Last Login Date': yesterday,
        'Streak Days': 5,
        'Longest Streak': 10,
        'Streak Freeze Available': 2
      }]
    });

    const result = await getStreakStatus('driver_001');

    expect(result.logged_in_today).toBe(false);
    expect(result.will_break_if_no_login).toBe(true);
    expect(result.streak_days).toBe(5);
  });

  test('should show effective streak as 0 if already broken', async () => {
    const threeDaysAgo = getDaysAgoUTC(3).toISOString();
    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Last Login Date': threeDaysAgo,
        'Streak Days': 10,
        'Longest Streak': 15,
        'Streak Freeze Available': 0
      }]
    });

    const result = await getStreakStatus('driver_001');

    expect(result.streak_days).toBe(0); // Effective streak is broken
    expect(result.will_break_if_no_login).toBe(false);
  });

  test('should calculate next milestone correctly', async () => {
    const today = new Date().toISOString();
    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Last Login Date': today,
        'Streak Days': 5,
        'Longest Streak': 10,
        'Streak Freeze Available': 1
      }]
    });

    const result = await getStreakStatus('driver_001');

    expect(result.next_milestone).toBe(7);
    expect(result.days_to_milestone).toBe(2);
  });

  test('should return correct multiplier for streak days', async () => {
    const today = new Date().toISOString();
    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Last Login Date': today,
        'Streak Days': 45,
        'Longest Streak': 50,
        'Streak Freeze Available': 1
      }]
    });

    const result = await getStreakStatus('driver_001');

    expect(result.multiplier).toBe(1.25); // 30-59 days = 1.25x
  });
});

// =============================================================================
// useStreakFreeze TESTS
// =============================================================================

describe('useStreakFreeze', () => {
  test('should return error if no progression record', async () => {
    airtable.queryRecords.mockResolvedValue({ records: [] });

    const result = await useStreakFreeze('driver_001');

    expect(result.success).toBe(false);
    expect(result.reason).toBe('no_progression_record');
  });

  test('should return error if no freezes available', async () => {
    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Streak Days': 10,
        'Streak Freeze Available': 0
      }]
    });

    const result = await useStreakFreeze('driver_001');

    expect(result.success).toBe(false);
    expect(result.reason).toBe('no_freezes_available');
  });

  test('should deduct freeze and preserve streak', async () => {
    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Streak Days': 10,
        'Streak Freeze Available': 2
      }]
    });
    airtable.updateRecord.mockResolvedValue({});

    const result = await useStreakFreeze('driver_001');

    expect(result.success).toBe(true);
    expect(result.freezes_remaining).toBe(1);
    expect(result.streak_preserved).toBe(10);
    expect(airtable.updateRecord).toHaveBeenCalledWith(
      expect.any(String),
      'rec123',
      expect.objectContaining({
        'Streak Freeze Available': 1
      })
    );
    expect(logGamificationEvent).toHaveBeenCalled();
  });
});

// =============================================================================
// grantStreakFreeze TESTS
// =============================================================================

describe('grantStreakFreeze', () => {
  test('should return error if no progression record', async () => {
    airtable.queryRecords.mockResolvedValue({ records: [] });

    const result = await grantStreakFreeze('driver_001');

    expect(result.success).toBe(false);
  });

  test('should grant freeze up to max of 3', async () => {
    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Streak Freeze Available': 1
      }]
    });
    airtable.updateRecord.mockResolvedValue({});

    const result = await grantStreakFreeze('driver_001');

    expect(result.success).toBe(true);
    expect(result.new_total).toBe(2);
    expect(airtable.updateRecord).toHaveBeenCalledWith(
      expect.any(String),
      'rec123',
      expect.objectContaining({
        'Streak Freeze Available': 2
      })
    );
  });

  test('should cap at max 3 freezes', async () => {
    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Streak Freeze Available': 3
      }]
    });
    airtable.updateRecord.mockResolvedValue({});

    const result = await grantStreakFreeze('driver_001', 2);

    expect(result.success).toBe(true);
    expect(result.new_total).toBe(3); // Capped
    expect(result.amount_granted).toBe(0); // None actually granted
  });
});

// =============================================================================
// getStreaksAtRisk TESTS
// =============================================================================

describe('getStreaksAtRisk', () => {
  test('should return drivers with streaks who have not logged in today', async () => {
    const yesterday = getYesterdayUTC().toISOString();
    airtable.queryRecords.mockResolvedValue({
      records: [
        {
          'Driver ID': 'driver_001',
          'Streak Days': 5,
          'Last Login Date': yesterday,
          'Streak Freeze Available': 1
        },
        {
          'Driver ID': 'driver_002',
          'Streak Days': 10,
          'Last Login Date': yesterday,
          'Streak Freeze Available': 0
        }
      ]
    });

    const result = await getStreaksAtRisk();

    expect(result).toHaveLength(2);
    expect(result[0].driverId).toBe('driver_001');
    expect(result[0].streakDays).toBe(5);
  });

  test('should return empty array on error', async () => {
    airtable.queryRecords.mockRejectedValue(new Error('Network error'));

    const result = await getStreaksAtRisk();

    expect(result).toEqual([]);
  });
});

// =============================================================================
// processExpiredStreaks TESTS
// =============================================================================

describe('processExpiredStreaks', () => {
  test('should break streaks for drivers 2+ days without login and no freeze', async () => {
    const threeDaysAgo = getDaysAgoUTC(3).toISOString();
    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Last Login Date': threeDaysAgo,
        'Streak Days': 10,
        'Streak Freeze Available': 0
      }]
    });
    airtable.updateRecord.mockResolvedValue({});

    const result = await processExpiredStreaks();

    expect(result.processed).toBe(1);
    expect(result.streaks_broken).toBe(1);
    expect(airtable.updateRecord).toHaveBeenCalledWith(
      expect.any(String),
      'rec123',
      expect.objectContaining({
        'Streak Days': 0
      })
    );
  });

  test('should auto-use freeze for 2-day gap with freeze available', async () => {
    const twoDaysAgo = getDaysAgoUTC(2).toISOString();
    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Last Login Date': twoDaysAgo,
        'Streak Days': 10,
        'Streak Freeze Available': 2
      }]
    });
    airtable.updateRecord.mockResolvedValue({});

    const result = await processExpiredStreaks();

    expect(result.freezes_used).toBe(1);
    expect(result.streaks_broken).toBe(0);
    expect(airtable.updateRecord).toHaveBeenCalledWith(
      expect.any(String),
      'rec123',
      expect.objectContaining({
        'Streak Freeze Available': 1
      })
    );
  });
});

// =============================================================================
// TIMEZONE EDGE CASE TESTS
// =============================================================================

describe('Timezone Edge Cases', () => {
  test('should handle UTC midnight correctly', async () => {
    // Create a date that's just after midnight UTC
    const justAfterMidnight = new Date();
    justAfterMidnight.setUTCHours(0, 5, 0, 0);

    // Yesterday would be the previous day
    const yesterdayEnd = new Date(justAfterMidnight);
    yesterdayEnd.setUTCDate(yesterdayEnd.getUTCDate() - 1);
    yesterdayEnd.setUTCHours(23, 55, 0, 0);

    airtable.queryRecords.mockResolvedValue({
      records: [{
        id: 'rec123',
        'Driver ID': 'driver_001',
        'Last Login Date': yesterdayEnd.toISOString(),
        'Streak Days': 5,
        'Longest Streak': 5,
        'Streak Freeze Available': 1
      }]
    });
    airtable.updateRecord.mockResolvedValue({});

    const result = await recordDailyLogin('driver_001');

    // Should continue streak since last login was yesterday
    expect(result.streak_continued).toBe(true);
    expect(result.streak_days).toBe(6);
  });
});
