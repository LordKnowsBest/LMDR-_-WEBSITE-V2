# Implementation Plan: UI/UX Standardization

## Goal
Standardize all HTML files across the platform to use LMDR semantic color tokens, consistent inline Tailwind config, and Font Awesome icons.

## Approach Pivot (2026-01-26)

> [!IMPORTANT]
> The original plan called for loading `lmdr-config.js` via external `<script>` tag. This was discovered to **fail in Wix iframes** (commit `dda2186`). CLAUDE.md now mandates **inline Tailwind config** in each HTML file.

### Correct pattern (per CLAUDE.md)
```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          'lmdr-dark': '#0f172a',
          'lmdr-blue': '#2563eb',
          'lmdr-yellow': '#fbbf24',
          'lmdr-canvas': '#f8fafc',
        }
      }
    }
  }
</script>
```

### Deprecated pattern (DO NOT USE)
```html
<!-- This does NOT load in Wix iframes -->
<script src="../lmdr-config.js"></script>
```

## Color Tokenization Rules

Replace hardcoded Tailwind classes with LMDR semantic tokens:
| Old Class | New Class |
|-----------|-----------|
| `bg-blue-600` | `bg-lmdr-blue` |
| `text-blue-600` | `text-lmdr-blue` |
| `bg-yellow-400` | `bg-lmdr-yellow` |
| `text-yellow-400` | `text-lmdr-yellow` |
| `bg-slate-900` | `bg-lmdr-dark` |
| `text-slate-900` | `text-lmdr-dark` |

## Current Progress (audited 2026-01-31)

### Phase 3: Landing Pages — 13/18 tokenized
**Done (13 files):** Homepage, CDL Driver Recruitment Pricing, CDL Class A, Apply for CDL, Home Nightly, Last Mile Delivery, OTR Truck Driver, Quick Apply, 48-Hour, Unified Recruiter Pricing, Truck Driver Page, lmdr-cdl-driver-landing, ALLURE Refrigerated-Premium

**Remaining (5 files):**
- `AI vs Traditional Recruiting Methods.html`
- `About_page.html`
- `Rapid Response - Job Description.html`
- `DOT Compliance in Driver Hiring.html`
- `ALLURE Onboarding.html`

### Phase 2: Dashboards — mostly recruiter, admin lagging
**Tokenized:** RecruiterDashboard, RECRUITER_DRIVER_SEARCH, Recruiter_Telemetry, Recruiter_Pipeline, Recruiting_Landing_Page, Recruiter_Pricing (x2), RECRUITER_GAMIFICATION, RECRUITER_LIFECYCLE_MONITOR, RECRUITER_ONBOARDING_DASHBOARD, Admin_Portal_Dashboard, ADMIN_FEATURE_ADOPTION

**Not tokenized (9 admin files):** ADMIN_DASHBOARD, ADMIN_DRIVERS, ADMIN_CARRIERS, ADMIN_OBSERVABILITY, ADMIN_MATCHES, ADMIN_AUDIT_LOG, ADMIN_AI_ROUTER, ADMIN_PROMPTS, ADMIN_CONTENT

### Phase 4: Carrier Pages — 7 files partially tokenized
Carrier_Welcome, Carrier Solutions, CARRIER_WEIGHT_PREFERENCES, CARRIER_COMPLIANCE_CALENDAR, CARRIER_DOCUMENT_VAULT, CARRIER_CSA_MONITOR, Carrier_Intake_Questionnaire all have some LMDR tokens. CARRIER_INCIDENT_REPORTING and CARRIER_DQ_TRACKER still have hardcoded classes.

### Phase 5: Component Refactoring — not verified
Table and card component refactoring has not been audited.

### Hardcoded class cleanup
34 files across all portals retain 341 occurrences of old hardcoded color classes alongside LMDR tokens. These need a final sweep.

## Verification Plan

### Automated Verification
Run the custom validation script:
```powershell
powershell -ExecutionPolicy Bypass -File Conductor/scans/validate-landing-standardization.ps1
```
Expected Output: `Validation PASSED`

> [!NOTE]
> This script may need updating to validate inline config pattern instead of external lmdr-config.js references.
