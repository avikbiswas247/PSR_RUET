import { BookingService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { getPagination, jsonError, jsonOk, readJson } from "@/lib/api/http";
import { handleBookingApiError } from "@/lib/api/booking-http";

type Body = { photographerId?: string; title?: string; description?: string | null; photographyType?: string | null; location?: string | null; bookingDate?: string; startTime?: string; endTime?: string; budget?: number | null; bookingNumber?: string };
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const { limit, offset } = getPagination(new URL(request.url));
    if (auth.roles.includes("ADMIN")) return jsonOk(await BookingService.listAdminBookings(limit, offset));
    if (auth.roles.includes("PHOTOGRAPHER")) {
      const bookings = await BookingService.listPhotographerBookings(auth.id, limit, offset);
      return jsonOk(bookings);
    }
    if (!auth.roles.includes("CLIENT")) return jsonError("A client or photographer account is required.", 403, "FORBIDDEN");
    const bookings = await BookingService.listMyBookings(auth.id, limit, offset);
    return jsonOk(bookings);
  } catch (error) { return handleBookingApiError(error); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "CLIENT"); if (denied) return denied;
    const body = await readJson<Body>(request);
    if (typeof body.photographerId !== "string" || !UUID_REGEX.test(body.photographerId)
      || typeof body.title !== "string" || typeof body.description !== "string" || !body.description.trim()
      || typeof body.bookingDate !== "string" || typeof body.startTime !== "string" || typeof body.endTime !== "string"
      || (body.photographyType != null && typeof body.photographyType !== "string")
      || (body.location != null && typeof body.location !== "string")) {
      return jsonError("photographerId, title, booking message, bookingDate, startTime and endTime are required.", 422, "MISSING_FIELDS");
    }
    if (body.budget !== undefined && body.budget !== null && (typeof body.budget !== "number" || !Number.isFinite(body.budget))) {
      return jsonError("Budget must be a valid number.", 422, "INVALID_BUDGET");
    }
    const booking = await BookingService.requestBooking({
      authenticatedClientId: auth.id, photographerId: body.photographerId, title: body.title,
      description: body.description, photographyType: body.photographyType, location: body.location,
      bookingDate: body.bookingDate, startTime: body.startTime, endTime: body.endTime,
      budget: body.budget,
    });
    return jsonOk(booking, 201);
  } catch (error) { return handleBookingApiError(error); }
}
