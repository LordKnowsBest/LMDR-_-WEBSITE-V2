# Plan - AI Matching Surface Refactor

**Created:** 2026-02-28
**Updated:** 2026-03-01
**Status:** IN PROGRESS
**Priority:** Critical

> **Implementation rule:** treat this as a boundary-first refactor, not a redesign. Preserve message names and user behavior until the final cleanup phase.

## Current Progress

- Completed: Phase 0 through Phase 6
- In progress: Phase 7
- Remaining: manual Wix/Local Editor verification and final removal of any residual compatibility debt not required for stable rollout

## Completed Work Summary

- Shared bridge contract extracted and adopted on both HTML and page sides
- Browser-side state and bootstrap extracted from the HTML shell
- Page-side router, state, and bridge helpers extracted and wired into the Wix page code
- Page-level backend facade introduced so the page consumes one backend boundary
- Regression tests added for contract, bootstrap, page refactor wiring, and facade coverage
- AI matching HTML asset refs normalized to one jsDelivr release strategy
- Repo lint returned to clean status after follow-up fixes

---

## Why This Track Exists

The AI Matching page is currently the highest-complexity driver-facing surface in the repository. It couples:

- a large HTML component shell
- a large Wix page controller
- several extracted client modules
- a broad set of backend services that mix search, enrichment, application, OCR, telemetry, and assistant behavior

The page is functioning as a delivery bottleneck. Small feature changes require a large amount of context and create a high probability of incidental breakage.

---

## Current State Snapshot

### Primary files

- `src/public/driver/AI_MATCHING.html`
- `src/pages/AI - MATCHING.rof4w.js`
- `src/backend/carrierMatching.jsw`

### Key complexity findings

- The HTML shell still holds extensive global state and message handling.
- The page controller routes nearly every operational concern on the page.
- There are duplicated message registries on both sides of the bridge.
- Async and sync search flows coexist and must remain behaviorally compatible.
- Optional features are mounted in the same operational surface as core match flow.
- CDN assets are loaded from multiple refs in the same HTML shell.

---

## Phase 0 - Baseline, Audit, and Contract Freeze

> Goal: record current behavior and freeze the bridge before structural changes.

### 0.1 Static inventory

- [ ] Task: Create a bridge inventory document listing every inbound and outbound message, sender, receiver, payload shape, and dependent UI/backend effect.
- [ ] Task: Enumerate current browser globals and classify each as search state, modal state, profile state, OCR state, or assistant state.
- [ ] Task: Enumerate page-side cached state and identify write locations.
- [ ] Task: Enumerate all direct backend imports from `AI - MATCHING.rof4w.js` and group them by domain.

### 0.2 Runtime baseline

- [ ] Task: Capture baseline manual behavior for guest search.
- [ ] Task: Capture baseline manual behavior for logged-in search with profile prefill.
- [ ] Task: Capture baseline manual behavior for application submission and OCR autofill.
- [ ] Task: Capture baseline manual behavior for async polling and enrichment.
- [ ] Task: Capture baseline manual behavior for agent and voice bootstrap.

### 0.3 Contract freeze

- [ ] Task: Define canonical message names and payload shapes for all existing bridge messages.
- [ ] Task: Mark unsupported or legacy payload aliases, if any, but keep them temporarily supported.
- [ ] Task: Add a contract version identifier.

**Phase 0 exit criteria**

- [ ] All message flows documented.
- [ ] All major globals documented.
- [ ] Existing behavior captured before implementation begins.

---

## Phase 1 - Shared Bridge Contract and Typed Payload Rules

> Goal: remove contract duplication before moving logic.

### 1.1 New contract module

- [ ] Task: Create `src/public/driver/js/ai-matching-contract.js`.
- [ ] Task: Move canonical message registries into this file.
- [ ] Task: Export helpers for validating message type and envelope shape.
- [ ] Task: Export payload documentation constants or validator stubs for each message.

### 1.2 Bridge adoption

- [ ] Task: Update `src/public/driver/js/ai-matching-bridge.js` to consume the shared contract.
- [ ] Task: Update page-side message validation in `AI - MATCHING.rof4w.js` or extracted page modules to consume the same contract definitions.
- [ ] Task: Ensure outbound HTML messages and outbound page messages are validated by the same registry source.

### 1.3 Tests

- [ ] Task: Add contract tests covering every known message name.
- [ ] Task: Add negative tests for unknown message types and malformed envelopes.
- [ ] Task: Add tests for async-specific messages: `searchJobStarted`, `searchJobStatus`, `matchResults`, `matchError`.

**Phase 1 exit criteria**

- [ ] There is one canonical contract definition.
- [ ] Both HTML and page layers use the same registry.
- [ ] Existing bridge tests continue passing after contract extraction.

---

## Phase 2 - HTML Shell Decomposition and State Isolation

> Goal: finish extracting the HTML shell into modular browser-side responsibilities.

### 2.1 State isolation

- [ ] Task: Create `src/public/driver/js/ai-matching-state.js`.
- [ ] Task: Move browser globals into a single state container with named getters/setters.
- [ ] Task: Separate persisted state, derived state, and temporary modal state.
- [ ] Task: Replace direct `window.extracted*` use with OCR state accessors where feasible.

### 2.2 Bootstrap extraction

- [ ] Task: Create `src/public/driver/js/ai-matching-bootstrap.js`.
- [ ] Task: Move DOM lookup, event binding, and initialization order out of the HTML shell.
- [ ] Task: Ensure only one message listener owns general dispatch for page-to-HTML events.
- [ ] Task: Preserve explicit direct-dispatch behavior for async polling if still required.

### 2.3 Feature module cleanup

- [ ] Task: Move application-specific orchestration out of the shell and into a dedicated module if `ai-matching-modals.js` remains too broad.
- [ ] Task: Move profile hydration and discoverability concerns into a dedicated module or explicit results/profile controller.
- [ ] Task: Ensure results sorting/filtering reads from state, not loose globals.
- [ ] Task: Make message handlers call explicit module functions instead of operating inline.

### 2.4 HTML shell reduction

- [ ] Task: Reduce `AI_MATCHING.html` to markup, asset includes, and minimal bootstrap only.
- [ ] Task: Remove duplicate message handling from the shell where bridge modules already own it.
- [ ] Task: Keep inline script only where Wix HTML shell constraints make it unavoidable, and document the reason.

### 2.5 Tests

- [ ] Task: Expand `aiMatching.html.test.js` to validate state transitions through the new store.
- [ ] Task: Add DOM behavior tests for:
  - [ ] async polling start
  - [ ] async polling failure
  - [ ] interest save success/failure
  - [ ] login success recovery
  - [ ] application history rendering

**Phase 2 exit criteria**

- [ ] HTML shell no longer owns large operational logic.
- [ ] Browser state is centralized.
- [ ] Critical UI flows still behave identically.

---

## Phase 3 - Wix Page Controller Decomposition

> Goal: turn the page file into an entrypoint plus page-scoped controllers.

### 3.1 Page structure creation

- [ ] Task: Create `src/pages/ai-matching/page-state.js`.
- [ ] Task: Create `src/pages/ai-matching/page-bridge.js`.
- [ ] Task: Create `src/pages/ai-matching/page-router.js`.
- [ ] Task: Create page-scoped controller files under `src/pages/ai-matching/controllers/`.

### 3.2 State migration

- [ ] Task: Move `cachedUserStatus`, `cachedDriverProfile`, `cachedDriverInterests`, `lastSearchResults`, `_veloInitDone`, and `_htmlReadyPending` into `page-state.js`.
- [ ] Task: Add controlled state accessors so mutation points are explicit.

### 3.3 Controller extraction

- [ ] Task: Extract bootstrap and readiness sequencing into `bootstrap-controller.js`.
- [ ] Task: Extract matching and polling behavior into `search-controller.js`.
- [ ] Task: Extract enrichment behavior into `enrichment-controller.js`.
- [ ] Task: Extract driver profile and discoverability behavior into `profile-controller.js`.
- [ ] Task: Extract application, OCR, and applications history behavior into `application-controller.js`.
- [ ] Task: Extract match explanation and mutual interest behavior into `explanation-controller.js`.
- [ ] Task: Extract agent and voice behavior into `agent-controller.js`.

### 3.4 Entrypoint reduction

- [ ] Task: Reduce `src/pages/AI - MATCHING.rof4w.js` to `$w.onReady`, component lookup, router wiring, and controller bootstrap.

### 3.5 Tests

- [ ] Task: Expand `aiMatching.bridge.test.js` to validate controller routing rather than only large-file approximations.
- [ ] Task: Add tests for readiness ordering:
  - [ ] HTML ready before async page bootstrap completes
  - [ ] page bootstrap complete before HTML ready
- [ ] Task: Add tests verifying `pageReady` is sent exactly once per initial load.

**Phase 3 exit criteria**

- [ ] Page file is materially smaller and clearer.
- [ ] Routing and controller ownership are explicit.
- [ ] Readiness sequencing remains intact.

---

## Phase 4 - Backend Facade and Service Boundary Cleanup

> Goal: reduce direct page coupling to backend internals.

### 4.1 Facade introduction

- [ ] Task: Create `src/backend/aiMatchingFacade.jsw`.
- [ ] Task: Introduce page-oriented methods for bootstrap, search, enrichment, interest, application, OCR, explanation, mutual interest, and voice config.
- [ ] Task: Migrate page controllers to consume facade methods instead of many direct service imports.

### 4.2 Matching boundary cleanup

- [ ] Task: Evaluate `carrierMatching.jsw` responsibilities and extract non-core concerns where appropriate.
- [ ] Task: Separate core search/scoring pipeline responsibilities from:
  - [ ] legacy interest fallback behavior
  - [ ] saved carriers convenience access
  - [ ] optional observability wrappers if they obscure the main path
- [ ] Task: Preserve timeout budget behavior and cache behavior while improving structure.

### 4.3 Auxiliary service cleanup

- [ ] Task: Ensure page-oriented facade methods normalize payload shapes from:
  - [ ] `driverProfiles.jsw`
  - [ ] `applicationService.jsw`
  - [ ] `ocrService.jsw`
  - [ ] `matchExplanationService.jsw`
  - [ ] `mutualInterestService.jsw`
  - [ ] `voiceService.jsw`

### 4.4 Tests

- [ ] Task: Add facade tests proving stable response shapes for page consumption.
- [ ] Task: Add matching service regression tests for search result shape parity.
- [ ] Task: Add tests proving sync and async search results can be rendered through the same UI path.

**Phase 4 exit criteria**

- [ ] Page code consumes a backend facade for most operations.
- [ ] Core matching path is clearer and less overloaded.
- [ ] Response shape normalization is explicit.

---

## Phase 5 - Test Expansion and Regression Hardening

> Goal: stop relying on implicit behavior during future work.

### 5.1 Contract and route tests

- [ ] Task: Add test coverage for every message route and expected payload.
- [ ] Task: Add route tests for unknown message rejection.
- [ ] Task: Add payload-shape tests for `matchResults`, `applicationSubmitted`, `ocrResult`, `driverProfileLoaded`, and `mutualInterestData`.

### 5.2 Flow tests

- [ ] Task: Add end-to-end simulated flow test for guest match search.
- [ ] Task: Add end-to-end simulated flow test for logged-in search with profile prefill.
- [ ] Task: Add end-to-end simulated flow test for login-for-application recovery.
- [ ] Task: Add end-to-end simulated flow test for OCR-assisted application submit.
- [ ] Task: Add end-to-end simulated flow test for async polling complete path.
- [ ] Task: Add end-to-end simulated flow test for async polling failure path.

### 5.3 Manual verification support

- [ ] Task: Create or update a manual verification checklist for the AI matching page.
- [ ] Task: Include steps for guest, logged-in, premium, and failure-path testing.

**Phase 5 exit criteria**

- [ ] The most failure-prone paths are covered by automated tests.
- [ ] Manual verification is structured and repeatable.

---

## Phase 6 - Deployment Integrity and CDN Consistency

> Goal: eliminate runtime drift between HTML shell and helper modules.

### 6.1 Asset audit

- [ ] Task: Inventory all CSS and JS assets loaded by `AI_MATCHING.html`.
- [ ] Task: Identify mixed refs and inconsistent load strategies.

### 6.2 Release strategy normalization

- [ ] Task: Choose one approved release strategy for the AI matching shell:
  - [ ] all pinned commit refs
  - [ ] one coordinated release ref
  - [ ] one documented `main` strategy if operationally required
- [ ] Task: Update asset references so the shell does not mix refs in one page.
- [ ] Task: Document purge and release steps for jsDelivr if commit-pinned.

### 6.3 Tests and verification

- [ ] Task: Validate that asset order remains correct after normalization.
- [ ] Task: Verify that the bridge and bootstrap still load before dependent modules execute.

**Phase 6 exit criteria**

- [ ] AI matching assets are deployment-consistent.
- [ ] Mixed-ref drift has been removed.

---

## Phase 7 - Cutover, Verification, and Cleanup

> Goal: finalize the refactor and remove transitional debt.

### 7.1 Cleanup

- [ ] Task: Remove duplicated contract definitions.
- [ ] Task: Remove obsolete inline handlers and unused globals.
- [ ] Task: Remove transitional compatibility code that is no longer needed.

### 7.2 Verification

- [ ] Task: Run automated tests for AI matching bridge and HTML behavior.
- [ ] Task: Run targeted backend tests for matching-related services.
- [ ] Task: Run manual verification against live Wix page behavior in Local Editor.

### 7.3 Documentation

- [ ] Task: Add a short architecture note describing the final AI matching surface boundaries.
- [ ] Task: Document where future work should land by responsibility.

**Phase 7 exit criteria**

- [ ] Dead compatibility code removed.
- [ ] Final structure documented.
- [ ] The team has a stable post-refactor landing zone for future features.

---

## Detailed File-by-File Implementation Intent

### Files expected to change heavily

- `src/public/driver/AI_MATCHING.html`
  - reduce inline orchestration
  - reduce globals
  - keep markup and minimal bootstrap

- `src/pages/AI - MATCHING.rof4w.js`
  - convert into entrypoint delegating to extracted modules

- `src/backend/carrierMatching.jsw`
  - clarify search pipeline boundaries
  - preserve timeout and cache behavior

### Files expected to change moderately

- `src/public/driver/js/ai-matching-bridge.js`
- `src/public/driver/js/ai-matching-results.js`
- `src/public/driver/js/ai-matching-modals.js`
- `src/public/driver/js/ai-matching-agent.js`

### New files expected

- `src/public/driver/js/ai-matching-contract.js`
- `src/public/driver/js/ai-matching-state.js`
- `src/public/driver/js/ai-matching-bootstrap.js`
- `src/pages/ai-matching/page-state.js`
- `src/pages/ai-matching/page-bridge.js`
- `src/pages/ai-matching/page-router.js`
- `src/pages/ai-matching/controllers/*.js`
- `src/backend/aiMatchingFacade.jsw`

---

## Risk-Control Rules During Implementation

- [ ] Do not rename the Wix page file.
- [ ] Do not break the current message names during Phases 0-6.
- [ ] Do not remove sync fallback search until async parity is proven.
- [ ] Do not merge deployment ref normalization with structural refactors in one commit if avoidable.
- [ ] Do not move OCR logic without preserving application resume behavior.
- [ ] Do not remove readiness sequencing guards without dedicated tests.

---

## Definition of Done

This track is done when:

1. the AI matching shell is modular and no longer orchestrates the product inline
2. the Wix page file is a thin entrypoint plus extracted controllers
3. the bridge contract exists in one canonical form
4. the page primarily consumes a backend facade instead of many direct services
5. CDN refs are normalized
6. automated and manual verification cover all critical user paths
