# Track Plan: Driver Financial Tools - Pay & Expense Management

## Phase 1: Expense Tracker (Standalone, Immediate Value)

### 1.1 Backend Foundation
- [x] Task: Create `driverExpenseService.jsw` with base CRUD operations
- [x] Task: Create `DriverExpenses` Wix collection with all fields from spec
- [x] Task: Implement `createExpense()` function with validation
- [x] Task: Implement `getExpenses()` with date range and category filters
- [x] Task: Implement `updateExpense()` with ownership verification
- [x] Task: Implement `deleteExpense()` with ownership verification
- [x] Task: Add expense category constants with icons and deductible flags

### 1.2 Receipt OCR Integration
- [x] Task: Extend `ocrService.jsw` with `RECEIPT` document type
- [x] Task: Add receipt-specific prompt to `getPromptForDocType()`
- [x] Task: Create `extractReceiptData()` wrapper function in expense service
- [x] Task: Implement receipt field extraction (vendor, amount, date, category)
- [x] Task: Add fuel-specific fields extraction (gallons, price/gallon)
- [x] Task: Test OCR with sample receipts (Pilot, Loves, TA, misc)
- [x] Task: Add OCR confidence scoring for receipt extraction

### 1.3 Expense Tracker UI
- [x] Task: Create `DRIVER_EXPENSES.html` in `src/public/driver/`
- [x] Task: Build expense list view with cards showing amount, category, date
- [x] Task: Implement category filter dropdown
- [x] Task: Implement date range filter (This Week, This Month, Custom)
- [x] Task: Add category breakdown chart (pie or bar)
- [x] Task: Build monthly totals summary header
- [x] Task: Add expense card quick actions (Edit, Delete, View Receipt)

### 1.4 Add Expense Modal
- [x] Task: Create add expense modal with camera/upload option
- [x] Task: Implement receipt photo capture using device camera API
- [x] Task: Connect receipt upload to OCR service
- [x] Task: Build form with auto-fill from OCR results
- [x] Task: Allow user to override OCR-extracted values
- [x] Task: Add category selector with icons
- [x] Task: Add payment method selector (Cash, Card, Fuel Card)
- [x] Task: Add tax deductible toggle
- [x] Task: Implement form validation and submission
- [x] Task: Show success confirmation with expense summary

### 1.5 Export Functionality
- [x] Task: Implement `exportExpensesForTaxes()` backend function
- [x] Task: Generate CSV export with category grouping
- [x] Task: Generate summary PDF with totals by category
- [x] Task: Add export button to UI with format selector
- [x] Task: Include date range in export filename

### 1.6 Page Integration
- [x] Task: Create Wix page `Driver-Expenses` with HTML component
- [x] Task: Wire up postMessage bridge for CRUD operations
- [x] Task: Add navigation link from Driver Dashboard
- [x] Task: Handle authentication check on load
- [x] Task: Add loading states and error handling

### 1.7 Phase 1 Testing
- [x] Task: Write unit tests for `createExpense()` with validation cases
- [x] Task: Write unit tests for `getExpenses()` with filter combinations
- [x] Task: Write integration test for receipt OCR flow
- [x] Task: Test camera capture on mobile devices (iOS, Android)
- [x] Task: Test export CSV format in Excel/Google Sheets
- [x] Task: Verify data isolation (driver can only see own expenses)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Expense Tracker'

---

## Phase 2: Settlement Viewer (Carrier Integration Complexity)

### 2.1 Backend Foundation
- [x] Task: Create `settlementService.jsw` with base functions
- [x] Task: Create `DriverSettlements` Wix collection with all fields
- [x] Task: Implement `createManualSettlement()` for manual entry
- [x] Task: Implement `getSettlements()` with filters
- [x] Task: Implement `getSettlementDetails()` for single settlement
- [x] Task: Implement `calculateYTDSummary()` aggregation function
- [x] Task: Add settlement deduction category constants

### 2.2 Settlement PDF Parsing
- [x] Task: Extend `ocrService.jsw` with `SETTLEMENT` document type
- [x] Task: Create settlement-specific OCR prompt with deduction parsing
- [x] Task: Implement `uploadSettlement()` with PDF storage
- [x] Task: Implement `parseSettlementPDF()` using OCR service
- [x] Task: Extract earnings breakdown (line haul, FSC, accessorials)
- [x] Task: Extract deductions breakdown (fuel advances, insurance, etc.)
- [x] Task: Calculate derived fields (net pay, rate per mile)
- [x] Task: Handle multi-page settlement PDFs
- [x] Task: Test with sample settlements from major carriers (Werner, Schneider, JB Hunt)

### 2.3 Settlement List UI
- [x] Task: Create `DRIVER_SETTLE.html` in `src/public/driver/`
- [x] Task: Build YTD summary header with key metrics
- [x] Task: Create settlement list with cards showing gross/net/miles
- [x] Task: Add carrier filter dropdown
- [x] Task: Add date range filter
- [x] Task: Implement infinite scroll or pagination
- [x] Task: Add upload button triggering PDF upload flow

### 2.4 Settlement Details View
- [x] Task: Create settlement detail modal/page
- [x] Task: Display earnings breakdown section
- [x] Task: Display deductions breakdown section
- [x] Task: Show calculated effective rate per mile
- [x] Task: Add link to view/download original PDF
- [x] Task: Add "Flag Issue" button for discrepancy reporting
- [x] Task: Add "Verify" button for driver confirmation

### 2.5 Manual Entry Flow
- [x] Task: Create manual settlement entry form
- [x] Task: Include all fields: dates, gross, net, miles, loads
- [x] Task: Include deduction breakdown input fields
- [x] Task: Validate required fields before submission
- [x] Task: Mark as `manual_entry: true` in database

### 2.6 Page Integration
- [x] Task: Create Wix page `Driver-Settlements` with HTML component
- [x] Task: Wire up postMessage bridge for all operations
- [x] Task: Add navigation from Driver Dashboard
- [x] Task: Link carrier in settlement to Carriers collection
- [x] Task: Handle loading and error states

### 2.7 Phase 2 Testing
- [x] Task: Write unit tests for settlement CRUD operations
- [x] Task: Write unit tests for YTD aggregation accuracy
- [x] Task: Test PDF OCR with various settlement formats
- [x] Task: Test manual entry validation
- [x] Task: Verify YTD calculations match sum of settlements
- [x] Task: Test PDF download functionality
- [x] Task: Conductor - User Manual Verification 'Phase 2: Settlement Viewer'

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
- [x] Task: Create `taxDeductionService.jsw` with tax functions
- [x] Task: Create `TaxDeductions` Wix collection with annual summary fields
- [x] Task: Implement `getIRSPerDiemRates()` with current rates
- [x] Task: Add IRS rate constants for multiple years
- [x] Task: Implement 80% DOT deduction rule

### 4.2 Per Diem Tracking
- [x] Task: Implement `trackPerDiemDay()` function
- [x] Task: Validate overnight stay requirement
- [x] Task: Determine CONUS vs OCONUS rate based on location
- [x] Task: Create per diem day records (or update TaxDeductions aggregate)
- [x] Task: Implement `calculateHomeTime()` for non-deductible days
- [x] Task: Track per diem days running total

### 4.3 Tax Report Generation
- [x] Task: Implement `generateTaxReport()` function
- [x] Task: Pull all deductible expenses from DriverExpenses
- [x] Task: Calculate per diem total for year
- [x] Task: Group expenses by IRS category
- [x] Task: Compare standard vs itemized deduction
- [x] Task: Generate recommendation (standard vs itemize)

### 4.4 Export Functions
- [x] Task: Implement `exportTaxData()` function
- [x] Task: Generate CSV format for tax preparer
- [x] Task: Generate PDF summary report
- [x] Task: Include all required fields for Schedule C
- [x] Task: Include per diem calculation worksheet

### 4.5 Tax Dashboard UI
- [x] Task: Create `DRIVER_TAXES.html` in `src/public/driver/`
- [x] Task: Build per diem tracker summary card
- [x] Task: Display days on road vs days at home
- [x] Task: Show per diem calculation with 80% rule
- [x] Task: Build expense deductions summary by category
- [x] Task: Display total itemized deduction
- [x] Task: Show standard deduction comparison
- [x] Task: Display recommendation with savings amount

### 4.6 Per Diem Calendar
- [x] Task: Create interactive calendar component
- [x] Task: Color-code days (Overnight, Home, Not Logged)
- [x] Task: Allow tap to toggle day status
- [x] Task: Show monthly per diem total
- [x] Task: Show running year total
- [x] Task: Add quick "Log Today" button

### 4.7 Export UI
- [x] Task: Add "Download Tax Report" button
- [x] Task: Add "Export for Tax Preparer" button
- [x] Task: Show format options (PDF, CSV)
- [x] Task: Generate downloadable file
- [x] Task: Include year selector for past years

### 4.8 Page Integration
- [x] Task: Create Wix page `Tax-Deductions` with HTML component
- [x] Task: Wire up postMessage bridge for all operations
- [x] Task: Add navigation from Driver Dashboard
- [x] Task: Show reminder/CTA during tax season (Jan-Apr)

### 4.9 Phase 4 Testing
- [x] Task: Write unit tests for per diem calculation accuracy
- [x] Task: Write unit tests for 80% DOT rule application
- [x] Task: Test tax report generation with sample data
- [x] Task: Verify standard vs itemized comparison logic
- [x] Task: Test CSV export format for tax software compatibility
- [x] Task: Test PDF report generation and formatting
- [x] Task: Verify per diem calendar day toggling works correctly
- [x] Task: Conductor - User Manual Verification 'Phase 4: Tax Deduction Helper'

---

## Integration Tasks (Cross-Phase)

### Navigation & Discovery
- [x] Task: Add "Financial Tools" section to Driver Dashboard
- [x] Task: Create financial tools landing page with feature cards
- [x] Task: Add quick stats on dashboard (YTD earnings, expenses)
- [x] Task: Add contextual CTAs (e.g., "Track this trip" after match)

### Data Connections
- [x] Task: Link expenses to specific trips when applicable
- [x] Task: Connect settlement data to expense deduction tracking
- [x] Task: Auto-populate carrier in settlement from application history
- [x] Task: Sync expense categories with tax deduction categories

### Notifications
- [x] Task: Remind drivers to log expenses weekly
- [x] Task: Notify when settlement expected (based on pay schedule)
- [x] Task: Tax season reminders (January, April)
- [x] Task: Celebrate milestones (YTD earnings milestones)

### Documentation
- [x] Task: Create user guide for Expense Tracker
- [x] Task: Create user guide for Settlement Viewer
- [ ] Task: Create user guide for Trip Calculator
- [x] Task: Create tax tips guide for drivers
- [x] Task: Add in-app tooltips explaining calculations

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
