/**
 * verify_runtime.js — LMDR Evidence Pack Orchestrator
 *
 * Track:   devtools_observability_20260219
 * Version: 2.0 (rewritten — uses real chrome-devtools-mcp tool names)
 * Spec:    Conductor/tracks/devtools_observability_20260219/spec.md
 *
 * PURPOSE
 * ═══════
 * This file is NOT a Puppeteer script. It is an AGENT PLAYBOOK — a
 * structured description of the chrome-devtools-mcp tool calls the
 * Gemini / Claude / Cursor agent must execute in sequence to produce
 * the Evidence Pack for a given verification run.
 *
 * IMPORTANT: Do not try to `require()` or `node verify_runtime.js`.
 * This file is a reference document with machine-readable step definitions.
 * The agent reads this file and executes the MCP tool calls defined here.
 *
 * TOOL SOURCE
 * ════════════
 * All tool names come from the official chrome-devtools-mcp package:
 *   https://github.com/ChromeDevTools/chrome-devtools-mcp
 *   Tool reference: .../blob/main/docs/tool-reference.md
 *
 * MCP CONFIG (add to .gemini/settings.json or claude_desktop_config.json)
 * ════════════════════════════════════════════════════════════════════════
 *   {
 *     "mcpServers": {
 *       "chrome-devtools": {
 *         "command": "npx",
 *         "args": [
 *           "chrome-devtools-mcp@latest",
 *           "--autoConnect",          // Use existing Chrome session (requires Chrome 144+)
 *           "--no-usage-statistics",  // Opt-out of Google telemetry
 *           "--viewport=1440x900"     // Desktop baseline
 *         ]
 *       }
 *     }
 *   }
 *
 *   FALLBACK (sandboxed / remote debugging port):
 *   {
 *     "args": ["chrome-devtools-mcp@latest", "--browserUrl=http://127.0.0.1:9222"]
 *   }
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SITE_BASE_URL
 * The base URL for the verification run. Adjust per environment.
 *
 * Options:
 *   Live:    "https://www.lmdr.io"
 *   Preview: "https://editor.wix.com/..." (get from `npm run dev` output)
 *
 * NOTE: Never target editor.wix.com for Evidence Pack runs.
 * Always use the published live site or the Wix Preview URL.
 */
const SITE_BASE_URL = 'https://www.lmdr.io';

/**
 * RUN_ID
 * Unique identifier for this verification run.
 * Format: ISO-8601 with colons replaced (safe for directory names).
 */
const RUN_ID = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, 'Z');

/**
 * ARTIFACT_ROOT
 * Where Evidence Pack artifacts are written.
 * Must be an absolute path resolvable by the agent's file system tools.
 */
const ARTIFACT_ROOT = `${__dirname}/../../../artifacts/devtools/${RUN_ID}`;

/**
 * CRITICAL_PATHS
 * The 5 pages that must be verified in every Evidence Pack run.
 *
 * Fields:
 *   route           — URL path appended to SITE_BASE_URL
 *   readyText       — Text used with chrome-devtools-mcp `wait_for` tool
 *   selectorCSS     — CSS selector(s) used with `evaluate_script` for DOM assertion
 *                     Comma-separated = OR (first matching selector wins)
 *   iframeMatch     — substring to identify the Wix HTML Component iframe by src
 *                     null = main frame only (no iframe)
 *   timeoutMs       — timeout for `navigate_page` and `wait_for` (milliseconds)
 *   screenshotFile  — filename for take_screenshot filePath
 *   nonDestructive  — if true, NEVER call `click` on any submit/CTA button
 *
 * NOTE: Wix page slugs must be verified against the Wix Editor.
 * Go to: Wix Editor → Pages → right-click page → "Edit SEO & URL" to find slug.
 */
const CRITICAL_PATHS = {
    home: {
        route: '/',
        readyText: 'Last Mile',  // key text visible in LMDR homepage hero
        selectorCSS: '.hero-cta-button, [data-hook="cta-button"], .hero-section',
        iframeMatch: null, // homepage hero is in main Wix frame
        timeoutMs: 15000,
        screenshotFile: 'home.png',
        nonDestructive: false,
    },
    ai_matcher: {
        route: '/ai-matching', // VERIFY: check actual slug in Wix Editor
        readyText: 'AI Matching', // key heading inside AI_MATCHING.html iframe
        selectorCSS: '#ai-matching-container, .match-card, .matching-interface',
        iframeMatch: 'AI_MATCHING', // filters iframe.src.includes('AI_MATCHING')
        timeoutMs: 20000, // 221KB HTML file + Tailwind CDN cold start
        screenshotFile: 'ai_matcher.png',
        nonDestructive: false,
    },
    driver_entry: {
        route: '/driver-dashboard', // VERIFY slug
        readyText: 'My Applications', // or "Driver Dashboard"
        selectorCSS: '#dashboard-container, .driver-dashboard, .application-card',
        iframeMatch: 'DRIVER_DASHBOARD',
        timeoutMs: 15000,
        screenshotFile: 'driver_entry.png',
        nonDestructive: false,
    },
    carrier_entry: {
        route: '/carrier-welcome', // VERIFY slug
        readyText: 'Welcome',
        selectorCSS: '#onboarding-container, .carrier-welcome, .status-steps',
        iframeMatch: 'Carrier_Welcome',
        timeoutMs: 15000,
        screenshotFile: 'carrier_entry.png',
        nonDestructive: false,
    },
    app_flow: {
        route: '/quick-apply', // VERIFY slug
        readyText: 'Upload Your CDL', // or "Quick Apply"
        selectorCSS: '#cdl-upload-btn, .upload-section',
        iframeMatch: 'Quick Apply', // or relevant iframe src substring
        timeoutMs: 15000,
        screenshotFile: 'app_flow.png',
        nonDestructive: true, // NEVER call click() on any submit button here
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// PII PATTERNS (for console_audit.json scrubbing in post-processing)
// ─────────────────────────────────────────────────────────────────────────────

const PII_SCRUB_PATTERNS = [
    { pattern: /\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, replacement: '[EMAIL_REDACTED]' },
    { pattern: /\b(\+1)?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, replacement: '[PHONE_REDACTED]' },
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' },
];

// ─────────────────────────────────────────────────────────────────────────────
// VELO ERROR PATTERNS (for classifying console entries)
// ─────────────────────────────────────────────────────────────────────────────

const VELO_ERROR_PATTERNS = [
    /Wix code error/i,
    /Backend function error/i,
    /WDE\d+/,
    /wix-thunderbolt/i,
];

// ─────────────────────────────────────────────────────────────────────────────
// AGENT PLAYBOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PLAYBOOK_STEPS
 *
 * Ordered sequence of chrome-devtools-mcp tool calls for one verification run.
 * The agent reads each step object and executes the specified tool call.
 *
 * Step object schema:
 *   {
 *     step:       string   — human-readable step ID
 *     tool:       string   — exact chrome-devtools-mcp tool name
 *     params:     object   — tool parameters (see tool-reference.md for schemas)
 *     dynamic:    boolean  — if true, params contain template variables {pathKey}
 *     condition:  string?  — skip condition description (agent evaluates)
 *     note:       string?  — implementation note for the agent
 *   }
 *
 * Tool names reference:
 *   chrome-devtools-mcp@latest (https://github.com/ChromeDevTools/chrome-devtools-mcp)
 *   Tool count: 26 across 6 categories
 */
const PLAYBOOK_STEPS = [
    // ─── STEP 0: SESSION GUARD ─────────────────────────────────────────────────

    {
        step: '0.1-list-pages',
        tool: 'list_pages',
        params: {},
        note: 'Returns all open browser tabs. Find the tab with URL containing "lmdr.io" or "wixsite.com/lmdr". If none found: ABORT with session-not-found error. If any tab URL contains "users.wix.com": ABORT with session-expired error. Never select a tab with "editor.wix.com" in the URL.',
    },
    {
        step: '0.2-select-page',
        tool: 'select_page',
        params: { pageId: '{{TARGET_PAGE_ID}}', bringToFront: true },
        dynamic: true,
        note: 'Replace {{TARGET_PAGE_ID}} with the pageId of the LMDR tab found in step 0.1.',
    },

    // ─── STEP 1: PER-PATH LOOP ─────────────────────────────────────────────────
    // Repeat steps 1.x for each path in CRITICAL_PATHS. Dynamic steps use {{pathKey}}.

    {
        step: '1.1-navigate',
        tool: 'navigate_page',
        params: {
            url: '{{SITE_BASE_URL}}{{path.route}}',
            type: 'url',
            timeout: '{{path.timeoutMs}}',
        },
        dynamic: true,
        note: 'chrome-devtools-mcp navigate_page automatically waits for the page to load (Puppeteer-backed). No need to manually wait for readyState.',
    },
    {
        step: '1.2-wait-for-ready',
        tool: 'wait_for',
        params: {
            text: '{{path.readyText}}',
            timeout: '{{path.timeoutMs}}',
        },
        dynamic: true,
        note: 'If wait_for times out: record timedOut=true for this path, continue to step 1.3 (screenshot is still useful evidence). Do NOT abort the entire run for a single path timeout.',
    },
    {
        step: '1.3-postmessage-dwell',
        tool: 'evaluate_script',
        params: {
            function: 'async () => { await new Promise(r => setTimeout(r, 2000)); return "dwell done"; }',
        },
        note: 'Wix PostMessage bridge dwell: 2 seconds after wait_for resolves. Required for Wix HTML Component iframes to receive their data payload from Velo page code. See known_issues.md KW-004.',
    },

    // ─── STEP 2: CONSOLE CAPTURE ───────────────────────────────────────────────

    {
        step: '2.1-console-list',
        tool: 'list_console_messages',
        params: {
            types: ['error', 'warning'],
            includePreservedMessages: true,
            pageSize: 500,
        },
        note: 'list_console_messages captures ALL frames (including Wix iframe HTML components). This includes Velo Worker errors thrown in wix-worker context. Scope: all messages since last navigation. PII-scrub all message.text values before writing to console_audit.json.',
    },
    {
        step: '2.2-console-detail',
        tool: 'get_console_message',
        params: { msgid: '{{ERROR_MSGID}}' },
        dynamic: true,
        note: 'Call get_console_message for each entry where type === "error" to retrieve the full stack trace. Skip warnings — they do not require stack traces. Tag entries matching VELO_ERROR_PATTERNS as is_velo_error: true.',
    },

    // ─── STEP 3: NETWORK CAPTURE ───────────────────────────────────────────────

    {
        step: '3.1-network-list',
        tool: 'list_network_requests',
        params: {
            resourceTypes: ['xhr', 'fetch', 'document'],
            includePreservedRequests: true,
            pageSize: 200,
        },
        note: 'Focus on data requests (xhr/fetch) and navigation requests (document). Exclude image/stylesheet/font/script unless they return 500. Strip auth params from all URLs before logging.',
    },
    {
        step: '3.2-network-detail',
        tool: 'get_network_request',
        params: { reqid: '{{FAILED_REQID}}' },
        dynamic: true,
        note: 'Call for each request with status >= 400 or a failure_reason. IMPORTANT: Do NOT pass responseFilePath for requests to endpoints that may return auth tokens or session data (e.g., /_functions/getAuthToken, /api/session).',
    },

    // ─── STEP 4: FRAME & SELECTOR ASSERTION ────────────────────────────────────

    {
        step: '4.1-iframe-detect',
        tool: 'evaluate_script',
        params: {
            function: `() => {
  return Array.from(document.querySelectorAll('iframe')).map(f => ({
    id:     f.id,
    name:   f.name,
    src:    f.src.substring(0, 120),
    width:  f.offsetWidth,
    height: f.offsetHeight
  }));
}`,
        },
        note: 'Log the returned iframe list. Verify the expected iframe (per path.iframeMatch) is present with offsetWidth > 0 and offsetHeight > 0. If not visible: add a warning to quality_gate.json reasons.',
    },
    {
        step: '4.2-snapshot',
        tool: 'take_snapshot',
        params: { verbose: false },
        note: 'take_snapshot returns the a11y tree across ALL frames (main + all iframes). Use this to verify iframe content rendered. If required text/roles appear in the snapshot, the iframe is functional. The snapshot also gives you uid values usable by click/fill/evaluate_script.',
    },
    {
        step: '4.3-selector-check',
        tool: 'evaluate_script',
        params: {
            function: `(selectorCSS) => {
  const selectors = selectorCSS.split(',').map(s => s.trim());
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      const visible = r.width > 0 && r.height > 0
        && s.display !== 'none'
        && s.visibility !== 'hidden'
        && s.opacity !== '0';
      if (visible) return { selector: sel, found: true, visible: true };
    } catch (_) { continue; }
  }
  // None visible — check if any at least exist in DOM
  for (const sel of selectors) {
    try {
      if (document.querySelector(sel)) return { selector: sel, found: true, visible: false };
    } catch (_) {}
  }
  return { selector: selectorCSS, found: false, visible: false };
}`,
            args: ['{{path.selectorCSS}}'],
        },
        dynamic: true,
        note: 'Runs in main page frame. For selectors inside Wix iframes, evaluate_script cannot reach cross-origin DOM. In that case, rely on take_snapshot result from step 4.2 for iframe selector assertion. The main-frame selector check is still run and logged.',
    },

    // ─── STEP 5: PII BLUR + SCREENSHOT ─────────────────────────────────────────

    {
        step: '5.1-pii-blur',
        tool: 'evaluate_script',
        params: {
            function: `() => {
  const PII_SELECTORS = [
    'input[type="email"]',
    'input[name*="phone"]',
    'input[name*="name"]',
    'input[name*="ssn"]',
    '.member-name',
    '.driver-email',
    '[data-pii="true"]'
  ];
  let count = 0;
  PII_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.style.filter = 'blur(8px)';
      count++;
    });
  });
  return { blurred: count };
}`,
        },
        note: 'Inject CSS blur on PII fields in the main frame. Note: CSS in main frame does NOT affect cross-origin iframes. Wix HTML components with PII fields are cross-origin — their PII is not visible at the main-frame CSS level. Monitor screenshots to determine if iframe PII is exposed.',
    },
    {
        step: '5.2-screenshot',
        tool: 'take_screenshot',
        params: {
            fullPage: true,
            format: 'png',
            filePath: '{{ARTIFACT_ROOT}}/visual_confirmation/{{path.screenshotFile}}',
        },
        dynamic: true,
        note: 'take_screenshot with fullPage:true uses CDP Page.captureScreenshot with captureBeyondViewport:true — captures the full composited page including all iframes. Verify the file is > 10KB after save. If < 10KB: record isBlank=true, retry with fullPage:false as fallback.',
    },
    {
        step: '5.3-pii-unblur',
        tool: 'evaluate_script',
        params: {
            function: `() => {
  const PII_SELECTORS = [
    'input[type="email"]',
    'input[name*="phone"]',
    'input[name*="name"]',
    'input[name*="ssn"]',
    '.member-name',
    '.driver-email',
    '[data-pii="true"]'
  ];
  PII_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.style.filter = '';
    });
  });
  return 'unblurred';
}`,
        },
        note: 'Remove blur CSS after screenshot is saved. Leaves the page in clean state for subsequent navigation.',
    },

    // ─── STEP 6: QUALITY GATE EVALUATION ───────────────────────────────────────

    {
        step: '6.1-evaluate-gate',
        tool: null, // Agent-computed step — no MCP tool call required
        params: {},
        note: `After ALL 5 paths are processed, evaluate the 6 quality gate checks:
    1. zero_p0_errors            — no list_console_messages entries of type "error"
    2. all_selectors_visible     — all evaluate_script selector checks returned visible:true
    3. all_pages_ready           — all wait_for calls resolved without timing out
    4. zero_network_500_errors   — no list_network_requests entries with status >= 500 on LMDR endpoints
    5. screenshots_captured      — all 5 PNG files exist with size > 10KB
    6. zero_velo_worker_errors   — no console entries matching VELO_ERROR_PATTERNS
    Write: quality_gate.json, console_audit.json, network_audit.json`,
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// QUALITY GATE SCHEMA (reference)
// ─────────────────────────────────────────────────────────────────────────────

const QUALITY_GATE_SCHEMA = {
    run_id: '{{RUN_ID}}',
    timestamp: '{{ISO_TIMESTAMP}}',
    pass: false,       // true only if ALL checks are true
    reasons: [],          // human-readable strings (one per check, PASS or FAIL)
    checks: {
        zero_p0_errors: false,
        all_critical_selectors_visible: false,
        all_pages_reached_ready_state: false,
        zero_network_500_errors: false,
        screenshots_captured: false,
        zero_velo_worker_fatal_errors: false,
    },
    pages_evaluated: [],
    pages_failed_ready: [],
    p0_error_count: 0,
    p1_error_count: 0,
    p2_warning_count: 0,
    network_failures: 0,
    artifact_paths: {
        console_audit: '{{ARTIFACT_ROOT}}/console_audit.json',
        network_audit: '{{ARTIFACT_ROOT}}/network_audit.json',
        screenshots: '{{ARTIFACT_ROOT}}/visual_confirmation/',
        quality_gate: '{{ARTIFACT_ROOT}}/quality_gate.json',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSOLE AUDIT SCHEMA (reference)
// ─────────────────────────────────────────────────────────────────────────────

const CONSOLE_AUDIT_SCHEMA = {
    run_id: '{{RUN_ID}}',
    page: '{{pathKey}}',
    url: '{{FULL_URL}}',
    captured_at: '{{ISO_TIMESTAMP}}',
    tool_used: 'list_console_messages + get_console_message',
    summary: {
        total_errors: 0,
        total_warnings: 0,
        p0_errors: 0,
        velo_worker_errors: 0,
    },
    entries: [
        // Each entry from list_console_messages response (errors + warnings):
        // {
        //   msgid:         <number from chrome-devtools-mcp>,
        //   severity:      "ERROR" | "WARN",
        //   timestamp:     <ISO string>,
        //   message:       <string — PII scrubbed>,
        //   stack:         <string | null — from get_console_message>,
        //   url:           <source file URL>,
        //   line:          <number | null>,
        //   column:        <number | null>,
        //   classification: "P0" | "P1" | "P2",
        //   is_velo_error:  <boolean>,
        //   redacted:       <boolean — true if PII was removed>,
        // }
    ],
};

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK AUDIT SCHEMA (reference)
// ─────────────────────────────────────────────────────────────────────────────

const NETWORK_AUDIT_SCHEMA = {
    run_id: '{{RUN_ID}}',
    page: '{{pathKey}}',
    url: '{{FULL_URL}}',
    captured_at: '{{ISO_TIMESTAMP}}',
    tool_used: 'list_network_requests + get_network_request',
    summary: {
        total_xhr_fetch_requests: 0,
        failed_requests: 0,
        server_errors_5xx: 0,
        client_errors_4xx: 0,
        network_failures: 0, // DNS/CORS/timeout failures
    },
    failed_requests: [
        // Each entry from list_network_requests where status >= 400 or failure present:
        // {
        //   reqid:          <number from chrome-devtools-mcp>,
        //   method:         "GET" | "POST" | ...,
        //   url:            <string — auth params stripped>,
        //   status:         <number | null>,
        //   resource_type:  "xhr" | "fetch" | "document" | ...,
        //   failure_reason: <string>,
        //   error_type:     "SERVER_ERROR" | "CLIENT_ERROR" | "NETWORK_ERROR" | "CORS_ERROR" | "TIMEOUT_ERROR",
        //   duration_ms:    <number | null>,
        // }
    ],
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS (for use in tests or other scripts)
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
    SITE_BASE_URL,
    RUN_ID,
    ARTIFACT_ROOT,
    CRITICAL_PATHS,
    PII_SCRUB_PATTERNS,
    VELO_ERROR_PATTERNS,
    PLAYBOOK_STEPS,
    QUALITY_GATE_SCHEMA,
    CONSOLE_AUDIT_SCHEMA,
    NETWORK_AUDIT_SCHEMA,
};
