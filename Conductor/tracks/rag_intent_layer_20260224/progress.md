# Progress — RAG + Intent-Based Agent Intelligence Layer

## Status: **IN PROGRESS** — Phases 1–4 implemented, Phase 5 pending

| Phase | Name | Priority | Status |
|-------|------|----------|--------|
| 1 | Knowledge Base Architecture & Corpus Construction | YES | Done |
| 2 | Intent Classification Service | YES | Done |
| 3 | RAG Retrieval Integration — Extend /v1/agent/turn | YES | Done |
| 4 | Agent Injection Layer — All Four Roles | YES | Done |
| 5 | Knowledge Freshness, Feedback Loop & Admin Analytics | YES | Pending |

## Prerequisites

Before enabling feature flags, confirm:
- [ ] `lmdr-knowledge` Pinecone index created (separate from `lmdr-drivers` and `lmdr-carriers`)
- [ ] `lmdr-memory` Pinecone index created
- [ ] Groq API key added to Railway env vars (`GROQ_API_KEY`)
- [ ] Four new Airtable tables created in `Last Mile Driver recruiting` base:
  - `v2_RAG Documents`
  - `v2_RAG Retrieval Log`
  - `v2_RAG Analytics`
  - `v2_Intent Classification Log`
- [ ] Tables added to `airtableClient.js` TABLE_NAMES and FIELD_MAPPINGS
- [x] Config keys added to `configData.js`
- [x] Feature flags added to `configData.js` FEATURE_FLAGS (all defaulting to `false`)

## Log

### 2026-02-24 — Track Created

- Track authored from RAG benefit analysis on branch `claude/evaluate-rag-benefits-mrhcl`
- Plan, spec, intent taxonomy, and metadata written
- Architecture decision: intent classification and RAG retrieval collapsed into a single
  Railway call via optional `ragConfig` on existing `/v1/agent/turn` endpoint — preserves
  Wix 25s latency budget, adds zero extra round trips
- Six knowledge namespaces defined; `lmdr-knowledge` (5 namespaces) + `lmdr-memory` (per-user)
- Full intent taxonomy documented for all 4 roles: 10 driver intents, 8 recruiter intents,
  5 admin intents, 4 carrier intents + `general_inquiry` fallback

### 2026-02-24 — Phases 1–4 Implemented

**Phase 1 — Knowledge Base Architecture & Corpus Construction**

Created Railway lib modules:
- `services/ai-intelligence/lib/knowledgeCorpus.js` — Namespace configs (6 namespaces), Pinecone host management, role-based access control, PII scrubbing (SSN/email/phone/CDL), freshness scoring
- `services/ai-intelligence/lib/contextBudget.js` — Token estimation, budget-aware context assembly into `<knowledge_context>` XML blocks, never truncates mid-chunk
- `services/ai-intelligence/lib/retrieval.js` — Full retrieval pipeline (embed → query Pinecone → rank → assemble), combined scoring (0.8 cosine + 0.2 freshness), 0.65 threshold, ingest pipeline

Created Railway routes:
- `services/ai-intelligence/routes/rag.js` — POST /v1/rag/ingest (with PII scrub), POST /v1/rag/retrieve (with role access control)

Created Wix backend services:
- `src/backend/ragService.jsw` — Wix wrapper for retrieval (200ms timeout, circuit breaker: 3 failures → 60s open)
- `src/backend/ragIngestionService.jsw` — Ingestion pipeline for carrier intel (4 chunk types per carrier), driver market aggregate, lane market data, conversation memory

Added to `src/backend/configData.js`:
- 4 new Airtable collection keys: `ragDocuments`, `ragRetrievalLog`, `ragAnalytics`, `intentClassificationLog`
- 7 new feature flags: `ragEnabled`, `ragEnabledDriver`, `ragEnabledRecruiter`, `ragEnabledAdmin`, `ragEnabledCarrier`, `intentClassificationEnabled`, `conversationMemoryEnabled`

**Phase 2 — Intent Classification Service**

Created Railway lib module:
- `services/ai-intelligence/lib/intentClassifier.js` — Groq llama-3.3-70b-versatile classifier with role-specific few-shot examples for all 4 roles, complete intent taxonomy mapping (namespace scope, tool hints, frame hints), falls back on confidence < 0.5

Created Railway route:
- `services/ai-intelligence/routes/intent.js` — POST /v1/intent/classify

Created Wix backend service:
- `src/backend/intentService.jsw` — 150ms timeout, in-memory cache (5min TTL, 500 max entries), `classifyUserIntent()`, `defaultIntent()`, `buildRagConfig()` — fails open to defaultIntent

**Phase 3 — RAG Retrieval Integration**

Extended Railway files:
- `services/ai-intelligence/routes/agent.js` — accepts `ragConfig` param in /v1/agent/turn body, runs retrieval internally, prepends contextBlock to system prompt, adds RAG telemetry to response (ragLatencyMs, retrievedChunks, ragNoContextReason)
- `services/ai-intelligence/routes/health.js` — added health checks for lmdr-knowledge and lmdr-memory Pinecone indexes, intent_classifier status
- `services/ai-intelligence/server.js` — wired ragRouter (/v1/rag/*) and intentRouter (/v1/intent/*)

**Phase 4 — Agent Injection Layer**

Modified Wix backend services:
- `src/backend/agentService.jsw` — Added intent pre-flight to `handleAgentTurn()`: parallel `classifyUserIntent()` + `getRecentContext()`, `buildRagConfig()`, tool priority reordering via `_reorderToolsByPriority()`, passes ragConfig through to `callRuntimeStep()`, fire-and-forget `ingestTurnMemory()` after successful turns
- `src/backend/agentRuntimeService.jsw` — Extended `callRuntimeStep()` to accept and forward `ragConfig` to Railway, added RAG telemetry fields to response (ragLatencyMs, retrievedChunks, ragNoContextReason)

Added scheduled jobs to `src/backend/jobs.config`:
- `ingestAllCarrierIntel` — every 8 hours
- `ingestDriverMarketAggregate` — daily at 02:30 UTC
- `ingestLaneMarket` — every 6 hours

## Files Created

| File | Purpose |
|------|---------|
| `services/ai-intelligence/lib/contextBudget.js` | Token budget management for RAG context injection |
| `services/ai-intelligence/lib/knowledgeCorpus.js` | Namespace configs, access control, PII scrubbing, freshness scoring |
| `services/ai-intelligence/lib/retrieval.js` | Core retrieval pipeline: embed → query → rank → assemble |
| `services/ai-intelligence/lib/intentClassifier.js` | Groq-based intent classification with role-specific few-shot |
| `services/ai-intelligence/routes/rag.js` | POST /v1/rag/ingest and /v1/rag/retrieve |
| `services/ai-intelligence/routes/intent.js` | POST /v1/intent/classify |
| `src/backend/intentService.jsw` | Wix wrapper for intent classification |
| `src/backend/ragService.jsw` | Wix wrapper for RAG retrieval |
| `src/backend/ragIngestionService.jsw` | Document ingestion pipeline |

## Files Modified

| File | Changes |
|------|---------|
| `src/backend/configData.js` | 4 collection keys + 7 feature flags |
| `src/backend/agentService.jsw` | Intent pre-flight, ragConfig, tool reordering, turn memory |
| `src/backend/agentRuntimeService.jsw` | ragConfig param forwarding, RAG telemetry |
| `src/backend/jobs.config` | 3 new scheduled ingestion jobs |
| `services/ai-intelligence/routes/agent.js` | ragConfig handling + retrieval in /v1/agent/turn |
| `services/ai-intelligence/routes/health.js` | RAG index + intent classifier health checks |
| `services/ai-intelligence/server.js` | ragRouter + intentRouter wiring |

## Pending

### Phase 5 — Knowledge Freshness, Feedback Loop & Admin Analytics

- [ ] Create `src/backend/ragFreshnessJob.jsw` — per-namespace TTL monitoring and re-ingestion
- [ ] Track retrieval quality metrics (citation rate, continuation rate)
- [ ] Surface RAG analytics in admin observability dashboard
- [ ] Create Airtable tables per spec §7 field schemas
- [ ] Create Pinecone indexes (`lmdr-knowledge`, `lmdr-memory`)

### Activation Checklist (before enabling feature flags)

1. Create Pinecone indexes with Voyage AI voyage-3 dimension (1024)
2. Create 4 Airtable tables and add to `airtableClient.js`
3. Add `GROQ_API_KEY` to Railway environment variables
4. Deploy Railway service with new routes
5. Seed initial knowledge corpus via ingestion endpoints
6. Enable `intentClassificationEnabled` flag first (no RAG)
7. Enable `ragEnabled` + one role flag at a time (e.g., `ragEnabledDriver`)
8. Monitor latency via health endpoint and admin observability
