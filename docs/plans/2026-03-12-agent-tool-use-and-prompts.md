# Agent Tool Use, Structured Prompts & Response Quality — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give the AI agent real tool-calling capabilities so it queries live data (carriers, matches, profiles) instead of hallucinating generic answers, while keeping responses concise and mobile-friendly.

**Architecture:** The Cloud Run API already serves 31 driver tool definitions at `GET /v1/driver/manifest`. The AI service orchestrator needs a tool execution loop: send tools to the LLM, detect `tool_use` stop reason, execute tool calls via HTTP to Cloud Run API, feed results back, loop until text response. Groq (Llama 3.3 70B) supports OpenAI-compatible function calling. The structured prompts (Intent/Goal/Must/Must Not/Should/Should Not) are already written in `agentOrchestrator.ts` and just need deploying.

**Tech Stack:** TypeScript (AI service), Groq/OpenAI function calling, Cloud Run API HTTP endpoints, existing manifest at `/v1/driver/manifest`

---

### Task 1: Deploy Structured Prompts + Token/Temp Settings (Already Written)

**Files:**
- Modified: `services/ai-service/src/services/agentOrchestrator.ts` (already has changes)

The structured prompts and role-specific `ROLE_SETTINGS` (maxTokens: 400/driver, temperature: 0.4) are already written in the local file. This task just deploys them.

**Step 1: Verify type-check passes**

Run: `npx tsc --noEmit --project services/ai-service/tsconfig.json`
Expected: Clean (0 errors)

**Step 2: Deploy AI service**

Run: `gcloud builds submit --config=services/ai-service/cloudbuild.yaml --project=ldmr-velocitymatch --substitutions=COMMIT_SHA=prompts-$(date +%s)`
Expected: STATUS: SUCCESS

**Step 3: Test concise response**

Run:
```bash
curl -s -X POST https://lmdr-ai-service-140035137711.us-central1.run.app/ai/agent/turn \
  -H "Authorization: Bearer $(gcloud secrets versions access latest --secret=lmdr-internal-key --project=ldmr-velocitymatch)" \
  -H "Content-Type: application/json" \
  -d '{"role":"driver","userId":"test","message":"What trucking jobs are near Dallas?","context":{}}'
```
Expected: Response is 1-3 sentences, NOT a wall of text with 5 carriers and salary ranges.

**Step 4: Commit**

```bash
git add services/ai-service/src/services/agentOrchestrator.ts
git add services/ai-service/src/services/aiRouter.ts
git add services/ai-service/cloudbuild.yaml
git commit -m "feat(ai): structured role prompts + Groq-first fallback + Vertex AI provider"
```

---

### Task 2: Add Tool Fetching to Agent Orchestrator

**Files:**
- Modify: `services/ai-service/src/services/agentOrchestrator.ts:27-68`

The Cloud Run API already exposes `GET /v1/driver/manifest` with 31 OpenAI-compatible tool definitions. The orchestrator needs to fetch these at turn time and pass them to the LLM.

**Step 1: Add tool manifest fetcher**

Add this function to `agentOrchestrator.ts` above `handleAgentTurn`:

```typescript
// ---------------------------------------------------------------------------
// Tool manifest — fetched from Cloud Run API per role
// ---------------------------------------------------------------------------

const API_URL = process.env.LMDR_API_URL || 'https://lmdr-api-140035137711.us-central1.run.app';
const INTERNAL_KEY = process.env.LMDR_INTERNAL_KEY || '';

// Cache manifests in memory (refresh every 5 minutes)
const manifestCache: Record<string, { tools: ToolDef[]; fetchedAt: number }> = {};
const CACHE_TTL_MS = 5 * 60 * 1000;

interface ToolDef {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  endpoint: { method: string; path: string };
}

async function getToolsForRole(role: string): Promise<ToolDef[]> {
  // Only driver manifest exists right now — expand per role later
  const manifestPath = role === 'driver' ? '/v1/driver/manifest' : null;
  if (!manifestPath) return [];

  const cached = manifestCache[role];
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.tools;

  try {
    const res = await fetch(`${API_URL}${manifestPath}`, {
      headers: { 'Authorization': `Bearer ${INTERNAL_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return cached?.tools || [];
    const data = (await res.json()) as { tools: ToolDef[] };
    manifestCache[role] = { tools: data.tools, fetchedAt: Date.now() };
    return data.tools;
  } catch {
    return cached?.tools || [];
  }
}
```

**Step 2: Verify type-check**

Run: `npx tsc --noEmit --project services/ai-service/tsconfig.json`
Expected: Clean

**Step 3: Commit**

```bash
git add services/ai-service/src/services/agentOrchestrator.ts
git commit -m "feat(ai): add tool manifest fetcher with 5min cache"
```

---

### Task 3: Wire Tool Definitions into LLM Calls

**Files:**
- Modify: `services/ai-service/src/services/aiRouter.ts` (add `tools` support to `complete` and providers)
- Modify: `services/ai-service/src/services/agentOrchestrator.ts` (pass tools to completion)

Groq, OpenAI, and Gemini all support function/tool calling. We need to:
1. Accept a `tools` array in `complete()` and `completeWithFallback()`
2. Pass tools to providers in their native format
3. Return `toolCalls` in the result when the LLM wants to call tools

**Step 1: Update CompletionResult and complete() signature**

In `aiRouter.ts`, update the `CompletionResult` interface and add tool types:

```typescript
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface CompletionResult {
  content: string;
  model: string;
  toolCalls?: ToolCall[];
  stopReason?: 'end_turn' | 'tool_use' | 'max_tokens';
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}
```

**Step 2: Update Groq provider to pass tools**

In the `completeGroq` function, add tools support (Groq uses OpenAI-compatible format):

```typescript
async function completeGroq(messages: ChatMessage[], options?: Record<string, unknown>): Promise<CompletionResult> {
  // ... existing setup ...

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: (options?.maxTokens as number) || 4096,
    temperature: (options?.temperature as number) ?? 0.7,
  };

  // Add tools if provided (OpenAI-compatible function calling)
  const tools = options?.tools as Array<{ name: string; description: string; input_schema: Record<string, unknown> }> | undefined;
  if (tools?.length) {
    body.tools = tools.map(t => ({
      type: 'function',
      function: { name: t.name, description: t.description, parameters: t.input_schema },
    }));
    body.tool_choice = 'auto';
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  // ... existing error handling ...

  const data = await response.json();
  const choice = data.choices[0];

  // Parse tool calls if present
  const toolCalls: ToolCall[] = (choice.message.tool_calls || []).map((tc: any) => ({
    id: tc.id,
    name: tc.function.name,
    arguments: JSON.parse(tc.function.arguments || '{}'),
  }));

  return {
    content: choice.message.content || '',
    model: data.model,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    stopReason: choice.finish_reason === 'tool_calls' ? 'tool_use' : 'end_turn',
    usage: { ... },
  };
}
```

Apply the same pattern to `completeOpenAI` (same format) and `completeDeepSeek` (same format).

For `completeGemini` and `completeVertex`, use Gemini's `functionDeclarations` format:

```typescript
if (tools?.length) {
  body.tools = [{
    functionDeclarations: tools.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    })),
  }];
}
```

Parse Gemini tool calls from `functionCall` in response parts.

For `completeClaude`, use Anthropic's native `tools` format:

```typescript
if (tools?.length) {
  body.tools = tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));
}
```

Parse Claude tool calls from `content` blocks with `type: 'tool_use'`.

**Step 3: Verify type-check**

Run: `npx tsc --noEmit --project services/ai-service/tsconfig.json`
Expected: Clean

**Step 4: Commit**

```bash
git add services/ai-service/src/services/aiRouter.ts
git commit -m "feat(ai): add tool calling support to all 6 providers"
```

---

### Task 4: Add Tool Execution Loop to Orchestrator

**Files:**
- Modify: `services/ai-service/src/services/agentOrchestrator.ts:66-68`

This is the core change. Replace the single `completeWithFallback` call with a loop that:
1. Sends tools + messages to LLM
2. If LLM returns `tool_use`, execute each tool via HTTP to Cloud Run API
3. Add tool results to messages, loop back (max 3 iterations)
4. When LLM returns text (not tool_use), return the final response

**Step 1: Add tool executor function**

Add to `agentOrchestrator.ts`:

```typescript
import { ToolCall } from './aiRouter';

// ---------------------------------------------------------------------------
// Tool executor — calls Cloud Run API endpoints based on manifest
// ---------------------------------------------------------------------------

async function executeTool(
  tool: ToolCall,
  toolDefs: ToolDef[],
  driverId: string,
): Promise<{ name: string; result: unknown; error?: string }> {
  const def = toolDefs.find(t => t.name === tool.name);
  if (!def) return { name: tool.name, result: null, error: `Unknown tool: ${tool.name}` };

  const { method, path } = def.endpoint;

  // Replace path params (:id, :driverId, :carrierDot, :jobId, :appId, :docId)
  let resolvedPath = path
    .replace(':id', tool.arguments.driverId as string || driverId)
    .replace(':driverId', tool.arguments.driverId as string || driverId)
    .replace(':carrierDot', tool.arguments.carrierDot as string || '')
    .replace(':jobId', tool.arguments.jobId as string || '')
    .replace(':appId', tool.arguments.appId as string || '')
    .replace(':docId', tool.arguments.docId as string || '');

  // Build query params for GET requests
  if (method === 'GET') {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(tool.arguments)) {
      if (!['driverId', 'carrierDot', 'jobId', 'appId', 'docId'].includes(k) && v != null) {
        params.set(k, String(v));
      }
    }
    const qs = params.toString();
    if (qs) resolvedPath += `?${qs}`;
  }

  try {
    const fetchOpts: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${INTERNAL_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    };

    if (method === 'POST' || method === 'PUT') {
      fetchOpts.body = JSON.stringify(tool.arguments);
    }

    const res = await fetch(`${API_URL}${resolvedPath}`, fetchOpts);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { name: tool.name, result: null, error: `${res.status}: ${JSON.stringify(data)}` };
    }

    return { name: tool.name, result: data };
  } catch (err) {
    return { name: tool.name, result: null, error: err instanceof Error ? err.message : 'Request failed' };
  }
}
```

**Step 2: Replace single completion with tool loop**

Replace the `handleAgentTurn` completion section (around line 66-68) with:

```typescript
  // 4. Get tools for this role
  const toolDefs = await getToolsForRole(role);

  // Convert manifest to provider-agnostic tool format
  const tools = toolDefs.length > 0 ? toolDefs.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  })) : undefined;

  // 5. Agent loop — call LLM, execute tools, repeat (max 3 iterations)
  const MAX_ITERATIONS = 3;
  const settings = ROLE_SETTINGS[role] || DEFAULT_SETTINGS;
  let result = await completeWithFallback('agent_orchestration', messages, {
    maxTokens: settings.maxTokens,
    temperature: settings.temperature,
    tools,
  });

  for (let i = 0; i < MAX_ITERATIONS && result.toolCalls?.length; i++) {
    // Execute each tool call
    const toolResults = await Promise.all(
      result.toolCalls.map(tc => executeTool(tc, toolDefs, userId))
    );

    // Add assistant message with tool calls, then tool results
    messages.push({
      role: 'assistant',
      content: result.content || '',
      // The tool calls are tracked by the provider via the message history
    });

    // Add tool results as user messages (provider-agnostic format)
    for (const tr of toolResults) {
      messages.push({
        role: 'user',
        content: `[Tool result for ${tr.name}]: ${JSON.stringify(tr.error ? { error: tr.error } : tr.result)}`,
      });
    }

    // Call LLM again with tool results
    result = await completeWithFallback('agent_orchestration', messages, {
      maxTokens: settings.maxTokens,
      temperature: settings.temperature,
      tools,
    });
  }
```

**Step 3: Verify type-check**

Run: `npx tsc --noEmit --project services/ai-service/tsconfig.json`
Expected: Clean

**Step 4: Commit**

```bash
git add services/ai-service/src/services/agentOrchestrator.ts
git commit -m "feat(ai): add tool execution loop — agent can now call 31 driver endpoints"
```

---

### Task 5: Deploy and Live Test Tool Use

**Files:**
- No code changes — just deploy and verify

**Step 1: Deploy AI service**

Run: `gcloud builds submit --config=services/ai-service/cloudbuild.yaml --project=ldmr-velocitymatch --substitutions=COMMIT_SHA=tools-$(date +%s)`
Expected: STATUS: SUCCESS

**Step 2: Test tool use with curl**

Run:
```bash
curl -s -X POST https://lmdr-ai-service-140035137711.us-central1.run.app/ai/agent/turn \
  -H "Authorization: Bearer $(gcloud secrets versions access latest --secret=lmdr-internal-key --project=ldmr-velocitymatch)" \
  -H "Content-Type: application/json" \
  -d '{"role":"driver","userId":"demo-driver-001","message":"Show me my matches","context":{}}'
```
Expected: Response references actual carrier data from Cloud SQL (not fabricated names). The agent should call `driver_find_jobs` tool and summarize the results.

**Step 3: Test in browser**

Navigate to `https://www.lastmiledr.app/driver`, type "Show me my matches" in command bar.
Expected: AI responds with real match data (carrier names or "Unknown" from demo data, with match scores).

**Step 4: Test multi-tool query**

Run:
```bash
curl -s -X POST https://lmdr-ai-service-140035137711.us-central1.run.app/ai/agent/turn \
  -H "Authorization: Bearer $(gcloud secrets versions access latest --secret=lmdr-internal-key --project=ldmr-velocitymatch)" \
  -H "Content-Type: application/json" \
  -d '{"role":"driver","userId":"demo-driver-001","message":"How complete is my profile?","context":{}}'
```
Expected: Agent calls `driver_get_strength`, returns actual completeness percentage and missing fields.

**Step 5: Commit (if any hotfixes needed)**

```bash
git add -A
git commit -m "fix(ai): tool use deployment adjustments"
```

---

### Task 6: Add Markdown Rendering to Chat UI (Optional Enhancement)

**Files:**
- Modify: `frontend/package.json` (add react-markdown)
- Modify: `frontend/src/components/driver/DriverChatDrawer.tsx:255-260`

This is a nice-to-have that makes tool results render cleanly (bold carrier names, bullet points).

**Step 1: Install react-markdown**

Run: `cd frontend && npm install react-markdown`

**Step 2: Update chat bubble rendering**

In `DriverChatDrawer.tsx`, replace the plain `<p>` tag with:

```typescript
import ReactMarkdown from 'react-markdown';

// In the AI message bubble (around line 255):
<div
  className="text-[11px] leading-relaxed prose-sm prose-invert max-w-none"
  style={{ color: isDriver ? '#fff' : 'var(--neu-text)' }}
>
  <ReactMarkdown>{msg.text}</ReactMarkdown>
</div>
```

**Step 3: Verify build**

Run: `npx tsc --noEmit --project frontend/tsconfig.json`
Expected: Clean

**Step 4: Deploy frontend**

Run: `gcloud builds submit --config=frontend/cloudbuild.yaml --project=ldmr-velocitymatch --substitutions=COMMIT_SHA=markdown-$(date +%s)`
Expected: STATUS: SUCCESS

**Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/components/driver/DriverChatDrawer.tsx
git commit -m "feat(ui): add markdown rendering to driver chat bubbles"
```

---

## Reference: Files Involved

| File | Role | Changes |
|------|------|---------|
| `services/ai-service/src/services/agentOrchestrator.ts` | Agent orchestrator | Structured prompts, role settings, tool fetcher, tool executor, agent loop |
| `services/ai-service/src/services/aiRouter.ts` | LLM router | ToolCall type, tools param in all 6 providers |
| `services/ai-service/cloudbuild.yaml` | Deploy config | GCP_PROJECT env var (already done) |
| `cloud-run-api/src/routes/driver/index.js` | Tool manifest | Already has 31 tool definitions (read-only reference) |
| `frontend/src/components/driver/DriverChatDrawer.tsx` | Chat UI | Markdown rendering (Task 6) |
| `frontend/src/app/(driver)/layout.tsx` | Driver layout | Error fallback in chat bubble (already done) |

## Reference: Tool Manifest (31 Driver Tools)

| Category | Tools | Count |
|----------|-------|-------|
| Profile | get_profile, update_profile, get_strength, set_visibility, get_activity, who_viewed_me | 6 |
| Matching | find_jobs, explain_match, search_jobs, detect_mutual, get_model_info | 5 |
| Cockpit | get_dashboard, apply_job, get_applications, withdraw_app, get_notifications | 5 |
| Gamification | get_progression, get_achievements, get_streak, get_leaderboard | 4 |
| Lifecycle | get_timeline, update_disposition | 2 |
| Community | get_forums, get_announcements, get_surveys | 3 |
| Wellness | search_pet_friendly, get_health_resources | 2 |
| Financial | log_expense, get_expenses | 2 |
| Retention | get_risk_score | 1 |
| Documents | (via /documents routes, not yet in manifest) | 0 |

## Provider Tool Calling Support

| Provider | Tool Format | Supported |
|----------|------------|-----------|
| Groq (Llama 3.3 70B) | OpenAI function calling | YES |
| DeepSeek | OpenAI function calling | YES |
| Vertex AI (Gemini) | functionDeclarations | YES |
| Gemini (API key) | functionDeclarations | YES |
| OpenAI (GPT-4o) | OpenAI function calling | YES |
| Claude (Anthropic) | Native tools | YES |
