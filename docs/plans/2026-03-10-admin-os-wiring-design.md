# Admin OS Backend Wiring — Design Document

> **Status:** APPROVED
> **Date:** 2026-03-10
> **Goal:** Replace 22 Wix `.jsw` admin services with 9 Cloud Run route files + Next.js server-side BFF, serving both the admin frontend and AI agent layer through unified REST endpoints.

---

## Architecture

```
┌─────────────────────┐     ┌──────────────────────┐
│  Next.js Admin      │     │  lmdr-ai-service     │
│  (Server Actions)   │     │  (Agent tool_use)    │
│  LMDR_INTERNAL_KEY  │     │  LMDR_INTERNAL_KEY   │
└────────┬────────────┘     └────────┬─────────────┘
         │                           │
         └───────────┬───────────────┘
                     ▼
         ┌───────────────────────┐
         │  lmdr-api (Cloud Run) │
         │  /v1/admin/*          │
         │  Auth → Rate Limit    │
         │  → Observability      │
         │  → Route Handler      │
         │  → Cloud SQL          │
         │  → BigQuery audit     │
         └───────────────────────┘
```

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth strategy | Server-side BFF (Option A) | `LMDR_INTERNAL_KEY` stays server-side, admin pages benefit from SSR, smaller security surface |
| Route structure | Directory with barrel (Approach 2) | Parallel subagent development, 1:1 mapping to .jsw services, clean separation |
| AI agent integration | `/v1/admin/manifest` endpoint | Auto-generates tool definitions from routes; eliminates 7 agent wrapper .jsw files |
| Wix dependency | ZERO | All business logic moves to Cloud Run; no .jsw files needed |

### What Gets Replaced

| Before (Wix) | After (Cloud Run) |
|--------------|-------------------|
| 15 admin `.jsw` services (~6,400 LOC) | 9 route files (~1,500 LOC) |
| 7 agent wrapper `.jsw` services (~1,800 LOC) | 1 manifest endpoint (auto-generated) |
| `dataAccess.jsw` → `cloudRunClient.jsw` → Cloud Run CRUD | Direct SQL queries in route handlers |
| postMessage bridges | Next.js server actions |

---

## Route Structure

```
cloud-run-api/src/routes/admin/
├── index.js          ← barrel: mounts all sub-routers + /manifest endpoint
├── dashboard.js      ← 3 endpoints
├── drivers.js        ← 9 endpoints
├── carriers.js       ← 3 endpoints
├── matches.js        ← 5 endpoints
├── config.js         ← 6 endpoints
├── observability.js  ← 8 endpoints
├── ai-router.js      ← 6 endpoints
├── audit.js          ← 5 endpoints
└── billing.js        ← 12 endpoints
```

Mounted in `app.js` before the catch-all collection router:

```javascript
import adminRouter from './routes/admin/index.js';
protectedRouter.use('/admin', adminRouter);  // before collectionRouter
```

---

## Endpoint Map (57 endpoints)

### dashboard.js

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| GET | `/dashboard/overview` | `getDashboardOverview()` | 7-stat aggregate |
| GET | `/dashboard/quick-stats` | `getQuickStats()` | 4-stat snapshot |
| GET | `/dashboard/ai-usage` | `getAIUsageStats(period)` | AI costs & tokens |

### drivers.js

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| POST | `/drivers/query` | `getDriversList(options)` | Paginated + filters |
| GET | `/drivers/stats` | `getDriverStats()` | 5 counts |
| GET | `/drivers/analytics` | `getDriverAnalytics(period)` | Registration breakdown |
| GET | `/drivers/export` | `exportDriversCSV()` | CSV download |
| GET | `/drivers/:id` | `getDriverDetail(driverId)` | Full profile + apps + history |
| PUT | `/drivers/:id/status` | `updateDriverStatus()` | Status transition |
| POST | `/drivers/:id/verify` | `verifyDriver()` | Set verified + active |
| POST | `/drivers/:id/suspend` | `suspendDriver()` | Suspension |
| POST | `/drivers/bulk` | `bulkUpdateDrivers()` | Batch operations |

### carriers.js

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| POST | `/carriers/query` | `getCarriersList()` | Paginated + enrichment |
| GET | `/carriers/stats` | `getCarrierStats()` | Counts + coverage |
| GET | `/carriers/:id` | `getCarrierDetail()` | Full carrier + safety + matches |

### matches.js

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| POST | `/matches/query` | `getMatchesList()` | Paginated + filters |
| POST | `/matches/interests` | `getInterestsList()` | Applications list |
| GET | `/matches/stats` | `getMatchStats()` | Weekly/total, conversion |
| GET | `/matches/export` | `exportMatchesCSV()` | CSV download |
| GET | `/matches/:id` | `getMatchDetail()` | Full match detail |

### config.js

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| GET | `/config/matching-weights` | `get{Carrier,Driver}MatchingWeights()` | Both weight sets |
| PUT | `/config/matching-weights` | `update{Carrier,Driver}MatchingWeights()` | Save weights |
| GET | `/config/system` | `getSystemSettings()` | Cache, batch, rate limits |
| PUT | `/config/system` | `updateSystemSettings()` | Update system config |
| GET | `/config/tiers` | `getTierLimits()` | Feature limits by plan |
| PUT | `/config/tiers` | `updateTierLimits()` | Update tier config |

### observability.js

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| POST | `/observability/logs` | `getSystemLogs()` | Query with filters |
| GET | `/observability/anomalies` | `getActiveAnomalies()` | Active alerts |
| POST | `/observability/anomalies/:id/ack` | `acknowledgeAnomaly()` | Acknowledge |
| POST | `/observability/anomalies/:id/resolve` | `resolveAnomaly()` | Resolve |
| GET | `/observability/rules` | `getAnomalyRules()` | Rule definitions |
| POST | `/observability/rules` | `createAnomalyRule()` | Create rule |
| PUT | `/observability/rules/:id` | `updateAnomalyRule()` | Update rule |
| DELETE | `/observability/rules/:id` | `deleteAnomalyRule()` | Delete rule |

### ai-router.js

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| GET | `/ai-router/config` | `getRouterConfig()` | Provider routing |
| PUT | `/ai-router/config` | `updateRouterConfig()` | Save routing |
| POST | `/ai-router/test` | `testProvider()` | Test single provider |
| GET | `/ai-router/costs` | `getProviderCostMetrics()` | Cost & latency |
| GET | `/ai-router/optimizer` | `getCostOptimizerConfig()` | Optimizer config |
| PUT | `/ai-router/optimizer` | `updateCostOptimizerConfig()` | Save optimizer |

### audit.js

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| POST | `/audit/query` | `getAuditLog()` | Paginated audit log |
| GET | `/audit/stats` | `getAuditStats()` | Counts, top admins/actions |
| GET | `/audit/export` | `exportAuditLogCSV()` | CSV download |
| POST | `/audit/reports/generate` | `generateComplianceReport()` | Run report |
| GET | `/audit/:id` | `getAuditEntryDetail()` | Full entry + related |

### billing.js

| Method | Path | Replaces (.jsw) | Purpose |
|--------|------|-----------------|---------|
| GET | `/billing/revenue/snapshot` | `getRevenueSnapshot()` | MRR, ARR, ARPU, LTV |
| GET | `/billing/revenue/trend` | `getMonthlyTrend()` | MRR over time |
| GET | `/billing/revenue/churn` | `getChurnAnalysis()` | Churn by tier |
| GET | `/billing/revenue/forecast` | `getRevenueForecast(months)` | Linear forecast |
| GET | `/billing/customer/:dot` | `getBillingDetails()` | Carrier billing |
| POST | `/billing/adjustments` | `createAdjustment()` | Credit/debit |
| POST | `/billing/invoices` | `createInvoice()` | Draft invoice |
| GET | `/billing/invoices/:id` | `getInvoice()` | Fetch invoice |
| PUT | `/billing/invoices/:id` | `updateInvoice()` | Edit draft |
| POST | `/billing/invoices/:id/send` | `sendInvoice()` | Send invoice |
| GET | `/billing/commissions` | `getCommissionRules()` | Rules + reps |
| POST | `/billing/commissions/calculate` | `calculateCommissions()` | Generate from subs |

### index.js (barrel + manifest)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/manifest` | Returns all 57 endpoints as AI tool definitions |

---

## Next.js Integration (Server-Side BFF)

### API Client

`frontend/src/lib/admin-api.ts` — server-only client using `LMDR_INTERNAL_KEY`:

```typescript
async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${CLOUD_RUN_URL}/v1/admin${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${INTERNAL_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new AdminApiError(res.status, await res.json());
  return res.json();
}
```

### Server Actions

```
frontend/src/app/(admin)/actions/
├── dashboard.ts    ← getDashboardData(), getAiUsage()
├── drivers.ts      ← listDrivers(), getDriver(), verifyDriver(), etc.
├── carriers.ts     ← listCarriers(), getCarrier()
├── matches.ts      ← listMatches(), getMatchStats()
├── config.ts       ← getWeights(), updateWeights(), etc.
├── observability.ts ← getLogs(), getAnomalies(), ackAnomaly()
├── ai-router.ts    ← getRouterConfig(), testProvider()
├── audit.ts        ← getAuditLog(), getAuditStats()
└── billing.ts      ← getRevenue(), createInvoice(), etc.
```

All files are `'use server'`. Browser calls server action, Next.js calls Cloud Run, returns result.

---

## AI Agent Manifest

`GET /v1/admin/manifest` returns tool definitions:

```json
{
  "tools": [
    {
      "name": "admin_list_drivers",
      "description": "List drivers with filters (status, verification, search)",
      "input_schema": {
        "type": "object",
        "properties": {
          "status": { "type": "string", "enum": ["active", "pending", "suspended"] },
          "search": { "type": "string" },
          "limit": { "type": "number", "default": 50 }
        }
      },
      "endpoint": { "method": "POST", "path": "/v1/admin/drivers/query" }
    }
  ]
}
```

`lmdr-ai-service` fetches manifest at startup, registers tools, executes them as HTTP calls. No wrapper services needed.

---

## Error Handling

Consistent error format across all routes:

```json
{
  "error": "DRIVER_NOT_FOUND",
  "message": "No driver with id drv_abc123",
  "status": 404
}
```

## Audit Trail

Every mutation logs to BigQuery `audit_log` via `insertAuditEvent()`:

```javascript
{
  actor_id: req.auth.uid,
  action: 'ADMIN_VERIFY_DRIVER',
  resource_type: 'driver',
  resource_id: driverId,
  before_state: { status: 'pending' },
  after_state: { status: 'active', verified: true }
}
```

## Caching

- Dashboard/stats: 5-minute in-memory cache
- Config endpoints: 5-minute cache, busted on mutation
- Lists/queries: no cache (real-time)

---

## Collections Accessed (34 Cloud SQL tables)

| Collection | Routes | Operations |
|-----------|--------|------------|
| `driverProfiles` | drivers, matches, content | Q, U, R |
| `carriers` | carriers, billing, invoices | Q, R |
| `matchEvents` | matches, carriers, dashboard | Q |
| `driverCarrierInterests` | matches, drivers, carriers | Q |
| `carrierEnrichments` | carriers, drivers, dashboard | Q |
| `carrierSafetyData` | carriers | Q |
| `auditLog` | audit, all mutations | I, Q, R |
| `systemLogs` | observability, jobs | I, Q |
| `systemErrors` | observability | I, Q |
| `systemTraces` | observability | I, U, Q |
| `systemMetrics` | observability | I, Q |
| `systemAlerts` | dashboard, observability | Q, U |
| `aiUsageLog` | dashboard, ai-router | I, Q |
| `aiRouterConfig` | ai-router | Q, U |
| `aiProviderCosts` | ai-router | Q, U |
| `costOptimizerConfig` | ai-router | Q, U |
| `anomalyAlerts` | observability | I, Q, U |
| `anomalyRules` | observability | I, Q, U, D |
| `baselineMetrics` | observability | I, Q, U |
| `featureAdoptionLogs` | features | I, Q |
| `featureRegistry` | features | I, Q, U |
| `platformSettings` | config | Q, U |
| `carrierSubscriptions` | billing | Q |
| `billingHistory` | billing | I, Q |
| `billingAdjustments` | billing | I |
| `revenueMetrics` | billing | I, Q |
| `invoices` | billing | I, Q, U |
| `commissionRules` | billing | Q, U, I |
| `salesReps` | billing | Q, U, I |
| `commissions` | billing | I, Q, U |
| `carrierReviews` | content | Q, U |
| `jobPostings` | content | Q, U |
| `adminUsers` | content | Q |

---

## Testing Strategy

One test file per route in `cloud-run-api/tests/routes/admin/`:

- Mock auth (`req.auth = { uid: 'test', role: 'admin' }`)
- Mount only route under test
- Happy path + error cases + auth rejection
- Supertest for HTTP assertions
- Integration smoke: hit `/v1/admin/dashboard/quick-stats` + `/v1/admin/manifest` post-deploy

---

## GCP Platform Usage

| Service | Usage | Startup Credits Impact |
|---------|-------|----------------------|
| Cloud Run | Admin routes on `lmdr-api` | Compute hours |
| Cloud SQL | 34 collections queried | Storage + connections |
| BigQuery | Audit events, observability | Streaming inserts + storage |
| Secret Manager | `LMDR_INTERNAL_KEY`, Stripe key | API calls |
| Cloud Monitoring | Alert policies cover new routes | Metric ingestion |
| Cloud Trace | Auto-traced via OTel sidecar | Trace storage |
| Vertex AI | Agent calls admin tools via Gemini | Prediction API calls |
| Firebase Auth | Token validation | Auth API calls |

### Future ML Pipeline (BigQuery audit data)

Audit events become training data for:
- **Anomaly detection** — Vertex AI AutoML on admin behavior patterns
- **Churn prediction** — billing + carrier interaction → predict cancellation
- **Recruiter scoring** — admin actions correlated to placements
- **AI router optimization** — cost/latency/quality → ML-based provider selection
- **Fraud detection** — verification, document, commission patterns

Pipeline: `BigQuery audit_log → Vertex AI Dataset → AutoML → Prediction endpoint`
