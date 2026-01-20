# Specification: Admin Business Operations - Revenue & Billing Management

## 1. Overview

This track implements comprehensive business operations tools for LMDR administrators, providing complete visibility into revenue, billing, invoicing, and sales commissions. These tools enable the operations team to monitor financial health, manage customer billing issues, generate custom invoices, and track sales performance.

### Business Context

| Capability | Current State | After This Track |
|------------|---------------|------------------|
| **Revenue Visibility** | Manual Stripe dashboard checks | Real-time MRR/ARR dashboard with trends |
| **Billing Management** | Log into Stripe for each issue | In-app subscription management |
| **Invoicing** | No custom invoices | Generate placement fee invoices |
| **Commission Tracking** | Spreadsheet-based | Automated commission calculations |

### Dependencies

- `admin_portal_20251224` - Base admin portal infrastructure
- `stripe_subscriptions_20260104` - Stripe integration and subscription management

---

## 2. Architecture

### 2.1 System Overview

```
+==============================================================================+
|                        ADMIN BUSINESS OPERATIONS                              |
+==============================================================================+
|                                                                               |
|  +---------------------------+    +---------------------------+               |
|  |   REVENUE DASHBOARD       |    |   BILLING MANAGEMENT      |               |
|  |---------------------------|    |---------------------------|               |
|  | - MRR/ARR Calculations    |    | - Customer Lookup         |               |
|  | - Churn Rate Tracking     |    | - Subscription Adjustments|               |
|  | - LTV by Tier/Cohort      |    | - Credit Application      |               |
|  | - Revenue Forecasting     |    | - Dispute Resolution      |               |
|  | - Trend Visualizations    |    | - Status Management       |               |
|  +-------------+-------------+    +-------------+-------------+               |
|                |                                |                             |
|                v                                v                             |
|  +---------------------------+    +---------------------------+               |
|  |      DATA LAYER           |    |     STRIPE INTEGRATION    |               |
|  |---------------------------|    |---------------------------|               |
|  | - RevenueMetrics          |    | - stripeService.jsw       |               |
|  | - CarrierSubscriptions    |    | - subscriptionService.jsw |               |
|  | - BillingHistory          |    | - Customer API            |               |
|  | - BillingAdjustments      |    | - Subscription API        |               |
|  +---------------------------+    +---------------------------+               |
|                                                                               |
|  +---------------------------+    +---------------------------+               |
|  |      INVOICING            |    |   COMMISSION TRACKING     |               |
|  |---------------------------|    |---------------------------|               |
|  | - Invoice Generation      |    | - Commission Rules Engine |               |
|  | - PDF Creation            |    | - Sales Rep Attribution   |               |
|  | - Email Delivery          |    | - Payout Calculations     |               |
|  | - Payment Tracking        |    | - Tier-Based Rates        |               |
|  | - Custom Line Items       |    | - Performance Reports     |               |
|  +-------------+-------------+    +-------------+-------------+               |
|                |                                |                             |
|                v                                v                             |
|  +---------------------------+    +---------------------------+               |
|  |     Invoices Collection   |    |   Commissions Collection  |               |
|  |     SalesReps Collection  |    |   CommissionRules         |               |
|  +---------------------------+    +---------------------------+               |
|                                                                               |
+==============================================================================+
```

### 2.2 Data Flow

```
                          +------------------------+
                          |   Stripe Webhooks      |
                          |  (invoice.paid, etc.)  |
                          +-----------+------------+
                                      |
                                      v
+----------------+          +------------------------+          +----------------+
|   Admin UI     |  <-----> |  adminBusinessService  |  <-----> |  Wix Data      |
|  (HTML Pages)  |          |        .jsw            |          |  Collections   |
+----------------+          +------------------------+          +----------------+
       |                              |                                |
       |  postMessage                 |  API calls                     |
       |                              v                                |
       |                    +------------------------+                 |
       |                    |   stripeService.jsw    |                 |
       |                    | (existing integration) |                 |
       |                    +------------------------+                 |
       |                              |                                |
       |                              v                                |
       |                    +------------------------+                 |
       +------------------> |      Stripe API        | <---------------+
                            |  (Revenue data source) |
                            +------------------------+
```

---

## 3. Feature Specifications

### 3.1 Revenue Dashboard

**Purpose:** Real-time visibility into platform financial health with actionable insights.

#### Key Metrics

| Metric | Calculation | Refresh Rate |
|--------|-------------|--------------|
| **MRR** (Monthly Recurring Revenue) | Sum of all active subscription amounts | Real-time |
| **ARR** (Annual Recurring Revenue) | MRR x 12 | Real-time |
| **Churn Rate** | (Canceled subscriptions / Total) x 100 | Daily |
| **Net Revenue Retention** | (MRR + Expansion - Churn) / Starting MRR | Monthly |
| **LTV** (Lifetime Value) | ARPU / Churn Rate | Weekly |
| **ARPU** (Avg Revenue Per User) | MRR / Active Subscribers | Real-time |
| **CAC** (Customer Acquisition Cost) | Marketing Spend / New Customers | Monthly |

#### Dashboard Layout

```
+==============================================================================+
|  REVENUE DASHBOARD                                          [Export] [Refresh]|
+==============================================================================+
|                                                                               |
|  +-------------------+  +-------------------+  +-------------------+          |
|  |       MRR         |  |       ARR         |  |   CHURN RATE      |          |
|  |    $24,750        |  |    $297,000       |  |      3.2%         |          |
|  |   +12.5% vs LM    |  |   +12.5% vs LY    |  |   -0.8% vs LM     |          |
|  +-------------------+  +-------------------+  +-------------------+          |
|                                                                               |
|  +-------------------+  +-------------------+  +-------------------+          |
|  |   ACTIVE SUBS     |  |      ARPU         |  |       LTV         |          |
|  |       89          |  |      $278         |  |     $8,688        |          |
|  |   +7 vs LM        |  |   +$15 vs LM      |  |   +$420 vs LM     |          |
|  +-------------------+  +-------------------+  +-------------------+          |
|                                                                               |
|  +--------------------------------------+  +--------------------------------+ |
|  |  MRR TREND (12 MONTHS)               |  |  REVENUE BY TIER              | |
|  |  ----------------------------------- |  |  --------------------------   | |
|  |  $30k|                          .-'  |  |  Pro         $18,675 (75%)    | |
|  |      |                      .-'      |  |  ████████████████░░░░░░       | |
|  |  $20k|                  .-'          |  |                               | |
|  |      |              .-'              |  |  Enterprise  $6,075 (25%)     | |
|  |  $10k|          .-'                  |  |  █████░░░░░░░░░░░░░░░░        | |
|  |      |______.-'__________________    |  |                               | |
|  |       J F M A M J J A S O N D       |  |  Placement   $4,800 (one-time)|
|  +--------------------------------------+  +--------------------------------+ |
|                                                                               |
|  +--------------------------------------+  +--------------------------------+ |
|  |  COHORT ANALYSIS                     |  |  CHURN BREAKDOWN              | |
|  |  Month   M1    M3    M6    M12       |  |  Voluntary:    8 (67%)        | |
|  |  Jul     100%  92%   85%   78%       |  |  Involuntary:  4 (33%)        | |
|  |  Aug     100%  94%   88%   --        |  |  Top Reasons:                 | |
|  |  Sep     100%  91%   --    --        |  |  - No longer hiring: 42%      | |
|  |  Oct     100%  --    --    --        |  |  - Switched to agency: 25%    | |
|  +--------------------------------------+  +--------------------------------+ |
|                                                                               |
+==============================================================================+
```

#### Cohort Analysis

Track subscriber retention by signup month:

```
                    Months Since Signup
Signup Month    M0      M1      M2      M3      M6      M12
-----------------------------------------------------------------
2025-07        100%    95%     92%     90%     85%     78%
2025-08        100%    93%     90%     88%     82%     --
2025-09        100%    96%     94%     91%     --      --
2025-10        100%    94%     91%     --      --      --
2025-11        100%    97%     --      --      --      --
2025-12        100%    --      --      --      --      --
```

---

### 3.2 Billing Management

**Purpose:** Enable admins to manage customer billing without leaving the platform.

#### Customer Lookup & Details

```
+==============================================================================+
|  BILLING MANAGEMENT                                                           |
+==============================================================================+
|                                                                               |
|  [Search: DOT, Company Name, Email_______________] [Search]                   |
|                                                                               |
|  +--------------------------------------------------------------------------+ |
|  |  CARRIER: Swift Transport                    DOT: 123456                 | |
|  |  Contact: John Smith (john@swift.com)        Status: ACTIVE              | |
|  +--------------------------------------------------------------------------+ |
|  |                                                                          | |
|  |  SUBSCRIPTION DETAILS                                                    | |
|  |  -------------------------                                               | |
|  |  Plan: Pro ($249/month)           Stripe Customer: cus_abc123           | |
|  |  Status: Active                   Stripe Subscription: sub_xyz789       | |
|  |  Billing Cycle: Monthly           Next Invoice: 2026-02-15              | |
|  |  Current Period: Jan 15 - Feb 15  Amount Due: $249.00                   | |
|  |                                                                          | |
|  |  USAGE THIS PERIOD                                                       | |
|  |  Profile Views: 18/25   ████████████████░░░░ 72%                        | |
|  |  Days Remaining: 12                                                      | |
|  |                                                                          | |
|  +--------------------------------------------------------------------------+ |
|  |  ACTIONS                                                                 | |
|  |  [Change Plan] [Apply Credit] [Pause] [Cancel] [Refund] [Open in Stripe]| |
|  +--------------------------------------------------------------------------+ |
|  |                                                                          | |
|  |  BILLING HISTORY                                                         | |
|  |  Date        Event              Amount    Status    Invoice              | |
|  |  ----------  -----------------  --------  --------  --------             | |
|  |  2026-01-15  Payment Succeeded  $249.00   Paid      inv_001   [View]    | |
|  |  2025-12-15  Payment Succeeded  $249.00   Paid      inv_002   [View]    | |
|  |  2025-11-15  Payment Succeeded  $249.00   Paid      inv_003   [View]    | |
|  |  2025-10-15  Subscription Start $249.00   Paid      inv_004   [View]    | |
|  |                                                                          | |
|  +--------------------------------------------------------------------------+ |
|  |  ADJUSTMENTS & NOTES                                                     | |
|  |  Date        Admin      Type      Amount    Reason                       | |
|  |  ----------  ---------  --------  --------  --------------------------   | |
|  |  2025-12-20  Sarah A.   Credit    -$50.00   Service credit (downtime)   | |
|  |                                                                          | |
|  |  [+ Add Adjustment]  [+ Add Note]                                       | |
|  +--------------------------------------------------------------------------+ |
|                                                                               |
+==============================================================================+
```

#### Adjustment Types

| Type | Description | Requires Approval |
|------|-------------|-------------------|
| Credit | Apply account credit | No (< $100) |
| Refund | Process partial/full refund | Yes (Super Admin) |
| Plan Change | Upgrade/downgrade subscription | No |
| Pause | Temporarily suspend billing | Yes |
| Cancel | End subscription | No |
| Extend Period | Add days to current period | Yes |

---

### 3.3 Invoicing

**Purpose:** Generate and manage invoices for placement fees and custom billing.

#### Invoice Types

| Type | Trigger | Amount | Auto-Generate |
|------|---------|--------|---------------|
| Placement Fee | Driver hired | $1,200/driver | Yes |
| Placement Deposit | VelocityMatch signup | $100/driver | No (Stripe) |
| Custom | Admin-initiated | Variable | Manual |
| Credit Memo | Adjustment | Negative | Manual |

#### Invoice Generator

```
+==============================================================================+
|  CREATE INVOICE                                                   [Cancel]    |
+==============================================================================+
|                                                                               |
|  RECIPIENT                                                                    |
|  ----------------------------------------------------------------            |
|  Carrier: [Search or select carrier________________] v                        |
|  Contact: John Smith                                                          |
|  Email:   john@swift.com                                                      |
|  Address: 123 Transport Way, Dallas, TX 75001                                 |
|                                                                               |
|  INVOICE DETAILS                                                              |
|  ----------------------------------------------------------------            |
|  Invoice #:   INV-2026-0042 (auto)      Due Date: [30 days from issue] v     |
|  Issue Date:  [2026-01-20_____]                                              |
|  PO Number:   [Optional______________]                                        |
|                                                                               |
|  LINE ITEMS                                                                   |
|  ----------------------------------------------------------------            |
|  | Description                      | Qty | Unit Price | Total    | [x] |   |
|  |----------------------------------|-----|------------|----------|-----|   |
|  | Placement Fee - Driver: M.Johns  |  1  | $1,200.00  | $1,200.00|  x  |   |
|  | Placement Fee - Driver: S.Wilson |  1  | $1,200.00  | $1,200.00|  x  |   |
|  |----------------------------------|-----|------------|----------|-----|   |
|  | [+ Add Line Item]                                                    |   |
|  ----------------------------------------------------------------            |
|                                                                               |
|                                           Subtotal:    $2,400.00             |
|                                           Discount:   -$  200.00 (partner)   |
|                                           --------------------------          |
|                                           TOTAL:       $2,200.00             |
|                                                                               |
|  NOTES (appears on invoice)                                                   |
|  [____________________________________________________________]              |
|                                                                               |
|  INTERNAL NOTES (admin only)                                                  |
|  [____________________________________________________________]              |
|                                                                               |
|  [ ] Send invoice via email immediately                                       |
|  [ ] Mark as sent (manual delivery)                                           |
|                                                                               |
|  [Preview PDF]                    [Save Draft]  [Create & Send Invoice]       |
|                                                                               |
+==============================================================================+
```

#### Invoice Lifecycle

```
           +--------+
           | DRAFT  |
           +---+----+
               |
     [Send]    |
               v
           +--------+        +--------+
           |  SENT  | -----> |OVERDUE | (after due date)
           +---+----+        +---+----+
               |                 |
     [Payment] |                 | [Payment]
               v                 v
           +--------+
           |  PAID  |
           +--------+
               |
     [Void]    | [Refund]
               v
           +--------+
           | VOIDED |
           +--------+
```

#### PDF Invoice Template

```
+==============================================================================+
|                                                                               |
|  LMDR                                              INVOICE                    |
|  Last Mile Driver Recruiting                                                  |
|  www.lastmiledr.app                                                          |
|                                                                               |
|  ----------------------------------------------------------------            |
|                                                                               |
|  BILL TO:                           INVOICE DETAILS:                          |
|  Swift Transport                    Invoice #: INV-2026-0042                 |
|  John Smith                         Date: January 20, 2026                   |
|  123 Transport Way                  Due Date: February 19, 2026              |
|  Dallas, TX 75001                   PO #: PO-12345                           |
|                                                                               |
|  ----------------------------------------------------------------            |
|                                                                               |
|  DESCRIPTION                                    QTY    RATE      AMOUNT      |
|  ----------------------------------------------------------------            |
|  Placement Fee - Driver: Michael Johnson       1    $1,200.00   $1,200.00   |
|  (Placed: January 15, 2026)                                                  |
|                                                                               |
|  Placement Fee - Driver: Sarah Wilson          1    $1,200.00   $1,200.00   |
|  (Placed: January 18, 2026)                                                  |
|                                                                               |
|  ----------------------------------------------------------------            |
|                                           SUBTOTAL:              $2,400.00   |
|                                           PARTNER DISCOUNT (8%): -$ 200.00   |
|                                           --------------------------------   |
|                                           AMOUNT DUE:            $2,200.00   |
|                                                                               |
|  ----------------------------------------------------------------            |
|                                                                               |
|  PAYMENT INSTRUCTIONS:                                                        |
|  Pay online: https://pay.lastmiledr.app/inv/INV-2026-0042                    |
|  Or mail check to: LMDR, PO Box 12345, Dallas, TX 75001                      |
|                                                                               |
|  Questions? billing@lastmiledr.app | (555) 123-4567                          |
|                                                                               |
+==============================================================================+
```

---

### 3.4 Commission Tracking

**Purpose:** Track and manage sales rep commissions on subscription and placement deals.

#### Commission Structure

| Deal Type | Base Rate | Pro Tier Bonus | Enterprise Bonus |
|-----------|-----------|----------------|------------------|
| New Subscription | 10% of first year | +2% | +5% |
| Placement Fee | 15% of fee | N/A | N/A |
| Renewal | 5% | +1% | +2% |
| Upsell | 20% of increase | -- | -- |

#### Commission Dashboard

```
+==============================================================================+
|  COMMISSION TRACKING                                    Period: [January 2026]|
+==============================================================================+
|                                                                               |
|  SUMMARY                                                                      |
|  +-------------------+  +-------------------+  +-------------------+          |
|  |  TOTAL EARNED     |  |  PENDING PAYOUT   |  |   PAID OUT        |          |
|  |    $8,420.00      |  |    $3,180.00      |  |   $5,240.00       |          |
|  |  12 deals         |  |   4 deals         |  |   8 deals         |          |
|  +-------------------+  +-------------------+  +-------------------+          |
|                                                                               |
|  LEADERBOARD                                                                  |
|  +--------------------------------------------------------------------------+ |
|  |  Rank  Rep Name      Deals   Revenue     Commission   Status             | |
|  |  ----  -----------   -----   ---------   ----------   --------           | |
|  |  1     Sarah A.      5       $12,750     $2,805       $1,500 paid        | |
|  |  2     Mike T.       4       $9,200      $2,024       $2,024 pending     | |
|  |  3     Jennifer L.   3       $7,800      $1,716       $1,716 pending     | |
|  |  4     David K.      2       $5,400      $1,188       $1,188 paid        | |
|  |  5     Alex R.       1       $2,988      $687         $687 paid          | |
|  +--------------------------------------------------------------------------+ |
|                                                                               |
|  RECENT COMMISSIONS                                                           |
|  +--------------------------------------------------------------------------+ |
|  |  Date       Rep       Deal Type     Carrier         Amount   Commission  | |
|  |  ---------  --------  -----------   --------------  -------  ----------  | |
|  |  01/18/26   Sarah A.  New Sub(Ent)  Acme Trucking   $8,988   $1,348     | |
|  |  01/17/26   Mike T.   Placement     Swift Trans     $1,200   $180       | |
|  |  01/15/26   Sarah A.  New Sub(Pro)  Fast Freight    $2,988   $359       | |
|  |  01/12/26   David K.  Renewal       ABC Logistics   $2,988   $179       | |
|  |  01/10/26   Jennifer  Upsell        XYZ Express     $5,000   $1,000     | |
|  +--------------------------------------------------------------------------+ |
|                                                                               |
|  [+ Record Manual Commission]  [Generate Payout Report]  [Export to CSV]     |
|                                                                               |
+==============================================================================+
```

#### Commission Rules Engine

```
+==============================================================================+
|  COMMISSION RULES                                           [+ Add Rule]      |
+==============================================================================+
|                                                                               |
|  ACTIVE RULES                                                                 |
|  +--------------------------------------------------------------------------+ |
|  |  Rule Name              Trigger              Rate    Conditions          | |
|  |  --------------------   -----------------    -----   ------------------  | |
|  |  New Pro Subscription   subscription.new     12%     plan=pro            | |
|  |  New Enterprise Sub     subscription.new     15%     plan=enterprise     | |
|  |  Pro Renewal            subscription.renew   6%      plan=pro            | |
|  |  Enterprise Renewal     subscription.renew   7%      plan=enterprise     | |
|  |  Placement Fee          placement.complete   15%     --                  | |
|  |  Upsell Pro->Ent        subscription.upgrade 20%     from=pro,to=ent     | |
|  |                                                                          | |
|  |  [Edit] [Disable] [Delete]                                              | |
|  +--------------------------------------------------------------------------+ |
|                                                                               |
|  ATTRIBUTION RULES                                                            |
|  ( ) First touch - Commission goes to rep who first contacted carrier        |
|  (x) Last touch - Commission goes to rep who closed the deal                 |
|  ( ) Split - Commission split between first touch and closer                  |
|                                                                               |
|  PAYOUT SCHEDULE                                                              |
|  Payout Day: [15th of month_____] v                                          |
|  Minimum Payout: [$50.00___________]                                          |
|  Hold Period: [30 days_____________] (time after deal before eligible)        |
|                                                                               |
|  [Save Changes]                                                               |
|                                                                               |
+==============================================================================+
```

---

## 4. Data Model

### 4.1 New Collections

#### RevenueMetrics (Daily snapshots)

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `date` | Date | Snapshot date |
| `mrr` | Number | Monthly recurring revenue (cents) |
| `arr` | Number | Annual recurring revenue (cents) |
| `active_subscriptions` | Number | Count of active subs |
| `pro_subscribers` | Number | Pro tier count |
| `enterprise_subscribers` | Number | Enterprise tier count |
| `new_subscriptions` | Number | New subs this day |
| `churned_subscriptions` | Number | Churned this day |
| `churn_rate` | Number | Churn rate (decimal) |
| `arpu` | Number | Average revenue per user (cents) |
| `placement_revenue` | Number | One-time placement revenue |
| `_createdDate` | DateTime | Record creation |

#### BillingAdjustments

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `carrier_dot` | String | Related carrier |
| `admin_id` | Reference | Admin who made adjustment |
| `admin_name` | String | Admin display name |
| `type` | String | credit, refund, extension, plan_change |
| `amount` | Number | Amount in cents (negative for credits) |
| `reason` | String | Reason for adjustment |
| `stripe_action_id` | String | Related Stripe refund/credit ID |
| `approved_by` | Reference | Approving admin (if required) |
| `status` | String | pending, approved, applied, rejected |
| `notes` | String | Internal notes |
| `_createdDate` | DateTime | When created |

#### Invoices

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `invoice_number` | String | Human-readable number (INV-2026-0042) |
| `carrier_dot` | String | Related carrier |
| `carrier_name` | String | Carrier company name |
| `contact_name` | String | Contact person |
| `contact_email` | String | Email for invoice |
| `billing_address` | Object | { street, city, state, zip } |
| `line_items` | Array | [{ description, quantity, unit_price, total }] |
| `subtotal` | Number | Sum of line items (cents) |
| `discount_amount` | Number | Discount (cents) |
| `discount_reason` | String | Discount description |
| `total` | Number | Final amount (cents) |
| `currency` | String | USD |
| `status` | String | draft, sent, paid, overdue, voided |
| `issue_date` | Date | Invoice date |
| `due_date` | Date | Payment due date |
| `paid_date` | Date | When payment received |
| `payment_method` | String | stripe, check, wire, other |
| `payment_reference` | String | Check #, transaction ID |
| `po_number` | String | Customer PO number |
| `notes` | String | Public notes on invoice |
| `internal_notes` | String | Admin-only notes |
| `pdf_url` | String | Generated PDF URL |
| `created_by` | Reference | Admin who created |
| `sent_at` | DateTime | When email sent |
| `_createdDate` | DateTime | Record creation |
| `_updatedDate` | DateTime | Last modified |

#### Commissions

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `sales_rep_id` | Reference | SalesReps collection |
| `sales_rep_name` | String | Rep display name |
| `deal_type` | String | new_subscription, renewal, upsell, placement |
| `carrier_dot` | String | Related carrier |
| `carrier_name` | String | Carrier company name |
| `deal_value` | Number | Total deal value (cents) |
| `commission_rate` | Number | Rate applied (decimal, e.g., 0.15) |
| `commission_amount` | Number | Calculated commission (cents) |
| `rule_id` | String | CommissionRule that triggered |
| `status` | String | pending, approved, paid, voided |
| `hold_until` | Date | Date when eligible for payout |
| `paid_date` | Date | When paid to rep |
| `payout_reference` | String | Payout batch ID or check # |
| `notes` | String | Admin notes |
| `_createdDate` | DateTime | When commission recorded |

#### SalesReps

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `name` | String | Full name |
| `email` | String | Email address |
| `wix_member_id` | String | Linked Wix member (if applicable) |
| `status` | String | active, inactive |
| `hire_date` | Date | Start date |
| `commission_tier` | String | standard, senior, manager |
| `default_rate_override` | Number | Optional rate override |
| `total_earnings` | Number | Lifetime earnings (cents) |
| `ytd_earnings` | Number | Year-to-date earnings (cents) |
| `payment_method` | String | direct_deposit, check |
| `payment_details` | Object | Bank info or address |
| `_createdDate` | DateTime | Record creation |

#### CommissionRules

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `name` | String | Rule name |
| `trigger` | String | Event that triggers (subscription.new, etc.) |
| `rate` | Number | Commission rate (decimal) |
| `conditions` | Object | { plan: 'pro', min_value: 1000 } |
| `priority` | Number | Rule evaluation order |
| `is_active` | Boolean | Whether rule is enabled |
| `effective_from` | Date | Start date |
| `effective_until` | Date | End date (null = indefinite) |
| `created_by` | Reference | Admin who created |
| `_createdDate` | DateTime | Record creation |

### 4.2 Existing Collections (Extended)

#### CarrierSubscriptions (add fields)

| New Field | Type | Description |
|-----------|------|-------------|
| `sales_rep_id` | Reference | Attributed sales rep |
| `acquisition_source` | String | How carrier was acquired |
| `ltv_to_date` | Number | Running LTV calculation |

---

## 5. API Design

### 5.1 adminBusinessService.jsw

```javascript
// ============================================================
// REVENUE METRICS
// ============================================================

/**
 * Get current revenue metrics snapshot
 * @returns {Object} { mrr, arr, activeSubscriptions, churnRate, arpu, ltv }
 */
export async function getRevenueSnapshot()

/**
 * Get MRR trend data for charting
 * @param {number} months - Number of months to include
 * @returns {Array} [{ date, mrr, arr, subscriptions }]
 */
export async function getMRRTrend(months = 12)

/**
 * Get revenue breakdown by tier
 * @returns {Object} { pro: { count, mrr }, enterprise: { count, mrr }, placement: { count, revenue } }
 */
export async function getRevenueByTier()

/**
 * Get cohort retention data
 * @param {number} cohorts - Number of monthly cohorts
 * @returns {Array} [{ cohort: '2025-10', m0: 100, m1: 95, m2: 90, ... }]
 */
export async function getCohortAnalysis(cohorts = 6)

/**
 * Get churn analysis breakdown
 * @param {string} period - 'month', 'quarter', 'year'
 * @returns {Object} { voluntary, involuntary, reasons: [{ reason, count, percentage }] }
 */
export async function getChurnAnalysis(period = 'month')

/**
 * Calculate LTV by tier
 * @returns {Object} { pro: { ltv, avgLifespan }, enterprise: { ltv, avgLifespan } }
 */
export async function getLTVByTier()

/**
 * Record daily revenue snapshot (called by scheduler)
 * @returns {Object} { success, metrics }
 */
export async function recordDailyMetrics()

// ============================================================
// BILLING MANAGEMENT
// ============================================================

/**
 * Search for customer by DOT, name, or email
 * @param {string} query - Search query
 * @returns {Array} Matching carriers with subscription info
 */
export async function searchBillingCustomer(query)

/**
 * Get full billing details for a carrier
 * @param {string} carrierDot - Carrier DOT number
 * @returns {Object} { carrier, subscription, usage, history, adjustments }
 */
export async function getBillingDetails(carrierDot)

/**
 * Apply credit to carrier account
 * @param {string} carrierDot - Carrier DOT
 * @param {number} amount - Credit amount in cents
 * @param {string} reason - Reason for credit
 * @param {string} adminId - Admin applying credit
 * @returns {Object} { success, adjustmentId, stripeResult }
 */
export async function applyCredit(carrierDot, amount, reason, adminId)

/**
 * Process refund
 * @param {string} carrierDot - Carrier DOT
 * @param {string} invoiceId - Stripe invoice ID
 * @param {number} amount - Refund amount (null = full)
 * @param {string} reason - Refund reason
 * @param {string} adminId - Admin processing
 * @returns {Object} { success, refundId }
 */
export async function processRefund(carrierDot, invoiceId, amount, reason, adminId)

/**
 * Change subscription plan
 * @param {string} carrierDot - Carrier DOT
 * @param {string} newPlan - 'pro' or 'enterprise'
 * @param {boolean} immediate - Apply immediately or at period end
 * @returns {Object} { success, subscription }
 */
export async function changeSubscriptionPlan(carrierDot, newPlan, immediate = false)

/**
 * Pause subscription
 * @param {string} carrierDot - Carrier DOT
 * @param {number} days - Days to pause
 * @param {string} reason - Pause reason
 * @returns {Object} { success, resumeDate }
 */
export async function pauseSubscription(carrierDot, days, reason)

/**
 * Cancel subscription
 * @param {string} carrierDot - Carrier DOT
 * @param {boolean} immediate - Cancel now or at period end
 * @param {string} reason - Cancellation reason
 * @returns {Object} { success }
 */
export async function cancelSubscription(carrierDot, immediate, reason)

/**
 * Get billing adjustments for carrier
 * @param {string} carrierDot - Carrier DOT
 * @returns {Array} Adjustment records
 */
export async function getBillingAdjustments(carrierDot)

// ============================================================
// INVOICING
// ============================================================

/**
 * Create a new invoice
 * @param {Object} invoiceData - Invoice details
 * @returns {Object} { success, invoice }
 */
export async function createInvoice(invoiceData)

/**
 * Update invoice (draft only)
 * @param {string} invoiceId - Invoice ID
 * @param {Object} updates - Fields to update
 * @returns {Object} { success, invoice }
 */
export async function updateInvoice(invoiceId, updates)

/**
 * Send invoice via email
 * @param {string} invoiceId - Invoice ID
 * @returns {Object} { success, sentAt }
 */
export async function sendInvoice(invoiceId)

/**
 * Generate PDF for invoice
 * @param {string} invoiceId - Invoice ID
 * @returns {Object} { success, pdfUrl }
 */
export async function generateInvoicePDF(invoiceId)

/**
 * Record payment for invoice
 * @param {string} invoiceId - Invoice ID
 * @param {Object} paymentDetails - { method, reference, amount }
 * @returns {Object} { success, invoice }
 */
export async function recordInvoicePayment(invoiceId, paymentDetails)

/**
 * Void an invoice
 * @param {string} invoiceId - Invoice ID
 * @param {string} reason - Void reason
 * @returns {Object} { success }
 */
export async function voidInvoice(invoiceId, reason)

/**
 * Get invoices with filters
 * @param {Object} filters - { status, carrierDot, dateRange }
 * @returns {Array} Invoice records
 */
export async function getInvoices(filters)

/**
 * Get next invoice number
 * @returns {string} Next available invoice number
 */
export async function getNextInvoiceNumber()

// ============================================================
// COMMISSION TRACKING
// ============================================================

/**
 * Get commission summary for period
 * @param {string} period - Month string (2026-01)
 * @returns {Object} { totalEarned, pendingPayout, paidOut, dealCount }
 */
export async function getCommissionSummary(period)

/**
 * Get sales rep leaderboard
 * @param {string} period - Month string
 * @returns {Array} [{ rep, deals, revenue, commission, status }]
 */
export async function getSalesLeaderboard(period)

/**
 * Get commission details for a rep
 * @param {string} repId - Sales rep ID
 * @param {Object} filters - { period, status }
 * @returns {Array} Commission records
 */
export async function getRepCommissions(repId, filters)

/**
 * Record manual commission
 * @param {Object} commissionData - Commission details
 * @returns {Object} { success, commission }
 */
export async function recordCommission(commissionData)

/**
 * Approve pending commission
 * @param {string} commissionId - Commission ID
 * @param {string} adminId - Approving admin
 * @returns {Object} { success }
 */
export async function approveCommission(commissionId, adminId)

/**
 * Generate payout report
 * @param {string} period - Month string
 * @returns {Object} { reps: [{ name, amount, method }], total }
 */
export async function generatePayoutReport(period)

/**
 * Mark commissions as paid
 * @param {Array} commissionIds - IDs to mark paid
 * @param {string} payoutReference - Batch ID or reference
 * @returns {Object} { success, count }
 */
export async function markCommissionsPaid(commissionIds, payoutReference)

/**
 * Get commission rules
 * @returns {Array} Active commission rules
 */
export async function getCommissionRules()

/**
 * Create/update commission rule
 * @param {Object} rule - Rule definition
 * @returns {Object} { success, rule }
 */
export async function saveCommissionRule(rule)

/**
 * Get sales reps
 * @param {boolean} activeOnly - Only active reps
 * @returns {Array} Sales rep records
 */
export async function getSalesReps(activeOnly = true)

/**
 * Create/update sales rep
 * @param {Object} rep - Rep details
 * @returns {Object} { success, rep }
 */
export async function saveSalesRep(rep)

// ============================================================
// AUTO-COMMISSION (called by webhooks)
// ============================================================

/**
 * Calculate and record commission for a deal
 * Called automatically by subscription/placement webhooks
 * @param {string} eventType - subscription.new, placement.complete, etc.
 * @param {Object} dealData - { carrierDot, value, plan }
 * @returns {Object} { success, commission }
 */
export async function processAutoCommission(eventType, dealData)
```

---

## 6. UI Components

### 6.1 HTML Files Required

| File | Location | Purpose |
|------|----------|---------|
| `ADMIN_REVENUE_DASHBOARD.html` | `src/public/admin/` | Revenue metrics and charts |
| `ADMIN_BILLING_MANAGEMENT.html` | `src/public/admin/` | Customer billing management |
| `ADMIN_INVOICING.html` | `src/public/admin/` | Invoice creation and management |
| `ADMIN_COMMISSIONS.html` | `src/public/admin/` | Commission tracking and payouts |

### 6.2 Shared Components

- Chart library: Use existing chart solution or add Chart.js
- Data tables: Reuse admin portal table patterns
- Forms: Follow admin portal form patterns
- PDF generation: Server-side via html-pdf or similar

---

## 7. Integration Points

### 7.1 Stripe Integration

Leverage existing `stripeService.jsw`:
- Customer lookup via API
- Credit/refund operations
- Subscription modifications
- Invoice retrieval

### 7.2 Webhook Integration

Add commission processing to existing webhook handlers:
- `checkout.session.completed` -> `processAutoCommission('subscription.new', ...)`
- `customer.subscription.updated` -> Check for upgrade, process if so
- Placement completion -> `processAutoCommission('placement.complete', ...)`

### 7.3 Scheduled Jobs

Add to `jobs.config`:
- `recordDailyMetrics` - Daily at midnight
- `processOverdueInvoices` - Daily, mark invoices overdue
- `processCommissionHolds` - Daily, release held commissions

---

## 8. Security Requirements

### 8.1 Role-Based Access

| Feature | Super Admin | Ops Admin | Finance Admin | Viewer |
|---------|-------------|-----------|---------------|--------|
| View Revenue | Yes | Yes | Yes | Yes |
| Billing Lookup | Yes | Yes | Yes | Read-only |
| Apply Credit (<$100) | Yes | Yes | Yes | No |
| Apply Credit (>$100) | Yes | Yes (approval) | No | No |
| Process Refund | Yes | No | No | No |
| Create Invoice | Yes | Yes | Yes | No |
| Void Invoice | Yes | No | No | No |
| View Commissions | Yes | Yes | Yes | Yes |
| Edit Commission Rules | Yes | No | No | No |
| Approve Payouts | Yes | No | Yes | No |

### 8.2 Audit Trail

All billing actions logged to `AdminAuditLog`:
- Credit applications
- Refunds processed
- Plan changes
- Invoice operations
- Commission approvals
- Payout processing

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Admin billing task time | -60% | Time to resolve billing issues |
| Invoice creation time | <2 min | Draft to sent |
| Revenue visibility | Real-time | Dashboard refresh rate |
| Commission accuracy | 100% | Manual audit comparison |
| Billing dispute resolution | <24 hours | Time from report to resolution |

---

## 10. Open Questions

1. **PDF Generation**: Use server-side library or external service (e.g., PDF.co)?
2. **Commission Attribution**: How to handle deals with multiple touchpoints?
3. **Revenue Recognition**: Immediate or amortized over subscription period?
4. **Multi-Currency**: Support international carriers in the future?
5. **Tax Handling**: Integrate tax calculation service?
