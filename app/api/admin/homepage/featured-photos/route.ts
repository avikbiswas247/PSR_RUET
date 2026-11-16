import { requireRole, requireUser, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonError, jsonOk, readJson } from "@/lib/api/http";
import {
  HOMEPAGE_FEATURED_PHOTOS_KEY,
  parseHomepageFeaturedPhotos,
} from "@/lib/homepage-featured-photos";
import { SiteSettingService } from "@/lib/services";

export async function PUT(request: Request) {
  try {
    const auth = await requireUser();
    if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN");
    if (denied) return denied;

    const body = await readJson<{ photos?: unknown }>(request);
    const photos = parseHomepageFeaturedPhotos(body.photos);
    if (!photos) {
      return jsonError("Add a title, category, and valid image URL for each of the four homepage frames.", 422, "INVALID_FEATURED_PHOTOS");
    }

    const setting = await SiteSettingService.saveSettingByKey({
      key: HOMEPAGE_FEATURED_PHOTOS_KEY,
      value: { photos },
      description: "Images and captions shown in the homepage featured frames section.",
    });

    return jsonOk({ photos: setting.value.photos });
  } catch (error) {
    return handleApiError(error);
  }
}
