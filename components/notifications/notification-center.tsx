"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { PublicNotification } from "@/lib/types/public";

function isInternalLink(value: string | null) {
  return !!value && value.startsWith("/") && !value.startsWith("//");
}

export function NotificationCenter() {
  const { data, loading, error } = useApi<PublicNotification[] | null>("/api/notifications?limit=100");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);
  const [notice, setNotice] = useState("");

  const notifications = useMemo(() => (data ?? []).map((item) => readIds.has(item.id) ? { ...item, is_read: true } : item), [data, readIds]);
  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const markRead = useCallback(async (id: string) => {
    setBusyIds((previous) => new Set([...previous, id]));
    setNotice("");
    try {
      const response = await fetch(`/api/notifications/${id}/read`, { method: "PATCH", credentials: "same-origin" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error?.message || "Unable to mark notification as read.");
      setReadIds((previous) => new Set([...previous, id]));
    } catch (markError) {
      setNotice(markError instanceof Error ? markError.message : "Please try again.");
    } finally {
      setBusyIds((previous) => {
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setMarkingAll(true);
    setNotice("");
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ action: "mark-all-read" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error?.message || "Unable to mark notifications as read.");
      setReadIds(new Set(notifications.map((item) => item.id)));
    } catch (markError) {
      setNotice(markError instanceof Error ? markError.message : "Please try again.");
    } finally {
      setMarkingAll(false);
    }
  }, [notifications]);

  if (loading) return <div className="space-y-4"><h1 className="text-[32px] font-bold">Notifications</h1>{[0, 1, 2].map((item) => <div key={item} className="skeleton h-24 rounded-sm" />)}</div>;
  if (error) return <EmptyState title="Unable to load notifications" description={error} />;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">Your updates</p><h1 className="mt-2 text-[32px] font-bold tracking-tight">Notifications</h1><p className="mt-1 text-sm text-muted">{unreadCount} unread</p></div>{unreadCount > 0 && <Button variant="outline" onClick={markAllRead} disabled={markingAll || busyIds.size > 0}>{markingAll ? "Marking…" : "Mark all as read"}</Button>}</div>
    {notice && <p role="alert" className="form-notice">{notice}</p>}
    {notifications.length === 0 ? <EmptyState title="No notifications" description="Booking and message updates will appear here." /> : <div className="space-y-3">
      {notifications.map((notification) => <article key={notification.id} className={`flex items-start gap-3 rounded-sm border line-border bg-surface p-4 sm:p-5 ${!notification.is_read ? "border-orange/30 bg-orange/5" : ""}`}>
        <span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${notification.is_read ? "bg-muted/40" : "bg-orange"}`} />
        <div className="min-w-0 flex-1"><h2 className="text-sm font-bold">{notification.title}</h2><p className="mt-1 whitespace-pre-wrap text-sm text-muted">{notification.message}</p><p className="mt-2 text-[10px] uppercase tracking-wider text-muted">{new Date(notification.created_at).toLocaleString(undefined, { timeZone: "Asia/Dhaka" })} · Dhaka time</p>
          {isInternalLink(notification.link_url) && <Link href={notification.link_url!} onClick={() => { if (!notification.is_read) void markRead(notification.id); }} className="mt-3 inline-flex min-h-9 items-center text-xs font-bold text-orange hover:underline">Open related booking →</Link>}
        </div>
        {!notification.is_read && <button type="button" onClick={() => void markRead(notification.id)} disabled={busyIds.has(notification.id) || markingAll} className="min-h-9 shrink-0 px-2 text-xs font-bold text-orange hover:underline disabled:opacity-50">{busyIds.has(notification.id) ? "Saving…" : "Mark read"}</button>}
      </article>)}
    </div>}
  </div>;
}
