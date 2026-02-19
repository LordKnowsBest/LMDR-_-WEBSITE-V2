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

## Webhook Payload Format
Safety webhook events use HMAC signing headers when a secret is configured:
- `X-LMDR-Event`
- `X-LMDR-Timestamp`
- `X-LMDR-Signature`

Example payload:
```json
{
  "event_type": "safety.alert.triggered",
  "event_id": "evt_123",
  "partner_id": "ptn_123",
  "timestamp": "2026-02-19T00:00:00.000Z",
  "data": {
    "dot_number": 1234567,
    "alert_type": "csa_change",
    "summary": "Unsafe Driving percentile moved above threshold"
  }
}
```

## Additional References
- Examples: `docs/api/guides/safety-api-examples.v1.md`
- Postman: `docs/api/postman.safety.v1.collection.json`
- OpenAPI: `docs/api/openapi.external.v1.yaml`

## Notes
- DOT number must be numeric.
- Alert subscriptions are partner-scoped.
- Webhook retries are processed asynchronously by scheduled retry job.
