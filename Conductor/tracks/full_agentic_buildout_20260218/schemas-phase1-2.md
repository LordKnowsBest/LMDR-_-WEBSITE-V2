# LMDR / VelocityMatch — Airtable Collection Schemas
## Phase 1 (Driver) & Phase 2 (Recruiter)

**Platform:** Wix Velo + Airtable
**Base ID:** `app9N1YCJ3gdhExA0`
**Table prefix:** `v2_`
**Config keys:** camelCase
**Date:** 2026-02-18

---

## Phase 1 — Driver Collections

---

### driverSavedJobs → v2_Driver Saved Jobs
**Phase:** 1 | **Service:** driverJobsService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| job_id | Single Line Text | Yes | ID of the saved job posting |
| saved_at | DateTime | Yes | Timestamp when job was saved |
| notes | Long Text | No | Driver's personal notes about this job |
| status | SingleSelect | Yes | Options: active, applied, dismissed |

**configData.js:** `driverSavedJobs: { airtable: 'v2_Driver Saved Jobs', wix: 'DriverSavedJobs' }`

---

### driverApplications → ⚠️ ALREADY EXISTS IN configData.js → v2_Driver Applications
**Phase:** 1 | **Service:** driverApplicationsService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the applicant |
| carrier_dot | Single Line Text | Yes | FMCSA DOT number of carrier |
| job_id | Single Line Text | No | Associated job posting ID |
| status | SingleSelect | Yes | Options: submitted, reviewing, interviewing, offered, hired, rejected, withdrawn |
| applied_at | DateTime | Yes | Timestamp of application submission |
| withdrawn_at | DateTime | No | Timestamp of withdrawal if applicable |
| withdraw_reason | Long Text | No | Driver-supplied reason for withdrawal |

**configData.js:** `driverApplications: { airtable: 'v2_Driver Applications', wix: 'DriverApplications' }`

---

### driverMessages → v2_Driver Messages
**Phase:** 1 | **Service:** messagingService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| conversation_id | Single Line Text | Yes | Parent conversation record ID |
| sender_id | Single Line Text | Yes | Wix member ID of sender |
| receiver_id | Single Line Text | Yes | Wix member ID of receiver |
| content | Long Text | Yes | Message body text |
| read_at | DateTime | No | Timestamp when message was read |
| message_type | SingleSelect | Yes | Options: text, system, template, attachment |
| created_at | DateTime | Yes | Timestamp of message creation |

**configData.js:** `driverMessages: { airtable: 'v2_Driver Messages', wix: 'DriverMessages' }`

---

### driverConversations → v2_Driver Conversations
**Phase:** 1 | **Service:** messagingService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver participant |
| carrier_dot | Single Line Text | Yes | FMCSA DOT number of carrier participant |
| recruiter_id | Single Line Text | No | Wix member ID of recruiter participant |
| last_message_at | DateTime | No | Timestamp of most recent message |
| unread_count | Number | No | Count of unread messages for driver |
| status | SingleSelect | Yes | Options: active, archived, muted |

**configData.js:** `driverConversations: { airtable: 'v2_Driver Conversations', wix: 'DriverConversations' }`

---

### driverActivityFeed → v2_Driver Activity Feed
**Phase:** 1 | **Service:** driverActivityService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| activity_type | SingleSelect | Yes | Options: match, application, message, achievement, alert, system |
| title | Single Line Text | Yes | Short headline for the activity item |
| description | Long Text | No | Extended detail for the activity item |
| timestamp | DateTime | Yes | When the activity occurred |
| read | Checkbox | No | Whether driver has seen this item |
| action_url | URL | No | Deep link to relevant page or resource |

**configData.js:** `driverActivityFeed: { airtable: 'v2_Driver Activity Feed', wix: 'DriverActivityFeed' }`

---

### parkingLocations → ⚠️ ALREADY EXISTS IN configData.js → v2_Parking Locations
**Phase:** 1 | **Service:** parkingService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| name | Single Line Text | Yes | Name of parking facility |
| lat | Number | Yes | Latitude coordinate |
| lng | Number | Yes | Longitude coordinate |
| type | SingleSelect | Yes | Options: truckstop, rest_area, private_lot, weigh_station_adjacent |
| spaces_total | Number | No | Total truck parking spaces |
| spaces_available | Number | No | Last-reported available spaces |
| amenities | MultiSelect | No | Options: showers, fuel, scales, wifi, restaurant, laundry, repair |
| last_reported | DateTime | No | When availability was last confirmed |

**configData.js:** `parkingLocations: { airtable: 'v2_Parking Locations', wix: 'ParkingLocations' }`

---

### parkingFavorites → v2_Parking Favorites
**Phase:** 1 | **Service:** parkingService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| location_id | Single Line Text | Yes | Airtable record ID of parking location |
| saved_at | DateTime | Yes | When driver favorited this location |
| notes | Long Text | No | Driver's personal notes on the location |

**configData.js:** `parkingFavorites: { airtable: 'v2_Parking Favorites', wix: 'ParkingFavorites' }`

---

### fuelPrices → ⚠️ ALREADY EXISTS IN configData.js → v2_Fuel Prices
**Phase:** 1 | **Service:** fuelService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| station_id | Single Line Text | Yes | External station identifier |
| name | Single Line Text | Yes | Station or brand name |
| lat | Number | Yes | Latitude coordinate |
| lng | Number | Yes | Longitude coordinate |
| diesel_price | Number | Yes | Current diesel price per gallon (USD) |
| updated_at | DateTime | Yes | When price was last verified |
| brand | Single Line Text | No | Fuel brand (Pilot, Love's, TA, etc.) |
| address | Single Line Text | No | Street address of station |

**configData.js:** `fuelPrices: { airtable: 'v2_Fuel Prices', wix: 'FuelPrices' }`

---

### weighStationStatus → v2_Weigh Station Status
**Phase:** 1 | **Service:** fuelService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| station_id | Single Line Text | Yes | External weigh station identifier |
| name | Single Line Text | Yes | Station name |
| state | Single Line Text | Yes | Two-letter state abbreviation |
| lat | Number | Yes | Latitude coordinate |
| lng | Number | Yes | Longitude coordinate |
| status | SingleSelect | Yes | Options: open, closed, closed_primary, unknown |
| last_updated | DateTime | Yes | When status was last confirmed |
| direction | SingleSelect | No | Options: northbound, southbound, eastbound, westbound, both |

**configData.js:** `weighStationStatus: { airtable: 'v2_Weigh Station Status', wix: 'WeighStationStatus' }`

---

### restStopReviews → v2_Rest Stop Reviews
**Phase:** 1 | **Service:** parkingService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| stop_id | Single Line Text | Yes | Airtable record ID of the rest stop / parking location |
| driver_id | Single Line Text | Yes | Wix member ID of reviewer |
| rating | Number | Yes | Overall rating 1–5 |
| cleanliness | Number | No | Cleanliness sub-rating 1–5 |
| safety | Number | No | Safety sub-rating 1–5 |
| comment | Long Text | No | Free-form review text |
| created_at | DateTime | Yes | When review was submitted |

**configData.js:** `restStopReviews: { airtable: 'v2_Rest Stop Reviews', wix: 'RestStopReviews' }`

---

### roadHazardReports → v2_Road Hazard Reports
**Phase:** 1 | **Service:** roadHazardService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| reporter_id | Single Line Text | Yes | Wix member ID of reporting driver |
| lat | Number | Yes | Latitude of hazard location |
| lng | Number | Yes | Longitude of hazard location |
| hazard_type | SingleSelect | Yes | Options: debris, pothole, construction, ice, flooding, accident, bridge_restriction, other |
| severity | SingleSelect | Yes | Options: low, medium, high, critical |
| description | Long Text | No | Description of the hazard |
| status | SingleSelect | No | Options: active, resolved, unverified |
| reported_at | DateTime | Yes | When report was submitted |

**configData.js:** `roadHazardReports: { airtable: 'v2_Road Hazard Reports', wix: 'RoadHazardReports' }`

---

### weatherAlertSubs → v2_Weather Alert Subscriptions
**Phase:** 1 | **Service:** weatherAlertService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of subscriber |
| route_id | Single Line Text | No | Associated saved route ID |
| alert_types | MultiSelect | Yes | Options: ice, snow, wind, flood, tornado, hurricane, fog, extreme_heat |
| active | Checkbox | Yes | Whether subscription is currently enabled |
| created_at | DateTime | No | When subscription was created |

**configData.js:** `weatherAlertSubs: { airtable: 'v2_Weather Alert Subscriptions', wix: 'WeatherAlertSubs' }`

---

### forumPosts → ⚠️ ALREADY EXISTS IN configData.js → v2_Forum Posts
**Phase:** 1 | **Service:** forumService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| author_id | Single Line Text | Yes | Wix member ID of post author |
| category | Single Line Text | Yes | Forum category slug |
| title | Single Line Text | Yes | Post title / subject |
| content | Long Text | Yes | Full post body |
| likes_count | Number | No | Cumulative like count |
| replies_count | Number | No | Cumulative reply count |
| pinned | Checkbox | No | Whether post is pinned by moderator |
| status | SingleSelect | Yes | Options: published, pending, removed, locked |
| created_at | DateTime | Yes | When post was submitted |

**configData.js:** `forumPosts: { airtable: 'v2_Forum Posts', wix: 'ForumPosts' }`

---

### forumReplies → v2_Forum Replies
**Phase:** 1 | **Service:** forumService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| post_id | Single Line Text | Yes | Airtable record ID of parent post |
| author_id | Single Line Text | Yes | Wix member ID of reply author |
| content | Long Text | Yes | Reply body text |
| likes_count | Number | No | Cumulative like count |
| status | SingleSelect | Yes | Options: published, pending, removed |
| created_at | DateTime | Yes | When reply was submitted |
| edited_at | DateTime | No | When reply was last edited |

**configData.js:** `forumReplies: { airtable: 'v2_Forum Replies', wix: 'ForumReplies' }`

---

### mentorshipConnections → v2_Mentorship Connections
**Phase:** 1 | **Service:** mentorService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| mentor_id | Single Line Text | Yes | Wix member ID of the mentor driver |
| mentee_id | Single Line Text | Yes | Wix member ID of the mentee driver |
| status | SingleSelect | Yes | Options: pending, active, paused, completed, declined |
| started_at | DateTime | No | When connection became active |
| rating | Number | No | Mentee rating of mentor (1–5) at conclusion |
| specialty | Single Line Text | No | Mentoring focus area (e.g., tanker, HazMat, OTR) |

**configData.js:** `mentorshipConnections: { airtable: 'v2_Mentorship Connections', wix: 'MentorshipConnections' }`

---

### mentorProfiles → v2_Mentor Profiles
**Phase:** 1 | **Service:** mentorService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the mentor |
| specialties | MultiSelect | No | Options: flatbed, tanker, hazmat, reefer, otr, local, team_driving, new_driver |
| years_experience | Number | Yes | Total years of CDL experience |
| bio | Long Text | No | Mentor's self-written bio |
| rating_avg | Number | No | Average rating from mentees (1–5) |
| active | Checkbox | Yes | Whether mentor is accepting new mentees |
| total_mentees | Number | No | Lifetime count of mentees served |

**configData.js:** `mentorProfiles: { airtable: 'v2_Mentor Profiles', wix: 'MentorProfiles' }`

---

### petFriendlyLocations → ⚠️ ALREADY EXISTS IN configData.js → v2_Pet Friendly Locations
**Phase:** 1 | **Service:** petFriendlyService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| name | Single Line Text | Yes | Name of the location |
| address | Single Line Text | No | Street address |
| lat | Number | Yes | Latitude coordinate |
| lng | Number | Yes | Longitude coordinate |
| location_type | SingleSelect | Yes | Options: truckstop, rest_area, park, vet_clinic, pet_store, hotel, campground |
| amenities | MultiSelect | No | Options: dog_park, water_station, relief_area, pet_wash, indoor_allowed, fenced_area |
| rating_avg | Number | No | Average community rating (1–5) |
| submitted_by | Single Line Text | No | Wix member ID of submitter |
| verified | Checkbox | No | Whether location has been staff-verified |

**configData.js:** `petFriendlyLocations: { airtable: 'v2_Pet Friendly Locations', wix: 'PetFriendlyLocations' }`

---

### petLocationReviews → v2_Pet Location Reviews
**Phase:** 1 | **Service:** petFriendlyService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| location_id | Single Line Text | Yes | Airtable record ID of pet friendly location |
| driver_id | Single Line Text | Yes | Wix member ID of reviewer |
| rating | Number | Yes | Rating 1–5 |
| pet_type | SingleSelect | No | Options: dog, cat, other |
| comment | Long Text | No | Review body text |
| created_at | DateTime | Yes | When review was submitted |

**configData.js:** `petLocationReviews: { airtable: 'v2_Pet Location Reviews', wix: 'PetLocationReviews' }`

---

### healthResources → ⚠️ ALREADY EXISTS IN configData.js → v2_Health Resources
**Phase:** 1 | **Service:** healthService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| title | Single Line Text | Yes | Article or resource title |
| category | SingleSelect | Yes | Options: nutrition, fitness, mental_health, sleep, injury_prevention, vision, hearing, diabetes |
| content | Long Text | Yes | Full article or resource content |
| source_url | URL | No | External source link |
| views | Number | No | Total view count |
| helpful_count | Number | No | Number of helpful votes |
| published_at | DateTime | No | When resource was published |

**configData.js:** `healthResources: { airtable: 'v2_Health Resources', wix: 'HealthResources' }`

---

### healthTips → ⚠️ ALREADY EXISTS IN configData.js → v2_Health Tips
**Phase:** 1 | **Service:** healthService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| author_id | Single Line Text | Yes | Wix member ID of driver submitting tip |
| category | SingleSelect | Yes | Options: nutrition, fitness, mental_health, sleep, injury_prevention, other |
| content | Long Text | Yes | Tip content |
| approved | Checkbox | Yes | Whether tip has been moderated and approved |
| helpful_count | Number | No | Community helpfulness vote count |
| created_at | DateTime | Yes | When tip was submitted |

**configData.js:** `healthTips: { airtable: 'v2_Health Tips', wix: 'HealthTips' }`

---

### complianceDocuments → v2_Compliance Documents
**Phase:** 1 | **Service:** complianceService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the document owner |
| doc_type | SingleSelect | Yes | Options: cdl, medical_cert, hazmat, twic, dot_physical, mvr, psp_report, drug_test |
| file_url | URL | Yes | Secure URL to stored document file |
| expiry_date | Date | No | Document expiration date |
| status | SingleSelect | Yes | Options: valid, expiring_soon, expired, pending_review, rejected |
| uploaded_at | DateTime | Yes | When document was uploaded |
| verified_by | Single Line Text | No | Wix member ID of admin who verified |

**configData.js:** `complianceDocuments: { airtable: 'v2_Compliance Documents', wix: 'ComplianceDocuments' }`

---

### hosEntries → v2_HOS Entries
**Phase:** 1 | **Service:** complianceService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| date | Date | Yes | Log date |
| status | SingleSelect | Yes | Options: off_duty, sleeper_berth, driving, on_duty_not_driving |
| start_time | Single Line Text | Yes | Start time in HH:MM format |
| end_time | Single Line Text | No | End time in HH:MM format |
| duration_hours | Number | Yes | Duration of this duty status in hours |
| location | Single Line Text | No | City/state or coordinates at status change |

**configData.js:** `hosEntries: { airtable: 'v2_HOS Entries', wix: 'HosEntries' }`

---

### hosViolations → v2_HOS Violations
**Phase:** 1 | **Service:** complianceService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| violation_type | SingleSelect | Yes | Options: 11_hour, 14_hour, 70_hour, rest_break, form_and_manner |
| date | Date | Yes | Date violation occurred |
| severity | SingleSelect | Yes | Options: warning, minor, major, critical |
| description | Long Text | No | Detail of the violation |
| resolved | Checkbox | Yes | Whether violation has been addressed |

**configData.js:** `hosViolations: { airtable: 'v2_HOS Violations', wix: 'HosViolations' }`

---

### eldSyncLogs → v2_ELD Sync Logs
**Phase:** 1 | **Service:** complianceService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| provider | Single Line Text | Yes | ELD provider name (e.g., KeepTruckin, Samsara) |
| synced_at | DateTime | Yes | When sync was performed |
| records_synced | Number | Yes | Count of HOS records retrieved |
| status | SingleSelect | Yes | Options: success, partial, failed |
| error_message | Long Text | No | Error detail if status is failed |

**configData.js:** `eldSyncLogs: { airtable: 'v2_ELD Sync Logs', wix: 'EldSyncLogs' }`

---

### trainingCourses → v2_Training Courses
**Phase:** 1 | **Service:** trainingService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| title | Single Line Text | Yes | Course title |
| category | SingleSelect | Yes | Options: safety, hazmat, defensive_driving, cargo_securement, compliance, wellness, technology |
| duration_hours | Number | Yes | Estimated completion time in hours |
| required | Checkbox | Yes | Whether course is mandatory for all drivers |
| provider | Single Line Text | No | Training provider or author |
| content_url | URL | No | Link to course content |
| description | Long Text | No | Course summary and learning objectives |

**configData.js:** `trainingCourses: { airtable: 'v2_Training Courses', wix: 'TrainingCourses' }`

---

### trainingProgress → v2_Training Progress
**Phase:** 1 | **Service:** trainingService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| course_id | Single Line Text | Yes | Airtable record ID of the training course |
| status | SingleSelect | Yes | Options: not_started, in_progress, completed, failed |
| started_at | DateTime | No | When driver began the course |
| completed_at | DateTime | No | When driver finished the course |
| score | Number | No | Final assessment score (0–100) |

**configData.js:** `trainingProgress: { airtable: 'v2_Training Progress', wix: 'TrainingProgress' }`

---

### driverCertifications → v2_Driver Certifications
**Phase:** 1 | **Service:** complianceService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| cert_type | SingleSelect | Yes | Options: hazmat, tanker, doubles_triples, passenger, school_bus, twic, air_brakes |
| issued_date | Date | Yes | Date certification was issued |
| expiry_date | Date | No | Certification expiration date |
| issuer | Single Line Text | No | Issuing authority or organization |
| status | SingleSelect | Yes | Options: active, expired, suspended, revoked |

**configData.js:** `driverCertifications: { airtable: 'v2_Driver Certifications', wix: 'DriverCertifications' }`

---

### driverExpenses → v2_Driver Expenses
**Phase:** 1 | **Service:** driverFinancialService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| category | SingleSelect | Yes | Options: fuel, tolls, meals, lodging, maintenance, supplies, communications, other |
| amount | Number | Yes | Expense amount in USD |
| date | Date | Yes | Date of expense |
| description | Single Line Text | No | Brief description of expense |
| receipt_url | URL | No | Link to uploaded receipt image |
| tax_deductible | Checkbox | No | Whether expense is potentially tax-deductible |

**configData.js:** `driverExpenses: { airtable: 'v2_Driver Expenses', wix: 'DriverExpenses' }`

---

### driverSettlements → v2_Driver Settlements
**Phase:** 1 | **Service:** driverFinancialService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| carrier_dot | Single Line Text | Yes | FMCSA DOT number of paying carrier |
| period_start | Date | Yes | Settlement period start date |
| period_end | Date | Yes | Settlement period end date |
| gross | Number | Yes | Gross earnings for period (USD) |
| deductions | Number | Yes | Total deductions for period (USD) |
| net | Number | Yes | Net pay for period (USD) |
| status | SingleSelect | Yes | Options: pending, paid, disputed, adjusted |

**configData.js:** `driverSettlements: { airtable: 'v2_Driver Settlements', wix: 'DriverSettlements' }`

---

### settlementDisputes → v2_Settlement Disputes
**Phase:** 1 | **Service:** driverFinancialService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| settlement_id | Single Line Text | Yes | Airtable record ID of disputed settlement |
| driver_id | Single Line Text | Yes | Wix member ID of the disputing driver |
| dispute_type | SingleSelect | Yes | Options: incorrect_mileage, missing_pay, unauthorized_deduction, fuel_surcharge, other |
| amount_disputed | Number | Yes | Dollar amount in question |
| status | SingleSelect | Yes | Options: open, under_review, resolved_driver, resolved_carrier, escalated |
| notes | Long Text | No | Driver's explanation of dispute |
| opened_at | DateTime | No | When dispute was filed |

**configData.js:** `settlementDisputes: { airtable: 'v2_Settlement Disputes', wix: 'SettlementDisputes' }`

---

### tripCostEstimates → v2_Trip Cost Estimates
**Phase:** 1 | **Service:** driverFinancialService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID requesting estimate |
| origin | Single Line Text | Yes | Trip origin (city, state or address) |
| destination | Single Line Text | Yes | Trip destination (city, state or address) |
| distance_miles | Number | Yes | Calculated trip distance in miles |
| fuel_cost | Number | Yes | Estimated fuel cost (USD) |
| toll_cost | Number | No | Estimated toll cost (USD) |
| total | Number | Yes | Total estimated trip cost (USD) |
| estimated_at | DateTime | No | When estimate was generated |

**configData.js:** `tripCostEstimates: { airtable: 'v2_Trip Cost Estimates', wix: 'TripCostEstimates' }`

---

### taxSummaries → v2_Tax Summaries
**Phase:** 1 | **Service:** driverFinancialService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| tax_year | Number | Yes | Calendar year (e.g., 2025) |
| total_income | Number | Yes | Total gross income for year (USD) |
| total_deductions | Number | No | Total deductible expenses for year (USD) |
| per_diem_total | Number | No | Total per diem claimed for year (USD) |
| mileage_total | Number | No | Total business miles for year |
| generated_at | DateTime | No | When summary was last calculated |

**configData.js:** `taxSummaries: { airtable: 'v2_Tax Summaries', wix: 'TaxSummaries' }`

---

### driverTimeline → v2_Driver Timeline
**Phase:** 1 | **Service:** driverLifecycleService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| event_type | SingleSelect | Yes | Options: joined, profile_updated, job_applied, hired, terminated, cert_added, cert_expired, match_received, message_sent |
| title | Single Line Text | Yes | Short label for timeline event |
| description | Long Text | No | Extended context for event |
| timestamp | DateTime | Yes | When event occurred |
| metadata | Long Text | No | JSON blob with additional event data |

**configData.js:** `driverTimeline: { airtable: 'v2_Driver Timeline', wix: 'DriverTimeline' }`

---

### driverDispositions → v2_Driver Dispositions
**Phase:** 1 | **Service:** driverLifecycleService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| disposition | SingleSelect | Yes | Options: active, inactive, hired, terminated, blacklisted, on_hold |
| reason | Long Text | No | Reason for disposition change |
| changed_by | Single Line Text | Yes | Wix member ID of admin or system initiating change |
| changed_at | DateTime | Yes | When disposition was set |
| previous | SingleSelect | No | Prior disposition value before this change |

**configData.js:** `driverDispositions: { airtable: 'v2_Driver Dispositions', wix: 'DriverDispositions' }`

---

### driverSurveys → v2_Driver Surveys
**Phase:** 1 | **Service:** driverSurveyService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| survey_id | Single Line Text | Yes | Airtable record ID of survey definition |
| driver_id | Single Line Text | Yes | Wix member ID of respondent driver |
| survey_type | SingleSelect | Yes | Options: onboarding, satisfaction, exit, pulse, nps |
| responses | Long Text | Yes | JSON-encoded question/answer pairs |
| completed_at | DateTime | Yes | When driver submitted survey |
| score | Number | No | Calculated score or NPS value |

**configData.js:** `driverSurveys: { airtable: 'v2_Driver Surveys', wix: 'DriverSurveys' }`

---

### matchFeedback → v2_Match Feedback
**Phase:** 1 | **Service:** driverMatching.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| carrier_dot | Single Line Text | Yes | FMCSA DOT number of matched carrier |
| match_id | Single Line Text | Yes | Airtable record ID of match event |
| rating | Number | Yes | Driver's match quality rating (1–5) |
| feedback_type | SingleSelect | Yes | Options: too_far, wrong_pay, wrong_type, wrong_schedule, great_fit, other |
| comment | Long Text | No | Free-form feedback comment |

**configData.js:** `matchFeedback: { airtable: 'v2_Match Feedback', wix: 'MatchFeedback' }`

---

### quickResponseTemplates → v2_Quick Response Templates
**Phase:** 1 | **Service:** messagingService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | No | Owner driver ID (null for system templates) |
| name | Single Line Text | Yes | Template label shown in picker |
| content | Long Text | Yes | Template message body text |
| category | SingleSelect | No | Options: greeting, follow_up, decline, question, availability, other |
| use_count | Number | No | How many times this template has been sent |
| is_system | Checkbox | Yes | Whether template is platform-provided vs. driver-created |

**configData.js:** `quickResponseTemplates: { airtable: 'v2_Quick Response Templates', wix: 'QuickResponseTemplates' }`

---

### reverseAlerts → v2_Reverse Alerts
**Phase:** 1 | **Service:** reverseMatchService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| criteria | Long Text | Yes | JSON-encoded search criteria for matching |
| active | Checkbox | Yes | Whether alert is currently enabled |
| frequency | SingleSelect | Yes | Options: instant, daily, weekly |
| last_triggered | DateTime | No | When alert last fired |
| matches_found | Number | No | Total matches returned on last trigger |

**configData.js:** `reverseAlerts: { airtable: 'v2_Reverse Alerts', wix: 'ReverseAlerts' }`

---

### driverInsightSnapshots → v2_Driver Insight Snapshots
**Phase:** 1 | **Service:** driverInsightsService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| insight_type | SingleSelect | Yes | Options: market_demand, pay_benchmark, route_opportunity, safety_score, qualification_gap |
| data | Long Text | Yes | JSON-encoded insight payload |
| generated_at | DateTime | Yes | When snapshot was produced |
| region | Single Line Text | No | Geographic region context (state, metro) |

**configData.js:** `driverInsightSnapshots: { airtable: 'v2_Driver Insight Snapshots', wix: 'DriverInsightSnapshots' }`

---

## Phase 2 — Recruiter Collections

---

### campaignMessages → v2_Campaign Messages
**Phase:** 2 | **Service:** recruiterOutreachService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| campaign_id | Single Line Text | Yes | Airtable record ID of parent campaign |
| recipient_id | Single Line Text | Yes | Wix member ID of message recipient |
| channel | SingleSelect | Yes | Options: email, sms, push, in_app |
| content | Long Text | Yes | Message body (rendered from template) |
| sent_at | DateTime | No | When message was dispatched |
| delivered | Checkbox | No | Whether delivery was confirmed |
| opened | Checkbox | No | Whether recipient opened message |
| clicked | Checkbox | No | Whether recipient clicked any link |

**configData.js:** `campaignMessages: { airtable: 'v2_Campaign Messages', wix: 'CampaignMessages' }`

---

### emailTemplatesRecruiter → v2_Recruiter Email Templates
**Phase:** 2 | **Service:** recruiterOutreachService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| name | Single Line Text | Yes | Template display name |
| subject | Single Line Text | Yes | Email subject line |
| body_html | Long Text | Yes | HTML email body with merge tags |
| category | SingleSelect | Yes | Options: outreach, follow_up, offer, rejection, nurture, onboarding |
| created_by | Single Line Text | Yes | Wix member ID of recruiter who created template |
| open_rate | Number | No | Average open rate percentage (0–100) |
| use_count | Number | No | Total sends from this template |

**configData.js:** `emailTemplatesRecruiter: { airtable: 'v2_Recruiter Email Templates', wix: 'EmailTemplatesRecruiter' }`

---

### jobBoardSyndications → v2_Job Board Syndications
**Phase:** 2 | **Service:** recruiterOutreachService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| job_id | Single Line Text | Yes | Airtable record ID of the job posting |
| board_name | Single Line Text | Yes | Target job board name (Indeed, CDLjobs, etc.) |
| posting_id | Single Line Text | No | External posting ID assigned by board |
| posted_at | DateTime | No | When posting was submitted |
| expires_at | DateTime | No | When posting is scheduled to expire |
| status | SingleSelect | Yes | Options: pending, active, expired, removed, error |
| clicks | Number | No | Click-through count from board |

**configData.js:** `jobBoardSyndications: { airtable: 'v2_Job Board Syndications', wix: 'JobBoardSyndications' }`

---

### socialPosts → v2_Social Posts
**Phase:** 2 | **Service:** socialScanner.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| recruiter_id | Single Line Text | Yes | Wix member ID of posting recruiter |
| platform | SingleSelect | Yes | Options: linkedin, facebook, twitter, instagram, tiktok |
| content | Long Text | Yes | Post text content |
| media_url | URL | No | Link to attached image or video |
| posted_at | DateTime | No | When post went live |
| likes | Number | No | Like/reaction count |
| shares | Number | No | Share/retweet count |
| status | SingleSelect | Yes | Options: draft, scheduled, published, failed |

**configData.js:** `socialPosts: { airtable: 'v2_Social Posts', wix: 'SocialPosts' }`

---

### socialAccounts → v2_Social Accounts
**Phase:** 2 | **Service:** socialScanner.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| recruiter_id | Single Line Text | Yes | Wix member ID of the recruiter |
| platform | SingleSelect | Yes | Options: linkedin, facebook, twitter, instagram, tiktok |
| account_id | Single Line Text | Yes | Platform-assigned account identifier |
| handle | Single Line Text | Yes | Public username or page handle |
| connected_at | DateTime | Yes | When account was linked |
| active | Checkbox | Yes | Whether OAuth connection is currently valid |

**configData.js:** `socialAccounts: { airtable: 'v2_Social Accounts', wix: 'SocialAccounts' }`

---

### recruiterSavedSearches → v2_Recruiter Saved Searches
**Phase:** 2 | **Service:** recruiterAnalyticsService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| recruiter_id | Single Line Text | Yes | Wix member ID of the recruiter |
| name | Single Line Text | Yes | Search name for display |
| criteria | Long Text | Yes | JSON-encoded driver search filter criteria |
| last_run | DateTime | No | When search was last executed |
| results_count | Number | No | Number of results on last run |
| auto_run | Checkbox | No | Whether search runs on a schedule |

**configData.js:** `recruiterSavedSearches: { airtable: 'v2_Recruiter Saved Searches', wix: 'RecruiterSavedSearches' }`

---

### pipelineRules → v2_Pipeline Rules
**Phase:** 2 | **Service:** pipelineAutomationService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| recruiter_id | Single Line Text | Yes | Wix member ID of the owning recruiter |
| name | Single Line Text | Yes | Rule display name |
| trigger_event | SingleSelect | Yes | Options: application_received, status_changed, no_contact_48h, offer_sent, hired, rejected |
| conditions | Long Text | No | JSON-encoded condition logic |
| actions | Long Text | Yes | JSON-encoded action steps to execute |
| enabled | Checkbox | Yes | Whether rule is currently active |
| executions | Number | No | Total number of times rule has fired |

**configData.js:** `pipelineRules: { airtable: 'v2_Pipeline Rules', wix: 'PipelineRules' }`

---

### interventionTemplates → ⚠️ ALREADY EXISTS IN configData.js → v2_Intervention Templates
**Phase:** 2 | **Service:** retentionService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| name | Single Line Text | Yes | Template display name |
| type | SingleSelect | Yes | Options: check_in, offer_raise, schedule_change, recognition, exit_prevention, survey |
| content | Long Text | Yes | Intervention message content with merge tags |
| channel | SingleSelect | Yes | Options: email, sms, push, call |
| use_count | Number | No | Total times template has been used |
| success_rate | Number | No | Percentage of uses resulting in positive outcome |

**configData.js:** `interventionTemplates: { airtable: 'v2_Intervention Templates', wix: 'InterventionTemplates' }`

---

### interventionHistory → v2_Intervention History
**Phase:** 2 | **Service:** retentionService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of targeted driver |
| recruiter_id | Single Line Text | Yes | Wix member ID of recruiter who sent |
| template_id | Single Line Text | No | Airtable record ID of used template |
| type | SingleSelect | Yes | Options: check_in, offer_raise, schedule_change, recognition, exit_prevention, survey |
| sent_at | DateTime | Yes | When intervention was dispatched |
| outcome | SingleSelect | No | Options: retained, resigned, no_response, scheduled_call, positive_reply |

**configData.js:** `interventionHistory: { airtable: 'v2_Intervention History', wix: 'InterventionHistory' }`

---

### retentionRiskScores → v2_Retention Risk Scores
**Phase:** 2 | **Service:** retentionService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| carrier_dot | Single Line Text | Yes | FMCSA DOT number of associated carrier |
| risk_score | Number | Yes | Numerical risk score (0–100) |
| risk_level | SingleSelect | Yes | Options: low, medium, high, critical |
| factors | Long Text | No | JSON array of contributing risk factors |
| calculated_at | DateTime | Yes | When score was last computed |

**configData.js:** `retentionRiskScores: { airtable: 'v2_Retention Risk Scores', wix: 'RetentionRiskScores' }`

---

### retentionWatchlist → v2_Retention Watchlist
**Phase:** 2 | **Service:** retentionService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of watched driver |
| recruiter_id | Single Line Text | Yes | Wix member ID of monitoring recruiter |
| added_at | DateTime | Yes | When driver was added to watchlist |
| reason | Long Text | No | Recruiter's reasoning for watchlist addition |
| priority | SingleSelect | Yes | Options: low, medium, high, urgent |
| status | SingleSelect | Yes | Options: active, resolved, escalated, removed |

**configData.js:** `retentionWatchlist: { airtable: 'v2_Retention Watchlist', wix: 'RetentionWatchlist' }`

---

### retentionInterventions → v2_Retention Interventions
**Phase:** 2 | **Service:** retentionService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of targeted driver |
| type | SingleSelect | Yes | Options: message, call, email, meeting, raise_offer, schedule_adjustment |
| channel | SingleSelect | Yes | Options: sms, email, push, phone, in_person |
| content | Long Text | No | Intervention content or call notes |
| sent_at | DateTime | Yes | When intervention was executed |
| outcome | SingleSelect | No | Options: retained, resigned, scheduled_follow_up, no_response, positive_reply |
| cost | Number | No | Dollar cost of intervention if applicable |

**configData.js:** `retentionInterventions: { airtable: 'v2_Retention Interventions', wix: 'RetentionInterventions' }`

---

### reverseMatchSubscriptions → v2_Reverse Match Subscriptions
**Phase:** 2 | **Service:** reverseMatchService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Single Line Text | Yes | FMCSA DOT number of subscribing carrier |
| recruiter_id | Single Line Text | Yes | Wix member ID of account owner |
| plan_id | Single Line Text | Yes | Stripe price ID for the subscription plan |
| stripe_sub_id | Single Line Text | Yes | Stripe subscription object ID |
| status | SingleSelect | Yes | Options: active, past_due, canceled, trialing, paused |
| created_at | DateTime | No | When subscription was created |

**configData.js:** `reverseMatchSubscriptions: { airtable: 'v2_Reverse Match Subscriptions', wix: 'ReverseMatchSubscriptions' }`

---

### reverseMatchPayments → v2_Reverse Match Payments
**Phase:** 2 | **Service:** reverseMatchService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| subscription_id | Single Line Text | Yes | Airtable record ID of parent subscription |
| stripe_payment_id | Single Line Text | Yes | Stripe payment intent or charge ID |
| amount | Number | Yes | Payment amount in USD |
| status | SingleSelect | Yes | Options: pending, succeeded, failed, refunded |
| paid_at | DateTime | No | When payment was successfully processed |
| period_start | Date | No | Billing period start date |
| period_end | Date | No | Billing period end date |

**configData.js:** `reverseMatchPayments: { airtable: 'v2_Reverse Match Payments', wix: 'ReverseMatchPayments' }`

---

### driverSearchHistory → v2_Driver Search History
**Phase:** 2 | **Service:** recruiterAnalyticsService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| recruiter_id | Single Line Text | Yes | Wix member ID of the searching recruiter |
| query | Single Line Text | No | Free-text search query entered |
| filters | Long Text | No | JSON-encoded filter criteria applied |
| results_count | Number | Yes | Number of results returned |
| searched_at | DateTime | Yes | When search was executed |

**configData.js:** `driverSearchHistory: { airtable: 'v2_Driver Search History', wix: 'DriverSearchHistory' }`

---

### candidateComparisons → v2_Candidate Comparisons
**Phase:** 2 | **Service:** recruiterAnalyticsService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| recruiter_id | Single Line Text | Yes | Wix member ID of the recruiter |
| driver_ids | Long Text | Yes | JSON array of compared driver member IDs |
| carrier_dot | Single Line Text | No | Context carrier DOT if role-specific comparison |
| comparison_data | Long Text | Yes | JSON snapshot of field-by-field comparison output |
| created_at | DateTime | Yes | When comparison was generated |

**configData.js:** `candidateComparisons: { airtable: 'v2_Candidate Comparisons', wix: 'CandidateComparisons' }`

---

### onboardingWorkflows → ⚠️ ALREADY EXISTS IN configData.js → v2_Onboarding Workflows
**Phase:** 2 | **Service:** onboardingWorkflowService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the onboarding driver |
| carrier_dot | Single Line Text | Yes | FMCSA DOT number of hiring carrier |
| recruiter_id | Single Line Text | Yes | Wix member ID of responsible recruiter |
| template_id | Single Line Text | No | Airtable record ID of workflow template used |
| status | SingleSelect | Yes | Options: not_started, in_progress, pending_docs, completed, cancelled |
| current_step | Single Line Text | No | Label of currently active workflow step |
| started_at | DateTime | No | When workflow was initiated |
| target_start_date | Date | No | Driver's expected first day |

**configData.js:** `onboardingWorkflows: { airtable: 'v2_Onboarding Workflows', wix: 'OnboardingWorkflows' }`

---

### onboardingTasks → v2_Onboarding Tasks
**Phase:** 2 | **Service:** onboardingWorkflowService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| workflow_id | Single Line Text | Yes | Airtable record ID of parent workflow |
| task_type | SingleSelect | Yes | Options: document_request, background_check, drug_test, esign, orientation, equipment_assignment, id_verification |
| assignee_id | Single Line Text | No | Wix member ID of assigned person |
| status | SingleSelect | Yes | Options: pending, in_progress, completed, blocked, skipped |
| due_date | Date | No | Task completion deadline |
| completed_at | DateTime | No | When task was marked complete |

**configData.js:** `onboardingTasks: { airtable: 'v2_Onboarding Tasks', wix: 'OnboardingTasks' }`

---

### documentRequests → ⚠️ ALREADY EXISTS IN configData.js → v2_Document Requests
**Phase:** 2 | **Service:** onboardingWorkflowService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| workflow_id | Single Line Text | Yes | Airtable record ID of parent onboarding workflow |
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| doc_type | SingleSelect | Yes | Options: cdl, medical_cert, social_security, proof_of_address, mvr, psp_report, prior_employment, other |
| status | SingleSelect | Yes | Options: requested, submitted, accepted, rejected |
| requested_at | DateTime | Yes | When document was requested |
| submitted_at | DateTime | No | When driver submitted document |
| notes | Long Text | No | Reviewer notes on submission |

**configData.js:** `documentRequests: { airtable: 'v2_Document Requests', wix: 'DocumentRequests' }`

---

### bgcRequests → v2_BGC Requests
**Phase:** 2 | **Service:** onboardingWorkflowService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| provider | Single Line Text | Yes | Background check provider (Checkr, HireRight, etc.) |
| request_id | Single Line Text | Yes | Provider-assigned request or report ID |
| status | SingleSelect | Yes | Options: initiated, pending, complete, dispute, cancelled |
| initiated_at | DateTime | Yes | When check was ordered |
| completed_at | DateTime | No | When provider returned result |
| result | SingleSelect | No | Options: clear, consider, adverse, pending_dispute |

**configData.js:** `bgcRequests: { airtable: 'v2_BGC Requests', wix: 'BgcRequests' }`

---

### drugTestRequests → v2_Drug Test Requests
**Phase:** 2 | **Service:** onboardingWorkflowService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| provider | Single Line Text | Yes | Drug testing service provider |
| request_id | Single Line Text | Yes | Provider-assigned order ID |
| status | SingleSelect | Yes | Options: ordered, scheduled, collected, in_lab, resulted, cancelled |
| scheduled_at | DateTime | No | Scheduled collection appointment time |
| result | SingleSelect | No | Options: negative, positive, dilute_negative, dilute_positive, cancelled, pending |
| collection_site | Single Line Text | No | Address of collection facility |

**configData.js:** `drugTestRequests: { airtable: 'v2_Drug Test Requests', wix: 'DrugTestRequests' }`

---

### eSignRequests → v2_ESign Requests
**Phase:** 2 | **Service:** onboardingWorkflowService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| workflow_id | Single Line Text | Yes | Airtable record ID of parent workflow |
| driver_id | Single Line Text | Yes | Wix member ID of the signer |
| document_name | Single Line Text | Yes | Human-readable name of document to sign |
| envelope_id | Single Line Text | No | DocuSign or provider envelope ID |
| status | SingleSelect | Yes | Options: created, sent, delivered, signed, declined, voided, expired |
| sent_at | DateTime | No | When envelope was sent to driver |
| signed_at | DateTime | No | When driver completed signing |

**configData.js:** `eSignRequests: { airtable: 'v2_ESign Requests', wix: 'ESignRequests' }`

---

### orientationSchedule → v2_Orientation Schedule
**Phase:** 2 | **Service:** onboardingWorkflowService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Single Line Text | Yes | FMCSA DOT number of hosting carrier |
| date | Date | Yes | Orientation date |
| time | Single Line Text | Yes | Orientation start time (HH:MM) |
| location | Single Line Text | Yes | Facility address or "Virtual" |
| type | SingleSelect | Yes | Options: in_person, virtual, hybrid |
| capacity | Number | Yes | Maximum attendee count |
| enrolled_count | Number | No | Current number of enrolled drivers |

**configData.js:** `orientationSchedule: { airtable: 'v2_Orientation Schedule', wix: 'OrientationSchedule' }`

---

### npsSurveys → v2_NPS Surveys
**Phase:** 2 | **Service:** npsService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| respondent_id | Single Line Text | Yes | Wix member ID of the survey respondent |
| respondent_type | SingleSelect | Yes | Options: driver, recruiter, carrier, admin |
| score | Number | Yes | NPS score 0–10 |
| comment | Long Text | No | Qualitative follow-up comment |
| category | SingleSelect | No | Options: platform_experience, matching_quality, support, onboarding, communication |
| responded_at | DateTime | Yes | When survey was submitted |

**configData.js:** `npsSurveys: { airtable: 'v2_NPS Surveys', wix: 'NpsSurveys' }`

---

### npsTrends → ⚠️ ALREADY EXISTS IN configData.js → v2_NPS Trends
**Phase:** 2 | **Service:** npsService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| period | Single Line Text | Yes | Time period label (e.g., 2026-Q1, 2026-01) |
| segment | SingleSelect | Yes | Options: driver, recruiter, carrier, overall |
| avg_score | Number | Yes | Average NPS score for period (0–10) |
| promoters | Number | Yes | Count of promoters (score 9–10) |
| passives | Number | Yes | Count of passives (score 7–8) |
| detractors | Number | Yes | Count of detractors (score 0–6) |
| response_rate | Number | No | Survey response rate percentage (0–100) |

**configData.js:** `npsTrends: { airtable: 'v2_NPS Trends', wix: 'NpsTrends' }`

---

## Summary

| Phase | Collections | Base ID |
|-------|-------------|---------|
| 1 — Driver | 39 collections (#1–39) | `app9N1YCJ3gdhExA0` |
| 2 — Recruiter | 25 collections (#40–64) | `app9N1YCJ3gdhExA0` |
| **Total** | **64 collections** | |

All tables follow `v2_Table Name` naming. All config keys follow camelCase. All new collections route to Airtable via `configData.js` using `dataAccess.jsw` as the data layer.
