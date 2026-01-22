# Specification: Driver Road Utilities

## 1. Overview

This track transforms LMDR from a job-hunting platform into a **daily-use operating system for CDL drivers**. By providing essential on-the-road utilities, we create a "sticky" platform that drivers return to every day, not just when job hunting.

### 1.1 Core Features

| Feature | Description | Value Proposition |
|---------|-------------|-------------------|
| **Parking Finder** | Real-time truck parking availability | Solves #1 driver pain point |
| **Fuel Optimizer** | Find cheapest diesel along route | Saves $200-500/month |
| **Weigh Station Status** | Open/closed/PrePass status | Saves 15-30 min per trip |
| **Rest Stop Ratings** | Driver-submitted reviews | Community trust building |
| **Weather Alerts** | Route-specific weather warnings | Safety critical |
| **Road Conditions** | Construction, closures, chains | Trip planning essential |

### 1.2 Strategic Goals

- **Daily Active Users:** Increase driver DAU from job-search cadence (weekly) to daily utility usage
- **Platform Stickiness:** Create switching cost - drivers won't leave platform they rely on daily
- **Data Moat:** Driver-generated content (reviews, reports) creates defensible competitive advantage
- **Premium Upsell:** Advanced features (route optimization, fuel card integration) for paid tiers

### 1.3 Business Impact

```
+------------------------------------------------------------------+
|                    PLATFORM TRANSFORMATION                         |
+------------------------------------------------------------------+
|                                                                    |
|   BEFORE: Job Hunting Tool              AFTER: Driver OS           |
|   +-----------------------+             +-----------------------+  |
|   |  Visit when:          |             |  Visit when:          |  |
|   |  - Looking for job    |             |  - Need parking       |  |
|   |  - Checking app status|             |  - Buying fuel        |  |
|   |                       |             |  - Checking weather   |  |
|   |  Frequency: Weekly    |             |  - Planning route     |  |
|   |  Session: 10 min      |             |  - Rating stop        |  |
|   +-----------------------+             |  - Checking weigh stn |  |
|                                         |                       |  |
|                                         |  Frequency: 3-5x/day  |  |
|                                         |  Session: 2-15 min    |  |
|                                         +-----------------------+  |
|                                                                    |
|   RETENTION IMPACT:                                                |
|   - 7-day retention: 15% --> 65%                                   |
|   - 30-day retention: 5% --> 45%                                   |
|   - Monthly active: 1,000 --> 8,000+ (projected)                   |
|                                                                    |
+------------------------------------------------------------------+
```

---

## 2. Architecture Overview

### 2.1 System Architecture

```
+-----------------------------------------------------------------------------------+
|                           DRIVER ROAD UTILITIES SYSTEM                             |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|   +-------------------------+    +-------------------------+    +----------------+ |
|   |   PARKING FINDER        |    |   FUEL OPTIMIZER        |    | WEIGH STATION  | |
|   +-------------------------+    +-------------------------+    +----------------+ |
|            |                              |                           |            |
|            v                              v                           v            |
|   +-------------------------+    +-------------------------+    +----------------+ |
|   | parkingService.jsw      |    | fuelService.jsw         |    | weighStation   | |
|   | - searchParking()       |    | - searchFuel()          |    | Service.jsw    | |
|   | - checkAvailability()   |    | - calculateSavings()    |    | - getStatus()  | |
|   | - reportParking()       |    | - getFuelCards()        |    | - getPrePass() | |
|   +-------------------------+    +-------------------------+    +----------------+ |
|            |                              |                           |            |
|            v                              v                           v            |
|   +-------------------------+    +-------------------------+    +----------------+ |
|   | TruckParkingClub API    |    | GasBuddy API            |    | DriveWyze API  | |
|   | ParkMyTruck API         |    | OPIS Fuel Pricing       |    | PrePass API    | |
|   | Pilot/Flying J API      |    | Comdata/EFS (fuel cards)|    | State DOT APIs | |
|   +-------------------------+    +-------------------------+    +----------------+ |
|                                                                                    |
|   +-------------------------+    +-------------------------+    +----------------+ |
|   |   REST STOP RATINGS     |    |   WEATHER ALERTS        |    | ROAD CONDITIONS| |
|   +-------------------------+    +-------------------------+    +----------------+ |
|            |                              |                           |            |
|            v                              v                           v            |
|   +-------------------------+    +-------------------------+    +----------------+ |
|   | restStopService.jsw     |    | weatherAlertService.jsw |    | roadCondition  | |
|   | - getReviews()          |    | - getRouteWeather()     |    | Service.jsw    | |
|   | - submitReview()        |    | - subscribeAlerts()     |    | - getClosures()| |
|   | - reportCondition()     |    | - getAlertHistory()     |    | - getChains()  | |
|   +-------------------------+    +-------------------------+    +----------------+ |
|            |                              |                           |            |
|            v                              v                           v            |
|   +-------------------------+    +-------------------------+    +----------------+ |
|   | RestStopReviews (local) |    | NWS Weather API         |    | State DOT APIs | |
|   | Community Reports       |    | OpenWeatherMap          |    | 511 Systems    | |
|   | (driver-generated)      |    | Tomorrow.io             |    | FHWA Data      | |
|   +-------------------------+    +-------------------------+    +----------------+ |
|                                                                                    |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|   SHARED INFRASTRUCTURE                                                            |
|   +-------------------------+    +-------------------------+    +----------------+ |
|   | locationService.jsw     |    | cacheService.jsw        |    | External API   | |
|   | - geocode()             |    | - get/set with TTL      |    | Manager        | |
|   | - reverseGeocode()      |    | - invalidate()          |    | - rate limits  | |
|   | - calculateDistance()   |    | - warmCache()           |    | - fallbacks    | |
|   +-------------------------+    +-------------------------+    +----------------+ |
|                                                                                    |
+-----------------------------------------------------------------------------------+
```

### 2.2 Data Flow Architecture

```
+------------------------------------------------------------------+
|                    DATA FLOW: PARKING FINDER                       |
+------------------------------------------------------------------+
|                                                                    |
|   1. Driver opens Parking Finder                                   |
|      +--------------------------------------------------+          |
|      |  DRIVER_ROAD_UTILITIES.html                      |          |
|      |  -> postMessage('searchParking', {lat, lng, radius})        |
|      +--------------------------------------------------+          |
|                             |                                      |
|   2. Velo Page Code         v                                      |
|      +--------------------------------------------------+          |
|      |  roadUtilities.xxxxx.js                          |          |
|      |  -> parkingService.searchParking(lat, lng, radius)          |
|      +--------------------------------------------------+          |
|                             |                                      |
|   3. Backend Service        v                                      |
|      +--------------------------------------------------+          |
|      |  parkingService.jsw                              |          |
|      |  a. Check cache for recent results               |          |
|      |  b. If miss: call TruckParkingClub API           |          |
|      |  c. Merge with Pilot/Flying J data               |          |
|      |  d. Add local driver reports                     |          |
|      |  e. Calculate distances and sort                 |          |
|      |  f. Cache results (5 min TTL)                    |          |
|      +--------------------------------------------------+          |
|                             |                                      |
|   4. Response               v                                      |
|      +--------------------------------------------------+          |
|      |  {                                               |          |
|      |    results: [                                    |          |
|      |      {                                           |          |
|      |        name: "Pilot Travel Center #284",         |          |
|      |        location: {lat: 35.123, lng: -89.456},    |          |
|      |        distance_miles: 2.3,                      |          |
|      |        available_spaces: 45,                     |          |
|      |        total_spaces: 120,                        |          |
|      |        amenities: ["shower", "laundry", "wifi"], |          |
|      |        rating: 4.2,                              |          |
|      |        last_updated: "2026-01-20T10:30:00Z",     |          |
|      |        source: "truckparkingclub"                |          |
|      |      },                                          |          |
|      |      ...                                         |          |
|      |    ]                                             |          |
|      |  }                                               |          |
|      +--------------------------------------------------+          |
|                                                                    |
+------------------------------------------------------------------+
```

---

## 3. Feature 1: Parking Finder

### 3.1 Problem Statement

Truck parking is the #1 pain point for CDL drivers:
- 98% of drivers report difficulty finding parking (ATRI study)
- Average search time: 56 minutes per night
- Safety risk: Fatigued driving while searching for parking
- Legal risk: Parking illegally due to lack of options

### 3.2 Solution

Real-time parking availability showing:
- Truck stops (Pilot, Flying J, Love's, TA)
- Rest areas (state and interstate)
- Walmart lots (where permitted)
- Industrial areas (community reported)

### 3.3 External API Integrations

| Provider | Data | Cost Model | Notes |
|----------|------|------------|-------|
| **TruckParkingClub** | Real-time availability at 5,000+ locations | Per-query or subscription | Primary data source |
| **ParkMyTruck** | Community-reported spots | Free tier available | Supplement primary |
| **Pilot Flying J API** | Exact availability at Pilot/FJ | Partnership required | Direct integration |
| **Love's Connect** | Love's location availability | Partnership required | Future integration |
| **State DOT APIs** | Rest area status | Free (public data) | 40+ states available |

### 3.4 Data Model

**ParkingLocations Collection**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `external_id` | String | ID from source API |
| `source` | String | truckparkingclub, pilotflyingj, state_dot, community |
| `name` | String | Location name |
| `location` | Object | `{lat, lng}` |
| `address` | Object | `{street, city, state, zip}` |
| `total_spaces` | Number | Total truck parking spaces |
| `available_spaces` | Number | Currently available (null if unknown) |
| `availability_confidence` | String | real_time, estimated, unknown |
| `amenities` | Array[String] | shower, laundry, wifi, restaurant, fuel, repair, scales |
| `hours` | Object | `{open, close}` or `24_hours: true` |
| `avg_rating` | Number | 1-5 rating |
| `review_count` | Number | Number of reviews |
| `last_availability_update` | DateTime | When availability was last confirmed |
| `data_fetched_at` | DateTime | When record was fetched from source |

**ParkingReports Collection (Community)**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `location_id` | String | FK to ParkingLocations |
| `driver_id` | String | FK to DriverProfiles |
| `report_type` | String | availability, condition, hazard |
| `spaces_available` | Number | Reported available spaces |
| `condition_notes` | String | Free text notes |
| `reported_at` | DateTime | When report was submitted |
| `upvotes` | Number | Community validation |
| `is_verified` | Boolean | Verified by multiple drivers |

### 3.5 API Design

```javascript
// parkingService.jsw

/**
 * Search for truck parking near a location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Search radius in miles (default 25)
 * @param {Object} filters - {amenities: [], minRating: 3, availableOnly: true}
 * @returns {Object} {results: ParkingLocation[], meta: {total, sources}}
 */
export async function searchParking(lat, lng, radius = 25, filters = {}) {
  // 1. Check cache for recent search in same area
  // 2. Query TruckParkingClub API
  // 3. Query state DOT for rest areas
  // 4. Merge with community reports (last 2 hours)
  // 5. Apply filters
  // 6. Calculate distances and sort by distance
  // 7. Cache results (5 min TTL)
  // 8. Return results with source attribution
}

/**
 * Get detailed info for a specific parking location
 * @param {string} locationId
 * @returns {Object} Full location details with reviews
 */
export async function getParkingDetails(locationId) {
  // Include recent reviews, amenity details, photos
}

/**
 * Submit a parking availability report
 * @param {string} locationId
 * @param {Object} report - {spacesAvailable, notes}
 * @returns {Object} {success, reportId}
 */
export async function reportParkingAvailability(locationId, report) {
  // Validate driver is logged in
  // Check for recent report from same driver (rate limit)
  // Save report
  // Update location's estimated availability
}

/**
 * Get parking along a route
 * @param {Array} routePoints - Array of {lat, lng} waypoints
 * @param {Object} options - {interval: 100, amenities: []}
 * @returns {Array} Parking options at regular intervals
 */
export async function getParkingAlongRoute(routePoints, options = {}) {
  // Calculate points at regular intervals along route
  // Search parking near each point
  // Return consolidated results with ETA
}
```

### 3.6 UI Design

```
+------------------------------------------------------------------+
|  PARKING FINDER                                    [Map] [List]    |
+------------------------------------------------------------------+
|                                                                    |
|  +--- Search Bar --------------------------------------------------+
|  |  [Current Location v]  Within [25 mi v]  [Search]              |
|  |  [ ] Showers  [ ] WiFi  [ ] Restaurant  [ ] Available Only     |
|  +----------------------------------------------------------------+
|                                                                    |
|  +--- Map View ----------------------------------------------------+
|  |                                                                 |
|  |        *Pilot #284 (45/120)                                     |
|  |                    [YOU]                                        |
|  |    *Rest Area (unknown)                                         |
|  |                                                                 |
|  |                *TA Memphis (12/80)                              |
|  |                                                                 |
|  |  Legend: * Green = Available  * Yellow = Limited  * Red = Full |
|  +----------------------------------------------------------------+
|                                                                    |
|  +--- Results List ------------------------------------------------+
|  |                                                                 |
|  |  +--- Pilot Travel Center #284 ------------------ 2.3 mi ----+ |
|  |  |  [GREEN] 45 of 120 spaces available                       | |
|  |  |  Updated 5 min ago (real-time)                            | |
|  |  |  Amenities: Shower | WiFi | Restaurant | Fuel             | |
|  |  |  Rating: **** (4.2) - 156 reviews                         | |
|  |  |  [Navigate]  [Details]  [Report Parking]                  | |
|  |  +-----------------------------------------------------------+ |
|  |                                                                 |
|  |  +--- I-40 Rest Area (Mile 28) ------------------ 5.1 mi ----+ |
|  |  |  [YELLOW] ~15 spaces (driver reported 20 min ago)         | |
|  |  |  Amenities: Restrooms | Vending | Pet Area                | |
|  |  |  Rating: *** (3.4) - 42 reviews                           | |
|  |  |  [Navigate]  [Details]  [Report Parking]                  | |
|  |  +-----------------------------------------------------------+ |
|  |                                                                 |
|  |  +--- Walmart Supercenter #1234 ----------------- 8.7 mi ----+ |
|  |  |  [?] Availability unknown - overnight OK per manager      | |
|  |  |  Amenities: None (retail store)                           | |
|  |  |  Rating: ** (2.8) - 23 reviews                            | |
|  |  |  [Navigate]  [Details]  [Report Parking]                  | |
|  |  +-----------------------------------------------------------+ |
|  +----------------------------------------------------------------+
|                                                                    |
+------------------------------------------------------------------+
```

---

## 3.7 TPIMS Integration (Implemented)

### What is TPIMS?

The **Truck Parking Information Management System (TPIMS)** is a federally-funded initiative under FHWA that provides real-time truck parking availability through sensor networks at rest areas across major freight corridors.

### Why TPIMS?

| Data Source | Data Quality | Coverage | Cost |
|-------------|--------------|----------|------|
| TruckParkingClub | Community reported | National | Paid API |
| TPIMS Sensors | **Real-time sensors** | Regional (growing) | **FREE** |

TPIMS provides **sensor-based** data vs. community-reported estimates, giving drivers actual availability counts.

### Implementation Architecture

```
+------------------------------------------------------------------+
|                    TPIMS MULTI-SOURCE AGGREGATION                   |
+------------------------------------------------------------------+
|                                                                    |
|   queryAllTPIMSSources(lat, lng, radius)                           |
|         |                                                          |
|         +---> queryIndianaTPIMS()      --> normalizeIndianaData()  |
|         +---> queryKentuckyTPIMS()     --> normalizeMAASTO()       |
|         +---> queryMinnesotaTPIMS()    --> normalizeMAASTO()       |
|         +---> queryIllinoisTPIMS()     --> normalizeMAASTO()       |
|         +---> queryOHGOAPI()           --> normalizeOHGOData()     |
|         +---> queryWI511API()          --> normalizeWI511Data()    |
|         +---> queryArizonaTPIMS()      --> normalizeArizonaData()  |
|         +---> queryGeorgiaTPIMS()      --> normalizeGeorgiaData()  |
|         +---> queryCaliforniaRestAreas()--> normalizeCaliforniaData()|
|         |                                                          |
|         v                                                          |
|   flattenAndMerge() with confidence ranking                        |
|         |                                                          |
|         v                                                          |
|   Unified results with data_confidence field                       |
|   - 'sensor' (real TPIMS data)                                     |
|   - 'reported' (community)                                         |
|   - 'estimated' (algorithm)                                        |
|   - 'static' (location only)                                       |
|                                                                    |
+------------------------------------------------------------------+
```

### State Coverage (9 States Implemented)

#### MAASTO Midwest Coalition (6 States)

| State | API | Format | Public | Highways |
|-------|-----|--------|--------|----------|
| Indiana | TrafficWise | GeoJSON | Yes | I-65, I-69, I-70 |
| Kentucky | TRIMARC | MAASTO JSON | Yes | I-65, I-71, I-75 |
| Minnesota | MnDOT IRIS | MAASTO JSON | Yes | I-94, I-35 |
| Illinois | TravelMidwest | MAASTO JSON | Yes | I-80, I-55, I-57 |
| Ohio | OHGO | REST API | Key Required | I-70, I-75 |
| Wisconsin | 511WI | REST API | Key Required | I-94, I-90 |

#### Southern/Western States (3 States)

| State | API | Format | Public | Highways |
|-------|-----|--------|--------|----------|
| Arizona | AZ511 | REST API | Yes | I-10, I-40, I-17 |
| Georgia | GA511 | REST API | Optional | I-75, I-85, I-20, I-95 |
| California | Caltrans ArcGIS | GeoJSON | Yes | Statewide (static) |

### Data Confidence System

```javascript
// Confidence ranking (higher = better)
const confidenceRank = {
    'sensor': 3,      // Real TPIMS sensor data
    'reported': 2,    // Community reports (< 2 hours old)
    'estimated': 1,   // Algorithm estimates
    'static': 0       // Location only, no availability
};
```

When merging results from multiple sources, **sensor data always wins**.

### Circuit Breaker Pattern

Each API has independent circuit breaker state to prevent cascade failures:

```javascript
const circuitBreaker = {
    indiana: { failures: 0, lastFailure: 0, status: 'CLOSED' },
    kentucky: { failures: 0, lastFailure: 0, status: 'CLOSED' },
    // ... 9 total states
};
```

- **CLOSED**: Normal operation
- **OPEN**: Skip API after 3 consecutive failures (60s cooldown)
- **HALF_OPEN**: Try one request after cooldown

### UI Badges

The frontend displays data confidence with visual badges:

```html
<!-- Sensor data (real-time) -->
<span class="bg-blue-100 text-blue-700">
  <i class="fa-solid fa-signal"></i> LIVE
</span>

<!-- Community reported -->
<span class="bg-green-100 text-green-700">
  <i class="fa-solid fa-users"></i> REPORTED
</span>

<!-- Static location data -->
<span class="bg-gray-100 text-gray-500">
  <i class="fa-solid fa-map-pin"></i> LOCATION
</span>
```

### Future Expansion

States with TPIMS that could be added:
- Iowa (registration required)
- Kansas (registration required)
- Michigan (registration required)
- Texas (DriveTexas API - needs research)
- Florida (TPAS - no public docs)

---

## 4. Feature 2: Fuel Optimizer

### 4.1 Problem Statement

Fuel is the largest operating expense for owner-operators:
- Average: $70,000-$100,000/year on diesel
- Price variance: $0.30-$0.80/gallon across stops
- Fuel card discounts vary by location
- Poor planning costs $200-500/month

### 4.2 Solution

Find cheapest diesel along route with:
- Real-time pricing
- Fuel card discount integration
- Savings calculator
- Price trend alerts

### 4.3 External API Integrations

| Provider | Data | Cost Model | Notes |
|----------|------|------------|-------|
| **GasBuddy API** | Real-time diesel prices | Per-query pricing | Primary pricing source |
| **OPIS** | Wholesale/rack pricing | Enterprise pricing | Price validation |
| **Comdata** | Comdata card discounts | Partnership | Fuel card integration |
| **EFS (WEX)** | EFS card discounts | Partnership | Fuel card integration |
| **Pilot RoadWarrior** | Pilot/FJ pricing | Partnership | Direct integration |

### 4.4 Data Model

**FuelPrices Collection**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `station_id` | String | External station ID |
| `station_name` | String | Station name |
| `brand` | String | Pilot, FlyingJ, Loves, TA, Independent |
| `location` | Object | `{lat, lng}` |
| `address` | Object | Full address |
| `diesel_price` | Number | Retail price per gallon |
| `def_price` | Number | DEF price per gallon |
| `reefer_price` | Number | Reefer fuel price (if different) |
| `card_discounts` | Object | `{comdata: 0.05, efs: 0.03}` |
| `amenities` | Array | CAT scales, truck wash, etc. |
| `price_updated_at` | DateTime | When price was last confirmed |
| `source` | String | gasbuddy, opis, direct |

**FuelCards Collection**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `driver_id` | String | FK to DriverProfiles |
| `card_type` | String | comdata, efs, tchek, fleet_one |
| `card_number_last4` | String | Last 4 digits for display |
| `is_primary` | Boolean | Primary fuel card |
| `linked_at` | DateTime | When card was linked |

**FuelTransactions Collection (Future)**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `driver_id` | String | FK to DriverProfiles |
| `station_id` | String | FK to FuelPrices |
| `gallons` | Number | Gallons purchased |
| `price_per_gallon` | Number | Actual price paid |
| `total_amount` | Number | Total transaction |
| `card_discount` | Number | Discount applied |
| `transaction_date` | DateTime | When purchase occurred |

### 4.5 API Design

```javascript
// fuelService.jsw

/**
 * Search for diesel prices near location
 * @param {number} lat
 * @param {number} lng
 * @param {number} radius - Miles
 * @param {Object} options - {cardType: 'comdata', brands: ['pilot', 'loves']}
 * @returns {Array} Fuel stations sorted by effective price
 */
export async function searchFuelPrices(lat, lng, radius = 25, options = {}) {
  // 1. Query GasBuddy API for prices
  // 2. Apply fuel card discounts if driver has card linked
  // 3. Calculate effective price (retail - discount)
  // 4. Sort by effective price
  // 5. Return with savings calculation
}

/**
 * Get fuel prices along a route
 * @param {Array} routePoints - Waypoints
 * @param {Object} options - {tankRange: 300, currentFuel: 0.5}
 * @returns {Array} Optimal fuel stops with cost analysis
 */
export async function getFuelAlongRoute(routePoints, options = {}) {
  // Calculate optimal fuel stops based on tank range
  // Consider price vs detour tradeoff
  // Return suggested stops with total trip fuel cost
}

/**
 * Calculate potential savings
 * @param {string} driverId
 * @param {Object} tripDetails - {miles, mpg, routePoints}
 * @returns {Object} Savings analysis
 */
export async function calculateFuelSavings(driverId, tripDetails) {
  // Compare optimal stops vs random stops
  // Calculate annual savings potential
}

/**
 * Link fuel card for discount calculations
 * @param {string} driverId
 * @param {Object} cardInfo - {type, last4}
 */
export async function linkFuelCard(driverId, cardInfo) {
  // Validate card type
  // Store card reference (no full numbers)
}

/**
 * Get price trends for a region
 * @param {string} state
 * @param {number} days - History days
 * @returns {Object} Price trend data
 */
export async function getFuelPriceTrends(state, days = 30) {
  // Aggregate historical prices
  // Calculate trend direction
  // Return for charting
}
```

### 4.6 UI Design

```
+------------------------------------------------------------------+
|  FUEL OPTIMIZER                                   [Route] [Near Me]|
+------------------------------------------------------------------+
|                                                                    |
|  +--- Your Fuel Card ------------------------------------------+   |
|  |  Comdata (**** 4521)              [Change] [Add Card]       |   |
|  +-------------------------------------------------------------+   |
|                                                                    |
|  +--- Search ----------------------------------------------------+ |
|  |  [Current Location v]  Within [50 mi v]  [Search]             | |
|  +---------------------------------------------------------------+ |
|                                                                    |
|  +--- Regional Price ------------------------------------------+   |
|  |  Tennessee Avg: $3.89/gal    Trend: DOWN 2c (7 days)        |   |
|  +-------------------------------------------------------------+   |
|                                                                    |
|  +--- Results (sorted by effective price) -----------------------+ |
|  |                                                               | |
|  |  +--- Pilot #284 ------------------------------ 2.3 mi ----+ | |
|  |  |  Retail: $3.79/gal                                      | | |
|  |  |  Your Price: $3.74/gal (Comdata -$0.05)                 | | |
|  |  |  DEF: $2.89/gal                                         | | |
|  |  |                                                         | | |
|  |  |  Fill 150 gal = $561.00 (save $7.50 vs avg)             | | |
|  |  |                                                         | | |
|  |  |  Amenities: CAT Scale | Truck Wash | DEF                | | |
|  |  |  [Navigate]  [Details]                                  | | |
|  |  +---------------------------------------------------------+ | |
|  |                                                               | |
|  |  +--- Love's #442 ----------------------------- 4.1 mi ----+ | |
|  |  |  Retail: $3.82/gal                                      | | |
|  |  |  Your Price: $3.79/gal (Comdata -$0.03)                 | | |
|  |  |  DEF: $2.79/gal (cheapest DEF nearby)                   | | |
|  |  |                                                         | | |
|  |  |  Fill 150 gal = $568.50 (save $0.75 vs avg)             | | |
|  |  |  [Navigate]  [Details]                                  | | |
|  |  +---------------------------------------------------------+ | |
|  |                                                               | |
|  +---------------------------------------------------------------+ |
|                                                                    |
|  +--- Trip Savings Calculator ----------------------------------+  |
|  |  Route: Memphis -> Dallas (450 mi)                          |  |
|  |  Est. Fuel Needed: 75 gallons @ 6 MPG                       |  |
|  |                                                             |  |
|  |  Optimal Stops:                                             |  |
|  |  1. Pilot #284 (Memphis) - 50 gal @ $3.74 = $187.00         |  |
|  |  2. TA Little Rock - 25 gal @ $3.71 = $92.75                |  |
|  |                                                             |  |
|  |  Total: $279.75  |  vs Random: $294.75  |  SAVE: $15.00     |  |
|  +-------------------------------------------------------------+  |
|                                                                    |
+------------------------------------------------------------------+
```

---

## 5. Feature 3: Weigh Station Status

### 5.1 Problem Statement

Weigh station uncertainty costs drivers time and money:
- Stopping at closed stations: 15-30 min wasted
- PrePass/DriveWyze subscription confusion
- Scale bypass eligibility unknown
- Enforcement activity varies by time/location

### 5.2 Solution

Real-time weigh station status showing:
- Open/Closed status
- PrePass/DriveWyze bypass eligibility
- Wait time estimates
- Recent inspection activity

### 5.3 External API Integrations

| Provider | Data | Cost Model | Notes |
|----------|------|------------|-------|
| **DriveWyze** | Bypass status, station status | Partnership | Primary source |
| **PrePass** | PrePass station status | Partnership | Secondary source |
| **State DOT APIs** | Official open/closed | Free (public) | Verification |

### 5.4 Data Model

**WeighStations Collection**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `external_id` | String | DOT station ID |
| `name` | String | Station name |
| `state` | String | State code |
| `highway` | String | Highway (I-40 EB) |
| `mile_marker` | Number | Mile marker |
| `location` | Object | `{lat, lng}` |
| `direction` | String | EB, WB, NB, SB |
| `status` | String | open, closed, unknown |
| `prepass_enabled` | Boolean | PrePass available |
| `drivewyze_enabled` | Boolean | DriveWyze available |
| `bypass_rate` | Number | % of trucks bypassed (PrePass data) |
| `avg_wait_minutes` | Number | Average wait if stopping |
| `status_updated_at` | DateTime | Last status update |
| `operating_hours` | Object | `{open: "06:00", close: "22:00"}` or `24_hours` |

**WeighStationReports Collection**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `station_id` | String | FK to WeighStations |
| `driver_id` | String | FK to DriverProfiles |
| `report_type` | String | open, closed, inspection_activity, long_wait |
| `wait_minutes` | Number | Reported wait time |
| `notes` | String | Additional details |
| `reported_at` | DateTime | Report timestamp |
| `upvotes` | Number | Community validation |

### 5.5 API Design

```javascript
// weighStationService.jsw

/**
 * Get weigh station status along route
 * @param {Array} routePoints
 * @param {Object} options - {prepassMember: true, drivewyze: false}
 * @returns {Array} Stations along route with status
 */
export async function getWeighStationsAlongRoute(routePoints, options = {}) {
  // Find stations within 5 miles of route
  // Get current status from APIs
  // Merge with driver reports
  // Return with bypass probability
}

/**
 * Get real-time status for a specific station
 * @param {string} stationId
 * @returns {Object} Current status with confidence
 */
export async function getStationStatus(stationId) {
  // Query DriveWyze/PrePass
  // Add recent driver reports
  // Calculate status confidence
}

/**
 * Report weigh station status
 * @param {string} stationId
 * @param {Object} report
 */
export async function reportStationStatus(stationId, report) {
  // Validate driver location is near station
  // Save report
  // Update station status if multiple reports agree
}

/**
 * Get stations by state
 * @param {string} state
 * @returns {Array} All stations in state
 */
export async function getStationsByState(state) {
  // Return all stations with current status
}
```

### 5.6 UI Design

```
+------------------------------------------------------------------+
|  WEIGH STATION STATUS                              [Route] [Map]   |
+------------------------------------------------------------------+
|                                                                    |
|  +--- Your Bypass Services ------------------------------------+   |
|  |  [x] PrePass Member        [ ] DriveWyze                    |   |
|  +-------------------------------------------------------------+   |
|                                                                    |
|  +--- Route: Memphis -> Dallas --------------------------------+   |
|  |                                                             |   |
|  |  +--- West Memphis AR (I-40 WB, MM 284) -------- OPEN ----+ |   |
|  |  |  Status: OPEN (verified 10 min ago)                    | |   |
|  |  |  PrePass: ENABLED - 87% bypass rate                    | |   |
|  |  |  Est. Wait: 12 min (if stopping)                       | |   |
|  |  |                                                        | |   |
|  |  |  Driver Reports: "Quick pull through" - 5 min ago      | |   |
|  |  |  [Report Status]                                       | |   |
|  |  +--------------------------------------------------------+ |   |
|  |                                                             |   |
|  |  +--- Little Rock AR (I-40 WB, MM 153) ------- CLOSED ----+ |   |
|  |  |  Status: CLOSED (DOT reported)                         | |   |
|  |  |  Reason: Night closure (closes 10pm, opens 6am)        | |   |
|  |  |  PrePass: N/A when closed                              | |   |
|  |  +--------------------------------------------------------+ |   |
|  |                                                             |   |
|  |  +--- Texarkana TX (I-30 WB, MM 220) -------- OPEN -------+ |   |
|  |  |  Status: OPEN (driver reported 25 min ago)             | |   |
|  |  |  PrePass: ENABLED - 92% bypass rate                    | |   |
|  |  |  Est. Wait: 5 min                                      | |   |
|  |  |                                                        | |   |
|  |  |  [!] High inspection activity reported                 | |   |
|  |  |  [Report Status]                                       | |   |
|  |  +--------------------------------------------------------+ |   |
|  |                                                             |   |
|  +-------------------------------------------------------------+   |
|                                                                    |
|  +--- Legend --------------------------------------------------+   |
|  |  OPEN = Verified open      CLOSED = Verified closed         |   |
|  |  [?] = Status unknown - report if you pass!                 |   |
|  +-------------------------------------------------------------+   |
|                                                                    |
+------------------------------------------------------------------+
```

---

## 6. Feature 4: Rest Stop Ratings

### 6.1 Problem Statement

Rest stop quality varies dramatically:
- Cleanliness inconsistent
- Safety concerns at some locations
- Food quality unknown
- Shower wait times unpredictable

### 6.2 Solution

Driver-submitted reviews with:
- Multi-category ratings
- Recent condition reports
- Photo uploads
- Community validation

### 6.3 Data Model

**RestStopReviews Collection**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `location_id` | String | FK to ParkingLocations |
| `driver_id` | String | FK to DriverProfiles |
| `overall_rating` | Number | 1-5 stars |
| `ratings` | Object | `{cleanliness, safety, food, showers, parking}` (1-5 each) |
| `review_text` | String | Written review (500 char max) |
| `photos` | Array[String] | Photo URLs |
| `visit_date` | Date | When driver visited |
| `created_at` | DateTime | Review submission time |
| `helpful_votes` | Number | Upvotes |
| `is_verified` | Boolean | Driver verified at location via GPS |
| `status` | String | active, flagged, removed |

**RestStopConditionReports Collection**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `location_id` | String | FK to ParkingLocations |
| `driver_id` | String | FK to DriverProfiles |
| `report_type` | String | shower_wait, out_of_service, hazard, closed |
| `details` | Object | Type-specific details |
| `reported_at` | DateTime | Report time |
| `expires_at` | DateTime | When report becomes stale (24h) |
| `confirmations` | Number | Other drivers confirming |

### 6.4 API Design

```javascript
// restStopService.jsw

/**
 * Get reviews for a location
 * @param {string} locationId
 * @param {Object} options - {sortBy: 'recent', limit: 20}
 * @returns {Object} {reviews, summary}
 */
export async function getLocationReviews(locationId, options = {}) {
  // Get reviews
  // Calculate rating summaries by category
  // Include recent condition reports
}

/**
 * Submit a review
 * @param {string} locationId
 * @param {Object} review
 */
export async function submitReview(locationId, review) {
  // Validate driver logged in
  // Check for duplicate review (1 per location per 30 days)
  // Verify driver was at location (GPS check)
  // Save review
  // Update location aggregate ratings
}

/**
 * Submit condition report
 * @param {string} locationId
 * @param {Object} report
 */
export async function submitConditionReport(locationId, report) {
  // Validate location proximity
  // Save report with 24h expiry
  // Send alerts to nearby drivers if hazard
}

/**
 * Vote on review helpfulness
 * @param {string} reviewId
 * @param {string} driverId
 * @param {boolean} helpful
 */
export async function voteReview(reviewId, driverId, helpful) {
  // Record vote (one per driver per review)
  // Update helpful count
}

/**
 * Get top-rated stops in area
 * @param {number} lat
 * @param {number} lng
 * @param {number} radius
 * @param {Object} filters - {minRating: 4, hasShowers: true}
 */
export async function getTopRatedStops(lat, lng, radius, filters = {}) {
  // Query locations with filters
  // Sort by rating
  // Return with review snippets
}
```

### 6.5 UI Design

```
+------------------------------------------------------------------+
|  REST STOP RATINGS                                                 |
+------------------------------------------------------------------+
|                                                                    |
|  +--- Pilot Travel Center #284 --------------------------------+   |
|  |                                                             |   |
|  |  Overall: **** (4.2)  |  156 reviews                        |   |
|  |                                                             |   |
|  |  +--- Category Ratings ----------------------------------+  |   |
|  |  |  Cleanliness:  ****- (4.1)                           |  |   |
|  |  |  Safety:       ***** (4.8)                           |  |   |
|  |  |  Food:         ***-- (3.2)                           |  |   |
|  |  |  Showers:      ****- (4.3)                           |  |   |
|  |  |  Parking:      ****- (4.0)                           |  |   |
|  |  +------------------------------------------------------+  |   |
|  |                                                             |   |
|  |  +--- Recent Conditions (last 24h) ----------------------+  |   |
|  |  |  [!] Shower wait: ~20 min (reported 1h ago)          |  |   |
|  |  |  [OK] All fuel pumps operational                     |  |   |
|  |  +------------------------------------------------------+  |   |
|  |                                                             |   |
|  +-------------------------------------------------------------+   |
|                                                                    |
|  +--- Reviews -------------------------------------------------+   |
|  |  [Most Recent v]                     [Write a Review]       |   |
|  |                                                             |   |
|  |  +--- TruckerMike_TX --------- Jan 18, 2026 ---- **** ---+ |   |
|  |  |  "Clean showers, friendly staff. Food court is meh    | |   |
|  |  |   but the Subway is reliable. Parking fills up by     | |   |
|  |  |   8pm so arrive early."                               | |   |
|  |  |                                                       | |   |
|  |  |  [photo] [photo]                                      | |   |
|  |  |                                                       | |   |
|  |  |  Verified visit | 23 found helpful                    | |   |
|  |  |  [Helpful]  [Report]                                  | |   |
|  |  +-------------------------------------------------------+ |   |
|  |                                                             |   |
|  |  +--- HighwayHauler ---------- Jan 15, 2026 ---- ***** --+ |   |
|  |  |  "Best Pilot on I-40. Real porcelain toilets in the   | |   |
|  |  |   driver's lounge. Truck wash is fast and thorough."  | |   |
|  |  |                                                       | |   |
|  |  |  Verified visit | 45 found helpful                    | |   |
|  |  |  [Helpful]  [Report]                                  | |   |
|  |  +-------------------------------------------------------+ |   |
|  +-------------------------------------------------------------+   |
|                                                                    |
+------------------------------------------------------------------+
```

---

## 7. Feature 5: Weather Alerts

### 7.1 Problem Statement

Weather impacts driver safety and route planning:
- Sudden storms dangerous on unfamiliar roads
- Winter weather requires chain-up decisions
- Flood warnings affect route selection
- Wind advisories critical for high-profile loads

### 7.2 Solution

Route-specific weather warnings with:
- NWS alert integration
- Push notifications for severe weather
- Chain law requirements
- Wind speed forecasts

### 7.3 External API Integrations

| Provider | Data | Cost Model | Notes |
|----------|------|------------|-------|
| **NWS API** | Official weather alerts | Free | Primary source |
| **OpenWeatherMap** | Forecasts, current conditions | Free tier + paid | Supplemental |
| **Tomorrow.io** | Road-specific forecasts | Paid | Future integration |

### 7.4 Data Model

**WeatherAlerts Collection**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `nws_id` | String | NWS alert ID |
| `alert_type` | String | warning, watch, advisory |
| `event` | String | Winter Storm, Flood, High Wind, etc. |
| `severity` | String | extreme, severe, moderate, minor |
| `headline` | String | Alert headline |
| `description` | String | Full alert text |
| `affected_zones` | Array[String] | NWS zone codes |
| `affected_states` | Array[String] | State codes |
| `geometry` | Object | GeoJSON polygon |
| `onset` | DateTime | When conditions begin |
| `expires` | DateTime | When alert expires |
| `source` | String | NWS, State DOT |

**DriverWeatherSubscriptions Collection**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `driver_id` | String | FK to DriverProfiles |
| `alert_types` | Array[String] | Types to receive (winter, flood, wind, etc.) |
| `min_severity` | String | Minimum severity to alert |
| `home_zones` | Array[String] | NWS zones for home area alerts |
| `push_enabled` | Boolean | Receive push notifications |
| `email_enabled` | Boolean | Receive email alerts |

### 7.5 API Design

```javascript
// weatherAlertService.jsw

/**
 * Get weather alerts along route
 * @param {Array} routePoints
 * @param {Object} options - {includeForecasts: true}
 * @returns {Object} {alerts, forecasts}
 */
export async function getRouteWeather(routePoints, options = {}) {
  // Calculate route corridor
  // Query NWS for alerts in corridor
  // Get forecasts for key waypoints
  // Return consolidated weather info
}

/**
 * Get current alerts for a location
 * @param {number} lat
 * @param {number} lng
 * @returns {Array} Active alerts
 */
export async function getAlertsAtLocation(lat, lng) {
  // Query NWS by coordinates
  // Return active alerts with severity
}

/**
 * Subscribe to weather alerts
 * @param {string} driverId
 * @param {Object} preferences
 */
export async function subscribeToAlerts(driverId, preferences) {
  // Save subscription preferences
  // Enable push notification channel
}

/**
 * Process incoming NWS alerts (scheduled job)
 * Matches alerts to driver subscriptions
 */
export async function processNewAlerts() {
  // Fetch new alerts from NWS
  // Find affected drivers (by current location or route)
  // Send notifications
}

/**
 * Get chain law requirements
 * @param {string} state
 * @param {string} highway
 * @returns {Object} Current chain requirements
 */
export async function getChainRequirements(state, highway) {
  // Query state DOT for chain law status
  // Return requirements with exemptions
}
```

### 7.6 UI Design

```
+------------------------------------------------------------------+
|  WEATHER ALERTS                                    [Route] [Local] |
+------------------------------------------------------------------+
|                                                                    |
|  +--- ACTIVE ALERT -------------------------------------------+    |
|  |  [!] WINTER STORM WARNING                                  |    |
|  |                                                            |    |
|  |  In Effect: Jan 20 6pm - Jan 21 6am                        |    |
|  |  Affected Area: I-40 Corridor, Flagstaff to Kingman AZ     |    |
|  |                                                            |    |
|  |  - Heavy snow expected: 8-12 inches                        |    |
|  |  - Winds gusting to 45 mph                                 |    |
|  |  - Travel should be avoided if possible                    |    |
|  |                                                            |    |
|  |  Chain Requirements: R2 (chains required all vehicles)     |    |
|  |                                                            |    |
|  |  [View Full Alert]  [Share with Dispatch]                  |    |
|  +------------------------------------------------------------+    |
|                                                                    |
|  +--- Route Forecast: Memphis -> Phoenix ----------------------+   |
|  |                                                             |   |
|  |  Memphis, TN (Now)                                          |   |
|  |  Partly Cloudy | 45F | Wind: 8 mph NW                       |   |
|  |                                                             |   |
|  |  Little Rock, AR (ETA 3h)                                   |   |
|  |  Cloudy | 42F | Wind: 12 mph W                              |   |
|  |                                                             |   |
|  |  Oklahoma City, OK (ETA 7h)                                 |   |
|  |  Rain likely | 38F | Wind: 15 mph SW                        |   |
|  |  [!] Rain may transition to freezing rain overnight         |   |
|  |                                                             |   |
|  |  Amarillo, TX (ETA 12h)                                     |   |
|  |  Snow showers | 28F | Wind: 25 mph W                        |   |
|  |  [!] Blowing snow may reduce visibility                     |   |
|  |                                                             |   |
|  |  Albuquerque, NM (ETA 18h)                                  |   |
|  |  Mostly clear | 35F | Wind: 10 mph SW                       |   |
|  |                                                             |   |
|  |  Phoenix, AZ (ETA 24h)                                      |   |
|  |  Sunny | 65F | Wind: 5 mph                                   |   |
|  |                                                             |   |
|  +-------------------------------------------------------------+   |
|                                                                    |
|  +--- Alert Preferences ---------------------------------------+   |
|  |  Receive alerts for: [x] Winter  [x] Flood  [x] High Wind   |   |
|  |  Minimum severity: [Moderate v]                             |   |
|  |  Push notifications: [ON]                                   |   |
|  +-------------------------------------------------------------+   |
|                                                                    |
+------------------------------------------------------------------+
```

---

## 8. Feature 6: Road Conditions

### 8.1 Problem Statement

Road conditions change rapidly and affect trip planning:
- Construction zones with delays
- Accident-related closures
- Chain requirements (mountain passes)
- Bridge/tunnel restrictions

### 8.2 Solution

Real-time road condition info from:
- State DOT 511 systems
- FHWA data feeds
- Driver reports
- Restriction databases

### 8.3 External API Integrations

| Provider | Data | Cost Model | Notes |
|----------|------|------------|-------|
| **State 511 APIs** | Incidents, construction, closures | Free | 40+ states |
| **FHWA** | National road conditions | Free | Federal highways |
| **TomTom Traffic** | Real-time traffic | Paid | Future integration |

### 8.4 Data Model

**RoadConditions Collection**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `external_id` | String | 511 incident ID |
| `type` | String | construction, closure, incident, restriction |
| `highway` | String | Highway designation |
| `state` | String | State code |
| `location` | Object | `{lat, lng}` |
| `start_mile` | Number | Start mile marker |
| `end_mile` | Number | End mile marker |
| `direction` | String | EB, WB, NB, SB, Both |
| `description` | String | Condition description |
| `severity` | String | minor, moderate, major |
| `lanes_affected` | Number | Number of lanes closed |
| `delay_minutes` | Number | Expected delay |
| `start_time` | DateTime | When condition began |
| `expected_end` | DateTime | Expected resolution |
| `source` | String | 511, fhwa, driver_report |
| `last_updated` | DateTime | Last update time |

**TruckRestrictions Collection**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `highway` | String | Highway |
| `state` | String | State |
| `location_description` | String | Human-readable location |
| `restriction_type` | String | weight, height, length, hazmat, no_trucks |
| `details` | Object | Type-specific restriction details |
| `permanent` | Boolean | Permanent vs temporary |
| `effective_dates` | Object | `{start, end}` for temporary |
| `source` | String | state_dot, verified |

### 8.5 API Design

```javascript
// roadConditionService.jsw

/**
 * Get road conditions along route
 * @param {Array} routePoints
 * @param {Object} options - {includeConstruction: true, minSeverity: 'minor'}
 * @returns {Array} Conditions affecting route
 */
export async function getRouteConditions(routePoints, options = {}) {
  // Calculate route corridor
  // Query 511 systems for each state on route
  // Include construction zones
  // Add driver reports
  // Sort by distance along route
}

/**
 * Get truck restrictions along route
 * @param {Array} routePoints
 * @param {Object} truckSpecs - {height, weight, length, hazmat}
 * @returns {Array} Restrictions that may affect truck
 */
export async function getTruckRestrictions(routePoints, truckSpecs = {}) {
  // Find restrictions along route
  // Filter by truck specifications
  // Return with alternate route suggestions
}

/**
 * Get conditions by state
 * @param {string} state
 * @param {Object} filters
 * @returns {Array} Active conditions in state
 */
export async function getConditionsByState(state, filters = {}) {
  // Query 511 for state
  // Filter by type/severity
}

/**
 * Report road condition
 * @param {Object} report - {location, type, description}
 */
export async function reportCondition(report) {
  // Validate driver location
  // Save report with 4h TTL
  // Alert nearby drivers if severe
}

/**
 * Get chain requirements
 * @param {Array} routePoints
 * @returns {Array} Current chain law requirements along route
 */
export async function getChainRequirements(routePoints) {
  // Query state DOTs for mountain pass chain laws
  // Return requirements with exemption info
}
```

### 8.6 UI Design

```
+------------------------------------------------------------------+
|  ROAD CONDITIONS                                  [Route] [State]  |
+------------------------------------------------------------------+
|                                                                    |
|  +--- Route: Memphis -> Los Angeles ------------------------------+|
|  |                                                                ||
|  |  [!] 3 INCIDENTS  |  [!] 2 CONSTRUCTION ZONES  |  0 CLOSURES   ||
|  |                                                                ||
|  +----------------------------------------------------------------+|
|                                                                    |
|  +--- Active Conditions ------------------------------------------+|
|  |                                                                ||
|  |  +--- I-40 WB, MM 185 (Oklahoma City) ----- MAJOR DELAY ----+ ||
|  |  |  Type: Multi-vehicle accident                            | ||
|  |  |  Lanes: 2 of 3 closed                                    | ||
|  |  |  Delay: ~45 minutes                                      | ||
|  |  |  Started: 2h ago | Est. clear: 4pm CST                   | ||
|  |  |                                                          | ||
|  |  |  [View on Map]  [Get Alternate Route]                    | ||
|  |  +----------------------------------------------------------+ ||
|  |                                                                ||
|  |  +--- I-40 WB, MM 8-42 (Flagstaff AZ) ----- CONSTRUCTION ---+ ||
|  |  |  Type: Road resurfacing                                  | ||
|  |  |  Lanes: 1 of 2 closed (overnight only)                   | ||
|  |  |  Hours: 8pm - 6am daily through Feb 15                   | ||
|  |  |  Daytime delay: Minimal                                  | ||
|  |  |  Night delay: ~20 minutes                                | ||
|  |  +----------------------------------------------------------+ ||
|  |                                                                ||
|  |  +--- I-15 NB, Cajon Pass (CA) ----------- CHAIN CONTROL ---+ ||
|  |  |  Chain Law: R2 in effect                                 | ||
|  |  |  Requires: Chains on drive axles                         | ||
|  |  |  Conditions: Snow, icy patches                           | ||
|  |  |  Last updated: 30 min ago                                | ||
|  |  |                                                          | ||
|  |  |  [Chain-up Areas]  [Current Conditions Camera]           | ||
|  |  +----------------------------------------------------------+ ||
|  |                                                                ||
|  +----------------------------------------------------------------+|
|                                                                    |
|  +--- Truck Restrictions (based on your equipment) ---------------+|
|  |                                                                ||
|  |  No restrictions found for your route with:                    ||
|  |  Height: 13'6" | Weight: 80,000 lbs | Length: 75'              ||
|  |                                                                ||
|  |  [Update Equipment Specs]                                      ||
|  +----------------------------------------------------------------+|
|                                                                    |
|  +--- Report a Condition -----------------------------------------+|
|  |  [Accident]  [Construction]  [Closure]  [Chains Required]      ||
|  +----------------------------------------------------------------+|
|                                                                    |
+------------------------------------------------------------------+
```

---

## 9. Unified UI: Driver Road Utilities Dashboard

### 9.1 Main Dashboard Layout

```
+------------------------------------------------------------------+
|  ROAD UTILITIES                                            [User] |
+------------------------------------------------------------------+
|                                                                    |
|  +--- Quick Access Bar -----------------------------------------+  |
|  |  [Parking]  [Fuel]  [Weigh Stations]  [Weather]  [Conditions] | |
|  +--------------------------------------------------------------+  |
|                                                                    |
|  +--- Current Location: Memphis, TN ----- 35.1495, -90.0490 ----+  |
|  |                                                               |  |
|  |  +--- Nearby Summary -----------------------------------+     |  |
|  |  |                                                      |     |  |
|  |  |  PARKING          FUEL             WEIGH STATION     |     |  |
|  |  |  12 spots         $3.74/gal        I-40 WB: OPEN     |     |  |
|  |  |  within 10 mi     (Pilot #284)     87% bypass rate   |     |  |
|  |  |  [Find More]      [Find Cheaper]   [View All]        |     |  |
|  |  +------------------------------------------------------+     |  |
|  |                                                               |  |
|  +---------------------------------------------------------------+  |
|                                                                    |
|  +--- Active Alerts --------------------------------------------+  |
|  |  [!] WINTER STORM WARNING - I-40 Flagstaff-Kingman AZ        |  |
|  |      Heavy snow 8-12", chains required. [Details]            |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
|  +--- Plan a Route ---------------------------------------------+  |
|  |  From: [Memphis, TN        ]                                 |  |
|  |  To:   [Los Angeles, CA    ]                                 |  |
|  |                                                              |  |
|  |  [Get Road Utilities for Route]                              |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
|  +--- Recent Activity ------------------------------------------+  |
|  |  - You reported parking at Pilot #284 (2h ago)               |  |
|  |  - You fueled at Love's #442 - $3.82/gal (yesterday)         |  |
|  |  - You rated Rest Area MM 28 - 4 stars (3 days ago)          |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
+------------------------------------------------------------------+
```

### 9.2 Mobile-First Considerations

```
+---------------------------+
|  ROAD UTILITIES     [=]   |
+---------------------------+
|                           |
|  Memphis, TN              |
|  Jan 20, 2:30 PM          |
|                           |
|  +-----+ +-----+ +-----+  |
|  |PARK | |FUEL | |WEIGH|  |
|  | 12  | |$3.74| |OPEN |  |
|  +-----+ +-----+ +-----+  |
|                           |
|  +-----+ +-----+ +-----+  |
|  |WEATH| |ROAD | |RATE |  |
|  | [!] | | OK  | |STOP |  |
|  +-----+ +-----+ +-----+  |
|                           |
|  +--- Alert -------------+|
|  | [!] Winter Storm      ||
|  |     I-40 AZ           ||
|  |     [View]            ||
|  +-----------------------+|
|                           |
|  [Plan Route]             |
|                           |
+---------------------------+
```

---

## 10. API Rate Limiting & Caching Strategy

### 10.1 External API Limits

| API | Rate Limit | Cache TTL | Fallback |
|-----|------------|-----------|----------|
| TruckParkingClub | 100/min | 5 min | ParkMyTruck |
| GasBuddy | 50/min | 15 min | OPIS |
| DriveWyze | 200/min | 2 min | State DOT |
| NWS | 1000/day | 10 min | None (critical) |
| State 511 | Varies | 5 min | FHWA |

### 10.2 Caching Architecture

```
+------------------------------------------------------------------+
|                    CACHING STRATEGY                                |
+------------------------------------------------------------------+
|                                                                    |
|   REQUEST                                                          |
|      |                                                             |
|      v                                                             |
|   +------------------------+                                       |
|   | Check Memory Cache     |  TTL: 1-5 min                         |
|   | (in-process)           |  Size: 1000 entries                   |
|   +------------------------+                                       |
|      |                                                             |
|      | MISS                                                        |
|      v                                                             |
|   +------------------------+                                       |
|   | Check Wix Data Cache   |  TTL: 5-15 min                        |
|   | (RoadUtilityCache)     |  Indexed by: location, type           |
|   +------------------------+                                       |
|      |                                                             |
|      | MISS                                                        |
|      v                                                             |
|   +------------------------+                                       |
|   | Query External API     |  Rate limited                         |
|   | (with circuit breaker) |  Fallback if down                     |
|   +------------------------+                                       |
|      |                                                             |
|      v                                                             |
|   +------------------------+                                       |
|   | Store in both caches   |                                       |
|   +------------------------+                                       |
|      |                                                             |
|      v                                                             |
|   RESPONSE                                                         |
|                                                                    |
+------------------------------------------------------------------+
```

### 10.3 Cache Collection

**RoadUtilityCache Collection**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `cache_key` | String | Composite key (type:lat:lng:radius) |
| `cache_type` | String | parking, fuel, weather, weigh, conditions |
| `data` | Object | Cached response data |
| `created_at` | DateTime | When cached |
| `expires_at` | DateTime | TTL expiration |
| `hit_count` | Number | Cache hit counter |

---

## 11. Success Metrics

### 11.1 Engagement Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Daily Active Drivers | 50 | 500 | 6 months |
| Sessions per Driver/Week | 1.2 | 8 | 6 months |
| Feature Adoption (any utility) | 0% | 70% | 3 months |
| Community Reports/Day | 0 | 100 | 3 months |

### 11.2 Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| 7-day Retention | 65% | Cohort analysis |
| 30-day Retention | 45% | Cohort analysis |
| Referral Rate | 15% | Invite tracking |
| Premium Conversion | 5% | Upgrade tracking |

### 11.3 Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Parking Data Accuracy | 90% | User feedback |
| Fuel Price Accuracy | 95% | Spot checks |
| Weather Alert Delivery | <5 min | Latency tracking |
| API Uptime | 99.5% | Monitoring |

---

## 12. Open Questions

1. **API Partnerships:** Can we negotiate favorable terms with TruckParkingClub and fuel card providers?
2. **Offline Mode:** Should utilities work offline with cached data for areas with poor connectivity?
3. **Push Notifications:** Platform limitations on Wix for native push - need PWA or mobile app?
4. **Monetization:** Premium features (ad-free, advanced route optimization) for paid tier?
5. **Community Moderation:** How to handle inaccurate/malicious reports?
6. **Privacy:** GPS tracking for reports - how to balance accuracy with privacy concerns?
7. **Integration:** Should road utilities be separate tab or integrated into driver dashboard?
