import { BookingService } from "@/lib/services";
import { requireUser, isResponse } from "@/lib/api/guards";
import { jsonOk } from "@/lib/api/http";
import { handleBookingApiError } from "@/lib/api/booking-http";

type Context = { params: Promise<{ bookingId: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const { bookingId } = await context.params;
    const booking = await BookingService.getBookingForParticipant(bookingId, auth.id, auth.roles.includes("ADMIN"));
    if (!booking) return jsonOk({ message: "Booking not found." }, 404);
    return jsonOk(booking);
  } catch (error) { return handleBookingApiError(error); }
}
