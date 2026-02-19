# Partner Onboarding Email Sequence (Phase 8.6)

## Sequence
1. `welcome` (0h)
2. `keys_and_auth` (24h)
3. `webhooks_and_billing` (72h)
4. `production_readiness` (120h)

## Automation
- Job: `processApiPartnerOnboardingFollowUps`
- Location: `src/backend/apiOnboardingJobs.jsw`
- Schedule: every 6 hours in `src/backend/jobs.config`

## Trigger data
Each enrollment tracks:
- `partner_id`
- `current_step`
- `next_email_due_at`
- `completed_steps`
- `first_api_call_at`

## Manual override
Use portal onboarding controls to initialize onboarding for any partner and inspect sequence payload.
