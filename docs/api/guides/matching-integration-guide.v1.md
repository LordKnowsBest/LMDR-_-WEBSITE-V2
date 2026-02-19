# Matching Integration Guide (v1)

## Scope
- `POST /v1/matching/drivers/search`
- `GET /v1/matching/driver/{driver_id}`
- `POST /v1/matching/carriers`
- `POST /v1/matching/qualify`

## Tier and Access
- Matching endpoints are Enterprise tier only.
- Driver search and profile workflows are credit and quota metered.

## Integration Pattern for Staffing Platforms
1. Run `drivers/search` with role-specific filters.
2. Keep masked profile as default in list and preview views.
3. Request unmask on profile detail only when credits are available and user intent is explicit.
4. Use `qualify` for deterministic compliance checks before outreach.
5. Use `carriers` matching endpoint for reverse recommendations from candidate profile data.

## PII and Credit Controls
- `driver/{driver_id}` returns masked contact details unless `unmask_pii=true` and enterprise credit policy passes.
- Store `credit_consumed` and request IDs for audit reconciliation.

## Recommended Caching
- Cache search pages short-term (15-30 minutes).
- Do not cache unmasked contact payloads longer than operationally needed.

## References
- OpenAPI: `docs/api/openapi.external.v1.yaml`
- Examples: `docs/api/guides/matching-api-examples.v1.md`
- Postman: `docs/api/postman.matching.v1.collection.json`
