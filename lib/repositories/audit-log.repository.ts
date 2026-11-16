import { byId, deleteById, insertRow, many, updateRow } from "./_shared";

export interface AuditLog {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string | Date;
}

const TABLE = "audit_logs";
const CREATE_COLUMNS = ["admin_id", "action", "target_type", "target_id", "metadata"] as const;
const UPDATE_COLUMNS = [] as const;

export function getAuditLogById(id: string) {
  return byId<AuditLog>(TABLE, id);
}

export function listAuditLogs(limit = 50, offset = 0) {
  return many<AuditLog>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function createAuditLog(input: Pick<AuditLog, "admin_id" | "action" | "target_type" | "target_id" | "metadata">) {
  return insertRow<AuditLog>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updateAuditLog(id: string, patch: Partial<Pick<AuditLog, never>>) {
  return updateRow<AuditLog>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deleteAuditLog(id: string) {
  return deleteById(TABLE, id);
}
