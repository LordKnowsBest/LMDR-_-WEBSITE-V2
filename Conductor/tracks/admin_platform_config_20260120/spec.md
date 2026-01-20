# Specification: Admin Platform Configuration

## 1. Overview

The Admin Platform Configuration module provides advanced platform management tools for LMDR administrators. It enables controlled feature rollouts, data-driven experimentation, customizable communications, and intelligent notification management - all without requiring code deployments.

### Key Capabilities

| Feature | Description | Business Value |
|---------|-------------|----------------|
| **Feature Flags** | Toggle features on/off, gradual rollouts, user targeting | Reduce deployment risk, enable A/B testing |
| **A/B Test Manager** | Configure experiments with variants and metric tracking | Data-driven product decisions |
| **Email Template Editor** | Customize transactional emails with WYSIWYG editing | Improve engagement, reduce churn |
| **Notification Rules** | Configure event triggers, channels, and throttling | Optimize user communication |

---

## 2. Architecture Overview

```
+------------------------------------------------------------------+
|                    ADMIN CONFIGURATION PORTAL                      |
+------------------------------------------------------------------+
|  Feature Flags  |  A/B Tests  |  Email Editor  |  Notifications  |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                    CONFIGURATION SERVICE                          |
|  (configService.jsw)                                              |
+------------------------------------------------------------------+
|  - Flag evaluation engine                                         |
|  - Experiment assignment                                          |
|  - Template rendering                                             |
|  - Notification dispatch                                          |
+------------------------------------------------------------------+
        |                |                |                |
        v                v                v                v
+------------+   +------------+   +---------------+   +-------------+
| FeatureFlags|   | ABTests    |   | EmailTemplates|   | Notification|
| Collection |   | Collection |   | Collection    |   | Rules       |
+------------+   +------------+   +---------------+   +-------------+
        |                |                |                |
        v                v                v                v
+------------------------------------------------------------------+
|                    FRONTEND SDK                                    |
|  (lmdr-config.js - public/js)                                     |
+------------------------------------------------------------------+
|  - LMDRFlags.isEnabled('flag_name')                              |
|  - LMDRExperiment.getVariant('test_name')                        |
|  - LMDRNotify.send(event, data)                                  |
+------------------------------------------------------------------+
```

---

## 3. Feature Flags System

### 3.1 Overview

A LaunchDarkly-like feature flag system enabling:
- Toggle features without deployment
- Percentage-based gradual rollouts
- User segment targeting (by role, tier, location)
- Kill switches for emergency disables
- Environment-specific flags (dev, staging, prod)

### 3.2 Data Model

**FeatureFlags Collection**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `key` | String | Unique flag identifier (snake_case, e.g., `new_driver_dashboard`) |
| `name` | String | Human-readable name |
| `description` | Text | Flag purpose and usage notes |
| `enabled` | Boolean | Master on/off switch |
| `rolloutPercentage` | Number | 0-100, percentage of users who see feature |
| `targetRules` | Array | Targeting conditions (see below) |
| `defaultValue` | Boolean | Value when no rules match |
| `environment` | String | `production`, `staging`, `development` |
| `category` | String | `ui`, `backend`, `experiment`, `killswitch` |
| `createdBy` | Reference | Admin who created |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last modification |
| `expiresAt` | DateTime | Optional auto-disable date |

**Target Rules Schema**

```javascript
{
  "targetRules": [
    {
      "id": "rule_1",
      "name": "Pro Tier Users",
      "conditions": [
        { "attribute": "subscription.tier", "operator": "equals", "value": "pro" }
      ],
      "percentage": 100,
      "enabled": true
    },
    {
      "id": "rule_2",
      "name": "Texas Drivers Beta",
      "conditions": [
        { "attribute": "user.role", "operator": "equals", "value": "driver" },
        { "attribute": "profile.state", "operator": "in", "value": ["TX", "OK", "LA"] }
      ],
      "percentage": 50,
      "enabled": true
    }
  ]
}
```

**Supported Operators:**
- `equals`, `not_equals`
- `in`, `not_in` (array values)
- `greater_than`, `less_than`
- `contains`, `starts_with`, `ends_with`
- `regex`

### 3.3 Flag Evaluation Logic

```
+-------------------+
| Check Flag Exists |
+-------------------+
         |
         v
+-------------------+
| Flag Enabled?     |--NO--> Return defaultValue
+-------------------+
         |YES
         v
+-------------------+
| Check Target Rules|
| (in priority order)|
+-------------------+
         |
    +----+----+
    |         |
   MATCH    NO MATCH
    |         |
    v         v
+--------+ +-----------------+
| Apply  | | Apply Global    |
| Rule % | | rolloutPercentage|
+--------+ +-----------------+
    |              |
    v              v
+------------------+
| Hash(userId +    |
| flagKey) % 100   |
+------------------+
    |
    v
+------------------+
| Return true/false|
| based on bucket  |
+------------------+
```

### 3.4 Admin UI - Feature Flags

```
+------------------------------------------------------------------+
|  FEATURE FLAGS                                    [+ Create Flag]  |
+------------------------------------------------------------------+
|  Filter: [All Categories v]  [All Environments v]  [Search...]    |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+  |
|  | [*] new_driver_dashboard                    ENABLED  100%    |  |
|  |     New Driver Dashboard UI                                  |  |
|  |     Category: ui | Env: production | Updated: 2 days ago    |  |
|  |     [Edit] [Disable] [View Usage]                            |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
|  +--------------------------------------------------------------+  |
|  | [ ] ai_enrichment_v2                        DISABLED         |  |
|  |     Enhanced AI Carrier Enrichment                           |  |
|  |     Category: backend | Env: staging | Kill Switch           |  |
|  |     [Edit] [Enable] [View Usage]                             |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
|  +--------------------------------------------------------------+  |
|  | [*] premium_matching_weights                ENABLED  25%     |  |
|  |     Custom matching weights for Pro users                    |  |
|  |     Category: experiment | Rules: 2 active                   |  |
|  |     [Edit] [Disable] [View Usage]                            |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
+------------------------------------------------------------------+
```

**Flag Editor Modal:**

```
+------------------------------------------------------------------+
|  EDIT FEATURE FLAG                                         [X]    |
+------------------------------------------------------------------+
|                                                                    |
|  Flag Key: [new_driver_dashboard        ] (read-only after create)|
|                                                                    |
|  Name: [New Driver Dashboard UI                             ]     |
|                                                                    |
|  Description:                                                     |
|  +--------------------------------------------------------------+|
|  | Enables the redesigned driver dashboard with improved job    ||
|  | matching visualization and application tracking.             ||
|  +--------------------------------------------------------------+|
|                                                                    |
|  Category: [ui            v]   Environment: [production   v]     |
|                                                                    |
|  +--------------------------------------------------------------+|
|  | ROLLOUT SETTINGS                                             ||
|  |-------------------------------------------------------------|
|  | Master Switch: [ON]                                          ||
|  | Global Rollout: [====|================] 25%                  ||
|  | Default Value: [x] true  [ ] false                           ||
|  +--------------------------------------------------------------+|
|                                                                    |
|  +--------------------------------------------------------------+|
|  | TARGETING RULES (evaluated in order)                         ||
|  |-------------------------------------------------------------|
|  | 1. [*] Pro Tier Users                            100%  [Edit]||
|  |    subscription.tier equals "pro"                            ||
|  |                                                              ||
|  | 2. [*] Texas Beta Group                           50%  [Edit]||
|  |    user.role equals "driver" AND                             ||
|  |    profile.state in ["TX", "OK", "LA"]                       ||
|  |                                                              ||
|  | [+ Add Rule]                                                 ||
|  +--------------------------------------------------------------+|
|                                                                    |
|  Expires: [ ] Never  [x] On Date: [2026-03-01]                   |
|                                                                    |
|  [Cancel]                                    [Save Changes]       |
+------------------------------------------------------------------+
```

### 3.5 Frontend SDK

```javascript
// public/js/lmdr-flags.js

class LMDRFlags {
  static async init(userId, userContext) {
    // Fetch all active flags for user
    // Cache locally with TTL
  }

  static isEnabled(flagKey) {
    // Synchronous check from cache
    return this.cache[flagKey]?.enabled ?? false;
  }

  static async isEnabledAsync(flagKey) {
    // Force fresh evaluation from backend
  }

  static getVariant(flagKey) {
    // For multi-variant flags
    return this.cache[flagKey]?.variant ?? 'control';
  }

  static track(flagKey, eventName, metadata) {
    // Track flag-related events for analysis
  }
}

// Usage in page code:
$w.onReady(async function() {
  await LMDRFlags.init(currentUserId, { role: 'driver', tier: 'free' });

  if (LMDRFlags.isEnabled('new_driver_dashboard')) {
    $w('#newDashboard').show();
    $w('#oldDashboard').hide();
  }
});
```

---

## 4. A/B Test Manager

### 4.1 Overview

A controlled experimentation system allowing admins to:
- Create experiments with multiple variants
- Define traffic allocation percentages
- Track custom metrics and conversions
- Calculate statistical significance
- Declare winners and roll out

### 4.2 Data Model

**ABTests Collection**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `key` | String | Unique test identifier |
| `name` | String | Human-readable name |
| `description` | Text | Hypothesis and test purpose |
| `status` | String | `draft`, `running`, `paused`, `completed`, `rolled_out` |
| `variants` | Array | Variant definitions (see below) |
| `trafficAllocation` | Number | % of eligible users in test (1-100) |
| `targetAudience` | Object | Same targeting as feature flags |
| `primaryMetric` | Object | Main success metric |
| `secondaryMetrics` | Array | Additional metrics to track |
| `startDate` | DateTime | When test started |
| `endDate` | DateTime | When test ended/will end |
| `minSampleSize` | Number | Required sample per variant |
| `confidenceLevel` | Number | Required significance (default 95%) |
| `createdBy` | Reference | Admin who created |
| `results` | Object | Calculated results (updated periodically) |

**Variant Schema:**

```javascript
{
  "variants": [
    {
      "id": "control",
      "name": "Control",
      "description": "Current experience",
      "allocation": 50,
      "config": {}
    },
    {
      "id": "variant_a",
      "name": "Green CTA Button",
      "description": "Apply button changed to green",
      "allocation": 50,
      "config": {
        "buttonColor": "#10b981"
      }
    }
  ]
}
```

**Metric Schema:**

```javascript
{
  "primaryMetric": {
    "name": "application_submitted",
    "type": "conversion",  // conversion, count, revenue, duration
    "goal": "maximize"     // maximize, minimize
  },
  "secondaryMetrics": [
    { "name": "page_time", "type": "duration", "goal": "maximize" },
    { "name": "bounce_rate", "type": "conversion", "goal": "minimize" }
  ]
}
```

**ABTestAssignments Collection** (for tracking user assignments)

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `testKey` | String | Test identifier |
| `userId` | String | User ID |
| `variantId` | String | Assigned variant |
| `assignedAt` | DateTime | Assignment timestamp |
| `converted` | Boolean | Whether user converted |
| `conversionEvents` | Array | All conversion events |

### 4.3 Statistical Significance Calculation

```javascript
// Chi-squared test for conversion metrics
function calculateSignificance(control, variant) {
  const controlConvRate = control.conversions / control.participants;
  const variantConvRate = variant.conversions / variant.participants;

  // Pooled proportion
  const pooled = (control.conversions + variant.conversions) /
                 (control.participants + variant.participants);

  // Standard error
  const se = Math.sqrt(pooled * (1 - pooled) *
             (1/control.participants + 1/variant.participants));

  // Z-score
  const z = (variantConvRate - controlConvRate) / se;

  // Two-tailed p-value
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  return {
    controlRate: controlConvRate,
    variantRate: variantConvRate,
    lift: ((variantConvRate - controlConvRate) / controlConvRate) * 100,
    pValue: pValue,
    significant: pValue < 0.05,
    confidence: (1 - pValue) * 100
  };
}
```

### 4.4 Admin UI - A/B Test Manager

```
+------------------------------------------------------------------+
|  A/B TEST MANAGER                               [+ Create Test]   |
+------------------------------------------------------------------+
|  Status: [All v]  |  Running: 3  |  Completed: 12  |  Draft: 2   |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+  |
|  | RUNNING  apply_button_color_test                             |  |
|  |-------------------------------------------------------------|  |
|  | Testing green vs blue apply button on job cards              |  |
|  | Started: Jan 10, 2026 | Target: 1,000 users per variant      |  |
|  |                                                              |  |
|  |  Variant      | Users | Conversions | Rate   | Lift         |  |
|  |  -------------|-------|-------------|--------|--------------|  |
|  |  Control      |   847 |         102 | 12.0%  | -            |  |
|  |  Green Button |   832 |         124 | 14.9%  | +24.1%  **   |  |
|  |                                                              |  |
|  |  ** 97.2% confidence | Projected winner: Green Button        |  |
|  |                                                              |  |
|  |  [View Details] [Pause] [Declare Winner]                     |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
|  +--------------------------------------------------------------+  |
|  | DRAFT  carrier_card_redesign                                 |  |
|  |-------------------------------------------------------------|  |
|  | Testing new carrier card layout with salary prominently      |  |
|  | displayed. 3 variants configured.                            |  |
|  |                                                              |  |
|  | [Edit] [Start Test] [Delete]                                 |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
+------------------------------------------------------------------+
```

**Test Detail View:**

```
+------------------------------------------------------------------+
|  apply_button_color_test                          STATUS: RUNNING |
+------------------------------------------------------------------+
|                                                                    |
|  OVERVIEW                                                         |
|  Hypothesis: A green CTA button will increase application         |
|  submissions by improving visual prominence and positive           |
|  association with "go/proceed".                                   |
|                                                                    |
|  +------------------------+  +------------------------------+     |
|  | TRAFFIC ALLOCATION     |  | TEST DURATION                |     |
|  | [==========|==========]|  | Started: Jan 10, 2026        |     |
|  | 50% Control | 50% Test |  | Running: 10 days             |     |
|  | Total: 100% of traffic |  | Est. completion: Jan 25      |     |
|  +------------------------+  +------------------------------+     |
|                                                                    |
|  RESULTS                                                          |
|  +--------------------------------------------------------------+|
|  |        |          |            |        |         |   Stat   ||
|  | Variant| Visitors | Conversions|  Rate  |  Lift   |   Sig    ||
|  |--------|----------|------------|--------|---------|----------||
|  | Control|     847  |        102 | 12.04% |    -    |    -     ||
|  | Green  |     832  |        124 | 14.90% | +23.8%  | 97.2% ** ||
|  +--------------------------------------------------------------+|
|                                                                    |
|  CONVERSION OVER TIME                                             |
|  +--------------------------------------------------------------+|
|  |     ^                                                        ||
|  |  16%|                                      . - - Green       ||
|  |     |                                . - '                   ||
|  |  14%|                          . - '                         ||
|  |     |                    . - '                               ||
|  |  12%|- - - - - - - - - - - - - - - - - - - - - Control       ||
|  |     |                                                        ||
|  |  10%+---------------------------------------------------->   ||
|  |      Jan 10    Jan 12    Jan 14    Jan 16    Jan 18         ||
|  +--------------------------------------------------------------+|
|                                                                    |
|  [Pause Test]  [Extend Duration]  [Declare Winner]  [Export Data] |
+------------------------------------------------------------------+
```

### 4.5 Frontend SDK

```javascript
// public/js/lmdr-experiment.js

class LMDRExperiment {
  static async getVariant(testKey) {
    // Returns variant assignment (creates if needed)
    // POST to backend: assignUserToTest(testKey, userId)
  }

  static async trackConversion(testKey, metricName, value = 1) {
    // Track conversion event
    // POST to backend: recordTestConversion(testKey, userId, metricName, value)
  }

  static getConfig(testKey) {
    // Get variant-specific configuration
    return this.assignments[testKey]?.config ?? {};
  }
}

// Usage:
const variant = await LMDRExperiment.getVariant('apply_button_color');
if (variant === 'variant_a') {
  $w('#applyButton').style.backgroundColor = '#10b981';
}

// Track conversion
$w('#applyButton').onClick(() => {
  LMDRExperiment.trackConversion('apply_button_color', 'application_submitted');
});
```

---

## 5. Email Template Editor

### 5.1 Overview

A WYSIWYG email template editor enabling admins to:
- Customize all transactional emails
- Use dynamic variables (user name, carrier info, etc.)
- Preview across devices (desktop, mobile)
- Version control with rollback
- A/B test email variants

### 5.2 Data Model

**EmailTemplates Collection**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `templateKey` | String | Unique identifier (e.g., `welcome_driver`) |
| `name` | String | Human-readable name |
| `category` | String | `onboarding`, `transactional`, `notification`, `marketing` |
| `subject` | String | Email subject (supports variables) |
| `preheader` | String | Preview text |
| `htmlContent` | Text | Full HTML email content |
| `plainTextContent` | Text | Plain text fallback |
| `variables` | Array | Available merge variables |
| `isActive` | Boolean | Whether template is in use |
| `version` | Number | Version number |
| `previousVersions` | Array | Version history |
| `testVariants` | Array | A/B test variants (if any) |
| `createdBy` | Reference | Admin who created |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last modification |

**Standard Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `{{user.firstName}}` | User's first name | John |
| `{{user.email}}` | User's email | john@email.com |
| `{{carrier.name}}` | Carrier company name | Swift Transport |
| `{{carrier.dot}}` | DOT number | 123456 |
| `{{application.status}}` | Application status | Under Review |
| `{{job.title}}` | Job posting title | Regional OTR Driver |
| `{{match.score}}` | Match percentage | 92% |
| `{{platform.url}}` | Platform URL | https://lmdr.com |
| `{{date.today}}` | Today's date | January 20, 2026 |

### 5.3 Template Categories

| Category | Templates |
|----------|-----------|
| **Onboarding** | `welcome_driver`, `welcome_carrier`, `welcome_recruiter`, `complete_profile_reminder` |
| **Applications** | `application_received`, `application_status_update`, `application_hired` |
| **Matching** | `new_match_driver`, `new_match_carrier`, `weekly_match_digest` |
| **Notifications** | `new_message`, `interview_scheduled`, `document_expiring` |
| **Account** | `password_reset`, `email_verification`, `subscription_updated` |
| **Marketing** | `newsletter`, `promotional`, `reengagement` |

### 5.4 Admin UI - Email Template Editor

```
+------------------------------------------------------------------+
|  EMAIL TEMPLATES                             [+ Create Template]  |
+------------------------------------------------------------------+
|  Category: [All Categories v]  [Search templates...]              |
+------------------------------------------------------------------+
|                                                                    |
|  ONBOARDING                                                       |
|  +--------------------------------------------------------------+|
|  | welcome_driver                                        ACTIVE ||
|  | Welcome to LMDR - Start Your Job Search                      ||
|  | Last edited: 3 days ago by Admin                             ||
|  | [Edit] [Preview] [Duplicate] [View Analytics]                ||
|  +--------------------------------------------------------------+|
|                                                                    |
|  APPLICATIONS                                                     |
|  +--------------------------------------------------------------+|
|  | application_received                                  ACTIVE ||
|  | Application Confirmation - {{carrier.name}}                  ||
|  | Last edited: 1 week ago | A/B Test: 2 variants running       ||
|  | [Edit] [Preview] [Duplicate] [View Analytics]                ||
|  +--------------------------------------------------------------+|
|                                                                    |
+------------------------------------------------------------------+
```

**Template Editor (WYSIWYG):**

```
+------------------------------------------------------------------+
|  EDIT TEMPLATE: welcome_driver                             [X]   |
+------------------------------------------------------------------+
|  Template Key: welcome_driver (read-only)                         |
|  Name: [Welcome to LMDR - Start Your Job Search            ]     |
|                                                                    |
|  Subject: [Welcome to LMDR, {{user.firstName}}!            ]     |
|  Preheader: [Your CDL job search starts here               ]     |
|                                                                    |
|  +--------------------------------------------------------------+|
|  | [B] [I] [U] | [H1] [H2] | [Link] [Image] | [Variable v]      ||
|  |-------------------------------------------------------------|  |
|  |                                                              ||
|  |  +--------------------------------------------------------+ ||
|  |  |              [LMDR Logo]                               | ||
|  |  +--------------------------------------------------------+ ||
|  |                                                              ||
|  |  Hi {{user.firstName}},                                     ||
|  |                                                              ||
|  |  Welcome to LMDR! We're excited to help you find your       ||
|  |  next CDL driving opportunity.                              ||
|  |                                                              ||
|  |  Your profile is currently {{profile.completeness}}%        ||
|  |  complete. Complete your profile to unlock AI-powered       ||
|  |  job matching.                                              ||
|  |                                                              ||
|  |  +----------------------------------+                       ||
|  |  |     [Complete My Profile]        |                       ||
|  |  +----------------------------------+                       ||
|  |                                                              ||
|  |  Questions? Reply to this email - we're here to help!       ||
|  |                                                              ||
|  |  - The LMDR Team                                            ||
|  |                                                              ||
|  +--------------------------------------------------------------+|
|                                                                    |
|  AVAILABLE VARIABLES                                              |
|  +--------------------------------------------------------------+|
|  | {{user.firstName}} | {{user.email}} | {{profile.completeness}}||
|  | {{platform.url}}   | {{date.today}} | [+ Custom Variable]    ||
|  +--------------------------------------------------------------+|
|                                                                    |
|  [Preview Desktop] [Preview Mobile] [Send Test Email]             |
|                                                                    |
|  [Cancel] [Save Draft] [Save & Activate]                          |
+------------------------------------------------------------------+
```

**Preview Modal:**

```
+------------------------------------------------------------------+
|  PREVIEW: welcome_driver                                   [X]   |
+------------------------------------------------------------------+
|  Device: [Desktop] [Mobile]  |  Test Data: [Sample User v]       |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+|
|  | From: LMDR <noreply@lmdr.com>                                ||
|  | To: john.driver@email.com                                     ||
|  | Subject: Welcome to LMDR, John!                               ||
|  |-------------------------------------------------------------|  |
|  |                                                              ||
|  |              [LMDR Logo]                                     ||
|  |                                                              ||
|  |  Hi John,                                                    ||
|  |                                                              ||
|  |  Welcome to LMDR! We're excited to help you find your       ||
|  |  next CDL driving opportunity.                              ||
|  |                                                              ||
|  |  Your profile is currently 45% complete. Complete your      ||
|  |  profile to unlock AI-powered job matching.                 ||
|  |                                                              ||
|  |  [Complete My Profile]                                      ||
|  |                                                              ||
|  |  Questions? Reply to this email - we're here to help!       ||
|  |                                                              ||
|  |  - The LMDR Team                                            ||
|  |                                                              ||
|  +--------------------------------------------------------------+|
|                                                                    |
|  [Send Test to My Email]                              [Close]    |
+------------------------------------------------------------------+
```

### 5.5 Email Rendering Service

```javascript
// Backend: emailTemplateService.jsw

export async function renderEmail(templateKey, variables) {
  // 1. Fetch template
  const template = await wixData.query('EmailTemplates')
    .eq('templateKey', templateKey)
    .eq('isActive', true)
    .find();

  // 2. Replace variables
  let html = template.htmlContent;
  let subject = template.subject;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, value);
    subject = subject.replace(regex, value);
  }

  // 3. Return rendered content
  return {
    subject,
    html,
    plainText: stripHtml(html)
  };
}

export async function sendTemplatedEmail(templateKey, recipient, variables) {
  const rendered = await renderEmail(templateKey, variables);

  // Use Wix Triggered Emails or external service
  await wixCrmBackend.emailContact(templateKey, recipient, {
    variables: rendered
  });
}
```

---

## 6. Notification Rules Engine

### 6.1 Overview

A configurable notification system allowing admins to:
- Define event triggers (application submitted, match found, etc.)
- Select delivery channels (email, SMS, push, in-app)
- Set throttling rules (no more than X per hour)
- Configure quiet hours
- Personalize notification content

### 6.2 Data Model

**NotificationRules Collection**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `name` | String | Rule name |
| `description` | Text | Rule purpose |
| `isActive` | Boolean | Whether rule is active |
| `triggerEvent` | String | Event that fires notification |
| `conditions` | Array | Additional conditions to check |
| `channels` | Array | Delivery channels (see below) |
| `throttling` | Object | Rate limiting rules |
| `scheduling` | Object | Timing rules (delay, quiet hours) |
| `content` | Object | Notification content by channel |
| `priority` | String | `high`, `medium`, `low` |
| `createdBy` | Reference | Admin who created |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last modification |

**Channel Configuration:**

```javascript
{
  "channels": [
    {
      "type": "email",
      "enabled": true,
      "templateKey": "new_match_driver",
      "fallbackTemplate": "generic_notification"
    },
    {
      "type": "in_app",
      "enabled": true,
      "template": "You have a new {{match.score}}% match with {{carrier.name}}"
    },
    {
      "type": "sms",
      "enabled": false,
      "template": null
    },
    {
      "type": "push",
      "enabled": true,
      "title": "New Match!",
      "body": "{{carrier.name}} is a {{match.score}}% match"
    }
  ]
}
```

**Throttling Configuration:**

```javascript
{
  "throttling": {
    "enabled": true,
    "maxPerHour": 5,
    "maxPerDay": 20,
    "cooldownMinutes": 30,  // Min time between same notification type
    "groupSimilar": true    // Batch similar notifications
  }
}
```

**Scheduling Configuration:**

```javascript
{
  "scheduling": {
    "delayMinutes": 0,        // Delay before sending
    "respectQuietHours": true,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00",
    "quietHoursTimezone": "user",  // "user" or specific timezone
    "daysOfWeek": [1, 2, 3, 4, 5, 6, 0]  // All days
  }
}
```

### 6.3 Trigger Events

| Event | Description | Variables Available |
|-------|-------------|---------------------|
| `driver.registered` | New driver signs up | user.* |
| `driver.profile_complete` | Driver completes profile | user.*, profile.* |
| `application.submitted` | Driver applies to job | user.*, carrier.*, job.* |
| `application.status_changed` | Application status updates | user.*, carrier.*, application.* |
| `match.new` | New match above threshold | user.*, carrier.*, match.* |
| `match.weekly_digest` | Weekly match summary | user.*, matches[] |
| `message.received` | New message received | user.*, sender.*, message.* |
| `interview.scheduled` | Interview scheduled | user.*, carrier.*, interview.* |
| `document.expiring` | Document expires soon | user.*, document.* |
| `subscription.changed` | Subscription updated | user.*, subscription.* |

### 6.4 Admin UI - Notification Rules

```
+------------------------------------------------------------------+
|  NOTIFICATION RULES                             [+ Create Rule]   |
+------------------------------------------------------------------+
|  Trigger: [All Events v]  Status: [All v]  [Search...]           |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+  |
|  | [*] New Match Notification                          ACTIVE   |  |
|  |-------------------------------------------------------------|  |
|  | Trigger: match.new (score >= 80%)                            |  |
|  | Channels: Email, In-App, Push                                |  |
|  | Throttle: Max 5/hour, respects quiet hours                   |  |
|  |                                                              |  |
|  | Last 24h: 247 sent | 89% delivered | 34% opened              |  |
|  | [Edit] [Disable] [View Logs]                                 |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
|  +--------------------------------------------------------------+  |
|  | [*] Application Status Update                       ACTIVE   |  |
|  |-------------------------------------------------------------|  |
|  | Trigger: application.status_changed                          |  |
|  | Channels: Email, In-App                                      |  |
|  | Throttle: None (important notification)                      |  |
|  |                                                              |  |
|  | Last 24h: 89 sent | 95% delivered | 67% opened               |  |
|  | [Edit] [Disable] [View Logs]                                 |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
|  +--------------------------------------------------------------+  |
|  | [ ] Weekly Match Digest                           DISABLED   |  |
|  |-------------------------------------------------------------|  |
|  | Trigger: match.weekly_digest (Sundays 9 AM)                  |  |
|  | Channels: Email only                                         |  |
|  | [Edit] [Enable] [View Logs]                                  |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
+------------------------------------------------------------------+
```

**Rule Editor:**

```
+------------------------------------------------------------------+
|  EDIT RULE: New Match Notification                         [X]   |
+------------------------------------------------------------------+
|                                                                    |
|  Name: [New Match Notification                             ]     |
|  Description: [Notifies drivers when a high-quality match  ]     |
|               [is found with their preferences.            ]     |
|                                                                    |
|  TRIGGER                                                          |
|  +--------------------------------------------------------------+|
|  | Event: [match.new                              v]            ||
|  | Additional Conditions:                                       ||
|  | [x] match.score >= [80] %                                    ||
|  | [ ] carrier.tier equals [    v]                              ||
|  | [+ Add Condition]                                            ||
|  +--------------------------------------------------------------+|
|                                                                    |
|  CHANNELS                                                         |
|  +--------------------------------------------------------------+|
|  | [x] Email                                                    ||
|  |     Template: [new_match_driver               v]             ||
|  |                                                              ||
|  | [x] In-App Notification                                      ||
|  |     Message: [New {{match.score}}% match with {{carrier...  ||
|  |                                                              ||
|  | [ ] SMS                                                      ||
|  |                                                              ||
|  | [x] Push Notification                                        ||
|  |     Title: [New Match Found!                   ]             ||
|  |     Body:  [{{carrier.name}} - {{match.score}}% match  ]    ||
|  +--------------------------------------------------------------+|
|                                                                    |
|  THROTTLING                                                       |
|  +--------------------------------------------------------------+|
|  | [x] Enable throttling                                        ||
|  |     Max per hour: [5]     Max per day: [20]                  ||
|  |     Cooldown: [30] minutes between similar                   ||
|  | [x] Group similar notifications into digest                  ||
|  +--------------------------------------------------------------+|
|                                                                    |
|  SCHEDULING                                                       |
|  +--------------------------------------------------------------+|
|  | Delay before sending: [0] minutes                            ||
|  | [x] Respect quiet hours: [22:00] to [08:00]                  ||
|  |     Timezone: [User's local timezone v]                      ||
|  | Active days: [x]M [x]T [x]W [x]T [x]F [x]S [x]S              ||
|  +--------------------------------------------------------------+|
|                                                                    |
|  Priority: [Medium v]                                             |
|                                                                    |
|  [Cancel] [Save Draft] [Save & Activate]                          |
+------------------------------------------------------------------+
```

### 6.5 Notification Dispatch Service

```javascript
// Backend: notificationService.jsw

export async function dispatchNotification(event, data) {
  // 1. Find matching active rules
  const rules = await wixData.query('NotificationRules')
    .eq('triggerEvent', event)
    .eq('isActive', true)
    .find();

  for (const rule of rules.items) {
    // 2. Check conditions
    if (!evaluateConditions(rule.conditions, data)) continue;

    // 3. Check throttling
    if (await isThrottled(rule, data.userId)) continue;

    // 4. Check scheduling (quiet hours, delay)
    const sendTime = await calculateSendTime(rule, data.userId);

    // 5. Queue notification for each channel
    for (const channel of rule.channels) {
      if (!channel.enabled) continue;

      await queueNotification({
        ruleId: rule._id,
        userId: data.userId,
        channel: channel.type,
        content: renderContent(channel, data),
        scheduledFor: sendTime,
        priority: rule.priority
      });
    }
  }
}

// Cron job processes queue
export async function processNotificationQueue() {
  const pending = await wixData.query('NotificationQueue')
    .le('scheduledFor', new Date())
    .eq('status', 'pending')
    .ascending('priority')
    .limit(100)
    .find();

  for (const notification of pending.items) {
    await sendNotification(notification);
    await markAsSent(notification._id);
  }
}
```

---

## 7. API Design

### 7.1 Feature Flags API

```javascript
// configService.jsw

// Read operations
export async function getAllFlags(environment = 'production')
export async function getFlag(flagKey)
export async function evaluateFlag(flagKey, userId, userContext)
export async function getFlagUsageStats(flagKey, dateRange)

// Write operations (admin only)
export async function createFlag(flagData)
export async function updateFlag(flagKey, updates)
export async function deleteFlag(flagKey)
export async function toggleFlag(flagKey, enabled)

// Bulk operations
export async function evaluateAllFlags(userId, userContext)
export async function exportFlags(environment)
export async function importFlags(flagsData, environment)
```

### 7.2 A/B Tests API

```javascript
// experimentService.jsw

// Read operations
export async function getAllTests(status)
export async function getTest(testKey)
export async function getTestResults(testKey)
export async function getUserAssignment(testKey, userId)

// Write operations (admin only)
export async function createTest(testData)
export async function updateTest(testKey, updates)
export async function startTest(testKey)
export async function pauseTest(testKey)
export async function endTest(testKey, winnerId)

// Assignment & tracking
export async function assignUserToTest(testKey, userId)
export async function recordConversion(testKey, userId, metric, value)
```

### 7.3 Email Templates API

```javascript
// emailTemplateService.jsw

// Read operations
export async function getAllTemplates(category)
export async function getTemplate(templateKey)
export async function getTemplateVersions(templateKey)
export async function previewTemplate(templateKey, sampleData)

// Write operations (admin only)
export async function createTemplate(templateData)
export async function updateTemplate(templateKey, updates)
export async function activateTemplate(templateKey)
export async function revertToVersion(templateKey, version)

// Rendering
export async function renderEmail(templateKey, variables)
export async function sendTestEmail(templateKey, recipientEmail, sampleData)
```

### 7.4 Notification Rules API

```javascript
// notificationRulesService.jsw

// Read operations
export async function getAllRules(triggerEvent)
export async function getRule(ruleId)
export async function getRuleStats(ruleId, dateRange)
export async function getNotificationLogs(ruleId, dateRange)

// Write operations (admin only)
export async function createRule(ruleData)
export async function updateRule(ruleId, updates)
export async function toggleRule(ruleId, isActive)
export async function deleteRule(ruleId)

// Testing
export async function testRule(ruleId, sampleData)
export async function previewNotification(ruleId, channel, sampleData)
```

---

## 8. Security Considerations

### 8.1 Access Control

| Operation | Required Role |
|-----------|---------------|
| View flags/tests/templates | `viewer`, `ops_admin`, `super_admin` |
| Create/edit flags | `ops_admin`, `super_admin` |
| Create/edit tests | `super_admin` |
| Edit email templates | `ops_admin`, `super_admin` |
| Manage notification rules | `ops_admin`, `super_admin` |
| Delete any configuration | `super_admin` only |

### 8.2 Audit Trail

All configuration changes are logged to `AdminAuditLog`:

```javascript
{
  adminId: "admin_123",
  action: "flag_updated",
  targetType: "feature_flag",
  targetId: "new_driver_dashboard",
  details: {
    field: "rolloutPercentage",
    oldValue: 25,
    newValue: 50
  },
  timestamp: "2026-01-20T15:30:00Z"
}
```

### 8.3 Change Validation

- Flag keys: alphanumeric + underscore only
- Rollout percentages: 0-100 integer
- Email templates: HTML sanitization required
- Notification content: Variable validation

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Feature flag latency | <50ms | p95 evaluation time |
| Flag cache hit rate | >95% | Cache hits / total checks |
| Experiment assignment consistency | 100% | Same user = same variant |
| Email template render time | <200ms | p95 render time |
| Notification delivery rate | >98% | Delivered / sent |
| Admin config time | -60% | Time to change vs. code deploy |
| Deployment incidents | -80% | Incidents requiring rollback |

---

## 10. Future Enhancements

1. **Scheduled Flag Changes**: Auto-enable/disable at specific times
2. **Flag Dependencies**: Require flag A enabled before flag B
3. **Multivariate Testing**: More than 2 variants per test
4. **Bayesian Statistics**: Alternative to frequentist significance
5. **SMS Gateway Integration**: Full SMS notification support
6. **Visual Email Builder**: Drag-and-drop email editor
7. **Notification Preferences UI**: User-facing notification settings
8. **Webhook Triggers**: External event sources for notifications
