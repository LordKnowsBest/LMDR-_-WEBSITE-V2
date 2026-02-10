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
- External webhook reliability hardening:
  - Added scheduled retry job entrypoint `src/backend/apiWebhookJobs.jsw` (`processApiWebhookRetries`)
  - Added `jobs.config` schedule (`*/5 * * * *`) for queued webhook retries
  - Wired CSA alert generation in `csaMonitorService.jsw` to dispatch partner safety alert webhook events via `apiWebhookService`
  - Fixed CSA trend baseline parsing to compare against parsed prior snapshot basics
- New tests added and passing:
  - `src/public/__tests__/apiWebhookJobs.test.js`
  - `src/public/__tests__/csaMonitorService.test.js`
- API documentation baseline:
  - Added OpenAPI spec draft for implemented `/v1/*` surface: `docs/api/openapi.external.v1.yaml`
  - Added Postman collection: `docs/api/postman.external.v1.collection.json`
  - Added initial integration guide: `docs/api/integration-guide.external.v1.md`

## Not Yet Implemented
- Category-specific integration guides (Safety/Intelligence/Operations/Matching/Documents/Engagement deep dives).
- Full webhook delivery pipeline (signatures, retries, event dispatch).
- Billing integration for API tiers and overage billing.
- Frontend developer portal + admin partner management pages.
- SDK publishing (Node/Python) and documentation site.
- Expanded automated test coverage for auth/rate-limit internals and full endpoint matrix.

## Current Parity Position
- Core backend API surface is in place and callable through `/v1/*`.
- Product is in **backend feature parity (partial)** state: implementation exists for all major categories, but launch-critical docs/billing/portal hardening remain.
