import crypto from 'crypto';
import { query } from '@lmdr/db';
import { enqueueComplianceTask } from '../db/queries';

const TABLE = 'compliance_checks';

export interface BackgroundCheckResult {
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
 * Trigger a background check for a driver. Creates a pending record
 * and enqueues a Cloud Task for async execution.
 */
export async function triggerBackgroundCheck(driverId: string): Promise<{ checkId: string; status: string }> {
  const checkId = crypto.randomUUID();
  const now = new Date().toISOString();

  await query(
    `INSERT INTO "${TABLE}" (_id, driver_id, check_type, status, result, details, initiated_at, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [checkId, driverId, 'background', 'pending', null, null, now, null]
  );

  // Enqueue Cloud Task for async processing
  try {
    await enqueueComplianceTask('background', checkId, driverId);
  } catch (err) {
    console.warn('[backgroundCheck] Cloud Task enqueue failed, falling back to direct execution:', (err as Error).message);
    setImmediate(() => {
      executeBackgroundCheck(checkId, driverId).catch(e =>
        console.error('[backgroundCheck] Direct execution failed:', (e as Error).message)
      );
    });
  }

  return { checkId, status: 'pending' };
}

/**
 * Execute the background check. Called by Cloud Task callback or fallback.
 * Placeholder: simulates a check and sets status to 'clear'.
 */
export async function executeBackgroundCheck(checkId: string, driverId: string): Promise<void> {
  const _apiKey = process.env.BGCHECK_API_KEY;

  try {
    await query(
      `UPDATE "${TABLE}" SET status = $1 WHERE _id = $2`,
      ['in_progress', checkId]
    );

    // --- Placeholder: Real background check API integration comes later ---
    await new Promise(resolve => setTimeout(resolve, 500));

    const now = new Date().toISOString();
    const details = {
      provider: 'placeholder',
      driverId,
      criminalRecords: 0,
      sexOffenderRegistry: false,
      globalWatchlist: false,
      drugTest: 'negative',
      checkedAt: now,
    };

    await query(
      `UPDATE "${TABLE}" SET status = $1, result = $2, details = $3, completed_at = $4 WHERE _id = $5`,
      ['completed', 'clear', JSON.stringify(details), now, checkId]
    );

    console.log(`[backgroundCheck] Check ${checkId} for driver ${driverId} completed: clear`);
  } catch (err) {
    const now = new Date().toISOString();
    await query(
      `UPDATE "${TABLE}" SET status = $1, result = $2, details = $3, completed_at = $4 WHERE _id = $5`,
      ['failed', 'error', JSON.stringify({ error: (err as Error).message }), now, checkId]
    ).catch(e => console.error('[backgroundCheck] Failed to update error status:', (e as Error).message));

    throw err;
  }
}

/**
 * Get the result of a background check by checkId.
 */
export async function getBackgroundCheckResult(checkId: string): Promise<BackgroundCheckResult | null> {
  const result = await query(
    `SELECT _id, driver_id, check_type, status, result, details, initiated_at, completed_at
     FROM "${TABLE}" WHERE _id = $1 AND check_type = 'background' LIMIT 1`,
    [checkId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    ...row,
    details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
  };
}
