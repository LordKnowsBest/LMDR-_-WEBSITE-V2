# Plan - AI Intelligence Layer
## Claude Agent SDK Runtime, Semantic Search Tools, Streaming, and B2B Parallel Research

**Created:** 2026-02-19  
**Revised:** 2026-02-20  
**Status:** PLANNED - rewritten for Claude Agent SDK-first architecture  
**Priority order:** Phase 1 -> Phase 2 -> Phase 3 -> Phase 4

---

## Why This Track Exists

The current Velo agent stack is functional, but still has four gaps:

1. No semantic retrieval in matching and agent reasoning.
2. Incomplete external run observability for tool-level analysis.
3. Buffered responses create avoidable UX latency.
4. B2B research workflows remain too sequential for high-speed ops.

This track upgrades runtime capability without moving orchestration out of Wix.

---

## Architecture Direction (Updated)

Wix Velo remains the orchestration and auth layer.  
An external microservice becomes the **AI runtime layer**, with **Claude Agent SDK as the primary runtime**.

Important: this is **Claude-first, not Claude-only**.

- `claudeAdapter` is implemented first.
- A provider interface is required so future adapters (`openaiAdapter`, `geminiAdapter`) can be added without changing Wix contracts.

### Runtime Boundary

```
Wix (.jsw/page code)
  -> fetch() -> AI Runtime Microservice (Node.js)
                - agent runtime adapter interface
                - claudeAdapter (Phase 1 baseline)
                - semantic search tools
                - streaming endpoint
                - observability export adapters
```

### Canonical Adapter Interface (Microservice Internal)

All providers must implement:

- `runTurn(request)`
- `streamTurn(request, onEvent)`
- `invokeTool(toolName, params, context)`
- `health()`

Wix code never depends on provider-specific SDK calls.

---

## Phase 1 - Claude Agent Runtime Foundation + Contracts (Highest Priority)

**Goal:** Establish production-safe external runtime with stable API contracts and fallback.

### Deliverables

- Create `services/ai-intelligence/` microservice.
- Implement `claudeAdapter` using Claude Agent SDK.
- Define stable external endpoints:
  - `POST /agent/turn`
  - `POST /agent/stream`
  - `GET /health`
- Add auth guard on all endpoints using `x-lmdr-internal-key`.
- Add provider abstraction wiring (`runtimeProvider` config, default `claude`).
- Add Wix integration wrapper:
  - `src/backend/agentRuntimeService.jsw` (new)
  - non-blocking fallback to existing `handleAgentTurn` path if runtime unavailable.

### API Contract Requirements

Each endpoint must have JSON schema:

- Request shape
- Success shape
- Error taxonomy (`validation_error`, `auth_error`, `timeout`, `provider_error`, `circuit_open`)
- Timeout budget and retry policy

### Exit Criteria

- `agentService.jsw` can execute via external runtime behind feature flag.
- Fallback to legacy path verified in tests.
- P95 runtime call latency target defined and monitored.

---

## Phase 2 - Semantic Search as Agent Tools

**Goal:** Add semantic retrieval as first-class tools callable by Claude runtime and matching services.

### Deliverables

- Add semantic endpoints in microservice:
  - `POST /embed/driver`
  - `POST /embed/carrier`
  - `POST /search/drivers`
  - `POST /search/carriers`
- Implement Pinecone-backed vector stores with explicit index versioning.
- Add Wix wrapper:
  - `src/backend/semanticSearchService.jsw` (new)
- Integrate into ranking flow:
  - `src/backend/driverMatching.jsw`
  - `src/backend/driverScoring.js`
- Feature flags in `src/backend/configData.js`:
  - `semanticToolEnabled`
  - `semanticSearchBlendEnabled`

### Blending Policy

- Keep existing deterministic score as baseline.
- Add semantic contribution only when semantic response is valid and within latency budget.
- If semantic call fails/times out, ranking must degrade to baseline only (no partial corruption).

### Data Flow Requirements

- Idempotent embed upserts.
- Backfill job with checkpointing and retry limits.
- Dead-letter logging for persistent failures.

### Exit Criteria

- Semantic scoring can be enabled/disabled without deploy.
- A/B assignment spec is documented and implemented.
- CTR and conversion metrics are tracked by experiment cohort.

---

## Phase 3 - Streaming UX via Claude Runtime Events

**Goal:** Reduce perceived latency with event streaming from runtime to UI.

### Deliverables

- `POST /agent/stream` emits chunk/events from Claude runtime.
- Wix page bridges forward events to HTML components:
  - `agentChunk`
  - `agentToolEvent`
  - `agentDone`
  - `agentError`
- UI rendering support in bridge modules (append tokens, show cursor, finalize message).

### Decision Gate

Validate Velo runtime behavior:

- If direct stream relay is stable: use direct relay path.
- If unstable: use runtime-buffered event polling fallback path.

Both paths must preserve the same frontend event contract.

### Exit Criteria

- Time-to-first-token target: `< 800ms` in staging benchmark.
- Stream interruption behavior tested (disconnect/retry).

---

## Phase 4 - B2B Parallel Research via Runtime Tool Fan-Out

**Goal:** Replace sequential B2B research orchestration with parallel task fan-out and synthesis.

### Deliverables

- Implement `/research/company` in microservice using runtime tool fan-out:
  - FMCSA
  - social
  - news
  - LinkedIn signals
- Keep `src/backend/b2bResearchAgentService.jsw` response shape stable for frontend compatibility.
- Add partial-result policy:
  - structured confidence indicators
  - source-level error reporting
  - no silent success on critical-source failure

### Decision Gate

Execute only when:

- B2B usage threshold is met (`>50` lookups/month), and
- latency is a verified user pain point.

### Exit Criteria

- Median research runtime materially reduced.
- Regression tests pass for existing B2B consumers.

---

## Observability and Operations (Cross-Phase)

### Trace Correlation

- Keep Wix trace IDs (existing observability service) as source of truth.
- Runtime responses include external `runId`/`providerTraceId`.
- Persist mapping for cross-system debugging.

### Metrics/SLOs

- Runtime availability
- P50/P95 latency by endpoint
- tool error rate
- token cost per request
- fallback activation rate

### Security Controls

- Shared secret auth (`x-lmdr-internal-key`)
- request timestamp + nonce validation
- rate limiting per endpoint
- key rotation runbook
- PII redaction policy for logs/traces

---

## Repository Structure

```
services/ai-intelligence/
|-- package.json
|-- server.js
|-- routes/
|   |-- agent.js
|   |-- stream.js
|   |-- semantic.js
|   |-- research.js
|   `-- health.js
|-- runtime/
|   |-- providerInterface.js
|   |-- claudeAdapter.js
|   |-- openaiAdapter.js        (stub)
|   `-- geminiAdapter.js        (stub)
|-- lib/
|   |-- pinecone.js
|   |-- embeddings.js
|   |-- tracing.js
|   `-- auth.js
`-- railway.toml
```

---

## Implementation Order and Gates

| Phase | Start Condition | Blocker | Hard Gate |
|------|------------------|---------|-----------|
| 1 - Runtime Foundation | Immediate | None | Contract + fallback tests pass |
| 2 - Semantic Tools | After Phase 1 API stable | Runtime endpoint contracts | Blend fallback + A/B instrumentation live |
| 3 - Streaming | After Phase 1 stable in staging | Stream relay validation | TTFT benchmark and interruption tests pass |
| 4 - B2B Parallel | After Phase 1+2 in production and usage gate met | Usage and pain-point validation | Response compatibility + latency improvement verified |

---

## Definition of Done (Track)

Track is complete only when:

1. Claude Agent SDK runtime is live behind feature flags with tested fallback.
2. Semantic search tooling is live with safe degradation behavior.
3. Streaming experience is production-enabled with stable UI event contract.
4. B2B parallel research is shipped (or explicitly deferred via documented decision gate).
5. Tests, docs, and runbooks are updated for code/doc parity.
