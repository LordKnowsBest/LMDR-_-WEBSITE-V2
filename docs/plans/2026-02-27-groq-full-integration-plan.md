# Groq Full Integration + Model Catalog Refresh — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the AI router with current Groq/Gemini model IDs, remove dead Perplexity entries, and add a new `groqMediaService.jsw` for STT (Whisper) and TTS (Orpheus) wired into `voiceService.jsw`.

**Architecture:** Three-file change. `aiRouterService.jsw` gets updated provider/function registries (text-chat only). New `groqMediaService.jsw` handles all Groq audio I/O via separate endpoints. `voiceService.jsw` gets two new delegate exports that call into groqMediaService.

**Tech Stack:** Wix Velo (.jsw backend modules), `wix-fetch`, `wix-secrets-backend`. Groq Chat API (OpenAI-compatible), Groq Audio API (STT: multipart/form-data, TTS: JSON → base64). Google Gemini API v1beta. No new npm packages required.

**Wix testing note:** `.jsw` files can't be unit-tested with a test runner. Verification is done by calling `testProvider()` / `testAllProviders()` through the existing Admin AI Router panel, plus a manual connection test for groqMediaService. Test files in `src/public/__tests__/` are for bridge tests — we add one for the new voice exports.

**Design doc:** `docs/plans/2026-02-27-groq-full-integration-design.md`

---

## Task 1: Update Groq Provider Registry in `aiRouterService.jsw`

**Files:**
- Modify: `src/backend/aiRouterService.jsw` (lines ~96–114, the `groq:` block inside `PROVIDER_REGISTRY`)

**What it does:** Replaces the stale Groq model list with the verified current catalog. Adds unlimited-token compound models, Llama 4 series, kimi-k2, qwen3, gpt-oss series, and safety models.

**Step 1: Read current groq block**

Open `src/backend/aiRouterService.jsw` and locate the `groq:` entry (~line 96). Confirm it contains `mixtral-8x7b-32768` and `gemma2-9b-it` — these are the stale entries to replace.

**Step 2: Replace the entire `groq:` block**

Replace the existing `groq: { ... }` entry (lines ~96–114) with:

```javascript
groq: {
    name: 'Groq',
    description: 'Ultra-fast inference. groq/compound and groq/compound-mini have no daily token limit — preferred for high-volume research and synthesis.',
    secretKey: 'GROQ_API_KEY',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    models: [
        // --- Unlimited token models (preferred for web_research, social_scanning) ---
        { id: 'groq/compound',                                   name: 'Groq Compound',           tier: 'flagship', speed: 'ultra-fast', quality: 'highest', unlimitedTokens: true },
        { id: 'groq/compound-mini',                              name: 'Groq Compound Mini',      tier: 'standard', speed: 'ultra-fast', quality: 'high',    unlimitedTokens: true },
        // --- Llama 4 series ---
        { id: 'meta-llama/llama-4-maverick-17b-128e-instruct',   name: 'Llama 4 Maverick 17B',   tier: 'standard', speed: 'ultra-fast', quality: 'high'  },
        { id: 'meta-llama/llama-4-scout-17b-16e-instruct',       name: 'Llama 4 Scout 17B',      tier: 'fast',     speed: 'ultra-fast', quality: 'good'  },
        // --- Llama 3 series (keep) ---
        { id: 'llama-3.3-70b-versatile',                         name: 'Llama 3.3 70B',          tier: 'standard', speed: 'ultra-fast', quality: 'high'  },
        { id: 'llama-3.1-8b-instant',                            name: 'Llama 3.1 8B Instant',   tier: 'fast',     speed: 'ultra-fast', quality: 'good'  },
        // --- Premium reasoning ---
        { id: 'moonshotai/kimi-k2-instruct',                     name: 'Kimi K2',                tier: 'premium',  speed: 'fast',       quality: 'high'  },
        { id: 'qwen/qwen3-32b',                                  name: 'Qwen3 32B',              tier: 'standard', speed: 'fast',       quality: 'high'  },
        // --- OSS large models ---
        { id: 'openai/gpt-oss-120b',                             name: 'GPT-OSS 120B',           tier: 'premium',  speed: 'medium',     quality: 'highest' },
        { id: 'openai/gpt-oss-20b',                              name: 'GPT-OSS 20B',            tier: 'fast',     speed: 'fast',       quality: 'good'  },
        // --- Safety/guard models (use for input filtering, not generation) ---
        { id: 'meta-llama/llama-guard-4-12b',                    name: 'Llama Guard 4 12B',      tier: 'safety',   speed: 'fast',       quality: 'n/a'   },
        { id: 'meta-llama/llama-prompt-guard-2-22m',             name: 'Prompt Guard 2 22M',     tier: 'safety',   speed: 'instant',    quality: 'n/a'   },
        { id: 'meta-llama/llama-prompt-guard-2-86m',             name: 'Prompt Guard 2 86M',     tier: 'safety',   speed: 'instant',    quality: 'n/a'   },
        { id: 'openai/gpt-oss-safeguard-20b',                    name: 'GPT-OSS Safeguard 20B',  tier: 'safety',   speed: 'fast',       quality: 'n/a'   }
    ],
    capabilities: ['chat', 'reasoning', 'analysis', 'real-time', 'synthesis', 'research'],
    characteristics: {
        latency: 'ultra-low',
        costTier: 'economy',
        contextWindow: 128000,
        strengths: ['Speed', 'Unlimited-token compound models', 'Real-time responses', 'Cost efficiency']
    }
},
```

**Step 3: Verify the block is syntactically correct**

The `PROVIDER_REGISTRY` object should still parse cleanly. Check: no missing commas between the `groq` block and the next provider (`perplexity`).

**Step 4: Commit**

```bash
git add src/backend/aiRouterService.jsw
git commit -m "feat(ai-router): update Groq provider registry with current model catalog"
```

---

## Task 2: Update Google Provider Registry in `aiRouterService.jsw`

**Files:**
- Modify: `src/backend/aiRouterService.jsw` (lines ~135–152, the `google:` block)

**What it does:** Removes 3 dead/deprecated model IDs (including `gemini-2.5-flash-preview-05-20` which is already 404-ing) and replaces with the stable 2.5 series plus one optional 3.x preview entry.

**Step 1: Locate the `google:` block**

Find `google: {` (~line 135). Confirm current models list contains `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.5-flash-preview-05-20`.

**Step 2: Replace the entire `google:` models array**

Replace only the `models: [...]` array inside `google:` with:

```javascript
models: [
    // Stable production models (GA since June 2025)
    { id: 'gemini-2.5-pro',          name: 'Gemini 2.5 Pro',           tier: 'premium',      speed: 'medium', quality: 'highest' },
    { id: 'gemini-2.5-flash',        name: 'Gemini 2.5 Flash',         tier: 'standard',     speed: 'fast',   quality: 'high'    },
    { id: 'gemini-2.5-flash-lite',   name: 'Gemini 2.5 Flash Lite',    tier: 'economy',      speed: 'fast',   quality: 'good'    },
    // Preview — functional but subject to 2-week shutdown notice
    { id: 'gemini-3.1-pro-preview',  name: 'Gemini 3.1 Pro (Preview)', tier: 'experimental', speed: 'medium', quality: 'highest', preview: true }
],
```

Also update the `characteristics.strengths` array to remove the misleading "Long context" reference to 1.5:

```javascript
strengths: ['OCR', 'Vision', 'Multimodal', 'Long context (1M tokens)', 'Stable 2.5 series']
```

**Step 3: Commit**

```bash
git add src/backend/aiRouterService.jsw
git commit -m "fix(ai-router): replace dead Gemini model IDs with stable 2.5 series"
```

---

## Task 3: Remove Perplexity from Provider Registry

**Files:**
- Modify: `src/backend/aiRouterService.jsw` (lines ~116–133, the `perplexity:` block)

**What it does:** Removes the entire `perplexity` provider entry from `PROVIDER_REGISTRY`. Perplexity will be replaced at the function level in Task 4.

**Step 1: Delete the `perplexity:` block**

Remove the entire `perplexity: { ... },` entry (from `perplexity: {` through the closing `},`).

**Step 2: Check nothing else references `'perplexity'` as a provider key**

```bash
grep -n "perplexity" src/backend/aiRouterService.jsw
```

Expected: zero results after deletion (the string `'perplexity'` should not appear anywhere in the file).

If any line still references it (e.g., `recommendedProviders: ['perplexity']`), remove `'perplexity'` from those arrays.

**Step 3: Commit**

```bash
git add src/backend/aiRouterService.jsw
git commit -m "feat(ai-router): remove Perplexity provider (replaced by groq/compound)"
```

---

## Task 4: Update Function Registry Assignments in `aiRouterService.jsw`

**Files:**
- Modify: `src/backend/aiRouterService.jsw` (lines ~201–341, the `FUNCTION_REGISTRY` block)

**What it does:** Reassigns 5 functions to their new providers/models. Fixes the dead OCR model. Replaces Perplexity. Optimizes driver_chat for the token-unlimited Scout model.

**Step 1: Update `web_research`**

Find the `web_research:` entry and change:
```javascript
// BEFORE
currentProvider: 'perplexity',
currentModel: 'sonar-pro',
recommendedProviders: ['perplexity'],
requirements: ['research', 'web-search'],

// AFTER
currentProvider: 'groq',
currentModel: 'groq/compound',
recommendedProviders: ['groq'],
requirements: ['research', 'synthesis'],
```

**Step 2: Update `social_scanning`**

Find the `social_scanning:` entry and change:
```javascript
// BEFORE
currentProvider: 'perplexity',
currentModel: 'sonar-pro',
recommendedProviders: ['perplexity'],
requirements: ['research', 'real-time-info'],

// AFTER
currentProvider: 'groq',
currentModel: 'groq/compound',
recommendedProviders: ['groq'],
requirements: ['research', 'analysis'],
```

**Step 3: Update `document_ocr`**

Find `document_ocr:` and change the model (this is the 404-ing one):
```javascript
// BEFORE
currentProvider: 'google',
currentModel: 'gemini-1.5-flash',
recommendedProviders: ['google', 'openai'],

// AFTER
currentProvider: 'google',
currentModel: 'gemini-2.5-pro',
recommendedProviders: ['google'],
```

**Step 4: Update `translation`**

```javascript
// BEFORE
currentProvider: 'mistral',
currentModel: 'mistral-large-latest',
recommendedProviders: ['mistral', 'openai', 'google'],

// AFTER
currentProvider: 'google',
currentModel: 'gemini-2.5-flash',
recommendedProviders: ['google', 'groq'],
```

**Step 5: Update `driver_chat`**

```javascript
// BEFORE
currentProvider: 'anthropic',
currentModel: 'claude-3-haiku-20240307',
recommendedProviders: ['google', 'anthropic', 'groq'],

// AFTER
currentProvider: 'groq',
currentModel: 'meta-llama/llama-4-scout-17b-16e-instruct',
recommendedProviders: ['groq', 'anthropic'],
```

**Step 6: Verify no remaining `perplexity` references in FUNCTION_REGISTRY**

```bash
grep -n "perplexity\|sonar-pro\|gemini-1.5\|gemini-2.5-flash-preview" src/backend/aiRouterService.jsw
```

Expected: zero results.

**Step 7: Commit**

```bash
git add src/backend/aiRouterService.jsw
git commit -m "feat(ai-router): reassign functions — Perplexity→Groq, fix dead Gemini OCR model, optimize driver_chat"
```

---

## Task 5: Verify Router Changes via Admin Panel

**Files:** None (verification only)

**What it does:** Uses the existing `testProvider()` infrastructure to confirm the updated providers are reachable before moving to new files.

**Step 1: Sync to Wix**

```bash
git push
```

**Step 2: Open Admin AI Router panel**

Navigate to the Admin AI Router page in the live Wix site. This panel calls `testAllProviders()` under the hood.

**Step 3: Run provider health check**

In the panel, trigger "Test All Providers". Verify:
- `groq` → status: `healthy`, responds with a model from the new list
- `google` → status: `healthy`, model is `gemini-2.5-pro` or `gemini-2.5-flash`
- `perplexity` → should no longer appear in the list
- `anthropic` → status: `healthy` (unchanged)

**Step 4: Check functions panel**

In the router config functions list, confirm:
- `web_research` shows provider `groq`, model `groq/compound`
- `document_ocr` shows provider `google`, model `gemini-2.5-pro`
- No function shows `perplexity` or `gemini-1.5-*` or `gemini-2.5-flash-preview-05-20`

---

## Task 6: Create `groqMediaService.jsw`

**Files:**
- Create: `src/backend/groqMediaService.jsw`

**What it does:** Provides `transcribeAudio()` (Groq Whisper STT) and `synthesizeSpeech()` (Groq Orpheus TTS) as exported Wix web methods. Audio is transported as base64 strings to stay compatible with Velo's JSON-only cross-module boundary.

**Step 1: Create the file**

Create `src/backend/groqMediaService.jsw` with the following content:

```javascript
// ============================================================================
// GROQ MEDIA SERVICE - Speech-to-Text (Whisper) + Text-to-Speech (Orpheus)
//
// STT: whisper-large-v3-turbo  | 20 RPM | 7.2K req/day
// TTS: canopylabs/orpheus-v1-english | 10 RPM | 100 req/day — CACHE OUTPUTS
//
// Audio transport: base64 strings (Velo cross-module boundary is JSON-only)
// ============================================================================

import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';
import { log } from 'backend/observabilityService';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

const STT_MODELS = {
    default: 'whisper-large-v3-turbo',
    highAccuracy: 'whisper-large-v3'
};

const TTS_MODELS = {
    default: 'canopylabs/orpheus-v1-english'
};

// Valid Orpheus voices
const VALID_VOICES = ['tara', 'zara', 'leo', 'mia', 'dan', 'zac', 'jess'];

// ============================================================================
// INTERNAL HELPER
// ============================================================================

async function getGroqKey() {
    const key = await getSecret('GROQ_API_KEY');
    if (!key) throw new Error('GROQ_API_KEY not configured in Wix Secrets');
    return key;
}

// ============================================================================
// STT — Speech to Text
// ============================================================================

/**
 * Transcribe audio using Groq Whisper
 *
 * @param {string} audioBase64 - Base64-encoded audio data
 * @param {string} mimeType    - MIME type, e.g. 'audio/webm', 'audio/wav', 'audio/mp4'
 * @param {Object} options     - { model, language, prompt }
 * @returns {{ success, text, language, duration, model, error }}
 */
export async function transcribeAudio(audioBase64, mimeType, options = {}) {
    try {
        await log({ level: 'INFO', source: 'groq-media', message: 'STT request received', details: { mimeType, model: options.model || STT_MODELS.default } });

        if (!audioBase64) {
            return { success: false, error: 'audioBase64 is required' };
        }

        const apiKey = await getGroqKey();
        const model = options.model || STT_MODELS.default;

        // Decode base64 → Uint8Array for the form boundary
        const binaryStr = atob(audioBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }

        // Build multipart/form-data boundary manually
        // (wix-fetch does not natively expose FormData with binary blobs)
        const boundary = '----GroqWixBoundary' + Date.now();
        const ext = mimeType.split('/')[1] || 'webm';
        const filename = `audio.${ext}`;

        const textEncoder = new TextEncoder();
        const preamble = textEncoder.encode(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
            `Content-Type: ${mimeType}\r\n\r\n`
        );
        const modelPart = textEncoder.encode(
            `\r\n--${boundary}\r\n` +
            `Content-Disposition: form-data; name="model"\r\n\r\n` +
            `${model}` +
            `\r\n--${boundary}--\r\n`
        );

        // Concatenate all parts
        const body = new Uint8Array(preamble.length + bytes.length + modelPart.length);
        body.set(preamble, 0);
        body.set(bytes, preamble.length);
        body.set(modelPart, preamble.length + bytes.length);

        const response = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            },
            body: body.buffer
        });

        if (!response.ok) {
            const errorText = await response.text();
            await log({ level: 'ERROR', source: 'groq-media', message: `STT failed: ${response.status}`, details: { error: errorText } });
            return { success: false, error: `Groq STT error ${response.status}: ${errorText}` };
        }

        const data = await response.json();

        await log({ level: 'INFO', source: 'groq-media', message: 'STT succeeded', details: { model, language: data.language, duration: data.duration } });

        return {
            success: true,
            text: data.text || '',
            language: data.language || 'en',
            duration: data.duration || 0,
            model
        };

    } catch (error) {
        await log({ level: 'ERROR', source: 'groq-media', message: `STT exception: ${error.message}` });
        return { success: false, error: error.message };
    }
}

// ============================================================================
// TTS — Text to Speech
// ============================================================================

/**
 * Synthesize speech using Groq Orpheus
 *
 * NOTE: Rate limit is 100 requests/day. Cache TTS output for repeated phrases.
 *
 * @param {string} text        - Text to synthesize (max ~500 tokens recommended)
 * @param {Object} options     - { voice: 'tara'|'zara'|'leo'|'mia'|'dan'|'zac'|'jess', speed: 1.0 }
 * @returns {{ success, audioBase64, mimeType, model, error }}
 */
export async function synthesizeSpeech(text, options = {}) {
    try {
        await log({ level: 'INFO', source: 'groq-media', message: 'TTS request received', details: { textLength: text?.length, voice: options.voice } });

        if (!text || text.trim().length === 0) {
            return { success: false, error: 'text is required' };
        }

        const apiKey = await getGroqKey();
        const model = TTS_MODELS.default;
        const voice = VALID_VOICES.includes(options.voice) ? options.voice : 'tara';
        const speed = options.speed || 1.0;

        const response = await fetch(`${GROQ_BASE_URL}/audio/speech`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ model, input: text, voice, speed })
        });

        if (!response.ok) {
            const errorText = await response.text();
            await log({ level: 'ERROR', source: 'groq-media', message: `TTS failed: ${response.status}`, details: { error: errorText } });
            return { success: false, error: `Groq TTS error ${response.status}: ${errorText}` };
        }

        // Response is binary audio — read as ArrayBuffer then base64-encode
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        const audioBase64 = btoa(binary);

        await log({ level: 'INFO', source: 'groq-media', message: 'TTS succeeded', details: { model, voice, audioLength: audioBase64.length } });

        return {
            success: true,
            audioBase64,
            mimeType: 'audio/wav',
            model,
            voice
        };

    } catch (error) {
        await log({ level: 'ERROR', source: 'groq-media', message: `TTS exception: ${error.message}` });
        return { success: false, error: error.message };
    }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Quick connectivity check — sends a minimal TTS request to verify key + endpoint
 */
export async function testGroqMedia() {
    const ttsResult = await synthesizeSpeech('OK', { voice: 'tara' });
    return {
        tts: ttsResult.success
            ? { status: 'healthy', model: TTS_MODELS.default }
            : { status: 'error', message: ttsResult.error },
        stt: { status: 'not_tested', note: 'STT requires audio input — test manually via transcribeAudio()' }
    };
}
```

**Step 2: Commit**

```bash
git add src/backend/groqMediaService.jsw
git commit -m "feat: add groqMediaService — Groq Whisper STT + Orpheus TTS"
```

---

## Task 7: Wire `groqMediaService` into `voiceService.jsw`

**Files:**
- Modify: `src/backend/voiceService.jsw`

**What it does:** Adds two new exported functions at the bottom of `voiceService.jsw` that delegate to `groqMediaService`. Does not touch any existing VAPI functions.

**Step 1: Add import at the top of `voiceService.jsw`**

After the existing imports, add:

```javascript
import { transcribeAudio, synthesizeSpeech } from 'backend/groqMediaService';
```

**Step 2: Add two exports at the bottom of `voiceService.jsw`**

Append after the last existing export:

```javascript
// ============================================================================
// GROQ AUDIO — On-demand STT + TTS (alternative to VAPI for in-browser ops)
// ============================================================================

/**
 * Transcribe audio via Groq Whisper
 * Call from page code: send base64 audio → receive transcript text
 *
 * @param {string} audioBase64 - Base64-encoded audio (WebM, WAV, MP4)
 * @param {string} mimeType    - e.g. 'audio/webm;codecs=opus'
 * @param {Object} options     - { model: 'whisper-large-v3-turbo' | 'whisper-large-v3' }
 * @returns {{ success, text, language, duration, model, error }}
 */
export async function transcribeWithGroq(audioBase64, mimeType, options = {}) {
    return transcribeAudio(audioBase64, mimeType, options);
}

/**
 * Synthesize speech via Groq Orpheus TTS
 * Returns base64 audio safe for JSON transport over postMessage
 *
 * NOTE: 100 req/day limit — cache output for repeated phrases.
 *
 * @param {string} text     - Text to speak
 * @param {Object} options  - { voice: 'tara'|'zara'|'leo'|'mia'|'dan'|'zac'|'jess', speed: 1.0 }
 * @returns {{ success, audioBase64, mimeType, model, voice, error }}
 */
export async function speakWithGroq(text, options = {}) {
    return synthesizeSpeech(text, options);
}
```

**Step 3: Commit**

```bash
git add src/backend/voiceService.jsw
git commit -m "feat(voice): add transcribeWithGroq + speakWithGroq via groqMediaService"
```

---

## Task 8: End-to-End Verification

**Files:** None (verification only)

**Step 1: Push and sync**

```bash
git push
```

**Step 2: Verify AI Router functions panel**

In Admin AI Router panel:
- `web_research` → `groq` / `groq/compound`
- `social_scanning` → `groq` / `groq/compound`
- `document_ocr` → `google` / `gemini-2.5-pro`
- `translation` → `google` / `gemini-2.5-flash`
- `driver_chat` → `groq` / `meta-llama/llama-4-scout-17b-16e-instruct`
- No Perplexity entries visible anywhere

**Step 3: Run testAllProviders**

In Admin AI Router, click "Test All Providers". Confirm:
- `groq` → healthy (will use `groq/compound` as first model)
- `google` → healthy (will use `gemini-2.5-pro`)
- `anthropic` → healthy (unchanged)
- `perplexity` → not present

**Step 4: Test groqMediaService via Wix Dev console**

In `wix dev` local editor, open the backend console and run:

```javascript
import { testGroqMedia } from 'backend/groqMediaService';
const result = await testGroqMedia();
console.log(result);
// Expected: { tts: { status: 'healthy', model: 'canopylabs/orpheus-v1-english' }, stt: { status: 'not_tested', ... } }
```

**Step 5: Test voiceService exports**

In backend console:

```javascript
import { speakWithGroq } from 'backend/voiceService';
const result = await speakWithGroq('Hello, this is a test.', { voice: 'tara' });
console.log(result.success, result.mimeType, result.audioBase64?.length);
// Expected: true 'audio/wav' [some number > 0]
```

**Step 6: Final push (if any corrections made)**

```bash
git add -A
git commit -m "fix: post-verification corrections"
git push
```

---

## Summary

| Task | File | Type | Risk |
|---|---|---|---|
| 1 | aiRouterService.jsw | Edit — Groq models | Low |
| 2 | aiRouterService.jsw | Edit — Gemini models (fixes 404s) | Low |
| 3 | aiRouterService.jsw | Edit — remove Perplexity | Low |
| 4 | aiRouterService.jsw | Edit — function assignments | Low |
| 5 | — | Verify | None |
| 6 | groqMediaService.jsw | New file | Medium |
| 7 | voiceService.jsw | Edit — append only | Low |
| 8 | — | E2E verify | None |

**Estimated tasks:** 8 discrete steps, each independently committable.
**Highest risk:** Task 6 — binary multipart/form-data handling in Wix Velo's fetch. If Velo's `wix-fetch` rejects the `ArrayBuffer` body, fallback is to use a Railway proxy endpoint that accepts base64 JSON and forwards as multipart.
