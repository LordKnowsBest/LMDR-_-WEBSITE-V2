# Evidence Pack Hardening Notes

## Strategies Implemented

### Console Message Deduplication (Phase 4.8)
Deduplicate console entries by `(url, line, column, message)` tuple before writing to `console_audit.json`. Wix Thunderbolt can fire the same error multiple times during hydration — duplicates inflate P0 counts.

**Implementation:**
```javascript
// Build a unique key from message properties
const dedupKey = `${entry.url}:${entry.line}:${entry.column}:${entry.message}`;

// Track seen keys in a Set
const seenKeys = new Set();

// Filter entries
const uniqueEntries = allEntries.filter(entry => {
  const key = `${entry.url}:${entry.line}:${entry.column}:${entry.message}`;
  if (seenKeys.has(key)) return false;
  seenKeys.add(key);
  return true;
});
```

### Blank Screenshot Retry (Phase 4.4)
After `take_screenshot`, check file size:
1. If < 10KB → retry with `fullPage: false` (viewport-only)
2. If still < 10KB → record `isBlank: true`
3. Mark `screenshots_captured: false` in quality gate

**Rationale:** Wix Thunderbolt React hydration can cause brief visual blanking. A viewport-only screenshot (smaller rendered area) is more likely to capture stable content. See: KW-009

**Implementation:**
```javascript
// After first screenshot attempt
const stats = fs.statSync(screenshotPath);
if (stats.size < 10240) {  // 10KB threshold
  // Retry with viewport-only
  await chrome_devtools.take_screenshot({
    fullPage: false,
    format: 'png',
    filePath: screenshotPath.replace('.png', '_viewport.png')
  });

  const retryStats = fs.statSync(screenshotPath.replace('.png', '_viewport.png'));
  if (retryStats.size < 10240) {
    // Mark as blank in results
    pathResult.screenshot_blank = true;
    qualityGate.checks.screenshots_captured = false;
  }
}
```

### Network Quiet Check (Phase 4.5)
Optional: Call `list_network_requests` twice, 1.5s apart. If count is stable (no new requests), the page has finished async loading. Useful for data-heavy pages (ai_matcher, driver_entry).

**Implementation:**
```javascript
// After initial dwell
const initialRequests = await chrome_devtools.list_network_requests({
  resourceTypes: ['xhr', 'fetch'],
  includePreservedRequests: true
});

await new Promise(r => setTimeout(r, 1500));

const finalRequests = await chrome_devtools.list_network_requests({
  resourceTypes: ['xhr', 'fetch'],
  includePreservedRequests: true
});

const isNetworkQuiet = finalRequests.length === initialRequests.length;

if (!isNetworkQuiet) {
  // Wait another 2s for in-flight requests to complete
  await new Promise(r => setTimeout(r, 2000));
}
```

### wait_for Retry on Timeout (Phase 4.1)
If `wait_for` times out on first attempt:
1. Call `navigate_page` with `type: "reload"`
2. Wait 2 seconds
3. Retry `wait_for` once
4. If still fails → record `timedOut: true`, continue to next step

**Rationale:** Airtable cold-start latency or Wix PostMessage race conditions can cause legitimate pages to timeout on first navigation. A reload often succeeds. See: KW-002, KW-004

**Implementation:**
```javascript
try {
  await chrome_devtools.wait_for({
    text: path.readyText,
    timeout: path.timeoutMs
  });
} catch (timeoutError) {
  // Reload and retry once
  await chrome_devtools.navigate_page({
    url: fullUrl,
    type: 'reload',
    timeout: path.timeoutMs
  });

  await new Promise(r => setTimeout(r, 2000));

  try {
    await chrome_devtools.wait_for({
      text: path.readyText,
      timeout: path.timeoutMs
    });
  } catch (retryError) {
    pathResult.timedOut = true;
    qualityGate.pages_failed_ready.push(pathKey);
  }
}
```

### Mid-Run SSO Guard (Phase 4.2, KW-007)
After every `navigate_page`, call `list_pages`. If any page URL contains `users.wix.com`, the Wix session has expired. ABORT the run with error message.

**Rationale:** Wix SSO sessions expire after ~24 hours. If the session expires mid-run, all subsequent paths redirect to login. Early detection prevents misleading failures.

**Implementation:**
```javascript
// After each navigate_page
const pages = await chrome_devtools.list_pages();

const hasExpiredSession = pages.some(page =>
  page.url && page.url.includes('users.wix.com')
);

if (hasExpiredSession) {
  throw new Error(`Wix session expired mid-run at path: ${pathKey}.
    Successfully verified paths: ${completedPaths.join(', ')}.
    Action: Re-authenticate in Chrome at www.lastmiledr.app then retry.`);
}
```

### Tailwind CDN Wait (Phase 4.3, KW-005)
For pages using Tailwind CDN (ai_matcher and all HTML component pages), poll with `evaluate_script`:
```javascript
'() => document.querySelectorAll("[class*=\"text-\"], [class*=\"bg-\"], [class*=\"flex\"]").length > 3'
```
Loop with 500ms polling, max 5 seconds. If Tailwind never loads, proceed but log warning.

**Rationale:** Tailwind CDN cold-starts take 1-3 seconds. During this window, DOM elements exist but have no dimensions (width/height = 0). Selectors appear found but not visible.

**Implementation:**
```javascript
// Only for paths with Tailwind dependency
if (path.usesTailwind) {
  const maxAttempts = 10;  // 5 seconds total
  let tailwindReady = false;

  for (let i = 0; i < maxAttempts; i++) {
    const result = await chrome_devtools.evaluate_script({
      function: '() => document.querySelectorAll("[class*=\\"text-\\"], [class*=\\"bg-\\"], [class*=\\"flex\\"]").length > 3'
    });

    if (result === true) {
      tailwindReady = true;
      break;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  if (!tailwindReady) {
    pathResult.warnings.push('Tailwind CDN did not load within 5s timeout');
  }
}
```

### Artifact Archival (Phase 4.10)
After a passing run (`quality_gate.json` has `pass: true`):
- Copy `quality_gate.json` to `artifacts/devtools/latest/quality_gate.json`
- This provides a stable reference path for CI/CD or manual checks

**Implementation:**
```javascript
if (qualityGate.pass) {
  const latestDir = path.join(__dirname, '../../../artifacts/devtools/latest');
  fs.mkdirSync(latestDir, { recursive: true });

  fs.copyFileSync(
    path.join(ARTIFACT_ROOT, 'quality_gate.json'),
    path.join(latestDir, 'quality_gate.json')
  );

  // Also copy a timestamped backup
  fs.copyFileSync(
    path.join(ARTIFACT_ROOT, 'quality_gate.json'),
    path.join(latestDir, `quality_gate_${RUN_ID}.json`)
  );
}
```

### Selector Versioning (Phase 4.6)
All CSS selectors are externalized to `selectors.json`. When a Wix component update changes a selector:
1. Update `selectors.json` (not the playbook or agent file)
2. The agent reads selectors.json at runtime
3. No code changes needed for selector drift

**Rationale:** Wix updates can change component IDs or CSS class names. Keeping selectors in a separate config file allows non-technical users to update selectors without modifying JavaScript code.

**File:** `selectors.json` (this file)

**Agent usage:**
```javascript
const selectorsConfig = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'selectors.json'), 'utf8'
));

// Replace CRITICAL_PATHS with selectors.json content
const CRITICAL_PATHS = selectorsConfig.paths;
```

### Suppression Rules (Phase 4.9)
Known-OK console warnings are listed in `suppress_rules.json`. Before computing P-counts:
1. Load suppress rules
2. For each console entry, check against all rules (substring or regex match)
3. If matched: log the entry but exclude from P0/P1 counts
4. Write both raw and filtered counts in quality_gate.json

**Rationale:** Wix platform generates many cosmetic warnings (hydration, internal deprecations, missing source maps). These don't indicate LMDR app failures and shouldn't fail the quality gate.

**File:** `suppress_rules.json` (this file)

**Agent usage:**
```javascript
const suppressRules = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'suppress_rules.json'), 'utf8'
));

function shouldSuppress(consoleEntry) {
  for (const rule of suppressRules.rules) {
    const message = consoleEntry.message || '';

    if (rule.type === 'substring' && message.includes(rule.pattern)) {
      return rule;
    }

    if (rule.type === 'regex' && new RegExp(rule.pattern, 'i').test(message)) {
      return rule;
    }
  }
  return null;
}

// Apply suppression
const filteredEntries = allConsoleEntries.map(entry => {
  const suppressRule = shouldSuppress(entry);

  if (suppressRule) {
    entry.suppressed = true;
    entry.suppress_reason = suppressRule.reason;

    if (suppressRule.severity_override) {
      entry.classification = suppressRule.severity_override;
    }

    if (suppressRule.suppress_from_p_count) {
      entry.exclude_from_p_count = true;
    }
  }

  return entry;
});

// Compute P-counts excluding suppressed entries
const p0Count = filteredEntries.filter(e =>
  e.classification === 'P0' && !e.exclude_from_p_count
).length;

qualityGate.p0_error_count_raw = allConsoleEntries.filter(e => e.classification === 'P0').length;
qualityGate.p0_error_count_filtered = p0Count;
```

---

## Configuration File Updates

When hardening strategies require config updates:

### Adding a New Suppression Rule
Edit `suppress_rules.json` and add to the `rules` array:
```json
{
  "id": "new-pattern-id",
  "pattern": "error text or regex",
  "type": "substring" | "regex",
  "reason": "Human-readable explanation",
  "severity_override": null | "P0" | "P1" | "P2",
  "suppress_from_p_count": true | false
}
```

### Adding a New Critical Path
Edit `selectors.json` and add to the `paths` object:
```json
"new_path": {
  "route": "/new-page",
  "readyText": "Unique text visible when loaded",
  "selectorCSS": "#main-container, .fallback-selector",
  "iframeMatch": "iframe_src_substring" | null,
  "timeoutMs": 15000,
  "dwellMs": 2000,
  "screenshotFile": "new_path.png",
  "nonDestructive": true | false
}
```

### Updating Selectors After Wix Component Changes
If a Wix update changes component CSS/IDs:
1. Open `selectors.json`
2. Find the affected path
3. Update `selectorCSS` with the new selector(s)
4. Test the verification run
5. Commit the change with message: `fix(devtools): update selectors for [component] after Wix update`

---

## Known Edge Cases

### Scenario: Multiple Tailwind-CDN Pages in Sequence
If `ai_matcher` is followed immediately by another Tailwind page, the CDN is already cached — the 5s polling completes on the first check. No performance penalty.

### Scenario: Screenshot Retry Exhausts File System
Unlikely: Each screenshot attempt writes to a different filename (`_attempt1.png`, `_viewport.png`). Max 2 files per path = 10 files total per run.

### Scenario: Suppression Rule Too Broad
If a suppression pattern matches legitimate LMDR errors:
- Use `"type": "regex"` with anchors: `"^Wix code error.*wix-internal"`
- Never use bare keywords like `"error"` — too broad

### Scenario: Mid-Run Session Expiry During Long Runs
Session guard checks after every `navigate_page`. If a run takes > 1 hour and the session expires mid-run, the guard will catch it and abort with a clear message listing completed paths.

---

## Performance Impact

| Strategy | Additional Time per Path | Total Overhead (5 paths) |
|----------|-------------------------|--------------------------|
| Deduplication | ~5ms (in-memory Set) | ~25ms |
| Blank screenshot retry | 0ms (only if < 10KB) | 0-5s worst case |
| Network quiet check | 1.5s | 7.5s |
| wait_for retry | 0s (only on timeout) | 0-20s worst case |
| SSO guard | ~100ms (list_pages call) | ~500ms |
| Tailwind CDN wait | 0-5s (early exit if cached) | 0-25s worst case |
| Artifact archival | ~50ms (file copy) | ~50ms |
| Suppression matching | ~10ms (regex) | ~50ms |

**Total worst-case overhead:** ~38 seconds across all 5 paths (assuming all timeouts, all retries, cold Tailwind CDN on all pages). Typical overhead: ~8 seconds.
