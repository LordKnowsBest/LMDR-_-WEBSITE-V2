# Stripe Webhook Security Assessment

## Checkpoints

1. **Verify signature validation (`constructEvent` or HMAC-SHA256 equivalent):**
2. **Verify webhook secret is fetched via `getSecret`:**
3. **Check for duplicate events using idempotency key (`isEventProcessed`):**
4. **Verify webhook failures return error and stop processing:**
5. **Check `JSON.parse()` usage (no parsing before signature verification):**
6. **Verify Stripe server-side secrets for portal/checkout:**
7. **Confirm `PUBLISHABLE_STRIPE` is never used for sensitive ops:**
8. **Check subscription status updates correctly:**
9. **Verify Stripe API calls use `getSecret()`:**
10. **Verify explicitly allowlisted event types:**
