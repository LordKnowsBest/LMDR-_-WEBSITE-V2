# Progress - Async Polling for Semantic Search + Option B Carrier Expansion

**Updated:** 2026-02-28

---

## Infrastructure Already in Place (pre-track)

- [x] `services/ai-intelligence/scripts/local-mass-embed.js` — local runner that embeds FMCSA carriers as `dot:{number}` vectors into Pinecone with enriched metadata (legal name, state, fleet size, safety rating, operation type, driver count)
- [x] `services/ai-intelligence/jobs/fmcsa-mass-embed.js` — Railway daily job that backfills Airtable carriers (`recXXX`) into Pinecone
- [x] Pinecone `lmdr-carriers` index populated with both `rec****` and `dot:****` vectors
- [x] Railway `/v1/embed/carrier` endpoint working (Voyage embed + Pinecone upsert)

---

## Phase 1: Backend Search Job Kickoff & Caching ✅ COMPLETE

- [x] Create `v2_Search Jobs` Airtable table — fields: `job_id`, `status` (PROCESSING/COMPLETE/FAILED), `started_at`, `completed_at`, `driver_prefs`, `results`, `error`, `total_found`, `total_scored`, `elapsed_ms`, `is_premium`
- [x] `src/backend/configData.js` — added `searchJobs` in DATA_SOURCES, WIX_COLLECTION_NAMES, AIRTABLE_TABLE_NAMES
- [x] `src/backend/asyncSearchService.jsw` — `triggerSemanticSearch(driverPrefs, isPremiumUser)`: generates jobId, writes PROCESSING to Airtable, fires non-awaited Railway call, returns `{ jobId }` in ~500ms
- [x] `src/backend/asyncSearchService.jsw` — `checkSearchStatus(jobId)`: reads job record, 90s timeout guard marks stale PROCESSING jobs as FAILED, returns `{ status, results? }`
- [x] `src/backend/searchJobService.jsw` — CRUD service for recruiter-side search jobs (createSearchJob, getSearchJobStatus, completeSearchJob, failSearchJob, cleanupExpiredJobs)
- [x] `src/backend/semanticSearchService.jsw` — added `triggerAsyncSearch()` fire-and-forget to Railway
- [x] `src/backend/driverMatching.jsw` — added `initiateAsyncDriverSearch()` + `checkAsyncSearchStatus()`
- [x] `asyncPollingEnabled: false` feature flag added to FEATURE_FLAGS

---

## Phase 2: Railway Search Pipeline & Callback (Option B core) ✅ COMPLETE

- [x] `POST /v1/search/carriers-async` on Railway (`services/ai-intelligence/routes/semantic.js`):
  - [x] Responds 202 immediately, runs `_runAsyncCarrierSearch` in background
  - [x] Embeds driver profile via Voyage AI (`voyage-3`)
  - [x] Queries Pinecone `lmdr-carriers` top-75 with `includeMetadata: true`
  - [x] Splits results: `rec****` (Airtable-backed) vs `dot:****` (FMCSA-only)
  - [x] Batch-fetches Airtable fields for `rec****` carriers via `RECORD_ID()` formula filter
  - [x] Uses Pinecone metadata directly for `dot:****` carriers (no Airtable/FMCSA call needed)
  - [x] Merges, scores, and ranks both tiers — `fmcsaOnly: true` flag on FMCSA-only carriers
  - [x] POSTs results to `callbackUrl` with `{ jobId, status: 'COMPLETE', results, totalFound, totalScored, elapsedMs }`
- [x] `POST /v1/search/drivers/async` on Railway — recruiter-side async driver search (returns 202, embeds + Pinecone in background, POSTs callback)
- [x] `post_completeSearch` Wix HTTP Function (`src/backend/http-functions.js`):
  - [x] Validates `x-lmdr-internal-key`
  - [x] Finds `SearchJobs` record by `jobId`
  - [x] Writes results JSON, sets status `COMPLETE` or `FAILED`
- [x] `local-mass-embed.js` stores all required metadata for FMCSA-only enrichment (legal_name, state, fleet_size, safety_rating, carrier_operation, driver_count)

---

## Phase 3: Frontend Polling Loop & Two-Tier Rendering

### Driver Side (AI Matching) ✅ COMPLETE
- [x] `src/pages/AI - MATCHING.rof4w.js` — async `findMatches` path: calls `triggerSemanticSearch()`, sends `searchJobStarted` to HTML, handles `pollSearchJob` (calls `checkSearchStatus` every 3s from HTML), delivers results via `_deliverAsyncResults` on COMPLETE
- [x] `src/pages/AI - MATCHING.rof4w.js` — fallback to sync `findMatchingCarriers` if async trigger fails (no regression)
- [x] `src/public/driver/js/ai-matching-bridge.js` — added `searchJobStarted`, `searchJobStatus` (inbound) and `pollSearchJob` (outbound) to MESSAGE_REGISTRY
- [x] `src/public/driver/AI_MATCHING.html` — added `searchJobStarted` and `searchJobStatus` switch cases
- [x] `src/public/driver/js/ai-matching-results.js` — polling loop (`startAsyncPolling` / `stopAsyncPolling`), 3s interval, 90s max timeout, `window._handleSearchJobStarted`, `window._handleSearchJobStatus`
- [x] Multi-stage async loading states:
  - "Embedding your driver profile..."
  - "Scanning 600,000+ carriers..."
  - "Ranking semantic matches..."
  - "Enriching top results..."
- [x] **Perplexity enrichment on Railway** — `services/ai-intelligence/lib/perplexity.js`
  - `sonar-pro` model, targets TheTruckersReport / CDLLife / TruckingTruth / Indeed / Glassdoor
  - Runs for ALL top results (both `rec****` and `dot:****` tiers) in parallel before callback fires
  - Output: `ai_summary`, `driver_sentiment`, `sentiment_pros/cons`, `pay_estimate`, `benefits`, `hiring_status`, `data_confidence`, `sources_found` — matches `aiEnrichment.jsw` shape
  - Graceful fallback if key missing or request fails
- [x] `_deliverAsyncResults` (Wix page code) updated:
  - Pre-enriched carriers (`needsEnrichment=false, enrichment!=null`) → `enrichmentUpdate` fires immediately on first paint, no round-trip
  - Only falls back to Wix-side Groq enrichment for carriers Railway didn't cover
- [x] `services/ai-intelligence/.env` — `PERPLEXITY_API_KEY` placeholder added
  - **Action required:** Add real key to Railway dashboard → Environment Variables
- [ ] `ai-matching-renderers.js` — FMCSA-only explicit card style (optional polish):
  - Platform carrier: existing full card
  - FMCSA-only: streamlined card with `sources_found` citation chips (Perplexity citations)

### Recruiter Side (ROS Search) ✅ COMPLETE
- [x] `src/pages/Recruiter Console.zriuj.js` — feature flag branch in `handleSearchDrivers`, `searchJobStarted`/`searchStatusUpdate` messages, `handleCheckSearchStatus`, fallback to sync on async failure
- [x] `src/public/recruiter/os/js/views/ros-view-search.js` — exponential backoff polling (2s→8s, 60s cap), multi-stage loading animation (4 stages), race protection via `activeJobId`, retry UI, cleanup on unmount

---

## Deployment & Verification

- [ ] End-to-end test with artificial 20-second Railway delay to verify polling loop
- [ ] Confirm `dot:****` carriers surface in driver match results
- [ ] Confirm `rec****` carriers retain full data richness
- [ ] Verify `SearchJobs` TTL purges stale records
- [ ] 0 timeout errors on complex semantic queries
- [ ] Flip `asyncPollingEnabled: true` and verify recruiter-side async flow
- [ ] Verify recruiter sync path unchanged when flag is `false`
