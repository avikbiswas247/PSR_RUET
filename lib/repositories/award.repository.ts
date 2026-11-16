import { byId, deleteById, insertRow, many, updateRow } from "./_shared";

export interface Award {
  id: string;
  photographer_id: string;
  title: string | null;
  organization: string | null;
  award_level: string | null;
  awarded_at: string | Date | null;
  certificate_url: string | null;
  description: string | null;
  created_at: string | Date;
}

const TABLE = "awards";
const CREATE_COLUMNS = ["photographer_id", "title", "organization", "award_level", "awarded_at", "certificate_url", "description"] as const;
const UPDATE_COLUMNS = ["title", "organization", "award_level", "awarded_at", "certificate_url", "description"] as const;

export function getAwardById(id: string) {
  return byId<Award>(TABLE, id);
}

export function listAwards(limit = 50, offset = 0) {
  return many<Award>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function createAward(input: Pick<Award, "photographer_id" | "title" | "organization" | "award_level" | "awarded_at" | "certificate_url" | "description">) {
  return insertRow<Award>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updateAward(id: string, patch: Partial<Pick<Award, "title" | "organization" | "award_level" | "awarded_at" | "certificate_url" | "description">>) {
  return updateRow<Award>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deleteAward(id: string) {
  return deleteById(TABLE, id);
}
