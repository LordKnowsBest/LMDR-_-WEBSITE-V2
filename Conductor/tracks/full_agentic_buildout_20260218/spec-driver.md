# Agent Tool Spec: Driver Section
# Track: full_agentic_buildout_20260218
# Platform: LMDR / VelocityMatch — Wix Velo CDL Truck Driver Recruiting
# Generated: 2026-02-18

## Overview

This spec defines every agent tool for the **driver** role in the full agentic buildout. Each tool
maps to an existing backend `.jsw` service and Airtable collection. The agent orchestration layer
(`agentService.jsw → handleAgentTurn`) builds a role-scoped tool list at runtime; only tools
matching the authenticated user's role (`driver`) are exposed.

Driver tools cover six functional groups: the Driver Cockpit (job search, apply, messaging,
profile), Road Utilities (parking, fuel, weigh stations, weather, road conditions), Community
(forums, mentorship, pet-friendly, health), Compliance (document wallet, HOS, ELD, training),
Financial (expenses, settlements, tax), Lifecycle (onboarding timeline, surveys, feedback), and
Utility Expansion (profile scoring, market insights, quick responses, reverse alerts).

**Risk levels:**
- `read` — safe read-only, no approval required
- `suggest` — prepares a recommendation or preview, driver confirms before execute
- `execute_low` — low-impact write (status flag, note, preference)
- `execute_high` — high-impact write (application submit, document upload, financial record)

---

## Group 1: Driver Cockpit (~23 tools)

**Source Track:** driver_cockpit_20260120
**Backend Service:** driverCockpitService.jsw, messagingService.jsw, driverProfileService.jsw, documentService.jsw, matchingService.jsw

---

### search_jobs

- **Role:** driver
- **Risk Level:** read
- **Description:** Full-text and faceted search across all active carrier job postings visible to the authenticated driver. Applies the driver's CDL class, endorsements, and home domicile automatically to filter non-qualifying postings. Returns paginated job cards with match score, pay range, lane type, and application status.
- **Parameters:**
  - `query: string` — Freeform search string against job title, carrier name, and location (optional)
  - `cdl_class: "A" | "B" | "C"` — Filter by minimum required CDL class (default: driver's own class)
  - `job_type: "OTR" | "regional" | "local" | "dedicated" | "team"` — Haul type filter
  - `pay_type: "per_mile" | "hourly" | "salary" | "percentage"` — Compensation structure filter
  - `min_pay: number` — Minimum weekly gross pay in USD
  - `home_time: "daily" | "weekly" | "biweekly" | "monthly"` — Minimum home time frequency
  - `endorsements: string[]` — Required endorsements: `["HazMat", "Tanker", "Doubles", "Passenger"]`
  - `radius_miles: number` — Search radius from driver's home ZIP (default: 200)
  - `state: string` — Two-letter state code to filter by operating area
  - `sort_by: "match_score" | "pay" | "posted_date" | "home_time"` — Sort dimension (default: match_score)
  - `sort_order: "asc" | "desc"` — Sort direction (default: desc)
  - `page: number` — 1-based page number (default: 1)
  - `page_size: number` — Results per page, max 50 (default: 20)
- **Backend Service:** driverCockpitService.jsw → `searchJobs(driverId, filters, pagination)`
- **Airtable Collection(s):** `jobPostings` → `v2_Job Postings`; `driverProfiles` → `v2_Driver Profiles`
- **Approval Required:** No
- **Dependencies:** matchingService.jsw (match score computation)

---

### get_job_details

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns the full job posting record for a single listing including carrier overview, pay structure breakdown, benefits, equipment type, lane map, home time policy, and the driver's computed match score with rationale. Also returns whether the driver has already applied or saved the job.
- **Parameters:**
  - `job_id: string` — Airtable record ID for the job posting (required)
  - `include_carrier_profile: boolean` — Include abbreviated carrier profile (default: true)
  - `include_match_rationale: boolean` — Include AI-generated match explanation (default: true)
- **Backend Service:** driverCockpitService.jsw → `getJobDetails(jobId, driverId)`
- **Airtable Collection(s):** `jobPostings` → `v2_Job Postings`; `carriers` → `v2_Carriers`; `driverCarrierInterests` → `v2_Driver Carrier Interests`
- **Approval Required:** No
- **Dependencies:** matchExplanationService.jsw → `getMatchExplanationForDriver()`

---

### quick_apply

- **Role:** driver
- **Risk Level:** execute_high
- **Description:** Submits a job application on behalf of the driver using their stored profile, resume, and CDL scan on file. Triggers a notification to the carrier recruiter and logs an interest record. Will block if required compliance documents are expired or missing.
- **Parameters:**
  - `job_id: string` — Job posting record ID (required)
  - `cover_note: string` — Optional short note from driver to recruiter (max 500 chars)
  - `availability_date: string` — ISO 8601 date driver is available to start (optional, defaults to profile value)
  - `acknowledge_requirements: boolean` — Driver confirms they meet all listed requirements (required, must be true)
- **Backend Service:** driverCockpitService.jsw → `submitApplication(driverId, jobId, payload)`
- **Airtable Collection(s):** `driverCarrierInterests` → `v2_Driver Carrier Interests`; `driverProfiles` → `v2_Driver Profiles`; `driverDocuments` → `v2_Driver Documents`
- **Approval Required:** Yes
- **Dependencies:** documentService.jsw (compliance check); notificationService.jsw (recruiter alert)

---

### save_job

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Saves a job posting to the driver's personal watchlist for later review. Idempotent — calling again on an already-saved job is a no-op. Returns the updated saved count.
- **Parameters:**
  - `job_id: string` — Job posting record ID (required)
- **Backend Service:** driverCockpitService.jsw → `saveJob(driverId, jobId)`
- **Airtable Collection(s):** `savedJobs` → `v2_Saved Jobs`
- **Approval Required:** No
- **Dependencies:** None

---

### get_saved_jobs

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns the driver's saved job watchlist ordered by save date descending. Includes current posting status (active, filled, expired) so the driver knows which are still viable.
- **Parameters:**
  - `status_filter: "all" | "active" | "filled" | "expired"` — Filter by current posting status (default: all)
  - `page: number` — 1-based page (default: 1)
  - `page_size: number` — Max 50 (default: 20)
- **Backend Service:** driverCockpitService.jsw → `getSavedJobs(driverId, filters)`
- **Airtable Collection(s):** `savedJobs` → `v2_Saved Jobs`; `jobPostings` → `v2_Job Postings`
- **Approval Required:** No
- **Dependencies:** None

---

### withdraw_application

- **Role:** driver
- **Risk Level:** execute_high
- **Description:** Withdraws a pending application from a carrier. Sets the interest record status to `withdrawn` and sends a courtesy notification to the recruiter. Cannot be undone — driver must reapply if they change their mind.
- **Parameters:**
  - `application_id: string` — Driver Carrier Interests record ID (required)
  - `reason: string` — Withdrawal reason for recruiter context (optional, max 300 chars)
- **Backend Service:** driverCockpitService.jsw → `withdrawApplication(driverId, applicationId, reason)`
- **Airtable Collection(s):** `driverCarrierInterests` → `v2_Driver Carrier Interests`
- **Approval Required:** Yes
- **Dependencies:** notificationService.jsw

---

### check_application_status

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns the current status and recruiter-facing notes for a single application. Status values reflect the standard recruiting pipeline (applied, reviewing, phone_screen, interview, offer, hired, declined, withdrawn).
- **Parameters:**
  - `application_id: string` — Driver Carrier Interests record ID (required)
- **Backend Service:** driverCockpitService.jsw → `getApplicationStatus(driverId, applicationId)`
- **Airtable Collection(s):** `driverCarrierInterests` → `v2_Driver Carrier Interests`
- **Approval Required:** No
- **Dependencies:** None

---

### get_application_history

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns the driver's full application history across all carriers, sorted by most recent activity. Useful for auditing past applications, spotting patterns, and identifying carriers to re-engage.
- **Parameters:**
  - `status_filter: "all" | "active" | "hired" | "declined" | "withdrawn"` — Filter by terminal or active status (default: all)
  - `carrier_name: string` — Partial match filter on carrier name
  - `date_from: string` — ISO 8601 date — return applications on or after this date
  - `date_to: string` — ISO 8601 date — return applications on or before this date
  - `page: number` — 1-based page (default: 1)
  - `page_size: number` — Max 50 (default: 25)
- **Backend Service:** driverCockpitService.jsw → `getApplicationHistory(driverId, filters)`
- **Airtable Collection(s):** `driverCarrierInterests` → `v2_Driver Carrier Interests`; `carriers` → `v2_Carriers`
- **Approval Required:** No
- **Dependencies:** None

---

### send_message

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Sends a message to a recruiter within an existing conversation thread. If no thread exists for the carrier, creates one automatically. Handles basic profanity filtering before write.
- **Parameters:**
  - `conversation_id: string` — Messaging conversation record ID; pass `null` to start a new conversation (required)
  - `carrier_dot: number` — Required if conversation_id is null — identifies the carrier/recruiter to message
  - `body: string` — Message text (required, max 2000 chars)
  - `attachment_url: string` — Pre-signed URL to an uploaded file attachment (optional)
- **Backend Service:** messagingService.jsw → `sendDriverMessage(driverId, conversationId, payload)`
- **Airtable Collection(s):** `driverMessages` → `v2_Driver Messages`; `driverConversations` → `v2_Driver Conversations`
- **Approval Required:** No
- **Dependencies:** None

---

### get_messages

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns paginated messages within a single conversation thread, ordered chronologically. Marks returned messages as read automatically.
- **Parameters:**
  - `conversation_id: string` — Conversation record ID (required)
  - `page: number` — 1-based page (default: 1)
  - `page_size: number` — Max 100 (default: 50)
- **Backend Service:** messagingService.jsw → `getConversationMessages(conversationId, driverId, pagination)`
- **Airtable Collection(s):** `driverMessages` → `v2_Driver Messages`
- **Approval Required:** No
- **Dependencies:** None

---

### get_conversation

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns metadata for a single conversation thread including carrier name, recruiter name, last message preview, unread count, and thread status (active, archived, closed).
- **Parameters:**
  - `conversation_id: string` — Conversation record ID (required)
- **Backend Service:** messagingService.jsw → `getConversation(conversationId, driverId)`
- **Airtable Collection(s):** `driverConversations` → `v2_Driver Conversations`; `carriers` → `v2_Carriers`
- **Approval Required:** No
- **Dependencies:** None

---

### mark_read

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Marks all unread messages in a conversation as read. Used to sync read state after the driver views a thread. Idempotent.
- **Parameters:**
  - `conversation_id: string` — Conversation record ID (required)
- **Backend Service:** messagingService.jsw → `markConversationRead(conversationId, driverId)`
- **Airtable Collection(s):** `driverMessages` → `v2_Driver Messages`
- **Approval Required:** No
- **Dependencies:** None

---

### get_unread_count

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns the driver's total unread message count across all conversations. Used to power the inbox badge in the Driver Cockpit navigation.
- **Parameters:** None
- **Backend Service:** messagingService.jsw → `getDriverUnreadCount(driverId)`
- **Airtable Collection(s):** `driverMessages` → `v2_Driver Messages`
- **Approval Required:** No
- **Dependencies:** None

---

### update_profile

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Updates one or more fields on the driver's profile. Accepts a partial update — only fields present in the payload are modified. Triggers a profile strength recalculation after write. Certain fields (CDL number, DOB, SSN last 4) require document verification before the update is accepted.
- **Parameters:**
  - `first_name: string` — Driver's first name
  - `last_name: string` — Driver's last name
  - `phone: string` — Mobile phone in E.164 format (e.g. `"+15551234567"`)
  - `home_zip: string` — 5-digit home ZIP code
  - `home_state: string` — Two-letter state code
  - `cdl_class: "A" | "B" | "C"` — CDL classification
  - `cdl_state: string` — State of CDL issuance
  - `cdl_expiry: string` — ISO 8601 date of CDL expiration
  - `endorsements: string[]` — Current endorsements array
  - `years_experience: number` — Total years of CDL driving experience
  - `job_types_preferred: string[]` — Preferred haul types (OTR, regional, local, dedicated, team)
  - `min_pay_weekly: number` — Minimum acceptable weekly gross pay in USD
  - `willing_to_relocate: boolean` — Whether driver will consider relocation
  - `bio: string` — Short driver bio for carrier recruiter view (max 600 chars)
  - `avatar_url: string` — Pre-signed URL to uploaded profile photo
- **Backend Service:** driverProfileService.jsw → `updateDriverProfile(driverId, fields)`
- **Airtable Collection(s):** `driverProfiles` → `v2_Driver Profiles`
- **Approval Required:** No
- **Dependencies:** driverProfileService.jsw → `recalculateProfileStrength()`

---

### get_profile_strength

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns the driver's current profile completeness score (0–100) broken down by section: personal info, CDL details, work history, endorsements, documents, and preferences. Includes a list of missing or incomplete fields that would raise the score.
- **Parameters:** None
- **Backend Service:** driverProfileService.jsw → `getProfileStrength(driverId)`
- **Airtable Collection(s):** `driverProfiles` → `v2_Driver Profiles`; `driverDocuments` → `v2_Driver Documents`
- **Approval Required:** No
- **Dependencies:** None

---

### get_profile_suggestions

- **Role:** driver
- **Risk Level:** suggest
- **Description:** Returns AI-generated suggestions for improving the driver's profile to increase recruiter visibility and match quality. Each suggestion includes a specific action, estimated score impact, and priority tier (high, medium, low).
- **Parameters:**
  - `max_suggestions: number` — Maximum suggestions to return (default: 5, max: 10)
- **Backend Service:** driverProfileService.jsw → `getProfileSuggestions(driverId)`
- **Airtable Collection(s):** `driverProfiles` → `v2_Driver Profiles`; `driverDocuments` → `v2_Driver Documents`
- **Approval Required:** No
- **Dependencies:** None

---

### upload_document

- **Role:** driver
- **Risk Level:** execute_high
- **Description:** Records a document upload event after the driver has placed a file in Wix Media. Stores the document metadata (type, expiry, file URL) in the driver's compliance wallet and triggers expiry monitoring. Supported document types: CDL, medical_certificate, MVR, drug_test, employment_history, void_check, insurance.
- **Parameters:**
  - `document_type: string` — One of: `"cdl"` | `"medical_certificate"` | `"mvr"` | `"drug_test"` | `"employment_history"` | `"void_check"` | `"insurance"` | `"other"` (required)
  - `file_url: string` — Wix Media or pre-signed URL to the uploaded file (required)
  - `file_name: string` — Original file name for display (required)
  - `expiry_date: string` — ISO 8601 expiration date (required for cdl, medical_certificate, insurance)
  - `notes: string` — Optional driver notes about the document (max 200 chars)
- **Backend Service:** documentService.jsw → `recordDriverDocumentUpload(driverId, payload)`
- **Airtable Collection(s):** `driverDocuments` → `v2_Driver Documents`
- **Approval Required:** Yes
- **Dependencies:** None

---

### get_matches

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns the driver's current AI-scored carrier match list, ranked by match score descending. Each match includes the carrier name, DOT, pay range, lane summary, home time offer, and match score. Excludes carriers the driver has dismissed or already hired with.
- **Parameters:**
  - `min_score: number` — Minimum match score threshold 0–100 (default: 60)
  - `job_type: "OTR" | "regional" | "local" | "dedicated" | "team"` — Filter by haul type
  - `max_results: number` — Cap on results returned (default: 20, max: 50)
  - `include_applied: boolean` — Include carriers where driver already applied (default: false)
- **Backend Service:** matchingService.jsw → `getDriverMatches(driverId, filters)`
- **Airtable Collection(s):** `driverMatches` → `v2_Driver Matches`; `carriers` → `v2_Carriers`
- **Approval Required:** No
- **Dependencies:** None

---

### get_match_details

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns the full match detail record for a single carrier match including the AI-generated match rationale, FMCSA safety score, pay breakdown, benefits summary, driver sentiment score, and a "why this carrier" narrative paragraph.
- **Parameters:**
  - `match_id: string` — Driver Matches record ID (required)
  - `include_fmcsa: boolean` — Include live FMCSA safety data pull (default: true)
  - `include_sentiment: boolean` — Include driver sentiment analysis from reviews (default: true)
- **Backend Service:** matchingService.jsw → `getMatchDetails(matchId, driverId)`
- **Airtable Collection(s):** `driverMatches` → `v2_Driver Matches`; `carriers` → `v2_Carriers`
- **Approval Required:** No
- **Dependencies:** matchExplanationService.jsw; fmcsaService.jsw

---

### express_interest

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Records a soft expression of interest in a matched carrier without submitting a full application. Signals the carrier recruiter that the driver is open to being contacted. Lower commitment than `quick_apply` — no document check required.
- **Parameters:**
  - `match_id: string` — Driver Matches record ID (required)
  - `message: string` — Optional introductory note to the recruiter (max 300 chars)
- **Backend Service:** matchingService.jsw → `expressDriverInterest(driverId, matchId, message)`
- **Airtable Collection(s):** `driverCarrierInterests` → `v2_Driver Carrier Interests`
- **Approval Required:** No
- **Dependencies:** notificationService.jsw

---

### dismiss_match

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Dismisses a carrier match from the driver's match feed. The carrier will not reappear unless the driver manually clears dismissals or the carrier's profile changes significantly. Optionally records a reason for dismissal to improve future match quality.
- **Parameters:**
  - `match_id: string` — Driver Matches record ID (required)
  - `reason: "pay_too_low" | "wrong_lanes" | "home_time" | "company_culture" | "equipment" | "other"` — Dismissal reason (optional)
- **Backend Service:** matchingService.jsw → `dismissMatch(driverId, matchId, reason)`
- **Airtable Collection(s):** `driverMatches` → `v2_Driver Matches`
- **Approval Required:** No
- **Dependencies:** None

---

### get_dashboard_summary

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns a unified dashboard data bundle for the Driver Cockpit home screen. Aggregates: unread message count, active application count, new matches since last login, expiring document count, and top 3 match cards. Designed for a single-call page load.
- **Parameters:**
  - `new_match_window_days: number` — How many days back to count "new" matches (default: 7)
- **Backend Service:** driverCockpitService.jsw → `getDashboardSummary(driverId)`
- **Airtable Collection(s):** `driverProfiles` → `v2_Driver Profiles`; `driverMatches` → `v2_Driver Matches`; `driverCarrierInterests` → `v2_Driver Carrier Interests`; `driverMessages` → `v2_Driver Messages`; `driverDocuments` → `v2_Driver Documents`
- **Approval Required:** No
- **Dependencies:** messagingService.jsw; matchingService.jsw; documentService.jsw

---

### get_notifications

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns the driver's notification feed ordered by recency. Notification types include: new_match, application_update, message_received, document_expiring, interview_scheduled, offer_received, community_reply, compliance_alert.
- **Parameters:**
  - `unread_only: boolean` — Return only unread notifications (default: false)
  - `type_filter: string[]` — Filter by notification type array (optional)
  - `page: number` — 1-based page (default: 1)
  - `page_size: number` — Max 50 (default: 20)
- **Backend Service:** driverCockpitService.jsw → `getDriverNotifications(driverId, filters)`
- **Airtable Collection(s):** `driverNotifications` → `v2_Driver Notifications`
- **Approval Required:** No
- **Dependencies:** None

---

## Group 2: Driver Road Utilities (~15 tools)

**Source Track:** driver_road_utilities_20260120
**Backend Service:** roadUtilitiesService.jsw, parkingService.jsw, fuelService.jsw, weatherService.jsw

---

### find_parking

- **Role:** driver
- **Risk Level:** read
- **Description:** Searches for truck-accessible parking locations near a given coordinate or city. Returns locations with real-time availability signals (if reported), cost, amenities (showers, food, fuel, security), and user ratings. Pulls from the VelocityMatch DataLake base.
- **Parameters:**
  - `latitude: number` — Search center latitude (required if city not provided)
  - `longitude: number` — Search center longitude (required if city not provided)
  - `city: string` — City name as fallback geolocation (required if lat/lng not provided)
  - `state: string` — Two-letter state code (optional refinement)
  - `radius_miles: number` — Search radius (default: 25, max: 100)
  - `amenities: string[]` — Required amenity filters: `["showers", "food", "fuel", "security", "wifi", "scales"]`
  - `min_rating: number` — Minimum community rating 1.0–5.0 (default: 0)
  - `availability: "all" | "available" | "unknown"` — Filter by reported availability (default: all)
  - `page: number` — 1-based page (default: 1)
  - `page_size: number` — Max 30 (default: 15)
- **Backend Service:** parkingService.jsw → `findTruckParking(filters)`
- **Airtable Collection(s):** `truckParkingLocations` → `v2_Truck Parking Locations`
- **Approval Required:** No
- **Dependencies:** VelocityMatch DataLake base (`appt00rHHBOiKx9xl`)

---

### get_parking_details

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns the full record for a single parking location including address, coordinates, capacity, operating hours, cost structure, accepted payment methods, amenity checklist, recent community reports, and aggregated rating breakdown.
- **Parameters:**
  - `location_id: string` — Truck Parking Locations record ID (required)
- **Backend Service:** parkingService.jsw → `getParkingDetails(locationId)`
- **Airtable Collection(s):** `truckParkingLocations` → `v2_Truck Parking Locations`; `parkingReports` → `v2_Parking Reports`
- **Approval Required:** No
- **Dependencies:** None

---

### report_parking_availability

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Submits a real-time availability report for a parking location from a driver currently on-site. Reports are timestamped and used to update community availability signals. Drivers earn XP for contributing reports.
- **Parameters:**
  - `location_id: string` — Truck Parking Locations record ID (required)
  - `spaces_available: number` — Estimated open truck spaces (required)
  - `total_spaces_visible: number` — Total spaces the driver can see from their vantage point (optional)
  - `notes: string` — Optional freeform observation (max 200 chars)
- **Backend Service:** parkingService.jsw → `reportParkingAvailability(driverId, locationId, report)`
- **Airtable Collection(s):** `parkingReports` → `v2_Parking Reports`
- **Approval Required:** No
- **Dependencies:** gamificationService.jsw (XP award)

---

### save_favorite_parking

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Saves a parking location to the driver's personal favorites list for quick retrieval. Idempotent. Returns updated favorite count.
- **Parameters:**
  - `location_id: string` — Truck Parking Locations record ID (required)
- **Backend Service:** parkingService.jsw → `saveFavoriteParking(driverId, locationId)`
- **Airtable Collection(s):** `driverFavoriteParkingLocations` → `v2_Driver Favorite Parking`
- **Approval Required:** No
- **Dependencies:** None

---

### find_fuel_prices

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns diesel fuel prices at truck stops near a given location. Prices sourced from the VelocityMatch DataLake fuel feed (updated every 4 hours). Results include station name, brand, price per gallon, DEF price, card lock availability, and distance from search point.
- **Parameters:**
  - `latitude: number` — Search center latitude (required if city not provided)
  - `longitude: number` — Search center longitude (required if city not provided)
  - `city: string` — City name fallback
  - `state: string` — Two-letter state code
  - `radius_miles: number` — Search radius (default: 50, max: 150)
  - `max_results: number` — Maximum stations to return (default: 20, max: 50)
  - `sort_by: "price" | "distance"` — Sort dimension (default: price)
- **Backend Service:** fuelService.jsw → `findDieselPrices(location, filters)`
- **Airtable Collection(s):** `fuelPrices` → `v2_Fuel Prices`
- **Approval Required:** No
- **Dependencies:** VelocityMatch DataLake base (`appt00rHHBOiKx9xl`)

---

### get_fuel_price_trends

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns historical diesel price trend data for a state or region over the past N weeks. Useful for trip planning — drivers can see if prices are rising or falling in their upcoming lanes.
- **Parameters:**
  - `state: string` — Two-letter state code (required)
  - `weeks: number` — Historical window in weeks (default: 4, max: 12)
  - `granularity: "daily" | "weekly"` — Data point frequency (default: weekly)
- **Backend Service:** fuelService.jsw → `getFuelPriceTrends(state, weeks, granularity)`
- **Airtable Collection(s):** `fuelPriceTrends` → `v2_Fuel Price Trends`
- **Approval Required:** No
- **Dependencies:** VelocityMatch DataLake base

---

### calculate_fuel_cost

- **Role:** driver
- **Risk Level:** suggest
- **Description:** Estimates total fuel cost for a planned trip given origin, destination, MPG, and current diesel prices along the route. Returns cost breakdown by state, suggested fuel stop sequence, and total estimated spend.
- **Parameters:**
  - `origin_city: string` — Departure city and state (e.g. `"Memphis, TN"`) (required)
  - `destination_city: string` — Arrival city and state (required)
  - `truck_mpg: number` — Driver's truck fuel efficiency in MPG (default: 6.5)
  - `tank_capacity_gallons: number` — Fuel tank capacity (default: 150)
  - `current_fuel_level_gallons: number` — Current fuel on board (default: 50)
- **Backend Service:** fuelService.jsw → `calculateTripFuelCost(origin, destination, truckConfig)`
- **Airtable Collection(s):** `fuelPrices` → `v2_Fuel Prices`
- **Approval Required:** No
- **Dependencies:** roadUtilitiesService.jsw (route mileage)

---

### get_weigh_station_status

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns the current operational status (open, closed, closed_by_precleer) for a single weigh station identified by USDOT station ID or record ID. Used for quick status checks on a specific station.
- **Parameters:**
  - `station_id: string` — Weigh station record ID or USDOT station identifier (required)
- **Backend Service:** roadUtilitiesService.jsw → `getWeighStationStatus(stationId)`
- **Airtable Collection(s):** `weighStations` → `v2_Weigh Stations`
- **Approval Required:** No
- **Dependencies:** VelocityMatch DataLake base

---

### get_weigh_stations_on_route

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns all weigh stations along a specified route corridor, ordered by mile marker. Each result includes station status, PreClear bypass eligibility, weight limits, operating hours, and last-reported wait time.
- **Parameters:**
  - `origin_city: string` — Route origin city and state (required)
  - `destination_city: string` — Route destination city and state (required)
  - `status_filter: "all" | "open" | "closed"` — Filter by operational status (default: all)
- **Backend Service:** roadUtilitiesService.jsw → `getWeighStationsOnRoute(origin, destination, filters)`
- **Airtable Collection(s):** `weighStations` → `v2_Weigh Stations`
- **Approval Required:** No
- **Dependencies:** VelocityMatch DataLake base

---

### find_rest_stops

- **Role:** driver
- **Risk Level:** read
- **Description:** Finds HOS-compliant rest stops near a location or along a route. Returns each stop's distance, parking capacity, amenities, ADA accessibility, and current community rating. Flags stops that can accommodate longer combination vehicles.
- **Parameters:**
  - `latitude: number` — Search center latitude
  - `longitude: number` — Search center longitude
  - `city: string` — City fallback
  - `state: string` — State code filter
  - `radius_miles: number` — Search radius (default: 30, max: 100)
  - `min_parking_spaces: number` — Minimum truck parking capacity at the stop (default: 1)
  - `amenities: string[]` — Required amenity filters: `["restrooms", "vending", "wifi", "pet_area"]`
  - `lcv_friendly: boolean` — Filter to LCV-accommodating stops only (default: false)
  - `max_results: number` — Max results (default: 20)
- **Backend Service:** roadUtilitiesService.jsw → `findRestStops(filters)`
- **Airtable Collection(s):** `restStops` → `v2_Rest Stops`
- **Approval Required:** No
- **Dependencies:** None

---

### rate_rest_stop

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Submits a community rating and optional review for a rest stop. Ratings cover cleanliness, safety, parking ease, and overall score on a 1–5 scale. Drivers can only submit one rating per stop per visit window (7 days).
- **Parameters:**
  - `stop_id: string` — Rest Stops record ID (required)
  - `rating_overall: number` — Overall score 1–5 (required)
  - `rating_cleanliness: number` — Cleanliness score 1–5
  - `rating_safety: number` — Safety/lighting score 1–5
  - `rating_parking_ease: number` — Ease of parking score 1–5
  - `review_text: string` — Optional written review (max 400 chars)
- **Backend Service:** roadUtilitiesService.jsw → `rateRestStop(driverId, stopId, rating)`
- **Airtable Collection(s):** `restStopRatings` → `v2_Rest Stop Ratings`
- **Approval Required:** No
- **Dependencies:** gamificationService.jsw (XP award)

---

### get_weather_forecast

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns a 7-day weather forecast for a city or coordinate point, formatted for over-the-road driving context. Highlights high-wind events, black ice risk windows, visibility forecasts, and heavy precipitation bands by day and time block.
- **Parameters:**
  - `latitude: number` — Forecast location latitude
  - `longitude: number` — Forecast location longitude
  - `city: string` — City/state string fallback
  - `days: number` — Forecast window in days (1–7, default: 3)
  - `units: "imperial" | "metric"` — Temperature and wind speed units (default: imperial)
- **Backend Service:** weatherService.jsw → `getWeatherForecast(location, days, units)`
- **Airtable Collection(s):** `weatherForecasts` → `v2_Weather Forecasts`
- **Approval Required:** No
- **Dependencies:** VelocityMatch DataLake base (weather feed)

---

### get_weather_alerts

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns all active NWS weather alerts (blizzard, ice storm, high wind, fog, tornado watch) for a state or coordinate region. Each alert includes severity level, affected area description, onset time, expiry time, and driving impact summary.
- **Parameters:**
  - `state: string` — Two-letter state code (required if lat/lng not provided)
  - `latitude: number` — Coordinate latitude for point-in-polygon alert lookup
  - `longitude: number` — Coordinate longitude
  - `severity_min: "minor" | "moderate" | "severe" | "extreme"` — Minimum severity to return (default: moderate)
- **Backend Service:** weatherService.jsw → `getWeatherAlerts(location)`
- **Airtable Collection(s):** `weatherAlerts` → `v2_Weather Alerts`
- **Approval Required:** No
- **Dependencies:** VelocityMatch DataLake base

---

### get_road_conditions

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns current road condition reports for a state or route corridor. Aggregates DOT 511 feed data including: ice/snow coverage, construction zones, closures, chain law status, and road grade advisories for mountain passes.
- **Parameters:**
  - `state: string` — Two-letter state code
  - `route: string` — Interstate or highway identifier (e.g. `"I-80"`) for corridor-specific lookup
  - `condition_type: "all" | "winter" | "construction" | "closure" | "chain_law"` — Condition type filter (default: all)
- **Backend Service:** weatherService.jsw → `getRoadConditions(state, route, conditionType)`
- **Airtable Collection(s):** `roadConditions` → `v2_Road Conditions`
- **Approval Required:** No
- **Dependencies:** VelocityMatch DataLake base (DOT 511 feed)

---

### report_road_hazard

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Submits a crowdsourced road hazard report on behalf of the driver. Hazard types include: debris, pothole, accident, black_ice, construction_not_on_map, low_bridge, weight_restriction_change, and other. Reports are validated and published to the community feed within 10 minutes.
- **Parameters:**
  - `hazard_type: string` — One of: `"debris"` | `"pothole"` | `"accident"` | `"black_ice"` | `"construction_not_on_map"` | `"low_bridge"` | `"weight_restriction_change"` | `"other"` (required)
  - `latitude: number` — Hazard location latitude (required)
  - `longitude: number` — Hazard location longitude (required)
  - `description: string` — Brief description of the hazard (required, max 300 chars)
  - `severity: "low" | "medium" | "high"` — Driver's assessment of hazard severity (required)
  - `photo_url: string` — Optional pre-signed URL to a hazard photo
- **Backend Service:** roadUtilitiesService.jsw → `reportRoadHazard(driverId, report)`
- **Airtable Collection(s):** `roadHazardReports` → `v2_Road Hazard Reports`
- **Approval Required:** No
- **Dependencies:** gamificationService.jsw (XP award for community contribution)

---

## Group 3: Driver Community (~14 tools)

**Source Track:** driver_community_20260120
**Backend Service:** communityService.jsw, mentorshipService.jsw, petFriendlyService.jsw, healthService.jsw

---

### get_forum_posts

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns paginated posts from the driver community forum. Supports filtering by category (pay_talk, routes, equipment, life_otrs, carrier_reviews, compliance_help, classifieds, off_topic) and sort by recency or popularity. Each post includes reply count, like count, author handle, and preview text.
- **Parameters:**
  - `category: string` — Forum category slug (optional; omit for all categories)
  - `sort_by: "recent" | "popular" | "unanswered"` — Sort dimension (default: recent)
  - `search: string` — Keyword search within post titles and bodies
  - `pinned_only: boolean` — Return only pinned/announcement posts (default: false)
  - `page: number` — 1-based page (default: 1)
  - `page_size: number` — Max 50 (default: 20)
- **Backend Service:** communityService.jsw → `getForumPosts(filters, pagination)`
- **Airtable Collection(s):** `communityPosts` → `v2_Community Posts`
- **Approval Required:** No
- **Dependencies:** None

---

### create_forum_post

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Creates a new community forum post. Content is screened by basic profanity filter before write. Driver must have a complete profile (strength score >= 30) to post. Returns the new post record ID on success.
- **Parameters:**
  - `title: string` — Post title (required, max 120 chars)
  - `body: string` — Post body in plain text or basic Markdown (required, max 5000 chars)
  - `category: string` — Forum category slug (required): `"pay_talk"` | `"routes"` | `"equipment"` | `"life_otrs"` | `"carrier_reviews"` | `"compliance_help"` | `"classifieds"` | `"off_topic"`
  - `tags: string[]` — Optional topic tags (max 5)
- **Backend Service:** communityService.jsw → `createForumPost(driverId, payload)`
- **Airtable Collection(s):** `communityPosts` → `v2_Community Posts`
- **Approval Required:** No
- **Dependencies:** gamificationService.jsw (XP for first post, post milestones)

---

### reply_to_post

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Adds a reply to an existing forum post thread. Content is screened before write. Triggers a notification to the original post author and any drivers who previously replied.
- **Parameters:**
  - `post_id: string` — Community Posts record ID (required)
  - `body: string` — Reply text (required, max 2000 chars)
  - `quote_reply_id: string` — Optional: record ID of a specific reply to quote (optional)
- **Backend Service:** communityService.jsw → `replyToPost(driverId, postId, body, quoteReplyId)`
- **Airtable Collection(s):** `communityReplies` → `v2_Community Replies`
- **Approval Required:** No
- **Dependencies:** notificationService.jsw

---

### like_post

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Toggles a like on a forum post or reply. If already liked, removes the like (unlike). Returns the updated like count and whether the driver currently likes the item.
- **Parameters:**
  - `item_id: string` — Post or reply record ID (required)
  - `item_type: "post" | "reply"` — Whether the target is a post or a reply (required)
- **Backend Service:** communityService.jsw → `toggleLike(driverId, itemId, itemType)`
- **Airtable Collection(s):** `communityLikes` → `v2_Community Likes`
- **Approval Required:** No
- **Dependencies:** None

---

### report_post

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Submits a moderation report on a forum post or reply that violates community guidelines. Returns a confirmation token. Admins are notified for review. Drivers cannot report their own content.
- **Parameters:**
  - `item_id: string` — Post or reply record ID (required)
  - `item_type: "post" | "reply"` — Target content type (required)
  - `reason: "spam" | "harassment" | "misinformation" | "illegal_content" | "off_topic" | "other"` — Report reason (required)
  - `details: string` — Additional context (optional, max 300 chars)
- **Backend Service:** communityService.jsw → `reportContent(driverId, itemId, itemType, reason, details)`
- **Airtable Collection(s):** `communityReports` → `v2_Community Reports`
- **Approval Required:** No
- **Dependencies:** notificationService.jsw (admin alert)

---

### search_forums

- **Role:** driver
- **Risk Level:** read
- **Description:** Full-text search across all forum posts and replies. Returns ranked results with category, author, post date, and a highlighted excerpt showing where the search terms appear. More targeted than the category browse in `get_forum_posts`.
- **Parameters:**
  - `query: string` — Search query string (required, min 3 chars)
  - `category: string` — Limit search to a specific category (optional)
  - `date_from: string` — ISO 8601 date — search posts on or after this date (optional)
  - `max_results: number` — Maximum results to return (default: 20, max: 50)
- **Backend Service:** communityService.jsw → `searchForums(query, filters)`
- **Airtable Collection(s):** `communityPosts` → `v2_Community Posts`; `communityReplies` → `v2_Community Replies`
- **Approval Required:** No
- **Dependencies:** None

---

### find_mentors

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns a list of experienced drivers registered as mentors in the LMDR community program. Filterable by specialty (OTR, hazmat, tanker, new_cdl, owner_operator, lease_purchase) and availability. Each result includes mentor bio, years of experience, specialty tags, rating, and current mentee capacity.
- **Parameters:**
  - `specialty: string[]` — Filter by mentor specialty tags (optional)
  - `available_only: boolean` — Exclude mentors at capacity (default: true)
  - `min_rating: number` — Minimum mentor rating 1.0–5.0 (default: 0)
  - `max_results: number` — Max results (default: 15)
- **Backend Service:** mentorshipService.jsw → `findMentors(filters)`
- **Airtable Collection(s):** `communityMentors` → `v2_Community Mentors`
- **Approval Required:** No
- **Dependencies:** None

---

### request_mentorship

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Sends a mentorship request to a specific mentor. Includes a brief intro message and the driver's stated goal. The mentor is notified and has 72 hours to accept or decline. A driver may have at most one active mentorship request at a time.
- **Parameters:**
  - `mentor_id: string` — Community Mentors record ID (required)
  - `intro_message: string` — Brief introduction and statement of what the driver hopes to learn (required, max 500 chars)
  - `goal: string` — Primary goal: `"new_cdl"` | `"career_advancement"` | `"owner_operator"` | `"endorsement"` | `"general"` (required)
- **Backend Service:** mentorshipService.jsw → `requestMentorship(driverId, mentorId, payload)`
- **Airtable Collection(s):** `mentorshipRequests` → `v2_Mentorship Requests`
- **Approval Required:** No
- **Dependencies:** notificationService.jsw

---

### get_mentorship_status

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns the current status of all mentorship relationships for the driver — pending requests, active mentorships, and completed/archived sessions. Includes mentor contact info for active relationships.
- **Parameters:** None
- **Backend Service:** mentorshipService.jsw → `getDriverMentorshipStatus(driverId)`
- **Airtable Collection(s):** `mentorshipRequests` → `v2_Mentorship Requests`; `communityMentors` → `v2_Community Mentors`
- **Approval Required:** No
- **Dependencies:** None

---

### rate_mentor

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Submits a rating and optional review for a completed mentorship. Only available after a mentorship session is marked complete. Rating covers: communication, expertise, helpfulness, and overall. Each mentorship can only be rated once.
- **Parameters:**
  - `mentorship_id: string` — Mentorship Requests record ID (required)
  - `rating_overall: number` — Overall score 1–5 (required)
  - `rating_communication: number` — Communication score 1–5
  - `rating_expertise: number` — Domain expertise score 1–5
  - `rating_helpfulness: number` — Practical helpfulness score 1–5
  - `review_text: string` — Optional written review (max 400 chars)
- **Backend Service:** mentorshipService.jsw → `rateMentor(driverId, mentorshipId, rating)`
- **Airtable Collection(s):** `mentorshipRatings` → `v2_Mentorship Ratings`
- **Approval Required:** No
- **Dependencies:** None

---

### search_pet_friendly_locations

- **Role:** driver
- **Risk Level:** read
- **Description:** Searches the crowdsourced database of pet-friendly truck stops, rest areas, parks, and hotels near a location. Each result includes pet policy details, amenities (dog run, water, bags), owner ratings, and photo count. Built on `petFriendlyService.jsw`.
- **Parameters:**
  - `latitude: number` — Search center latitude (required if city not provided)
  - `longitude: number` — Search center longitude
  - `city: string` — City/state string fallback
  - `radius_miles: number` — Search radius (default: 30, max: 100)
  - `location_type: "all" | "truck_stop" | "rest_area" | "hotel" | "park" | "restaurant"` — Type filter (default: all)
  - `min_rating: number` — Minimum community rating 1.0–5.0 (default: 0)
  - `max_results: number` — Max results (default: 20)
- **Backend Service:** petFriendlyService.jsw → `searchLocations(filters)`
- **Airtable Collection(s):** `petFriendlyLocations` → `v2_Pet Friendly Locations`
- **Approval Required:** No
- **Dependencies:** None

---

### submit_pet_friendly_location

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Submits a new pet-friendly location nomination to the community database. Submissions enter a pending review queue before becoming publicly visible. Driver earns XP for approved submissions.
- **Parameters:**
  - `name: string` — Location name (required)
  - `address: string` — Full street address (required)
  - `city: string` — City (required)
  - `state: string` — Two-letter state code (required)
  - `zip: string` — ZIP code (required)
  - `latitude: number` — Coordinates (optional; geocoded from address if omitted)
  - `longitude: number` — Coordinates
  - `location_type: string` — `"truck_stop"` | `"rest_area"` | `"hotel"` | `"park"` | `"restaurant"` | `"other"` (required)
  - `pet_policy_notes: string` — Description of the pet policy (required, max 400 chars)
  - `amenities: string[]` — Present amenities: `["dog_run", "water_station", "waste_bags", "pet_supplies"]`
  - `photo_url: string` — Optional pre-signed URL to a location photo
- **Backend Service:** petFriendlyService.jsw → `submitLocation(driverId, data)`
- **Airtable Collection(s):** `petFriendlyLocations` → `v2_Pet Friendly Locations`
- **Approval Required:** No
- **Dependencies:** gamificationService.jsw

---

### get_health_resources

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns curated health and wellness resources categorized for over-the-road drivers. Categories include: nutrition, sleep, back_pain, mental_health, exercise_in_cab, diabetes, hypertension, and substance_recovery. Each resource has a type (article, video, checklist, tool) and reading time.
- **Parameters:**
  - `category: string` — Health category filter (optional; returns all if omitted)
  - `resource_type: "article" | "video" | "checklist" | "tool" | "all"` — Content type filter (default: all)
  - `max_results: number` — Max results (default: 15)
- **Backend Service:** healthService.jsw → `getResourcesByCategory(category, resourceType)`
- **Airtable Collection(s):** `driverHealthResources` → `v2_Driver Health Resources`
- **Approval Required:** No
- **Dependencies:** None

---

### submit_health_tip

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Submits a community health tip from an experienced driver. Tips enter a moderation queue — approved tips are published to the health resources feed with the submitter credited (anonymous option available). Drivers earn XP for approved tips.
- **Parameters:**
  - `category: string` — Health category: `"nutrition"` | `"sleep"` | `"back_pain"` | `"mental_health"` | `"exercise_in_cab"` | `"diabetes"` | `"hypertension"` | `"substance_recovery"` | `"general"` (required)
  - `tip_title: string` — Brief descriptive title (required, max 100 chars)
  - `tip_body: string` — Full tip content (required, max 1000 chars)
  - `anonymous: boolean` — Submit without name attribution (default: false)
- **Backend Service:** healthService.jsw → `submitTip(driverId, data)`
- **Airtable Collection(s):** `communityHealthTips` → `v2_Community Health Tips`
- **Approval Required:** No
- **Dependencies:** gamificationService.jsw

---

## Group 4: Driver Compliance (~12 tools)

**Source Track:** driver_compliance_20260120
**Backend Service:** documentService.jsw, hosService.jsw, eldService.jsw, trainingService.jsw

---

### upload_compliance_doc

- **Role:** driver
- **Risk Level:** execute_high
- **Description:** Records a compliance document upload in the driver's DQ file wallet. Acts as the primary entry point for all regulated documents. Triggers downstream expiry monitoring, recruiter notification (if document unlocks applications), and profile strength recalculation. Distinct from `upload_document` — this tool applies DOT compliance validation rules.
- **Parameters:**
  - `document_type: string` — Regulated document type: `"cdl"` | `"medical_certificate"` | `"mvr"` | `"drug_test_result"` | `"road_test_certificate"` | `"employment_verification"` | `"background_check"` | `"psp_report"` | `"clearinghouse_query"` (required)
  - `file_url: string` — Wix Media URL of the uploaded file (required)
  - `file_name: string` — Original file name (required)
  - `issued_date: string` — ISO 8601 date the document was issued (required)
  - `expiry_date: string` — ISO 8601 expiration date (required for cdl, medical_certificate)
  - `issuing_authority: string` — State or agency that issued the document (optional)
  - `notes: string` — Driver notes (optional, max 200 chars)
- **Backend Service:** documentService.jsw → `uploadComplianceDoc(driverId, payload)`
- **Airtable Collection(s):** `driverDocuments` → `v2_Driver Documents`; `driverComplianceWallet` → `v2_Driver Compliance Wallet`
- **Approval Required:** Yes
- **Dependencies:** driverProfileService.jsw (profile strength update); notificationService.jsw

---

### get_compliance_docs

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns all documents in the driver's compliance wallet, grouped by document type. Each record includes file metadata, upload date, issue date, expiry date, days until expiry, and status (valid, expiring_soon, expired, pending_review).
- **Parameters:**
  - `type_filter: string` — Filter by document type (optional; returns all types if omitted)
  - `status_filter: "all" | "valid" | "expiring_soon" | "expired" | "pending_review"` — Status filter (default: all)
- **Backend Service:** documentService.jsw → `getDriverComplianceDocs(driverId, filters)`
- **Airtable Collection(s):** `driverDocuments` → `v2_Driver Documents`
- **Approval Required:** No
- **Dependencies:** None

---

### check_doc_expiry

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns expiry status for a single compliance document. Used for spot-checking a specific document's validity without loading the full wallet. Returns days remaining, expiry date, and whether it falls within the 30-day warning window.
- **Parameters:**
  - `document_id: string` — Driver Documents record ID (required)
- **Backend Service:** documentService.jsw → `checkDocumentExpiry(documentId, driverId)`
- **Airtable Collection(s):** `driverDocuments` → `v2_Driver Documents`
- **Approval Required:** No
- **Dependencies:** None

---

### get_expiring_docs

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns all compliance documents expiring within a configurable window. Used to power the "Action Required" section of the compliance dashboard. Default window is 60 days — catches CDL renewals, medical certificates, and insurance before they lapse.
- **Parameters:**
  - `days_window: number` — Return documents expiring within this many days (default: 60, max: 180)
  - `include_expired: boolean` — Include already-expired documents (default: true)
- **Backend Service:** documentService.jsw → `getExpiringDocuments(driverId, daysWindow, includeExpired)`
- **Airtable Collection(s):** `driverDocuments` → `v2_Driver Documents`
- **Approval Required:** No
- **Dependencies:** None

---

### get_hos_summary

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns the driver's current Hours of Service status summary including hours driven today, hours remaining in the current 11-hour window, hours in the 70-hour/8-day cycle, and next reset time. Data sourced from the connected ELD or manual log entries.
- **Parameters:**
  - `include_violations: boolean` — Include any detected violations in the summary (default: true)
  - `include_cycle_history: boolean` — Include 8-day cycle detail breakdown (default: false)
- **Backend Service:** hosService.jsw → `getHOSSummary(driverId)`
- **Airtable Collection(s):** `hosLogs` → `v2_HOS Logs`; `hosViolations` → `v2_HOS Violations`
- **Approval Required:** No
- **Dependencies:** eldService.jsw (if ELD connected)

---

### log_hos_entry

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Manually logs an HOS status change entry for drivers without a connected ELD or to correct a status. Entry types follow FMCSA duty status categories: off_duty, sleeper_berth, driving, on_duty_not_driving, personal_conveyance, yard_moves.
- **Parameters:**
  - `status: string` — Duty status: `"off_duty"` | `"sleeper_berth"` | `"driving"` | `"on_duty_not_driving"` | `"personal_conveyance"` | `"yard_moves"` (required)
  - `start_time: string` — ISO 8601 datetime when status began (required)
  - `end_time: string` — ISO 8601 datetime when status ended (omit if current/ongoing)
  - `location_city: string` — City where status change occurred (required)
  - `location_state: string` — State where status change occurred (required)
  - `odometer: number` — Odometer reading at status change (optional)
  - `notes: string` — Annotation for the entry (optional, max 200 chars)
- **Backend Service:** hosService.jsw → `logHOSEntry(driverId, entry)`
- **Airtable Collection(s):** `hosLogs` → `v2_HOS Logs`
- **Approval Required:** No
- **Dependencies:** None

---

### get_hos_violations

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns all HOS violations detected for the driver within a given time range. Each violation record includes the rule violated, severity, date/time, mileage, and whether it has been reviewed or disputed.
- **Parameters:**
  - `date_from: string` — ISO 8601 date — return violations on or after this date (default: 30 days ago)
  - `date_to: string` — ISO 8601 date — return violations on or before this date (default: today)
  - `severity: "all" | "warning" | "violation"` — Filter by severity (default: all)
- **Backend Service:** hosService.jsw → `getHOSViolations(driverId, dateRange, severity)`
- **Airtable Collection(s):** `hosViolations` → `v2_HOS Violations`
- **Approval Required:** No
- **Dependencies:** None

---

### sync_eld_data

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Triggers a manual sync pull from the driver's connected ELD provider to refresh HOS logs, location data, and engine diagnostics in the LMDR system. Supports KeepTruckin (Motive), Samsara, and Rand McNally ELD APIs. Returns the sync status and record counts updated.
- **Parameters:**
  - `eld_provider: "motive" | "samsara" | "rand_mcnally" | "peoplenet"` — ELD provider identifier (required)
  - `sync_window_hours: number` — How many hours back to pull data for (default: 24, max: 168)
- **Backend Service:** eldService.jsw → `syncELDData(driverId, provider, windowHours)`
- **Airtable Collection(s):** `hosLogs` → `v2_HOS Logs`; `eldSyncLog` → `v2_ELD Sync Log`
- **Approval Required:** No
- **Dependencies:** eldService.jsw (provider-specific API keys in wix-secrets-backend)

---

### get_training_courses

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns available training and certification courses relevant to the driver. Filtered by CDL class and endorsements to show only applicable courses. Includes: endorsement training, safety refreshers, DOT compliance modules, and carrier-specific onboarding courses. Shows enrollment status and completion percentage for each.
- **Parameters:**
  - `category: "all" | "endorsement" | "safety" | "compliance" | "carrier_onboarding" | "professional_development"` — Course category filter (default: all)
  - `include_completed: boolean` — Include already-completed courses (default: false)
  - `provider: string` — Filter by training provider name (optional)
  - `max_results: number` — Max results (default: 20)
- **Backend Service:** trainingService.jsw → `getAvailableCourses(driverId, filters)`
- **Airtable Collection(s):** `trainingCourses` → `v2_Training Courses`; `driverCourseEnrollments` → `v2_Driver Course Enrollments`
- **Approval Required:** No
- **Dependencies:** None

---

### start_training

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Enrolls the driver in a training course and creates an enrollment record. Marks the course as in-progress and returns the course start URL or first module details. If the course has a cost, confirms the driver accepts before enrolling.
- **Parameters:**
  - `course_id: string` — Training Courses record ID (required)
  - `accept_cost: boolean` — Required if course has a cost — driver confirms they accept any associated fee (default: false)
- **Backend Service:** trainingService.jsw → `enrollInCourse(driverId, courseId, acceptCost)`
- **Airtable Collection(s):** `driverCourseEnrollments` → `v2_Driver Course Enrollments`
- **Approval Required:** No (Yes if course has a cost)
- **Dependencies:** None

---

### get_training_progress

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns the driver's progress for all enrolled courses. Each record includes: course name, enrollment date, modules completed, modules total, completion percentage, last activity date, and estimated time remaining.
- **Parameters:**
  - `status_filter: "all" | "in_progress" | "completed" | "not_started"` — Filter by enrollment status (default: all)
- **Backend Service:** trainingService.jsw → `getTrainingProgress(driverId, statusFilter)`
- **Airtable Collection(s):** `driverCourseEnrollments` → `v2_Driver Course Enrollments`
- **Approval Required:** No
- **Dependencies:** None

---

### get_certifications

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns all earned certifications and credentials on file for the driver. Includes CDL endorsements (from compliance wallet), completed training certificates, and platform achievement badges. Each certification record shows issue date, expiry date (if applicable), and issuing body.
- **Parameters:**
  - `cert_type: "all" | "endorsement" | "training" | "platform"` — Certification type filter (default: all)
  - `include_expired: boolean` — Include expired certifications (default: false)
- **Backend Service:** trainingService.jsw → `getDriverCertifications(driverId, filters)`
- **Airtable Collection(s):** `driverCertifications` → `v2_Driver Certifications`; `driverDocuments` → `v2_Driver Documents`
- **Approval Required:** No
- **Dependencies:** None

---

## Group 5: Driver Financial (~10 tools)

**Source Track:** driver_financial_20260120
**Backend Service:** driverFinancialService.jsw, settlementService.jsw, taxService.jsw

---

### log_expense

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Logs a business expense for the driver's personal expense tracker. Categories map to IRS Schedule C deductible expense types for owner-operators and lease drivers. Each entry can include a receipt photo URL. Does not integrate with carrier payroll — this is the driver's personal record.
- **Parameters:**
  - `amount: number` — Expense amount in USD (required)
  - `category: string` — Expense category: `"fuel"` | `"tolls"` | `"lumper"` | `"scales"` | `"meals"` | `"lodging"` | `"maintenance"` | `"insurance"` | `"equipment"` | `"communications"` | `"medical"` | `"other"` (required)
  - `expense_date: string` — ISO 8601 date of expense (required)
  - `description: string` — Brief description (required, max 300 chars)
  - `vendor_name: string` — Vendor or payee name (optional)
  - `receipt_url: string` — Pre-signed URL to receipt photo (optional)
  - `load_id: string` — Optional load or trip reference number for association (optional)
  - `is_deductible: boolean` — Driver's assessment of deductibility (default: true)
- **Backend Service:** driverFinancialService.jsw → `logExpense(driverId, expense)`
- **Airtable Collection(s):** `driverExpenses` → `v2_Driver Expenses`
- **Approval Required:** No
- **Dependencies:** None

---

### get_expenses

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns paginated expense log entries for the driver. Supports filtering by date range, category, and minimum amount. Results ordered by expense date descending.
- **Parameters:**
  - `date_from: string` — ISO 8601 date — return expenses on or after (default: start of current month)
  - `date_to: string` — ISO 8601 date — return expenses on or before (default: today)
  - `category: string` — Expense category filter (optional)
  - `min_amount: number` — Minimum expense amount (optional)
  - `page: number` — 1-based page (default: 1)
  - `page_size: number` — Max 100 (default: 50)
- **Backend Service:** driverFinancialService.jsw → `getExpenses(driverId, filters, pagination)`
- **Airtable Collection(s):** `driverExpenses` → `v2_Driver Expenses`
- **Approval Required:** No
- **Dependencies:** None

---

### get_expense_summary

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns an aggregated expense summary for a given period. Includes: total spend, spend by category (with percentages), top vendor by spend, daily average, and comparison to the prior period. Used to power the expense dashboard card.
- **Parameters:**
  - `period: "current_week" | "current_month" | "current_quarter" | "ytd" | "custom"` — Summary period (required)
  - `date_from: string` — ISO 8601 date (required if period is `"custom"`)
  - `date_to: string` — ISO 8601 date (required if period is `"custom"`)
  - `compare_prior: boolean` — Include comparison to equivalent prior period (default: true)
- **Backend Service:** driverFinancialService.jsw → `getExpenseSummary(driverId, period, dateRange)`
- **Airtable Collection(s):** `driverExpenses` → `v2_Driver Expenses`
- **Approval Required:** No
- **Dependencies:** None

---

### export_expenses

- **Role:** driver
- **Risk Level:** read
- **Description:** Generates a downloadable expense report for the driver in CSV or PDF format. Useful for tax preparation, CPA sharing, or carrier reimbursement requests. Returns a signed download URL valid for 24 hours.
- **Parameters:**
  - `date_from: string` — ISO 8601 date — export expenses on or after (required)
  - `date_to: string` — ISO 8601 date — export expenses on or before (required)
  - `format: "csv" | "pdf"` — Output file format (default: csv)
  - `category_filter: string[]` — Limit export to specific categories (optional; all categories if omitted)
- **Backend Service:** driverFinancialService.jsw → `exportExpenses(driverId, dateRange, format, categories)`
- **Airtable Collection(s):** `driverExpenses` → `v2_Driver Expenses`
- **Approval Required:** No
- **Dependencies:** None

---

### get_settlement_history

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns the driver's historical settlement records from connected carriers. Each settlement includes: period, gross pay, deductions (fuel advance, escrow, insurance), net pay, loads completed, miles driven, and rate per mile. Data entered by carrier or uploaded by driver.
- **Parameters:**
  - `carrier_dot: number` — Filter to a specific carrier's settlements (optional)
  - `date_from: string` — ISO 8601 date — return settlements on or after
  - `date_to: string` — ISO 8601 date — return settlements on or before
  - `page: number` — 1-based page (default: 1)
  - `page_size: number` — Max 50 (default: 25)
- **Backend Service:** settlementService.jsw → `getSettlementHistory(driverId, filters)`
- **Airtable Collection(s):** `driverSettlements` → `v2_Driver Settlements`
- **Approval Required:** No
- **Dependencies:** None

---

### dispute_settlement

- **Role:** driver
- **Risk Level:** execute_high
- **Description:** Files a formal dispute on a settlement record. Creates a dispute ticket visible to the carrier's recruiter team and the LMDR admin support queue. Requires a specific dispute reason and supporting description. The driver's settlement record is flagged as `disputed` until resolved.
- **Parameters:**
  - `settlement_id: string` — Driver Settlements record ID (required)
  - `dispute_reason: string` — `"incorrect_miles"` | `"missing_loads"` | `"unauthorized_deduction"` | `"rate_discrepancy"` | `"fuel_advance_error"` | `"escrow_dispute"` | `"other"` (required)
  - `expected_amount: number` — What the driver believes the correct net pay should be (required)
  - `description: string` — Detailed explanation of the discrepancy (required, max 1000 chars)
  - `supporting_doc_url: string` — Pre-signed URL to supporting documentation (optional)
- **Backend Service:** settlementService.jsw → `disputeSettlement(driverId, settlementId, dispute)`
- **Airtable Collection(s):** `driverSettlements` → `v2_Driver Settlements`; `settlementDisputes` → `v2_Settlement Disputes`
- **Approval Required:** Yes
- **Dependencies:** notificationService.jsw (carrier + admin alert)

---

### calculate_trip_cost

- **Role:** driver
- **Risk Level:** suggest
- **Description:** Calculates the estimated net profit or loss for a load given the offered rate, route details, and the driver's known cost structure (fuel, tolls, per diem). Useful for owner-operators and lease drivers evaluating whether to accept a load. Returns gross pay, itemized estimated costs, and net take-home.
- **Parameters:**
  - `gross_rate: number` — Total carrier payment for the load in USD (required)
  - `miles: number` — Total loaded miles (required)
  - `fuel_cost_estimate: number` — Estimated fuel cost for the trip in USD (optional; calculated from `calculate_fuel_cost` if omitted)
  - `toll_estimate: number` — Estimated toll costs in USD (optional)
  - `lumper_cost: number` — Expected lumper/unloading cost in USD (optional)
  - `deadhead_miles: number` — Deadhead miles to pickup (optional; used to estimate deadhead cost)
  - `truck_payment_daily: number` — Daily truck lease/payment cost (optional)
  - `include_per_diem: boolean` — Factor in per diem deduction (default: true)
- **Backend Service:** driverFinancialService.jsw → `calculateTripCost(driverId, tripParams)`
- **Airtable Collection(s):** None (pure calculation)
- **Approval Required:** No
- **Dependencies:** fuelService.jsw (if fuel cost not provided); taxService.jsw (per diem rates)

---

### get_tax_summary

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns a tax year summary for the driver including: total gross income logged, total business expenses, estimated taxable income, self-employment tax estimate, and recommended quarterly payment amounts. Based on expense log and settlement history data — not a substitute for professional tax advice.
- **Parameters:**
  - `tax_year: number` — Four-digit tax year (default: current year)
  - `filing_status: "single" | "married_filing_jointly" | "married_filing_separately" | "head_of_household"` — IRS filing status for bracket calculation (default: single)
- **Backend Service:** taxService.jsw → `getDriverTaxSummary(driverId, taxYear, filingStatus)`
- **Airtable Collection(s):** `driverExpenses` → `v2_Driver Expenses`; `driverSettlements` → `v2_Driver Settlements`
- **Approval Required:** No
- **Dependencies:** None

---

### get_deduction_suggestions

- **Role:** driver
- **Risk Level:** suggest
- **Description:** Returns a list of commonly missed tax deductions for CDL drivers based on the driver's expense history and CDL classification. Each suggestion includes the deduction name, IRS basis, estimated annual value, and whether the driver currently has records that could support the deduction.
- **Parameters:**
  - `tax_year: number` — Four-digit tax year (default: current year)
- **Backend Service:** taxService.jsw → `getDeductionSuggestions(driverId, taxYear)`
- **Airtable Collection(s):** `driverExpenses` → `v2_Driver Expenses`; `driverProfiles` → `v2_Driver Profiles`
- **Approval Required:** No
- **Dependencies:** None

---

### get_per_diem_rates

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns current IRS per diem rates for truck drivers, broken down by domestic standard rate and high-cost locality rates. Includes the current-year truck driver special per diem rate and the calculation formula for estimating annual per diem deduction based on days-away-from-home count.
- **Parameters:**
  - `tax_year: number` — Four-digit tax year (default: current year)
  - `state: string` — Optional state code for high-cost locality lookup
- **Backend Service:** taxService.jsw → `getPerDiemRates(taxYear, state)`
- **Airtable Collection(s):** `taxReferenceData` → `v2_Tax Reference Data`
- **Approval Required:** No
- **Dependencies:** None

---

## Group 6: Driver Lifecycle (~5 tools)

**Source Track:** driver_lifecycle_20260120
**Backend Service:** driverLifecycleService.jsw, surveyService.jsw

---

### get_driver_timeline

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns the driver's full lifecycle event timeline from their initial LMDR registration through current status. Events include: registration, profile completion milestones, first match, first application, interview, hire, onboarding steps, and retention touchpoints. Used to show the driver how far they've come and what's next.
- **Parameters:**
  - `include_future: boolean` — Include upcoming scheduled events (e.g. onboarding step due dates) (default: true)
  - `event_types: string[]` — Filter to specific event type slugs (optional)
- **Backend Service:** driverLifecycleService.jsw → `getDriverTimeline(driverId, filters)`
- **Airtable Collection(s):** `driverLifecycleEvents` → `v2_Driver Lifecycle Events`
- **Approval Required:** No
- **Dependencies:** None

---

### update_disposition

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Updates the driver's current job search disposition. Controls whether the driver appears as actively searching, passively open, or not looking to carrier recruiters. This is a high-value signal that affects match visibility and recruiter outreach eligibility.
- **Parameters:**
  - `disposition: "actively_looking" | "passively_open" | "not_looking" | "hired"` — New disposition value (required)
  - `available_date: string` — ISO 8601 date when driver is available to start (required if disposition is actively_looking or passively_open)
  - `notes: string` — Optional note for recruiter context — e.g. "finishing current contract" (optional, max 200 chars)
- **Backend Service:** driverLifecycleService.jsw → `updateDisposition(driverId, disposition, availableDate, notes)`
- **Airtable Collection(s):** `driverProfiles` → `v2_Driver Profiles`; `driverLifecycleEvents` → `v2_Driver Lifecycle Events`
- **Approval Required:** No
- **Dependencies:** matchingService.jsw (visibility update triggers re-score)

---

### get_pending_surveys

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns all outstanding survey requests for the driver. Survey types include: carrier experience surveys (post-hire/post-decline), platform NPS surveys, match quality feedback, and community health surveys. Each record shows the survey type, deadline, estimated completion time, and XP reward for completion.
- **Parameters:**
  - `survey_type: "all" | "carrier_experience" | "nps" | "match_feedback" | "community"` — Survey type filter (default: all)
- **Backend Service:** surveyService.jsw → `getPendingSurveys(driverId, surveyType)`
- **Airtable Collection(s):** `driverSurveyRequests` → `v2_Driver Survey Requests`
- **Approval Required:** No
- **Dependencies:** None

---

### submit_survey_response

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Submits the driver's response to a pending survey. Accepts a structured response object matching the survey's question schema. Returns confirmation and XP earned. Marks the survey request as complete. Only one response per survey request is accepted.
- **Parameters:**
  - `survey_request_id: string` — Driver Survey Requests record ID (required)
  - `responses: object` — Key-value map of question IDs to response values. Question IDs are returned with the survey schema from `get_pending_surveys`. Values may be: number (rating), string (text), boolean (yes/no), or string[] (multiple select). (required)
  - `completion_time_seconds: number` — Client-measured completion time in seconds (optional, for survey UX analytics)
- **Backend Service:** surveyService.jsw → `submitSurveyResponse(driverId, surveyRequestId, responses)`
- **Airtable Collection(s):** `driverSurveyResponses` → `v2_Driver Survey Responses`
- **Approval Required:** No
- **Dependencies:** gamificationService.jsw (XP award)

---

### submit_match_feedback

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Submits structured feedback on a specific carrier match to improve the AI matching model. Feedback signals include: whether the match felt accurate, which factors were most relevant, and which factors were irrelevant or wrong. This data feeds the match quality model retraining pipeline.
- **Parameters:**
  - `match_id: string` — Driver Matches record ID (required)
  - `rating: number` — Overall match quality rating 1–5 (required)
  - `accurate_factors: string[]` — Matching factors the driver agreed with: `["pay", "lanes", "home_time", "equipment", "company_culture", "endorsements"]`
  - `inaccurate_factors: string[]` — Matching factors the driver disagreed with (same options as accurate_factors)
  - `comments: string` — Optional freeform feedback (max 400 chars)
- **Backend Service:** driverLifecycleService.jsw → `submitMatchFeedback(driverId, matchId, feedback)`
- **Airtable Collection(s):** `driverMatchFeedback` → `v2_Driver Match Feedback`
- **Approval Required:** No
- **Dependencies:** None

---

## Group 7: Driver Utility Expansion (~4 tools)

**Source Track:** driver_utility_expansion_20260120
**Backend Service:** driverProfileService.jsw, driverCockpitService.jsw, marketIntelService.jsw, alertService.jsw

---

### get_profile_strength_score

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns the driver's profile strength score as a single numeric value (0–100) with a brief label and a next-action recommendation. Lighter-weight alternative to `get_profile_strength` — designed for the dashboard score widget where only the top-line number and a single CTA are needed.
- **Parameters:**
  - `include_next_action: boolean` — Include the single highest-impact improvement action (default: true)
- **Backend Service:** driverProfileService.jsw → `getProfileStrengthScore(driverId)`
- **Airtable Collection(s):** `driverProfiles` → `v2_Driver Profiles`
- **Approval Required:** No
- **Dependencies:** None

---

### send_quick_response

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Sends a pre-defined quick response template to a recruiter in an active conversation. Templates are stored in the LMDR system and cover common driver replies (interested, need more info, not a fit, schedule interview, etc.). Faster than composing a message — useful for voice agent contexts where text input is limited.
- **Parameters:**
  - `conversation_id: string` — Conversation record ID (required)
  - `template_key: string` — Quick response template identifier: `"interested"` | `"need_more_info"` | `"not_a_fit"` | `"schedule_interview"` | `"call_me"` | `"email_me"` | `"available_next_week"` | `"available_today"` | `"reviewing_offer"` | `"accepted_offer"` (required)
  - `custom_addendum: string` — Optional brief addition after the template text (max 150 chars)
- **Backend Service:** driverCockpitService.jsw → `sendQuickResponse(driverId, conversationId, templateKey, addendum)`
- **Airtable Collection(s):** `driverMessages` → `v2_Driver Messages`; `driverConversations` → `v2_Driver Conversations`
- **Approval Required:** No
- **Dependencies:** messagingService.jsw

---

### set_reverse_alert

- **Role:** driver
- **Risk Level:** execute_low
- **Description:** Creates a saved search alert that notifies the driver when a new job posting matches their specified criteria. Alerts are evaluated on each new posting ingestion cycle (approximately every 4 hours). Drivers can have up to 5 active alerts simultaneously.
- **Parameters:**
  - `alert_name: string` — Friendly name for the alert (required, max 60 chars)
  - `job_type: string[]` — Haul type filter: `["OTR", "regional", "local", "dedicated", "team"]`
  - `pay_type: string[]` — Compensation structure filter
  - `min_pay_weekly: number` — Minimum weekly gross pay threshold
  - `home_time: string[]` — Home time frequency requirements
  - `states: string[]` — Operating states to include (two-letter codes)
  - `endorsements_required: string[]` — Required endorsement filter
  - `notify_via: string[]` — Notification channels: `["email", "sms", "in_app"]` (required, at least one)
- **Backend Service:** alertService.jsw → `createReverseAlert(driverId, alertConfig)`
- **Airtable Collection(s):** `driverAlerts` → `v2_Driver Alerts`
- **Approval Required:** No
- **Dependencies:** notificationService.jsw

---

### get_market_insights

- **Role:** driver
- **Risk Level:** read
- **Description:** Returns AI-generated market intelligence insights tailored to the driver's CDL class, endorsements, and preferred operating lanes. Includes: current average CPM by lane type, demand hotspots, carrier hiring surge alerts, pay trend direction (up/down), and a short narrative summary. Data is refreshed weekly from the VelocityMatch data pipeline.
- **Parameters:**
  - `insight_type: "all" | "pay_trends" | "demand_hotspots" | "hiring_surges" | "lane_analysis"` — Insight category (default: all)
  - `lane_focus: string` — Specific lane or corridor to focus analysis on (e.g. `"I-80 East-West"`) (optional)
  - `max_insights: number` — Maximum insights to return (default: 5)
- **Backend Service:** marketIntelService.jsw → `getDriverMarketInsights(driverId, insightType, laneFocus)`
- **Airtable Collection(s):** `marketIntelligence` → `v2_Market Intelligence`; `driverProfiles` → `v2_Driver Profiles`
- **Approval Required:** No
- **Dependencies:** VelocityMatch DataLake base (`appt00rHHBOiKx9xl`)

---

## Tool Count Summary

| Group | Tools | Risk Distribution |
|---|---|---|
| Group 1: Driver Cockpit | 23 | 14 read, 5 execute_low, 3 execute_high, 1 suggest |
| Group 2: Driver Road Utilities | 15 | 9 read, 5 execute_low, 1 suggest |
| Group 3: Driver Community | 14 | 5 read, 8 execute_low, 1 suggest |
| Group 4: Driver Compliance | 12 | 6 read, 4 execute_low, 2 execute_high |
| Group 5: Driver Financial | 10 | 5 read, 2 execute_low, 1 execute_high, 2 suggest |
| Group 6: Driver Lifecycle | 5 | 2 read, 3 execute_low |
| Group 7: Driver Utility Expansion | 4 | 2 read, 2 execute_low |
| **Total** | **83** | **43 read, 29 execute_low, 6 execute_high, 5 suggest** |

---

## Backend Service Index

| Service File | Tools That Call It |
|---|---|
| `driverCockpitService.jsw` | search_jobs, get_job_details, quick_apply, save_job, get_saved_jobs, withdraw_application, check_application_status, get_application_history, get_dashboard_summary, get_notifications, send_quick_response |
| `messagingService.jsw` | send_message, get_messages, get_conversation, mark_read, get_unread_count |
| `driverProfileService.jsw` | update_profile, get_profile_strength, get_profile_suggestions, get_profile_strength_score |
| `documentService.jsw` | upload_document, upload_compliance_doc, get_compliance_docs, check_doc_expiry, get_expiring_docs |
| `matchingService.jsw` | get_matches, get_match_details, express_interest, dismiss_match |
| `matchExplanationService.jsw` | get_job_details, get_match_details |
| `parkingService.jsw` | find_parking, get_parking_details, report_parking_availability, save_favorite_parking |
| `fuelService.jsw` | find_fuel_prices, get_fuel_price_trends, calculate_fuel_cost |
| `roadUtilitiesService.jsw` | get_weigh_station_status, get_weigh_stations_on_route, find_rest_stops, rate_rest_stop, report_road_hazard |
| `weatherService.jsw` | get_weather_forecast, get_weather_alerts, get_road_conditions |
| `communityService.jsw` | get_forum_posts, create_forum_post, reply_to_post, like_post, report_post, search_forums |
| `mentorshipService.jsw` | find_mentors, request_mentorship, get_mentorship_status, rate_mentor |
| `petFriendlyService.jsw` | search_pet_friendly_locations, submit_pet_friendly_location |
| `healthService.jsw` | get_health_resources, submit_health_tip |
| `hosService.jsw` | get_hos_summary, log_hos_entry, get_hos_violations |
| `eldService.jsw` | sync_eld_data |
| `trainingService.jsw` | get_training_courses, start_training, get_training_progress, get_certifications |
| `driverFinancialService.jsw` | log_expense, get_expenses, get_expense_summary, export_expenses, calculate_trip_cost |
| `settlementService.jsw` | get_settlement_history, dispute_settlement |
| `taxService.jsw` | get_tax_summary, get_deduction_suggestions, get_per_diem_rates |
| `driverLifecycleService.jsw` | get_driver_timeline, update_disposition, submit_match_feedback |
| `surveyService.jsw` | get_pending_surveys, submit_survey_response |
| `alertService.jsw` | set_reverse_alert |
| `marketIntelService.jsw` | get_market_insights |
| `gamificationService.jsw` | report_parking_availability, rate_rest_stop, report_road_hazard, create_forum_post, submit_pet_friendly_location, submit_health_tip, submit_survey_response |
| `notificationService.jsw` | quick_apply, withdraw_application, express_interest, send_message, reply_to_post, report_post, request_mentorship, dispute_settlement, set_reverse_alert |

---

## Airtable Collection Index

| Config Key | Airtable Table | Used By |
|---|---|---|
| `driverProfiles` | `v2_Driver Profiles` | update_profile, get_profile_strength, get_profile_suggestions, get_profile_strength_score, get_dashboard_summary, update_disposition, get_deduction_suggestions, get_market_insights |
| `jobPostings` | `v2_Job Postings` | search_jobs, get_job_details, get_saved_jobs |
| `driverCarrierInterests` | `v2_Driver Carrier Interests` | quick_apply, withdraw_application, check_application_status, get_application_history, express_interest, get_dashboard_summary |
| `savedJobs` | `v2_Saved Jobs` | save_job, get_saved_jobs |
| `driverMessages` | `v2_Driver Messages` | send_message, get_messages, mark_read, get_unread_count, send_quick_response |
| `driverConversations` | `v2_Driver Conversations` | send_message, get_conversation, send_quick_response |
| `driverNotifications` | `v2_Driver Notifications` | get_notifications |
| `driverDocuments` | `v2_Driver Documents` | upload_document, upload_compliance_doc, get_compliance_docs, check_doc_expiry, get_expiring_docs, get_certifications, get_profile_strength |
| `driverComplianceWallet` | `v2_Driver Compliance Wallet` | upload_compliance_doc |
| `driverMatches` | `v2_Driver Matches` | get_matches, get_match_details, express_interest, dismiss_match, get_dashboard_summary |
| `carriers` | `v2_Carriers` | get_job_details, get_match_details, get_conversation, get_application_history |
| `truckParkingLocations` | `v2_Truck Parking Locations` | find_parking, get_parking_details |
| `parkingReports` | `v2_Parking Reports` | get_parking_details, report_parking_availability |
| `driverFavoriteParkingLocations` | `v2_Driver Favorite Parking` | save_favorite_parking |
| `fuelPrices` | `v2_Fuel Prices` | find_fuel_prices, calculate_fuel_cost |
| `fuelPriceTrends` | `v2_Fuel Price Trends` | get_fuel_price_trends |
| `weighStations` | `v2_Weigh Stations` | get_weigh_station_status, get_weigh_stations_on_route |
| `restStops` | `v2_Rest Stops` | find_rest_stops |
| `restStopRatings` | `v2_Rest Stop Ratings` | rate_rest_stop |
| `weatherForecasts` | `v2_Weather Forecasts` | get_weather_forecast |
| `weatherAlerts` | `v2_Weather Alerts` | get_weather_alerts |
| `roadConditions` | `v2_Road Conditions` | get_road_conditions |
| `roadHazardReports` | `v2_Road Hazard Reports` | report_road_hazard |
| `communityPosts` | `v2_Community Posts` | get_forum_posts, create_forum_post, search_forums |
| `communityReplies` | `v2_Community Replies` | reply_to_post, search_forums |
| `communityLikes` | `v2_Community Likes` | like_post |
| `communityReports` | `v2_Community Reports` | report_post |
| `communityMentors` | `v2_Community Mentors` | find_mentors, request_mentorship, get_mentorship_status |
| `mentorshipRequests` | `v2_Mentorship Requests` | request_mentorship, get_mentorship_status, rate_mentor |
| `mentorshipRatings` | `v2_Mentorship Ratings` | rate_mentor |
| `petFriendlyLocations` | `v2_Pet Friendly Locations` | search_pet_friendly_locations, submit_pet_friendly_location |
| `driverHealthResources` | `v2_Driver Health Resources` | get_health_resources |
| `communityHealthTips` | `v2_Community Health Tips` | submit_health_tip |
| `hosLogs` | `v2_HOS Logs` | get_hos_summary, log_hos_entry |
| `hosViolations` | `v2_HOS Violations` | get_hos_summary, get_hos_violations |
| `eldSyncLog` | `v2_ELD Sync Log` | sync_eld_data |
| `trainingCourses` | `v2_Training Courses` | get_training_courses |
| `driverCourseEnrollments` | `v2_Driver Course Enrollments` | get_training_courses, start_training, get_training_progress |
| `driverCertifications` | `v2_Driver Certifications` | get_certifications |
| `driverExpenses` | `v2_Driver Expenses` | log_expense, get_expenses, get_expense_summary, export_expenses, get_tax_summary, get_deduction_suggestions |
| `driverSettlements` | `v2_Driver Settlements` | get_settlement_history, dispute_settlement |
| `settlementDisputes` | `v2_Settlement Disputes` | dispute_settlement |
| `taxReferenceData` | `v2_Tax Reference Data` | get_per_diem_rates |
| `driverLifecycleEvents` | `v2_Driver Lifecycle Events` | get_driver_timeline, update_disposition |
| `driverSurveyRequests` | `v2_Driver Survey Requests` | get_pending_surveys |
| `driverSurveyResponses` | `v2_Driver Survey Responses` | submit_survey_response |
| `driverMatchFeedback` | `v2_Driver Match Feedback` | submit_match_feedback |
| `driverAlerts` | `v2_Driver Alerts` | set_reverse_alert |
| `marketIntelligence` | `v2_Market Intelligence` | get_market_insights |
