# Track: Carrier Conversion Flow Optimization

## Objective
Optimize the carrier onboarding experience by transitioning from a lead capture form to a paid commitment (deposit) via Stripe, ensuring high-intent leads and immediate platform activation.

## User Flow
1. **Landing:** Carrier lands on "Carrier Welcome" or specialized SEO landing page.
2. **Commitment (Part 1):** Carrier fills out the `carrierStaffingForm`.
3. **Transition:** Upon submission, the user is automatically redirected to the Deposit/Checkout page.
4. **Commitment (Part 2):** Carrier pays a refundable $499 deposit (or custom amount) via Stripe.
5. **Activation:** Carrier is redirected to a success page with a Calendly embed for an immediate onboarding call.

---

## Phase 1: Lead Form & Redirection Logic
- [x] **Task:** Modify `src/backend/carrierLeadsService.jsw` to return the `leadId` and a unique `checkoutToken` upon successful submission.
- [x] **Task:** Update `src/public/utility/_TEMPLATE_Carrier_Staffing_Form.html` PostMessage handler to receive the redirection URL.
- [x] **Task:** Update Page Code for carrier landing pages to perform `wixLocation.to('/checkout?id=' + result.leadId)`.

## Phase 2: Stripe Backend Integration
- [x] **Task:** Create `src/backend/stripeService.jsw`.
    - [x] `createCheckoutSession(leadId, amount)`: Generate a Stripe Checkout URL or Payment Intent.
    - [x] `handleWebhook(event)`: Listen for `checkout.session.completed` or `payment_intent.succeeded`.
- [x] **Task:** Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to Wix Secrets Manager.
- [x] **Task:** Create a new collection `CarrierPayments` to track deposit status, linked to `carrierStaffingRequests`.

## Phase 3: Checkout UI (The "Deposit" Page)
- [x] **Task:** Implement `src/pages/Checkout.kbyzk.js`.
    - [x] Retrieve `leadId` from URL parameters.
    - [x] Fetch lead details to personalize the checkout (e.g., "Ready to find your 5 Class A drivers, [Company Name]?").
- [x] **Task:** Create `src/public/utility/STRIPE_PAYMENT_ELEMENT.html` (Missing).
    - [x] Host Stripe Elements or redirect to Stripe Hosted Checkout.
    - [x] Frame the payment as a "Refundable Activation Deposit".

## Phase 4: Post-Payment Fulfillment
- [x] **Task:** Update `carrierLeadsService.jsw` status to `activated_paid` when webhook confirms payment.
- [x] **Task:** Implement `src/backend/emailService.jsw` trigger for "Payment Received" email.
- [x] **Task:** Create a Success Page (`src/public/utility/Payment_Success.html`) (Missing) with:
    - [x] Confirmation of search activation.
    - [x] Calendly embed for onboarding.

## Phase 5: Verification & Analytics
- [x] **Task:** Set up conversion tracking (Google Analytics/Facebook Pixel) for `lead_submitted` vs `deposit_paid`.
- [x] **Task:** Verify full flow (Lead Form -> Checkout -> Success -> Database Update).
- [ ] **Task:** Test end-to-end flow in Stripe Test Mode.

---

## Technical Specifications

### Data Changes
| Collection | Field | Type | Purpose |
|------------|-------|------|---------|
| `carrierStaffingRequests` | `payment_status` | String | `unpaid`, `pending`, `paid` |
| `carrierStaffingRequests` | `deposit_amount` | Number | Amount paid |
| `CarrierPayments` | `stripe_session_id` | String | Reference for webhooks |

### New Files
- `src/backend/stripeService.jsw`
- `src/public/utility/STRIPE_PAYMENT_ELEMENT.html`
- `src/public/utility/Payment_Success.html`
- `src/pages/SUBSCRIPTION SUCCESS.o76p8.js`

