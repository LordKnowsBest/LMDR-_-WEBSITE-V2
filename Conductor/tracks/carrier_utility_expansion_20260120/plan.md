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

- [ ] **Task 1.1**: Create preset template data structure in `carrierPreferences.jsw`
  - [ ] Define `PRESET_TEMPLATES` constant with all 5 presets
  - [ ] Each preset includes: id, name, description, icon, weights, preferences
  - [ ] Presets: OTR Heavy Haul, Regional Dedicated, Local P&D, Tanker/Hazmat, Flatbed/Stepdeck

- [ ] **Task 1.2**: Implement `getPresetTemplates()` function
  - [ ] Returns all preset definitions as array
  - [ ] No authentication required (public function for UI)
  - [ ] Include metadata for UI rendering (icons, descriptions)

- [ ] **Task 1.3**: Implement `applyPresetTemplate(carrierDot, presetId)` function
  - [ ] Validate carrier access (existing auth pattern)
  - [ ] Validate presetId exists in PRESET_TEMPLATES
  - [ ] Update or create CarrierHiringPreferences record
  - [ ] Set weights from preset
  - [ ] Set hiring criteria from preset
  - [ ] Record preset_id and preset_applied_at
  - [ ] Return updated preferences

- [ ] **Task 1.4**: Extend CarrierHiringPreferences collection schema
  - [ ] Add field: `preset_id` (String, nullable)
  - [ ] Add field: `preset_applied_at` (DateTime, nullable)
  - [ ] Add field: `is_customized` (Boolean, default false)

- [ ] **Task 1.5**: Update `saveWeightPreferences()` to track customization
  - [ ] If preset_id exists and weights differ, set is_customized = true
  - [ ] Preserve preset_id even after customization for analytics

### Frontend Tasks

- [ ] **Task 1.6**: Add preset selector section to `CARRIER_WEIGHT_PREFERENCES.html`
  - [ ] Add "Quick Start" section above existing weight sliders
  - [ ] Create grid of preset cards (responsive: 2-5 columns)
  - [ ] Each card shows: icon, name, description, key highlights
  - [ ] Add "Apply" button on each card

- [ ] **Task 1.7**: Implement preset card click handler
  - [ ] Show confirmation modal: "Apply [Preset Name] preset?"
  - [ ] Modal lists what will be updated (weights, CDL requirements, experience)
  - [ ] Include "Cancel" and "Apply Preset" buttons

- [ ] **Task 1.8**: Implement preset application logic
  - [ ] On confirm, send postMessage to Wix: `{ type: 'applyPreset', presetId: '...' }`
  - [ ] Update all slider values to match preset weights
  - [ ] Update visual donut chart
  - [ ] Show success indicator on applied preset card

- [ ] **Task 1.9**: Update Wix page code for preset handling
  - [ ] Listen for `applyPreset` message
  - [ ] Call `applyPresetTemplate(carrierDot, presetId)`
  - [ ] Send result back to HTML component
  - [ ] Handle errors with user-friendly messages

- [ ] **Task 1.10**: Add visual indicator for active preset
  - [ ] Highlight currently applied preset card
  - [ ] Show "Active" badge on applied preset
  - [ ] Show "Customized" badge if user modified after applying

### Testing Tasks

- [ ] **Task 1.11**: Write unit tests for preset functions
  - [ ] Test getPresetTemplates returns all presets
  - [ ] Test applyPresetTemplate with valid/invalid presetId
  - [ ] Test authorization enforcement
  - [ ] Test is_customized flag behavior

- [ ] **Task 1.12**: Manual QA testing
  - [ ] Verify all 5 presets apply correctly
  - [ ] Verify weights update visually
  - [ ] Verify persistence across page reload
  - [ ] Test mobile responsiveness

---

## Phase 2: Status Tracker

### Objective
Display real-time progress indicators showing carriers where they are in the onboarding/enrichment process.

### Backend Tasks

- [ ] **Task 2.1**: Create `carrierStatusService.jsw` backend module
  - [ ] Import wixData
  - [ ] Define stage constants (STAGES enum)
  - [ ] Define status response structure

- [ ] **Task 2.2**: Implement `getCarrierOnboardingStatus(carrierDot)` function
  - [ ] Query Carriers collection for carrier record
  - [ ] Query CarrierEnrichments for enrichment status
  - [ ] Determine current stage based on data state
  - [ ] Calculate enrichment progress if in-progress
  - [ ] Return structured status object

- [ ] **Task 2.3**: Implement `getMatchCount(carrierDot)` function
  - [ ] Get carrier's hiring preferences
  - [ ] Build DriverProfiles query based on preferences
  - [ ] Execute count query (optimized, no full data load)
  - [ ] Return count with timestamp

- [ ] **Task 2.4**: Implement match count caching logic
  - [ ] Cache match count in carrier record or separate collection
  - [ ] Invalidate cache after 15 minutes
  - [ ] Invalidate on preference changes
  - [ ] Return cached count if fresh, recalculate if stale

- [ ] **Task 2.5**: Create CarrierOnboardingStatus collection (optional)
  - [ ] Define schema per spec
  - [ ] Create indexes on carrier_dot
  - [ ] Set up triggers to update status on events

### Frontend Tasks

- [ ] **Task 2.6**: Create `STATUS_TRACKER.html` component
  - [ ] Create new file in `src/public/carrier/`
  - [ ] Implement responsive HTML/CSS with Tailwind
  - [ ] Add progress step indicator (5 steps)
  - [ ] Add current stage details panel
  - [ ] Add match preview card

- [ ] **Task 2.7**: Implement progress step visualization
  - [ ] SVG/CSS based step circles with connecting lines
  - [ ] States: completed (green checkmark), active (blue pulse), pending (gray)
  - [ ] Animated transitions between states
  - [ ] Mobile-friendly vertical layout option

- [ ] **Task 2.8**: Implement enrichment progress display
  - [ ] Show when stage is 'enriching'
  - [ ] Display checklist of enrichment tasks
  - [ ] Show progress bar with percentage
  - [ ] Show estimated completion time

- [ ] **Task 2.9**: Implement match preview card
  - [ ] Display match count prominently
  - [ ] Show breakdown by CDL class
  - [ ] Show average experience
  - [ ] Add "View Matches" CTA button (links to search or triggers upgrade)

- [ ] **Task 2.10**: Add postMessage communication
  - [ ] Listen for `loadStatus` message from Wix
  - [ ] Parse status data and update UI
  - [ ] Send `viewMatches` message when CTA clicked

- [ ] **Task 2.11**: Integrate status tracker into Carrier_Welcome.html
  - [ ] Option A: Embed as iframe section
  - [ ] Option B: Merge code directly into Carrier_Welcome.html
  - [ ] Position after hero section, before process steps
  - [ ] Make collapsible/expandable for returning visitors

- [ ] **Task 2.12**: Update Carrier_Welcome page code
  - [ ] Import carrierStatusService functions
  - [ ] Get carrierDot from URL params or session
  - [ ] Fetch status on page load
  - [ ] Send status to HTML component
  - [ ] Handle viewMatches action

### Testing Tasks

- [ ] **Task 2.13**: Write unit tests for status service
  - [ ] Test stage determination logic
  - [ ] Test match count calculation
  - [ ] Test caching behavior
  - [ ] Test error handling

- [ ] **Task 2.14**: Manual QA testing
  - [ ] Verify status displays correctly for each stage
  - [ ] Test enrichment progress updates
  - [ ] Test match count accuracy
  - [ ] Verify CTA buttons work correctly
  - [ ] Test on mobile devices

---

## Phase 3: Instant Match Preview

### Objective
Show carriers real-time driver count estimates on lead forms before submission to create urgency and validate platform value.

### Backend Tasks

- [ ] **Task 3.1**: Implement `getMatchPreview(criteria)` in `carrierLeadsService.jsw`
  - [ ] Define function signature per spec
  - [ ] Build dynamic DriverProfiles query
  - [ ] Apply CDL type filter (hasSome)
  - [ ] Apply endorsement filter (hasAll)
  - [ ] Apply experience filter (ge)
  - [ ] Execute query with suppressAuth

- [ ] **Task 3.2**: Calculate preview breakdown
  - [ ] Count drivers by CDL class
  - [ ] Count drivers with endorsements
  - [ ] Calculate average experience
  - [ ] Generate dynamic message based on count

- [ ] **Task 3.3**: Implement rate limiting for preview endpoint
  - [ ] Track requests by client identifier
  - [ ] Limit to 5 requests per minute
  - [ ] Return cached result if rate limited
  - [ ] Log rate limit violations for monitoring

- [ ] **Task 3.4**: Add input validation
  - [ ] Validate cdlTypes array values
  - [ ] Validate endorsements array values
  - [ ] Validate minExperience is positive number
  - [ ] Sanitize all inputs before query

- [ ] **Task 3.5**: Implement graceful error handling
  - [ ] Catch database errors
  - [ ] Return fallback response (not a hard failure)
  - [ ] Log errors for debugging
  - [ ] Never expose internal errors to client

### Frontend Tasks

- [ ] **Task 3.6**: Add match preview section to carrier lead forms
  - [ ] Identify all carrier staffing request forms
  - [ ] Add preview container below driver type selection
  - [ ] Initially hidden, shows when criteria entered

- [ ] **Task 3.7**: Implement criteria change detection
  - [ ] Listen to cdlType checkbox changes
  - [ ] Listen to driversNeeded select changes
  - [ ] Debounce changes (300ms delay)
  - [ ] Trigger preview fetch on debounce complete

- [ ] **Task 3.8**: Build preview request payload
  - [ ] Collect selected CDL types
  - [ ] Collect selected endorsements
  - [ ] Get drivers needed value
  - [ ] Send via postMessage: `{ type: 'getMatchPreview', criteria: {...} }`

- [ ] **Task 3.9**: Implement preview display UI
  - [ ] Show loading spinner while fetching
  - [ ] Display count prominently (large number)
  - [ ] Show breakdown bullets (CDL count, endorsement count, avg exp)
  - [ ] Show "Exceeds your need" indicator if count > driversNeeded
  - [ ] Animate count number on update

- [ ] **Task 3.10**: Update submit button with preview context
  - [ ] Change button text: "Submit Request" -> "Connect with X Drivers"
  - [ ] Keep original text if no preview or count is 0
  - [ ] Add visual urgency (subtle color change) when count is high

- [ ] **Task 3.11**: Handle edge cases in preview UI
  - [ ] No matches: Show encouraging message, still allow submit
  - [ ] Error: Show neutral message, don't block submission
  - [ ] Rate limited: Show cached count or hide preview

- [ ] **Task 3.12**: Update page code for all carrier landing pages
  - [ ] Import getMatchPreview function
  - [ ] Listen for getMatchPreview message
  - [ ] Call backend function
  - [ ] Send result to HTML component

### Forms to Update

- [ ] **Task 3.13**: Update `_TEMPLATE_Carrier_Staffing_Form.html`
  - [ ] Add preview section
  - [ ] Add preview JavaScript logic
  - [ ] Test postMessage flow

- [ ] **Task 3.14**: Update `Carrier_Staffing_Form.html` (if different from template)
  - [ ] Apply same changes as template
  - [ ] Verify integration with page code

- [ ] **Task 3.15**: Update any partner-specific landing page forms
  - [ ] Identify all carrier forms in landing/ folder
  - [ ] Apply preview section consistently
  - [ ] Test each form individually

### Testing Tasks

- [ ] **Task 3.16**: Write unit tests for getMatchPreview
  - [ ] Test with various criteria combinations
  - [ ] Test with empty criteria (should return all searchable)
  - [ ] Test CDL type filtering
  - [ ] Test endorsement filtering
  - [ ] Test experience filtering
  - [ ] Test breakdown calculations

- [ ] **Task 3.17**: Test rate limiting
  - [ ] Verify 5 requests per minute limit
  - [ ] Verify rate limit response format
  - [ ] Verify limit resets after window

- [ ] **Task 3.18**: Manual QA testing
  - [ ] Test preview appears after selecting criteria
  - [ ] Test preview updates on criteria change
  - [ ] Test count accuracy vs actual driver pool
  - [ ] Test submit button text updates
  - [ ] Test on mobile devices
  - [ ] Test with slow network (loading states)

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
- [ ] 50%+ of new carriers use a preset
- [ ] Time to first preference save <60 seconds
- [ ] No regression in preference completion rate

### Phase 2
- [ ] Average time on Carrier_Welcome increases by 2+ minutes
- [ ] 30%+ of carriers interact with match preview
- [ ] Enrichment-related support tickets decrease by 20%

### Phase 3
- [ ] Form submission rate increases by 10%
- [ ] Preview interaction rate >50%
- [ ] No increase in form abandonment
