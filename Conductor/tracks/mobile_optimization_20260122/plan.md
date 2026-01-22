# Track Plan: Systematic HTML Mobile Optimization

**Objective:** Ensure all 56+ HTML files in `src/public/` are fully responsive and optimized for the iPhone 12/13 viewport (390px x 844px), strictly adhering to `docs/MOBILE_OPTIMIZATION_GUIDE.md`.

## Methodology
This track follows a **Category-Based Rollout** to minimize disruption and prioritize high-traffic pages.

### Standards
- **Viewport:** iPhone 12/13 (390px)
- **Touch Targets:** Min 44px
- **Safe Areas:** Respect notch and home indicator
- **Testing:** Visual verification via code review against constraints

## Phases

### Phase 1: Pilot (High Impact Landing Pages)
*Focus: Public-facing conversion pages.*
- [ ] `src/public/landing/Homepage.HTML`
- [ ] `src/public/landing/lmdr-cdl-driver-landing-iframe-optimized.html`
- [ ] `src/public/landing/Quick Apply - Upload Your CDL & Resume.html`

### Phase 2: Driver Portal
*Focus: User experience for logged-in drivers.*
- [ ] `src/public/driver/AI_MATCHING.html`
- [ ] `src/public/driver/DRIVER_DASHBOARD.html`
- [ ] `src/public/driver/Driver Jobs.html`

### Phase 3: Recruiter Portal
*Focus: Complex dashboards on small screens.*
- [ ] `src/public/recruiter/RecruiterDashboard.html`
- [ ] `src/public/recruiter/RECRUITER_DRIVER_SEARCH.html`
- [ ] `src/public/recruiter/Recruiter_Pipeline_Page.html`

### Phase 4: Carrier & Admin
*Focus: Utility and management.*
- [ ] `src/public/carrier/*.html`
- [ ] `src/public/admin/*.html` (Prioritize read-only views for mobile)

### Phase 5: Verification & Maintenance
- [ ] Run final audit on all modified files.
- [ ] Establish "New Page Protocol": Any new HTML file must be checked against `docs/MOBILE_OPTIMIZATION_GUIDE.md` before commit.

## Execution Log

| Date | File | Status | Notes |
|------|------|--------|-------|
| 2026-01-22 | Track Setup | Init | Created track and guide. |
