/**
 * Achievement Checkers Configuration
 *
 * Maps achievement IDs to their specific checking logic.
 * Each checker defines how to calculate progress for an achievement.
 */

import { getAirtableTableName } from 'backend/configData';
import * as airtable from 'backend/airtableClient';

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
      const fastResponses = await getFastResponseCount(driverId, 1); // Under 1 hour
      return { current: Math.min(fastResponses, 1), target: 1 };
    }
  },

  speed_demon: {
    name: 'Speed Demon',
    check: async (driverId, context) => {
      const fastResponses = await getFastResponseCount(driverId, 1);
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
    const tableName = getAirtableTableName('driverProfiles');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `{_id} = "${driverId}"`,
      maxRecords: 1
    });
    return records.records?.[0]?.['Profile Completion'] || 0;
  } catch { return 0; }
}

async function getCDLVerificationStatus(driverId) {
  try {
    const tableName = getAirtableTableName('driverProfiles');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `{_id} = "${driverId}"`,
      maxRecords: 1
    });
    return records.records?.[0]?.['CDL Verified'] === 'Yes';
  } catch { return false; }
}

async function hasProfilePhoto(driverId) {
  try {
    const tableName = getAirtableTableName('driverProfiles');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `{_id} = "${driverId}"`,
      maxRecords: 1
    });
    return !!(records.records?.[0]?.['Photo URL']);
  } catch { return false; }
}

async function getBioLength(driverId) {
  try {
    const tableName = getAirtableTableName('driverProfiles');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `{_id} = "${driverId}"`,
      maxRecords: 1
    });
    return (records.records?.[0]?.['Bio'] || '').length;
  } catch { return 0; }
}

async function getStreakDays(driverId) {
  try {
    const tableName = getAirtableTableName('driverProgression');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `{Driver ID} = "${driverId}"`,
      maxRecords: 1
    });
    return records.records?.[0]?.['Streak Days'] || 0;
  } catch { return 0; }
}

async function getApplicationCount(driverId) {
  try {
    const tableName = getAirtableTableName('driverCarrierInterests');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `{Driver ID} = "${driverId}"`,
      maxRecords: 1000
    });
    return records.records?.length || 0;
  } catch { return 0; }
}

async function getFastResponseCount(driverId, maxHours) {
  try {
    const tableName = getAirtableTableName('gamificationEvents');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `AND({User ID} = "${driverId}", {Action} = "respond_fast")`,
      maxRecords: 1000
    });
    return records.records?.length || 0;
  } catch { return 0; }
}

async function getMessageCount(driverId) {
  try {
    const tableName = getAirtableTableName('messages');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `{Sender ID} = "${driverId}"`,
      maxRecords: 1000
    });
    return records.records?.length || 0;
  } catch { return 0; }
}

async function hasRecruiterContact(driverId) {
  try {
    const tableName = getAirtableTableName('messages');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `OR({Sender ID} = "${driverId}", {Recipient ID} = "${driverId}")`,
      maxRecords: 1
    });
    return (records.records?.length || 0) > 0;
  } catch { return false; }
}

async function getHireCount(driverId) {
  try {
    const tableName = getAirtableTableName('driverCarrierInterests');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `AND({Driver ID} = "${driverId}", {Status} = "hired")`,
      maxRecords: 100
    });
    return records.records?.length || 0;
  } catch { return 0; }
}

async function getDriverLevel(driverId) {
  try {
    const tableName = getAirtableTableName('driverProgression');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `{Driver ID} = "${driverId}"`,
      maxRecords: 1
    });
    return records.records?.[0]?.['Level'] || 1;
  } catch { return 1; }
}

async function getReferralCount(driverId) {
  try {
    const tableName = getAirtableTableName('gamificationEvents');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `AND({User ID} = "${driverId}", {Action} = "refer_driver")`,
      maxRecords: 100
    });
    return records.records?.length || 0;
  } catch { return 0; }
}

async function getReviewCount(driverId) {
  try {
    const tableName = getAirtableTableName('carrierReviews');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `{Driver ID} = "${driverId}"`,
      maxRecords: 100
    });
    return records.records?.length || 0;
  } catch { return 0; }
}

async function getHelpfulVoteCount(driverId) {
  try {
    const tableName = getAirtableTableName('gamificationEvents');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `AND({User ID} = "${driverId}", {Action} = "review_helpful")`,
      maxRecords: 100
    });
    return records.records?.length || 0;
  } catch { return 0; }
}

// =============================================================================
// DATA FETCHING HELPERS (Recruiter)
// =============================================================================

async function getRecruiterHireCount(recruiterId) {
  try {
    const tableName = getAirtableTableName('recruiterProgression');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `{Recruiter ID} = "${recruiterId}"`,
      maxRecords: 1
    });
    return records.records?.[0]?.['Total Hires'] || 0;
  } catch { return 0; }
}

async function get90DayRetentionCount(recruiterId) {
  try {
    const tableName = getAirtableTableName('gamificationEvents');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `AND({User ID} = "${recruiterId}", {Action} = "retention_90_day")`,
      maxRecords: 1000
    });
    return records.records?.length || 0;
  } catch { return 0; }
}

async function getFastResponseDays(recruiterId) {
  // Count consecutive days with fast responses
  try {
    const tableName = getAirtableTableName('gamificationEvents');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `AND({User ID} = "${recruiterId}", {Action} = "respond_fast")`,
      maxRecords: 100
    });
    // Simplified: count total fast response events
    return Math.min(records.records?.length || 0, 7);
  } catch { return 0; }
}

async function getRecruiterMessageCount(recruiterId) {
  try {
    const tableName = getAirtableTableName('messages');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `{Sender ID} = "${recruiterId}"`,
      maxRecords: 1000
    });
    return records.records?.length || 0;
  } catch { return 0; }
}

async function getHighMatchApplicationCount(recruiterId) {
  try {
    const tableName = getAirtableTableName('gamificationEvents');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `AND({User ID} = "${recruiterId}", {Action} = "high_match_application")`,
      maxRecords: 100
    });
    return records.records?.length || 0;
  } catch { return 0; }
}

async function getRecruiterApplicationCount(recruiterId) {
  try {
    const tableName = getAirtableTableName('driverCarrierInterests');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `{Recruiter ID} = "${recruiterId}"`,
      maxRecords: 1000
    });
    return records.records?.length || 0;
  } catch { return 0; }
}

async function getCarrierProfileCompletion(recruiterId) {
  // Simplified: check if carrier profile exists
  try {
    const tableName = getAirtableTableName('carriers');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `{Recruiter ID} = "${recruiterId}"`,
      maxRecords: 1
    });
    return records.records?.length > 0 ? 100 : 0;
  } catch { return 0; }
}

async function getHighRatingMonths(recruiterId) {
  // Simplified: count monthly high rating events
  try {
    const tableName = getAirtableTableName('gamificationEvents');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `AND({User ID} = "${recruiterId}", {Action} = "maintain_high_rating")`,
      maxRecords: 12
    });
    return records.records?.length || 0;
  } catch { return 0; }
}

async function getSprintsWon(recruiterId) {
  try {
    const tableName = getAirtableTableName('gamificationEvents');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `AND({User ID} = "${recruiterId}", {Action} = "sprint_won")`,
      maxRecords: 10
    });
    return records.records?.length || 0;
  } catch { return 0; }
}

async function getUniqueHireStates(recruiterId) {
  // Simplified: count unique states from hires
  try {
    const tableName = getAirtableTableName('gamificationEvents');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `AND({User ID} = "${recruiterId}", {Action} = "successful_hire")`,
      maxRecords: 100
    });
    // Would need to parse metadata for states - simplified to count/5
    return Math.min(Math.floor((records.records?.length || 0) / 2), 5);
  } catch { return 0; }
}

async function getHighEngagementMonths(recruiterId) {
  try {
    const tableName = getAirtableTableName('gamificationEvents');
    const records = await airtable.queryRecords(tableName, {
      filterByFormula: `AND({User ID} = "${recruiterId}", {Action} = "high_engagement_month")`,
      maxRecords: 12
    });
    return records.records?.length || 0;
  } catch { return 0; }
}

async function isEarlyAdopterRecruiter(recruiterId) {
  // Check if recruiter was among first 100
  try {
    const tableName = getAirtableTableName('recruiterProgression');
    const records = await airtable.queryRecords(tableName, {
      sort: [{ field: 'Created At', direction: 'asc' }],
      maxRecords: 100
    });
    const earlyIds = new Set((records.records || []).map(r => r['Recruiter ID']));
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
    console.error(`runAchievementChecker error for ${achievementId}:`, error);
    return { current: 0, target: 0, qualifies: false, error: error.message };
  }
}
