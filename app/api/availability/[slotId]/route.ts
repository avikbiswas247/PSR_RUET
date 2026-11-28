import { AvailabilityService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Context = { params: Promise<{ slotId: string }> };
type Body = { available?: boolean };

export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "PHOTOGRAPHER"); if (denied) return denied;
    const { slotId } = await context.params;
    const body = await readJson<Body>(request);
    if (typeof body.available !== "boolean") return jsonOk({ message: "available must be boolean." }, 422);
    return jsonOk(await AvailabilityService.setSlotAvailability(slotId, auth.id, body.available));
  } catch (error) { return handleApiError(error); }
}
