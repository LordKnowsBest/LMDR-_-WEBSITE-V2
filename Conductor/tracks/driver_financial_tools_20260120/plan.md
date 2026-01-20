# Track Plan: Driver Financial Tools - Pay & Expense Management

## Phase 1: Expense Tracker (Standalone, Immediate Value)

### 1.1 Backend Foundation
- [ ] Task: Create `driverExpenseService.jsw` with base CRUD operations
- [ ] Task: Create `DriverExpenses` Wix collection with all fields from spec
- [ ] Task: Implement `createExpense()` function with validation
- [ ] Task: Implement `getExpenses()` with date range and category filters
- [ ] Task: Implement `updateExpense()` with ownership verification
- [ ] Task: Implement `deleteExpense()` with ownership verification
- [ ] Task: Add expense category constants with icons and deductible flags

### 1.2 Receipt OCR Integration
- [ ] Task: Extend `ocrService.jsw` with `RECEIPT` document type
- [ ] Task: Add receipt-specific prompt to `getPromptForDocType()`
- [ ] Task: Create `extractReceiptData()` wrapper function in expense service
- [ ] Task: Implement receipt field extraction (vendor, amount, date, category)
- [ ] Task: Add fuel-specific fields extraction (gallons, price/gallon)
- [ ] Task: Test OCR with sample receipts (Pilot, Loves, TA, misc)
- [ ] Task: Add OCR confidence scoring for receipt extraction

### 1.3 Expense Tracker UI
- [ ] Task: Create `DRIVER_EXPENSES.html` in `src/public/driver/`
- [ ] Task: Build expense list view with cards showing amount, category, date
- [ ] Task: Implement category filter dropdown
- [ ] Task: Implement date range filter (This Week, This Month, Custom)
- [ ] Task: Add category breakdown chart (pie or bar)
- [ ] Task: Build monthly totals summary header
- [ ] Task: Add expense card quick actions (Edit, Delete, View Receipt)

### 1.4 Add Expense Modal
- [ ] Task: Create add expense modal with camera/upload option
- [ ] Task: Implement receipt photo capture using device camera API
- [ ] Task: Connect receipt upload to OCR service
- [ ] Task: Build form with auto-fill from OCR results
- [ ] Task: Allow user to override OCR-extracted values
- [ ] Task: Add category selector with icons
- [ ] Task: Add payment method selector (Cash, Card, Fuel Card)
- [ ] Task: Add tax deductible toggle
- [ ] Task: Implement form validation and submission
- [ ] Task: Show success confirmation with expense summary

### 1.5 Export Functionality
- [ ] Task: Implement `exportExpensesForTaxes()` backend function
- [ ] Task: Generate CSV export with category grouping
- [ ] Task: Generate summary PDF with totals by category
- [ ] Task: Add export button to UI with format selector
- [ ] Task: Include date range in export filename

### 1.6 Page Integration
- [ ] Task: Create Wix page `Driver-Expenses` with HTML component
- [ ] Task: Wire up postMessage bridge for CRUD operations
- [ ] Task: Add navigation link from Driver Dashboard
- [ ] Task: Handle authentication check on page load
- [ ] Task: Add loading states and error handling

### 1.7 Phase 1 Testing
- [ ] Task: Write unit tests for `createExpense()` with validation cases
- [ ] Task: Write unit tests for `getExpenses()` with filter combinations
- [ ] Task: Write integration test for receipt OCR flow
- [ ] Task: Test camera capture on mobile devices (iOS, Android)
- [ ] Task: Test export CSV format in Excel/Google Sheets
- [ ] Task: Verify data isolation (driver can only see own expenses)
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Expense Tracker'

---

## Phase 2: Settlement Viewer (Carrier Integration Complexity)

### 2.1 Backend Foundation
- [ ] Task: Create `settlementService.jsw` with base functions
- [ ] Task: Create `DriverSettlements` Wix collection with all fields
- [ ] Task: Implement `createManualSettlement()` for manual entry
- [ ] Task: Implement `getSettlements()` with filters
- [ ] Task: Implement `getSettlementDetails()` for single settlement
- [ ] Task: Implement `calculateYTDSummary()` aggregation function
- [ ] Task: Add settlement deduction category constants

### 2.2 Settlement PDF Parsing
- [ ] Task: Extend `ocrService.jsw` with `SETTLEMENT` document type
- [ ] Task: Create settlement-specific OCR prompt with deduction parsing
- [ ] Task: Implement `uploadSettlement()` with PDF storage
- [ ] Task: Implement `parseSettlementPDF()` using OCR service
- [ ] Task: Extract earnings breakdown (line haul, FSC, accessorials)
- [ ] Task: Extract deductions breakdown (fuel advances, insurance, etc.)
- [ ] Task: Calculate derived fields (net pay, rate per mile)
- [ ] Task: Handle multi-page settlement PDFs
- [ ] Task: Test with sample settlements from major carriers (Werner, Schneider, JB Hunt)

### 2.3 Settlement List UI
- [ ] Task: Create `DRIVER_SETTLE.html` in `src/public/driver/`
- [ ] Task: Build YTD summary header with key metrics
- [ ] Task: Create settlement list with cards showing gross/net/miles
- [ ] Task: Add carrier filter dropdown
- [ ] Task: Add date range filter
- [ ] Task: Implement infinite scroll or pagination
- [ ] Task: Add upload button triggering PDF upload flow

### 2.4 Settlement Details View
- [ ] Task: Create settlement detail modal/page
- [ ] Task: Display earnings breakdown section
- [ ] Task: Display deductions breakdown section
- [ ] Task: Show calculated effective rate per mile
- [ ] Task: Add link to view/download original PDF
- [ ] Task: Add "Flag Issue" button for discrepancy reporting
- [ ] Task: Add "Verify" button for driver confirmation

### 2.5 Manual Entry Flow
- [ ] Task: Create manual settlement entry form
- [ ] Task: Include all fields: dates, gross, net, miles, loads
- [ ] Task: Include deduction breakdown input fields
- [ ] Task: Validate required fields before submission
- [ ] Task: Mark as `manual_entry: true` in database

### 2.6 Page Integration
- [ ] Task: Create Wix page `Driver-Settlements` with HTML component
- [ ] Task: Wire up postMessage bridge for all operations
- [ ] Task: Add navigation from Driver Dashboard
- [ ] Task: Link carrier in settlement to Carriers collection
- [ ] Task: Handle loading and error states

### 2.7 Phase 2 Testing
- [ ] Task: Write unit tests for settlement CRUD operations
- [ ] Task: Write unit tests for YTD aggregation accuracy
- [ ] Task: Test PDF OCR with various settlement formats
- [ ] Task: Test manual entry validation
- [ ] Task: Verify YTD calculations match sum of settlements
- [ ] Task: Test PDF download functionality
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Settlement Viewer'

---

## Phase 3: Trip Pay Calculator

### 3.1 Backend Foundation
- [ ] Task: Create `tripPayCalculator.jsw` with calculation functions
- [ ] Task: Create `TripHistory` Wix collection for saved calculations
- [ ] Task: Implement `calculateTripPay()` with all cost factors
- [ ] Task: Implement fuel estimation logic with MPG and diesel price
- [ ] Task: Add DEF cost calculation
- [ ] Task: Implement effective rate calculation (all miles vs loaded miles)

### 3.2 Fuel Price Integration
- [ ] Task: Implement `getCurrentDieselPrice()` function
- [ ] Task: Research EIA API for diesel prices (or alternative)
- [ ] Task: Add diesel price caching with 24-hour TTL
- [ ] Task: Add fallback to national average if state data unavailable
- [ ] Task: Store price history for trend analysis

### 3.3 Lane Rate Comparison
- [ ] Task: Implement `compareLaneRates()` function
- [ ] Task: Query historical TripHistory and DriverSettlements for lane data
- [ ] Task: Calculate min/avg/max rates for lane
- [ ] Task: Require minimum sample size for confidence
- [ ] Task: Handle origin/destination matching with fuzzy city matching

### 3.4 Trip Calculator UI
- [ ] Task: Create `DRIVER_TRIP_CALC.html` in `src/public/driver/`
- [ ] Task: Build origin/destination input fields with autocomplete
- [ ] Task: Add loaded miles and deadhead miles inputs
- [ ] Task: Add rate per mile input (or total rate)
- [ ] Task: Create calculate button with loading state
- [ ] Task: Display results section with breakdown
- [ ] Task: Show effective rate comparison to lane average
- [ ] Task: Add visual indicator (above/below average)

### 3.5 Results Display
- [ ] Task: Show gross pay prominently
- [ ] Task: Show fuel estimate with breakdown (diesel + DEF)
- [ ] Task: Display MPG assumption with edit option
- [ ] Task: Show net after fuel estimate
- [ ] Task: Display effective rate per all miles
- [ ] Task: Display loaded mile rate for comparison
- [ ] Task: Show lane rate comparison if data available

### 3.6 Save and History
- [ ] Task: Implement `saveTripCalculation()` function
- [ ] Task: Add "Save Calculation" button in UI
- [ ] Task: Create trip history list view (past calculations)
- [ ] Task: Allow updating status to 'completed' with actual costs
- [ ] Task: Track declined trips for analysis

### 3.7 Page Integration
- [ ] Task: Create Wix page `Trip-Calculator` with HTML component
- [ ] Task: Wire up postMessage bridge
- [ ] Task: Add navigation from Driver Dashboard
- [ ] Task: Consider embedding simplified version in match cards

### 3.8 Phase 3 Testing
- [ ] Task: Write unit tests for `calculateTripPay()` accuracy
- [ ] Task: Write unit tests for fuel estimation
- [ ] Task: Test lane rate comparison with various data scenarios
- [ ] Task: Verify diesel price caching works correctly
- [ ] Task: Test calculation with edge cases (short trips, long trips)
- [ ] Task: Verify saved calculations can be retrieved and viewed
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Trip Pay Calculator'

---

## Phase 4: Tax Deduction Helper

### 4.1 Backend Foundation
- [ ] Task: Create `taxDeductionService.jsw` with tax functions
- [ ] Task: Create `TaxDeductions` Wix collection with annual summary fields
- [ ] Task: Implement `getIRSPerDiemRates()` with current rates
- [ ] Task: Add IRS rate constants for multiple years
- [ ] Task: Implement 80% DOT deduction rule

### 4.2 Per Diem Tracking
- [ ] Task: Implement `trackPerDiemDay()` function
- [ ] Task: Validate overnight stay requirement
- [ ] Task: Determine CONUS vs OCONUS rate based on location
- [ ] Task: Create per diem day records (or update TaxDeductions aggregate)
- [ ] Task: Implement `calculateHomeTime()` for non-deductible days
- [ ] Task: Track per diem days running total

### 4.3 Tax Report Generation
- [ ] Task: Implement `generateTaxReport()` function
- [ ] Task: Pull all deductible expenses from DriverExpenses
- [ ] Task: Calculate per diem total for year
- [ ] Task: Group expenses by IRS category
- [ ] Task: Compare standard vs itemized deduction
- [ ] Task: Generate recommendation (standard vs itemize)

### 4.4 Export Functions
- [ ] Task: Implement `exportTaxData()` function
- [ ] Task: Generate CSV format for tax preparer
- [ ] Task: Generate PDF summary report
- [ ] Task: Include all required fields for Schedule C
- [ ] Task: Include per diem calculation worksheet

### 4.5 Tax Dashboard UI
- [ ] Task: Create `DRIVER_TAXES.html` in `src/public/driver/`
- [ ] Task: Build per diem tracker summary card
- [ ] Task: Display days on road vs days at home
- [ ] Task: Show per diem calculation with 80% rule
- [ ] Task: Build expense deductions summary by category
- [ ] Task: Display total itemized deduction
- [ ] Task: Show standard deduction comparison
- [ ] Task: Display recommendation with savings amount

### 4.6 Per Diem Calendar
- [ ] Task: Create interactive calendar component
- [ ] Task: Color-code days (Overnight, Home, Not Logged)
- [ ] Task: Allow tap to toggle day status
- [ ] Task: Show monthly per diem total
- [ ] Task: Show running year total
- [ ] Task: Add quick "Log Today" button

### 4.7 Export UI
- [ ] Task: Add "Download Tax Report" button
- [ ] Task: Add "Export for Tax Preparer" button
- [ ] Task: Show format options (PDF, CSV)
- [ ] Task: Generate downloadable file
- [ ] Task: Include year selector for past years

### 4.8 Page Integration
- [ ] Task: Create Wix page `Tax-Deductions` with HTML component
- [ ] Task: Wire up postMessage bridge for all operations
- [ ] Task: Add navigation from Driver Dashboard
- [ ] Task: Show reminder/CTA during tax season (Jan-Apr)

### 4.9 Phase 4 Testing
- [ ] Task: Write unit tests for per diem calculation accuracy
- [ ] Task: Write unit tests for 80% DOT rule application
- [ ] Task: Test tax report generation with sample data
- [ ] Task: Verify standard vs itemized comparison logic
- [ ] Task: Test CSV export format for tax software compatibility
- [ ] Task: Test PDF report generation and formatting
- [ ] Task: Verify per diem calendar day toggling works correctly
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Tax Deduction Helper'

---

## Integration Tasks (Cross-Phase)

### Navigation & Discovery
- [ ] Task: Add "Financial Tools" section to Driver Dashboard
- [ ] Task: Create financial tools landing page with feature cards
- [ ] Task: Add quick stats on dashboard (YTD earnings, expenses)
- [ ] Task: Add contextual CTAs (e.g., "Track this trip" after match)

### Data Connections
- [ ] Task: Link expenses to specific trips when applicable
- [ ] Task: Connect settlement data to expense deduction tracking
- [ ] Task: Auto-populate carrier in settlement from application history
- [ ] Task: Sync expense categories with tax deduction categories

### Notifications
- [ ] Task: Remind drivers to log expenses weekly
- [ ] Task: Notify when settlement expected (based on pay schedule)
- [ ] Task: Tax season reminders (January, April)
- [ ] Task: Celebrate milestones (YTD earnings milestones)

### Documentation
- [ ] Task: Create user guide for Expense Tracker
- [ ] Task: Create user guide for Settlement Viewer
- [ ] Task: Create user guide for Trip Calculator
- [ ] Task: Create tax tips guide for drivers
- [ ] Task: Add in-app tooltips explaining calculations

---

## Milestones

| Milestone | Target | Criteria |
|-----------|--------|----------|
| Phase 1 Complete | Week 2 | Expense tracker live with OCR |
| Phase 2 Complete | Week 4 | Settlement viewer live with PDF parsing |
| Phase 3 Complete | Week 5 | Trip calculator live with fuel estimates |
| Phase 4 Complete | Week 7 | Tax helper live with per diem tracking |
| Full Integration | Week 8 | All features connected, navigation complete |

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| driver_cockpit_20251221 | Track | Required (Driver Dashboard base) |
| ocrService.jsw | Code | Exists (extend for RECEIPT, SETTLEMENT) |
| observabilityService.jsw | Code | Exists (use for logging) |
| Wix Media Backend | Platform | Available |
| EIA Diesel Price API | External | Research needed |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Settlement PDF parsing accuracy | High | Support manual entry fallback, iterative prompt tuning |
| Receipt OCR accuracy | Medium | Allow user override of all fields |
| Diesel price API unavailability | Low | Cache aggressively, fallback to national average |
| IRS rate changes | Low | Parameterize rates, update annually |
| Low adoption | Medium | In-app education, gamification, tax season push |
