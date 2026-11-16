"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { PublicNotification } from "@/lib/types/public";

export default function AccountNotificationsPage() {
  const { data, loading, error } = useApi<PublicNotification[] | null>(
    "/api/notifications"
  );
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");

  const notifications = useMemo(() => loading ? [] : (data ?? []), [loading, data]);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = useCallback(
    async (id: string) => {
      setBusy((prev) => new Set([...prev, id]));
      try {
        const res = await fetch(`/api/notifications/${id}/read`, {
          method: "PATCH",
        });
        if (!res.ok) throw new Error("Unable to mark as read.");
        setNotice("Notification marked as read.");
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "Please try again.");
      } finally {
        setBusy((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    []
  );

  const markAllRead = useCallback(async () => {
    await Promise.all(
      notifications.filter((n) => !n.is_read).map((n) => markRead(n.id))
    );
  }, [notifications, markRead]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">Notifications</h1>
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
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
      <EmptyState title="Unable to load notifications" description={error} />
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
        <div>
          <h1 className="text-[32px] tracking-tight font-bold">Notifications</h1>
          <p className="text-muted text-sm">
            {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={busy.size > 0}>
            Mark all as read
          </Button>
        )}
      </div>

      {notice && <div className="form-notice">{notice}</div>}

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You&rsquo;re all caught up."
          icon="\u2705"
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-sm border line-border bg-surface flex items-start gap-4 ${!n.is_read ? "border-orange/30 bg-orange/5" : ""}`}
            >
              <div className="flex-shrink-0 mt-1">
                {!n.is_read && (
                  <span className="w-2 h-2 rounded-full bg-orange" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold">{n.title}</h3>
                <p className="text-sm text-muted mb-2">{n.message}</p>
                <p className="text-[10px] text-muted uppercase tracking-wider">
                  {new Date(n.created_at).toLocaleDateString()}
                  {n.is_read ? " &bull; read" : ""}
                </p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markRead(n.id)}
                  disabled={busy.has(n.id)}
                  className="text-xs font-bold text-orange hover:underline ml-2"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
