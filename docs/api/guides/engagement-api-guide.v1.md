# Engagement API Guide (v1)

## Endpoints
- `GET /v1/engagement/user/{user_id}/progress`
- `POST /v1/engagement/xp/award`
- `POST /v1/engagement/achievements/check`
- `GET /v1/engagement/leaderboard`
- `POST /v1/engagement/webhooks/subscribe`

## Auth + Tier
- Bearer API key required.
- `enterprise+` tier required for engagement endpoints.

## Partner-scoped mapping
- All user operations are partner scoped.
- Provide partner context through authenticated key.
- Internal mapped format is `partner:{partner_id}:{user_type}:{external_user_id}`.

## Webhook events
- `engagement.level_up`
- `engagement.achievement_earned`
- `engagement.streak_milestone`

## Webhook payload format
```json
{
  "event_type": "engagement.level_up",
  "partner_id": "ptn_123",
  "occurred_at": "2026-02-19T00:00:00.000Z",
  "data": {
    "user_id": "u_123",
    "partner_user_id": "partner:ptn_123:driver:u_123"
  }
}
```

## XP award guardrails
- XP award requests enforce action validation and daily caps.
- Use returned payload to detect level-up side effects and earned items.

## References
- OpenAPI: `docs/api/openapi.external.v1.yaml`
- Examples: `docs/api/guides/engagement-api-examples.v1.md`
- Postman: `docs/api/postman.engagement.v1.collection.json`
