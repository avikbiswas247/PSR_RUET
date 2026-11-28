import { BookingService } from "@/lib/services";
import { requireUser, isResponse } from "@/lib/api/guards";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";
import { handleBookingApiError } from "@/lib/api/booking-http";

type Context = { params: Promise<{ bookingId: string }> };
type Body = { status?: "ACCEPTED" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "COMPLETED" };

export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const { bookingId } = await context.params;
    const body = await readJson<Body>(request);
    const allowed = ["ACCEPTED", "CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED"] as const;
    if (!body.status || !allowed.includes(body.status)) return jsonError("Choose a valid booking status.", 422, "INVALID_STATUS");
    if (!auth.roles.some((role) => ["CLIENT", "PHOTOGRAPHER", "ADMIN"].includes(role))) {
      return jsonError("This account cannot update bookings.", 403, "FORBIDDEN");
    }
    return jsonOk(await BookingService.setBookingStatus({ bookingId, actorUserId: auth.id, actorRoles: auth.roles, status: body.status }));
  } catch (error) { return handleBookingApiError(error); }
}
