# Known Issues — Chrome DevTools Runtime Verification

**Track:** `devtools_observability_20260219`
**Tool:** `chrome-devtools-mcp@latest` (https://github.com/ChromeDevTools/chrome-devtools-mcp)
**Last Updated:** 2026-02-19 v2.0

---

## Quick Reference: chrome-devtools-mcp Tool Scope

Before reading the issues, understand what `chrome-devtools-mcp` CAN and CANNOT do in Wix context:

| Capability | Tool | Works Across Wix Iframes? |
|-----------|------|--------------------------|
| Console errors/warnings | `list_console_messages` | ✅ YES — all frames captured |
| Stack traces | `get_console_message` | ✅ YES — source-mapped |
| Network requests | `list_network_requests` | ✅ YES — all frames |
| DOM element query | `evaluate_script` | ❌ NO — main frame only (cross-origin iframe blocked) |
| a11y tree content | `take_snapshot` | ✅ YES — aggregates all frames |
| Visual capture | `take_screenshot` (fullPage) | ✅ YES — composited page including iframes |
| Text-based wait | `wait_for` | ✅ YES — scans all visible text |
| Performance trace | `performance_start/stop_trace` | ✅ YES — full page |

---

## Issue Log

### KW-001: `evaluate_script` Cannot Access Cross-Origin Iframe DOM

**Symptom:** `evaluate_script` to check `document.querySelector('#ai-matching-container')` returns `{ found: false }` even though the selector clearly exists in the `AI_MATCHING.html` iframe.

```
Error (if tried via contentDocument): SecurityError: Blocked a frame with origin
"https://www.lastmiledr.app" from accessing a cross-origin frame.
```

**Root Cause:** Wix HTML Components are served from `static.parastorage.com` — a different origin from `www.lastmiledr.app`. `evaluate_script` runs JavaScript in the main page's execution context and cannot penetrate cross-origin iframe boundaries via `document.querySelector`.

**chrome-devtools-mcp workarounds (in priority order):**

1. **`take_snapshot`** (best): Returns the unified a11y tree across ALL frames. If the iframe rendered its content, the snapshot will contain the expected text, roles, and element labels. Check the snapshot output for required content rather than CSS selectors.

2. **`wait_for`** (reliable): Call `wait_for` with unique iframe-specific text (e.g., `"Find Your Match"` for ai_matcher). If `wait_for` succeeds, the iframe text is visible — this proves render success without DOM access.

3. **`take_screenshot`** (visual): A `fullPage: true` screenshot captures the composited page including cross-origin iframes. A blank white box where the iframe should be is a clear visual failure signal.

4. **`evaluate_script` on main frame** (limited): Can detect iframe presence, size, and position:
   ```javascript
   () => Array.from(document.querySelectorAll('iframe')).map(f => ({
     src: f.src.substring(0, 120),
     width: f.offsetWidth, height: f.offsetHeight,
     visible: f.offsetWidth > 0 && f.offsetHeight > 0
   }))
   ```
   If the iframe has `width: 0` or `height: 0`, it hasn't rendered — this is a failure.

**Status:** Documented. Mitigated by `take_snapshot` + `wait_for` approach in `verify_runtime.js`.

---

### KW-002: `wait_for` Timeout on Data-Heavy Pages (Airtable Cold Start)

**Symptom:** `wait_for` with text `"My Applications"` times out on `driver_entry` path, even though the page eventually loads if a human waits longer.

**Root Cause:** 
- Wix Data calls to Airtable-backed collections have a cold-start latency of **3–6 seconds** when the Airtable API connection hasn't been used recently
- The PostMessage handshake (Velo page code → iframe) adds another 500ms–2s
- These delays stack: navigate (1s) + PostMessage (2s) + Airtable (4s) = 7s+ before `"My Applications"` text appears

**`chrome-devtools-mcp` response:**

- Set `timeout: 20000` for data-heavy paths (`driver_entry`, `carrier_entry`, `ai_matcher`)
- Use `wait_for` with a **loading state text** as an intermediate ready signal:
  - First `wait_for`: `"Loading"` or `"Fetching"` → confirms iframe rendered
  - Then `wait_for`: `"My Applications"` → confirms data loaded
- If the first `wait_for` succeeds but the second times out, record this as a P1 warning (page rendered but data load failed) rather than a full P0 failure

**Status:** `timeoutMs: 20000` set for ai_matcher. Other data-heavy paths need tuning after first run.

---

### KW-003: `list_pages` Returns Wix Editor Tab — Wrong Tab Selected

**Symptom:** `list_pages` returns multiple tabs: `editor.wix.com` (Wix Editor), `www.lastmiledr.app` (live site), and `manage.wix.com` (Wix dashboard). The agent accidentally calls `select_page` on the editor tab. `evaluate_script` then runs in the editor's React app context and returns garbage results.

**Symptom 2:** `list_console_messages` captures Wix Editor's own internal console errors (React devtools warnings, Next.js hydration errors) as if they were LMDR site errors. False P0 storm.

**Root Cause:** `--autoConnect` gives the MCP server access to **all open browser tabs** for the Chrome profile. Without explicit tab filtering, the wrong tab can be selected.

**`chrome-devtools-mcp` response:**

1. Always call `list_pages` first
2. Filter the page list: only accept tabs where URL contains `lastmiledr.app`
3. **Explicitly reject**: any URL containing `editor.wix.com`, `manage.wix.com`, or `users.wix.com`
4. Call `select_page` only on the validated LMDR tab
5. If no valid LMDR tab: ABORT with clear message: *"No lastmiledr.app tab found. Open www.lastmiledr.app in Chrome first."*

**Status:** Tab guard implemented in `verify_runtime.js` PLAYBOOK_STEPS step 0.1.

---

### KW-004: Wix PostMessage Latency — Content Missing After Navigation

**Symptom:** `navigate_page` completes and `wait_for` succeeds, but `take_snapshot` shows the iframe is empty or only shows a loading spinner. `take_screenshot` captures a blank white box in the iframe area.

**Root Cause:** Wix Velo page code sends data to HTML Component iframes via `window.postMessage()` **after** the initial page load event. This handshake takes 500ms–2000ms depending on:
- Wix Data collection response time (especially Airtable)
- Number of `$w('#htmlComponent').postMessage(...)` calls in the page code
- Whether the page is Server-Side Rendered (SSR — faster) or fully client-side

**`chrome-devtools-mcp` response:**

The 2-second dwell step (step 1.3 — `evaluate_script` with `setTimeout(r, 2000)`) handles this in the playbook. For pages with Airtable data dependency, increase to 4000ms:

```javascript
// For driver_entry, ai_matcher, recruiter pages:
'async () => { await new Promise(r => setTimeout(r, 4000)); return "4s dwell done"; }'
```

**Automated detection:** After the dwell, call `take_snapshot`. If the snapshot shows `role: progressbar` or `role: status` with text `"Loading"`, add another 2-second dwell and retry the snapshot.

**Status:** 2s dwell in playbook. Airtable-backed pages may need path-specific 4s dwell — to be calibrated after Phase 1 baseline run.

---

### KW-005: Tailwind CDN Not Loaded — Elements Found But Not Visible

**Symptom:** `evaluate_script` returns `{ found: true, visible: false }` for required selectors. `take_screenshot` shows unstyled HTML (raw text, no layout). `take_snapshot` shows the elements exist in a11y tree but positioned incorrectly.

**Root Cause:** Many LMDR HTML components load Tailwind CSS from CDN (`<script src="https://cdn.tailwindcss.com">`). On cold CDN hits (cache miss), this script takes 1–3 seconds to load. During this window:
- DOM elements exist (`found: true`)
- But have no width/height because Tailwind classes haven't been applied (`visible: false`)
- Screenshots show unstyled content

**`chrome-devtools-mcp` response:**

Use `wait_for` with a text string that appears in a styled element — if the element is visible enough to render its text, Tailwind has likely loaded.

Alternatively, add an `evaluate_script` Tailwind readiness check after the dwell:
```javascript
// Returns true when Tailwind has processed at least one utility class
'() => document.querySelectorAll("[class*=\"text-\"], [class*=\"bg-\"], [class*=\"flex\"]").length > 3'
```
Loop with 500ms polling until this returns true (max 5 seconds).

**`navigate_page` already helps:** It uses Puppeteer's `networkidle2` behavior internally, which waits until there are fewer than 2 active network connections for 500ms — meaning the Tailwind CDN script has usually been downloaded before the tool returns.

**Status:** Mitigated by `navigate_page`'s built-in network idle behavior. Explicit Tailwind check added to Phase 4 hardening checklist.

---

### KW-006: Velo Backend Errors in Console — Captured by `list_console_messages`

**Description:** This one is actually GOOD NEWS — just needs documentation.

`list_console_messages` captures errors from **all browser execution contexts**, including:
- Main Wix page context
- HTML Component iframe contexts  
- Velo Worker (`wix-worker`) context — where **backend web method errors** surface

This means when a Velo backend function (e.g., `carrierMatching.jsw::getCarrierMatches`) throws a 500, the resulting error appears in `list_console_messages` as:
```
ERROR: Wix code error: ReferenceError: airtableClient is not defined
  at getCarrierMatches (carrierMatching.jsw:142)
```

**Classification:** Tag these as `is_velo_error: true` and `classification: "P0"` — they indicate broken backend logic, not just cosmetic issues.

**How to detect:** Match `message` against `VELO_ERROR_PATTERNS` (defined in `verify_runtime.js`):
- `/Wix code error/i`
- `/WDE\d+/`
- `/Backend function error/i`
- `/wix-thunderbolt/i`

**Status:** Client error patterns defined in `verify_runtime.js`. `list_console_messages` captures them automatically.

---

### KW-007: Wix SSO Session Expiry Mid-Run

**Symptom:** During a multi-path verification run (e.g., after completing `home` and `ai_matcher`), the `navigate_page` call for `driver_entry` redirects to `users.wix.com/wix-login`. All subsequent paths fail.

**Root Cause:** Wix SSO session cookies expire after ~24 hours. If Chrome is closed and reopened without the persistent profile flag, cookies are lost.

**`chrome-devtools-mcp` detection:**

After every `navigate_page` call:
```
list_pages
→ If any page URL contains "users.wix.com": ABORT entire run
→ Error: "Wix session expired mid-run. Complete paths before expiry:
   [list of already-verified paths]. Action: Re-authenticate in Chrome, then retry."
```

**Prevention:** Use `--user-data-dir` (persistent profile) in `--browserUrl` mode so cookies survive Chrome restarts. With `--autoConnect`, the running Chrome instance already has cookies — just don't close Chrome between runs.

**Status:** Session guard in step 0.1 (catches pre-run expiry). Mid-run detection needs to be added to the navigation step — check after each `navigate_page` that the resulting URL doesn't contain `users.wix.com`.

---

### KW-008: `list_network_requests` Returns Wix-Internal CDN Requests

**Symptom:** `list_network_requests` returns 400+ entries, including Wix platform requests (`static.parastorage.com`, `frog.wix.com`, `bo.wix.com`). Filtering for LMDR-specific failures is noisy.

**Root Cause:** `list_network_requests` captures ALL network requests from the page, including Wix's internal platform traffic (analytics, hot-module replacement, CDN assets, A/B testing signals).

**`chrome-devtools-mcp` response:**

Filter the returned list to only report on requests that match LMDR endpoints:
- Include: `www.lastmiledr.app`, `*.lastmiledr.app`, `_functions/` (Velo web methods), `airtable.com`
- Exclude: `wix.com`, `parastorage.com`, `wixstatic.com`, `wixmedia.com`, `frog.wix.com`, `bo.wix.com`

Apply `resourceTypes: ["xhr", "fetch"]` filter in the tool call to reduce volume.

For 4xx/5xx status filtering: only flag as FAIL if the failing request's URL matches an LMDR domain or a Wix web method (`/_functions/`).

**Status:** URL allow-list filtering needed. Add to the evidence-pack playbook's network audit step. (Phase 4 hardening task 4.X)

---

### KW-009: `take_screenshot` Returns Blank (< 10KB) on First Navigation

**Symptom:** Immediately after `navigate_page` and `wait_for`, `take_screenshot` produces a tiny PNG (< 10KB, essentially a blank white page). A second `take_screenshot` 2 seconds later produces a correct screenshot.

**Root Cause:** Wix's Thunderbolt renderer uses React hydration — the page is initially painted with SSR HTML shells, then hydrated client-side. During the hydration window, the page may visually flash or be blank at the viewport level. The `wait_for` tool confirms text exists but doesn't guarantee the visual render is complete.

**`chrome-devtools-mcp` response:**

1. After `wait_for` resolves, add a 2s dwell (`evaluate_script` with setTimeout)
2. Call `take_screenshot`
3. Check file size. If < 10KB:
   - Retry once with `fullPage: false` (viewport-only — smaller and faster to render)
   - If still < 10KB: record `isBlank: true` and mark `screenshots_captured: false` in quality gate
4. Log the file size in the Evidence Pack for visibility

**Retry snippet:**
```
CALL: take_screenshot → filePath: ".../attempt1.png"
→ Check file size via evaluate_script: "() => 'got it'"  (agent checks returned filePath)
→ If blank: CALL take_screenshot → filePath: ".../attempt2_viewport.png" (fullPage: false)
```

**Status:** Blank detection documented. Retry logic in Phase 4 hardening checklist item 4.4.

---

### KW-010: Chrome 144 Requirement for `--autoConnect`

**Symptom:** Running with `--autoConnect` throws:
```
Error: No Chrome instance found with remote debugging enabled.
```
Or Chrome shows no dialog when the MCP server tries to connect.

**Root Cause:** `--autoConnect` requires Chrome **144 or newer**. Older Chrome versions do not support the `chrome://inspect/#remote-debugging` activation flow.

**Detection:** Run `chrome://version/` in the browser address bar. Check the major version number.

**Remediation options:**

1. **Update Chrome:** `chrome.exe --version` → confirm ≥ 144
2. **Use `--browserUrl` fallback:** Does not require Chrome 144+. Launch Chrome with `--remote-debugging-port=9222` and use `--browserUrl=http://127.0.0.1:9222`
3. **Use Chrome Canary:** Download from `google.com/chrome/canary` — always up to date

**Status:** Documented. The `--browserUrl` fallback is always available regardless of Chrome version.

---

## Adding New Issues

When a new Wix/Velo quirk is discovered during a verification run:

1. Add a sequential `KW-NNN` entry to this file
2. Include: Symptom, Root Cause, `chrome-devtools-mcp` response (specific tool names), Status
3. If a code change is needed in `verify_runtime.js` or the playbook, open a Phase 4 task in `plan.md`
4. Update `spec.md` §9 with a one-line summary reference

**Current open Phase 4 items from this file:**
- KW-002: Per-path Airtable dwell calibration
- KW-005: Tailwind readiness polling loop
- KW-007: Mid-run SSO expiry guard after `navigate_page`
- KW-008: Wix-internal request URL allow-list filtering
- KW-009: Blank screenshot retry logic
