"use client";

import * as React from "react";
import { Check, Clock3, Mail, Phone, UserRound, X } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";

interface MembershipApplication {
  id: string; full_name: string; email: string; phone: string | null;
  department: string | null; academic_year: string | null; motivation: string | null;
  status: string; reviewed_by: string | null; reviewed_at: string | Date | null;
  created_at: string | Date;
}
type Filter = "PENDING" | "REVIEWED" | "ALL";

export default function AdminMembershipApplicationsPage() {
  const { data, loading, error } = useApi<MembershipApplication[] | null>("/api/admin/membership-applications");
  const [applications, setApplications] = React.useState<MembershipApplication[]>([]);
  const [busy, setBusy] = React.useState<Set<string>>(new Set());
  const [notice, setNotice] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("PENDING");

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApplications(data ?? []);
  }, [data]);

  async function review(app: MembershipApplication, decision: "APPROVED" | "REJECTED") {
    setBusy((current) => new Set(current).add(app.id));
    setNotice("");
    try {
      const memberCode = `PSR-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
      const response = await fetch("/api/admin/membership-applications", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: app.id, decision, memberCode }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || json.data?.message || "Unable to process this application.");
      setApplications((current) => current.map((item) => item.id === app.id ? { ...item, status: decision, reviewed_at: new Date() } : item));
      setNotice(`${app.full_name}'s application was ${decision.toLowerCase()}.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to process this application.");
    } finally {
      setBusy((current) => { const next = new Set(current); next.delete(app.id); return next; });
    }
  }

  if (loading) return <div className="space-y-5"><div className="skeleton h-8 w-64"/><div className="skeleton h-36 w-full"/><div className="skeleton h-36 w-full"/></div>;
  if (error) return <EmptyState title="Unable to load applications" description={error}/>;

  const pending = applications.filter((app) => app.status === "PENDING").length;
  const visible = applications.filter((app) => filter === "ALL" || (filter === "REVIEWED" ? app.status !== "PENDING" : app.status === "PENDING"));
  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-orange">Member services</p><h1 className="text-3xl font-bold tracking-tight">Membership applications</h1><p className="mt-2 text-sm text-muted">Review requests and approve or decline membership.</p></div>
      <span className="w-fit rounded-full border border-line-border bg-surface px-3 py-1.5 text-xs text-muted">{pending} awaiting review</span>
    </header>
    {notice && <div role="status" className="rounded-md border border-orange/25 bg-orange/5 px-4 py-3 text-sm text-orange">{notice}</div>}
    <div className="flex flex-wrap gap-2 border-b border-line-border pb-3">{(["PENDING", "REVIEWED", "ALL"] as const).map((value) => <button key={value} onClick={() => setFilter(value)} className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${filter === value ? "bg-orange text-black" : "text-muted hover:bg-surface-2 hover:text-text"}`}>{value === "PENDING" ? `Pending (${pending})` : value === "REVIEWED" ? "Reviewed" : "All applications"}</button>)}</div>
    {visible.length === 0 ? <EmptyState title={filter === "PENDING" ? "No pending applications" : "No applications found"} description={filter === "PENDING" ? "New membership requests will appear here." : "There are no applications in this view."} icon="\u270B\uFE0F"/> : <div className="grid gap-4">{visible.map((app) => <article key={app.id} className="min-w-0 rounded-xl border border-line-border bg-surface p-5 sm:p-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-lg font-semibold">{app.full_name}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${app.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-300" : app.status === "REJECTED" ? "bg-red-500/10 text-red-300" : "bg-orange/10 text-orange"}`}>{app.status}</span></div>
          <div className="mt-3 flex min-w-0 flex-wrap gap-x-5 gap-y-2 text-sm text-muted"><span className="inline-flex min-w-0 items-center gap-2 break-all"><Mail size={14} className="shrink-0"/>{app.email}</span>{app.phone && <span className="inline-flex items-center gap-2 break-words"><Phone size={14} className="shrink-0"/>{app.phone}</span>}<span className="inline-flex items-center gap-2"><UserRound size={14} className="shrink-0"/>{[app.department, app.academic_year].filter(Boolean).join(" · ") || "Department/year not provided"}</span></div>
          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-muted">{app.motivation || "No motivation provided."}</p>
          <p className="mt-3 text-xs text-muted">Applied {new Date(app.created_at).toLocaleDateString()}</p>
        </div>
        {app.status === "PENDING" && <div className="flex shrink-0 gap-2 sm:w-40 sm:flex-col"> <button onClick={() => void review(app, "APPROVED")} disabled={busy.has(app.id)} className="button button-primary flex flex-1 items-center justify-center gap-2 disabled:opacity-50 sm:flex-none"><Check size={15}/>{busy.has(app.id) ? "Saving…" : "Approve"}</button><button onClick={() => void review(app, "REJECTED")} disabled={busy.has(app.id)} className="button button-outline flex flex-1 items-center justify-center gap-2 disabled:opacity-50 sm:flex-none"><X size={15}/>Decline</button></div>}
        {app.status !== "PENDING" && app.reviewed_at && <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted"><Clock3 size={14}/>Reviewed {new Date(app.reviewed_at).toLocaleDateString()}</span>}
      </div>
    </article>)}</div>}
  </div>;
}
