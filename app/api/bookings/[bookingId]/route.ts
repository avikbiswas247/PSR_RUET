import { BookingService } from "@/lib/services";
import { requireUser, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk } from "@/lib/api/http";

type Context = { params: Promise<{ bookingId: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const { bookingId } = await context.params;
    const booking = await BookingService.getMyBooking(bookingId, auth.id);
    if (!booking) return jsonOk({ message: "Booking not found." }, 404);
    return jsonOk(booking);
  } catch (error) { return handleApiError(error); }
}
