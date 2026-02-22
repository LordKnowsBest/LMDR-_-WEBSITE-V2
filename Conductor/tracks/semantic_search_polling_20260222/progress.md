# Progress - Async Polling for Semantic Search

### Phase 1: Backend Search Job Kickoff & Caching
- [ ] Create `SearchJobs` temporary collection/cache.
- [ ] Implement Velo `.jsw` async trigger function to return `jobId`.

### Phase 2: Railway Callback & Cache Hydration
- [ ] Build `post_completeSearch` HTTP endpoint in Wix.
- [ ] Update `ai-intelligence` semantic routes (Pinecone/Voyage AI) to respect and fire callbacks.

### Phase 3: Frontend Async Polling Loop
- [ ] Implement `setInterval` polling in recruiter search logic.
- [ ] Design and implement multi-stage loading UI to improve perceived latency.

### Deployment & Verification
- [ ] End-to-end integration test with artificial 20-second delay.
