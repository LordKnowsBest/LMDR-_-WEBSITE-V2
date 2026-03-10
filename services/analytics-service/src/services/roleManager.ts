import { query } from '@lmdr/db';

export interface RoleAssignment {
  uid: string;
  role: string;
  carrierId: string | null;
  driverId: string | null;
  grantedBy: string;
  grantedAt: string;
}

/** Ensure the user_roles table exists */
async function ensureTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS user_roles (
      uid TEXT NOT NULL,
      role TEXT NOT NULL,
      carrier_id TEXT,
      driver_id TEXT,
      granted_by TEXT NOT NULL,
      granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (uid, role)
    )
  `);
}

function rowToAssignment(row: Record<string, unknown>): RoleAssignment {
  return {
    uid: row.uid as string,
    role: row.role as string,
    carrierId: (row.carrier_id as string) || null,
    driverId: (row.driver_id as string) || null,
    grantedBy: row.granted_by as string,
    grantedAt: (row.granted_at as Date).toISOString(),
  };
}

export async function getUserRoles(uid: string): Promise<RoleAssignment[]> {
  await ensureTable();
  const result = await query(
    'SELECT uid, role, carrier_id, driver_id, granted_by, granted_at FROM user_roles WHERE uid = $1 ORDER BY granted_at DESC',
    [uid]
  );
  return result.rows.map(rowToAssignment);
}

export async function assignRole(
  uid: string,
  role: string,
  carrierId?: string,
  driverId?: string,
  grantedBy?: string
): Promise<RoleAssignment> {
  await ensureTable();
  const result = await query(
    `INSERT INTO user_roles (uid, role, carrier_id, driver_id, granted_by, granted_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (uid, role) DO UPDATE SET
       carrier_id = EXCLUDED.carrier_id,
       driver_id = EXCLUDED.driver_id,
       granted_by = EXCLUDED.granted_by,
       granted_at = NOW()
     RETURNING uid, role, carrier_id, driver_id, granted_by, granted_at`,
    [uid, role, carrierId || null, driverId || null, grantedBy || 'system']
  );
  return rowToAssignment(result.rows[0]);
}

export async function removeRole(uid: string, role: string): Promise<boolean> {
  await ensureTable();
  const result = await query(
    'DELETE FROM user_roles WHERE uid = $1 AND role = $2 RETURNING uid',
    [uid, role]
  );
  return result.rows.length > 0;
}

export async function listAllRoles(): Promise<RoleAssignment[]> {
  await ensureTable();
  const result = await query(
    'SELECT uid, role, carrier_id, driver_id, granted_by, granted_at FROM user_roles ORDER BY granted_at DESC'
  );
  return result.rows.map(rowToAssignment);
}
