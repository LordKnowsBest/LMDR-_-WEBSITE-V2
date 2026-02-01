# Carrier Journey Activation - Specification

**Track ID:** carrier_journey_activation_20260131
**Created:** 2026-01-31
**Priority:** Critical
**Status:** In Progress

---

## 1. Overview

### Problem

A carrier subscribes via Stripe checkout (Pro or Enterprise plan). Stripe redirects to `/subscription-success` with `session_id` and `plan` params. The success page now correctly displays the plan (fixed 2026-01-31). But after that:

1. **"Go to Dashboard"** sends them to `/recruiter-console` — which calls `getOrCreateRecruiterProfile()` but has no onboarding flow to collect company info, DOT number, or hiring preferences
2. **"Start Finding Drivers"** sends them to `/recruiter-driver-search` — which uses a hardcoded `DEV_MODE_CARRIER_DOT = '123456'` fallback when no carrier profile exists
3. **Compliance pages** (5 HTML files) have backend services but zero Wix pages, zero page code bridges, zero routes — carriers can't access them
4. **No guided onboarding** — carriers skip the Intake Questionnaire and Weight Preferences, resulting in incomplete profiles and poor match quality
5. **Navigation fragmentation** — no consistent sidebar or menu connects the carrier's operational pages

### Solution

Wire the complete carrier journey from checkout through daily operations across 5 phases:

```
Stripe Checkout → Success Page → Welcome/Onboarding → Intake → Preferences
                                                                    ↓
Dashboard ← Navigation Hub → Driver Search → Compliance Suite → Retention
```

### Target Users

- Carriers who just completed Pro or Enterprise subscription checkout
- Existing carriers returning to the platform for daily operations

### Revenue Impact

Direct — every paying carrier hits this flow. A broken post-checkout experience causes immediate churn of subscribers paying $149-$499/month.

---

## 2. Architecture

### Current State (Broken Flow)

```
Stripe Checkout
    ↓
/subscription-success (FIXED - shows correct plan)
    ↓
  [Dashboard]  or  [Driver Search]
    ↓                    ↓
  Works but no      Hardcoded DOT#
  onboarding        No real carrier
  flow              identity
    ↓                    ↓
  Dead end          Poor results
```

### Target State (Connected Flow)

```
Stripe Checkout
    ↓
/subscription-success
    ↓
/carrier-welcome (NEW PAGE)
    ↓
  Intake Questionnaire (embedded or linked)
    ↓
  Weight Preferences (embedded or linked)
    ↓
/recruiter-console (Dashboard - carrier fully initialized)
    ↓
  Sidebar Navigation:
  ├── Driver Search (/recruiter-driver-search)
  ├── Pipeline (/recruiter-pipeline)
  ├── Compliance Calendar (NEW PAGE)
  ├── Document Vault (NEW PAGE)
  ├── DQ File Tracker (NEW PAGE)
  ├── CSA Monitor (NEW PAGE)
  ├── Incident Reporting (NEW PAGE)
  └── Retention Analytics
```

### Carrier Identity Flow

```
Stripe Session Metadata
  → company_name, plan, email
    → getOrCreateRecruiterProfile()
      → Creates RecruiterCarriers record
        → Intake Questionnaire fills DOT#, MC#, fleet size, etc.
          → Weight Preferences sets matching config
            → Carrier is fully initialized in system
```

---

## 3. Phase Specifications

### Phase 1: Post-Checkout Onboarding Flow

**Goal:** Guide new subscribers from success page through profile completion.

**Changes:**
- Update `Subscription_Success.html` buttons: "Go to Dashboard" → "Set Up Your Account" pointing to `/carrier-welcome`
- Create Wix page at `/carrier-welcome` embedding `Carrier_Welcome.html`
- Write page code bridge for carrier welcome that:
  - Receives `plan` and `sessionId` from URL params
  - Sends carrier data to the HTML component
  - Handles navigation messages to intake questionnaire
- Wire `Carrier_Intake_Questionnaire.html` PostMessage bridge:
  - Receives carrier context from page code
  - Sends form submission data back to page code
  - Page code calls backend to save intake data
- Wire `CARRIER_WEIGHT_PREFERENCES.html` PostMessage bridge:
  - Receives current preferences from page code
  - Sends updated preferences back
  - Page code calls `carrierPreferences.jsw` to save

**Success Criteria:**
- New subscriber completes: Success → Welcome → Intake → Preferences → Dashboard
- All form data persists to Airtable
- Carrier profile has DOT#, company name, fleet size after onboarding

### Phase 2: Unified Carrier Identity

**Goal:** Every carrier-facing page resolves the same carrier identity consistently.

**Changes:**
- Create `carrierIdentityService.jsw` (or extend `recruiter_service.jsw`):
  - `getCarrierIdentity(memberId)` → returns `{ dotNumber, mcNumber, companyName, plan, ... }`
  - Single source of truth for carrier lookup
- Refactor `Recruiter Console.zriuj.js`:
  - Use `getCarrierIdentity()` instead of `getOrCreateRecruiterProfile()`
  - Pass carrier DOT to dashboard HTML component
- Refactor `RECRUITER DRIVER SEARCH.qtecw.js`:
  - Remove `DEV_MODE_CARRIER_DOT = '123456'` hardcoded fallback
  - Use `getCarrierIdentity()` for carrier lookup
  - Show meaningful error if carrier has no DOT yet (redirect to intake)
- Ensure Stripe checkout session metadata includes `dot_number` if known

**Success Criteria:**
- Dashboard and Driver Search use same carrier lookup
- No hardcoded DOT numbers in production code
- Missing-profile state shows helpful redirect, not broken UI

### Phase 3: Compliance Suite Page Bridges

**Goal:** Create Wix pages and page code bridges for all 5 compliance HTML files.

**Pages to Create:**
1. `/carrier-compliance-calendar` → `CARRIER_COMPLIANCE_CALENDAR.html`
2. `/carrier-document-vault` → `CARRIER_DOCUMENT_VAULT.html`
3. `/carrier-dq-tracker` → `CARRIER_DQ_TRACKER.html`
4. `/carrier-csa-monitor` → `CARRIER_CSA_MONITOR.html`
5. `/carrier-incident-reporting` → `CARRIER_INCIDENT_REPORTING.html`

**Each page code bridge must:**
- Authenticate the carrier (member login check)
- Resolve carrier identity via `getCarrierIdentity()`
- Send carrier context (DOT#, company name, plan) to HTML component
- Handle all PostMessage types defined in the compliance HTML files
- Call the corresponding backend service (complianceCalendarService, documentVaultService, etc.)
- Handle navigation messages between compliance pages

**Backend Services (already exist, from carrier_compliance_20260120):**
- `complianceCalendarService.jsw`
- `documentVaultService.jsw`
- `dqFileService.jsw`
- `csaMonitorService.jsw`
- `incidentService.jsw`

**Success Criteria:**
- All 5 compliance pages accessible via direct URL
- Each page loads carrier-specific data from Airtable
- Demo-data fallback still works (existing 5-second timeout)
- No console errors on page load

### Phase 4: Carrier Navigation System

**Goal:** Unified navigation across all carrier pages.

**Changes:**
- Add carrier navigation section to `RecruiterDashboard.html` sidebar:
  - Compliance Calendar, Document Vault, DQ Tracker, CSA Monitor, Incident Reporting
  - Use PostMessage to navigate parent page (same pattern as success page buttons)
- Add navigation header/breadcrumbs to each compliance HTML file:
  - Back to Dashboard link
  - Sibling compliance page links
- Update success page to show "What's included" with links to compliance features for Enterprise

**Success Criteria:**
- Carrier can navigate between all pages without manually typing URLs
- Current page highlighted in sidebar
- Back-to-dashboard works from every page

### Phase 5: Retention & Analytics Wiring

**Goal:** Connect retention and analytics pages to carrier context.

**Changes:**
- Wire `Recruiter_Retention_Dashboard.html` to show carrier-specific retention data
- Wire `RECRUITER_LIFECYCLE_MONITOR.html` for carrier driver lifecycle events
- Wire `Recruiter_Console_Infograph.html` for carrier-specific KPIs
- Add "Retention" and "Analytics" sections to carrier sidebar navigation

**Success Criteria:**
- Retention dashboard shows data for the logged-in carrier's drivers
- Lifecycle monitor filters to the carrier's hiring events
- Infograph shows carrier-relevant KPIs

---

## 4. Key Design Decisions

### Page Code Bridge Pattern

Every compliance/carrier page follows this pattern:

```javascript
// Page code (Wix Velo)
import wixWindow from 'wix-window';
import { currentMember } from 'wix-members-frontend';
import { getCarrierIdentity } from 'backend/carrierIdentityService';

$w.onReady(async function () {
  const member = await currentMember.getMember();
  if (!member) { wixLocation.to('/account/my-account'); return; }

  const carrier = await getCarrierIdentity(member._id);

  // Broadcast to all HTML components
  const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5'];
  for (const id of possibleIds) {
    try {
      const comp = $w(id);
      if (comp && typeof comp.onMessage === 'function') {
        comp.onMessage((event) => handleMessage(event, comp, carrier));
        setTimeout(() => comp.postMessage({
          type: 'carrierContext',
          data: carrier
        }), 500);
      }
    } catch (e) {}
  }
});
```

### Carrier Welcome vs Direct Dashboard

New subscribers go to `/carrier-welcome` first (not dashboard) because:
- Dashboard is overwhelming without context
- Intake questionnaire collects critical DOT# for matching
- Weight preferences directly affect search quality
- Welcome page can celebrate the purchase and set expectations

After completing onboarding, subsequent logins go directly to dashboard.

---

## 5. Open Questions

1. Should the carrier welcome page be a Wix page with HTML component, or can it be a lightbox/overlay on the dashboard?
2. Do we need a "setup progress" indicator that persists across sessions until onboarding is complete?
3. Should compliance pages be gated by plan tier (Enterprise only) or available to all paid carriers?
4. How should the system handle carriers who skip onboarding and go directly to dashboard?
