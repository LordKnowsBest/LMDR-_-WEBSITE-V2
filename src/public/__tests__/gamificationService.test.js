/**
 * Unit Tests for gamificationService.jsw
 *
 * Tests the core gamification service functions with mocked Airtable client.
 */

// Mock the Airtable client
jest.mock('backend/airtableClient', () => ({
  queryRecords: jest.fn(),
  createRecord: jest.fn(),
  updateRecord: jest.fn(),
  getRecord: jest.fn()
}));

// Mock the config
jest.mock('backend/config', () => ({
  getAirtableTableName: jest.fn((key) => `v2_${key}`)
}));

import * as airtable from 'backend/airtableClient';
import {
  initializeProgression,
  getDriverProgression,
  getRecruiterProgression,
  awardDriverXP,
  awardRecruiterPoints,
  checkDriverLevelUp,
  checkRecruiterRankUp,
  getLevelDefinitions,
  logGamificationEvent
} from 'backend/gamificationService';

import {
  DRIVER_LEVELS,
  RECRUITER_RANKS
} from 'backend/gamificationConfig';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const mockDriverProgression = {
  id: 'rec123',
  'Driver ID': 'driver_001',
  'Current XP': 500,
  'Level': 3,
  'Level Title': 'Mile Marker',
  'XP To Next Level': 100,
  'Streak Days': 5,
  'Longest Streak': 10,
  'Streak Freeze Available': 1,
  'Total Applications': 10,
  'Total Responses': 8,
  'Avg Response Hours': 2.5,
  'Profile Completion': 85,
  'Created At': '2025-01-01T00:00:00Z',
  'Updated At': '2025-01-20T00:00:00Z'
};

const mockRecruiterProgression = {
  id: 'rec456',
  'Recruiter ID': 'recruiter_001',
  'Carrier ID': 'carrier_001',
  'Current Points': 2000,
  'Rank': 3,
  'Rank Title': 'Talent Finder',
  'Points To Next Rank': 1500,
  'Total Hires': 8,
  'Total Outreach': 150,
  'Avg Response Hours': 3.0,
  'Hire Acceptance Rate': 75,
  'Retention 90 Day Rate': 85,
  'Driver Satisfaction Avg': 4.5,
  'Created At': '2025-01-01T00:00:00Z',
  'Updated At': '2025-01-20T00:00:00Z'
};

// =============================================================================
// SETUP / TEARDOWN
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// initializeProgression TESTS
// =============================================================================

describe('initializeProgression', () => {
  describe('driver initialization', () => {
    test('should create new driver progression if not exists', async () => {
      airtable.queryRecords.mockResolvedValue({ records: [] });
      airtable.createRecord.mockResolvedValue({
        id: 'new_rec',
        'Driver ID': 'driver_new',
        'Current XP': 0,
        'Level': 1,
        'Level Title': 'Rookie Driver'
      });

      const result = await initializeProgression('driver_new', 'driver');

      expect(airtable.queryRecords).toHaveBeenCalled();
      expect(airtable.createRecord).toHaveBeenCalled();
      expect(result.level).toBe(1);
      expect(result.currentXP).toBe(0);
    });

    test('should return existing progression if already exists', async () => {
      airtable.queryRecords.mockResolvedValue({ records: [mockDriverProgression] });

      const result = await initializeProgression('driver_001', 'driver');

      expect(airtable.createRecord).not.toHaveBeenCalled();
      expect(result.driverId).toBe('driver_001');
      expect(result.currentXP).toBe(500);
    });
  });

  describe('recruiter initialization', () => {
    test('should create new recruiter progression if not exists', async () => {
      airtable.queryRecords.mockResolvedValue({ records: [] });
      airtable.createRecord.mockResolvedValue({
        id: 'new_rec',
        'Recruiter ID': 'recruiter_new',
        'Current Points': 0,
        'Rank': 1,
        'Rank Title': 'Scout'
      });

      const result = await initializeProgression('recruiter_new', 'recruiter');

      expect(airtable.createRecord).toHaveBeenCalled();
      expect(result.rank).toBe(1);
      expect(result.currentPoints).toBe(0);
    });

    test('should return existing progression if already exists', async () => {
      airtable.queryRecords.mockResolvedValue({ records: [mockRecruiterProgression] });

      const result = await initializeProgression('recruiter_001', 'recruiter');

      expect(airtable.createRecord).not.toHaveBeenCalled();
      expect(result.recruiterId).toBe('recruiter_001');
    });
  });

  test('should throw error for invalid user type', async () => {
    await expect(initializeProgression('user_001', 'invalid'))
      .rejects.toThrow('Invalid user type');
  });
});

// =============================================================================
// getDriverProgression TESTS
// =============================================================================

describe('getDriverProgression', () => {
  test('should return progression with level info', async () => {
    airtable.queryRecords.mockResolvedValue({ records: [mockDriverProgression] });

    const result = await getDriverProgression('driver_001');

    expect(result.driverId).toBe('driver_001');
    expect(result.currentXP).toBe(500);
    expect(result).toHaveProperty('levelInfo');
    expect(result).toHaveProperty('streakMultiplier');
    expect(result.streakMultiplier).toBe(1.0); // 5 days = 1.0x
  });

  test('should initialize if not found', async () => {
    airtable.queryRecords.mockResolvedValue({ records: [] });
    airtable.createRecord.mockResolvedValue({
      id: 'new_rec',
      'Driver ID': 'driver_new',
      'Current XP': 0,
      'Level': 1
    });

    const result = await getDriverProgression('driver_new');

    expect(airtable.createRecord).toHaveBeenCalled();
    expect(result.level).toBe(1);
  });
});

// =============================================================================
// getRecruiterProgression TESTS
// =============================================================================

describe('getRecruiterProgression', () => {
  test('should return progression with rank info', async () => {
    airtable.queryRecords.mockResolvedValue({ records: [mockRecruiterProgression] });

    const result = await getRecruiterProgression('recruiter_001');

    expect(result.recruiterId).toBe('recruiter_001');
    expect(result.currentPoints).toBe(2000);
    expect(result).toHaveProperty('rankInfo');
  });

  test('should initialize if not found', async () => {
    airtable.queryRecords.mockResolvedValue({ records: [] });
    airtable.createRecord.mockResolvedValue({
      id: 'new_rec',
      'Recruiter ID': 'recruiter_new',
      'Current Points': 0,
      'Rank': 1
    });

    const result = await getRecruiterProgression('recruiter_new');

    expect(airtable.createRecord).toHaveBeenCalled();
    expect(result.rank).toBe(1);
  });
});

// =============================================================================
// awardDriverXP TESTS
// =============================================================================

describe('awardDriverXP', () => {
  beforeEach(() => {
    // Default: no seasonal events active
    airtable.queryRecords.mockImplementation((tableName) => {
      if (tableName.includes('Seasonal')) {
        return { records: [] };
      }
      if (tableName.includes('Driver Progression')) {
        return { records: [mockDriverProgression] };
      }
      if (tableName.includes('Gamification Events')) {
        return { records: [] }; // No previous events
      }
      return { records: [] };
    });
    airtable.updateRecord.mockResolvedValue({});
    airtable.createRecord.mockResolvedValue({ id: 'event_001' });
  });

  test('should return error for unknown action', async () => {
    const result = await awardDriverXP('driver_001', 'invalid_action');

    expect(result.success).toBe(false);
    expect(result.reason).toBe('unknown_action');
  });

  test('should award XP for valid action', async () => {
    const result = await awardDriverXP('driver_001', 'apply_job', { sourceId: 'job_001' });

    expect(result.success).toBe(true);
    expect(result.xp_earned).toBe(25); // Base XP for apply_job
    expect(result.total_xp).toBe(525); // 500 + 25
    expect(airtable.updateRecord).toHaveBeenCalled();
  });

  test('should apply streak multiplier', async () => {
    // Set up 30-day streak (1.25x multiplier)
    const highStreakProgression = {
      ...mockDriverProgression,
      'Streak Days': 30
    };
    airtable.queryRecords.mockImplementation((tableName) => {
      if (tableName.includes('Seasonal')) return { records: [] };
      if (tableName.includes('Driver Progression')) return { records: [highStreakProgression] };
      if (tableName.includes('Gamification Events')) return { records: [] };
      return { records: [] };
    });

    const result = await awardDriverXP('driver_001', 'apply_job');

    expect(result.success).toBe(true);
    expect(result.xp_earned).toBe(31); // 25 * 1.25 = 31.25 rounded
    expect(result.streak_multiplier).toBe(1.25);
  });

  test('should detect level up', async () => {
    // Set XP just below level up threshold
    const nearLevelUp = {
      ...mockDriverProgression,
      'Current XP': 590, // Level 4 is at 600
      'Level': 3
    };
    airtable.queryRecords.mockImplementation((tableName) => {
      if (tableName.includes('Seasonal')) return { records: [] };
      if (tableName.includes('Driver Progression')) return { records: [nearLevelUp] };
      if (tableName.includes('Gamification Events')) return { records: [] };
      return { records: [] };
    });

    const result = await awardDriverXP('driver_001', 'apply_job'); // +25 XP

    expect(result.success).toBe(true);
    expect(result.level_up).toBe(true);
    expect(result.level).toBe(4);
    expect(result.new_unlock).toBeDefined();
  });

  test('should respect daily rate limits', async () => {
    // Simulate already used daily login today
    airtable.queryRecords.mockImplementation((tableName) => {
      if (tableName.includes('Seasonal')) return { records: [] };
      if (tableName.includes('Driver Progression')) return { records: [mockDriverProgression] };
      if (tableName.includes('Gamification Events')) {
        return { records: [{ id: 'prev_login' }] }; // Already logged in today
      }
      return { records: [] };
    });

    const result = await awardDriverXP('driver_001', 'daily_login');

    expect(result.success).toBe(false);
    expect(result.reason).toBe('rate_limited');
  });

  test('should prevent duplicate one-time achievements', async () => {
    // Simulate already earned profile_complete_basic
    airtable.queryRecords.mockImplementation((tableName) => {
      if (tableName.includes('Seasonal')) return { records: [] };
      if (tableName.includes('Driver Progression')) return { records: [mockDriverProgression] };
      if (tableName.includes('Gamification Events')) {
        return { records: [{ id: 'prev_achievement' }] };
      }
      return { records: [] };
    });

    const result = await awardDriverXP('driver_001', 'profile_complete_basic');

    expect(result.success).toBe(false);
    expect(result.reason).toBe('already_earned');
  });
});

// =============================================================================
// awardRecruiterPoints TESTS
// =============================================================================

describe('awardRecruiterPoints', () => {
  beforeEach(() => {
    airtable.queryRecords.mockImplementation((tableName) => {
      if (tableName.includes('Seasonal')) return { records: [] };
      if (tableName.includes('Recruiter Progression')) return { records: [mockRecruiterProgression] };
      if (tableName.includes('Gamification Events')) return { records: [] };
      return { records: [] };
    });
    airtable.updateRecord.mockResolvedValue({});
    airtable.createRecord.mockResolvedValue({ id: 'event_001' });
  });

  test('should return error for unknown action', async () => {
    const result = await awardRecruiterPoints('recruiter_001', 'invalid_action');

    expect(result.success).toBe(false);
    expect(result.reason).toBe('unknown_action');
  });

  test('should award points for valid action', async () => {
    const result = await awardRecruiterPoints('recruiter_001', 'successful_hire');

    expect(result.success).toBe(true);
    expect(result.points_earned).toBe(500);
    expect(result.total_points).toBe(2500);
  });

  test('should detect rank up', async () => {
    // Set points just below rank up threshold
    const nearRankUp = {
      ...mockRecruiterProgression,
      'Current Points': 3400, // Rank 4 is at 3500
      'Rank': 3
    };
    airtable.queryRecords.mockImplementation((tableName) => {
      if (tableName.includes('Seasonal')) return { records: [] };
      if (tableName.includes('Recruiter Progression')) return { records: [nearRankUp] };
      if (tableName.includes('Gamification Events')) return { records: [] };
      return { records: [] };
    });

    const result = await awardRecruiterPoints('recruiter_001', 'successful_hire'); // +500

    expect(result.success).toBe(true);
    expect(result.rank_up).toBe(true);
    expect(result.rank).toBe(4);
  });

  test('should respect daily rate limits for profile views', async () => {
    // Simulate max profile views today
    airtable.queryRecords.mockImplementation((tableName) => {
      if (tableName.includes('Seasonal')) return { records: [] };
      if (tableName.includes('Recruiter Progression')) return { records: [mockRecruiterProgression] };
      if (tableName.includes('Gamification Events')) {
        return { records: Array(20).fill({ id: 'view' }) }; // 20 views today
      }
      return { records: [] };
    });

    const result = await awardRecruiterPoints('recruiter_001', 'view_driver_profile');

    expect(result.success).toBe(false);
    expect(result.reason).toBe('rate_limited');
  });
});

// =============================================================================
// checkDriverLevelUp TESTS
// =============================================================================

describe('checkDriverLevelUp', () => {
  test('should detect level up when XP exceeds threshold', async () => {
    const needsLevelUp = {
      ...mockDriverProgression,
      'Current XP': 700,
      'Level': 3 // Should be level 4 at 600+ XP
    };
    airtable.queryRecords.mockResolvedValue({ records: [needsLevelUp] });
    airtable.updateRecord.mockResolvedValue({});
    airtable.createRecord.mockResolvedValue({ id: 'event' });

    const result = await checkDriverLevelUp('driver_001');

    expect(result.leveled_up).toBe(true);
    expect(result.new_level).toBe(4);
    expect(result.title).toBe('Highway Hero');
  });

  test('should return false when no level up needed', async () => {
    airtable.queryRecords.mockResolvedValue({ records: [mockDriverProgression] });

    const result = await checkDriverLevelUp('driver_001');

    expect(result.leveled_up).toBe(false);
    expect(result.current_level).toBe(3);
  });
});

// =============================================================================
// checkRecruiterRankUp TESTS
// =============================================================================

describe('checkRecruiterRankUp', () => {
  test('should detect rank up when points exceed threshold', async () => {
    const needsRankUp = {
      ...mockRecruiterProgression,
      'Current Points': 4000,
      'Rank': 3 // Should be rank 4 at 3500+ points
    };
    airtable.queryRecords.mockResolvedValue({ records: [needsRankUp] });
    airtable.updateRecord.mockResolvedValue({});
    airtable.createRecord.mockResolvedValue({ id: 'event' });

    const result = await checkRecruiterRankUp('recruiter_001');

    expect(result.ranked_up).toBe(true);
    expect(result.new_rank).toBe(4);
    expect(result.title).toBe('Hiring Pro');
  });

  test('should return false when no rank up needed', async () => {
    airtable.queryRecords.mockResolvedValue({ records: [mockRecruiterProgression] });

    const result = await checkRecruiterRankUp('recruiter_001');

    expect(result.ranked_up).toBe(false);
    expect(result.current_rank).toBe(3);
  });
});

// =============================================================================
// getLevelDefinitions TESTS
// =============================================================================

describe('getLevelDefinitions', () => {
  test('should return driver levels for driver type', () => {
    const levels = getLevelDefinitions('driver');
    expect(levels).toEqual(DRIVER_LEVELS);
    expect(levels).toHaveLength(10);
  });

  test('should return recruiter ranks for recruiter type', () => {
    const ranks = getLevelDefinitions('recruiter');
    expect(ranks).toEqual(RECRUITER_RANKS);
    expect(ranks).toHaveLength(8);
  });

  test('should return empty array for unknown type', () => {
    const result = getLevelDefinitions('unknown');
    expect(result).toEqual([]);
  });
});

// =============================================================================
// logGamificationEvent TESTS
// =============================================================================

describe('logGamificationEvent', () => {
  test('should create event record', async () => {
    airtable.createRecord.mockResolvedValue({ id: 'event_001' });

    await logGamificationEvent('driver_001', 'driver', {
      eventType: 'xp_earned',
      action: 'apply_job',
      xpEarned: 25
    });

    expect(airtable.createRecord).toHaveBeenCalled();
    const [tableName, data] = airtable.createRecord.mock.calls[0];
    expect(data['User ID']).toBe('driver_001');
    expect(data['User Type']).toBe('driver');
    expect(data['Event Type']).toBe('xp_earned');
    expect(data['XP Earned']).toBe(25);
  });

  test('should not throw on error (fire and forget)', async () => {
    airtable.createRecord.mockRejectedValue(new Error('Network error'));

    // Should not throw
    await expect(
      logGamificationEvent('driver_001', 'driver', { eventType: 'test' })
    ).resolves.not.toThrow();
  });

  test('should serialize metadata to JSON', async () => {
    airtable.createRecord.mockResolvedValue({ id: 'event_001' });

    await logGamificationEvent('driver_001', 'driver', {
      eventType: 'level_up',
      action: 'level_up',
      metadata: { newLevel: 5, previousLevel: 4 }
    });

    const [, data] = airtable.createRecord.mock.calls[0];
    expect(typeof data['Metadata JSON']).toBe('string');
    const parsed = JSON.parse(data['Metadata JSON']);
    expect(parsed.newLevel).toBe(5);
  });
});

// =============================================================================
// INTEGRATION-STYLE TESTS (Still with mocks)
// =============================================================================

describe('Full XP Award Flow', () => {
  test('complete flow: new driver, earn XP, level up', async () => {
    // Step 1: New driver initialization
    airtable.queryRecords.mockResolvedValueOnce({ records: [] }); // No existing progression
    airtable.createRecord.mockResolvedValueOnce({
      id: 'new_driver_rec',
      'Driver ID': 'new_driver',
      'Current XP': 0,
      'Level': 1,
      'Level Title': 'Rookie Driver',
      'Streak Days': 0
    });

    const init = await initializeProgression('new_driver', 'driver');
    expect(init.level).toBe(1);
    expect(init.currentXP).toBe(0);

    // Step 2: Award profile completion XP (50 XP one-time)
    airtable.queryRecords.mockImplementation((tableName) => {
      if (tableName.includes('Seasonal')) return { records: [] };
      if (tableName.includes('Driver Progression')) {
        return {
          records: [{
            id: 'new_driver_rec',
            'Driver ID': 'new_driver',
            'Current XP': 0,
            'Level': 1,
            'Streak Days': 0
          }]
        };
      }
      if (tableName.includes('Gamification Events')) return { records: [] };
      return { records: [] };
    });
    airtable.updateRecord.mockResolvedValue({});
    airtable.createRecord.mockResolvedValue({ id: 'event' });

    const xpResult = await awardDriverXP('new_driver', 'profile_complete_basic');
    expect(xpResult.success).toBe(true);
    expect(xpResult.xp_earned).toBe(50);
    expect(xpResult.total_xp).toBe(50);
  });
});
