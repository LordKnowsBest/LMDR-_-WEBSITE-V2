# Plan — AI Intelligence Layer
## Semantic Search · Agent Streaming · B2B Multi-Agent · LangSmith Tracing

**Created:** 2026-02-19
**Status:** PLANNED — not started
**Priority order:** Phase 1 → Phase 2 → Phase 3 → Phase 4

---

## Why This Track Exists

The existing agent infrastructure (`agentService.jsw`, `aiRouterService.jsw`, `agentConversationService.jsw`) covers the core loop well. Three capability gaps remain:

1. **No semantic search** — driver/carrier matching is purely filter-based. Semantic similarity (embeddings + vector store) would meaningfully improve match quality.
2. **No agent observability** — agent turns are logged to Airtable but there's no structured trace of reasoning chains, tool latency, or failure modes across conversations.
3. **No streaming** — agent responses are fully buffered before delivery, adding perceived latency.
4. **Sequential B2B research** — `b2bResearchAgentService.jsw` runs FMCSA → social → news lookups in series. Parallel sub-agents would cut latency by ~3×.

### Architecture Constraint

> Wix Velo is **not** a Node.js runtime. LangChain, LlamaIndex, CrewAI, and similar frameworks depend on Node.js internals and **cannot run inside `.jsw` files**.

All framework code lives in an **external microservice** (recommended: Railway or Render, deployed from this repo as a separate service). Velo calls it via `fetch()` from backend `.jsw` files. Velo remains the orchestration and auth layer — the microservice is stateless and API-key-gated.

```
Velo (.jsw) ──fetch()──► AI Microservice (Node.js/Python)
                              ├── LlamaIndex + Pinecone (Phase 1)
                              ├── LangSmith SDK (Phase 2)
                              ├── SSE stream endpoint (Phase 3)
                              └── CrewAI supervisor (Phase 4)
```

---

## Phase 1 — Semantic Search Microservice ✦ HIGH VALUE

**Goal:** Replace pure filter-based `driverScoring.js` matching with semantic similarity as an additional ranking signal.

### What Gets Built

**Microservice endpoints (Node.js + LlamaIndex):**
- `POST /embed/driver` — generate + upsert driver profile embedding into Pinecone
- `POST /embed/carrier` — generate + upsert carrier profile embedding
- `POST /search/drivers` — semantic query against driver index, returns ranked IDs + scores
- `POST /search/carriers` — semantic query against carrier index
- `GET /health` — liveness check

**Wix backend changes:**
- `src/backend/semanticSearchService.jsw` — thin wrapper calling microservice via `fetch()`
- `src/backend/driverMatching.jsw` — add semantic score as a new dimension alongside existing 6-dimension `driverScoring.js` score (weighted blend, configurable)
- `src/backend/configData.js` — add `semanticSearchEnabled` feature flag

**Embedding triggers:**
- Driver profile created/updated → embed in background (fire-and-forget)
- Carrier preferences updated → re-embed
- Batch backfill job for existing records

### Vector Schema

**Driver index** (Pinecone namespace: `lmdr-drivers`):
```
id: driverId
vector: float[1536]  (text-embedding-3-small)
metadata: {
  cdl_class, endorsements[], home_state,
  experience_years, haul_types[], pay_min,
  is_discoverable, last_active
}
```

**Carrier index** (Pinecone namespace: `lmdr-carriers`):
```
id: carrierId
vector: float[1536]
metadata: {
  dot_number, haul_types[], home_states[],
  pay_range_min, pay_range_max, fleet_size
}
```

### Semantic Score Integration

In `driverScoring.js`, add `semanticScore` as a 7th dimension:
```javascript
// Existing 6 dimensions (unchanged)
const score = weightedSum([
  qualificationScore, experienceScore, locationScore,
  availabilityScore, salaryScore, engagementScore
]);

// New: blend semantic similarity if microservice available
if (semanticScore !== null) {
  return (score * 0.85) + (semanticScore * 0.15);
}
return score;
```

### Rollout
- Feature-flagged behind `semanticSearchEnabled` in configData.js
- A/B test: 50% of searches use semantic blend, 50% pure filter
- Track CTR and hire conversion rate by group

---

## Phase 2 — LangSmith Agent Tracing ✦ HIGH VALUE

**Goal:** Capture structured traces of every agent turn — tool calls, latency, errors, and model outputs — for product-level analysis.

### What Gets Built

**Microservice addition:**
- LangSmith SDK initialized with `LANGSMITH_API_KEY`
- Trace wrapper: every `handleAgentTurn()` call creates a LangSmith run with child spans per tool call

**Wix backend changes:**
- `src/backend/agentService.jsw` — after each `handleAgentTurn()`, POST trace summary to microservice (non-blocking)
- Trace payload: `{ role, userId, conversationId, turnId, toolsUsed[], latencyMs, modelId, inputTokens, outputTokens, error? }`

**What you get in LangSmith dashboard:**
- Per-conversation reasoning chains with tool call details
- P50/P95 latency per tool
- Error rate by role and tool
- Token cost per conversation
- Side-by-side prompt comparison for prompt tuning

### Airtable impact
- Existing `agentTurns` collection keeps raw data
- LangSmith is the analysis/visualization layer — no Airtable schema changes needed

---

## Phase 3 — Streaming Agent Responses ◈ LOW PRIORITY

**Goal:** Stream agent token output to HTML components rather than buffering the full response.

### Current Flow (buffered)
```
HTML → postMessage → Wix page code → agentService → Claude API → full response → postMessage → HTML
```

### Target Flow (streamed)
```
HTML → postMessage → Wix page code → agentService → Claude API (stream)
                                                         ↓ chunk
                                               postMessage(chunk) → HTML appends token
```

### What Gets Built

**Wix backend changes:**
- `src/backend/agentService.jsw` — add `handleAgentTurnStream(role, userId, message, context, onChunk)` variant using Claude's streaming API
- `src/pages/*.js` — page code receives stream chunks, forwards via `component.postMessage({ action: 'agentChunk', payload: { token, done } })`

**HTML module changes:**
- `surveys-bridge.js` + each surface's bridge module — handle `agentChunk` action, append to active message bubble, show typing cursor

### Constraint
- Wix Velo supports `fetch()` but streaming (`ReadableStream`) support in Velo's backend runtime is limited — needs testing. If Velo can't support SSE natively, route through the microservice which proxies the stream.

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
  ─────────────────────────
  Total: ~30-45s
```

### Target Architecture (parallel via CrewAI microservice)
```
Microservice supervisor agent:
  ├── FMCSA agent      (parallel)  ─┐
  ├── Social agent     (parallel)  ─┤─► synthesizer agent → structured report
  ├── News agent       (parallel)  ─┤
  └── LinkedIn agent   (parallel)  ─┘
  ─────────────────────────────────
  Total: ~10-15s (bottleneck = slowest sub-agent)
```

**Wix backend changes:**
- `src/backend/b2bResearchAgentService.jsw` — replace internal sequential calls with single `fetch()` to microservice `/research/company` endpoint
- Response shape stays identical — no frontend changes needed

### Decision Gate
Build Phase 4 only if:
- B2B product is actively used (>50 company lookups/month)
- Phase 1 microservice is already deployed (infrastructure already exists)
- Research latency is a user-reported pain point

---

## Microservice Repository Structure

Recommended: add a `/services/ai-intelligence/` directory to this repo, deployed as a separate service on Railway.

```
services/ai-intelligence/
├── package.json              (Node.js 20, LlamaIndex, LangSmith, CrewAI-js or Python subprocess)
├── server.js                 (Hono or Express — lightweight)
├── routes/
│   ├── embed.js              (Phase 1 — driver/carrier embedding)
│   ├── search.js             (Phase 1 — semantic queries)
│   ├── trace.js              (Phase 2 — LangSmith ingestion)
│   ├── stream.js             (Phase 3 — SSE proxy)
│   └── research.js           (Phase 4 — parallel B2B agents)
├── lib/
│   ├── pinecone.js           (vector store client)
│   ├── embeddings.js         (OpenAI text-embedding-3-small)
│   ├── langsmith.js          (tracing client)
│   └── crewai.js             (Phase 4 only)
└── railway.toml              (Railway deployment config)
```

**Auth:** Microservice validates `x-lmdr-internal-key` header (secret stored in Wix Secrets Manager + Railway env vars). Never exposed to frontend.

---

## Implementation Order

| Phase | When to Start | Blocker |
|-------|--------------|---------|
| 1 — Semantic Search | Next sprint | None — greenfield |
| 2 — LangSmith | Alongside Phase 1 | Phase 1 microservice scaffold |
| 3 — Streaming | After Phase 1 is stable | Velo streaming API confirmation |
| 4 — B2B Multi-Agent | After Phase 1 is stable + B2B usage confirmed | Phase 1 infra |
