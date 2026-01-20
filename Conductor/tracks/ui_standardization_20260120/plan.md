# Track Plan: UI/UX Consistency & Standardization

> **Goal:** Eliminate fragmentation in design implementation by unifying Tailwind configs, icon sets, button patterns, and theme logic.

---

## Overview

The codebase is currently suffering from fragmented UI/UX implementations, specifically:
1.  **Tailwind Fragmentation:** 4 separate configurations.
2.  **Icon Inconsistency:** Mixed use of Font Awesome and Material Design.
3.  **UI Divergence:** 3 distinct button patterns without a shared logic.
4.  **Theme Logic:** Competing and isolated theme switching implementations.

This track will systematically consolidate these elements into a single source of truth.

---

## Phase 1: Tailwind Unification

> **Source of Truth:** `lmdr-branding-skill.json`
> **Primary Tokens:**
> - `lmdr-dark`: `#0f172a` (slate-900)
> - `lmdr-blue`: `#2563eb` (blue-600)
> - `lmdr-yellow`: `#fbbf24` (amber-400)
> - `canvas`: `#f9fafb` (gray-50)
> - `content`: `#ffffff` (white)
> - `body-text`: `#475569` (slate-600)

### 1.1 Centralize Config
- [ ] Task: Update `src/public/lmdr-config.js` to strictly match the `color_system` defined in `lmdr-branding-skill.json`.
- [ ] Task: Add semantic colors (success, warning, error) from the skill file to the tailwind config.
- [ ] Task: Ensure `lmdr-config.js` is properly referenced as the single source of truth in all HTML files.

### 1.2 Remove Embedded Configs
- [ ] Task: Remove `<script>tailwind.config = ...</script>` blocks from `ADMIN_DASHBOARD.html`.
- [ ] Task: Remove embedded config from `Homepage.HTML`.
- [ ] Task: Remove embedded config from `RecruiterDashboard.html`.
- [ ] Task: Validate that styles (colors, fonts, animations) are preserved after removal.

---

## Phase 2: Role-Based Implementation

> **Execution Order:** Admin -> Recruiter -> Public/Driver
> **Rationale:** Admin pages are low-risk/non-blocking for standardization. Driver pages are high-impact and should be last to ensure stability.

### 2.1 Admin Dashboard (Admin)
- [ ] Task: Replace Material Symbols with Font Awesome CDN in `ADMIN_DASHBOARD.html`.
- [ ] Task: Map Material icons to FA equivalents (e.g., `check_circle` -> `fa-circle-check`).
- [ ] Task: Update all button implementations to use standard "Dark" or "Carrier CTA" patterns.
- [ ] Task: Remove embedded theme switch logic and implement `theme-utils.js`.

### 2.2 Recruiter Dashboard (Carrier)
- [ ] Task: Verify Font Awesome integration is consistent with standard.
- [ ] Task: Update all buttons to use standard "Carrier CTA" (Blue) patterns.
- [ ] Task: Ensure theme toggling uses the shared `theme-utils.js`.

### 2.3 Public & Driver Pages (Driver/Carrier)
- [ ] Task: Update `Homepage.HTML` buttons to strict "Driver CTA" (Yellow) and "Carrier CTA" (Blue) standards.
- [ ] Task: Update `Trucking Companies.html` form/button styles.
- [ ] Task: Ensure standard FA icons are used for all benefits/features sections.
- [ ] Task: Verify responsive behavior and token correctness (`lmdr-yellow`, `lmdr-blue`).

---

## Phase 4: Theme Logic Unification

### 4.1 Centralize Utility
- [ ] Task: Review `src/public/theme-utils.js` and ensure it handles all edge cases (system pref, persistence, toggle).
- [ ] Task: Ensure `lmdr-admin-theme` logic in `ADMIN_DASHBOARD.html` is migrated to use `theme-utils.js` (key: `lmdr-theme-preference`).

### 4.2 Standardize Toggle Components
- [ ] Task: Replace custom toggle scripts in `ADMIN_DASHBOARD.html` with calls to `LMDR_THEME.toggle()`.
- [ ] Task: Ensure all pages listening for theme changes utilize the `themechange` event dispatch from `theme-utils.js`.

---

## Success Metrics
- [ ] Zero embedded Tailwind configs in HTML files.
- [ ] Single Icon library loaded (or strictly managed dual-load).
- [ ] Consistent button feel across Admin, Recruiter, and Public pages.
- [ ] Theme switching works instantly and synchronizes across potential cross-domain/iframe boundaries if applicable (shared local storage strat).
