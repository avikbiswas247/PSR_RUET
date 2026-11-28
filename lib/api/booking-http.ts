import { BookingServiceError } from "@/lib/services/booking.service";
import { jsonError } from "@/lib/api/http";

export const BOOKING_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function readBookingJson<T>(request: Request): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new BookingServiceError("Request body must be valid JSON.", "INVALID_REQUEST");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new BookingServiceError("Request body must be a JSON object.", "INVALID_REQUEST");
  }
  return body as T;
}

const STATUS_BY_CODE: Record<string, number> = {
  INVALID_REQUEST: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  SLOT_UNAVAILABLE: 409,
  SLOT_CONFLICT: 409,
  PHOTOGRAPHER_UNAVAILABLE: 409,
  INVALID_TRANSITION: 409,
  INVALID_TITLE: 422,
  INVALID_MESSAGE: 422,
  INVALID_SERVICE: 422,
  INVALID_LOCATION: 422,
  INVALID_DATE: 422,
  PAST_DATE: 422,
  DATE_OUT_OF_RANGE: 422,
  INVALID_TIME: 422,
  INVALID_BUDGET: 422,
  UPDATE_FAILED: 500,
};

export function handleBookingApiError(error: unknown) {
  if (error instanceof BookingServiceError) {
    const status = STATUS_BY_CODE[error.code] ?? 400;
    return jsonError(error.message, status, error.code);
  }
  console.error("[Booking API] Request failed:", error instanceof Error ? error.stack : String(error));
  return jsonError("Unable to complete this booking request. Please try again.", 500, "BOOKING_ERROR");
}
