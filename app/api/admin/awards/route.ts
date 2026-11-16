import { ProfileService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

export async function GET(_request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const awards = await ProfileService.listAwards();
    return jsonOk(awards);
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const body = await readJson<{ photographerId?: string; title?: string; organization?: string | null; level?: string | null; awardedAt?: string | null; certificateUrl?: string | null; description?: string | null }>(request);
    if (!body.photographerId || !body.title) {
      return jsonOk({ message: "photographerId and title are required." }, 422);
    }
    return jsonOk(await ProfileService.addAward({
      photographerId: body.photographerId, title: body.title,
      organization: body.organization, level: body.level, awardedAt: body.awardedAt,
      certificateUrl: body.certificateUrl, description: body.description,
    }), 201);
  } catch (error) { return handleApiError(error); }
}
