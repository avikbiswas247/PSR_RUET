"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { PublicBooking } from "@/lib/types/public";

const FILTERS = ["ALL", "PENDING", "ACCEPTED", "CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED"] as const;
type Filter = (typeof FILTERS)[number];

function displayDate(value: string | Date) {
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function PhotographerBookingsPage() {
  const { data, loading, error } = useApi<PublicBooking[] | null>("/api/bookings?limit=100");
  const [filter, setFilter] = useState<Filter>("ALL");
  const bookings = useMemo(() => loading ? [] : (data ?? []), [data, loading]);
  const visibleBookings = useMemo(() => bookings.filter((booking) => filter === "ALL" || booking.status === filter), [bookings, filter]);

  if (loading) return <div className="space-y-6"><h1 className="text-[32px] tracking-tight font-bold">Booking requests</h1>{[0, 1, 2].map((i) => <div key={i} className="rounded-sm border line-border bg-surface p-6"><div className="skeleton h2 mb-4" /><div className="skeleton line w-3/4" /></div>)}</div>;
  if (error) return <EmptyState title="Unable to load bookings" description={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[0.2em] text-orange">Your calendar</p><h1 className="mt-2 text-[32px] tracking-tight font-bold">Booking requests</h1><p className="mt-1 text-sm text-muted">Review each client request and respond from its details.</p></div>
        <p className="text-sm text-muted">{bookings.filter((booking) => booking.status === "PENDING").length} pending</p>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Filter booking requests">
        {FILTERS.map((status) => <button key={status} type="button" onClick={() => setFilter(status)} aria-pressed={filter === status} className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${filter === status ? "border-orange bg-orange/10 text-orange" : "border-line-border text-muted hover:border-orange hover:text-orange"}`}>{status === "ALL" ? "All" : status.toLowerCase()}</button>)}
      </div>
      {visibleBookings.length === 0 ? (
        <EmptyState title={bookings.length === 0 ? "No booking requests yet" : `No ${filter.toLowerCase()} bookings`} description={bookings.length === 0 ? "Client requests will appear here when they choose one of your available slots." : "Choose another filter to view your booking requests."} action={bookings.length === 0 ? { label: "Manage availability", href: "/photographer/availability" } : undefined} />
      ) : (
        <div className="space-y-4">
          {visibleBookings.map((booking) => (
            <article key={booking.id} className="rounded-sm border line-border bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-[10px] uppercase tracking-wider text-muted">{booking.booking_number}</p><h2 className="mt-1 text-xl font-bold">{booking.title || "Photography session"}</h2><p className="mt-1 text-sm text-muted">{booking.client_profile?.full_name || "Client"}{booking.client_profile?.organization_name ? ` · ${booking.client_profile.organization_name}` : ""}</p>{booking.client_profile?.email && <a href={`mailto:${booking.client_profile.email}`} className="mt-1 inline-block text-xs text-orange hover:underline">{booking.client_profile.email}</a>}</div>
                <BookingStatusBadge status={booking.status} />
              </div>
              <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="text-[10px] uppercase tracking-wider text-muted">Service</dt><dd className="mt-1">{booking.photography_type || "Not specified"}</dd></div>
                <div><dt className="text-[10px] uppercase tracking-wider text-muted">Date and time</dt><dd className="mt-1">{displayDate(booking.booking_date)} · {String(booking.start_time).slice(0, 5)}–{String(booking.end_time).slice(0, 5)}</dd></div>
                <div><dt className="text-[10px] uppercase tracking-wider text-muted">Location</dt><dd className="mt-1">{booking.location || "To be arranged"}</dd></div>
                <div><dt className="text-[10px] uppercase tracking-wider text-muted">Proposed budget</dt><dd className="mt-1">{booking.budget == null ? "Not specified" : `BDT ${Number(booking.budget).toLocaleString()}`}</dd></div>
              </dl>
              {booking.description && <p className="mt-4 line-clamp-2 text-sm text-muted">{booking.description}</p>}
              <div className="mt-5 flex justify-end border-t line-border pt-4"><Link href={`/photographer/bookings/${booking.id}`} className="text-xs font-bold text-orange hover:underline">Review request and client profile →</Link></div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
