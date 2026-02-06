# Wave 7 Task Cards — Community & Road Utilities

**Timeline:** Weeks 15-16 (post Gate 2)
**Juniors:** J7, J1

---

## Wave 7 Key Notes

- **DRIVER_FORUMS** and **ADMIN_MODERATION** use `{ type, payload }` envelope (different from other `type`-based pages that use `{ type, data }`)
- **Road Utilities is the second-largest page** in the system (~25 actions across 6 phases)
- `parkingService.jsw` has direct wixData cache calls — flag as accepted pattern (cache layer)
- Existing service tests: `forumService.test.js`, `moderationService.test.js`, `reputationService.test.js`, `healthService.test.js`, `petFriendlyService.test.js`, `restStopService.test.js`, `weatherAlertService.test.js`, `weighStationService.test.js`

---

# JUNIOR 7 (J7): Forums, Moderation, Health & Pet Friendly

## J7-A: Community Seed + Connection Test

### Deliverables
| # | File |
|---|------|
| 1 | `src/backend/seeds/seedCommunity.jsw` |
| 2 | `src/backend/tests/communityConnectionTest.jsw` |

### Collection Keys
| Key | Expected Airtable Table |
|-----|------------------------|
| `forumCategories` | `v2_Forum_Categories` |
| `forumThreads` | `v2_Forum_Threads` |
| `forumPosts` | `v2_Forum_Posts` |
| `forumReports` | `v2_Forum_Reports` |
| `healthResources` | `v2_Health_Resources` |
| `healthTips` | `v2_Health_Tips` |
| `petFriendlyLocations` | `v2_Pet_Friendly_Locations` |
| `petFriendlyReviews` | `v2_Pet_Friendly_Reviews` |

### Seed Data
- 3 forum categories, 5 threads (across categories), 10 posts, 3 reports (pending, resolved, dismissed)
- 5 health resources, 5 health tips (mix of approved/pending)
- 5 pet-friendly locations, 5 reviews

**NOTE:** `seedPetFriendly.jsw` already exists. Check overlap.

## J7-B: Driver Forums Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/driverForums.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/driverForums.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/DRIVER_FORUMS.vzg3s.js` — `{ type, payload }` envelope

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | `ready` | `getCategories()` | `categoriesData` |
| 2 | `getCategories` | `getCategories()` | `categoriesData` |
| 3 | `getThreads` | `getThreadsByCategory(categoryId)` | `threadsData` |
| 4 | `getPosts` | `getPostsByThread(threadId)` | `threadDetailData` |
| 5 | `getThreadBySlug` | `getThreadBySlug(slug)` + `getPostsByThread(threadId)` | `threadDetailData` |
| 6 | `createThread` | `createThread({title, content, categoryId})` | `threadCreated` |
| 7 | `createPost` | `createPost({threadId, content})` | `postCreated` |
| 8 | `likePost` | `likePost(postId)` | silent |

## J7-C: Admin Moderation Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/adminModeration.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/adminModeration.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/ADMIN_MODERATION.sn1km.js` — `{ type, payload }` envelope

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | `ready` | `getModQueue({status:'pending'})` | `queueData` |
| 2 | `getQueue` | `getModQueue({status})` | `queueData` |
| 3 | `moderateReport` | `moderatePost(reportId, action, notes)` | `actionSuccess` or `actionError` |

**Action mapping:** `dismiss` → `approve`, `warn` → `warn`, `hide` → `hide`, `ban` → `ban`

## J7-D: Health & Pet Friendly pages

These pages (**HEALTH_WELLNESS**, **PET_FRIENDLY**) are HTML-only community pages without dedicated Wix page code bridge files. Verify by reading the HTML files. If no page code wiring exists, document as "HTML-only, no bridge test needed."

### J7 Acceptance Criteria
- [ ] `seedCommunity.jsw` seeds across 8 collections (complements existing seedPetFriendly)
- [ ] `communityConnectionTest.jsw` passes all 4 phases
- [ ] `driverForums.bridge.test.js` tests 8 actions
- [ ] `driverForums.html.test.js` tests DOM rendering (categoriesData, threadsData, threadDetailData, threadCreated)
- [ ] `adminModeration.bridge.test.js` tests 3 actions with action mapping
- [ ] `adminModeration.html.test.js` tests DOM rendering (queueData, actionSuccess/actionError)
- [ ] Health & Pet Friendly page status documented

---

# JUNIOR 1 (J1): Road Utilities

## J1-A: Road Utilities Seed + Connection Test

### Deliverables
| # | File |
|---|------|
| 1 | `src/backend/seeds/seedRoadUtilities.jsw` |
| 2 | `src/backend/tests/roadUtilitiesConnectionTest.jsw` |

### Collection Keys
| Key | Expected Airtable Table |
|-----|------------------------|
| `parkingLocations` | `v2_Parking_Locations` |
| `parkingReports` | `v2_Parking_Reports` |
| `fuelPrices` | `v2_Fuel_Prices` |
| `fuelCards` | `v2_Fuel_Cards` |
| `roadUtilityCache` | `v2_Road_Utility_Cache` |

**NOTE:** `seedMockData.jsw` already seeds fuel prices and road conditions. Check overlap.

## J1-B: Road Utilities Bridge + HTML DOM Tests (NEW) — Largest in Wave 7

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/roadUtilities.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/roadUtilities.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/Road Utilities.xzvqe.js` — `{ type, data }` envelope

Group tests by phase:

**Utility (2):**
| Type | Response |
|------|----------|
| `ping` | `pong` |
| `ready` | `init` (initial config) |

**Phase 1 — Parking (3):**
| Type | Calls | Response |
|------|-------|----------|
| `searchParking` | `searchParking(lat, lng, radius, filters)` | `parkingResults` |
| `getParkingDetails` | `getParkingDetails(locationId)` | `parkingDetails` |
| `reportParking` | `reportParkingAvailability(locationId, report)` | `reportResult` |

**Phase 2 — Fuel (4):**
| Type | Calls | Response |
|------|-------|----------|
| `searchFuel` | `searchFuelPrices(lat, lng, radius, options)` | `fuelResults` |
| `linkFuelCard` | `linkFuelCard(userId, cardInfo)` | `fuelCardLinked` |
| `getDriverFuelCards` | `getDriverFuelCards(userId)` | `fuelCardsLoaded` |
| `calculateSavings` | `calculateFuelSavings(userId, tripDetails)` | `savingsResult` |

**Phase 3 — Weigh Stations (5):**
| Type | Calls | Response |
|------|-------|----------|
| `searchWeighStations` | `searchWeighStations(lat, lng, radius, options)` | `weighStationResults` |
| `getStationStatus` | `getStationStatus(stationId)` | `stationStatusResult` |
| `reportStationStatus` | `reportStationStatus(stationId, report)` | `stationStatusResult` |
| `getDriverBypassServices` | `getDriverBypassServices(userId)` | `bypassServicesLoaded` |
| `saveDriverBypassServices` | `saveDriverBypassServices(userId, services)` | `bypassServicesSaved` |

**Phase 4 — Rest Stops (4):**
| Type | Calls | Response |
|------|-------|----------|
| `getReviews` | `getLocationReviews(locationId, options)` | `reviewsLoaded` |
| `submitReview` | `submitReview(locationId, reviewData)` | `reviewSubmitted` |
| `reportCondition` | `submitConditionReport(locationId, reportData)` | `conditionReported` |
| `voteReview` | `voteReview(reviewId, isHelpful)` | `voteRegistered` |

**Phase 5 — Weather (1):**
| Type | Calls | Response |
|------|-------|----------|
| `getWeather` | `getChainRequirements` + `getRouteWeather` or `getAlertsAtLocation` | `weatherResults` |

**Phase 6 — Road Conditions (4):**
| Type | Calls | Response |
|------|-------|----------|
| `getRoadConditions` | `getRouteConditions(routePoints)` | `conditionsResults` |
| `getTruckRestrictions` | `getTruckRestrictions(routePoints, truckSpecs)` | `restrictionResults` |
| `reportRoadCondition` | `reportCondition(report)` | `roadConditionReported` |
| `verifyConditionReport` | `verifyConditionReport(reportId, userId)` | silent |

**Total: 25 actions**

### J1 Acceptance Criteria
- [ ] `seedRoadUtilities.jsw` seeds across 5 collections (complements existing seeds)
- [ ] `roadUtilitiesConnectionTest.jsw` passes all 4 phases
- [ ] `roadUtilities.bridge.test.js` tests all 25 actions grouped by phase
- [ ] `roadUtilities.html.test.js` tests DOM rendering grouped by phase (parkingResults, fuelResults, weighStationResults, reviewsLoaded, weatherResults, conditionsResults)
- [ ] Login-required actions tested with auth mock
