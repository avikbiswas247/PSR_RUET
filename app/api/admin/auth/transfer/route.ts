import { AdminService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

export async function POST(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const body = await readJson<{ targetUserId?: string; reason?: string }>(request);
    if (!body.targetUserId) return jsonOk({ message: "targetUserId is required." }, 422);
    return jsonOk(await AdminService.designateFounderAdmin({ authenticatedAdminId: auth.id, targetUserId: body.targetUserId, reason: body.reason }));
  } catch (error) { return handleApiError(error); }
}
