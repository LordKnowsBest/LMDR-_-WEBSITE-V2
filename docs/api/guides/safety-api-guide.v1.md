# Safety API Guide (v1)

## Endpoints
- `GET /v1/safety/carrier/{dot_number}`
- `POST /v1/safety/carriers/batch`
- `GET /v1/safety/csa/{dot_number}`
- `GET /v1/safety/csa/{dot_number}/history`
- `POST /v1/safety/alerts/subscribe`
- `GET /v1/safety/alerts/subscriptions`
- `DELETE /v1/safety/alerts/{subscription_id}`

## Typical Flow
1. Pull carrier baseline from FMCSA lookup endpoint.
2. Pull CSA current + history for trend checks.
3. Subscribe to webhook alerts for monitored DOTs.

## Example cURL
```bash
curl -X GET "https://www.lastmiledr.app/_functions/api_gateway/v1/safety/carrier/123456" \
  -H "Authorization: Bearer lmdr_live_xxx"
```

## Notes
- DOT number must be numeric.
- Alert subscriptions are partner-scoped.
- Webhook retries are processed asynchronously by scheduled retry job.
