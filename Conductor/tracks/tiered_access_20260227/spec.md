# Tiered Access System - Specification

**Track ID:** tiered_access_20260227
**Created:** 2026-02-27
**Priority:** Deferred (implement after all pages are complete)
**Status:** Planning

---

## 1. Overview

### Problem

All recruiter/carrier pages are currently open during development. Once pages are stable and ready for production, we need a way to:

1. Gate pages to logged-in members only (Wix handles this natively via Page Permissions)
2. Show/hide features and enforce data limits based on a recruiter's subscription tier (Standard vs Enterprise)
3. Avoid maintaining duplicate pages — one page serves all tiers, with tier-aware rendering

### Solution

A single-value tier token flows from Wix Pricing Plans → `Members/PrivateMembersData` → page code init → postMessage bridge → CDN JS modules. Every module checks `ROS.config.tier` before rendering gated features.

```
Wix Pricing Plan subscription
         ↓
  Members/PrivateMembersData
  { plan: 'standard' | 'enterprise' }
         ↓
  Page code reads plan on $w.onReady
         ↓
  postMessage init payload includes tier
  { action: 'init', payload: { tier, ... } }
         ↓
  ros-bridge.js stores: ROS.config.tier
         ↓
  Any module: if (ROS.config.tier === 'enterprise') { ... }
```

### Why This Approach

- **No duplicate pages** — one RecruiterOS, one set of CDN modules, one bridge
- **Wix owns auth** — Page Permissions in Wix Editor gate the page to members only (zero code required)
- **Wix owns billing** — Wix Pricing Plans owns plan assignment, we just read the value
- **One config object owns what's in each tier** — changing tier boundaries = editing one JS constant
- **Zero code during development** — nothing changes until the final activation step

---

## 2. Architecture

### Tier Token Resolution

```
wix-pricing-plans (Wix managed)
  → assigns plan to member on checkout
    → stored in Members/PrivateMembersData
      → read by page code via wix-members-backend
        → passed in init postMessage as { tier: 'standard' | 'enterprise' | 'admin' }
          → ros-bridge.js: ROS.config.tier = payload.tier
            → all CDN modules check ROS.config.tier
```

### Tier Definitions (to be finalized at activation)

Defined as a single config constant in `ros-config.js`:

```javascript
const TIER_GATES = {
  // Feature flags — true = requires enterprise
  voiceCampaigns:     { minTier: 'enterprise' },
  bulkMessaging:      { minTier: 'enterprise' },
  b2bIntegration:     { minTier: 'enterprise' },
  advancedAnalytics:  { minTier: 'enterprise' },
  apiAccess:          { minTier: 'enterprise' },

  // Data limits by tier
  activeJobPosts:     { standard: 3,    enterprise: Infinity },
  savedSearches:      { standard: 5,    enterprise: Infinity },
  driverPipelineSize: { standard: 100,  enterprise: Infinity },
  voiceCallsPerMonth: { standard: 0,    enterprise: 500 },
  teamSeats:          { standard: 1,    enterprise: 10 }
};
```

### Rendering Pattern

```javascript
// In any CDN JS module:
function renderVoiceCampaignsTab() {
  if (!ROS.tier.can('voiceCampaigns')) {
    return renderUpgradePrompt('Voice Campaigns', 'enterprise');
  }
  // ... normal render
}

// ros-tier.js helper (new shared module):
ROS.tier = {
  can(feature) {
    const gate = TIER_GATES[feature];
    if (!gate) return true; // ungated feature
    return tierRank(ROS.config.tier) >= tierRank(gate.minTier);
  },
  limit(feature) {
    const gate = TIER_GATES[feature];
    if (!gate) return Infinity;
    return gate[ROS.config.tier] ?? gate.standard;
  }
};
```

---

## 3. Phase Specifications

### Phase 1: Wix Page Permissions (Auth Gate — No Code)

**Goal:** Lock all non-driver pages to logged-in members only.

**Steps:**
- Open Wix Editor for each recruiter/carrier/admin page
- Page Settings → Permissions → "Members only"
- Wix handles the redirect to login automatically

**Pages to gate:**
- Recruiter Console (`/recruiter-console`)
- Recruiter OS (`/recruiter-os`)
- Recruiter Onboarding Dashboard (`/recruiter-onboarding`)
- All carrier pages
- All admin pages

**Success Criteria:**
- Logged-out visitor hitting any gated page is redirected to Wix login
- Zero code changes required

---

### Phase 2: Wix Pricing Plans Setup

**Goal:** Define subscription plans in Wix and wire them to member data.

**Steps:**
- Create plans in Wix Dashboard → Pricing Plans:
  - `standard` — base recruiter plan
  - `enterprise` — full-featured plan
- Enable automatic plan assignment to member on checkout
- Verify that `Members/PrivateMembersData` receives plan field after test purchase

**Success Criteria:**
- Test subscription assigns correct plan value to member private data
- Plan value readable from `wix-members-backend` in page code

---

### Phase 3: Tier Token in Page Code Init

**Goal:** Read tier from member data and include it in every init postMessage.

**Changes to `Recruiter Console.zriuj.js` and `RECRUITER_ONBOARDING_DASHBOARD.gebww.js`:**

```javascript
import { currentMember } from 'wix-members-backend';

async function handleRecruiterOSReady(component) {
  const member = await currentMember.getMember();
  const tier = member?.profile?.customFields?.plan || 'standard';

  // Include tier in existing init payload
  safeSend(component, {
    action: 'init',
    payload: { ...existingPayload, tier }
  });
}
```

**Success Criteria:**
- `ROS.config.tier` is set correctly in the browser for Standard members
- `ROS.config.tier` is set correctly in the browser for Enterprise members
- Defaults to `'standard'` if plan field is absent (safe fallback)

---

### Phase 4: ros-tier.js Module + TIER_GATES Config

**Goal:** Create the shared tier-checking utility used by all ROS modules.

**New file:** `src/public/recruiter/os/js/ros-tier.js`

- Defines `TIER_GATES` constant (finalize feature list at this point)
- Exposes `ROS.tier.can(feature)` and `ROS.tier.limit(feature)` helpers
- Renders a reusable upgrade prompt card for locked features

**Updated:** `ros-config.js`
- Adds `tier: 'standard'` default to initial `ROS.config`

**Success Criteria:**
- `ROS.tier.can('voiceCampaigns')` returns `false` for standard, `true` for enterprise
- `ROS.tier.limit('activeJobPosts')` returns `3` for standard, `Infinity` for enterprise
- Upgrade prompt renders correctly with correct feature name and required tier

---

### Phase 5: Gate Features in CDN Modules

**Goal:** Apply tier gates to all gated features across RecruiterOS modules.

**Process:**
- Audit each ROS view module for enterprise-only features
- Wrap those render paths with `ROS.tier.can(...)` check
- Replace locked sections with upgrade prompt
- Apply data limits via `ROS.tier.limit(...)` in query/render functions

**Modules to audit:**
- `ros-view-matches.js` — pipeline size limit
- `ros-view-campaigns.js` — voice campaigns gate
- `ros-view-analytics.js` — advanced analytics gate
- `ros-settings.js` — team seats limit
- `ros-chat.js` — bulk messaging gate

**Success Criteria:**
- Standard user sees upgrade prompts for enterprise features
- Enterprise user sees all features, no upgrade prompts
- Data limits enforced at render time (not backend — backend is a future hardening step)

---

### Phase 6: Testing

**Feature Gate Tests:**

| Test | Standard Tier | Enterprise Tier |
|------|--------------|----------------|
| Voice Campaigns tab | Upgrade prompt | Full UI |
| Bulk Messaging button | Hidden/disabled | Visible |
| Analytics deep-dive | Upgrade prompt | Full UI |
| Active job posts limit | Capped at 3 | Unlimited |
| Pipeline size | Capped at 100 | Unlimited |
| Team seats | 1 seat shown | Up to 10 |

**Auth Gate Tests:**

| Test | Logged Out | Logged In |
|------|-----------|-----------|
| `/recruiter-console` | Wix login redirect | Page loads |
| `/recruiter-os` | Wix login redirect | Page loads |
| Direct URL to admin page | Wix login redirect | Page loads |

**Regression Tests:**
- All existing ROS views load without errors after ros-tier.js is added
- `ROS.config.tier` defaults to `'standard'` when plan field absent
- CDN cache purge required after ros-tier.js deploy

---

## 4. Key Design Decisions

### Wix Owns Auth, Not Code

Auth gating is 100% handled by Wix Page Permissions. No `wixUsers.currentUser.loggedIn` checks in page code — ever. This was already established as a project rule.

### Tier Defaults to Standard

If `Members/PrivateMembersData` has no plan field (e.g., legacy member, test account), the system defaults to `'standard'`. This is safe — it never accidentally grants enterprise access.

### Frontend Gating Only (Phase 1)

Initial implementation gates features in the CDN JS modules only (client-side). Backend enforcement (e.g., rejecting API calls over the job post limit) is a future hardening step after the UX is validated.

### One Config Object, One Place

`TIER_GATES` in `ros-tier.js` is the single source of truth for what's in each tier. Adjusting tier boundaries = editing one constant. No hunting across modules.

---

## 5. Dependencies

- All recruiter/carrier/admin pages must be complete before this track executes
- Wix Pricing Plans must be configured in Wix Dashboard (manual step)
- `ros-bridge.js` must be updated to store `tier` from init payload
- CDN cache purge required after each phase deploy

---

## 6. Open Questions

1. What is the exact field name/path in `Members/PrivateMembersData` where Wix Pricing Plans writes the plan? (Verify during Phase 2)
2. Are there any features that Standard gets but Carriers don't? (i.e., do we need a third tier?)
3. Should the upgrade prompt link to the Wix Pricing Plans checkout page, or a marketing landing page?
