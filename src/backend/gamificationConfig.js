/**
 * Gamification System Configuration
 *
 * Static configuration for the gamification system including:
 * - Driver level definitions and XP requirements
 * - Recruiter rank definitions and point requirements
 * - XP action values for drivers
 * - Point action values for recruiters
 * - Streak multipliers
 * - Rate limits for anti-cheat
 */

// =============================================================================
// DRIVER LEVELS - "Road to Success"
// =============================================================================

export const DRIVER_LEVELS = [
  { level: 1,  title: 'Rookie Driver',    xpRequired: 0,      unlock: 'Basic profile' },
  { level: 2,  title: 'Road Ready',       xpRequired: 100,    unlock: 'Priority support queue' },
  { level: 3,  title: 'Mile Marker',      xpRequired: 300,    unlock: 'Advanced search filters' },
  { level: 4,  title: 'Highway Hero',     xpRequired: 600,    unlock: 'Early job alerts (30 min)' },
  { level: 5,  title: 'Route Master',     xpRequired: 1000,   unlock: 'Salary insights access' },
  { level: 6,  title: 'Fleet Veteran',    xpRequired: 1500,   unlock: 'Direct recruiter chat' },
  { level: 7,  title: 'Road Scholar',     xpRequired: 2500,   unlock: 'Featured profile boost' },
  { level: 8,  title: 'Trucking Pro',     xpRequired: 4000,   unlock: 'Exclusive job postings' },
  { level: 9,  title: 'Industry Expert',  xpRequired: 6000,   unlock: 'Mentorship eligibility' },
  { level: 10, title: 'Road Legend',      xpRequired: 10000,  unlock: 'VIP concierge service' }
];

// =============================================================================
// RECRUITER RANKS - "Talent Hunter"
// =============================================================================

export const RECRUITER_RANKS = [
  { rank: 1, title: 'Scout',             pointsRequired: 0,      unlock: 'Basic access' },
  { rank: 2, title: 'Recruiter',         pointsRequired: 500,    unlock: 'Bulk messaging (10/day)' },
  { rank: 3, title: 'Talent Finder',     pointsRequired: 1500,   unlock: 'Advanced search filters' },
  { rank: 4, title: 'Hiring Pro',        pointsRequired: 3500,   unlock: 'Pipeline templates' },
  { rank: 5, title: 'Staffing Expert',   pointsRequired: 7000,   unlock: 'Analytics dashboard' },
  { rank: 6, title: 'Talent Architect',  pointsRequired: 12000,  unlock: 'Priority support' },
  { rank: 7, title: 'Recruiting Master', pointsRequired: 20000,  unlock: 'Beta features early access' },
  { rank: 8, title: 'Talent Champion',   pointsRequired: 35000,  unlock: 'Custom branding, white-glove' }
];

// =============================================================================
// DRIVER XP ACTIONS
// =============================================================================

export const DRIVER_XP_ACTIONS = {
  // Profile Actions (one-time)
  profile_complete_basic: { xp: 50, oneTime: true, description: 'Complete basic info' },
  profile_upload_cdl: { xp: 25, oneTime: true, description: 'Upload CDL photo' },
  profile_verify_cdl: { xp: 100, oneTime: true, description: 'Verify CDL via OCR' },
  profile_complete_preferences: { xp: 30, oneTime: true, description: 'Complete preferences' },
  profile_add_work_history: { xp: 20, maxPerUser: 5, description: 'Add work history entry' },
  profile_upload_endorsement: { xp: 15, maxPerUser: 10, description: 'Upload endorsement' },
  profile_100_complete: { xp: 200, oneTime: true, description: '100% profile complete bonus' },

  // Engagement Actions (daily limits)
  daily_login: { xp: 5, dailyLimit: 1, description: 'Daily login' },
  streak_7_day: { xp: 50, description: '7-day streak bonus' },
  streak_30_day: { xp: 200, description: '30-day streak bonus' },
  streak_60_day: { xp: 300, description: '60-day streak bonus' },
  streak_90_day: { xp: 500, description: '90-day streak bonus' },
  view_carrier: { xp: 2, dailyLimit: 10, description: 'View carrier profile' },
  save_job: { xp: 5, dailyLimit: 5, description: 'Save a job' },
  apply_job: { xp: 25, description: 'Apply to job' },
  complete_application: { xp: 50, description: 'Complete full application' },
  respond_fast: { xp: 30, description: 'Respond to recruiter <4hrs' },
  respond_normal: { xp: 15, description: 'Respond to recruiter <24hrs' },
  attend_interview: { xp: 100, description: 'Attend interview' },
  accept_offer: { xp: 500, description: 'Accept job offer' },

  // Community Actions
  leave_review: { xp: 20, weeklyLimit: 3, description: 'Leave carrier review' },
  review_helpful: { xp: 10, description: 'Review marked helpful' },
  refer_driver: { xp: 200, description: 'Refer a driver (on signup)' },
  referral_hired: { xp: 500, description: 'Referred driver gets hired' },
  report_outdated: { xp: 10, description: 'Report outdated job (verified)' },
  complete_survey: { xp: 25, description: 'Complete survey' },
  
  // Forum Actions
  forum_thread_created: { xp: 10, dailyLimit: 3, description: 'Create forum thread' },
  forum_reply_created: { xp: 5, dailyLimit: 10, description: 'Reply to forum thread' },
  forum_post_liked: { xp: 2, dailyLimit: 20, description: 'Post received a like' },
  forum_best_answer: { xp: 50, dailyLimit: 1, description: 'Reply marked as best answer' },

  // Cross-Platform Bonuses
  match_quality_bonus: { xp: 0, description: 'Match quality bonus (variable based on score)' },
  referral_bonus: { xp: 0, description: 'Referral bonus (variable based on type)' },
  
  // Mentorship Actions
  mentorship_requested: { xp: 10, dailyLimit: 1, description: 'Request a mentor' },
  mentorship_accepted: { xp: 50, oneTime: true, description: 'Mentorship request accepted' },
  mentorship_milestone_completed: { xp: 20, maxPerUser: 50, description: 'Complete mentorship milestone' },
  mentorship_completed: { xp: 100, description: 'Complete mentorship program' },
  mentor_program_completed: { xp: 200, description: 'Successfully mentor a rookie to completion' },

  // Pet-Friendly & Health Actions
  pet_location_added: { xp: 30, description: 'Add a new pet-friendly location' },
  pet_review_left: { xp: 15, description: 'Leave a review for a pet-friendly spot' },
  health_tip_approved: { xp: 25, description: 'Community health tip approved' },

  // Phase 7 — Screening & Background Check
  bgc_consent_submitted: { xp: 25, oneTime: true, description: 'Submit BGC consent form' },
  drug_test_completed: { xp: 25, oneTime: true, description: 'Complete drug test' },
  screening_passed: { xp: 25, oneTime: true, description: 'Pass screening & background check' },

  // Phase 9 — Hire → First Dispatch
  hire_completed: { xp: 150, oneTime: true, description: 'Complete hire / onboarding workflow' },
  first_dispatch: { xp: 250, oneTime: true, description: 'Receive first dispatch assignment' },
  post_hire_survey_completed: { xp: 100, oneTime: true, description: 'Complete 30-day post-hire survey' },

  // Retention Milestones (post-hire)
  retention_30_day: { xp: 300, oneTime: true, description: 'Still employed at 30-day milestone' },
  retention_90_day: { xp: 500, oneTime: true, description: 'Still employed at 90-day milestone' },

  // Road Utility Community Actions
  rest_stop_rated: { xp: 15, weeklyLimit: 5, description: 'Rate a rest stop' },
  road_hazard_reported: { xp: 20, dailyLimit: 3, description: 'Report a road hazard' }
};

// =============================================================================
// RECRUITER POINT ACTIONS
// =============================================================================

export const RECRUITER_POINT_ACTIONS = {
  // Outreach Actions
  view_driver_profile: { points: 2, dailyLimit: 20, description: 'View driver profile' },
  send_personalized_message: { points: 10, description: 'Send personalized message' },
  send_template_message: { points: 5, description: 'Use message template' },
  schedule_interview: { points: 50, description: 'Schedule interview' },
  complete_interview: { points: 75, description: 'Complete interview' },

  // Quality Metrics
  driver_responds: { points: 15, description: 'Driver responds to message' },
  driver_applies: { points: 20, description: 'Driver applies to your job' },
  high_match_application: { points: 30, description: 'High match application (80%+)' },
  respond_fast: { points: 25, dailyLimit: 1, description: 'Respond <4hrs (daily bonus)' },
  respond_normal: { points: 10, description: 'Respond <24hrs' },

  // Success Actions
  make_offer: { points: 100, description: 'Make offer' },
  offer_accepted: { points: 300, description: 'Driver accepts offer' },
  successful_hire: { points: 500, description: 'Driver starts (successful hire)' },
  retention_90_day: { points: 1000, description: '90-day retention bonus' },
  driver_rates_high: { points: 200, description: 'Driver rates 4+ stars' },

  // Platform Actions
  complete_carrier_profile: { points: 100, oneTime: true, description: 'Complete carrier profile' },
  add_job_posting: { points: 25, description: 'Add job posting' },
  update_job_posting: { points: 10, description: 'Update job posting' },
  maintain_high_rating: { points: 100, monthlyLimit: 1, description: 'Maintain 4+ rating (monthly)' },

  // Badge & Achievement Actions
  badge_earned: { points: 50, description: 'Earn a new badge' },
  badge_tier_upgrade: { points: 100, description: 'Upgrade badge tier' },
  achievement_earned: { points: 25, description: 'Earn an achievement' },

  // Cross-Platform Bonuses
  match_quality_bonus: { points: 0, description: 'Match quality bonus (variable based on score)' }
};

// =============================================================================
// STREAK MULTIPLIERS
// =============================================================================

export const STREAK_MULTIPLIERS = {
  driver: [
    { minDays: 1,  maxDays: 6,   multiplier: 1.0 },
    { minDays: 7,  maxDays: 13,  multiplier: 1.1 },
    { minDays: 14, maxDays: 29,  multiplier: 1.15 },
    { minDays: 30, maxDays: 59,  multiplier: 1.25 },
    { minDays: 60, maxDays: 89,  multiplier: 1.35 },
    { minDays: 90, maxDays: 999, multiplier: 1.5 }
  ],
  recruiter: [
    { minDays: 1,  maxDays: 6,   multiplier: 1.0 },
    { minDays: 7,  maxDays: 13,  multiplier: 1.05 },
    { minDays: 14, maxDays: 29,  multiplier: 1.1 },
    { minDays: 30, maxDays: 59,  multiplier: 1.15 },
    { minDays: 60, maxDays: 89,  multiplier: 1.2 },
    { minDays: 90, maxDays: 999, multiplier: 1.25 }
  ]
};

// =============================================================================
// EVENT MULTIPLIERS
// =============================================================================

export const EVENT_MULTIPLIERS = {
  weekend_boost: { multiplier: 1.5, description: 'Weekend XP Boost (Sat-Sun)' },
  seasonal_event: { multiplier: 2.0, description: 'Seasonal Event' },
  hiring_sprint: { multiplier: 2.0, description: 'Hiring Sprint (recruiter only)' },
  new_user_bonus: { multiplier: 2.0, durationDays: 7, description: 'New User Bonus (first 7 days)' }
};

// =============================================================================
// RATE LIMITS (Anti-Cheat)
// =============================================================================

export const RATE_LIMITS = {
  daily_login_xp: 1,           // Once per day
  profile_view_xp: 10,         // Max 10 views/day
  carrier_view_xp: 10,         // Max 10 views/day
  job_save_xp: 5,              // Max 5 saves/day
  review_xp: 3,                // Max 3 reviews/week
  message_xp: 20,              // Max 20 messages/day for XP
  driver_profile_views: 20,    // Max 20 driver views/day for points

  // Cooldowns (in milliseconds)
  same_action_cooldown: 60000, // 1 minute between same actions
  level_up_cooldown: 5000      // 5 seconds between level checks
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get level info for a given XP amount
 * @param {number} xp - Current XP
 * @returns {{ level: number, title: string, xpToNext: number, xpInLevel: number, progress: number }}
 */
export function getLevelForXP(xp) {
  let currentLevel = DRIVER_LEVELS[0];
  let nextLevel = DRIVER_LEVELS[1];

  for (let i = DRIVER_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= DRIVER_LEVELS[i].xpRequired) {
      currentLevel = DRIVER_LEVELS[i];
      nextLevel = DRIVER_LEVELS[i + 1] || null;
      break;
    }
  }

  const xpInLevel = xp - currentLevel.xpRequired;
  const xpToNext = nextLevel ? nextLevel.xpRequired - xp : 0;
  const levelRange = nextLevel ? nextLevel.xpRequired - currentLevel.xpRequired : 1;
  const progress = nextLevel ? Math.round((xpInLevel / levelRange) * 100) : 100;

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    unlock: currentLevel.unlock,
    xpToNext,
    xpInLevel,
    progress,
    isMaxLevel: !nextLevel
  };
}

/**
 * Get rank info for a given points amount
 * @param {number} points - Current points
 * @returns {{ rank: number, title: string, pointsToNext: number, pointsInRank: number, progress: number }}
 */
export function getRankForPoints(points) {
  let currentRank = RECRUITER_RANKS[0];
  let nextRank = RECRUITER_RANKS[1];

  for (let i = RECRUITER_RANKS.length - 1; i >= 0; i--) {
    if (points >= RECRUITER_RANKS[i].pointsRequired) {
      currentRank = RECRUITER_RANKS[i];
      nextRank = RECRUITER_RANKS[i + 1] || null;
      break;
    }
  }

  const pointsInRank = points - currentRank.pointsRequired;
  const pointsToNext = nextRank ? nextRank.pointsRequired - points : 0;
  const rankRange = nextRank ? nextRank.pointsRequired - currentRank.pointsRequired : 1;
  const progress = nextRank ? Math.round((pointsInRank / rankRange) * 100) : 100;

  return {
    rank: currentRank.rank,
    title: currentRank.title,
    unlock: currentRank.unlock,
    pointsToNext,
    pointsInRank,
    progress,
    isMaxRank: !nextRank
  };
}

/**
 * Get streak multiplier for a user
 * @param {number} streakDays - Current streak days
 * @param {'driver' | 'recruiter'} userType
 * @returns {number} Multiplier value
 */
export function getStreakMultiplier(streakDays, userType) {
  const multipliers = STREAK_MULTIPLIERS[userType] || STREAK_MULTIPLIERS.driver;

  for (const bracket of multipliers) {
    if (streakDays >= bracket.minDays && streakDays <= bracket.maxDays) {
      return bracket.multiplier;
    }
  }

  return 1.0;
}

/**
 * Get XP config for a driver action
 * @param {string} action - Action type
 * @returns {{ xp: number, dailyLimit?: number, weeklyLimit?: number, oneTime?: boolean } | null}
 */
export function getDriverXPConfig(action) {
  return DRIVER_XP_ACTIONS[action] || null;
}

/**
 * Get points config for a recruiter action
 * @param {string} action - Action type
 * @returns {{ points: number, dailyLimit?: number, monthlyLimit?: number, oneTime?: boolean } | null}
 */
export function getRecruiterPointsConfig(action) {
  return RECRUITER_POINT_ACTIONS[action] || null;
}

/**
 * Check if an action has exceeded its rate limit
 * @param {string} action - Action type
 * @param {number} currentCount - Current action count for period
 * @param {'daily' | 'weekly' | 'monthly'} period
 * @returns {boolean}
 */
export function isRateLimited(action, currentCount, period = 'daily') {
  const driverConfig = DRIVER_XP_ACTIONS[action];
  const recruiterConfig = RECRUITER_POINT_ACTIONS[action];
  const config = driverConfig || recruiterConfig;

  if (!config) return false;

  const limitKey = `${period}Limit`;
  const limit = config[limitKey];

  if (!limit) return false;

  return currentCount >= limit;
}
