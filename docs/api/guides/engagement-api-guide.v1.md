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

## Webhook events
- `engagement.level_up`
- `engagement.achievement_earned`
- `engagement.streak_milestone`

## XP award guardrails
- XP award requests enforce action validation and daily caps.
- Use returned payload to detect level-up side effects and earned items.
