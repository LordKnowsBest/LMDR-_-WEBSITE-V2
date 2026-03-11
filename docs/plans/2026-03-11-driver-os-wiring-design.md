# Driver OS Backend Wiring — Design Document

> **Status:** APPROVED
> **Date:** 2026-03-11
> **Goal:** Replace 16 Wix `.jsw` driver services (~3,500 LOC) with 12 Cloud Run route files (~2,500 LOC) under `/v1/driver/*`, serving the Next.js driver frontend and AI agent layer through unified REST endpoints. Config-driven scoring weights for weekly ML optimization. Dual-layer engagement logging for training pipeline.

---

## Architecture

```
┌─────────────────────┐     ┌──────────────────────┐
│  Next.js Driver     │     │  lmdr-ai-service     │
│  (Server Actions)   │     │  (Agent tool_use)    │
│  LMDR_INTERNAL_KEY  │     │  LMDR_INTERNAL_KEY   │
└────────┬────────────┘     └────────┬─────────────┘
         │                           │
         └───────────┬───────────────┘
                     ▼
         ┌───────────────────────┐
         │  lmdr-api (Cloud Run) │
         │  /v1/driver/*         │
         │  Auth → Engagement    │
         │  Logger → Route       │
         │  Handler → Cloud SQL  │
         │  → BigQuery signals   │
         └───────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    Cloud SQL              BigQuery
    (65+ tables)     (driver_engagement_events
                      + match_outcomes)
```

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth strategy | No auth gate — any authenticated user | Maximize feature adoption; friction kills engagement |
| Route structure | 12 domain files (Option A) | Parallel subagent development, 1:1 mapping to .jsw services |
| Scoring weights | Config-driven from SQL table | ML pipeline updates weights weekly; no hardcoded values |
| Engagement logging | Dual-layer (implicit + explicit) | Implicit catches everything; explicit provides rich ML features |
| AI agent integration | `/v1/driver/manifest` endpoint | ~30 tools optimized for voice/chat natural language mapping |
| Wix dependency | ZERO | All business logic moves to Cloud Run |

### What Gets Replaced

| Before (Wix) | After (Cloud Run) |
|---|---|
| 16 driver `.jsw` services (~3,500 LOC) | 12 route files + 1 scoring lib (~2,500 LOC) |
| `driverOSFacade.jsw` (100+ re-exports) | 1 barrel `index.js` + `/driver/manifest` |
| Hardcoded scoring weights | Config-driven from `matching_model_weights` table |
| No engagement tracking | Dual-layer BigQuery logging (implicit + explicit) |
| `driverMatching.jsw` (58KB monolith) | `lib/driver-scoring.js` (~200 LOC pure function) |

---

## Route Structure

```
cloud-run-api/src/routes/driver/
├── index.js          ← barrel: engagement middleware + manifest (~30 AI tools)
├── profile.js        ← 12 endpoints
├── matching.js       ← 8 endpoints
├── cockpit.js        ← 11 endpoints
├── gamification.js   ← 10 endpoints
├── lifecycle.js      ← 5 endpoints
├── community.js      ← 12 endpoints
├── wellness.js       ← 10 endpoints
├── financial.js      ← 5 endpoints
├── scorecard.js      ← 4 endpoints
├── retention.js      ← 4 endpoints
└── documents.js      ← 5 endpoints

cloud-run-api/src/lib/
└── driver-scoring.js ← Pure scoring function (weights as parameter)
```

Mounted in `app.js` before the catch-all collection router:

```javascript
import driverRouter from './routes/driver/index.js';
protectedRouter.use('/driver', driverRouter);  // before collectionRouter
```

No `requireDriver()` guard — any authenticated request passes through.

---

## Endpoint Map (86 endpoints)

### profile.js (12 endpoints) — replaces driverProfiles.jsw + driverProfileService.jsw

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| POST | `/profile` | `getOrCreateDriverProfile()` | Create or retrieve profile |
| GET | `/profile/:id` | `getProfileById()` | Full profile with completeness |
| PUT | `/profile/:id` | `updateDriverPreferences()` | Update profile fields |
| GET | `/profile/:id/strength` | `getProfileStrength()` | Score breakdown + suggestions |
| PUT | `/profile/:id/visibility` | `setDiscoverability()` | Toggle recruiter visibility |
| POST | `/profile/:id/interest` | `logCarrierInterest()` | Log interest in carrier |
| GET | `/profile/:id/interests` | `getDriverInterests()` | List carrier interests |
| DELETE | `/profile/:id/interest/:dot` | `removeCarrierInterest()` | Remove interest |
| GET | `/profile/:id/interest-stats/:dot` | `getCarrierInterestStats()` | Stats for specific carrier |
| GET | `/profile/:id/activity` | `getDriverActivityStats()` | Activity summary |
| GET | `/profile/:id/views` | `getDriverProfileViews()` | Who viewed me |
| GET | `/profile/:id/suggestions` | `getProfileSuggestions()` | AI profile improvement tips |

### matching.js (8 endpoints) — replaces driverMatching.jsw + matchExplanationService.jsw

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| POST | `/matching/find-jobs` | `findMatchingDrivers()` | Score & rank carriers for driver |
| POST | `/matching/find-drivers` | `findMatchingDrivers()` (carrier side) | Score & rank drivers for carrier |
| GET | `/matching/explain/:driverId/:carrierDot` | `getMatchExplanationForDriver()` | Match explanation + LLM narrative |
| GET | `/matching/weights` | (new) | Current active model weights |
| GET | `/matching/search/jobs` | `searchJobs()` | Job search with filters |
| GET | `/matching/search/drivers` | (existing search) | Driver search (proxy) |
| POST | `/matching/detect-mutual` | `detectMutualMatch()` | Check bilateral interest |
| GET | `/matching/model-info` | (new) | Active model version + metrics |

### cockpit.js (11 endpoints) — replaces driverCockpitService.jsw

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| GET | `/cockpit/:id/dashboard` | `getDashboardSummary()` | Match count, apps, saved, recent |
| POST | `/cockpit/jobs/search` | `searchJobs()` | Search jobs with filters |
| GET | `/cockpit/jobs/:jobId` | `getJobDetails()` | Job detail + applied/saved flags |
| POST | `/cockpit/:id/apply/:jobId` | `submitApplication()` | Submit application |
| POST | `/cockpit/:id/withdraw/:appId` | `withdrawApplication()` | Withdraw application |
| GET | `/cockpit/:id/applications` | `getApplicationHistory()` | Application list with filters |
| GET | `/cockpit/:id/applications/:appId` | `getApplicationStatus()` | Single application status |
| POST | `/cockpit/:id/save-job/:jobId` | `saveJob()` | Save job |
| GET | `/cockpit/:id/saved-jobs` | `getSavedJobs()` | Saved jobs list |
| GET | `/cockpit/:id/notifications` | `getDriverNotifications()` | Notification queue |
| POST | `/cockpit/:id/quick-reply` | `sendQuickResponse()` | Template message reply |

### gamification.js (10 endpoints) — replaces gamificationService.jsw + achievementService.jsw + streakService.jsw

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| GET | `/gamification/:id/progression` | `getDriverProgression()` | XP, level, streak, multiplier |
| POST | `/gamification/:id/xp` | `awardDriverXP()` | Award XP for action |
| GET | `/gamification/:id/streak` | `getStreakStatus()` | Streak days, freeze, milestones |
| POST | `/gamification/:id/login` | `recordDailyLogin()` | Record daily login + streak |
| POST | `/gamification/:id/freeze` | `useStreakFreeze()` | Use monthly streak freeze |
| GET | `/gamification/:id/achievements` | `getAchievements()` | All achievements + progress |
| GET | `/gamification/:id/achievements/:aid` | `getAchievementProgress()` | Single achievement detail |
| POST | `/gamification/:id/check-achievements` | `checkProfileAchievements()` | Auto-check + award |
| GET | `/gamification/definitions` | `getAchievementDefinitions()` | All achievement metadata |
| GET | `/gamification/leaderboard` | (new) | Top drivers by XP |

### lifecycle.js (5 endpoints) — replaces driverLifecycleService.jsw + driverInsightsService.jsw

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| GET | `/lifecycle/:id/timeline` | `getDriverTimeline()` | Status change history |
| PUT | `/lifecycle/:id/disposition` | `updateDisposition()` | Set actively_looking/hired/etc. |
| POST | `/lifecycle/:id/feedback` | `submitMatchFeedback()` | Match feedback |
| GET | `/lifecycle/:id/insights` | `getWhoViewedMe()` | Profile view insights |
| GET | `/lifecycle/:id/stats` | `getDriverStats()` | View/app/match counts |

### community.js (12 endpoints) — replaces forumService.jsw + carrierAnnouncementsService.jsw + surveyService.jsw

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| GET | `/community/forums` | `getCategories()` | Forum categories |
| GET | `/community/forums/:slug` | `getCategoryBySlug()` | Category + threads |
| GET | `/community/threads/:slug` | `getThreadBySlug()` | Thread + posts |
| POST | `/community/threads` | `createThread()` | New thread |
| POST | `/community/posts` | `createPost()` | Reply to thread |
| POST | `/community/posts/:id/like` | `likePost()` | Like a post |
| GET | `/community/announcements` | `getAnnouncementsForDriver()` | Carrier broadcasts |
| POST | `/community/announcements/:id/read` | `markAnnouncementRead()` | Mark read |
| POST | `/community/announcements/:id/comment` | `addComment()` | Comment |
| GET | `/community/surveys` | `getPendingSurveys()` | Pending surveys |
| POST | `/community/surveys/:id/respond` | `submitSurveyResponse()` | Submit response |
| GET | `/community/unread-count` | `getUnreadForumCount()` | Badge count |

### wellness.js (10 endpoints) — replaces healthService.jsw + petFriendlyService.jsw + mentorService.jsw

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| GET | `/wellness/health` | `getResourcesByCategory()` | Health resources |
| GET | `/wellness/health/featured` | `getFeaturedResources()` | Featured health content |
| POST | `/wellness/health/tips` | `submitTip()` | Community health tip |
| GET | `/wellness/pets/search` | `searchLocations()` | Pet-friendly stops |
| GET | `/wellness/pets/nearby` | `getNearbyLocations()` | Proximity search |
| POST | `/wellness/pets/locations` | `submitLocation()` | Submit new location |
| POST | `/wellness/pets/reviews` | `submitReview()` | Review a location |
| GET | `/wellness/mentors` | `searchMentors()` | Browse mentors |
| POST | `/wellness/mentors/request` | `requestMentor()` | Request mentorship |
| GET | `/wellness/mentors/my-profile` | `getMyMentorProfile()` | My mentor status |

### documents.js (5 endpoints) — replaces document functions from driverProfiles.jsw

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| GET | `/documents/:driverId` | `getDocuments()` | Document list + status |
| POST | `/documents/:driverId` | `uploadDocument()` | Upload document |
| PUT | `/documents/:driverId/:docId/status` | `updateDocumentStatus()` | Update doc status |
| GET | `/documents/:driverId/completeness` | `checkDocumentCompleteness()` | Completeness check |
| POST | `/documents/:driverId/ocr` | (new) | OCR extraction for CDL |

### financial.js (5 endpoints) — replaces driverFinancialService.jsw

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| POST | `/financial/:id/expenses` | `logExpense()` | Log expense |
| GET | `/financial/:id/expenses` | `getExpenses()` | Expense list |
| GET | `/financial/:id/expense-summary` | `getExpenseSummary()` | Period summary |
| GET | `/financial/:id/pay-projection` | `getPayProjection()` | Earnings estimate |
| GET | `/financial/:id/carrier-compare` | `compareCarriers()` | Pay comparison |

### scorecard.js (4 endpoints) — replaces driverScorecardService.jsw

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| GET | `/scorecard/:id` | `getDriverScorecard()` | Performance scorecard |
| GET | `/scorecard/:id/rankings` | `getPerformanceRankings()` | Rank in fleet |
| GET | `/scorecard/fleet/:carrierDot` | `getFleetScoreboardSummary()` | Fleet-wide summary |
| GET | `/scorecard/:id/trend` | (new) | Score over time |

### retention.js (4 endpoints) — replaces retentionService.jsw

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| GET | `/retention/:id/risk` | `calculateRiskScore()` | Risk assessment |
| GET | `/retention/:id/interventions` | `getInterventionSuggestions()` | Suggested actions |
| GET | `/retention/dashboard/:carrierDot` | `getCarrierRetentionDashboard()` | Carrier-wide retention |
| GET | `/retention/:id/predicted-score` | `getPredictedRetentionScore()` | ML retention prediction |

### index.js (barrel + manifest)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/driver/manifest` | Returns ~30 endpoints as AI tool definitions |

---

## Engagement Logging Pipeline

### Layer 1 — Implicit (middleware in index.js)

Every request to `/v1/driver/*` auto-logs to BigQuery `driver_engagement_events`:

```javascript
router.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    insertEngagementEvent({
      driver_id: req.auth?.driverId || req.params?.id || 'anonymous',
      endpoint: req.originalUrl,
      method: req.method,
      status_code: res.statusCode,
      response_ms: Date.now() - start,
      session_id: req.headers['x-session-id'] || null,
    });
  });
  next();
});
```

### Layer 2 — Explicit (10 high-value events)

| Event | Route File | Fields |
|-------|-----------|--------|
| `match_viewed` | matching.js | driver_id, carrier_dot, match_score, position_in_list |
| `match_explanation_viewed` | matching.js | driver_id, carrier_dot, overall_score |
| `application_submitted` | cockpit.js | driver_id, carrier_dot, job_id |
| `application_withdrawn` | cockpit.js | driver_id, app_id, reason |
| `job_saved` | cockpit.js | driver_id, job_id |
| `profile_updated` | profile.js | driver_id, fields_changed[] |
| `document_uploaded` | documents.js | driver_id, doc_type |
| `daily_login` | gamification.js | driver_id, streak_days, platform |
| `forum_post_created` | community.js | driver_id, thread_id, is_first_post |
| `survey_completed` | community.js | driver_id, survey_type, xp_earned |

All events stream to BigQuery — becomes training data for the weekly ML pipeline.

---

## Scoring Module (lib/driver-scoring.js)

Pure function — weights come from `matching_model_weights` table, not hardcoded:

```javascript
export function scoreMatch(driver, carrier, weights) {
  const factors = {
    location: computeLocationScore(driver, carrier),
    pay: computePayScore(driver, carrier),
    safety: computeSafetyScore(carrier),
    culture: computeCultureScore(driver, carrier),
    routeType: computeRouteScore(driver, carrier),
    fleetAge: computeFleetAgeScore(carrier),
  };

  let total = 0;
  for (const [key, value] of Object.entries(factors)) {
    total += value * (weights[key] || 0);
  }

  return { score: Math.round(total * 100), factors };
}
```

### Weights Table Schema

```sql
CREATE TABLE matching_model_weights (
  _id TEXT PRIMARY KEY,
  model_version TEXT,
  weights JSONB,
  feature_set TEXT[],
  training_metrics JSONB,
  is_active BOOLEAN DEFAULT false,
  promoted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Initial seed: `{ location: 0.25, pay: 0.22, safety: 0.20, culture: 0.15, routeType: 0.10, fleetAge: 0.08 }`

### Future ML Pipeline (Vertex AI)

```
Cloud Scheduler (weekly)
  → Vertex AI Pipeline
  → reads from BigQuery: match_outcomes + driver_engagement_events
  → trains model (AutoML tabular regression)
  → outputs new weight vector
  → writes to matching_model_weights (is_active = false)
  → admin promotes via /v1/admin/config → is_active = true
```

Training features (from engagement events):
- Match shown → application rate (conversion)
- Application → interview rate
- Interview → hire rate
- Hire → 30-day retention rate
- Platform engagement signals (dwell time, return visits, saved jobs)

---

## Next.js Integration (Server-Side BFF)

### API Client

`frontend/src/lib/driver-api.ts` — server-only client using `LMDR_INTERNAL_KEY`:

```typescript
'use server';

async function driverFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${CLOUD_RUN_URL}/v1/driver${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${INTERNAL_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new DriverApiError(res.status, await res.json());
  return res.json();
}
```

### Server Actions

```
frontend/src/app/(driver)/actions/
├── profile.ts       ← getProfile(), updateProfile(), getStrength()
├── matching.ts      ← findJobs(), getExplanation(), getWeights()
├── cockpit.ts       ← getDashboard(), searchJobs(), apply(), withdraw()
├── gamification.ts  ← getProgression(), recordLogin(), getAchievements()
├── lifecycle.ts     ← getTimeline(), updateDisposition()
├── community.ts     ← getForums(), createThread(), getSurveys()
├── wellness.ts      ← getHealth(), searchPets(), getMentors()
├── documents.ts     ← getDocuments(), upload(), updateStatus()
├── financial.ts     ← logExpense(), getExpenses(), getProjection()
├── scorecard.ts     ← getScorecard(), getRankings()
├── retention.ts     ← getRisk(), getInterventions()
└── index.ts         ← barrel export
```

---

## Error Handling

Consistent error format across all routes (same as admin):

```json
{
  "error": "DRIVER_NOT_FOUND",
  "message": "No driver with id drv_abc123",
  "status": 404
}
```

All query routes use `safeQuery()` to return empty results for missing tables.

---

## Collections Accessed (65+ Cloud SQL tables)

Key tables by route:

| Route | Primary Tables | Operations |
|-------|---------------|------------|
| profile | `driverProfiles`, `driverCarrierInterests`, `carrierDriverViews` | Q, I, U, D |
| matching | `driverProfiles`, `carriers`, `carrierEnrichments`, `carrierHiringPreferences`, `matching_model_weights` | Q |
| cockpit | `jobPostings`, `driverCarrierInterests`, `savedJobs`, `driverNotifications` | Q, I, U |
| gamification | `driverProgression`, `driverAchievements`, `gamificationEvents`, `seasonalEvents` | Q, I, U |
| lifecycle | `lifecycleEvents`, `driverProfiles`, `driverMatchFeedback` | Q, I, U |
| community | `forumCategories`, `forumThreads`, `forumPosts`, `carrierAnnouncements`, `driverSurveys` | Q, I, U |
| wellness | `healthResources`, `healthTips`, `petFriendlyLocations`, `petFriendlyReviews`, `mentorProfiles`, `mentorMatches` | Q, I |
| documents | `driverProfiles` (doc fields), `qualificationFiles` | Q, I, U |
| financial | `driverExpenses` | Q, I |
| scorecard | `driverScores`, `fleetDrivers` | Q |
| retention | `driverPerformance`, `retentionRiskLogs` | Q, I |

---

## Collections to Add to schema.js KNOWN_COLLECTIONS

```
matching_model_weights (NEW — not airtable_ prefix)
driverExpenses, driverSurveys, driverSurveyResponses,
driverMatchFeedback, driverConversations, driverNotifications,
driverActivityFeed, savedJobs, driverRecognitions,
driverQuickResponses
```

---

## Testing Strategy

One test file per route in `cloud-run-api/tests/routes/driver/`:

- Mock auth (`req.auth = { uid: 'test', type: 'firebase' }`) — no admin role required
- Mount only route under test
- Happy path + error cases
- Supertest for HTTP assertions
- Integration smoke: hit `/v1/driver/profile/demo-driver-001` + `/v1/driver/manifest` post-deploy

---

## GCP Platform Usage

| Service | Usage | Credits Impact |
|---------|-------|---------------|
| Cloud Run | Driver routes on `lmdr-api` | Compute hours |
| Cloud SQL | 65+ tables queried | Storage + connections |
| BigQuery | Engagement events + match outcomes | Streaming inserts + storage |
| Secret Manager | `LMDR_INTERNAL_KEY` | API calls |
| Cloud Monitoring | Alert policies cover new routes | Metric ingestion |
| Cloud Trace | Auto-traced via OTel sidecar | Trace storage |
| Vertex AI | Match explanations (Gemini) | Prediction API calls |
| Vertex AI Pipelines | Weekly weight optimization (future) | Training jobs |
| Cloud Storage | Model artifacts (future) | Storage |
| Cloud Scheduler | Weekly pipeline trigger (future) | Job invocations |
