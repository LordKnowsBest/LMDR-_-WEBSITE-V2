# Feature Adoption Log - Schema Reference

> **Generated**: 2026-01-21
> **Status**: Schema Agent Complete
> **Source**: `src/backend/setupCollections.jsw`

---

## Overview

The Feature Adoption Log system requires **4 Wix Collections** to track feature usage, health scores, and conversion funnels.

### Quick Reference

| Collection | Purpose | Fields | Key Index |
|------------|---------|--------|-----------|
| `FeatureAdoptionLogs` | Primary event log | 19 | `featureId + timestamp` |
| `FeatureRegistry` | Feature catalog | 13 | `featureId` (unique) |
| `FeatureFunnels` | Funnel definitions | 7 | `funnelId` (unique) |
| `FeatureMetricsDaily` | Daily aggregates | 13 | `featureId + date` (unique) |

---

## Collection 1: FeatureAdoptionLogs

**Purpose**: Primary event log capturing all feature interactions.

**Permissions**: Read=Admin, Create=SiteMember, Update=Admin, Delete=Admin

### Fields (19 total)

| # | Field Name | Type | Required | Description |
|---|------------|------|----------|-------------|
| 1 | `_id` | Text | Auto | Wix auto-generated ID |
| 2 | `featureId` | Text | Yes | Unique feature identifier (e.g., "carrier_search") |
| 3 | `featureVersion` | Text | No | Version for A/B testing (e.g., "v2.1", "control") |
| 4 | `userId` | Text | Yes | Member ID or anonymous session ID |
| 5 | `userRole` | Text | Yes | User type: `driver`, `carrier`, `recruiter` |
| 6 | `action` | Text | Yes | Interaction type (see Action Types below) |
| 7 | `timestamp` | Date | Yes | When event occurred (ISO 8601) |
| 8 | `sessionId` | Text | Yes | Groups interactions in a session |
| 9 | `deviceType` | Text | No | Device: `mobile`, `desktop`, `tablet` |
| 10 | `referrer` | Text | No | Previous page/feature |
| 11 | `entryPoint` | Text | No | UI element that triggered entry |
| 12 | `durationMs` | Number | No | Time spent on feature (milliseconds) |
| 13 | `scrollDepth` | Number | No | Scroll percentage (0-100) |
| 14 | `interactionCount` | Number | No | Clicks/taps within feature |
| 15 | `outcome` | Text | No | Result: `success`, `failure`, `partial`, `abandoned` |
| 16 | `conversionValue` | Number | No | Business value if applicable |
| 17 | `nextFeature` | Text | No | Where user went next |
| 18 | `errorCode` | Text | No | Machine-readable error code |
| 19 | `errorMessage` | Text | No | Human-readable error detail |
| 20 | `metadata` | Object | No | Flexible JSON data |

### Valid Action Types

```javascript
const VALID_ACTION_TYPES = [
  'view',       // Feature was displayed to user
  'click',      // User clicked within feature
  'complete',   // User finished primary task
  'hover',      // User hovered over element (desktop)
  'scroll_to',  // User scrolled to element
  'time_spent', // Passive time tracking (fired on exit)
  'error',      // Something went wrong
  'abandon',    // User left mid-process
  'share',      // User shared feature/content
  'repeat',     // User returned to feature (not first in session)
  'first_use'   // User's first ever use of this feature
];
```

### Recommended Indexes

1. **Compound**: `featureId` + `timestamp` (most common query pattern)
2. **Single**: `sessionId` (session grouping)
3. **Compound**: `userId` + `timestamp` (user history queries)

---

## Collection 2: FeatureRegistry

**Purpose**: Master list of all trackable features with lifecycle metadata.

**Permissions**: Read=Anyone, Create=Admin, Update=Admin, Delete=Admin

### Fields (13 total)

| # | Field Name | Type | Required | Description |
|---|------------|------|----------|-------------|
| 1 | `_id` | Text | Auto | Wix auto-generated ID |
| 2 | `featureId` | Text | Yes | **UNIQUE** identifier |
| 3 | `displayName` | Text | Yes | Human-readable name |
| 4 | `description` | Text | No | What the feature does |
| 5 | `category` | Text | Yes | Category: `matching`, `communication`, `analytics`, `onboarding` |
| 6 | `launchDate` | Date | No | When feature was released |
| 7 | `status` | Text | Yes | Lifecycle: `beta`, `active`, `deprecated`, `sunset` |
| 8 | `expectedUsagePattern` | Text | No | Frequency: `daily`, `weekly`, `onboarding-only`, `event-driven` |
| 9 | `targetRoles` | Array | No | User roles: `["driver", "recruiter", "carrier"]` |
| 10 | `owner` | Text | No | Team/person responsible |
| 11 | `successMetric` | Text | No | Success criteria (e.g., "completion_rate > 40%") |
| 12 | `retirementThreshold` | Number | No | Days without use before flagging (default: 30) |
| 13 | `relatedFeatures` | Array | No | Array of featureIds often used together |
| 14 | `documentationUrl` | Text | No | Link to feature documentation |

### Valid Status Values

```javascript
const VALID_FEATURE_STATUSES = ['beta', 'active', 'deprecated', 'sunset'];
```

### Status Lifecycle

```
beta --> active --> deprecated --> sunset
  ^                    |
  +--------------------+ (can reactivate)
```

### Recommended Indexes

1. **Unique**: `featureId`
2. **Single**: `status` (filtering by lifecycle stage)

---

## Collection 3: FeatureFunnels

**Purpose**: Multi-step flow definitions for conversion tracking.

**Permissions**: Read=Anyone, Create=Admin, Update=Admin, Delete=Admin

### Fields (7 total)

| # | Field Name | Type | Required | Description |
|---|------------|------|----------|-------------|
| 1 | `_id` | Text | Auto | Wix auto-generated ID |
| 2 | `funnelId` | Text | Yes | **UNIQUE** funnel identifier |
| 3 | `displayName` | Text | Yes | Human-readable name |
| 4 | `description` | Text | No | What this funnel measures |
| 5 | `steps` | Array | Yes | Ordered step definitions (see structure below) |
| 6 | `createdAt` | Date | Yes | When funnel was defined |
| 7 | `updatedAt` | Date | Yes | Last modification timestamp |
| 8 | `isActive` | Boolean | Yes | Whether to track this funnel |

### Steps Array Structure

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

### Recommended Indexes

1. **Unique**: `funnelId`

---

## Collection 4: FeatureMetricsDaily

**Purpose**: Pre-aggregated daily rollups for fast dashboard queries.

**Permissions**: Read=Anyone, Create=Admin, Update=Admin, Delete=Admin

### Fields (13 total)

| # | Field Name | Type | Required | Description |
|---|------------|------|----------|-------------|
| 1 | `_id` | Text | Auto | Wix auto-generated ID |
| 2 | `featureId` | Text | Yes | Feature identifier |
| 3 | `date` | Date | Yes | Aggregation date (midnight UTC) |
| 4 | `uniqueUsers` | Number | Yes | Distinct users count |
| 5 | `totalInteractions` | Number | Yes | Total events logged |
| 6 | `completionRate` | Number | No | % of views that completed (0-100) |
| 7 | `avgDurationMs` | Number | No | Average time spent (ms) |
| 8 | `errorRate` | Number | No | % of interactions with errors (0-100) |
| 9 | `abandonRate` | Number | No | % of views abandoned (0-100) |
| 10 | `byRole` | Object | No | Breakdown by user role |
| 11 | `byDevice` | Object | No | Breakdown by device type |
| 12 | `byEntryPoint` | Object | No | Breakdown by entry point |
| 13 | `topErrors` | Array | No | Most common errors |
| 14 | `conversionValueTotal` | Number | No | Sum of conversion values |

### byRole Object Structure

```javascript
{
  "driver": { "users": 890, "interactions": 5200, "completionRate": 45.2 },
  "recruiter": { "users": 234, "interactions": 2800, "completionRate": 38.1 },
  "carrier": { "users": 123, "interactions": 934, "completionRate": 51.0 }
}
```

### byDevice Object Structure

```javascript
{
  "mobile": { "users": 678, "interactions": 4500 },
  "desktop": { "users": 534, "interactions": 4200 },
  "tablet": { "users": 35, "interactions": 234 }
}
```

### topErrors Array Structure

```javascript
[
  { "code": "SEARCH_TIMEOUT", "message": "Search timed out", "count": 45 },
  { "code": "VALIDATION_FAILED", "message": "Form validation error", "count": 23 }
]
```

### Recommended Indexes

1. **Unique Compound**: `featureId` + `date` (one record per feature per day)

---

## Setup Functions

### Available in `src/backend/setupCollections.jsw`

| Function | Description |
|----------|-------------|
| `setupFeatureAdoptionCollections()` | Verifies all 4 collections exist |
| `setupFeatureAdoptionLogs()` | Setup FeatureAdoptionLogs only |
| `setupFeatureRegistry()` | Setup FeatureRegistry only |
| `setupFeatureFunnels()` | Setup FeatureFunnels only |
| `setupFeatureMetricsDaily()` | Setup FeatureMetricsDaily only |
| `seedFeatureRegistry()` | Populate initial features |
| `seedFeatureFunnels()` | Populate initial funnels |
| `setupFeatureAdoptionSystem()` | Full setup + seeding |

### Usage Example

```javascript
import { setupFeatureAdoptionSystem } from 'backend/setupCollections';

// Run full setup (call once)
const result = await setupFeatureAdoptionSystem();
console.log(result);
// {
//   collections: { summary: { total: 4, existing: 4, missing: 0, allReady: true }, ... },
//   registrySeed: { inserted: [...], skipped: [...], errors: [] },
//   funnelsSeed: { inserted: [...], skipped: [...], errors: [] },
//   overallSuccess: true
// }
```

---

## Exported Constants

These are available for import by the Core Logging Agent:

```javascript
import {
  VALID_ACTION_TYPES,
  VALID_FEATURE_STATUSES,
  VALID_USAGE_PATTERNS,
  FEATURE_ADOPTION_COLLECTIONS,
  FEATURE_ADOPTION_SCHEMAS
} from 'backend/setupCollections';

// Collection names
FEATURE_ADOPTION_COLLECTIONS.LOGS     // 'FeatureAdoptionLogs'
FEATURE_ADOPTION_COLLECTIONS.REGISTRY // 'FeatureRegistry'
FEATURE_ADOPTION_COLLECTIONS.FUNNELS  // 'FeatureFunnels'
FEATURE_ADOPTION_COLLECTIONS.METRICS_DAILY // 'FeatureMetricsDaily'
```

---

## Initial Seed Data

### Features (seeded by `seedFeatureRegistry()`)

| featureId | displayName | category | targetRoles |
|-----------|-------------|----------|-------------|
| `carrier_search` | Carrier Search & Matching | matching | driver |
| `driver_application` | Driver Application Form | matching | driver |
| `recruiter_pipeline` | Recruiter Candidate Pipeline | communication | recruiter |
| `driver_search` | Driver Search (Recruiter) | matching | recruiter, carrier |
| `ai_matching` | AI Matching Dashboard | matching | driver |
| `carrier_onboarding` | Carrier Onboarding Flow | onboarding | carrier |

### Funnels (seeded by `seedFeatureFunnels()`)

| funnelId | displayName | Steps |
|----------|-------------|-------|
| `driver_application_flow` | Driver Application Funnel | Search -> Detail -> Apply |
| `recruiter_outreach_flow` | Recruiter Outreach Funnel | Search -> Profile -> Contact |
| `carrier_onboarding_flow` | Carrier Onboarding Funnel | Signup -> Onboard -> Prefs -> Subscribe |

---

## Verification Checklist

### Collection Creation
- [ ] `FeatureAdoptionLogs` created with 19 fields
- [ ] `FeatureRegistry` created with 13 fields
- [ ] `FeatureFunnels` created with 7 fields
- [ ] `FeatureMetricsDaily` created with 13 fields
- [ ] All collections accessible via `wixData` API

### Index Creation
- [ ] `FeatureAdoptionLogs`: featureId + timestamp (compound)
- [ ] `FeatureAdoptionLogs`: sessionId
- [ ] `FeatureAdoptionLogs`: userId + timestamp (compound)
- [ ] `FeatureMetricsDaily`: featureId + date (compound, unique)
- [ ] `FeatureRegistry`: featureId (unique)
- [ ] `FeatureRegistry`: status
- [ ] `FeatureFunnels`: funnelId (unique)

### Permissions
- [ ] FeatureAdoptionLogs: SiteMember can create (for frontend tracker)
- [ ] FeatureRegistry: Anyone can read (for dashboard)
- [ ] FeatureFunnels: Anyone can read (for dashboard)
- [ ] FeatureMetricsDaily: Anyone can read (for dashboard)

---

## Next Steps for Core Logging Agent

1. Import constants from `setupCollections.jsw`:
   ```javascript
   import { VALID_ACTION_TYPES, FEATURE_ADOPTION_COLLECTIONS } from 'backend/setupCollections';
   ```

2. Create `featureAdoptionService.jsw` with core logging functions

3. Implement:
   - `logFeatureInteraction()`
   - `logFeatureError()`
   - `logFeatureSession()`
   - `registerFeature()`
   - `updateFeatureStatus()`
   - `defineFunnel()`
