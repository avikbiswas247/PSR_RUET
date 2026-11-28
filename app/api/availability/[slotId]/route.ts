import { AvailabilityService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { jsonError, jsonOk } from "@/lib/api/http";
import { AvailabilityServiceError } from "@/lib/services/availability.service";

type Context = { params: Promise<{ slotId: string }> };
type Body = { available?: boolean };
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function handleAvailabilityApiError(error: unknown) {
  if (error instanceof AvailabilityServiceError) {
    const status = error.code === "NOT_FOUND" ? 404 : error.code === "SAVE_FAILED" ? 500 : 422;
    return jsonError(error.message, status, error.code);
  }
  console.error("[Availability API] Request failed:", error instanceof Error ? error.stack : String(error));
  return jsonError("Unable to complete this availability request. Please try again.", 500, "AVAILABILITY_ERROR");
}

export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "PHOTOGRAPHER"); if (denied) return denied;
    const { slotId } = await context.params;
    if (!UUID_REGEX.test(slotId)) return jsonError("Invalid availability slot ID.", 400, "INVALID_SLOT_ID");
    let body: Body;
    try {
      const parsed: unknown = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return jsonError("Request body must be a JSON object.", 400, "INVALID_BODY");
      }
      body = parsed as Body;
    } catch {
      return jsonError("Request body must be valid JSON.", 400, "INVALID_JSON");
    }
    if (typeof body.available !== "boolean") return jsonError("available must be boolean.", 422, "INVALID_AVAILABILITY");
    return jsonOk(await AvailabilityService.setSlotAvailability(slotId, auth.id, body.available));
  } catch (error) { return handleAvailabilityApiError(error); }
}
