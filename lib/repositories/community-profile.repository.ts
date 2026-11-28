import { many, one } from "./_shared";
import type { CommunityProfile, CommunityProfilePhoto } from "@/lib/types/public";

const PUBLIC_PROFILE_ROLES = "'ADMIN', 'MEMBER', 'PHOTOGRAPHER'";

const PROFILE_SELECT = `
  SELECT
    u.id,
    u.full_name,
    u.avatar_url,
    ARRAY(
      SELECT DISTINCT r.name
      FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = u.id AND r.name IN (${PUBLIC_PROFILE_ROLES})
      ORDER BY r.name
    ) AS roles,
    pp.title,
    pp.is_available,
    pp.bio,
    pp.location,
    pp.instagram_url,
    pp.website_url,
    pp.device,
    pp.photography_genre,
    u.created_at,
    (SELECT COUNT(*)::int FROM photos ph WHERE ph.photographer_id = u.id AND ph.visibility = 'PUBLIC') AS photo_count,
    (SELECT COUNT(*)::int FROM portfolios po WHERE po.photographer_id = u.id AND po.is_public = TRUE) AS portfolio_count
  FROM users u
  LEFT JOIN LATERAL (
    SELECT title, is_available, bio, location, instagram_url, website_url, device, photography_genre
    FROM photographer_profiles
    WHERE user_id = u.id
    ORDER BY created_at ASC
    LIMIT 1
  ) pp ON TRUE
  WHERE u.is_active = TRUE
    AND u.deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = u.id AND r.name IN (${PUBLIC_PROFILE_ROLES})
    )`;

export function listCommunityProfiles(limit = 50, offset = 0) {
  return many<CommunityProfile>(
    `${PROFILE_SELECT} ORDER BY u.created_at DESC, u.id LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
}

export function getCommunityProfileById(userId: string) {
  return one<CommunityProfile>(`${PROFILE_SELECT} AND u.id = $1 LIMIT 1`, [userId]);
}

export function listCommunityProfilePhotos(userId: string, limit = 100) {
  return many<CommunityProfilePhoto>(
    `SELECT ph.id, ph.title, ph.description, ph.image_url, ph.thumbnail_url, ph.created_at
     FROM photos ph
     INNER JOIN users u ON u.id = ph.photographer_id
     WHERE ph.photographer_id = $1
       AND ph.visibility = 'PUBLIC'
       AND u.is_active = TRUE
       AND u.deleted_at IS NULL
       AND EXISTS (
         SELECT 1
         FROM user_roles ur
         INNER JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = u.id AND r.name IN (${PUBLIC_PROFILE_ROLES})
       )
     ORDER BY ph.created_at DESC
     LIMIT $2`,
    [userId, limit],
  );
}
