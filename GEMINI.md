# LMDR (Last Mile Driver Recruiting) - Project Context

## Project Overview
LMDR is a Wix Velo-based AI matching platform connecting CDL truck drivers with carriers. It leverages a multi-stage AI enrichment pipeline (FMCSA data, Social scanning, LLM synthesis) to provide deep insights and quality matches.

**Key Technologies:**
- **Platform:** Wix Velo (Node.js/JavaScript)
- **Frontend:** Velo Page Code + Embedded React (v16.14.0)
- **AI/Enrichment:** Anthropic (Claude), Perplexity, FMCSA SAFER API
- **Data:** Wix Data Collections (Carriers, Drivers, CarrierEnrichments, etc.)

## 📘 Primary Reference: CLAUDE.md
**`CLAUDE.md` is the authoritative guide for this project.** It contains:
- Detailed backend service descriptions (`carrierMatching.jsw`, `aiEnrichment.jsw`, etc.).
- Wix Collection schemas and field types.
- Critical patterns for Wix Data querying (e.g., type safety rules).
- Standard import syntaxes and file organization rules.

**Consult `CLAUDE.md` before starting any complex task.**

## ⚓ Automated Claude Hooks
The project utilizes PowerShell hooks located in `.claude/hooks/` to enforce standards automatically. Be aware of these validators:

- **`enforce-html-location.ps1`**: Ensures all HTML files are created in `src/public/`.
- **`validate-carrier-form.ps1`**: Checks carrier landing pages for required form fields (`dotNumber`, `companyName`, etc.) and the correct postMessage bridge.
- **`check-wix-query-types.ps1`**: Likely enforces type safety in Wix Data queries.
- **`validate-html-velo-bridge.ps1`**: Validates the communication layer between HTML components and Velo page code.

## Architecture
The project follows the standard Velo structure with a monorepo approach for local development via Git Integration & Wix CLI.

*   `src/backend/*.jsw`: Secure server-side web modules. **Primary logic resides here.**
*   `src/pages/*.js`: Page-specific frontend logic (Auto-generated filenames).
*   `src/public/`: Shared client-side code and **HTML templates**.
*   `src/backend/jobs.config`: Scheduled jobs configuration.

## Critical Conventions
*   **File Organization:** HTML files MUST be in `src/public/`.
*   **Imports:** Use `import { ... } from 'backend/module';` or `'public/module';`. No relative paths.
*   **Wix Site ID:** `13e6ba60-5a5d-4a4a-8adc-5948ff78d4ef` (for MCP tools).
*   **Type Safety:** `formData` is string. Convert to `NUMBER` before querying number fields (see `CLAUDE.md` for the "Universal Pattern").

## Development Commands
*   `npm install` (Runs `wix sync-types`)
*   `npm run dev` (Starts Local Editor)
*   `npm run lint` (ESLint)

## Backend Services (`src/backend/*.jsw`)

The platform consists of 35+ backend web modules organized by functional area:

### Core Matching Services
| Service | Description |
|---------|-------------|
| `carrierMatching.jsw` | Driver-to-carrier matching engine with multi-factor scoring, enrichment cache integration, and profile tracking |
| `driverMatching.jsw` | Reverse matching engine - carriers search for qualified drivers (primary revenue driver) |
| `driverScoring.jsw` | Calculates driver match scores with dynamic weights based on carrier preferences |
| `scoring.jsw` | Shared scoring module for carrier match calculations |

### AI & Enrichment Services
| Service | Description |
|---------|-------------|
| `aiEnrichment.jsw` | Multi-stage AI pipeline: FMCSA data + Perplexity research + Claude synthesis |
| `aiRouterService.jsw` | LLM-agnostic provider management - hot-swap AI providers (Claude, Perplexity, Gemini, OpenAI, Groq) |
| `socialScanner.jsw` | Social media intelligence via Perplexity - scans Reddit, TruckersReport, X for driver sentiment |
| `ocrService.jsw` | Document OCR using Gemini 2.5 Flash with dual-pass consensus for CDL extraction |
| `fmcsaService.jsw` | FMCSA SAFER API integration with circuit breaker, rate limiting, and caching |
| `promptLibraryService.jsw` | Manages AI prompt templates for consistent LLM interactions |

### Commerce & Billing Services
| Service | Description |
|---------|-------------|
| `stripeService.jsw` | Stripe integration - checkout sessions, customer portal, subscription lifecycle |
| `subscriptionService.jsw` | Carrier subscription management, tier quotas, and usage tracking (free/pro/enterprise) |
| `abandonmentEmailService.jsw` | Checkout abandonment recovery - 3-email sequence over 7 days (2hr, 3-day, 7-day) |

### Admin Services
| Service | Description |
|---------|-------------|
| `admin_service.jsw` | Core admin operations - driver/carrier management, analytics, CSV export |
| `admin_dashboard_service.jsw` | Admin dashboard data aggregation and statistics |
| `admin_audit_service.jsw` | Audit logging for admin actions and compliance |
| `admin_content_service.jsw` | Content management for admin-controlled site content |
| `admin_match_service.jsw` | Admin tools for managing and reviewing matches |
| `carrierAdminService.jsw` | Carrier-specific admin operations |

### Communication Services
| Service | Description |
|---------|-------------|
| `messaging.jsw` | Secure in-app messaging between drivers and recruiters with permission validation |
| `messagingRealtime.jsw` | Real-time message delivery and notifications |
| `emailService.jsw` | Transactional emails - application confirmations, status updates, notifications |
| `interviewScheduler.jsw` | Interview scheduling workflow: REQUESTED -> PROPOSED -> CONFIRMED |

### Driver & Carrier Management
| Service | Description |
|---------|-------------|
| `driverProfiles.jsw` | Driver profile CRUD, document upload, OCR integration, completeness scoring |
| `driverOutreach.jsw` | Driver outreach and engagement tracking |
| `carrierPreferences.jsw` | Carrier hiring preferences and requirements |
| `carrierLeadsService.jsw` | Carrier lead management and conversion tracking |
| `applicationService.jsw` | Driver application submission and lifecycle management |

### Data & Analytics Services
| Service | Description |
|---------|-------------|
| `recruiterStats.jsw` | Recruiter performance metrics and responsiveness tracking |
| `recruiter_service.jsw` | Recruiter-specific operations and carrier assignments |
| `publicStatsService.jsw` | Public-facing statistics and metrics |
| `contentService.jsw` | Dynamic content management |
| `retentionService.jsw` | User retention metrics and engagement analysis |
| `memberService.jsw` | Wix member management and role assignments |

### Infrastructure Services
| Service | Description |
|---------|-------------|
| `scheduler.jsw` | Job orchestration - enrichment batches, abandonment follow-ups |
| `observabilityService.jsw` | System logging, distributed tracing, and metrics for Super Admin visibility |
| `http-functions.js` | HTTP endpoints - Stripe webhooks, external service integrations |
| `setupCollections.jsw` | Database collection initialization and schema setup |

### Migrations
| Service | Description |
|---------|-------------|
| `migrations/backfillSearchableDrivers.jsw` | Backfills `is_searchable` field for legacy driver profiles |

### Gamification Services
| Service | Description |
|---------|-------------|
| `gamificationService.jsw` | Core gamification engine: XP/points, levels/ranks, event logging |
| `streakService.jsw` | Driver daily login streak management, freezes, and multipliers |
| `achievementService.jsw` | Achievement checking and awarding engine for drivers/recruiters |
| `streakNotifications.jsw` | Notification logic for streak risks, breaks, and milestones |
| `gamificationJobs.jsw` | Scheduled job handlers for daily streak processing and monthly grants |
| `achievementCheckers.js` | Logic definitions for specific achievement criteria |
| `gamificationConfig.js` | Static configuration for levels, ranks, actions, and XP values |

## Scheduled Jobs (`src/backend/jobs.config`)

Three automated jobs run on cron schedules:

### 1. `runEnrichmentBatch` (Hourly)
**Location:** `/scheduler.jsw`
**Schedule:** `0 * * * *` (top of every hour)
**Description:** "Silent Night Shift" - Enriches high-priority carriers with AI-generated insights.

**Behavior:**
- Queries top 60 carriers by `combined_score`
- Filters for unenriched or stale data (>30 days old)
- Processes 3 carriers per batch (~45s to avoid 60s timeout)
- High-value targets (50+ trucks or 80%+ score) trigger Social Sniper scan
- Uses Perplexity for web research + Claude for synthesis

---

### 2. `runBackfillMigration` (Every 30 minutes)
**Location:** `/migrations/backfillSearchableDrivers.jsw`
**Schedule:** `30 * * * *` (30 minutes past each hour)
**Description:** Ensures all submitted drivers are searchable by recruiters.

**Behavior:**
- Finds driver profiles with `docs_submitted=true` but missing `is_searchable`
- Adds `is_searchable: true` and `visibility_level: 'full'`
- Processes in batches of 50 to avoid timeouts
- Safe migration - only adds fields, never modifies existing values

---

### 3. `processAbandonmentEmails` (Every 15 minutes)
**Location:** `/abandonmentEmailService.jsw`
**Schedule:** `15 * * * *` (15 minutes past each hour)
**Description:** Processes checkout abandonment email sequences.

**Behavior:**
- Queries `CheckoutAbandonment` collection for unrecovered checkouts
- Email 1: Sent immediately on abandonment (handled by webhook)
- Email 2: Sent 3 days after abandonment (social proof/success story)
- Email 3: Sent 7 days after abandonment (last chance + call CTA)
- Processes max 10 abandonments per run with 1s delay between emails
- Marks `emailXSent: true` after successful delivery

---

## HTML COMPONENT INVENTORY

HTML files are organized in `src/public/` subfolders by role (56 files total):

```
src/public/
├── admin/      # 10 files - Admin portal pages
├── recruiter/  # 9 files  - Recruiter portal pages
├── driver/     # 5 files  - Driver portal pages
├── carrier/    # 4 files  - Carrier portal pages
├── landing/    # 18 files - Landing & marketing pages
├── utility/    # 11 files - System components & templates
├── _archive/   # 2 files  - Archived/deprecated files
├── js/         # JavaScript modules
├── __tests__/  # Test files
└── [root]      # Shared resources (config, styles, sitemap)
```

### 🔴 Admin Pages (`src/public/admin/` - 10 files)
| File | Purpose |
|------|---------|
| `ADMIN_DASHBOARD.html` | Main admin dashboard with stats, AI costs |
| `ADMIN_DRIVERS.html` | Driver management, CRUD, bulk actions |
| `ADMIN_CARRIERS.html` | Carrier management, FMCSA data |
| `ADMIN_OBSERVABILITY.html` | System monitoring, logs, traces |
| `ADMIN_MATCHES.html` | Match analytics dashboard |
| `ADMIN_AUDIT_LOG.html` | Audit trail with filtering |
| `ADMIN_AI_ROUTER.html` | Multi-provider LLM routing |
| `ADMIN_PROMPTS.html` | AI prompt library |
| `ADMIN_CONTENT.html` | Content moderation queue |
| `Admin_Portal_Dashboard.html` | Alternate admin dashboard |

### 🟢 Recruiter Pages (`src/public/recruiter/` - 9 files)
| File | Purpose |
|------|---------|
| `RecruiterDashboard.html` | Master recruiter dashboard |
| `RECRUITER_DRIVER_SEARCH.html` | Driver search with AI matching |
| `Recruiter_Telemetry.html` | Call center, WebRTC |
| `Recruiter_Pipeline_Page.html` | Kanban pipeline board |
| `Recruiter_Pricing.html` | Subscription pricing |
| `Recruiter_Retention_Dashboard.html` | Churn prevention |
| `Recruiter_Console_Infograph.html` | Console infographic |
| `Recruiting_Landing_Page.html` | Recruiter landing page |
| `Recruiter_Pricing_Page.html` | Detailed pricing |

### 🔵 Driver Pages (`src/public/driver/` - 5 files)
| File | Purpose |
|------|---------|
| `AI_MATCHING.html` | Main AI matching interface (221KB) |
| `DRIVER_DASHBOARD.html` | Driver application tracking |
| `Driver Jobs.html` | Job listings display |
| `Driver Opportunities - Your Next Career.html` | Career opportunities |
| `Driver Retention Best Practices.html` | Educational content |

### 🟠 Carrier Pages (`src/public/carrier/` - 4 files)
| File | Purpose |
|------|---------|
| `Trucking Companies.html` | Carrier directory |
| `Carrier_Welcome.html` | Carrier onboarding |
| `CARRIER_WEIGHT_PREFERENCES.html` | Hiring preferences |
| `Carrier Solutions - Retention-Focused.html` | Carrier solutions |

### 🟣 Landing & Marketing Pages (`src/public/landing/` - 18 files)
| File | Purpose |
|------|---------|
| `Homepage.HTML` | Main homepage |
| `About_page.html` | About page |
| `AI vs Traditional Recruiting Methods.html` | Comparison content |
| `Quick Apply - Upload Your CDL & Resume.html` | Quick application |
| `OTR Truck Driver Placement.html` | OTR placements |
| `CDL Driver Recruitment Pricing.html` | Pricing page |
| `Last Mile Delivery Driver Staffing.html` | Last mile staffing |
| `DOT Compliance in Driver Hiring.html` | Compliance guide |
| `Unified_Recruiter_Pricing.html` | Unified pricing |
| `Apply for CDL Driving Jobs.html` | Job applications |
| `ALLURE Refrigerated-Premium Opportunity.html` | Partner: ALLURE |
| `ALLURE Onboarding.html` | Partner: ALLURE |
| `Truck_Driver_Page.html` | Driver info page |
| `lmdr-cdl-driver-landing-iframe-optimized.html` | Optimized landing |
| `Rapid Response - Job Description.html` | Job description |
| `48-Hour CDL Driver Placement.html` | Fast placement |
| `Home Nightly - Regional CDL Careers.html` | Regional careers |
| `CDL Class A Driver Recruitment.html` | Class A recruitment |

### ⚙️ Utility & System Components (`src/public/utility/` - 11 files)
| File | Purpose |
|------|---------|
| `Sidebar.html` | Navigation sidebar |
| `SETTINGS_SIDEBAR.html` | Settings navigation |
| `_TEMPLATE_Carrier_Staffing_Form.html` | Form template |
| `PRICING PAGE TEMPLATE.html` | Pricing template |
| `Orientation_Scheduler.html` | Scheduling interface |
| `DQF_Compliance_Portal.html` | DOT compliance |
| `Office_Management.html` | Office management |
| `Subscription_Success.html` | Payment success |
| `Subscription_Canceled.html` | Cancellation page |
| `Placement_Success.html` | Success confirmation |
| `application_confirmation_email.html` | Email template |

### 📦 Shared Resources (`src/public/` root)
| File | Purpose |
|------|---------|
| `lmdr-config.js` | Site configuration constants |
| `theme-utils.js` | Theme utilities |
| `theme-styles.css` | Global theme styles |
| `lastmiledrsitemap.xml` | XML sitemap |
| `README.md` | Directory documentation |

### 🗄️ Archive (`src/public/_archive/` - 2 files)
| File | Purpose |
|------|---------|
| `Driver Management Dashboard.txt` | Deprecated - archived |
| `Footer_CODE.txt` | Deprecated - archived |

---

## CONDUCTOR PROJECT HUB

The `Conductor/` directory is the project management and development workflow hub for LMDR.

### Directory Structure
```
Conductor/
├── product.md              # Product features & requirements
├── product-guidelines.md   # Brand & UI guidelines
├── tech-stack.md           # Technology decisions
├── workflow.md             # Development workflow & TDD
├── tracks.md               # Track status overview
├── setup_state.json        # Setup state tracking
├── code_styleguides/       # Code standards
│   ├── general.md          # General principles
│   ├── javascript.md       # JavaScript style (Google)
│   └── html-css.md         # HTML/CSS style (Google)
└── tracks/                 # Feature implementation tracks
```

### Key Documentation Files

#### `product.md` - Product Features & Requirements
- **Target Users:** CDL Drivers, Trucking Carriers, Recruitment Agencies
- **Core Features:**
  - Profile Persistence & Management (saved preferences, multiple profiles)
  - Advanced Search & Matching (two-way search, red flag warnings)
  - Carrier Insights & Native Reviews (star ratings, verification)
  - Driver Dashboard & Tools (match history, resume enhancement, job alerts)
  - Recruiter Subscription Tiers (Free, Pro $249/mo, Enterprise $749/mo)
  - Stripe Integration (checkout, billing portal, webhooks)

#### `tech-stack.md` - Technology Decisions
- **Platform:** Wix Velo (JavaScript ES6+)
- **Frontend:** React v16.14.0 for UI components
- **Architecture:** Monorepo (pages, backend, public, styles)
- **Auth:** `@velo/wix-members-twilio-otp`
- **Data:** Airtable connector, Calendly embed
- **AI:** Custom enrichment pipeline (FMCSA, social scanning, LLMs)
- **Payments:** Stripe (checkout sessions, customer portal, webhooks)

#### `product-guidelines.md` - Brand & UI Guidelines
- **Dual Audience Strategy:**
  - Drivers (LEFT): Warm, urgent, action-oriented
  - Carriers (RIGHT): Cool, trust-focused, ROI-driven
- **Color System:**
  - LMDR Dark: `#0f172a` | LMDR Blue: `#2563eb` | LMDR Yellow: `#fbbf24`
- **Typography:** Inter font (300-900 weights)
- **Icons:** Font Awesome 6.4 (Solid)
- **Mobile Standard:** `docs/MOBILE_OPTIMIZATION_GUIDE.md` (iPhone 12/13 target)

#### `workflow.md` - Development Workflow
- **TDD Approach:** Red-Green-Refactor cycle
- **Quality Gates:** >80% code coverage, mobile testing, security review
- **Task Lifecycle:** Select -> Mark In Progress -> Write Tests -> Implement -> Refactor -> Verify -> Commit
- **Commit Format:** `<type>(<scope>): <description>`
- **Phase Checkpointing:** Verification protocol with git notes

### Feature Implementation Tracks

Located in `Conductor/tracks/`:

| Track | Status | Priority | Description |
|-------|--------|----------|-------------|
| `persistence_20251220/` | [x] Complete | - | End-to-end profile persistence |
| `driver_cockpit_20251221/` | [x] Complete | - | Driver dashboard & application journey |
| `admin_portal_20251224/` | [ ] In Progress | High | LMDR Admin Portal |
| `reverse_matching_20251225/` | [ ] Backend Verified | Critical | Carrier-to-Driver matching engine |
| `qa_convergence_20260102/` | [x] Complete | - | System verification |
| `carrier_conversion_20260103/` | [ ] Pending | High | Carrier conversion flow optimization |
| `stripe_subscriptions_20260104/` | [ ] Planning | Critical | Stripe billing infrastructure |
| `observability_gaps_20260112/` | [~] Active | High | Tracing and error handling fixes |
| `retention_dashboard/` | [ ] Pending | - | Driver retention analytics |
| `form_ux_refactor_20260119/` | [ ] Pending | - | Form UX improvements |
| `ui_standardization_20260120/` | [ ] Pending | High | UI/UX consistency & Tailwind unification |
| `gamification_strategy_20260123/` | [~] Active | High | Driver & Recruiter progression system |
| `mobilization_20251225.md` | - | - | Mobile optimization planning |

### Code Style Guides

Located in `Conductor/code_styleguides/`:

#### `general.md` - Core Principles
- Readability, Consistency, Simplicity, Maintainability
- Document "why" not just "what"

#### `javascript.md` - JavaScript Style (Google)
- Use `const`/`let` (never `var`)
- Named exports only (no default exports)
- K&R braces, 2-space indentation, 80-char limit
- `===`/`!==` for equality, single quotes for strings
- UpperCamelCase for classes, lowerCamelCase for functions

#### `html-css.md` - HTML/CSS Style (Google)
- Lowercase everything, 2-space indentation
- Semantic HTML, valid CSS
- Class naming with hyphens (`.video-player`)
- Avoid ID selectors and `!important`
- Alphabetize CSS declarations
