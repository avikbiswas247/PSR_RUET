import { BookingService } from "@/lib/services";
import * as BookingRepo from "@/lib/repositories/booking.repository";
import { requireUser, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Context = { params: Promise<{ bookingId: string }> };
type Body = { message?: string };

async function verifyParticipant(bookingId: string, userId: string) {
  const booking = await BookingRepo.getBookingById(bookingId);
  if (!booking) return { error: jsonOk({ message: "Booking not found." }, 404) };
  if (booking.client_id !== userId && booking.photographer_id !== userId) {
    return { error: jsonOk({ message: "Forbidden." }, 403) };
  }
  return { booking };
}

export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const { bookingId } = await context.params;
    const check = await verifyParticipant(bookingId, auth.id);
    if ("error" in check) return check.error;
    return jsonOk(await BookingService.listMessages(bookingId));
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const { bookingId } = await context.params;
    const body = await readJson<Body>(request);
    if (!body.message) return jsonOk({ message: "message is required." }, 422);
    return jsonOk(await BookingService.sendBookingMessage({ bookingId, authenticatedUserId: auth.id, message: body.message }), 201);
  } catch (error) { return handleApiError(error); }
}
