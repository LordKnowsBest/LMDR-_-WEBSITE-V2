# Risk Register — RecruiterOS Intelligence Convergence

**Track:** `recruiter_os_convergence_20260228`

---

## Risk Matrix

| ID | Risk | Likelihood | Impact | Severity | Mitigation | Owner |
|----|------|-----------|--------|----------|-----------|-------|
| R1 | Recruiter Console page code grows too large | High | Medium | Medium | Group new handlers under clearly-marked `// === WAVE N ADDITIONS ===` comments; extract to sub-module if >3,500 lines | J2, J3, J4 |
| R2 | Proactive AI cold-start latency | Medium | Low | Low | 2s delay + 8s timeout; insight section hidden until response; graceful no-op on timeout | J2 (Wave 4) |
| R3 | lmdr-memory Pinecone namespace empty for new recruiter | High | Low | Low | `agentMemoryLoaded` with `hasMemory: false` hides section gracefully; no error state shown | J1 (Wave 4) |
| R4 | NBA chip state stale mid-session | Medium | Low | Low | Re-evaluate chips on every view change via `ROS.views.onViewChange` hook | J5 (Wave 3) |
| R5 | `marketSignalsService` Railway call times out | Low | Medium | Low | Cache result for 1hr in page code; if cache miss and timeout, hide ticker silently | J7 (Wave 3) |
| R6 | View snapshot pollutes agent context (too much data) | Medium | Medium | Medium | Snapshots expose max 5 fields only; no arrays or nested objects in snapshot | J6 (Wave 3) |
| R7 | Backend service not exported / wrong function signature | Medium | High | High | Pre-start checklist confirms all service exports before Wave 1 begins | Senior reviewer |
| R8 | CDN cache serves stale JS after push | High | High | Critical | Run CDN purge script after every wave merge; pinned commit hashes for stable modules | All devs |
| R9 | Gate 1 fails due to missing backend data in test env | Medium | Medium | Medium | Gate review uses production data (recruiter account with real carriers); not staging | Senior reviewer |
| R10 | `ros-contract.js` validation throws in production | Low | High | High | Validation only active in dev mode (`window.__ROS_DEV__`); never throws in production | J1 (Wave 1) |

---

## Monitoring Plan

- **Wave 1:** J1 confirms `ros-contract.js` loads without errors in browser console before signaling Wave 2 ready.
- **Wave 2:** Each J updates `bridge_inventory.md` `wired` column after their tools pass manual smoke test.
- **Gate 1:** Senior reviewer uses a real recruiter account to test all 7 views. Signs off in `progress.md`.
- **Wave 3:** J5/J6/J7 each tag their commits; senior confirms no regressions on core views (search, pipeline, messages).
- **Gate 2:** Senior uses browser to verify NBA chips, market ticker, and agent context. Signs off in `progress.md`.
- **Wave 4:** J1 confirms memory section renders in chat for a recruiter with prior session history. J2 confirms insights appear within 4s.
- **Wave 5:** Evidence Pack run ID attached to `metadata.json`. `quality_gate.json` must show `pass: true`.
