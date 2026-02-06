/**
 * Achievement Checkers Configuration
 *
 * Maps achievement IDs to their specific checking logic.
 * Each checker defines how to calculate progress for an achievement.
 *
 * Integrated with the unified dataAccess layer for dual-source support.
 */

import * as dataAccess from 'backend/dataAccess';

// =============================================================================
// DRIVER ACHIEVEMENT CHECKERS
// =============================================================================

export const DRIVER_ACHIEVEMENT_CHECKERS = {
  // =========================================================================
  // PROFILE ACHIEVEMENTS
  // =========================================================================

  profile_pioneer: {
    name: 'Profile Pioneer',
    check: async (driverId, context) => {
      const completion = context.profileCompletion || await getProfileCompletion(driverId);
      return { current: completion, target: 100 };
    }
  },

  profile_all_star: {
    name: 'Profile All-Star',
    check: async (driverId, context) => {
      const completion = context.profileCompletion || await getProfileCompletion(driverId);
      return { current: completion, target: 80 };
    }
  },

  verified_pro: {
    name: 'Verified Pro',
    check: async (driverId, context) => {
      const verified = context.cdlVerified || await getCDLVerificationStatus(driverId);
      return { current: verified ? 1 : 0, target: 1 };
    }
  },

  picture_perfect: {
    name: 'Picture Perfect',
    check: async (driverId, context) => {
      const hasPhoto = context.hasPhoto || await hasProfilePhoto(driverId);
      return { current: hasPhoto ? 1 : 0, target: 1 };
    }
  },

  storyteller: {
    name: 'Storyteller',
    check: async (driverId, context) => {
      const bioLength = context.bioLength || await getBioLength(driverId);
      return { current: Math.min(bioLength, 200), target: 200 };
    }
  },

  // =========================================================================
  // STREAK ACHIEVEMENTS
  // =========================================================================

  hot_streak: {
    name: 'Hot Streak',
    check: async (driverId, context) => {
      const streakDays = context.streakDays || await getStreakDays(driverId);
      return { current: Math.min(streakDays, 7), target: 7 };
    }
  },

  flame_keeper: {
    name: 'Flame Keeper',
    check: async (driverId, context) => {
      const streakDays = context.streakDays || await getStreakDays(driverId);
      return { current: Math.min(streakDays, 30), target: 30 };
    }
  },

  eternal_flame: {
    name: 'Eternal Flame',
    check: async (driverId, context) => {
      const streakDays = context.streakDays || await getStreakDays(driverId);
      return { current: Math.min(streakDays, 90), target: 90 };
    }
  },

  // =========================================================================
  // APPLICATION ACHIEVEMENTS
  // =========================================================================

  first_mile: {
    name: 'First Mile',
    check: async (driverId, context) => {
      const count = context.totalApplications || await getApplicationCount(driverId);
      return { current: Math.min(count, 1), target: 1 };
    }
  },

  job_hunter: {
    name: 'Job Hunter',
    check: async (driverId, context) => {
      const count = context.totalApplications || await getApplicationCount(driverId);
      return { current: Math.min(count, 10), target: 10 };
    }
  },

  dedicated_applicant: {
    name: 'Dedicated Applicant',
    check: async (driverId, context) => {
      const count = context.totalApplications || await getApplicationCount(driverId);
      return { current: Math.min(count, 25), target: 25 };
    }
  },

  // =========================================================================
  // RESPONSE ACHIEVEMENTS
  // =========================================================================

  quick_draw: {
    name: 'Quick Draw',
    check: async (driverId, context) => {
      const fastResponses = await getFastResponseCount(driverId); // Under 1 hour
      return { current: Math.min(fastResponses, 1), target: 1 };
    }
  },

  speed_demon: {
    name: 'Speed Demon',
    check: async (driverId, context) => {
      const fastResponses = await getFastResponseCount(driverId);
      return { current: Math.min(fastResponses, 10), target: 10 };
    }
  },

  communicator: {
    name: 'Communicator',
    check: async (driverId, context) => {
      const messageCount = await getMessageCount(driverId);
      return { current: Math.min(messageCount, 50), target: 50 };
    }
  },

  // =========================================================================
  // MILESTONE ACHIEVEMENTS
  // =========================================================================

  connected: {
    name: 'Connected',
    check: async (driverId, context) => {
      const hasContact = await hasRecruiterContact(driverId);
      return { current: hasContact ? 1 : 0, target: 1 };
    }
  },

  hired: {
    name: 'Mission Accomplished',
    check: async (driverId, context) => {
      const hireCount = await getHireCount(driverId);
      return { current: Math.min(hireCount, 1), target: 1 };
    }
  },

  rising_star: {
    name: 'Rising Star',
    check: async (driverId, context) => {
      const level = context.level || await getDriverLevel(driverId);
      return { current: Math.min(level, 5), target: 5 };
    }
  },

  road_legend: {
    name: 'Road Legend',
    check: async (driverId, context) => {
      const level = context.level || await getDriverLevel(driverId);
      return { current: Math.min(level, 10), target: 10 };
    }
  },

  // =========================================================================
  // COMMUNITY ACHIEVEMENTS
  // =========================================================================

  recruiter_friend: {
    name: 'Recruiter',
    check: async (driverId, context) => {
      const referralCount = await getReferralCount(driverId);
      return { current: Math.min(referralCount, 1), target: 1 };
    }
  },

  talent_scout: {
    name: 'Talent Scout',
    check: async (driverId, context) => {
      const referralCount = await getReferralCount(driverId);
      return { current: Math.min(referralCount, 5), target: 5 };
    }
  },

  reviewer: {
    name: 'Voice of Experience',
    check: async (driverId, context) => {
      const reviewCount = await getReviewCount(driverId);
      return { current: Math.min(reviewCount, 3), target: 3 };
    }
  },

  trusted_voice: {
    name: 'Trusted Voice',
    check: async (driverId, context) => {
      const helpfulVotes = await getHelpfulVoteCount(driverId);
      return { current: Math.min(helpfulVotes, 10), target: 10 };
    }
  }
};

// =============================================================================
// RECRUITER ACHIEVEMENT CHECKERS
// =============================================================================

export const RECRUITER_ACHIEVEMENT_CHECKERS = {
  first_hire: {
    name: 'First Hire',
    check: async (recruiterId, context) => {
      const hires = context.totalHires || await getRecruiterHireCount(recruiterId);
      return { current: Math.min(hires, 1), target: 1 };
    }
  },

  ten_club: {
    name: 'Ten Club',
    check: async (recruiterId, context) => {
      const hires = context.totalHires || await getRecruiterHireCount(recruiterId);
      return { current: Math.min(hires, 10), target: 10 };
    }
  },

  fifty_club: {
    name: 'Fifty Club',
    check: async (recruiterId, context) => {
      const hires = context.totalHires || await getRecruiterHireCount(recruiterId);
      return { current: Math.min(hires, 50), target: 50 };
    }
  },

  century_club: {
    name: 'Century Club',
    check: async (recruiterId, context) => {
      const hires = context.totalHires || await getRecruiterHireCount(recruiterId);
      return { current: Math.min(hires, 100), target: 100 };
    }
  },

  retention_master: {
    name: 'Retention Master',
    check: async (recruiterId, context) => {
      const retentionCount = await get90DayRetentionCount(recruiterId);
      return { current: Math.min(retentionCount, 10), target: 10 };
    }
  },

  lightning_recruiter: {
    name: 'Lightning Recruiter',
    check: async (recruiterId, context) => {
      const fastDays = await getFastResponseDays(recruiterId);
      return { current: Math.min(fastDays, 7), target: 7 };
    }
  },

  conversation_starter: {
    name: 'Conversation Starter',
    check: async (recruiterId, context) => {
      const messageCount = await getRecruiterMessageCount(recruiterId);
      return { current: Math.min(messageCount, 100), target: 100 };
    }
  },

  perfect_match: {
    name: 'Perfect Match',
    check: async (recruiterId, context) => {
      const highMatchCount = await getHighMatchApplicationCount(recruiterId);
      return { current: Math.min(highMatchCount, 5), target: 5 };
    }
  },

  talent_magnet: {
    name: 'Talent Magnet',
    check: async (recruiterId, context) => {
      const applicationCount = await getRecruiterApplicationCount(recruiterId);
      return { current: Math.min(applicationCount, 50), target: 50 };
    }
  },

  profile_perfectionist: {
    name: 'Profile Perfectionist',
    check: async (recruiterId, context) => {
      const completion = await getCarrierProfileCompletion(recruiterId);
      return { current: completion, target: 100 };
    }
  },

  top_rated: {
    name: 'Top Rated',
    check: async (recruiterId, context) => {
      const highRatingMonths = await getHighRatingMonths(recruiterId);
      return { current: Math.min(highRatingMonths, 3), target: 3 };
    }
  },

  hiring_sprint_winner: {
    name: 'Sprint Champion',
    check: async (recruiterId, context) => {
      const sprintsWon = await getSprintsWon(recruiterId);
      return { current: Math.min(sprintsWon, 1), target: 1 };
    }
  },

  diversity_champion: {
    name: 'Diversity Champion',
    check: async (recruiterId, context) => {
      const uniqueStates = await getUniqueHireStates(recruiterId);
      return { current: Math.min(uniqueStates, 5), target: 5 };
    }
  },

  engagement_expert: {
    name: 'Engagement Expert',
    check: async (recruiterId, context) => {
      const highEngagementMonths = await getHighEngagementMonths(recruiterId);
      return { current: Math.min(highEngagementMonths, 1), target: 1 };
    }
  },

  platform_pioneer: {
    name: 'Platform Pioneer',
    check: async (recruiterId, context) => {
      const isEarlyAdopter = await isEarlyAdopterRecruiter(recruiterId);
      return { current: isEarlyAdopter ? 1 : 0, target: 1 };
    }
  }
};

// =============================================================================
// DATA FETCHING HELPERS (Driver)
// =============================================================================

async function getProfileCompletion(driverId) {
  try {
    const record = await dataAccess.getRecord('driverProfiles', driverId, { suppressAuth: true });
    return record?.profile_completeness_score || record?.profile_completion || 0;
  } catch { return 0; }
}

async function getCDLVerificationStatus(driverId) {
  try {
    const record = await dataAccess.getRecord('driverProfiles', driverId, { suppressAuth: true });
    return record?.cdl_verified === 'Yes' || record?.cdl_verified === true;
  } catch { return false; }
}

async function hasProfilePhoto(driverId) {
  try {
    const record = await dataAccess.getRecord('driverProfiles', driverId, { suppressAuth: true });
    return !!(record?.photo_url || record?.profile_image);
  } catch { return false; }
}

async function getBioLength(driverId) {
  try {
    const record = await dataAccess.getRecord('driverProfiles', driverId, { suppressAuth: true });
    return (record?.bio || '').length;
  } catch { return 0; }
}

async function getStreakDays(driverId) {
  try {
    const res = await dataAccess.queryRecords('driverProgression', {
      filters: { driver_id: driverId },
      limit: 1,
      suppressAuth: true
    });
    return res.items?.[0]?.streak_days || 0;
  } catch { return 0; }
}

async function getApplicationCount(driverId) {
  try {
    const res = await dataAccess.queryRecords('driverCarrierInterests', {
      filters: { driver_id: driverId },
      suppressAuth: true
    });
    return res.totalCount || res.items?.length || 0;
  } catch { return 0; }
}

async function getFastResponseCount(driverId) {
  try {
    const res = await dataAccess.queryRecords('gamificationEvents', {
      filters: { user_id: driverId, action: 'respond_fast' },
      suppressAuth: true
    });
    return res.totalCount || res.items?.length || 0;
  } catch { return 0; }
}

async function getMessageCount(driverId) {
  try {
    const res = await dataAccess.queryRecords('messages', {
      filters: { sender_id: driverId },
      suppressAuth: true
    });
    return res.totalCount || res.items?.length || 0;
  } catch { return 0; }
}

async function hasRecruiterContact(driverId) {
  try {
    const res = await dataAccess.queryRecords('messages', {
      filters: { 
        sender_id: driverId,
        recipient_id: { ne: driverId } // Simplified: just check if they sent a message
      },
      limit: 1,
      suppressAuth: true
    });
    if (res.items?.length > 0) return true;

    const res2 = await dataAccess.queryRecords('messages', {
      filters: { recipient_id: driverId },
      limit: 1,
      suppressAuth: true
    });
    return (res2.items?.length || 0) > 0;
  } catch { return false; }
}

async function getHireCount(driverId) {
  try {
    const res = await dataAccess.queryRecords('driverCarrierInterests', {
      filters: { driver_id: driverId, status: 'hired' },
      suppressAuth: true
    });
    return res.totalCount || res.items?.length || 0;
  } catch { return 0; }
}

async function getDriverLevel(driverId) {
  try {
    const res = await dataAccess.queryRecords('driverProgression', {
      filters: { driver_id: driverId },
      limit: 1,
      suppressAuth: true
    });
    return res.items?.[0]?.level || 1;
  } catch { return 1; }
}

async function getReferralCount(driverId) {
  try {
    const res = await dataAccess.queryRecords('gamificationEvents', {
      filters: { user_id: driverId, action: 'refer_driver' },
      suppressAuth: true
    });
    return res.totalCount || res.items?.length || 0;
  } catch { return 0; }
}

async function getReviewCount(driverId) {
  try {
    const res = await dataAccess.queryRecords('carrierReviews', {
      filters: { driver_id: driverId },
      suppressAuth: true
    });
    return res.totalCount || res.items?.length || 0;
  } catch { return 0; }
}

async function getHelpfulVoteCount(driverId) {
  try {
    const res = await dataAccess.queryRecords('gamificationEvents', {
      filters: { user_id: driverId, action: 'review_helpful' },
      suppressAuth: true
    });
    return res.totalCount || res.items?.length || 0;
  } catch { return 0; }
}

// =============================================================================
// DATA FETCHING HELPERS (Recruiter)
// =============================================================================

async function getRecruiterHireCount(recruiterId) {
  try {
    const res = await dataAccess.queryRecords('recruiterProgression', {
      filters: { recruiter_id: recruiterId },
      limit: 1,
      suppressAuth: true
    });
    return res.items?.[0]?.total_hires || 0;
  } catch { return 0; }
}

async function get90DayRetentionCount(recruiterId) {
  try {
    const res = await dataAccess.queryRecords('gamificationEvents', {
      filters: { user_id: recruiterId, action: 'retention_90_day' },
      suppressAuth: true
    });
    return res.totalCount || res.items?.length || 0;
  } catch { return 0; }
}

async function getFastResponseDays(recruiterId) {
  try {
    const res = await dataAccess.queryRecords('gamificationEvents', {
      filters: { user_id: recruiterId, action: 'respond_fast' },
      suppressAuth: true
    });
    return Math.min(res.totalCount || res.items?.length || 0, 7);
  } catch { return 0; }
}

async function getRecruiterMessageCount(recruiterId) {
  try {
    const res = await dataAccess.queryRecords('messages', {
      filters: { sender_id: recruiterId },
      suppressAuth: true
    });
    return res.totalCount || res.items?.length || 0;
  } catch { return 0; }
}

async function getHighMatchApplicationCount(recruiterId) {
  try {
    const res = await dataAccess.queryRecords('gamificationEvents', {
      filters: { user_id: recruiterId, action: 'high_match_application' },
      suppressAuth: true
    });
    return res.totalCount || res.items?.length || 0;
  } catch { return 0; }
}

async function getRecruiterApplicationCount(recruiterId) {
  try {
    const res = await dataAccess.queryRecords('driverCarrierInterests', {
      filters: { recruiter_id: recruiterId },
      suppressAuth: true
    });
    return res.totalCount || res.items?.length || 0;
  } catch { return 0; }
}

async function getCarrierProfileCompletion(recruiterId) {
  try {
    const res = await dataAccess.queryRecords('recruiterCarriers', {
      filters: { recruiter_id: recruiterId },
      limit: 1,
      suppressAuth: true
    });
    return res.items?.length > 0 ? 100 : 0;
  } catch { return 0; }
}

async function getHighRatingMonths(recruiterId) {
  try {
    const res = await dataAccess.queryRecords('gamificationEvents', {
      filters: { user_id: recruiterId, action: 'maintain_high_rating' },
      suppressAuth: true
    });
    return res.totalCount || res.items?.length || 0;
  } catch { return 0; }
}

async function getSprintsWon(recruiterId) {
  try {
    const res = await dataAccess.queryRecords('gamificationEvents', {
      filters: { user_id: recruiterId, action: 'sprint_won' },
      suppressAuth: true
    });
    return res.totalCount || res.items?.length || 0;
  } catch { return 0; }
}

async function getUniqueHireStates(recruiterId) {
  try {
    const res = await dataAccess.queryRecords('gamificationEvents', {
      filters: { user_id: recruiterId, action: 'successful_hire' },
      suppressAuth: true
    });
    return Math.min(Math.floor((res.totalCount || res.items?.length || 0) / 2), 5);
  } catch { return 0; }
}

async function getHighEngagementMonths(recruiterId) {
  try {
    const res = await dataAccess.queryRecords('gamificationEvents', {
      filters: { user_id: recruiterId, action: 'high_engagement_month' },
      suppressAuth: true
    });
    return res.totalCount || res.items?.length || 0;
  } catch { return 0; }
}

async function isEarlyAdopterRecruiter(recruiterId) {
  try {
    const res = await dataAccess.queryRecords('recruiterProgression', {
      sort: [{ field: '_createdDate', direction: 'asc' }],
      limit: 100,
      suppressAuth: true
    });
    const earlyIds = new Set((res.items || []).map(r => r.recruiter_id));
    return earlyIds.has(recruiterId);
  } catch { return false; }
}

// =============================================================================
// MAIN CHECKER FUNCTION
// =============================================================================

/**
 * Run a specific achievement checker
 * @param {string} achievementId
 * @param {string} userId
 * @param {string} userType
 * @param {object} context
 * @returns {object} { current, target, qualifies }
 */
export async function runAchievementChecker(achievementId, userId, userType, context = {}) {
  const checkers = userType === 'driver' ? DRIVER_ACHIEVEMENT_CHECKERS : RECRUITER_ACHIEVEMENT_CHECKERS;
  const checker = checkers[achievementId];

  if (!checker) {
    return { current: 0, target: 0, qualifies: false, error: 'no_checker' };
  }

  try {
    const result = await checker.check(userId, context);
    return {
      ...result,
      qualifies: result.current >= result.target
    };
  } catch (error) {
    console.error(`[achievementCheckers] runAchievementChecker error for ${achievementId}:`, error.message);
    return { current: 0, target: 0, qualifies: false, error: error.message };
  }
}