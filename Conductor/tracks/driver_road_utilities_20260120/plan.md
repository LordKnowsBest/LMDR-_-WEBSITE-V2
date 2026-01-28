# Track Plan: Driver Road Utilities

## Overview

This plan implements six road utility features to transform LMDR from a job-hunting platform into a daily-use operating system for CDL drivers. Each phase delivers a complete, valuable feature that increases platform stickiness.

**Priority Order:** Features ordered by driver demand (parking #1) and implementation complexity.

---

## Phase 1: Parking Finder [checkpoint: fcffb62]

**Goal:** Solve the #1 driver pain point - finding available truck parking.

**Dependencies:** None (foundational feature)

**Estimated Effort:** 3-4 weeks

### Backend Infrastructure Tasks

- [x] Task: Create `parkingService.jsw` backend web module [checkpoint: 7a8b9c0]
- [x] Task: Implement `ParkingLocations` collection with schema (external_id, name, location, total_spaces, available_spaces, amenities, avg_rating) [checkpoint: 7a8b9c0]
- [x] Task: Implement `ParkingReports` collection for community reports (location_id, driver_id, report_type, spaces_available, reported_at) [checkpoint: 7a8b9c0]
- [x] Task: Implement `RoadUtilityCache` collection for API response caching with TTL [checkpoint: 7a8b9c0]
- [x] Task: Create `locationService.jsw` shared module for geocoding and distance calculations [checkpoint: 7a8b9c0]
- [x] Task: Implement cache layer with 5-minute TTL for parking searches [checkpoint: 7a8b9c0]

### External API Integration Tasks

- [x] Task: Research and select primary parking API (TruckParkingClub or equivalent) [checkpoint: 7a8b9c0]
- [x] Task: Obtain API credentials and configure in Wix Secrets Manager [checkpoint: 7a8b9c0]
- [x] Task: Implement `queryTruckParkingClubAPI()` function with rate limiting [checkpoint: 7a8b9c0]
- [x] Task: Implement fallback to ParkMyTruck API if primary fails [checkpoint: 7a8b9c0]
- [x] Task: Implement state DOT rest area API integration (start with 10 major states) [checkpoint: 7a8b9c0]
- [x] Task: Create API response normalization layer to standardize data from multiple sources [checkpoint: 7a8b9c0]
- [x] Task: Implement circuit breaker pattern for API failures [checkpoint: 7a8b9c0]

### Core Service Functions

- [x] Task: Implement `searchParking(lat, lng, radius, filters)` - main search function [checkpoint: 7a8b9c0]
- [x] Task: Implement `getParkingDetails(locationId)` - detailed location info with reviews [checkpoint: 7a8b9c0]
- [x] Task: Implement `reportParkingAvailability(locationId, report)` - community reporting [checkpoint: 7a8b9c0]
- [x] Task: Implement `getParkingAlongRoute(routePoints, options)` - route-based search [checkpoint: 7a8b9c0]
- [x] Task: Implement distance calculation and sorting by distance from driver [checkpoint: 7a8b9c0]
- [x] Task: Implement amenity filtering (showers, wifi, restaurant, fuel) [checkpoint: 7a8b9c0]
- [x] Task: Implement availability status calculation (available, limited, full, unknown) [checkpoint: 7a8b9c0]
- [x] Task: Add report validation (rate limit 1 report per location per hour per driver) [checkpoint: 7a8b9c0]
- [x] Task: Implement report aggregation to estimate availability from multiple reports [checkpoint: 7a8b9c0]

### Frontend Tasks

- [x] Task: Create `DRIVER_ROAD_UTILITIES.html` in `src/public/driver/` [checkpoint: 7a8b9c0]
- [x] Task: Design and implement Parking Finder tab UI [checkpoint: 7a8b9c0]
- [x] Task: Implement search bar with location input and radius selector [checkpoint: 7a8b9c0]
- [x] Task: Implement amenity filter checkboxes [checkpoint: 7a8b9c0]
- [x] Task: Build results list with parking cards (name, availability, distance, amenities, rating) [checkpoint: 7a8b9c0]
- [x] Task: Implement availability indicator colors (green/yellow/red/gray) [checkpoint: 7a8b9c0]
- [x] Task: Add "Navigate" button linking to Google Maps/Apple Maps [checkpoint: 7a8b9c0]
- [x] Task: Add "Report Parking" modal for community submissions [checkpoint: 7a8b9c0]
- [x] Task: Add "Details" expansion with full location info and reviews [checkpoint: 7a8b9c0]
- [x] Task: Implement loading states and error handling [checkpoint: 7a8b9c0]
- [x] Task: Add empty state for no results found [checkpoint: 7a8b9c0]
- [x] Task: Implement mobile-responsive layout [checkpoint: 7a8b9c0]

### Map Integration Tasks

- [x] Task: Integrate map view (Google Maps or Mapbox) [checkpoint: 7a8b9c0]
- [x] Task: Implement map markers with availability color coding [checkpoint: 7a8b9c0]
- [~] Task: Add marker clustering for dense areas (Skipped for initial prototype)
- [x] Task: Implement "Search this area" when map pans [checkpoint: 7a8b9c0]
- [x] Task: Add toggle between Map and List views [checkpoint: 7a8b9c0]

### Page Code Integration

- [x] Task: Create `Road Utilities.js` page code file [checkpoint: 7a8b9c0]
- [x] Task: Implement postMessage bridge for Parking Finder [checkpoint: 7a8b9c0]
- [x] Task: Add handlers: `searchParking`, `getParkingDetails`, `reportParking` [checkpoint: 7a8b9c0]
- [x] Task: Implement geolocation for "Current Location" searches [checkpoint: 7a8b9c0]
- [x] Task: Add analytics tracking for parking searches [checkpoint: 7a8b9c0]

### Testing Tasks

- [x] Task: Write unit tests for `searchParking` with mock API responses [checkpoint: 7a8b9c0]
- [x] Task: Test amenity filtering logic [checkpoint: 7a8b9c0]
- [x] Task: Test cache hit/miss scenarios [checkpoint: 7a8b9c0]
- [x] Task: Test community report submission and validation [checkpoint: 7a8b9c0]
- [x] Task: Test API fallback when primary source fails [checkpoint: 7a8b9c0]
- [x] Task: Test mobile responsiveness across device sizes [checkpoint: 7a8b9c0]
- [x] Task: Load test with 100 concurrent searches [checkpoint: 7a8b9c0]
- [x] Task: Conductor - User Manual Verification 'Phase 1: Parking Finder' [checkpoint: 7a8b9c0]

---

## Phase 1.5: TPIMS Integration (Real-Time Sensor Data) [checkpoint: f4477bc]

**Goal:** Integrate FHWA-funded Truck Parking Information Management System (TPIMS) for real-time sensor-based parking availability.

**Dependencies:** Phase 1 (parkingService.jsw foundation)

**Estimated Effort:** 1 week (completed in 2 days)

### Research & Discovery

- [x] Task: Research TPIMS and MAASTO state coalition [checkpoint: 12e61aa]
- [x] Task: Identify public feeds (no API key required) [checkpoint: 12e61aa]
- [x] Task: Identify feeds requiring registration [checkpoint: 12e61aa]
- [x] Task: Research southern state APIs (TX, CA, GA, FL, AZ) [checkpoint: f4477bc]

### MAASTO Midwest Integration (6 States)

- [x] Task: Implement OHGO (Ohio) API integration with circuit breaker [checkpoint: d2a1644]
- [x] Task: Implement Wisconsin 511 API integration [checkpoint: d2a1644]
- [x] Task: Implement Indiana TPIMS (GeoJSON format, public feed) [checkpoint: 12e61aa]
- [x] Task: Implement Kentucky TPIMS (MAASTO standard, public feed) [checkpoint: 12e61aa]
- [x] Task: Implement Minnesota TPIMS (MAASTO standard, public feed) [checkpoint: 12e61aa]
- [x] Task: Implement Illinois TPIMS (MAASTO standard, public feed) [checkpoint: 12e61aa]

### Southern/Western States Integration (3 States)

- [x] Task: Implement Arizona 511 TPIMS (I-10 TPAS corridor) [checkpoint: f4477bc]
- [x] Task: Implement Georgia 511 TPIMS (I-75, I-85, I-20, I-95) [checkpoint: f4477bc]
- [x] Task: Implement California Caltrans ArcGIS rest areas (static locations) [checkpoint: f4477bc]

### Infrastructure

- [x] Task: Create circuit breaker state for each API source [checkpoint: 12e61aa]
- [x] Task: Create normalizer functions for each data format [checkpoint: 12e61aa]
  - `normalizeOHGOData()` - Ohio format
  - `normalizeWI511Data()` - Wisconsin format
  - `normalizeIndianaData()` - GeoJSON format
  - `normalizeMAASTO()` - Standard format (KY, MN, IL)
  - `normalizeArizonaData()` - AZ511 format
  - `normalizeGeorgiaData()` - GA511 format
  - `normalizeCaliforniaData()` - ArcGIS format
- [x] Task: Create `queryAllTPIMSSources()` aggregator function [checkpoint: f4477bc]
- [x] Task: Implement smart merging with data confidence ranking [checkpoint: 12e61aa]
- [x] Task: Update `getSourceLabel()` for UI display [checkpoint: f4477bc]

### Frontend Updates

- [x] Task: Add LIVE/REPORTED badge indicators for data confidence [checkpoint: d2a1644]
- [x] Task: Show sensor source label (e.g., "INDOT Sensors", "Caltrans") [checkpoint: d2a1644]

### Coverage Summary

| State | API | Data Type | Requires Key |
|-------|-----|-----------|--------------|
| Indiana | TrafficWise GeoJSON | Sensor | No |
| Kentucky | TRIMARC MAASTO | Sensor | No |
| Minnesota | MnDOT IRIS | Sensor | No |
| Illinois | TravelMidwest | Sensor | No |
| Ohio | OHGO REST | Sensor | Yes (OHGO_API_KEY) |
| Wisconsin | 511WI | Sensor | Yes (WI_511_API_KEY) |
| Arizona | AZ511 | Sensor | Optional |
| Georgia | GA511 | Sensor/Static | Optional |
| California | Caltrans ArcGIS | Static | No |

---

## Phase 2: Fuel Optimizer [checkpoint: f9a42cd]

**Goal:** Help drivers find cheapest diesel and calculate savings.

**Dependencies:** Phase 1 (shared infrastructure, location service)

**Estimated Effort:** 2-3 weeks

### Backend Tasks

- [x] Task: Create `fuelService.jsw` backend web module [checkpoint: fcffb62]
- [x] Task: Implement `FuelPrices` collection with schema (station_id, brand, diesel_price, def_price, card_discounts, amenities) [checkpoint: fcffb62]
- [x] Task: Implement `FuelCards` collection for driver fuel card storage (driver_id, card_type, card_number_last4) [checkpoint: fcffb62]
- [x] Task: Research and integrate primary fuel pricing API (GasBuddy or OPIS) [checkpoint: fcffb62]
- [x] Task: Obtain API credentials and configure in Wix Secrets Manager [checkpoint: fcffb62]
- [x] Task: Implement `queryFuelPricesAPI()` with rate limiting and caching (15 min TTL) [checkpoint: fcffb62]

### Core Service Functions

- [x] Task: Implement `searchFuelPrices(lat, lng, radius, options)` - find diesel prices [checkpoint: fcffb62]
- [x] Task: Implement `getFuelAlongRoute(routePoints, options)` - route-based fuel search [checkpoint: fcffb62]
- [x] Task: Implement `calculateFuelSavings(driverId, tripDetails)` - savings calculator [checkpoint: fcffb62]
- [x] Task: Implement `linkFuelCard(driverId, cardInfo)` - link fuel card for discounts [checkpoint: fcffb62]
- [x] Task: Implement `getFuelPriceTrends(state, days)` - regional price trends [checkpoint: fcffb62]
- [x] Task: Implement fuel card discount application logic (Comdata, EFS, T-Chek, Fleet One) [checkpoint: fcffb62]
- [x] Task: Implement effective price calculation (retail - discount) [checkpoint: fcffb62]
- [x] Task: Add sorting by effective price (not retail price) [checkpoint: fcffb62]

### Frontend Tasks

- [x] Task: Add Fuel Optimizer tab to DRIVER_ROAD_UTILITIES.html [checkpoint: fcffb62]
- [x] Task: Design fuel card selector component ("Your Fuel Card: Comdata ***4521") [checkpoint: fcffb62]
- [x] Task: Build search results with effective price display [checkpoint: fcffb62]
- [x] Task: Show retail price, discount amount, and effective price [checkpoint: fcffb62]
- [x] Task: Implement savings calculator ("Fill 150 gal = $X, save $Y vs avg") [checkpoint: fcffb62]
- [x] Task: Add DEF price display where available [checkpoint: fcffb62]
- [x] Task: Implement regional price trend indicator (up/down arrow + amount) [checkpoint: fcffb62]
- [x] Task: Add amenity icons (CAT scales, truck wash, DEF) [checkpoint: fcffb62]
- [x] Task: Implement "Add Fuel Card" modal [checkpoint: fcffb62]
- [x] Task: Build Trip Savings Calculator widget [checkpoint: fcffb62]

### Page Code Integration

- [x] Task: Add fuel service handlers to page code [checkpoint: fcffb62]
- [x] Task: Implement `searchFuel`, `linkCard`, `calculateSavings` message handlers [checkpoint: fcffb62]
- [x] Task: Store linked fuel cards in driver profile or local storage [checkpoint: fcffb62]
- [x] Task: Add analytics tracking for fuel searches and card links [checkpoint: fcffb62]

### Testing Tasks

- [x] Task: Test fuel price search and sorting [checkpoint: fcffb62]
- [x] Task: Test fuel card discount calculations for each card type [checkpoint: fcffb62]
- [x] Task: Test effective price calculation accuracy [checkpoint: fcffb62]
- [x] Task: Test savings calculator with various trip scenarios [checkpoint: fcffb62]
- [x] Task: Test API caching and fallback [checkpoint: fcffb62]
- [x] Task: Verify prices display correctly for all states [checkpoint: fcffb62]
- [x] Task: Conductor - User Manual Verification 'Phase 2: Fuel Optimizer' [checkpoint: fcffb62]

---

## Phase 3: Weigh Station Status [checkpoint: 511_api_done]

**Goal:** Show real-time weigh station open/closed status and bypass info.

**Dependencies:** Phase 1 (shared infrastructure)

**Estimated Effort:** 2 weeks

### Backend Tasks

- [x] Task: Create `weighStationService.jsw` backend web module
- [x] Task: Implement `WeighStations` collection (external_id, name, state, highway, mile_marker, status, prepass_enabled, drivewyze_enabled, bypass_rate)
- [x] Task: Implement `WeighStationReports` collection for driver reports (station_id, driver_id, report_type, wait_minutes)
- [x] Task: Research weigh station data sources (DriveWyze API, PrePass, state DOTs)
- [x] Task: Implement primary API integration (DriveWyze or state DOT aggregate)
- [x] Task: Seed database with known weigh station locations (all 50 states)

### Core Service Functions

- [x] Task: Implement `getWeighStationsAlongRoute(routePoints, options)` - route-based search
- [x] Task: Implement `getStationStatus(stationId)` - real-time status check
- [x] Task: Implement `reportStationStatus(stationId, report)` - driver reporting
- [x] Task: Implement `getStationsByState(state)` - state-level view
- [x] Task: Implement status confidence calculation (real-time vs driver-reported vs unknown)
- [x] Task: Implement bypass probability calculation based on PrePass data
- [x] Task: Add report validation and aggregation logic

### Frontend Tasks

- [x] Task: Add Weigh Station Status tab to DRIVER_ROAD_UTILITIES.html
- [x] Task: Design bypass service selector (PrePass/DriveWyze checkboxes)
- [x] Task: Build station status cards with open/closed indicator
- [x] Task: Show bypass rate percentage and estimated wait time
- [x] Task: Display driver reports ("Driver reports: 'Quick today' - 10 min ago")
- [x] Task: Add "Report Status" modal for driver submissions
- [x] Task: Implement route view showing all stations along trip
- [x] Task: Add status legend (Open, Closed, Unknown)

### Page Code Integration

- [x] Task: Add weigh station handlers to page code
- [x] Task: Implement `getStationsAlongRoute`, `reportStatus` handlers
- [x] Task: Store driver's bypass service preferences
- [x] Task: Add analytics for station searches and reports

### Testing Tasks

- [x] Task: Test station search along route
- [x] Task: Test driver report submission and validation
- [x] Task: Test status aggregation from multiple sources
- [x] Task: Test bypass rate display accuracy
- [x] Task: Verify all major interstate weigh stations are in database
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Weigh Station Status'

---

## Phase 4: Rest Stop Ratings

**Goal:** Build community-driven rest stop review system.

**Dependencies:** Phase 1 (ParkingLocations collection as base)

**Estimated Effort:** 2-3 weeks

### Backend Tasks

- [x] Task: Create `restStopService.jsw` backend web module
- [x] Task: Implement `RestStopReviews` collection (location_id, driver_id, overall_rating, ratings{}, review_text, photos, helpful_votes, is_verified)
- [x] Task: Implement `RestStopConditionReports` collection (location_id, report_type, details, expires_at, confirmations)
- [x] Task: Implement review aggregation logic (calculate avg ratings per category)
- [ ] Task: Implement review moderation flags (auto-flag profanity, spam detection)

### Core Service Functions

- [x] Task: Implement `getLocationReviews(locationId, options)` - fetch reviews with summary
- [x] Task: Implement `submitReview(locationId, review)` - submit new review
- [x] Task: Implement `submitConditionReport(locationId, report)` - real-time condition reports
- [x] Task: Implement `voteReview(reviewId, driverId, helpful)` - helpful vote system
- [x] Task: Implement `getTopRatedStops(lat, lng, radius, filters)` - find best stops
- [ ] Task: Add GPS verification for reviews (driver must be at location)
- [x] Task: Implement duplicate review prevention (1 per location per 30 days)
- [x] Task: Add condition report expiration (24h TTL)
- [ ] Task: Implement photo upload handling (resize, store in Wix Media)

### Frontend Tasks

- [x] Task: Add Rest Stop Ratings tab/integration to DRIVER_ROAD_UTILITIES.html
- [x] Task: Design review card component with multi-category ratings
- [x] Task: Build category rating display (cleanliness, safety, food, showers, parking)
- [ ] Task: Implement star rating selector for review submission
- [ ] Task: Add photo upload in review form
- [x] Task: Build "Recent Conditions" section showing active reports
- [x] Task: Implement "Helpful" vote buttons
- [x] Task: Add "Write a Review" modal with validation
- [x] Task: Build "Report Condition" quick buttons (shower wait, out of service, hazard)
- [x] Task: Implement review sorting (most recent, most helpful, highest rated)

### Page Code Integration

- [x] Task: Add review service handlers to page code
- [x] Task: Implement `getReviews`, `submitReview`, `voteReview`, `reportCondition` handlers
- [ ] Task: Implement GPS check before allowing review submission
- [ ] Task: Add analytics for review engagement

### Testing Tasks

- [x] Task: Test review submission flow
- [ ] Task: Test GPS verification logic
- [x] Task: Test duplicate review prevention
- [x] Task: Test helpful vote counting
- [x] Task: Test condition report expiration
- [ ] Task: Test photo upload and display
- [x] Task: Test rating aggregation calculation
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Rest Stop Ratings'

---

## Phase 5: Weather Alerts

**Goal:** Provide route-specific weather warnings and push notifications.

**Dependencies:** Phase 1 (shared infrastructure, route handling)

**Estimated Effort:** 2-3 weeks

### Backend Tasks

- [x] Task: Create `weatherAlertService.jsw` backend web module
- [ ] Task: Implement `WeatherAlerts` collection (nws_id, alert_type, event, severity, affected_zones, geometry, onset, expires)
- [ ] Task: Implement `DriverWeatherSubscriptions` collection (driver_id, alert_types, min_severity, push_enabled)
- [x] Task: Integrate NWS Weather API (free, authoritative source)
- [ ] Task: Implement alert polling job (every 10 min)
- [ ] Task: Implement zone-to-coordinate mapping for route checking

### Core Service Functions

- [x] Task: Implement `getRouteWeather(routePoints, options)` - alerts and forecasts along route
- [x] Task: Implement `getAlertsAtLocation(lat, lng)` - current location alerts
- [x] Task: Implement `subscribeToAlerts(driverId, preferences)` - alert preferences
- [x] Task: Implement `processNewAlerts()` - scheduled job to fetch and process alerts
- [x] Task: Implement `getChainRequirements(state, highway)` - chain law status
- [x] Task: Add alert deduplication logic (don't send same alert twice)
- [x] Task: Implement severity filtering based on driver preferences
- [x] Task: Create alert matching logic (route corridor intersection with alert zone)

### Scheduled Job Tasks

- [x] Task: Add `processWeatherAlerts` to jobs.config (every 10 min)
- [x] Task: Implement driver notification matching (who is affected by each alert)
- [ ] Task: Implement MemberNotification creation for severe alerts
- [x] Task: Add email notification option for severe weather

### Frontend Tasks

- [x] Task: Add Weather Alerts tab to DRIVER_ROAD_UTILITIES.html
- [x] Task: Design active alert card component (warning box with severity color)
- [x] Task: Build route forecast timeline showing weather at key waypoints
- [x] Task: Implement chain law display for mountain passes
- [ ] Task: Add alert preference settings panel
- [ ] Task: Build push notification opt-in flow
- [x] Task: Implement alert severity icons (warning, watch, advisory)
- [x] Task: Add "Share with Dispatch" button for severe alerts

### UI/UX Polish (Additional)
- [x] Task: Implement "Head-Up Display" (HUD) widget
- [x] Task: Refactor Navigation to Segmented Control
- [x] Task: Update Card Styling (Rounded, Hover effects)
- [x] Task: Add Floating Action Buttons (FAB) for quick actions

### Page Code Integration

- [x] Task: Add weather service handlers to page code
- [x] Task: Implement `getRouteWeather`, `subscribeAlerts`, `getChainLaws` handlers
- [x] Task: Store alert preferences
- [ ] Task: Implement push notification registration (if supported)

### Testing Tasks

- [x] Task: Test NWS API integration and response parsing
- [x] Task: Test route-alert intersection logic
- [x] Task: Test alert deduplication
- [x] Task: Test subscription preference saving
- [ ] Task: Test alert notification creation
- [x] Task: Test chain law display for known passes (Donner, Cajon, Snoqualmie)
- [x] Task: Verified `weatherAlertService.jsw` uses free NWS API (No Login)
- [x] Task: Added "Live Demo (NWS)" button to Weather Tab
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Weather Alerts'

---

## Phase 6: Road Conditions

**Goal:** Show construction, closures, and truck restrictions along routes.

**Dependencies:** Phase 5 (route weather logic can be adapted)

**Estimated Effort:** 2-3 weeks

### Backend Tasks

- [x] Task: Create `roadConditionService.jsw` backend web module
- [x] Task: Implement `RoadConditions` collection (type, highway, state, location, description, severity, delay_minutes, start_time, expected_end)
- [x] Task: Implement `TruckRestrictions` collection (highway, restriction_type, details, permanent)
- [x] Task: Research and integrate state 511 APIs (start with 10 major freight states)
- [x] Task: Implement FHWA data feed integration for interstate conditions
- [x] Task: Create state API adapter pattern for different 511 formats
- [x] Task: Implement Iowa Open Data (Socrata) adapter for "No Login" live demo
- [x] Task: Implement California/Texas adapters (Key-based) w/ placeholders
- [x] Task: Add "Live Demo" button to frontend for verifying Iowa feed

### Core Service Functions

- [x] Task: Implement `getRouteConditions(routePoints, options)` - conditions along route
- [x] Task: Implement `getTruckRestrictions(routePoints, truckSpecs)` - truck-specific restrictions (Iowa Open Data + Mock)
- [x] Task: Implement `getConditionsByState(state, filters)` - state-level view
- [x] Task: Implement `reportCondition(report)` - driver condition reports
- [ ] Task: Implement `getChainRequirements(routePoints)` - chain laws along route
- [ ] Task: Add condition severity classification (minor, moderate, major)
- [ ] Task: Implement delay estimation based on lane closures
- [ ] Task: Add truck restriction matching based on equipment specs

### Driver Report Tasks

- [ ] Task: Implement driver condition report submission
- [ ] Task: Add GPS validation for reports
- [ ] Task: Implement report expiration (4h TTL for conditions)
- [ ] Task: Add report confirmation system (multiple drivers = higher confidence)

### Frontend Tasks

- [ ] Task: Add Road Conditions tab to DRIVER_ROAD_UTILITIES.html
- [ ] Task: Design condition card component (type, location, severity, delay)
- [ ] Task: Build route summary header (X incidents, Y construction, Z closures)
- [ ] Task: Implement construction zone display with date ranges
- [ ] Task: Add chain law requirement cards
- [ ] Task: Implement truck restriction alerts based on driver's equipment
- [ ] Task: Build "Equipment Specs" settings panel (height, weight, length, hazmat)
- [ ] Task: Add "Report Condition" quick buttons
- [ ] Task: Implement alternate route suggestion for major closures

### Page Code Integration

- [ ] Task: Add road condition handlers to page code
- [ ] Task: Implement `getRouteConditions`, `getRestrictions`, `reportCondition` handlers
- [ ] Task: Store driver's equipment specs for restriction filtering
- [ ] Task: Add analytics for condition searches

### Testing Tasks

- [ ] Task: Test 511 API integration for multiple states
- [ ] Task: Test route condition matching
- [ ] Task: Test truck restriction filtering with various specs
- [ ] Task: Test driver report submission and validation
- [ ] Task: Test delay estimation accuracy
- [ ] Task: Verify major interstate construction zones are captured
- [ ] Task: Conductor - User Manual Verification 'Phase 6: Road Conditions'

---

## Cross-Phase Tasks

### Unified Dashboard Tasks

- [ ] Task: Design unified Road Utilities dashboard layout
- [ ] Task: Implement quick access bar with all feature tabs
- [ ] Task: Build "Nearby Summary" widget showing key info from all features
- [ ] Task: Implement "Plan a Route" input that triggers multi-feature analysis
- [ ] Task: Build "Recent Activity" section showing driver's utility usage
- [ ] Task: Create mobile-first responsive design

### Analytics & Observability Tasks

- [ ] Task: Define event tracking schema for all road utility features
- [ ] Task: Implement search analytics (what are drivers searching for?)
- [ ] Task: Track community contribution rates (reports, reviews)
- [ ] Task: Monitor API latency and error rates
- [ ] Task: Create admin dashboard for road utility metrics
- [ ] Task: Set up alerts for API failures

### Performance Optimization Tasks

- [ ] Task: Implement aggressive caching strategy for all APIs
- [ ] Task: Add request coalescing for concurrent identical searches
- [ ] Task: Optimize database queries with proper indexing
- [ ] Task: Implement lazy loading for map tiles and results
- [ ] Task: Add pagination for large result sets

---

## Phase Checkpoints

| Phase | Checkpoint | Validation Criteria |
|-------|------------|---------------------|
| 1 | Parking Finder | Search returns results, community reports work, map displays |
| 2 | Fuel Optimizer | Prices accurate, fuel card discounts apply, savings calculated |
| 3 | Weigh Station | Status shows, bypass rates display, reports work |
| 4 | Rest Stop Ratings | Reviews submit, ratings aggregate, conditions display |
| 5 | Weather Alerts | NWS alerts show, route forecasts work, subscriptions save |
| 6 | Road Conditions | 511 data shows, restrictions filter correctly, reports work |

---

## Rollout Plan

### Phase 1 Rollout (Parking Finder)
- Deploy to 20% of drivers (beta)
- Monitor search success rate and community report quality
- Gather feedback on data accuracy
- Full rollout after 1 week with >85% satisfaction

### Phase 2 Rollout (Fuel Optimizer)
- Deploy to all drivers (lower risk)
- Monitor fuel card link rate
- Track savings calculator usage
- Iterate on UI based on feedback

### Phase 3 Rollout (Weigh Station Status)
- Deploy to all drivers
- Partner with PrePass/DriveWyze if possible
- Monitor report submission rates
- Add more states based on driver locations

### Phase 4 Rollout (Rest Stop Ratings)
- Deploy to all drivers
- Seed with initial reviews from team
- Monitor review quality and moderation needs
- Gamify with "Top Reviewer" badges

### Phase 5 Rollout (Weather Alerts)
- Deploy to all drivers
- Start with major weather events only (severe severity)
- Expand to lower severity based on feedback
- Add push notifications when infrastructure ready

### Phase 6 Rollout (Road Conditions)
- Deploy to all drivers
- Start with top 10 freight states
- Expand state coverage monthly
- Partner with state DOTs for direct feeds

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| API costs exceed budget | High | Aggressive caching, rate limiting, usage caps |
| Inaccurate parking data | High | Multiple sources, community validation, confidence indicators |
| Low community participation | Medium | Gamification, incentives, make reporting frictionless |
| API provider changes terms | Medium | Multiple provider fallbacks, abstract API layer |
| Performance issues | Medium | Caching, lazy loading, CDN for static assets |
| GPS privacy concerns | Medium | Clear privacy policy, opt-in location sharing |

---

## Success Criteria

Track is complete when:
1. All 6 features deployed and stable
2. Daily active usage exceeds 200 drivers
3. Community contribution rate >5% of active users
4. API uptime >99%
5. User satisfaction >4.0/5 for each feature
6. 30-day retention improves by 20%+ vs baseline
