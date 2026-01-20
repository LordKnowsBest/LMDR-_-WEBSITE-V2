# Track Plan: Driver Utility Expansion

## Overview

This plan implements four features to maximize the utility of existing driver features and increase platform engagement. Each phase builds on existing infrastructure with minimal net-new development.

---

## Phase 1: Profile Strength Meter

**Goal:** Show drivers exactly how to improve their profile for more carrier matches by inverting the matching algorithm weights.

**Dependencies:** `scoring.js`, `driverProfiles.jsw`, `DRIVER_DASHBOARD.html`

### Backend Tasks

- [ ] Task: Create `profileStrengthService.jsw` with core calculation logic
- [ ] Task: Implement `calculateProfileStrength(driverId)` function that reads driver profile and identifies missing high-impact fields
- [ ] Task: Create `IMPROVEMENT_MAPPING` constant mapping profile fields to scoring weights (location: 25, pay: 20, operationType: 15, etc.)
- [ ] Task: Implement `simulateProfileImprovement(driverId, field)` to show potential match delta when adding specific field
- [ ] Task: Add `profile_strength_score` and `missing_high_impact` fields to DriverProfiles collection
- [ ] Task: Create `getProfileImprovementSuggestions(driverId)` returning ranked list of improvements with impact percentages
- [ ] Task: Add cache layer to avoid recalculating on every page load (recalc on profile update)
- [ ] Task: Write unit tests for profile strength calculation logic

### Frontend Tasks

- [ ] Task: Create Profile Strength Meter widget component in DRIVER_DASHBOARD.html
- [ ] Task: Implement progress bar showing current profile strength percentage
- [ ] Task: Build improvement suggestion cards with impact percentages and CTAs
- [ ] Task: Add "Add Now" buttons that navigate to relevant profile sections
- [ ] Task: Implement loading state and error handling for strength calculation
- [ ] Task: Add celebration animation when profile reaches 100%
- [ ] Task: Create postMessage bridge between HTML component and Velo page code

### Integration Tasks

- [ ] Task: Update `DRIVER_DASHBOARD.xxxxx.js` page code to load profile strength on page load
- [ ] Task: Add `getProfileStrength` message handler in page code
- [ ] Task: Connect CTA buttons to profile edit modals/sections
- [ ] Task: Track CTA clicks in analytics (MemberActivity collection)

### Testing & Validation

- [ ] Task: Test profile strength calculation with various profile states (empty, partial, complete)
- [ ] Task: Verify improvement suggestions change when profile is updated
- [ ] Task: Test edge cases: new user, fully complete profile, missing CDL
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Profile Strength Meter'

---

## Phase 2: Quick Response Templates

**Goal:** Reduce messaging friction by providing one-click response templates for common driver scenarios.

**Dependencies:** `messaging.jsw`, `DRIVER_DASHBOARD.html`, `Messages` collection

### Backend Tasks

- [ ] Task: Create `messageTemplateService.jsw` for template management
- [ ] Task: Create `MessageTemplates` collection with schema (category, name, template_text, placeholders, sort_order)
- [ ] Task: Implement `getTemplatesForDriver(driverId)` returning categorized templates sorted by usage
- [ ] Task: Implement `processTemplate(templateId, values)` for placeholder substitution
- [ ] Task: Create `DriverTemplatePreferences` collection for tracking favorite/custom templates
- [ ] Task: Implement `createCustomTemplate(driverId, template)` for user-created templates
- [ ] Task: Implement `recordTemplateUsage(driverId, templateId)` for usage analytics
- [ ] Task: Seed database with system templates (8 default templates across 4 categories)
- [ ] Task: Add validation for template text (length limits, no HTML injection)

### Frontend Tasks

- [ ] Task: Add "Quick Reply" dropdown button to messaging panel in DRIVER_DASHBOARD.html
- [ ] Task: Create template selection overlay with categorized template list
- [ ] Task: Implement placeholder input modal (date picker, text fields) for templates with variables
- [ ] Task: Add template preview before sending
- [ ] Task: Implement "Edit before sending" option
- [ ] Task: Add "Create custom template" modal
- [ ] Task: Show template usage count/favorites indicator
- [ ] Task: Ensure templates work in both mobile and desktop views

### Integration Tasks

- [ ] Task: Extend existing messaging postMessage handlers to support template selection
- [ ] Task: Add `getTemplates`, `processTemplate`, `sendTemplatedMessage` handlers to page code
- [ ] Task: Update `sendMessage` in messaging.jsw to accept `templateId` for analytics tracking
- [ ] Task: Log template usage to MemberActivity collection

### Testing & Validation

- [ ] Task: Test all 8 system templates send correctly
- [ ] Task: Test placeholder substitution (dates, timeframes)
- [ ] Task: Test custom template creation and usage
- [ ] Task: Verify template usage is tracked correctly
- [ ] Task: Test on mobile device for responsive behavior
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Quick Response Templates'

---

## Phase 3: Reverse Alerts

**Goal:** Notify drivers when carriers they matched with have improved (safety, pay, equipment).

**Dependencies:** `aiEnrichment.jsw`, `CarrierEnrichments`, `DriverCarrierInterests`, `MemberNotifications`

### Backend Tasks

- [ ] Task: Create `carrierAlertService.jsw` for improvement detection and alert generation
- [ ] Task: Create `CarrierImprovementHistory` collection to track carrier changes over time
- [ ] Task: Implement `detectImprovements(carrierDot, newEnrichment, oldEnrichment)` comparing enrichment snapshots
- [ ] Task: Define `IMPROVEMENT_THRESHOLDS` constant (safety: 5pts, pay: $0.03, truck_age: -1yr, etc.)
- [ ] Task: Implement `generateDriverAlerts(carrierDot, improvements)` to create notifications for affected drivers
- [ ] Task: Add `carrier_improvement` notification type to MemberNotifications schema
- [ ] Task: Implement `getDriverAlerts(driverId)` for fetching improvement alerts
- [ ] Task: Create hook in `aiEnrichment.jsw` to call `detectImprovements` after enrichment update
- [ ] Task: Implement batch alert generation for scheduled enrichment jobs

### Frontend Tasks

- [ ] Task: Create Reverse Alert notification card component in DRIVER_DASHBOARD.html
- [ ] Task: Design alert card showing carrier name, changes, and before/after values
- [ ] Task: Add "View Carrier" and "Re-Apply Now" CTA buttons
- [ ] Task: Implement dismiss/hide functionality for alerts
- [ ] Task: Add alert badge indicator to dashboard navigation
- [ ] Task: Create alerts section/tab in dashboard for viewing all alerts
- [ ] Task: Implement alert animation for new alerts

### Integration Tasks

- [ ] Task: Update dashboard page code to load carrier alerts on page load
- [ ] Task: Add `getCarrierAlerts`, `dismissAlert`, `viewCarrierFromAlert` handlers
- [ ] Task: Connect "View Carrier" to carrier detail page with improvement highlights
- [ ] Task: Connect "Re-Apply" to application flow (pre-fill with existing data)
- [ ] Task: Add email notification option for high-significance improvements

### Scheduled Job Tasks

- [ ] Task: Add improvement detection to `runEnrichmentBatch` in scheduler.jsw
- [ ] Task: Store previous enrichment snapshot before update for comparison
- [ ] Task: Batch alert generation to avoid hammering database
- [ ] Task: Add rate limiting (max 3 alerts per driver per day)

### Testing & Validation

- [ ] Task: Test improvement detection with mock enrichment data
- [ ] Task: Verify alerts only generate for improvements above thresholds
- [ ] Task: Test alert display for drivers with 0, 1, and multiple alerts
- [ ] Task: Test dismiss functionality persists
- [ ] Task: Verify alerts link to correct carrier and application flow
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Reverse Alerts'

---

## Phase 4: Insights Panel

**Goal:** Provide personalized recommendations based on platform-wide success patterns.

**Dependencies:** `DriverCarrierInterests`, `MatchEvents`, `DriverProfiles`, `scheduler.jsw`

### Backend Tasks

- [ ] Task: Create `driverInsightsService.jsw` for insight generation
- [ ] Task: Create `InsightAggregates` collection for storing platform-wide patterns
- [ ] Task: Create `DriverInsights` collection for storing personalized insights
- [ ] Task: Implement `analyzeEndorsementImpact()` calculating match rate by endorsement
- [ ] Task: Implement `analyzeTimingPatterns()` calculating optimal application volume
- [ ] Task: Implement `analyzeSalaryBenchmarks()` calculating regional pay averages
- [ ] Task: Implement `analyzePatterns()` orchestrator function for scheduled job
- [ ] Task: Define `INSIGHT_RULES` for generating personalized insights
- [ ] Task: Implement `generateInsightsForDriver(driverId)` comparing driver to success patterns
- [ ] Task: Implement `getDriverInsights(driverId, limit)` for fetching active insights
- [ ] Task: Implement `dismissInsight(driverId, insightId)` for hiding insights

### Scheduled Job Tasks

- [ ] Task: Add `runInsightAggregation` job to jobs.config (daily at 2am)
- [ ] Task: Implement aggregate calculation with sample size and confidence tracking
- [ ] Task: Add insight expiration logic (insights older than 30 days marked stale)
- [ ] Task: Implement insight refresh on driver profile update

### Frontend Tasks

- [ ] Task: Create Insights Panel widget component in DRIVER_DASHBOARD.html
- [ ] Task: Design insight cards with icon, message, and CTA button
- [ ] Task: Implement insight types: endorsement, salary, application volume, carrier preference
- [ ] Task: Add "Dismiss" option for each insight
- [ ] Task: Add "Don't show this type" option
- [ ] Task: Create empty state for drivers with no applicable insights
- [ ] Task: Implement insight refresh on profile changes

### Integration Tasks

- [ ] Task: Update dashboard page code to load insights on page load
- [ ] Task: Add `getInsights`, `dismissInsight`, `actionInsight` handlers
- [ ] Task: Connect insight CTAs to relevant profile sections or carrier search
- [ ] Task: Track insight engagement in MemberActivity collection
- [ ] Task: Add insight summary to memberService.jsw dashboard response

### Analytics & Iteration

- [ ] Task: Track insight display rate (impressions)
- [ ] Task: Track insight action rate (CTA clicks)
- [ ] Task: Track insight dismiss rate
- [ ] Task: Create admin report showing insight effectiveness

### Testing & Validation

- [ ] Task: Test aggregate calculation with sample data
- [ ] Task: Test insight generation for various driver profiles
- [ ] Task: Verify dismissed insights don't reappear
- [ ] Task: Test insight refresh when profile is updated
- [ ] Task: Verify insights display correctly with 0, 1, and 5 insights
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Insights Panel'

---

## Phase Checkpoints

| Phase | Checkpoint | Validation Criteria |
|-------|------------|---------------------|
| 1 | Profile Strength | Meter displays, suggestions accurate, CTAs work |
| 2 | Quick Templates | Templates send correctly, placeholders work, usage tracked |
| 3 | Reverse Alerts | Alerts generate on carrier improvement, dismiss works |
| 4 | Insights Panel | Insights personalized, CTAs lead to correct actions |

---

## Rollout Plan

### Phase 1 Rollout (Profile Strength Meter)
- Deploy to 10% of drivers (beta)
- Monitor profile completion rate changes
- Gather feedback on suggestion accuracy
- Full rollout after 1 week of stable metrics

### Phase 2 Rollout (Quick Response Templates)
- Deploy system templates to all drivers
- Enable custom templates for Pro users initially
- Monitor message response rates
- Open custom templates to all after 2 weeks

### Phase 3 Rollout (Reverse Alerts)
- Deploy for drivers with 3+ carrier interests only
- Start with high-significance improvements only
- Monitor alert engagement and dismiss rates
- Lower thresholds based on engagement data

### Phase 4 Rollout (Insights Panel)
- Requires 30 days of aggregate data before launch
- Deploy to drivers with <50% profile completion first
- Monitor insight action rates
- A/B test insight phrasing for optimization

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Alert fatigue | Drivers ignore notifications | Rate limit to 3/day, prioritize high-significance |
| Wrong insights | Drivers lose trust | Require minimum sample size (100+), show confidence |
| Template misuse | Spam or inappropriate messages | Validate template content, limit custom templates |
| Performance impact | Slow dashboard load | Cache calculations, lazy load non-critical widgets |

---

## Success Criteria

Phase is complete when:
1. All tasks checked off
2. Manual verification passed
3. Metrics show positive movement (or neutral with qualitative feedback)
4. No critical bugs in production for 48 hours
