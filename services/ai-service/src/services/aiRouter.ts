import OpenAI from 'openai';

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

// Task -> provider mapping
const TASK_ROUTING: Record<string, string> = {
  enrichment: 'groq',
  agent_orchestration: 'claude',
  embedding: 'openai',
  general: 'openai',
  coding: 'deepseek',
  analysis: 'deepseek',
};

// ---------------------------------------------------------------------------
// Provider Selection
// ---------------------------------------------------------------------------

export function selectProvider(task: string, _options?: Record<string, unknown>): string {
  return TASK_ROUTING[task] || TASK_ROUTING.general;
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
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionResult {
  content: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export async function complete(
  providerName: string,
  messages: ChatMessage[],
  options?: Record<string, unknown>,
): Promise<CompletionResult> {
  switch (providerName) {
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

// ---------------------------------------------------------------------------
// OpenAI
// ---------------------------------------------------------------------------

function getOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function completeOpenAI(messages: ChatMessage[], options?: Record<string, unknown>): Promise<CompletionResult> {
  const openai = getOpenAIClient();
  const model = (options?.model as string) || PROVIDERS.openai.model;
  const response = await openai.chat.completions.create({
    model,
    messages,
    max_tokens: (options?.maxTokens as number) || 4096,
    temperature: (options?.temperature as number) ?? 0.7,
  });

  const choice = response.choices[0];
  return {
    content: choice.message.content || '',
    model: response.model,
    usage: response.usage
      ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Claude (Anthropic)
// ---------------------------------------------------------------------------

async function completeClaude(messages: ChatMessage[], options?: Record<string, unknown>): Promise<CompletionResult> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('CLAUDE_API_KEY not configured');

  const model = (options?.model as string) || PROVIDERS.claude.model;

  // Anthropic expects system message separate from messages array
  const systemMsg = messages.find((m) => m.role === 'system');
  const nonSystemMsgs = messages.filter((m) => m.role !== 'system');

  const body: Record<string, unknown> = {
    model,
    max_tokens: (options?.maxTokens as number) || 4096,
    messages: nonSystemMsgs.map((m) => ({ role: m.role, content: m.content })),
  };
  if (systemMsg) {
    body.system = systemMsg.content;
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
    content: Array<{ type: string; text: string }>;
    model: string;
    usage: { input_tokens: number; output_tokens: number };
  };

  return {
    content: data.content.map((c) => c.text).join(''),
    model: data.model,
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

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: (options?.maxTokens as number) || 4096,
      temperature: (options?.temperature as number) ?? 0.7,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
    model: string;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };

  return {
    content: data.choices[0].message.content || '',
    model: data.model,
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

  // Convert ChatMessage format to Gemini format
  const systemInstruction = messages.find((m) => m.role === 'system');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body: Record<string, unknown> = { contents };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
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

  const data = (await response.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
  };

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';

  return {
    content: text,
    model,
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

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: (options?.maxTokens as number) || 4096,
      temperature: (options?.temperature as number) ?? 0.7,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
    model: string;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };

  return {
    content: data.choices[0].message.content || '',
    model: data.model,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
  };
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
