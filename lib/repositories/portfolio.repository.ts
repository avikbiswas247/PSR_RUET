import { byId, deleteById, insertRow, many, updateRow } from "./_shared";

export interface Portfolio {
  id: string;
  photographer_id: string;
  title: string | null;
  slug: string;
  description: string | null;
  theme: string | null;
  is_public: boolean;
  created_at: string | Date;
  updated_at: string | Date;
  photographer_name?: string | null;
  photographer_avatar_url?: string | null;
}

const TABLE = "portfolios";
const CREATE_COLUMNS = ["photographer_id", "title", "slug", "description", "theme", "is_public"] as const;
const UPDATE_COLUMNS = ["title", "slug", "description", "theme", "is_public"] as const;

export function getPortfolioById(id: string) {
  return byId<Portfolio>(TABLE, id);
}

export function listPortfolios(limit = 50, offset = 0) {
  return many<Portfolio>(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function listPublicPortfolios(limit = 50, offset = 0) {
  return many<Portfolio>(
    `SELECT p.*, u.full_name AS photographer_name, u.avatar_url AS photographer_avatar_url
     FROM ${TABLE} p LEFT JOIN users u ON u.id = p.photographer_id
     WHERE p.is_public = TRUE AND u.is_active = TRUE
       AND u.deleted_at IS NULL AND u.email_verified_at IS NOT NULL
     ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
}

export function listPortfoliosByPhotographer(photographerId: string, limit = 50, offset = 0) {
  return many<Portfolio>(
    `SELECT p.*, u.full_name AS photographer_name, u.avatar_url AS photographer_avatar_url
     FROM ${TABLE} p LEFT JOIN users u ON u.id = p.photographer_id
     WHERE p.photographer_id = $1 ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`,
    [photographerId, limit, offset],
  );
}

export function createPortfolio(input: Pick<Portfolio, "photographer_id" | "title" | "slug" | "description" | "theme" | "is_public">) {
  return insertRow<Portfolio>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updatePortfolio(id: string, patch: Partial<Pick<Portfolio, "title" | "slug" | "description" | "theme" | "is_public">>) {
  return updateRow<Portfolio>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deletePortfolio(id: string) {
  return deleteById(TABLE, id);
}
