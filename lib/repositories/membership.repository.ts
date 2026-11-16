import { byId, deleteById, insertRow, many, updateRow } from "./_shared";

export interface Membership {
  id: string;
  user_id: string | null;
  member_code: string;
  department: string | null;
  academic_year: string | null;
  status: string;
  joined_at: string | Date;
  created_at: string | Date;
}

const TABLE = "memberships";
const CREATE_COLUMNS = ["user_id", "member_code", "department", "academic_year", "status", "joined_at"] as const;
const UPDATE_COLUMNS = ["department", "academic_year", "status", "joined_at"] as const;

export function getMembershipById(id: string) {
  return byId<Membership>(TABLE, id);
}

export function listMemberships(limit = 50, offset = 0) {
  return many<Membership>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function createMembership(input: Pick<Membership, "user_id" | "member_code" | "department" | "academic_year" | "status" | "joined_at">) {
  return insertRow<Membership>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updateMembership(id: string, patch: Partial<Pick<Membership, "department" | "academic_year" | "status" | "joined_at">>) {
  return updateRow<Membership>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deleteMembership(id: string) {
  return deleteById(TABLE, id);
}
