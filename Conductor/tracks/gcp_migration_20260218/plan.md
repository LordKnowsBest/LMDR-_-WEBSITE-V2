# Track Plan: GCP Database Migration (Airtable to GCP)

> **STATUS: COMPLETE — All phases done. Airtable fully disconnected.**
>
> **Last Updated**: 2026-03-11 (Track closed — all 4 phases complete)
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
- [x] Task: GCP Project `ldmr-velocitymatch` created (note: NOT `lmdr-prod-db` as originally planned)
- [x] Task: Cloud SQL API enabled, PostgreSQL instance `lmdr-postgres` provisioned (note: NOT `lmdr-primary`)
- [ ] ~~Task: Enable Cloud Spanner API~~ — Deferred; Cloud SQL handles all current needs
- [x] Task: BigQuery Dataset `lmdr_analytics` created in `ldmr-velocitymatch`
- [x] Task: Service accounts created with appropriate roles
- [x] Task: GCP Billing budget alert configured

### 1.2 GCP Secret Manager — Secrets Setup
- [x] Task: Secrets created in Secret Manager (`lmdr-pg-password`, `lmdr-api-key-pepper`, etc.)
- [x] Task: `LMDR_INTERNAL_KEY` set in Wix Secrets for service-to-service auth with Cloud Run
- [x] Task: `AIRTABLE_PAT` secret DELETED from Wix (Airtable fully disconnected)
- [ ] ~~Task: Cloud Spanner secrets~~ — Deferred (Spanner not in use)

### 1.3 Cloud Run API Deployment (Actual Implementation)
> **Architecture correction:** The actual implementation does NOT use Wix External Database adaptors (`velo-external-db`). Instead, a custom Express API (`lmdr-api`) was built and deployed to Cloud Run. Wix `.jsw` files call the API via `cloudRunClient.jsw` using `LMDR_INTERNAL_KEY` for auth.

- [x] Task: Cloud Run service `lmdr-api` deployed (revision `lmdr-api-00008-8nm`)
  - URL: `https://lmdr-api-140035137711.us-central1.run.app`
  - Express REST API with generic `:collection` router
  - Auth: `LMDR_INTERNAL_KEY` (service-to-service) + Firebase ID tokens + API partner keys
- [x] Task: Service account with `roles/cloudsql.client` and `roles/secretmanager.secretAccessor`
- [x] Task: 101 regression tests passing (`cloud-run-api/tests/`)
- [x] Test: Health check and CRUD operations verified

### 1.4 Wix Integration (Actual Implementation)
> **Note:** Wix External Database Collections were NOT used. Instead, `dataAccess.jsw` was rewritten to route through `cloudRunClient.jsw` which calls the Cloud Run API directly via HTTP.

- [x] Task: `cloudRunClient.jsw` created — mirrors old `airtableClient.jsw` export signatures
- [x] Task: `dataAccess.jsw` rewritten — no Airtable imports, only Cloud Run + Wix paths
- [x] Task: `configData.js` updated — `usesAirtable()` returns `false`, `getDataSource()` returns `'wix'` or `'cloudrun'`
- [x] Task: `GCP_MIGRATION_MODE` set to `'cloudrun'` in Wix Secrets

---

## Phase 2: Data Abstraction Layer Update — COMPLETE

> **Status**: DONE (as of 2026-03-10)
>
> **Actual implementation**: `dataAccess.jsw` routes to Cloud Run API via `cloudRunClient.jsw`. No Wix External Collections used. No dual-write mode needed — direct cutover was performed.

### 2.1 configData.js Updates — COMPLETE
- [x] `GCP_MIGRATION_MODE` = `'cloudrun'` (set as Wix Secret + hardcoded constant)
- [x] `usesAirtable()` stubbed to return `false` for ALL collections
- [x] `getDataSource()` returns `'wix'` or `'cloudrun'` only (no `'airtable'` path)
- [x] `usesCloudRun()` returns `true` for non-Wix collections

### 2.2 dataAccess.jsw Updates — COMPLETE
- [x] Rewritten with NO Airtable imports
- [x] Imports only `cloudRunClient` (for Cloud Run path) and `wix-data` (for 4 frozen Wix collections)
- [x] All CRUD operations (`queryRecords`, `insertRecord`, `updateRecord`, `deleteRecord`, etc.) route through Cloud Run
- [x] `airtableClient.jsw` file DELETED from codebase

### 2.3 Data Migration — COMPLETE
- [x] 24,826 records backfilled from Airtable to Cloud SQL (`lmdr` database on `lmdr-postgres`)
- [x] JSONB table schema: `airtable_<snake_case>` tables with `_id`, `airtable_id`, `data` JSONB column
- [x] 120+ tables migrated
- [x] ID mapping preserved via `airtable_id` column (deterministic UUID not needed — original Airtable IDs kept)

---

## Phase 3: Cloud SQL Schema Design — COMPLETE

> **Status**: DONE
>
> **Actual implementation**: All tables use JSONB schema (`airtable_<snake_case>` naming). A structured `carriers` table with typed columns also exists for optimized search queries.

### 3.1 JSONB Table Schema (Actual)
```sql
CREATE TABLE airtable_<snake_case> (
  _id          TEXT PRIMARY KEY,
  airtable_id  TEXT UNIQUE NOT NULL,
  _created_at  TIMESTAMPTZ DEFAULT NOW(),
  _updated_at  TIMESTAMPTZ DEFAULT NOW(),
  data         JSONB NOT NULL
);
```
> Note: Wix External Collections were NOT used, so the `_createdDate`/`_updatedDate`/`_owner` column requirements do not apply.

### 3.2 Schema Status
- [x] 120+ JSONB tables created and populated
- [x] Structured `carriers` table with typed columns + full-text search indexes
- [x] BigQuery dataset `ldmr-velocitymatch.lmdr_analytics` for observability streaming
- [ ] ~~Cloud Spanner for messages~~ — Deferred; messages use Cloud SQL JSONB table

---

## Phases 4-7: Data Migration & Cutover — ALL COMPLETE

> **Status**: ALL DONE. Airtable is fully disconnected as of 2026-03-10.
>
> **What happened**: Instead of the phased dual-write approach originally planned, ALL collections were migrated in a single batch backfill (`scripts/migrate-to-cloudsql.js`), then `dataAccess.jsw` was rewritten with a direct cutover. No dual-write phase was needed.

### Summary of Completed Work
- [x] ALL 120+ Airtable collections backfilled to Cloud SQL JSONB tables (24,826 records)
- [x] Cloud Spanner was NOT used — all data including messages stays in Cloud SQL
- [x] BigQuery observability streaming configured to `ldmr-velocitymatch.lmdr_analytics`
- [x] `airtableClient.jsw` DELETED from codebase
- [x] `AIRTABLE_PAT` secret deleted from Wix
- [x] 5 services migrated from direct `airtableClient` imports to `dataAccess`: `b2bContentAIService`, `carrierLeadsService`, `interventionService`, `pipelineAutomationService`, `seasonalEventService`
- [x] 20 seed files deleted from `src/backend/seeds/`
- [x] 20 connection test files deleted from `src/backend/tests/`
- [x] 101 regression tests passing in `cloud-run-api/tests/`
- [x] `configData.js` `usesAirtable()` stubbed to `return false`
- [x] `config.jsw` `usesAirtable()` stubbed to `return false`

### Rollback Plan (Current)
Rollback to Airtable is **no longer possible** — `AIRTABLE_PAT` has been deleted and `airtableClient.jsw` has been removed. Forward-only from here.

### Documentation Updates
- [x] CLAUDE.md needs update (see this audit) to remove Airtable-as-primary references
- [ ] Update `.claude/docs/airtable-routing.md` to reflect Cloud Run routing (low priority — doc auto-injected)
- [ ] Update `.claude/docs/architecture-reference.md` to reflect Cloud Run architecture (low priority)

---

## Risk Mitigation (Post-Migration)

| Risk | Mitigation |
|------|------------|
| ~~Dual-write latency~~ | N/A — dual-write was never used; direct cutover completed |
| Cloud Run API downtime | Cloud Run autoscaling + revision rollback; 101 regression tests |
| ~~Airtable RecID → UUID FK breakage~~ | N/A — original Airtable IDs preserved in `airtable_id` column |
| Wix auth collections migrated accidentally | Explicit "Frozen Collections" list at top of plan (4 Wix-only collections) |
| Cloud Run secret changes not reflected | Redeploy Cloud Run service after any secret update |
| Cost overrun | GCP Billing budget alert configured |
| ~~Wix External Collection CMS read-only~~ | N/A — Wix External Collections were NOT used |
| Forward-only migration risk | `AIRTABLE_PAT` deleted, `airtableClient.jsw` deleted — no rollback to Airtable possible |

---

## Post-Migration: Remaining Low-Priority Items

| Item | Status | Notes |
|------|--------|-------|
| `AIRTABLE_TABLE_NAMES` in `configData.js` | KEPT (legacy ref) | 40+ files reference it; added deprecation comment; serves as Cloud SQL table name stem reference |
| Firebase RTDB | DEFERRED | Not needed until real-time features are built |
| AI Intelligence Service (`lmdr-ai-service`) | COMPLETE | Cloud Run `lmdr-ai-service` with Vertex AI Gemini 2.0 Flash; Railway decommissioned |
| `.claude/docs/airtable-routing.md` update | LOW | Auto-injected doc; functional as-is |
| `.claude/docs/architecture-reference.md` update | LOW | Reference doc; functional as-is |

---

## Phase 4 Platform Services — Final Status (2026-03-11)

| Service | Status | Key Artifact |
|---------|--------|-------------|
| Firebase Auth | COMPLETE | `authProvisioner` Cloud Function (revision `authprovisioner-00002-jax`) |
| Cloud Storage | COMPLETE | 4 GCS buckets with CORS + lifecycle |
| Pub/Sub | COMPLETE | 5 topics + 5 DLQs + 10 subscriptions |
| Cloud Scheduler | COMPLETE | 6 jobs with OIDC auth |
| Search (FTS + PostGIS + pgvector) | COMPLETE | `/v1/search/carriers`, `/v1/search/drivers`, `/v1/search/suggest` |
| Observability | COMPLETE | OTel Collector sidecar → Cloud Monitoring + Cloud Trace |
| Monitoring | COMPLETE | 5 alert policies + uptime check |
| IAM | COMPLETE | 13 service accounts, least-privilege audit passed |
| Firebase RTDB | DEFERRED | Placeholder scheduler job exists |
| AI Intelligence Service | COMPLETE | `lmdr-ai-service` on Cloud Run, Gemini 2.0 Flash default |
