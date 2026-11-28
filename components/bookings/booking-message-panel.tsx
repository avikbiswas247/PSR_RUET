"use client";

import Link from "next/link";
import { FormEvent, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { useAuth } from "@/components/providers/auth-provider";

interface BookingMessage {
  id: string;
  booking_id: string;
  sender_user_id: string;
  sender_name?: string | null;
  message: string;
  created_at: string | Date;
}

export function BookingMessagePanel({ bookingId, backHref }: { bookingId: string; backHref: string }) {
  const { user } = useAuth();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const { data, loading, error } = useApi<BookingMessage[] | null>(`/api/bookings/${bookingId}/messages?refresh=${refreshVersion}`);
  const messages = loading ? [] : (data ?? []);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const message = String(formData.get("message") ?? "").trim();
    if (!message || message.length > 2000) {
      setNotice("Enter a message with 1 to 2,000 characters.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error?.message || payload.message || "Unable to send message.");
      form.reset();
      setNotice("Message sent.");
      setRefreshVersion((version) => version + 1);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }, [bookingId]);

  if (loading) return <div className="space-y-6"><h1 className="text-[32px] tracking-tight font-bold">Booking conversation</h1>{[0, 1, 2].map((i) => <div key={i} className="rounded-sm border line-border bg-surface p-5"><div className="skeleton h2 mb-3" /><div className="skeleton line w-3/4" /></div>)}</div>;
  if (error) return <div className="space-y-4"><Link href={backHref} className="text-xs font-bold text-orange">← Back to booking</Link><EmptyState title="Unable to load messages" description={error} /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><Link href={backHref} className="text-xs font-bold text-orange">← Back to booking</Link><p className="mt-5 text-xs uppercase tracking-[0.2em] text-orange">Private conversation</p><h1 className="mt-2 text-[32px] tracking-tight font-bold">Booking messages</h1><p className="mt-1 text-sm text-muted">Only the client and photographer on this booking can read these messages.</p></div>
      <div className="max-h-[560px] min-h-[260px] space-y-4 overflow-y-auto rounded-sm border line-border bg-surface p-4 sm:p-6" aria-live="polite">
        {messages.length === 0 ? <div className="flex min-h-[220px] items-center justify-center text-sm text-muted">No messages yet. Start the conversation below.</div> : messages.map((message) => {
          const ownMessage = message.sender_user_id === user?.id;
          return <article key={message.id} className={`flex gap-3 ${ownMessage ? "justify-end" : ""}`}>
            {!ownMessage && <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-orange">{(message.sender_name || "U").slice(0, 1).toUpperCase()}</div>}
            <div className={`max-w-[85%] rounded-sm border line-border bg-surface-2 p-3 ${ownMessage ? "ml-auto" : ""}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange">{ownMessage ? "You" : (message.sender_name || "Other participant")}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{message.message}</p>
              <time className="mt-2 block text-[10px] text-muted" dateTime={new Date(message.created_at).toISOString()}>{new Date(message.created_at).toLocaleString()}</time>
            </div>
            {ownMessage && <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange/10 text-xs font-bold text-orange">You</div>}
          </article>;
        })}
      </div>
      {notice && <p role="status" className="form-notice">{notice}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-sm border line-border bg-surface p-4 sm:p-6">
        <Textarea label="Your message" name="message" placeholder="Write a message…" rows={4} maxLength={2000} required />
        <div className="flex items-center justify-between gap-4"><p className="text-xs text-muted">Up to 2,000 characters</p><Button type="submit" variant="primary" disabled={busy}>{busy ? "Sending…" : "Send message"}</Button></div>
      </form>
    </div>
  );
}
