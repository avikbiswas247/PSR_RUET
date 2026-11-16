import { SiteSettingService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

export async function GET(_request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const settings = await SiteSettingService.getSettings();
    return jsonOk(settings);
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const body = await readJson<{ key?: string; value?: Record<string, unknown>; description?: string | null }>(request);
    if (!body.key || !body.value) {
      return jsonOk({ message: "key and value are required." }, 422);
    }
    return jsonOk(await SiteSettingService.createSetting({
      key: body.key, value: body.value, description: body.description,
    }), 201);
  } catch (error) { return handleApiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const body = await readJson<{ id?: string; value?: Record<string, unknown>; description?: string | null }>(request);
    if (!body.id || !body.value) {
      return jsonOk({ message: "id and value are required." }, 422);
    }
    return jsonOk(await SiteSettingService.updateSetting({ id: body.id, value: body.value, description: body.description }));
  } catch (error) { return handleApiError(error); }
}
