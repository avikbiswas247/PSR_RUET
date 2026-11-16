"use client";

import Link from "next/link";
import { AdminTable } from "@/components/admin/table";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";

interface AdminBooking {
  id: string;
  booking_number: string;
  client_name: string | null;
  photographer_name: string | null;
  title: string | null;
  booking_date: string | Date;
  status: string;
  created_at: string | Date;
}

export default function AdminBookingsPage() {
  const { data, loading, error } = useApi<AdminBooking[] | null>(
    "/api/admin/bookings"
  );
  const bookings = loading ? [] : (data ?? []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">Bookings</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-sm border line-border bg-surface">
              <div className="skeleton h2 mb-4" />
              <div className="skeleton line w-full" />
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-tight font-bold">Bookings</h1>
        <p className="text-muted text-sm">{bookings.length} booking{bookings.length !== 1 ? "s" : ""}</p>
      </div>

      <AdminTable
        columns={[
          { key: "title", label: "Title" },
          { key: "client_name", label: "Client" },
          { key: "photographer_name", label: "Photographer" },
          { key: "booking_date", label: "Date", render: (v) => new Date(String(v)).toLocaleDateString() },
          { key: "status", label: "Status", render: (v) => (
            <span className={`text-[10px] uppercase tracking-wider font-bold border rounded px-2 py-0.5 ${
              v === "CONFIRMED" ? "text-orange bg-orange/20 border border-orange/30" : v === "PENDING" ? "text-orange border-orange/20 bg-orange/5" : "text-muted border-line-border"
             }`}>{String(v)}</span>
          )},
        ]}
        data={bookings}
        loading={loading}
        emptyTitle="No bookings"
        emptyDescription="There are no bookings in the system yet."
        emptyIcon="\u270B\uFE0F"
      />

      <div className="mt-8">
        {bookings.map((b) => (
          <div key={b.id} className="p-4 rounded-sm border line-border bg-surface">
            <div className="flex items-center justify-between">
              <Link
                href={`/portfolios/${b.id}`}
                className="text-sm font-bold hover:text-orange"
              >
                {b.title || "Untitled booking"}
              </Link>
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted border rounded px-2 py-0.5">{b.booking_number}</span>
            </div>
            <p className="text-sm text-muted">
              {b.client_name} &bull; {b.photographer_name} &bull; {b.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
