# Engagement API Examples (v1)

Base URL: `https://www.lastmiledr.app/_functions/api_gateway`

## User Progress
```bash
curl -X GET "https://www.lastmiledr.app/_functions/api_gateway/v1/engagement/user/u_123/progress?user_type=driver" \
  -H "Authorization: Bearer lmdr_live_replace_me"
```

## Award XP
```bash
curl -X POST "https://www.lastmiledr.app/_functions/api_gateway/v1/engagement/xp/award" \
  -H "Authorization: Bearer lmdr_live_replace_me" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "u_123",
    "user_type": "driver",
    "action": "training_complete",
    "xp_amount": 50,
    "metadata": {"source": "lms"}
  }'
```

## Achievement Check
```bash
curl -X POST "https://www.lastmiledr.app/_functions/api_gateway/v1/engagement/achievements/check" \
  -H "Authorization: Bearer lmdr_live_replace_me" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "u_123",
    "user_type": "driver",
    "context": {"event": "weekly_goal"}
  }'
```

## Webhook Subscription
```bash
curl -X POST "https://www.lastmiledr.app/_functions/api_gateway/v1/engagement/webhooks/subscribe" \
  -H "Authorization: Bearer lmdr_live_replace_me" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "https://partner.example/webhooks/lmdr-engagement",
    "event_types": ["engagement.level_up", "engagement.achievement_earned"]
  }'
```
