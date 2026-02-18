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

- [x] Task: Create `FeatureFlags` collection with schema from spec
  - Fields: key, name, description, enabled, rolloutPercentage, targetRules, defaultValue, environment, category
  - Indexes on: key (unique), environment, category
- [x] Task: Create `FlagEvaluationLog` collection for analytics
  - Fields: flagKey, userId, result, evaluatedAt, rules matched
- [x] Task: Seed initial system flags
  - `ai_enrichment_enabled` (kill switch for AI services)
  - `maintenance_mode` (global kill switch)
  - `new_driver_dashboard` (UI rollout flag)

### 1.2 Backend Service

- [x] Task: Create `flagService.jsw` with core functions
  - `evaluateFlag(flagKey, userId, userContext)` - Main evaluation logic
  - `getAllFlags(environment)` - List all flags
  - `getFlag(flagKey)` - Get single flag
  - `createFlag(flagData)` - Create new flag
  - `updateFlag(flagKey, updates)` - Update existing flag
  - `deleteFlag(flagKey)` - Delete flag
  - `toggleFlag(flagKey, enabled)` - Quick enable/disable
- [x] Task: Implement flag evaluation engine
  - Target rule evaluation with conditions
  - Percentage-based rollout with consistent user bucketing
  - Default value fallback
- [x] Task: Implement user bucketing algorithm
  - Hash(userId + flagKey) for consistent assignment
  - Support percentage ranges (0-100)
- [x] Task: Add caching layer for flag evaluations
  - In-memory cache with 1-minute TTL
  - Cache invalidation on flag update
- [x] Task: Create bulk evaluation function
  - `evaluateAllFlags(userId, userContext)` - Returns all flag states

### 1.3 Frontend SDK

- [x] Task: Create `public/js/lmdr-flags.js` SDK
  - `LMDRFlags.init(userId, userContext)` - Initialize and fetch flags
  - `LMDRFlags.isEnabled(flagKey)` - Synchronous check from cache
  - `LMDRFlags.isEnabledAsync(flagKey)` - Force fresh evaluation
  - `LMDRFlags.getVariant(flagKey)` - For multi-variant flags
  - `LMDRFlags.track(flagKey, event)` - Track flag-related events
- [x] Task: Implement client-side caching
  - LocalStorage with TTL
  - Background refresh on stale
- [x] Task: Add PostMessage bridge for HTML components
  - Request flag evaluation from Wix page code
  - Receive flag states in HTML component

### 1.4 Admin UI

- [x] Task: Create `admin/ADMIN_FEATURE_FLAGS.html` component
  - Flag list with filters (category, environment, status)
  - Search by flag key or name
  - Enable/disable toggles inline
- [x] Task: Build flag editor modal
  - Basic info (key, name, description)
  - Rollout settings (master switch, percentage slider)
  - Category and environment dropdowns
  - Expiration date picker
- [x] Task: Build targeting rules editor
  - Condition builder UI (attribute, operator, value)
  - Multiple conditions with AND logic
  - Rule-specific percentage override
  - Drag-and-drop rule reordering
- [x] Task: Create flag usage analytics view
  - Evaluation counts over time
  - User distribution (enabled vs disabled)
  - Rule match breakdown
- [x] Task: Add bulk operations
  - Export flags to JSON
  - Import flags from JSON
  - Bulk enable/disable by category

### 1.5 Integration & Testing

- [x] Task: Integrate flags with existing features
  - Add flag checks to AI enrichment flow
  - Add flag checks to matching algorithm
  - Add flag checks to dashboard components
- [x] Task: Create unit tests for flag evaluation
  - Test percentage bucketing consistency
  - Test targeting rule evaluation
  - Test cache invalidation
- [x] Task: Create integration tests
  - Test flag creation/update flow
  - Test admin UI interactions
  - Test frontend SDK
- [x] Task: Manual Verification - Phase 1
  - Create test flag and verify evaluation
  - Test rollout percentage adjustment
  - Test targeting rules with different users

---

## Phase 2: Email Template Editor

**Goal:** Enable admins to customize transactional emails without code changes

### 2.1 Data Layer

- [x] Task: Create `EmailTemplates` collection
  - Fields: templateKey, name, category, subject, preheader, htmlContent, plainTextContent, variables, isActive, version, previousVersions
  - Indexes on: templateKey (unique), category, isActive
- [x] Task: Create `EmailSendLog` collection for analytics
  - Fields: templateKey, recipientId, sentAt, opened, clicked, bounced
- [x] Task: Seed default email templates
  - `welcome_driver` - Driver welcome email
  - `welcome_carrier` - Carrier welcome email
  - `application_received` - Application confirmation
  - `application_status_update` - Status change notification
  - `new_match_driver` - New match notification
  - `password_reset` - Password reset email

### 2.2 Backend Service

- [x] Task: Create `emailTemplateService.jsw`
  - `getAllTemplates(category)` - List templates
  - `getTemplate(templateKey)` - Get single template
  - `createTemplate(templateData)` - Create new template
  - `updateTemplate(templateKey, updates)` - Update template
  - `activateTemplate(templateKey)` - Set as active version
  - `getTemplateVersions(templateKey)` - Version history
  - `revertToVersion(templateKey, version)` - Rollback
- [x] Task: Implement template rendering engine
  - `renderEmail(templateKey, variables)` - Render with data
  - Variable substitution with `{{variable.path}}` syntax
  - HTML sanitization for user-provided content
  - Plain text generation from HTML
- [x] Task: Create variable validation
  - Define standard variables per template category
  - Validate required variables before render
  - Handle missing variables gracefully
- [x] Task: Implement test email sending
  - `sendTestEmail(templateKey, recipientEmail, sampleData)`
  - Use sample data for preview
  - Mark as test in send log

### 2.3 Admin UI

- [x] Task: Create `admin/ADMIN_EMAIL_TEMPLATES.html` component
  - Template list grouped by category
  - Active/inactive status badges
  - Search and filter
  - Quick preview on hover
- [x] Task: Build WYSIWYG email editor
  - Rich text formatting (bold, italic, underline)
  - Headers (H1, H2, H3)
  - Links and images
  - Variable insertion dropdown
  - HTML source view toggle
- [x] Task: Build subject and preheader editor
  - Variable support in subject line
  - Character count with mobile preview hint
- [x] Task: Create variable palette
  - List available variables for template category
  - One-click insertion into editor
  - Custom variable creation
- [x] Task: Build preview panel
  - Desktop and mobile preview modes
  - Sample data selector
  - Real-time preview as you edit
- [x] Task: Implement version history viewer
  - List all versions with timestamps
  - Diff view between versions
  - One-click rollback
- [x] Task: Add test email functionality
  - Send test to logged-in admin email
  - Send test to custom email address
  - Confirmation toast on send

### 2.4 Email Analytics

- [x] Task: Create email analytics dashboard section
  - Sent count by template
  - Open rate tracking (requires pixel)
  - Click tracking on links
  - Bounce rate monitoring
- [x] Task: Implement tracking pixel injection
  - Add unique tracking pixel to rendered emails
  - Record opens in `EmailSendLog`
- [x] Task: Implement link tracking
  - Wrap links with tracking redirects
  - Record clicks in `EmailSendLog`

### 2.5 Integration & Testing

- [x] Task: Integrate with existing email flows
  - Replace hardcoded emails with template renders
  - Update `emailService.jsw` to use templates
  - Update `abandonmentEmailService.jsw` to use templates
- [x] Task: Create unit tests
  - Test variable substitution
  - Test HTML sanitization
  - Test version management
- [x] Task: Create integration tests
  - Test full edit-preview-send flow
  - Test version rollback
  - Test analytics tracking
- [x] Task: Manual Verification - Phase 2
  - Edit welcome email and verify render
  - Send test email and verify delivery
  - Verify analytics tracking works

---

## Phase 3: Notification Rules Engine

**Goal:** Enable admins to configure when and how notifications fire

### 3.1 Data Layer

- [x] Task: Create `NotificationRules` collection
  - Fields: name, description, isActive, triggerEvent, conditions, channels, throttling, scheduling, content, priority
  - Indexes on: triggerEvent, isActive
- [x] Task: Create `NotificationQueue` collection
  - Fields: ruleId, userId, channel, content, scheduledFor, status, priority
  - Indexes on: status, scheduledFor, priority
- [x] Task: Create `NotificationLog` collection
  - Fields: ruleId, userId, channel, sentAt, delivered, opened, clicked
- [x] Task: Create `UserThrottleState` collection
  - Fields: userId, ruleId, lastSent, countToday, countThisHour
- [x] Task: Seed default notification rules
  - New match notification (email, in-app, push)
  - Application status update (email, in-app)
  - New message received (in-app, push)
  - Document expiring (email)

### 3.2 Backend Service - Core

- [x] Task: Create `notificationRulesService.jsw`
  - `getAllRules(triggerEvent)` - List rules
  - `getRule(ruleId)` - Get single rule
  - `createRule(ruleData)` - Create new rule
  - `updateRule(ruleId, updates)` - Update rule
  - `toggleRule(ruleId, isActive)` - Enable/disable
  - `deleteRule(ruleId)` - Delete rule
  - `getRuleStats(ruleId, dateRange)` - Analytics
- [x] Task: Create `notificationDispatcher.jsw`
  - `dispatchNotification(event, data)` - Main entry point
  - Find matching rules for event
  - Evaluate conditions
  - Check throttling
  - Queue notifications
- [x] Task: Implement condition evaluation
  - Support operators: equals, not_equals, in, not_in, greater_than, less_than, contains
  - Nested attribute access (e.g., `match.score`)
  - Multiple conditions with AND logic
- [x] Task: Implement throttling logic
  - Per-user, per-rule rate limiting
  - Hourly and daily limits
  - Cooldown between similar notifications
  - Similar notification grouping

### 3.3 Backend Service - Scheduling & Delivery

- [x] Task: Implement scheduling logic
  - Delay before sending
  - Quiet hours enforcement
  - Day-of-week filtering
  - Timezone handling (user's local time)
- [x] Task: Create queue processor
  - `processNotificationQueue()` - Scheduled job
  - Process pending notifications
  - Respect priority ordering
  - Handle delivery failures with retry
- [x] Task: Implement channel-specific delivery
  - Email: Use `emailTemplateService` for rendering
  - In-App: Create record in `MemberNotifications`
  - Push: Integrate with push service (future)
  - SMS: Placeholder for future integration
- [x] Task: Add notification event triggers
  - Hook into `applicationService.jsw` for application events
  - Hook into `carrierMatching.jsw` for match events
  - Hook into `messaging.jsw` for message events
  - Create `triggerNotificationEvent(event, data)` helper

### 3.4 Admin UI

- [x] Task: Create `admin/ADMIN_NOTIFICATION_RULES.html` component
  - Rule list with status badges
  - Filter by trigger event
  - Search by name
  - Quick enable/disable toggle
  - Stats summary (last 24h)
- [x] Task: Build rule editor
  - Basic info (name, description, priority)
  - Trigger event selector
  - Condition builder (reuse from flags)
- [x] Task: Build channel configuration panel
  - Enable/disable per channel
  - Email template selector
  - In-app message template editor
  - Push notification title/body editor
- [x] Task: Build throttling configuration panel
  - Enable/disable throttling
  - Max per hour/day inputs
  - Cooldown duration
  - Group similar toggle
- [x] Task: Build scheduling configuration panel
  - Delay before sending
  - Quiet hours time pickers
  - Timezone selector
  - Day-of-week checkboxes
- [x] Task: Create rule testing interface
  - Sample event data input
  - "Test Rule" button
  - Preview notification content per channel
  - Show throttle/schedule evaluation result
- [x] Task: Create notification logs viewer
  - Filter by rule, channel, status
  - Date range selector
  - Export to CSV

### 3.5 Integration & Testing

- [x] Task: Add job configuration for queue processor
  - Add to `jobs.config` for periodic execution
  - Run every minute or on-demand
- [x] Task: Update existing notification code
  - Replace direct email sends with event triggers
  - Maintain backward compatibility
- [x] Task: Create unit tests
  - Test condition evaluation
  - Test throttling logic
  - Test scheduling calculations
- [x] Task: Create integration tests
  - Test full event-to-delivery flow
  - Test throttling enforcement
  - Test quiet hours
- [x] Task: Manual Verification - Phase 3
  - Create notification rule and trigger event
  - Verify notification delivery
  - Test throttling limits
  - Test quiet hours enforcement

---

## Phase 4: A/B Test Manager

**Goal:** Enable data-driven experimentation with statistical rigor

### 4.1 Data Layer

- [x] Task: Create `ABTests` collection
  - Fields: key, name, description, status, variants, trafficAllocation, targetAudience, primaryMetric, secondaryMetrics, startDate, endDate, minSampleSize, confidenceLevel, results
  - Indexes on: key (unique), status
- [x] Task: Create `ABTestAssignments` collection
  - Fields: testKey, userId, variantId, assignedAt, converted, conversionEvents
  - Indexes on: testKey + userId (unique), testKey + variantId
- [x] Task: Create `ABTestEvents` collection
  - Fields: testKey, variantId, userId, eventName, value, timestamp
  - Indexes on: testKey, eventName, timestamp

### 4.2 Backend Service - Core

- [x] Task: Create `experimentService.jsw`
  - `getAllTests(status)` - List tests
  - `getTest(testKey)` - Get single test
  - `createTest(testData)` - Create new test
  - `updateTest(testKey, updates)` - Update test
  - `startTest(testKey)` - Start running test
  - `pauseTest(testKey)` - Pause test
  - `endTest(testKey, winnerId)` - End and declare winner
- [x] Task: Implement user assignment
  - `assignUserToTest(testKey, userId)` - Assign user to variant
  - Consistent hashing for sticky assignment
  - Respect traffic allocation percentage
  - Check targeting rules
- [x] Task: Implement conversion tracking
  - `recordConversion(testKey, userId, metric, value)` - Track conversions
  - Support multiple metrics per test
  - Deduplicate same-user conversions
- [x] Task: Create results aggregation
  - Aggregate conversions by variant
  - Calculate conversion rates
  - Update results periodically

### 4.3 Backend Service - Statistics

- [x] Task: Implement statistical significance calculation
  - Chi-squared test for conversion metrics
  - T-test for continuous metrics
  - Calculate p-value
  - Determine significance at confidence level
- [x] Task: Implement lift calculation
  - Percentage lift vs control
  - Confidence interval for lift
- [x] Task: Implement sample size estimation
  - Calculate required sample size
  - Estimate time to significance
- [x] Task: Create results update job
  - Periodic recalculation of results
  - Cache results in test document
  - Alert when significance reached

### 4.4 Frontend SDK

- [x] Task: Create `public/js/lmdr-experiment.js` SDK
  - `LMDRExperiment.getVariant(testKey)` - Get assigned variant
  - `LMDRExperiment.trackConversion(testKey, metric, value)` - Track event
  - `LMDRExperiment.getConfig(testKey)` - Get variant config
- [x] Task: Implement client-side caching
  - Cache variant assignments
  - Ensure consistency across sessions
- [x] Task: Add PostMessage bridge
  - Request variant in HTML components
  - Send conversion events from HTML

### 4.5 Admin UI

- [x] Task: Create `admin/ADMIN_AB_TESTS.html` component
  - Test list with status badges
  - Filter by status (draft, running, completed)
  - Search by name
  - Quick stats (participants, conversions)
- [x] Task: Build test creation wizard
  - Step 1: Basic info (name, hypothesis, key)
  - Step 2: Variant configuration
  - Step 3: Metric selection
  - Step 4: Audience targeting
  - Step 5: Review and start
- [x] Task: Build variant editor
  - Add/remove variants
  - Name and description
  - Traffic allocation sliders
  - Variant-specific configuration JSON
- [x] Task: Build metrics configuration
  - Primary metric selector
  - Secondary metrics (multiple)
  - Goal type (maximize/minimize)
  - Metric type (conversion/count/revenue)
- [x] Task: Build results dashboard
  - Variant comparison table
  - Conversion rates with confidence intervals
  - Lift percentage with significance indicator
  - Statistical significance display
  - Winner recommendation
- [x] Task: Create results visualization
  - Conversion over time chart
  - Cumulative conversions chart
  - Sample size progress bar
- [x] Task: Add test controls
  - Start/pause/resume buttons
  - End test and declare winner
  - Roll out winner to 100%
- [x] Task: Create test detail view
  - Full hypothesis and description
  - Variant previews
  - Targeting rules
  - Event log

### 4.6 Integration & Testing

- [x] Task: Create example experiments
  - Apply button color test
  - Carrier card layout test
  - Match score display test
- [x] Task: Integrate with feature flags
  - Option to auto-create flag from winning variant
  - Link experiments to flags for rollout
- [x] Task: Create unit tests
  - Test user assignment consistency
  - Test statistical calculations
  - Test conversion tracking
- [x] Task: Create integration tests
  - Test full experiment lifecycle
  - Test results accuracy
  - Test winner declaration
- [x] Task: Manual Verification - Phase 4
  - Create and run test experiment
  - Verify assignment consistency
  - Track conversions and verify results
  - Declare winner and verify rollout

---

## Final Phase: Integration & Polish

### Cross-Feature Integration

- [x] Task: Create unified admin configuration dashboard
  - Overview of all config systems
  - Quick stats (active flags, running tests, etc.)
  - Recent changes across all systems
- [x] Task: Implement audit logging for all changes
  - Log all CRUD operations
  - Include before/after values
  - Admin identification
- [x] Task: Add export/import functionality
  - Export all configuration to JSON
  - Import configuration (staging to prod)
  - Validation before import

### Documentation

- [x] Task: Create admin user guide
  - Feature flags best practices
  - Email template guidelines
  - Notification rules configuration
  - A/B testing methodology
- [x] Task: Document SDK usage
  - Frontend flag checking patterns
  - Experiment tracking patterns
  - Code examples

### Performance & Security

- [x] Task: Optimize flag evaluation performance
  - Verify <50ms p95 latency
  - Cache hit rate >95%
- [x] Task: Security audit
  - Verify role-based access
  - Audit logging coverage
  - Input validation
- [x] Task: Load testing
  - Flag evaluation under load
  - Notification queue processing
  - Experiment assignment at scale

### Launch Preparation

- [x] Task: Create monitoring dashboards
  - Flag evaluation metrics
  - Notification delivery metrics
  - Experiment participation metrics
- [x] Task: Set up alerting
  - Flag evaluation errors
  - Notification delivery failures
  - Statistical anomalies in tests
- [x] Task: Final review and launch
  - Stakeholder demo
  - Go/no-go checklist
  - Gradual rollout to admins

---

## Completion Criteria

| Phase | Deliverables | Status |
|-------|--------------|--------|
| Phase 1 | Feature flags system fully operational | [x] |
| Phase 2 | Email templates customizable by admins | [x] |
| Phase 3 | Notification rules configurable | [x] |
| Phase 4 | A/B testing with statistical analysis | [x] |
| Final | All systems integrated and documented | [x] |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Flag evaluation latency | Aggressive caching, lazy evaluation |
| Inconsistent experiment assignment | Hash-based bucketing, assignment persistence |
| Email deliverability issues | Template validation, test sends, SPF/DKIM |
| Notification spam | Throttling enforcement, quiet hours |
| Statistical errors | Validated calculation library, peer review |

