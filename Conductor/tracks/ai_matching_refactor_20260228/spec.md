# Specification - AI Matching Surface Refactor

## 1. Objective

Refactor the AI Matching surface into a maintainable architecture with explicit boundaries between:

- the Wix page controller
- the HTML component shell
- extracted browser-side modules
- matching and non-matching backend services

The objective is not to redesign the product. The objective is to preserve current behavior while reducing coupling, duplication, hidden state, and deployment fragility on the most complex page in the codebase.

---

## 2. Primary Surface in Scope

### 2.1 Core page assets

- `src/public/driver/AI_MATCHING.html`
- `src/pages/AI - MATCHING.rof4w.js`

### 2.2 Browser modules already extracted from the HTML shell

- `src/public/driver/js/ai-matching-bridge.js`
- `src/public/driver/js/ai-matching-results.js`
- `src/public/driver/js/ai-matching-renderers.js`
- `src/public/driver/js/ai-matching-modals.js`
- `src/public/driver/js/ai-matching-agent.js`
- `src/public/driver/js/ai-matching-helpers.js`
- `src/public/driver/js/ai-matching-accordion.js`

### 2.3 Backend services directly imported by page code

- `src/backend/carrierMatching.jsw`
- `src/backend/asyncSearchService.jsw`
- `src/backend/mutualInterestService.jsw`
- `src/backend/aiEnrichment.jsw`
- `src/backend/driverProfiles.jsw`
- `src/backend/applicationService.jsw`
- `src/backend/ocrService.jsw`
- `src/backend/matchExplanationService.jsw`
- `src/backend/featureAdoptionService`
- `src/backend/agentService.jsw`
- `src/backend/voiceService.jsw`

### 2.4 Related but secondary dependencies

- `src/backend/externalMatchingApi.jsw`
- `src/backend/matchingService.jsw`
- `src/backend/scoring.js`
- `src/backend/admin_config_service.jsw`
- `src/backend/driverScoring.js`

---

## 3. Why This Track Exists

The AI Matching page has become a convergence point for multiple product domains:

- driver-to-carrier search
- async semantic polling
- carrier enrichment
- mutual interest overlays
- application submission
- OCR-assisted document autofill
- match explanations
- feature adoption tracking
- agent chat
- voice assistant bootstrap
- auth and post-login recovery

This concentration of responsibilities is now a material delivery risk.

### 3.1 Current complexity signals

- `AI_MATCHING.html` remains a very large shell with substantial inline orchestration.
- `AI - MATCHING.rof4w.js` acts as both lifecycle bootstrap and operational message bus.
- Browser-side modules still depend on shared globals instead of explicit state contracts.
- The page maintains both synchronous and asynchronous matching paths.
- The HTML shell and the page controller each maintain message registry logic.
- Asset URLs in the HTML shell point to mixed CDN refs, which can produce runtime drift between CSS, JS, and page expectations.

### 3.2 Current architecture problem statement

The current implementation works by accumulated coordination rather than clear contracts.

That produces five concrete engineering costs:

1. high regression risk when adding or modifying any feature on the page
2. difficulty isolating bugs to HTML, page code, or backend
3. weak confidence in deployment consistency because CDN asset refs are mixed
4. state mutation through globals and cached variables instead of one canonical source
5. testing that validates approximated behavior more than enforceable contracts

---

## 4. Architectural Assessment

### 4.1 Current state classification

The page is currently a hybrid monolith:

- **HTML shell monolith**
  - inline DOM bootstrapping
  - large global state surface
  - direct message handling
  - modal and application orchestration
- **page controller monolith**
  - handles every bridge message
  - owns auth refresh and driver profile cache
  - routes search, enrichment, application, OCR, explanation, agent, and voice
- **backend cluster**
  - matching responsibilities mixed with telemetry, caching, semantic boost, and legacy fallback behavior

### 4.2 Desired state classification

The target architecture is:

> thin HTML shell + explicit browser store + shared bridge contract + thin Wix page router + page-level backend facade + isolated domain controllers

This preserves Wix compatibility while making behavior legible.

---

## 5. Goals

### 5.1 Primary goals

- Preserve current user-visible behavior.
- Preserve current bridge semantics during migration.
- Reduce page-level coupling.
- Replace implicit global state with explicit state modules.
- Split page controller logic by responsibility.
- Introduce a backend facade so the page no longer imports every service directly.
- Expand regression coverage around the bridge and critical flows.
- Normalize CDN asset refs so the runtime is deterministic.

### 5.2 Non-goals

- Redesign the matching experience
- rewrite scoring logic from scratch
- replace Wix HTML components
- migrate the full UI to React or a new framework
- change pricing, search tiers, or business policy
- remove agent or voice features in this track

---

## 6. Refactor Principles

### 6.1 Contract-first

No implementation split should precede a frozen bridge contract.

### 6.2 Behavior-preserving

The baseline assumption is that existing behavior is correct unless explicitly marked as a bug.

### 6.3 Branch-by-boundary

Refactor by boundaries, not by file size alone:

- contract boundary
- state boundary
- controller boundary
- backend facade boundary
- deployment boundary

### 6.4 Parallel optionality

Optional capabilities must not increase the blast radius of the core match flow:

- OCR
- match explanations
- mutual interest overlay
- agent
- voice

### 6.5 Cutover safety

Every phase must be independently shippable with a clear rollback option.

---

## 7. Current Message Surface

### 7.1 Inbound to page code from HTML

The current page handles messages including:

- `carrierMatchingReady`
- `findMatches`
- `pollSearchJob`
- `logInterest`
- `retryEnrichment`
- `navigateToSignup`
- `navigateToLogin`
- `checkUserStatus`
- `getDriverProfile`
- `navigateToSavedCarriers`
- `submitApplication`
- `saveProfileDocs`
- `extractDocumentOCR`
- `getMatchExplanation`
- `getDriverApplications`
- `getMutualInterest`
- `logFeatureInteraction`
- `agentMessage`
- `resolveApprovalGate`
- `getVoiceConfig`
- `startVoiceCall`
- `endVoiceCall`
- `ping`

### 7.2 Outbound from page code to HTML

- `pageReady`
- `matchResults`
- `matchError`
- `enrichmentUpdate`
- `enrichmentComplete`
- `interestLogged`
- `userStatusUpdate`
- `loginSuccess`
- `loginCancelled`
- `applicationSubmitted`
- `driverProfileLoaded`
- `savedCarriersLoaded`
- `discoverabilityUpdated`
- `profileSaved`
- `ocrResult`
- `matchExplanation`
- `driverApplications`
- `mutualInterestData`
- `agentResponse`
- `agentTyping`
- `agentToolResult`
- `agentApprovalRequired`
- `voiceReady`
- `searchJobStarted`
- `searchJobStatus`
- `pong`

### 7.3 Contract problem

The message registry is duplicated between the page code and browser bridge. The implementation must converge on one canonical contract definition that both layers consume.

---

## 8. Current State Inventory

### 8.1 HTML-side state currently spread through globals

Representative globals include:

- `currentMatches`
- `driverPrefs`
- `userStatus`
- `appliedCarrierDOTs`
- `mutualInterestMap`
- `pendingInterestCarrier`
- `driverProfile`
- `pendingApplicationData`
- `currentSort`
- `filterMutualOnly`
- `allMatches`
- `currentApplicationCarrier`
- `uploadedFiles`
- OCR-derived `window.extracted*` fields

### 8.2 Page-side state currently spread through caches

- `cachedUserStatus`
- `cachedDriverProfile`
- `cachedDriverInterests`
- `lastSearchResults`
- `_veloInitDone`
- `_htmlReadyPending`

### 8.3 Why this is a problem

These variables are not inherently wrong, but they are weakly governed:

- lifecycle ownership is unclear
- mutation points are broad
- several features rely on ordering assumptions
- the same data is represented differently in multiple layers

---

## 9. Current Functional Streams

The refactor must preserve these streams:

### 9.1 Core matching

- driver preferences collected in HTML
- forwarded via bridge
- async semantic path attempted first
- sync matching fallback remains available
- visible results delivered to HTML

### 9.2 Enrichment

- top-match auto enrichment
- retry enrichment
- async enrichment status propagation
- fallback to Wix-side enrichment if Railway path fails

### 9.3 Interest and application

- interest logging
- saved/applied state rendering
- modal-driven application flow
- post-login recovery during application

### 9.4 Profile and documents

- driver profile bootstrap
- discoverability toggle
- document persistence
- OCR extraction and autofill

### 9.5 Explainability and overlays

- mutual interest overlay
- match explanation retrieval
- local explanation fallback

### 9.6 Optional assistants

- feature tracking
- agent orchestration
- voice configuration/bootstrap

---

## 10. Target Architecture

## 10.1 HTML shell target

`AI_MATCHING.html` becomes a thin shell that:

- declares markup
- loads CSS and JS assets from one consistent ref
- initializes one browser application bootstrap
- contains minimal inline scripting

### 10.1.1 Target browser module layout

```text
src/public/driver/js/
  ai-matching-contract.js
  ai-matching-state.js
  ai-matching-bootstrap.js
  ai-matching-bridge.js
  ai-matching-results.js
  ai-matching-renderers.js
  ai-matching-modals.js
  ai-matching-profile.js
  ai-matching-application.js
  ai-matching-agent.js
  ai-matching-helpers.js
  ai-matching-accordion.js
```

Not every file must be introduced immediately, but the end state should reflect explicit responsibility boundaries.

### 10.1.2 Browser-side responsibility split

- `contract`
  - message names
  - payload schema helpers
  - version identifier
- `state`
  - central browser state
  - getters/setters
  - derived selectors
- `bootstrap`
  - DOM lookup
  - handler registration
  - initialization order
- `bridge`
  - only message send/receive plumbing
  - no application decisions
- `results`
  - search submission
  - result filtering/sorting/render orchestration
- `application`
  - application modal and submission lifecycle
- `profile`
  - profile hydration, discoverability, prefill
- `agent`
  - agent and voice integration only

## 10.2 Page controller target

`AI - MATCHING.rof4w.js` should become a thin entrypoint that delegates to modules under a page-scoped folder.

### 10.2.1 Target page module layout

```text
src/pages/ai-matching/
  page-state.js
  page-bridge.js
  page-router.js
  contracts.js
  controllers/
    bootstrap-controller.js
    search-controller.js
    enrichment-controller.js
    profile-controller.js
    application-controller.js
    explanation-controller.js
    agent-controller.js
```

### 10.2.2 Page-side responsibility split

- entrypoint
  - Wix `$w.onReady`
  - mount HTML component
- page state
  - cached user/profile/search state
- page bridge
  - `sendToHtml`
  - message validation
- router
  - route inbound action to controller
- controllers
  - focused orchestration by domain

## 10.3 Backend target

The page should prefer a facade instead of importing many backend services directly.

### 10.3.1 Target facade

`src/backend/aiMatchingFacade.jsw`

The facade should expose page-oriented capabilities such as:

- `bootstrapDriverSession()`
- `runCarrierSearch()`
- `pollCarrierSearchJob()`
- `requestCarrierEnrichment()`
- `logCarrierInterestForPage()`
- `submitDriverApplicationForPage()`
- `loadDriverApplicationsForPage()`
- `extractDocumentForApplication()`
- `getDriverMatchExplanationForPage()`
- `getDriverMutualInterestForPage()`
- `getVoiceBootstrapConfig()`

The facade is not a rewrite of service logic. It is an anti-coupling layer for page consumption.

---

## 11. Required Deliverables

### 11.1 Contract deliverables

- one canonical AI matching bridge contract file
- one canonical registry of inbound and outbound messages
- payload field expectations for each message
- a contract version string

### 11.2 Browser deliverables

- HTML shell reduced to markup + bootstrap
- browser state module
- removal of duplicate `window.addEventListener('message', ...)` patterns where not required
- reduced dependence on `window.*` globals

### 11.3 Page deliverables

- extracted controllers
- router and bridge modules
- preserved readiness sequencing for `carrierMatchingReady` and `pageReady`

### 11.4 Backend deliverables

- page-facing facade
- smaller `carrierMatching.jsw` responsibility footprint
- clear separation between search orchestration and auxiliary features

### 11.5 Verification deliverables

- bridge contract tests
- browser DOM behavior tests
- page route tests
- critical-path manual verification checklist

---

## 12. Acceptance Criteria

### 12.1 Structural acceptance criteria

- `AI_MATCHING.html` is reduced to a thin shell with no large inline orchestration block.
- `AI - MATCHING.rof4w.js` is reduced to an entrypoint and imports page-scoped modules.
- contract definitions exist in one canonical location.
- browser state is managed through a single state module rather than scattered globals.
- the page consumes a backend facade for most page operations.

### 12.2 Behavioral acceptance criteria

All of the following must work before cutover is considered complete:

- guest search
- logged-in premium search
- async search polling
- sync fallback search
- top result auto-enrichment
- retry enrichment
- interest save
- application submission
- login-for-application recovery
- document OCR autofill
- profile prefill
- mutual interest overlay
- match explanation
- saved carriers navigation
- application history tab
- agent chat
- voice config bootstrap

### 12.3 Deployment acceptance criteria

- all AI matching assets reference one consistent CDN ref or one approved release strategy
- no mixed `main` and commit-pinned assets in the same shell
- the shell can be updated without asset drift across helper modules

---

## 13. Major Risks

### 13.1 Readiness sequencing risk

The page currently includes logic to avoid dropping `carrierMatchingReady` before async page initialization finishes. This sequencing must be preserved exactly during controller extraction.

### 13.2 Contract drift risk

If HTML and page code are split before a frozen contract exists, regressions will be hard to isolate.

### 13.3 Async/sync parity risk

The page supports two search paths. Both must continue returning compatible result structures to the renderer.

### 13.4 Global state removal risk

Removing globals too early can break modal restoration, OCR prefill, or application resume flows.

### 13.5 CDN drift risk

Mixed refs already create a hidden drift vector. Refactoring without normalizing release strategy can preserve the same operational problem.

---

## 14. Migration Strategy

The migration strategy is phased and behavior-preserving:

1. freeze and test the contract
2. move browser state behind a store
3. move HTML orchestration behind modular browser controllers
4. move page orchestration behind page controllers
5. introduce backend facade
6. normalize deployment refs
7. run cutover verification and remove dead code

No phase should require a full rewrite or a long-lived feature freeze.

---

## 15. Success Metrics

### 15.1 Engineering metrics

- reduced line count in shell and page entrypoint
- fewer direct backend imports from page code
- one contract source instead of two
- increased automated coverage for bridge and controller logic

### 15.2 Operational metrics

- fewer page-specific regressions after feature work
- faster debugging of search versus application versus OCR issues
- fewer environment-specific mismatches caused by CDN drift

### 15.3 Delivery metrics

- future matching enhancements should land by editing isolated modules instead of touching the full page stack
