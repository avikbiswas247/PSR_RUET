import { many, one, run } from "./_shared";
export interface ExhibitionItem {
  id: string; exhibition_id: string; photo_id: string;
  display_order: number; curator_note: string | null; created_at: string | Date;
}
export function listExhibitionItems(exhibitionId: string) {
  return many<ExhibitionItem>(
    `SELECT ei.*, p.title AS photo_title, p.image_url, p.thumbnail_url
     FROM exhibition_items ei INNER JOIN photos p ON p.id = ei.photo_id
     WHERE ei.exhibition_id = $1 ORDER BY ei.display_order, ei.created_at`,
    [exhibitionId],
  );
}
export function addExhibitionItem(input: Pick<ExhibitionItem, "exhibition_id" | "photo_id" | "display_order" | "curator_note">) {
  return one<ExhibitionItem>(
    `INSERT INTO exhibition_items (exhibition_id, photo_id, display_order, curator_note)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (exhibition_id, photo_id)
     DO UPDATE SET display_order = EXCLUDED.display_order, curator_note = EXCLUDED.curator_note
     RETURNING *`,
    [input.exhibition_id, input.photo_id, input.display_order, input.curator_note],
  );
}
export function removeExhibitionItem(exhibitionId: string, photoId: string) {
  return run("DELETE FROM exhibition_items WHERE exhibition_id = $1 AND photo_id = $2", [exhibitionId, photoId]);
}
