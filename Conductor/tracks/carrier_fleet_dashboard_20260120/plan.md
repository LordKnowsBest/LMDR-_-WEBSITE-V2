# Track Plan: Carrier Fleet Dashboard - Operations Visibility

## Phase 1: Driver Roster (Foundation)

### 1.1 Data Layer Setup
- [x] Task: Create `FleetDrivers` collection in Wix with all fields from spec
- [x] Task: Create indexes on `carrier_dot`, `status`, `employee_id` for query performance
- [x] Task: Write seed data migration script for test carriers
- [x] Task: Verify collection permissions (carrier-scoped access only)

### 1.2 Backend Service Implementation
- [x] Task: Create `fleetService.jsw` with module structure and imports
- [x] Task: Implement `getFleetDrivers()` with filtering, sorting, and pagination
- [x] Task: Implement `getDriverDetails()` for single driver fetch with equipment data
- [x] Task: Implement `updateDriverStatus()` with status history logging
- [x] Task: Implement `addFleetDriver()` with validation and duplicate checking
- [x] Task: Implement `exportDriverRoster()` CSV generation
- [x] Task: Implement `getExpiringCredentials()` for CDL/medical card alerts
- [x] Task: Add `verifyCarrierAccess()` helper for security checks

### 1.3 Frontend UI Implementation
- [x] Task: Create `src/public/carrier/DRIVER_ROSTER.html` component
- [x] Task: Build driver list table with sortable columns
- [x] Task: Implement status badges with color coding (active, resting, leave, etc.)
- [x] Task: Add search bar with debounced filtering
- [x] Task: Implement status filter dropdown
- [x] Task: Implement terminal filter dropdown
- [x] Task: Build pagination controls
- [x] Task: Add "Add Driver" button and modal form
- [x] Task: Implement driver detail slide-out panel
- [x] Task: Build bulk status update functionality (checkbox selection)
- [x] Task: Add CSV export button with download handler
- [x] Task: Create expiring credentials alert banner

### 1.4 Page Integration
- [x] Task: Create Wix page for Carrier Fleet Dashboard
- [x] Task: Add HTML component and configure postMessage bridge
- [x] Task: Wire up page code to fetch carrier DOT from session
- [x] Task: Implement error handling and loading states
- [x] Task: Add mobile responsive styles

### 1.5 Phase 1 Testing
- [x] Test: Verify driver list loads with correct carrier isolation
- [x] Test: Verify filtering by status works correctly
- [x] Test: Verify search finds drivers by name and employee ID
- [x] Test: Verify pagination with 50+ drivers
- [x] Test: Verify status update persists and shows in list
- [x] Test: Verify CSV export contains all columns
- [x] Test: Verify expiring credentials alert shows correct drivers
- [x] Test: Conductor - User Manual Verification 'Phase 1: Driver Roster'

---

## Phase 2: Equipment Assignment

### 2.1 Data Layer Setup
- [x] Task: Create `EquipmentAssets` collection with all fields from spec
- [x] Task: Create `EquipmentAssignments` collection for assignment history
- [x] Task: Create indexes on `carrier_dot`, `status`, `unit_number`, `current_driver_id`
- [x] Task: Write seed data migration for test equipment (trucks + trailers)

### 2.2 Backend Service Implementation
- [x] Task: Create `equipmentService.jsw` with module structure
- [x] Task: Implement `getEquipmentList()` with type and status filtering
- [x] Task: Implement `getEquipmentDetails()` with current assignment info
- [x] Task: Implement `addEquipment()` with VIN validation
- [x] Task: Implement `updateEquipment()` for edits and status changes
- [x] Task: Implement `assignEquipment()` with assignment type support
- [x] Task: Implement `unassignEquipment()` with reason logging
- [x] Task: Implement `getAssignmentHistory()` for single equipment
- [x] Task: Implement `getDriverAssignmentHistory()` for driver equipment history
- [x] Task: Implement `getMaintenanceDue()` for service alerts

### 2.3 Frontend UI Implementation
- [x] Task: Create `src/public/carrier/EQUIPMENT_MANAGER.html` component
- [x] Task: Build split-panel layout (list left, details right)
- [x] Task: Implement equipment list with type grouping (Trucks / Trailers)
- [x] Task: Add status badges (Active, Maintenance, Out of Service)
- [x] Task: Build equipment detail panel with all fields
- [x] Task: Implement assignment section showing current driver
- [x] Task: Build "Assign Equipment" modal with driver dropdown
- [x] Task: Implement "Reassign" flow with unassign + assign
- [x] Task: Create assignment history timeline view
- [x] Task: Add "Add Equipment" button and modal form
- [x] Task: Build maintenance due alert banner
- [x] Task: Add filter for showing unassigned equipment only

### 2.4 Driver Roster Integration
- [x] Task: Add equipment column to Driver Roster table
- [x] Task: Link from driver row to equipment detail
- [x] Task: Add equipment assignment quick-view in driver detail panel

### 2.5 Phase 2 Testing
- [x] Test: Verify equipment list loads with correct carrier isolation
- [x] Test: Verify filtering by type (truck/trailer) works
- [x] Test: Verify filtering by status works
- [x] Test: Verify assignment creates EquipmentAssignments record
- [x] Test: Verify reassignment closes previous assignment
- [x] Test: Verify assignment history shows all past assignments
- [x] Test: Verify driver roster shows correct equipment
- [x] Test: Verify maintenance due alert calculation
- [x] Test: Conductor - User Manual Verification 'Phase 2: Equipment Assignment'

---

## Phase 3: Driver Scorecard

### 3.1 Data Layer Setup
- [x] Task: Create `DriverScores` collection with all fields from spec
- [x] Task: Create indexes on `carrier_dot`, `driver_id`, `period_start`, `period_type`
- [x] Task: Design scoring formula weights (Safety 40%, Efficiency 25%, Service 20%, Compliance 15%)
- [x] Task: Write sample score data for test drivers

### 3.2 Backend Service Implementation
- [x] Task: Create `driverScorecardService.jsw` with module structure
- [x] Task: Implement `getDriverScorecard()` with period selection
- [x] Task: Implement `getFleetScoreboardSummary()` for overview metrics
- [x] Task: Implement `getPerformanceRankings()` for top/bottom lists
- [x] Task: Implement `getDriverTrend()` for multi-period comparison
- [x] Task: Implement `calculateScorecards()` scheduled job function
- [x] Task: Implement `getCoachingCandidates()` for below-threshold drivers
- [x] Task: Create helper functions for each score category calculation
- [x] Task: Add score normalization logic (0-100 scale)

### 3.3 Frontend UI Implementation
- [x] Task: Create `src/public/carrier/DRIVER_SCORECARD.html` component
- [x] Task: Build fleet overview header with summary cards
- [x] Task: Implement period selector (weekly/monthly/quarterly)
- [x] Task: Create driver selector with search
- [x] Task: Build overall score gauge/dial visualization
- [x] Task: Create category breakdown bar charts
- [x] Task: Build detailed metrics panels for each category
- [x] Task: Implement 6-month trend line chart
- [x] Task: Add rank badge showing position in fleet
- [x] Task: Create "Needs Coaching" alert section
- [x] Task: Build performance comparison view (driver vs fleet average)
- [x] Task: Add export scorecard to PDF functionality

### 3.4 Driver Roster Integration
- [x] Task: Add score column to Driver Roster (overall score badge)
- [x] Task: Add "View Scorecard" link from driver row
- [x] Task: Color-code drivers by performance tier

### 3.5 Scheduled Job Setup
- [x] Task: Add scorecard calculation to jobs.config (weekly on Monday)
- [x] Task: Implement score calculation from ELD/TMS data sources
- [x] Task: Add error handling for missing data sources
- [x] Task: Send notifications for significant score changes

### 3.6 Phase 3 Testing
- [x] Test: Verify scorecard loads for selected driver and period
- [x] Test: Verify score calculation produces expected results
- [x] Test: Verify trend chart shows correct historical data
- [x] Test: Verify fleet rankings are accurate
- [x] Test: Verify coaching candidates threshold works
- [x] Test: Verify scheduled job calculates all driver scores
- [x] Test: Verify driver roster shows score badges
- [x] Test: Conductor - User Manual Verification 'Phase 3: Driver Scorecard'

---

## Phase 4: Capacity Planning

### 4.1 Data Layer Setup
- [x] Task: Create `CapacityPlans` collection with all fields from spec
- [x] Task: Create indexes on `carrier_dot`, `plan_date`
- [x] Task: Design utilization calculation formula
- [x] Task: Write sample capacity data for test dates

### 4.2 Backend Service Implementation
- [x] Task: Create `capacityPlanningService.jsw` with module structure
- [x] Task: Implement `calculateDailyCapacity()` core calculation
- [x] Task: Implement `getCapacityOverview()` for week/month summary
- [x] Task: Implement `getDailyBreakdown()` for day-by-day view
- [x] Task: Implement `getDriverAvailabilityForecast()` for planning
- [x] Task: Implement `generateCapacityRecommendations()` AI suggestions
- [x] Task: Implement `calculateRevenueAtRisk()` for gap analysis
- [x] Task: Add integration hooks for load data (placeholder for TMS)

### 4.3 Frontend UI Implementation
- [x] Task: Create `src/public/carrier/CAPACITY_PLANNER.html` component
- [x] Task: Build capacity overview header with key metrics
- [x] Task: Create period selector (This Week / This Month / Custom)
- [x] Task: Implement daily breakdown bar chart
- [x] Task: Build driver availability detail table
- [x] Task: Create utilization percentage gauges
- [x] Task: Add capacity gap warnings with color coding
- [x] Task: Build recommendations panel with actionable suggestions
- [x] Task: Implement drill-down to specific day details
- [x] Task: Add export capacity report functionality

### 4.4 Dashboard Integration
- [x] Task: Add capacity summary card to main Fleet Dashboard
- [x] Task: Show "X drivers available today" quick stat
- [x] Task: Add utilization trend sparkline

### 4.5 Phase 4 Testing
- [x] Test: Verify capacity calculation with mixed driver statuses
- [x] Test: Verify utilization percentage is accurate
- [x] Test: Verify daily breakdown shows correct data
- [x] Test: Verify recommendations generate for capacity gaps
- [x] Test: Verify revenue at risk calculation
- [x] Test: Verify date range filtering works
- [x] Test: Verify dashboard summary matches detailed view
- [x] Test: Conductor - User Manual Verification 'Phase 4: Capacity Planning'

---

## Phase 5: Real-Time Location (ELD Integration)

### 5.1 Data Layer Setup
- [x] Task: Create `ELDConnections` collection for provider credentials
- [x] Task: Create `DriverLocations` collection for position data
- [x] Task: Create indexes on `carrier_dot`, `driver_id`, `timestamp`
- [x] Task: Implement credential encryption for API keys
- [x] Task: Design location data retention policy (30 days)

### 5.2 ELD Provider Integrations
- [x] Task: Research Motive (Keep Truckin) API documentation
- [x] Task: Research Samsara API documentation
- [x] Task: Create provider-agnostic interface for location data
- [x] Task: Implement Motive API adapter with OAuth flow
- [x] Task: Implement Samsara API adapter with API key auth
- [x] Task: Add provider selection dropdown in settings
- [x] Task: Build connection test functionality

### 5.3 Backend Service Implementation
- [x] Task: Create `eldIntegrationService.jsw` with module structure
- [x] Task: Implement `connectELDProvider()` with credential storage
- [x] Task: Implement `disconnectELDProvider()` cleanup
- [x] Task: Implement `syncDriverLocations()` for polling
- [x] Task: Implement `getFleetLocations()` for map display
- [x] Task: Implement `getDriverLocation()` with route info
- [x] Task: Implement `getFleetHOSStatus()` for compliance view
- [x] Task: Add error handling for API failures

### 5.4 Scheduled Job Setup
- [x] Task: Add location sync to jobs.config (every 5 minutes)
- [x] Task: Implement incremental sync to avoid rate limits
- [x] Task: Add sync failure alerting
- [x] Task: Implement stale data cleanup job

### 5.5 Frontend UI Implementation
- [x] Task: Create `src/public/carrier/FLEET_MAP.html` component
- [x] Task: Integrate mapping library (Mapbox or Google Maps)
- [x] Task: Build driver marker component with status icons
- [x] Task: Implement driver list sidebar with live updates
- [x] Task: Create route visualization with polylines
- [x] Task: Build driver detail popup on marker click
- [x] Task: Add HOS status indicator on map markers
- [x] Task: Implement auto-refresh (30 second polling)
- [x] Task: Build geofence visualization (if supported)
- [x] Task: Add "Follow Driver" mode for tracking single driver
- [x] Task: Create ELD settings page for provider connection

### 5.6 Dashboard Integration
- [x] Task: Add mini-map widget to main Fleet Dashboard
- [x] Task: Show driver location in Driver Roster detail panel
- [x] Task: Add "View on Map" link from driver rows

### 5.7 Phase 5 Testing
- [x] Test: Verify ELD connection flow (Motive)
- [x] Test: Verify ELD connection flow (Samsara)
- [x] Test: Verify location sync updates DriverLocations
- [x] Test: Verify map displays all drivers correctly
- [x] Test: Verify HOS status shows accurate data
- [x] Test: Verify route polylines render correctly
- [x] Test: Verify auto-refresh updates positions
- [x] Test: Verify connection error handling
- [x] Test: Verify data isolation (carrier only sees own drivers)
- [x] Test: Conductor - User Manual Verification 'Phase 5: Real-Time Location'

---

## Final Integration & Polish

### Dashboard Hub
- [x] Task: Create main `CARRIER_FLEET_DASHBOARD.html` component
- [x] Task: Build dashboard grid layout with widget cards
- [x] Task: Add Driver Roster summary widget
- [x] Task: Add Equipment summary widget
- [x] Task: Add Scorecard highlights widget
- [x] Task: Add Capacity summary widget
- [x] Task: Add Fleet Map mini-view widget
- [x] Task: Implement navigation to detailed views
- [x] Task: Add notification center for alerts

### Cross-Feature Integration
- [x] Task: Ensure consistent styling across all components
- [x] Task: Verify navigation flow between all views
- [x] Task: Add breadcrumb navigation
- [x] Task: Implement unified error handling
- [x] Task: Add loading skeletons for all data fetches

### Performance Optimization
- [x] Task: Implement data caching for repeated queries
- [x] Task: Add query result pagination everywhere
- [x] Task: Optimize map marker rendering for large fleets
- [x] Task: Profile and optimize slow queries

### Documentation
- [x] Task: Write carrier onboarding guide for Fleet Dashboard
- [x] Task: Create video walkthrough for each feature
- [x] Task: Document API endpoints for potential TMS integration
- [x] Task: Add inline help tooltips throughout UI

### Final Testing
- [x] Test: End-to-end test with realistic carrier data (50+ drivers, 40+ trucks)
- [x] Test: Performance test with large fleet
- [x] Test: Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [x] Test: Mobile responsive testing
- [x] Test: Security audit for data isolation
- [x] Test: Accessibility audit (WCAG 2.1 AA)
- [x] Test: Conductor - User Manual Verification 'Final Integration'