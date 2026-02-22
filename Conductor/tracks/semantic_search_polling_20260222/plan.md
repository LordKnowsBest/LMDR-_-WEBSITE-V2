# Plan - Async Polling for Semantic Search via External Microservice

**Created:** 2026-02-22  
**Status:** PLANNED  
**Priority:** High  

---

## Why This Track Exists

Wix Velo imposes a strict 14-second timeout on any call made from the frontend to backend `.jsw` modules. For deep semantic searches requiring Voyage AI embeddings, Pinecone vector distance calculations, and potential Claude synthesis routing, executions often exceed this threshold, resulting in frustrating "timeout" errors for recruiters.

To bypass this platform constraint without leaving the Wix ecosystem, we are migrating the heavy real-time search logic into an asynchronous polling architecture orchestrated between Wix and the `ai-intelligence` Railway microservice.

---

## Architecture Direction

### The Async Polling Workflow

1. **The Request:** The Recruiter enters a complex natural language query (e.g., "Looking for hazmat drivers in Texas with clean MVRs").
2. **The Fast Handoff (Frontend -> Wix -> Railway):** The Wix frontend calls `searchSemanticAsync` in a `.jsw` file. Velo creates a Job Record with a status of `PROCESSING` and a unique `jobId`, instantly fires a `fetch()` request (without awaiting the response) to the Railway microservice, and returns the `jobId` to the frontend. (Execution time: ~500ms).
3. **The Heavy Lifting (Railway + Pinecone + Voyage):** The Railway Node.js service, unbound by 14s limits, calculates embeddings with Voyage AI, queries Pinecone, formats the results, and performs any secondary evaluation. (Execution time: 5s - 30s).
4. **The Callback (Railway -> Wix):** Once Railway finishes, it makes a POST request to a Wix HTTP Function (`_functions/completeSearch`), which updates the Job Record with the results and sets the status to `COMPLETE`.
5. **The Polling Loop (Frontend -> Wix):** Meanwhile, the frontend operates on a `setInterval` loop, pinging the backend every 3 seconds: `checkSearchStatus(jobId)`. As soon as it returns `COMPLETE`, the UI hydration happens. 

---

## Phase 1 - Backend Search Job Kickoff & Caching

**Goal:** Establish the Job ID creation and asynchronous trigger.

### Deliverables
- Create a fast Temporary Memory or DB Collection (`SearchJobs`) with fields: `jobId`, `status`, `results`, `createdAt`.
- Write `triggerSemanticSearch(query, filters)` locally on Wix:
  - Generates `jobId`.
  - Sets state to `PROCESSING`.
  - Fires generic `fetch` to `services/ai-intelligence/routes/semantic.js`.
  - Returns `jobId` to UI.

---

## Phase 2 - Railway Callback & Cache Hydration

**Goal:** Allow Railway to securely push results back to Wix.

### Deliverables
- Define a Wix HTTP Function `post_completeSearch` authenticated via shared core secret.
- Refactor POST `/v1/search/drivers` and `POST /v1/search/carriers` on the Railway microservice to accept an optional `callbackUrl` and `jobId`.
- Modify the microservice to push the calculated Vector results back via `fetch(callbackUrl)` rather than solely holding the HTTP connection open.

---

## Phase 3 - Frontend Async Polling Loop

**Goal:** Upgrade the UI to handle graceful polling without timeout anxieties.

### Deliverables
- Implement `startPolling(jobId)` in the `.html` page bridge code.
- Display a rich, engaging loading state ("Analyzing semantic meaning...", "Scanning vector database...", "Ranking matches...").
- Upon a `COMPLETE` ping, seamlessly transition the UI to display the hydrated items.
- Ensure proper cleanup (`clearInterval`) upon success, failure, or user navigation.

---

## Definition of Done
1. Complex semantic searches taking >14 seconds no longer timeout on the frontend.
2. The UI handles the polling gracefully with accurate state representation.
3. The temporary search cache successfully hydrates and purges old jobs via TTL.
