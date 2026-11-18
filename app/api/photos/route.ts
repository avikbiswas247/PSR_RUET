import { PhotoService } from "@/lib/services";
import { getPhotographerProfileById } from "@/lib/repositories/photographer-profile.repository";
import { getUserById } from "@/lib/repositories/user.repository";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { getPagination, handleApiError, jsonOk, readJson } from "@/lib/api/http";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: string | null | undefined): boolean {
  return typeof id === "string" && UUID_REGEX.test(id);
}

type Body = { title?: string; description?: string | null; imageUrl?: string; thumbnailUrl?: string | null; categoryIds?: string[] };

export async function GET(request: Request) {
  try {
    const { limit, offset } = getPagination(new URL(request.url));
    const url = new URL(request.url);
    const photographerId = url.searchParams.get("photographer_id") || undefined;
    const user = await getCurrentUser();
    if (photographerId && !isValidUuid(photographerId)) {
      return jsonOk({ message: "Invalid photographer ID." }, 400);
    }
    if (photographerId) {
      // photographer_id in URL is photographer_profiles.id; resolve to users.id
      // because photos.photographer_id stores users.id
      const profile = await getPhotographerProfileById(photographerId);
      if (!profile || !profile.user_id) {
        return jsonOk([]);
      }
      const owner = await getUserById(profile.user_id);
      if (!owner || !owner.is_active || owner.deleted_at || !owner.email_verified_at) return jsonOk([]);
      const photos = user?.id === profile.user_id && user.roles.includes("PHOTOGRAPHER")
        ? await PhotoService.listMyPhotos(profile.user_id, limit, offset)
        : await PhotoService.listPublicPhotosForPhotographer(profile.user_id, limit, offset);
      return jsonOk(photos);
    }
    if (user && user.roles.includes("PHOTOGRAPHER")) {
      const photos = await PhotoService.listMyPhotos(user.id, limit, offset);
      return jsonOk(photos);
    }
    const photos = await PhotoService.listPublicPhotos(limit, offset);
    return jsonOk(photos);
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "PHOTOGRAPHER"); if (denied) return denied;
    const body = await readJson<Body>(request);
    if (!body.title || !body.imageUrl) return jsonOk({ message: "title and imageUrl are required." }, 422);
    const photo = await PhotoService.publishPhoto({
      authenticatedPhotographerId: auth.id, title: body.title, description: body.description,
      imageUrl: body.imageUrl, thumbnailUrl: body.thumbnailUrl, categoryIds: body.categoryIds,
    });
    return jsonOk(photo, 201);
  } catch (error) { return handleApiError(error); }
}
