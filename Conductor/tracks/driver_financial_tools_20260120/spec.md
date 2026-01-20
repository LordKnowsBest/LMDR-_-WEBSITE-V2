# Track Spec: Driver Financial Tools - Pay & Expense Management

## 1. Goal

Empower drivers with comprehensive financial tools to track earnings, manage expenses, estimate trip pay, and prepare for tax season - building trust through transparency and providing tangible daily value beyond job matching.

## 2. Background

* **Current State:** Drivers use LMDR for job matching but have no tools for ongoing financial management. After getting hired, engagement drops.
* **Desired State:** A financial cockpit where drivers can:
  1. View and understand their settlement statements
  2. Track business expenses with receipt OCR
  3. Estimate earnings before accepting loads
  4. Prepare tax deductions and reports
* **Strategic Value:** Financial tools increase daily app engagement, build trust through transparency, and create long-term platform stickiness beyond initial job placement.

## 3. Architecture Overview

```
+------------------------------------------------------------------+
|                     DRIVER FINANCIAL TOOLS                        |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------+  +------------------+  +------------------+  |
|  |   EXPENSE        |  |   SETTLEMENT     |  |   TRIP PAY       |  |
|  |   TRACKER        |  |   VIEWER         |  |   CALCULATOR     |  |
|  |                  |  |                  |  |                  |  |
|  | - Receipt OCR    |  | - PDF Parser     |  | - Mile Rate      |  |
|  | - Categories     |  | - Carrier API    |  | - Fuel Estimate  |  |
|  | - Photo Capture  |  | - Deductions     |  | - Deadhead Calc  |  |
|  | - Export CSV     |  | - YTD Totals     |  | - Net vs Gross   |  |
|  +--------+---------+  +--------+---------+  +--------+---------+  |
|           |                     |                     |            |
|           +----------+----------+----------+----------+            |
|                      |                     |                       |
|              +-------v-------+     +-------v-------+               |
|              |   TAX         |     |   DATA        |               |
|              |   HELPER      |     |   LAYER       |               |
|              |               |     |               |               |
|              | - Per Diem    |     | - Collections |               |
|              | - Home Time   |     | - OCR Service |               |
|              | - IRS Rates   |     | - Export APIs |               |
|              +---------------+     +---------------+               |
|                                                                    |
+------------------------------------------------------------------+
```

## 4. System Components

### 4.1 Component Architecture

```
+------------------------------------------------------------------+
|                         FRONTEND (HTML)                           |
+------------------------------------------------------------------+
|                                                                    |
|  src/public/driver/                                               |
|  +----------------------+  +----------------------+               |
|  | DRIVER_EXPENSES.html |  | DRIVER_SETTLE.html   |               |
|  | - Expense list       |  | - Settlement list    |               |
|  | - Add expense modal  |  | - Statement details  |               |
|  | - Receipt camera     |  | - Deduction charts   |               |
|  | - Category filters   |  | - PDF upload         |               |
|  +----------------------+  +----------------------+               |
|                                                                    |
|  +----------------------+  +----------------------+               |
|  | DRIVER_TRIP_CALC.html|  | DRIVER_TAXES.html    |               |
|  | - Route input        |  | - Per diem tracker   |               |
|  | - Rate calculator    |  | - Deduction summary  |               |
|  | - Fuel estimator     |  | - Export reports     |               |
|  | - Accept/decline     |  | - IRS rate display   |               |
|  +----------------------+  +----------------------+               |
|                                                                    |
+------------------------------------------------------------------+
|                         BACKEND (JSW)                             |
+------------------------------------------------------------------+
|                                                                    |
|  src/backend/                                                     |
|  +-------------------------+  +-------------------------+         |
|  | driverExpenseService.jsw|  | settlementService.jsw   |         |
|  | - createExpense()       |  | - uploadSettlement()    |         |
|  | - getExpenses()         |  | - parseSettlementPDF()  |         |
|  | - updateExpense()       |  | - getSettlements()      |         |
|  | - deleteExpense()       |  | - calculateYTD()        |         |
|  | - extractReceipt()      |  | - linkToCarrier()       |         |
|  | - exportExpenses()      |  +-------------------------+         |
|  +-------------------------+                                      |
|                                                                    |
|  +-------------------------+  +-------------------------+         |
|  | tripPayCalculator.jsw   |  | taxDeductionService.jsw |         |
|  | - calculateTripPay()    |  | - getPerDiemRate()      |         |
|  | - estimateFuelCost()    |  | - trackPerDiemDay()     |         |
|  | - getMarketRates()      |  | - calculateDeductions() |         |
|  | - compareCarrierPay()   |  | - generateTaxReport()   |         |
|  +-------------------------+  | - getIRSRates()         |         |
|                               +-------------------------+         |
|                                                                    |
+------------------------------------------------------------------+
```

### 4.2 Data Flow Diagram

```
                                 DRIVER ACTIONS
                                       |
         +------------+----------------+----------------+------------+
         |            |                |                |            |
         v            v                v                v            v
    +--------+   +--------+      +----------+    +----------+  +---------+
    | Snap   |   | Upload |      | Enter    |    | Log      |  | Export  |
    | Receipt|   | Settle-|      | Trip     |    | Per Diem |  | Tax     |
    |        |   | ment   |      | Details  |    | Day      |  | Report  |
    +---+----+   +---+----+      +----+-----+    +----+-----+  +----+----+
        |            |                |               |             |
        v            v                v               v             v
    +--------+   +--------+      +----------+    +----------+  +---------+
    | OCR    |   | PDF    |      | Trip Pay |    | Tax      |  | Report  |
    | Service|   | Parser |      | Calc     |    | Service  |  | Gen     |
    +---+----+   +---+----+      +----+-----+    +----+-----+  +----+----+
        |            |                |               |             |
        v            v                v               v             v
    +-------------------------------------------------------------------+
    |                        WIX COLLECTIONS                             |
    |  DriverExpenses | DriverSettlements | TaxDeductions | TripHistory |
    +-------------------------------------------------------------------+
```

## 5. Data Model

### 5.1 DriverExpenses Collection

| Field | Type | Description |
|-------|------|-------------|
| _id | TEXT | Primary key |
| _owner | TEXT | Driver's member ID |
| driver_id | REFERENCE (DriverProfiles) | Link to driver profile |
| expense_date | DATE | Date of expense |
| category | TEXT | Category code (see below) |
| amount | NUMBER | Expense amount in USD |
| description | TEXT | User description |
| vendor | TEXT | Vendor/merchant name |
| receipt_url | IMAGE | Uploaded receipt image |
| ocr_extracted | OBJECT | Raw OCR data (JSON) |
| ocr_confidence | TEXT | HIGH/MEDIUM/LOW |
| is_deductible | BOOLEAN | Tax deductible flag |
| deduction_category | TEXT | IRS category for taxes |
| trip_id | TEXT | Optional link to trip |
| payment_method | TEXT | cash/card/fuel_card/other |
| reimbursed | BOOLEAN | Carrier reimbursed flag |
| created_at | DATE | Record creation |
| updated_at | DATE | Last update |

**Expense Categories:**
```javascript
const EXPENSE_CATEGORIES = {
  FUEL: { label: 'Fuel', icon: 'fuel', deductible: true },
  MEALS: { label: 'Meals', icon: 'utensils', deductible: true },
  LUMPER: { label: 'Lumper Fees', icon: 'forklift', deductible: true },
  TOLLS: { label: 'Tolls', icon: 'road', deductible: true },
  PARKING: { label: 'Parking', icon: 'parking', deductible: true },
  SCALES: { label: 'Scale Fees', icon: 'weight', deductible: true },
  REPAIRS: { label: 'Repairs/Maintenance', icon: 'wrench', deductible: true },
  SUPPLIES: { label: 'Truck Supplies', icon: 'box', deductible: true },
  COMMUNICATION: { label: 'Phone/GPS', icon: 'phone', deductible: true },
  LODGING: { label: 'Lodging', icon: 'bed', deductible: true },
  OTHER: { label: 'Other', icon: 'ellipsis', deductible: false }
};
```

### 5.2 DriverSettlements Collection

| Field | Type | Description |
|-------|------|-------------|
| _id | TEXT | Primary key |
| _owner | TEXT | Driver's member ID |
| driver_id | REFERENCE (DriverProfiles) | Link to driver profile |
| carrier_id | REFERENCE (Carriers) | Link to carrier |
| settlement_date | DATE | Pay period end date |
| pay_period_start | DATE | Period start |
| pay_period_end | DATE | Period end |
| gross_pay | NUMBER | Total earnings before deductions |
| total_deductions | NUMBER | Sum of all deductions |
| net_pay | NUMBER | Take-home amount |
| deductions | OBJECT | Breakdown (JSON - see below) |
| miles_driven | NUMBER | Total miles for period |
| loads_completed | NUMBER | Number of loads |
| rate_per_mile | NUMBER | Calculated CPM |
| bonuses | OBJECT | Bonus breakdown (JSON) |
| pdf_url | FILE | Original settlement PDF |
| ocr_extracted | OBJECT | Raw OCR data |
| manual_entry | BOOLEAN | True if manually entered |
| verified | BOOLEAN | Driver verified accuracy |
| created_at | DATE | Record creation |

**Deductions Object Schema:**
```javascript
{
  "fuel_advances": 0,
  "insurance": 0,
  "escrow": 0,
  "equipment_lease": 0,
  "trailer_rent": 0,
  "cash_advances": 0,
  "tolls": 0,
  "lumper_fees": 0,
  "comcheck_fees": 0,
  "efs_fees": 0,
  "repairs": 0,
  "detention_pay": 0,
  "layover_pay": 0,
  "other": 0
}
```

### 5.3 TaxDeductions Collection

| Field | Type | Description |
|-------|------|-------------|
| _id | TEXT | Primary key |
| _owner | TEXT | Driver's member ID |
| driver_id | REFERENCE (DriverProfiles) | Link to driver profile |
| tax_year | NUMBER | Year (e.g., 2026) |
| per_diem_days | NUMBER | Total qualifying days |
| per_diem_rate | NUMBER | IRS rate used |
| per_diem_total | NUMBER | Calculated per diem |
| home_time_days | NUMBER | Days at tax home |
| overnight_stays | NUMBER | Qualifying overnight stays |
| total_expenses | NUMBER | Sum from DriverExpenses |
| expense_by_category | OBJECT | Category breakdown |
| standard_deduction | NUMBER | IRS standard deduction |
| itemized_deduction | NUMBER | Itemized total |
| recommended_method | TEXT | standard/itemized |
| last_calculated | DATE | Last calculation date |

### 5.4 TripHistory Collection (for Trip Pay Calculator)

| Field | Type | Description |
|-------|------|-------------|
| _id | TEXT | Primary key |
| _owner | TEXT | Driver's member ID |
| driver_id | REFERENCE (DriverProfiles) | Link to driver |
| carrier_id | REFERENCE (Carriers) | Carrier for trip |
| origin_city | TEXT | Pickup city |
| origin_state | TEXT | Pickup state |
| destination_city | TEXT | Delivery city |
| destination_state | TEXT | Delivery state |
| total_miles | NUMBER | Loaded miles |
| deadhead_miles | NUMBER | Empty miles |
| rate_per_mile | NUMBER | Quoted rate |
| gross_pay | NUMBER | Total before expenses |
| estimated_fuel_cost | NUMBER | Fuel estimate |
| estimated_net | NUMBER | Net after fuel |
| actual_fuel_cost | NUMBER | Actual (if completed) |
| actual_net | NUMBER | Actual net |
| trip_date | DATE | Trip date |
| status | TEXT | estimated/completed/declined |
| created_at | DATE | Calculation timestamp |

## 6. Feature Specifications

### 6.1 Expense Tracker

**Overview:**
Mobile-first expense logging with receipt OCR, category tagging, and tax export capabilities.

**Key Functions:**
```javascript
// driverExpenseService.jsw

// Create new expense with optional receipt OCR
export async function createExpense(driverId, expenseData, receiptBase64) {
  // 1. If receipt provided, run OCR
  // 2. Merge OCR data with user input (user overrides)
  // 3. Auto-categorize based on vendor/description
  // 4. Save to DriverExpenses collection
  // Returns: { success, expenseId, ocrExtracted }
}

// Get expenses with filters
export async function getExpenses(driverId, filters) {
  // Filters: dateRange, category, minAmount, maxAmount
  // Returns: { expenses[], totalAmount, categoryBreakdown }
}

// Extract receipt data using existing OCR service
export async function extractReceiptData(base64DataUrl) {
  // Leverages ocrService.jsw with RECEIPT document type
  // Returns: { vendor, amount, date, category, confidence }
}

// Export expenses for taxes
export async function exportExpensesForTaxes(driverId, taxYear) {
  // Returns: { csv, summary, categoryTotals }
}
```

**Receipt OCR Prompt (for ocrService.jsw extension):**
```javascript
const RECEIPT_PROMPT = `You are an expert OCR system for truck driver expense receipts.

Extract the following fields and return as JSON:
- vendor: Business name (e.g., "Pilot Flying J", "Love's Travel Stop")
- date: Date in ISO format YYYY-MM-DD
- total: Total amount as a number (e.g., 125.50)
- category: Best match from [FUEL, MEALS, LUMPER, TOLLS, PARKING, SCALES, REPAIRS, SUPPLIES, LODGING, OTHER]
- lineItems: Array of {description, amount} if visible
- paymentMethod: cash/card/fuel_card if visible

For fuel receipts, also extract:
- gallons: Number of gallons
- pricePerGallon: Price per gallon
- fuelType: diesel/def/gasoline

Return ONLY valid JSON.`;
```

**UI Mockup - Expense List:**
```
+------------------------------------------+
|  [<] Expenses              [+ Add] [Export]|
+------------------------------------------+
|  January 2026                    $2,847.50|
+------------------------------------------+
|  +--------------------------------------+ |
|  | [FUEL] Pilot Flying J      -$425.00 | |
|  | Jan 20, 2026 | Diesel 125 gal       | |
|  | [Receipt] [Edit] [Delete]           | |
|  +--------------------------------------+ |
|  | [MEALS] Loves Travel Stop   -$18.50 | |
|  | Jan 20, 2026 | Breakfast            | |
|  | [Receipt] [Edit] [Delete]           | |
|  +--------------------------------------+ |
|  | [LUMPER] Chicago Cold Storage -$75  | |
|  | Jan 19, 2026 | Unload fee           | |
|  | [Receipt] [Edit] [Delete]           | |
|  +--------------------------------------+ |
|                                           |
|  [ Show: All v ] [ Date: This Month v ]  |
+------------------------------------------+
|  Category Breakdown                       |
|  Fuel        ████████████████░░  68%     |
|  Meals       ████░░░░░░░░░░░░░░  12%     |
|  Lumper      ███░░░░░░░░░░░░░░░  10%     |
|  Other       ██░░░░░░░░░░░░░░░░  10%     |
+------------------------------------------+
```

**UI Mockup - Add Expense:**
```
+------------------------------------------+
|  [X]          Add Expense                 |
+------------------------------------------+
|                                           |
|  +--------------------------------------+ |
|  |     [Camera Icon]                    | |
|  |     Snap Receipt                     | |
|  |     or tap to upload                 | |
|  +--------------------------------------+ |
|                                           |
|  -------- or enter manually --------     |
|                                           |
|  Category*                                |
|  +--------------------------------------+ |
|  | [Fuel v]                             | |
|  +--------------------------------------+ |
|                                           |
|  Vendor*                                  |
|  +--------------------------------------+ |
|  | Pilot Flying J                       | |
|  +--------------------------------------+ |
|                                           |
|  Amount*              Date*               |
|  +----------------+  +----------------+  |
|  | $425.00        |  | 01/20/2026     |  |
|  +----------------+  +----------------+  |
|                                           |
|  Description                              |
|  +--------------------------------------+ |
|  | Diesel fill-up, 125 gallons          | |
|  +--------------------------------------+ |
|                                           |
|  Payment Method                           |
|  ( ) Cash  (x) Card  ( ) Fuel Card       |
|                                           |
|  [x] Tax Deductible                       |
|                                           |
|  [        Save Expense        ]           |
|                                           |
+------------------------------------------+
```

### 6.2 Settlement Viewer

**Overview:**
Parse and display settlement statements with deduction breakdowns, historical tracking, and YTD totals.

**Key Functions:**
```javascript
// settlementService.jsw

// Upload and parse settlement PDF
export async function uploadSettlement(driverId, pdfBase64, carrierId) {
  // 1. Store PDF in Wix Media
  // 2. Run OCR extraction for settlement data
  // 3. Parse deductions, bonuses, miles
  // 4. Calculate rate per mile
  // 5. Save to DriverSettlements
  // Returns: { success, settlementId, parsed }
}

// Manual settlement entry
export async function createManualSettlement(driverId, settlementData) {
  // For carriers without digital settlements
}

// Get settlement history
export async function getSettlements(driverId, filters) {
  // Filters: dateRange, carrierId
  // Returns: { settlements[], ytdTotals }
}

// Calculate YTD summary
export async function calculateYTDSummary(driverId, year) {
  // Returns: { grossPay, netPay, totalDeductions, avgCPM, totalMiles }
}
```

**Settlement OCR Prompt:**
```javascript
const SETTLEMENT_PROMPT = `You are an expert OCR system for trucking settlement statements.

Extract the following fields and return as JSON:
- payPeriodStart: Start date YYYY-MM-DD
- payPeriodEnd: End date YYYY-MM-DD
- settlementDate: Payment date YYYY-MM-DD
- grossPay: Total earnings before deductions
- netPay: Take-home amount
- totalMiles: Miles driven
- loadsCompleted: Number of loads

Extract deductions object with these fields (use 0 if not found):
- fuel_advances
- insurance
- escrow
- equipment_lease
- trailer_rent
- cash_advances
- tolls
- lumper_fees
- comcheck_fees
- efs_fees
- repairs
- detention_pay
- layover_pay
- other

Extract bonuses object:
- safety_bonus
- fuel_bonus
- referral_bonus
- sign_on_bonus
- other_bonus

Return ONLY valid JSON.`;
```

**UI Mockup - Settlement List:**
```
+------------------------------------------+
|  [<] Settlements           [+ Upload PDF] |
+------------------------------------------+
|  2026 Year-to-Date                        |
|  +--------------------------------------+ |
|  | Gross: $47,250  |  Net: $38,500     | |
|  | Miles: 42,300   |  CPM: $1.12       | |
|  +--------------------------------------+ |
+------------------------------------------+
|                                           |
|  +--------------------------------------+ |
|  | Jan 15 - Jan 21, 2026               | |
|  | Werner Enterprises                   | |
|  | Gross: $2,450   Net: $1,980         | |
|  | 2,180 miles @ $1.12/mi              | |
|  | [View Details]                       | |
|  +--------------------------------------+ |
|                                           |
|  +--------------------------------------+ |
|  | Jan 8 - Jan 14, 2026                | |
|  | Werner Enterprises                   | |
|  | Gross: $2,680   Net: $2,150         | |
|  | 2,390 miles @ $1.12/mi              | |
|  | [View Details]                       | |
|  +--------------------------------------+ |
|                                           |
+------------------------------------------+
```

**UI Mockup - Settlement Details:**
```
+------------------------------------------+
|  [<] Settlement Details        [Download] |
+------------------------------------------+
|  Werner Enterprises                       |
|  Jan 15 - Jan 21, 2026                   |
+------------------------------------------+
|                                           |
|  EARNINGS                                 |
|  +--------------------------------------+ |
|  | Line Haul (2,180 mi @ $0.55)  $1,199 | |
|  | Fuel Surcharge                  $436 | |
|  | Detention Pay                   $150 | |
|  | Stop Pay (3 stops)             $105 | |
|  | Safety Bonus                    $100 | |
|  +--------------------------------------+ |
|  | GROSS PAY                     $2,450 | |
|  +--------------------------------------+ |
|                                           |
|  DEDUCTIONS                               |
|  +--------------------------------------+ |
|  | Fuel Advances                  -$320 | |
|  | Insurance                       -$85 | |
|  | Escrow                          -$50 | |
|  | EFS/Comcheck Fees               -$15 | |
|  +--------------------------------------+ |
|  | TOTAL DEDUCTIONS               -$470 | |
|  +--------------------------------------+ |
|                                           |
|  +--------------------------------------+ |
|  | NET PAY                       $1,980 | |
|  | Effective Rate              $0.91/mi | |
|  +--------------------------------------+ |
|                                           |
|  [Original PDF]  [Flag Issue]            |
+------------------------------------------+
```

### 6.3 Trip Pay Calculator

**Overview:**
Pre-trip earnings estimator to help drivers make informed decisions before accepting loads.

**Key Functions:**
```javascript
// tripPayCalculator.jsw

// Calculate estimated trip pay
export async function calculateTripPay(tripDetails) {
  // Input: { origin, destination, loadedMiles, deadheadMiles, ratePerMile }
  // 1. Calculate gross pay
  // 2. Estimate fuel cost based on MPG and current diesel prices
  // 3. Calculate net after fuel
  // 4. Show effective rate per all miles (loaded + deadhead)
  // Returns: { gross, fuelEstimate, netEstimate, effectiveRate, breakdown }
}

// Get current average diesel price
export async function getCurrentDieselPrice(state) {
  // Use EIA API or cached average
  // Returns: { pricePerGallon, asOf, source }
}

// Compare carrier rates for same lane
export async function compareLaneRates(origin, destination) {
  // Based on historical data from DriverSettlements
  // Returns: { avgRate, minRate, maxRate, sampleSize }
}

// Save trip calculation for history
export async function saveTripCalculation(driverId, calculation) {
  // Store in TripHistory with status='estimated'
}
```

**Fuel Estimation Logic:**
```javascript
const FUEL_DEFAULTS = {
  truckMPG: 6.5,           // Average semi MPG
  defUsageRatio: 0.03,     // 3% DEF per diesel gallon
  defPricePerGallon: 2.50, // Average DEF price
  tankCapacity: 200        // Gallons
};

function estimateFuelCost(miles, dieselPrice, mpg = FUEL_DEFAULTS.truckMPG) {
  const gallonsNeeded = miles / mpg;
  const dieselCost = gallonsNeeded * dieselPrice;
  const defCost = gallonsNeeded * FUEL_DEFAULTS.defUsageRatio * FUEL_DEFAULTS.defPricePerGallon;
  return dieselCost + defCost;
}
```

**UI Mockup - Trip Calculator:**
```
+------------------------------------------+
|  [<] Trip Pay Calculator                  |
+------------------------------------------+
|                                           |
|  ORIGIN                                   |
|  +--------------------------------------+ |
|  | Dallas, TX                           | |
|  +--------------------------------------+ |
|                                           |
|  DESTINATION                              |
|  +--------------------------------------+ |
|  | Chicago, IL                          | |
|  +--------------------------------------+ |
|                                           |
|  MILES                                    |
|  Loaded Miles      Deadhead Miles         |
|  +---------------+ +---------------+      |
|  | 925           | | 45            |      |
|  +---------------+ +---------------+      |
|                                           |
|  RATE                                     |
|  Rate Per Mile     Total Rate             |
|  +---------------+ +---------------+      |
|  | $2.35         | | $2,173.75     |      |
|  +---------------+ +---------------+      |
|                                           |
|  [      Calculate      ]                  |
|                                           |
+------------------------------------------+
|  EARNINGS ESTIMATE                        |
+------------------------------------------+
|                                           |
|  Gross Pay                       $2,174  |
|                                           |
|  Est. Fuel (970 mi @ 6.5 mpg)             |
|    Diesel (149 gal @ $3.85)       -$574  |
|    DEF                             -$11  |
|                                           |
|  +--------------------------------------+ |
|  | ESTIMATED NET                $1,589  | |
|  +--------------------------------------+ |
|                                           |
|  Effective Rate (all miles)    $1.64/mi  |
|  Loaded Miles Only             $1.72/mi  |
|                                           |
|  Lane Average: $2.15 - $2.55/mi          |
|  Your rate is BELOW average              |
|                                           |
|  [Save Calculation]  [New Calculation]   |
|                                           |
+------------------------------------------+
```

### 6.4 Tax Deduction Helper

**Overview:**
Track per diem, deductible expenses, and generate tax-ready reports with IRS rate integration.

**Key Functions:**
```javascript
// taxDeductionService.jsw

// Get current IRS per diem rates
export async function getIRSPerDiemRates(year) {
  // 2024 rates: $69/day CONUS, $74/day OCONUS
  // 80% deductible for truckers (special DOT rule)
  // Returns: { conus, oconus, deductiblePercent }
}

// Track per diem day
export async function trackPerDiemDay(driverId, date, overnight, location) {
  // Validates overnight requirement
  // Calculates applicable rate
  // Updates TaxDeductions running total
}

// Calculate home time (non-deductible days)
export async function calculateHomeTime(driverId, year) {
  // Returns days at tax home
}

// Generate annual tax report
export async function generateTaxReport(driverId, year) {
  // Pulls all deductible expenses
  // Calculates per diem total
  // Compares standard vs itemized
  // Returns: { summary, categoryBreakdown, perDiem, recommendation }
}

// Export for tax preparer
export async function exportTaxData(driverId, year, format) {
  // format: 'csv', 'pdf', 'summary'
}
```

**IRS Per Diem Calculation:**
```javascript
const IRS_RATES = {
  2026: {
    conus: 69,        // Continental US
    oconus: 74,       // Outside CONUS
    deductiblePercent: 0.80  // DOT workers get 80%
  }
};

function calculatePerDiemDeduction(days, rate, year) {
  const yearRates = IRS_RATES[year] || IRS_RATES[2026];
  const dailyRate = rate || yearRates.conus;
  const grossPerDiem = days * dailyRate;
  const deductiblePerDiem = grossPerDiem * yearRates.deductiblePercent;
  return {
    days,
    dailyRate,
    grossPerDiem,
    deductiblePercent: yearRates.deductiblePercent * 100,
    deductiblePerDiem
  };
}
```

**UI Mockup - Tax Dashboard:**
```
+------------------------------------------+
|  [<] Tax Deductions - 2026       [Export] |
+------------------------------------------+
|                                           |
|  PER DIEM TRACKER                         |
|  +--------------------------------------+ |
|  | Days on Road          |         285 | |
|  | Days at Home          |          80 | |
|  | IRS Rate              |     $69/day | |
|  | Gross Per Diem        |     $19,665 | |
|  | Deductible (80%)      |     $15,732 | |
|  +--------------------------------------+ |
|  [+ Log Today] [View Calendar]           |
|                                           |
+------------------------------------------+
|  EXPENSE DEDUCTIONS                       |
|  +--------------------------------------+ |
|  | Fuel (not reimbursed) |      $4,250 | |
|  | Meals (above per diem)|        $850 | |
|  | Truck Supplies        |      $1,200 | |
|  | Phone/GPS             |        $600 | |
|  | Repairs/Maintenance   |      $2,100 | |
|  | Other Business        |        $450 | |
|  +--------------------------------------+ |
|  | TOTAL EXPENSES        |      $9,450 | |
|  +--------------------------------------+ |
|                                           |
+------------------------------------------+
|  DEDUCTION SUMMARY                        |
|  +--------------------------------------+ |
|  | Per Diem Deduction    |     $15,732 | |
|  | Expense Deduction     |      $9,450 | |
|  | TOTAL ITEMIZED        |     $25,182 | |
|  +--------------------------------------+ |
|  | Standard Deduction    |     $14,600 | |
|  +--------------------------------------+ |
|                                           |
|  Recommendation: ITEMIZE                  |
|  You'll save $10,582 more by itemizing   |
|                                           |
|  [Download Tax Report]                    |
|  [Export for Tax Preparer]                |
|                                           |
+------------------------------------------+
```

**UI Mockup - Per Diem Calendar:**
```
+------------------------------------------+
|  [<] Per Diem Calendar    January 2026   |
+------------------------------------------+
|                                           |
|  Su   Mo   Tu   We   Th   Fr   Sa        |
|  +--+--+--+--+--+--+--+--+--+--+--+--+--+|
|  |  |  |  | 1 | 2 | 3 | 4 |             |
|  |  |  |  |[O]|[O]|[O]|[H]|             |
|  +--+--+--+--+--+--+--+--+               |
|  | 5 | 6 | 7 | 8 | 9 |10 |11 |          |
|  |[H]|[O]|[O]|[O]|[O]|[O]|[H]|          |
|  +--+--+--+--+--+--+--+--+               |
|  |12 |13 |14 |15 |16 |17 |18 |          |
|  |[H]|[O]|[O]|[O]|[O]|[O]|[O]|          |
|  +--+--+--+--+--+--+--+--+               |
|  |19 |20 |   |   |   |   |   |          |
|  |[O]|[O]|   |   |   |   |   |          |
|  +--+--+--+--+--+--+--+--+               |
|                                           |
|  Legend:                                  |
|  [O] = Overnight (Per Diem Eligible)     |
|  [H] = Home (Not Eligible)               |
|  [ ] = Not Logged                        |
|                                           |
|  January Total: 15 days = $1,035         |
|                                           |
|  [Tap date to toggle status]             |
+------------------------------------------+
```

## 7. OCR Service Integration

Extend existing `ocrService.jsw` with new document types:

```javascript
// Add to getPromptForDocType()
if (docType === 'RECEIPT') {
  return RECEIPT_PROMPT;
}

if (docType === 'SETTLEMENT') {
  return SETTLEMENT_PROMPT;
}

// Add to extractDocumentForAutoFill()
// Add RECEIPT and SETTLEMENT handling
```

## 8. API Design

### 8.1 Expense APIs

```javascript
// POST /expenses
createExpense(driverId, expenseData, receiptBase64?)

// GET /expenses?driverId=X&dateFrom=X&dateTo=X&category=X
getExpenses(driverId, filters)

// PUT /expenses/:id
updateExpense(expenseId, updates)

// DELETE /expenses/:id
deleteExpense(expenseId)

// POST /expenses/ocr
extractReceiptData(base64DataUrl)

// GET /expenses/export?year=2026&format=csv
exportExpensesForTaxes(driverId, year, format)
```

### 8.2 Settlement APIs

```javascript
// POST /settlements/upload
uploadSettlement(driverId, pdfBase64, carrierId)

// POST /settlements/manual
createManualSettlement(driverId, settlementData)

// GET /settlements?driverId=X&carrierId=X&dateFrom=X
getSettlements(driverId, filters)

// GET /settlements/:id
getSettlementDetails(settlementId)

// GET /settlements/ytd?year=2026
calculateYTDSummary(driverId, year)
```

### 8.3 Trip Calculator APIs

```javascript
// POST /trips/calculate
calculateTripPay(tripDetails)

// GET /trips/diesel-price?state=TX
getCurrentDieselPrice(state)

// GET /trips/lane-rates?origin=X&destination=X
compareLaneRates(origin, destination)

// POST /trips/save
saveTripCalculation(driverId, calculation)
```

### 8.4 Tax Deduction APIs

```javascript
// GET /tax/per-diem-rates?year=2026
getIRSPerDiemRates(year)

// POST /tax/per-diem
trackPerDiemDay(driverId, date, overnight, location)

// GET /tax/home-time?year=2026
calculateHomeTime(driverId, year)

// GET /tax/report?year=2026
generateTaxReport(driverId, year)

// GET /tax/export?year=2026&format=pdf
exportTaxData(driverId, year, format)
```

## 9. Security Considerations

1. **Data Privacy:** All financial data is scoped to driver's member ID (`_owner` field)
2. **Receipt Storage:** Images stored in Wix Media with private URLs
3. **OCR Data:** Raw OCR response stored for audit, but not exposed to UI
4. **Export Limits:** Rate limit exports to prevent abuse
5. **Settlement PDFs:** Verify driver ownership before displaying

## 10. Performance Considerations

1. **OCR Caching:** Cache receipt/settlement OCR results to avoid re-processing
2. **Pagination:** Expense and settlement lists paginated (50 per page)
3. **Aggregation:** Pre-calculate YTD totals on settlement insert
4. **Diesel Prices:** Cache fuel prices with 24-hour TTL

## 11. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Expense Entries/Driver/Month | 20+ | Avg entries per active driver |
| Settlement Uploads | 80% | % of drivers uploading settlements |
| Trip Calculator Usage | 10/week | Calculations per active driver |
| Tax Report Exports | 60% | % of drivers exporting at tax time |
| DAU Increase | +40% | Daily active user growth |
| Retention (30-day) | +25% | Driver return rate improvement |
