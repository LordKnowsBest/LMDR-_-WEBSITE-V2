# Track Plan: Gamification System - Driver & Recruiter Progression

## Phase 1: Foundation & Data Model

Establish the core database collections, configuration, and base services for the gamification system.

### 1.1 Collection Setup
- [ ] Task: Create `DriverProgression` collection in Wix with schema from spec
- [ ] Task: Create `DriverAchievements` collection with driver_id and achievement_id indexes
- [ ] Task: Create `DriverChallenges` collection with status and expires_at indexes
- [ ] Task: Create `RecruiterProgression` collection with recruiter_id index
- [ ] Task: Create `RecruiterBadges` collection with badge_id and tier indexes
- [ ] Task: Create `LeaderboardSnapshots` collection with period_type and period_start indexes
- [ ] Task: Create `AchievementDefinitions` collection and seed initial achievements
- [ ] Task: Create `BadgeDefinitions` collection and seed recruiter badges
- [ ] Task: Create `ChallengeDefinitions` collection and seed initial challenges
- [ ] Task: Create `GamificationEvents` collection for event logging with user_id and created_at indexes
- [ ] Task: Create `SeasonalEvents` collection for event configuration

### 1.2 Configuration Data
- [ ] Task: Seed `AchievementDefinitions` with 25 driver achievements (profile, activity, milestone, community)
- [ ] Task: Seed `AchievementDefinitions` with 15 recruiter achievements
- [ ] Task: Seed `BadgeDefinitions` with recruiter responsiveness badges (Lightning, Fast, Active)
- [ ] Task: Seed `BadgeDefinitions` with recruiter quality badges (Quality Matcher, Retention King)
- [ ] Task: Seed `BadgeDefinitions` with recruiter milestone badges (First Hire, Ten Club, Century Club)
- [ ] Task: Seed `ChallengeDefinitions` with 5 daily challenges (driver)
- [ ] Task: Seed `ChallengeDefinitions` with 5 daily challenges (recruiter)
- [ ] Task: Seed `ChallengeDefinitions` with 5 weekly challenges (driver)
- [ ] Task: Seed `ChallengeDefinitions` with 5 weekly challenges (recruiter)
- [ ] Task: Seed `ChallengeDefinitions` with 3 monthly challenges (each role)
- [ ] Task: Create static configuration file for level/rank definitions (`gamificationConfig.js`)

### 1.3 Core Service - XP & Points
- [ ] Task: Create `gamificationService.jsw` with module scaffold
- [ ] Task: Implement `initializeProgression(userId, userType)` for new user setup
- [ ] Task: Implement `getDriverProgression(driverId)` with full stats calculation
- [ ] Task: Implement `getRecruiterProgression(recruiterId)` with full stats calculation
- [ ] Task: Implement `awardDriverXP(driverId, action, metadata)` with validation
- [ ] Task: Implement `awardRecruiterPoints(recruiterId, action, metadata)` with validation
- [ ] Task: Implement XP action configuration lookup (base XP values)
- [ ] Task: Implement rate limit checking for XP/points awards
- [ ] Task: Implement `logGamificationEvent(userId, userType, eventData)` for audit trail

### 1.4 Level & Rank System
- [ ] Task: Implement `checkDriverLevelUp(driverId)` with unlock processing
- [ ] Task: Implement `checkRecruiterRankUp(recruiterId)` with unlock processing
- [ ] Task: Implement `getLevelDefinitions(userType)` for UI display
- [ ] Task: Implement `calculateXPToNextLevel(currentXP)` helper
- [ ] Task: Implement `calculatePointsToNextRank(currentPoints)` helper
- [ ] Task: Create level-up notification trigger (MemberNotifications integration)
- [ ] Task: Create rank-up notification trigger

### 1.5 Testing - Phase 1
- [ ] Task: Write unit tests for `initializeProgression()` - both user types
- [ ] Task: Write unit tests for `awardDriverXP()` - all action types
- [ ] Task: Write unit tests for `awardRecruiterPoints()` - all action types
- [ ] Task: Write unit tests for level-up detection and processing
- [ ] Task: Write unit tests for rank-up detection and processing
- [ ] Task: Write unit tests for rate limit enforcement
- [ ] Task: Test XP award with streak multiplier calculation
- [ ] Task: Manual test: Create new driver and verify progression initialized
- [ ] Task: Manual test: Award XP and verify level-up triggers correctly
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Foundation'

---

## Phase 2: Streak System

Implement the daily login streak tracking system for drivers with streak freezes and multipliers.

### 2.1 Streak Backend
- [ ] Task: Create `streakService.jsw` for streak management
- [ ] Task: Implement `recordDailyLogin(driverId)` with timezone handling
- [ ] Task: Implement streak continuation logic (same day vs next day vs break)
- [ ] Task: Implement `getStreakStatus(driverId)` for dashboard display
- [ ] Task: Implement `useStreakFreeze(driverId)` with availability check
- [ ] Task: Implement `grantStreakFreeze(driverId)` for monthly reset
- [ ] Task: Implement `calculateStreakMultiplier(streakDays)` helper
- [ ] Task: Add streak multiplier application to `awardDriverXP()`

### 2.2 Streak Notifications
- [ ] Task: Create "streak at risk" notification (8pm if no login that day)
- [ ] Task: Create "streak broken" notification with encouragement
- [ ] Task: Create "streak milestone" notifications (7, 30, 60, 90 days)
- [ ] Task: Add streak notification preferences to driver settings

### 2.3 Streak Scheduled Jobs
- [ ] Task: Create `calculateDailyStreaks` scheduled job (runs at midnight UTC)
- [ ] Task: Implement streak break detection in scheduled job
- [ ] Task: Implement monthly streak freeze grant in scheduled job
- [ ] Task: Add streak job to `jobs.config`

### 2.4 Testing - Phase 2
- [ ] Task: Write unit tests for `recordDailyLogin()` - continuation scenario
- [ ] Task: Write unit tests for `recordDailyLogin()` - break scenario
- [ ] Task: Write unit tests for streak freeze usage
- [ ] Task: Write unit tests for streak multiplier calculation
- [ ] Task: Test timezone edge cases (user in different timezone than server)
- [ ] Task: Manual test: Build 7-day streak and verify bonus
- [ ] Task: Manual test: Break streak and verify reset
- [ ] Task: Manual test: Use streak freeze and verify preservation
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Streaks'

---

## Phase 3: Achievement System

Implement the achievement checking, awarding, and display system for both drivers and recruiters.

### 3.1 Achievement Backend
- [ ] Task: Create `achievementService.jsw` for achievement management
- [ ] Task: Implement `checkAndAwardAchievements(userId, userType)` main checker
- [ ] Task: Implement achievement type handlers:
  - [ ] Task: `checkCountAchievement()` for cumulative achievements
  - [ ] Task: `checkThresholdAchievement()` for reaching a value
  - [ ] Task: `checkBooleanAchievement()` for one-time unlocks
  - [ ] Task: `checkStreakAchievement()` for streak-based achievements
- [ ] Task: Implement `getAchievements(userId, userType, options)` for display
- [ ] Task: Implement `getAchievementProgress(userId, achievementId)` for progress bars
- [ ] Task: Implement `getAchievementDefinitions(userType, category)` for catalog
- [ ] Task: Implement `manuallyAwardAchievement(userId, achievementId)` for admin
- [ ] Task: Create achievement unlock notification with XP display

### 3.2 Achievement Triggers
- [ ] Task: Add achievement check hook to `driverProfiles.jsw` (profile completion)
- [ ] Task: Add achievement check hook to `applicationService.jsw` (application milestones)
- [ ] Task: Add achievement check hook to `messaging.jsw` (response time achievements)
- [ ] Task: Add achievement check hook to `recruiterStats.jsw` (hire milestones)
- [ ] Task: Add achievement check hook to gamification XP award (level achievements)
- [ ] Task: Create batch achievement checker for daily recalculation

### 3.3 Driver Achievements - Implementation
- [ ] Task: Implement "Profile Pioneer" - 100% profile complete
- [ ] Task: Implement "Verified Pro" - CDL verified via OCR
- [ ] Task: Implement "Picture Perfect" - Professional photo uploaded
- [ ] Task: Implement "Storyteller" - Bio 200+ characters
- [ ] Task: Implement "Hot Streak" - 30-day login streak
- [ ] Task: Implement "Flame Keeper" - 60-day login streak
- [ ] Task: Implement "Eternal Flame" - 90-day login streak
- [ ] Task: Implement "Job Hunter" - Apply to 10 jobs
- [ ] Task: Implement "Dedicated Applicant" - Apply to 25 jobs
- [ ] Task: Implement "Quick Draw" - Respond to recruiter <1hr
- [ ] Task: Implement "Speed Demon" - 10 responses under 1hr
- [ ] Task: Implement "Communicator" - 50 messages sent
- [ ] Task: Implement "First Mile" - First application submitted
- [ ] Task: Implement "Connected" - First recruiter contact
- [ ] Task: Implement "Hired!" - First job offer accepted
- [ ] Task: Implement "Rising Star" - Reach Level 5
- [ ] Task: Implement "Road Legend" - Reach Level 10
- [ ] Task: Implement "Recruiter" - Refer 3 drivers
- [ ] Task: Implement "Talent Scout" - Refer 10 drivers
- [ ] Task: Implement "Reviewer" - Leave 5 carrier reviews
- [ ] Task: Implement "Trusted Voice" - 10 reviews marked helpful

### 3.4 Recruiter Achievements - Implementation
- [ ] Task: Implement "First Hire" - Complete first placement
- [ ] Task: Implement "Ten Club" - 10 successful hires
- [ ] Task: Implement "Fifty Club" - 50 successful hires
- [ ] Task: Implement "Century Club" - 100 successful hires
- [ ] Task: Implement "Speed Demon" - Hire within 7 days of posting
- [ ] Task: Implement "Quality Seeker" - 90%+ offer acceptance rate
- [ ] Task: Implement "Retention Master" - 95%+ 90-day retention
- [ ] Task: Implement "Top Rated" - 4.8+ driver satisfaction
- [ ] Task: Implement "Outreach Pro" - 100 personalized messages
- [ ] Task: Implement "Conversationalist" - 500 messages exchanged
- [ ] Task: Implement "Data Driven" - Use analytics 30 days straight
- [ ] Task: Implement "Multi-Tasker" - Manage 5+ active pipelines

### 3.5 Testing - Phase 3
- [ ] Task: Write unit tests for each achievement type checker
- [ ] Task: Write unit tests for achievement progress calculation
- [ ] Task: Write unit tests for achievement unlock notification
- [ ] Task: Test achievement hooks in existing services
- [ ] Task: Manual test: Complete profile and verify Pioneer achievement
- [ ] Task: Manual test: Apply to 10 jobs and verify Job Hunter
- [ ] Task: Manual test: Admin award achievement and verify
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Achievements'

---

## Phase 4: Badge & Leaderboard System

Implement the recruiter badge tier system and competitive leaderboards.

### 4.1 Badge Backend
- [ ] Task: Create `badgeService.jsw` for badge management
- [ ] Task: Implement `recalculateRecruiterBadges(recruiterId)` for all badges
- [ ] Task: Implement `getBadges(userId, userType)` for display
- [ ] Task: Implement `getBadgeDefinitions(userType)` for catalog
- [ ] Task: Implement `checkBadgeTierProgress(userId, badgeId)` for progress
- [ ] Task: Implement badge tier calculation:
  - [ ] Task: `calculateResponseTimeBadge()` - Lightning/Fast/Active
  - [ ] Task: `calculateQualityBadge()` - acceptance rate tiers
  - [ ] Task: `calculateRetentionBadge()` - 90-day retention tiers
  - [ ] Task: `calculateHiresBadge()` - cumulative hires tiers
- [ ] Task: Create badge tier upgrade notification
- [ ] Task: Integrate with existing `recruiterStats.jsw` badge display

### 4.2 Leaderboard Backend
- [ ] Task: Create `leaderboardService.jsw` for leaderboard management
- [ ] Task: Implement `getLeaderboard(type, period, options)` with pagination
- [ ] Task: Implement `getUserLeaderboardPosition(recruiterId, type, period)`
- [ ] Task: Implement `generateLeaderboardSnapshot(period)` for scheduled job
- [ ] Task: Implement leaderboard types:
  - [ ] Task: "hires" - Total successful hires
  - [ ] Task: "response_time" - Fastest average response
  - [ ] Task: "retention" - Best 90-day retention rate
  - [ ] Task: "overall" - Weighted composite score
- [ ] Task: Implement `getLeaderboardHistory(recruiterId, periods)` for trends
- [ ] Task: Create leaderboard ranking change notification (top 10)

### 4.3 Leaderboard Scheduled Jobs
- [ ] Task: Create `generateWeeklyLeaderboard` scheduled job (Monday 00:00)
- [ ] Task: Create `generateMonthlyLeaderboard` scheduled job (1st 00:00)
- [ ] Task: Create `recalculateBadges` daily job for all recruiters
- [ ] Task: Add leaderboard jobs to `jobs.config`
- [ ] Task: Implement leaderboard announcement email (top 10 weekly)

### 4.4 Testing - Phase 4
- [ ] Task: Write unit tests for badge tier calculations
- [ ] Task: Write unit tests for leaderboard ranking algorithm
- [ ] Task: Write unit tests for leaderboard snapshot generation
- [ ] Task: Test badge recalculation with various recruiter data
- [ ] Task: Test leaderboard with ties (same score)
- [ ] Task: Manual test: View leaderboard and verify rankings
- [ ] Task: Manual test: Verify badge tier upgrade notification
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Badges & Leaderboards'

---

## Phase 5: Challenge System

Implement the daily, weekly, and monthly challenge system for both user types.

### 5.1 Challenge Backend
- [ ] Task: Create `challengeService.jsw` for challenge management
- [ ] Task: Implement `getActiveChallenges(userId, userType)` with progress
- [ ] Task: Implement `getAvailableChallenges(userId, userType)` for new challenges
- [ ] Task: Implement `startChallenge(userId, challengeId)` with validation
- [ ] Task: Implement `updateChallengeProgress(userId, action)` for tracking
- [ ] Task: Implement `claimChallengeReward(userId, challengeId)` with XP award
- [ ] Task: Implement `getChallengeHistory(userId, options)` for past challenges
- [ ] Task: Implement challenge expiration handling
- [ ] Task: Create challenge complete notification
- [ ] Task: Create challenge expiring soon notification (2 hours before)

### 5.2 Challenge Types
- [ ] Task: Implement daily challenge logic (reset at midnight)
- [ ] Task: Implement weekly challenge logic (reset Monday)
- [ ] Task: Implement monthly challenge logic (reset 1st)
- [ ] Task: Implement event challenge logic (custom dates)
- [ ] Task: Implement recurring challenge auto-assignment
- [ ] Task: Implement one-time challenge completion tracking

### 5.3 Challenge Triggers
- [ ] Task: Add challenge progress hook to login (daily login challenges)
- [ ] Task: Add challenge progress hook to applications (apply challenges)
- [ ] Task: Add challenge progress hook to messages (response challenges)
- [ ] Task: Add challenge progress hook to interviews (interview challenges)
- [ ] Task: Add challenge progress hook to hires (hiring challenges)

### 5.4 Challenge Scheduled Jobs
- [ ] Task: Create `expireChallenges` hourly job for expired challenge cleanup
- [ ] Task: Create `assignDailyChallenges` midnight job for auto-assignment
- [ ] Task: Create `sendChallengeReminders` job for expiring challenges
- [ ] Task: Add challenge jobs to `jobs.config`

### 5.5 Testing - Phase 5
- [ ] Task: Write unit tests for challenge start/progress/complete flow
- [ ] Task: Write unit tests for challenge expiration
- [ ] Task: Write unit tests for recurring challenge reset
- [ ] Task: Test challenge progress updates from various actions
- [ ] Task: Test challenge reward claiming
- [ ] Task: Manual test: Start daily challenge and complete it
- [ ] Task: Manual test: Let challenge expire and verify handling
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Challenges'

---

## Phase 6: UI Implementation

Build all frontend components for displaying gamification data.

### 6.1 Driver Dashboard Widgets
- [ ] Task: Create `DRIVER_GAMIFICATION.html` component in `src/public/driver/`
- [ ] Task: Build progression widget (level, XP bar, streak)
- [ ] Task: Build recent achievements widget
- [ ] Task: Build active challenges widget with progress bars
- [ ] Task: Build "What's Next" recommendation widget
- [ ] Task: Style with LMDR theme variables and dark mode support
- [ ] Task: Implement postMessage bridge for backend calls
- [ ] Task: Add mobile-responsive layout (iPhone 12/13 target)

### 6.2 Driver Profile Badge Display
- [ ] Task: Create badge showcase component for driver profile
- [ ] Task: Build achievement grid with categories
- [ ] Task: Build achievement progress modal for in-progress items
- [ ] Task: Add badge tooltip with description
- [ ] Task: Implement "Featured Badges" selection UI

### 6.3 Recruiter Dashboard Widgets
- [ ] Task: Create `RECRUITER_GAMIFICATION.html` component in `src/public/recruiter/`
- [ ] Task: Build rank and points widget
- [ ] Task: Build badge showcase widget
- [ ] Task: Build this week's stats widget
- [ ] Task: Build leaderboard position widget
- [ ] Task: Build active challenges widget
- [ ] Task: Style with LMDR theme and mobile responsiveness

### 6.4 Leaderboard Page
- [ ] Task: Create `RECRUITER_LEADERBOARD.html` page in `src/public/recruiter/`
- [ ] Task: Build leaderboard table with filtering (type, period)
- [ ] Task: Highlight current user's position
- [ ] Task: Display rank change indicators (+/-)
- [ ] Task: Build top 10 rewards section
- [ ] Task: Add historical comparison chart (optional)

### 6.5 Challenge Hub Page
- [ ] Task: Create `CHALLENGES.html` page in `src/public/driver/` (shared structure)
- [ ] Task: Build challenge category tabs (daily, weekly, monthly, events)
- [ ] Task: Build active challenges list with progress
- [ ] Task: Build available challenges list with start button
- [ ] Task: Build completed challenges history
- [ ] Task: Build reward claim modal

### 6.6 Celebration Modals
- [ ] Task: Create level-up celebration modal with animation
- [ ] Task: Create rank-up celebration modal
- [ ] Task: Create achievement unlock modal
- [ ] Task: Create badge earned modal
- [ ] Task: Create challenge complete modal
- [ ] Task: Add confetti animation library integration

### 6.7 Toast Notifications
- [ ] Task: Create XP earned toast notification
- [ ] Task: Create points earned toast notification
- [ ] Task: Create achievement unlocked toast
- [ ] Task: Create streak milestone toast
- [ ] Task: Create challenge progress toast
- [ ] Task: Implement toast queue for multiple notifications

### 6.8 Wix Page Integration
- [ ] Task: Add gamification widget to Driver Dashboard page
- [ ] Task: Add gamification widget to Recruiter Dashboard page
- [ ] Task: Create standalone Leaderboard page in Wix
- [ ] Task: Create standalone Challenges page in Wix
- [ ] Task: Set up all postMessage bridges for backend communication
- [ ] Task: Configure page permissions appropriately

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
