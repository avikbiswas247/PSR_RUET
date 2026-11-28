"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { ClientDashboardData, PublicNotification, PublicPhotographer } from "@/lib/types/public";

function dhakaDate(value: string | Date) {
  const date = String(value).slice(0, 10);
  return new Date(`${date}T00:00:00+06:00`).toLocaleDateString(undefined, {
    timeZone: "Asia/Dhaka", weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
}

function dhakaTime(value: string | Date) {
  return String(value).slice(0, 5);
}

function isInternalWorkspaceLink(value: string | null) {
  return !!value && value.startsWith("/") && !value.startsWith("//");
}

export default function AccountDashboardPage() {
  const { user } = useAuth();
  const { data: dashboard, loading: bookingsLoading, error: bookingsError } = useApi<ClientDashboardData>("/api/bookings?view=dashboard");
  const { data: photographers, loading: photographersLoading } = useApi<PublicPhotographer[]>("/api/photographers?availableOnly=true&limit=3");
  const { data: activity, loading: activityLoading } = useApi<PublicNotification[]>("/api/notifications?limit=6");
  const { data: unreadData } = useApi<{ unreadCount: number }>("/api/notifications?unreadCount=true");
  const busy = bookingsLoading || photographersLoading || activityLoading;
  const summary = dashboard?.summary ?? { total: 0, pending: 0, accepted: 0, upcoming_confirmed: 0, completed: 0 };
  const upcoming = dashboard?.upcoming ?? [];
  const availablePhotographers = photographers ?? [];
  const unreadCount = unreadData?.unreadCount ?? 0;
  const today = new Date().toLocaleDateString(undefined, { timeZone: "Asia/Dhaka", weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const firstName = user?.full_name?.trim().split(/\s+/)[0] || user?.fullName?.trim().split(/\s+/)[0] || "there";
  const notifiedBookingIds = new Set((activity ?? []).map((item) => item.link_url?.match(/\/bookings\/([^/?]+)/)?.[1]).filter((id): id is string => !!id));
  const submittedRequests = (dashboard?.recent ?? []).filter((booking) => !notifiedBookingIds.has(booking.id)).map((booking) => ({
    id: `submitted-${booking.id}`,
    title: "Booking request submitted",
    message: `${booking.title || "Photography session"} · ${booking.booking_number}`,
    created_at: booking.created_at,
    link_url: `/account/bookings/${booking.id}`,
    is_read: true,
  }));
  const activityItems = [...(activity ?? []), ...submittedRequests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);

  if (busy && !dashboard) {
    return <div className="space-y-6"><div className="skeleton h-28 rounded-sm" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[0, 1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-24 rounded-sm" />)}</div><div className="skeleton h-72 rounded-sm" /></div>;
  }
  if (bookingsError) return <div role="alert" className="rounded-sm border border-orange/30 bg-orange/5 p-5 text-sm text-orange">{bookingsError}</div>;

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 rounded-sm border line-border bg-surface p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">Client workspace · {today}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Good day, {firstName}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">Manage your photography requests, upcoming sessions, and conversations in one place.</p>
        </div>
        <Link href="/photographers" className="button button-primary inline-flex min-h-11 items-center justify-center gap-2">Book a photographer <ArrowRight size={16} /></Link>
      </section>

      <section aria-label="Booking overview" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {[
          ["Total bookings", summary.total],
          ["Pending requests", summary.pending],
          ["Accepted", summary.accepted],
          ["Confirmed upcoming", summary.upcoming_confirmed],
          ["Completed", summary.completed],
        ].map(([label, value]) => <article key={label} className="rounded-sm border line-border bg-surface p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p><p className="mt-2 text-3xl font-bold text-text">{value}</p></article>)}
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <section className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">Your calendar</p><h2 className="mt-1 text-xl font-bold">Upcoming requests and sessions</h2></div><Link href="/account/bookings" className="shrink-0 text-xs font-bold text-orange hover:underline">All bookings →</Link></div>
          {upcoming.length === 0 ? <EmptyState compact title="No upcoming sessions" description="When you request a session, it will appear here with its current status." action={{ label: "Find a photographer", href: "/photographers" }} /> : <div className="space-y-3">{upcoming.map((booking) => <Link key={booking.id} href={`/account/bookings/${booking.id}`} className="group block rounded-sm border line-border bg-surface p-4 transition hover:border-orange/40 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              {booking.photographer_profile?.avatar_url ? <img src={booking.photographer_profile.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full border line-border object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border line-border bg-surface-2 font-bold text-orange">{booking.photographer_profile?.full_name?.slice(0, 1) || "P"}</div>}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="truncate font-bold group-hover:text-orange">{booking.title || "Photography session"}</h3><BookingStatusBadge status={booking.status} /></div>
                <p className="mt-1 text-sm text-muted">{booking.photographer_profile?.full_name || "Photographer"}{booking.photography_type ? ` · ${booking.photography_type}` : ""}</p>
                <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} className="text-orange" />{dhakaDate(booking.booking_date)}</span>
                  <span className="inline-flex items-center gap-1.5"><Clock3 size={14} className="text-orange" />{dhakaTime(booking.start_time)}–{dhakaTime(booking.end_time)} Dhaka time</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-orange" />{booking.location || "Location to be arranged"}</span>
                  <span className="truncate">Booking {booking.booking_number}</span>
                </div>
              </div>
            </div>
          </Link>)}</div>}
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">Updates</p><h2 className="mt-1 text-xl font-bold">Recent activity</h2></div><Link href="/account/notifications" className="text-xs font-bold text-orange hover:underline">{unreadCount} unread</Link></div>
          {activityItems.length === 0 ? <EmptyState compact title="No recent activity" description="Booking and message updates will appear here." /> : <div className="divide-y divide-line-border rounded-sm border line-border bg-surface">{activityItems.map((item) => <Link key={item.id} href={isInternalWorkspaceLink(item.link_url) ? item.link_url! : "/account/notifications"} className="block p-4 transition hover:bg-surface-2"><div className="flex items-start gap-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.is_read ? "bg-muted/40" : "bg-orange"}`} /><div className="min-w-0"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted">{item.message}</p><p className="mt-2 text-[10px] uppercase tracking-wider text-muted">{new Date(item.created_at).toLocaleString(undefined, { timeZone: "Asia/Dhaka" })} · Dhaka time</p></div></div></Link>)}</div>}
        </section>
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">Selected photographers</p><h2 className="mt-1 text-xl font-bold">Find your next collaborator</h2></div><Link href="/photographers" className="text-xs font-bold text-orange hover:underline">Browse all →</Link></div>
        {availablePhotographers.length === 0 ? <EmptyState compact title="No photographers with open slots" description="Check the directory again later for new availability." /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{availablePhotographers.slice(0, 3).map((photographer) => <article key={photographer.id} className="overflow-hidden rounded-sm border line-border bg-surface">
          <Link href={`/photographers/${photographer.id}`} className="group relative block h-40 overflow-hidden bg-surface-2">{photographer.avatar_url ? <img src={photographer.avatar_url} alt={photographer.full_name || "Photographer"} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-3xl font-bold text-orange">{photographer.full_name?.slice(0, 1) || "P"}</div>}<span className="absolute left-3 top-3 rounded-full border border-green/30 bg-bg/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green">Available</span></Link>
          <div className="p-4"><Link href={`/photographers/${photographer.id}`} className="font-bold hover:text-orange">{photographer.full_name || "Photographer"}</Link><p className="mt-1 text-xs text-orange">{photographer.photography_genre || "Photographer"}</p><p className="mt-1 line-clamp-1 text-xs text-muted">{photographer.location || "Location not listed"}</p><div className="mt-4 flex gap-2"><Link href={`/photographers/${photographer.id}`} className="button button-outline min-h-10 flex-1 justify-center text-xs">Profile</Link><Link href={`/book/${photographer.id}`} className="button button-primary min-h-10 flex-1 justify-center text-xs">Book</Link></div></div>
        </article>)}</div>}
      </section>

      <section className="flex flex-wrap gap-2 border-t line-border pt-5" aria-label="Quick actions"><Link href="/photographers" className="button button-quiet min-h-10">Find a photographer</Link><Link href="/account/bookings" className="button button-quiet min-h-10">View all bookings</Link><Link href="/account/messages" className="button button-quiet min-h-10">View messages</Link><Link href="/account/profile" className="button button-quiet min-h-10">Edit profile</Link><Link href="/account/notifications" className="button button-quiet min-h-10">Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}</Link></section>
    </div>
  );
}
