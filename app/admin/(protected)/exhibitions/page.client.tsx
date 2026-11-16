"use client";

import * as React from "react";
import { Copy, ExternalLink, GalleryVerticalEnd, Plus, Send, Trash2 } from "lucide-react";
import { CoverImageField } from "@/components/admin/cover-image-field";
import { uploadAdminImage } from "@/lib/upload-image";
type Exhibition = { id: string; title: string | null; slug: string; description: string | null; venue: string | null; start_date: string | Date | null; end_date: string | Date | null; status: string; cover_image_url: string | null };
const field = "w-full rounded-md border border-line-border bg-[#171717] px-3 py-2.5 text-sm text-text placeholder:text-muted focus:border-orange focus:outline-none";
async function request(url: string, method = "GET", body?: unknown) { const r = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined }); const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || j.data?.message || j.message || "Request failed"); return j.data; }
export default function AdminExhibitionsPage() {
  const [items, setItems] = React.useState<Exhibition[]>([]); const [loading, setLoading] = React.useState(true); const [busy, setBusy] = React.useState(false); const [error, setError] = React.useState(""); const [notice, setNotice] = React.useState(""); const [showForm, setShowForm] = React.useState(false); const [filter, setFilter] = React.useState<"upcoming" | "past" | "all">("upcoming");
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const load = React.useCallback(async () => { try { setItems(await request("/api/admin/exhibitions")); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load exhibitions"); } finally { setLoading(false); } }, []); React.useEffect(() => { void load(); }, [load]);
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const publishImmediately = f.get("publishImmediately") === "on";
    try {
      const coverImageUrl = coverFile ? await uploadAdminImage(coverFile) : null;
      await request("/api/admin/exhibitions", "POST", {
        title: f.get("title"),
        slug: f.get("slug"),
        description: f.get("description"),
        venue: f.get("venue"),
        startDate: f.get("startDate") || null,
        endDate: f.get("endDate") || null,
        coverImageUrl,
        publishImmediately,
      });
      setShowForm(false);
      setCoverFile(null);
      setNotice(publishImmediately ? "Exhibition published and available on the website." : "Exhibition created as a draft.");
      await load();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Unable to create exhibition");
    } finally {
      setBusy(false);
    }
  }
  async function publish(item: Exhibition) { setBusy(true); try { await request(`/api/admin/exhibitions/${item.id}`, "PATCH", { status: "PUBLISHED" }); await load(); setNotice("Exhibition published. Its public page is ready."); } catch (e) { setError(e instanceof Error ? e.message : "Unable to publish"); } finally { setBusy(false); } }
  async function remove(item: Exhibition) { if (!window.confirm(`Delete “${item.title || "Untitled exhibition"}”?`)) return; try { await request(`/api/admin/exhibitions/${item.id}`, "DELETE"); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete exhibition"); } }
  async function copyLink(item: Exhibition) { await navigator.clipboard.writeText(`${window.location.origin}/exhibitions/${item.id}`); setNotice("Exhibition link copied to clipboard."); }
  const now = Date.now(); const filtered = items.filter((x) => filter === "all" || (filter === "past" ? !!x.end_date && new Date(x.end_date).getTime() < now : !x.end_date || new Date(x.end_date).getTime() >= now));
  return <div className="mx-auto max-w-7xl space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-orange">Curated collections</p><h1 className="text-3xl font-bold tracking-tight">Exhibitions</h1><p className="mt-2 text-sm text-muted">Create and publish exhibitions, then share their public pages.</p></div><button onClick={() => { if (showForm) setCoverFile(null); setShowForm(!showForm); }} className="button button-primary inline-flex items-center gap-2"><Plus size={16}/>{showForm ? "Close form" : "Add exhibition"}</button></div>
    {error && <div role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}{notice && <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
    {showForm && <form onSubmit={create} className="grid gap-4 rounded-xl border border-line-border bg-surface p-5 md:grid-cols-2"><div className="md:col-span-2"><h2 className="font-semibold">New exhibition</h2><p className="mt-1 text-xs text-muted">Publish now to show it immediately on the website, or save it as a draft.</p></div><input required name="title" placeholder="Exhibition title" className={field}/><input required name="slug" placeholder="url-friendly-slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={field}/><input name="venue" placeholder="Venue" className={field}/><label className="text-xs text-muted">Opens<input name="startDate" type="date" className={`${field} mt-1`}/></label><label className="text-xs text-muted">Closes<input name="endDate" type="date" className={`${field} mt-1`}/></label><textarea name="description" placeholder="Description" rows={3} className={`${field} md:col-span-2`}/><CoverImageField label="Exhibition" file={coverFile} onChange={setCoverFile} /><label className="flex items-center gap-2 text-sm text-muted md:col-span-2"><input type="checkbox" name="publishImmediately" className="accent-orange"/>Publish immediately</label><div className="md:col-span-2"><button disabled={busy} className="button button-primary disabled:opacity-50">{busy ? "Saving…" : "Create exhibition"}</button></div></form>}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-border bg-surface px-4 py-3"><div className="flex gap-1">{(["upcoming","past","all"] as const).map(x=><button key={x} onClick={()=>setFilter(x)} className={`rounded-md px-3 py-2 text-xs font-semibold capitalize ${filter===x?"bg-orange text-black":"text-muted hover:bg-surface-2 hover:text-text"}`}>{x}</button>)}</div><span className="text-xs text-muted">{items.length} total · {items.filter(x=>x.status==="PUBLISHED").length} published</span></div>
    {loading ? <div className="rounded-xl border border-line-border bg-surface p-10 text-center text-sm text-muted">Loading exhibitions…</div> : filtered.length ? <div className="grid gap-3">{filtered.map(x=><article key={x.id} className="flex flex-col gap-4 rounded-xl border border-line-border bg-surface p-5 md:flex-row md:items-center md:justify-between"><div className="flex min-w-0 gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange"><GalleryVerticalEnd size={19}/></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{x.title || "Untitled exhibition"}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${x.status==="PUBLISHED"?"bg-emerald-500/10 text-emerald-300":"bg-white/5 text-muted"}`}>{x.status}</span></div><p className="mt-1 truncate text-xs text-muted">{x.venue || "Venue to be announced"} · {x.start_date ? new Date(x.start_date).toLocaleDateString() : "Date to be announced"} · /{x.slug}</p></div></div><div className="flex flex-wrap items-center gap-2">{x.status!=="PUBLISHED"?<button disabled={busy} onClick={()=>void publish(x)} className="button button-primary inline-flex items-center gap-2"><Send size={14}/>Publish & generate link</button>:<><button onClick={()=>void copyLink(x)} className="button button-secondary inline-flex items-center gap-2"><Copy size={14}/>Copy exhibition link</button><a href={`/exhibitions/${x.id}`} target="_blank" rel="noreferrer" className="button button-secondary" aria-label="Open exhibition page"><ExternalLink size={15}/></a></>}<button onClick={()=>void remove(x)} className="rounded-md border border-line-border p-2.5 text-muted hover:border-red-500/40 hover:text-red-300" aria-label="Delete exhibition"><Trash2 size={15}/></button></div></article>)}</div> : <div className="rounded-xl border border-dashed border-line-border bg-surface p-12 text-center"><GalleryVerticalEnd className="mx-auto mb-3 text-muted"/><h2 className="font-semibold">No {filter === "all" ? "" : `${filter} `}exhibitions yet</h2><p className="mt-1 text-sm text-muted">Create an exhibition to share it with your community.</p></div>}
  </div>;
}
