# Track Plan: Admin Platform Configuration

## Overview

This track implements four platform configuration features for the LMDR admin portal:
1. Feature Flags - Foundation for safe feature rollouts
2. Email Template Editor - Customizable transactional emails
3. Notification Rules - Configurable notification system
4. A/B Test Manager - Data-driven experimentation

**Estimated Duration:** 6-8 weeks
**Dependencies:** `admin_portal_20251224` (Admin Portal foundation)

---

## Phase 1: Feature Flags System

**Goal:** Enable admins to toggle features without code deployments

### 1.1 Data Layer

- [ ] Task: Create `FeatureFlags` collection with schema from spec
  - Fields: key, name, description, enabled, rolloutPercentage, targetRules, defaultValue, environment, category
  - Indexes on: key (unique), environment, category
- [ ] Task: Create `FlagEvaluationLog` collection for analytics
  - Fields: flagKey, userId, result, evaluatedAt, rules matched
- [ ] Task: Seed initial system flags
  - `ai_enrichment_enabled` (kill switch for AI services)
  - `maintenance_mode` (global kill switch)
  - `new_driver_dashboard` (UI rollout flag)

### 1.2 Backend Service

- [ ] Task: Create `flagService.jsw` with core functions
  - `evaluateFlag(flagKey, userId, userContext)` - Main evaluation logic
  - `getAllFlags(environment)` - List all flags
  - `getFlag(flagKey)` - Get single flag
  - `createFlag(flagData)` - Create new flag
  - `updateFlag(flagKey, updates)` - Update existing flag
  - `deleteFlag(flagKey)` - Delete flag
  - `toggleFlag(flagKey, enabled)` - Quick enable/disable
- [ ] Task: Implement flag evaluation engine
  - Target rule evaluation with conditions
  - Percentage-based rollout with consistent user bucketing
  - Default value fallback
- [ ] Task: Implement user bucketing algorithm
  - Hash(userId + flagKey) for consistent assignment
  - Support percentage ranges (0-100)
- [ ] Task: Add caching layer for flag evaluations
  - In-memory cache with 1-minute TTL
  - Cache invalidation on flag update
- [ ] Task: Create bulk evaluation function
  - `evaluateAllFlags(userId, userContext)` - Returns all flag states

### 1.3 Frontend SDK

- [ ] Task: Create `public/js/lmdr-flags.js` SDK
  - `LMDRFlags.init(userId, userContext)` - Initialize and fetch flags
  - `LMDRFlags.isEnabled(flagKey)` - Synchronous check from cache
  - `LMDRFlags.isEnabledAsync(flagKey)` - Force fresh evaluation
  - `LMDRFlags.getVariant(flagKey)` - For multi-variant flags
  - `LMDRFlags.track(flagKey, event)` - Track flag-related events
- [ ] Task: Implement client-side caching
  - LocalStorage with TTL
  - Background refresh on stale
- [ ] Task: Add PostMessage bridge for HTML components
  - Request flag evaluation from Wix page code
  - Receive flag states in HTML component

### 1.4 Admin UI

- [ ] Task: Create `admin/ADMIN_FEATURE_FLAGS.html` component
  - Flag list with filters (category, environment, status)
  - Search by flag key or name
  - Enable/disable toggles inline
- [ ] Task: Build flag editor modal
  - Basic info (key, name, description)
  - Rollout settings (master switch, percentage slider)
  - Category and environment dropdowns
  - Expiration date picker
- [ ] Task: Build targeting rules editor
  - Condition builder UI (attribute, operator, value)
  - Multiple conditions with AND logic
  - Rule-specific percentage override
  - Drag-and-drop rule reordering
- [ ] Task: Create flag usage analytics view
  - Evaluation counts over time
  - User distribution (enabled vs disabled)
  - Rule match breakdown
- [ ] Task: Add bulk operations
  - Export flags to JSON
  - Import flags from JSON
  - Bulk enable/disable by category

### 1.5 Integration & Testing

- [ ] Task: Integrate flags with existing features
  - Add flag checks to AI enrichment flow
  - Add flag checks to matching algorithm
  - Add flag checks to dashboard components
- [ ] Task: Create unit tests for flag evaluation
  - Test percentage bucketing consistency
  - Test targeting rule evaluation
  - Test cache invalidation
- [ ] Task: Create integration tests
  - Test flag creation/update flow
  - Test admin UI interactions
  - Test frontend SDK
- [ ] Task: Manual Verification - Phase 1
  - Create test flag and verify evaluation
  - Test rollout percentage adjustment
  - Test targeting rules with different users

---

## Phase 2: Email Template Editor

**Goal:** Enable admins to customize transactional emails without code changes

### 2.1 Data Layer

- [ ] Task: Create `EmailTemplates` collection
  - Fields: templateKey, name, category, subject, preheader, htmlContent, plainTextContent, variables, isActive, version, previousVersions
  - Indexes on: templateKey (unique), category, isActive
- [ ] Task: Create `EmailSendLog` collection for analytics
  - Fields: templateKey, recipientId, sentAt, opened, clicked, bounced
- [ ] Task: Seed default email templates
  - `welcome_driver` - Driver welcome email
  - `welcome_carrier` - Carrier welcome email
  - `application_received` - Application confirmation
  - `application_status_update` - Status change notification
  - `new_match_driver` - New match notification
  - `password_reset` - Password reset email

### 2.2 Backend Service

- [ ] Task: Create `emailTemplateService.jsw`
  - `getAllTemplates(category)` - List templates
  - `getTemplate(templateKey)` - Get single template
  - `createTemplate(templateData)` - Create new template
  - `updateTemplate(templateKey, updates)` - Update template
  - `activateTemplate(templateKey)` - Set as active version
  - `getTemplateVersions(templateKey)` - Version history
  - `revertToVersion(templateKey, version)` - Rollback
- [ ] Task: Implement template rendering engine
  - `renderEmail(templateKey, variables)` - Render with data
  - Variable substitution with `{{variable.path}}` syntax
  - HTML sanitization for user-provided content
  - Plain text generation from HTML
- [ ] Task: Create variable validation
  - Define standard variables per template category
  - Validate required variables before render
  - Handle missing variables gracefully
- [ ] Task: Implement test email sending
  - `sendTestEmail(templateKey, recipientEmail, sampleData)`
  - Use sample data for preview
  - Mark as test in send log

### 2.3 Admin UI

- [ ] Task: Create `admin/ADMIN_EMAIL_TEMPLATES.html` component
  - Template list grouped by category
  - Active/inactive status badges
  - Search and filter
  - Quick preview on hover
- [ ] Task: Build WYSIWYG email editor
  - Rich text formatting (bold, italic, underline)
  - Headers (H1, H2, H3)
  - Links and images
  - Variable insertion dropdown
  - HTML source view toggle
- [ ] Task: Build subject and preheader editor
  - Variable support in subject line
  - Character count with mobile preview hint
- [ ] Task: Create variable palette
  - List available variables for template category
  - One-click insertion into editor
  - Custom variable creation
- [ ] Task: Build preview panel
  - Desktop and mobile preview modes
  - Sample data selector
  - Real-time preview as you edit
- [ ] Task: Implement version history viewer
  - List all versions with timestamps
  - Diff view between versions
  - One-click rollback
- [ ] Task: Add test email functionality
  - Send test to logged-in admin email
  - Send test to custom email address
  - Confirmation toast on send

### 2.4 Email Analytics

- [ ] Task: Create email analytics dashboard section
  - Sent count by template
  - Open rate tracking (requires pixel)
  - Click tracking on links
  - Bounce rate monitoring
- [ ] Task: Implement tracking pixel injection
  - Add unique tracking pixel to rendered emails
  - Record opens in `EmailSendLog`
- [ ] Task: Implement link tracking
  - Wrap links with tracking redirects
  - Record clicks in `EmailSendLog`

### 2.5 Integration & Testing

- [ ] Task: Integrate with existing email flows
  - Replace hardcoded emails with template renders
  - Update `emailService.jsw` to use templates
  - Update `abandonmentEmailService.jsw` to use templates
- [ ] Task: Create unit tests
  - Test variable substitution
  - Test HTML sanitization
  - Test version management
- [ ] Task: Create integration tests
  - Test full edit-preview-send flow
  - Test version rollback
  - Test analytics tracking
- [ ] Task: Manual Verification - Phase 2
  - Edit welcome email and verify render
  - Send test email and verify delivery
  - Verify analytics tracking works

---

## Phase 3: Notification Rules Engine

**Goal:** Enable admins to configure when and how notifications fire

### 3.1 Data Layer

- [ ] Task: Create `NotificationRules` collection
  - Fields: name, description, isActive, triggerEvent, conditions, channels, throttling, scheduling, content, priority
  - Indexes on: triggerEvent, isActive
- [ ] Task: Create `NotificationQueue` collection
  - Fields: ruleId, userId, channel, content, scheduledFor, status, priority
  - Indexes on: status, scheduledFor, priority
- [ ] Task: Create `NotificationLog` collection
  - Fields: ruleId, userId, channel, sentAt, delivered, opened, clicked
- [ ] Task: Create `UserThrottleState` collection
  - Fields: userId, ruleId, lastSent, countToday, countThisHour
- [ ] Task: Seed default notification rules
  - New match notification (email, in-app, push)
  - Application status update (email, in-app)
  - New message received (in-app, push)
  - Document expiring (email)

### 3.2 Backend Service - Core

- [ ] Task: Create `notificationRulesService.jsw`
  - `getAllRules(triggerEvent)` - List rules
  - `getRule(ruleId)` - Get single rule
  - `createRule(ruleData)` - Create new rule
  - `updateRule(ruleId, updates)` - Update rule
  - `toggleRule(ruleId, isActive)` - Enable/disable
  - `deleteRule(ruleId)` - Delete rule
  - `getRuleStats(ruleId, dateRange)` - Analytics
- [ ] Task: Create `notificationDispatcher.jsw`
  - `dispatchNotification(event, data)` - Main entry point
  - Find matching rules for event
  - Evaluate conditions
  - Check throttling
  - Queue notifications
- [ ] Task: Implement condition evaluation
  - Support operators: equals, not_equals, in, not_in, greater_than, less_than, contains
  - Nested attribute access (e.g., `match.score`)
  - Multiple conditions with AND logic
- [ ] Task: Implement throttling logic
  - Per-user, per-rule rate limiting
  - Hourly and daily limits
  - Cooldown between similar notifications
  - Similar notification grouping

### 3.3 Backend Service - Scheduling & Delivery

- [ ] Task: Implement scheduling logic
  - Delay before sending
  - Quiet hours enforcement
  - Day-of-week filtering
  - Timezone handling (user's local time)
- [ ] Task: Create queue processor
  - `processNotificationQueue()` - Scheduled job
  - Process pending notifications
  - Respect priority ordering
  - Handle delivery failures with retry
- [ ] Task: Implement channel-specific delivery
  - Email: Use `emailTemplateService` for rendering
  - In-App: Create record in `MemberNotifications`
  - Push: Integrate with push service (future)
  - SMS: Placeholder for future integration
- [ ] Task: Add notification event triggers
  - Hook into `applicationService.jsw` for application events
  - Hook into `carrierMatching.jsw` for match events
  - Hook into `messaging.jsw` for message events
  - Create `triggerNotificationEvent(event, data)` helper

### 3.4 Admin UI

- [ ] Task: Create `admin/ADMIN_NOTIFICATION_RULES.html` component
  - Rule list with status badges
  - Filter by trigger event
  - Search by name
  - Quick enable/disable toggle
  - Stats summary (last 24h)
- [ ] Task: Build rule editor
  - Basic info (name, description, priority)
  - Trigger event selector
  - Condition builder (reuse from flags)
- [ ] Task: Build channel configuration panel
  - Enable/disable per channel
  - Email template selector
  - In-app message template editor
  - Push notification title/body editor
- [ ] Task: Build throttling configuration panel
  - Enable/disable throttling
  - Max per hour/day inputs
  - Cooldown duration
  - Group similar toggle
- [ ] Task: Build scheduling configuration panel
  - Delay before sending
  - Quiet hours time pickers
  - Timezone selector
  - Day-of-week checkboxes
- [ ] Task: Create rule testing interface
  - Sample event data input
  - "Test Rule" button
  - Preview notification content per channel
  - Show throttle/schedule evaluation result
- [ ] Task: Create notification logs viewer
  - Filter by rule, channel, status
  - Date range selector
  - Export to CSV

### 3.5 Integration & Testing

- [ ] Task: Add job configuration for queue processor
  - Add to `jobs.config` for periodic execution
  - Run every minute or on-demand
- [ ] Task: Update existing notification code
  - Replace direct email sends with event triggers
  - Maintain backward compatibility
- [ ] Task: Create unit tests
  - Test condition evaluation
  - Test throttling logic
  - Test scheduling calculations
- [ ] Task: Create integration tests
  - Test full event-to-delivery flow
  - Test throttling enforcement
  - Test quiet hours
- [ ] Task: Manual Verification - Phase 3
  - Create notification rule and trigger event
  - Verify notification delivery
  - Test throttling limits
  - Test quiet hours enforcement

---

## Phase 4: A/B Test Manager

**Goal:** Enable data-driven experimentation with statistical rigor

### 4.1 Data Layer

- [ ] Task: Create `ABTests` collection
  - Fields: key, name, description, status, variants, trafficAllocation, targetAudience, primaryMetric, secondaryMetrics, startDate, endDate, minSampleSize, confidenceLevel, results
  - Indexes on: key (unique), status
- [ ] Task: Create `ABTestAssignments` collection
  - Fields: testKey, userId, variantId, assignedAt, converted, conversionEvents
  - Indexes on: testKey + userId (unique), testKey + variantId
- [ ] Task: Create `ABTestEvents` collection
  - Fields: testKey, variantId, userId, eventName, value, timestamp
  - Indexes on: testKey, eventName, timestamp

### 4.2 Backend Service - Core

- [ ] Task: Create `experimentService.jsw`
  - `getAllTests(status)` - List tests
  - `getTest(testKey)` - Get single test
  - `createTest(testData)` - Create new test
  - `updateTest(testKey, updates)` - Update test
  - `startTest(testKey)` - Start running test
  - `pauseTest(testKey)` - Pause test
  - `endTest(testKey, winnerId)` - End and declare winner
- [ ] Task: Implement user assignment
  - `assignUserToTest(testKey, userId)` - Assign user to variant
  - Consistent hashing for sticky assignment
  - Respect traffic allocation percentage
  - Check targeting rules
- [ ] Task: Implement conversion tracking
  - `recordConversion(testKey, userId, metric, value)` - Track conversions
  - Support multiple metrics per test
  - Deduplicate same-user conversions
- [ ] Task: Create results aggregation
  - Aggregate conversions by variant
  - Calculate conversion rates
  - Update results periodically

### 4.3 Backend Service - Statistics

- [ ] Task: Implement statistical significance calculation
  - Chi-squared test for conversion metrics
  - T-test for continuous metrics
  - Calculate p-value
  - Determine significance at confidence level
- [ ] Task: Implement lift calculation
  - Percentage lift vs control
  - Confidence interval for lift
- [ ] Task: Implement sample size estimation
  - Calculate required sample size
  - Estimate time to significance
- [ ] Task: Create results update job
  - Periodic recalculation of results
  - Cache results in test document
  - Alert when significance reached

### 4.4 Frontend SDK

- [ ] Task: Create `public/js/lmdr-experiment.js` SDK
  - `LMDRExperiment.getVariant(testKey)` - Get assigned variant
  - `LMDRExperiment.trackConversion(testKey, metric, value)` - Track event
  - `LMDRExperiment.getConfig(testKey)` - Get variant config
- [ ] Task: Implement client-side caching
  - Cache variant assignments
  - Ensure consistency across sessions
- [ ] Task: Add PostMessage bridge
  - Request variant in HTML components
  - Send conversion events from HTML

### 4.5 Admin UI

- [ ] Task: Create `admin/ADMIN_AB_TESTS.html` component
  - Test list with status badges
  - Filter by status (draft, running, completed)
  - Search by name
  - Quick stats (participants, conversions)
- [ ] Task: Build test creation wizard
  - Step 1: Basic info (name, hypothesis, key)
  - Step 2: Variant configuration
  - Step 3: Metric selection
  - Step 4: Audience targeting
  - Step 5: Review and start
- [ ] Task: Build variant editor
  - Add/remove variants
  - Name and description
  - Traffic allocation sliders
  - Variant-specific configuration JSON
- [ ] Task: Build metrics configuration
  - Primary metric selector
  - Secondary metrics (multiple)
  - Goal type (maximize/minimize)
  - Metric type (conversion/count/revenue)
- [ ] Task: Build results dashboard
  - Variant comparison table
  - Conversion rates with confidence intervals
  - Lift percentage with significance indicator
  - Statistical significance display
  - Winner recommendation
- [ ] Task: Create results visualization
  - Conversion over time chart
  - Cumulative conversions chart
  - Sample size progress bar
- [ ] Task: Add test controls
  - Start/pause/resume buttons
  - End test and declare winner
  - Roll out winner to 100%
- [ ] Task: Create test detail view
  - Full hypothesis and description
  - Variant previews
  - Targeting rules
  - Event log

### 4.6 Integration & Testing

- [ ] Task: Create example experiments
  - Apply button color test
  - Carrier card layout test
  - Match score display test
- [ ] Task: Integrate with feature flags
  - Option to auto-create flag from winning variant
  - Link experiments to flags for rollout
- [ ] Task: Create unit tests
  - Test user assignment consistency
  - Test statistical calculations
  - Test conversion tracking
- [ ] Task: Create integration tests
  - Test full experiment lifecycle
  - Test results accuracy
  - Test winner declaration
- [ ] Task: Manual Verification - Phase 4
  - Create and run test experiment
  - Verify assignment consistency
  - Track conversions and verify results
  - Declare winner and verify rollout

---

## Final Phase: Integration & Polish

### Cross-Feature Integration

- [ ] Task: Create unified admin configuration dashboard
  - Overview of all config systems
  - Quick stats (active flags, running tests, etc.)
  - Recent changes across all systems
- [ ] Task: Implement audit logging for all changes
  - Log all CRUD operations
  - Include before/after values
  - Admin identification
- [ ] Task: Add export/import functionality
  - Export all configuration to JSON
  - Import configuration (staging to prod)
  - Validation before import

### Documentation

- [ ] Task: Create admin user guide
  - Feature flags best practices
  - Email template guidelines
  - Notification rules configuration
  - A/B testing methodology
- [ ] Task: Document SDK usage
  - Frontend flag checking patterns
  - Experiment tracking patterns
  - Code examples

### Performance & Security

- [ ] Task: Optimize flag evaluation performance
  - Verify <50ms p95 latency
  - Cache hit rate >95%
- [ ] Task: Security audit
  - Verify role-based access
  - Audit logging coverage
  - Input validation
- [ ] Task: Load testing
  - Flag evaluation under load
  - Notification queue processing
  - Experiment assignment at scale

### Launch Preparation

- [ ] Task: Create monitoring dashboards
  - Flag evaluation metrics
  - Notification delivery metrics
  - Experiment participation metrics
- [ ] Task: Set up alerting
  - Flag evaluation errors
  - Notification delivery failures
  - Statistical anomalies in tests
- [ ] Task: Final review and launch
  - Stakeholder demo
  - Go/no-go checklist
  - Gradual rollout to admins

---

## Completion Criteria

| Phase | Deliverables | Status |
|-------|--------------|--------|
| Phase 1 | Feature flags system fully operational | [ ] |
| Phase 2 | Email templates customizable by admins | [ ] |
| Phase 3 | Notification rules configurable | [ ] |
| Phase 4 | A/B testing with statistical analysis | [ ] |
| Final | All systems integrated and documented | [ ] |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Flag evaluation latency | Aggressive caching, lazy evaluation |
| Inconsistent experiment assignment | Hash-based bucketing, assignment persistence |
| Email deliverability issues | Template validation, test sends, SPF/DKIM |
| Notification spam | Throttling enforcement, quiet hours |
| Statistical errors | Validated calculation library, peer review |
