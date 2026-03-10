import crypto from 'crypto';
import { query, getTableName, buildInsertQuery } from '@lmdr/db';
import { selectProvider, complete, ChatMessage } from './aiRouter';

const CONVERSATIONS_TABLE = getTableName('agentConversations');
const TURNS_TABLE = getTableName('agentTurns');

// ---------------------------------------------------------------------------
// Role-specific system prompts
// ---------------------------------------------------------------------------

const ROLE_PROMPTS: Record<string, string> = {
  driver:
    'You are the LMDR Driver Assistant. Help CDL truck drivers find carriers, understand safety ratings, compare pay, and navigate their career. Be concise and practical.',
  recruiter:
    'You are the VelocityMatch Recruiter Assistant. Help recruiters manage driver pipelines, understand match scores, and optimize their recruiting workflow.',
  admin:
    'You are the VelocityMatch Admin Assistant. Help administrators monitor system health, manage users, review analytics, and configure platform settings.',
  carrier:
    'You are the VelocityMatch Carrier Assistant. Help carriers manage their driver hiring, understand their competitive position, and improve their recruiting outcomes.',
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
  const userTurnId = await saveTurn(conversationId, 'user', message);

  // 3. Build message history from recent turns
  const history = await getRecentTurns(conversationId, 20);
  const messages: ChatMessage[] = [
    { role: 'system', content: ROLE_PROMPTS[role] || ROLE_PROMPTS.driver },
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

  // 4. Get AI completion
  const provider = selectProvider('agent_orchestration');
  const result = await complete(provider, messages, { maxTokens: 2048 });

  // 5. Save assistant turn
  const assistantTurnId = await saveTurn(conversationId, 'assistant', result.content);

  // 6. Update conversation timestamp
  await updateConversationTimestamp(conversationId);

  return {
    conversationId,
    response: result.content,
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
