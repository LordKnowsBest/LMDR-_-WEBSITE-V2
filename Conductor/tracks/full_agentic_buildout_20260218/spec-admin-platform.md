# Spec: Full Agentic Buildout — Admin & Platform Tool Definitions

**Track:** full_agentic_buildout_20260218
**Section:** Admin + Platform
**Date:** 2026-02-18
**Platform:** LMDR / VelocityMatch — Wix Velo CDL truck driver recruiting

> This document specifies every admin and platform tool to be wrapped as an agent-callable function.
> Each tool is the atomic unit of agent action. The agent calls tools; humans approve high-risk ones.
> Backend services are Wix Velo `.jsw` files. Collections key into `configData.js` mapping to Airtable.

---

## Risk Level Reference

| Level | Meaning |
|---|---|
| `read` | Non-mutating. Safe to call freely. |
| `suggest` | Returns a recommendation; no side effects. |
| `execute_low` | Writes data, reversible, no approval gate. |
| `execute_high` | Irreversible or financially significant; requires human approval. |

---

## Group 1: Admin Business Ops

**Source Track:** admin_business_ops_20260120
**Backend Service:** adminBusinessService.jsw

---

### get_revenue_dashboard

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a full revenue snapshot including MRR, ARR, active subscriptions, churn rate, ARPU, and LTV. Used as the primary financial health check for admin agents.
- **Parameters:**
  - `period: string` — ISO month string (e.g. `"2026-02"`); defaults to current month
- **Backend Service:** adminBusinessService.jsw → `getRevenueSnapshot(period)`
- **Airtable Collection(s):** `revenueMetrics` → `v2_Revenue Metrics`
- **Approval Required:** No
- **Dependencies:** stripeService.jsw (live subscriber count pull)

---

### get_revenue_by_source

- **Role:** admin
- **Risk Level:** read
- **Description:** Breaks down revenue by acquisition source (organic, referral, outbound, partner). Returns count and MRR per source for attribution analysis.
- **Parameters:**
  - `period: string` — ISO month string
  - `breakdown: "source" | "tier" | "cohort"` — grouping dimension
- **Backend Service:** adminBusinessService.jsw → `getRevenueBySource(period, breakdown)`
- **Airtable Collection(s):** `revenueMetrics` → `v2_Revenue Metrics`, `carrierSubscriptions` → `v2_Carrier Subscriptions`
- **Approval Required:** No
- **Dependencies:** None

---

### get_mrr_trend

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns month-over-month MRR trend data suitable for chart rendering. Includes new MRR, expansion, contraction, and churn decomposition.
- **Parameters:**
  - `months: number` — number of months to return (default 12, max 24)
- **Backend Service:** adminBusinessService.jsw → `getMRRTrend(months)`
- **Airtable Collection(s):** `revenueMetrics` → `v2_Revenue Metrics`
- **Approval Required:** No
- **Dependencies:** None

---

### get_arpu

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns average revenue per user, segmented by plan tier (Pro, Enterprise) and by cohort signup month.
- **Parameters:**
  - `period: string` — ISO month string
  - `segment_by: "tier" | "cohort" | "region"` — segmentation axis
- **Backend Service:** adminBusinessService.jsw → `getARPU(period, segmentBy)`
- **Airtable Collection(s):** `revenueMetrics` → `v2_Revenue Metrics`
- **Approval Required:** No
- **Dependencies:** None

---

### get_revenue_forecast

- **Role:** admin
- **Risk Level:** suggest
- **Description:** Projects MRR for the next 3–12 months using current growth rate, churn rate, and pipeline data. Returns point estimate and confidence interval.
- **Parameters:**
  - `horizon_months: number` — forecast horizon (3, 6, or 12)
  - `include_pipeline: boolean` — include deals in progress (default false)
- **Backend Service:** adminBusinessService.jsw → `getRevenueForecast(horizonMonths, includePipeline)`
- **Airtable Collection(s):** `revenueMetrics` → `v2_Revenue Metrics`
- **Approval Required:** No
- **Dependencies:** None

---

### export_revenue_report

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Generates and returns a downloadable CSV or PDF revenue report for a given period. Report is stored to media and a download URL is returned.
- **Parameters:**
  - `period: string` — ISO month string
  - `format: "csv" | "pdf"` — output format
  - `include_sections: string[]` — e.g. `["mrr", "churn", "cohort", "by_tier"]`
- **Backend Service:** adminBusinessService.jsw → `exportRevenueReport(period, format, includeSections)`
- **Airtable Collection(s):** `revenueMetrics` → `v2_Revenue Metrics`
- **Approval Required:** No
- **Dependencies:** None

---

### get_billing_overview

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a paginated summary of all carrier billing statuses: active, past-due, paused, and canceled subscriptions. Includes next renewal dates and outstanding balances.
- **Parameters:**
  - `status_filter: "all" | "active" | "past_due" | "paused" | "canceled"` — filter by status
  - `page: number` — page number (default 1)
  - `page_size: number` — results per page (default 25)
- **Backend Service:** adminBusinessService.jsw → `getBillingOverview(statusFilter, page, pageSize)`
- **Airtable Collection(s):** `carrierSubscriptions` → `v2_Carrier Subscriptions`
- **Approval Required:** No
- **Dependencies:** stripeService.jsw

---

### create_invoice

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Creates a new draft invoice for a carrier. Supports placement fees, custom line items, and discounts. Returns the invoice ID and preview URL.
- **Parameters:**
  - `carrier_dot: string` — carrier DOT number
  - `line_items: Array<{ description: string, quantity: number, unit_price_cents: number }>` — invoice line items
  - `discount_cents: number` — optional discount amount in cents
  - `discount_reason: string` — reason for discount
  - `due_date: string` — ISO date string
  - `notes: string` — public notes on invoice
- **Backend Service:** adminBusinessService.jsw → `createInvoice(invoiceData)`
- **Airtable Collection(s):** `invoices` → `v2_Invoices`
- **Approval Required:** No
- **Dependencies:** None

---

### send_invoice

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Sends a draft invoice to the carrier contact email. Generates PDF, updates invoice status to `sent`, records sent timestamp.
- **Parameters:**
  - `invoice_id: string` — invoice record ID
- **Backend Service:** adminBusinessService.jsw → `sendInvoice(invoiceId)`
- **Airtable Collection(s):** `invoices` → `v2_Invoices`
- **Approval Required:** No
- **Dependencies:** email service

---

### get_invoice_status

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the current status and payment history for a specific invoice. Includes status, sent date, due date, paid date, and any payment references.
- **Parameters:**
  - `invoice_id: string` — invoice record ID
- **Backend Service:** adminBusinessService.jsw → `getInvoices({ id: invoiceId })`
- **Airtable Collection(s):** `invoices` → `v2_Invoices`
- **Approval Required:** No
- **Dependencies:** None

---

### mark_invoice_paid

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Records a manual payment against an invoice (check, wire, etc.). Updates invoice status to `paid` and records payment reference.
- **Parameters:**
  - `invoice_id: string` — invoice record ID
  - `payment_method: "check" | "wire" | "stripe" | "other"` — how payment was made
  - `payment_reference: string` — check number, transaction ID, or note
  - `paid_date: string` — ISO date of payment receipt
- **Backend Service:** adminBusinessService.jsw → `recordInvoicePayment(invoiceId, paymentDetails)`
- **Airtable Collection(s):** `invoices` → `v2_Invoices`
- **Approval Required:** No
- **Dependencies:** None

---

### get_overdue_invoices

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns all invoices past their due date that remain unpaid. Sorted by days overdue descending. Includes carrier contact info for follow-up.
- **Parameters:**
  - `min_days_overdue: number` — filter to invoices overdue by at least N days (default 1)
- **Backend Service:** adminBusinessService.jsw → `getInvoices({ status: "overdue" })`
- **Airtable Collection(s):** `invoices` → `v2_Invoices`
- **Approval Required:** No
- **Dependencies:** None

---

### calculate_commissions

- **Role:** admin
- **Risk Level:** suggest
- **Description:** Calculates pending commission amounts for all sales reps for a given period using the active commission rules engine. Returns a preview without writing records.
- **Parameters:**
  - `period: string` — ISO month string
- **Backend Service:** adminBusinessService.jsw → `getCommissionSummary(period)`
- **Airtable Collection(s):** `commissions` → `v2_Commissions`, `commissionRules` → `v2_Commission Rules`
- **Approval Required:** No
- **Dependencies:** None

---

### get_commission_report

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the full commission report for a period: leaderboard, per-rep breakdown, deal-level detail, and payout status.
- **Parameters:**
  - `period: string` — ISO month string
  - `rep_id: string` — optional; filter to a specific sales rep
- **Backend Service:** adminBusinessService.jsw → `getSalesLeaderboard(period)`, `getRepCommissions(repId, { period })`
- **Airtable Collection(s):** `commissions` → `v2_Commissions`, `salesReps` → `v2_Sales Reps`
- **Approval Required:** No
- **Dependencies:** None

---

### approve_commission

- **Role:** admin
- **Risk Level:** execute_high
- **Description:** Approves a pending commission for payout. Marks the commission record as approved and makes it eligible for the next payout run.
- **Parameters:**
  - `commission_id: string` — commission record ID
  - `admin_id: string` — ID of approving admin
- **Backend Service:** adminBusinessService.jsw → `approveCommission(commissionId, adminId)`
- **Airtable Collection(s):** `commissions` → `v2_Commissions`
- **Approval Required:** Yes
- **Dependencies:** None

---

### get_commission_rules

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns all active commission rules including trigger event, rate, conditions, and priority order.
- **Parameters:** None
- **Backend Service:** adminBusinessService.jsw → `getCommissionRules()`
- **Airtable Collection(s):** `commissionRules` → `v2_Commission Rules`
- **Approval Required:** No
- **Dependencies:** None

---

### update_commission_rule

- **Role:** admin
- **Risk Level:** execute_high
- **Description:** Creates or updates a commission rule. Changes take effect immediately and affect all future commissions. Does not retroactively change existing records.
- **Parameters:**
  - `rule_id: string` — existing rule ID (omit to create new)
  - `name: string` — rule name
  - `trigger: string` — event that fires the rule (e.g. `"subscription.new"`)
  - `rate: number` — commission rate as decimal (e.g. `0.12` for 12%)
  - `conditions: object` — optional conditions `{ plan: "pro", min_value: 1000 }`
  - `is_active: boolean` — whether rule is enabled
- **Backend Service:** adminBusinessService.jsw → `saveCommissionRule(rule)`
- **Airtable Collection(s):** `commissionRules` → `v2_Commission Rules`
- **Approval Required:** Yes
- **Dependencies:** None

---

## Group 2: Admin Platform Config

**Source Track:** admin_platform_config_20260120
**Backend Service:** platformConfigService.jsw

---

### get_feature_flags

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns all feature flags with their current state, rollout percentage, target segments, and last-modified timestamp.
- **Parameters:**
  - `environment: "production" | "staging"` — which environment to query
  - `status_filter: "all" | "enabled" | "disabled"` — filter by state
- **Backend Service:** platformConfigService.jsw → `getFeatureFlags(environment, statusFilter)`
- **Airtable Collection(s):** `featureFlags` → `v2_Feature Flags`
- **Approval Required:** No
- **Dependencies:** None

---

### toggle_feature_flag

- **Role:** admin
- **Risk Level:** execute_high
- **Description:** Enables or disables a feature flag. Writes the change and records an audit entry with the admin ID and reason.
- **Parameters:**
  - `flag_key: string` — feature flag identifier
  - `enabled: boolean` — target state
  - `admin_id: string` — admin making the change
  - `reason: string` — reason for the toggle
- **Backend Service:** platformConfigService.jsw → `toggleFeatureFlag(flagKey, enabled, adminId, reason)`
- **Airtable Collection(s):** `featureFlags` → `v2_Feature Flags`, `flagAuditLog` → `v2_Flag Audit Log`
- **Approval Required:** Yes
- **Dependencies:** None

---

### create_feature_flag

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Creates a new feature flag in disabled state. Flag is immediately available for use but not active until toggled.
- **Parameters:**
  - `flag_key: string` — unique identifier (snake_case)
  - `name: string` — human-readable name
  - `description: string` — what the flag controls
  - `default_value: boolean` — initial state
  - `target_roles: string[]` — e.g. `["driver", "carrier", "recruiter"]`
- **Backend Service:** platformConfigService.jsw → `createFeatureFlag(flagData)`
- **Airtable Collection(s):** `featureFlags` → `v2_Feature Flags`
- **Approval Required:** No
- **Dependencies:** None

---

### update_feature_flag_rules

- **Role:** admin
- **Risk Level:** execute_high
- **Description:** Updates rollout rules for a flag: percentage rollout, segment targeting, and allowlist/denylist. Changes affect active flag behavior immediately.
- **Parameters:**
  - `flag_key: string` — flag identifier
  - `rollout_percentage: number` — 0–100 percentage of eligible users
  - `target_segments: string[]` — user segment identifiers
  - `allowlist: string[]` — specific user IDs always enabled
  - `denylist: string[]` — specific user IDs always disabled
- **Backend Service:** platformConfigService.jsw → `updateFeatureFlagRules(flagKey, rules)`
- **Airtable Collection(s):** `featureFlags` → `v2_Feature Flags`
- **Approval Required:** Yes
- **Dependencies:** None

---

### get_flag_audit_log

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the history of all changes to a feature flag: who changed it, when, what the previous and new values were, and the stated reason.
- **Parameters:**
  - `flag_key: string` — flag identifier
  - `limit: number` — max records to return (default 50)
- **Backend Service:** platformConfigService.jsw → `getFlagAuditLog(flagKey, limit)`
- **Airtable Collection(s):** `flagAuditLog` → `v2_Flag Audit Log`
- **Approval Required:** No
- **Dependencies:** None

---

### get_flag_impact

- **Role:** admin
- **Risk Level:** read
- **Description:** Estimates the number of users and sessions affected by a flag's current state. Returns active user count, affected session percentage, and related feature adoption metrics.
- **Parameters:**
  - `flag_key: string` — flag identifier
- **Backend Service:** platformConfigService.jsw → `getFlagImpact(flagKey)`
- **Airtable Collection(s):** `featureFlags` → `v2_Feature Flags`, `featureAdoptionLogs` → `v2_Feature Adoption Logs`
- **Approval Required:** No
- **Dependencies:** featureAdoptionService.jsw

---

### create_ab_test

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Creates a new A/B test with defined variants, traffic split, and success metrics. Test starts paused until explicitly launched.
- **Parameters:**
  - `name: string` — test name
  - `hypothesis: string` — what is being tested
  - `variants: Array<{ key: string, name: string, traffic_pct: number }>` — variant definitions summing to 100
  - `success_metric: string` — primary metric to measure
  - `target_roles: string[]` — roles included in the test
  - `duration_days: number` — planned test duration
- **Backend Service:** platformConfigService.jsw → `createABTest(testData)`
- **Airtable Collection(s):** `abTests` → `v2_AB Tests`
- **Approval Required:** No
- **Dependencies:** None

---

### get_ab_tests

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns all A/B tests with their status, variant split, participant count, and days running.
- **Parameters:**
  - `status_filter: "all" | "running" | "paused" | "concluded"` — filter by state
- **Backend Service:** platformConfigService.jsw → `getABTests(statusFilter)`
- **Airtable Collection(s):** `abTests` → `v2_AB Tests`
- **Approval Required:** No
- **Dependencies:** None

---

### get_ab_test_results

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns statistical results for a running or concluded A/B test: conversion rates per variant, confidence interval, and statistical significance.
- **Parameters:**
  - `test_id: string` — A/B test record ID
- **Backend Service:** platformConfigService.jsw → `getABTestResults(testId)`
- **Airtable Collection(s):** `abTests` → `v2_AB Tests`, `featureAdoptionLogs` → `v2_Feature Adoption Logs`
- **Approval Required:** No
- **Dependencies:** featureAdoptionService.jsw

---

### conclude_ab_test

- **Role:** admin
- **Risk Level:** execute_high
- **Description:** Marks an A/B test as concluded, records the winning variant, and optionally applies the winner to the production flag. Requires admin confirmation.
- **Parameters:**
  - `test_id: string` — A/B test record ID
  - `winning_variant_key: string` — variant to promote
  - `apply_to_flag: boolean` — whether to update the production feature flag
- **Backend Service:** platformConfigService.jsw → `concludeABTest(testId, winningVariantKey, applyToFlag)`
- **Airtable Collection(s):** `abTests` → `v2_AB Tests`, `featureFlags` → `v2_Feature Flags`
- **Approval Required:** Yes
- **Dependencies:** None

---

### get_winning_variant

- **Role:** admin
- **Risk Level:** suggest
- **Description:** Analyzes current A/B test data and suggests the statistically superior variant based on the primary success metric. Does not conclude the test.
- **Parameters:**
  - `test_id: string` — A/B test record ID
- **Backend Service:** platformConfigService.jsw → `getWinningVariant(testId)`
- **Airtable Collection(s):** `abTests` → `v2_AB Tests`
- **Approval Required:** No
- **Dependencies:** None

---

### get_email_templates

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns all email templates with name, category (transactional, marketing, notification), status, and last modified date.
- **Parameters:**
  - `category: "all" | "transactional" | "marketing" | "notification"` — filter by category
- **Backend Service:** platformConfigService.jsw → `getEmailTemplates(category)`
- **Airtable Collection(s):** `emailTemplates` → `v2_Email Templates`
- **Approval Required:** No
- **Dependencies:** None

---

### create_email_template

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Creates a new email template with subject, HTML body, plain text fallback, and merge variable definitions. Template is saved as a draft.
- **Parameters:**
  - `name: string` — template identifier
  - `category: string` — template category
  - `subject: string` — email subject line (supports merge vars)
  - `html_body: string` — HTML content
  - `text_body: string` — plain text fallback
  - `merge_variables: string[]` — e.g. `["{{firstName}}", "{{carrierName}}"]`
- **Backend Service:** platformConfigService.jsw → `createEmailTemplate(templateData)`
- **Airtable Collection(s):** `emailTemplates` → `v2_Email Templates`
- **Approval Required:** No
- **Dependencies:** None

---

### update_email_template

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Updates an existing email template. Creates a version history record before saving changes. Active template is not changed until explicitly activated.
- **Parameters:**
  - `template_id: string` — template record ID
  - `subject: string` — updated subject line
  - `html_body: string` — updated HTML body
  - `text_body: string` — updated plain text
  - `change_notes: string` — description of what changed
- **Backend Service:** platformConfigService.jsw → `updateEmailTemplate(templateId, updates)`
- **Airtable Collection(s):** `emailTemplates` → `v2_Email Templates`
- **Approval Required:** No
- **Dependencies:** None

---

### preview_email_template

- **Role:** admin
- **Risk Level:** read
- **Description:** Renders an email template with sample merge variable values and returns the rendered HTML and subject. Used to validate templates before sending.
- **Parameters:**
  - `template_id: string` — template record ID
  - `sample_data: object` — sample merge variable values e.g. `{ firstName: "John", carrierName: "ABC Trucking" }`
- **Backend Service:** platformConfigService.jsw → `previewEmailTemplate(templateId, sampleData)`
- **Airtable Collection(s):** `emailTemplates` → `v2_Email Templates`
- **Approval Required:** No
- **Dependencies:** None

---

### send_test_email

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Sends a test render of an email template to a specified recipient address. Uses sample data. Does not count against email quotas.
- **Parameters:**
  - `template_id: string` — template record ID
  - `recipient_email: string` — email address to receive the test
  - `sample_data: object` — merge variable values for the test send
- **Backend Service:** platformConfigService.jsw → `sendTestEmail(templateId, recipientEmail, sampleData)`
- **Airtable Collection(s):** `emailTemplates` → `v2_Email Templates`
- **Approval Required:** No
- **Dependencies:** email service

---

### get_template_performance

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns open rate, click rate, unsubscribe rate, and delivery stats for an email template over a given period.
- **Parameters:**
  - `template_id: string` — template record ID
  - `period_days: number` — lookback window in days (default 30)
- **Backend Service:** platformConfigService.jsw → `getTemplatePerformance(templateId, periodDays)`
- **Airtable Collection(s):** `emailTemplates` → `v2_Email Templates`
- **Approval Required:** No
- **Dependencies:** None

---

### get_notification_rules

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns all notification rules defining when and how platform notifications are triggered: event trigger, channels (email, in-app, push), delay, and conditions.
- **Parameters:**
  - `role_filter: "all" | "driver" | "carrier" | "recruiter" | "admin"` — filter by target role
- **Backend Service:** platformConfigService.jsw → `getNotificationRules(roleFilter)`
- **Airtable Collection(s):** `notificationRules` → `v2_Notification Rules`
- **Approval Required:** No
- **Dependencies:** None

---

### create_notification_rule

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Creates a new notification rule that fires on a defined platform event and sends to a target role via one or more channels.
- **Parameters:**
  - `name: string` — rule name
  - `trigger_event: string` — platform event key (e.g. `"match.new"`)
  - `target_role: string` — who receives the notification
  - `channels: string[]` — `["email", "in_app", "push"]`
  - `delay_minutes: number` — send delay after event (default 0)
  - `conditions: object` — optional conditions for the rule to fire
  - `template_id: string` — email template ID if channel includes email
- **Backend Service:** platformConfigService.jsw → `createNotificationRule(ruleData)`
- **Airtable Collection(s):** `notificationRules` → `v2_Notification Rules`
- **Approval Required:** No
- **Dependencies:** emailTemplates

---

### update_notification_rule

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Updates an existing notification rule. Changes take effect on the next event trigger for that rule.
- **Parameters:**
  - `rule_id: string` — rule record ID
  - `updates: object` — partial rule fields to update
- **Backend Service:** platformConfigService.jsw → `updateNotificationRule(ruleId, updates)`
- **Airtable Collection(s):** `notificationRules` → `v2_Notification Rules`
- **Approval Required:** No
- **Dependencies:** None

---

### toggle_notification_rule

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Enables or disables a notification rule without deleting it. Disabled rules are silently skipped when their trigger event fires.
- **Parameters:**
  - `rule_id: string` — rule record ID
  - `enabled: boolean` — target state
- **Backend Service:** platformConfigService.jsw → `toggleNotificationRule(ruleId, enabled)`
- **Airtable Collection(s):** `notificationRules` → `v2_Notification Rules`
- **Approval Required:** No
- **Dependencies:** None

---

### get_notification_analytics

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns delivery and engagement metrics for notifications grouped by rule: sent count, delivered, opened, clicked, and failed.
- **Parameters:**
  - `rule_id: string` — optional; omit to get aggregate across all rules
  - `period_days: number` — lookback in days (default 30)
- **Backend Service:** platformConfigService.jsw → `getNotificationAnalytics(ruleId, periodDays)`
- **Airtable Collection(s):** `notificationRules` → `v2_Notification Rules`
- **Approval Required:** No
- **Dependencies:** None

---

## Group 3: Admin Portal

**Source Track:** admin_portal_20251224
**Backend Service:** adminService.jsw

---

### get_admin_dashboard

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the full admin dashboard data bundle: KPI cards, recent activity feed, alert summary, system health status, and queue depths.
- **Parameters:**
  - `refresh: boolean` — bypass cache and force fresh pull (default false)
- **Backend Service:** adminService.jsw → `getDashboardMetrics()`
- **Airtable Collection(s):** `adminAuditLog` → `v2_Admin Audit Log`, `systemAlerts` → `v2_System Alerts`
- **Approval Required:** No
- **Dependencies:** observabilityService.jsw, featureAdoptionService.jsw

---

### get_system_health

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns operational health across all platform services: Database, AI Router, Enrichment Pipeline, FMCSA API, Stripe, and Email. Each service reports status and latency.
- **Parameters:** None
- **Backend Service:** adminService.jsw → `getSystemHealth()` → delegates to observabilityService.jsw
- **Airtable Collection(s):** `systemAlerts` → `v2_System Alerts`
- **Approval Required:** No
- **Dependencies:** observabilityService.jsw

---

### get_key_metrics

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the four headline KPI cards: active drivers (7d), matches today, pending reviews, and AI enrichment queue depth.
- **Parameters:**
  - `as_of: string` — optional ISO datetime; defaults to now
- **Backend Service:** adminService.jsw → `getDashboardMetrics()`
- **Airtable Collection(s):** `driverProfiles` → `v2_Driver Profiles`, `matchEvents` → `v2_Match Events`
- **Approval Required:** No
- **Dependencies:** None

---

### get_alert_summary

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns all active system alerts grouped by severity (critical, warning, info) with message, category, and time since alert was created.
- **Parameters:**
  - `severity: "all" | "critical" | "warning" | "info"` — filter by severity
  - `resolved: boolean` — include resolved alerts (default false)
- **Backend Service:** adminService.jsw → `getSystemAlerts(severity, resolved)`
- **Airtable Collection(s):** `systemAlerts` → `v2_System Alerts`
- **Approval Required:** No
- **Dependencies:** None

---

### get_recent_activity

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a chronological activity feed of notable platform events: new registrations, high-value matches, flagged content, and admin actions.
- **Parameters:**
  - `limit: number` — number of events to return (default 20)
  - `event_types: string[]` — optional filter to specific event types
- **Backend Service:** adminService.jsw → `getRecentActivity(limit, eventTypes)`
- **Airtable Collection(s):** `adminAuditLog` → `v2_Admin Audit Log`
- **Approval Required:** No
- **Dependencies:** None

---

### get_users

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a paginated, filterable list of platform users (drivers, carriers, recruiters, or admins) with status, join date, and last activity.
- **Parameters:**
  - `role: "driver" | "carrier" | "recruiter" | "admin"` — user type to query
  - `status_filter: "all" | "active" | "suspended" | "pending"` — status filter
  - `search: string` — name or email search string
  - `page: number` — page number (default 1)
  - `page_size: number` — results per page (default 25)
- **Backend Service:** adminService.jsw → `getDriversList(filters, pagination)` or `getCarriersList(filters, pagination)`
- **Airtable Collection(s):** `driverProfiles` → `v2_Driver Profiles`, `carrierProfiles` → `v2_Carrier Profiles`
- **Approval Required:** No
- **Dependencies:** None

---

### get_user_detail

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the full profile, application history, documents, and activity log for a specific user. Role-appropriate fields are returned based on user type.
- **Parameters:**
  - `user_id: string` — user record ID
  - `role: "driver" | "carrier" | "recruiter"` — user type
- **Backend Service:** adminService.jsw → `getDriverDetail(userId)` or `getCarrierDetail(carrierId)`
- **Airtable Collection(s):** `driverProfiles` → `v2_Driver Profiles`, `carrierProfiles` → `v2_Carrier Profiles`
- **Approval Required:** No
- **Dependencies:** None

---

### update_user_role

- **Role:** admin
- **Risk Level:** execute_high
- **Description:** Changes the platform role or admin permission level for a user. Only super admins can grant admin roles.
- **Parameters:**
  - `user_id: string` — user record ID
  - `new_role: string` — target role or permission level
  - `reason: string` — reason for the change
- **Backend Service:** adminService.jsw → `updateAdminRole(userId, newRole, reason)`
- **Airtable Collection(s):** `adminUsers` → Wix `AdminUsers` collection
- **Approval Required:** Yes
- **Dependencies:** None

---

### suspend_user

- **Role:** admin
- **Risk Level:** execute_high
- **Description:** Suspends a user account, preventing login and removing their active listings. Records the reason and suspending admin ID to the audit log.
- **Parameters:**
  - `user_id: string` — user record ID
  - `role: "driver" | "carrier" | "recruiter"` — user type
  - `reason: string` — suspension reason
  - `notify_user: boolean` — whether to send suspension notification email
- **Backend Service:** adminService.jsw → `updateDriverStatus(userId, "suspended", reason)`
- **Airtable Collection(s):** `driverProfiles` → `v2_Driver Profiles`, `carrierProfiles` → `v2_Carrier Profiles`
- **Approval Required:** Yes
- **Dependencies:** None

---

### reactivate_user

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Reactivates a previously suspended user account and restores access. Sends reactivation notification if requested.
- **Parameters:**
  - `user_id: string` — user record ID
  - `role: "driver" | "carrier" | "recruiter"` — user type
  - `notify_user: boolean` — whether to send reactivation email
- **Backend Service:** adminService.jsw → `updateDriverStatus(userId, "active", "reactivated")`
- **Airtable Collection(s):** `driverProfiles` → `v2_Driver Profiles`, `carrierProfiles` → `v2_Carrier Profiles`
- **Approval Required:** No
- **Dependencies:** None

---

### get_user_activity_log

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the action history for a specific user: logins, profile changes, applications, matches, and any admin actions taken against them.
- **Parameters:**
  - `user_id: string` — user record ID
  - `limit: number` — max events to return (default 50)
- **Backend Service:** adminService.jsw → `getUserActivityLog(userId, limit)`
- **Airtable Collection(s):** `adminAuditLog` → `v2_Admin Audit Log`
- **Approval Required:** No
- **Dependencies:** None

---

### impersonate_user

- **Role:** admin
- **Risk Level:** execute_high
- **Description:** Generates a temporary impersonation token allowing an admin to view the platform as a specific user. Token expires after 30 minutes. All actions under impersonation are audit-logged.
- **Parameters:**
  - `user_id: string` — user to impersonate
  - `reason: string` — reason for impersonation (required)
- **Backend Service:** adminService.jsw → `createImpersonationSession(userId, reason)`
- **Airtable Collection(s):** `adminAuditLog` → `v2_Admin Audit Log`
- **Approval Required:** Yes
- **Dependencies:** None

---

### get_moderation_queue

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns pending content items requiring human review: driver reviews, job postings, flagged content, and document verification requests.
- **Parameters:**
  - `type: "all" | "reviews" | "job_postings" | "flagged" | "documents"` — content type filter
  - `page: number` — page number (default 1)
- **Backend Service:** adminService.jsw → `getModerationQueue(type)`
- **Airtable Collection(s):** `driverReviews` → `v2_Driver Reviews`, `jobPostings` → `v2_Job Postings`
- **Approval Required:** No
- **Dependencies:** None

---

### approve_content

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Approves a content item in the moderation queue, making it publicly visible. Records the approving admin and timestamp.
- **Parameters:**
  - `content_id: string` — content record ID
  - `content_type: "review" | "job_posting" | "document"` — type of content
- **Backend Service:** adminService.jsw → `approveContent(contentId, contentType)`
- **Airtable Collection(s):** `driverReviews` → `v2_Driver Reviews`, `jobPostings` → `v2_Job Postings`
- **Approval Required:** No
- **Dependencies:** None

---

### reject_content

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Rejects a content item, preventing it from appearing publicly. Optionally notifies the submitter with the rejection reason.
- **Parameters:**
  - `content_id: string` — content record ID
  - `content_type: "review" | "job_posting" | "document"` — content type
  - `reason: string` — rejection reason sent to submitter
  - `notify_submitter: boolean` — whether to send notification
- **Backend Service:** adminService.jsw → `rejectContent(contentId, contentType, reason)`
- **Airtable Collection(s):** `driverReviews` → `v2_Driver Reviews`
- **Approval Required:** No
- **Dependencies:** None

---

### flag_content

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Flags a content item for escalated review without immediately approving or rejecting. Adds a priority tag and reason to the moderation queue.
- **Parameters:**
  - `content_id: string` — content record ID
  - `content_type: string` — type of content
  - `flag_reason: string` — reason for escalation
- **Backend Service:** adminService.jsw → `flagContent(contentId, contentType, flagReason)`
- **Airtable Collection(s):** `driverReviews` → `v2_Driver Reviews`
- **Approval Required:** No
- **Dependencies:** None

---

### get_moderation_history

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a log of all past moderation decisions with admin, action, and reason. Filterable by admin, content type, and date range.
- **Parameters:**
  - `admin_id: string` — optional; filter to specific admin
  - `content_type: string` — optional content type filter
  - `date_from: string` — ISO date start
  - `date_to: string` — ISO date end
  - `limit: number` — max records (default 100)
- **Backend Service:** adminService.jsw → `getModerationHistory(filters)`
- **Airtable Collection(s):** `adminAuditLog` → `v2_Admin Audit Log`
- **Approval Required:** No
- **Dependencies:** None

---

### update_moderation_rules

- **Role:** admin
- **Risk Level:** execute_high
- **Description:** Updates the auto-moderation ruleset: keyword blocklist, PII patterns, sentiment thresholds, and auto-approval conditions.
- **Parameters:**
  - `blocklist_keywords: string[]` — words that trigger auto-rejection
  - `auto_approve_conditions: object` — conditions for auto-approval
  - `pii_patterns: string[]` — regex patterns for PII detection
  - `sentiment_reject_threshold: number` — score below which content is auto-flagged
- **Backend Service:** adminService.jsw → `updateModerationRules(rules)`
- **Airtable Collection(s):** `moderationRules` → `v2_Moderation Rules`
- **Approval Required:** Yes
- **Dependencies:** None

---

### get_ai_usage_summary

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns today's and month-to-date AI API usage across all providers (Claude, Perplexity, FMCSA): call counts, token usage, cost, and error rates.
- **Parameters:**
  - `period: "today" | "week" | "month"` — reporting period
- **Backend Service:** aiRouterService.jsw → `getProviderCostMetrics()`
- **Airtable Collection(s):** `aiProviderCosts` → `v2_AI Provider Costs`
- **Approval Required:** No
- **Dependencies:** aiRouterService.jsw

---

### get_ai_costs

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a cost breakdown by AI provider and function type. Includes cost per call, total spend, and projected monthly spend at current rate.
- **Parameters:**
  - `period: string` — ISO month string
  - `group_by: "provider" | "function" | "role"` — grouping dimension
- **Backend Service:** aiRouterService.jsw → `getCostSavingsReport()`
- **Airtable Collection(s):** `aiProviderCosts` → `v2_AI Provider Costs`
- **Approval Required:** No
- **Dependencies:** aiRouterService.jsw

---

### get_ai_performance

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns quality and latency metrics for AI operations: p50/p95/p99 latency, quality scores by provider, and function-level error rates.
- **Parameters:**
  - `provider: "claude" | "perplexity" | "all"` — filter by provider
  - `period_days: number` — lookback window (default 7)
- **Backend Service:** aiRouterService.jsw → `calculateQualityScore()`
- **Airtable Collection(s):** `aiProviderCosts` → `v2_AI Provider Costs`
- **Approval Required:** No
- **Dependencies:** aiRouterService.jsw

---

### get_provider_status

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns real-time availability status for each AI provider: up, degraded, or down, with last successful call timestamp.
- **Parameters:** None
- **Backend Service:** aiRouterService.jsw → `selectOptimalProvider()`
- **Airtable Collection(s):** `aiProviderCosts` → `v2_AI Provider Costs`
- **Approval Required:** No
- **Dependencies:** aiRouterService.jsw

---

### update_ai_config

- **Role:** admin
- **Risk Level:** execute_high
- **Description:** Updates the AI cost optimizer configuration: provider preference order, quality thresholds, cost ceilings, and fallback strategy.
- **Parameters:**
  - `preferred_provider: string` — primary provider
  - `cost_mode: "optimize" | "quality" | "balanced"` — optimization mode
  - `max_cost_per_call_cents: number` — hard ceiling per API call
  - `fallback_provider: string` — provider to use when primary fails
- **Backend Service:** aiRouterService.jsw → `updateCostOptimizerConfig(config)`
- **Airtable Collection(s):** `costOptimizerConfig` → `v2_Cost Optimizer Config`
- **Approval Required:** Yes
- **Dependencies:** aiRouterService.jsw

---

### get_ai_error_log

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns recent AI API errors with provider, function, error type, error message, and whether a fallback was triggered.
- **Parameters:**
  - `provider: string` — optional provider filter
  - `limit: number` — max records (default 50)
  - `since: string` — ISO datetime to query from
- **Backend Service:** aiRouterService.jsw → `getAIErrorLog(provider, limit, since)`
- **Airtable Collection(s):** `aiProviderCosts` → `v2_AI Provider Costs`
- **Approval Required:** No
- **Dependencies:** aiRouterService.jsw

---

### get_compliance_dashboard

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the compliance overview: FMCSA alert counts, DQF file status summary, data deletion request queue, PII audit stats, and platform compliance score.
- **Parameters:** None
- **Backend Service:** adminService.jsw → `getComplianceDashboard()`
- **Airtable Collection(s):** `complianceReports` → `v2_Compliance Reports`, `adminAuditLog` → `v2_Admin Audit Log`
- **Approval Required:** No
- **Dependencies:** admin_audit_service.jsw

---

### get_audit_log

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the platform-wide admin audit log with filtering by admin, action type, target entity, and date range. All admin mutations are captured here.
- **Parameters:**
  - `admin_id: string` — optional; filter to specific admin
  - `action_type: string` — optional action type filter
  - `target_type: string` — optional entity type (driver, carrier, flag, etc.)
  - `date_from: string` — ISO date
  - `date_to: string` — ISO date
  - `page: number` — page number (default 1)
- **Backend Service:** adminService.jsw → `getAuditLog(filters, pagination)`
- **Airtable Collection(s):** `adminAuditLog` → `v2_Admin Audit Log`
- **Approval Required:** No
- **Dependencies:** None

---

### export_audit_log

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Exports audit log records matching the given filters to a CSV file. Returns a download URL. Used for compliance reporting.
- **Parameters:**
  - `date_from: string` — ISO date
  - `date_to: string` — ISO date
  - `admin_id: string` — optional filter
  - `action_type: string` — optional filter
- **Backend Service:** admin_audit_service.jsw → `generateComplianceReport(filters)`
- **Airtable Collection(s):** `adminAuditLog` → `v2_Admin Audit Log`, `complianceReports` → `v2_Compliance Reports`
- **Approval Required:** No
- **Dependencies:** admin_audit_service.jsw

---

### get_compliance_score

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the platform's composite compliance score (0–100) based on audit coverage, open violations, pending DQF files, and data privacy queue depth.
- **Parameters:** None
- **Backend Service:** admin_audit_service.jsw → `getComplianceDashboard()`
- **Airtable Collection(s):** `complianceReports` → `v2_Compliance Reports`
- **Approval Required:** No
- **Dependencies:** admin_audit_service.jsw

---

### generate_compliance_report

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Generates a full compliance report for a specified period and report type. Report is persisted to Airtable and a download URL returned.
- **Parameters:**
  - `report_type: string` — e.g. `"dqf_audit"`, `"data_privacy"`, `"fmcsa_alerts"`, `"admin_actions"`
  - `period_start: string` — ISO date
  - `period_end: string` — ISO date
  - `format: "pdf" | "csv"` — output format
- **Backend Service:** admin_audit_service.jsw → `generateComplianceReport(type, period, format)`
- **Airtable Collection(s):** `complianceReports` → `v2_Compliance Reports`
- **Approval Required:** No
- **Dependencies:** admin_audit_service.jsw

---

## Group 4: Admin Support Ops

**Source Track:** admin_support_ops_20260120
**Backend Service:** supportService.jsw

---

### create_ticket

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Creates a new support ticket on behalf of a user or from an admin-initiated issue. Assigns priority based on severity and user tier.
- **Parameters:**
  - `subject: string` — ticket subject
  - `description: string` — full issue description
  - `user_id: string` — affected user's ID
  - `user_role: string` — affected user's role
  - `priority: "low" | "medium" | "high" | "critical"` — ticket priority
  - `category: string` — issue category
- **Backend Service:** supportService.jsw → `createTicket(ticketData)`
- **Airtable Collection(s):** `supportTickets` → `v2_Support Tickets`
- **Approval Required:** No
- **Dependencies:** None

---

### get_tickets

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a paginated list of support tickets with filters for status, priority, category, and assignee.
- **Parameters:**
  - `status_filter: "all" | "open" | "in_progress" | "resolved" | "closed"` — status filter
  - `priority_filter: "all" | "critical" | "high" | "medium" | "low"` — priority filter
  - `assignee_id: string` — optional; filter to specific agent
  - `page: number` — page number
- **Backend Service:** supportService.jsw → `getTickets(filters, pagination)`
- **Airtable Collection(s):** `supportTickets` → `v2_Support Tickets`
- **Approval Required:** No
- **Dependencies:** None

---

### get_ticket_detail

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns full details for a ticket including description, comment thread, assignee history, SLA status, and related user info.
- **Parameters:**
  - `ticket_id: string` — ticket record ID
- **Backend Service:** supportService.jsw → `getTicketDetail(ticketId)`
- **Airtable Collection(s):** `supportTickets` → `v2_Support Tickets`
- **Approval Required:** No
- **Dependencies:** None

---

### update_ticket_status

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Updates a ticket's status and optionally adds a comment explaining the status change.
- **Parameters:**
  - `ticket_id: string` — ticket record ID
  - `new_status: "open" | "in_progress" | "resolved" | "closed"` — target status
  - `comment: string` — optional status change note
- **Backend Service:** supportService.jsw → `updateTicketStatus(ticketId, newStatus, comment)`
- **Airtable Collection(s):** `supportTickets` → `v2_Support Tickets`
- **Approval Required:** No
- **Dependencies:** None

---

### assign_ticket

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Assigns a ticket to a support agent. Notifies the agent via in-app notification. Records the assignment in the ticket thread.
- **Parameters:**
  - `ticket_id: string` — ticket record ID
  - `agent_id: string` — admin/agent to assign to
- **Backend Service:** supportService.jsw → `assignTicket(ticketId, agentId)`
- **Airtable Collection(s):** `supportTickets` → `v2_Support Tickets`
- **Approval Required:** No
- **Dependencies:** None

---

### escalate_ticket

- **Role:** admin
- **Risk Level:** execute_high
- **Description:** Escalates a ticket to a higher support tier or management, increases priority to critical, and triggers immediate notification to the assigned escalation path.
- **Parameters:**
  - `ticket_id: string` — ticket record ID
  - `escalation_reason: string` — why the ticket is being escalated
  - `escalate_to: string` — target admin/team ID
- **Backend Service:** supportService.jsw → `escalateTicket(ticketId, reason, escalateTo)`
- **Airtable Collection(s):** `supportTickets` → `v2_Support Tickets`
- **Approval Required:** Yes
- **Dependencies:** None

---

### get_ticket_analytics

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns ticket volume, average resolution time, SLA compliance rate, and top issue categories for a given period.
- **Parameters:**
  - `period_days: number` — lookback in days (default 30)
- **Backend Service:** supportService.jsw → `getTicketAnalytics(periodDays)`
- **Airtable Collection(s):** `supportTickets` → `v2_Support Tickets`
- **Approval Required:** No
- **Dependencies:** None

---

### search_knowledge_base

- **Role:** admin
- **Risk Level:** read
- **Description:** Full-text search across all knowledge base articles. Returns ranked results with article title, category, excerpt, and helpfulness score.
- **Parameters:**
  - `query: string` — search query
  - `category: string` — optional category filter
  - `limit: number` — max results (default 10)
- **Backend Service:** supportService.jsw → `searchKnowledgeBase(query, category, limit)`
- **Airtable Collection(s):** `kbArticles` → `v2_KB Articles`
- **Approval Required:** No
- **Dependencies:** None

---

### create_kb_article

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Creates a new knowledge base article. Published as a draft until explicitly published.
- **Parameters:**
  - `title: string` — article title
  - `content: string` — article body (markdown)
  - `category: string` — knowledge base category
  - `tags: string[]` — search tags
  - `target_roles: string[]` — which user roles can see this article
- **Backend Service:** supportService.jsw → `createKBArticle(articleData)`
- **Airtable Collection(s):** `kbArticles` → `v2_KB Articles`
- **Approval Required:** No
- **Dependencies:** None

---

### update_kb_article

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Updates a knowledge base article. Creates a version history record before saving. Keeps previous version accessible.
- **Parameters:**
  - `article_id: string` — article record ID
  - `title: string` — updated title
  - `content: string` — updated content
  - `change_notes: string` — summary of changes
- **Backend Service:** supportService.jsw → `updateKBArticle(articleId, updates)`
- **Airtable Collection(s):** `kbArticles` → `v2_KB Articles`
- **Approval Required:** No
- **Dependencies:** None

---

### get_kb_categories

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns all knowledge base categories with article count and last-updated date.
- **Parameters:** None
- **Backend Service:** supportService.jsw → `getKBCategories()`
- **Airtable Collection(s):** `kbArticles` → `v2_KB Articles`
- **Approval Required:** No
- **Dependencies:** None

---

### get_kb_analytics

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns knowledge base analytics: most-viewed articles, search terms without results, helpfulness ratings, and deflection rate (tickets avoided via KB).
- **Parameters:**
  - `period_days: number` — lookback in days (default 30)
- **Backend Service:** supportService.jsw → `getKBAnalytics(periodDays)`
- **Airtable Collection(s):** `kbArticles` → `v2_KB Articles`
- **Approval Required:** No
- **Dependencies:** None

---

### suggest_kb_article

- **Role:** admin
- **Risk Level:** suggest
- **Description:** Given a ticket or user question, searches the KB and returns the top 3 most relevant articles an agent could share as a response.
- **Parameters:**
  - `query: string` — user's question or ticket description
- **Backend Service:** supportService.jsw → `searchKnowledgeBase(query, null, 3)`
- **Airtable Collection(s):** `kbArticles` → `v2_KB Articles`
- **Approval Required:** No
- **Dependencies:** None

---

### get_chat_sessions

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns active and recent chat support sessions with user info, agent assigned, status, and wait time.
- **Parameters:**
  - `status_filter: "all" | "waiting" | "active" | "closed"` — status filter
  - `limit: number` — max sessions (default 25)
- **Backend Service:** supportService.jsw → `getChatSessions(statusFilter, limit)`
- **Airtable Collection(s):** `chatSessions` → `v2_Chat Sessions`
- **Approval Required:** No
- **Dependencies:** None

---

### get_chat_history

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the full message transcript for a chat session.
- **Parameters:**
  - `session_id: string` — chat session ID
- **Backend Service:** supportService.jsw → `getChatHistory(sessionId)`
- **Airtable Collection(s):** `chatSessions` → `v2_Chat Sessions`
- **Approval Required:** No
- **Dependencies:** None

---

### get_chat_analytics

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns chat volume, median wait time, resolution rate, and peak hour distribution for a given period.
- **Parameters:**
  - `period_days: number` — lookback in days (default 30)
- **Backend Service:** supportService.jsw → `getChatAnalytics(periodDays)`
- **Airtable Collection(s):** `chatSessions` → `v2_Chat Sessions`
- **Approval Required:** No
- **Dependencies:** None

---

### get_response_times

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns first-response time and full-resolution time broken down by agent, priority tier, and channel (ticket vs chat).
- **Parameters:**
  - `period_days: number` — lookback in days
  - `group_by: "agent" | "priority" | "channel"` — grouping dimension
- **Backend Service:** supportService.jsw → `getResponseTimeMetrics(periodDays, groupBy)`
- **Airtable Collection(s):** `supportTickets` → `v2_Support Tickets`, `chatSessions` → `v2_Chat Sessions`
- **Approval Required:** No
- **Dependencies:** None

---

### get_satisfaction_scores

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns CSAT scores per agent and per channel. Includes rating distribution and verbatim comment excerpts.
- **Parameters:**
  - `period_days: number` — lookback in days
- **Backend Service:** supportService.jsw → `getSatisfactionScores(periodDays)`
- **Airtable Collection(s):** `npsResponses` → `v2_NPS Responses`
- **Approval Required:** No
- **Dependencies:** None

---

### send_nps_survey

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Triggers an NPS survey email to a defined user segment. Throttle rules prevent the same user from receiving surveys more than once per 90 days.
- **Parameters:**
  - `segment: "all_drivers" | "all_carriers" | "all_recruiters" | "recent_placements"` — target segment
  - `custom_message: string` — optional intro text to personalize the survey
- **Backend Service:** supportService.jsw → `sendNPSSurvey(segment, customMessage)`
- **Airtable Collection(s):** `npsResponses` → `v2_NPS Responses`
- **Approval Required:** No
- **Dependencies:** email service

---

### get_nps_scores

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns current NPS score (promoters - detractors), response count, and breakdown by rating (0–10).
- **Parameters:**
  - `period_days: number` — lookback in days (default 90)
- **Backend Service:** supportService.jsw → `getNPSScores(periodDays)`
- **Airtable Collection(s):** `npsResponses` → `v2_NPS Responses`
- **Approval Required:** No
- **Dependencies:** None

---

### get_nps_trend

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns monthly NPS trend data as an array of `{ month, score, responses }` objects for charting.
- **Parameters:**
  - `months: number` — number of months to return (default 6)
- **Backend Service:** supportService.jsw → `getNPSTrend(months)`
- **Airtable Collection(s):** `npsResponses` → `v2_NPS Responses`
- **Approval Required:** No
- **Dependencies:** None

---

### get_nps_by_segment

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns NPS score broken down by user segment (role, tenure, plan tier).
- **Parameters:**
  - `segment_by: "role" | "tenure" | "plan_tier"` — segmentation axis
  - `period_days: number` — lookback (default 90)
- **Backend Service:** supportService.jsw → `getNPSBySegment(segmentBy, periodDays)`
- **Airtable Collection(s):** `npsResponses` → `v2_NPS Responses`
- **Approval Required:** No
- **Dependencies:** None

---

### get_nps_comments

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns verbatim NPS comments filtered by promoter/passive/detractor category.
- **Parameters:**
  - `category: "promoter" | "passive" | "detractor" | "all"` — respondent type
  - `limit: number` — max comments (default 50)
- **Backend Service:** supportService.jsw → `getNPSComments(category, limit)`
- **Airtable Collection(s):** `npsResponses` → `v2_NPS Responses`
- **Approval Required:** No
- **Dependencies:** None

---

### get_detractor_list

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the list of detractor respondents (score 0–6) with contact info and their verbatim comment. Used for proactive outreach and churn prevention.
- **Parameters:**
  - `period_days: number` — lookback (default 30)
  - `contacted: boolean` — filter to uncontacted detractors only (default true)
- **Backend Service:** supportService.jsw → `getDetractorList(periodDays, contacted)`
- **Airtable Collection(s):** `npsResponses` → `v2_NPS Responses`
- **Approval Required:** No
- **Dependencies:** None

---

## Group 5: Gamification

**Source Track:** gamification_strategy_20260123
**Backend Service:** gamificationService.jsw

---

### get_user_xp

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a user's current XP total, level, level title, and XP required to reach the next level.
- **Parameters:**
  - `user_id: string` — user record ID
  - `role: "driver" | "recruiter"` — gamification track
- **Backend Service:** gamificationService.jsw → `getUserProgress(userId, role)`
- **Airtable Collection(s):** `gamificationProfiles` → `v2_Gamification Profiles`
- **Approval Required:** No
- **Dependencies:** None

---

### award_xp

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Manually awards XP to a user for a specified action. Triggers level-up check. Records source as `admin_award` in XP history.
- **Parameters:**
  - `user_id: string` — user record ID
  - `role: "driver" | "recruiter"` — which track to award on
  - `xp_amount: number` — amount of XP to award
  - `reason: string` — human-readable reason for the award
- **Backend Service:** gamificationService.jsw → `awardXP(userId, role, xpAmount, "admin_award", reason)`
- **Airtable Collection(s):** `gamificationProfiles` → `v2_Gamification Profiles`, `xpHistory` → `v2_XP History`
- **Approval Required:** No
- **Dependencies:** None

---

### get_level_progress

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the full level progression map showing what each level requires, what it unlocks, and how many users are currently at that level.
- **Parameters:**
  - `role: "driver" | "recruiter"` — which track to query
- **Backend Service:** gamificationService.jsw → `getLevelRequirements(role)`
- **Airtable Collection(s):** `gamificationLevels` → `v2_Gamification Levels`
- **Approval Required:** No
- **Dependencies:** None

---

### get_level_requirements

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the XP thresholds and unlock conditions for each level in a progression track.
- **Parameters:**
  - `role: "driver" | "recruiter"` — which track
- **Backend Service:** gamificationService.jsw → `getLevelRequirements(role)`
- **Airtable Collection(s):** `gamificationLevels` → `v2_Gamification Levels`
- **Approval Required:** No
- **Dependencies:** None

---

### get_xp_history

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the XP transaction history for a user: each award event, amount, source action, and timestamp.
- **Parameters:**
  - `user_id: string` — user record ID
  - `limit: number` — max events (default 50)
- **Backend Service:** gamificationService.jsw → `getXPHistory(userId, limit)`
- **Airtable Collection(s):** `xpHistory` → `v2_XP History`
- **Approval Required:** No
- **Dependencies:** None

---

### get_level_leaderboard

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the top-N users by current XP/level for a given role track.
- **Parameters:**
  - `role: "driver" | "recruiter"` — which track
  - `limit: number` — how many leaders to return (default 20)
- **Backend Service:** gamificationService.jsw → `getLeaderboard("level", role, limit)`
- **Airtable Collection(s):** `gamificationProfiles` → `v2_Gamification Profiles`
- **Approval Required:** No
- **Dependencies:** None

---

### get_user_streaks

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a user's current streak data: active streaks, current lengths, longest recorded, and streak multiplier.
- **Parameters:**
  - `user_id: string` — user record ID
- **Backend Service:** gamificationService.jsw → `getUserStreaks(userId)`
- **Airtable Collection(s):** `userStreaks` → `v2_User Streaks`
- **Approval Required:** No
- **Dependencies:** None

---

### get_active_streaks

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a list of users with streaks above a given threshold. Used for engagement monitoring and streak-based promotions.
- **Parameters:**
  - `min_streak_days: number` — minimum streak length to include (default 7)
  - `role: "driver" | "recruiter" | "all"` — filter by role
- **Backend Service:** gamificationService.jsw → `getActiveStreaks(minStreakDays, role)`
- **Airtable Collection(s):** `userStreaks` → `v2_User Streaks`
- **Approval Required:** No
- **Dependencies:** None

---

### reset_streak

- **Role:** admin
- **Risk Level:** execute_high
- **Description:** Resets a user's streak (sets to 0). Used for rule violations or data correction. Requires a reason that is logged.
- **Parameters:**
  - `user_id: string` — user record ID
  - `streak_type: string` — which streak to reset
  - `reason: string` — reason for the reset
- **Backend Service:** gamificationService.jsw → `resetStreak(userId, streakType, reason)`
- **Airtable Collection(s):** `userStreaks` → `v2_User Streaks`
- **Approval Required:** Yes
- **Dependencies:** None

---

### get_streak_leaderboard

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the top users by longest active streak for a given role track.
- **Parameters:**
  - `role: "driver" | "recruiter" | "all"` — filter by role
  - `limit: number` — max results (default 20)
- **Backend Service:** gamificationService.jsw → `getLeaderboard("streak", role, limit)`
- **Airtable Collection(s):** `userStreaks` → `v2_User Streaks`
- **Approval Required:** No
- **Dependencies:** None

---

### get_achievements

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns all defined achievements with name, description, XP reward, unlock criteria, and earn rate (what percentage of eligible users have earned it).
- **Parameters:**
  - `role: "driver" | "recruiter" | "all"` — filter by applicable role
- **Backend Service:** gamificationService.jsw → `getAchievementDefinitions(role)`
- **Airtable Collection(s):** `achievementDefinitions` → `v2_Achievement Definitions`
- **Approval Required:** No
- **Dependencies:** None

---

### get_user_achievements

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns all achievements earned by a specific user with the earned date and XP awarded for each.
- **Parameters:**
  - `user_id: string` — user record ID
- **Backend Service:** gamificationService.jsw → `getUserAchievements(userId)`
- **Airtable Collection(s):** `userAchievements` → `v2_User Achievements`
- **Approval Required:** No
- **Dependencies:** None

---

### award_achievement

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Manually awards an achievement to a user. Used for special recognition or correcting missed automatic awards.
- **Parameters:**
  - `user_id: string` — user record ID
  - `achievement_id: string` — achievement definition ID
  - `reason: string` — why this is being awarded manually
- **Backend Service:** gamificationService.jsw → `awardAchievement(userId, achievementId, "admin_manual", reason)`
- **Airtable Collection(s):** `userAchievements` → `v2_User Achievements`
- **Approval Required:** No
- **Dependencies:** None

---

### get_achievement_progress

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a user's progress toward unearned achievements: current value vs. required value for each.
- **Parameters:**
  - `user_id: string` — user record ID
- **Backend Service:** gamificationService.jsw → `getAchievementProgress(userId)`
- **Airtable Collection(s):** `userAchievements` → `v2_User Achievements`, `achievementDefinitions` → `v2_Achievement Definitions`
- **Approval Required:** No
- **Dependencies:** None

---

### create_achievement_definition

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Creates a new achievement definition that the system will automatically award when a user meets the criteria.
- **Parameters:**
  - `name: string` — achievement name
  - `description: string` — what the achievement represents
  - `role: "driver" | "recruiter" | "both"` — who can earn it
  - `xp_reward: number` — XP awarded on unlock
  - `criteria: object` — unlock conditions `{ action: "application.submitted", threshold: 5 }`
  - `badge_icon: string` — icon identifier
- **Backend Service:** gamificationService.jsw → `createAchievementDefinition(data)`
- **Airtable Collection(s):** `achievementDefinitions` → `v2_Achievement Definitions`
- **Approval Required:** No
- **Dependencies:** None

---

### create_challenge

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Creates a new time-limited challenge users can join. Challenges can be individual or competitive (leaderboard-ranked).
- **Parameters:**
  - `title: string` — challenge title
  - `description: string` — what participants must do
  - `challenge_type: "individual" | "competitive"` — scoring mode
  - `start_date: string` — ISO date
  - `end_date: string` — ISO date
  - `xp_reward: number` — XP for completion
  - `target_roles: string[]` — eligible user roles
  - `goal_metric: string` — what is measured (e.g. `"applications_submitted"`)
  - `goal_threshold: number` — value required to complete
- **Backend Service:** gamificationService.jsw → `createChallenge(challengeData)`
- **Airtable Collection(s):** `challenges` → `v2_Challenges`
- **Approval Required:** No
- **Dependencies:** None

---

### get_active_challenges

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns all currently active challenges with participant count and days remaining.
- **Parameters:**
  - `role: "driver" | "recruiter" | "all"` — filter by target role
- **Backend Service:** gamificationService.jsw → `getActiveChallenges(role)`
- **Airtable Collection(s):** `challenges` → `v2_Challenges`
- **Approval Required:** No
- **Dependencies:** None

---

### join_challenge

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Enrolls a user in an active challenge on their behalf. Used for admin-initiated enrollment or re-enrollment after technical issues.
- **Parameters:**
  - `user_id: string` — user record ID
  - `challenge_id: string` — challenge record ID
- **Backend Service:** gamificationService.jsw → `joinChallenge(userId, challengeId)`
- **Airtable Collection(s):** `challengeParticipants` → `v2_Challenge Participants`
- **Approval Required:** No
- **Dependencies:** None

---

### get_challenge_progress

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns progress data for a challenge: per-participant current value, completion percentage, and time remaining.
- **Parameters:**
  - `challenge_id: string` — challenge record ID
- **Backend Service:** gamificationService.jsw → `getChallengeProgress(challengeId)`
- **Airtable Collection(s):** `challengeParticipants` → `v2_Challenge Participants`, `challenges` → `v2_Challenges`
- **Approval Required:** No
- **Dependencies:** None

---

### get_challenge_leaderboard

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the ranked leaderboard for a competitive challenge by current metric value.
- **Parameters:**
  - `challenge_id: string` — challenge record ID
  - `limit: number` — max positions to return (default 20)
- **Backend Service:** gamificationService.jsw → `getChallengeLeaderboard(challengeId, limit)`
- **Airtable Collection(s):** `challengeParticipants` → `v2_Challenge Participants`
- **Approval Required:** No
- **Dependencies:** None

---

### complete_challenge

- **Role:** admin
- **Risk Level:** execute_high
- **Description:** Manually completes a challenge for a user (e.g. to resolve a technical failure where their completion was not recorded). Awards XP and records admin override.
- **Parameters:**
  - `user_id: string` — user record ID
  - `challenge_id: string` — challenge record ID
  - `reason: string` — reason for manual completion
- **Backend Service:** gamificationService.jsw → `manualCompleteChallenge(userId, challengeId, reason)`
- **Airtable Collection(s):** `challengeParticipants` → `v2_Challenge Participants`
- **Approval Required:** Yes
- **Dependencies:** None

---

### get_leaderboard

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a named platform leaderboard with rank, user info, and metric value.
- **Parameters:**
  - `leaderboard_id: string` — leaderboard identifier (e.g. `"weekly_drivers"`, `"monthly_recruiters"`)
  - `limit: number` — positions to return (default 20)
- **Backend Service:** gamificationService.jsw → `getLeaderboard(leaderboardId, limit)`
- **Airtable Collection(s):** `leaderboards` → `v2_Leaderboards`
- **Approval Required:** No
- **Dependencies:** None

---

### get_user_rank

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a specific user's rank on a named leaderboard and the metric value they achieved.
- **Parameters:**
  - `user_id: string` — user record ID
  - `leaderboard_id: string` — leaderboard identifier
- **Backend Service:** gamificationService.jsw → `getUserRank(userId, leaderboardId)`
- **Airtable Collection(s):** `leaderboards` → `v2_Leaderboards`
- **Approval Required:** No
- **Dependencies:** None

---

### get_leaderboard_history

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns archived past leaderboard results (previous weeks or months) for a given leaderboard ID.
- **Parameters:**
  - `leaderboard_id: string` — leaderboard identifier
  - `periods: number` — how many past periods to return (default 4)
- **Backend Service:** gamificationService.jsw → `getLeaderboardHistory(leaderboardId, periods)`
- **Airtable Collection(s):** `leaderboards` → `v2_Leaderboards`
- **Approval Required:** No
- **Dependencies:** None

---

### create_custom_leaderboard

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Defines a new custom leaderboard based on any measurable platform metric. Leaderboard calculates rankings on a daily schedule.
- **Parameters:**
  - `name: string` — leaderboard name
  - `metric: string` — what to rank on (e.g. `"matches_accepted"`, `"applications_submitted"`)
  - `role: "driver" | "recruiter"` — which role is ranked
  - `period: "weekly" | "monthly" | "all_time"` — ranking window
  - `limit: number` — how many positions to show (default 20)
- **Backend Service:** gamificationService.jsw → `createCustomLeaderboard(data)`
- **Airtable Collection(s):** `leaderboards` → `v2_Leaderboards`
- **Approval Required:** No
- **Dependencies:** None

---

## Group 6: Feature Adoption

**Source Track:** feature_adoption_log_20260120
**Backend Service:** featureAdoptionService.jsw

---

### log_feature_interaction

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Logs a feature interaction event manually (for testing or backfill). Normally called automatically by the client-side tracker library.
- **Parameters:**
  - `feature_key: string` — feature identifier
  - `user_id: string` — user who interacted
  - `role: string` — user role
  - `action: string` — action type (e.g. `"click"`, `"view"`, `"complete"`)
  - `session_id: string` — session identifier
- **Backend Service:** featureAdoptionService.jsw → `logFeatureInteraction(data)`
- **Airtable Collection(s):** `featureAdoptionLogs` → `v2_Feature Adoption Logs`
- **Approval Required:** No
- **Dependencies:** None

---

### get_feature_usage

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns usage counts (views, clicks, completions) for a specific feature over a time window, broken down by day.
- **Parameters:**
  - `feature_key: string` — feature identifier
  - `period_days: number` — lookback window (default 30)
- **Backend Service:** featureAdoptionService.jsw → `getFeatureStats(featureKey, periodDays)`
- **Airtable Collection(s):** `featureAdoptionLogs` → `v2_Feature Adoption Logs`, `featureMetricsDaily` → `v2_Feature Metrics Daily`
- **Approval Required:** No
- **Dependencies:** None

---

### get_feature_adoption_rate

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the adoption rate for a feature: percentage of eligible users who have used it at least once, broken down by role.
- **Parameters:**
  - `feature_key: string` — feature identifier
  - `period_days: number` — lookback window (default 30)
  - `role: "driver" | "carrier" | "recruiter" | "all"` — filter by role
- **Backend Service:** featureAdoptionService.jsw → `getFeatureAdoptionRate(featureKey, periodDays, role)`
- **Airtable Collection(s):** `featureMetricsDaily` → `v2_Feature Metrics Daily`
- **Approval Required:** No
- **Dependencies:** None

---

### get_feature_funnel

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns funnel conversion data for a defined feature funnel: step-by-step drop-off rates and completion rates.
- **Parameters:**
  - `funnel_id: string` — funnel definition ID
  - `period_days: number` — lookback window
- **Backend Service:** featureAdoptionService.jsw → `getFunnelConversion(funnelId, periodDays)`
- **Airtable Collection(s):** `featureFunnels` → `v2_Feature Funnels`
- **Approval Required:** No
- **Dependencies:** None

---

### get_feature_health_score

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a composite health score (0–100) for a feature based on adoption rate, engagement depth, error rate, and trend direction.
- **Parameters:**
  - `feature_key: string` — feature identifier
- **Backend Service:** featureAdoptionService.jsw → `getFeatureComparison([featureKey])`
- **Airtable Collection(s):** `featureMetricsDaily` → `v2_Feature Metrics Daily`, `featureRegistry` → `v2_Feature Registry`
- **Approval Required:** No
- **Dependencies:** None

---

### get_underused_features

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns features with adoption below a threshold — candidates for UX improvement or deprecation. Sorted by adoption rate ascending.
- **Parameters:**
  - `adoption_threshold: number` — percentage below which a feature is considered underused (default 20)
  - `period_days: number` — lookback window (default 30)
- **Backend Service:** featureAdoptionService.jsw → `getUnderusedFeatures(adoptionThreshold, periodDays)`
- **Airtable Collection(s):** `featureMetricsDaily` → `v2_Feature Metrics Daily`
- **Approval Required:** No
- **Dependencies:** None

---

### get_feature_engagement_trend

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns week-over-week engagement trend for a feature showing whether usage is growing, stable, or declining.
- **Parameters:**
  - `feature_key: string` — feature identifier
  - `weeks: number` — number of weeks to include (default 8)
- **Backend Service:** featureAdoptionService.jsw → `getCohortRetention(featureKey, weeks)`
- **Airtable Collection(s):** `featureMetricsDaily` → `v2_Feature Metrics Daily`
- **Approval Required:** No
- **Dependencies:** None

---

### get_feature_recommendations

- **Role:** admin
- **Risk Level:** suggest
- **Description:** Returns AI-generated recommendations for each underperforming feature: possible causes of low adoption and suggested interventions (UX change, tutorial, notification nudge, deprecation).
- **Parameters:**
  - `limit: number` — max features to analyze (default 5)
- **Backend Service:** featureAdoptionService.jsw → `getFeatureRecommendations(limit)` (delegates to AI Router)
- **Airtable Collection(s):** `featureMetricsDaily` → `v2_Feature Metrics Daily`, `featureRegistry` → `v2_Feature Registry`
- **Approval Required:** No
- **Dependencies:** aiRouterService.jsw

---

## Group 7: Cross-Role Utility

**Source Track:** cross_role_utility_20260120
**Backend Services:** matchExplanationService.jsw, recruiterHealthService.jsw

---

### get_mutual_interests

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns driver-carrier pairs where both sides have expressed interest (mutual match signals). Useful for monitoring engagement quality.
- **Parameters:**
  - `carrier_dot: string` — optional; filter to a specific carrier
  - `limit: number` — max pairs (default 50)
- **Backend Service:** matchExplanationService.jsw → `getMutualInterests(carrierDot, limit)`
- **Airtable Collection(s):** `driverCarrierInterests` → `v2_Driver Carrier Interests`
- **Approval Required:** No
- **Dependencies:** None

---

### send_interest_signal

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Records a carrier interest signal in a driver on behalf of a carrier (e.g. after a recruiter call). Creates or updates the interest record.
- **Parameters:**
  - `carrier_dot: string` — carrier DOT number
  - `driver_id: string` — driver record ID
  - `signal_strength: "viewed" | "interested" | "strong_interest"` — level of interest
- **Backend Service:** matchExplanationService.jsw → `sendInterestSignal(carrierDot, driverId, signalStrength)`
- **Airtable Collection(s):** `driverCarrierInterests` → `v2_Driver Carrier Interests`
- **Approval Required:** No
- **Dependencies:** None

---

### get_interest_matches

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns all mutual-interest matches for a carrier along with match scores and interest timestamps.
- **Parameters:**
  - `carrier_dot: string` — carrier DOT number
- **Backend Service:** matchExplanationService.jsw → `getInterestMatches(carrierDot)`
- **Airtable Collection(s):** `driverCarrierInterests` → `v2_Driver Carrier Interests`
- **Approval Required:** No
- **Dependencies:** None

---

### withdraw_interest

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Withdraws a previously recorded interest signal from a carrier toward a driver. Used for data correction or user request.
- **Parameters:**
  - `carrier_dot: string` — carrier DOT number
  - `driver_id: string` — driver record ID
  - `reason: string` — reason for withdrawal
- **Backend Service:** matchExplanationService.jsw → `withdrawInterest(carrierDot, driverId, reason)`
- **Airtable Collection(s):** `driverCarrierInterests` → `v2_Driver Carrier Interests`
- **Approval Required:** No
- **Dependencies:** None

---

### get_carrier_retention_score

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the carrier's driver retention score including turnover rate, average tenure, and risk tier classification.
- **Parameters:**
  - `carrier_dot: string` — carrier DOT number
- **Backend Service:** recruiterHealthService.jsw → `getRetentionScore(carrierDot)`
- **Airtable Collection(s):** `carrierRetentionMetrics` → `v2_Carrier Retention Metrics`
- **Approval Required:** No
- **Dependencies:** None

---

### get_retention_risk_factors

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the specific risk factors contributing to a carrier's retention score: pay competitiveness, home time ratio, equipment age, and review sentiment.
- **Parameters:**
  - `carrier_dot: string` — carrier DOT number
- **Backend Service:** recruiterHealthService.jsw → `getRetentionRiskFactors(carrierDot)`
- **Airtable Collection(s):** `carrierRetentionMetrics` → `v2_Carrier Retention Metrics`, `carrierEnrichments` → `v2_Carrier Enrichments`
- **Approval Required:** No
- **Dependencies:** None

---

### get_retention_recommendations

- **Role:** admin
- **Risk Level:** suggest
- **Description:** Returns AI-generated actionable recommendations for improving a carrier's driver retention based on their risk factors.
- **Parameters:**
  - `carrier_dot: string` — carrier DOT number
- **Backend Service:** recruiterHealthService.jsw → `getRetentionRecommendations(carrierDot)`
- **Airtable Collection(s):** `carrierRetentionMetrics` → `v2_Carrier Retention Metrics`
- **Approval Required:** No
- **Dependencies:** aiRouterService.jsw

---

### get_match_explanation

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the human-readable "Why You Matched" explanation for a driver-carrier pair, including the top contributing factors and their weights.
- **Parameters:**
  - `driver_id: string` — driver record ID
  - `carrier_dot: string` — carrier DOT number
- **Backend Service:** matchExplanationService.jsw → `getMatchExplanationForDriver(driverId, carrierDot)`
- **Airtable Collection(s):** `driverProfiles` → `v2_Driver Profiles`, `carrierProfiles` → `v2_Carrier Profiles`
- **Approval Required:** No
- **Dependencies:** driverScoring.js, carrierPreferences.jsw

---

### get_match_factors

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the raw factor scores (location, pay, safety, experience, endorsements, home time) that comprise a match score for a pair.
- **Parameters:**
  - `driver_id: string` — driver record ID
  - `carrier_dot: string` — carrier DOT number
- **Backend Service:** matchExplanationService.jsw → `getMatchFactors(driverId, carrierDot)`
- **Airtable Collection(s):** `matchEvents` → `v2_Match Events`
- **Approval Required:** No
- **Dependencies:** None

---

### get_match_confidence

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the confidence level for a match score based on data completeness: what percentage of matching factors had sufficient data to score.
- **Parameters:**
  - `driver_id: string` — driver record ID
  - `carrier_dot: string` — carrier DOT number
- **Backend Service:** matchExplanationService.jsw → `getMatchConfidence(driverId, carrierDot)`
- **Airtable Collection(s):** `matchEvents` → `v2_Match Events`
- **Approval Required:** No
- **Dependencies:** None

---

### compare_matches

- **Role:** admin
- **Risk Level:** read
- **Description:** Side-by-side comparison of two or more matches for the same driver, showing factor-level scores and explaining why one match ranks higher.
- **Parameters:**
  - `driver_id: string` — driver record ID
  - `carrier_dots: string[]` — array of 2–5 carrier DOT numbers to compare
- **Backend Service:** matchExplanationService.jsw → `compareMatches(driverId, carrierDots)`
- **Airtable Collection(s):** `matchEvents` → `v2_Match Events`
- **Approval Required:** No
- **Dependencies:** None

---

### get_system_health_status

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the aggregated health status (`operational`, `degraded`, or `outage`) across all backend services with per-service detail.
- **Parameters:** None
- **Backend Service:** recruiterHealthService.jsw → `getRecruiterHealthStatus("platform")`
- **Airtable Collection(s):** `systemAlerts` → `v2_System Alerts`
- **Approval Required:** No
- **Dependencies:** observabilityService.jsw

---

### get_service_availability

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns uptime percentage for each backend service over the past 7 or 30 days.
- **Parameters:**
  - `period_days: number` — lookback (7 or 30)
- **Backend Service:** observabilityService.jsw → `getServiceAvailability(periodDays)`
- **Airtable Collection(s):** `systemAlerts` → `v2_System Alerts`
- **Approval Required:** No
- **Dependencies:** observabilityService.jsw

---

### get_degraded_services

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the list of currently degraded or unavailable services with degradation start time and impact description.
- **Parameters:** None
- **Backend Service:** recruiterHealthService.jsw → `getDegradedServices()`
- **Airtable Collection(s):** `systemAlerts` → `v2_System Alerts`
- **Approval Required:** No
- **Dependencies:** observabilityService.jsw

---

### get_health_history

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a timeline of past incidents and degradation events for a given service or the platform overall.
- **Parameters:**
  - `service: string` — service name or `"all"`
  - `limit: number` — max incidents to return (default 20)
- **Backend Service:** observabilityService.jsw → `getHealthHistory(service, limit)`
- **Airtable Collection(s):** `systemAlerts` → `v2_System Alerts`
- **Approval Required:** No
- **Dependencies:** observabilityService.jsw

---

## Group 8: Observability

**Source Track:** observability_gaps_20260112
**Backend Service:** observabilityService.jsw

---

### get_traces

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns recent distributed traces across all services. Includes trace ID, service, status, duration, and tag summary.
- **Parameters:**
  - `service: string` — optional service filter
  - `status: "all" | "success" | "error" | "denied"` — status filter
  - `limit: number` — max traces (default 50)
- **Backend Service:** observabilityService.jsw → `getTraces(service, status, limit)`
- **Airtable Collection(s):** `observabilityTraces` → `v2_Observability Traces`
- **Approval Required:** No
- **Dependencies:** None

---

### search_traces

- **Role:** admin
- **Risk Level:** read
- **Description:** Searches traces by correlation ID, user ID, carrier DOT, or tag. Returns matching traces sorted by timestamp descending.
- **Parameters:**
  - `query: string` — search term (trace ID, user ID, DOT, or tag)
  - `date_from: string` — ISO datetime start
  - `date_to: string` — ISO datetime end
- **Backend Service:** observabilityService.jsw → `searchTraces(query, dateFrom, dateTo)`
- **Airtable Collection(s):** `observabilityTraces` → `v2_Observability Traces`
- **Approval Required:** No
- **Dependencies:** None

---

### get_trace_detail

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the full detail for a single trace including all spans, database operations logged, timing breakdown, and error messages if any.
- **Parameters:**
  - `trace_id: string` — trace identifier
- **Backend Service:** observabilityService.jsw → `getTraceDetail(traceId)`
- **Airtable Collection(s):** `observabilityTraces` → `v2_Observability Traces`
- **Approval Required:** No
- **Dependencies:** None

---

### get_trace_timeline

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a visual-ready timeline of spans within a trace, suitable for waterfall diagram rendering.
- **Parameters:**
  - `trace_id: string` — trace identifier
- **Backend Service:** observabilityService.jsw → `getTraceTimeline(traceId)`
- **Airtable Collection(s):** `observabilityTraces` → `v2_Observability Traces`
- **Approval Required:** No
- **Dependencies:** None

---

### get_slow_traces

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns traces with duration above a threshold. Used to identify performance bottlenecks.
- **Parameters:**
  - `min_duration_ms: number` — minimum duration to include (default 2000)
  - `service: string` — optional service filter
  - `limit: number` — max results (default 20)
- **Backend Service:** observabilityService.jsw → `getSlowTraces(minDurationMs, service, limit)`
- **Airtable Collection(s):** `observabilityTraces` → `v2_Observability Traces`
- **Approval Required:** No
- **Dependencies:** None

---

### get_system_metrics

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns current system-level metrics: request rate, error rate, p50/p95 latency, cache hit rate, and queue depths.
- **Parameters:**
  - `period: "5m" | "1h" | "24h"` — aggregation window
- **Backend Service:** observabilityService.jsw → `getSystemMetrics(period)`
- **Airtable Collection(s):** `baselineMetrics` → `v2_Baseline Metrics`
- **Approval Required:** No
- **Dependencies:** None

---

### get_metric_trend

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns a time-series array for a named system metric over a given period. Used for trend charts and anomaly visualization.
- **Parameters:**
  - `metric_name: string` — metric identifier (e.g. `"error_rate"`, `"p95_latency_ms"`)
  - `period_hours: number` — hours of data to return (default 24)
- **Backend Service:** observabilityService.jsw → `getMetricTrend(metricName, periodHours)`
- **Airtable Collection(s):** `baselineMetrics` → `v2_Baseline Metrics`
- **Approval Required:** No
- **Dependencies:** None

---

### get_metric_alerts

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns all active metric alerts where current values exceed defined thresholds.
- **Parameters:**
  - `severity: "all" | "critical" | "warning"` — severity filter
- **Backend Service:** observabilityService.jsw → `getActiveAnomalies(severity)`
- **Airtable Collection(s):** `anomalyAlerts` → `v2_Anomaly Alerts`
- **Approval Required:** No
- **Dependencies:** None

---

### create_metric_alert

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Creates a new metric alerting rule: watches a named metric and fires when value exceeds a threshold for a sustained period.
- **Parameters:**
  - `metric_name: string` — metric to watch
  - `operator: "gt" | "lt" | "eq"` — comparison operator
  - `threshold: number` — alert threshold value
  - `sustained_minutes: number` — how long threshold must be exceeded before alert fires
  - `severity: "warning" | "critical"` — alert severity
  - `notification_channels: string[]` — where to send alert (e.g. `["admin_dashboard", "email"]`)
- **Backend Service:** observabilityService.jsw → `createAnomalyRule(ruleData)`
- **Airtable Collection(s):** `anomalyRules` → `v2_Anomaly Rules`
- **Approval Required:** No
- **Dependencies:** None

---

### get_dashboard_metrics

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the full observability dashboard data bundle for the ADMIN_OBSERVABILITY page: system metrics, active alerts, slow trace count, and anomaly summary.
- **Parameters:** None
- **Backend Service:** observabilityService.jsw → `getDashboardMetrics()`
- **Airtable Collection(s):** `baselineMetrics` → `v2_Baseline Metrics`, `anomalyAlerts` → `v2_Anomaly Alerts`
- **Approval Required:** No
- **Dependencies:** None

---

### get_error_log

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns recent error log entries from all platform services with error message, source service, trace ID, and count.
- **Parameters:**
  - `service: string` — optional service filter
  - `limit: number` — max errors (default 50)
  - `since: string` — ISO datetime to start from
- **Backend Service:** observabilityService.jsw → `getErrorLog(service, limit, since)`
- **Airtable Collection(s):** `observabilityTraces` → `v2_Observability Traces`
- **Approval Required:** No
- **Dependencies:** None

---

### get_error_trends

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns error rate trends over time by service and error type. Useful for identifying regressions after deployments.
- **Parameters:**
  - `period_hours: number` — lookback window (default 48)
  - `group_by: "service" | "error_type"` — grouping dimension
- **Backend Service:** observabilityService.jsw → `getErrorTrends(periodHours, groupBy)`
- **Airtable Collection(s):** `observabilityTraces` → `v2_Observability Traces`
- **Approval Required:** No
- **Dependencies:** None

---

### get_error_detail

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns all trace records associated with a specific error type: affected users, frequency, and first/last occurrence.
- **Parameters:**
  - `error_signature: string` — error message or type identifier
- **Backend Service:** observabilityService.jsw → `getErrorDetail(errorSignature)`
- **Airtable Collection(s):** `observabilityTraces` → `v2_Observability Traces`
- **Approval Required:** No
- **Dependencies:** None

---

### acknowledge_error

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Marks an error type as acknowledged, suppressing repeated alerts. Requires a note explaining the acknowledgment.
- **Parameters:**
  - `error_signature: string` — error identifier
  - `admin_id: string` — admin acknowledging
  - `note: string` — explanation (e.g. known issue, fix deployed)
- **Backend Service:** observabilityService.jsw → `acknowledgeAnomaly(errorSignature, adminId, note)`
- **Airtable Collection(s):** `anomalyAlerts` → `v2_Anomaly Alerts`
- **Approval Required:** No
- **Dependencies:** None

---

### get_top_errors

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the top N error types by occurrence count in a time window, with affected user count and first-seen timestamp.
- **Parameters:**
  - `period_hours: number` — lookback window (default 24)
  - `limit: number` — number of top errors to return (default 10)
- **Backend Service:** observabilityService.jsw → `getTopErrors(periodHours, limit)`
- **Airtable Collection(s):** `observabilityTraces` → `v2_Observability Traces`
- **Approval Required:** No
- **Dependencies:** None

---

## Group 9: External API Platform

**Source Track:** external_api_platform_20260123
**Backend Service:** apiGatewayService.jsw

---

### get_api_keys

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns all API keys for a partner account with key name, status, last used timestamp, and associated tier.
- **Parameters:**
  - `partner_id: string` — API partner record ID
- **Backend Service:** apiGatewayService.jsw → `getAPIKeys(partnerId)`
- **Airtable Collection(s):** `apiPartners` → `v2_API Partners`
- **Approval Required:** No
- **Dependencies:** None

---

### create_api_key

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Generates a new API key for a partner. The full key is returned only once at creation; thereafter only the prefix is visible. Partners can hold up to 5 active keys.
- **Parameters:**
  - `partner_id: string` — partner record ID
  - `key_name: string` — label for this key (e.g. `"production"`, `"staging"`)
  - `scopes: string[]` — optional endpoint restrictions
- **Backend Service:** apiGatewayService.jsw → `createAPIKey(partnerId, keyName, scopes)`
- **Airtable Collection(s):** `apiPartners` → `v2_API Partners`
- **Approval Required:** No
- **Dependencies:** None

---

### revoke_api_key

- **Role:** admin
- **Risk Level:** execute_high
- **Description:** Immediately revokes an API key. Any in-flight requests using this key will fail. Action is irreversible.
- **Parameters:**
  - `partner_id: string` — partner record ID
  - `key_id: string` — key identifier to revoke
  - `reason: string` — reason for revocation
- **Backend Service:** apiGatewayService.jsw → `revokeAPIKey(partnerId, keyId, reason)`
- **Airtable Collection(s):** `apiPartners` → `v2_API Partners`
- **Approval Required:** Yes
- **Dependencies:** None

---

### get_api_usage

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns API usage statistics for a partner: total requests, requests by endpoint, error rate, and average latency for the current billing period.
- **Parameters:**
  - `partner_id: string` — partner record ID
  - `period: string` — ISO month string (default current month)
- **Backend Service:** apiGatewayService.jsw → `getPartnerUsage(partnerId, period)`
- **Airtable Collection(s):** `apiUsage` → `v2_API Usage`
- **Approval Required:** No
- **Dependencies:** None

---

### get_rate_limit_status

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the current rate limit status for a partner: requests used in the current minute window and remaining monthly quota.
- **Parameters:**
  - `partner_id: string` — partner record ID
- **Backend Service:** apiGatewayService.jsw → `getRateLimitStatus(partnerId)`
- **Airtable Collection(s):** `apiUsage` → `v2_API Usage`, `apiSubscriptions` → `v2_API Subscriptions`
- **Approval Required:** No
- **Dependencies:** None

---

### get_safety_data

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns FMCSA safety data for a carrier DOT number: operating status, safety rating, BASIC scores, and inspection history.
- **Parameters:**
  - `dot_number: string` — carrier DOT number
- **Backend Service:** apiGatewayService.jsw → `getSafetyData(dotNumber)` → fmcsaService.jsw
- **Airtable Collection(s):** `carrierSafetyData` → `v2_Carrier Safety Data`
- **Approval Required:** No
- **Dependencies:** fmcsaService.jsw

---

### get_inspection_history

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the roadside inspection history for a carrier including driver OOS rate, vehicle OOS rate, and violation breakdown.
- **Parameters:**
  - `dot_number: string` — carrier DOT number
- **Backend Service:** apiGatewayService.jsw → `getInspectionHistory(dotNumber)` → fmcsaService.jsw
- **Airtable Collection(s):** `carrierSafetyData` → `v2_Carrier Safety Data`
- **Approval Required:** No
- **Dependencies:** fmcsaService.jsw

---

### get_crash_data

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the crash report history for a carrier: total crashes, fatal, injury, and tow-away counts.
- **Parameters:**
  - `dot_number: string` — carrier DOT number
- **Backend Service:** apiGatewayService.jsw → `getCrashData(dotNumber)` → fmcsaService.jsw
- **Airtable Collection(s):** `carrierSafetyData` → `v2_Carrier Safety Data`
- **Approval Required:** No
- **Dependencies:** fmcsaService.jsw

---

### get_violations

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns recent FMCSA violations for a carrier by BASIC category with violation codes and dates.
- **Parameters:**
  - `dot_number: string` — carrier DOT number
  - `basic_category: string` — optional filter by BASIC category
- **Backend Service:** apiGatewayService.jsw → `getViolations(dotNumber, basicCategory)` → fmcsaService.jsw
- **Airtable Collection(s):** `carrierSafetyData` → `v2_Carrier Safety Data`
- **Approval Required:** No
- **Dependencies:** fmcsaService.jsw

---

### get_carrier_intel

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns AI-enriched carrier intelligence for an external partner query: pay data, sentiment score, hiring status, and top driver themes.
- **Parameters:**
  - `dot_number: string` — carrier DOT number
- **Backend Service:** apiGatewayService.jsw → `getCarrierIntelligence(dotNumber)` → aiEnrichmentService.jsw
- **Airtable Collection(s):** `carrierEnrichments` → `v2_Carrier Enrichments`
- **Approval Required:** No
- **Dependencies:** aiEnrichmentService.jsw

---

### get_market_data

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns market intelligence for a region and freight type: average CPM, demand index, driver shortage severity, and hot lanes.
- **Parameters:**
  - `region: string` — geographic region or state code
  - `freight_type: string` — e.g. `"dry_van"`, `"flatbed"`, `"reefer"`
  - `operation_type: string` — e.g. `"otr"`, `"regional"`, `"local"`
- **Backend Service:** apiGatewayService.jsw → `getMarketData(region, freightType, operationType)`
- **Airtable Collection(s):** `marketIntelligence` → `v2_Market Intelligence`
- **Approval Required:** No
- **Dependencies:** None

---

### get_industry_benchmarks

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns industry benchmark data: national average CPM, sign-on bonus range, OOS rates, and driver shortage index.
- **Parameters:**
  - `freight_type: string` — optional filter
- **Backend Service:** apiGatewayService.jsw → `getIndustryBenchmarks(freightType)`
- **Airtable Collection(s):** `marketIntelligence` → `v2_Market Intelligence`
- **Approval Required:** No
- **Dependencies:** None

---

### get_operational_metrics

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns operational metrics for a carrier based on fleet data: utilization rate, average load, and route coverage area.
- **Parameters:**
  - `dot_number: string` — carrier DOT number
- **Backend Service:** apiGatewayService.jsw → `getOperationalMetrics(dotNumber)`
- **Airtable Collection(s):** `carrierSafetyData` → `v2_Carrier Safety Data`
- **Approval Required:** No
- **Dependencies:** fmcsaService.jsw

---

### get_fleet_utilization

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns fleet utilization data for a carrier: power units, reported drivers, mileage, and estimated driver-to-truck ratio.
- **Parameters:**
  - `dot_number: string` — carrier DOT number
- **Backend Service:** apiGatewayService.jsw → `getFleetUtilization(dotNumber)` → fmcsaService.jsw
- **Airtable Collection(s):** `carrierSafetyData` → `v2_Carrier Safety Data`
- **Approval Required:** No
- **Dependencies:** fmcsaService.jsw

---

### get_route_analytics

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns route analytics from the carrier's operational footprint: primary lanes operated, geographic coverage, and typical run lengths.
- **Parameters:**
  - `dot_number: string` — carrier DOT number
- **Backend Service:** apiGatewayService.jsw → `getRouteAnalytics(dotNumber)`
- **Airtable Collection(s):** `carrierEnrichments` → `v2_Carrier Enrichments`
- **Approval Required:** No
- **Dependencies:** aiEnrichmentService.jsw

---

### get_external_matches

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns driver match results for an external partner query based on their search criteria. Returns anonymized profiles unless partner has Driver Search quota.
- **Parameters:**
  - `partner_id: string` — API partner ID
  - `filters: object` — `{ cdl_class, endorsements, min_experience_years, location, radius_miles }`
  - `limit: number` — max results (default 25)
- **Backend Service:** apiGatewayService.jsw → `getExternalMatches(partnerId, filters, limit)`
- **Airtable Collection(s):** `driverProfiles` → `v2_Driver Profiles`
- **Approval Required:** No
- **Dependencies:** driverMatching.jsw

---

### submit_match_request

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Submits an asynchronous match search request for large result sets. Returns a request ID for polling.
- **Parameters:**
  - `partner_id: string` — API partner ID
  - `filters: object` — match filter criteria
  - `webhook_url: string` — optional URL to receive results when ready
- **Backend Service:** apiGatewayService.jsw → `submitMatchRequest(partnerId, filters, webhookUrl)`
- **Airtable Collection(s):** `apiRequestLog` → `v2_API Request Log`
- **Approval Required:** No
- **Dependencies:** driverMatching.jsw

---

### get_match_status

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the status of an asynchronous match request: `pending`, `processing`, `complete`, or `failed`. When complete, returns the result URL.
- **Parameters:**
  - `request_id: string` — match request ID from `submit_match_request`
- **Backend Service:** apiGatewayService.jsw → `getMatchRequestStatus(requestId)`
- **Airtable Collection(s):** `apiRequestLog` → `v2_API Request Log`
- **Approval Required:** No
- **Dependencies:** None

---

### verify_document_external

- **Role:** admin
- **Risk Level:** execute_low
- **Description:** Submits a document image to the OCR verification pipeline. Returns an extraction ID for async retrieval.
- **Parameters:**
  - `partner_id: string` — API partner ID
  - `document_type: "cdl" | "medical_cert" | "hazmat_endorsement"` — document type
  - `image_url: string` — URL of the document image
- **Backend Service:** apiGatewayService.jsw → `submitDocumentVerification(partnerId, documentType, imageUrl)`
- **Airtable Collection(s):** `documentVerifications` → `v2_Document Verifications`
- **Approval Required:** No
- **Dependencies:** ocrService.jsw

---

### get_doc_verification_status

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns the current status and extracted data for a document verification job. Status is `processing`, `complete`, or `failed`.
- **Parameters:**
  - `extraction_id: string` — extraction job ID
- **Backend Service:** apiGatewayService.jsw → `getDocumentVerificationStatus(extractionId)`
- **Airtable Collection(s):** `documentVerifications` → `v2_Document Verifications`
- **Approval Required:** No
- **Dependencies:** None

---

### get_engagement_metrics

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns gamification engagement metrics for a partner's white-labeled users: active users, XP awarded, achievements unlocked, and streak distribution.
- **Parameters:**
  - `partner_id: string` — API partner ID
  - `period_days: number` — lookback window (default 30)
- **Backend Service:** apiGatewayService.jsw → `getEngagementMetrics(partnerId, periodDays)`
- **Airtable Collection(s):** `gamificationProfiles` → `v2_Gamification Profiles`
- **Approval Required:** No
- **Dependencies:** gamificationService.jsw

---

### get_user_activity_external

- **Role:** admin
- **Risk Level:** read
- **Description:** Returns gamification activity for a specific external user: level, XP, recent achievements, and current streak.
- **Parameters:**
  - `external_user_id: string` — partner's user identifier
  - `partner_id: string` — API partner ID
- **Backend Service:** apiGatewayService.jsw → `getExternalUserActivity(externalUserId, partnerId)`
- **Airtable Collection(s):** `gamificationProfiles` → `v2_Gamification Profiles`
- **Approval Required:** No
- **Dependencies:** gamificationService.jsw

---

## Appendix: Tool Count Summary

| Group | Tools | Risk Breakdown |
|---|---|---|
| Admin Business Ops | 15 | 8 read, 2 suggest, 3 execute_low, 2 execute_high |
| Admin Platform Config | 20 | 8 read, 2 suggest, 7 execute_low, 3 execute_high |
| Admin Portal | 20 | 11 read, 0 suggest, 5 execute_low, 4 execute_high |
| Admin Support Ops | 22 | 14 read, 1 suggest, 6 execute_low, 1 execute_high |
| Gamification | 20 | 11 read, 0 suggest, 7 execute_low, 2 execute_high |
| Feature Adoption | 8 | 5 read, 2 suggest, 1 execute_low, 0 execute_high |
| Cross-Role Utility | 12 | 8 read, 2 suggest, 2 execute_low, 0 execute_high |
| Observability | 12 | 10 read, 0 suggest, 2 execute_low, 0 execute_high |
| External API Platform | 18 | 12 read, 0 suggest, 6 execute_low, 0 execute_high |
| **TOTAL** | **147** | **87 read, 7 suggest, 39 execute_low, 12 execute_high** |

> **Approval gates (12 tools):** update_commission_rule, approve_commission, toggle_feature_flag, update_feature_flag_rules, conclude_ab_test, update_moderation_rules, update_ai_config, update_user_role, suspend_user, impersonate_user, reset_streak, complete_challenge, revoke_api_key
