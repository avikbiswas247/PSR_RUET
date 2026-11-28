"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useApi } from "@/lib/hooks/use-api";
import { PublicBooking } from "@/lib/types/public";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";

function formatDate(value: string | Date) {
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function AccountBookingDetailPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const { data, loading, error } = useApi<PublicBooking | null>(`/api/bookings/${bookingId}`);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const updateStatus = async (status: "CANCELLED" | "CONFIRMED") => {
    if (status === "CANCELLED" && !window.confirm("Cancel this booking request?")) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error?.message || payload.message || "Unable to cancel this booking.");
      window.location.reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to cancel this booking.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="space-y-6"><h1 className="text-[32px] tracking-tight font-bold">Booking Details</h1><div className="rounded-sm border line-border bg-surface p-6"><div className="skeleton h2 mb-4" /><div className="skeleton line w-full" /></div></div>;
  if (error || !data) notFound();
  const booking = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[0.2em] text-orange">Booking {booking.booking_number}</p><h1 className="mt-2 text-[32px] tracking-tight font-bold">{booking.title || "Session details"}</h1></div>
        <Link href="/account/bookings" className="text-xs font-bold text-muted hover:text-orange">← Back to bookings</Link>
      </div>
      <section className="rounded-sm border line-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-lg font-bold">Session information</h2><BookingStatusBadge status={booking.status} /></div>
        <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-[10px] uppercase tracking-wider text-muted">Photographer service</dt><dd className="mt-1">{booking.photography_type || "Not specified"}</dd></div>
          <div><dt className="text-[10px] uppercase tracking-wider text-muted">Date</dt><dd className="mt-1">{formatDate(booking.booking_date)}</dd></div>
          <div><dt className="text-[10px] uppercase tracking-wider text-muted">Time</dt><dd className="mt-1">{String(booking.start_time).slice(0, 5)}–{String(booking.end_time).slice(0, 5)}</dd></div>
          <div><dt className="text-[10px] uppercase tracking-wider text-muted">Location</dt><dd className="mt-1">{booking.location || "To be arranged"}</dd></div>
          <div><dt className="text-[10px] uppercase tracking-wider text-muted">Proposed budget</dt><dd className="mt-1">{booking.budget == null ? "Not specified" : `BDT ${Number(booking.budget).toLocaleString()}`}</dd></div>
          <div><dt className="text-[10px] uppercase tracking-wider text-muted">Requested</dt><dd className="mt-1">{new Date(booking.created_at).toLocaleDateString()}</dd></div>
        </dl>
        <div className="mt-5 border-t line-border pt-4"><p className="text-[10px] uppercase tracking-wider text-muted">Your message</p><p className="mt-2 whitespace-pre-wrap text-sm">{booking.description}</p></div>
      </section>

      {booking.photographer_profile && <section className="rounded-sm border line-border bg-surface p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold">Photographer</h2>
        <div className="flex items-center gap-4">
          {booking.photographer_profile.avatar_url ? <img src={booking.photographer_profile.avatar_url} alt="" className="h-14 w-14 rounded-full border line-border object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-full border line-border bg-surface-2 font-bold text-orange">{booking.photographer_profile.full_name?.slice(0, 1) || "P"}</div>}
          <div><p className="font-semibold">{booking.photographer_profile.full_name}</p><p className="mt-1 text-sm text-muted">{booking.photographer_profile.photography_genre || booking.photographer_profile.title}</p>{booking.photographer_profile.location && <p className="mt-1 text-sm text-muted">{booking.photographer_profile.location}</p>}</div>
        </div>
      </section>}

      {notice && <p role="alert" className="rounded-sm border border-orange/30 bg-orange/5 p-3 text-sm text-orange">{notice}</p>}
      {["PENDING", "ACCEPTED", "CONFIRMED"].includes(booking.status) && <section className="rounded-sm border line-border bg-surface p-5">
        <h2 className="text-lg font-bold">Booking actions</h2><p className="mt-1 text-sm text-muted">Confirm a photographer’s accepted request or cancel if your plans have changed.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {booking.status === "ACCEPTED" && <button type="button" onClick={() => updateStatus("CONFIRMED")} disabled={busy} className="button button-primary">{busy ? "Updating…" : "Confirm booking"}</button>}
          <button type="button" onClick={() => updateStatus("CANCELLED")} disabled={busy} className="button button-outline border-orange/30 text-orange hover:bg-orange/5">{busy ? "Updating…" : "Cancel booking"}</button>
        </div>
      </section>}
      <section className="rounded-sm border line-border bg-surface p-5">
        <h2 className="text-lg font-bold">Conversation</h2><p className="mt-1 text-sm text-muted">Message your photographer about this request.</p>
        <Link href={`/account/bookings/${bookingId}/messages`} className="button button-primary mt-4 inline-flex">Open conversation</Link>
      </section>
    </div>
  );
}
