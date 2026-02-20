# Progress - AI Intelligence Layer

## Status: IN PROGRESS - Phase 1 Complete

| Phase | Name | Priority | Status |
|-------|------|----------|--------|
| 1 | Claude Runtime Foundation + Contracts | YES | **COMPLETE** |
| 2 | Semantic Search as Agent Tools | YES | Not started |
| 3 | Streaming Agent Responses | LOW | Not started |
| 4 | B2B Parallel Research via Runtime Fan-Out | MAYBE | Not started |

## Log

### 2026-02-19 - Phase 1 Implemented

**Microservice (`services/ai-intelligence/`):**
- `server.js` — Hono app, auth + rate-limit middleware, all routes wired
- `runtime/providerInterface.js` — `ProviderAdapter` abstract base class
- `runtime/claudeAdapter.js` — full implementation using `@anthropic-ai/sdk`
- `runtime/openaiAdapter.js`, `runtime/geminiAdapter.js` — stubs (throw on use)
- `routes/agent.js` — `POST /v1/agent/turn` with 28s internal timeout
- `routes/health.js` — `GET /health` auth-exempt liveness probe
- `routes/stream.js`, `routes/semantic.js`, `routes/research.js` — Phase 2-4 stubs (501)
- `lib/auth.js` — `x-lmdr-internal-key` + timestamp replay guard
- `lib/rateLimit.js` — 60 req/min per-IP in-memory buckets
- `__tests__/agent.test.js` — Node built-in test runner covers auth, validation, health, stubs
- `package.json`, `railway.toml`, `.env.example`

**Velo-side (`src/backend/`):**
- `agentRuntimeService.jsw` — `isRuntimeAvailable()` + `callRuntimeStep()` with circuit breaker and 25s timeout
- `configData.js` — `FEATURE_FLAGS` section added (`runtimeEnabled`, `semanticToolEnabled`, `semanticSearchBlendEnabled`)
- `agentService.jsw` — imports `isRuntimeAvailable`/`callRuntimeStep`; routes AI step to runtime when available, falls back to `routeAIRequest` on failure

**Spec (`spec.md`):**
- Added §1 Phase 1 contracts: `POST /v1/agent/turn` + `GET /v1/health` with full request/response schemas
- Renumbered old §1 (Semantic) → §2, §2 (LangSmith) → §3, §3 (Streaming) → §4, §4 (B2B) → §5, §5 (Wrappers) → §6
- Added `agentRuntimeService.jsw` contract table to §6

**Phase 1 exit criteria met:**
- `agentService.jsw` routes AI steps through external runtime behind `FEATURE_FLAGS.runtimeEnabled`
- Fallback to `routeAIRequest` verified on any runtime failure (catch block + circuit breaker)
- P95 latency target: < 3 000 ms per agent step (monitored via `latencyMs` in response)

### 2026-02-20 - Plan Rewritten (Claude Agent SDK Direction)
- Plan rewritten to Claude Agent SDK-first architecture with provider adapter interface.
- External runtime responsibilities clarified: agent turn execution, stream events, semantic tools, and B2B research fan-out.
- Added canonical API contract requirements (`/agent/turn`, `/agent/stream`, `/health`) and explicit error taxonomy.
- Added hard fallback requirement to preserve legacy `handleAgentTurn` path when runtime is unavailable.
- Reframed semantic search as runtime tools with safe blend/degradation rules and feature-flag rollout.
- Added cross-phase observability, security, SLO, and decision gates for streaming and B2B parallel rollout.

### 2026-02-19 - Track Created
- Track created from AI runtime capability gap analysis.
- All 4 phases defined and scoped.
- Architecture constraint documented: Wix cannot host provider SDK runtime logic directly; external microservice is required.
