# Specification: Reverse Matching Engine (Carrier → Driver)

## 1. Overview

The Reverse Matching Engine enables carriers and fleet owners to actively search, filter, and match with qualified CDL drivers from the LMDR driver pool. This is the **primary revenue driver** for the platform - while driver-to-carrier matching is free (acquisition), carrier-to-driver matching is a paid subscription service.

### Business Model

| Component | Role | Cost |
|-----------|------|------|
| Driver → Carrier Matching | Acquisition tool | FREE |
| Carrier → Driver Matching | Revenue driver | PAID (tiered) |

---

## 2. Target Users

| Persona | Description | Primary Use Case |
|---------|-------------|------------------|
| **Carrier Recruiter** | In-house recruiter for a single carrier | Find drivers matching company needs |
| **Agency Recruiter** | Third-party recruiter for multiple carriers | Find drivers for multiple clients |
| **Fleet Owner** | Owner-operator with small fleet (1-50 trucks) | Find drivers for specific equipment |
| **Enterprise Fleet** | Large fleet operations (50+ trucks) | High-volume driver sourcing |

---

## 3. Current State vs. Desired State

### 3.1 Current State (Driver-Initiated Only)

```
Driver → Enters Preferences → Sees Matched Carriers → Clicks "I'm Interested"
                                                              ↓
                                                    Recruiter sees in pipeline
                                                    (PASSIVE RECEIPT ONLY)
```

**Problems:**
- Carriers can only see drivers who already expressed interest
- No way to proactively search the driver pool
- No way to filter/match based on carrier hiring criteria
- No differentiated value proposition for paying customers

### 3.2 Desired State (Bidirectional Matching)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BIDIRECTIONAL MATCHING                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DRIVER (FREE)                              CARRIER (PAID)                  │
│  ─────────────                              ──────────────                  │
│  Enter preferences ──────────┐  ┌────────── Enter hiring criteria          │
│  Get carrier matches ────────┼──┼────────── Get driver matches              │
│  Express interest ───────────┼──┼────────── Reach out to drivers            │
│  Track applications ─────────┘  └────────── Manage recruitment pipeline     │
│                                                                             │
│                         MUTUAL MATCH                                        │
│                    (Driver interested +                                     │
│                     Carrier searching)                                      │
│                            ↓                                                │
│                   HIGH PRIORITY ALERT                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Subscription Tiers

### 4.1 Tier Comparison

| Feature | Free | Pro ($X/mo) | Enterprise ($Y/mo) |
|---------|------|-------------|-------------------|
| See interest count | ✅ "12 drivers interested" | ✅ | ✅ |
| View interested driver profiles | ❌ | ✅ | ✅ |
| Search driver pool | ❌ | ✅ | ✅ |
| Driver matches per month | 0 | 25 | Unlimited |
| Filter by CDL type | ❌ | ✅ | ✅ |
| Filter by location | ❌ | ✅ | ✅ |
| Filter by experience | ❌ | ✅ | ✅ |
| Contact info on match | ❌ | ✅ | ✅ |
| Real-time match alerts | ❌ | ❌ | ✅ |
| API access | ❌ | ❌ | ✅ |
| Dedicated support | ❌ | ❌ | ✅ |
| Multiple users | 1 | 3 | Unlimited |

### 4.2 Pricing Strategy (TBD)

```
Pro:        $199-299/month
Enterprise: $499-999/month (or custom)
```

---

## 5. Data Model

### 5.1 New Collections

#### CarrierHiringPreferences

Stores the hiring criteria for carrier-to-driver matching.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `_owner` | String | Wix member ID |
| `carrier_dot` | String | DOT number (FK to Carriers) |
| `recruiter_id` | String | Recruiter who created (FK) |
| `required_cdl_types` | Array[String] | ['A', 'B'] |
| `required_endorsements` | Array[String] | ['hazmat', 'tanker', 'doubles'] |
| `min_experience_years` | Number | Minimum years driving |
| `max_experience_years` | Number | Maximum years (optional) |
| `target_zip_codes` | Array[String] | Preferred driver home zips |
| `target_radius_miles` | Number | Radius from terminals |
| `target_states` | Array[String] | ['TX', 'OK', 'LA'] |
| `offered_pay_min` | Number | Minimum CPM offered |
| `offered_pay_max` | Number | Maximum CPM offered |
| `route_types` | Array[String] | ['OTR', 'Regional', 'Local'] |
| `equipment_types` | Array[String] | ['Dry Van', 'Reefer', 'Flatbed'] |
| `urgency` | String | 'immediate', '30_day', 'ongoing' |
| `positions_open` | Number | Number of open positions |
| `is_active` | Boolean | Whether actively searching |
| `_createdDate` | DateTime | Created timestamp |
| `_updatedDate` | DateTime | Last updated |

#### CarrierSubscriptions

Manages subscription tiers and usage quotas.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `_owner` | String | Wix member ID |
| `carrier_dot` | String | DOT number (FK to Carriers) |
| `plan_type` | String | 'free', 'pro', 'enterprise' |
| `monthly_view_quota` | Number | Max profile views per month |
| `views_used_this_month` | Number | Current usage count |
| `quota_reset_date` | DateTime | When quota resets |
| `stripe_customer_id` | String | Stripe customer ID |
| `stripe_subscription_id` | String | Stripe subscription ID |
| `billing_email` | String | Email for invoices |
| `is_active` | Boolean | Subscription active |
| `trial_ends_at` | DateTime | Trial end date (if applicable) |
| `_createdDate` | DateTime | Subscription start |
| `_updatedDate` | DateTime | Last modified |

#### CarrierDriverViews

Tracks which drivers a carrier has viewed (for quota tracking and analytics).

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `carrier_dot` | String | DOT number (FK) |
| `recruiter_id` | String | Who viewed |
| `driver_id` | String | Driver profile ID (FK) |
| `view_type` | String | 'match_list', 'full_profile', 'contact_reveal' |
| `match_score` | Number | Score at time of view |
| `action_taken` | String | 'none', 'saved', 'contacted', 'rejected' |
| `billing_period` | String | '2025-01' for quota tracking |
| `_createdDate` | DateTime | View timestamp |

#### CarrierDriverOutreach

Tracks carrier outreach to drivers.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `carrier_dot` | String | DOT number (FK) |
| `recruiter_id` | String | Who reached out |
| `driver_id` | String | Driver profile ID (FK) |
| `outreach_type` | String | 'email', 'message', 'call_scheduled' |
| `message_content` | String | Message sent (if applicable) |
| `status` | String | 'sent', 'opened', 'replied', 'no_response' |
| `_createdDate` | DateTime | Outreach timestamp |

### 5.2 Extended Collections

#### DriverProfiles (Extend)

Add fields to support reverse matching visibility:

| Field | Type | Description |
|-------|------|-------------|
| `is_searchable` | Boolean | Opt-in to driver pool (default: true) |
| `visibility_level` | String | 'full', 'limited', 'hidden' |
| `last_active_date` | DateTime | For "active driver" filtering |
| `profile_views_count` | Number | Analytics - how many carriers viewed |
| `outreach_received_count` | Number | How many contacts received |

---

## 6. Scoring Algorithm (Reverse)

### 6.1 Driver Scoring Weights

Mirror of carrier scoring, but evaluating drivers against carrier criteria:

```javascript
const REVERSE_WEIGHTS = {
  qualifications: 30,   // CDL type, endorsements, clean record
  experience: 20,       // Years driving, equipment familiarity
  location: 20,         // Distance from carrier terminals
  availability: 15,     // Ready now vs. 30-day notice
  salary_fit: 10,       // Driver expectation vs. carrier offer
  engagement: 5         // Platform activity, response rate
};
```

### 6.2 Scoring Functions

| Function | Description | Score Range |
|----------|-------------|-------------|
| `scoreQualifications()` | CDL match, endorsements, violations | 0-100 |
| `scoreExperience()` | Years driving, equipment types | 0-100 |
| `scoreLocation()` | Distance from terminals | 0-100 |
| `scoreAvailability()` | Immediate, 2-week, 30-day | 0-100 |
| `scoreSalaryFit()` | Driver expectation vs. offer | 0-100 |
| `scoreEngagement()` | Login recency, response rate | 0-100 |

### 6.3 Match Rationale

Generate human-readable explanations:
- "Holds Class A CDL with hazmat endorsement you require"
- "Located 45 miles from your Dallas terminal"
- "5 years experience with reefer equipment"
- "Available to start immediately"

---

## 7. Core Screens

### 7.1 Carrier Search Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DRIVER SEARCH                                              [Pro Plan] 18/25│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  FILTERS                                                             │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  CDL Type: [A ▼]   Endorsements: [Hazmat ✓] [Tanker ✓] [Doubles ☐]  │   │
│  │  Experience: [3+ years ▼]   Location: [Within 100mi of 75201 ▼]     │   │
│  │  Availability: [Any ▼]   Route Type: [OTR ▼]                        │   │
│  │                                                    [Search Drivers]  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Found 47 matching drivers                              Sort: [Best Match ▼]│
│  ───────────────────────────────────────────────────────────────────────── │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ★ 94% Match                                          [View Profile] │   │
│  │  John D. • Dallas, TX • Class A + Hazmat + Tanker                   │   │
│  │  7 years experience • Available immediately                          │   │
│  │  "Strong match: Has all required endorsements, local to terminal"   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ★ 87% Match                                          [View Profile] │   │
│  │  Maria S. • Fort Worth, TX • Class A + Hazmat                       │   │
│  │  4 years experience • Available in 2 weeks                           │   │
│  │  "Good match: Missing tanker endorsement but strong experience"      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [Load More...]                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Driver Profile View (Paid Feature)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Back to Search                                           1 view used     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐  JOHN D.                                        ★ 94% Match  │
│  │          │  Dallas, TX 75201                                             │
│  │  [Photo] │  Class A CDL • Hazmat • Tanker • Doubles                     │
│  │          │  7 years experience                                           │
│  └──────────┘  ✓ Verified Driver                                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  WHY THIS DRIVER MATCHES                                             │   │
│  │  • Holds all 3 endorsements you require (hazmat, tanker, doubles)   │   │
│  │  • Located 12 miles from your Dallas terminal                        │   │
│  │  • 7 years OTR experience exceeds your 3-year minimum               │   │
│  │  • Available to start immediately                                    │   │
│  │  • Pay expectation ($0.58 CPM) within your range                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  EXPERIENCE                           PREFERENCES                           │
│  ────────────                         ───────────                           │
│  • 7 years Class A                    • OTR or Regional                    │
│  • Dry Van, Reefer, Tanker            • Min $0.55 CPM                      │
│  • 2.1M lifetime miles                • Max 3 weeks out                    │
│  • Clean MVR (0 violations)           • Newer equipment preferred          │
│                                                                             │
│  WORK HISTORY                                                               │
│  ────────────                                                               │
│  Swift Transport (2020-2024) • Left: Better opportunity                    │
│  Werner Enterprises (2018-2020) • Left: Home time                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [Save to Pipeline]  [Send Message]  [Schedule Call]  [Make Offer]  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Subscription Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SUBSCRIPTION & BILLING                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CURRENT PLAN: Pro                                                          │
│  ─────────────────                                                          │
│  $249/month • Renews Jan 25, 2026                                          │
│                                                                             │
│  USAGE THIS MONTH                                                           │
│  ─────────────────                                                          │
│  Driver Views: 18/25                                                        │
│  ████████████████░░░░░░░░ 72%                                              │
│  Resets in 12 days                                                          │
│                                                                             │
│  [Upgrade to Enterprise]  [Manage Payment]  [View Invoices]                │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────── │
│                                                                             │
│  UPGRADE TO ENTERPRISE                                                      │
│  • Unlimited driver views                                                   │
│  • Real-time match alerts                                                   │
│  • API access for ATS integration                                          │
│  • Dedicated support                                                        │
│                                                                             │
│  [Contact Sales]                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Integration Points

### 8.1 Existing Services

| Service | Integration |
|---------|-------------|
| `recruiter_service.jsw` | Extend with driver search capabilities |
| `driverProfiles.jsw` | Query for searchable drivers |
| `scoring.js` | Add reverse scoring functions |
| `carrierMatching.jsw` | Reference architecture for reverse flow |

### 8.2 New Services

| Service | Purpose |
|---------|---------|
| `driverScoring.js` | Pure scoring functions (mirrors scoring.js) |
| `driverMatching.jsw` | Main reverse matching engine |
| `carrierPreferences.jsw` | Hiring criteria CRUD |
| `subscriptionService.jsw` | Tier management, quota tracking |
| `driverOutreach.jsw` | Contact, save, pipeline actions |

### 8.3 External Integrations

| Service | Purpose | Phase |
|---------|---------|-------|
| Stripe | Subscription billing | Phase 5 |
| SendGrid | Outreach emails | Phase 6 |
| Twilio | SMS notifications (Enterprise) | Phase 7 |

---

## 9. Security & Privacy

### 9.1 Driver Privacy Controls

- Drivers can opt-out of search pool (`is_searchable = false`)
- Visibility levels: full, limited (no contact info), hidden
- Contact info only revealed to paid subscribers who "view profile"
- Drivers notified when profile is viewed (optional setting)

### 9.2 Access Control

- All reverse matching endpoints require authenticated recruiter
- Subscription tier checked before each search/view
- Quota enforcement at service layer
- Audit log of all profile views and outreach

### 9.3 Data Protection

- PII (phone, email) masked in search results
- Full contact revealed only on explicit "View Profile" action
- View counts against quota
- Rate limiting on search API (prevent scraping)

---

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Carrier conversion (free→paid) | 15% | Signup to subscription |
| Monthly driver views utilized | 80% | Views used / quota |
| Carrier response rate | 30% | Outreach → driver reply |
| Driver hire rate | 5% | Outreach → hire |
| Subscription churn | <5%/month | Cancellations / active |
| MRR growth | 20%/month | Month-over-month revenue |
| NPS (carriers) | >50 | Quarterly survey |

---

## 11. Implementation Priority

| Phase | Focus | Business Impact |
|-------|-------|-----------------|
| 1 | Data model & core scoring | Foundation |
| 2 | Basic search & match | MVP for testing |
| 3 | Profile viewing & quotas | Monetization gate |
| 4 | Subscription management | Revenue collection |
| 5 | Stripe integration | Billing automation |
| 6 | Outreach & messaging | Engagement |
| 7 | Enterprise features | Upsell path |
| 8 | Analytics & optimization | Growth |

---

## 12. Open Questions

1. **Pricing**: What are competitive rates for similar platforms?
2. **Trial Period**: Should Pro tier have a free trial? How long?
3. **Refunds**: Policy for unused views?
4. **Driver Incentives**: Should drivers who get hired receive anything?
5. **Mutual Matches**: Special treatment when driver interested + carrier searching?
