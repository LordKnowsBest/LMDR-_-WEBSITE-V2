# Verification Gate Checklist

## For Expert Review Team

This checklist is used at **Gate 1** (after Wave 3) and **Gate 2** (after Wave 6).

---

## Gate Metadata

| Field | Value |
|-------|-------|
| Gate # | _1 or 2_ |
| Date | _YYYY-MM-DD_ |
| Reviewer(s) | _Senior engineer names_ |
| Waves Covered | _e.g., Waves 1-3_ |
| Go/No-Go | _PENDING_ |

---

## Section 1: Seed Data Verification

For each seed file delivered in the covered waves:

| Seed File | Collections Seeded | Ran Successfully? | Records in Airtable? | Idempotent? | Edge Cases Present? | Notes |
|-----------|-------------------|-------------------|----------------------|-------------|--------------------|----|
| _seedDriverProfiles.jsw_ | _driverProfiles_ | [ ] | [ ] | [ ] | [ ] | |
| _seedCarrierMatching.jsw_ | _carriers, interests_ | [ ] | [ ] | [ ] | [ ] | |

### Seed Data Checks
- [ ] All seed files use `insertData()` helper (never raw `wixData.*`)
- [ ] All seed files check `countData()` before inserting (idempotent)
- [ ] Chunked processing with 10-record batches and 200ms delay
- [ ] Test data uses obviously fake values (e.g., `__TEST_SEED__` prefix)
- [ ] No hardcoded Airtable table names (uses `getAirtableTableName()`)
- [ ] Each seed creates 5-15 records (enough to verify, not spam)

---

## Section 2: Connection Test Verification

For each connection test file delivered:

| Test File | Phase 1: API | Phase 2: Mapping | Phase 3: Transform | Phase 4: CRUD | Cleanup OK? | Notes |
|-----------|-------------|-----------------|--------------------|--------------|----|-----|
| _driverProfilesConnectionTest.jsw_ | [ ] | [ ] | [ ] | [ ] | [ ] | |
| _carrierMatchingConnectionTest.jsw_ | [ ] | [ ] | [ ] | [ ] | [ ] | |

### Connection Test Checks
- [ ] All 4 phases implemented (API, Mapping, Transform, CRUD)
- [ ] CRUD phase cleans up test records on success AND on failure
- [ ] Field transformation checks both directions (Wix->Airtable->Wix)
- [ ] Table mapping checks against `config.jsw` (not hardcoded)
- [ ] `quickCheck()` export available for dashboard integration
- [ ] Test records use identifiable prefix for manual cleanup if needed

---

## Section 3: Bridge Test Verification

For each bridge test file delivered:

| Test File | Source Checks | Safety Checks | Discovery | Routing | Errors | Call Verification | Notes |
|-----------|--------------|--------------|-----------|---------|--------|------------------|----|
| _aiMatching.bridge.test.js_ | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | |
| _driverDashboard.bridge.test.js_ | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | |

### Bridge Test Checks
- [ ] Source file structure tests verify all expected backend imports
- [ ] Safety checks confirm try-catch around `$w()` and `safeSend`
- [ ] Component discovery tests all 6 IDs (`#html1`..`#html5`, `#htmlEmbed1`)
- [ ] Every action in `routeMessage` has a corresponding test
- [ ] Every action has an error-case test (backend failure -> actionError)
- [ ] Tests verify exact arguments passed to backend methods
- [ ] Tests verify exact response shape sent back to HTML
- [ ] `navigateTo` handler tested with and without destination

---

## Section 3B: HTML DOM Test Verification

For each HTML DOM test file delivered:

| Test File | HTML Structure | Msg Validation | DOM Rendering | Outbound Msgs | Error Display | Sanitization | Element IDs | Notes |
|-----------|---------------|---------------|---------------|--------------|--------------|-------------|-------------|-------|
| _aiMatching.html.test.js_ | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | |
| _driverDashboard.html.test.js_ | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | |

### HTML DOM Test Checks
- [ ] HTML source structure checks: message listener, ready signal, protocol type
- [ ] Message validation: null/empty/wrong-protocol messages ignored
- [ ] DOM rendering tests for every inbound message type (textContent, innerHTML, classList)
- [ ] Outbound message tests: ready signal fires on init
- [ ] Error display: toast/inline errors render correctly with fallback text
- [ ] Sanitization: source uses textContent, stripHtml, or equivalent
- [ ] Element ID coverage: every DOM ID in handlers exists in the HTML file
- [ ] Correct `MESSAGE_KEY` used (`action` vs `type`) matching the page protocol

---

## Section 4: End-to-End Spot Checks

Manually verify 1 page per portal type through the full pipeline:

### Admin Portal Spot Check
- Page: _______________
- [ ] Open page in Wix Editor preview
- [ ] Verify HTML component loads and sends `ready` message
- [ ] Trigger a data-loading action (e.g., getDashboard)
- [ ] Confirm data appears in HTML (not empty, not error)
- [ ] Check Airtable to confirm the underlying records exist
- [ ] Trigger an error condition and verify error message displays

### Driver Portal Spot Check
- Page: _______________
- [ ] Same checks as above

### Recruiter Portal Spot Check
- Page: _______________
- [ ] Same checks as above

### B2B Portal Spot Check (Gate 1+ only)
- Page: _______________
- [ ] Same checks as above

---

## Section 5: Cross-Domain Integrity (Gate 2 only)

- [ ] Run ALL seed files back-to-back — no Airtable 429 rate limit errors
- [ ] Run `npm test` — ALL tests pass (Waves 1-6 combined)
- [ ] No orphaned test records in Airtable after full test suite
- [ ] No field name collisions between domains
- [ ] config.jsw collection keys match actual Airtable table names

### Coverage Assessment
| Metric | Target | Actual |
|--------|--------|--------|
| Services with seed files | 75%+ | ___% |
| Services with connection tests | 75%+ | ___% |
| Pages with bridge tests | 75%+ | ___% |
| Pages with HTML DOM tests | 75%+ | ___% |
| Total test count | 400+ | ___ |
| Full suite runtime | <5min | ___s |

---

## Section 6: Template Quality Review

- [ ] All 4 templates still accurately reflect the project patterns (`_TEMPLATE_seed.jsw`, `_TEMPLATE_connectionTest.jsw`, `_TEMPLATE_bridge.test.js`, `_TEMPLATE_html.test.js`)
- [ ] No recurring issues across multiple juniors' deliverables
- [ ] If issues found, templates have been updated before next wave

### Template Revisions Needed
| Template | Issue Found | Fix Applied |
|----------|------------|-------------|
| | | |

---

## Section 7: Decision

### Blocking Issues
_List any issues that must be fixed before the next wave proceeds:_
1.
2.

### Non-Blocking Issues
_Issues to address but won't block the next wave:_
1.
2.

### Go / No-Go

| Decision | Signed Off By | Date |
|----------|--------------|------|
| **GO** / **NO-GO** | _Name_ | _Date_ |

### Rework Assignments (if No-Go)
| Junior | Rework Item | Due Date |
|--------|------------|----------|
| | | |
