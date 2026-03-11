import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { insertLog } from '../../db/bigquery.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ── XP System Constants ──

const XP_ACTIONS = {
  update_profile: 10,
  upload_document: 15,
  first_application: 25,
  daily_login: 5,
  complete_survey: 25,
  forum_post: 10,
  referral_signup: 200,
  referral_hire: 500,
  first_dispatch: 50,
};

const LEVELS = [
  { level: 1, name: 'Rookie', minXP: 0 },
  { level: 2, name: 'Road Ready', minXP: 100 },
  { level: 3, name: 'Mile Maker', minXP: 300 },
  { level: 4, name: 'Highway Hero', minXP: 600 },
  { level: 5, name: 'Road Warrior', minXP: 1000 },
  { level: 6, name: 'Fleet Legend', minXP: 2000 },
];

// ── Helpers ──

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
  console.error(`[driver/gamification] ${context}:`, err.message);
  insertLog({ service: 'driver', level: 'ERROR', message: `gamification/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

/** Compute level from total XP */
function computeLevel(totalXp) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalXp >= lvl.minXP) current = lvl;
    else break;
  }
  const nextLevel = LEVELS.find(l => l.level === current.level + 1) || null;
  return { ...current, nextLevel };
}

/** Streak multiplier: 1.0 + (days * 0.1), capped at 2.5 */
function streakMultiplier(streakDays) {
  return Math.min(1.0 + (streakDays * 0.1), 2.5);
}

// ── 1. GET /:id/progression ──
router.get('/:id/progression', async (req, res) => {
  try {
    const table = getTableName('driverProgression');
    const result = await safeQuery(`SELECT * FROM "${table}" WHERE _id = $1`, [req.params.id]);

    if (result.rows.length === 0) {
      // Return default progression for new driver
      const level = computeLevel(0);
      return res.json({
        driverId: req.params.id,
        totalXp: 0,
        level: level.level,
        levelName: level.name,
        nextLevel: level.nextLevel,
        streakDays: 0,
        multiplier: 1.0,
      });
    }

    const record = formatRecord(result.rows[0]);
    const totalXp = Number(record.total_xp || 0);
    const streakDays = Number(record.streak_days || 0);
    const level = computeLevel(totalXp);
    const multiplier = streakMultiplier(streakDays);

    return res.json({
      driverId: req.params.id,
      totalXp,
      level: level.level,
      levelName: level.name,
      nextLevel: level.nextLevel,
      streakDays,
      multiplier,
      lastCheckIn: record.last_check_in || null,
      freezesAvailable: Number(record.freezes_available || 0),
    });
  } catch (err) {
    return handleError(res, 'getProgression', err);
  }
});

// ── 2. POST /:id/xp ──
router.post('/:id/xp', async (req, res) => {
  try {
    const { action } = req.body;
    if (!action || !XP_ACTIONS[action]) {
      return res.status(400).json({ error: 'INVALID_ACTION', validActions: Object.keys(XP_ACTIONS) });
    }

    const baseXp = XP_ACTIONS[action];
    const table = getTableName('driverProgression');
    const eventsTable = getTableName('gamificationEvents');

    // Get or create progression record
    let result = await safeQuery(`SELECT * FROM "${table}" WHERE _id = $1`, [req.params.id]);
    let totalXp = 0;
    let streakDays = 0;

    if (result.rows.length > 0) {
      const data = result.rows[0].data || {};
      totalXp = Number(data.total_xp || 0);
      streakDays = Number(data.streak_days || 0);
    }

    const multiplier = streakMultiplier(streakDays);
    const xpAwarded = Math.round(baseXp * multiplier);
    totalXp += xpAwarded;
    const level = computeLevel(totalXp);
    const now = new Date().toISOString();

    // Upsert progression
    if (result.rows.length > 0) {
      await query(
        `UPDATE "${table}" SET data = data || $1::jsonb, _updated_at = NOW() WHERE _id = $2`,
        [JSON.stringify({ total_xp: totalXp, level: level.level, level_name: level.name }), req.params.id]
      );
    } else {
      await query(
        `INSERT INTO "${table}" (_id, _created_at, _updated_at, data)
         VALUES ($1, NOW(), NOW(), $2::jsonb)`,
        [req.params.id, JSON.stringify({ driver_id: req.params.id, total_xp: totalXp, level: level.level, level_name: level.name, streak_days: 0, freezes_available: 1 })]
      );
    }

    // Record gamification event
    const eventId = uuidv4();
    await safeQuery(
      `INSERT INTO "${eventsTable}" (_id, _created_at, _updated_at, data)
       VALUES ($1, NOW(), NOW(), $2::jsonb)`,
      [eventId, JSON.stringify({ driver_id: req.params.id, action, xp_awarded: xpAwarded, multiplier, type: 'xp_award', created_at: now })]
    );

    insertLog({ service: 'driver', level: 'INFO', message: `XP awarded: ${action}`, data: { driverId: req.params.id, action, xpAwarded, totalXp, level: level.level } });

    return res.json({ xpAwarded, totalXp, level: level.level, levelName: level.name, multiplier });
  } catch (err) {
    return handleError(res, 'awardXp', err);
  }
});

// ── 3. GET /:id/achievements ──
router.get('/:id/achievements', async (req, res) => {
  try {
    const defsTable = getTableName('achievementDefinitions');
    const earnedTable = getTableName('driverAchievements');

    const [defs, earned] = await Promise.all([
      safeQuery(`SELECT * FROM "${defsTable}" ORDER BY _created_at ASC`),
      safeQuery(`SELECT * FROM "${earnedTable}" WHERE data->>'driver_id' = $1`, [req.params.id]),
    ]);

    const earnedMap = new Map();
    for (const row of earned.rows) {
      const rec = formatRecord(row);
      earnedMap.set(rec.achievement_id, rec);
    }

    const achievements = formatRecords(defs.rows).map(def => ({
      ...def,
      earned: earnedMap.has(def._id),
      earnedAt: earnedMap.get(def._id)?.earned_at || null,
      claimed: earnedMap.get(def._id)?.claimed || false,
      progress: earnedMap.get(def._id)?.progress || 0,
    }));

    return res.json({ driverId: req.params.id, achievements });
  } catch (err) {
    return handleError(res, 'getAchievements', err);
  }
});

// ── 4. POST /:id/achievement/:achievementId/claim ──
router.post('/:id/achievement/:achievementId/claim', async (req, res) => {
  try {
    const earnedTable = getTableName('driverAchievements');
    const defsTable = getTableName('achievementDefinitions');

    // Check achievement exists and is earned
    const earnedResult = await safeQuery(
      `SELECT * FROM "${earnedTable}" WHERE data->>'driver_id' = $1 AND data->>'achievement_id' = $2`,
      [req.params.id, req.params.achievementId]
    );

    if (earnedResult.rows.length === 0) {
      return res.status(404).json({ error: 'ACHIEVEMENT_NOT_EARNED' });
    }

    const earned = formatRecord(earnedResult.rows[0]);
    if (earned.claimed) {
      return res.status(400).json({ error: 'ALREADY_CLAIMED' });
    }

    // Mark as claimed
    await query(
      `UPDATE "${earnedTable}" SET data = data || '{"claimed": true}'::jsonb, _updated_at = NOW() WHERE _id = $1`,
      [earnedResult.rows[0]._id]
    );

    // Award XP if defined on achievement
    const defResult = await safeQuery(`SELECT * FROM "${defsTable}" WHERE _id = $1`, [req.params.achievementId]);
    let xpAwarded = 0;
    if (defResult.rows.length > 0) {
      const def = formatRecord(defResult.rows[0]);
      xpAwarded = Number(def.xp_reward || 0);
      if (xpAwarded > 0) {
        const progTable = getTableName('driverProgression');
        await safeQuery(
          `UPDATE "${progTable}" SET data = jsonb_set(data, '{total_xp}', to_jsonb((COALESCE((data->>'total_xp')::int, 0) + $1)::int)), _updated_at = NOW() WHERE _id = $2`,
          [xpAwarded, req.params.id]
        );
      }
    }

    return res.json({ claimed: true, achievementId: req.params.achievementId, xpAwarded });
  } catch (err) {
    return handleError(res, 'claimAchievement', err);
  }
});

// ── 5. GET /:id/streak ──
router.get('/:id/streak', async (req, res) => {
  try {
    const table = getTableName('driverProgression');
    const result = await safeQuery(`SELECT * FROM "${table}" WHERE _id = $1`, [req.params.id]);

    if (result.rows.length === 0) {
      return res.json({ currentDays: 0, freezeAvailable: false, freezesRemaining: 0, nextMilestone: 7, multiplier: 1.0 });
    }

    const record = formatRecord(result.rows[0]);
    const currentDays = Number(record.streak_days || 0);
    const freezesRemaining = Number(record.freezes_available || 0);
    const multiplier = streakMultiplier(currentDays);
    const nextMilestone = Math.ceil((currentDays + 1) / 7) * 7;

    return res.json({
      currentDays,
      freezeAvailable: freezesRemaining > 0,
      freezesRemaining,
      nextMilestone,
      multiplier,
      lastCheckIn: record.last_check_in || null,
    });
  } catch (err) {
    return handleError(res, 'getStreak', err);
  }
});

// ── 6. POST /:id/streak/check-in ──
router.post('/:id/streak/check-in', async (req, res) => {
  try {
    const table = getTableName('driverProgression');
    const eventsTable = getTableName('gamificationEvents');
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    let result = await safeQuery(`SELECT * FROM "${table}" WHERE _id = $1`, [req.params.id]);
    let streakDays = 0;
    let freezesAvailable = 1;
    let streakReset = false;

    if (result.rows.length > 0) {
      const data = result.rows[0].data || {};
      const lastCheckIn = data.last_check_in;
      streakDays = Number(data.streak_days || 0);
      freezesAvailable = Number(data.freezes_available || 1);

      if (lastCheckIn === todayStr) {
        // Already checked in today
        return res.json({ streakDays, multiplier: streakMultiplier(streakDays), alreadyCheckedIn: true });
      }

      const lastDate = lastCheckIn ? new Date(lastCheckIn) : null;
      const diffDays = lastDate ? Math.floor((now - lastDate) / (1000 * 60 * 60 * 24)) : 999;

      if (diffDays === 1) {
        // Consecutive day
        streakDays += 1;
      } else if (diffDays === 2 && data.streak_frozen) {
        // Was frozen yesterday, continue streak
        streakDays += 1;
      } else if (diffDays > 1) {
        // Gap > 1 day — reset streak
        streakDays = 1;
        streakReset = true;
      }

      await query(
        `UPDATE "${table}" SET data = data || $1::jsonb, _updated_at = NOW() WHERE _id = $2`,
        [JSON.stringify({ streak_days: streakDays, last_check_in: todayStr, streak_frozen: false }), req.params.id]
      );
    } else {
      // First check-in ever
      streakDays = 1;
      await query(
        `INSERT INTO "${table}" (_id, _created_at, _updated_at, data)
         VALUES ($1, NOW(), NOW(), $2::jsonb)`,
        [req.params.id, JSON.stringify({ driver_id: req.params.id, total_xp: 0, level: 1, level_name: 'Rookie', streak_days: 1, last_check_in: todayStr, freezes_available: 1 })]
      );
    }

    // Award daily_login XP
    const multiplier = streakMultiplier(streakDays);
    const xpAwarded = Math.round(XP_ACTIONS.daily_login * multiplier);

    if (result.rows.length > 0) {
      await safeQuery(
        `UPDATE "${table}" SET data = jsonb_set(data, '{total_xp}', to_jsonb((COALESCE((data->>'total_xp')::int, 0) + $1)::int)), _updated_at = NOW() WHERE _id = $2`,
        [xpAwarded, req.params.id]
      );
    }

    // Record event
    const eventId = uuidv4();
    await safeQuery(
      `INSERT INTO "${eventsTable}" (_id, _created_at, _updated_at, data)
       VALUES ($1, NOW(), NOW(), $2::jsonb)`,
      [eventId, JSON.stringify({ driver_id: req.params.id, action: 'daily_login', xp_awarded: xpAwarded, multiplier, type: 'xp_award', created_at: now.toISOString() })]
    );

    return res.json({ streakDays, multiplier, xpAwarded, streakReset, alreadyCheckedIn: false });
  } catch (err) {
    return handleError(res, 'streakCheckIn', err);
  }
});

// ── 7. POST /:id/streak/freeze ──
router.post('/:id/streak/freeze', async (req, res) => {
  try {
    const table = getTableName('driverProgression');
    const result = await safeQuery(`SELECT * FROM "${table}" WHERE _id = $1`, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'NO_PROGRESSION_RECORD' });
    }

    const data = result.rows[0].data || {};
    const freezesAvailable = Number(data.freezes_available || 0);

    if (freezesAvailable <= 0) {
      return res.status(400).json({ error: 'NO_FREEZES_AVAILABLE' });
    }

    await query(
      `UPDATE "${table}" SET data = data || $1::jsonb, _updated_at = NOW() WHERE _id = $2`,
      [JSON.stringify({ freezes_available: freezesAvailable - 1, streak_frozen: true }), req.params.id]
    );

    return res.json({ frozen: true, freezesRemaining: freezesAvailable - 1 });
  } catch (err) {
    return handleError(res, 'streakFreeze', err);
  }
});

// ── 8. GET /leaderboard ──
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const table = getTableName('driverProgression');

    const result = await safeQuery(
      `SELECT * FROM "${table}" ORDER BY (COALESCE((data->>'total_xp')::int, 0)) DESC LIMIT $1`,
      [limit]
    );

    const leaderboard = formatRecords(result.rows).map((rec, idx) => ({
      rank: idx + 1,
      driverId: rec._id,
      driverName: rec.driver_name || rec.name || 'Anonymous',
      totalXp: Number(rec.total_xp || 0),
      level: computeLevel(Number(rec.total_xp || 0)).level,
      levelName: computeLevel(Number(rec.total_xp || 0)).name,
      streakDays: Number(rec.streak_days || 0),
    }));

    return res.json({ leaderboard, total: leaderboard.length });
  } catch (err) {
    return handleError(res, 'leaderboard', err);
  }
});

// ── 9. GET /events/active ──
router.get('/events/active', async (req, res) => {
  try {
    const table = getTableName('seasonalEvents');
    const result = await safeQuery(
      `SELECT * FROM "${table}"
       WHERE (data->>'start_date')::date <= CURRENT_DATE
         AND (data->>'end_date')::date >= CURRENT_DATE
       ORDER BY (data->>'end_date') ASC`
    );

    return res.json({ events: formatRecords(result.rows) });
  } catch (err) {
    return handleError(res, 'activeEvents', err);
  }
});

// ── 10. GET /:id/challenges ──
router.get('/:id/challenges', async (req, res) => {
  try {
    const table = getTableName('gamificationEvents');
    const result = await safeQuery(
      `SELECT * FROM "${table}"
       WHERE data->>'driver_id' = $1 AND data->>'type' = 'challenge'
       ORDER BY _created_at DESC`,
      [req.params.id]
    );

    return res.json({ driverId: req.params.id, challenges: formatRecords(result.rows) });
  } catch (err) {
    return handleError(res, 'getChallenges', err);
  }
});

export default router;
