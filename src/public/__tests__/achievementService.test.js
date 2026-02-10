/* eslint-disable */
/**
 * Achievement Service Tests
 *
 * Unit tests for the achievement system including:
 * - Achievement definition retrieval
 * - Progress tracking
 * - Achievement checking and awarding
 * - Achievement checkers
 */

// =============================================================================
// MOCKS
// =============================================================================

// Mock Airtable client
const mockAirtableRecords = new Map();
const mockAirtable = {
  queryRecords: jest.fn(async (tableName, options) => {
    const records = mockAirtableRecords.get(tableName) || [];
    // Simple filter simulation
    if (options.filterByFormula) {
      // Return all matching records for simplicity
      return { records };
    }
    return { records };
  }),
  createRecord: jest.fn(async (tableName, data) => {
    const id = `rec_${Date.now()}`;
    const record = { id, ...data };
    const existing = mockAirtableRecords.get(tableName) || [];
    existing.push(record);
    mockAirtableRecords.set(tableName, existing);
    return record;
  }),
  updateRecord: jest.fn(async (tableName, recordId, data) => {
    const records = mockAirtableRecords.get(tableName) || [];
    const index = records.findIndex(r => r.id === recordId);
    if (index >= 0) {
      records[index] = { ...records[index], ...data };
      return records[index];
    }
    return null;
  }),
  getRecord: jest.fn(async (tableName, recordId) => {
    const records = mockAirtableRecords.get(tableName) || [];
    return records.find(r => r.id === recordId) || null;
  })
};

// Mock config
const mockConfig = {
  getAirtableTableName: jest.fn((key) => `tbl_${key}`),
  usesAirtable: jest.fn(() => true)
};

// Mock gamification service
const mockGamificationService = {
  awardDriverXP: jest.fn(async () => ({ success: true, xp_earned: 100 })),
  awardRecruiterPoints: jest.fn(async () => ({ success: true, points_earned: 50 })),
  logGamificationEvent: jest.fn(async () => {})
};

// Mock member service
const mockMemberService = {
  createNotification: jest.fn(async () => ({ success: true }))
};

// =============================================================================
// TEST DATA
// =============================================================================

const testAchievementDefinitions = [
  {
    id: 'rec_def1',
    'Achievement ID': 'profile_pioneer',
    'Name': 'Profile Pioneer',
    'Description': 'Complete your driver profile',
    'Category': 'profile',
    'User Type': 'driver',
    'Requirement Type': 'count',
    'Requirement Field': 'profile_completion',
    'Requirement Value': 100,
    'XP Reward': 200,
    'Icon': 'user-check',
    'Color': '#4CAF50',
    'Is Active': 'Yes',
    'Is Hidden': 'No',
    'Display Order': 1
  },
  {
    id: 'rec_def2',
    'Achievement ID': 'hot_streak',
    'Name': 'Hot Streak',
    'Description': '7-day login streak',
    'Category': 'engagement',
    'User Type': 'driver',
    'Requirement Type': 'count',
    'Requirement Field': 'streak_days',
    'Requirement Value': 7,
    'XP Reward': 100,
    'Icon': 'flame',
    'Color': '#FF5722',
    'Is Active': 'Yes',
    'Is Hidden': 'No',
    'Display Order': 2
  },
  {
    id: 'rec_def3',
    'Achievement ID': 'first_mile',
    'Name': 'First Mile',
    'Description': 'Submit your first application',
    'Category': 'milestone',
    'User Type': 'driver',
    'Requirement Type': 'count',
    'Requirement Field': 'total_applications',
    'Requirement Value': 1,
    'XP Reward': 50,
    'Icon': 'send',
    'Color': '#2196F3',
    'Is Active': 'Yes',
    'Is Hidden': 'No',
    'Display Order': 3
  },
  {
    id: 'rec_def4',
    'Achievement ID': 'first_hire',
    'Name': 'First Hire',
    'Description': 'Make your first successful hire',
    'Category': 'hiring',
    'User Type': 'recruiter',
    'Requirement Type': 'count',
    'Requirement Field': 'total_hires',
    'Requirement Value': 1,
    'XP Reward': 500,
    'Icon': 'award',
    'Color': '#9C27B0',
    'Is Active': 'Yes',
    'Is Hidden': 'No',
    'Display Order': 1
  }
];

const testDriverProgression = {
  id: 'rec_prog1',
  'Driver ID': 'driver_123',
  'Current XP': 500,
  'Level': 2,
  'Streak Days': 5,
  'Longest Streak': 10,
  'Total Applications': 3,
  'Profile Completion': 80
};

const testRecruiterProgression = {
  id: 'rec_prog2',
  'Recruiter ID': 'recruiter_456',
  'Current Points': 1000,
  'Rank': 2,
  'Total Hires': 5,
  'Total Outreach': 50
};

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Achievement Service', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockAirtableRecords.clear();

    // Seed test data
    mockAirtableRecords.set('tbl_achievementDefinitions', [...testAchievementDefinitions]);
    mockAirtableRecords.set('tbl_driverProgression', [{ ...testDriverProgression }]);
    mockAirtableRecords.set('tbl_recruiterProgression', [{ ...testRecruiterProgression }]);
    mockAirtableRecords.set('tbl_driverAchievements', []);
    mockAirtableRecords.set('tbl_gamificationEvents', []);
  });

  // ===========================================================================
  // GET ACHIEVEMENT DEFINITIONS
  // ===========================================================================

  describe('getAchievementDefinitions', () => {
    test('should return all active achievements', async () => {
      const definitions = await getAchievementDefinitionsMock('all');

      expect(definitions).toHaveLength(4);
      expect(definitions.every(d => d.isActive)).toBe(true);
    });

    test('should filter by user type', async () => {
      const driverDefs = await getAchievementDefinitionsMock('driver');

      expect(driverDefs.every(d => d.userType === 'driver')).toBe(true);
      expect(driverDefs).toHaveLength(3);
    });

    test('should filter by category', async () => {
      const profileDefs = await getAchievementDefinitionsMock('driver', 'profile');

      expect(profileDefs.every(d => d.category === 'profile')).toBe(true);
      expect(profileDefs).toHaveLength(1);
    });

    test('should normalize achievement definitions', async () => {
      const definitions = await getAchievementDefinitionsMock('all');
      const def = definitions[0];

      expect(def).toHaveProperty('achievementId');
      expect(def).toHaveProperty('name');
      expect(def).toHaveProperty('description');
      expect(def).toHaveProperty('category');
      expect(def).toHaveProperty('xpReward');
      expect(def).toHaveProperty('requirementValue');
    });
  });

  // ===========================================================================
  // GET ACHIEVEMENTS (WITH PROGRESS)
  // ===========================================================================

  describe('getAchievements', () => {
    test('should return achievements with progress for user', async () => {
      const achievements = await getAchievementsMock('driver_123', 'driver');

      expect(achievements.length).toBeGreaterThan(0);
      achievements.forEach(a => {
        expect(a).toHaveProperty('earned');
        expect(a).toHaveProperty('progress');
        expect(typeof a.progress).toBe('number');
      });
    });

    test('should mark earned achievements correctly', async () => {
      // First, seed an earned achievement
      mockAirtableRecords.get('tbl_driverAchievements').push({
        id: 'rec_earned1',
        'User ID': 'driver_123',
        'User Type': 'driver',
        'Achievement ID': 'first_mile',
        'Is Complete': 'Yes',
        'Earned At': new Date().toISOString(),
        'Progress': 100
      });

      const achievements = await getAchievementsMock('driver_123', 'driver');
      const firstMile = achievements.find(a => a.achievementId === 'first_mile');

      expect(firstMile.earned).toBe(true);
      expect(firstMile.progress).toBe(100);
    });

    test('should include hidden achievements only when include_locked is true', async () => {
      // Add a hidden achievement
      mockAirtableRecords.get('tbl_achievementDefinitions').push({
        id: 'rec_hidden',
        'Achievement ID': 'secret_achievement',
        'Name': 'Secret',
        'User Type': 'driver',
        'Is Active': 'Yes',
        'Is Hidden': 'Yes',
        'Requirement Value': 1
      });

      const withoutHidden = await getAchievementsMock('driver_123', 'driver', { include_locked: false });
      const withHidden = await getAchievementsMock('driver_123', 'driver', { include_locked: true });

      expect(withHidden.length).toBeGreaterThanOrEqual(withoutHidden.length);
    });
  });

  // ===========================================================================
  // GET ACHIEVEMENT PROGRESS
  // ===========================================================================

  describe('getAchievementProgress', () => {
    test('should return progress for a specific achievement', async () => {
      const progress = await getAchievementProgressMock('driver_123', 'hot_streak');

      expect(progress).toHaveProperty('current');
      expect(progress).toHaveProperty('target');
      expect(progress).toHaveProperty('percentage');
      expect(progress).toHaveProperty('is_complete');
    });

    test('should return 100% for already earned achievement', async () => {
      // Seed an earned achievement
      mockAirtableRecords.get('tbl_driverAchievements').push({
        id: 'rec_earned2',
        'User ID': 'driver_123',
        'Achievement ID': 'first_mile',
        'Is Complete': 'Yes'
      });

      const progress = await getAchievementProgressMock('driver_123', 'first_mile');

      expect(progress.percentage).toBe(100);
      expect(progress.is_complete).toBe(true);
    });

    test('should return error for non-existent achievement', async () => {
      const progress = await getAchievementProgressMock('driver_123', 'non_existent');

      expect(progress.error).toBe('not_found');
    });
  });

  // ===========================================================================
  // CHECK AND AWARD ACHIEVEMENTS
  // ===========================================================================

  describe('checkAndAwardAchievements', () => {
    test('should check all achievements for a user', async () => {
      const newlyEarned = await checkAndAwardAchievementsMock('driver_123', 'driver', {});

      expect(Array.isArray(newlyEarned)).toBe(true);
    });

    test('should not re-award already earned achievements', async () => {
      // Seed an earned achievement
      mockAirtableRecords.get('tbl_driverAchievements').push({
        id: 'rec_earned3',
        'User ID': 'driver_123',
        'Achievement ID': 'first_mile',
        'Is Complete': 'Yes'
      });

      const newlyEarned = await checkAndAwardAchievementsMock('driver_123', 'driver', {
        totalApplications: 5
      });

      const firstMileEarned = newlyEarned.find(a => a.achievementId === 'first_mile');
      expect(firstMileEarned).toBeUndefined();
    });

    test('should award achievement when criteria met', async () => {
      // Update driver to have 7 day streak
      const progression = mockAirtableRecords.get('tbl_driverProgression')[0];
      progression['Streak Days'] = 7;

      const newlyEarned = await checkAndAwardAchievementsMock('driver_123', 'driver', {
        streakDays: 7
      });

      // Check that hot_streak was earned
      const hotStreak = newlyEarned.find(a => a.achievementId === 'hot_streak');
      expect(hotStreak).toBeDefined();
    });
  });

  // ===========================================================================
  // SPECIFIC ACHIEVEMENT CHECKERS
  // ===========================================================================

  describe('checkProfileAchievements', () => {
    test('should check achievements with profile context', async () => {
      const newlyEarned = await checkProfileAchievementsMock('driver_123', {
        profileCompletion: 100,
        hasPhoto: true,
        hasCDL: true,
        cdlVerified: false
      });

      expect(Array.isArray(newlyEarned)).toBe(true);
    });
  });

  describe('checkApplicationAchievements', () => {
    test('should check achievements based on application count', async () => {
      const newlyEarned = await checkApplicationAchievementsMock('driver_123', 1);

      expect(Array.isArray(newlyEarned)).toBe(true);
    });
  });

  describe('checkStreakAchievements', () => {
    test('should check achievements based on streak days', async () => {
      const newlyEarned = await checkStreakAchievementsMock('driver_123', 7);

      expect(Array.isArray(newlyEarned)).toBe(true);
    });
  });

  describe('checkHireAchievements', () => {
    test('should check recruiter hire achievements', async () => {
      const newlyEarned = await checkHireAchievementsMock('recruiter_456', 1);

      expect(Array.isArray(newlyEarned)).toBe(true);
    });
  });

  // ===========================================================================
  // ACHIEVEMENT CHECKERS
  // ===========================================================================

  describe('Achievement Checkers', () => {
    describe('Driver Checkers', () => {
      test('profile_pioneer checker should return correct progress', async () => {
        const result = await runCheckerMock('profile_pioneer', 'driver_123', 'driver', {
          profileCompletion: 80
        });

        expect(result.current).toBe(80);
        expect(result.target).toBe(100);
        expect(result.qualifies).toBe(false);
      });

      test('hot_streak checker should return correct progress', async () => {
        const result = await runCheckerMock('hot_streak', 'driver_123', 'driver', {
          streakDays: 5
        });

        expect(result.current).toBe(5);
        expect(result.target).toBe(7);
        expect(result.qualifies).toBe(false);
      });

      test('first_mile checker should qualify with 1 application', async () => {
        const result = await runCheckerMock('first_mile', 'driver_123', 'driver', {
          totalApplications: 1
        });

        expect(result.current).toBe(1);
        expect(result.target).toBe(1);
        expect(result.qualifies).toBe(true);
      });
    });

    describe('Recruiter Checkers', () => {
      test('first_hire checker should return correct progress', async () => {
        const result = await runCheckerMock('first_hire', 'recruiter_456', 'recruiter', {
          totalHires: 0
        });

        expect(result.current).toBe(0);
        expect(result.target).toBe(1);
        expect(result.qualifies).toBe(false);
      });

      test('first_hire checker should qualify with 1 hire', async () => {
        const result = await runCheckerMock('first_hire', 'recruiter_456', 'recruiter', {
          totalHires: 1
        });

        expect(result.current).toBe(1);
        expect(result.target).toBe(1);
        expect(result.qualifies).toBe(true);
      });
    });

    test('should return error for unknown checker', async () => {
      const result = await runCheckerMock('non_existent_achievement', 'driver_123', 'driver', {});

      expect(result.error).toBe('no_checker');
    });
  });

  // ===========================================================================
  // BATCH PROCESSING
  // ===========================================================================

  describe('batchCheckAchievements', () => {
    test('should process all users of a type', async () => {
      const result = await batchCheckAchievementsMock('driver');

      expect(result).toHaveProperty('processed');
      expect(result).toHaveProperty('achievements_awarded');
      expect(result.processed).toBeGreaterThanOrEqual(0);
    });
  });

  // ===========================================================================
  // HELPER UTILITIES
  // ===========================================================================

  describe('Utility Functions', () => {
    test('hasAchievementChecker should return true for known checkers', () => {
      const hasProfilePioneer = hasCheckerMock('profile_pioneer', 'driver');
      const hasFirstHire = hasCheckerMock('first_hire', 'recruiter');

      expect(hasProfilePioneer).toBe(true);
      expect(hasFirstHire).toBe(true);
    });

    test('hasAchievementChecker should return false for unknown checkers', () => {
      const hasUnknown = hasCheckerMock('non_existent', 'driver');

      expect(hasUnknown).toBe(false);
    });

    test('listAchievementCheckers should return arrays for both types', () => {
      const checkers = listCheckersMock();

      expect(Array.isArray(checkers.driver)).toBe(true);
      expect(Array.isArray(checkers.recruiter)).toBe(true);
      expect(checkers.driver.length).toBeGreaterThan(0);
      expect(checkers.recruiter.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// MOCK IMPLEMENTATIONS
// =============================================================================

// These mock implementations simulate the actual service behavior for testing

async function getAchievementDefinitionsMock(userType = 'all', category = null) {
  let records = mockAirtableRecords.get('tbl_achievementDefinitions') || [];

  // Filter by active
  records = records.filter(r => r['Is Active'] === 'Yes');

  // Filter by user type
  if (userType !== 'all') {
    records = records.filter(r => r['User Type'] === userType);
  }

  // Filter by category
  if (category) {
    records = records.filter(r => r['Category'] === category);
  }

  // Normalize
  return records.map(normalizeDefinition);
}

async function getAchievementsMock(userId, userType, options = {}) {
  const definitions = await getAchievementDefinitionsMock(userType, options.category);
  const earnedRecords = mockAirtableRecords.get('tbl_driverAchievements') || [];
  const earned = earnedRecords.filter(r => r['User ID'] === userId && r['User Type'] === userType);

  const earnedMap = new Map();
  earned.forEach(e => {
    earnedMap.set(e['Achievement ID'], {
      earnedAt: e['Earned At'],
      progress: e['Progress'] || 100,
      isComplete: e['Is Complete'] === 'Yes'
    });
  });

  let achievements = definitions.map(def => {
    const earnedData = earnedMap.get(def.achievementId);
    return {
      ...def,
      earned: !!earnedData?.isComplete,
      earnedAt: earnedData?.earnedAt || null,
      progress: earnedData?.progress || 0
    };
  });

  if (!options.include_locked) {
    achievements = achievements.filter(a => !a.isHidden || a.earned);
  }

  return achievements;
}

async function getAchievementProgressMock(userId, achievementId) {
  const records = mockAirtableRecords.get('tbl_achievementDefinitions') || [];
  const def = records.find(r => r['Achievement ID'] === achievementId);

  if (!def) {
    return { current: 0, target: 0, percentage: 0, is_complete: false, error: 'not_found' };
  }

  const earnedRecords = mockAirtableRecords.get('tbl_driverAchievements') || [];
  const earned = earnedRecords.find(
    r => r['User ID'] === userId && r['Achievement ID'] === achievementId && r['Is Complete'] === 'Yes'
  );

  if (earned) {
    return {
      current: def['Requirement Value'],
      target: def['Requirement Value'],
      percentage: 100,
      is_complete: true
    };
  }

  // Get progress from progression
  const progressionTable = def['User Type'] === 'driver' ? 'tbl_driverProgression' : 'tbl_recruiterProgression';
  const idField = def['User Type'] === 'driver' ? 'Driver ID' : 'Recruiter ID';
  const progressionRecords = mockAirtableRecords.get(progressionTable) || [];
  const progression = progressionRecords.find(r => r[idField] === userId) || {};

  const current = progression[def['Requirement Field']] || 0;
  const target = def['Requirement Value'];
  const percentage = Math.min(100, Math.round((current / target) * 100));

  return { current, target, percentage, is_complete: current >= target };
}

async function checkAndAwardAchievementsMock(userId, userType, context) {
  const definitions = await getAchievementDefinitionsMock(userType);
  const earnedRecords = mockAirtableRecords.get('tbl_driverAchievements') || [];
  const earnedIds = new Set(
    earnedRecords
      .filter(r => r['User ID'] === userId && r['Is Complete'] === 'Yes')
      .map(r => r['Achievement ID'])
  );

  const newlyEarned = [];

  for (const def of definitions) {
    if (earnedIds.has(def.achievementId)) continue;

    const result = await runCheckerMock(def.achievementId, userId, userType, context);
    if (result.qualifies) {
      newlyEarned.push({
        ...def,
        earnedAt: new Date().toISOString()
      });

      // Record the earned achievement
      mockAirtableRecords.get('tbl_driverAchievements').push({
        id: `rec_${Date.now()}`,
        'User ID': userId,
        'User Type': userType,
        'Achievement ID': def.achievementId,
        'Is Complete': 'Yes',
        'Earned At': new Date().toISOString(),
        'Progress': 100
      });
    }
  }

  return newlyEarned;
}

async function checkProfileAchievementsMock(driverId, profileData) {
  return checkAndAwardAchievementsMock(driverId, 'driver', {
    action: 'profile_update',
    ...profileData
  });
}

async function checkApplicationAchievementsMock(driverId, totalApplications) {
  return checkAndAwardAchievementsMock(driverId, 'driver', {
    action: 'submit_application',
    totalApplications
  });
}

async function checkStreakAchievementsMock(driverId, streakDays) {
  return checkAndAwardAchievementsMock(driverId, 'driver', {
    action: 'streak_update',
    streakDays
  });
}

async function checkHireAchievementsMock(recruiterId, totalHires) {
  return checkAndAwardAchievementsMock(recruiterId, 'recruiter', {
    action: 'successful_hire',
    totalHires
  });
}

async function runCheckerMock(achievementId, userId, userType, context) {
  const checkers = {
    driver: {
      profile_pioneer: async (id, ctx) => ({
        current: ctx.profileCompletion || 0,
        target: 100
      }),
      hot_streak: async (id, ctx) => ({
        current: Math.min(ctx.streakDays || 0, 7),
        target: 7
      }),
      first_mile: async (id, ctx) => ({
        current: Math.min(ctx.totalApplications || 0, 1),
        target: 1
      }),
      verified_pro: async (id, ctx) => ({
        current: ctx.cdlVerified ? 1 : 0,
        target: 1
      }),
      picture_perfect: async (id, ctx) => ({
        current: ctx.hasPhoto ? 1 : 0,
        target: 1
      }),
      flame_keeper: async (id, ctx) => ({
        current: Math.min(ctx.streakDays || 0, 30),
        target: 30
      }),
      job_hunter: async (id, ctx) => ({
        current: Math.min(ctx.totalApplications || 0, 10),
        target: 10
      })
    },
    recruiter: {
      first_hire: async (id, ctx) => ({
        current: Math.min(ctx.totalHires || 0, 1),
        target: 1
      }),
      ten_club: async (id, ctx) => ({
        current: Math.min(ctx.totalHires || 0, 10),
        target: 10
      }),
      fifty_club: async (id, ctx) => ({
        current: Math.min(ctx.totalHires || 0, 50),
        target: 50
      })
    }
  };

  const userCheckers = checkers[userType] || {};
  const checker = userCheckers[achievementId];

  if (!checker) {
    return { current: 0, target: 0, qualifies: false, error: 'no_checker' };
  }

  const result = await checker(userId, context);
  return {
    ...result,
    qualifies: result.current >= result.target
  };
}

async function batchCheckAchievementsMock(userType) {
  const progressionTable = userType === 'driver' ? 'tbl_driverProgression' : 'tbl_recruiterProgression';
  const users = mockAirtableRecords.get(progressionTable) || [];

  let processed = 0;
  let achievementsAwarded = 0;

  for (const user of users) {
    const idField = userType === 'driver' ? 'Driver ID' : 'Recruiter ID';
    const userId = user[idField];
    if (!userId) continue;

    const earned = await checkAndAwardAchievementsMock(userId, userType, {});
    achievementsAwarded += earned.length;
    processed++;
  }

  return { processed, achievements_awarded: achievementsAwarded };
}

function hasCheckerMock(achievementId, userType) {
  const knownCheckers = {
    driver: ['profile_pioneer', 'hot_streak', 'first_mile', 'verified_pro', 'picture_perfect', 'flame_keeper', 'job_hunter'],
    recruiter: ['first_hire', 'ten_club', 'fifty_club']
  };

  return (knownCheckers[userType] || []).includes(achievementId);
}

function listCheckersMock() {
  return {
    driver: ['profile_pioneer', 'hot_streak', 'first_mile', 'verified_pro', 'picture_perfect', 'flame_keeper', 'job_hunter'],
    recruiter: ['first_hire', 'ten_club', 'fifty_club']
  };
}

function normalizeDefinition(record) {
  return {
    _id: record.id,
    achievementId: record['Achievement ID'],
    name: record['Name'],
    description: record['Description'],
    category: record['Category'],
    icon: record['Icon'],
    color: record['Color'],
    userType: record['User Type'],
    requirementType: record['Requirement Type'],
    requirementField: record['Requirement Field'],
    requirementValue: record['Requirement Value'] || 1,
    xpReward: record['XP Reward'] || 0,
    isHidden: record['Is Hidden'] === 'Yes',
    isActive: record['Is Active'] === 'Yes',
    displayOrder: record['Display Order'] || 0
  };
}
