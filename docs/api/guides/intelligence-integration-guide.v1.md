# Intelligence Integration Guide (v1)

## Scope
This guide covers partner integration for:
- `GET /v1/intelligence/carrier/{dot_number}`
- `GET /v1/intelligence/sentiment/{dot_number}`
- `GET /v1/intelligence/market`
- `POST /v1/intelligence/carriers/search`

## Tier Model
- Starter: carrier intelligence + market intelligence
- Growth and above: sentiment + full enrichment payload

## Integration Flow
1. Validate API key access with a market intelligence probe call.
2. Pull carrier intelligence by DOT for individual carrier review.
3. Use carrier search for batch prospecting workflows.
4. Run sentiment calls only where tier allows and budget for higher-cost scans.

## Caching Model
- Carrier intelligence caches on LMDR side with a 14-day TTL target.
- Market intelligence snapshots are refreshed daily by filter key.

## Error Handling
- `401 invalid_api_key`: invalid or missing token.
- `403 forbidden_tier`: endpoint requires higher subscription tier.
- `429 rate_limit_exceeded`: apply exponential backoff and honor `Retry-After`.

## Recommended Usage Patterns
- Cache market snapshots in your own system per region/freight/operation triple for 24 hours.
- Store request IDs for support traces and reconciliation.
- For `carriers/search`, paginate with `limit` and `offset` to avoid oversized payloads.

## References
- OpenAPI: `docs/api/openapi.external.v1.yaml`
- Examples: `docs/api/guides/intelligence-api-examples.v1.md`
- Postman: `docs/api/postman.intelligence.v1.collection.json`
