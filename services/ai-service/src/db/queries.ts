import { query, getTableName } from '@lmdr/db';

const CONVERSATIONS_TABLE = getTableName('agentConversations');
const TURNS_TABLE = getTableName('agentTurns');
const EMBEDDINGS_TABLE = getTableName('ragEmbeddings');

export async function getConversationCount(userId: string): Promise<number> {
  const result = await query(
    `SELECT COUNT(*) as count FROM "${CONVERSATIONS_TABLE}" WHERE data->>'userId' = $1`,
    [userId],
  );
  return Number(result.rows[0].count);
}

export async function getTurnCount(conversationId: string): Promise<number> {
  const result = await query(
    `SELECT COUNT(*) as count FROM "${TURNS_TABLE}" WHERE data->>'conversationId' = $1`,
    [conversationId],
  );
  return Number(result.rows[0].count);
}

export async function getEmbeddingCount(): Promise<number> {
  const result = await query(`SELECT COUNT(*) as count FROM "${EMBEDDINGS_TABLE}"`);
  return Number(result.rows[0].count);
}

export async function getActiveConversations(limit = 20) {
  const result = await query(
    `SELECT _id, data, _created_at, _updated_at FROM "${CONVERSATIONS_TABLE}"
     WHERE data->>'status' = 'active'
     ORDER BY _updated_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows.map((r) => ({
    _id: r._id,
    ...(r.data as Record<string, unknown>),
    _createdAt: r._created_at,
    _updatedAt: r._updated_at,
  }));
}

export async function endConversation(conversationId: string): Promise<boolean> {
  const result = await query(
    `UPDATE "${CONVERSATIONS_TABLE}"
     SET data = jsonb_set(jsonb_set(data, '{status}', '"ended"'), '{endedAt}', to_jsonb($2::text))
     WHERE _id = $1
     RETURNING _id`,
    [conversationId, new Date().toISOString()],
  );
  return result.rows.length > 0;
}

export async function getDocumentIds(): Promise<string[]> {
  const result = await query(
    `SELECT DISTINCT data->>'docId' as doc_id FROM "${EMBEDDINGS_TABLE}" ORDER BY doc_id`,
  );
  return result.rows.map((r) => r.doc_id as string);
}

export async function deleteDocumentEmbeddings(docId: string): Promise<number> {
  const result = await query(
    `DELETE FROM "${EMBEDDINGS_TABLE}" WHERE data->>'docId' = $1`,
    [docId],
  );
  return result.rowCount || 0;
}
