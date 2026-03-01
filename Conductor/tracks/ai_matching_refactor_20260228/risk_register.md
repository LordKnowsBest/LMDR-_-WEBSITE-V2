# Risk Register - AI Matching Surface Refactor

## Risk 1 - Readiness race between HTML and page bootstrap

- Severity: Critical
- Likelihood: High
- Why it matters: the page already contains special logic to avoid dropping `carrierMatchingReady` before async initialization completes.
- Mitigation:
  - freeze current behavior in tests before moving code
  - move readiness logic into one dedicated controller
  - verify `pageReady` emission count under both initialization orders

## Risk 2 - Bridge contract drift during phased extraction

- Severity: Critical
- Likelihood: High
- Why it matters: HTML and page code currently duplicate registry logic.
- Mitigation:
  - contract extraction before deeper refactor
  - keep message names stable until final cleanup
  - add message registry tests

## Risk 3 - Async and sync search shape mismatch

- Severity: High
- Likelihood: High
- Why it matters: the renderer is implicitly tolerant today, but controller decomposition can expose inconsistencies.
- Mitigation:
  - define result shape contract
  - normalize all result payloads in a facade or controller layer
  - test both paths against the same rendering expectations

## Risk 4 - Modal and application resume regression

- Severity: High
- Likelihood: Medium
- Why it matters: pending carrier state, login recovery, OCR prefill, and modal restoration are tightly coupled to globals.
- Mitigation:
  - isolate modal state early
  - add tests for login-for-application flow
  - verify duplicate and success submission paths

## Risk 5 - OCR state regression

- Severity: High
- Likelihood: Medium
- Why it matters: OCR writes into global browser state and pre-fills application form fields.
- Mitigation:
  - inventory all OCR-derived globals before refactor
  - move OCR state into a dedicated store
  - test extraction success and fallback handling

## Risk 6 - Deployment drift from mixed CDN refs

- Severity: High
- Likelihood: High
- Why it matters: the HTML shell loads CSS and JS from different refs, so refactoring can still leave nondeterministic runtime behavior.
- Mitigation:
  - normalize refs in a dedicated phase
  - document release and purge sequence
  - avoid mixing release strategy changes with controller decomposition where possible

## Risk 7 - Optional assistant features breaking core search

- Severity: Medium
- Likelihood: Medium
- Why it matters: agent and voice features share the same page routing surface as core matching.
- Mitigation:
  - isolate agent/voice controllers
  - ensure optional features fail soft
  - keep their bootstrap outside critical search paths

## Risk 8 - Test suite giving false confidence

- Severity: Medium
- Likelihood: Medium
- Why it matters: some current tests replicate approximated logic instead of asserting real module contracts.
- Mitigation:
  - introduce contract-level tests
  - increase route and payload validation coverage
  - add manual verification checklist

