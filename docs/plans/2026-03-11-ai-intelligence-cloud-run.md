# AI Intelligence Service — Cloud Run Deployment

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Containerize `services/ai-intelligence/` for Cloud Run, implement Vertex AI Gemini adapter as default provider, update all callers from Railway URL to Cloud Run URL, decommission Railway.

**Architecture:** Hono microservice deployed as `lmdr-ai-service` on Cloud Run. Vertex AI Gemini is the default LLM provider (no API key needed — uses `lmdr-ai-sa` service account). Claude stays wired but inactive until funded. `RUNTIME_PROVIDER` env var switches between `gemini` (default) and `claude`.

**Tech Stack:** Hono, Node 20, Vertex AI SDK (`@google-cloud/vertexai`), Cloud Run, Secret Manager

---

## Task 1: Implement GeminiAdapter

**Files:**
- Modify: `services/ai-intelligence/runtime/geminiAdapter.js`
- Reference: `services/ai-intelligence/runtime/claudeAdapter.js`
- Reference: `services/ai-intelligence/runtime/providerInterface.js`

**Step 1: Install Vertex AI SDK**

Run: `cd services/ai-intelligence && npm install @google-cloud/vertexai`

**Step 2: Implement GeminiAdapter**

Replace the stub in `geminiAdapter.js` with a full implementation:

```javascript
import { VertexAI } from '@google-cloud/vertexai';
import { ProviderAdapter } from './providerInterface.js';

const DEFAULT_MODEL  = 'gemini-2.0-flash';
const DEFAULT_TOKENS = 2048;
const PROJECT_ID     = process.env.GCP_PROJECT_ID || 'ldmr-velocitymatch';
const LOCATION       = process.env.GCP_LOCATION   || 'us-central1';

export class GeminiAdapter extends ProviderAdapter {
  constructor() {
    super();
    this._vertexai = new VertexAI({ project: PROJECT_ID, location: LOCATION });
  }

  async runStep({ systemPrompt, messages, tools = [], modelId, maxTokens }) {
    const start = Date.now();
    const model = this._vertexai.getGenerativeModel({
      model: modelId || DEFAULT_MODEL,
      generationConfig: { maxOutputTokens: maxTokens || DEFAULT_TOKENS },
      systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    });

    // Convert Anthropic messages format to Gemini format
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: typeof msg.content === 'string'
        ? [{ text: msg.content }]
        : msg.content.map(block => {
            if (block.type === 'text') return { text: block.text };
            if (block.type === 'tool_use') return { functionCall: { name: block.name, args: block.input } };
            if (block.type === 'tool_result') return { functionResponse: { name: block.tool_use_id, response: { result: block.content } } };
            return { text: JSON.stringify(block) };
          }),
    }));

    // Convert Anthropic tool definitions to Gemini format
    const geminiTools = tools.length > 0 ? [{
      functionDeclarations: tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.input_schema,
      })),
    }] : undefined;

    const request = { contents };
    if (geminiTools) request.tools = geminiTools;

    const result = await model.generateContent(request);
    const response = result.response;
    const candidate = response.candidates?.[0];

    if (!candidate) {
      throw new Error('No candidates in Gemini response');
    }

    const parts = candidate.content?.parts || [];
    const textParts = parts.filter(p => p.text);
    const fnCallParts = parts.filter(p => p.functionCall);
    const providerRunId = `gemini-${Date.now()}`;
    const inputTokens = response.usageMetadata?.promptTokenCount || 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;

    if (fnCallParts.length > 0) {
      // Convert Gemini function calls to Anthropic tool_use format
      const toolUseBlocks = fnCallParts.map(p => ({
        type: 'tool_use',
        id: `toolu_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
        name: p.functionCall.name,
        input: p.functionCall.args || {},
      }));

      const contentBlocks = [
        ...textParts.map(p => ({ type: 'text', text: p.text })),
        ...toolUseBlocks,
      ];

      return {
        type: 'tool_use',
        toolUseBlocks,
        contentBlocks,
        stopReason: 'tool_use',
        inputTokens,
        outputTokens,
        providerRunId,
        latencyMs: Date.now() - start,
      };
    }

    return {
      type: 'text',
      text: textParts.map(p => p.text).join(''),
      contentBlocks: textParts.map(p => ({ type: 'text', text: p.text })),
      stopReason: candidate.finishReason || 'end_turn',
      inputTokens,
      outputTokens,
      providerRunId,
      latencyMs: Date.now() - start,
    };
  }

  async streamStep({ systemPrompt, messages, tools = [], modelId, maxTokens }, onEvent) {
    const model = this._vertexai.getGenerativeModel({
      model: modelId || DEFAULT_MODEL,
      generationConfig: { maxOutputTokens: maxTokens || DEFAULT_TOKENS },
      systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    });

    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: typeof msg.content === 'string'
        ? [{ text: msg.content }]
        : msg.content.map(block => {
            if (block.type === 'text') return { text: block.text };
            return { text: JSON.stringify(block) };
          }),
    }));

    const streamResult = await model.generateContentStream({ contents });

    let totalTokens = 0;
    for await (const chunk of streamResult.stream) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        onEvent({ type: 'token', token: text });
      }
      if (chunk.usageMetadata) {
        totalTokens = (chunk.usageMetadata.promptTokenCount || 0) + (chunk.usageMetadata.candidatesTokenCount || 0);
      }
    }

    onEvent({ type: 'done', totalTokens, providerRunId: `gemini-stream-${Date.now()}` });
  }

  async health() {
    const start = Date.now();
    try {
      const model = this._vertexai.getGenerativeModel({ model: DEFAULT_MODEL });
      await model.generateContent({ contents: [{ role: 'user', parts: [{ text: 'ping' }] }] });
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch (err) {
      return { status: 'error', latencyMs: Date.now() - start, detail: err.message };
    }
  }
}
```

Add `import crypto from 'node:crypto';` at the top.

**Step 3: Commit**

```bash
git add services/ai-intelligence/runtime/geminiAdapter.js services/ai-intelligence/package.json services/ai-intelligence/package-lock.json
git commit -m "feat(ai-service): implement GeminiAdapter with Vertex AI"
```

---

## Task 2: Wire provider selection by env var

**Files:**
- Modify: `services/ai-intelligence/routes/agent.js`
- Modify: `services/ai-intelligence/routes/stream.js`
- Modify: `services/ai-intelligence/routes/health.js`
- Create: `services/ai-intelligence/runtime/getAdapter.js`

**Step 1: Create provider factory**

Create `services/ai-intelligence/runtime/getAdapter.js`:

```javascript
import { ClaudeAdapter } from './claudeAdapter.js';
import { GeminiAdapter } from './geminiAdapter.js';

let _adapter;

export function getAdapter() {
  if (_adapter) return _adapter;

  const provider = (process.env.RUNTIME_PROVIDER || 'gemini').toLowerCase();

  switch (provider) {
    case 'claude':
    case 'anthropic':
      _adapter = new ClaudeAdapter();
      break;
    case 'gemini':
    case 'vertex':
      _adapter = new GeminiAdapter();
      break;
    default:
      console.warn(`[getAdapter] Unknown provider "${provider}", defaulting to gemini`);
      _adapter = new GeminiAdapter();
  }

  console.log(`[getAdapter] Using provider: ${provider}`);
  return _adapter;
}
```

**Step 2: Update agent.js**

Replace:
```javascript
import { ClaudeAdapter } from '../runtime/claudeAdapter.js';
const adapter = new ClaudeAdapter();
```
With:
```javascript
import { getAdapter } from '../runtime/getAdapter.js';
const adapter = getAdapter();
```

**Step 3: Update stream.js**

Replace:
```javascript
import { ClaudeAdapter } from '../runtime/claudeAdapter.js';
const adapter = new ClaudeAdapter();
```
With:
```javascript
import { getAdapter } from '../runtime/getAdapter.js';
const adapter = getAdapter();
```

**Step 4: Update health.js**

Replace:
```javascript
import { ClaudeAdapter } from '../runtime/claudeAdapter.js';
const adapter = new ClaudeAdapter();
```
With:
```javascript
import { getAdapter } from '../runtime/getAdapter.js';
const adapter = getAdapter();
```

Also update the health check response: change `claude` references to dynamic provider name.

**Step 5: Commit**

```bash
git add services/ai-intelligence/runtime/getAdapter.js services/ai-intelligence/routes/agent.js services/ai-intelligence/routes/stream.js services/ai-intelligence/routes/health.js
git commit -m "feat(ai-service): wire RUNTIME_PROVIDER env var for adapter selection"
```

---

## Task 3: Create Dockerfile and service.yaml

**Files:**
- Create: `services/ai-intelligence/Dockerfile`
- Create: `services/ai-intelligence/service.yaml`
- Create: `services/ai-intelligence/.dockerignore`

**Step 1: Create .dockerignore**

```
node_modules
.env
.env.example
__tests__
scripts
railway.toml
*.md
.git
```

**Step 2: Create Dockerfile**

```dockerfile
FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY routes/ ./routes/
COPY runtime/ ./runtime/
COPY lib/ ./lib/
COPY jobs/ ./jobs/

EXPOSE 3000

CMD ["node", "server.js"]
```

**Step 3: Create service.yaml**

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: lmdr-ai-service
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "5"
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/client-name: "gcloud"
    spec:
      containerConcurrency: 20
      timeoutSeconds: 300
      serviceAccountName: lmdr-ai-sa@ldmr-velocitymatch.iam.gserviceaccount.com
      containers:
        - name: app
          image: us-central1-docker.pkg.dev/ldmr-velocitymatch/cloud-run-source-deploy/lmdr-ai-service:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: PORT
              value: "3000"
            - name: RUNTIME_PROVIDER
              value: gemini
            - name: GCP_PROJECT_ID
              value: ldmr-velocitymatch
            - name: GCP_LOCATION
              value: us-central1
            - name: LMDR_INTERNAL_KEY
              valueFrom:
                secretKeyRef:
                  key: latest
                  name: lmdr-internal-key
            - name: ANTHROPIC_API_KEY
              valueFrom:
                secretKeyRef:
                  key: latest
                  name: anthropic-api-key
            - name: VOYAGE_API_KEY
              valueFrom:
                secretKeyRef:
                  key: latest
                  name: voyage-api-key
            - name: PINECONE_API_KEY
              valueFrom:
                secretKeyRef:
                  key: latest
                  name: pinecone-api-key
            - name: EIA_API_KEY
              valueFrom:
                secretKeyRef:
                  key: latest
                  name: eia-api-key
            - name: FRED_API_KEY
              valueFrom:
                secretKeyRef:
                  key: latest
                  name: fred-api-key
            - name: FMCSA_WEB_KEY
              valueFrom:
                secretKeyRef:
                  key: latest
                  name: fmcsa-web-key
          resources:
            limits:
              cpu: "2"
              memory: 4Gi
```

**Step 4: Commit**

```bash
git add services/ai-intelligence/Dockerfile services/ai-intelligence/service.yaml services/ai-intelligence/.dockerignore
git commit -m "feat(ai-service): add Dockerfile and Cloud Run service.yaml"
```

---

## Task 4: Create secrets and deploy to Cloud Run

**Step 1: Create missing secrets in Secret Manager**

```bash
# Voyage API key
echo -n "YOUR_VOYAGE_KEY" | gcloud secrets create voyage-api-key --data-file=- --project ldmr-velocitymatch

# Pinecone API key
echo -n "YOUR_PINECONE_KEY" | gcloud secrets create pinecone-api-key --data-file=- --project ldmr-velocitymatch
```

**Step 2: Grant lmdr-ai-sa access to all secrets**

```bash
for secret in lmdr-internal-key anthropic-api-key voyage-api-key pinecone-api-key eia-api-key fred-api-key fmcsa-web-key; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:lmdr-ai-sa@ldmr-velocitymatch.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --project=ldmr-velocitymatch
done
```

**Step 3: Verify lmdr-ai-sa has Vertex AI access**

```bash
gcloud projects get-iam-policy ldmr-velocitymatch \
  --flatten="bindings[].members" \
  --filter="bindings.members:lmdr-ai-sa" \
  --format="table(bindings.role)"
```

Should show `roles/aiplatform.user`. If not:
```bash
gcloud projects add-iam-policy-binding ldmr-velocitymatch \
  --member="serviceAccount:lmdr-ai-sa@ldmr-velocitymatch.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

**Step 4: Build and deploy**

```bash
cd services/ai-intelligence

# Build container image
gcloud builds submit --tag us-central1-docker.pkg.dev/ldmr-velocitymatch/cloud-run-source-deploy/lmdr-ai-service:latest --project ldmr-velocitymatch

# Deploy using service.yaml
gcloud run services replace service.yaml --project ldmr-velocitymatch --region us-central1
```

**Step 5: Allow unauthenticated access (for SSE stream events endpoint)**

```bash
gcloud run services add-iam-policy-binding lmdr-ai-service \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --region=us-central1 \
  --project=ldmr-velocitymatch
```

Note: Auth is handled by `x-lmdr-internal-key` header in the app layer. Cloud Run IAM is open because SSE browser clients can't send custom headers.

**Step 6: Verify health endpoint**

```bash
AI_URL=$(gcloud run services describe lmdr-ai-service --project ldmr-velocitymatch --region us-central1 --format='value(status.url)')
curl "$AI_URL/health"
```

Expected: `{"status":"ok","provider":"gemini",...}`

**Step 7: Test agent turn**

```bash
curl -X POST "$AI_URL/v1/agent/turn" \
  -H "Content-Type: application/json" \
  -H "x-lmdr-internal-key: $(gcloud secrets versions access latest --secret=lmdr-internal-key --project=ldmr-velocitymatch)" \
  -H "x-lmdr-timestamp: $(date +%s000)" \
  -d '{"messages":[{"role":"user","content":"Hello, what can you help me with?"}],"systemPrompt":"You are a helpful assistant."}'
```

Expected: `{"type":"text","text":"...","stopReason":"end_turn",...}`

---

## Task 5: Update Wix backend callers

**Files:**
- Modify: `src/backend/agentRuntimeService.jsw` (line 24)
- Modify: `src/backend/asyncSearchService.jsw` (line 27)
- Modify: `src/backend/b2bResearchAgentService.jsw` (line 780)
- Modify: `src/backend/intentService.jsw` (line 17)
- Modify: `src/backend/ragIngestionService.jsw` (line 19)
- Modify: `src/backend/ragService.jsw` (line 17)
- Modify: `src/backend/semanticSearchService.jsw` (line 24)

**Step 1: Update all Railway URLs to Cloud Run URL**

In each file, replace:
```javascript
'https://lmdr-ai-intelligence-production.up.railway.app'
```
With:
```javascript
'https://lmdr-ai-service-140035137711.us-central1.run.app'
```

(Use the actual URL from `gcloud run services describe` in Task 4 Step 6.)

**Step 2: Commit**

```bash
git add src/backend/agentRuntimeService.jsw src/backend/asyncSearchService.jsw src/backend/b2bResearchAgentService.jsw src/backend/intentService.jsw src/backend/ragIngestionService.jsw src/backend/ragService.jsw src/backend/semanticSearchService.jsw
git commit -m "feat(ai-service): update all callers from Railway to Cloud Run URL"
```

---

## Task 6: Update metadata and sync

**Files:**
- Modify: `Conductor/tracks/gcp_migration_20260218/metadata.json`
- Modify: `Conductor/tracks/gcp_migration_20260218/plan.md`

**Step 1: Update metadata.json**

Update the AI service entry in `phase4_services` and plan.md post-migration table.

**Step 2: Sync (commit + push)**

```bash
git add -A
git commit -m "feat(ai-service): deploy lmdr-ai-service to Cloud Run with Vertex AI Gemini"
git push
```

**Step 3: Purge CDN** (if any CDN-served JS references the Railway URL — unlikely but check)

---

## Summary

| Task | What | Est. |
|------|------|------|
| 1 | Implement GeminiAdapter | 5 min |
| 2 | Wire RUNTIME_PROVIDER factory | 3 min |
| 3 | Dockerfile + service.yaml | 3 min |
| 4 | Secrets + deploy + verify | 5 min |
| 5 | Update 7 Wix backend callers | 3 min |
| 6 | Metadata + sync | 2 min |
