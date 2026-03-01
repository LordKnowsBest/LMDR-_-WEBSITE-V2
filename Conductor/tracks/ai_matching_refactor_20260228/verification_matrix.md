# Verification Matrix - AI Matching Surface Refactor

## Automated Verification

| Area | Verification |
|------|--------------|
| Bridge contract | Message names, envelope schema, invalid message rejection |
| Page readiness | HTML-first and page-first initialization order |
| Guest flow | Search request, results render, upsell state |
| Logged-in flow | Profile bootstrap, saved carriers, mutual interest hydration |
| Async search | Polling start, processing, complete, timeout, failure |
| Sync fallback | Fallback trigger and compatible `matchResults` payload |
| Enrichment | Auto enrichment, retry enrichment, error fallback |
| Interest | Success path, duplicate path, UI badge/button update |
| Application | Submit success, duplicate submit, validation error |
| OCR | Extraction success, extraction failure, field prefill |
| Profile docs | Save profile docs response and profile refresh |
| Explanation | Backend explanation success and local fallback |
| Applications tab | Driver applications fetch and render |
| Agent | Typing state, response, approval-required path |
| Voice | Config fetch and soft-failure handling |

## Manual Verification

### Guest user

- [ ] Load `/ai-matching`
- [ ] Confirm guest banner renders correctly
- [ ] Submit search and receive visible results
- [ ] Confirm upsell behavior for limited visibility
- [ ] Confirm login and signup CTAs navigate correctly

### Logged-in user

- [ ] Load page while logged in
- [ ] Confirm profile prefill is applied
- [ ] Confirm saved/applied carriers are marked
- [ ] Confirm mutual interest indicators appear when available

### Search and enrichment

- [ ] Trigger async search path
- [ ] Confirm loading steps progress without duplicate polling
- [ ] Confirm complete results render correctly
- [ ] Confirm top result enrichment auto-loads
- [ ] Confirm manual retry enrichment works

### Application and OCR

- [ ] Open application modal
- [ ] Upload CDL or med card document
- [ ] Confirm OCR prefill behavior
- [ ] Submit application successfully
- [ ] Repeat on duplicate carrier to verify duplicate handling
- [ ] Trigger login-for-application flow from guest state and verify recovery

### Explainability and assistants

- [ ] Expand match explanation and verify response
- [ ] Verify local fallback explanation on service failure
- [ ] Open agent UI and verify response path
- [ ] Verify approval-required agent flow if applicable
- [ ] Verify voice config bootstrap does not block page usage

### Deployment integrity

- [ ] Confirm all AI matching assets load from the intended release ref
- [ ] Confirm no stale module mismatch after jsDelivr purge
- [ ] Confirm Local Editor behavior matches deployed asset expectations
