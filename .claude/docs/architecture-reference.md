# Architecture Reference

> Manual reference doc. Use `@.claude/docs/architecture-reference.md` to load when exploring the codebase.

## Backend Services (src/backend/*.jsw)

Web modules (.jsw files) expose backend functions callable from frontend. Import syntax: `import { fn } from 'backend/moduleName';`

**Core Matching Services:**
- **carrierMatching.jsw** - Main matching engine scoring carriers against driver preferences using weighted criteria (location, pay, operation type, turnover, safety, truck age, fleet size)
- **driverMatching.jsw** - Reverse matching engine enabling carriers to search and match with qualified CDL drivers (primary revenue driver with tier-based limits)
- **driverScoring.js** - Scores drivers against carrier hiring preferences using weighted criteria for qualifications, experience, location, availability, and salary fit
- **matchExplanationService.jsw** - Generates driver-facing "Why You Matched" rationale for matched carriers

**AI & Enrichment Services:**
- **aiEnrichment.jsw** - Two-stage AI pipeline: Perplexity fetches web research, Claude synthesizes into structured JSON enrichment with 14-day cache
- **aiRouterService.jsw** - LLM-agnostic provider management supporting hot-swapping between Claude, Perplexity, Gemini, OpenAI, Groq, and Mistral
- **socialScanner.jsw** - "Social Sniper" scanning Reddit, TruckersReport, and Twitter for driver sentiment on high-value carriers
- **ocrService.jsw** - Document OCR using Gemini 2.5 Flash with dual-OCR consensus for CDL verification and document extraction
- **promptLibraryService.jsw** - CRUD operations for managing AI prompts with version history and category organization

**Data Services:**
- **dataAccess.jsw** - Unified data access layer routing between Wix and Airtable based on configuration. **Required for all database operations.**
- **fmcsaService.jsw** - Fetches carrier safety data from FMCSA SAFER API including BASIC scores, inspection rates, and crash data with 7-day cache
- **carrierPreferences.jsw** - Manages carrier hiring preferences for the reverse matching engine with CRUD operations for CarrierHiringPreferences
- **driverProfiles.jsw** - Driver profile management including completeness scoring, document upload handling, and status tracking
- **carrierLeadsService.jsw** - Handles inbound carrier staffing requests with lead status management and carrier linking
- **contentService.jsw** - Blog posts, compliance guides, best practices, and partner content for content pages

**B2B Business Development Suite:**
- **b2bBridgeService.jsw** - Unified message router for B2B panels, handles authentication and permission checks
- **b2bSecurityService.jsw** - Centralized security layer for B2B suite: roles, consent validation, and audit logging
- **b2bMatchSignalService.jsw** - Match-driven prospecting signals and autonomous lead generation
- **b2bAccountService.jsw** - CRM layer for non-client carrier accounts and contacts
- **b2bPipelineService.jsw** - Sales pipeline management with stage transitions and forecasting
- **b2bActivityService.jsw** - Unified timeline for all outreach and sales interactions
- **b2bSequenceService.jsw** - Multi-channel outreach automation (email, SMS, call) with throttling
- **b2bAnalyticsService.jsw** - ROI tracking, CPA analysis, and competitor intelligence
- **b2bResearchAgentService.jsw** - AI-powered one-click carrier intelligence briefs

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
- **recruiterHealthService.jsw** - Real-time system health monitoring for recruiter dashboards
- **retentionService.jsw** - Driver retention risk analysis with risk scoring thresholds and ROI calculations for turnover prevention

**Application Services:**
- **applicationService.jsw** - Handles driver applications to carriers with full application status lifecycle management
- **memberService.jsw** - Member dashboard data including profile summaries, application stats, notifications, and activity tracking

**Gamification Services:**
- **gamificationService.jsw** - Core gamification engine handling XP/points awards, level/rank progression, and event logging with audit trail
- **streakService.jsw** - Manages driver daily login streaks, streak freezes, and multiplier calculations
- **achievementService.jsw** - Achievement engine for checking and awarding badges to drivers and recruiters based on criteria
- **badgeService.jsw** - Recruiter-specific badge tier calculations and awarding
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
- **healthService.jsw** - Crowdsourced health resources and tips for truck drivers

**Public Services:**
- **publicStatsService.jsw** - Public-facing platform statistics for homepage and landing pages (driver count, active carriers, hires)

**Infrastructure Services:**
- **scheduler.jsw** - Background job scheduling for hourly carrier enrichment batches with rate limiting
- **observabilityService.jsw** - System logging, tracing, and error tracking with configurable log levels for Super Admin visibility
- **setupCollections.jsw** - One-time setup utilities for creating required Wix collections and test records
- **http-functions.js** - HTTP endpoints including Stripe webhook handler with HMAC signature verification and idempotency

## Database Architecture (Dual-Source)

The platform uses a **dual-source architecture**. Most business data resides in **Airtable**, while authentication and system integrations stay in **Wix**. All access must go through `dataAccess.jsw`.

### Collections Staying in Wix (Pinned)
- `AdminUsers` - Permissions/auth
- `MemberNotifications` - In-app notification system
- `Members/Badges` - Member system badges
- `Members/PrivateMembersData` - Private account data

### Collections in Airtable (v2_* Tables)
- ~65+ collections including: `Carriers`, `DriverProfiles`, `Messages`, `CarrierSubscriptions`, `DriverCarrierInterests`, `MatchEvents`, and the complete B2B Suite.

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
- `runB2BSignalBatch` runs nightly (`0 3 * * *`) - Autonomous B2B prospecting (b2bMatchSignalService.jsw)

## Web Module Permissions

Permissions are defined in `src/backend/permissions.json`. Current config allows all users (anonymous, member, owner) to invoke all web methods.