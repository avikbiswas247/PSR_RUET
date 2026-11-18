import { CommunityProfileService } from "@/lib/services";
import { handleApiError, jsonOk } from "@/lib/api/http";

type Context = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { userId } = await context.params;
    const profile = await CommunityProfileService.getCommunityProfile(userId);
    return profile
      ? jsonOk(profile)
      : jsonOk({ message: "Profile not found." }, 404);
  } catch (error) {
    return handleApiError(error);
  }
}
