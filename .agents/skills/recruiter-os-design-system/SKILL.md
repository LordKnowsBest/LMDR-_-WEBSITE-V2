---
name: RecruiterOS Solarized Neumorphic Design System
description: Enforces the Solarized Neumorphic Design System for all RecruiterOS light + dark mode UI implementations. Defines the canonical design tokens, elevation scale, color palette, component patterns, and architecture rules.
---

# RecruiterOS — Solarized Neumorphic Design System

> **This skill is the single source of truth for all RecruiterOS UI work.**
> Every view module, CSS change, or HTML component touching the Recruiter Operating System MUST conform to these rules.

## 🏗️ Architecture: The Hub Model

```
RecruiterOS.html  ← THE HUB (never create a second one)
├── css/recruiter-os.css         ← Design system tokens + neumorphic classes
├── js/ros-config.js             ← Tool registry, drawer config, dock items
├── js/ros-shell.js              ← Layout builder (topbar, rail, dock, command bar)
├── js/ros-bridge.js             ← Wix Velo ↔ HTML postMessage bridge
├── js/ros-views.js              ← View lifecycle manager
├── js/ros-spotlight.js          ← ⌘K search overlay
├── js/ros-chat.js               ← AI command thread
├── js/ros-settings.js           ← Settings panel
├── js/ros-voice.js              ← Voice agent integration
└── js/views/
    ├── ros-view-home.js          ← Dashboard home
    ├── ros-view-search.js        ← Driver search + AI matching
    ├── ros-view-pipeline.js      ← Kanban pipeline
    ├── ros-view-funnel.js        ← Recruiting funnel analytics
    ├── ros-view-intel.js         ← Competitor intelligence
    ├── ros-view-lifecycle.js     ← Driver lifecycle management
    ├── ros-view-predict.js       ← AI predictions dashboard
    ├── ros-view-carriers.js      ← Carrier portfolio
    ├── ros-view-leaderboard.js   ← Recruiter leaderboard
    ├── ros-view-telemetry.js     ← Call telemetry
    ├── ros-view-onboard.js       ← Onboarding dashboard
    ├── ros-view-messages.js      ← Messaging center
    ├── ros-view-campaigns.js     ← Paid media campaigns
    ├── ros-view-attribution.js   ← Attribution analytics
    └── ros-view-retention.js     ← Driver retention
```

**Key Rules:**
1. `RecruiterOS.html` is the ONLY entry point. Never create parallel HTML files for the OS.
2. All JS modules load via CDN from `src/public/recruiter/os/js/`.
3. Views are self-contained IIFEs that register via `ROS.views.registerView()`.
4. All data flows through `ROS.bridge.sendToVelo()` / `onMessage()` — never direct API calls.
5. CSS lives in `src/public/recruiter/os/css/recruiter-os.css` — never inline `<style>` blocks in view JS.

---

## 🎨 The Lighting Principle

All neumorphic elements follow a **45° top-left illumination model**:

```
☀️ Light Source (top-left)
 ↘
┌──────────────────────┐
│  HIGHLIGHT (-x, -y)  │  ← #FFFFF5 (ivory white)
│                      │
│      SURFACE         │  ← #F5F5DC (solarized beige)
│                      │
│    SHADOW (+x, +y)   │  ← #C8B896 (warm tan)
└──────────────────────┘
```

- **Raised elements**: Light shadow top-left, dark shadow bottom-right
- **Pressed/inset elements**: Dark shadow top-left, light shadow bottom-right (inverted)
- Shadows are ALWAYS paired: one dark + one light, never a single shadow

---

## 🎯 Color Palette

### Base Tones (MANDATORY for all surfaces)
| Token | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| Background | `#F5F5DC` | `--ros-surface` | Canvas, card backgrounds, body |
| Shadow Dark | `#C8B896` | `--ros-shadow-d` | Bottom-right neumorphic shadow |
| Shadow Light | `#FFFFF5` | `--ros-shadow-l` | Top-left neumorphic highlight |
| Deep Surface | `#E8D5B7` | `--ros-bg-d` | Rail sidebar, secondary surfaces |
| Text Primary | `#0f172a` | `--ros-text` | Headings, body text |
| Text Muted | `rgba(15,23,42,.55)` | `--ros-text-muted` | Labels, captions, placeholders |

### Tailwind Aliases (used in JS template strings)
| Tailwind Class | Hex | Maps To |
|---------------|-----|---------|
| `text-lmdr-dark` | `#0f172a` | Primary text |
| `text-tan` | `#C8B896` | Muted/secondary text |
| `bg-beige` | `#F5F5DC` | Surface background |
| `bg-beige-d` | `#E8E0C8` | Deeper surface |
| `text-ivory` | `#FFFFF5` | Inverted text on dark |

### Accent Colors
| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| LMDR Blue | `#2563eb` | `text-lmdr-blue` | Primary actions, links, active states |
| LMDR Deep | `#1e40af` | `text-lmdr-deep` | Gradients, hover states |
| LMDR Yellow | `#fbbf24` | `text-lmdr-yellow` | Badges, XP, highlights |
| Solar Green | `#859900` | `text-sg` | Success, completion |

### Solarized Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Solar Blue | `#268BD2` | Information, links |
| Solar Green | `#859900` | Success, active |
| Solar Orange | `#CB4B16` | Warning |
| Solar Red | `#DC322F` | Danger, errors |

---

## 📐 Elevation Scale

Every interactive surface MUST use one of these elevation levels. **NEVER use arbitrary `box-shadow` values.**

### Raised (Extruded) — Elements that "pop out" of the surface
```css
.neu-x  { box-shadow:  2px  2px  5px var(--ros-shadow-d), -2px  -2px  5px var(--ros-shadow-l); } /* Level 0.5 */
.neu-s  { box-shadow:  3px  3px  6px var(--ros-shadow-d), -3px  -3px  6px var(--ros-shadow-l); } /* Level 1 */
.neu    { box-shadow:  6px  6px 12px var(--ros-shadow-d), -6px  -6px 12px var(--ros-shadow-l); } /* Level 2 */
.neu-lg { box-shadow: 12px 12px 24px var(--ros-shadow-d), -12px -12px 24px var(--ros-shadow-l); } /* Level 3 */
```

### Pressed (Recessed) — Elements that are "pushed into" the surface
```css
.neu-ins { box-shadow: inset 2px 2px  4px var(--ros-shadow-d), inset -2px -2px  4px var(--ros-shadow-l); } /* Level 1 */
.neu-in  { box-shadow: inset 4px 4px  8px var(--ros-shadow-d), inset -4px -4px  8px var(--ros-shadow-l); } /* Level 2 */
.neu-ind { box-shadow: inset 8px 8px 16px var(--ros-shadow-d), inset -8px -8px 16px var(--ros-shadow-l); } /* Level 3 */
```

### When to Use Each Level
| Level | Raised Class | Use For |
|-------|-------------|---------|
| 0.5 | `neu-x` | Tool orbs, tiny buttons, filter pills |
| 1 | `neu-s` | Drawer sections, small cards, rail items |
| 2 | `neu` | Main content cards, command bar, panels |
| 3 | `neu-lg` | Modals, floating panels, spotlight |

| Level | Inset Class | Use For |
|-------|------------|---------|
| 1 | `neu-ins` | Search inputs, subtle wells, XP bars |
| 2 | `neu-in` | Text inputs, search bars, filter areas |
| 3 | `neu-ind` | Deep content wells, activity feeds |

---

## 🔤 Typography

**Font Family:** `Inter` (weights 300-900), loaded via Google Fonts CDN.

| Element | Size | Weight | Tailwind |
|---------|------|--------|----------|
| View heading | 18px | 700 (bold) | `text-lg font-bold text-lmdr-dark` |
| Section heading | 14px | 700 | `text-[14px] font-bold text-lmdr-dark` |
| Card heading | 13px | 700 | `text-[13px] font-bold text-lmdr-dark` |
| Body text | 12px | 500 | `text-[12px] font-medium text-lmdr-dark` |
| Label | 10-11px | 700 | `text-[10px] font-bold text-tan uppercase tracking-wider` |
| Micro/badge | 8-9px | 700 | `text-[9px] font-bold text-tan` |
| KPI value | 20-24px | 900 | `text-[22px] font-black text-lmdr-dark` |

---

## 🧩 Component Patterns

### Card (standard content container)
```html
<div class="neu rounded-2xl p-5">
  <h3 class="text-[14px] font-bold text-lmdr-dark mb-3">Card Title</h3>
  <div class="text-[12px] text-tan">Card content</div>
</div>
```

### KPI Stat Card
```html
<div class="neu-s p-4 rounded-xl text-center">
  <span class="material-symbols-outlined text-lmdr-blue text-[20px]">trending_up</span>
  <h3 class="text-[22px] font-black text-lmdr-dark mt-1">128</h3>
  <p class="text-[9px] font-bold uppercase tracking-widest text-tan mt-1">Active Drivers</p>
</div>
```

### Inset Search Input
```html
<div class="flex items-center px-4 py-3 neu-in rounded-xl">
  <span class="material-symbols-outlined text-tan text-[18px]">search</span>
  <input class="bg-transparent border-none focus:ring-0 text-base text-lmdr-dark placeholder-tan/50 w-full ml-2 outline-none font-medium"
         placeholder="Search..."/>
</div>
```

### Tool Orb (sidebar tool button)
```html
<div class="tool-orb neu-x rounded-lg p-2 flex flex-col items-center gap-1 text-center">
  <div class="w-8 h-8 rounded-md bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center">
    <span class="material-symbols-outlined text-white text-[16px]">person_search</span>
  </div>
  <span class="text-[8px] font-bold text-lmdr-dark leading-tight">Search</span>
</div>
```

### Filter Pill (orb button)
```html
<!-- Default state -->
<button class="filter-orb px-3 py-1.5 text-[10px] font-bold rounded-full neu-x text-tan">CDL-A</button>

<!-- Active state -->
<button class="filter-orb px-3 py-1.5 text-[10px] font-bold rounded-full filter-orb-active">CDL-A</button>
```

### Back Button + View Header
```html
<div class="flex items-center gap-3">
  <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
    <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
  </button>
  <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center">
    <span class="material-symbols-outlined text-white text-[16px]">icon_name</span>
  </div>
  <h2 class="text-lg font-bold text-lmdr-dark">View Title</h2>
</div>
```

### Toast Notification
```javascript
function showToast(msg, type) {
  const t = document.createElement('div');
  const icon = type === 'error' ? 'error' : 'check_circle';
  const color = type === 'error' ? 'text-red-400' : 'text-emerald-500';
  t.className = 'fixed top-16 right-4 z-[10000] px-4 py-2.5 rounded-xl neu-s text-[12px] font-bold text-lmdr-dark flex items-center gap-2';
  t.style.animation = 'fadeUp .3s ease';
  t.innerHTML = `<span class="material-symbols-outlined ${color} text-[16px]">${icon}</span>${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
```

---

## 🧱 View Module Template

Every new view MUST follow this exact structure:

```javascript
// ============================================================================
// ROS-VIEW-{NAME} — {Description}
// ============================================================================

(function () {
  'use strict';

  const VIEW_ID = '{viewId}';
  const MESSAGES = ['{messageType1}', '{messageType2}'];

  // ── State ──
  let data = null;

  // ── Render ──
  function render() {
    return `
      <!-- Header -->
      <div class="flex items-center gap-3">
        <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-[16px]">{icon}</span>
        </div>
        <h2 class="text-lg font-bold text-lmdr-dark">{View Title}</h2>
      </div>

      <!-- Content -->
      <div class="neu rounded-2xl p-5 mt-4">
        <div id="{viewId}-content">Loading...</div>
      </div>`;
  }

  // ── Lifecycle ──
  function onMount() {
    ROS.bridge.sendToVelo('{fetchDataMessage}', {});
  }

  function onUnmount() {
    data = null;
  }

  function onMessage(type, payload) {
    switch (type) {
      case '{messageType1}':
        data = payload;
        renderContent();
        break;
    }
  }

  // ── Render Helpers ──
  function renderContent() { /* ... */ }

  // ── Utilities ──
  function escapeHtml(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'fixed top-16 right-4 z-[9999] px-4 py-2.5 rounded-xl neu-s text-[12px] font-bold text-lmdr-dark';
    t.style.animation = 'fadeUp .3s ease';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // ── Public API (optional) ──
  ROS.views._{viewId} = {
    // expose functions needed by onclick handlers in render()
  };

  // ── Register ──
  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
```

---

## 🚫 Anti-Patterns (NEVER DO THESE)

| ❌ Don't | ✅ Do Instead |
|----------|--------------|
| `box-shadow: 0 4px 6px rgba(0,0,0,.1)` | Use `neu`, `neu-s`, `neu-x`, `neu-in`, etc. |
| `background: #fff` or `background: white` | Use `var(--ros-surface)` or `bg-beige` |
| `color: #333` or `color: black` | Use `text-lmdr-dark` or `var(--ros-text)` |
| `border: 1px solid #ccc` | Use `border border-tan/20` or `var(--ros-border)` |
| Inline `<style>` blocks in view JS | Put all styles in `recruiter-os.css` |
| Font Awesome icons (`fa-solid fa-*`) | Use Material Symbols Outlined |
| Creating new HTML pages for OS features | Add a new `ros-view-*.js` module |
| Making direct fetch/API calls in views | Use `ROS.bridge.sendToVelo()` |
| `tailwind.config` changes | OS tokens are frozen; use CSS vars for new tokens |

---

## 📋 Design System Compliance Checklist

Before considering any RecruiterOS work complete, verify:

- [ ] All surfaces use `var(--ros-surface)` or `bg-beige`, never hardcoded white/gray
- [ ] All shadows use neumorphic elevation classes (`neu`, `neu-s`, `neu-x`, etc.)
- [ ] All text uses `text-lmdr-dark` (primary) or `text-tan` (muted), never `#333` or `text-gray-*`
- [ ] All icons use Material Symbols Outlined, never Font Awesome
- [ ] All inputs use `neu-in` or `neu-ins` for the pressed/inset look
- [ ] All buttons use `neu-x` or `neu-s` for the raised look (except gradient primary buttons)
- [ ] The 45° lighting principle is maintained (light top-left, shadow bottom-right)
- [ ] No inline styles are used where a CSS class exists
- [ ] View module follows the IIFE + registerView pattern
- [ ] Data flows through bridge, not direct API calls

---

## 🔗 Reference Files

| File | Path | Purpose |
|------|------|---------|
| Hub HTML | `src/public/recruiter/os/RecruiterOS.html` | Entry point, loads all modules |
| Design System CSS | `src/public/recruiter/os/css/recruiter-os.css` | All tokens + neumorphic classes |
| RDS Shared CSS | `src/public/recruiter/recruiter-design-system.css` | Cross-page design system tokens |
| Tailwind Config | Inline in `RecruiterOS.html` lines 31-62 | Color aliases, font family |
| Stitch MCP Light Guide | Project `16880480793559629411`, Screen `24b4f92fbc214af1ba3e441f9b9c6906` | Light mode visual guide |
| Stitch MCP Dark Guide | Project `16880480793559629411`, Screen `27079595d5f24e34999909a1adf0ef09` | Dark mode visual guide |
| Stitch MCP OS Mockup | Project `3442673554758244094`, Screen `19cc6246976c4c9cb4d5eaf67eb2ff57` | Dark mode OS shell mockup |

---

## 🌙 Dark Mode — Solarized Dark Palette

When `html.dark` is set, ALL tokens switch to the true Solarized Dark palette:

### Dark Mode Base Tones
| Token | Solarized Name | Hex | CSS Variable |
|-------|---------------|-----|-------------|
| Background | Base03 | `#002B36` | `--ros-surface` |
| Shadow | Deep | `#05232c` | `--ros-shadow-d` |
| Highlight | Base01 (30%) | `rgba(88,110,117,.3)` | `--ros-shadow-l` |
| Surface Secondary | Base02 | `#073642` | `--ros-bg-d` |
| Text Primary | Base0 | `#839496` | `--ros-text` |
| Text Muted | Base01 | `#586E75` | `--ros-text-muted` |
| Text Headings | Base1 | `#93A1A1` | (via Tailwind override) |
| Accent | Solar Blue | `#268BD2` | `--ros-accent` |

### Dark Mode Neumorphic Shadows
```css
/* Raised */
.neu   { box-shadow: 6px 6px 12px #05232c, -4px -4px 10px rgba(88,110,117,.3); }
.neu-s { box-shadow: 3px 3px 6px #05232c, -2px -2px 5px rgba(88,110,117,.25); }
.neu-lg { box-shadow: 12px 12px 24px #05232c, -8px -8px 20px rgba(88,110,117,.2); }

/* Pressed */
.neu-in { box-shadow: inset 4px 4px 8px #05232c, inset -3px -3px 6px rgba(88,110,117,.2); }
```

### Dark Mode Tailwind Overrides
These are handled automatically by `html.dark` rules in `recruiter-os.css`:
| Light Class | Dark Override |
|------------|--------------|
| `text-lmdr-dark` | → `#93A1A1` (Base1) |
| `text-tan` | → `#586E75` (Base01) |
| `bg-beige` | → `#002B36` (Base03) |
| `bg-beige-d` | → `#073642` (Base02) |
