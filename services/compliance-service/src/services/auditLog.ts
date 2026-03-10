import crypto from 'crypto';
import { query } from '@lmdr/db';

const TABLE = 'audit_events';

export interface AuditEvent {
  _id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditEventInput {
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export interface AuditQueryFilters {
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

/**
 * Log a new audit event.
 */
export async function logAuditEvent(input: AuditEventInput): Promise<AuditEvent> {
  const _id = crypto.randomUUID();
  const now = new Date().toISOString();

  const result = await query(
    `INSERT INTO "${TABLE}" (_id, actor_id, actor_role, action, resource_type, resource_id, before_state, after_state, ip_address, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      _id,
      input.actorId,
      input.actorRole,
      input.action,
      input.resourceType,
      input.resourceId,
      input.beforeState ? JSON.stringify(input.beforeState) : null,
      input.afterState ? JSON.stringify(input.afterState) : null,
      input.ipAddress || null,
      now,
    ]
  );

  return parseAuditRow(result.rows[0]);
}

/**
 * Query audit events with optional filters.
 */
export async function queryAuditEvents(filters: AuditQueryFilters): Promise<AuditEvent[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.actorId) {
    conditions.push(`actor_id = $${paramIndex++}`);
    params.push(filters.actorId);
  }
  if (filters.resourceType) {
    conditions.push(`resource_type = $${paramIndex++}`);
    params.push(filters.resourceType);
  }
  if (filters.resourceId) {
    conditions.push(`resource_id = $${paramIndex++}`);
    params.push(filters.resourceId);
  }
  if (filters.from) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(filters.to);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  const result = await query(
    `SELECT * FROM "${TABLE}" ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );

  return result.rows.map(parseAuditRow);
}

/**
 * Get a single audit event by ID.
 */
export async function getAuditEvent(id: string): Promise<AuditEvent | null> {
  const result = await query(
    `SELECT * FROM "${TABLE}" WHERE _id = $1 LIMIT 1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  return parseAuditRow(result.rows[0]);
}

function parseAuditRow(row: Record<string, unknown>): AuditEvent {
  return {
    _id: row._id as string,
    actor_id: row.actor_id as string,
    actor_role: row.actor_role as string,
    action: row.action as string,
    resource_type: row.resource_type as string,
    resource_id: row.resource_id as string,
    before_state: typeof row.before_state === 'string'
      ? JSON.parse(row.before_state)
      : (row.before_state as Record<string, unknown> | null),
    after_state: typeof row.after_state === 'string'
      ? JSON.parse(row.after_state)
      : (row.after_state as Record<string, unknown> | null),
    ip_address: row.ip_address as string | null,
    created_at: row.created_at as string,
  };
}
