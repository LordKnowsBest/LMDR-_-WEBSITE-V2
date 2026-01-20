# Specification: Cross-Role Utility - Feature Cross-Pollination

## 1. Overview

This track identifies features that exist for one role but would provide significant value to another role. By cross-pollinating features across drivers, carriers, and recruiters, we create network effects that increase platform stickiness and overall value.

### Business Value

| Feature | Source Role | Target Role | Value Proposition |
|---------|-------------|-------------|-------------------|
| Mutual Interest Indicator | Recruiter | Driver | Drivers see when carriers are interested back |
| Retention Dashboard | Recruiter | Carrier | Carriers directly access turnover risk insights |
| Match Explanation | Carrier | Driver | Drivers understand why they matched |
| System Health | Admin | Recruiter | Recruiters get API/enrichment status visibility |

### Platform Synergy Model

```
                            LMDR PLATFORM VALUE
                                    |
        +---------------------------+---------------------------+
        |                           |                           |
    [DRIVERS]                  [CARRIERS]                [RECRUITERS]
        |                           |                           |
        |<-- Mutual Interest        |<-- Retention Dashboard    |<-- System Health
        |<-- Match Explanation      |                           |
        |                           |                           |
        +---------------------------+---------------------------+
                                    |
                            NETWORK EFFECTS
                    (More value = more engagement)
```

---

## 2. Feature 1: Mutual Interest Indicator

### 2.1 Current State

```
DRIVER VIEW (AI_MATCHING.html)
+----------------------------------+
| Carrier: ABC Trucking            |
| Match Score: 92%                 |
| [View Details] [I'm Interested]  |
+----------------------------------+
        |
        | Driver clicks "I'm Interested"
        v
+----------------------------------+
| DriverCarrierInterests           |
| driver_id, carrier_dot, status   |
+----------------------------------+
        |
        | (Carrier never knows unless they search)
        v
RECRUITER VIEW (searches drivers)
+----------------------------------+
| Driver: John D.                  |
| isMutualMatch: true (+10 boost)  |
+----------------------------------+
```

**Problem**: Drivers don't know when carriers are also interested in THEM. The signal is one-way.

### 2.2 Desired State

```
+------------------------------------------------------------------------------+
|                        BIDIRECTIONAL INTEREST VISIBILITY                      |
+------------------------------------------------------------------------------+
|                                                                               |
|  DRIVER                                                                       |
|  Sees carrier match                                                           |
|       |                                                                       |
|       +----> Clicks "I'm Interested"                                          |
|                    |                                                          |
|                    v                                                          |
|            DriverCarrierInterests                                             |
|                    |                                                          |
|                    |  <-------- CarrierDriverViews (carrier viewed profile)   |
|                    |  <-------- CarrierDriverOutreach (carrier contacted)     |
|                    v                                                          |
|       +----> MUTUAL INTEREST DETECTED                                         |
|       |                                                                       |
|       v                                                                       |
|  +----------------------------------+                                         |
|  | ABC Trucking           [MUTUAL]  |  <-- NEW badge                          |
|  | Match Score: 92%                 |                                         |
|  | "This carrier viewed your profile |                                        |
|  |  and added you to their pipeline" |  <-- NEW explanation                   |
|  | [Message] [View Details]          |  <-- NEW CTA                           |
|  +----------------------------------+                                         |
|                                                                               |
+------------------------------------------------------------------------------+
```

### 2.3 Data Flow Architecture

```
                     DRIVER'S VIEW
                          |
                          v
+----------------------------------------------------------+
|                   getMutualInterestForDriver()            |
+----------------------------------------------------------+
|                          |                                |
|  STEP 1: Get driver's    |   STEP 2: Check carrier       |
|  expressed interests     |   activity for each           |
|          |               |          |                     |
|          v               |          v                     |
|  DriverCarrierInterests  |   CarrierDriverViews          |
|  (driver_id = X)         |   (driver_id = X)             |
|          |               |          |                     |
|          v               |          v                     |
|  [carrier_dot_1]         |   [viewed by carrier_dot_1?]  |
|  [carrier_dot_2]         |   [viewed by carrier_dot_2?]  |
|          |               |          |                     |
|          +-------+-------+          |                     |
|                  |                  |                     |
|                  v                  v                     |
|          +------------------+                             |
|          | CROSS-REFERENCE  |                             |
|          +------------------+                             |
|                  |                                        |
|                  v                                        |
|  Return: [                                                |
|    { carrier_dot: 123, mutual: true, signal: 'viewed' },  |
|    { carrier_dot: 456, mutual: true, signal: 'pipeline' },|
|    { carrier_dot: 789, mutual: false }                    |
|  ]                                                        |
+----------------------------------------------------------+
```

### 2.4 API Design

#### New Backend Function: `getMutualInterestForDriver()`

**File**: `src/backend/mutualInterestService.jsw`

```javascript
/**
 * Get mutual interest indicators for a driver
 * @param {string} driverId - The driver's profile ID
 * @returns {Promise<Object>} - { success, interests: [...] }
 */
export async function getMutualInterestForDriver(driverId) {
  // 1. Get all carriers the driver expressed interest in
  // 2. For each carrier, check CarrierDriverViews and CarrierDriverOutreach
  // 3. Return mutual interest indicators
}
```

**Response Schema**:
```javascript
{
  success: true,
  interests: [
    {
      carrier_dot: '123456',
      carrier_name: 'ABC Trucking',
      driver_interest_date: '2026-01-15',
      is_mutual: true,
      mutual_signals: {
        viewed_profile: true,
        viewed_date: '2026-01-18',
        in_pipeline: true,
        pipeline_date: '2026-01-19',
        contacted: false
      },
      mutual_strength: 'strong' // 'weak', 'moderate', 'strong'
    }
  ],
  mutual_count: 5,
  total_interests: 12
}
```

### 2.5 UI Mockup (Driver Dashboard)

```
+------------------------------------------------------------------------------+
|  MY CARRIER INTERESTS                                      [Filter v] [Sort v]|
+------------------------------------------------------------------------------+
|                                                                               |
|  +------------------------------------------------------------------------+  |
|  |  [MUTUAL MATCH]                                                        |  |
|  |  ABC Trucking - Dallas, TX                            Match Score: 92% |  |
|  |  DOT: 123456 | 200 drivers | $0.62-0.68 CPM                           |  |
|  |                                                                        |  |
|  |  +------------------------------------------------------------------+  |  |
|  |  | THEY'RE INTERESTED TOO!                                          |  |  |
|  |  | - Viewed your profile on Jan 18                                  |  |  |
|  |  | - Added you to their recruitment pipeline                        |  |  |
|  |  +------------------------------------------------------------------+  |  |
|  |                                                                        |  |
|  |  You expressed interest: Jan 15, 2026                                 |  |
|  |  [Send Message]  [View Carrier]  [Withdraw Interest]                  |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
|  +------------------------------------------------------------------------+  |
|  |  Swift Transportation - Phoenix, AZ                   Match Score: 87% |  |
|  |  DOT: 789012 | 12,000 drivers | $0.55-0.62 CPM                        |  |
|  |                                                                        |  |
|  |  You expressed interest: Jan 10, 2026                                 |  |
|  |  Status: Pending carrier review                                        |  |
|  |  [View Carrier]  [Withdraw Interest]                                  |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
+------------------------------------------------------------------------------+
```

---

## 3. Feature 2: Retention Dashboard for Carriers

### 3.1 Current State

The retention service (`retentionService.jsw`) is fully built but only exposed to recruiters:

```
RECRUITER CONSOLE
       |
       v
getCarrierRetentionDashboard(carrierDot)
       |
       v
+--------------------------------+
| Retention Dashboard            |
| - Risk Distribution            |
| - At-Risk Watchlist            |
| - ROI Calculations             |
+--------------------------------+
```

**Problem**: Carriers (fleet owners/managers) who pay for subscriptions can't directly access this valuable data - they need to go through a recruiter.

### 3.2 Desired State

```
+------------------------------------------------------------------------------+
|                      DIRECT CARRIER ACCESS PATH                               |
+------------------------------------------------------------------------------+
|                                                                               |
|  CARRIER PORTAL                                                               |
|       |                                                                       |
|       v                                                                       |
|  [Verify Carrier Subscription]                                                |
|       |                                                                       |
|       +---> Pro/Enterprise? ---> YES ---> getCarrierRetentionDashboard()     |
|       |                                              |                        |
|       |                                              v                        |
|       |                          +--------------------------------+           |
|       |                          | CARRIER RETENTION DASHBOARD    |           |
|       |                          | (Same data, carrier-branded)   |           |
|       |                          +--------------------------------+           |
|       |                                                                       |
|       +---> Free tier? ---> Show upgrade CTA                                  |
|                                                                               |
+------------------------------------------------------------------------------+
```

### 3.3 Data Flow Architecture

```
+--------------------+     +---------------------+     +---------------------+
|                    |     |                     |     |                     |
|  CARRIER PORTAL    |---->| subscriptionService |---->| retentionService    |
|  (Carrier*.html)   |     | .getSubscription()  |     | .getCarrierReten-   |
|                    |     |                     |     |  tionDashboard()    |
+--------------------+     +---------------------+     +---------------------+
         |                          |                          |
         |                          v                          v
         |                  +---------------+          +---------------+
         |                  | CarrierSubs-  |          | DriverPerfor- |
         |                  | criptions     |          | mance (mock)  |
         |                  +---------------+          +---------------+
         |                                                     |
         v                                                     v
+--------------------------------------------------------------------+
|                    CARRIER RETENTION VIEW                           |
+--------------------------------------------------------------------+
| Fleet Health Score: 78%       |  ROI Summary                       |
| At-Risk Drivers: 3/15         |  - Drivers saved: 2                |
| Risk Distribution:            |  - Cost avoided: $20,000           |
|   [LOW: 10] [MED: 2] [HIGH:3] |  - vs. baseline: +23%              |
+--------------------------------------------------------------------+
|                                                                     |
| AT-RISK WATCHLIST                                                   |
| +---------------------------------------------------------------+  |
| | David Ghost     | CRITICAL | Silence Signal (50% activity drop) ||
| | [Schedule 1:1]  [View Performance]                              ||
| +---------------------------------------------------------------+  |
| | Angry Adam      | CRITICAL | Detractor (dNPS 4)                 ||
| | [Schedule 1:1]  [View Performance]                              ||
| +---------------------------------------------------------------+  |
|                                                                     |
+--------------------------------------------------------------------+
```

### 3.4 API Design

#### Wrapper Function: `getCarrierRetentionDashboardForCarrier()`

**File**: `src/backend/retentionService.jsw` (extend existing)

```javascript
/**
 * Get retention dashboard for carrier direct access
 * Wraps existing recruiter function with carrier-specific auth
 * @param {string} carrierDot - The carrier's DOT number
 * @returns {Promise<Object>} - Dashboard data or upgrade prompt
 */
export async function getCarrierRetentionDashboardForCarrier(carrierDot) {
  // 1. Verify carrier is logged in
  // 2. Verify carrier owns this DOT
  // 3. Check subscription tier (Pro/Enterprise required)
  // 4. Call existing getCarrierRetentionDashboard()
  // 5. Return with carrier-specific branding/messaging
}
```

### 3.5 UI Mockup (Carrier Portal)

```
+------------------------------------------------------------------------------+
|  DRIVER RETENTION INTELLIGENCE                                               |
+------------------------------------------------------------------------------+
|                                                                               |
|  +----------------------------+  +----------------------------+               |
|  | FLEET HEALTH              |  | TURNOVER PREVENTION ROI   |               |
|  |                           |  |                           |               |
|  |        78%                |  |   $20,000                 |               |
|  |   [===========>   ]       |  |   Cost Avoided            |               |
|  |                           |  |                           |               |
|  | 15 Active Drivers         |  |   2 Drivers               |               |
|  | 3 At Risk                 |  |   Retention Impact        |               |
|  +----------------------------+  +----------------------------+               |
|                                                                               |
|  RISK DISTRIBUTION                                                            |
|  +------------------------------------------------------------------------+  |
|  |  LOW (10)  ||||||||||                                                  |  |
|  |  MEDIUM (2) ||                                                         |  |
|  |  HIGH (2)   ||                                                         |  |
|  |  CRITICAL(1)|                                                          |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
|  DRIVERS REQUIRING ATTENTION                              [Export CSV]       |
|  +------------------------------------------------------------------------+  |
|  | Driver      | Risk    | Primary Factor          | Suggested Action     |  |
|  |-------------|---------|-------------------------|----------------------|  |
|  | David G.    | CRITICAL| 50% Activity Drop       | [Immediate Call]     |  |
|  | Adam R.     | CRITICAL| Detractor (dNPS 4)      | [Schedule Check-in]  |  |
|  | Sarah V.    | HIGH    | Pay Volatility (28%)    | [Payroll Audit]      |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
+------------------------------------------------------------------------------+
```

---

## 4. Feature 3: Match Explanation for Drivers

### 4.1 Current State

When a carrier searches for drivers, they see WHY a driver matched their criteria. But drivers only see a match score - no explanation of why they matched.

```
CARRIER VIEW (current)
+----------------------------------+
| John D. - 92% Match              |
| WHY THIS DRIVER MATCHES:         |
| - Has required hazmat endorsement|
| - 7 years exceeds 3-year minimum |
| - Located 12 miles from terminal |
+----------------------------------+

DRIVER VIEW (current)
+----------------------------------+
| ABC Trucking - 92% Match         |
| [No explanation]                 |
| [View Details] [I'm Interested]  |
+----------------------------------+
```

**Problem**: Drivers don't understand WHY they matched, making the match score feel arbitrary.

### 4.2 Desired State

Invert the carrier's hiring preferences to explain the match from the driver's perspective:

```
+------------------------------------------------------------------------------+
|                   MATCH EXPLANATION FOR DRIVER                                |
+------------------------------------------------------------------------------+
|                                                                               |
|  ABC Trucking - 92% Match                                                     |
|                                                                               |
|  WHY YOU MATCHED:                                                             |
|  +------------------------------------------------------------------------+  |
|  |                                                                         |  |
|  |  This carrier values:                                                   |  |
|  |                                                                         |  |
|  |  QUALIFICATIONS (40% of their score)                                   |  |
|  |  [================] You match: Class A + Hazmat                         |  |
|  |                                                                         |  |
|  |  EXPERIENCE (25% of their score)                                       |  |
|  |  [============]     You exceed: 7 yrs vs. 3 yr minimum                  |  |
|  |                                                                         |  |
|  |  LOCATION (20% of their score)                                         |  |
|  |  [========]         Your fit: 12 miles from their terminal             |  |
|  |                                                                         |  |
|  |  AVAILABILITY (15% of their score)                                     |  |
|  |  [======]           Your status: Available immediately                  |  |
|  |                                                                         |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
|  TIP: This carrier prioritizes safety qualifications. Your clean MVR and     |
|  hazmat endorsement are strong differentiators.                              |
|                                                                               |
+------------------------------------------------------------------------------+
```

### 4.3 Data Flow Architecture

```
+------------------------------------------------------------------------------+
|              MATCH EXPLANATION DATA FLOW                                      |
+------------------------------------------------------------------------------+
|                                                                               |
|  Driver requests match explanation                                            |
|                |                                                              |
|                v                                                              |
|  +---------------------------+                                                |
|  | getMatchExplanationFor-   |                                                |
|  | Driver(driverId, carrierDot)|                                              |
|  +---------------------------+                                                |
|                |                                                              |
|    +-----------+-----------+                                                  |
|    |                       |                                                  |
|    v                       v                                                  |
|  CarrierHiringPreferences  DriverProfiles                                     |
|  (carrier_dot = X)         (driverId = Y)                                     |
|    |                       |                                                  |
|    |  weight_qualifications|  cdl_class, endorsements                         |
|    |  weight_experience    |  years_experience                                |
|    |  weight_location      |  zip_code                                        |
|    |  weight_availability  |  availability                                    |
|    |  required_cdl_types   |                                                  |
|    |  required_endorsements|                                                  |
|    |                       |                                                  |
|    +-----------+-----------+                                                  |
|                |                                                              |
|                v                                                              |
|  +---------------------------+                                                |
|  | INVERT & EXPLAIN          |                                                |
|  +---------------------------+                                                |
|  | For each weight category: |                                                |
|  | - Show carrier priority % |                                                |
|  | - Show driver's fit       |                                                |
|  | - Generate explanation    |                                                |
|  +---------------------------+                                                |
|                |                                                              |
|                v                                                              |
|  {                                                                            |
|    overall_match: 92,                                                         |
|    explanation: [                                                             |
|      { category: 'qualifications', weight: 40, driver_fit: 95,               |
|        text: 'You have their required Class A + Hazmat' },                   |
|      { category: 'experience', weight: 25, driver_fit: 100,                  |
|        text: 'Your 7 years exceeds their 3-year minimum' }                   |
|    ],                                                                         |
|    tip: 'This carrier values safety qualifications highly...'                |
|  }                                                                            |
|                                                                               |
+------------------------------------------------------------------------------+
```

### 4.4 API Design

#### New Backend Function: `getMatchExplanationForDriver()`

**File**: `src/backend/matchExplanationService.jsw`

```javascript
/**
 * Generate a human-readable match explanation for a driver
 * Shows WHY they matched based on carrier preferences
 *
 * @param {string} driverId - The driver's profile ID
 * @param {string} carrierDot - The carrier's DOT number
 * @returns {Promise<Object>} - Match explanation
 */
export async function getMatchExplanationForDriver(driverId, carrierDot) {
  // 1. Get driver profile
  // 2. Get carrier hiring preferences (with weights)
  // 3. For each weight category, calculate driver fit
  // 4. Generate human-readable explanations
  // 5. Return structured explanation with tips
}
```

**Response Schema**:
```javascript
{
  success: true,
  overall_match_score: 92,
  carrier_name: 'ABC Trucking',
  explanation: {
    summary: 'Strong match - you meet 4 of 5 key criteria',
    categories: [
      {
        name: 'Qualifications',
        weight_percentage: 40,
        driver_fit_score: 95,
        text: 'You have their required Class A CDL and Hazmat endorsement',
        is_strength: true
      },
      {
        name: 'Experience',
        weight_percentage: 25,
        driver_fit_score: 100,
        text: 'Your 7 years of experience exceeds their 3-year minimum',
        is_strength: true
      },
      {
        name: 'Location',
        weight_percentage: 20,
        driver_fit_score: 85,
        text: 'You are 12 miles from their Dallas terminal',
        is_strength: true
      },
      {
        name: 'Availability',
        weight_percentage: 15,
        driver_fit_score: 100,
        text: 'Your immediate availability matches their urgent need',
        is_strength: true
      }
    ],
    tip: 'This carrier prioritizes safety qualifications (40% of score). Your clean MVR and hazmat endorsement are strong differentiators.',
    improvement_suggestions: [
      'Consider adding tanker endorsement - this carrier values it'
    ]
  }
}
```

### 4.5 UI Mockup (Driver Match Card Expanded)

```
+------------------------------------------------------------------------------+
|  ABC TRUCKING                                                 92% MATCH      |
|  Dallas, TX | DOT: 123456 | 200 Drivers | $0.62-0.68 CPM                     |
+------------------------------------------------------------------------------+
|                                                                               |
|  WHY YOU MATCHED                                                              |
|  ---------------                                                              |
|                                                                               |
|  QUALIFICATIONS - 40% of their hiring criteria                               |
|  [==========================================] 95%                             |
|  You have their required Class A CDL and Hazmat endorsement                  |
|                                                                               |
|  EXPERIENCE - 25% of their hiring criteria                                   |
|  [==========================================] 100%                            |
|  Your 7 years of experience exceeds their 3-year minimum                     |
|                                                                               |
|  LOCATION - 20% of their hiring criteria                                     |
|  [==================================      ] 85%                              |
|  You are 12 miles from their Dallas terminal                                 |
|                                                                               |
|  AVAILABILITY - 15% of their hiring criteria                                 |
|  [==========================================] 100%                            |
|  Your immediate availability matches their urgent need                       |
|                                                                               |
+------------------------------------------------------------------------------+
|  TIP: This carrier prioritizes safety qualifications. Your clean MVR and     |
|  hazmat endorsement are strong differentiators over other applicants.        |
+------------------------------------------------------------------------------+
|  [I'm Interested]  [View Full Details]  [Save for Later]                     |
+------------------------------------------------------------------------------+
```

---

## 5. Feature 4: System Health for Recruiters

### 5.1 Current State

System health metrics (API latency, enrichment status, error rates) are only visible to Super Admins via `observabilityService.jsw`:

```
ADMIN PORTAL
     |
     v
observabilityService.getHealthMetrics()
     |
     v
+--------------------------------+
| Error Rate: 0.5%               |
| Avg Latency: 250ms             |
| AI Operations: 1,234 today     |
+--------------------------------+
```

**Problem**: Recruiters rely on AI enrichment data to make decisions but have no visibility into system health. When enrichment is slow or failing, they don't know why data is missing.

### 5.2 Desired State

Surface relevant, recruiter-friendly health metrics:

```
+------------------------------------------------------------------------------+
|                    RECRUITER-FACING SYSTEM HEALTH                             |
+------------------------------------------------------------------------------+
|                                                                               |
|  RECRUITER CONSOLE                                                            |
|       |                                                                       |
|       v                                                                       |
|  [Health Indicator in Header]                                                 |
|       |                                                                       |
|       +---> Green: All systems operational                                    |
|       +---> Yellow: Some delays, enrichment backlog                           |
|       +---> Red: Degraded service, contact support                            |
|       |                                                                       |
|       v                                                                       |
|  [Click for Details]                                                          |
|       |                                                                       |
|       v                                                                       |
|  +----------------------------------+                                         |
|  | SYSTEM STATUS                    |                                         |
|  |                                  |                                         |
|  | Carrier Enrichment: [====] 98%  |                                         |
|  | Last updated: 2 min ago          |                                         |
|  |                                  |                                         |
|  | Driver Search: Operational       |                                         |
|  | Response time: 1.2s avg          |                                         |
|  |                                  |                                         |
|  | FMCSA Data: Fresh                |                                         |
|  | Last sync: Today 9:00 AM         |                                         |
|  +----------------------------------+                                         |
|                                                                               |
+------------------------------------------------------------------------------+
```

### 5.3 Data Flow Architecture

```
+------------------------------------------------------------------------------+
|              RECRUITER HEALTH METRICS FLOW                                    |
+------------------------------------------------------------------------------+
|                                                                               |
|  Recruiter loads dashboard                                                    |
|                |                                                              |
|                v                                                              |
|  +---------------------------+                                                |
|  | getRecruiterHealthStatus()|                                                |
|  +---------------------------+                                                |
|                |                                                              |
|    +-----------+-----------+----------------+                                 |
|    |           |           |                |                                 |
|    v           v           v                v                                 |
|  SystemLogs  CarrierEnrichments  FMCSA Cache  Search Latency                  |
|  (last hour)  (completeness)     (freshness)  (avg response)                  |
|    |           |           |                |                                 |
|    |  Error    |  % with   |  Last sync    |  P95 latency                     |
|    |  rate     |  enrichment|  timestamp   |                                  |
|    |           |           |                |                                 |
|    +-----------+-----------+----------------+                                 |
|                |                                                              |
|                v                                                              |
|  +---------------------------+                                                |
|  | AGGREGATE & SIMPLIFY      |                                                |
|  +---------------------------+                                                |
|  | Convert technical metrics |                                                |
|  | to recruiter-friendly     |                                                |
|  | status indicators         |                                                |
|  +---------------------------+                                                |
|                |                                                              |
|                v                                                              |
|  {                                                                            |
|    overall_status: 'healthy', // 'healthy', 'degraded', 'down'               |
|    services: {                                                                |
|      enrichment: { status: 'healthy', completeness: 98, last_run: '...' },   |
|      search: { status: 'healthy', avg_latency_ms: 1200 },                    |
|      fmcsa: { status: 'healthy', last_sync: '...' }                          |
|    },                                                                         |
|    alerts: [] // Any active issues                                            |
|  }                                                                            |
|                                                                               |
+------------------------------------------------------------------------------+
```

### 5.4 API Design

#### New Backend Function: `getRecruiterHealthStatus()`

**File**: `src/backend/recruiterHealthService.jsw`

```javascript
/**
 * Get recruiter-friendly system health status
 * Abstracts technical metrics into actionable status
 *
 * @returns {Promise<Object>} - Health status for recruiter dashboard
 */
export async function getRecruiterHealthStatus() {
  // 1. Get error rate from last hour (observabilityService)
  // 2. Get carrier enrichment completeness
  // 3. Get FMCSA data freshness
  // 4. Get average search latency
  // 5. Aggregate into recruiter-friendly format
}
```

**Response Schema**:
```javascript
{
  success: true,
  overall_status: 'healthy', // 'healthy', 'degraded', 'down'
  status_message: 'All systems operational',
  checked_at: '2026-01-20T10:30:00Z',
  services: {
    carrier_enrichment: {
      status: 'healthy',
      completeness_percentage: 98,
      enriched_count: 4521,
      pending_count: 87,
      last_batch_run: '2026-01-20T10:00:00Z',
      message: 'Carrier intelligence data is up to date'
    },
    driver_search: {
      status: 'healthy',
      avg_latency_ms: 1200,
      p95_latency_ms: 2500,
      success_rate: 99.5,
      message: 'Driver search is responding normally'
    },
    fmcsa_data: {
      status: 'healthy',
      last_sync: '2026-01-20T09:00:00Z',
      cache_hit_rate: 94,
      message: 'Safety data is fresh (synced today)'
    },
    ai_services: {
      status: 'healthy',
      primary_provider: 'claude',
      fallback_available: true,
      avg_latency_ms: 850,
      message: 'AI enrichment is operational'
    }
  },
  alerts: [
    // Only populated if there are issues
    // { severity: 'warning', message: 'Enrichment batch delayed by 30 min' }
  ]
}
```

### 5.5 UI Mockup (Recruiter Console Header)

```
+------------------------------------------------------------------------------+
|  RECRUITER CONSOLE                                    [User v]  [Settings]   |
+------------------------------------------------------------------------------+
|                                                                               |
|  +------------------------------------------------------------------------+  |
|  | SYSTEM STATUS                                               [?] [Refresh]||
|  |                                                                        |  |
|  |  Overall: [GREEN] All Systems Operational                              |  |
|  |                                                                        |  |
|  |  +------------------+  +------------------+  +------------------+      |  |
|  |  | ENRICHMENT       |  | DRIVER SEARCH    |  | FMCSA DATA       |      |  |
|  |  | [GREEN] 98%      |  | [GREEN] 1.2s avg |  | [GREEN] Fresh    |      |  |
|  |  | Last: 10 min ago |  | Success: 99.5%   |  | Synced: 9:00 AM  |      |  |
|  |  +------------------+  +------------------+  +------------------+      |  |
|  |                                                                        |  |
|  +------------------------------------------------------------------------+  |
|                                                                               |
|  [Dashboard]  [Driver Search]  [Pipeline]  [Messages]  [Settings]            |
|                                                                               |
+------------------------------------------------------------------------------+
```

**Degraded State Example**:

```
+------------------------------------------------------------------------+
| SYSTEM STATUS                                               [?] [Refresh]|
|                                                                         |
|  Overall: [YELLOW] Some Services Degraded                               |
|                                                                         |
|  +------------------+  +------------------+  +------------------+       |
|  | ENRICHMENT       |  | DRIVER SEARCH    |  | FMCSA DATA       |       |
|  | [YELLOW] 75%     |  | [GREEN] 1.2s avg |  | [GREEN] Fresh    |       |
|  | Backlog: 1,234   |  | Success: 99.5%   |  | Synced: 9:00 AM  |       |
|  | ETA: 2 hours     |  |                  |  |                  |       |
|  +------------------+  +------------------+  +------------------+       |
|                                                                         |
|  ALERT: Carrier enrichment is running behind schedule. Some carrier     |
|  profiles may show limited intelligence data. Full data expected by     |
|  12:30 PM.                                                              |
|                                                                         |
+------------------------------------------------------------------------+
```

---

## 6. Integration Points Summary

### 6.1 Existing Services Used

| Service | Used By Feature | Integration Type |
|---------|-----------------|------------------|
| `driverMatching.jsw` | Mutual Interest | Query CarrierDriverViews |
| `retentionService.jsw` | Retention for Carriers | Direct reuse |
| `carrierPreferences.jsw` | Match Explanation | Read hiring preferences |
| `observabilityService.jsw` | System Health | Read health metrics |
| `subscriptionService.jsw` | All features | Tier verification |

### 6.2 New Services to Create

| Service | Purpose | Dependencies |
|---------|---------|--------------|
| `mutualInterestService.jsw` | Mutual interest detection | driverMatching, wixData |
| `matchExplanationService.jsw` | Driver match explanations | carrierPreferences, driverScoring |
| `recruiterHealthService.jsw` | Recruiter-facing health | observabilityService |

### 6.3 Collections Accessed

| Collection | Feature | Access Type |
|------------|---------|-------------|
| `DriverCarrierInterests` | Mutual Interest | Read |
| `CarrierDriverViews` | Mutual Interest | Read |
| `CarrierDriverOutreach` | Mutual Interest | Read |
| `CarrierHiringPreferences` | Match Explanation | Read |
| `DriverProfiles` | Match Explanation | Read |
| `SystemLogs` | System Health | Read (aggregated) |
| `CarrierEnrichments` | System Health | Count |

---

## 7. Security Considerations

### 7.1 Access Control Matrix

| Feature | Driver Access | Carrier Access | Recruiter Access | Admin Access |
|---------|---------------|----------------|------------------|--------------|
| Mutual Interest | Own interests only | N/A | All for their carriers | All |
| Retention Dashboard | N/A | Own carrier only | All for their carriers | All |
| Match Explanation | Own matches only | N/A | N/A | All |
| System Health | N/A | N/A | Summary only | Full details |

### 7.2 Data Exposure Rules

1. **Mutual Interest**: Carriers cannot see which drivers expressed interest unless they pay for profile views
2. **Retention Dashboard**: Individual driver performance data masked to carrier (aggregated only)
3. **Match Explanation**: Carrier preferences shown as percentages, not raw values
4. **System Health**: No sensitive metrics (costs, error details) exposed to recruiters

---

## 8. Success Metrics

| Feature | Metric | Target | Measurement |
|---------|--------|--------|-------------|
| Mutual Interest | Driver engagement | +15% click-through on mutual matches | Analytics |
| Retention Dashboard | Carrier NPS | +10 points | Survey |
| Match Explanation | Driver satisfaction | +20% on match quality rating | Survey |
| System Health | Support tickets | -25% "system is slow" tickets | Support system |

---

## 9. Open Questions

1. **Mutual Interest Notifications**: Should drivers receive real-time notifications when a carrier views them?
2. **Match Explanation Depth**: How much of carrier preferences should be revealed? (Privacy concern)
3. **System Health Granularity**: Should recruiters see per-carrier enrichment status or global only?
4. **Retention Dashboard Permissions**: Should carriers see individual driver names or anonymized data?
