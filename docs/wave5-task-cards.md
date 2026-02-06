# Wave 5 Task Cards — Fleet & Compliance

**Timeline:** Weeks 10-11
**Juniors:** J3, J4
**Templates:** `_TEMPLATE_seed.jsw`, `_TEMPLATE_connectionTest.jsw`, `_TEMPLATE_bridge.test.js`, `_TEMPLATE_html.test.js`

---

## Wave 5 Key Notes

- **CARRIER_FLEET_DASHBOARD uses `action` key** (standard protocol)
- **All compliance pages use `type` key** protocol
- **CARRIER_CSA_MONITOR** delegates messages to `handleComplianceMessage()` bridge (similar to B2B bridge pattern)
- Multiple compliance services have **direct wixData fallback calls** — flag for Gate 2
- Existing test: `fleetDashboard.test.js` (logic-only, NOT a bridge test)

---

# JUNIOR 3 (J3): Fleet Management

## J3-A: Fleet Seed + Connection Test

### Deliverables
| # | File |
|---|------|
| 1 | `src/backend/seeds/seedFleet.jsw` |
| 2 | `src/backend/tests/fleetConnectionTest.jsw` |

### Collection Keys
| Key | Expected Airtable Table |
|-----|------------------------|
| `fleetDrivers` | `v2_Fleet_Drivers` |
| `equipmentAssets` | `v2_Equipment_Assets` |
| `equipmentAssignments` | `v2_Equipment_Assignments` |
| `driverScores` | `v2_Driver_Scores` |
| `capacityPlans` | `v2_Capacity_Plans` |
| `eldConnections` | `v2_ELD_Connections` |
| `driverLocations` | `v2_Driver_Locations` |

### Seed Data Requirements

**Fleet Drivers (8 records):**
```
carrier_dot, driver_id, name, status, hire_date, cdl_expiry, medical_card_expiry
```
- Statuses: 'active', 'on_leave', 'terminated', 'probation'
- 1 driver with expired CDL, 1 with expiring-soon medical card

**Equipment Assets (5 records):**
```
carrier_dot, type, unit_number, make, model, year, status, vin
```
- Types: 'tractor', 'trailer', 'reefer'
- 1 in maintenance, 1 decommissioned

**Equipment Assignments (3 records), Driver Scores (5 records), Capacity Plans (2 records), ELD Connections (3 records), Driver Locations (5 records)**
- Linked to fleet drivers above

## J3-B: Fleet Dashboard Bridge + HTML DOM Tests (NEW — existing test is logic-only)

### Source Files
- `src/pages/CARRIER_FLEET_DASHBOARD.unified.js` (bridge test)
- `src/public/carrier/CARRIER_FLEET_DASHBOARD.html` (HTML DOM test)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/carrierFleetDashboard.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/carrierFleetDashboard.html.test.js` | `_TEMPLATE_html.test.js` |

**Uses `action` key protocol.** Auth check validates `carrierDot` from member custom fields.

### Actions (14 total grouped by module)

**Driver Roster (3):**
| Action | Calls | Response |
|--------|-------|----------|
| `getDrivers` | `fleetService.getFleetDrivers(carrierDot, payload)` | `driversLoaded` |
| `getAlerts` | `fleetService.getExpiringCredentials(carrierDot)` | `alertsLoaded` |
| `addDriver` | `fleetService.addFleetDriver(carrierDot, driverData)` | `driverAdded` |

**Equipment (4):**
| Action | Calls | Response | Validation |
|--------|-------|----------|------------|
| `getEquipment` | `equipmentService.getEquipmentList` | `equipmentLoaded` | |
| `getAssetDetails` | `equipmentService.getEquipmentDetails` + `getAssignmentHistory` | `assetDetailsLoaded` | requires: equipmentId |
| `assignEquipment` | `equipmentService.assignEquipment` | `assignmentSuccess` | requires: equipmentId, driverId, type |
| `unassignEquipment` | `equipmentService.unassignEquipment` | `assignmentSuccess` | requires: equipmentId |

**Scorecard (3):**
| Action | Calls | Response | Validation |
|--------|-------|----------|------------|
| `getScorecard` | `scorecardService.getDriverScorecard` + `getDriverTrend` | `scorecardLoaded` | requires: driverId, periodType |
| `getFleetSummary` | `scorecardService.getFleetScoreboardSummary` | `summaryLoaded` | requires: periodType |
| `getRankings` | `scorecardService.getPerformanceRankings` | `rankingsLoaded` | requires: category, limit |

**Capacity (3):**
| Action | Calls | Response | Validation |
|--------|-------|----------|------------|
| `getCapacityOverview` | `capacityService.getCapacityOverview` | `overviewLoaded` | requires: period |
| `getDailyBreakdown` | `capacityService.getDailyBreakdown` | `breakdownLoaded` | requires: startDate, endDate |
| `getRecommendations` | `capacityService.generateCapacityRecommendations` | `recommendationsLoaded` | |

**ELD (1):**
| Action | Calls | Response |
|--------|-------|----------|
| `getFleetLocations` | `eldService.getFleetLocations` | `locationsLoaded` |

### J3 Acceptance Criteria
- [ ] `seedFleet.jsw` seeds across 7 collections
- [ ] `fleetConnectionTest.jsw` passes all 4 phases
- [ ] `carrierFleetDashboard.bridge.test.js` tests all 14 actions + error cases
- [ ] `carrierFleetDashboard.html.test.js` tests DOM rendering (driversLoaded, equipmentLoaded, scorecardLoaded, overviewLoaded, locationsLoaded)
- [ ] Uses `action` protocol (not `type`)

---

# JUNIOR 4 (J4): Compliance

## J4-A: Compliance Seed + Connection Test

### Deliverables
| # | File |
|---|------|
| 1 | `src/backend/seeds/seedCompliance.jsw` |
| 2 | `src/backend/tests/complianceConnectionTest.jsw` |

### Collection Keys
| Key | Expected Airtable Table |
|-----|------------------------|
| `complianceEvents` | `v2_Compliance_Events` |
| `complianceAlerts` | `v2_Compliance_Alerts` |
| `csaScoreHistory` | `v2_CSA_Score_History` |
| `carrierDocuments` | `v2_Carrier_Documents` |
| `qualificationFiles` | `v2_Qualification_Files` |
| `incidentReports` | `v2_Incident_Reports` |

**WARNING:** `complianceCalendarService`, `csaMonitorService`, `dqFileService`, `incidentService`, `documentVaultService` all have **direct wixData fallback calls**. Flag for Gate 2.

### Seed Data: 5 compliance events, 3 CSA snapshots, 5 carrier documents, 3 DQ files, 3 incidents

## J4-B: Compliance Calendar Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/complianceCalendar.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/complianceCalendar.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/CARRIER_COMPLIANCE_CALENDAR.ww0h3.js` — `type` protocol

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | `calendarReady` / `getComplianceData` | `getComplianceEvents({start, end})` | `setComplianceData` |
| 2 | `createComplianceEvent` | `createComplianceEvent(data)` | `eventCreated` |
| 3 | `navigateTo` | wixLocation | navigation |

## J4-C: CSA Monitor Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/csaMonitor.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/csaMonitor.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/CARRIER_CSA_MONITOR.bov8u.js` — `type` protocol
**Delegates most messages to `handleComplianceMessage('csaMonitor', carrierDot, message)`**

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | init | `getCompliancePageData('csaMonitor', carrierDot)` | initial data bundle + `carrierContext` |
| 2 | `navigateTo` | wixLocation | navigation |
| 3 | all others | `handleComplianceMessage(...)` | delegated response |

## J4-D: Document Vault Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/documentVault.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/documentVault.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/CARRIER_DOCUMENT_VAULT.yl5oe.js` — `type` protocol

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | `vaultReady` / `getDocuments` | `getDocuments()` | `setDocuments` |
| 2 | `uploadDocument` | `uploadDocument(data)` + refresh | `setDocuments` |
| 3 | `navigateTo` | wixLocation | navigation |

## J4-E: DQ Tracker Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/dqTracker.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/dqTracker.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/CARRIER_DQ_TRACKER.sb2ig.js` — `type` protocol

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | `dqTrackerReady` / `getDQFiles` | `getDQFiles()` | `setDQFiles` |
| 2 | `generateAuditReport` | `generateAuditReport(dqFileId)` | — | requires: data.dqFileId |
| 3 | `navigateTo` | wixLocation | navigation |

## J4-F: Incident Reporting Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/incidentReporting.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/incidentReporting.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/CARRIER_INCIDENT_REPORTING.dfobc.js` — `type` protocol

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | `incidentsReady` / `getIncidents` | `getIncidents()` | `setIncidents` |
| 2 | `createIncidentReport` | `createIncident(data)` + refresh | `setIncidents` |
| 3 | `navigateTo` | wixLocation | navigation |

### J4 Acceptance Criteria
- [ ] `seedCompliance.jsw` seeds across 6 collections
- [ ] `complianceConnectionTest.jsw` passes all 4 phases
- [ ] 5 new bridge tests: calendar (3), csaMonitor (3), documentVault (3), dqTracker (3), incidentReporting (3)
- [ ] 5 new HTML DOM tests: `complianceCalendar.html.test.js`, `csaMonitor.html.test.js`, `documentVault.html.test.js`, `dqTracker.html.test.js`, `incidentReporting.html.test.js`
- [ ] All compliance pages use `type` protocol
- [ ] Direct wixData fallback calls documented for Gate 2
