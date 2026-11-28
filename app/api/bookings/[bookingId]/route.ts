import { BookingService } from "@/lib/services";
import { requireUser, isResponse } from "@/lib/api/guards";
import { jsonError, jsonOk } from "@/lib/api/http";
import { BOOKING_UUID_REGEX, handleBookingApiError } from "@/lib/api/booking-http";

type Context = { params: Promise<{ bookingId: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const { bookingId } = await context.params;
    if (!BOOKING_UUID_REGEX.test(bookingId)) return jsonError("Invalid booking ID.", 400, "INVALID_BOOKING_ID");
    const booking = await BookingService.getBookingForParticipant(bookingId, auth.id, auth.roles.includes("ADMIN"));
    if (!booking) return jsonError("Booking not found.", 404, "NOT_FOUND");
    return jsonOk(booking);
  } catch (error) { return handleBookingApiError(error); }
}
