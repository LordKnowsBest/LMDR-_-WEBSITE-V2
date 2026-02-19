# Graph API Organic Posting — Specification

**Track:** `graph_api_org_posting_20260219`
**Version:** 1.0
**Date:** 2026-02-19
**Status:** Planning

---

## 1. Context

LMDR currently uses the **Meta Marketing API** (via `metaCampaignService.jsw`, `metaAdSetService.jsw`, `metaCreativeService.jsw`, `metaGovernanceService.jsw`) for paid advertising. This existing integration handles ad campaigns, ad sets, creatives, and governance.

This track adds **organic (non-paid) posting** to:
- **Facebook Page timelines** via the Graph API (`/{page-id}/feed`)
- **Instagram professional account feeds and Reels** via the Instagram Graph API (`/{ig-user-id}/media` → `/{ig-user-id}/media_publish`)

These are **entirely separate API surfaces** from the Marketing API. Marketing API objects (campaigns, ads, ad sets) are NOT used here. Organic posts can optionally be boosted later but that is **out of scope** for this track.

---

## 2. Goals

### MVP (Day 1)
- Post a text-only message to a Facebook Page timeline via `POST /{page-id}/feed`
- Post a single image to an Instagram professional account feed via the two-step container + publish flow
- Tokens stored in Wix Secrets Manager
- Minimal error handling: log failure reason, do not silently swallow errors
- Manual trigger only (no scheduling at MVP)

### v1 (Full Implementation)
- Support all major Facebook post types: text, link, photo, video
- Support all major Instagram post types: image, carousel, video, Reels
- Unified `post.both()` workflow that dispatches to FB and IG in parallel
- Post queue data model with status tracking (`queued → processing → published → failed`)
- Idempotency and deduplication via a `dedupe_key`
- Scheduling (publish at future time without cron sprawl)
- Rate limit enforcement (IG: 50 posts / 24h; enforced pre-publish)
- Structured retry + dead-letter queue
- Full audit logs
- Token lifecycle management (renewal workflow, revocation detection)
- Abstracted secrets provider (Wix Secrets Manager v1 → GCP Secret Manager v2)

---

## 3. Capability Matrix

> **Citation source:** [Meta Graph API — Page Feed Publishing](https://developers.facebook.com/docs/graph-api/reference/page/feed/)
> **Citation source:** [Instagram Graph API — Content Publishing Guide](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)

### 3.1 Facebook Page Timeline Posts

| Format | Supported | Endpoint | Key Parameters | Notes |
|--------|-----------|----------|----------------|-------|
| Text post | ✅ Yes | `POST /v25.0/{page-id}/feed` | `message` | Either `message` or `link` required |
| Link preview post | ✅ Yes | `POST /v25.0/{page-id}/feed` | `link`, `message` | Viewer must be able to see the link URL or post fails |
| Photo post (URL) | ✅ Yes | `POST /v25.0/{page-id}/photos` | `url`, `message` | See [Photo Node Reference](https://developers.facebook.com/docs/graph-api/reference/photo/#Creating) |
| Photo post (multi) | ✅ Yes | `POST /v25.0/{page-id}/feed` with `child_attachments` | 2–5 objects (10 with `multi_share_optimized`) | |
| Video post | ✅ Yes | `POST /v25.0/{page-id}/videos` | `source` or `file_url`, `description` | See [Page Video Reference](https://developers.facebook.com/docs/graph-api/reference/page/videos/) |
| Backdated post | ✅ Yes | `POST /v25.0/{page-id}/feed` | `backdated_time`, `backdated_time_granularity` | |
| Scheduled post | ✅ Yes | `POST /v25.0/{page-id}/feed` | `published=false`, `scheduled_publish_time` | Must be 10 min – 75 days in future |
| Story | ❌ No (via Graph API) | — | — | Stories require Mobile SDK or Creator Studio |
| Direct Message | ❌ Out of scope | — | — | Messenger API, different surface |

**Constraints:**
- Token must be a **Page access token** (not User token)
- The authenticated user must be able to perform the `CREATE_CONTENT` task on the Page
- Posts appear in the **voice of the Page**, not a personal profile
- The `New Page Experience` format is supported
- Unpublished (dark) posts supported via `published=false` (used for scheduling or ad dark posts)
- Rate limits: governed by standard Platform Rate Limits; no explicit per-Page publish limit documented for organic text/image. Monitor `X-App-Usage` header.

### 3.2 Instagram Professional Account Posts

> **Citation:** [Instagram Content Publishing — Requirements & Limitations](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
> **Citation:** [IG User Content Publishing Limit](https://developers.facebook.com/docs/instagram-api/reference/ig-user/content_publishing_limit)

| Format | Supported | Container Endpoint | Publish Endpoint | Key Parameters | Notes |
|--------|-----------|---------|----------|----------------|-------|
| Single image | ✅ Yes | `POST /{ig-id}/media` | `POST /{ig-id}/media_publish` | `image_url`, `caption` | JPEG only (MPO/JPS unsupported) |
| Carousel (multi-image) | ✅ Yes | `POST /{ig-id}/media` per item + carousel container | `POST /{ig-id}/media_publish` | `is_carousel_item=true`, then carousel container with `children[]` | Counts as 1 post toward rate limit |
| Single video | ✅ Yes | `POST /{ig-id}/media` with `media_type=VIDEO` | `POST /{ig-id}/media_publish` | `video_url` (public server) or resumable upload | Async processing; poll `status_code` |
| Reels | ✅ Yes | `POST /{ig-id}/media` with `media_type=REELS` | `POST /{ig-id}/media_publish` | `video_url`, use `rupload.facebook.com` for binary upload | After publish, `media_type` returns `VIDEO`; check `media_product_type` for REELS |
| Story | ✅ Yes (flag `media_type=STORIES`) | `POST /{ig-id}/media` | `POST /{ig-id}/media_publish` | `media_type=STORIES` | Ephemeral — expires 24h |
| Shopping tags | ❌ Unsupported | — | — | Per API limitations |
| Branded content tags | ❌ Unsupported | — | — | Per API limitations |
| Filters | ❌ Unsupported | — | — | Per API limitations |

**Critical Constraints:**
- **Media must be on a public server** at time of publish attempt — Meta cURLs the image/video URL directly. For Wix-hosted media, ensure the URL is publicly accessible before calling the API.
- **Image format:** JPEG only. No PNG, WebP, HEIC, etc.
- **Rate limit:** 50 API-published posts per IG account per 24-hour rolling window (the `content_publishing_limit` endpoint reports `quota_total: 50`, `quota_duration: 86400`). Carousels count as 1.
  - Pre-check: `GET /{ig-id}/content_publishing_limit?fields=quota_usage,config&since={unix_ts}`
- **Page Publishing Authorization (PPA):** If the linked Facebook Page requires PPA approval, posting is blocked until PPA is completed. There is no API way to detect if PPA is required — recommend advising users to preemptively complete PPA.
- **Account type:** IG account must be a **Business or Creator professional account**, linked to a Facebook Page. Personal accounts cannot use the Content Publishing API.
- **Async video/Reels processing:** After creating a container for video, poll `GET /{container-id}?fields=status_code` until `status_code=FINISHED` before calling `media_publish`. Possible states: `EXPIRED`, `ERROR`, `FINISHED`, `IN_PROGRESS`, `PUBLISHED`.

---

## 4. Preconditions Checklist

> **Citation:** [Pages API Overview — Tasks & Permissions](https://developers.facebook.com/docs/pages/overview/permissions-features)
> **Citation:** [Instagram Platform — Content Publishing Requirements](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)

### Facebook Page
- [ ] A Facebook Page exists (not a personal profile — organic posting to profiles via API is not supported)
- [ ] The authenticated user has the `CREATE_CONTENT` task on the Page (or is a Page Admin)
- [ ] App has been granted (and passed App Review for) the following permissions:
  - `pages_manage_posts` — required to publish to the Page feed
  - `pages_read_engagement` — required alongside `pages_manage_posts`
  - `pages_show_list` — required alongside `pages_manage_posts`
- [ ] A **Page access token** has been obtained and stored (not a User token)
- [ ] App is in **Live Mode** (Development Mode restricts posting to app testers/developers only)

### Instagram Professional Account
- [ ] IG account is a **Business or Creator** professional account (not a personal account)
- [ ] IG account is **linked to the Facebook Page** used for Page token auth
- [ ] App has been granted (and passed App Review for):
  - `instagram_business_basic` + `instagram_business_content_publish` (for Business Login for Instagram)
  - OR `instagram_basic` + `instagram_content_publish` + `pages_read_engagement` (for Facebook Login)
  - If the user was granted Page roles via Business Manager, also: `ads_management` + `ads_read`
- [ ] **Advanced Access** approved for `instagram_business_content_publish` (Standard Access only works for app developers/testers in dev mode)
- [ ] **Page Publishing Authorization (PPA)** completed by the IG account owner (preemptively recommended)
- [ ] Media is hosted on a **publicly accessible URL** at time of publish

### App Review
- [ ] All permissions listed above have passed **App Review** (required before non-admin users can grant them in Live Mode)
- [ ] App is in Live Mode before attempting to post on behalf of real Page owners

---

## 5. Auth & Token Model

> **Citation:** [Getting Long-Lived Tokens — Meta for Developers](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived)
> **Citation:** [Pages API Overview — Access Tokens](https://developers.facebook.com/docs/pages/overview/permissions-features)

### Token Types

| Token Type | Lifetime | When Used |
|-----------|---------|-----------|
| Short-lived User Access Token | ~1–2 hours | Initial grant from Facebook Login; exchange immediately |
| Long-lived User Access Token | ~60 days | Used only to obtain Long-lived Page token; store server-side |
| Long-lived Page Access Token | **No expiration*** | Used for all Page posting; store in Secrets Manager |
| Instagram User Access Token | Same as User token scope | Required for IG content publishing; scoped to IG user |

*Long-lived Page tokens **do** expire or get invalidated under certain conditions: user changes their password, user revokes app permission, token has not been used for 90 days, account security event. See [Token Debugging & Error Handling](https://developers.facebook.com/docs/facebook-login/access-tokens/debugging-and-error-handling#expiredtokens).*

### Token Acquisition Flow (One-Time Setup)

```
1. User completes Facebook Login for Business on LMDR backend
2. Receive short-lived User Access Token
3. Server-side: Exchange for long-lived User token
   GET /oauth/access_token?grant_type=fb_exchange_token
     &client_id={app-id}
     &client_secret={app-secret}
     &fb_exchange_token={short-lived-token}
   → Returns long-lived User token (~60 days)
4. Server-side: Get Page token from long-lived User token
   GET /{user-id}/accounts?access_token={long-lived-user-token}
   → Returns array of Pages with long-lived Page access tokens
5. Extract: page_id, page_access_token, ig_user_id (from IG account linked to Page)
6. Store all three in Wix Secrets Manager (v1) or GCP Secret Manager (v2)
```

**CRITICAL:** App secret must NEVER be exposed client-side. All token exchange logic runs in `src/backend/` only.

### Storage v1: Wix Secrets Manager

```javascript
// src/backend/socialSecretService.jsw
import { getSecret } from 'wix-secrets-backend';

async function getFBPageToken(pageId) {
  return getSecret(`meta_page_token_${pageId}`);
}
async function getIGUserToken(igUserId) {
  return getSecret(`meta_ig_token_${igUserId}`);
}
async function getMetaAppSecret() {
  return getSecret('meta_app_secret');
}
```

Secret key naming convention:
- `meta_page_token_{page_id}` — Page access token
- `meta_ig_token_{ig_user_id}` — IG user token
- `meta_app_id` — App ID (less sensitive but stored here for consistency)
- `meta_app_secret` — App secret (highly sensitive)

### Storage v2: GCP Secret Manager (Migration Path)

When the platform migrates to GCP (see `gcp_migration_20260218` track):
1. Create secrets in GCP Secret Manager with IAM-restricted access (Cloud Run SA only)
2. Implement `socialSecretService.jsw` to detect runtime environment and route to the correct provider
3. Token naming convention remains identical (1:1 migration)
4. Enable GCP Secret Manager audit logging for all token reads
5. Use GCP Workload Identity — no stored service account keys in code

```javascript
// Future adapter pattern
const SecretProvider = IS_GCP ? GCPSecretProvider : WixSecretProvider;
const token = await SecretProvider.get(`meta_page_token_${pageId}`);
```

### Token Rotation & Lifecycle

| Event | Action |
|-------|--------|
| Page token nearing 90-day inactivity | Refresh by re-reading the `/accounts` endpoint with current long-lived user token |
| API returns `OAuthException` code 190 | Token expired — trigger re-auth flow, alert admin |
| API returns `OAuthException` code 200/203 | Permission missing — no auto-fix, alert admin |
| Long-lived User token expires (~60 days) | Must re-run login flow to get new short-lived, then exchange again |
| User changes FB password | All tokens for that user are invalidated immediately |

**Proactive monitoring:** Run a nightly job that calls `GET /debug_token?input_token={page_token}&access_token={app-token}` to check `is_valid`, `expires_at`, and `scopes` for each stored token. Alert if `is_valid=false` or expiry < 7 days.

---

## 6. Posting Flows

### 6.1 Facebook Page Timeline Post

```
Caller → socialPostingService.jsw.post.facebook(payload)

1. Retrieve Page access token from Secrets Manager
2. Validate payload: at least one of {message, link} must be present
3. (Optional) Pre-check: GET /debug_token to verify token is valid
4. Build request body based on post_type:
   - text:   { message }
   - link:   { message, link }
   - photo:  Redirect to POST /{page-id}/photos with { url, caption }
   - video:  Redirect to POST /{page-id}/videos with { file_url, description }
5. POST /v25.0/{page-id}/feed
   Host: graph.facebook.com
   Authorization: Bearer {page_access_token}
   Body: { message?, link?, published?, scheduled_publish_time? }
6. Success: { "id": "{page-post-id}" }
   → Record in post log: status=published, platform=facebook, post_id, timestamp
7. Failure modes:
   - 190: Token expired → trigger re-auth alert
   - 200/203: Permission denied → alert, do not retry
   - 341: Feed action throttling → back off 60s, retry up to 3x
   - Network timeout → retry with exponential backoff
```

**Response shape on success:**
```json
{ "id": "{page-id}_{post-id}" }
```

**Read-after-write:** The endpoint supports read-after-write. You may append `&fields=id,message,created_time` to the POST to get the created post fields in the response.

### 6.2 Instagram Image/Carousel/Video/Reels Post

```
Caller → socialPostingService.jsw.post.instagram(payload)

STEP 1 — PRE-CHECK RATE LIMIT
GET /v25.0/{ig-user-id}/content_publishing_limit
  ?fields=quota_usage,config
  &since={unix_timestamp_24h_ago}
  &access_token={ig_user_token}
→ If quota_usage >= 50: reject with RateLimitError, do not attempt

STEP 2 — CREATE MEDIA CONTAINER
POST /v25.0/{ig-user-id}/media
  Host: graph.instagram.com
  Authorization: Bearer {ig_user_token}
  Body (image):     { image_url, caption?, media_type? }
  Body (video):     { video_url, media_type=VIDEO, caption? }
  Body (Reels):     { video_url, media_type=REELS, caption? }
  Body (carousel):  { media_type=CAROUSEL, children=[c1_id,c2_id,...], caption? }
→ Returns: { "id": "{container-id}" }
→ Store container_id + timestamp in post queue record, status=processing

STEP 3 — (VIDEO/REELS ONLY) POLL CONTAINER STATUS
GET /v25.0/{container-id}?fields=status_code&access_token={ig_user_token}
Poll every 5 seconds, max 10 attempts (50s):
  status_code=FINISHED → proceed
  status_code=IN_PROGRESS → wait
  status_code=ERROR → abort, record failure, do not publish
  status_code=EXPIRED → container expired (must recreate), record failure
  timeout after 10 attempts → treat as ERROR

STEP 4 — PUBLISH CONTAINER
POST /v25.0/{ig-user-id}/media_publish
  Host: graph.instagram.com (or graph.facebook.com)
  Authorization: Bearer {ig_user_token}
  Body: { creation_id: "{container-id}" }
→ Returns: { "id": "{ig-media-id}" }
→ Update post queue record: status=published, media_id, published_at

FAILURE MODES:
  - quota_usage >= 50: RateLimitError — do not retry today
  - Container status=ERROR: MediaProcessingError — do not publish; alert + retry tomorrow
  - Container status=EXPIRED: ContainerExpiredError — recreate container, retry once
  - OAuthException 190: TokenExpiredError — trigger re-auth
  - OAuthException 200/203: PermissionError — alert admin, no retry
  - Network failure at STEP 2: safe to retry (container not created)
  - Network failure at STEP 4: DANGEROUS — container may have been published;
      check GET /{container-id}?fields=status_code FIRST before retrying publish
```

### 6.3 Post-to-Both Workflow

```
Caller → socialPostingService.jsw.post.both(payload)

1. Validate payload has all required fields for both platforms
2. Dedupe check: query post queue by dedupe_key — if found + status=published, reject
3. Create post queue record: { dedupe_key, status=queued, platforms=['facebook','instagram'] }
4. Dispatch in parallel:
   Promise.allSettled([
     post.facebook(fbPayload),
     post.instagram(igPayload)
   ])
5. Evaluate results:
   - Both success → status=published
   - One success, one fail → status=partial; log which platform failed
   - Both fail → status=failed; trigger retry flow
6. Update post queue record with final status, individual platform results
```

---

## 7. Reliability, Rate Limits & Observability

### Rate Limits

| Platform | Limit | Enforcement Point | How to Check |
|----------|-------|------------------|-------------|
| Instagram | 50 posts / 24h rolling | Pre-publish check (Step 1) | `GET /{ig-id}/content_publishing_limit?fields=quota_usage,config` — `config.quota_total=50`, `config.quota_duration=86400` |
| Facebook Page | Standard Platform Rate Limits (throttling code 341) | Response header `X-App-Usage` | Monitor `call_count`, `total_time`, `total_cputime` |

### Retry Strategy

| Error Type | Retryable | Strategy |
|-----------|-----------|---------|
| Network timeout | Yes | Exponential backoff: 5s, 15s, 45s, max 3 attempts |
| Rate limit (IG quota=50) | No | Defer to next 24h window; record in queue |
| Rate limit (FB throttle 341) | Yes | Fixed 60s back-off, 3 attempts |
| Media processing error | No (same payload) | Human review required |
| Token expired (OAuthException 190) | No | Alert admin; requires re-auth flow |
| Permission error (200/203) | No | Alert admin; no auto-retry |
| FB link invisible error | No | Content fix required |
| Container expired (IG EXPIRED) | Yes (once) | Recreate container, retry publish once |

### Idempotency / Dedupe

- Every post request accepts a `dedupe_key` (string, e.g. hash of `platform+content+timestamp`)
- Before creating a container or posting to FB, query the post queue table for existing record with matching `dedupe_key`
- If found with `status=published`, reject with `DuplicatePostError`
- If found with `status=processing` and `created_at < 10 minutes ago`, assume stale — re-process
- If found with `status=failed`, allow retry (create new attempt record)

### Error Taxonomy

| Code | Name | Description | Action |
|------|------|-------------|--------|
| `TOKEN_EXPIRED` | OAuthException code 190 | Page or IG user token invalidated | Re-auth flow, admin alert |
| `PERMISSION_MISSING` | OAuthException code 200/203 | App lacks required permission | Admin alert, manual fix |
| `RATE_LIMITED_IG` | IG quota_usage >= 50 | 24h publish limit reached | Defer to next window |
| `RATE_LIMITED_FB` | Error code 341 | Facebook throttling | Retry with back-off |
| `MEDIA_PROCESSING_FAILED` | Container status=ERROR | IG media rejected by Meta | Human review |
| `CONTAINER_EXPIRED` | Container status=EXPIRED | Container not published in time | Recreate and retry |
| `DUPLICATE_POST` | dedupe_key match + published | Attempt to re-post identical content | Reject silently |
| `MEDIA_NOT_PUBLIC` | HTTP 400 on container create | Media URL not publicly accessible | Fix URL, retry |
| `LINK_INVISIBLE` | HTTP 400 on FB post | Link URL not crawlable by Meta | Fix URL or remove link |
| `NETWORK_TIMEOUT` | Fetch timeout | Transient infrastructure error | Retry with back-off |

### Observability (Logs & Metrics)

Metrics to track per post attempt:
- `social.post.attempted` — counter by platform
- `social.post.succeeded` — counter by platform
- `social.post.failed` — counter by platform + error_type
- `social.post.duration_ms` — histogram (from dispatch to published_at)
- `social.ig.quota_usage` — gauge per account (sampled hourly)
- `social.token.validation_failed` — counter by account

Log fields for every post event:
```json
{
  "event": "social_post_published | social_post_failed",
  "platform": "facebook | instagram",
  "dedupe_key": "...",
  "post_id": "...",         // only on success
  "container_id": "...",    // IG only
  "error_type": "...",      // only on failure
  "error_code": 190,
  "retry_count": 0,
  "duration_ms": 1234,
  "timestamp": "2026-02-19T17:00:00Z"
}
```

Route to `observabilityService.jsw` for admin dashboard visibility.

---

## 8. Security Model

| Principle | Implementation |
|-----------|---------------|
| No tokens in browser | All API calls made from `src/backend/*.jsw` only; HTML/frontend never sees tokens |
| No tokens in page code | Velo page code (frontend) only calls backend functions via `import { ... } from 'backend/...'` |
| App secret server-side only | `meta_app_secret` accessed only within `socialSecretService.jsw`; never returned to caller |
| Least privilege | Request only the permissions actually used; no `manage_pages` or broad scopes |
| Scope separation | Each brand/client (future multi-tenant) gets its own set of secrets keyed by `page_id` / `ig_user_id` |
| Audit logging | Every token read and post attempt logged to `v2_Social Post Log` Airtable table |
| Token rotation alerts | Nightly token health check job emails admin on any `is_valid=false` or near-expiry |
| Kill switch | `SOCIAL_POSTING_ENABLED` feature flag in `configData.js`; all post methods check this flag first |

---

## 9. Out of Scope (This Track)

The following are **explicitly excluded** from this track:

- **Comment moderation or reply automation** (Messenger/Webhooks API — separate track)
- **Facebook DM / Messenger automation** (requires Messenger Platform integration)
- **Instagram Direct Messages** (Messaging API — different permission set)
- **Paid post boosting** (covered by existing `metaCampaignService.jsw` track)
- **Twitter/X, LinkedIn, TikTok posting** (different platforms — future tracks)
- **Facebook Profile posting** (Graph API does not support posting to personal user timelines on behalf of apps)
- **Instagram Personal Account posting** (API requires Business or Creator accounts)
- **Real-time feed webhooks / listening** (requires Webhooks subscription — separate concern)
- **Facebook Stories** (not supported via Graph API; requires Creator Studio or Mobile SDK)
- **Hashtag research or analytics** (separate analytics surface)
- **IG Shopping product tagging** (not supported by Content Publishing API per documented limitations)

---

## 10. Data Model

### Post Queue Record (Airtable: `v2_Social Post Queue`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | Auto ID | Primary key |
| `dedupe_key` | String | SHA-256 of platform+caption+media_url+account_id |
| `platform` | Multi-select | `facebook`, `instagram` |
| `post_type` | String | `text`, `link`, `photo`, `video`, `carousel`, `reels` |
| `status` | Select | `queued`, `processing`, `published`, `failed`, `partial` |
| `fb_post_id` | String | Returned by FB on success |
| `ig_media_id` | String | Returned by IG on success |
| `ig_container_id` | String | Created in Step 2 of IG flow |
| `error_type` | String | From error taxonomy |
| `error_message` | Long text | Raw API error |
| `retry_count` | Number | 0–3 |
| `scheduled_for` | DateTime | If scheduled; null = immediate |
| `published_at` | DateTime | Actual publish timestamp |
| `created_at` | DateTime | Record creation |
| `payload_snapshot` | JSON | Snapshot of original payload (for retry/audit) |

---

## 11. Architecture Decision: Wix Backend vs Cloud Run

**Recommendation: Wix Backend (`.jsw`) for v1; Cloud Run adapter for v2**

**Rationale:**
- All existing backend services, secrets, and data live in Wix. Standing up a Cloud Run service for just this feature adds unnecessary operational overhead for v1.
- The `post.facebook()` and `post.instagram()` flows are stateless HTTP calls that complete within Wix's 14-second timeout limit (except video processing, which uses polling loops that are acceptable at this scale).
- Long-running video processing (Reels) uses polling in a job queue (`jobs.config`) to avoid timeout issues.
- When the GCP migration (`gcp_migration_20260218`) ships, the `socialSecretService.jsw` abstraction layer makes secrets migration a single-file change.
- **Cloud Run should be adopted** when: multi-tenant posting (many brands), real-time webhook handling, or high-volume scheduled queue (>20 posts/hour) is needed.

---

*End of Specification*
