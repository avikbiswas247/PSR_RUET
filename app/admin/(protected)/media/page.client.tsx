"use client";

import Image from "next/image";
import { AdminTable } from "@/components/admin/table";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { useCallback, useState } from "react";

interface MediaAsset {
  id: string;
  url: string;
  public_id: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string | Date;
}

export default function AdminMediaPage() {
  const { data, loading, error } = useApi<MediaAsset[] | null>("/api/admin/media");
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");

  const assets = loading ? [] : (data ?? []);

  const deleteAsset = useCallback(
    async (id: string) => {
      if (!window.confirm("Delete this media record?")) return;
      setBusy((prev) => new Set([...prev, id]));
      try {
        const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Unable to delete media.");
        setNotice("Media deleted.");
        setBusy((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "Please try again.");
        setBusy((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">Media Library</h1>
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
      <EmptyState title="Unable to load media" description={error} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-tight font-bold">Media Library</h1>
        <p className="text-muted text-sm">{assets.length} asset{assets.length !== 1 ? "s" : ""}</p>
      </div>

      {notice && <div className="form-notice">{notice}</div>}

      <AdminTable
        columns={[
          { key: "file_name", label: "File Name" },
          { key: "file_type", label: "Type" },
          { key: "file_size", label: "Size", render: (v) => (v ? `${(v as number / 1024).toFixed(1)} KB` : "—") },
          { key: "created_at", label: "Uploaded", render: (v) => new Date(String(v)).toLocaleDateString() },
        ]}
        data={assets}
        loading={loading}
        emptyTitle="No media assets"
        emptyDescription="No media assets have been uploaded yet."
      />

      <div className="mt-8">
        {assets.map((a) => (
          <div key={a.id} className="p-4 rounded-sm border line-border bg-surface flex items-center gap-4">
            <Image
              src={a.url}
              alt={a.file_name || "Media"}
              width={64}
              height={64}
              className="w-16 h-16 object-cover rounded-sm"
            />
            <div className="flex-1">
              <div className="text-sm font-bold">{a.file_name || "Untitled"}</div>
              <div className="text-xs text-muted">{a.file_type}</div>
            </div>
            <button
              onClick={() => deleteAsset(a.id)}
              disabled={busy.has(a.id)}
              className="text-xs font-bold text-orange hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
