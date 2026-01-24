# Track Plan: Airtable Migration - Scalable Data Architecture

> **STATUS: IN_PROGRESS** - Phase 1 Infrastructure actively underway.
>
> **Last Updated**: 2026-01-23
>
> **Specification**: See `spec.md` for technical details

---

## Current Status (Updated 2026-01-23)

### Airtable Tables: 94.3% Complete
- **Created:** 63 v2_ tables (33 from original plan + 30 additional)
- **Missing:** 2 tables (v2_Member Notifications, v2_Admin Users)
- **Legacy tables:** 8 (not following v2_ convention)

### Tables Created Beyond Original Plan (30)
| Category | Tables |
|----------|--------|
| Observability | v2_Audit Log, v2_AI Usage Log, v2_System Logs, v2_System Alerts, v2_System Errors, v2_System Metrics, v2_System Traces |
| Feature Analytics | v2_Feature Adoption Logs, v2_Feature Funnels, v2_Feature Metrics Daily, v2_Feature Registry |
| Driver Services | v2_Fuel Cards, v2_Fuel Prices, v2_Parking Locations, v2_Parking Reports, v2_Road Utility Cache, v2_Incident Reports |
| Compliance | v2_CSA Score History, v2_Compliance Alerts, v2_Compliance Events |
| Documents | v2_Carrier Documents, v2_Document Requests, v2_Qualification Files |
| Commerce | v2_Carrier Staffing Requests, v2_Checkout Abandonment |
| Other | v2_Prompt Library, v2_Onboarding Workflows, v2_Recruiter Profiles, v2_Carrier Driver Outreach |

### Infrastructure Status
| Component | Status |
|-----------|--------|
| Airtable base created | Complete |
| v2_ naming convention | Enforced via hooks |
| airtableClient.jsw | In Progress |
| config.jsw | In Progress |
| Service refactoring | Not Started (0/44 files) |

### Revised Phase Assessment
- **Phase 1 (Infrastructure):** ~70% complete (tables done, client code in progress)
- **Phase 2-6 (Data Migration):** Tables ready, data export/import not started
- **Phase 7-14 (Service Refactoring):** Not started

---

## Phase 1: Infrastructure Setup

> **Goal**: Set up Airtable base, configure API access, create abstraction layer
>
> **Dependencies**: None
>
> **Estimated Effort**: 3-5 days

### 1.1 Airtable Account & Base Setup

- [ ] Task: Create Airtable account (Team plan recommended for API access)
- [ ] Task: Create base "LMDR Production"
- [ ] Task: Create tab groups for organization (Core Data, Matching, Communication, Billing, Enrichment, Content, Admin)
- [ ] Task: Add `AIRTABLE_API_KEY` to Wix Secrets Manager
- [ ] Task: Add `AIRTABLE_BASE_ID` to Wix Secrets Manager

### 1.2 Core Table Schemas

- [ ] Task: Create `Carriers` table with all fields per spec.md schema
- [ ] Task: Create `Driver Profiles` table with all fields per spec.md schema
- [ ] Task: Create `Driver Jobs` table
- [ ] Task: Create `Carrier Hiring Preferences` table
- [ ] Task: Create `Driver Interests` table
- [ ] Task: Configure linked record relationships between tables
- [ ] Test: Verify bi-directional links work correctly

### 1.3 Abstraction Layer Foundation

- [ ] Task: Create `src/backend/airtableClient.jsw` with core utilities
- [ ] Task: Implement `airtableRequest()` with rate limiting (5 req/sec)
- [ ] Task: Implement `toWixFormat()` transformation function
- [ ] Task: Implement `toAirtableFormat()` transformation function
- [ ] Task: Implement pagination helper `getAllRecords()`
- [ ] Task: Implement batch helper `bulkInsert()` (10 records max)
- [ ] Test: Verify rate limiting works under load
- [ ] Test: Verify field transformations preserve data types

### 1.4 Feature Flag System

- [ ] Task: Create `src/backend/config.jsw` with `DATA_SOURCE` object
- [ ] Task: Initialize all collections to `'wix'` (no change yet)
- [ ] Task: Document flag toggle procedure in CLAUDE.md

---

## Phase 2: Content & CMS Migration (Low Risk)

> **Goal**: Migrate read-heavy, low-risk content collections as proof-of-concept
>
> **Dependencies**: Phase 1 complete
>
> **Estimated Effort**: 2-3 days

### 2.1 Content Table Creation

- [ ] Task: Create `Blog Posts` table in Airtable
- [ ] Task: Create `Blog Categories` table in Airtable
- [ ] Task: Create `FAQs` table in Airtable
- [ ] Task: Create `Compliance Guides` table in Airtable
- [ ] Task: Create `Best Practices Guides` table in Airtable
- [ ] Task: Create `Pricing Tiers` table in Airtable
- [ ] Task: Create `Service Features` table in Airtable
- [ ] Task: Create `Case Studies` table in Airtable
- [ ] Task: Create `Industry Comparisons` table in Airtable

### 2.2 Content Data Export & Import

- [ ] Task: Export `BlogPosts` from Wix using query().find()
- [ ] Task: Transform and import to Airtable `Blog Posts`
- [ ] Task: Export and import `BlogCategories`
- [ ] Task: Export and import `FAQs`
- [ ] Task: Export and import `ComplianceGuides`
- [ ] Task: Export and import `BestPracticesGuides`
- [ ] Task: Export and import `PricingTiers`
- [ ] Task: Export and import `ServiceFeatures`
- [ ] Task: Export and import `CaseStudies`
- [ ] Task: Export and import `IndustryComparisons`
- [ ] Test: Verify record counts match

### 2.3 Content Service Update

- [ ] Task: Add content table functions to `airtableClient.jsw`
- [ ] Task: Update `contentService.jsw` to use airtableClient
- [ ] Task: Toggle `DATA_SOURCE.content` to `'airtable'`
- [ ] Test: Verify all content pages load correctly
- [ ] Test: Verify blog posts display with correct formatting

---

## Phase 3: Core Business Data Migration

> **Goal**: Migrate Carriers and DriverProfiles - the hub tables
>
> **Dependencies**: Phase 2 complete (validates migration process)
>
> **Estimated Effort**: 5-7 days

### 3.1 Carriers Migration

- [ ] Task: Export all `Carriers` records from Wix
- [ ] Task: Transform field names (snake_case -> Title Case)
- [ ] Task: Verify DOT numbers are preserved as numbers (not strings)
- [ ] Task: Import to Airtable `Carriers` table
- [ ] Task: Store Legacy Wix ID for each record
- [ ] Test: Verify record count matches
- [ ] Test: Verify DOT number lookups work

### 3.2 Driver Profiles Migration

- [ ] Task: Export all `DriverProfiles` records from Wix
- [ ] Task: Transform field names
- [ ] Task: Preserve `_owner` as `Wix Member ID` for auth linking
- [ ] Task: Import to Airtable `Driver Profiles` table
- [ ] Task: Store Legacy Wix ID for each record
- [ ] Test: Verify record count matches
- [ ] Test: Verify Wix Member ID lookups work

### 3.3 Supporting Tables Migration

- [ ] Task: Export and import `DriverJobs`
- [ ] Task: Export and import `CarrierHiringPreferences`
- [ ] Task: Export and import `DriverInterests`
- [ ] Task: Resolve any linked record references

### 3.4 Service Layer Updates

- [ ] Task: Add Carriers functions to `airtableClient.jsw`:
  - `getCarrierByDOT()`
  - `queryCarriers()`
  - `insertCarrier()`
  - `updateCarrier()`
- [ ] Task: Add Driver functions to `airtableClient.jsw`:
  - `getDriverById()`
  - `getDriverByWixMemberId()`
  - `queryDrivers()`
  - `insertDriver()`
  - `updateDriver()`
- [ ] Task: Update `carrierMatching.jsw` to use airtableClient
- [ ] Task: Update `driverMatching.jsw` to use airtableClient
- [ ] Task: Update `driverProfiles.jsw` to use airtableClient
- [ ] Task: Update `carrierAdminService.jsw` to use airtableClient
- [ ] Task: Toggle `DATA_SOURCE.carriers` to `'airtable'`
- [ ] Task: Toggle `DATA_SOURCE.drivers` to `'airtable'`

### 3.5 Parallel Testing

- [ ] Test: Run matching algorithm against both data sources
- [ ] Test: Verify match scores are identical
- [ ] Test: Verify profile lookups return same data
- [ ] Test: Verify admin dashboard loads carrier/driver stats

---

## Phase 4: Transaction & Matching Data Migration

> **Goal**: Migrate the bridge tables and analytics collections
>
> **Dependencies**: Phase 3 complete (Carriers and Drivers must exist first)
>
> **Estimated Effort**: 5-7 days

### 4.1 Transaction Table Creation

- [ ] Task: Create `Driver-Carrier Interests` table in Airtable
- [ ] Task: Create `Match Events` table in Airtable
- [ ] Task: Create `Carrier Driver Views` table in Airtable
- [ ] Task: Create `Profile Views` table in Airtable
- [ ] Task: Configure linked records to Carriers and Driver Profiles

### 4.2 Bridge Table Migration

- [ ] Task: Export `DriverCarrierInterests` from Wix
- [ ] Task: Build Wix ID -> Airtable ID mapping for Carriers
- [ ] Task: Build Wix ID -> Airtable ID mapping for Driver Profiles
- [ ] Task: Transform records with resolved linked record IDs
- [ ] Task: Import to Airtable (batch 10 at a time)
- [ ] Task: Store Legacy Wix ID for reference
- [ ] Test: Verify linked records resolve correctly
- [ ] Test: Verify bi-directional links show in both tables

### 4.3 Analytics Data Migration

- [ ] Task: Export `MatchEvents` from Wix
- [ ] Task: Import to Airtable `Match Events`
- [ ] Task: Export `CarrierDriverViews` from Wix
- [ ] Task: Import to Airtable `Carrier Driver Views`
- [ ] Task: Export `ProfileViews` from Wix
- [ ] Task: Import to Airtable `Profile Views`

### 4.4 Service Layer Updates

- [ ] Task: Add Interest functions to `airtableClient.jsw`:
  - `createInterest()`
  - `getInterestsByDriver()`
  - `getInterestsByCarrier()`
  - `updateInterestStatus()`
- [ ] Task: Update `applicationService.jsw` to use airtableClient
- [ ] Task: Update `admin_match_service.jsw` to use airtableClient
- [ ] Task: Update `recruiter_service.jsw` to use airtableClient
- [ ] Task: Update `driverOutreach.jsw` to use airtableClient
- [ ] Task: Toggle `DATA_SOURCE.interests` to `'airtable'`
- [ ] Test: Full application workflow (apply -> review -> hire)
- [ ] Test: Admin match analytics dashboard

---

## Phase 5: Communication & Billing Migration

> **Goal**: Migrate messaging and Stripe-related collections
>
> **Dependencies**: Phase 4 complete
>
> **Estimated Effort**: 4-5 days

### 5.1 Communication Tables

- [ ] Task: Create `Messages` table in Airtable
- [ ] Task: Create `Member Activity` table in Airtable
- [ ] Task: Export and import `Messages`
- [ ] Task: Export and import `MemberActivity`
- [ ] Task: Update `messaging.jsw` to use airtableClient
- [ ] Task: Update `messagingRealtime.jsw` to use airtableClient
- [ ] Task: Toggle `DATA_SOURCE.messages` to `'airtable'`
- [ ] Test: Send and receive messages in recruiter console
- [ ] Test: Message history loads correctly

### 5.2 Billing Tables

- [ ] Task: Create `Subscriptions` table in Airtable
- [ ] Task: Create `Billing History` table in Airtable
- [ ] Task: Create `Stripe Events` table in Airtable
- [ ] Task: Create `Checkout Abandonment` table in Airtable
- [ ] Task: Export and import `CarrierSubscriptions`
- [ ] Task: Export and import `BillingHistory`
- [ ] Task: Export and import `StripeEvents`
- [ ] Task: Export and import `CheckoutAbandonment`
- [ ] Task: Update `stripeService.jsw` to use airtableClient
- [ ] Task: Update `subscriptionService.jsw` to use airtableClient
- [ ] Task: Update `http-functions.js` webhook handler
- [ ] Task: Toggle `DATA_SOURCE.billing` to `'airtable'`
- [ ] Test: Stripe webhook processes and stores events
- [ ] Test: Subscription status checks work
- [ ] Test: Quota enforcement works correctly

### 5.3 Enrichment & Cache Tables

- [ ] Task: Create `Carrier Enrichments` table in Airtable
- [ ] Task: Create `FMCSA Safety Data` table in Airtable
- [ ] Task: Export and import `CarrierEnrichments`
- [ ] Task: Export and import `CarrierSafetyData`
- [ ] Task: Update `aiEnrichment.jsw` to use airtableClient
- [ ] Task: Update `fmcsaService.jsw` to use airtableClient
- [ ] Task: Toggle `DATA_SOURCE.enrichment` to `'airtable'`
- [ ] Test: TTL cache logic works (14-day for enrichments, 7-day for FMCSA)
- [ ] Test: Enrichment batch job processes correctly

### 5.4 Onboarding & Access Tables

- [ ] Task: Create `Partner Onboarding` table in Airtable
- [ ] Task: Create `Carrier Onboarding` table in Airtable
- [ ] Task: Create `Recruiter Carriers` table in Airtable
- [ ] Task: Create `Carrier Staffing Requests` table in Airtable
- [ ] Task: Export and import all onboarding collections
- [ ] Task: Update `carrierLeadsService.jsw` to use airtableClient
- [ ] Task: Update `carrierPreferences.jsw` to use airtableClient
- [ ] Task: Toggle `DATA_SOURCE.onboarding` to `'airtable'`
- [ ] Test: Partner onboarding flow works
- [ ] Test: Carrier staffing form submissions work

---

## Phase 6: Validation & Cutover

> **Goal**: Final testing, documentation, and production cutover
>
> **Dependencies**: Phases 1-5 complete
>
> **Estimated Effort**: 5-7 days

### 6.1 Administration & Logging Tables

- [ ] Task: Create `Audit Log` table in Airtable
- [ ] Task: Create `AI Usage Log` table in Airtable
- [ ] Task: Create `System Logs` table in Airtable
- [ ] Task: Create `Job Postings` table in Airtable
- [ ] Task: Create `Prompt Library` table in Airtable
- [ ] Task: Create remaining admin tables (TeamMembers, CompanyMilestones)
- [ ] Task: Export and import all admin collections
- [ ] Task: Update `admin_audit_service.jsw` to use airtableClient
- [ ] Task: Update `admin_dashboard_service.jsw` to use airtableClient
- [ ] Task: Update `observabilityService.jsw` to use airtableClient
- [ ] Task: Toggle `DATA_SOURCE.admin` to `'airtable'`

### 6.2 Reviews & Testimonials

- [ ] Task: Create `Carrier Reviews` table in Airtable
- [ ] Task: Create `Carrier Testimonials` table in Airtable
- [ ] Task: Create `Driver Testimonials` table in Airtable
- [ ] Task: Export and import all review collections
- [ ] Task: Update `admin_content_service.jsw` to use airtableClient
- [ ] Task: Toggle `DATA_SOURCE.reviews` to `'airtable'`

### 6.3 Full Regression Testing

- [ ] Test: Driver registration and profile completion flow
- [ ] Test: Driver job search and application flow
- [ ] Test: Recruiter login and driver search flow
- [ ] Test: Recruiter messaging with drivers
- [ ] Test: Carrier onboarding flow
- [ ] Test: Subscription upgrade/downgrade flow
- [ ] Test: Admin dashboard all statistics
- [ ] Test: Admin audit log captures actions
- [ ] Test: Content pages load correctly
- [ ] Test: API response times < 500ms P95

### 6.4 Performance Benchmarking

- [ ] Task: Benchmark carrier search queries
- [ ] Task: Benchmark driver matching algorithm
- [ ] Task: Benchmark message retrieval
- [ ] Task: Document baseline performance metrics
- [ ] Test: No rate limit 429 errors under normal load

### 6.5 Documentation & Cleanup

- [ ] Task: Update CLAUDE.md with new data architecture
- [ ] Task: Document Airtable base ID and API key locations
- [ ] Task: Document rollback procedure
- [ ] Task: Archive Wix collections (set to read-only)
- [ ] Task: Remove Wix Data fallback code after 30-day stability
- [ ] Task: Update tracks.md to mark track as implemented

### 6.6 Monitoring Setup

- [ ] Task: Create Airtable dashboard view for record counts
- [ ] Task: Set up alerting for 50K record limits
- [ ] Task: Monitor API error rates for first 2 weeks
- [ ] Task: Schedule weekly data integrity checks

---

## Rollback Checkpoints

### Per-Phase Rollback

Each phase can be rolled back independently by:
1. Setting `DATA_SOURCE.{collection}` back to `'wix'`
2. Data remains in both systems until cleanup

### Full Rollback

If critical issues require full rollback:
1. Set all `DATA_SOURCE` values to `'wix'`
2. Wix collections preserved as backup
3. Review and resolve issues before retry

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Rate limiting causes timeouts | Implemented 200ms delay, retry on 429 |
| Linked records break | Legacy Wix ID stored for re-resolution |
| Type conversion errors | DOT number validated as Number before all queries |
| Data loss | Wix collections kept as backup for 30 days |
| Performance regression | Feature flags allow instant per-collection rollback |

---

## Phase 7: Service Refactoring - VERY HIGH Impact (8 files)

> **Goal**: Refactor the 8 most complex backend services with highest wixData usage
>
> **Dependencies**: Phases 1-6 complete (all collections migrated)
>
> **Estimated Effort**: 3-4 weeks

### 7.1 admin_dashboard_service.jsw (44 operations, 9 collections)

- [ ] Task: Audit all 44 wixData operations in file
- [ ] Task: Create airtableClient functions for dashboard aggregations
- [ ] Task: Implement count query translations (Airtable doesn't have native count)
- [ ] Task: Refactor `getSystemStats()` to use airtableClient
- [ ] Task: Refactor `getRecentActivity()` to use airtableClient
- [ ] Task: Refactor `getAlerts()` to use airtableClient
- [ ] Task: Refactor `getAIUsageStats()` to use airtableClient
- [ ] Task: Refactor `getHealthMetrics()` to use airtableClient
- [ ] Task: Add DATA_SOURCE feature flag checks
- [ ] Test: Verify all dashboard widgets load correctly
- [ ] Test: Verify stats accuracy matches Wix baseline

### 7.2 admin_service.jsw (36 operations, 6 collections)

- [ ] Task: Audit all 36 wixData operations in file
- [ ] Task: Refactor multi-field `.or()` search chains to Airtable OR() formula
- [ ] Task: Refactor `searchDrivers()` with complex filters
- [ ] Task: Refactor `searchCarriers()` with complex filters
- [ ] Task: Refactor `getDriverDetails()` to use airtableClient
- [ ] Task: Refactor `updateDriverStatus()` to use airtableClient
- [ ] Task: Refactor `bulkUpdateDrivers()` with batch limits (10 max)
- [ ] Task: Add DATA_SOURCE feature flag checks
- [ ] Test: Verify admin search returns same results
- [ ] Test: Verify bulk operations complete without errors

### 7.3 carrierAdminService.jsw (30 operations, 6 collections)

- [ ] Task: Audit all 30 wixData operations in file
- [ ] Task: Refactor DOT number lookups (ensure Number type)
- [ ] Task: Refactor `getCarrierWithEnrichment()` to use airtableClient
- [ ] Task: Refactor `updateCarrierEnrichment()` to use airtableClient
- [ ] Task: Refactor `getCarrierSafetyData()` to use airtableClient
- [ ] Task: Refactor `linkCarrierToFMCSA()` to use airtableClient
- [ ] Task: Add DATA_SOURCE feature flag checks
- [ ] Test: Verify FMCSA data flows correctly
- [ ] Test: Verify enrichment cache TTL works

### 7.4 recruiter_service.jsw (28 operations, 5 collections)

- [ ] Task: Audit all 28 wixData operations in file
- [ ] Task: Refactor `getRecruiterCarriers()` linked record queries
- [ ] Task: Refactor `getDriverPipeline()` to use airtableClient
- [ ] Task: Refactor `saveDriverToPipeline()` to use airtableClient
- [ ] Task: Refactor `getOutreachHistory()` to use airtableClient
- [ ] Task: Refactor access control queries (recruiterCarriers)
- [ ] Task: Add DATA_SOURCE feature flag checks
- [ ] Test: Verify recruiter can only see authorized carriers
- [ ] Test: Verify pipeline saves and loads correctly

### 7.5 featureAdoptionService.jsw (28 operations, 4 collections)

- [ ] Task: Audit all 28 wixData operations in file
- [ ] Task: Refactor `logFeatureEvent()` to use airtableClient
- [ ] Task: Refactor `getFeatureMetrics()` aggregations
- [ ] Task: Refactor `getFunnelAnalytics()` to use airtableClient
- [ ] Task: Refactor `getHealthScore()` calculations
- [ ] Task: Handle high-volume event logging (consider batching)
- [ ] Task: Add DATA_SOURCE feature flag checks
- [ ] Test: Verify feature tracking captures all events
- [ ] Test: Verify analytics dashboard accuracy

### 7.6 onboardingWorkflowService.jsw (27 operations, 7 collections)

- [ ] Task: Audit all 27 wixData operations in file
- [ ] Task: Refactor stateful workflow queries
- [ ] Task: Refactor `getOnboardingStatus()` to use airtableClient
- [ ] Task: Refactor `advanceOnboardingStep()` to use airtableClient
- [ ] Task: Refactor `completeOnboarding()` to use airtableClient
- [ ] Task: Handle 7-collection transaction consistency
- [ ] Task: Add DATA_SOURCE feature flag checks
- [ ] Test: Verify full onboarding flow works
- [ ] Test: Verify state transitions are atomic

### 7.7 admin_match_service.jsw (26 operations, 3 collections)

- [ ] Task: Audit all 26 wixData operations in file
- [ ] Task: Refactor time-based analytics queries
- [ ] Task: Refactor `getMatchAnalytics()` to use airtableClient
- [ ] Task: Refactor `getMatchHistory()` with date filters
- [ ] Task: Refactor `getDriverInterestTracking()` to use airtableClient
- [ ] Task: Translate date range filters to Airtable formulas
- [ ] Task: Add DATA_SOURCE feature flag checks
- [ ] Test: Verify match analytics accuracy
- [ ] Test: Verify date filtering works correctly

### 7.8 promptLibraryService.jsw (19 operations, 1 collection)

- [ ] Task: Audit all 19 wixData operations in file
- [ ] Task: Refactor `getPrompts()` to use airtableClient
- [ ] Task: Refactor `savePrompt()` to use airtableClient
- [ ] Task: Refactor `getPromptVersionHistory()` to use airtableClient
- [ ] Task: Refactor `categorizePrompts()` to use airtableClient
- [ ] Task: Add DATA_SOURCE feature flag checks
- [ ] Test: Verify prompt CRUD operations work
- [ ] Test: Verify version history preserved

---

## Phase 8: Service Refactoring - HIGH Impact (6 files)

> **Goal**: Refactor core matching and profile services
>
> **Dependencies**: Phase 7 complete
>
> **Estimated Effort**: 2-3 weeks

### 8.1 driverMatching.jsw (18 operations)

- [ ] Task: Audit all 18 wixData operations
- [ ] Task: Refactor scoring algorithm queries
- [ ] Task: Refactor `searchDriversForCarrier()` to use airtableClient
- [ ] Task: Refactor `calculateMatchScore()` data fetches
- [ ] Task: Refactor tier limit enforcement queries
- [ ] Task: Add DATA_SOURCE feature flag checks
- [ ] Test: Verify match scores identical to baseline
- [ ] Test: Verify tier limits enforced correctly

### 8.2 carrierMatching.jsw (16 operations)

- [ ] Task: Audit all 16 wixData operations
- [ ] Task: Refactor weighted scoring queries
- [ ] Task: Refactor `getMatchesForDriver()` to use airtableClient
- [ ] Task: Refactor enrichment cache lookups
- [ ] Task: Refactor carrier preference loading
- [ ] Task: Add DATA_SOURCE feature flag checks
- [ ] Test: Verify match results identical
- [ ] Test: Verify cache TTL works

### 8.3 applicationService.jsw (15 operations)

- [ ] Task: Audit all 15 wixData operations
- [ ] Task: Refactor `submitApplication()` to use airtableClient
- [ ] Task: Refactor `getApplicationsByDriver()` to use airtableClient
- [ ] Task: Refactor `updateApplicationStatus()` to use airtableClient
- [ ] Task: Refactor status lifecycle state machine
- [ ] Task: Add DATA_SOURCE feature flag checks
- [ ] Test: Full application flow (apply → review → hire)
- [ ] Test: Verify status transitions work

### 8.4 driverProfiles.jsw (14 operations)

- [ ] Task: Audit all 14 wixData operations
- [ ] Task: Refactor `getDriverProfile()` to use airtableClient
- [ ] Task: Refactor `updateDriverProfile()` to use airtableClient
- [ ] Task: Refactor `calculateProfileCompleteness()` to use airtableClient
- [ ] Task: Refactor Wix Member ID lookups
- [ ] Task: Add DATA_SOURCE feature flag checks
- [ ] Test: Verify profile CRUD works
- [ ] Test: Verify completeness score accurate

### 8.5 memberService.jsw (12 operations)

- [ ] Task: Audit all 12 wixData operations
- [ ] Task: Refactor dashboard aggregations
- [ ] Task: Refactor `getMemberSummary()` to use airtableClient
- [ ] Task: Refactor `getNotifications()` to use airtableClient
- [ ] Task: Refactor `getActivityHistory()` to use airtableClient
- [ ] Task: Add DATA_SOURCE feature flag checks
- [ ] Test: Verify member dashboard loads
- [ ] Test: Verify notifications display

### 8.6 admin_audit_service.jsw (11 operations)

- [ ] Task: Audit all 11 wixData operations
- [ ] Task: Refactor append-only audit log writes
- [ ] Task: Refactor `logAuditEvent()` to use airtableClient
- [ ] Task: Refactor `getAuditHistory()` with filters
- [ ] Task: Handle high-volume logging (batch inserts)
- [ ] Task: Add DATA_SOURCE feature flag checks
- [ ] Test: Verify all actions logged
- [ ] Test: Verify audit trail queryable

---

## Phase 9: Service Refactoring - MEDIUM Impact (17 files)

> **Goal**: Refactor all medium-complexity services
>
> **Dependencies**: Phase 8 complete
>
> **Estimated Effort**: 3-4 weeks

### 9.1 Subscription & Billing Services

- [ ] Task: Refactor `subscriptionService.jsw` (10 operations)
  - [ ] `getSubscriptionStatus()` to airtableClient
  - [ ] `checkQuota()` to airtableClient
  - [ ] `recordUsage()` to airtableClient
- [ ] Task: Refactor `stripeService.jsw` (9 operations)
  - [ ] `upsertSubscription()` to airtableClient
  - [ ] `getStripeCustomer()` to airtableClient
  - [ ] Idempotency checks to airtableClient
- [ ] Test: Verify subscription flow works
- [ ] Test: Verify quota enforcement works

### 9.2 Communication Services

- [ ] Task: Refactor `messaging.jsw` (9 operations)
  - [ ] `sendMessage()` to airtableClient
  - [ ] `getConversation()` to airtableClient
  - [ ] Permission validation queries
- [ ] Task: Refactor `messagingRealtime.jsw` (2 operations)
  - [ ] Timestamp-based polling queries
- [ ] Task: Refactor `emailService.jsw` (6 operations)
- [ ] Test: Verify messaging works end-to-end

### 9.3 Enrichment & Intelligence Services

- [ ] Task: Refactor `aiEnrichment.jsw` (8 operations)
  - [ ] Cache lookups/writes
  - [ ] Enrichment status updates
- [ ] Task: Refactor `fmcsaService.jsw` (7 operations)
  - [ ] Safety data cache
  - [ ] DOT number lookups
- [ ] Task: Refactor `socialScanner.jsw` (7 operations)
- [ ] Task: Refactor `csaMonitorService.jsw` (4 operations)
- [ ] Test: Verify enrichment pipeline works
- [ ] Test: Verify cache TTL enforcement

### 9.4 Recruiter & Outreach Services

- [ ] Task: Refactor `recruiterStats.jsw` (5 operations)
- [ ] Task: Refactor `interviewScheduler.jsw` (5 operations)
- [ ] Task: Refactor `driverOutreach.jsw` (5 operations)
- [ ] Task: Refactor `retentionService.jsw` (8 operations)
- [ ] Test: Verify recruiter features work

### 9.5 Content & Lead Services

- [ ] Task: Refactor `contentService.jsw` (5 operations)
- [ ] Task: Refactor `carrierLeadsService.jsw` (6 operations)
- [ ] Task: Refactor `carrierPreferences.jsw` (4 operations)
- [ ] Test: Verify content pages load
- [ ] Test: Verify lead capture works

### 9.6 Utility Services

- [ ] Task: Refactor `ocrService.jsw` (4 operations)
- [ ] Task: Refactor `observabilityService.jsw` (4 operations)
- [ ] Test: Verify OCR document processing
- [ ] Test: Verify logging works

---

## Phase 10: Service Refactoring - LOW Impact (13 files)

> **Goal**: Refactor remaining services
>
> **Dependencies**: Phase 9 complete
>
> **Estimated Effort**: 1-2 weeks

### 10.1 Operational Services

- [ ] Task: Refactor `parkingService.jsw` (3 operations)
- [ ] Task: Refactor `fuelService.jsw` (3 operations)
- [ ] Task: Refactor `publicStatsService.jsw` (3 operations)
- [ ] Test: Verify road utilities work

### 10.2 Background Services

- [ ] Task: Refactor `scheduler.jsw` (2 operations)
- [ ] Task: Refactor `abandonmentEmailService.jsw` (2 operations)
- [ ] Task: Refactor `aiRouterService.jsw` (1 operation)
- [ ] Test: Verify scheduled jobs run

### 10.3 Setup & Migration Services

- [ ] Task: Review `setupCollections.jsw` - may need full rewrite
- [ ] Task: Review migration scripts in `migrations/` folder
- [ ] Task: Update any remaining minor services
- [ ] Test: Verify setup utilities work

---

## Phase 11: Page Code Migration (9 files)

> **Goal**: Update all Wix page code files that directly use wixData
>
> **Dependencies**: Backend services refactored (Phases 7-10)
>
> **Estimated Effort**: 1-2 weeks

### 11.1 High-Priority Pages (WRITE operations)

- [ ] Task: Refactor `Rapid Response - Job Description.*.js`
  - [ ] Move INSERT operation to backend service call
  - [ ] Use postMessage to call backend
  - [ ] Remove direct wixData import
- [ ] Test: Verify rapid response form submits correctly

### 11.2 Driver-Facing Pages

- [ ] Task: Refactor `Driver Dashboard.*.js`
  - [ ] Replace wixData.query with backend service calls
  - [ ] Update data binding to use service responses
- [ ] Task: Refactor `Job Search.*.js`
  - [ ] Move carrier/job queries to backend
- [ ] Task: Refactor `Application Status.*.js`
  - [ ] Move interest queries to backend
- [ ] Test: Verify driver dashboard loads
- [ ] Test: Verify job search works
- [ ] Test: Verify application status displays

### 11.3 Recruiter-Facing Pages

- [ ] Task: Refactor `Recruiter Dashboard.*.js`
  - [ ] Replace direct queries with service calls
- [ ] Task: Refactor `Carrier Directory.*.js`
  - [ ] Move carrier queries to backend
- [ ] Test: Verify recruiter features work

### 11.4 Content Pages

- [ ] Task: Refactor `Blog.*.js`
  - [ ] Move content queries to contentService
- [ ] Task: Refactor `Pricing.*.js`
  - [ ] Move pricing data to backend
- [ ] Task: Refactor `FAQ.*.js`
  - [ ] Move FAQ queries to backend
- [ ] Test: Verify content pages load

---

## Phase 12: HTML Component Migration (43 files)

> **Goal**: Update field names in all HTML components for Airtable compatibility
>
> **Dependencies**: Phase 11 complete
>
> **Estimated Effort**: 2-3 weeks

### 12.1 Field Mapping Strategy

- [ ] Task: Create `fieldMappings.js` in `src/public/js/`
- [ ] Task: Document all snake_case → Title Case mappings
- [ ] Task: Create helper function `toDisplayFormat(data, collection)`
- [ ] Task: Create helper function `toBackendFormat(data, collection)`

### 12.2 Admin HTML Files (10 files)

- [ ] Task: Update `ADMIN_DASHBOARD.html` field references
- [ ] Task: Update `ADMIN_DRIVERS.html` field references
- [ ] Task: Update `ADMIN_CARRIERS.html` field references
- [ ] Task: Update `ADMIN_MATCHES.html` field references
- [ ] Task: Update `ADMIN_AUDIT.html` field references
- [ ] Task: Update `ADMIN_AI_ROUTER.html` field references
- [ ] Task: Update `ADMIN_CONTENT.html` field references
- [ ] Task: Update `ADMIN_BILLING.html` field references
- [ ] Task: Update `ADMIN_SETTINGS.html` field references
- [ ] Task: Update `ADMIN_ANALYTICS.html` field references
- [ ] Test: Verify all admin panels display data correctly

### 12.3 Recruiter HTML Files (9 files)

- [ ] Task: Update `RecruiterDashboard.html` field references
- [ ] Task: Update `RecruiterDriverSearch.html` field references
- [ ] Task: Update `RecruiterPipeline.html` field references
- [ ] Task: Update `RecruiterMessaging.html` field references
- [ ] Task: Update `RecruiterAnalytics.html` field references
- [ ] Task: Update `RecruiterCarrierSelect.html` field references
- [ ] Task: Update `RecruiterOnboarding.html` field references
- [ ] Task: Update `RecruiterSettings.html` field references
- [ ] Task: Update `RecruiterTelemetry.html` field references
- [ ] Test: Verify all recruiter features work

### 12.4 Driver HTML Files (5 files)

- [ ] Task: Update `DRIVER_DASHBOARD.html` field references
- [ ] Task: Update `DRIVER_PROFILE.html` field references
- [ ] Task: Update `DRIVER_APPLICATIONS.html` field references
- [ ] Task: Update `DRIVER_ROAD_UTILITIES.html` field references
- [ ] Task: Update `AI_MATCHING.html` field references
- [ ] Test: Verify driver dashboard and features work

### 12.5 Carrier HTML Files (4 files)

- [ ] Task: Update `CarrierOnboarding.html` field references
- [ ] Task: Update `CarrierPreferences.html` field references
- [ ] Task: Update `CarrierDirectory.html` field references
- [ ] Task: Update `CarrierProfile.html` field references
- [ ] Test: Verify carrier features work

### 12.6 Landing & Utility HTML Files (15 files)

- [ ] Task: Update all landing page forms with field mappings
- [ ] Task: Update `_TEMPLATE_Carrier_Staffing_Form.html`
- [ ] Task: Update utility components (sidebars, modals)
- [ ] Test: Verify all forms submit correctly
- [ ] Test: Verify landing pages display data

---

## Phase 13: Scheduled Jobs & Webhooks Migration

> **Goal**: Migrate all background jobs and webhook handlers
>
> **Dependencies**: Phase 12 complete
>
> **Estimated Effort**: 1-2 weeks

### 13.1 Scheduled Jobs (jobs.config)

- [ ] Task: Update `runEnrichmentBatch` job
  - [ ] Modify to use airtableClient for CarrierEnrichments
  - [ ] Verify rate limiting with Airtable API limits
- [ ] Task: Update `runBackfillMigration` job
  - [ ] Modify to use airtableClient for DriverProfiles
- [ ] Task: Update `processAbandonmentEmails` job
  - [ ] Modify to use airtableClient for CheckoutAbandonment
- [ ] Task: Update `updateCSAScores` job (if exists)
  - [ ] Modify to use airtableClient for CarrierSafetyData
- [ ] Task: Update `sendComplianceReminders` job (if exists)
- [ ] Task: Update `generateLeaderboards` job (if exists)
- [ ] Task: Update `cleanupExpiredCache` job (if exists)
- [ ] Test: Run each job manually and verify completion
- [ ] Test: Verify scheduled execution works

### 13.2 Stripe Webhook Handler (http-functions.js)

- [ ] Task: Update `checkout.session.completed` handler
  - [ ] Create subscription in Airtable
  - [ ] Verify idempotency with Airtable StripeEvents
- [ ] Task: Update `invoice.paid` handler
  - [ ] Reset quotas in Airtable ProfileViews
  - [ ] Update subscription in Airtable
- [ ] Task: Update `invoice.payment_failed` handler
- [ ] Task: Update `customer.subscription.updated` handler
- [ ] Task: Update `customer.subscription.deleted` handler
- [ ] Task: Update `charge.refunded` handler
- [ ] Task: Update `payment_intent.succeeded` handler
- [ ] Task: Update `checkout.session.expired` handler
- [ ] Test: Use Stripe CLI to test each webhook event
- [ ] Test: Verify idempotency prevents duplicates
- [ ] Test: Verify subscription status updates correctly

### 13.3 Other Event Handlers

- [ ] Task: Review any other HTTP functions for wixData usage
- [ ] Task: Update notification handlers if applicable
- [ ] Task: Update any real-time polling endpoints
- [ ] Test: Verify all event-driven flows work

---

## Phase 14: Final Validation & Production Cutover

> **Goal**: Complete testing, documentation, and production deployment
>
> **Dependencies**: All previous phases complete
>
> **Estimated Effort**: 2-3 weeks

### 14.1 Comprehensive Regression Testing

- [ ] Test: Driver registration → profile completion → job search → apply
- [ ] Test: Recruiter login → driver search → message → interview → hire
- [ ] Test: Carrier onboarding → preferences → staffing request
- [ ] Test: Subscription purchase → tier enforcement → quota tracking
- [ ] Test: Admin dashboard → all analytics → audit trail
- [ ] Test: Content management → blog → FAQs → guides
- [ ] Test: Scheduled jobs → enrichment → CSA → abandonment emails
- [ ] Test: Webhooks → Stripe events → subscription lifecycle

### 14.2 Performance Benchmarking

- [ ] Task: Benchmark carrier search response times
- [ ] Task: Benchmark driver matching algorithm
- [ ] Task: Benchmark admin dashboard load time
- [ ] Task: Benchmark message retrieval
- [ ] Task: Document baseline vs Airtable performance
- [ ] Test: All endpoints < 500ms P95
- [ ] Test: No rate limit 429 errors under normal load

### 14.3 Data Integrity Verification

- [ ] Task: Compare record counts: Wix vs Airtable
- [ ] Task: Spot-check 100 random records for accuracy
- [ ] Task: Verify all linked records resolve correctly
- [ ] Task: Verify all date fields preserved correctly
- [ ] Task: Verify all numeric fields (especially DOT numbers)

### 14.4 Documentation Updates

- [ ] Task: Update CLAUDE.md with new architecture
- [ ] Task: Update GEMINI.md with data layer changes
- [ ] Task: Document airtableClient.jsw API
- [ ] Task: Document field mappings reference
- [ ] Task: Document rollback procedures
- [ ] Task: Create troubleshooting guide

### 14.5 Production Cutover

- [ ] Task: Schedule maintenance window
- [ ] Task: Enable all DATA_SOURCE flags to 'airtable'
- [ ] Task: Monitor error rates for 24 hours
- [ ] Task: Monitor performance for 48 hours
- [ ] Task: Address any issues immediately
- [ ] Task: Begin 30-day stability period

### 14.6 Post-Migration Cleanup (After 30 days)

- [ ] Task: Archive Wix collections (read-only)
- [ ] Task: Remove feature flag fallback code
- [ ] Task: Remove wixData imports from refactored services
- [ ] Task: Delete migration scripts
- [ ] Task: Update track status to COMPLETE
- [ ] Task: Celebrate! 🎉
