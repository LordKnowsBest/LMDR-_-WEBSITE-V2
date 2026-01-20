# Track Plan: Driver Compliance Tools

## Phase 1: Document Wallet (Foundation)

The document wallet is the foundation for all other compliance features - expiration alerts require documents, training tracker uses similar patterns, and HOS benefits from having CDL/medical card data available.

### 1.1 Database Setup
- [ ] Task: Create `DriverDocuments` collection with all fields per spec
- [ ] Task: Create `DriverDocuments` indexes on driver_id, document_type, expiration_date
- [ ] Task: Add document_count field to DriverProfiles for quick stats
- [ ] Task: Create `DocumentAlertPreferences` collection for per-driver alert settings

### 1.2 Backend Services
- [ ] Task: Create `documentWalletService.jsw` with uploadDocument function
- [ ] Task: Implement file validation (type, size, dimensions)
- [ ] Task: Integrate with wix-media-backend for secure file storage
- [ ] Task: Create `getDocuments()` with filtering and pagination
- [ ] Task: Create `getExpiringDocuments()` with days parameter
- [ ] Task: Create `archiveDocument()` for soft delete
- [ ] Task: Create `updateDocumentMetadata()` for manual edits

### 1.3 OCR Integration
- [ ] Task: Extend ocrService.jsw with CDL extraction template
- [ ] Task: Add medical card OCR extraction template
- [ ] Task: Add insurance document OCR extraction template
- [ ] Task: Implement OCR confidence scoring
- [ ] Task: Create fallback manual entry form when OCR fails
- [ ] Task: Store raw OCR data for audit/reprocessing

### 1.4 Frontend - Document Wallet UI
- [ ] Task: Create `DRIVER_COMPLIANCE.html` in src/public/driver/
- [ ] Task: Build DocumentWallet component with grid/list views
- [ ] Task: Implement document card component with status badges
- [ ] Task: Create document upload modal with drag-drop support
- [ ] Task: Build document viewer with zoom/rotate capabilities
- [ ] Task: Add "Expiring Soon" alert section at top of wallet
- [ ] Task: Implement document type selector with icons

### 1.5 Inspection Mode
- [ ] Task: Create "Inspection Mode" full-screen document viewer
- [ ] Task: Implement quick-tap document selection
- [ ] Task: Add screen brightness auto-max in inspection mode
- [ ] Task: Create "Share Documents" flow via email
- [ ] Task: Generate shareable PDF bundle of selected documents

### 1.6 Testing - Phase 1
- [ ] Task: Unit tests for documentWalletService.jsw functions
- [ ] Task: OCR extraction accuracy tests with sample documents
- [ ] Task: File upload size/type validation tests
- [ ] Task: Integration test: upload -> store -> retrieve flow
- [ ] Task: UI test: document grid responsiveness
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Document Wallet'


## Phase 2: Expiration Alerts (Quick Win)

High-value feature that provides immediate driver benefit. Builds on Document Wallet foundation.

### 2.1 Alert Engine Backend
- [ ] Task: Create `alertScheduler.jsw` with processExpirationAlerts function
- [ ] Task: Implement alert rule engine with configurable thresholds
- [ ] Task: Create document expiration query with 30/14/7/0 day buckets
- [ ] Task: Add alert_sent flags to prevent duplicate notifications
- [ ] Task: Create alert processing batch job

### 2.2 Notification Channels
- [ ] Task: Create expiration alert email templates (30-day, 14-day, 7-day, expired)
- [ ] Task: Implement email sending via emailService.jsw
- [ ] Task: Create push notification payloads
- [ ] Task: Integrate with MemberNotifications collection
- [ ] Task: Add notification preferences per document type

### 2.3 Scheduled Job Setup
- [ ] Task: Add `processExpirationAlerts` to jobs.config (daily at 6 AM)
- [ ] Task: Implement batch processing with pagination (avoid timeouts)
- [ ] Task: Add job execution logging to observabilityService
- [ ] Task: Create manual trigger for testing

### 2.4 Calendar Integration
- [ ] Task: Create compliance calendar view component
- [ ] Task: Implement month/week/agenda view options
- [ ] Task: Add color-coded status indicators on calendar
- [ ] Task: Generate .ics file for calendar export
- [ ] Task: Create Google Calendar direct sync (OAuth)
- [ ] Task: Add Apple Calendar support via .ics download

### 2.5 Alert Management UI
- [ ] Task: Build alert preferences settings panel
- [ ] Task: Create toggle controls for each document type
- [ ] Task: Add custom reminder day selection
- [ ] Task: Implement email frequency settings (immediate/daily digest)
- [ ] Task: Create alert history view

### 2.6 Testing - Phase 2
- [ ] Task: Unit tests for alert rule engine
- [ ] Task: Test email template rendering with sample data
- [ ] Task: Verify alert deduplication logic
- [ ] Task: Test scheduled job execution
- [ ] Task: Calendar export validation (.ics format)
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Expiration Alerts'


## Phase 3: HOS Tracker (Complex - ELD Integration)

The most complex phase due to HOS calculation rules and ELD API integrations. Creates daily engagement touchpoint.

### 3.1 Database Setup
- [ ] Task: Create `DriverHOS` collection per spec
- [ ] Task: Create `DriverHOSSummary` collection for aggregated data
- [ ] Task: Create `ELDConnections` collection for OAuth tokens
- [ ] Task: Add indexes for driver_id + log_date queries
- [ ] Task: Create compound index for time-range queries

### 3.2 HOS Calculation Engine
- [ ] Task: Create `hosService.jsw` with core calculation functions
- [ ] Task: Implement 11-hour driving rule calculator
- [ ] Task: Implement 14-hour duty window calculator
- [ ] Task: Implement 30-minute break requirement tracker
- [ ] Task: Implement 70-hour/8-day cycle calculator
- [ ] Task: Implement 34-hour restart detection
- [ ] Task: Implement 7/3 sleeper berth split calculation
- [ ] Task: Create `calculateRemainingTime()` aggregator function
- [ ] Task: Add violation detection (driving over limit, etc.)

### 3.3 Manual Entry Backend
- [ ] Task: Create `logStatusChange()` function
- [ ] Task: Implement status transition validation
- [ ] Task: Auto-calculate duration when status changes
- [ ] Task: Create `getHOSLogs()` with date range support
- [ ] Task: Create `certifyDailyLog()` for log certification
- [ ] Task: Implement log edit with edit_reason tracking

### 3.4 HOS Dashboard UI
- [ ] Task: Create HOSTracker component in DRIVER_COMPLIANCE.html
- [ ] Task: Build current status display with elapsed time
- [ ] Task: Create time remaining gauges (drive, duty, break, cycle)
- [ ] Task: Build daily log timeline visualization
- [ ] Task: Implement status change quick buttons
- [ ] Task: Create detailed log view with all entries
- [ ] Task: Add weekly summary view

### 3.5 Manual Entry UI
- [ ] Task: Create status change modal form
- [ ] Task: Implement time picker with validation
- [ ] Task: Add location input (manual or GPS)
- [ ] Task: Create vehicle selector from driver's vehicles
- [ ] Task: Build odometer entry with validation
- [ ] Task: Add notes field for remarks

### 3.6 ELD Integration - KeepTruckin/Motive
- [ ] Task: Create `eldIntegration.jsw` service
- [ ] Task: Register LMDR app with KeepTruckin developer portal
- [ ] Task: Implement OAuth2 authorization flow for KeepTruckin
- [ ] Task: Create token storage with encryption
- [ ] Task: Implement automatic token refresh
- [ ] Task: Build HOS log fetch from KeepTruckin API
- [ ] Task: Create data transformer (KeepTruckin -> LMDR format)
- [ ] Task: Implement incremental sync (only new/changed records)

### 3.7 ELD Integration - Samsara
- [ ] Task: Register LMDR app with Samsara developer portal
- [ ] Task: Implement OAuth2 authorization flow for Samsara
- [ ] Task: Build HOS log fetch from Samsara API
- [ ] Task: Create data transformer (Samsara -> LMDR format)
- [ ] Task: Handle Samsara-specific data fields

### 3.8 ELD Connection UI
- [ ] Task: Create ELD provider selection screen
- [ ] Task: Build OAuth authorization redirect flow
- [ ] Task: Create connection success/failure handlers
- [ ] Task: Add connection status indicator on HOS dashboard
- [ ] Task: Create disconnect confirmation flow
- [ ] Task: Build sync status display (last sync, next sync)

### 3.9 HOS Alerts
- [ ] Task: Create approaching violation warnings (15 min, 30 min)
- [ ] Task: Implement break reminder notifications
- [ ] Task: Add cycle reset opportunity alerts
- [ ] Task: Create violation occurred notifications

### 3.10 Testing - Phase 3
- [ ] Task: Unit tests for all HOS calculation functions
- [ ] Task: Test edge cases (sleeper splits, restarts, etc.)
- [ ] Task: Mock ELD API responses for integration tests
- [ ] Task: Test OAuth flow with test credentials
- [ ] Task: Validate time remaining calculations
- [ ] Task: Test violation detection accuracy
- [ ] Task: Load test HOS summary calculations
- [ ] Task: Conductor - User Manual Verification 'Phase 3: HOS Tracker'


## Phase 4: Training Tracker

Final phase - leverages patterns from Document Wallet and Alert Engine.

### 4.1 Database Setup
- [ ] Task: Create `DriverTraining` collection per spec
- [ ] Task: Add indexes for driver_id, training_type, expiration_date
- [ ] Task: Create `TrainingCatalog` collection for training definitions
- [ ] Task: Seed TrainingCatalog with common training types

### 4.2 Backend Services
- [ ] Task: Create `trainingService.jsw` with logTraining function
- [ ] Task: Implement `getTrainingRecords()` with filters
- [ ] Task: Create `getExpiringTrainings()` for renewal alerts
- [ ] Task: Implement `getSuggestedTrainings()` based on endorsements
- [ ] Task: Create certificate upload and storage
- [ ] Task: Add training verification workflow (admin approval)

### 4.3 Training Alert Integration
- [ ] Task: Extend alertScheduler.jsw to include training expirations
- [ ] Task: Create training-specific email templates
- [ ] Task: Add training alerts to calendar integration
- [ ] Task: Implement training renewal reminder sequence

### 4.4 Training Dashboard UI
- [ ] Task: Create TrainingTracker component in DRIVER_COMPLIANCE.html
- [ ] Task: Build training record list with status badges
- [ ] Task: Create "Renewal Required" alert section
- [ ] Task: Implement training log modal form
- [ ] Task: Add certificate upload in training form
- [ ] Task: Create training detail view

### 4.5 Suggested Training Engine
- [ ] Task: Build endorsement-to-training mapping
- [ ] Task: Analyze driver job interests for training suggestions
- [ ] Task: Create "Popular Trainings" section
- [ ] Task: Add "Training could unlock X more jobs" messaging
- [ ] Task: Integrate training providers (affiliate links future)

### 4.6 Training Reports
- [ ] Task: Create printable training transcript
- [ ] Task: Build training summary for job applications
- [ ] Task: Add training history export (PDF/CSV)
- [ ] Task: Create shareable training profile link

### 4.7 Testing - Phase 4
- [ ] Task: Unit tests for trainingService.jsw functions
- [ ] Task: Test training suggestion algorithm
- [ ] Task: Verify alert integration with training records
- [ ] Task: Test certificate upload and retrieval
- [ ] Task: Validate transcript generation
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Training Tracker'


## Post-Launch Tasks

### Documentation
- [ ] Task: Create driver help documentation for compliance tools
- [ ] Task: Add compliance tools to driver onboarding flow
- [ ] Task: Create video tutorials for HOS manual entry
- [ ] Task: Document ELD connection troubleshooting

### Analytics & Monitoring
- [ ] Task: Add compliance feature usage tracking
- [ ] Task: Create compliance tools dashboard in admin portal
- [ ] Task: Monitor ELD sync success rates
- [ ] Task: Track alert engagement metrics

### Future Enhancements
- [ ] Task: Evaluate SMS alert channel (Twilio)
- [ ] Task: Research additional ELD providers (Geotab, Omnitracs)
- [ ] Task: Plan driver compliance score for carrier visibility
- [ ] Task: Explore training provider partnerships


## Phase Dependencies

```
+------------------+
|  Phase 1:        |
|  Document Wallet |
+--------+---------+
         |
         v
+------------------+     +------------------+
|  Phase 2:        |     |  Phase 3:        |
|  Expiration      |     |  HOS Tracker     |
|  Alerts          |     |  (can parallel)  |
+--------+---------+     +--------+---------+
         |                        |
         +------------+-----------+
                      |
                      v
              +------------------+
              |  Phase 4:        |
              |  Training        |
              |  Tracker         |
              +------------------+
```

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Document Wallet | 2 weeks | driver_cockpit_20251221 |
| Phase 2: Expiration Alerts | 1 week | Phase 1 |
| Phase 3: HOS Tracker | 3 weeks | Phase 1 (can parallel with Phase 2) |
| Phase 4: Training Tracker | 1.5 weeks | Phases 1 & 2 |
| **Total** | **~6-7 weeks** | |

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| ELD API access delays | Start provider registration early; build manual entry first |
| OCR accuracy issues | Implement manual fallback; collect edge cases for improvement |
| HOS calculation complexity | Extensive testing; consult FMCSA documentation |
| Low adoption | In-app prompts; highlight value during onboarding |
