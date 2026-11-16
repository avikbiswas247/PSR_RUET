import { byId, deleteById, insertRow, many, updateRow } from "./_shared";

export interface MediaAsset {
  id: string;
  url: string;
  public_id: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string | Date;
}

const TABLE = "media_assets";
const CREATE_COLUMNS = ["url", "public_id", "file_name", "file_type", "file_size", "uploaded_by"] as const;
const UPDATE_COLUMNS = ["url", "public_id", "file_name", "file_type", "file_size", "uploaded_by"] as const;

export function getMediaAssetById(id: string) {
  return byId<MediaAsset>(TABLE, id);
}

export function listMediaAssets(limit = 50, offset = 0) {
  return many<MediaAsset>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function createMediaAsset(input: Pick<MediaAsset, "url" | "public_id" | "file_name" | "file_type" | "file_size" | "uploaded_by">) {
  return insertRow<MediaAsset>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updateMediaAsset(id: string, patch: Partial<Pick<MediaAsset, "url" | "public_id" | "file_name" | "file_type" | "file_size" | "uploaded_by">>) {
  return updateRow<MediaAsset>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deleteMediaAsset(id: string) {
  return deleteById(TABLE, id);
}
