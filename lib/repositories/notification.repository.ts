import { byId, insertRow, many, one, run, updateRow } from "./_shared";
export interface Notification {
  id: string; user_id: string; title: string; message: string;
  notification_type: string | null; is_read: boolean;
  read_at: string | Date | null; link_url: string | null; created_at: string | Date;
}
const TABLE = "notifications";
const CREATE_COLUMNS = ["user_id","title","message","notification_type","is_read","read_at","link_url"] as const;
const UPDATE_COLUMNS = ["title","message","notification_type","is_read","read_at","link_url"] as const;
export function getNotificationById(id: string) { return byId<Notification>(TABLE, id); }
export function listNotificationsForUser(userId: string, limit = 30, offset = 0) {
  return many<Notification>("SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3", [userId, limit, offset]);
}
export function listUnreadNotifications(userId: string, limit = 30) {
  return many<Notification>("SELECT * FROM notifications WHERE user_id = $1 AND is_read = FALSE ORDER BY created_at DESC LIMIT $2", [userId, limit]);
}
export async function countUnreadNotifications(userId: string) {
  const result = await one<{ count: number }>("SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE", [userId]);
  return result?.count ?? 0;
}
export function createNotification(input: Pick<Notification, "user_id" | "title" | "message" | "notification_type" | "is_read" | "read_at" | "link_url">) {
  return insertRow<Notification>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}
export function markNotificationRead(id: string) {
  return updateRow<Notification>(TABLE, id, { is_read: true, read_at: new Date() }, UPDATE_COLUMNS);
}
export function markAllNotificationsRead(userId: string) {
  return run("UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = $1 AND is_read = FALSE", [userId]);
}
export function deleteNotification(id: string) { return run("DELETE FROM notifications WHERE id = $1", [id]); }
