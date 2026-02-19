# Safety API Examples (v1)

## cURL

```bash
curl -X GET "https://www.lastmiledr.app/_functions/api_gateway/v1/safety/carrier/1234567" \
  -H "Authorization: Bearer lmdr_live_xxx"
```

```bash
curl -X POST "https://www.lastmiledr.app/_functions/api_gateway/v1/safety/carriers/batch" \
  -H "Authorization: Bearer lmdr_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"dot_numbers":[1234567,2345678]}'
```

## JavaScript

```js
const response = await fetch('https://www.lastmiledr.app/_functions/api_gateway/v1/safety/csa/1234567/history?months=6', {
  method: 'GET',
  headers: {
    Authorization: 'Bearer lmdr_live_xxx'
  }
});

const payload = await response.json();
console.log(payload.data);
```

## Python

```python
import requests

base = 'https://www.lastmiledr.app/_functions/api_gateway'
headers = {'Authorization': 'Bearer lmdr_live_xxx'}

res = requests.post(
    f'{base}/v1/safety/alerts/subscribe',
    headers={**headers, 'Content-Type': 'application/json'},
    json={
        'dot_numbers': [1234567],
        'alert_types': ['csa_change'],
        'webhook_url': 'https://partner.example/webhooks/lmdr'
    },
    timeout=30
)
print(res.json())
```
