# External API Platform Progress (2026-02-07)

## Implemented
- API gateway routing and middleware expanded for:
  - Safety: FMCSA, batch FMCSA, CSA current/history, alert subscriptions
  - Intelligence: carrier intelligence, sentiment, market, carrier search
  - Operational: parking search/details, fuel prices/plan/station
  - Matching: driver search, driver profile, carrier match, qualification check
  - Documents: CDL extract, med cert extract, verify, batch + batch status
  - Engagement: progress, XP award, achievement check, leaderboard, webhook subscribe
- Tier enforcement (Starter/Growth/Enterprise) and standardized service error mapping are active in gateway.
- Quota usage counters now increment for credit-metered endpoints (driver searches, document extractions).
- Developer portal backend service scaffolded:
  - partner registration
  - key rotation passthrough
  - usage dashboard aggregation
- Unit tests added and passing:
  - `src/public/__tests__/apiGateway.external.test.js`
  - `src/public/__tests__/externalDocumentApi.test.js`

## Not Yet Implemented
- OpenAPI specs / Postman collections / integration guides.
- Full webhook delivery pipeline (signatures, retries, event dispatch).
- Billing integration for API tiers and overage billing.
- Frontend developer portal + admin partner management pages.
- SDK publishing (Node/Python) and documentation site.
- Expanded automated test coverage for auth/rate-limit internals and full endpoint matrix.

## Current Parity Position
- Core backend API surface is in place and callable through `/v1/*`.
- Product is in **backend feature parity (partial)** state: implementation exists for all major categories, but launch-critical docs/billing/portal hardening remain.
