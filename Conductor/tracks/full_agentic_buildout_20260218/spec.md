# Full Agentic Buildout — Unified Specification

**Track:** `full_agentic_buildout_20260218`
**Created:** 2026-02-18
**Vision:** Transform LMDR/VelocityMatch from 36 agent tools → ~388 tools across all 4 roles, achieving 100% agentic CDL driver recruitment

---

## Specification Index

This spec is split into 4 role-based files for manageability. Each file contains complete tool definitions with parameters, risk levels, backend services, Airtable collections, and approval requirements.

### Tool Specifications

| File | Role(s) | Tools | Lines |
|------|---------|-------|-------|
| [spec-driver.md](./spec-driver.md) | Driver | 83 | 1,572 |
| [spec-recruiter.md](./spec-recruiter.md) | Recruiter | 65 | 1,439 |
| [spec-carrier-b2b.md](./spec-carrier-b2b.md) | Carrier + B2B | 93 | 2,672 |
| [spec-admin-platform.md](./spec-admin-platform.md) | Admin + Platform | 147 | 2,802 |
| **Total** | **All 4 roles** | **388** | **8,485** |

### Schema Specifications

| File | Phases | Collections | Lines |
|------|--------|-------------|-------|
| [schemas-phase1-2.md](./schemas-phase1-2.md) | 1 (Driver) + 2 (Recruiter) | 64 | 1,093 |
| [schemas-phase3-4.md](./schemas-phase3-4.md) | 3 (Carrier/B2B) + 4 (Admin) | 68 | 1,449 |
| [schemas-phase5.md](./schemas-phase5.md) | 5 (Cross-Role/External) | 32 | 807 |
| **Total** | **All 5 phases** | **164** | **3,349** |

---

## Tool Format (All Spec Files)

Every tool follows this schema:

```markdown
### tool_name
- **Role:** driver|recruiter|carrier|admin
- **Risk Level:** read|suggest|execute_low|execute_high
- **Description:** What the tool does
- **Parameters:** { param: type — description }
- **Backend Service:** serviceName.jsw → methodName()
- **Airtable Collection(s):** collectionKey → v2_Table Name
- **Approval Required:** Yes/No
- **Dependencies:** Other tools or services needed
```

### Risk Level Classification

| Level | Meaning | Approval Gate | Examples |
|-------|---------|--------------|---------|
| `read` | Query/fetch only, no side effects | No | get_matches, search_jobs, get_dashboard |
| `suggest` | AI generates recommendation, no write | No | get_profile_suggestions, get_risk_factors |
| `execute_low` | Write with limited blast radius | No | update_profile, log_expense, save_job |
| `execute_high` | Irreversible or high-impact write | **Yes** | quick_apply, process_payment, suspend_user |

---

## Tool Distribution by Role

### Driver (83 tools)
| Group | Count | Phase |
|-------|-------|-------|
| Cockpit (jobs, messaging, profile, matches) | 23 | 1 |
| Road Utilities (parking, fuel, weather, hazards) | 15 | 1 |
| Community (forums, mentorship, pet-friendly, health) | 14 | 1 |
| Compliance (docs, HOS, ELD, training) | 12 | 1 |
| Financial (expenses, settlements, tax) | 10 | 1 |
| Lifecycle (timeline, disposition, surveys) | 5 | 5 |
| Utility Expansion (profile strength, alerts, insights) | 4 | 1 |

### Recruiter (65 tools)
| Group | Count | Phase |
|-------|-------|-------|
| Outreach (campaigns, job boards, social) | 14 | 2 |
| Analytics (attribution, CPH, funnels, forecasts) | 13 | 2 |
| Onboarding Automation (workflows, BGC, e-sign) | 12 | 2 |
| Pipeline (saved searches, automation, interventions) | 10 | 2 |
| Retention (risk scoring, watchlist, interventions) | 8 | 2 |
| Reverse Matching (search, scoring, subscriptions) | 8 | 2 |

### Carrier + B2B (93 tools)
| Group | Count | Phase |
|-------|-------|-------|
| Fleet Dashboard (roster, equipment, scorecards) | 15 | 3 |
| Compliance (calendar, DQ, CSA, incidents) | 13 | 3 |
| Communication (announcements, policies, recognition) | 10 | 3 |
| Journey Activation (onboarding, branding, config) | 8 | 3 |
| Conversion (Stripe, deposits, pricing) | 7 | 3 |
| Utility Expansion (presets, status, match preview) | 7 | 3 |
| B2B Suite (intelligence, pipeline, outreach, events) | 33 | 3 |

### Admin + Platform (147 tools)
| Group | Count | Phase |
|-------|-------|-------|
| Business Ops (revenue, billing, commissions) | 15 | 4 |
| Platform Config (flags, A/B tests, templates, rules) | 20 | 4 |
| Portal (dashboard, users, moderation, AI, compliance) | 20 | 4 |
| Support Ops (tickets, KB, chat, NPS) | 22 | 4 |
| Gamification (XP, streaks, achievements, challenges) | 20 | 4 |
| Feature Adoption (logging, funnels, health scores) | 8 | 4 |
| Cross-Role Utility (mutual interest, match explain) | 12 | 5 |
| Observability (tracing, metrics, error tracking) | 12 | 5 |
| External API Platform (gateway, safety, intel, ops) | 18 | 5 |

---

## New Backend Services Required

| Phase | New Services | Key Examples |
|-------|-------------|-------------|
| 1 | ~21 | driverJobService, parkingService, fuelPriceService, forumService, hosService |
| 2 | ~15 | jobBoardService, socialPostingService, pipelineAutomationService, bgcService |
| 3 | ~14 | fleetRosterService, csaMonitorService, incidentService, carrierBrandingService |
| 4 | ~12 | revenueService, featureFlagService, moderationService, chatService |
| 5 | ~10 | apiGatewayService, apiKeyService, careerPathService, fuelCardService |
| **Total** | **~72** | Plus ~27 existing services to enhance |

---

## New Airtable Collections Required

> **Note:** The codebase already has **210 Airtable collections** in `configData.js`.
> Of the 164 collections specced below, **25 already exist** (annotated with ⚠️ in schema files).
> **Net-new collections to create: 139.**

| Phase | Total Specced | Already Exist | Net-New | Schemas File |
|-------|--------------|---------------|---------|-------------|
| 1 (Driver) | 39 | 9 | 30 | schemas-phase1-2.md |
| 2 (Recruiter) | 25 | 5 | 20 | schemas-phase1-2.md |
| 3 (Carrier/B2B) | 45 | 9 | 36 | schemas-phase3-4.md |
| 4 (Admin) | 23 | 2 | 21 | schemas-phase3-4.md |
| 5 (Cross-Role) | 32 | 0 | 32 | schemas-phase5.md |
| **Total** | **164** | **25** | **139** | All in `app9N1YCJ3gdhExA0` base |

---

## Implementation Sequence

See [plan.md](./plan.md) for full phase-by-phase implementation plan with:
- Phase 0: Foundation bug fixes (7 known bugs)
- Phases 1-4: Surface expansion (parallelizable after Phase 0)
- Phase 5: Cross-role intelligence (depends on Phases 1-4)

See [progress.md](./progress.md) for real-time tracking of:
- Tool registration status per track
- Backend service creation checklist
- Airtable collection creation checklist
- Global metrics (tools, services, collections, tests)
