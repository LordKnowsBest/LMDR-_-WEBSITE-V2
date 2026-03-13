# Admin OS — Fix CORS, Wire Agent Chat, Apply Lessons Learned

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **Pre-read:** `docs/plans/2026-03-11-frontend-lessons-learned.md` — anti-patterns found in Driver OS.

**Goal:** Fix the Admin OS dashboard CORS errors, move client-side Cloud Run calls to server actions, and wire an AI admin agent chat (same pattern as Driver OS, avoiding the same bugs).

**Architecture:** Admin dashboard currently makes direct browser→Cloud Run fetch calls that hit CORS. Fix by routing through server actions. Then add admin agent chat using the existing `lmdr-ai-service` orchestrator at the correct `/ai/agent/turn` path.

**Tech Stack:** Next.js 14, Cloud Run, lmdr-ai-service (Claude Sonnet 4), TypeScript

---

## Findings from Live Testing (2026-03-11)

### Finding 1: Dashboard CORS Errors (P0 — Dashboard Shows Mock Data)
- Admin dashboard (`page.tsx` line 59-60) calls `analyticsApi.getDashboard()` and `analyticsApi.getFeatureAdoption()`
- These call `lmdr-analytics-service` **directly from the browser** (client component)
- CORS blocks the request: `No 'Access-Control-Allow-Origin' header`
- Dashboard gracefully degrades to mock/fallback data
- **Same bug on both `lastmiledr.app/admin` AND Cloud Run direct** — it's not a Firebase issue

### Finding 2: No Admin Agent Chat (P1 — Missing Feature)
- Admin layout has no chat overlay, no command bar, no agent wiring
- Admin Cloud Run routes DO have a `/v1/admin/manifest` with 54 tool definitions
- The AI service at `/ai/agent/turn` supports `role: 'admin'`
- Just needs the frontend wiring

### Finding 3: Observability Page Uses NEXT_PUBLIC_ URLs (P2 — Will Break)
- `observability/page.tsx` lines 43-47 reference `NEXT_PUBLIC_LMDR_*` env vars
- These are client-side env vars that expose Cloud Run URLs to the browser
- Any client-side health check to these URLs will hit CORS
- Should be moved to server actions

---

## Task 1: Create Admin Dashboard Server Action (P0)

**Files:**
- Create: `frontend/src/app/(admin)/actions/dashboard.ts` (replace analytics API calls)
- Modify: `frontend/src/app/(admin)/admin/page.tsx` (use server action instead of analyticsApi)

**Step 1: Check if dashboard.ts already exists and what it exports**

File `frontend/src/app/(admin)/actions/dashboard.ts` already exists with `getDashboardOverview()` and `getQuickStats()`. These go through `adminFetch` → `lmdr-api` Cloud Run. But the dashboard page ignores these and calls `analyticsApi` (browser-side) instead.

**Step 2: Add analytics server actions to dashboard.ts**

Add two new server actions that proxy the analytics service calls through the server:

```typescript
// Add to frontend/src/app/(admin)/actions/dashboard.ts

const ANALYTICS_URL = process.env.LMDR_ANALYTICS_SERVICE_URL || 'https://lmdr-analytics-service-140035137711.us-central1.run.app';

export async function getAnalyticsDashboard() {
  try {
    const res = await fetch(`${ANALYTICS_URL}/analytics/dashboard`, {
      headers: {
        'Authorization': `Bearer ${INTERNAL_KEY}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch {
    return null;
  }
}

export async function getFeatureAdoption() {
  try {
    const res = await fetch(`${ANALYTICS_URL}/analytics/feature-adoption`, {
      headers: {
        'Authorization': `Bearer ${INTERNAL_KEY}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch {
    return null;
  }
}
```

**Step 3: Update admin dashboard page to use server actions**

In `frontend/src/app/(admin)/admin/page.tsx`:

```typescript
// BEFORE (line 10):
import { analyticsApi } from '@/lib/api';

// AFTER:
import { getAnalyticsDashboard, getFeatureAdoption } from '../actions/dashboard';

// BEFORE (lines 59-60):
const { data: dashData, ... } = useApi<...>(() => analyticsApi.getDashboard() ...);
const { data: adoptionData, ... } = useApi<...>(() => analyticsApi.getFeatureAdoption() ...);

// AFTER:
const { data: dashData, loading: dashLoading, error: dashError, refresh: refreshDash } = useApi<Record<string, unknown>>(
  () => getAnalyticsDashboard().then(d => ({ data: d as Record<string, unknown> }))
);
const { data: adoptionData, loading: adoptionLoading, error: adoptionError, refresh: refreshAdoption } = useApi<Record<string, unknown>>(
  () => getFeatureAdoption().then(d => ({ data: d as Record<string, unknown> }))
);
```

**Step 4: Verify**

Navigate to `https://lmdr-frontend-...run.app/admin` — CORS errors should be gone. If analytics service is up, real data loads. If not, mock fallbacks still work.

**Step 5: Commit**

```bash
git add frontend/src/app/(admin)/actions/dashboard.ts frontend/src/app/(admin)/admin/page.tsx
git commit -m "fix(admin): route analytics calls through server actions to avoid CORS"
```

---

## Task 2: Fix Analytics Page Same CORS Issue (P0)

**Files:**
- Modify: `frontend/src/app/(admin)/admin/analytics/page.tsx`

**Step 1: Same fix as Task 1 — replace analyticsApi with server action**

The analytics page (line 55) also uses `analyticsApi.getDashboard()` directly. Replace with the same server action import.

**Step 2: Commit**

```bash
git add frontend/src/app/(admin)/admin/analytics/page.tsx
git commit -m "fix(admin): route analytics page data through server actions"
```

---

## Task 3: Fix Observability Page NEXT_PUBLIC_ URLs (P2)

**Files:**
- Modify: `frontend/src/app/(admin)/admin/observability/page.tsx`
- Create or modify: `frontend/src/app/(admin)/actions/observability.ts`

**Step 1: Move service health checks to server action**

The observability page (lines 43-47) has `NEXT_PUBLIC_*` URLs for health checking 5 Cloud Run services. These should be server actions that ping each service from the server side.

Add to `frontend/src/app/(admin)/actions/observability.ts`:

```typescript
export async function getServiceHealth() {
  const services = [
    { key: 'api-gateway', url: process.env.LMDR_API_URL || 'https://lmdr-api-140035137711.us-central1.run.app' },
    { key: 'ai-intelligence', url: process.env.LMDR_AI_SERVICE_URL || 'https://lmdr-ai-service-140035137711.us-central1.run.app' },
    { key: 'analytics-pipe', url: process.env.LMDR_ANALYTICS_SERVICE_URL || 'https://lmdr-analytics-service-140035137711.us-central1.run.app' },
  ];

  const results = await Promise.all(
    services.map(async (svc) => {
      try {
        const res = await fetch(`${svc.url}/health`, { signal: AbortSignal.timeout(5000) });
        return { key: svc.key, status: res.ok ? 'healthy' : 'degraded', latencyMs: 0 };
      } catch {
        return { key: svc.key, status: 'down', latencyMs: -1 };
      }
    })
  );

  return results;
}
```

**Step 2: Remove NEXT_PUBLIC_ env var references from observability page**

Replace the hardcoded `NEXT_PUBLIC_*` URLs with calls to `getServiceHealth()` server action.

**Step 3: Commit**

```bash
git add frontend/src/app/(admin)/actions/observability.ts frontend/src/app/(admin)/admin/observability/page.tsx
git commit -m "fix(admin): move service health checks to server actions, remove NEXT_PUBLIC_ URLs"
```

---

## Task 4: Wire Admin Agent Chat (P1)

**Files:**
- Create: `frontend/src/app/(admin)/actions/agent.ts`
- Modify: `frontend/src/app/(admin)/layout.tsx`
- May need: Admin chat drawer component

**Step 1: Create admin agent server action**

```typescript
// frontend/src/app/(admin)/actions/agent.ts
'use server';

const AI_SERVICE_URL = process.env.LMDR_AI_SERVICE_URL || 'https://lmdr-ai-service-140035137711.us-central1.run.app';
const INTERNAL_KEY = process.env.LMDR_INTERNAL_KEY || '';

export async function adminAgentTurn(
  userMessage: string,
  context?: { conversationId?: string }
): Promise<{ text: string; conversationId?: string; error?: string }> {
  try {
    // CORRECT PATH: /ai/agent/turn (NOT /agent/turn — see lessons-learned.md)
    const res = await fetch(`${AI_SERVICE_URL}/ai/agent/turn`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERNAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'admin',
        userId: 'admin-user',  // TODO: wire real admin auth
        message: userMessage,
        context: context || {},
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { text: '', error: body?.error || `AI service returned ${res.status}` };
    }

    const json = await res.json();
    const data = json.data || json;

    return {
      text: data.response || data.text || "I couldn't process that request.",
      conversationId: data.conversationId,
    };
  } catch (err) {
    console.error('[admin-agent] Error:', err);
    return {
      text: "The AI assistant is temporarily unavailable. Try again in a moment.",
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
```

**Step 2: Add chat UI to admin layout**

The admin layout currently has no chat. Add a floating FAB + chat drawer, following VelocityMatch branding (not LMDR — admin is VM-branded per CLAUDE.md).

Modify `frontend/src/app/(admin)/layout.tsx` to:
1. Import `adminAgentTurn` from `./actions/agent`
2. Add state for chat messages, chat open/closed
3. Add a floating "VM" chat FAB in bottom-right
4. Add a slide-out chat panel with message history
5. On send → call `adminAgentTurn()` → display response

**Key design decisions (from lessons learned):**
- Do NOT build a tool-use loop in the frontend — the AI service orchestrator handles it
- Use `role: 'admin'` — the AI service has admin-specific system prompts and tools
- Keep conversation history on the client (conversationRef) and pass conversationId for multi-turn
- Use VelocityMatch branding: "VM" logo, "VelocityMatch Assistant" title

**Step 3: Verify**

Navigate to admin → click chat FAB → type "How many drivers are active?" → should get real response from Claude.

**Step 4: Commit**

```bash
git add frontend/src/app/(admin)/actions/agent.ts frontend/src/app/(admin)/layout.tsx
git commit -m "feat(admin): wire AI admin assistant chat with correct /ai/agent/turn path"
```

---

## Task 5: Build and Deploy

Same as Driver OS Task 6:

```bash
cd frontend && npm run build
# Deploy Cloud Run frontend
gcloud builds submit --config=cloudbuild.yaml
# Redeploy Firebase Hosting
firebase deploy --only hosting
```

Verify on live URL:
1. `https://www.lastmiledr.app/admin` — no CORS errors, real data loads (or clean fallback)
2. Chat FAB visible → type message → AI responds
3. Observability page → service health dots work without CORS

---

## Task 6: Audit All Other Surfaces (Checklist)

Before building recruiter/carrier/B2B frontends, verify against the checklist in `docs/plans/2026-03-11-frontend-lessons-learned.md`:

- [ ] No `NEXT_PUBLIC_LMDR_*` env vars for Cloud Run service URLs
- [ ] All data calls through `'use server'` actions
- [ ] Agent chat uses `/ai/agent/turn` (not `/agent/turn`)
- [ ] Agent sends `{ role, userId, message }` (not `{ systemPrompt, messages, tools }`)
- [ ] firebase.json has `no-cache` headers for surface routes
- [ ] Layout has no direct `fetch()` to Cloud Run

---

## Priority Summary

| # | Task | Severity | Effort | What it fixes |
|---|------|----------|--------|---------------|
| 1 | Dashboard server actions | P0 | 15 min | CORS errors, mock data fallback |
| 2 | Analytics page fix | P0 | 5 min | Same CORS on analytics page |
| 3 | Observability NEXT_PUBLIC fix | P2 | 15 min | Future CORS prevention |
| 4 | Wire admin agent chat | P1 | 30 min | AI assistant for admins |
| 5 | Build & deploy | P0 | 15 min | Changes go live |
| 6 | Audit surfaces | P2 | 10 min | Prevent same bugs everywhere |

**Total: ~90 minutes**
