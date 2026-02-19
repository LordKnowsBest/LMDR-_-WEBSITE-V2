# Chrome DevTools Runtime Verification — Implementation Plan

**Track:** `devtools_observability_20260219`
**Version:** 2.0 (rewritten — real chrome-devtools-mcp tools)
**Date:** 2026-02-19
**Spec:** `./spec.md`

---

## Phase 0: Environment Setup & Auth Strategy

**Goal:** Get `chrome-devtools-mcp` installed and connected to an authenticated Wix session in under 10 minutes.

### Phase 0 Checklist

- [ ] **0.1** Verify Node.js v20.19+ is installed: `node --version`
- [ ] **0.2** Test the MCP server launches: `npx -y chrome-devtools-mcp@latest --help`
- [ ] **0.3** Add to MCP client config (Gemini CLI / Claude Desktop / Cursor):

  **For autoConnect (Chrome 144+ — recommended):**
  ```json
  {
    "mcpServers": {
      "chrome-devtools": {
        "command": "npx",
        "args": [
          "chrome-devtools-mcp@latest",
          "--autoConnect",
          "--no-usage-statistics",
          "--viewport=1440x900"
        ]
      }
    }
  }
  ```

  **For remote debugging port fallback:**
  ```json
  {
    "mcpServers": {
      "chrome-devtools": {
        "command": "npx",
        "args": [
          "chrome-devtools-mcp@latest",
          "--browserUrl=http://127.0.0.1:9222",
          "--no-usage-statistics",
          "--viewport=1440x900"
        ]
      }
    }
  }
  ```

- [ ] **0.4** (autoConnect path) In Chrome: navigate to `chrome://inspect/#remote-debugging` → enable remote debugging
- [ ] **0.4** (browserUrl path) Launch Chrome with debug port (close all other Chrome instances first):
  ```powershell
  Start-Process "chrome.exe" -ArgumentList @(
    "--remote-debugging-port=9222",
    "--user-data-dir=`"$env:USERPROFILE\.lmdr-devtools-profile`""
  )
  ```
- [ ] **0.5** Authenticate into Wix: navigate to `https://www.lmdr.io`, confirm you are logged in
- [ ] **0.6** Confirm the MCP server connects: call `list_pages` → should return a tab with `www.lmdr.io` in the URL
- [ ] **0.7** Smoke test: call `take_screenshot` with `fullPage: false` → confirm a non-blank screenshot is returned

**Phase 0 Acceptance Criteria:**
- `list_pages` returns at least 1 page
- `take_screenshot` returns a PNG with file size > 10KB
- No "connection refused" or "no browser found" errors

---

## Phase 1: Smoke Test Playbook (MVP)

**Goal:** Run all 5 critical paths, capture all Evidence Pack artifacts, output `quality_gate.json`.

### Step-by-Step Agent Playbook

This is the ordered sequence of `chrome-devtools-mcp` tool calls the agent executes for each critical path. Written as agent instructions.

---

#### STEP 1.0 — Session Guard

```
CALL: list_pages
→ Find page where URL contains "lmdr.io" or "wixsite.com/lmdr"
→ If no such page: ABORT with "No LMDR session found in browser. Open lmdr.io first."
→ If any page URL contains "users.wix.com": ABORT with "Wix session expired. Log in to Wix then retry."
→ If editor.wix.com tab found: skip it — DO NOT select_page to it
→ Call: select_page with the correct pageId
```

---

#### STEP 1.1 — For Each Critical Path: Navigate

```
Path order: home → ai_matcher → driver_entry → carrier_entry → app_flow

For each path:
  CALL: navigate_page
    → url: "{siteBaseUrl}{route}"
    → type: "url"
    → timeout: {pathTimeoutMs}  (home: 15000, ai_matcher: 20000, others: 15000)
```

---

#### STEP 1.2 — Wait for Ready State

```
CALL: wait_for
  → text: "{path.readyText}"  (e.g. "Find Your Match" for ai_matcher)
  → timeout: {pathTimeoutMs}

If wait_for times out:
  → Record timedOut: true for this path
  → Continue to next step (screenshot may still be useful evidence)

After wait_for resolves:
  → Dwell 2 seconds for Wix PostMessage bridge:
    CALL: evaluate_script
      → function: "async () => { await new Promise(r => setTimeout(r, 2000)); return 'dwell done'; }"
```

---

#### STEP 1.3 — Capture Console Messages

```
CALL: list_console_messages
  → types: ["error", "warning"]
  → includePreservedMessages: true
  → pageSize: 500

For each entry where type === "error" and msgid is available:
  CALL: get_console_message
    → msgid: {entry.msgid}
  → Record full stack trace in console_audit.json

PII-scrub all message text before writing to disk.
```

---

#### STEP 1.4 — Capture Network Requests

```
CALL: list_network_requests
  → resourceTypes: ["xhr", "fetch", "document"]
  → includePreservedRequests: true
  → pageSize: 200

Filter for status >= 400 or entries with failure_reason.

For each failed request:
  CALL: get_network_request
    → reqid: {req.reqid}
    (DO NOT save responseFilePath for endpoints containing auth tokens)

Strip auth params from all URLs before writing to network_audit.json.
```

---

#### STEP 1.5 — Iframe & Selector Assertion

```
CALL: evaluate_script
  → function: "() => Array.from(document.querySelectorAll('iframe')).map(f => ({ id: f.id, name: f.name, src: f.src.substring(0, 120), w: f.offsetWidth, h: f.offsetHeight }))"
→ Log iframe list for this path

CALL: take_snapshot
  → verbose: false
→ Inspect a11y tree for presence of required content elements.
  If snapshot contains required text/role, record selector_found: true

CALL: evaluate_script
  → function: "() => { const sel = '{path.selectorCSS}'; const el = document.querySelector(sel); if (!el) return { found: false, visible: false }; const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return { found: true, visible: r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' }; }"
→ Record { found, visible } for each required selector in quality_gate
```

---

#### STEP 1.6 — PII Blur + Screenshot

```
CALL: evaluate_script
  → function: "() => { ['input[type=\"email\"]','input[name*=\"phone\"]','input[name*=\"name\"]','.member-name','.driver-email','[data-pii=\"true\"]'].forEach(s => document.querySelectorAll(s).forEach(e => e.style.filter = 'blur(8px)')); return 'blur injected'; }"

CALL: take_screenshot
  → fullPage: true
  → format: "png"
  → filePath: "{artifactRoot}{runId}/visual_confirmation/{path.screenshotFile}"

Verify file exists and is > 10KB. If < 10KB → record isBlank: true → P0 failure.

CALL: evaluate_script
  → function: "() => { ['input[type=\"email\"]','input[name*=\"phone\"]','input[name*=\"name\"]','.member-name','.driver-email','[data-pii=\"true\"]'].forEach(s => document.querySelectorAll(s).forEach(e => e.style.filter = '')); return 'blur removed'; }"
```

---

#### STEP 1.7 — Quality Gate Evaluation

After all 5 paths are processed:

```
Evaluate the 6 pass/fail checks (see spec.md §6.4):
  1. zero_p0_errors             → no ERROR entries from list_console_messages
  2. all_critical_selectors_visible → all evaluate_script selector checks returned visible: true
  3. all_pages_reached_ready_state  → all wait_for calls completed without timeout
  4. zero_network_500_errors    → no list_network_requests entries with status >= 500
  5. screenshots_captured       → all 5 PNG files exist and are > 10KB
  6. zero_velo_worker_fatal_errors  → no console entries matching Velo patterns

Write quality_gate.json to {artifactRoot}{runId}/quality_gate.json
Write console_audit.json to {artifactRoot}{runId}/console_audit.json
Write network_audit.json to {artifactRoot}{runId}/network_audit.json
```

---

### Phase 1 Per-Path Reference

| Path | URL Route | Ready Text | Required Selector | Screenshot File | Timeout |
|------|-----------|-----------|-------------------|----------------|---------|
| `home` | `/` | "Last Mile" or "CDL" | `.hero-cta-button, [data-hook="cta"]` | `home.png` | 15s |
| `ai_matcher` | `/ai-matching` | "AI Matching" or "Find Your Match" | `#ai-matching-container` (iframe — use snapshot) | `ai_matcher.png` | 20s |
| `driver_entry` | `/driver-dashboard` | "My Applications" or "Driver Dashboard" | `.driver-dashboard` (iframe) | `driver_entry.png` | 15s |
| `carrier_entry` | `/carrier-welcome` | "Welcome" or "Get Started" | `.status-steps` (iframe) | `carrier_entry.png` | 15s |
| `app_flow` | `/quick-apply` | "Upload" or "Quick Apply" | `#cdl-upload-btn` (iframe) | `app_flow.png` | 15s |

> **Wix page slugs:** Confirm actual page slugs in the Wix Editor. The routes above are guesses based on the HTML file names. Lookup: Wix Editor → Pages → right-click page → "Edit URL".

### Phase 1 Acceptance Criteria

- All 5 `navigate_page` calls complete without error
- All 5 `take_screenshot` calls produce files > 10KB
- `quality_gate.json` is written with valid JSON (even if `pass: false`)
- The agent can produce an Evidence Pack from a single natural language prompt: *"Run a runtime verification on LMDR and save the Evidence Pack."*

---

## Phase 2: Deep Trace (Performance — Conditional)

**Goal:** Use the performance tools to get LCP, CLS, and layout shift data for the homepage and ai_matcher path.

**Trigger:** Only run Phase 2 when a performance regression is suspected or when onboarding a new page to the critical path set.

### Phase 2 Checklist

- [ ] **2.1** Start a performance trace before navigating:
  ```
  CALL: performance_start_trace
  CALL: navigate_page → url: "https://www.lmdr.io"
  CALL: wait_for → text: "Last Mile" → timeout: 15000
  CALL: performance_stop_trace
  CALL: performance_analyze_insight → insight: "LCP"
  CALL: performance_analyze_insight → insight: "layout-shift"
  ```
- [ ] **2.2** Record LCP (Largest Contentful Paint) value in `performance_report.json`
- [ ] **2.3** Record Cumulative Layout Shift (CLS) value
- [ ] **2.4** Flag if LCP > 2.5s (poor) or CLS > 0.1 (poor per Web Vitals)
- [ ] **2.5** Repeat for `ai_matcher` path (expected high LCP due to 221KB HTML + Tailwind CDN)

**Phase 2 Acceptance Criteria:**
- `performance_report.json` written to artifact directory with LCP + CLS for home and ai_matcher
- LCP < 4s for both paths (LMDR-specific threshold — Wix-hosted sites have higher baseline)
- CLS < 0.25 (Wix PostMessage hydration causes layout shifts — loosened threshold)

---

## Phase 3: Conductor Hook

**Goal:** Make Evidence Pack verification a required step in the Conductor workflow. No track can be marked `[x] DONE` without a `quality_gate.json` with `pass: true`.

### Phase 3 Checklist

- [ ] **3.1** Update `Conductor/workflow.md` — add verification step to Task Lifecycle:
  ```
  Task Lifecycle (updated):
  Select → In Progress → Write Tests → Implement → Refactor →
  → RUN EVIDENCE PACK VERIFICATION → Review quality_gate.json → Verify → Commit
  ```

- [ ] **3.2** Update `Conductor/tracks.md` — add verification status field to each track template:
  ```markdown
  ## [ ] Track: {Name}
  *Evidence Pack: [ ] Not run | [ ] PASS | [ ] FAIL | ...path to quality_gate.json*
  ```

- [ ] **3.3** Add `verification_run` field to all future `metadata.json` templates:
  ```json
  "verification_run": {
    "run_id": null,
    "quality_gate_path": null,
    "pass": null,
    "verified_at": null
  }
  ```

- [ ] **3.4** Update `CLAUDE.md` / `GEMINI.md` — add "Before marking DONE" rule:
  > Before marking any Conductor track DONE, run the DevTools Evidence Pack verification and confirm `quality_gate.json` shows `pass: true`. Attach the run_id to the track's metadata.json.

- [ ] **3.5** Create `.agent/workflows/evidence-pack.md` — a slash-command workflow:

  ```markdown
  ---
  description: Run the LMDR DevTools Evidence Pack verification
  ---

  1. Call list_pages to find the authenticated LMDR tab
  2. Call select_page on the LMDR tab
  3. For each critical path [home, ai_matcher, driver_entry, carrier_entry, app_flow]:
     a. navigate_page
     b. wait_for (ready text)
     c. evaluate_script (2s dwell)
     d. list_console_messages + get_console_message (errors only)
     e. list_network_requests (xhr, fetch, document)
     f. take_snapshot
     g. evaluate_script (PII blur)
     h. take_screenshot (fullPage: true, save to artifacts/devtools/{runId}/visual_confirmation/)
     i. evaluate_script (PII unblur)
  4. Generate quality_gate.json from collected results
  5. Write all artifacts to artifacts/devtools/{runId}/
  6. Report pass/fail and list all reasons
  ```

**Phase 3 Acceptance Criteria:**
- Evidence Pack is referenced as a required gate in `workflow.md`
- The `/evidence-pack` slash-command workflow exists and runs successfully from a single prompt
- Any track that completes Phase 1 of its implementation is required to include a passing Evidence Pack

---

## Phase 4: Hardening

**Goal:** Make the Evidence Pack verification robust against the Wix/Velo quirks documented in `known_issues.md`.

### Phase 4 Checklist

- [ ] **4.1** **Retry logic on `wait_for` timeout** — if `wait_for` times out on first try, call `navigate_page` with `type: "reload"` and retry once
- [ ] **4.2** **Frame detection validation** — after every `navigate_page` to a Wix HTML Component page, call `evaluate_script` to enumerate iframes and log the list; alert if expected iframe src is not present
- [ ] **4.3** **Tailwind CDN wait** — for ai_matcher and pages known to use Tailwind CDN, add `evaluate_script` polling: `() => typeof window.Tailwind !== 'undefined' || document.querySelectorAll('[class*="text-"]').length > 5`
- [ ] **4.4** **Blank screenshot guard** — after every `take_screenshot`, evaluate screenshot file size; if < 10KB, call `take_screenshot` again with `fullPage: false` (viewport-only) as fallback before marking as blank
- [ ] **4.5** **Network quiet check** — optional: call `list_network_requests` twice, 1.5s apart; if count is stable, page has finished async loading
- [ ] **4.6** **Selector versioning** — store all `selectorCSS` values in a `selectors.json` config file within the track directory; when a Wix component update changes a selector, update `selectors.json` without modifying the playbook
- [ ] **4.7** **Artifact validation** — before writing `quality_gate.json`, validate all referenced artifact paths actually exist on disk
- [ ] **4.8** **Console message deduplication** — `list_console_messages` with `includePreservedMessages: true` may return duplicates. Deduplicate by `(url, line, column, message)` tuple before writing to `console_audit.json`
- [ ] **4.9** **Known issue suppression** — maintain a `suppress_rules.json` file with patterns for known-OK console warnings (e.g., Wix internal hydration warnings that are cosmetic, not functional). Apply suppression before computing P-counts.
- [ ] **4.10** **Evidence Pack archival** — after a passing run, copy `quality_gate.json` to `artifacts/devtools/latest/quality_gate.json` for easy reference

**Phase 4 Acceptance Criteria:**
- Verification survives a Wix PostMessage race (KW-004)
- Verification survives a Tailwind CDN cold start (KW-005)
- Blank screenshot is detected and retried (KW-009-related)
- Console deduplication works — same error doesn't inflate P0 counts
- Known Wix internal warnings are suppressed and don't cause false FAIL results

---

## Artifact Directory Structure

```
artifacts/
└── devtools/
    ├── latest/
    │   └── quality_gate.json          ← symlink or copy of last passing run
    └── 2026-02-19T18-20-00Z/         ← run_id (ISO timestamp)
        ├── quality_gate.json
        ├── console_audit.json
        ├── network_audit.json
        └── visual_confirmation/
            ├── home.png
            ├── ai_matcher.png
            ├── driver_entry.png
            ├── carrier_entry.png
            └── app_flow.png
```

---

## Quick Reference: Evidence Pack Tool Calls

Cheat sheet for the agent during Phase 1 execution:

```
# Find and select the right tab
list_pages
select_page (pageId: N)

# Navigate
navigate_page (url: "...", timeout: 15000)

# Wait for content
wait_for (text: "...", timeout: 15000)

# 2s PostMessage dwell
evaluate_script (function: "async () => { await new Promise(r => setTimeout(r, 2000)); return 'done'; }")

# Console capture
list_console_messages (types: ["error","warning"], includePreservedMessages: true)
get_console_message (msgid: N)  ← for each error's stack trace

# Network capture
list_network_requests (resourceTypes: ["xhr","fetch","document"], includePreservedRequests: true)
get_network_request (reqid: N)  ← for each failed request detail

# Frame/selector check
evaluate_script (function: "() => ...")   ← see spec §5 for iframe enumeration JS
take_snapshot ()                          ← a11y tree includes all iframes

# PII blur → screenshot → unblur
evaluate_script (PII blur JS)
take_screenshot (fullPage: true, format: "png", filePath: "artifacts/devtools/{runId}/visual_confirmation/{name}.png")
evaluate_script (PII unblur JS)
```

---

*End of Plan — v2.0*
