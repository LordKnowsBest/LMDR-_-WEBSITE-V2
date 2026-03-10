# Specification: GCP Database Migration (Airtable to GCP)

> **Revised:** 2026-03-10 — Updated to reflect COMPLETED migration. Airtable fully disconnected.
> **Original:** 2026-02-18 — Corrected integration mechanism and database targets per Wix official docs.

## Objective
Migrate LMDR's data architecture from Airtable to Google Cloud Platform (GCP) to overcome Airtable's record limits (50k/base) and rate limits (5 req/sec). Transition to a multi-database architecture using Cloud SQL (PostgreSQL), BigQuery, and Cloud Spanner.

## Integration Mechanism: Custom Cloud Run Express API

> **Architecture correction (2026-03-10):** The original plan specified Wix External Database adaptors (`velo-external-db`). The ACTUAL implementation uses a **custom Express REST API** (`lmdr-api`) deployed to Cloud Run. Wix `.jsw` files call this API via `cloudRunClient.jsw` using `LMDR_INTERNAL_KEY` for service-to-service authentication. Wix External Collections were NOT used.

**Actual implementation flow:**
1. `lmdr-api` Express service deployed to Cloud Run (`https://lmdr-api-140035137711.us-central1.run.app`)
2. `cloudRunClient.jsw` in Wix backend sends HTTP requests to Cloud Run API with `LMDR_INTERNAL_KEY` bearer auth
3. `dataAccess.jsw` routes all non-Wix collections through `cloudRunClient.jsw`
4. Cloud Run API queries Cloud SQL (`lmdr-postgres`) JSONB tables directly via `pg` client

## Target Architecture (Actual — as of 2026-03-10)

### 1. Cloud SQL (PostgreSQL 15) — ALL Operational Data ✅ LIVE
**Instance**: `lmdr-postgres` in project `ldmr-velocitymatch`, region `us-central1`
**Database**: `lmdr`, User: `lmdr_user`
**Tables**: 120+ JSONB tables (`airtable_<snake_case>`) + structured `carriers` table with typed columns
**Access**: Via Cloud Run API (`lmdr-api`) — NOT via Wix External Collections
**Records**: 24,826 migrated from Airtable

### 2. Cloud Spanner — NOT USED
> Cloud Spanner was deferred. All data including messages uses Cloud SQL JSONB tables.

### 3. BigQuery — Analytics / Observability ✅ LIVE
**Dataset**: `ldmr-velocitymatch.lmdr_analytics`
**Purpose**: Observability streaming from Cloud Run services
**Access**: Direct from Cloud Run services (not from Wix)

> [!NOTE]
> **Wix External Database Collections were NOT used.** The integration uses a custom Cloud Run Express API called via HTTP from `cloudRunClient.jsw`. This avoids the `velo-external-db` adaptor entirely.

## Frozen Collections (Excluded from Migration)

| Collection | Reason |
|------------|--------|
| `AdminUsers` | Auth/permissions — must stay in Wix |
| `MemberNotifications` | Wix member system integration |
| `memberBadges` | `Members/Badges` system collection |
| `memberPrivateData` | `Members/PrivateMembersData` system collection |

## Cloud SQL Schema (Actual)

> Wix External Collections are NOT used, so the `_createdDate`/`_updatedDate`/`_owner` requirements do NOT apply.

All migrated tables use the JSONB schema:
```sql
CREATE TABLE airtable_<snake_case> (
  _id          TEXT PRIMARY KEY,
  airtable_id  TEXT UNIQUE NOT NULL,
  _created_at  TIMESTAMPTZ DEFAULT NOW(),
  _updated_at  TIMESTAMPTZ DEFAULT NOW(),
  data         JSONB NOT NULL
);
```

## Authentication

**Service-to-service (Wix → Cloud Run):** `LMDR_INTERNAL_KEY` bearer token
**User auth:** Firebase Auth ID tokens
**API partners:** `lmdr_live_*` API keys hashed and looked up in `airtable_v2_api_partners` table

## Integration with dataAccess.jsw (Current State)

All data operations go through `dataAccess.jsw` → `configData.js`. The current routing:

- `configData.js` `getDataSource()` returns `'wix'` or `'cloudrun'` (never `'airtable'`)
- `usesAirtable()` is a stub that always returns `false`
- `GCP_MIGRATION_MODE` = `'cloudrun'` (hardcoded constant + Wix Secret)
- `dataAccess.jsw` imports `cloudRunClient.jsw` — sends HTTP requests to `lmdr-api` Cloud Run service
- 4 frozen Wix collections (AdminUsers, MemberNotifications, memberBadges, memberPrivateData) still use `wixData` directly
- `airtableClient.jsw` has been DELETED — no Airtable code path exists

## ID Strategy (Actual)

Original Airtable Record IDs (`recABC123`) are preserved in the `airtable_id` column of each JSONB table. The `_id` column uses the same value. No separate ID mapping table was needed. `idMappingService.jsw` was never created.

## Cost Analysis (Estimated Monthly)
- **Cloud SQL (Postgres)**: ~$35 (Shared core instance, 10GB storage)
- **Cloud Spanner**: ~$25 (1 processing unit, 5GB storage)
- **BigQuery**: ~$5 (50GB storage, 1TB query free tier)
- **Cloud Run**: ~$5 (serverless, scales to zero when idle)
- **Networking**: ~$10 (Egress to Wix)
- **Total GCP**: ~$80/month (supporting 1M+ records)
- **Airtable Savings**: Eliminated Enterprise licensing ($1,000s/mo)

## Success Metrics
- **Throughput**: Support 500+ operations/sec (vs 5/sec Airtable limit)
- **Record Count**: Support 1M+ records without performance degradation
- **Latency**: <200ms round-trip from Wix to GCP External Collection
- **Airtable 429 Errors**: Zero after full cutover
- **Cost**: >80% reduction vs Airtable Enterprise
