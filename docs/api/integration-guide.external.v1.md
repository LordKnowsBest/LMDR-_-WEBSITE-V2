# LMDR External API Integration Guide (v1)

## Base URL
- `https://www.lastmiledr.app/_functions/api_gateway`

All endpoints are exposed under `/v1/*`.

## Authentication
Use API key bearer auth on every request:

```http
Authorization: Bearer lmdr_live_xxx
```

## Response Envelope
Success responses:

```json
{
  "data": {},
  "request_id": "req_xxx"
}
```

Error responses:

```json
{
  "error": {
    "code": "invalid_api_key",
    "message": "Invalid API key"
  },
  "request_id": "req_xxx"
}
```

## Rate Limit Headers
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `X-Quota-Limit`
- `X-Quota-Remaining`
- `X-Quota-Reset`

## Tier Enforcement Summary
- `starter`: safety, core intelligence, parking.
- `growth`: adds sentiment/fuel/documents.
- `enterprise`: adds matching and engagement APIs.

## Webhook Events
Webhook subscriptions are available for:
- Safety alerts (`/v1/safety/alerts/subscribe`)
- Engagement events (`/v1/engagement/webhooks/subscribe`)
- Document batch callbacks (`/v1/documents/batch` with callback URL)

Webhook signature headers:
- `X-LMDR-Event`
- `X-LMDR-Timestamp`
- `X-LMDR-Signature` (HMAC SHA-256 when secret configured)

## Quick Start
1. Import Postman collection: `docs/api/postman.external.v1.collection.json`.
2. Set collection vars:
   - `baseUrl`
   - `apiKey`
3. Call `GET /v1/safety/carrier/{dot_number}`.
4. Validate your `request_id` and rate-limit headers.

## Reference Files
- OpenAPI spec: `docs/api/openapi.external.v1.yaml`
- Postman collection: `docs/api/postman.external.v1.collection.json`
