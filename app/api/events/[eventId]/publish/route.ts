import { EventService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk } from "@/lib/api/http";

type Context = { params: Promise<{ eventId: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    // The current service does not enforce creator ownership. Restrict to ADMIN
    // until the service adds a verified owner check.
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const { eventId } = await context.params;
    return jsonOk(await EventService.publishEvent(eventId));
  } catch (error) { return handleApiError(error); }
}
