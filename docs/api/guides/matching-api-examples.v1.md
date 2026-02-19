# Matching API Examples (v1)

Base URL: `https://www.lastmiledr.app/_functions/api_gateway`

## Driver Search (Enterprise)
```bash
curl -X POST "https://www.lastmiledr.app/_functions/api_gateway/v1/matching/drivers/search" \
  -H "Authorization: Bearer lmdr_live_replace_me" \
  -H "Content-Type: application/json" \
  -d '{
    "carrier_dot": "123456",
    "filters": {
      "cdl_class": ["A"],
      "endorsements_required": ["H"],
      "min_experience_years": 2,
      "max_distance_miles": 100
    },
    "limit": 25
  }'
```

## Driver Profile (PII Masked by Default)
```bash
curl -X GET "https://www.lastmiledr.app/_functions/api_gateway/v1/matching/driver/d_123?carrier_dot=123456" \
  -H "Authorization: Bearer lmdr_live_replace_me"
```

## Driver Profile (Unmask with Enterprise + Credits)
```bash
curl -X GET "https://www.lastmiledr.app/_functions/api_gateway/v1/matching/driver/d_123?carrier_dot=123456&unmask_pii=true" \
  -H "Authorization: Bearer lmdr_live_replace_me"
```

## Carrier Match
```bash
curl -X POST "https://www.lastmiledr.app/_functions/api_gateway/v1/matching/carriers" \
  -H "Authorization: Bearer lmdr_live_replace_me" \
  -H "Content-Type: application/json" \
  -d '{
    "driver_profile": {
      "endorsements": ["H", "N"],
      "years_experience": 4,
      "preferences": {
        "operation_type": "OTR",
        "min_cpm": 0.65
      }
    },
    "include_enrichment": true,
    "limit": 10
  }'
```

## Qualification Check
```bash
curl -X POST "https://www.lastmiledr.app/_functions/api_gateway/v1/matching/qualify" \
  -H "Authorization: Bearer lmdr_live_replace_me" \
  -H "Content-Type: application/json" \
  -d '{
    "driver": {
      "cdl_class": "A",
      "endorsements": ["H"],
      "years_experience": 3
    },
    "carrier_requirements": {
      "cdl_class": "A",
      "endorsements_required": ["H", "N"],
      "min_experience_years": 2
    }
  }'
```
