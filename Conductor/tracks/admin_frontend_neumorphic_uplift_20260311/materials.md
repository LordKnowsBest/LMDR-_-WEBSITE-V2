# Admin Frontend Neumorphic Uplift - Materials Pack

## Purpose

This file gathers the primary local sources for uplifting `frontend/src/app/(admin)/admin` to the canonical LMDR / VelocityMatch neumorphic design system already used elsewhere in the repo.

## Canonical Design Sources

### 1. Core skill and workflow

- `.agents/skills/recruiter-os-design-system/SKILL.md`
  - Canonical rules for light + solar + dark RecruiterOS surfaces.
  - Defines lighting model, palette, elevation classes, typography, component patterns, and anti-patterns.
- `.agents/workflows/recruiter-os.md`
  - Workflow wrapper around the skill.
  - Repeats the compliance checklist and implementation discipline.

### 2. Legacy RecruiterOS implementation

- `src/public/recruiter/os/css/recruiter-os.css`
  - Original `--ros-*` token system.
  - Canonical `.neu`, `.neu-s`, `.neu-x`, `.neu-lg`, `.neu-in`, `.neu-ins`, `.neu-ind` classes.
  - Workspace grid, theme transitions, dock tokens, and dark/solar overrides.
- `src/public/recruiter/recruiter-design-system.css`
  - Shared recruiter design-system layer outside the single OS shell.

### 3. Bundled standalone visual guide

- `.agents/skills/recruiter-os-design-system/resources/solarized_neumorphic_guide.html`
  - Self-contained design guide page.
  - Useful for visual intent: 45-degree light source, beige/tan/ivory base, raised vs pressed examples.

### 4. AdminOS spec from Conductor

- `Conductor/tracks/adminOS_hub_20260227/spec.md`
  - Explicitly says AdminOS must visually match the Solarized Neumorphic Design System.
  - Defines shell expectations: narrow left rail, open dot-grid workspace, right copilot, command bar, floating dock.
  - Important because it shows the intended admin visual language, even though the Next admin app does not yet fully mirror it.

### 5. Stale but still useful architecture map

- `admin-os-map-v2.html`
  - Stale for transport details because it still thinks in terms of Wix page code and old service wiring.
  - Still useful for:
    - service domains
    - view clustering
    - AI router / agent / HITL concepts
    - identifying high-stakes admin actions that need safer UX
  - Should not be treated as the current implementation contract.

## Next.js Frontend Source Of Truth

### 1. Theme + token layer

- `frontend/src/app/globals.css`
  - Next-native neumorphic token system using `--neu-*`.
  - Themes:
    - `light`
    - `solar`
    - `dark`
    - `colorway`
  - Contains the actual frontend elevation classes and animation utilities.
  - This is the practical source of truth for any uplift inside `frontend/src/app/*`.
- `frontend/src/lib/theme.tsx`
  - Theme controller.
  - Applies theme class to `<html>`.
  - Persists theme with `localStorage['dos-theme']`.
- `frontend/tailwind.config.ts`
  - Tailwind color aliases aligned with the neumorphic palette.

### 1b. Current API transport layer

- `frontend/src/lib/admin-api.ts`
  - Current admin transport seam.
  - Server-side fetcher to `LMDR_API_URL` / Cloud Run admin gateway via `/v1/admin/*`.
- `frontend/src/lib/api.ts`
  - Broader service inventory for direct service domains:
    - driver
    - carrier
    - matching
    - compliance
    - billing
    - notifications
    - ai
    - analytics
  - Useful for understanding current Cloud Run boundaries and future UI expansion seams.

### 1c. Current admin action layer

- `frontend/src/app/(admin)/actions/dashboard.ts`
- `frontend/src/app/(admin)/actions/drivers.ts`
- `frontend/src/app/(admin)/actions/carriers.ts`
- `frontend/src/app/(admin)/actions/matches.ts`
- `frontend/src/app/(admin)/actions/ai-router.ts`
- `frontend/src/app/(admin)/actions/observability.ts`
- `frontend/src/app/(admin)/actions/billing.ts`
- `frontend/src/app/(admin)/actions/audit.ts`

These files are the actual frontend integration seams the admin UI should be designed around.

### 2. Shared layout primitives

- `frontend/src/components/layout/PortalShell.tsx`
  - Current admin/carrier/b2b shell wrapper.
- `frontend/src/components/layout/Sidebar.tsx`
  - Current left nav treatment.
- `frontend/src/components/layout/TopBar.tsx`
  - Current top bar treatment.

### 3. Shared UI primitives

- `frontend/src/components/ui/Card.tsx`
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/components/ui/Input.tsx`
- `frontend/src/components/ui/KpiCard.tsx`
- `frontend/src/components/ui/Badge.tsx`
- `frontend/src/components/ui/ProgressBar.tsx`
- `frontend/src/components/ui/DataTable.tsx`
- `frontend/src/components/ui/StatusDot.tsx`

These are the components the admin surface already depends on. Any uplift should prefer improving or extending these primitives instead of re-styling page JSX ad hoc.

## Best Concrete Reference Surface

### Driver app shell

- `frontend/src/app/(driver)/layout.tsx`
  - Best current example of a more opinionated neumorphic application shell.
  - Uses theme provider, workspace grid, drawers, fixed command bar, and bottom tab bar.

### Driver dashboard page

- `frontend/src/app/(driver)/driver/page.tsx`
  - Best current reference for page-level composition:
    - raised hero card
    - horizontal KPI row
    - quick-action orb grid
    - inset score pills
    - layered progress surfaces
    - higher motion density without abandoning the design system

### Driver feature components worth borrowing from

- `frontend/src/components/driver/VoiceCommandBar.tsx`
- `frontend/src/components/driver/DriverNavDrawer.tsx`
- `frontend/src/components/driver/DriverChatDrawer.tsx`
- `frontend/src/components/driver/DriverTopBanner.tsx`

These matter because the admin uplift likely needs stronger shell identity, not just prettier cards.

## Target Surface

Primary target:

- `frontend/src/app/(admin)/admin/page.tsx`
- `frontend/src/app/(admin)/admin/drivers/page.tsx`
- `frontend/src/app/(admin)/admin/carriers/page.tsx`
- `frontend/src/app/(admin)/admin/matches/page.tsx`
- `frontend/src/app/(admin)/admin/ai-router/page.tsx`
- `frontend/src/app/(admin)/admin/analytics/page.tsx`
- `frontend/src/app/(admin)/admin/observability/page.tsx`
- `frontend/src/app/(admin)/layout.tsx`

## Design Contract To Preserve

### Lighting

- All raised surfaces must keep the paired highlight/shadow model.
- Light source is top-left.
- Never use single-shadow card styling in place of the paired neumorphic shadows.

### Core token mapping

Legacy shell:

- `--ros-surface` -> surface
- `--ros-shadow-d` -> lower-right shadow
- `--ros-shadow-l` -> upper-left highlight
- `--ros-text` / `--ros-text-muted`

Next frontend:

- `--neu-bg`
- `--neu-bg-deep`
- `--neu-bg-soft`
- `--neu-shadow-d`
- `--neu-shadow-l`
- `--neu-text`
- `--neu-text-muted`
- `--neu-accent`
- `--neu-border`

Rule:

- For `frontend/src/app/*`, prefer `--neu-*`.
- Treat `--neu-*` as the frontend port of the original `--ros-*` system.

### Elevation classes

Use only:

- `.neu-x`
- `.neu-s`
- `.neu`
- `.neu-lg`
- `.neu-ins`
- `.neu-in`
- `.neu-ind`

### Typography

- `Inter` remains the font family.
- Use dark/muted text tokens, not arbitrary slate or gray values.

### Components

Preferred patterns already represented in the repo:

- raised card containers
- inset search/input wells
- orb-like quick actions
- compact KPI blocks
- subtle grid background on large workspaces
- gradient primary action only for true primary CTAs

## Current Admin Surface Observations

### What already aligns

- Admin pages already use `Card`, `Button`, `Input`, `KpiCard`, `Badge`, `ProgressBar`, and `DataTable`.
- Admin pages already consume `--neu-*` tokens rather than raw hardcoded palette values in most main surfaces.
- `PortalShell` already uses the workspace grid and a themed shell background.

### What is still weak or inconsistent

1. The admin shell is functionally correct but visually generic.
   - `PortalShell`, `Sidebar`, and `TopBar` do not yet express the stronger spatial identity seen in the driver app or AdminOS spec.

2. Some admin states bypass the design system.
   - Error banners use hardcoded red backgrounds and borders instead of neumorphic or tokenized alert surfaces.

3. The admin pages rely heavily on fallback mock data.
   - This is acceptable for temporary frontend scaffolding, but it conflicts with the stricter AdminOS spec direction.

4. The admin surface uses the primitives but not the full shell vocabulary.
   - Missing or underused patterns include stronger action orbs, inset command surfaces, richer secondary background layers, and more intentional shell rhythm.

5. The current left sidebar is a standard nav column, not the narrower orb-led spatial rail described in `adminOS_hub_20260227/spec.md`.

## GCP Migration Crosswalk

### How to interpret old JSW/service references now

The old roadmap and AdminOS map often think in terms of Wix page code, `.jsw` services, and postMessage bridges. For the Next admin frontend, translate those concepts like this:

- old JSW/backend service intent -> Cloud Run API domain or admin gateway route
- page-level bridge action -> Next server action in `frontend/src/app/(admin)/actions/*`
- direct service-specific reads -> service clients from `frontend/src/lib/api.ts`
- admin-wide protected operations -> `frontend/src/lib/admin-api.ts` via `/v1/admin/*`

### Practical implication for the uplift

When creating space for future capabilities in the admin UI, design for:

- data panels that can accept live async data from server actions
- action surfaces that can support mutation states, retries, confirmations, and approval gates
- shell regions for AI / orchestration / observability workflows
- high-stakes mutation UX that can later plug into HITL approval flows

Do not design around the old Wix postMessage model for the Next admin frontend.

### Current service domains surfaced in code

From `frontend/src/lib/api.ts`, the current service landscape is:

- driver service
- carrier service
- matching engine
- compliance service
- billing service
- notifications service
- ai service
- analytics service

From `frontend/src/app/(admin)/actions/*`, the admin-specific UI already has seams for:

- dashboard
- drivers
- carriers
- matches
- ai router
- observability
- billing / revenue
- audit

This is the real backend surface the admin UI must anticipate.

## Working Recommendation For The Uplift

Use this priority order:

1. `frontend/src/app/globals.css`
   - Real frontend token and class source of truth.
2. Shared UI primitives in `frontend/src/components/ui/*`
   - Upgrade these first when a pattern should be reused across admin pages.
3. Driver shell and dashboard files
   - Use as the strongest modern frontend reference for composition and interaction density.
4. Admin action layer and API clients
   - Use to ensure new shell regions and controls align with actual Cloud Run-backed capabilities.
5. AdminOS spec
   - Use to steer shell structure and spatial identity for admin.
6. Legacy RecruiterOS skill and CSS
   - Use as the canonical original contract when there is any ambiguity.

## Likely Uplift Hotspots

- `frontend/src/components/layout/PortalShell.tsx`
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/components/layout/TopBar.tsx`
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/components/ui/Badge.tsx`
- `frontend/src/components/ui/DataTable.tsx`
- `frontend/src/app/(admin)/admin/page.tsx`
- `frontend/src/app/(admin)/admin/drivers/page.tsx`

## Short Gap Summary

The repo already contains the design guidance, token system, and reusable primitives needed to uplift the admin app. The main missing piece is not the palette or shadow logic; it is shell cohesion. The driver app is the best live Next.js reference for how to make the admin area feel intentionally neumorphic rather than merely token-compliant.
