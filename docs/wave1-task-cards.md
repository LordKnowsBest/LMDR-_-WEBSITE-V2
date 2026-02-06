# Wave 1 Task Cards

**Timeline:** Weeks 1-2
**Juniors:** J1, J2, J3
**Templates:** Copy from `src/backend/seeds/_TEMPLATE_seed.jsw`, `src/backend/tests/_TEMPLATE_connectionTest.jsw`, `src/public/__tests__/_TEMPLATE_bridge.test.js`, `src/public/__tests__/_TEMPLATE_html.test.js`

---

## How to Use This Document

Each task card tells you:
1. **What to deliver** (files per service assignment)
2. **Which files to read** (your source of truth)
3. **Exact actions to test** (extracted from the page code)
4. **Acceptance criteria** (what "done" means)

**Workflow per assignment:**
1. Read the page code file listed in "Source Files"
2. Read the HTML component file listed in "Source Files"
3. Read the backend service file listed in "Source Files"
4. Copy `_TEMPLATE_bridge.test.js` → fill in bridge test (page code side)
5. Copy `_TEMPLATE_html.test.js` → fill in HTML DOM test (HTML component side)
6. Fill in all `{PLACEHOLDER}` values using the action reference below
7. Run `npm test -- --testPathPattern="{yourTestFile}"` to verify
8. Commit with message: `feat(wave1): Add verification for {ServiceName}`

---

# JUNIOR 1 (J1): Driver Matching, Profiles & Quick Apply

## J1-A: Driver Profiles Seed + Connection Test

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/backend/seeds/seedDriverProfiles.jsw` | `_TEMPLATE_seed.jsw` |
| 2 | `src/backend/tests/driverProfilesConnectionTest.jsw` | `_TEMPLATE_connectionTest.jsw` |

### Source Files to Read
- `src/backend/driverProfiles.jsw` (backend service)
- `src/backend/config.jsw` (look up `driverProfiles` collection key)

### Collection Keys
| Key | Expected Airtable Table |
|-----|------------------------|
| `driverProfiles` | `v2_Driver_Profiles` |
| `driverCarrierInterests` | `v2_Driver_Carrier_Interests` |

### Seed Data Requirements
Generate 10 driver profiles with these field shapes:
```
first_name, last_name, email, phone, cdl_number, cdl_state,
experience_years, status, endorsements, preferred_routes,
created_at
```
**Edge cases to include:**
- 1 inactive driver (status: 'inactive')
- 1 driver with no endorsements (empty array)
- 1 driver with max experience (30+ years)
- 1 driver with minimal data (only required fields)

### Connection Test Configuration
```javascript
const TEST_RECORD = {
    first_name: '__TEST_SEED__',
    last_name: 'ConnectionTest',
    email: 'conntest@test.lmdr.com',
    status: 'inactive'
};

const EXPECTED_AIRTABLE_FIELDS = {
    'first_name': 'First Name',
    'last_name': 'Last Name',
    'email': 'Email',
    'status': 'Status'
};
```

---

## J1-B: AI Matching Bridge + HTML DOM Tests

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/aiMatching.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/aiMatching.html.test.js` | `_TEMPLATE_html.test.js` |

### Source Files to Read
- `src/pages/AI - Matching.rof4w.js` (page code — **bridge test source of truth**)
- `src/public/driver/AI_MATCHING.html` (HTML component — **HTML DOM test source of truth**)

### Page Code Config
```javascript
const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'AI - Matching.rof4w.js');
```

### Backend Imports to Verify
```javascript
const EXPECTED_IMPORTS = [
    "from 'backend/carrierMatching'",
    "from 'backend/mutualInterestService'",
    "from 'backend/aiEnrichment'",
    "from 'backend/driverProfiles'",
    "from 'backend/applicationService'",
    "from 'backend/ocrService'",
    "from 'backend/matchExplanationService'",
    "from 'backend/featureAdoptionService'"
];
```

### Mock Backend
```javascript
const mockBackend = {
    findMatchingCarriers: jest.fn().mockResolvedValue({ carriers: [], total: 0 }),
    getMutualInterestForDriver: jest.fn().mockResolvedValue({ interests: [] }),
    enrichCarrier: jest.fn().mockResolvedValue({ enriched: true }),
    getOrCreateDriverProfile: jest.fn().mockResolvedValue({ _id: 'drv-1', firstName: 'Test' }),
    submitApplication: jest.fn().mockResolvedValue({ success: true, id: 'app-1' }),
    getDriverApplications: jest.fn().mockResolvedValue({ applications: [] }),
    extractDocumentForAutoFill: jest.fn().mockResolvedValue({ fields: {} }),
    getMatchExplanationForDriver: jest.fn().mockResolvedValue({ explanation: 'Good match' }),
    logFeatureInteraction: jest.fn().mockResolvedValue(undefined),
    logMatchEvent: jest.fn().mockResolvedValue({ success: true }),
    setDiscoverability: jest.fn().mockResolvedValue({ success: true }),
    getDriverInterests: jest.fn().mockResolvedValue({ interests: [] }),
    updateDriverDocuments: jest.fn().mockResolvedValue({ success: true }),
    getDriverSavedCarriers: jest.fn().mockResolvedValue({ carriers: [] })
};
```

### Actions to Test (17 total)

| # | Action | Calls | Response | Validation |
|---|--------|-------|----------|------------|
| 1 | `ping` | none | `pong` | |
| 2 | `findMatches` | `findMatchingCarriers` + `getMutualInterestForDriver` | `matchResults` | |
| 3 | `logInterest` | `logMatchEvent` | `interestLogged` | requires: carrierDOT, carrierName |
| 4 | `retryEnrichment` | `enrichCarrier` | `enrichmentUpdate` | requires: dot_number |
| 5 | `checkUserStatus` | internal | `userStatusUpdate` | |
| 6 | `getDriverProfile` | `getOrCreateDriverProfile` | `driverProfileLoaded` | |
| 7 | `carrierMatchingReady` | multiple | `pageReady` | |
| 8 | `submitApplication` | `submitApplication` | `applicationSubmitted` | requires: carrierDOT |
| 9 | `saveProfileDocs` | `updateDriverDocuments` | `profileSaved` + `driverProfileLoaded` | |
| 10 | `extractDocumentOCR` | `extractDocumentForAutoFill` | `ocrResult` | requires: base64Data, docType |
| 11 | `getMatchExplanation` | `getMatchExplanationForDriver` | `matchExplanation` | requires: carrierDot |
| 12 | `getDriverApplications` | `getDriverApplications` | `driverApplications` | |
| 13 | `getMutualInterest` | `getMutualInterestForDriver` | `mutualInterestData` | |
| 14 | `logFeatureInteraction` | `logFeatureInteraction` | none (fire-and-forget) | |
| 15 | `navigateToSignup` | `wixUsers.promptLogin` | `loginSuccess` | |
| 16 | `navigateToLogin` | `wixUsers.promptLogin` | `loginSuccess` | |
| 17 | `navigateToSavedCarriers` | wixLocation.to | none | |

---

## J1-C: Driver Dashboard Bridge + HTML DOM Tests

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/driverDashboard.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/driverDashboard.html.test.js` | `_TEMPLATE_html.test.js` |

### Source Files to Read
- `src/pages/Driver Dashboard.ctupv.js` (bridge test)
- `src/public/driver/DRIVER_DASHBOARD.html` (HTML DOM test)

### Page Code Config
```javascript
const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'Driver Dashboard.ctupv.js');
```

### Mock Backend
```javascript
const mockBackend = {
    getDriverApplications: jest.fn().mockResolvedValue({ applications: [] }),
    withdrawApplication: jest.fn().mockResolvedValue({ success: true }),
    getOrCreateDriverProfile: jest.fn().mockResolvedValue({ _id: 'drv-1' }),
    getDriverProfileViews: jest.fn().mockResolvedValue({ views: [] }),
    getDriverStats: jest.fn().mockResolvedValue({ totalApps: 5 }),
    getConversation: jest.fn().mockResolvedValue({ messages: [] }),
    sendMessage: jest.fn().mockResolvedValue({ success: true }),
    markAsRead: jest.fn().mockResolvedValue(undefined),
    getNewMessages: jest.fn().mockResolvedValue({ messages: [] }),
    getUnreadCountForUser: jest.fn().mockResolvedValue({ count: 0 }),
    logFeatureInteraction: jest.fn().mockResolvedValue(undefined),
    setDiscoverability: jest.fn().mockResolvedValue({ success: true })
};
```

### Actions to Test (13 total)

| # | Action | Calls | Response | Validation |
|---|--------|-------|----------|------------|
| 1 | `ping` | none | `pong` | |
| 2 | `dashboardReady` | `getDriverApplications` + `getOrCreateDriverProfile` + `getDriverProfileViews` + `getDriverStats` | `dashboardData` + `viewsData` + `insightsData` | |
| 3 | `refreshDashboard` | same as dashboardReady | same | |
| 4 | `withdrawApplication` | `withdrawApplication` | `withdrawSuccess` | requires: carrierDOT |
| 5 | `getConversation` | `getConversation` | `conversationData` | requires: applicationId |
| 6 | `sendMessage` | `sendMessage` | `messageSent` | requires: applicationId, content |
| 7 | `markAsRead` | `markAsRead` | none (silent) | requires: applicationId |
| 8 | `getNewMessages` | `getNewMessages` | `newMessagesData` | requires: applicationId, sinceTimestamp |
| 9 | `getUnreadCount` | `getUnreadCountForUser` | `unreadCountData` | |
| 10 | `setDiscoverability` | `setDiscoverability` | none | requires: isDiscoverable |
| 11 | `logFeatureInteraction` | `logFeatureInteraction` | none | |
| 12 | `navigateToMatching` | wixLocation.to | none | |
| 13 | `navigateToMyCareer` | wixLocation.to | none | |

---

## J1-D: Quick Apply Bridge + HTML DOM Tests

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/quickApply.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/quickApply.html.test.js` | `_TEMPLATE_html.test.js` |

### Source Files to Read
- `src/pages/Quick Apply - Upload Your CDL & Resume.pa6f5.js` (bridge test)
- `src/public/landing/Quick Apply - Upload Your CDL & Resume.html` (HTML DOM test)

### Page Code Config
```javascript
const PAGE_FILE = path.resolve(
    __dirname, '..', '..', 'pages',
    'Quick Apply - Upload Your CDL & Resume.pa6f5.js'
);
```

### Actions to Test (12 total)

| # | Action | Response | Validation |
|---|--------|----------|------------|
| 1 | `ping` | `pong` | |
| 2 | `quickApplyReady` | `pageReady` | |
| 3 | `quickApplyFormReady` | `pageReady` | |
| 4 | `extractDocumentOCR` | `ocrResult` | requires: base64Data, docType |
| 5 | `uploadDocument` | `uploadSuccess` or `uploadError` | requires: docType, file object |
| 6 | `clearDocument` | `documentCleared` | requires: docType |
| 7 | `runOCR` | `ocrProcessing` then `ocrComplete` | requires: docType |
| 8 | `submitQuickApply` | `applicationSubmitted` + `submitResult` | |
| 9 | `navigateToMatching` | wixLocation.to | |
| 10 | `navigateToDashboard` | wixLocation.to | |
| 11 | `checkUserStatus` | `userStatusUpdate` | |
| 12 | `getProfile` | `profileLoaded` | |

### Acceptance Criteria for J1
- [ ] `seedDriverProfiles.jsw` seeds 10 records through dual-source pipeline
- [ ] `driverProfilesConnectionTest.jsw` passes all 4 phases
- [ ] `aiMatching.bridge.test.js` tests all 17 actions + error cases
- [ ] `aiMatching.html.test.js` tests DOM rendering for key inbound messages (matchResults, pageReady, driverProfileLoaded)
- [ ] `driverDashboard.bridge.test.js` tests all 13 actions + error cases
- [ ] `driverDashboard.html.test.js` tests DOM rendering (dashboardData, conversationData, withdrawSuccess, viewsData)
- [ ] `quickApply.bridge.test.js` tests all 12 actions + error cases
- [ ] `quickApply.html.test.js` tests DOM rendering (pageReady, ocrResult, applicationSubmitted)
- [ ] `npm test` passes with no failures
- [ ] Committed with descriptive message

---

# JUNIOR 2 (J2): Carrier Matching & Recruiter Portal

## J2-A: Carrier Matching Seed + Connection Test

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/backend/seeds/seedCarrierMatching.jsw` | `_TEMPLATE_seed.jsw` |
| 2 | `src/backend/tests/carrierMatchingConnectionTest.jsw` | `_TEMPLATE_connectionTest.jsw` |

### Collection Keys
| Key | Expected Airtable Table |
|-----|------------------------|
| `carriers` | `v2_Carriers` |
| `carrierEnrichments` | `v2_Carrier_Enrichments` |
| `carrierHiringPreferences` | `v2_Carrier_Hiring_Preferences` |
| `matchEvents` | `v2_Match_Events` |
| `driverCarrierInterests` | `v2_Driver_Carrier_Interests` |

### Seed Data Requirements
- 5 carriers with varying DOT numbers, safety ratings, fleet sizes
- 3 carrier enrichments (linked to carrier DOTs)
- 5 hiring preferences (linked to carrier DOTs)
- 5 match events (driver-carrier pairs)
- 5 mutual interests

**Edge cases:**
- 1 carrier with CONDITIONAL safety rating
- 1 carrier with no enrichment data
- 1 match event with `status: 'expired'`

---

## J2-B: Recruiter Console Bridge + HTML DOM Tests

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/recruiterConsole.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/recruiterConsole.html.test.js` | `_TEMPLATE_html.test.js` |

### Source Files to Read
- `src/pages/Recruiter Console.zriuj.js` (bridge test)
- `src/public/recruiter/RecruiterDashboard.html` (HTML DOM test)

### Page Code Config
```javascript
const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'Recruiter Console.zriuj.js');
```

### Backend Imports to Verify
```javascript
const EXPECTED_IMPORTS = [
    "from 'backend/recruiter_service'",
    "from 'backend/interviewScheduler'",
    "from 'backend/messaging'",
    "from 'backend/featureAdoptionService'",
    "from 'backend/driverMatching'",
    "from 'backend/driverOutreach'",
    "from 'backend/savedSearchService'",
    "from 'backend/callOutcomeService'",
    "from 'backend/interventionService'",
    "from 'backend/pipelineAutomationService'",
    "from 'backend/recruiterHealthService'"
];
```

### Actions to Test (44 total — this is the largest page)

**NOTE:** This page has the most actions in the system. Group your tests by feature area:

**Core Recruiter (8 actions)**
| Action | Response | Validation |
|--------|----------|------------|
| `ping` | `pong` | |
| `recruiterDashboardReady` | `recruiterReady` | |
| `validateCarrier` | `carrierValidated` | requires: carrierDOT |
| `addCarrier` | `carrierAdded` | requires: carrierDOT |
| `removeCarrier` | `carrierRemoved` | requires: carrierDOT |
| `switchCarrier` | `carrierSwitched` | requires: carrierDOT |
| `getCarriers` | `carriersLoaded` | |
| `getStats` | `statsLoaded` | |

**Pipeline Management (4 actions)**
| Action | Response | Validation |
|--------|----------|------------|
| `getPipeline` | `pipelineLoaded` | |
| `updateCandidateStatus` | `statusUpdated` | requires: interestId, newStatus |
| `getCandidateDetails` | `candidateDetails` | requires: interestId |
| `addNotes` | `notesAdded` | requires: interestId, notes |

**Messaging (5 actions)**
| Action | Response | Validation |
|--------|----------|------------|
| `sendMessage` | `messageSent` | requires: applicationId, content, receiverId |
| `getConversation` | `conversationData` | requires: applicationId |
| `markAsRead` | none | requires: applicationId |
| `getNewMessages` | `newMessagesData` | requires: applicationId, sinceTimestamp |
| `getUnreadCount` | `unreadCountData` | |

**Driver Search (8 actions)**
| Action | Response | Validation |
|--------|----------|------------|
| `driverSearchReady` | `driverSearchInit` + `recruiterProfile` | |
| `searchDrivers` | `searchDriversResult` | |
| `viewDriverProfile` | `viewDriverProfileResult` | requires: driverId |
| `saveDriver` | `saveDriverResult` | requires: driverId |
| `contactDriver` | `contactDriverResult` | requires: driverId, message |
| `getQuotaStatus` | `getQuotaStatusResult` | |
| `getWeightPreferences` | `getWeightPreferencesResult` | |
| `saveWeightPreferences` | `saveWeightPreferencesResult` | requires: weight preferences |

**Saved Searches (5 actions)**
| Action | Response | Validation |
|--------|----------|------------|
| `saveSearch` | `saveSearchResult` | |
| `loadSavedSearches` | `savedSearchesLoaded` | |
| `runSavedSearch` | `savedSearchExecuted` | requires: searchId |
| `deleteSavedSearch` | `savedSearchDeleted` | requires: searchId |
| `updateSavedSearch` | `savedSearchUpdated` | requires: searchId |

**Call Tracking (4 actions)**
| Action | Response | Validation |
|--------|----------|------------|
| `logCallOutcome` | `callOutcomeLogged` | |
| `getCallAnalytics` | `callAnalyticsLoaded` | |
| `getRecentCalls` | `recentCallsLoaded` | |
| `getDriverCallHistory` | `driverCallHistoryLoaded` | requires: driverId |

**Interventions (6 actions)**
| Action | Response | Validation |
|--------|----------|------------|
| `getInterventionTemplates` | `interventionTemplatesLoaded` | |
| `sendIntervention` | `interventionSent` | requires: templateId, driverId |
| `saveTemplate` | `templateSaved` | |
| `deleteTemplate` | `templateDeleted` | requires: templateId |
| `logInterventionOutcome` | `interventionOutcomeLogged` | requires: interventionId, outcome |
| `getDriverInterventions` | `driverInterventionsLoaded` | requires: driverId |

**Automation (6 actions)**
| Action | Response | Validation |
|--------|----------|------------|
| `getAutomationRules` | `automationRulesLoaded` | |
| `createAutomationRule` | `automationRuleCreated` | |
| `updateAutomationRule` | `automationRuleUpdated` | requires: ruleId |
| `deleteAutomationRule` | `automationRuleDeleted` | requires: ruleId |
| `toggleRuleStatus` | `automationRuleToggled` | requires: ruleId, isActive |
| `getAutomationLog` | `automationLogLoaded` | |

**System (2 actions)**
| Action | Response | Validation |
|--------|----------|------------|
| `getSystemHealth` | `systemHealthUpdate` | |
| `logFeatureInteraction` | none | |

---

## J2-C: Recruiter Driver Search Bridge + HTML DOM Tests

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/recruiterDriverSearch.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/recruiterDriverSearch.html.test.js` | `_TEMPLATE_html.test.js` |

### Source Files to Read
- `src/pages/RECRUITER DRIVER SEARCH.qtecw.js` (bridge test)
- `src/public/recruiter/RECRUITER_DRIVER_SEARCH.html` (HTML DOM test)

### Page Code Config
```javascript
const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'RECRUITER DRIVER SEARCH.qtecw.js');
```

### Actions to Test (8 total)

| # | Action | Calls | Response | Validation |
|---|--------|-------|----------|------------|
| 1 | `searchDrivers` | `findMatchingDrivers` | `searchDriversResult` | |
| 2 | `viewDriverProfile` | `getDriverProfile` | `viewDriverProfileResult` | requires: driverId |
| 3 | `saveDriver` | `saveDriverToPipeline` | `saveDriverResult` | requires: driverId |
| 4 | `contactDriver` | `sendMessageToDriver` | `contactDriverResult` | requires: driverId, message |
| 5 | `getQuotaStatus` | `getUsageStats` + `getSubscription` | `getQuotaStatusResult` | |
| 6 | `driverSearchReady` | `getUsageStats` + `getSubscription` | `getQuotaStatusResult` | |
| 7 | `getWeightPreferences` | `getWeightPreferences` | `loadWeightPreferences` | |
| 8 | `saveWeightPreferences` | `saveWeightPreferences` | `savePreferencesResult` | requires: weights |

### Acceptance Criteria for J2
- [ ] `seedCarrierMatching.jsw` seeds 5 carriers + related records
- [ ] `carrierMatchingConnectionTest.jsw` passes all 4 phases for all 5 collections
- [ ] `recruiterConsole.bridge.test.js` tests all 44 actions grouped by feature area
- [ ] `recruiterConsole.html.test.js` tests DOM rendering for key inbound messages (recruiterReady, pipelineLoaded, statsLoaded, conversationData)
- [ ] `recruiterDriverSearch.bridge.test.js` tests all 8 actions
- [ ] `recruiterDriverSearch.html.test.js` tests DOM rendering (searchDriversResult, viewDriverProfileResult, getQuotaStatusResult)
- [ ] Error case tests for every action that calls a backend method
- [ ] `npm test` passes with no failures
- [ ] Committed with descriptive message

---

# JUNIOR 3 (J3): Subscriptions, Payments & Messaging

## J3-A: Subscription/Stripe Seed + Connection Test

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/backend/seeds/seedSubscriptions.jsw` | `_TEMPLATE_seed.jsw` |
| 2 | `src/backend/tests/subscriptionConnectionTest.jsw` | `_TEMPLATE_connectionTest.jsw` |

### Collection Keys
| Key | Expected Airtable Table |
|-----|------------------------|
| `carrierSubscriptions` | `v2_Carrier_Subscriptions` |
| `profileViews` | `v2_Profile_Views` |
| `billingHistory` | `v2_Billing_History` |
| `stripeEvents` | `v2_Stripe_Events` |
| `messages` | `v2_Messages` |

### Seed Data Requirements
- 3 carrier subscriptions (pro, enterprise, expired)
- 5 profile views (linked to carrier DOTs)
- 3 billing history records
- 2 stripe events (payment_succeeded, subscription_created)
- 5 messages (2 conversations between different driver-carrier pairs)

**Edge cases:**
- 1 expired subscription
- 1 billing record with refund status
- 1 message with empty content (edge case)

---

## J3-B: Checkout Bridge + HTML DOM Tests

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/checkout.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/checkout.html.test.js` | `_TEMPLATE_html.test.js` |

### Source Files to Read
- `src/pages/Checkout.kbyzk.js` (bridge test)
- `src/public/utility/STRIPE_PAYMENT_ELEMENT.html` (HTML DOM test)

### Page Code Config
```javascript
const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'Checkout.kbyzk.js');
```

### Mock Backend
```javascript
const mockBackend = {
    getLeadDetails: jest.fn().mockResolvedValue({
        _id: 'lead-1', companyName: 'Test Carrier', driverCount: 5
    }),
    getPublishableKey: jest.fn().mockResolvedValue('pk_test_123'),
    createPlacementDepositCheckout: jest.fn().mockResolvedValue({
        sessionId: 'cs_test_456'
    })
};
```

### Actions to Test (1 primary + validation cases)

| # | Action | Calls | Response |
|---|--------|-------|----------|
| 1 | `checkoutReady` | `getLeadDetails` + `getPublishableKey` + `createPlacementDepositCheckout` | `initCheckout` with publishableKey, sessionId, driverCount, formattedAmount |

**Validation tests:**
- Missing leadId → error handling
- Lead not found → error handling
- Publishable key failure → error propagation
- Session creation failure → error propagation

---

## J3-C: Subscription Success Bridge + HTML DOM Tests

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/subscriptionSuccess.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/subscriptionSuccess.html.test.js` | `_TEMPLATE_html.test.js` |

### Source Files to Read
- `src/pages/Subscription Success.o76p8.js` (bridge test)
- `src/public/utility/Subscription_Success.html` (HTML DOM test)

### Page Code Config
```javascript
const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'Subscription Success.o76p8.js');
```

### Mock Backend
```javascript
const mockBackend = {
    getCheckoutSession: jest.fn().mockResolvedValue({
        sessionId: 'cs_test_123',
        plan: 'enterprise',
        amountPaid: 49900,
        customerEmail: 'test@carrier.com',
        companyName: 'Test Carrier LLC'
    })
};
```

### Actions to Test (5 total)

| # | Action | Calls | Response |
|---|--------|-------|----------|
| 1 | `getSubscriptionSuccessData` | `getCheckoutSession` | `subscriptionSuccessData` |
| 2 | `subscriptionSuccess` | analytics tracking | none |
| 3 | `redirectToSetup` | wixLocation.to | `/carrier-welcome?plan=enterprise` |
| 4 | `redirectToDashboard` | wixLocation.to | `/recruiter-console` |
| 5 | `redirectToDriverSearch` | wixLocation.to | `/recruiter-driver-search` |

**Validation tests:**
- Missing sessionId → graceful handling with null sessionData
- Plan determination fallback to 'pro'

### Acceptance Criteria for J3
- [ ] `seedSubscriptions.jsw` seeds records across all 5 collections
- [ ] `subscriptionConnectionTest.jsw` passes all 4 phases
- [ ] `checkout.bridge.test.js` tests checkout flow + all 4 validation cases
- [ ] `checkout.html.test.js` tests DOM rendering (initCheckout with Stripe elements)
- [ ] `subscriptionSuccess.bridge.test.js` tests all 5 actions + validation
- [ ] `subscriptionSuccess.html.test.js` tests DOM rendering (subscriptionSuccessData, plan display, navigation buttons)
- [ ] `npm test` passes with no failures
- [ ] Committed with descriptive message

---

# Shared Rules (All Juniors)

## Naming Conventions
| Type | Pattern | Example |
|------|---------|---------|
| Seed file | `seed{Domain}.jsw` | `seedDriverProfiles.jsw` |
| Connection test | `{domain}ConnectionTest.jsw` | `driverProfilesConnectionTest.jsw` |
| Bridge test | `{pageName}.bridge.test.js` | `aiMatching.bridge.test.js` |
| HTML DOM test | `{pageName}.html.test.js` | `aiMatching.html.test.js` |

## Commit Message Format
```
feat(wave1): Add verification for {ServiceName}

- Seed data: {N} records across {M} collections
- Connection test: 4-phase Airtable CRUD verification
- Bridge test: {N} actions tested with error cases

Co-Authored-By: {Your Name}
```

## Definition of Done
1. All test files pass: `npm test`
2. Seed files are idempotent (safe to run twice)
3. Connection tests clean up after themselves (no orphaned records)
4. Bridge tests cover every action in the routeMessage switch
5. Bridge tests include error cases for every backend call
6. HTML DOM tests verify DOM rendering for every inbound message type
7. HTML DOM tests verify outbound ready signal and error display
8. No hardcoded Airtable table names (always use config.jsw helpers)
9. Code committed to a feature branch: `wave1/{junior-name}/{domain}`

## Questions?
Escalate to the senior review team. Do NOT guess at field names or collection keys — read `config.jsw` and the backend service file.
