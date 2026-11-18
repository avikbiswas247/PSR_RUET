import { byId, deleteById, insertRow, many, one, updateRow } from "./_shared";

export interface PhotographerProfile {
  id: string;
  user_id: string | null;
  title: string | null;
  bio: string | null;
  location: string | null;
  instagram_url: string | null;
  website_url: string | null;
  is_available: boolean;
  device: string | null;
  photography_genre: string | null;
  avatar_url: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

const TABLE = "photographer_profiles";
const CREATE_COLUMNS = ["user_id", "title", "bio", "location", "instagram_url", "website_url", "is_available", "device", "photography_genre"] as const;
const UPDATE_COLUMNS = ["title", "bio", "location", "instagram_url", "website_url", "is_available", "device", "photography_genre"] as const;

export function getPhotographerProfileById(id: string) {
  return byId<PhotographerProfile>(TABLE, id);
}

export function getPhotographerProfileByUserId(userId: string) {
  return one<PhotographerProfile>(`SELECT * FROM ${TABLE} WHERE user_id = $1 LIMIT 1`, [userId]);
}

export function listPhotographerProfiles(limit = 50, offset = 0, filters?: { search?: string | null; genre?: string | null; device?: string | null; location?: string | null; includeInactive?: boolean }) {
  const conditions: string[] = filters?.includeInactive
    ? []
    : ["(pp.user_id IS NULL OR (u.id IS NOT NULL AND u.is_active = TRUE AND u.deleted_at IS NULL AND u.email_verified_at IS NOT NULL))"];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters?.search) {
    conditions.push(`(u.full_name ILIKE $${paramIndex} OR pp.bio ILIKE $${paramIndex + 1} OR pp.title ILIKE $${paramIndex + 2})`);
    const term = `%${filters.search}%`;
    params.push(term, term, term);
    paramIndex += 3;
  }
  if (filters?.genre) {
    conditions.push(`pp.photography_genre ILIKE $${paramIndex}`);
    params.push(`%${filters.genre}%`);
    paramIndex += 1;
  }
  if (filters?.device) {
    conditions.push(`pp.device ILIKE $${paramIndex}`);
    params.push(`%${filters.device}%`);
    paramIndex += 1;
  }
  if (filters?.location) {
    conditions.push(`pp.location ILIKE $${paramIndex}`);
    params.push(`%${filters.location}%`);
    paramIndex += 1;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return many<PhotographerProfile>(
    `SELECT pp.* FROM ${TABLE} pp LEFT JOIN users u ON pp.user_id = u.id ${whereClause} ORDER BY pp.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );
}

export function createPhotographerProfile(input: Pick<PhotographerProfile, "user_id" | "title" | "bio" | "location" | "instagram_url" | "website_url" | "is_available" | "device" | "photography_genre">) {
  return insertRow<PhotographerProfile>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updatePhotographerProfile(id: string, patch: Partial<Pick<PhotographerProfile, "title" | "bio" | "location" | "instagram_url" | "website_url" | "is_available" | "device" | "photography_genre">>) {
  return updateRow<PhotographerProfile>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deletePhotographerProfile(id: string) {
  return deleteById(TABLE, id);
}
