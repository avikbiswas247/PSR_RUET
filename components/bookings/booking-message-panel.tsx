"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { useAuth } from "@/components/providers/auth-provider";
import { PublicBooking } from "@/lib/types/public";

interface BookingMessage {
  id: string;
  booking_id: string;
  sender_user_id: string;
  sender_name?: string | null;
  message: string;
  created_at: string | Date;
}

function timeInDhaka(value: string | Date) {
  return new Date(value).toLocaleString(undefined, { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" });
}

function isPageVisible() {
  return document.visibilityState !== "hidden";
}

export function BookingMessagePanel({ bookingId, backHref }: { bookingId: string; backHref: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const inFlight = useRef(false);
  const refreshAgain = useRef(false);
  const refreshMessagesRef = useRef<() => Promise<void>>(async () => {});
  const firstLoad = useRef(true);
  const endRef = useRef<HTMLDivElement>(null);
  const lastMessageId = useRef<string | null>(null);
  const { data: booking } = useApi<PublicBooking | null>(`/api/bookings/${bookingId}`);

  const refreshMessages = useCallback(async () => {
    if (document.visibilityState === "hidden") return;
    if (inFlight.current) {
      refreshAgain.current = true;
      return;
    }
    inFlight.current = true;
    try {
      const response = await fetch(`/api/bookings/${bookingId}/messages`, { credentials: "same-origin", cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error?.message || payload.message || "Unable to load messages.");
      setMessages(Array.isArray(payload.data) ? payload.data : []);
      setError("");
    } catch (fetchError) {
      const text = fetchError instanceof Error ? fetchError.message : "Unable to refresh messages.";
      if (firstLoad.current) setError(text);
      else setNotice(text);
    } finally {
      firstLoad.current = false;
      setLoading(false);
      inFlight.current = false;
      if (refreshAgain.current && isPageVisible()) {
        refreshAgain.current = false;
        window.setTimeout(() => void refreshMessagesRef.current(), 0);
      }
    }
  }, [bookingId]);

  useEffect(() => {
    refreshMessagesRef.current = refreshMessages;
  }, [refreshMessages]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    const schedule = () => {
      if (disposed || document.visibilityState === "hidden") return;
      timer = setTimeout(async () => {
        await refreshMessages();
        schedule();
      }, 15_000);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (timer) clearTimeout(timer);
      } else {
        if (timer) clearTimeout(timer);
        void refreshMessages().finally(schedule);
      }
    };
    const initialTimer = setTimeout(() => { void refreshMessages().finally(schedule); }, 0);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      if (initialTimer) clearTimeout(initialTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshMessages]);

  useEffect(() => {
    const newest = messages[messages.length - 1];
    if (newest && newest.id !== lastMessageId.current) {
      endRef.current?.scrollIntoView({ behavior: lastMessageId.current ? "smooth" : "auto", block: "end" });
      lastMessageId.current = newest.id;
    }
  }, [messages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || trimmed.length > 2000) {
      setNotice("Enter a message with 1 to 2,000 characters.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ message: trimmed }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error?.message || payload.message || "Unable to send message.");
      setMessage("");
      setNotice("Message sent.");
      await refreshMessages();
    } catch (sendError) {
      setNotice(sendError instanceof Error ? sendError.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="space-y-6"><h1 className="text-[32px] tracking-tight font-bold">Booking conversation</h1>{[0, 1, 2].map((item) => <div key={item} className="skeleton h-24 rounded-sm" />)}</div>;
  if (error) return <div className="space-y-4"><Link href={backHref} className="text-xs font-bold text-orange">← Back to booking</Link><EmptyState title="Unable to load messages" description={error} /></div>;

  return <div className="mx-auto max-w-3xl space-y-5">
    <div><Link href={backHref} className="text-xs font-bold text-orange">← Back to booking</Link><p className="mt-5 text-xs uppercase tracking-[0.2em] text-orange">Private conversation</p><h1 className="mt-2 text-[32px] tracking-tight font-bold">Booking messages</h1><p className="mt-1 text-sm text-muted">Only the client and photographer on this booking can read these messages.</p></div>
    {booking?.description && <section className="rounded-sm border border-orange/20 bg-orange/5 p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-wider text-orange">Client’s original booking request</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{booking.description}</p><p className="mt-2 text-xs text-muted">{booking.title || "Photography session"} · {booking.booking_number}</p></section>}
    <div className="max-h-[560px] min-h-[260px] space-y-4 overflow-y-auto rounded-sm border line-border bg-surface p-4 sm:p-6" aria-live="polite" aria-label="Conversation messages">
      {messages.length === 0 ? <div className="flex min-h-[220px] items-center justify-center text-sm text-muted">No replies yet. Start the conversation below.</div> : messages.map((item) => {
        const ownMessage = item.sender_user_id === user?.id;
        return <article key={item.id} className={`flex gap-3 ${ownMessage ? "justify-end" : ""}`}>
          {!ownMessage && <div aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-orange">{(item.sender_name || "U").slice(0, 1).toUpperCase()}</div>}
          <div className={`max-w-[88%] rounded-sm border line-border p-3 sm:p-4 ${ownMessage ? "ml-auto border-orange/20 bg-orange/10" : "bg-surface-2"}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-orange">{ownMessage ? "You" : (item.sender_name || "Other participant")}</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{item.message}</p>
            <time className="mt-2 block text-[10px] text-muted" dateTime={new Date(item.created_at).toISOString()}>{timeInDhaka(item.created_at)} · Dhaka time</time>
          </div>
          {ownMessage && <div aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange/10 text-xs font-bold text-orange">You</div>}
        </article>;
      })}
      <div ref={endRef} />
    </div>
    {notice && <p role="status" className="form-notice">{notice}</p>}
    <form onSubmit={handleSubmit} className="space-y-3 rounded-sm border line-border bg-surface p-4 sm:p-6">
      <Textarea label="Your message" name="message" placeholder="Write a message about this session…" rows={4} maxLength={2000} required value={message} onChange={(event) => setMessage(event.target.value)} />
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">{message.length}/2,000 characters · messages refresh every 15 seconds while this tab is open</p><Button type="submit" variant="primary" disabled={busy || !message.trim()}>{busy ? "Sending…" : "Send message"}</Button></div>
    </form>
  </div>;
}
