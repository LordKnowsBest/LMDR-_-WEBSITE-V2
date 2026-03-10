import crypto from 'crypto';
import { query, getTableName } from '@lmdr/db';
import { insertNotification, selectNotificationHistory, updateNotificationRead } from '../db/queries';

const TABLE = getTableName('memberNotifications');

export async function logNotification(
  recipientId: string,
  channel: string,
  subject: string,
  status: string
) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await query(insertNotification(TABLE), [
    id,
    JSON.stringify({
      recipientId,
      channel,
      subject,
      status,
      read: false,
      createdAt: now,
    }),
  ]);

  return { id, recipientId, channel, subject, status };
}

export async function getNotificationHistory(recipientId: string, limit = 50) {
  const result = await query(selectNotificationHistory(TABLE), [recipientId, limit]);
  return result.rows.map((r: { _id: string; data: Record<string, unknown> }) => ({
    _id: r._id,
    ...(r.data as Record<string, unknown>),
  }));
}

export async function markAsRead(notificationId: string) {
  const result = await query(updateNotificationRead(TABLE), [notificationId]);
  if (result.rowCount === 0) return null;
  const row = result.rows[0] as { _id: string; data: Record<string, unknown> };
  return { _id: row._id, ...(row.data as Record<string, unknown>) };
}
