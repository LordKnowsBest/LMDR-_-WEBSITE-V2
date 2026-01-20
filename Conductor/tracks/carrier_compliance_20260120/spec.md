# Specification: Carrier Compliance - DOT Compliance Management

## 1. Overview

This track implements a comprehensive DOT compliance management suite for carriers, helping them avoid violations, maintain proper documentation, track safety scores, and stay audit-ready. The system integrates with existing FMCSA services and extends carrier functionality to provide proactive compliance management.

### Business Context

| Aspect | Detail |
|--------|--------|
| **Problem** | Carriers face $10,000+ fines per DOT violation; manual tracking leads to missed deadlines |
| **Solution** | Automated compliance calendar, document vault, and real-time CSA monitoring |
| **Revenue Model** | Premium carrier subscription feature (Pro/Enterprise tiers) |
| **Target Users** | Carrier safety managers, fleet managers, compliance officers |
| **Key Metric** | Reduction in compliance-related violations for subscribed carriers |

### Feature Summary

| Feature | Priority | Phase | Value Proposition |
|---------|----------|-------|-------------------|
| Compliance Calendar | P0 | 1 | Never miss drug tests, physicals, or training renewals |
| Document Vault | P0 | 2 | Centralized, audit-ready document storage with expiration tracking |
| Qualification File Tracker | P0 | 3 | FMCSA DQ file completeness per driver |
| CSA Score Monitor | P1 | 4 | Real-time BASIC score tracking and trend alerts |
| Incident Reporting | P1 | 5 | DOT-compliant accident/incident documentation |

---

## 2. Architecture

### 2.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         CARRIER COMPLIANCE MANAGEMENT SYSTEM                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                │
│   │  CARRIER PORTAL │    │  ADMIN PORTAL   │    │  NOTIFICATIONS  │                │
│   │   (Dashboard)   │    │  (Oversight)    │    │  (Email/SMS)    │                │
│   └────────┬────────┘    └────────┬────────┘    └────────┬────────┘                │
│            │                      │                      │                          │
│            └──────────────────────┼──────────────────────┘                          │
│                                   │                                                  │
│                                   ▼                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────────┐  │
│   │                        COMPLIANCE SERVICE LAYER                              │  │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│   │  │ complianceCalendarService.jsw │  │ documentVaultService.jsw       │    │  │
│   │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │  │
│   │  │ dqFileService.jsw             │  │ csaMonitorService.jsw          │    │  │
│   │  └──────────────┘  └──────────────┘  └──────────────┘                      │  │
│   │  ┌──────────────┐                                                          │  │
│   │  │ incidentService.jsw                                                │    │  │
│   │  └──────────────┘                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────────┘  │
│                                   │                                                  │
│                                   ▼                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────────┐  │
│   │                          DATA LAYER (Wix Collections)                        │  │
│   │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                    │  │
│   │  │ComplianceEvents│  │CarrierDocuments│  │QualificationFiles│               │  │
│   │  └───────────────┘  └───────────────┘  └───────────────┘                    │  │
│   │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                    │  │
│   │  │ CSAScoreHistory│  │IncidentReports │  │ComplianceAlerts│                 │  │
│   │  └───────────────┘  └───────────────┘  └───────────────┘                    │  │
│   └─────────────────────────────────────────────────────────────────────────────┘  │
│                                   │                                                  │
│                                   ▼                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────────┐  │
│   │                          EXTERNAL INTEGRATIONS                               │  │
│   │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                    │  │
│   │  │fmcsaService.jsw│  │emailService.jsw│  │Wix Media Manager│                │  │
│   │  │  (Extended)    │  │  (SMS TBD)     │  │  (Documents)   │                  │  │
│   │  └───────────────┘  └───────────────┘  └───────────────┘                    │  │
│   └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow - Compliance Calendar

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│                         COMPLIANCE EVENT LIFECYCLE                                  │
├────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌───────────────┐                                                                 │
│  │ Event Created │  (Manual entry or automated from document upload)               │
│  └───────┬───────┘                                                                 │
│          │                                                                          │
│          ▼                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐             │
│  │                    SCHEDULER (jobs.config)                         │             │
│  │  Runs daily at 6 AM: processComplianceReminders()                 │             │
│  └───────┬───────────────────────────────────────────────────────────┘             │
│          │                                                                          │
│          ▼                                                                          │
│  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐                     │
│  │ 30-Day Warning│ ──► │ 14-Day Warning│ ──► │ 7-Day Warning │                     │
│  │    (Email)    │     │ (Email + SMS) │     │(Email+SMS+App)│                     │
│  └───────────────┘     └───────────────┘     └───────────────┘                     │
│          │                                                                          │
│          ▼                                                                          │
│  ┌───────────────┐     ┌───────────────┐                                           │
│  │  Due Date     │ ──► │   Overdue     │  (Escalation to carrier admin)            │
│  │  (All alerts) │     │   (Daily)     │                                           │
│  └───────────────┘     └───────────────┘                                           │
│          │                                                                          │
│          ▼                                                                          │
│  ┌───────────────┐                                                                 │
│  │  Completed    │  (User marks complete, uploads new document)                    │
│  └───────────────┘                                                                 │
│                                                                                     │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Feature Interaction Diagram

```
                    ┌─────────────────────────────────────────┐
                    │           CARRIER DASHBOARD              │
                    │  ┌─────────────────────────────────────┐│
                    │  │ Compliance Score: 94% ████████████░ ││
                    │  └─────────────────────────────────────┘│
                    └──────────────────┬──────────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│   COMPLIANCE         │  │   DOCUMENT           │  │   DQ FILE            │
│   CALENDAR           │  │   VAULT              │  │   TRACKER            │
│                      │  │                      │  │                      │
│ • Drug tests (45)    │◄─┤ • CDL copies         │──┤ • Driver: John D.    │
│ • Physicals (23)     │  │ • Medical cards      │  │   ☑ CDL copy         │
│ • Training (12)      │  │ • Drug test results  │  │   ☑ Medical card     │
│ • HAZMAT (8)         │  │ • MVR reports        │  │   ☐ Drug test        │
│                      │  │ • Employment apps    │  │   ☑ Road test cert   │
│ [Due this week: 5]   │  │                      │  │   [82% complete]     │
└──────────┬───────────┘  └──────────┬───────────┘  └──────────┬───────────┘
           │                         │                         │
           │                         │                         │
           ▼                         ▼                         ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│   CSA SCORE          │  │   INCIDENT           │  │   COMPLIANCE         │
│   MONITOR            │  │   REPORTING          │  │   ALERTS             │
│                      │  │                      │  │                      │
│ Unsafe Driving: 45%  │  │ • Log accident       │  │ ⚠ 3 drug tests due  │
│ HOS: 32%             │  │ • Investigation      │  │ ⚠ CSA score +5%     │
│ Driver Fitness: 28%  │  │ • DOT reportable?    │  │ ⚠ 2 expired CDLs    │
│ [Trend: ▲ +3% MTD]   │  │ • Corrective action  │  │                      │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

---

## 3. Data Model

### 3.1 ComplianceEvents (New Collection)

| Field | Type | Description | Index |
|-------|------|-------------|-------|
| `_id` | String | Primary key | PK |
| `carrier_dot` | String | Carrier DOT number | Y |
| `driver_id` | Reference | Link to DriverProfiles | Y |
| `event_type` | String | Type of compliance event (see below) | Y |
| `event_category` | String | `medical`, `testing`, `training`, `license`, `vehicle` | Y |
| `title` | String | Display title (e.g., "Annual Physical - John Doe") | |
| `description` | Text | Additional notes | |
| `due_date` | Date | When the item is due | Y |
| `completed_date` | Date | When marked complete | |
| `status` | String | `pending`, `upcoming`, `due_soon`, `overdue`, `completed` | Y |
| `document_id` | Reference | Link to CarrierDocuments (proof of completion) | |
| `reminder_30_sent` | Boolean | 30-day reminder sent | |
| `reminder_14_sent` | Boolean | 14-day reminder sent | |
| `reminder_7_sent` | Boolean | 7-day reminder sent | |
| `reminder_due_sent` | Boolean | Due date reminder sent | |
| `recurrence` | Object | `{ type: 'annual'|'biennial'|'custom', interval_days: N }` | |
| `auto_renew` | Boolean | Auto-create next event on completion | |
| `assigned_to` | String | User responsible for this item | |
| `priority` | String | `critical`, `high`, `normal`, `low` | |
| `_createdDate` | DateTime | Created timestamp | |
| `_updatedDate` | DateTime | Last updated | |

**Event Types:**
- `drug_test_random` - Random drug test
- `drug_test_pre_employment` - Pre-employment drug test
- `drug_test_post_accident` - Post-accident drug test
- `drug_test_reasonable_suspicion` - Reasonable suspicion drug test
- `physical_annual` - Annual DOT physical
- `physical_renewal` - Physical card renewal
- `cdl_renewal` - CDL license renewal
- `cdl_medical_cert` - Medical certificate renewal
- `hazmat_endorsement` - HAZMAT endorsement renewal
- `training_safety` - Annual safety training
- `training_hazmat` - HAZMAT training
- `training_defensive_driving` - Defensive driving course
- `mvr_annual` - Annual MVR pull
- `vehicle_inspection` - Annual vehicle inspection
- `insurance_renewal` - Insurance policy renewal

### 3.2 CarrierDocuments (New Collection)

| Field | Type | Description | Index |
|-------|------|-------------|-------|
| `_id` | String | Primary key | PK |
| `carrier_dot` | String | Carrier DOT number | Y |
| `driver_id` | Reference | Link to DriverProfiles (if driver-specific) | Y |
| `document_type` | String | Type of document (see below) | Y |
| `document_category` | String | `license`, `medical`, `testing`, `employment`, `training`, `vehicle` | Y |
| `title` | String | Document title | |
| `file_url` | URL | Wix Media Manager URL | |
| `file_name` | String | Original file name | |
| `file_size` | Number | Size in bytes | |
| `mime_type` | String | File MIME type | |
| `issue_date` | Date | Document issue date | |
| `expiration_date` | Date | Document expiration date | Y |
| `is_expired` | Boolean | Computed: expiration_date < today | Y |
| `days_until_expiry` | Number | Computed: expiration_date - today | |
| `version` | Number | Version number (for version history) | |
| `previous_version_id` | Reference | Link to previous version | |
| `status` | String | `active`, `expired`, `superseded`, `archived` | Y |
| `verification_status` | String | `pending`, `verified`, `rejected` | |
| `verified_by` | String | User who verified | |
| `verified_date` | DateTime | Verification timestamp | |
| `notes` | Text | Admin notes | |
| `tags` | Array | Custom tags for organization | |
| `_owner` | String | Uploader member ID | |
| `_createdDate` | DateTime | Upload timestamp | |
| `_updatedDate` | DateTime | Last modified | |

**Document Types:**
- `cdl_front` - CDL front image
- `cdl_back` - CDL back image
- `medical_card` - DOT medical card
- `medical_exam_long_form` - Medical examiner's long form
- `drug_test_result` - Drug test result document
- `alcohol_test_result` - Alcohol test result
- `mvr_report` - Motor vehicle record
- `employment_application` - Employment application
- `road_test_certificate` - Road test certification
- `annual_review_certification` - Annual review of driving record
- `training_certificate` - Training completion certificate
- `hazmat_certificate` - HAZMAT training certificate
- `vehicle_inspection_report` - Annual inspection report
- `insurance_certificate` - Insurance certificate
- `ifta_permit` - IFTA permit
- `irp_registration` - IRP registration

### 3.3 QualificationFiles (New Collection)

| Field | Type | Description | Index |
|-------|------|-------------|-------|
| `_id` | String | Primary key | PK |
| `carrier_dot` | String | Carrier DOT number | Y |
| `driver_id` | Reference | Link to DriverProfiles | Y |
| `driver_name` | String | Denormalized for display | |
| `completeness_score` | Number | 0-100 percentage complete | Y |
| `status` | String | `incomplete`, `complete`, `audit_ready` | Y |
| `last_audit_date` | Date | Last time DQ file was audited | |
| `checklist` | Object | See checklist schema below | |
| `missing_items` | Array | List of missing required documents | |
| `expiring_soon` | Array | Documents expiring in next 30 days | |
| `alerts` | Array | Active compliance alerts for this driver | |
| `_createdDate` | DateTime | Created timestamp | |
| `_updatedDate` | DateTime | Last updated | Y |

**Checklist Schema (FMCSA Required DQ File Items):**
```javascript
{
  // Required at hire
  employment_application: { required: true, document_id: null, status: 'missing' },
  inquiry_previous_employers: { required: true, document_id: null, status: 'missing' },
  driving_record_review: { required: true, document_id: null, status: 'missing' },
  road_test_certificate: { required: true, document_id: null, status: 'missing' },
  cdl_copy: { required: true, document_id: null, status: 'valid', expires: '2027-05-15' },
  medical_certificate: { required: true, document_id: null, status: 'valid', expires: '2027-01-20' },

  // Required annually
  annual_driving_record_review: { required: true, document_id: null, status: 'due', due_date: '2026-03-01' },
  annual_mvr: { required: true, document_id: null, status: 'valid' },

  // Drug & Alcohol
  pre_employment_drug_test: { required: true, document_id: null, status: 'valid' },
  pre_employment_alcohol_test: { required: false, document_id: null, status: 'valid' },
  random_testing_records: { required: true, document_id: null, status: 'valid' },
  clearinghouse_query: { required: true, document_id: null, status: 'valid', last_query: '2025-12-15' },

  // Optional based on carrier
  hazmat_training: { required: false, document_id: null, status: 'n/a' },
  entry_level_driver_training: { required: false, document_id: null, status: 'valid' }
}
```

### 3.4 CSAScoreHistory (New Collection)

| Field | Type | Description | Index |
|-------|------|-------------|-------|
| `_id` | String | Primary key | PK |
| `carrier_dot` | String | Carrier DOT number | Y |
| `snapshot_date` | Date | Date of this snapshot | Y |
| `overall_percentile` | Number | Calculated overall risk percentile | |
| `basics` | Object | All BASIC scores at this point | |
| `alerts_active` | Array | Which BASICs were in alert status | |
| `inspections_30_day` | Number | Inspections in last 30 days | |
| `violations_30_day` | Number | Violations in last 30 days | |
| `crashes_30_day` | Number | Crashes in last 30 days | |
| `trend_vs_prior` | Object | Change from prior snapshot | |
| `source` | String | `scheduled`, `manual`, `incident_triggered` | |
| `_createdDate` | DateTime | Record created | |

**BASICS Object Schema:**
```javascript
{
  unsafe_driving: { percentile: 45, alert: false, threshold: 65, change: -3 },
  hours_of_service: { percentile: 32, alert: false, threshold: 65, change: +2 },
  driver_fitness: { percentile: 28, alert: false, threshold: 80, change: 0 },
  drugs_alcohol: { percentile: 0, alert: false, threshold: 80, change: 0 },
  vehicle_maintenance: { percentile: 51, alert: false, threshold: 80, change: +5 },
  hazmat: { percentile: null, alert: false, threshold: 80, change: null },
  crash_indicator: { percentile: 38, alert: false, threshold: 65, change: -2 }
}
```

### 3.5 IncidentReports (New Collection)

| Field | Type | Description | Index |
|-------|------|-------------|-------|
| `_id` | String | Primary key | PK |
| `carrier_dot` | String | Carrier DOT number | Y |
| `incident_number` | String | Unique incident reference number | Y |
| `incident_type` | String | `accident`, `injury`, `near_miss`, `violation`, `breakdown` | Y |
| `incident_date` | DateTime | When incident occurred | Y |
| `reported_date` | DateTime | When reported in system | |
| `driver_id` | Reference | Link to DriverProfiles | Y |
| `driver_name` | String | Denormalized | |
| `vehicle_id` | String | Vehicle unit number | |
| `location` | Object | `{ address, city, state, lat, lng }` | |
| `description` | Text | Detailed incident description | |
| `severity` | String | `minor`, `moderate`, `major`, `critical` | Y |
| `dot_reportable` | Boolean | Meets DOT reporting threshold | Y |
| `dot_report_status` | String | `not_required`, `pending`, `submitted`, `confirmed` | |
| `dot_report_date` | Date | When submitted to DOT | |
| `injuries` | Object | `{ count, fatalities, descriptions }` | |
| `property_damage` | Object | `{ estimated_cost, description }` | |
| `tow_required` | Boolean | Was tow-away required | |
| `hazmat_release` | Boolean | Hazmat release occurred | |
| `police_report_number` | String | Police report reference | |
| `insurance_claim_number` | String | Insurance claim reference | |
| `investigation_status` | String | `pending`, `in_progress`, `completed`, `closed` | Y |
| `investigation_findings` | Text | Investigation summary | |
| `root_cause` | String | Root cause category | |
| `corrective_actions` | Array | List of corrective actions taken | |
| `photos` | Array | Array of document IDs for photos | |
| `documents` | Array | Array of related document IDs | |
| `witness_statements` | Array | Witness information and statements | |
| `assigned_investigator` | String | User assigned to investigate | |
| `_owner` | String | Reporter member ID | |
| `_createdDate` | DateTime | Record created | |
| `_updatedDate` | DateTime | Last updated | Y |

**DOT Reportable Criteria:**
An incident is DOT reportable if it results in:
- A fatality
- An injury requiring immediate medical treatment away from scene
- A vehicle being towed (disabling damage)

### 3.6 ComplianceAlerts (New Collection)

| Field | Type | Description | Index |
|-------|------|-------------|-------|
| `_id` | String | Primary key | PK |
| `carrier_dot` | String | Carrier DOT number | Y |
| `alert_type` | String | `expiring_document`, `overdue_event`, `csa_change`, `dq_incomplete` | Y |
| `severity` | String | `info`, `warning`, `critical` | Y |
| `title` | String | Alert title | |
| `message` | Text | Alert message | |
| `related_entity_type` | String | `driver`, `document`, `event`, `csa_score` | |
| `related_entity_id` | String | ID of related entity | |
| `status` | String | `active`, `acknowledged`, `resolved`, `dismissed` | Y |
| `acknowledged_by` | String | User who acknowledged | |
| `acknowledged_date` | DateTime | When acknowledged | |
| `resolved_date` | DateTime | When resolved | |
| `auto_resolve_on` | Date | Auto-resolve date (for time-sensitive alerts) | |
| `_createdDate` | DateTime | Alert created | |
| `_updatedDate` | DateTime | Last updated | |

---

## 4. API Design

### 4.1 complianceCalendarService.jsw

```javascript
// ============================================================
// COMPLIANCE EVENTS - CRUD
// ============================================================

/**
 * Get all compliance events for a carrier
 * @param {string} carrierDot - Carrier DOT number
 * @param {Object} filters - { status, category, driverId, dateRange }
 * @returns {Promise<Array>} - List of compliance events
 */
export async function getComplianceEvents(carrierDot, filters = {})

/**
 * Create a new compliance event
 * @param {Object} eventData - Event details
 * @returns {Promise<Object>} - Created event
 */
export async function createComplianceEvent(eventData)

/**
 * Update a compliance event
 * @param {string} eventId - Event ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated event
 */
export async function updateComplianceEvent(eventId, updates)

/**
 * Mark event as completed
 * @param {string} eventId - Event ID
 * @param {string} documentId - Optional proof document
 * @returns {Promise<Object>} - Updated event with next occurrence if recurring
 */
export async function completeComplianceEvent(eventId, documentId = null)

/**
 * Delete a compliance event
 * @param {string} eventId - Event ID
 * @returns {Promise<boolean>} - Success
 */
export async function deleteComplianceEvent(eventId)

// ============================================================
// CALENDAR VIEWS
// ============================================================

/**
 * Get calendar data for a date range
 * @param {string} carrierDot - Carrier DOT number
 * @param {Date} startDate - Range start
 * @param {Date} endDate - Range end
 * @returns {Promise<Object>} - { events: [], summary: { overdue, dueSoon, upcoming } }
 */
export async function getCalendarView(carrierDot, startDate, endDate)

/**
 * Get dashboard summary of compliance status
 * @param {string} carrierDot - Carrier DOT number
 * @returns {Promise<Object>} - { score, overdueCount, dueSoonCount, alerts }
 */
export async function getComplianceDashboard(carrierDot)

// ============================================================
// REMINDERS (Called by scheduled job)
// ============================================================

/**
 * Process all compliance reminders for all carriers
 * Called by jobs.config scheduler daily
 * @returns {Promise<Object>} - { processed, emailsSent, smssSent }
 */
export async function processComplianceReminders()

/**
 * Get upcoming items for a driver (for driver portal)
 * @param {string} driverId - Driver ID
 * @returns {Promise<Array>} - Upcoming compliance items
 */
export async function getDriverComplianceItems(driverId)
```

### 4.2 documentVaultService.jsw

```javascript
// ============================================================
// DOCUMENT MANAGEMENT
// ============================================================

/**
 * Upload a document to the vault
 * @param {string} carrierDot - Carrier DOT number
 * @param {Object} documentData - { type, category, file, driverId, expirationDate, etc. }
 * @returns {Promise<Object>} - Created document record
 */
export async function uploadDocument(carrierDot, documentData)

/**
 * Get all documents for a carrier
 * @param {string} carrierDot - Carrier DOT number
 * @param {Object} filters - { category, type, driverId, status, expired }
 * @returns {Promise<Array>} - List of documents
 */
export async function getDocuments(carrierDot, filters = {})

/**
 * Get a single document by ID
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} - Document with signed URL
 */
export async function getDocument(documentId)

/**
 * Update document metadata
 * @param {string} documentId - Document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated document
 */
export async function updateDocument(documentId, updates)

/**
 * Upload a new version of an existing document
 * @param {string} documentId - Original document ID
 * @param {Object} newVersionData - New file and metadata
 * @returns {Promise<Object>} - New version document
 */
export async function uploadNewVersion(documentId, newVersionData)

/**
 * Get version history for a document
 * @param {string} documentId - Document ID
 * @returns {Promise<Array>} - All versions of document
 */
export async function getDocumentVersionHistory(documentId)

/**
 * Archive a document (soft delete)
 * @param {string} documentId - Document ID
 * @returns {Promise<boolean>} - Success
 */
export async function archiveDocument(documentId)

// ============================================================
// EXPIRATION TRACKING
// ============================================================

/**
 * Get documents expiring within a date range
 * @param {string} carrierDot - Carrier DOT number
 * @param {number} daysAhead - Days to look ahead
 * @returns {Promise<Array>} - Expiring documents
 */
export async function getExpiringDocuments(carrierDot, daysAhead = 30)

/**
 * Get all expired documents
 * @param {string} carrierDot - Carrier DOT number
 * @returns {Promise<Array>} - Expired documents
 */
export async function getExpiredDocuments(carrierDot)

// ============================================================
// VERIFICATION
// ============================================================

/**
 * Verify a document (admin action)
 * @param {string} documentId - Document ID
 * @param {string} verifierId - Verifying user ID
 * @param {string} status - 'verified' or 'rejected'
 * @param {string} notes - Verification notes
 * @returns {Promise<Object>} - Updated document
 */
export async function verifyDocument(documentId, verifierId, status, notes = '')
```

### 4.3 dqFileService.jsw

```javascript
// ============================================================
// DQ FILE MANAGEMENT
// ============================================================

/**
 * Get or create DQ file tracker for a driver
 * @param {string} carrierDot - Carrier DOT number
 * @param {string} driverId - Driver ID
 * @returns {Promise<Object>} - DQ file tracker with checklist
 */
export async function getDQFile(carrierDot, driverId)

/**
 * Get all DQ files for a carrier
 * @param {string} carrierDot - Carrier DOT number
 * @param {Object} filters - { status, minCompleteness }
 * @returns {Promise<Array>} - List of DQ files with completeness
 */
export async function getCarrierDQFiles(carrierDot, filters = {})

/**
 * Update DQ file checklist item
 * @param {string} dqFileId - DQ file ID
 * @param {string} itemKey - Checklist item key
 * @param {Object} itemData - { document_id, status, notes }
 * @returns {Promise<Object>} - Updated DQ file
 */
export async function updateDQChecklistItem(dqFileId, itemKey, itemData)

/**
 * Link a document to a DQ file checklist item
 * @param {string} dqFileId - DQ file ID
 * @param {string} itemKey - Checklist item key
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} - Updated DQ file
 */
export async function linkDocumentToDQItem(dqFileId, itemKey, documentId)

/**
 * Calculate completeness score for a DQ file
 * @param {Object} dqFile - DQ file record
 * @returns {number} - Completeness percentage 0-100
 */
export function calculateCompleteness(dqFile)

/**
 * Get audit-ready report for a DQ file
 * @param {string} dqFileId - DQ file ID
 * @returns {Promise<Object>} - Formatted audit report
 */
export async function generateAuditReport(dqFileId)

/**
 * Get DQ file summary for carrier dashboard
 * @param {string} carrierDot - Carrier DOT number
 * @returns {Promise<Object>} - { totalDrivers, completeFiles, incompleteFiles, avgCompleteness }
 */
export async function getDQFileSummary(carrierDot)
```

### 4.4 csaMonitorService.jsw

```javascript
// ============================================================
// CSA SCORE MONITORING (Extends fmcsaService.jsw)
// ============================================================

/**
 * Get current CSA scores with trend analysis
 * @param {string} carrierDot - Carrier DOT number
 * @returns {Promise<Object>} - Current scores with trends
 */
export async function getCSAScoresWithTrends(carrierDot)

/**
 * Get CSA score history for charting
 * @param {string} carrierDot - Carrier DOT number
 * @param {number} months - Number of months of history
 * @returns {Promise<Array>} - Historical snapshots
 */
export async function getCSAScoreHistory(carrierDot, months = 12)

/**
 * Take a snapshot of current CSA scores
 * @param {string} carrierDot - Carrier DOT number
 * @param {string} source - 'scheduled', 'manual', 'incident_triggered'
 * @returns {Promise<Object>} - New snapshot record
 */
export async function snapshotCSAScores(carrierDot, source = 'manual')

/**
 * Process all carriers for CSA score updates
 * Called by jobs.config scheduler weekly
 * @returns {Promise<Object>} - { processed, alertsGenerated }
 */
export async function processCSAScoreUpdates()

/**
 * Get CSA alerts for significant changes
 * @param {string} carrierDot - Carrier DOT number
 * @returns {Promise<Array>} - Active CSA-related alerts
 */
export async function getCSAAlerts(carrierDot)

/**
 * Generate CSA improvement recommendations
 * @param {string} carrierDot - Carrier DOT number
 * @returns {Promise<Array>} - AI-generated recommendations based on scores
 */
export async function getCSARecommendations(carrierDot)
```

### 4.5 incidentService.jsw

```javascript
// ============================================================
// INCIDENT REPORTING
// ============================================================

/**
 * Create a new incident report
 * @param {Object} incidentData - Incident details
 * @returns {Promise<Object>} - Created incident with generated incident number
 */
export async function createIncidentReport(incidentData)

/**
 * Get incident by ID
 * @param {string} incidentId - Incident ID
 * @returns {Promise<Object>} - Full incident record
 */
export async function getIncidentReport(incidentId)

/**
 * Get all incidents for a carrier
 * @param {string} carrierDot - Carrier DOT number
 * @param {Object} filters - { type, severity, dateRange, driverId, status }
 * @returns {Promise<Array>} - List of incidents
 */
export async function getIncidentReports(carrierDot, filters = {})

/**
 * Update an incident report
 * @param {string} incidentId - Incident ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated incident
 */
export async function updateIncidentReport(incidentId, updates)

/**
 * Classify if incident is DOT reportable
 * @param {Object} incidentData - Incident details
 * @returns {Object} - { reportable: boolean, reason: string, deadline: Date }
 */
export function classifyDOTReportability(incidentData)

/**
 * Mark incident as reported to DOT
 * @param {string} incidentId - Incident ID
 * @param {string} reportNumber - DOT report confirmation number
 * @returns {Promise<Object>} - Updated incident
 */
export async function markDOTReported(incidentId, reportNumber)

// ============================================================
// INVESTIGATION WORKFLOW
// ============================================================

/**
 * Start investigation on an incident
 * @param {string} incidentId - Incident ID
 * @param {string} investigatorId - Assigned investigator
 * @returns {Promise<Object>} - Updated incident
 */
export async function startInvestigation(incidentId, investigatorId)

/**
 * Add investigation finding
 * @param {string} incidentId - Incident ID
 * @param {Object} finding - { description, rootCause, correctiveActions }
 * @returns {Promise<Object>} - Updated incident
 */
export async function addInvestigationFinding(incidentId, finding)

/**
 * Close investigation
 * @param {string} incidentId - Incident ID
 * @param {Object} summary - Final investigation summary
 * @returns {Promise<Object>} - Updated incident
 */
export async function closeInvestigation(incidentId, summary)

/**
 * Add corrective action to incident
 * @param {string} incidentId - Incident ID
 * @param {Object} action - { description, assignedTo, dueDate }
 * @returns {Promise<Object>} - Updated incident
 */
export async function addCorrectiveAction(incidentId, action)

/**
 * Get incident statistics for reporting
 * @param {string} carrierDot - Carrier DOT number
 * @param {Object} dateRange - { start, end }
 * @returns {Promise<Object>} - Incident statistics
 */
export async function getIncidentStatistics(carrierDot, dateRange)
```

---

## 5. UI Components

### 5.1 Compliance Calendar Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  COMPLIANCE CALENDAR                                              [+ Add Event]     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────┐  ┌──────────────────────────────────────────────┐  │
│  │     COMPLIANCE SCORE       │  │  QUICK STATS                                  │  │
│  │                            │  │                                               │  │
│  │         94%                │  │  ⚠️ 3 Overdue    |  📅 12 Due This Week      │  │
│  │     ███████████████░░      │  │  ⏰ 8 Due Soon   |  ✅ 45 Up to Date         │  │
│  │                            │  │                                               │  │
│  │     Good Standing          │  │  [View All Overdue] [View Calendar]          │  │
│  └────────────────────────────┘  └──────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  UPCOMING ITEMS                                            [Filter ▼]       │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                              │   │
│  │  🔴 OVERDUE                                                                  │   │
│  │  ├── Drug Test - Mike Johnson          Due: Jan 15    [Mark Complete]       │   │
│  │  ├── Annual Physical - Sarah Davis     Due: Jan 18    [Mark Complete]       │   │
│  │  └── MVR Pull - Tom Wilson             Due: Jan 19    [Mark Complete]       │   │
│  │                                                                              │   │
│  │  🟡 DUE THIS WEEK                                                            │   │
│  │  ├── CDL Renewal - John Smith          Due: Jan 22    [Mark Complete]       │   │
│  │  ├── HAZMAT Training - Alex Brown      Due: Jan 23    [Mark Complete]       │   │
│  │  ├── Drug Test - Emily Clark           Due: Jan 24    [Mark Complete]       │   │
│  │  └── + 9 more items                                                          │   │
│  │                                                                              │   │
│  │  🟢 UPCOMING (Next 30 Days)                                                  │   │
│  │  ├── Annual Physical - 8 drivers       Due: Feb 1-15  [View All]            │   │
│  │  ├── Safety Training - 12 drivers      Due: Feb 10    [View All]            │   │
│  │  └── Random Drug Testing Pool - Q1     Due: Feb 28    [Schedule]            │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Document Vault

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  DOCUMENT VAULT                          [Upload Document]  [Bulk Upload]           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Category: [All Categories ▼]  Driver: [All Drivers ▼]  Status: [Active ▼]         │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  ⚠️ 5 DOCUMENTS EXPIRING SOON                      [View Expiring Documents]        │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  📁 LICENSES & CERTIFICATIONS                                    14 files   │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │  │  Document              │ Driver        │ Expires    │ Status   │ Actions │   │
│  │  ├────────────────────────┼───────────────┼────────────┼──────────┼─────────┤   │
│  │  │  CDL - Class A         │ John Smith    │ Mar 2027   │ ✅ Valid │ [⋯]    │   │
│  │  │  CDL - Class A         │ Sarah Davis   │ Jan 2026   │ ⚠️ Soon  │ [⋯]    │   │
│  │  │  HAZMAT Endorsement    │ Mike Johnson  │ Jun 2027   │ ✅ Valid │ [⋯]    │   │
│  │  │  TWIC Card             │ Alex Brown    │ Feb 2028   │ ✅ Valid │ [⋯]    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  📁 MEDICAL CERTIFICATES                                         22 files   │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │  │  DOT Medical Card      │ John Smith    │ Jun 2027   │ ✅ Valid │ [⋯]    │   │
│  │  │  DOT Medical Card      │ Tom Wilson    │ Jan 2026   │ 🔴 Exp'd │ [⋯]    │   │
│  │  │  Long Form             │ Sarah Davis   │ --         │ ✅ Valid │ [⋯]    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  📁 DRUG & ALCOHOL TESTING                                       45 files   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  📁 EMPLOYMENT RECORDS                                           38 files   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Driver Qualification File Tracker

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  DQ FILE TRACKER                                      [Export All]  [Audit Mode]    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Search: [________________________]     Status: [All ▼]     Sort: [Completeness ▼]  │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  SUMMARY                                                                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │   │
│  │  │ 45 Drivers  │ │ 38 Complete │ │ 7 Incomplete│ │ Avg: 92%    │           │   │
│  │  │   Total     │ │   (84%)     │ │   (16%)     │ │ Completeness│           │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  │ Driver           │ Completeness    │ Missing Items │ Expiring │ Status  │   │
│  │  ├──────────────────┼─────────────────┼───────────────┼──────────┼─────────┤   │
│  │  │ John Smith       │ ████████████ 100%│ 0            │ 0        │ ✅ Ready│   │
│  │  │ Sarah Davis      │ ████████████ 100%│ 0            │ 1        │ ⚠️ Soon │   │
│  │  │ Mike Johnson     │ █████████░░░  82%│ 2            │ 0        │ 🔴 Inc. │   │
│  │  │ Tom Wilson       │ ███████░░░░░  64%│ 4            │ 2        │ 🔴 Inc. │   │
│  │  │ Alex Brown       │ ████████████ 100%│ 0            │ 0        │ ✅ Ready│   │
│  │  │ Emily Clark      │ ██████████░░  91%│ 1            │ 0        │ ⚠️ Inc. │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  📋 DQ FILE DETAILS: Mike Johnson                            [Expand All]   │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                              │   │
│  │  ☑ Employment Application         📄 Uploaded Jan 5, 2024                   │   │
│  │  ☑ Previous Employer Inquiry      📄 Uploaded Jan 8, 2024                   │   │
│  │  ☑ CDL Copy                       📄 Valid until Mar 2027                   │   │
│  │  ☑ Medical Certificate            📄 Valid until Jun 2027                   │   │
│  │  ☑ Road Test Certificate          📄 Uploaded Jan 10, 2024                  │   │
│  │  ☑ Pre-Employment Drug Test       📄 Negative - Jan 4, 2024                 │   │
│  │  ☐ Annual Driving Record Review   ⚠️ DUE: Feb 1, 2026      [Upload]        │   │
│  │  ☐ Annual MVR                     ⚠️ DUE: Feb 1, 2026      [Upload]        │   │
│  │  ☑ Random Testing Records         📄 Last: Dec 15, 2025                     │   │
│  │  ☑ Clearinghouse Query            📄 Last: Dec 10, 2025                     │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 CSA Score Monitor

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  CSA SCORE MONITOR                                    [Refresh Scores]  [History]   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Last Updated: Jan 20, 2026 6:00 AM                    Data Source: FMCSA SAFER     │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  BASIC SCORES OVERVIEW                                                       │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                              │   │
│  │  Unsafe Driving          ████████░░░░░░░░░░░░  45%  (▼ -3% vs last month)  │   │
│  │                          Threshold: 65%                            ✅ OK     │   │
│  │                                                                              │   │
│  │  Hours-of-Service        ██████░░░░░░░░░░░░░░  32%  (▲ +2% vs last month)  │   │
│  │                          Threshold: 65%                            ✅ OK     │   │
│  │                                                                              │   │
│  │  Driver Fitness          █████░░░░░░░░░░░░░░░  28%  (— no change)          │   │
│  │                          Threshold: 80%                            ✅ OK     │   │
│  │                                                                              │   │
│  │  Drugs & Alcohol         ░░░░░░░░░░░░░░░░░░░░   0%  (— no change)          │   │
│  │                          Threshold: 80%                            ✅ OK     │   │
│  │                                                                              │   │
│  │  Vehicle Maintenance     ██████████░░░░░░░░░░  51%  (▲ +5% vs last month)  │   │
│  │                          Threshold: 80%                            ⚠️ Watch  │   │
│  │                                                                              │   │
│  │  Crash Indicator         ███████░░░░░░░░░░░░░  38%  (▼ -2% vs last month)  │   │
│  │                          Threshold: 65%                            ✅ OK     │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  12-MONTH TREND                                                              │   │
│  │                                                                              │   │
│  │  60% ┤                                                                       │   │
│  │      │     ╭─╮                                                              │   │
│  │  50% ┤    ╭╯ ╰╮     ╭───╮                               ╭╮                  │   │
│  │      │   ╭╯   ╰─────╯   ╰───────────────────────────────╯╰─ Vehicle Maint.  │   │
│  │  40% ┤  ╭╯                                                                   │   │
│  │      │ ╭╯     ╭─────────────────────────────────────────────── Unsafe Drv.  │   │
│  │  30% ┤╭╯─────╯                                                               │   │
│  │      │╯       ╭───────────────────────────────────────────────── HOS        │   │
│  │  20% ┤───────╯                                                               │   │
│  │      └────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────           │   │
│  │          Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec  Jan          │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  📊 RECOMMENDATIONS                                                          │   │
│  │                                                                              │   │
│  │  ⚠️ Vehicle Maintenance score increased 5% this month. Review recent        │   │
│  │     inspections for common violations. Consider pre-trip inspection         │   │
│  │     training refresher.                                                     │   │
│  │                                                                              │   │
│  │  ✅ Unsafe Driving trending down - good progress on driver coaching.        │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.5 Incident Reporting Form

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  INCIDENT REPORT                                                  [Save as Draft]   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  INCIDENT DETAILS                                                                    │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  Incident Type: [ Accident ▼ ]              Date/Time: [ 01/20/2026 ] [ 14:30 ]    │
│                                                                                      │
│  Driver: [ Select Driver... ▼ ]             Vehicle #: [ 1247 ]                    │
│                                                                                      │
│  Location:                                                                           │
│  Address: [ I-95 Northbound, Mile Marker 42__________________________ ]            │
│  City: [ Jacksonville ]    State: [ FL ▼ ]                                         │
│                                                                                      │
│  INCIDENT CLASSIFICATION                                                             │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  Were there any injuries?        ○ Yes  ● No                                        │
│  Were there any fatalities?      ○ Yes  ● No                                        │
│  Was a tow required?             ● Yes  ○ No                                        │
│  Any hazmat release?             ○ Yes  ● No                                        │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  ⚠️ DOT REPORTABLE: YES                                                      │   │
│  │                                                                              │   │
│  │  This incident meets DOT reporting criteria due to: Tow-away involved       │   │
│  │  You must report this incident within 30 days.                              │   │
│  │                                                                              │   │
│  │  Deadline: February 19, 2026                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  DESCRIPTION                                                                         │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Driver was traveling northbound on I-95 when another vehicle merged into   │   │
│  │ the lane without signaling, causing contact with the trailer. Driver       │   │
│  │ pulled over safely. No injuries. Trailer sustained damage to rear corner   │   │
│  │ and required tow for repair.                                               │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ATTACHMENTS                                                                         │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  📎 Photos (4)     📎 Police Report     📎 Witness Statement                       │
│  [+ Add Files]                                                                       │
│                                                                                      │
│                                              [Cancel]  [Save Draft]  [Submit Report]│
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Integration Points

### 6.1 Extending fmcsaService.jsw

The CSA Score Monitor will extend the existing `fmcsaService.jsw`:

```javascript
// New function to add to fmcsaService.jsw
export async function getDetailedCSAData(dotNumber, traceId = null) {
  // Fetch BASIC scores with additional details
  // - Current percentiles
  // - Inspection counts
  // - Violation breakdown by type
  // - Crash details
  // Returns enhanced data structure for CSA monitoring
}
```

### 6.2 Email/SMS Integration

Extend `emailService.jsw` with compliance-specific templates:
- `compliance_reminder_30_day`
- `compliance_reminder_14_day`
- `compliance_reminder_7_day`
- `compliance_overdue`
- `csa_score_alert`
- `dq_file_incomplete`

### 6.3 Scheduled Jobs

Add to `jobs.config`:
```javascript
{
  "functionLocation": "backend/complianceCalendarService.jsw",
  "functionName": "processComplianceReminders",
  "time": "0 6 * * *"  // Daily at 6 AM
},
{
  "functionLocation": "backend/csaMonitorService.jsw",
  "functionName": "processCSAScoreUpdates",
  "time": "0 3 * * 0"  // Weekly Sunday 3 AM
}
```

---

## 7. Security & Permissions

### 7.1 Collection Permissions

| Collection | Read | Write | Delete |
|------------|------|-------|--------|
| ComplianceEvents | Carrier Owner/Admin | Carrier Owner/Admin | Carrier Admin |
| CarrierDocuments | Carrier Owner/Admin | Carrier Owner/Admin | Carrier Admin |
| QualificationFiles | Carrier Owner/Admin | Carrier Owner/Admin | Carrier Admin |
| CSAScoreHistory | Carrier Owner/Admin | System Only | System Only |
| IncidentReports | Carrier Owner/Admin | Carrier Owner/Admin | Carrier Admin |
| ComplianceAlerts | Carrier Owner/Admin | System Only | System Only |

### 7.2 API Authorization

All compliance endpoints must verify:
1. User is authenticated
2. User has permission for the specified carrier_dot
3. Audit log entry created for sensitive operations

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Compliance score improvement | +15% avg | Compare before/after for subscribed carriers |
| Overdue items reduction | -50% | Overdue items / total items ratio |
| DOT violations avoided | Track | Self-reported by carriers |
| Document upload rate | 80%+ digitized | Documents uploaded / total required |
| DQ file completeness | 95%+ | Average completeness score |
| CSA alert response time | <48 hours | Time from alert to acknowledgment |

---

## 9. Open Questions

1. **SMS Provider**: Which SMS service for notifications? (Twilio, MessageBird?)
2. **OCR Integration**: Use existing `ocrService.jsw` for document data extraction?
3. **Calendar Sync**: Support iCal/Google Calendar export?
4. **Multi-Carrier**: How do recruiters manage compliance for multiple carriers?
5. **Pricing**: Is this a standalone add-on or included in Enterprise tier?
6. **Mobile App**: Priority for mobile-responsive incident reporting?
