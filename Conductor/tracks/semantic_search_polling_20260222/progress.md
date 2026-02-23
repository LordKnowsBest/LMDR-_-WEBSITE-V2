# Progress - Async Polling for Semantic Search + Option B Carrier Expansion

**Updated:** 2026-02-23

---

## Infrastructure Already in Place (pre-track)

- [x] `services/ai-intelligence/scripts/local-mass-embed.js` — local runner that embeds FMCSA carriers as `dot:{number}` vectors into Pinecone with enriched metadata (legal name, state, fleet size, safety rating, operation type, driver count)
- [x] `services/ai-intelligence/jobs/fmcsa-mass-embed.js` — Railway daily job that backfills Airtable carriers (`recXXX`) into Pinecone
- [x] Pinecone `lmdr-carriers` index populated with both `rec****` and `dot:****` vectors
- [x] Railway `/v1/embed/carrier` endpoint working (Voyage embed + Pinecone upsert)

---

## Phase 1: Backend Search Job Kickoff & Caching

- [ ] Create `v2_Search Jobs` Airtable collection (or Wix in-memory cache) with fields: `jobId`, `status`, `results`, `createdAt`
- [ ] Write `triggerSemanticSearch(driverProfile, filters)` in `.jsw` — generates jobId, writes PROCESSING, fires non-awaited fetch to Railway, returns jobId
- [ ] Write `checkSearchStatus(jobId)` in `.jsw` — reads job record, returns `{ status, results }`

---

## Phase 2: Railway Search Pipeline & Callback (Option B core)

- [ ] Build `POST /v1/search/carriers-async` on Railway:
  - [ ] Embed driver profile via Voyage AI
  - [ ] Query Pinecone `lmdr-carriers` top-75 with `includeMetadata: true`
  - [ ] Split results: `rec****` (Airtable-backed) vs `dot:****` (FMCSA-only)
  - [ ] Batch-fetch Airtable fields for `rec****` carriers and merge with Pinecone metadata
  - [ ] Use Pinecone metadata directly for `dot:****` carriers (no Airtable lookup needed)
  - [ ] Merge, score, and rank both tiers
  - [ ] POST results to `callbackUrl` with `{ jobId, status: 'COMPLETE', results }`
- [ ] Build Wix HTTP Function `post_completeSearch`:
  - [ ] Validate `x-lmdr-internal-key`
  - [ ] Find `SearchJobs` record by `jobId`
  - [ ] Write results JSON, set status `COMPLETE`
- [ ] Verify `local-mass-embed.js` stores all required metadata fields for FMCSA-only enrichment

---

## Phase 3: Frontend Polling Loop & Two-Tier Rendering

- [ ] Update `ai-matching-logic.js` — call `triggerSemanticSearch()` on submit, receive `jobId`, start `setInterval` polling every 3s, clear on `COMPLETE` or 90s timeout
- [ ] Add multi-stage loading states to `ai-matching-render.js`:
  - "Embedding your driver profile..."
  - "Scanning 600,000+ carriers..."
  - "Ranking semantic matches..."
  - "Enriching top results..."
- [ ] Update `ai-matching-renderers.js` for two card tiers:
  - [ ] Platform carrier card (`source !== 'fmcsa-mass-embed'`) — existing full card
  - [ ] FMCSA-only carrier card (`source === 'fmcsa-mass-embed'`) — streamlined card with "Limited data available" badge or "Claim this carrier profile" CTA

---

## Deployment & Verification

- [ ] End-to-end test with artificial 20-second Railway delay to verify polling loop
- [ ] Confirm `dot:****` carriers surface in driver match results
- [ ] Confirm `rec****` carriers retain full data richness
- [ ] Verify `SearchJobs` TTL purges stale records
- [ ] 0 timeout errors on complex semantic queries
