import crypto from 'crypto';
import { query, getTableName, buildInsertQuery } from '@lmdr/db';
import { completeWithFallback, ChatMessage, ToolDefinition, ToolCall } from './aiRouter';

const CONVERSATIONS_TABLE = getTableName('agentConversations');
const TURNS_TABLE = getTableName('agentTurns');

// ---------------------------------------------------------------------------
// Role-specific system prompts
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Role-specific completion settings
// ---------------------------------------------------------------------------

const ROLE_SETTINGS: Record<string, { maxTokens: number; temperature: number }> = {
  driver: { maxTokens: 400, temperature: 0.4 },
  recruiter: { maxTokens: 600, temperature: 0.5 },
  admin: { maxTokens: 600, temperature: 0.5 },
  carrier: { maxTokens: 500, temperature: 0.5 },
};

const DEFAULT_SETTINGS = { maxTokens: 500, temperature: 0.5 };

const LMDR_API_URL = process.env.LMDR_API_URL || 'https://lmdr-api-140035137711.us-central1.run.app';
const LMDR_INTERNAL_KEY = process.env.LMDR_INTERNAL_KEY || '';
const MAX_TOOL_ITERATIONS = 3;

// ---------------------------------------------------------------------------
// Tool Manifest Cache (5-minute TTL)
// ---------------------------------------------------------------------------

interface ManifestTool extends ToolDefinition {
  endpoint: { method: string; path: string };
}

let cachedManifest: { tools: ManifestTool[]; fetchedAt: number } | null = null;

async function getToolsForRole(role: string): Promise<{ tools: ToolDefinition[]; endpointMap: Map<string, { method: string; path: string }> }> {
  // Only driver role has tools for now
  if (role !== 'driver') return { tools: [], endpointMap: new Map() };

  const now = Date.now();
  if (cachedManifest && now - cachedManifest.fetchedAt < 5 * 60 * 1000) {
    return buildToolResult(cachedManifest.tools);
  }

  try {
    const res = await fetch(`${LMDR_API_URL}/v1/driver/manifest`, {
      headers: { Authorization: `Bearer ${LMDR_INTERNAL_KEY}` },
    });
    if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
    const data = (await res.json()) as { tools: ManifestTool[] };
    cachedManifest = { tools: data.tools, fetchedAt: now };
    return buildToolResult(data.tools);
  } catch (err) {
    console.warn('[agent] Failed to fetch tool manifest, proceeding without tools:', (err as Error).message);
    return { tools: [], endpointMap: new Map() };
  }
}

function buildToolResult(manifestTools: ManifestTool[]) {
  const tools: ToolDefinition[] = manifestTools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));
  const endpointMap = new Map<string, { method: string; path: string }>();
  for (const t of manifestTools) {
    endpointMap.set(t.name, t.endpoint);
  }
  return { tools, endpointMap };
}

// ---------------------------------------------------------------------------
// Tool Execution — calls Cloud Run API endpoints
// ---------------------------------------------------------------------------

async function executeTool(
  toolCall: ToolCall,
  endpointMap: Map<string, { method: string; path: string }>,
  userId: string,
): Promise<string> {
  const endpoint = endpointMap.get(toolCall.function.name);
  if (!endpoint) return JSON.stringify({ error: `Unknown tool: ${toolCall.function.name}` });

  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(toolCall.function.arguments);
  } catch {
    return JSON.stringify({ error: 'Invalid tool arguments' });
  }

  // Inject userId as driverId if the tool expects it and it's not provided
  if (!args.driverId && endpoint.path.includes(':id')) {
    args.driverId = userId;
  }

  // Route /ai/* paths to the AI service (self), everything else to Cloud Run API
  const AI_SERVICE_URL = process.env.LMDR_AI_SERVICE_URL || 'https://lmdr-ai-service-140035137711.us-central1.run.app';
  const baseUrl = endpoint.path.startsWith('/ai/') ? AI_SERVICE_URL : LMDR_API_URL;

  // Build URL: replace path params like :id, :driverId, :jobId, :appId, :carrierDot
  let url = `${baseUrl}${endpoint.path}`;
  url = url.replace(':id', String(args.driverId || userId));
  url = url.replace(':driverId', String(args.driverId || userId));
  url = url.replace(':jobId', String(args.jobId || ''));
  url = url.replace(':appId', String(args.appId || ''));
  url = url.replace(':carrierDot', String(args.carrierDot || ''));

  try {
    const fetchOptions: RequestInit = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LMDR_INTERNAL_KEY}`,
      },
    };

    if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
      fetchOptions.body = JSON.stringify(args);
    } else if (endpoint.method === 'GET') {
      // Append remaining args as query params
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(args)) {
        if (!['driverId', 'jobId', 'appId', 'carrierDot'].includes(k) && v !== undefined) {
          params.set(k, String(v));
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const res = await fetch(url, fetchOptions);
    const text = await res.text();

    if (!res.ok) {
      return JSON.stringify({ error: `API returned ${res.status}`, detail: text.slice(0, 500) });
    }

    // Truncate large responses to stay within token limits
    return text.length > 2000 ? text.slice(0, 2000) + '...(truncated)' : text;
  } catch (err) {
    return JSON.stringify({ error: `Tool execution failed: ${(err as Error).message}` });
  }
}

// ---------------------------------------------------------------------------
// Structured role prompts: Intent → Goal → Must → Must Not → Should → Should Not
// ---------------------------------------------------------------------------

const ROLE_PROMPTS: Record<string, string> = {
  driver: `## Intent
You are the LMDR Driver Assistant — a concise, mobile-first copilot for CDL truck drivers using the DriverOS app on their phone.

## Goal
Help drivers find carriers, understand safety ratings, compare pay, check application status, and navigate their trucking career — all within a small-screen chat interface.

## Must
- Keep every response to 1–3 short sentences unless the driver explicitly asks for detail
- Use plain language a working driver understands — no corporate jargon
- Lead with the answer, then offer to elaborate ("Want me to break that down?")
- When listing items, cap at 3 max with the most relevant first
- Reference the driver's profile context when available (name, CDL class, location, preferences)

## Must Not
- Never produce walls of text, long numbered lists, or multi-paragraph essays
- Never fabricate carrier names, pay rates, safety scores, or job listings — if you don't have live data, say so
- Never give legal, medical, or financial advice — redirect to professionals
- Never use markdown headers (##) or code blocks in responses — this is a chat bubble, not a document

## Should
- Be direct, warm, and encouraging — drivers are busy and often on the road
- Use bullet points sparingly (2–3 max) when comparing options
- Proactively suggest next actions ("Want me to check your matches?" / "I can pull up that carrier's safety record")
- Acknowledge when you can't do something yet and suggest the manual path

## Should Not
- Should not repeat the driver's question back to them
- Should not apologize excessively — one "sorry" max, then move to the solution
- Should not use emojis unless the driver uses them first
- Should not pad responses with filler like "Great question!" or "Sure thing!"`,

  recruiter: `## Intent
You are the VelocityMatch Recruiter Assistant — an efficient operations copilot for recruiters managing driver pipelines, outreach campaigns, and hiring workflows.

## Goal
Help recruiters search drivers, manage pipeline stages, understand match scores, track campaign performance, and optimize their recruiting workflow.

## Must
- Keep responses to 2–4 sentences for quick questions; use brief structured lists for data-heavy answers
- Lead with metrics and actionable insight, not narrative
- Reference specific pipeline stages, match scores, and candidate counts when available
- Distinguish between what you can look up vs. what requires manual action in the platform

## Must Not
- Never fabricate candidate data, pipeline numbers, or match scores
- Never take actions (send messages, move candidates, schedule interviews) without explicit confirmation
- Never expose driver PII beyond what the recruiter's role permits
- Never produce long prose when a table or 3-bullet summary would suffice

## Should
- Frame answers in terms of recruiter KPIs (time-to-fill, response rate, pipeline velocity)
- Suggest workflow optimizations when patterns emerge
- Offer to drill deeper: "Want the breakdown by stage?" / "I can pull the last 7 days"

## Should Not
- Should not editorialize about hiring strategy unless asked
- Should not repeat information the recruiter just provided
- Should not use driver-facing language (this is an internal ops tool)`,

  admin: `## Intent
You are the VelocityMatch Admin Assistant — a systems copilot for platform administrators monitoring health, managing configuration, reviewing analytics, and troubleshooting issues.

## Goal
Help admins check system health, review service metrics, manage users, configure platform settings, investigate anomalies, and generate reports.

## Must
- Lead with status/health indicators, then details on request
- Keep responses to 2–4 sentences; use structured format for multi-service status
- Distinguish between live data lookups vs. general platform knowledge
- Flag severity clearly: operational / degraded / outage

## Must Not
- Never execute destructive operations (delete users, drop config, disable services) without explicit confirmation
- Never fabricate metrics, uptime numbers, or error counts
- Never expose secrets, API keys, or internal service credentials in responses
- Never downplay service issues — if something is degraded, say so directly

## Should
- Proactively suggest related checks ("API is healthy — want me to check the database connection too?")
- Provide timestamps and version numbers when referencing service state
- Offer drill-down paths for anomalies

## Should Not
- Should not produce verbose explanations of system architecture unless asked
- Should not speculate about root causes without data
- Should not use non-technical language — admins expect precision`,

  carrier: `## Intent
You are the VelocityMatch Carrier Assistant — a recruiting intelligence copilot for motor carriers looking to hire and retain CDL drivers.

## Goal
Help carriers understand their competitive position, improve their driver recruiting outcomes, manage job listings, and optimize their hiring funnel.

## Must
- Keep responses to 2–4 sentences; lead with the competitive insight or action item
- Reference FMCSA safety data, pay benchmarks, and market conditions when available
- Frame everything in terms of driver attraction and retention outcomes

## Must Not
- Never fabricate safety scores, inspection data, or crash statistics
- Never guarantee hiring outcomes or make promises about candidate volume
- Never disparage competing carriers by name
- Never produce long marketing-style copy — this is an ops tool

## Should
- Compare carrier metrics against market benchmarks when relevant
- Suggest concrete improvements ("Your OOS rate is above average — addressing that could improve your match score")
- Offer to pull specific data: "Want to see how you compare on pay for this lane?"

## Should Not
- Should not assume the carrier's business priorities — ask first
- Should not use driver-facing language or tone
- Should not pad with pleasantries — carriers want data and action items`,
};

// ---------------------------------------------------------------------------
// Agent Turn Handler
// ---------------------------------------------------------------------------

export async function handleAgentTurn(
  role: string,
  userId: string,
  message: string,
  context?: { conversationId?: string; additionalContext?: string },
): Promise<{ conversationId: string; response: string; turnId: string }> {
  // 1. Get or create conversation
  let conversationId = context?.conversationId;
  if (!conversationId) {
    conversationId = await createConversation(role, userId);
  }

  // 2. Save user turn
  await saveTurn(conversationId, 'user', message);

  // 3. Fetch available tools for this role
  const { tools, endpointMap } = await getToolsForRole(role);

  // 4. Build message history from recent turns
  const history = await getRecentTurns(conversationId, 20);

  const systemPrompt = ROLE_PROMPTS[role] || ROLE_PROMPTS.driver;
  const toolInstruction = tools.length
    ? `\n\nYou have access to ${tools.length} tools. Use them to look up real data when the user asks about their profile, matches, applications, carriers, or anything that requires live data. Always prefer using a tool over guessing.`
    : '';

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt + toolInstruction },
  ];

  if (context?.additionalContext) {
    messages.push({ role: 'system', content: `Additional context: ${context.additionalContext}` });
  }

  // Add conversation history
  for (const turn of history) {
    const turnData = turn.data as Record<string, unknown>;
    messages.push({
      role: turnData.role as 'user' | 'assistant',
      content: turnData.content as string,
    });
  }

  // Ensure the latest user message is included
  if (history.length === 0 || (history[history.length - 1].data as Record<string, unknown>).content !== message) {
    messages.push({ role: 'user', content: message });
  }

  // 5. AI completion with tool execution loop
  const settings = ROLE_SETTINGS[role] || DEFAULT_SETTINGS;
  const completionOptions: Record<string, unknown> = {
    maxTokens: settings.maxTokens,
    temperature: settings.temperature,
  };
  if (tools.length) {
    completionOptions.tools = tools;
    // Allow more tokens when tools are in play (need room for tool call reasoning)
    completionOptions.maxTokens = Math.max(settings.maxTokens, 800);
  }

  let finalContent = '';

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const result = await completeWithFallback('agent_orchestration', messages, completionOptions);

    // If no tool calls, we have the final response
    if (!result.tool_calls?.length) {
      finalContent = result.content;
      break;
    }

    // LLM wants to call tools — add its message to history
    messages.push({
      role: 'assistant',
      content: result.content || '',
      tool_calls: result.tool_calls,
    });

    // Execute each tool call and add results
    for (const toolCall of result.tool_calls) {
      console.log(`[agent] Executing tool: ${toolCall.function.name}`);
      const toolResult = await executeTool(toolCall, endpointMap, userId);
      messages.push({
        role: 'tool',
        content: toolResult,
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
      });
    }

    // On last iteration, force a text response by removing tools
    if (iteration === MAX_TOOL_ITERATIONS - 2) {
      delete completionOptions.tools;
    }
  }

  // Fallback if loop exhausted without text
  if (!finalContent) {
    finalContent = "I looked up the information but couldn't summarize it. Try asking again.";
  }

  // 6. Save assistant turn
  const assistantTurnId = await saveTurn(conversationId, 'assistant', finalContent);

  // 7. Update conversation timestamp
  await updateConversationTimestamp(conversationId);

  return {
    conversationId,
    response: finalContent,
    turnId: assistantTurnId,
  };
}

// ---------------------------------------------------------------------------
// Conversation CRUD
// ---------------------------------------------------------------------------

async function createConversation(role: string, userId: string): Promise<string> {
  const _id = crypto.randomUUID();
  const data = {
    role,
    userId,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { sql, params } = buildInsertQuery(CONVERSATIONS_TABLE, { _id, data });
  await query(sql, params);
  return _id;
}

async function updateConversationTimestamp(conversationId: string): Promise<void> {
  await query(
    `UPDATE "${CONVERSATIONS_TABLE}" SET data = jsonb_set(data, '{updatedAt}', to_jsonb($2::text)) WHERE _id = $1`,
    [conversationId, new Date().toISOString()],
  );
}

async function saveTurn(conversationId: string, role: string, content: string): Promise<string> {
  const _id = crypto.randomUUID();
  const data = {
    conversationId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };

  const { sql, params } = buildInsertQuery(TURNS_TABLE, { _id, data });
  await query(sql, params);
  return _id;
}

async function getRecentTurns(conversationId: string, maxTurns: number) {
  const result = await query(
    `SELECT _id, data FROM "${TURNS_TABLE}"
     WHERE data->>'conversationId' = $1
     ORDER BY _created_at ASC
     LIMIT $2`,
    [conversationId, maxTurns],
  );
  return result.rows;
}

// ---------------------------------------------------------------------------
// Public query methods
// ---------------------------------------------------------------------------

export async function getConversations(userId: string) {
  const result = await query(
    `SELECT _id, data, _created_at, _updated_at FROM "${CONVERSATIONS_TABLE}"
     WHERE data->>'userId' = $1
     ORDER BY _updated_at DESC
     LIMIT 50`,
    [userId],
  );
  return result.rows.map((r) => ({
    _id: r._id,
    ...(r.data as Record<string, unknown>),
    _createdAt: r._created_at,
    _updatedAt: r._updated_at,
  }));
}

export async function getConversationTurns(conversationId: string) {
  const result = await query(
    `SELECT _id, data, _created_at FROM "${TURNS_TABLE}"
     WHERE data->>'conversationId' = $1
     ORDER BY _created_at ASC`,
    [conversationId],
  );
  return result.rows.map((r) => ({
    _id: r._id,
    ...(r.data as Record<string, unknown>),
    _createdAt: r._created_at,
  }));
}
