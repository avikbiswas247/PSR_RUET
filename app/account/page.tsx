"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { PublicBooking, PublicNotification, PublicPhotographer } from "@/lib/types/public";

export default function AccountDashboardPage() {
  const { data: bookings, loading: bookingsLoading, error: bookingsError } =
    useApi<PublicBooking[] | null>("/api/bookings");
  const { data: photographers, loading: photographersLoading } = useApi<
    PublicPhotographer[] | null
  >("/api/photographers");
  const { data: notifications, loading: notificationsLoading } = useApi<
    PublicNotification[] | null
  >("/api/notifications");

  const bookingsList = bookingsLoading ? [] : (bookings ?? []);
  const availablePhotographers = photographersLoading ? [] : (photographers ?? []);
  const unreadCount = notificationsLoading
    ? 0
    : (notifications ?? []).filter((n) => !n.is_read).length;

  if (bookingsLoading || notificationsLoading || photographersLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-6 rounded-sm border line-border bg-surface">
              <div className="skeleton h2 mb-4" />
              <div className="skeleton line w-1/2" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 rounded-sm border line-border bg-surface">
              <div className="skeleton w-full h-full" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-3">
            <div className="p-6 rounded-sm border line-border bg-surface">
            <div className="skeleton h2 mb-4" />
            <div className="skeleton line w-full" />
            <div className="skeleton line w-2/3 mt-2" />
          </div>
        </div>
      </div>
    );
  }

  if (bookingsError) {
    return (
      <div className="p-6 rounded-sm border border-orange/30 bg-orange/5 text-orange-deep text-sm mb-6">
        {bookingsError}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[32px] tracking-tight font-bold">Dashboard</h1>
        <p className="text-muted">
          Welcome back. Here&rsquo;s what&rsquo;s happening with your PSR account.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-sm border line-border bg-surface">
          <p className="text-xs font-bold tracking-wider text-muted uppercase mb-2">Total bookings</p>
          <p className="text-[32px] font-bold">{bookingsList.length}</p>
        </div>
        <div className="p-6 rounded-sm border line-border bg-surface">
          <p className="text-xs font-bold tracking-wider text-muted uppercase mb-2">Unread notifications</p>
          <p className="text-[32px] font-bold text-orange">{unreadCount}</p>
        </div>
        <div className="p-6 rounded-sm border line-border bg-surface">
          <p className="text-xs font-bold tracking-wider text-muted uppercase mb-2">Photographers available</p>
          <p className="text-[32px] font-bold">{availablePhotographers.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-bold">Recent bookings</h2>
            <Link
              href="/account/bookings"
              className="text-xs font-bold text-orange hover:underline"
            >
              View all &rarr;
            </Link>
          </div>
          {bookingsList.length === 0 ? (
            <EmptyState
              title="No bookings yet"
              description="You haven&rsquo;t booked any photography sessions yet."
              action={{
                label: "Browse photographers",
                href: "/book",
              }}
              icon="\u270B\uFE0F"
            />
          ) : (
            <div className="space-y-4">
              {bookingsList.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-sm border line-border bg-surface flex items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-sm bg-surface-2 flex items-center justify-center">
                    <span className="text-muted">{b.booking_number}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold">{b.title || "Untitled booking"}</h3>
                    <p className="text-xs text-muted">{String(b.booking_date)} &bull; {String(b.start_time)} &ndash; {String(b.end_time)}</p>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold border rounded px-2 py-0.5 ${
                        b.status === "CONFIRMED"
                          ? "text-orange border-orange/20 bg-orange/5"
                          : b.status === "PENDING"
                          ? "text-muted border-line-border"
                          : "text-muted border-line-border"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-1">
          <div className="space-y-4">
            <Link href="/account/profile" className="button button-primary w-full">
              Complete my profile
            </Link>
            <Link href="/book" className="button button-outline w-full">
              Find a photographer
            </Link>
            {unreadCount > 0 ? (
              <Link href="/account/notifications" className="button button-quiet w-full">
                View {unreadCount} notifications
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Available Photographers Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold">Available Photographers</h2>
          <Link href="/book" className="text-xs font-bold text-orange hover:underline">
            Browse all &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availablePhotographers.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                title="No photographers available"
                description="No photographers are currently available for booking."
                icon="\u270B\uFE0F"
              />
            </div>
          ) : (
            availablePhotographers.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="border line-border rounded-sm overflow-hidden group"
              >
                <div className="photographer-card-media relative h-40 bg-surface-2 overflow-hidden">
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt={p.full_name || "Photographer"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted">
                      <span className="text-lg">{(p.full_name || "P").slice(0, 1).toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  {p.is_available ? (
                    <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider font-bold border border-orange/20 bg-orange/5 text-orange rounded px-2 py-0.5">
                      Available
                    </span>
                  ) : (
                    <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider font-bold border border-line-border rounded px-2 py-0.5 text-muted bg-transparent">
                      Unavailable
                    </span>
                  )}
                  <Link href={`/photographers/${p.id}`} className="text-lg font-bold hover:text-orange block mb-1">
                    {p.full_name || "Photographer"}
                  </Link>
                  {p.title && (
                    <span className="text-[10px] uppercase tracking-wider text-orange font-bold mb-2 block">
                      {p.title}
                    </span>
                  )}
                  {p.bio && (
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">{p.bio}</p>
                  )}
                  <Link
                    href={`/book/${p.id}`}
                    className="button button-primary w-full py-2 text-sm"
                  >
                    Book a Session
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
