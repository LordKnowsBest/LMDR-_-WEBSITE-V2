# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Workflow Rule: Sync = Commit + Push

**IMPORTANT:** When the user says "sync" (in any form - "sync", "sync it", "sync to wix", etc.), you MUST:
1. Stage all changes: `git add -A`
2. Commit with a descriptive message: `git commit -m "description"`
3. Push to remote: `git push`

This is required because Wix syncs from the GitHub repository. Without pushing, changes won't appear in Wix.

## Production Website URL

**Base URL:** `https://www.lastmiledr.app`

When writing redirects or links in HTML components (especially within Wix iframes), always use the full absolute URL:

```javascript
// CORRECT - Full URL required for iframe context
const baseUrl = 'https://www.lastmiledr.app';
window.top.location.href = baseUrl + '/pricing';

// WRONG - Relative paths don't resolve correctly in Wix iframes
window.top.location.href = '/pricing';
```

## Project Overview

LMDR (Last Mile Driver Recruiting) is a Wix Velo site for matching CDL truck drivers with carriers. The site uses AI-powered enrichment to provide drivers with detailed carrier intelligence including FMCSA safety data, pay information, driver sentiment, and social media analysis.

## Development Commands

```bash
npm install          # Install dependencies (runs wix sync-types via postinstall)
npm run dev          # Start Local Editor for real-time testing (wix dev)
npm run lint         # Run ESLint
```

## CRITICAL: Never Modify package.json or package-lock.json

**These files are locked to specific Wix CLI versions. Any change breaks the live site with a 404.**

- `@wix/cli` is pinned to exactly `1.1.162` — do NOT change this version
- `package-lock.json` must never be regenerated or modified
- If either file appears in `git diff` or `git status` before a commit, **exclude them** unless the user has explicitly asked to update the Wix CLI
- The symptom of breakage is a 404 on the live Wix site immediately after the next sync

**Before every commit, verify these files are NOT staged:**
```bash
git diff --name-only HEAD package.json package-lock.json
# Must return empty — if either file appears, unstage it
git restore package.json package-lock.json
```

The Wix CLI must be installed globally: `npm install -g @wix/cli`

## Critical Data Routing: Dual-Source Pattern (Wix + Airtable)

**CRITICAL RULE:** This project uses a dual-source data architecture where most data routes to **Airtable** for visibility, while auth-related data stays in **Wix**.

**NEVER call `wixData.*` directly in business logic functions.** Always use the dual-source helper functions.

### Universal Data Access Pattern (Recommended)

The project uses a unified **`dataAccess.jsw`** layer to handle all database operations. This layer automatically routes to the correct source based on `configData.js`.

**Import:** `import * as dataAccess from 'backend/dataAccess';`

**Pattern Example:**
```javascript
// 1. Define collection keys (camelCase from configData.js)
const COLLECTIONS = {
  drivers: 'driverProfiles',
  interests: 'driverCarrierInterests'
};

// 2. Query with filters and options
const result = await dataAccess.queryRecords(COLLECTIONS.drivers, {
  filters: {
    status: 'active',
    years_experience: { gte: 2 }
  },
  limit: 50,
  suppressAuth: true // Use for backend-initiated operations
});

// 3. Insert or Update
await dataAccess.insertRecord(COLLECTIONS.interests, {
  driver_id: 'rec123',
  carrier_dot: '1234567',
  status: 'applied'
}, { suppressAuth: true });
```

**Type Safety Rule:** Data received from forms (`formData`) is always string. **YOU MUST convert numeric strings to `Number`** before passing them to queries or filters for number-type fields in Airtable/Wix.

```javascript
// CORRECT - Type conversion
const dotNum = Number(formData.dotNumber);
const result = await dataAccess.findByField('carriers', 'dot_number', dotNum);
```

### Collections That Stay in Wix (ONLY THESE)

| Collection | Reason |
|------------|--------|
| `AdminUsers` | Auth/permissions - must stay in Wix |
| `MemberNotifications` | Wix member system integration |
| `memberBadges` | `Members/Badges` system collection |
| `memberPrivateData` | `Members/PrivateMembersData` system collection |

**Everything else (~65+ collections) routes to Airtable.**

### Config File Reference

Routing is controlled by `backend/configData.js` (synchronous helpers):
- `usesAirtable(collectionKey)` - Returns `true` if collection routes to Airtable
- `getAirtableTableName(collectionKey)` - Returns the Airtable table name
- `getWixCollectionName(collectionKey)` - Returns the Wix PascalCase name

### Airtable Base Reference

| Base | ID | Purpose |
|------|-----|---------|
| Last Mile Driver recruiting | `app9N1YCJ3gdhExA0` | All application data (v2_* tables) |
| VelocityMatch DataLake | `appt00rHHBOiKx9xl` | External data feeds (fuel, weather, traffic) |

**New feature tables go in `Last Mile Driver recruiting` base.**

> **Full details:** Helper implementations, audit checklists, field mapping tables, and step-by-step workflows are in `.claude/docs/airtable-routing.md` (auto-injected when editing backend files).

## Import Conventions

Wix Velo requires specific import syntax:
```javascript
import { fn } from 'backend/fileName';   // Backend modules
import { fn } from 'public/fileName';    // Public modules
```
Do NOT use relative paths like `./fileName` - they don't work in Wix.

## Page Code (src/pages/*.js)

Page code files are auto-generated by Wix and named `PageName.xxxxx.js`. Do not rename these files. The `masterPage.js` file contains global site code.

## Scheduled Jobs

Configured in `src/backend/jobs.config`:
- `runEnrichmentBatch` runs hourly (`0 * * * *`) - Pre-enriches high-priority carriers with AI data
- `runBackfillMigration` runs every 30 min (`30 * * * *`) - Ensures submitted drivers are searchable
- `processAbandonmentEmails` runs every 15 min (`15 * * * *`) - Checkout abandonment email sequences

## Evidence Pack Verification

**Required for all tracks with frontend pages.** Before marking a Conductor track DONE, run the DevTools Evidence Pack verification.

**How to run:**
```bash
claude --agent evidence-pack
```

**What it checks:**
- Zero P0 console errors across 5 critical paths
- All required DOM selectors visible
- All pages reach ready state within timeout
- Zero HTTP 500 errors on LMDR endpoints
- All 5 screenshots captured and non-blank
- Zero Velo worker fatal errors

**Artifacts:** Written to `artifacts/devtools/{run_id}/` including `quality_gate.json`, `console_audit.json`, `network_audit.json`, and 5 screenshots.

**Quality gate:** `quality_gate.json` must show `pass: true`. Attach the `run_id` to the track's `metadata.json` `verification_run` field.

## Web Module Permissions

Permissions are defined in `src/backend/permissions.json`. Current config allows all users (anonymous, member, owner) to invoke all web methods.

## File Organization Standards

### Surface Branding (Enforced by Hook)

**Non-driver surfaces use VelocityMatch branding. Driver surfaces keep LMDR.**

| Surface | Brand | Logo Icon |
|---------|-------|-----------|
| `driver/` | LMDR | LM |
| Everything else | VelocityMatch | VM |

A PostToolUse hook (`enforce-surface-branding.ps1`) blocks any Write/Edit that introduces LMDR branding into non-driver HTML files.

### HTML Files

**All HTML files are organized in `src/public/` subfolders by role:**

**Standard:** See `docs/MOBILE_OPTIMIZATION_GUIDE.md` for mandatory mobile responsiveness rules (iPhone 12/13 target).

```
src/public/
├── admin/      # Admin portal (ADMIN_*.html)
├── recruiter/  # Recruiter portal (Recruiter*.html)
├── driver/     # Driver portal (DRIVER_*.html, AI_MATCHING.html)
├── carrier/    # Carrier portal (Carrier*.html)
├── landing/    # Landing & marketing pages
├── utility/    # System components, templates, emails
├── _archive/   # Deprecated files (do not use)
├── js/         # JavaScript modules
├── __tests__/  # Test files
└── [root]      # Shared config (lmdr-config.js, theme-*.js/css)
```

**DO NOT place HTML files in:** `docs/`, root directory, `src/backend/`, or `src/pages/`.

### Tailwind Config in Wix Iframes (Critical)

**Do NOT rely on external `lmdr-config.js` in HTML files loaded inside Wix iframes.**
The external config does not load reliably in Wix HTML components.

**Required pattern: Inline Tailwind config immediately after the Tailwind CDN script.**
Use the same inline config as `src/public/landing/Homepage.HTML` and remove:
`<script src="../lmdr-config.js"></script>`.

### HTML Shell Pattern (Enforced by Hook)

**CRITICAL: All HTML pages MUST follow the Shell + CDN Modules pattern.**
A PostToolUse hook (`enforce-html-shell-pattern`) blocks any Write/Edit that creates monolithic HTML files.

**Gold standard:** `src/public/recruiter/os/RecruiterOS.html` — 100 lines, zero inline business logic.

#### What the Pattern Means

| Layer | Lives in | Example |
|-------|----------|---------|
| **HTML Shell** | The `.html` file | Markup, root container, `<head>` meta/fonts |
| **Tailwind Config** | Inline `<script>` in `<head>` | `tailwind.config = { ... }` (required for Wix iframes) |
| **CSS** | External via CDN | `cdn.jsdelivr.net/gh/.../css/module.css` |
| **JS Modules** | External via CDN | `cdn.jsdelivr.net/gh/.../js/module.js` |
| **Bootstrap** | Inline `<script>` at bottom | `DOMContentLoaded` init, <10 lines |

#### Enforced Thresholds

| Rule | Limit | Action |
|------|-------|--------|
| Single inline `<script>` block | **80 lines max** | BLOCKED — extract to external JS module |
| Total inline JS across all blocks | **150 lines max** | BLOCKED — split into CDN modules |
| HTML > 200 lines with 0 CDN scripts | **Must have >=1** | BLOCKED — must use CDN pattern |

#### CDN URL Pattern

```html
<!-- @main (follows latest commit) -->
<script src="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/<surface>/js/<module>.js"></script>

<!-- @<commit-hash> (pinned for cache control) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@a166efd/src/public/<surface>/css/<styles>.css"/>
```

#### Required File Structure for New Pages

When creating a new HTML page for surface `<surface>` (e.g., `admin`, `driver`, `recruiter`, `carrier`):

```
src/public/<surface>/
├── PAGE_NAME.html          # Shell only (target: <150 lines)
├── js/
│   ├── page-name-config.js    # Constants, config
│   ├── page-name-bridge.js    # PostMessage communication with Wix
│   ├── page-name-render.js    # DOM rendering functions
│   └── page-name-logic.js     # Business logic, event handlers
└── css/
    └── page-name.css           # Component styles
```

#### Template: Minimal HTML Shell

```html
<!DOCTYPE html>
<html class="light" lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover"/>
  <title>VelocityMatch | Page Name</title>

  <!-- Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,100..700,0..1&display=swap" rel="stylesheet"/>

  <!-- Tailwind CDN + INLINE config (required for Wix iframes) -->
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            'lmdr-blue': '#2563eb', 'lmdr-deep': '#1e40af',
            'lmdr-yellow': '#fbbf24', 'lmdr-dark': '#0f172a',
            'beige': '#F5F5DC', 'beige-d': '#E8E0C8',
            'tan': '#C8B896', 'ivory': '#FFFFF5', 'sg': '#859900'
          },
          fontFamily: { 'd': ['Inter', 'sans-serif'] }
        }
      }
    };
  </script>

  <!-- External CSS via CDN -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/<surface>/css/<page>.css"/>
</head>

<body class="bg-beige font-d">
  <!-- Root container — JS modules build into this -->
  <div id="app-root" class="flex flex-col h-screen"></div>

  <!-- ═══ Module Loading (ordered by dependency) ═══ -->
  <script src="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/<surface>/js/<page>-config.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/<surface>/js/<page>-bridge.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/<surface>/js/<page>-render.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/<surface>/js/<page>-logic.js"></script>

  <!-- ═══ Bootstrap ═══ -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      App.init();
    });
  </script>
</body>
</html>
```

#### Module Dependency Order

Load scripts in this order (later modules depend on earlier ones):

1. **Config** — constants, API endpoints, feature flags (no deps)
2. **Bridge** — PostMessage communication with Wix page code (needs config)
3. **Render** — DOM building and update functions (needs config)
4. **Logic** — Event handlers, state management (needs config, bridge, render)
5. **Views** — Per-view modules if using multi-view pattern (needs all above)
6. **Voice/Agent** — Optional overlays (needs bridge)

### Reusable CSS and JS

Shared modules live at the `src/public/` root level and are available to all surfaces:

| File | Purpose | CDN Path |
|------|---------|----------|
| `theme-styles.css` | Design tokens, shared component styles | `src/public/theme-styles.css` |
| `css/voice-agent.css` | Voice orb + transcript panel | `src/public/css/voice-agent.css` |
| `js/voice-agent-ui.js` | Reusable voice UI component | `src/public/js/voice-agent-ui.js` |
| `js/voice-agent-bridge.js` | Voice event to postMessage bridge | `src/public/js/voice-agent-bridge.js` |

When building components used across multiple surfaces, place them in `src/public/js/` or `src/public/css/` (not inside a surface subfolder).

### Test Files

**All test files MUST be placed in `src/public/__tests__/`**
- Naming convention: `*.test.js` or `*.spec.js`

## Design System: Solarized Neumorphic (All Non-Driver Surfaces)

**MANDATORY:** All non-driver surfaces (admin, recruiter, carrier, B2B — VelocityMatch-branded) MUST use the **Solarized Neumorphic Design System**. Driver surfaces keep LMDR styling and are exempt.

> Full reference: `.claude/docs/neumorphic-design-system.md`
> RecruiterOS skill: `.agents/skills/recruiter-os-design-system/SKILL.md`

### The Lighting Principle
All neumorphic elements simulate **45° top-left illumination**:
- Raised elements: light shadow top-left (`-x, -y`), dark shadow bottom-right (`+x, +y`)
- Pressed/inset elements: inverted (dark top-left, light bottom-right)
- Shadows are ALWAYS paired — one dark + one light. Never a single shadow.

### Elevation Token Vocabulary (NEVER use arbitrary `box-shadow` values)

| Class | Shadow | Use For |
|-------|--------|---------|
| `neu-x` | `2px 2px 5px` | Tool orbs, tiny buttons, filter pills |
| `neu-s` | `3px 3px 6px` | Small cards, drawer sections, rail items |
| `neu` | `6px 6px 12px` | Main cards, panels, command bar |
| `neu-lg` | `12px 12px 24px` | Modals, floating panels, spotlight |
| `neu-ins` | `inset 2px 2px 4px` | Subtle wells, XP bars |
| `neu-in` | `inset 4px 4px 8px` | Text inputs, search bars |
| `neu-ind` | `inset 8px 8px 16px` | Deep content wells, activity feeds |

Shadow values reference CSS vars: dark side = `var(--ros-shadow-d)`, light side = `var(--ros-shadow-l)`.

### Color Palette

#### Light Mode (Solarized Beige)
| Role | Hex | Tailwind / CSS Var |
|------|-----|-------------------|
| Background | `#F5F5DC` | `bg-beige` / `--ros-surface` |
| Shadow dark | `#C8B896` | `text-tan` / `--ros-shadow-d` |
| Shadow light | `#FFFFF5` | `text-ivory` / `--ros-shadow-l` |
| Deep surface | `#E8D5B7` | `bg-beige-d` / `--ros-bg-d` |
| Primary text | `#0f172a` | `text-lmdr-dark` / `--ros-text` |
| Muted text | `rgba(15,23,42,.55)` | `text-tan` / `--ros-text-muted` |
| Primary blue | `#2563eb` | `text-lmdr-blue` / `--ros-accent` |
| Success green | `#859900` | `text-sg` |

#### Dark / Midnight Mode (`html.dark` or `data-rds-theme='midnight'`)
| Role | Solarized Name | Hex |
|------|---------------|-----|
| Background | Base03 | `#002B36` |
| Shadow dark | Deep | `#05232c` |
| Shadow light | Base01 (30%) | `rgba(88,110,117,.3)` |
| Surface secondary | Base02 | `#073642` |
| Primary text | Base0 | `#839496` |
| Accent | Solar Blue | `#268BD2` |

### Key Design Rules
1. **Never** use `background: white` or `background: #fff` — use `bg-beige` / `var(--ros-surface)`
2. **Never** use `color: #333` or `text-gray-*` — use `text-lmdr-dark` or `text-tan`
3. **Never** use `border: 1px solid #ccc` — use `border border-tan/20`
4. **Never** use Font Awesome icons — use **Material Symbols Outlined** exclusively
5. All inputs use `neu-in` or `neu-ins` (pressed/inset look)
6. All buttons use `neu-x` or `neu-s` (raised look), except gradient primary buttons
7. CSS lives in the external CSS module — never add `<style>` blocks to view JS files

### Shared CSS Files
| File | Purpose | CDN Key |
|------|---------|---------|
| `src/public/recruiter/os/css/recruiter-os.css` | ROS tokens + all `neu-*` classes | `recruiter/os/css/recruiter-os.css` |
| `src/public/recruiter/recruiter-design-system.css` | Cross-page RDS tokens (`--rds-*`) | `recruiter/recruiter-design-system.css` |

> When building new non-driver surfaces, import `recruiter-design-system.css` via CDN and follow the `rds-*` component class conventions defined there.

## Wix MCP Configuration

**IMPORTANT: When using any Wix MCP tools in this project, ALWAYS use this site:**

| Property | Value |
|----------|-------|
| **Site Name** | Last Mile CDL Driver Recruiting |
| **Site ID** | `13e6ba60-5a5d-4a4a-8adc-5948ff78d4ef` |

Always use this site ID. Never prompt the user to select a site.

## Batch Processing Pattern (Required)

**CRITICAL:** All batch operations must use chunked parallel processing to prevent timeouts.

**Import:** `import { chunkArray } from 'backend/utils/arrayUtils';`

**Pattern:**
```javascript
import { chunkArray } from 'backend/utils/arrayUtils';

// 1. Cache table name ONCE before loop
const tableName = await getAirtableTableName(COLLECTION_KEY);

// 2. Filter valid items
const validItems = items.filter(item => item.requiredField);

// 3. Chunk and process in parallel
const chunks = chunkArray(validItems, 10);

for (const chunk of chunks) {
  const results = await Promise.all(
    chunk.map(async (item) => {
      try {
        await airtable.updateRecord(tableName, item.id, { /* fields */ });
        return { success: true };
      } catch (error) {
        return { success: false, id: item.id, error: error.message };
      }
    })
  );

  // 4. Rate limit between chunks (200ms = 5 req/sec)
  await new Promise(r => setTimeout(r, 200));
}
```

| Operation | Chunk Size | Rationale |
|-----------|------------|-----------|
| Airtable CRUD | 10 | API rate limit |
| Notifications | 10 | Rate balance |
| Email sending | 5 | Provider limits |
| Simple updates | 50 | High volume, low complexity |

## UI Safety Pattern (Enforced by Hook)

When interacting with UI elements in Velo, always check for existence before accessing properties or methods.

A PostToolUse hook (`enforce-selector-safety.ps1`) blocks any Write/Edit to page code (`src/pages/*.js`) that uses `$w('#elementId')` without a safety check.

**Accepted patterns:**

```javascript
// Option 1: Use .rendered check (preferred)
const element = $w('#optionalElement');
if (element.rendered) {
    element.text = "Value";
}

// Option 2: Check element && property exists
const el = $w('#myButton');
if (el && el.onClick) {
    el.onClick(() => { /* handler */ });
}

// Option 3: Wrap in try-catch
try {
    $w('#optionalElement').postMessage(data);
} catch (e) {
    // Element may not exist on page
}
```

**Blocked patterns:**

```javascript
// WRONG - No existence check
$w('#submitButton').onClick(() => { });
$w('#statusText').text = "Loading...";
$w('#html1').postMessage({ type: 'init' });
```

## Context Documents

Supplementary docs are auto-injected by hooks when editing relevant files. They can also be referenced manually with `@.claude/docs/<filename>`.

| Document | Auto-injected when | Contents |
|----------|-------------------|----------|
| `airtable-routing.md` | Editing `src/backend/*.jsw` | Helper implementations, checklists, field mappings |
| `architecture-reference.md` | Manual reference only | All backend services, collections, API keys |
| `carrier-staffing-forms.md` | Editing carrier/staffing HTML | Form template, PostMessage bridge |
| `wix-record-linking.md` | Editing record-linking services | Type mismatch gotcha, linking pattern |
| `gamification-integration.md` | Editing gamification services | Integration hooks table, lazy-load pattern |
| `neumorphic-design-system.md` | Building non-driver HTML surfaces | Full token reference, component patterns, compliance checklist |

## New Services (2026-02-01)

### Match Explanation Service
**File:** `src/backend/matchExplanationService.jsw`
- **Purpose:** Generates driver-facing "Why You Matched" rationale.
- **Key Method:** `getMatchExplanationForDriver(driverId, carrierDot)`
- **Dependencies:** `driverScoring.js`, `carrierPreferences.jsw`

### Recruiter Health Service
**File:** `src/backend/recruiterHealthService.jsw`
- **Purpose:** Monitors system health (Database, AI, Enrichment, FMCSA) for recruiters.
- **Key Method:** `getRecruiterHealthStatus(carrierDot)`
- **Features:** 30s Caching, Aggregated Status ('operational'|'degraded'|'outage').

### Pet Friendly Service
**File:** `src/backend/petFriendlyService.jsw`
- **Purpose:** Manages crowdsourced pet-friendly locations and reviews.
- **Key Methods:** `searchLocations(filters)`, `submitLocation(data)`, `submitReview(locationId, reviewData)`
- **Features:** Proximity search, amenity filtering, automatic rating aggregation.

### Health Service
**File:** `src/backend/healthService.jsw`
- **Purpose:** Manages trucker health content and community tips.
- **Key Methods:** `getResourcesByCategory(cat)`, `submitTip(data)`, `getApprovedTips(cat)`
- **Features:** Content categorization, community submission moderation, helpfulness tracking.

### Agent Orchestration Service
**File:** `src/backend/agentService.jsw`
- **Purpose:** Central agent orchestration layer — wraps existing services as tool definitions per role.
- **Key Method:** `handleAgentTurn(role, userId, message, context)` — builds role-scoped tools, calls AI with tool definitions, executes tool_use responses in a loop, returns final text.
- **Roles:** `driver`, `recruiter`, `admin`, `carrier` — each scoped to relevant backend services.
- **Dependencies:** `aiRouterService.jsw` (with `agent_orchestration` function), `agentConversationService.jsw`

### Agent Conversation Service
**File:** `src/backend/agentConversationService.jsw`
- **Purpose:** Persists agent conversations and turns to Airtable.
- **Key Methods:** `createConversation(role, userId)`, `addTurn(conversationId, role, content, toolCalls)`, `getRecentContext(conversationId, maxTurns)`, `endConversation(conversationId)`
- **Collections:** `agentConversations`, `agentTurns`

### Voice Service (VAPI)
**File:** `src/backend/voiceService.jsw`
- **Purpose:** VAPI REST API wrapper for voice call management.
- **Key Methods:** `createAssistant(config)`, `initiateOutboundCall(assistantId, phoneNumberId, customer, metadata)`, `getCallTranscript(callId)`, `listCalls(filters)`, `getVoiceConfig()`
- **Secret:** `VAPI_PRIVATE_KEY` via `wix-secrets-backend`
- **Collections:** `voiceCallLogs`, `voiceAssistants`

### Voice Campaign Service
**File:** `src/backend/voiceCampaignService.jsw`
- **Purpose:** Outbound calling campaign management for recruiters.
- **Key Methods:** `createCampaign(recruiterId, config)`, `startCampaign(campaignId)`, `getCampaignStatus(campaignId)`, `getCampaigns(recruiterId)`
- **Collections:** `voiceCampaigns`, `voiceCampaignContacts`

## Agent & Voice Integration

All 4 user-facing surfaces (Driver, Recruiter, Admin, B2B) have agent chat overlays and voice integration wired through postMessage.

### Agent Chat Pattern

Each surface has a CDN-served JS module that renders a floating chat FAB + sliding panel:
- `driver/js/ai-matching-agent.js` — LMDR branding (logo "LM")
- `admin/js/admin-agent.js` — VelocityMatch branding (logo "VM")
- `admin/js/b2b-agent.js` — VelocityMatch branding (logo "VM")
- `recruiter/os/js/ros-chat.js` — Uses existing ROS chat thread with NLU_ENABLED flag

**PostMessage flow:** HTML sends `{ action: 'agentMessage', payload: { text } }` → Page code calls `handleAgentTurn(role, userId, text, context)` → Returns `{ action: 'agentResponse', payload }`.

### Voice Components

- `js/voice-agent-ui.js` — Reusable floating voice orb + transcript panel (VAPI Web SDK)
- `css/voice-agent.css` — Orb animations and transcript panel styling
- `js/voice-agent-bridge.js` — Bridges VoiceAgent events to postMessage
- `recruiter/os/js/ros-voice.js` — ROS-specific voice wrapper

### VAPI Webhooks

`src/backend/http-functions.js` handles VAPI webhooks at `/api/vapi-webhook`:
- `end-of-call-report` → saves transcript/summary to `voiceCallLogs`
- `function-call` / `tool-calls` → executes backend service, returns result
- `assistant-request` → returns dynamic assistant config

### New Airtable Collections

| Config Key | Airtable Table | Purpose |
|------------|---------------|---------|
| `agentConversations` | `v2_Agent Conversations` | Conversation sessions |
| `agentTurns` | `v2_Agent Turns` | Individual conversation turns |
| `voiceCallLogs` | `v2_Voice Call Logs` | Call transcripts and metadata |
| `voiceAssistants` | `v2_Voice Assistants` | VAPI assistant configurations |
| `voiceCampaigns` | `v2_Voice Campaigns` | Outbound campaign definitions |
| `voiceCampaignContacts` | `v2_Voice Campaign Contacts` | Campaign contact records |

## Page Code Wiring (Priority 1)

All 9 Priority 1 pages follow a shared wiring pattern connecting Wix page code to HTML iframe components via `postMessage`.

### Page Reference Table

| Page File | Backend Service(s) | HTML File | Notes |
|-----------|-------------------|-----------|-------|
| `ADMIN_DASHBOARD.svo6l.js` | `admin_dashboard_service`, `featureAdoptionService` | `admin/ADMIN_DASHBOARD.html` | Multi-component (all 6 IDs), navigation via `wixLocation` |
| `ADMIN_DRIVERS.uo7vb.js` | `admin_service` | `admin/ADMIN_DRIVERS.html` | Single-component (first found), bulk ops, CSV export |
| `ADMIN_CARRIERS.qa2w1.js` | `carrierAdminService` | `admin/ADMIN_CARRIERS.html` | Multi-component, FMCSA external link, enrichment refresh |
| `ADMIN_OBSERVABILITY.c8pf9.js` | `observabilityService` | `admin/ADMIN_OBSERVABILITY.html` | Single-component, sends initial data bundle on ready |
| `ADMIN_MATCHES.gqhdo.js` | `admin_match_service` | `admin/ADMIN_MATCHES.html` | Single-component, interest tracking, trend analytics |
| `ADMIN_AI_ROUTER.cqkgi.js` | `aiRouterService` | `admin/ADMIN_AI_ROUTER.html` | Multi-component, provider testing, config CRUD |
| `RECRUITER_ONBOARDING_DASHBOARD.gebww.js` | `onboardingWorkflowService`, `documentCollectionService`, `recruiter_service` | `recruiter/RECRUITER_ONBOARDING_DASHBOARD.html` | Uses `type` key (not `action`), auth check via `wix-users`, message registry validation |
| `B2B_DASHBOARD.i5csc.js` | `b2bBridgeService` | `admin/B2B_DASHBOARD.html` | Unified bridge pattern (`handleB2BAction`), navigation to account detail |
| `B2B_ACCOUNT_DETAIL.f31mi.js` | `b2bAccountService`, `b2bMatchSignalService`, `b2bPipelineService`, `b2bActivityService`, `b2bResearchAgentService` | `admin/B2B_ACCOUNT_DETAIL.html` | Reads `accountId` from URL query, auto-refreshes timeline after actions |

### Common Wiring Pattern

All pages follow this structure:

1. **Component Discovery** -- Iterate `HTML_COMPONENT_IDS` (`#html1`..`#html5`, `#htmlEmbed1`) inside try-catch, check `typeof el.onMessage === 'function'`.
2. **Message Listener** -- Call `component.onMessage(async (event) => routeMessage(component, event?.data))`.
3. **Init Signal** -- Send `{ action: 'init' }` to tell the HTML the bridge is ready.
4. **Message Router** -- A `switch` on `message.action` dispatches to async handler functions.
5. **Safe Send** -- A `safeSend` / `sendMessage` / `postToComponent` helper wraps `postMessage` in try-catch to guard against detached elements.

### Message Type Conventions

All pages (except Recruiter Onboarding) use an **action-based protocol**:

| Direction | Shape | Example |
|-----------|-------|---------|
| Velo -> HTML | `{ action: '<verb>', payload }` | `{ action: 'driversLoaded', payload: { drivers, totalCount } }` |
| HTML -> Velo | `{ action: '<verb>', ...params }` | `{ action: 'getDrivers', filters, page, pageSize }` |
| Error (any) | `{ action: 'actionError', message }` | `{ action: 'actionError', message: 'Failed to load' }` |
| Success (any) | `{ action: 'actionSuccess', message }` | `{ action: 'actionSuccess', message: 'Driver verified' }` |

**Exception:** `RECRUITER_ONBOARDING_DASHBOARD` uses `{ type, data, timestamp }` envelope instead of `{ action, payload }`, and validates messages against a `MESSAGE_REGISTRY` object.

## Admin Utility Expansion (2026-01-20)

### New Airtable Collections

| Config Key | Airtable Table | Purpose |
|------------|---------------|---------|
| `aiProviderCosts` | `v2_AI Provider Costs` | Cost/quality/latency metrics for provider selection |
| `costOptimizerConfig` | `v2_Cost Optimizer Config` | Singleton configuration for cost optimizer mode |
| `anomalyAlerts` | `v2_Anomaly Alerts` | Active and historical anomaly alerts |
| `anomalyRules` | `v2_Anomaly Rules` | Detection rule definitions and thresholds |
| `baselineMetrics` | `v2_Baseline Metrics` | Time-segmented baseline statistics |
| `complianceReports` | `v2_Compliance Reports` | Generated report metadata and storage pointers |
| `scheduledReports` | `v2_Scheduled Reports` | Report schedules for automated generation |

### New/Expanded Backend APIs

- `aiRouterService.jsw`
  - `getCostOptimizerConfig()`, `updateCostOptimizerConfig()`, `getProviderCostMetrics()`
  - `updateProviderCostData()`, `calculateQualityScore()`, `selectOptimalProvider()`
  - `getCostSavingsReport()`, `updateProviderCostsJob()`
- `observabilityService.jsw`
  - `calculateBaseline()`, `updateBaselines()`, `runAnomalyDetection()`
  - `getActiveAnomalies()`, `acknowledgeAnomaly()`, `resolveAnomaly()`
  - `getAnomalyRules()`, `updateAnomalyRule()`, `createAnomalyRule()`, `deleteAnomalyRule()`, `getAnomalyHistory()`
- `admin_audit_service.jsw`
  - `generateComplianceReport()`, `getReportTemplates()`, `getReportStatus()`
  - `listComplianceReports()`, `downloadReport()`, `deleteComplianceReport()`
  - `createScheduledReport()`, `updateScheduledReport()`, `deleteScheduledReport()`, `getScheduledReports()`, `runScheduledReports()`

