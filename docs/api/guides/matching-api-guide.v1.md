# Matching API Guide (v1)

## Endpoints
- `POST /v1/matching/drivers/search`
- `GET /v1/matching/driver/{driver_id}`
- `POST /v1/matching/carriers`
- `POST /v1/matching/qualify`

## Tier Access
- Enterprise only for external partner access.

## Example cURL
```bash
curl -X POST "https://www.lastmiledr.app/_functions/api_gateway/v1/matching/drivers/search" \
  -H "Authorization: Bearer lmdr_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "cdl_class": "A",
      "endorsements_required": ["H"],
      "min_experience_years": 2
    },
    "limit": 10
  }'
```

## Notes
- Driver search usage is quota-metered.
- Profile responses may mask PII based on access rules.
