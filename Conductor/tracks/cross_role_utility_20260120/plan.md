# Track Plan: Cross-Role Utility - Feature Cross-Pollination

> **Priority**: High
> **Estimated Duration**: 4 Phases
> **Dependencies**: driver_cockpit_20251221, reverse_matching_20251225, retention_dashboard

---

## Phase 1: Mutual Interest Indicator

**Goal**: Show drivers when a carrier they're interested in has ALSO shown interest in them (viewed profile, added to pipeline, or contacted).

### 1.1 Backend Service Development

- [ ] Task: Create `src/backend/mutualInterestService.jsw` with file header and imports
- [ ] Task: Implement `getDriverExpressedInterests(driverId)` - Query DriverCarrierInterests for all carriers driver expressed interest in
- [ ] Task: Implement `getCarrierActivityForDriver(driverId, carrierDots)` - Query CarrierDriverViews and CarrierDriverOutreach for matching carrier activity
- [ ] Task: Implement `calculateMutualStrength(signals)` - Return 'weak' (viewed), 'moderate' (pipeline), 'strong' (contacted)
- [ ] Task: Implement `getMutualInterestForDriver(driverId)` - Main function combining all checks
- [ ] Task: Add authorization check - driver can only query their own interests
- [ ] Task: Add observability logging for mutual interest queries

### 1.2 Unit Tests

- [ ] Task: Create `src/public/__tests__/mutualInterestService.test.js`
- [ ] Task: Write test: Driver with no expressed interests returns empty array
- [ ] Task: Write test: Driver with interests but no carrier activity returns mutual: false
- [ ] Task: Write test: Driver with carrier view returns mutual: true, signal: 'viewed'
- [ ] Task: Write test: Driver with carrier pipeline add returns mutual: true, signal: 'pipeline'
- [ ] Task: Write test: Driver with carrier contact returns mutual: true, strength: 'strong'
- [ ] Task: Write test: Authorization fails for non-matching driver ID
- [ ] Task: Run tests - verify all pass

### 1.3 Frontend Integration

- [ ] Task: Update `src/public/driver/AI_MATCHING.html` to call `getMutualInterestForDriver()` on load
- [ ] Task: Add mutual interest badge component: `[MUTUAL MATCH]` with green styling
- [ ] Task: Add mutual interest detail panel showing carrier activity timeline
- [ ] Task: Update carrier card layout to accommodate mutual badge
- [ ] Task: Add sort option: "Mutual matches first"
- [ ] Task: Add filter option: "Show only mutual matches"

### 1.4 Page Code Wiring

- [ ] Task: Update driver dashboard page code to handle mutual interest data
- [ ] Task: Add postMessage handler for mutual interest queries from HTML component
- [ ] Task: Add error handling for failed mutual interest queries

### 1.5 Verification

- [ ] Task: Manual test - Create driver interest, then carrier view, verify badge appears
- [ ] Task: Manual test - Verify sort by mutual matches works
- [ ] Task: Manual test - Verify filter for mutual matches works
- [ ] Task: Verify observability logs capture mutual interest queries
- [ ] Task: Conductor - Phase 1 Complete

---

## Phase 2: Retention Dashboard for Carriers

**Goal**: Expose the existing recruiter retention scoring directly to carriers who have Pro/Enterprise subscriptions.

### 2.1 Backend Service Extension

- [ ] Task: Open `src/backend/retentionService.jsw` for extension
- [ ] Task: Implement `verifyCarrierOwnership(carrierDot)` - Check current user owns carrier via Carriers collection
- [ ] Task: Implement `getCarrierRetentionDashboardForCarrier(carrierDot)` - Wrapper with carrier-specific auth
- [ ] Task: Add subscription tier check - require Pro or Enterprise
- [ ] Task: Add carrier-specific messaging and branding to response
- [ ] Task: Implement `getCarrierRetentionSummary(carrierDot)` - Lightweight version for dashboard card
- [ ] Task: Add observability logging for carrier retention access

### 2.2 Unit Tests

- [ ] Task: Create `src/public/__tests__/retentionServiceCarrier.test.js`
- [ ] Task: Write test: Unauthenticated user rejected
- [ ] Task: Write test: Free tier user rejected with upgrade prompt
- [ ] Task: Write test: User without carrier ownership rejected
- [ ] Task: Write test: Pro tier carrier owner receives full dashboard
- [ ] Task: Write test: Enterprise tier carrier owner receives full dashboard
- [ ] Task: Write test: Summary endpoint returns lightweight data
- [ ] Task: Run tests - verify all pass

### 2.3 Frontend Component

- [ ] Task: Create `src/public/carrier/Carrier_Retention_Dashboard.html`
- [ ] Task: Build header with fleet health score gauge (circular progress)
- [ ] Task: Build ROI summary card showing cost avoided and drivers saved
- [ ] Task: Build risk distribution chart (horizontal bars for LOW/MED/HIGH/CRITICAL)
- [ ] Task: Build at-risk watchlist table with driver names, risk levels, primary factors
- [ ] Task: Add action buttons per driver: "Schedule 1:1", "View Performance"
- [ ] Task: Add export CSV functionality for at-risk list
- [ ] Task: Build upgrade CTA for free tier users

### 2.4 Carrier Portal Integration

- [ ] Task: Add "Driver Retention" navigation item to carrier portal sidebar
- [ ] Task: Create page code for Carrier_Retention_Dashboard page
- [ ] Task: Wire postMessage handlers for retention data fetching
- [ ] Task: Add loading states and error handling
- [ ] Task: Add refresh button with timestamp of last data pull

### 2.5 Verification

- [ ] Task: Manual test - Free tier carrier sees upgrade CTA instead of dashboard
- [ ] Task: Manual test - Pro tier carrier sees full retention dashboard
- [ ] Task: Manual test - Risk distribution chart renders correctly
- [ ] Task: Manual test - At-risk watchlist shows correct data
- [ ] Task: Manual test - Export CSV downloads correct data
- [ ] Task: Verify observability logs capture carrier retention access
- [ ] Task: Conductor - Phase 2 Complete

---

## Phase 3: Match Explanation for Drivers

**Goal**: Show drivers WHY they matched with a carrier based on the carrier's hiring preferences (preference inversion).

### 3.1 Backend Service Development

- [ ] Task: Create `src/backend/matchExplanationService.jsw` with file header and imports
- [ ] Task: Implement `getCarrierWeightsForExplanation(carrierDot)` - Get hiring preference weights
- [ ] Task: Implement `calculateDriverFitPerCategory(driver, preferences)` - Score driver in each category
- [ ] Task: Implement `generateCategoryExplanation(category, weight, fit, driver, preferences)` - Human-readable text
- [ ] Task: Implement `generateMatchTip(scores, preferences)` - Actionable tip for driver
- [ ] Task: Implement `getMatchExplanationForDriver(driverId, carrierDot)` - Main function
- [ ] Task: Add authorization check - driver can only query their own explanations
- [ ] Task: Add caching for carrier preferences (reduce DB queries)
- [ ] Task: Add observability logging for explanation queries

### 3.2 Unit Tests

- [ ] Task: Create `src/public/__tests__/matchExplanationService.test.js`
- [ ] Task: Write test: Carrier with no preferences returns default weights
- [ ] Task: Write test: Driver with matching CDL type gets high qualifications score
- [ ] Task: Write test: Driver with missing endorsement gets explanation of gap
- [ ] Task: Write test: Experience above minimum generates positive explanation
- [ ] Task: Write test: Location within radius generates positive explanation
- [ ] Task: Write test: Tip generation includes actionable suggestion
- [ ] Task: Write test: Authorization fails for non-matching driver ID
- [ ] Task: Run tests - verify all pass

### 3.3 Frontend Component Updates

- [ ] Task: Update `src/public/driver/AI_MATCHING.html` carrier card with expandable explanation
- [ ] Task: Build explanation panel with category bars showing weight and fit
- [ ] Task: Add "Why You Matched" section header
- [ ] Task: Build individual category rows: name, weight %, driver fit %, explanation text
- [ ] Task: Add strength indicator icons (checkmark for strengths, info for gaps)
- [ ] Task: Build tip section at bottom with background highlight
- [ ] Task: Add expand/collapse animation for explanation panel
- [ ] Task: Mobile-responsive layout for explanation panel

### 3.4 Page Code Wiring

- [ ] Task: Add postMessage handler for `getMatchExplanation` requests
- [ ] Task: Cache explanation data to avoid re-fetching on expand/collapse
- [ ] Task: Add loading state for explanation panel
- [ ] Task: Add error handling for failed explanation queries

### 3.5 Verification

- [ ] Task: Manual test - Click carrier card, verify explanation panel expands
- [ ] Task: Manual test - Verify category weights sum to 100% display
- [ ] Task: Manual test - Verify driver fit scores match expectations
- [ ] Task: Manual test - Verify explanation text is human-readable
- [ ] Task: Manual test - Verify tip provides actionable suggestion
- [ ] Task: Verify observability logs capture explanation queries
- [ ] Task: Conductor - Phase 3 Complete

---

## Phase 4: System Health for Recruiters

**Goal**: Surface relevant system health metrics (API latency, enrichment status) to recruiters in their console.

### 4.1 Backend Service Development

- [ ] Task: Create `src/backend/recruiterHealthService.jsw` with file header and imports
- [ ] Task: Implement `getEnrichmentHealth()` - Query CarrierEnrichments for completeness and recency
- [ ] Task: Implement `getSearchHealth()` - Query SystemLogs for search latency metrics
- [ ] Task: Implement `getFmcsaHealth()` - Query CarrierSafetyData for cache freshness
- [ ] Task: Implement `getAiServiceHealth()` - Check AI router status and fallback availability
- [ ] Task: Implement `calculateOverallStatus(services)` - Aggregate to healthy/degraded/down
- [ ] Task: Implement `generateAlerts(services)` - Create alert messages for degraded services
- [ ] Task: Implement `getRecruiterHealthStatus()` - Main function combining all checks
- [ ] Task: Add role check - recruiter or admin only
- [ ] Task: Add response caching (60 second TTL to reduce DB load)

### 4.2 Unit Tests

- [ ] Task: Create `src/public/__tests__/recruiterHealthService.test.js`
- [ ] Task: Write test: All services healthy returns overall_status: 'healthy'
- [ ] Task: Write test: Enrichment below 90% returns overall_status: 'degraded'
- [ ] Task: Write test: Search latency above 3000ms returns degraded
- [ ] Task: Write test: FMCSA data older than 24 hours returns warning
- [ ] Task: Write test: Multiple degraded services returns correct alerts array
- [ ] Task: Write test: Non-recruiter access rejected
- [ ] Task: Write test: Response caching works (second call within 60s returns cached)
- [ ] Task: Run tests - verify all pass

### 4.3 Frontend Component

- [ ] Task: Create `src/public/recruiter/Recruiter_System_Health.html` widget component
- [ ] Task: Build compact header bar with overall status indicator (GREEN/YELLOW/RED circle)
- [ ] Task: Build status text: "All Systems Operational" / "Some Services Degraded" / "Service Disruption"
- [ ] Task: Build expandable detail panel with service cards
- [ ] Task: Build service card component: icon, name, status badge, metric, last updated
- [ ] Task: Build alerts panel for degraded state messages
- [ ] Task: Add refresh button with loading state
- [ ] Task: Add tooltip explanations for each service
- [ ] Task: Mobile-responsive compact mode

### 4.4 Recruiter Console Integration

- [ ] Task: Add health widget to `RecruiterConsole.html` header area
- [ ] Task: Add postMessage handler for health status fetching
- [ ] Task: Auto-refresh health status every 5 minutes
- [ ] Task: Add visual pulse animation when status is degraded
- [ ] Task: Add click-to-expand for full health details

### 4.5 Alert Integration

- [ ] Task: Add browser notification for status change (healthy -> degraded)
- [ ] Task: Add localStorage persistence for "dismissed" alerts
- [ ] Task: Add "Don't show again for 1 hour" option for non-critical alerts

### 4.6 Verification

- [ ] Task: Manual test - All services healthy shows green indicator
- [ ] Task: Manual test - Degraded enrichment shows yellow indicator with alert
- [ ] Task: Manual test - Service cards show correct metrics
- [ ] Task: Manual test - Refresh button updates data
- [ ] Task: Manual test - Auto-refresh works after 5 minutes
- [ ] Task: Manual test - Browser notification fires on status change
- [ ] Task: Verify observability logs capture health status queries
- [ ] Task: Conductor - Phase 4 Complete

---

## Post-Implementation Tasks

### Documentation

- [ ] Task: Update CLAUDE.md with new service descriptions
- [ ] Task: Document API contracts for new services
- [ ] Task: Add inline JSDoc comments to all new functions
- [ ] Task: Update platform architecture diagram with cross-role flows

### Analytics Integration

- [ ] Task: Add analytics events for mutual interest badge clicks
- [ ] Task: Add analytics events for match explanation expansions
- [ ] Task: Add analytics events for carrier retention dashboard views
- [ ] Task: Add analytics events for system health widget interactions

### Monitoring

- [ ] Task: Add alerts for mutual interest query latency > 2s
- [ ] Task: Add alerts for match explanation errors > 1%
- [ ] Task: Add alerts for health widget errors

---

## Dependencies Summary

```
Phase 1 (Mutual Interest)
    |
    | Uses: DriverCarrierInterests, CarrierDriverViews, CarrierDriverOutreach
    |
Phase 2 (Retention for Carriers)
    |
    | Uses: retentionService.jsw (existing), subscriptionService.jsw
    |
Phase 3 (Match Explanation)
    |
    | Uses: carrierPreferences.jsw, driverScoring.js
    |
Phase 4 (System Health)
    |
    | Uses: observabilityService.jsw, CarrierEnrichments, CarrierSafetyData
    |
    v
[All Phases Complete]
    |
    v
Documentation & Monitoring
```

---

## Quality Gates (Per Phase)

Before marking any phase complete:

- [ ] All new functions have unit tests
- [ ] All tests pass
- [ ] Code coverage > 80% for new services
- [ ] No linting errors
- [ ] JSDoc documentation complete
- [ ] Manual verification passed
- [ ] Observability logging implemented
- [ ] Error handling comprehensive

---

## Rollback Plan

Each feature is independently deployable. If issues arise:

1. **Mutual Interest**: Disable by returning empty array from `getMutualInterestForDriver()`
2. **Retention for Carriers**: Disable by returning subscription upgrade prompt for all tiers
3. **Match Explanation**: Disable by returning generic "High match based on your profile" text
4. **System Health**: Disable by returning `{ overall_status: 'healthy', services: {} }`

---

## Success Criteria

| Phase | Feature | Success Metric |
|-------|---------|----------------|
| 1 | Mutual Interest | >50 drivers see mutual badge in first week |
| 2 | Carrier Retention | >5 carriers access dashboard in first week |
| 3 | Match Explanation | >100 explanation expansions in first week |
| 4 | System Health | 0 "system slow" support tickets during degraded state |
