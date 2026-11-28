"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { useApi } from "@/lib/hooks/use-api";
import { PublicBooking } from "@/lib/types/public";
import { dhakaDateString, formatDhakaDate, formatDhakaTime } from "@/lib/utils/dhaka-time";

const FILTERS = ["ALL", "PENDING", "ACCEPTED", "CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED"] as const;
type Filter = (typeof FILTERS)[number];
type Sort = "newest" | "oldest" | "upcoming";

function displayDate(value: string | Date) {
  return formatDhakaDate(value, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function displayTime(value: string | Date) {
  return formatDhakaTime(value);
}

export default function AccountBookingsPage() {
  const { data, loading, error } = useApi<PublicBooking[] | null>("/api/bookings?limit=100");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("newest");

  const bookings = useMemo(() => {
    const filtered = (data ?? []).filter((booking) => filter === "ALL" || booking.status === filter);
    return [...filtered].sort((a, b) => {
      if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === "upcoming") {
        const today = dhakaDateString();
        const aDate = String(a.booking_date).slice(0, 10);
        const bDate = String(b.booking_date).slice(0, 10);
        const aUpcoming = aDate >= today;
        const bUpcoming = bDate >= today;
        if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
        const byDate = aDate.localeCompare(bDate);
        return byDate || displayTime(a.start_time).localeCompare(displayTime(b.start_time));
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [data, filter, sort]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">My Bookings</h1>
        {[0, 1, 2].map((i) => <div key={i} className="rounded-sm border line-border bg-surface p-6"><div className="skeleton h2 mb-4" /><div className="skeleton line w-3/4" /></div>)}
      </div>
    );
  }
  if (error) return <EmptyState title="Unable to load bookings" description={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-orange">Your sessions</p>
          <h1 className="mt-2 text-[32px] tracking-tight font-bold">My Bookings</h1>
          <p className="mt-1 text-sm text-muted">Track requests and manage your upcoming sessions.</p>
        </div>
        <p className="text-sm text-muted">{bookings.length} shown</p>
      </div>

      <div className="flex flex-col gap-3 rounded-sm border line-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="Filter bookings">
          {FILTERS.map((status) => (
            <button key={status} type="button" onClick={() => setFilter(status)} aria-pressed={filter === status}
              className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${filter === status ? "border-orange bg-orange/10 text-orange" : "border-line-border text-muted hover:border-orange hover:text-orange"}`}>
              {status === "ALL" ? "All" : status.toLowerCase()}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-muted">
          Sort
          <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="rounded-sm border line-border bg-surface-2 px-3 py-2 text-text">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="upcoming">Upcoming sessions</option>
          </select>
        </label>
      </div>

      {bookings.length === 0 ? (
        <EmptyState title={filter === "ALL" ? "No bookings yet" : `No ${filter.toLowerCase()} bookings`} description={filter === "ALL" ? "Browse the PSR photographer directory to request a session." : "Choose another status filter to view your bookings."} action={filter === "ALL" ? { label: "Browse photographers", href: "/photographers" } : undefined} />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <article key={booking.id} className="rounded-sm border line-border bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  {booking.photographer_profile?.avatar_url ? <img src={booking.photographer_profile.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full border line-border object-cover" /> : <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border line-border bg-orange/10 font-bold text-orange">{booking.photographer_profile?.full_name?.slice(0, 1) || "P"}</span>}
                  <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted">{booking.booking_number}</p>
                  <h2 className="mt-1 text-xl font-bold">{booking.title || "Photography session"}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {booking.photographer_profile?.full_name ? `With ${booking.photographer_profile.full_name}` : "Photographer"}
                    {booking.photographer_profile?.photography_genre ? ` · ${booking.photographer_profile.photography_genre}` : ""}
                  </p>
                  </div>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
              <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="text-[10px] uppercase tracking-wider text-muted">Service</dt><dd className="mt-1">{booking.photography_type || "Not specified"}</dd></div>
                <div><dt className="text-[10px] uppercase tracking-wider text-muted">Date and time</dt><dd className="mt-1">{displayDate(booking.booking_date)} · {displayTime(booking.start_time)}–{displayTime(booking.end_time)}</dd></div>
                <div><dt className="text-[10px] uppercase tracking-wider text-muted">Location</dt><dd className="mt-1">{booking.location || "To be arranged"}</dd></div>
                <div><dt className="text-[10px] uppercase tracking-wider text-muted">Proposed budget</dt><dd className="mt-1">{booking.budget == null ? "Not specified" : `BDT ${Number(booking.budget).toLocaleString()}`}</dd></div>
              </dl>
              {booking.description && <p className="mt-4 line-clamp-2 text-sm text-muted">{booking.description}</p>}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t line-border pt-4">
                <p className="text-xs text-muted">Requested {new Date(booking.created_at).toLocaleDateString()}</p>
                <Link href={`/account/bookings/${booking.id}`} className="text-xs font-bold text-orange hover:underline">View booking details →</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
