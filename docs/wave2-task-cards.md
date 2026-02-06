# Wave 2 Task Cards — Admin & Observability

**Timeline:** Weeks 3-4
**Juniors:** J4, J5
**Prerequisites:** Wave 1 templates complete
**Templates:** `_TEMPLATE_seed.jsw`, `_TEMPLATE_connectionTest.jsw`, `_TEMPLATE_bridge.test.js`, `_TEMPLATE_html.test.js`

---

## Wave 2 Overview

Wave 2 covers the entire Admin portal. Key difference from Wave 1: **J4's pages already have bridge tests** from the initial pattern implementation. J4 focuses on seed data + connection tests + reviewing/extending existing bridge tests. J5 creates 3 new bridge tests.

### Existing Bridge Tests (already in repo)
| Page | Test File | Status |
|------|-----------|--------|
| ADMIN_DASHBOARD | `adminDashboard.test.js` | Exists — J4 reviews |
| ADMIN_DRIVERS | `adminDrivers.test.js` | Exists — J4 reviews |
| ADMIN_MATCHES | `adminMatches.test.js` | Exists — J4 reviews |
| ADMIN_OBSERVABILITY | `adminObservability.test.js` | Exists — J4 reviews |
| ADMIN_AI_ROUTER | `adminAiRouter.test.js` | Exists — J5 reviews |

### New Bridge + HTML DOM Tests Needed
| Page | Bridge Test | HTML DOM Test | Owner |
|------|-----------|---------------|-------|
| ADMIN_CONTENT | `adminContent.bridge.test.js` | `adminContent.html.test.js` | J5 |
| ADMIN_AUDIT_LOG | `adminAuditLog.bridge.test.js` | `adminAuditLog.html.test.js` | J5 |
| ADMIN_FEATURE_ADOPTION | `adminFeatureAdoption.bridge.test.js` | `adminFeatureAdoption.html.test.js` | J5 |

---

# JUNIOR 4 (J4): Admin Dashboard, Drivers, Matches & Observability

## J4-A: Admin Core Seed Data

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/backend/seeds/seedAdminCore.jsw` | `_TEMPLATE_seed.jsw` |

### Collection Keys
| Key | Expected Airtable Table | Used By |
|-----|------------------------|---------|
| `driverProfiles` | `v2_Driver_Profiles` | dashboard, drivers, matches |
| `carriers` | `v2_Carriers` | dashboard, drivers, matches |
| `matchEvents` | `v2_Match_Events` | dashboard, matches |
| `driverCarrierInterests` | `v2_Driver_Carrier_Interests` | dashboard, drivers, matches |
| `carrierEnrichments` | `v2_Carrier_Enrichments` | dashboard, drivers |
| `carrierSafetyData` | `v2_Carrier_Safety_Data` | dashboard |
| `adminAuditLog` | `v2_Admin_Audit_Log` | dashboard, drivers, matches |
| `systemAlerts` | `v2_System_Alerts` | dashboard |
| `aiUsageLog` | `v2_AI_Usage_Log` | dashboard |

**NOTE:** `driverProfiles` and `carriers` overlap with Wave 1 (J1's seedDriverProfiles). Your seed file should check `countData()` first and skip if already seeded. Focus on seeding the admin-specific collections: `adminAuditLog`, `systemAlerts`, `aiUsageLog`, `carrierSafetyData`.

### Seed Data Requirements

**System Alerts (5 records):**
```
alert_type, severity, message, status, source, created_at
```
- 1 critical alert (status: 'active')
- 1 resolved alert (status: 'resolved')
- 1 warning alert
- 2 info alerts

**AI Usage Log (10 records):**
```
provider, model, function_name, tokens_used, latency_ms, success, timestamp
```
- Mix of providers: 'openai', 'anthropic', 'google'
- 1 failed request (success: false)
- Range of token counts (100 to 10000)

**Admin Audit Log (8 records):**
```
admin_id, action, entity_type, entity_id, details, timestamp
```
- Actions: 'verify_driver', 'suspend_driver', 'resolve_alert', 'update_config', 'export_data'
- Entity types: 'driver', 'carrier', 'alert', 'config'

**Carrier Safety Data (3 records):**
```
carrier_dot, safety_rating, overall_percentile, basics, inspections_30_day, violations_30_day
```
- Linked to carrier DOT numbers from the carriers seed

---

## J4-B: Admin Core Connection Test

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/backend/tests/adminCoreConnectionTest.jsw` | `_TEMPLATE_connectionTest.jsw` |

### Configuration
```javascript
const DOMAIN_NAME = 'AdminCore';

const TEST_COLLECTIONS = {
    'adminAuditLog': 'v2_Admin_Audit_Log',
    'systemAlerts': 'v2_System_Alerts',
    'aiUsageLog': 'v2_AI_Usage_Log',
    'carrierSafetyData': 'v2_Carrier_Safety_Data'
};

const TEST_RECORD = {
    admin_id: '__TEST_SEED__',
    action: 'connection_test',
    entity_type: 'test',
    entity_id: 'test-entity-001',
    details: 'Automated connection test - safe to delete',
    timestamp: new Date().toISOString()
};

const EXPECTED_AIRTABLE_FIELDS = {
    'admin_id': 'Admin ID',
    'action': 'Action',
    'entity_type': 'Entity Type',
    'entity_id': 'Entity ID',
    'details': 'Details'
};
```

**Run CRUD against `adminAuditLog` as the primary collection** — it's the most commonly shared collection across all 4 services.

---

## J4-C: Observability Seed + Connection Test

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/backend/seeds/seedObservability.jsw` | `_TEMPLATE_seed.jsw` |
| 2 | `src/backend/tests/observabilityConnectionTest.jsw` | `_TEMPLATE_connectionTest.jsw` |

### Collection Keys
| Key | Expected Airtable Table |
|-----|------------------------|
| `systemLogs` | `v2_System_Logs` |
| `systemTraces` | `v2_System_Traces` |
| `systemErrors` | `v2_System_Errors` |
| `systemMetrics` | `v2_System_Metrics` |

### Seed Data Requirements

**System Logs (10 records):**
```
level, source, message, metadata, timestamp
```
- Levels: 'info', 'warn', 'error', 'debug'
- Sources: 'matchEngine', 'enrichment', 'api', 'scheduler'

**System Traces (3 records):**
```
trace_id, span_name, duration_ms, status, parent_trace_id, metadata
```
- 1 root trace with 2 child spans

**System Errors (5 records):**
```
error_type, message, stack_trace, source, resolved, timestamp
```
- 2 resolved, 3 unresolved
- Types: 'timeout', 'validation', 'auth', 'api_error', 'unknown'

**System Metrics (10 records):**
```
metric_name, value, unit, source, timestamp
```
- Names: 'api_latency_p99', 'match_accuracy', 'enrichment_success_rate', 'active_sessions'

---

## J4-D: Review Existing Bridge Tests + Create HTML DOM Tests

### Task
Review the 4 existing bridge tests and verify they match the current page code. **Also create HTML DOM tests for each page.**

| Test File | Page Code | HTML File | Check |
|-----------|-----------|-----------|-------|
| `adminDashboard.test.js` | `ADMIN_DASHBOARD.svo6l.js` | `admin/ADMIN_DASHBOARD.html` | 11 actions |
| `adminDrivers.test.js` | `ADMIN_DRIVERS.uo7vb.js` | `admin/ADMIN_DRIVERS.html` | 12 actions |
| `adminMatches.test.js` | `ADMIN_MATCHES.gqhdo.js` | `admin/ADMIN_MATCHES.html` | 8 actions |
| `adminObservability.test.js` | `ADMIN_OBSERVABILITY.c8pf9.js` | `admin/ADMIN_OBSERVABILITY.html` | 6 actions |

**For each page:**
1. Read the page code and count all actions in the switch
2. Read the test file and count all action tests
3. If any actions are missing from the test, add them
4. Verify error-case tests exist for every backend call
5. Create `{pageName}.html.test.js` using `_TEMPLATE_html.test.js` — test DOM rendering for each inbound message
6. Confirm tests pass: `npm test -- --testPathPattern="{testFile}"`

**Deliverables:**
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/adminDashboard.html.test.js` | `_TEMPLATE_html.test.js` |
| 2 | `src/public/__tests__/adminDrivers.html.test.js` | `_TEMPLATE_html.test.js` |
| 3 | `src/public/__tests__/adminMatches.html.test.js` | `_TEMPLATE_html.test.js` |
| 4 | `src/public/__tests__/adminObservability.html.test.js` | `_TEMPLATE_html.test.js` |

### Acceptance Criteria for J4
- [ ] `seedAdminCore.jsw` seeds records across 4 admin-specific collections
- [ ] `seedObservability.jsw` seeds records across 4 observability collections
- [ ] `adminCoreConnectionTest.jsw` passes all 4 phases
- [ ] `observabilityConnectionTest.jsw` passes all 4 phases
- [ ] All 4 existing bridge tests reviewed; missing actions added if any
- [ ] 4 new HTML DOM tests: `adminDashboard.html.test.js`, `adminDrivers.html.test.js`, `adminMatches.html.test.js`, `adminObservability.html.test.js`
- [ ] `npm test` passes with no failures
- [ ] Committed: `feat(wave2): Add verification for AdminCore + Observability`

---

# JUNIOR 5 (J5): Content, Audit, AI Router & Feature Adoption

## J5-A: Content & Audit Seed Data

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/backend/seeds/seedContentAudit.jsw` | `_TEMPLATE_seed.jsw` |

### Collection Keys
| Key | Expected Airtable Table | Service |
|-----|------------------------|---------|
| `carrierReviews` | `v2_Carrier_Reviews` | admin_content_service |
| `jobPostings` | `v2_Job_Postings` | admin_content_service |
| `adminAuditLog` | `v2_Admin_Audit_Log` | admin_audit_service |

**NOTE:** `adminAuditLog` overlaps with J4. Check `countData()` and skip if already seeded. `adminUsers` is in Wix only — do NOT seed it (auth collection, per CLAUDE.md).

### Seed Data Requirements

**Carrier Reviews (5 records):**
```
carrier_dot, reviewer_id, rating, review_text, status, created_at
```
- Statuses: 'pending', 'approved', 'rejected', 'flagged'
- 1 review with empty text (edge case)

**Job Postings (5 records):**
```
carrier_dot, title, description, location, pay_range, status, posted_at
```
- Statuses: 'active', 'closed', 'draft', 'flagged', 'expired'
- 1 posting with minimal fields

---

## J5-B: AI Router & Feature Adoption Seed Data

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/backend/seeds/seedAIFeatures.jsw` | `_TEMPLATE_seed.jsw` |

### Collection Keys
| Key | Expected Airtable Table | Service |
|-----|------------------------|---------|
| `aiRouterConfig` | `v2_AI_Router_Config` | aiRouterService |
| `aiUsageLog` | `v2_AI_Usage_Log` | aiRouterService |
| `featureAdoptionLogs` | `v2_Feature_Adoption_Logs` | featureAdoptionService |
| `featureRegistry` | `v2_Feature_Registry` | featureAdoptionService |
| `featureFunnels` | `v2_Feature_Funnels` | featureAdoptionService |
| `featureMetricsDaily` | `v2_Feature_Metrics_Daily` | featureAdoptionService |

**WARNING:** `aiRouterService.jsw` currently uses **direct wixData calls** for AIRouterConfig CRUD (lines 442-573) instead of dual-source helpers. Note this in your connection test — the CRUD phase may behave differently for this collection. Flag it for the Gate 1 review.

### Seed Data Requirements

**AI Router Config (3 records):**
```
function_id, provider, model, fallback_provider, fallback_model, max_tokens, temperature
```
- Functions: 'enrichment', 'matching', 'ocr'
- Providers: 'openai', 'anthropic', 'google'

**Feature Registry (5 records):**
```
feature_id, name, status, category, owner, created_at
```
- Statuses: 'active', 'beta', 'deprecated', 'sunset', 'planned'

**Feature Adoption Logs (10 records):**
```
feature_id, user_id, user_type, event_type, metadata, timestamp
```
- Event types: 'viewed', 'clicked', 'engaged', 'abandoned', 'completed'
- User types: 'driver', 'recruiter', 'admin'

**Feature Funnels (3 records):**
```
funnel_id, name, steps, feature_id, created_at
```

**Feature Metrics Daily (7 records):**
```
feature_id, date, daily_active_users, total_events, conversion_rate
```
- 7 consecutive days for 1 feature

---

## J5-C: Content & Audit Connection Tests

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/backend/tests/contentAuditConnectionTest.jsw` | `_TEMPLATE_connectionTest.jsw` |
| 2 | `src/backend/tests/aiFeatureConnectionTest.jsw` | `_TEMPLATE_connectionTest.jsw` |

### Content/Audit Test Config
```javascript
const DOMAIN_NAME = 'ContentAudit';

const TEST_COLLECTIONS = {
    'carrierReviews': 'v2_Carrier_Reviews',
    'jobPostings': 'v2_Job_Postings',
    'adminAuditLog': 'v2_Admin_Audit_Log'
};

const TEST_RECORD = {
    carrier_dot: 9999999,
    reviewer_id: '__TEST_SEED__',
    rating: 3,
    review_text: 'Connection test review - safe to delete',
    status: 'pending'
};
```

### AI/Feature Test Config
```javascript
const DOMAIN_NAME = 'AIFeatures';

const TEST_COLLECTIONS = {
    'aiUsageLog': 'v2_AI_Usage_Log',
    'featureAdoptionLogs': 'v2_Feature_Adoption_Logs',
    'featureRegistry': 'v2_Feature_Registry',
    'featureFunnels': 'v2_Feature_Funnels',
    'featureMetricsDaily': 'v2_Feature_Metrics_Daily'
};

const TEST_RECORD = {
    feature_id: '__TEST_SEED__',
    name: 'Connection Test Feature',
    status: 'planned',
    category: 'test',
    owner: 'wave2-j5'
};
```

**NOTE on `aiRouterConfig`:** Skip this collection in the standard connection test. It uses direct wixData calls in the service, so the dual-source CRUD test will not reflect actual service behavior. Flag this for Gate 1 review as a routing inconsistency.

---

## J5-D: Admin Content Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/adminContent.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/adminContent.html.test.js` | `_TEMPLATE_html.test.js` |

### Source Files to Read
- `src/pages/ADMIN_CONTENT.ods3g.js`
- `src/public/admin/ADMIN_CONTENT.html`

### Page Code Config
```javascript
const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'ADMIN_CONTENT.ods3g.js');
```

### Backend Imports to Verify
```javascript
const EXPECTED_IMPORTS = [
    "from 'backend/admin_content_service'"
];
```

### Mock Backend
```javascript
const mockBackend = {
    getModerationQueue: jest.fn().mockResolvedValue({
        reviews: [], jobs: [], documents: [], totalPending: 0
    }),
    updateReviewStatus: jest.fn().mockResolvedValue({ success: true }),
    updateJobStatus: jest.fn().mockResolvedValue({ success: true }),
    updateDocumentStatus: jest.fn().mockResolvedValue({ success: true })
};
```

### Actions to Test (3 total)

| # | Action | Calls | Response | Validation |
|---|--------|-------|----------|------------|
| 1 | `navigate` | `wixLocationFrontend.to` | none (navigation) | |
| 2 | `getModerationQueue` | `getModerationQueue()` | `moderationQueueLoaded` | |
| 3 | `performModeration` | `updateReviewStatus()` OR `updateJobStatus()` OR `updateDocumentStatus()` | `actionSuccess` | requires: id, type, status |

**`performModeration` routes by type:**
- `type === 'review'` → `updateReviewStatus(id, status)`
- `type === 'job'` → `updateJobStatus(id, status)`
- `type === 'document'` → `updateDocumentStatus(id, status)`

**Test all 3 type branches** plus the missing-params case.

---

## J5-E: Admin Audit Log Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/adminAuditLog.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/adminAuditLog.html.test.js` | `_TEMPLATE_html.test.js` |

### Source Files to Read
- `src/pages/ADMIN_AUDIT_LOG.ud1zf.js`
- `src/public/admin/ADMIN_AUDIT_LOG.html`

### Page Code Config
```javascript
const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'ADMIN_AUDIT_LOG.ud1zf.js');
```

### Mock Backend
```javascript
const mockBackend = {
    getAuditLog: jest.fn().mockResolvedValue({ entries: [], total: 0 }),
    getAuditEntryDetail: jest.fn().mockResolvedValue({ _id: 'entry-1', action: 'verify_driver' }),
    getAuditStats: jest.fn().mockResolvedValue({ totalEntries: 100, topActions: [] }),
    exportAuditLogCSV: jest.fn().mockResolvedValue({ csv: 'id,action\n1,verify' })
};
```

### Actions to Test (4 total)

| # | Action | Calls | Response | Validation |
|---|--------|-------|----------|------------|
| 1 | `getAuditLog` | `getAuditLog(filters, page, pageSize, sortField, sortDirection)` | `auditLogLoaded` | |
| 2 | `getStats` | `getAuditStats()` | `statsLoaded` | |
| 3 | `getEntryDetail` | `getAuditEntryDetail(entryId)` | `entryDetailLoaded` | requires: entryId |
| 4 | `exportAuditLog` | `exportAuditLogCSV(filters)` | `exportReady` + `actionSuccess` | |

---

## J5-F: Admin Feature Adoption Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/adminFeatureAdoption.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/adminFeatureAdoption.html.test.js` | `_TEMPLATE_html.test.js` |

### Source Files to Read
- `src/pages/ADMIN_FEATURE_ADOPTION.rt8ev.js`
- `src/public/admin/ADMIN_FEATURE_ADOPTION.html`

### Page Code Config
```javascript
const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'ADMIN_FEATURE_ADOPTION.rt8ev.js');
```

### PROTOCOL WARNING

**This page uses `type` key instead of `action` key.** The message envelope is:
```javascript
// Standard pages:  { action: 'getData', param1: 'value' }
// This page:       { type: 'getData', data: { param1: 'value' } }
```

Your `routeMessage` function must switch on `message.type` not `message.action`. Responses also use `{ type: '...', data: ... }` format instead of `{ action: '...', payload: ... }`.

### Mock Backend
```javascript
const mockBackend = {
    getFeatureLifecycleReport: jest.fn().mockResolvedValue({ features: [] }),
    getFeatureStats: jest.fn().mockResolvedValue({ feature: 'test', usage: 42 }),
    getFeatureHealthScore: jest.fn().mockResolvedValue({ score: 85, status: 'healthy' }),
    getAtRiskFeatures: jest.fn().mockResolvedValue({ atRisk: [] }),
    getFunnels: jest.fn().mockResolvedValue({ funnels: [] }),
    getFunnelConversion: jest.fn().mockResolvedValue({ rate: 0.5 }),
    registerFeature: jest.fn().mockResolvedValue({ success: true, id: 'feat-new' }),
    updateFeatureStatus: jest.fn().mockResolvedValue({ updated: true })
};
```

### Actions to Test (9 total — all use `type` key)

| # | Type | Calls | Response Type | Notes |
|---|------|-------|---------------|-------|
| 1 | `featureAdoptionReady` | none | none (init signal) | |
| 2 | `getFeatureLifecycleReport` | `getFeatureLifecycleReport()` | `featureLifecycleReportResult` | |
| 3 | `getFeatureStats` | `getFeatureStats(featureId, timeRange)` | `featureStatsResult` | params in `msg.data` |
| 4 | `getFeatureHealthScore` | `getFeatureHealthScore(featureId)` | `featureHealthScoreResult` | |
| 5 | `getAtRiskFeatures` | `getAtRiskFeatures()` | `atRiskFeaturesResult` | |
| 6 | `getFunnelsList` | `getFunnels()` | `funnelsListResult` | |
| 7 | `getFunnelConversion` | `getFunnelConversion(funnelId, timeRange)` | `funnelConversionResult` | |
| 8 | `registerFeature` | `registerFeature(featureData)` | `registerFeatureResult` | |
| 9 | `updateFeatureStatus` | `updateFeatureStatus(featureId, status, reason)` | `updateFeatureStatusResult` | |

**Key difference in test structure:**
```javascript
// Standard bridge test:
await routeMessage(component, { action: 'getData' });
expect(component.postMessage).toHaveBeenCalledWith({
    action: 'dataLoaded', payload: expectedData
});

// This page's bridge test:
await routeMessage(component, { type: 'getFeatureStats', data: { featureId: 'f1' } });
expect(component.postMessage).toHaveBeenCalledWith({
    type: 'featureStatsResult', data: expectedData
});
```

---

## J5-G: Review Existing AI Router Bridge Test

### Task
Review `adminAiRouter.test.js` against `ADMIN_AI_ROUTER.cqkgi.js`:

| Action | In Page Code | In Test |
|--------|-------------|---------|
| `getProviders` | Yes | Check |
| `getConfig` | Yes | Check |
| `getModels` | Yes (requires: providerId) | Check |
| `getUsageStats` | Yes | Check |
| `updateConfig` | Yes (requires: functionId, config) | Check |
| `resetConfig` | Yes (requires: functionId) | Check |
| `testProvider` | Yes (requires: providerId) | Check |
| `testAllProviders` | Yes | Check |

Verify all 8 actions + all 4 validation cases + error tests. Update if gaps found.

### Acceptance Criteria for J5
- [ ] `seedContentAudit.jsw` seeds reviews + job postings
- [ ] `seedAIFeatures.jsw` seeds AI config + feature adoption records across 5 collections
- [ ] `contentAuditConnectionTest.jsw` passes all 4 phases
- [ ] `aiFeatureConnectionTest.jsw` passes all 4 phases (note: `aiRouterConfig` flagged for Gate 1)
- [ ] `adminContent.bridge.test.js` tests 3 actions + all moderation type branches
- [ ] `adminContent.html.test.js` tests DOM rendering (moderationQueueLoaded, actionSuccess/Error)
- [ ] `adminAuditLog.bridge.test.js` tests 4 actions + validation
- [ ] `adminAuditLog.html.test.js` tests DOM rendering (auditLogLoaded, statsLoaded, entryDetailLoaded, exportReady)
- [ ] `adminFeatureAdoption.bridge.test.js` tests 9 actions using `type` protocol
- [ ] `adminFeatureAdoption.html.test.js` tests DOM rendering using `type` protocol (featureLifecycleReportResult, featureStatsResult, etc.)
- [ ] Existing `adminAiRouter.test.js` reviewed; gaps filled if any
- [ ] `npm test` passes with no failures
- [ ] Committed: `feat(wave2): Add verification for Content, Audit, AI Router & Feature Adoption`

---

# Issues to Flag for Gate 1

| Issue | Service | Details |
|-------|---------|---------|
| **Routing inconsistency** | `aiRouterService.jsw` | Uses direct `wixData` calls (lines 442-573) for AIRouterConfig CRUD instead of dual-source helpers. Service defines helpers but doesn't use them. |
| **Protocol divergence** | `ADMIN_FEATURE_ADOPTION` | Uses `type`/`data` envelope instead of `action`/`payload`. Same as Recruiter Onboarding. Gate 1 should decide: standardize or document as intentional. |
| **Collection overlap** | `adminAuditLog` | Used by 5 services (dashboard, drivers, matches, content, audit). Seed files must check `countData()` to avoid duplicate seeding. |

---

# Shared Rules (same as Wave 1)

## Branch Naming
```
wave2/{junior-name}/{domain}
```

## Commit Message Format
```
feat(wave2): Add verification for {ServiceName}

- Seed data: {N} records across {M} collections
- Connection test: 4-phase Airtable CRUD verification
- Bridge test: {N} actions tested with error cases

Co-Authored-By: {Your Name}
```

## Definition of Done
1. All test files pass: `npm test`
2. Seed files are idempotent (safe to run twice)
3. Connection tests clean up after themselves
4. Bridge tests cover every action in the routeMessage switch
5. Every backend call has an error-case test
6. No hardcoded Airtable table names
7. Issues flagged for Gate 1 documented in PR description
