# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Workflow Rule: Sync = Commit + Push

**IMPORTANT:** When the user says "sync" (in any form - "sync", "sync it", "sync to wix", etc.), you MUST:
1. Stage all changes: `git add -A`
2. Commit with a descriptive message: `git commit -m "description"`
3. Push to remote: `git push`

This is required because Wix syncs from the GitHub repository. Without pushing, changes won't appear in Wix.

## Production Website URL

**Base URL:** `https://www.lastmiledr.app`

When writing redirects or links in HTML components (especially within Wix iframes), always use the full absolute URL:

```javascript
// ✅ CORRECT - Full URL required for iframe context
const baseUrl = 'https://www.lastmiledr.app';
window.top.location.href = baseUrl + '/pricing';

// ❌ WRONG - Relative paths don't resolve correctly in Wix iframes
window.top.location.href = '/pricing';
```

## Critical Data Routing: Dual-Source Pattern (Wix + Airtable)

**CRITICAL RULE:** This project uses a dual-source data architecture where most data routes to **Airtable** for visibility, while auth-related data stays in **Wix**. You MUST follow this pattern when writing or modifying backend code.

### The Golden Rule

**NEVER call `wixData.*` directly in business logic functions.** Always use the dual-source helper functions.

### Collections That Stay in Wix (ONLY THESE TWO)

| Collection | Reason |
|------------|--------|
| `AdminUsers` | Auth/permissions - must stay in Wix |
| `MemberNotifications` | Wix member system integration |

**Everything else (~65+ collections) routes to Airtable.**

### Required Helper Functions

Every backend service that accesses data MUST define and use these helpers:

```javascript
import { usesAirtable, getAirtableTableName } from 'backend/config';
import * as airtable from 'backend/airtableClient';

// Collection key mapping (at top of file)
const COLLECTION_KEYS = {
    carriers: 'carriers',
    drivers: 'driverProfiles',
    // ... add all collections this service uses
};

// Helper functions (define once per service file)
async function queryData(collectionKey, wixCollectionName, options = {}) {
    if (usesAirtable(collectionKey)) {
        const tableName = getAirtableTableName(collectionKey);
        const result = await airtable.queryRecords(tableName, {
            filterByFormula: options.filter || '',
            sort: options.sort,
            maxRecords: options.limit || 100
        });
        return result.records || [];
    }
    // Wix fallback
    let query = wixData.query(wixCollectionName);
    // ... build query
    const result = await query.find({ suppressAuth: true });
    return result.items;
}

async function insertData(collectionKey, wixCollectionName, data) {
    if (usesAirtable(collectionKey)) {
        const tableName = getAirtableTableName(collectionKey);
        return await airtable.createRecord(tableName, data);
    }
    return await wixData.insert(wixCollectionName, data, { suppressAuth: true });
}

async function updateData(collectionKey, wixCollectionName, data) {
    if (usesAirtable(collectionKey)) {
        const tableName = getAirtableTableName(collectionKey);
        return await airtable.updateRecord(tableName, data._id || data.id, data);
    }
    return await wixData.update(wixCollectionName, data, { suppressAuth: true });
}

async function getRecord(collectionKey, wixCollectionName, recordId) {
    if (usesAirtable(collectionKey)) {
        const tableName = getAirtableTableName(collectionKey);
        return await airtable.getRecord(tableName, recordId);
    }
    return await wixData.get(wixCollectionName, recordId, { suppressAuth: true });
}

async function removeData(collectionKey, wixCollectionName, recordId) {
    if (usesAirtable(collectionKey)) {
        const tableName = getAirtableTableName(collectionKey);
        return await airtable.deleteRecord(tableName, recordId);
    }
    return await wixData.remove(wixCollectionName, recordId, { suppressAuth: true });
}
```

### Before/After Example

```javascript
// ❌ WRONG - Bypasses dual-source routing, data goes to Wix only
const result = await wixData.query('Carriers').eq('status', 'active').find();
await wixData.insert('AuditLog', { action: 'login', timestamp: new Date() });

// ✅ CORRECT - Uses dual-source routing, data goes to Airtable
const result = await queryData(COLLECTION_KEYS.carriers, 'Carriers', {
    filter: `{Status} = "active"`
});
await insertData(COLLECTION_KEYS.auditLog, 'AuditLog', { action: 'login', timestamp: new Date() });
```

### Field Name Mapping

Wix uses `snake_case`, Airtable uses `Title Case`. When reading from Airtable, normalize field names:

```javascript
// Normalize Airtable response to match Wix field names
const normalizedRecords = (result.records || []).map(r => ({
    _id: r.id || r._id,
    carrier_name: r['Carrier Name'] || r.carrier_name,
    dot_number: r['Dot Number'] || r.dot_number,
    status: r.Status || r.status,
    created_date: r['Created Date'] || r._createdDate
}));
```

### Config File Reference

Routing is controlled by `backend/config.jsw`:
- `usesAirtable(collectionKey)` - Returns `true` if collection routes to Airtable
- `getAirtableTableName(collectionKey)` - Returns the Airtable table name

### Two Types of Collections

#### Type 1: Migrated Collections (Legacy)
Collections that existed in Wix and were migrated to Airtable. These have a Wix fallback for rollback capability.

```javascript
// config.jsw - Migrated collection (has Wix fallback)
DATA_SOURCE.carriers = 'airtable'
AIRTABLE_TABLE_NAMES.carriers = 'v2_Carriers'
WIX_COLLECTION_NAMES.carriers = 'Carriers'  // Fallback exists
```

#### Type 2: New Collections (Airtable-Only) ⭐
Collections created for new features. **NO Wix collection exists or is needed.**

```javascript
// config.jsw - New collection (Airtable-only, NO Wix fallback)
DATA_SOURCE.driverXpEvents = 'airtable'
AIRTABLE_TABLE_NAMES.driverXpEvents = 'v2_Driver XP Events'
// NO entry in WIX_COLLECTION_NAMES - there's no Wix collection!
```

### Adding New Collections (For New Features)

When building new features that need data storage, follow this Airtable-only workflow:

**Step 1: Create Airtable Table**
```
Base: Last Mile Driver recruiting (app9N1YCJ3gdhExA0)
Table name: v2_{Feature Name}  (e.g., v2_Driver XP Events)
```

**Step 2: Add to config.jsw (TWO entries only)**
```javascript
// In DATA_SOURCE
export const DATA_SOURCE = {
  // ... existing
  driverXpEvents: 'airtable',  // NEW
};

// In AIRTABLE_TABLE_NAMES
export const AIRTABLE_TABLE_NAMES = {
  // ... existing
  driverXpEvents: 'v2_Driver XP Events',  // NEW
};

// DO NOT add to WIX_COLLECTION_NAMES - no Wix collection exists!
```

**Step 3: Use Simplified Helpers in Service**

For Airtable-only collections, use streamlined helpers without Wix fallback:

```javascript
import { getAirtableTableName } from 'backend/config';
import * as airtable from 'backend/airtableClient';

const COLLECTION_KEYS = {
    xpEvents: 'driverXpEvents',
    achievements: 'driverAchievements',
};

// Simplified helpers - Airtable only, no Wix fallback needed
async function queryData(collectionKey, options = {}) {
    const tableName = getAirtableTableName(collectionKey);
    const result = await airtable.queryRecords(tableName, {
        filterByFormula: options.filter || '',
        sort: options.sort,
        maxRecords: options.limit || 100
    });
    return result.records || [];
}

async function insertData(collectionKey, data) {
    const tableName = getAirtableTableName(collectionKey);
    return await airtable.createRecord(tableName, data);
}

async function updateData(collectionKey, recordId, data) {
    const tableName = getAirtableTableName(collectionKey);
    return await airtable.updateRecord(tableName, recordId, data);
}

async function getRecord(collectionKey, recordId) {
    const tableName = getAirtableTableName(collectionKey);
    return await airtable.getRecord(tableName, recordId);
}

async function removeData(collectionKey, recordId) {
    const tableName = getAirtableTableName(collectionKey);
    return await airtable.deleteRecord(tableName, recordId);
}
```

### Airtable Base Reference

| Base | ID | Purpose |
|------|-----|---------|
| Last Mile Driver recruiting | `app9N1YCJ3gdhExA0` | All application data (v2_* tables) |
| VelocityMatch DataLake | `appt00rHHBOiKx9xl` | External data feeds (fuel, weather, traffic) |

**New feature tables go in `Last Mile Driver recruiting` base.**

### Checklist: Adding a New Collection

1. ✅ Create table in Airtable with `v2_` prefix
2. ✅ Add to `DATA_SOURCE` as `'airtable'`
3. ✅ Add to `AIRTABLE_TABLE_NAMES`
4. ❌ Do NOT add to `WIX_COLLECTION_NAMES`
5. ❌ Do NOT create a Wix collection
6. ✅ Use simplified Airtable-only helpers in service

### Checklist When Modifying Backend Services

1. **Check for direct `wixData.*` calls** - Search for `wixData.query`, `wixData.insert`, `wixData.update`, `wixData.get`, `wixData.remove`
2. **Verify helpers exist** - Ensure the service has `queryData`, `insertData`, `updateData`, `getRecord`, `removeData` defined
3. **Check COLLECTION_KEYS** - Ensure all collections used by the service are mapped
4. **Replace bypasses** - Convert direct `wixData.*` calls to use the helpers
5. **Handle field name mapping** - Normalize Airtable responses to match expected field names

### Full Airtable Routing Audit Checklist

When auditing a backend service for complete Airtable integration, check ALL of these:

#### Step 1: Backend Service File (*.jsw)
```
□ Imports `usesAirtable`, `getAirtableTableName` from 'backend/config'
□ Imports `* as airtable` from 'backend/airtableClient'
□ Uses `usesAirtable(collectionKey)` before data operations
□ Uses `getAirtableTableName(collectionKey)` to get table name
□ All field names in records use snake_case (backend standard)
□ Filter formulas use CORRECT Airtable field names (check FIELD_MAPPINGS)
```

#### Step 2: config.jsw - Data Source Routing
```
□ Collection is listed in DATA_SOURCE object
□ Value is 'airtable' (not 'wix') for collections that should route to Airtable
□ Collection key in AIRTABLE_TABLE_NAMES matches the table name in Airtable
□ Collection key in WIX_COLLECTION_NAMES matches for fallback
```

#### Step 3: airtableClient.jsw - Table Mappings
```
□ TABLE_NAMES has entry for the Wix collection name
□ TABLE_NAMES has entry for the v2_* table name (if config uses that)
□ Table name points to actual table where data exists
```

#### Step 4: airtableClient.jsw - Field Mappings
```
□ FIELD_MAPPINGS has entry for the collection/table name
□ ALL fields used by backend are mapped (snake_case → Title Case)
□ Filter formula field names match what's in FIELD_MAPPINGS values
□ Date fields mapped correctly (submitted_date, created_date, etc.)
□ Reference fields mapped (linked_carrier_id, driver_id, etc.)
```

#### Step 5: Wix Page Code (*.js in src/pages/)
```
□ Imports the backend service function
□ Handles postMessage from HTML component
□ Calls backend function with correct data shape
□ Returns response via postMessage to HTML
```

#### Step 6: HTML Component
```
□ Form collects all required fields
□ postMessage sends correct message type
□ Listens for response message type
□ Handles success/error states
```

### Common Airtable Field Mapping Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Backend uses `additional_notes` but mapping has `notes` | Data goes to wrong field or gets lost | Add `'additional_notes': 'Notes'` to FIELD_MAPPINGS |
| Filter uses `{DOT Number}` but table has `DOT_NUMBER` | Query returns empty results | Check actual Airtable field name, update filter formula |
| Config routes to `v2_Carriers` but TABLE_NAMES has `Carriers` | Table not found error | Add `'v2_Carriers': 'Carriers (Master)'` to TABLE_NAMES |
| Missing date field mapping | Dates stored as wrong field name | Add `'submitted_date': 'Submitted Date'` etc. |
| Backend sends camelCase field | Field not mapped, stored as-is | Ensure backend normalizes to snake_case before insert |

### Airtable Field Name Reference

**Carriers (Master) table uses UPPERCASE:**
- `DOT_NUMBER`, `LEGAL_NAME`, `PHY_STATE`, `PHY_CITY`, etc.

**v2_* tables use Title Case:**
- `Company Name`, `Contact Name`, `Submitted Date`, `Status`, etc.

**Backend services use snake_case:**
- `company_name`, `contact_name`, `submitted_date`, `status`, etc.

### How to Add a New Collection to Airtable Routing

1. **Add to config.jsw DATA_SOURCE:**
   ```javascript
   myNewCollection: 'airtable',
   ```

2. **Add to config.jsw AIRTABLE_TABLE_NAMES:**
   ```javascript
   myNewCollection: 'v2_My New Collection',
   ```

3. **Add to config.jsw WIX_COLLECTION_NAMES:**
   ```javascript
   myNewCollection: 'MyNewCollection',
   ```

4. **Add to airtableClient.jsw TABLE_NAMES:**
   ```javascript
   'MyNewCollection': 'v2_My New Collection',
   'v2_My New Collection': 'v2_My New Collection', // Self-reference for direct lookups
   ```

5. **Add to airtableClient.jsw FIELD_MAPPINGS:**
   ```javascript
   'MyNewCollection': {
     'field_one': 'Field One',
     'field_two': 'Field Two',
     'created_date': 'Created Date',
     // ... all fields the backend uses
   },
   ```

### Allowed Direct Wix Calls

The ONLY acceptable direct `wixData.*` calls are:
1. **Inside the helper functions themselves** (the Wix fallback path)
2. **For `AdminUsers` collection** (auth must stay in Wix)
3. **For `MemberNotifications` collection** (Wix member integration)

## Project Overview

LMDR (Last Mile Driver Recruiting) is a Wix Velo site for matching CDL truck drivers with carriers. The site uses AI-powered enrichment to provide drivers with detailed carrier intelligence including FMCSA safety data, pay information, driver sentiment, and social media analysis.

## Development Commands

```bash
npm install          # Install dependencies (runs wix sync-types via postinstall)
npm run dev          # Start Local Editor for real-time testing (wix dev)
npm run lint         # Run ESLint
```

The Wix CLI must be installed globally: `npm install -g @wix/cli`

## Architecture

### Backend Services (src/backend/*.jsw)

Web modules (.jsw files) expose backend functions callable from frontend. Import syntax: `import { fn } from 'backend/moduleName';`

**Core Matching Services:**
- **carrierMatching.jsw** - Main matching engine scoring carriers against driver preferences using weighted criteria (location, pay, operation type, turnover, safety, truck age, fleet size)
- **driverMatching.jsw** - Reverse matching engine enabling carriers to search and match with qualified CDL drivers (primary revenue driver with tier-based limits)
- **driverScoring.js** - Scores drivers against carrier hiring preferences using weighted criteria for qualifications, experience, location, availability, and salary fit

**AI & Enrichment Services:**
- **aiEnrichment.jsw** - Two-stage AI pipeline: Perplexity fetches web research, Claude synthesizes into structured JSON enrichment with 14-day cache
- **aiRouterService.jsw** - LLM-agnostic provider management supporting hot-swapping between Claude, Perplexity, Gemini, OpenAI, Groq, and Mistral
- **socialScanner.jsw** - "Social Sniper" scanning Reddit, TruckersReport, and Twitter for driver sentiment on high-value carriers
- **ocrService.jsw** - Document OCR using Gemini 2.5 Flash with dual-OCR consensus for CDL verification and document extraction
- **promptLibraryService.jsw** - CRUD operations for managing AI prompts with version history and category organization

**Data Services:**
- **fmcsaService.jsw** - Fetches carrier safety data from FMCSA SAFER API including BASIC scores, inspection rates, and crash data with 7-day cache
- **carrierPreferences.jsw** - Manages carrier hiring preferences for the reverse matching engine with CRUD operations for CarrierHiringPreferences
- **driverProfiles.jsw** - Driver profile management including completeness scoring, document upload handling, and status tracking
- **carrierLeadsService.jsw** - Handles inbound carrier staffing requests with lead status management and carrier linking
- **contentService.jsw** - Blog posts, compliance guides, best practices, and partner content for content pages

**Commerce Services:**
- **stripeService.jsw** - Stripe API integration for checkout sessions, customer portal, subscription management with upsert and quota reset
- **subscriptionService.jsw** - Business logic layer for tier enforcement, quota tracking, and billing history management
- **abandonmentEmailService.jsw** - Checkout recovery email sequences (3 emails over 7 days) for abandoned cart recovery

**Admin Services:**
- **admin_service.jsw** - Core admin portal functions for driver management, analytics, and administrative operations with role verification
- **admin_dashboard_service.jsw** - System-wide statistics, alerts, activity feeds, health metrics, and AI usage cost tracking
- **admin_audit_service.jsw** - Comprehensive audit trail for all administrative actions across driver, carrier, system, and auth categories
- **admin_match_service.jsw** - Match analytics, filtering, and driver interest tracking for administrative oversight
- **admin_content_service.jsw** - Content moderation functions with admin authorization and moderation action logging
- **carrierAdminService.jsw** - Carrier management including FMCSA data, enrichment status, and carrier-specific administrative operations

**Communication Services:**
- **messaging.jsw** - Secure messaging between drivers and recruiters with permission validation based on application context
- **messagingRealtime.jsw** - Optimized polling for real-time message updates with timestamp-based fetching
- **emailService.jsw** - Email notifications including application confirmations and status update notifications
- **interviewScheduler.jsw** - Interview scheduling with state management (REQUESTED, PROPOSED, CONFIRMED, CANCELLED)
- **driverOutreach.jsw** - Recruiter driver search backend handling pipeline saves, outreach messaging, and view quota tracking

**Recruiter Services:**
- **recruiter_service.jsw** - Recruiter Operating System backend supporting agency model where one recruiter manages multiple carriers
- **recruiterStats.jsw** - Carrier responsiveness statistics including average response times and interaction counts for badges
- **retentionService.jsw** - Driver retention risk analysis with risk scoring thresholds and ROI calculations for turnover prevention

**Application Services:**
- **applicationService.jsw** - Handles driver applications to carriers with full application status lifecycle management
- **memberService.jsw** - Member dashboard data including profile summaries, application stats, notifications, and activity tracking

**Gamification Services:**
- **gamificationService.jsw** - Core gamification engine handling XP/points awards, level/rank progression, and event logging with audit trail
- **streakService.jsw** - Manages driver daily login streaks, streak freezes, and multiplier calculations
- **achievementService.jsw** - Achievement engine for checking and awarding badges to drivers and recruiters based on criteria
- **challengeService.jsw** - Time-limited challenges with progress tracking and rewards
- **seasonalEventService.jsw** - Seasonal event lifecycle management with XP multipliers
- **streakNotifications.jsw** - Handles notifications for streak risks, breaks, and milestones
- **gamificationJobs.jsw** - Scheduled job handlers for daily streak processing and monthly freeze grants
- **gamificationConfig.js** - Static configuration for levels, ranks, XP values, and action definitions
- **achievementCheckers.js** - Logic definitions for specific achievement criteria (profile, community, recruiter stats)

**Gamification Integration Points:**

The gamification system hooks into core services using a non-blocking, lazy-loaded pattern to prevent circular dependencies and not block main flows:

| Service | Function | Action | Reward |
|---------|----------|--------|--------|
| `driverProfiles.jsw` | `updateDriverPreferences()` | `update_profile` | Driver XP |
| `driverProfiles.jsw` | `updateDriverDocuments()` | `upload_document` | Driver XP |
| `driverProfiles.jsw` | `updateDriverQualifications()` | `update_profile` | Driver XP |
| `applicationService.jsw` | `submitApplication()` | `apply_job` | Driver XP |
| `driverMatching.jsw` | `getDriverProfile()` | `view_profile` | Recruiter Points |
| `messaging.jsw` | `sendMessage()` | `send_message` | XP/Points |
| `messaging.jsw` | `sendMessage()` (fast response) | `fast_response` | Recruiter Points |
| `interviewScheduler.jsw` | `scheduleInterview()` | `schedule_interview` | Recruiter Points |
| `interviewScheduler.jsw` | `confirmInterview()` | `complete_interview` | Driver XP |
| `recruiter_service.jsw` | `updateCandidateStatus()` → HIRED | `get_hired` | Driver XP |
| `recruiter_service.jsw` | `updateCandidateStatus()` → HIRED | `make_hire` | Recruiter Points |
| `memberService.jsw` | `updateLastActive()` | Daily login | Streak recording |

**Integration Pattern:**
```javascript
// Lazy-load gamification service to avoid circular dependencies
async function getGamificationService() {
  return await import('backend/gamificationService');
}

// Non-blocking award helper (won't block main flow on failure)
async function awardXPNonBlocking(userId, action, metadata = {}) {
  try {
    const gamification = await getGamificationService();
    await gamification.awardDriverXP(userId, action, metadata);
  } catch (err) {
    console.warn(`XP award failed for ${action}:`, err.message);
  }
}
```

**Public Services:**
- **publicStatsService.jsw** - Public-facing platform statistics for homepage and landing pages (driver count, active carriers, hires)

**Infrastructure Services:**
- **scheduler.jsw** - Background job scheduling for hourly carrier enrichment batches with rate limiting
- **observabilityService.jsw** - System logging, tracing, and error tracking with configurable log levels for Super Admin visibility
- **setupCollections.jsw** - One-time setup utilities for creating required Wix collections and test records
- **http-functions.js** - HTTP endpoints including Stripe webhook handler with HMAC signature verification and idempotency

### Wix Collections (Database)

**Core Data:**
- `Carriers` - Main carrier data with FMCSA info, pay rates, fleet metrics
- `DriverProfiles` - Driver profiles with CDL info, experience, preferences, and job-seeking status
- `DriverJobs` - Job postings linked to carriers

**Matching & Interests:**
- `DriverCarrierInterests` - Tracks driver interest/applications to carriers with status (applied, hired, etc.)
- `CarrierDriverViews` - Records when carriers view driver profiles (for analytics and billing)
- `MatchEvents` - Analytics log of driver-carrier matches
- `CarrierHiringPreferences` - Carrier-specific hiring criteria for matching algorithm
- `DriverInterests` - Driver preferences and interests for matching

**Messaging & Notifications:**
- `Messages` - Direct messages between recruiters and drivers
- `MemberNotifications` - In-app notifications for members (new matches, messages, etc.)
- `MemberActivity` - Activity log for member actions (profile views, applications, etc.)

**Enrichment & Cache:**
- `CarrierEnrichments` - Cached AI enrichment results (14-day TTL)
- `CarrierSafetyData` - Cached FMCSA API responses (7-day TTL)

**Billing & Subscriptions:**
- `CarrierSubscriptions` - Stripe subscription records linked by carrier DOT
- `ProfileViews` - Tracks driver profile views for quota enforcement
- `BillingHistory` - Payment events and billing lifecycle logs
- `StripeEvents` - Idempotency tracking for webhook events

**Onboarding & Admin:**
- `PartnerOnboarding` - Partner onboarding flow data and progress tracking
- `CarrierOnboarding` - Carrier onboarding status and completion tracking
- `recruiterCarriers` - Links recruiters to their associated carriers for access control

**Content & CMS:**
- `BlogPosts` - Blog content with categories and tags
- `BlogCategories` - Blog category definitions
- `FAQs` - Frequently asked questions
- `ComplianceGuides` - Compliance documentation content
- `BestPracticesGuides` - Industry best practices content
- `PricingTiers` - Pricing plan definitions
- `ServiceFeatures` - Feature descriptions for pricing pages
- `CaseStudies` - Customer success stories
- `IndustryComparisons` - Industry comparison data

**Reviews & Testimonials:**
- `CarrierReviews` - Driver reviews of carriers (moderated)
- `CarrierTestimonials` - Approved carrier testimonials for marketing
- `DriverTestimonials` - Approved driver testimonials for marketing

**Admin:**
- `AdminUsers` - Admin user records for content moderation
- `JobPostings` - Job posting submissions (for moderation)
- `TeamMembers` - Team member profiles for About page
- `CompanyMilestones` - Company timeline milestones

### Key Configuration

**API Keys (Wix Secrets Manager):**
- `CLAUDE_API_KEY` - Anthropic API for synthesis
- `PERPLEXITY_API_KEY` - Web research and social scanning
- `FMCSA_WEB_KEY` - FMCSA SAFER API access
- `SECRET_KEY_STRIPE` - Stripe API secret key
- `PUBLISHABLE_STRIPE` - Stripe publishable key (safe for frontend)
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification
- `STRIPE_PRICE_PRO` - Price ID for Pro monthly ($299/mo)
- `STRIPE_PRICE_PRO_MONTHLY` - Price ID for Pro monthly ($299/mo)
- `STRIPE_PRICE_PRO_6MONTH` - Price ID for Pro 6-month ($1,494 = $249/mo)
- `STRIPE_PRICE_ENTERPRISE` - Price ID for Enterprise monthly ($749/mo)
- `STRIPE_PRICE_ENTERPRISE_6MONTH` - Price ID for Enterprise 6-month ($3,594 = $599/mo)
- `STRIPE_PRICE_PLACEMENT_DEPOSIT` - Price ID for VelocityMatch deposit ($100/driver)
- `STRIPE_PRICE_PLACEMENT_ONHIRE` - Price ID for VelocityMatch on-hire ($600/driver)
- `STRIPE_PRICE_PLACEMENT_RETENTION` - Price ID for VelocityMatch 14-day retention ($500/driver)

**Match Scoring Weights (carrierMatching.jsw):**
```javascript
weights: { location: 25, pay: 20, operationType: 15, turnover: 12, safety: 10, truckAge: 8, fleetSize: 5, qualityScore: 5 }
```

**Subscription Tiers (Recruiter):**

| Tier | Monthly | 6-Month Prepaid | Job Posts | Driver Views | Driver Search |
|------|---------|-----------------|-----------|--------------|---------------|
| Free | $0/mo | - | 1 | 0 | No |
| Pro | $299/mo | $249/mo ($1,494) | 5 | 25/month | Yes |
| Enterprise | $749/mo | $599/mo ($3,594) | Unlimited | Unlimited | Yes |

**VelocityMatch Full-Service Placement:**

| Stage | Amount | When Due |
|-------|--------|----------|
| Deposit | $100/driver | Upfront |
| On Hire | $600/driver | When driver is hired |
| Retention | $500/driver | After 14-day retention |
| **Total** | **$1,200/driver** | |

**Tier Enforcement:**
- `canSearchDrivers(subscription)` - Returns `true` for Pro/Enterprise
- `canViewProfile(subscription)` - Returns `true` if quota available
- `recordProfileView(carrierDot, driverId)` - Deducts from monthly quota

### Import Conventions

Wix Velo requires specific import syntax:
```javascript
import { fn } from 'backend/fileName';   // Backend modules
import { fn } from 'public/fileName';    // Public modules
```
Do NOT use relative paths like `./fileName` - they don't work in Wix.

### Page Code (src/pages/*.js)

Page code files are auto-generated by Wix and named `PageName.xxxxx.js`. Do not rename these files. The `masterPage.js` file contains global site code.

## Scheduled Jobs

Configured in `src/backend/jobs.config`:
- `runEnrichmentBatch` runs hourly (`0 * * * *`) - Pre-enriches high-priority carriers with AI data (scheduler.jsw)
- `runBackfillMigration` runs every 30 min (`30 * * * *`) - Ensures all submitted drivers are searchable by recruiters (migrations/backfillSearchableDrivers.jsw)
- `processAbandonmentEmails` runs every 15 min (`15 * * * *`) - Processes checkout abandonment email sequences (2hr, 3-day, 7-day follow-ups) (abandonmentEmailService.jsw)

## Web Module Permissions

Permissions are defined in `src/backend/permissions.json`. Current config allows all users (anonymous, member, owner) to invoke all web methods.

## File Organization Standards

### HTML Files

**All HTML files are organized in `src/public/` subfolders by role:**

**📄 Standard:** See `docs/MOBILE_OPTIMIZATION_GUIDE.md` for mandatory mobile responsiveness rules (iPhone 12/13 target).

```
src/public/
├── admin/      # 10 files - Admin portal (ADMIN_*.html)
├── recruiter/  # 9 files  - Recruiter portal (Recruiter*.html)
├── driver/     # 5 files  - Driver portal (DRIVER_*.html, AI_MATCHING.html)
├── carrier/    # 4 files  - Carrier portal (Carrier*.html)
├── landing/    # 18 files - Landing & marketing pages
├── utility/    # 11 files - System components, templates, emails
├── _archive/   # Deprecated files (do not use)
├── js/         # JavaScript modules
├── __tests__/  # Test files
└── [root]      # Shared config (lmdr-config.js, theme-*.js/css)
```

**Folder Contents:**
| Folder | Files | Purpose |
|--------|-------|---------|
| `admin/` | 10 | Admin dashboards, system management, AI routing |
| `recruiter/` | 9 | Recruiter dashboard, driver search, pipeline, telemetry |
| `driver/` | 5 | Driver dashboard, job matching, applications |
| `carrier/` | 4 | Carrier onboarding, preferences, directory |
| `landing/` | 18 | Marketing pages, pricing, partner pages (ALLURE) |
| `utility/` | 11 | Sidebars, templates, subscription pages, email |

**Import paths for subfolders:**
```javascript
// From Wix page code, reference by subfolder path
$w('#html1').src = 'public/admin/ADMIN_DASHBOARD.html';
$w('#html2').src = 'public/driver/AI_MATCHING.html';
```

**DO NOT place HTML files in:**
- `docs/` - Reserved for markdown documentation only
- Root directory
- `src/backend/` - Backend code only
- `src/pages/` - Wix-managed page code only

### Tailwind Config in Wix Iframes (Critical)

**Do NOT rely on external `lmdr-config.js` in HTML files loaded inside Wix iframes.**  
The external config does not load reliably in Wix HTML components, which breaks custom color classes
like `bg-lmdr-canvas`, `text-lmdr-dark`, `bg-lmdr-blue`, and `text-lmdr-yellow`.

**Required pattern: Inline Tailwind config immediately after the Tailwind CDN script.**  
Use the same inline config as `src/public/landing/Homepage.HTML` and remove:
`<script src="../lmdr-config.js"></script>`.

### Test Files
**All test files MUST be placed in `src/public/__tests__/`**
- Naming convention: `*.test.js` or `*.spec.js`

A Claude Code hook enforces this standard automatically.

## Wix MCP Configuration

**IMPORTANT: When using any Wix MCP tools in this project, ALWAYS use this site:**

| Property | Value |
|----------|-------|
| **Site Name** | Last Mile CDL Driver Recruiting |
| **Site ID** | `13e6ba60-5a5d-4a4a-8adc-5948ff78d4ef` |

### Wix MCP Usage Rules

1. **Always use the site ID above** - Never prompt the user to select a site
2. **Skip site selection** - When calling `CallWixSiteAPI` or `ManageWixSite`, use `siteId: "13e6ba60-5a5d-4a4a-8adc-5948ff78d4ef"`
3. **No confirmation needed** - This is the only Wix site for this project

### Quick Reference for API Calls

```javascript
// Always use this siteId for CallWixSiteAPI
siteId: "13e6ba60-5a5d-4a4a-8adc-5948ff78d4ef"
```

## Wix Collection Record Linking (Critical Pattern)

**IMPORTANT:** This pattern is essential for linking records across collections (drivers to carriers, applications to jobs, etc.).

### The Problem: Type Mismatch Silently Fails

Wix `wixData.query().eq()` performs **strict type comparison**. If you query a `NUMBER` field with a `string` value, it returns **zero results with no error**.

```javascript
// ❌ BROKEN - Form data is always a string, but dot_number is NUMBER type
const result = await wixData.query('Carriers')
  .eq('dot_number', formData.dotNumber)  // "4028497" !== 4028497
  .find();
// result.items = [] (silently fails!)
```

### The Solution: Always Convert Types Before Querying

```javascript
// ✅ CORRECT - Convert to match target field type
const dotNumberAsNumber = parseInt(formData.dotNumber.trim(), 10);
const result = await wixData.query('Carriers')
  .eq('dot_number', dotNumberAsNumber)  // 4028497 === 4028497
  .find();
```

### Universal Pattern for Record Linking via Lookup Field

When linking records (e.g., linking a staffing request to a carrier via DOT number):

```javascript
async function linkRecordViaLookup(lookupValue, lookupFieldName, targetCollection, targetFieldType) {
  // Step 1: Convert input to match target field type
  let convertedValue;
  if (targetFieldType === 'NUMBER') {
    convertedValue = parseInt(lookupValue.trim(), 10);
    if (isNaN(convertedValue)) return null;
  } else {
    convertedValue = lookupValue.trim();
  }

  // Step 2: Query target collection by lookup field
  const result = await wixData.query(targetCollection)
    .eq(lookupFieldName, convertedValue)
    .limit(1)
    .find({ suppressAuth: true });

  // Step 3: Return _id for reference field (Wix references always use _id)
  return result.items.length > 0 ? result.items[0]._id : null;
}

// Usage example:
const linkedCarrierId = await linkRecordViaLookup(
  leadData.dotNumber,    // User input (string)
  'dot_number',          // Field to query in target
  'Carriers',            // Target collection
  'NUMBER'               // Target field type
);
```

### Collection Field Types Reference

| Collection | Field | Type | Notes |
|------------|-------|------|-------|
| `Carriers` | `_id` | TEXT | Primary key, use for reference fields |
| `Carriers` | `dot_number` | NUMBER | FMCSA DOT number, convert strings before querying |
| `Carriers` | `mc_number` | NUMBER | Motor carrier number |
| `carrierStaffingRequests` | `linked_carrier_id` | REFERENCE → Carriers | Store `_id` from Carriers |
| `Drivers` | `_id` | TEXT | Primary key |

### Key Rules

1. **Form data is ALWAYS strings** - HTML forms, postMessage, URL params all send strings
2. **Check target field type** - Use Wix MCP to verify field types before writing queries
3. **Reference fields store `_id`** - Never store lookup values (DOT, email) in reference fields
4. **Silent failures** - Type mismatches don't throw errors, they just return empty results
5. **Validate conversions** - Check `isNaN()` after `parseInt()` to catch invalid input

### UI Safety Pattern
When interacting with UI elements in Velo, always check for existence to prevent runtime errors if the element is missing from the editor:

```javascript
const element = $w('#optionalElement');
if (element.rendered) {
    element.text = "Value";
}
```

## Standard Carrier Staffing Form

All carrier landing pages that collect staffing requests MUST use the standard form pattern to ensure data flows to the correct Wix collections.

### Wix Collections (All Forms Use These)

| Collection | Purpose |
|------------|---------|
| `carrierStaffingRequests` | Stores all lead submissions from forms |
| `Carriers` | Used for DOT number lookup and `linked_carrier_id` reference |

### Template Location

Copy and customize: `src/public/_TEMPLATE_Carrier_Staffing_Form.html`

### Required Form Field IDs (DO NOT CHANGE)

```html
<!-- These IDs must match exactly for backend integration -->
<form id="carrierStaffingForm">
  <input id="companyName" name="companyName">
  <input id="contactName" name="contactName">
  <input id="email" name="email">
  <input id="phone" name="phone">
  <input id="dotNumber" name="dotNumber">        <!-- Enables carrier linking -->
  <input name="staffingType" value="emergency|strategic">
  <select id="driversNeeded" name="driversNeeded">
  <input name="driverTypes" type="checkbox">     <!-- Multi-select chips -->
  <textarea id="additionalNotes" name="additionalNotes">
  <button id="submitBtn">
  <div id="formSuccess">
  <div id="formError">
</form>
```

### Required PostMessage Bridge

The HTML form communicates with Wix Velo via PostMessage:

```javascript
// Form sends to Wix:
window.parent.postMessage({
  type: 'submitCarrierStaffingRequest',
  data: { companyName, contactName, email, phone, dotNumber, staffingType, ... }
}, '*');

// Wix responds:
{ type: 'staffingRequestResult', data: { success: true, leadId: '...' } }
```

### Required Page Code Integration

```javascript
import { submitCarrierStaffingRequest } from 'backend/carrierLeadsService';

$w.onReady(function() {
  const htmlComponent = $w('#html4'); // Adjust ID as needed

  htmlComponent.onMessage(async (event) => {
    if (event.data.type === 'submitCarrierStaffingRequest') {
      const result = await submitCarrierStaffingRequest(event.data.data);
      htmlComponent.postMessage({ type: 'staffingRequestResult', data: result });
    }
  });
});
```

### Claude Code Hook

A validation hook (`validate-carrier-form.ps1`) automatically runs when creating carrier landing pages and blocks if required elements are missing
