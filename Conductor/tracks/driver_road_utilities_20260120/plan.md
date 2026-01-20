# Track Plan: Driver Road Utilities

## Overview

This plan implements six road utility features to transform LMDR from a job-hunting platform into a daily-use operating system for CDL drivers. Each phase delivers a complete, valuable feature that increases platform stickiness.

**Priority Order:** Features ordered by driver demand (parking #1) and implementation complexity.

---

## Phase 1: Parking Finder

**Goal:** Solve the #1 driver pain point - finding available truck parking.

**Dependencies:** None (foundational feature)

**Estimated Effort:** 3-4 weeks

### Backend Infrastructure Tasks

- [ ] Task: Create `parkingService.jsw` backend web module
- [ ] Task: Implement `ParkingLocations` collection with schema (external_id, name, location, total_spaces, available_spaces, amenities, avg_rating)
- [ ] Task: Implement `ParkingReports` collection for community reports (location_id, driver_id, report_type, spaces_available, reported_at)
- [ ] Task: Implement `RoadUtilityCache` collection for API response caching with TTL
- [ ] Task: Create `locationService.jsw` shared module for geocoding and distance calculations
- [ ] Task: Implement cache layer with 5-minute TTL for parking searches

### External API Integration Tasks

- [ ] Task: Research and select primary parking API (TruckParkingClub or equivalent)
- [ ] Task: Obtain API credentials and configure in Wix Secrets Manager
- [ ] Task: Implement `queryTruckParkingClubAPI()` function with rate limiting
- [ ] Task: Implement fallback to ParkMyTruck API if primary fails
- [ ] Task: Implement state DOT rest area API integration (start with 10 major states)
- [ ] Task: Create API response normalization layer to standardize data from multiple sources
- [ ] Task: Implement circuit breaker pattern for API failures

### Core Service Functions

- [ ] Task: Implement `searchParking(lat, lng, radius, filters)` - main search function
- [ ] Task: Implement `getParkingDetails(locationId)` - detailed location info with reviews
- [ ] Task: Implement `reportParkingAvailability(locationId, report)` - community reporting
- [ ] Task: Implement `getParkingAlongRoute(routePoints, options)` - route-based search
- [ ] Task: Implement distance calculation and sorting by distance from driver
- [ ] Task: Implement amenity filtering (showers, wifi, restaurant, fuel)
- [ ] Task: Implement availability status calculation (available, limited, full, unknown)
- [ ] Task: Add report validation (rate limit 1 report per location per hour per driver)
- [ ] Task: Implement report aggregation to estimate availability from multiple reports

### Frontend Tasks

- [ ] Task: Create `DRIVER_ROAD_UTILITIES.html` in `src/public/driver/`
- [ ] Task: Design and implement Parking Finder tab UI
- [ ] Task: Implement search bar with location input and radius selector
- [ ] Task: Implement amenity filter checkboxes
- [ ] Task: Build results list with parking cards (name, availability, distance, amenities, rating)
- [ ] Task: Implement availability indicator colors (green/yellow/red/gray)
- [ ] Task: Add "Navigate" button linking to Google Maps/Apple Maps
- [ ] Task: Add "Report Parking" modal for community submissions
- [ ] Task: Add "Details" expansion with full location info and reviews
- [ ] Task: Implement loading states and error handling
- [ ] Task: Add empty state for no results found
- [ ] Task: Implement mobile-responsive layout

### Map Integration Tasks

- [ ] Task: Integrate map view (Google Maps or Mapbox)
- [ ] Task: Implement map markers with availability color coding
- [ ] Task: Add marker clustering for dense areas
- [ ] Task: Implement "Search this area" when map pans
- [ ] Task: Add toggle between Map and List views

### Page Code Integration

- [ ] Task: Create `roadUtilities.xxxxx.js` page code file
- [ ] Task: Implement postMessage bridge for Parking Finder
- [ ] Task: Add handlers: `searchParking`, `getParkingDetails`, `reportParking`
- [ ] Task: Implement geolocation for "Current Location" searches
- [ ] Task: Add analytics tracking for parking searches

### Testing Tasks

- [ ] Task: Write unit tests for `searchParking` with mock API responses
- [ ] Task: Test amenity filtering logic
- [ ] Task: Test cache hit/miss scenarios
- [ ] Task: Test community report submission and validation
- [ ] Task: Test API fallback when primary source fails
- [ ] Task: Test mobile responsiveness across device sizes
- [ ] Task: Load test with 100 concurrent searches
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Parking Finder'

---

## Phase 2: Fuel Optimizer

**Goal:** Help drivers find cheapest diesel and calculate savings.

**Dependencies:** Phase 1 (shared infrastructure, location service)

**Estimated Effort:** 2-3 weeks

### Backend Tasks

- [ ] Task: Create `fuelService.jsw` backend web module
- [ ] Task: Implement `FuelPrices` collection with schema (station_id, brand, diesel_price, def_price, card_discounts, amenities)
- [ ] Task: Implement `FuelCards` collection for driver fuel card storage (driver_id, card_type, card_number_last4)
- [ ] Task: Research and integrate primary fuel pricing API (GasBuddy or OPIS)
- [ ] Task: Obtain API credentials and configure in Wix Secrets Manager
- [ ] Task: Implement `queryFuelPricesAPI()` with rate limiting and caching (15 min TTL)

### Core Service Functions

- [ ] Task: Implement `searchFuelPrices(lat, lng, radius, options)` - find diesel prices
- [ ] Task: Implement `getFuelAlongRoute(routePoints, options)` - route-based fuel search
- [ ] Task: Implement `calculateFuelSavings(driverId, tripDetails)` - savings calculator
- [ ] Task: Implement `linkFuelCard(driverId, cardInfo)` - link fuel card for discounts
- [ ] Task: Implement `getFuelPriceTrends(state, days)` - regional price trends
- [ ] Task: Implement fuel card discount application logic (Comdata, EFS, T-Chek, Fleet One)
- [ ] Task: Implement effective price calculation (retail - discount)
- [ ] Task: Add sorting by effective price (not retail price)

### Frontend Tasks

- [ ] Task: Add Fuel Optimizer tab to DRIVER_ROAD_UTILITIES.html
- [ ] Task: Design fuel card selector component ("Your Fuel Card: Comdata ***4521")
- [ ] Task: Build search results with effective price display
- [ ] Task: Show retail price, discount amount, and effective price
- [ ] Task: Implement savings calculator ("Fill 150 gal = $X, save $Y vs avg")
- [ ] Task: Add DEF price display where available
- [ ] Task: Implement regional price trend indicator (up/down arrow + amount)
- [ ] Task: Add amenity icons (CAT scales, truck wash, DEF)
- [ ] Task: Implement "Add Fuel Card" modal
- [ ] Task: Build Trip Savings Calculator widget

### Page Code Integration

- [ ] Task: Add fuel service handlers to page code
- [ ] Task: Implement `searchFuel`, `linkCard`, `calculateSavings` message handlers
- [ ] Task: Store linked fuel cards in driver profile or local storage
- [ ] Task: Add analytics tracking for fuel searches and card links

### Testing Tasks

- [ ] Task: Test fuel price search and sorting
- [ ] Task: Test fuel card discount calculations for each card type
- [ ] Task: Test effective price calculation accuracy
- [ ] Task: Test savings calculator with various trip scenarios
- [ ] Task: Test API caching and fallback
- [ ] Task: Verify prices display correctly for all states
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Fuel Optimizer'

---

## Phase 3: Weigh Station Status

**Goal:** Show real-time weigh station open/closed status and bypass info.

**Dependencies:** Phase 1 (shared infrastructure)

**Estimated Effort:** 2 weeks

### Backend Tasks

- [ ] Task: Create `weighStationService.jsw` backend web module
- [ ] Task: Implement `WeighStations` collection (external_id, name, state, highway, mile_marker, status, prepass_enabled, drivewyze_enabled, bypass_rate)
- [ ] Task: Implement `WeighStationReports` collection for driver reports (station_id, driver_id, report_type, wait_minutes)
- [ ] Task: Research weigh station data sources (DriveWyze API, PrePass, state DOTs)
- [ ] Task: Implement primary API integration (DriveWyze or state DOT aggregate)
- [ ] Task: Seed database with known weigh station locations (all 50 states)

### Core Service Functions

- [ ] Task: Implement `getWeighStationsAlongRoute(routePoints, options)` - route-based search
- [ ] Task: Implement `getStationStatus(stationId)` - real-time status check
- [ ] Task: Implement `reportStationStatus(stationId, report)` - driver reporting
- [ ] Task: Implement `getStationsByState(state)` - state-level view
- [ ] Task: Implement status confidence calculation (real-time vs driver-reported vs unknown)
- [ ] Task: Implement bypass probability calculation based on PrePass data
- [ ] Task: Add report validation and aggregation logic

### Frontend Tasks

- [ ] Task: Add Weigh Station Status tab to DRIVER_ROAD_UTILITIES.html
- [ ] Task: Design bypass service selector (PrePass/DriveWyze checkboxes)
- [ ] Task: Build station status cards with open/closed indicator
- [ ] Task: Show bypass rate percentage and estimated wait time
- [ ] Task: Display driver reports ("Driver reports: 'Quick today' - 10 min ago")
- [ ] Task: Add "Report Status" modal for driver submissions
- [ ] Task: Implement route view showing all stations along trip
- [ ] Task: Add status legend (Open, Closed, Unknown)

### Page Code Integration

- [ ] Task: Add weigh station handlers to page code
- [ ] Task: Implement `getStationsAlongRoute`, `reportStatus` handlers
- [ ] Task: Store driver's bypass service preferences
- [ ] Task: Add analytics for station searches and reports

### Testing Tasks

- [ ] Task: Test station search along route
- [ ] Task: Test driver report submission and validation
- [ ] Task: Test status aggregation from multiple sources
- [ ] Task: Test bypass rate display accuracy
- [ ] Task: Verify all major interstate weigh stations are in database
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Weigh Station Status'

---

## Phase 4: Rest Stop Ratings

**Goal:** Build community-driven rest stop review system.

**Dependencies:** Phase 1 (ParkingLocations collection as base)

**Estimated Effort:** 2-3 weeks

### Backend Tasks

- [ ] Task: Create `restStopService.jsw` backend web module
- [ ] Task: Implement `RestStopReviews` collection (location_id, driver_id, overall_rating, ratings{}, review_text, photos, helpful_votes, is_verified)
- [ ] Task: Implement `RestStopConditionReports` collection (location_id, report_type, details, expires_at, confirmations)
- [ ] Task: Implement review aggregation logic (calculate avg ratings per category)
- [ ] Task: Implement review moderation flags (auto-flag profanity, spam detection)

### Core Service Functions

- [ ] Task: Implement `getLocationReviews(locationId, options)` - fetch reviews with summary
- [ ] Task: Implement `submitReview(locationId, review)` - submit new review
- [ ] Task: Implement `submitConditionReport(locationId, report)` - real-time condition reports
- [ ] Task: Implement `voteReview(reviewId, driverId, helpful)` - helpful vote system
- [ ] Task: Implement `getTopRatedStops(lat, lng, radius, filters)` - find best stops
- [ ] Task: Add GPS verification for reviews (driver must be at location)
- [ ] Task: Implement duplicate review prevention (1 per location per 30 days)
- [ ] Task: Add condition report expiration (24h TTL)
- [ ] Task: Implement photo upload handling (resize, store in Wix Media)

### Frontend Tasks

- [ ] Task: Add Rest Stop Ratings tab/integration to DRIVER_ROAD_UTILITIES.html
- [ ] Task: Design review card component with multi-category ratings
- [ ] Task: Build category rating display (cleanliness, safety, food, showers, parking)
- [ ] Task: Implement star rating selector for review submission
- [ ] Task: Add photo upload in review form
- [ ] Task: Build "Recent Conditions" section showing active reports
- [ ] Task: Implement "Helpful" vote buttons
- [ ] Task: Add "Write a Review" modal with validation
- [ ] Task: Build "Report Condition" quick buttons (shower wait, out of service, hazard)
- [ ] Task: Implement review sorting (most recent, most helpful, highest rated)

### Page Code Integration

- [ ] Task: Add review service handlers to page code
- [ ] Task: Implement `getReviews`, `submitReview`, `voteReview`, `reportCondition` handlers
- [ ] Task: Implement GPS check before allowing review submission
- [ ] Task: Add analytics for review engagement

### Testing Tasks

- [ ] Task: Test review submission flow
- [ ] Task: Test GPS verification logic
- [ ] Task: Test duplicate review prevention
- [ ] Task: Test helpful vote counting
- [ ] Task: Test condition report expiration
- [ ] Task: Test photo upload and display
- [ ] Task: Test rating aggregation calculation
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Rest Stop Ratings'

---

## Phase 5: Weather Alerts

**Goal:** Provide route-specific weather warnings and push notifications.

**Dependencies:** Phase 1 (shared infrastructure, route handling)

**Estimated Effort:** 2-3 weeks

### Backend Tasks

- [ ] Task: Create `weatherAlertService.jsw` backend web module
- [ ] Task: Implement `WeatherAlerts` collection (nws_id, alert_type, event, severity, affected_zones, geometry, onset, expires)
- [ ] Task: Implement `DriverWeatherSubscriptions` collection (driver_id, alert_types, min_severity, push_enabled)
- [ ] Task: Integrate NWS Weather API (free, authoritative source)
- [ ] Task: Implement alert polling job (every 10 min)
- [ ] Task: Implement zone-to-coordinate mapping for route checking

### Core Service Functions

- [ ] Task: Implement `getRouteWeather(routePoints, options)` - alerts and forecasts along route
- [ ] Task: Implement `getAlertsAtLocation(lat, lng)` - current location alerts
- [ ] Task: Implement `subscribeToAlerts(driverId, preferences)` - alert preferences
- [ ] Task: Implement `processNewAlerts()` - scheduled job to fetch and process alerts
- [ ] Task: Implement `getChainRequirements(state, highway)` - chain law status
- [ ] Task: Add alert deduplication logic (don't send same alert twice)
- [ ] Task: Implement severity filtering based on driver preferences
- [ ] Task: Create alert matching logic (route corridor intersection with alert zone)

### Scheduled Job Tasks

- [ ] Task: Add `processWeatherAlerts` to jobs.config (every 10 min)
- [ ] Task: Implement driver notification matching (who is affected by each alert)
- [ ] Task: Implement MemberNotification creation for severe alerts
- [ ] Task: Add email notification option for severe weather

### Frontend Tasks

- [ ] Task: Add Weather Alerts tab to DRIVER_ROAD_UTILITIES.html
- [ ] Task: Design active alert card component (warning box with severity color)
- [ ] Task: Build route forecast timeline showing weather at key waypoints
- [ ] Task: Implement chain law display for mountain passes
- [ ] Task: Add alert preference settings panel
- [ ] Task: Build push notification opt-in flow
- [ ] Task: Implement alert severity icons (warning, watch, advisory)
- [ ] Task: Add "Share with Dispatch" button for severe alerts

### Page Code Integration

- [ ] Task: Add weather service handlers to page code
- [ ] Task: Implement `getRouteWeather`, `subscribeAlerts`, `getChainLaws` handlers
- [ ] Task: Store alert preferences
- [ ] Task: Implement push notification registration (if supported)

### Testing Tasks

- [ ] Task: Test NWS API integration and response parsing
- [ ] Task: Test route-alert intersection logic
- [ ] Task: Test alert deduplication
- [ ] Task: Test subscription preference saving
- [ ] Task: Test alert notification creation
- [ ] Task: Test chain law display for known passes (Donner, Cajon, Snoqualmie)
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Weather Alerts'

---

## Phase 6: Road Conditions

**Goal:** Show construction, closures, and truck restrictions along routes.

**Dependencies:** Phase 5 (route weather logic can be adapted)

**Estimated Effort:** 2-3 weeks

### Backend Tasks

- [ ] Task: Create `roadConditionService.jsw` backend web module
- [ ] Task: Implement `RoadConditions` collection (type, highway, state, location, description, severity, delay_minutes, start_time, expected_end)
- [ ] Task: Implement `TruckRestrictions` collection (highway, restriction_type, details, permanent)
- [ ] Task: Research and integrate state 511 APIs (start with 10 major freight states)
- [ ] Task: Implement FHWA data feed integration for interstate conditions
- [ ] Task: Create state API adapter pattern for different 511 formats

### Core Service Functions

- [ ] Task: Implement `getRouteConditions(routePoints, options)` - conditions along route
- [ ] Task: Implement `getTruckRestrictions(routePoints, truckSpecs)` - truck-specific restrictions
- [ ] Task: Implement `getConditionsByState(state, filters)` - state-level view
- [ ] Task: Implement `reportCondition(report)` - driver condition reports
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
