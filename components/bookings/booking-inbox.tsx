"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { useApi } from "@/lib/hooks/use-api";
import { PublicBooking } from "@/lib/types/public";
import { formatDhakaDate, formatDhakaTime } from "@/lib/utils/dhaka-time";

function dateInDhaka(value: string | Date) {
  return formatDhakaDate(value, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

export function BookingInbox({ role }: { role: "CLIENT" | "PHOTOGRAPHER" }) {
  const { data, loading, error } = useApi<PublicBooking[] | null>("/api/bookings?limit=100");
  if (loading) return <div className="space-y-4"><h1 className="text-[32px] font-bold">Messages</h1>{[0, 1, 2].map((item) => <div key={item} className="skeleton h-28 rounded-sm" />)}</div>;
  if (error) return <EmptyState title="Unable to load conversations" description={error} />;
  const bookings = data ?? [];

  return <div className="space-y-6">
    <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">Your conversations</p><h1 className="mt-2 text-[32px] font-bold tracking-tight">Messages</h1><p className="mt-1 text-sm text-muted">Private conversations stay connected to their booking request.</p></div>
    {bookings.length === 0 ? <EmptyState title="No conversations yet" description={role === "CLIENT" ? "Request a session from a photographer to start a conversation." : "Client conversations will appear here when they request a session."} action={role === "CLIENT" ? { label: "Find a photographer", href: "/photographers" } : { label: "View bookings", href: "/photographer/bookings" }} /> : <div className="space-y-3">{bookings.map((booking) => {
      const participant = role === "CLIENT" ? booking.photographer_profile : booking.client_profile;
      const name = participant?.full_name || (role === "CLIENT" ? "Photographer" : "Client");
      const href = role === "CLIENT" ? `/account/bookings/${booking.id}/messages` : `/photographer/bookings/${booking.id}/messages`;
      return <Link key={booking.id} href={href} className="group flex items-start gap-3 rounded-sm border line-border bg-surface p-4 transition hover:border-orange/40 sm:gap-4 sm:p-5">
        {participant?.avatar_url ? <img src={participant.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full border line-border object-cover" /> : <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border line-border bg-orange/10 font-bold text-orange">{name.slice(0, 1).toUpperCase()}</span>}
        <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold group-hover:text-orange">{name}</span><BookingStatusBadge status={booking.status} /></span><span className="mt-1 block text-xs text-muted">{booking.title || "Photography session"} · {booking.photography_type || "Service not specified"}</span><span className="mt-2 block text-xs text-muted">{dateInDhaka(booking.booking_date)} · {formatDhakaTime(booking.start_time)}–{formatDhakaTime(booking.end_time)} Dhaka time</span><span className="mt-2 line-clamp-2 block text-sm text-muted">{booking.description || "No initial booking message."}</span><span className="mt-3 inline-flex min-h-9 items-center text-xs font-bold text-orange">Open conversation →</span></span>
      </Link>;
    })}</div>}
  </div>;
}
