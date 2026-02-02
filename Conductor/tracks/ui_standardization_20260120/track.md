# Track: UI/UX Standardization

## Status
- [x] Planning
- [x] Phase 1: Tailwind Unification (approach pivoted — see note)
- [/] Phase 2: Dashboards (Admin/Recruiter) — partial
- [/] Phase 3: Landing Pages — 13/18 tokenized
- [/] Phase 4: Carrier Pages — partial
- [ ] Phase 5: Component Refactoring — not verified

## Context
Unify the platform's UI/UX by standardizing on LMDR semantic color tokens (`bg-lmdr-blue`, `bg-lmdr-dark`, `bg-lmdr-yellow`), Font Awesome icons, and consistent design patterns.

### Approach Pivot (2026-01-26)
The original plan called for externalizing Tailwind config to `lmdr-config.js` and loading it via `<script src="../lmdr-config.js"></script>`. Commit `dda2186` discovered this **does not work in Wix iframes** — the external script fails to load. CLAUDE.md now mandates:

> **Required pattern: Inline Tailwind config immediately after the Tailwind CDN script.**

All standardization must use **inline `tailwind.config` blocks** with LMDR semantic tokens defined directly in each HTML file. The `lmdr-config.js` file remains as a reference but must NOT be relied upon by iframe-loaded HTML.

## Tasks
- [x] Create Global `lmdr-config.js` (reference only — not loaded by iframes)
- [x] Create Global `theme-utils.js`
- [/] Standardize `ADMIN_DASHBOARD.html` — no LMDR tokens found
- [x] Standardize `RecruiterDashboard.html` — tokenized (also retains 15 hardcoded classes)
- [x] Standardize `Homepage.HTML` — tokenized (58 LMDR token uses, inline config)
- [x] Standardize `Recruiting_Landing_Page.html` — tokenized (also retains 9 hardcoded classes)
- [/] Standardize Landing Pages (src/public/landing/*.html) — 13/18 done, 5 untouched
- [/] Standardize Carrier Pages (src/public/carrier/*.html) — 7 files have tokens, 2 have hardcoded remnants
- [ ] Refactor Table Components — not verified
- [ ] Refactor Card Components — not verified

## Remaining Work

### Landing pages without LMDR tokens (5 files)
- `AI vs Traditional Recruiting Methods.html`
- `About_page.html`
- `Rapid Response - Job Description.html`
- `DOT Compliance in Driver Hiring.html`
- `ALLURE Onboarding.html`

### Admin pages without LMDR tokens (9 of 11 files)
- `ADMIN_DASHBOARD.html`
- `ADMIN_DRIVERS.html`
- `ADMIN_CARRIERS.html`
- `ADMIN_OBSERVABILITY.html`
- `ADMIN_MATCHES.html`
- `ADMIN_AUDIT_LOG.html`
- `ADMIN_AI_ROUTER.html`
- `ADMIN_PROMPTS.html`
- `ADMIN_CONTENT.html`

### Files with mixed old + new classes (need hardcoded class cleanup)
34 files across all portals still contain 341 occurrences of hardcoded color classes (`bg-blue-600`, `text-blue-600`, `bg-yellow-400`, `bg-slate-900`) alongside LMDR tokens. These need a sweep to replace remaining hardcoded values with semantic tokens.
