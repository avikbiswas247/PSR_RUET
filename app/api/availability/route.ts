import { AvailabilityService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: string | null | undefined): boolean {
  return typeof id === "string" && UUID_REGEX.test(id);
}

type Body = { date?: string; startTime?: string; endTime?: string };

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const photographerId = url.searchParams.get("photographerId");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    if (!photographerId || !from || !to) return jsonOk({ message: "photographerId, from and to are required." }, 422);
    if (!isValidUuid(photographerId)) return jsonOk({ message: "Invalid photographer ID." }, 400);
    return jsonOk(await AvailabilityService.listAvailability(photographerId, from, to));
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "PHOTOGRAPHER"); if (denied) return denied;
    const body = await readJson<Body>(request);
    if (!body.date || !body.startTime || !body.endTime) return jsonOk({ message: "date, startTime and endTime are required." }, 422);
    return jsonOk(await AvailabilityService.addAvailability({ authenticatedPhotographerId: auth.id, date: body.date, startTime: body.startTime, endTime: body.endTime }), 201);
  } catch (error) { return handleApiError(error); }
}
