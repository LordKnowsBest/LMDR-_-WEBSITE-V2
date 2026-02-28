# Progress - AI Intelligence Layer

## Status: **ALL PHASES COMPLETE** — Railway deployed, Wix wired

| Phase | Name | Priority | Status |
|-------|------|----------|--------|
| 1 | Claude Runtime Foundation + Contracts | YES | **COMPLETE** |
| 2 | Semantic Search as Agent Tools | YES | **COMPLETE** |
| 3 | Streaming Agent Responses | LOW | **COMPLETE** |
| 4 | B2B Parallel Research via Runtime Fan-Out | MAYBE | **COMPLETE** |

## Live Endpoints

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /v1/agent/turn` | **LIVE** | Claude Sonnet 4.6 runtime, 28s hard stop |
| `GET  /health` | **LIVE** | Auth-exempt; all 4 checks passing |
| `POST /v1/embed/driver` | **LIVE** | Voyage AI voyage-3, Pinecone lmdr-drivers |
| `POST /v1/embed/carrier` | **LIVE** | Voyage AI voyage-3, Pinecone lmdr-carriers |
| `POST /v1/search/drivers` | **LIVE** | ANN, 400ms budget, top-k 50 default |
| `POST /v1/search/carriers` | **LIVE** | ANN, 400ms budget, top-k 20 default |
| `POST /v1/stream/agent-turn` | **LIVE** | Creates session, async streamStep |
| `GET  /v1/stream/events/:token` | **LIVE** | SSE, auth-exempt, 50ms poll, 90s TTL |
| `POST /v1/research/company` | **LIVE** | 4-section fan-out, < 20s, partial results |

## Feature Flags (configData.js)

| Flag | Value | Effect |
|------|-------|--------|
| `runtimeEnabled` | `true` | Phase 1 runtime active |
| `semanticToolEnabled` | `true` | Embedding + search active |
| `semanticSearchBlendEnabled` | `true` | Flipped to true following backfill |

## Log

### 2026-02-20 — Phases 2, 3, 4 Implemented

**Phase 2 — Semantic Search:**
- `lib/embeddings.js` — Voyage AI voyage-3 embed, `buildDriverText()`, `buildCarrierText()`
- `lib/pinecone.js` — Pinecone REST client (no SDK); hosts hardcoded for both indexes
- `routes/semantic.js` — Full `/embed/driver`, `/embed/carrier`, `/search/drivers`, `/search/carriers`
- `routes/health.js` — Added Pinecone + Voyage health checks
- `src/backend/semanticSearchService.jsw` — Velo wrapper with circuit breaker (3/60s)
- `src/backend/driverScoring.js` — `blendSemanticScore()`, 15% semantic / 85% deterministic
- `src/backend/driverMatching.jsw` — Semantic pre-fetch block + per-driver blend
- `src/backend/semanticBackfillJob.jsw` — Nightly batch embed (03:30 UTC), chunk 10 / 300ms gap
- `src/backend/jobs.config` — Added nightly backfill job

**Phase 3 — Streaming:**
- `lib/streamSessions.js` — In-memory session store, 90s TTL, 48-char hex token
- `routes/stream.js` — `POST /agent-turn` (creates session, fires async streamStep) + `GET /events/:token` (SSE, 50ms poll, 5s heartbeat)
- `lib/auth.js` — Path exception for `/stream/events/` (browser EventSource can't send headers; token = credential)
- `src/backend/agentRuntimeService.jsw` — Added `createStreamSession()` + shared `_authHeaders()` helper
- `src/public/js/agent-stream-client.js` — CDN browser module (`AgentStreamClient.connect()`)

**Phase 4 — B2B Parallel Research:**
- `lib/researchers/fmcsaResearcher.js` — FMCSA mobile API; gracefully degrades if `FMCSA_WEB_KEY` absent
- `lib/researchers/claudeResearcher.js` — Claude Haiku sub-agent for social/news/linkedin; JSON-schema prompts
- `routes/research.js` — `POST /company` — `Promise.all` across 4 sections, 15s per-section timeout, 10s synthesis; `partial: true` on any failure
- `src/backend/b2bResearchAgentService.jsw` — Added `runParallelResearch(dotNumber, companyName, sections)` Velo wrapper

**Smoke tests passing (2026-02-20):**
- Phase 3: "Hi there , friend !" streamed token-by-token + `done` event received
- Phase 4: Werner Enterprises 2-section research returned in 4.8s with Claude synthesis

### 2026-02-20 — Plan Rewritten (Claude Agent SDK Direction)
- Plan rewritten to Claude Agent SDK-first architecture with provider adapter interface.

### 2026-02-19 — Phase 1 Implemented

**Microservice (`services/ai-intelligence/`):**
- `server.js` — Hono app, auth + rate-limit middleware, all routes wired
- `runtime/providerInterface.js` — `ProviderAdapter` abstract base class
- `runtime/claudeAdapter.js` — full implementation using `@anthropic-ai/sdk`
- `routes/agent.js` — `POST /v1/agent/turn` with 28s internal timeout
- `routes/health.js` — `GET /health` auth-exempt liveness probe
- `lib/auth.js` — `x-lmdr-internal-key` + timestamp replay guard
- `lib/rateLimit.js` — 60 req/min per-IP in-memory buckets

**Velo-side (`src/backend/`):**
- `agentRuntimeService.jsw` — `isRuntimeAvailable()` + `callRuntimeStep()` with circuit breaker
- `configData.js` — `FEATURE_FLAGS` section (`runtimeEnabled`, `semanticToolEnabled`, `semanticSearchBlendEnabled`)
- `agentService.jsw` — routes AI step to runtime when available, falls back to `routeAIRequest`

### 2026-02-19 — Track Created
- Track created from AI runtime capability gap analysis.
- All 4 phases defined and scoped.
- Architecture constraint documented: Wix cannot host provider SDK runtime logic directly; external microservice required.

## Pending

- Add `FMCSA_WEB_KEY` to Railway env vars to unlock live FMCSA carrier data in Phase 4 research
- [x] Flip `semanticSearchBlendEnabled: true` after tonight's nightly backfill populates Pinecone indexes
- Rotate `LMDR_INTERNAL_KEY` + `ANTHROPIC_API_KEY` (user committed to rotating by EOD 2026-02-20)
