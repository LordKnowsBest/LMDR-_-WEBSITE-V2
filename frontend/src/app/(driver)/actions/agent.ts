'use server';

const CLOUD_RUN_URL = process.env.LMDR_API_URL || 'https://lmdr-api-140035137711.us-central1.run.app';
const AI_SERVICE_URL = process.env.LMDR_AI_SERVICE_URL || 'https://lmdr-ai-service-140035137711.us-central1.run.app';
const INTERNAL_KEY = process.env.LMDR_INTERNAL_KEY || '';

const DRIVER_ID = 'demo-driver-001';
const MAX_TOOL_LOOPS = 5;

/* ── System prompt for the driver AI assistant ── */
const SYSTEM_PROMPT = `You are LMDR AI, a helpful assistant for CDL truck drivers on the Last Mile Driver Recruiting platform.
You help drivers find jobs, manage applications, track career progress, and navigate the platform.

Key facts about the current driver:
- Driver ID: ${DRIVER_ID}
- Use tools to look up real data rather than guessing
- Be concise and mobile-friendly (short paragraphs, bullet points)
- Use emoji sparingly for visual clarity
- When showing matches/jobs, highlight the match score, pay rate, and key benefits
- Always be encouraging and supportive of the driver's career goals

When the driver asks about jobs, matches, or applications, USE the available tools to fetch real data.
Do NOT make up carrier names, pay rates, or match scores — always call the appropriate tool first.`;

/* ── Tool definition type (from Cloud Run manifest) ── */
interface ToolDef {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  endpoint: { method: string; path: string };
}

interface AiMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; [key: string]: unknown }>;
}

interface AgentTurnResponse {
  type: 'text' | 'tool_use';
  text?: string;
  toolUseBlocks?: Array<{ type: string; id: string; name: string; input: Record<string, unknown> }>;
  contentBlocks?: Array<Record<string, unknown>>;
  stopReason?: string;
  error?: { code: string; message: string };
}

/* ── Fetch tool definitions from Cloud Run manifest ── */
let cachedTools: ToolDef[] | null = null;

async function getToolDefinitions(): Promise<ToolDef[]> {
  if (cachedTools) return cachedTools;
  try {
    const res = await fetch(`${CLOUD_RUN_URL}/v1/driver/manifest`, {
      headers: { 'Authorization': `Bearer ${INTERNAL_KEY}` },
      next: { revalidate: 300 }, // cache for 5 min
    });
    if (!res.ok) return [];
    const data = await res.json();
    cachedTools = data.tools || [];
    return cachedTools!;
  } catch {
    return [];
  }
}

/* ── Execute a single tool call against Cloud Run API ── */
async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  tools: ToolDef[]
): Promise<unknown> {
  const toolDef = tools.find((t) => t.name === toolName);
  if (!toolDef) return { error: `Unknown tool: ${toolName}` };

  const { method, path: pathTemplate } = toolDef.endpoint;

  // Replace :param placeholders in path with actual values
  let path = pathTemplate;
  // Map common param names — driverId -> :id in most routes
  const driverId = (toolInput.driverId as string) || DRIVER_ID;
  path = path.replace(':id', driverId);
  path = path.replace(':driverId', driverId);
  if (toolInput.carrierDot) path = path.replace(':carrierDot', toolInput.carrierDot as string);
  if (toolInput.jobId) path = path.replace(':jobId', toolInput.jobId as string);
  if (toolInput.appId) path = path.replace(':appId', toolInput.appId as string);

  // Build query params for GET requests
  let url = `${CLOUD_RUN_URL}${path}`;
  if (method === 'GET') {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(toolInput)) {
      if (key === 'driverId') continue; // already in path
      if (val !== undefined && val !== null) params.set(key, String(val));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${INTERNAL_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    // Include body for POST/PUT
    if (method === 'POST' || method === 'PUT') {
      fetchOptions.body = JSON.stringify(toolInput);
    }

    const res = await fetch(url, fetchOptions);
    const data = await res.json().catch(() => ({}));
    return data;
  } catch (err) {
    return { error: `Tool execution failed: ${err instanceof Error ? err.message : 'unknown'}` };
  }
}

/* ── Call the AI service for one turn ── */
async function callAiService(
  messages: AiMessage[],
  tools: ToolDef[]
): Promise<AgentTurnResponse> {
  // Strip endpoint metadata from tools — AI service only needs name, description, input_schema
  const aiTools = tools.map(({ name, description, input_schema }) => ({
    name,
    description,
    input_schema,
  }));

  const res = await fetch(`${AI_SERVICE_URL}/agent/turn`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${INTERNAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemPrompt: SYSTEM_PROMPT,
      messages,
      tools: aiTools,
      maxTokens: 1024,
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { type: 'text', text: '', error: { code: 'provider_error', message: body?.error?.message || `AI service returned ${res.status}` } };
  }

  return res.json();
}

/* ── Main server action: handles full agent turn with tool loop ── */
export async function agentTurn(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ text: string; error?: string }> {
  try {
    const tools = await getToolDefinitions();

    // Build messages array from conversation history + new user message
    const messages: AiMessage[] = [
      ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage },
    ];

    // Tool-use loop
    let loopCount = 0;
    while (loopCount < MAX_TOOL_LOOPS) {
      const response = await callAiService(messages, tools);

      if (response.error) {
        return { text: '', error: response.error.message };
      }

      if (response.type === 'text') {
        return { text: response.text || "I'm not sure how to help with that. Could you rephrase?" };
      }

      // Handle tool_use — execute tools and send results back
      if (response.type === 'tool_use' && response.toolUseBlocks) {
        // Add assistant's tool_use message
        messages.push({
          role: 'assistant',
          content: response.contentBlocks as Array<{ type: string; [key: string]: unknown }> || response.toolUseBlocks,
        });

        // Execute each tool and build tool_result content blocks
        const toolResults = await Promise.all(
          response.toolUseBlocks.map(async (block) => {
            const result = await executeTool(block.name, block.input, tools);
            return {
              type: 'tool_result' as const,
              tool_use_id: block.id,
              content: JSON.stringify(result),
            };
          })
        );

        // Add tool results as user message
        messages.push({
          role: 'user',
          content: toolResults,
        });

        loopCount++;
        continue;
      }

      // Unexpected response type
      return { text: "Something went wrong. Please try again." };
    }

    return { text: "I ran into a complex query. Let me simplify — could you ask your question in a different way?" };
  } catch (err) {
    console.error('Agent turn error:', err);
    // Fallback to a helpful response on any error
    return {
      text: "I'm having trouble connecting right now. Try again in a moment, or check out your Dashboard for quick stats.",
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
