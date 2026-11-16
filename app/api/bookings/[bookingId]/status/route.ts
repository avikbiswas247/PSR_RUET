import { BookingService } from "@/lib/services";
import { requireUser, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Context = { params: Promise<{ bookingId: string }> };
type Body = { status?: "ACCEPTED" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "COMPLETED" };

export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const { bookingId } = await context.params;
    const body = await readJson<Body>(request);
    if (!body.status) return jsonOk({ message: "status is required." }, 422);
    const actorRole = auth.roles.find(r => ["CLIENT", "PHOTOGRAPHER", "ADMIN"].includes(r)) as "CLIENT" | "PHOTOGRAPHER" | "ADMIN" | undefined;
    if (!actorRole) return jsonOk({ message: "This account cannot update bookings." }, 403);
    return jsonOk(await BookingService.setBookingStatus({ bookingId, actorUserId: auth.id, actorRole, status: body.status }));
  } catch (error) { return handleApiError(error); }
}
