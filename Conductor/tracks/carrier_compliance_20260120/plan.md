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

## Phase 1: Compliance Calendar

> **Goal**: Never miss a drug test, physical, training renewal, or license expiration
>
> **Estimated Duration**: 2 weeks
>
> **Dependencies**: None (first phase)

### 1.1 Data Model & Backend Setup

- [ ] Task: Create `ComplianceEvents` collection in Wix CMS
  - [ ] Add all fields per spec (event_type, due_date, status, reminders, etc.)
  - [ ] Configure indexes on carrier_dot, driver_id, due_date, status
  - [ ] Set collection permissions (carrier owner/admin only)

- [ ] Task: Create `ComplianceAlerts` collection in Wix CMS
  - [ ] Add fields for alert_type, severity, status, related entities
  - [ ] Configure indexes on carrier_dot, status, severity

- [ ] Task: Create `src/backend/complianceCalendarService.jsw`
  - [ ] Implement `getComplianceEvents(carrierDot, filters)`
  - [ ] Implement `createComplianceEvent(eventData)`
  - [ ] Implement `updateComplianceEvent(eventId, updates)`
  - [ ] Implement `deleteComplianceEvent(eventId)`
  - [ ] Implement `completeComplianceEvent(eventId, documentId)`
  - [ ] Implement auto-renewal logic for recurring events

### 1.2 Calendar Views & Dashboard

- [ ] Task: Implement `getCalendarView(carrierDot, startDate, endDate)`
  - [ ] Return events grouped by status (overdue, due_soon, upcoming)
  - [ ] Include summary counts for dashboard

- [ ] Task: Implement `getComplianceDashboard(carrierDot)`
  - [ ] Calculate compliance score (completed / total non-overdue)
  - [ ] Return overdueCount, dueSoonCount, upcomingCount
  - [ ] Include top 5 most urgent items

- [ ] Task: Implement status update job
  - [ ] Update event statuses based on due_date vs current date
  - [ ] Mark events as `overdue`, `due_soon`, `upcoming`

### 1.3 Reminder System

- [ ] Task: Implement `processComplianceReminders()`
  - [ ] Query all events needing reminders (30, 14, 7, 0 days)
  - [ ] Send appropriate notifications
  - [ ] Update reminder_sent flags

- [ ] Task: Add compliance reminders to `jobs.config`
  - [ ] Schedule daily at 6 AM: `processComplianceReminders`

- [ ] Task: Create email templates in `emailService.jsw`
  - [ ] `compliance_reminder_30_day` template
  - [ ] `compliance_reminder_14_day` template
  - [ ] `compliance_reminder_7_day` template
  - [ ] `compliance_overdue` template

### 1.4 Frontend UI

- [ ] Task: Create `src/public/carrier/CARRIER_COMPLIANCE_CALENDAR.html`
  - [ ] Compliance score card with visual progress bar
  - [ ] Quick stats (overdue, due this week, up to date)
  - [ ] Upcoming items list grouped by urgency
  - [ ] "Mark Complete" action with document upload

- [ ] Task: Implement calendar month view
  - [ ] Visual calendar with events on due dates
  - [ ] Color coding by status (red=overdue, yellow=soon, green=upcoming)
  - [ ] Click to view/edit event details

- [ ] Task: Create "Add Event" modal
  - [ ] Event type selection dropdown
  - [ ] Driver selection (if driver-specific)
  - [ ] Due date picker
  - [ ] Recurrence settings
  - [ ] Notes field

- [ ] Task: Implement PostMessage bridge
  - [ ] `getComplianceCalendar` message type
  - [ ] `createComplianceEvent` message type
  - [ ] `updateComplianceEvent` message type
  - [ ] `completeComplianceEvent` message type

### 1.5 Testing - Phase 1

- [ ] Task: Create `src/public/__tests__/complianceCalendarService.test.js`
  - [ ] Test CRUD operations
  - [ ] Test recurring event logic
  - [ ] Test status transitions
  - [ ] Test reminder processing

- [ ] Task: Manual integration testing
  - [ ] Create test events for various types
  - [ ] Verify reminder emails sent
  - [ ] Test mark complete workflow
  - [ ] Verify calendar view accuracy

---

## Phase 2: Document Vault

> **Goal**: Centralized, audit-ready document storage with expiration tracking
>
> **Estimated Duration**: 2 weeks
>
> **Dependencies**: Phase 1 (for linking documents to compliance events)

### 2.1 Data Model & Backend Setup

- [ ] Task: Create `CarrierDocuments` collection in Wix CMS
  - [ ] Add all fields per spec (document_type, expiration_date, version, etc.)
  - [ ] Configure indexes on carrier_dot, driver_id, document_type, expiration_date
  - [ ] Set collection permissions

- [ ] Task: Create `src/backend/documentVaultService.jsw`
  - [ ] Implement `uploadDocument(carrierDot, documentData)`
  - [ ] Implement `getDocuments(carrierDot, filters)`
  - [ ] Implement `getDocument(documentId)`
  - [ ] Implement `updateDocument(documentId, updates)`
  - [ ] Implement `archiveDocument(documentId)`

### 2.2 Version History

- [ ] Task: Implement version tracking
  - [ ] `uploadNewVersion(documentId, newVersionData)` - create new version, link to previous
  - [ ] `getDocumentVersionHistory(documentId)` - return all versions
  - [ ] Auto-archive previous version on new upload

### 2.3 Expiration Tracking

- [ ] Task: Implement `getExpiringDocuments(carrierDot, daysAhead)`
- [ ] Task: Implement `getExpiredDocuments(carrierDot)`
- [ ] Task: Create scheduled job to update `is_expired` and `days_until_expiry` fields
- [ ] Task: Generate alerts for documents expiring within 30 days

### 2.4 Document Verification

- [ ] Task: Implement `verifyDocument(documentId, verifierId, status, notes)`
- [ ] Task: Create verification workflow UI for admins
- [ ] Task: Track verification status in document list

### 2.5 Frontend UI

- [ ] Task: Create `src/public/carrier/CARRIER_DOCUMENT_VAULT.html`
  - [ ] Folder/category organization view
  - [ ] Document list with status indicators
  - [ ] Expiring documents alert banner
  - [ ] Filter by category, driver, status

- [ ] Task: Implement document upload component
  - [ ] Drag-and-drop file upload
  - [ ] Document type selection
  - [ ] Driver assignment
  - [ ] Issue/expiration date entry

- [ ] Task: Implement document detail view
  - [ ] File preview (PDF, images)
  - [ ] Metadata display
  - [ ] Version history
  - [ ] Edit/archive actions

- [ ] Task: Implement bulk upload feature
  - [ ] Multiple file selection
  - [ ] Batch metadata entry
  - [ ] Progress indicator

### 2.6 Integration with Compliance Calendar

- [ ] Task: Update `completeComplianceEvent` to accept and link document
- [ ] Task: Auto-create compliance event from document with expiration date
- [ ] Task: Show linked documents in compliance event detail

### 2.7 Testing - Phase 2

- [ ] Task: Create `src/public/__tests__/documentVaultService.test.js`
  - [ ] Test upload/download
  - [ ] Test version history
  - [ ] Test expiration tracking
  - [ ] Test verification workflow

- [ ] Task: Manual integration testing
  - [ ] Upload various document types
  - [ ] Verify expiration alerts
  - [ ] Test version upload flow
  - [ ] Verify document-to-event linking

---

## Phase 3: Qualification File Tracker

> **Goal**: FMCSA DQ file completeness per driver with audit-ready reports
>
> **Estimated Duration**: 1.5 weeks
>
> **Dependencies**: Phase 2 (Document Vault)

### 3.1 Data Model & Backend Setup

- [ ] Task: Create `QualificationFiles` collection in Wix CMS
  - [ ] Add fields per spec (checklist, completeness_score, missing_items, etc.)
  - [ ] Configure indexes on carrier_dot, driver_id, status, completeness_score

- [ ] Task: Create `src/backend/dqFileService.jsw`
  - [ ] Implement `getDQFile(carrierDot, driverId)`
  - [ ] Implement `getCarrierDQFiles(carrierDot, filters)`
  - [ ] Implement `updateDQChecklistItem(dqFileId, itemKey, itemData)`
  - [ ] Implement `linkDocumentToDQItem(dqFileId, itemKey, documentId)`

### 3.2 Completeness Calculation

- [ ] Task: Implement `calculateCompleteness(dqFile)`
  - [ ] Count required items with valid documents
  - [ ] Deduct for expired documents
  - [ ] Return percentage 0-100

- [ ] Task: Implement automatic DQ file creation on driver hire
  - [ ] Create QualificationFile record when driver added to carrier
  - [ ] Initialize checklist with all required items

### 3.3 Audit Reports

- [ ] Task: Implement `generateAuditReport(dqFileId)`
  - [ ] Format checklist as printable report
  - [ ] Include document references
  - [ ] List missing and expiring items
  - [ ] Add FMCSA compliance notes

- [ ] Task: Implement `getDQFileSummary(carrierDot)`
  - [ ] Total drivers, complete files, incomplete files
  - [ ] Average completeness score
  - [ ] Drivers with critical missing items

### 3.4 Frontend UI

- [ ] Task: Create `src/public/carrier/CARRIER_DQ_TRACKER.html`
  - [ ] Summary cards (total, complete, incomplete, avg score)
  - [ ] Driver list with completeness bars
  - [ ] Filter by status, completeness threshold
  - [ ] Sort by name, completeness, expiring items

- [ ] Task: Implement DQ file detail view
  - [ ] Checklist with status indicators
  - [ ] Link to upload missing documents
  - [ ] Show expiration dates for time-sensitive items
  - [ ] "Generate Audit Report" button

- [ ] Task: Implement missing item alerts
  - [ ] Highlight critical missing items
  - [ ] Quick action to upload
  - [ ] Due date warnings

### 3.5 Integration with Document Vault

- [ ] Task: Auto-link uploaded documents to DQ checklist items
  - [ ] Match document_type to checklist item
  - [ ] Update completeness score on upload

- [ ] Task: Update DQ file when document expires
  - [ ] Change item status from `valid` to `expired`
  - [ ] Recalculate completeness score

### 3.6 Testing - Phase 3

- [ ] Task: Create `src/public/__tests__/dqFileService.test.js`
  - [ ] Test completeness calculation
  - [ ] Test document linking
  - [ ] Test audit report generation

- [ ] Task: Manual integration testing
  - [ ] Create drivers and verify DQ files created
  - [ ] Upload documents and verify auto-linking
  - [ ] Generate and review audit reports

---

## Phase 4: CSA Score Monitor

> **Goal**: Track company BASIC scores, alert on changes, visualize trends
>
> **Estimated Duration**: 1.5 weeks
>
> **Dependencies**: Phase 1, Existing fmcsaService.jsw

### 4.1 Data Model & Backend Setup

- [ ] Task: Create `CSAScoreHistory` collection in Wix CMS
  - [ ] Add fields per spec (snapshot_date, basics, trend_vs_prior, etc.)
  - [ ] Configure indexes on carrier_dot, snapshot_date

- [ ] Task: Create `src/backend/csaMonitorService.jsw`
  - [ ] Import and extend `fmcsaService.jsw`
  - [ ] Implement `getCSAScoresWithTrends(carrierDot)`
  - [ ] Implement `getCSAScoreHistory(carrierDot, months)`
  - [ ] Implement `snapshotCSAScores(carrierDot, source)`

### 4.2 Trend Analysis

- [ ] Task: Implement trend calculation
  - [ ] Compare current scores to previous snapshot
  - [ ] Calculate change percentage per BASIC
  - [ ] Identify improving/worsening categories

- [ ] Task: Implement `getCSARecommendations(carrierDot)`
  - [ ] Analyze score patterns
  - [ ] Generate actionable recommendations
  - [ ] Prioritize by impact

### 4.3 Automated Score Updates

- [ ] Task: Implement `processCSAScoreUpdates()`
  - [ ] Query all active carriers
  - [ ] Fetch latest scores from FMCSA
  - [ ] Create snapshot records
  - [ ] Generate alerts for significant changes

- [ ] Task: Add CSA update job to `jobs.config`
  - [ ] Schedule weekly: `processCSAScoreUpdates`

- [ ] Task: Implement CSA alert generation
  - [ ] Alert when score increases >5% in 30 days
  - [ ] Alert when approaching intervention threshold
  - [ ] Alert on new BASIC alerts

### 4.4 Frontend UI

- [ ] Task: Create `src/public/carrier/CARRIER_CSA_MONITOR.html`
  - [ ] BASIC scores overview with progress bars
  - [ ] Trend indicators (up/down arrows, percentages)
  - [ ] Threshold warnings
  - [ ] Last updated timestamp

- [ ] Task: Implement trend chart
  - [ ] 12-month historical view
  - [ ] Line chart per BASIC category
  - [ ] Threshold line overlay
  - [ ] Hover tooltips

- [ ] Task: Implement recommendations panel
  - [ ] AI-generated improvement suggestions
  - [ ] Priority indicators
  - [ ] Links to relevant training resources

### 4.5 Integration with fmcsaService.jsw

- [ ] Task: Add `getDetailedCSAData(dotNumber)` to fmcsaService.jsw
  - [ ] Fetch enhanced BASIC data
  - [ ] Include inspection/violation breakdown
  - [ ] Cache results appropriately

- [ ] Task: Ensure circuit breaker compatibility
  - [ ] CSA monitor respects rate limits
  - [ ] Graceful degradation on API issues

### 4.6 Testing - Phase 4

- [ ] Task: Create `src/public/__tests__/csaMonitorService.test.js`
  - [ ] Test snapshot creation
  - [ ] Test trend calculation
  - [ ] Test alert generation

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
