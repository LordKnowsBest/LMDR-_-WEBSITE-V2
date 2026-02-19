# Chrome DevTools Runtime Verification — Specification

**Track:** `devtools_observability_20260219`
**Version:** 2.0 (rewritten — real chrome-devtools-mcp tools)
**Date:** 2026-02-19
**Status:** Planning

> **Source of truth:** All tool names, parameters, and behaviors are sourced directly from
> [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp)
> and its [tool reference](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md).

---

## 1. Purpose & Problem Statement

LMDR's development loop is **blind by default**: code is written and deployed to Wix without any agent-driven verification that it actually works in a live browser session. Silent failures are the norm:

- JavaScript exceptions inside Wix `<iframe>` HTML components look like content — they render blank space
- PostMessage bridge mismatches (wrong key names) never appear until a human clicks the right button
- Velo Web Method 500 errors are swallowed by the frontend's generic `catch` blocks
- CSS/layout regressions are invisible in code review

This track defines a **standardized Evidence Pack protocol** backed by the official **Chrome DevTools MCP server** (`chrome-devtools-mcp` by the Chrome DevTools team). Every Conductor track must produce a valid Evidence Pack before it can be marked `[x] DONE`.

---

## 2. Tooling: `chrome-devtools-mcp`

### 2.1 Package Identity

| Property | Value |
|----------|-------|
| **Package** | `chrome-devtools-mcp` (official, by ChromeDevTools team) |
| **npm** | `npx -y chrome-devtools-mcp@latest` |
| **Source** | https://github.com/ChromeDevTools/chrome-devtools-mcp |
| **Tool ref** | https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md |
| **Total tools** | **26**, across 6 categories |
| **Requirements** | Node.js v20.19+, Chrome stable+, npm |

### 2.2 The 26 Tools (Complete Enumeration)

#### Input Automation (8 tools)

| Tool | Description | LMDR Use |
|------|------------|----------|
| `click` | Click an element by CSS selector or uid | Trigger navigation, expand panels |
| `drag` | Drag an element | Not used in smoke tests |
| `fill` | Fill an input field | Form assertion (non-submit) |
| `fill_form` | Fill multiple form inputs at once | Multi-field forms |
| `handle_dialog` | Accept/dismiss browser dialogs | Dismiss Wix cookie banners |
| `hover` | Hover over an element | Tooltip inspection |
| `press_key` | Press a keyboard key | Trigger shortcuts |
| `upload_file` | Upload a file to an input | CDL document upload flow |

#### Navigation Automation (6 tools)

| Tool | Key Parameters | LMDR Use |
|------|--------------|----------|
| `list_pages` | none | Find the correct Wix Preview tab; detect editor vs preview |
| `select_page` | `pageId`, `bringToFront` | Switch to the correct tab after `list_pages` |
| `navigate_page` | `url`, `type`, `timeout`, `initScript` | Navigate to each critical path URL |
| `new_page` | `url`, `timeout` | Open fresh tab for a critical path |
| `wait_for` | `text`, `timeout` | Wait for known text to appear (readiness signal) |
| `close_page` | `pageId` | Clean up tabs after a verification run |

#### Emulation (2 tools)

| Tool | Key Parameters | LMDR Use |
|------|--------------|----------|
| `emulate` | device preset or custom settings | Desktop 1440×900 baseline |
| `resize_page` | width, height | Set viewport before screenshots |

#### Performance (3 tools — Phase 2)

| Tool | Key Parameters | LMDR Use |
|------|--------------|----------|
| `performance_start_trace` | none | Start a CDP trace before navigation |
| `performance_stop_trace` | none | End trace, get DevTools-readable output |
| `performance_analyze_insight` | insight name | Extract specific performance insight (e.g., LCP, layout shifts) |

#### Network (2 tools)

| Tool | Key Parameters | LMDR Use |
|------|--------------|----------|
| `list_network_requests` | `resourceTypes`, `pageSize`, `includePreservedRequests` | Get all XHR/Fetch requests since nav — filter for status ≥ 400 |
| `get_network_request` | `reqid`, `requestFilePath`, `responseFilePath` | Get full request/response detail for a specific failed request |

#### Debugging (5 tools)

| Tool | Key Parameters | LMDR Use |
|------|--------------|----------|
| `list_console_messages` | `types`, `pageSize`, `includePreservedMessages` | Get all console errors/warnings since navigation |
| `get_console_message` | `msgid` | Get full detail + stack trace for a specific console message |
| `evaluate_script` | `function`, `args` | Run JS in page context: DOM checks, iframe detection, readiness |
| `take_screenshot` | `filePath`, `fullPage`, `format`, `uid` | Capture full-page PNG for visual_confirmation/ |
| `take_snapshot` | `filePath`, `verbose` | a11y tree snapshot — use for selector verification instead of screenshots where possible |

### 2.3 Connection Strategy: `--autoConnect` (Primary)

**Chosen: `--autoConnect` flag (Chrome 144+)**

**Why autoConnect wins for Wix:**

The LMDR Wix portals sit behind Wix SSO. Any fresh Chrome instance launched by `chrome-devtools-mcp` starts with an empty profile — no Wix session, no cookies. The operator would need to manually authenticate every time the MCP server restarts.

`--autoConnect` connects to the **already-running** Chrome instance the developer has open (the one already authenticated into Wix). Chrome 144+ exposes a local remote-debugging server that `chrome-devtools-mcp` can attach to automatically.

**Setup steps (one-time, human operator):**

1. In your running Chrome instance navigate to `chrome://inspect/#remote-debugging`
2. Enable remote debugging in the prompt Chrome shows you
3. Log into Wix and open the LMDR Preview site — **leave this tab open**
4. In your MCP client config (`.gemini/settings.json`, `claude_desktop_config.json`, `cursor settings`, etc.):

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

**Fallback: `--browserUrl` (sandboxed/CI environments)**

If the agent runs in a sandboxed environment where autoConnect isn't available:

1. Close all Chrome instances
2. Launch Chrome with remote debugging:
   ```powershell
   "C:\Program Files\Google\Chrome\Application\chrome.exe" `
     --remote-debugging-port=9222 `
     --user-data-dir="$env:USERPROFILE\.lmdr-devtools-profile"
   ```
3. Manually authenticate into Wix in this new Chrome instance
4. Use MCP config:
   ```json
   {
     "mcpServers": {
       "chrome-devtools": {
         "command": "npx",
         "args": ["chrome-devtools-mcp@latest", "--browserUrl=http://127.0.0.1:9222"]
       }
     }
   }
   ```

The `--user-data-dir` flag creates a **persistent profile** — Wix cookies survive Chrome restarts as long as you use the same `--user-data-dir` path.

**⚠️ Security note (from official docs):** The remote debugging port allows any application on your machine to connect to and control Chrome. Do not browse sensitive sites (banking, etc.) while the debugging port is open.

---

## 3. Critical Path Definitions

For each path, the following is defined: URL, ready condition, required selectors, timeouts, and frame context.

### 3.1 `home` — LMDR Homepage

| Property | Value |
|----------|-------|
| **URL** | `https://www.lmdr.io` |
| **Navigate tool** | `navigate_page` with `url: "https://www.lmdr.io"` |
| **Ready condition** | `wait_for` text: "Find Your Next CDL Job" (or key hero copy) |
| **Selector assertion** | `evaluate_script` → `document.querySelector('.hero-cta-button, [data-hook="cta"]')` |
| **Snapshot** | `take_snapshot` — check CTA button present in a11y tree |
| **Screenshot** | `take_screenshot` with `fullPage: true`, `filePath: "artifacts/devtools/<run_id>/visual_confirmation/home.png"` |
| **Timeout** | 15,000 ms |
| **Frame context** | Main frame only (no Wix HTML Component iframes on homepage hero) |

### 3.2 `ai_matcher` — AI Matching Interface

| Property | Value |
|----------|-------|
| **URL** | Wix page containing `AI_MATCHING.html` (e.g., `/ai-matching`) |
| **Navigate tool** | `navigate_page` with `url: "{siteUrl}/ai-matching"` |
| **Ready condition** | `wait_for` text: "Find Your Match" or "AI Matching" (key heading inside iframe) |
| **Selector assertion** | `evaluate_script` → iframe frame detection → `#ai-matching-container` visibility |
| **Snapshot** | `take_snapshot` — inspect if iframe content appears in a11y tree |
| **Screenshot** | `take_screenshot` with `fullPage: true`, save to `ai_matcher.png` |
| **Timeout** | 20,000 ms (221KB HTML file + Tailwind CDN) |
| **Frame context** | **Wix iframe** — see §5 for frame selection protocol |

### 3.3 `driver_entry` — Driver Dashboard

| Property | Value |
|----------|-------|
| **URL** | Wix Driver Dashboard page |
| **Ready condition** | `wait_for` text: "My Applications" or "Driver Dashboard" |
| **Selector assertion** | `evaluate_script` → `#dashboard-container` or `.driver-dashboard` visible in iframe |
| **Screenshot** | `driver_entry.png` |
| **Timeout** | 15,000 ms |
| **Frame context** | Wix iframe (`DRIVER_DASHBOARD.html`) |

### 3.4 `carrier_entry` — Carrier Welcome / Onboarding

| Property | Value |
|----------|-------|
| **URL** | Wix Carrier Welcome page |
| **Ready condition** | `wait_for` text: "Welcome" or "Get Started" |
| **Selector assertion** | `evaluate_script` → `.status-steps` or `#onboarding-container` visible in iframe |
| **Screenshot** | `carrier_entry.png` |
| **Timeout** | 15,000 ms |
| **Frame context** | Wix iframe (`Carrier_Welcome.html`) |

### 3.5 `app_flow` — CDL Quick Apply Form

| Property | Value |
|----------|-------|
| **URL** | Quick Apply page |
| **Ready condition** | `wait_for` text: "Upload Your CDL" or "Quick Apply" |
| **Selector assertion** | `evaluate_script` → `#cdl-upload-btn` or `.upload-section` visible |
| **Screenshot** | `app_flow.png` |
| **Timeout** | 15,000 ms |
| **Non-destructive** | ✅ NEVER submit. Verify element existence only. |
| **Frame context** | Wix iframe |

---

## 4. "Ready" Definition

A page is **READY** when ALL three conditions are true:

1. **`navigate_page` completes** — the tool awaits page load automatically (Puppeteer-backed)
2. **`wait_for` succeeds** — a known visible text string from the page content is found within timeout
3. **2-second dwell** after `wait_for` — implemented via `evaluate_script` calling `await new Promise(r => setTimeout(r, 2000))` — accounts for Wix PostMessage bridge latency (page code → iframe data handshake takes 500ms–2s)

**Do NOT rely on `document.readyState` alone.** Wix Thunderbolt continues hydrating components after `readyState === 'complete'`.

### Network Quiet Signal (Optional Hardening)

After the dwell, optionally check for network quiet by comparing `list_network_requests` result twice, 1.5 seconds apart. If the count stabilizes (no new requests), the page has finished its async data fetching.

---

## 5. Wix/Velo iframe Frame Context

### The Core Problem

LMDR's UIs are **Wix HTML Components** — `<iframe>` elements hosted at `static.parastorage.com` (a different origin from `www.lmdr.io`). This means:

- `evaluate_script` running in the **main page** cannot reach inside the iframe DOM via standard selectors
- Console errors thrown inside the iframe are captured at the **page level** by `list_console_messages` (Chrome DevTools protocol sees all frames)
- Screenshots via `take_screenshot` capture the **full composited page** including rendered iframes — so screenshots correctly show iframe content

### Frame Detection via `evaluate_script`

**Step 1:** Detect which iframes are on the page:
```javascript
// evaluate_script function:
() => {
  return Array.from(document.querySelectorAll('iframe')).map(f => ({
    id: f.id, name: f.name,
    src: f.src.substring(0, 120),
    width: f.offsetWidth, height: f.offsetHeight
  }));
}
```

**Step 2:** Identify the target iframe by its `src` containing the file name (e.g., `AI_MATCHING`, `DRIVER_DASHBOARD`).

**Step 3:** To run JS **inside** the iframe, use `evaluate_script` with `initScript` during navigation, OR use Puppeteer's frame API (if the MCP server exposes it). Alternatively:
- Use `take_snapshot` — the a11y tree aggregates **all frames** into a unified tree. If the iframe content is accessible, its elements appear in the snapshot regardless of origin.
- If `take_snapshot` shows iframe content, use `uid` values from the snapshot to perform targeted assertions with `click`, `fill`, or `evaluate_script`.

**Step 4 (fallback):** If the iframe is cross-origin and `evaluate_script` cannot reach inside, use `wait_for` with text that only appears in the iframe content — this proves the iframe rendered successfully without needing direct DOM access.

### False Positive Prevention

**Use `list_pages` first.** Before beginning any verification:

```
Call: list_pages
→ Find page whose URL matches preview.wixsite.com/lmdr or www.lmdr.io
→ Call: select_page with that pageId
→ Proceed with verification on the correct tab
```

**Never attach to** `editor.wix.com` or `manage.wix.com` tabs — those generate their own console errors that would pollute the Evidence Pack.

---

## 6. Evidence Pack Schema

All artifacts stored under `artifacts/devtools/<run_id>/`
where `run_id` is an ISO-8601 timestamp string: `2026-02-19T18-20-00Z`

### 6.1 `console_audit.json`

**Source tool:** `list_console_messages` (get all messages) + `get_console_message` (get stack traces for P0 entries)

**`list_console_messages` parameters used:**
- `types: ["error", "warning"]` — filter to errors and warnings only
- `includePreservedMessages: true` — capture messages from before the last navigation too
- `pageSize: 500` — capture up to 500 messages

**Schema:**
```json
{
  "run_id": "2026-02-19T18-20-00Z",
  "page": "ai_matcher",
  "url": "https://www.lmdr.io/ai-matching",
  "captured_at": "2026-02-19T18:21:30Z",
  "tool_used": "list_console_messages + get_console_message",
  "summary": {
    "total_errors": 2,
    "total_warnings": 1,
    "p0_errors": 1,
    "velo_worker_errors": 1
  },
  "entries": [
    {
      "msgid": 42,
      "severity": "ERROR",
      "timestamp": "2026-02-19T18:21:12.345Z",
      "message": "Uncaught TypeError: Cannot read properties of undefined (reading 'memberId')",
      "stack": "TypeError: Cannot read...\n  at initDashboard (AI_MATCHING.html:142:22)",
      "url": "https://static.parastorage.com/.../AI_MATCHING.html",
      "line": 142,
      "column": 22,
      "classification": "P0",
      "is_velo_error": false,
      "redacted": false
    }
  ]
}
```

**Velo Worker error detection:** `list_console_messages` captures **all frames** including Wix worker contexts. Tag entries as `is_velo_error: true` when `message` matches any of:
- `/Wix code error/i`
- `/WDE\d+/`
- `/Backend function error/i`

**PII scrubbing:** Before writing `console_audit.json`, regex-scrub message text for:
- Emails: `/\b[\w.+-]+@[\w-]+\.[\w.]+\b/g` → `[EMAIL_REDACTED]`
- Phone: `/\b(\+1)?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g` → `[PHONE_REDACTED]`
- SSN: `/\b\d{3}-\d{2}-\d{4}\b/g` → `[SSN_REDACTED]`

### 6.2 `network_audit.json`

**Source tool:** `list_network_requests` → then `get_network_request` for each failure

**`list_network_requests` parameters used:**
- `resourceTypes: ["xhr", "fetch", "document"]` — focus on data requests, not assets
- `includePreservedRequests: true` — catch requests from before last nav

**Schema:**
```json
{
  "run_id": "2026-02-19T18-20-00Z",
  "page": "ai_matcher",
  "url": "https://www.lmdr.io/ai-matching",
  "captured_at": "2026-02-19T18:21:30Z",
  "tool_used": "list_network_requests + get_network_request",
  "summary": {
    "total_xhr_fetch_requests": 12,
    "failed_requests": 1,
    "server_errors_5xx": 1,
    "client_errors_4xx": 0,
    "network_failures": 0
  },
  "failed_requests": [
    {
      "reqid": 7,
      "method": "POST",
      "url": "https://www.lmdr.io/_functions/getCarrierMatches",
      "status": 500,
      "resource_type": "xhr",
      "failure_reason": "HTTP 500 — Velo Web Method server error",
      "error_type": "SERVER_ERROR",
      "duration_ms": 1240
    }
  ]
}
```

**URL token scrubbing:** Strip sensitive query params before writing:
- Remove: `access_token`, `token`, `session`, `api_key`
- Never log response body (may contain PII)

### 6.3 `visual_confirmation/`

**Source tool:** `take_screenshot`

**Parameters:**
- `fullPage: true` — full-page capture using CDP `Page.captureScreenshot` with `captureBeyondViewport: true`
- `format: "png"` — lossless for UI inspection
- `filePath: "<absolute_path>/visual_confirmation/<name>.png"` — saves directly to disk

**Required files:**

| Filename | Page | Pass Condition |
|----------|------|---------------|
| `home.png` | Homepage | File > 10KB; hero section visible (non-blank) |
| `ai_matcher.png` | AI Matching | File > 10KB; iframe content rendered (not blank white box) |
| `driver_entry.png` | Driver Dashboard | File > 10KB; dashboard content visible |
| `carrier_entry.png` | Carrier Welcome | File > 10KB; onboarding content visible |
| `app_flow.png` | Quick Apply | File > 10KB; upload section visible |

**PII blurring before screenshot:** Use `evaluate_script` to inject CSS blur on PII selectors immediately before calling `take_screenshot`:

```javascript
// evaluate_script function — run in main frame or iframe frame
() => {
  const PII_SELECTORS = [
    'input[type="email"]', 'input[name*="phone"]',
    'input[name*="name"]', '.member-name', '.driver-email',
    '[data-pii="true"]'
  ];
  PII_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.style.filter = 'blur(8px)';
    });
  });
  return 'PII blurred';
}
```

### 6.4 `quality_gate.json`

**Source:** Aggregated from all other artifacts by the agent after all page verification steps complete.

**Schema:**
```json
{
  "run_id": "2026-02-19T18-20-00Z",
  "timestamp": "2026-02-19T18:25:00Z",
  "pass": false,
  "reasons": [
    "FAIL: 1 P0 error on ai_matcher — Uncaught TypeError at AI_MATCHING.html:142",
    "PASS: All critical selectors visible on home",
    "FAIL: 1 HTTP 500 on ai_matcher — /_functions/getCarrierMatches",
    "PASS: All 5 screenshots captured and non-blank"
  ],
  "checks": {
    "zero_p0_errors": false,
    "all_critical_selectors_visible": true,
    "all_pages_reached_ready_state": true,
    "zero_network_500_errors": false,
    "screenshots_captured": true,
    "zero_velo_worker_fatal_errors": true
  },
  "pages_evaluated": ["home", "ai_matcher", "driver_entry", "carrier_entry", "app_flow"],
  "pages_failed_ready": [],
  "p0_error_count": 1,
  "p1_error_count": 0,
  "p2_warning_count": 2,
  "network_failures": 1,
  "artifact_paths": {
    "console_audit": "artifacts/devtools/2026-02-19T18-20-00Z/console_audit.json",
    "network_audit": "artifacts/devtools/2026-02-19T18-20-00Z/network_audit.json",
    "screenshots": "artifacts/devtools/2026-02-19T18-20-00Z/visual_confirmation/",
    "quality_gate": "artifacts/devtools/2026-02-19T18-20-00Z/quality_gate.json"
  }
}
```

**Pass criteria (ALL must be `true`):**

| Check | Rule |
|-------|------|
| `zero_p0_errors` | `list_console_messages` returns zero ERROR entries with uncaught exception text |
| `all_critical_selectors_visible` | `evaluate_script` confirms each required selector exists AND has `offsetWidth > 0` |
| `all_pages_reached_ready_state` | All 5 `wait_for` calls completed without timeout |
| `zero_network_500_errors` | `list_network_requests` returns zero requests with `status >= 500` from LMDR endpoints |
| `screenshots_captured` | All 5 PNG files exist and are > 10KB |
| `zero_velo_worker_fatal_errors` | No `list_console_messages` entries match Velo error patterns |

---

## 7. CDP Domain Reference

All CDP methods are invoked transparently by `chrome-devtools-mcp`. Listed here for traceability per spec requirement.

| `chrome-devtools-mcp` Tool | CDP Domain / Method | What It Does |
|---------------------------|--------------------|----|
| `list_pages` | `Target.getTargets` | Returns all open browser tabs |
| `select_page` | `Target.activateTarget` | Focuses a specific tab for subsequent commands |
| `navigate_page` | `Page.navigate` + `Page.loadEventFired` | Navigates and waits for page load |
| `wait_for` | `Runtime.evaluate` (polling) | Waits for text to appear via DOM scanning |
| `list_console_messages` | `Console.enable` + `Console.messageAdded` / `Log.enable` | Collects all console output since nav |
| `get_console_message` | `Console.messageAdded` (by msgid) | Gets stack trace for a specific message |
| `list_network_requests` | `Network.enable` + `Network.responseReceived` + `Network.loadingFailed` | Lists all network requests since nav |
| `get_network_request` | `Network.getResponseBody` | Gets request/response body for a specific request |
| `evaluate_script` | `Runtime.evaluate` (in page context) | Runs arbitrary JS in the page; returns JSON |
| `take_screenshot` | `Page.captureScreenshot` (`captureBeyondViewport: true`) | Full-page PNG |
| `take_snapshot` | `Accessibility.getFullAXTree` | a11y tree (all frames aggregated) |
| `performance_start_trace` | `Tracing.start` | Begins a CDP performance trace |
| `performance_stop_trace` | `Tracing.end` | Ends trace, routes to DevTools analysis |
| `performance_analyze_insight` | DevTools Performance panel | Extracts specific insight (LCP, CLS, etc.) |
| `emulate` | `Emulation.setDeviceMetricOverride` | Sets viewport, UA, DPR |
| `resize_page` | `Emulation.setVisibleSize` | Resizes the viewport |

---

## 8. Security Requirements

### 8.1 Non-Destructive Verification (Non-Negotiable)

| Action | Restriction | Reason |
|--------|------------|--------|
| Driver application form submit | ❌ NEVER | Creates real Airtable `DriverProfiles` records |
| Carrier lead form submit | ❌ NEVER | Triggers Stripe/email workflows |
| Payment flow trigger | ❌ NEVER | Initiates live Stripe sessions |
| Send message | ❌ NEVER | Creates real `Messages` records |
| Social post publish | ❌ NEVER | Posts to live Facebook/Instagram |

**Enforcement:** `fill` and `fill_form` tools are allowed for populating test data. `click` on submit buttons is **prohibited**. Use `take_snapshot` or `take_screenshot` to confirm form readiness without submitting.

### 8.2 PII Handling

- `list_console_messages` output must be PII-scrubbed (regex patterns per §6.1) before writing to `console_audit.json`
- `list_network_requests` — strip auth tokens from URLs; never log response bodies
- Screenshots — inject CSS blur on PII selectors via `evaluate_script` before every `take_screenshot` call
- Agent must verify that no artifact file contains any email/phone/SSN pattern before committing to artifact directory

### 8.3 Secrets & Tokens

- `get_network_request` with `responseFilePath` must NOT be called on endpoints that return tokens (e.g., `/_functions/getAuthToken`)
- If a network request URL contains `access_token`, `session`, or `api_key` query params — strip them before logging

---

## 9. Wix/Velo Context Constraints

### `evaluate_script` Scope

`evaluate_script` runs in the **main page frame** by default. For pages where LMDR content is inside a `<iframe>` (which is almost all pages), this means:

- ✅ Can detect iframe presence: `document.querySelectorAll('iframe')` works
- ❌ Cannot read iframe's internal DOM via `document.querySelector` (cross-origin)
- ✅ **Workaround A:** `take_snapshot` aggregates the a11y tree across all frames — use it to verify iframe content rendered
- ✅ **Workaround B:** `wait_for` with iframe-specific text — proves the iframe rendered without needing DOM access
- ✅ **Workaround C:** `take_screenshot` with `fullPage: true` captures the composited page including iframe visual content — a blank white box where the iframe should be is a clear P0 visual signal

### `list_console_messages` Scope

**✅ This tool captures ALL frames**, including iframes, because Chrome DevTools Protocol tracks console messages at the browser level across all execution contexts. A Velo backend error thrown inside the iframe's JS will appear in `list_console_messages`. This is the key advantage of `chrome-devtools-mcp` over approaches that only listen to the main page.

### Chrome Version Requirement

`--autoConnect` requires **Chrome 144+**. The `--browserUrl` fallback works with any Chrome version that supports `--remote-debugging-port`.

### Wix SSO Guard

**Detection:** Call `list_pages` at the start of every run. If any page URL contains `users.wix.com`, the session has expired.

**Response:** Abort run with error:
```
ABORT: Wix session expired — URL redirected to users.wix.com.
Action: Navigate Chrome to users.wix.com, log in, then retry.
```

---

## 10. Out of Scope

- **Accessibility audits** — `take_snapshot` is used only for selector verification, not WCAG compliance
- **Cross-browser testing** — Chromium/Chrome only
- **CI/CD integration** — agent-driven manual protocol; CI is Phase 3+
- **Mobile viewport testing** — desktop-first (1440×900); mobile is `mobile_optimization_20260122`
- **Visual regression diffing** — screenshots are for human review; pixel-diff comparison is not in MVP
- **Load testing** — this is a smoke test, not a performance benchmark

---

*End of Specification — v2.0*
