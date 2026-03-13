import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Provider Definitions
// ---------------------------------------------------------------------------

export interface ProviderConfig {
  name: string;
  model: string;
  apiKeyEnv: string;
  available: boolean;
}

const PROVIDERS: Record<string, ProviderConfig> = {
  vertex: {
    name: 'vertex',
    model: 'gemini-2.0-flash',
    apiKeyEnv: 'GCP_PROJECT',  // Uses ADC — just needs project ID to confirm availability
    available: true,
  },
  openai: {
    name: 'openai',
    model: 'gpt-4o',
    apiKeyEnv: 'OPENAI_API_KEY',
    available: true,
  },
  claude: {
    name: 'claude',
    model: 'claude-sonnet-4-20250514',
    apiKeyEnv: 'CLAUDE_API_KEY',
    available: true,
  },
  groq: {
    name: 'groq',
    model: 'llama-3.3-70b-versatile',
    apiKeyEnv: 'GROQ_API_KEY',
    available: true,
  },
  gemini: {
    name: 'gemini',
    model: 'gemini-2.0-flash',
    apiKeyEnv: 'GEMINI_API_KEY',
    available: true,
  },
  deepseek: {
    name: 'deepseek',
    model: 'deepseek-chat',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    available: true,
  },
};

// Task -> provider mapping (ordered preference — first entry is primary, rest are fallbacks)
// Priority: Groq (free) → DeepSeek ($20 balance) → Vertex/Gemini (GCP) → OpenAI → Claude (last)
const TASK_ROUTING: Record<string, string[]> = {
  enrichment: ['groq', 'deepseek', 'vertex', 'gemini', 'openai', 'claude'],
  agent_orchestration: ['groq', 'deepseek', 'vertex', 'gemini', 'openai', 'claude'],
  embedding: ['openai', 'vertex'],
  general: ['groq', 'deepseek', 'vertex', 'gemini', 'openai', 'claude'],
  coding: ['groq', 'deepseek', 'vertex', 'gemini', 'openai', 'claude'],
  analysis: ['groq', 'deepseek', 'vertex', 'gemini', 'openai', 'claude'],
};

// ---------------------------------------------------------------------------
// Provider Selection — returns the first configured provider for the task
// ---------------------------------------------------------------------------

export function selectProvider(task: string, _options?: Record<string, unknown>): string {
  const candidates = TASK_ROUTING[task] || TASK_ROUTING.general;
  for (const name of candidates) {
    const provider = PROVIDERS[name];
    if (!provider) continue;
    // Vertex AI is always available on Cloud Run (uses ADC via metadata server)
    if (name === 'vertex' && (process.env.K_SERVICE || process.env.GCP_PROJECT)) return name;
    if (process.env[provider.apiKeyEnv]) return name;
  }
  // Last resort: return first candidate and let complete() throw a clear error
  return candidates[0];
}

export function getProviderStatus(): Array<{ name: string; model: string; available: boolean; configured: boolean }> {
  return Object.values(PROVIDERS).map((p) => ({
    name: p.name,
    model: p.model,
    available: p.available,
    configured: !!process.env[p.apiKeyEnv],
  }));
}

// ---------------------------------------------------------------------------
// Completion — dispatches to provider-specific HTTP client
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface CompletionResult {
  content: string;
  model: string;
  tool_calls?: ToolCall[];
  finish_reason?: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export async function complete(
  providerName: string,
  messages: ChatMessage[],
  options?: Record<string, unknown>,
): Promise<CompletionResult> {
  switch (providerName) {
    case 'vertex':
      return completeVertex(messages, options);
    case 'openai':
      return completeOpenAI(messages, options);
    case 'claude':
      return completeClaude(messages, options);
    case 'groq':
      return completeGroq(messages, options);
    case 'gemini':
      return completeGemini(messages, options);
    case 'deepseek':
      return completeDeepSeek(messages, options);
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}

// Helper: convert ToolDefinition[] to OpenAI function-calling format
function toOpenAITools(tools: ToolDefinition[]) {
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));
}

// Helper: convert ToolDefinition[] to Gemini/Vertex tool format
function toGeminiTools(tools: ToolDefinition[]) {
  return [{
    functionDeclarations: tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    })),
  }];
}

// Helper: convert ToolDefinition[] to Claude tool format
function toClaudeTools(tools: ToolDefinition[]) {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));
}

// ---------------------------------------------------------------------------
// Vertex AI (Gemini via GCP — uses Application Default Credentials)
// ---------------------------------------------------------------------------

async function getAccessToken(): Promise<string> {
  // On Cloud Run, the metadata server provides access tokens for the service account
  const res = await fetch(
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    { headers: { 'Metadata-Flavor': 'Google' } },
  );
  if (!res.ok) throw new Error(`Failed to get access token: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function completeVertex(messages: ChatMessage[], options?: Record<string, unknown>): Promise<CompletionResult> {
  const project = process.env.GCP_PROJECT || 'ldmr-velocitymatch';
  const location = process.env.GCP_REGION || 'us-central1';
  const model = (options?.model as string) || PROVIDERS.vertex.model;
  const tools = options?.tools as ToolDefinition[] | undefined;

  const accessToken = await getAccessToken();

  // Convert ChatMessage format to Gemini format
  const systemInstruction = messages.find((m) => m.role === 'system');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'function' as const,
          parts: [{ functionResponse: { name: m.name || 'tool', response: { result: m.content } } }],
        };
      }
      if (m.tool_calls?.length) {
        return {
          role: 'model' as const,
          parts: m.tool_calls.map((tc) => ({
            functionCall: { name: tc.function.name, args: JSON.parse(tc.function.arguments) },
          })),
        };
      }
      return {
        role: (m.role === 'assistant' ? 'model' : 'user') as string,
        parts: [{ text: m.content }],
      };
    });

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: (options?.maxTokens as number) || 4096,
      temperature: (options?.temperature as number) ?? 0.7,
    },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
  }
  if (tools?.length) {
    body.tools = toGeminiTools(tools);
  }

  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vertex AI error ${response.status}: ${text}`);
  }

  type VertexPart = { text?: string; functionCall?: { name: string; args: Record<string, unknown> } };
  const data = (await response.json()) as {
    candidates: Array<{ content: { parts: VertexPart[] }; finishReason?: string }>;
    usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
  };

  const parts = data.candidates?.[0]?.content?.parts || [];
  const textParts = parts.filter((p) => p.text).map((p) => p.text!).join('');
  const fnCalls = parts.filter((p) => p.functionCall);

  const toolCalls: ToolCall[] | undefined = fnCalls.length
    ? fnCalls.map((p) => ({
        id: crypto.randomUUID(),
        type: 'function' as const,
        function: { name: p.functionCall!.name, arguments: JSON.stringify(p.functionCall!.args) },
      }))
    : undefined;

  const finishReason = data.candidates?.[0]?.finishReason;

  return {
    content: textParts,
    model: `vertex/${model}`,
    tool_calls: toolCalls,
    finish_reason: finishReason === 'STOP' ? 'stop' : finishReason === 'FUNCTION_CALL' ? 'tool_calls' : finishReason || undefined,
    usage: data.usageMetadata
      ? {
          promptTokens: data.usageMetadata.promptTokenCount,
          completionTokens: data.usageMetadata.candidatesTokenCount,
          totalTokens: data.usageMetadata.totalTokenCount,
        }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// OpenAI
// ---------------------------------------------------------------------------

async function completeOpenAI(messages: ChatMessage[], options?: Record<string, unknown>): Promise<CompletionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const model = (options?.model as string) || PROVIDERS.openai.model;
  const tools = options?.tools as ToolDefinition[] | undefined;

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: (options?.maxTokens as number) || 4096,
    temperature: (options?.temperature as number) ?? 0.7,
  };
  if (tools?.length) {
    body.tools = toOpenAITools(tools);
    body.tool_choice = 'auto';
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string; tool_calls?: ToolCall[] }; finish_reason: string }>;
    model: string;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };

  const choice = data.choices[0];
  return {
    content: choice.message.content || '',
    model: data.model,
    tool_calls: choice.message.tool_calls,
    finish_reason: choice.finish_reason,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
  };
}

// ---------------------------------------------------------------------------
// Claude (Anthropic)
// ---------------------------------------------------------------------------

async function completeClaude(messages: ChatMessage[], options?: Record<string, unknown>): Promise<CompletionResult> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('CLAUDE_API_KEY not configured');

  const model = (options?.model as string) || PROVIDERS.claude.model;
  const tools = options?.tools as ToolDefinition[] | undefined;

  // Anthropic expects system message separate from messages array
  const systemMsg = messages.find((m) => m.role === 'system');
  const nonSystemMsgs = messages.filter((m) => m.role !== 'system');

  // Convert tool role messages to user role for Claude (tool results must be embedded)
  const claudeMessages = nonSystemMsgs.map((m) => {
    if (m.role === 'tool') {
      return {
        role: 'user' as const,
        content: [{ type: 'tool_result', tool_use_id: m.tool_call_id || '', content: m.content }],
      };
    }
    if (m.tool_calls?.length) {
      return {
        role: 'assistant' as const,
        content: m.tool_calls.map((tc) => ({
          type: 'tool_use',
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments),
        })),
      };
    }
    return { role: m.role as 'user' | 'assistant', content: m.content };
  });

  const body: Record<string, unknown> = {
    model,
    max_tokens: (options?.maxTokens as number) || 4096,
    messages: claudeMessages,
  };
  if (systemMsg) {
    body.system = systemMsg.content;
  }
  if (tools?.length) {
    body.tools = toClaudeTools(tools);
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Claude API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>;
    model: string;
    stop_reason: string;
    usage: { input_tokens: number; output_tokens: number };
  };

  // Extract text content
  const textContent = data.content.filter((c) => c.type === 'text').map((c) => c.text || '').join('');

  // Extract tool use blocks → convert to OpenAI-compatible ToolCall format
  const toolUseBlocks = data.content.filter((c) => c.type === 'tool_use');
  const toolCalls: ToolCall[] | undefined = toolUseBlocks.length
    ? toolUseBlocks.map((c) => ({
        id: c.id || crypto.randomUUID(),
        type: 'function' as const,
        function: { name: c.name || '', arguments: JSON.stringify(c.input || {}) },
      }))
    : undefined;

  return {
    content: textContent,
    model: data.model,
    tool_calls: toolCalls,
    finish_reason: data.stop_reason === 'tool_use' ? 'tool_calls' : data.stop_reason,
    usage: {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    },
  };
}

// ---------------------------------------------------------------------------
// Groq (OpenAI-compatible)
// ---------------------------------------------------------------------------

async function completeGroq(messages: ChatMessage[], options?: Record<string, unknown>): Promise<CompletionResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const model = (options?.model as string) || PROVIDERS.groq.model;
  const tools = options?.tools as ToolDefinition[] | undefined;

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: (options?.maxTokens as number) || 4096,
    temperature: (options?.temperature as number) ?? 0.7,
  };
  if (tools?.length) {
    body.tools = toOpenAITools(tools);
    body.tool_choice = 'auto';
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string; tool_calls?: ToolCall[] }; finish_reason: string }>;
    model: string;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };

  const choice = data.choices[0];
  return {
    content: choice.message.content || '',
    model: data.model,
    tool_calls: choice.message.tool_calls,
    finish_reason: choice.finish_reason,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
  };
}

// ---------------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------------

async function completeGemini(messages: ChatMessage[], options?: Record<string, unknown>): Promise<CompletionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const model = (options?.model as string) || PROVIDERS.gemini.model;
  const tools = options?.tools as ToolDefinition[] | undefined;

  // Convert ChatMessage format to Gemini format
  const systemInstruction = messages.find((m) => m.role === 'system');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'function' as const,
          parts: [{ functionResponse: { name: m.name || 'tool', response: { result: m.content } } }],
        };
      }
      if (m.tool_calls?.length) {
        return {
          role: 'model' as const,
          parts: m.tool_calls.map((tc) => ({
            functionCall: { name: tc.function.name, args: JSON.parse(tc.function.arguments) },
          })),
        };
      }
      return {
        role: (m.role === 'assistant' ? 'model' : 'user') as string,
        parts: [{ text: m.content }],
      };
    });

  const body: Record<string, unknown> = { contents };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
  }
  if (tools?.length) {
    body.tools = toGeminiTools(tools);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${text}`);
  }

  type GeminiPart = { text?: string; functionCall?: { name: string; args: Record<string, unknown> } };
  const data = (await response.json()) as {
    candidates: Array<{ content: { parts: GeminiPart[] }; finishReason?: string }>;
    usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
  };

  const parts = data.candidates?.[0]?.content?.parts || [];
  const textParts = parts.filter((p) => p.text).map((p) => p.text!).join('');
  const fnCalls = parts.filter((p) => p.functionCall);

  const toolCalls: ToolCall[] | undefined = fnCalls.length
    ? fnCalls.map((p) => ({
        id: crypto.randomUUID(),
        type: 'function' as const,
        function: { name: p.functionCall!.name, arguments: JSON.stringify(p.functionCall!.args) },
      }))
    : undefined;

  const finishReason = data.candidates?.[0]?.finishReason;

  return {
    content: textParts,
    model,
    tool_calls: toolCalls,
    finish_reason: finishReason === 'STOP' ? 'stop' : finishReason === 'FUNCTION_CALL' ? 'tool_calls' : finishReason || undefined,
    usage: data.usageMetadata
      ? {
          promptTokens: data.usageMetadata.promptTokenCount,
          completionTokens: data.usageMetadata.candidatesTokenCount,
          totalTokens: data.usageMetadata.totalTokenCount,
        }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// DeepSeek (OpenAI-compatible)
// ---------------------------------------------------------------------------

async function completeDeepSeek(messages: ChatMessage[], options?: Record<string, unknown>): Promise<CompletionResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const model = (options?.model as string) || PROVIDERS.deepseek.model;
  const tools = options?.tools as ToolDefinition[] | undefined;

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: (options?.maxTokens as number) || 4096,
    temperature: (options?.temperature as number) ?? 0.7,
  };
  if (tools?.length) {
    body.tools = toOpenAITools(tools);
    body.tool_choice = 'auto';
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string; tool_calls?: ToolCall[] }; finish_reason: string }>;
    model: string;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };

  const choice = data.choices[0];
  return {
    content: choice.message.content || '',
    model: data.model,
    tool_calls: choice.message.tool_calls,
    finish_reason: choice.finish_reason,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
  };
}

// ---------------------------------------------------------------------------
// Complete with automatic fallback across providers for a task
// ---------------------------------------------------------------------------

export async function completeWithFallback(
  task: string,
  messages: ChatMessage[],
  options?: Record<string, unknown>,
): Promise<CompletionResult> {
  const candidates = TASK_ROUTING[task] || TASK_ROUTING.general;
  const errors: string[] = [];

  for (const name of candidates) {
    const provider = PROVIDERS[name];
    if (!provider) continue;
    // Vertex uses ADC on Cloud Run — check K_SERVICE or GCP_PROJECT
    const isConfigured = name === 'vertex'
      ? !!(process.env.K_SERVICE || process.env.GCP_PROJECT)
      : !!process.env[provider.apiKeyEnv];
    if (!isConfigured) continue;

    try {
      return await complete(name, messages, options);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[ai-router] ${name} failed for ${task}: ${msg}`);
      errors.push(`${name}: ${msg}`);
    }
  }

  throw new Error(`All providers failed for task "${task}": ${errors.join(' | ')}`);
}

// ---------------------------------------------------------------------------
// Recommendation helpers (use router for completions)
// ---------------------------------------------------------------------------

export async function recommendJobsForDriver(
  driverProfile: Record<string, unknown>,
  limit: number,
): Promise<{ recommendations: Array<{ score: number; reasoning: string }> }> {
  const prompt = `Given this driver profile, recommend the top ${limit} best-fit job types and explain why.
Driver profile: ${JSON.stringify(driverProfile)}
Return a JSON array of objects with "score" (0-100) and "reasoning" fields.`;

  const provider = selectProvider('general');
  const result = await complete(provider, [
    { role: 'system', content: 'You are a CDL trucking job recommendation engine. Return valid JSON only.' },
    { role: 'user', content: prompt },
  ]);

  try {
    const parsed = JSON.parse(result.content);
    return { recommendations: Array.isArray(parsed) ? parsed : parsed.recommendations || [] };
  } catch {
    return { recommendations: [{ score: 0, reasoning: result.content }] };
  }
}

export async function recommendDriversForJob(
  jobDescription: Record<string, unknown>,
  limit: number,
): Promise<{ recommendations: Array<{ score: number; reasoning: string }> }> {
  const prompt = `Given this job description, describe the ideal ${limit} driver profiles and why they'd be a good fit.
Job: ${JSON.stringify(jobDescription)}
Return a JSON array of objects with "score" (0-100) and "reasoning" fields.`;

  const provider = selectProvider('general');
  const result = await complete(provider, [
    { role: 'system', content: 'You are a CDL trucking driver recommendation engine. Return valid JSON only.' },
    { role: 'user', content: prompt },
  ]);

  try {
    const parsed = JSON.parse(result.content);
    return { recommendations: Array.isArray(parsed) ? parsed : parsed.recommendations || [] };
  } catch {
    return { recommendations: [{ score: 0, reasoning: result.content }] };
  }
}
