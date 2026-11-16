import { jsonOk, handleApiError } from "@/lib/api/http";
import { SiteSettingService } from "@/lib/services";
import {
  DEFAULT_HOMEPAGE_FEATURED_PHOTOS,
  HOMEPAGE_FEATURED_PHOTOS_KEY,
  parseHomepageFeaturedPhotos,
} from "@/lib/homepage-featured-photos";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const setting = await SiteSettingService.getSettingByKey(HOMEPAGE_FEATURED_PHOTOS_KEY);
    const photos = parseHomepageFeaturedPhotos(setting?.value?.photos) ?? DEFAULT_HOMEPAGE_FEATURED_PHOTOS;
    const response = jsonOk(photos);
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
