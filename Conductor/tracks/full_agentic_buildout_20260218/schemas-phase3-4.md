# Airtable Collection Schemas: Phase 3 (Carrier/B2B) + Phase 4 (Admin)

**Track:** full_agentic_buildout_20260218
**Platform:** LMDR / VelocityMatch — Wix Velo CDL Truck Driver Recruiting
**Base ID:** `app9N1YCJ3gdhExA0`
**Generated:** 2026-02-18

> All tables use `v2_` prefix. Config keys are camelCase. Routes to Airtable via `dataAccess.jsw`.

---

## PHASE 3: CARRIER + B2B

---

### CARRIER FLEET

---

### carrierRoster → v2_Carrier Roster
**Phase:** 3 | **Service:** carrierService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| dot_number | Number | Yes | FMCSA DOT number — primary carrier identifier |
| company_name | Single Line Text | Yes | Legal company name |
| mc_number | Single Line Text | No | Motor Carrier number |
| status | SingleSelect | Yes | active \| suspended \| pending \| inactive |
| fleet_size | Number | No | Total number of power units reported to FMCSA |
| hq_state | Single Line Text | No | Headquarters state abbreviation |
| primary_contact_email | Single Line Text | No | Primary billing/operations contact email |
| subscription_tier | SingleSelect | No | trial \| pro \| enterprise |
| onboarded_date | Date | No | Date carrier completed onboarding |
| account_manager | Single Line Text | No | Internal LMDR account manager name |

**configData.js:** `carrierRoster: { airtable: 'v2_Carrier Roster', wix: 'CarrierRoster' }`

---

### carrierEquipment → v2_Carrier Equipment
**Phase:** 3 | **Service:** fleetService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Parent carrier DOT number |
| unit_number | Single Line Text | Yes | Internal unit/truck number |
| equipment_type | SingleSelect | Yes | dry_van \| flatbed \| reefer \| tanker \| lowboy \| step_deck |
| year | Number | No | Model year of the unit |
| make | Single Line Text | No | Truck manufacturer (Freightliner, Kenworth, etc.) |
| vin | Single Line Text | No | Vehicle Identification Number |
| status | SingleSelect | Yes | active \| maintenance \| out_of_service \| decommissioned |
| assigned_driver_id | Single Line Text | No | Airtable record ID of assigned fleet driver |
| last_inspection_date | Date | No | Most recent DOT inspection date |
| next_pm_due | Date | No | Next scheduled preventive maintenance date |

**configData.js:** `carrierEquipment: { airtable: 'v2_Carrier Equipment', wix: 'CarrierEquipment' }`

---

### maintenanceLogs → v2_Maintenance Logs
**Phase:** 3 | **Service:** fleetService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| unit_number | Single Line Text | Yes | Equipment unit number |
| carrier_dot | Number | Yes | Parent carrier DOT number |
| service_date | Date | Yes | Date service was performed |
| service_type | SingleSelect | Yes | oil_change \| tire \| brake \| engine \| dot_inspection \| body \| other |
| description | Long Text | No | Detailed description of work performed |
| cost_usd | Number | No | Total cost of maintenance in USD |
| vendor_name | Single Line Text | No | Shop or vendor name |
| odometer | Number | No | Odometer reading at time of service |
| next_service_due | Date | No | Projected next service date |
| recorded_by | Single Line Text | No | Name or user ID of record creator |

**configData.js:** `maintenanceLogs: { airtable: 'v2_Maintenance Logs', wix: 'MaintenanceLogs' }`

---

### safetyScoreHistory → v2_Safety Score History
**Phase:** 3 | **Service:** complianceService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| snapshot_date | Date | Yes | Date of the safety score snapshot |
| overall_score | Number | Yes | Composite safety score 0–100 |
| unsafe_driving | Number | No | BASIC score: Unsafe Driving |
| hos_compliance | Number | No | BASIC score: Hours of Service Compliance |
| driver_fitness | Number | No | BASIC score: Driver Fitness |
| vehicle_maintenance | Number | No | BASIC score: Vehicle Maintenance |
| hazmat_compliance | Number | No | BASIC score: Controlled Substances / Hazmat |
| crash_indicator | Number | No | BASIC score: Crash Indicator |
| source | SingleSelect | No | fmcsa_api \| manual \| carrier_submitted |

**configData.js:** `safetyScoreHistory: { airtable: 'v2_Safety Score History', wix: 'SafetyScoreHistory' }`

---

### capacityForecasts → v2_Capacity Forecasts
**Phase:** 3 | **Service:** capacityPlanningService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| forecast_month | Single Line Text | Yes | ISO month string (e.g. 2026-03) |
| projected_drivers | Number | No | Projected number of active drivers for the month |
| projected_miles | Number | No | Forecasted total miles driven |
| available_seats | Number | No | Open driver seats to fill |
| hiring_target | Number | No | Planned new hires for the period |
| confidence_pct | Number | No | Model confidence percentage 0–100 |
| generated_at | DateTime | No | Timestamp the forecast was generated |
| notes | Long Text | No | Analyst notes or forecast assumptions |

**configData.js:** `capacityForecasts: { airtable: 'v2_Capacity Forecasts', wix: 'CapacityForecasts' }`

---

### hiringTargets → v2_Hiring Targets
**Phase:** 3 | **Service:** capacityPlanningService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| target_period | Single Line Text | Yes | ISO month or quarter (e.g. 2026-Q2) |
| target_hires | Number | Yes | Total new driver hires targeted |
| target_by_type | Long Text | No | JSON breakdown by license class or equipment type |
| priority_lanes | Long Text | No | Comma-separated priority lane or region codes |
| approved_by | Single Line Text | No | Manager who approved the target |
| approved_date | Date | No | Date of approval |
| status | SingleSelect | Yes | draft \| approved \| active \| closed |
| actual_hires | Number | No | Actual hires achieved (updated monthly) |

**configData.js:** `hiringTargets: { airtable: 'v2_Hiring Targets', wix: 'HiringTargets' }`

---

### eldComplianceReports → v2_ELD Compliance Reports
**Phase:** 3 | **Service:** eldIntegrationService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| report_period | Single Line Text | Yes | ISO week or month string |
| total_drivers | Number | No | Total drivers included in report |
| violations_count | Number | No | Total HOS violations detected |
| exempt_drivers | Number | No | Drivers on ELD exemption |
| provider | SingleSelect | No | samsara \| omnitracs \| keeptruckin \| other |
| report_url | URL | No | Link to full ELD provider export |
| generated_date | Date | Yes | Date report was generated |
| reviewed | Checkbox | No | True if fleet manager has reviewed this report |
| notes | Long Text | No | Compliance analyst observations |

**configData.js:** `eldComplianceReports: { airtable: 'v2_ELD Compliance Reports', wix: 'EldComplianceReports' }`

---

### performanceScorecards → v2_Performance Scorecards
**Phase:** 3 | **Service:** driverScorecardService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Fleet driver Airtable record ID |
| carrier_dot | Number | Yes | Carrier DOT number |
| period_type | SingleSelect | Yes | weekly \| monthly \| quarterly |
| period_label | Single Line Text | Yes | Human label (e.g. Feb 2026) |
| safety_score | Number | No | Sub-score: safety behaviors 0–100 |
| efficiency_score | Number | No | Sub-score: MPG, idle time, route adherence |
| service_score | Number | No | Sub-score: on-time delivery, customer feedback |
| compliance_score | Number | No | Sub-score: HOS, inspection results |
| overall_score | Number | No | Weighted composite score 0–100 |
| trend_delta | Number | No | Change vs prior period (positive = improved) |

**configData.js:** `performanceScorecards: { airtable: 'v2_Performance Scorecards', wix: 'PerformanceScorecards' }`

---

### equipmentUtilization → v2_Equipment Utilization
**Phase:** 3 | **Service:** fleetService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| unit_number | Single Line Text | Yes | Equipment unit number |
| carrier_dot | Number | Yes | Carrier DOT number |
| report_week | Single Line Text | Yes | ISO week string (e.g. 2026-W07) |
| miles_driven | Number | No | Miles driven during the period |
| hours_running | Number | No | Engine-on hours during the period |
| idle_hours | Number | No | Idle hours during the period |
| utilization_pct | Number | No | Utilization rate as percentage |
| fuel_gallons | Number | No | Total fuel consumed in gallons |
| mpg | Number | No | Miles per gallon for the period |
| driver_id | Single Line Text | No | Primary driver record ID for the period |

**configData.js:** `equipmentUtilization: { airtable: 'v2_Equipment Utilization', wix: 'EquipmentUtilization' }`

---

### fleetAlerts → v2_Fleet Alerts
**Phase:** 3 | **Service:** fleetService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| alert_type | SingleSelect | Yes | license_expiry \| medical_expiry \| eld_violation \| accident \| inspection_fail \| maintenance_due |
| severity | SingleSelect | Yes | critical \| warning \| info |
| subject_id | Single Line Text | No | Record ID of the driver or unit triggering the alert |
| subject_type | SingleSelect | No | driver \| vehicle |
| message | Long Text | Yes | Human-readable alert description |
| created_at | DateTime | Yes | Timestamp alert was generated |
| resolved | Checkbox | No | True once the alert has been actioned |
| resolved_at | DateTime | No | Timestamp the alert was resolved |
| resolved_by | Single Line Text | No | User who resolved the alert |

**configData.js:** `fleetAlerts: { airtable: 'v2_Fleet Alerts', wix: 'FleetAlerts' }`

---

### CARRIER COMPLIANCE

---

### complianceCalendar → v2_Compliance Calendar
**Phase:** 3 | **Service:** complianceService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| event_type | SingleSelect | Yes | ucr_renewal \| ifta_filing \| dot_audit \| drug_test \| annual_review \| permit_renewal |
| title | Single Line Text | Yes | Short label for the calendar event |
| due_date | Date | Yes | Compliance deadline date |
| reminder_days | Number | No | Days before due date to trigger reminder |
| status | SingleSelect | Yes | upcoming \| overdue \| completed \| waived |
| assigned_to | Single Line Text | No | Staff member responsible |
| completed_date | Date | No | Date the item was completed |
| notes | Long Text | No | Supporting notes or reference numbers |

**configData.js:** `complianceCalendar: { airtable: 'v2_Compliance Calendar', wix: 'ComplianceCalendar' }`

---

### carrierDocVault → v2_Carrier Doc Vault
**Phase:** 3 | **Service:** documentCollectionService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| doc_type | SingleSelect | Yes | operating_authority \| insurance_cert \| w9 \| ifta_license \| ucr \| other |
| doc_name | Single Line Text | Yes | Filename or document title |
| doc_url | URL | No | Link to stored document (Wix Media or S3) |
| expiry_date | Date | No | Document expiration date (if applicable) |
| uploaded_date | Date | Yes | Date document was uploaded |
| uploaded_by | Single Line Text | No | User who uploaded the document |
| status | SingleSelect | Yes | active \| expired \| pending_review \| rejected |
| notes | Long Text | No | Reviewer notes |

**configData.js:** `carrierDocVault: { airtable: 'v2_Carrier Doc Vault', wix: 'CarrierDocVault' }`

---

### dqFileItems → v2_DQ File Items
**Phase:** 3 | **Service:** documentCollectionService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Fleet driver record ID |
| carrier_dot | Number | Yes | Carrier DOT number |
| item_type | SingleSelect | Yes | cdl_copy \| mvr \| psp \| drug_test \| road_test \| application \| previous_employment \| physical |
| status | SingleSelect | Yes | missing \| received \| verified \| expired |
| received_date | Date | No | Date item was received from driver |
| expiry_date | Date | No | Expiration date if applicable |
| doc_url | URL | No | Link to the document file |
| verified_by | Single Line Text | No | Compliance officer who verified the item |
| notes | Long Text | No | Notes or exceptions |

**configData.js:** `dqFileItems: { airtable: 'v2_DQ File Items', wix: 'DqFileItems' }`

---

### csaScoreHistory → ⚠️ ALREADY EXISTS IN configData.js → v2_CSA Score History
**Phase:** 3 | **Service:** complianceService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| snapshot_date | Date | Yes | Date CSA scores were captured |
| unsafe_driving_pct | Number | No | CSA percentile: Unsafe Driving |
| hos_compliance_pct | Number | No | CSA percentile: Hours of Service |
| driver_fitness_pct | Number | No | CSA percentile: Driver Fitness |
| vehicle_maintenance_pct | Number | No | CSA percentile: Vehicle Maintenance |
| controlled_substances_pct | Number | No | CSA percentile: Controlled Substances |
| crash_indicator_pct | Number | No | CSA percentile: Crash Indicator |
| intervention_flag | Checkbox | No | True if FMCSA intervention threshold exceeded |

**configData.js:** `csaScoreHistory: { airtable: 'v2_CSA Score History', wix: 'CsaScoreHistory' }`

---

### incidentReports → ⚠️ ALREADY EXISTS IN configData.js → v2_Incident Reports
**Phase:** 3 | **Service:** complianceService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| incident_date | Date | Yes | Date of the incident |
| incident_type | SingleSelect | Yes | accident \| near_miss \| property_damage \| injury \| spill \| theft |
| severity | SingleSelect | Yes | minor \| moderate \| major \| fatality |
| driver_id | Single Line Text | No | Involved driver record ID |
| unit_number | Single Line Text | No | Involved equipment unit number |
| location | Single Line Text | No | City, State where incident occurred |
| description | Long Text | Yes | Detailed incident narrative |
| dot_reportable | Checkbox | No | True if incident meets DOT reporting threshold |
| claim_number | Single Line Text | No | Insurance claim number if filed |

**configData.js:** `incidentReports: { airtable: 'v2_Incident Reports', wix: 'IncidentReports' }`

---

### complianceReminders → v2_Compliance Reminders
**Phase:** 3 | **Service:** complianceService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| reminder_type | SingleSelect | Yes | license_expiry \| medical_cert \| drug_test \| ifta \| ucr \| audit |
| subject_id | Single Line Text | No | Driver or document record ID |
| due_date | Date | Yes | Deadline requiring action |
| send_at | DateTime | No | Scheduled delivery timestamp |
| channel | SingleSelect | No | email \| sms \| in_app |
| sent | Checkbox | No | True once reminder was dispatched |
| sent_at | DateTime | No | Actual delivery timestamp |
| recipient_email | Single Line Text | No | Recipient email address |

**configData.js:** `complianceReminders: { airtable: 'v2_Compliance Reminders', wix: 'ComplianceReminders' }`

---

### violationTracking → v2_Violation Tracking
**Phase:** 3 | **Service:** complianceService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| driver_id | Single Line Text | No | Driver record ID if driver-level violation |
| unit_number | Single Line Text | No | Equipment unit if vehicle-level violation |
| violation_date | Date | Yes | Date violation was cited |
| violation_code | Single Line Text | Yes | FMCSA or state violation code |
| description | Long Text | No | Plain-language violation description |
| basic_category | SingleSelect | No | unsafe_driving \| hos \| driver_fitness \| vehicle_maintenance \| hazmat \| crash |
| severity | SingleSelect | Yes | warning \| citation \| out_of_service |
| resolved | Checkbox | No | True once corrective action is complete |
| resolution_notes | Long Text | No | Steps taken to correct the violation |

**configData.js:** `violationTracking: { airtable: 'v2_Violation Tracking', wix: 'ViolationTracking' }`

---

### auditSchedule → v2_Audit Schedule
**Phase:** 3 | **Service:** complianceService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| audit_type | SingleSelect | Yes | dot_compliance \| internal \| safety \| financial \| dq_file |
| scheduled_date | Date | Yes | Planned audit date |
| auditor | Single Line Text | No | Name or firm conducting the audit |
| status | SingleSelect | Yes | scheduled \| in_progress \| complete \| cancelled |
| findings_count | Number | No | Number of findings or deficiencies identified |
| report_url | URL | No | Link to audit report document |
| completed_date | Date | No | Actual completion date |
| follow_up_due | Date | No | Deadline for corrective action plan |

**configData.js:** `auditSchedule: { airtable: 'v2_Audit Schedule', wix: 'AuditSchedule' }`

---

### regulatoryUpdates → v2_Regulatory Updates
**Phase:** 3 | **Service:** complianceService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| update_title | Single Line Text | Yes | Short title of the regulatory change |
| agency | SingleSelect | Yes | fmcsa \| dot \| epa \| state \| osha |
| effective_date | Date | No | Date the rule or update takes effect |
| published_date | Date | Yes | Date the update was published |
| summary | Long Text | Yes | Plain-language summary of the change |
| impact_level | SingleSelect | No | high \| medium \| low |
| action_required | Checkbox | No | True if carriers must take action |
| reference_url | URL | No | Link to official rule or announcement |
| carrier_types_affected | MultiSelect | No | dry_van \| flatbed \| reefer \| tanker \| all |

**configData.js:** `regulatoryUpdates: { airtable: 'v2_Regulatory Updates', wix: 'RegulatoryUpdates' }`

---

### complianceCertifications → v2_Compliance Certifications
**Phase:** 3 | **Service:** complianceService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| cert_type | SingleSelect | Yes | safety_management \| drug_alcohol_program \| hazmat \| iso_9001 \| other |
| cert_name | Single Line Text | Yes | Full certification name |
| issuing_body | Single Line Text | No | Organization that issued the certification |
| issued_date | Date | No | Date certification was granted |
| expiry_date | Date | No | Expiration date |
| cert_number | Single Line Text | No | Certificate or license number |
| doc_url | URL | No | Link to certification document |
| status | SingleSelect | Yes | active \| expired \| pending |

**configData.js:** `complianceCertifications: { airtable: 'v2_Compliance Certifications', wix: 'ComplianceCertifications' }`

---

### CARRIER COMMUNICATION

---

### carrierAnnouncements → ⚠️ ALREADY EXISTS IN configData.js → v2_Carrier Announcements
**Phase:** 3 | **Service:** carrierCommunicationService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Target carrier DOT number (blank = platform-wide) |
| title | Single Line Text | Yes | Announcement headline |
| body | Long Text | Yes | Full announcement content |
| category | SingleSelect | Yes | operations \| compliance \| hr \| safety \| general |
| audience | SingleSelect | Yes | all_drivers \| fleet_managers \| dispatchers \| all |
| published_at | DateTime | No | Timestamp the announcement was published |
| expires_at | DateTime | No | Timestamp after which announcement is hidden |
| pinned | Checkbox | No | True if pinned to top of announcement feed |
| author | Single Line Text | No | Name or user ID of the author |

**configData.js:** `carrierAnnouncements: { airtable: 'v2_Carrier Announcements', wix: 'CarrierAnnouncements' }`

---

### carrierPolicies → v2_Carrier Policies
**Phase:** 3 | **Service:** carrierCommunicationService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| policy_title | Single Line Text | Yes | Official policy name |
| policy_type | SingleSelect | Yes | safety \| drug_alcohol \| attendance \| harassment \| equipment \| compensation |
| version | Single Line Text | No | Version number (e.g. v2.1) |
| effective_date | Date | Yes | Date policy became effective |
| doc_url | URL | No | Link to policy document |
| acknowledgment_required | Checkbox | No | True if drivers must sign acknowledgment |
| last_reviewed | Date | No | Date policy was last reviewed or updated |
| notes | Long Text | No | Change log or revision notes |

**configData.js:** `carrierPolicies: { airtable: 'v2_Carrier Policies', wix: 'CarrierPolicies' }`

---

### policyAcknowledgments → ⚠️ ALREADY EXISTS IN configData.js → v2_Policy Acknowledgments
**Phase:** 3 | **Service:** carrierCommunicationService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Fleet driver record ID |
| carrier_dot | Number | Yes | Carrier DOT number |
| policy_id | Single Line Text | Yes | Carrier Policies record ID |
| acknowledged | Checkbox | Yes | True once driver has signed/confirmed |
| acknowledged_at | DateTime | No | Timestamp of acknowledgment |
| method | SingleSelect | No | in_app \| email \| paper \| esign |
| signature_url | URL | No | Link to e-signature document if applicable |

**configData.js:** `policyAcknowledgments: { airtable: 'v2_Policy Acknowledgments', wix: 'PolicyAcknowledgments' }`

---

### driverRecognitions → v2_Driver Recognitions
**Phase:** 3 | **Service:** carrierCommunicationService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Fleet driver record ID |
| carrier_dot | Number | Yes | Carrier DOT number |
| recognition_type | SingleSelect | Yes | safe_driver \| top_miler \| on_time \| years_of_service \| peer_nominated |
| title | Single Line Text | Yes | Short recognition label (e.g. "1 Million Safe Miles") |
| message | Long Text | No | Personalized recognition message |
| awarded_date | Date | Yes | Date recognition was awarded |
| awarded_by | Single Line Text | No | Manager or system that granted the recognition |
| public | Checkbox | No | True if visible to other drivers on the portal |

**configData.js:** `driverRecognitions: { airtable: 'v2_Driver Recognitions', wix: 'DriverRecognitions' }`

---

### carrierFeedbackSurveys → v2_Carrier Feedback Surveys
**Phase:** 3 | **Service:** carrierCommunicationService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| survey_type | SingleSelect | Yes | nps \| csat \| feature_request \| onboarding \| annual |
| respondent_id | Single Line Text | No | Driver or manager record ID |
| score | Number | No | Numeric response (e.g. NPS 0–10, CSAT 1–5) |
| response_text | Long Text | No | Open-ended response |
| submitted_at | DateTime | Yes | Submission timestamp |
| category_tags | MultiSelect | No | billing \| matching \| compliance \| portal \| support |
| follow_up_needed | Checkbox | No | True if low score requires follow-up |
| follow_up_notes | Long Text | No | Internal notes from follow-up conversation |

**configData.js:** `carrierFeedbackSurveys: { airtable: 'v2_Carrier Feedback Surveys', wix: 'CarrierFeedbackSurveys' }`

---

### CARRIER JOURNEY

---

### carrierOnboardingProgress → v2_Carrier Onboarding Progress
**Phase:** 3 | **Service:** carrierOnboardingService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| step_key | Single Line Text | Yes | Machine key for the onboarding step |
| step_label | Single Line Text | Yes | Human-readable step name |
| completed | Checkbox | No | True once step is complete |
| completed_at | DateTime | No | Timestamp step was marked complete |
| skipped | Checkbox | No | True if user skipped an optional step |
| order_index | Number | No | Display order of the step (0-based) |
| completion_pct | Number | No | Aggregate onboarding completion 0–100 |

**configData.js:** `carrierOnboardingProgress: { airtable: 'v2_Carrier Onboarding Progress', wix: 'CarrierOnboardingProgress' }`

---

### carrierBranding → v2_Carrier Branding
**Phase:** 3 | **Service:** carrierService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| logo_url | URL | No | Hosted carrier logo URL |
| primary_color | Single Line Text | No | Brand primary hex color (e.g. #FF6600) |
| secondary_color | Single Line Text | No | Brand secondary hex color |
| tagline | Single Line Text | No | Carrier recruiting tagline |
| header_image_url | URL | No | Header/banner image for carrier profile |
| driver_portal_theme | SingleSelect | No | light \| dark \| branded |
| updated_at | DateTime | No | Timestamp branding was last updated |

**configData.js:** `carrierBranding: { airtable: 'v2_Carrier Branding', wix: 'CarrierBranding' }`

---

### carrierQuickActions → v2_Carrier Quick Actions
**Phase:** 3 | **Service:** carrierService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| action_key | Single Line Text | Yes | Machine key for the quick action |
| label | Single Line Text | Yes | Button label shown on dashboard |
| icon | Single Line Text | No | Material Symbol icon name |
| target_url | URL | No | Deep link or page route |
| enabled | Checkbox | No | True if the action is active for this carrier |
| order_index | Number | No | Display order (lower = appears first) |

**configData.js:** `carrierQuickActions: { airtable: 'v2_Carrier Quick Actions', wix: 'CarrierQuickActions' }`

---

### featureTourProgress → v2_Feature Tour Progress
**Phase:** 3 | **Service:** carrierService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| user_id | Single Line Text | Yes | Wix member ID of the touring user |
| tour_key | Single Line Text | Yes | Machine key for the feature tour |
| step_index | Number | No | Last completed step index |
| completed | Checkbox | No | True if the user finished the tour |
| dismissed | Checkbox | No | True if the user dismissed the tour early |
| started_at | DateTime | No | Timestamp tour was first started |
| completed_at | DateTime | No | Timestamp tour was completed |

**configData.js:** `featureTourProgress: { airtable: 'v2_Feature Tour Progress', wix: 'FeatureTourProgress' }`

---

### carrierDashboardConfig → v2_Carrier Dashboard Config
**Phase:** 3 | **Service:** carrierService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| widget_layout | Long Text | No | JSON array of widget keys and grid positions |
| default_tab | SingleSelect | No | fleet \| compliance \| hiring \| reports |
| timezone | Single Line Text | No | IANA timezone string (e.g. America/Chicago) |
| notifications_enabled | Checkbox | No | True if in-app notifications are active |
| digest_frequency | SingleSelect | No | daily \| weekly \| off |
| updated_at | DateTime | No | Timestamp config was last saved |

**configData.js:** `carrierDashboardConfig: { airtable: 'v2_Carrier Dashboard Config', wix: 'CarrierDashboardConfig' }`

---

### CARRIER CONVERSION

---

### carrierSubscriptions → ⚠️ ALREADY EXISTS IN configData.js → v2_Carrier Subscriptions
**Phase:** 3 | **Service:** subscriptionService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| plan_id | Single Line Text | Yes | Pricing plan record ID |
| stripe_subscription_id | Single Line Text | No | Stripe subscription object ID |
| status | SingleSelect | Yes | trialing \| active \| past_due \| cancelled \| paused |
| started_date | Date | Yes | Subscription start date |
| current_period_end | Date | No | End of current billing period |
| cancel_at_period_end | Checkbox | No | True if set to cancel at period end |
| mrr_usd | Number | No | Monthly recurring revenue in USD |
| seats | Number | No | Number of portal user seats included |

**configData.js:** `carrierSubscriptions: { airtable: 'v2_Carrier Subscriptions', wix: 'CarrierSubscriptions' }`

---

### carrierPayments → v2_Carrier Payments
**Phase:** 3 | **Service:** subscriptionService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| stripe_payment_intent_id | Single Line Text | No | Stripe PaymentIntent ID |
| amount_usd | Number | Yes | Payment amount in USD |
| status | SingleSelect | Yes | succeeded \| pending \| failed \| refunded |
| payment_date | Date | Yes | Date payment was processed |
| invoice_id | Single Line Text | No | Linked invoice record ID |
| description | Single Line Text | No | Line item description |
| failure_reason | Single Line Text | No | Stripe decline code or reason if failed |

**configData.js:** `carrierPayments: { airtable: 'v2_Carrier Payments', wix: 'CarrierPayments' }`

---

### carrierDeposits → v2_Carrier Deposits
**Phase:** 3 | **Service:** subscriptionService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| amount_usd | Number | Yes | Deposit amount in USD |
| deposit_type | SingleSelect | Yes | onboarding \| performance_bond \| platform_credit |
| status | SingleSelect | Yes | held \| applied \| refunded |
| received_date | Date | Yes | Date deposit was received |
| applied_to | Single Line Text | No | Invoice or subscription ID deposit was applied to |
| refund_date | Date | No | Date deposit was refunded if applicable |
| notes | Long Text | No | Internal notes on the deposit |

**configData.js:** `carrierDeposits: { airtable: 'v2_Carrier Deposits', wix: 'CarrierDeposits' }`

---

### pricingPlans → v2_Pricing Plans
**Phase:** 3 | **Service:** subscriptionService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| plan_key | Single Line Text | Yes | Machine key (e.g. pro_monthly) |
| plan_name | Single Line Text | Yes | Display name (e.g. Pro — Monthly) |
| price_usd | Number | Yes | Price in USD per billing cycle |
| billing_cycle | SingleSelect | Yes | monthly \| annual |
| seats_included | Number | No | Portal user seats included |
| driver_limit | Number | No | Maximum fleet driver records |
| features | Long Text | No | JSON array of included feature keys |
| stripe_price_id | Single Line Text | No | Stripe Price object ID |
| active | Checkbox | Yes | True if plan is publicly available |

**configData.js:** `pricingPlans: { airtable: 'v2_Pricing Plans', wix: 'PricingPlans' }`

---

### subscriptionChanges → v2_Subscription Changes
**Phase:** 3 | **Service:** subscriptionService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| subscription_id | Single Line Text | Yes | Carrier Subscriptions record ID |
| change_type | SingleSelect | Yes | upgrade \| downgrade \| pause \| resume \| cancel \| reactivate |
| from_plan | Single Line Text | No | Previous plan key |
| to_plan | Single Line Text | No | New plan key |
| effective_date | Date | Yes | Date the change took effect |
| reason | Long Text | No | Customer-provided or internal reason |
| initiated_by | SingleSelect | No | customer \| admin \| system \| churn_prevention |

**configData.js:** `subscriptionChanges: { airtable: 'v2_Subscription Changes', wix: 'SubscriptionChanges' }`

---

### B2B

---

### b2bMatchSignals → ⚠️ ALREADY EXISTS IN configData.js → v2_B2B Match Signals
**Phase:** 3 | **Service:** b2bMatchSignalService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Target carrier DOT number |
| signal_type | SingleSelect | Yes | job_post \| social_mention \| news_event \| hiring_surge \| csas_drop \| expansion |
| signal_source | Single Line Text | No | Origin platform or URL of the signal |
| signal_text | Long Text | No | Raw signal text or excerpt |
| detected_at | DateTime | Yes | Timestamp signal was detected |
| confidence_score | Number | No | Model confidence 0–100 |
| priority | SingleSelect | No | high \| medium \| low |
| actioned | Checkbox | No | True if outreach has been triggered |
| campaign_id | Single Line Text | No | Linked B2B outreach campaign record ID |

**configData.js:** `b2bMatchSignals: { airtable: 'v2_B2B Match Signals', wix: 'B2bMatchSignals' }`

---

### b2bCarrierIntentData → v2_B2B Carrier Intent Data
**Phase:** 3 | **Service:** b2bMatchSignalService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| intent_score | Number | Yes | Composite buying intent score 0–100 |
| score_date | Date | Yes | Date intent score was computed |
| top_signals | Long Text | No | JSON array of top contributing signal keys |
| website_visits | Number | No | Estimated site visits in the scoring window |
| content_downloads | Number | No | Marketing content downloads attributed |
| email_opens | Number | No | Email opens attributed to this carrier |
| crm_stage | SingleSelect | No | awareness \| consideration \| evaluation \| decision |
| owner | Single Line Text | No | Sales rep or account manager assigned |

**configData.js:** `b2bCarrierIntentData: { airtable: 'v2_B2B Carrier Intent Data', wix: 'B2bCarrierIntentData' }`

---

### b2bMarketOpportunities → v2_B2B Market Opportunities
**Phase:** 3 | **Service:** b2bResearchAgentService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| title | Single Line Text | Yes | Short opportunity title |
| opportunity_type | SingleSelect | Yes | new_market \| competitive_gap \| regulatory_shift \| partnership \| acquisition |
| description | Long Text | Yes | Detailed opportunity description |
| estimated_tam_usd | Number | No | Estimated total addressable market in USD |
| priority | SingleSelect | No | high \| medium \| low |
| identified_date | Date | Yes | Date the opportunity was identified |
| owner | Single Line Text | No | Assigned analyst or sales lead |
| status | SingleSelect | Yes | new \| investigating \| active \| closed |
| source_url | URL | No | Source article or report URL |

**configData.js:** `b2bMarketOpportunities: { airtable: 'v2_B2B Market Opportunities', wix: 'B2bMarketOpportunities' }`

---

### b2bOutreachCampaigns → v2_B2B Outreach Campaigns
**Phase:** 3 | **Service:** b2bActivityService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| campaign_name | Single Line Text | Yes | Campaign display name |
| channel | SingleSelect | Yes | email \| linkedin \| phone \| direct_mail \| event |
| target_segment | Single Line Text | No | Description of target carrier segment |
| status | SingleSelect | Yes | draft \| active \| paused \| complete |
| start_date | Date | No | Campaign start date |
| end_date | Date | No | Campaign end date |
| contacts_count | Number | No | Total carriers in the campaign |
| open_rate_pct | Number | No | Email open rate percentage |
| reply_rate_pct | Number | No | Reply or response rate percentage |
| meetings_booked | Number | No | Discovery calls or demos booked from campaign |

**configData.js:** `b2bOutreachCampaigns: { airtable: 'v2_B2B Outreach Campaigns', wix: 'B2bOutreachCampaigns' }`

---

### b2bEvents → v2_B2B Events
**Phase:** 3 | **Service:** b2bActivityService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| event_name | Single Line Text | Yes | Name of the industry event or conference |
| event_type | SingleSelect | Yes | conference \| tradeshow \| webinar \| roundtable \| demo_day |
| location | Single Line Text | No | City, State or "Virtual" |
| start_date | Date | Yes | Event start date |
| end_date | Date | No | Event end date |
| registration_url | URL | No | Link to registration page |
| attending | Checkbox | No | True if LMDR is attending or sponsoring |
| expected_leads | Number | No | Projected new carrier leads from event |
| actual_leads | Number | No | Actual carrier leads generated |
| notes | Long Text | No | Talking points, prep notes, or debrief |

**configData.js:** `b2bEvents: { airtable: 'v2_B2B Events', wix: 'B2bEvents' }`

---

### b2bEventRegistrations → v2_B2B Event Registrations
**Phase:** 3 | **Service:** b2bActivityService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| event_id | Single Line Text | Yes | B2B Events record ID |
| carrier_dot | Number | No | Carrier DOT if existing carrier |
| contact_name | Single Line Text | Yes | Registrant full name |
| contact_email | Single Line Text | Yes | Registrant email address |
| company_name | Single Line Text | No | Company or carrier name |
| registered_at | DateTime | Yes | Registration timestamp |
| attended | Checkbox | No | True if registrant confirmed attendance |
| follow_up_sent | Checkbox | No | True if post-event follow-up was dispatched |
| notes | Long Text | No | Qualification notes from conversation |

**configData.js:** `b2bEventRegistrations: { airtable: 'v2_B2B Event Registrations', wix: 'B2bEventRegistrations' }`

---

### b2bResearchBriefs → v2_B2B Research Briefs
**Phase:** 3 | **Service:** b2bResearchAgentService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | No | Subject carrier DOT if carrier-specific |
| title | Single Line Text | Yes | Research brief title |
| brief_type | SingleSelect | Yes | carrier_profile \| market_analysis \| competitive \| regulatory |
| summary | Long Text | Yes | Executive summary paragraph |
| full_content | Long Text | No | Full research content |
| generated_at | DateTime | Yes | Timestamp brief was AI-generated |
| reviewed | Checkbox | No | True if a human analyst has reviewed the brief |
| source_urls | Long Text | No | Newline-delimited source URLs |

**configData.js:** `b2bResearchBriefs: { airtable: 'v2_B2B Research Briefs', wix: 'B2bResearchBriefs' }`

---

### b2bRevenueAttribution → v2_B2B Revenue Attribution
**Phase:** 3 | **Service:** b2bActivityService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| subscription_id | Single Line Text | No | Carrier Subscriptions record ID |
| attribution_source | SingleSelect | Yes | outreach \| event \| referral \| inbound \| organic \| partnership |
| campaign_id | Single Line Text | No | B2B Outreach Campaigns record ID |
| event_id | Single Line Text | No | B2B Events record ID if event-sourced |
| attributed_mrr_usd | Number | Yes | MRR attributed to this source |
| close_date | Date | Yes | Date the carrier converted |
| attribution_model | SingleSelect | No | first_touch \| last_touch \| linear |

**configData.js:** `b2bRevenueAttribution: { airtable: 'v2_B2B Revenue Attribution', wix: 'B2bRevenueAttribution' }`

---

### b2bKpiSnapshots → v2_B2B KPI Snapshots
**Phase:** 3 | **Service:** b2bActivityService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| snapshot_month | Single Line Text | Yes | ISO month string (e.g. 2026-02) |
| new_carriers_signed | Number | No | New carrier subscribers this month |
| pipeline_value_usd | Number | No | Total pipeline value in USD |
| closed_won_usd | Number | No | Revenue closed and won this month |
| closed_lost_count | Number | No | Deals lost this month |
| outreach_sent | Number | No | Total outreach touchpoints sent |
| meetings_held | Number | No | Discovery calls or demos held |
| conversion_rate_pct | Number | No | Pipeline-to-close conversion percentage |
| generated_at | DateTime | Yes | Timestamp the snapshot was computed |

**configData.js:** `b2bKpiSnapshots: { airtable: 'v2_B2B KPI Snapshots', wix: 'B2bKpiSnapshots' }`

---

### b2bForecasts → v2_B2B Forecasts
**Phase:** 3 | **Service:** b2bActivityService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| forecast_month | Single Line Text | Yes | Target ISO month (e.g. 2026-03) |
| projected_new_carriers | Number | No | Predicted new carrier sign-ups |
| projected_mrr_usd | Number | No | Projected MRR from new business |
| pipeline_coverage_ratio | Number | No | Pipeline value / target ratio |
| confidence_pct | Number | No | Forecast confidence percentage |
| assumptions | Long Text | No | Key assumptions behind the forecast |
| generated_at | DateTime | Yes | Timestamp forecast was generated |
| reviewed_by | Single Line Text | No | Sales leader who reviewed the forecast |

**configData.js:** `b2bForecasts: { airtable: 'v2_B2B Forecasts', wix: 'B2bForecasts' }`

---

---

## PHASE 4: ADMIN + PLATFORM

---

### BUSINESS OPS

---

### revenueSnapshots → v2_Revenue Snapshots
**Phase:** 4 | **Service:** adminBusinessService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| snapshot_month | Single Line Text | Yes | ISO month string (e.g. 2026-02) |
| mrr_usd | Number | Yes | Monthly recurring revenue in USD |
| arr_usd | Number | No | Annualized recurring revenue |
| new_mrr_usd | Number | No | MRR from new subscribers this month |
| expansion_mrr_usd | Number | No | MRR from upgrades |
| churn_mrr_usd | Number | No | MRR lost to cancellations |
| contraction_mrr_usd | Number | No | MRR lost to downgrades |
| active_subscriptions | Number | No | Total active paying subscribers |
| churn_rate_pct | Number | No | Churn rate as a percentage |
| generated_at | DateTime | Yes | Timestamp snapshot was computed |

**configData.js:** `revenueSnapshots: { airtable: 'v2_Revenue Snapshots', wix: 'RevenueSnapshots' }`

---

### invoices → ⚠️ ALREADY EXISTS IN configData.js → v2_Invoices
**Phase:** 4 | **Service:** adminBusinessService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Billed carrier DOT number |
| stripe_invoice_id | Single Line Text | No | Stripe Invoice object ID |
| invoice_number | Single Line Text | Yes | Human-readable invoice number |
| amount_due_usd | Number | Yes | Total amount due in USD |
| amount_paid_usd | Number | No | Amount paid |
| status | SingleSelect | Yes | draft \| open \| paid \| void \| uncollectible |
| due_date | Date | No | Payment due date |
| paid_date | Date | No | Date payment was received |
| invoice_url | URL | No | Hosted Stripe invoice PDF link |
| line_items | Long Text | No | JSON array of line item descriptions and amounts |

**configData.js:** `invoices: { airtable: 'v2_Invoices', wix: 'Invoices' }`

---

### commissionRules → ⚠️ ALREADY EXISTS IN configData.js → v2_Commission Rules
**Phase:** 4 | **Service:** adminBusinessService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| rule_name | Single Line Text | Yes | Human-readable rule name |
| role | SingleSelect | Yes | recruiter \| account_manager \| affiliate |
| trigger_event | SingleSelect | Yes | new_subscription \| renewal \| upgrade \| placement |
| commission_type | SingleSelect | Yes | flat \| percentage \| tiered |
| commission_value | Number | Yes | Flat USD amount or percentage rate |
| applies_to_plan | SingleSelect | No | pro \| enterprise \| all |
| active | Checkbox | Yes | True if rule is currently in effect |
| effective_date | Date | Yes | Date the rule became effective |
| notes | Long Text | No | Description or exceptions for the rule |

**configData.js:** `commissionRules: { airtable: 'v2_Commission Rules', wix: 'CommissionRules' }`

---

### commissionPayouts → v2_Commission Payouts
**Phase:** 4 | **Service:** adminBusinessService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| payee_id | Single Line Text | Yes | User ID of the commission recipient |
| rule_id | Single Line Text | Yes | Commission Rules record ID |
| trigger_event | Single Line Text | Yes | Description of the triggering event |
| carrier_dot | Number | No | Carrier involved in the triggering event |
| amount_usd | Number | Yes | Commission payout amount in USD |
| status | SingleSelect | Yes | pending \| approved \| paid \| rejected |
| period_month | Single Line Text | Yes | ISO month the commission was earned |
| paid_date | Date | No | Date payout was disbursed |
| payment_ref | Single Line Text | No | ACH or payment reference number |

**configData.js:** `commissionPayouts: { airtable: 'v2_Commission Payouts', wix: 'CommissionPayouts' }`

---

### billingAlerts → v2_Billing Alerts
**Phase:** 4 | **Service:** adminBusinessService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| alert_type | SingleSelect | Yes | payment_failed \| card_expiring \| past_due \| churn_risk \| invoice_overdue |
| severity | SingleSelect | Yes | critical \| warning \| info |
| message | Long Text | Yes | Alert description with action instructions |
| created_at | DateTime | Yes | Timestamp the alert was created |
| resolved | Checkbox | No | True once billing issue is resolved |
| resolved_at | DateTime | No | Timestamp the issue was resolved |
| stripe_event_id | Single Line Text | No | Stripe webhook event ID that triggered the alert |

**configData.js:** `billingAlerts: { airtable: 'v2_Billing Alerts', wix: 'BillingAlerts' }`

---

### PLATFORM CONFIG

---

### featureFlags → ⚠️ ALREADY EXISTS IN configData.js → v2_Feature Flags
**Phase:** 4 | **Service:** platformConfigService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| flag_key | Single Line Text | Yes | Machine key (e.g. agent_chat_v2) |
| display_name | Single Line Text | Yes | Human-readable feature name |
| enabled_globally | Checkbox | No | True if enabled for all users |
| enabled_roles | MultiSelect | No | driver \| recruiter \| carrier \| admin \| b2b |
| enabled_carrier_dots | Long Text | No | Comma-separated DOT numbers for allowlist |
| rollout_pct | Number | No | Percentage of users in rollout (0–100) |
| description | Long Text | No | What this flag controls |
| last_updated_at | DateTime | No | Timestamp of last change |
| updated_by | Single Line Text | No | Admin who last modified the flag |

**configData.js:** `featureFlags: { airtable: 'v2_Feature Flags', wix: 'FeatureFlags' }`

---

### abTests → ⚠️ ALREADY EXISTS IN configData.js → v2_AB Tests
**Phase:** 4 | **Service:** platformConfigService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| test_key | Single Line Text | Yes | Machine key for the experiment |
| test_name | Single Line Text | Yes | Human-readable experiment name |
| hypothesis | Long Text | No | What this test is trying to validate |
| primary_metric | Single Line Text | No | Key metric being measured (e.g. conversion_rate) |
| status | SingleSelect | Yes | draft \| running \| paused \| complete |
| start_date | Date | No | Experiment start date |
| end_date | Date | No | Experiment end date |
| target_roles | MultiSelect | No | driver \| recruiter \| carrier \| admin |
| winning_variant | Single Line Text | No | Key of the winning variant after analysis |
| notes | Long Text | No | Conclusions or follow-on actions |

**configData.js:** `abTests: { airtable: 'v2_AB Tests', wix: 'AbTests' }`

---

### abTestVariants → v2_AB Test Variants
**Phase:** 4 | **Service:** platformConfigService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| test_id | Single Line Text | Yes | AB Tests record ID |
| variant_key | Single Line Text | Yes | Machine key (e.g. control \| variant_a) |
| variant_name | Single Line Text | Yes | Human display name |
| traffic_pct | Number | Yes | Percentage of traffic routed to this variant |
| config_json | Long Text | No | JSON blob of variant-specific config overrides |
| impressions | Number | No | Number of users exposed |
| conversions | Number | No | Number of goal conversions |
| conversion_rate_pct | Number | No | Computed conversion rate |
| is_control | Checkbox | No | True if this is the control variant |

**configData.js:** `abTestVariants: { airtable: 'v2_AB Test Variants', wix: 'AbTestVariants' }`

---

### notificationRuleDefinitions → v2_Notification Rule Definitions
**Phase:** 4 | **Service:** notificationService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| rule_key | Single Line Text | Yes | Machine key (e.g. license_expiry_30d) |
| display_name | Single Line Text | Yes | Human label shown in admin UI |
| trigger_event | Single Line Text | Yes | System event key that fires this rule |
| channels | MultiSelect | Yes | email \| sms \| in_app \| push |
| target_roles | MultiSelect | Yes | driver \| recruiter \| carrier \| admin |
| template_key | Single Line Text | No | Email/SMS template identifier |
| active | Checkbox | Yes | True if rule is enabled |
| delay_minutes | Number | No | Delay in minutes after trigger before sending |
| description | Long Text | No | Plain-language description of when and why this fires |

**configData.js:** `notificationRuleDefinitions: { airtable: 'v2_Notification Rule Definitions', wix: 'NotificationRuleDefinitions' }`

---

### notificationDeliveryLog → v2_Notification Delivery Log
**Phase:** 4 | **Service:** notificationService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| rule_id | Single Line Text | Yes | Notification Rule Definitions record ID |
| recipient_id | Single Line Text | Yes | Wix member ID of recipient |
| channel | SingleSelect | Yes | email \| sms \| in_app \| push |
| status | SingleSelect | Yes | sent \| delivered \| failed \| bounced \| opened |
| sent_at | DateTime | Yes | Timestamp message was dispatched |
| delivered_at | DateTime | No | Timestamp delivery was confirmed |
| opened_at | DateTime | No | Timestamp the notification was opened |
| failure_reason | Single Line Text | No | Provider error code or description if failed |
| message_preview | Single Line Text | No | First 100 characters of the message content |

**configData.js:** `notificationDeliveryLog: { airtable: 'v2_Notification Delivery Log', wix: 'NotificationDeliveryLog' }`

---

### ADMIN PORTAL

---

### adminDashboardConfig → v2_Admin Dashboard Config
**Phase:** 4 | **Service:** adminService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| admin_user_id | Single Line Text | Yes | Wix member ID of the admin user |
| widget_layout | Long Text | No | JSON array of widget keys and grid positions |
| default_view | SingleSelect | No | overview \| drivers \| carriers \| revenue \| compliance |
| pinned_filters | Long Text | No | JSON of persisted filter state per view |
| alerts_collapsed | Checkbox | No | True if the alert rail is collapsed |
| timezone | Single Line Text | No | IANA timezone for date displays |
| updated_at | DateTime | No | Timestamp config was last saved |

**configData.js:** `adminDashboardConfig: { airtable: 'v2_Admin Dashboard Config', wix: 'AdminDashboardConfig' }`

---

### moderationQueue → v2_Moderation Queue
**Phase:** 4 | **Service:** moderationService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| content_type | SingleSelect | Yes | review \| tip \| profile \| comment \| image |
| content_id | Single Line Text | Yes | Record ID of the content to review |
| submitter_id | Single Line Text | No | Wix member ID who submitted the content |
| status | SingleSelect | Yes | pending \| approved \| rejected \| escalated |
| priority | SingleSelect | No | high \| normal \| low |
| flagged_reason | SingleSelect | No | spam \| inappropriate \| inaccurate \| duplicate \| other |
| auto_score | Number | No | AI toxicity or spam score 0–100 |
| submitted_at | DateTime | Yes | Timestamp content entered the queue |
| assigned_to | Single Line Text | No | Moderator assigned to review |

**configData.js:** `moderationQueue: { airtable: 'v2_Moderation Queue', wix: 'ModerationQueue' }`

---

### moderationActions → v2_Moderation Actions
**Phase:** 4 | **Service:** moderationService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| queue_item_id | Single Line Text | Yes | Moderation Queue record ID |
| action | SingleSelect | Yes | approve \| reject \| edit \| escalate \| ban_user |
| moderator_id | Single Line Text | Yes | Admin user ID who took action |
| action_at | DateTime | Yes | Timestamp action was taken |
| reason | Long Text | No | Moderator notes or rejection reason |
| user_notified | Checkbox | No | True if submitter was notified of the decision |
| appeal_allowed | Checkbox | No | True if the decision can be appealed |

**configData.js:** `moderationActions: { airtable: 'v2_Moderation Actions', wix: 'ModerationActions' }`

---

### aiDashboardMetrics → v2_AI Dashboard Metrics
**Phase:** 4 | **Service:** aiRouterService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| snapshot_date | Date | Yes | Date of the metrics snapshot |
| provider | SingleSelect | Yes | anthropic \| openai \| google \| groq |
| model | Single Line Text | Yes | Model identifier (e.g. claude-sonnet-4-6) |
| total_requests | Number | No | Total API calls in the period |
| total_tokens | Number | No | Total tokens consumed (input + output) |
| total_cost_usd | Number | No | Total spend in USD |
| avg_latency_ms | Number | No | Average response latency in milliseconds |
| error_rate_pct | Number | No | Error rate as a percentage |
| quality_score | Number | No | Computed quality score 0–100 |

**configData.js:** `aiDashboardMetrics: { airtable: 'v2_AI Dashboard Metrics', wix: 'AiDashboardMetrics' }`

---

### complianceScores → v2_Compliance Scores
**Phase:** 4 | **Service:** adminAuditService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Number | Yes | Carrier DOT number |
| score_date | Date | Yes | Date score was computed |
| overall_score | Number | Yes | Platform compliance score 0–100 |
| dq_file_completeness_pct | Number | No | DQ file completeness percentage |
| training_completion_pct | Number | No | Driver training module completion rate |
| policy_acknowledgment_pct | Number | No | Policy acknowledgment completion rate |
| open_violations | Number | No | Number of open regulatory violations |
| overdue_items | Number | No | Number of overdue compliance calendar items |
| tier | SingleSelect | No | green \| yellow \| red |

**configData.js:** `complianceScores: { airtable: 'v2_Compliance Scores', wix: 'ComplianceScores' }`

---

### SUPPORT OPS

---

### supportTickets → ⚠️ ALREADY EXISTS IN configData.js → v2_Support Tickets
**Phase:** 4 | **Service:** supportService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| submitter_id | Single Line Text | Yes | Wix member ID of the ticket submitter |
| role | SingleSelect | Yes | driver \| recruiter \| carrier \| admin \| b2b |
| carrier_dot | Number | No | Carrier DOT if carrier-related ticket |
| subject | Single Line Text | Yes | Ticket subject line |
| description | Long Text | Yes | Full issue description |
| category | SingleSelect | Yes | billing \| technical \| compliance \| account \| matching \| other |
| priority | SingleSelect | Yes | urgent \| high \| normal \| low |
| status | SingleSelect | Yes | open \| in_progress \| waiting_on_user \| resolved \| closed |
| assigned_to | Single Line Text | No | Support agent assigned |
| resolved_at | DateTime | No | Timestamp ticket was resolved |

**configData.js:** `supportTickets: { airtable: 'v2_Support Tickets', wix: 'SupportTickets' }`

---

### knowledgeBaseArticles → v2_Knowledge Base Articles
**Phase:** 4 | **Service:** supportService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| title | Single Line Text | Yes | Article title |
| slug | Single Line Text | Yes | URL-safe slug (e.g. how-to-add-driver) |
| category | SingleSelect | Yes | getting_started \| billing \| compliance \| fleet \| matching \| technical |
| audience | MultiSelect | Yes | driver \| recruiter \| carrier \| admin |
| content | Long Text | Yes | Full article content in Markdown |
| published | Checkbox | No | True if article is publicly visible |
| published_at | DateTime | No | Publication timestamp |
| view_count | Number | No | Total article views |
| helpful_votes | Number | No | Count of users who found it helpful |
| last_reviewed | Date | No | Date content was last reviewed for accuracy |

**configData.js:** `knowledgeBaseArticles: { airtable: 'v2_Knowledge Base Articles', wix: 'KnowledgeBaseArticles' }`

---

### chatSessions → ⚠️ ALREADY EXISTS IN configData.js → v2_Chat Sessions
**Phase:** 4 | **Service:** supportService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| user_id | Single Line Text | Yes | Wix member ID |
| role | SingleSelect | Yes | driver \| recruiter \| carrier \| admin |
| channel | SingleSelect | Yes | live_chat \| ai_chat \| email_thread |
| status | SingleSelect | Yes | active \| waiting \| resolved \| abandoned |
| started_at | DateTime | Yes | Session start timestamp |
| ended_at | DateTime | No | Session end timestamp |
| agent_id | Single Line Text | No | Support agent or AI model that handled the session |
| csat_score | Number | No | Customer satisfaction rating 1–5 |
| resolution | Single Line Text | No | Brief description of how the issue was resolved |

**configData.js:** `chatSessions: { airtable: 'v2_Chat Sessions', wix: 'ChatSessions' }`

---

### chatMessages → ⚠️ ALREADY EXISTS IN configData.js → v2_Chat Messages
**Phase:** 4 | **Service:** supportService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| session_id | Single Line Text | Yes | Chat Sessions record ID |
| sender_role | SingleSelect | Yes | user \| agent \| ai |
| sender_id | Single Line Text | No | Wix member ID or agent identifier |
| message_text | Long Text | Yes | Full message content |
| sent_at | DateTime | Yes | Message timestamp |
| flagged | Checkbox | No | True if message was flagged for review |
| attachment_url | URL | No | Link to attached file if any |

**configData.js:** `chatMessages: { airtable: 'v2_Chat Messages', wix: 'ChatMessages' }`

---

### supportSatisfaction → v2_Support Satisfaction
**Phase:** 4 | **Service:** supportService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| ticket_id | Single Line Text | No | Support Tickets record ID if linked |
| session_id | Single Line Text | No | Chat Sessions record ID if linked |
| user_id | Single Line Text | Yes | Wix member ID of the respondent |
| role | SingleSelect | Yes | driver \| recruiter \| carrier \| admin |
| csat_score | Number | Yes | Satisfaction rating 1–5 |
| nps_score | Number | No | Net Promoter Score 0–10 |
| feedback_text | Long Text | No | Open-ended feedback |
| submitted_at | DateTime | Yes | Submission timestamp |
| category_tags | MultiSelect | No | speed \| resolution \| friendliness \| knowledge |

**configData.js:** `supportSatisfaction: { airtable: 'v2_Support Satisfaction', wix: 'SupportSatisfaction' }`

---

### GAMIFICATION ADDITIONS

---

### customLeaderboards → v2_Custom Leaderboards
**Phase:** 4 | **Service:** gamificationService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| leaderboard_key | Single Line Text | Yes | Machine key (e.g. top_milers_monthly) |
| display_name | Single Line Text | Yes | Label shown to users |
| metric | SingleSelect | Yes | miles_driven \| on_time_pct \| safety_score \| xp_earned \| placements |
| scope | SingleSelect | Yes | platform_wide \| carrier \| region |
| carrier_dot | Number | No | Carrier DOT if carrier-scoped |
| period_type | SingleSelect | Yes | weekly \| monthly \| quarterly \| all_time |
| max_entries | Number | No | Number of positions to display (default 10) |
| active | Checkbox | Yes | True if leaderboard is enabled |
| last_computed_at | DateTime | No | Timestamp leaderboard was last refreshed |

**configData.js:** `customLeaderboards: { airtable: 'v2_Custom Leaderboards', wix: 'CustomLeaderboards' }`

---

### streakDefinitions → v2_Streak Definitions
**Phase:** 4 | **Service:** gamificationService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| streak_key | Single Line Text | Yes | Machine key (e.g. daily_login) |
| display_name | Single Line Text | Yes | Label shown to users |
| trigger_event | Single Line Text | Yes | Event key that advances the streak |
| unit | SingleSelect | Yes | day \| week \| month \| delivery \| shift |
| xp_per_increment | Number | No | XP awarded each time the streak increments |
| bonus_xp_milestones | Long Text | No | JSON of milestone streaks and bonus XP amounts |
| roles_eligible | MultiSelect | Yes | driver \| recruiter \| carrier |
| active | Checkbox | Yes | True if streak is enabled |
| reset_on_miss | Checkbox | No | True if streak resets when the unit is missed |

**configData.js:** `streakDefinitions: { airtable: 'v2_Streak Definitions', wix: 'StreakDefinitions' }`

---

### xpTransactions → v2_XP Transactions
**Phase:** 4 | **Service:** gamificationService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| user_id | Single Line Text | Yes | Wix member ID |
| role | SingleSelect | Yes | driver \| recruiter \| carrier |
| transaction_type | SingleSelect | Yes | earn \| spend \| adjustment \| expiry |
| xp_amount | Number | Yes | XP points in this transaction (positive or negative) |
| source_event | Single Line Text | Yes | Event key or admin action that triggered the XP |
| source_id | Single Line Text | No | Record ID of the triggering entity |
| balance_after | Number | No | User XP balance after this transaction |
| created_at | DateTime | Yes | Transaction timestamp |
| notes | Single Line Text | No | Admin note if manually adjusted |

**configData.js:** `xpTransactions: { airtable: 'v2_XP Transactions', wix: 'XpTransactions' }`

---

## configData.js Block — All Phase 3 + 4 Keys

```javascript
// Phase 3: Carrier Fleet
carrierRoster: { airtable: 'v2_Carrier Roster', wix: 'CarrierRoster' },
carrierEquipment: { airtable: 'v2_Carrier Equipment', wix: 'CarrierEquipment' },
maintenanceLogs: { airtable: 'v2_Maintenance Logs', wix: 'MaintenanceLogs' },
safetyScoreHistory: { airtable: 'v2_Safety Score History', wix: 'SafetyScoreHistory' },
capacityForecasts: { airtable: 'v2_Capacity Forecasts', wix: 'CapacityForecasts' },
hiringTargets: { airtable: 'v2_Hiring Targets', wix: 'HiringTargets' },
eldComplianceReports: { airtable: 'v2_ELD Compliance Reports', wix: 'EldComplianceReports' },
performanceScorecards: { airtable: 'v2_Performance Scorecards', wix: 'PerformanceScorecards' },
equipmentUtilization: { airtable: 'v2_Equipment Utilization', wix: 'EquipmentUtilization' },
fleetAlerts: { airtable: 'v2_Fleet Alerts', wix: 'FleetAlerts' },

// Phase 3: Carrier Compliance
complianceCalendar: { airtable: 'v2_Compliance Calendar', wix: 'ComplianceCalendar' },
carrierDocVault: { airtable: 'v2_Carrier Doc Vault', wix: 'CarrierDocVault' },
dqFileItems: { airtable: 'v2_DQ File Items', wix: 'DqFileItems' },
csaScoreHistory: { airtable: 'v2_CSA Score History', wix: 'CsaScoreHistory' },
incidentReports: { airtable: 'v2_Incident Reports', wix: 'IncidentReports' },
complianceReminders: { airtable: 'v2_Compliance Reminders', wix: 'ComplianceReminders' },
violationTracking: { airtable: 'v2_Violation Tracking', wix: 'ViolationTracking' },
auditSchedule: { airtable: 'v2_Audit Schedule', wix: 'AuditSchedule' },
regulatoryUpdates: { airtable: 'v2_Regulatory Updates', wix: 'RegulatoryUpdates' },
complianceCertifications: { airtable: 'v2_Compliance Certifications', wix: 'ComplianceCertifications' },

// Phase 3: Carrier Communication
carrierAnnouncements: { airtable: 'v2_Carrier Announcements', wix: 'CarrierAnnouncements' },
carrierPolicies: { airtable: 'v2_Carrier Policies', wix: 'CarrierPolicies' },
policyAcknowledgments: { airtable: 'v2_Policy Acknowledgments', wix: 'PolicyAcknowledgments' },
driverRecognitions: { airtable: 'v2_Driver Recognitions', wix: 'DriverRecognitions' },
carrierFeedbackSurveys: { airtable: 'v2_Carrier Feedback Surveys', wix: 'CarrierFeedbackSurveys' },

// Phase 3: Carrier Journey
carrierOnboardingProgress: { airtable: 'v2_Carrier Onboarding Progress', wix: 'CarrierOnboardingProgress' },
carrierBranding: { airtable: 'v2_Carrier Branding', wix: 'CarrierBranding' },
carrierQuickActions: { airtable: 'v2_Carrier Quick Actions', wix: 'CarrierQuickActions' },
featureTourProgress: { airtable: 'v2_Feature Tour Progress', wix: 'FeatureTourProgress' },
carrierDashboardConfig: { airtable: 'v2_Carrier Dashboard Config', wix: 'CarrierDashboardConfig' },

// Phase 3: Carrier Conversion
carrierSubscriptions: { airtable: 'v2_Carrier Subscriptions', wix: 'CarrierSubscriptions' },
carrierPayments: { airtable: 'v2_Carrier Payments', wix: 'CarrierPayments' },
carrierDeposits: { airtable: 'v2_Carrier Deposits', wix: 'CarrierDeposits' },
pricingPlans: { airtable: 'v2_Pricing Plans', wix: 'PricingPlans' },
subscriptionChanges: { airtable: 'v2_Subscription Changes', wix: 'SubscriptionChanges' },

// Phase 3: B2B
b2bMatchSignals: { airtable: 'v2_B2B Match Signals', wix: 'B2bMatchSignals' },
b2bCarrierIntentData: { airtable: 'v2_B2B Carrier Intent Data', wix: 'B2bCarrierIntentData' },
b2bMarketOpportunities: { airtable: 'v2_B2B Market Opportunities', wix: 'B2bMarketOpportunities' },
b2bOutreachCampaigns: { airtable: 'v2_B2B Outreach Campaigns', wix: 'B2bOutreachCampaigns' },
b2bEvents: { airtable: 'v2_B2B Events', wix: 'B2bEvents' },
b2bEventRegistrations: { airtable: 'v2_B2B Event Registrations', wix: 'B2bEventRegistrations' },
b2bResearchBriefs: { airtable: 'v2_B2B Research Briefs', wix: 'B2bResearchBriefs' },
b2bRevenueAttribution: { airtable: 'v2_B2B Revenue Attribution', wix: 'B2bRevenueAttribution' },
b2bKpiSnapshots: { airtable: 'v2_B2B KPI Snapshots', wix: 'B2bKpiSnapshots' },
b2bForecasts: { airtable: 'v2_B2B Forecasts', wix: 'B2bForecasts' },

// Phase 4: Business Ops
revenueSnapshots: { airtable: 'v2_Revenue Snapshots', wix: 'RevenueSnapshots' },
invoices: { airtable: 'v2_Invoices', wix: 'Invoices' },
commissionRules: { airtable: 'v2_Commission Rules', wix: 'CommissionRules' },
commissionPayouts: { airtable: 'v2_Commission Payouts', wix: 'CommissionPayouts' },
billingAlerts: { airtable: 'v2_Billing Alerts', wix: 'BillingAlerts' },

// Phase 4: Platform Config
featureFlags: { airtable: 'v2_Feature Flags', wix: 'FeatureFlags' },
abTests: { airtable: 'v2_AB Tests', wix: 'AbTests' },
abTestVariants: { airtable: 'v2_AB Test Variants', wix: 'AbTestVariants' },
notificationRuleDefinitions: { airtable: 'v2_Notification Rule Definitions', wix: 'NotificationRuleDefinitions' },
notificationDeliveryLog: { airtable: 'v2_Notification Delivery Log', wix: 'NotificationDeliveryLog' },

// Phase 4: Admin Portal
adminDashboardConfig: { airtable: 'v2_Admin Dashboard Config', wix: 'AdminDashboardConfig' },
moderationQueue: { airtable: 'v2_Moderation Queue', wix: 'ModerationQueue' },
moderationActions: { airtable: 'v2_Moderation Actions', wix: 'ModerationActions' },
aiDashboardMetrics: { airtable: 'v2_AI Dashboard Metrics', wix: 'AiDashboardMetrics' },
complianceScores: { airtable: 'v2_Compliance Scores', wix: 'ComplianceScores' },

// Phase 4: Support Ops
supportTickets: { airtable: 'v2_Support Tickets', wix: 'SupportTickets' },
knowledgeBaseArticles: { airtable: 'v2_Knowledge Base Articles', wix: 'KnowledgeBaseArticles' },
chatSessions: { airtable: 'v2_Chat Sessions', wix: 'ChatSessions' },
chatMessages: { airtable: 'v2_Chat Messages', wix: 'ChatMessages' },
supportSatisfaction: { airtable: 'v2_Support Satisfaction', wix: 'SupportSatisfaction' },

// Phase 4: Gamification Additions
customLeaderboards: { airtable: 'v2_Custom Leaderboards', wix: 'CustomLeaderboards' },
streakDefinitions: { airtable: 'v2_Streak Definitions', wix: 'StreakDefinitions' },
xpTransactions: { airtable: 'v2_XP Transactions', wix: 'XpTransactions' },
```

---

*Total: 45 Phase 3 collections + 23 Phase 4 collections = 68 collections*
*All route to Airtable base `app9N1YCJ3gdhExA0` via `dataAccess.jsw`*
