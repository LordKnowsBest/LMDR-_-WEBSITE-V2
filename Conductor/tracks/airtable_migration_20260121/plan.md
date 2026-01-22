# Track Plan: Airtable Migration - Scalable Data Architecture

> **STATUS: PLANNED** - Ready for implementation.
>
> **Last Updated**: 2026-01-21
>
> **Specification**: See `spec.md` for technical details

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
