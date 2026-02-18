# Code Quality Rules

> Confidence: high | Source: manual | Last validated: 2026-02-18

## Context

This project runs on Wix Velo with a dual-source data layer (Airtable + Wix) and a CDN-first page architecture. Several non-obvious conventions are enforced by automated hooks and must be followed to avoid build failures and runtime errors.

## Details

- **CDN-first page architecture:** All new pages use a thin HTML shell (~90 lines) that loads UI modules from jsDelivr CDN. The HTML file is a static bootloader -- it sets up fonts, Tailwind, inline config, and script tags. All interactive UI lives in JS modules under `src/public/js/` or surface-specific subdirectories. Update workflow: edit JS/CSS, git push, purge jsDelivr cache. No Wix Editor changes needed for UI updates.

- **Dual-source data routing:** Never call `wixData.*` directly in business logic. All data access goes through `dataAccess.jsw`, which reads `configData.js` to route each collection to either Airtable or Wix. Only `AdminUsers` and `MemberNotifications` stay in Wix; everything else (~160 collections) routes to Airtable.

- **PostMessage bridge pattern:** HTML iframes communicate with Wix page code via `postMessage`. The standard protocol uses `{ action, payload }` shape (except Recruiter Onboarding which uses `{ type, data, timestamp }`). Page code discovers HTML components by iterating `#html1` through `#html5` and `#htmlEmbed1` inside try-catch blocks.

- **$w selector safety (hook-enforced):** The `enforce-selector-safety.ps1` hook blocks any page code edit that uses `$w('#elementId')` without an existence check. Accepted patterns: `.rendered` check, `if (el && el.onClick)` guard, or try-catch wrapper. Direct unguarded access like `$w('#btn').onClick(...)` is rejected.

- **Surface branding (hook-enforced):** The `enforce-surface-branding.ps1` hook blocks LMDR branding in non-driver HTML files. Driver pages use LMDR branding; all other surfaces (admin, recruiter, carrier, landing) use VelocityMatch branding.

- **Wix .jsw async gotcha:** All exports from `.jsw` files are auto-wrapped as async RPC stubs by Wix Velo. Even synchronous functions return Promises when called cross-module. Always `await` any `.jsw` import call -- failing to do so causes `[object Promise]` strings in Airtable queries.

- **Inline Tailwind config:** Do not rely on external `lmdr-config.js` in HTML files loaded inside Wix iframes. The external config does not load reliably. Always inline the Tailwind config immediately after the Tailwind CDN script tag.

## Evidence

- CDN architecture proven on `driver/AI_MATCHING.html` (6 modules) and `recruiter/os/RecruiterOS.html` (21 modules)
- Hook scripts in `.claude/` directory: `enforce-selector-safety.ps1`, `enforce-surface-branding.ps1`
- Data routing config: `src/backend/configData.js` (~160 collection entries)
- The `.jsw` async gotcha was root cause of all "Invalid formula" Airtable errors (Feb 2026)

## Related

- [Incident Response](../../admin/playbooks/incident-response.md)
- [Match Quality Signals](../../driver/patterns/match-quality-signals.md)
