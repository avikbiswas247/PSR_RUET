import { insertRow, one, run } from "./_shared";
export interface PasswordResetToken {
  id: string; user_id: string; token_hash: string;
  expires_at: string | Date; used_at: string | Date | null; created_at: string | Date;
}
export function createPasswordResetToken(input: Pick<PasswordResetToken, "user_id" | "token_hash" | "expires_at">) {
  return insertRow<PasswordResetToken>("password_reset_tokens", input, ["user_id","token_hash","expires_at"]);
}
export function findValidPasswordResetToken(tokenHash: string) {
  return one<PasswordResetToken>(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
     LIMIT 1`, [tokenHash],
  );
}
export function markPasswordResetTokenUsed(id: string) {
  return one<PasswordResetToken>(
    "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1 AND used_at IS NULL RETURNING *", [id],
  );
}
export function deleteExpiredPasswordResetTokens() {
  return run("DELETE FROM password_reset_tokens WHERE expires_at <= NOW() OR used_at IS NOT NULL");
}
