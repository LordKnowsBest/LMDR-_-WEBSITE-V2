# Track Spec: Driver Compliance Tools

## 1. Overview

A comprehensive compliance management suite that helps CDL drivers maintain DOT compliance, manage critical documents, track hours of service, and stay current on required training - reducing violations, building trust, and driving daily engagement with the platform.

### 1.1 Goals

1. **Reduce Compliance Violations** - Proactive alerts prevent missed renewals and HOS violations
2. **Simplify Document Access** - Instant access to all credentials during inspections
3. **Build Daily Engagement** - HOS logging creates daily touchpoints with the platform
4. **Increase Trust** - Drivers see LMDR as essential career tool, not just job board

### 1.2 Features Summary

| Feature | Description | Daily Use? |
|---------|-------------|------------|
| Document Wallet | Secure storage for CDL, med card, insurance, etc. | As needed |
| Expiration Alerts | Push/email for expiring documents | Passive |
| HOS Tracker | Hours of Service logging with ELD integration | Daily |
| Training Tracker | Certification logging and renewal tracking | Weekly/Monthly |

## 2. Architecture

### 2.1 System Overview

```
+------------------------------------------------------------------+
|                     DRIVER COMPLIANCE TOOLS                       |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------+    +------------------+    +----------------+ |
|  |  Document Wallet |    |  Expiration      |    |  Notification  | |
|  |                  |<-->|  Alert Engine    |<-->|  Service       | |
|  |  - Upload/Store  |    |  - Date Monitor  |    |  - Email       | |
|  |  - OCR Extract   |    |  - Rule Engine   |    |  - Push        | |
|  |  - Quick Access  |    |  - Calendar Sync |    |  - SMS (future)| |
|  +--------+---------+    +--------+---------+    +--------+-------+ |
|           |                       |                       |         |
|           v                       v                       v         |
|  +------------------------------------------------------------------+
|  |                    DriverDocuments Collection                    |
|  +------------------------------------------------------------------+
|                                                                    |
|  +------------------+    +------------------+    +----------------+ |
|  |  HOS Tracker     |    |  ELD Integration |    |  Training      | |
|  |                  |<-->|  Layer           |    |  Tracker       | |
|  |  - Manual Entry  |    |  - KeepTruckin   |    |  - Log Certs   | |
|  |  - Time Calc     |    |  - Samsara       |    |  - Track Dates | |
|  |  - Violation Warn|    |  - Motive        |    |  - Suggestions | |
|  +--------+---------+    +--------+---------+    +--------+-------+ |
|           |                       |                       |         |
|           v                       v                       v         |
|  +------------------------------------------------------------------+
|  |                     DriverHOS / DriverTraining Collections       |
|  +------------------------------------------------------------------+
+------------------------------------------------------------------+
```

### 2.2 Component Architecture

```
Frontend (src/public/driver/)
+---------------------------+
|  DRIVER_COMPLIANCE.html   |  <-- Main compliance dashboard
+---------------------------+
|  - DocumentWallet.js      |  <-- Document management UI
|  - HOSTracker.js          |  <-- HOS entry and display
|  - ExpirationAlerts.js    |  <-- Alert display/management
|  - TrainingTracker.js     |  <-- Training log UI
+---------------------------+

Backend (src/backend/)
+---------------------------+
|  complianceService.jsw    |  <-- Core compliance logic
+---------------------------+
|  documentWalletService.jsw|  <-- Document CRUD + OCR
|  hosService.jsw           |  <-- HOS calculations
|  eldIntegration.jsw       |  <-- ELD API connectors
|  trainingService.jsw      |  <-- Training management
|  alertScheduler.jsw       |  <-- Expiration monitoring
+---------------------------+
```

## 3. Data Model

### 3.1 DriverDocuments Collection

Stores all driver compliance documents with metadata extracted via OCR.

```
Collection: DriverDocuments
+-------------------+----------+---------------------------------------------+
| Field             | Type     | Description                                 |
+-------------------+----------+---------------------------------------------+
| _id               | Text     | Primary key                                 |
| driver_id         | Reference| -> DriverProfiles._id                       |
| document_type     | Text     | cdl|med_card|twic|hazmat|insurance|         |
|                   |          | registration|mvr|psp|other                  |
| display_name      | Text     | User-friendly name                          |
| file_url          | Text     | Wix Media URL                               |
| thumbnail_url     | Text     | Compressed preview for quick display        |
| file_size         | Number   | Bytes                                       |
| mime_type         | Text     | image/jpeg, application/pdf, etc.           |
| issue_date        | Date     | When document was issued                    |
| expiration_date   | Date     | When document expires (null if no expiry)   |
| state             | Text     | Issuing state (for CDL, registration)       |
| document_number   | Text     | CDL number, policy number, etc.             |
| endorsements      | Array    | [H, N, P, S, T, X] for CDL                  |
| restrictions      | Array    | [B, E, L, etc.] for CDL                     |
| ocr_extracted     | Boolean  | Whether OCR was performed                   |
| ocr_data          | Object   | Raw OCR extraction results                  |
| ocr_confidence    | Number   | 0-100 confidence score                      |
| verification_status| Text    | pending|verified|failed                     |
| alert_30_sent     | Boolean  | 30-day expiration alert sent                |
| alert_14_sent     | Boolean  | 14-day expiration alert sent                |
| alert_7_sent      | Boolean  | 7-day expiration alert sent                 |
| alert_expired_sent| Boolean  | Expiration alert sent                       |
| is_primary        | Boolean  | Primary document for this type              |
| uploaded_at       | Date     | Upload timestamp                            |
| updated_at        | Date     | Last modification                           |
| archived          | Boolean  | Soft delete flag                            |
+-------------------+----------+---------------------------------------------+
```

### 3.2 DriverHOS Collection

Tracks hours of service entries for compliance monitoring.

```
Collection: DriverHOS
+-------------------+----------+---------------------------------------------+
| Field             | Type     | Description                                 |
+-------------------+----------+---------------------------------------------+
| _id               | Text     | Primary key                                 |
| driver_id         | Reference| -> DriverProfiles._id                       |
| log_date          | Date     | Date of this log entry                      |
| duty_status       | Text     | off_duty|sleeper|driving|on_duty_not_driving|
| start_time        | DateTime | Status start time                           |
| end_time          | DateTime | Status end time (null if current)           |
| duration_minutes  | Number   | Calculated duration                         |
| location_start    | Text     | Location at status start                    |
| location_end      | Text     | Location at status end                      |
| vehicle_id        | Text     | Truck/trailer identifier                    |
| odometer_start    | Number   | Miles at start                              |
| odometer_end      | Number   | Miles at end                                |
| notes             | Text     | Driver notes                                |
| source            | Text     | manual|keeptruck|samsara|motive|eld_import  |
| eld_record_id     | Text     | External ELD record reference               |
| is_edited         | Boolean  | Manual edit after initial entry             |
| edit_reason       | Text     | Reason for edit (if edited)                 |
| certified         | Boolean  | Driver certified this log                   |
| certified_at      | DateTime | Certification timestamp                     |
| created_at        | DateTime | Record creation                             |
| updated_at        | DateTime | Last modification                           |
+-------------------+----------+---------------------------------------------+
```

### 3.3 DriverHOSSummary Collection

Daily/weekly aggregated HOS data for quick dashboard display.

```
Collection: DriverHOSSummary
+-------------------+----------+---------------------------------------------+
| Field             | Type     | Description                                 |
+-------------------+----------+---------------------------------------------+
| _id               | Text     | Primary key                                 |
| driver_id         | Reference| -> DriverProfiles._id                       |
| summary_date      | Date     | Date of summary                             |
| driving_minutes   | Number   | Total driving time                          |
| on_duty_minutes   | Number   | Total on-duty (not driving)                 |
| off_duty_minutes  | Number   | Total off-duty                              |
| sleeper_minutes   | Number   | Total sleeper berth                         |
| cycle_type        | Text     | 60_7|70_8                                   |
| cycle_used_hours  | Number   | Hours used in current cycle                 |
| cycle_available   | Number   | Hours remaining in cycle                    |
| daily_driving_left| Number   | Minutes left of 11-hour driving             |
| daily_duty_left   | Number   | Minutes left of 14-hour duty window         |
| last_34hr_restart | DateTime | Last 34-hour restart timestamp              |
| violations        | Array    | [{type, timestamp, description}]            |
| break_30_required | Boolean  | 30-min break required                       |
| break_30_due_by   | DateTime | When 30-min break must be taken             |
| updated_at        | DateTime | Last calculation                            |
+-------------------+----------+---------------------------------------------+
```

### 3.4 DriverTraining Collection

Tracks training completions and certifications.

```
Collection: DriverTraining
+-------------------+----------+---------------------------------------------+
| Field             | Type     | Description                                 |
+-------------------+----------+---------------------------------------------+
| _id               | Text     | Primary key                                 |
| driver_id         | Reference| -> DriverProfiles._id                       |
| training_type     | Text     | safety|hazmat|tanker|doubles|defensive|     |
|                   |          | smith_system|entry_level|refresher|other    |
| training_name     | Text     | Official training name                      |
| provider          | Text     | Training provider/school                    |
| completion_date   | Date     | When completed                              |
| expiration_date   | Date     | When renewal required (null if permanent)   |
| certificate_url   | Text     | Uploaded certificate                        |
| certificate_number| Text     | Certificate/credential number               |
| hours             | Number   | Training hours completed                    |
| score             | Number   | Test score (if applicable)                  |
| passed            | Boolean  | Pass/fail status                            |
| notes             | Text     | Additional notes                            |
| alert_30_sent     | Boolean  | 30-day expiration alert sent                |
| alert_14_sent     | Boolean  | 14-day expiration alert sent                |
| alert_7_sent      | Boolean  | 7-day expiration alert sent                 |
| verified          | Boolean  | Verified by admin                           |
| created_at        | DateTime | Record creation                             |
| updated_at        | DateTime | Last modification                           |
+-------------------+----------+---------------------------------------------+
```

### 3.5 ELDConnections Collection

Stores ELD provider credentials for sync.

```
Collection: ELDConnections
+-------------------+----------+---------------------------------------------+
| Field             | Type     | Description                                 |
+-------------------+----------+---------------------------------------------+
| _id               | Text     | Primary key                                 |
| driver_id         | Reference| -> DriverProfiles._id                       |
| provider          | Text     | keeptruck|samsara|motive|geotab|omnitracs   |
| connection_status | Text     | active|disconnected|error|pending           |
| access_token      | Text     | OAuth access token (encrypted)              |
| refresh_token     | Text     | OAuth refresh token (encrypted)             |
| token_expires_at  | DateTime | Token expiration                            |
| driver_external_id| Text     | Driver ID in ELD system                     |
| last_sync         | DateTime | Last successful sync                        |
| sync_frequency    | Text     | realtime|hourly|daily                       |
| error_message     | Text     | Last error (if any)                         |
| created_at        | DateTime | Connection created                          |
| updated_at        | DateTime | Last update                                 |
+-------------------+----------+---------------------------------------------+
```

## 4. Feature Specifications

### 4.1 Document Wallet

#### 4.1.1 Overview

Secure digital storage for all driver compliance documents with OCR extraction, instant access, and sharing capabilities.

#### 4.1.2 Document Types Supported

| Type | Fields Extracted | Expiration? |
|------|------------------|-------------|
| CDL | Number, Class, State, DOB, Endorsements, Restrictions | Yes |
| Medical Card | Expiration, Examiner, Cert Type | Yes (2 years) |
| TWIC Card | Card Number, Expiration | Yes (5 years) |
| HazMat Endorsement | Endorsement Code, Expiration | Yes |
| Insurance | Policy Number, Coverage, Effective Dates | Yes |
| Registration | Vehicle ID, State, Expiration | Yes |
| MVR | Date, Violations | No (point-in-time) |
| PSP Report | Date, Inspection Summary | No (point-in-time) |

#### 4.1.3 UI Mockup - Document Wallet

```
+------------------------------------------------------------------+
|  DOCUMENT WALLET                                    [+ Add Doc]   |
+------------------------------------------------------------------+
|                                                                    |
|  EXPIRING SOON                                                    |
|  +--------------------------------------------------------------+ |
|  | [!] Medical Card         Expires in 14 days    [View] [Renew]| |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  MY DOCUMENTS                              [Grid] [List] [Filter]  |
|  +---------------+  +---------------+  +---------------+          |
|  |     [CDL]     |  |  [MED CARD]   |  |    [TWIC]     |          |
|  |    ******     |  |               |  |               |          |
|  | Class A       |  | Exp: 02/03/26 |  | Exp: 08/15/28 |          |
|  | TX 12345678   |  |   [!] 14 days |  |   Valid       |          |
|  | Valid         |  +---------------+  +---------------+          |
|  | Exp: 2028     |                                                |
|  +---------------+  +---------------+  +---------------+          |
|                     |  [INSURANCE]  |  |    [REG]      |          |
|                     |               |  |               |          |
|                     | Policy: ABC   |  | TX ABC-1234   |          |
|                     | Exp: 06/30/26 |  | Exp: 03/31/26 |          |
|                     +---------------+  +---------------+          |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |  [+] Add New Document                                        | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

#### 4.1.4 Quick Access During Inspection

```
+------------------------------------------------------------------+
|  INSPECTION MODE                                    [Exit]        |
+------------------------------------------------------------------+
|                                                                    |
|  Tap document to display full-screen for officer                  |
|                                                                    |
|  +------------------+  +------------------+  +------------------+ |
|  |                  |  |                  |  |                  | |
|  |      CDL         |  |   MEDICAL CARD   |  |   INSURANCE      | |
|  |                  |  |                  |  |                  | |
|  |   [Full Image]   |  |   [Full Image]   |  |   [Full Image]   | |
|  |                  |  |                  |  |                  | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                    |
|  +------------------+  +------------------+                       |
|  |                  |  |                  |                       |
|  |  REGISTRATION    |  |     PERMITS      |                       |
|  |                  |  |                  |                       |
|  +------------------+  +------------------+                       |
|                                                                    |
|  [Share All Documents via Email/Text]                             |
+------------------------------------------------------------------+
```

### 4.2 Expiration Alerts

#### 4.2.1 Alert Schedule

| Days Before | Channel | Message Tone |
|-------------|---------|--------------|
| 30 days | Email | Friendly reminder |
| 14 days | Email + Push | Urgent reminder |
| 7 days | Email + Push | Critical warning |
| 0 days (expired) | Email + Push | Expired notice |

#### 4.2.2 Alert Rules Engine

```javascript
const ALERT_RULES = {
  cdl: { alerts: [90, 60, 30, 14, 7], critical: 30 },
  med_card: { alerts: [60, 30, 14, 7], critical: 30 },
  twic: { alerts: [90, 60, 30, 14, 7], critical: 30 },
  hazmat: { alerts: [90, 60, 30, 14, 7], critical: 60 },
  insurance: { alerts: [30, 14, 7], critical: 14 },
  registration: { alerts: [30, 14, 7], critical: 14 },
  training: { alerts: [60, 30, 14, 7], critical: 30 }
};
```

#### 4.2.3 Calendar Integration

```
+------------------------------------------------------------------+
|  COMPLIANCE CALENDAR                              [Sync to Phone] |
+------------------------------------------------------------------+
|                                                                    |
|  January 2026                                                     |
|  +--+--+--+--+--+--+--+                                           |
|  |Su|Mo|Tu|We|Th|Fr|Sa|                                           |
|  +--+--+--+--+--+--+--+                                           |
|  |  |  |  | 1| 2| 3| 4|                                           |
|  |  |  |  |  |  |[!]|  |  <-- Med Card expires                    |
|  +--+--+--+--+--+--+--+                                           |
|  | 5| 6| 7| 8| 9|10|11|                                           |
|  +--+--+--+--+--+--+--+                                           |
|  |12|13|14|15|16|17|18|                                           |
|  |  |  |  |  |  |  |[T]| <-- HazMat Training Due                  |
|  +--+--+--+--+--+--+--+                                           |
|                                                                    |
|  UPCOMING                                                         |
|  +--------------------------------------------------------------+ |
|  | Jan 3   | Medical Card Expires      | CRITICAL | [Renew]     | |
|  | Jan 18  | HazMat Refresher Due      | WARNING  | [Schedule]  | |
|  | Mar 31  | Registration Expires      | UPCOMING | [Renew]     | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

### 4.3 HOS Tracker

#### 4.3.1 HOS Rules Reference

**Property-Carrying Drivers (70-hour/8-day most common)**

| Rule | Limit | Description |
|------|-------|-------------|
| 11-Hour Driving | 11 hrs | Max driving after 10 consecutive hours off |
| 14-Hour Window | 14 hrs | Duty window from first on-duty |
| 30-Minute Break | 30 min | Required after 8 cumulative driving hours |
| 60/70 Hour Limit | 60/70 hrs | Max on-duty in 7/8 consecutive days |
| 34-Hour Restart | 34 hrs | Resets 60/70 hour clock |
| Sleeper Berth | 7/3 split | Can split required 10-hour off-duty |

#### 4.3.2 HOS Dashboard UI

```
+------------------------------------------------------------------+
|  HOURS OF SERVICE                              [Manual Entry] [ELD]|
+------------------------------------------------------------------+
|                                                                    |
|  CURRENT STATUS                                                   |
|  +--------------------------------------------------------------+ |
|  |  [====DRIVING====]  Started 2:45 PM  |  1h 23m elapsed       | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  TIME REMAINING TODAY                                             |
|  +---------------------------+  +---------------------------+     |
|  |  DRIVE TIME               |  |  DUTY WINDOW              |     |
|  |  [==========>    ]        |  |  [============>  ]        |     |
|  |  9h 37m remaining         |  |  10h 15m remaining        |     |
|  |  of 11 hours              |  |  of 14 hours              |     |
|  +---------------------------+  +---------------------------+     |
|                                                                    |
|  +---------------------------+  +---------------------------+     |
|  |  30-MIN BREAK             |  |  70-HOUR CYCLE            |     |
|  |  [=====>         ]        |  |  [=========>     ]        |     |
|  |  Due in 4h 12m            |  |  48h 30m used             |     |
|  |  After 8h driving         |  |  21h 30m available        |     |
|  +---------------------------+  +---------------------------+     |
|                                                                    |
|  TODAY'S LOG                                                      |
|  +--------------------------------------------------------------+ |
|  | 6:00 AM  | Off Duty      | [____________] 2h 00m             | |
|  | 8:00 AM  | Pre-Trip      | [==]          0h 30m              | |
|  | 8:30 AM  | Driving       | [========]    3h 45m              | |
|  | 12:15 PM | On Duty       | [==]          1h 00m  (Unload)    | |
|  | 1:15 PM  | Off Duty      | [===]         1h 30m  (Lunch)     | |
|  | 2:45 PM  | Driving       | [===>         1h 23m  CURRENT     | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  [Change Status]  [View Week]  [Certify Log]                      |
+------------------------------------------------------------------+
```

#### 4.3.3 Manual Entry Form

```
+------------------------------------------------------------------+
|  LOG DUTY STATUS                                         [Cancel] |
+------------------------------------------------------------------+
|                                                                    |
|  Status:  ( ) Off Duty                                            |
|           ( ) Sleeper Berth                                       |
|           (o) Driving                                             |
|           ( ) On Duty (Not Driving)                               |
|                                                                    |
|  Start Time:  [02:45 PM]  [Today v]                               |
|                                                                    |
|  Location:    [Dallas, TX________________]                        |
|                                                                    |
|  Vehicle:     [Truck #1234 - Trailer #5678]                       |
|                                                                    |
|  Odometer:    [145,678___] miles                                  |
|                                                                    |
|  Notes:       [Loaded at shipper, departing]                      |
|               [_________________________________]                  |
|                                                                    |
|  [Cancel]                                    [Save Status Change] |
+------------------------------------------------------------------+
```

### 4.4 ELD Integration

#### 4.4.1 Supported Providers

| Provider | API Type | Status |
|----------|----------|--------|
| KeepTruckin/Motive | REST + OAuth2 | Priority |
| Samsara | REST + OAuth2 | Priority |
| Geotab | REST | Planned |
| Omnitracs | SOAP | Planned |

#### 4.4.2 ELD Connection Flow

```
+------------------------------------------------------------------+
|  CONNECT ELD                                                      |
+------------------------------------------------------------------+
|                                                                    |
|  Select your ELD provider to sync hours automatically             |
|                                                                    |
|  +---------------+  +---------------+  +---------------+          |
|  | [KeepTruckin] |  |  [Samsara]    |  |  [Geotab]     |          |
|  |    /Motive    |  |               |  |               |          |
|  |   CONNECT     |  |   CONNECT     |  |   COMING SOON |          |
|  +---------------+  +---------------+  +---------------+          |
|                                                                    |
|  +---------------+  +---------------+                             |
|  | [Omnitracs]   |  |  [Other]      |                             |
|  |               |  |               |                             |
|  |   COMING SOON |  |   REQUEST     |                             |
|  +---------------+  +---------------+                             |
|                                                                    |
|  -- OR --                                                         |
|                                                                    |
|  [Continue with Manual Entry]                                     |
|                                                                    |
|  Your data is encrypted and never shared with carriers            |
+------------------------------------------------------------------+
```

#### 4.4.3 ELD Sync Architecture

```
+------------------+         +------------------+         +------------------+
|   ELD Provider   |         |   LMDR Backend   |         |   Driver App     |
|   (KeepTruckin)  |         |  eldIntegration  |         |   HOS Tracker    |
+------------------+         +------------------+         +------------------+
        |                            |                            |
        |  1. OAuth2 Authorization   |                            |
        |<---------------------------|                            |
        |                            |                            |
        |  2. Access Token           |                            |
        |--------------------------->|                            |
        |                            |                            |
        |  3. GET /hos/daily_logs    |                            |
        |<---------------------------|                            |
        |                            |                            |
        |  4. Log Data (JSON)        |                            |
        |--------------------------->|                            |
        |                            |                            |
        |                            |  5. Transform & Store      |
        |                            |-------------------------->  |
        |                            |                            |
        |                            |  6. Push Update            |
        |                            |--------------------------->|
        |                            |                            |
```

### 4.5 Training Tracker

#### 4.5.1 Training Categories

| Category | Examples | Renewal Period |
|----------|----------|----------------|
| Entry-Level | ELDT Theory, ELDT Behind-the-Wheel | None (one-time) |
| Hazmat | HazMat Transportation Training | 3 years |
| Tanker | Tanker Endorsement Training | 3 years |
| Safety | Defensive Driving, Smith System | 1-3 years |
| Refresher | Annual Safety Refresher | 1 year |
| Specialized | Oversized/Wide Load, Refrigeration | Varies |

#### 4.5.2 Training Dashboard UI

```
+------------------------------------------------------------------+
|  TRAINING & CERTIFICATIONS                      [+ Log Training]  |
+------------------------------------------------------------------+
|                                                                    |
|  RENEWAL REQUIRED                                                 |
|  +--------------------------------------------------------------+ |
|  | [!] HazMat Refresher        Expired 15 days ago   [Schedule] | |
|  | [!] Defensive Driving       Due in 30 days        [Schedule] | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  COMPLETED TRAINING                           [Filter] [Export]   |
|  +--------------------------------------------------------------+ |
|  | Training                | Provider      | Date    | Status   | |
|  +--------------------------------------------------------------+ |
|  | ELDT Theory             | CDL College   | 2024-03 | Valid    | |
|  | ELDT Behind-the-Wheel   | CDL College   | 2024-03 | Valid    | |
|  | HazMat Initial          | SafetyFirst   | 2023-01 | EXPIRED  | |
|  | Tanker Endorsement      | TruckSafe     | 2024-06 | Valid    | |
|  | Smith System Defensive  | Carrier ABC   | 2023-08 | Due Soon | |
|  | Annual Safety Refresher | Online Safety | 2025-01 | Valid    | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  SUGGESTED TRAINING                                               |
|  +--------------------------------------------------------------+ |
|  | Based on your endorsements and career goals:                  | |
|  | - HazMat Refresher (required to maintain endorsement)         | |
|  | - Doubles/Triples Training (expand job opportunities)         | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

## 5. API Design

### 5.1 Document Wallet APIs

```javascript
// documentWalletService.jsw

/**
 * Upload a new document with optional OCR extraction
 * @param {string} driverId - Driver profile ID
 * @param {string} documentType - Type of document
 * @param {object} fileData - Base64 encoded file data
 * @param {object} metadata - Optional manual metadata
 * @returns {object} Created document record
 */
export async function uploadDocument(driverId, documentType, fileData, metadata = {})

/**
 * Get all documents for a driver
 * @param {string} driverId - Driver profile ID
 * @param {string} documentType - Optional filter by type
 * @returns {array} Document records
 */
export async function getDocuments(driverId, documentType = null)

/**
 * Get documents expiring within N days
 * @param {string} driverId - Driver profile ID
 * @param {number} days - Days until expiration
 * @returns {array} Expiring documents
 */
export async function getExpiringDocuments(driverId, days = 30)

/**
 * Delete (archive) a document
 * @param {string} documentId - Document ID
 * @returns {boolean} Success
 */
export async function archiveDocument(documentId)

/**
 * Share documents via email
 * @param {string} driverId - Driver profile ID
 * @param {array} documentIds - Documents to share
 * @param {string} recipientEmail - Recipient email
 * @returns {object} Share result
 */
export async function shareDocuments(driverId, documentIds, recipientEmail)
```

### 5.2 HOS APIs

```javascript
// hosService.jsw

/**
 * Log a duty status change
 * @param {string} driverId - Driver profile ID
 * @param {object} statusData - Status change details
 * @returns {object} Created HOS record
 */
export async function logStatusChange(driverId, statusData)

/**
 * Get current HOS summary for driver
 * @param {string} driverId - Driver profile ID
 * @returns {object} Current HOS status with time remaining
 */
export async function getCurrentHOSStatus(driverId)

/**
 * Get HOS logs for a date range
 * @param {string} driverId - Driver profile ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {array} HOS log entries
 */
export async function getHOSLogs(driverId, startDate, endDate)

/**
 * Calculate remaining time for all HOS rules
 * @param {string} driverId - Driver profile ID
 * @returns {object} Remaining time calculations
 */
export async function calculateRemainingTime(driverId)

/**
 * Certify daily log
 * @param {string} driverId - Driver profile ID
 * @param {Date} logDate - Date to certify
 * @returns {boolean} Success
 */
export async function certifyDailyLog(driverId, logDate)
```

### 5.3 ELD Integration APIs

```javascript
// eldIntegration.jsw

/**
 * Initiate OAuth connection to ELD provider
 * @param {string} driverId - Driver profile ID
 * @param {string} provider - ELD provider name
 * @returns {object} OAuth authorization URL
 */
export async function initiateELDConnection(driverId, provider)

/**
 * Complete OAuth flow with authorization code
 * @param {string} driverId - Driver profile ID
 * @param {string} provider - ELD provider name
 * @param {string} authCode - OAuth authorization code
 * @returns {object} Connection result
 */
export async function completeELDConnection(driverId, provider, authCode)

/**
 * Sync HOS data from ELD provider
 * @param {string} driverId - Driver profile ID
 * @param {Date} startDate - Sync start date
 * @returns {object} Sync result with record count
 */
export async function syncELDData(driverId, startDate)

/**
 * Disconnect ELD provider
 * @param {string} driverId - Driver profile ID
 * @param {string} provider - ELD provider name
 * @returns {boolean} Success
 */
export async function disconnectELD(driverId, provider)
```

### 5.4 Training APIs

```javascript
// trainingService.jsw

/**
 * Log a completed training
 * @param {string} driverId - Driver profile ID
 * @param {object} trainingData - Training details
 * @returns {object} Created training record
 */
export async function logTraining(driverId, trainingData)

/**
 * Get all training records for driver
 * @param {string} driverId - Driver profile ID
 * @returns {array} Training records
 */
export async function getTrainingRecords(driverId)

/**
 * Get trainings requiring renewal
 * @param {string} driverId - Driver profile ID
 * @param {number} days - Days until expiration
 * @returns {array} Expiring trainings
 */
export async function getExpiringTrainings(driverId, days = 60)

/**
 * Get suggested trainings based on profile
 * @param {string} driverId - Driver profile ID
 * @returns {array} Suggested trainings
 */
export async function getSuggestedTrainings(driverId)
```

### 5.5 Alert APIs

```javascript
// alertScheduler.jsw

/**
 * Process expiration alerts (called by scheduler)
 * Checks all documents and trainings, sends alerts as needed
 * @returns {object} Alert processing results
 */
export async function processExpirationAlerts()

/**
 * Get upcoming alerts for driver
 * @param {string} driverId - Driver profile ID
 * @returns {array} Pending alerts with dates
 */
export async function getUpcomingAlerts(driverId)

/**
 * Update alert preferences
 * @param {string} driverId - Driver profile ID
 * @param {object} preferences - Alert preferences
 * @returns {boolean} Success
 */
export async function updateAlertPreferences(driverId, preferences)
```

## 6. Security Considerations

### 6.1 Document Security

- All documents stored with AES-256 encryption at rest
- Signed URLs for document access (expire in 1 hour)
- Document sharing creates time-limited access tokens
- PII extracted via OCR is encrypted separately

### 6.2 ELD Credentials

- OAuth tokens stored in encrypted collection
- Refresh tokens rotated on each use
- Connection audit log maintained
- Automatic token revocation on disconnect

### 6.3 Data Privacy

- HOS data never shared with carriers without explicit consent
- Documents only shareable by driver action
- Training records private by default
- Audit trail for all data access

## 7. Integration Points

### 7.1 Existing System Integration

| System | Integration |
|--------|-------------|
| DriverProfiles | Link compliance data to driver |
| DriverCarrierInterests | Show compliance status in applications |
| Recruiter Dashboard | Display driver compliance score |
| AI Matching | Factor compliance into match scoring |

### 7.2 External Integrations

| External System | Purpose |
|-----------------|---------|
| KeepTruckin/Motive API | HOS sync |
| Samsara API | HOS sync |
| Google Calendar API | Export expiration dates |
| Apple Calendar | Export via .ics |
| Twilio (future) | SMS alerts |

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Document Upload Rate | 80% of drivers upload 1+ doc | Documents / Active Drivers |
| Alert Open Rate | 60% email open rate | Email analytics |
| HOS Daily Active Users | 30% of active drivers | Daily log entries |
| Violation Reduction | Track self-reported | Survey / feedback |
| Session Frequency | 3x per week | Analytics |
