import { byId, deleteById, insertRow, many, updateRow } from "./_shared";

export interface PhotoCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string | Date;
}

const TABLE = "photo_categories";
const CREATE_COLUMNS = ["name", "slug", "description"] as const;
const UPDATE_COLUMNS = ["name", "slug", "description"] as const;

export function getPhotoCategoryById(id: string) {
  return byId<PhotoCategory>(TABLE, id);
}

export function listPhotoCategorys(limit = 50, offset = 0) {
  return many<PhotoCategory>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function createPhotoCategory(input: Pick<PhotoCategory, "name" | "slug" | "description">) {
  return insertRow<PhotoCategory>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updatePhotoCategory(id: string, patch: Partial<Pick<PhotoCategory, "name" | "slug" | "description">>) {
  return updateRow<PhotoCategory>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deletePhotoCategory(id: string) {
  return deleteById(TABLE, id);
}
