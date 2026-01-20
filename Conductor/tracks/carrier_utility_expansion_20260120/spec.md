# Specification: Carrier Utility Expansion

## 1. Overview

This track expands the utility of existing carrier features to improve onboarding completion rates and engagement. It introduces three key features that make the carrier experience more streamlined and valuable:

1. **Preference Presets** - One-click hiring preference templates
2. **Status Tracker** - Real-time profile and enrichment progress visibility
3. **Instant Match Preview** - Driver count estimates on lead forms before submission

### Business Context

| Metric | Current | Target | Impact |
|--------|---------|--------|--------|
| Preference setup completion | ~40% | 75% | Higher match quality |
| Carrier Welcome engagement | 1-2 min | 5+ min | Better onboarding |
| Form submission rate | ~60% | 80% | More qualified leads |

### Dependencies

- `carrier_conversion_20260103` - Carrier lead flow and Stripe integration
- `reverse_matching_20251225` - Driver matching engine and preferences system

---

## 2. Feature 1: Preference Presets

### 2.1 Overview

Pre-configured hiring preference templates that allow carriers to quickly set up their matching criteria with one click. Templates are designed for common trucking operation types.

### 2.2 Preset Templates

| Preset Name | Description | Use Case |
|-------------|-------------|----------|
| **OTR Heavy Haul** | Long-haul drivers for heavy/oversized loads | Specialized carriers |
| **Regional Dedicated** | Consistent regional routes, home weekly | Mid-size fleets |
| **Local P&D** | Local pickup & delivery, daily home | Last-mile carriers |
| **Tanker/Hazmat** | Specialized endorsements required | Chemical/fuel carriers |
| **Flatbed/Stepdeck** | Open deck freight specialists | Construction/machinery |

### 2.3 Preset Data Structure

```javascript
const PRESET_TEMPLATES = {
  otr_heavy_haul: {
    id: 'otr_heavy_haul',
    name: 'OTR Heavy Haul',
    description: 'Long-haul drivers for heavy/oversized loads',
    icon: 'truck', // Lucide icon name
    weights: {
      weight_qualifications: 35,
      weight_experience: 25,
      weight_location: 10,
      weight_availability: 15,
      weight_salaryFit: 10,
      weight_engagement: 5
    },
    preferences: {
      required_cdl_types: ['A'],
      min_experience_years: 3,
      required_endorsements: [],
      route_types: ['otr', 'regional'],
      equipment_types: ['heavy_haul', 'oversize', 'flatbed']
    }
  },
  regional_dedicated: {
    id: 'regional_dedicated',
    name: 'Regional Dedicated',
    description: 'Consistent regional routes, home weekly',
    icon: 'map-pin',
    weights: {
      weight_qualifications: 25,
      weight_experience: 15,
      weight_location: 30,
      weight_availability: 15,
      weight_salaryFit: 10,
      weight_engagement: 5
    },
    preferences: {
      required_cdl_types: ['A'],
      min_experience_years: 1,
      required_endorsements: [],
      route_types: ['regional', 'dedicated'],
      equipment_types: ['dry_van', 'reefer']
    }
  },
  local_pd: {
    id: 'local_pd',
    name: 'Local P&D',
    description: 'Local pickup & delivery, daily home time',
    icon: 'home',
    weights: {
      weight_qualifications: 20,
      weight_experience: 10,
      weight_location: 40,
      weight_availability: 20,
      weight_salaryFit: 5,
      weight_engagement: 5
    },
    preferences: {
      required_cdl_types: ['A', 'B'],
      min_experience_years: 0,
      required_endorsements: [],
      route_types: ['local'],
      equipment_types: ['straight_truck', 'box_truck', 'dry_van']
    }
  },
  tanker_hazmat: {
    id: 'tanker_hazmat',
    name: 'Tanker/Hazmat',
    description: 'Specialized tanker and hazmat endorsements',
    icon: 'alert-triangle',
    weights: {
      weight_qualifications: 45,
      weight_experience: 20,
      weight_location: 15,
      weight_availability: 10,
      weight_salaryFit: 5,
      weight_engagement: 5
    },
    preferences: {
      required_cdl_types: ['A'],
      min_experience_years: 2,
      required_endorsements: ['H', 'N', 'X'],
      route_types: ['otr', 'regional', 'local'],
      equipment_types: ['tanker']
    }
  },
  flatbed_stepdeck: {
    id: 'flatbed_stepdeck',
    name: 'Flatbed/Stepdeck',
    description: 'Open deck freight and securement specialists',
    icon: 'layers',
    weights: {
      weight_qualifications: 30,
      weight_experience: 25,
      weight_location: 15,
      weight_availability: 15,
      weight_salaryFit: 10,
      weight_engagement: 5
    },
    preferences: {
      required_cdl_types: ['A'],
      min_experience_years: 2,
      required_endorsements: [],
      route_types: ['otr', 'regional'],
      equipment_types: ['flatbed', 'stepdeck', 'rgn']
    }
  }
};
```

### 2.4 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PREFERENCE PRESETS FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │          CARRIER_WEIGHT_PREFERENCES.html                              │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │  PRESET SELECTOR (New Section)                                   │ │   │
│  │  │                                                                  │ │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │ │   │
│  │  │  │ OTR      │ │ Regional │ │ Local    │ │ Tanker   │ ...        │ │   │
│  │  │  │ Heavy    │ │ Dedicated│ │ P&D      │ │ Hazmat   │            │ │   │
│  │  │  │ Haul     │ │          │ │          │ │          │            │ │   │
│  │  │  └────┬─────┘ └──────────┘ └──────────┘ └──────────┘            │ │   │
│  │  │       │                                                          │ │   │
│  │  │       │ click                                                    │ │   │
│  │  │       ▼                                                          │ │   │
│  │  │  ┌─────────────────────────────────────────────────────────────┐ │ │   │
│  │  │  │ CONFIRMATION MODAL                                          │ │ │   │
│  │  │  │                                                             │ │ │   │
│  │  │  │ "Apply OTR Heavy Haul preset?"                              │ │ │   │
│  │  │  │                                                             │ │ │   │
│  │  │  │ This will update:                                           │ │ │   │
│  │  │  │ • Scoring weights                                           │ │ │   │
│  │  │  │ • CDL requirements                                          │ │ │   │
│  │  │  │ • Experience minimum                                        │ │ │   │
│  │  │  │                                                             │ │ │   │
│  │  │  │ [Cancel]  [Apply Preset]                                    │ │ │   │
│  │  │  └─────────────────────────────────────────────────────────────┘ │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │  EXISTING: Weight Sliders                                       │ │   │
│  │  │  (Pre-filled with preset values, user can still customize)      │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│                              postMessage                                     │
│                                  │                                           │
│                                  ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  carrierPreferences.jsw                                               │   │
│  │                                                                       │   │
│  │  + getPresetTemplates()         - Returns all preset definitions      │   │
│  │  + applyPresetTemplate(dot, id) - Applies preset to carrier prefs     │   │
│  │  + saveWeightPreferences(...)   - (existing) saves to collection      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.5 UI Mockup (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Match Score Preferences                                      [Reset]        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  QUICK START - Choose a preset to get started quickly                       │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ [truck]     │  │ [map-pin]   │  │ [home]      │  │ [alert]     │        │
│  │             │  │             │  │             │  │             │        │
│  │ OTR Heavy   │  │ Regional    │  │ Local P&D   │  │ Tanker/     │        │
│  │ Haul        │  │ Dedicated   │  │             │  │ Hazmat      │        │
│  │             │  │             │  │             │  │             │        │
│  │ 3+ yrs exp  │  │ 1+ yr exp   │  │ Entry OK    │  │ H/N/X req   │        │
│  │ CDL-A only  │  │ Home weekly │  │ Daily home  │  │ 2+ yrs exp  │        │
│  │             │  │             │  │             │  │             │        │
│  │  [Apply]    │  │  [Apply]    │  │  [Apply]    │  │  [Apply]    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│  ┌─────────────┐                                                            │
│  │ [layers]    │                                                            │
│  │             │                                                            │
│  │ Flatbed/    │   Or customize weights manually below                      │
│  │ Stepdeck    │   ────────────────────────────────                         │
│  │             │                                                            │
│  │ 2+ yrs exp  │                                                            │
│  │ Securement  │                                                            │
│  │             │                                                            │
│  │  [Apply]    │                                                            │
│  └─────────────┘                                                            │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  SCORING WEIGHTS                                                            │
│  ───────────────                                                            │
│                                                                             │
│  [icon] Qualifications                                              30%     │
│         CDL class, endorsements, clean record                               │
│         ──────────────────────[●]──────────────────                         │
│                                                                             │
│  [icon] Experience                                                  25%     │
│         Years driving, equipment familiarity                                │
│         ─────────────────[●]───────────────────────                         │
│                                                                             │
│  ... (existing sliders)                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Feature 2: Status Tracker

### 3.1 Overview

Displays real-time progress indicators on the Carrier_Welcome.html page, showing carriers where they are in the onboarding/enrichment process and what outcomes to expect.

### 3.2 Status States

| State | Display | Description |
|-------|---------|-------------|
| `submitted` | "Request Received" | Lead form submitted, awaiting processing |
| `enriching` | "Building Your Profile" | AI enrichment in progress |
| `enriched` | "Profile Enhanced" | Enrichment complete, data available |
| `live` | "Profile Live" | Carrier visible to drivers for matching |
| `matching` | "X Drivers Matched" | Active matches available |

### 3.3 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STATUS TRACKER FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Carrier_Welcome.html (Page Code)                                     │   │
│  │                                                                       │   │
│  │  $w.onReady(async () => {                                             │   │
│  │    // Get carrier DOT from URL params or session                      │   │
│  │    const status = await getCarrierOnboardingStatus(carrierDot);       │   │
│  │                                                                       │   │
│  │    // Send to HTML component                                          │   │
│  │    $w('#statusTracker').postMessage({                                 │   │
│  │      type: 'loadStatus',                                              │   │
│  │      data: status                                                     │   │
│  │    });                                                                │   │
│  │  });                                                                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│                              postMessage                                     │
│                                  │                                           │
│                                  ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  STATUS_TRACKER.html (New Component - embedded in Carrier_Welcome)    │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │                                                                  │ │   │
│  │  │  Your Profile Status                                             │ │   │
│  │  │                                                                  │ │   │
│  │  │  [✓]────[✓]────[●]────[ ]────[ ]                                │ │   │
│  │  │   │      │      │      │      │                                  │ │   │
│  │  │  Recv  Enrich Active Match  Hire                                 │ │   │
│  │  │                                                                  │ │   │
│  │  │  "Building Your Profile..."                                      │ │   │
│  │  │  Our AI is analyzing your FMCSA data and online presence         │ │   │
│  │  │                                                                  │ │   │
│  │  │  ┌───────────────────────────────────────────────────────────┐  │ │   │
│  │  │  │  12 drivers match your criteria                            │  │ │   │
│  │  │  │  [View Matches →]                                          │  │ │   │
│  │  │  └───────────────────────────────────────────────────────────┘  │ │   │
│  │  │                                                                  │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│                              getData                                         │
│                                  │                                           │
│                                  ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  carrierStatusService.jsw (New)                                       │   │
│  │                                                                       │   │
│  │  + getCarrierOnboardingStatus(carrierDot)                             │   │
│  │    - Queries: Carriers, CarrierEnrichments, DriverProfiles            │   │
│  │    - Returns: { stage, enrichmentStatus, matchCount, nextAction }     │   │
│  │                                                                       │   │
│  │  + getMatchCount(carrierDot)                                          │   │
│  │    - Quick count of drivers matching basic criteria                   │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Data Model

#### Status Response Object

```javascript
{
  success: true,
  status: {
    // Current stage (1-5)
    stage: 3,
    stageName: 'enriching',
    stageLabel: 'Building Your Profile',

    // Stage completion
    stages: [
      { id: 1, name: 'received', label: 'Request Received', completed: true },
      { id: 2, name: 'processing', label: 'Processing', completed: true },
      { id: 3, name: 'enriching', label: 'AI Enrichment', completed: false, active: true },
      { id: 4, name: 'live', label: 'Profile Live', completed: false },
      { id: 5, name: 'matching', label: 'Matching', completed: false }
    ],

    // Enrichment details (if in enriching stage)
    enrichment: {
      status: 'in_progress',
      startedAt: '2026-01-20T10:30:00Z',
      estimatedCompletion: '2026-01-20T10:45:00Z',
      progress: 60 // percentage
    },

    // Match preview (available once carrier has basic data)
    matchPreview: {
      available: true,
      count: 12,
      lastUpdated: '2026-01-20T10:00:00Z'
    },

    // Next action prompt
    nextAction: {
      type: 'wait', // 'wait' | 'action' | 'upgrade'
      message: 'AI enrichment typically completes within 15 minutes',
      cta: null
    }
  }
}
```

### 3.5 UI Mockup (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  YOUR ONBOARDING PROGRESS                                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│     [✓]         [✓]         [●]         [ ]         [ ]                    │
│      │           │           │           │           │                      │
│   Request      Data       Building     Profile      Active                  │
│   Received   Verified     Profile       Live       Matching                 │
│                              ▼                                              │
│                         In Progress                                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  [AI Icon]  Building Your Intelligence Profile                      │   │
│  │                                                                     │   │
│  │  Our AI is analyzing:                                               │   │
│  │  ✓ FMCSA safety data                                                │   │
│  │  ✓ Fleet composition                                                │   │
│  │  ● Online presence & reviews (in progress)                          │   │
│  │  ○ Industry sentiment                                               │   │
│  │                                                                     │   │
│  │  ████████████████████░░░░░░░░  60%                                  │   │
│  │                                                                     │   │
│  │  Estimated completion: ~5 minutes                                   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  [Users Icon]  MATCH PREVIEW                                        │   │
│  │                                                                     │   │
│  │       12                                                            │   │
│  │  ─────────────                                                      │   │
│  │  drivers match your current criteria                                │   │
│  │                                                                     │   │
│  │  Top matches include drivers with:                                  │   │
│  │  • CDL-A with 3+ years experience                                   │   │
│  │  • Clean driving records                                            │   │
│  │  • Located within 150 miles                                         │   │
│  │                                                                     │   │
│  │  [View Matching Drivers →]                                          │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Feature 3: Instant Match Preview

### 4.1 Overview

Shows carriers a real-time estimate of matching drivers before they submit their lead form. This creates urgency and validates the platform's value proposition.

### 4.2 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INSTANT MATCH PREVIEW FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Carrier Lead Form (Landing Page)                                     │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │  Company Name: [ABC Trucking                    ]               │ │   │
│  │  │  DOT Number:   [1234567                         ] ← triggers    │ │   │
│  │  │  Drivers Needed: [5-10                          ]   preview     │ │   │
│  │  │  Driver Types: [x] CDL-A  [ ] CDL-B  [x] Hazmat                 │ │   │
│  │  │  Region:       [Southeast                       ]               │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                       │   │
│  │                        onChange (debounced)                           │   │
│  │                              │                                        │   │
│  │                              ▼                                        │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │  MATCH PREVIEW CARD (appears after criteria entered)            │ │   │
│  │  │                                                                 │ │   │
│  │  │  ┌───────────────────────────────────────────────────────────┐ │ │   │
│  │  │  │  [✓] Based on your criteria, we have:                     │ │ │   │
│  │  │  │                                                           │ │ │   │
│  │  │  │       23 MATCHING DRIVERS                                 │ │ │   │
│  │  │  │       ─────────────────────                               │ │ │   │
│  │  │  │       ready to connect with you                           │ │ │   │
│  │  │  │                                                           │ │ │   │
│  │  │  │  • 15 CDL-A drivers                                       │ │ │   │
│  │  │  │  • 8 with Hazmat endorsement                              │ │ │   │
│  │  │  │  • Average 4.2 years experience                           │ │ │   │
│  │  │  │                                                           │ │ │   │
│  │  │  └───────────────────────────────────────────────────────────┘ │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                       │   │
│  │  [Submit Request]                                                     │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│                              postMessage                                     │
│                                  │                                           │
│                                  ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  carrierLeadsService.jsw                                              │   │
│  │                                                                       │   │
│  │  + getMatchPreview(criteria)        (NEW)                             │   │
│  │    - Input: { cdlTypes, endorsements, region, minExperience }         │   │
│  │    - Output: { count, breakdown, avgExperience }                      │   │
│  │    - Public function (no auth required for preview)                   │   │
│  │    - Rate limited: 5 requests per minute per IP                       │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│                              queries                                         │
│                                  │                                           │
│                                  ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  DriverProfiles Collection                                            │   │
│  │                                                                       │   │
│  │  Query: is_searchable = true                                          │   │
│  │         AND cdl_class IN [criteria.cdlTypes]                          │   │
│  │         AND endorsements hasAll [criteria.endorsements]               │   │
│  │         AND years_experience >= criteria.minExperience                │   │
│  │                                                                       │   │
│  │  Returns: count, groupBy cdl_class, avg years_experience              │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 API Design

#### getMatchPreview Function

```javascript
/**
 * Get a preview of matching driver count based on criteria
 * PUBLIC FUNCTION - No authentication required
 * Rate limited to prevent abuse
 *
 * @param {Object} criteria
 * @param {Array<string>} [criteria.cdlTypes] - CDL classes to match ['A', 'B']
 * @param {Array<string>} [criteria.endorsements] - Required endorsements
 * @param {string} [criteria.region] - Geographic region (state or area)
 * @param {number} [criteria.minExperience] - Minimum years experience
 * @param {number} [criteria.driversNeeded] - Number of drivers needed (for messaging)
 * @returns {Promise<Object>} Match preview results
 */
export async function getMatchPreview(criteria) {
  try {
    // Build base query for searchable drivers
    let query = wixData.query('DriverProfiles')
      .eq('is_searchable', true)
      .ne('visibility_level', 'hidden');

    // Apply CDL type filter
    if (criteria.cdlTypes && criteria.cdlTypes.length > 0) {
      query = query.hasSome('cdl_class', criteria.cdlTypes);
    }

    // Apply endorsement filter (must have ALL specified)
    if (criteria.endorsements && criteria.endorsements.length > 0) {
      query = query.hasAll('endorsements', criteria.endorsements);
    }

    // Apply experience filter
    if (criteria.minExperience && typeof criteria.minExperience === 'number') {
      query = query.ge('years_experience', criteria.minExperience);
    }

    // Execute count query
    const result = await query.find({ suppressAuth: true });
    const drivers = result.items;
    const totalCount = drivers.length;

    // Calculate breakdown
    const breakdown = {
      byClass: {},
      withEndorsements: 0,
      avgExperience: 0
    };

    let totalExperience = 0;

    for (const driver of drivers) {
      // Count by CDL class
      const cdlClass = driver.cdl_class || 'Unknown';
      breakdown.byClass[cdlClass] = (breakdown.byClass[cdlClass] || 0) + 1;

      // Count with endorsements
      if (driver.endorsements && driver.endorsements.length > 0) {
        breakdown.withEndorsements++;
      }

      // Sum experience
      totalExperience += driver.years_experience || 0;
    }

    breakdown.avgExperience = totalCount > 0
      ? Math.round((totalExperience / totalCount) * 10) / 10
      : 0;

    // Build messaging based on count
    let message;
    if (totalCount === 0) {
      message = 'We don\'t have exact matches yet, but our network is growing daily.';
    } else if (totalCount < 5) {
      message = `We have ${totalCount} drivers that match your criteria.`;
    } else if (totalCount < 20) {
      message = `Great news! ${totalCount} qualified drivers match your needs.`;
    } else {
      message = `Excellent! ${totalCount}+ drivers are ready to connect with you.`;
    }

    return {
      success: true,
      preview: {
        count: totalCount,
        breakdown,
        message,
        hasMatches: totalCount > 0,
        exceedsNeed: criteria.driversNeeded
          ? totalCount >= parseInt(criteria.driversNeeded)
          : null
      }
    };

  } catch (error) {
    console.error('[carrierLeadsService] getMatchPreview error:', error);
    return {
      success: false,
      error: 'Unable to generate preview at this time.',
      preview: {
        count: null,
        message: 'Submit your request and we\'ll match you with qualified drivers.',
        hasMatches: null
      }
    };
  }
}
```

### 4.4 UI Mockup (ASCII)

#### Lead Form with Preview (Before Filling)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  FIND YOUR NEXT DRIVERS                                                     │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Company Name *                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  DOT Number                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  How many drivers do you need? *                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Select...                                                         [v] │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  What type of drivers? *                                                    │
│  [ ] CDL-A    [ ] CDL-B    [ ] Hazmat    [ ] Tanker    [ ] Doubles         │
│                                                                             │
│  [Submit Request]                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Lead Form with Preview (After Criteria Entered)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  FIND YOUR NEXT DRIVERS                                                     │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Company Name *                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ ABC Trucking LLC                                                      │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  DOT Number                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 1234567                                                               │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  How many drivers do you need? *                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 5-10 drivers                                                      [v] │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  What type of drivers? *                                                    │
│  [x] CDL-A    [ ] CDL-B    [x] Hazmat    [ ] Tanker    [ ] Doubles         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  [✓]  MATCH PREVIEW                                                 │   │
│  │                                                                     │   │
│  │  Based on your criteria, we have:                                   │   │
│  │                                                                     │   │
│  │         23                                                          │   │
│  │    ───────────                                                      │   │
│  │    MATCHING DRIVERS                                                 │   │
│  │                                                                     │   │
│  │  • 23 CDL-A drivers in our network                                  │   │
│  │  • 8 with Hazmat endorsement                                        │   │
│  │  • Average 4.2 years experience                                     │   │
│  │                                                                     │   │
│  │  [✓] Exceeds your need of 5-10 drivers                              │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [Submit Request - Connect with 23 Drivers]                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Model Changes

### 5.1 CarrierHiringPreferences (Extended)

| Field | Type | New? | Description |
|-------|------|------|-------------|
| `preset_id` | String | Yes | ID of applied preset (null if custom) |
| `preset_applied_at` | DateTime | Yes | When preset was applied |
| `is_customized` | Boolean | Yes | True if user modified after preset |

### 5.2 New Collection: CarrierOnboardingStatus

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `carrier_dot` | String | Carrier DOT number |
| `current_stage` | Number | Stage 1-5 |
| `stage_name` | String | 'received', 'processing', 'enriching', 'live', 'matching' |
| `enrichment_status` | String | 'pending', 'in_progress', 'completed', 'failed' |
| `enrichment_progress` | Number | 0-100 percentage |
| `match_count_cache` | Number | Cached driver match count |
| `match_count_updated` | DateTime | When match count was last calculated |
| `_createdDate` | DateTime | Record created |
| `_updatedDate` | DateTime | Last updated |

---

## 6. Security Considerations

### 6.1 Match Preview Rate Limiting

The `getMatchPreview` function is public (no auth required) to allow form preview. Implement rate limiting:

```javascript
// Rate limit: 5 requests per minute per unique client
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 5;

// Use Wix's built-in rate limiting or implement with collection
async function checkRateLimit(clientId) {
  // Implementation using CarrierPreviewRequests collection
}
```

### 6.2 Data Exposure

- Match preview only returns aggregate counts, never individual driver data
- No PII exposed in preview response
- Full driver profiles require authentication + subscription

---

## 7. Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Preference completion rate | 40% | 75% | Carriers with saved preferences / Total onboarded |
| Time to first preference save | N/A | <60 sec | From page load to first save |
| Welcome page engagement | 1.2 min | 5+ min | Average time on page |
| Form submission rate | 60% | 80% | Forms submitted / Forms started |
| Preview interaction rate | N/A | 70% | Forms with preview shown |

---

## 8. Integration Points

### 8.1 Existing Services

| Service | Integration |
|---------|-------------|
| `carrierPreferences.jsw` | Add preset methods, extend with preset fields |
| `carrierLeadsService.jsw` | Add `getMatchPreview` function |
| `aiEnrichment.jsw` | Status tracker reads enrichment progress |
| `driverMatching.jsw` | Status tracker uses match count logic |

### 8.2 Existing UI

| Component | Integration |
|-----------|-------------|
| `CARRIER_WEIGHT_PREFERENCES.html` | Add preset selector section |
| `Carrier_Welcome.html` | Embed status tracker component |
| Landing page forms | Add match preview section |

---

## 9. Open Questions

1. **Preset Updates**: Should presets be versioned? What happens to carriers using old presets?
2. **Match Count Caching**: How often should match counts be recalculated? Real-time vs cached?
3. **Preview Accuracy**: Should preview count be exact or show ranges ("20+ drivers")?
4. **Multi-language**: Will presets need localization for preset names/descriptions?
