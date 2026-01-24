# Track Spec: External API Platform - Partner Data Services

## 1. Overview

Transform LMDR's internal platform capabilities into a monetized B2B API ecosystem. External partners can access trucking industry intelligence, safety data, matching algorithms, and operational utilities through standardized REST APIs with tiered pricing.

### 1.1 Business Goals

| Goal | Metric | Target |
|------|--------|--------|
| Revenue diversification | Annual Recurring Revenue | $300K Year 1 |
| Partner acquisition | Active API partners | 25 partners |
| API adoption | Monthly API calls | 1M+ calls |
| Platform reliability | Uptime SLA | 99.9% |
| Developer experience | Time to first call | <30 minutes |
| Partner retention | Annual churn rate | <15% |

### 1.2 API Product Categories

1. **Safety & Compliance APIs** - FMCSA data, CSA monitoring, compliance alerts
2. **Intelligence APIs** - AI-enriched carrier data, social sentiment, market insights
3. **Operational APIs** - Truck parking, fuel pricing, route optimization
4. **Matching APIs** - Driver search, carrier matching, qualification verification
5. **Document APIs** - CDL OCR extraction, document verification
6. **Engagement APIs** - Gamification hooks, achievement webhooks (white-label)

### 1.3 Target Partner Segments

| Segment | Use Cases | Example Partners |
|---------|-----------|------------------|
| **TMS/Dispatch** | Parking availability, fuel stops, safety alerts | McLeod, TMW, Samsara |
| **Insurance/Risk** | FMCSA data, CSA trends, safety scoring | Progressive Commercial, Great West |
| **Staffing Agencies** | Driver matching, carrier intelligence | TrueBlue, Allegis |
| **HR/Background Check** | CDL verification, qualification data | Checkr, Sterling |
| **Fuel Cards** | Fuel pricing, discount optimization | Comdata, EFS, WEX |
| **Job Boards** | Carrier matching, job recommendations | Indeed, CDLjobs |
| **ELD Providers** | Parking, compliance alerts | KeepTruckin, Samsara |
| **Fleet Management** | Safety monitoring, driver insights | Fleetio, Verizon Connect |

## 2. Architecture

### 2.1 API Gateway Architecture

```
+------------------------------------------------------------------------+
|                         EXTERNAL API PLATFORM                           |
+------------------------------------------------------------------------+
|                                                                          |
|  +---------------------------+     +---------------------------+         |
|  |     API GATEWAY           |     |    DEVELOPER PORTAL       |         |
|  |                           |     |                           |         |
|  |  - Rate Limiting          |     |  - API Documentation      |         |
|  |  - Authentication         |     |  - API Key Management     |         |
|  |  - Request Validation     |     |  - Usage Dashboard        |         |
|  |  - Response Caching       |     |  - Billing Portal         |         |
|  |  - Usage Metering         |     |  - Sandbox Environment    |         |
|  |  - IP Whitelisting        |     |  - Code Examples          |         |
|  +-------------+-------------+     +---------------------------+         |
|                |                                                         |
|                v                                                         |
|  +------------------------------------------------------------------+   |
|  |                    API ROUTING LAYER                              |   |
|  +------------------------------------------------------------------+   |
|                |                    |                    |               |
|       +--------v--------+  +--------v--------+  +--------v--------+     |
|       | Safety APIs     |  | Intelligence    |  | Operational     |     |
|       |                 |  | APIs            |  | APIs            |     |
|       | - FMCSA         |  | - Carrier Intel |  | - Parking       |     |
|       | - CSA Monitor   |  | - Social Sent.  |  | - Fuel Pricing  |     |
|       | - Compliance    |  | - Market Data   |  | - Route Plan    |     |
|       +-----------------+  +-----------------+  +-----------------+     |
|                |                    |                    |               |
|       +--------v--------+  +--------v--------+  +--------v--------+     |
|       | Matching APIs   |  | Document APIs   |  | Engagement APIs |     |
|       |                 |  |                 |  |                 |     |
|       | - Driver Search |  | - CDL OCR       |  | - Gamification  |     |
|       | - Carrier Match |  | - Doc Verify    |  | - Achievements  |     |
|       | - Qualification |  | - Med Cert      |  | - Webhooks      |     |
|       +-----------------+  +-----------------+  +-----------------+     |
|                                                                          |
+------------------------------------------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|                    EXISTING LMDR BACKEND SERVICES                       |
+------------------------------------------------------------------------+
| fmcsaService | aiEnrichment | parkingService | fuelService | ocrService |
| driverMatching | carrierMatching | socialScanner | gamificationService  |
+------------------------------------------------------------------------+
```

### 2.2 Request Flow

```
                    API REQUEST FLOW
                    =================

+----------+     +----------+     +------------+     +-------------+
| Partner  | --> | API      | --> | Auth &     | --> | Rate Limit  |
| Request  |     | Gateway  |     | Validation |     | Check       |
+----------+     +----------+     +------------+     +-------------+
                                                            |
                                       +--------------------+
                                       |
                      +----------------v-----------------+
                      |         CACHE CHECK              |
                      |  (Redis/CDN for common queries)  |
                      +----------------+-----------------+
                                       |
                    +------------------+------------------+
                    |                                     |
                    v                                     v
            +--------------+                      +--------------+
            | Cache HIT    |                      | Cache MISS   |
            | Return cached|                      | Call Backend |
            +--------------+                      +--------------+
                    |                                     |
                    |                                     v
                    |                            +--------------+
                    |                            | Backend      |
                    |                            | Service      |
                    |                            +--------------+
                    |                                     |
                    +------------------+------------------+
                                       |
                                       v
                            +-------------------+
                            | Usage Metering    |
                            | (Log API call)    |
                            +-------------------+
                                       |
                                       v
                            +-------------------+
                            | Response Format   |
                            | (Standardized)    |
                            +-------------------+
                                       |
                                       v
                            +-------------------+
                            | Return to Partner |
                            +-------------------+
```

### 2.3 Authentication Flow

```
                    API AUTHENTICATION
                    ==================

+----------+     +-----------+     +------------+
| Partner  | --> | Include   | --> | Gateway    |
| App      |     | API Key   |     | Validates  |
+----------+     | in Header |     | Key        |
                 +-----------+     +------------+
                                         |
                        +----------------+----------------+
                        |                                 |
                        v                                 v
                 +-----------+                    +-----------+
                 | Valid Key |                    | Invalid   |
                 | + Active  |                    | Key       |
                 | Sub       |                    +-----------+
                 +-----------+                          |
                        |                               v
                        v                        +------------+
                 +-----------+                   | 401 Error  |
                 | Check     |                   | Response   |
                 | Tier &    |                   +------------+
                 | Quotas    |
                 +-----------+
                        |
           +------------+------------+
           |            |            |
           v            v            v
    +-----------+ +-----------+ +-----------+
    | Starter   | | Growth    | | Enterprise|
    | Tier      | | Tier      | | Tier      |
    | Limits    | | Limits    | | Unlimited |
    +-----------+ +-----------+ +-----------+
```

## 3. API Products

### 3.1 Safety & Compliance APIs

#### 3.1.1 FMCSA Carrier Lookup API

**Endpoint:** `GET /v1/safety/carrier/{dot_number}`

**Description:** Real-time FMCSA safety data for any carrier by DOT number.

**Response:**
```json
{
  "dot_number": 123456,
  "legal_name": "ABC Trucking LLC",
  "dba_name": "ABC Transport",
  "operating_status": "ACTIVE",
  "entity_type": "CARRIER",
  "physical_address": {
    "street": "123 Main St",
    "city": "Memphis",
    "state": "TN",
    "zip": "38101"
  },
  "safety_rating": {
    "rating": "SATISFACTORY",
    "rating_date": "2024-06-15",
    "review_date": "2025-01-10"
  },
  "basic_scores": {
    "unsafe_driving": { "score": 45, "percentile": 62, "alert": false },
    "hours_of_service": { "score": 32, "percentile": 48, "alert": false },
    "driver_fitness": { "score": 0, "percentile": 0, "alert": false },
    "controlled_substances": { "score": 0, "percentile": 0, "alert": false },
    "vehicle_maintenance": { "score": 28, "percentile": 41, "alert": false },
    "hazmat": { "score": null, "percentile": null, "alert": false },
    "crash_indicator": { "score": 15, "percentile": 22, "alert": false }
  },
  "inspections": {
    "total": 127,
    "driver_oos_rate": 4.2,
    "vehicle_oos_rate": 18.5,
    "national_avg_driver_oos": 5.51,
    "national_avg_vehicle_oos": 20.72
  },
  "crashes": {
    "total": 3,
    "fatal": 0,
    "injury": 1,
    "tow_away": 2
  },
  "fleet": {
    "power_units": 45,
    "drivers": 52,
    "mcs150_mileage": 4500000,
    "mcs150_year": 2024
  },
  "authority": {
    "common": true,
    "contract": true,
    "broker": false,
    "cargo_carried": ["General Freight", "Household Goods"]
  },
  "cached_at": "2026-01-23T10:30:00Z",
  "cache_ttl_hours": 168
}
```

**Rate Limits:**
| Tier | Requests/Min | Requests/Month |
|------|--------------|----------------|
| Starter | 10 | 5,000 |
| Growth | 60 | 50,000 |
| Enterprise | 300 | Unlimited |

---

#### 3.1.2 CSA Score Monitor API

**Endpoint:** `GET /v1/safety/csa/{dot_number}/history`

**Description:** Historical CSA score tracking with trend analysis.

**Response:**
```json
{
  "dot_number": 123456,
  "current_scores": { ... },
  "history": [
    {
      "snapshot_date": "2026-01-01",
      "scores": { ... },
      "alerts_active": 0
    },
    {
      "snapshot_date": "2025-12-01",
      "scores": { ... },
      "alerts_active": 1,
      "alert_categories": ["vehicle_maintenance"]
    }
  ],
  "trends": {
    "unsafe_driving": { "direction": "improving", "change_30d": -5 },
    "vehicle_maintenance": { "direction": "degrading", "change_30d": +8 }
  },
  "recommendations": [
    "Vehicle maintenance score trending up - recommend fleet inspection audit",
    "Consider driver safety training to maintain low Unsafe Driving score"
  ]
}
```

---

#### 3.1.3 Compliance Alerts API

**Endpoint:** `POST /v1/safety/alerts/subscribe`

**Description:** Subscribe to real-time compliance alerts for monitored carriers.

**Request:**
```json
{
  "dot_numbers": [123456, 789012],
  "alert_types": ["safety_rating_change", "basic_alert", "authority_change"],
  "webhook_url": "https://partner.com/webhooks/lmdr",
  "webhook_secret": "partner_secret_key"
}
```

**Webhook Payload:**
```json
{
  "event_type": "basic_alert",
  "dot_number": 123456,
  "carrier_name": "ABC Trucking LLC",
  "alert": {
    "category": "vehicle_maintenance",
    "previous_score": 65,
    "current_score": 78,
    "threshold_exceeded": true,
    "intervention_recommended": true
  },
  "timestamp": "2026-01-23T14:22:00Z"
}
```

---

### 3.2 Intelligence APIs

#### 3.2.1 Carrier Intelligence API

**Endpoint:** `GET /v1/intelligence/carrier/{dot_number}`

**Description:** AI-enriched carrier intelligence including pay rates, sentiment, and hiring status.

**Response:**
```json
{
  "dot_number": 123456,
  "legal_name": "ABC Trucking LLC",
  "enrichment": {
    "pay": {
      "cpm_range": { "min": 0.52, "max": 0.62, "confidence": "high" },
      "sign_on_bonus": { "amount": 5000, "confidence": "medium" },
      "home_time": "Weekly",
      "benefits": ["Health Insurance", "401k Match", "Paid Vacation"]
    },
    "sentiment": {
      "overall": "positive",
      "score": 7.2,
      "sample_size": 47,
      "themes": {
        "pay_satisfaction": "positive",
        "home_time": "positive",
        "equipment": "mixed",
        "management": "positive"
      }
    },
    "hiring_status": {
      "actively_hiring": true,
      "positions_open": ["OTR", "Regional"],
      "experience_required": "1 year minimum"
    },
    "sources": [
      { "platform": "reddit", "posts_analyzed": 23 },
      { "platform": "truckersreport", "posts_analyzed": 18 },
      { "platform": "company_website", "last_checked": "2026-01-20" }
    ]
  },
  "enriched_at": "2026-01-20T08:00:00Z",
  "confidence_level": "high"
}
```

---

#### 3.2.2 Social Sentiment API

**Endpoint:** `GET /v1/intelligence/sentiment/{dot_number}`

**Description:** Real-time social media sentiment analysis from driver communities.

**Response:**
```json
{
  "dot_number": 123456,
  "carrier_name": "ABC Trucking LLC",
  "sentiment_analysis": {
    "overall_score": 7.2,
    "rating": "positive",
    "confidence": "high",
    "sample_size": 89
  },
  "by_platform": {
    "reddit": {
      "score": 7.5,
      "posts_analyzed": 34,
      "subreddits": ["r/Truckers", "r/TruckDrivers"]
    },
    "truckersreport": {
      "score": 6.8,
      "threads_analyzed": 28
    },
    "twitter": {
      "score": 7.3,
      "tweets_analyzed": 27
    }
  },
  "key_themes": [
    { "theme": "pay", "sentiment": "positive", "mentions": 45 },
    { "theme": "home_time", "sentiment": "positive", "mentions": 32 },
    { "theme": "equipment_age", "sentiment": "negative", "mentions": 18 },
    { "theme": "dispatcher_support", "sentiment": "mixed", "mentions": 24 }
  ],
  "recent_mentions": [
    {
      "platform": "reddit",
      "date": "2026-01-22",
      "sentiment": "positive",
      "snippet": "Been with ABC for 6 months, consistently getting good miles..."
    }
  ],
  "warnings": [],
  "scanned_at": "2026-01-23T06:00:00Z"
}
```

---

#### 3.2.3 Market Intelligence API

**Endpoint:** `GET /v1/intelligence/market`

**Description:** Aggregated market data on hiring trends, pay benchmarks, and regional demand.

**Query Parameters:**
- `region` - Geographic region (state, region code)
- `freight_type` - Dry Van, Flatbed, Reefer, Tanker, etc.
- `operation_type` - OTR, Regional, Local, Dedicated

**Response:**
```json
{
  "query": {
    "region": "southeast",
    "freight_type": "dry_van",
    "operation_type": "otr"
  },
  "market_data": {
    "avg_cpm": 0.58,
    "cpm_range": { "p25": 0.52, "p50": 0.58, "p75": 0.65 },
    "avg_sign_on_bonus": 4500,
    "demand_index": 8.2,
    "demand_trend": "increasing",
    "driver_shortage_severity": "high"
  },
  "top_hiring_carriers": [
    { "name": "Carrier A", "positions_open": 120 },
    { "name": "Carrier B", "positions_open": 85 }
  ],
  "regional_insights": {
    "hot_lanes": ["Atlanta-Dallas", "Memphis-Chicago"],
    "seasonal_factors": "Q1 typically slower, expect pickup in March"
  },
  "data_date": "2026-01-23"
}
```

---

### 3.3 Operational APIs

#### 3.3.1 Truck Parking API

**Endpoint:** `GET /v1/parking/search`

**Description:** Real-time truck parking availability from TPIMS sensors and community reports.

**Query Parameters:**
- `lat`, `lng` - Center point coordinates
- `radius` - Search radius in miles (max 100)
- `amenities` - Filter by amenities (comma-separated)
- `min_spaces` - Minimum available spaces

**Response:**
```json
{
  "query": {
    "center": { "lat": 35.1495, "lng": -90.0490 },
    "radius_miles": 50
  },
  "results": [
    {
      "id": "pk_12345",
      "name": "I-40 Rest Area MM 215",
      "location": { "lat": 35.2010, "lng": -89.8542 },
      "distance_miles": 12.4,
      "availability": {
        "total_spaces": 85,
        "available_spaces": 23,
        "last_updated": "2026-01-23T14:30:00Z",
        "data_source": "tpims_sensor",
        "confidence": "high"
      },
      "amenities": ["restrooms", "vending", "wifi", "security"],
      "type": "rest_area",
      "highway": "I-40",
      "trend": "filling_up"
    },
    {
      "id": "pk_67890",
      "name": "Love's Travel Stop #247",
      "location": { "lat": 35.0821, "lng": -90.1234 },
      "distance_miles": 8.2,
      "availability": {
        "total_spaces": 120,
        "available_spaces": 45,
        "last_updated": "2026-01-23T14:15:00Z",
        "data_source": "community_report",
        "confidence": "medium"
      },
      "amenities": ["restrooms", "fuel", "showers", "restaurant", "scales"],
      "type": "truck_stop",
      "chain": "loves"
    }
  ],
  "total_results": 18,
  "coverage": {
    "tpims_states": ["TN", "AR", "MS"],
    "sensor_locations": 12,
    "community_locations": 6
  }
}
```

**Data Sources:**
- Indiana DOT TPIMS
- Kentucky TPIMS
- Minnesota DOT
- Illinois DOT
- Ohio OHGO
- Wisconsin 511
- Arizona 511
- Georgia 511
- California Caltrans
- Community reports

---

#### 3.3.2 Fuel Pricing API

**Endpoint:** `GET /v1/fuel/prices`

**Description:** Diesel pricing with fuel card discount calculations.

**Query Parameters:**
- `lat`, `lng` - Center point
- `radius` - Search radius (max 50 miles)
- `fuel_cards` - Comma-separated card types for discount calc

**Response:**
```json
{
  "query": {
    "center": { "lat": 35.1495, "lng": -90.0490 },
    "radius_miles": 25,
    "fuel_cards": ["comdata", "efs"]
  },
  "results": [
    {
      "id": "fs_12345",
      "name": "Pilot Flying J #382",
      "location": { "lat": 35.1201, "lng": -90.0123 },
      "distance_miles": 3.2,
      "diesel": {
        "retail_price": 3.459,
        "discounts": {
          "comdata": { "discount": 0.08, "effective_price": 3.379 },
          "efs": { "discount": 0.05, "effective_price": 3.409 }
        },
        "best_price": 3.379,
        "best_card": "comdata",
        "savings_per_100_gal": 8.00
      },
      "def_available": true,
      "def_price": 2.899,
      "amenities": ["scales", "restaurant", "showers", "atm"],
      "last_updated": "2026-01-23T12:00:00Z"
    }
  ],
  "regional_avg": 3.52,
  "state_avg": { "TN": 3.48, "AR": 3.55 }
}
```

---

#### 3.3.3 Route Fuel Planner API

**Endpoint:** `POST /v1/fuel/plan`

**Description:** Optimal fuel stop planning along a route.

**Request:**
```json
{
  "origin": { "lat": 35.1495, "lng": -90.0490 },
  "destination": { "lat": 33.7490, "lng": -84.3880 },
  "fuel_cards": ["comdata"],
  "tank_capacity_gallons": 200,
  "current_fuel_gallons": 50,
  "mpg": 6.5
}
```

**Response:**
```json
{
  "route_summary": {
    "total_distance_miles": 385,
    "estimated_fuel_needed_gallons": 59.2,
    "stops_recommended": 1
  },
  "recommended_stops": [
    {
      "location": { ... },
      "name": "Love's Travel Stop",
      "mile_marker": 180,
      "effective_price": 3.299,
      "estimated_savings": 12.40,
      "reason": "Lowest price in 50-mile window"
    }
  ],
  "total_fuel_cost_estimate": 195.29,
  "total_savings_with_card": 12.40
}
```

---

### 3.4 Matching APIs

#### 3.4.1 Driver Search API

**Endpoint:** `POST /v1/matching/drivers/search`

**Description:** Search qualified drivers matching specific criteria. (Requires Enterprise tier)

**Request:**
```json
{
  "filters": {
    "cdl_class": "A",
    "endorsements_required": ["H", "N"],
    "min_experience_years": 2,
    "max_distance_miles": 100,
    "location": { "lat": 35.1495, "lng": -90.0490 },
    "availability": ["immediate", "2_weeks"]
  },
  "carrier_preferences": {
    "freight_types": ["tanker", "hazmat"],
    "operation_type": "regional"
  },
  "limit": 25
}
```

**Response:**
```json
{
  "total_matches": 47,
  "results": [
    {
      "driver_id": "drv_abc123",
      "match_score": 92,
      "score_breakdown": {
        "endorsements": 100,
        "experience": 85,
        "location": 95,
        "availability": 90
      },
      "profile": {
        "cdl_class": "A",
        "endorsements": ["H", "N", "T"],
        "years_experience": 5,
        "location": { "city": "Memphis", "state": "TN" },
        "distance_miles": 12,
        "availability": "immediate"
      },
      "contact_available": true
    }
  ],
  "search_id": "srch_xyz789",
  "credits_used": 1
}
```

---

#### 3.4.2 Carrier Match API

**Endpoint:** `POST /v1/matching/carriers`

**Description:** Get ranked carrier recommendations for a driver profile.

**Request:**
```json
{
  "driver_profile": {
    "cdl_class": "A",
    "endorsements": ["H", "N"],
    "years_experience": 3,
    "location_zip": "38101",
    "preferences": {
      "operation_type": ["regional", "dedicated"],
      "min_cpm": 0.55,
      "home_time": "weekly",
      "freight_types": ["dry_van", "reefer"]
    }
  },
  "limit": 10,
  "include_enrichment": true
}
```

**Response:**
```json
{
  "total_matches": 156,
  "results": [
    {
      "carrier": {
        "dot_number": 123456,
        "name": "ABC Trucking",
        "location": "Memphis, TN"
      },
      "match_score": 94,
      "score_breakdown": {
        "location": 25,
        "pay": 19,
        "operation_type": 15,
        "safety": 10,
        "turnover": 10,
        "truck_age": 8,
        "fleet_size": 5,
        "quality": 2
      },
      "enrichment": {
        "cpm_range": { "min": 0.58, "max": 0.65 },
        "sentiment": "positive",
        "hiring_status": "actively_hiring"
      },
      "safety_summary": {
        "rating": "SATISFACTORY",
        "alerts": 0
      }
    }
  ]
}
```

---

### 3.5 Document APIs

#### 3.5.1 CDL Extraction API

**Endpoint:** `POST /v1/documents/cdl/extract`

**Description:** OCR extraction from CDL images with dual-pass verification.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `image` (file upload)

**Response:**
```json
{
  "extraction_id": "ext_abc123",
  "status": "complete",
  "confidence": "high",
  "extracted_data": {
    "full_name": "JOHN MICHAEL SMITH",
    "license_number": "S123456789012",
    "state": "TN",
    "cdl_class": "A",
    "endorsements": ["H", "N", "T"],
    "restrictions": ["L"],
    "date_of_birth": "1985-03-15",
    "expiration_date": "2027-03-15",
    "address": {
      "street": "123 MAIN ST",
      "city": "MEMPHIS",
      "state": "TN",
      "zip": "38101"
    }
  },
  "verification": {
    "format_valid": true,
    "state_format_match": true,
    "expiration_valid": true,
    "dual_pass_consensus": true
  },
  "warnings": []
}
```

---

#### 3.5.2 Medical Certificate API

**Endpoint:** `POST /v1/documents/medcert/extract`

**Description:** Extract Medical Examiner's Certificate data.

**Response:**
```json
{
  "extraction_id": "ext_def456",
  "status": "complete",
  "extracted_data": {
    "driver_name": "JOHN M SMITH",
    "examiner_name": "DR. JANE DOE",
    "examiner_registry_number": "1234567890",
    "examination_date": "2025-11-15",
    "expiration_date": "2027-11-15",
    "certification_type": "2_year",
    "restrictions": []
  },
  "verification": {
    "registry_valid": true,
    "expiration_valid": true
  }
}
```

---

### 3.6 Engagement APIs (Gamification White-Label)

#### 3.6.1 User Progress API

**Endpoint:** `GET /v1/engagement/user/{user_id}/progress`

**Description:** Get gamification progress for a user (for white-label integration).

**Response:**
```json
{
  "user_id": "usr_abc123",
  "user_type": "driver",
  "progression": {
    "level": 5,
    "level_title": "Route Master",
    "current_xp": 1247,
    "xp_to_next_level": 253,
    "total_xp": 1247
  },
  "streak": {
    "current_days": 12,
    "longest_streak": 28,
    "streak_multiplier": 1.15
  },
  "badges": [
    { "id": "verified_cdl", "name": "Verified CDL", "earned_at": "2026-01-10" },
    { "id": "quick_draw", "name": "Quick Draw", "earned_at": "2026-01-22" }
  ],
  "recent_achievements": [
    { "id": "profile_pioneer", "name": "Profile Pioneer", "xp_earned": 200 }
  ]
}
```

---

#### 3.6.2 Award XP API

**Endpoint:** `POST /v1/engagement/xp/award`

**Description:** Award XP for custom actions in partner platforms.

**Request:**
```json
{
  "user_id": "usr_abc123",
  "action": "custom_training_complete",
  "xp_amount": 50,
  "metadata": {
    "training_name": "Safety Refresher Course",
    "partner_reference": "training_12345"
  }
}
```

---

#### 3.6.3 Achievement Webhooks

**Endpoint:** `POST /v1/engagement/webhooks/subscribe`

**Description:** Subscribe to achievement events for external notifications.

**Webhook Events:**
- `level_up` - User leveled up
- `achievement_earned` - New achievement unlocked
- `badge_earned` - Badge awarded
- `streak_milestone` - Streak milestone reached (7, 30, 60, 90 days)
- `challenge_complete` - Challenge completed

---

## 4. Data Model

### 4.1 API Management Collections

#### ApiPartners Collection
```
_id: String (auto)
partner_id: String                    // Unique partner identifier
company_name: String
contact_email: String
contact_name: String
tier: String                          // "starter", "growth", "enterprise", "custom"
status: String                        // "active", "suspended", "churned"
api_keys: Array<{
  key_id: String,
  key_hash: String,                   // Hashed API key
  name: String,                       // Key name/description
  created_at: Date,
  last_used_at: Date,
  is_active: Boolean
}>
ip_whitelist: Array<String>           // Allowed IP addresses (optional)
webhook_url: String
webhook_secret: String
created_at: Date
updated_at: Date
```

#### ApiSubscriptions Collection
```
_id: String (auto)
partner_id: Reference -> ApiPartners
tier: String
plan_type: String                     // "monthly", "annual"
price_monthly: Number
api_products: Array<String>           // Enabled API product IDs
rate_limits: {
  requests_per_minute: Number,
  requests_per_month: Number
}
quotas: {
  driver_searches_monthly: Number,
  document_extractions_monthly: Number
}
stripe_subscription_id: String
current_period_start: Date
current_period_end: Date
status: String                        // "active", "past_due", "cancelled"
```

#### ApiUsage Collection
```
_id: String (auto)
partner_id: Reference -> ApiPartners
period_start: Date                    // Monthly period start
period_end: Date
usage: {
  total_requests: Number,
  requests_by_endpoint: Object,       // { "/v1/safety/carrier": 1500, ... }
  requests_by_day: Array<{ date: Date, count: Number }>,
  errors: Number,
  avg_latency_ms: Number
}
quotas_used: {
  driver_searches: Number,
  document_extractions: Number
}
billing_amount: Number                // Calculated overage charges
```

#### ApiRequestLog Collection
```
_id: String (auto)
partner_id: String
api_key_id: String
endpoint: String
method: String
request_params: Object                // Sanitized params (no PII)
response_status: Number
response_time_ms: Number
cache_hit: Boolean
error_message: String                 // If error occurred
ip_address: String
user_agent: String
created_at: Date
```

### 4.2 API Products Configuration

#### ApiProducts Collection
```
_id: String (auto)
product_id: String                    // "safety_fmcsa", "intelligence_carrier"
name: String
description: String
category: String                      // "safety", "intelligence", "operational", etc.
base_endpoint: String                 // "/v1/safety"
endpoints: Array<{
  path: String,
  method: String,
  description: String,
  rate_limit_override: Number         // Per-endpoint rate limit
}>
pricing: {
  included_in_tiers: Array<String>,   // ["growth", "enterprise"]
  overage_price_per_call: Number      // For usage-based
}
is_active: Boolean
documentation_url: String
```

## 5. Pricing Model

### 5.1 Subscription Tiers

| Tier | Monthly Price | Annual Price | Target Partner |
|------|---------------|--------------|----------------|
| **Starter** | $199/mo | $1,990/yr (save 17%) | Small integrators, POC |
| **Growth** | $499/mo | $4,990/yr (save 17%) | Mid-size partners |
| **Enterprise** | $999/mo | $9,990/yr (save 17%) | Large platforms |
| **Custom** | Contact sales | Negotiated | Strategic partners |

### 5.2 Tier Inclusions

| Feature | Starter | Growth | Enterprise |
|---------|---------|--------|------------|
| **Rate Limit** | 10/min | 60/min | 300/min |
| **Monthly Requests** | 5,000 | 50,000 | Unlimited |
| **Safety APIs** | Yes | Yes | Yes |
| **Intelligence APIs** | Basic | Full | Full |
| **Parking API** | Yes | Yes | Yes |
| **Fuel API** | No | Yes | Yes |
| **Driver Search API** | No | 100/mo | Unlimited |
| **Document OCR API** | No | 50/mo | 500/mo |
| **Engagement APIs** | No | No | Yes |
| **Webhook Support** | 1 endpoint | 5 endpoints | Unlimited |
| **Support** | Email | Email + Chat | Dedicated CSM |
| **SLA** | 99% | 99.5% | 99.9% |
| **Sandbox Access** | Yes | Yes | Yes |
| **Custom Endpoints** | No | No | Yes |

### 5.3 Usage-Based Add-Ons

| Add-On | Price | Notes |
|--------|-------|-------|
| Additional requests | $0.005/request | After monthly quota |
| Driver Search credits | $2/search | Growth tier |
| Document OCR | $0.50/extraction | After quota |
| Priority support | $200/mo | For Starter/Growth |
| Custom SLA | Contact sales | 99.95%+ uptime |
| Dedicated IP range | $100/mo | Enterprise |

### 5.4 Bundle Packages

| Bundle | Included APIs | Price | Savings |
|--------|---------------|-------|---------|
| **Safety Suite** | FMCSA + CSA Monitor + Compliance Alerts | $399/mo | 20% |
| **Recruiting Suite** | Driver Search + Carrier Intel + Sentiment | $699/mo | 15% |
| **Operations Suite** | Parking + Fuel + Route Planning | $349/mo | 20% |
| **Full Platform** | All APIs | $1,499/mo | 25% |

## 6. Security

### 6.1 Authentication

- **API Keys**: 64-character random strings, hashed storage (bcrypt)
- **Key Rotation**: Partners can rotate keys via portal
- **Multiple Keys**: Up to 5 active keys per partner
- **Key Scoping**: Optional endpoint restrictions per key

### 6.2 Authorization

```
Authorization: Bearer lmdr_live_abc123...
```

- All requests require valid API key in header
- Key validated against ApiPartners collection
- Tier and quota checked before processing
- IP whitelist enforcement (optional)

### 6.3 Rate Limiting

| Layer | Implementation |
|-------|----------------|
| Per-minute | Sliding window counter (Redis) |
| Per-month | Increment counter in ApiUsage |
| Per-endpoint | Override limits for expensive operations |
| Burst protection | Token bucket for short bursts |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1706025600
X-Quota-Limit: 50000
X-Quota-Remaining: 48500
X-Quota-Reset: 2026-02-01
```

### 6.4 Data Security

| Measure | Implementation |
|---------|----------------|
| Transport | TLS 1.3 required |
| PII masking | Driver contact info masked unless authorized |
| Request logging | Sanitized logs (no API keys, limited PII) |
| Data retention | Request logs: 90 days, Usage data: 2 years |
| Audit trail | All admin actions logged |

### 6.5 Error Handling

**Standard Error Response:**
```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit of 60 requests per minute exceeded",
    "retry_after": 32,
    "documentation_url": "https://api.lmdr.com/docs/errors/rate-limit"
  },
  "request_id": "req_abc123"
}
```

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `invalid_api_key` | 401 | API key missing or invalid |
| `subscription_inactive` | 403 | Subscription expired or cancelled |
| `rate_limit_exceeded` | 429 | Too many requests |
| `quota_exceeded` | 429 | Monthly quota exceeded |
| `invalid_request` | 400 | Malformed request |
| `resource_not_found` | 404 | Requested resource not found |
| `internal_error` | 500 | Server error |

## 7. Developer Portal

### 7.1 Portal Features

```
+------------------------------------------------------------------+
|  LMDR API DEVELOPER PORTAL                                        |
+------------------------------------------------------------------+
|                                                                    |
|  [Dashboard]  [API Docs]  [API Keys]  [Usage]  [Billing]  [Support]|
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  QUICK START                                                       |
|  +--------------------------------------------------------------+ |
|  | 1. Generate API Key                                           | |
|  | 2. Make your first request                                    | |
|  | 3. Explore endpoints in Sandbox                               | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  YOUR API KEYS                                                     |
|  +--------------------------------------------------------------+ |
|  | Production Key: lmdr_live_•••••••••••••          [Regenerate] | |
|  | Sandbox Key:    lmdr_test_•••••••••••••          [Regenerate] | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  THIS MONTH'S USAGE                                               |
|  +--------------------------------------------------------------+ |
|  | Requests: 12,450 / 50,000       [================____] 25%   | |
|  | Driver Searches: 45 / 100       [============________] 45%   | |
|  | Document OCR: 12 / 50           [======______________] 24%   | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  RECENT ACTIVITY                                                  |
|  +--------------------------------------------------------------+ |
|  | /v1/safety/carrier/123456         200    45ms    2 min ago   | |
|  | /v1/parking/search                200    120ms   5 min ago   | |
|  | /v1/intelligence/carrier/789012   200    890ms   12 min ago  | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### 7.2 Documentation Structure

- **Getting Started** - Authentication, first request, SDKs
- **API Reference** - Full endpoint documentation with examples
- **Guides** - Common use cases and integration patterns
- **Changelog** - API version history and deprecations
- **Status Page** - Real-time API status and incidents

### 7.3 Sandbox Environment

- Separate `lmdr_test_` API keys
- Simulated responses with realistic data
- No rate limits (for testing)
- Test webhook endpoint for integration testing
- Reset capability for test data

## 8. Integration Examples

### 8.1 cURL Example

```bash
# Get carrier safety data
curl -X GET "https://api.lmdr.com/v1/safety/carrier/123456" \
  -H "Authorization: Bearer lmdr_live_abc123..." \
  -H "Content-Type: application/json"
```

### 8.2 JavaScript/Node.js SDK

```javascript
const LMDR = require('@lmdr/api-client');

const client = new LMDR({ apiKey: process.env.LMDR_API_KEY });

// Get carrier safety data
const carrier = await client.safety.getCarrier(123456);
console.log(carrier.safety_rating);

// Search for parking
const parking = await client.parking.search({
  lat: 35.1495,
  lng: -90.0490,
  radius: 50
});

// Get AI-enriched carrier intelligence
const intel = await client.intelligence.getCarrier(123456);
console.log(intel.enrichment.sentiment);
```

### 8.3 Python SDK

```python
from lmdr import LMDRClient

client = LMDRClient(api_key=os.environ['LMDR_API_KEY'])

# Get carrier safety data
carrier = client.safety.get_carrier(123456)
print(carrier.safety_rating)

# Search for drivers
results = client.matching.search_drivers(
    cdl_class='A',
    endorsements=['H', 'N'],
    min_experience_years=2,
    location={'lat': 35.1495, 'lng': -90.0490},
    radius_miles=100
)
```

## 9. Success Metrics

### 9.1 Business Metrics

| Metric | Year 1 Target | Year 2 Target |
|--------|---------------|---------------|
| Active API Partners | 25 | 75 |
| Monthly Recurring Revenue | $25K | $75K |
| Annual Recurring Revenue | $300K | $900K |
| Partner Retention Rate | 85% | 90% |
| Net Revenue Retention | 110% | 120% |

### 9.2 Technical Metrics

| Metric | Target |
|--------|--------|
| API Uptime | 99.9% |
| Average Latency (p50) | <200ms |
| Average Latency (p99) | <1000ms |
| Error Rate | <0.1% |
| Time to First API Call | <30 minutes |

### 9.3 Partner Success Metrics

| Metric | Target |
|--------|--------|
| Onboarding Completion Rate | 90% |
| API Integration Time | <2 weeks |
| Support Ticket Resolution | <24 hours |
| Documentation Satisfaction | 4.5/5 |

## 10. Open Questions

1. **Versioning Strategy**: Should we use URL versioning (`/v1/`, `/v2/`) or header-based versioning?

2. **SDK Languages**: Which SDKs to build first? JavaScript, Python, PHP, Go, Ruby?

3. **GraphQL**: Should we offer a GraphQL endpoint for flexible queries alongside REST?

4. **Data Residency**: Do enterprise partners need data residency options (US-only, EU)?

5. **Reseller Program**: Should we allow partners to resell API access to their customers?

6. **Usage Alerts**: What thresholds should trigger usage alerts (80%, 90%, 100%)?

7. **Beta Program**: Should we offer discounted beta access to early adopter partners?

8. **Compliance**: Do we need SOC 2 Type II certification for enterprise partners?
