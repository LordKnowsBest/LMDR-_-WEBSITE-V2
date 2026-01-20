# Track Plan: Carrier Fleet Dashboard - Operations Visibility

## Phase 1: Driver Roster (Foundation)

### 1.1 Data Layer Setup
- [ ] Task: Create `FleetDrivers` collection in Wix with all fields from spec
- [ ] Task: Create indexes on `carrier_dot`, `status`, `employee_id` for query performance
- [ ] Task: Write seed data migration script for test carriers
- [ ] Task: Verify collection permissions (carrier-scoped access only)

### 1.2 Backend Service Implementation
- [ ] Task: Create `fleetService.jsw` with module structure and imports
- [ ] Task: Implement `getFleetDrivers()` with filtering, sorting, and pagination
- [ ] Task: Implement `getDriverDetails()` for single driver fetch with equipment data
- [ ] Task: Implement `updateDriverStatus()` with status history logging
- [ ] Task: Implement `addFleetDriver()` with validation and duplicate checking
- [ ] Task: Implement `exportDriverRoster()` CSV generation
- [ ] Task: Implement `getExpiringCredentials()` for CDL/medical card alerts
- [ ] Task: Add `verifyCarrierAccess()` helper for security checks

### 1.3 Frontend UI Implementation
- [ ] Task: Create `src/public/carrier/DRIVER_ROSTER.html` component
- [ ] Task: Build driver list table with sortable columns
- [ ] Task: Implement status badges with color coding (active, resting, leave, etc.)
- [ ] Task: Add search bar with debounced filtering
- [ ] Task: Implement status filter dropdown
- [ ] Task: Implement terminal filter dropdown
- [ ] Task: Build pagination controls
- [ ] Task: Add "Add Driver" button and modal form
- [ ] Task: Implement driver detail slide-out panel
- [ ] Task: Build bulk status update functionality (checkbox selection)
- [ ] Task: Add CSV export button with download handler
- [ ] Task: Create expiring credentials alert banner

### 1.4 Page Integration
- [ ] Task: Create Wix page for Carrier Fleet Dashboard
- [ ] Task: Add HTML component and configure postMessage bridge
- [ ] Task: Wire up page code to fetch carrier DOT from session
- [ ] Task: Implement error handling and loading states
- [ ] Task: Add mobile responsive styles

### 1.5 Phase 1 Testing
- [ ] Test: Verify driver list loads with correct carrier isolation
- [ ] Test: Verify filtering by status works correctly
- [ ] Test: Verify search finds drivers by name and employee ID
- [ ] Test: Verify pagination with 50+ drivers
- [ ] Test: Verify status update persists and shows in list
- [ ] Test: Verify CSV export contains all columns
- [ ] Test: Verify expiring credentials alert shows correct drivers
- [ ] Test: Conductor - User Manual Verification 'Phase 1: Driver Roster'

---

## Phase 2: Equipment Assignment

### 2.1 Data Layer Setup
- [ ] Task: Create `EquipmentAssets` collection with all fields from spec
- [ ] Task: Create `EquipmentAssignments` collection for assignment history
- [ ] Task: Create indexes on `carrier_dot`, `status`, `unit_number`, `current_driver_id`
- [ ] Task: Write seed data migration for test equipment (trucks + trailers)

### 2.2 Backend Service Implementation
- [ ] Task: Create `equipmentService.jsw` with module structure
- [ ] Task: Implement `getEquipmentList()` with type and status filtering
- [ ] Task: Implement `getEquipmentDetails()` with current assignment info
- [ ] Task: Implement `addEquipment()` with VIN validation
- [ ] Task: Implement `updateEquipment()` for edits and status changes
- [ ] Task: Implement `assignEquipment()` with assignment type support
- [ ] Task: Implement `unassignEquipment()` with reason logging
- [ ] Task: Implement `getAssignmentHistory()` for single equipment
- [ ] Task: Implement `getDriverAssignmentHistory()` for driver equipment history
- [ ] Task: Implement `getMaintenanceDue()` for service alerts

### 2.3 Frontend UI Implementation
- [ ] Task: Create `src/public/carrier/EQUIPMENT_MANAGER.html` component
- [ ] Task: Build split-panel layout (list left, details right)
- [ ] Task: Implement equipment list with type grouping (Trucks / Trailers)
- [ ] Task: Add status badges (Active, Maintenance, Out of Service)
- [ ] Task: Build equipment detail panel with all fields
- [ ] Task: Implement assignment section showing current driver
- [ ] Task: Build "Assign Equipment" modal with driver dropdown
- [ ] Task: Implement "Reassign" flow with unassign + assign
- [ ] Task: Create assignment history timeline view
- [ ] Task: Add "Add Equipment" button and modal form
- [ ] Task: Build maintenance due alert banner
- [ ] Task: Add filter for showing unassigned equipment only

### 2.4 Driver Roster Integration
- [ ] Task: Add equipment column to Driver Roster table
- [ ] Task: Link from driver row to equipment detail
- [ ] Task: Add equipment assignment quick-view in driver detail panel

### 2.5 Phase 2 Testing
- [ ] Test: Verify equipment list loads with correct carrier isolation
- [ ] Test: Verify filtering by type (truck/trailer) works
- [ ] Test: Verify filtering by status works
- [ ] Test: Verify assignment creates EquipmentAssignments record
- [ ] Test: Verify reassignment closes previous assignment
- [ ] Test: Verify assignment history shows all past assignments
- [ ] Test: Verify driver roster shows correct equipment
- [ ] Test: Verify maintenance due alert calculation
- [ ] Test: Conductor - User Manual Verification 'Phase 2: Equipment Assignment'

---

## Phase 3: Driver Scorecard

### 3.1 Data Layer Setup
- [ ] Task: Create `DriverScores` collection with all fields from spec
- [ ] Task: Create indexes on `carrier_dot`, `driver_id`, `period_start`, `period_type`
- [ ] Task: Design scoring formula weights (Safety 40%, Efficiency 25%, Service 20%, Compliance 15%)
- [ ] Task: Write sample score data for test drivers

### 3.2 Backend Service Implementation
- [ ] Task: Create `driverScorecardService.jsw` with module structure
- [ ] Task: Implement `getDriverScorecard()` with period selection
- [ ] Task: Implement `getFleetScoreboardSummary()` for overview metrics
- [ ] Task: Implement `getPerformanceRankings()` for top/bottom lists
- [ ] Task: Implement `getDriverTrend()` for multi-period comparison
- [ ] Task: Implement `calculateScorecards()` scheduled job function
- [ ] Task: Implement `getCoachingCandidates()` for below-threshold drivers
- [ ] Task: Create helper functions for each score category calculation
- [ ] Task: Add score normalization logic (0-100 scale)

### 3.3 Frontend UI Implementation
- [ ] Task: Create `src/public/carrier/DRIVER_SCORECARD.html` component
- [ ] Task: Build fleet overview header with summary cards
- [ ] Task: Implement period selector (weekly/monthly/quarterly)
- [ ] Task: Create driver selector with search
- [ ] Task: Build overall score gauge/dial visualization
- [ ] Task: Create category breakdown bar charts
- [ ] Task: Build detailed metrics panels for each category
- [ ] Task: Implement 6-month trend line chart
- [ ] Task: Add rank badge showing position in fleet
- [ ] Task: Create "Needs Coaching" alert section
- [ ] Task: Build performance comparison view (driver vs fleet average)
- [ ] Task: Add export scorecard to PDF functionality

### 3.4 Driver Roster Integration
- [ ] Task: Add score column to Driver Roster (overall score badge)
- [ ] Task: Add "View Scorecard" link from driver row
- [ ] Task: Color-code drivers by performance tier

### 3.5 Scheduled Job Setup
- [ ] Task: Add scorecard calculation to jobs.config (weekly on Monday)
- [ ] Task: Implement score calculation from ELD/TMS data sources
- [ ] Task: Add error handling for missing data sources
- [ ] Task: Send notifications for significant score changes

### 3.6 Phase 3 Testing
- [ ] Test: Verify scorecard loads for selected driver and period
- [ ] Test: Verify score calculation produces expected results
- [ ] Test: Verify trend chart shows correct historical data
- [ ] Test: Verify fleet rankings are accurate
- [ ] Test: Verify coaching candidates threshold works
- [ ] Test: Verify scheduled job calculates all driver scores
- [ ] Test: Verify driver roster shows score badges
- [ ] Test: Conductor - User Manual Verification 'Phase 3: Driver Scorecard'

---

## Phase 4: Capacity Planning

### 4.1 Data Layer Setup
- [ ] Task: Create `CapacityPlans` collection with all fields from spec
- [ ] Task: Create indexes on `carrier_dot`, `plan_date`
- [ ] Task: Design utilization calculation formula
- [ ] Task: Write sample capacity data for test dates

### 4.2 Backend Service Implementation
- [ ] Task: Create `capacityPlanningService.jsw` with module structure
- [ ] Task: Implement `calculateDailyCapacity()` core calculation
- [ ] Task: Implement `getCapacityOverview()` for week/month summary
- [ ] Task: Implement `getDailyBreakdown()` for day-by-day view
- [ ] Task: Implement `getDriverAvailabilityForecast()` for planning
- [ ] Task: Implement `generateCapacityRecommendations()` AI suggestions
- [ ] Task: Implement `calculateRevenueAtRisk()` for gap analysis
- [ ] Task: Add integration hooks for load data (placeholder for TMS)

### 4.3 Frontend UI Implementation
- [ ] Task: Create `src/public/carrier/CAPACITY_PLANNER.html` component
- [ ] Task: Build capacity overview header with key metrics
- [ ] Task: Create period selector (This Week / This Month / Custom)
- [ ] Task: Implement daily breakdown bar chart
- [ ] Task: Build driver availability detail table
- [ ] Task: Create utilization percentage gauges
- [ ] Task: Add capacity gap warnings with color coding
- [ ] Task: Build recommendations panel with actionable suggestions
- [ ] Task: Implement drill-down to specific day details
- [ ] Task: Add export capacity report functionality

### 4.4 Dashboard Integration
- [ ] Task: Add capacity summary card to main Fleet Dashboard
- [ ] Task: Show "X drivers available today" quick stat
- [ ] Task: Add utilization trend sparkline

### 4.5 Phase 4 Testing
- [ ] Test: Verify capacity calculation with mixed driver statuses
- [ ] Test: Verify utilization percentage is accurate
- [ ] Test: Verify daily breakdown shows correct data
- [ ] Test: Verify recommendations generate for capacity gaps
- [ ] Test: Verify revenue at risk calculation
- [ ] Test: Verify date range filtering works
- [ ] Test: Verify dashboard summary matches detailed view
- [ ] Test: Conductor - User Manual Verification 'Phase 4: Capacity Planning'

---

## Phase 5: Real-Time Location (ELD Integration)

### 5.1 Data Layer Setup
- [ ] Task: Create `ELDConnections` collection for provider credentials
- [ ] Task: Create `DriverLocations` collection for position data
- [ ] Task: Create indexes on `carrier_dot`, `driver_id`, `timestamp`
- [ ] Task: Implement credential encryption for API keys
- [ ] Task: Design location data retention policy (30 days)

### 5.2 ELD Provider Integrations
- [ ] Task: Research Motive (Keep Truckin) API documentation
- [ ] Task: Research Samsara API documentation
- [ ] Task: Create provider-agnostic interface for location data
- [ ] Task: Implement Motive API adapter with OAuth flow
- [ ] Task: Implement Samsara API adapter with API key auth
- [ ] Task: Add provider selection dropdown in settings
- [ ] Task: Build connection test functionality

### 5.3 Backend Service Implementation
- [ ] Task: Create `eldIntegrationService.jsw` with module structure
- [ ] Task: Implement `connectELDProvider()` with credential storage
- [ ] Task: Implement `disconnectELDProvider()` cleanup
- [ ] Task: Implement `syncDriverLocations()` for polling
- [ ] Task: Implement `getFleetLocations()` for map display
- [ ] Task: Implement `getDriverLocation()` with route info
- [ ] Task: Implement `getFleetHOSStatus()` for compliance view
- [ ] Task: Add error handling for API failures

### 5.4 Scheduled Job Setup
- [ ] Task: Add location sync to jobs.config (every 5 minutes)
- [ ] Task: Implement incremental sync to avoid rate limits
- [ ] Task: Add sync failure alerting
- [ ] Task: Implement stale data cleanup job

### 5.5 Frontend UI Implementation
- [ ] Task: Create `src/public/carrier/FLEET_MAP.html` component
- [ ] Task: Integrate mapping library (Mapbox or Google Maps)
- [ ] Task: Build driver marker component with status icons
- [ ] Task: Implement driver list sidebar with live updates
- [ ] Task: Create route visualization with polylines
- [ ] Task: Build driver detail popup on marker click
- [ ] Task: Add HOS status indicator on map markers
- [ ] Task: Implement auto-refresh (30 second polling)
- [ ] Task: Build geofence visualization (if supported)
- [ ] Task: Add "Follow Driver" mode for tracking single driver
- [ ] Task: Create ELD settings page for provider connection

### 5.6 Dashboard Integration
- [ ] Task: Add mini-map widget to main Fleet Dashboard
- [ ] Task: Show driver location in Driver Roster detail panel
- [ ] Task: Add "View on Map" link from driver rows

### 5.7 Phase 5 Testing
- [ ] Test: Verify ELD connection flow (Motive)
- [ ] Test: Verify ELD connection flow (Samsara)
- [ ] Test: Verify location sync updates DriverLocations
- [ ] Test: Verify map displays all drivers correctly
- [ ] Test: Verify HOS status shows accurate data
- [ ] Test: Verify route polylines render correctly
- [ ] Test: Verify auto-refresh updates positions
- [ ] Test: Verify connection error handling
- [ ] Test: Verify data isolation (carrier only sees own drivers)
- [ ] Test: Conductor - User Manual Verification 'Phase 5: Real-Time Location'

---

## Final Integration & Polish

### Dashboard Hub
- [ ] Task: Create main `CARRIER_FLEET_DASHBOARD.html` component
- [ ] Task: Build dashboard grid layout with widget cards
- [ ] Task: Add Driver Roster summary widget
- [ ] Task: Add Equipment summary widget
- [ ] Task: Add Scorecard highlights widget
- [ ] Task: Add Capacity summary widget
- [ ] Task: Add Fleet Map mini-view widget
- [ ] Task: Implement navigation to detailed views
- [ ] Task: Add notification center for alerts

### Cross-Feature Integration
- [ ] Task: Ensure consistent styling across all components
- [ ] Task: Verify navigation flow between all views
- [ ] Task: Add breadcrumb navigation
- [ ] Task: Implement unified error handling
- [ ] Task: Add loading skeletons for all data fetches

### Performance Optimization
- [ ] Task: Implement data caching for repeated queries
- [ ] Task: Add query result pagination everywhere
- [ ] Task: Optimize map marker rendering for large fleets
- [ ] Task: Profile and optimize slow queries

### Documentation
- [ ] Task: Write carrier onboarding guide for Fleet Dashboard
- [ ] Task: Create video walkthrough for each feature
- [ ] Task: Document API endpoints for potential TMS integration
- [ ] Task: Add inline help tooltips throughout UI

### Final Testing
- [ ] Test: End-to-end test with realistic carrier data (50+ drivers, 40+ trucks)
- [ ] Test: Performance test with large fleet
- [ ] Test: Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Test: Mobile responsive testing
- [ ] Test: Security audit for data isolation
- [ ] Test: Accessibility audit (WCAG 2.1 AA)
- [ ] Test: Conductor - User Manual Verification 'Final Integration'
