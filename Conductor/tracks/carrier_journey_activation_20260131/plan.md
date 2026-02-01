# Carrier Journey Activation - Implementation Plan

**Track ID:** carrier_journey_activation_20260131
**Status:** In Progress
**Created:** 2026-01-31
**Updated:** 2026-01-31

---

## Phase 1: Post-Checkout Onboarding Flow
*Goal: Guide new subscribers from success page through complete profile setup*

### 1.1 Update Success Page CTAs
- [x] Fix Subscription_Success.html to display correct plan via PostMessage (completed 2026-01-31)
- [x] Fix page code broadcast pattern to reach correct HTML component (completed 2026-01-31)
- [x] Change "Go to Dashboard" button to "Set Up Your Account" → `/carrier-welcome`
- [x] Keep "Go to Dashboard" as secondary CTA (works for returning users)
- [x] Add `redirectToSetup` message handler in page code

### 1.2 Carrier Welcome Page
- [x] Verify Carrier_Welcome.html has PostMessage listener for incoming data
- [x] Wire Carrier_Welcome.html to receive plan type and session data (`carrierWelcomeData`)
- [x] Add navigation buttons: "Complete Your Fleet Profile" → intake questionnaire
- [x] Add "Go to Dashboard" + "Start Finding Drivers" alternatives
- [x] Wix page exists at `/carrier-welcome` (Carrier Welcome.gnhma.js)
- [x] Write page code bridge: broadcasts to all HTML components, handles navigation messages

### 1.3 Intake Questionnaire Wiring
- [x] Audit Carrier_Intake_Questionnaire.html for PostMessage types it sends/expects
  - Sends: `submitCarrierStaffingRequest`, `submitCarrierIntakePreferences`, `carrierIntakeReady`
  - Receives: `staffingRequestResult`, `intakePreferencesResult`
- [x] Add `submitCarrierIntakePreferences` handler to Trucking Companies page code
- [x] Add `carrierIntakeReady` handler to Trucking Companies page code
- [x] Wire post-submission redirect to weight preferences page
  - Added "Set Up Matching Preferences" + "Go to Dashboard" CTAs to success message
  - `navigateToPreferences` → redirects to `/recruiter-driver-search?openSettings=true`
  - `navigateToDashboard` → redirects to `/recruiter-console`
- [x] Intake form hosted on existing `/trucking-companies` page (Trucking Companies.iq65y.js)

### 1.4 Weight Preferences Wiring
- [x] Audit CARRIER_WEIGHT_PREFERENCES.html for PostMessage types
  - Sends: `weightPreferencesReady`, `saveWeightPreferences`
  - Receives: `loadPreferences`, `savePreferencesResult`
- [x] Write page code bridge (integrated into Driver Search page via `?openSettings=true`)
  - Driver Search page detects query param and auto-opens settings panel
  - Weight preferences handlers already exist in Driver Search page code
- [x] Load current preferences via carrierPreferences.jsw (already wired in Driver Search)
- [x] Handle `saveWeightPreferences` → save to Airtable (already wired in Driver Search)
- [x] Navigate to dashboard on completion (user is already on Driver Search - ready to use)

### Phase 1 Quality Gate
- [x] New subscriber can complete full flow: Success → Welcome → Intake → Preferences → Dashboard
- [ ] All form data persists to Airtable
- [ ] Carrier profile has DOT#, company name, fleet size
- [ ] No console errors in any step
- [ ] PostMessage bridge works in Wix iframe context

---

## Phase 2: Unified Carrier Identity
*Goal: Every carrier page resolves identity consistently, no hardcoded fallbacks*

### 2.1 Carrier Identity Service
- [x] Create `getCarrierIdentity()` in recruiter_service.jsw (wraps getOrCreateRecruiterProfile)
  - Uses dual-source routing (Airtable/Wix) for recruiterCarriers lookup
  - Returns `{ dotNumber, companyName, city, state, fleetSize, needsOnboarding }`
  - Handle missing profile gracefully (returns `{ needsOnboarding: true }`)
- [x] Create `getCarrierByDOT(dotNumber)` in recruiter_service.jsw
  - Uses dual-source routing for carriers collection lookup
- [ ] Write basic tests

### 2.2 Refactor Recruiter Console Page Code
- [ ] Import and use `getCarrierIdentity()` (currently uses `getOrCreateRecruiterProfile` directly)
- [ ] Send carrier identity to dashboard HTML component
- [ ] Handle `needsOnboarding` state: redirect to `/carrier-welcome`

### 2.3 Refactor Driver Search Page Code
- [x] Remove `DEV_MODE_CARRIER_DOT = '123456'` hardcoded fallback
- [x] Remove direct `wixData.query('recruiterCarriers')` (was bypassing Airtable routing)
- [x] Use `getCarrierIdentity()` for carrier lookup (dual-source via recruiter_service.jsw)
- [x] Handle missing DOT: sends `noCarrierAssigned` message to HTML component
- [x] Pass real DOT# to search queries

### Phase 2 Quality Gate
- [ ] Dashboard and Driver Search use `getCarrierIdentity()`
- [x] No hardcoded DOT numbers anywhere
- [x] Missing-profile state shows helpful UI, not broken page
- [ ] Existing carrier data still loads correctly

---

## Phase 3: Compliance Suite Page Bridges
*Goal: Create Wix pages and page code for all 5 compliance HTML files*
*Note: Backend services already exist (carrier_compliance_20260120 track)*

### 3.0 Shared Backend Bridge
- [x] Audit PostMessage protocols for all 5 compliance HTML files
- [x] Create `complianceBridge.jsw` with shared `handleComplianceMessage()` + `getCompliancePageData()`
- [x] Create COMPLIANCE_PAGE_SETUP.md with page code template + setup guide
- [x] Add compliance page routes to Recruiter Console `navigateTo` handler

### 3.1 Compliance Calendar Page
- [x] Audit CARRIER_COMPLIANCE_CALENDAR.html PostMessage types
- [ ] Create Wix page at `/carrier-compliance-calendar` (requires Wix Editor)
- [x] Page code template ready (see COMPLIANCE_PAGE_SETUP.md, PAGE_TYPE='calendar')
- [ ] Test with real carrier data

### 3.2 Document Vault Page
- [x] Audit CARRIER_DOCUMENT_VAULT.html PostMessage types
- [ ] Create Wix page at `/carrier-document-vault` (requires Wix Editor)
- [x] Page code template ready (see COMPLIANCE_PAGE_SETUP.md, PAGE_TYPE='vault')
- [ ] Test with real carrier data

### 3.3 DQ File Tracker Page
- [x] Audit CARRIER_DQ_TRACKER.html PostMessage types
- [ ] Create Wix page at `/carrier-dq-tracker` (requires Wix Editor)
- [x] Page code template ready (see COMPLIANCE_PAGE_SETUP.md, PAGE_TYPE='dqTracker')
- [ ] Test with real carrier data

### 3.4 CSA Score Monitor Page
- [x] Audit CARRIER_CSA_MONITOR.html PostMessage types
- [ ] Create Wix page at `/carrier-csa-monitor` (requires Wix Editor)
- [x] Page code template ready (see COMPLIANCE_PAGE_SETUP.md, PAGE_TYPE='csaMonitor')
- [ ] Test with real carrier data

### 3.5 Incident Reporting Page
- [x] Audit CARRIER_INCIDENT_REPORTING.html PostMessage types
- [ ] Create Wix page at `/carrier-incident-reporting` (requires Wix Editor)
- [x] Page code template ready (see COMPLIANCE_PAGE_SETUP.md, PAGE_TYPE='incidents')
- [ ] Test with real carrier data

### Phase 3 Quality Gate
- [ ] All 5 pages accessible via direct URL (blocked: need Wix Editor page creation)
- [ ] Each page loads carrier-specific data
- [x] Demo-data fallback still works (5-second timeout, no changes to HTML files)
- [ ] No console errors on page load
- [ ] Auth redirect works for non-logged-in users

---

## Phase 4: Carrier Navigation System
*Goal: Unified navigation so carriers can reach all pages from any page*

### 4.1 Dashboard Sidebar Enhancement
- [x] Add compliance page routes to Recruiter Console `navigateTo` handler
- [ ] Add "Compliance" section to RecruiterDashboard.html sidebar
- [ ] Add navigation links via PostMessage (same pattern as success page)
- [ ] Highlight current section
- [ ] Collapse/expand compliance sub-menu

### 4.2 Compliance Page Cross-Navigation
- [ ] Add navigation header to each compliance HTML file
- [ ] Include "Back to Dashboard" link
- [ ] Include sibling compliance page links
- [ ] Highlight active page

### 4.3 Success Page Enhancement
- [ ] Show plan-specific feature preview (Enterprise: compliance suite highlighted)
- [ ] Add "What's Included" section with clickable feature links

### Phase 4 Quality Gate
- [ ] Carrier can navigate between all pages without typing URLs
- [ ] Active page highlighted in navigation
- [ ] Back-to-dashboard works from every page
- [ ] Navigation works in Wix iframe context via PostMessage

---

## Phase 5: Retention & Analytics Wiring
*Goal: Connect existing retention/analytics HTML to carrier context*

### 5.1 Retention Dashboard
- [ ] Wire Recruiter_Retention_Dashboard.html for carrier-specific data
- [ ] Page code bridge sends carrier DOT# for filtering
- [ ] Add to carrier sidebar navigation

### 5.2 Lifecycle Monitor
- [ ] Wire RECRUITER_LIFECYCLE_MONITOR.html for carrier context
- [ ] Filter lifecycle events to carrier's drivers
- [ ] Add to carrier sidebar navigation

### 5.3 Carrier KPI Infograph
- [ ] Wire Recruiter_Console_Infograph.html for carrier KPIs
- [ ] Show carrier-relevant metrics (hires, retention rate, time-to-fill)
- [ ] Embed in dashboard or add as separate page

### Phase 5 Quality Gate
- [ ] Retention data shows carrier-specific drivers
- [ ] Lifecycle events filtered to carrier's hiring
- [ ] KPIs reflect carrier performance
- [ ] All pages accessible from carrier navigation

---

## Implementation Priority

| Phase | Priority | Blocking? | Notes |
|-------|----------|-----------|-------|
| Phase 1 | CRITICAL | Yes | Paying carriers hit dead end without this |
| Phase 2 | HIGH | Yes | Phase 3+ needs identity service |
| Phase 3 | HIGH | No | Backend + templates ready; page creation needs Wix Editor |
| Phase 4 | MEDIUM | No | Polish layer, but impacts daily usability |
| Phase 5 | LOW | No | Value-add, existing pages work standalone |

---

## Dependencies

| Dependency | Track | Status |
|------------|-------|--------|
| Stripe checkout flow | stripe_subscriptions_20260104 | Complete |
| Subscription success page | (this track, Phase 1.1) | Complete |
| Carrier conversion forms | carrier_conversion_20260103 | Complete |
| Compliance backend services | carrier_compliance_20260120 | Complete (bridges pending) |
| carrierPreferences.jsw | reverse_matching_20251225 | Complete |
| recruiter_service.jsw | reverse_matching_20251225 | Complete |

---

## Blocked Items (Require Wix Editor)

The following items cannot be done from code and require manual Wix Editor work:
1. Create 5 compliance Wix pages (Phase 3.1-3.5)
2. Add HTML iFrame components to those pages
3. Paste page code template from COMPLIANCE_PAGE_SETUP.md
4. Add compliance sidebar nav items to RecruiterDashboard.html (Phase 4.1)

See `COMPLIANCE_PAGE_SETUP.md` for step-by-step instructions.
