"use client";

import { AdminTable } from "@/components/admin/table";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";

interface AdminPhotographer {
  id: string;
  full_name: string | null;
  email: string | null;
  title: string | null;
  is_available: boolean;
  roles: string[];
  created_at: string | Date;
}

export default function AdminPhotographersPage() {
  const { data, loading, error } = useApi<AdminPhotographer[] | null>(
    "/api/admin/photographers"
  );
  const photographers = loading ? [] : (data ?? []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">Photographers</h1>
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
      <EmptyState title="Unable to load photographers" description={error} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-tight font-bold">Photographers</h1>
        <p className="text-muted text-sm">{photographers.length} photographer{photographers.length !== 1 ? "s" : ""}</p>
      </div>

      <AdminTable
        columns={[
          { key: "full_name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "title", label: "Title / Specialty" },
          { key: "is_available", label: "Availability", render: (v) => (
            <span className={`text-[10px] uppercase tracking-wider font-bold border rounded px-2 py-0.5 ${
              v === true ? "text-orange bg-orange/20 border border-orange/30" : "text-orange border-orange/20 bg-orange/5"
            }`}>{v ? "Available" : "Unavailable"}</span>
          )},
          { key: "roles", label: "Roles", render: (v) => (v as string[]).join(", ") },
        ]}
        data={photographers}
        loading={loading}
        emptyTitle="No photographers"
        emptyDescription="No photographer profiles have been created yet."
        emptyIcon="\u270B\uFE0F"
      />
    </div>
  );
}
