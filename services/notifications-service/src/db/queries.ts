/**
 * SQL query helpers for the notifications service.
 * All queries use the JSONB `data` column pattern from @lmdr/db.
 */

export function insertNotification(table: string): string {
  return `INSERT INTO "${table}" (_id, data) VALUES ($1, $2::jsonb)`;
}

export function selectNotificationHistory(table: string): string {
  return `
    SELECT _id, data
    FROM "${table}"
    WHERE data->>'recipientId' = $1
    ORDER BY data->>'createdAt' DESC
    LIMIT $2
  `;
}

export function updateNotificationRead(table: string): string {
  return `
    UPDATE "${table}"
    SET data = jsonb_set(data, '{read}', 'true')
    WHERE _id = $1
    RETURNING _id, data
  `;
}
