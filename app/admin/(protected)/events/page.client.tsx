"use client";

import * as React from "react";
import { CalendarDays, Copy, ExternalLink, Plus, Send, Trash2 } from "lucide-react";
import { CoverImageField } from "@/components/admin/cover-image-field";
import { EmptyState } from "@/components/ui/empty-state";
import { uploadAdminImage } from "@/lib/upload-image";

type EventRow = { id: string; title: string | null; slug: string; description: string | null; location: string | null; start_at: string | Date | null; end_at: string | Date | null; status: string; registration_enabled: boolean; cover_image_url: string | null };
const field = "w-full rounded-md border border-line-border bg-[#171717] px-3 py-2.5 text-sm text-text placeholder:text-muted focus:border-orange focus:outline-none";
async function request(url: string, method = "GET", body?: unknown) { const r = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined }); const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || j.data?.message || j.message || "Request failed"); return j.data; }
export default function AdminEventsPage() {
  const [events, setEvents] = React.useState<EventRow[]>([]); const [loading, setLoading] = React.useState(true); const [busy, setBusy] = React.useState(false); const [error, setError] = React.useState(""); const [notice, setNotice] = React.useState(""); const [showForm, setShowForm] = React.useState(false); const [filter, setFilter] = React.useState<"upcoming" | "past" | "all">("upcoming");
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const load = React.useCallback(async () => { try { setEvents(await request("/api/admin/events")); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load events"); } finally { setLoading(false); } }, []);
  React.useEffect(() => { void load(); }, [load]);
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const publishImmediately = f.get("publishImmediately") === "on";
    try {
      const coverImageUrl = coverFile ? await uploadAdminImage(coverFile) : null;
      await request("/api/admin/events", "POST", {
        title: f.get("title"),
        slug: f.get("slug"),
        description: f.get("description"),
        location: f.get("location"),
        startAt: f.get("startAt") || null,
        endAt: f.get("endAt") || null,
        registrationEnabled: f.get("registrationEnabled") === "on",
        coverImageUrl,
        publishImmediately,
      });
      setShowForm(false);
      setCoverFile(null);
      setNotice(publishImmediately ? "Event published and available on the website." : "Event created as a draft.");
      await load();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Unable to create event");
    } finally {
      setBusy(false);
    }
  }
  async function publish(row: EventRow) { setBusy(true); try { await request(`/api/events/${row.id}/publish`, "POST"); await load(); setNotice("Event published. Its public page is ready."); } catch (e) { setError(e instanceof Error ? e.message : "Unable to publish"); } finally { setBusy(false); } }
  async function remove(row: EventRow) { if (!window.confirm(`Delete “${row.title || "Untitled event"}”?`)) return; try { await request(`/api/admin/events/${row.id}`, "DELETE"); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete event"); } }
  async function copyLink(row: EventRow) { await navigator.clipboard.writeText(`${window.location.origin}/events/${row.id}`); setNotice("Event link copied to clipboard."); }
  const now = Date.now(); const filtered = events.filter((e) => filter === "all" || (filter === "past" ? !!e.end_at && new Date(e.end_at).getTime() < now : !e.end_at || new Date(e.end_at).getTime() >= now));
  return <div className="mx-auto max-w-7xl space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-orange">Community programming</p><h1 className="text-3xl font-bold tracking-tight">Events</h1><p className="mt-2 text-sm text-muted">Create, publish, and manage the events shown to your community.</p></div><button onClick={() => { if (showForm) setCoverFile(null); setShowForm(!showForm); }} className="button button-primary inline-flex items-center gap-2"><Plus size={16}/>{showForm ? "Close form" : "Add event"}</button></div>
    {error && <div role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}{notice && <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
    {showForm && <form onSubmit={create} className="grid gap-4 rounded-xl border border-line-border bg-surface p-5 md:grid-cols-2"><div className="md:col-span-2"><h2 className="font-semibold">New event</h2><p className="mt-1 text-xs text-muted">Publish now to show it immediately on the website, or save it as a draft.</p></div><input required name="title" placeholder="Event title" className={field}/><input required name="slug" placeholder="url-friendly-slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={field}/><input name="location" placeholder="Location" className={field}/><label className="text-xs text-muted">Starts<input name="startAt" type="datetime-local" className={`${field} mt-1`}/></label><label className="text-xs text-muted">Ends<input name="endAt" type="datetime-local" className={`${field} mt-1`}/></label><textarea name="description" placeholder="Description" rows={3} className={`${field} md:col-span-2`}/><CoverImageField label="Event" file={coverFile} onChange={setCoverFile} /><label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="registrationEnabled" className="accent-orange"/>Enable attendee registration</label><label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="publishImmediately" className="accent-orange"/>Publish immediately</label><div className="md:col-span-2"><button disabled={busy} className="button button-primary disabled:opacity-50">{busy ? "Saving…" : "Create event"}</button></div></form>}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-border bg-surface px-4 py-3"><div className="flex gap-1">{(["upcoming","past","all"] as const).map(x=><button key={x} onClick={()=>setFilter(x)} className={`rounded-md px-3 py-2 text-xs font-semibold capitalize ${filter===x?"bg-orange text-black":"text-muted hover:bg-surface-2 hover:text-text"}`}>{x}</button>)}</div><span className="text-xs text-muted">{events.length} total · {events.filter(e=>e.status==="PUBLISHED").length} published</span></div>
    {loading ? <div className="rounded-xl border border-line-border bg-surface p-10 text-center text-sm text-muted">Loading events…</div> : filtered.length ? <div className="grid gap-3">{filtered.map(e=><article key={e.id} className="flex flex-col gap-4 rounded-xl border border-line-border bg-surface p-5 md:flex-row md:items-center md:justify-between"><div className="flex min-w-0 gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange"><CalendarDays size={19}/></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{e.title || "Untitled event"}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${e.status==="PUBLISHED"?"bg-emerald-500/10 text-emerald-300":"bg-white/5 text-muted"}`}>{e.status}</span></div><p className="mt-1 truncate text-xs text-muted">{e.location || "Location to be announced"} · {e.start_at ? new Date(e.start_at).toLocaleString() : "Date to be announced"} · /{e.slug}</p></div></div><div className="flex flex-wrap items-center gap-2">{e.status!=="PUBLISHED"?<button disabled={busy} onClick={()=>void publish(e)} className="button button-primary inline-flex items-center gap-2"><Send size={14}/>Publish & generate link</button>:<><button onClick={()=>void copyLink(e)} className="button button-secondary inline-flex items-center gap-2"><Copy size={14}/>Copy event link</button><a href={`/events/${e.id}`} target="_blank" rel="noreferrer" className="button button-secondary" aria-label="Open event page"><ExternalLink size={15}/></a></>}<button onClick={()=>void remove(e)} className="rounded-md border border-line-border p-2.5 text-muted hover:border-red-500/40 hover:text-red-300" aria-label="Delete event"><Trash2 size={15}/></button></div></article>)}</div> : <EmptyState compact title={"No " + (filter === "all" ? "" : filter + " ") + "events yet"} description="Create an event to share it with your community." />}
  </div>;
}
