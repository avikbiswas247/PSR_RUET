"use client";

import { AdminTable } from "@/components/admin/table";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { useCallback, useState } from "react";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string | Date;
}

export default function AdminNotificationsPage() {
  const { data, loading, error } = useApi<Notification[] | null>("/api/notifications");
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");

  const notifications = loading ? [] : (data ?? []);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = useCallback(
    async (id: string) => {
      setBusy((prev) => new Set([...prev, id]));
      try {
        const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
        if (!res.ok) throw new Error("Unable to mark as read.");
        setNotice("Notification marked as read.");
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
        <h1 className="text-[32px] tracking-tight font-bold">Notifications</h1>
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
      <EmptyState title="Unable to load notifications" description={error} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-tight font-bold">Notifications</h1>
        <p className="text-muted text-sm">{unreadCount} unread</p>
      </div>

      {notice && <div className="form-notice">{notice}</div>}

      <p className="text-sm text-muted mb-4">
        Announcement sending requires a backend notification workflow. This view
        shows existing notifications and allows marking them as read.
      </p>

      <AdminTable
        columns={[
          { key: "title", label: "Title" },
          { key: "message", label: "Message", render: (v) => String(v).slice(0, 80) + (String(v).length > 80 ? "…" : "") },
          { key: "is_read", label: "Status", render: (v) => (
            <span className={`text-[10px] uppercase tracking-wider font-bold border rounded px-2 py-0.5 ${
              v === true ? "text-orange bg-orange/20 border border-orange/30" : "text-orange border-orange/20 bg-orange/5"
            }`}>{v ? "Read" : "Unread"}</span>
          )},
          { key: "created_at", label: "Created", render: (v) => new Date(String(v)).toLocaleDateString() },
        ]}
        data={notifications}
        loading={loading}
        emptyTitle="No notifications"
        emptyDescription="There are no notifications yet."
        emptyIcon="\u2705"
      />

      <div className="mt-8">
        {notifications.filter((n) => !n.is_read).map((n) => (
          <div key={n.id} className="p-4 rounded-sm border line-border bg-surface">
            <h3 className="text-sm font-bold">{n.title}</h3>
            <p className="text-sm text-muted">{n.message}</p>
            <button
              onClick={() => markRead(n.id)}
              disabled={busy.has(n.id)}
              className="text-xs font-bold text-orange hover:underline"
            >
              Mark read
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
