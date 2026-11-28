"use client";

import { use } from "react";
import Link from "next/link";
import { useState } from "react";
import { useApi } from "@/lib/hooks/use-api";
import { PublicBooking } from "@/lib/types/public";
import { notFound } from "next/navigation";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";

export default function PhotographerBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const { data, loading, error } = useApi<PublicBooking | null>(
    `/api/bookings/${bookingId}`
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">Booking Details</h1>
        <div className="p-6 rounded-sm border line-border bg-surface">
          <div className="skeleton h2 mb-4" />
          <div className="skeleton line w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) notFound();

  const b = data;

  const updateStatus = async (status: string) => {
    if (["REJECTED", "CANCELLED"].includes(status) && !window.confirm(`Are you sure you want to ${status.toLowerCase()} this booking?`)) return;
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch(`/api/bookings/${b.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error?.message || json.message || "Unable to update booking status.");
      window.location.reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to update status.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-tight font-bold">Booking Details</h1>
        <Link href="/photographer/bookings" className="text-xs font-bold text-muted hover:text-orange">
          &larr; Back to bookings
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-sm border border-orange/30 bg-orange/5 text-orange text-sm">
          {error}
        </div>
      )}

      <div className="p-6 rounded-sm border line-border bg-surface">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[24px] font-bold">{b.title || "Untitled booking"}</h2>
            <p className="text-sm text-muted">{b.booking_number}</p>
          </div>
          <BookingStatusBadge status={b.status} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-muted mb-1">Service</p>
            <p className="text-muted">{b.photography_type || "Not specified"}</p>
          </div>
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
        {notice && <p role="alert" className="mt-5 rounded-sm border border-orange/30 bg-orange/5 p-3 text-sm text-orange">{notice}</p>}
        {b.description && (
          <div className="mt-6">
            <p className="text-xs font-bold tracking-wider uppercase text-muted mb-2">Message from client</p>
            <p className="text-muted">{b.description}</p>
          </div>
        )}
      </div>

      {b.client_profile && (
        <section className="rounded-sm border line-border bg-surface p-6">
          <h2 className="mb-4 text-[20px] font-bold">Client profile</h2>
          <div className="flex items-center gap-4">
            {b.client_profile.avatar_url ? (
              <img src={b.client_profile.avatar_url} alt="" className="h-16 w-16 rounded-full border line-border object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border line-border bg-surface-2 text-xl font-bold text-orange">
                {b.client_profile.full_name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-lg font-semibold">{b.client_profile.full_name}</p>
              {b.client_profile.organization_name && <p className="mt-1 text-sm text-muted">{b.client_profile.organization_name}</p>}
              <a href={`mailto:${b.client_profile.email}`} className="mt-1 block text-sm text-orange hover:underline">{b.client_profile.email}</a>
              {b.client_profile.phone && <a href={`tel:${b.client_profile.phone}`} className="mt-1 block text-sm text-orange hover:underline">{b.client_profile.phone}</a>}
              <p className="mt-1 text-xs text-muted">Joined {new Date(b.client_profile.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </section>
      )}

      {b.status === "PENDING" && (
        <div className="p-6 rounded-sm border line-border bg-surface space-y-3">
          <h2 className="text-[20px] font-bold mb-4">Respond to request</h2>
          <div className="flex gap-3">
            <button
              onClick={() => updateStatus("ACCEPTED")}
              className="button button-outline flex-1"
              disabled={busy}
            >
              Accept
            </button>
            <button
              onClick={() => updateStatus("REJECTED")}
              className="button button-outline flex-1"
              disabled={busy}
            >
              Reject
            </button>
            <button
              onClick={() => updateStatus("CANCELLED")}
              className="button button-outline flex-1"
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {(b.status === "ACCEPTED" || b.status === "CONFIRMED") && (
        <div className="p-6 rounded-sm border line-border bg-surface space-y-3">
          <h2 className="text-[20px] font-bold mb-4">Confirm or complete</h2>
          <div className="flex gap-3">
            {b.status === "ACCEPTED" && (
              <button
                onClick={() => updateStatus("CONFIRMED")}
                className="button button-outline flex-1"
                disabled={busy}
              >
                Confirm booking
              </button>
            )}
            <button
              onClick={() => updateStatus("CANCELLED")}
              className="button button-outline flex-1"
              disabled={busy}
            >
              Cancel booking
            </button>
            {b.status === "CONFIRMED" && (
              <button
                onClick={() => updateStatus("COMPLETED")}
                className="button button-primary flex-1"
                disabled={busy}
              >
                Mark completed
              </button>
            )}
          </div>
        </div>
      )}

      <div className="p-6 rounded-sm border line-border bg-surface">
        <h2 className="text-[20px] font-bold mb-4">Conversation</h2>
        <Link
            href={`/photographer/bookings/${bookingId}/messages`}
          className="button button-primary w-full"
        >
          Send &amp; read messages
        </Link>
      </div>
    </div>
  );
}
