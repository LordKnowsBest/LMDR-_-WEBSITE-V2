# Spec — RAG + Intent Layer API Contracts

**Track:** `rag_intent_layer_20260224`
**Base URL:** `https://lmdr-ai-intelligence-production.up.railway.app`
**API version:** `v1`

Authentication, error codes, and rate limits follow the same contract as `ai_intelligence_layer_20260219/spec.md` — shared `x-lmdr-internal-key` + `x-lmdr-timestamp` headers, 60 req/min limit.

---

## §1 — `POST /v1/rag/ingest`

Ingests one document into a knowledge namespace. Creates or updates the vector in Pinecone and writes a record to `v2_RAG Documents` in Airtable.

**Timeout budget (caller):** 3000ms. Ingestion jobs are not in the critical path — failures are caught, logged, and retried on the next scheduled run.

**Request:**
```json
{
  "namespace": "carrier_intel",
  "documentId": "carrier_dot_1234567_driver_intel",
  "text": "Werner Enterprises is a large OTR and team carrier. Driver sentiment rates home time at 3.2/5 across 847 reviews. Solo OTR pay: $0.48–$0.61/mi. Top driver concern: irregular home time vs. stated policy. Equipment: Kenworth T680 and Peterbilt 579, average age 3.2 years. Orientation: Columbus, NE, 4-day program.",
  "metadata": {
    "dot_number": "1234567",
    "carrier_name": "Werner Enterprises",
    "chunk_type": "driver_intelligence",
    "enriched_at": "2026-02-20T00:00:00.000Z",
    "haul_types": ["OTR", "Team"],
    "home_states": ["NE", "TX", "FL", "CA"]
  },
  "sourceUpdatedAt": "2026-02-20T00:00:00.000Z"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `namespace` | string | yes | One of: `carrier_intel`, `driver_market`, `platform_ops`, `industry_regs`, `lane_market`, `conversation_memory` |
| `documentId` | string | yes | Stable identifier for this document. Used for upsert — same ID overwrites. Convention: `{namespace_prefix}_{unique_key}` |
| `text` | string | yes | Plain text to embed. Max 8,000 chars. PII must be scrubbed by caller before submission. |
| `metadata` | object | yes | Pinecone metadata fields. Namespace-specific. See §1a for required fields per namespace. |
| `sourceUpdatedAt` | ISO 8601 string | yes | Timestamp of the source record's last update. Used for idempotency: if source hasn't changed since last ingest, returns 304. |

**Response — 200 OK (ingested):**
```json
{
  "documentId": "carrier_dot_1234567_driver_intel",
  "namespace": "carrier_intel",
  "status": "ingested",
  "ingestedAt": "2026-02-24T10:00:01.234Z",
  "requestId": "uuid"
}
```

**Response — 304 Not Modified (source unchanged):**
```json
{
  "documentId": "carrier_dot_1234567_driver_intel",
  "namespace": "carrier_intel",
  "status": "skipped",
  "reason": "source_unchanged",
  "requestId": "uuid"
}
```

### §1a — Required Metadata Fields by Namespace

| Namespace | Required Fields | Optional but Recommended |
|-----------|----------------|--------------------------|
| `carrier_intel` | `dot_number`, `chunk_type`, `enriched_at` | `carrier_name`, `haul_types`, `home_states` |
| `driver_market` | `topic_category`, `generated_at` | `cdl_class`, `haul_type`, `region` |
| `platform_ops` | `doc_type`, `last_updated` | `audience_roles` |
| `industry_regs` | `reg_category`, `effective_date` | `cdl_classes`, `endorsements` |
| `lane_market` | `lane_region`, `data_date` | `haul_type`, `fuel_price`, `rate_index` |
| `conversation_memory` | `user_id`, `role`, `conversation_id`, `turn_index`, `created_at` | `intent_class` |

**`chunk_type` values for `carrier_intel`:**
- `safety_profile` — FMCSA safety stats
- `driver_intelligence` — pay, home time, driver sentiment
- `operational_profile` — fleet, haul types, lanes, equipment
- `recent_signals` — hiring activity, recent changes

**`topic_category` values for `driver_market`:**
- `pay_expectations`, `home_time_preferences`, `leave_reasons`, `desired_benefits`, `endorsement_value`, `hiring_demand`

---

## §2 — `POST /v1/rag/retrieve`

Retrieves top-k relevant document chunks from one or more knowledge namespaces for a given query.

**Timeout budget (caller):** 200ms. Circuit breaker at 3 consecutive failures → 60s open. Fails open (empty `chunks` array returned).

**Request:**
```json
{
  "query": "What do drivers say about Werner's home time? Is it as promised?",
  "namespaces": ["carrier_intel", "driver_market"],
  "roleScope": "driver",
  "topK": 5,
  "filters": {
    "dot_number": "1234567"
  },
  "contextBudgetTokens": 2000,
  "userId": "hashed_user_id",
  "traceId": "runLedger-recAbc123"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `query` | string | yes | The user's message or a reformulated retrieval query. Max 500 chars. |
| `namespaces` | string[] | yes | Non-empty. Cross-namespace retrieval merges and re-ranks results. |
| `roleScope` | string | yes | `driver` \| `recruiter` \| `admin` \| `carrier`. Enforces namespace access rules. |
| `topK` | integer | no | Per-namespace top-k before merging. Default: 5. Max: 20. |
| `filters` | object | no | Pinecone metadata filters. Applied to all queried namespaces. Cross-namespace filters must apply to all — use sparingly. |
| `contextBudgetTokens` | integer | no | Max tokens in assembled context block. Default: 2000. Max: 3000. |
| `userId` | string | no | Required when `conversation_memory` is in `namespaces`. SHA-256 hashed user ID. |
| `traceId` | string | no | Wix trace ID for cross-system correlation. |

**Access enforcement:** If `roleScope` is `driver` and `namespaces` contains `carrier_intel` with no user-accessible reason, the server enforces the namespace access matrix from `metadata.json`. Unauthorized namespace access returns a 400 with `code: NAMESPACE_ACCESS_DENIED`.

**Response — 200 OK:**
```json
{
  "chunks": [
    {
      "documentId": "carrier_dot_1234567_driver_intel",
      "namespace": "carrier_intel",
      "text": "Werner Enterprises is a large OTR and team carrier. Driver sentiment rates home time at 3.2/5 across 847 reviews...",
      "cosineScore": 0.934,
      "freshnessScore": 0.89,
      "combinedScore": 0.929,
      "metadata": {
        "dot_number": "1234567",
        "carrier_name": "Werner Enterprises",
        "chunk_type": "driver_intelligence",
        "enriched_at": "2026-02-20T00:00:00.000Z"
      }
    },
    {
      "documentId": "driver_market_home_time_otr",
      "namespace": "driver_market",
      "text": "OTR drivers nationally expect home 2.1 nights per week on average. 72% of OTR drivers rank home time as promised as their top retention factor...",
      "cosineScore": 0.817,
      "freshnessScore": 0.97,
      "combinedScore": 0.848,
      "metadata": {
        "topic_category": "home_time_preferences",
        "generated_at": "2026-02-24T02:00:00.000Z"
      }
    }
  ],
  "contextBlock": "<knowledge_context>\n[CARRIER INTELLIGENCE...]\n</knowledge_context>",
  "totalChunksConsidered": 12,
  "chunksPassedThreshold": 2,
  "totalTokensAssembled": 847,
  "retrievalLatencyMs": 143,
  "requestId": "uuid"
}
```

| Field | Notes |
|-------|-------|
| `chunks` | Ranked by `combinedScore` descending. Only chunks with `combinedScore >= 0.65` included. |
| `contextBlock` | Pre-formatted XML block ready for injection. Empty string if no chunks passed threshold. |
| `totalChunksConsidered` | Chunks returned by Pinecone before threshold filter. |
| `chunksPassedThreshold` | Chunks actually included in `contextBlock`. |
| `totalTokensAssembled` | Approximate token count of `contextBlock`. Uses 4 chars/token heuristic. |

**Response — 200 OK (no relevant chunks):**
```json
{
  "chunks": [],
  "contextBlock": "",
  "totalChunksConsidered": 8,
  "chunksPassedThreshold": 0,
  "noContextReason": "no_chunks_above_threshold",
  "retrievalLatencyMs": 98,
  "requestId": "uuid"
}
```

---

## §3 — `POST /v1/intent/classify`

Classifies the intent of a user message for a given role. Returns intent class, confidence, namespace scope, tool priority hints, and response framing guidance.

**Timeout budget (caller):** 150ms. Fails open: caller uses `general_inquiry` class with role-default namespace scope.

**Request:**
```json
{
  "message": "What do drivers think about Werner's home time? Is it actually as promised?",
  "role": "driver",
  "recentContext": [
    "User asked about OTR carriers in Texas.",
    "Agent listed Werner, JB Hunt, and Schneider as top matches."
  ],
  "userId": "hashed_user_id"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `message` | string | yes | The user's raw message. Max 500 chars. |
| `role` | string | yes | `driver` \| `recruiter` \| `admin` \| `carrier` |
| `recentContext` | string[] | no | Last 2-3 turn summaries for disambiguation. Max 3 items, each max 150 chars. |
| `userId` | string | no | Hashed user ID. Used for caching — same user, same message reuses cached result. |

**Response — 200 OK:**
```json
{
  "intentClass": "carrier_intel_request",
  "confidence": 0.91,
  "namespaceScope": ["carrier_intel"],
  "toolPriorityHints": ["get_carrier_details", "get_carrier_enrichment"],
  "frameHint": "empathetic_informative",
  "entities": {
    "carriers": ["Werner Enterprises"],
    "topics": ["home_time", "driver_sentiment"],
    "dot_numbers": []
  },
  "retrievalFilters": {
    "carrier_intel": { "carrier_name": "Werner Enterprises" }
  },
  "latencyMs": 87,
  "model": "llama-3.3-70b-versatile",
  "requestId": "uuid"
}
```

| Field | Notes |
|-------|-------|
| `intentClass` | One of the taxonomy classes from `intent-taxonomy.md`, or `general_inquiry` as fallback. |
| `confidence` | [0, 1]. Values < 0.5 → intentClass is `general_inquiry` regardless of the model's output. |
| `namespaceScope` | Ordered list of namespaces to retrieve from. First namespace is primary. |
| `toolPriorityHints` | Tool names from the role's tool registry to surface first in the agent's tool list. |
| `frameHint` | Tone/format guidance for system prompt injection. See §3a for valid values. |
| `entities` | Extracted named entities. `retrievalFilters` uses these to construct namespace-specific Pinecone filters. |
| `retrievalFilters` | Per-namespace Pinecone filters derived from entities. Can be passed directly to `/v1/rag/retrieve` `filters` if retrieval is called separately. |

**Response — 200 OK (low-confidence fallback):**
```json
{
  "intentClass": "general_inquiry",
  "confidence": 0.31,
  "namespaceScope": ["carrier_intel", "driver_market", "platform_ops"],
  "toolPriorityHints": [],
  "frameHint": "neutral_helpful",
  "entities": {},
  "retrievalFilters": {},
  "latencyMs": 94,
  "model": "llama-3.3-70b-versatile",
  "requestId": "uuid"
}
```

### §3a — `frameHint` Values

| Value | When | System Prompt Effect |
|-------|------|---------------------|
| `empathetic_informative` | Driver asking about carrier quality, home time, working conditions | Lead with driver experience, ground in data, acknowledge uncertainty |
| `direct_tactical` | Recruiter seeking drivers, pipeline actions, campaign triggers | Lead with the answer, follow with supporting data, no hedging |
| `analytical_precise` | Admin health checks, anomaly investigation, data analysis | Lead with status/numbers, include confidence intervals where applicable |
| `motivational_action` | Driver friction resolution, profile improvement, stuck situations | Acknowledge frustration, give 1-3 concrete next steps |
| `educational_clear` | Compliance questions, platform how-tos, onboarding | Structure as explanation, include "what this means for you" |
| `neutral_helpful` | `general_inquiry` fallback | Standard helpful response, no special framing |

---

## §4 — Extended `POST /v1/agent/turn` with `ragConfig`

The existing `POST /v1/agent/turn` endpoint (defined in `ai_intelligence_layer_20260219/spec.md §1`) is extended with an optional `ragConfig` parameter.

**When `ragConfig` is present and `ragConfig.enabled` is true:**
1. Extract the last user message from `messages` array as the retrieval query.
2. Run retrieval via `lib/retrieval.retrieveContext()` using `ragConfig` parameters.
3. If chunks pass threshold: prepend `contextBlock` to `systemPrompt`.
4. Call Claude with the augmented prompt.
5. Include `retrievedChunks` and `ragLatencyMs` in the response.

**When `ragConfig` is absent or `ragConfig.enabled` is false:**
No change to existing behavior.

**Extended request:**
```json
{
  "systemPrompt": "You are LMDR Drive — an intelligent CDL career advisor...",
  "messages": [
    { "role": "user", "content": "What do drivers think about Werner's home time?" }
  ],
  "tools": [...],
  "modelId": "claude-sonnet-4-6",
  "maxTokens": 2048,
  "traceId": "runLedger-recAbc123",
  "ragConfig": {
    "enabled": true,
    "intentClass": "carrier_intel_request",
    "namespaces": ["carrier_intel", "driver_market"],
    "roleScope": "driver",
    "topK": 5,
    "contextBudgetTokens": 2000,
    "filters": {
      "carrier_intel": { "dot_number": "1234567" }
    },
    "userId": "hashed_user_id"
  }
}
```

| New Field | Type | Required | Notes |
|-----------|------|----------|-------|
| `ragConfig.enabled` | boolean | yes (if ragConfig present) | If false, ragConfig is ignored entirely. |
| `ragConfig.intentClass` | string | no | Passed through for telemetry/logging. |
| `ragConfig.namespaces` | string[] | yes (if enabled) | Which namespaces to retrieve from. |
| `ragConfig.roleScope` | string | yes (if enabled) | Enforces namespace access control. |
| `ragConfig.topK` | integer | no | Per-namespace top-k before merge. Default: 5. |
| `ragConfig.contextBudgetTokens` | integer | no | Max tokens for injected context. Default: 2000. |
| `ragConfig.filters` | object | no | Per-namespace Pinecone filters. Keys are namespace names. |
| `ragConfig.userId` | string | no | Required if `conversation_memory` in namespaces. |

**Extended response — 200 OK (text with RAG context used):**
```json
{
  "type": "text",
  "text": "Werner's home time situation is one of the most-mentioned topics in driver reviews. The platform data shows drivers rate it 3.2 out of 5...",
  "stopReason": "end_turn",
  "inputTokens": 1847,
  "outputTokens": 312,
  "providerRunId": "msg_01XYZ...",
  "traceId": "runLedger-recAbc123",
  "requestId": "uuid",
  "latencyMs": 2340,
  "ragLatencyMs": 143,
  "retrievedChunks": [
    {
      "documentId": "carrier_dot_1234567_driver_intel",
      "namespace": "carrier_intel",
      "combinedScore": 0.929
    },
    {
      "documentId": "driver_market_home_time_otr",
      "namespace": "driver_market",
      "combinedScore": 0.848
    }
  ]
}
```

| New Field | Notes |
|-----------|-------|
| `ragLatencyMs` | Time spent on retrieval before Claude call. Present only when `ragConfig.enabled` was true. |
| `retrievedChunks` | Summarized chunk telemetry (documentId, namespace, score). Full chunk text is not returned in agent/turn response — it was injected into the prompt. |

**Extended response — 200 OK (RAG attempted, no context injected):**
```json
{
  "type": "text",
  "text": "I don't have specific intelligence about that carrier in the platform database yet...",
  "stopReason": "end_turn",
  "inputTokens": 892,
  "outputTokens": 147,
  "latencyMs": 1890,
  "ragLatencyMs": 98,
  "retrievedChunks": [],
  "ragNoContextReason": "no_chunks_above_threshold"
}
```

---

## §5 — Health Check Extension

`GET /v1/health` (existing endpoint) is extended with RAG and intent checks:

**Extended Response — 200 OK (healthy):**
```json
{
  "status": "ok",
  "checks": {
    "claude_provider": "ok",
    "pinecone": "ok",
    "openai_embeddings": "ok",
    "voyage_embeddings": "ok",
    "intent_classifier": "ok",
    "rag_lmdr_knowledge_index": "ok",
    "rag_lmdr_memory_index": "ok"
  },
  "uptimeSeconds": 7200,
  "requestId": "uuid"
}
```

**Degradation behavior:**
- `intent_classifier: "error"` — intentService.jsw falls back to `general_inquiry` class. RAG still runs if enabled, using role-default namespaces.
- `rag_lmdr_knowledge_index: "error"` — RAG features disabled. Agents run tool-only. No user-visible error.
- `rag_lmdr_memory_index: "error"` — `conversation_memory` namespace disabled only. Other namespaces unaffected.
- `voyage_embeddings: "error"` — Both embed and retrieve endpoints return 503. RAG features disabled.

---

## §6 — Wix Wrapper Contracts

### `src/backend/intentService.jsw`

```javascript
// Exported functions
export async function classifyUserIntent(message, role, recentContext = [])
// Returns: IntentResult | FallbackIntentResult
// Timeout: 150ms AbortController
// Cache: in-memory, key = sha256(message + role), TTL = 5min
// Fails open: returns defaultIntent(role)

export function defaultIntent(role)
// Returns safe fallback IntentResult with general_inquiry class
// and role-appropriate default namespace scope

export function buildRagConfig(intentResult, role, context, userId)
// Translates IntentResult into ragConfig object for agent/turn call
// Respects FEATURE_FLAGS.ragEnabled* per role
// Returns null if RAG disabled for this role
```

### `src/backend/ragService.jsw`

```javascript
// Exported functions
export async function retrieveContext(query, namespaces, role, filters, budgetTokens)
// Direct retrieval — use when calling retrieve separately from agent/turn
// Returns: { contextBlock, chunks, retrievalLatencyMs, circuitOpen }
// Circuit breaker: 3 failures → 60s open
// Timeout: 200ms

export function isRagAvailable(role)
// Returns bool — checks feature flag + circuit state
```

### `src/backend/ragIngestionService.jsw`

```javascript
// Scheduled job entry points (called from jobs.config)
export async function ingestAllCarrierIntel()
// Fetches all carrierEnrichments updated since last ingestion run
// Builds 4 chunks per carrier, calls /v1/rag/ingest for each
// Chunk size: 10, rate limit: 200ms between chunks

export async function ingestDriverMarketAggregate()
// Aggregates driverProfiles → produces 20-30 anonymized thematic docs
// Calls /v1/rag/ingest for each

export async function ingestLaneMarket()
// Pulls VelocityMatch DataLake → produces lane docs → ingests

// Inline ingestion (called from agentService.jsw, fire-and-forget)
export async function ingestTurnMemory(userId, role, conversationId, userMessage, agentResponse)
// Summarizes turn → embeds → upserts to lmdr-memory index
// Never awaited in the critical path

// Manual re-ingestion (called from admin dashboard)
export async function reingestCarrier(dotNumber)
export async function reingestDocument(ragDocument)
```

---

## §7 — New Airtable Table Field Schemas

### `v2_RAG Documents`

| Field | Type | Notes |
|-------|------|-------|
| `document_id` | Text | Stable document identifier (primary lookup) |
| `namespace` | Single select | carrier_intel, driver_market, platform_ops, industry_regs, lane_market, conversation_memory |
| `source_key` | Text | dot_number, user_id, topic_category, etc. |
| `source_updated_at` | Date | Timestamp of source record's last modification |
| `last_ingested_at` | Date | Timestamp of last successful Pinecone upsert |
| `ttl_hours` | Number | Per-namespace TTL |
| `freshness_status` | Single select | fresh, stale, expired |
| `ingestion_failures` | Number | Consecutive failure count (dead-letter after 3) |
| `chunk_type` | Text | driver_intelligence, safety_profile, ops, signals, topic, etc. |
| `token_count` | Number | Approximate token count of the document text |

### `v2_RAG Retrieval Log`

| Field | Type | Notes |
|-------|------|-------|
| `turn_id` | Text | agentTurns record ID |
| `user_id_hash` | Text | sha256(userId + TRACE_SALT) — never raw userId |
| `role` | Single select | driver, recruiter, admin, carrier |
| `intent_class` | Text | Classified intent for this retrieval |
| `namespaces_queried` | Text | Comma-separated namespaces |
| `chunks_retrieved` | Number | Chunks returned from Pinecone |
| `chunks_injected` | Number | Chunks that passed threshold and were injected |
| `top_chunk_score` | Number | Combined score of highest-scoring chunk |
| `rag_latency_ms` | Number | Retrieval latency |
| `response_contains_retrieval` | Checkbox | Heuristic: response references retrieved entity |
| `user_continued_conversation` | Checkbox | Did user send another message? (filled in by next turn) |
| `followed_by_application` | Checkbox | Did this turn precede a driver application? (async) |
| `created_at` | Date | Turn timestamp |

### `v2_Intent Classification Log`

| Field | Type | Notes |
|-------|------|-------|
| `message_hash` | Text | sha256(message) — no raw message stored |
| `role` | Single select | driver, recruiter, admin, carrier |
| `intent_class` | Text | Classified intent |
| `confidence` | Number | [0, 1] classifier confidence |
| `namespaces_selected` | Text | Comma-separated |
| `tool_hints_count` | Number | Number of tool priority hints returned |
| `latency_ms` | Number | Classification latency |
| `model` | Text | Groq model used |
| `used_fallback` | Checkbox | True if confidence < 0.5 → general_inquiry |
| `created_at` | Date | Classification timestamp |

### `v2_RAG Analytics`

| Field | Type | Notes |
|-------|------|-------|
| `week_start` | Date | Monday of the week this record covers |
| `role` | Single select | driver, recruiter, admin, carrier, all |
| `namespace` | Single select | Per-namespace rollup |
| `retrieval_count` | Number | Total retrieval events |
| `avg_latency_ms` | Number | Average retrieval latency |
| `p95_latency_ms` | Number | P95 retrieval latency |
| `citation_rate` | Number | % of RAG turns where response referenced context |
| `continuation_rate` | Number | % of RAG turns where user sent a follow-up |
| `avg_top_chunk_score` | Number | Average cosine score of top chunk |
| `namespace_fresh_pct` | Number | % of documents fresh at start of week |
| `namespace_stale_pct` | Number | % stale |
| `namespace_expired_pct` | Number | % expired |
