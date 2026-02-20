# Graph API Organic Posting â€” Implementation Plan

**Track:** `graph_api_org_posting_20260219`
**Last Updated:** 2026-02-19
**Spec:** [spec.md](./spec.md)

---

## Phase 0 â€” Research & Decisions âœ… (Complete â€” pre-work in spec.md)

> Goal: Confirm all endpoints, permissions, architectural decisions, and preconditions are documented before writing any code.

- [x] **0.1** Document FB Page feed posting endpoint, parameters, and required permissions
  - Endpoint: `POST /v25.0/{page-id}/feed`
  - Permissions: `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`
  - Source: [Graph API â€” Page Feed Publishing](https://developers.facebook.com/docs/graph-api/reference/page/feed/)
- [x] **0.2** Document IG content publishing two-step flow (container â†’ publish)
  - Step 1: `POST /{ig-id}/media` â€” create container
  - Step 2: `POST /{ig-id}/media_publish` â€” publish container
  - Source: [Instagram Content Publishing Guide](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [x] **0.3** Confirm IG publishing rate limit is 50 posts / 24h rolling (not 100)
  - Confirmed: `quota_total: 50`, `quota_duration: 86400` from `content_publishing_limit` endpoint
  - Source: [IG User Content Publishing Limit](https://developers.facebook.com/docs/instagram-api/reference/ig-user/content_publishing_limit)
- [x] **0.4** Document long-lived token acquisition flow
  - Short-lived User â†’ Long-lived User (~60 days) â†’ Long-lived Page (no expiry*)
  - Source: [Get Long-Lived Tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived)
- [x] **0.5** Document IG account prerequisites (Business/Creator + linked FB Page)
  - Source: [Instagram API Overview â€” Requirements](https://developers.facebook.com/docs/instagram-api/guides/content-publishing#requirements)
- [x] **0.6** Confirm what is NOT possible (profile posting, Stories via Graph API, Shopping tags)
  - Documented in spec.md Section 9 â€” Out of Scope
- [x] **0.7** Architecture decision: Wix Backend (.jsw) for v1 vs Cloud Run
  - Decision: Wix Backend for v1 (see spec.md Section 11)
  - Cloud Run migration deferred to `gcp_migration_20260218` track integration

**Acceptance Criteria:**
- spec.md contains doc-backed capability matrix, preconditions, auth model, posting flows, and error taxonomy âœ…
- Architecture decision documented with rationale âœ…

**Kill Switch:** N/A â€” this phase is documentation only.

---

## Phase 1 â€” MVP: Minimal Working Prototype

> Goal: One successful organic FB Page text post and one IG image post, end-to-end, triggered manually from backend.

### 1.1 â€” Secrets & Token Bootstrap

- [x] **1.1.1** Create `src/backend/socialSecretService.jsw`
  - Exports: `getFBPageToken(pageId)`, `getIGUserToken(igUserId)`, `getMetaAppId()`, `getMetaAppSecret()`
  - Reads from Wix Secrets Manager using standard `getSecret()` calls
  - Secret naming convention: `meta_page_token_{page_id}`, `meta_ig_token_{ig_user_id}`, `meta_app_id`, `meta_app_secret`
  - No secrets returned to client callers
- [ ] **1.1.2** Manually run the token acquisition flow to populate Wix Secrets Manager
  - Step a: FB Login for Business â†’ get short-lived User token
  - Step b: Server-side exchange â†’ long-lived User token (`GET /oauth/access_token?grant_type=fb_exchange_token`)
  - Step c: Get Page + IG tokens â†’ `GET /{user-id}/accounts`
  - Step d: Add each token to Wix Secrets Manager with correct key names
- [x] **1.1.3** Write `src/backend/socialTokenService.jsw`
  - Export: `validateToken(token)` â€” calls `GET /debug_token` and returns `{ is_valid, expires_at, scopes }`
  - Export: `exchangeForLongLived(shortLivedToken)` â€” exchanges using app credentials (server-side only)
  - Export: `getPageTokens(longLivedUserToken)` â€” calls `GET /{user-id}/accounts` and returns page+IG token pairs

**Acceptance Criteria:**
- `socialSecretService.jsw` can retrieve all four secret types without error
- `socialTokenService.validateToken()` returns `is_valid: true` for a stored token
- App secret is never returned outside of backend modules

### 1.2 â€” Facebook Page Text Post

- [x] **1.2.1** Create `src/backend/socialPostingService.jsw` with FB posting function:
  ```javascript
  export async function postToFacebook(payload) {
    // payload: { pageId, message, link?, post_type, dedupe_key }
  }
  ```
  - Retrieve token via `socialSecretService.getFBPageToken(pageId)`
  - Check `SOCIAL_POSTING_ENABLED` flag in `configData.js` (kill switch)
  - Build request body: `{ message }` (text-only MVP)
  - `POST /v25.0/{page-id}/feed` with `Authorization: Bearer {token}`
  - On success: return `{ success: true, post_id }`
  - On failure: classify error, return `{ success: false, error_type, error_message }`
- [x] **1.2.2** Add `SOCIAL_POSTING_ENABLED: false` to `src/backend/configData.js` (starts disabled; flip to `true` for testing)
- [x] **1.2.3** Write test: `src/public/__tests__/socialPostingService.test.js`
  - Test: FB text post success (mocked API response `{ id: "page_post_123" }`)
  - Test: FB post fails with token expired (OAuthException code 190) â†’ returns `TOKEN_EXPIRED` error type
  - Test: Kill switch `SOCIAL_POSTING_ENABLED=false` returns `{ success: false, error_type: 'POSTING_DISABLED' }`

**Acceptance Criteria:**
- With `SOCIAL_POSTING_ENABLED=true`, calling `postToFacebook({ pageId, message: "test" })` results in a live post appearing on the Facebook Page timeline
- Post ID is returned and logged
- Kill switch prevents any posting when set to `false`

### 1.3 â€” Instagram Image Post (Container + Publish)

- [x] **1.3.1** Add `postToInstagram(payload)` to `socialPostingService.jsw`:
  ```javascript
  export async function postToInstagram(payload) {
    // payload: { igUserId, image_url, caption?, dedupe_key }
  }
  ```
  - Pre-check: `GET /{ig-id}/content_publishing_limit` â€” reject if `quota_usage >= 50`
  - Create container: `POST /{ig-id}/media` with `{ image_url, caption }`
  - Publish: `POST /{ig-id}/media_publish` with `{ creation_id: container_id }`
  - On success: return `{ success: true, media_id }`
  - On failure: classify error from taxonomy, return `{ success: false, error_type, error_message }`
- [x] **1.3.2** Add IG tests to `socialPostingService.test.js`:
  - Test: IG image post success (container created â†’ published)
  - Test: Pre-check blocks when `quota_usage=50`
  - Test: IG post fails at container creation â†’ `MEDIA_NOT_PUBLIC` error type
  - Test: IG post fails at publish step â†’ `MEDIA_PROCESSING_FAILED` error type

**Acceptance Criteria:**
- Calling `postToInstagram({ igUserId, image_url: "https://...", caption: "test" })` results in a live post appearing on the IG professional account feed
- Media ID is returned and logged
- `quota_usage >= 50` causes immediate rejection without API call

### 1.4 â€” Minimal Logging

- [x] **1.4.1** Log each post attempt to `observabilityService.jsw` with fields: `platform`, `status`, `post_id / media_id`, `error_type` (if any), `duration_ms`
- [x] **1.4.2** Console-log all token validation failures with masked token (first 6 + last 4 chars only)

**Acceptance Criteria:**
- Every post attempt (success or failure) produces a log entry visible in Admin Observability dashboard

---

**Phase 1 Rollback / Kill Switch:**
- Set `SOCIAL_POSTING_ENABLED: false` in `configData.js` â€” immediately prevents all posting
- No rollback of already-published posts needed (they must be deleted manually via Meta UI if needed)

---

## Phase 2 â€” Posting Service Architecture

> Goal: Unified post dispatcher, full post type support, post queue data model.

### 2.1 â€” Unified Post Dispatcher

- [x] **2.1.1** Refactor `socialPostingService.jsw` into a clean dispatcher:
  ```javascript
  export const post = {
    facebook: postToFacebook,   // existing
    instagram: postToInstagram, // existing
    both: postToBoth,           // new
  };
  ```
- [x] **2.1.2** Implement `postToBoth(payload)`:
  - Dedupe check before dispatch
  - `Promise.allSettled([post.facebook(), post.instagram()])`
  - Evaluate: both success â†’ `published`; one fail â†’ `partial`; both fail â†’ `failed`
  - Return: `{ facebook: result, instagram: result, overall_status }`

### 2.2 â€” Full FB Post Type Support

- [x] **2.2.1** Add `post_type: 'link'` to `postToFacebook()`:
  - Body: `{ message?, link }` â€” note: at least one must be provided
  - Validate `link` is a valid URL
- [x] **2.2.2** Add `post_type: 'photo'` to `postToFacebook()`:
  - Use `POST /v25.0/{page-id}/photos` with `{ url, caption? }`
- [x] **2.2.3** Add `post_type: 'video'` to `postToFacebook()`:
  - Use `POST /v25.0/{page-id}/videos` with `{ file_url, description? }`
- [x] **2.2.4** Add `post_type: 'scheduled'` flag support:
  - Body includes `published: false, scheduled_publish_time: {unix_ts}`
  - Validate `scheduled_publish_time` is 10 min â€“ 75 days in future

### 2.3 â€” Full IG Post Type Support

- [x] **2.3.1** Add `post_type: 'video'` to `postToInstagram()`:
  - Body: `{ video_url, media_type: 'VIDEO', caption? }`
  - Poll `status_code` until `FINISHED` or `ERROR` (max 10 polls, 5s interval)
- [x] **2.3.2** Add `post_type: 'reels'` to `postToInstagram()`:
  - Body: `{ video_url, media_type: 'REELS', caption? }`
  - Same polling flow as video; check `media_product_type` in response to confirm it's a Reel
- [x] **2.3.3** Add `post_type: 'carousel'` to `postToInstagram()`:
  - Create one container per item with `is_carousel_item: true`
  - Create carousel container with `media_type: CAROUSEL, children: [id1, id2, ...]`
  - Publish carousel container

### 2.4 â€” Post Queue Data Model

- [ ] **2.4.1** Create Airtable table `v2_Social Post Queue` with fields per spec.md Section 10
- [x] **2.4.2** Create `src/backend/socialQueueService.jsw`:
  - `createQueueRecord(payload)` â€” creates record with `status=queued`
  - `updateQueueRecord(id, updates)` â€” updates status, post_id, error fields
  - `getByDedupeKey(dedupe_key)` â€” fetches existing record for idempotency
  - `getFailedRecords()` â€” returns records with `status=failed` and `retry_count < 3`
- [x] **2.4.3** Integrate queue into `post.facebook()` and `post.instagram()`: create record before dispatch, update after

### 2.5 â€” Idempotency

- [x] **2.5.1** Implement `generateDedupeKey(payload)` utility:
  - SHA-256 of `platform + post_type + (caption || message) + (image_url || link || '') + account_id`
- [x] **2.5.2** Check `getByDedupeKey()` at start of every post method â€” abort if `status=published`

**Acceptance Criteria:**
- `post.both({ message, image_url, caption })` dispatches to both platforms in parallel
- All four FB post types and all four IG post types are callable and produce correct API requests
- Post queue records are created/updated for every attempt
- Calling `postToFacebook()` twice with identical content within 1 hour returns `DuplicatePostError` on second call

**Phase 2 Kill Switch:** `SOCIAL_POSTING_ENABLED: false` in `configData.js`

---

## Phase 3 â€” Scheduling & Rate Limit Enforcement

> Goal: Scheduled posting that does not rely on fragile cron jobs; proactive rate limit enforcement.

### 3.1 â€” Scheduling Mechanism

- [x] **3.1.1** Decision: Use **Facebook's native scheduling** (`published=false + scheduled_publish_time`) for FB posts â€” avoiding any Wix cron dependency for FB scheduling.
- [x] **3.1.2** For Instagram (no native scheduling via API): implement an in-queue scheduling mechanism:
  - `socialQueueService` marks records with `status=queued, scheduled_for`
  - `jobs.config`: add `processSocialQueue` job at `*/15 * * * *` (every 15 min)
  - Job picks up records where `scheduled_for <= now()` and `status=queued`
  - Dispatches to `post.instagram()` for each
  - Max 5 records per run to stay within Wix 60s job timeout
- [x] **3.1.3** Create `src/backend/socialQueueJob.jsw`:
  - `processSocialQueue()` â€” main job handler
  - Exported for use in `jobs.config`

### 3.2 â€” Rate Limit Guard

- [x] **3.2.1** Create `src/backend/socialRateLimitService.jsw`:
  - `checkIGQuota(igUserId)` â€” calls `content_publishing_limit` and returns `{ can_post, quota_used, quota_total, quota_duration }`
  - `checkFBUsage(pageId)` â€” reads `X-App-Usage` header from last response; returns alert if any metric > 75%
  - Cache last quota check in-memory for 60s to avoid excessive API calls
- [x] **3.2.2** All IG post methods call `checkIGQuota()` before container creation; reject if `can_post=false` with `RateLimitError`
- [x] **3.2.3** Log rate limit status to observability on every queue run

**Acceptance Criteria:**
- Facebook posts can be scheduled up to 75 days in advance using FB's native API parameter; no Wix cron needed
- Instagram queue job runs every 15 minutes and processes due records
- Attempting to post to IG when `quota_used >= 50` returns `RateLimitError` without making a container create API call

**Phase 3 Kill Switch:**
- Remove or comment out `processSocialQueue` from `jobs.config` to stop queue processing
- `SOCIAL_POSTING_ENABLED: false` remains the master switch

---

## Phase 4 â€” Hardening

> Goal: Production-grade reliability â€” retries, dead-letter, audit logs, token health monitoring.

### 4.1 â€” Structured Retry with Dead-Letter

- [x] **4.1.1** Implement retry logic in `socialQueueJob.jsw`:
  - For retryable errors (NETWORK_TIMEOUT, CONTAINER_EXPIRED, RATE_LIMITED_FB): increment `retry_count`, re-queue with backoff delay
  - Backoff: attempt 1 â†’ +5min, attempt 2 â†’ +15min, attempt 3 â†’ +45min
  - After `retry_count >= 3`: move to `status=dead_letter`; alert admin via `emailService.sendAlert()`
- [x] **4.1.2** For non-retryable errors (TOKEN_EXPIRED, PERMISSION_MISSING, MEDIA_PROCESSING_FAILED): immediately set `status=failed`, alert admin, do NOT increment retry_count
- [x] **4.1.3** Create `getDead LetterQueue()` in `socialQueueService.jsw` for admin review

### 4.2 â€” Token Health Monitoring

- [x] **4.2.1** Create `src/backend/socialTokenHealthJob.jsw`:
  - Runs nightly via `jobs.config` entry
  - Iterates all stored `page_id`s and `ig_user_id`s
  - Calls `GET /debug_token?input_token={token}&access_token={app-token}` for each
  - If `is_valid: false` OR `expires_at < 7 days`: log `TOKEN_HEALTH_ALERT` + send admin email
- [x] **4.2.2** Add nightly job to `jobs.config`: `0 2 * * *` (2 AM UTC)

### 4.3 â€” Audit Log

- [ ] **4.3.1** Create Airtable table `v2_Social Audit Log` with fields: `event_type`, `platform`, `actor`, `queue_record_id`, `details`, `timestamp`
- [ ] **4.3.2** Log the following events: `post_dispatched`, `post_published`, `post_failed`, `post_retried`, `post_dead_lettered`, `token_refreshed`, `token_health_alert`, `kill_switch_triggered`

### 4.4 â€” Admin Alerting Hooks

- [x] **4.4.1** Add `sendSocialAlert(alertType, details)` to `emailService.jsw`
  - Alert types: `TOKEN_EXPIRED`, `POST_DEAD_LETTERED`, `TOKEN_HEALTH_ALERT`, `IG_QUOTA_NEAR_LIMIT`
  - `IG_QUOTA_NEAR_LIMIT` fires when `quota_used >= 40` (80% of limit)
- [x] **4.4.2** Wire all error paths in `socialPostingService.jsw` to call `sendSocialAlert()`

**Acceptance Criteria:**
- A failed post is retried up to 3 times with exponential backoff before being dead-lettered
- Admin receives email alert for every dead-lettered post
- Nightly token health job alerts admin if any token is invalid or expires within 7 days
- All significant events are in `v2_Social Audit Log`

**Phase 4 Kill Switch:** `SOCIAL_POSTING_ENABLED: false` + remove job from `jobs.config`

---

## Phase 5 â€” Migration-Ready Improvements

> Goal: Ensure the posting infrastructure is portable to GCP when the platform migrates.

### 5.1 â€” Secrets Provider Abstraction

- [x] **5.1.1** Refactor `socialSecretService.jsw` to use a provider interface:
  ```javascript
  const SecretProvider = process.env.RUNTIME === 'gcp'
    ? GCPSecretProvider
    : WixSecretProvider;
  ```
- [x] **5.1.2** Implement `WixSecretProvider` (wraps current `getSecret()` calls â€” no behavior change)
- [x] **5.1.3** Stub `GCPSecretProvider` with a TODO pointing to `gcp_migration_20260218` track for implementation
- [ ] **5.1.4** Document the migration steps in `spec.md` Section 5 (already written) â€” verify they remain accurate

### 5.2 â€” Cloud Run Portability Notes

- [x] **5.2.1** Ensure all post functions are pure HTTP calls with no Wix-specific dependencies (no `wix-fetch` â€” use standard `fetch`; no Wix session context)
- [ ] **5.2.2** Document: `socialPostingService.jsw` can be extracted as a standalone Cloud Run microservice with only these changes:
  - Replace `socialSecretService.jsw` with `GCPSecretProvider`
  - Replace `socialQueueService.jsw` Airtable calls with Cloud SQL/Firestore
  - Replace `jobs.config` job with Cloud Scheduler trigger
- [x] **5.2.3** Add a `SOCIAL_RUNTIME` config flag to `configData.js` for future runtime targeting

### 5.3 â€” Multi-Tenant Readiness (Future)

- [x] **5.3.1** Verify all functions accept `pageId` and `igUserId` as explicit parameters (no hardcoded IDs)
- [x] **5.3.2** Verify secret keys use `_{account_id}` suffix pattern â€” ready for multiple clients
- [ ] **5.3.3** Document multi-tenant considerations in spec.md Section 5 (token scope separation confirmed âœ…)

**Acceptance Criteria:**
- `socialSecretService.jsw` uses the provider pattern and routes to `WixSecretProvider` by default with zero behavior change
- A comment block in each migration-relevant file documents what must change for Cloud Run deployment
- All post functions accept `pageId` / `igUserId` explicitly â€” no hardcoded account IDs in service logic

**Phase 5 Kill Switch:** No functional changes made; this is refactoring only.

---

## Track Completion Criteria

The track is **done** when:
- [ ] Phase 1: Live FB and IG posts confirmed via manual test
- [ ] Phase 2: All post types callable; queue model operational; `post.both()` working
- [ ] Phase 3: IG queue job running; FB native scheduling confirmed; rate limit guard active
- [ ] Phase 4: 3x retry + dead-letter verified; nightly token health job running; audit log populated
- [ ] Phase 5: Secrets provider abstraction in place; Cloud Run migration notes written
- [x] Full test suite passing: `socialPostingService.test.js`, `socialQueueService.test.js`, `socialRateLimitService.test.js`, `socialTokenService.test.js`
- [x] Zero hardcoded page/IG IDs in service files
- [ ] `SOCIAL_POSTING_ENABLED` kill switch confirmed to work

---

*End of Plan*



