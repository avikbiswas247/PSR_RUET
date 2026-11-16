import { many, one, run } from "./_shared";
export interface PortfolioItem {
  id: string; portfolio_id: string; photo_id: string;
  display_order: number; created_at: string | Date;
}
export function listPortfolioItems(portfolioId: string) {
  return many<PortfolioItem>(
    `SELECT pi.*, p.title AS photo_title, p.image_url, p.thumbnail_url
     FROM portfolio_items pi
     INNER JOIN photos p ON p.id = pi.photo_id
     WHERE pi.portfolio_id = $1 ORDER BY pi.display_order ASC, pi.created_at ASC`,
    [portfolioId],
  );
}
export function addPhotoToPortfolio(portfolioId: string, photoId: string, displayOrder = 0) {
  return one<PortfolioItem>(
    `INSERT INTO portfolio_items (portfolio_id, photo_id, display_order)
     VALUES ($1, $2, $3) ON CONFLICT (portfolio_id, photo_id)
     DO UPDATE SET display_order = EXCLUDED.display_order RETURNING *`,
    [portfolioId, photoId, displayOrder],
  );
}
export function updatePortfolioItemOrder(id: string, displayOrder: number) {
  return one<PortfolioItem>("UPDATE portfolio_items SET display_order = $1 WHERE id = $2 RETURNING *", [displayOrder, id]);
}
export function removePhotoFromPortfolio(portfolioId: string, photoId: string) {
  return run("DELETE FROM portfolio_items WHERE portfolio_id = $1 AND photo_id = $2", [portfolioId, photoId]);
}
