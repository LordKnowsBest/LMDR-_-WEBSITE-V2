# Cloud Run Express API — Product Requirements Document

> **Addendum to:** `Conductor/tracks/gcp_migration_20260218/plan.md`
> **Phase context:** Data migration is complete (24,826 records in Cloud SQL). This addendum covers building the standalone API that replaces the Wix `.jsw` backend.
> **Date:** 2026-03-08

---

## 1. Problem Statement

The LMDR platform currently runs ~180 backend service files as Wix `.jsw` functions inside `src/backend/`. Every file imports from `dataAccess.jsw`, which routes reads/writes to Airtable (or, for a handful of collections, Wix CMS).

This architecture creates three hard blockers:

| Blocker | Impact |
|---------|--------|
| All data lives in Airtable | High latency, rate-limited, expensive at scale |
| Logic locked inside Wix | Cannot test locally, cannot deploy independently, cannot version |
| No standalone API | External API partners (`lmdr_live_*` keys) must go through Wix HTTP functions — fragile and hard to rate-limit |

The Airtable → Cloud SQL migration is **done**. All 24,826 records live in `lmdr` database on `ldmr-velocitymatch:us-central1:lmdr-postgres`. The missing piece is a query interface.

---

## 2. Solution

Build a Node.js/Express REST API deployed to **Cloud Run** that:

1. **Replaces `dataAccess.jsw`** — exposes the same logical operations (`query`, `get`, `insert`, `update`, `delete`, `findByField`, `upsert`, `count`) as HTTP endpoints
2. **Queries Cloud SQL directly** — reads/writes the migrated JSONB tables instead of Airtable
3. **Authenticates two ways** — Firebase Auth ID tokens (internal Wix/Firebase frontend) and `lmdr_live_` bearer keys (external API partners)
4. **Enables external partner ecosystem** — `/v1/` routes with rate limiting, versioning, and usage tracking
5. **Is fully testable offline** — Jest unit tests + integration tests against a test Postgres DB

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Clients                               │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────┐  │
│  │ Wix Frontend │   │Firebase App  │   │API Partners│  │
│  │  (lastmile   │   │ (mobile/web) │   │(lmdr_live_ │  │
│  │   dr.app)    │   │              │   │  keys)     │  │
│  └──────┬───────┘   └──────┬───────┘   └─────┬──────┘  │
└─────────┼──────────────────┼─────────────────┼─────────┘
          │                  │                 │
          │ Firebase ID Token│ Firebase ID     │ Bearer API Key
          │                  │ Token           │
          ▼                  ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│              Cloud Run — lmdr-api                       │
│              us-central1 / ldmr-velocitymatch           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Auth Middleware                                 │   │
│  │  firebase-admin.verifyIdToken()  OR              │   │
│  │  SHA-256(apiKey) lookup in airtable_v2_api_      │   │
│  │  partners                                        │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     │                                   │
│  ┌──────────────────▼───────────────────────────────┐   │
│  │  Rate Limit Middleware                           │   │
│  │  In-memory minute buckets + monthly quota        │   │
│  │  Tiers: starter/growth/enterprise/custom         │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     │                                   │
│  ┌──────────────────▼───────────────────────────────┐   │
│  │  Routes (Express Router)                         │   │
│  │  GET  /health                                    │   │
│  │  POST /v1/:collection/query   ← generic JSONB    │   │
│  │  GET  /v1/:collection/:id     ← by _id           │   │
│  │  POST /v1/:collection         ← insert           │   │
│  │  PUT  /v1/:collection/:id     ← update           │   │
│  │  POST /v1/:collection/upsert  ← upsert           │   │
│  │  GET  /v1/:collection/count   ← count            │   │
│  │  POST /v1/carriers/search     ← structured SQL   │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     │                                   │
│  ┌──────────────────▼───────────────────────────────┐   │
│  │  DB Layer  (src/db/)                             │   │
│  │  pool.js    — pg.Pool via Cloud SQL Connector    │   │
│  │  query.js   — JSONB filter DSL → SQL             │   │
│  │  schema.js  — collectionKey → SQL table name     │   │
│  └──────────────────┬───────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────┘
                      │ TCP 5432
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Cloud SQL (PostgreSQL 15)                              │
│  ldmr-velocitymatch:us-central1:lmdr-postgres           │
│  DB: lmdr  User: lmdr_user                              │
│                                                         │
│  JSONB tables (airtable_*):                             │
│    airtable_carriers_master       ← carriers            │
│    airtable_v2_driver_profiles    ← driverProfiles      │
│    airtable_v2_messages           ← messages            │
│    airtable_v2_api_partners       ← apiPartners         │
│    airtable_v2_api_subscriptions  ← apiSubscriptions    │
│    ... 24,826 records across 120+ tables                │
│                                                         │
│  Structured tables:                                     │
│    carriers  ← typed columns, full-text search indexes  │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Data Model

### 4.1 JSONB Table Schema (all migrated Airtable collections)

```sql
CREATE TABLE airtable_<snake_case> (
  _id          TEXT PRIMARY KEY,
  airtable_id  TEXT UNIQUE NOT NULL,
  _created_at  TIMESTAMPTZ DEFAULT NOW(),
  _updated_at  TIMESTAMPTZ DEFAULT NOW(),
  data         JSONB NOT NULL
);
```

**Table name conversion rule:**
- Take the Airtable table name from `AIRTABLE_TABLE_NAMES` in `src/backend/config.jsw`
- Lowercase the string
- Replace spaces and special chars with underscores
- Remove parentheses and remaining special chars
- Prefix with `airtable_`
- Examples:
  - `'Carriers (Master)'` → `airtable_carriers_master`
  - `'v2_Driver Profiles'` → `airtable_v2_driver_profiles`
  - `'v2_API Partners'` → `airtable_v2_api_partners`
  - `'Client Carriers'` → `airtable_client_carriers`

### 4.2 Complete Collection → SQL Table Map

The canonical mapping lives in `scripts/migrate-to-cloudsql.js` (`AIRTABLE_TABLE_NAMES` constant).
Key entries used by this API:

| collectionKey | SQL Table |
|--------------|-----------|
| `carriers` | `airtable_carriers_master` |
| `carrierAccounts` | `airtable_carriers_leads` |
| `clientCarriers` | `airtable_client_carriers` |
| `driverProfiles` | `airtable_v2_driver_profiles` |
| `messages` | `airtable_v2_messages` |
| `apiPartners` | `airtable_v2_api_partners` |
| `apiSubscriptions` | `airtable_v2_api_subscriptions` |
| `apiUsage` | `airtable_v2_api_usage` |
| `apiProducts` | `airtable_v2_api_products` |
| `jobListings` | `airtable_v2_job_listings` |
| `applications` | `airtable_v2_applications` |
| `notifications` | `airtable_v2_notifications` |
| `achievements` | `airtable_v2_achievements` |
| `badges` | `airtable_v2_badges` |
| `streaks` | `airtable_v2_streaks` |
| `leaderboard` | `airtable_v2_leaderboard` |
| `complianceDocs` | `airtable_v2_compliance_docs` |

> **Note:** The full mapping is in `scripts/migrate-to-cloudsql.js`. The Cloud Run API's `src/db/schema.js` must import/replicate this map.

---

## 5. Authentication

### 5.1 Internal Requests (Firebase Auth)

```
Header: Authorization: Bearer <Firebase ID Token>
```

- `firebase-admin.auth().verifyIdToken(token)` validates the token
- Decoded token provides `uid`, `email`, and custom claims (`role`, `carrierId`, `driverId`)
- All requests from the Wix frontend or Firebase mobile app use this flow

### 5.2 External API Partner Requests

```
Header: Authorization: Bearer lmdr_live_<32 hex chars>
```

- Token is hashed: `SHA-256(apiKey + pepper)` where pepper comes from Secret Manager
- Hash is looked up in `airtable_v2_api_partners` table: `data->>'api_key_hash' = $1`
- Resolved partner record provides `partnerId`, `tier`, `subscriptionId`
- Rate limiting applied based on tier

### 5.3 Middleware Priority

```
1. Check if token starts with 'lmdr_live_' or 'lmdr_test_'
   → API key flow (lookup in Cloud SQL)
2. Otherwise treat as Firebase ID token
   → firebase-admin.auth().verifyIdToken()
3. No valid token → 401
```

---

## 6. Filter DSL (JSONB Query Interface)

The API accepts the same filter format as `dataAccess.jsw`:

```json
{
  "filters": [
    { "field": "state", "operator": "eq", "value": "TX" },
    { "field": "num_trucks", "operator": "gte", "value": 5 },
    { "field": "freight_type", "operator": "hasSome", "value": ["Dry Van", "Reefer"] }
  ],
  "limit": 50,
  "skip": 0,
  "sort": [{ "field": "combined_score", "direction": "desc" }]
}
```

**Supported operators and their SQL translations:**

| Operator | SQL |
|----------|-----|
| `eq` | `data->>'field' = $n` |
| `ne` | `data->>'field' != $n` |
| `gt` | `(data->>'field')::numeric > $n` |
| `gte` | `(data->>'field')::numeric >= $n` |
| `lt` | `(data->>'field')::numeric < $n` |
| `lte` | `(data->>'field')::numeric <= $n` |
| `contains` | `data->>'field' ILIKE '%' \|\| $n \|\| '%'` |
| `startsWith` | `data->>'field' ILIKE $n \|\| '%'` |
| `hasSome` | `data->'field' ?| $n` (array overlap) |
| `hasAll` | `data->'field' ?& $n` (array contains all) |
| `isEmpty` | `(data->>'field' IS NULL OR data->>'field' = '')` |
| `isNotEmpty` | `(data->>'field' IS NOT NULL AND data->>'field' != '')` |

---

## 7. API Surface

### 7.1 Generic Collection Endpoints

These endpoints work for **any** collection key that has a corresponding SQL table:

```
GET    /health                              → { status: 'ok', version, timestamp }

POST   /v1/:collection/query               → { records: [...], total, page }
GET    /v1/:collection/:id                 → { record }
POST   /v1/:collection                     → { record }
PUT    /v1/:collection/:id                 → { record }
DELETE /v1/:collection/:id                 → { deleted: true }
POST   /v1/:collection/upsert              → { record, created: bool }
GET    /v1/:collection/count               → { count }
GET    /v1/:collection/field/:field/:value → { records } (findByField shorthand)
```

**Example request:**
```
POST /v1/carriers/query
Authorization: Bearer <token>
Content-Type: application/json

{
  "filters": [{ "field": "state", "operator": "eq", "value": "TX" }],
  "limit": 25,
  "sort": [{ "field": "combined_score", "direction": "desc" }]
}
```

### 7.2 Special-Case Structured Endpoints

The `carriers` table also has typed columns (dot_number, combined_score, etc.) with GIN indexes.
These endpoints use optimized SQL queries (not JSONB path lookups):

```
POST   /v1/carriers/search         → Full-text + typed column search
GET    /v1/carriers/dot/:dotNumber → Lookup by DOT number
GET    /v1/carriers/scores/top     → Top carriers by combined_score
```

### 7.3 Route Guards

| Route pattern | Auth required | Notes |
|--------------|--------------|-------|
| `GET /health` | None | Public |
| `GET /v1/carriers/scores/top` | None | Public leaderboard |
| `POST /v1/*/query` | Yes (any valid token) | |
| `POST /v1/carriers` (write) | Yes + role check | Must be `admin` or `carrier` role |
| `DELETE /v1/*` | Yes + admin role | Hard delete |
| `GET /v1/apiPartners/*` | Yes + admin role | API key management |

---

## 8. Rate Limiting

Replicated from `src/backend/rateLimitService.jsw`:

| Tier | Req/Min | Req/Month |
|------|---------|-----------|
| `starter` | 10 | 5,000 |
| `growth` | 60 | 50,000 |
| `enterprise` | 300 | Unlimited |
| `custom` | 600 | Unlimited |

Rate limit state is in-memory (per pod) for the per-minute window.
Monthly totals are tracked in `airtable_v2_api_usage` table.

Response headers on all authenticated requests:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1741478400
X-Usage-Month: 1250
X-Usage-Limit-Month: 50000
```

---

## 9. Deployment

```
GCP Project:  ldmr-velocitymatch
Region:       us-central1
Service name: lmdr-api
Image:        gcr.io/ldmr-velocitymatch/lmdr-api:latest
Port:         8080
Min instances: 1 (always warm)
Max instances: 10
Memory:       512Mi
CPU:          1
```

### Environment Variables (set via Cloud Run env + Secret Manager)

```
PG_HOST=127.0.0.1          (via Cloud SQL Connector, not needed in Cloud Run)
PG_DATABASE=lmdr
PG_USER=lmdr_user
PG_PASSWORD=<from Secret Manager: lmdr-pg-password>
CLOUD_SQL_INSTANCE=ldmr-velocitymatch:us-central1:lmdr-postgres
FIREBASE_PROJECT_ID=ldmr-velocitymatch
API_KEY_PEPPER=<from Secret Manager: lmdr-api-key-pepper>
NODE_ENV=production
```

### Service Account Requirements
- `roles/cloudsql.client` (connect to Cloud SQL)
- `roles/secretmanager.secretAccessor` (read PG password + API key pepper)

---

## 10. Project File Structure

```
cloud-run-api/
├── package.json
├── Dockerfile
├── .dockerignore
├── .env.example
├── server.js                    ← Entry point, starts Express on :8080
├── src/
│   ├── app.js                   ← Express app factory (testable, no listen())
│   ├── db/
│   │   ├── pool.js              ← pg.Pool via @google-cloud/cloud-sql-connector
│   │   ├── query.js             ← JSONB filter DSL → parameterized SQL
│   │   └── schema.js            ← collectionKey → SQL table name map
│   ├── middleware/
│   │   ├── auth.js              ← Firebase ID token + API key validation
│   │   └── rateLimiter.js       ← Tier-based rate limiting
│   └── routes/
│       ├── health.js            ← GET /health
│       └── collection.js        ← Generic :collection router
└── tests/
    ├── db/
    │   ├── query.test.js        ← Filter DSL unit tests
    │   └── schema.test.js       ← Table name mapping tests
    ├── middleware/
    │   ├── auth.test.js
    │   └── rateLimiter.test.js
    └── routes/
        ├── health.test.js
        └── collection.test.js   ← Integration tests (test DB)
```

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Health check response time | < 50ms |
| `POST /v1/carriers/query` (50 results) | < 200ms |
| Airtable dependency for data reads | 0 (after cutover) |
| Test coverage | ≥ 80% statements |
| API partner authentication | < 10ms overhead |
| Deploy to Cloud Run | < 5 min cold start |

---

## 12. Out of Scope (This Phase)

- Replacing the Wix **frontend** (landing pages, member portal)
- Rewriting individual `.jsw` service files (business logic — Phase 2+)
- Real-time messaging (WebSockets — separate Cloud Run service)
- File upload endpoints (Cloud Storage — handled separately)
- BigQuery analytics integration (Phase 3)
- Full Airtable write-path cutover (Phase 2 — after read-path validation)

---

## 13. Dependencies

- **Prerequisite:** Cloud SQL migration complete ✅ (24,826 records in `lmdr` DB)
- **Prerequisite:** GCP project `ldmr-velocitymatch` configured ✅
- **Prerequisite:** Firebase project `ldmr-velocitymatch` configured ✅
- **Prerequisite:** `scripts/migrate-to-cloudsql.js` AIRTABLE_TABLE_NAMES map — source of truth for SQL table names
- **Prerequisite:** `src/backend/config.jsw` — source of truth for collection key mappings
- **Needed:** Secret Manager secrets: `lmdr-pg-password`, `lmdr-api-key-pepper`
- **Needed:** Cloud Run service account with `roles/cloudsql.client`

---

*End of PRD*
