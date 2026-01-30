# Implementation Plan: Driver Lifecycle & Disposition Intelligence

## 1. Goal Description
Build a "Black Box" for driver tenure—recording every meaningful event from hire to separation. Use this data to (1) visualize the driver's journey, (2) feed failure modes back into the matching engine, and (3) empower drivers with their own career data and voice.

## 2. Architecture & Data Model

### 2.1 New Wix Collections

#### `LifecycleEvents`
*   `_id`
*   `driverId` (Reference)
*   `carrierId` (Reference)
*   `eventType` (Enum: 'HIRE', 'ORIENTATION', 'DISPATCH', 'INCIDENT', 'TERMINATION', 'SURVEY_SENT', 'SURVEY_COMPLETED')
*   `eventDate` (Date)
*   `metadata` (Object: JSON blob for flexible context)
*   `createdBy` (UserId)

#### `TerminationLogs` (The "Black Box")
*   `driverId`
*   `carrierId`
*   `tenureDays` (Number: Calculated)
*   `isEarlyChurn` (Boolean: < 30 days)
*   `category` (Enum)
*   `reasonCode` (String)
*   `notes` (String)
*   `driverFeedback` (String: Optional from exit survey)
*   `source` (Enum: 'RECRUITER', 'DRIVER')
*   `rehireEligible` (Boolean)

#### `SurveyDefinitions` (New)
*   `triggerEvent` (Enum: 'ORIENTATION', 'DAY_7', 'DAY_30', 'EXIT')
*   `questions` (Array<Object>)
*   `isActive` (Boolean)

#### `SurveyResponses` (New)
*   `surveyId` (Reference)
*   `driverId` (Reference)
*   `carrierId` (Reference)
*   `scores` (Object: Key-Value pairs)
*   `comments` (String)

### 2.2 Backend Services

#### `src/backend/lifecycleService.jsw`
*   `logEvent(driverId, carrierId, type, data)`: Universal logger.
*   `getDriverTimeline(driverId)`: Fetches sorted events for UI.
*   `terminateDriver(driverId, reasonData, source)`: Handles termination from either side.

#### `src/backend/surveyService.jsw` (New)
*   `checkTriggers(driverId)`: Scheduled job to find drivers hitting milestones (Orientation, Day 7, etc.).
*   `sendSurvey(driverId, surveyType)`: Dispatches SMS/Email or In-App Notification.
*   `processResponse(response)`: Logs completion and triggers `feedbackLoopService`.

#### `src/backend/feedbackLoopService.jsw` (The Brain)
*   `analyzeTermination(terminationLog)`: Maps `reasonCode` to matching parameters.
*   `analyzeSurvey(response)`:
    *   Low Score -> Flags "Retention Risk" to Recruiter.
    *   High Score -> Boosts Carrier's "Driver Satisfaction" score.
*   `recursiveTraining(driverId, carrierId)`:
    *   Updates Driver Preferences (e.g., "Avoids NYC").
    *   Updates Carrier Profile (e.g., "High Churn for New Drivers").

### 2.3 Frontend Components

#### `Recruiter_Lifecycle_Monitor.html`
*   Timeline Visualization.
*   Action Panel: "Log Event", "Terminate".
*   Risk Alerts: Display survey flags (e.g., "Driver Unhappy - Day 7").

#### `Driver_My_Career.html` (New for Driver)
*   **My Journey:** Timeline of current and past jobs.
*   **Communication Log:** Track key messages/reasons.
*   **Feedback Portal:** "Update My Status" (Active/Resigned) & Exit Survey.
*   **Active Surveys:** "How is your first week?" cards.

#### `Termination_Wizard` (Shared Component)
*   Dual-mode: Recruiter View vs. Driver View.
*   Standardized Reason Codes.

## 3. Implementation Steps

### Phase 1: Foundation (Data & Basic Logging)
- [ ] Define `LifecycleEvents`, `TerminationLogs`, `SurveyDefinitions`, `SurveyResponses` schemas.
- [ ] Implement `lifecycleService.jsw` with basic CRUD.
- [ ] Create `logEvent` triggers on existing `HIRE` actions.

### Phase 2: The UI (Timeline & Disposition)
- [ ] Build `Recruiter_Lifecycle_Monitor.html` layout.
- [ ] Build `Driver_My_Career.html` for driver-side visibility.
- [ ] Create the **Termination Wizard** (Standardized Disposition).

### Phase 3: Survey Engine & Feedback Loop
- [ ] Implement `surveyService.jsw` (Triggers & Sending).
- [ ] Implement `feedbackLoopService.jsw` (Recursive Training Logic).
- [ ] create default `SurveyDefinitions` (Orientation, Day 7, Day 30, Exit).

### Phase 4: Integration
- [ ] Link "Terminate" button in `Driver Cockpit` to this new flow.
- [ ] Add "My Career" section to Driver Dashboard.
- [ ] Test the "Recursive Loop": Ensure a Driver Exit Survey updates the Matching Engine weights.

## 4. Verification Plan
*   **Scenario 1 (Pulse Check):** Hire driver -> Wait 7 days -> Verify Survey Sent -> Driver responds "Low Pay" -> Verify Risk Alert on Recruiter Dashboard.
*   **Scenario 2 (Dual Termination):**
    *   Recruiter logs "Terminated - Safety".
    *   Driver logs "Resigned - Unsafe Equipment".
    *   Verify both logs exist in `TerminationLogs`.
    *   Verify AI Engine receives both data points (Conflict Resolution logic).