# Frontend → Cloud Run: Lessons Learned & Anti-Patterns

> Reference doc for ALL surfaces (Driver, Admin, Recruiter, Carrier, B2B).
> Created 2026-03-11 from live debugging of Driver OS and Admin OS.

---

## Anti-Pattern 1: Client-Side Fetch to Cloud Run Services

**Symptom:** CORS errors in browser console. "API unavailable — showing cached data."

**Root Cause:** `'use client'` components calling Cloud Run services directly from the browser. Cloud Run services don't serve CORS headers for arbitrary browser origins.

**Where it happens:**
- Admin dashboard (`page.tsx`) calls `analyticsApi.getDashboard()` → `lmdr-analytics-service` → CORS block
- Admin observability page references `NEXT_PUBLIC_*` env vars for direct Cloud Run URLs

**Fix:** ALL Cloud Run calls MUST go through Next.js **server actions** (`'use server'`). Server actions run on the Next.js server (same Cloud Run), so there's no CORS issue. The browser only talks to the Next.js server, never to backend services directly.

```
WRONG:  Browser → Cloud Run service (CORS blocked)
RIGHT:  Browser → Next.js server action → Cloud Run service (server-to-server, no CORS)
```

**Rule:** Never use `NEXT_PUBLIC_*` env vars for Cloud Run service URLs. If the URL is in the browser, it will hit CORS. Use `LMDR_*` (server-only) env vars in server actions instead.

---

## Anti-Pattern 2: Stale Firebase Hosting HTML Cache

**Symptom:** "Application error: a client-side exception has occurred" with `ChunkLoadError`.

**Root Cause:** Firebase Hosting caches the HTML document that references hashed chunk filenames (e.g., `layout-bfcc7c0acf0c581a.js`). When Cloud Run is redeployed with a new Next.js build, the chunk hashes change, but Firebase still serves the old HTML pointing to old hashes. The `/_next/**` rewrite proxies to Cloud Run, which only has the new chunks → 404.

**Fix:** Add `Cache-Control: no-cache, no-store, must-revalidate` headers for all routes that proxy to Cloud Run:

```json
{
  "hosting": {
    "headers": [
      { "source": "/driver/**", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] },
      { "source": "/admin/**", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] }
    ]
  }
}
```

**Alternative:** Always redeploy Firebase Hosting immediately after deploying Cloud Run frontend. But headers are safer as a belt-and-suspenders approach.

---

## Anti-Pattern 3: URL Path Mismatch Between Frontend and Service

**Symptom:** `{"error":"POST /agent/turn not found"}` — 404 from AI service.

**Root Cause:** The AI service mounts routes at `/ai/agent/turn` (see `app.ts` line 20: `app.use('/ai/agent', agentRouter)`), but the frontend calls `/agent/turn` — missing the `/ai` prefix.

**Fix:** Always verify the actual route mounting in the target service's `app.ts` or `server.ts` before writing the frontend action. Match the full path.

**Verification command:**
```bash
# Check what paths a Cloud Run service actually serves:
curl -s https://<service-url>/health  # health check
curl -s -o /dev/null -w "%{http_code}" https://<service-url>/ai/agent/turn  # test actual path
```

---

## Anti-Pattern 4: Protocol Mismatch Between Frontend and Backend

**Symptom:** AI service responds 200 but the frontend can't parse the response, or tools never execute.

**Root Cause:** Frontend sends `{ systemPrompt, messages, tools, maxTokens }` but the backend expects `{ role, userId, message, context }`. Two completely different contracts. The frontend tried to implement its own tool-use loop, while the backend already has a full orchestrator.

**Fix:** Don't duplicate orchestration logic. If the backend service has a complete orchestrator (conversation management, tool execution, token limits), the frontend should send a simple message and receive a text response. Don't re-implement the tool loop on the frontend.

```
WRONG:  Frontend builds tool defs → calls AI → parses tool_use → executes tools → loops
RIGHT:  Frontend sends message → backend orchestrator handles everything → returns text
```

---

## Anti-Pattern 5: `useApi` Hook with Direct Service Calls

**Symptom:** Works in development (same-origin), fails in production (cross-origin).

**Root Cause:** `useApi` hook calls API functions that fetch from external Cloud Run services. In development, you might not notice CORS because you're on localhost with a proxy. In production, the browser is on `lastmiledr.app` and the service is on `*.run.app` — different origins.

**Fix:** `useApi` should ONLY call Next.js server actions, never external APIs directly.

---

## Correct Architecture Pattern

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser    │────▶│  Next.js Server  │────▶│  Cloud Run APIs  │
│ (use client) │     │ (server actions)  │     │  (lmdr-api, etc) │
│              │◀────│                  │◀────│                  │
└─────────────┘     └──────────────────┘     └─────────────────┘
     RSC              'use server'            Internal auth
   No CORS          LMDR_INTERNAL_KEY         No CORS needed
```

**Every page follows this pattern:**
1. **Page component** (`'use client'`) calls server actions via `useApi` hook or direct `await`
2. **Server action** (`'use server'`) imports from `@/lib/admin-api` or `@/lib/driver-api`
3. **API client** (`adminFetch`/`driverFetch`) adds auth headers and calls Cloud Run
4. **Cloud Run** processes the request and returns data
5. **Server action** returns typed data to the component

**No step involves the browser calling Cloud Run directly.**

---

## Checklist for New Surfaces

When adding a new surface (recruiter, carrier, B2B), verify:

- [ ] Layout file is `'use client'` but has NO direct `fetch()` to Cloud Run
- [ ] All data calls go through `actions/*.ts` files marked `'use server'`
- [ ] No `NEXT_PUBLIC_LMDR_*` env vars used for Cloud Run URLs
- [ ] Server actions use `process.env.LMDR_API_URL` (server-only)
- [ ] firebase.json has `no-cache` headers for the surface's routes
- [ ] Agent/chat calls use correct path prefix (check service's `app.ts` mount point)
- [ ] Agent action sends `{ role, userId, message }` not `{ systemPrompt, messages, tools }`
- [ ] After deploy: verify on live URL (not just Cloud Run direct)
