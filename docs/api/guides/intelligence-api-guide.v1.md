# Intelligence API Guide (v1)

## Endpoints
- `GET /v1/intelligence/carrier/{dot_number}`
- `GET /v1/intelligence/sentiment/{dot_number}`
- `GET /v1/intelligence/market`
- `POST /v1/intelligence/carriers/search`

## Tier Access
- Starter: carrier intelligence + market.
- Growth+: sentiment and full intelligence.

## Example cURL
```bash
curl -X GET "https://www.lastmiledr.app/_functions/api_gateway/v1/intelligence/market?region=southeast&freight_type=dry_van&operation_type=otr" \
  -H "Authorization: Bearer lmdr_live_xxx"
```

## Notes
- Market endpoint uses cached aggregation windows.
- Sentiment is higher cost and tier-restricted.
