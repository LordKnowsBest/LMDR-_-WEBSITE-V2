# Specification: GCP Database Migration (Airtable to GCP)

> **Revised:** 2026-02-18 — Corrected integration mechanism and database targets per Wix official docs.

## Objective
Migrate LMDR's data architecture from Airtable to Google Cloud Platform (GCP) to overcome Airtable's record limits (50k/base) and rate limits (5 req/sec). Transition to a multi-database architecture using Cloud SQL (PostgreSQL), BigQuery, and Cloud Spanner.

## Integration Mechanism: Official Wix External Database Adaptor

Wix Velo integrates with GCP via a **prebuilt Cloud Run service** (`velo-external-db` container image), NOT a custom Cloud Function. The Cloud Run adaptor exposes GCP databases as **Wix External Collections**, accessible via the native `wixData` API and Wix CMS.

**Official 4-step flow:**
1. Store DB credentials as secrets in **GCP Secret Manager** (`SECRET_KEY`, `PERMISSIONS`, `USER`, `PASSWORD`, `DB`, `CLOUD_SQL_CONNECTION_NAME`, etc.)
2. Deploy prebuilt `velo-external-db` container on **Cloud Run** with service account roles and secrets mounted as env vars
3. Test adaptor via `curl` to confirm table listing
4. Register the Cloud Run URL as an **External Database** in Wix Editor (Code Sidebar → External Databases)

## Target Architecture

### 1. Cloud SQL (PostgreSQL) — Operational Data ✅ Wix-Supported
**Tables**: `carriers`, `driver_profiles`, `driver_jobs`, `driver_applications`, `carrier_subscriptions`, `matching_scores`, `messages` (if not Spanner), `faqs`, `blog_posts`, `compliance_guides`
**Reasoning**: Transactional integrity, complex JOINs for matching, PostGIS for geospatial route matching.
**Wix Access**: Via External Collection namespace `gcp_core/tableName`

### 2. Cloud Spanner — Real-Time / High-Throughput Data ✅ Wix-Supported
**Tables**: `messages` (preferred for real-time potential via change streams)
**Reasoning**: Multi-region strong consistency, horizontal scale, supports Wix's External Collection adaptor.
**Wix Access**: Via External Collection namespace `gcp_realtime/tableName`

### 3. BigQuery — Analytics / Log Data ✅ Wix-Supported (Read-Only from CMS)
**Tables**: `system_logs`, `system_traces`, `ai_usage_log`, `audit_log`, `match_events`
**Reasoning**: Serverless scale, extremely low storage cost, native BI tools (Looker Studio).
**Wix Access**: Via External Collection namespace `gcp_analytics/tableName` (read-only — no `_id`/`_owner` columns)

> [!WARNING]
> **Firestore is NOT supported** by the Wix External Database adaptor. All previous Firestore plans have been replaced with Cloud SQL / Cloud Spanner.
> Supported databases: Cloud SQL (MySQL, Postgres, MSSQL), BigQuery, Cloud Spanner.

## Frozen Collections (Excluded from Migration)

| Collection | Reason |
|------------|--------|
| `AdminUsers` | Auth/permissions — must stay in Wix |
| `MemberNotifications` | Wix member system integration |
| `memberBadges` | `Members/Badges` system collection |
| `memberPrivateData` | `Members/PrivateMembersData` system collection |

## Wix-Required Schema Columns

For any Cloud SQL or Spanner table to be **read-write** (not read-only) in Wix, it **must** include:

```sql
_id           VARCHAR(36) PRIMARY KEY,  -- UUID
_createdDate  TIMESTAMP NOT NULL,
_updatedDate  TIMESTAMP NOT NULL,
_owner        VARCHAR(128)              -- Wix member ID
```

Tables without these columns will be **read-only** in the Wix CMS.

## PERMISSIONS Secret Format

```json
{
  "collectionPermissions": [
    { "id": "carriers", "read": ["Admin", "Member"], "write": ["Admin"] },
    { "id": "driver_profiles", "read": ["Admin", "Member"], "write": ["Admin", "Member"] },
    { "id": "messages", "read": ["Admin", "Member"], "write": ["Admin", "Member"] }
  ]
}
```

Without this secret, all external collections default to **Admin-only** access, breaking all driver/recruiter operations.

## Integration with dataAccess.jsw

Per CLAUDE.md, all data operations go through `dataAccess.jsw` → `configData.js`. GCP integration follows the same pattern:

- `configData.js` adds `getGcpCollectionName(key)` returning `'namespace/tableName'`
- `dataAccess.jsw` checks `GCP_MIGRATION_STATUS` flag: `'off'` | `'dual'` | `'gcp'`
- In `'dual'` mode, GCP writes are **fire-and-forget** (non-blocking) to protect Wix response time
- In `'gcp'` mode, all reads/writes go to GCP external collections via `wixData.query('namespace/table')`

## ID Mapping Strategy

Airtable uses opaque Record IDs (`recABC123`). GCP tables use UUIDs (`_id`). During migration:
1. `v2_ID_Mapping` Airtable table tracks `{airtable_record_id → gcp_uuid}` per collection
2. `idMappingService.jsw` provides `getOrCreateMapping()` and `lookupGcpId()` helpers
3. Backfill scripts use deterministic UUID v5 (seeded from Airtable RecordID) for reproducibility

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
