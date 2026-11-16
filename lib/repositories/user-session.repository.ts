import { insertRow, many, one, run } from "./_shared";
export interface UserSession {
  id: string; user_id: string; refresh_token_hash: string;
  expires_at: string | Date; revoked_at: string | Date | null; created_at: string | Date;
}
export function createUserSession(input: Pick<UserSession, "user_id" | "refresh_token_hash" | "expires_at">) {
  return insertRow<UserSession>("user_sessions", input, ["user_id","refresh_token_hash","expires_at"]);
}
export function findValidSession(refreshTokenHash: string) {
  return one<UserSession>(
    `SELECT * FROM user_sessions
     WHERE refresh_token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()
     LIMIT 1`, [refreshTokenHash],
  );
}
export function listActiveSessionsForUser(userId: string) {
  return many<UserSession>(
    "SELECT * FROM user_sessions WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW() ORDER BY created_at DESC",
    [userId],
  );
}
export function revokeSession(id: string) {
  return one<UserSession>("UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL RETURNING *", [id]);
}
export function revokeAllUserSessions(userId: string) {
  return run("UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL", [userId]);
}
export function deleteExpiredSessions() {
  return run("DELETE FROM user_sessions WHERE expires_at <= NOW()");
}
