import { byId, deleteById, insertRow, many, updateRow } from "./_shared";

export interface Photo {
  id: string;
  photographer_id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  visibility: string;
  created_at: string | Date;
  updated_at: string | Date;
}

const TABLE = "photos";
const CREATE_COLUMNS = ["photographer_id", "title", "description", "image_url", "thumbnail_url", "visibility"] as const;
const UPDATE_COLUMNS = ["title", "description", "image_url", "thumbnail_url", "visibility"] as const;

export function getPhotoById(id: string) {
  return byId<Photo>(TABLE, id);
}

export function listPhotos(limit = 50, offset = 0) {
  return many<Photo>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function listPhotosForPhotographer(photographerId: string, limit = 50, offset = 0) {
  return many<Photo>(`SELECT * FROM ${TABLE} WHERE photographer_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [photographerId, limit, offset]);
}

export function createPhoto(input: Pick<Photo, "photographer_id" | "title" | "description" | "image_url" | "thumbnail_url" | "visibility">) {
  return insertRow<Photo>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updatePhoto(id: string, patch: Partial<Pick<Photo, "title" | "description" | "image_url" | "thumbnail_url" | "visibility">>) {
  return updateRow<Photo>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deletePhoto(id: string) {
  return deleteById(TABLE, id);
}
