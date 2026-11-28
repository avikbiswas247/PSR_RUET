import * as PhotographerProfileRepo from "@/lib/repositories/photographer-profile.repository";
import * as UserRepo from "@/lib/repositories/user.repository";
import * as RoleRepo from "@/lib/repositories/role.repository";
import * as _shared from "@/lib/repositories/_shared";

const page = (limit = 50, offset = 0) => {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    throw new Error("Invalid pagination.");
  }
  return { limit, offset };
};

export type PublicPhotographer = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  title: string | null;
  bio: string | null;
  location: string | null;
  instagram_url: string | null;
  website_url: string | null;
  is_available: boolean;
  roles: string[];
  created_at: string | Date;
  avatar_url: string | null;
  device: string | null;
  photography_genre: string | null;
  follower_count: number;
  is_following: boolean;
};

export async function listPublicPhotographers(input: { limit?: number; offset?: number; search?: string | null; genre?: string | null; device?: string | null; location?: string | null } = {}) {
  const p = page(input.limit, input.offset);
  const profiles = await PhotographerProfileRepo.listPhotographerProfiles(p.limit, p.offset, {
    search: input.search ?? null,
    genre: input.genre ?? null,
    device: input.device ?? null,
    location: input.location ?? null,
  });
  const result: PublicPhotographer[] = [];
  for (const profile of profiles) {
    let user: { full_name: string | null; email: string; avatar_url: string | null } | null = null;
    if (profile.user_id) {
      const u = await UserRepo.getUserById(profile.user_id);
      if (u && u.is_active && !u.deleted_at) {
        const { password_hash: _secret, ...safe } = u;
        void _secret;
        user = { full_name: safe.full_name, email: safe.email, avatar_url: safe.avatar_url ?? null };
      } else {
        continue;
      }
    }
    const roles = profile.user_id ? await RoleRepo.getUserRoles(profile.user_id) : [];
    result.push({
      id: profile.id,
      user_id: profile.user_id,
      full_name: user?.full_name ?? null,
      email: null,
      title: profile.title,
      bio: profile.bio,
      location: profile.location,
      instagram_url: profile.instagram_url,
      website_url: profile.website_url,
      is_available: profile.is_available,
      roles: roles.map((r) => r.name),
      created_at: profile.created_at,
      avatar_url: user?.avatar_url ?? profile.avatar_url ?? null,
      device: profile.device,
      photography_genre: profile.photography_genre,
      follower_count: 0,
      is_following: false,
    });
  }
  return result;
}

export async function getPublicPhotographer(id: string) {
  const profile = await PhotographerProfileRepo.getPhotographerProfileById(id)
    ?? await PhotographerProfileRepo.getPhotographerProfileByUserId(id);
  if (!profile) return null;
  let user: { full_name: string | null; avatar_url: string | null } | null = null;
  if (profile.user_id) {
    const u = await UserRepo.getUserById(profile.user_id);
    if (!u || !u.is_active || u.deleted_at || !u.email_verified_at) return null;
    if (u) {
      const { password_hash: _secret, ...safe } = u;
      void _secret;
      user = { full_name: safe.full_name, avatar_url: safe.avatar_url ?? null };
    }
  }
  const roles = profile.user_id ? await RoleRepo.getUserRoles(profile.user_id) : [];
  return {
    id: profile.id,
    user_id: profile.user_id,
    full_name: user?.full_name ?? null,
    title: profile.title,
    bio: profile.bio,
    location: profile.location,
    instagram_url: profile.instagram_url,
    website_url: profile.website_url,
    is_available: profile.is_available,
    roles: roles.map((r) => r.name),
    created_at: profile.created_at,
    avatar_url: user?.avatar_url ?? null,
    device: profile.device,
    photography_genre: profile.photography_genre,
    follower_count: 0,
    is_following: false,
  };
}

export async function followPhotographer(followerId: string, photographerId: string) {
  try {
    await _shared.insertRow("photographer_follows", { photographer_id: photographerId, follower_id: followerId, created_at: new Date().toISOString() }, ["photographer_id", "follower_id", "created_at"]);
    return { success: true };
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === "23505") {
      // Unique violation: already following
      return { success: true };
    }
    throw error;
  }
}

export async function unfollowPhotographer(followerId: string, photographerId: string) {
  await _shared.deleteRow("photographer_follows", { photographer_id: photographerId, follower_id: followerId });
  return { success: true };
}

export async function getFollowStatus(followerId: string, photographerId: string) {
  const isFollowing = await _shared.one(
    "SELECT 1 FROM photographer_follows WHERE photographer_id = $1 AND follower_id = $2",
    [photographerId, followerId]
  ) !== null;
  const [{ count }] = await _shared.many(
    "SELECT COUNT(*) as count FROM photographer_follows WHERE photographer_id = $1",
    [photographerId]
  );
  return { is_following: !!isFollowing, follower_count: Number(count?.count || 0) };
}
