import { BookingService } from "@/lib/services";
import { requireUser, isResponse } from "@/lib/api/guards";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";
import { handleBookingApiError } from "@/lib/api/booking-http";

type Context = { params: Promise<{ bookingId: string }> };
type Body = { message?: string };

export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const { bookingId } = await context.params;
    return jsonOk(await BookingService.listMessagesForParticipant(bookingId, auth.id));
  } catch (error) { return handleBookingApiError(error); }
}

export async function POST(request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const { bookingId } = await context.params;
    const body = await readJson<Body>(request);
    if (typeof body.message !== "string" || !body.message.trim()) return jsonError("message is required.", 422, "INVALID_MESSAGE");
    return jsonOk(await BookingService.sendBookingMessage({ bookingId, authenticatedUserId: auth.id, message: body.message }), 201);
  } catch (error) { return handleBookingApiError(error); }
}
