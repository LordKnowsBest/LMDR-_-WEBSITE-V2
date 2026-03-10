# Phase 2 Business Logic Migration — Product Requirements Document

> **Addendum to:** `Conductor/tracks/gcp_migration_20260218/plan.md`
> **Addendum series:** This is Addendum 2. Addendum 1 (`ADDENDUM_cloud_run_api/`) covered the generic query API. This addendum covers migrating all ~250 Wix `.jsw` business logic files to Cloud Run microservices.
> **Date:** 2026-03-09
> **GCP Project:** `ldmr-velocitymatch` — Region: `us-central1`

---

## 1. Executive Summary

LMDR's business logic is currently implemented as ~250 Wix Velo `.jsw` files running inside Wix's proprietary backend environment. This architecture prevents independent deployment, local testing, CI/CD pipelines, and horizontal scaling of individual capabilities.

Phase 2 migrates all `.jsw` business logic to eight new Cloud Run microservices plus one enhancement to the existing `lmdr-api` service. Each service owns a cohesive functional domain, communicates over HTTP or Pub/Sub, and connects to Cloud SQL via the existing VPC connector and `@google-cloud/cloud-sql-connector`. The migration uses the Strangler Fig pattern: Wix `.jsw` files remain in place and continue serving traffic while Cloud Run equivalents are built and validated. Feature flags in Secret Manager govern which path handles each request. Cutover happens domain by domain, and rollback is a single flag update.

**Outcome:** All LMDR business logic runs on GCP, is testable offline, deploys independently per service, and scales to any load without Wix's execution limits or cold-start unpredictability.

---

## 2. Current State

### 2.1 Wix .jsw Architecture

| Layer | File count | Runtime |
|-------|-----------|---------|
| Data access | ~10 files | Wix sandbox (Node.js-like, restricted) |
| Business logic | ~240 files | Wix sandbox |
| HTTP functions | ~5 files | Wix Edge (public HTTP, limited) |
| Scheduled jobs | 3 jobs in `jobs.config` | Wix Cron |

All files import from `backend/dataAccess.jsw`, which currently routes to Airtable. The Cloud SQL migration (Phase 1) replaced Airtable storage. Addendum 1 created `lmdr-api` as the generic CRUD query surface. This addendum replaces the business logic layer.

### 2.2 Pain Points

| Pain Point | Impact |
|-----------|--------|
| No local dev environment — `wix dev` only | Every test requires a live Wix deployment. CI is impossible. |
| Wix sandbox restricts npm packages | Cannot use `pg`, `bullmq`, `openai`, `twilio`, or `sendgrid` SDKs directly |
| No inter-service calls — Wix has no service mesh | Complex flows span multiple `.jsw` files via flat function imports — no real isolation |
| Wix execution timeout: 14 seconds | AI and compliance checks time out on slow third-party APIs |
| Cannot instrument with Cloud Trace | Distributed tracing, structured logging, and real metrics dashboards are unavailable |
| Hard deploy coupling | Any `.jsw` change redeploys the entire Wix backend |
| Rate limits on Wix HTTP functions | External API partners are throttled at Wix's infrastructure level, not ours |

### 2.3 .jsw File Inventory by Category

| # | Category | Approx. Files | Current .jsw Filenames (representative) |
|---|----------|--------------|----------------------------------------|
| 1 | Driver Onboarding & Registration | 15 | `driverProfiles.jsw`, `onboardingService.jsw`, `documentCollectionService.jsw` |
| 2 | Job Matching Engine | 20 | `carrierMatching.jsw`, `driverScoring.js`, `matchExplanationService.jsw` |
| 3 | Carrier Management | 15 | `carrierService.jsw`, `carrierAdminService.jsw`, `carrierPreferences.jsw` |
| 4 | Dispatch & Scheduling | 20 | `dispatchService.jsw`, `loadBoardService.jsw`, `shiftScheduler.jsw` |
| 5 | Compliance & Document Management | 18 | `complianceService.jsw`, `mvrService.jsw`, `backgroundCheckService.jsw` |
| 6 | Notifications & Messaging | 15 | `notificationService.jsw`, `emailService.jsw`, `smsService.jsw` |
| 7 | Payments & Billing | 12 | `billingService.jsw`, `invoiceService.jsw`, `payoutService.jsw` |
| 8 | AI Intelligence Layer | 20 | `aiRouterService.jsw`, `ragService.jsw`, `vectorService.jsw` |
| 9 | Analytics & Reporting | 10 | `observabilityService.jsw`, `reportingService.jsw`, `admin_audit_service.jsw` |
| 10 | Authentication & Authorization | 8 | `authService.jsw`, `roleService.jsw`, `sessionService.jsw` |
| 11 | Webhooks & Integrations | 12 | `http-functions.js` (VAPI, Stripe, ATS webhooks) |
| 12 | Search & Discovery | 8 | `searchService.jsw`, `geoService.jsw` |
| 13 | File & Media Processing | 6 | `documentUploadService.jsw`, `cdlPhotoService.jsw` |
| 14 | Audit & Logging | 5 | `auditService.jsw`, `complianceEventService.jsw` |
| 15 | Rate Limiting & Throttling | 4 | `rateLimitService.jsw` |
| 16 | Configuration & Feature Flags | 5 | `configData.js`, `featureFlagService.jsw` |
| 17 | Data Sync & ETL | 8 | `airtableSyncService.jsw`, `etlService.jsw` |
| 18 | Health & Status | 4 | `healthService.jsw`, `recruiterHealthService.jsw` |

---

## 3. Target State

### 3.1 Cloud Run Microservices

Nine Cloud Run services replace or extend the `.jsw` layer. Every service:
- Is a Node.js 20 / TypeScript Express app
- Connects to Cloud SQL (`ldmr-velocitymatch:us-central1:lmdr-postgres`) via Cloud SQL Connector over the existing VPC connector
- Reads all secrets from Secret Manager
- Emits structured JSON logs to Cloud Logging
- Exposes `GET /health` with no auth for Cloud Run health checks
- Is built and deployed by Cloud Build via its own `cloudbuild.yaml`

### 3.2 Benefits

| Benefit | How Achieved |
|---------|-------------|
| Local development | `docker-compose.yml` per service with local Postgres |
| Independent deployment | Separate Cloud Build trigger per service directory |
| npm unrestricted | Full Node.js ecosystem — `pg`, `openai`, `twilio`, `@sendgrid/mail` |
| No timeout ceiling | Cloud Run timeout up to 3600s; long-running jobs use Cloud Tasks |
| Distributed tracing | Cloud Trace + OpenTelemetry auto-instrumentation |
| Horizontal scaling | Cloud Run autoscales per service independently |
| Rollback in seconds | Cloud Run revision rollback via `gcloud run services update-traffic` |

---

## 4. Service Architecture Map

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         LMDR GCP — Phase 2 Services                          │
│                         GCP Project: ldmr-velocitymatch                       │
│                         Region: us-central1                                   │
├─────────────────────────┬────────────────────────────────────────────────────┤
│  Service Name           │  Responsibilities (Categories)                      │
├─────────────────────────┼────────────────────────────────────────────────────┤
│  lmdr-api (enhanced)    │  11 Webhooks & Integrations                         │
│  (existing, Addendum 1) │  15 Rate Limiting & Throttling                      │
│                         │  16 Configuration & Feature Flags                   │
│                         │  18 Health & Status                                 │
├─────────────────────────┼────────────────────────────────────────────────────┤
│  lmdr-matching-engine   │  2  Job Matching Engine                             │
│  (new)                  │  12 Search & Discovery                              │
├─────────────────────────┼────────────────────────────────────────────────────┤
│  lmdr-driver-service    │  1  Driver Onboarding & Registration                │
│  (new)                  │  13 File & Media Processing                         │
├─────────────────────────┼────────────────────────────────────────────────────┤
│  lmdr-carrier-service   │  3  Carrier Management                              │
│  (new)                  │  4  Dispatch & Scheduling                           │
├─────────────────────────┼────────────────────────────────────────────────────┤
│  lmdr-compliance-service│  5  Compliance & Document Management                │
│  (new)                  │  14 Audit & Logging                                 │
├─────────────────────────┼────────────────────────────────────────────────────┤
│  lmdr-notifications-    │  6  Notifications & Messaging                       │
│  service (new)          │                                                     │
├─────────────────────────┼────────────────────────────────────────────────────┤
│  lmdr-billing-service   │  7  Payments & Billing                              │
│  (new)                  │                                                     │
├─────────────────────────┼────────────────────────────────────────────────────┤
│  lmdr-ai-service        │  8  AI Intelligence Layer                           │
│  (new — wraps existing  │  17 Data Sync & ETL                                 │
│  services/ai-intelligence│                                                    │
│  monorepo)              │                                                     │
├─────────────────────────┼────────────────────────────────────────────────────┤
│  lmdr-analytics-service │  9  Analytics & Reporting                           │
│  (new)                  │  10 Authentication & Authorization (partial)        │
└─────────────────────────┴────────────────────────────────────────────────────┘
```

**Inter-service communication:** Synchronous HTTP for request/response flows. Cloud Pub/Sub for async work (notification delivery, AI batch jobs, ETL sync triggers). Services never share a database pool — each service has its own connection pool to Cloud SQL.

---

## 5. Technology Stack

### 5.1 Runtime

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Runtime | Node.js 20 LTS | Matches Wix Velo's JS semantics. Maximizes code reuse. |
| Language | TypeScript 5.x | Strict mode. Shared types via `@lmdr/types` package. |
| Framework | Express 4.x | Same as `lmdr-api` (Addendum 1). Minimal overhead. |
| Test runner | Jest 29 | Same as `lmdr-api`. |
| Database client | `pg` 8 + `@google-cloud/cloud-sql-connector` | Direct connector avoids Cloud SQL Proxy sidecar. |
| Container | Docker (node:20-slim base image) | Minimizes image size and attack surface. |

### 5.2 Shared Packages (Monorepo)

All Cloud Run services share code via a `packages/` monorepo co-located with `cloud-run-api/`:

```
cloud-run-api/
packages/
  lmdr-db/          ← Re-exports pool, query helpers from Addendum 1
  lmdr-middleware/  ← Auth middleware, rate limiting, request logging
  lmdr-types/       ← TypeScript interfaces: DriverProfile, Job, Carrier, etc.
services/
  matching-engine/
  driver-service/
  carrier-service/
  compliance-service/
  notifications-service/
  billing-service/
  ai-service/        ← Wraps existing services/ai-intelligence/
  analytics-service/
```

### 5.3 GCP Services Used

| GCP Service | Purpose |
|------------|---------|
| Cloud Run | Hosts all microservices (serverless containers) |
| Cloud SQL (PostgreSQL 15) | Operational data store — `lmdr-postgres` instance |
| Secret Manager | All credentials, API keys, third-party secrets |
| Cloud Build | CI/CD — one trigger per service directory |
| Artifact Registry | Docker image storage — `gcr.io/ldmr-velocitymatch/` |
| VPC Connector | Private connectivity from Cloud Run to Cloud SQL |
| Cloud Pub/Sub | Async messaging — topic `lmdr-notifications` for notification delivery |
| Cloud Logging | Structured JSON log ingestion |
| Cloud Monitoring | Service dashboards, alerting policies |
| Cloud Trace | Distributed tracing (OpenTelemetry) |
| Cloud Tasks | Long-running async jobs (compliance checks, ETL) |
| Cloud Storage | Document and file uploads (Phase 4 — referenced here, implemented later) |

### 5.4 Third-Party Integrations (secrets in Secret Manager)

| Integration | Secret Name | Service Consumer |
|------------|------------|-----------------|
| SendGrid (email) | `lmdr-sendgrid-api-key` | `lmdr-notifications-service` |
| Twilio (SMS) | `lmdr-twilio-account-sid`, `lmdr-twilio-auth-token` | `lmdr-notifications-service` |
| Firebase Admin | `lmdr-firebase-service-account` | `lmdr-api`, `lmdr-analytics-service` |
| OpenAI | `lmdr-openai-api-key` | `lmdr-ai-service` |
| VAPI | `lmdr-vapi-private-key` | `lmdr-ai-service` |
| Stripe (payment webhooks) | `lmdr-stripe-webhook-secret` | `lmdr-billing-service` |
| MVR check provider | `lmdr-mvr-api-key` | `lmdr-compliance-service` |
| Background check provider | `lmdr-bgcheck-api-key` | `lmdr-compliance-service` |
| Cloud SQL password | `lmdr-pg-password` | All services |
| API key pepper | `lmdr-api-key-pepper` | `lmdr-api` |

---

## 6. Integration with Phase 1

### 6.1 Cloud SQL

All services connect to `ldmr-velocitymatch:us-central1:lmdr-postgres`, database `lmdr`, user `lmdr_user`. The `@lmdr/db` shared package exposes a pre-configured `pg.Pool` and the JSONB query DSL from Addendum 1. Services import:

```typescript
import { pool, queryRecords, insertRecord } from '@lmdr/db';
```

New structured tables (typed columns, indexes) are added to the existing `lmdr` database — they coexist with the JSONB `airtable_*` tables already migrated.

### 6.2 Secret Manager

All secrets already provisioned in Phase 1 (`lmdr-pg-password`, `lmdr-api-key-pepper`) are reused. New secrets are added per service. Cloud Run service accounts follow the same pattern: each service account is granted only the secrets its service needs.

### 6.3 VPC Connector

The VPC connector (`lmdr-vpc-connector`, `us-central1`) provisioned in Phase 1 is attached to all new Cloud Run services. No new connector is required.

### 6.4 Cloud Build

Phase 1 Cloud Build config is in `cloud-run-api/cloudbuild.yaml`. Each new service adds its own `cloudbuild.yaml` and a separate Cloud Build trigger scoped to its directory. The shared `packages/` are built first via a root-level `cloudbuild.yaml` that installs workspace dependencies.

### 6.5 lmdr-api Enhancements

`lmdr-api` (Addendum 1) gains three new routers:

- `src/routes/webhooks.js` — handles inbound webhooks (VAPI, Stripe, ATS) previously in `src/backend/http-functions.js`
- `src/routes/flags.js` — feature flag read endpoint, backed by Secret Manager labels
- `src/middleware/rateLimiter.js` — enhanced to share state via Cloud SQL for multi-instance consistency (replaces in-memory-only approach)

---

## 7. Service API Contract Summary

### 7.1 lmdr-matching-engine

Base URL: `https://lmdr-matching-engine-<hash>-uc.a.run.app`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/match/find-jobs` | Ranked job list for a driver profile |
| POST | `/match/find-drivers` | Ranked driver list for a job spec |
| GET | `/match/explain/:driverId/:carrierId` | Match explanation rationale |
| GET | `/search/jobs` | Geo + filter job search |
| GET | `/search/drivers` | Skill-based driver search |
| POST | `/search/jobs/bulk` | Bulk job search (batch) |

### 7.2 lmdr-driver-service

Base URL: `https://lmdr-driver-service-<hash>-uc.a.run.app`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/drivers` | Create driver profile |
| GET | `/drivers/:id` | Get driver profile |
| PUT | `/drivers/:id` | Update driver profile |
| PUT | `/drivers/:id/onboarding-step` | Advance onboarding state machine |
| GET | `/drivers/:id/onboarding-status` | Get current onboarding state |
| POST | `/drivers/:id/documents` | Register document metadata |
| GET | `/drivers/:id/documents` | List driver's documents |
| PUT | `/drivers/:id/visibility` | Update profile visibility/searchability |

### 7.3 lmdr-carrier-service

Base URL: `https://lmdr-carrier-service-<hash>-uc.a.run.app`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/carriers` | Create carrier account |
| GET | `/carriers/:id` | Carrier details |
| PUT | `/carriers/:id` | Update carrier |
| GET | `/carriers/:id/settings` | Carrier settings/preferences |
| PUT | `/carriers/:id/settings` | Update carrier settings |
| POST | `/carriers/:id/jobs` | Post a new job |
| GET | `/carriers/:id/jobs` | Carrier's job board |
| PUT | `/carriers/:id/jobs/:jobId` | Update job listing |
| DELETE | `/carriers/:id/jobs/:jobId` | Remove job listing |
| POST | `/dispatch/assign` | Assign driver to job |
| DELETE | `/dispatch/assign/:assignmentId` | Unassign |
| GET | `/dispatch/queue` | Current dispatch queue |
| GET | `/dispatch/schedule` | Shift schedule |
| POST | `/dispatch/schedule` | Create shift block |

### 7.4 lmdr-compliance-service

Base URL: `https://lmdr-compliance-service-<hash>-uc.a.run.app`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/compliance/mvr-check` | Trigger MVR check (async via Cloud Tasks) |
| GET | `/compliance/mvr-check/:checkId` | Poll MVR check status |
| POST | `/compliance/background-check` | Trigger background screening |
| GET | `/compliance/background-check/:checkId` | Poll background check status |
| GET | `/compliance/drivers/:id/status` | Full compliance status summary |
| POST | `/compliance/documents/validate` | Validate CDL or uploaded document |
| POST | `/audit/events` | Write audit event |
| GET | `/audit/drivers/:id` | Driver audit trail |
| GET | `/audit/events` | Query audit events (admin) |

### 7.5 lmdr-notifications-service

Base URL: `https://lmdr-notifications-service-<hash>-uc.a.run.app`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/notify/email` | Send transactional email via SendGrid |
| POST | `/notify/sms` | Send SMS via Twilio |
| POST | `/notify/push` | Send push notification |
| POST | `/notify/batch` | Send to a list (chunked, rate-safe) |
| GET | `/notifications/:recipientId` | Notification history for recipient |
| PUT | `/notifications/:id/read` | Mark notification read |

Pub/Sub: subscribes to `lmdr-notifications` topic for async delivery. Retries up to 5 times with exponential backoff.

### 7.6 lmdr-billing-service

Base URL: `https://lmdr-billing-service-<hash>-uc.a.run.app`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/billing/rate-cards` | List applicable rate cards |
| POST | `/billing/invoices` | Generate invoice |
| GET | `/billing/invoices/:id` | Invoice detail |
| GET | `/billing/invoices` | List invoices (filter by carrier/driver/status) |
| POST | `/billing/payouts/calculate` | Calculate driver payout for period |
| POST | `/billing/payouts/submit` | Submit payout batch |
| POST | `/webhooks/stripe` | Stripe payment processor webhook (HMAC-verified) |

### 7.7 lmdr-ai-service

Base URL: `https://lmdr-ai-service-<hash>-uc.a.run.app`

Wraps the existing `services/ai-intelligence/` monorepo as a Cloud Run service. Endpoints map to existing function signatures.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/ai/recommend-jobs` | AI job recommendations for driver |
| POST | `/ai/rag/query` | RAG pipeline query |
| POST | `/ai/rag/ingest` | Ingest document into RAG pipeline |
| POST | `/ai/vectors/upsert` | Upsert vectors to vector store |
| POST | `/ai/vectors/search` | Vector similarity search |
| POST | `/ai/agent/turn` | Agent orchestration turn (maps to `agentService.jsw` `handleAgentTurn`) |
| POST | `/ai/sync/airtable` | Trigger legacy Airtable sync (ETL, during transition) |
| GET | `/ai/usage` | AI usage metrics for cost optimizer |

### 7.8 lmdr-analytics-service

Base URL: `https://lmdr-analytics-service-<hash>-uc.a.run.app`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/analytics/dashboard` | Aggregate dashboard metrics |
| GET | `/analytics/reports/:type` | Generate report (driver / carrier / system) |
| GET | `/analytics/drivers/:id/performance` | Driver performance metrics |
| GET | `/analytics/carriers/:id/metrics` | Carrier performance metrics |
| GET | `/analytics/system/health` | System health summary (maps to `recruiterHealthService.jsw`) |
| POST | `/analytics/events` | Ingest analytics event |
| GET | `/auth/roles/:uid` | Role and permission lookup for UID |
| POST | `/auth/roles/:uid` | Assign role (admin only) |

---

## 8. Non-Functional Requirements

| Requirement | Target | Measurement |
|------------|--------|-------------|
| P95 response latency (warm instance) | < 200ms | Cloud Monitoring — request latency percentile |
| P99 response latency (warm instance) | < 500ms | Cloud Monitoring |
| Cold start time | < 3s | Cloud Run cold start metric |
| Minimum instances | 1 per service (matching-engine, driver, carrier) | Cloud Run min-instances config |
| Maximum instances | 20 (matching-engine), 10 (all others) | Cloud Run max-instances config |
| Concurrent requests per instance | 80 (default Cloud Run) | Cloud Run concurrency config |
| Availability | 99.9% | Cloud Monitoring uptime check |
| Memory per container | 512Mi (most services), 1Gi (ai-service) | Cloud Run memory config |
| CPU per container | 1 vCPU (most services), 2 vCPU (ai-service) | Cloud Run CPU config |
| Test coverage | ≥ 80% statements per service | Jest coverage report in Cloud Build |
| Cloud SQL connections | Pool size 5 per instance; max 50 per service | `pg.Pool` config + Cloud SQL max_connections |

---

## 9. Migration Strategy — Strangler Fig

The Strangler Fig pattern allows Wix `.jsw` files and Cloud Run services to coexist indefinitely. Traffic is routed by feature flag per endpoint, not per service. No "big bang" cutover.

### 9.1 Flag Structure

Feature flags live in Secret Manager as a single JSON secret `lmdr-feature-flags`:

```json
{
  "matching_engine": "wix",
  "driver_service": "wix",
  "carrier_service": "wix",
  "compliance_service": "wix",
  "notifications_service": "wix",
  "billing_service": "wix",
  "ai_service": "wix",
  "analytics_service": "wix"
}
```

Values: `"wix"` (route to `.jsw`) | `"dual"` (call both, return `.jsw` result, log discrepancies) | `"gcp"` (route to Cloud Run only).

### 9.2 Routing in Wix .jsw Files

Each `.jsw` file that is being migrated wraps its logic:

```javascript
import { getServiceFlag } from 'backend/configData';
import { httpPost } from 'backend/gcpClient'; // thin Cloud Run HTTP client

export async function findMatchingJobs(driverProfile) {
  const flag = await getServiceFlag('matching_engine');
  if (flag === 'gcp') {
    return httpPost('matching-engine', '/match/find-jobs', driverProfile);
  }
  if (flag === 'dual') {
    const [wixResult, gcpResult] = await Promise.allSettled([
      _findMatchingJobsLocal(driverProfile),
      httpPost('matching-engine', '/match/find-jobs', driverProfile)
    ]);
    logDiscrepancy('matching_engine.findMatchingJobs', wixResult, gcpResult);
    return wixResult.value;
  }
  return _findMatchingJobsLocal(driverProfile);
}
```

### 9.3 Cutover Sequence Per Service

1. Deploy Cloud Run service — set flag to `"wix"` (shadow only via `dual` testing)
2. Set flag to `"dual"` — both paths execute; discrepancy log to Cloud Logging
3. Monitor discrepancy log for 72 hours — fix any Cloud Run divergences
4. Set flag to `"gcp"` — Cloud Run is primary; `.jsw` no longer called
5. After 14 days clean operation — remove `.jsw` routing wrapper, leave stub

---

## 10. Rollback Strategy

### 10.1 Per-Service Rollback

At any point, setting a service flag back to `"wix"` in `lmdr-feature-flags` secret restores the `.jsw` path. The `.jsw` files are never deleted during Phase 2.

```bash
# Rollback matching-engine to Wix
gcloud secrets versions add lmdr-feature-flags \
  --data-file=- <<< '{"matching_engine":"wix", ...}'
```

Cloud Run reads the flag on each request (cached 60s). Maximum blast radius of a failed cutover: 60 seconds of traffic, then automatic recovery when flag is updated.

### 10.2 Cloud Run Revision Rollback

If a bad build is deployed, traffic rolls back to the previous revision:

```bash
gcloud run services update-traffic lmdr-matching-engine \
  --to-revisions=PREVIOUS=100 \
  --region=us-central1 \
  --project=ldmr-velocitymatch
```

Cloud Build tags each deployed revision with the Git commit SHA for traceability.

---

## 11. Service Dependencies

```
lmdr-matching-engine
  └── reads: lmdr-driver-service (driver profile)
  └── reads: lmdr-carrier-service (job listings)
  └── reads: Cloud SQL (matching_scores, airtable_carriers_master)

lmdr-driver-service
  └── calls: lmdr-notifications-service (onboarding emails)
  └── calls: lmdr-compliance-service (trigger doc validation)
  └── writes: Cloud SQL (airtable_v2_driver_profiles)

lmdr-carrier-service
  └── calls: lmdr-notifications-service (carrier alerts)
  └── calls: lmdr-billing-service (job posting billing)
  └── writes: Cloud SQL (airtable_carriers_master, dispatch tables)

lmdr-compliance-service
  └── writes: Cloud SQL (compliance_checks, audit_events)
  └── calls: third-party MVR API, background check API
  └── calls: lmdr-notifications-service (compliance status alerts)

lmdr-notifications-service
  └── no upstream service calls (leaf service)
  └── publishes: Cloud Pub/Sub topic lmdr-notifications
  └── consumes: Cloud Pub/Sub topic lmdr-notifications (retry path)

lmdr-billing-service
  └── reads: lmdr-carrier-service (carrier account)
  └── reads: lmdr-driver-service (driver profile)
  └── calls: lmdr-notifications-service (invoice emails)

lmdr-ai-service
  └── reads: Cloud SQL (all JSONB tables for RAG ingestion)
  └── calls: lmdr-notifications-service (async AI result delivery)
  └── wraps: services/ai-intelligence/ (existing monorepo)

lmdr-analytics-service
  └── reads: Cloud SQL (all tables, read-only aggregation)
  └── no upstream service calls for write paths

lmdr-api (enhanced)
  └── orchestrates: feature flag reads from Secret Manager
  └── enhanced rate limiter writes: Cloud SQL (airtable_v2_api_usage)
```

---

## 12. Out of Scope

| Item | Phase |
|------|-------|
| Wix frontend pages (React/Velo page code) | Phase 3 |
| Wix authentication and member system migration | Phase 4 |
| Firebase Auth full integration (token issuance) | Phase 4 |
| Cloud Storage file upload endpoints (actual binary upload) | Phase 4 |
| BigQuery streaming for analytics events | Phase 3 |
| Real-time messaging (WebSockets / Cloud Spanner change streams) | Phase 3 |
| Full Airtable write-path deprecation | Follows Phase 2 cutover completion |
| Mobile app (if any) | Not in scope for any current phase |

---

## 13. Success Criteria and Acceptance Tests

### 13.1 Per-Service Acceptance Tests

Each service must pass these tests before flag is set to `"gcp"`:

1. `GET /health` returns `{ status: 'ok' }` with HTTP 200
2. All endpoint unit tests pass with ≥ 80% coverage
3. Integration tests against a test Cloud SQL instance pass
4. `dual` mode discrepancy log shows < 1% divergence rate over 72 hours
5. P95 latency ≤ 200ms under simulated load (10 concurrent users)
6. Cold start ≤ 3s from Cloud Run metrics

### 13.2 End-to-End Acceptance Tests (All Services `"gcp"`)

1. **Driver lifecycle:** Create driver → advance onboarding → trigger compliance check → receive notification → match to jobs
2. **Carrier lifecycle:** Create carrier → post job → dispatch driver → generate invoice → receive payout calculation
3. **AI flow:** Driver profile → AI job recommendation → RAG query for carrier detail → agent turn logged
4. **Notification delivery:** Email, SMS, and push notification all delivered within 10s of trigger
5. **Analytics dashboard:** Dashboard endpoint returns data with correct aggregates matching Cloud SQL counts
6. **Audit trail:** All mutation operations write to audit log; audit trail query returns correct events

### 13.3 System-Level Criteria

| Criterion | Target |
|-----------|--------|
| All 9 services deployed and healthy | 100% |
| All feature flags set to `"gcp"` | 100% |
| Airtable dependency for operational reads | 0 requests/hour |
| Cloud Logging errors per hour (P2+) | < 5 |
| Cloud Run revision rollback time | < 30 seconds |
| Monthly GCP cost increase vs Phase 1 baseline | < $120 additional |

---

## 14. Timeline Estimate

| Task | Service | Effort | Week |
|------|---------|--------|------|
| Shared monorepo setup (`packages/`) | Infrastructure | 2 days | W1 |
| lmdr-matching-engine | Matching + Search | 5 days | W1–W2 |
| lmdr-driver-service | Driver + Files | 4 days | W2 |
| lmdr-carrier-service | Carrier + Dispatch | 5 days | W2–W3 |
| lmdr-compliance-service | Compliance + Audit | 4 days | W3 |
| lmdr-notifications-service | Notifications | 3 days | W3 |
| lmdr-billing-service | Billing | 3 days | W4 |
| lmdr-ai-service | AI + ETL | 4 days | W4 |
| lmdr-analytics-service | Analytics + Auth | 3 days | W5 |
| lmdr-api enhancements | Webhooks + Flags | 2 days | W5 |
| Strangler Fig wrappers in .jsw files | Migration | 3 days | W5–W6 |
| `dual` mode monitoring and cutover | Migration | 5 days | W6–W7 |
| Observability dashboards + alerting | Platform | 2 days | W7 |
| OpenAPI docs + runbook | Documentation | 2 days | W7 |
| **Total** | | **~47 dev-days** | **~7 weeks** |

> **Parallelism note:** Services in W2–W4 can be developed in parallel if two engineers are available. Sequential estimate assumes one engineer.

---

*End of PRD*
