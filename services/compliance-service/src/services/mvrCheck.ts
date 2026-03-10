import crypto from 'crypto';
import { query } from '@lmdr/db';
import { enqueueComplianceTask } from '../db/queries';

const TABLE = 'compliance_checks';

export interface MvrCheckResult {
  _id: string;
  driver_id: string;
  check_type: string;
  status: string;
  result: string | null;
  details: Record<string, unknown> | null;
  initiated_at: string;
  completed_at: string | null;
}

/**
 * Trigger an MVR check for a driver. Creates a pending record
 * and enqueues a Cloud Task for async execution.
 */
export async function triggerMvrCheck(driverId: string): Promise<{ checkId: string; status: string }> {
  const checkId = crypto.randomUUID();
  const now = new Date().toISOString();

  await query(
    `INSERT INTO "${TABLE}" (_id, driver_id, check_type, status, result, details, initiated_at, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [checkId, driverId, 'mvr', 'pending', null, null, now, null]
  );

  // Enqueue Cloud Task for async processing
  try {
    await enqueueComplianceTask('mvr', checkId, driverId);
  } catch (err) {
    console.warn('[mvrCheck] Cloud Task enqueue failed, falling back to direct execution:', (err as Error).message);
    // Fall back to direct execution if Cloud Tasks unavailable
    setImmediate(() => {
      executeMvrCheck(checkId, driverId).catch(e =>
        console.error('[mvrCheck] Direct execution failed:', (e as Error).message)
      );
    });
  }

  return { checkId, status: 'pending' };
}

/**
 * Execute the MVR check. Called by Cloud Task callback or fallback.
 * Placeholder: simulates a check and sets status to 'clear'.
 */
export async function executeMvrCheck(checkId: string, driverId: string): Promise<void> {
  const _apiKey = process.env.MVR_API_KEY;

  try {
    // Update status to 'in_progress'
    await query(
      `UPDATE "${TABLE}" SET status = $1 WHERE _id = $2`,
      ['in_progress', checkId]
    );

    // --- Placeholder: Real MVR API integration comes later ---
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const now = new Date().toISOString();
    const details = {
      provider: 'placeholder',
      driverId,
      violations: 0,
      points: 0,
      suspensions: 0,
      checkedAt: now,
    };

    // Set result to 'clear'
    await query(
      `UPDATE "${TABLE}" SET status = $1, result = $2, details = $3, completed_at = $4 WHERE _id = $5`,
      ['completed', 'clear', JSON.stringify(details), now, checkId]
    );

    console.log(`[mvrCheck] Check ${checkId} for driver ${driverId} completed: clear`);
  } catch (err) {
    const now = new Date().toISOString();
    await query(
      `UPDATE "${TABLE}" SET status = $1, result = $2, details = $3, completed_at = $4 WHERE _id = $5`,
      ['failed', 'error', JSON.stringify({ error: (err as Error).message }), now, checkId]
    ).catch(e => console.error('[mvrCheck] Failed to update error status:', (e as Error).message));

    throw err;
  }
}

/**
 * Get the result of an MVR check by checkId.
 */
export async function getMvrCheckResult(checkId: string): Promise<MvrCheckResult | null> {
  const result = await query(
    `SELECT _id, driver_id, check_type, status, result, details, initiated_at, completed_at
     FROM "${TABLE}" WHERE _id = $1 AND check_type = 'mvr' LIMIT 1`,
    [checkId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    ...row,
    details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
  };
}
