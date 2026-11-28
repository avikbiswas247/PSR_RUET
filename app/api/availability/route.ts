import { AvailabilityService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { jsonError, jsonOk } from "@/lib/api/http";
import { AvailabilityServiceError } from "@/lib/services/availability.service";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: string | null | undefined): boolean {
  return typeof id === "string" && UUID_REGEX.test(id);
}

type Body = { date?: string; startTime?: string; endTime?: string };

const AVAILABILITY_ERROR_STATUS: Record<AvailabilityServiceError["code"], number> = {
  INVALID_DATE: 422,
  INVALID_TIME: 422,
  INVALID_RANGE: 422,
  NOT_FOUND: 404,
  SAVE_FAILED: 500,
};

function handleAvailabilityApiError(error: unknown) {
  if (error instanceof AvailabilityServiceError) {
    return jsonError(error.message, AVAILABILITY_ERROR_STATUS[error.code], error.code);
  }
  console.error("[Availability API] Request failed:", error instanceof Error ? error.stack : String(error));
  return jsonError("Unable to complete this availability request. Please try again.", 500, "AVAILABILITY_ERROR");
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const photographerId = url.searchParams.get("photographerId");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    if (!photographerId || !from || !to) return jsonError("photographerId, from and to are required.", 422, "MISSING_FIELDS");
    if (!isValidUuid(photographerId)) return jsonError("Invalid photographer ID.", 400, "INVALID_PHOTOGRAPHER_ID");
    return jsonOk(await AvailabilityService.listAvailability(photographerId, from, to));
  } catch (error) { return handleAvailabilityApiError(error); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "PHOTOGRAPHER"); if (denied) return denied;
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
    if (typeof body.date !== "string" || typeof body.startTime !== "string" || typeof body.endTime !== "string") {
      return jsonError("date, startTime and endTime are required.", 422, "MISSING_FIELDS");
    }
    return jsonOk(await AvailabilityService.addAvailability({ authenticatedPhotographerId: auth.id, date: body.date, startTime: body.startTime, endTime: body.endTime }), 201);
  } catch (error) { return handleAvailabilityApiError(error); }
}
