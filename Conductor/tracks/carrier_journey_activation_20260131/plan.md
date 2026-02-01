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
- [ ] Wire post-submission redirect to weight preferences page
- [x] Intake form hosted on existing `/trucking-companies` page (Trucking Companies.iq65y.js)

### 1.4 Weight Preferences Wiring
- [x] Audit CARRIER_WEIGHT_PREFERENCES.html for PostMessage types
  - Sends: `weightPreferencesReady`, `saveWeightPreferences`
  - Receives: `loadPreferences`, `savePreferencesResult`
- [ ] Write page code bridge (or integrate into Recruiter Console settings tab)
- [ ] Load current preferences via carrierPreferences.jsw
- [ ] Handle `saveWeightPreferences` → save to Airtable
- [ ] Navigate to dashboard on completion
- [ ] Mark carrier as "onboarding complete" after preferences saved

### Phase 1 Quality Gate
- [ ] New subscriber can complete full flow: Success → Welcome → Intake → Preferences → Dashboard
- [ ] All form data persists to Airtable
- [ ] Carrier profile has DOT#, company name, fleet size
- [ ] No console errors in any step
- [ ] PostMessage bridge works in Wix iframe context

---

## Phase 2: Unified Carrier Identity
*Goal: Every carrier page resolves identity consistently, no hardcoded fallbacks*

### 2.1 Carrier Identity Service
- [ ] Create `carrierIdentityService.jsw` with `getCarrierIdentity(memberId)`:
  - Query RecruiterCarriers by member ID
  - Return `{ dotNumber, mcNumber, companyName, plan, fleetSize, onboardingComplete }`
  - Handle missing profile gracefully (return `{ needsOnboarding: true }`)
- [ ] Add to config.jsw routing (RecruiterCarriers already routes to Airtable)
- [ ] Write basic tests

### 2.2 Refactor Recruiter Console Page Code
- [ ] Import and use `getCarrierIdentity()`
- [ ] Send carrier identity to dashboard HTML component
- [ ] Handle `needsOnboarding` state: redirect to `/carrier-welcome`

### 2.3 Refactor Driver Search Page Code
- [ ] Remove `DEV_MODE_CARRIER_DOT = '123456'` hardcoded fallback
- [ ] Use `getCarrierIdentity()` for carrier lookup
- [ ] Handle missing DOT: show message + link to intake questionnaire
- [ ] Pass real DOT# to search queries

### Phase 2 Quality Gate
- [ ] Dashboard and Driver Search use `getCarrierIdentity()`
- [ ] No hardcoded DOT numbers anywhere
- [ ] Missing-profile state shows helpful UI, not broken page
- [ ] Existing carrier data still loads correctly

---

## Phase 3: Compliance Suite Page Bridges
*Goal: Create Wix pages and page code for all 5 compliance HTML files*
*Note: Backend services already exist (carrier_compliance_20260120 track)*

### 3.1 Compliance Calendar Page
- [ ] Audit CARRIER_COMPLIANCE_CALENDAR.html PostMessage types
- [ ] Create Wix page at `/carrier-compliance-calendar`
- [ ] Write page code bridge:
  - Auth check + carrier identity
  - Call complianceCalendarService.jsw functions
  - Handle all inbound/outbound PostMessage types
- [ ] Test with real carrier data

### 3.2 Document Vault Page
- [ ] Audit CARRIER_DOCUMENT_VAULT.html PostMessage types
- [ ] Create Wix page at `/carrier-document-vault`
- [ ] Write page code bridge:
  - Auth check + carrier identity
  - Call documentVaultService.jsw functions
  - Handle file upload messages
- [ ] Test with real carrier data

### 3.3 DQ File Tracker Page
- [ ] Audit CARRIER_DQ_TRACKER.html PostMessage types
- [ ] Create Wix page at `/carrier-dq-tracker`
- [ ] Write page code bridge:
  - Auth check + carrier identity
  - Call dqFileService.jsw functions
  - Handle export/audit messages
- [ ] Test with real carrier data

### 3.4 CSA Score Monitor Page
- [ ] Audit CARRIER_CSA_MONITOR.html PostMessage types
- [ ] Create Wix page at `/carrier-csa-monitor`
- [ ] Write page code bridge:
  - Auth check + carrier identity
  - Call csaMonitorService.jsw functions
  - Handle FMCSA data refresh messages
- [ ] Test with real carrier data

### 3.5 Incident Reporting Page
- [ ] Audit CARRIER_INCIDENT_REPORTING.html PostMessage types
- [ ] Create Wix page at `/carrier-incident-reporting`
- [ ] Write page code bridge:
  - Auth check + carrier identity
  - Call incidentService.jsw functions
  - Handle form submission and investigation messages
- [ ] Test with real carrier data

### Phase 3 Quality Gate
- [ ] All 5 pages accessible via direct URL
- [ ] Each page loads carrier-specific data
- [ ] Demo-data fallback still works (5-second timeout)
- [ ] No console errors on page load
- [ ] Auth redirect works for non-logged-in users

---

## Phase 4: Carrier Navigation System
*Goal: Unified navigation so carriers can reach all pages from any page*

### 4.1 Dashboard Sidebar Enhancement
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
| Phase 3 | HIGH | No | Can be done incrementally (1 page at a time) |
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
