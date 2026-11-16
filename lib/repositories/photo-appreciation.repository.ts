import { byId, deleteById, insertRow, many, updateRow } from "./_shared";

export interface PhotoAppreciation {
  id: string;
  photo_id: string;
  admin_user_id: string;
  appreciation_type: string;
  note: string | null;
  created_at: string | Date;
}

const TABLE = "photo_appreciations";
const CREATE_COLUMNS = ["photo_id", "admin_user_id", "appreciation_type", "note"] as const;
const UPDATE_COLUMNS = ["appreciation_type", "note"] as const;

export function getPhotoAppreciationById(id: string) {
  return byId<PhotoAppreciation>(TABLE, id);
}

export function listPhotoAppreciations(limit = 50, offset = 0) {
  return many<PhotoAppreciation>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function createPhotoAppreciation(input: Pick<PhotoAppreciation, "photo_id" | "admin_user_id" | "appreciation_type" | "note">) {
  return insertRow<PhotoAppreciation>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updatePhotoAppreciation(id: string, patch: Partial<Pick<PhotoAppreciation, "appreciation_type" | "note">>) {
  return updateRow<PhotoAppreciation>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deletePhotoAppreciation(id: string) {
  return deleteById(TABLE, id);
}
