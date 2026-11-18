import { CommunityProfileService } from "@/lib/services";
import { getPagination, handleApiError, jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  try {
    const { limit, offset } = getPagination(new URL(request.url), { limit: 100, offset: 0 });
    const profiles = await CommunityProfileService.listCommunityProfiles(limit, offset);
    return jsonOk(profiles);
  } catch (error) {
    return handleApiError(error);
  }
}
