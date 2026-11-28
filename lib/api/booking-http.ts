import { BookingServiceError } from "@/lib/services/booking.service";
import { jsonError } from "@/lib/api/http";

const STATUS_BY_CODE: Record<string, number> = {
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
