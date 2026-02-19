# LMDR External API Getting Started (v1)

## 1. Create Partner + Key
1. Create your partner record in the API admin console.
2. Generate a sandbox key first, then a production key.
3. Store keys in a secrets manager (never ship keys in frontend code).

## 2. Validate Authentication
Send a simple request with `Authorization: Bearer <api_key>`.

Example:
```bash
curl -X GET "https://www.lastmiledr.app/_functions/api_gateway/v1/safety/carrier/1234567" \
  -H "Authorization: Bearer lmdr_test_xxx"
```

## 3. Pick Initial Product Surface
Recommended order:
1. Safety (`/v1/safety/*`)
2. Intelligence (`/v1/intelligence/*`)
3. Operations (`/v1/fuel/*`, `/v1/parking/*`)
4. Documents/Matching/Engagement by tier

## 4. Configure Webhooks
1. Register a webhook URL in partner settings.
2. Trigger test event from portal.
3. Validate retry handling for non-2xx responses.

## 5. Go-Live Checklist
- [ ] Production key created and rotated policy defined
- [ ] Rate-limit handling + retry strategy implemented
- [ ] Error logging + request correlation (`request_id`) captured
- [ ] Usage dashboard monitored weekly
- [ ] Billing alerts configured

## 6. First API Call Milestone
A partner is considered activated after first successful `/v1/*` request is logged in `apiRequestLog`.
Track this in onboarding reports as `time_to_first_call`.
