# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Workflow Rule: Sync = Commit + Push

**IMPORTANT:** When the user says "sync" (in any form - "sync", "sync it", "sync to wix", etc.), you MUST:
1. Stage all changes: `git add -A`
2. Commit with a descriptive message: `git commit -m "description"`
3. Push to remote: `git push`

This is required because Wix syncs from the GitHub repository. Without pushing, changes won't appear in Wix.

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
- `STRIPE_PRICE_PRO` - Price ID for Pro plan (legacy monthly)
- `STRIPE_PRICE_ENTERPRISE` - Price ID for Enterprise plan (monthly)
- `STRIPE_PRICE_PRO_MONTHLY` - Price ID for Pro monthly billing
- `STRIPE_PRICE_PRO_6MONTH` - Price ID for Pro 6-month billing
- `STRIPE_PRICE_ENTERPRISE_6MONTH` - Price ID for Enterprise 6-month billing
- `STRIPE_PRICE_PLACEMENT_DEPOSIT` - Price ID for placement deposit ($100/driver)

**Match Scoring Weights (carrierMatching.jsw):**
```javascript
weights: { location: 25, pay: 20, operationType: 15, turnover: 12, safety: 10, truckAge: 8, fleetSize: 5, qualityScore: 5 }
```

**Subscription Tiers (Recruiter):**

| Tier | Price | Job Posts | Driver Views | Driver Search |
|------|-------|-----------|--------------|---------------|
| Free | $0/mo | 1 | 0 | No |
| Pro | $249/mo | 5 | 25/month | Yes |
| Enterprise | $749/mo | Unlimited | Unlimited | Yes |

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
