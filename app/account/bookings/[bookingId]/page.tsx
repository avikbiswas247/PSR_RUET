"use client";

import { use } from "react";
import Link from "next/link";
import { useApi } from "@/lib/hooks/use-api";
import { PublicBooking } from "@/lib/types/public";
import { notFound } from "next/navigation";

export default function AccountBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const { data, loading, error } = useApi<PublicBooking | null>(
    `/api/bookings/${bookingId}`
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">Booking Details</h1>
        <div className="p-6 rounded-sm border line-border bg-surface">
          <div className="skeleton h2 mb-4" />
          <div className="skeleton line w-full" />
          <div className="skeleton line w-1/2 mt-2" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    notFound();
  }

  const b = data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-tight font-bold">Booking Details</h1>
        <Link href="/account/bookings" className="text-xs font-bold text-muted hover:text-orange">
          &larr; Back to bookings
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-sm border border-orange/30 bg-orange/5 text-orange-deep text-sm">
          {error}
        </div>
      )}

      <div className="p-6 rounded-sm border line-border bg-surface">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[24px] font-bold">{b.title || "Untitled booking"}</h2>
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
                : b.status === "COMPLETED"
                ? "text-muted border-line-border bg-transparent"
                : "text-muted border-line-border bg-transparent"
            }`}
          >
            {b.status}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-muted mb-1">Date</p>
            <p className="text-muted">
              {new Date(b.booking_date).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-muted mb-1">Time</p>
            <p className="text-muted">{String(b.start_time)} &ndash; {String(b.end_time)}</p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-muted mb-1">Location</p>
            <p className="text-muted">{b.location || "TBD"}</p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-muted mb-1">Budget</p>
            <p className="text-muted">{b.budget ? `BDT ${b.budget}` : "Not specified"}</p>
          </div>
        </div>
        {b.description && (
          <div className="mt-6">
            <p className="text-xs font-bold tracking-wider uppercase text-muted mb-2">Description</p>
            <p className="text-muted">{b.description}</p>
          </div>
        )}
      </div>

      <div className="p-6 rounded-sm border line-border bg-surface">
        <h2 className="text-[20px] font-bold mb-4">Conversation</h2>
        <Link
            href={`/account/bookings/${bookingId}/messages`}
          className="button button-primary w-full"
        >
          Send &amp; read messages
        </Link>
      </div>
    </div>
  );
}
