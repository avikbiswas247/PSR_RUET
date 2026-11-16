import { insertRow, one, run, updateRow } from "./_shared";

export interface OtpCode {
  id: string;
  user_id: string;
  purpose: string;
  code_hash: string;
  expires_at: string | Date;
  attempts: number;
  max_attempts: number;
  used_at: string | Date | null;
  created_at: string | Date;
}

const TABLE = "otp_codes";
const CREATE_COLUMNS = ["user_id", "purpose", "code_hash", "expires_at", "attempts", "max_attempts"] as const;
const UPDATE_COLUMNS = ["attempts", "used_at"] as const;

export function createOtpCode(input: Pick<OtpCode, "user_id" | "purpose" | "code_hash" | "expires_at" | "max_attempts">) {
  return insertRow<OtpCode>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function findValidOtpCode(userId: string, purpose: string) {
  return one<OtpCode>(
    `SELECT * FROM ${TABLE}
     WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`, [userId, purpose],
  );
}

export function incrementOtpAttempts(id: string) {
  return updateRow<OtpCode>(TABLE, id, { attempts: 1 }, UPDATE_COLUMNS);
}

export function markOtpUsed(id: string) {
  return updateRow<OtpCode>(TABLE, id, { used_at: new Date().toISOString() }, UPDATE_COLUMNS);
}

export function invalidateOldOtps(userId: string, purpose: string, exceptId: string | null = null) {
  const exceptClause = exceptId ? "AND id <> $3" : "";
  const params = exceptId ? [userId, purpose, exceptId] : [userId, purpose];
  return run(
    `UPDATE ${TABLE} SET used_at = NOW()
     WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL ${exceptClause}`,
    params,
  );
}

export async function countOtpCodesSince(userId: string, purpose: string, since: string): Promise<number> {
  const row = await one<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM ${TABLE}
     WHERE user_id = $1 AND purpose = $2 AND created_at >= $3`,
    [userId, purpose, since],
  );
  return parseInt(row?.count ?? "0", 10);
}

export function deleteExpiredOtps() {
  return run(`DELETE FROM ${TABLE} WHERE expires_at <= NOW() OR used_at IS NOT NULL`);
}
