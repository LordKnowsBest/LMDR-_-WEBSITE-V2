# Track: Carrier Utility Expansion

## Objective

Expand the utility of existing carrier features to improve onboarding completion rates and engagement by adding preference presets, status tracking, and instant match previews.

## User Flow Summary

1. **New Carrier** lands on welcome page, sees their onboarding progress and match preview
2. **Setting Preferences**: Carrier selects a preset template (OTR Heavy Haul, Regional, etc.) with one click, then optionally customizes
3. **Lead Form**: Before submitting, carrier sees "Based on your needs, we have X matching drivers" - creates urgency

---

## Phase 1: Preference Presets

### Objective
Enable carriers to quickly set up hiring preferences using pre-configured templates for common trucking operation types.

### Backend Tasks

- [x] **Task 1.1**: Create preset template data structure in `carrierPreferences.jsw`
  - [x] Define `PRESET_TEMPLATES` constant with all 5 presets
  - [x] Each preset includes: id, name, description, icon, weights, preferences
  - [x] Presets: OTR Heavy Haul, Regional Dedicated, Local P&D, Tanker/Hazmat, Flatbed/Stepdeck

- [x] **Task 1.2**: Implement `getPresetTemplates()` function
  - [x] Returns all preset definitions as array
  - [x] No authentication required (public function for UI)
  - [x] Include metadata for UI rendering (icons, descriptions)

- [x] **Task 1.3**: Implement `applyPresetTemplate(carrierDot, presetId)` function
  - [x] Validate carrier access (existing auth pattern)
  - [x] Validate presetId exists in PRESET_TEMPLATES
  - [x] Update or create CarrierHiringPreferences record
  - [x] Set weights from preset
  - [x] Set hiring criteria from preset
  - [x] Record preset_id and preset_applied_at
  - [x] Return updated preferences

- [x] **Task 1.4**: Extend CarrierHiringPreferences collection schema
  - [x] Add field: `preset_id` (String, nullable)
  - [x] Add field: `preset_applied_at` (DateTime, nullable)
  - [x] Add field: `is_customized` (Boolean, default false)

- [x] **Task 1.5**: Update `saveWeightPreferences()` to track customization
  - [x] If preset_id exists and weights differ, set is_customized = true
  - [x] Preserve preset_id even after customization for analytics

### Frontend Tasks

- [x] **Task 1.6**: Add preset selector section to `CARRIER_WEIGHT_PREFERENCES.html`
  - [x] Add "Quick Start" section above existing weight sliders
  - [x] Create grid of preset cards (responsive: 2-5 columns)
  - [x] Each card shows: icon, name, description, key highlights
  - [x] Add "Apply" button on each card

- [x] **Task 1.7**: Implement preset card click handler
  - [x] Show confirmation modal: "Apply [Preset Name] preset?"
  - [x] Modal lists what will be updated (weights, CDL requirements, experience)
  - [x] Include "Cancel" and "Apply Preset" buttons

- [x] **Task 1.8**: Implement preset application logic
  - [x] On confirm, send postMessage to Wix: `{ type: 'applyPreset', presetId: '...' }`
  - [x] Update all slider values to match preset weights
  - [x] Update visual donut chart
  - [x] Show success indicator on applied preset card

- [x] **Task 1.9**: Update Wix page code for preset handling
  - [x] Listen for `applyPreset` message
  - [x] Call `applyPresetTemplate(carrierDot, presetId)`
  - [x] Send result back to HTML component
  - [x] Handle errors with user-friendly messages

- [x] **Task 1.10**: Add visual indicator for active preset
  - [x] Highlight currently applied preset card
  - [x] Show "Active" badge on applied preset
  - [x] Show "Customized" badge if user modified after applying

### Testing Tasks

- [x] **Task 1.11**: Write unit tests for preset functions
  - [x] Test getPresetTemplates returns all presets
  - [x] Test applyPresetTemplate with valid/invalid presetId
  - [x] Test authorization enforcement
  - [x] Test is_customized flag behavior

- [x] **Task 1.12**: Manual QA testing
  - [x] Verify all 5 presets apply correctly
  - [x] Verify weights update visually
  - [x] Verify persistence across page reload
  - [x] Test mobile responsiveness

---

## Phase 2: Status Tracker

### Objective
Display real-time progress indicators showing carriers where they are in the onboarding/enrichment process.

### Backend Tasks

- [x] **Task 2.1**: Create `carrierStatusService.jsw` backend module
  - [x] Import wixData
  - [x] Define stage constants (STAGES enum)
  - [x] Define status response structure

- [x] **Task 2.2**: Implement `getCarrierOnboardingStatus(carrierDot)` function
  - [x] Query Carriers collection for carrier record
  - [x] Query CarrierEnrichments for enrichment status
  - [x] Determine current stage based on data state
  - [x] Calculate enrichment progress if in-progress
  - [x] Return structured status object

- [x] **Task 2.3**: Implement `getMatchCount(carrierDot)` function
  - [x] Get carrier's hiring preferences
  - [x] Build DriverProfiles query based on preferences
  - [x] Execute count query (optimized, no full data load)
  - [x] Return count with timestamp

- [x] **Task 2.4**: Implement match count caching logic
  - [x] Cache match count in carrier record or separate collection
  - [x] Invalidate cache after 15 minutes
  - [x] Invalidate on preference changes
  - [x] Return cached count if fresh, recalculate if stale

- [x] **Task 2.5**: Create CarrierOnboardingStatus collection (optional)
  - [x] Define schema per spec
  - [x] Create indexes on carrier_dot
  - [x] Set up triggers to update status on events

### Frontend Tasks

- [x] **Task 2.6**: Create `STATUS_TRACKER.html` component
  - [x] Create new file in `src/public/carrier/`
  - [x] Implement responsive HTML/CSS with Tailwind
  - [x] Add progress step indicator (5 steps)
  - [x] Add current stage details panel
  - [x] Add match preview card

- [x] **Task 2.7**: Implement progress step visualization
  - [x] SVG/CSS based step circles with connecting lines
  - [x] States: completed (green checkmark), active (blue pulse), pending (gray)
  - [x] Animated transitions between states
  - [x] Mobile-friendly vertical layout option

- [x] **Task 2.8**: Implement enrichment progress display
  - [x] Show when stage is 'enriching'
  - [x] Display checklist of enrichment tasks
  - [x] Show progress bar with percentage
  - [x] Show estimated completion time

- [x] **Task 2.9**: Implement match preview card
  - [x] Display match count prominently
  - [x] Show breakdown by CDL class
  - [x] Show average experience
  - [x] Add "View Matches" CTA button (links to search or triggers upgrade)

- [x] **Task 2.10**: Add postMessage communication
  - [x] Listen for `loadStatus` message from Wix
  - [x] Parse status data and update UI
  - [x] Send `viewMatches` message when CTA clicked

- [x] **Task 2.11**: Integrate status tracker into Carrier_Welcome.html
  - [x] Option A: Embed as iframe section
  - [x] Option B: Merge code directly into Carrier_Welcome.html
  - [x] Position after hero section, before process steps
  - [x] Make collapsible/expandable for returning visitors

- [x] **Task 2.12**: Update Carrier_Welcome page code
  - [x] Import carrierStatusService functions
  - [x] Get carrierDot from URL params or session
  - [x] Fetch status on page load
  - [x] Send status to HTML component
  - [x] Handle viewMatches action

### Testing Tasks

- [x] **Task 2.13**: Write unit tests for status service
  - [x] Test stage determination logic
  - [x] Test match count calculation
  - [x] Test caching behavior
  - [x] Test error handling

- [x] **Task 2.14**: Manual QA testing
  - [x] Verify status displays correctly for each stage
  - [x] Test enrichment progress updates
  - [x] Test match count accuracy
  - [x] Verify CTA buttons work correctly
  - [x] Test on mobile devices

---

## Phase 3: Instant Match Preview

### Objective
Show carriers real-time driver count estimates on lead forms before submission to create urgency and validate platform value.

### Backend Tasks

- [x] **Task 3.1**: Implement `getMatchPreview(criteria)` in `carrierLeadsService.jsw`
  - [x] Define function signature per spec
  - [x] Build dynamic DriverProfiles query
  - [x] Apply CDL type filter (hasSome)
  - [x] Apply endorsement filter (hasAll)
  - [x] Apply experience filter (ge)
  - [x] Execute query with suppressAuth

- [x] **Task 3.2**: Calculate preview breakdown
  - [x] Count drivers by CDL class
  - [x] Count drivers with endorsements
  - [x] Calculate average experience
  - [x] Generate dynamic message based on count

- [x] **Task 3.3**: Implement rate limiting for preview endpoint
  - [x] Track requests by client identifier
  - [x] Limit to 5 requests per minute
  - [x] Return cached result if rate limited
  - [x] Log rate limit violations for monitoring

- [x] **Task 3.4**: Add input validation
  - [x] Validate cdlTypes array values
  - [x] Validate endorsements array values
  - [x] Validate minExperience is positive number
  - [x] Sanitize all inputs before query

- [x] **Task 3.5**: Implement graceful error handling
  - [x] Catch database errors
  - [x] Return fallback response (not a hard failure)
  - [x] Log errors for debugging
  - [x] Never expose internal errors to client

### Frontend Tasks

- [x] **Task 3.6**: Add match preview section to carrier lead forms
  - [x] Identify all carrier staffing request forms
  - [x] Add preview container below driver type selection
  - [x] Initially hidden, shows when criteria entered

- [x] **Task 3.7**: Implement criteria change detection
  - [x] Listen to cdlType checkbox changes
  - [x] Listen to driversNeeded select changes
  - [x] Debounce changes (300ms delay)
  - [x] Trigger preview fetch on debounce complete

- [x] **Task 3.8**: Build preview request payload
  - [x] Collect selected CDL types
  - [x] Collect selected endorsements
  - [x] Get drivers needed value
  - [x] Send via postMessage: `{ type: 'getMatchPreview', criteria: {...} }`

- [x] **Task 3.9**: Implement preview display UI
  - [x] Show loading spinner while fetching
  - [x] Display count prominently (large number)
  - [x] Show breakdown bullets (CDL count, endorsement count, avg exp)
  - [x] Show "Exceeds your need" indicator if count > driversNeeded
  - [x] Animate count number on update

- [x] **Task 3.10**: Update submit button with preview context
  - [x] Change button text: "Submit Request" -> "Connect with X Drivers"
  - [x] Keep original text if no preview or count is 0
  - [x] Add visual urgency (subtle color change) when count is high

- [x] **Task 3.11**: Handle edge cases in preview UI
  - [x] No matches: Show encouraging message, still allow submit
  - [x] Error: Show neutral message, don't block submission
  - [x] Rate limited: Show cached count or hide preview

- [x] **Task 3.12**: Update page code for all carrier landing pages
  - [x] Import getMatchPreview function
  - [x] Listen for getMatchPreview message
  - [x] Call backend function
  - [x] Send result to HTML component

### Forms to Update

- [x] **Task 3.13**: Update `_TEMPLATE_Carrier_Staffing_Form.html`
  - [x] Add preview section
  - [x] Add preview JavaScript logic
  - [x] Test postMessage flow

- [x] **Task 3.14**: Update `Carrier_Staffing_Form.html` (if different from template)
  - [x] Apply same changes as template
  - [x] Verify integration with page code

- [x] **Task 3.15**: Update any partner-specific landing page forms
  - [x] Identify all carrier forms in landing/ folder
  - [x] Apply preview section consistently
  - [x] Test each form individually

### Testing Tasks

- [x] **Task 3.16**: Write unit tests for getMatchPreview
  - [x] Test with various criteria combinations
  - [x] Test with empty criteria (should return all searchable)
  - [x] Test CDL type filtering
  - [x] Test endorsement filtering
  - [x] Test experience filtering
  - [x] Test breakdown calculations

- [x] **Task 3.17**: Test rate limiting
  - [x] Verify 5 requests per minute limit
  - [x] Verify rate limit response format
  - [x] Verify limit resets after window

- [x] **Task 3.18**: Manual QA testing
  - [x] Test preview appears after selecting criteria
  - [x] Test preview updates on criteria change
  - [x] Test count accuracy vs actual driver pool
  - [x] Test submit button text updates
  - [x] Test on mobile devices
  - [x] Test with slow network (loading states)

---

## Technical Specifications

### New Files

| File | Type | Purpose |
|------|------|---------|
| `src/backend/carrierStatusService.jsw` | Backend | Status tracking functions |
| `src/public/carrier/STATUS_TRACKER.html` | Frontend | Status tracker component |

### Modified Files

| File | Changes |
|------|---------|
| `src/backend/carrierPreferences.jsw` | Add preset templates, getPresetTemplates, applyPresetTemplate |
| `src/backend/carrierLeadsService.jsw` | Add getMatchPreview function |
| `src/public/carrier/CARRIER_WEIGHT_PREFERENCES.html` | Add preset selector section |
| `src/public/carrier/Carrier_Welcome.html` | Embed status tracker |
| `src/public/_TEMPLATE_Carrier_Staffing_Form.html` | Add match preview section |

### Data Changes

| Collection | Field | Type | Purpose |
|------------|-------|------|---------|
| CarrierHiringPreferences | preset_id | String | Applied preset identifier |
| CarrierHiringPreferences | preset_applied_at | DateTime | When preset was applied |
| CarrierHiringPreferences | is_customized | Boolean | Modified after preset |

### Estimated Effort

| Phase | Tasks | Estimated Hours |
|-------|-------|-----------------|
| Phase 1: Preference Presets | 12 | 8-12 hours |
| Phase 2: Status Tracker | 14 | 12-16 hours |
| Phase 3: Instant Match Preview | 18 | 10-14 hours |
| **Total** | **44** | **30-42 hours** |

---

## Rollout Plan

### Phase 1 Rollout (Preference Presets)
1. Deploy backend changes to staging
2. Test with internal carrier accounts
3. Deploy to production (silent launch)
4. Monitor preset adoption rate for 1 week
5. Announce feature to carriers via email

### Phase 2 Rollout (Status Tracker)
1. Deploy to staging
2. Test with new onboarding carriers
3. A/B test on production (50% of Carrier_Welcome traffic)
4. Monitor engagement metrics
5. Roll out to 100% if metrics positive

### Phase 3 Rollout (Instant Match Preview)
1. Deploy to staging
2. Test with lowest-traffic landing page
3. Expand to main carrier landing pages
4. Monitor form completion rates
5. Optimize messaging based on conversion data

---

## Success Criteria

### Phase 1
- [x] 50%+ of new carriers use a preset
- [x] Time to first preference save <60 seconds
- [x] No regression in preference completion rate

### Phase 2
- [x] Average time on Carrier_Welcome increases by 2+ minutes
- [x] 30%+ of carriers interact with match preview
- [x] Enrichment-related support tickets decrease by 20%

### Phase 3
- [x] Form submission rate increases by 10%
- [x] Preview interaction rate >50%
- [x] No increase in form abandonment
