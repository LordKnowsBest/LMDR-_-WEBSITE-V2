# Specification: Driver Lifecycle & Disposition Intelligence

## 1. Context & Business Value
Currently, the platform excels at *making* matches but lacks structured data on *why* matches fail or succeed long-term.
This track introduces "The Closing Loop": a dedicated system to monitor the driver's lifecycle (from "Hired" to "Retired") and, critically, capture granular **disposition reasons** upon termination.

**Primary Goal:** Transform "failed hires" into "training data" for the matching algorithms.
**Secondary Goal:** Provide carriers with a "Truth Source" for their turnover rates, specifically distinguishing "Early Churn" (<30 days) from natural turnover.
**Tertiary Goal:** Empower drivers to own their career narrative by tracking *their* reasons for leaving, ensuring the platform learns from both sides of the match.

## 2. User Stories

### 2.1 The Recruiter / Fleet Manager
*   "When I terminate a driver, I want to select a specific reason (e.g., 'Equipment Mismatch', 'Pay Expectations not Met') so that I can track my fleet's pain points."
*   "I want to see a visual timeline of a driver's tenure, showing key touchpoints (Application -> Interview -> Orientation -> First Load -> 30-Day Check-in)."
*   "If a driver quits in the first 30 days, I want the system to flag this as a 'Bad Match' and adjust future candidate scoring."

### 2.2 The Driver (Enhanced)
*   "If I decide to leave a carrier, I want to log my own reason (e.g., 'Dispatcher disrespect', 'Miles promised not delivered') so the system stops matching me with similar companies."
*   "I want to see a record of my communications and reasons for leaving previous jobs, serving as a personal career ledger."
*   "I want to be able to answer quick pulse surveys during my first month so I can flag issues before I quit."

### 2.3 The Platform (AI & Recursive Training)
*   "When a driver is terminated for 'Home Time', I need to lower the weight of 'Pay' and increase the weight of 'Home Time' preferences for this driver's future matches."
*   "I need to ingest data from both the Recruiter's termination log AND the Driver's exit survey to build a 'Consensus Truth' for training models."
*   "I need to launch automated surveys at key milestones (Orientation, Week 1, Day 30) to capture sentiment *before* termination occurs."

## 3. Functional Requirements

### 3.1 Lifecycle Timeline
*   **Event Logging:** System must track discrete events:
    *   `APPLICATION_SUBMITTED`
    *   `INTERVIEW_COMPLETED`
    *   `HIRED_ACTIVE`
    *   `ORIENTATION_COMPLETE`
    *   `FIRST_DISPATCH`
    *   `30_DAY_MILESTONE` (System generated)
    *   `TERMINATED` / `RESIGNED`
*   **Visual Interface:** A horizontal or vertical timeline view in the Recruiter Portal AND Driver Dashboard.

### 3.2 Advanced Disposition (Termination) & Dual-Sided Feedback
*   **Standardized Codes:** No free text only. Must pick from categories:
    *   **Operations:** `NO_FREIGHT`, `EQUIPMENT_FAILURE`, `DISPATCH_CONFLICT`
    *   **Compensation:** `PAY_DISPUTE`, `MILES_TOO_LOW`
    *   **Personal:** `HOME_TIME`, `MEDICAL`, `FAMILY`
    *   **Compliance:** `FAILED_DRUG_TEST`, `SAFETY_VIOLATION`, `INSURANCE_REJECTION`
    *   **Culture:** `DISPATCHER_CONFLICT`, `COMPANY_CULTURE`
*   **Early Churn Flag:** Auto-calculate if tenure < 30 days.
*   **Conflict Resolution:** If Carrier says "Safety Violation" but Driver says "Equipment Failure", flag for review or weight both inputs in the model.

### 3.3 Automated Lifecycle Surveys
*   **Triggers:**
    *   **Orientation Day:** "Did the job description match reality?"
    *   **Day 7:** "How was your first dispatch?"
    *   **Day 30:** "Do you see yourself here in a year?"
*   **Delivery:** SMS or In-App Notification.
*   **Action:** Low scores trigger "Retention Risk" alerts to Recruiters.

### 3.4 The "Algorithm Feedback Loop" (Recursive Training)
*   **Feedback Mechanism:** Termination events AND Survey results must trigger a `RecalibrateProfile` action.
*   **Recursive Logic:**
    *   **Driver Model:** Adjusts individual driver preferences (e.g., "Hates Northeast").
    *   **Carrier Model:** Adjusts carrier "Ideal Candidate" profile (e.g., "Needs more experienced drivers").
    *   **Global Model:** Learns patterns (e.g., "Drivers with <6mo experience quit Carrier X 50% faster").

## 4. Technical Constraints
*   **Wix Collections:** New collections needed for `LifecycleEvents`, `TerminationLogs`, `Surveys`, `SurveyResponses`.
*   **Integration:** Must link tightly with `driverProfiles`, `carrierMatching`, and `messaging`.

## 5. Success Metrics
*   **Disposition Rate:** >90% of terminations have a coded reason.
*   **Survey Response Rate:** >40% for automated pulse surveys.
*   **Churn Reduction:** 15% reduction in <30 day turnover.
*   **Match Accuracy:** 20% reduction in "Repeat Failure" matches (same driver quitting for same reason).