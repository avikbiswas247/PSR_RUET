"use client";

import * as React from "react";
import { Plus, Trash2, X } from "lucide-react";

type FormKind = "event" | "exhibition";
type Target = { id: string; title: string | null; slug: string };
type FormField = { id: string; label: string; type: "text" | "textarea" | "number" | "select" | "email" | "tel"; required: boolean; options?: string[] };
type SavedForm = { fields: FormField[]; is_paid: boolean; bkash_numbers: string[]; enabled: boolean; image_submissions_enabled: boolean };
const input = "w-full rounded-md border border-line-border bg-[#171717] px-3 py-2.5 text-sm text-text placeholder:text-muted focus:border-orange focus:outline-none";
async function api(url: string, method = "GET", body?: unknown) { const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined }); const json = await response.json(); if (!response.ok) throw new Error(json.error?.message || json.message || json.data?.message || "Request failed"); return json.data; }
const newField = (): FormField => ({ id: crypto.randomUUID(), label: "New question", type: "text", required: false });

export function ParticipationFormBuilder({ kind, onClose }: { kind: FormKind; onClose: () => void }) {
  const [targets, setTargets] = React.useState<Target[]>([]);
  const [targetId, setTargetId] = React.useState("");
  const [fields, setFields] = React.useState<FormField[]>([]);
  const [paid, setPaid] = React.useState(false);
  const [bkash, setBkash] = React.useState("");
  const [enabled, setEnabled] = React.useState(true);
  const [imageSubmissions, setImageSubmissions] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => { api(`/api/admin/${kind}s`).then(setTargets).catch(e => setError(e.message)); }, [kind]);

  async function chooseTarget(id: string) {
    setTargetId(id); setSaved(false); setError("");
    if (!id) { setFields([]); setPaid(false); setBkash(""); setEnabled(true); setImageSubmissions(true); return; }
    try {
      const existing = await api(`/api/admin/participation/forms?type=${kind}&targetId=${id}`) as SavedForm | null;
      setFields(existing?.fields ?? []); setPaid(existing?.is_paid ?? false); setBkash(existing?.bkash_numbers?.join(", ") ?? ""); setEnabled(existing?.enabled ?? true); setImageSubmissions(existing?.image_submissions_enabled ?? true);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load the registration form."); }
  }

  function updateField(fieldId: string, patch: Partial<FormField>) { setFields(current => current.map(item => item.id === fieldId ? { ...item, ...patch } : item)); }
  async function save() {
    if (!targetId) { setError("Choose an event or exhibition first."); return; }
    if (paid && !bkash.trim()) { setError("Enter the bKash number participants should pay."); return; }
    setBusy(true); setError("");
    try {
      await api("/api/admin/participation/forms", "POST", { type: kind, targetId, fields, isPaid: paid, bkashNumbers: paid ? bkash.split(",").map(value => value.trim()).filter(Boolean) : [], enabled, imageSubmissionsEnabled: imageSubmissions });
      setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save registration form."); }
    finally { setBusy(false); }
  }

  const singular = kind === "event" ? "event" : "exhibition";
  return <section aria-label={`Create ${singular} form`} className="space-y-5 rounded-xl border border-orange/30 bg-surface p-5 md:p-6">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-orange">Registration form builder</p><h2 className="mt-1 text-xl font-bold">Create {singular} form</h2><p className="mt-1 text-sm text-muted">Choose a {singular}, customize the questions, and set the submission options.</p></div><button type="button" onClick={onClose} aria-label="Close form builder" className="rounded-md border border-line-border p-2 text-muted hover:text-text"><X size={16}/></button></div>
    {error && <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
    {saved && <p role="status" className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">Form saved. Participants can use the public registration link shown below.</p>}
    <label className="block text-xs text-muted">{kind === "event" ? "Event" : "Exhibition"}<select required className={`${input} mt-1`} value={targetId} onChange={e => void chooseTarget(e.target.value)}><option value="">Choose a {singular}</option>{targets.map(item => <option key={item.id} value={item.id}>{item.title || item.slug}</option>)}</select></label>
    {targetId && <>
      <div className="space-y-3"><div><h3 className="font-semibold">Questions</h3><p className="text-xs text-muted">Name, email, phone, and department are collected automatically.</p></div>
        {fields.map(item => <div key={item.id} className="grid gap-2 rounded-lg border border-line-border p-3 md:grid-cols-[minmax(180px,1fr)_170px_auto_auto]">
          <input className={input} aria-label="Question name" value={item.label} onChange={e => updateField(item.id, { label: e.target.value })}/>
          <select className={input} aria-label="Question type" value={item.type} onChange={e => updateField(item.id, { type: e.target.value as FormField["type"] })}><option value="text">Short answer</option><option value="textarea">Paragraph</option><option value="number">Number</option><option value="email">Email</option><option value="tel">Phone</option><option value="select">Dropdown</option></select>
          <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" className="accent-orange" checked={item.required} onChange={e => updateField(item.id, { required: e.target.checked })}/>Required</label>
          <button type="button" aria-label={`Remove ${item.label}`} className="text-muted hover:text-red-300" onClick={() => setFields(current => current.filter(field => field.id !== item.id))}><Trash2 size={17}/></button>
          {item.type === "select" && <input className={`${input} md:col-span-4`} placeholder="Dropdown options separated by commas" value={(item.options ?? []).join(", ")} onChange={e => updateField(item.id, { options: e.target.value.split(",").map(option => option.trim()).filter(Boolean) })}/>}
        </div>)}
        <button type="button" onClick={() => setFields(current => [...current, newField()])} className="button button-secondary inline-flex items-center gap-2"><Plus size={15}/>Add field</button>
      </div>
      <div className="grid gap-4 rounded-lg border border-line-border p-4 md:grid-cols-2">
        <div><h3 className="font-semibold">Registration fee</h3><div className="mt-2 flex gap-2"><button type="button" onClick={() => setPaid(false)} aria-pressed={!paid} className={`rounded-md px-4 py-2 text-sm font-semibold ${!paid ? "bg-orange text-black" : "bg-surface-2 text-muted"}`}>Unpaid</button><button type="button" onClick={() => setPaid(true)} aria-pressed={paid} className={`rounded-md px-4 py-2 text-sm font-semibold ${paid ? "bg-orange text-black" : "bg-surface-2 text-muted"}`}>Paid</button></div></div>
        {paid && <label className="text-xs text-muted">bKash number for payment<input required type="tel" className={`${input} mt-1`} placeholder="01XXXXXXXXX" value={bkash} onChange={e => setBkash(e.target.value)}/></label>}
      </div>
      <div className="grid gap-3 rounded-lg border border-line-border p-4 sm:grid-cols-2">
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 accent-orange" checked={imageSubmissions} onChange={e => setImageSubmissions(e.target.checked)}/><span><strong>Allow image submissions</strong><span className="mt-1 block text-xs text-muted">Participants can add photo links. Turn this off to remove that option from their form.</span></span></label>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 accent-orange" checked={enabled} onChange={e => setEnabled(e.target.checked)}/><span><strong>Accepting responses</strong><span className="mt-1 block text-xs text-muted">The form is available to participants while enabled.</span></span></label>
      </div>
      {saved && <p className="break-all rounded-md bg-surface-2 p-3 text-sm">Public form: <a className="text-orange underline" href={`/participate/${kind}/${targetId}`} target="_blank" rel="noreferrer">{typeof window === "undefined" ? "" : window.location.origin}/participate/{kind}/{targetId}</a></p>}
      <button type="button" disabled={busy} onClick={() => void save()} className="button button-primary disabled:opacity-50">{busy ? "Saving…" : "Save form"}</button>
    </>}
  </section>;
}
