import { BookingService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { getPagination, handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Body = { photographerId?: string; title?: string; description?: string | null; photographyType?: string | null; location?: string | null; bookingDate?: string; startTime?: string; endTime?: string; budget?: number | null; bookingNumber?: string };

export async function GET(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const { limit, offset } = getPagination(new URL(request.url));
    if (auth.roles.includes("PHOTOGRAPHER")) {
      const bookings = await BookingService.listPhotographerBookings(auth.id, limit, offset);
      return jsonOk(bookings);
    }
    const bookings = await BookingService.listMyBookings(auth.id, limit, offset);
    return jsonOk(bookings);
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "CLIENT"); if (denied) return denied;
    const body = await readJson<Body>(request);
    if (!body.photographerId || !body.title || !body.bookingDate || !body.startTime || !body.endTime || !body.bookingNumber) {
      return jsonOk({ message: "photographerId, title, bookingDate, startTime, endTime and bookingNumber are required." }, 422);
    }
    const booking = await BookingService.requestBooking({
      authenticatedClientId: auth.id, photographerId: body.photographerId, title: body.title,
      description: body.description, photographyType: body.photographyType, location: body.location,
      bookingDate: body.bookingDate, startTime: body.startTime, endTime: body.endTime,
      budget: body.budget, bookingNumber: body.bookingNumber,
    });
    return jsonOk(booking, 201);
  } catch (error) { return handleApiError(error); }
}
