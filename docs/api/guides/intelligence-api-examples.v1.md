# Intelligence API Examples (v1)

Base URL: `https://www.lastmiledr.app/_functions/api_gateway`

## Authentication
Use a partner API key in the bearer token header.

```bash
-H "Authorization: Bearer lmdr_live_replace_me"
```

## Carrier Intelligence
```bash
curl -X GET "https://www.lastmiledr.app/_functions/api_gateway/v1/intelligence/carrier/123456" \
  -H "Authorization: Bearer lmdr_live_replace_me"
```

## Social Sentiment (Growth+)
```bash
curl -X GET "https://www.lastmiledr.app/_functions/api_gateway/v1/intelligence/sentiment/123456" \
  -H "Authorization: Bearer lmdr_live_replace_me"
```

## Market Intelligence
```bash
curl -X GET "https://www.lastmiledr.app/_functions/api_gateway/v1/intelligence/market?region=southeast&freight_type=dry_van&operation_type=otr" \
  -H "Authorization: Bearer lmdr_live_replace_me"
```

## Carrier Search
```bash
curl -X POST "https://www.lastmiledr.app/_functions/api_gateway/v1/intelligence/carriers/search" \
  -H "Authorization: Bearer lmdr_live_replace_me" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "sentiment": "positive",
      "fleet_size_min": 50,
      "fleet_size_max": 500,
      "safety_rating": "satisfactory"
    },
    "limit": 25,
    "offset": 0
  }'
```

## JavaScript Example
```javascript
const response = await fetch(
  'https://www.lastmiledr.app/_functions/api_gateway/v1/intelligence/market?region=midwest&freight_type=reefer',
  {
    headers: {
      Authorization: 'Bearer lmdr_live_replace_me'
    }
  }
);

const payload = await response.json();
console.log(payload.data.market_data);
```

## Python Example
```python
import requests

url = "https://www.lastmiledr.app/_functions/api_gateway/v1/intelligence/carrier/123456"
headers = {"Authorization": "Bearer lmdr_live_replace_me"}

resp = requests.get(url, headers=headers, timeout=30)
resp.raise_for_status()
print(resp.json()["data"])
```
