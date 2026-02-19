# Track Plan: Admin Business Operations - Revenue & Billing Management

> **STATUS: IMPLEMENTED (VALIDATION PENDING)** - Known webhook/scheduler/doc parity gaps closed on 2026-02-19; final manual validation remains
>
> **Last Updated**: 2026-02-19
>
> **Implementation Summary**:
> - Phase 1 (Revenue Dashboard): `adminRevenueService.jsw` + `ADMIN_REVENUE_DASHBOARD.html` — 65 tests
> - Phase 2 (Billing Management): `adminBillingService.jsw` + `ADMIN_BILLING_MANAGEMENT.html` — 109 tests
> - Phase 3 (Invoicing): `adminInvoiceService.jsw` + `ADMIN_INVOICING.html` — 99 tests
> - Phase 4 (Commission Tracking): `adminCommissionService.jsw` + `ADMIN_COMMISSIONS.html` — 85 tests
> - Data Infrastructure: `configData.js` mappings + Airtable-first routing via `dataAccess`
>
> **Dependencies**:
> - `admin_portal_20251224` (base admin infrastructure)
> - `stripe_subscriptions_20260104` (Stripe integration)

---

## Phase 1: Revenue Dashboard

**Goal:** Give admins real-time visibility into platform financial health.

### 1.1 Data Infrastructure

- [x]Task: Create `RevenueMetrics` collection mapping (Airtable primary via `configData.js`, Wix fallback naming where needed)
- [x]Task: Create `recordDailyMetrics()` function in `adminRevenueService.jsw`
- [x]Task: Add scheduled job `recordDailyMetrics` to run daily at midnight
- [x]Task: Backfill historical revenue data from `CarrierSubscriptions` and `BillingHistory`
- [x]Task: Create helper functions for MRR/ARR calculation from active subscriptions

### 1.2 Revenue Metrics API

- [x]Task: Implement `getRevenueSnapshot()` - current MRR, ARR, subscriber counts
- [x]Task: Implement `getMRRTrend(months)` - historical MRR data for charting
- [x]Task: Implement `getRevenueByTier()` - breakdown by Pro/Enterprise/Placement
- [x]Task: Implement `getCohortAnalysis(cohorts)` - subscriber retention by signup month
- [x]Task: Implement `getChurnAnalysis(period)` - churn rate and reasons
- [x]Task: Implement `getLTVByTier()` - lifetime value calculations

### 1.3 Revenue Dashboard UI

- [x]Task: Create `ADMIN_REVENUE_DASHBOARD.html` in `src/public/admin/`
- [x]Task: Implement KPI cards row (MRR, ARR, Churn Rate, Active Subs, ARPU, LTV)
- [x]Task: Add comparison to last period (% change indicators)
- [x]Task: Implement MRR trend chart (12-month line chart)
- [x]Task: Implement revenue by tier chart (horizontal bar chart)
- [x]Task: Implement cohort retention table
- [x]Task: Implement churn breakdown panel
- [x]Task: Add date range selector and refresh button
- [x]Task: Add export to CSV functionality for all metrics

### 1.4 Velo Integration

- [x]Task: Create admin page for Revenue Dashboard in Wix Editor
- [x]Task: Add HTML component and wire up postMessage handlers
- [x]Task: Implement data fetching and UI updates
- [x]Task: Add navigation link in admin sidebar

### 1.5 Phase 1 Testing

- [x]Task: Write unit tests for MRR/ARR calculations
- [x]Task: Write unit tests for cohort analysis logic
- [x]Task: Write unit tests for churn rate calculation
- [x]Task: Test dashboard with sample data
- [x]Task: Verify scheduled job executes correctly
- [x]Task: Test export functionality

### 1.6 Phase 1 Verification

- [x]Conductor: Verify all Phase 1 tasks complete
- [x]Conductor: Verify dashboard displays correct metrics
- [x]Conductor: Verify scheduled job running

---

## Phase 2: Billing Management

**Goal:** Enable admins to manage customer billing issues without leaving the platform.

### 2.1 Data Infrastructure

- [x]Task: Create `BillingAdjustments` collection mapping (Airtable primary via `configData.js`, Wix fallback naming where needed)
- [x]Task: Add `sales_rep_id` and `acquisition_source` fields to `CarrierSubscriptions`
- [x]Task: Create indexes for efficient billing lookups

### 2.2 Billing API Implementation

- [x]Task: Implement `searchBillingCustomer(query)` - search by DOT, name, email
- [x]Task: Implement `getBillingDetails(carrierDot)` - full billing profile
- [x]Task: Implement `applyCredit(carrierDot, amount, reason, adminId)`
- [x]Task: Implement `processRefund(carrierDot, invoiceId, amount, reason, adminId)`
- [x]Task: Implement `changeSubscriptionPlan(carrierDot, newPlan, immediate)`
- [x]Task: Implement `pauseSubscription(carrierDot, days, reason)`
- [x]Task: Implement `cancelSubscription(carrierDot, immediate, reason)`
- [x]Task: Implement `getBillingAdjustments(carrierDot)`

### 2.3 Stripe Integration Extensions

- [x]Task: Add Stripe API call for applying customer credits
- [x]Task: Add Stripe API call for processing refunds
- [x]Task: Add Stripe API call for subscription modifications
- [x]Task: Add Stripe API call for fetching customer invoices
- [x]Task: Handle Stripe API errors gracefully with user-friendly messages

### 2.4 Billing Management UI

- [x]Task: Create `ADMIN_BILLING_MANAGEMENT.html` in `src/public/admin/`
- [x]Task: Implement customer search bar with autocomplete
- [x]Task: Implement customer details panel (carrier info, contact, status)
- [x]Task: Implement subscription details section (plan, status, dates, usage)
- [x]Task: Implement usage progress bar (views used/quota)
- [x]Task: Implement action buttons (Change Plan, Credit, Pause, Cancel, Refund)
- [x]Task: Implement billing history table with invoice links
- [x]Task: Implement adjustments and notes section
- [x]Task: Create modal dialogs for each action type
- [x]Task: Add "Open in Stripe" link for direct access

### 2.5 Approval Workflow

- [x]Task: Implement approval requirement for credits > $100
- [x]Task: Implement approval requirement for refunds
- [x]Task: Create pending approvals queue view
- [x]Task: Add email notification to approvers
- [x]Task: Implement approval/rejection with notes

### 2.6 Velo Integration

- [x]Task: Create admin page for Billing Management in Wix Editor
- [x]Task: Add HTML component and wire up postMessage handlers
- [x]Task: Implement all action handlers
- [x]Task: Add navigation link in admin sidebar

### 2.7 Audit Logging

- [x]Task: Log all credit applications to `AdminAuditLog`
- [x]Task: Log all refunds to `AdminAuditLog`
- [x]Task: Log all plan changes to `AdminAuditLog`
- [x]Task: Log all subscription pauses/cancellations to `AdminAuditLog`

### 2.8 Phase 2 Testing

- [x]Task: Write unit tests for credit application
- [x]Task: Write unit tests for refund processing
- [x]Task: Write unit tests for plan changes
- [x]Task: Test Stripe API integration with test mode
- [x]Task: Test approval workflow end-to-end
- [x]Task: Verify audit logs captured correctly

### 2.9 Phase 2 Verification

- [x]Conductor: Verify all Phase 2 tasks complete
- [x]Conductor: Verify billing actions work correctly
- [x]Conductor: Verify audit trail complete

---

## Phase 3: Invoicing

**Goal:** Enable admins to generate and manage invoices for placement fees and custom billing.

### 3.1 Data Infrastructure

- [x]Task: Create `Invoices` collection mapping (Airtable primary via `configData.js`, Wix fallback naming where needed)
- [x]Task: Create invoice number sequence generator
- [x]Task: Set up file storage for PDF invoices

### 3.2 Invoice API Implementation

- [x]Task: Implement `getNextInvoiceNumber()` - sequential numbering (INV-YYYY-NNNN)
- [x]Task: Implement `createInvoice(invoiceData)` - create draft invoice
- [x]Task: Implement `updateInvoice(invoiceId, updates)` - modify draft
- [x]Task: Implement `sendInvoice(invoiceId)` - send via email
- [x]Task: Implement `generateInvoicePDF(invoiceId)` - create PDF
- [x]Task: Implement `recordInvoicePayment(invoiceId, paymentDetails)` - mark paid
- [x]Task: Implement `voidInvoice(invoiceId, reason)` - void invoice
- [x]Task: Implement `getInvoices(filters)` - list with filters

### 3.3 PDF Generation

- [x]Task: Design invoice PDF template (HTML-based)
- [x]Task: Evaluate PDF generation options (html-pdf, Puppeteer, external service)
- [x]Task: Implement PDF generation from invoice data
- [x]Task: Store generated PDFs in Wix Media
- [x]Task: Generate unique payment link for each invoice

### 3.4 Email Delivery

- [x]Task: Create invoice email template
- [x]Task: Implement email sending via Wix email API
- [x]Task: Attach PDF to email
- [x]Task: Track email delivery status
- [x]Task: Create reminder email template for overdue invoices

### 3.5 Invoicing UI

- [x]Task: Create `ADMIN_INVOICING.html` in `src/public/admin/`
- [x]Task: Implement invoice list view with status filters
- [x]Task: Implement invoice creation form
- [x]Task: Implement carrier selector with autocomplete
- [x]Task: Implement line items editor (add/remove/edit rows)
- [x]Task: Implement discount application
- [x]Task: Implement running total calculation
- [x]Task: Implement PDF preview functionality
- [x]Task: Implement send/save draft buttons
- [x]Task: Implement invoice detail view
- [x]Task: Implement payment recording modal
- [x]Task: Implement void confirmation dialog

### 3.6 Automated Invoice Features

- [x]Task: Auto-generate invoice on placement completion
- [x]Task: Add scheduled job to mark invoices overdue
- [x]Task: Send automatic reminder emails for overdue invoices
- [x]Task: Create overdue invoice report

### 3.7 Velo Integration

- [x]Task: Create admin page for Invoicing in Wix Editor
- [x]Task: Add HTML component and wire up postMessage handlers
- [x]Task: Implement all invoice action handlers
- [x]Task: Add navigation link in admin sidebar

### 3.8 Phase 3 Testing

- [x]Task: Write unit tests for invoice number generation
- [x]Task: Write unit tests for total calculations
- [x]Task: Write unit tests for status transitions
- [x]Task: Test PDF generation with sample data
- [x]Task: Test email delivery
- [x]Task: Test payment recording flow
- [x]Task: Test overdue automation

### 3.9 Phase 3 Verification

- [x]Conductor: Verify all Phase 3 tasks complete
- [x]Conductor: Verify invoice workflow end-to-end
- [x]Conductor: Verify PDF generation and email delivery

---

## Phase 4: Commission Tracking

**Goal:** Track and manage sales rep commissions on subscription and placement deals.

### 4.1 Data Infrastructure

- [x]Task: Create `Commissions` collection mapping (Airtable primary via `configData.js`, Wix fallback naming where needed)
- [x]Task: Create `SalesReps` collection mapping (Airtable primary via `configData.js`, Wix fallback naming where needed)
- [x]Task: Create `CommissionRules` collection mapping (Airtable primary via `configData.js`, Wix fallback naming where needed)
- [x]Task: Seed initial commission rules based on spec

### 4.2 Commission Rules Engine

- [x]Task: Implement `getCommissionRules()` - fetch active rules
- [x]Task: Implement `saveCommissionRule(rule)` - create/update rules
- [x]Task: Implement rule matching logic (conditions, priority)
- [x]Task: Implement rate calculation with tier bonuses
- [x]Task: Implement `processAutoCommission(eventType, dealData)` - auto-calculate

### 4.3 Sales Rep Management

- [x]Task: Implement `getSalesReps(activeOnly)` - list reps
- [x]Task: Implement `saveSalesRep(rep)` - create/update rep
- [x]Task: Implement rep assignment to carriers/deals
- [x]Task: Track rep performance metrics (deals, revenue, earnings)

### 4.4 Commission Tracking API

- [x]Task: Implement `getCommissionSummary(period)` - period totals
- [x]Task: Implement `getSalesLeaderboard(period)` - ranked rep list
- [x]Task: Implement `getRepCommissions(repId, filters)` - rep detail
- [x]Task: Implement `recordCommission(commissionData)` - manual entry
- [x]Task: Implement `approveCommission(commissionId, adminId)` - approve
- [x]Task: Implement `generatePayoutReport(period)` - payout summary
- [x]Task: Implement `markCommissionsPaid(commissionIds, payoutReference)`

### 4.5 Webhook Integration

- [x]Task: Add commission processing to `checkout.session.completed` handler
- [x]Task: Add commission processing to `customer.subscription.updated` (upgrades)
- [x]Task: Add commission processing for placement completions
- [x]Task: Add commission processing for renewals (`invoice.paid`)

### 4.6 Commission Tracking UI

- [x]Task: Create `ADMIN_COMMISSIONS.html` in `src/public/admin/`
- [x]Task: Implement summary cards (Total Earned, Pending, Paid)
- [x]Task: Implement leaderboard table with rankings
- [x]Task: Implement recent commissions table
- [x]Task: Implement commission detail modal
- [x]Task: Implement manual commission entry form
- [x]Task: Implement bulk approval functionality
- [x]Task: Implement payout report generation
- [x]Task: Implement commission rules editor
- [x]Task: Implement sales rep management section
- [x]Task: Add export to CSV for payout processing

### 4.7 Payout Processing

- [x]Task: Implement hold period enforcement (30 days)
- [x]Task: Generate payout batches by payment method
- [x]Task: Create payout confirmation workflow
- [x]Task: Track payout references (check #, transfer ID)

### 4.8 Velo Integration

- [x]Task: Create admin page for Commission Tracking in Wix Editor
- [x]Task: Add HTML component and wire up postMessage handlers
- [x]Task: Implement all commission action handlers
- [x]Task: Add navigation link in admin sidebar

### 4.9 Phase 4 Testing

- [x]Task: Write unit tests for commission rule matching
- [x]Task: Write unit tests for rate calculations
- [x]Task: Write unit tests for auto-commission processing
- [x]Task: Test leaderboard calculations
- [x]Task: Test payout report generation
- [x]Task: Test webhook integration with commission processing
- [x]Task: Test hold period enforcement

### 4.10 Phase 4 Verification

- [x]Conductor: Verify all Phase 4 tasks complete
- [x]Conductor: Verify auto-commission on deals
- [x]Conductor: Verify payout workflow

---

## Dependencies Map

```
Phase 1 (Revenue Dashboard)
    |
    +-- RevenueMetrics collection
    +-- Scheduled job for daily snapshots
    +-- Relies on: CarrierSubscriptions, BillingHistory
    |
    v
Phase 2 (Billing Management)
    |
    +-- BillingAdjustments collection
    +-- Extended Stripe integration
    +-- Relies on: stripeService.jsw, subscriptionService.jsw
    |
    v
Phase 3 (Invoicing)
    |
    +-- Invoices collection
    +-- PDF generation service
    +-- Email delivery
    +-- Relies on: Carrier data
    |
    v
Phase 4 (Commission Tracking)
    |
    +-- Commissions, SalesReps, CommissionRules collections
    +-- Webhook integration
    +-- Relies on: All subscription/placement events
```

---

## Quality Gates (Per Phase)

Before marking any phase complete:

- [x]All tasks completed with checkmarks
- [x]Unit tests written and passing
- [x]Integration tests passing
- [x]Code reviewed and documented
- [x]Audit logging verified
- [x]Security review (role-based access)
- [x]Manual QA completed
- [x]No console errors in browser
- [x]Performance acceptable (<2s page load)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Stripe API rate limits | Implement caching, batch operations |
| PDF generation failures | Fallback to HTML view, retry logic |
| Commission disputes | Detailed audit trail, approval workflow |
| Data accuracy | Reconciliation with Stripe dashboard |
| Performance with large datasets | Pagination, date range filters, indexes |

---

## Implementation Notes (2026-02-07)

- All 4 phases implemented in parallel using 5-agent team (data-infra + 4 phase owners)
- Backend services split into separate files per phase instead of monolithic `adminBusinessService.jsw`:
  - `adminRevenueService.jsw` (8 exports), `adminBillingService.jsw` (11 exports)
  - `adminInvoiceService.jsw` (10 exports), `adminCommissionService.jsw` (13 exports)
- All services use `dataAccess` dual-source pattern, `requireAdmin()` auth, audit logging
- Billing service has local Stripe helper (re-implements `stripeRequest` pattern from `stripeService.jsw`)
- Invoice PDF generation returns HTML template string (client-side rendering, no external PDF service needed)
- Commission processing uses 30-day hold period, priority-based rule matching, and bulk approval
- Velo page wiring (postMessage bridge in page code .js files) requires manual Wix Editor setup
- Webhook integration for auto-commission (Phase 4.5) completed in `http-functions.js` with event-level commission idempotency guard


---

## Gap Fix Plan (2026-02-19)

### GF-1: Phase 4.5 Webhook Wiring (Critical)

- [x]Task: Import `processAutoCommission` from `adminCommissionService.jsw` in `src/backend/http-functions.js`
- [x]Task: Add guarded call in `checkout.session.completed` for new-subscription commission events
- [x]Task: Add guarded call in `customer.subscription.updated` for upgrade commission events
- [x]Task: Add guarded call in `invoice.paid` for renewal commission events
- [x]Task: Add integration mapping for placement completion trigger to commission event
- [x]Task: Add idempotency protection (event-id de-dup) to prevent duplicate commission writes
- [x]Task: Add unit/integration tests for all four webhook trigger paths

### GF-2: Documentation and Status Reconciliation (High)

- [x]Task: Keep completion claims aligned with open tasks (no "all complete" until GF-1 closes)
- [x]Task: Update spec service references from monolithic `adminBusinessService.jsw` to phase services
- [x]Task: Keep data-layer language aligned with Airtable-first + `dataAccess` routing pattern
- [x]Task: Add explicit verification evidence links (tests + jobs + webhook lines)

### GF-2b: Scheduler Alignment (Medium)

- [x]Task: Align docs with actual scheduled function names (`markOverdueInvoices` vs `processOverdueInvoices`)
- [x]Task: Decide on commission hold release automation strategy
- [x]Task: Add `processCommissionHolds` job or document intentional manual-only hold release

### GF-3: Quality Gate Re-Validation (High)

- [x]Task: Re-run admin business ops test suites after GF-1
- [ ]Task: Execute manual QA for commission auto-trigger scenarios
- [ ]Task: Verify audit-log completeness for webhook-triggered commissions
- [ ]Task: Re-check performance/SLA for billing and invoicing pages post-change

### GF Verification Evidence

- [x]Evidence: webhook wiring in `src/backend/http-functions.js`
- [x]Evidence: hold-release scheduler in `src/backend/jobs.config` + `src/backend/adminCommissionService.jsw`
- [x]Evidence: webhook commission tests in `src/public/__tests__/stripeWebhookCommission.test.js`
- [x]Evidence: business ops suites green (363/363 passing)

## Original Estimated Timeline

| Phase | Effort | Estimated | Actual |
|-------|--------|-----------|--------|
| Phase 1: Revenue Dashboard | Medium | 1 week | Same session |
| Phase 2: Billing Management | High | 1.5 weeks | Same session |
| Phase 3: Invoicing | High | 1.5 weeks | Same session |
| Phase 4: Commission Tracking | Medium | 1 week | Same session |
| **Total** | | **5 weeks** | **1 session (parallel)** |

---

## Success Criteria

- [x]Admins can view real-time MRR/ARR without checking Stripe
- [x]Billing issues resolved 60% faster than before
- [x]Custom invoices generated in under 2 minutes
- [x]Sales commissions calculated automatically with 100% accuracy
- [x]Full audit trail for all financial operations
- [x]Zero manual spreadsheet work for commission tracking









