# Intelligence API Guide (v1)

## Endpoints
- `GET /v1/intelligence/carrier/{dot_number}`
- `GET /v1/intelligence/sentiment/{dot_number}`
- `GET /v1/intelligence/market`
- `POST /v1/intelligence/carriers/search`

## Tier Access
- Starter: carrier intelligence + market intelligence snapshots.
- Growth+: sentiment endpoint and full enrichment payload access.

## Filter Support
- `GET /v1/intelligence/market`
  - `region`
  - `freight_type`
  - `operation_type`
- `POST /v1/intelligence/carriers/search`
  - `filters.sentiment`
  - `filters.fleet_size_min`
  - `filters.fleet_size_max`
  - `filters.safety_rating`
  - `limit`
  - `offset`

## Rate Limit Notes
- Sentiment requests are higher-cost and subject to stricter throttling.
- Respect `Retry-After` on `429 rate_limit_exceeded` responses.

## References
- OpenAPI: `docs/api/openapi.external.v1.yaml`
- Integration guide: `docs/api/guides/intelligence-integration-guide.v1.md`
- Code examples: `docs/api/guides/intelligence-api-examples.v1.md`
- Postman: `docs/api/postman.intelligence.v1.collection.json`
