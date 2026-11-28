"use client";

import { FormEvent, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { PhotographerProfileMe } from "@/lib/types/public";
import { useApi } from "@/lib/hooks/use-api";

interface AvailabilitySlot {
  id: string;
  photographer_id: string;
  available_date: string | Date;
  start_time: string | Date;
  end_time: string | Date;
  is_available: boolean;
  is_booked?: boolean;
}

export default function PhotographerAvailabilityPage() {
  const { data: profile, loading: profileLoading } = useApi<PhotographerProfileMe | null>(
    "/api/photographers/me"
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const url = profile?.user_id
    ? `/api/availability?photographerId=${profile.user_id}&from=0001-01-01&to=9999-12-31&refresh=${refreshKey}`
    : "/api/availability?photographerId=00000000-0000-0000-0000-000000000000&from=0001-01-01&to=9999-12-31";
  const { data: slots, loading: slotsLoading, error } = useApi<
    AvailabilitySlot[] | null
  >(url);
  const [createBusy, setCreateBusy] = useState(false);
  const [createNotice, setCreateNotice] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [slotBusy, setSlotBusy] = useState<string | null>(null);
  const [localSlots, setLocalSlots] = useState<AvailabilitySlot[]>([]);

  const photographerId = profile?.user_id;
  const slotsList = slotsLoading
    ? []
    : Array.from(new Map<string, AvailabilitySlot>([...localSlots, ...(slots ?? [])].map((slot): [string, AvailabilitySlot] => [slot.id, slot])).values())
        .sort((a, b) => `${String(a.available_date).slice(0, 10)}${String(a.start_time)}`.localeCompare(`${String(b.available_date).slice(0, 10)}${String(b.start_time)}`));

  const handleCreate = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setCreateBusy(true);
      setCreateNotice("");
      if (!photographerId) {
        setCreateNotice("Photographer profile not found.");
        setCreateBusy(false);
        return;
      }
      try {
        const res = await fetch("/api/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, startTime, endTime }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error?.message || json.message || "Unable to add slot.");
        const createdSlot = json.data as AvailabilitySlot | null | undefined;
        if (!createdSlot?.id || createdSlot.photographer_id !== photographerId) {
          throw new Error("The server did not confirm that this slot was saved. Refresh and try again.");
        }
        setLocalSlots((current) => [...current.filter((slot) => slot.id !== createdSlot.id), createdSlot]);
        setCreateNotice("Slot added to your availability.");
        setDate(""); setStartTime(""); setEndTime("");
        setRefreshKey((current) => current + 1);
      } catch (err) {
        setCreateNotice(err instanceof Error ? err.message : "Please try again.");
      } finally {
        setCreateBusy(false);
      }
    },
    [date, startTime, endTime, photographerId]
  );

  const toggleSlot = async (slot: AvailabilitySlot) => {
    setSlotBusy(slot.id);
    setCreateNotice("");
    try {
      const response = await fetch(`/api/availability/${slot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !slot.is_available }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error?.message || result.message || "Unable to update availability.");
      const updatedSlot = result.data as AvailabilitySlot | null | undefined;
      if (!updatedSlot?.id || updatedSlot.id !== slot.id || updatedSlot.photographer_id !== photographerId) {
        throw new Error("The server did not confirm that this slot was updated. Refresh and try again.");
      }
      setLocalSlots((current) => [...current.filter((item) => item.id !== updatedSlot.id), updatedSlot]);
      setCreateNotice("Availability slot updated.");
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setCreateNotice(err instanceof Error ? err.message : "Unable to update availability.");
    } finally {
      setSlotBusy(null);
    }
  };

  if (profileLoading || slotsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">Availability</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border line-border rounded-sm p-4">
              <div className="h-5 bg-surface-2 mb-4 w-2/3" />
              <div className="h-5 bg-surface-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState title="Unable to load availability" description={error} />
    );
  }

  if (!photographerId) {
    return (
      <EmptyState
        title="Photographer profile required"
        description="Set up your photographer profile to manage availability."
        action={{ label: "Set up profile", href: "/photographer/profile" }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-tight font-bold">Availability</h1>
      </div>

      <div className="p-6 rounded-sm border line-border bg-surface space-y-4">
        <h2 className="text-lg font-bold mb-3">Add availability slot</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Date" type="date" name="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <Input label="Start time" type="time" name="startTime" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          <Input label="End time" type="time" name="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          <div className="sm:col-span-3">
            {createNotice && <div className="form-notice">{createNotice}</div>}
            <Button type="submit" variant="primary" disabled={createBusy}>
              {createBusy ? "Adding…" : "Add slot"}
            </Button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {slotsList.length === 0 ? (
          <div className="lg:col-span-3">
            <EmptyState title="No availability slots" description="Add your available time slots so clients can book you." />
          </div>
        ) : (
          slotsList.map((s) => (
            <div key={s.id} className="border line-border rounded-sm p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold">{new Date(`${String(s.available_date).slice(0, 10)}T00:00:00`).toLocaleDateString()}</h3>
                <span className={`text-[10px] uppercase tracking-wider font-bold border rounded px-2 py-0.5 ${s.is_available ? "text-orange bg-orange/10 border border-orange/20" : "text-muted border-line-border bg-transparent"}`}>
                  {s.is_booked ? "Booked" : s.is_available ? "Available" : "Unavailable"}
                </span>
              </div>
              <p className="text-muted text-sm">{String(s.start_time).slice(0, 5)} &ndash; {String(s.end_time).slice(0, 5)}</p>
              {s.is_booked ? <p className="mt-3 text-xs text-muted">This time is reserved by an active booking.</p> : (
                <Button type="button" variant="outline" disabled={slotBusy === s.id} onClick={() => toggleSlot(s)} className="mt-3">
                  {slotBusy === s.id ? "Updating…" : s.is_available ? "Mark unavailable" : "Mark available"}
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
