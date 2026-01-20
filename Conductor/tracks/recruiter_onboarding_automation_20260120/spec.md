# Specification: Recruiter Onboarding Automation

## 1. Overview

The Recruiter Onboarding Automation system streamlines the post-hire workflow for recruiters, reducing manual administrative tasks by 60%. This system automates document collection, background check ordering, drug test scheduling, orientation booking, and offer letter generation with e-signature integration.

### Business Value

| Metric | Current State | Target State | Improvement |
|--------|---------------|--------------|-------------|
| Time to complete onboarding | 5-7 days | 2-3 days | 50-60% faster |
| Admin time per driver | 4+ hours | 1.5 hours | 60% reduction |
| Document follow-up touches | 8-12 calls/emails | 2-3 automated | 75% reduction |
| Compliance errors | 15% incomplete files | <2% | 87% improvement |

### Core Features

1. **Document Collection Workflow** - Automated document requests with checklist tracking
2. **Background Check Integration** - HireRight/Checkr/Tenstreet API connections
3. **Drug Test Scheduling** - Quest/LabCorp integration with automated scheduling
4. **Orientation Scheduler** - Calendar booking with availability matching
5. **Offer Letter Generator** - Template-based letters with e-signature (DocuSign/HelloSign)

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
+-------------------------------------------------------------------------+
|                        RECRUITER ONBOARDING PORTAL                       |
|  +-------------------------------------------------------------------+  |
|  |  Onboarding Dashboard  |  Document Center  |  Compliance Status   |  |
+--+-------------------------------------------------------------------+--+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                         ONBOARDING ORCHESTRATOR                          |
|  +-------------+  +---------------+  +-------------+  +--------------+  |
|  | Workflow    |  | Document      |  | Compliance  |  | Notification |  |
|  | Engine      |  | Manager       |  | Checker     |  | Service      |  |
|  +-------------+  +---------------+  +-------------+  +--------------+  |
+-------------------------------------------------------------------------+
         |                |                |                |
         v                v                v                v
+-------------------------------------------------------------------------+
|                         EXTERNAL INTEGRATIONS                            |
|  +-------------+  +---------------+  +-------------+  +--------------+  |
|  | Background  |  | Drug Test     |  | E-Signature |  | Calendar     |  |
|  | Check APIs  |  | Lab APIs      |  | APIs        |  | Service      |  |
|  | HireRight   |  | Quest         |  | DocuSign    |  | (Internal)   |  |
|  | Checkr      |  | LabCorp       |  | HelloSign   |  |              |  |
|  | Tenstreet   |  |               |  |             |  |              |  |
|  +-------------+  +---------------+  +-------------+  +--------------+  |
+-------------------------------------------------------------------------+
         |                |                |                |
         v                v                v                v
+-------------------------------------------------------------------------+
|                          WIX DATA COLLECTIONS                            |
|  +------------------+  +------------------+  +----------------------+   |
|  | OnboardingWork   |  | DocumentRequests |  | BackgroundChecks     |   |
|  | flows            |  |                  |  |                      |   |
|  +------------------+  +------------------+  +----------------------+   |
|  +------------------+  +------------------+  +----------------------+   |
|  | DrugTests        |  | OrientationSlots |  | OfferLetters         |   |
|  +------------------+  +------------------+  +----------------------+   |
+-------------------------------------------------------------------------+
```

### 2.2 Workflow State Machine

```
                          +------------------+
                          |   OFFER_SENT     |
                          +--------+---------+
                                   |
                                   v
                          +------------------+
                          | OFFER_ACCEPTED   |
                          +--------+---------+
                                   |
          +------------------------+------------------------+
          |                        |                        |
          v                        v                        v
+------------------+    +------------------+    +------------------+
| DOCUMENTS_       |    | BACKGROUND_      |    | DRUG_TEST_       |
| REQUESTED        |    | CHECK_ORDERED    |    | SCHEDULED        |
+--------+---------+    +--------+---------+    +--------+---------+
         |                       |                       |
         v                       v                       v
+------------------+    +------------------+    +------------------+
| DOCUMENTS_       |    | BACKGROUND_      |    | DRUG_TEST_       |
| COMPLETE         |    | CHECK_PASSED     |    | PASSED           |
+--------+---------+    +--------+---------+    +--------+---------+
         |                       |                       |
         +----------+------------+------------+----------+
                    |                         |
                    v                         v
          +------------------+     +------------------+
          | COMPLIANCE_      |     | ORIENTATION_     |
          | VERIFIED         |     | SCHEDULED        |
          +--------+---------+     +--------+---------+
                   |                        |
                   +------------+-----------+
                                |
                                v
                       +------------------+
                       |   READY_TO_      |
                       |   START          |
                       +------------------+
```

### 2.3 Component Interaction Flow

```
Driver Accepts Offer
        |
        v
+---------------------------------------+
| 1. Workflow Engine creates workflow   |
|    - Sets parallel tasks              |
|    - Sends document request email     |
|    - Orders background check          |
|    - Schedules drug test              |
+---------------------------------------+
        |
        +-----> Document Collection (async)
        |           |
        |           +---> Email with secure upload link
        |           +---> SMS reminder (day 2, day 5)
        |           +---> Checklist progress tracking
        |           +---> Auto-verify CDL via OCR
        |
        +-----> Background Check (async)
        |           |
        |           +---> API call to provider
        |           +---> Webhook receives results
        |           +---> Auto-update workflow status
        |
        +-----> Drug Test (async)
                    |
                    +---> Find nearest collection site
                    +---> Schedule appointment
                    +---> Send driver appointment details
                    +---> Webhook receives results
        |
        v
+---------------------------------------+
| 2. Compliance Checker runs daily      |
|    - Verifies all documents received  |
|    - Checks background/drug results   |
|    - Flags any issues                 |
+---------------------------------------+
        |
        v
+---------------------------------------+
| 3. Orientation Scheduler              |
|    - Shows available orientation dates|
|    - Driver selects preferred date    |
|    - Confirmation + calendar invite   |
+---------------------------------------+
        |
        v
+---------------------------------------+
| 4. Ready to Start                     |
|    - Generate driver ID/credentials   |
|    - Final checklist completion       |
|    - Notify recruiter + driver        |
+---------------------------------------+
```

---

## 3. Data Model

### 3.1 New Collections

#### OnboardingWorkflows

Master record tracking the complete onboarding journey for each driver.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `_owner` | String | Recruiter member ID |
| `driver_id` | Reference | FK to DriverProfiles |
| `carrier_id` | Reference | FK to Carriers |
| `recruiter_id` | String | Recruiter who initiated |
| `status` | String | Workflow state (enum below) |
| `offer_letter_id` | Reference | FK to OfferLetters |
| `start_date` | DateTime | Intended start date |
| `actual_start_date` | DateTime | Actual start date |
| `documents_status` | String | 'pending', 'partial', 'complete' |
| `background_status` | String | 'not_started', 'ordered', 'passed', 'failed', 'review' |
| `drug_test_status` | String | 'not_started', 'scheduled', 'passed', 'failed' |
| `orientation_status` | String | 'not_scheduled', 'scheduled', 'completed' |
| `compliance_verified` | Boolean | All requirements met |
| `compliance_issues` | Array[String] | List of blocking issues |
| `metadata` | Object | Provider-specific data |
| `_createdDate` | DateTime | Workflow created |
| `_updatedDate` | DateTime | Last updated |

**Status Enum Values:**
- `offer_sent`
- `offer_accepted`
- `documents_requested`
- `documents_complete`
- `background_ordered`
- `background_passed`
- `background_failed`
- `drug_test_scheduled`
- `drug_test_passed`
- `drug_test_failed`
- `orientation_scheduled`
- `orientation_completed`
- `compliance_verified`
- `ready_to_start`
- `cancelled`
- `on_hold`

#### DocumentRequests

Individual document requests within an onboarding workflow.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `workflow_id` | Reference | FK to OnboardingWorkflows |
| `driver_id` | Reference | FK to DriverProfiles |
| `document_type` | String | Type of document (enum below) |
| `display_name` | String | Human-readable name |
| `description` | String | Instructions for driver |
| `is_required` | Boolean | Blocks completion if missing |
| `status` | String | 'requested', 'submitted', 'verified', 'rejected' |
| `rejection_reason` | String | Why document was rejected |
| `file_url` | String | Uploaded file URL |
| `file_hash` | String | SHA256 for integrity |
| `submitted_date` | DateTime | When driver submitted |
| `verified_date` | DateTime | When recruiter verified |
| `verified_by` | String | Recruiter who verified |
| `ocr_data` | Object | Extracted data from OCR |
| `expiration_date` | DateTime | Document expiration (if applicable) |
| `reminder_sent_count` | Number | Number of reminders sent |
| `last_reminder_date` | DateTime | Last reminder timestamp |
| `_createdDate` | DateTime | Request created |
| `_updatedDate` | DateTime | Last updated |

**Document Type Enum:**
- `cdl_front` - CDL Front
- `cdl_back` - CDL Back
- `mvr` - Motor Vehicle Record
- `psp` - Pre-Employment Screening Program
- `medical_card` - DOT Medical Card
- `drug_test_consent` - Drug Test Consent Form
- `employment_app` - Employment Application
- `w4` - W-4 Tax Form
- `i9` - I-9 Employment Eligibility
- `direct_deposit` - Direct Deposit Authorization
- `social_security` - Social Security Card
- `employment_history` - Employment History (10 years)
| `proof_of_address` - Proof of Address
| `custom` - Custom document type

#### BackgroundChecks

Track background check orders and results.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `workflow_id` | Reference | FK to OnboardingWorkflows |
| `driver_id` | Reference | FK to DriverProfiles |
| `provider` | String | 'hireright', 'checkr', 'tenstreet' |
| `provider_order_id` | String | External order ID |
| `package_type` | String | Check package ordered |
| `status` | String | 'ordered', 'processing', 'complete', 'error' |
| `result` | String | 'clear', 'consider', 'fail', 'pending' |
| `result_details` | Object | Detailed results breakdown |
| `criminal_result` | String | Criminal check result |
| `employment_result` | String | Employment verification result |
| `mvr_result` | String | MVR check result |
| `education_result` | String | Education verification result |
| `report_url` | String | Link to full report |
| `ordered_date` | DateTime | When order was placed |
| `completed_date` | DateTime | When results received |
| `estimated_completion` | DateTime | ETA from provider |
| `cost` | Number | Cost of the check |
| `webhook_events` | Array[Object] | All webhook events received |
| `_createdDate` | DateTime | Record created |
| `_updatedDate` | DateTime | Last updated |

#### DrugTests

Track drug test scheduling and results.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `workflow_id` | Reference | FK to OnboardingWorkflows |
| `driver_id` | Reference | FK to DriverProfiles |
| `provider` | String | 'quest', 'labcorp' |
| `provider_order_id` | String | External order ID |
| `test_type` | String | 'pre_employment', 'random', 'post_accident' |
| `panel_type` | String | '5_panel', '10_panel', 'dot' |
| `status` | String | 'ordered', 'scheduled', 'completed', 'no_show', 'error' |
| `result` | String | 'negative', 'positive', 'dilute', 'pending' |
| `mro_status` | String | Medical Review Officer status |
| `collection_site` | Object | Site name, address, phone |
| `appointment_date` | DateTime | Scheduled appointment |
| `appointment_confirmed` | Boolean | Driver confirmed |
| `completed_date` | DateTime | When test completed |
| `result_date` | DateTime | When results received |
| `donor_pass_id` | String | Pass ID for collection site |
| `chain_of_custody_id` | String | COC form number |
| `cost` | Number | Cost of the test |
| `_createdDate` | DateTime | Record created |
| `_updatedDate` | DateTime | Last updated |

#### OrientationSlots

Available orientation sessions and bookings.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `carrier_id` | Reference | FK to Carriers |
| `location` | Object | Address, city, state, zip |
| `location_name` | String | "Dallas Terminal", "Corporate HQ" |
| `session_date` | DateTime | Orientation date |
| `start_time` | String | Start time (24h format) |
| `end_time` | String | End time (24h format) |
| `duration_days` | Number | Multi-day orientations |
| `capacity` | Number | Max attendees |
| `booked_count` | Number | Current bookings |
| `available_count` | Number | Computed: capacity - booked |
| `is_active` | Boolean | Accepting bookings |
| `instructor` | String | Orientation leader |
| `notes` | String | What to bring, parking info |
| `bookings` | Array[Object] | Array of {driver_id, workflow_id, booked_date} |
| `_createdDate` | DateTime | Slot created |
| `_updatedDate` | DateTime | Last updated |

#### OfferLetters

Offer letter templates and generated letters.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `workflow_id` | Reference | FK to OnboardingWorkflows (null for templates) |
| `driver_id` | Reference | FK to DriverProfiles (null for templates) |
| `carrier_id` | Reference | FK to Carriers |
| `is_template` | Boolean | True if this is a template |
| `template_name` | String | Template identifier |
| `template_version` | Number | Version number |
| `letter_type` | String | 'company_driver', 'owner_operator', 'lease_purchase' |
| `content_html` | String | Full letter content (HTML) |
| `content_pdf_url` | String | Generated PDF URL |
| `variables` | Object | Variables used in generation |
| `pay_rate` | String | Offered pay rate |
| `start_date` | DateTime | Proposed start date |
| `position_title` | String | Job title |
| `route_type` | String | OTR, Regional, Local |
| `benefits_summary` | String | Benefits overview |
| `sign_on_bonus` | Number | Sign-on bonus amount |
| `status` | String | 'draft', 'pending_approval', 'approved', 'sent', 'signed', 'declined' |
| `approval_required` | Boolean | Needs manager approval |
| `approved_by` | String | Manager who approved |
| `approved_date` | DateTime | Approval timestamp |
| `sent_date` | DateTime | When sent to driver |
| `esign_provider` | String | 'docusign', 'hellosign' |
| `esign_envelope_id` | String | External envelope ID |
| `esign_status` | String | E-signature status |
| `signed_date` | DateTime | When driver signed |
| `signed_document_url` | String | Final signed PDF |
| `expiration_date` | DateTime | Offer expiration |
| `_createdDate` | DateTime | Record created |
| `_updatedDate` | DateTime | Last updated |

### 3.2 Extended Collections

#### DriverProfiles (Extend)

Add fields to support onboarding workflows:

| Field | Type | Description |
|-------|------|-------------|
| `onboarding_status` | String | 'not_started', 'in_progress', 'complete' |
| `active_workflow_id` | Reference | FK to current OnboardingWorkflows |
| `background_check_consent` | Boolean | Consented to background check |
| `drug_test_consent` | Boolean | Consented to drug testing |
| `documents_upload_token` | String | Secure token for upload portal |
| `preferred_orientation_location` | String | Preferred location for orientation |

#### Carriers (Extend)

Add fields for onboarding configuration:

| Field | Type | Description |
|-------|------|-------------|
| `onboarding_config` | Object | Onboarding settings (see below) |
| `background_check_provider` | String | Default provider |
| `drug_test_provider` | String | Default provider |
| `esign_provider` | String | DocuSign or HelloSign |
| `offer_letter_template_ids` | Array[String] | Available templates |

**Onboarding Config Object:**
```javascript
{
  required_documents: ['cdl_front', 'cdl_back', 'mvr', 'medical_card', 'drug_test_consent'],
  optional_documents: ['psp', 'employment_history'],
  background_check_package: 'standard',  // or 'comprehensive'
  drug_test_panel: 'dot',
  orientation_required: true,
  offer_approval_required: false,
  document_reminder_days: [2, 5, 7],
  offer_expiration_days: 14
}
```

---

## 4. API Design

### 4.1 Onboarding Workflow Service (`onboardingWorkflowService.jsw`)

```javascript
// Create a new onboarding workflow
export async function createOnboardingWorkflow(driverId, carrierId, options) {
  // options: { startDate, offerLetterId, skipBackgroundCheck, skipDrugTest }
  // Returns: { workflowId, status, nextSteps }
}

// Get workflow status and details
export async function getWorkflowStatus(workflowId) {
  // Returns: Full workflow object with all sub-statuses
}

// Get all active workflows for a recruiter
export async function getActiveWorkflows(recruiterId, filters) {
  // filters: { status, carrierId, dateRange }
  // Returns: Array of workflow summaries
}

// Update workflow status
export async function updateWorkflowStatus(workflowId, status, metadata) {
  // Triggers appropriate actions based on new status
}

// Cancel workflow
export async function cancelWorkflow(workflowId, reason) {
  // Cancels all pending actions, notifies driver
}

// Get compliance checklist
export async function getComplianceChecklist(workflowId) {
  // Returns: Array of requirements with status
}

// Force re-check compliance
export async function recheckCompliance(workflowId) {
  // Re-evaluates all requirements
}
```

### 4.2 Document Collection Service (`documentCollectionService.jsw`)

```javascript
// Request documents from driver
export async function requestDocuments(workflowId, documentTypes) {
  // Creates DocumentRequests, sends email with upload link
  // Returns: { requestIds, uploadPortalUrl }
}

// Get document request status
export async function getDocumentStatus(workflowId) {
  // Returns: Array of document requests with status
}

// Upload document (called from secure upload portal)
export async function uploadDocument(token, documentType, fileData) {
  // Validates token, saves file, triggers OCR if applicable
  // Returns: { success, documentId, verificationStatus }
}

// Verify document manually
export async function verifyDocument(documentId, verified, rejectionReason) {
  // Recruiter verification action
}

// Send document reminder
export async function sendDocumentReminder(documentRequestId) {
  // Manual reminder trigger
}

// Get OCR-extracted data
export async function getDocumentOcrData(documentId) {
  // Returns: Extracted fields from OCR
}

// Check document expiration
export async function checkDocumentExpiration(driverId) {
  // Returns: Array of expiring/expired documents
}
```

### 4.3 Background Check Service (`backgroundCheckService.jsw`)

```javascript
// Order background check
export async function orderBackgroundCheck(workflowId, options) {
  // options: { provider, package, additionalChecks }
  // Returns: { orderId, providerId, estimatedCompletion }
}

// Get check status
export async function getBackgroundCheckStatus(workflowId) {
  // Returns: Current status and any results available
}

// Process webhook from provider
export async function processBackgroundWebhook(provider, payload, signature) {
  // Validates signature, updates BackgroundChecks, triggers workflow update
}

// Get available packages
export async function getBackgroundCheckPackages(carrierId) {
  // Returns: Array of available packages with pricing
}

// Cancel background check
export async function cancelBackgroundCheck(checkId) {
  // Attempts to cancel with provider
}
```

### 4.4 Drug Test Service (`drugTestService.jsw`)

```javascript
// Schedule drug test
export async function scheduleDrugTest(workflowId, options) {
  // options: { preferredDate, preferredZip, panelType }
  // Returns: { testId, collectionSite, appointmentDate, donorPassId }
}

// Find nearby collection sites
export async function findCollectionSites(zipCode, radius) {
  // Returns: Array of collection sites with availability
}

// Update appointment
export async function updateDrugTestAppointment(testId, newDate, newSiteId) {
  // Reschedules the appointment
}

// Process webhook from lab
export async function processDrugTestWebhook(provider, payload, signature) {
  // Validates signature, updates DrugTests, triggers workflow update
}

// Get test status
export async function getDrugTestStatus(workflowId) {
  // Returns: Current status and results
}

// Driver confirms appointment
export async function confirmDrugTestAppointment(testId, confirmed) {
  // Updates confirmation status
}
```

### 4.5 Orientation Service (`orientationService.jsw`)

```javascript
// Get available orientation slots
export async function getAvailableOrientationSlots(carrierId, locationId, dateRange) {
  // Returns: Array of available slots with capacity
}

// Book orientation slot
export async function bookOrientationSlot(workflowId, slotId) {
  // Books the slot, sends confirmation
  // Returns: { bookingId, confirmationDetails }
}

// Cancel orientation booking
export async function cancelOrientationBooking(workflowId) {
  // Releases the slot, notifies parties
}

// Create orientation slot (admin)
export async function createOrientationSlot(carrierId, slotData) {
  // Creates new available slot
}

// Update orientation slot (admin)
export async function updateOrientationSlot(slotId, updates) {
  // Updates slot details
}

// Get orientation attendees
export async function getOrientationAttendees(slotId) {
  // Returns: Array of booked drivers with status
}

// Mark orientation complete
export async function markOrientationComplete(workflowId) {
  // Updates workflow status
}
```

### 4.6 Offer Letter Service (`offerLetterService.jsw`)

```javascript
// Generate offer letter from template
export async function generateOfferLetter(workflowId, templateId, variables) {
  // Merges variables, generates PDF
  // Returns: { offerId, previewUrl }
}

// Get offer letter templates
export async function getOfferLetterTemplates(carrierId, letterType) {
  // Returns: Array of available templates
}

// Create/update template
export async function saveOfferLetterTemplate(carrierId, templateData) {
  // Creates or updates template
}

// Submit for approval
export async function submitOfferForApproval(offerId, approverEmail) {
  // Sends approval request
}

// Approve offer
export async function approveOffer(offerId, approverId) {
  // Marks as approved, ready to send
}

// Send offer to driver
export async function sendOfferLetter(offerId, deliveryMethod) {
  // deliveryMethod: 'email', 'esign'
  // Sends offer and creates e-signature envelope
}

// Process e-signature webhook
export async function processEsignWebhook(provider, payload, signature) {
  // Updates offer status based on signing events
}

// Get offer status
export async function getOfferStatus(offerId) {
  // Returns: Current status, viewing history, signature status
}

// Resend offer
export async function resendOffer(offerId) {
  // Resends to driver
}

// Get signed document
export async function getSignedOffer(offerId) {
  // Returns: URL to signed PDF
}
```

### 4.7 Notification Service Extensions (`onboardingNotifications.jsw`)

```javascript
// Send onboarding notification
export async function sendOnboardingNotification(workflowId, notificationType, recipient) {
  // notificationType: 'document_request', 'document_reminder', 'background_complete', etc.
  // recipient: 'driver', 'recruiter', 'both'
}

// Send bulk reminders
export async function sendBulkDocumentReminders() {
  // Scheduled job: sends reminders for pending documents
}

// Get notification history
export async function getNotificationHistory(workflowId) {
  // Returns: All notifications sent for this workflow
}
```

---

## 5. External API Integrations

### 5.1 Background Check Providers

#### HireRight Integration

```javascript
// Configuration
const HIRERIGHT_CONFIG = {
  apiUrl: 'https://api.hireright.com/v1',
  clientId: 'HIRERIGHT_CLIENT_ID',  // From Wix Secrets
  apiKey: 'HIRERIGHT_API_KEY',      // From Wix Secrets
  packages: {
    standard: 'PKG_STANDARD_CDL',
    comprehensive: 'PKG_COMP_CDL_DOT'
  }
};

// Order background check
POST /orders
{
  "package_id": "PKG_STANDARD_CDL",
  "candidate": {
    "first_name": "John",
    "last_name": "Smith",
    "email": "john@email.com",
    "ssn_last4": "1234",
    "dob": "1985-03-15",
    "address": {...}
  },
  "webhook_url": "https://www.lastmilecdl.com/_functions/bgcheck/hireright"
}

// Webhook payload
{
  "event": "order.completed",
  "order_id": "HR123456",
  "result": "clear",
  "components": [
    { "type": "criminal", "result": "clear" },
    { "type": "employment", "result": "verified" },
    { "type": "mvr", "result": "clear", "violations": [] }
  ],
  "report_url": "https://..."
}
```

#### Checkr Integration

```javascript
// Configuration
const CHECKR_CONFIG = {
  apiUrl: 'https://api.checkr.com/v1',
  apiKey: 'CHECKR_API_KEY',  // From Wix Secrets
  packages: {
    standard: 'driver_standard',
    comprehensive: 'driver_pro'
  }
};

// Order background check
POST /invitations
{
  "package": "driver_standard",
  "candidate_id": "...",  // or create inline
  "work_locations": [{ "state": "TX" }]
}

// Webhook payload
{
  "type": "report.completed",
  "data": {
    "object": {
      "id": "...",
      "status": "clear",
      "adjudication": null,
      "reports": [...]
    }
  }
}
```

#### Tenstreet Integration

```javascript
// Configuration (primarily for carriers already using Tenstreet)
const TENSTREET_CONFIG = {
  apiUrl: 'https://api.tenstreet.com/v1',
  companyId: 'TENSTREET_COMPANY_ID',
  apiKey: 'TENSTREET_API_KEY'
};

// Note: Tenstreet is often the ATS, so integration may involve
// pushing driver data to their system rather than pulling results
```

### 5.2 Drug Test Lab Integrations

#### Quest Diagnostics

```javascript
// Configuration
const QUEST_CONFIG = {
  apiUrl: 'https://employersolutions.questdiagnostics.com/api/v1',
  accountId: 'QUEST_ACCOUNT_ID',
  apiKey: 'QUEST_API_KEY'
};

// Schedule drug test
POST /orders
{
  "donor": {
    "first_name": "John",
    "last_name": "Smith",
    "ssn_last4": "1234",
    "dob": "1985-03-15",
    "phone": "555-123-4567"
  },
  "test_type": "DOT_PRE_EMPLOYMENT",
  "panel": "DOT_5_PANEL",
  "preferred_date": "2026-01-25",
  "preferred_zip": "75201"
}

// Response
{
  "order_id": "Q123456",
  "collection_site": {
    "name": "Quest Diagnostics - Dallas Main",
    "address": "123 Main St, Dallas, TX 75201",
    "phone": "214-555-0100"
  },
  "appointment_date": "2026-01-25T09:00:00Z",
  "donor_pass_id": "DP123456"
}
```

#### LabCorp

```javascript
// Configuration
const LABCORP_CONFIG = {
  apiUrl: 'https://api.labcorp.com/employer/v1',
  accountNumber: 'LABCORP_ACCOUNT',
  apiKey: 'LABCORP_API_KEY'
};

// Similar API structure to Quest
```

### 5.3 E-Signature Integrations

#### DocuSign Integration

```javascript
// Configuration
const DOCUSIGN_CONFIG = {
  authServer: 'https://account-d.docusign.com',  // or account.docusign.com for prod
  basePath: 'https://demo.docusign.net/restapi',
  accountId: 'DOCUSIGN_ACCOUNT_ID',
  integrationKey: 'DOCUSIGN_INTEGRATION_KEY',
  userId: 'DOCUSIGN_USER_ID',
  privateKey: 'DOCUSIGN_PRIVATE_KEY'  // For JWT auth
};

// Create envelope with template
POST /v2.1/accounts/{accountId}/envelopes
{
  "templateId": "template-id",
  "templateRoles": [
    {
      "email": "driver@email.com",
      "name": "John Smith",
      "roleName": "Driver",
      "tabs": {
        "textTabs": [
          { "tabLabel": "PayRate", "value": "$0.55 CPM" },
          { "tabLabel": "StartDate", "value": "February 1, 2026" }
        ]
      }
    }
  ],
  "status": "sent"
}

// Webhook (Connect) events
{
  "event": "envelope-completed",
  "data": {
    "envelopeId": "...",
    "status": "completed",
    "completedDateTime": "..."
  }
}
```

#### HelloSign (Dropbox Sign) Integration

```javascript
// Configuration
const HELLOSIGN_CONFIG = {
  apiUrl: 'https://api.hellosign.com/v3',
  apiKey: 'HELLOSIGN_API_KEY'
};

// Create signature request
POST /signature_request/send_with_template
{
  "template_id": "template-id",
  "signers": [
    {
      "email_address": "driver@email.com",
      "name": "John Smith",
      "role": "Driver"
    }
  ],
  "custom_fields": [
    { "name": "PayRate", "value": "$0.55 CPM" },
    { "name": "StartDate", "value": "February 1, 2026" }
  ]
}

// Webhook events
{
  "event": {
    "event_type": "signature_request_signed",
    "event_time": "...",
    "signature_request": {
      "signature_request_id": "...",
      "is_complete": true
    }
  }
}
```

---

## 6. UI Mockups

### 6.1 Onboarding Dashboard (Recruiter View)

```
+-------------------------------------------------------------------------+
|  ONBOARDING DASHBOARD                               [+ New Onboarding]  |
+-------------------------------------------------------------------------+
|                                                                         |
|  FILTERS: [All Statuses v] [All Carriers v] [Date Range v]  [Search...] |
|                                                                         |
|  Active Onboardings: 12    |    Pending Documents: 8    |   Ready: 3   |
|                                                                         |
+-------------------------------------------------------------------------+
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | John S.              | ABC Transport    | Documents 3/5  | Day 3  |  |
|  | Status: DOCUMENTS    | Start: Feb 1     | BG: Ordered    |[View]  |  |
|  | [!] Missing: MVR, PSP                   | Drug: Scheduled |        |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | Maria G.             | XYZ Logistics    | Documents 5/5  | Day 5  |  |
|  | Status: BG_PENDING   | Start: Feb 3     | BG: Processing |[View]  |  |
|  | [Clock] Background check ETA: Jan 23    | Drug: Passed    |        |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | Robert T.            | ABC Transport    | Documents 5/5  | Day 7  |  |
|  | Status: READY        | Start: Jan 27    | BG: Passed     |[View]  |  |
|  | [Check] All requirements complete!      | Drug: Passed   |[Start] |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  [Load More...]                                                         |
|                                                                         |
+-------------------------------------------------------------------------+
```

### 6.2 Individual Onboarding Workflow View

```
+-------------------------------------------------------------------------+
|  <- Back to Dashboard          ONBOARDING: John Smith                   |
+-------------------------------------------------------------------------+
|                                                                         |
|  Driver: John Smith              Carrier: ABC Transport                 |
|  Started: Jan 20, 2026           Target Start: Feb 1, 2026              |
|  Recruiter: Sarah Johnson        Days in Process: 3                     |
|                                                                         |
+-------------------------------------------------------------------------+
|                                                                         |
|  OVERALL STATUS:  [=====>            ] 45% Complete                     |
|                                                                         |
+-------------------------------------------------------------------------+
|                                WORKFLOW STEPS                            |
+-------------------------------------------------------------------------+
|                                                                         |
|  1. OFFER LETTER                                        [Check] SIGNED  |
|     Sent: Jan 19  |  Signed: Jan 20  |  [View Signed Document]         |
|                                                                         |
|  -------------------------------------------------------------------- |
|                                                                         |
|  2. DOCUMENT COLLECTION                            [Warning] 3/5 DONE   |
|     +---------------------------------------------------------------+  |
|     | CDL Front        | [Check] Verified   | Jan 20 | [View]       |  |
|     | CDL Back         | [Check] Verified   | Jan 20 | [View]       |  |
|     | MVR              | [!] REQUESTED      |        | [Remind]     |  |
|     | Medical Card     | [Check] Verified   | Jan 21 | [View]       |  |
|     | PSP              | [!] REQUESTED      |        | [Remind]     |  |
|     +---------------------------------------------------------------+  |
|     [Send All Reminders]  |  [Add Custom Document]                     |
|                                                                         |
|  -------------------------------------------------------------------- |
|                                                                         |
|  3. BACKGROUND CHECK                               [Clock] PROCESSING   |
|     Provider: HireRight  |  Package: Standard CDL                      |
|     Ordered: Jan 20      |  ETA: Jan 24                                |
|     Status: Criminal check complete, MVR in progress                   |
|     [View Order Details]                                               |
|                                                                         |
|  -------------------------------------------------------------------- |
|                                                                         |
|  4. DRUG TEST                                      [Check] SCHEDULED    |
|     Provider: Quest Diagnostics                                        |
|     Site: Quest - Dallas Main, 123 Main St                             |
|     Appointment: Jan 23, 2026 @ 9:00 AM                                |
|     Donor Pass: DP123456                                               |
|     [Reschedule]  |  [Cancel]                                          |
|                                                                         |
|  -------------------------------------------------------------------- |
|                                                                         |
|  5. ORIENTATION                                    [Pending] NOT BOOKED |
|     Available after background check completes                         |
|     [Book Orientation ->]  (Unlocks Jan 24)                            |
|                                                                         |
+-------------------------------------------------------------------------+
|                                                                         |
|  ACTIONS:  [Put On Hold]  [Cancel Onboarding]  [Contact Driver]        |
|                                                                         |
+-------------------------------------------------------------------------+
```

### 6.3 Document Upload Portal (Driver View)

```
+-------------------------------------------------------------------------+
|  [LOGO]                   DRIVER DOCUMENT CENTER                        |
+-------------------------------------------------------------------------+
|                                                                         |
|  Welcome, John! Please upload the following documents to complete       |
|  your onboarding with ABC Transport.                                    |
|                                                                         |
|  Questions? Contact Sarah at sarah@abctransport.com                     |
|                                                                         |
+-------------------------------------------------------------------------+
|                                                                         |
|  YOUR CHECKLIST                                 Overall: 3 of 5 Done    |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | [Check] CDL - Front                           Submitted Jan 20   |  |
|  |         Status: Verified                                         |  |
|  +-------------------------------------------------------------------+  |
|  | [Check] CDL - Back                            Submitted Jan 20   |  |
|  |         Status: Verified                                         |  |
|  +-------------------------------------------------------------------+  |
|  | [!] Motor Vehicle Record (MVR)                NOT YET SUBMITTED  |  |
|  |     You can request your MVR from the Texas DPS website.         |  |
|  |     [How to get your MVR]                                        |  |
|  |                                                                   |  |
|  |     [ Drag & drop file here or click to upload ]                 |  |
|  |     Accepted: PDF, JPG, PNG (max 10MB)                           |  |
|  +-------------------------------------------------------------------+  |
|  | [Check] DOT Medical Card                      Submitted Jan 21   |  |
|  |         Status: Verified                                         |  |
|  +-------------------------------------------------------------------+  |
|  | [!] PSP Report                                NOT YET SUBMITTED  |  |
|  |     Request your PSP at psp.fmcsa.dot.gov (~$10 fee)             |  |
|  |     [How to get your PSP]                                        |  |
|  |                                                                   |  |
|  |     [ Drag & drop file here or click to upload ]                 |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  [Need Help?]                                    [Save & Continue Later]|
|                                                                         |
+-------------------------------------------------------------------------+
```

### 6.4 Offer Letter Generator

```
+-------------------------------------------------------------------------+
|  OFFER LETTER GENERATOR                         Driver: John Smith      |
+-------------------------------------------------------------------------+
|                                                                         |
|  SELECT TEMPLATE                                                        |
|  +-------------------------------------------------------------------+  |
|  | (o) Company Driver - OTR          |  ( ) Owner Operator           |  |
|  | ( ) Company Driver - Regional     |  ( ) Lease Purchase           |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  OFFER DETAILS                                                          |
|  +-------------------------------------------------------------------+  |
|  | Pay Rate:         [$0.55    ] CPM    OR   [$____] Per Mile Flat   |  |
|  | Sign-on Bonus:    [$2,500   ]        Paid: [After 90 days v]      |  |
|  | Start Date:       [Feb 1, 2026    ]                               |  |
|  | Position:         [OTR Driver v]                                  |  |
|  | Home Time:        [Every 2-3 weeks v]                             |  |
|  | Truck Assignment: [2024 Freightliner Cascadia v]                  |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  BENEFITS (Included in template)                                        |
|  [x] Health Insurance    [x] 401k          [x] Paid Vacation           |
|  [x] Dental              [x] Vision        [ ] Tuition Reimbursement   |
|                                                                         |
|  ADDITIONAL NOTES                                                       |
|  +-------------------------------------------------------------------+  |
|  | Welcome to the ABC Transport team! We're excited to have you...   |  |
|  |                                                                   |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  PREVIEW                                                                |
|  +-------------------------------------------------------------------+  |
|  |                     ABC TRANSPORT                                 |  |
|  |                   EMPLOYMENT OFFER                                |  |
|  |                                                                   |  |
|  | Dear John Smith,                                                  |  |
|  |                                                                   |  |
|  | We are pleased to offer you the position of OTR Driver...         |  |
|  |                                                                   |  |
|  |               [Scroll for full preview]                           |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  DELIVERY METHOD                                                        |
|  (o) Send via DocuSign (e-signature)                                   |
|  ( ) Send via email (manual signature)                                 |
|                                                                         |
|  [ ] Requires manager approval before sending                          |
|                                                                         |
|  [Cancel]                    [Save Draft]        [Generate & Send ->]  |
|                                                                         |
+-------------------------------------------------------------------------+
```

### 6.5 Orientation Booking (Driver View)

```
+-------------------------------------------------------------------------+
|  BOOK YOUR ORIENTATION                           ABC Transport          |
+-------------------------------------------------------------------------+
|                                                                         |
|  Congratulations on completing your pre-employment requirements!        |
|  Please select an orientation session to complete your onboarding.      |
|                                                                         |
+-------------------------------------------------------------------------+
|                                                                         |
|  SELECT LOCATION                                                        |
|  +-------------------------------------------------------------------+  |
|  | (o) Dallas Terminal - 1234 Industrial Blvd, Dallas, TX            |  |
|  | ( ) Houston Terminal - 5678 Freight Way, Houston, TX              |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  AVAILABLE SESSIONS                                                     |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | Monday, Jan 27, 2026                                              |  |
|  | 8:00 AM - 5:00 PM (1 day)                                         |  |
|  | 8 spots available                                    [Select]     |  |
|  +-------------------------------------------------------------------+  |
|  | Monday, Feb 3, 2026                                               |  |
|  | 8:00 AM - 5:00 PM (1 day)                                         |  |
|  | 12 spots available                                   [Select]     |  |
|  +-------------------------------------------------------------------+  |
|  | Monday, Feb 10, 2026                                              |  |
|  | 8:00 AM - 5:00 PM (1 day)                                         |  |
|  | 15 spots available                                   [Select]     |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  WHAT TO BRING:                                                         |
|  - Valid CDL and DOT Medical Card                                      |
|  - Social Security Card                                                |
|  - Voided check for direct deposit                                     |
|  - Pen for paperwork                                                   |
|                                                                         |
|  Lunch will be provided. Parking is available in Lot B.                |
|                                                                         |
+-------------------------------------------------------------------------+
```

---

## 7. Notification Templates

### 7.1 Document Request Email

```
Subject: Action Required: Complete Your Onboarding Documents - ABC Transport

Hi {driver_first_name},

Welcome to ABC Transport! To complete your onboarding, please upload the
following documents:

Required Documents:
- [ ] CDL (Front and Back)
- [ ] Motor Vehicle Record (MVR)
- [ ] DOT Medical Card
- [ ] PSP Report

Upload your documents here:
{secure_upload_link}

This link expires on {expiration_date}.

Questions? Reply to this email or contact {recruiter_name} at {recruiter_phone}.

Best regards,
{recruiter_name}
ABC Transport Recruiting
```

### 7.2 Document Reminder SMS

```
Hi {driver_first_name}, this is {recruiter_name} from ABC Transport.
You still have documents pending for your onboarding.
Upload them here: {short_link}
```

### 7.3 Background Check Complete

```
Subject: Background Check Complete - ABC Transport Onboarding Update

Hi {driver_first_name},

Great news! Your background check has been completed and cleared.

Next Steps:
{next_steps}

If you have any questions, please contact your recruiter.

Best regards,
ABC Transport Recruiting
```

### 7.4 Drug Test Appointment Confirmation

```
Subject: Your Drug Test Appointment - {appointment_date}

Hi {driver_first_name},

Your drug test has been scheduled:

Date: {appointment_date}
Time: {appointment_time}
Location: {collection_site_name}
Address: {collection_site_address}

Your Donor Pass ID: {donor_pass_id}
(Show this at the collection site)

Important:
- Bring a valid photo ID
- Arrive 15 minutes early
- Drink water normally (don't over-hydrate)

Need to reschedule? Contact {recruiter_name} at {recruiter_phone}.

Best regards,
ABC Transport Recruiting
```

### 7.5 Orientation Confirmation

```
Subject: Orientation Confirmed - ABC Transport - {orientation_date}

Hi {driver_first_name},

Your orientation is confirmed!

Date: {orientation_date}
Time: {start_time} - {end_time}
Location: {location_name}
Address: {location_address}

What to Bring:
- Valid CDL and DOT Medical Card
- Social Security Card
- Voided check for direct deposit
- Pen for paperwork

Lunch will be provided. Please arrive 15 minutes early.

Questions? Contact {recruiter_name} at {recruiter_phone}.

See you there!
ABC Transport Recruiting
```

---

## 8. Security Considerations

### 8.1 Document Upload Security

- **Secure upload links**: Time-limited tokens (48-hour expiry) with single-use option
- **File validation**: Check MIME types, file signatures, max size (10MB)
- **Malware scanning**: Scan uploaded files before storing
- **Encryption**: Files encrypted at rest in Wix Media Manager
- **Access control**: Only recruiter and driver can access their documents

### 8.2 PII Handling

- **SSN handling**: Only last 4 digits stored; full SSN sent directly to background check provider
- **Data minimization**: Only collect data required for the specific check
- **Audit logging**: Log all access to PII with timestamps and user IDs
- **Retention policy**: Delete sensitive documents after configurable period (90 days post-start)

### 8.3 API Security

- **Webhook validation**: HMAC signature verification on all external webhooks
- **Rate limiting**: Prevent abuse of document upload and API endpoints
- **API key rotation**: Regular rotation of external API credentials
- **IP allowlisting**: Restrict webhook sources to known provider IPs

### 8.4 Compliance

- **FCRA compliance**: Proper disclosure and authorization for background checks
- **DOT compliance**: Drug testing follows DOT 49 CFR Part 40
- **E-SIGN Act**: Electronic signatures are legally binding with proper disclosure
- **State-specific rules**: Handle state-specific background check restrictions

---

## 9. Success Metrics

| Metric | Current Baseline | Target | Measurement |
|--------|------------------|--------|-------------|
| Onboarding completion time | 5-7 days | 2-3 days | Offer acceptance to ready-to-start |
| Document collection rate | 65% first attempt | 90% first attempt | Documents received without follow-up |
| Recruiter admin time | 4+ hours/driver | 1.5 hours/driver | Time tracking |
| Compliance errors | 15% incomplete files | <2% | Audit findings |
| Driver drop-off rate | 20% during onboarding | <10% | Cancelled workflows |
| Background check turnaround | 5-7 days | 3-4 days | Order to result |
| Offer acceptance rate | 70% | 80% | Offers sent vs signed |

---

## 10. Open Questions

1. **Provider selection**: Which background check provider should be the default? HireRight has best CDL coverage but Checkr is faster.

2. **Drug test network**: Quest vs LabCorp - which has better coverage in target states (TX, OK, LA)?

3. **E-signature pricing**: DocuSign vs HelloSign - DocuSign has better enterprise features but HelloSign is cheaper for volume.

4. **Multi-carrier recruiters**: How do agency recruiters manage onboarding across multiple carriers with different requirements?

5. **Document retention**: How long should documents be retained? What about drivers who don't complete onboarding?

6. **Integration depth**: Should we push driver data to carrier ATS systems (Tenstreet, etc.) or keep everything in LMDR?

7. **Mobile experience**: Should the document upload portal be a native app or responsive web?
