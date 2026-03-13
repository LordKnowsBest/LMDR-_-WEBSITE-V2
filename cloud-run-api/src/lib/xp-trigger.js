/**
 * Lightweight fire-and-forget XP award helper.
 * Import from any route to award XP server-side without blocking the response.
 *
 * Usage:
 *   triggerXP(driverId, 'upload_document').catch(() => {});
 */

import { query } from '../db/pool.js';
import { getTableName } from '../db/schema.js';
import { insertLog } from '../db/bigquery.js';
import { v4 as uuidv4 } from 'uuid';

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

function computeLevel(totalXp) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalXp >= lvl.minXP) current = lvl;
    else break;
  }
  return current;
}

function streakMultiplier(streakDays) {
  return Math.min(1.0 + (streakDays * 0.1), 2.5);
}

async function safeQuery(sql, params) {
  try { return await query(sql, params); }
  catch (err) { if (err.message?.includes('does not exist')) return { rows: [] }; throw err; }
}

/**
 * Award XP to a driver for a given action.
 * This function catches ALL errors internally -- it will never throw.
 * @param {string} driverId
 * @param {string} action - Must be a key from XP_ACTIONS
 */
export async function triggerXP(driverId, action) {
  try {
    if (!driverId || !action || !XP_ACTIONS[action]) return;

    const baseXp = XP_ACTIONS[action];
    const table = getTableName('driverProgression');
    const eventsTable = getTableName('gamificationEvents');

    // Get or create progression record
    let result = await safeQuery(`SELECT * FROM "${table}" WHERE _id = $1`, [driverId]);
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
        [JSON.stringify({ total_xp: totalXp, level: level.level, level_name: level.name }), driverId]
      );
    } else {
      await query(
        `INSERT INTO "${table}" (_id, _created_at, _updated_at, data)
         VALUES ($1, NOW(), NOW(), $2::jsonb)`,
        [driverId, JSON.stringify({ driver_id: driverId, total_xp: totalXp, level: level.level, level_name: level.name, streak_days: 0, freezes_available: 1 })]
      );
    }

    // Record gamification event
    const eventId = uuidv4();
    await safeQuery(
      `INSERT INTO "${eventsTable}" (_id, _created_at, _updated_at, data)
       VALUES ($1, NOW(), NOW(), $2::jsonb)`,
      [eventId, JSON.stringify({ driver_id: driverId, action, xp_awarded: xpAwarded, multiplier, type: 'xp_award', created_at: now })]
    );

    insertLog({ service: 'driver', level: 'INFO', message: `XP triggered: ${action}`, data: { driverId, action, xpAwarded, totalXp, level: level.level } });
  } catch (err) {
    // Never let XP failure propagate -- log and swallow
    console.error(`[xp-trigger] Failed to award XP (${action}) for driver ${driverId}:`, err.message);
  }
}
