# Specification: Carrier Fleet Dashboard - Operations Visibility

## 1. Overview

This track delivers a comprehensive fleet operations dashboard for carriers, providing real-time visibility into driver status, equipment assignments, performance metrics, and capacity utilization. The dashboard consolidates critical operational data into a single command center for fleet managers.

### Business Context

| Metric | Current | Target | Impact |
|--------|---------|--------|--------|
| Driver status visibility | Manual tracking | Real-time | Reduced dispatch errors |
| Equipment utilization tracking | Spreadsheets | Automated | 15% improved utilization |
| Performance visibility | Quarterly reviews | Continuous | Proactive driver coaching |
| Capacity planning accuracy | ~60% | 90%+ | Better load coverage |

### Dependencies

- `carrier_conversion_20260103` - Carrier onboarding and authentication flow
- `carrier_utility_expansion_20260120` - Carrier preferences and status tracking infrastructure

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
+------------------------------------------------------------------------------+
|                         CARRIER FLEET DASHBOARD                                |
+------------------------------------------------------------------------------+
|                                                                                |
|  +-------------------------------------------------------------------------+  |
|  |                           PRESENTATION LAYER                             |  |
|  +-------------------------------------------------------------------------+  |
|  |                                                                          |  |
|  |  +-------------+  +-------------+  +-------------+  +-------------+      |  |
|  |  | Driver      |  | Equipment   |  | Driver      |  | Capacity    |      |  |
|  |  | Roster      |  | Manager     |  | Scorecard   |  | Planner     |      |  |
|  |  +-------------+  +-------------+  +-------------+  +-------------+      |  |
|  |                                                                          |  |
|  |  +-------------+  +-------------+                                        |  |
|  |  | Fleet Map   |  | Dashboard   |                                        |  |
|  |  | (GPS/ELD)   |  | Summary     |                                        |  |
|  |  +-------------+  +-------------+                                        |  |
|  |                                                                          |  |
|  +-------------------------------------------------------------------------+  |
|                                    |                                          |
|                            postMessage / API                                  |
|                                    |                                          |
|  +-------------------------------------------------------------------------+  |
|  |                            SERVICE LAYER                                 |  |
|  +-------------------------------------------------------------------------+  |
|  |                                                                          |  |
|  |  +-----------------+  +------------------+  +----------------------+     |  |
|  |  | fleetService    |  | equipmentService |  | driverScorecardSvc   |     |  |
|  |  | .jsw            |  | .jsw             |  | .jsw                 |     |  |
|  |  +-----------------+  +------------------+  +----------------------+     |  |
|  |                                                                          |  |
|  |  +-----------------+  +------------------+                               |  |
|  |  | capacityPlanning|  | eldIntegration   |                               |  |
|  |  | Service.jsw     |  | Service.jsw      |                               |  |
|  |  +-----------------+  +------------------+                               |  |
|  |                                                                          |  |
|  +-------------------------------------------------------------------------+  |
|                                    |                                          |
|                              wixData API                                      |
|                                    |                                          |
|  +-------------------------------------------------------------------------+  |
|  |                            DATA LAYER                                    |  |
|  +-------------------------------------------------------------------------+  |
|  |                                                                          |  |
|  |  +-------------+  +-------------+  +------------------+                  |  |
|  |  | FleetDrivers|  | Equipment   |  | Equipment        |                  |  |
|  |  |             |  | Assets      |  | Assignments      |                  |  |
|  |  +-------------+  +-------------+  +------------------+                  |  |
|  |                                                                          |  |
|  |  +-------------+  +-------------+  +------------------+                  |  |
|  |  | Driver      |  | Capacity    |  | ELDConnections   |                  |  |
|  |  | Scores      |  | Plans       |  | DriverLocations  |                  |  |
|  |  +-------------+  +-------------+  +------------------+                  |  |
|  |                                                                          |  |
|  +-------------------------------------------------------------------------+  |
|                                                                                |
|  +-------------------------------------------------------------------------+  |
|  |                         EXTERNAL INTEGRATIONS                            |  |
|  +-------------------------------------------------------------------------+  |
|  |                                                                          |  |
|  |  +-------------+  +-------------+  +-------------+  +-------------+      |  |
|  |  | Motive      |  | Samsara     |  | Omnitracs   |  | GPS Trackit |      |  |
|  |  | (Keep       |  |             |  |             |  |             |      |  |
|  |  |  Truckin)   |  |             |  |             |  |             |      |  |
|  |  +-------------+  +-------------+  +-------------+  +-------------+      |  |
|  |                                                                          |  |
|  +-------------------------------------------------------------------------+  |
|                                                                                |
+------------------------------------------------------------------------------+
```

### 2.2 Data Flow Architecture

```
+------------------------------------------------------------------------------+
|                           DATA FLOW DIAGRAM                                    |
+------------------------------------------------------------------------------+
|                                                                                |
|   EXTERNAL SOURCES                    INTERNAL PROCESSING           OUTPUT    |
|   ================                    ===================           ======    |
|                                                                                |
|   +---------------+                                                           |
|   | ELD Provider  |----+                                                      |
|   | (GPS/HOS)     |    |                                                      |
|   +---------------+    |         +------------------+                         |
|                        +-------->| eldIntegration   |                         |
|   +---------------+    |         | Service.jsw      |                         |
|   | TMS System    |----+         +--------+---------+                         |
|   | (Loads)       |                       |                                   |
|   +---------------+                       v                                   |
|                              +------------------------+                       |
|                              | DriverLocations        |                       |
|   +---------------+          | Collection             |                       |
|   | Carrier HR    |          +------------------------+                       |
|   | System        |                       |                                   |
|   +---------------+                       v                                   |
|          |              +-------------------------------------+               |
|          |              |                                     |               |
|          v              v                                     v               |
|   +---------------+    +---------------+    +------------------+              |
|   | FleetDrivers  |    | Equipment     |    | AGGREGATION      |              |
|   | Collection    |    | Assets        |    | ENGINE           |              |
|   +-------+-------+    +-------+-------+    +--------+---------+              |
|           |                    |                     |                        |
|           v                    v                     v                        |
|   +-------+--------------------+---------------------+-------+                |
|   |                                                          |                |
|   |              FLEET DASHBOARD VIEWS                       |----> CARRIER   |
|   |                                                          |      USERS     |
|   |  +----------+  +----------+  +----------+  +----------+  |                |
|   |  | Roster   |  | Equipment|  | Scorecard|  | Capacity |  |                |
|   |  | View     |  | View     |  | View     |  | View     |  |                |
|   |  +----------+  +----------+  +----------+  +----------+  |                |
|   |                                                          |                |
|   +----------------------------------------------------------+                |
|                                                                                |
+------------------------------------------------------------------------------+
```

---

## 3. Feature 1: Driver Roster

### 3.1 Overview

A comprehensive list of all drivers associated with the carrier, showing real-time status, location, availability, and contact information. Supports filtering, sorting, bulk actions, and data export.

### 3.2 Driver Status States

| Status | Icon | Color | Description |
|--------|------|-------|-------------|
| `active` | Truck | Green | Currently on duty and available |
| `driving` | Wheel | Blue | Currently behind the wheel |
| `resting` | Moon | Yellow | In rest period (sleeper berth/off duty) |
| `on_leave` | Calendar | Orange | Scheduled time off (vacation, PTO) |
| `medical_leave` | Medical | Orange | Medical leave of absence |
| `suspended` | Warning | Red | Temporarily suspended |
| `terminated` | X | Gray | No longer employed |

### 3.3 Data Model: FleetDrivers

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | String | Yes | Primary key |
| `carrier_dot` | Number | Yes | Parent carrier DOT number |
| `driver_id` | Reference | Yes | Link to DriverProfiles collection |
| `employee_id` | String | No | Internal employee number |
| `status` | String | Yes | Current employment status |
| `status_updated_at` | DateTime | Yes | When status last changed |
| `hire_date` | Date | Yes | Employment start date |
| `termination_date` | Date | No | Employment end date (if applicable) |
| `home_terminal` | String | Yes | Home base location |
| `current_location` | Object | No | `{ lat, lng, city, state, updated_at }` |
| `assigned_equipment_id` | Reference | No | Link to EquipmentAssets |
| `license_state` | String | Yes | CDL issuing state |
| `license_expiry` | Date | Yes | CDL expiration date |
| `medical_card_expiry` | Date | Yes | DOT medical card expiration |
| `endorsements` | Array | No | Active endorsements ['H', 'N', 'T', 'X'] |
| `phone_primary` | String | Yes | Primary contact number |
| `phone_secondary` | String | No | Backup phone number |
| `email` | String | Yes | Email address |
| `emergency_contact` | Object | No | `{ name, relation, phone }` |
| `notes` | String | No | Internal notes |
| `_createdDate` | DateTime | Auto | Record created |
| `_updatedDate` | DateTime | Auto | Last updated |

### 3.4 API Design

```javascript
// fleetService.jsw

/**
 * Get all drivers for a carrier with filtering and pagination
 * @param {number} carrierDot - Carrier DOT number
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by status
 * @param {string} options.search - Search name/employee ID
 * @param {string} options.terminal - Filter by home terminal
 * @param {string} options.sortBy - Sort field (name, hire_date, status)
 * @param {string} options.sortOrder - 'asc' or 'desc'
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Items per page (default 25)
 * @returns {Promise<Object>} { drivers, total, page, pageSize, totalPages }
 */
export async function getFleetDrivers(carrierDot, options = {}) { }

/**
 * Get single driver with full details
 * @param {string} driverId - FleetDrivers record ID
 * @returns {Promise<Object>} Full driver record with related data
 */
export async function getDriverDetails(driverId) { }

/**
 * Update driver status
 * @param {string} driverId - FleetDrivers record ID
 * @param {string} newStatus - New status value
 * @param {string} reason - Reason for status change
 * @returns {Promise<Object>} Updated driver record
 */
export async function updateDriverStatus(driverId, newStatus, reason) { }

/**
 * Add new driver to fleet
 * @param {number} carrierDot - Carrier DOT number
 * @param {Object} driverData - Driver information
 * @returns {Promise<Object>} Created driver record
 */
export async function addFleetDriver(carrierDot, driverData) { }

/**
 * Export driver roster to CSV
 * @param {number} carrierDot - Carrier DOT number
 * @param {Object} filters - Active filters
 * @returns {Promise<string>} CSV data string
 */
export async function exportDriverRoster(carrierDot, filters = {}) { }

/**
 * Get expiring credentials (CDL, medical cards)
 * @param {number} carrierDot - Carrier DOT number
 * @param {number} daysAhead - Days to look ahead (default 30)
 * @returns {Promise<Array>} Drivers with expiring credentials
 */
export async function getExpiringCredentials(carrierDot, daysAhead = 30) { }
```

### 3.5 UI Mockup (ASCII)

```
+------------------------------------------------------------------------------+
|  DRIVER ROSTER                                                    [+ Add]     |
+------------------------------------------------------------------------------+
|                                                                               |
|  [Search: _______________]  [Status: All v]  [Terminal: All v]  [Export CSV]  |
|                                                                               |
+------------------------------------------------------------------------------+
|                                                                               |
|  +------------------------------------------------------------------------+  |
|  | [Chk] | Name          | Employee ID | Status   | Location    | Equip   |  |
|  +-------+---------------+-------------+----------+-------------+---------+  |
|  | [ ]   | John Smith    | EMP-001     | [*] On   | Atlanta, GA | TRK-101 |  |
|  |       | 678-555-0123  |             | Duty     | Updated 5m  |         |  |
|  +-------+---------------+-------------+----------+-------------+---------+  |
|  | [ ]   | Maria Garcia  | EMP-002     | [O] Rest | Memphis, TN | TRK-105 |  |
|  |       | 678-555-0124  |             | HOS: 4h  | Updated 2h  |         |  |
|  +-------+---------------+-------------+----------+-------------+---------+  |
|  | [ ]   | James Wilson  | EMP-003     | [!] Leave| Home        | --      |  |
|  |       | 678-555-0125  |             | Until 1/25|            |         |  |
|  +-------+---------------+-------------+----------+-------------+---------+  |
|  | [ ]   | Lisa Chen     | EMP-004     | [*] Driv | I-40 E, TN  | TRK-103 |  |
|  |       | 678-555-0126  |             |          | Updated now |         |  |
|  +-------+---------------+-------------+----------+-------------+---------+  |
|                                                                               |
|  Showing 1-4 of 47 drivers            [< Prev]  1  2  3  ...  12  [Next >]   |
|                                                                               |
+------------------------------------------------------------------------------+
|                                                                               |
|  ALERTS                                                                       |
|  +------------------------------------------------------------------------+  |
|  | [!] CDL Expiring: John Smith (Feb 15), Maria Garcia (Mar 1)            |  |
|  | [!] Medical Card Expiring: James Wilson (Jan 30)                        |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
+------------------------------------------------------------------------------+
```

---

## 4. Feature 2: Equipment Assignment

### 4.1 Overview

Track all trucks and trailers in the fleet, manage driver-equipment assignments, monitor maintenance schedules, and view assignment history.

### 4.2 Data Model: EquipmentAssets

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | String | Yes | Primary key |
| `carrier_dot` | Number | Yes | Parent carrier DOT number |
| `asset_type` | String | Yes | 'truck', 'trailer', 'other' |
| `unit_number` | String | Yes | Fleet unit number (e.g., TRK-101) |
| `vin` | String | Yes | Vehicle identification number |
| `make` | String | Yes | Manufacturer (Peterbilt, Freightliner) |
| `model` | String | Yes | Model name |
| `year` | Number | Yes | Model year |
| `license_plate` | String | Yes | Current plate number |
| `license_state` | String | Yes | Registration state |
| `registration_expiry` | Date | Yes | Registration expiration |
| `status` | String | Yes | 'active', 'maintenance', 'out_of_service', 'sold' |
| `current_mileage` | Number | No | Current odometer reading |
| `last_service_date` | Date | No | Last maintenance performed |
| `next_service_due` | Object | No | `{ date, mileage, type }` |
| `fuel_type` | String | No | 'diesel', 'natural_gas', 'electric' |
| `eld_device_id` | String | No | ELD device identifier |
| `gps_device_id` | String | No | GPS tracker device ID |
| `current_driver_id` | Reference | No | Currently assigned driver |
| `notes` | String | No | Maintenance notes |
| `_createdDate` | DateTime | Auto | Record created |
| `_updatedDate` | DateTime | Auto | Last updated |

### 4.3 Data Model: EquipmentAssignments

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | String | Yes | Primary key |
| `carrier_dot` | Number | Yes | Parent carrier DOT number |
| `equipment_id` | Reference | Yes | Link to EquipmentAssets |
| `driver_id` | Reference | Yes | Link to FleetDrivers |
| `assigned_date` | DateTime | Yes | When assignment started |
| `unassigned_date` | DateTime | No | When assignment ended |
| `assignment_type` | String | Yes | 'primary', 'temporary', 'slip_seat' |
| `reason` | String | No | Reason for assignment |
| `starting_mileage` | Number | No | Odometer at assignment start |
| `ending_mileage` | Number | No | Odometer at assignment end |
| `notes` | String | No | Assignment notes |
| `_createdDate` | DateTime | Auto | Record created |

### 4.4 Architecture

```
+------------------------------------------------------------------------------+
|                      EQUIPMENT ASSIGNMENT FLOW                                |
+------------------------------------------------------------------------------+
|                                                                               |
|  +-------------------------------+    +--------------------------------+      |
|  |      EQUIPMENT MANAGER        |    |      ASSIGNMENT PANEL          |      |
|  |      (HTML Component)         |    |      (Modal/Sidebar)           |      |
|  +-------------------------------+    +--------------------------------+      |
|  |                               |    |                                |      |
|  |  Equipment List:              |    |  Assign Equipment              |      |
|  |  +-------------------------+  |    |  +----------------------------+|      |
|  |  | TRK-101 | Active | J.S  |  |--->|  | Equipment: TRK-101        ||      |
|  |  | TRK-102 | Maint  | --   |  |    |  | Current: John Smith       ||      |
|  |  | TRK-103 | Active | L.C  |  |    |  | New Driver: [Dropdown v]  ||      |
|  |  | TRL-201 | Active | --   |  |    |  | Type: [Primary v]         ||      |
|  |  +-------------------------+  |    |  | Reason: [____________]    ||      |
|  |                               |    |  |                            ||      |
|  |  [+ Add Equipment]            |    |  | [Cancel]  [Assign]        ||      |
|  |                               |    |  +----------------------------+|      |
|  +-------------------------------+    +--------------------------------+      |
|                |                                     |                        |
|                |           postMessage               |                        |
|                v                                     v                        |
|  +--------------------------------------------------------------+            |
|  |                    equipmentService.jsw                       |            |
|  +--------------------------------------------------------------+            |
|  |                                                               |            |
|  |  + getEquipmentList(carrierDot, filters)                      |            |
|  |  + getEquipmentDetails(equipmentId)                           |            |
|  |  + addEquipment(carrierDot, equipmentData)                    |            |
|  |  + updateEquipment(equipmentId, updates)                      |            |
|  |  + assignEquipment(equipmentId, driverId, type, reason)       |            |
|  |  + unassignEquipment(equipmentId, reason)                     |            |
|  |  + getAssignmentHistory(equipmentId)                          |            |
|  |  + getDriverAssignmentHistory(driverId)                       |            |
|  |  + getMaintenanceDue(carrierDot, daysAhead)                   |            |
|  |                                                               |            |
|  +--------------------------------------------------------------+            |
|                |                                                              |
|                v                                                              |
|  +-------------------------------+    +--------------------------------+      |
|  |     EquipmentAssets          |    |   EquipmentAssignments         |      |
|  |     Collection               |    |   Collection                   |      |
|  +-------------------------------+    +--------------------------------+      |
|                                                                               |
+------------------------------------------------------------------------------+
```

### 4.5 UI Mockup (ASCII)

```
+------------------------------------------------------------------------------+
|  EQUIPMENT MANAGER                                            [+ Add Unit]    |
+------------------------------------------------------------------------------+
|                                                                               |
|  [Search: ___________]  [Type: All v]  [Status: All v]  [Show: Unassigned]   |
|                                                                               |
+----------------------------------+-------------------------------------------+
|  TRUCKS (24)                     |  EQUIPMENT DETAILS: TRK-101               |
|  +----------------------------+  |  +---------------------------------------+ |
|  | TRK-101  [*] Active        |  |  |                                       | |
|  | 2022 Peterbilt 579         |  |  |  2022 Peterbilt 579 EPIQ              | |
|  | Assigned: John Smith       |  |  |  VIN: 1XPWD49X4ND123456               | |
|  +----------------------------+  |  |                                       | |
|  | TRK-102  [!] Maintenance   |  |  |  Status: Active                       | |
|  | 2021 Freightliner Cascadia |  |  |  Mileage: 342,567 mi                  | |
|  | Unassigned                 |  |  |  Last Service: Jan 5, 2026            | |
|  +----------------------------+  |  |  Next Service: Feb 5, 2026 or 350K mi | |
|  | TRK-103  [*] Active        |  |  |                                       | |
|  | 2023 Kenworth T680         |  |  |  CURRENT ASSIGNMENT                   | |
|  | Assigned: Lisa Chen        |  |  |  +-----------------------------------+| |
|  +----------------------------+  |  |  | Driver: John Smith (EMP-001)      || |
|                                  |  |  | Since: Dec 15, 2025               || |
|  TRAILERS (18)                   |  |  | Type: Primary                     || |
|  +----------------------------+  |  |  | Starting Mileage: 320,450         || |
|  | TRL-201  [*] Active        |  |  |  +-----------------------------------+| |
|  | 2020 Great Dane 53' Dry    |  |  |                                       | |
|  | Assigned: TRK-101          |  |  |  [Reassign]  [View History]           | |
|  +----------------------------+  |  |                                       | |
|  | TRL-202  [*] Active        |  |  |  ASSIGNMENT HISTORY                   | |
|  | 2021 Utility Reefer 53'    |  |  |  +-----------------------------------+| |
|  | Assigned: TRK-103          |  |  |  | Dec 15, 2025 - Present            || |
|  +----------------------------+  |  |  | John Smith (Primary)              || |
|                                  |  |  +-----------------------------------+| |
|                                  |  |  | Sep 1 - Dec 14, 2025              || |
|                                  |  |  | Mike Johnson (Primary)            || |
|                                  |  |  | Reason: Driver reassignment       || |
|                                  |  |  +-----------------------------------+| |
|                                  |  |  | Jun 1 - Aug 31, 2025              || |
|                                  |  |  | (Multiple slip-seat drivers)      || |
|                                  |  |  +-----------------------------------+| |
|                                  |  +---------------------------------------+ |
+----------------------------------+-------------------------------------------+
```

---

## 5. Feature 3: Driver Scorecard

### 5.1 Overview

Comprehensive performance tracking for each driver including safety scores, efficiency metrics, on-time delivery rates, and customer feedback. Enables data-driven coaching and incentive programs.

### 5.2 Scoring Categories

| Category | Weight | Metrics |
|----------|--------|---------|
| Safety | 40% | CSA scores, accidents, violations, speeding events |
| Efficiency | 25% | Fuel economy (MPG), idle time %, route adherence |
| Service | 20% | On-time delivery %, customer ratings, load rejections |
| Compliance | 15% | HOS violations, ELD compliance, inspection pass rate |

### 5.3 Data Model: DriverScores

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | String | Yes | Primary key |
| `carrier_dot` | Number | Yes | Parent carrier DOT number |
| `driver_id` | Reference | Yes | Link to FleetDrivers |
| `period_start` | Date | Yes | Scoring period start |
| `period_end` | Date | Yes | Scoring period end |
| `period_type` | String | Yes | 'weekly', 'monthly', 'quarterly' |
| `overall_score` | Number | Yes | Composite score 0-100 |
| `safety_score` | Number | Yes | Safety category score 0-100 |
| `safety_details` | Object | Yes | See Safety Details below |
| `efficiency_score` | Number | Yes | Efficiency score 0-100 |
| `efficiency_details` | Object | Yes | See Efficiency Details below |
| `service_score` | Number | Yes | Service quality score 0-100 |
| `service_details` | Object | Yes | See Service Details below |
| `compliance_score` | Number | Yes | Compliance score 0-100 |
| `compliance_details` | Object | Yes | See Compliance Details below |
| `rank` | Number | No | Rank among fleet drivers |
| `trend` | String | No | 'improving', 'stable', 'declining' |
| `_createdDate` | DateTime | Auto | Record created |

#### Safety Details Object

```javascript
{
  accidents: { count: 0, severity: [] },
  violations: { count: 1, types: ['speeding'] },
  speeding_events: { count: 5, avg_over: 7 },
  hard_braking: { count: 12 },
  rapid_acceleration: { count: 8 },
  csa_score: 15,
  inspections: { passed: 3, failed: 0 }
}
```

#### Efficiency Details Object

```javascript
{
  mpg: { average: 7.2, fleet_average: 6.8 },
  idle_percentage: { value: 12, target: 10 },
  miles_driven: 8500,
  out_of_route_miles: 45,
  fuel_cost: 4250
}
```

#### Service Details Object

```javascript
{
  deliveries: { total: 42, on_time: 40, early: 38 },
  on_time_percentage: 95.2,
  customer_ratings: { average: 4.7, count: 15 },
  load_rejections: 0,
  customer_complaints: 0
}
```

#### Compliance Details Object

```javascript
{
  hos_violations: { count: 0, types: [] },
  eld_compliance: 100,
  dvir_completion: 100,
  dot_inspections: { level1: 0, level2: 1, level3: 2 },
  inspection_violations: 0
}
```

### 5.4 API Design

```javascript
// driverScorecardService.jsw

/**
 * Get driver scorecard for a specific period
 */
export async function getDriverScorecard(driverId, periodType = 'monthly') { }

/**
 * Get fleet-wide scorecard summary
 */
export async function getFleetScoreboardSummary(carrierDot, periodType) { }

/**
 * Get top/bottom performers
 */
export async function getPerformanceRankings(carrierDot, periodType, category, limit) { }

/**
 * Get driver performance trend over time
 */
export async function getDriverTrend(driverId, periods = 6) { }

/**
 * Calculate and store scorecard for a period (scheduled job)
 */
export async function calculateScorecards(carrierDot, periodStart, periodEnd) { }

/**
 * Get drivers needing coaching (below threshold)
 */
export async function getCoachingCandidates(carrierDot, threshold = 70) { }
```

### 5.5 UI Mockup (ASCII)

```
+------------------------------------------------------------------------------+
|  DRIVER SCORECARD                                       Period: [January v]   |
+------------------------------------------------------------------------------+
|                                                                               |
|  FLEET OVERVIEW                                                               |
|  +------------------------------------------------------------------------+  |
|  |  Average Score    Top Performer      Needs Coaching     Trend           |  |
|  |      82.4         Lisa Chen (94)     James W. (65)      +2.3% vs Dec   |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
+------------------------------------------------------------------------------+
|  INDIVIDUAL SCORECARD: John Smith                        [< Prev] [Next >]   |
+------------------------------------------------------------------------------+
|                                                                               |
|        OVERALL SCORE                   CATEGORY BREAKDOWN                     |
|                                                                               |
|           .-"""-.                      Safety [======== ]  85                 |
|         .'       '.                    Weight: 40%                            |
|        /    87     \                                                          |
|       |             |                  Efficiency [=======]  82               |
|       |   POINTS    |                  Weight: 25%                            |
|        \           /                                                          |
|         '.       .'                    Service [=========] 92                 |
|           '-...-'                      Weight: 20%                            |
|                                                                               |
|        Rank: 3 of 47                   Compliance [=======] 88                |
|        Trend: +4 pts                   Weight: 15%                            |
|                                                                               |
+-----------------------------------+------------------------------------------+
|  SAFETY DETAILS                   |  EFFICIENCY DETAILS                      |
|  +-------------------------------+|  +--------------------------------------+|
|  | CSA Score: 15 (Excellent)     ||  | Fuel Economy: 7.2 MPG               ||
|  | Accidents: 0                  ||  | Fleet Average: 6.8 MPG (+5.9%)      ||
|  | Violations: 1 (speeding)      ||  |                                      ||
|  | Speeding Events: 5            ||  | Idle Time: 12% (Target: 10%)        ||
|  | Hard Braking: 12              ||  | Out-of-Route: 45 mi (0.5%)          ||
|  | Inspections: 3/3 passed       ||  | Miles: 8,500                        ||
|  +-------------------------------+|  +--------------------------------------+|
+-----------------------------------+------------------------------------------+
|  SERVICE DETAILS                  |  COMPLIANCE DETAILS                      |
|  +-------------------------------+|  +--------------------------------------+|
|  | On-Time Delivery: 95.2%       ||  | HOS Violations: 0                   ||
|  | Deliveries: 40/42 on-time     ||  | ELD Compliance: 100%                ||
|  | Customer Rating: 4.7/5        ||  | DVIR Completion: 100%               ||
|  | Load Rejections: 0            ||  | DOT Inspections: 3 (0 violations)   ||
|  +-------------------------------+|  +--------------------------------------+|
+-----------------------------------+------------------------------------------+
|                                                                               |
|  PERFORMANCE TREND (6 Months)                                                 |
|  100|                                                                         |
|   90|        .--*--*                                                          |
|   80|    *--'                                                                 |
|   70| *-'                                                                     |
|   60|                                                                         |
|     +-------------------------------------------------------------------     |
|      Aug   Sep   Oct   Nov   Dec   Jan                                        |
|                                                                               |
+------------------------------------------------------------------------------+
```

---

## 6. Feature 4: Capacity Planning

### 6.1 Overview

Analyze driver availability versus load commitments to identify capacity gaps, optimize utilization, and support dispatch decisions.

### 6.2 Data Model: CapacityPlans

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | String | Yes | Primary key |
| `carrier_dot` | Number | Yes | Parent carrier DOT number |
| `plan_date` | Date | Yes | Date being planned |
| `total_drivers` | Number | Yes | Total fleet size |
| `available_drivers` | Number | Yes | Drivers available that day |
| `drivers_on_load` | Number | Yes | Drivers with assigned loads |
| `drivers_available` | Number | Yes | Drivers without loads |
| `booked_loads` | Number | Yes | Confirmed loads for the day |
| `pending_loads` | Number | No | Tentative/unconfirmed loads |
| `utilization_pct` | Number | Yes | (drivers_on_load / available_drivers) * 100 |
| `capacity_gap` | Number | Yes | booked_loads - available_drivers |
| `revenue_at_risk` | Number | No | Estimated revenue from gap |
| `recommendations` | Array | No | AI-generated suggestions |
| `_createdDate` | DateTime | Auto | Record created |
| `_updatedDate` | DateTime | Auto | Last updated |

### 6.3 Capacity Calculation Logic

```javascript
/**
 * Calculate daily capacity metrics
 */
function calculateDailyCapacity(carrierDot, date) {
  const allDrivers = getFleetDrivers(carrierDot);
  const activeDrivers = allDrivers.filter(d => d.status === 'active');
  const onLeave = allDrivers.filter(d => ['on_leave', 'medical_leave'].includes(d.status));
  const onLoad = activeDrivers.filter(d => hasActiveLoad(d, date));

  const available = activeDrivers.length - onLeave.length;
  const utilization = (onLoad.length / available) * 100;
  const bookedLoads = getBookedLoads(carrierDot, date).length;
  const gap = bookedLoads - available;

  return {
    total_drivers: allDrivers.length,
    available_drivers: available,
    drivers_on_load: onLoad.length,
    drivers_available: available - onLoad.length,
    booked_loads: bookedLoads,
    utilization_pct: utilization,
    capacity_gap: gap,
    status: gap > 0 ? 'under_capacity' : gap < -5 ? 'over_capacity' : 'balanced'
  };
}
```

### 6.4 UI Mockup (ASCII)

```
+------------------------------------------------------------------------------+
|  CAPACITY PLANNING                                      [This Week] [Month]   |
+------------------------------------------------------------------------------+
|                                                                               |
|  CAPACITY OVERVIEW: Week of Jan 20-26, 2026                                   |
|  +------------------------------------------------------------------------+  |
|  |                                                                        |  |
|  |  Utilization        Available       Capacity Gap      Revenue at Risk  |  |
|  |                                                                        |  |
|  |     78%               12              -3 DRIVERS        $0             |  |
|  |   [=======  ]      of 47 active    (Over capacity)    (No gaps)        |  |
|  |                                                                        |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
+------------------------------------------------------------------------------+
|  DAILY BREAKDOWN                                                              |
+------------------------------------------------------------------------------+
|                                                                               |
|       Mon 20    Tue 21    Wed 22    Thu 23    Fri 24    Sat 25    Sun 26     |
|  +------------------------------------------------------------------------+  |
|  |                                                                        |  |
|  |  45 |  *       *        *         *                                    |  |
|  |     |                              *        *                          |  |
|  |  40 |  +---+   +---+    +---+     +---+    +---+                       |  |
|  |     |  |   |   |   |    |   |     |   |    |   |    +---+    +---+     |  |
|  |  35 |  |   |   |   |    |   |     |   |    |   |    |   |    |   |     |  |
|  |     |  | B |   | B |    | B |     | B |    | B |    | B |    | B |     |  |
|  |  30 |  | O |   | O |    | O |     | O |    | O |    | O |    | O |     |  |
|  |     |  | O |   | O |    | O |     | O |    | O |    | O |    | O |     |  |
|  |  25 |  | K |   | K |    | K |     | K |    | K |    | K |    | K |     |  |
|  |     |  | E |   | E |    | E |     | E |    | E |    | E |    | E |     |  |
|  |  20 |  | D |   | D |    | D |     | D |    | D |    | D |    | D |     |  |
|  |     +--+---+---+---+----+---+-----+---+----+---+----+---+----+---+-----+  |
|  |                                                                        |  |
|  |     Legend: [Bars] = Booked Loads   * = Available Drivers              |  |
|  |                                                                        |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
|  DRIVER AVAILABILITY DETAILS                                                  |
|  +------------------------------------------------------------------------+  |
|  | Status              Mon   Tue   Wed   Thu   Fri   Sat   Sun            |  |
|  +--------------------+-----+-----+-----+-----+-----+-----+-----+---------+  |
|  | On Load            | 35  | 36  | 38  | 40  | 38  | 25  | 22  |         |  |
|  | Available          | 10  | 9   | 7   | 5   | 7   | 10  | 12  |         |  |
|  | On Leave           | 2   | 2   | 2   | 2   | 2   | 12  | 13  |         |  |
|  | Utilization %      | 78% | 80% | 84% | 89% | 84% | 71% | 65% |         |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
|  RECOMMENDATIONS                                                              |
|  +------------------------------------------------------------------------+  |
|  | [!] Thursday has lowest availability (5 drivers). Consider:            |  |
|  |     - Rescheduling 2 loads from Thursday to Friday                     |  |
|  |     - Contacting owner-operators for Thursday coverage                 |  |
|  | [i] Weekend capacity strong - good opportunity for spot market loads   |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
+------------------------------------------------------------------------------+
```

---

## 7. Feature 5: Real-Time Location (ELD Integration)

### 7.1 Overview

Display real-time driver locations on an interactive map using data from ELD providers. Show current routes, estimated arrival times, and HOS status.

### 7.2 ELD Integration Architecture

```
+------------------------------------------------------------------------------+
|                          ELD INTEGRATION FLOW                                 |
+------------------------------------------------------------------------------+
|                                                                               |
|   ELD PROVIDERS                  LMDR BACKEND                   FRONTEND     |
|   =============                  ============                   ========     |
|                                                                               |
|  +-------------+                +------------------+                          |
|  | Motive API  |--------------->|                  |                          |
|  +-------------+                |                  |                          |
|                                 |  eldIntegration  |       +---------------+  |
|  +-------------+                |  Service.jsw     |------>| DriverLocations|  |
|  | Samsara API |--------------->|                  |       | Collection    |  |
|  +-------------+                |  Functions:      |       +-------+-------+  |
|                                 |  - syncLocations |               |          |
|  +-------------+                |  - getDriverPos  |               v          |
|  | Omnitracs   |--------------->|  - getHOSStatus  |       +---------------+  |
|  | API         |                |  - getRouteETA   |       | FLEET_MAP.html|  |
|  +-------------+                |                  |       |               |  |
|                                 +------------------+       | [Map View]    |  |
|  +-------------+                        ^                  | [Driver List] |  |
|  | GPS Trackit |------------------------+                  | [Route Info]  |  |
|  +-------------+                                           +---------------+  |
|                                                                               |
+------------------------------------------------------------------------------+
|                                                                               |
|  DATA SYNC FLOW:                                                              |
|  1. Carrier connects ELD account via OAuth (one-time setup)                   |
|  2. Background job polls ELD API every 5 minutes                              |
|  3. Location data normalized and stored in DriverLocations                    |
|  4. Frontend refreshes map every 30 seconds                                   |
|                                                                               |
+------------------------------------------------------------------------------+
```

### 7.3 Data Model: ELDConnections

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | String | Yes | Primary key |
| `carrier_dot` | Number | Yes | Parent carrier DOT number |
| `provider` | String | Yes | 'motive', 'samsara', 'omnitracs', 'gps_trackit' |
| `api_key` | String | Yes | Encrypted API key/token |
| `account_id` | String | No | Provider account identifier |
| `is_active` | Boolean | Yes | Connection enabled |
| `last_sync` | DateTime | No | Last successful sync |
| `sync_errors` | Array | No | Recent sync error messages |
| `_createdDate` | DateTime | Auto | Record created |
| `_updatedDate` | DateTime | Auto | Last updated |

### 7.4 Data Model: DriverLocations

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | String | Yes | Primary key |
| `carrier_dot` | Number | Yes | Parent carrier DOT number |
| `driver_id` | Reference | Yes | Link to FleetDrivers |
| `latitude` | Number | Yes | Current latitude |
| `longitude` | Number | Yes | Current longitude |
| `heading` | Number | No | Direction in degrees |
| `speed_mph` | Number | No | Current speed |
| `location_city` | String | No | Nearest city |
| `location_state` | String | No | State code |
| `location_address` | String | No | Street address if available |
| `timestamp` | DateTime | Yes | When position was recorded |
| `source` | String | Yes | ELD provider name |
| `hos_status` | String | No | 'driving', 'on_duty', 'sleeper', 'off_duty' |
| `hos_remaining` | Number | No | Minutes remaining in current status |
| `current_load_id` | String | No | Active load identifier |
| `destination` | Object | No | `{ lat, lng, city, state, eta }` |
| `route_polyline` | String | No | Encoded polyline for route |
| `_createdDate` | DateTime | Auto | Record created |
| `_updatedDate` | DateTime | Auto | Last updated |

### 7.5 API Design

```javascript
// eldIntegrationService.jsw

/**
 * Connect carrier to ELD provider
 */
export async function connectELDProvider(carrierDot, provider, credentials) { }

/**
 * Disconnect ELD provider
 */
export async function disconnectELDProvider(carrierDot, provider) { }

/**
 * Sync driver locations from ELD provider (called by scheduled job)
 */
export async function syncDriverLocations(carrierDot) { }

/**
 * Get all driver locations for map display
 */
export async function getFleetLocations(carrierDot) { }

/**
 * Get single driver location with route info
 */
export async function getDriverLocation(driverId) { }

/**
 * Get HOS status for all drivers
 */
export async function getFleetHOSStatus(carrierDot) { }
```

### 7.6 UI Mockup (ASCII)

```
+------------------------------------------------------------------------------+
|  FLEET MAP                                         [Refresh] [Full Screen]    |
+------------------------------------------------------------------------------+
|                                                                               |
|  +---------------------------------------------------+  +------------------+ |
|  |                                                   |  | DRIVER LIST      | |
|  |                    MAP VIEW                       |  +------------------+ |
|  |                                                   |  |                  | |
|  |      .-----.                                      |  | [*] John S.      | |
|  |     /       \              [T] John S.            |  |     I-40 E, TN   | |
|  |    |  TN    |              Driving                |  |     67 mph       | |
|  |    |        |                                     |  |     HOS: 6h 23m  | |
|  |     \       /                                     |  |                  | |
|  |      '-----'                                      |  | [O] Maria G.     | |
|  |                                                   |  |     Rest Area    | |
|  |                          [T] Lisa C.              |  |     Memphis, TN  | |
|  |            .-----.       Driving                  |  |     HOS: Sleeper | |
|  |           /       \                               |  |                  | |
|  |          |  GA    |                               |  | [*] Lisa C.      | |
|  |          |        |                               |  |     I-20 W, GA   | |
|  |           \       /                               |  |     62 mph       | |
|  |            '-----'                                |  |     HOS: 8h 45m  | |
|  |                    [T] Mike J.                    |  |                  | |
|  |                    On Duty (Loading)              |  | [L] Mike J.      | |
|  |                                                   |  |     Shipper XYZ  | |
|  +---------------------------------------------------+  |     Atlanta, GA  | |
|                                                         |     Loading      | |
|  LEGEND: [T]=Truck Moving  [O]=Resting  [L]=Loading     |                  | |
|          Route line: ---- planned  ==== completed       +------------------+ |
|                                                                               |
+------------------------------------------------------------------------------+
|  SELECTED: John Smith                                                         |
|  +------------------------------------------------------------------------+  |
|  |  Current Location: I-40 Eastbound, Mile Marker 234, Cookeville, TN     |  |
|  |  Speed: 67 mph  |  Heading: East  |  Last Update: 30 sec ago           |  |
|  |                                                                        |  |
|  |  LOAD INFO                          HOS STATUS                         |  |
|  |  Load #: LD-2026-1234              Drive Time Remaining: 6h 23m        |  |
|  |  Origin: Atlanta, GA               On-Duty Time Remaining: 8h 15m      |  |
|  |  Dest: Nashville, TN               Break Required By: 2:45 PM          |  |
|  |  ETA: 1:30 PM (On Time)            Cycle Remaining: 52h 30m            |  |
|  |                                                                        |  |
|  |  [View Full Route]  [Send Message]  [Call Driver]                      |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
+------------------------------------------------------------------------------+
```

---

## 8. Security & Access Control

### 8.1 Role-Based Access

| Role | Driver Roster | Equipment | Scorecard | Capacity | Location |
|------|--------------|-----------|-----------|----------|----------|
| Carrier Admin | Full | Full | Full | Full | Full |
| Dispatcher | Read + Status | Read + Assign | Read | Full | Full |
| Safety Manager | Read | Read | Full | Read | Read |
| Driver (Self) | Self Only | Assigned Only | Self Only | None | Self Only |

### 8.2 Data Isolation

All queries MUST filter by `carrier_dot` to ensure carriers only see their own fleet data:

```javascript
// Example enforcement pattern
async function getFleetDrivers(carrierDot, options) {
  // Verify caller has access to this carrier
  await verifyCarrierAccess(carrierDot);

  // Always filter by carrier
  return wixData.query('FleetDrivers')
    .eq('carrier_dot', carrierDot)
    // ... additional filters
    .find({ suppressAuth: true });
}
```

---

## 9. Integration Points

### 9.1 Existing Services

| Service | Integration |
|---------|-------------|
| `carrierPreferences.jsw` | Links fleet requirements to matching |
| `driverMatching.jsw` | Capacity data informs driver search urgency |
| `subscriptionService.jsw` | Fleet dashboard access gated by tier |

### 9.2 TMS Integration Patterns

```
+------------------------------------------------------------------------------+
|                         TMS INTEGRATION OPTIONS                               |
+------------------------------------------------------------------------------+
|                                                                               |
|  OPTION A: API Push (Preferred)                                               |
|  +------------------------------------------------------------------------+  |
|  |                                                                        |  |
|  |   TMS System ----[webhook]----> LMDR HTTP Endpoint                     |  |
|  |                                     |                                  |  |
|  |                                     v                                  |  |
|  |                               Parse & Validate                         |  |
|  |                                     |                                  |  |
|  |                                     v                                  |  |
|  |                             Update Collections                         |  |
|  |                                                                        |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
|  OPTION B: API Pull (Scheduled)                                               |
|  +------------------------------------------------------------------------+  |
|  |                                                                        |  |
|  |   Scheduled Job (every 5 min)                                          |  |
|  |        |                                                               |  |
|  |        v                                                               |  |
|  |   Call TMS API -----> Transform Data -----> Update Collections         |  |
|  |                                                                        |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
|  OPTION C: Manual Import                                                      |
|  +------------------------------------------------------------------------+  |
|  |                                                                        |  |
|  |   User uploads CSV -----> Parse & Validate -----> Update Collections   |  |
|  |                                                                        |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
+------------------------------------------------------------------------------+
```

---

## 10. Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Dashboard adoption | 0% | 60% of carriers | Weekly active users |
| Time to find driver status | N/A | <5 seconds | Average lookup time |
| Equipment utilization visibility | None | 100% | Assets tracked in system |
| Scorecard review frequency | Quarterly | Weekly | Views per carrier |
| Location data freshness | N/A | <5 min | Average data age |

---

## 11. Open Questions

1. **ELD Provider Priority**: Which ELD providers should we integrate first? Motive and Samsara have largest market share.
2. **Historical Data**: How much history should we retain? (Location: 30 days, Scores: 2 years, Assignments: Forever)
3. **Offline Access**: Should mobile app support offline scorecard viewing?
4. **Driver Self-Service**: Should drivers be able to view/dispute their scores?
5. **TMS Integration Depth**: Deep integration (loads, settlements) or just capacity data?
