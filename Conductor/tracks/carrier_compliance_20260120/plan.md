# Track Plan: Carrier Compliance - DOT Compliance Management

> **STATUS: PLANNED** - Awaiting dependency completion (carrier_conversion_20260103)
>
> **Created**: 2026-01-20
>
> **Priority**: Critical (Risk Mitigation)
>
> **Business Impact**: Help carriers avoid $10k+ DOT violations through proactive compliance management

---

## Phase Overview

```
Phase 1: Compliance Calendar (Highest Immediate Value)
    ↓
Phase 2: Document Vault
    ↓
Phase 3: Qualification File Tracker
    ↓
Phase 4: CSA Score Monitor (Extends fmcsaService.jsw)
    ↓
Phase 5: Incident Reporting
```

---

## Phase 1: Compliance Calendar [checkpoint: f5c58d8]

> **Goal**: Never miss a drug test, physical, training renewal, or license expiration
>
> **Estimated Duration**: 2 weeks
>
> **Dependencies**: None (first phase)

### 1.1 Data Model & Backend Setup

- [x] Task: Create `ComplianceEvents` collection in Wix CMS
  - [x] Add all fields per spec (event_type, due_date, status, reminders, etc.)
  - [x] Configure indexes on carrier_dot, driver_id, due_date, status
  - [x] Set collection permissions (carrier owner/admin only)

- [x] Task: Create `ComplianceAlerts` collection in Wix CMS
  - [x] Add fields for alert_type, severity, status, related entities
  - [x] Configure indexes on carrier_dot, status, severity

- [x] Task: Create `src/backend/complianceCalendarService.jsw`
  - [x] Implement `getComplianceEvents(carrierDot, filters)`
  - [x] Implement `createComplianceEvent(eventData)`
  - [x] Implement `updateComplianceEvent(eventId, updates)`
  - [x] Implement `deleteComplianceEvent(eventId)`
  - [x] Implement `completeComplianceEvent(eventId, documentId)`
  - [x] Implement auto-renewal logic for recurring events

### 1.2 Calendar Views & Dashboard

- [x] Task: Implement `getCalendarView(carrierDot, startDate, endDate)`
  - [x] Return events grouped by status (overdue, due_soon, upcoming)
  - [x] Include summary counts for dashboard

- [x] Task: Implement `getComplianceDashboard(carrierDot)`
  - [x] Calculate compliance score (completed / total non-overdue)
  - [x] Return overdueCount, dueSoonCount, upcomingCount
  - [x] Include top 5 most urgent items

- [x] Task: Implement status update job
  - [x] Update event statuses based on due_date vs current date
  - [x] Mark events as `overdue`, `due_soon`, `upcoming`

### 1.3 Reminder System

- [x] Task: Implement `processComplianceReminders()`
  - [x] Query all events needing reminders (30, 14, 7, 0 days)
  - [x] Send appropriate notifications
  - [x] Update reminder_sent flags

- [x] Task: Add compliance reminders to `jobs.config`
  - [x] Schedule daily at 6 AM: `processComplianceReminders`

- [x] Task: Create email templates in `emailService.jsw`
  - [x] `compliance_reminder_30_day` template
  - [x] `compliance_reminder_14_day` template
  - [x] `compliance_reminder_7_day` template
  - [x] `compliance_overdue` template

### 1.4 Frontend UI

- [x] Task: Create `src/public/carrier/CARRIER_COMPLIANCE_CALENDAR.html`
  - [x] Compliance score card with visual progress bar
  - [x] Quick stats (overdue, due this week, up to date)
  - [x] Upcoming items list grouped by urgency
  - [x] "Mark Complete" action with document upload

- [x] Task: Implement calendar month view
  - [x] Visual calendar with events on due dates
  - [x] Color coding by status (red=overdue, yellow=soon, green=upcoming)
  - [x] Click to view/edit event details

- [x] Task: Create "Add Event" modal
  - [x] Event type selection dropdown
  - [x] Driver selection (if driver-specific)
  - [x] Due date picker
  - [x] Recurrence settings
  - [x] Notes field

- [x] Task: Implement PostMessage bridge
  - [x] `getComplianceCalendar` message type
  - [x] `createComplianceEvent` message type
  - [x] `updateComplianceEvent` message type
  - [x] `completeComplianceEvent` message type

### 1.5 Testing - Phase 1

- [x] Task: Create `src/public/__tests__/complianceCalendarService.test.js`
  - [x] Test CRUD operations
  - [x] Test recurring event logic
  - [x] Test status transitions
  - [x] Test reminder processing

- [ ] Task: Manual integration testing
  - [ ] Create test events for various types
  - [ ] Verify reminder emails sent
  - [ ] Test mark complete workflow
  - [ ] Verify calendar view accuracy

---

## Phase 2: Document Vault [checkpoint: 1f46b22]

> **Goal**: Centralized, audit-ready document storage with expiration tracking
>
> **Estimated Duration**: 2 weeks
>
> **Dependencies**: Phase 1 (for linking documents to compliance events)

### 2.1 Data Model & Backend Setup

- [x] Task: Create `CarrierDocuments` collection in Wix CMS
  - [x] Add all fields per spec (document_type, expiration_date, version, etc.)
  - [x] Configure indexes on carrier_dot, driver_id, document_type, expiration_date
  - [x] Set collection permissions

- [x] Task: Create `src/backend/documentVaultService.jsw`
  - [x] Implement `uploadDocument(carrierDot, documentData)`
  - [x] Implement `getDocuments(carrierDot, filters)`
  - [x] Implement `getDocument(documentId)`
  - [x] Implement `updateDocument(documentId, updates)`
  - [x] Implement `archiveDocument(documentId)`

### 2.2 Version History

- [x] Task: Implement version tracking
  - [x] `uploadNewVersion(documentId, newVersionData)` - create new version, link to previous
  - [x] `getDocumentVersionHistory(documentId)` - return all versions
  - [x] Auto-archive previous version on new upload

### 2.3 Expiration Tracking

- [x] Task: Implement `getExpiringDocuments(carrierDot, daysAhead)`
- [x] Task: Implement `getExpiredDocuments(carrierDot)`
- [x] Task: Create scheduled job to update `is_expired` and `days_until_expiry` fields
- [x] Task: Generate alerts for documents expiring within 30 days

### 2.4 Document Verification

- [x] Task: Implement `verifyDocument(documentId, verifierId, status, notes)`
- [x] Task: Create verification workflow UI for admins
- [x] Task: Track verification status in document list

### 2.5 Frontend UI

- [x] Task: Create `src/public/carrier/CARRIER_DOCUMENT_VAULT.html`
  - [x] Folder/category organization view
  - [x] Document list with status indicators
  - [x] Expiring documents alert banner
  - [x] Filter by category, driver, status

- [x] Task: Implement document upload component
  - [x] Drag-and-drop file upload
  - [x] Document type selection
  - [x] Driver assignment
  - [x] Issue/expiration date entry

- [x] Task: Implement document detail view
  - [x] File preview (PDF, images)
  - [x] Metadata display
  - [x] Version history
  - [x] Edit/archive actions

- [x] Task: Implement bulk upload feature
  - [x] Multiple file selection
  - [x] Batch metadata entry
  - [x] Progress indicator

### 2.6 Integration with Compliance Calendar

- [x] Task: Update `completeComplianceEvent` to accept and link document
- [x] Task: Auto-create compliance event from document with expiration date
- [x] Task: Show linked documents in compliance event detail

### 2.7 Testing - Phase 2

- [x] Task: Create `src/public/__tests__/documentVaultService.test.js`
  - [x] Test upload/download
  - [x] Test version history
  - [x] Test expiration tracking
  - [x] Test verification workflow

- [ ] Task: Manual integration testing
  - [ ] Upload various document types
  - [ ] Verify expiration alerts
  - [ ] Test version upload flow
  - [ ] Verify document-to-event linking

---

## Phase 3: Qualification File Tracker [checkpoint: 361ff12]

> **Goal**: FMCSA DQ file completeness per driver with audit-ready reports
>
> **Estimated Duration**: 1.5 weeks
>
> **Dependencies**: Phase 2 (Document Vault)

### 3.1 Data Model & Backend Setup

- [x] Task: Create `QualificationFiles` collection in Wix CMS
  - [x] Add fields per spec (checklist, completeness_score, missing_items, etc.)
  - [x] Configure indexes on carrier_dot, driver_id, status, completeness_score

- [x] Task: Create `src/backend/dqFileService.jsw`
  - [x] Implement `getDQFile(carrierDot, driverId)`
  - [x] Implement `getCarrierDQFiles(carrierDot, filters)`
  - [x] Implement `updateDQChecklistItem(dqFileId, itemKey, itemData)`
  - [x] Implement `linkDocumentToDQItem(dqFileId, itemKey, documentId)`

### 3.2 Completeness Calculation

- [x] Task: Implement `calculateCompleteness(dqFile)`
  - [x] Count required items with valid documents
  - [x] Deduct for expired documents
  - [x] Return percentage 0-100

- [x] Task: Implement automatic DQ file creation on driver hire
  - [x] Create QualificationFile record when driver added to carrier
  - [x] Initialize checklist with all required items

### 3.3 Audit Reports

- [x] Task: Implement `generateAuditReport(dqFileId)`
  - [x] Format checklist as printable report
  - [x] Include document references
  - [x] List missing and expiring items
  - [x] Add FMCSA compliance notes

- [x] Task: Implement `getDQFileSummary(carrierDot)`
  - [x] Total drivers, complete files, incomplete files
  - [x] Average completeness score
  - [x] Drivers with critical missing items

### 3.4 Frontend UI

- [x] Task: Create `src/public/carrier/CARRIER_DQ_TRACKER.html`
  - [x] Summary cards (total, complete, incomplete, avg score)
  - [x] Driver list with completeness bars
  - [x] Filter by status, completeness threshold
  - [x] Sort by name, completeness, expiring items

- [x] Task: Implement DQ file detail view
  - [x] Checklist with status indicators
  - [x] Link to upload missing documents
  - [x] Show expiration dates for time-sensitive items
  - [x] "Generate Audit Report" button

- [x] Task: Implement missing item alerts
  - [x] Highlight critical missing items
  - [x] Quick action to upload
  - [x] Due date warnings

### 3.5 Integration with Document Vault

- [x] Task: Auto-link uploaded documents to DQ checklist items
  - [x] Match document_type to checklist item
  - [x] Update completeness score on upload

- [x] Task: Update DQ file when document expires
  - [x] Change item status from `valid` to `expired`
  - [x] Recalculate completeness score

### 3.6 Testing - Phase 3

- [x] Task: Create `src/public/__tests__/dqFileService.test.js`
  - [x] Test completeness calculation
  - [x] Test document linking
  - [x] Test audit report generation

- [ ] Task: Manual integration testing
  - [ ] Create drivers and verify DQ files created
  - [ ] Upload documents and verify auto-linking
  - [ ] Generate and review audit reports

---

## Phase 4: CSA Score Monitor [checkpoint: eff32e9]

> **Goal**: Track company BASIC scores, alert on changes, visualize trends
>
> **Estimated Duration**: 1.5 weeks
>
> **Dependencies**: Phase 1, Existing fmcsaService.jsw

### 4.1 Data Model & Backend Setup

- [x] Task: Create `CSAScoreHistory` collection in Wix CMS
  - [x] Add fields per spec (snapshot_date, basics, trend_vs_prior, etc.)
  - [x] Configure indexes on carrier_dot, snapshot_date

- [x] Task: Create `src/backend/csaMonitorService.jsw`
  - [x] Import and extend `fmcsaService.jsw`
  - [x] Implement `getCSAScoresWithTrends(carrierDot)`
  - [x] Implement `getCSAScoreHistory(carrierDot, months)`
  - [x] Implement `snapshotCSAScores(carrierDot, source)`

### 4.2 Trend Analysis

- [x] Task: Implement trend calculation
  - [x] Compare current scores to previous snapshot
  - [x] Calculate change percentage per BASIC
  - [x] Identify improving/worsening categories

- [x] Task: Implement `getCSARecommendations(carrierDot)`
  - [x] Analyze score patterns
  - [x] Generate actionable recommendations
  - [x] Prioritize by impact

### 4.3 Automated Score Updates

- [x] Task: Implement `processCSAScoreUpdates()`
  - [x] Query all active carriers
  - [x] Fetch latest scores from FMCSA
  - [x] Create snapshot records
  - [x] Generate alerts for significant changes

- [x] Task: Add CSA update job to `jobs.config`
  - [x] Schedule weekly: `processCSAScoreUpdates`

- [x] Task: Implement CSA alert generation
  - [x] Alert when score increases >5% in 30 days
  - [x] Alert when approaching intervention threshold
  - [x] Alert on new BASIC alerts

### 4.4 Frontend UI

- [x] Task: Create `src/public/carrier/CARRIER_CSA_MONITOR.html`
  - [x] BASIC scores overview with progress bars
  - [x] Trend indicators (up/down arrows, percentages)
  - [x] Threshold warnings
  - [x] Last updated timestamp

- [x] Task: Implement trend chart
  - [x] 12-month historical view
  - [x] Line chart per BASIC category
  - [x] Threshold line overlay
  - [x] Hover tooltips

- [x] Task: Implement recommendations panel
  - [x] AI-generated improvement suggestions
  - [x] Priority indicators
  - [x] Links to relevant training resources

### 4.5 Integration with fmcsaService.jsw

- [x] Task: Add `getDetailedCSAData(dotNumber)` to fmcsaService.jsw
  - [x] Fetch enhanced BASIC data
  - [x] Include inspection/violation breakdown
  - [x] Cache results appropriately

- [x] Task: Ensure circuit breaker compatibility
  - [x] CSA monitor respects rate limits
  - [x] Graceful degradation on API issues

### 4.6 Testing - Phase 4

- [x] Task: Create `src/public/__tests__/csaMonitorService.test.js`
  - [x] Test snapshot creation
  - [x] Test trend calculation
  - [x] Test alert generation

- [ ] Task: Manual integration testing
  - [ ] Verify FMCSA data fetch
  - [ ] Check trend chart accuracy
  - [ ] Test alert notifications

---

## Phase 5: Incident Reporting

> **Goal**: DOT-compliant accident/incident documentation with investigation workflow
>
> **Estimated Duration**: 2 weeks
>
> **Dependencies**: Phases 1-2

### 5.1 Data Model & Backend Setup

- [ ] Task: Create `IncidentReports` collection in Wix CMS
  - [ ] Add all fields per spec (incident_type, severity, DOT reportability, etc.)
  - [ ] Configure indexes on carrier_dot, incident_date, driver_id, severity

- [ ] Task: Create `src/backend/incidentService.jsw`
  - [ ] Implement `createIncidentReport(incidentData)`
  - [ ] Implement `getIncidentReport(incidentId)`
  - [ ] Implement `getIncidentReports(carrierDot, filters)`
  - [ ] Implement `updateIncidentReport(incidentId, updates)`

### 5.2 DOT Reportability Classification

- [ ] Task: Implement `classifyDOTReportability(incidentData)`
  - [ ] Check fatality criterion
  - [ ] Check injury criterion (medical treatment away from scene)
  - [ ] Check tow-away criterion
  - [ ] Check hazmat release criterion
  - [ ] Return reportable status, reason, deadline

- [ ] Task: Implement `markDOTReported(incidentId, reportNumber)`
- [ ] Task: Create DOT reporting deadline alerts

### 5.3 Investigation Workflow

- [ ] Task: Implement `startInvestigation(incidentId, investigatorId)`
  - [ ] Update investigation_status
  - [ ] Create audit trail entry

- [ ] Task: Implement `addInvestigationFinding(incidentId, finding)`
  - [ ] Append to investigation findings
  - [ ] Track root cause analysis

- [ ] Task: Implement `closeInvestigation(incidentId, summary)`
  - [ ] Finalize investigation
  - [ ] Mark corrective actions

- [ ] Task: Implement `addCorrectiveAction(incidentId, action)`
  - [ ] Add action item with assignee and due date
  - [ ] Track completion status

### 5.4 Statistics & Reporting

- [ ] Task: Implement `getIncidentStatistics(carrierDot, dateRange)`
  - [ ] Total incidents by type and severity
  - [ ] DOT reportable count
  - [ ] Trending analysis (month-over-month)
  - [ ] Driver incident frequency

### 5.5 Frontend UI

- [ ] Task: Create `src/public/carrier/CARRIER_INCIDENT_REPORTING.html`
  - [ ] Incident list with filters
  - [ ] Quick stats (total, DOT reportable, open investigations)
  - [ ] Severity indicators

- [ ] Task: Create incident report form
  - [ ] Incident type selection
  - [ ] Driver and vehicle selection
  - [ ] Location entry (address, city, state)
  - [ ] Date/time picker
  - [ ] Injury/fatality/tow/hazmat checkboxes
  - [ ] Real-time DOT reportability indicator
  - [ ] Description text area
  - [ ] Photo/document upload

- [ ] Task: Create incident detail view
  - [ ] Full incident information
  - [ ] Investigation status and timeline
  - [ ] Corrective actions list
  - [ ] Attached documents/photos

- [ ] Task: Create investigation workflow UI
  - [ ] Start investigation button
  - [ ] Add finding modal
  - [ ] Corrective action form
  - [ ] Close investigation summary

### 5.6 Notifications

- [ ] Task: Create incident email templates
  - [ ] `incident_reported` - new incident notification
  - [ ] `incident_dot_reportable` - DOT reporting required
  - [ ] `incident_deadline_approaching` - DOT deadline reminder
  - [ ] `investigation_assigned` - investigator notification

### 5.7 Integration Points

- [ ] Task: Trigger CSA score refresh after incident
  - [ ] Call `snapshotCSAScores` with source `incident_triggered`

- [ ] Task: Link incident documents to Document Vault
  - [ ] Store photos and reports in CarrierDocuments
  - [ ] Reference from incident record

### 5.8 Testing - Phase 5

- [ ] Task: Create `src/public/__tests__/incidentService.test.js`
  - [ ] Test incident creation
  - [ ] Test DOT reportability logic
  - [ ] Test investigation workflow
  - [ ] Test statistics calculation

- [ ] Task: Manual integration testing
  - [ ] Create incidents of various types
  - [ ] Verify DOT classification accuracy
  - [ ] Test investigation workflow
  - [ ] Verify document attachment

---

## Quality Gates (Per Phase)

Before marking any phase complete:

- [ ] All backend functions implemented and tested
- [ ] All UI components functional
- [ ] PostMessage bridge working
- [ ] No console errors in browser
- [ ] No linting errors (`npm run lint`)
- [ ] Manual testing completed
- [ ] Collection permissions verified
- [ ] Observability logging added
- [ ] Documentation updated

---

## Dependencies & Blockers

### External Dependencies
- [ ] Carrier Conversion track (carrier_conversion_20260103) must be complete
- [ ] SMS provider selection for Phase 1 reminders (optional, can use email-only initially)
- [ ] FMCSA API key active and rate limits adequate for Phase 4

### Internal Dependencies
- Phase 2 depends on Phase 1 (document linking to compliance events)
- Phase 3 depends on Phase 2 (DQ files reference documents)
- Phase 4 depends on Phase 1 (alerts system) + fmcsaService.jsw
- Phase 5 depends on Phases 1-2 (alerts + documents)

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| FMCSA API rate limits | CSA monitoring delays | Use aggressive caching, batch requests |
| Large document uploads | Performance issues | Implement file size limits, compression |
| Complex compliance rules | User confusion | Provide in-app guidance, preset event types |
| Audit requirements vary | Incomplete coverage | Allow custom checklist items |

---

## Success Criteria

Phase 1 Complete When:
- [ ] Carriers can create/manage compliance events
- [ ] Reminders sent at 30/14/7/0 days
- [ ] Dashboard shows compliance score
- [ ] Calendar view functional

Phase 2 Complete When:
- [ ] Documents upload and display correctly
- [ ] Version history tracks changes
- [ ] Expiration alerts generated
- [ ] Documents link to compliance events

Phase 3 Complete When:
- [ ] DQ files auto-created for drivers
- [ ] Checklist updates automatically
- [ ] Completeness scores accurate
- [ ] Audit reports generate correctly

Phase 4 Complete When:
- [ ] CSA scores display with trends
- [ ] Historical data captured weekly
- [ ] Alerts generated for significant changes
- [ ] Recommendations engine working

Phase 5 Complete When:
- [ ] Incidents create with all fields
- [ ] DOT reportability auto-classified
- [ ] Investigation workflow complete
- [ ] Statistics dashboard accurate

---

## Notes

- Start with Phase 1 as it provides immediate value and establishes patterns
- Consider mobile-responsive design for incident reporting (often done in field)
- Document all event types and recurrence patterns for user guidance
- Plan for FMCSA API changes/deprecation with abstraction layer
