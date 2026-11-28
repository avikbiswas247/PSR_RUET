"use client";

import { use } from "react";
import { BookingMessagePanel } from "@/components/bookings/booking-message-panel";

export default function PhotographerBookingMessagesPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  return <BookingMessagePanel bookingId={bookingId} backHref={`/photographer/bookings/${bookingId}`} />;
}
