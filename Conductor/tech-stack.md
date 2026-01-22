# Technology Stack: LMDR AI Matching Platform

## 1. Core Framework & Language
*   **Language:** JavaScript (ES6+)
*   **Platform:** Wix Velo (Full Stack development environment)
*   **Frontend Library:** React (v16.14.0) for specific UI components within Wix pages.

## 2. Project Architecture
*   **Monorepo Structure:**
    *   `src/pages/`: Page-specific logic and UI handling.
    *   `src/backend/`: Secure server-side web modules (`.jsw`), configuration, and service integrations.
    *   `src/public/`: Shared client-side code.
    *   `src/styles/`: Global and component-specific styling (Tailwind CSS patterns inferred for future use).

## 3. Key Dependencies & Integrations
*   **Authentication:** `@velo/wix-members-twilio-otp` (Secure SMS-based authentication).
*   **Data Connectors:** 
    *   `@marketpushapps/airtable-connector`: Synchronizing carrier and job data with Airtable.
    *   `@marketpushapps/calendly-embed`: Facilitating interview scheduling.
*   **Development Tools:**
    *   `@wix/cli`: Local development, syncing, and publishing.
    *   `eslint` & `@wix/eslint-plugin-cli`: Code quality and Wix-specific linting rules.

## 4. Services & Infrastructure
*   **AI Enrichment Pipeline:** Custom backend services (`aiEnrichment.jsw`, `socialScanner.jsw`) leveraging external LLMs and scraping tools.
*   **Compliance Data:** `fmcsaService.jsw` for real-time safety and regulatory data fetching.
*   **Carrier Compliance:** Dedicated services for managing compliance lifecycle:
    *   `complianceCalendarService.jsw`: Event tracking and reminders.
    *   `documentVaultService.jsw`: Document storage and expiration logic.
    *   `dqFileService.jsw`: Driver Qualification file completeness.
    *   `csaMonitorService.jsw`: BASIC score trending and alerts.
    *   `incidentService.jsw`: Incident reporting and DOT classification.
*   **Job Scheduler:** `jobs.config` for background tasks and automated match updates.
*   **Payments & Subscriptions:** Stripe integration via `stripeService.jsw` for checkout, billing portal, and webhook handling.

## 5. Billing & Subscription System
*   **Payment Provider:** Stripe (Checkout Sessions, Customer Portal, Webhooks)
*   **Subscription Tiers:** Free, Pro ($249/mo), Enterprise ($749/mo)
*   **Webhook Endpoint:** `/_functions/stripe_webhook` with HMAC-SHA256 signature verification
*   **Backend Services:**
    *   `stripeService.jsw`: Direct Stripe API calls
    *   `subscriptionService.jsw`: Business logic, quota enforcement
    *   `http-functions.js`: Webhook handler with idempotency
*   **Collections:**
    *   `CarrierSubscriptions`: Subscription records by carrier DOT
    *   `ProfileViews`: Quota tracking
    *   `BillingHistory`: Payment event logs
    *   `StripeEventLog`: Idempotency tracking
