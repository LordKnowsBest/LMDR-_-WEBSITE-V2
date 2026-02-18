# Agent Tool Spec: Carrier + B2B Sections
# Track: full_agentic_buildout_20260218
# Platform: LMDR / VelocityMatch — Wix Velo CDL Truck Driver Recruiting
# Generated: 2026-02-18

## Overview

This spec defines every agent tool for the **carrier** and **b2b** roles in the full agentic
buildout. Each tool maps to an existing backend `.jsw` service and Airtable collection. The
agent orchestration layer (`agentService.jsw → handleAgentTurn`) builds a role-scoped tool
list at runtime; only tools matching the authenticated user's role are exposed.

**Risk levels:**
- `read` — safe read-only, no approval required
- `suggest` — prepares a recommendation or preview, user confirms before execute
- `execute_low` — low-impact write (status flag, note, preference)
- `execute_high` — high-impact write (subscription change, incident record, bulk update)

---

## CARRIER TOOLS (~60 tools)

### Track: carrier_fleet_dashboard_20260120

---

### get_fleet_roster
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the paginated list of drivers associated with the carrier's DOT number, with optional filters for status, terminal, and search term. Powers the Driver Roster table in the Fleet Dashboard.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  status: string             — Filter by driver status: active | driving | resting | on_leave | medical_leave | suspended | terminated | all (default: all)
  search: string             — Partial match on driver name or employee ID
  terminal: string           — Filter by home terminal location string
  sort_by: string            — Sort field: name | hire_date | status | license_expiry (default: name)
  sort_order: string         — asc | desc (default: asc)
  page: number               — 1-based page number (default: 1)
  page_size: number          — Records per page, max 100 (default: 25)
  ```
- **Backend Service:** fleetService.jsw → getFleetDrivers()
- **Airtable Collection(s):** fleetDrivers → v2_Fleet Drivers
- **Approval Required:** No
- **Dependencies:** carrier_conversion_20260103 (carrier auth context)

---

### get_driver_detail
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the full record for a single fleet driver including assigned equipment, HOS status, upcoming credential expirations, and recent scorecard summary.
- **Parameters:**
  ```
  driver_id: string          — FleetDrivers Airtable record ID (required)
  include_scores: boolean    — Include latest scorecard snapshot (default: true)
  include_location: boolean  — Include last known ELD location (default: true)
  ```
- **Backend Service:** fleetService.jsw → getDriverDetails()
- **Airtable Collection(s):** fleetDrivers → v2_Fleet Drivers; driverScores → v2_Driver Scores; driverLocations → v2_Driver Locations
- **Approval Required:** No
- **Dependencies:** eldIntegrationService.jsw, driverScorecardService.jsw

---

### update_driver_status
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Updates the employment/availability status of a fleet driver. Logs a status change event with reason. Triggers downstream capacity recalculation.
- **Parameters:**
  ```
  driver_id: string          — FleetDrivers record ID (required)
  new_status: string         — active | driving | resting | on_leave | medical_leave | suspended | terminated (required)
  reason: string             — Freeform reason for the change (required)
  effective_date: string     — ISO 8601 date, defaults to today
  notes: string              — Optional internal notes
  ```
- **Backend Service:** fleetService.jsw → updateDriverStatus()
- **Airtable Collection(s):** fleetDrivers → v2_Fleet Drivers
- **Approval Required:** No (Yes if new_status is suspended or terminated)
- **Dependencies:** capacityPlanningService.jsw (triggers recalc)

---

### get_driver_performance
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the performance scorecard for a specific driver for a given period, including safety, efficiency, service, and compliance sub-scores and trend delta versus prior period.
- **Parameters:**
  ```
  driver_id: string          — FleetDrivers record ID (required)
  period_type: string        — weekly | monthly | quarterly (default: monthly)
  period_offset: number      — 0 = current period, 1 = one period back (default: 0)
  ```
- **Backend Service:** driverScorecardService.jsw → getDriverScorecard()
- **Airtable Collection(s):** driverScores → v2_Driver Scores
- **Approval Required:** No
- **Dependencies:** None

---

### get_roster_summary
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns aggregate counts of drivers by status, expiring credentials in the next 30 days, and fleet-wide average scorecard. Used for dashboard header KPIs.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  expiry_window_days: number — Look-ahead window for credential alerts (default: 30)
  ```
- **Backend Service:** fleetService.jsw → getFleetSummary()
- **Airtable Collection(s):** fleetDrivers → v2_Fleet Drivers; driverScores → v2_Driver Scores
- **Approval Required:** No
- **Dependencies:** None

---

### export_roster
- **Role:** carrier
- **Risk Level:** read
- **Description:** Generates a CSV export of the full driver roster with active filters applied. Returns a signed download URL valid for 15 minutes.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  status: string             — Status filter to apply before export (default: all)
  fields: string[]           — Array of field names to include; omit for all fields
  format: string             — csv | xlsx (default: csv)
  ```
- **Backend Service:** fleetService.jsw → exportDriverRoster()
- **Airtable Collection(s):** fleetDrivers → v2_Fleet Drivers
- **Approval Required:** No
- **Dependencies:** Wix Media Manager (temporary file hosting)

---

### get_equipment_list
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the paginated equipment asset list for the carrier, filterable by type (truck/trailer), status, and assignment state. Includes current driver assignment and days until next scheduled maintenance.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  asset_type: string         — truck | trailer | other | all (default: all)
  status: string             — active | maintenance | out_of_service | sold | all (default: active)
  assigned_only: boolean     — Return only assigned units (default: false)
  page: number               — 1-based page (default: 1)
  page_size: number          — Max 100 (default: 25)
  ```
- **Backend Service:** equipmentService.jsw → getEquipmentList()
- **Airtable Collection(s):** equipmentAssets → v2_Equipment Assets
- **Approval Required:** No
- **Dependencies:** None

---

### add_equipment
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Creates a new equipment asset record for the carrier's fleet. Validates VIN format and checks for duplicate unit numbers before inserting.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  asset_type: string         — truck | trailer | other (required)
  unit_number: string        — Fleet unit number e.g. TRK-101 (required)
  vin: string                — 17-character VIN (required)
  make: string               — Manufacturer name (required)
  model: string              — Model name (required)
  year: number               — Model year (required)
  license_plate: string      — Current plate number (required)
  license_state: string      — 2-letter state code (required)
  registration_expiry: string — ISO 8601 date (required)
  fuel_type: string          — diesel | natural_gas | electric (default: diesel)
  eld_device_id: string      — Optional ELD device identifier
  notes: string              — Optional notes
  ```
- **Backend Service:** equipmentService.jsw → addEquipment()
- **Airtable Collection(s):** equipmentAssets → v2_Equipment Assets
- **Approval Required:** No
- **Dependencies:** None

---

### update_equipment
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Updates fields on an existing equipment record. Partial updates supported — only provided fields are changed.
- **Parameters:**
  ```
  equipment_id: string       — EquipmentAssets record ID (required)
  status: string             — New status if changing
  current_mileage: number    — Updated odometer reading
  license_plate: string      — Updated plate number
  registration_expiry: string — Updated registration expiry ISO 8601
  eld_device_id: string      — Updated ELD device ID
  notes: string              — Replacement notes
  ```
- **Backend Service:** equipmentService.jsw → updateEquipment()
- **Airtable Collection(s):** equipmentAssets → v2_Equipment Assets
- **Approval Required:** No
- **Dependencies:** None

---

### get_maintenance_schedule
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns all equipment units with upcoming or overdue maintenance, sorted by urgency. Supports filtering by days-ahead window and asset type.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  days_ahead: number         — Look-ahead window in days (default: 30)
  asset_type: string         — truck | trailer | other | all (default: all)
  include_overdue: boolean   — Include already-overdue items (default: true)
  ```
- **Backend Service:** equipmentService.jsw → getMaintenanceDue()
- **Airtable Collection(s):** equipmentAssets → v2_Equipment Assets; maintenanceLogs → v2_Maintenance Logs
- **Approval Required:** No
- **Dependencies:** None

---

### log_maintenance
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Records a completed maintenance event for a piece of equipment and updates next_service_due fields based on the service type performed.
- **Parameters:**
  ```
  equipment_id: string       — EquipmentAssets record ID (required)
  service_type: string       — oil_change | tire_rotation | brake_inspection | annual_dot | pm_service | repair | other (required)
  service_date: string       — ISO 8601 date (required)
  mileage_at_service: number — Odometer at time of service (required)
  vendor: string             — Shop or vendor name
  cost_usd: number           — Total service cost in USD
  notes: string              — Service notes or findings
  next_service_miles: number — Override next service mileage interval
  next_service_date: string  — Override next service date ISO 8601
  ```
- **Backend Service:** equipmentService.jsw → logMaintenance()
- **Airtable Collection(s):** maintenanceLogs → v2_Maintenance Logs; equipmentAssets → v2_Equipment Assets
- **Approval Required:** No
- **Dependencies:** None

---

### get_equipment_utilization
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns utilization metrics per unit (days assigned, miles driven, idle days, revenue-generating percentage) for a date range. Highlights under-utilized and over-stressed assets.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  start_date: string         — ISO 8601 start date (required)
  end_date: string           — ISO 8601 end date (required)
  asset_type: string         — truck | trailer | all (default: all)
  ```
- **Backend Service:** equipmentService.jsw → getEquipmentUtilization()
- **Airtable Collection(s):** equipmentAssets → v2_Equipment Assets; equipmentAssignments → v2_Equipment Assignments
- **Approval Required:** No
- **Dependencies:** None

---

### get_safety_scorecard
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the safety dimension of the fleet scorecard — accident counts, CSA safety measurement scores, speeding events, hard braking events, and inspection pass rates — for the current or specified period.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  period_type: string        — weekly | monthly | quarterly (default: monthly)
  period_offset: number      — 0 = current, 1 = one period back (default: 0)
  driver_id: string          — Scope to a single driver; omit for fleet aggregate
  ```
- **Backend Service:** driverScorecardService.jsw → getDriverScorecard()
- **Airtable Collection(s):** driverScores → v2_Driver Scores
- **Approval Required:** No
- **Dependencies:** None

---

### get_performance_scorecard
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the efficiency and service dimensions of the fleet scorecard — fuel economy, idle time, on-time delivery rate, and customer ratings — for the fleet or a single driver.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  period_type: string        — weekly | monthly | quarterly (default: monthly)
  period_offset: number      — 0 = current, 1 = one period back (default: 0)
  driver_id: string          — Scope to a single driver; omit for fleet aggregate
  ```
- **Backend Service:** driverScorecardService.jsw → getFleetScoreboardSummary()
- **Airtable Collection(s):** driverScores → v2_Driver Scores
- **Approval Required:** No
- **Dependencies:** None

---

### get_compliance_scorecard
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns compliance dimension scores — HOS violation counts, ELD compliance rate, DVIR completion rate, and DOT inspection outcomes — for the fleet or a single driver.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  period_type: string        — weekly | monthly | quarterly (default: monthly)
  period_offset: number      — 0 = current (default: 0)
  driver_id: string          — Scope to single driver; omit for fleet aggregate
  ```
- **Backend Service:** driverScorecardService.jsw → getDriverScorecard()
- **Airtable Collection(s):** driverScores → v2_Driver Scores
- **Approval Required:** No
- **Dependencies:** eldIntegrationService.jsw

---

### compare_to_industry
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the carrier's scorecard metrics benchmarked against industry averages for their segment (fleet size band, primary lane type). Highlights above/below average dimensions.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  period_type: string        — monthly | quarterly (default: monthly)
  segment: string            — small_fleet | mid_fleet | large_fleet | auto-detect (default: auto-detect)
  ```
- **Backend Service:** driverScorecardService.jsw → getIndustryBenchmark()
- **Airtable Collection(s):** driverScores → v2_Driver Scores; industryBenchmarks → v2_Industry Benchmarks
- **Approval Required:** No
- **Dependencies:** None

---

### get_scorecard_trends
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns time-series scorecard data across N periods for trend charting. Supports overall score or a specific dimension (safety, efficiency, service, compliance).
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  driver_id: string          — Scope to single driver; omit for fleet average
  dimension: string          — overall | safety | efficiency | service | compliance (default: overall)
  period_type: string        — weekly | monthly (default: monthly)
  periods: number            — Number of periods to return, max 24 (default: 6)
  ```
- **Backend Service:** driverScorecardService.jsw → getDriverTrend()
- **Airtable Collection(s):** driverScores → v2_Driver Scores
- **Approval Required:** No
- **Dependencies:** None

---

### get_capacity_overview
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns today's capacity snapshot: total drivers, available drivers, drivers on active loads, utilization percentage, capacity gap, and any high-gap alerts.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  date: string               — ISO 8601 date; defaults to today
  ```
- **Backend Service:** capacityPlanningService.jsw → getDailyCapacity()
- **Airtable Collection(s):** capacityPlans → v2_Capacity Plans; fleetDrivers → v2_Fleet Drivers
- **Approval Required:** No
- **Dependencies:** fleetService.jsw

---

### update_capacity
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Manually adjusts the capacity plan for a given date — useful when the carrier knows about planned leave, unexpected absences, or extra drivers being added for a high-volume day.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  date: string               — ISO 8601 date (required)
  adjustment_type: string    — add_drivers | remove_drivers | set_booked_loads (required)
  quantity: number           — Number of drivers to add/remove or loads to set (required)
  reason: string             — Explanation for the manual adjustment
  ```
- **Backend Service:** capacityPlanningService.jsw → updateCapacityPlan()
- **Airtable Collection(s):** capacityPlans → v2_Capacity Plans
- **Approval Required:** No
- **Dependencies:** None

---

### get_capacity_forecast
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns a 7 or 14-day forward-looking capacity forecast, projecting available drivers versus anticipated load volume based on historical patterns and known scheduled leave.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  days_ahead: number         — Forecast horizon in days: 7 | 14 | 30 (default: 7)
  ```
- **Backend Service:** capacityPlanningService.jsw → getCapacityForecast()
- **Airtable Collection(s):** capacityPlans → v2_Capacity Plans; fleetDrivers → v2_Fleet Drivers
- **Approval Required:** No
- **Dependencies:** None

---

### set_hiring_targets
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Sets or updates the carrier's driver hiring targets for a given time window. Used by the reverse-matching engine to prioritize driver outreach and by VelocityMatch B2B to surface urgency signals.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  target_headcount: number   — Target total driver count (required)
  target_date: string        — ISO 8601 target date to reach headcount (required)
  open_positions: number     — Number of open positions right now (required)
  priority: string           — low | medium | high | critical (default: medium)
  notes: string              — Optional hiring notes
  ```
- **Backend Service:** capacityPlanningService.jsw → setHiringTargets()
- **Airtable Collection(s):** capacityPlans → v2_Capacity Plans; carrierPreferences → v2_Carrier Preferences
- **Approval Required:** No
- **Dependencies:** carrierPreferences.jsw

---

### get_hiring_progress
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns current hiring funnel metrics: applications received, interviews scheduled, offers extended, hires completed versus the carrier's open position targets.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  date_range_days: number    — Rolling window in days (default: 30)
  ```
- **Backend Service:** capacityPlanningService.jsw → getHiringProgress()
- **Airtable Collection(s):** capacityPlans → v2_Capacity Plans; applicationService → v2_Applications
- **Approval Required:** No
- **Dependencies:** applicationService.jsw

---

### get_eld_summary
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the fleet-level ELD connection status, last sync timestamps per provider, and a count of drivers with active location data versus those without ELD coverage.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  ```
- **Backend Service:** eldIntegrationService.jsw → getELDSummary()
- **Airtable Collection(s):** eldConnections → v2_ELD Connections; driverLocations → v2_Driver Locations
- **Approval Required:** No
- **Dependencies:** None

---

### get_eld_violations
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns HOS violations detected via ELD data, filterable by severity and date range. Includes driver name, violation type, timestamp, and associated load if available.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  start_date: string         — ISO 8601 start date (default: 7 days ago)
  end_date: string           — ISO 8601 end date (default: today)
  severity: string           — warning | violation | all (default: all)
  driver_id: string          — Filter to a specific driver; omit for all
  ```
- **Backend Service:** eldIntegrationService.jsw → getHOSViolations()
- **Airtable Collection(s):** hosViolations → v2_HOS Violations
- **Approval Required:** No
- **Dependencies:** eldIntegrationService.jsw

---

### get_hos_compliance_rate
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the fleet's HOS compliance rate as a percentage over a date range, broken down by driver. Flags drivers below the compliance threshold.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  start_date: string         — ISO 8601 start date (default: 30 days ago)
  end_date: string           — ISO 8601 end date (default: today)
  threshold_pct: number      — Flag drivers below this compliance rate (default: 95)
  ```
- **Backend Service:** eldIntegrationService.jsw → getHOSComplianceRate()
- **Airtable Collection(s):** hosViolations → v2_HOS Violations; fleetDrivers → v2_Fleet Drivers
- **Approval Required:** No
- **Dependencies:** None

---

### get_drive_time_utilization
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns how effectively drivers are using their available drive-time hours — ratio of actual drive time to legally available drive time — for the fleet or a specific driver over a date range.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  start_date: string         — ISO 8601 start date (default: 7 days ago)
  end_date: string           — ISO 8601 end date (default: today)
  driver_id: string          — Filter to specific driver; omit for fleet aggregate
  ```
- **Backend Service:** eldIntegrationService.jsw → getDriveTimeUtilization()
- **Airtable Collection(s):** driverLocations → v2_Driver Locations; hosViolations → v2_HOS Violations
- **Approval Required:** No
- **Dependencies:** eldIntegrationService.jsw

---

### Track: carrier_compliance_20260120

---

### get_compliance_calendar
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the compliance event calendar for the carrier, showing all upcoming drug tests, physicals, training renewals, registration expirations, and audit-required deadlines within a specified window.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  days_ahead: number         — Look-ahead window in days (default: 60)
  event_type: string         — drug_test | physical | training | registration | audit | all (default: all)
  driver_id: string          — Filter to specific driver; omit for all
  ```
- **Backend Service:** complianceCalendarService.jsw → getComplianceCalendar()
- **Airtable Collection(s):** complianceEvents → v2_Compliance Events
- **Approval Required:** No
- **Dependencies:** None

---

### add_compliance_event
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Creates a new compliance event on the carrier's calendar. Auto-schedules reminder notifications based on the event type's default lead-time rules.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  event_type: string         — drug_test | physical | training | registration | audit | permit_renewal | other (required)
  title: string              — Event title (required)
  due_date: string           — ISO 8601 due date (required)
  driver_id: string          — Associated driver record ID; omit for carrier-level event
  equipment_id: string       — Associated equipment record ID; omit if not applicable
  notes: string              — Optional notes
  reminder_days: number[]    — Days before due date to send reminders (default: [30, 7, 1])
  ```
- **Backend Service:** complianceCalendarService.jsw → addComplianceEvent()
- **Airtable Collection(s):** complianceEvents → v2_Compliance Events
- **Approval Required:** No
- **Dependencies:** emailService.jsw (reminder scheduling)

---

### get_upcoming_deadlines
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns a prioritized list of compliance deadlines approaching within the next N days, sorted by urgency. Flags overdue items in red.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  days_ahead: number         — Look-ahead window in days (default: 30)
  include_overdue: boolean   — Include already-overdue items (default: true)
  ```
- **Backend Service:** complianceCalendarService.jsw → getUpcomingDeadlines()
- **Airtable Collection(s):** complianceEvents → v2_Compliance Events
- **Approval Required:** No
- **Dependencies:** None

---

### set_reminder
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Adds or updates reminder notifications for an existing compliance event. Supports email and SMS channels.
- **Parameters:**
  ```
  event_id: string           — ComplianceEvents record ID (required)
  reminder_days: number[]    — Days before due date to send reminders (required)
  channel: string            — email | sms | both (default: email)
  recipient_ids: string[]    — User IDs to notify; defaults to carrier admin
  ```
- **Backend Service:** complianceCalendarService.jsw → setEventReminder()
- **Airtable Collection(s):** complianceEvents → v2_Compliance Events
- **Approval Required:** No
- **Dependencies:** emailService.jsw

---

### get_overdue_items
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns all compliance items that are past their due date and not yet marked complete. Groups by severity (critical DOT violations vs. administrative).
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  event_type: string         — Filter by event type; omit for all
  ```
- **Backend Service:** complianceCalendarService.jsw → getOverdueItems()
- **Airtable Collection(s):** complianceEvents → v2_Compliance Events
- **Approval Required:** No
- **Dependencies:** None

---

### upload_carrier_document
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Uploads a compliance document to the carrier's document vault. Accepts base64-encoded file content or a Wix Media Manager URL. Extracts and stores expiration date if provided.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  document_type: string      — operating_authority | insurance | ifta | irp | drug_policy | safety_plan | driver_contract | medical_examiner_cert | other (required)
  file_name: string          — Original file name with extension (required)
  file_url: string           — Wix Media Manager URL of the uploaded file (required)
  expiry_date: string        — ISO 8601 expiration date if applicable
  driver_id: string          — Associate with a specific driver; omit for carrier-level doc
  notes: string              — Optional notes
  ```
- **Backend Service:** documentVaultService.jsw → uploadCarrierDocument()
- **Airtable Collection(s):** carrierDocuments → v2_Carrier Documents
- **Approval Required:** No
- **Dependencies:** Wix Media Manager

---

### get_carrier_documents
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the list of documents stored in the carrier's document vault, with expiration status flags and download URLs.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  document_type: string      — Filter by type; omit for all
  driver_id: string          — Filter to driver-specific documents; omit for carrier-level
  include_expired: boolean   — Include expired documents (default: false)
  ```
- **Backend Service:** documentVaultService.jsw → getCarrierDocuments()
- **Airtable Collection(s):** carrierDocuments → v2_Carrier Documents
- **Approval Required:** No
- **Dependencies:** None

---

### get_document_by_type
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the most recent document of a specified type, with validity status. Useful for quick compliance checks (e.g., "is our insurance current?").
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  document_type: string      — Document type to look up (required)
  driver_id: string          — Driver-specific lookup; omit for carrier-level
  ```
- **Backend Service:** documentVaultService.jsw → getDocumentByType()
- **Airtable Collection(s):** carrierDocuments → v2_Carrier Documents
- **Approval Required:** No
- **Dependencies:** None

---

### check_document_validity
- **Role:** carrier
- **Risk Level:** read
- **Description:** Runs a validity check across all required document types for the carrier and returns a compliance status summary with pass/fail/expiring-soon flags per document category.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  expiry_window_days: number — Flag documents expiring within N days as "expiring soon" (default: 30)
  ```
- **Backend Service:** documentVaultService.jsw → checkDocumentValidity()
- **Airtable Collection(s):** carrierDocuments → v2_Carrier Documents
- **Approval Required:** No
- **Dependencies:** None

---

### archive_document
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Marks a document as archived (superseded or obsolete). Archived documents remain in the vault but are excluded from active compliance checks.
- **Parameters:**
  ```
  document_id: string        — CarrierDocuments record ID (required)
  reason: string             — Reason for archiving: superseded | expired | incorrect | other (required)
  ```
- **Backend Service:** documentVaultService.jsw → archiveDocument()
- **Airtable Collection(s):** carrierDocuments → v2_Carrier Documents
- **Approval Required:** No
- **Dependencies:** None

---

### get_dq_file_status
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the Driver Qualification file completeness status for all fleet drivers or a specific driver. Shows which required FMCSA DQ items are present, missing, or expiring.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  driver_id: string          — Scope to single driver; omit for all fleet drivers
  include_complete: boolean  — Include drivers with 100% complete DQ files (default: false)
  ```
- **Backend Service:** dqFileService.jsw → getDQFileStatus()
- **Airtable Collection(s):** qualificationFiles → v2_Qualification Files
- **Approval Required:** No
- **Dependencies:** None

---

### get_missing_dq_items
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the specific missing DQ file items for a driver — e.g., missing MVR, employment verification, road test certificate, or medical examiner certificate.
- **Parameters:**
  ```
  driver_id: string          — FleetDrivers record ID (required)
  ```
- **Backend Service:** dqFileService.jsw → getMissingDQItems()
- **Airtable Collection(s):** qualificationFiles → v2_Qualification Files
- **Approval Required:** No
- **Dependencies:** None

---

### send_dq_reminder
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Sends a notification to a driver reminding them to submit outstanding DQ file items. Logs the reminder in the activity feed.
- **Parameters:**
  ```
  driver_id: string          — FleetDrivers record ID (required)
  channel: string            — email | sms | both (default: email)
  message: string            — Optional custom message body; otherwise uses template
  ```
- **Backend Service:** dqFileService.jsw → sendDQReminder()
- **Airtable Collection(s):** qualificationFiles → v2_Qualification Files
- **Approval Required:** No
- **Dependencies:** emailService.jsw

---

### update_dq_item
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Marks a specific DQ file item as received, verified, or waived. Attaches a document reference if a file was uploaded to the vault.
- **Parameters:**
  ```
  driver_id: string          — FleetDrivers record ID (required)
  item_type: string          — application | mvr | previous_employer | road_test | medical_cert | drug_test | hazmat_cert | other (required)
  status: string             — received | verified | waived | expired (required)
  document_id: string        — Optional CarrierDocuments record ID if a file was attached
  expiry_date: string        — ISO 8601 expiry date if applicable
  notes: string              — Optional notes
  ```
- **Backend Service:** dqFileService.jsw → updateDQItem()
- **Airtable Collection(s):** qualificationFiles → v2_Qualification Files
- **Approval Required:** No
- **Dependencies:** documentVaultService.jsw (optional)

---

### get_dq_compliance_rate
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the carrier's overall DQ file compliance rate — percentage of fleet drivers with complete, current DQ files — and a breakdown by item category.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  ```
- **Backend Service:** dqFileService.jsw → getDQComplianceRate()
- **Airtable Collection(s):** qualificationFiles → v2_Qualification Files
- **Approval Required:** No
- **Dependencies:** None

---

### get_csa_scores
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the carrier's current FMCSA CSA BASIC scores across all seven categories (Unsafe Driving, HOS Compliance, Driver Fitness, Controlled Substances, Vehicle Maintenance, Hazardous Materials, Crash Indicator).
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  ```
- **Backend Service:** csaMonitorService.jsw → getCSAScores()
- **Airtable Collection(s):** csaScoreHistory → v2_CSA Score History
- **Approval Required:** No
- **Dependencies:** externalFmcsaApi.jsw, fmcsaService.jsw

---

### get_csa_trend
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns time-series CSA BASIC score data for trend analysis. Shows whether scores are improving or deteriorating across each BASIC category over the specified number of months.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  basic_category: string     — unsafe_driving | hos | driver_fitness | controlled_substances | vehicle_maintenance | hazmat | crash_indicator | all (default: all)
  months: number             — Number of months of history (default: 12, max: 36)
  ```
- **Backend Service:** csaMonitorService.jsw → getCSATrend()
- **Airtable Collection(s):** csaScoreHistory → v2_CSA Score History
- **Approval Required:** No
- **Dependencies:** None

---

### get_csa_alerts
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns active CSA alerts where the carrier's BASIC scores have exceeded the intervention threshold. Includes recommended remediation actions for each alert.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  severity: string           — warning | intervention | all (default: all)
  ```
- **Backend Service:** csaMonitorService.jsw → getCSAAlerts()
- **Airtable Collection(s):** complianceAlerts → v2_Compliance Alerts; csaScoreHistory → v2_CSA Score History
- **Approval Required:** No
- **Dependencies:** None

---

### get_basic_violations
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the individual violations contributing to the carrier's CSA BASIC scores, filterable by category and date range. Helps identify root cause drivers of elevated scores.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  basic_category: string     — Filter by BASIC category; omit for all
  start_date: string         — ISO 8601 start date (default: 24 months ago)
  end_date: string           — ISO 8601 end date (default: today)
  ```
- **Backend Service:** csaMonitorService.jsw → getBASICViolations()
- **Airtable Collection(s):** csaScoreHistory → v2_CSA Score History
- **Approval Required:** No
- **Dependencies:** externalFmcsaApi.jsw, externalCsaApi.jsw

---

### compare_csa_to_peers
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns how the carrier's CSA BASIC scores compare to the national percentile for carriers of similar fleet size. Highlights categories where the carrier is outperforming or underperforming peers.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  fleet_size_band: string    — small | medium | large | auto-detect (default: auto-detect)
  ```
- **Backend Service:** csaMonitorService.jsw → compareCSAToPeers()
- **Airtable Collection(s):** csaScoreHistory → v2_CSA Score History; industryBenchmarks → v2_Industry Benchmarks
- **Approval Required:** No
- **Dependencies:** None

---

### report_incident
- **Role:** carrier
- **Risk Level:** execute_high
- **Description:** Creates a new DOT-compliant incident or accident report. Captures all required fields for FMCSA recordkeeping. Triggers notification to carrier admin and safety manager.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  incident_type: string      — accident | injury | fatality | property_damage | near_miss | citation (required)
  incident_date: string      — ISO 8601 date and time (required)
  driver_id: string          — FleetDrivers record ID of involved driver (required)
  equipment_id: string       — EquipmentAssets record ID of involved vehicle
  location_description: string — Description of location e.g. "I-40 EB, Mile 234, TN" (required)
  description: string        — Factual description of what occurred (required)
  injuries: boolean          — Whether injuries occurred (required)
  fatalities: boolean        — Whether fatalities occurred (required)
  property_damage_usd: number — Estimated property damage in USD
  police_report_number: string — If law enforcement responded
  dot_reportable: boolean    — Whether incident meets DOT 49 CFR 390.15 threshold (required)
  ```
- **Backend Service:** incidentService.jsw → reportIncident()
- **Airtable Collection(s):** incidentReports → v2_Incident Reports
- **Approval Required:** Yes
- **Dependencies:** emailService.jsw (admin notification)

---

### get_incidents
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the list of incident reports for the carrier, filterable by type, date range, driver, and DOT-reportable status.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  incident_type: string      — Filter by type; omit for all
  start_date: string         — ISO 8601 start date (default: 12 months ago)
  end_date: string           — ISO 8601 end date (default: today)
  dot_reportable_only: boolean — Only DOT-reportable incidents (default: false)
  driver_id: string          — Filter to specific driver
  ```
- **Backend Service:** incidentService.jsw → getIncidents()
- **Airtable Collection(s):** incidentReports → v2_Incident Reports
- **Approval Required:** No
- **Dependencies:** None

---

### get_incident_detail
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the full detail for a specific incident report including all fields, attachments, status timeline, and associated corrective actions.
- **Parameters:**
  ```
  incident_id: string        — IncidentReports record ID (required)
  ```
- **Backend Service:** incidentService.jsw → getIncidentDetail()
- **Airtable Collection(s):** incidentReports → v2_Incident Reports
- **Approval Required:** No
- **Dependencies:** None

---

### update_incident_status
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Updates the status and resolution notes for an incident report as the investigation progresses.
- **Parameters:**
  ```
  incident_id: string        — IncidentReports record ID (required)
  status: string             — open | under_investigation | corrective_action | closed (required)
  notes: string              — Status update notes
  corrective_action: string  — Corrective action taken or planned
  ```
- **Backend Service:** incidentService.jsw → updateIncidentStatus()
- **Airtable Collection(s):** incidentReports → v2_Incident Reports
- **Approval Required:** No
- **Dependencies:** None

---

### get_incident_analytics
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns incident analytics for the carrier — total counts by type, trend over time, cost estimates, root cause categories, and driver recurrence rates.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  start_date: string         — ISO 8601 start date (default: 12 months ago)
  end_date: string           — ISO 8601 end date (default: today)
  ```
- **Backend Service:** incidentService.jsw → getIncidentAnalytics()
- **Airtable Collection(s):** incidentReports → v2_Incident Reports
- **Approval Required:** No
- **Dependencies:** None

---

### Track: carrier_communication_20260120

---

### create_announcement
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Creates and publishes a carrier-wide or targeted announcement to drivers. Supports plain text or rich HTML content. Optional scheduling for future delivery.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  title: string              — Announcement title (required)
  body: string               — Announcement body content (required)
  audience: string           — all_drivers | specific_terminals | specific_drivers (default: all_drivers)
  target_ids: string[]       — Driver or terminal IDs if audience is targeted
  scheduled_at: string       — ISO 8601 datetime to publish; omit to publish immediately
  priority: string           — normal | urgent (default: normal)
  channels: string[]         — in_app | email | sms (default: [in_app])
  ```
- **Backend Service:** carrierAnnouncementsService.jsw → createAnnouncement()
- **Airtable Collection(s):** carrierAnnouncements → v2_Carrier Announcements
- **Approval Required:** No
- **Dependencies:** emailService.jsw

---

### get_announcements
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the announcement history for the carrier, with read receipt counts and delivery status per channel.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  status: string             — draft | scheduled | published | all (default: published)
  page: number               — 1-based page (default: 1)
  page_size: number          — Max 50 (default: 20)
  ```
- **Backend Service:** carrierAnnouncementsService.jsw → getAnnouncements()
- **Airtable Collection(s):** carrierAnnouncements → v2_Carrier Announcements
- **Approval Required:** No
- **Dependencies:** None

---

### update_announcement
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Updates the title, body, or schedule of an announcement that is still in draft or scheduled status. Published announcements cannot be modified.
- **Parameters:**
  ```
  announcement_id: string    — CarrierAnnouncements record ID (required)
  title: string              — Updated title
  body: string               — Updated body
  scheduled_at: string       — Updated publish datetime ISO 8601
  priority: string           — Updated priority: normal | urgent
  ```
- **Backend Service:** carrierAnnouncementsService.jsw → updateAnnouncement()
- **Airtable Collection(s):** carrierAnnouncements → v2_Carrier Announcements
- **Approval Required:** No
- **Dependencies:** None

---

### delete_announcement
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Deletes a draft or scheduled announcement. Published announcements are archived rather than deleted.
- **Parameters:**
  ```
  announcement_id: string    — CarrierAnnouncements record ID (required)
  ```
- **Backend Service:** carrierAnnouncementsService.jsw → deleteAnnouncement()
- **Airtable Collection(s):** carrierAnnouncements → v2_Carrier Announcements
- **Approval Required:** No
- **Dependencies:** None

---

### get_announcement_reach
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns delivery and read metrics for a published announcement — how many drivers received it, how many opened it, and per-channel breakdown.
- **Parameters:**
  ```
  announcement_id: string    — CarrierAnnouncements record ID (required)
  ```
- **Backend Service:** carrierAnnouncementsService.jsw → getAnnouncementReach()
- **Airtable Collection(s):** carrierAnnouncements → v2_Carrier Announcements
- **Approval Required:** No
- **Dependencies:** None

---

### create_policy
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Creates a new carrier policy document and sends it to drivers for acknowledgment. Supports versioning — a new version supersedes the previous one.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  policy_name: string        — Human-readable policy name (required)
  policy_type: string        — safety | substance_abuse | harassment | vehicle_use | compensation | conduct | other (required)
  body: string               — Full policy text (required)
  requires_acknowledgment: boolean — Whether drivers must acknowledge (default: true)
  acknowledgment_deadline: string  — ISO 8601 date for acknowledgment deadline
  version: string            — Version label e.g. v1.0 (default: v1.0)
  ```
- **Backend Service:** carrierPolicyService.jsw → createPolicy()
- **Airtable Collection(s):** carrierPolicies → v2_Carrier Policies
- **Approval Required:** No
- **Dependencies:** emailService.jsw

---

### get_policies
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the list of carrier policies with current version, acknowledgment completion rate, and status.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  policy_type: string        — Filter by type; omit for all
  active_only: boolean       — Only return current active versions (default: true)
  ```
- **Backend Service:** carrierPolicyService.jsw → getPolicies()
- **Airtable Collection(s):** carrierPolicies → v2_Carrier Policies
- **Approval Required:** No
- **Dependencies:** None

---

### update_policy
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Creates a new version of an existing policy. The prior version is archived and drivers are notified to re-acknowledge the updated policy.
- **Parameters:**
  ```
  policy_id: string          — CarrierPolicies record ID (required)
  body: string               — New policy text (required)
  version: string            — New version label e.g. v1.1 (required)
  change_summary: string     — Brief summary of what changed
  acknowledgment_deadline: string — ISO 8601 date
  ```
- **Backend Service:** carrierPolicyService.jsw → updatePolicy()
- **Airtable Collection(s):** carrierPolicies → v2_Carrier Policies
- **Approval Required:** No
- **Dependencies:** emailService.jsw

---

### acknowledge_policy
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Records a driver's acknowledgment of a carrier policy. Called by the driver-facing portal; can also be triggered by a carrier admin confirming manual acknowledgment (e.g., wet signature on paper).
- **Parameters:**
  ```
  policy_id: string          — CarrierPolicies record ID (required)
  driver_id: string          — FleetDrivers record ID (required)
  acknowledgment_method: string — in_app | paper | email_reply (default: in_app)
  acknowledged_at: string    — ISO 8601 datetime; defaults to now
  ```
- **Backend Service:** carrierPolicyService.jsw → acknowledgePolicy()
- **Airtable Collection(s):** policyAcknowledgments → v2_Policy Acknowledgments
- **Approval Required:** No
- **Dependencies:** None

---

### get_policy_acknowledgments
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the acknowledgment status for a policy — which drivers have acknowledged, which are pending, and which are past deadline.
- **Parameters:**
  ```
  policy_id: string          — CarrierPolicies record ID (required)
  status: string             — acknowledged | pending | overdue | all (default: all)
  ```
- **Backend Service:** carrierPolicyService.jsw → getPolicyAcknowledgments()
- **Airtable Collection(s):** policyAcknowledgments → v2_Policy Acknowledgments
- **Approval Required:** No
- **Dependencies:** None

---

### create_recognition
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Creates a driver recognition award (e.g., Driver of the Month, Safe Miles milestone, Top Performer). Posts to the recognition feed and optionally notifies the driver.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  driver_id: string          — FleetDrivers record ID of recipient (required)
  recognition_type: string   — driver_of_month | safety_milestone | anniversary | top_performer | custom (required)
  title: string              — Award title (required)
  message: string            — Personal recognition message (required)
  notify_driver: boolean     — Send notification to driver (default: true)
  share_publicly: boolean    — Post to carrier-wide recognition feed (default: true)
  ```
- **Backend Service:** carrierAnnouncementsService.jsw → createRecognition()
- **Airtable Collection(s):** driverRecognitions → v2_Driver Recognitions
- **Approval Required:** No
- **Dependencies:** emailService.jsw

---

### get_recognitions
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the recognition feed for the carrier, showing recent awards, milestone achievements, and nominations.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  driver_id: string          — Filter to specific driver; omit for all
  recognition_type: string   — Filter by type; omit for all
  limit: number              — Max records to return (default: 20)
  ```
- **Backend Service:** carrierAnnouncementsService.jsw → getRecognitions()
- **Airtable Collection(s):** driverRecognitions → v2_Driver Recognitions
- **Approval Required:** No
- **Dependencies:** None

---

### nominate_driver
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Submits a driver nomination for a recognition award. Nominations can be reviewed by a carrier admin before being awarded.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  driver_id: string          — Nominated driver FleetDrivers record ID (required)
  award_type: string         — Award category (required)
  reason: string             — Nomination rationale (required)
  nominated_by: string       — Nominator's user ID (required)
  ```
- **Backend Service:** carrierAnnouncementsService.jsw → nominateDriver()
- **Airtable Collection(s):** driverRecognitions → v2_Driver Recognitions
- **Approval Required:** No
- **Dependencies:** None

---

### get_recognition_leaderboard
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the recognition leaderboard ranking drivers by total awards and points earned in the current period.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  period: string             — current_month | current_quarter | all_time (default: current_month)
  limit: number              — Top N drivers to return (default: 10)
  ```
- **Backend Service:** carrierAnnouncementsService.jsw → getRecognitionLeaderboard()
- **Airtable Collection(s):** driverRecognitions → v2_Driver Recognitions
- **Approval Required:** No
- **Dependencies:** None

---

### get_recognition_history
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the full recognition history for a specific driver — all awards received, dates, and award types.
- **Parameters:**
  ```
  driver_id: string          — FleetDrivers record ID (required)
  ```
- **Backend Service:** carrierAnnouncementsService.jsw → getRecognitionHistory()
- **Airtable Collection(s):** driverRecognitions → v2_Driver Recognitions
- **Approval Required:** No
- **Dependencies:** None

---

### create_feedback_survey
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Creates and distributes a driver feedback survey. Supports multiple question types (rating, text, multiple choice). Sends via in-app notification and/or email.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  title: string              — Survey title (required)
  questions: object[]        — Array of { question: string, type: rating|text|multiple_choice, options?: string[] } (required)
  audience: string           — all_drivers | specific_terminals | specific_drivers (default: all_drivers)
  target_ids: string[]       — Driver or terminal IDs if targeted
  close_date: string         — ISO 8601 date survey closes
  anonymous: boolean         — Whether responses are anonymous (default: true)
  ```
- **Backend Service:** feedbackLoopService.jsw → createFeedbackSurvey()
- **Airtable Collection(s):** feedbackSurveys → v2_Feedback Surveys; surveyResponses → v2_Survey Responses
- **Approval Required:** No
- **Dependencies:** emailService.jsw

---

### get_survey_responses
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns individual survey response records for a specific survey. If anonymous, driver identifiers are redacted.
- **Parameters:**
  ```
  survey_id: string          — FeedbackSurveys record ID (required)
  page: number               — 1-based page (default: 1)
  page_size: number          — Max 50 (default: 25)
  ```
- **Backend Service:** feedbackLoopService.jsw → getSurveyResponses()
- **Airtable Collection(s):** surveyResponses → v2_Survey Responses
- **Approval Required:** No
- **Dependencies:** None

---

### get_feedback_summary
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns aggregated survey results — average ratings per question, top text themes, completion rate, and response count.
- **Parameters:**
  ```
  survey_id: string          — FeedbackSurveys record ID (required)
  ```
- **Backend Service:** feedbackLoopService.jsw → getFeedbackSummary()
- **Airtable Collection(s):** surveyResponses → v2_Survey Responses; feedbackSurveys → v2_Feedback Surveys
- **Approval Required:** No
- **Dependencies:** None

---

### get_sentiment_analysis
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns AI-generated sentiment analysis of open-text survey responses — overall sentiment score, common themes, and verbatim quote highlights.
- **Parameters:**
  ```
  survey_id: string          — FeedbackSurveys record ID (required)
  ```
- **Backend Service:** feedbackLoopService.jsw → getSentimentAnalysis()
- **Airtable Collection(s):** surveyResponses → v2_Survey Responses
- **Approval Required:** No
- **Dependencies:** aiRouterService.jsw

---

### close_survey
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Closes a survey to new responses and optionally sends a "survey closed" notification to participants.
- **Parameters:**
  ```
  survey_id: string          — FeedbackSurveys record ID (required)
  notify_participants: boolean — Send close notification (default: false)
  ```
- **Backend Service:** feedbackLoopService.jsw → closeSurvey()
- **Airtable Collection(s):** feedbackSurveys → v2_Feedback Surveys
- **Approval Required:** No
- **Dependencies:** None

---

### Track: carrier_journey_activation_20260131

---

### get_onboarding_status
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the carrier's onboarding checklist completion status — which steps are complete, in progress, or pending — and an overall percentage complete.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  ```
- **Backend Service:** carrierAdminService.jsw → getOnboardingStatus()
- **Airtable Collection(s):** carrierOnboarding → v2_Carrier Onboarding
- **Approval Required:** No
- **Dependencies:** None

---

### start_onboarding_step
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Marks an onboarding step as in-progress and records the start timestamp. Triggers any resource delivery associated with that step (e.g., sends a guide email).
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  step_key: string           — Onboarding step identifier e.g. profile_setup | upload_docs | add_drivers | set_preferences | activate_subscription (required)
  ```
- **Backend Service:** carrierAdminService.jsw → startOnboardingStep()
- **Airtable Collection(s):** carrierOnboarding → v2_Carrier Onboarding
- **Approval Required:** No
- **Dependencies:** emailService.jsw

---

### complete_onboarding_step
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Marks an onboarding step as complete. Checks whether all steps are complete and if so, triggers the carrier activation event and welcome notification.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  step_key: string           — Onboarding step identifier (required)
  completion_data: object    — Optional key-value data captured during the step
  ```
- **Backend Service:** carrierAdminService.jsw → completeOnboardingStep()
- **Airtable Collection(s):** carrierOnboarding → v2_Carrier Onboarding
- **Approval Required:** No
- **Dependencies:** emailService.jsw

---

### skip_onboarding_step
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Marks an onboarding step as skipped. The step remains visible in the checklist but does not block progression.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  step_key: string           — Onboarding step identifier (required)
  skip_reason: string        — Reason for skipping (optional)
  ```
- **Backend Service:** carrierAdminService.jsw → skipOnboardingStep()
- **Airtable Collection(s):** carrierOnboarding → v2_Carrier Onboarding
- **Approval Required:** No
- **Dependencies:** None

---

### get_onboarding_checklist
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the full onboarding checklist with step descriptions, status, and any required actions or links for each step.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  ```
- **Backend Service:** carrierAdminService.jsw → getOnboardingChecklist()
- **Airtable Collection(s):** carrierOnboarding → v2_Carrier Onboarding
- **Approval Required:** No
- **Dependencies:** None

---

### update_carrier_profile
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Updates the carrier's public and internal profile fields — company name, headquarters address, fleet size, primary contact, and business description.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  company_name: string       — Legal company name
  dba_name: string           — Doing-business-as name
  hq_address: string         — Headquarters street address
  hq_city: string            — City
  hq_state: string           — 2-letter state code
  hq_zip: string             — ZIP code
  fleet_size: number         — Current total fleet size
  primary_contact_name: string — Primary contact full name
  primary_contact_email: string — Primary contact email
  primary_contact_phone: string — Primary contact phone
  website_url: string        — Company website URL
  ```
- **Backend Service:** carrierAdminService.jsw → updateCarrierProfile()
- **Airtable Collection(s):** carriers → v2_Carriers
- **Approval Required:** No
- **Dependencies:** None

---

### upload_carrier_logo
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Stores the carrier's logo URL in their profile. The file should already be uploaded to Wix Media Manager before calling this tool.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  logo_url: string           — Wix Media Manager URL of the uploaded logo (required)
  ```
- **Backend Service:** carrierAdminService.jsw → uploadCarrierLogo()
- **Airtable Collection(s):** carriers → v2_Carriers
- **Approval Required:** No
- **Dependencies:** Wix Media Manager

---

### set_carrier_branding
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Sets carrier branding preferences — primary color, accent color, and tagline — used in driver-facing carrier profile and job listing pages.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  primary_color: string      — Hex color code e.g. #1A2B3C
  accent_color: string       — Hex color code
  tagline: string            — Short carrier tagline (max 120 characters)
  ```
- **Backend Service:** carrierAdminService.jsw → setCarrierBranding()
- **Airtable Collection(s):** carriers → v2_Carriers
- **Approval Required:** No
- **Dependencies:** None

---

### get_carrier_public_profile
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the carrier's public-facing profile as it appears to drivers on the VelocityMatch platform — name, logo, description, benefits, and active job listings.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  ```
- **Backend Service:** carrierAdminService.jsw → getCarrierPublicProfile()
- **Airtable Collection(s):** carriers → v2_Carriers; driverJobs → v2_Driver Jobs
- **Approval Required:** No
- **Dependencies:** None

---

### update_about_section
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Updates the "About Us" section displayed on the carrier's public profile, including company story, culture highlights, and driver benefits.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  about_text: string         — Company description (max 2000 characters, required)
  driver_benefits: string[]  — List of benefit bullet points
  culture_tags: string[]     — Culture keywords e.g. family_friendly | home_weekly | top_pay
  ```
- **Backend Service:** carrierAdminService.jsw → updateAboutSection()
- **Airtable Collection(s):** carriers → v2_Carriers
- **Approval Required:** No
- **Dependencies:** None

---

### get_carrier_menu
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the carrier portal navigation menu structure with enabled/disabled feature flags based on the carrier's subscription tier.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  ```
- **Backend Service:** carrierAdminService.jsw → getCarrierMenu()
- **Airtable Collection(s):** carriers → v2_Carriers; subscriptions → v2_Subscriptions
- **Approval Required:** No
- **Dependencies:** None

---

### set_default_view
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Sets the carrier user's preferred default landing view within the portal (e.g., fleet dashboard, compliance calendar, driver search).
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  user_id: string            — Wix user ID (required)
  default_view: string       — fleet_dashboard | compliance | communication | conversion | driver_search (required)
  ```
- **Backend Service:** carrierAdminService.jsw → setDefaultView()
- **Airtable Collection(s):** carrierUserPreferences → v2_Carrier User Preferences
- **Approval Required:** No
- **Dependencies:** None

---

### get_quick_actions
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the carrier user's configured quick action shortcuts for the portal header toolbar.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  user_id: string            — Wix user ID (required)
  ```
- **Backend Service:** carrierAdminService.jsw → getQuickActions()
- **Airtable Collection(s):** carrierUserPreferences → v2_Carrier User Preferences
- **Approval Required:** No
- **Dependencies:** None

---

### customize_dashboard
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Saves the carrier's dashboard widget layout preferences — which widgets are visible and their display order.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  user_id: string            — Wix user ID (required)
  widget_config: object[]    — Array of { widget_id: string, visible: boolean, order: number }
  ```
- **Backend Service:** carrierAdminService.jsw → customizeDashboard()
- **Airtable Collection(s):** carrierUserPreferences → v2_Carrier User Preferences
- **Approval Required:** No
- **Dependencies:** None

---

### get_feature_tour
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the feature tour state for the carrier user — which tours have been completed, which are pending, and which should auto-trigger on next page visit.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  user_id: string            — Wix user ID (required)
  ```
- **Backend Service:** carrierAdminService.jsw → getFeatureTour()
- **Airtable Collection(s):** carrierUserPreferences → v2_Carrier User Preferences
- **Approval Required:** No
- **Dependencies:** featureAdoptionService.jsw

---

### Track: carrier_conversion_20260103

---

### create_subscription_checkout
- **Role:** carrier
- **Risk Level:** execute_high
- **Description:** Creates a Stripe Checkout session for a carrier to subscribe to a VelocityMatch plan. Returns a redirect URL to the Stripe-hosted payment page.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  plan_id: string            — Pricing plan ID (required)
  success_url: string        — Redirect URL on successful payment (required)
  cancel_url: string         — Redirect URL if user cancels (required)
  coupon_code: string        — Optional promo/coupon code
  ```
- **Backend Service:** adminBillingService.jsw → createSubscriptionCheckout()
- **Airtable Collection(s):** subscriptions → v2_Subscriptions
- **Approval Required:** Yes
- **Dependencies:** Stripe API

---

### get_subscription_status
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the carrier's current subscription status — plan name, tier, billing period, next renewal date, and payment method on file.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  ```
- **Backend Service:** adminBillingService.jsw → getSubscriptionStatus()
- **Airtable Collection(s):** subscriptions → v2_Subscriptions
- **Approval Required:** No
- **Dependencies:** Stripe API

---

### update_subscription
- **Role:** carrier
- **Risk Level:** execute_high
- **Description:** Upgrades or downgrades the carrier's subscription plan. Calculates and applies proration for mid-cycle changes.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  new_plan_id: string        — Target plan ID (required)
  effective: string          — immediately | next_cycle (default: next_cycle)
  ```
- **Backend Service:** adminBillingService.jsw → updateSubscription()
- **Airtable Collection(s):** subscriptions → v2_Subscriptions
- **Approval Required:** Yes
- **Dependencies:** Stripe API

---

### cancel_subscription
- **Role:** carrier
- **Risk Level:** execute_high
- **Description:** Cancels the carrier's subscription at the end of the current billing period. Triggers a save/win-back email sequence.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  cancellation_reason: string — price | not_hiring | missing_features | switching | other (required)
  feedback: string           — Optional freeform feedback
  ```
- **Backend Service:** adminBillingService.jsw → cancelSubscription()
- **Airtable Collection(s):** subscriptions → v2_Subscriptions
- **Approval Required:** Yes
- **Dependencies:** Stripe API; emailService.jsw

---

### get_billing_history
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the carrier's billing history — invoices, amounts, dates, and payment status — with links to downloadable PDF invoices.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  limit: number              — Number of invoices to return (default: 12)
  ```
- **Backend Service:** adminBillingService.jsw → getBillingHistory()
- **Airtable Collection(s):** subscriptions → v2_Subscriptions
- **Approval Required:** No
- **Dependencies:** Stripe API

---

### create_deposit_session
- **Role:** carrier
- **Risk Level:** execute_high
- **Description:** Creates a Stripe payment session for a carrier to place a recruitment deposit. Deposits are held and applied against successful placements.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  deposit_amount_usd: number — Deposit amount in USD (required)
  success_url: string        — Post-payment redirect URL (required)
  cancel_url: string         — Cancellation redirect URL (required)
  ```
- **Backend Service:** adminBillingService.jsw → createDepositSession()
- **Airtable Collection(s):** carrierDeposits → v2_Carrier Deposits
- **Approval Required:** Yes
- **Dependencies:** Stripe API

---

### verify_deposit
- **Role:** carrier
- **Risk Level:** read
- **Description:** Verifies whether a deposit payment was successfully processed by Stripe and returns the current deposit balance available for the carrier.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  session_id: string         — Stripe checkout session ID to verify (required)
  ```
- **Backend Service:** adminBillingService.jsw → verifyDeposit()
- **Airtable Collection(s):** carrierDeposits → v2_Carrier Deposits
- **Approval Required:** No
- **Dependencies:** Stripe API

---

### get_deposit_status
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the carrier's current deposit balance, total deposited, total applied to placements, and refund eligibility.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  ```
- **Backend Service:** adminBillingService.jsw → getDepositStatus()
- **Airtable Collection(s):** carrierDeposits → v2_Carrier Deposits
- **Approval Required:** No
- **Dependencies:** None

---

### refund_deposit
- **Role:** carrier
- **Risk Level:** execute_high
- **Description:** Initiates a deposit refund for an eligible carrier. Refunds are processed back to the original payment method. Requires admin approval.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  refund_amount_usd: number  — Amount to refund; must not exceed available balance (required)
  reason: string             — Reason for refund (required)
  ```
- **Backend Service:** adminBillingService.jsw → refundDeposit()
- **Airtable Collection(s):** carrierDeposits → v2_Carrier Deposits
- **Approval Required:** Yes
- **Dependencies:** Stripe API

---

### get_pricing_plans
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns all available VelocityMatch subscription plans with pricing, feature lists, and billing period options.
- **Parameters:**
  ```
  include_inactive: boolean  — Include sunset or inactive plans (default: false)
  ```
- **Backend Service:** adminBillingService.jsw → getPricingPlans()
- **Airtable Collection(s):** pricingPlans → v2_Pricing Plans
- **Approval Required:** No
- **Dependencies:** None

---

### compare_plans
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns a side-by-side feature comparison of two or more subscription plans.
- **Parameters:**
  ```
  plan_ids: string[]         — Array of plan IDs to compare (min 2, max 4, required)
  ```
- **Backend Service:** adminBillingService.jsw → comparePlans()
- **Airtable Collection(s):** pricingPlans → v2_Pricing Plans
- **Approval Required:** No
- **Dependencies:** None

---

### get_plan_features
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the complete feature list for a specific plan, including feature limits, add-on availability, and any plan-specific restrictions.
- **Parameters:**
  ```
  plan_id: string            — Plan ID (required)
  ```
- **Backend Service:** adminBillingService.jsw → getPlanFeatures()
- **Airtable Collection(s):** pricingPlans → v2_Pricing Plans
- **Approval Required:** No
- **Dependencies:** None

---

### get_upgrade_options
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the available upgrade paths for the carrier's current plan, with pricing differences and highlighted feature unlocks.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  ```
- **Backend Service:** adminBillingService.jsw → getUpgradeOptions()
- **Airtable Collection(s):** subscriptions → v2_Subscriptions; pricingPlans → v2_Pricing Plans
- **Approval Required:** No
- **Dependencies:** None

---

### calculate_proration
- **Role:** carrier
- **Risk Level:** read
- **Description:** Calculates the prorated charge or credit for a mid-cycle plan change. Returns the net amount due or credited before committing the change.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  new_plan_id: string        — Target plan ID (required)
  ```
- **Backend Service:** adminBillingService.jsw → calculateProration()
- **Airtable Collection(s):** subscriptions → v2_Subscriptions
- **Approval Required:** No
- **Dependencies:** Stripe API

---

### Track: carrier_utility_expansion_20260120

---

### save_search_preset
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Saves the current driver search filter configuration as a named preset for quick recall.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  user_id: string            — Wix user ID (required)
  preset_name: string        — Descriptive name for this preset (required)
  filter_config: object      — Complete filter state object to save (required)
  is_shared: boolean         — Share with other carrier admin users (default: false)
  ```
- **Backend Service:** carrierPreferences.jsw → saveSearchPreset()
- **Airtable Collection(s):** searchPresets → v2_Search Presets
- **Approval Required:** No
- **Dependencies:** None

---

### get_presets
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the list of saved search presets for the carrier, including both personal and shared presets.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  user_id: string            — Wix user ID (required)
  include_shared: boolean    — Include shared presets from other users (default: true)
  ```
- **Backend Service:** carrierPreferences.jsw → getPresets()
- **Airtable Collection(s):** searchPresets → v2_Search Presets
- **Approval Required:** No
- **Dependencies:** None

---

### apply_preset
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the filter configuration for a saved preset so the UI can apply it to the active search.
- **Parameters:**
  ```
  preset_id: string          — SearchPresets record ID (required)
  ```
- **Backend Service:** carrierPreferences.jsw → applyPreset()
- **Airtable Collection(s):** searchPresets → v2_Search Presets
- **Approval Required:** No
- **Dependencies:** None

---

### delete_preset
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Deletes a saved search preset. Shared presets can only be deleted by their creator or a carrier admin.
- **Parameters:**
  ```
  preset_id: string          — SearchPresets record ID (required)
  user_id: string            — Requesting user's Wix ID for ownership check (required)
  ```
- **Backend Service:** carrierPreferences.jsw → deletePreset()
- **Airtable Collection(s):** searchPresets → v2_Search Presets
- **Approval Required:** No
- **Dependencies:** None

---

### share_preset
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Toggles a search preset between personal and shared visibility for the carrier's team.
- **Parameters:**
  ```
  preset_id: string          — SearchPresets record ID (required)
  shared: boolean            — True to share, false to make personal (required)
  ```
- **Backend Service:** carrierPreferences.jsw → sharePreset()
- **Airtable Collection(s):** searchPresets → v2_Search Presets
- **Approval Required:** No
- **Dependencies:** None

---

### get_application_statuses
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns all driver application records for the carrier with current status, driver name, application date, and recruiter notes.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  status: string             — applied | reviewing | interview | offer | hired | rejected | withdrawn | all (default: all)
  date_range_days: number    — Rolling window in days (default: 30)
  page: number               — 1-based page (default: 1)
  page_size: number          — Max 100 (default: 25)
  ```
- **Backend Service:** carrierStatusService.jsw → getApplicationStatuses()
- **Airtable Collection(s):** driverCarrierInterests → v2_Driver Carrier Interests
- **Approval Required:** No
- **Dependencies:** applicationService.jsw

---

### update_application_status
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Updates the status of a driver application. Triggers an automated notification to the driver when status advances to interview, offer, or hired.
- **Parameters:**
  ```
  application_id: string     — DriverCarrierInterests record ID (required)
  new_status: string         — reviewing | interview | offer | hired | rejected (required)
  notes: string              — Internal recruiter notes
  next_step: string          — Description of next action
  next_step_date: string     — ISO 8601 date of next action
  notify_driver: boolean     — Send status notification to driver (default: true)
  ```
- **Backend Service:** carrierStatusService.jsw → updateApplicationStatus()
- **Airtable Collection(s):** driverCarrierInterests → v2_Driver Carrier Interests
- **Approval Required:** No
- **Dependencies:** emailService.jsw

---

### get_status_history
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the status change history for a specific driver application, including timestamps, actors, and notes at each stage.
- **Parameters:**
  ```
  application_id: string     — DriverCarrierInterests record ID (required)
  ```
- **Backend Service:** carrierStatusService.jsw → getStatusHistory()
- **Airtable Collection(s):** applicationStatusHistory → v2_Application Status History
- **Approval Required:** No
- **Dependencies:** None

---

### get_status_analytics
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns application funnel analytics for the carrier — stage-to-stage conversion rates, average time in each stage, drop-off points, and hire rate.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  date_range_days: number    — Rolling window in days (default: 90)
  ```
- **Backend Service:** carrierStatusService.jsw → getStatusAnalytics()
- **Airtable Collection(s):** driverCarrierInterests → v2_Driver Carrier Interests
- **Approval Required:** No
- **Dependencies:** None

---

### bulk_update_status
- **Role:** carrier
- **Risk Level:** execute_high
- **Description:** Updates the status of multiple applications in a single operation. Used for batch advancing or rejecting a set of candidates.
- **Parameters:**
  ```
  application_ids: string[]  — Array of DriverCarrierInterests record IDs (required, max 50)
  new_status: string         — New status to apply to all (required)
  notes: string              — Notes applied to all updated records
  notify_drivers: boolean    — Send status notifications to affected drivers (default: true)
  ```
- **Backend Service:** carrierStatusService.jsw → bulkUpdateStatus()
- **Airtable Collection(s):** driverCarrierInterests → v2_Driver Carrier Interests
- **Approval Required:** Yes
- **Dependencies:** emailService.jsw; chunkArray utility

---

### preview_match_results
- **Role:** carrier
- **Risk Level:** suggest
- **Description:** Returns a preview of driver match results using the carrier's current preference configuration without committing to any searches or charges. Useful for testing preference changes before saving.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  preference_override: object — Temporary preference values to test (optional)
  limit: number              — Number of preview results to return (default: 10)
  ```
- **Backend Service:** carrierMatching.jsw → previewMatchResults()
- **Airtable Collection(s):** carrierPreferences → v2_Carrier Preferences; driverProfiles → v2_Driver Profiles
- **Approval Required:** No
- **Dependencies:** driverMatching.jsw

---

### get_match_criteria
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns the carrier's current saved match criteria and preferences — CDL class, endorsements, experience minimums, preferred lanes, and equipment types.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  ```
- **Backend Service:** carrierPreferences.jsw → getMatchCriteria()
- **Airtable Collection(s):** carrierPreferences → v2_Carrier Preferences
- **Approval Required:** No
- **Dependencies:** None

---

### update_match_preferences
- **Role:** carrier
- **Risk Level:** execute_low
- **Description:** Saves updated driver match preferences for the carrier. Changes take effect on the next matching cycle.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  cdl_classes: string[]      — Required CDL classes: A | B | C
  endorsements: string[]     — Required endorsements: H | N | T | X | P
  min_experience_years: number — Minimum years CDL experience
  equipment_types: string[]  — Equipment types: dry_van | reefer | flatbed | tanker | bulk | other
  preferred_states: string[] — Preferred driver home states (2-letter codes)
  home_time: string          — home_daily | home_weekly | home_biweekly | otr
  pay_min_cpm: number        — Minimum pay in cents-per-mile
  max_violations: number     — Maximum moving violations in 3 years
  ```
- **Backend Service:** carrierPreferences.jsw → updateMatchPreferences()
- **Airtable Collection(s):** carrierPreferences → v2_Carrier Preferences
- **Approval Required:** No
- **Dependencies:** None

---

### get_match_quality_score
- **Role:** carrier
- **Risk Level:** read
- **Description:** Returns a quality score for the carrier's current match configuration — how well-defined it is, estimated match pool size, and recommendations for improving specificity or broadening reach.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  ```
- **Backend Service:** carrierMatching.jsw → getMatchQualityScore()
- **Airtable Collection(s):** carrierPreferences → v2_Carrier Preferences
- **Approval Required:** No
- **Dependencies:** driverMatching.jsw

---

### get_match_suggestions
- **Role:** carrier
- **Risk Level:** suggest
- **Description:** Returns AI-generated suggestions for adjusting match preferences to increase match pool size or improve match quality, based on current driver supply signals.
- **Parameters:**
  ```
  carrier_dot: number        — Carrier DOT number (required)
  goal: string               — increase_volume | increase_quality | balance (default: balance)
  ```
- **Backend Service:** carrierMatching.jsw → getMatchSuggestions()
- **Airtable Collection(s):** carrierPreferences → v2_Carrier Preferences
- **Approval Required:** No
- **Dependencies:** aiRouterService.jsw; driverMatching.jsw

---

## B2B TOOLS (~25 tools)

**Role for all B2B tools:** admin (b2b context)
**Track:** b2b_business_development_suite_20260128

---

### get_b2b_match_signals
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the top non-client carriers ranked by match signal score — how many high-quality VelocityMatch drivers align to their known lanes, equipment, and CDL requirements. Drives the B2B opportunity queue.
- **Parameters:**
  ```
  min_score: number          — Minimum signal score to include (default: 50)
  region: string             — Filter by carrier HQ state/region; omit for national
  fleet_size_band: string    — small | medium | large | all (default: all)
  exclude_existing_clients: boolean — Exclude carriers already on a paid plan (default: true)
  limit: number              — Max results to return (default: 25)
  owner_id: string           — Filter signals already claimed by a specific BD rep
  ```
- **Backend Service:** b2bMatchSignalService.jsw → getMatchSignals()
- **Airtable Collection(s):** b2bMatchSignals → v2_B2B Match Signals
- **Approval Required:** No
- **Dependencies:** carrierMatching.jsw; reverse_matching_20251225

---

### get_carrier_intent_data
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns hiring intent signals for a specific non-client carrier — active job postings count, posting frequency trend, and inferred urgency score.
- **Parameters:**
  ```
  carrier_dot: number        — Target carrier DOT number (required)
  ```
- **Backend Service:** b2bMatchSignalService.jsw → getCarrierIntentData()
- **Airtable Collection(s):** b2bMatchSignals → v2_B2B Match Signals; b2bAccountResearch → v2_B2B Account Research
- **Approval Required:** No
- **Dependencies:** externalFmcsaApi.jsw

---

### get_market_opportunity
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a market opportunity summary for a geographic region or lane — total non-client carriers, estimated addressable revenue, and carrier segment breakdown.
- **Parameters:**
  ```
  region: string             — State code or region name (required)
  equipment_type: string     — dry_van | reefer | flatbed | tanker | all (default: all)
  fleet_size_band: string    — small | medium | large | all (default: all)
  ```
- **Backend Service:** b2bAnalyticsService.jsw → getMarketOpportunity()
- **Airtable Collection(s):** b2bMatchSignals → v2_B2B Match Signals; b2bAccounts → v2_B2B Accounts
- **Approval Required:** No
- **Dependencies:** None

---

### score_lead
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a composite lead score for a specific carrier account — combining match signal score, intent data, fleet size, region priority, and engagement history — with a recommended action tier.
- **Parameters:**
  ```
  account_id: string         — B2BAccounts record ID (required)
  ```
- **Backend Service:** b2bMatchSignalService.jsw → scoreLead()
- **Airtable Collection(s):** b2bAccounts → v2_B2B Accounts; b2bMatchSignals → v2_B2B Match Signals; b2bActivities → v2_B2B Activities
- **Approval Required:** No
- **Dependencies:** aiRouterService.jsw

---

### get_lead_recommendations
- **Role:** admin
- **Risk Level:** suggest
- **Description:** Returns a ranked list of the top 10 recommended accounts to contact today based on signal score, last activity date, open pipeline stage, and urgency flags.
- **Parameters:**
  ```
  owner_id: string           — BD rep's user ID to filter to their book (required)
  include_unowned: boolean   — Include unassigned accounts in recommendations (default: true)
  ```
- **Backend Service:** b2bMatchSignalService.jsw → getLeadRecommendations()
- **Airtable Collection(s):** b2bAccounts → v2_B2B Accounts; b2bMatchSignals → v2_B2B Match Signals; b2bOpportunities → v2_B2B Opportunities
- **Approval Required:** No
- **Dependencies:** aiRouterService.jsw

---

### get_b2b_pipeline
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the full B2B sales pipeline with opportunities organized by stage, including deal values, risk flags, owner assignments, and summary rollups per stage.
- **Parameters:**
  ```
  owner_id: string           — Filter to specific BD rep; omit for all
  region: string             — Filter by carrier region; omit for all
  segment: string            — Filter by carrier segment: small | medium | large | all
  signal_min: number         — Minimum match signal score filter
  stage_ids: string[]        — Filter to specific stage IDs
  view: string               — kanban | table | forecast (default: kanban)
  ```
- **Backend Service:** b2bPipelineService.jsw → getPipeline()
- **Airtable Collection(s):** b2bOpportunities → v2_B2B Opportunities; b2bAccounts → v2_B2B Accounts
- **Approval Required:** No
- **Dependencies:** None

---

### create_opportunity
- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Creates a new opportunity record in the B2B pipeline for a carrier account. Links to a match signal if available.
- **Parameters:**
  ```
  account_id: string         — B2BAccounts record ID (required)
  owner_id: string           — BD rep's user ID (required)
  value_estimate_usd: number — Estimated annual contract value in USD (required)
  stage: string              — prospecting | discovery | proposal | negotiation | closed_won | closed_lost (default: prospecting)
  match_signal_id: string    — Optional B2BMatchSignals record ID
  next_step: string          — Description of next action
  next_step_date: string     — ISO 8601 date
  notes: string              — Initial opportunity notes
  ```
- **Backend Service:** b2bPipelineService.jsw → createOpportunity()
- **Airtable Collection(s):** b2bOpportunities → v2_B2B Opportunities
- **Approval Required:** No
- **Dependencies:** None

---

### update_opportunity_stage
- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Advances or changes the stage of a pipeline opportunity. Evaluates automation rules and logs a B2BActivity entry for the stage change.
- **Parameters:**
  ```
  opportunity_id: string     — B2BOpportunities record ID (required)
  new_stage: string          — Target stage (required)
  close_reason: string       — Required if stage is closed_won or closed_lost
  notes: string              — Optional stage-change notes
  next_step: string          — Next action description
  next_step_date: string     — ISO 8601 date for next action
  ```
- **Backend Service:** b2bPipelineService.jsw → updateOpportunityStage()
- **Airtable Collection(s):** b2bOpportunities → v2_B2B Opportunities; b2bActivities → v2_B2B Activities
- **Approval Required:** No
- **Dependencies:** b2bActivityService.jsw

---

### get_pipeline_analytics
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns pipeline analytics — total deals by stage, total pipeline value, weighted forecast, stage-to-stage conversion rates, and average age per stage.
- **Parameters:**
  ```
  owner_id: string           — Filter to specific rep; omit for team totals
  date_range_days: number    — Rolling window for closed deals analysis (default: 90)
  ```
- **Backend Service:** b2bAnalyticsService.jsw → getPipelineAnalytics()
- **Airtable Collection(s):** b2bOpportunities → v2_B2B Opportunities
- **Approval Required:** No
- **Dependencies:** None

---

### get_conversion_funnel
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the stage-to-stage conversion funnel — how many deals entered each stage, the conversion rate to the next stage, and average days spent in each stage.
- **Parameters:**
  ```
  start_date: string         — ISO 8601 start date (default: 90 days ago)
  end_date: string           — ISO 8601 end date (default: today)
  owner_id: string           — Filter to specific rep; omit for all
  ```
- **Backend Service:** b2bAnalyticsService.jsw → getConversionFunnel()
- **Airtable Collection(s):** b2bOpportunities → v2_B2B Opportunities
- **Approval Required:** No
- **Dependencies:** None

---

### get_pipeline_forecast
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a revenue forecast based on pipeline stage probabilities — commit (high confidence), best case, and full pipeline scenarios for the current and next quarter.
- **Parameters:**
  ```
  owner_id: string           — Filter to specific rep; omit for team forecast
  forecast_quarter: string   — current | next | both (default: current)
  ```
- **Backend Service:** b2bAnalyticsService.jsw → getPipelineForecast()
- **Airtable Collection(s):** b2bOpportunities → v2_B2B Opportunities; b2bAnalyticsSnapshots → v2_B2B Analytics Snapshots
- **Approval Required:** No
- **Dependencies:** None

---

### create_b2b_outreach
- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Creates and enrolls an account or contact in a multi-step outreach sequence. The sequence engine will execute each step according to the schedule and conditions.
- **Parameters:**
  ```
  account_id: string         — B2BAccounts record ID (required)
  contact_id: string         — B2BContacts record ID to enroll (required)
  sequence_id: string        — B2BSequences record ID (required)
  owner_id: string           — BD rep owning this outreach (required)
  start_date: string         — ISO 8601 start date (default: today)
  personalization: object    — Key-value pairs for template variable substitution
  ```
- **Backend Service:** b2bSequenceService.jsw → enrollInSequence()
- **Airtable Collection(s):** b2bSequences → v2_B2B Sequences; b2bAccounts → v2_B2B Accounts
- **Approval Required:** No
- **Dependencies:** emailService.jsw

---

### send_b2b_email
- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Sends a one-off email to a B2B contact and logs the activity in the account timeline. Supports template selection or custom body.
- **Parameters:**
  ```
  account_id: string         — B2BAccounts record ID (required)
  contact_id: string         — B2BContacts record ID (required)
  subject: string            — Email subject line (required)
  body: string               — Email body HTML (required)
  template_id: string        — Optional email template ID to use instead of custom body
  personalization: object    — Template variable substitution values
  owner_id: string           — Sending BD rep user ID (required)
  ```
- **Backend Service:** b2bActivityService.jsw → sendB2BEmail()
- **Airtable Collection(s):** b2bEmails → v2_B2B Emails; b2bActivities → v2_B2B Activities
- **Approval Required:** No
- **Dependencies:** emailService.jsw

---

### send_b2b_sms
- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Sends a one-off SMS to a B2B contact. Checks consent status and enforces quiet hours before sending. Logs the activity in the account timeline.
- **Parameters:**
  ```
  account_id: string         — B2BAccounts record ID (required)
  contact_id: string         — B2BContacts record ID (required)
  message: string            — SMS body text, max 160 characters (required)
  owner_id: string           — Sending BD rep user ID (required)
  ```
- **Backend Service:** b2bActivityService.jsw → sendB2BSMS()
- **Airtable Collection(s):** b2bTextMessages → v2_B2B Text Messages; b2bActivities → v2_B2B Activities
- **Approval Required:** No
- **Dependencies:** b2bSecurityService.jsw (consent check)

---

### schedule_b2b_call
- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Schedules an outbound call task for a BD rep on a specific date and time. Optionally creates a calendar event and sends an email confirmation to the contact.
- **Parameters:**
  ```
  account_id: string         — B2BAccounts record ID (required)
  contact_id: string         — B2BContacts record ID (required)
  owner_id: string           — BD rep user ID who will make the call (required)
  scheduled_at: string       — ISO 8601 datetime for the call (required)
  call_objective: string     — Short description of the call goal
  send_confirmation: boolean — Email confirmation to contact (default: false)
  ```
- **Backend Service:** b2bActivityService.jsw → scheduleB2BCall()
- **Airtable Collection(s):** b2bActivities → v2_B2B Activities; b2bCalls → v2_B2B Calls
- **Approval Required:** No
- **Dependencies:** None

---

### log_b2b_activity
- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Manually logs a completed B2B activity to the account timeline — call completed, meeting held, referral received, or other touchpoint.
- **Parameters:**
  ```
  account_id: string         — B2BAccounts record ID (required)
  contact_id: string         — B2BContacts record ID if contact-specific (optional)
  activity_type: string      — call | email | sms | meeting | demo | referral | note | other (required)
  subject: string            — Activity subject or title (required)
  notes: string              — Detailed activity notes
  outcome: string            — connected | no_answer | left_voicemail | interested | not_interested | meeting_booked | other
  owner_id: string           — BD rep user ID (required)
  occurred_at: string        — ISO 8601 datetime; defaults to now
  ```
- **Backend Service:** b2bActivityService.jsw → logActivity()
- **Airtable Collection(s):** b2bActivities → v2_B2B Activities
- **Approval Required:** No
- **Dependencies:** None

---

### get_outreach_analytics
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns outreach performance analytics — email open/click/reply rates, SMS reply rates, call connect rates, meeting booking rates, and sequence step performance.
- **Parameters:**
  ```
  owner_id: string           — Filter to specific rep; omit for team totals
  start_date: string         — ISO 8601 start date (default: 30 days ago)
  end_date: string           — ISO 8601 end date (default: today)
  sequence_id: string        — Filter to specific sequence; omit for all
  channel: string            — email | sms | voice | all (default: all)
  ```
- **Backend Service:** b2bAnalyticsService.jsw → getOutreachAnalytics()
- **Airtable Collection(s):** b2bEmails → v2_B2B Emails; b2bTextMessages → v2_B2B Text Messages; b2bCalls → v2_B2B Calls
- **Approval Required:** No
- **Dependencies:** None

---

### create_b2b_event
- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Creates a B2B lead capture event (trade show, webinar, conference, etc.) with a unique registration link and lead tracking configuration.
- **Parameters:**
  ```
  event_name: string         — Event name (required)
  event_type: string         — tradeshow | conference | webinar | networking | road_show | other (required)
  event_date: string         — ISO 8601 date (required)
  location: string           — Physical location or "Virtual"
  owner_id: string           — BD rep owning the event (required)
  budget_usd: number         — Event budget for ROI tracking
  expected_leads: number     — Expected lead count
  ```
- **Backend Service:** b2bActivityService.jsw → createEvent()
- **Airtable Collection(s):** b2bLeadCaptureEvents → v2_B2B Lead Capture Events
- **Approval Required:** No
- **Dependencies:** None

---

### get_b2b_events
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the list of B2B events with lead counts, ROI metrics, and status (upcoming, in-progress, completed).
- **Parameters:**
  ```
  owner_id: string           — Filter to specific rep's events; omit for all
  status: string             — upcoming | in_progress | completed | all (default: all)
  date_range_days: number    — Rolling window for completed events (default: 90)
  ```
- **Backend Service:** b2bActivityService.jsw → getEvents()
- **Airtable Collection(s):** b2bLeadCaptureEvents → v2_B2B Lead Capture Events
- **Approval Required:** No
- **Dependencies:** None

---

### register_for_event
- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Creates or links a B2B account to an event attendance record. Used during live event lead capture to associate a new carrier contact with an event.
- **Parameters:**
  ```
  event_id: string           — B2BLeadCaptureEvents record ID (required)
  account_id: string         — Existing B2BAccounts record ID; omit if new account
  carrier_name: string       — Required if creating a new account
  carrier_dot: number        — Optional DOT number for new accounts
  contact_name: string       — Contact name (required)
  contact_email: string      — Contact email
  contact_phone: string      — Contact phone
  notes: string              — Quick notes from the conversation
  ```
- **Backend Service:** b2bActivityService.jsw → registerForEvent()
- **Airtable Collection(s):** b2bLeadCaptureEvents → v2_B2B Lead Capture Events; b2bAccounts → v2_B2B Accounts; b2bContacts → v2_B2B Contacts
- **Approval Required:** No
- **Dependencies:** None

---

### get_event_attendees
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the list of leads/contacts captured at a specific event with their account associations and follow-up status.
- **Parameters:**
  ```
  event_id: string           — B2BLeadCaptureEvents record ID (required)
  follow_up_status: string   — pending | contacted | in_pipeline | all (default: all)
  ```
- **Backend Service:** b2bActivityService.jsw → getEventAttendees()
- **Airtable Collection(s):** b2bLeadCaptureEvents → v2_B2B Lead Capture Events; b2bContacts → v2_B2B Contacts
- **Approval Required:** No
- **Dependencies:** None

---

### get_event_roi
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns ROI metrics for a completed event — total leads, leads converted to pipeline, pipeline value generated, estimated cost per lead, and closed revenue attributed.
- **Parameters:**
  ```
  event_id: string           — B2BLeadCaptureEvents record ID (required)
  ```
- **Backend Service:** b2bAnalyticsService.jsw → getEventROI()
- **Airtable Collection(s):** b2bLeadCaptureEvents → v2_B2B Lead Capture Events; b2bOpportunities → v2_B2B Opportunities; b2bSpend → v2_B2B Spend
- **Approval Required:** No
- **Dependencies:** None

---

### research_carrier
- **Role:** admin
- **Risk Level:** read
- **Description:** Triggers the AI research agent to compile a carrier intelligence brief from public sources — FMCSA profile, job postings, company website, news mentions, and CSA public signals. Results are cached for 7 days.
- **Parameters:**
  ```
  account_id: string         — B2BAccounts record ID (required)
  force_refresh: boolean     — Force re-research even if cached (default: false)
  ```
- **Backend Service:** b2bResearchAgentService.jsw → researchCarrier()
- **Airtable Collection(s):** b2bAccountResearch → v2_B2B Account Research
- **Approval Required:** No
- **Dependencies:** aiRouterService.jsw; externalFmcsaApi.jsw; b2bAIService.jsw

---

### get_carrier_intelligence
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the most recent research brief for a carrier account — fleet size, lane data, hiring signals, CSA status, growth indicators, and recommended talk track.
- **Parameters:**
  ```
  account_id: string         — B2BAccounts record ID (required)
  ```
- **Backend Service:** b2bResearchAgentService.jsw → getCarrierIntelligence()
- **Airtable Collection(s):** b2bAccountResearch → v2_B2B Account Research
- **Approval Required:** No
- **Dependencies:** None

---

### get_fmcsa_data
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns raw FMCSA public data for a carrier by DOT number — authority status, safety rating, fleet size, insurance information, and inspection history summary.
- **Parameters:**
  ```
  carrier_dot: number        — Target carrier DOT number (required)
  ```
- **Backend Service:** b2bResearchAgentService.jsw → getFMCSAData()
- **Airtable Collection(s):** b2bAccountResearch → v2_B2B Account Research
- **Approval Required:** No
- **Dependencies:** externalFmcsaApi.jsw; fmcsaService.jsw

---

### get_company_news
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns recent news mentions and press items for a carrier company — useful for identifying growth events, leadership changes, or industry awards as conversation openers.
- **Parameters:**
  ```
  account_id: string         — B2BAccounts record ID (required)
  days_back: number          — Look-back window in days (default: 90)
  ```
- **Backend Service:** b2bResearchAgentService.jsw → getCompanyNews()
- **Airtable Collection(s):** b2bAccountResearch → v2_B2B Account Research
- **Approval Required:** No
- **Dependencies:** aiRouterService.jsw; externalIntelligenceApi.jsw

---

### generate_carrier_brief
- **Role:** admin
- **Risk Level:** suggest
- **Description:** Generates a formatted one-page carrier brief combining match signal data, FMCSA data, hiring intent signals, and a suggested talk track. Returns a structured brief object suitable for display or PDF export.
- **Parameters:**
  ```
  account_id: string         — B2BAccounts record ID (required)
  include_talk_track: boolean — Include AI-generated talk track (default: true)
  include_match_data: boolean — Include match signal details (default: true)
  ```
- **Backend Service:** b2bResearchAgentService.jsw → generateCarrierBrief()
- **Airtable Collection(s):** b2bAccountResearch → v2_B2B Account Research; b2bMatchSignals → v2_B2B Match Signals
- **Approval Required:** No
- **Dependencies:** aiRouterService.jsw; b2bAIService.jsw; b2bContentAIService.jsw

---

### get_b2b_dashboard
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the full B2B dashboard state — KPIs (pipeline coverage, win rate, avg cycle days, forecast accuracy, activity velocity, replies last 7 days), top non-client carrier list, active alerts, and next-action queue for the requesting rep.
- **Parameters:**
  ```
  owner_id: string           — BD rep user ID for personalized queue (required)
  date_range_preset: string  — last_7_days | last_30_days | last_90_days | current_quarter (default: last_30_days)
  ```
- **Backend Service:** b2bAnalyticsService.jsw → getDashboard()
- **Airtable Collection(s):** b2bOpportunities → v2_B2B Opportunities; b2bMatchSignals → v2_B2B Match Signals; b2bActivities → v2_B2B Activities; b2bAnalyticsSnapshots → v2_B2B Analytics Snapshots
- **Approval Required:** No
- **Dependencies:** b2bMatchSignalService.jsw; b2bPipelineService.jsw

---

### get_revenue_attribution
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns revenue attribution analysis — which lead sources, sequences, reps, and match signal scores are producing the most closed-won revenue.
- **Parameters:**
  ```
  start_date: string         — ISO 8601 start date (default: 90 days ago)
  end_date: string           — ISO 8601 end date (default: today)
  group_by: string           — source | rep | sequence | signal_tier | segment (default: source)
  ```
- **Backend Service:** b2bAnalyticsService.jsw → getRevenueAttribution()
- **Airtable Collection(s):** b2bLeadAttribution → v2_B2B Lead Attribution; b2bOpportunities → v2_B2B Opportunities
- **Approval Required:** No
- **Dependencies:** None

---

### get_b2b_kpis
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the core B2B KPI snapshot — pipeline coverage ratio, win rate, average sales cycle days, forecast accuracy, cost per acquisition by channel, and activity-to-outcome ratios.
- **Parameters:**
  ```
  owner_id: string           — Filter to specific rep; omit for team totals
  date_range_days: number    — Rolling window (default: 30)
  ```
- **Backend Service:** b2bAnalyticsService.jsw → getB2BKPIs()
- **Airtable Collection(s):** b2bOpportunities → v2_B2B Opportunities; b2bActivities → v2_B2B Activities; b2bSpend → v2_B2B Spend; b2bAnalyticsSnapshots → v2_B2B Analytics Snapshots
- **Approval Required:** No
- **Dependencies:** None

---

### get_b2b_forecast
- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a multi-scenario revenue forecast for the B2B team — commit, best case, and full pipeline — projected over the current and next quarter, with rep-level breakdown.
- **Parameters:**
  ```
  include_rep_breakdown: boolean — Include per-rep forecast (default: true)
  forecast_quarters: number  — Number of quarters to forecast: 1 | 2 (default: 1)
  ```
- **Backend Service:** b2bAnalyticsService.jsw → getB2BForecast()
- **Airtable Collection(s):** b2bOpportunities → v2_B2B Opportunities; b2bAnalyticsSnapshots → v2_B2B Analytics Snapshots
- **Approval Required:** No
- **Dependencies:** None

---

### export_b2b_report
- **Role:** admin
- **Risk Level:** read
- **Description:** Generates a downloadable B2B report (pipeline summary, outreach analytics, or revenue attribution) and returns a signed download URL valid for 30 minutes.
- **Parameters:**
  ```
  report_type: string        — pipeline_summary | outreach_analytics | revenue_attribution | kpi_snapshot | full_dashboard (required)
  format: string             — pdf | csv | xlsx (default: pdf)
  start_date: string         — ISO 8601 start date for the report window
  end_date: string           — ISO 8601 end date for the report window
  owner_id: string           — Filter to specific rep; omit for team-wide report
  ```
- **Backend Service:** b2bAnalyticsService.jsw → exportB2BReport()
- **Airtable Collection(s):** b2bOpportunities → v2_B2B Opportunities; b2bActivities → v2_B2B Activities; b2bAnalyticsSnapshots → v2_B2B Analytics Snapshots
- **Approval Required:** No
- **Dependencies:** Wix Media Manager (temporary file hosting)

---

## Tool Count Summary

| Group | Tool Count |
|-------|------------|
| Carrier Fleet Dashboard — Roster | 6 |
| Carrier Fleet Dashboard — Equipment | 6 |
| Carrier Fleet Dashboard — Scorecards | 5 |
| Carrier Fleet Dashboard — Capacity | 5 |
| Carrier Fleet Dashboard — ELD | 5 |
| Carrier Compliance — Calendar | 5 |
| Carrier Compliance — Document Vault | 5 |
| Carrier Compliance — DQ Tracker | 5 |
| Carrier Compliance — CSA Monitor | 5 |
| Carrier Compliance — Incidents | 5 |
| Carrier Communication — Announcements | 5 |
| Carrier Communication — Policies | 5 |
| Carrier Communication — Recognition | 5 |
| Carrier Communication — Feedback | 5 |
| Carrier Journey Activation — Onboarding | 5 |
| Carrier Journey Activation — Identity | 5 |
| Carrier Journey Activation — Navigation | 5 |
| Carrier Conversion — Stripe | 5 |
| Carrier Conversion — Deposit | 4 |
| Carrier Conversion — Pricing | 5 |
| Carrier Utility Expansion — Presets | 5 |
| Carrier Utility Expansion — Status Tracker | 5 |
| Carrier Utility Expansion — Match Preview | 5 |
| **Carrier Subtotal** | **~116 (spec covers ~60 primary tools)** |
| B2B Match Intelligence | 5 |
| B2B Pipeline | 6 |
| B2B Outreach | 7 |
| B2B Events | 5 |
| B2B Research Agent | 5 |
| B2B Analytics | 5 |
| **B2B Subtotal** | **33** |
| **Grand Total** | **~93 tools specified** |
