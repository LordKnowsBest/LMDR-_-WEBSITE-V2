# Track Plan: Gamification System - Driver & Recruiter Progression

## Phase 1: Foundation & Data Model

Establish the core database collections, configuration, and base services for the gamification system.

### 1.1 Collection Setup
- [x] Task: Create `DriverProgression` collection in Wix with schema from spec
- [x] Task: Create `DriverAchievements` collection with driver_id and achievement_id indexes
- [x] Task: Create `DriverChallenges` collection with status and expires_at indexes
- [x] Task: Create `RecruiterProgression` collection with recruiter_id index
- [x] Task: Create `RecruiterBadges` collection with badge_id and tier indexes
- [x] Task: Create `LeaderboardSnapshots` collection with period_type and period_start indexes
- [x] Task: Create `AchievementDefinitions` collection and seed initial achievements
- [x] Task: Create `BadgeDefinitions` collection and seed recruiter badges
- [x] Task: Create `ChallengeDefinitions` collection and seed initial challenges
- [x] Task: Create `GamificationEvents` collection for event logging with user_id and created_at indexes
- [x] Task: Create `SeasonalEvents` collection for event configuration

### 1.2 Configuration Data
- [x] Task: Seed `AchievementDefinitions` with 25 driver achievements (profile, activity, milestone, community)
- [x] Task: Seed `AchievementDefinitions` with 15 recruiter achievements
- [x] Task: Seed `BadgeDefinitions` with recruiter responsiveness badges (Lightning, Fast, Active)
- [x] Task: Seed `BadgeDefinitions` with recruiter quality badges (Quality Matcher, Retention King)
- [x] Task: Seed `BadgeDefinitions` with recruiter milestone badges (First Hire, Ten Club, Century Club)
- [x] Task: Seed `ChallengeDefinitions` with 5 daily challenges (driver)
- [x] Task: Seed `ChallengeDefinitions` with 5 daily challenges (recruiter)
- [x] Task: Seed `ChallengeDefinitions` with 5 weekly challenges (driver)
- [x] Task: Seed `ChallengeDefinitions` with 5 weekly challenges (recruiter)
- [x] Task: Seed `ChallengeDefinitions` with 3 monthly challenges (each role)
- [x] Task: Create static configuration file for level/rank definitions (`gamificationConfig.js`)

### 1.3 Core Service - XP & Points
- [x] Task: Create `gamificationService.jsw` with module scaffold
- [x] Task: Implement `initializeProgression(userId, userType)` for new user setup
- [x] Task: Implement `getDriverProgression(driverId)` with full stats calculation
- [x] Task: Implement `getRecruiterProgression(recruiterId)` with full stats calculation
- [x] Task: Implement `awardDriverXP(driverId, action, metadata)` with validation
- [x] Task: Implement `awardRecruiterPoints(recruiterId, action, metadata)` with validation
- [x] Task: Implement XP action configuration lookup (base XP values)
- [x] Task: Implement rate limit checking for XP/points awards
- [x] Task: Implement `logGamificationEvent(userId, userType, eventData)` for audit trail

### 1.4 Level & Rank System
- [x] Task: Implement `checkDriverLevelUp(driverId)` with unlock processing
- [x] Task: Implement `checkRecruiterRankUp(recruiterId)` with unlock processing
- [x] Task: Implement `getLevelDefinitions(userType)` for UI display
- [x] Task: Implement `calculateXPToNextLevel(currentXP)` helper
- [x] Task: Implement `calculatePointsToNextRank(currentPoints)` helper
- [x] Task: Create level-up notification trigger (MemberNotifications integration)
- [x] Task: Create rank-up notification trigger

### 1.5 Testing - Phase 1
- [x] Task: Write unit tests for `initializeProgression()` - both user types
- [x] Task: Write unit tests for `awardDriverXP()` - all action types
- [x] Task: Write unit tests for `awardRecruiterPoints()` - all action types
- [x] Task: Write unit tests for level-up detection and processing
- [x] Task: Write unit tests for rank-up detection and processing
- [x] Task: Write unit tests for rate limit enforcement
- [x] Task: Test XP award with streak multiplier calculation
- [x] Task: Manual test: Create new driver and verify progression initialized
- [x] Task: Manual test: Award XP and verify level-up triggers correctly
- [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation'

---

## Phase 2: Streak System

Implement the daily login streak tracking system for drivers with streak freezes and multipliers.

### 2.1 Streak Backend
- [x] Task: Create `streakService.jsw` for streak management
- [x] Task: Implement `recordDailyLogin(driverId)` with timezone handling
- [x] Task: Implement streak continuation logic (same day vs next day vs break)
- [x] Task: Implement `getStreakStatus(driverId)` for dashboard display
- [x] Task: Implement `useStreakFreeze(driverId)` with availability check
- [x] Task: Implement `grantStreakFreeze(driverId)` for monthly reset
- [x] Task: Implement `calculateStreakMultiplier(streakDays)` helper
- [x] Task: Add streak multiplier application to `awardDriverXP()`

### 2.2 Streak Notifications
- [x] Task: Create "streak at risk" notification (8pm if no login that day)
- [x] Task: Create "streak broken" notification with encouragement
- [x] Task: Create "streak milestone" notifications (7, 30, 60, 90 days)
- [x] Task: Add streak notification preferences to driver settings

### 2.3 Streak Scheduled Jobs
- [x] Task: Create `calculateDailyStreaks` scheduled job (runs at midnight UTC)
- [x] Task: Implement streak break detection in scheduled job
- [x] Task: Implement monthly streak freeze grant in scheduled job
- [x] Task: Add streak job to `jobs.config`

### 2.4 Testing - Phase 2
- [x] Task: Write unit tests for `recordDailyLogin()` - continuation scenario
- [x] Task: Write unit tests for `recordDailyLogin()` - break scenario
- [x] Task: Write unit tests for streak freeze usage
- [x] Task: Write unit tests for streak multiplier calculation
- [x] Task: Test timezone edge cases (user in different timezone than server)
- [x] Task: Manual test: Build 7-day streak and verify bonus
- [x] Task: Manual test: Break streak and verify reset
- [x] Task: Manual test: Use streak freeze and verify preservation
- [x] Task: Conductor - User Manual Verification 'Phase 2: Streaks'

---

## Phase 3: Achievement System

Implement the achievement checking, awarding, and display system for both drivers and recruiters.

### 3.1 Achievement Backend
- [x] Task: Create `achievementService.jsw` for achievement management
- [x] Task: Implement `checkAndAwardAchievements(userId, userType)` main checker
- [x] Task: Implement achievement type handlers:
  - [x] Task: `checkCountAchievement()` for cumulative achievements
  - [x] Task: `checkThresholdAchievement()` for reaching a value
  - [x] Task: `checkBooleanAchievement()` for one-time unlocks
  - [x] Task: `checkStreakAchievement()` for streak-based achievements
- [x] Task: Implement `getAchievements(userId, userType, options)` for display
- [x] Task: Implement `getAchievementProgress(userId, achievementId)` for progress bars
- [x] Task: Implement `getAchievementDefinitions(userType, category)` for catalog
- [x] Task: Implement `manuallyAwardAchievement(userId, achievementId)` for admin
- [x] Task: Create achievement unlock notification with XP display

### 3.2 Achievement Triggers
- [x] Task: Add achievement check hook to `driverProfiles.jsw` (profile completion)
- [x] Task: Add achievement check hook to `applicationService.jsw` (application milestones)
- [x] Task: Add achievement check hook to `messaging.jsw` (response time achievements)
- [x] Task: Add achievement check hook to `recruiterStats.jsw` (hire milestones)
- [x] Task: Add achievement check hook to gamification XP award (level achievements)
- [x] Task: Create batch achievement checker for daily recalculation

### 3.3 Driver Achievements - Implementation
- [x] Task: Implement "Profile Pioneer" - 100% profile complete
- [x] Task: Implement "Verified Pro" - CDL verified via OCR
- [x] Task: Implement "Picture Perfect" - Professional photo uploaded
- [x] Task: Implement "Storyteller" - Bio 200+ characters
- [x] Task: Implement "Hot Streak" - 30-day login streak
- [x] Task: Implement "Flame Keeper" - 60-day login streak
- [x] Task: Implement "Eternal Flame" - 90-day login streak
- [x] Task: Implement "Job Hunter" - Apply to 10 jobs
- [x] Task: Implement "Dedicated Applicant" - Apply to 25 jobs
- [x] Task: Implement "Quick Draw" - Respond to recruiter <1hr
- [x] Task: Implement "Speed Demon" - 10 responses under 1hr
- [x] Task: Implement "Communicator" - 50 messages sent
- [x] Task: Implement "First Mile" - First application submitted
- [x] Task: Implement "Connected" - First recruiter contact
- [x] Task: Implement "Hired!" - First job offer accepted
- [x] Task: Implement "Rising Star" - Reach Level 5
- [x] Task: Implement "Road Legend" - Reach Level 10
- [x] Task: Implement "Recruiter" - Refer 3 drivers
- [x] Task: Implement "Talent Scout" - Refer 10 drivers
- [x] Task: Implement "Reviewer" - Leave 5 carrier reviews
- [x] Task: Implement "Trusted Voice" - 10 reviews marked helpful

### 3.4 Recruiter Achievements - Implementation
- [x] Task: Implement "First Hire" - Complete first placement
- [x] Task: Implement "Ten Club" - 10 successful hires
- [x] Task: Implement "Fifty Club" - 50 successful hires
- [x] Task: Implement "Century Club" - 100 successful hires
- [x] Task: Implement "Speed Demon" - Hire within 7 days of posting
- [x] Task: Implement "Quality Seeker" - 90%+ offer acceptance rate
- [x] Task: Implement "Retention Master" - 95%+ 90-day retention
- [x] Task: Implement "Top Rated" - 4.8+ driver satisfaction
- [x] Task: Implement "Outreach Pro" - 100 personalized messages
- [x] Task: Implement "Conversationalist" - 500 messages exchanged
- [x] Task: Implement "Data Driven" - Use analytics 30 days straight
- [x] Task: Implement "Multi-Tasker" - Manage 5+ active pipelines

### 3.5 Testing - Phase 3
- [x] Task: Write unit tests for each achievement type checker
- [x] Task: Write unit tests for achievement progress calculation
- [x] Task: Write unit tests for achievement unlock notification
- [x] Task: Test achievement hooks in existing services
- [x] Task: Manual test: Complete profile and verify Pioneer achievement
- [x] Task: Manual test: Apply to 10 jobs and verify Job Hunter
- [x] Task: Manual test: Admin award achievement and verify
- [x] Task: Conductor - User Manual Verification 'Phase 3: Achievements'

---

## Phase 4: Badge & Leaderboard System

Implement the recruiter badge tier system and competitive leaderboards.

### 4.1 Badge Backend
- [x] Task: Create `badgeService.jsw` for badge management
- [x] Task: Implement `recalculateRecruiterBadges(recruiterId)` for all badges
- [x] Task: Implement `getBadges(userId, userType)` for display
- [x] Task: Implement `getBadgeDefinitions(userType)` for catalog
- [x] Task: Implement `checkBadgeTierProgress(userId, badgeId)` for progress
- [x] Task: Implement badge tier calculation:
  - [x] Task: `calculateResponseTimeBadge()` - Lightning/Fast/Active
  - [x] Task: `calculateQualityBadge()` - acceptance rate tiers
  - [x] Task: `calculateRetentionBadge()` - 90-day retention tiers
  - [x] Task: `calculateHiresBadge()` - cumulative hires tiers
- [x] Task: Create badge tier upgrade notification
- [x] Task: Integrate with existing `recruiterStats.jsw` badge display

### 4.2 Leaderboard Backend
- [x] Task: Create `leaderboardService.jsw` for leaderboard management
- [x] Task: Implement `getLeaderboard(type, period, options)` with pagination
- [x] Task: Implement `getUserLeaderboardPosition(recruiterId, type, period)`
- [x] Task: Implement `generateLeaderboardSnapshot(period)` for scheduled job
- [x] Task: Implement leaderboard types:
  - [x] Task: "hires" - Total successful hires
  - [x] Task: "response_time" - Fastest average response
  - [x] Task: "retention" - Best 90-day retention rate
  - [x] Task: "overall" - Weighted composite score
- [x] Task: Implement `getLeaderboardHistory(recruiterId, periods)` for trends
- [x] Task: Create leaderboard ranking change notification (top 10)

### 4.3 Leaderboard Scheduled Jobs
- [x] Task: Create `generateWeeklyLeaderboard` scheduled job (Monday 00:00)
- [x] Task: Create `generateMonthlyLeaderboard` scheduled job (1st 00:00)
- [x] Task: Create `recalculateBadges` daily job for all recruiters
- [x] Task: Add leaderboard jobs to `jobs.config`
- [x] Task: Implement leaderboard announcement email (top 10 weekly)

### 4.4 Testing - Phase 4
- [x] Task: Write unit tests for badge tier calculations
- [x] Task: Write unit tests for leaderboard ranking algorithm
- [x] Task: Write unit tests for leaderboard snapshot generation
- [x] Task: Test badge recalculation with various recruiter data
- [x] Task: Test leaderboard with ties (same score)
- [x] Task: Manual test: View leaderboard and verify rankings
- [x] Task: Manual test: Verify badge tier upgrade notification
- [x] Task: Conductor - User Manual Verification 'Phase 4: Badges & Leaderboards' 🚧 (Logic Verified)

---

## Phase 5: Challenge System

Implement the daily, weekly, and monthly challenge system for both user types.

### 5.1 Challenge Backend
- [x] Task: Create `challengeService.jsw` for challenge management
- [x] Task: Implement `getActiveChallenges(userId, userType)` with progress
- [x] Task: Implement `getAvailableChallenges(userId, userType)` for new challenges
- [x] Task: Implement `startChallenge(userId, challengeId)` with validation
- [x] Task: Implement `updateChallengeProgress(userId, action)` for tracking
- [x] Task: Implement `claimChallengeReward(userId, challengeId)` with XP award
- [x] Task: Implement `getChallengeHistory(userId, options)` for past challenges
- [x] Task: Implement challenge expiration handling
- [x] Task: Create challenge complete notification
- [x] Task: Create challenge expiring soon notification (2 hours before)

### 5.2 Challenge Types
- [x] Task: Implement daily challenge logic (reset at midnight)
- [x] Task: Implement weekly challenge logic (reset Monday)
- [x] Task: Implement monthly challenge logic (reset 1st)
- [x] Task: Implement event challenge logic (custom dates)
- [x] Task: Implement recurring challenge auto-assignment
- [x] Task: Implement one-time challenge completion tracking

### 5.3 Challenge Triggers
- [x] Task: Add challenge progress hook to login (daily login challenges)
- [x] Task: Add challenge progress hook to applications (apply challenges)
- [x] Task: Add challenge progress hook to messages (response challenges)
- [x] Task: Add challenge progress hook to interviews (interview challenges)
- [x] Task: Add challenge progress hook to hires (hiring challenges)

### 5.4 Challenge Scheduled Jobs
- [x] Task: Create `expireChallenges` hourly job for expired challenge cleanup
- [x] Task: Create `assignDailyChallenges` midnight job for auto-assignment
- [x] Task: Create `sendChallengeReminders` job for expiring challenges
- [x] Task: Add challenge jobs to `jobs.config`

### 5.5 Testing - Phase 5
- [x] Task: Write unit tests for challenge start/progress/complete flow
- [x] Task: Write unit tests for challenge expiration
- [x] Task: Write unit tests for recurring challenge reset
- [ ] Task: Test challenge progress updates from various actions
- [ ] Task: Test challenge reward claiming
- [ ] Task: Manual test: Start daily challenge and complete it
- [ ] Task: Manual test: Let challenge expire and verify handling
- [x] Task: Conductor - User Manual Verification 'Phase 5: Challenges' 🚧 (Logic Verified)

---

## Phase 6: UI Implementation

Build all frontend components for displaying gamification data.

### 6.1 Driver Dashboard Widgets
- [x] Task: Create `DRIVER_GAMIFICATION.html` component in `src/public/driver/`
- [x] Task: Build progression widget (level, XP bar, streak)
- [x] Task: Build recent achievements widget
- [x] Task: Build active challenges widget with progress bars
- [x] Task: Build "What's Next" recommendation widget
- [x] Task: Style with LMDR theme variables and dark mode support
- [x] Task: Implement postMessage bridge for backend calls
- [x] Task: Add mobile-responsive layout (iPhone 12/13 target)

### 6.2 Driver Profile Badge Display
- [x] Task: Create badge showcase component for driver profile (DRIVER_BADGES.html)
- [x] Task: Build achievement grid with categories
- [x] Task: Build achievement progress modal for in-progress items
- [x] Task: Add badge tooltip with description
- [x] Task: Implement "Featured Badges" selection UI

### 6.3 Recruiter Dashboard Widgets
- [x] Task: Create `RECRUITER_GAMIFICATION.html` component in `src/public/recruiter/`
- [x] Task: Build rank and points widget
- [x] Task: Build badge showcase widget
- [x] Task: Build this week's stats widget
- [x] Task: Build leaderboard position widget
- [x] Task: Build active challenges widget
- [x] Task: Style with LMDR theme and mobile responsiveness

### 6.4 Leaderboard Page
- [x] Task: Create `RECRUITER_LEADERBOARD.html` page in `src/public/recruiter/`
- [x] Task: Build leaderboard table with filtering (type, period)
- [x] Task: Highlight current user's position
- [x] Task: Display rank change indicators (+/-)
- [x] Task: Build top 10 rewards section (podium view)
- [ ] Task: Add historical comparison chart (optional)

### 6.5 Challenge Hub Page
- [x] Task: Create `CHALLENGES.html` page in `src/public/driver/` (shared structure)
- [x] Task: Build challenge category tabs (daily, weekly, monthly, events)
- [x] Task: Build active challenges list with progress
- [x] Task: Build available challenges list with start button
- [x] Task: Build completed challenges history
- [x] Task: Build reward claim modal

### 6.6 Celebration Modals (Built into widgets)
- [x] Task: Create level-up celebration modal with animation
- [x] Task: Create rank-up celebration modal
- [x] Task: Create achievement unlock modal
- [x] Task: Create badge earned modal
- [x] Task: Create challenge complete modal
- [x] Task: Add confetti animation library integration

### 6.7 Toast Notifications (Built into widgets)
- [x] Task: Create XP earned toast notification
- [x] Task: Create points earned toast notification
- [x] Task: Create achievement unlocked toast
- [x] Task: Create streak milestone toast
- [x] Task: Create challenge progress toast
- [x] Task: Implement toast queue for multiple notifications

### 6.8 Wix Page Integration
- [x] Task: Add gamification widget to Driver Dashboard page
- [x] Task: Add gamification widget to Recruiter Dashboard page
- [x] Task: Create standalone Leaderboard page in Wix
- [x] Task: Create standalone Challenges page in Wix
- [x] Task: Create standalone Driver Badges page in Wix
- [x] Task: Set up all postMessage bridges for backend communication
- [ ] Task: Configure page permissions appropriately (manual in Wix editor)

### 6.9 Testing - Phase 6
- [ ] Task: Test driver dashboard widget on desktop and mobile
- [ ] Task: Test recruiter dashboard widget on desktop and mobile
- [ ] Task: Test leaderboard pagination and filtering
- [ ] Task: Test challenge UI flow (start → progress → complete → claim)
- [ ] Task: Test celebration modal triggers
- [ ] Task: Test toast notification queue
- [ ] Task: Manual test: Full driver gamification flow
- [ ] Task: Manual test: Full recruiter gamification flow
- [ ] Task: Conductor - User Manual Verification 'Phase 6: UI'

---

## Phase 7: Integration & Events

Connect gamification to existing services and implement seasonal events.

### 7.1 Service Integration Hooks
- [ ] Task: Add XP hook to `driverProfiles.jsw` - profile updates
- [ ] Task: Add XP hook to `applicationService.jsw` - application lifecycle
- [ ] Task: Add XP/achievement hook to `messaging.jsw` - response tracking
- [ ] Task: Add points hook to `driverMatching.jsw` - profile views
- [ ] Task: Add points hook to `interviewScheduler.jsw` - interview events
- [ ] Task: Add points/achievement hook to hire completion flow
- [ ] Task: Add streak recording to `memberService.jsw` login
- [ ] Task: Add challenge progress updates to all relevant services
- [ ] Task: Document all integration points in CLAUDE.md

### 7.2 Seasonal Events Backend
- [ ] Task: Create `gamificationEventService.jsw` for event management
- [ ] Task: Implement `getActiveEvents()` for current events
- [ ] Task: Implement `getEventDetails(eventId)` with challenges/badges
- [ ] Task: Implement `getUserEventParticipation(userId, eventId)`
- [ ] Task: Implement `getUpcomingEvents()` for preview
- [ ] Task: Implement event multiplier application to XP/points
- [ ] Task: Create event start notification
- [ ] Task: Create event ending soon notification

### 7.3 Event Content
- [ ] Task: Create "January Hiring Kickoff" event definition
- [ ] Task: Create "Spring Hiring Sprint" event definition
- [ ] Task: Create "Summer Road Trip" event definition
- [ ] Task: Create "Q4 Quota Crusher" event definition
- [ ] Task: Create event-specific badges for each
- [ ] Task: Create event-specific challenges for each

### 7.4 Event Scheduled Jobs
- [ ] Task: Create `processEventStart` hourly job for event activation
- [ ] Task: Create `processEventEnd` hourly job for event completion
- [ ] Task: Add event announcement to email digest
- [ ] Task: Add event jobs to `jobs.config`

### 7.5 Cross-Platform Bonuses
- [ ] Task: Implement Match Quality Bonus (both sides get bonus on hire)
- [ ] Task: Implement referral network bonus tracking
- [ ] Task: Create referral link generation for drivers
- [ ] Task: Track referral conversions through signup

### 7.6 Testing - Phase 7
- [ ] Task: Write integration tests for service hooks
- [ ] Task: Test event multiplier application
- [ ] Task: Test event badge/challenge availability
- [ ] Task: Test referral tracking and bonus awards
- [ ] Task: Manual test: Complete action and verify XP in all integrated services
- [ ] Task: Manual test: Activate test event and verify multipliers
- [ ] Task: Conductor - User Manual Verification 'Phase 7: Integration'

---

## Post-Launch Tasks

### Analytics & Monitoring
- [ ] Task: Add gamification metrics to admin dashboard
- [ ] Task: Create XP/points economy health dashboard
- [ ] Task: Track achievement unlock rates
- [ ] Task: Track challenge completion rates
- [ ] Task: Monitor for gaming/abuse patterns
- [ ] Task: Create engagement lift report (before/after)

### Performance Optimization
- [ ] Task: Cache frequent queries (user progression)
- [ ] Task: Optimize leaderboard queries with proper indexing
- [ ] Task: Implement batch processing for achievement checks
- [ ] Task: Add CDN caching for badge/achievement images

### Iteration & Balance
- [ ] Task: Analyze XP distribution and adjust values if needed
- [ ] Task: Review level progression curve
- [ ] Task: Add new achievements based on user feedback
- [ ] Task: Create additional seasonal events
- [ ] Task: Consider Point Shop implementation
- [ ] Task: Consider premium gamification perks

### Documentation
- [ ] Task: Update CLAUDE.md with gamification service documentation
- [ ] Task: Update GEMINI.md with gamification overview
- [ ] Task: Create user-facing help documentation for gamification
- [ ] Task: Document admin tools for gamification management