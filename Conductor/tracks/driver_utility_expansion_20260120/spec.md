# Specification: Driver Utility Expansion

## 1. Overview

This track expands the utility of existing driver features to increase daily platform engagement. Rather than building entirely new systems, we leverage existing data, services, and UI patterns to deliver high-value features with minimal development overhead.

### 1.1 Core Features

| Feature | Description | Leverages |
|---------|-------------|-----------|
| **Profile Strength Meter** | Shows drivers how to improve their profile for better matches | `scoring.js` weights (inverted) |
| **Quick Response Templates** | Pre-built message templates for common driver responses | `messaging.jsw` |
| **Reverse Alerts** | Notifications when matched carriers improve | `CarrierEnrichments`, `DriverCarrierInterests` |
| **Insights Panel** | Recommendation engine based on successful matches | `MatchEvents`, `DriverCarrierInterests` |

### 1.2 Business Goals

- Increase driver daily active usage by 40%
- Reduce profile abandonment by 25%
- Increase message response rate by 60%
- Drive profile completion from avg 45% to 75%

---

## 2. Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                           DRIVER UTILITY EXPANSION                                 |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|   +-------------------------+    +-------------------------+                       |
|   |   Profile Strength      |    |   Quick Response        |                       |
|   |   Meter                 |    |   Templates             |                       |
|   +-------------------------+    +-------------------------+                       |
|            |                              |                                        |
|            v                              v                                        |
|   +-------------------------+    +-------------------------+                       |
|   | profileStrengthService  |    | messageTemplateService  |                       |
|   | (NEW - backend)         |    | (NEW - backend)         |                       |
|   +-------------------------+    +-------------------------+                       |
|            |                              |                                        |
|            v                              v                                        |
|   +-------------------------+    +-------------------------+                       |
|   | scoring.js              |    | messaging.jsw           |                       |
|   | (EXISTING - weights)    |    | (EXISTING - extend)     |                       |
|   +-------------------------+    +-------------------------+                       |
|                                                                                    |
|   +-------------------------+    +-------------------------+                       |
|   |   Reverse Alerts        |    |   Insights Panel        |                       |
|   +-------------------------+    +-------------------------+                       |
|            |                              |                                        |
|            v                              v                                        |
|   +-------------------------+    +-------------------------+                       |
|   | carrierAlertService     |    | driverInsightsService   |                       |
|   | (NEW - backend)         |    | (NEW - backend)         |                       |
|   +-------------------------+    +-------------------------+                       |
|            |                              |                                        |
|            v                              v                                        |
|   +-------------------------+    +-------------------------+                       |
|   | CarrierEnrichments      |    | MatchEvents             |                       |
|   | DriverCarrierInterests  |    | DriverCarrierInterests  |                       |
|   | (EXISTING - collections)|    | (EXISTING - collections)|                       |
|   +-------------------------+    +-------------------------+                       |
|                                                                                    |
+-----------------------------------------------------------------------------------+
```

---

## 3. Feature 1: Profile Strength Meter

### 3.1 Concept

Inverts the carrier matching algorithm weights to show drivers which profile improvements would yield the most additional carrier matches.

### 3.2 Weight Inversion Logic

Current `scoring.js` weights determine match quality:

```javascript
// From scoring.js CONFIG.weights
weights: {
  location: 25,      // Driver's home ZIP proximity
  pay: 20,           // Pay expectation vs carrier CPM
  operationType: 15, // OTR/Regional/Local preference
  turnover: 12,      // Carrier stability preference
  safety: 10,        // Safety record importance
  truckAge: 8,       // Equipment age preference
  fleetSize: 5,      // Company size preference
  qualityScore: 5    // Overall carrier quality
}
```

**Inversion for Profile Strength:**

| Weight Category | Driver Action | Impact Message |
|-----------------|---------------|----------------|
| location (25) | Add home ZIP | "Match 25% more carriers in your area" |
| pay (20) | Set pay expectation | "See carriers that meet your salary needs" |
| operationType (15) | Select route type | "Find carriers matching your OTR/Regional/Local preference" |
| endorsements (N/A) | Add HazMat/Tanker/Doubles | "Match 40% more specialized carriers" |
| experience (N/A) | Add years of experience | "Unlock carriers requiring 3+ years" |
| cdl_class (N/A) | Verify CDL class | "Match Class A/B specific positions" |

### 3.3 Architecture

```
+------------------------------------------------------------------+
|                    PROFILE STRENGTH METER                         |
+------------------------------------------------------------------+
|                                                                   |
|   DRIVER_DASHBOARD.html                                           |
|   +-----------------------------------------------------------+   |
|   |  Profile Strength: [=========>     ] 67%                  |   |
|   |                                                           |   |
|   |  +-- Suggested Improvements --------------------------+   |   |
|   |  |                                                    |   |   |
|   |  |  [+15%] Add HazMat endorsement                     |   |   |
|   |  |         Match 40% more hazmat carriers             |   |   |
|   |  |         [Add Now]                                  |   |   |
|   |  |                                                    |   |   |
|   |  |  [+10%] Set pay expectation                        |   |   |
|   |  |         Filter carriers by your salary needs       |   |   |
|   |  |         [Add Now]                                  |   |   |
|   |  |                                                    |   |   |
|   |  |  [+8%]  Add years of experience                    |   |   |
|   |  |         Unlock experienced-driver positions        |   |   |
|   |  |         [Add Now]                                  |   |   |
|   |  +----------------------------------------------------+   |   |
|   +-----------------------------------------------------------+   |
|                                                                   |
|   Backend: profileStrengthService.jsw                             |
|   +-----------------------------------------------------------+   |
|   |  calculateProfileStrength(driverId)                       |   |
|   |  -> returns { score, improvements: [{field, impact, msg}] }   |
|   +-----------------------------------------------------------+   |
|                                                                   |
+------------------------------------------------------------------+
```

### 3.4 Data Model

**DriverProfiles Collection (Extend)**

| Field | Type | Description |
|-------|------|-------------|
| `profile_strength_score` | Number | Calculated strength (0-100) |
| `strength_calculated_at` | DateTime | When score was last calculated |
| `missing_high_impact` | Array[String] | Fields with highest match potential |

### 3.5 API Design

```javascript
// profileStrengthService.jsw

/**
 * Calculates profile strength and improvement suggestions
 * @returns {Object} { score, improvements, carrierMatchPotential }
 */
export async function calculateProfileStrength(driverId) {
  // 1. Get driver profile
  // 2. Check which fields are populated
  // 3. Map missing fields to scoring weights
  // 4. Calculate potential match improvement
  // 5. Return ranked improvement suggestions
}

/**
 * Gets carriers that would match if driver added specific field
 * @param {string} driverId
 * @param {string} field - The field to simulate adding
 * @returns {Object} { additionalMatchCount, sampleCarriers }
 */
export async function simulateProfileImprovement(driverId, field) {
  // Run matching with simulated profile data
  // Return delta of matches
}
```

### 3.6 Improvement Mapping

```javascript
const IMPROVEMENT_MAPPING = {
  home_zip: {
    weight: 25,
    displayName: "Home ZIP Code",
    impact: "Match carriers in your area",
    category: "location"
  },
  pay_expectation: {
    weight: 20,
    displayName: "Pay Expectation",
    impact: "Filter carriers by salary",
    category: "compensation"
  },
  operation_type: {
    weight: 15,
    displayName: "Route Preference",
    impact: "Find OTR/Regional/Local matches",
    category: "preferences"
  },
  hazmat_endorsement: {
    weight: 12,
    displayName: "HazMat Endorsement",
    impact: "Unlock hazmat carrier positions",
    category: "qualifications"
  },
  tanker_endorsement: {
    weight: 10,
    displayName: "Tanker Endorsement",
    impact: "Match tanker carriers",
    category: "qualifications"
  },
  doubles_endorsement: {
    weight: 8,
    displayName: "Doubles/Triples",
    impact: "Access specialized freight",
    category: "qualifications"
  },
  years_experience: {
    weight: 10,
    displayName: "Years of Experience",
    impact: "Qualify for experienced positions",
    category: "experience"
  },
  cdl_class: {
    weight: 15,
    displayName: "CDL Class Verification",
    impact: "Match class-specific jobs",
    category: "qualifications"
  }
};
```

---

## 4. Feature 2: Quick Response Templates

### 4.1 Concept

Pre-built message templates that drivers can send with one click, reducing friction in recruiter communication and increasing response rates.

### 4.2 Template Categories

```
+------------------------------------------------------------------+
|                    QUICK RESPONSE TEMPLATES                       |
+------------------------------------------------------------------+
|                                                                   |
|   CATEGORY: Interest                                              |
|   +-----------------------------------------------------------+   |
|   |  [Interested] - "I'm interested in this opportunity.      |   |
|   |                  When can we discuss details?"            |   |
|   |                                                           |   |
|   |  [Very Interested] - "This looks like a great fit!        |   |
|   |                       I'm available to start {DATE}.      |   |
|   |                       Please contact me at your earliest  |   |
|   |                       convenience."                       |   |
|   +-----------------------------------------------------------+   |
|                                                                   |
|   CATEGORY: Need More Info                                        |
|   +-----------------------------------------------------------+   |
|   |  [Questions] - "I have a few questions before applying:   |   |
|   |                 1. What is the home time policy?          |   |
|   |                 2. What equipment do you run?             |   |
|   |                 3. Is there a sign-on bonus?"             |   |
|   |                                                           |   |
|   |  [Pay Details] - "Could you provide more details about    |   |
|   |                   the pay structure? I'm looking for      |   |
|   |                   transparency on CPM, bonuses, and       |   |
|   |                   benefits."                              |   |
|   +-----------------------------------------------------------+   |
|                                                                   |
|   CATEGORY: Availability                                          |
|   +-----------------------------------------------------------+   |
|   |  [Not Available Now] - "Thank you for reaching out.       |   |
|   |                         I'm not available until {DATE}.   |   |
|   |                         Can we reconnect then?"           |   |
|   |                                                           |   |
|   |  [Currently Employed] - "I'm currently with another       |   |
|   |                          carrier but may be open to       |   |
|   |                          opportunities in {TIMEFRAME}."   |   |
|   +-----------------------------------------------------------+   |
|                                                                   |
|   CATEGORY: Decline                                               |
|   +-----------------------------------------------------------+   |
|   |  [Polite Decline] - "Thank you for the opportunity, but   |   |
|   |                      this position isn't the right fit    |   |
|   |                      for me at this time."                |   |
|   |                                                           |   |
|   |  [Location Decline] - "Unfortunately, the location/       |   |
|   |                        route doesn't work with my         |   |
|   |                        current home situation."           |   |
|   +-----------------------------------------------------------+   |
|                                                                   |
+------------------------------------------------------------------+
```

### 4.3 Architecture

```
+------------------------------------------------------------------+
|                  QUICK RESPONSE FLOW                              |
+------------------------------------------------------------------+
|                                                                   |
|   1. Driver opens conversation                                    |
|      +--------------------------------------------------+         |
|      |  Conversation with ABC Trucking                  |         |
|      |  ------------------------------------------------|         |
|      |  Recruiter: "We have an opening for..."          |         |
|      |                                                  |         |
|      |  [Type message...]          [Quick Reply v]      |         |
|      +--------------------------------------------------+         |
|                                       |                           |
|   2. Driver clicks Quick Reply        v                           |
|      +--------------------------------------------------+         |
|      |  Select a quick response:                        |         |
|      |  +--------------------------------------------+  |         |
|      |  |  Interested                                |  |         |
|      |  |  > I'm interested in this opportunity     |  |         |
|      |  +--------------------------------------------+  |         |
|      |  |  Need More Info                            |  |         |
|      |  |  > I have a few questions...              |  |         |
|      |  +--------------------------------------------+  |         |
|      |  |  Not Available Until...                    |  |         |
|      |  |  > I'm not available until [date picker]  |  |         |
|      |  +--------------------------------------------+  |         |
|      +--------------------------------------------------+         |
|                                       |                           |
|   3. Template inserted into message   v                           |
|      +--------------------------------------------------+         |
|      |  [I'm interested in this opportunity. When can   |         |
|      |   we discuss details?]                           |         |
|      |                                                  |         |
|      |                     [Edit] [Send]                |         |
|      +--------------------------------------------------+         |
|                                                                   |
+------------------------------------------------------------------+
```

### 4.4 Data Model

**MessageTemplates Collection (New)**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `category` | String | Template category (interest, info, availability, decline) |
| `name` | String | Short display name |
| `template_text` | String | Full template text with {PLACEHOLDERS} |
| `placeholders` | Array[Object] | `[{key: "DATE", type: "date", label: "Start Date"}]` |
| `usage_count` | Number | Times this template was used |
| `is_system` | Boolean | System-provided vs user-created |
| `created_by` | String | User ID if custom template |
| `sort_order` | Number | Display order within category |

**DriverTemplatePreferences Collection (New)**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `driver_id` | String | FK to DriverProfiles |
| `favorite_templates` | Array[String] | Template IDs driver uses most |
| `custom_templates` | Array[Object] | Driver's custom templates |
| `last_used` | Object | `{templateId: timestamp}` |

### 4.5 API Design

```javascript
// messageTemplateService.jsw

/**
 * Gets available templates, sorted by driver's usage
 * @returns {Object} { categories: [{name, templates}], favorites }
 */
export async function getTemplatesForDriver(driverId) {
  // 1. Get system templates
  // 2. Get driver's custom templates
  // 3. Sort by usage frequency
  // 4. Return categorized list
}

/**
 * Processes template with placeholder substitution
 * @param {string} templateId
 * @param {Object} values - {DATE: "2026-02-01", TIMEFRAME: "30 days"}
 * @returns {string} Processed message text
 */
export async function processTemplate(templateId, values) {
  // Replace {PLACEHOLDERS} with actual values
}

/**
 * Creates a custom template for the driver
 * @param {string} driverId
 * @param {Object} template - {name, text, category}
 * @returns {Object} Created template
 */
export async function createCustomTemplate(driverId, template) {
  // Save custom template
  // Validate text length and content
}

/**
 * Records template usage for analytics
 */
export async function recordTemplateUsage(driverId, templateId) {
  // Increment usage count
  // Update driver's last_used
}
```

### 4.6 Default System Templates

```javascript
const SYSTEM_TEMPLATES = [
  // Interest
  {
    category: "interest",
    name: "Interested",
    template_text: "I'm interested in this opportunity. When can we discuss details?",
    placeholders: [],
    sort_order: 1
  },
  {
    category: "interest",
    name: "Very Interested",
    template_text: "This looks like a great fit! I'm available to start {START_DATE}. Please contact me at your earliest convenience.",
    placeholders: [{key: "START_DATE", type: "date", label: "Available Start Date"}],
    sort_order: 2
  },

  // Need More Info
  {
    category: "info",
    name: "General Questions",
    template_text: "I have a few questions before applying:\n1. What is the home time policy?\n2. What equipment do you run?\n3. Is there a sign-on bonus?",
    placeholders: [],
    sort_order: 1
  },
  {
    category: "info",
    name: "Pay Details",
    template_text: "Could you provide more details about the pay structure? I'm looking for transparency on CPM, bonuses, and benefits.",
    placeholders: [],
    sort_order: 2
  },

  // Availability
  {
    category: "availability",
    name: "Not Available Until",
    template_text: "Thank you for reaching out. I'm not available until {AVAILABLE_DATE}. Can we reconnect then?",
    placeholders: [{key: "AVAILABLE_DATE", type: "date", label: "Date Available"}],
    sort_order: 1
  },
  {
    category: "availability",
    name: "Currently Employed",
    template_text: "I'm currently with another carrier but may be open to opportunities in {TIMEFRAME}. Please keep me in mind.",
    placeholders: [{key: "TIMEFRAME", type: "text", label: "Timeframe (e.g., '30 days')"}],
    sort_order: 2
  },

  // Decline
  {
    category: "decline",
    name: "Polite Decline",
    template_text: "Thank you for the opportunity, but this position isn't the right fit for me at this time.",
    placeholders: [],
    sort_order: 1
  },
  {
    category: "decline",
    name: "Location/Route Issue",
    template_text: "Unfortunately, the location/route doesn't work with my current home situation. Best of luck in your search.",
    placeholders: [],
    sort_order: 2
  }
];
```

---

## 5. Feature 3: Reverse Alerts

### 5.1 Concept

Notify drivers when a carrier they previously matched with or applied to has improved their offering (safety upgrade, pay increase, better equipment, etc.).

### 5.2 Trigger Events

```
+------------------------------------------------------------------+
|                    REVERSE ALERT TRIGGERS                         |
+------------------------------------------------------------------+
|                                                                   |
|   CARRIER IMPROVEMENT EVENTS:                                     |
|   +-----------------------------------------------------------+   |
|   |  EVENT                    | ALERT MESSAGE                 |   |
|   |---------------------------|-------------------------------|   |
|   |  Safety score improved    | "ABC Trucking improved their  |   |
|   |                           |  safety score from 72 to 85"  |   |
|   |---------------------------|-------------------------------|   |
|   |  Pay increased            | "XYZ Freight raised CPM from  |   |
|   |                           |  $0.52 to $0.58"              |   |
|   |---------------------------|-------------------------------|   |
|   |  Fleet upgraded           | "123 Transport now running    |   |
|   |                           |  2024 Freightliners"          |   |
|   |---------------------------|-------------------------------|   |
|   |  Driver sentiment up      | "Drivers are saying good      |   |
|   |                           |  things about Quick Haul"     |   |
|   |---------------------------|-------------------------------|   |
|   |  Hiring bonus added       | "Fast Trucking now offering   |   |
|   |                           |  $5,000 sign-on bonus"        |   |
|   +-----------------------------------------------------------+   |
|                                                                   |
+------------------------------------------------------------------+
```

### 5.3 Architecture

```
+------------------------------------------------------------------+
|                    REVERSE ALERTS FLOW                            |
+------------------------------------------------------------------+
|                                                                   |
|   1. Carrier Enrichment Updated (scheduled or triggered)          |
|      +--------------------------------------------------+         |
|      |  CarrierEnrichments                              |         |
|      |  - DOT: 4028497                                  |         |
|      |  - safety_score: 72 -> 85  (CHANGED)             |         |
|      |  - pay_cpm: 0.52 -> 0.58   (CHANGED)             |         |
|      +--------------------------------------------------+         |
|                            |                                      |
|   2. Change Detection      v                                      |
|      +--------------------------------------------------+         |
|      |  carrierAlertService.detectImprovements()        |         |
|      |  - Compare new enrichment to previous            |         |
|      |  - Filter for positive changes only              |         |
|      |  - Calculate significance score                  |         |
|      +--------------------------------------------------+         |
|                            |                                      |
|   3. Find Affected Drivers v                                      |
|      +--------------------------------------------------+         |
|      |  DriverCarrierInterests                          |         |
|      |  - Find drivers who matched/applied to this DOT  |         |
|      |  - Filter by interest status (not rejected)      |         |
|      |  - Check driver notification preferences         |         |
|      +--------------------------------------------------+         |
|                            |                                      |
|   4. Generate Alerts       v                                      |
|      +--------------------------------------------------+         |
|      |  MemberNotifications                             |         |
|      |  - type: "carrier_improvement"                   |         |
|      |  - carrier_dot: 4028497                          |         |
|      |  - improvements: ["safety_up", "pay_up"]         |         |
|      |  - message: "ABC Trucking made improvements..."  |         |
|      +--------------------------------------------------+         |
|                            |                                      |
|   5. Driver Notification   v                                      |
|      +--------------------------------------------------+         |
|      |  DRIVER_DASHBOARD.html                           |         |
|      |  +--------------------------------------------+  |         |
|      |  |  [!] ABC Trucking improved!                |  |         |
|      |  |      Safety: 72 -> 85 | Pay: +$0.06 CPM   |  |         |
|      |  |      [View Carrier] [Dismiss]              |  |         |
|      |  +--------------------------------------------+  |         |
|      +--------------------------------------------------+         |
|                                                                   |
+------------------------------------------------------------------+
```

### 5.4 Data Model

**CarrierImprovementHistory Collection (New)**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `carrier_dot` | String | DOT number |
| `field_changed` | String | Field that improved |
| `old_value` | Any | Previous value |
| `new_value` | Any | New value |
| `improvement_type` | String | safety_up, pay_up, fleet_up, sentiment_up, bonus_added |
| `significance_score` | Number | How significant (0-100) |
| `detected_at` | DateTime | When change was detected |
| `enrichment_id` | String | FK to CarrierEnrichments |

**MemberNotifications Collection (Extend)**

| Field | Type | Description |
|-------|------|-------------|
| `notification_type` | String | Add: "carrier_improvement" |
| `carrier_dot` | String | Related carrier |
| `improvements` | Array[Object] | `[{type, old, new, message}]` |
| `cta_action` | String | "view_carrier", "reapply", "compare" |

### 5.5 API Design

```javascript
// carrierAlertService.jsw

/**
 * Detects improvements from new enrichment data
 * Called after carrier enrichment is updated
 * @param {string} carrierDot
 * @param {Object} newEnrichment
 * @param {Object} oldEnrichment
 * @returns {Array} List of detected improvements
 */
export async function detectImprovements(carrierDot, newEnrichment, oldEnrichment) {
  const improvements = [];

  // Safety improvement
  if (newEnrichment.safety_score > oldEnrichment.safety_score) {
    improvements.push({
      type: 'safety_up',
      old: oldEnrichment.safety_score,
      new: newEnrichment.safety_score,
      significance: calculateSignificance('safety', oldEnrichment.safety_score, newEnrichment.safety_score),
      message: `Safety score improved from ${oldEnrichment.safety_score} to ${newEnrichment.safety_score}`
    });
  }

  // Pay improvement
  if (newEnrichment.pay_cpm > oldEnrichment.pay_cpm) {
    improvements.push({
      type: 'pay_up',
      old: oldEnrichment.pay_cpm,
      new: newEnrichment.pay_cpm,
      significance: calculateSignificance('pay', oldEnrichment.pay_cpm, newEnrichment.pay_cpm),
      message: `Pay increased from $${oldEnrichment.pay_cpm} to $${newEnrichment.pay_cpm} CPM`
    });
  }

  // ... additional improvement checks

  return improvements;
}

/**
 * Generates alerts for all affected drivers
 * @param {string} carrierDot
 * @param {Array} improvements
 * @returns {Object} { alertsSent, driversNotified }
 */
export async function generateDriverAlerts(carrierDot, improvements) {
  // 1. Find all drivers with interests in this carrier
  // 2. Filter by notification preferences
  // 3. Create MemberNotification for each
  // 4. Optionally send email digest
}

/**
 * Gets improvement alerts for a specific driver
 * @param {string} driverId
 * @returns {Array} Recent carrier improvement alerts
 */
export async function getDriverAlerts(driverId) {
  // Query MemberNotifications for carrier_improvement type
}
```

### 5.6 Improvement Detection Thresholds

```javascript
const IMPROVEMENT_THRESHOLDS = {
  safety_score: {
    min_change: 5,          // Minimum 5-point improvement to alert
    high_significance: 15   // 15+ points = high significance
  },
  pay_cpm: {
    min_change: 0.03,       // Minimum $0.03 CPM increase
    high_significance: 0.08 // $0.08+ = high significance
  },
  avg_truck_age: {
    min_change: -1,         // 1 year newer (negative = improvement)
    high_significance: -3   // 3+ years newer
  },
  turnover_percent: {
    min_change: -10,        // 10% reduction in turnover
    high_significance: -25  // 25%+ reduction
  },
  sign_on_bonus: {
    min_change: 1000,       // New or $1000+ increase
    high_significance: 3000 // $3000+ = high significance
  }
};
```

---

## 6. Feature 4: Insights Panel

### 6.1 Concept

A recommendation engine that analyzes successful matches across the platform to provide drivers with actionable insights.

### 6.2 Insight Types

```
+------------------------------------------------------------------+
|                    DRIVER INSIGHTS PANEL                          |
+------------------------------------------------------------------+
|                                                                   |
|   Based on Your Profile & Similar Drivers:                        |
|   +-----------------------------------------------------------+   |
|   |                                                           |   |
|   |  [ENDORSEMENT INSIGHT]                                    |   |
|   |  Drivers similar to you who added HazMat endorsement      |   |
|   |  matched with 40% more carriers.                          |   |
|   |  [Add HazMat to Profile]                                  |   |
|   |                                                           |   |
|   +-----------------------------------------------------------+   |
|   |                                                           |   |
|   |  [CARRIER INSIGHT]                                        |   |
|   |  Carriers you applied to also hired drivers with          |   |
|   |  Tanker endorsement. Consider getting certified.          |   |
|   |  [Learn More]                                             |   |
|   |                                                           |   |
|   +-----------------------------------------------------------+   |
|   |                                                           |   |
|   |  [TIMING INSIGHT]                                         |   |
|   |  Drivers who applied to 3+ carriers in your area          |   |
|   |  got hired 2x faster than those who applied to 1.         |   |
|   |  [View More Carriers]                                     |   |
|   |                                                           |   |
|   +-----------------------------------------------------------+   |
|   |                                                           |   |
|   |  [SALARY INSIGHT]                                         |   |
|   |  Your pay expectation ($0.50 CPM) is below the regional   |   |
|   |  average ($0.56 CPM). Consider adjusting.                 |   |
|   |  [Update Pay Expectation]                                 |   |
|   |                                                           |   |
|   +-----------------------------------------------------------+   |
|                                                                   |
+------------------------------------------------------------------+
```

### 6.3 Architecture

```
+------------------------------------------------------------------+
|                    INSIGHTS ENGINE FLOW                           |
+------------------------------------------------------------------+
|                                                                   |
|   1. Data Collection (Scheduled Job)                              |
|      +--------------------------------------------------+         |
|      |  DriverCarrierInterests (status = 'hired')       |         |
|      |  MatchEvents (all matches)                       |         |
|      |  DriverProfiles (all attributes)                 |         |
|      +--------------------------------------------------+         |
|                            |                                      |
|   2. Pattern Analysis      v                                      |
|      +--------------------------------------------------+         |
|      |  driverInsightsService.analyzePatterns()         |         |
|      |  - Group successful hires by driver attributes   |         |
|      |  - Identify common traits of hired drivers       |         |
|      |  - Calculate endorsement impact on match rate    |         |
|      |  - Analyze timing patterns                       |         |
|      +--------------------------------------------------+         |
|                            |                                      |
|   3. Store Aggregates      v                                      |
|      +--------------------------------------------------+         |
|      |  InsightAggregates Collection                    |         |
|      |  - insight_type: "endorsement_impact"            |         |
|      |  - data: {hazmat: +40%, tanker: +25%}            |         |
|      |  - region: "TX"                                  |         |
|      |  - calculated_at: timestamp                      |         |
|      +--------------------------------------------------+         |
|                            |                                      |
|   4. Generate Insights     v                                      |
|      +--------------------------------------------------+         |
|      |  driverInsightsService.generateForDriver(id)     |         |
|      |  - Compare driver profile to successful patterns |         |
|      |  - Identify gaps and opportunities               |         |
|      |  - Rank by potential impact                      |         |
|      +--------------------------------------------------+         |
|                            |                                      |
|   5. Display in Dashboard  v                                      |
|      +--------------------------------------------------+         |
|      |  DRIVER_DASHBOARD.html - Insights Panel          |         |
|      |  - Personalized recommendations                  |         |
|      |  - Clear CTAs for each insight                   |         |
|      |  - Dismissible / "Don't show again"              |         |
|      +--------------------------------------------------+         |
|                                                                   |
+------------------------------------------------------------------+
```

### 6.4 Data Model

**InsightAggregates Collection (New)**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `insight_type` | String | endorsement_impact, timing_pattern, salary_benchmark, carrier_preference |
| `region` | String | Geographic region (state or zip prefix) |
| `operation_type` | String | OTR, Regional, Local, or "all" |
| `data` | Object | Aggregated data specific to insight type |
| `sample_size` | Number | Number of records used |
| `calculated_at` | DateTime | When aggregate was computed |
| `confidence` | Number | Statistical confidence (0-100) |

**DriverInsights Collection (New)**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `driver_id` | String | FK to DriverProfiles |
| `insight_type` | String | Type of insight |
| `message` | String | Human-readable insight |
| `data` | Object | Supporting data |
| `cta_action` | String | Recommended action |
| `cta_url` | String | Link for CTA button |
| `priority` | Number | Display priority (1=highest) |
| `is_dismissed` | Boolean | Driver dismissed this insight |
| `generated_at` | DateTime | When insight was generated |
| `expires_at` | DateTime | When insight becomes stale |

### 6.5 API Design

```javascript
// driverInsightsService.jsw

/**
 * Analyzes platform-wide patterns (scheduled job)
 * Updates InsightAggregates collection
 */
export async function analyzePatterns() {
  // Endorsement impact analysis
  const endorsementImpact = await analyzeEndorsementImpact();

  // Timing pattern analysis
  const timingPatterns = await analyzeTimingPatterns();

  // Salary benchmarks
  const salaryBenchmarks = await analyzeSalaryBenchmarks();

  // Store aggregates
  await updateAggregates([endorsementImpact, timingPatterns, salaryBenchmarks]);
}

/**
 * Generates personalized insights for a driver
 * @param {string} driverId
 * @returns {Array} Ranked list of insights
 */
export async function generateInsightsForDriver(driverId) {
  // 1. Get driver profile
  // 2. Get relevant aggregates for driver's region/preferences
  // 3. Compare driver to successful patterns
  // 4. Generate insights with clear CTAs
  // 5. Filter out dismissed insights
  // 6. Return ranked by priority
}

/**
 * Gets active insights for driver dashboard
 * @param {string} driverId
 * @param {number} limit
 * @returns {Array} Top insights to display
 */
export async function getDriverInsights(driverId, limit = 5) {
  // Query DriverInsights, filter dismissed, sort by priority
}

/**
 * Dismisses an insight for a driver
 * @param {string} driverId
 * @param {string} insightId
 */
export async function dismissInsight(driverId, insightId) {
  // Mark insight as dismissed
}
```

### 6.6 Insight Generation Rules

```javascript
const INSIGHT_RULES = {
  endorsement_gap: {
    condition: (driver, aggregates) => {
      // Driver missing endorsement that boosts match rate significantly
      return !driver.endorsements?.includes('hazmat')
        && aggregates.endorsement_impact.hazmat > 30;
    },
    generate: (driver, aggregates) => ({
      type: 'endorsement_gap',
      message: `Drivers similar to you who added HazMat endorsement matched with ${aggregates.endorsement_impact.hazmat}% more carriers.`,
      cta: 'Add HazMat to Profile',
      priority: 1
    })
  },

  salary_below_market: {
    condition: (driver, aggregates) => {
      // Driver pay expectation below regional average
      const regionalAvg = aggregates.salary_benchmarks[driver.region]?.avg || 0.55;
      return driver.pay_expectation < regionalAvg * 0.9;
    },
    generate: (driver, aggregates) => ({
      type: 'salary_below_market',
      message: `Your pay expectation ($${driver.pay_expectation} CPM) is below the regional average ($${aggregates.salary_benchmarks[driver.region].avg} CPM).`,
      cta: 'Update Pay Expectation',
      priority: 2
    })
  },

  application_volume: {
    condition: (driver, aggregates) => {
      // Driver applied to fewer carriers than successful hires
      const optimalApps = aggregates.timing_patterns.optimal_applications || 3;
      return driver.application_count < optimalApps;
    },
    generate: (driver, aggregates) => ({
      type: 'application_volume',
      message: `Drivers who applied to ${aggregates.timing_patterns.optimal_applications}+ carriers got hired 2x faster.`,
      cta: 'View More Carriers',
      priority: 3
    })
  }
};
```

---

## 7. UI Mockups

### 7.1 Profile Strength Meter (Dashboard Widget)

```
+------------------------------------------------------------------+
|  YOUR PROFILE STRENGTH                                            |
+------------------------------------------------------------------+
|                                                                   |
|  [====================               ] 67%                        |
|                                                                   |
|  +-- Boost Your Matches -----------------------------------------+|
|  |                                                               ||
|  |  [+15%]  Add HazMat Endorsement            [Add Now ->]       ||
|  |          Match 40% more hazmat carriers                       ||
|  |                                                               ||
|  |  [+10%]  Set Pay Expectation               [Add Now ->]       ||
|  |          Filter carriers by your salary                       ||
|  |                                                               ||
|  |  [+8%]   Verify CDL Class                  [Add Now ->]       ||
|  |          Match class-specific positions                       ||
|  |                                                               ||
|  +---------------------------------------------------------------+|
|                                                                   |
|  Complete your profile to match with more carriers!               |
+------------------------------------------------------------------+
```

### 7.2 Quick Response (Messaging Panel)

```
+------------------------------------------------------------------+
|  Conversation with ABC Trucking                            [X]    |
+------------------------------------------------------------------+
|                                                                   |
|  +--------------------------------------------------------------+|
|  |  Recruiter (Jan 18, 10:30 AM)                                ||
|  |  "Hi! We have an opening for an experienced OTR driver.      ||
|  |   Would you be interested in learning more?"                  ||
|  +--------------------------------------------------------------+|
|                                                                   |
|  +--------------------------------------------------------------+|
|  |  Type your message...                                        ||
|  |                                                              ||
|  +--------------------------------------------------------------+|
|  |  [Quick Reply v]                          [Send]             ||
|  +--------------------------------------------------------------+|
|                                                                   |
|  +-- Quick Replies ----------------------------------------------+|
|  |                                                               ||
|  |  INTEREST                                                     ||
|  |  +-- [Interested] I'm interested in this opportunity...      ||
|  |  +-- [Very Interested] This looks like a great fit!...       ||
|  |                                                               ||
|  |  NEED MORE INFO                                               ||
|  |  +-- [Questions] I have a few questions...                   ||
|  |  +-- [Pay Details] Could you provide pay details?            ||
|  |                                                               ||
|  |  AVAILABILITY                                                 ||
|  |  +-- [Not Available] I'm not available until...              ||
|  |                                                               ||
|  |  DECLINE                                                      ||
|  |  +-- [Polite Decline] Thank you, but...                      ||
|  +---------------------------------------------------------------+|
+------------------------------------------------------------------+
```

### 7.3 Reverse Alert (Notification Card)

```
+------------------------------------------------------------------+
|  [!] CARRIER UPDATE                                   [X] Dismiss |
+------------------------------------------------------------------+
|                                                                   |
|  ABC Trucking improved!                                           |
|                                                                   |
|  +-- What Changed -----------------------------------------------+|
|  |                                                               ||
|  |  Safety Score:  72 --> 85  (+13 points)                       ||
|  |  Pay Rate:      $0.52 --> $0.58 CPM  (+$0.06)                 ||
|  |                                                               ||
|  +---------------------------------------------------------------+|
|                                                                   |
|  You matched with this carrier 2 weeks ago.                       |
|                                                                   |
|  [View Updated Carrier Profile]    [Re-Apply Now]                 |
+------------------------------------------------------------------+
```

### 7.4 Insights Panel (Dashboard Widget)

```
+------------------------------------------------------------------+
|  INSIGHTS FOR YOU                                                 |
+------------------------------------------------------------------+
|                                                                   |
|  +--------------------------------------------------------------+|
|  |  [LIGHTBULB] ENDORSEMENT OPPORTUNITY                         ||
|  |                                                              ||
|  |  Drivers like you who added Tanker endorsement matched       ||
|  |  with 35% more carriers in your region.                      ||
|  |                                                              ||
|  |                                   [Add to Profile ->]        ||
|  +--------------------------------------------------------------+|
|                                                                   |
|  +--------------------------------------------------------------+|
|  |  [CHART] SALARY INSIGHT                                      ||
|  |                                                              ||
|  |  Your pay expectation ($0.50) is 10% below the Texas         ||
|  |  regional average ($0.56).                                   ||
|  |                                                              ||
|  |                                   [Update Expectation ->]    ||
|  +--------------------------------------------------------------+|
|                                                                   |
|  +--------------------------------------------------------------+|
|  |  [TARGET] APPLICATION TIP                                    ||
|  |                                                              ||
|  |  You've applied to 1 carrier. Drivers who apply to 3+        ||
|  |  get hired 2x faster.                                        ||
|  |                                                              ||
|  |                                   [Find More Carriers ->]    ||
|  +--------------------------------------------------------------+|
|                                                                   |
+------------------------------------------------------------------+
```

---

## 8. Integration Points

### 8.1 Existing Services

| Service | Integration |
|---------|-------------|
| `scoring.js` | Invert weights for Profile Strength Meter |
| `messaging.jsw` | Extend with template selection |
| `aiEnrichment.jsw` | Trigger reverse alerts on enrichment update |
| `driverProfiles.jsw` | Calculate and store profile strength |
| `memberService.jsw` | Include insights in dashboard data |
| `scheduler.jsw` | Add insight aggregation job |

### 8.2 New Services

| Service | Purpose |
|---------|---------|
| `profileStrengthService.jsw` | Profile strength calculation and improvement suggestions |
| `messageTemplateService.jsw` | Quick response template management |
| `carrierAlertService.jsw` | Reverse alert detection and generation |
| `driverInsightsService.jsw` | Insight generation and aggregation |

### 8.3 Collection Dependencies

```
+------------------------------------------------------------------+
|  COLLECTION DEPENDENCIES                                          |
+------------------------------------------------------------------+
|                                                                   |
|  EXISTING COLLECTIONS:                                            |
|  - DriverProfiles (extend with strength fields)                   |
|  - DriverCarrierInterests (read for alerts/insights)              |
|  - CarrierEnrichments (trigger reverse alerts)                    |
|  - MemberNotifications (extend with carrier_improvement)          |
|  - MatchEvents (analyze for insights)                             |
|  - Messages (integrate templates)                                 |
|                                                                   |
|  NEW COLLECTIONS:                                                 |
|  - MessageTemplates (system + custom templates)                   |
|  - DriverTemplatePreferences (driver template usage)              |
|  - CarrierImprovementHistory (track carrier changes)              |
|  - InsightAggregates (platform-wide patterns)                     |
|  - DriverInsights (personalized insights per driver)              |
|                                                                   |
+------------------------------------------------------------------+
```

---

## 9. Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Profile completion rate | 45% | 75% | Avg profile_completeness_score |
| Daily active drivers | Baseline | +40% | Unique driver logins/day |
| Message response rate | ~30% | 60% | Messages replied / received |
| Profile update frequency | 1x/month | 2x/week | Profile edits per driver |
| Template usage rate | N/A | 40% | Messages using templates |
| Alert engagement | N/A | 50% | Alerts clicked / shown |
| Insight action rate | N/A | 25% | Insights actioned / shown |

---

## 10. Open Questions

1. **Privacy**: Should drivers be able to see which carriers viewed their improved profile?
2. **Notification Frequency**: How often should we send reverse alerts? Daily digest vs. real-time?
3. **Custom Templates**: Should drivers be able to share their custom templates with others?
4. **Gamification**: Should profile strength improvements unlock badges/achievements?
5. **A/B Testing**: Should we test different insight phrasings for engagement optimization?
