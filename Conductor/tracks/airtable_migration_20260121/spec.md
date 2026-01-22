# Specification: Airtable Migration - Scalable Data Architecture

## 1. Overview

Migrate LMDR's 40 Wix Collections to Airtable while maintaining the existing Wix Velo frontend and authentication system. This architectural shift takes advantage of minimal current data volume to establish a scalable data foundation.

### Current State
- 40 Wix Collections storing all platform data
- 38+ backend .jsw services using `wixData` API
- Data tightly coupled to Wix infrastructure
- Limited scalability and visual data management

### Desired State
- 35 collections migrated to Airtable
- 5 auth-related collections remain in Wix
- Abstraction layer (`airtableClient.jsw`) for data access
- Feature flags for gradual rollout and rollback capability
- Visual data management via Airtable interface

### Why Migrate Now?
- **Minimal data volume** - Perfect timing before production scale
- **Schemas already defined** - Collection structures established
- **Scalability ceiling** - Wix has performance limitations at scale
- **Better tooling** - Airtable provides visual interface, automations, integrations
- **API quality** - Well-documented REST API with predictable behavior

---

## 2. Target Architecture

### Hybrid Architecture Diagram

```
+---------------------------------------------------------------+
|                      Wix Velo Frontend                         |
|              (Authentication, UI, Pages, Routing)              |
+---------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------+
|                    Wix Backend Services (.jsw)                 |
|              (Business Logic, API Orchestration)               |
|         +-------------------------------------------+          |
|         |      airtableClient.jsw (NEW)             |          |
|         |   Abstraction layer for data access       |          |
|         |   - Field mapping (snake_case -> Title)   |          |
|         |   - Rate limiting (5 req/sec)             |          |
|         |   - Batch operations (10 records max)     |          |
|         |   - Type conversion preservation          |          |
|         +-------------------------------------------+          |
+---------------------------------------------------------------+
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
        +-----------+   +-----------+   +-----------+
        | Airtable  |   | Wix Data  |   | External  |
        |  (Data)   |   |  (Auth)   |   |   APIs    |
        | 35 tables |   | 5 tables  |   | FMCSA,    |
        |           |   | Members,  |   | Stripe,   |
        |           |   | Auth logs |   | AI        |
        +-----------+   +-----------+   +-----------+
```

### Data Flow Patterns

**Read Operation:**
```
Frontend -> Backend Service -> airtableClient -> Airtable API
                                    |
                                    v
                            Transform to Wix format
                                    |
                                    v
                            Return to service
```

**Write Operation:**
```
Frontend -> Backend Service -> airtableClient -> Transform to Airtable format
                                    |
                                    v
                            Validate & rate limit
                                    |
                                    v
                            Airtable API (batch if needed)
```

---

## 3. Collection Migration Inventory

### Collections to MIGRATE to Airtable (35 total)

#### Priority 1: Core Business Data
| Collection | Est. Records | Risk | Notes |
|------------|-------------|------|-------|
| Carriers | <1,000 | MEDIUM | Hub table, many references |
| DriverProfiles | <500 | MEDIUM | Links to Wix Members |
| DriverJobs | <100 | LOW | Simple job postings |
| CarrierHiringPreferences | <100 | LOW | Matching criteria |
| DriverInterests | <100 | LOW | Driver preferences |

#### Priority 2: Transaction & Matching
| Collection | Est. Records | Risk | Notes |
|------------|-------------|------|-------|
| DriverCarrierInterests | <1,000 | HIGH | Bridge table, dual links |
| MatchEvents | <5,000 | MEDIUM | Analytics, high volume |
| CarrierDriverViews | <1,000 | LOW | View tracking |
| ProfileViews | <500 | LOW | Quota enforcement |

#### Priority 3: Enrichment & Cache
| Collection | Est. Records | Risk | Notes |
|------------|-------------|------|-------|
| CarrierEnrichments | <500 | LOW | 14-day TTL cache |
| CarrierSafetyData | <500 | LOW | 7-day TTL cache |

#### Priority 4: Communication
| Collection | Est. Records | Risk | Notes |
|------------|-------------|------|-------|
| Messages | <2,000 | MEDIUM | Recruiter-driver messaging |
| MemberActivity | <5,000 | LOW | Activity audit log |

#### Priority 5: Billing & Subscriptions
| Collection | Est. Records | Risk | Notes |
|------------|-------------|------|-------|
| CarrierSubscriptions | <100 | MEDIUM | Stripe integration |
| BillingHistory | <500 | LOW | Payment events |
| StripeEvents | <1,000 | LOW | Webhook idempotency |
| CheckoutAbandonment | <100 | LOW | Recovery emails |

#### Priority 6: Onboarding & Access
| Collection | Est. Records | Risk | Notes |
|------------|-------------|------|-------|
| PartnerOnboarding | <50 | LOW | Partner flow |
| CarrierOnboarding | <100 | LOW | Carrier setup |
| recruiterCarriers | <100 | LOW | Access control links |
| carrierStaffingRequests | <200 | LOW | Inbound leads |

#### Priority 7: Content & CMS (9 collections)
- BlogPosts, BlogCategories, FAQs
- ComplianceGuides, BestPracticesGuides
- PricingTiers, ServiceFeatures
- CaseStudies, IndustryComparisons

#### Priority 8: Reviews & Testimonials (3 collections)
- CarrierReviews, CarrierTestimonials, DriverTestimonials

#### Priority 9: Administration & Logging
| Collection | Est. Records | Risk | Notes |
|------------|-------------|------|-------|
| AdminAuditLog | <5,000 | LOW | Append-only audit |
| JobPostings | <50 | LOW | Moderation queue |
| TeamMembers | <10 | LOW | Static content |
| CompanyMilestones | <20 | LOW | Static content |
| PromptLibrary | <50 | LOW | AI prompts |
| AIUsageLog | <10,000 | LOW | Cost tracking |
| SystemLogs | <50,000 | LOW | May need archival |

### Collections to KEEP in Wix (5 total)

| Collection | Reason |
|------------|--------|
| AdminUsers | Wix Members integration for authentication |
| MemberNotifications | Requires Wix auth context |
| SystemMetrics | Real-time Wix monitoring |
| SystemTraces | Wix observability integration |
| FeatureAdoptionLog | Wix user session tracking |

---

## 4. Airtable Base Design

### Base Structure: "LMDR Production"

```
LMDR Production (Base)
|
+-- Core Data (Tab Group)
|   +-- Carriers
|   +-- Driver Profiles
|   +-- Driver Jobs
|
+-- Matching (Tab Group)
|   +-- Driver-Carrier Interests
|   +-- Match Events
|   +-- Carrier Hiring Preferences
|   +-- Driver Interests
|
+-- Communication (Tab Group)
|   +-- Messages
|   +-- Member Activity
|
+-- Billing (Tab Group)
|   +-- Subscriptions
|   +-- Billing History
|   +-- Stripe Events
|   +-- Profile Views
|
+-- Enrichment (Tab Group)
|   +-- Carrier Enrichments
|   +-- FMCSA Safety Data
|
+-- Content (Tab Group)
|   +-- Blog Posts
|   +-- Blog Categories
|   +-- FAQs
|   +-- [other CMS tables]
|
+-- Admin (Tab Group)
    +-- Audit Log
    +-- AI Usage Log
    +-- System Logs
```

### Key Table Schemas

#### Carriers Table
| Field Name | Airtable Type | Wix Equivalent | Notes |
|------------|---------------|----------------|-------|
| Legal Name | Single line text | legal_name | Primary display |
| DOT Number | Number | dot_number | **CRITICAL**: Lookup key |
| MC Number | Number | mc_number | Motor carrier |
| City | Single line text | phy_city | Physical location |
| State | Single line text | phy_state | 2-letter code |
| Pay Rate Min | Currency | pay_min | CPM minimum |
| Pay Rate Max | Currency | pay_max | CPM maximum |
| Fleet Size | Number | fleet_size | Total trucks |
| Operation Type | Multiple select | operation_type | OTR, Regional, Local, Dedicated |
| Truck Age Avg | Number | truck_age_avg | Average fleet age |
| Turnover Rate | Percent | turnover_rate | Annual driver turnover |
| Legacy Wix ID | Single line text | _id | Migration reference |
| Created | Created time | _createdDate | Auto |
| Modified | Last modified time | _updatedDate | Auto |

#### Driver Profiles Table
| Field Name | Airtable Type | Wix Equivalent | Notes |
|------------|---------------|----------------|-------|
| Display Name | Single line text | display_name | Full name |
| Email | Email | email | Contact |
| Phone | Phone number | phone | Contact |
| Home Zip | Single line text | home_zip | Location |
| CDL Class | Single select | cdl_class | A, B, C |
| Endorsements | Multiple select | endorsements | H, N, T, X, P, S |
| Years Experience | Number | years_experience | CDL experience |
| Preferred Operation | Multiple select | preferred_operation_type | Job preferences |
| Min CPM | Currency | min_cpm | Minimum pay |
| Clean MVR | Checkbox | clean_mvr | No violations |
| Accidents (3yr) | Number | accidents_last_3_years | Count |
| Violations (3yr) | Number | violations_last_3_years | Count |
| Profile Score | Number | profile_completeness_score | 0-100 |
| Status | Single select | status | Active, Incomplete, Dormant |
| Wix Member ID | Single line text | _owner | Auth link |
| Legacy Wix ID | Single line text | _id | Migration reference |

#### Driver-Carrier Interests Table (Bridge)
| Field Name | Airtable Type | Wix Equivalent | Notes |
|------------|---------------|----------------|-------|
| Driver | Link to Driver Profiles | driver_id | **Always array** |
| Carrier | Link to Carriers | carrier_dot | **Always array** |
| Status | Single select | status | interested, applied, in_review, contacted, offer, hired, rejected, withdrawn |
| Match Score | Number | match_score | Algorithm score |
| Applied Date | Date | applied_date | When applied |
| Status Updated | Date | status_updated | Last change |
| Notes | Long text | notes | Recruiter notes |
| Legacy Wix ID | Single line text | _id | Migration reference |

---

## 5. API Comparison & Patterns

### CRUD Operation Mapping

| Operation | Wix Data | Airtable |
|-----------|----------|----------|
| **CREATE** | `wixData.insert(collection, data)` | POST `{ records: [{ fields: {...} }] }` |
| **READ** | `wixData.query(collection).eq().find()` | GET `?filterByFormula=` |
| **UPDATE** | `wixData.update(collection, fullObject)` | PATCH `{ records: [{ id, fields: {...} }] }` |
| **DELETE** | `wixData.remove(collection, id)` | DELETE `/{table}/{recordId}` |

### Query Translation (Wix -> Airtable filterByFormula)

| Wix Method | Airtable Formula |
|------------|------------------|
| `.eq('field', value)` | `{Field Name} = 'value'` |
| `.ne('field', value)` | `{Field Name} != 'value'` |
| `.gt('field', value)` | `{Field Name} > value` |
| `.ge('field', value)` | `{Field Name} >= value` |
| `.hasSome('field', [a,b])` | `OR({Field} = 'a', {Field} = 'b')` |
| `.contains('field', 'text')` | `SEARCH('text', {Field}) > 0` |
| `.isEmpty('field')` | `{Field} = BLANK()` |

### Critical Differences

1. **Batch Limits**: Airtable max 10 records per create/update/delete
2. **Update Behavior**: Wix requires full object; Airtable PATCH only updates specified fields
3. **Record IDs**: Wix uses `_id`; Airtable uses `id` (format: `recXXXXXXXXXXXXXX`)
4. **Field Names**: Wix uses snake_case; Airtable uses Title Case with spaces
5. **Linked Records**: Airtable links are **always arrays**, even for single links
6. **Type Sensitivity**: Both require type conversion for lookups (DOT number is NUMBER)

---

## 6. Rate Limits & Constraints

### Airtable API Limits

| Limit | Value | Impact |
|-------|-------|--------|
| Requests per second | **5** | Need rate limiting in client |
| Records per batch | **10** | Batch helper required |
| Records per list | 100 | Pagination required |
| Max records per table | **50,000** | Monitor growth, archive logs |
| Total records per base | **100,000** | Monitor total |
| Attachment storage | 20GB | Monitor CDL images |

### Rate Limiting Implementation

```javascript
// 5 req/sec = 200ms minimum between requests
const MIN_REQUEST_INTERVAL = 200;
let lastRequestTime = 0;

async function rateLimitedRequest(url, options) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL) {
    await sleep(MIN_REQUEST_INTERVAL - elapsed);
  }
  lastRequestTime = Date.now();
  return fetch(url, options);
}
```

---

## 7. Abstraction Layer Design

### airtableClient.jsw Structure

```javascript
// Core utilities
- airtableRequest(endpoint, options)  // Rate-limited fetch wrapper
- toWixFormat(record, fieldMapping)   // Airtable -> Wix field names
- toAirtableFormat(data, fieldMapping) // Wix -> Airtable field names

// Per-collection exports (maintain existing interfaces)
- getCarrierByDOT(dotNumber)
- queryCarriers(filters)
- insertCarrier(data)
- updateCarrier(id, data)

- getDriverById(id)
- getDriverByWixMemberId(memberId)
- queryDrivers(filters)
- insertDriver(data)
- updateDriver(id, data)

- createInterest(driverId, carrierId, data)
- getInterestsByDriver(driverId)
- getInterestsByCarrier(carrierId)
- updateInterestStatus(id, status)

// Batch operations
- bulkInsert(tableName, records, fieldMapping)
- bulkUpdate(tableName, updates, fieldMapping)

// Pagination helper
- getAllRecords(tableName, fieldMapping, filters)
```

### Feature Flag Pattern

```javascript
// src/backend/config.jsw
export const DATA_SOURCE = {
  carriers: 'airtable',      // 'airtable' | 'wix'
  drivers: 'airtable',
  interests: 'airtable',
  messages: 'wix',           // Not yet migrated
  content: 'wix',            // Not yet migrated
  // ... per-collection toggle
};
```

---

## 8. Rollback Strategy

### Levels of Rollback

1. **Per-Collection Toggle**: Flip `DATA_SOURCE.{collection}` back to `'wix'`
2. **Data Sync**: Run reverse sync from Airtable to Wix if needed
3. **Full Rollback**: Restore all services to Wix Data

### Data Preservation

- Keep Wix collections as backup (read-only after migration)
- Store `Legacy Wix ID` in all Airtable records for reference resolution
- Don't delete Wix data until 30 days post-migration stability

---

## 9. Success Criteria

### Migration Complete When:

- [ ] All 35 collections migrated and verified
- [ ] All backend services using airtableClient abstraction
- [ ] Feature flags enabled for all migrated collections
- [ ] Zero data loss verified via record counts
- [ ] All existing functionality working (regression tests pass)
- [ ] Performance benchmarks met (response times < 500ms P95)
- [ ] 2-week stability period without rollbacks

### Monitoring Metrics

- API request latency (target: < 300ms P50)
- Error rate (target: < 0.1%)
- Record counts match between Wix backup and Airtable
- Rate limit 429 responses (target: 0 after optimization)
