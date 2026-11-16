import { ProfileService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk } from "@/lib/api/http";

export async function GET() {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "PHOTOGRAPHER"); if (denied) return denied;
    const profile = await ProfileService.getMyPhotographerProfile(auth.id);
    return jsonOk(profile ?? null);
  } catch (error) { return handleApiError(error); }
}
