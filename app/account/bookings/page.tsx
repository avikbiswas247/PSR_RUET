"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { PublicBooking } from "@/lib/types/public";

export default function AccountBookingsPage() {
  const { data, loading, error } = useApi<PublicBooking[] | null>("/api/bookings");

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">My Bookings</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-6 rounded-sm border line-border bg-surface">
              <div className="skeleton h2 mb-4" />
              <div className="skeleton line w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState title="Unable to load bookings" description={error} />
    );
  }

  const bookings = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-tight font-bold">My Bookings</h1>
        <p className="text-muted text-sm">
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
        </p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="You haven&rsquo;t booked any photography sessions yet."
          action={{
            label: "Browse photographers",
            href: "/photographers",
          }}
          icon="\u270B\uFE0F"
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="p-6 rounded-sm border line-border bg-surface"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <Link
                    href={`/account/bookings/${b.id}`}
                    className="text-lg font-bold hover:text-orange"
                  >
                    {b.title || "Untitled booking"}
                  </Link>
                  <p className="text-sm text-muted">{b.booking_number}</p>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold border rounded px-3 py-1 ${
                    b.status === "CONFIRMED"
                      ? "text-orange border-orange/20 bg-orange/5"
                      : b.status === "PENDING"
                      ? "text-muted border-line-border bg-transparent"
                      : b.status === "ACCEPTED"
                      ? "text-orange border-orange/20 bg-orange/5"
                      : b.status === "REJECTED"
                      ? "text-orange-deep border-orange-deep/20 bg-orange-deep/5"
                      : b.status === "CANCELLED"
                      ? "text-muted border-line-border bg-transparent"
                      : "text-muted border-line-border bg-transparent"
                  }`}
                >
                  {b.status}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted mb-4">
                <div>
                  <p className="text-xs font-bold tracking-wider uppercase text-muted mb-1">Date</p>
                  <p>{new Date(b.booking_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wider uppercase text-muted mb-1">Time</p>
                  <p>{String(b.start_time)} &ndash; {String(b.end_time)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wider uppercase text-muted mb-1">Location</p>
                  <p>{b.location || "TBD"}</p>
                </div>
              </div>
              {b.description && (
                <p className="text-sm text-muted mb-4">{b.description}</p>
              )}
              <Link
                href={`/account/bookings/${b.id}`}
                className="text-xs font-bold text-orange hover:underline flex items-center gap-1"
              >
                View details &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
