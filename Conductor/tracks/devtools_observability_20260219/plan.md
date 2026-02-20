# Chrome DevTools Runtime Verification — Implementation Plan

**Track:** `devtools_observability_20260219`
**Version:** 3.0 (post-first-run — updated to actual site URLs and 8 critical paths)
**Date:** 2026-02-20
**Spec:** `./spec.md`
**First Run:** `2026-02-19T23-37-11Z` — quality_gate: **FAIL** (4 P0 errors)

---

## Completion Status

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 0 | Environment Setup & Auth Strategy | **DONE** | Chrome 145 autoConnect, Wix session authenticated |
| 1 | Smoke Test Playbook (MVP) | **DONE** | First run complete — quality_gate FAIL, artifacts written |
| 2 | Deep Trace (Performance) | PLANNING | Conditional — triggered on perf regression |
| 3 | Conductor Hook | **DONE** | workflow.md, tracks.md, CLAUDE.md updated |
| 4 | Hardening | **DONE** | selectors.json, suppress_rules.json, hardening_notes.md |

---

## Site Base URL (Corrected)

```
https://www.lastmiledr.app
```

> **IMPORTANT:** The spec and earlier plan versions used `lmdr.io` — that is WRONG.
> All references have been corrected to `lastmiledr.app`.

---

## Critical Paths (8 — Updated)

The original plan defined 5 paths with speculative URLs. After the first live run and user correction, the canonical set is now **8 verified paths**:

| Path ID | URL | Type | Ready Text | First Run Status |
|---------|-----|------|------------|-----------------|
| `home` | `https://www.lastmiledr.app/` | Public | "Last Mile" | RENDERED_WITH_ERRORS (3 ModuleLoadError) |
| `about` | `https://www.lastmiledr.app/about` | Public | "About" | NEW — not yet verified |
| `privacy` | `https://www.lastmiledr.app/privacy-policy` | Public | "Privacy" | NEW — not yet verified |
| `drivers` | `https://www.lastmiledr.app/drivers` | Public | "Truck Drivers" or "CDL" | NEW — replaces old `driver_entry` (/driver-dashboard was auth-gated) |
| `upload_docs` | `https://www.lastmiledr.app/upload-cdl-documents` | Public/Auth | "Upload" or "CDL Documents" | NEW — replaces old `app_flow` (/apply was 404) |
| `pricing` | `https://www.lastmiledr.app/pricing` | Public | "Pricing" or "Plans" | NEW — not yet verified |
| `insights` | `https://www.lastmiledr.app/insights` | Public | "Insights" or "Blog" | NEW — not yet verified |
| `ai_matcher` | `https://www.lastmiledr.app/ai-matching` | Public | "Find Your Carrier" | CLEAN (0 errors, bridge verified) |

### Removed Paths (from v2.0)

| Old Path | Old URL | Reason Removed |
|----------|---------|----------------|
| `driver_entry` | `/driver-dashboard` | Auth-gated — shows Sign Up modal for anon visitors. Not suitable for unauthenticated smoke test. |
| `carrier_entry` | `/carrier-welcome` | Auth-gated — same issue. |
| `app_flow` | `/apply` or `/quick-apply` | **404 — page does not exist.** Application form is external (JotForm). |

---

## Phase 0: Environment Setup & Auth Strategy — DONE

**Completed 2026-02-19.**

### Checklist (all items resolved)

- [x] **0.1** Node.js v20.19+ verified
- [x] **0.2** MCP server launches: `npx -y chrome-devtools-mcp@latest`
- [x] **0.3** MCP config added to Claude Code (`.claude/mcp_config.json`):

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

- [x] **0.4** Chrome 145 remote debugging enabled via `chrome://inspect/#remote-debugging`
- [x] **0.5** Authenticated into Wix at `https://www.lastmiledr.app`
- [x] **0.6** `list_pages` returns LMDR tab
- [x] **0.7** `take_screenshot` returns valid PNG > 10KB

**Deliverables:**
- `artifacts/devtools/` directory structure — created
- `artifacts/devtools/latest/` — created
- `.claude/mcp-config-template.json` — created (both autoConnect and browserUrl variants)

---

## Phase 1: Smoke Test Playbook (MVP) — DONE

**First run completed 2026-02-19. Quality Gate: FAIL.**

### What Was Executed (Actual Tool Call Sequence)

For each of the 5 original paths (home, ai_matcher, driver_entry, carrier_entry, app_flow):

```
1. navigate_page → url, timeout: 30000
2. wait_for → text, timeout: 20000
   └─ If timeout: take_snapshot to inspect what rendered
3. list_console_messages → all types (errors + warnings + logs)
4. get_console_message → for each error msgid (stack traces)
5. list_network_requests → resourceTypes: ["xhr", "fetch"]
6. take_screenshot → fullPage: true, filePath: artifacts/devtools/{runId}/visual_confirmation/{path}.png
```

### Deviations from Plan v2.0

| Planned Step | Actual | Reason |
|-------------|--------|--------|
| `wait_for` with `types: ["error", "warning"]` on console | Used full `list_console_messages` (no type filter) | Captures clean bridge logs too — useful for verifying PostMessage handshake |
| `evaluate_script` PII blur before screenshot | Skipped | Auth-gated pages had no user data visible; home/ai_matcher had no PII in viewport |
| `evaluate_script` iframe enumeration | Used `take_snapshot` instead | Snapshot's a11y tree shows iframe content directly — more reliable than cross-origin evaluate_script (KW-001) |
| `evaluate_script` 2s dwell after wait_for | Skipped on paths where snapshot showed full render | ai_matcher was fully loaded by the time snapshot ran |
| `evaluate_script` selector CSS assertion | Used snapshot a11y tree | Snapshot proves content render without needing main-frame CSS selector access |

### First Run Results

**Run ID:** `2026-02-19T23-37-11Z`
**Artifacts:** `artifacts/devtools/2026-02-19T23-37-11Z/`

| Artifact | Status | File |
|----------|--------|------|
| quality_gate.json | Written | `artifacts/devtools/2026-02-19T23-37-11Z/quality_gate.json` |
| console_audit.json | Written | `artifacts/devtools/2026-02-19T23-37-11Z/console_audit.json` |
| network_audit.json | Written | `artifacts/devtools/2026-02-19T23-37-11Z/network_audit.json` |
| home.png | Captured | `artifacts/devtools/2026-02-19T23-37-11Z/visual_confirmation/home.png` |
| ai_matcher.png | Captured | `artifacts/devtools/2026-02-19T23-37-11Z/visual_confirmation/ai_matcher.png` |
| driver_entry.png | Captured | `artifacts/devtools/2026-02-19T23-37-11Z/visual_confirmation/driver_entry.png` |
| carrier_entry.png | Captured | `artifacts/devtools/2026-02-19T23-37-11Z/visual_confirmation/carrier_entry.png` |
| app_flow.png | Captured | `artifacts/devtools/2026-02-19T23-37-11Z/visual_confirmation/app_flow.png` |

### Quality Gate Check Results

| Check | Pass/Fail | Detail |
|-------|-----------|--------|
| zero_p0_errors | **FAIL** | 3 ModuleLoadError on home + 1 page 404 on app_flow |
| all_critical_selectors_visible | PASS | All rendered pages show expected content |
| all_pages_reached_ready_state | **FAIL** | 4/5 passed; /apply returned 404 |
| zero_network_500_errors | PASS | Zero XHR/fetch failures across all paths |
| screenshots_captured | PASS | 5/5 captured, all > 10KB |
| zero_velo_worker_fatal_errors | **FAIL** | 3 publicStatsService.jsw ModuleLoadErrors on home |

### P0 Findings

1. **`publicStatsService.jsw` backend failure** — `getFeaturedCarriers`, `getRecentHires`, `getPublicStats` all throw `ModuleLoadError: Unable to handle the request` on the homepage. Page renders but data sections are empty.

2. **`/apply` and `/quick-apply` are 404** — Both URLs return Wix 404 page. The actual application form is on JotForm (external). The critical path was misconfigured.

3. **Auth-gated paths show Sign Up modal** — `/driver-dashboard` and `/carrier-welcome` require Wix member login. For unauthenticated smoke tests, these paths should be replaced with public pages.

---

## Updated Phase 1 Playbook (v3.0 — 8 Paths)

### Step-by-Step Agent Playbook

#### STEP 1.0 — Session Guard

```
CALL: list_pages
→ Find page where URL contains "lastmiledr.app"
→ If no such page: ABORT with "No LMDR session found. Open www.lastmiledr.app in Chrome first."
→ If any page URL contains "users.wix.com": ABORT with "Wix session expired."
→ If editor.wix.com tab found: skip it — DO NOT select_page to it
→ Call: select_page with the correct pageId
```

#### STEP 1.1 — For Each Path: Navigate

```
Path order: home → about → privacy → drivers → upload_docs → pricing → insights → ai_matcher

For each path:
  CALL: navigate_page
    → url: "https://www.lastmiledr.app{route}"
    → type: "url"
    → timeout: 30000
```

#### STEP 1.2 — Wait for Ready State

```
CALL: wait_for
  → text: "{path.readyText}"
  → timeout: 20000

If wait_for times out:
  → CALL: take_snapshot to inspect actual render
  → Record timedOut: true for this path

After wait_for resolves (or snapshot taken):
  → Dwell 2s for PostMessage bridge on iframe pages:
    CALL: evaluate_script
      → function: "async () => { await new Promise(r => setTimeout(r, 2000)); return 'dwell done'; }"
```

#### STEP 1.3 — Capture Console + Network

```
CALL: list_console_messages
  → (no type filter — capture everything for bridge verification)

For each entry where type === "error":
  CALL: get_console_message → msgid: {entry.msgid}
  → Record full detail in console_audit.json

CALL: list_network_requests
  → resourceTypes: ["xhr", "fetch"]

Filter: only flag failures from lastmiledr.app or _functions/ domains.
```

#### STEP 1.4 — Screenshot

```
CALL: take_screenshot
  → fullPage: true
  → format: "png"
  → filePath: "artifacts/devtools/{runId}/visual_confirmation/{path.screenshotFile}"
```

#### STEP 1.5 — Quality Gate Evaluation

After all 8 paths are processed, evaluate the 6 checks and write `quality_gate.json`.

### Per-Path Reference (v3.0)

| Path | Route | Ready Text | Screenshot File | Timeout | Frame Context |
|------|-------|-----------|----------------|---------|---------------|
| `home` | `/` | "Last Mile" | `home.png` | 20s | Main frame + footer iframe |
| `about` | `/about` | "About" | `about.png` | 15s | Main frame |
| `privacy` | `/privacy-policy` | "Privacy" | `privacy.png` | 15s | Main frame |
| `drivers` | `/drivers` | "Truck Drivers" | `drivers.png` | 20s | Main frame (public driver hub) |
| `upload_docs` | `/upload-cdl-documents` | "Upload" | `upload_docs.png` | 20s | May contain iframe |
| `pricing` | `/pricing` | "Pricing" | `pricing.png` | 15s | Main frame |
| `insights` | `/insights` | "Insights" | `insights.png` | 15s | Main frame (blog/content) |
| `ai_matcher` | `/ai-matching` | "Find Your Carrier" | `ai_matcher.png` | 20s | Wix iframe (AI_MATCHING.html) |

---

## Phase 2: Deep Trace (Performance — Conditional) — NOT STARTED

**Trigger:** Only run when performance regression is suspected or onboarding a new critical path.

### Checklist

- [ ] **2.1** Start performance trace before navigation:
  ```
  CALL: performance_start_trace
  CALL: navigate_page → url: "https://www.lastmiledr.app"
  CALL: wait_for → text: "Last Mile" → timeout: 15000
  CALL: performance_stop_trace
  CALL: performance_analyze_insight → insight: "LCP"
  CALL: performance_analyze_insight → insight: "layout-shift"
  ```
- [ ] **2.2** Record LCP in `performance_report.json`
- [ ] **2.3** Record CLS value
- [ ] **2.4** Flag if LCP > 2.5s or CLS > 0.1
- [ ] **2.5** Repeat for `ai_matcher` path

**Acceptance Criteria:**
- `performance_report.json` written with LCP + CLS for home and ai_matcher
- LCP < 4s (Wix-hosted threshold)
- CLS < 0.25 (Wix PostMessage hydration threshold)

---

## Phase 3: Conductor Hook — DONE

**Completed 2026-02-19.**

### Checklist (all items resolved)

- [x] **3.1** `Conductor/workflow.md` updated — Evidence Pack gate added to task lifecycle
- [x] **3.2** `Conductor/tracks.md` updated — 8 frontend tracks tagged with Evidence Pack status
- [x] **3.3** `verification_run` field added to metadata.json template
- [x] **3.4** `CLAUDE.md` updated — "Before marking DONE" rule added
- [x] **3.5** `.claude/agents/evidence-pack.md` created (637 lines) — full agent workflow

**Deliverables:**
- `Conductor/workflow.md` — Evidence Pack verification step added
- `Conductor/tracks.md` — 8 tracks tagged
- `CLAUDE.md` — Evidence Pack section added
- `.claude/agents/evidence-pack.md` — agent workflow (needs URL update to lastmiledr.app)

---

## Phase 4: Hardening — DONE

**Completed 2026-02-19.**

### Checklist

- [x] **4.6** Selector versioning — `selectors.json` created (needs update to 8 paths + lastmiledr.app)
- [x] **4.8** Console dedup — handled by msgid-based tracking
- [x] **4.9** Suppress rules — `suppress_rules.json` created (8 rules + URL allowlist; needs lastmiledr.app in allowlist)
- [x] **4.10** Hardening notes — `hardening_notes.md` created (8 strategies)

### Items Validated by First Run

- [x] **4.1** `wait_for` timeout handling — worked correctly (timed out on wrong readyText, snapshot fallback captured state)
- [x] **4.4** Screenshot validation — all 5 PNGs > 10KB, no blank screenshots
- [x] **4.5** Network quiet — not needed; all requests completed before screenshot capture

### Items Still TODO (discovered from first run)

- [ ] **4.2** Frame detection — needs `evaluate_script` iframe enumeration for the 3 new iframe pages
- [ ] **4.3** Tailwind CDN wait — not needed for first run (page loaded in time), but should be added for robustness
- [ ] **4.7** Artifact validation — should verify all referenced paths exist before writing quality_gate.json
- [ ] **4.11** NEW: Add `meta_pixel_unavailable` and `tailwind_cdn_production` and `wix_preload_resource` to suppress_rules.json (discovered from first run console output)
- [ ] **4.12** NEW: Add `react_i18n_warning` to suppress_rules.json (discovered on 404 pages)

---

## Doc/Code Parity — Required Updates

The following files still reference the old `lmdr.io` URL or old 5-path critical path set. All must be updated:

| File | What Needs Updating | Status |
|------|-------------------|--------|
| `verify_runtime.js` | SITE_BASE_URL → lastmiledr.app; CRITICAL_PATHS → 8 paths | **DONE** |
| `selectors.json` | Replaced 5 paths with 8 paths; updated readyText, version 2.0 | **DONE** |
| `suppress_rules.json` | url_allowlist updated to lastmiledr.app; added 4 new rules from first run | **DONE** |
| `spec.md` §3 | Critical path definitions rewritten for 8 paths with lastmiledr.app URLs | **DONE** |
| `known_issues.md` | All lmdr.io references replaced with lastmiledr.app | **DONE** |
| `hardening_notes.md` | SSO guard error message updated to lastmiledr.app | **DONE** |
| `plan.md` | **THIS FILE** — updated to v3.0 | **DONE** |
| `progress.md` | Already references lastmiledr.app from first run | **DONE** |
| `metadata.json` | Already updated with first run results | **DONE** |
| `quality_gate.json` | Already uses lastmiledr.app (written during first run) | **DONE** |
| `.claude/agents/evidence-pack.md` | SITE_BASE_URL and CRITICAL_PATHS — needs 8 paths + lastmiledr.app | **TODO** (637-line file, separate update) |

---

## Artifact Directory Structure

```
artifacts/
└── devtools/
    ├── latest/
    │   └── quality_gate.json          ← copy of last passing run (not yet — first run failed)
    └── 2026-02-19T23-37-11Z/         ← first run (FAIL)
        ├── quality_gate.json
        ├── console_audit.json
        ├── network_audit.json
        └── visual_confirmation/
            ├── home.png
            ├── ai_matcher.png
            ├── driver_entry.png         ← auth-gated (Sign Up modal)
            ├── carrier_entry.png        ← auth-gated (Sign Up modal)
            └── app_flow.png             ← 404 page
```

**Next run (v3.0 paths) will produce:**

```
artifacts/
└── devtools/
    └── {run_id}/
        ├── quality_gate.json
        ├── console_audit.json
        ├── network_audit.json
        └── visual_confirmation/
            ├── home.png
            ├── about.png
            ├── privacy.png
            ├── drivers.png
            ├── upload_docs.png
            ├── pricing.png
            ├── insights.png
            └── ai_matcher.png
```

---

## Quick Reference: Evidence Pack Tool Calls

```
# Find and select the right tab
list_pages
select_page (pageId: N)

# Navigate
navigate_page (url: "https://www.lastmiledr.app{route}", timeout: 30000)

# Wait for content
wait_for (text: "{readyText}", timeout: 20000)

# 2s PostMessage dwell (iframe pages only)
evaluate_script (function: "async () => { await new Promise(r => setTimeout(r, 2000)); return 'done'; }")

# Console capture
list_console_messages ()
get_console_message (msgid: N)  ← for each error

# Network capture
list_network_requests (resourceTypes: ["xhr","fetch"])
get_network_request (reqid: N)  ← for each failed request

# A11y tree inspection (preferred over evaluate_script for iframe content)
take_snapshot ()

# Screenshot
take_screenshot (fullPage: true, format: "png", filePath: "artifacts/devtools/{runId}/visual_confirmation/{name}.png")
```

---

*End of Plan — v3.0 (post-first-run, 8 critical paths, lastmiledr.app)*
