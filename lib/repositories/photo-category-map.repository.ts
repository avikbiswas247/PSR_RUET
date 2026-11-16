import { many, run } from "./_shared";

export function listCategoriesForPhoto(photoId: string) {
  return many(
    `SELECT c.* FROM photo_categories c
     INNER JOIN photo_category_map pcm ON pcm.category_id = c.id
     WHERE pcm.photo_id = $1 ORDER BY c.name`,
    [photoId],
  );
}

export function listPhotosForCategory(categoryId: string, limit = 50, offset = 0) {
  return many(
    `SELECT p.* FROM photos p
     INNER JOIN photo_category_map pcm ON pcm.photo_id = p.id
     WHERE pcm.category_id = $1
     ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`,
    [categoryId, limit, offset],
  );
}

export function addCategoryToPhoto(photoId: string, categoryId: string) {
  return run(
    `INSERT INTO photo_category_map (photo_id, category_id)
     VALUES ($1, $2) ON CONFLICT (photo_id, category_id) DO NOTHING`,
    [photoId, categoryId],
  );
}

export function removeCategoryFromPhoto(photoId: string, categoryId: string) {
  return run("DELETE FROM photo_category_map WHERE photo_id = $1 AND category_id = $2", [photoId, categoryId]);
}
