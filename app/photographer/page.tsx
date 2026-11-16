"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { PhotographerProfileMe, PublicBooking, PublicPhoto, PublicPortfolio } from "@/lib/types/public";
export default function PhotographerDashboardPage() {
  const { data: profile, loading: profileLoading, error: profileError } =
    useApi<PhotographerProfileMe | null>("/api/photographers/me");
  const { data: portfolios, loading: portfoliosLoading } = useApi<
    PublicPortfolio[] | null
  >("/api/portfolios");
  const { data: photos, loading: photosLoading } = useApi<PublicPhoto[] | null>(
    "/api/photos"
  );
  const { data: bookings, loading: bookingsLoading } = useApi<
    PublicBooking[] | null
  >("/api/bookings");

  const loading =
    profileLoading || portfoliosLoading || photosLoading || bookingsLoading;
  const pList = portfoliosLoading ? [] : (portfolios ?? []);
  const photoList = photosLoading ? [] : (photos ?? []);
  const bookingList = bookingsLoading ? [] : (bookings ?? []);
  const pendingCount = bookingList.filter(
    (b) => b.status === "PENDING"
  ).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-sm border line-border bg-surface">
              <div className="skeleton h2 mb-4" />
              <div className="skeleton line w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <EmptyState
        title="Unable to load dashboard"
        description={profileError}
      />
    );
  }

  const photographer = profile;
  const hasProfile = !!photographer;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[32px] tracking-tight font-bold">Dashboard</h1>
        <p className="text-muted">
          Manage your portfolio, availability, and booking requests.
        </p>
      </div>

      {!hasProfile && (
        <div className="p-6 rounded-sm border line-border bg-surface mb-6">
          <h2 className="text-lg font-bold mb-2">Complete your photographer profile</h2>
          <p className="text-muted text-sm mb-4">
            Add your title, bio, and contact details so clients can find and book you.
          </p>
          <Link href="/photographer/profile" className="button button-primary">
            Set up my profile
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-sm border line-border bg-surface">
          <p className="text-xs font-bold tracking-wider text-muted uppercase mb-2">Portfolios</p>
          <p className="text-[32px] font-bold">{pList.length}</p>
        </div>
        <div className="p-6 rounded-sm border line-border bg-surface">
          <p className="text-xs font-bold tracking-wider text-muted uppercase mb-2">Photos</p>
          <p className="text-[32px] font-bold">{photoList.length}</p>
        </div>
        <div className="p-6 rounded-sm border line-border bg-surface">
          <p className="text-xs font-bold tracking-wider text-muted uppercase mb-2">Incoming bookings</p>
          <p className="text-[32px] font-bold">{bookingList.length}</p>
        </div>
        <div className="p-6 rounded-sm border line-border bg-surface">
          <p className="text-xs font-bold tracking-wider text-muted uppercase mb-2">Pending responses</p>
          <p className="text-[32px] font-bold text-orange">{pendingCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-bold">Recent booking requests</h2>
            <Link
              href="/photographer/bookings"
              className="text-xs font-bold text-orange hover:underline"
            >
              View all &rarr;
            </Link>
          </div>
          {bookingList.length === 0 ? (
            <EmptyState
              title="No booking requests yet"
              description="Clients will send booking requests here once you're available."
              icon="\u270B\uFE0F"
            />
          ) : (
            <div className="space-y-4">
              {bookingList.slice(0, 3).map((b) => (
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
                        b.status === "PENDING"
                          ? "text-orange bg-orange/10 border border-orange/20"
                          : "text-muted bg-transparent border border-line-border"
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
            <Link href="/photographer/profile" className="button button-primary w-full">
              Edit my profile
            </Link>
            <Link href="/photographer/portfolio" className="button button-outline w-full">
              Manage portfolio
            </Link>
            <Link href="/photographer/availability" className="button button-outline w-full">
              Set availability
            </Link>
            {pendingCount > 0 && (
              <Link href="/photographer/bookings" className="button button-quiet w-full">
                Respond to {pendingCount} requests
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
