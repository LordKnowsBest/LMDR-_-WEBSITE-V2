# Spec — AI Intelligence Layer Microservice API Contracts

**Track:** `ai_intelligence_layer_20260219`
**Base URL:** `https://ai.lastmiledr.app` (Railway deployment)
**API version:** `v1`
**All endpoints:** `https://ai.lastmiledr.app/v1/<path>`

---

## Authentication (all endpoints)

Every request must include:

```
x-lmdr-internal-key: <256-bit secret>
x-lmdr-timestamp:    <Unix milliseconds>
```

Requests are rejected with `401` if:
- `x-lmdr-internal-key` is missing or invalid
- `|now - x-lmdr-timestamp| > 30000` ms (replay protection)

Requests are rejected with `429` if:
- Caller exceeds 60 req/min (burst: 10)

Error response shape (all errors):
```json
{
  "error": {
    "code": "INVALID_AUTH",
    "message": "Human-readable description",
    "requestId": "uuid"
  }
}
```

---

## Error Codes

| HTTP | code | Meaning |
|------|------|---------|
| 400 | `INVALID_BODY` | Request body failed schema validation |
| 400 | `MISSING_FIELD` | Required field absent |
| 401 | `INVALID_AUTH` | Missing or invalid `x-lmdr-internal-key` |
| 401 | `TIMESTAMP_EXPIRED` | `x-lmdr-timestamp` outside 30s window |
| 404 | `NOT_FOUND` | Record not indexed (embedding does not exist) |
| 304 | `NOT_MODIFIED` | Embedding up to date; no upsert performed |
| 429 | `RATE_LIMITED` | Caller exceeded rate limit; `Retry-After` header set |
| 500 | `INTERNAL_ERROR` | Unhandled microservice error; `requestId` included for trace |
| 503 | `DEPENDENCY_UNAVAILABLE` | Pinecone or OpenAI unreachable |

---

## §1 — Phase 1: Semantic Search Endpoints

### `POST /v1/embed/driver`

Generates a text embedding for a driver profile and upserts it into the Pinecone `lmdr-drivers` index.

**Timeout budget (caller):** 2000ms — Velo must set `fetch()` timeout to 2000ms. On timeout, log warning and continue without embedding.

**Request:**
```json
{
  "driverId": "recAbc123",
  "profileUpdatedAt": "2026-02-19T10:00:00.000Z",
  "profile": {
    "cdl_class": "A",
    "endorsements": ["Hazmat", "Tanker"],
    "home_state": "TX",
    "experience_years": 8,
    "haul_types": ["OTR", "Flatbed"],
    "pay_min": 0.55,
    "is_discoverable": "Yes",
    "bio": "Experienced OTR driver, prefer Southeast lanes, no touch freight."
  }
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `driverId` | string | yes | Airtable record ID |
| `profileUpdatedAt` | ISO 8601 string | yes | Used for idempotency check |
| `profile` | object | yes | Flattened profile fields used to build embedding text |
| `profile.bio` | string | no | Free-text field; highest semantic signal |

**Response — 200 OK (upserted):**
```json
{
  "driverId": "recAbc123",
  "status": "upserted",
  "embeddedAt": "2026-02-19T10:00:01.234Z",
  "indexVersion": 1,
  "requestId": "uuid"
}
```

**Response — 304 Not Modified (up to date):**
```json
{
  "driverId": "recAbc123",
  "status": "skipped",
  "reason": "embedding_current",
  "requestId": "uuid"
}
```

---

### `POST /v1/embed/carrier`

Generates an embedding for a carrier profile and upserts into `lmdr-carriers`.

**Timeout budget (caller):** 2000ms

**Request:**
```json
{
  "carrierId": "recXyz789",
  "profileUpdatedAt": "2026-02-19T09:00:00.000Z",
  "profile": {
    "dot_number": "1234567",
    "haul_types": ["OTR", "Reefer"],
    "home_states": ["TX", "FL", "GA"],
    "pay_range_min": 0.52,
    "pay_range_max": 0.68,
    "fleet_size": 120,
    "description": "Regional reefer carrier, home weekly, company trucks only."
  }
}
```

**Response — 200 OK:**
```json
{
  "carrierId": "recXyz789",
  "status": "upserted",
  "embeddedAt": "2026-02-19T09:00:01.500Z",
  "indexVersion": 1,
  "requestId": "uuid"
}
```

---

### `POST /v1/search/drivers`

Queries the `lmdr-drivers` index for semantically similar drivers given a carrier's requirements.

**Timeout budget (caller):** 400ms — if exceeded, caller uses deterministic score only and logs circuit warning.

**Request:**
```json
{
  "query": "Looking for experienced OTR flatbed driver in Texas, hazmat preferred, min $0.54/mi",
  "filters": {
    "is_discoverable": "Yes",
    "cdl_class": "A"
  },
  "topK": 50,
  "includeMetadata": true
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `query` | string | yes | Natural language description of ideal driver |
| `filters` | object | no | Pinecone metadata filters (exact match only) |
| `topK` | integer | no | Default: 50, max: 200 |
| `includeMetadata` | boolean | no | Default: true |

**Response — 200 OK:**
```json
{
  "results": [
    {
      "driverId": "recAbc123",
      "score": 0.912,
      "stale": false,
      "metadata": {
        "cdl_class": "A",
        "home_state": "TX",
        "experience_years": 8,
        "last_active": "2026-02-18T00:00:00.000Z",
        "index_version": 1
      }
    }
  ],
  "totalReturned": 1,
  "queryLatencyMs": 38,
  "requestId": "uuid"
}
```

| Field | Notes |
|-------|-------|
| `score` | Cosine similarity, range [0, 1]. Higher = more similar |
| `stale` | `true` if profile was updated > 24h ago without re-embedding |

**Pagination:** `topK` is the only pagination control. Pinecone ANN is not cursor-paginated. For large result sets, increase `topK` and filter in Velo.

---

### `POST /v1/search/carriers`

Queries `lmdr-carriers` for carriers matching a driver's profile.

**Timeout budget (caller):** 400ms

**Request:**
```json
{
  "query": "OTR flatbed driver in Texas, 8 years experience, hazmat endorsement, wants $0.55/mi minimum",
  "filters": {},
  "topK": 20,
  "includeMetadata": true
}
```

**Response — 200 OK:** Same shape as `/search/drivers` with `carrierId` instead of `driverId`.

---

### `GET /v1/health`

**Timeout budget (caller):** 1000ms

**Response — 200 OK (healthy):**
```json
{
  "status": "ok",
  "checks": {
    "pinecone": "ok",
    "openai_embeddings": "ok"
  },
  "uptimeSeconds": 3600,
  "requestId": "uuid"
}
```

**Response — 503 (degraded):**
```json
{
  "status": "degraded",
  "checks": {
    "pinecone": "error",
    "openai_embeddings": "ok"
  },
  "requestId": "uuid"
}
```

---

## §2 — Phase 2: LangSmith Trace Ingest

### `POST /v1/trace/agent-turn`

Receives an agent turn summary from Velo and forwards an enriched span to LangSmith. PII redaction is applied before forwarding.

**Timeout budget (caller):** 500ms, fire-and-forget — Velo does NOT await this call in the critical path.

**Request:**
```json
{
  "role": "recruiter",
  "userHash": "sha256(userId + salt)",
  "conversationId": "recConv123",
  "turnId": "recTurn456",
  "turnIndex": 3,
  "input": "Find me CDL-A drivers in Dallas available next week",
  "output": "I found 12 drivers matching your criteria...",
  "toolsUsed": [
    {
      "name": "search_drivers",
      "latencyMs": 210,
      "success": true,
      "inputTokens": 0,
      "outputTokens": 0
    }
  ],
  "modelId": "claude-sonnet-4-6",
  "totalLatencyMs": 890,
  "inputTokens": 1240,
  "outputTokens": 387,
  "error": null,
  "timestamp": "2026-02-19T10:05:00.000Z"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `role` | string | yes | `driver` \| `recruiter` \| `admin` \| `carrier` |
| `userHash` | string | yes | `sha256(userId + TRACE_SALT)` — never raw userId |
| `conversationId` | string | yes | Airtable `agentConversations` record ID |
| `turnId` | string | yes | Airtable `agentTurns` record ID |
| `input` | string | yes | User message — PII scrubbed server-side before LangSmith |
| `output` | string | yes | Agent response — PII scrubbed server-side |
| `toolsUsed` | array | yes | One entry per tool call in this turn |
| `error` | string \| null | yes | Error message if turn failed, else null |

**PII Redaction (applied in `routes/trace.js` before LangSmith):**
- Phone numbers → `[PHONE]`
- Email addresses → `[EMAIL]`
- SSN patterns → `[SSN]`
- Driver names from known profiles → `[NAME]`

**Response — 200 OK:**
```json
{
  "status": "accepted",
  "langsmithRunId": "ls-run-uuid",
  "requestId": "uuid"
}
```

**Response — 500 (LangSmith unreachable):** Logged internally; caller receives 500 but has already fire-and-forgot — no user impact.

---

## §3 — Phase 3: Streaming (Branch B only)

Only built if Velo native `ReadableStream` spike fails (Branch B).

### `POST /v1/stream/agent-turn`

Receives full agent turn context, calls Claude API with streaming enabled, and streams tokens back to Velo via Server-Sent Events (SSE).

**Timeout budget (caller):** 30000ms (30s max per turn)

**Request:**
```json
{
  "role": "driver",
  "userId": "velo-user-id",
  "message": "What carriers are hiring near Houston?",
  "context": {
    "conversationId": "recConv123",
    "recentTurns": []
  },
  "modelId": "claude-sonnet-4-6"
}
```

**Response:** `Content-Type: text/event-stream`

```
data: {"type":"token","token":"Based"}

data: {"type":"token","token":" on"}

data: {"type":"token","token":" your"}

data: {"type":"done","totalTokens":312,"latencyMs":1240}
```

| Event type | Fields | Notes |
|------------|--------|-------|
| `token` | `token: string` | Incremental text chunk |
| `done` | `totalTokens`, `latencyMs` | Stream complete |
| `error` | `message: string` | Stream aborted; client shows error state |

---

## §4 — Phase 4: B2B Parallel Research

### `POST /v1/research/company`

Runs 4 sub-agents in parallel against a company identifier and returns a unified intelligence report.

**Timeout budget (caller):** 20000ms (20s). If exceeded, return partial results with `partial: true`.

**Request:**
```json
{
  "dotNumber": "1234567",
  "companyName": "Acme Freight LLC",
  "requestedSections": ["fmcsa", "social", "news", "linkedin"]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `dotNumber` | string | yes | FMCSA DOT number |
| `companyName` | string | yes | Used for social/news/LinkedIn queries |
| `requestedSections` | string[] | no | Default: all 4 sections |

**Response — 200 OK:**
```json
{
  "dotNumber": "1234567",
  "partial": false,
  "generatedAt": "2026-02-19T10:10:05.000Z",
  "latencyMs": 11200,
  "sections": {
    "fmcsa": {
      "status": "ok",
      "safetyRating": "Satisfactory",
      "outOfServiceRate": 0.04,
      "crashes12mo": 2,
      "inspections12mo": 48
    },
    "social": {
      "status": "ok",
      "platforms": ["Facebook", "LinkedIn"],
      "followerCount": 1240,
      "recentPostSentiment": "positive",
      "summary": "Active hiring posts, driver testimonials visible."
    },
    "news": {
      "status": "ok",
      "articleCount": 3,
      "headlines": ["Acme Freight expands Southeast operations"],
      "overallSentiment": "positive"
    },
    "linkedin": {
      "status": "partial",
      "employeeCount": 145,
      "recentHires": 8,
      "note": "LinkedIn data throttled; headcount estimated."
    }
  },
  "synthesis": "Acme Freight is a growing carrier with a satisfactory safety record and active driver recruitment. Southeast expansion suggests hiring demand. LinkedIn data was partial.",
  "requestId": "uuid"
}
```

**Partial response** (one or more sub-agents timed out):
- `partial: true`
- Failed section has `"status": "timeout"` or `"status": "error"` and no data fields
- Remaining sections returned normally
- Caller (`b2bResearchAgentService.jsw`) surfaces partial data with a warning flag

---

## §5 — Velo Wrapper Contract (`semanticSearchService.jsw`)

The Velo-side wrapper must implement:

```javascript
// Circuit breaker state (in-memory, per Velo instance)
let circuitFailures = 0;
let circuitOpenUntil = 0;
const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_OPEN_MS = 60000;
const SEARCH_TIMEOUT_MS = 400;
const EMBED_TIMEOUT_MS = 2000;

export async function searchDriversSemantic(query, filters, topK = 50) {
  if (Date.now() < circuitOpenUntil) {
    return { scores: null, circuitOpen: true };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

    const res = await fetch(`${MICROSERVICE_BASE}/v1/search/drivers`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ query, filters, topK }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    circuitFailures = 0;
    return await res.json();
  } catch (err) {
    circuitFailures++;
    if (circuitFailures >= CIRCUIT_THRESHOLD) {
      circuitOpenUntil = Date.now() + CIRCUIT_OPEN_MS;
      console.error('[semanticSearch] Circuit opened:', err.message);
    } else {
      console.warn('[semanticSearch] Request failed:', err.message);
    }
    return { scores: null, circuitOpen: circuitFailures >= CIRCUIT_THRESHOLD };
  }
}

function buildHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-lmdr-internal-key': INTERNAL_KEY, // from wix-secrets-backend
    'x-lmdr-timestamp': String(Date.now())
  };
}
```
