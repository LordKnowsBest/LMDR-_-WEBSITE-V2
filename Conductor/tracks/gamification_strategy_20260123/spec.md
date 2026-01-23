# Track Spec: Gamification System - Driver & Recruiter Progression

## 1. Overview

Build a comprehensive dual-sided gamification system that transforms routine platform interactions into engaging, goal-oriented experiences. The system provides separate but interconnected progression paths for Drivers ("Road to Success") and Recruiters ("Talent Hunter"), with cross-platform mechanics that reward quality matches.

### 1.1 Business Goals

| Goal | Metric | Target |
|------|--------|--------|
| Increase engagement | Daily Active Users (DAU) | +35% |
| Improve retention | 30-day retention rate | +20% |
| Profile completion | Driver profiles at 100% | +40% |
| Response rates | Recruiter <24hr response | +25% |
| Match quality | Successful hires | +15% |
| Platform stickiness | Avg. session duration | +50% |

### 1.2 Features Summary

**Driver System ("Road to Success")**
1. **XP & Levels** - 10-level progression with meaningful unlocks
2. **Achievements** - 25+ badges across profile, activity, and community
3. **Streaks** - Daily login and engagement streaks with multipliers
4. **Challenges** - Daily, weekly, and monthly challenges

**Recruiter System ("Talent Hunter")**
1. **Points & Ranks** - 8-rank progression tied to hiring success
2. **Performance Badges** - Responsiveness, quality, and retention badges
3. **Leaderboards** - Weekly/monthly competitive rankings
4. **Hiring Sprints** - Time-limited competitive events

**Shared Mechanics**
1. **Match Quality Bonus** - Both sides rewarded for successful hires
2. **Referral Network** - Cascading bonuses for platform growth
3. **Seasonal Events** - Platform-wide themed events with special rewards

## 2. Architecture

### 2.1 System Architecture

```
+------------------------------------------------------------------------+
|                        GAMIFICATION SYSTEM                              |
+------------------------------------------------------------------------+
|                                                                          |
|  +---------------------------+      +---------------------------+        |
|  |   DRIVER PROGRESSION      |      |   RECRUITER PROGRESSION   |        |
|  |   "Road to Success"       |      |   "Talent Hunter"         |        |
|  |                           |      |                           |        |
|  |  - XP System              |      |  - Points System          |        |
|  |  - 10 Levels              |      |  - 8 Ranks                |        |
|  |  - Achievement Badges     |      |  - Performance Badges     |        |
|  |  - Streak Tracking        |      |  - Leaderboards           |        |
|  |  - Daily Challenges       |      |  - Hiring Sprints         |        |
|  +-------------+-------------+      +-------------+-------------+        |
|                |                                  |                      |
|                +----------------+-----------------+                      |
|                                 |                                        |
|                     +-----------v-----------+                            |
|                     |   SHARED SERVICES     |                            |
|                     |                       |                            |
|                     |  - Event Processor    |                            |
|                     |  - Achievement Engine |                            |
|                     |  - Notification Hub   |                            |
|                     |  - Leaderboard Calc   |                            |
|                     |  - Challenge Manager  |                            |
|                     +-----------+-----------+                            |
|                                 |                                        |
+------------------------------------------------------------------------+
                                  |
                                  v
+------------------------------------------------------------------------+
|                    EXISTING LMDR SERVICES                               |
+------------------------------------------------------------------------+
|  DriverProfiles | recruiterStats | applicationService | messaging      |
|  carrierMatching | driverMatching | featureAdoptionService | email     |
+------------------------------------------------------------------------+
```

### 2.2 Event Flow Architecture

```
                    GAMIFICATION EVENT FLOW
                    =======================

+----------+     +-----------+     +------------+     +-------------+
| User     | --> | Platform  | --> | Event      | --> | Achievement |
| Action   |     | Service   |     | Processor  |     | Engine      |
+----------+     +-----------+     +------------+     +-------------+
                                         |                   |
                                         v                   v
                                   +-----------+     +--------------+
                                   | XP/Points |     | Badge Check  |
                                   | Calculator|     | & Award      |
                                   +-----------+     +--------------+
                                         |                   |
                                         v                   v
                                   +-----------+     +--------------+
                                   | Streak    |     | Level/Rank   |
                                   | Tracker   |     | Up Check     |
                                   +-----------+     +--------------+
                                         |                   |
                                         +--------+----------+
                                                  |
                                                  v
                                         +--------------+
                                         | Notification |
                                         | Dispatcher   |
                                         +--------------+
                                                  |
                            +----------+----------+----------+
                            |          |          |          |
                            v          v          v          v
                       +--------+ +--------+ +--------+ +--------+
                       | In-App | | Email  | | Push   | | Toast  |
                       | Badge  | | Digest | | (Fut.) | | Alert  |
                       +--------+ +--------+ +--------+ +--------+
```

### 2.3 Driver XP Flow

```
                    DRIVER XP ACCUMULATION
                    ======================

+------------------+     +------------------+     +------------------+
| Profile Actions  |     | Engagement       |     | Community        |
|                  |     | Actions          |     | Actions          |
| - Complete field |     | - Daily login    |     | - Leave review   |
| - Upload CDL     |     | - View carrier   |     | - Refer driver   |
| - Verify docs    |     | - Apply to job   |     | - Help answer    |
| - Add experience |     | - Respond <4hr   |     | - Forum post     |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         +------------------------+------------------------+
                                  |
                                  v
                        +------------------+
                        | XP Accumulator   |
                        | + Streak Bonus   |
                        | + Event Bonus    |
                        +--------+---------+
                                 |
                                 v
                        +------------------+
                        | Level Calculator |
                        |                  |
                        | Level = f(XP)    |
                        +--------+---------+
                                 |
                    +------------+------------+
                    |                         |
                    v                         v
           +----------------+        +----------------+
           | Level Up?      |        | Unlock Check   |
           | -> Celebration |        | -> New Perks   |
           +----------------+        +----------------+
```

### 2.4 Recruiter Points Flow

```
                    RECRUITER POINT SYSTEM
                    ======================

+------------------+     +------------------+     +------------------+
| Outreach Actions |     | Quality Metrics  |     | Success Actions  |
|                  |     |                  |     |                  |
| - View profile   |     | - Response time  |     | - Make offer     |
| - Send message   |     | - Reply rate     |     | - Complete hire  |
| - Schedule call  |     | - Driver replies |     | - 90-day retain  |
| - Interview      |     | - High match %   |     | - Driver rating  |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         +------------------------+------------------------+
                                  |
                                  v
                        +------------------+
                        | Points Processor |
                        | + Quality Mult.  |
                        | + Sprint Bonus   |
                        +--------+---------+
                                 |
                                 v
                        +------------------+
                        | Rank Calculator  |
                        | + Leaderboard    |
                        +--------+---------+
                                 |
                    +------------+------------+
                    |                         |
                    v                         v
           +----------------+        +----------------+
           | Rank Up?       |        | Leaderboard    |
           | -> Unlock Tier |        | Update         |
           +----------------+        +----------------+
```

## 3. Data Model

### 3.1 Driver Gamification Collections

#### DriverProgression Collection
```
_id: String (auto)
driver_id: Reference -> DriverProfiles
current_xp: Number                    // Total accumulated XP
level: Number                         // 1-10
level_title: String                   // "Rookie Driver", "Road Legend"
xp_to_next_level: Number              // XP needed for next level
streak_days: Number                   // Current login streak
longest_streak: Number                // Best streak achieved
last_login_date: Date                 // For streak calculation
streak_freeze_available: Number       // Free passes (1/month base)
total_applications: Number            // Lifetime count
total_responses: Number               // Messages responded
avg_response_hours: Number            // Average response time
profile_completion: Number            // 0-100 percentage
created_at: Date
updated_at: Date
```

#### DriverAchievements Collection
```
_id: String (auto)
driver_id: Reference -> DriverProfiles
achievement_id: Reference -> AchievementDefinitions
earned_at: Date
progress: Number                      // For progressive achievements (0-100)
is_complete: Boolean
notified: Boolean                     // User has been notified
display_order: Number                 // Profile display order
```

#### DriverChallenges Collection
```
_id: String (auto)
driver_id: Reference -> DriverProfiles
challenge_id: Reference -> ChallengeDefinitions
status: String                        // "active", "completed", "expired", "claimed"
progress: Number                      // Current progress count
target: Number                        // Required for completion
started_at: Date
completed_at: Date
expires_at: Date
xp_reward: Number
claimed_at: Date
```

### 3.2 Recruiter Gamification Collections

#### RecruiterProgression Collection
```
_id: String (auto)
recruiter_id: String                  // Wix member ID
carrier_id: Reference -> Carriers     // Primary carrier
current_points: Number                // Total accumulated points
rank: Number                          // 1-8
rank_title: String                    // "Scout", "Talent Champion"
points_to_next_rank: Number
total_hires: Number                   // Lifetime successful hires
total_outreach: Number                // Messages sent
avg_response_hours: Number            // Response time
hire_acceptance_rate: Number          // Offer acceptance %
retention_90_day_rate: Number         // 90-day retention %
driver_satisfaction_avg: Number       // Avg rating from drivers
created_at: Date
updated_at: Date
```

#### RecruiterBadges Collection
```
_id: String (auto)
recruiter_id: String
badge_id: Reference -> BadgeDefinitions
earned_at: Date
tier: String                          // "bronze", "silver", "gold", "platinum"
expires_at: Date                      // For time-limited badges (null = permanent)
is_featured: Boolean                  // Show prominently on profile
```

#### LeaderboardSnapshots Collection
```
_id: String (auto)
period_type: String                   // "weekly", "monthly", "quarterly"
period_start: Date
period_end: Date
leaderboard_type: String              // "hires", "response_time", "retention", "overall"
rankings: Array<{
  rank: Number,
  recruiter_id: String,
  recruiter_name: String,
  carrier_name: String,
  score: Number,
  change_from_previous: Number        // +/- rank change
}>
generated_at: Date
```

### 3.3 Shared Collections

#### AchievementDefinitions Collection
```
_id: String (auto)
achievement_id: String                // "profile_pioneer", "quick_draw"
name: String                          // "Profile Pioneer"
description: String                   // "Complete your profile to 100%"
category: String                      // "profile", "activity", "milestone", "community"
icon: String                          // Icon class or emoji
color: String                         // Badge color hex
user_type: String                     // "driver", "recruiter", "both"
requirement_type: String              // "count", "threshold", "boolean", "streak"
requirement_field: String             // Field to check
requirement_value: Number             // Target value
xp_reward: Number                     // XP/points on completion
is_hidden: Boolean                    // Secret achievement
is_active: Boolean
display_order: Number
```

#### BadgeDefinitions Collection
```
_id: String (auto)
badge_id: String                      // "lightning_responder"
name: String                          // "Lightning Responder"
description: String
icon: String
user_type: String                     // "driver", "recruiter"
tier_thresholds: {                    // For tiered badges
  bronze: Number,
  silver: Number,
  gold: Number,
  platinum: Number
}
calculation_type: String              // "avg_response_time", "total_hires", etc.
recalculation_frequency: String       // "realtime", "daily", "weekly"
is_active: Boolean
```

#### ChallengeDefinitions Collection
```
_id: String (auto)
challenge_id: String                  // "weekly_apply_3"
name: String                          // "Application Sprint"
description: String                   // "Apply to 3 jobs this week"
user_type: String                     // "driver", "recruiter"
challenge_type: String                // "daily", "weekly", "monthly", "event"
action_type: String                   // "apply", "respond", "login", "hire"
target_count: Number                  // 3
xp_reward: Number                     // 100
bonus_reward: String                  // "featured_profile", "badge", null
duration_hours: Number                // 168 for weekly
is_recurring: Boolean                 // Resets each period
is_active: Boolean
start_date: Date                      // For event challenges
end_date: Date
```

#### GamificationEvents Collection
```
_id: String (auto)
user_id: String                       // Driver or Recruiter ID
user_type: String                     // "driver", "recruiter"
event_type: String                    // "xp_earned", "level_up", "badge_earned", etc.
action: String                        // "profile_complete", "application_sent"
xp_earned: Number
points_earned: Number
streak_bonus: Number                  // Multiplier applied
source_id: String                     // Related record ID
source_type: String                   // "application", "message", "hire"
metadata: Object                      // Additional context
created_at: Date
```

#### SeasonalEvents Collection
```
_id: String (auto)
event_id: String                      // "january_kickoff_2026"
name: String                          // "January Hiring Kickoff"
description: String
start_date: Date
end_date: Date
xp_multiplier: Number                 // 2.0 for double XP
points_multiplier: Number
special_challenges: Array<String>     // Challenge IDs active during event
special_badges: Array<String>         // Limited-time badges
theme_color: String
banner_image: String
is_active: Boolean
```

### 3.4 Level & Rank Definitions

#### Driver Levels (Static Configuration)
```javascript
const DRIVER_LEVELS = [
  { level: 1,  title: "Rookie Driver",    xp_required: 0,      unlock: "Basic profile" },
  { level: 2,  title: "Road Ready",       xp_required: 100,    unlock: "Priority support queue" },
  { level: 3,  title: "Mile Marker",      xp_required: 300,    unlock: "Advanced search filters" },
  { level: 4,  title: "Highway Hero",     xp_required: 600,    unlock: "Early job alerts (30 min)" },
  { level: 5,  title: "Route Master",     xp_required: 1000,   unlock: "Salary insights access" },
  { level: 6,  title: "Fleet Veteran",    xp_required: 1500,   unlock: "Direct recruiter chat" },
  { level: 7,  title: "Road Scholar",     xp_required: 2500,   unlock: "Featured profile boost" },
  { level: 8,  title: "Trucking Pro",     xp_required: 4000,   unlock: "Exclusive job postings" },
  { level: 9,  title: "Industry Expert",  xp_required: 6000,   unlock: "Mentorship eligibility" },
  { level: 10, title: "Road Legend",      xp_required: 10000,  unlock: "VIP concierge service" }
];
```

#### Recruiter Ranks (Static Configuration)
```javascript
const RECRUITER_RANKS = [
  { rank: 1, title: "Scout",            points_required: 0,      unlock: "Basic access" },
  { rank: 2, title: "Recruiter",        points_required: 500,    unlock: "Bulk messaging (10/day)" },
  { rank: 3, title: "Talent Finder",    points_required: 1500,   unlock: "Advanced search filters" },
  { rank: 4, title: "Hiring Pro",       points_required: 3500,   unlock: "Pipeline templates" },
  { rank: 5, title: "Staffing Expert",  points_required: 7000,   unlock: "Analytics dashboard" },
  { rank: 6, title: "Talent Architect", points_required: 12000,  unlock: "Priority support" },
  { rank: 7, title: "Recruiting Master", points_required: 20000, unlock: "Beta features early access" },
  { rank: 8, title: "Talent Champion",  points_required: 35000,  unlock: "Custom branding, white-glove" }
];
```

## 4. XP & Points Configuration

### 4.1 Driver XP Actions

| Category | Action | Base XP | Notes |
|----------|--------|---------|-------|
| **Profile** | Complete basic info | +50 | One-time |
| | Upload CDL photo | +25 | One-time |
| | Verify CDL via OCR | +100 | One-time |
| | Complete preferences | +30 | One-time |
| | Add work history entry | +20 | Per entry, max 5 |
| | Upload endorsement | +15 | Per endorsement |
| | 100% profile complete | +200 | Bonus |
| **Engagement** | Daily login | +5 | Once per day |
| | 7-day streak bonus | +50 | Weekly bonus |
| | 30-day streak bonus | +200 | Monthly bonus |
| | View carrier profile | +2 | Max 10/day |
| | Save a job | +5 | Max 5/day |
| | Apply to job | +25 | Unlimited |
| | Complete application | +50 | Full form submitted |
| | Respond to recruiter <4hrs | +30 | Time bonus |
| | Respond to recruiter <24hrs | +15 | Standard |
| | Attend interview | +100 | Per interview |
| | Accept offer | +500 | Per hire |
| **Community** | Leave carrier review | +20 | Max 3/week |
| | Review marked helpful | +10 | Per helpful vote |
| | Refer a driver | +200 | On signup |
| | Referral gets hired | +500 | Bonus |
| | Report outdated job | +10 | Verified reports |
| | Complete survey | +25 | Per survey |

### 4.2 Recruiter Points Actions

| Category | Action | Base Points | Notes |
|----------|--------|-------------|-------|
| **Outreach** | View driver profile | +2 | Max 20/day |
| | Send personalized message | +10 | Non-template |
| | Use message template | +5 | Template message |
| | Schedule interview | +50 | Per interview |
| | Complete interview | +75 | Interview held |
| **Quality** | Driver responds to message | +15 | Bonus for engagement |
| | Driver applies to your job | +20 | Inbound application |
| | High match application (80%+) | +30 | Quality bonus |
| | Respond <4hrs | +25 | Daily bonus if maintained |
| | Respond <24hrs | +10 | Standard responsiveness |
| **Success** | Make offer | +100 | Per offer |
| | Driver accepts offer | +300 | Conversion |
| | **Successful hire** | +500 | Driver starts |
| | 90-day retention | +1000 | Retention bonus |
| | Driver rates 4+ stars | +200 | Satisfaction bonus |
| **Platform** | Complete carrier profile | +100 | One-time |
| | Add job posting | +25 | Per posting |
| | Update job posting | +10 | Keep current |
| | Maintain 4+ rating | +100 | Monthly bonus |

### 4.3 Streak Multipliers

| Streak Days | XP Multiplier | Points Multiplier |
|-------------|---------------|-------------------|
| 1-6 | 1.0x | 1.0x |
| 7-13 | 1.1x | 1.05x |
| 14-29 | 1.15x | 1.1x |
| 30-59 | 1.25x | 1.15x |
| 60-89 | 1.35x | 1.2x |
| 90+ | 1.5x | 1.25x |

### 4.4 Event Multipliers

| Event Type | Multiplier | Duration |
|------------|------------|----------|
| Weekend Boost | 1.5x | Sat-Sun |
| Seasonal Event | 2.0x | Event period |
| Hiring Sprint | 2.0x (recruiter) | Sprint duration |
| New User Bonus | 2.0x | First 7 days |

## 5. API Design

### 5.1 Gamification Core Service (gamificationService.jsw)

```javascript
// ==================== XP & POINTS ====================

/**
 * Award XP to a driver for an action
 * @param {string} driverId - Driver profile ID
 * @param {string} action - Action type (e.g., "apply_job", "profile_complete")
 * @param {object} metadata - Additional context (sourceId, etc.)
 * @returns {object} { xp_earned, total_xp, level, level_up, streak_bonus }
 */
awardDriverXP(driverId, action, metadata)

/**
 * Award points to a recruiter for an action
 * @param {string} recruiterId - Recruiter member ID
 * @param {string} action - Action type (e.g., "hire_complete", "interview")
 * @param {object} metadata - Additional context
 * @returns {object} { points_earned, total_points, rank, rank_up }
 */
awardRecruiterPoints(recruiterId, action, metadata)

/**
 * Get driver's current progression status
 * @param {string} driverId
 * @returns {object} Full progression object with level, XP, streaks, etc.
 */
getDriverProgression(driverId)

/**
 * Get recruiter's current progression status
 * @param {string} recruiterId
 * @returns {object} Full progression object with rank, points, stats
 */
getRecruiterProgression(recruiterId)

/**
 * Initialize progression for new user
 * @param {string} userId
 * @param {string} userType - "driver" or "recruiter"
 * @returns {object} New progression record
 */
initializeProgression(userId, userType)

// ==================== STREAKS ====================

/**
 * Record daily login and update streak
 * @param {string} driverId
 * @returns {object} { streak_days, streak_bonus, streak_frozen }
 */
recordDailyLogin(driverId)

/**
 * Use a streak freeze to preserve streak
 * @param {string} driverId
 * @returns {object} { success, freezes_remaining }
 */
useStreakFreeze(driverId)

/**
 * Get streak status without recording login
 * @param {string} driverId
 * @returns {object} { streak_days, will_break_if_no_login, freezes_available }
 */
getStreakStatus(driverId)

// ==================== LEVELS & RANKS ====================

/**
 * Check if driver should level up and process if so
 * @param {string} driverId
 * @returns {object} { leveled_up, new_level, unlocks, notification }
 */
checkDriverLevelUp(driverId)

/**
 * Check if recruiter should rank up and process if so
 * @param {string} recruiterId
 * @returns {object} { ranked_up, new_rank, unlocks, notification }
 */
checkRecruiterRankUp(recruiterId)

/**
 * Get level/rank requirements and unlocks
 * @param {string} userType - "driver" or "recruiter"
 * @returns {array} Level/rank definitions with requirements
 */
getLevelDefinitions(userType)
```

### 5.2 Achievement Service (achievementService.jsw)

```javascript
// ==================== ACHIEVEMENTS ====================

/**
 * Check all achievements for a user and award any newly earned
 * @param {string} userId
 * @param {string} userType
 * @returns {array} Newly earned achievements
 */
checkAndAwardAchievements(userId, userType)

/**
 * Get user's achievements (earned and in-progress)
 * @param {string} userId
 * @param {string} userType
 * @param {object} options - { include_locked, category }
 * @returns {array} Achievement objects with progress
 */
getAchievements(userId, userType, options)

/**
 * Get progress toward a specific achievement
 * @param {string} userId
 * @param {string} achievementId
 * @returns {object} { current, target, percentage, is_complete }
 */
getAchievementProgress(userId, achievementId)

/**
 * Get all achievement definitions
 * @param {string} userType - "driver", "recruiter", or "all"
 * @param {string} category - Optional category filter
 * @returns {array} Achievement definitions
 */
getAchievementDefinitions(userType, category)

/**
 * Manually award an achievement (admin function)
 * @param {string} userId
 * @param {string} achievementId
 * @returns {object} Awarded achievement
 */
manuallyAwardAchievement(userId, achievementId)
```

### 5.3 Badge Service (badgeService.jsw)

```javascript
// ==================== BADGES ====================

/**
 * Recalculate and update recruiter badges
 * @param {string} recruiterId
 * @returns {array} Current badges with tiers
 */
recalculateRecruiterBadges(recruiterId)

/**
 * Get user's current badges
 * @param {string} userId
 * @param {string} userType
 * @returns {array} Badge objects with tier and earned date
 */
getBadges(userId, userType)

/**
 * Get badge definitions catalog
 * @param {string} userType
 * @returns {array} Badge definitions with tier thresholds
 */
getBadgeDefinitions(userType)

/**
 * Check if user qualifies for a specific badge tier upgrade
 * @param {string} userId
 * @param {string} badgeId
 * @returns {object} { current_tier, next_tier, progress, qualifies }
 */
checkBadgeTierProgress(userId, badgeId)
```

### 5.4 Challenge Service (challengeService.jsw)

```javascript
// ==================== CHALLENGES ====================

/**
 * Get active challenges for a user
 * @param {string} userId
 * @param {string} userType
 * @returns {array} Active challenges with progress
 */
getActiveChallenges(userId, userType)

/**
 * Get available challenges user can start
 * @param {string} userId
 * @param {string} userType
 * @returns {array} Available challenge definitions
 */
getAvailableChallenges(userId, userType)

/**
 * Start a challenge for a user
 * @param {string} userId
 * @param {string} challengeId
 * @returns {object} New challenge record
 */
startChallenge(userId, challengeId)

/**
 * Update challenge progress (called by event processor)
 * @param {string} userId
 * @param {string} action - Action type that may affect challenges
 * @returns {array} Updated challenges
 */
updateChallengeProgress(userId, action)

/**
 * Claim reward for completed challenge
 * @param {string} userId
 * @param {string} challengeId
 * @returns {object} { xp_awarded, bonus_reward }
 */
claimChallengeReward(userId, challengeId)

/**
 * Get challenge history
 * @param {string} userId
 * @param {object} options - { status, limit, offset }
 * @returns {array} Past challenges
 */
getChallengeHistory(userId, options)
```

### 5.5 Leaderboard Service (leaderboardService.jsw)

```javascript
// ==================== LEADERBOARDS ====================

/**
 * Get current leaderboard
 * @param {string} leaderboardType - "hires", "response_time", "retention", "overall"
 * @param {string} period - "weekly", "monthly", "all_time"
 * @param {object} options - { limit, offset }
 * @returns {object} { rankings, user_position, period_info }
 */
getLeaderboard(leaderboardType, period, options)

/**
 * Get user's position on leaderboard
 * @param {string} recruiterId
 * @param {string} leaderboardType
 * @param {string} period
 * @returns {object} { rank, score, percentile, change }
 */
getUserLeaderboardPosition(recruiterId, leaderboardType, period)

/**
 * Generate leaderboard snapshot (scheduled job)
 * @param {string} period - "weekly" or "monthly"
 * @returns {object} Generated snapshot
 */
generateLeaderboardSnapshot(period)

/**
 * Get leaderboard history for a user
 * @param {string} recruiterId
 * @param {number} periods - Number of past periods
 * @returns {array} Historical rankings
 */
getLeaderboardHistory(recruiterId, periods)
```

### 5.6 Event Service (gamificationEventService.jsw)

```javascript
// ==================== EVENTS ====================

/**
 * Get active seasonal events
 * @returns {array} Active events with multipliers
 */
getActiveEvents()

/**
 * Get event details
 * @param {string} eventId
 * @returns {object} Event with challenges and badges
 */
getEventDetails(eventId)

/**
 * Get user's event participation
 * @param {string} userId
 * @param {string} eventId
 * @returns {object} { challenges_completed, badges_earned, xp_earned }
 */
getUserEventParticipation(userId, eventId)

/**
 * Get upcoming events
 * @returns {array} Scheduled future events
 */
getUpcomingEvents()
```

## 6. UI Components

### 6.1 Driver Dashboard - Progression Widget

```
+------------------------------------------------------------------+
|  YOUR PROGRESS                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |  [Avatar]  John Smith                                         | |
|  |            Level 5: Route Master                              | |
|  |                                                                | |
|  |  XP: 1,247 / 1,500                                            | |
|  |  [====================================______] 83%             | |
|  |                                                                | |
|  |  +------------------+  +------------------+                    | |
|  |  | [flame] 12 Days  |  | [badge] 8 Badges |                    | |
|  |  |    Streak        |  |    Earned        |                    | |
|  |  +------------------+  +------------------+                    | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  RECENT ACHIEVEMENTS                                              |
|  +--------------------------------------------------------------+ |
|  | [star] Quick Draw - Responded in under 1 hour!      +30 XP   | |
|  | [check] Profile Pioneer - 100% complete!           +200 XP   | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  TODAY'S CHALLENGES                                    [View All] |
|  +--------------------------------------------------------------+ |
|  | [target] Apply to 2 jobs today                   1/2  +50 XP | |
|  | [clock] Respond to all messages <4hrs            0/1  +30 XP | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### 6.2 Driver Profile - Badge Showcase

```
+------------------------------------------------------------------+
|  BADGES & ACHIEVEMENTS                               [View All]   |
+------------------------------------------------------------------+
|                                                                    |
|  FEATURED BADGES                                                  |
|  +-------------+  +-------------+  +-------------+                |
|  | [verified]  |  | [fire]      |  | [star]      |                |
|  | Verified    |  | Hot Streak  |  | Quick Draw  |                |
|  | CDL Holder  |  | 30 Days     |  |             |                |
|  +-------------+  +-------------+  +-------------+                |
|                                                                    |
|  ACHIEVEMENT PROGRESS                                             |
|  +--------------------------------------------------------------+ |
|  | Job Hunter (Apply to 10 jobs)                                 | |
|  | [==============================__________] 7/10               | |
|  +--------------------------------------------------------------+ |
|  | Communicator (Send 50 messages)                               | |
|  | [================____________________________] 23/50          | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### 6.3 Recruiter Dashboard - Rank & Points

```
+------------------------------------------------------------------+
|  TALENT HUNTER STATUS                                             |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |  [trophy] Rank 4: Hiring Pro                                  | |
|  |                                                                | |
|  |  Points: 4,230 / 7,000                                        | |
|  |  [=========================_______________] 60%               | |
|  |                                                                | |
|  |  Next Unlock: Analytics Dashboard                             | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  YOUR BADGES                                                      |
|  +------------------+  +------------------+  +------------------+ |
|  | [lightning]      |  | [quality]        |  | [retention]      | |
|  | Lightning        |  | Quality          |  | Retention        | |
|  | Responder        |  | Matcher (Gold)   |  | King (Silver)    | |
|  | <4hr avg         |  | 92% acceptance   |  | 87% 90-day       | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                    |
|  THIS WEEK'S STATS                                                |
|  +--------------------------------------------------------------+ |
|  | Hires: 3        | Response Time: 2.4hrs | Satisfaction: 4.8  | |
|  | Interviews: 8   | Reply Rate: 94%       | Points: +890       | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### 6.4 Recruiter Leaderboard

```
+------------------------------------------------------------------+
|  RECRUITER LEADERBOARD                                            |
+------------------------------------------------------------------+
|                                                                    |
|  [Weekly v]  [Hires v]                                            |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | #  | Recruiter          | Carrier           | Hires | Change | |
|  |----|--------------------|--------------------|-------|--------| |
|  | 1  | [crown] Sarah M.   | Swift Transport   | 12    | --     | |
|  | 2  | [medal] James K.   | Werner Logistics  | 10    | +2     | |
|  | 3  | [medal] Mike T.    | JB Hunt           | 9     | -1     | |
|  | 4  | Lisa R.            | Schneider         | 8     | +3     | |
|  | 5  | David W.           | Prime Inc         | 7     | -1     | |
|  | .. | ...                | ...               | ...   | ...    | |
|  |----|--------------------|--------------------|-------|--------| |
|  | 23 | [you] You          | ABC Trucking      | 3     | +5     | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  TOP 10 REWARDS                                                   |
|  - "Top Recruiter [Week]" badge                                   |
|  - Featured in weekly newsletter                                  |
|  - +500 bonus points                                              |
|                                                                    |
+------------------------------------------------------------------+
```

### 6.5 Challenge Hub

```
+------------------------------------------------------------------+
|  CHALLENGES                                                       |
+------------------------------------------------------------------+
|                                                                    |
|  [Daily]  [Weekly]  [Monthly]  [Events]                           |
|                                                                    |
|  ACTIVE CHALLENGES                                                |
|  +--------------------------------------------------------------+ |
|  | [clock] Respond to all inquiries <4hrs today                  | |
|  |         Progress: 2/3 complete                                | |
|  |         Reward: +100 XP                     Ends in: 6 hours  | |
|  |         [====================================______]          | |
|  +--------------------------------------------------------------+ |
|  | [target] Schedule 3 interviews this week                      | |
|  |         Progress: 1/3 complete                                | |
|  |         Reward: +200 points + Badge         Ends in: 4 days   | |
|  |         [=============_____________________________]          | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  AVAILABLE CHALLENGES                                  [Start All]|
|  +--------------------------------------------------------------+ |
|  | [star] First Contact - Send 5 personalized messages today     | |
|  |        Reward: +75 XP                       [Start Challenge] | |
|  +--------------------------------------------------------------+ |
|  | [trophy] Hiring Sprint - Complete 2 hires this week           | |
|  |        Reward: +500 points + Gold Badge     [Start Challenge] | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  COMPLETED TODAY                                                  |
|  +--------------------------------------------------------------+ |
|  | [check] Daily Login                        +5 XP    [Claimed] | |
|  | [check] Profile Views (10)                +20 pts   [Claimed] | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### 6.6 Level-Up Celebration Modal

```
+------------------------------------------------------------------+
|                                                                    |
|                        [confetti animation]                        |
|                                                                    |
|                    +------------------------+                      |
|                    |                        |                      |
|                    |     LEVEL UP!          |                      |
|                    |                        |                      |
|                    |   [star icon large]    |                      |
|                    |                        |                      |
|                    |   Level 5              |                      |
|                    |   ROUTE MASTER         |                      |
|                    |                        |                      |
|                    +------------------------+                      |
|                                                                    |
|                    NEW UNLOCK:                                     |
|                    +------------------------+                      |
|                    | [unlock icon]          |                      |
|                    | Salary Insights        |                      |
|                    | Access                 |                      |
|                    |                        |                      |
|                    | See estimated pay      |                      |
|                    | ranges for all         |                      |
|                    | carrier matches!       |                      |
|                    +------------------------+                      |
|                                                                    |
|                    [Continue]  [Share]                             |
|                                                                    |
+------------------------------------------------------------------+
```

### 6.7 Achievement Toast Notification

```
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [badge icon]  ACHIEVEMENT UNLOCKED!                           | |
|  |                                                                | |
|  |  Quick Draw                                                    | |
|  |  Responded to a recruiter in under 1 hour                     | |
|  |                                                   +30 XP      | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

## 7. Integration Points

### 7.1 Existing Service Hooks

| Service | Hook Point | Gamification Action |
|---------|-----------|---------------------|
| `driverProfiles.jsw` | Profile field updated | Award profile XP |
| `driverProfiles.jsw` | Profile 100% complete | Award achievement |
| `applicationService.jsw` | Application submitted | Award apply XP |
| `messaging.jsw` | Message sent | Award response XP (check timing) |
| `driverMatching.jsw` | Driver search viewed | Award recruiter points |
| `carrierMatching.jsw` | Match generated | Track for achievements |
| `interviewScheduler.jsw` | Interview scheduled | Award points |
| `recruiterStats.jsw` | Hire completed | Award major points + badges |
| `memberService.jsw` | Daily login | Update streak |
| `featureAdoptionService.jsw` | Feature used | Track engagement achievements |

### 7.2 Event Triggers (Add to Existing Services)

```javascript
// Example: applicationService.jsw modification
import { awardDriverXP, updateChallengeProgress } from 'backend/gamificationService';

export async function submitApplication(driverId, carrierId, applicationData) {
  // ... existing application logic ...

  // Gamification hooks
  await awardDriverXP(driverId, 'submit_application', { carrierId });
  await updateChallengeProgress(driverId, 'apply');

  return result;
}
```

### 7.3 Scheduled Jobs

| Job | Frequency | Purpose |
|-----|-----------|---------|
| `calculateDailyStreaks` | Daily at midnight | Reset/update streak counts |
| `generateWeeklyLeaderboard` | Weekly (Monday) | Snapshot weekly rankings |
| `generateMonthlyLeaderboard` | Monthly (1st) | Snapshot monthly rankings |
| `recalculateBadges` | Daily | Update all badge tiers |
| `expireChallenges` | Hourly | Mark expired challenges |
| `processEventStart` | Hourly | Activate scheduled events |
| `sendAchievementDigest` | Weekly | Email achievement summary |

### 7.4 Notification Integration

```javascript
// Notification types to add to MemberNotifications
const GAMIFICATION_NOTIFICATIONS = [
  'level_up',           // Driver leveled up
  'rank_up',            // Recruiter ranked up
  'achievement_earned', // New achievement
  'badge_earned',       // New badge or tier upgrade
  'streak_at_risk',     // Streak about to break
  'challenge_complete', // Challenge completed
  'leaderboard_top10',  // Made top 10
  'event_started',      // Seasonal event began
];
```

## 8. Security Considerations

### 8.1 Anti-Cheat Measures

| Threat | Mitigation |
|--------|------------|
| XP farming (spam actions) | Daily caps on repeatable actions |
| Fake applications | Verify application completeness |
| Login spoofing | Server-side login validation only |
| Multiple accounts | Phone verification for XP eligibility |
| Exploiting challenges | Server-side progress validation |

### 8.2 Rate Limits

```javascript
const GAMIFICATION_RATE_LIMITS = {
  daily_login_xp: 1,              // Once per day
  profile_view_xp: 10,            // Max 10 views/day
  carrier_view_xp: 10,            // Max 10 views/day
  job_save_xp: 5,                 // Max 5 saves/day
  review_xp: 3,                   // Max 3 reviews/week
  message_xp: 20,                 // Max 20 messages/day for XP
};
```

### 8.3 Validation Rules

```javascript
// All XP/point awards must pass validation
function validateGamificationAction(userId, action, metadata) {
  // Check rate limits
  if (exceedsRateLimit(userId, action)) {
    return { valid: false, reason: 'rate_limit' };
  }

  // Verify action authenticity
  if (!verifyActionSource(action, metadata)) {
    return { valid: false, reason: 'invalid_source' };
  }

  // Check for suspicious patterns
  if (detectAbusePattern(userId, action)) {
    flagForReview(userId, action);
    return { valid: false, reason: 'flagged' };
  }

  return { valid: true };
}
```

### 8.4 Data Access Control

| Data | Driver Access | Recruiter Access | Admin Access |
|------|---------------|------------------|--------------|
| Own progression | Full | Full | Full |
| Other's level/rank | View only | View only | Full |
| Leaderboard | Public rankings | Public rankings | Full |
| Achievements | Own + public | Own + public | Full |
| Event data | Public events | Public events | Full + edit |

## 9. Success Metrics

### 9.1 Engagement KPIs

| Metric | Baseline | 30-Day Target | 90-Day Target |
|--------|----------|---------------|---------------|
| DAU | Current | +20% | +35% |
| Avg. session duration | Current | +30% | +50% |
| Actions per session | Current | +25% | +40% |
| Return rate (7-day) | Current | +15% | +25% |

### 9.2 Driver Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| Profile completion rate | Current | +40% |
| Application submission rate | Current | +25% |
| Response rate to recruiters | Current | +30% |
| 30-day retention | Current | +20% |

### 9.3 Recruiter Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| Avg. response time | Current | -40% |
| Messages per active recruiter | Current | +35% |
| Interview conversion rate | Current | +15% |
| Platform stickiness | Current | +25% |

### 9.4 Business Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| Time to first hire | Current | -20% |
| Successful placements | Current | +15% |
| 90-day retention rate | Current | +10% |
| NPS score | Current | +10 points |

## 10. Open Questions

1. **Point Economy Balance**: Should there be a "Point Shop" where users can redeem XP/points for tangible rewards (gift cards, premium features)?

2. **Cross-Platform Bonuses**: Should drivers and recruiters who successfully match both receive bonus XP/points as a "Match Bonus"?

3. **Negative Points**: Should there be point deductions for negative behaviors (ghosting, false applications, spam messages)?

4. **Seasonal Resets**: Should leaderboards have a prestige system where rankings reset but users keep lifetime badges?

5. **Gamification Opt-Out**: Should users be able to hide gamification elements if they find them distracting?

6. **Team Competitions**: Should recruiters from the same carrier compete or collaborate? Team-based challenges?

7. **Public vs Private**: Which achievements/badges should be visible on public profiles vs. private?

8. **Monetization**: Should premium tiers have gamification benefits (extra streak freezes, exclusive badges)?
