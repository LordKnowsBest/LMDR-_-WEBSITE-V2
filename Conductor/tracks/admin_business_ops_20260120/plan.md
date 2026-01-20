# Track Plan: Admin Business Operations - Revenue & Billing Management

> **STATUS: PLANNED** - Ready for implementation
>
> **Last Updated**: 2026-01-20
>
> **Dependencies**:
> - `admin_portal_20251224` (base admin infrastructure)
> - `stripe_subscriptions_20260104` (Stripe integration)

---

## Phase 1: Revenue Dashboard

**Goal:** Give admins real-time visibility into platform financial health.

### 1.1 Data Infrastructure

- [ ] Task: Create `RevenueMetrics` collection in Wix with schema from spec
- [ ] Task: Create `recordDailyMetrics()` function in `adminBusinessService.jsw`
- [ ] Task: Add scheduled job `recordDailyMetrics` to run daily at midnight
- [ ] Task: Backfill historical revenue data from `CarrierSubscriptions` and `BillingHistory`
- [ ] Task: Create helper functions for MRR/ARR calculation from active subscriptions

### 1.2 Revenue Metrics API

- [ ] Task: Implement `getRevenueSnapshot()` - current MRR, ARR, subscriber counts
- [ ] Task: Implement `getMRRTrend(months)` - historical MRR data for charting
- [ ] Task: Implement `getRevenueByTier()` - breakdown by Pro/Enterprise/Placement
- [ ] Task: Implement `getCohortAnalysis(cohorts)` - subscriber retention by signup month
- [ ] Task: Implement `getChurnAnalysis(period)` - churn rate and reasons
- [ ] Task: Implement `getLTVByTier()` - lifetime value calculations

### 1.3 Revenue Dashboard UI

- [ ] Task: Create `ADMIN_REVENUE_DASHBOARD.html` in `src/public/admin/`
- [ ] Task: Implement KPI cards row (MRR, ARR, Churn Rate, Active Subs, ARPU, LTV)
- [ ] Task: Add comparison to last period (% change indicators)
- [ ] Task: Implement MRR trend chart (12-month line chart)
- [ ] Task: Implement revenue by tier chart (horizontal bar chart)
- [ ] Task: Implement cohort retention table
- [ ] Task: Implement churn breakdown panel
- [ ] Task: Add date range selector and refresh button
- [ ] Task: Add export to CSV functionality for all metrics

### 1.4 Velo Integration

- [ ] Task: Create admin page for Revenue Dashboard in Wix Editor
- [ ] Task: Add HTML component and wire up postMessage handlers
- [ ] Task: Implement data fetching and UI updates
- [ ] Task: Add navigation link in admin sidebar

### 1.5 Phase 1 Testing

- [ ] Task: Write unit tests for MRR/ARR calculations
- [ ] Task: Write unit tests for cohort analysis logic
- [ ] Task: Write unit tests for churn rate calculation
- [ ] Task: Test dashboard with sample data
- [ ] Task: Verify scheduled job executes correctly
- [ ] Task: Test export functionality

### 1.6 Phase 1 Verification

- [ ] Conductor: Verify all Phase 1 tasks complete
- [ ] Conductor: Verify dashboard displays correct metrics
- [ ] Conductor: Verify scheduled job running

---

## Phase 2: Billing Management

**Goal:** Enable admins to manage customer billing issues without leaving the platform.

### 2.1 Data Infrastructure

- [ ] Task: Create `BillingAdjustments` collection in Wix with schema from spec
- [ ] Task: Add `sales_rep_id` and `acquisition_source` fields to `CarrierSubscriptions`
- [ ] Task: Create indexes for efficient billing lookups

### 2.2 Billing API Implementation

- [ ] Task: Implement `searchBillingCustomer(query)` - search by DOT, name, email
- [ ] Task: Implement `getBillingDetails(carrierDot)` - full billing profile
- [ ] Task: Implement `applyCredit(carrierDot, amount, reason, adminId)`
- [ ] Task: Implement `processRefund(carrierDot, invoiceId, amount, reason, adminId)`
- [ ] Task: Implement `changeSubscriptionPlan(carrierDot, newPlan, immediate)`
- [ ] Task: Implement `pauseSubscription(carrierDot, days, reason)`
- [ ] Task: Implement `cancelSubscription(carrierDot, immediate, reason)`
- [ ] Task: Implement `getBillingAdjustments(carrierDot)`

### 2.3 Stripe Integration Extensions

- [ ] Task: Add Stripe API call for applying customer credits
- [ ] Task: Add Stripe API call for processing refunds
- [ ] Task: Add Stripe API call for subscription modifications
- [ ] Task: Add Stripe API call for fetching customer invoices
- [ ] Task: Handle Stripe API errors gracefully with user-friendly messages

### 2.4 Billing Management UI

- [ ] Task: Create `ADMIN_BILLING_MANAGEMENT.html` in `src/public/admin/`
- [ ] Task: Implement customer search bar with autocomplete
- [ ] Task: Implement customer details panel (carrier info, contact, status)
- [ ] Task: Implement subscription details section (plan, status, dates, usage)
- [ ] Task: Implement usage progress bar (views used/quota)
- [ ] Task: Implement action buttons (Change Plan, Credit, Pause, Cancel, Refund)
- [ ] Task: Implement billing history table with invoice links
- [ ] Task: Implement adjustments and notes section
- [ ] Task: Create modal dialogs for each action type
- [ ] Task: Add "Open in Stripe" link for direct access

### 2.5 Approval Workflow

- [ ] Task: Implement approval requirement for credits > $100
- [ ] Task: Implement approval requirement for refunds
- [ ] Task: Create pending approvals queue view
- [ ] Task: Add email notification to approvers
- [ ] Task: Implement approval/rejection with notes

### 2.6 Velo Integration

- [ ] Task: Create admin page for Billing Management in Wix Editor
- [ ] Task: Add HTML component and wire up postMessage handlers
- [ ] Task: Implement all action handlers
- [ ] Task: Add navigation link in admin sidebar

### 2.7 Audit Logging

- [ ] Task: Log all credit applications to `AdminAuditLog`
- [ ] Task: Log all refunds to `AdminAuditLog`
- [ ] Task: Log all plan changes to `AdminAuditLog`
- [ ] Task: Log all subscription pauses/cancellations to `AdminAuditLog`

### 2.8 Phase 2 Testing

- [ ] Task: Write unit tests for credit application
- [ ] Task: Write unit tests for refund processing
- [ ] Task: Write unit tests for plan changes
- [ ] Task: Test Stripe API integration with test mode
- [ ] Task: Test approval workflow end-to-end
- [ ] Task: Verify audit logs captured correctly

### 2.9 Phase 2 Verification

- [ ] Conductor: Verify all Phase 2 tasks complete
- [ ] Conductor: Verify billing actions work correctly
- [ ] Conductor: Verify audit trail complete

---

## Phase 3: Invoicing

**Goal:** Enable admins to generate and manage invoices for placement fees and custom billing.

### 3.1 Data Infrastructure

- [ ] Task: Create `Invoices` collection in Wix with schema from spec
- [ ] Task: Create invoice number sequence generator
- [ ] Task: Set up file storage for PDF invoices

### 3.2 Invoice API Implementation

- [ ] Task: Implement `getNextInvoiceNumber()` - sequential numbering (INV-YYYY-NNNN)
- [ ] Task: Implement `createInvoice(invoiceData)` - create draft invoice
- [ ] Task: Implement `updateInvoice(invoiceId, updates)` - modify draft
- [ ] Task: Implement `sendInvoice(invoiceId)` - send via email
- [ ] Task: Implement `generateInvoicePDF(invoiceId)` - create PDF
- [ ] Task: Implement `recordInvoicePayment(invoiceId, paymentDetails)` - mark paid
- [ ] Task: Implement `voidInvoice(invoiceId, reason)` - void invoice
- [ ] Task: Implement `getInvoices(filters)` - list with filters

### 3.3 PDF Generation

- [ ] Task: Design invoice PDF template (HTML-based)
- [ ] Task: Evaluate PDF generation options (html-pdf, Puppeteer, external service)
- [ ] Task: Implement PDF generation from invoice data
- [ ] Task: Store generated PDFs in Wix Media
- [ ] Task: Generate unique payment link for each invoice

### 3.4 Email Delivery

- [ ] Task: Create invoice email template
- [ ] Task: Implement email sending via Wix email API
- [ ] Task: Attach PDF to email
- [ ] Task: Track email delivery status
- [ ] Task: Create reminder email template for overdue invoices

### 3.5 Invoicing UI

- [ ] Task: Create `ADMIN_INVOICING.html` in `src/public/admin/`
- [ ] Task: Implement invoice list view with status filters
- [ ] Task: Implement invoice creation form
- [ ] Task: Implement carrier selector with autocomplete
- [ ] Task: Implement line items editor (add/remove/edit rows)
- [ ] Task: Implement discount application
- [ ] Task: Implement running total calculation
- [ ] Task: Implement PDF preview functionality
- [ ] Task: Implement send/save draft buttons
- [ ] Task: Implement invoice detail view
- [ ] Task: Implement payment recording modal
- [ ] Task: Implement void confirmation dialog

### 3.6 Automated Invoice Features

- [ ] Task: Auto-generate invoice on placement completion
- [ ] Task: Add scheduled job to mark invoices overdue
- [ ] Task: Send automatic reminder emails for overdue invoices
- [ ] Task: Create overdue invoice report

### 3.7 Velo Integration

- [ ] Task: Create admin page for Invoicing in Wix Editor
- [ ] Task: Add HTML component and wire up postMessage handlers
- [ ] Task: Implement all invoice action handlers
- [ ] Task: Add navigation link in admin sidebar

### 3.8 Phase 3 Testing

- [ ] Task: Write unit tests for invoice number generation
- [ ] Task: Write unit tests for total calculations
- [ ] Task: Write unit tests for status transitions
- [ ] Task: Test PDF generation with sample data
- [ ] Task: Test email delivery
- [ ] Task: Test payment recording flow
- [ ] Task: Test overdue automation

### 3.9 Phase 3 Verification

- [ ] Conductor: Verify all Phase 3 tasks complete
- [ ] Conductor: Verify invoice workflow end-to-end
- [ ] Conductor: Verify PDF generation and email delivery

---

## Phase 4: Commission Tracking

**Goal:** Track and manage sales rep commissions on subscription and placement deals.

### 4.1 Data Infrastructure

- [ ] Task: Create `Commissions` collection in Wix with schema from spec
- [ ] Task: Create `SalesReps` collection in Wix with schema from spec
- [ ] Task: Create `CommissionRules` collection in Wix with schema from spec
- [ ] Task: Seed initial commission rules based on spec

### 4.2 Commission Rules Engine

- [ ] Task: Implement `getCommissionRules()` - fetch active rules
- [ ] Task: Implement `saveCommissionRule(rule)` - create/update rules
- [ ] Task: Implement rule matching logic (conditions, priority)
- [ ] Task: Implement rate calculation with tier bonuses
- [ ] Task: Implement `processAutoCommission(eventType, dealData)` - auto-calculate

### 4.3 Sales Rep Management

- [ ] Task: Implement `getSalesReps(activeOnly)` - list reps
- [ ] Task: Implement `saveSalesRep(rep)` - create/update rep
- [ ] Task: Implement rep assignment to carriers/deals
- [ ] Task: Track rep performance metrics (deals, revenue, earnings)

### 4.4 Commission Tracking API

- [ ] Task: Implement `getCommissionSummary(period)` - period totals
- [ ] Task: Implement `getSalesLeaderboard(period)` - ranked rep list
- [ ] Task: Implement `getRepCommissions(repId, filters)` - rep detail
- [ ] Task: Implement `recordCommission(commissionData)` - manual entry
- [ ] Task: Implement `approveCommission(commissionId, adminId)` - approve
- [ ] Task: Implement `generatePayoutReport(period)` - payout summary
- [ ] Task: Implement `markCommissionsPaid(commissionIds, payoutReference)`

### 4.5 Webhook Integration

- [ ] Task: Add commission processing to `checkout.session.completed` handler
- [ ] Task: Add commission processing to `customer.subscription.updated` (upgrades)
- [ ] Task: Add commission processing for placement completions
- [ ] Task: Add commission processing for renewals (`invoice.paid`)

### 4.6 Commission Tracking UI

- [ ] Task: Create `ADMIN_COMMISSIONS.html` in `src/public/admin/`
- [ ] Task: Implement summary cards (Total Earned, Pending, Paid)
- [ ] Task: Implement leaderboard table with rankings
- [ ] Task: Implement recent commissions table
- [ ] Task: Implement commission detail modal
- [ ] Task: Implement manual commission entry form
- [ ] Task: Implement bulk approval functionality
- [ ] Task: Implement payout report generation
- [ ] Task: Implement commission rules editor
- [ ] Task: Implement sales rep management section
- [ ] Task: Add export to CSV for payout processing

### 4.7 Payout Processing

- [ ] Task: Implement hold period enforcement (30 days)
- [ ] Task: Generate payout batches by payment method
- [ ] Task: Create payout confirmation workflow
- [ ] Task: Track payout references (check #, transfer ID)

### 4.8 Velo Integration

- [ ] Task: Create admin page for Commission Tracking in Wix Editor
- [ ] Task: Add HTML component and wire up postMessage handlers
- [ ] Task: Implement all commission action handlers
- [ ] Task: Add navigation link in admin sidebar

### 4.9 Phase 4 Testing

- [ ] Task: Write unit tests for commission rule matching
- [ ] Task: Write unit tests for rate calculations
- [ ] Task: Write unit tests for auto-commission processing
- [ ] Task: Test leaderboard calculations
- [ ] Task: Test payout report generation
- [ ] Task: Test webhook integration with commission processing
- [ ] Task: Test hold period enforcement

### 4.10 Phase 4 Verification

- [ ] Conductor: Verify all Phase 4 tasks complete
- [ ] Conductor: Verify auto-commission on deals
- [ ] Conductor: Verify payout workflow

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

- [ ] All tasks completed with checkmarks
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Code reviewed and documented
- [ ] Audit logging verified
- [ ] Security review (role-based access)
- [ ] Manual QA completed
- [ ] No console errors in browser
- [ ] Performance acceptable (<2s page load)

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

## Notes

- Phase 1 can be started immediately as it primarily reads existing data
- Phase 2 requires careful Stripe API testing in test mode before production
- Phase 3 PDF generation may require external service evaluation
- Phase 4 webhook integration must be thoroughly tested to avoid duplicate commissions
- All phases should maintain backward compatibility with existing admin portal

---

## Estimated Timeline

| Phase | Effort | Duration |
|-------|--------|----------|
| Phase 1: Revenue Dashboard | Medium | 1 week |
| Phase 2: Billing Management | High | 1.5 weeks |
| Phase 3: Invoicing | High | 1.5 weeks |
| Phase 4: Commission Tracking | Medium | 1 week |
| **Total** | | **5 weeks** |

---

## Success Criteria

- [ ] Admins can view real-time MRR/ARR without checking Stripe
- [ ] Billing issues resolved 60% faster than before
- [ ] Custom invoices generated in under 2 minutes
- [ ] Sales commissions calculated automatically with 100% accuracy
- [ ] Full audit trail for all financial operations
- [ ] Zero manual spreadsheet work for commission tracking
