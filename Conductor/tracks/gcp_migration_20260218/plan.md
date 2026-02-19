# Track Plan: GCP Database Migration (Airtable to GCP)

> **STATUS: PLANNING**
>
> **Last Updated**: 2026-02-18 (Gap Analysis Revision)
>
> **Specification**: See `spec.md` for technical details
>
> **Gap Analysis**: See `gap_analysis.md` for full gap analysis with Wix official docs and CLAUDE.md audit

---

> [!IMPORTANT]
> **Architecture Correction (2026-02-18):** The original plan used a custom Cloud Function bridge.  
> Per the [official Wix GCP integration docs](https://dev.wix.com/docs/develop-websites/articles/databases/external-databases/google/integrate-your-google-cloud-platform-databases-with-your-wix-site),  
> the correct pattern is a **prebuilt Cloud Run adaptor** (`velo-external-db` image) + **Wix External Database Collections**.  
> Firestore is **NOT** supported by the Wix adaptor. Replace with Cloud SQL (Postgres) and/or Cloud Spanner.

---

## Frozen Collections (Never Migrate to GCP)

The following collections **must stay in Wix** and are excluded from all migration phases:

| Collection | Reason |
|------------|--------|
| `AdminUsers` | Auth/permissions — Wix system dependency |
| `MemberNotifications` | Wix member system integration |
| `memberBadges` | `Members/Badges` system collection |
| `memberPrivateData` | `Members/PrivateMembersData` system collection |

---

## Phase 1: GCP Infrastructure Setup (Low Risk)

> **Goal**: Provision GCP resources and deploy the official Wix DB adaptor via Cloud Run
>
> **Dependencies**: GCP Project Setup, Wix Premium Plan (required for External Collections)
>
> **Estimated Effort**: 3-5 days

### 1.1 GCP Project & IAM
- [ ] Task: Create GCP Project `lmdr-prod-db`
- [ ] Task: Enable Cloud SQL API and provision PostgreSQL instance (`db-custom-1-3840`, Postgres 15)
- [ ] Task: Enable Cloud Spanner API (for real-time messaging — replaces Firestore)
- [ ] Task: Create BigQuery Dataset `lmdr_analytics`
- [ ] Task: Create Service Account `wix-bridge-sa` with roles:
  - `Secret Manager Secret Accessor` (all databases)
  - `Cloud SQL Editor` (Postgres)
  - `BigQuery Admin` (BigQuery)
  - `Cloud Spanner Database User` (Spanner)
- [ ] Task: Set up GCP Billing budget alert at $100/month threshold

### 1.2 GCP Secret Manager — Secrets Setup
- [ ] Task: Create `SECRET_KEY` secret (shared key for Wix ↔ adaptor authentication)
- [ ] Task: Create `PERMISSIONS` secret (JSON file defining role-based read/write per table — `Member`/`Visitor`/`Admin`)
- [ ] Task: Create `USER`, `PASSWORD`, `DB`, `CLOUD_SQL_CONNECTION_NAME` secrets for Cloud SQL (Postgres)
- [ ] Task: Create `DATABASE_ID`, `PROJECT_ID` secrets for BigQuery
- [ ] Task: Create `INSTANCE_ID`, `PROJECT_ID` secrets for Cloud Spanner

### 1.3 Cloud Run Adaptor Deployment (Official Wix Pattern)
- [ ] Task: Deploy Cloud Run service using the **Wix prebuilt container image** (`velo-external-db`)
  - Container image URL: from Wix docs (select correct DB type)
  - Autoscaling: All
  - Authentication: Allow unauthenticated invocations (Wix auth handled via `SECRET_KEY`)
- [ ] Task: Create a new Service Account for the Cloud Run service (name = Cloud Run instance name)
- [ ] Task: Grant `Secret Manager Secret Accessor` and appropriate DB roles to the service account
- [ ] Task: Configure environment variables on Cloud Run service:
  - `NAME` = `postgres` (the database type)
  - `CLOUD_VENDOR` = `gcp`
  - Mount all secrets from Secret Manager as environment variables (latest version)
- [ ] Task: Deploy the container and capture the Cloud Run service URL
- [ ] Test: Run `curl` test against Cloud Run URL with SECRET_KEY to verify table listing response

### 1.4 Wix External Collection Registration
- [ ] Task: In Wix Editor Code Sidebar → External Databases → Add external database
  - Cloud Provider: Google Cloud
  - Namespace: `gcp_carriers` (for Carriers namespace)
  - Endpoint URL: Cloud Run service URL
  - Secret Key: value from Secret Manager `SECRET_KEY`
- [ ] Task: Register additional namespaces for each data domain (drivers, messages, analytics)
- [ ] Test: Confirm collections appear under "External Databases" in Wix CMS

---

## Phase 2: Data Abstraction Layer Update (Medium Risk)

> **Goal**: Update `dataAccess.jsw` and `configData.js` to route to GCP external collections
>
> **Dependencies**: Phase 1 complete (External Collections registered in Wix)
>
> **Estimated Effort**: 2-3 days

### 2.1 configData.js Updates
- [ ] Task: Add `GCP_MIGRATION_STATUS` feature flag (global `'off'` | `'dual'` | `'gcp'` toggle)
- [ ] Task: Add `getGcpCollectionName(collectionKey)` helper returning `'namespace/tableName'` format
- [ ] Task: Map all 65+ collection keys to their GCP namespaced equivalent (align with Phase 4-5 table builds)

### 2.2 dataAccess.jsw Updates
- [ ] Task: Update `queryRecords()`, `insertRecord()`, `updateRecord()`, `deleteRecord()` to check `GCP_MIGRATION_STATUS`
  - `'off'`: Route to Airtable only (current behavior)
  - `'dual'`: Write to Airtable (sync) + GCP (async, fire-and-forget)
  - `'gcp'`: Route to GCP external collection via native `wixData.query('namespace/tableName')`
- [ ] Task: Implement fire-and-forget async GCP write helper:
  ```javascript
  // Write to GCP async (non-blocking)
  gcpWrite(collectionKey, data).catch(err =>
    console.error('[GCP dual-write error]', err)
  );
  ```
- [ ] Task: Add `suppressAuth: true` support for GCP external collection queries (backend-initiated)
- [ ] Test: Unit test dual-write with mocked Airtable and GCP responses

### 2.3 ID Mapping Strategy (Critical for Backfill)
- [ ] Task: Create `v2_ID_Mapping` Airtable table: `{ airtable_record_id, gcp_uuid, collection_name, migrated_at }`
- [ ] Task: Build `generateDeterministicUUID(airtableRecordId)` utility (UUID v5, seeded from RecordID)
- [ ] Task: Create `idMappingService.jsw` with `getOrCreateMapping(airtableId, collectionKey)` and `lookupGcpId(airtableId)`

---

## Phase 3: Cloud SQL Schema Design (Foundation for Phases 4-5)

> **Goal**: Design all Cloud SQL schemas with Wix-required columns before data migration begins
>
> **Dependencies**: Phase 2 complete
>
> **Estimated Effort**: 1-2 days

### 3.1 Required Columns for All Read-Write Tables
Every Cloud SQL table that needs read-write access from Wix **MUST** include:
```sql
_id           VARCHAR(36) PRIMARY KEY,  -- UUID (Wix requirement)
_createdDate  TIMESTAMP NOT NULL,
_updatedDate  TIMESTAMP NOT NULL,
_owner        VARCHAR(128)              -- Wix member ID
```
Tables without these columns will be **read-only** in Wix CMS.

### 3.2 Schema Definitions
- [ ] Task: Create schema for `carriers` table (Postgres):
  - Columns: `_id`, `_createdDate`, `_updatedDate`, `_owner`, `dot_number`, `company_name`, `combined_score`, `state`, `num_trucks`, `pay_per_mile`, `home_time`, `freight_type`, `is_enriched`, `last_enriched_at`
  - Indexes: `dot_number` (unique), `combined_score` (DESC), `state`
- [ ] Task: Create schema for `driver_profiles` table (Postgres):
  - Columns: `_id`, `_createdDate`, `_updatedDate`, `_owner`, `member_id`, `cdl_class`, `years_experience`, `home_state`, `freight_preference`, `docs_submitted`, `is_searchable`, `visibility_level`
  - Indexes: `member_id` (unique), `is_searchable`, `cdl_class`
- [ ] Task: Create schema for `driver_jobs` and `driver_applications` tables
- [ ] Task: Create schema for `carrier_subscriptions` and `matching_scores` tables
- [ ] Task: Define BigQuery tables (analytics — read-only, no Wix columns needed): `system_logs`, `system_traces`, `ai_usage_log`, `audit_log`, `match_events`
- [ ] Task: Define Cloud Spanner table for `messages` (real-time capable, multi-region)

---

## Phase 4: Content & Low-Risk Data Migration (Safe Test — Cloud SQL)

> **Goal**: Migrate low-risk content tables to validate GCP flow end-to-end
>
> **Dependencies**: Phase 3 complete
>
> **Estimated Effort**: 2-3 days

### 4.1 Content Table Backfill
- [ ] Task: Create `faqs`, `blog_posts`, `compliance_guides` tables in Cloud SQL (Postgres)
- [ ] Task: Run backfill script: Airtable `v2_FAQs` → Postgres `faqs` (using ID mapping)
- [ ] Test: Verify row counts match between Airtable and Cloud SQL after backfill
- [ ] Test: Verify content page (`/compliance`) loads correctly after setting `DATA_SOURCE.content = 'gcp'`

### 4.2 Dual-Write Enablement & Cutover
- [ ] Task: Set `GCP_MIGRATION_STATUS = 'dual'` for content collections in `configData.js`
- [ ] Task: Monitor dual-write latency in `observabilityService.jsw` (target: <200ms overhead)
- [ ] Task: Set `GCP_MIGRATION_STATUS = 'gcp'` for content collections after 48h of clean dual-write
- [ ] Test: Wix External Collection namespace shows content tables with data in CMS

---

## Phase 5: Core Operational Data Migration (High Risk — Cloud SQL)

> **Goal**: Migrate Carriers and Driver Profiles to Cloud SQL
>
> **Dependencies**: Phase 4 successful
>
> **Estimated Effort**: 5-7 days

### 5.1 Core Data Backfill
- [ ] Task: Export Airtable `v2_Carriers` → Cloud SQL `carriers` (using ID mapping for FK resolution)
- [ ] Task: Export Airtable `v2_Driver Profiles` → Cloud SQL `driver_profiles`
- [ ] Task: Resolve all FK references: `carrier_dot`, `driver_id`, `member_id` using `idMappingService`
- [ ] Test: A/B query comparison — same carrier DOT query returns same data from Airtable and GCP

### 5.2 Dual-Write & Cutover
- [ ] Task: Enable dual-write for `carriers` and `drivers`
- [ ] Task: Monitor for 429 errors (Airtable rate limit) — expect reduction as GCP handles more load
- [ ] Task: Update `carrierMatching.jsw` to use `dataAccess` with GCP target for carrier queries
- [ ] Task: Update `driverProfiles.jsw` to use GCP external collection for profile reads/writes
- [ ] Task: Set `GCP_MIGRATION_STATUS = 'gcp'` for carriers and drivers after 7 days of clean dual-write

---

## Phase 6: Transactional & Analytics Migration

> **Goal**: Migrate Messages, Subscriptions, and Logs
>
> **Dependencies**: Phase 5 complete
>
> **Estimated Effort**: 5-7 days

### 6.1 Messaging — Cloud Spanner
- [ ] Task: Dual-write `Messages` to Cloud Spanner
- [ ] Task: Backfill messaging history from Airtable → Spanner
- [ ] Task: Cutover messaging to Spanner (enables real-time query potential via Spanner change streams)

### 6.2 Billing & Subscriptions — Cloud SQL (Postgres)
- [ ] Task: Migrate `Subscriptions` and `StripeEvents` to Postgres
- [ ] Task: Ensure transactional integrity for quota updates (use Postgres transactions)

### 6.3 Observability & Logs — BigQuery
- [ ] Task: Redirect `SystemLogs`, `SystemTraces`, `AIUsageLog` to BigQuery streaming inserts
- [ ] Task: Update `observabilityService.jsw` to query BigQuery for dashboard stats

---

## Phase 7: Final Validation & Decommission

> **Goal**: Cleanup and final cutover
>
> **Dependencies**: All Phases complete
>
> **Estimated Effort**: 3-5 days

### 7.1 Full Regression & Benchmarking
- [ ] Test: Full Driver/Recruiter/Carrier lifecycle end-to-end through GCP
- [ ] Test: Measure P95 latency (Target <150ms for Cloud SQL, <200ms for Spanner)
- [ ] Test: Verify Airtable 429 errors are zero (Airtable no longer primary write path)

### 7.2 Rollback Plan
**If GCP degrades post-cutover:**
1. Set `GCP_MIGRATION_STATUS = 'dual'` for affected collection in `configData.js`
2. Deploy — Airtable resumes as primary, GCP writes become async backup
3. Investigate and fix GCP issue
4. Re-run phase cutover once resolved

### 7.3 Documentation & Handover
- [ ] Task: Update CLAUDE.md with GCP External Database namespace prefix table
- [ ] Task: Update `dataAccess.jsw` to deprecate Airtable legacy code paths once all collections migrated
- [ ] Task: Document Cloud Run adaptor maintenance (redeploy required if secrets change)
- [ ] Task: Archive `idMappingService.jsw` (read-only after full cutover)

### 7.4 Final Cutover
- [ ] Task: Disable Airtable writes globally (`GCP_MIGRATION_STATUS = 'gcp'` for all collections)
- [ ] Task: Mark Airtable base `Last Mile Driver recruiting` as READ-ONLY (rename to ARCHIVE)
- [ ] Task: Update `metadata.json` status to `COMPLETE`

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Dual-write latency | Fire-and-forget async GCP writes (non-blocking) |
| Data inconsistency | Periodic checksum/count matching scripts during migration |
| Airtable RecID → UUID FK breakage | `idMappingService.jsw` + `v2_ID_Mapping` Airtable table |
| Wix auth collections migrated accidentally | Explicit "Frozen Collections" list at top of plan |
| Cloud Run secret changes not reflected | Note: must redeploy Cloud Run service after any secret update |
| Cost overrun | GCP Billing budget alert at $100/month (Phase 1.1 task) |
| Wix External Collection CMS read-only | All SQL tables include `_id`, `_createdDate`, `_updatedDate`, `_owner` |
