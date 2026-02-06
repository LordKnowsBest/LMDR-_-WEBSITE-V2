# Wave 4 Task Cards — Gamification

**Timeline:** Weeks 8-9 (post Gate 1)
**Juniors:** J1, J2
**Templates:** `_TEMPLATE_seed.jsw`, `_TEMPLATE_connectionTest.jsw`, `_TEMPLATE_bridge.test.js`, `_TEMPLATE_html.test.js`

---

## Wave 4 Key Notes

- **ALL gamification pages use `type` key protocol** (not `action`). Envelope: `{ type, data }`
- Existing service tests: `gamificationService.test.js`, `achievementService.test.js`, `badgeService.test.js`, `challengeService.test.js`, `leaderboardService.test.js`, `seasonalEventService.test.js`, `streakService.test.js`, `referralService.test.js`
- Existing handler test: `gamificationPageHandlers.test.js`
- **No bridge or HTML DOM tests exist** — all 6 pages need new bridge + HTML DOM tests

---

# JUNIOR 1 (J1): Driver Gamification, Badges & Challenges

## J1-A: Gamification Core Seed + Connection Test

### Deliverables
| # | File |
|---|------|
| 1 | `src/backend/seeds/seedGamification.jsw` |
| 2 | `src/backend/tests/gamificationConnectionTest.jsw` |

### Collection Keys (17 unique across all gamification services)
| Key | Expected Airtable Table |
|-----|------------------------|
| `driverProgression` | `v2_Driver_Progression` |
| `driverAchievements` | `v2_Driver_Achievements` |
| `driverChallenges` | `v2_Driver_Challenges` |
| `recruiterProgression` | `v2_Recruiter_Progression` |
| `recruiterBadges` | `v2_Recruiter_Badges` |
| `recruiterChallenges` | `v2_Recruiter_Challenges` |
| `gamificationEvents` | `v2_Gamification_Events` |
| `achievementDefinitions` | `v2_Achievement_Definitions` |
| `badgeDefinitions` | `v2_Badge_Definitions` |
| `challengeDefinitions` | `v2_Challenge_Definitions` |
| `leaderboardSnapshots` | `v2_Leaderboard_Snapshots` |
| `seasonalEvents` | `v2_Seasonal_Events` |
| `eventParticipants` | `v2_Event_Participants` |
| `eventLeaderboard` | `v2_Event_Leaderboard` |
| `driverReferrals` | `v2_Driver_Referrals` |
| `matchQualityBonuses` | `v2_Match_Quality_Bonuses` |

**NOTE:** `seedEventContent.jsw` already exists and seeds seasonal events, badges, and challenges. Your seed file should complement it with progression/achievement/referral data. Check `countData()` to avoid overlap.

### Seed Data Requirements

**Driver Progression (5 records):**
```
driver_id, level, xp_total, xp_this_period, streak_days, badges_earned, challenges_completed
```
- Levels: 1 (new), 5 (active), 10 (veteran), 15 (elite), 20 (legend)

**Recruiter Progression (3 records):**
```
recruiter_id, level, xp_total, points_total, streak_days
```

**Driver Achievements (8 records):**
```
driver_id, achievement_id, earned_at, tier
```

**Gamification Events (10 records):**
```
user_id, user_type, event_type, points_earned, xp_earned, metadata, timestamp
```
- Event types: 'challenge_complete', 'badge_earned', 'level_up', 'referral', 'streak_milestone'

**Driver Referrals (3 records):**
```
referrer_id, referred_id, status, bonus_awarded, created_at
```
- Statuses: 'pending', 'completed', 'expired'

### Connection Test — Run CRUD against `driverProgression` as primary. Map all 17 collections.

---

## J1-B: Driver Gamification Bridge + HTML DOM Tests (NEW)

### Source Files
- `src/pages/DRIVER_GAMIFICATION.ik6n7.js` (bridge test)
- `src/public/driver/DRIVER_GAMIFICATION.html` (HTML DOM test)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/driverGamification.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/driverGamification.html.test.js` | `_TEMPLATE_html.test.js` |

### Actions (7 — all use `type` key)

| # | Type | Calls | Response Type |
|---|------|-------|---------------|
| 1 | `ping` | none | `pong` |
| 2 | `gamificationReady` | `getDriverProgression` + `getActiveChallenges` + `getBadges` | `gamificationData` |
| 3 | `refreshGamification` | same as above | `gamificationData` |
| 4 | `startChallenge` | `startChallenge(userId, challengeId, 'driver')` | `challengeUpdate` | requires: data.challengeId |
| 5 | `claimReward` | `claimChallengeReward(userId, challengeId, 'driver')` | `challengeComplete` | requires: data.challengeId |
| 6 | `viewChallenges` | wixLocation | navigation |
| 7 | `navigateTo` | wixLocation | navigation |

---

## J1-C: Driver Badges Bridge + HTML DOM Tests (NEW)

### Source Files
- `src/pages/DRIVER_BADGES.jlfgc.js` (bridge test)
- `src/public/driver/DRIVER_BADGES.html` (HTML DOM test)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/driverBadges.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/driverBadges.html.test.js` | `_TEMPLATE_html.test.js` |

### Actions (2 — `type` key)

| # | Type | Calls | Response Type |
|---|------|-------|---------------|
| 1 | `badgesReady` | `getBadges(userId, 'driver')` | `achievementsData` |
| 2 | `updateFeatured` | local state | `featuredUpdated` |

---

## J1-D: Challenges Bridge + HTML DOM Tests (NEW)

### Source Files
- `src/pages/CHALLENGES.upscp.js` (bridge test)
- `src/public/driver/CHALLENGES.html` (HTML DOM test)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/challenges.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/challenges.html.test.js` | `_TEMPLATE_html.test.js` |

### Actions (3 — `type` key)

| # | Type | Calls | Response Type |
|---|------|-------|---------------|
| 1 | `challengesReady` | `getActiveChallenges` + `getAvailableChallenges` + `getChallengeHistory` | `challengesData` |
| 2 | `startChallenge` | `startChallenge(userId, challengeId, 'driver')` | `challengeStarted` | requires: data.challengeId |
| 3 | `claimReward` | `claimChallengeReward(userId, challengeId, 'driver')` | `rewardClaimed` | requires: data.challengeId |

### J1 Acceptance Criteria
- [ ] `seedGamification.jsw` seeds across 6+ collections (complements existing seedEventContent)
- [ ] `gamificationConnectionTest.jsw` maps all 17 collections, CRUD passes
- [ ] 3 new bridge tests: driverGamification (7), driverBadges (2), challenges (3)
- [ ] 3 new HTML DOM tests: `driverGamification.html.test.js`, `driverBadges.html.test.js`, `challenges.html.test.js`
- [ ] HTML DOM tests verify rendering for `gamificationData`, `achievementsData`, `challengesData`, `challengeUpdate`
- [ ] All use `type` protocol, not `action`
- [ ] `npm test` passes

---

# JUNIOR 2 (J2): Recruiter Gamification, Leaderboard & Analytics

## J2-A: Review Existing Service Tests + Extend Seed

J2 shares J1's seed and connection test files. Focus is on bridge tests.

## J2-B: Recruiter Gamification Bridge + HTML DOM Tests (NEW)

### Source Files
- `src/pages/RECRUITER_GAMIFICATION.un5u3.js` (bridge test)
- `src/public/recruiter/RECRUITER_GAMIFICATION.html` (HTML DOM test)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/recruiterGamification.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/recruiterGamification.html.test.js` | `_TEMPLATE_html.test.js` |

### Actions (5 — `type` key)

| # | Type | Calls | Response Type |
|---|------|-------|---------------|
| 1 | `ping` | none | `pong` |
| 2 | `gamificationReady` | `getRecruiterProgression` + `getBadges(userId, 'recruiter')` + `getUserLeaderboardPosition` | `gamificationData` |
| 3 | `refreshGamification` | same | `gamificationData` |
| 4 | `viewLeaderboard` | wixLocation | navigation |
| 5 | `navigateTo` | wixLocation | navigation |

## J2-C: Recruiter Leaderboard Bridge + HTML DOM Tests (NEW)

### Source Files
- `src/pages/RECRUITER_LEADERBOARD.o6tal.js` (bridge test)
- `src/public/recruiter/RECRUITER_LEADERBOARD.html` (HTML DOM test)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/recruiterLeaderboard.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/recruiterLeaderboard.html.test.js` | `_TEMPLATE_html.test.js` |

### Actions (2 — `type` key)

| # | Type | Calls | Response Type | Notes |
|---|------|-------|---------------|-------|
| 1 | `leaderboardReady` | `getLeaderboard('overall', 'monthly', {limit:20})` + `getUserLeaderboardPosition` | `leaderboardData` | |
| 2 | `getLeaderboard` | `getLeaderboard(type, period, {limit, offset})` | `leaderboardData` or `leaderboardPage` | `leaderboardPage` if page > 1 |

## J2-D: Admin Gamification Analytics Bridge + HTML DOM Tests (NEW)

### Source Files
- `src/pages/ADMIN_GAMIFICATION_ANALYTICS.jmm93.js` (bridge test)
- `src/public/admin/ADMIN_GAMIFICATION_ANALYTICS.html` (HTML DOM test)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/adminGamificationAnalytics.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/adminGamificationAnalytics.html.test.js` | `_TEMPLATE_html.test.js` |

### Actions (2 — `type` key)

| # | Type | Calls | Response Type |
|---|------|-------|---------------|
| 1 | `getGamificationMetrics` | `getGamificationDashboardMetrics()` | `gamificationMetricsResult` |
| 2 | `detectAbusePatterns` | `detectAbusePatterns()` | `abuseDetectionResult` |

### J2 Acceptance Criteria
- [ ] 3 new bridge tests: recruiterGamification (5), recruiterLeaderboard (2), adminGamificationAnalytics (2)
- [ ] 3 new HTML DOM tests: `recruiterGamification.html.test.js`, `recruiterLeaderboard.html.test.js`, `adminGamificationAnalytics.html.test.js`
- [ ] HTML DOM tests verify rendering for `gamificationData`, `leaderboardData`, `gamificationMetricsResult`, `abuseDetectionResult`
- [ ] All use `type` protocol
- [ ] `npm test` passes
