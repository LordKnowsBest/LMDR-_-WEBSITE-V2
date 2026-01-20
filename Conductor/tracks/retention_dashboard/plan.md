# Employee Retention & Driver Tracking Dashboard - Implementation Plan

## 1. Goal Description
Create a predictive dashboard for recruiters and fleet managers to track driver performance, monitor engagement, and predict turnover risk. This tool transforms raw activity data (miles, deliveries, safety) into actionable retention insights.

## 2. User Review Required
> [!IMPORTANT]
> **New Data Dependencies**: This feature requires performance data (miles, on-time %) which currently doesn't exist in the schema. We will create a `DriverPerformance` collection to store this, which in a real-world scenario would be populated by a TMS integration. For this implementation, we will seed it with mock data or allow manual entry.

> [!NOTE]
> **Prediction Logic**: The "AI" prediction will initially be a heuristic model (rules-based) analyzing key risk factors (low miles, high safety incidents, low home time). We can later connect this to an actual LLM if needed for "synthesis" of qualitative feedback.
/mcp
## 3. Architecture & Data Model

### 3.1 New Wix Collections

#### `DriverPerformance`
Tracks periodic performance metrics for a driver within a carrier.
*   `driver_id` (Reference -> DriverProfiles)
*   `carrier_dot` (String)
*   `period_start` (Date)
*   `period_end` (Date)
*   `miles_driven` (Number)
*   `on_time_delivery_rate` (Number, 0-100)
*   `safety_incidents` (Number: Citations + Accidents)
*   `home_time_days` (Number)
*   `revenue_generated` (Number - Optional)

#### `RetentionRiskLogs`
Stores historical risk assessments to track trends over time.
*   `driver_id` (Reference)
*   `carrier_dot` (String)
*   `risk_level` (String: 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
*   `risk_score` (Number: 0-100)
*   `primary_factor` (String: e.g., "Low Home Time")
*   `assessment_date` (Date)

### 3.2 Backend Services

#### `src/backend/retentionService.jsw`
*   **`getCarrierRetentionDashboard(carrierDot)`**: Aggregates fleet-wide metrics.
*   **`getDriverRetentionProfile(driverId)`**: Detailed view for a single driver.
*   **`calculateRiskScore(metrics)`**: Core logic determining turnover probability.
    *   *Logic*:
        *   High Risk if: On-time < 90% OR Safety Incidents > 1 OR Home Time < 4 days/mo.
        *   Medium Risk if: Miles dropped > 15% vs previous month.

### 3.3 Frontend Components

#### `src/public/Recruiter_Retention_Dashboard.html`
*   **Fleet Overview**: Top-level stats (Avg Retention, High Risk Count).
*   **"At Risk" Watchlist**: Table of drivers with High/Critical risk scores.
*   **Driver Detail View**: Charts showing miles/pay trends vs risk.

## 4. Implementation Steps

### Step 1: Backend Foundation
- [ ] Create `DriverPerformance` and `RetentionRiskLogs` collections (Task: Define Schema).
- [ ] Implement `src/backend/retentionService.jsw` with mock data generators for performance metrics.

### Step 2: Prediction Logic
- [ ] Implement `calculateRiskScore` algorithm.
- [ ] Create a scheduled job (optional) or on-demand function to refresh risk scores daily.

### Step 3: UI Implementation
- [ ] Create `src/public/Recruiter_Retention_Dashboard.html`.
- [ ] Implement visualizations (using Chart.js or simple CSS bars) for:
    -   Retention Risk Distribution (Pie Chart).
    -   Top Risk Factors (Bar Chart).

### Step 4: Verification
- [ ] **Manual Test**: Log in as detailed recruiter, view dashboard.
- [ ] **Data Validation**: Ensure high safety incidents trigger "High Risk" alert.

## 5. Verification Plan

### Automated Tests
*   We will rely on manual verification as this is a UI-heavy feature with new data structures.

### Manual Verification
1.  **Seed Data**: Run a script to generate 10 drivers with varying performance stats.
2.  **View Dashboard**: Open `Recruiter_Retention_Dashboard.html` via the Wix Editor "Preview" or standardized test harness.
3.  **Check Predictions**:
    *   Find a driver with "Safety Incidents > 2".
    *   Verify they appear in the "High Risk" list.
    *   Verify the "Primary Factor" cites "Safety Concerns".
