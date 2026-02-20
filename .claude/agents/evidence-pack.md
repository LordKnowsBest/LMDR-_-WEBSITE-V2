---
name: evidence-pack
description: Run the LMDR DevTools Evidence Pack verification — captures console errors, network failures, screenshots, and a11y snapshots across 8 critical paths to produce a quality_gate.json
tools:
  - Read
  - Write
  - Bash
  - Glob
  - mcp__chrome-devtools__list_pages
  - mcp__chrome-devtools__select_page
  - mcp__chrome-devtools__navigate_page
  - mcp__chrome-devtools__wait_for
  - mcp__chrome-devtools__evaluate_script
  - mcp__chrome-devtools__list_console_messages
  - mcp__chrome-devtools__get_console_message
  - mcp__chrome-devtools__list_network_requests
  - mcp__chrome-devtools__get_network_request
  - mcp__chrome-devtools__take_screenshot
  - mcp__chrome-devtools__take_snapshot
---

# Evidence Pack Agent Workflow

You will execute the LMDR DevTools Evidence Pack verification protocol — a comprehensive runtime verification that produces quality gate artifacts for production readiness assessment.

## Critical Configuration

```javascript
SITE_BASE_URL = 'https://www.lastmiledr.app'
RUN_ID = <ISO-8601 timestamp with colons replaced by dashes, e.g., "2026-02-19T18-20-00Z">
ARTIFACT_ROOT = <absolute path to project>/artifacts/devtools/<RUN_ID>

CRITICAL_PATHS = {
  home: {
    route: '/',
    readyText: 'Last Mile',
    selectorCSS: '.hero-cta-button, [data-hook="cta-button"], .hero-section',
    iframeMatch: null,
    timeoutMs: 20000,
    screenshotFile: 'home.png',
    nonDestructive: false
  },
  about: {
    route: '/about',
    readyText: 'About',
    selectorCSS: null,
    iframeMatch: null,
    timeoutMs: 15000,
    screenshotFile: 'about.png',
    nonDestructive: false
  },
  privacy: {
    route: '/privacy-policy',
    readyText: 'Privacy',
    selectorCSS: null,
    iframeMatch: null,
    timeoutMs: 15000,
    screenshotFile: 'privacy.png',
    nonDestructive: false
  },
  drivers: {
    route: '/drivers',
    readyText: 'Truck Drivers',
    selectorCSS: null,
    iframeMatch: null,
    timeoutMs: 20000,
    screenshotFile: 'drivers.png',
    nonDestructive: false
  },
  upload_docs: {
    route: '/upload-cdl-documents',
    readyText: 'Upload',
    selectorCSS: '#cdl-upload-btn, .upload-section',
    iframeMatch: null,
    timeoutMs: 20000,
    screenshotFile: 'upload_docs.png',
    nonDestructive: true  // NEVER click submit buttons
  },
  pricing: {
    route: '/pricing',
    readyText: 'Pricing',
    selectorCSS: null,
    iframeMatch: null,
    timeoutMs: 15000,
    screenshotFile: 'pricing.png',
    nonDestructive: false
  },
  insights: {
    route: '/insights',
    readyText: 'Insights',
    selectorCSS: null,
    iframeMatch: null,
    timeoutMs: 15000,
    screenshotFile: 'insights.png',
    nonDestructive: false
  },
  ai_matcher: {
    route: '/ai-matching',
    readyText: 'Find Your Carrier',
    selectorCSS: '#ai-matching-container, .match-card, .matching-interface',
    iframeMatch: 'AI_MATCHING',
    timeoutMs: 20000,
    screenshotFile: 'ai_matcher.png',
    nonDestructive: false
  }
}
```

## Console Suppression Rules

These warnings are known-OK in the Wix/Velo environment. Suppress them from P-count calculations:

| Rule ID | Pattern | Reason |
|---------|---------|--------|
| meta-pixel-unavailable | `Meta pixel.*is unavailable` | Third-party tracking pixel |
| tailwind-cdn-production | `cdn.tailwindcss.com should not be used in production` | Known CDN deployment pattern |
| wix-preload-resource | `was preloaded using link preload but not used` | Wix Thunderbolt internal |
| wix-hydration | `hydrat` | Wix React hydration warnings |
| wix-internal-deprecation | `DeprecationWarning.*wix` | Wix platform deprecation |
| third-party-cookie | `third-party cookie` | Chrome cookie deprecation |
| source-map-warning | `DevTools failed to load source map` | Minified Wix bundles |
| wix-analytics | `frog\.wix\.com` | Wix telemetry |
| parastorage-404 | `static\.parastorage\.com.*404` | Wix CDN optional assets |
| recaptcha-error | `recaptcha` | reCAPTCHA on non-form pages |
| react-i18n-warning | `react-i18next.*old wait option` | Wix React i18n migration |

## PII Scrubbing Patterns (Apply Before Writing JSON)

```javascript
PII_SCRUB_PATTERNS = [
  { pattern: /\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, replacement: '[EMAIL_REDACTED]' },
  { pattern: /\b(\+1)?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, replacement: '[PHONE_REDACTED]' },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' }
]
```

## Velo Error Detection Patterns

```javascript
VELO_ERROR_PATTERNS = [
  /Wix code error/i,
  /Backend function error/i,
  /ModuleLoadError/i,
  /WDE\d+/,
  /wix-thunderbolt/i
]
```

## Network URL Allowlist

Only flag failures from LMDR-specific domains:

```javascript
INCLUDE = ['lastmiledr.app', '_functions/', 'airtable.com', 'cdn.jsdelivr.net/gh/LordKnowsBest']
EXCLUDE = ['wix.com', 'parastorage.com', 'wixstatic.com', 'wixmedia.com', 'frog.wix.com', 'bo.wix.com', 'google-analytics.com', 'googletagmanager.com']
```

## Execution Protocol

### Phase 0: Session Guard

**CRITICAL: Execute before any path verification.**

1. **Call `mcp__chrome-devtools__list_pages`** with no parameters.

2. **Filter the page list:**
   - Find pages where `url` contains `"lastmiledr.app"`
   - **REJECT** pages where `url` contains:
     - `"editor.wix.com"`
     - `"manage.wix.com"`
     - `"users.wix.com"`

3. **Validation:**
   - If NO valid LMDR page found: **ABORT** with error:
     ```
     ABORT: No LMDR session found in browser.
     Action: Open https://www.lastmiledr.app in Chrome, ensure you are logged in, then retry.
     ```
   - If ANY page URL contains `"users.wix.com"`: **ABORT** with error:
     ```
     ABORT: Wix session expired — URL redirected to users.wix.com.
     Action: Navigate Chrome to users.wix.com, log in, then retry.
     ```

4. **Call `mcp__chrome-devtools__select_page`**:
   - `pageId`: <pageId of validated LMDR tab>
   - `bringToFront`: true

### Phase 1: Per-Path Verification Loop

**Execute the following steps for EACH path in CRITICAL_PATHS (order: home → about → privacy → drivers → upload_docs → pricing → insights → ai_matcher).**

Initialize tracking object for this path:
```javascript
pathResult = {
  pathKey: <string>,
  url: <full URL>,
  timedOut: false,
  readyStateReached: false,
  consoleErrors: [],
  consoleWarnings: [],
  networkFailures: [],
  screenshotPath: null,
  isBlank: false
}
```

#### Step 1.1: Navigate

**Call `mcp__chrome-devtools__navigate_page`**:
- `url`: `SITE_BASE_URL + path.route`
- `type`: `"url"`
- `timeout`: 30000

**After navigation:** Verify URL does NOT contain `"users.wix.com"` (session expiry guard).

#### Step 1.2: Wait for Ready State

**Call `mcp__chrome-devtools__wait_for`**:
- `text`: `path.readyText`
- `timeout`: `path.timeoutMs`

**Handle timeout:**
- If `wait_for` times out: set `pathResult.timedOut = true`
- **Call `mcp__chrome-devtools__take_snapshot`** to inspect what actually rendered
- **Do NOT abort** — continue to next step (screenshot is still useful evidence)
- If `wait_for` succeeds: set `pathResult.readyStateReached = true`

#### Step 1.3: PostMessage Dwell (iframe pages only)

For paths with `iframeMatch !== null` (currently only `ai_matcher`):

**Call `mcp__chrome-devtools__evaluate_script`**:
- `function`: `"async () => { await new Promise(r => setTimeout(r, 4000)); return 'dwell done'; }"`

For all other paths, use 2-second dwell:
- `function`: `"async () => { await new Promise(r => setTimeout(r, 2000)); return 'dwell done'; }"`

#### Step 1.4: Capture Console Messages

**Call `mcp__chrome-devtools__list_console_messages`** with no type filter (capture everything for bridge verification).

**Process results:**
- For each entry where `type === "error"`:
  - **Call `mcp__chrome-devtools__get_console_message`** with `msgid` to get full detail
  - Classify: match `message` against `VELO_ERROR_PATTERNS` → `is_velo_error: true`
  - Check against suppression rules — if matched, suppress from P-count
  - **PII scrub** the `message` text using `PII_SCRUB_PATTERNS`
  - Store in `pathResult.consoleErrors`
- For warnings: check against suppression rules, store in `pathResult.consoleWarnings`

#### Step 1.5: Capture Network Requests

**Call `mcp__chrome-devtools__list_network_requests`**:
- `resourceTypes`: `["xhr", "fetch"]`

**Filter:** Only flag failures from URLs matching the INCLUDE allowlist (not the EXCLUDE blocklist).

**For each failed request** (status >= 400 OR failure_reason present):
- **Call `mcp__chrome-devtools__get_network_request`** with `reqid`
- **Security:** Do NOT pass `responseFilePath` for auth endpoints
- **URL scrubbing:** Strip auth params before storing
- Store in `pathResult.networkFailures`

#### Step 1.6: Screenshot

**Call `mcp__chrome-devtools__take_screenshot`**:
- `fullPage`: true
- `format`: `"png"`
- `filePath`: `"<ARTIFACT_ROOT>/visual_confirmation/${path.screenshotFile}"`

**Blank detection:** If file < 10KB, retry with `fullPage: false`. If still < 10KB, mark `isBlank: true`.

---

**Repeat Steps 1.1–1.6 for all 8 paths.**

---

### Phase 2: Quality Gate Evaluation

After all 8 paths are processed, evaluate the 6 quality gate checks:

```javascript
qualityGate = {
  run_id: RUN_ID,
  timestamp: <current ISO timestamp>,
  site_base_url: 'https://www.lastmiledr.app',
  pass: false,  // Set to true ONLY if ALL checks are true
  checks: {
    zero_p0_errors: { pass: false, detail: '' },
    all_critical_selectors_visible: { pass: false, detail: '' },
    all_pages_reached_ready_state: { pass: false, detail: '' },
    zero_network_500_errors: { pass: false, detail: '' },
    screenshots_captured: { pass: false, detail: '' },
    zero_velo_worker_fatal_errors: { pass: false, detail: '' }
  },
  paths: { /* per-path results */ },
  summary: {
    total_paths: 8,
    clean_paths: 0,
    paths_with_errors: 0,
    broken_paths: 0,
    total_p0_errors: 0,
    total_warnings_suppressed: 0,
    total_network_failures: 0
  },
  action_items: []
}
```

#### Check 1: zero_p0_errors
Count all non-suppressed console errors with `classification: "P0"` across all paths.

#### Check 2: all_critical_selectors_visible
For paths with `selectorCSS !== null`, verify selector visible. For paths with `selectorCSS === null`, use a11y snapshot to confirm page content rendered.

#### Check 3: all_pages_reached_ready_state
All 8 `wait_for` calls completed without timeout.

#### Check 4: zero_network_500_errors
Zero LMDR-specific requests with `status >= 500`.

#### Check 5: screenshots_captured
All 8 PNG files exist and are > 10KB.

#### Check 6: zero_velo_worker_fatal_errors
No non-suppressed console errors matching `VELO_ERROR_PATTERNS`.

#### Final Pass/Fail
```javascript
qualityGate.pass = Object.values(qualityGate.checks).every(c => c.pass === true);
```

### Phase 3: Write Artifacts

**Create artifact directory:**
```bash
mkdir -p <ARTIFACT_ROOT>/visual_confirmation
```

**Write these files using the Write tool:**
1. `<ARTIFACT_ROOT>/quality_gate.json` — aggregated quality gate
2. `<ARTIFACT_ROOT>/console_audit.json` — all console messages grouped by path
3. `<ARTIFACT_ROOT>/network_audit.json` — all network requests grouped by path

**CRITICAL:** Apply `PII_SCRUB_PATTERNS` to ALL message/stack fields before writing.

### Phase 4: Final Summary

After writing all artifacts, output:

```
Evidence Pack Complete
Run ID:       <RUN_ID>
Quality Gate: <PASS | FAIL>
Checks:       <N>/6 passed

  [x/fail] zero_p0_errors
  [x/fail] all_critical_selectors_visible
  [x/fail] all_pages_reached_ready_state
  [x/fail] zero_network_500_errors
  [x/fail] screenshots_captured
  [x/fail] zero_velo_worker_fatal_errors

Artifacts:
  - Quality gate:   <path>
  - Console audit:  <path>
  - Network audit:  <path>
  - Screenshots:    <path> (8 files)

<If FAIL: list all P0 action items>
```

## Security Requirements

**NON-DESTRUCTIVE VERIFICATION (Non-Negotiable):**

- **NEVER** call `mcp__chrome-devtools__click` on submit buttons on any path with `nonDestructive: true`
- **NEVER** call `mcp__chrome-devtools__fill_form` and then click submit — this creates live Airtable records
- `take_snapshot` and `take_screenshot` are for assertion only — do NOT trigger actions

**PII Handling:**

- ALL console messages and network URLs MUST be PII-scrubbed before writing JSON artifacts
- Verify no artifact file contains email/phone/SSN patterns before completing

**Secrets & Tokens:**

- Strip auth tokens from network request URLs before logging
- Never call `get_network_request` with `responseFilePath` on auth endpoints
- Never log response bodies (may contain PII or tokens)

## Error Handling

**Session Expiry Mid-Run:**
After EVERY `navigate_page` call, verify the resulting URL does NOT contain `"users.wix.com"`. If it does:
```
ABORT: Wix session expired mid-run after completing paths: [list].
Action: Re-authenticate in Chrome at www.lastmiledr.app then retry.
```

**Navigation Timeout:**
If `navigate_page` times out, log the failure but continue to next path.

**Screenshot File Write Failure:**
Mark `screenshots_captured: false` and continue.

## Known Wix Quirks (Reference)

- **KW-001:** `evaluate_script` cannot access cross-origin iframe DOM → use `take_snapshot` for iframe content validation
- **KW-004:** Wix PostMessage latency requires 2-4 second dwell after `wait_for`
- **KW-005:** Tailwind CDN cold start — `navigate_page` waits for network idle, but dwell may still be needed
- **KW-006:** Velo backend errors appear in `list_console_messages` — tag with `is_velo_error: true`
- **KW-009:** Blank screenshots on first capture — check file size and retry if < 10KB

## Execution Trigger

Run this agent with:
```
claude --agent evidence-pack
```
or say "run the evidence pack" in a conversation.

The agent should autonomously execute all phases without further prompts.
