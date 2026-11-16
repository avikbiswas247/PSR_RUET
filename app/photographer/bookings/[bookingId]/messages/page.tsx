"use client";

import { FormEvent, useCallback, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";

interface BookingMessage {
  id: string;
  booking_id: string;
  sender_user_id: string;
  message: string;
  created_at: string | Date;
}

export default function PhotographerBookingMessagesPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const { data, loading, error } = useApi<BookingMessage[] | null>(
    `/api/bookings/${bookingId}/messages`
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const messages = loading ? [] : (data ?? []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setBusy(true);
      setNotice("");
      const form = new FormData(e.currentTarget);
      const message = form.get("message") as string;
      if (!message.trim()) {
        setNotice("Message cannot be empty.");
        setBusy(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/bookings/${bookingId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message.trim() }),
          }
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || "Unable to send message.");
        (e.target as HTMLFormElement).reset();
        setNotice("Message sent.");
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [bookingId]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">Messages</h1>
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-2" />
              <div className="flex-1">
                <div className="skeleton h2 mb-2" />
                <div className="skeleton line w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState title="Unable to load messages" description={error} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-tight font-bold">Messages</h1>
      </div>

      {error && (
        <div className="p-4 rounded-sm border border-orange/30 bg-orange/5 text-orange text-sm">
          {error}
        </div>
      )}

      <div className="h-[500px] overflow-y-auto border line-border rounded-sm bg-surface p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted">
            No messages yet. Start the conversation below.
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
                <span className="text-muted text-sm">{m.sender_user_id.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <div className="p-3 rounded-sm bg-surface-2 border border-line-border max-w-[80%]">
                  <p className="text-sm text-muted">{m.message}</p>
                  <p className="text-[10px] text-muted mt-1">
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t line-border pt-6 space-y-4">
        <Input
          label="Your message"
          name="message"
          placeholder="Type a message…"
          className="min-h-[80px]"
        />
        {notice && <div className="form-notice">{notice}</div>}
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "Sending…" : "Send message"}
        </Button>
      </form>
    </div>
  );
}
