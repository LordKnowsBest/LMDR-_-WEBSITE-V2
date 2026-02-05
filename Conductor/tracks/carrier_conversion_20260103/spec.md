# Track Spec: Carrier Conversion Flow Optimization

## 1. Goal
To optimize the carrier onboarding experience by transitioning from a simple lead capture to a committed, paid activation via a refundable deposit. This ensures high-intent leads and provides immediate platform momentum through a streamlined checkout and scheduling flow.

## 2. Background
*   **Current State:** Carriers fill out a staffing request form (`carrierStaffingForm`), which generates a lead in the database but requires manual outreach for commitment.
*   **Desired State:** Upon form submission, carriers are immediately redirected to a Stripe-powered deposit page ($499 refundable activation). Completion of payment triggers automatic status updates, success notifications, and an immediate onboarding call invitation via Calendly.

## 3. Key Requirements
*   **Form & Redirection (Frontend & Backend):**
    *   `carrierLeadsService.jsw` must return a `leadId` and `checkoutToken` upon submission.
    *   Carrier landing pages/forms must handle post-submission redirection to `/checkout?id=[leadId]`.
*   **Stripe Integration (Backend):**
    *   Implement `stripeService.jsw` to handle session creation and webhook processing.
    *   Securely manage API keys via Wix Secrets Manager.
    *   Track payment lifecycle (unpaid -> pending -> paid) in `carrierStaffingRequests` and a new `CarrierPayments` collection.
*   **Checkout Experience (UI):**
    *   Create a dedicated `/checkout` page that personalizes the message using the lead's data (e.g., Company Name).
    *   Implement a Stripe Payment Element or redirect to Stripe Hosted Checkout framing the payment as a "Refundable Activation Deposit".
*   **Post-Payment Activation:**
    *   Automated status update to `activated_paid` upon webhook confirmation.
    *   Success page featuring search activation confirmation and a Calendly embed for onboarding scheduling.

## 4. Design Guidelines
*   **Trust & Clarity:** Use "VelocityMatch" branding (Cool tones, ROI-driven). Clearly communicate the "Refundable" nature of the deposit to lower friction.
*   **Personalization:** The checkout page should feel like a continuation of the form, reflecting the specific hiring needs declared in the previous step.
*   **Mobile Standard:** Ensure the payment interface and the post-payment success page (with Calendly embed) are perfectly responsive (iPhone 12/13 target).
