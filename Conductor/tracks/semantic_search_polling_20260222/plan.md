# Plan - Async Polling for Semantic Search via External Microservice

**Created:** 2026-02-22
**Updated:** 2026-02-23
**Status:** PLANNED
**Priority:** High

---

## Why This Track Exists

Wix Velo imposes a strict 14-second timeout on any call made from the frontend to backend `.jsw` modules. For deep semantic searches requiring Voyage AI embeddings, Pinecone vector distance calculations, and potential Claude synthesis routing, executions often exceed this threshold, resulting in frustrating "timeout" errors for recruiters.

To bypass this platform constraint without leaving the Wix ecosystem, we are migrating the heavy real-time search logic into an asynchronous polling architecture orchestrated between Wix and the `ai-intelligence` Railway microservice.

---

## Extended Scope: Option B — Full FMCSA Universe Carrier Search

**Updated 2026-02-23** — This track now also implements **Option B carrier expansion**, which is the primary business reason for moving search fully into Railway.

### The Problem with the Current Architecture

Today, `carrierMatching.jsw` treats **Airtable as the search space**. Pinecone is only used to boost the score of carriers that already exist in Airtable. This means:

- Drivers only see **~23,000 carriers** (our Airtable dataset).
- **~600,000+ active FMCSA carriers** are completely invisible — even if they're a better match.
- `dot:{number}` Pinecone vectors (ingested via `scripts/local-mass-embed.js`) are found by Pinecone but never surfaced because there is no corresponding Airtable record to attach the score to.

### What Option B Enables

By moving the full search pipeline into Railway, the search space becomes **Pinecone itself** — not Airtable. This exposes the entire FMCSA carrier universe to drivers, with enrichment sourced from:

1. **Pinecone metadata** — pre-enriched at embed time by `local-mass-embed.js` (legal name, state, fleet size, safety rating, operation type, driver count).
2. **Airtable overlay** — if the carrier also exists in Airtable (i.e., a `recXXX` vector), deeper platform data is merged in (pay, turnover, reviews, AI summaries).
3. **FMCSA live call** — only possible if the search is triggered from a local/residential context. Railway's IP is blocked by FMCSA. For Railway-side enrichment, Pinecone metadata is authoritative.

### Two-Tier Carrier Result Model

| Tier | Vector ID | Source of display data | Data richness |
|------|-----------|----------------------|---------------|
| **Platform carrier** | `recXXX` | Airtable fields + Pinecone metadata | Full: pay, turnover, reviews, AI summary, FMCSA |
| **FMCSA-only carrier** | `dot:{number}` | Pinecone metadata only | Partial: legal name, state, fleet, safety rating, operation type |

The HTML rendering layer must gracefully handle both tiers — platform carriers get the full card, FMCSA-only carriers get a streamlined card with a "Claim this profile" CTA (or equivalent).

### Why Railway is Required for This

The Wix 14s timeout makes it impossible to:
- Embed a driver query via Voyage AI
- Query Pinecone for 50–100 matches across 600k+ vectors
- Split results into `rec` vs `dot` buckets
- Merge Airtable data for `rec` carriers
- Run AI match explanation generation
- Return a ranked, enriched result set

All of this happens in Railway, off the Wix clock.

---

## Architecture Direction

### The Async Polling Workflow

1. **The Request:** A driver (or recruiter) initiates a semantic search from the AI Matching page.
2. **The Fast Handoff (Frontend → Wix → Railway):** The Wix page code calls `triggerSemanticSearch(driverProfile, filters)` in a `.jsw` file. Velo creates a `SearchJobs` record with status `PROCESSING` and a unique `jobId`, instantly fires a `fetch()` to Railway (without awaiting), and returns the `jobId` to the HTML page. (Execution time: ~500ms — well under the 14s Velo limit).
3. **The Heavy Lifting (Railway — no time limit):**
   - Embeds the driver query via Voyage AI.
   - Queries Pinecone `lmdr-carriers` for top 50–100 matches.
   - Splits results: `rec****` vectors (Airtable-backed) vs `dot:****` vectors (FMCSA-only).
   - For `rec****` carriers: fetches full Airtable fields and merges with Pinecone metadata.
   - For `dot:****` carriers: uses Pinecone metadata directly (pre-enriched at embed time).
   - Runs match scoring and ranking across both tiers.
   - Optionally generates AI match explanations for top results.
   - Execution time: 5–30 seconds depending on result depth.
4. **The Callback (Railway → Wix):** Railway POSTs the complete ranked result set to the Wix HTTP Function `_functions/completeSearch` with the `jobId`, updating the `SearchJobs` record to `COMPLETE`.
5. **The Polling Loop (Frontend → Wix):** The HTML page polls `checkSearchStatus(jobId)` every 3 seconds. On `COMPLETE`, the full result set hydrates the UI.

---

## Phase 1 — Backend Search Job Kickoff & Caching

**Goal:** Establish the Job ID creation and asynchronous trigger.

### Deliverables
- Create Airtable collection `v2_Search Jobs` (or use Wix in-memory cache) with fields: `jobId`, `status` (`PROCESSING`/`COMPLETE`/`FAILED`), `results` (JSON blob), `createdAt`, `ttl`.
- Write `triggerSemanticSearch(driverProfile, filters)` in a `.jsw` backend module:
  - Generates `jobId` (UUID).
  - Writes `{ jobId, status: 'PROCESSING' }` to cache.
  - Fires `fetch()` to Railway `/v1/search/carriers-async` with `{ jobId, driverProfile, filters, callbackUrl }` — **not awaited**.
  - Returns `jobId` to page code immediately.
- Write `checkSearchStatus(jobId)` in the same `.jsw`:
  - Reads job record from cache.
  - Returns `{ status, results }`.

---

## Phase 2 — Railway Search Pipeline & Callback

**Goal:** Build the full Option B search pipeline in Railway and push results back to Wix.

### Deliverables

#### New Railway route: `POST /v1/search/carriers-async`
Accepts: `{ jobId, driverProfile, filters, callbackUrl }`

Pipeline:
1. Embed `driverProfile` text via Voyage AI → 1024-dim vector.
2. Query Pinecone `lmdr-carriers` index (top 75, `includeMetadata: true`).
3. Split matches into two buckets:
   - `recMatches` — vector IDs starting with `rec`
   - `dotMatches` — vector IDs starting with `dot:`
4. **Enrich `recMatches`**: batch-fetch from Airtable `Carriers (Master)` by record ID. Merge Airtable fields on top of Pinecone metadata.
5. **Enrich `dotMatches`**: use Pinecone metadata directly — `legal_name`, `state`, `fleet_size`, `safety_rating`, `operation_type`, `driver_count`, `dot_number` are all stored at embed time by `local-mass-embed.js`.
6. Merge both enriched sets, apply scoring, sort by match score descending.
7. POST to `callbackUrl` with `{ jobId, status: 'COMPLETE', results: [...] }`.

#### Wix HTTP Function: `post_completeSearch`
- Validates `x-lmdr-internal-key` header.
- Finds `SearchJobs` record by `jobId`.
- Writes `results` JSON and sets `status: 'COMPLETE'`.

#### Update `local-mass-embed.js` metadata schema
Ensure every embed stores the full set of fields Railway needs for FMCSA-only enrichment:
```
legal_name, dot_number, operation_type, state, city,
fleet_size, driver_count, safety_rating, source: 'fmcsa-mass-embed'
```
(Most of these are already stored — verify completeness.)

---

## Phase 3 — Frontend Async Polling Loop & Two-Tier Rendering

**Goal:** Upgrade the AI Matching HTML page to handle async results and render both carrier tiers.

### Deliverables

#### Polling logic (`ai-matching-logic.js`)
- On search submit: call `triggerSemanticSearch()` → receive `jobId`.
- Start `setInterval` (3s) calling `checkSearchStatus(jobId)`.
- On `COMPLETE`: clear interval → pass results to renderer.
- On `FAILED` or timeout (90s): clear interval → show error state.

#### Loading state (`ai-matching-render.js`)
Cycle through engaging loading messages:
- "Embedding your driver profile..."
- "Scanning 600,000+ carriers..."
- "Ranking semantic matches..."
- "Enriching top results..."

#### Two-tier result card rendering
- **Platform carrier** (`source !== 'fmcsa-mass-embed'`): full existing card (pay, turnover, reviews, AI summary).
- **FMCSA-only carrier** (`source === 'fmcsa-mass-embed'`): streamlined card showing legal name, state, fleet size, safety rating, operation type. Include a "Limited data available" badge or "Claim this carrier profile" CTA to prompt the carrier to join the platform.

---

## Definition of Done

1. Complex semantic searches taking >14 seconds no longer timeout on the frontend.
2. Drivers see results from the **full FMCSA carrier universe** (~600k+ carriers), not just the ~23k in Airtable.
3. `dot:{number}` Pinecone vectors surface as real match results with pre-enriched metadata.
4. Platform carriers (`recXXX`) continue to display their full data richness.
5. The UI handles the polling loop gracefully with multi-stage loading states.
6. The `SearchJobs` cache purges stale jobs via TTL (suggest 10 minutes).
7. Railway returns results within 30 seconds for a standard 75-match query.

---

## Dependencies

- `ai_intelligence_layer_20260219` — Railway microservice must be running with Voyage + Pinecone wired.
- `local-mass-embed.js` running regularly to populate `dot:{number}` vectors (the larger the corpus, the better the Option B value).
- `fmcsa-mass-embed` Railway job running daily to keep Airtable `recXXX` vectors current.

---

## Key Constraint: Railway IP Blocked by FMCSA

Railway's cloud IP range is blocked by the FMCSA QC API (HTTP 403 for all requests). **Railway cannot call FMCSA live during search.** This is why Pinecone metadata is the enrichment source for FMCSA-only carriers — the data is captured at embed time by `local-mass-embed.js` running on a residential IP, then stored in the Pinecone vector. Railway reads it back at query time with no FMCSA call needed.
