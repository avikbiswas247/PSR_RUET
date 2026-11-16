import { UserService } from "@/lib/services";
import { requireUser, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";


type PatchBody = { fullName?: string; avatarUrl?: string | null; phone?: string | null };

export async function GET() {
  try {
    const auth = await requireUser();
    if (isResponse(auth)) return auth;
    const user = await UserService.getPublicUser(auth.id);
    return user ? jsonOk(user) : jsonOk({ message: "User not found." }, 404);
  } catch (error) { return handleApiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser();
    if (isResponse(auth)) return auth;
    const body = await readJson<PatchBody>(request);
    const user = await UserService.updateOwnProfile(auth.id, body);
    return jsonOk(user);
  } catch (error) { return handleApiError(error); }
}
