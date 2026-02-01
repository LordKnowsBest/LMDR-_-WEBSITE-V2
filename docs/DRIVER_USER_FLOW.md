# Driver User Flow Diagram

> Generated: 2026-02-01
> Source: Wix Velo pages, HTML components (src/public/driver/), Conductor tracks

---

## High-Level Flow: Driver Journey After Login

```
                         ┌──────────────────────────────────────────────────────────────────────────┐
                         │                      ENTRY POINTS (Pre-Auth)                             │
                         │                                                                          │
                         │  /truck-drivers        /ai-matching         /quick-apply                 │
                         │  (Landing Page)        (Matching Engine)    (Fast Apply)                 │
                         └──────────┬─────────────────┬──────────────────┬──────────────────────────┘
                                    │                 │                  │
                                    │    ┌────────────┘                  │
                                    ▼    ▼                               ▼
                         ┌─────────────────────┐              ┌──────────────────────┐
                         │   LOGIN / SIGNUP     │              │  GUEST QUICK APPLY   │
                         │  wixUsers.promptLogin│              │  (no account needed) │
                         └─────────┬───────────┘              └──────────┬───────────┘
                                   │                                     │
                                   ▼                                     │
┌──────────────────────────────────────────────────────────────┐         │
│                    AUTHENTICATED DRIVER ZONE                  │         │
│                                                               │         │
│  ┌─────────────────────────────────────────────────────────┐ │         │
│  │              MEMBER PAGE  /member-page                   │ │         │
│  │  ┌─────────────────────────────────────────────────┐    │ │         │
│  │  │  - Profile summary + completeness score         │    │ │         │
│  │  │  - Active applications with status badges       │    │ │         │
│  │  │  - Unread notifications + message count         │    │ │         │
│  │  │  - Quick action recommendations                 │    │ │         │
│  │  └─────────────────────────────────────────────────┘    │ │         │
│  │                                                          │ │         │
│  │  Quick Actions:                                          │ │         │
│  │  [Find Matches] [Edit Profile] [View Applications]       │ │         │
│  │       │               │               │                  │ │         │
│  └───────┼───────────────┼───────────────┼──────────────────┘ │         │
│          │               │               │                    │         │
│          ▼               │               ▼                    │         │
│  ┌──────────────────┐    │    ┌────────────────────────┐      │         │
│  │  AI MATCHING      │    │    │  DRIVER DASHBOARD      │◄─────┼─────────┘
│  │  /ai-matching     │    │    │  /driver-dashboard     │      │
│  │                   │    │    │                        │      │
│  │ ┌───────────────┐│    │    │ ┌────────────────────┐ │      │
│  │ │ AI_MATCHING   ││    │    │ │ DRIVER_DASHBOARD   │ │      │
│  │ │ .html         ││    │    │ │ .html              │ │      │
│  │ │               ││    │    │ │                    │ │      │
│  │ │ - Search form ││    │    │ │ - App tracker      │ │      │
│  │ │ - Match cards ││    │    │ │ - Status badges    │ │      │
│  │ │   w/ rank     ││    │    │ │ - Chat/messaging   │ │      │
│  │ │ - FMCSA data  ││    │    │ │ - Profile strength │ │      │
│  │ │ - Pay analysis││    │    │ │ - Who viewed you   │ │      │
│  │ │ - AI intel    ││    │    │ │ - Insights panel   │ │      │
│  │ │ - Apply btn   ││    │    │ │ - Quick responses  │ │      │
│  │ │               ││    │    │ │ - Withdraw modal   │ │      │
│  │ │ Free: 2 match ││    │    │ │ - Dark/light mode  │ │      │
│  │ │ Prem: 8 match ││    │    │ │ - Filter by status │ │      │
│  │ └───────┬───────┘│    │    │ └──────┬─────────────┘ │      │
│  │         │        │    │    │        │               │      │
│  └─────────┼────────┘    │    └────────┼───────────────┘      │
│            │             │             │                      │
│    ┌───────┴──────┐      │    ┌────────┴────────────┐         │
│    │ Click Apply  │      │    │  Navigation Links   │         │
│    ▼              │      │    ▼                     │         │
│  ┌───────────────────┐   │  ┌──────────┬───────────┬──────┐  │
│  │  QUICK APPLY      │   │  │          │           │      │  │
│  │  /quick-apply     │   │  │          │           │      │  │
│  │                   │   │  │          ▼           ▼      │  │
│  │ - CDL upload      │   │  │  ┌─────────────┐ ┌──────┐  │  │
│  │   (front/back)    │   │  │  │  MY CAREER  │ │ ROAD │  │  │
│  │ - Medical card    │   │  │  │  /driver-   │ │UTILS │  │  │
│  │ - Resume upload   │   │  │  │  my-career  │ │      │  │  │
│  │ - OCR auto-fill   │   │  │  │             │ │      │  │  │
│  │ - Contact info    │   │  │  │ DRIVER_MY_  │ │DRIVER│  │  │
│  │ - Submit to       │   │  │  │ CAREER.html │ │_ROAD_│  │  │
│  │   carrier         │   │  │  │             │ │UTILS │  │  │
│  └─────────┬─────────┘   │  │  │ - Timeline  │ │.html │  │  │
│            │             │  │  │ - Job hist  │ │      │  │  │
│            ▼             │  │  │ - Resign    │ │ Tabs:│  │  │
│  ┌───────────────────┐   │  │  │   modal     │ │ 1.🅿️ │  │  │
│  │  DOCUMENT UPLOAD  │   │  │  │ - Survey    │ │ 2.⛽ │  │  │
│  │  (onboarding)     │   │  │  │ - Feedback  │ │ 3.⚖️ │  │  │
│  │                   │   │  │  └─────────────┘ │ 4.🛑 │  │  │
│  │ DRIVER_DOCUMENT_  │   │  │                  │ 5.🌧️ │  │  │
│  │ UPLOAD.html       │   │  │                  │ 6.🚧 │  │  │
│  │                   │   │  │                  └──────┘  │  │
│  │ - Drag & drop     │   │  │                            │  │
│  │ - Progress bar    │   │  └────────────────────────────┘  │
│  │ - Status pills    │   │                                  │
│  │ - Help guides     │   │                                  │
│  └───────────────────┘   │                                  │
│                          │                                  │
│  ┌───────────────────────┼──────────────────────────────┐   │
│  │     GAMIFICATION LAYER (accessible from all pages)   │   │
│  │                       │                              │   │
│  │  ┌──────────────────┐ │ ┌──────────────┐ ┌────────┐ │   │
│  │  │ GAMIFICATION     │ │ │ BADGES       │ │CHALLENG│ │   │
│  │  │ /driver-         │ │ │ /driver-     │ │ES      │ │   │
│  │  │ gamification     │ │ │ badges       │ │        │ │   │
│  │  │                  │ │ │              │ │CHALLENG│ │   │
│  │  │ DRIVER_          │ │ │ DRIVER_      │ │ES.html │ │   │
│  │  │ GAMIFICATION     │ │ │ BADGES.html  │ │        │ │   │
│  │  │ .html            │ │ │              │ │-Active │ │   │
│  │  │                  │ │ │ - Featured   │ │-Avail  │ │   │
│  │  │ - XP bar         │ │ │   badges     │ │-Done   │ │   │
│  │  │ - Level system   │ │ │ - Categories │ │-Filter │ │   │
│  │  │ - Streak counter │ │ │ - Lock/unlock│ │-Claim  │ │   │
│  │  │ - Challenges     │ │ │ - Progress   │ │        │ │   │
│  │  │ - Achievements   │ │ │ - Detail     │ │        │ │   │
│  │  │ - Recommendations│ │ │   modals     │ │        │ │   │
│  │  └──────────────────┘ │ └──────────────┘ └────────┘ │   │
│  └───────────────────────┼──────────────────────────────┘   │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    (Profile Editing
                     flows back into
                     any page context)
```

---

## Detailed Page-by-Page Inventory

### Wix Velo Pages (src/pages/)

| # | Page File | Route | Purpose | Status |
|---|-----------|-------|---------|--------|
| 1 | `Truck Drivers .gsx0g.js` | `/truck-drivers` | Public landing page, top jobs, testimonials, social proof | Active |
| 2 | `AI - Matching.rof4w.js` | `/ai-matching` | AI carrier matching engine (core feature) | Active |
| 3 | `Quick Apply - Upload Your CDL & Resume.pa6f5.js` | `/quick-apply` | Fast document upload + apply flow | Active |
| 4 | `Driver Dashboard.ctupv.js` | `/driver-dashboard` | Application tracker & communications hub | Active |
| 5 | `Member Page.k40gh.js` | `/member-page` | Member dashboard, profile, notifications | Active |
| 6 | `Driver Badges.js` | `/driver-badges` | Gamification badge showcase | Active |
| 7 | `Driver Jobs (Item).s0js1.js` | `/driver-jobs/{slug}` | Dynamic job detail page (SEO-rich) | Active |
| 8 | `Apply for CDL Driving Jobs.e4a6t.js` | `/apply-cdl-jobs` | Placeholder/SEO landing | Stub |
| 9 | `Driver Opportunities - Your Next Career .lb0uy.js` | `/driver-opportunities` | Placeholder/SEO landing | Stub |
| 10 | `Placement Success.tz647.js` | `/placement-success` | Post-Stripe-payment success (carrier-facing) | Active |

### HTML Components (src/public/driver/)

| # | HTML File | Loaded By | Lines | Purpose |
|---|-----------|-----------|-------|---------|
| 1 | `AI_MATCHING.html` | AI - Matching page | ~77K | Match cards, FMCSA data, pay analysis, apply buttons |
| 2 | `DRIVER_DASHBOARD.html` | Driver Dashboard page | ~1345 | App tracker, chat, profile strength, insights |
| 3 | `DRIVER_DOCUMENT_UPLOAD.html` | Quick Apply page | ~1009 | Drag-drop upload, OCR, status pills, help guides |
| 4 | `DRIVER_MY_CAREER.html` | (Dashboard nav) | ~244 | Career timeline, resignation flow, surveys |
| 5 | `DRIVER_ROAD_UTILITIES.html` | (Standalone page) | ~29K+ | 6-tab road tools (parking, fuel, weigh, rest, weather, road) |
| 6 | `DRIVER_GAMIFICATION.html` | (Widget/page) | ~806 | XP bar, streak, challenges, achievements, recs |
| 7 | `DRIVER_BADGES.html` | Driver Badges page | ~659 | Badge showcase, featured selection, categories |
| 8 | `CHALLENGES.html` | (From gamification) | ~806 | Challenge hub: active/available/completed tabs |
| 9 | `Driver Jobs.html` | Driver Jobs (Item) | ~1500+ | Rich job detail: pay, benefits, requirements, CTA |

---

## Road Utilities Tab Breakdown

```
DRIVER_ROAD_UTILITIES.html
┌──────────────────────────────────────────────────────┐
│  [🅿️ Parking] [⛽ Fuel] [⚖️ Weigh] [🛑 Rest] [🌧️ Wx] [🚧 Road] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Tab 1: PARKING FINDER                               │
│  - Search by location                                │
│  - Amenities filter (showers, food, wifi)            │
│  - TPIMS real-time sensor data (9 state APIs)        │
│  - Availability status                               │
│                                                      │
│  Tab 2: FUEL OPTIMIZER                               │
│  - Cheapest diesel nearby                            │
│  - Savings calculator                                │
│  - Fuel card discount integration                    │
│                                                      │
│  Tab 3: WEIGH STATION STATUS                         │
│  - Real-time open/closed                             │
│  - Bypass rates                                      │
│  - PrePass / DriveWyze integration                   │
│                                                      │
│  Tab 4: REST STOP RATINGS                            │
│  - Community-driven reviews                          │
│  - Multi-category ratings                            │
│  - Amenity details                                   │
│                                                      │
│  Tab 5: WEATHER ALERTS                               │
│  - NWS API route-specific warnings                   │
│  - Chain law status                                  │
│  - Severe weather zones                              │
│                                                      │
│  Tab 6: ROAD CONDITIONS                              │
│  - State 511 API data                                │
│  - Construction zones                                │
│  - Closures & truck restrictions                     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Conductor Tracks (Driver-Relevant)

| # | Track | Status | Key Deliverable |
|---|-------|--------|-----------------|
| 1 | `driver_cockpit_20251221` | **Complete** | Full application journey (save → apply → track) |
| 2 | `driver_utility_expansion_20260120` | **Phase 1-4 Done** | Profile strength, quick replies, who-viewed-you, insights |
| 3 | `driver_road_utilities_20260120` | **Core Done** | 6-tab road utilities (parking, fuel, weigh, rest, weather, road) |
| 4 | `gamification_strategy_20260123` | **Complete** | XP, levels, badges, streaks, challenges, leaderboards |
| 5 | `driver_lifecycle_disposition_20260128` | **Complete** | Career page, exit surveys, feedback loop to matching algo |
| 6 | `driver_compliance_tools_20260120` | **Planned** | HOS tracker, document wallet, expiration alerts |
| 7 | `driver_financial_tools_20260120` | **Planned** | Settlement viewer, expense tracker, trip calculator |
| 8 | `driver_community_20260120` | **Planned** | Forums, mentor matching, pet-friendly DB, health resources |

---

## PostMessage Bridge Pattern (All Driver HTML)

Every HTML component communicates with its parent Wix Velo page via PostMessage:

```
┌─────────────────────┐          PostMessage           ┌─────────────────────┐
│   Wix Velo Page     │  ◄──────────────────────────►  │   HTML Component    │
│   (src/pages/*.js)  │    { type, data }              │   (src/public/      │
│                     │                                │    driver/*.html)   │
│  Backend calls:     │    Outbound (HTML → Velo):     │                     │
│  - getDriverProfile │    - *Ready (init signal)      │  UI Rendering:      │
│  - findMatches      │    - refreshData               │  - Tailwind CSS     │
│  - submitApp        │    - navigateTo*               │  - GSAP animations  │
│  - enrichCarrier    │    - submitForm                │  - Dark mode toggle │
│  - getConversation  │    - logInteraction            │  - Responsive grid  │
│                     │                                │                     │
│  Sends to HTML:     │    Inbound (Velo → HTML):      │  Receives from Velo:│
│  - dashboardData    │    - *Data (payload)           │  - Parsed data      │
│  - matchResults     │    - *Success / *Error         │  - Status updates   │
│  - conversationData │    - enrichmentUpdate          │  - Error messages   │
└─────────────────────┘                                └─────────────────────┘
```

---

## Complete Driver User Flow (Sequential)

```
                    ┌─────────────────────────┐
                    │   DRIVER LANDS ON SITE   │
                    │   /truck-drivers or      │
                    │   /ai-matching or        │
                    │   direct /quick-apply    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  DISCOVERY PHASE         │
                    │                          │
                    │  Browse top jobs         │
                    │  View testimonials       │
                    │  See recent hires        │
                    │  Click "Find Matches"    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  MATCHING PHASE          │
                    │  /ai-matching            │
                    │                          │
                    │  1. Enter preferences    │
                    │  2. View ranked matches  │
                    │  3. See FMCSA safety     │
                    │  4. Read AI intel        │
                    │  5. Compare pay/benefits │
                    │                          │
                    │  Free: 2 results         │
                    │  Premium: 8 results      │
                    └──────┬──────────┬───────┘
                           │          │
              ┌────────────┘          └────────────┐
              ▼                                    ▼
   ┌─────────────────────┐           ┌─────────────────────┐
   │  SAVE / INTEREST    │           │  APPLY DIRECTLY     │
   │                     │           │  (Click Apply btn)  │
   │  Bookmark carrier   │           │                     │
   │  for later review   │           │  Routes to:         │
   │                     │           │  /quick-apply?      │
   └─────────┬───────────┘           │  carrier=DOT        │
             │                       └──────────┬──────────┘
             │                                  │
             │               ┌──────────────────▼──────────────────┐
             │               │  APPLICATION PHASE                   │
             │               │  /quick-apply                        │
             │               │                                      │
             │               │  1. Upload CDL (front + back)        │
             │               │  2. Upload Medical Card              │
             │               │  3. Upload Resume                    │
             │               │  4. OCR auto-fills form fields       │
             │               │  5. Review/edit contact info         │
             │               │  6. Submit application               │
             │               │                                      │
             │               │  [Guest OK - no login required]      │
             │               └──────────────────┬──────────────────┘
             │                                  │
             │               ┌──────────────────▼──────────────────┐
             │               │  ONBOARDING (if carrier requests)    │
             │               │  DRIVER_DOCUMENT_UPLOAD.html         │
             │               │                                      │
             │               │  - Additional docs per carrier       │
             │               │  - Status tracking (pending/verified)│
             │               │  - Rejection feedback + reupload     │
             │               └──────────────────┬──────────────────┘
             │                                  │
             └──────────────┬───────────────────┘
                            │
             ┌──────────────▼──────────────────────────────────────┐
             │  TRACKING PHASE                                      │
             │  /driver-dashboard                                   │
             │                                                      │
             │  ┌────────────────────────────────────────────────┐  │
             │  │  APPLICATION TRACKER                           │  │
             │  │  ┌──────┬──────────┬───────────┬────────────┐  │  │
             │  │  │ Save │ Applied  │ In Review │ Interview  │  │  │
             │  │  │  ●   │    ●     │     ●     │     ●      │  │  │
             │  │  │      │          │           │     │      │  │  │
             │  │  │      │          │           │     ▼      │  │  │
             │  │  │      │          │           │  ┌──────┐  │  │  │
             │  │  │      │          │           │  │Offer │  │  │  │
             │  │  │      │          │           │  │  or  │  │  │  │
             │  │  │      │          │           │  │Reject│  │  │  │
             │  │  └──────┴──────────┴───────────┴──┴──────┘  │  │
             │  └────────────────────────────────────────────────┘  │
             │                                                      │
             │  ┌──────────────┐  ┌─────────────┐  ┌────────────┐  │
             │  │ Chat/Message │  │ Profile     │  │ Who Viewed │  │
             │  │ Recruiters   │  │ Strength %  │  │ You Panel  │  │
             │  └──────────────┘  └─────────────┘  └────────────┘  │
             │                                                      │
             │  ┌──────────────────────────────────────────────┐    │
             │  │ INSIGHTS: 30-day views │ Pipeline │ Offer %  │    │
             │  └──────────────────────────────────────────────┘    │
             └───────────┬──────────┬──────────┬───────────────────┘
                         │          │          │
          ┌──────────────┘          │          └──────────────┐
          ▼                         ▼                         ▼
┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  MY CAREER       │  │  ROAD UTILITIES      │  │  GAMIFICATION        │
│  /driver-        │  │  (6-tab tool suite)   │  │  LAYER               │
│  my-career       │  │                       │  │                      │
│                  │  │  🅿️ Parking Finder    │  │  ┌────────────────┐  │
│  - Job timeline  │  │  ⛽ Fuel Optimizer    │  │  │ XP & Levels    │  │
│  - Employment    │  │  ⚖️ Weigh Stations    │  │  │ Rookie→Legend  │  │
│    history       │  │  🛑 Rest Stop Ratings │  │  ├────────────────┤  │
│  - Resignation   │  │  🌧️ Weather Alerts    │  │  │ Achievements   │  │
│    flow          │  │  🚧 Road Conditions   │  │  │ & Badges       │  │
│  - Exit survey   │  │                       │  │  ├────────────────┤  │
│  - Feedback to   │  │  Data sources:        │  │  │ Challenges     │  │
│    matching algo │  │  - TPIMS (9 states)   │  │  │ Daily/Weekly   │  │
│                  │  │  - NWS API            │  │  ├────────────────┤  │
│                  │  │  - State 511 APIs     │  │  │ Streaks        │  │
│                  │  │  - PrePass/DriveWyze  │  │  │ & Multipliers  │  │
│                  │  │                       │  │  └────────────────┘  │
└──────────────────┘  └───────────────────────┘  └──────────────────────┘
```

---

## Feature Status by Conductor Track

```
  COMPLETE                           IN PROGRESS              PLANNED
  ─────────                          ───────────              ───────
  ■ Driver Cockpit                   □ Utility Expansion      ○ Compliance Tools
    (Application Journey)              (Phase 5: Mobile QA)     (HOS, Doc Wallet)

  ■ Gamification System              □ Road Utilities         ○ Financial Tools
    (XP, Badges, Challenges)           (Optimization pass)      (Settlements, Tax)

  ■ Lifecycle & Disposition                                   ○ Community
    (Career page, Exit surveys)                                 (Forums, Mentors)

  ■ = Shipped    □ = 80%+ done    ○ = Not started
```
