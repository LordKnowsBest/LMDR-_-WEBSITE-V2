# Track Plan: LMDR Admin Portal

## Phase 1: Foundation & Authentication

### 1.1 Portal Structure
- [x] Task: Create Admin Portal page in Wix Editor (`Admin-Portal`)
- [x] Task: Build collapsible sidebar navigation component (`ADMIN_SIDEBAR.html`)
- [x] Task: Build header bar with search, notifications, and profile menu
- [x] Task: Implement dark theme CSS following admin design tokens
- [x] Task: Create responsive layout breakpoints (desktop-first, tablet support)

### 1.2 Authentication & Authorization
- [x] Task: Create `AdminUsers` collection with roles schema
- [x] Task: Create `adminAuth.jsw` with role verification functions (Implemented in `admin_service.jsw`)
- [x] Task: Implement `isAdmin()` check on page load
- [x] Task: Create permission matrix for RBAC (roles → permissions mapping)
- [x] Task: Build permission-based UI rendering (hide/show based on role)
- [ ] Task: Conductor - User Manual Verification 'Phase 1'

---

## Phase 2: Dashboard Home

### 2.1 KPI Cards
- [x] Task: Create `getDashboardMetrics()` in `adminService.jsw` (Implemented as `getDashboardOverview` in `admin_dashboard_service.jsw`)
- [x] Task: Build KPI card component with real-time refresh
- [x] Task: Implement metrics: Active Drivers (7d), Matches Today, Pending Reviews, AI Queue
- [x] Task: Add trend indicators (up/down arrows with percentage)

### 2.2 Activity Feed
- [x] Task: Create `getRecentActivity(limit)` backend function (Implemented in `admin_dashboard_service.jsw`)
- [x] Task: Build activity feed component with infinite scroll
- [x] Task: Implement activity types: registrations, matches, flags, system events
- [x] Task: Add real-time updates via polling (30-second interval)

### 2.3 Alerts Panel
- [x] Task: Create `SystemAlerts` collection
- [x] Task: Create `getActiveAlerts()` and `resolveAlert(alertId)` functions (Implemented in `admin_dashboard_service.jsw`)
- [x] Task: Build alert cards with severity indicators
- [x] Task: Implement alert auto-generation from system events
- [ ] Task: Conductor - User Manual Verification 'Phase 2'

---

## Phase 3: User Management - Drivers

### 3.1 Driver List View
- [x] Task: Create `getDriversList(filters, pagination)` backend function (Implemented in `admin_service.jsw`)
- [x] Task: Build data table component with sortable columns
- [x] Task: Implement search (name, email, phone)
- [x] Task: Add filters: Status, Verification, Tier, Location
- [x] Task: Build pagination controls (page size: 25/50/100)
- [x] Task: Add bulk selection and bulk actions menu

### 3.2 Driver Detail View
- [x] Task: Create `getDriverDetail(driverId)` backend function (Implemented in `admin_service.jsw`)
- [x] Task: Build driver header card (photo, name, status, quick stats)
- [x] Task: Create tabbed interface: Profile, Applications, Documents, Activity, Notes
- [x] Task: Build Profile tab with editable fields
- [x] Task: Build Applications tab showing `DriverCarrierInterests` history
- [x] Task: Build Documents tab with CDL, Medical Card preview and status
- [x] Task: Build Activity tab showing login history, actions taken
- [x] Task: Build Notes tab for admin-only annotations

### 3.3 Driver Actions
- [x] Task: Create `updateDriverStatus(driverId, status, reason)` function (Implemented in `admin_service.jsw`)
- [x] Task: Implement Verify action (mark documents as verified)
- [x] Task: Implement Suspend action with reason modal
- [x] Task: Implement Send Message action (email template)
- [x] Task: Implement Delete action with confirmation and data handling
- [ ] Task: Conductor - User Manual Verification 'Phase 3'

---

## Phase 4: User Management - Carriers

### 4.1 Carrier List View
- [x] Task: Create `getCarriersList(filters, pagination)` backend function
- [x] Task: Build carrier table with FMCSA rating badges
- [x] Task: Add filters: Rating, Fleet Size, Status, Enrichment Date
- [x] Task: Show safety score with color coding (green/yellow/red)

### 4.2 Carrier Detail View
- [x] Task: Create `getCarrierDetail(carrierId)` backend function
- [x] Task: Build carrier header with company info, DOT/MC numbers
- [x] Task: Create FMCSA Data panel (from `CarrierSafetyData`)
- [x] Task: Create Enrichment panel (from `CarrierEnrichments`)
- [x] Task: Create Job Postings tab (active listings)
- [x] Task: Create Reviews tab (driver reviews for this carrier)
- [x] Task: Create Recruiters tab (associated recruiter accounts)

### 4.3 Carrier Actions
- [x] Task: Implement Force Re-enrichment action
- [x] Task: Implement Refresh FMCSA Data action
- [x] Task: Implement Flag for Review action
- [x] Task: Implement Suspend/Activate toggle
- [ ] Task: Conductor - User Manual Verification 'Phase 4'

---

## Phase 5: Content Moderation

### 5.1 Moderation Queue
### 5.1 Moderation Queue
- [x] Task: Create `getModerationQueue(type)` backend function
- [x] Task: Build queue list with priority sorting
- [x] Task: Create content preview panel (right side)
- [x] Task: Implement filter by type: Reviews, Job Postings, Documents

### 5.2 Review Moderation
- [x] Task: Build review card with full context (carrier, reviewer, rating)
- [x] Task: Add AI sentiment analysis display
- [x] Task: Show auto-flag reasons (profanity, PII, suspicious patterns)
- [x] Task: Implement Approve action
- [x] Task: Implement Edit & Approve action (inline editing)
- [x] Task: Implement Reject action with reason selection
- [x] Task: Implement Flag User action for repeat offenders

### 5.3 Document Moderation
- [x] Task: Build document preview with image viewer
- [x] Task: Show AI extraction data (if available)
- [x] Task: Implement Verify/Reject document actions
- [ ] Task: Conductor - User Manual Verification 'Phase 5'

---

## Phase 6: AI & Enrichment Monitoring

### 6.1 Queue Monitor
- [x] Task: Create `getEnrichmentStats()` backend function (Implemented in `admin_dashboard_service.jsw`)
- [x] Task: Build queue status display (pending, processing, failed)
- [x] Task: Add progress bar visualization
- [x] Task: Show average processing time and cache hit rate
- [x] Task: Display recent errors with details

### 6.2 API Usage Dashboard
- [x] Task: Create `getApiUsageStats()` backend function (Implemented in `admin_dashboard_service.jsw`)
- [x] Task: Build usage table (Claude, Perplexity, FMCSA)
- [x] Task: Add usage charts (daily/weekly trends)
- [x] Task: Implement cost calculations and projections
- [x] Task: Add rate limit warnings

### 6.3 Configuration Panel
- [ ] Task: Create `getMatchingWeights()` and `updateMatchingWeights()` functions
- [ ] Task: Build weight sliders with live preview
- [ ] Task: Create cache TTL configuration inputs
- [ ] Task: Add batch size and rate limit controls
- [ ] Task: Implement save/reset configuration actions
- [ ] Task: Conductor - User Manual Verification 'Phase 6'

---

## Phase 7: Compliance Center

### 7.1 FMCSA Alerts
- [ ] Task: Create `getFMCSAAlerts()` backend function
- [ ] Task: Build alerts table with carrier links
- [ ] Task: Implement rating change detection
- [ ] Task: Add out-of-service rate anomaly detection
- [ ] Task: Create alert email notifications

### 7.2 DQF Status Dashboard
- [ ] Task: Create `getDQFStatusSummary()` backend function
- [ ] Task: Build status overview cards (Complete, Missing, Expired, Pending)
- [ ] Task: Create drill-down lists for each status
- [ ] Task: Implement bulk notification action for missing docs

### 7.3 Audit Trail
- [x] Task: Create `AdminAuditLog` collection
- [x] Task: Implement audit logging middleware for all admin actions
- [x] Task: Create `getAuditLog(filters, pagination)` function (Implemented in `admin_audit_service.jsw`)
- [x] Task: Build audit log viewer with filters
- [x] Task: Add export to CSV functionality (Implemented in `admin_audit_service.jsw`)
- [ ] Task: Conductor - User Manual Verification 'Phase 7'

---

## Phase 8: Analytics & Reporting

### 8.1 Match Analytics
- [x] Task: Create `getMatchAnalytics(dateRange)` backend function (Implemented as `getMatchStats` in `admin_match_service.jsw`)
- [x] Task: Build match volume chart (line chart, daily/weekly)
- [x] Task: Create conversion funnel visualization
- [x] Task: Build geographic heat map (matches by state)
- [x] Task: Add top carriers leaderboard

### 8.2 User Analytics
- [x] Task: Create registration trend charts (Implemented in `admin_service.jsw`)
- [x] Task: Build profile completion rate visualization
- [x] Task: Create cohort analysis tables
- [x] Task: Add retention metrics

### 8.3 Export & Reports
- [x] Task: Implement CSV export for all major tables (Implemented in all services)
- [ ] Task: Create scheduled report generation
- [ ] Task: Build custom report builder (date range, metrics selection)
- [ ] Task: Conductor - User Manual Verification 'Phase 8'

---

## Phase 9: System Configuration

### 9.1 Platform Settings
- [ ] Task: Create settings storage mechanism
- [ ] Task: Build tier limits configuration (Free/Premium match counts)
- [ ] Task: Implement feature flags interface
- [ ] Task: Add maintenance mode toggle
- [ ] Task: Create announcement banner configuration

### 9.2 Scheduled Jobs
- [ ] Task: Create job monitoring interface
- [ ] Task: Show job run history and status
- [ ] Task: Implement manual job trigger buttons
- [ ] Task: Add job error notifications

### 9.3 Integrations
- [ ] Task: Build API keys management interface
- [ ] Task: Create secrets rotation workflow
- [ ] Task: Add integration status monitoring
- [ ] Task: Conductor - User Manual Verification 'Phase 9'

---

## Phase 10: Polish & Launch

### 10.1 Performance
- [ ] Task: Optimize backend queries with pagination
- [ ] Task: Implement caching for dashboard metrics
- [ ] Task: Add loading states and skeletons
- [ ] Task: Test with large data volumes

### 10.2 Security Review
- [ ] Task: Audit all permission checks
- [ ] Task: Verify audit logging coverage
- [ ] Task: Test role-based access restrictions
- [ ] Task: Conduct security penetration testing

### 10.3 Documentation
- [ ] Task: Create admin user guide
- [ ] Task: Document all backend functions
- [ ] Task: Create troubleshooting guide
- [ ] Task: Conductor - Final Verification & Launch