# Implementation Plan: Feature Adoption Log

> **Last Updated**: 2026-01-20
> **Status**: Planning
> **Track**: `feature_adoption_log_20260120`

---

## 1. Overview & Goal

### What is the Feature Adoption Log?

The Feature Adoption Log is a comprehensive analytics system that tracks how users interact with platform features throughout their lifecycle. It provides real-time visibility into feature usage patterns, enabling data-driven decisions about which features to invest in, iterate on, or retire.

### The "Rapid Shipping" Feedback Loop

This system enables the "Rapid Shipping" methodology by providing actionable data:

```
Ship Feature → Track Adoption → Analyze Patterns → Decide: Scale or Retire → Ship Next
     ↑                                                                              ↓
     └──────────────────────────────────────────────────────────────────────────────┘
```

**Feature Lifecycle Categories:**
- **Scalable**: High adoption, strong engagement - invest more resources
- **Disposable**: Low adoption after sufficient exposure - candidate for retirement
- **Iterating**: Moderate adoption - needs improvement
- **New**: Recently launched - still gathering baseline data

### Success Criteria

| Metric | Target |
|--------|--------|
| Event logging latency | < 100ms |
| Dashboard data freshness | < 5 minutes for real-time, daily for aggregates |
| Feature health score accuracy | Correlate with actual business outcomes |
| Test coverage | 99% success rate on service functions |

---

## 2. Database Schema (4 Collections)

> [!IMPORTANT]
> This implementation requires **4 new Wix Collections**. User approval is required before proceeding.

### 2.1 FeatureAdoptionLogs (Primary Event Log)

The main event stream capturing all feature interactions.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `_id` | Text (auto) | Wix auto-generated ID | `"abc123..."` |
| `featureId` | Text | Unique feature identifier | `"carrier_search"`, `"interview_scheduler"` |
| `featureVersion` | Text | Version for A/B testing | `"v2.1"`, `"control"`, `"variant_a"` |
| `userId` | Text | Member ID or anonymous ID | `"member_xyz"` |
| `userRole` | Text | User type | `"driver"`, `"carrier"`, `"recruiter"` |
| `action` | Text | Interaction type (see Action Types) | `"view"`, `"complete"`, `"error"` |
| `timestamp` | Date | When event occurred | `2026-01-20T14:30:00Z` |
| `sessionId` | Text | Groups interactions in a session | `"sess_abc123"` |
| `deviceType` | Text | Device category | `"mobile"`, `"desktop"`, `"tablet"` |
| `referrer` | Text | Previous page/feature | `"/dashboard"`, `"email_campaign"` |
| `entryPoint` | Text | UI element that triggered entry | `"nav_menu"`, `"cta_button"`, `"search_result"` |
| `durationMs` | Number | Time spent on feature (ms) | `45000` (45 seconds) |
| `scrollDepth` | Number | How far user scrolled (0-100) | `75` (75% of content) |
| `interactionCount` | Number | Clicks/taps within feature | `5` |
| `outcome` | Text | Result of interaction | `"success"`, `"failure"`, `"partial"`, `"abandoned"` |
| `conversionValue` | Number | Business value if applicable | `249.00` (subscription signup) |
| `nextFeature` | Text | Where user went next | `"driver_profile"`, `"exit"` |
| `errorCode` | Text | If action='error' | `"SEARCH_TIMEOUT"`, `"VALIDATION_FAILED"` |
| `errorMessage` | Text | Human-readable error detail | `"Search timed out after 30s"` |
| `metadata` | Object | Flexible additional data | `{searchQuery: "OTR", resultsCount: 45}` |
| `_createdDate` | Date (auto) | Wix auto-created timestamp | |

**Action Types Enumeration:**

| Action | Description | When to Use |
|--------|-------------|-------------|
| `view` | Feature was displayed to user | Page/component renders |
| `click` | User clicked within feature | Button, link, or interactive element |
| `complete` | User finished primary task | Form submitted, process completed |
| `hover` | User hovered over element | Desktop tooltip triggers, interest signals |
| `scroll_to` | User scrolled to element | Lazy-loaded content reached |
| `time_spent` | Passive time tracking | User dwelled on feature (fired on exit) |
| `error` | Something went wrong | API failure, validation error |
| `abandon` | User left mid-process | Form abandoned, flow exited early |
| `share` | User shared feature/content | Social share, copy link |
| `repeat` | User returned to feature | Not first interaction this session |
| `first_use` | User's first ever use | Onboarding/discovery tracking |

---

### 2.2 FeatureRegistry (Feature Catalog)

Master list of all trackable features with lifecycle metadata.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `_id` | Text (auto) | Wix auto-generated ID | |
| `featureId` | Text | **Unique** identifier (indexed) | `"carrier_search"` |
| `displayName` | Text | Human-readable name | `"Carrier Search & Matching"` |
| `description` | Text | What the feature does | `"AI-powered search to find carriers matching driver preferences"` |
| `category` | Text | Feature category | `"matching"`, `"communication"`, `"analytics"`, `"onboarding"` |
| `launchDate` | Date | When feature was released | `2025-06-15` |
| `status` | Text | Lifecycle status | `"beta"`, `"active"`, `"deprecated"`, `"sunset"` |
| `expectedUsagePattern` | Text | How often feature should be used | `"daily"`, `"weekly"`, `"onboarding-only"`, `"event-driven"` |
| `targetRoles` | Array | Which user roles should use it | `["driver", "recruiter"]` |
| `owner` | Text | Team/person responsible | `"matching-team"`, `"john.doe"` |
| `successMetric` | Text | How to measure success | `"completion_rate > 40%"`, `"daily_active_users > 100"` |
| `retirementThreshold` | Number | Days without use before flagging | `30` |
| `relatedFeatures` | Array | Features often used together | `["driver_profile", "carrier_detail"]` |
| `documentationUrl` | Text | Link to feature docs | `"https://docs.lmdr.com/carrier-search"` |
| `_createdDate` | Date (auto) | | |
| `_updatedDate` | Date (auto) | | |

**Status Lifecycle:**

```
beta → active → deprecated → sunset
  ↑               ↓
  └───────────────┘ (can reactivate)
```

---

### 2.3 FeatureFunnels (Multi-Step Flow Definitions)

Defines conversion funnels for multi-step user journeys.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `_id` | Text (auto) | Wix auto-generated ID | |
| `funnelId` | Text | **Unique** funnel identifier | `"driver_application_flow"` |
| `displayName` | Text | Human-readable name | `"Driver Application Funnel"` |
| `description` | Text | What this funnel measures | `"Tracks drivers from search to application submission"` |
| `steps` | Array | Ordered step definitions | See below |
| `createdAt` | Date | When funnel was defined | |
| `updatedAt` | Date | Last modification | |
| `isActive` | Boolean | Whether to track this funnel | `true` |

**Steps Array Structure:**
```javascript
[
  {
    "order": 1,
    "featureId": "carrier_search",
    "action": "view",
    "displayName": "Search Carriers",
    "optional": false
  },
  {
    "order": 2,
    "featureId": "carrier_detail",
    "action": "view",
    "displayName": "View Carrier Details",
    "optional": false
  },
  {
    "order": 3,
    "featureId": "driver_application",
    "action": "complete",
    "displayName": "Submit Application",
    "optional": false
  }
]
```

---

### 2.4 FeatureMetricsDaily (Pre-Aggregated Rollups)

Daily aggregated metrics for fast dashboard queries. Populated by scheduled job.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `_id` | Text (auto) | Wix auto-generated ID | |
| `featureId` | Text | Feature identifier | `"carrier_search"` |
| `date` | Date | Aggregation date (midnight UTC) | `2026-01-20T00:00:00Z` |
| `uniqueUsers` | Number | Distinct users | `1247` |
| `totalInteractions` | Number | Total events logged | `8934` |
| `completionRate` | Number | % of views that completed (0-100) | `42.5` |
| `avgDurationMs` | Number | Average time spent | `34500` |
| `errorRate` | Number | % of interactions with errors (0-100) | `2.3` |
| `abandonRate` | Number | % of views abandoned (0-100) | `15.7` |
| `byRole` | Object | Breakdown by user role | See below |
| `byDevice` | Object | Breakdown by device type | See below |
| `byEntryPoint` | Object | Breakdown by entry point | See below |
| `topErrors` | Array | Most common errors | `[{code: "TIMEOUT", count: 45}]` |
| `conversionValueTotal` | Number | Sum of conversion values | `12450.00` |
| `_createdDate` | Date (auto) | | |

**byRole Structure:**
```javascript
{
  "driver": { "users": 890, "interactions": 5200, "completionRate": 45.2 },
  "recruiter": { "users": 234, "interactions": 2800, "completionRate": 38.1 },
  "carrier": { "users": 123, "interactions": 934, "completionRate": 51.0 }
}
```

**byDevice Structure:**
```javascript
{
  "mobile": { "users": 678, "interactions": 4500 },
  "desktop": { "users": 534, "interactions": 4200 },
  "tablet": { "users": 35, "interactions": 234 }
}
```

---

## 3. Backend Service API

### File: `src/backend/featureAdoptionService.jsw`

This web module provides all backend functionality for the Feature Adoption Log system.

---

### 3.1 Core Logging Functions

#### `logFeatureInteraction(featureId, userId, action, context)`

Records any user interaction with a feature.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `featureId` | String | Yes | Feature identifier from FeatureRegistry |
| `userId` | String | Yes | Member ID or anonymous session ID |
| `action` | String | Yes | One of the Action Types enumeration |
| `context` | Object | No | Additional context data |

**Context Object:**
```javascript
{
  userRole: 'driver',           // Required if not inferable
  featureVersion: 'v2.1',       // Optional, for A/B tests
  sessionId: 'sess_abc123',     // Required for session tracking
  deviceType: 'mobile',         // Auto-detected if not provided
  referrer: '/dashboard',       // Previous page
  entryPoint: 'nav_menu',       // UI element that triggered
  durationMs: 45000,            // Time spent (for time_spent action)
  scrollDepth: 75,              // Scroll percentage
  interactionCount: 5,          // Clicks within feature
  outcome: 'success',           // Result of interaction
  conversionValue: 249.00,      // Business value
  nextFeature: 'driver_profile', // Where user went next
  metadata: {}                  // Any additional data
}
```

**Returns:**
```javascript
{
  success: true,
  logId: 'abc123...',
  timestamp: '2026-01-20T14:30:00Z'
}
```

---

#### `logFeatureError(featureId, userId, errorCode, errorMessage, context)`

Records an error event for a feature.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `featureId` | String | Yes | Feature identifier |
| `userId` | String | Yes | Member ID or anonymous session ID |
| `errorCode` | String | Yes | Machine-readable error code |
| `errorMessage` | String | Yes | Human-readable error detail |
| `context` | Object | No | Same as logFeatureInteraction |

**Returns:**
```javascript
{
  success: true,
  logId: 'abc123...',
  errorLogged: true
}
```

---

#### `logFeatureSession(sessionId, userId, features)`

Records a session summary with all features used.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `sessionId` | String | Yes | Session identifier |
| `userId` | String | Yes | Member ID |
| `features` | Array | Yes | Array of feature interaction summaries |

**Features Array:**
```javascript
[
  {
    featureId: 'carrier_search',
    actions: ['view', 'click', 'complete'],
    durationMs: 45000,
    interactionCount: 8
  },
  {
    featureId: 'driver_profile',
    actions: ['view'],
    durationMs: 12000,
    interactionCount: 2
  }
]
```

**Returns:**
```javascript
{
  success: true,
  sessionRecorded: true,
  featuresLogged: 2
}
```

---

### 3.2 Analytics Functions

#### `getFeatureStats(featureId, timeRange, groupBy)`

Retrieves aggregated statistics for a single feature.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `featureId` | String | Yes | Feature identifier |
| `timeRange` | Object | Yes | `{ start: Date, end: Date }` |
| `groupBy` | String | No | `'day'`, `'week'`, `'month'`, `'role'`, `'device'` |

**Returns:**
```javascript
{
  featureId: 'carrier_search',
  timeRange: { start: '2026-01-13', end: '2026-01-20' },
  summary: {
    uniqueUsers: 4521,
    totalInteractions: 28934,
    completionRate: 42.5,
    avgDurationMs: 34500,
    errorRate: 2.3,
    abandonRate: 15.7
  },
  breakdown: [
    { date: '2026-01-13', uniqueUsers: 612, totalInteractions: 3920, ... },
    { date: '2026-01-14', uniqueUsers: 658, totalInteractions: 4102, ... },
    // ... more days
  ]
}
```

---

#### `getFeatureComparison(featureIds, metric, timeRange)`

Compares multiple features on a single metric.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `featureIds` | Array | Yes | Array of feature identifiers |
| `metric` | String | Yes | `'uniqueUsers'`, `'completionRate'`, `'errorRate'`, `'avgDurationMs'` |
| `timeRange` | Object | Yes | `{ start: Date, end: Date }` |

**Returns:**
```javascript
{
  metric: 'completionRate',
  timeRange: { start: '2026-01-13', end: '2026-01-20' },
  features: [
    { featureId: 'carrier_search', value: 42.5, trend: '+3.2%' },
    { featureId: 'driver_application', value: 38.1, trend: '-1.5%' },
    { featureId: 'interview_scheduler', value: 67.8, trend: '+5.1%' }
  ]
}
```

---

#### `getFunnelConversion(funnelId, timeRange)`

Analyzes conversion rates through a defined funnel.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `funnelId` | String | Yes | Funnel identifier from FeatureFunnels |
| `timeRange` | Object | Yes | `{ start: Date, end: Date }` |

**Returns:**
```javascript
{
  funnelId: 'driver_application_flow',
  displayName: 'Driver Application Funnel',
  timeRange: { start: '2026-01-13', end: '2026-01-20' },
  totalEntered: 4521,
  totalCompleted: 892,
  overallConversionRate: 19.7,
  steps: [
    {
      order: 1,
      featureId: 'carrier_search',
      displayName: 'Search Carriers',
      entered: 4521,
      completed: 3890,
      conversionRate: 86.0,
      avgTimeToNextMs: 45000
    },
    {
      order: 2,
      featureId: 'carrier_detail',
      displayName: 'View Carrier Details',
      entered: 3890,
      completed: 2145,
      conversionRate: 55.1,
      avgTimeToNextMs: 120000
    },
    {
      order: 3,
      featureId: 'driver_application',
      displayName: 'Submit Application',
      entered: 2145,
      completed: 892,
      conversionRate: 41.6,
      avgTimeToNextMs: null
    }
  ],
  dropoffAnalysis: {
    biggestDropoff: { step: 2, lostUsers: 1745, reason: 'carrier_detail_to_application' }
  }
}
```

---

#### `getCohortRetention(featureId, cohortDate, periods)`

Analyzes retention for users who first used a feature on a specific date.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `featureId` | String | Yes | Feature identifier |
| `cohortDate` | Date | Yes | Date to define the cohort (users who first used on this date) |
| `periods` | Number | Yes | Number of periods (days/weeks) to track |

**Returns:**
```javascript
{
  featureId: 'carrier_search',
  cohortDate: '2026-01-01',
  cohortSize: 245,
  retention: [
    { period: 0, retained: 245, rate: 100.0 },  // Day 0
    { period: 1, retained: 178, rate: 72.7 },   // Day 1
    { period: 7, retained: 134, rate: 54.7 },   // Day 7
    { period: 14, retained: 98, rate: 40.0 },   // Day 14
    { period: 30, retained: 67, rate: 27.3 }    // Day 30
  ]
}
```

---

### 3.3 Lifecycle Functions

#### `getFeatureLifecycleReport()`

Returns lifecycle status for all registered features.

**Parameters:** None

**Returns:**
```javascript
{
  generatedAt: '2026-01-20T14:30:00Z',
  features: [
    {
      featureId: 'carrier_search',
      displayName: 'Carrier Search & Matching',
      status: 'active',
      category: 'matching',
      launchDate: '2025-06-15',
      daysSinceLaunch: 219,
      last7DaysUsers: 4521,
      last30DaysUsers: 15234,
      healthScore: 87,
      trend: 'growing',
      recommendation: 'scale'
    },
    {
      featureId: 'legacy_job_board',
      displayName: 'Legacy Job Board',
      status: 'deprecated',
      category: 'matching',
      launchDate: '2024-01-01',
      daysSinceLaunch: 750,
      last7DaysUsers: 23,
      last30DaysUsers: 89,
      healthScore: 12,
      trend: 'declining',
      recommendation: 'sunset'
    },
    // ... more features
  ],
  summary: {
    total: 24,
    byStatus: { beta: 3, active: 15, deprecated: 4, sunset: 2 },
    byHealth: { healthy: 12, warning: 7, critical: 5 }
  }
}
```

---

#### `getFeatureHealthScore(featureId)`

Calculates a composite health score (0-100) for a feature.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `featureId` | String | Yes | Feature identifier |

**Returns:**
```javascript
{
  featureId: 'carrier_search',
  healthScore: 87,
  breakdown: {
    adoptionRate: 92,      // Weight: 30% - % of target users using
    completionRate: 85,    // Weight: 25% - % completing primary action
    errorRate: 95,         // Weight: 20% - 100 - actual error rate
    retentionRate: 78,     // Weight: 15% - Users returning
    engagementDepth: 88    // Weight: 10% - Avg interactions per session
  },
  thresholds: {
    healthy: { min: 70, color: 'green' },
    warning: { min: 40, color: 'yellow' },
    critical: { min: 0, color: 'red' }
  },
  status: 'healthy',
  recommendation: 'Feature is performing well. Consider expanding target audience.'
}
```

---

#### `getAtRiskFeatures()`

Returns features that are below their retirement threshold or showing declining health.

**Parameters:** None

**Returns:**
```javascript
{
  generatedAt: '2026-01-20T14:30:00Z',
  atRiskFeatures: [
    {
      featureId: 'legacy_job_board',
      displayName: 'Legacy Job Board',
      healthScore: 12,
      riskLevel: 'critical',
      daysSinceSignificantUse: 45,
      retirementThreshold: 30,
      issues: [
        'No active users in past 7 days',
        'Error rate above 15%',
        'Replaced by carrier_search feature'
      ],
      recommendedAction: 'sunset',
      estimatedRemovalDate: '2026-02-15'
    },
    {
      featureId: 'interview_scheduler_v1',
      displayName: 'Interview Scheduler (Legacy)',
      healthScore: 38,
      riskLevel: 'warning',
      daysSinceSignificantUse: 12,
      retirementThreshold: 30,
      issues: [
        'Usage declining 15% week-over-week',
        'Most users migrated to v2'
      ],
      recommendedAction: 'deprecate',
      estimatedRemovalDate: null
    }
  ]
}
```

---

#### `aggregateDailyMetrics()`

Scheduled job that aggregates raw logs into daily metrics. Called by Wix Jobs Scheduler.

**Parameters:** None (uses yesterday's date by default)

**Returns:**
```javascript
{
  success: true,
  date: '2026-01-19',
  featuresProcessed: 24,
  recordsCreated: 24,
  processingTimeMs: 3450
}
```

---

### 3.4 Admin Functions

#### `registerFeature(featureData)`

Adds a new feature to the FeatureRegistry.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `featureData` | Object | Yes | Feature definition object |

**featureData Object:**
```javascript
{
  featureId: 'new_ai_chat',         // Required, unique
  displayName: 'AI Chat Assistant', // Required
  description: 'AI-powered chat for driver support',
  category: 'communication',        // Required
  status: 'beta',                   // Default: 'beta'
  expectedUsagePattern: 'daily',
  targetRoles: ['driver', 'recruiter'],
  owner: 'ai-team',
  successMetric: 'daily_active_users > 50',
  retirementThreshold: 30
}
```

**Returns:**
```javascript
{
  success: true,
  featureId: 'new_ai_chat',
  registryId: 'abc123...'
}
```

---

#### `updateFeatureStatus(featureId, status, reason)`

Changes a feature's lifecycle status.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `featureId` | String | Yes | Feature identifier |
| `status` | String | Yes | New status: `'beta'`, `'active'`, `'deprecated'`, `'sunset'` |
| `reason` | String | No | Explanation for status change |

**Returns:**
```javascript
{
  success: true,
  featureId: 'legacy_job_board',
  previousStatus: 'deprecated',
  newStatus: 'sunset',
  updatedAt: '2026-01-20T14:30:00Z'
}
```

---

#### `defineFunnel(funnelData)`

Creates or updates a conversion funnel definition.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `funnelData` | Object | Yes | Funnel definition object |

**funnelData Object:**
```javascript
{
  funnelId: 'recruiter_onboarding',  // Required, unique
  displayName: 'Recruiter Onboarding Flow',
  description: 'Tracks recruiters from signup to first driver contact',
  steps: [
    { order: 1, featureId: 'recruiter_signup', action: 'complete', displayName: 'Create Account', optional: false },
    { order: 2, featureId: 'company_profile', action: 'complete', displayName: 'Complete Company Profile', optional: false },
    { order: 3, featureId: 'driver_search', action: 'view', displayName: 'Search Drivers', optional: false },
    { order: 4, featureId: 'driver_outreach', action: 'complete', displayName: 'Contact First Driver', optional: false }
  ],
  isActive: true
}
```

**Returns:**
```javascript
{
  success: true,
  funnelId: 'recruiter_onboarding',
  stepsCount: 4,
  isNew: true
}
```

---

## 4. Frontend Components

### 4.1 Admin Dashboard Addition

**File:** `src/public/admin/ADMIN_DASHBOARD.html`

Add a new "Feature Adoption" card/section to the existing admin dashboard.

#### Required Visualizations:

**1. Feature Health Overview**
- Grid of feature cards showing health scores (color-coded)
- Quick status indicators (beta/active/deprecated/sunset)
- Click to drill down into feature details

**2. Top/Bottom Features Table**
| Rank | Feature | Users (7d) | Completion Rate | Health | Trend |
|------|---------|------------|-----------------|--------|-------|
| 1 | Carrier Search | 4,521 | 42.5% | 87 | +3.2% |
| 2 | Driver Application | 3,102 | 38.1% | 72 | -1.5% |
| ... | ... | ... | ... | ... | ... |

**3. Lifecycle Status Distribution**
- Pie/donut chart showing features by status
- Click to filter feature list

**4. At-Risk Features Alert**
- Prominent warning section for features below threshold
- Action buttons: "Investigate", "Deprecate", "Sunset"

**5. Funnel Visualization**
- Dropdown to select funnel
- Visual funnel diagram showing drop-off at each step
- Conversion rate percentages

#### PostMessage API:

```javascript
// Dashboard sends to Wix:
{ type: 'getFeatureLifecycleReport' }
{ type: 'getFeatureStats', data: { featureId, timeRange, groupBy } }
{ type: 'getAtRiskFeatures' }
{ type: 'getFunnelConversion', data: { funnelId, timeRange } }
{ type: 'updateFeatureStatus', data: { featureId, status, reason } }

// Wix responds:
{ type: 'featureLifecycleReportResult', data: { ... } }
{ type: 'featureStatsResult', data: { ... } }
// etc.
```

---

### 4.2 Client-Side Tracker Library

**File:** `src/public/js/feature-tracker.js`

A lightweight library for easy feature instrumentation across the platform.

#### Core API:

```javascript
// Initialize tracker (call once on page load)
FeatureTracker.init({
  userId: 'member_xyz',           // From Wix member data
  userRole: 'driver',             // From member data
  sessionId: 'auto',              // 'auto' generates unique session ID
  deviceType: 'auto',             // 'auto' detects from user agent
  debug: false                    // Set true for console logging
});

// Track a feature view
FeatureTracker.view('carrier_search', {
  entryPoint: 'nav_menu',
  referrer: '/dashboard'
});

// Track a click/interaction
FeatureTracker.click('carrier_search', {
  element: 'filter_button',
  metadata: { filterType: 'location' }
});

// Track feature completion
FeatureTracker.complete('carrier_search', {
  outcome: 'success',
  conversionValue: null,
  metadata: { resultsCount: 45 }
});

// Track an error
FeatureTracker.error('carrier_search', 'SEARCH_TIMEOUT', 'Search timed out after 30s');

// Track abandonment (call when user navigates away mid-process)
FeatureTracker.abandon('driver_application', {
  step: 3,
  totalSteps: 5,
  metadata: { lastFieldCompleted: 'cdlClass' }
});

// Track time spent (auto-fires on page unload if startTimer was called)
FeatureTracker.startTimer('carrier_detail');
// ... later, automatically tracked on navigation/unload
FeatureTracker.stopTimer('carrier_detail'); // Or call manually
```

#### Auto-Instrumentation Wrapper:

```javascript
// Wrap a function to auto-track view/complete/error
const instrumentedSearch = FeatureTracker.instrument('carrier_search', async (params) => {
  // Your existing search logic
  const results = await searchCarriers(params);
  return results;
}, {
  trackView: true,
  trackComplete: true,
  trackErrors: true
});

// Usage - tracking happens automatically
const results = await instrumentedSearch({ location: 'Texas' });
```

#### Session Management:

```javascript
// Get current session ID (useful for debugging)
const sessionId = FeatureTracker.getSessionId();

// End session explicitly (e.g., on logout)
FeatureTracker.endSession();

// Start new session
FeatureTracker.startNewSession();
```

#### Device Detection:

```javascript
// Auto-detected, but can be overridden
FeatureTracker.setDeviceType('tablet');

// Get detected device
const device = FeatureTracker.getDeviceType(); // 'mobile', 'desktop', 'tablet'
```

---

## 5. Implementation Phases

### Phase 1: Core Schema + Basic Logging (Week 1)

**Collections:**
- [x] Create `FeatureAdoptionLogs` collection with all fields
- [x] Create `FeatureRegistry` collection with all fields

**Backend:**
- [x] Implement `logFeatureInteraction()` function
- [x] Implement `logFeatureError()` function
- [x] Implement `registerFeature()` function
- [x] Implement `updateFeatureStatus()` function

**Frontend:**
- [ ] Create basic `feature-tracker.js` with `init()`, `view()`, `click()`, `complete()`, `error()`

**Verification:**
- [ ] Can log events from frontend to FeatureAdoptionLogs
- [ ] Can register features in FeatureRegistry
- [ ] Events appear in collection with correct data

---

### Phase 2: Session & Context Tracking (Week 2)

**Backend:**
- [ ] Implement `logFeatureSession()` function
- [ ] Add session grouping to analytics queries

**Frontend:**
- [ ] Add session management to `feature-tracker.js`
- [ ] Implement `startTimer()`, `stopTimer()`, `abandon()`
- [ ] Add device detection auto-population
- [ ] Add referrer tracking

**Verification:**
- [ ] Sessions are correctly grouped in logs
- [ ] Time spent is accurately tracked
- [ ] Device type is auto-detected

---

### Phase 3: Funnel Tracking (Week 3)

**Collections:**
- [ ] Create `FeatureFunnels` collection with all fields

**Backend:**
- [ ] Implement `defineFunnel()` function
- [ ] Implement `getFunnelConversion()` function

**Frontend:**
- [ ] Add funnel visualization to admin dashboard
- [ ] Implement funnel dropdown and step visualization

**Verification:**
- [ ] Funnels can be defined and saved
- [ ] Funnel conversion rates calculate correctly
- [ ] Drop-off analysis identifies biggest losses

---

### Phase 4: Daily Aggregation (Week 4)

**Collections:**
- [ ] Create `FeatureMetricsDaily` collection with all fields

**Backend:**
- [ ] Implement `aggregateDailyMetrics()` scheduled job
- [ ] Implement `getFeatureStats()` with daily rollup queries
- [ ] Implement `getFeatureComparison()` function
- [ ] Implement `getCohortRetention()` function

**Jobs Config:**
- [ ] Add `aggregateDailyMetrics` to `jobs.config` (run at 1:00 AM UTC)

**Verification:**
- [ ] Daily metrics aggregate correctly from raw logs
- [ ] Stats queries return fast from pre-aggregated data
- [ ] Retention curves calculate correctly

---

### Phase 5: Health Scores & At-Risk Detection (Week 5)

**Backend:**
- [x] Implement `getFeatureHealthScore()` function
- [x] Implement `getFeatureLifecycleReport()` function
- [x] Implement `getAtRiskFeatures()` function

**Frontend:**
- [ ] Add health score visualization to admin dashboard
- [ ] Add at-risk features alert section
- [ ] Add lifecycle status distribution chart
- [ ] Implement status update actions (deprecate, sunset)

**Verification:**
- [ ] Health scores correlate with actual feature performance
- [ ] At-risk features are correctly identified
- [ ] Status changes are logged and effective

---

## 6. Test Requirements

The Test Agent will implement these tests in `src/public/__tests__/featureAdoptionService.test.js`.

### Unit Tests (Per Function)

| Function | Test Cases |
|----------|------------|
| `logFeatureInteraction` | Valid input, missing required fields, invalid action type, metadata persistence |
| `logFeatureError` | Error recording, error code validation, stack trace handling |
| `logFeatureSession` | Session grouping, multi-feature sessions, empty sessions |
| `getFeatureStats` | Time range filtering, groupBy options, empty results |
| `getFeatureComparison` | Multiple features, missing features, trend calculation |
| `getFunnelConversion` | Step ordering, drop-off calculation, partial completion |
| `getCohortRetention` | Cohort definition, period calculation, edge cases |
| `getFeatureLifecycleReport` | All statuses included, sorting, health score inclusion |
| `getFeatureHealthScore` | Score calculation, breakdown accuracy, threshold classification |
| `getAtRiskFeatures` | Threshold detection, risk level assignment, recommendation accuracy |
| `aggregateDailyMetrics` | Correct aggregation, idempotency, missing data handling |
| `registerFeature` | Unique ID enforcement, required field validation, defaults |
| `updateFeatureStatus` | Valid transitions, invalid transitions, audit logging |
| `defineFunnel` | Step ordering, unique ID enforcement, activation |

### Integration Tests

| Scenario | Description |
|----------|-------------|
| End-to-end logging flow | Frontend tracker -> Backend -> Collection -> Query |
| Dashboard data flow | PostMessage -> Backend -> Response -> Visualization |
| Aggregation pipeline | Raw logs -> Daily job -> Aggregated metrics -> Fast query |
| Funnel tracking | Multi-step user journey -> Funnel analysis -> Accurate conversion |

### Performance Tests

| Test | Target |
|------|--------|
| Log write latency | < 100ms |
| Stats query (7 days, single feature) | < 500ms |
| Lifecycle report (all features) | < 2s |
| Daily aggregation (10k logs) | < 30s |

### Success Criteria

- **99% test pass rate** required before deployment
- All edge cases covered
- No silent failures (all errors properly surfaced)

---

## 7. Usage Examples

### 7.1 Instrumenting Driver Search

**File:** `src/public/driver/AI_MATCHING.html` (or page code)

```javascript
// On page load
FeatureTracker.init({
  userId: memberData._id,
  userRole: 'driver',
  sessionId: 'auto',
  deviceType: 'auto'
});

// When search page loads
FeatureTracker.view('driver_carrier_search', {
  entryPoint: $w('#searchSource').value, // 'nav', 'dashboard_cta', etc.
  referrer: previousPage
});

// When user applies filters
$w('#filterButton').onClick(() => {
  FeatureTracker.click('driver_carrier_search', {
    element: 'filter_apply',
    metadata: {
      filters: {
        location: $w('#locationFilter').value,
        payMin: $w('#payFilter').value,
        operationType: $w('#opTypeFilter').value
      }
    }
  });
});

// When search completes
async function performSearch() {
  const startTime = Date.now();
  try {
    const results = await searchCarriers(filters);

    FeatureTracker.complete('driver_carrier_search', {
      outcome: results.length > 0 ? 'success' : 'partial',
      metadata: {
        resultsCount: results.length,
        searchTimeMs: Date.now() - startTime,
        filters: filters
      }
    });

    return results;
  } catch (error) {
    FeatureTracker.error('driver_carrier_search', 'SEARCH_ERROR', error.message);
    throw error;
  }
}

// Track which result they click
$w('#searchResults').onClick((event) => {
  const carrierId = event.target.dataset.carrierId;
  FeatureTracker.click('driver_carrier_search', {
    element: 'result_card',
    metadata: { carrierId, resultPosition: event.target.dataset.position },
    nextFeature: 'carrier_detail'
  });
});
```

---

### 7.2 Instrumenting Application Form

**File:** `src/public/driver/DRIVER_APPLICATION.html` (or page code)

```javascript
// Track form start
FeatureTracker.view('driver_application', {
  entryPoint: 'carrier_detail_apply_button',
  metadata: { carrierId: carrierData._id }
});

// Start timing
FeatureTracker.startTimer('driver_application');

// Track step completion in multi-step form
function onStepComplete(stepNumber, stepName) {
  FeatureTracker.click('driver_application', {
    element: `step_${stepNumber}_complete`,
    metadata: {
      stepNumber,
      stepName,
      totalSteps: 5
    }
  });
}

// Track form abandonment (call on navigation away)
window.addEventListener('beforeunload', () => {
  if (!formSubmitted) {
    FeatureTracker.abandon('driver_application', {
      metadata: {
        currentStep: currentStepNumber,
        totalSteps: 5,
        lastFieldCompleted: lastCompletedField,
        timeSpentMs: FeatureTracker.stopTimer('driver_application')
      }
    });
  }
});

// Track successful submission
async function submitApplication() {
  try {
    const result = await applicationService.submitApplication(formData);

    FeatureTracker.complete('driver_application', {
      outcome: 'success',
      conversionValue: 1, // Application submitted
      metadata: {
        carrierId: carrierData._id,
        applicationId: result.applicationId,
        timeToCompleteMs: FeatureTracker.stopTimer('driver_application')
      }
    });

    formSubmitted = true;
    return result;
  } catch (error) {
    FeatureTracker.error('driver_application', 'SUBMISSION_ERROR', error.message);
    throw error;
  }
}
```

---

### 7.3 Instrumenting Recruiter Pipeline

**File:** `src/public/recruiter/RecruiterPipeline.html` (or page code)

```javascript
// Track pipeline view
FeatureTracker.view('recruiter_pipeline', {
  entryPoint: 'nav_menu',
  metadata: {
    totalCandidates: pipelineData.length,
    stages: Object.keys(stages)
  }
});

// Track drag-drop actions
function onCandidateMove(candidateId, fromStage, toStage) {
  FeatureTracker.click('recruiter_pipeline', {
    element: 'candidate_move',
    metadata: {
      candidateId,
      fromStage,
      toStage,
      isProgression: stageOrder[toStage] > stageOrder[fromStage]
    }
  });
}

// Track candidate card expansion
function onCandidateExpand(candidateId) {
  FeatureTracker.click('recruiter_pipeline', {
    element: 'candidate_expand',
    metadata: { candidateId },
    nextFeature: 'driver_profile_preview'
  });
}

// Track bulk actions
function onBulkAction(action, candidateIds) {
  FeatureTracker.click('recruiter_pipeline', {
    element: 'bulk_action',
    metadata: {
      action, // 'email', 'move_stage', 'archive'
      candidateCount: candidateIds.length
    }
  });
}

// Track pipeline filtering
function onFilterChange(filters) {
  FeatureTracker.click('recruiter_pipeline', {
    element: 'filter_change',
    metadata: { filters }
  });
}
```

---

## 8. Verification Checklist

### Database Collections
- [ ] `FeatureAdoptionLogs` collection created with all 19 fields
- [ ] `FeatureRegistry` collection created with all 13 fields
- [ ] `FeatureFunnels` collection created with all 7 fields
- [ ] `FeatureMetricsDaily` collection created with all 13 fields
- [ ] All collections accessible via `wixData` API
- [ ] Proper indexes on `featureId`, `timestamp`, `sessionId`

### Backend Service
- [ ] `featureAdoptionService.jsw` created and functional
- [ ] All 14 functions implemented and tested
- [ ] Error handling covers all edge cases
- [ ] Permissions configured in `permissions.json`

### Frontend Components
- [ ] `feature-tracker.js` created with full API
- [ ] Admin dashboard "Feature Adoption" section added
- [ ] PostMessage communication working bidirectionally
- [ ] Visualizations rendering correctly

### Scheduled Jobs
- [ ] `aggregateDailyMetrics` added to `jobs.config`
- [ ] Job runs successfully at scheduled time
- [ ] Aggregated data matches raw log totals

### Integration Tests
- [ ] End-to-end logging flow works
- [ ] Dashboard displays real data
- [ ] Funnel analysis calculates correctly
- [ ] Health scores update appropriately

### Documentation
- [ ] All functions documented with parameters and return types
- [ ] Usage examples provided for key features
- [ ] Error codes documented

---

## Appendix: Error Codes Reference

| Code | Description | Resolution |
|------|-------------|------------|
| `FAL_001` | Feature not found in registry | Register feature before logging |
| `FAL_002` | Invalid action type | Use enumerated action types |
| `FAL_003` | Missing required field | Check required parameters |
| `FAL_004` | Session ID not initialized | Call `FeatureTracker.init()` first |
| `FAL_005` | Funnel not found | Check funnelId exists |
| `FAL_006` | Invalid time range | Ensure start < end |
| `FAL_007` | Aggregation failed | Check raw logs exist for date |
| `FAL_008` | Status transition invalid | Check allowed transitions |

---

## Appendix: Collection Indexes

For optimal query performance, create these indexes:

**FeatureAdoptionLogs:**
- `featureId` + `timestamp` (compound)
- `sessionId`
- `userId` + `timestamp` (compound)

**FeatureMetricsDaily:**
- `featureId` + `date` (compound, unique)

**FeatureRegistry:**
- `featureId` (unique)
- `status`

**FeatureFunnels:**
- `funnelId` (unique)
