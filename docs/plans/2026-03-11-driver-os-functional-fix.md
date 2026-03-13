# Driver OS — Make It Functional (Fix AI Chat, Voice, OCR, Firebase)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the 4 broken features of the live Driver OS: Firebase cache mismatch (page won't load), AI chat (wrong endpoint path), voice (stub-only, no STT), and document OCR (no Cloud Run route).

**Architecture:** The Driver OS is a Next.js app hosted on Cloud Run (`lmdr-frontend`), proxied through Firebase Hosting. AI chat calls a separate `lmdr-ai-service` Cloud Run service. Voice uses Google Cloud TTS via the main `lmdr-api` Cloud Run. Documents upload through Cloud Run to GCS with OCR via Gemini.

**Tech Stack:** Next.js 14, Cloud Run, Firebase Hosting, Anthropic Claude API, Google Cloud TTS, Gemini 2.5 Flash (OCR), TypeScript

---

## Findings from Live Testing (2026-03-11)

### Finding 1: Firebase Hosting Serves Stale HTML (P0 — Page Won't Load)
- `https://www.lastmiledr.app/driver` shows **"Application error: a client-side exception has occurred"**
- Root cause: Firebase cached old HTML referencing chunk `layout-bfcc7c0acf0c581a.js`, but Cloud Run has `layout-35dcbb76b4ad6e24.js`
- **Cloud Run directly (`lmdr-frontend-...run.app/driver`) works perfectly** — full dashboard loads with real data
- Fix: Redeploy Firebase Hosting OR add `Cache-Control: no-cache` headers for HTML documents

### Finding 2: AI Chat Returns 404 on `/agent/turn` (P0 — Chat Broken)
- Command bar sends message → server action calls `${AI_SERVICE_URL}/agent/turn`
- Response: `{"text":"","error":"POST /agent/turn not found"}`
- Root cause: `services/ai-service/src/app.ts` mounts agent router at `/ai/agent`, so the correct path is **`/ai/agent/turn`** not `/agent/turn`
- Fix: Change URL in `frontend/src/app/(driver)/actions/agent.ts` line 133

### Finding 3: Voice is Stub-Only (P1 — No Browser STT)
- Voice button (`mic`) exists in `VoiceCommandBar.tsx` but behavior unknown
- TTS works (server action calls `/v1/voice/tts` → Google Cloud TTS)
- STT (speech-to-text) has no browser-side implementation in Next.js frontend
- The Wix version used Groq Whisper via `voiceService.jsw`, but Next.js has no equivalent
- Fix: Add Web Speech API (browser-native STT) to VoiceCommandBar component

### Finding 4: Document OCR Not Wired to Cloud Run (P1 — Upload Broken)
- `frontend/actions/documents.ts` calls `/v1/files/signed-url` and `/documents/:id/upload`
- Cloud Run has `/v1/driver/documents/:id/upload` but no OCR extraction endpoint
- The Wix version used `ocrService.jsw` → Gemini 2.5 Flash for CDL/medical card extraction
- Fix: Add OCR endpoint to Cloud Run API, wire frontend to call it after upload

---

## Task 1: Fix Firebase Hosting Cache (P0)

**Files:**
- Modify: `firebase.json`
- Run: Firebase deploy command

**Step 1: Add cache-control headers for HTML to firebase.json**

Add a `headers` section to prevent Firebase from caching HTML responses that reference hashed chunks:

```json
{
  "hosting": {
    "headers": [
      {
        "source": "/driver/**",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
        ]
      },
      {
        "source": "/admin/**",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
        ]
      }
    ]
  }
}
```

**Step 2: Redeploy Firebase Hosting**

```bash
firebase deploy --only hosting
```

**Step 3: Verify**

Navigate to `https://www.lastmiledr.app/driver` — should see the full dashboard (Welcome, Marcus), not the error page.

**Step 4: Commit**

```bash
git add firebase.json
git commit -m "fix(firebase): add no-cache headers for driver/admin routes to prevent stale chunk 404s"
```

---

## Task 2: Fix AI Chat Endpoint Path (P0)

**Files:**
- Modify: `frontend/src/app/(driver)/actions/agent.ts:133`

**Step 1: Fix the URL path**

In `frontend/src/app/(driver)/actions/agent.ts`, line 133:

```typescript
// BEFORE (broken):
const res = await fetch(`${AI_SERVICE_URL}/agent/turn`, {

// AFTER (correct):
const res = await fetch(`${AI_SERVICE_URL}/ai/agent/turn`, {
```

The AI service app (`services/ai-service/src/app.ts`) mounts the agent router at `/ai/agent`:
```typescript
app.use('/ai/agent', agentRouter);  // line 20
```

So the agent turn endpoint is `POST /ai/agent/turn`, not `POST /agent/turn`.

**Step 2: Verify locally (optional)**

```bash
curl -X POST https://lmdr-ai-service-140035137711.us-central1.run.app/ai/agent/turn \
  -H "Authorization: Bearer $LMDR_INTERNAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"role":"driver","userId":"demo-driver-001","message":"hello"}'
```

Expected: 200 with `{ data: { conversationId, response, turnId } }`

**Step 3: Commit**

```bash
git add frontend/src/app/(driver)/actions/agent.ts
git commit -m "fix(agent): correct AI service endpoint path from /agent/turn to /ai/agent/turn"
```

---

## Task 3: Wire AI Service Agent Turn to Next.js Frontend Protocol (P0)

**Problem:** Even after fixing the URL, there's a protocol mismatch:
- `frontend/actions/agent.ts` sends `{ systemPrompt, messages, tools, maxTokens }` and expects `{ type: 'text'|'tool_use', text, toolUseBlocks, contentBlocks, stopReason }`
- `services/ai-service/src/routes/agent.ts` expects `{ role, userId, message, context }` and returns `{ data: { conversationId, response, turnId } }`

These are completely different contracts. The frontend is trying to do its own tool loop, but the AI service already has its own orchestrator.

**Files:**
- Modify: `frontend/src/app/(driver)/actions/agent.ts`

**Step 1: Simplify agent.ts to use the Cloud Run AI service orchestrator**

Replace the complex tool-loop implementation with a simple call to the AI service's built-in orchestrator:

```typescript
'use server';

const AI_SERVICE_URL = process.env.LMDR_AI_SERVICE_URL || 'https://lmdr-ai-service-140035137711.us-central1.run.app';
const INTERNAL_KEY = process.env.LMDR_INTERNAL_KEY || '';

const DRIVER_ID = 'demo-driver-001';

export async function agentTurn(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ text: string; error?: string }> {
  try {
    // Derive conversationId from history length (stateless approximation)
    // The AI service will create a new conversation if none exists
    const res = await fetch(`${AI_SERVICE_URL}/ai/agent/turn`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERNAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'driver',
        userId: DRIVER_ID,
        message: userMessage,
        context: {},
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        text: '',
        error: body?.error || `AI service returned ${res.status}`,
      };
    }

    const json = await res.json();
    const data = json.data || json;

    return {
      text: data.response || data.text || "I'm not sure how to help with that. Could you rephrase?",
    };
  } catch (err) {
    console.error('Agent turn error:', err);
    return {
      text: "I'm having trouble connecting right now. Try again in a moment, or check out your Dashboard for quick stats.",
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
```

**Step 2: Run test**

Navigate to Cloud Run driver page → type "hello" in command bar → should get real AI response instead of `POST /agent/turn not found`.

**Step 3: Commit**

```bash
git add frontend/src/app/(driver)/actions/agent.ts
git commit -m "fix(agent): align frontend agent action with AI service orchestrator contract"
```

---

## Task 4: Add Browser-Native Voice Input (STT) (P1)

**Files:**
- Modify: `frontend/src/components/driver/VoiceCommandBar.tsx`

**Step 1: Read current VoiceCommandBar implementation**

Read `frontend/src/components/driver/VoiceCommandBar.tsx` to understand current structure.

**Step 2: Add Web Speech API for browser-native STT**

The Web Speech API (`SpeechRecognition`) is available in Chrome/Edge and provides free, real-time speech-to-text without any API calls. This is the simplest path — no server-side STT needed.

Key changes:
1. When mic button is tapped, start `SpeechRecognition`
2. On `result` event, populate the text input with transcript
3. On `end` event, auto-submit if confident result received
4. Handle `error` event gracefully (show "Voice not available" toast)
5. Visual feedback: pulse animation while listening

Pattern:
```typescript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = false;
recognition.interimResults = true;
recognition.lang = 'en-US';

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  // Fill input with transcript
};

recognition.onend = () => {
  // Submit if we have text
};
```

**Step 3: Verify**

Tap mic → speak "Find me a job" → text appears in command bar → auto-submits → AI responds.

**Step 4: Commit**

```bash
git add frontend/src/components/driver/VoiceCommandBar.tsx
git commit -m "feat(voice): add browser-native speech-to-text via Web Speech API"
```

---

## Task 5: Add OCR Extraction Endpoint to Cloud Run API (P1)

**Files:**
- Create: `cloud-run-api/src/routes/driver/ocr.js`
- Modify: `cloud-run-api/src/routes/driver/index.js` (mount OCR router)

**Step 1: Create OCR route using Gemini Vision API**

```javascript
// cloud-run-api/src/routes/driver/ocr.js
import { Router } from 'express';

const router = Router();

// POST /v1/driver/ocr/extract
// Body: { image: string (base64 data URL), docType: 'CDL_FRONT'|'MED_CARD'|'MVR' }
// Returns: extracted fields based on docType
router.post('/extract', async (req, res) => {
  const { image, docType } = req.body ?? {};
  if (!image || !docType) {
    return res.status(400).json({ error: 'Missing required fields: image, docType' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  // Build prompt based on docType
  const prompts = {
    CDL_FRONT: 'Extract from this CDL (Commercial Driver License) image: full name, license number, state, CDL class (A/B/C), endorsements, restrictions, date of birth, expiration date, address. Return valid JSON.',
    MED_CARD: 'Extract from this DOT medical card image: certificate expiration date, examining doctor name, any restrictions or conditions noted. Return valid JSON.',
    MVR: 'Extract from this Motor Vehicle Record: violations count, accident history, license status, points. Return valid JSON.',
  };

  const prompt = prompts[docType] || prompts.CDL_FRONT;

  // Strip data URL prefix to get raw base64
  const base64Data = image.includes(',') ? image.split(',')[1] : image;
  const mimeType = image.match(/data:(.*?);/)?.[1] || 'image/jpeg';

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64Data } },
            ],
          }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.1 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[ocr] Gemini error:', errText);
      return res.status(502).json({ error: 'OCR extraction failed', detail: errText });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Try to parse JSON from response
    let extracted;
    try {
      // Gemini sometimes wraps JSON in markdown code blocks
      const jsonMatch = rawText.match(/```json\n?([\s\S]*?)\n?```/) || rawText.match(/\{[\s\S]*\}/);
      extracted = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawText);
    } catch {
      extracted = { raw: rawText };
    }

    return res.json({ success: true, docType, extracted });
  } catch (err) {
    console.error('[ocr] Extraction error:', err);
    return res.status(500).json({ error: 'OCR processing failed', detail: err.message });
  }
});

export default router;
```

**Step 2: Mount in driver routes index**

In `cloud-run-api/src/routes/driver/index.js`, add:
```javascript
import ocrRouter from './ocr.js';
router.use('/ocr', ocrRouter);
```

**Step 3: Add frontend OCR action**

Create or update `frontend/src/app/(driver)/actions/documents.ts` to add an `extractDocument` function that calls `/v1/driver/ocr/extract`.

**Step 4: Wire the documents page to call OCR after upload**

In the Next.js documents page, after a file is uploaded:
1. Read file as base64
2. Call `extractDocument(base64, docType)`
3. Display extracted fields for user confirmation
4. Auto-fill profile fields from extraction

**Step 5: Commit**

```bash
git add cloud-run-api/src/routes/driver/ocr.js cloud-run-api/src/routes/driver/index.js
git add frontend/src/app/(driver)/actions/documents.ts
git commit -m "feat(ocr): add Gemini Vision OCR extraction endpoint + frontend wiring"
```

---

## Task 6: Rebuild and Deploy (P0)

**Step 1: Build Next.js frontend**

```bash
cd frontend && npm run build
```

**Step 2: Deploy Cloud Run frontend**

```bash
gcloud builds submit --config=cloudbuild.yaml
```

OR if using Docker locally:
```bash
cd frontend
docker build -t us-central1-docker.pkg.dev/ldmr-velocitymatch/lmdr-registry/lmdr-frontend .
docker push us-central1-docker.pkg.dev/ldmr-velocitymatch/lmdr-registry/lmdr-frontend
gcloud run deploy lmdr-frontend --image=us-central1-docker.pkg.dev/ldmr-velocitymatch/lmdr-registry/lmdr-frontend --region=us-central1
```

**Step 3: Deploy Cloud Run API (if OCR route added)**

```bash
cd cloud-run-api
gcloud run deploy lmdr-api --source=. --region=us-central1
```

**Step 4: Redeploy Firebase Hosting**

```bash
firebase deploy --only hosting
```

**Step 5: Verify all 4 features on live URL**

1. Navigate to `https://www.lastmiledr.app/driver` — page loads (no chunk 404)
2. Type "Find me a job" in command bar — AI responds with real data
3. Tap mic → speak → text fills in → AI responds → TTS reads back
4. Go to Documents → upload CDL image → OCR extracts fields

---

## Priority Summary

| # | Task | Severity | Effort | Impact |
|---|------|----------|--------|--------|
| 1 | Firebase cache headers | P0 | 5 min | Page loads at all |
| 2 | Fix agent endpoint path | P0 | 1 min | AI chat works |
| 3 | Align agent protocol | P0 | 10 min | AI chat returns real responses |
| 4 | Browser STT voice input | P1 | 20 min | Voice input works |
| 5 | Cloud Run OCR endpoint | P1 | 30 min | Document extraction works |
| 6 | Build & deploy | P0 | 15 min | Changes go live |

**Total estimated implementation: ~80 minutes**
