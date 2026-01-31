# Track Plan: Driver Utility Expansion

## Phase 1: Profile Strength Meter
- [x] Task: Create `profileStrengthService.jsw` to calculate score (0-100) based on fields & documents
- [x] Task: Update `DriverProfiles` collection with `profile_strength_score` field
- [x] Task: Create UI component for "Profile Strength" (circular progress or bar) in `DRIVER_DASHBOARD.html`
- [x] Task: Implement "Improve Your Score" suggestions list (e.g., "Add CDL Photo +20pts")
- [x] Task: Add backend trigger to recalculate score on profile update
- [x] Task: Gamification Integration - Award XP for reaching strength milestones (80%, 100%)

## Phase 2: Quick Response Templates
- [x] Task: Implement click handler to populate message box or auto-send
- [x] Task: Add "interested" / "not interested" distinct actions that update application status if applicable
- [x] Task: Mobile optimization for touch targets on templates

## Phase 3: Reverse Alerts (Carrier Views)
- [x] Task: Update `driverMatching.jsw` to trigger `notifyDriverProfileViewed` on profile view
- [x] Task: Create `driverInsightsService.jsw` for fetching view logs
- [x] Task: Implement `getWhoViewedMe` in backend to aggregate `CarrierDriverViews`
- [x] Task: UI - Implement "Who's Viewed You" list in `DRIVER_DASHBOARD.html`
- [x] Task: UI - Wire up Privacy Toggle to `setDiscoverability`
- [ ] Task: Create email template `carrier_viewed_profile.html` (optional, start with in-app)

## Phase 4: Driver Insights Panel
- [x] Task: Update `driverInsightsService.jsw` with `getDriverStats` logic
- [x] Task: Calculate stats: Profile Views (30d), Application Status breakdown
- [x] Task: UI - Add "Insights" section to `DRIVER_DASHBOARD.html`
- [x] Task: UI - Implement visual stats cards (Views, Active Apps, Hired Rate)


## Phase 5: Mobile Optimization & Verification
- [ ] Task: Ensure all new components (Views List, Insights) are mobile-responsive (iPhone 12/13)
- [ ] Task: Verify touch interactions for Privacy Toggle
- [ ] Task: QA notification flow (Recruiter view -> Driver alert)
