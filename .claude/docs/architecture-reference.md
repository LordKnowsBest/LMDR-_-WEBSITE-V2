# Architecture Reference

> Manual reference doc. Use `@.claude/docs/architecture-reference.md` to load when exploring the codebase.

## Backend Services (src/backend/*.jsw)

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

**Community Services:**
- **forumService.jsw** - Driver community forums backend handling categories, threads, posts, and view tracking
- **moderationService.jsw** - Content moderation system with automated filtering, user reporting, and admin review queue
- **reputationService.jsw** - Bridge service connecting community actions (posts, likes, answers) to the gamification engine
- **petFriendlyService.jsw** - Pet-friendly location search (geo-radius), submission, and review management

**Public Services:**
- **publicStatsService.jsw** - Public-facing platform statistics for homepage and landing pages (driver count, active carriers, hires)

**Infrastructure Services:**
- **scheduler.jsw** - Background job scheduling for hourly carrier enrichment batches with rate limiting
- **observabilityService.jsw** - System logging, tracing, and error tracking with configurable log levels for Super Admin visibility
- **setupCollections.jsw** - One-time setup utilities for creating required Wix collections and test records
- **http-functions.js** - HTTP endpoints including Stripe webhook handler with HMAC signature verification and idempotency

## Wix Collections (Database)

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
- `BlogPosts`, `BlogCategories`, `FAQs`, `ComplianceGuides`, `BestPracticesGuides`
- `PricingTiers`, `ServiceFeatures`, `CaseStudies`, `IndustryComparisons`

**Community & Forums:**
- `ForumCategories` - Forum sections and metadata
- `ForumThreads` - Discussion topics with author and stats
- `ForumPosts` - Individual posts and replies
- `ForumReports` - Moderation queue for flagged content
- `PetFriendlyLocations` - Crowdsourced pet-friendly stops with geo-data
- `PetFriendlyReviews` - Driver reviews and amenity verification

**Reviews & Testimonials:**
- `CarrierReviews`, `CarrierTestimonials`, `DriverTestimonials`

**Admin:**
- `AdminUsers` - Admin user records for content moderation
- `JobPostings` - Job posting submissions (for moderation)
- `TeamMembers` - Team member profiles for About page
- `CompanyMilestones` - Company timeline milestones

## API Keys (Wix Secrets Manager)

- `CLAUDE_API_KEY` - Anthropic API for synthesis
- `PERPLEXITY_API_KEY` - Web research and social scanning
- `FMCSA_WEB_KEY` - FMCSA SAFER API access
- `SECRET_KEY_STRIPE` - Stripe API secret key
- `PUBLISHABLE_STRIPE` - Stripe publishable key (safe for frontend)
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification

**Stripe Price IDs:** See `.claude/docs/pricing-and-tiers.md`

## Match Scoring Weights (carrierMatching.jsw)

```javascript
weights: { location: 25, pay: 20, operationType: 15, turnover: 12, safety: 10, truckAge: 8, fleetSize: 5, qualityScore: 5 }
```

## Scheduled Jobs

Configured in `src/backend/jobs.config`:
- `runEnrichmentBatch` runs hourly (`0 * * * *`) - Pre-enriches high-priority carriers with AI data (scheduler.jsw)
- `runBackfillMigration` runs every 30 min (`30 * * * *`) - Ensures all submitted drivers are searchable by recruiters (migrations/backfillSearchableDrivers.jsw)
- `processAbandonmentEmails` runs every 15 min (`15 * * * *`) - Processes checkout abandonment email sequences (2hr, 3-day, 7-day follow-ups) (abandonmentEmailService.jsw)

## Web Module Permissions

Permissions are defined in `src/backend/permissions.json`. Current config allows all users (anonymous, member, owner) to invoke all web methods.
