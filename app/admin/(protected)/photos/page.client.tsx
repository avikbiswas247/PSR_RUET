"use client";

import { AdminTable } from "@/components/admin/table";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";

interface AdminPhoto {
  id: string;
  photographer_name: string | null;
  title: string | null;
  image_url: string;
  visibility: string;
  created_at: string | Date;
}

export default function AdminPhotosPage() {
  const { data, loading, error } = useApi<AdminPhoto[] | null>(
    "/api/admin/photos"
  );
  const photos = loading ? [] : (data ?? []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">Photos</h1>
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
      <EmptyState title="Unable to load photos" description={error} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-tight font-bold">Photos</h1>
        <p className="text-muted text-sm">{photos.length} photo{photos.length !== 1 ? "s" : ""}</p>
      </div>

      <AdminTable
        columns={[
          { key: "title", label: "Title" },
          { key: "photographer_name", label: "Photographer" },
          { key: "visibility", label: "Visibility", render: (v) => (
            <span className={`text-[10px] uppercase tracking-wider font-bold border rounded px-2 py-0.5 ${
              v === "PUBLIC" ? "text-orange bg-orange/20 border border-orange/30" : v === "PRIVATE" ? "text-orange border-orange/20 bg-orange/5" : "text-muted border-line-border"
             }`}>{String(v)}</span>
          )},
          { key: "created_at", label: "Created", render: (v) => new Date(String(v)).toLocaleDateString() },
        ]}
        data={photos}
        loading={loading}
        emptyTitle="No photos"
        emptyDescription="No photos have been uploaded yet."
        emptyIcon="\u270B\uFE0F"
      />
    </div>
  );
}
