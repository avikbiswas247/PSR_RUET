import { EventService } from "@/lib/services";
import { requireUser, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk } from "@/lib/api/http";

type Context = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { eventId } = await context.params;
    const event = await EventService.getPublicEvent(eventId);
    if (!event) {
      return jsonOk({ message: "Event not found." }, 404);
    }
    return jsonOk(event);
  } catch (error) { return handleApiError(error); }
}

export async function POST(_request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const { eventId } = await context.params;
    return jsonOk(await EventService.registerForEvent(eventId, auth.id), 201);
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const { eventId } = await context.params;
    return jsonOk(await EventService.cancelRegistration(eventId, auth.id));
  } catch (error) { return handleApiError(error); }
}
