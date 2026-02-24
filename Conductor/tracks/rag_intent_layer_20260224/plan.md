# Plan — RAG + Intent-Based Agent Intelligence Layer

**Track:** `rag_intent_layer_20260224`
**Created:** 2026-02-24
**Status:** PLANNED
**Priority order:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

---

## The Intent-First Philosophy

This track is not just a RAG implementation. It is the articulation of a philosophy that should govern every agent on this platform:

> **An agent that understands what you mean is more valuable than an agent that executes what you said.**

CDL drivers do not come to LMDR to run searches. They come because they are trying to solve something real: a bad situation at their current carrier, a family that needs them home, a pay cut they cannot absorb, a career they want to control. Every message a driver sends carries that weight. A recruiter sending "find me CDL-A drivers in Dallas" is actually trying to fill a seat by Friday so their carrier doesn't lose a contract.

Generic RAG retrieves text that matches the words. **Intent-first RAG retrieves knowledge that matches the need.** The distinction is the entire product.

### What Intent-First Means in Practice

For every agent message, before reasoning begins, the platform answers three questions:

1. **What is this person literally asking?** (Surface intent — the words)
2. **What outcome do they actually want?** (Deep intent — the need)
3. **What does their situation suggest they need right now?** (Context intent — the moment)

These three layers determine:
- Which knowledge namespaces to retrieve from
- Which tools to prioritize in the agent's action space
- How to frame the response (tone, depth, what to lead with)
- What to anticipate as the logical follow-up

This is not a feature. It is the operating model for every AI surface on the platform.

### The Intelligence Flywheel

Every driver interaction generates a signal.
Every signal enriches the knowledge base.
Every enriched knowledge base improves the next interaction.

Over time, LMDR accumulates what no competitor can buy: **ground truth from tens of thousands of real CDL driver-carrier interactions**, queryable in milliseconds by any agent for any role.

This is the moat. This track builds the engine that spins it.

---

## Why This Track Exists

LMDR's agents currently reason from three inputs:
1. The user's literal message
2. Tool outputs — structured data from Airtable
3. Static system prompts — role instructions written at deploy time

What they **do not** reason from:
- What **this specific carrier's drivers actually experience** day-to-day, beyond raw ratings
- What **drivers like this one** in similar situations have found works and what has burned them
- What **the current freight market** is paying for that CDL class in that lane right now
- What **regulatory reality** looks like for the endorsement they're asking about
- What **this user has told the platform** across previous conversations — their stated priorities, their history, their trajectory

The gap between a tool and an intelligence layer is exactly this: the tool answers the question asked. The intelligence layer understands the context in which the question was asked and responds to that.

RAG closes this gap by connecting the agent's reasoning to a living knowledge corpus built from the platform's own data. Intent classification makes the retrieval precise.

---

## Architecture Overview

```
User Message
     │
     ▼
Intent Classifier (Groq llama-3.3-70b, < 150ms)
     │
     ├── intentClass: "carrier_intel_request"
     ├── namespaceScope: ["carrier_intel"]
     ├── toolPriorityHints: ["get_carrier_details", "get_enrichment"]
     ├── frameHint: "empathetic_informative"
     └── entities: { carriers: ["Werner Enterprises"], topics: ["home_time"] }
     │
     ▼
Collated Agent Turn Request → Railway POST /v1/agent/turn
  {
    systemPrompt: baseSystemPrompt,
    messages: [...conversationHistory, userMessage],
    tools: intentScopedToolList,        ← reordered by priority hints
    ragConfig: {
      enabled: true,
      namespaces: ["carrier_intel"],    ← from intent output
      filters: { dot_number: "..." },   ← from entity extraction
      topK: 5,
      contextBudgetTokens: 2000
    }
  }
     │
     ▼
Railway: RAG Retrieval (< 200ms, inline before Claude call)
     │
     ├── Embed query with Voyage AI voyage-3
     ├── Query Pinecone lmdr-knowledge (namespace: carrier_intel, filter: dot_number)
     ├── Rank by combinedScore (0.8 * cosine + 0.2 * freshness)
     ├── Assemble context block (≤ 2000 tokens, never truncate mid-chunk)
     └── Prepend <knowledge_context> block to systemPrompt
     │
     ▼
Claude Runtime (claude-sonnet-4-6, existing /v1/agent/turn flow)
     │
     ▼
Response + retrievedChunks telemetry
     │
     ▼
Wix: log to ragRetrievalLog, persist turn, return to UI
```

**Key design decision:** Intent classification and RAG retrieval are both triggered from within the existing `/v1/agent/turn` call — not as separate Wix fetch() calls. This preserves the 25-second Wix budget and adds zero additional round trips. The entire intent → retrieve → generate pipeline adds approximately 200-350ms to an agent turn.

---

## Phase 1 — Knowledge Base Architecture & Corpus Construction

**Goal:** Define, populate, and make queryable the six knowledge namespaces.

### The Six Namespaces

| Namespace | Pinecone Index | Access | Source | TTL |
|-----------|----------------|--------|--------|-----|
| `carrier_intel` | lmdr-knowledge | recruiter, driver, admin, carrier, b2b | carrierEnrichments + carrierSafetyData | 7 days |
| `driver_market` | lmdr-knowledge | all roles | driverProfiles aggregate — anonymized only | 24 hours |
| `platform_ops` | lmdr-knowledge | all roles | CLAUDE.md, process docs, FAQ | 30 days (manual) |
| `industry_regs` | lmdr-knowledge | driver, recruiter | FMCSA public corpus, CDL handbook, HOS, ELD | 90 days (manual) |
| `lane_market` | lmdr-knowledge | all roles | VelocityMatch DataLake — fuel, DAT rates, freight indices | 6 hours |
| `conversation_memory` | lmdr-memory | role-specific, user-scoped | agentTurns — per-user summaries | 90 days rolling |

**Index strategy:** A single `lmdr-knowledge` Pinecone index hosts all non-memory namespaces using Pinecone's namespace isolation. A separate `lmdr-memory` index handles user-specific memory to enforce cross-user isolation. `lmdr-memory` queries **always** include a `user_id` metadata filter — no exceptions.

### Carrier Intel Corpus (`carrier_intel`)

Source: `carrierEnrichments` + `carrierSafetyData` in Airtable.

Each carrier is chunked into four documents:

| Chunk | Content | Key Metadata |
|-------|---------|-------------|
| `safety_profile` | FMCSA stats: rating, crashes (12mo), OOS rate, inspections, violations | `dot_number`, `chunk_type: safety` |
| `driver_intelligence` | Pay range, home time policy, driver sentiment summary, social signals, top driver concerns | `dot_number`, `chunk_type: driver_intel` |
| `operational_profile` | Fleet size, haul types, lanes, cargo types, equipment (make/model/avg age), orientation | `dot_number`, `chunk_type: ops` |
| `recent_signals` | Last enrichment date, notable changes, hiring activity indicators, open positions | `dot_number`, `chunk_type: signals`, `enriched_at` |

Ingestion trigger: After every carrier enrichment run (`runEnrichmentBatch`), check if the carrier's enrichment is newer than its indexed document and re-ingest if so. The `ragIngestionService.jsw` batches this.

### Driver Market Corpus (`driver_market`)

Source: Aggregated and anonymized from `driverProfiles`. **Never embed individual driver data.**

Produce thematic documents:
- Pay expectations by CDL class × region × experience band
- Home time preferences by haul type (OTR vs. regional vs. local)
- Top reasons drivers leave carriers — aggregated from survey data and disposition flags
- Most desired benefits by driver demographic
- Endorsement value perceptions (pay premium for Hazmat, Tanker, etc.)
- Application velocity by season and region (hiring demand signals)

Aggregation logic: `ragIngestionService.aggregateDriverMarket()` — runs nightly. Groups `driverProfiles` records, calculates distribution statistics, produces 20-30 thematic documents. No record IDs, no names, no CDL numbers included.

### Industry Regulations Corpus (`industry_regs`)

Source: FMCSA public regulatory corpus. Pre-loaded manually, refreshed quarterly.

Documents to seed:
- CDL Class A/B/C requirements and disqualifications
- Endorsement guide: Hazmat (H), Tanker (N), Doubles/Triples (T), Passenger (P), School Bus (S), Combination (X)
- Hours of Service rules: property-carrying and passenger-carrying
- ELD mandate: requirements, exemptions, exception periods
- Drug & Alcohol Testing: pre-employment, random, post-accident, reasonable suspicion
- FMCSA Drug & Alcohol Clearinghouse: what it is, how it affects hiring, driver query rights
- Medical Certificate (MEC) requirements and expiration cadence
- CSA scoring: what BASIC categories mean for drivers and carriers
- HAZMAT regulations overview: placard requirements, proper shipping names

These are static until law changes — load once, refresh manually on regulatory updates.

### Platform Ops Corpus (`platform_ops`)

Source: `.claude/docs/` reference docs, CLAUDE.md, inferred FAQ.

Documents to produce:
- How LMDR matching works (driver-facing)
- How to improve your match rate (profile completeness, preferences)
- What carrier enrichment means and how to read an enriched profile
- How the interest / application flow works
- VelocityMatch recruiter tools overview
- How voice campaigns work
- Common issues and how to resolve them

### Lane Market Corpus (`lane_market`)

Source: VelocityMatch DataLake (`appt00rHHBOiKx9xl`).

Produce lane-level documents every 6 hours:
- National average fuel prices (diesel) and trend direction
- Current DAT spot rate index by lane category (dry van, reefer, flatbed, tank)
- Regional freight demand signals (tight vs. loose market by region)
- Seasonal hiring demand indicators

This namespace answers: "Is now a good time to be looking for a job?" and "What should I expect a carrier to pay right now?"

### Conversation Memory Corpus (`conversation_memory`)

Source: `agentTurns` Airtable records, per-user.

Ingestion: After every agent turn completes, `ragIngestionService.ingestTurnMemory(userId, role, turnSummary)`:
- Summarize the turn in 2-3 sentences (via Groq Haiku, < 100ms)
- Embed the summary
- Upsert to `lmdr-memory` with `user_id`, `role`, `conversation_id`, `turn_index`, `created_at`

Retrieval: Always filtered by `user_id` and `role`. Returns the most semantically relevant recent turns for the current query — not simply the last N turns.

### New Railway Endpoints (Phase 1)

#### `POST /v1/rag/ingest`
Ingests one document into a knowledge namespace.
See `spec.md §1` for full request/response contract.

#### `POST /v1/rag/retrieve`
Retrieves top-k relevant chunks across one or more namespaces.
See `spec.md §2` for full request/response contract.

### New Wix Backend (Phase 1)

**`src/backend/ragService.jsw`**
- `retrieveContext(query, namespaces, role, filters, budgetTokens)` → formatted context string
- Circuit breaker: 3 failures → 60s open. Timeout: 200ms. Fails open (no context injected).
- Returns `{ contextBlock: string, chunks: array, retrievalLatencyMs: number, circuitOpen: bool }`

**`src/backend/ragIngestionService.jsw`**
- `ingestCarrierIntel(dotNumber)` — builds 4 chunks for one carrier, calls /v1/rag/ingest for each
- `ingestDriverMarketAggregate()` — runs aggregation, produces thematic docs, ingests all
- `ingestLaneMarket()` — pulls DataLake, produces lane docs, ingests all
- `ingestTurnMemory(userId, role, turnId)` — summarizes + ingests one conversation turn
- `runScheduledIngestion(namespace)` — entry point for scheduled jobs

### New Scheduled Jobs (Phase 1)

Add to `src/backend/jobs.config`:
```
runCarrierIntelIngestion    → every 8 hours      → ragIngestionService.ingestAllCarrierIntel()
runDriverMarketIngestion    → daily at 02:00 UTC → ragIngestionService.ingestDriverMarketAggregate()
runLaneMarketIngestion      → every 6 hours      → ragIngestionService.ingestLaneMarket()
```
Conversation memory is ingested inline per turn — no separate job.

### Exit Criteria — Phase 1
- [ ] All 6 namespaces seeded with initial corpus
- [ ] `POST /v1/rag/retrieve` returning results from at least 3 namespaces
- [ ] Ingestion jobs running on schedule with < 5% failure rate
- [ ] `lmdr-knowledge` Pinecone index has > 5,000 vectors
- [ ] `lmdr-memory` index structure defined and accepting writes
- [ ] `ragDocuments` Airtable table tracking all indexed docs with freshness metadata

---

## Phase 2 — Intent Classification Service

**Goal:** Route every agent message through a sub-150ms intent classifier that returns intent class, namespace scope, tool priority hints, and response framing guidance.

### Architecture

Intent classification is a single fast LLM call using Groq's `llama-3.3-70b-versatile` — chosen for P50 latency of 80-100ms at this use case's token depth. It is not a semantic search or a classifier model — it's a structured prompt that extracts structured intent from free text using few-shot examples.

The classifier runs **before** the main agent turn. Its output feeds:
1. Which namespaces the RAG retriever queries
2. Which tools the agent sees first (priority ordering)
3. What framing hint is added to the system prompt
4. What entities (carrier names, topics) filter the retrieval

### Intent Taxonomy

Full taxonomy is documented in `intent-taxonomy.md`. Summary by role:

**Driver:** `carrier_discovery`, `carrier_intel_request`, `compensation_discovery`, `application_support`, `compliance_question`, `profile_help`, `friction_resolution`, `market_research`, `personal_recall`, `onboarding`

**Recruiter:** `driver_search`, `pipeline_analysis`, `candidate_intel`, `outreach_help`, `market_analysis`, `campaign_management`, `compliance_check`, `onboarding_help`

**Admin:** `system_health`, `data_analysis`, `ai_performance`, `operational_query`, `anomaly_investigation`

**Carrier:** `driver_acquisition`, `market_benchmarking`, `compliance_ops`, `profile_management`

All roles have a fallback: `general_inquiry` — used when confidence < 0.5 or message is ambiguous. `general_inquiry` triggers broad retrieval across all role-accessible namespaces.

### Railway Endpoint

#### `POST /v1/intent/classify`
See `spec.md §3` for full contract.

Key design:
- Groq Haiku (not llama-70b) for driver and simple recruiter queries — faster, cheaper, good enough
- Groq llama-3.3-70b for recruiter pipeline analysis and admin queries — more nuanced
- Temperature: 0.1 (near-deterministic for classification)
- Response format: `json_object`
- Max tokens: 300 (structured output only — no prose)

### `lib/intentClassifier.js` (Railway)

```javascript
const ROLE_CONFIGS = {
  driver:    { model: 'llama-3.3-70b-versatile', examples: DRIVER_EXAMPLES },
  recruiter: { model: 'llama-3.3-70b-versatile', examples: RECRUITER_EXAMPLES },
  admin:     { model: 'llama-3.3-70b-versatile', examples: ADMIN_EXAMPLES },
  carrier:   { model: 'llama-3.3-70b-versatile', examples: CARRIER_EXAMPLES }
};

// Output shape always:
// { intentClass, confidence, namespaceScope, toolPriorityHints, frameHint, entities, latencyMs }
```

### `src/backend/intentService.jsw` (Wix)

- `classifyUserIntent(message, role, recentContext)` → calls Railway, 150ms timeout
- Fails open: returns `{ intentClass: 'general_inquiry', confidence: 0, namespaceScope: roleDefaultNamespaces(role) }`
- In-memory cache: identical (message, role) pairs cached 5 minutes — reduces cost on repeated phrases

### Exit Criteria — Phase 2
- [ ] Intent classifier live on Railway, P95 < 150ms measured in staging
- [ ] Classification accuracy > 85% on test set of 50 labeled messages per role (200 total)
- [ ] All 4 role taxonomies defined and loaded as few-shot examples
- [ ] `intentService.jsw` fallback verified: Railway timeout → general_inquiry class → no error surfaced
- [ ] Every intent classification logged to `intentClassificationLog` with role, message hash, class, confidence

---

## Phase 3 — RAG Retrieval Integration

**Goal:** Wire intent output → RAG retrieval → context assembly inline into `/v1/agent/turn`. A single Wix fetch call produces an intent-aware, knowledge-grounded agent response.

### The ragConfig Extension

The existing `POST /v1/agent/turn` body gains an optional `ragConfig` field:

```json
{
  "systemPrompt": "...",
  "messages": [...],
  "tools": [...],
  "modelId": "claude-sonnet-4-6",
  "traceId": "...",
  "ragConfig": {
    "enabled": true,
    "intentClass": "carrier_intel_request",
    "namespaces": ["carrier_intel"],
    "roleScope": "driver",
    "topK": 5,
    "contextBudgetTokens": 2000,
    "filters": { "dot_number": "1234567" }
  }
}
```

When `ragConfig.enabled` is `true`, Railway runs retrieval **before** calling Claude:
1. Embed the last user message with Voyage AI voyage-3 (reuses existing embedding infrastructure)
2. Query each requested namespace with the embedding + filters
3. Score and rank: `combinedScore = 0.8 * cosineScore + 0.2 * freshnessScore`
4. Filter out any chunks with `combinedScore < 0.65`
5. Assemble within budget: fill context block up to `contextBudgetTokens`, never truncate mid-chunk
6. Format as structured `<knowledge_context>` block
7. Prepend to `systemPrompt`
8. Call Claude with augmented prompt

The response shape gains two new optional fields:
```json
{
  "type": "text",
  "text": "...",
  "retrievedChunks": [...],   // for telemetry — which chunks were injected
  "ragLatencyMs": 143         // retrieval latency separate from generation latency
}
```

### Context Injection Format

Retrieved context is injected in a clearly delimited XML block prepended to the system prompt:

```
<knowledge_context>
[CARRIER INTELLIGENCE — Werner Enterprises (DOT: 1234567)]
Source: Driver Sentiment & Enrichment | Verified: 2026-02-20 | Confidence: High

Werner Enterprises operates primarily OTR and team configurations. Driver sentiment
rates home time at 3.2/5 across 847 verified reviews. Solo OTR pay: $0.48–$0.61/mi
depending on experience and route. Top driver concern (mentioned in 41% of reviews):
actual home time frequency falls short of the stated policy. Equipment mix: Kenworth
T680 and Peterbilt 579, fleet average age 3.2 years. Orientation: Columbus, NE,
4-day program. Hiring activity: above-average for OTR over the past 30 days.

[DRIVER MARKET — OTR Home Time Expectations]
Source: Platform Aggregate (10,240 driver profiles) | Verified: 2026-02-24

OTR drivers nationally expect home 2.1 nights per week on average. 72% of OTR
drivers rank "home time as promised" as their top retention factor — ahead of pay.
Drivers who experience > 20% variance between promised and actual home time have
3× higher 90-day churn rates. Home time policy transparency is the single highest-
leverage differentiator for OTR carrier attraction.
</knowledge_context>
```

The base system prompt includes a standing instruction:
> "When `<knowledge_context>` is present, treat it as verified platform intelligence from real driver and carrier data. Reference it when answering questions about carriers, pay, or market conditions. Do not fabricate details beyond what is provided. If the context doesn't cover what was asked, say so clearly."

This instruction is part of every role's base system prompt — not injected per turn.

### Retrieval Quality Scoring

| Score Component | Weight | Source |
|-----------------|--------|--------|
| Cosine similarity | 80% | Pinecone ANN score |
| Freshness | 20% | `1 - (hours_since_ingested / ttl_hours)`, clamped 0–1 |

Chunks with `combinedScore < 0.65` are excluded. If no chunks meet this threshold, the `<knowledge_context>` block is omitted entirely and `ragConfig.noContextReason: "no_relevant_chunks"` is logged.

### `lib/retrieval.js` (Railway)

Key functions:
- `retrieveContext(ragConfig, queryText)` — orchestrates full retrieval pipeline
- `embedQuery(text)` — Voyage AI voyage-3 (reuses existing `lib/embeddings.js`)
- `queryNamespace(namespace, embedding, filters, topK)` — Pinecone REST (reuses `lib/pinecone.js`)
- `rankChunks(chunks)` — calculate combined scores, sort, filter threshold
- `assembleContextBudget(chunks, budgetTokens)` — fill budget, never truncate mid-chunk
- `formatContextBlock(chunks)` — structured XML-tagged output

### Feature Flags

Add to `src/backend/configData.js`:
```javascript
FEATURE_FLAGS: {
  // ...existing flags...
  ragEnabled: false,           // Master flag — disables RAG for all roles
  ragEnabledDriver: false,     // Per-role flags enable independent rollout
  ragEnabledRecruiter: false,
  ragEnabledAdmin: false,
  ragEnabledCarrier: false,
  intentClassificationEnabled: false,
  conversationMemoryEnabled: false
}
```

Any flag false → agent turn skips intent classification and RAG retrieval entirely, falls back to current tool-only path. No user-visible change.

### Exit Criteria — Phase 3
- [ ] `ragConfig` param accepted and processed in Railway `/v1/agent/turn`
- [ ] Context injection verified in agent responses for at least 3 carriers with enrichment data
- [ ] Retrieval latency < 200ms P95 in staging (measured as `ragLatencyMs` in response)
- [ ] `ragRetrievalLog` Airtable table receiving records for every retrieval attempt
- [ ] `combinedScore < 0.65` exclusion correctly producing no-context responses when data is absent
- [ ] Feature flags toggling RAG on/off per role without errors

---

## Phase 4 — Agent Injection Layer (All Four Roles)

**Goal:** Wire intent classification + RAG retrieval into `handleAgentTurn()` for all four roles. Deploy role-specific system prompt templates with injected context slots. Context budget management prevents overflow.

### `handleAgentTurn()` Pre-flight (agentService.jsw)

```javascript
export async function handleAgentTurn(role, userId, message, context) {
  // 1. Classify intent (parallel with history fetch, both fast)
  const [intentResult, userHistory, userProfile] = await Promise.all([
    FEATURE_FLAGS.intentClassificationEnabled
      ? intentService.classifyUserIntent(message, role, context?.recentTurns)
      : Promise.resolve(intentService.defaultIntent(role)),
    agentConversationService.getRecentContext(context?.conversationId, 5),
    fetchUserProfileSummary(role, userId)   // lightweight — cached
  ]);

  // 2. Build role-scoped system prompt with injected slots
  const basePrompt = buildBaseSystemPrompt(role, userProfile, intentResult);

  // 3. Build ragConfig from intent output (if RAG enabled for this role)
  const ragConfig = buildRagConfig(intentResult, role, context, userId);

  // 4. Prioritize tools by intent hints
  const tools = getIntentScopedTools(intentResult, role);

  // 5. Call runtime (ragConfig handled internally by Railway)
  const runtimeResult = await agentRuntimeService.callRuntimeStep({
    systemPrompt: basePrompt,
    messages: buildMessages(userHistory, message),
    tools,
    ragConfig,
    traceId: context?.traceId
  });

  // 6. Log retrieval telemetry (fire-and-forget)
  if (runtimeResult.retrievedChunks?.length > 0) {
    logRetrievalTelemetry(runtimeResult.retrievedChunks, runtimeResult.text, userId, role);
  }

  // 7. Ingest this turn to conversation memory (fire-and-forget)
  if (FEATURE_FLAGS.conversationMemoryEnabled) {
    ragIngestionService.ingestTurnMemory(userId, role, context?.conversationId, message, runtimeResult.text);
  }

  return buildAgentResponse(runtimeResult);
}
```

### Role System Prompt Templates

Each role's base system prompt has five slots:

```
[ROLE IDENTITY + CAPABILITIES]   ← Static. Defines the agent persona and scope.
[INTENT CONTEXT]                  ← Injected per turn from intentResult.
[KNOWLEDGE CONTEXT]               ← Injected per turn by Railway RAG pipeline.
[USER CONTEXT]                    ← Injected per turn from profile + history.
[TOOL GUIDANCE]                   ← Injected per turn: intent-prioritized tool list summary.
[BEHAVIORAL GUARDRAILS]           ← Static. Non-negotiable behaviors.
```

#### Driver Agent Prompt Structure

```
ROLE IDENTITY:
You are LMDR Drive — an intelligent CDL career advisor built exclusively for
professional truck drivers. You have access to verified carrier intelligence,
real driver market data, regulatory knowledge, and this driver's personal
history on the platform. You exist to help drivers find the right fit for
their lives — not just their CDL.

INTENT CONTEXT:
Query intent: {intentClass}
Confidence: {confidence}
Key entities: {entities_formatted}
Response framing: {frameHint}

KNOWLEDGE CONTEXT:
{ragContext}    ← Injected by Railway before this reaches Claude

USER CONTEXT:
Driver profile:
- CDL Class {cdl_class} | {years_experience} years experience
- Home state: {home_state} | Preferred lanes: {preferred_lanes}
- Preferences: {haul_types_formatted}, minimum ${pay_min_cpm}/mi,
  {home_time_preference}
- Recent applications: {recent_applications_summary}
- Platform history: {prior_conversation_summary}

TOOL GUIDANCE:
Priority tools for this query type: {prioritized_tools_list}
Full tool set available — use judgment on which to invoke.

BEHAVIORAL GUARDRAILS:
- Never fabricate pay figures. Use retrieved market data or acknowledge uncertainty.
- Never promise outcomes you cannot control (placement dates, hiring decisions).
- Prioritize the driver's life quality over platform metrics.
- If asked about a specific carrier you have no intelligence on, say so and offer
  to research it or connect them with a recruiter.
- Treat this driver as a professional. They have been doing this longer than most.
```

#### Recruiter Agent Prompt Structure

```
ROLE IDENTITY:
You are VelocityMatch Recruit — an AI-powered recruiting intelligence system.
You help CDL carrier recruiters find the right drivers, understand the market,
and build pipelines that convert. You have access to driver market analytics,
carrier intelligence, compliance data, and this recruiter's pipeline history.

INTENT CONTEXT:
Query intent: {intentClass}
Carrier context: {carrier_name} (DOT: {dot_number})
Key entities: {entities_formatted}

KNOWLEDGE CONTEXT:
{ragContext}

USER CONTEXT:
Recruiter: {recruiter_name} — {carrier_name}
Active openings: {open_positions_count}
Current pipeline: {pipeline_summary}
Recent placements: {recent_placements_summary}

BEHAVIORAL GUARDRAILS:
- Flag retention risk before recommending outreach.
- Provide market context for every pay and benefit comparison.
- Never share one driver's specific data with another user.
- Compliance data (CDL status, drug test, Clearinghouse) is read-only — never suggest workarounds.
- Be direct. Recruiters make decisions fast. Lead with the answer, follow with context.
```

### Context Budget Management

Total system prompt token budget: 8,000 tokens.

| Slot | Allocation | Overflow behavior |
|------|-----------|-------------------|
| Role identity + guardrails | ~500 tokens | Fixed — never truncate |
| Intent context | ~150 tokens | Fixed — always fits |
| Knowledge context (RAG) | ≤ 2,000 tokens | `assembleContextBudget()` truncates at chunk boundary |
| User context | ≤ 800 tokens | Truncate oldest history first |
| Tool guidance | ~200 tokens | Fixed — summarized list |
| Buffer for messages + tools | ~4,350 tokens | Reserved |

If RAG returns 7 chunks that total 3,200 tokens, `assembleContextBudget()` includes only the top N chunks that fit within 2,000 tokens — never truncating a chunk in the middle of a sentence.

### Tool Priority Injection

```javascript
function getIntentScopedTools(intentResult, role) {
  const allTools = ROLE_TOOLS[role];
  const prioritized = intentResult?.toolPriorityHints || [];

  // Reorder: hinted tools first, others after
  // Claude sees more relevant tools at the top of its context
  return [
    ...allTools.filter(t => prioritized.includes(t.name)),
    ...allTools.filter(t => !prioritized.includes(t.name))
  ];
}
```

This is a subtle but meaningful optimization: Claude's tool selection is influenced by position in the tool list. Putting the most intent-relevant tools first nudges the agent toward the right action without restricting it.

### Retrieval Quality Telemetry

After each agent turn with RAG context, `logRetrievalTelemetry()` records to `ragRetrievalLog`:

```json
{
  "turn_id": "recTurnXxx",
  "user_id_hash": "sha256(userId + TRACE_SALT)",
  "role": "driver",
  "intent_class": "carrier_intel_request",
  "namespaces_queried": ["carrier_intel"],
  "chunks_retrieved": 3,
  "chunks_injected": 3,
  "top_chunk_score": 0.934,
  "rag_latency_ms": 143,
  "response_contains_retrieval": true,   // keyword heuristic
  "user_continued_conversation": null,   // filled in by next turn
  "followed_by_application": null        // filled in by downstream event
}
```

`response_contains_retrieval`: simple heuristic — check if response text contains any entity from the retrieved chunks (carrier name, stat value, etc.). Not perfect, but a useful proxy for grounding rate.

### Exit Criteria — Phase 4
- [ ] All 4 agent roles running RAG-augmented turns in staging behind per-role feature flags
- [ ] System prompt templates finalized for all 4 roles with slot injection working
- [ ] Context budget manager tested: > 2,000 tokens of retrieved content truncates correctly
- [ ] Tool priority injection active and verified (hinted tools appear first in tool array)
- [ ] `ragRetrievalLog` capturing telemetry for > 100 agent turns per role across all 4 roles
- [ ] Evidence Pack verification passes for all agent-facing pages (zero P0 console errors)
- [ ] Fallback chain tested end-to-end: intent timeout → general_inquiry → RAG timeout → no context → tool-only response

---

## Phase 5 — Knowledge Freshness, Feedback Loop & Admin Analytics

**Goal:** Close the intelligence flywheel. Track what knowledge gets used, refresh stale knowledge automatically, and surface RAG quality metrics to admins.

### Knowledge Freshness System

Every document in `ragDocuments` Airtable table has:
- `last_ingested_at` — timestamp of last Pinecone upsert
- `source_updated_at` — timestamp of source record's last update
- `ttl_hours` — per-namespace TTL (from namespace config)
- `freshness_status` — `fresh` | `stale` | `expired`
- `ingestion_failures` — count of consecutive failures (dead-letter after 3)

`freshness_status` transitions:
- `fresh`: `hours_since_ingested < ttl_hours * 0.8`
- `stale`: `ttl_hours * 0.8 ≤ hours_since_ingested < ttl_hours`
- `expired`: `hours_since_ingested ≥ ttl_hours`

**`src/backend/ragFreshnessJob.jsw`** — runs every 30 minutes:
```javascript
export async function runRagFreshnessCheck() {
  // Find stale and expired docs, batch re-ingest
  const toReingest = await dataAccess.queryRecords('ragDocuments', {
    filters: { freshness_status: ['stale', 'expired'] },
    limit: 100, suppressAuth: true
  });

  const chunks = chunkArray(toReingest, 10);
  for (const chunk of chunks) {
    await Promise.all(chunk.map(doc => ragIngestionService.reingestDocument(doc)));
    await new Promise(r => setTimeout(r, 200)); // 5 req/sec Airtable rate
  }
}
```

Add to `src/backend/jobs.config`:
```
runRagFreshnessCheck  →  every 30 minutes
```

### Self-Improving Retrieval: The Feedback Loop

The flywheel turns on signal. Three signal types:

**Signal 1 — Citation Rate** (measured per turn)
Does the response text reference content from the retrieved chunks? Simple entity extraction from chunks + substring scan of response. Proxy, not perfect, but trending in aggregate is meaningful.

**Signal 2 — Conversation Continuation** (measured per turn + next turn)
Did the user send another message after this response? Continuation is a positive signal — it means the response engaged them enough to keep the conversation going. Abandonment after RAG context is a negative signal about relevance.

**Signal 3 — Downstream Conversion** (measured asynchronously)
Did this conversation precede a driver submitting an interest or a recruiter initiating contact? This is the highest-quality signal — it means the intelligence layer contributed to an actual outcome.

All three signals are stored on `ragRetrievalLog` records and rolled up weekly into `ragAnalytics`.

### Admin Analytics Dashboard Extension

Add a RAG Intelligence panel to `ADMIN_OBSERVABILITY.html`:

**Metrics cards:**
- Retrieval volume (7-day trend, by namespace)
- Average retrieval latency (P50 / P95)
- Citation rate trend (% of RAG-augmented responses that reference retrieved context)
- Freshness distribution (% fresh / stale / expired by namespace — pie chart)
- Intent classification accuracy trend (using human-verified sample)

**Tables:**
- Top retrieved documents (most frequently surfaced — what knowledge is most used?)
- Stale documents requiring manual refresh (platform_ops, industry_regs)
- Recent retrieval failures (circuit opens, timeout events)

**Admin actions (new):**
- `Force re-ingest namespace` — triggers immediate re-ingestion for a specific namespace
- `Force re-ingest carrier` — re-ingests one carrier's intelligence (useful after manual enrichment)
- `Debug retrieval` — admin-only mode: enter a query, see what chunks would be retrieved + scores

### Taxonomy Refinement Workflow

Every 2 weeks, run `intentClassificationLog` analysis:
- Group by role + intentClass
- Calculate average confidence per class
- Flag low-confidence classes for few-shot example review
- If a class has average confidence < 0.70 for > 20% of messages, add more few-shot examples

This is intentionally lightweight — no ML training, no model fine-tuning. Just prompt engineering informed by real data.

### Exit Criteria — Phase 5
- [x] Freshness monitor running every 30 minutes, re-ingesting stale documents
- [ ] < 5% stale documents per namespace at steady state
- [x] RAG analytics panel live in admin observability with all 5 metric cards
- [x] Signal capture for all 3 feedback loop signals (citation, continuation, conversion)
- [x] Weekly `ragAnalytics` rollup job running and producing records
- [ ] At least 2 weeks of telemetry analyzed — citation rate and continuation rate baselined
- [x] Intelligence flywheel documented as a named platform metric in the admin dashboard

---

## Cross-Phase: Observability & Security

### Trace Correlation

Every RAG retrieval gets a `requestId` correlated to the agent turn's `traceId`. For any agent response, admins can trace:
- What message triggered it
- What intent was classified
- What knowledge was retrieved (chunk IDs, scores)
- What the agent actually said

This is full auditability for the AI layer — essential for trust in a regulated industry.

### SLOs

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Intent classification P95 latency | < 150ms | > 300ms |
| RAG retrieval P95 latency | < 200ms | > 400ms |
| Namespace availability | > 99.5% | < 99% |
| Knowledge freshness (% stale) | < 5% per namespace | > 15% |
| Intent classification accuracy | > 85% | < 75% |

### Security Controls

- **`conversation_memory` namespace**: `user_id` metadata filter is **required** on every query. A missing `user_id` filter must be treated as a programming error, not a graceful fallback.
- **`carrier_intel` namespace**: Driver-specific data (individual profile fields, DOT test status, personal history) is **never embedded**. Only aggregated enrichment data and FMCSA public records.
- **`driver_market` namespace**: Produced by aggregation only. No individual record IDs, names, CDL numbers, or locating information in any chunk.
- **PII scrubbing in ingestion**: All ingestion paths run text through the same PII scrubber used in LangSmith trace ingest (phone → `[PHONE]`, email → `[EMAIL]`, SSN pattern → `[SSN]`) before embedding.

### Rollback

Each feature flag (`ragEnabled`, `ragEnabledDriver`, `ragEnabledRecruiter`, `ragEnabledAdmin`, `ragEnabledCarrier`, `intentClassificationEnabled`, `conversationMemoryEnabled`) disables the corresponding component in < 30 seconds, no deploy required. Agents fall back to current tool-only reasoning path with zero user-visible degradation.

---

## Repository Changes Summary

### Railway Microservice (`services/ai-intelligence/`)

New files:
```
routes/intent.js              POST /v1/intent/classify
routes/rag.js                 POST /v1/rag/retrieve, POST /v1/rag/ingest
lib/intentClassifier.js       Groq-based intent classification with role configs
lib/retrieval.js              Core retrieval pipeline (embed → query → rank → assemble)
lib/knowledgeCorpus.js        Namespace configs, chunk builders, PII scrubber
lib/contextBudget.js          Token budget management and context block formatting
```

Modified files:
```
routes/agent.js               Add ragConfig param handling before Claude call
routes/health.js              Add intent + RAG namespace health checks
server.js                     Wire new routes
```

### Wix Backend (`src/backend/`)

New files:
```
intentService.jsw             classifyUserIntent() + fallback
ragService.jsw                retrieveContext() with circuit breaker
ragIngestionService.jsw       Scheduled ingestion + ingestTurnMemory()
ragFreshnessJob.jsw           30-minute freshness monitor
```

Modified files:
```
agentService.jsw              handleAgentTurn() pre-flight: intent + ragConfig + telemetry
configData.js                 ragEnabled flags + new collection keys
jobs.config                   4 new scheduled jobs
```

### New Airtable Collections

| Config Key | Table | Purpose |
|------------|-------|---------|
| `ragDocuments` | `v2_RAG Documents` | Registry of all indexed documents with freshness tracking |
| `ragRetrievalLog` | `v2_RAG Retrieval Log` | Per-turn retrieval telemetry with quality signals |
| `ragAnalytics` | `v2_RAG Analytics` | Weekly rollups of RAG performance metrics |
| `intentClassificationLog` | `v2_Intent Classification Log` | Per-turn intent classifications for accuracy monitoring |

---

## Definition of Done (Track)

The track is complete only when all of the following are true:

1. All 6 knowledge namespaces populated with seed data and ingestion jobs running on schedule.
2. Intent classifier live on Railway, P95 < 150ms, > 85% accuracy on labeled test set.
3. RAG retrieval integrated into `/v1/agent/turn` via `ragConfig`, retrieval latency < 200ms P95.
4. All 4 agent roles running RAG-augmented turns in production behind per-role feature flags.
5. Verified fallback chain: intent timeout → general_inquiry → RAG timeout → no context → tool-only.
6. Knowledge freshness monitor running, maintaining < 5% stale documents per namespace.
7. RAG analytics section live in admin observability with citation rate and freshness visible.
8. `ragRetrievalLog` has > 200 entries with quality telemetry (citation, continuation signals).
9. Evidence Pack verification passes for all agent-facing pages after RAG enablement.
10. Intelligence flywheel metrics documented and baselined: citation rate, continuation rate, downstream conversion rate.
