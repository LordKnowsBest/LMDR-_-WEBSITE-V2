# Jules Task: QA Convergence Follow-Up — UI Implementation & Integration Testing

## Context

Read the report at `Conductor/tracks/qa_convergence_20260102/report.md`. This QA Convergence Report confirms that **all backend services are verified and stable** across three phases:

1. **Driver Cockpit** — Application tracking, status sync, data integrity (all passing).
2. **Reverse Matching** — Scoring, matching, subscriptions, outreach (302 tests passing).
3. **Admin Portal** — Security, management, auditing (all passing).

The report concludes: *"The backend infrastructure is stable and verified. The system is ready for the next phase of UI implementation and integration testing."*

Your job is to execute that next phase.

---

## Your Objective

For each of the three verified backend systems, implement the UI layer and write integration tests that exercise the full stack (HTML component -> page code -> backend service -> data layer).

---

## Phase 1: Driver Cockpit UI Integration

The backend services are verified: `applicationService.jsw`, `recruiter_service.jsw`.

### Tasks:

1. **Read the existing UI files:**
   - `src/public/driver/DRIVER_DASHBOARD.html` — Main driver dashboard.
   - `src/pages/Driver Dashboard.ctupv.js` — Page code.
   - Review the `postMessage` bridge to understand what actions are already wired.

2. **Implement Application Tracking UI:**
   - In the driver dashboard HTML (or a dedicated panel), add an "My Applications" section that displays:
     - List of applications with carrier name, position, date applied, and current status.
     - Status badges with color coding (applied, interviewing, offered, hired, rejected).
     - Click-to-expand showing `status_history` timeline with timestamps and actors.
   - Wire the UI to send `getDriverApplications` messages through the postMessage bridge.
   - Wire status change notifications (if the driver needs to accept/decline an offer).

3. **Write integration tests:**
   - Test that the page code correctly fetches applications via `applicationService.getDriverApplications()`.
   - Test that status history renders in chronological order.
   - Test that multi-carrier access isolation is enforced (driver only sees their own applications).

### Key files:
- `src/backend/applicationService.jsw` — Backend (verified, do not modify).
- `src/backend/recruiter_service.jsw` — Backend (verified, do not modify).
- `src/public/driver/DRIVER_DASHBOARD.html` — UI to extend.
- `src/pages/Driver Dashboard.ctupv.js` — Page code to extend.

---

## Phase 2: Reverse Matching UI Integration

The backend services are verified: `driverScoring.js`, `driverMatching.jsw`, `subscriptionService.jsw`, `driverOutreach.jsw`.

### Tasks:

1. **Read the existing UI files:**
   - `src/public/driver/AI_MATCHING.html` — Driver-side matching view.
   - `src/pages/AI - Matching.rof4w.js` — Page code.
   - `src/public/recruiter/RECRUITER_DRIVER_SEARCH.html` — Recruiter search view.
   - `src/pages/RECRUITER DRIVER SEARCH.qtecw.js` — Page code.

2. **Implement Match Results UI (Driver Side):**
   - Display matched carriers with match score, breakdown (CDL, Experience, Location, Availability), and carrier details.
   - Show subscription tier limits: Free tier shows limited results with an upgrade CTA; Pro tier shows full results.
   - Add "Express Interest" button that triggers outreach pipeline save.
   - Show mutual match indicators (boost badge) when both parties have expressed interest.

3. **Implement Search Results UI (Recruiter Side):**
   - Display scored driver candidates with match percentage and score breakdown.
   - Show subscription-gated view counts (decrement on view, show remaining quota).
   - Add "Save to Pipeline" and "Send Outreach" action buttons.
   - Show tier-appropriate limits and upgrade prompts.

4. **Write integration tests:**
   - Test match scoring display matches backend calculation.
   - Test Free vs Pro tier display differences.
   - Test subscription view quota decrement on driver profile view.
   - Test outreach pipeline save and messaging respect tier limits.
   - Test mutual match boost indicator appears correctly.

### Key files:
- `src/backend/driverScoring.js` — Scoring engine (verified, do not modify).
- `src/backend/driverMatching.jsw` — Matching service (verified, do not modify).
- `src/backend/subscriptionService.jsw` — Tier enforcement (verified, do not modify).
- `src/backend/driverOutreach.jsw` — Outreach pipeline (verified, do not modify).
- `src/public/driver/AI_MATCHING.html` — Driver UI to extend.
- `src/public/recruiter/RECRUITER_DRIVER_SEARCH.html` — Recruiter UI to extend.

---

## Phase 3: Admin Portal UI Integration

The backend services are verified: `admin_service.jsw`, `admin_audit_service.jsw`, `admin_dashboard_service.jsw`.

### Tasks:

1. **Read the existing UI files:**
   - `src/public/admin/ADMIN_DASHBOARD.html`
   - `src/public/admin/ADMIN_DRIVERS.html`
   - `src/public/admin/ADMIN_CARRIERS.html`
   - `src/public/admin/ADMIN_AUDIT_LOG.html`
   - Check which page code files exist (per the Parity Report, many admin HTML files lack page code).

2. **Implement Admin Dashboard Analytics:**
   - Wire the dashboard HTML to call `admin_dashboard_service` aggregation functions.
   - Display key metrics: total drivers, active carriers, pending applications, match rate, revenue metrics.
   - Add date range selector for analytics filtering.
   - Show trend indicators (up/down arrows with percentage change).

3. **Implement Driver/Carrier Management UI:**
   - Wire ADMIN_DRIVERS.html to `admin_service` for driver management.
   - Display driver list with status, last activity, compliance status.
   - Add status update actions (activate, suspend, flag for review) with confirmation modals.
   - Wire ADMIN_CARRIERS.html similarly for carrier management.

4. **Implement Audit Log UI:**
   - Wire ADMIN_AUDIT_LOG.html to `admin_audit_service`.
   - Display audit trail: timestamp, actor, action, target entity, details.
   - Add filtering by date range, actor, and action type.
   - Add search functionality.

5. **Write integration tests:**
   - Test admin authorization gates block non-admin users.
   - Test dashboard analytics aggregate correctly from backend.
   - Test driver status update flows end-to-end (UI action -> backend -> data layer -> UI refresh).
   - Test audit log entries are created for sensitive actions.
   - Test audit log filtering and search work correctly.

### Key files:
- `src/backend/admin_service.jsw` — Admin management (verified, do not modify).
- `src/backend/admin_audit_service.jsw` — Audit logging (verified, do not modify).
- `src/backend/admin_dashboard_service.jsw` — Analytics (verified, do not modify).
- `src/public/admin/ADMIN_DASHBOARD.html` — Dashboard UI.
- `src/public/admin/ADMIN_DRIVERS.html` — Driver management UI.
- `src/public/admin/ADMIN_CARRIERS.html` — Carrier management UI.
- `src/public/admin/ADMIN_AUDIT_LOG.html` — Audit log UI.

---

## Important Constraints

- **Do NOT modify verified backend services.** The QA report confirms they are stable. Only extend the UI layer and page code.
- **Follow the project's design system:** Tailwind with Slate/Blue/Amber palette, Inter font. See existing HTML files for reference.
- **Follow the postMessage bridge pattern:** All data flows through `$w('#htmlComponent').postMessage()` and `window.addEventListener('message', ...)`. Do not use direct backend imports in HTML files.
- **Respect Airtable routing:** All data access goes through `dataAccess.jsw`. Collections use `v2_` prefix for Airtable-routed collections.

## Workflow

Follow the project's TDD workflow from `Conductor/workflow.md`:
1. For each phase, write integration tests first (Red phase).
2. Implement UI and page code to pass tests (Green phase).
3. Refactor for clarity and responsive design.
4. Commit with format: `feat(<scope>): <description>`.
5. Attach git notes summarizing changes per the workflow.

## Success Criteria

- Driver Cockpit: Application tracking UI displays real data from verified backend.
- Reverse Matching: Both driver and recruiter views show scored results with tier enforcement.
- Admin Portal: Dashboard, management, and audit UIs are wired to verified backends.
- All integration tests pass with >80% coverage on new code.
- All existing backend tests still pass (zero regressions).
- UI follows the project's Tailwind design system and is mobile-responsive.
