import { byId, deleteById, insertRow, many, updateRow } from "./_shared";

export interface PhotoReview {
  id: string;
  photo_id: string;
  admin_user_id: string;
  decision: string;
  feedback: string | null;
  reviewed_at: string | Date | null;
  created_at: string | Date;
}

const TABLE = "photo_reviews";
const CREATE_COLUMNS = ["photo_id", "admin_user_id", "decision", "feedback", "reviewed_at"] as const;
const UPDATE_COLUMNS = ["decision", "feedback", "reviewed_at"] as const;

export function getPhotoReviewById(id: string) {
  return byId<PhotoReview>(TABLE, id);
}

export function listPhotoReviews(limit = 50, offset = 0) {
  return many<PhotoReview>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function createPhotoReview(input: Pick<PhotoReview, "photo_id" | "admin_user_id" | "decision" | "feedback" | "reviewed_at">) {
  return insertRow<PhotoReview>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updatePhotoReview(id: string, patch: Partial<Pick<PhotoReview, "decision" | "feedback" | "reviewed_at">>) {
  return updateRow<PhotoReview>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deletePhotoReview(id: string) {
  return deleteById(TABLE, id);
}
