# LMDR GCP Migration — Phase 4 Addendum: Platform Services
## Product Requirements Document

**Track:** `gcp_migration_20260218`
**Addendum:** `ADDENDUM_phase4_platform_services`
**GCP Project:** `ldmr-velocitymatch`
**Region:** `us-central1`
**Date:** 2026-03-09
**Status:** Draft — Pending Engineering Review
**Note (2026-03-10):** Airtable is fully disconnected. References to "Airtable sync" in job registry (e.g., `daily-airtable-sync`) are legacy placeholders and should be removed or repurposed during implementation.

---

## 1. Executive Summary

Phase 4 defines the seven foundational platform services that every other migration phase depends on but which have not yet been implemented as standalone GCP resources. These services are not optional enhancements — they are pre-requisites for production operation of the entire LMDR platform.

The prior phases established:
- **Phase 1:** Cloud SQL `lmdr-postgres` database and Airtable migration
- **Phase 1 Addendum:** Cloud Run `lmdr-api` Express query service
- **Phase 2:** Nine Cloud Run microservices covering matching, driver, carrier, compliance, notifications, billing, AI, analytics, and base API
- **Phase 3:** Next.js 14 frontend on Cloud Run `lmdr-frontend` with Cloud CDN

None of Phase 2's services can authenticate requests without Firebase Auth. None of the driver or carrier workflows operate without Cloud Storage. Inter-service async communication has no bus without Pub/Sub. Recurring business logic has no execution environment without Cloud Scheduler. The search experience that drives marketplace matching cannot function without full-text search indexes. No production system can be safely operated without observability. And the AI intelligence service remains a local prototype without containerization.

Phase 4 resolves all seven gaps simultaneously, with explicit sequencing to avoid circular dependencies.

**Phase 4 Services:**

| # | Service | GCP Technology | Replaces |
|---|---------|---------------|----------|
| 1 | Authentication & Authorization | Firebase Auth | Wix Auth |
| 2 | File & Media Storage | Cloud Storage (4 buckets) | Wix Media Manager |
| 3 | Real-time & WebSockets | Firebase RTDB + Cloud Pub/Sub | Wix real-time |
| 4 | Scheduled Jobs | Cloud Scheduler + Cloud Tasks | Wix Velo cron (`wix-cron`) |
| 5 | Search | PostgreSQL FTS + PostGIS | Wix built-in search |
| 6 | Observability | Cloud Logging + Monitoring + Trace | None (no prior observability) |
| 7 | AI Intelligence Finalization | Cloud Run `lmdr-ai-service` + Vertex AI | Local/ad-hoc prototype |

---

## 2. Dependency Map

The table below maps each Phase 2/3 service to the Phase 4 services it requires before it can operate in production.

| Phase 2/3 Service | Auth (1) | Storage (2) | Real-time (3) | Scheduler (4) | Search (5) | Observability (6) | AI (7) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `lmdr-api` (base) | REQUIRED | — | — | — | — | REQUIRED | — |
| `lmdr-matching-engine` | REQUIRED | — | — | — | REQUIRED | REQUIRED | REQUIRED |
| `lmdr-driver-service` | REQUIRED | REQUIRED | REQUIRED | — | — | REQUIRED | — |
| `lmdr-carrier-service` | REQUIRED | REQUIRED | — | REQUIRED | — | REQUIRED | — |
| `lmdr-compliance-service` | REQUIRED | REQUIRED | REQUIRED | REQUIRED | — | REQUIRED | — |
| `lmdr-notifications-service` | REQUIRED | — | REQUIRED | REQUIRED | — | REQUIRED | — |
| `lmdr-billing-service` | REQUIRED | REQUIRED | — | REQUIRED | — | REQUIRED | — |
| `lmdr-ai-service` | REQUIRED | REQUIRED | — | REQUIRED | — | REQUIRED | SELF |
| `lmdr-analytics-service` | REQUIRED | — | — | — | — | REQUIRED | — |
| `lmdr-frontend` | REQUIRED | REQUIRED | REQUIRED | — | REQUIRED | REQUIRED | — |

**Deployment order constraint:** Phase 4 services must be deployed before any Phase 2 service receives production traffic.

---

## 3. Service 1 — Authentication & Authorization (Firebase Auth)

### 3.1 Current State

Wix Auth handles all user identity for the LMDR platform. Three user roles exist: Driver, Carrier, and Admin. Authentication is tightly coupled to Wix's proprietary session system and cannot be reused outside Wix.

### 3.2 Target State

Firebase Auth serves as the identity provider. All Cloud Run services receive `Authorization: Bearer <Firebase ID token>` headers and verify tokens using the Firebase Admin SDK. Role identity is embedded in the token via custom claims, eliminating per-request database lookups for authorization decisions.

### 3.3 Key Requirements

- Email/password authentication for drivers and carriers
- Google OAuth provider for carrier sign-up flow
- Custom token minting for admin user provisioning (script-based, not self-service)
- Custom claims schema: `{ role: 'driver' | 'carrier' | 'admin', driverId?: string, carrierId?: string }`
- Firebase Auth webhook (Cloud Function `lmdr-auth-provisioner`): fires on `user.onCreate` → calls `lmdr-api POST /internal/users/provision` to create the Cloud SQL record
- Token lifetime: Firebase ID tokens expire after 1 hour; refresh tokens are long-lived
- Password reset: Firebase built-in flow with customized email templates (LMDR branding)
- Email verification: Firebase built-in with custom template
- Shared middleware package `packages/lmdr-middleware` exports `verifyFirebaseToken()` used by all 9 Phase 2 services

### 3.4 Architecture — Firebase Auth Flow

```
[Client Browser / Mobile]
        |
        | 1. signInWithEmailAndPassword() or signInWithPopup(GoogleAuthProvider)
        v
[Firebase Auth]
        |
        | 2. Returns ID token (JWT, 1hr TTL) + refresh token
        v
[Client stores token in memory / httpOnly cookie]
        |
        | 3. API request: Authorization: Bearer <idToken>
        v
[Cloud Run Service (any Phase 2 service)]
        |
        | 4. verifyFirebaseToken() middleware
        |    → firebase-admin.auth().verifyIdToken(token)
        |    → extracts uid, role, driverId/carrierId from claims
        v
[Business logic proceeds with authenticated context]
```

**Cloud Function provisioning flow:**
```
[Firebase Auth: user.onCreate event]
        |
        v
[Cloud Function: lmdr-auth-provisioner]
        |
        | POST /internal/users/provision
        | { uid, email, role (from registration metadata) }
        v
[lmdr-api]
        |
        | INSERT INTO users / drivers / carriers
        | firebase-admin.auth().setCustomUserClaims(uid, { role, driverId/carrierId })
        v
[Cloud SQL lmdr-postgres]
```

### 3.5 GCP Services Used

- Firebase Authentication (Firebase project linked to `ldmr-velocitymatch`)
- Cloud Functions (Gen 2) — `lmdr-auth-provisioner`
- Secret Manager — `firebase-admin-sdk` (service account JSON)
- Cloud Run — all Phase 2 services (consumers of Firebase Admin SDK)

### 3.6 IAM

- Service account `lmdr-auth-provisioner@ldmr-velocitymatch.iam.gserviceaccount.com` — roles: `roles/run.invoker` (for `lmdr-api` only)
- All Cloud Run service accounts receive no Firebase-specific IAM; token verification is done via Admin SDK using the stored secret

---

## 4. Service 2 — File & Media Storage (Cloud Storage)

### 4.1 Current State

Wix Media Manager stores driver documents (CDL photos, proof of insurance, W9s) and carrier assets (logos, contracts). Files are locked inside Wix's proprietary storage and inaccessible via standard GCP tooling.

### 4.2 Target State

Four Cloud Storage buckets, each with purpose-specific IAM, lifecycle policies, and access patterns. Browsers upload files directly to GCS using time-limited signed URLs (never routing large binaries through Cloud Run). A Cloud Storage event trigger fires to Pub/Sub on upload completion for downstream compliance validation.

### 4.3 Bucket Definitions

| Bucket | Access | CDN | Retention | Purpose |
|--------|--------|-----|-----------|---------|
| `lmdr-driver-documents` | Private | No | 7 years | CDL, insurance, background checks, W9 |
| `lmdr-carrier-assets` | Private | No | 7 years | Logos, contracts |
| `lmdr-static-assets` | Public | Yes | No expiry | App images, fonts |
| `lmdr-ai-training-data` | Private | No | No expiry | RAG corpus, ML datasets, Wix export archive |

### 4.4 Architecture — Signed URL Upload Flow

```
[Client Browser]
        |
        | 1. POST /files/signed-url
        |    { fileName, contentType, purpose: 'cdl' | 'insurance' | 'logo' }
        |    Authorization: Bearer <Firebase ID token>
        v
[lmdr-driver-service or lmdr-carrier-service]
        |
        | 2. Validates auth, generates V4 signed URL
        |    storage.bucket('lmdr-driver-documents').file(path).getSignedUrl(...)
        |    URL valid for 15 minutes
        v
[Client receives signedUrl]
        |
        | 3. PUT <signedUrl> with file binary (direct to GCS, bypasses Cloud Run)
        v
[Cloud Storage: lmdr-driver-documents]
        |
        | 4. Object finalize event → Pub/Sub topic: lmdr-file-uploaded
        v
[lmdr-compliance-service]
        |
        | 5. Validates document (OCR, expiry check, format check)
        | 6. Updates driver compliance record in Cloud SQL
```

### 4.5 Key Requirements

- CORS configuration on `lmdr-driver-documents` and `lmdr-carrier-assets` allows `PUT` from LMDR frontend origin
- Versioning enabled on both private document buckets
- Lifecycle policy: compliance docs retained 7 years minimum; `tmp/` prefix purged after 24 hours
- Cloud CDN enabled on `lmdr-static-assets` bucket (partially established in Phase 3 — Phase 4 formalizes IAM and lifecycle)
- Signed URL generation endpoint: `lmdr-driver-service POST /files/signed-url`
- Optional: Cloud Functions virus scanning trigger on `lmdr-driver-documents` upload events

### 4.6 GCP Services Used

- Cloud Storage (4 buckets)
- Cloud CDN (for `lmdr-static-assets`)
- Cloud Pub/Sub (event notification topic `lmdr-file-uploaded`)
- Secret Manager (service account key for signed URL generation)

---

## 5. Service 3 — Real-time & WebSockets (Firebase RTDB + Cloud Pub/Sub)

### 5.1 Current State

Wix provides limited real-time capabilities. Driver status updates, dispatch notifications, and live job board updates have no reliable real-time delivery mechanism.

### 5.2 Target State

Two complementary systems:
- **Firebase Realtime Database** for client-facing subscriptions (browser/mobile clients subscribe to paths)
- **Cloud Pub/Sub** for server-side async event bus between Cloud Run microservices

### 5.3 Firebase Realtime Database Schema

```json
{
  "drivers": {
    "{driverId}": {
      "status": "online | offline | on-trip",
      "lastSeen": "<ISO timestamp>",
      "notifications": {
        "unread_count": 0
      }
    }
  },
  "jobs": {
    "{jobId}": {
      "applications_count": 0,
      "status": "open | filled | cancelled"
    }
  },
  "dispatch": {
    "{carrierId}": {
      "queue_depth": 0
    }
  }
}
```

### 5.4 Firebase Security Rules

```javascript
{
  "rules": {
    "drivers": {
      "$driverId": {
        ".read": "auth != null && (auth.token.role === 'admin' || auth.uid === $driverId)",
        ".write": "auth != null && (auth.token.role === 'admin' || auth.uid === $driverId)"
      }
    },
    "jobs": {
      "$jobId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.token.role === 'carrier' || auth.token.role === 'admin'"
      }
    },
    "dispatch": {
      "$carrierId": {
        ".read": "auth != null && (auth.token.role === 'admin' || auth.token.carrierId === $carrierId)",
        ".write": "auth != null && auth.token.role === 'admin'"
      }
    }
  }
}
```

### 5.5 Pub/Sub Topics

| Topic | Publisher | Consumer Service | Purpose |
|-------|-----------|-----------------|---------|
| `lmdr-notifications` | Any service | `lmdr-notifications-service` | Notification delivery events |
| `lmdr-compliance-events` | `lmdr-compliance-service` | `lmdr-compliance-service` | Compliance status changes |
| `lmdr-job-events` | `lmdr-carrier-service` | `lmdr-matching-engine`, `lmdr-notifications-service` | Job posted/filled/cancelled |
| `lmdr-driver-events` | `lmdr-driver-service` | `lmdr-compliance-service`, `lmdr-matching-engine` | Driver created/verified/suspended |
| `lmdr-file-uploaded` | Cloud Storage | `lmdr-compliance-service` | Document uploaded, trigger validation |

Each topic has a corresponding dead-letter topic (`lmdr-notifications-dlq`, etc.) with 5 retry attempts before dead-lettering.

### 5.6 Architecture — Real-time Event Flow

```
[Server: lmdr-driver-service]
        |
        | Job assigned → update driver status
        | firebase-admin.database().ref('/drivers/{id}/status').set('on-trip')
        |
        | Also publish to Pub/Sub: lmdr-driver-events
        v
[Firebase RTDB] ←— subscribed by → [Client Browser / Driver App]
[Cloud Pub/Sub] ←— push subscription → [lmdr-compliance-service]
                                         [lmdr-matching-engine]
```

### 5.7 GCP Services Used

- Firebase Realtime Database (`us-central1` instance)
- Cloud Pub/Sub (5 topics + 5 DLQ topics)
- Firebase Admin SDK (server-side writes in Cloud Run services)
- Firebase client SDK (browser-side subscriptions in `lmdr-frontend`)

---

## 6. Service 4 — Scheduled Jobs (Cloud Scheduler + Cloud Tasks)

### 6.1 Current State

Wix Velo `wix-cron` runs recurring business logic. These jobs are inaccessible outside the Wix platform and cannot be migrated directly.

### 6.2 Target State

Cloud Scheduler fires OIDC-authenticated HTTP requests to a Cloud Tasks queue. Cloud Tasks reliably delivers requests to Cloud Run service endpoints with retry semantics. Dedicated service account enforces least-privilege.

### 6.3 Job Registry

| Job Name | Schedule (CT) | Cloud Tasks Target | Endpoint |
|----------|--------------|-------------------|----------|
| `compliance-refresh` | Daily 2:00 AM | `lmdr-scheduled-tasks` → `lmdr-compliance-service` | `POST /jobs/compliance-refresh` |
| `weekly-earnings-digest` | Weekly Mon 6:00 AM | `lmdr-scheduled-tasks` → `lmdr-notifications-service` | `POST /jobs/weekly-earnings-digest` |
| `hourly-board-refresh` | Every hour | `lmdr-scheduled-tasks` → `lmdr-carrier-service` | `POST /jobs/refresh-board` |
| `daily-airtable-sync` | Daily 3:00 AM | `lmdr-scheduled-tasks` → `lmdr-ai-service` | `POST /sync/airtable` |
| `rtdb-cleanup` | Every 6 hours | `lmdr-scheduled-tasks` → `lmdr-api` | `POST /jobs/rtdb-cleanup` |
| `monthly-invoice-generation` | 1st of month 1:00 AM | `lmdr-scheduled-tasks` → `lmdr-billing-service` | `POST /jobs/generate-monthly-invoices` |
| `weekly-rag-refresh` | Weekly Sun 4:00 AM | `lmdr-scheduled-tasks` → `lmdr-ai-service` | `POST /jobs/refresh-rag` |

### 6.4 Architecture — Scheduler to Cloud Run

```
[Cloud Scheduler]
        |
        | Fires at cron time
        | Creates Cloud Tasks task with:
        |   - OIDC token (audience: Cloud Run service URL)
        |   - HTTP method + body
        v
[Cloud Tasks Queue: lmdr-scheduled-tasks]
        |
        | Delivers with retry (max 5 attempts, exponential backoff)
        | Authorization: Bearer <OIDC token>
        v
[Cloud Run Service]
        |
        | Middleware: verify OIDC token issuer = Google
        | Verify audience = this service's URL
        | Execute job handler
        v
[Cloud SQL / Firebase RTDB / Pub/Sub]
```

### 6.5 Security

- Service account: `lmdr-scheduler@ldmr-velocitymatch.iam.gserviceaccount.com`
- Roles granted: `roles/run.invoker` on each target Cloud Run service (not project-wide)
- Cloud Tasks queue uses the same service account for OIDC token generation
- Cloud Run services validate OIDC token audience matches their own service URL

---

## 7. Service 5 — Search (PostgreSQL Full-Text + PostGIS)

### 7.1 Current State

Wix data collections provide basic built-in search with no full-text indexing, no geo-radius filtering, and no semantic ranking. This is insufficient for a marketplace matching drivers to jobs.

### 7.2 Target State

Primary: PostgreSQL full-text search using `tsvector`/`tsquery` with GIN indexes. Geo-radius search via PostGIS `ST_DWithin`. Secondary (Phase 4b): Vertex AI Search for semantic recommendations.

### 7.3 Database Schema Changes

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- drivers table additions
ALTER TABLE drivers
  ADD COLUMN search_vector tsvector,
  ADD COLUMN location geography(Point, 4326);

CREATE INDEX idx_drivers_search ON drivers USING GIN(search_vector);
CREATE INDEX idx_drivers_location ON drivers USING GIST(location);

CREATE TRIGGER drivers_search_vector_update
  BEFORE INSERT OR UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english',
    first_name, last_name, city, state, skills_text, license_class);

-- jobs table additions
ALTER TABLE jobs
  ADD COLUMN search_vector tsvector,
  ADD COLUMN location geography(Point, 4326);

CREATE INDEX idx_jobs_search ON jobs USING GIN(search_vector);
CREATE INDEX idx_jobs_location ON jobs USING GIST(location);

-- carriers table additions
ALTER TABLE carriers
  ADD COLUMN search_vector tsvector;

CREATE INDEX idx_carriers_search ON carriers USING GIN(search_vector);
```

### 7.4 Search Endpoints (in `lmdr-matching-engine`)

- `GET /search/drivers?q=&location=&radius=&skills=&licenseClass=` — full-text driver search with optional geo-radius
- `GET /search/jobs?q=&location=&radius=&type=&minPay=` — full-text job search with optional geo-radius
- `GET /search/suggest?q=&type=driver|job` — autocomplete using `pg_trgm` trigram similarity

### 7.5 Architecture — Search Query Flow

```
[Client: GET /search/drivers?q=cdl+a&location=41.8781,-87.6298&radius=50]
        |
        v
[lmdr-matching-engine]
        |
        | 1. Parse params, build tsvector query + PostGIS radius filter
        | SELECT * FROM drivers
        |   WHERE search_vector @@ plainto_tsquery('english', $1)
        |   AND ST_DWithin(location, ST_MakePoint($lon, $lat)::geography, $radius_meters)
        |   ORDER BY ts_rank(search_vector, plainto_tsquery('english', $1)) DESC
        v
[Cloud SQL lmdr-postgres]
        |
        | Returns ranked, geo-filtered driver records
        v
[lmdr-matching-engine returns JSON to client]
```

### 7.6 Phase 4b — Vertex AI Search (Optional)

Index Cloud SQL data → BigQuery export → Vertex AI Search datastore for semantic job recommendations. This enhances but does not replace the PostgreSQL FTS layer. Timeline: Phase 4b (post-Phase 4 stabilization).

---

## 8. Service 6 — Observability (Cloud Logging + Monitoring + Trace)

### 8.1 Current State

No centralized observability. Wix provides minimal built-in logging visible only in the Wix dashboard. No alerting, no distributed tracing, no performance monitoring.

### 8.2 Target State

Full-stack observability across all Phase 1-4 services using Cloud Logging, Cloud Monitoring, and Cloud Trace.

### 8.3 Structured Log Format

All Cloud Run services emit JSON logs with the following standard fields:

```json
{
  "severity": "INFO | WARNING | ERROR | CRITICAL",
  "message": "Human-readable description",
  "requestId": "uuid-v4",
  "userId": "firebase-uid or null",
  "serviceVersion": "1.0.0",
  "traceId": "projects/ldmr-velocitymatch/traces/<hex>",
  "spanId": "<hex>",
  "httpRequest": {
    "requestMethod": "POST",
    "requestUrl": "/path",
    "status": 200,
    "latencyMs": 143
  }
}
```

### 8.4 Alerting Policies

| Alert | Condition | Notification |
|-------|-----------|-------------|
| High error rate | Error rate > 1% over 5 minutes (any service) | PagerDuty + email |
| High latency | p95 latency > 2000ms over 5 minutes | Email |
| SQL connection exhaustion | Cloud SQL connections > 80% of max_connections | PagerDuty |
| Cold start surge | Cloud Run cold starts > 10/minute | Email |
| Budget threshold | GCP billing > 80% of monthly budget | Email |

### 8.5 Architecture — Observability Stack

```
[All Cloud Run Services]
        |
        | @google-cloud/logging (structured JSON)
        | @google-cloud/trace-agent (automatic span injection)
        v
[Cloud Logging]
        |
        | Log sink: _Default bucket
        | Log sink: lmdr-logs bucket (90-day retention, all services)
        v
[Cloud Monitoring]
        |
        | Custom dashboards per service:
        |   - Request rate (req/min)
        |   - Error rate (%)
        |   - p50 / p95 / p99 latency
        |   - Cold start count
        |   - Active instances
        |
        | Alerting policies → Notification channels
        v
[PagerDuty / Email / Slack]

[Cloud Trace]
        |
        | Distributed traces across Cloud Run → Cloud SQL → Pub/Sub calls
        | Trace viewer in Cloud Console
```

### 8.6 Uptime Checks

Cloud Monitoring uptime checks on `GET /health` for all services:
- `lmdr-api`, `lmdr-matching-engine`, `lmdr-driver-service`, `lmdr-carrier-service`
- `lmdr-compliance-service`, `lmdr-notifications-service`, `lmdr-billing-service`
- `lmdr-ai-service`, `lmdr-analytics-service`, `lmdr-frontend`

Check interval: 60 seconds. Alert if 2 consecutive checks fail.

---

## 9. Service 7 — AI Intelligence Service Finalization

### 9.1 Current State

`services/ai-intelligence/` exists in the monorepo as a local/ad-hoc prototype. It implements a RAG pipeline, vector database integration, and LLM calls. It is not containerized, not deployed, and not connected to the production Cloud SQL database.

### 9.2 Target State

Production-grade Cloud Run service `lmdr-ai-service` deployed from the existing `services/ai-intelligence/` codebase with production Dockerization, Vertex AI integration, Cloud SQL `pgvector` for embeddings, and all endpoints live and callable by `lmdr-matching-engine`.

### 9.3 Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/ai/recommend-jobs` | Personalized job recommendations for a driver |
| `POST` | `/ai/rag/query` | RAG pipeline query against driver/carrier corpus |
| `POST` | `/ai/vectors/upsert` | Store/update embeddings in `pgvector` |
| `POST` | `/ai/vectors/search` | Semantic vector similarity search |
| `POST` | `/ai/sync/airtable` | Legacy Airtable data sync (temporary bridge) |
| `POST` | `/jobs/refresh-rag` | Scheduled RAG corpus refresh (Cloud Scheduler target) |
| `GET` | `/health` | Uptime check endpoint |

### 9.4 Infrastructure Specifications

- Cloud Run service: `lmdr-ai-service`
- Memory: 4Gi (LLM inference and vector operations are memory-intensive)
- CPU: 2
- Min instances: 1 (cold starts on AI service are expensive)
- Region: `us-central1`
- Secret Manager secrets consumed: `openai-api-key`, `firebase-admin-sdk`
- LLM strategy: OpenAI GPT-4o via API key in Secret Manager; Vertex AI Gemini as fallback/replacement path

### 9.5 Vector Database

- Enable `pgvector` extension on Cloud SQL `lmdr` database
- Embeddings table: stores 1536-dimension vectors (OpenAI `text-embedding-3-small`) or 768-dimension (Vertex AI `textembedding-gecko`)
- IVFFlat index on embeddings column for approximate nearest neighbor search

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(50) NOT NULL,  -- 'driver_profile' | 'job_posting' | 'carrier_profile'
  document_id UUID NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_embeddings_vector ON document_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## 10. Migration Strategy

### 10.1 Deployment Order

Phase 4 services have internal dependencies that require a specific deployment sequence:

```
Week 1:  Observability (6) — deploy first; all subsequent work is monitored
Week 1:  Firebase Project Setup (1a) — Firebase Auth provider + Admin SDK package
Week 2:  Cloud Storage Buckets (2) — required for file upload flows
Week 2:  Pub/Sub Topics (3b) — required for inter-service events
Week 2:  Firebase RTDB (3a) — real-time client subscriptions
Week 3:  Firebase Auth Frontend Integration (1b) — connects frontend to Firebase Auth
Week 3:  Cloud Scheduler + Cloud Tasks (4) — replaces Wix cron
Week 3:  PostgreSQL Search (5) — schema migrations on Cloud SQL
Week 4:  AI Service Containerization (7) — deploys lmdr-ai-service
Week 4:  IAM Hardening (cross-cutting) — audit all service accounts
Week 5:  End-to-end integration testing
Week 5:  Wix decommission checklist
```

### 10.2 Parallel Wix Operation

During Phase 4 deployment, Wix remains live. Firebase Auth accepts new sign-ups; Wix Auth continues for existing sessions. A dual-auth period (maximum 2 weeks) allows existing Wix users to migrate via email re-verification link sent to all existing accounts. Wix is not decommissioned until all migration verification criteria are met.

---

## 11. Service Account and IAM Design

Least-privilege service accounts, one per Cloud Run service:

| Service Account | Service | Roles |
|----------------|---------|-------|
| `lmdr-api-sa@ldmr-velocitymatch.iam.gserviceaccount.com` | `lmdr-api` | `roles/cloudsql.client`, `roles/secretmanager.secretAccessor` |
| `lmdr-matching-sa@ldmr-velocitymatch.iam.gserviceaccount.com` | `lmdr-matching-engine` | `roles/cloudsql.client`, `roles/secretmanager.secretAccessor` |
| `lmdr-driver-sa@ldmr-velocitymatch.iam.gserviceaccount.com` | `lmdr-driver-service` | `roles/cloudsql.client`, `roles/storage.objectAdmin` (driver-documents only), `roles/secretmanager.secretAccessor` |
| `lmdr-carrier-sa@ldmr-velocitymatch.iam.gserviceaccount.com` | `lmdr-carrier-service` | `roles/cloudsql.client`, `roles/storage.objectAdmin` (carrier-assets only), `roles/secretmanager.secretAccessor` |
| `lmdr-compliance-sa@ldmr-velocitymatch.iam.gserviceaccount.com` | `lmdr-compliance-service` | `roles/cloudsql.client`, `roles/storage.objectViewer` (driver-documents), `roles/pubsub.subscriber`, `roles/secretmanager.secretAccessor` |
| `lmdr-notifications-sa@ldmr-velocitymatch.iam.gserviceaccount.com` | `lmdr-notifications-service` | `roles/cloudsql.client`, `roles/pubsub.subscriber`, `roles/pubsub.publisher`, `roles/secretmanager.secretAccessor` |
| `lmdr-billing-sa@ldmr-velocitymatch.iam.gserviceaccount.com` | `lmdr-billing-service` | `roles/cloudsql.client`, `roles/secretmanager.secretAccessor` |
| `lmdr-ai-sa@ldmr-velocitymatch.iam.gserviceaccount.com` | `lmdr-ai-service` | `roles/cloudsql.client`, `roles/storage.objectAdmin` (ai-training-data), `roles/aiplatform.user`, `roles/secretmanager.secretAccessor` |
| `lmdr-analytics-sa@ldmr-velocitymatch.iam.gserviceaccount.com` | `lmdr-analytics-service` | `roles/cloudsql.client`, `roles/bigquery.dataViewer`, `roles/secretmanager.secretAccessor` |
| `lmdr-scheduler@ldmr-velocitymatch.iam.gserviceaccount.com` | Cloud Scheduler | `roles/run.invoker` (per-service, not project-wide) |
| `lmdr-auth-provisioner@ldmr-velocitymatch.iam.gserviceaccount.com` | Cloud Functions auth hook | `roles/run.invoker` (`lmdr-api` only) |

No service account holds `roles/owner`, `roles/editor`, or project-wide `roles/run.invoker`.

---

## 12. Security Posture

- All Cloud Run services are deployed with `--no-allow-unauthenticated` (ingress: internal + load balancer only)
- All inter-service calls use service account OIDC tokens
- Cloud Storage buckets are all `uniform-bucket-level-access` enabled; no ACLs
- Firebase RTDB security rules enforce role-based access; no public read/write
- All secrets stored in Secret Manager; no secrets in environment variables or code
- VPC Connector enables all Cloud Run services to use private Cloud SQL connection (no public IP on Cloud SQL)
- Cloud Armor enabled on the GCP Load Balancer: DDoS protection + WAF rules for OWASP Top 10
- Binary Authorization: Cloud Run only accepts images signed by `ldmr-velocitymatch` Cloud Build

---

## 13. Cost Estimate

| Service | Tier / SKU | Estimated Monthly Cost |
|---------|------------|----------------------|
| Firebase Auth | Blaze plan (pay-as-you-go) | ~$0 for <10k MAU; scales at $0.0055/MAU above 10k |
| Firebase RTDB | Blaze plan | ~$5–$25/month (100GB storage, 10GB/day transfer) |
| Cloud Storage (4 buckets) | Standard storage | ~$20–$50/month (500GB total, egress) |
| Cloud Pub/Sub | Per-message pricing | ~$5–$15/month at moderate message volume |
| Cloud Scheduler | 3 free jobs/month; $0.10/job/month | ~$1/month (7 jobs) |
| Cloud Tasks | $0.40/million tasks | ~$1–$5/month |
| Cloud Logging | First 50GB/month free; $0.50/GB | ~$10–$30/month |
| Cloud Monitoring | First 150MB metrics free | ~$5–$20/month |
| Cloud Trace | First 2.5M spans free | ~$0–$10/month |
| Cloud Run `lmdr-ai-service` (4Gi) | CPU + memory pricing | ~$50–$150/month |
| **Total Phase 4 additions** | | **~$100–$300/month** |

Note: Firebase Auth on Blaze plan does not add cost at launch-scale user volumes. Switch from Spark to Blaze is required before any Cloud Functions (auth provisioner) can be deployed.

---

## 14. Rollback Strategy

| Service | Rollback Approach |
|---------|------------------|
| Firebase Auth | Maintain Wix Auth in parallel for 2-week overlap. Roll back by re-pointing frontend to Wix session management. Firebase users can be exported. |
| Cloud Storage | Files remain in buckets; signed URL service can be disabled. Wix Media Manager files are not deleted until Wix decommission is confirmed. |
| Firebase RTDB | RTDB writes are additive. Roll back by stopping writes from Cloud Run services; clients degrade gracefully without real-time updates. |
| Cloud Scheduler | Jobs can be paused individually via `gcloud scheduler jobs pause`. Underlying Cloud Run endpoints remain live. |
| Search (PostgreSQL) | Search columns are additive (not destructive). Roll back by removing search endpoints; existing column data is harmless. |
| Observability | Observability is read-only; no rollback risk. Log sink can be deleted without affecting services. |
| AI Service | Roll back Cloud Run revision; traffic shifts back to previous revision instantly. |

---

## 15. Success Criteria

Phase 4 is considered complete when all of the following are verified:

- [ ] All Phase 2 Cloud Run services return 200 from `/health` with Firebase Auth middleware active
- [ ] Driver can complete full sign-up, upload CDL, have compliance status updated, and apply to a job — end-to-end without touching Wix
- [ ] Carrier can complete sign-up (Google OAuth), post a job, search drivers, hire, and view invoice — end-to-end without touching Wix
- [ ] All 7 Cloud Scheduler jobs execute successfully on manual trigger with correct DB side effects
- [ ] Driver search returns geo-filtered results within 500ms at p95 under 50 concurrent users
- [ ] Firebase RTDB updates propagate to browser client within 500ms of server write
- [ ] Zero secrets stored outside Secret Manager (audit verified)
- [ ] All Cloud Run services emit structured logs visible in `lmdr-logs` log bucket
- [ ] Cloud Monitoring dashboard shows all services; at least 1 alerting policy fires on a synthetic error injection test
- [ ] `lmdr-ai-service` returns job recommendations within 5 seconds at p95
- [ ] No service account holds `roles/owner` or `roles/editor` (IAM audit passed)
- [ ] Wix decommission checklist fully checked off
