import { insertRow, one, run, updateRow } from "./_shared";

export interface AdminInvitation {
  id: string;
  email: string;
  inviter_id: string;
  token_hash: string;
  expires_at: string | Date;
  used_at: string | Date | null;
  created_at: string | Date;
}

const TABLE = "admin_invitations";
const CREATE_COLUMNS = ["email", "inviter_id", "token_hash", "expires_at"] as const;
const UPDATE_COLUMNS = ["used_at"] as const;

export function createAdminInvitation(input: Pick<AdminInvitation, "email" | "inviter_id" | "token_hash" | "expires_at">) {
  return insertRow<AdminInvitation>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function findValidInvitation(tokenHash: string) {
  return one<AdminInvitation>(
    `SELECT * FROM ${TABLE}
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
     LIMIT 1`, [tokenHash],
  );
}

export function markInvitationUsed(id: string) {
  return updateRow<AdminInvitation>(TABLE, id, { used_at: new Date().toISOString() }, UPDATE_COLUMNS);
}

export function countValidInvitationsByEmail(email: string) {
  return one<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM ${TABLE}
     WHERE email = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [email],
  ).then((row) => parseInt(row?.count ?? "0", 10));
}

export function deleteExpiredInvitations() {
  return run(`DELETE FROM ${TABLE} WHERE expires_at <= NOW() OR used_at IS NOT NULL`);
}
