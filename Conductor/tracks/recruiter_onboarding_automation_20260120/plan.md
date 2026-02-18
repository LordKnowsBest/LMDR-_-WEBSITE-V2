# Track Plan: Recruiter Onboarding Automation

> **TDD REQUIRED**: Every implementation task is preceded by a test task. Write tests first, then implement.

---

## Phase 1: Document Collection Workflow (Foundation)

This phase establishes the core document collection infrastructure that all other phases depend on.

### 1.1 Data Model & Collections

- [ ] Task: Create `OnboardingWorkflows` collection in Wix with schema from spec
- [ ] Task: Create `DocumentRequests` collection in Wix with schema from spec
- [ ] Task: Create indexes for `OnboardingWorkflows` (driver_id, carrier_id, status, recruiter_id)
- [ ] Task: Create indexes for `DocumentRequests` (workflow_id, status, document_type)
- [ ] Task: Extend `DriverProfiles` collection with onboarding fields (onboarding_status, active_workflow_id, documents_upload_token)
- [ ] Task: Extend `Carriers` collection with onboarding_config object
- [ ] Task: Conductor - Verify Phase 1.1 Collections

### 1.2 Onboarding Workflow Service Tests (RED)

- [x] Task: Write `onboardingWorkflowService.test.js` - tests for `createOnboardingWorkflow()`
- [ ] Task: Write tests for `getWorkflowStatus()` - retrieve full workflow with sub-statuses
- [ ] Task: Write tests for `getActiveWorkflows()` - filtering by recruiter, carrier, status
- [ ] Task: Write tests for `updateWorkflowStatus()` - state machine transitions
- [ ] Task: Write tests for `cancelWorkflow()` - cancellation with cleanup
- [ ] Task: Write tests for `getComplianceChecklist()` - requirement aggregation
- [ ] Task: Write tests for authorization (recruiter access, carrier access)
- [ ] Task: Run tests - verify all fail (RED phase complete)

### 1.3 Onboarding Workflow Service Implementation (GREEN)

- [x] Task: Create `src/backend/onboardingWorkflowService.jsw`
- [x] Task: Implement `createOnboardingWorkflow()` - make tests pass
- [x] Task: Implement `getWorkflowStatus()` - make tests pass
- [x] Task: Implement `getActiveWorkflows()` - make tests pass
- [x] Task: Implement `updateWorkflowStatus()` - make tests pass
- [x] Task: Implement `cancelWorkflow()` - make tests pass
- [x] Task: Implement `getComplianceChecklist()` - make tests pass
- [x] Task: Implement authorization middleware
- [ ] Task: Verify all tests pass (GREEN phase complete)
- [ ] Task: Verify coverage >90% for onboardingWorkflowService.jsw

### 1.4 Document Collection Service Tests (RED)

- [x] Task: Write `documentCollectionService.test.js` - tests for `requestDocuments()`
- [ ] Task: Write tests for `getDocumentStatus()` - retrieve all documents for workflow
- [ ] Task: Write tests for `uploadDocument()` - secure token validation, file handling
- [ ] Task: Write tests for `verifyDocument()` - recruiter verification flow
- [ ] Task: Write tests for `sendDocumentReminder()` - reminder sequencing
- [ ] Task: Write tests for `checkDocumentExpiration()` - expiration detection
- [ ] Task: Write tests for invalid token handling
- [ ] Task: Write tests for file type validation
- [ ] Task: Run tests - verify all fail (RED phase complete)

### 1.5 Document Collection Service Implementation (GREEN)

- [x] Task: Create `src/backend/documentCollectionService.jsw`
- [x] Task: Implement `requestDocuments()` - make tests pass
- [x] Task: Implement `getDocumentStatus()` - make tests pass
- [x] Task: Implement `uploadDocument()` with token validation - make tests pass
- [x] Task: Implement `verifyDocument()` - make tests pass
- [x] Task: Implement `sendDocumentReminder()` - make tests pass
- [x] Task: Implement `checkDocumentExpiration()` - make tests pass
- [x] Task: Implement secure upload token generation (UUID + expiry)
- [ ] Task: Verify all tests pass (GREEN phase complete)
- [ ] Task: Verify coverage >90% for documentCollectionService.jsw

### 1.6 OCR Integration for CDL Verification

- [ ] Task: Write tests for CDL OCR extraction (using existing ocrService.jsw)
- [x] Task: Implement `extractCdlData()` - extract name, DOB, license number, class, endorsements, expiration
- [x] Task: Implement auto-verification logic (match extracted data to driver profile)
- [x] Task: Add OCR trigger on CDL document upload
- [ ] Task: Verify OCR tests pass

### 1.7 Document Upload Portal (Frontend)

- [x] Task: Create `src/public/driver/DRIVER_DOCUMENT_UPLOAD.html`
- [x] Task: Build document checklist UI with status indicators
- [x] Task: Build drag-and-drop file upload component
- [x] Task: Implement file preview before upload
- [x] Task: Implement progress indicators for upload
- [x] Task: Add "How to get this document" help links
- [x] Task: Wire up postMessage handlers to backend
- [x] Task: Add mobile-responsive design

### 1.8 Recruiter Onboarding Dashboard (Frontend)

- [x] Task: Create `src/public/recruiter/RECRUITER_ONBOARDING_DASHBOARD.html`
- [x] Task: Build workflow list view with filters
- [x] Task: Build individual workflow detail view
- [x] Task: Build document status panel with verify/reject actions
- [x] Task: Add reminder send buttons
- [x] Task: Wire up postMessage handlers to backend

### 1.9 Notification Integration

- [ ] Task: Create email template for document request
- [ ] Task: Create SMS template for document reminder
- [x] Task: Implement scheduled job for auto-reminders (day 2, 5, 7)
- [x] Task: Add reminder job to `jobs.config`

### 1.10 Phase 1 Integration Tests

- [ ] Task: Write E2E test: Create workflow -> request documents -> driver uploads -> recruiter verifies
- [ ] Task: Write E2E test: Reminder sequence (2 days, 5 days, 7 days)
- [ ] Task: Write E2E test: OCR auto-verification of CDL
- [ ] Task: Run integration tests - verify all pass
- [ ] Task: Conductor - Verify Phase 1 Document Collection Complete

---

## Phase 2: Offer Letter Generator (High Value)

This phase delivers immediate value by automating offer letter creation and e-signature.

### 2.1 Offer Letter Data Model

- [ ] Task: Create `OfferLetters` collection in Wix with schema from spec
- [ ] Task: Create indexes for `OfferLetters` (workflow_id, carrier_id, status, template_name)
- [ ] Task: Conductor - Verify Phase 2.1 Collections

### 2.2 Offer Letter Service Tests (RED)

- [ ] Task: Write `offerLetterService.test.js` - tests for `generateOfferLetter()`
- [ ] Task: Write tests for `getOfferLetterTemplates()` - retrieve carrier templates
- [ ] Task: Write tests for `saveOfferLetterTemplate()` - CRUD for templates
- [ ] Task: Write tests for `submitOfferForApproval()` - approval workflow
- [ ] Task: Write tests for `approveOffer()` - approval action
- [ ] Task: Write tests for `sendOfferLetter()` - email and e-sign delivery
- [ ] Task: Write tests for `getOfferStatus()` - status and history
- [ ] Task: Write tests for variable substitution (pay rate, start date, etc.)
- [ ] Task: Write tests for PDF generation
- [ ] Task: Run tests - verify all fail (RED phase complete)

### 2.3 Offer Letter Service Implementation (GREEN)

- [ ] Task: Create `src/backend/offerLetterService.jsw`
- [ ] Task: Implement `generateOfferLetter()` - template merge + PDF generation
- [ ] Task: Implement `getOfferLetterTemplates()` - make tests pass
- [ ] Task: Implement `saveOfferLetterTemplate()` - make tests pass
- [ ] Task: Implement `submitOfferForApproval()` - make tests pass
- [ ] Task: Implement `approveOffer()` - make tests pass
- [ ] Task: Implement `sendOfferLetter()` with email delivery - make tests pass
- [ ] Task: Implement `getOfferStatus()` - make tests pass
- [ ] Task: Implement variable substitution engine
- [ ] Task: Integrate with PDF generation library (jsPDF or wkhtmltopdf)
- [ ] Task: Verify all tests pass (GREEN phase complete)
- [ ] Task: Verify coverage >90% for offerLetterService.jsw

### 2.4 E-Signature Integration (DocuSign)

- [ ] Task: Add DocuSign API credentials to Wix Secrets Manager
- [ ] Task: Write tests for DocuSign envelope creation
- [ ] Task: Write tests for DocuSign webhook handling
- [ ] Task: Implement `createDocuSignEnvelope()` - create and send envelope
- [ ] Task: Implement DocuSign webhook handler in `http-functions.js`
- [ ] Task: Implement `processEsignWebhook()` - update offer status on signing events
- [ ] Task: Implement `getSignedOffer()` - retrieve signed document
- [ ] Task: Verify e-signature tests pass with DocuSign sandbox

### 2.5 E-Signature Integration (HelloSign Alternative)

- [ ] Task: Add HelloSign API credentials to Wix Secrets Manager
- [ ] Task: Implement `createHelloSignRequest()` as alternative provider
- [ ] Task: Implement HelloSign webhook handler
- [ ] Task: Make provider configurable per carrier

### 2.6 Offer Letter Generator UI

- [ ] Task: Create `src/public/recruiter/RECRUITER_OFFER_GENERATOR.html`
- [ ] Task: Build template selection panel
- [ ] Task: Build offer details form (pay, bonus, start date, benefits)
- [ ] Task: Build live preview panel
- [ ] Task: Build approval workflow UI (if required)
- [ ] Task: Build delivery method selection (email vs e-sign)
- [ ] Task: Wire up postMessage handlers to backend

### 2.7 Offer Letter Template Management UI

- [ ] Task: Add template management section to Recruiter Dashboard
- [ ] Task: Build template editor with variable placeholders
- [ ] Task: Build template preview
- [ ] Task: Build template version history

### 2.8 Phase 2 Integration Tests

- [ ] Task: Write E2E test: Generate offer -> approval -> DocuSign -> signed
- [ ] Task: Write E2E test: Generate offer -> direct email -> manual signature
- [ ] Task: Write E2E test: Offer expiration handling
- [ ] Task: Run integration tests - verify all pass
- [ ] Task: Conductor - Verify Phase 2 Offer Letter Generator Complete

---

## Phase 3: Orientation Scheduler

This phase adds calendar-based orientation booking for drivers.

### 3.1 Orientation Data Model

- [ ] Task: Create `OrientationSlots` collection in Wix with schema from spec
- [ ] Task: Create indexes for `OrientationSlots` (carrier_id, session_date, is_active)
- [ ] Task: Conductor - Verify Phase 3.1 Collections

### 3.2 Orientation Service Tests (RED)

- [ ] Task: Write `orientationService.test.js` - tests for `getAvailableOrientationSlots()`
- [ ] Task: Write tests for `bookOrientationSlot()` - booking with capacity check
- [ ] Task: Write tests for `cancelOrientationBooking()` - release slot
- [ ] Task: Write tests for `createOrientationSlot()` - admin slot creation
- [ ] Task: Write tests for `updateOrientationSlot()` - admin slot updates
- [ ] Task: Write tests for `getOrientationAttendees()` - list bookings
- [ ] Task: Write tests for `markOrientationComplete()` - workflow update
- [ ] Task: Write tests for overbooking prevention
- [ ] Task: Write tests for booking after compliance verified
- [ ] Task: Run tests - verify all fail (RED phase complete)

### 3.3 Orientation Service Implementation (GREEN)

- [ ] Task: Create `src/backend/orientationService.jsw`
- [ ] Task: Implement `getAvailableOrientationSlots()` - make tests pass
- [ ] Task: Implement `bookOrientationSlot()` with capacity enforcement - make tests pass
- [ ] Task: Implement `cancelOrientationBooking()` - make tests pass
- [ ] Task: Implement `createOrientationSlot()` - make tests pass
- [ ] Task: Implement `updateOrientationSlot()` - make tests pass
- [ ] Task: Implement `getOrientationAttendees()` - make tests pass
- [ ] Task: Implement `markOrientationComplete()` - make tests pass
- [ ] Task: Verify all tests pass (GREEN phase complete)
- [ ] Task: Verify coverage >90% for orientationService.jsw

### 3.4 Orientation Booking UI (Driver)

- [ ] Task: Create `src/public/driver/DRIVER_ORIENTATION_BOOKING.html`
- [ ] Task: Build location selection panel
- [ ] Task: Build available slots calendar/list view
- [ ] Task: Build booking confirmation flow
- [ ] Task: Build "What to bring" information panel
- [ ] Task: Wire up postMessage handlers to backend

### 3.5 Orientation Management UI (Recruiter/Admin)

- [ ] Task: Add orientation section to Recruiter Dashboard
- [ ] Task: Build slot creation/management interface
- [ ] Task: Build attendee list view with driver details
- [ ] Task: Build capacity management controls
- [ ] Task: Build orientation completion tracking

### 3.6 Orientation Notifications

- [ ] Task: Create email template for orientation confirmation
- [ ] Task: Create email template for orientation reminder (1 day before)
- [ ] Task: Create SMS template for orientation reminder
- [ ] Task: Implement calendar invite generation (.ics file)
- [ ] Task: Add orientation reminder job to `jobs.config`

### 3.7 Phase 3 Integration Tests

- [ ] Task: Write E2E test: View available slots -> book -> confirmation email
- [ ] Task: Write E2E test: Cancel booking -> slot released
- [ ] Task: Write E2E test: Full capacity blocking
- [ ] Task: Run integration tests - verify all pass
- [ ] Task: Conductor - Verify Phase 3 Orientation Scheduler Complete

---

## Phase 4: Background Check Integration (External API)

This phase integrates with external background check providers.

### 4.1 Background Check Data Model

- [ ] Task: Create `BackgroundChecks` collection in Wix with schema from spec
- [ ] Task: Create indexes for `BackgroundChecks` (workflow_id, provider, status)
- [ ] Task: Conductor - Verify Phase 4.1 Collections

### 4.2 Background Check Service Tests (RED)

- [ ] Task: Write `backgroundCheckService.test.js` - tests for `orderBackgroundCheck()`
- [ ] Task: Write tests for `getBackgroundCheckStatus()` - status retrieval
- [ ] Task: Write tests for `processBackgroundWebhook()` - webhook handling
- [ ] Task: Write tests for `getBackgroundCheckPackages()` - package retrieval
- [ ] Task: Write tests for `cancelBackgroundCheck()` - cancellation
- [ ] Task: Write tests for provider selection (HireRight, Checkr, Tenstreet)
- [ ] Task: Write tests for webhook signature validation
- [ ] Task: Write tests for result parsing (clear, consider, fail)
- [ ] Task: Run tests - verify all fail (RED phase complete)

### 4.3 Background Check Service Implementation (GREEN)

- [ ] Task: Create `src/backend/backgroundCheckService.jsw`
- [ ] Task: Add background check API credentials to Wix Secrets Manager
- [ ] Task: Implement `orderBackgroundCheck()` - make tests pass
- [ ] Task: Implement `getBackgroundCheckStatus()` - make tests pass
- [ ] Task: Implement `getBackgroundCheckPackages()` - make tests pass
- [ ] Task: Implement `cancelBackgroundCheck()` - make tests pass
- [ ] Task: Verify all tests pass (GREEN phase complete)
- [ ] Task: Verify coverage >85% for backgroundCheckService.jsw

### 4.4 HireRight Integration

- [ ] Task: Add HireRight API credentials to Wix Secrets Manager
- [ ] Task: Implement HireRight API client (order, status, cancel)
- [ ] Task: Implement HireRight webhook handler in `http-functions.js`
- [ ] Task: Map HireRight result codes to internal statuses
- [ ] Task: Test with HireRight sandbox environment

### 4.5 Checkr Integration (Alternative)

- [ ] Task: Add Checkr API credentials to Wix Secrets Manager
- [ ] Task: Implement Checkr API client as alternative provider
- [ ] Task: Implement Checkr webhook handler
- [ ] Task: Map Checkr result codes to internal statuses
- [ ] Task: Test with Checkr sandbox environment

### 4.6 Tenstreet Integration (Optional)

- [ ] Task: Add Tenstreet API credentials to Wix Secrets Manager
- [ ] Task: Implement Tenstreet integration for carriers using Tenstreet ATS
- [ ] Task: Test with Tenstreet sandbox

### 4.7 Background Check UI Updates

- [ ] Task: Update Onboarding Dashboard with background check status
- [ ] Task: Build background check detail panel (results, report link)
- [ ] Task: Build package selection dropdown
- [ ] Task: Build "Consider" result review workflow
- [ ] Task: Add cost tracking display

### 4.8 Phase 4 Integration Tests

- [ ] Task: Write E2E test: Order background check -> webhook -> workflow update
- [ ] Task: Write E2E test: Clear result triggers next step
- [ ] Task: Write E2E test: Consider result flags for review
- [ ] Task: Write E2E test: Provider failover (if primary fails)
- [ ] Task: Run integration tests - verify all pass
- [ ] Task: Conductor - Verify Phase 4 Background Check Integration Complete

---

## Phase 5: Drug Test Scheduling (External API)

This phase integrates with drug testing lab networks.

### 5.1 Drug Test Data Model

- [ ] Task: Create `DrugTests` collection in Wix with schema from spec
- [ ] Task: Create indexes for `DrugTests` (workflow_id, provider, status, appointment_date)
- [ ] Task: Conductor - Verify Phase 5.1 Collections

### 5.2 Drug Test Service Tests (RED)

- [ ] Task: Write `drugTestService.test.js` - tests for `scheduleDrugTest()`
- [ ] Task: Write tests for `findCollectionSites()` - location search
- [ ] Task: Write tests for `updateDrugTestAppointment()` - rescheduling
- [ ] Task: Write tests for `processDrugTestWebhook()` - result handling
- [ ] Task: Write tests for `getDrugTestStatus()` - status retrieval
- [ ] Task: Write tests for `confirmDrugTestAppointment()` - driver confirmation
- [ ] Task: Write tests for panel type selection (5-panel, 10-panel, DOT)
- [ ] Task: Write tests for result parsing (negative, positive, dilute)
- [ ] Task: Run tests - verify all fail (RED phase complete)

### 5.3 Drug Test Service Implementation (GREEN)

- [ ] Task: Create `src/backend/drugTestService.jsw`
- [ ] Task: Add drug test lab API credentials to Wix Secrets Manager
- [ ] Task: Implement `scheduleDrugTest()` - make tests pass
- [ ] Task: Implement `findCollectionSites()` - make tests pass
- [ ] Task: Implement `updateDrugTestAppointment()` - make tests pass
- [ ] Task: Implement `getDrugTestStatus()` - make tests pass
- [ ] Task: Implement `confirmDrugTestAppointment()` - make tests pass
- [ ] Task: Verify all tests pass (GREEN phase complete)
- [ ] Task: Verify coverage >85% for drugTestService.jsw

### 5.4 Quest Diagnostics Integration

- [ ] Task: Add Quest API credentials to Wix Secrets Manager
- [ ] Task: Implement Quest API client (schedule, sites, status)
- [ ] Task: Implement Quest webhook handler in `http-functions.js`
- [ ] Task: Map Quest result codes to internal statuses
- [ ] Task: Test with Quest sandbox/test environment

### 5.5 LabCorp Integration (Alternative)

- [ ] Task: Add LabCorp API credentials to Wix Secrets Manager
- [ ] Task: Implement LabCorp API client as alternative provider
- [ ] Task: Implement LabCorp webhook handler
- [ ] Task: Map LabCorp result codes to internal statuses
- [ ] Task: Test with LabCorp sandbox

### 5.6 Drug Test UI Updates

- [ ] Task: Update Onboarding Dashboard with drug test status
- [ ] Task: Build drug test scheduling panel (site selection, date picker)
- [ ] Task: Build collection site finder with map
- [ ] Task: Build appointment confirmation UI for driver
- [ ] Task: Build donor pass display/print functionality

### 5.7 Drug Test Notifications

- [ ] Task: Create email template for drug test appointment confirmation
- [ ] Task: Create email template for drug test reminder (1 day before)
- [ ] Task: Create SMS template for appointment details and donor pass
- [ ] Task: Create email template for drug test results (internal notification)

### 5.8 Phase 5 Integration Tests

- [ ] Task: Write E2E test: Find sites -> schedule -> confirmation -> result
- [ ] Task: Write E2E test: Reschedule appointment
- [ ] Task: Write E2E test: No-show handling
- [ ] Task: Write E2E test: Positive result workflow (pause onboarding)
- [ ] Task: Run integration tests - verify all pass
- [ ] Task: Conductor - Verify Phase 5 Drug Test Scheduling Complete

---

## Final Phase: Full System Integration & Launch

### 6.1 Full Workflow Integration Tests

- [ ] Task: Write E2E test: Complete onboarding flow (offer -> docs -> bg -> drug -> orientation -> ready)
- [ ] Task: Write E2E test: Parallel processing (docs, bg, drug happening simultaneously)
- [ ] Task: Write E2E test: Failure recovery (bg fails -> review -> override)
- [ ] Task: Write E2E test: Cancel mid-workflow
- [ ] Task: Write E2E test: Multi-carrier recruiter handling

### 6.2 Compliance Verification Engine

- [ ] Task: Implement scheduled compliance checker job
- [ ] Task: Build compliance rules engine (configurable per carrier)
- [ ] Task: Implement compliance issue flagging and resolution tracking
- [ ] Task: Add compliance checker job to `jobs.config`

### 6.3 Analytics & Reporting

- [ ] Task: Create onboarding analytics dashboard
- [ ] Task: Track time-in-stage metrics
- [ ] Task: Track completion rates by carrier
- [ ] Task: Track drop-off points
- [ ] Task: Build recruiter performance metrics

### 6.4 Documentation

- [ ] Task: Write recruiter user guide for onboarding automation
- [ ] Task: Write driver user guide for document upload portal
- [ ] Task: Document API endpoints for carrier IT teams
- [ ] Task: Create troubleshooting guide for common issues

### 6.5 Security Audit

- [ ] Task: Review all document handling for security
- [ ] Task: Review all PII handling and storage
- [ ] Task: Review webhook endpoints for vulnerabilities
- [ ] Task: Verify API key rotation procedures
- [ ] Task: Penetration test document upload portal

### 6.6 Launch Preparation

- [ ] Task: Load test document upload with 100 concurrent uploads
- [ ] Task: Load test workflow creation with 500 workflows
- [ ] Task: Set up monitoring and alerting
- [ ] Task: Create runbook for on-call support
- [ ] Task: Train support team on new features

### 6.7 Staged Rollout

- [ ] Task: Enable for 3 beta carriers
- [ ] Task: Gather feedback and iterate
- [ ] Task: Enable for all Pro/Enterprise carriers
- [ ] Task: Monitor metrics for 2 weeks
- [ ] Task: Conductor - Final Verification & Launch

---

## Dependencies Summary

```
Phase 1 (Document Collection)     [FOUNDATION]
    |
    +---> Phase 2 (Offer Letters)  [HIGH VALUE]
    |         |
    +---> Phase 3 (Orientation)    [DEPENDENT ON PHASE 1]
    |         |
    +---> Phase 4 (Background)     [PARALLEL TO PHASE 3]
    |         |
    +---> Phase 5 (Drug Test)      [PARALLEL TO PHASE 4]
              |
              v
    Final Phase (Integration)      [REQUIRES ALL PHASES]
```

---

## Quality Gates (Per Phase)

Before marking any phase complete:

- [ ] All tests written (TDD RED phase)
- [ ] All tests passing (TDD GREEN phase)
- [ ] Code coverage meets requirements (>85% for services)
- [ ] No linting errors
- [ ] JSDoc documentation complete
- [ ] Security review passed (PII handling, file uploads)
- [ ] Manual QA completed
- [ ] UI responsive on mobile
- [ ] Error handling tested
- [ ] Audit logging verified

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| External API downtime | Implement retry logic with exponential backoff; queue failed requests |
| Document upload abuse | File type validation, size limits, rate limiting, malware scanning |
| E-signature provider issues | Support multiple providers (DocuSign + HelloSign) |
| Background check delays | Show ETA to recruiter; implement status polling |
| Drug test no-shows | Reminder sequence; easy rescheduling |
| PII exposure | Encryption at rest; audit logging; minimal retention |
| Compliance violations | Automated compliance checker; blocking until resolved |

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Document Collection | 3 weeks | None |
| Phase 2: Offer Letter Generator | 2 weeks | Phase 1 |
| Phase 3: Orientation Scheduler | 1.5 weeks | Phase 1 |
| Phase 4: Background Check | 2 weeks | Phase 1 |
| Phase 5: Drug Test Scheduling | 2 weeks | Phase 1 |
| Final Phase: Integration | 1.5 weeks | All Phases |

**Total Estimated Duration: 12 weeks**

Note: Phases 3, 4, and 5 can run in parallel after Phase 1 is complete.
