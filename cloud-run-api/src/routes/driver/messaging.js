import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { insertLog, insertAuditEvent } from '../../db/bigquery.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

function formatRecord(row) {
  if (!row) return null;
  const { _id, airtable_id, _created_at, _updated_at, data } = row;
  return { _id, airtable_id, _createdAt: _created_at, _updatedAt: _updated_at, ...data };
}

function formatRecords(rows) { return (rows || []).map(formatRecord); }

async function safeQuery(sql, params) {
  try { return await query(sql, params); }
  catch (err) { if (err.message?.includes('does not exist')) return { rows: [] }; throw err; }
}

function handleError(res, context, err) {
  console.error(`[driver/messaging] ${context}:`, err.message);
  insertLog({ service: 'driver', level: 'ERROR', message: `messaging/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── GET /:id/conversations ── List conversations for a driver
router.get('/:id/conversations', async (req, res) => {
  try {
    const { id } = req.params;
    const convTable = getTableName('driverConversations');
    const msgTable = getTableName('messages');

    const sql = `
      SELECT c.*,
        (SELECT COUNT(*) FROM "${msgTable}" m
         WHERE m.data->>'conversation_id' = c._id
           AND m.data->>'read' = 'false'
           AND m.data->>'recipient_id' = $1
        ) AS unread_count,
        (SELECT m2.data->>'content' FROM "${msgTable}" m2
         WHERE m2.data->>'conversation_id' = c._id
         ORDER BY m2._created_at DESC LIMIT 1
        ) AS last_message,
        (SELECT m3._created_at FROM "${msgTable}" m3
         WHERE m3.data->>'conversation_id' = c._id
         ORDER BY m3._created_at DESC LIMIT 1
        ) AS last_message_at
      FROM "${convTable}" c
      WHERE c.data->>'driver_id' = $1
         OR c.data->>'recipient_id' = $1
      ORDER BY COALESCE(
        (SELECT m4._created_at FROM "${msgTable}" m4
         WHERE m4.data->>'conversation_id' = c._id
         ORDER BY m4._created_at DESC LIMIT 1),
        c._created_at
      ) DESC
    `;
    const result = await safeQuery(sql, [id]);
    const conversations = result.rows.map(row => ({
      ...formatRecord(row),
      unreadCount: parseInt(row.unread_count) || 0,
      lastMessage: row.last_message || null,
      lastMessageAt: row.last_message_at || null,
    }));
    return res.json({ conversations });
  } catch (err) { return handleError(res, 'list-conversations', err); }
});

// ── GET /:id/conversation/:convId ── Get messages in a conversation
router.get('/:id/conversation/:convId', async (req, res) => {
  try {
    const { id, convId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    const convTable = getTableName('driverConversations');
    const msgTable = getTableName('messages');

    const [convResult, msgsResult, countResult] = await Promise.all([
      safeQuery(`SELECT * FROM "${convTable}" WHERE _id = $1`, [convId]),
      safeQuery(
        `SELECT * FROM "${msgTable}" WHERE data->>'conversation_id' = $1 ORDER BY _created_at ASC LIMIT $2 OFFSET $3`,
        [convId, parseInt(limit), parseInt(skip)]
      ),
      safeQuery(`SELECT COUNT(*) FROM "${msgTable}" WHERE data->>'conversation_id' = $1`, [convId]),
    ]);

    if (convResult.rows.length === 0) return res.status(404).json({ error: 'CONVERSATION_NOT_FOUND' });

    return res.json({
      conversation: formatRecord(convResult.rows[0]),
      messages: formatRecords(msgsResult.rows),
      totalCount: parseInt(countResult.rows[0]?.count) || 0,
    });
  } catch (err) { return handleError(res, 'get-messages', err); }
});

// ── POST /:id/conversation/:convId ── Send a message
router.post('/:id/conversation/:convId', async (req, res) => {
  try {
    const { id, convId } = req.params;
    const { content, recipientId } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });

    const msgTable = getTableName('messages');
    const convTable = getTableName('driverConversations');
    const messageId = uuidv4();
    const now = new Date().toISOString();

    // Verify conversation exists
    const convCheck = await safeQuery(`SELECT _id FROM "${convTable}" WHERE _id = $1`, [convId]);
    if (convCheck.rows.length === 0) return res.status(404).json({ error: 'CONVERSATION_NOT_FOUND' });

    await safeQuery(
      `INSERT INTO "${msgTable}" (_id, _created_at, _updated_at, data) VALUES ($1, $2, $2, $3)`,
      [messageId, now, JSON.stringify({
        conversation_id: convId,
        sender_id: id,
        recipient_id: recipientId || null,
        content,
        read: 'false',
        sent_at: now,
      })]
    );

    // Update conversation timestamp
    await safeQuery(
      `UPDATE "${convTable}" SET _updated_at = $1 WHERE _id = $2`,
      [now, convId]
    );

    insertAuditEvent({ actor: id, action: 'message_sent', target: convId, data: { messageId } });

    return res.status(201).json({ messageId });
  } catch (err) { return handleError(res, 'send-message', err); }
});

// ── POST /:id/conversation ── Create new conversation
router.post('/:id/conversation', async (req, res) => {
  try {
    const { id } = req.params;
    const { recipientId, recipientName, subject } = req.body;
    if (!recipientId) return res.status(400).json({ error: 'recipientId is required' });

    const convTable = getTableName('driverConversations');
    const convId = uuidv4();
    const now = new Date().toISOString();

    await safeQuery(
      `INSERT INTO "${convTable}" (_id, _created_at, _updated_at, data) VALUES ($1, $2, $2, $3)`,
      [convId, now, JSON.stringify({
        driver_id: id,
        recipient_id: recipientId,
        recipient_name: recipientName || null,
        subject: subject || null,
        status: 'active',
      })]
    );

    insertAuditEvent({ actor: id, action: 'conversation_created', target: convId, data: { recipientId } });

    return res.status(201).json({ conversationId: convId });
  } catch (err) { return handleError(res, 'create-conversation', err); }
});

// ── PUT /:id/conversation/:convId/read ── Mark conversation as read
router.put('/:id/conversation/:convId/read', async (req, res) => {
  try {
    const { id, convId } = req.params;
    const msgTable = getTableName('messages');

    // Mark all unread messages in this conversation where the driver is the recipient as read
    const result = await safeQuery(
      `UPDATE "${msgTable}"
       SET data = jsonb_set(data::jsonb, '{read}', '"true"'),
           _updated_at = $1
       WHERE data->>'conversation_id' = $2
         AND data->>'recipient_id' = $3
         AND data->>'read' = 'false'`,
      [new Date().toISOString(), convId, id]
    );

    return res.json({ status: 'ok', updatedCount: result.rowCount || 0 });
  } catch (err) { return handleError(res, 'mark-read', err); }
});

export default router;
