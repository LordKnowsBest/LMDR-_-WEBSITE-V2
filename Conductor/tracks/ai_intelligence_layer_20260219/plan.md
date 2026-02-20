# Plan — AI Intelligence Layer
## Semantic Search · External Trace Enrichment · Agent Streaming · B2B Multi-Agent

**Created:** 2026-02-19
**Updated:** 2026-02-19 (gap-closure revision)
**Status:** PLANNED — not started
**Priority order:** Phase 1 → Phase 2 → Phase 3 → Phase 4
**API contracts:** see `spec.md` in this directory

---

## Why This Track Exists

The existing agent infrastructure (`agentService.jsw`, `aiRouterService.jsw`, `agentConversationService.jsw`) covers the core loop well. Four capability gaps remain:

1. **No semantic search** — driver/carrier matching is purely filter-based. Semantic similarity (embeddings + vector store) would meaningfully improve match quality.
2. **Observability exists internally but lacks external trace enrichment** — `observabilityService.jsw` already emits structured logs (lines 279, 371) and `b2bResearchAgentService.jsw` already calls it (line 64). What's missing is LangSmith-style cross-turn reasoning traces, per-tool latency analytics, and token cost attribution — none of which `observabilityService.jsw` captures. Phase 2 is enrichment and dashboard unification, not net-new observability from zero.
3. **No streaming** — agent responses are fully buffered before delivery, adding perceived latency.
4. **Sequential B2B research** — `b2bResearchAgentService.jsw` runs FMCSA → social → news lookups in series. Parallel sub-agents would cut latency by ~3×.

### Architecture Constraint

> Wix Velo is **not** a Node.js runtime. LangChain, LlamaIndex, CrewAI, and similar frameworks depend on Node.js internals and **cannot run inside `.jsw` files**.

All framework code lives in an **external microservice** (recommended: Railway or Render, deployed from this repo as a separate service). Velo calls it via `fetch()` from backend `.jsw` files. Velo remains the orchestration and auth layer — the microservice is stateless.

```
Velo (.jsw) ──fetch()──► AI Microservice (Node.js/Python)
                              ├── LlamaIndex + Pinecone (Phase 1)
                              ├── LangSmith SDK (Phase 2)
                              ├── SSE stream endpoint (Phase 3)
                              └── CrewAI supervisor (Phase 4)
```

Full endpoint contracts, request/response schemas, error codes, and timeout budgets are in `spec.md`.

---

## Phase 1 — Semantic Search Microservice ✦ HIGH VALUE

**Goal:** Add semantic similarity as a 7th ranking signal in `driverScoring.js` alongside the existing 6-dimension filter score.

### What Gets Built

**Microservice endpoints** — see `spec.md §1` for full schemas:
- `POST /embed/driver` — generate + upsert driver profile embedding
- `POST /embed/carrier` — generate + upsert carrier profile embedding
- `POST /search/drivers` — semantic query, returns ranked IDs + scores
- `POST /search/carriers` — semantic query against carrier index
- `GET /health` — liveness + readiness

**Wix backend changes:**
- `src/backend/semanticSearchService.jsw` — thin wrapper with circuit breaker and timeout
- `src/backend/driverMatching.jsw` — blend semantic score as 7th dimension (feature-flagged)
- `src/backend/configData.js` — add `semanticSearchEnabled` flag

### Vector Schema

**Driver index** (`lmdr-drivers`, index version in metadata for migration):
```
id:     driverId (Airtable record ID)
vector: float[1536]  (text-embedding-3-small)
metadata: {
  cdl_class, endorsements[], home_state,
  experience_years, haul_types[], pay_min,
  is_discoverable, last_active, index_version
}
```

**Carrier index** (`lmdr-carriers`):
```
id:     carrierId
vector: float[1536]
metadata: {
  dot_number, haul_types[], home_states[],
  pay_range_min, pay_range_max, fleet_size, index_version
}
```

### Semantic Score Integration

```javascript
// driverScoring.js — 7th dimension, feature-flagged
if (semanticScore !== null) {
  return (deterministicScore * 0.85) + (semanticScore * 0.15);
}
return deterministicScore; // fallback — unchanged behavior
```

### Failure & Fallback Policy

| Condition | Behavior |
|-----------|----------|
| Microservice responds > 400ms | Skip semantic score; use deterministic score only; log warning |
| Microservice returns 5xx | Circuit opens after 3 consecutive failures; stays open 60s; log error |
| Circuit open | All searches use deterministic filter-only ranking until circuit closes |
| Pinecone ID missing (not yet embedded) | Return `semanticScore: null`; deterministic fallback |
| Stale embedding (profile updated > 24h ago, not re-embedded) | Use stale vector with `stale: true` metadata flag; surface in observability |

Circuit breaker state is in-memory per Velo instance (no shared state across instances). This is acceptable — each instance independently recovers.

### Embedding Ingestion & Backfill

**Trigger (real-time):**
- Driver profile created/updated → `semanticSearchService.embedDriver(driverId)` called fire-and-forget in the same request context (non-blocking)
- Carrier preferences updated → `semanticSearchService.embedCarrier(carrierId)` fire-and-forget

**Idempotency:** `POST /embed/driver` is idempotent — re-embedding the same `driverId` overwrites the existing vector. Embed requests include a `profileUpdatedAt` ISO timestamp; the microservice rejects (returns `304 Not Modified`) if the stored `last_embedded_at` is newer.

**Backfill job** (one-time + periodic resync):
- New Wix scheduled job `backfillEmbeddings` runs nightly at 03:00 UTC
- Fetches all driver/carrier records where `last_embedded_at` is null or `> 48h` behind `last_updated`
- Processes in chunks of 10 with 200ms delay between chunks (Pinecone rate limit)
- Dead-letter: failed embed IDs written to `v2_Embedding Errors` Airtable table (fields: `record_id`, `type`, `error`, `attempts`, `last_attempted_at`)
- Retry: dead-letter records retried up to 3× on next backfill run; after 3 failures, record marked `status: 'manual_review'`
- Poison-message handling: if a profile causes repeated crashes (malformed data), it's skipped and flagged; never blocks the batch

**Index migration procedure** (when vector schema changes):
1. Bump `index_version` in metadata
2. Create new Pinecone index (`lmdr-drivers-v2`)
3. Run backfill against new index
4. Cut over `semanticSearchService` to query new index
5. Delete old index after 72-hour bake period

### A/B Experiment Spec

| Parameter | Value |
|-----------|-------|
| Assignment unit | `driverId` (user-level, sticky across sessions) |
| Bucketing | Deterministic hash of `driverId % 100` — buckets 0–49 = control, 50–99 = treatment |
| Stickiness | Assignment baked into `driverProfiles.ab_semantic_bucket` field on first search |
| Min sample size | 200 driver searches per arm before reading results (power = 0.8, α = 0.05) |
| Primary metric | Hire conversion rate (driver applied → hired within 30 days) |
| Guardrail metrics | P95 search latency must stay ≤ 600ms; semantic error rate ≤ 2% |
| Stop conditions | Either guardrail breached → auto-revert to control; treatment shows >20% conversion lift at significance → ship |
| Rollback threshold | If semantic error rate exceeds 5% in any 1h window → circuit force-open, all traffic to control |

---

## Phase 2 — LangSmith External Trace Enrichment ✦ HIGH VALUE

**Goal:** Augment existing `observabilityService.jsw` internal logging with external LangSmith traces covering cross-turn reasoning chains, per-tool latency, and token cost attribution — capabilities the internal system does not capture.

### What Already Exists (do not replace)
- `observabilityService.jsw:279` — `startTrace()` for operation timing
- `observabilityService.jsw:371` — `logDatabase()` for data access timing
- `b2bResearchAgentService.jsw:64` — calls `log()` on each research step
- `agentTurns` Airtable collection — raw turn storage

### What's Missing (what Phase 2 adds)
- Cross-turn conversation-level reasoning traces
- Per-tool latency breakdown within a single turn
- Input/output token count and estimated cost per turn
- Side-by-side prompt variant comparison
- Failure pattern analysis across all roles at volume

### What Gets Built

**Microservice addition:**
- `routes/trace.js` — accepts POST from Velo, forwards enriched span to LangSmith SDK
- LangSmith project per role: `lmdr-driver`, `lmdr-recruiter`, `lmdr-admin`, `lmdr-carrier`

**Wix backend changes:**
- `src/backend/agentService.jsw` — after each `handleAgentTurn()` completes, POST trace envelope to microservice (non-blocking, fire-and-forget, max 500ms budget)
- Trace envelope (see `spec.md §2` for full schema): `{ role, userId, conversationId, turnId, toolsUsed[], latencyMs, modelId, inputTokens, outputTokens, error? }`

**What stays in observabilityService.jsw:** All existing calls remain. LangSmith is additive — it receives a subset of the same data, enriched with agent-specific fields the internal system doesn't model.

### Airtable Impact
None — `agentTurns` collection unchanged. LangSmith is the analysis layer.

---

## Phase 3 — Streaming Agent Responses ◈ LOW PRIORITY

**Goal:** Stream agent token output to HTML components rather than buffering the full response.

### Current Flow (buffered)
```
HTML → postMessage → page code → agentService → Claude API → full response → postMessage → HTML
```

### Target Flow (streamed)
```
HTML → postMessage → page code → agentService → Claude API stream
                                                    ↓ chunk by chunk
                                         postMessage({ action:'agentChunk', token, done })
                                                    ↓
                                         HTML appends token to bubble
```

### Transport Decision Gate

Before building, run a Velo streaming feasibility test (spike, 1 day max):

| Test | Pass Criteria | Outcome |
|------|--------------|---------|
| `fetch()` with `ReadableStream` in a `.jsw` file | Stream chunks arrive without buffering | **Branch A: Native Velo streaming** |
| Same test fails or buffers entire response | — | **Branch B: Microservice SSE proxy** |

**Branch A (native):** `agentService.jsw` calls Claude API with `stream: true`, iterates the response stream, calls `onChunk(token)` callback, page code forwards via `postMessage`.

**Branch B (SSE proxy):** Velo calls `POST /stream/agent` on microservice with full turn context → microservice streams Claude response → Velo polls or uses long-poll → forwards chunks via postMessage. This adds ~50-100ms overhead vs native.

Both branches produce identical page code and HTML module contracts — only the `agentService.jsw` internals differ.

### What Gets Built (both branches)

**Wix backend:**
- `src/backend/agentService.jsw` — `handleAgentTurnStream(role, userId, message, context, onChunk)` variant
- `src/pages/*.js` — forward chunks: `component.postMessage({ action: 'agentChunk', payload: { token, done } })`

**HTML modules:**
- Each surface bridge module — handle `agentChunk` action, append token to active bubble, show/hide typing cursor on `done: true`

---

## Phase 4 — B2B Parallel Research Agents ◈ MAYBE

**Goal:** Replace the sequential `b2bResearchAgentService.jsw` with a supervisor + parallel sub-agent pattern, cutting full company research latency from ~45s to ~15s.

### Current Architecture (sequential)
```
b2bResearchAgentService.jsw:
  1. FMCSA lookup (5-8s)
  2. Social scrape (8-12s)
  3. News scan (5-8s)
  4. LinkedIn signals (8-15s)
  Total: ~30-45s
```

### Target Architecture (parallel via microservice)
```
Microservice supervisor agent:
  ├── FMCSA agent      ─┐
  ├── Social agent     ─┤─► synthesizer → structured report
  ├── News agent       ─┤
  └── LinkedIn agent   ─┘
  Total: ~10-15s (bottleneck = slowest sub-agent)
```

**Wix backend changes:**
- `src/backend/b2bResearchAgentService.jsw` — replace sequential calls with single `fetch()` to `/research/company`
- Response shape stays identical — no frontend changes needed

### Dependency Clarification

Phase 4 depends on the **shared microservice platform** (the `services/ai-intelligence/` service being deployed), not specifically on Phase 1's semantic search features. If the microservice is deployed for any earlier phase, Phase 4 can be built independently without waiting for Pinecone or LangSmith to be wired.

### Decision Gate
Build Phase 4 only if **all three**:
- Shared microservice platform is deployed (any prior phase)
- B2B company lookups exceed 50/month (product signal)
- Research latency is a user-reported pain point (qualitative signal)

---

## Security Controls

| Layer | Control |
|-------|---------|
| Transport | TLS 1.3 mandatory on all microservice endpoints |
| Auth | `x-lmdr-internal-key` header (256-bit random, stored in Wix Secrets Manager + Railway env). Requests missing or with invalid key → 401, no body |
| Request signing | Each Velo request includes `x-lmdr-timestamp` (Unix ms). Microservice rejects requests where `|now - timestamp| > 30s` (replay protection) |
| IP allowlist | Microservice restricts inbound to Wix's egress IP ranges (documented in Railway allowlist config) — defence-in-depth alongside key auth |
| Rate limiting | Microservice enforces 60 req/min per calling IP; burst of 10. Returns 429 with `Retry-After` header |
| Key rotation | Internal key rotated every 90 days via Railway env var update + Wix Secrets Manager update; zero-downtime (old key accepted for 1h overlap window during rotation) |
| PII redaction | Trace payloads sent to LangSmith strip `userId` (replaced with `userHash = sha256(userId + salt)`). Driver names, emails, phone numbers must not appear in trace `input`/`output` fields — enforced by a redaction pass in `routes/trace.js` before forwarding |
| Pinecone metadata | No PII stored in vector metadata — only opaque IDs and non-identifying profile attributes |

---

## Testing Strategy

### Phase 1 — Semantic Search

| Suite | Coverage | Pass Gate |
|-------|----------|-----------|
| Unit: `semanticSearchService.jsw` | Circuit breaker state transitions, fallback behavior, timeout enforcement | All branches covered |
| Unit: `driverScoring.js` | 7th-dimension blend, null semanticScore fallback, flag-off behavior | Existing 6-dimension tests must not regress |
| Integration: embedding pipeline | Driver profile update → embed → Pinecone upsert confirmed | End-to-end on staging index |
| Integration: search | Query → ranked results → score blend applied correctly | Deterministic test fixture with known vectors |
| Load: search endpoint | 50 concurrent search requests, P95 ≤ 400ms | Run via k6 against staging microservice |
| Chaos: microservice down | All searches return deterministic results within 600ms | Circuit opens, no errors surfaced to user |
| Regression: `driverMatching.jsw` | Existing filter-only tests pass with `semanticSearchEnabled: false` | Zero regressions |

### Phase 2 — LangSmith Tracing

| Suite | Coverage | Pass Gate |
|-------|----------|-----------|
| Unit: trace envelope builder | All fields present, PII redaction applied, timestamp included | No PII in output |
| Integration: LangSmith ingest | Turn trace appears in LangSmith project within 5s | Confirmed via LangSmith API |
| Contract: `agentService.jsw` | Trace POST is non-blocking — `handleAgentTurn()` latency unchanged ±5% | Benchmark before/after |
| Regression: `agentService.jsw:2219` | Full agent turn execution unaffected | Existing agent tests green |

### Phase 3 — Streaming

| Suite | Coverage | Pass Gate |
|-------|----------|-----------|
| Spike: Velo `ReadableStream` | Confirm branch (A or B) | Decision documented, branch chosen |
| Unit: chunk handler (HTML) | Tokens appended in order, cursor shown/hidden, `done` flag handled | Visual regression test |
| Integration: full turn stream | First token arrives ≤ 800ms from request | Measured on staging |

### Phase 4 — B2B Multi-Agent

| Suite | Coverage | Pass Gate |
|-------|----------|-----------|
| Unit: supervisor agent | All 4 sub-agents called in parallel, synthesizer receives all results | Mock sub-agents, verify parallelism |
| Contract: response shape | `b2bResearchAgentService.jsw` output schema unchanged | No frontend changes needed |
| Load: parallel sub-agents | 10 concurrent company lookups, P95 ≤ 20s | k6 on staging microservice |
| Regression: `b2bResearchAgentService.jsw` | Existing sequential tests pass against mock microservice | Zero regressions |

---

## Operational Ownership & SLOs

### Service-Level Objectives

| SLO | Target | Measurement |
|-----|--------|-------------|
| Microservice availability | ≥ 99.5% uptime | Railway uptime monitor |
| Search endpoint P95 latency | ≤ 400ms | Railway metrics |
| Embedding endpoint P95 latency | ≤ 1000ms | Railway metrics |
| Semantic search error rate | ≤ 1% of requests | Error log |
| Circuit breaker open duration | ≤ 60s per incident | Alert if > 5min cumulative/day |

### Alert Thresholds

| Alert | Threshold | Channel |
|-------|-----------|---------|
| Microservice 5xx rate | > 1% over 5min | Slack #ops-alerts |
| Circuit breaker open | Any open event | Slack #ops-alerts |
| Embedding dead-letter queue | > 10 records in `v2_Embedding Errors` | Slack #ops-alerts |
| LangSmith ingest failures | > 5% of traces dropped | Slack #ops-alerts |
| P95 search latency | > 600ms over 5min | Slack #ops-alerts |

### Incident Runbooks

**Microservice down / Railway restart:**
1. Velo circuit breakers open automatically — all searches fall back to deterministic scoring
2. Check Railway deploy logs for OOM or crash
3. Redeploy from `main` branch if no code change caused it
4. Verify `/health` returns 200 before closing incident
5. Circuit breakers auto-close after 60s of healthy responses

**Pinecone index degraded:**
1. Semantic search returns errors → circuit opens → deterministic fallback active
2. Check Pinecone status page
3. If persistent: switch `semanticSearchEnabled` to `false` in configData.js + deploy
4. Re-enable after Pinecone confirms recovery

**Embedding backlog growing (dead-letter > 10):**
1. Query `v2_Embedding Errors` for error pattern
2. If systemic (e.g., schema change): run index migration procedure (see Phase 1)
3. If transient: re-trigger backfill job manually from admin panel
4. Clear dead-letter records with `status: 'resolved'` after fix confirmed

**On-call owner:** Assigned per sprint in the team's on-call rotation. Microservice alerts go to the same rotation as Airtable/Wix backend alerts.

---

## Microservice Structure

```
services/ai-intelligence/
├── package.json              (Node.js 20, LlamaIndex, LangSmith, Hono)
├── server.js                 (Hono — request signing + rate limit middleware)
├── routes/
│   ├── embed.js              (Phase 1 — driver/carrier embedding)
│   ├── search.js             (Phase 1 — semantic queries)
│   ├── trace.js              (Phase 2 — LangSmith ingest + PII redaction)
│   ├── stream.js             (Phase 3 — SSE proxy if Branch B)
│   └── research.js           (Phase 4 — parallel B2B agents)
├── lib/
│   ├── auth.js               (request signing, key validation, timestamp check)
│   ├── rateLimit.js          (per-IP rate limiting)
│   ├── circuitBreaker.js     (shared circuit state — not used by microservice itself, but exported for Velo mock tests)
│   ├── pinecone.js           (vector store client)
│   ├── embeddings.js         (OpenAI text-embedding-3-small)
│   ├── langsmith.js          (tracing client + PII redaction)
│   └── crewai.js             (Phase 4 only)
├── __tests__/                (unit + integration tests, run in CI)
└── railway.toml              (Railway deployment config)
```

---

## Implementation Order

| Phase | When to Start | Blocker |
|-------|--------------|---------|
| 1 — Semantic Search | Next sprint | None — greenfield |
| 2 — LangSmith | Alongside Phase 1 | Phase 1 microservice scaffold exists |
| 3 — Streaming | After Phase 1 stable | Velo ReadableStream spike completed |
| 4 — B2B Multi-Agent | After microservice deployed (any phase) + B2B usage confirmed | Shared microservice platform only |
