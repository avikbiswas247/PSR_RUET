"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import { PublicBooking } from "@/lib/types/public";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";

export default function BookingConfirmPage({
  params,
}: {
  params: Promise<{ bookingNumber: string }>;
}) {
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { bookingNumber } = use(params);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch("/api/bookings?limit=100", { cache: "no-store" });
        if (!res.ok) throw new Error("Unable to load bookings.");
        const payload = await res.json();
        const data = payload?.data ?? payload;
        const bookings = Array.isArray(data) ? data : data ? [data] : [];
        const match = bookings.find((b) => b.booking_number === bookingNumber);
        setBooking(match ?? null);
        if (!match) setError("Booking reference not found.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load booking confirmation.");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingNumber]);

  if (loading) {
    return (
      <div className="section-pad max-w-[720px] mx-auto text-center">
        <h1 className="text-[40px] tracking-tight font-bold mb-8">Booking Confirmation</h1>
        <div className="p-8 rounded-sm border line-border bg-surface">
          <div className="skeleton h2 mb-4 w-1/3 mx-auto" />
          <div className="skeleton line w-full mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="section-pad max-w-[720px] mx-auto text-center">
        <h1 className="text-[40px] tracking-tight font-bold mb-8">Booking Not Found</h1>
        <p className="text-gray-400 mb-6">{error || "The booking reference could not be found."}</p>
        <Link href="/book" className="text-orange font-bold hover:underline">
          Browse photographers
        </Link>
      </div>
    );
  }

  const b = booking;
  return (
    <div className="section-pad max-w-[720px] mx-auto">
      <div className="flex items-center justify-between mb-10">
        <Link href="/book" className="text-sm text-orange font-bold hover:underline flex items-center gap-1">
          &#8592; Back to photographers
        </Link>
      </div>

      <div className="p-8 rounded-2xl border line-border bg-surface text-center">
        <div className="w-16 h-16 rounded-full bg-orange/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">&#127926;</span>
        </div>
        <h1 className="text-[32px] tracking-tight font-bold mb-4">Booking Request Sent</h1>
        <p className="text-lg text-muted mb-8">
          Your request is saved. The photographer will review it and respond before the session is confirmed.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="p-4 rounded-sm border line-border bg-surface-2 text-left">
            <p className="text-xs font-bold tracking-wider uppercase text-muted mb-1">Booking Reference</p>
            <p className="text-sm font-mono font-bold">{b.booking_number}</p>
          </div>
          <div className="p-4 rounded-sm border line-border bg-surface-2 text-left">
            <p className="text-xs font-bold tracking-wider uppercase text-muted mb-1">Status</p>
            <BookingStatusBadge status={b.status} />
          </div>
        </div>

        <div className="p-6 rounded-sm border line-border bg-surface-2 mb-8 text-left">
          <h3 className="text-sm font-bold text-white mb-4">Session Details</h3>
          <div className="space-y-3 text-sm text-gray-400">
            <p><span className="font-bold">Booking ID:</span> {b.id}</p>
            {b.photographer_profile?.full_name && <p><span className="font-bold">Photographer:</span> {b.photographer_profile.full_name}</p>}
            <p><span className="font-bold">Session:</span> {b.title || "Photography session"}</p>
            <p><span className="font-bold">Service:</span> {b.photography_type || "Not specified"}</p>
            <p><span className="font-bold">Date:</span> {new Date(`${String(b.booking_date).slice(0, 10)}T00:00:00`).toLocaleDateString()}</p>
            <p><span className="font-bold">Time:</span> {String(b.start_time).slice(0, 5)} &ndash; {String(b.end_time).slice(0, 5)}</p>
            <p><span className="font-bold">Location:</span> {b.location || "TBD"}</p>
            {b.budget != null && <p><span className="font-bold">Proposed budget:</span> BDT {Number(b.budget).toLocaleString()}</p>}
            {b.description && <p><span className="font-bold">Details:</span> {b.description}</p>}
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/account/bookings"
            className="button button-primary w-full py-3"
          >
            View My Bookings
          </Link>
          <Link
            href={b.photographer_profile?.id ? `/photographers/${b.photographer_profile.id}` : "/photographers"}
            className="button button-outline w-full py-3"
          >
            Return to Photographer Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
