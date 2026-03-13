import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { insertLog, insertAuditEvent } from '../../db/bigquery.js';
import { v4 as uuidv4 } from 'uuid';
import { triggerXP } from '../../lib/xp-trigger.js';

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
  console.error(`[driver/community] ${context}:`, err.message);
  insertLog({ service: 'driver', level: 'ERROR', message: `community/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── GET /forums ── List forum categories with thread count
router.get('/forums', async (req, res) => {
  try {
    const catTable = getTableName('forumCategories');
    const threadTable = getTableName('forumThreads');
    const sql = `
      SELECT c.*, COALESCE(t.thread_count, 0) AS thread_count
      FROM "${catTable}" c
      LEFT JOIN (
        SELECT data->>'category_id' AS category_id, COUNT(*) AS thread_count
        FROM "${threadTable}"
        GROUP BY data->>'category_id'
      ) t ON c._id = t.category_id
      ORDER BY c._created_at ASC
    `;
    const result = await safeQuery(sql);
    const categories = result.rows.map(row => ({
      ...formatRecord(row),
      threadCount: parseInt(row.thread_count) || 0,
    }));
    return res.json({ categories });
  } catch (err) { return handleError(res, 'list-forums', err); }
});

// ── GET /forums/:categoryId/threads ── Threads for a category, paginated
router.get('/forums/:categoryId/threads', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit = 20, skip = 0 } = req.query;
    const threadTable = getTableName('forumThreads');
    const postTable = getTableName('forumPosts');
    const sql = `
      SELECT th.*, COALESCE(p.reply_count, 0) AS reply_count
      FROM "${threadTable}" th
      LEFT JOIN (
        SELECT data->>'thread_id' AS thread_id, COUNT(*) AS reply_count
        FROM "${postTable}"
        GROUP BY data->>'thread_id'
      ) p ON th._id = p.thread_id
      WHERE th.data->>'category_id' = $1
      ORDER BY th._created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const countSql = `SELECT COUNT(*) FROM "${threadTable}" WHERE data->>'category_id' = $1`;
    const [data, count] = await Promise.all([
      safeQuery(sql, [categoryId, parseInt(limit), parseInt(skip)]),
      safeQuery(countSql, [categoryId]),
    ]);
    const threads = data.rows.map(row => ({
      ...formatRecord(row),
      replyCount: parseInt(row.reply_count) || 0,
    }));
    return res.json({ threads, totalCount: parseInt(count.rows[0]?.count) || 0 });
  } catch (err) { return handleError(res, 'list-threads', err); }
});

// ── GET /forums/thread/:threadId ── Thread with its posts
router.get('/forums/thread/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const threadTable = getTableName('forumThreads');
    const postTable = getTableName('forumPosts');
    const [threadResult, postsResult] = await Promise.all([
      safeQuery(`SELECT * FROM "${threadTable}" WHERE _id = $1`, [threadId]),
      safeQuery(`SELECT * FROM "${postTable}" WHERE data->>'thread_id' = $1 ORDER BY _created_at ASC`, [threadId]),
    ]);
    if (threadResult.rows.length === 0) return res.status(404).json({ error: 'THREAD_NOT_FOUND' });
    return res.json({
      thread: formatRecord(threadResult.rows[0]),
      posts: formatRecords(postsResult.rows),
    });
  } catch (err) { return handleError(res, 'get-thread', err); }
});

// ── POST /forums/:categoryId/thread ── Create new thread + first post
router.post('/forums/:categoryId/thread', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { title, content, authorId } = req.body;
    if (!title || !content || !authorId) return res.status(400).json({ error: 'title, content, and authorId are required' });

    const threadTable = getTableName('forumThreads');
    const postTable = getTableName('forumPosts');
    const threadId = uuidv4();
    const postId = uuidv4();
    const now = new Date().toISOString();

    await safeQuery(
      `INSERT INTO "${threadTable}" (_id, _created_at, _updated_at, data) VALUES ($1, $2, $2, $3)`,
      [threadId, now, JSON.stringify({ title, category_id: categoryId, author_id: authorId, status: 'active' })]
    );
    await safeQuery(
      `INSERT INTO "${postTable}" (_id, _created_at, _updated_at, data) VALUES ($1, $2, $2, $3)`,
      [postId, now, JSON.stringify({ thread_id: threadId, content, author_id: authorId })]
    );

    insertAuditEvent({ actor: authorId, action: 'forum_post_created', target: threadId, data: { category_id: categoryId, title } });

    // Fire-and-forget XP award for forum post (thread creation)
    triggerXP(authorId, 'forum_post').catch(() => {});

    return res.status(201).json({ threadId, postId });
  } catch (err) { return handleError(res, 'create-thread', err); }
});

// ── POST /forums/thread/:threadId/reply ── Add reply to thread
router.post('/forums/thread/:threadId/reply', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content, authorId } = req.body;
    if (!content || !authorId) return res.status(400).json({ error: 'content and authorId are required' });

    const postTable = getTableName('forumPosts');
    const postId = uuidv4();
    const now = new Date().toISOString();

    await safeQuery(
      `INSERT INTO "${postTable}" (_id, _created_at, _updated_at, data) VALUES ($1, $2, $2, $3)`,
      [postId, now, JSON.stringify({ thread_id: threadId, content, author_id: authorId })]
    );

    insertAuditEvent({ actor: authorId, action: 'forum_post_created', target: threadId, data: { postId } });

    // Fire-and-forget XP award for forum reply
    triggerXP(authorId, 'forum_post').catch(() => {});

    return res.status(201).json({ postId });
  } catch (err) { return handleError(res, 'reply-thread', err); }
});

// ── GET /announcements ── List carrier announcements
router.get('/announcements', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const table = getTableName('carrierAnnouncements');
    const result = await safeQuery(`SELECT * FROM "${table}" ORDER BY _created_at DESC LIMIT $1`, [parseInt(limit)]);
    return res.json({ announcements: formatRecords(result.rows) });
  } catch (err) { return handleError(res, 'list-announcements', err); }
});

// ── GET /announcements/:id ── Single announcement with comment count
router.get('/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const annTable = getTableName('carrierAnnouncements');
    const commentTable = getTableName('announcementComments');
    const [annResult, countResult] = await Promise.all([
      safeQuery(`SELECT * FROM "${annTable}" WHERE _id = $1`, [id]),
      safeQuery(`SELECT COUNT(*) FROM "${commentTable}" WHERE data->>'announcement_id' = $1`, [id]),
    ]);
    if (annResult.rows.length === 0) return res.status(404).json({ error: 'ANNOUNCEMENT_NOT_FOUND' });
    return res.json({
      announcement: formatRecord(annResult.rows[0]),
      commentCount: parseInt(countResult.rows[0]?.count) || 0,
    });
  } catch (err) { return handleError(res, 'get-announcement', err); }
});

// ── POST /announcements/:id/read ── Mark announcement as read
router.post('/announcements/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;
    if (!driverId) return res.status(400).json({ error: 'driverId is required' });

    const table = getTableName('announcementReadReceipts');
    const receiptId = uuidv4();
    const now = new Date().toISOString();

    // Upsert: check if already read
    const existing = await safeQuery(
      `SELECT _id FROM "${table}" WHERE data->>'announcement_id' = $1 AND data->>'driver_id' = $2 LIMIT 1`,
      [id, driverId]
    );
    if (existing.rows.length > 0) return res.json({ status: 'already_read', receiptId: existing.rows[0]._id });

    await safeQuery(
      `INSERT INTO "${table}" (_id, _created_at, _updated_at, data) VALUES ($1, $2, $2, $3)`,
      [receiptId, now, JSON.stringify({ announcement_id: id, driver_id: driverId, read_at: now })]
    );
    return res.status(201).json({ status: 'marked_read', receiptId });
  } catch (err) { return handleError(res, 'mark-read', err); }
});

// ── POST /announcements/:id/comment ── Add comment to announcement
router.post('/announcements/:id/comment', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, content } = req.body;
    if (!driverId || !content) return res.status(400).json({ error: 'driverId and content are required' });

    const table = getTableName('announcementComments');
    const commentId = uuidv4();
    const now = new Date().toISOString();

    await safeQuery(
      `INSERT INTO "${table}" (_id, _created_at, _updated_at, data) VALUES ($1, $2, $2, $3)`,
      [commentId, now, JSON.stringify({ announcement_id: id, driver_id: driverId, content })]
    );
    return res.status(201).json({ commentId });
  } catch (err) { return handleError(res, 'add-comment', err); }
});

// ── GET /surveys ── List active surveys
router.get('/surveys', async (req, res) => {
  try {
    const table = getTableName('surveyDefinitions');
    const result = await safeQuery(`SELECT * FROM "${table}" WHERE data->>'status' = 'active' ORDER BY _created_at DESC`);
    return res.json({ surveys: formatRecords(result.rows) });
  } catch (err) { return handleError(res, 'list-surveys', err); }
});

// ── GET /surveys/:id ── Survey details
router.get('/surveys/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const table = getTableName('surveyDefinitions');
    const result = await safeQuery(`SELECT * FROM "${table}" WHERE _id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'SURVEY_NOT_FOUND' });
    return res.json({ survey: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'get-survey', err); }
});

// ── POST /surveys/:id/respond ── Submit survey response
router.post('/surveys/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, answers } = req.body;
    if (!driverId || !answers) return res.status(400).json({ error: 'driverId and answers are required' });

    const table = getTableName('surveyResponses');
    const responseId = uuidv4();
    const now = new Date().toISOString();

    await safeQuery(
      `INSERT INTO "${table}" (_id, _created_at, _updated_at, data) VALUES ($1, $2, $2, $3)`,
      [responseId, now, JSON.stringify({ survey_id: id, driver_id: driverId, answers, submitted_at: now })]
    );

    insertAuditEvent({ actor: driverId, action: 'survey_completed', target: id, data: { responseId } });

    return res.status(201).json({ responseId });
  } catch (err) { return handleError(res, 'submit-survey', err); }
});

export default router;
