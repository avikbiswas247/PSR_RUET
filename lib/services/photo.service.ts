import * as PhotoRepo from "@/lib/repositories/photo.repository";
import * as CategoryRepo from "@/lib/repositories/photo-category-map.repository";
import * as ReviewRepo from "@/lib/repositories/photo-review.repository";
import * as AppreciationRepo from "@/lib/repositories/photo-appreciation.repository";
import * as _shared from "@/lib/repositories/_shared";
export class PhotoServiceError extends Error { constructor(message: string, public code: string) { super(message); this.name = "PhotoServiceError"; } }
const https = (url: string) => /^https:\/\//i.test(url);
export async function publishPhoto(input: { authenticatedPhotographerId: string; title: string; description?: string | null; imageUrl: string; thumbnailUrl?: string | null; categoryIds?: string[] }) {
  if (!input.title.trim()) throw new PhotoServiceError("Photo title is required.", "INVALID_TITLE");
  if (!https(input.imageUrl) || (input.thumbnailUrl && !https(input.thumbnailUrl))) throw new PhotoServiceError("Photo URLs must use HTTPS.", "INVALID_URL");
  const photo = await PhotoRepo.createPhoto({ photographer_id: input.authenticatedPhotographerId, title: input.title.trim(), description: input.description ?? null, image_url: input.imageUrl, thumbnail_url: input.thumbnailUrl ?? null, visibility: "PUBLIC" });
  for (const categoryId of [...new Set(input.categoryIds ?? [])]) await CategoryRepo.addCategoryToPhoto(photo.id, categoryId);
  return photo;
}
export async function listPublicPhotos(limit = 50, offset = 0) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    throw new Error("Invalid pagination.");
  }
  return PhotoRepo.listPublicPhotos(limit, offset);
}
export async function listPublicPhotosForPhotographer(photographerId: string, limit = 50, offset = 0) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    throw new Error("Invalid pagination.");
  }
  return PhotoRepo.listPublicPhotosForPhotographer(photographerId, limit, offset);
}
export async function listMyPhotos(photographerId: string, limit = 50, offset = 0) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    throw new Error("Invalid pagination.");
  }
  return PhotoRepo.listPhotosForPhotographer(photographerId, limit, offset);
}
export async function updateOwnPhoto(input: { photoId: string; authenticatedPhotographerId: string; patch: { title?: string; description?: string | null; imageUrl?: string; thumbnailUrl?: string | null; visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED" } }) {
  const photo = await PhotoRepo.getPhotoById(input.photoId); if (!photo) throw new PhotoServiceError("Photo not found.", "NOT_FOUND");
  if (photo.photographer_id !== input.authenticatedPhotographerId) throw new PhotoServiceError("You cannot edit this photo.", "FORBIDDEN");
  const p = input.patch; if (p.title !== undefined && !p.title.trim()) throw new PhotoServiceError("Title cannot be empty.", "INVALID_TITLE");
  if (p.imageUrl && !https(p.imageUrl)) throw new PhotoServiceError("Image URL must use HTTPS.", "INVALID_URL");
  if (p.thumbnailUrl && !https(p.thumbnailUrl)) throw new PhotoServiceError("Thumbnail URL must use HTTPS.", "INVALID_URL");
  return PhotoRepo.updatePhoto(photo.id, { title: p.title?.trim(), description: p.description, image_url: p.imageUrl, thumbnail_url: p.thumbnailUrl, visibility: p.visibility });
}
export async function deleteOwnPhoto(photoId: string, authenticatedPhotographerId: string) { const photo = await PhotoRepo.getPhotoById(photoId); if (!photo) return false; if (photo.photographer_id !== authenticatedPhotographerId) throw new PhotoServiceError("You cannot delete this photo.", "FORBIDDEN"); return PhotoRepo.deletePhoto(photoId); }
/** Admin authorization must be enforced by the route before calling this. */
export async function reviewPhoto(input: { photoId: string; authenticatedAdminId: string; decision: "APPROVED" | "FEATURED" | "REJECTED"; feedback?: string | null }) {
  const photo = await PhotoRepo.getPhotoById(input.photoId); if (!photo) throw new PhotoServiceError("Photo not found.", "NOT_FOUND");
  return ReviewRepo.createPhotoReview({ photo_id: photo.id, admin_user_id: input.authenticatedAdminId, decision: input.decision, feedback: input.feedback ?? null, reviewed_at: new Date() });
}
export const listCategoriesForPhoto = (photoId: string) => CategoryRepo.listCategoriesForPhoto(photoId);
export const appreciatePhoto = (input: { photoId: string; authenticatedAdminId: string; type: string; note?: string | null }) => AppreciationRepo.createPhotoAppreciation({ photo_id: input.photoId, admin_user_id: input.authenticatedAdminId, appreciation_type: input.type, note: input.note ?? null });
export async function likePhoto(userId: string, photoId: string) {
  const existing = await _shared.one("SELECT 1 FROM photo_likes WHERE photo_id = $1 AND user_id = $2", [photoId, userId]);
  if (existing) {
    await _shared.deleteRow("photo_likes", { photo_id: photoId, user_id: userId });
    return { liked: false };
  }
  await _shared.insertRow("photo_likes", { photo_id: photoId, user_id: userId, created_at: new Date().toISOString() }, ["photo_id", "user_id", "created_at"]);
  return { liked: true };
}
export async function unlikePhoto(userId: string, photoId: string) {
  await _shared.deleteRow("photo_likes", { photo_id: photoId, user_id: userId });
  return { liked: false };
}
export async function addComment(userId: string, photoId: string, comment: string) {
  if (!comment.trim()) throw new Error("Comment cannot be empty.");
  return _shared.insertRow("photo_comments", { photo_id: photoId, user_id: userId, comment: comment.trim(), created_at: new Date().toISOString() }, ["photo_id", "user_id", "comment", "created_at"]);
}
export async function getPhotoComments(photoId: string) {
  return _shared.many("SELECT pc.*, u.full_name FROM photo_comments pc LEFT JOIN users u ON pc.user_id = u.id WHERE pc.photo_id = $1 ORDER BY pc.created_at DESC", [photoId]);
}
export async function getPhotoLikes(photoId: string) {
  return _shared.many("SELECT user_id FROM photo_likes WHERE photo_id = $1", [photoId]);
}
