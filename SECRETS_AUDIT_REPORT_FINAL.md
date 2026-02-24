# Secrets Audit Report

Found 52 potential secrets:

## Bearer Token
- **File:** `src/backend/apiAuthService.jsw`
- **Line:** 63
- **Severity:** Critical
- **Match:** `Bearer token`
- **Context:** `return { success: false, errorCode: 'invalid_api_key', message: 'Missing Bearer token' };`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Bearer Token
- **File:** `src/backend/apiPortalService.jsw`
- **Line:** 84
- **Severity:** Critical
- **Match:** `Bearer lmdr_live_xxx`
- **Context:** `'  -H "Authorization: Bearer lmdr_live_xxx"'`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Bearer Token
- **File:** `src/backend/apiPortalService.jsw`
- **Line:** 89
- **Severity:** Critical
- **Match:** `Bearer lmdr_live_xxx`
- **Context:** `'  { headers: { Authorization: "Bearer lmdr_live_xxx" } }',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Bearer Token
- **File:** `src/backend/apiPortalService.jsw`
- **Line:** 96
- **Severity:** Critical
- **Match:** `Bearer lmdr_live_xxx`
- **Context:** `"headers = {'Authorization': 'Bearer lmdr_live_xxx'}",`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/backend/socialScanner.jsw`
- **Line:** 12
- **Severity:** High
- **Match:** `Secret: 'PERPLEXITY_API_KEY'`
- **Context:** `perplexitySecret: 'PERPLEXITY_API_KEY',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/backend/b2bResearchAgentService.jsw`
- **Line:** 43
- **Severity:** High
- **Match:** `Secret: 'CLAUDE_API_KEY'`
- **Context:** `claudeSecret: 'CLAUDE_API_KEY',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/backend/b2bContentAIService.jsw`
- **Line:** 48
- **Severity:** High
- **Match:** `Secret: 'CLAUDE_API_KEY'`
- **Context:** `claudeSecret: 'CLAUDE_API_KEY',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/backend/ocrService.jsw`
- **Line:** 36
- **Severity:** High
- **Match:** `Secret: 'GEMINI_API_KEY'`
- **Context:** `geminiSecret: 'GEMINI_API_KEY',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/backend/aiEnrichment.jsw`
- **Line:** 22
- **Severity:** High
- **Match:** `Secret: 'CLAUDE_API_KEY'`
- **Context:** `claudeSecret: 'CLAUDE_API_KEY',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/backend/aiEnrichment.jsw`
- **Line:** 27
- **Severity:** High
- **Match:** `Secret: 'GEMINI_API_KEY'`
- **Context:** `geminiSecret: 'GEMINI_API_KEY',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/backend/aiEnrichment.jsw`
- **Line:** 33
- **Severity:** High
- **Match:** `Secret: 'PERPLEXITY_API_KEY'`
- **Context:** `perplexitySecret: 'PERPLEXITY_API_KEY',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/driver/js/document-upload-logic.js`
- **Line:** 245
- **Severity:** High
- **Match:** `Token: 'test-token-abc'`
- **Context:** `uploadToken: 'test-token-abc',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Bearer Token
- **File:** `src/public/__tests__/apiAuthService.test.js`
- **Line:** 22
- **Severity:** Warning (Test File)
- **Match:** `Bearer abc123`
- **Context:** `expect(parseBearerToken('Bearer abc123')).toBe('abc123');`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Bearer Token
- **File:** `src/public/__tests__/apiAuthService.test.js`
- **Line:** 74
- **Severity:** Warning (Test File)
- **Match:** `Bearer not_a_real_key`
- **Context:** `authorizationHeader: 'Bearer not_a_real_key'`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/externalApiPlatformPhase8Flows.test.js`
- **Line:** 120
- **Severity:** Warning (Test File)
- **Match:** `apiKey: 'lmdr_live_x'`
- **Context:** `const client = new LmdrApiClient({ apiKey: 'lmdr_live_x', fetch: fetchMock });`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Bearer Token
- **File:** `src/public/__tests__/externalApiPlatformPhase8Flows.test.js`
- **Line:** 127
- **Severity:** Warning (Test File)
- **Match:** `Bearer lmdr_live_x`
- **Context:** `expect(options.headers.Authorization).toContain('Bearer lmdr_live_x');`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/apiWebhookService.test.js`
- **Line:** 30
- **Severity:** Warning (Test File)
- **Match:** `secret: 'whsec_test'`
- **Context:** `webhook_secret: 'whsec_test',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/apiWebhookService.test.js`
- **Line:** 43
- **Severity:** Warning (Test File)
- **Match:** `Secret: 'whsec_test'`
- **Context:** `webhookSecret: 'whsec_test',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/apiWebhookService.test.js`
- **Line:** 63
- **Severity:** Warning (Test File)
- **Match:** `secret: 'whsec_test'`
- **Context:** `webhook_secret: 'whsec_test',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/apiWebhookService.test.js`
- **Line:** 76
- **Severity:** Warning (Test File)
- **Match:** `Secret: 'whsec_test'`
- **Context:** `webhookSecret: 'whsec_test',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/socialPostingService.test.js`
- **Line:** 42
- **Severity:** Warning (Test File)
- **Match:** `token: 'new-token'`
- **Context:** `json: async () => ({ id: 'fb-post-123', access_token: 'new-token', expires_in: 5183944 }),`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/socialPostingService.test.js`
- **Line:** 203
- **Severity:** Warning (Test File)
- **Match:** `token: 'fb-token-xyz'`
- **Context:** `access_token: 'fb-token-xyz',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/socialPostingService.test.js`
- **Line:** 284
- **Severity:** Warning (Test File)
- **Match:** `token: 'new-token'`
- **Context:** `json: async () => ({ access_token: 'new-token', expires_in: 5183944 }),`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/socialPostingService.test.js`
- **Line:** 326
- **Severity:** Warning (Test File)
- **Match:** `token: 'new-token'`
- **Context:** `json: async () => ({ access_token: 'new-token', expires_in: 5183944 }),`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/socialPostingService.test.js`
- **Line:** 355
- **Severity:** Warning (Test File)
- **Match:** `token: 'old-refresh-token'`
- **Context:** `refresh_token: 'old-refresh-token',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/socialPostingService.test.js`
- **Line:** 360
- **Severity:** Warning (Test File)
- **Match:** `token: 'new-access-token'`
- **Context:** `json: async () => ({ access_token: 'new-access-token', expires_in: 5183944 }),`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/socialPostingService.test.js`
- **Line:** 368
- **Severity:** Warning (Test File)
- **Match:** `token: 'new-access-token'`
- **Context:** `expect.objectContaining({ access_token: 'new-access-token' })`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/socialPostingService.test.js`
- **Line:** 376
- **Severity:** Warning (Test File)
- **Match:** `token: 'expired-token'`
- **Context:** `refresh_token: 'expired-token',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/socialPostingService.test.js`
- **Line:** 401
- **Severity:** Warning (Test File)
- **Match:** `token: 'fb-token'`
- **Context:** `refresh_token: 'fb-token',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Bearer Token
- **File:** `src/public/__tests__/apiGateway.external.test.js`
- **Line:** 77
- **Severity:** Warning (Test File)
- **Match:** `Bearer test_key`
- **Context:** `authorization: 'Bearer test_key'`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/apiGateway.external.test.js`
- **Line:** 247
- **Severity:** Warning (Test File)
- **Match:** `secret: 'whsec_test'`
- **Context:** `webhook_secret: 'whsec_test'`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Stripe Test Publishable Key
- **File:** `src/public/__tests__/checkout.html.test.js`
- **Line:** 248
- **Severity:** Warning (Test File)
- **Match:** `pk_test_abc123`
- **Context:** `publishableKey: 'pk_test_abc123',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Stripe Test Publishable Key
- **File:** `src/public/__tests__/checkout.html.test.js`
- **Line:** 256
- **Severity:** Warning (Test File)
- **Match:** `pk_test_abc123`
- **Context:** `expect(stripeState.publishableKey).toBe('pk_test_abc123');`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Stripe Test Publishable Key
- **File:** `src/public/__tests__/checkout.html.test.js`
- **Line:** 263
- **Severity:** Warning (Test File)
- **Match:** `pk_test_abc123`
- **Context:** `publishableKey: 'pk_test_abc123',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Stripe Test Publishable Key
- **File:** `src/public/__tests__/checkout.html.test.js`
- **Line:** 278
- **Severity:** Warning (Test File)
- **Match:** `pk_test_abc123`
- **Context:** `publishableKey: 'pk_test_abc123',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Stripe Test Publishable Key
- **File:** `src/public/__tests__/checkout.html.test.js`
- **Line:** 297
- **Severity:** Warning (Test File)
- **Match:** `pk_test_abc123`
- **Context:** `publishableKey: 'pk_test_abc123',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Stripe Test Publishable Key
- **File:** `src/public/__tests__/checkout.html.test.js`
- **Line:** 314
- **Severity:** Warning (Test File)
- **Match:** `pk_test_abc123`
- **Context:** `publishableKey: 'pk_test_abc123',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Stripe Test Publishable Key
- **File:** `src/public/__tests__/checkout.html.test.js`
- **Line:** 342
- **Severity:** Warning (Test File)
- **Match:** `pk_test_abc123`
- **Context:** `publishableKey: 'pk_test_abc123',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Stripe Test Publishable Key
- **File:** `src/public/__tests__/checkout.html.test.js`
- **Line:** 356
- **Severity:** Warning (Test File)
- **Match:** `pk_test_abc123`
- **Context:** `publishableKey: 'pk_test_abc123',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Stripe Test Publishable Key
- **File:** `src/public/__tests__/checkout.html.test.js`
- **Line:** 371
- **Severity:** Warning (Test File)
- **Match:** `pk_test_abc123`
- **Context:** `publishableKey: 'pk_test_abc123',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/jobBoardService.test.js`
- **Line:** 149
- **Severity:** Warning (Test File)
- **Match:** `api_key: 'test-key'`
- **Context:** `items: [{ _id: 'cred-1', board: 'indeed', api_key: 'test-key', is_active: true }],`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/jobBoardService.test.js`
- **Line:** 274
- **Severity:** Warning (Test File)
- **Match:** `apiKey: 'test-key'`
- **Context:** `const result = await connectJobBoard('123456', 'indeed', { apiKey: 'test-key', publisherId: 'pub-123' });`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Stripe Test Publishable Key
- **File:** `src/public/__tests__/checkout.bridge.test.js`
- **Line:** 197
- **Severity:** Warning (Test File)
- **Match:** `pk_test_abc123`
- **Context:** `publishableKey: 'pk_test_abc123'`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Stripe Test Publishable Key
- **File:** `src/public/__tests__/checkout.bridge.test.js`
- **Line:** 210
- **Severity:** Warning (Test File)
- **Match:** `pk_test_abc123`
- **Context:** `publishableKey: 'pk_test_abc123',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Stripe Test Publishable Key
- **File:** `src/public/__tests__/checkout.bridge.test.js`
- **Line:** 221
- **Severity:** Warning (Test File)
- **Match:** `pk_test_abc123`
- **Context:** `publishableKey: 'pk_test_abc123'`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Stripe Test Publishable Key
- **File:** `src/public/__tests__/checkout.bridge.test.js`
- **Line:** 240
- **Severity:** Warning (Test File)
- **Match:** `pk_test_abc123`
- **Context:** `publishableKey: 'pk_test_abc123'`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Stripe Test Publishable Key
- **File:** `src/public/__tests__/checkout.bridge.test.js`
- **Line:** 267
- **Severity:** Warning (Test File)
- **Match:** `pk_test_abc123`
- **Context:** `publishableKey: 'pk_test_abc123'`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Stripe Test Publishable Key
- **File:** `src/public/__tests__/checkout.bridge.test.js`
- **Line:** 282
- **Severity:** Warning (Test File)
- **Match:** `pk_test_abc123`
- **Context:** `publishableKey: 'pk_test_abc123'`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Stripe Test Publishable Key
- **File:** `src/public/__tests__/checkout.bridge.test.js`
- **Line:** 325
- **Severity:** Warning (Test File)
- **Match:** `pk_test_abc123`
- **Context:** `publishableKey: 'pk_test_abc123'`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/socialTokenService.test.js`
- **Line:** 38
- **Severity:** Warning (Test File)
- **Match:** `token: 'long-lived-token'`
- **Context:** `access_token: 'long-lived-token',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Generic API Key/Secret Assignment
- **File:** `src/public/__tests__/stripeWebhookCommission.test.js`
- **Line:** 58
- **Severity:** Warning (Test File)
- **Match:** `SECRET = 'whsec_test_1234567890abcdef'`
- **Context:** `const TEST_WEBHOOK_SECRET = 'whsec_test_1234567890abcdef';`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---
## Stripe Test Secret Key
- **File:** `src/public/__tests__/__mocks__/wix-secrets-backend.js`
- **Line:** 9
- **Severity:** Warning (Test File)
- **Match:** `sk_test_mock`
- **Context:** `'STRIPE_SECRET_KEY': 'sk_test_mock_key',`

**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.
---