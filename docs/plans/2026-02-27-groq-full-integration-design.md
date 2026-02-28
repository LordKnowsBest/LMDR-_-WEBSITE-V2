# Design: Groq Full Integration + Model Catalog Refresh
**Date:** 2026-02-27
**Status:** Approved

## Problem Statement

1. **Silent AI failures** — `gemini-2.5-flash-preview-05-20` (shut down Nov 18, 2025) is 404-ing on every OCR call. `gemini-1.5-flash` and `gemini-1.5-pro` are deprecated (shutdown June 1, 2026). Stale Groq models (`mixtral-8x7b-32768`, `gemma2-9b-it`) are no longer available.
2. **Token exhaustion** — Perplexity and other providers hit daily limits silently. `groq/compound` and `groq/compound-mini` have **no daily token limit** and should take over high-volume research functions.
3. **Voice pipeline gap** — No Groq STT (Whisper) or TTS (Orpheus) integration exists. Voice agents and chat interfaces have no audio processing path outside of VAPI.

## Constraints

- **Never touch** Claude (Anthropic) implementations — stay exactly as-is
- **Never touch** Gemini function assignments (OCR stays on Google) — only update model IDs
- **Replace Perplexity** entirely — remove from registry and reassign all functions
- `GROQ_API_KEY` is already in Wix secrets — no new secret needed for chat or audio
- Agent orchestration stays pinned to Anthropic (requires `contentBlocks`/`stopReason` for tool_use loop)

---

## Architecture: Approach B — Separate `groqMediaService.jsw`

```
aiRouterService.jsw          ← text chat completions only (updated)
groqMediaService.jsw         ← new: Groq STT + TTS (audio I/O)
voiceService.jsw             ← wires groqMediaService for on-demand audio
```

STT/TTS are excluded from `aiRouterService.jsw` because they use binary I/O (`multipart/form-data` upload, binary audio stream response) which is architecturally incompatible with the text-completion router's request/response shape.

---

## Section 1 — `aiRouterService.jsw` Changes

### 1a. Groq Provider — Updated Model Registry

Remove: `mixtral-8x7b-32768`, `gemma2-9b-it` (no longer on Groq)

Add:

| Model ID | Tier | Speed | Quality | Token Limit | Notes |
|---|---|---|---|---|---|
| `groq/compound` | flagship | ultra-fast | highest | **No limit** | Agentic/compound — primary for research |
| `groq/compound-mini` | standard | ultra-fast | high | **No limit** | Research backup |
| `meta-llama/llama-4-maverick-17b-128e-instruct` | standard | ultra-fast | high | 500K/day | |
| `meta-llama/llama-4-scout-17b-16e-instruct` | fast | ultra-fast | good | 500K/day, 30K TPM | Chat-optimized |
| `llama-3.3-70b-versatile` | standard | ultra-fast | high | 100K/day | Keep |
| `llama-3.1-8b-instant` | fast | ultra-fast | good | 500K/day | Keep — classification |
| `moonshotai/kimi-k2-instruct` | premium | fast | high | 300K/day | Strong reasoning |
| `qwen/qwen3-32b` | standard | fast | high | 500K/day | 60 RPM |
| `openai/gpt-oss-120b` | premium | medium | highest | 200K/day | |
| `openai/gpt-oss-20b` | fast | fast | good | 200K/day | |
| `meta-llama/llama-guard-4-12b` | safety | fast | — | 500K/day | Safety screening |
| `meta-llama/llama-prompt-guard-2-22m` | safety | instant | — | 500K/day | Input guard |
| `meta-llama/llama-prompt-guard-2-86m` | safety | instant | — | 500K/day | Input guard |
| `openai/gpt-oss-safeguard-20b` | safety | fast | — | 200K/day | Safety screening |

Context window: 128K for all Groq chat models unless stated otherwise.
`groq/compound` and `groq/compound-mini`: effectively unlimited context for daily use.

### 1b. Google Provider — Updated Model Registry

Remove all deprecated/dead model IDs. Replace with:

| Model ID | Tier | Notes |
|---|---|---|
| `gemini-2.5-pro` | premium | Best OCR/vision accuracy, complex reasoning |
| `gemini-2.5-flash` | standard | Fast, general purpose, replaces 2.5-flash-preview |
| `gemini-2.5-flash-lite` | economy | Highest volume / lowest cost |
| `gemini-3.1-pro-preview` | experimental | Preview only — marked `preview: true`, not default |

Dead IDs being removed:
- `gemini-2.5-flash-preview-05-20` — **dead since Nov 18, 2025, 404-ing now**
- `gemini-1.5-flash` — deprecated, shutdown June 1, 2026
- `gemini-1.5-pro` — deprecated, shutdown June 1, 2026

### 1c. Perplexity — Removed Entirely

Remove `perplexity` from `PROVIDER_REGISTRY`.

### 1d. Function Registry Reassignments

| Function | Old | New Provider | New Model |
|---|---|---|---|
| `web_research` | perplexity/sonar-pro | groq | `groq/compound` |
| `social_scanning` | perplexity/sonar-pro | groq | `groq/compound` |
| `document_ocr` | google/gemini-2.5-flash-preview-05-20 | google | `gemini-2.5-pro` |
| `translation` | mistral/mistral-large | google | `gemini-2.5-flash` |
| `driver_chat` | anthropic/claude-3-haiku | groq | `meta-llama/llama-4-scout-17b-16e-instruct` |

Unchanged (Claude pinned): `carrier_synthesis`, `agent_orchestration`, `admin_assistant`, `data_extraction`
Unchanged (Groq already correct): `quick_classification`, `sentiment_analysis`

---

## Section 2 — New `groqMediaService.jsw`

**File:** `src/backend/groqMediaService.jsw`
**Secret:** `GROQ_API_KEY` (already configured)

### Exports

#### `transcribeAudio(audioBase64, mimeType, options)`
- **Endpoint:** `POST https://api.groq.com/openai/v1/audio/transcriptions`
- **Transport:** base64 input → decoded to Buffer → sent as `multipart/form-data`
- **Default model:** `whisper-large-v3-turbo` (faster, equivalent accuracy to v3)
- **Fallback model:** `whisper-large-v3` (configurable via `options.model`)
- **Rate limits:** 20 RPM, 7.2K req/day — logged to observability
- **Returns:** `{ text, language, duration, model, success }`
- **Error handling:** wraps all errors, returns `{ success: false, error }` — never throws to callers

#### `synthesizeSpeech(text, options)`
- **Endpoint:** `POST https://api.groq.com/openai/v1/audio/speech`
- **Model:** `canopylabs/orpheus-v1-english`
- **Rate limits:** 10 RPM, 100 req/day — surfaced in response metadata
- **Options:** `{ voice: 'tara'|'zara'|'leo'|'mia', speed: 1.0 }`
- **Returns:** `{ audioBase64, mimeType: 'audio/wav', model, success }`
- **Note:** 100 req/day limit is low — callers should cache TTS output where possible

#### Internal helper
`groqMediaRequest(method, path, body, isFormData)` — handles Bearer auth, error parsing, rate-limit detection.

---

## Section 3 — `voiceService.jsw` Wiring

Add two new exports that delegate to `groqMediaService`:

```javascript
export async function transcribeWithGroq(audioBase64, mimeType, options)
export async function speakWithGroq(text, options)
```

### Call Sites
| Caller | Usage |
|---|---|
| Page code → voiceService | On-demand mic transcription (browser MediaRecorder → base64 → transcribeWithGroq) |
| agentService.jsw | TTS on agent text responses for voice-first sessions |
| voiceCampaignService.jsw | Generate campaign audio previews |

### VAPI Unchanged
`createAssistant`, `initiateOutboundCall`, `getCallTranscript`, `listCalls` — untouched. VAPI remains the full-stack outbound call platform. Groq audio handles in-browser/on-demand ops only.

---

## Rate Limit Summary

| Provider | Function | Limit | Risk |
|---|---|---|---|
| groq/compound | web_research, social_scanning | **No daily token limit** | None |
| Groq STT | transcribeAudio | 7.2K req/day | Low |
| Groq TTS | synthesizeSpeech | 100 req/day | **High — cache outputs** |
| Gemini 2.5-pro | document_ocr | Standard Gemini quota | Low |

---

## Files Changed

| File | Type | Change |
|---|---|---|
| `src/backend/aiRouterService.jsw` | Edit | Update PROVIDER_REGISTRY (Groq models, Gemini models, remove Perplexity), update FUNCTION_REGISTRY assignments |
| `src/backend/groqMediaService.jsw` | New | Groq STT + TTS service |
| `src/backend/voiceService.jsw` | Edit | Add `transcribeWithGroq` + `speakWithGroq` exports |
