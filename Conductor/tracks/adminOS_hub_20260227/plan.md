# Track Plan: AdminOS Hub — Unified Super Admin Operating System

> **IMPORTANT FOR EXECUTING AGENT:** Read `spec.md` in this directory FIRST before executing any phase. It contains the canonical layout diagram, design token table, view module contract, and PostMessage bridge protocol. All decisions in this plan reference `spec.md`.
>
> **Reference Files (read before starting):**
> - `spec.md` — Full technical specification and design reference
> - `src/public/recruiter/os/RecruiterOS.html` — The mirror template for AdminOS
> - `src/public/recruiter/os/js/ros-shell.js` — The shell layout builder to mirror
> - `src/public/recruiter/os/js/ros-config.js` — Config structure to mirror
> - `src/public/admin/os/js/aos-config.js` — Existing AdminOS config (already has all 44 tools)
> - `src/public/admin/os/AdminOS.html` — File to REPLACE (not extend)
> - `src/public/recruiter/os/css/recruiter-os.css` — Design system CSS to reuse

> [!CAUTION]
> ## ⛔ ZERO MOCK DATA POLICY
> **Absolutely NO inline mock data, hardcoded placeholder values, fake arrays, or `const SAMPLE = [...]` patterns anywhere in the codebase.** This is a production application.
>
> - All data MUST flow through the PostMessage bridge → Wix Velo backend `.jsw` services → real Wix Data collections.
> - If a collection is empty and needs seed data, create a migration script at `src/backend/migrations/seed_[name].jsw`. Do NOT inline fake data into view modules.
> - Loading states (skeletons/spinners), empty states ("No records found"), and error states ("Failed to load") are required and acceptable. These are UI states, not mock data.
> - Chart.js charts must render from real backend data. If the response is empty, show an empty chart with a "No data available" overlay — NOT hardcoded `[10, 20, 30]` values.
> - If the bridge is disconnected (testing outside Wix), views should show "Offline — connect to Wix" — NOT fall back to local mock data.
>
> See `spec.md` Section 1 for the full policy.

---

## Phase 1: Shell Foundation Rewrite

**Goal:** Replace the current `AdminOS.html` and `aos-shell.js` with the final approved layout matching the Stitch mockup "ADMINOPS Spatial Command Center". The shell must render correctly with no hard-coded data.

### 1.1 Rewrite `AdminOS.html`

- [ ] Task: Open `src/public/admin/os/AdminOS.html` and REPLACE its entire contents
- [ ] Task: The new HTML must use the EXACT same head structure as `RecruiterOS.html`:
  - Theme init IIFE that reads `localStorage['aos-theme']` (values: `light`, `solar`, `dark`, default: `light`)
  - Google Fonts: Inter (300-900), Material Symbols Outlined
  - Tailwind CDN (`https://cdn.tailwindcss.com?plugins=forms,container-queries`) with inline `tailwind.config` containing all color tokens from `spec.md` Section 3
  - Link to `recruiter-os.css` via jsDelivr: `https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/css/recruiter-os.css`
  - Link to `admin-os.css` via jsDelivr: `https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/admin/os/css/admin-os.css`
- [ ] Task: The body must have a single root div: `<div id="aos-root" class="flex flex-col h-screen overflow-hidden font-d"></div>`
- [ ] Task: Load scripts in this exact order (CDN path pattern: `https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/`):
  1. `src/public/admin/os/js/aos-config.js`
  2. `src/public/admin/os/js/aos-bridge.js`
  3. `src/public/admin/os/js/aos-views.js`
  4. `src/public/admin/os/js/aos-shell.js`
  5. `src/public/admin/os/js/aos-chat.js` *(new — created in Phase 2)*
  6. `src/public/admin/os/js/aos-spotlight.js` *(new — created in Phase 2)*
  7. One `<script>` tag per view module (add incrementally as views are created)
- [ ] Task: The bootstrap script at bottom must call: `AOS.shell.init()`, then `AOS.views.showView('home')`, then `AOS.bridge.init()`

### 1.2 Rewrite `aos-shell.js` — Topbar

File: `src/public/admin/os/js/aos-shell.js`

- [ ] Task: Overwrite entire file with a new IIFE that sets `window.AOS.shell = { init, syncNav, dockNav, toggleTheme, toggleCopilot, toggleDrawer }`
- [ ] Task: `init()` function must: query `#aos-root`, set `innerHTML = buildLayout()`, call `startClock()`, sync theme icon state
- [ ] Task: `buildLayout()` must return the full 5-zone HTML string (see `spec.md` Section 2.1 layout diagram)
- [ ] Task: `buildTopbar()` must render:
  - LEFT: hamburger menu button (`id="aosHamburger"`), brand icon + "ADMINOPS" in tracked uppercase, horizontal nav links (Admin, Data, Platform) — functionally decorative for now
  - RIGHT: search pill (opens spotlight on click, `onclick="AOS.spotlight.open()"`), notification bell (`id="aosNotifBell"`) with `<span id="aosNotifBadge">0</span>`, theme toggle icon (`id="aosThemeIcon"`, `onclick="AOS.shell.toggleTheme()"`), clock (`id="aosClock"`)
  - Topbar must carry the class `id="aos-topbar"` for CSS targeting

### 1.3 Rewrite `aos-shell.js` — Left Rail (9 Orbs)

- [ ] Task: `buildLeftRail()` renders a `<div id="aos-left-rail">` that is 72px wide and full height
- [ ] Task: The rail contains 9 icon-only orb buttons. Each rendered by `buildRailOrb(tool)`:
  - A `<button class="aos-rail-orb" data-view="[tool.view]" onclick="AOS.shell.dockNav('[tool.view]', this)">` 
  - Inside: a `<div class="w-10 h-10 rounded-xl bg-gradient-to-br [tool.gradient] flex items-center justify-center shadow-md">` containing a Material Symbol icon
  - No text labels (icon only, for compactness)
  - A `.neu` raised neumorphic card style applied
- [ ] Task: The 9 orbs must be built from this hardcoded subset of `AOS.TOOL_REGISTRY` (in order):
  `['home', 'observability', 'ai-router', 'drivers', 'carriers', 'matches', 'billing', 'content', 'gamification-analytics']` — look them up by `view` property from `AOS.TOOL_REGISTRY`
- [ ] Task: At the bottom of the rail, add a "More" orb (`grid_view` icon) that opens the full drawer panel: `onclick="AOS.shell.openDrawerPanel()"`
- [ ] Task: `syncNav(viewId)` function must add `active` class (ring-2 ring-solar-blue) to matching orb and remove from others

### 1.4 Rewrite `aos-shell.js` — Full Drawer Panel (Flyout)

- [ ] Task: `buildDrawerPanel()` renders a `<div id="aos-drawer-panel" class="hidden">` overlaying the workspace from the left
- [ ] Task: The drawer panel shows all 8 drawer accordions from `AOS.config.drawers`, each generated by `buildDrawer(drawer)` (identical pattern to `ros-shell.js` `buildDrawer()`)
  - Header row with icon, label, tool count, chevron
  - Collapsible body with 3-column tool orb grid (using `AOS.getDrawerTools(drawer.id)`)
  - Each tool orb invokes `AOS.shell.dockNav('[view]', this)` on click
- [ ] Task: `openDrawerPanel()` / `closeDrawerPanel()` must toggle visibility with a CSS slide-in transition

### 1.5 Rewrite `aos-shell.js` — Central Workspace

- [ ] Task: `buildWorkspace()` returns `<div id="aos-stage" class="...">` with `<div id="aos-view-container"></div>` inside
- [ ] Task: The workspace background must use the dot-grid CSS (defined in `admin-os.css` Phase 1.6)
- [ ] Task: Above the view container, a single `<div id="aos-breadcrumb">` with initial content `<span>AdminOS</span> › <span id="aos-breadcrumb-view">Home</span>` — view navigation updates ID `aos-breadcrumb-view`

### 1.6 Rewrite `aos-shell.js` — Right Copilot Sidebar

- [ ] Task: `buildCopilot()` renders `<div id="aos-copilot" class="hidden">` (300px wide, attached to right edge)
- [ ] Task: Copilot header: robot icon + "Admin Copilot" text + green pulse dot (`animate-pulse w-1.5 h-1.5 bg-emerald-500 rounded-full`) + close button (`onclick="AOS.shell.toggleCopilot()"`)
- [ ] Task: Copilot message area: `<div id="aos-copilot-msgs">` with an initial greeting message bubble: `"How can I assist? Try 'show system health' or 'find carrier 12345'."`
- [ ] Task: Copilot quick pills: 4 buttons dispatching to `AOS.chat.send()`: "System Health", "Find Driver #1234", "AI Cost Report", "View Audit Log"
- [ ] Task: Copilot input area:
  - Voice toggle button: `<button id="aos-voice-btn" onclick="AOS.shell.toggleVoice()">` with `mic` icon — clicking morphs input area into a large pulsing blue circle (voice listening state)
  - Text input: `<input id="aos-copilot-input" placeholder="Message Admin Copilot..." onkeydown="if(e.key==='Enter')AOS.chat.send()">`
  - Send button: blue circle with `arrow_upward` icon, `onclick="AOS.chat.send()"`
- [ ] Task: `toggleCopilot()` function: toggle the `hidden` class and `translateX` CSS transition on `#aos-copilot`
- [ ] Task: `toggleVoice()` function: toggle a `voice-active` class on `#aos-copilot` that shows a large pulsing orb overlay in the copilot input area and hides the text input

### 1.7 Rewrite `aos-shell.js` — Command Bar

- [ ] Task: `buildCommandBar()` returns `<div id="aos-cmd-bar" class="...">` (glassmorphic, fixed bottom above dock)
- [ ] Task: Row 1: 5 quick chip `<button>` elements calling `AOS.chat.send('[chip text]')`:
  - "Run Diagnostics", "Audit AI Spend", "Find Carrier", "View Logs", "Feature Flags"
- [ ] Task: Row 2: chat bar with robot avatar (`smart_toy` icon in blue gradient circle), `<input id="aos-cmd-input" placeholder="Ask AdminOS anything — try 'show system health'...">`, and send `<button id="aos-cmd-send">` with `arrow_upward` icon
- [ ] Task: Enter key on `#aos-cmd-input` dispatches to `AOS.chat.send()`

### 1.8 Rewrite `aos-shell.js` — Floating Dock

- [ ] Task: `buildDock()` returns `<div class="dock-pill" id="aosDock">` (centered bottom pill, `position: fixed`)
- [ ] Task: 5 dock items built from a hardcoded array in the IIFE:
  ```javascript
  const DOCK = [
    { view: 'home', icon: 'space_dashboard', label: 'Home' },
    { view: 'observability', icon: 'monitoring', label: 'Traces', badge: true },
    { view: 'ai-router', icon: 'account_tree', label: 'AI Router' },
    { view: 'drivers', icon: 'group', label: 'Drivers' },
    { view: 'carriers', icon: 'business_center', label: 'Carriers' }
  ];
  ```
- [ ] Task: `dockNav(viewId, el)` must: remove `active` from all `.dk-i` elements, add `active` to clicked element, call `AOS.views.showView(viewId)`, call `AOS.shell.syncNav(viewId)`

### 1.9 Update `admin-os.css` — Dot-Grid and Rail Styles

File: `src/public/admin/os/css/admin-os.css`

- [ ] Task: Add `.aos-workspace-grid` class with SVG dot-grid background:
  ```css
  .aos-workspace-grid {
    background-image: radial-gradient(circle, #C8B896 1px, transparent 1px);
    background-size: 20px 20px;
  }
  .dark .aos-workspace-grid {
    background-image: radial-gradient(circle, rgba(134,144,152,0.2) 1px, transparent 1px);
  }
  ```
- [ ] Task: Add `#aos-left-rail` styles: `width: 72px; min-width: 72px; display: flex; flex-direction: column; align-items: center; padding: 12px 0; gap: 8px; overflow-y: auto; border-right: 1px solid rgba(0,0,0,0.05);`
- [ ] Task: Add `#aos-copilot` styles: `width: 300px; position: relative; border-left: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; transition: transform 0.3s ease; transform: translateX(0);`
- [ ] Task: Add `#aos-copilot.hidden` → `transform: translateX(100%); display: none;`
- [ ] Task: Add `#aos-drawer-panel` styles: `position: absolute; left: 72px; top: 0; bottom: 0; width: 280px; z-index: 50; background: var(--bg-surface); border-right: 1px solid rgba(0,0,0,0.1); box-shadow: 4px 0 20px rgba(0,0,0,0.15); overflow-y: auto; transition: transform 0.25s ease; transform: translateX(0);`
- [ ] Task: Add `#aos-drawer-panel.hidden` → `transform: translateX(-100%);`
- [ ] Task: Add `#aos-cmd-bar` glassmorphic style: `backdrop-filter: blur(12px); background: rgba(245,245,220,0.85); .dark & { background: rgba(7,54,66,0.9); }`
- [ ] Task: Add `voice-active` class for the copilot voice state: when `#aos-copilot.voice-active`, show `#aos-voice-orb` (large pulsing blue circle overlay)

### 1.10 Verification — Phase 1

- [x] Task: Load `AdminOS.html` in a local browser (file:// or HTTP server) with no Velo connection
- [x] Task: Verify all 5 layout zones render: topbar, left rail (9 orbs), workspace (dot-grid bg), right copilot (hidden by default), command bar, dock
- [x] Task: Verify clicking each of the 9 rail orbs adds the `active` state correctly
- [x] Task: Verify clicking the "More" orb opens the drawer panel with all 8 accordion drawers
- [x] Task: Verify clicking the chat icon in topbar shows/hides the copilot sidebar
- [x] Task: Verify the theme toggle cycles: light → solar → dark → light
- [x] Task: Verify dock items show tooltips and highlight active state correctly
- [x] Task: Verify the breadcrumb text changes when navigating between views (even before views exist, it should update the text)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Shell Foundation'

---

## Phase 2: Chat System & Spotlight

**Goal:** Implement the Admin Copilot chat logic (`aos-chat.js`) and the ⌘K command spotlight (`aos-spotlight.js`), making both interactive without requiring Velo connection.

### 2.1 Create `aos-chat.js`

File: `src/public/admin/os/js/aos-chat.js` — IIFE, exports `window.AOS.chat = { send, addMessage, clearHistory }`

- [x] Task: `send(text)` function: if text is empty return. Call `addMessage('user', text)`. Call `AOS.bridge.send('AOS_CHAT_MESSAGE', { text })` to send to Velo. Clear the input field.
- [x] Task: `addMessage(role, text)` function: create a chat bubble `<div>` (user or assistant style), append to `#aos-copilot-msgs` and `#aos-chat-msgs` (command bar thread), auto-scroll to bottom
- [x] Task: User bubble style: right-aligned, `bg-lmdr-blue text-white`, rounded `rounded-2xl rounded-tr-sm`
- [x] Task: Assistant bubble style: left-aligned, `.neu-s` card, text-lmdr-dark dark:text-white, icon avatar on left
- [x] Task: Also sync quick chip clicks in `#aos-cmd-bar` to the copilot sidebar (show copilot open if chip clicked)
- [x] Task: Handle incoming Velo response: `AOS.bridge.on('AOS_CHAT_RESPONSE', (data) => AOS.chat.addMessage('assistant', data.response))`
- [x] Task: Add a fallback local response if no Velo response in 5 seconds (display "Connecting to backend..." message)

### 2.2 Create `aos-spotlight.js`

File: `src/public/admin/os/js/aos-spotlight.js` — IIFE, exports `window.AOS.spotlight = { open, close, filter }`

- [x] Task: Render `<div id="aos-spotlight-overlay">` (full-screen dimmed overlay, click outside to close) containing a `<div id="aos-spotlight-box">` (centered, 520px wide)
- [x] Task: Spotlight box contains: search input (`id="aosSpotlightInput"`, placeholder `"Search tools, views, actions..."`), results list (`id="aosSpotlightResults"`) 
- [x] Task: `filter(query)` function: filter `AOS.TOOL_REGISTRY` by name fuzzy match, render up to 8 matching results as clickable rows (icon + name + description)
- [x] Task: Each result row: `onclick="AOS.views.showView('[tool.view]'); AOS.spotlight.close()"`
- [x] Task: `open()` show overlay + focus input + populate initial results (all tools)
- [x] Task: `close()` hide overlay, clear input
- [x] Task: Register keyboard shortcut: `document.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') AOS.spotlight.open(); if (e.key === 'Escape') AOS.spotlight.close(); })`
- [x] Task: Wire up the search pills in topbar and left rail to `AOS.spotlight.open()`

### 2.3 Verification — Phase 2

- [x] Task: Verify chat input in copilot sidebar sends message and displays user bubble
- [x] Task: Verify quick chip buttons open copilot and add a message
- [x] Task: Verify ⌘K keyboard shortcut opens spotlight
- [x] Task: Verify spotlight search filters tools in real time
- [x] Task: Verify clicking a spotlight result closes it and triggers view navigation
- [x] Task: Conductor - User Manual Verification 'Phase 2: Chat & Spotlight'

---

## Phase 3: View Manager Upgrade

**Goal:** Upgrade `aos-views.js` to fully support the view module lifecycle (`mount`, `unmount`, `handleMessage`) and implement a loading state pattern.

### 3.1 Upgrade `aos-views.js`

- [ ] Task: `AOS.views` must export: `showView(viewId)`, `getCurrentView()`, `handleVeloMessage(type, data)`, `registerView(viewId, moduleObj)`
- [ ] Task: `showView(viewId)` must:
  1. Call `unmount()` on the current view if one is active
  2. Set container `innerHTML` to a loading skeleton HTML: `<div class="aos-view-skeleton">... animated gradient bars ...</div>`
  3. Update breadcrumb: `document.getElementById('aos-breadcrumb-view').textContent = AOS.getToolByView(viewId)?.name || viewId`
  4. Look up the view module in a registry: `const mod = AOS.viewModules[viewId]`
  5. If module exists: call `mod.mount(container)`; if not: render a "View coming soon" placeholder
  6. Call `AOS.shell.syncNav(viewId)` to sync the active orb/dock state
- [ ] Task: `AOS.viewModules` is a plain object: keys are viewId strings, values are `{ mount, unmount, handleMessage }` objects
- [ ] Task: View modules are registered when their script loads: `AOS.views.registerView('home', { mount, unmount, handleMessage })`
- [ ] Task: `handleVeloMessage(type, data)` dispatches to the active view's `handleMessage(type, data)` method

### 3.2 Verification — Phase 3

- [ ] Task: Navigate between 2 views (even placeholders) and verify: correct breadcrumb update, loading skeleton shows briefly, `unmount()` is called on the previous view (add a `console.log` to verify)
- [ ] Task: Conductor - User Manual Verification 'Phase 3: View Manager'

---

## Phase 4: Core View Modules (9 Primary Orbs)

**Goal:** Build the 9 view modules corresponding to the 9 left-rail orbs. Each module is a self-contained JS file that ports the functionality from the corresponding standalone HTML source.

> [!CAUTION]
> **ZERO MOCK DATA.** Every `renderHTML()` function renders **empty containers** (tables with no rows, chart canvases with no data, KPI cards showing `--`). The `mount()` function calls `AOS.bridge.send()` to request real data from Velo. The `handleMessage()` callback populates the UI with the real response. If the collection is empty, show an empty state — NEVER hardcode placeholder numbers or fake rows.

For each view below, the executing agent must:
1. Open the **source standalone HTML** file listed and study its UI structure and data
2. Create a new JS view module file at the path listed
3. The module's `renderHTML()` function must recreate the key UI panels from the source HTML using the AdminOS design tokens (NOT the CSS from the source file)
4. Bind data loading to `AOS.bridge.send(action, payload)` calls with the matching Velo action listed
5. **If the underlying Wix Data collection for a view is expected to be empty**, add a seeding task to Phase 4.11

---

### 4.1 Home Dashboard — `aos-view-home.js`

- **Source:** `src/public/admin/ADMIN_DASHBOARD.html` (40KB, the largest — study thoroughly)
- **File:** `src/public/admin/os/js/views/aos-view-home.js`
- **Velo Action:** `AOS_GET_DASHBOARD_STATS` → `admin_dashboard_service.jsw::getDashboardOverview()`
- [ ] Task: `renderHTML()` returns a 2-section layout:
  - **Section A: KPI Row** — 4 horizontal `.neu` cards: `Total Drivers`, `Active Carriers`, `Matches Today`, `AI Spend ($)` — each with a large metric number, label, and trend arrow (↑ / ↓ with %)
  - **Section B: Activity Panel** — a single `.neu` panel with a line chart (use Chart.js from CDN: `https://cdn.jsdelivr.net/npm/chart.js`) titled "Platform Activity — 30 Days"
  - **Section C: Alerts** — a condensed list of system alerts (type + message + time), max 5 items
- [ ] Task: `mount(container)` renders HTML, then calls `AOS.bridge.send('AOS_GET_DASHBOARD_STATS', {})`
- [ ] Task: `handleMessage('AOS_DASHBOARD_STATS_RESPONSE', data)` updates KPI numbers, chart data, and alerts list
- [ ] Task: Set up a 60-second polling interval in `mount()` and clear it in `unmount()`

---

### 4.2 Observability — `aos-view-observability.js`

- **Source:** `src/public/admin/ADMIN_OBSERVABILITY.html` (39KB)
- **File:** `src/public/admin/os/js/views/aos-view-observability.js`
- **Velo Action:** `AOS_GET_TRACES` → `observabilityService.jsw::getTraces(50)`
- [ ] Task: `renderHTML()` returns:
  - **Filters bar:** dropdowns for Level (error/warn/info), Service (all services), Date range
  - **Log stream table:** scrollable table with columns: Timestamp, Level (colored badge), Service, Message, Duration. Rows are color-coded by severity.
  - **Summary bar:** total count, error count, avg duration
- [ ] Task: `handleMessage('AOS_TRACES_RESPONSE', data)` populates the log table
- [ ] Task: Clicking a row expands an inline detail panel showing the full trace payload JSON

---

### 4.3 AI Router — `aos-view-ai-router.js`

- **Source:** `src/public/admin/ADMIN_AI_ROUTER.html` (17KB)
- **File:** `src/public/admin/os/js/views/aos-view-ai-router.js`
- **Velo Action:** `AOS_GET_AI_PROVIDERS` → `aiRouterService.jsw::getProviders()`
- [ ] Task: `renderHTML()` returns:
  - **Provider cards:** one `.neu` card per AI provider (Claude, Perplexity, Gemini, Groq) showing: status badge (Online/Offline), model name, latency (ms), cost per 1K tokens, request count today
  - **Active route config:** shows which provider is currently active for each route type (enrichment, social scan, synthesis, chat)
  - **Swap button:** each route has a dropdown to change the provider, fires `AOS_SET_AI_ROUTE` bridge action

---

### 4.4 Drivers — `aos-view-drivers.js`

- **Source:** `src/public/admin/ADMIN_DRIVERS.html` (31KB)
- **File:** `src/public/admin/os/js/views/aos-view-drivers.js`
- **Velo Action:** `AOS_GET_DRIVERS` → `admin_service.jsw::getDriversList(filters, pagination)`
- [ ] Task: `renderHTML()` returns:
  - **Search + Filter bar:** text search, status filter (Active/Suspended/Pending), CDL class filter, state filter
  - **Data table:** columns: Name, Email, CDL Class, Status (badge), Score, Last Active, Actions (icon buttons: View, Suspend, Email)
  - **Pagination:** Previous / Next with page X of Y display
- [ ] Task: Search input debounces (300ms) before sending `AOS_GET_DRIVERS` with `{ search: query }`
- [ ] Task: Clicking a row name opens a detail panel (right-side drawer within the view) showing the driver's full profile (port from `ADMIN_DRIVERS.html` detail panel)

---

### 4.5 Carriers — `aos-view-carriers.js`

- **Source:** `src/public/admin/ADMIN_CARRIERS.html` (24KB)
- **File:** `src/public/admin/os/js/views/aos-view-carriers.js`
- **Velo Action:** `AOS_GET_CARRIERS` → `admin_service.jsw::getCarriersList(filters)`
- [ ] Task: `renderHTML()` returns:
  - **Filter bar:** DOT number search, fleet size range, FMCSA Safety Rating filter
  - **Carrier table:** columns: Company Name, DOT #, Fleet Size, Safety Rating (colored badge), Enriched (date or "Never"), Actions (Re-enrich, View)
  - **"Force Enrich" button** per row: fires `AOS_FORCE_ENRICH` bridge action with carrierId
  - **Pagination** with page controls

---

### 4.6 Matches — `aos-view-matches.js`

- **Source:** `src/public/admin/ADMIN_MATCHES.html` (17KB)
- **File:** `src/public/admin/os/js/views/aos-view-matches.js`
- **Velo Action:** `AOS_GET_MATCHES` → `admin_match_service.jsw::getMatchStats()`
- [ ] Task: `renderHTML()` returns:
  - **Stats row:** 4 KPI cards: Total Matches, Avg Score, Accepted, Pending
  - **Matches table:** columns: Driver Name, Carrier Name, Score (%), Status badge, Date, Actions
  - **Score histogram chart** (Chart.js bar chart)

---

### 4.7 Billing — `aos-view-billing.js`

- **Source:** `src/public/admin/ADMIN_BILLING_MANAGEMENT.html` (22KB)
- **File:** `src/public/admin/os/js/views/aos-view-billing.js`
- **Velo Action:** `AOS_GET_BILLING` → `stripeService.jsw` subscription query
- [ ] Task: `renderHTML()` returns:
  - **MRR card:** Monthly Recurring Revenue figure with trend
  - **Subscribers table:** columns: Company/Recruiter, Plan (Free/Pro/Enterprise), Status, Next Billing, Actions (View Stripe Portal, Cancel)
  - **Revenue chart** (Chart.js line chart, monthly)

---

### 4.8 Content — `aos-view-content.js`

- **Source:** `src/public/admin/ADMIN_CONTENT.html` (8KB) + `src/public/admin/ADMIN_MODERATION.html` (10KB)
- **File:** `src/public/admin/os/js/views/aos-view-content.js`
- **Velo Action:** `AOS_GET_CONTENT_QUEUE` → `admin_content_service.jsw::getModerationQueue()`
- [ ] Task: `renderHTML()` returns:
  - **Queue tabs:** "Reviews", "Job Postings", "Documents" (tab switcher)
  - **Content list:** each item: type badge + content preview + reporter + created date + row of action buttons: Approve, Reject, Flag User
  - **Detail pane:** clicking a row opens a right drawer with full content preview and AI sentiment analysis display

---

### 4.9 Gamification Analytics — `aos-view-gamification.js`

- **Source:** `src/public/admin/ADMIN_GAMIFICATION_ANALYTICS.html` (15KB)
- **File:** `src/public/admin/os/js/views/aos-view-gamification.js`
- **Velo Action:** `AOS_GET_GAMIFICATION` → `gamificationAnalyticsService.jsw::getEconomyHealthMetrics()`
- [ ] Task: `renderHTML()` returns:
  - **Health status row:** 4 KPI cards: Total XP Awarded (7d), Active Streaks, Challenge Completion Rate, Abuse Alerts
  - **Level distribution chart** (Chart.js bar, shows how many drivers are at each level 1-10)
  - **Top earners table:** columns: Driver Name, XP (7d), Streak, Level, Achievements unlocked
  - **Abuse alerts list:** any usage patterns flagged by `detectAbusePatterns()`

### 4.10 Verification — Phase 4

- [ ] Task: Navigate to each of the 9 views and verify they render the correct HTML structure
- [ ] Task: Verify loading skeleton shows while awaiting Velo data
- [ ] Task: Verify that when bridge is disconnected (file:// testing), each view shows a loading or offline state — NOT mock data
- [ ] Task: Verify the breadcrumb updates correctly for each view
- [ ] Task: Verify Chart.js loads and charts render (even with empty data initially)
- [ ] Task: Verify data tables render with correct column headers (rows may be empty)
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Core Views'

### 4.11 Data Seeding (if collections are empty)

If any core view's Wix Data collection has zero records, create a seeding migration script. These are one-time scripts to populate realistic sample data so the views can be visually verified end-to-end.

- [ ] Task: If `Drivers` collection is empty → `src/backend/migrations/seed_sample_drivers.jsw` (insert 25 sample driver profiles)
- [ ] Task: If `Carriers` collection is empty → `src/backend/migrations/seed_sample_carriers.jsw` (insert 15 sample carrier records with FMCSA data)
- [ ] Task: If `AdminAuditLog` is empty → `src/backend/migrations/seed_audit_log.jsw` (insert 50 sample audit events)
- [ ] Task: If `GamificationEvents` is empty → `src/backend/migrations/seed_gamification_events.jsw` (insert 100 sample XP/point events)
- [ ] Task: If `MatchResults` is empty → `src/backend/migrations/seed_matches.jsw` (insert 30 sample driver-carrier matches)
- [ ] Task: Each seed script must be idempotent (check if records exist before inserting; skip if already seeded)
- [ ] Task: Each seed script must be runnable as a Velo web module: `export async function seedXxx()` callable from browser console via `wix-web-module`

---

## Phase 5: Remaining 35 View Modules

**Goal:** Build the remaining view modules for all tools in the `aos-config.js` TOOL_REGISTRY. These views are lower priority and can use a simpler "iframe passthrough" pattern for initial delivery, with full-rewrite as a stretch goal.

### 5.1 Iframe Passthrough Pattern

For views where a full JS-rewrite is not feasible in this track, use the **iframe passthrough** approach:

```javascript
// Pattern: mount() just renders an iframe pointing to the standalone HTML file
function mount(container) {
  container.innerHTML = `
    <div class="h-full w-full" style="min-height: 600px;">
      <iframe
        src="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/admin/[FILENAME].html"
        class="w-full h-full border-0 rounded-xl"
        title="[View Name]"
      ></iframe>
    </div>
  `;
}
```

This is acceptable for Phase 5 because: the user can access the full standalone functionality through the iframe, while the AdminOS shell still provides navigation, theming, and the copilot. Full JS rewrites can be done as follow-up tracks.

### 5.2 Implement Passthrough Views

For each tool below, create a view module file and implement the iframe passthrough pattern:

**Core Operations:**
- [ ] Task: `aos-view-platform-config.js` — source: `ADMIN_PLATFORM_CONFIG.html`
- [ ] Task: `aos-view-feature-flags.js` — source: `ADMIN_FEATURE_FLAGS.html`
- [ ] Task: `aos-view-ab-tests.js` — source: `ADMIN_AB_TESTS.html`

**User Management:**
- [ ] Task: `aos-view-reverse-matching.js` — source: `ADMIN_REVERSE_MATCHING.html`

**Finance:**
- [ ] Task: `aos-view-revenue.js` — source: `ADMIN_REVENUE_DASHBOARD.html`
- [ ] Task: `aos-view-invoicing.js` — source: `ADMIN_INVOICING.html`
- [ ] Task: `aos-view-commissions.js` — source: `ADMIN_COMMISSIONS.html`

**AI & Content:**
- [ ] Task: `aos-view-prompts.js` — source: `ADMIN_PROMPTS.html`
- [ ] Task: `aos-view-health-content.js` — source: `ADMIN_HEALTH_CONTENT.html`
- [ ] Task: `aos-view-kb-list.js` — source: `ADMIN_KB_LIST.html`
- [ ] Task: `aos-view-kb-editor.js` — source: `ADMIN_KB_EDITOR.html`
- [ ] Task: `aos-view-kb-analytics.js` — source: `ADMIN_KB_ANALYTICS.html`

**Support & Comms:**
- [ ] Task: `aos-view-tickets.js` — source: `ADMIN_TICKETS.html`
- [ ] Task: `aos-view-ticket-detail.js` — source: `ADMIN_TICKET_DETAIL.html`
- [ ] Task: `aos-view-chat.js` — source: `ADMIN_CHAT.html`
- [ ] Task: `aos-view-email-templates.js` — source: `ADMIN_EMAIL_TEMPLATES.html`
- [ ] Task: `aos-view-notification-rules.js` — source: `ADMIN_NOTIFICATION_RULES.html`
- [ ] Task: `aos-view-nps.js` — source: `ADMIN_NPS.html`

**Analytics & Telemetry:**
- [ ] Task: `aos-view-feature-adoption.js` — source: `ADMIN_FEATURE_ADOPTION.html`
- [ ] Task: `aos-view-audit-log.js` — source: `ADMIN_AUDIT_LOG.html`

**B2B Hub:**
- [ ] Task: `aos-view-b2b-dashboard.js` — source: `B2B_DASHBOARD.html`
- [ ] Task: `aos-view-b2b-pipeline.js` — source: `B2B_PIPELINE.html`
- [ ] Task: `aos-view-b2b-analytics.js` — source: `B2B_ANALYTICS.html`
- [ ] Task: `aos-view-b2b-campaigns.js` — source: `B2B_CAMPAIGNS.html`
- [ ] Task: `aos-view-b2b-lead-capture.js` — source: `B2B_LEAD_CAPTURE.html`
- [ ] Task: `aos-view-b2b-outreach.js` — source: `B2B_OUTREACH.html`
- [ ] Task: `aos-view-b2b-research.js` — source: `B2B_RESEARCH_PANEL.html`
- [ ] Task: `aos-view-b2b-account.js` — source: `B2B_ACCOUNT_DETAIL.html`

**API Portal:**
- [ ] Task: `aos-view-api-dashboard.js` — source: `API_PORTAL_DASHBOARD.html`
- [ ] Task: `aos-view-api-status.js` — source: `API_STATUS.html`
- [ ] Task: `aos-view-api-docs.js` — source: `API_DOCS_PORTAL.html`
- [ ] Task: `aos-view-api-changelog.js` — source: `API_CHANGELOG.html`
- [ ] Task: `aos-view-api-partners.js` — source: `ADMIN_API_PARTNERS.html`

### 5.3 Register All Views in `AdminOS.html`

- [ ] Task: Add one `<script src="...">` tag in `AdminOS.html` per new view module file, in the order they appear in `AOS.TOOL_REGISTRY`
- [ ] Task: All script tags must use the jsDelivr CDN URL: `https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/admin/os/js/views/[filename]`

### 5.4 Verification — Phase 5

- [ ] Task: Click every orb in the drawer panel and verify all 44 views load without console errors
- [ ] Task: Verify iframe-based views render the source HTML within the workspace area
- [ ] Task: Verify theme changes are respected by the AdminOS chrome (sidebar/topbar/dock) even when an iframe view is loaded
- [ ] Task: Conductor - User Manual Verification 'Phase 5: All Views'

---

## Phase 6: Wix Page Integration & Bridge Wiring

**Goal:** Wire the AdminOS HTML Component to the Wix Velo page code so all `AOS_*` bridge actions get real responses from the backend.

### 6.1 Wix Page Setup

- [ ] Task: In Wix Editor, open (or create) the Admin page that will host AdminOS
- [ ] Task: Add an `HtmlComponent` element and set its source to `public/admin/os/AdminOS.html`
- [ ] Task: Set the HtmlComponent to stretch full-screen (100% width, 100% height, no margin)
- [ ] Task: In the Wix page code (`.js` file auto-named by Wix), set up the `onMessage` handler:
  ```javascript
  $w('#adminOSFrame').onMessage(async (event) => {
    const { action, payload } = event.data;
    let response;
    // ... dispatch to backend services ...
    $w('#adminOSFrame').postMessage({ type: action + '_RESPONSE', data: response });
  });
  ```

### 6.2 Bridge Action Handlers in Wix Page Code

For each bridge action, the Wix page code must import from the appropriate backend service and call the function. Add one handler per action:

- [ ] Task: `AOS_GET_DASHBOARD_STATS` → `import { getDashboardOverview } from 'backend/admin_dashboard_service'` → return result
- [ ] Task: `AOS_GET_DRIVERS` → `import { getDriversList } from 'backend/admin_service'` → pass `payload.filters, payload.pagination`
- [ ] Task: `AOS_GET_CARRIERS` → `import { getCarriersList } from 'backend/admin_service'` → pass `payload.filters`
- [ ] Task: `AOS_GET_TRACES` → `import { getTraces } from 'backend/observabilityService'` → pass `payload.limit || 50`
- [ ] Task: `AOS_GET_AI_PROVIDERS` → `import { getProviders } from 'backend/aiRouterService'` → return result
- [ ] Task: `AOS_GET_MATCHES` → `import { getMatchStats } from 'backend/admin_match_service'` → return result
- [ ] Task: `AOS_GET_BILLING` → `import { getSubscriptions } from 'backend/stripeService'` → return result
- [ ] Task: `AOS_GET_GAMIFICATION` → `import { getEconomyHealthMetrics } from 'backend/gamificationAnalyticsService'` → return result
- [ ] Task: `AOS_FORCE_ENRICH` → `import { forceEnrichCarrier } from 'backend/aiEnrichment'` → pass `payload.carrierId`
- [ ] Task: `AOS_SET_AI_ROUTE` → `import { setRoute } from 'backend/aiRouterService'` → pass `payload`
- [ ] Task: `AOS_CHAT_MESSAGE` → call AI agent (see agentic tracks) → return `{ response: string, intent: string }`

### 6.3 Authentication Guard

- [ ] Task: On page load in Wix page code, call `currentMember.getMember()` and verify that the member has admin role. If not admin, redirect to homepage.
- [ ] Task: All bridge action handlers must verify admin role before executing (pass `memberId` in each `AOS_*` request, verify server-side in `admin_service.jsw::isAdmin(memberId)`)

### 6.4 Verification — Phase 6

- [ ] Task: In Wix Preview mode, load the admin page and verify `AdminOS.html` loads inside the HtmlComponent
- [ ] Task: Navigate to each of the 9 primary views and verify real data loads from Velo (check Network tab in DevTools)
- [ ] Task: Verify a non-admin user visiting the page gets redirected
- [ ] Task: Verify the Audit Log view populates with real audit trail data
- [ ] Task: Conductor - User Manual Verification 'Phase 6: Wix Integration'

---

## Phase 7: Polish, Theming & Launch

**Goal:** Final quality pass, theme testing, performance optimization, and handoff.

### 7.1 Theme Verification

- [ ] Task: Toggle through all 3 themes (light → solar → dark) and verify each zone renders correctly: topbar, left rail orbs, workspace background, copilot sidebar, command bar, dock
- [ ] Task: Verify `localStorage['aos-theme']` persists across page refreshes
- [ ] Task: In dark mode, verify the dot-grid background switches to the lighter dot variant (from `admin-os.css`)
- [ ] Task: Verify all Chart.js charts use the appropriate text/grid colors per theme

### 7.2 Performance

- [ ] Task: Minimize re-renders: `showView()` must NOT re-instantiate a view module that is already active (compare `currentViewId` before switching)
- [ ] Task: Destroy Chart.js instances in `unmount()` to prevent memory leaks (call `chart.destroy()`)
- [ ] Task: Debounce all search inputs (300ms `setTimeout`)
- [ ] Task: Verify `AdminOS.html` loads in under 3 seconds on a standard connection (measure with DevTools Performance tab)

### 7.3 Accessibility

- [ ] Task: All interactive elements (orbs, buttons, inputs) must have `aria-label` attributes
- [ ] Task: Keyboard navigation: Tab key cycles through dock items, arrow keys navigate within drawers
- [ ] Task: Focus trap while spotlight is open

### 7.4 CLAUDE.md & Documentation Update

- [ ] Task: Update `CLAUDE.md` to document the AdminOS Hub architecture:
  - File structure and module responsibilities
  - PostMessage bridge action catalog (all `AOS_*` actions)
  - How to add a new view (step-by-step instructions)
  - Theme system reference
- [ ] Task: Update `GEMINI.md` HTML Component Inventory section to replace the 44 standalone entries with a single "AdminOS Hub" entry pointing to `src/public/admin/os/AdminOS.html`

### 7.5 Final Verification & Launch

- [ ] Task: Full end-to-end test: log in as admin, navigate to Admin page, verify AdminOS loads, navigate all 9 primary views, verify data loads
- [ ] Task: Full end-to-end test: verify all passthrough iframe views open without errors
- [ ] Task: Test on 3 browsers: Chrome, Firefox, Safari (Wix Edge)
- [ ] Task: Verify mobile/tablet does not break the Wix page layout (Wix editor responsive preview)
- [ ] Task: Archive the 44 standalone HTML files by moving them to `src/public/admin/_archive/` (do NOT delete—they serve as dev references)
- [ ] Task: Conductor - Final Verification & Launch
