import { SiteSettingService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const { id } = await params;
    const body = await readJson<{ value?: Record<string, unknown>; description?: string | null }>(_request);
    if (!body.value) {
      return jsonOk({ message: "value is required." }, 422);
    }
    return jsonOk(await SiteSettingService.updateSetting({ id, value: body.value, description: body.description }));
  } catch (error) { return handleApiError(error); }
}
