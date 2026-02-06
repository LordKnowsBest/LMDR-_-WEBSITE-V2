# Wave 8 Task Cards — Carrier Comms & Onboarding

**Timeline:** Week 17
**Juniors:** J2, J3

---

## Wave 8 Key Notes

- **All pages use `type` key** protocol — HTML DOM tests must use `MESSAGE_KEY = 'type'`
- **RECRUITER_ONBOARDING_DASHBOARD** has a unique `MESSAGE_REGISTRY` validation pattern
- `carrierAnnouncementsService.jsw` is the gold-standard dual-source implementation (original reference pattern)
- Multiple Wave 8 services (`carrierLeadsService`, `onboardingWorkflowService`, `documentCollectionService`, `interviewScheduler`, `recruiter_service`) have **extensive direct wixData calls**
- Existing test: `recruiterOnboarding.test.js` (bridge test exists)
- **Templates:** `_TEMPLATE_seed.jsw`, `_TEMPLATE_connectionTest.jsw`, `_TEMPLATE_bridge.test.js`, `_TEMPLATE_html.test.js`

---

# JUNIOR 2 (J2): Carrier Announcements & Policies

## J2-A: Carrier Comms Seed + Connection Test

### Deliverables
| # | File |
|---|------|
| 1 | `src/backend/seeds/seedCarrierComms.jsw` |
| 2 | `src/backend/tests/carrierCommsConnectionTest.jsw` |

### Collection Keys
| Key | Expected Airtable Table |
|-----|------------------------|
| `carrierAnnouncements` | `v2_Carrier_Announcements` |
| `announcementReadReceipts` | `v2_Announcement_Read_Receipts` |
| `announcementComments` | `v2_Announcement_Comments` |
| `carrierNotificationSettings` | `v2_Carrier_Notification_Settings` |
| `driverNotificationPreferences` | `v2_Driver_Notification_Preferences` |
| `policyDocuments` | `v2_Policy_Documents` |
| `policyAcknowledgments` | `v2_Policy_Acknowledgments` |

### Seed Data
- 5 announcements (published, draft, scheduled, archived, urgent)
- 10 read receipts, 5 comments, 2 notification settings, 3 driver prefs
- 3 policy documents (active, draft, archived), 5 acknowledgments

## J2-B: Carrier Announcements Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/carrierAnnouncements.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/carrierAnnouncements.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/CARRIER_ANNOUNCEMENTS.zmhem.js` — `{ type, data, timestamp }` envelope

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | `carrierAnnouncementsReady` | sends `carrierContext` | — |
| 2 | `getCarrierAnnouncements` | `getAnnouncementsForCarrier(carrierId, options)` | `carrierAnnouncementsData` |
| 3 | `createAnnouncement` | `createAnnouncement(data)` | `announcementActionResult` |
| 4 | `updateAnnouncement` | `updateAnnouncement(id, updates)` | `announcementActionResult` |
| 5 | `publishAnnouncement` | `publishAnnouncement(id)` | `announcementActionResult` |
| 6 | `scheduleAnnouncement` | `scheduleAnnouncement(id, scheduledAt)` | `announcementActionResult` |
| 7 | `archiveAnnouncement` | `archiveAnnouncement(id)` | `announcementActionResult` |
| 8 | `previewRecipients` | `previewRecipients(carrierId, audience)` | `recipientPreviewResult` |
| 9 | `uploadAnnouncementAttachment` | `uploadAttachment(base64, fileName, mime, carrierId)` | `announcementAttachmentResult` |
| 10 | `getAnnouncementDetail` | `getAnnouncementDetail(id, carrierId, options)` | `announcementDetailData` |
| 11 | `sendAnnouncementReminder` | `sendReminderToUnreadDrivers(id, carrierId)` | `announcementReminderResult` |
| 12 | `setAnnouncementCommentVisibility` | `setCommentVisibility(commentId, hidden)` | `announcementCommentModerationResult` |

## J2-C: Carrier Policies Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/carrierPolicies.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/carrierPolicies.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/CARRIER_POLICIES.m76is.js` — `{ type, data, timestamp }` envelope

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | `carrierPoliciesReady` | sends `carrierContext` | — |
| 2 | `getCarrierPolicies` | `getPoliciesForCarrier(carrierId, options)` | `carrierPoliciesData` |
| 3 | `createPolicy` | `createPolicy(data)` | `policyActionResult` |
| 4 | `updatePolicy` | `updatePolicy(policyId, updates)` | `policyActionResult` |
| 5 | `publishPolicyVersion` | `publishPolicyVersion(policyId, changeSummary)` | `policyActionResult` |
| 6 | `archivePolicy` | `archivePolicy(policyId)` | `policyActionResult` |
| 7 | `uploadPolicyFile` | `uploadPolicyFile(base64, fileName, mime, carrierId)` | `policyUploadResult` |
| 8 | `getComplianceStatus` | `getComplianceStatus(carrierId)` | `complianceStatusData` |

## J2-D: Driver Announcements Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/driverAnnouncements.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/driverAnnouncements.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/DRIVER_ANNOUNCEMENTS.jgkc4.js` — `{ type, data, timestamp }` envelope

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | `driverAnnouncementsReady` | sends `driverContext` | — |
| 2 | `getDriverAnnouncements` | `getAnnouncementsForDriver(driverId, carrierId, options)` | `driverAnnouncementsData` |
| 3 | `markAnnouncementRead` | `markAnnouncementRead(id, driverId, deviceType, timeSpent)` | silent |
| 4 | `addAnnouncementComment` | `addComment(id, driverId, commentText)` | `announcementCommentResult` |

## J2-E: Driver Policies Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/driverPolicies.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/driverPolicies.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/DRIVER_POLICIES.mbmmh.js` — `{ type, data }` envelope

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | `driverPoliciesReady` | sends `driverContext` | — |
| 2 | `getDriverPolicies` | `getPoliciesForDriver(driverId, carrierId)` | `driverPoliciesData` |
| 3 | `getPolicyContent` | `getPolicyContent(policyId)` | `policyContentData` |
| 4 | `acknowledgePolicy` | `acknowledgePolicy(policyId, driverId, sigType, ip, device)` | `policyAcknowledgeResult` |

### J2 Acceptance Criteria
- [ ] `seedCarrierComms.jsw` seeds across 7 collections
- [ ] `carrierCommsConnectionTest.jsw` passes all 4 phases
- [ ] 4 new bridge tests: carrierAnnouncements (12), carrierPolicies (8), driverAnnouncements (4), driverPolicies (4)
- [ ] 4 new HTML DOM tests: `carrierAnnouncements.html.test.js`, `carrierPolicies.html.test.js`, `driverAnnouncements.html.test.js`, `driverPolicies.html.test.js`
- [ ] HTML DOM tests verify rendering for announcement lists, policy lists, read receipts, acknowledgment flows
- [ ] All use `type` protocol with appropriate envelope

---

# JUNIOR 3 (J3): Onboarding & Carrier Welcome

## J3-A: Onboarding Seed + Connection Test

### Deliverables
| # | File |
|---|------|
| 1 | `src/backend/seeds/seedOnboarding.jsw` |
| 2 | `src/backend/tests/onboardingConnectionTest.jsw` |

### Collection Keys
| Key | Expected Airtable Table |
|-----|------------------------|
| `onboardingWorkflows` | `v2_Onboarding_Workflows` |
| `documentRequests` | `v2_Document_Requests` |
| `qualificationFiles` | `v2_Qualification_Files` |
| `interviews` | `v2_Interviews` |
| `recruiterProfiles` | `v2_Recruiter_Profiles` |
| `recruiterCarriers` | `v2_Recruiter_Carriers` |
| `checkoutAbandonment` | `v2_Checkout_Abandonment` |
| `abandonmentEmailLog` | `v2_Abandonment_Email_Log` |
| `carrierStaffingRequests` | `v2_Carrier_Staffing_Requests` |

**WARNING:** `onboardingWorkflowService`, `documentCollectionService`, `interviewScheduler`, `recruiter_service` all have **extensive direct wixData calls**. These are the most inconsistent services in the codebase for dual-source routing. Document thoroughly for final review.

### Seed Data
- 3 onboarding workflows (in_progress, completed, on_hold)
- 5 document requests, 3 qualification files
- 3 interviews (scheduled, confirmed, completed)
- 2 recruiter profiles, 3 recruiter-carrier links
- 3 checkout abandonments, 5 abandonment email logs, 3 staffing requests

## J3-B: Review Existing Recruiter Onboarding Bridge Test

### Source: `src/pages/RECRUITER_ONBOARDING_DASHBOARD.gebww.js`
**Existing test: `recruiterOnboarding.test.js`**

This page uses `type` key with `MESSAGE_REGISTRY` validation. Review the existing test and verify all 11 actions are covered:

| # | Type | Response |
|---|------|----------|
| 1 | `onboardingDashboardReady` | `initOnboardingDashboard` |
| 2 | `getWorkflows` | `workflowList` |
| 3 | `getDocumentDetails` | `documentDetails` |
| 4 | `verifyDocument` | `actionResult` |
| 5 | `rejectDocument` | `actionResult` |
| 6 | `sendReminder` | `actionResult` |
| 7 | `cancelWorkflow` | `actionResult` |
| 8 | `putOnHold` | `actionResult` |
| 9 | `resumeWorkflow` | `actionResult` |
| 10 | `markStarted` | `actionResult` |
| 11 | `navigateTo` | wixLocation |

## J3-C: Carrier Welcome Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/carrierWelcome.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/carrierWelcome.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/Carrier Welcome.gnhma.js` — `{ type, data }` envelope

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | init | `getCarrierByDOT(dotNumber)` | `carrierWelcomeData` (plan, dot, name, email, company, city, state, fleet) |
| 2 | `navigateToIntake` | wixLocation | `/trucking-companies?dot={dot}` |
| 3 | `navigateToPreferences` | wixLocation | `/recruiter-console?tab=settings` |
| 4 | `navigateToDashboard` | wixLocation | `/recruiter-console` |
| 5 | `navigateToDriverSearch` | wixLocation | `/recruiter-driver-search` |

### J3 Acceptance Criteria
- [ ] `seedOnboarding.jsw` seeds across 9 collections
- [ ] `onboardingConnectionTest.jsw` passes all 4 phases
- [ ] Existing `recruiterOnboarding.test.js` reviewed — all 11 actions verified
- [ ] `recruiterOnboarding.html.test.js` tests DOM rendering (initOnboardingDashboard, workflowList, documentDetails, actionResult)
- [ ] `carrierWelcome.bridge.test.js` tests 5 actions
- [ ] `carrierWelcome.html.test.js` tests DOM rendering (carrierWelcomeData with plan, company, fleet display)
- [ ] Direct wixData call inventory documented for final review

---

# Final Delivery Summary

After Wave 8 completion, the Universal Pipeline Verification System covers:

| Metric | Count |
|--------|-------|
| Seed files | ~15 |
| Connection tests | ~15 |
| Bridge tests (page code side) | ~45 |
| HTML DOM tests (HTML component side) | ~45 |
| Total test actions covered | ~300+ |
| Airtable collections verified | 160+ |
| Backend services covered | 108 |
| Pages verified (both sides of bridge) | 80+ |

Services flagged for dual-source routing cleanup:
- `aiRouterService.jsw` (Wave 2)
- `carrierLeadsService.jsw` (Wave 8)
- `onboardingWorkflowService.jsw` (Wave 8)
- `documentCollectionService.jsw` (Wave 8)
- `interviewScheduler.jsw` (Wave 8)
- `recruiter_service.jsw` (Wave 8)
- `driverOutreach.jsw` (Wave 6)
- Various compliance services (Wave 5)
