import { query } from '@lmdr/db';

const TABLE = 'compliance_checks';

export interface ComplianceStatus {
  driverId: string;
  overallStatus: 'clear' | 'pending' | 'failed' | 'expired' | 'none';
  mvrCheck: CheckSummary | null;
  backgroundCheck: CheckSummary | null;
  lastUpdated: string | null;
}

export interface CheckSummary {
  checkId: string;
  status: string;
  result: string | null;
  initiatedAt: string;
  completedAt: string | null;
}

/**
 * Aggregates latest MVR + background check results into a single ComplianceStatus.
 */
export async function getDriverComplianceStatus(driverId: string): Promise<ComplianceStatus> {
  // Get the latest MVR check
  const mvrResult = await query(
    `SELECT _id, status, result, initiated_at, completed_at
     FROM "${TABLE}"
     WHERE driver_id = $1 AND check_type = 'mvr'
     ORDER BY initiated_at DESC LIMIT 1`,
    [driverId]
  );

  // Get the latest background check
  const bgResult = await query(
    `SELECT _id, status, result, initiated_at, completed_at
     FROM "${TABLE}"
     WHERE driver_id = $1 AND check_type = 'background'
     ORDER BY initiated_at DESC LIMIT 1`,
    [driverId]
  );

  const mvrCheck: CheckSummary | null = mvrResult.rows.length > 0
    ? {
        checkId: mvrResult.rows[0]._id,
        status: mvrResult.rows[0].status,
        result: mvrResult.rows[0].result,
        initiatedAt: mvrResult.rows[0].initiated_at,
        completedAt: mvrResult.rows[0].completed_at,
      }
    : null;

  const bgCheck: CheckSummary | null = bgResult.rows.length > 0
    ? {
        checkId: bgResult.rows[0]._id,
        status: bgResult.rows[0].status,
        result: bgResult.rows[0].result,
        initiatedAt: bgResult.rows[0].initiated_at,
        completedAt: bgResult.rows[0].completed_at,
      }
    : null;

  const overallStatus = computeOverallStatus(mvrCheck, bgCheck);

  const timestamps = [mvrCheck?.completedAt, mvrCheck?.initiatedAt, bgCheck?.completedAt, bgCheck?.initiatedAt]
    .filter(Boolean) as string[];
  const lastUpdated = timestamps.length > 0
    ? timestamps.sort().reverse()[0]
    : null;

  return {
    driverId,
    overallStatus,
    mvrCheck,
    backgroundCheck: bgCheck,
    lastUpdated,
  };
}

function computeOverallStatus(
  mvr: CheckSummary | null,
  bg: CheckSummary | null
): ComplianceStatus['overallStatus'] {
  // No checks at all
  if (!mvr && !bg) return 'none';

  const checks = [mvr, bg].filter(Boolean) as CheckSummary[];

  // Any failed check means overall failed
  if (checks.some(c => c.result === 'error' || c.status === 'failed')) return 'failed';

  // Any pending/in-progress check means overall pending
  if (checks.some(c => c.status === 'pending' || c.status === 'in_progress')) return 'pending';

  // All completed and clear
  if (checks.every(c => c.status === 'completed' && c.result === 'clear')) return 'clear';

  return 'pending';
}
