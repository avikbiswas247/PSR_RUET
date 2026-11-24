"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminTable } from "@/components/admin/table";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { useCallback, useState, FormEvent } from "react";

interface Award {
  id: string;
  photographer_id: string;
  title: string;
  organization: string | null;
  award_level: string | null;
  awarded_at: string | Date | null;
  certificate_url: string | null;
  description: string | null;
  created_at: string | Date;
}

export default function AdminAwardsPage() {
  const { data, loading, error } = useApi<Award[] | null>("/api/admin/awards");
  const [createBusy, setCreateBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [photographerId, setPhotographerId] = useState("");
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [level, setLevel] = useState("");
  const [awardedAt, setAwardedAt] = useState("");
  const [certificateUrl, setCertificateUrl] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setCreateBusy(true);
      setNotice("");
      try {
        const res = await fetch("/api/admin/awards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photographerId, title, organization: organization || null,
            level: level || null, awardedAt: awardedAt || null,
            certificateUrl: certificateUrl || null, description: description || null,
          }),
        });
        if (!res.ok) throw new Error("Unable to create award.");
        setNotice("Award created.");
        setPhotographerId(""); setTitle(""); setOrganization(""); setLevel("");
        setAwardedAt(""); setCertificateUrl(""); setDescription("");
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "Please try again.");
      } finally {
        setCreateBusy(false);
      }
    },
    [photographerId, title, organization, level, awardedAt, certificateUrl, description]
  );

  const awards = loading ? [] : (data ?? []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">Awards</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-sm border line-border bg-surface">
              <div className="skeleton h2 mb-4" />
              <div className="skeleton line w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState title="Unable to load awards" description={error} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-tight font-bold">Awards</h1>
        <p className="text-muted text-sm">{awards.length} award{awards.length !== 1 ? "s" : ""}</p>
      </div>

      {notice && <div className="form-notice">{notice}</div>}

      <div className="p-6 rounded-sm border line-border bg-surface space-y-4">
        <h2 className="text-lg font-bold mb-3">Add award</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input label="Photographer ID" name="photographerId" value={photographerId} onChange={(e) => setPhotographerId(e.target.value)} required />
          <Input label="Title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label="Organization" name="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} />
          <Input label="Level" name="level" value={level} onChange={(e) => setLevel(e.target.value)} />
          <Input label="Awarded At (date)" name="awardedAt" type="date" value={awardedAt} onChange={(e) => setAwardedAt(e.target.value)} />
          <Input label="Certificate URL" name="certificateUrl" value={certificateUrl} onChange={(e) => setCertificateUrl(e.target.value)} />
          <Input label="Description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="lg:col-span-4">
            {notice && <div className="form-notice">{notice}</div>}
            <Button type="submit" variant="primary" disabled={createBusy}>
              {createBusy ? "Creating…" : "Create award"}
            </Button>
          </div>
        </form>
      </div>

      <AdminTable
        columns={[
          { key: "title", label: "Title" },
          { key: "organization", label: "Organization" },
          { key: "award_level", label: "Level" },
          { key: "awarded_at", label: "Awarded At", render: (v) => (v ? new Date(String(v)).toLocaleDateString() : "—") },
          { key: "created_at", label: "Created", render: (v) => new Date(String(v)).toLocaleDateString() },
        ]}
        data={awards}
        loading={loading}
        emptyTitle="No awards"
        emptyDescription="No awards have been created yet."
      />
    </div>
  );
}
