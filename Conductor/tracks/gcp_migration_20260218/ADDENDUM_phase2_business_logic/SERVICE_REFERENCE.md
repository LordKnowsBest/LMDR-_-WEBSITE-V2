# Phase 2 Service Reference

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    GCP Cloud Run                         │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ matching-    │  │ driver-      │  │ carrier-     │  │
│  │ engine       │  │ service      │  │ service      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ compliance-  │  │ notifications│  │ billing-     │  │
│  │ service      │  │ -service     │  │ service      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ ai-service   │  │ analytics-   │                    │
│  │              │  │ service      │                    │
│  └──────┬───────┘  └──────┬───────┘                    │
│         │                 │                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Cloud SQL (PostgreSQL 16)                 │  │
│  │         Instance: lmdr-postgres                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Shared: @lmdr/types, @lmdr/db, @lmdr/middleware        │
└─────────────────────────────────────────────────────────┘
```

## Service Inventory

| Service | Port | Cloud Run Name | Endpoints | Secrets |
|---------|------|---------------|-----------|---------|
| Matching Engine | 8080 | lmdr-matching-engine | /match/*, /search/* | PG_PASSWORD, API_KEY_PEPPER |
| Driver Service | 8080 | lmdr-driver-service | /drivers/* | PG_PASSWORD, API_KEY_PEPPER |
| Carrier Service | 8080 | lmdr-carrier-service | /carriers/*, /dispatch/* | PG_PASSWORD, API_KEY_PEPPER |
| Compliance Service | 8080 | lmdr-compliance-service | /compliance/*, /audit/* | PG_PASSWORD, MVR_API_KEY, BGCHECK_API_KEY |
| Notifications Service | 8080 | lmdr-notifications-service | /notify/*, /notifications/*, /pubsub/* | PG_PASSWORD, SENDGRID_API_KEY, TWILIO_* |
| Billing Service | 8080 | lmdr-billing-service | /billing/*, /webhooks/stripe | PG_PASSWORD, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET |
| AI Service | 8080 | lmdr-ai-service | /ai/* | PG_PASSWORD, OPENAI_*, CLAUDE_*, GROQ_*, GEMINI_*, DEEPSEEK_* |
| Analytics Service | 8080 | lmdr-analytics-service | /analytics/*, /auth/* | PG_PASSWORD |

## API Reference

### Matching Engine

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | /match/find-jobs | `{ driverProfile, limit? }` | `{ data: MatchResult[], meta }` |
| POST | /match/find-drivers | `{ jobSpec, limit? }` | `{ data: MatchResult[], meta }` |
| GET | /match/explain/:driverId/:carrierId | — | `{ data: MatchExplanation }` |
| GET | /search/jobs?lat=&lng=&radiusMiles=&cdlClass=&freightType= | — | `{ data: Job[], meta }` |
| GET | /search/drivers?cdlClass=&state=&freightType= | — | `{ data: Driver[], meta }` |

### Driver Service

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | /drivers | `{ memberId, cdlClass, ... }` | `{ data: DriverProfile }` |
| GET | /drivers/:id | — | `{ data: DriverProfile }` |
| PUT | /drivers/:id | `{ fields... }` | `{ data: DriverProfile }` |
| PUT | /drivers/:id/onboarding-step | — | `{ data: { step, name } }` |
| GET | /drivers/:id/onboarding-status | — | `{ data: OnboardingStatus }` |
| PUT | /drivers/:id/visibility | `{ visibilityLevel, isSearchable }` | `{ data: DriverProfile }` |
| GET | /drivers/:id/documents | — | `{ data: Document[] }` |
| POST | /drivers/:id/documents | `{ docType, fileName, ... }` | `{ data: Document }` |

### Carrier Service

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | /carriers | `{ dotNumber, companyName, ... }` | `{ data: Carrier }` |
| GET | /carriers/:id | — | `{ data: Carrier }` |
| PUT | /carriers/:id | `{ fields... }` | `{ data: Carrier }` |
| GET | /carriers/dot/:dotNumber | — | `{ data: Carrier }` |
| GET | /carriers/:id/jobs | — | `{ data: Job[] }` |
| POST | /carriers/:id/jobs | `{ title, state, ... }` | `{ data: Job }` |
| PUT | /carriers/:id/preferences | `{ prefs... }` | `{ data: Preferences }` |
| POST | /dispatch/assign | `{ driverId, jobId, assignedBy }` | `{ data: Assignment }` |
| GET | /dispatch/queue | — | `{ data: Job[] }` |

### Compliance Service

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | /compliance/mvr-check | `{ driverId }` | `{ data: { checkId } }` |
| POST | /compliance/background-check | `{ driverId }` | `{ data: { checkId } }` |
| GET | /compliance/status/:driverId | — | `{ data: ComplianceStatus }` |
| GET | /compliance/checks/:checkId | — | `{ data: CheckResult }` |
| POST | /audit/events | `{ actorId, action, ... }` | `{ data: AuditEvent }` |
| GET | /audit/events?actorId=&resourceType= | — | `{ data: AuditEvent[] }` |

### Notifications Service

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | /notify/email | `{ to, subject, body, templateId? }` | `{ data: { sent: true } }` |
| POST | /notify/sms | `{ to, body }` | `{ data: { sent: true } }` |
| POST | /notify/push | `{ token, title, body }` | `{ data: { sent: true } }` |
| GET | /notifications/:recipientId | — | `{ data: Notification[] }` |
| PUT | /notifications/:id/read | — | `{ data: Notification }` |

### Billing Service

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | /billing/invoices | `{ carrierId, lineItems, dueDate }` | `{ data: Invoice }` |
| GET | /billing/invoices/:id | — | `{ data: Invoice }` |
| GET | /billing/invoices?carrierId= | — | `{ data: Invoice[] }` |
| PUT | /billing/invoices/:id/status | `{ status }` | `{ data: Invoice }` |
| GET | /billing/rate-cards | — | `{ data: RateCard[] }` |
| POST | /billing/rate-cards | `{ name, rateType, rateAmount }` | `{ data: RateCard }` |
| GET | /billing/subscriptions/:carrierId | — | `{ data: Subscription }` |
| POST | /webhooks/stripe | (Stripe event) | `{ received: true }` |

### AI Service

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | /ai/recommend/jobs | `{ driverProfile, limit? }` | `{ data: Recommendation[] }` |
| POST | /ai/recommend/drivers | `{ jobDescription, limit? }` | `{ data: Recommendation[] }` |
| POST | /ai/rag/query | `{ question, context? }` | `{ data: { answer, sources } }` |
| POST | /ai/rag/index | `{ docId, content }` | `{ data: { indexed: true } }` |
| POST | /ai/vectors/embed | `{ text }` | `{ data: { embedding } }` |
| POST | /ai/vectors/search | `{ query, topK? }` | `{ data: Result[] }` |
| POST | /ai/agent/turn | `{ role, userId, message, context }` | `{ data: { response } }` |
| POST | /ai/router/complete | `{ task, messages, options? }` | `{ data: CompletionResult }` |
| GET | /ai/router/providers | — | `{ data: ProviderStatus[] }` |

### Analytics Service

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | /analytics/dashboard | — | `{ data: DashboardMetrics }` |
| GET | /analytics/feature-adoption | — | `{ data: FeatureMetrics[] }` |
| POST | /analytics/feature-adoption/log | `{ featureId, userId, action }` | `{ data: { logged: true } }` |
| POST | /analytics/reports/generate | `{ templateId, params? }` | `{ data: Report }` |
| GET | /analytics/reports/:id | — | `{ data: Report }` |
| GET | /auth/roles/:uid | — | `{ data: Role[] }` |
| POST | /auth/roles | `{ uid, role, grantedBy }` | `{ data: Role }` |

## Operations

### Deploy a Service

```bash
cd LMDR-_-WEBSITE-V2
gcloud builds submit \
  --config=services/<service-name>/cloudbuild.yaml \
  --substitutions=COMMIT_SHA=$(git rev-parse --short HEAD) \
  --project=ldmr-velocitymatch
```

### Check Service Health

```bash
bash scripts/check-services.sh
```

### Cutover a Service (Strangler Fig)

```bash
# Set to dual mode (run both Wix + GCP, compare results)
bash scripts/cutover.sh matching_engine dual

# After 72h validation, cut to GCP only
bash scripts/cutover.sh matching_engine gcp

# Emergency rollback to Wix
bash scripts/cutover.sh matching_engine wix

# Cutover all services at once
bash scripts/cutover-all.sh gcp
```

### Run Custom Table Migrations

```bash
# Ensure Cloud SQL Proxy is running first
bash scripts/run-phase2-sql.sh
```

### View Logs

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="lmdr-<service>"' \
  --project=ldmr-velocitymatch \
  --limit=50 \
  --format=json
```

## Shared Packages

| Package | Purpose | Exports |
|---------|---------|---------|
| @lmdr/types | TypeScript interfaces | DriverProfile, Job, Carrier, MatchResult, NotificationPayload, AuditEvent, ComplianceStatus, Invoice, ApiResponse, ApiError, QueryFilters, SortClause, QueryOptions |
| @lmdr/db | Database access | getPool, query, closePool, buildSelectQuery, buildCountQuery, buildInsertQuery, buildUpdateQuery, getTableName |
| @lmdr/middleware | Express middleware | authenticate, requireAdmin, rateLimiter, requestLogger, errorHandler |

## Custom SQL Tables

| Table | Service | Columns |
|-------|---------|---------|
| dispatch_assignments | carrier-service | _id, job_id, driver_id, carrier_id, assigned_by, assigned_at, status |
| compliance_checks | compliance-service | _id, driver_id, check_type, status, result, details, initiated_at, completed_at |
| audit_events | compliance-service | _id, actor_id, actor_role, action, resource_type, resource_id, before_state, after_state, ip_address, created_at |
| user_roles | analytics-service | uid, role, carrier_id, driver_id, granted_by, granted_at |
| notification_history | notifications-service | _id, recipient_id, channel, subject, body, status, sent_at, read_at |
| rate_cards | billing-service | _id, name, carrier_id, rate_type, rate_amount, effective_at, expires_at |
