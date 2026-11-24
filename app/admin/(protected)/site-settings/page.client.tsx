"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminTable } from "@/components/admin/table";
import { EmptyState } from "@/components/ui/empty-state";
import { HomepageFeaturedPhotosEditor } from "@/components/admin/homepage-featured-photos-editor";
import { useApi } from "@/lib/hooks/use-api";
import { useCallback, useState, FormEvent } from "react";

interface SiteSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  created_at: string | Date;
}

export default function AdminSiteSettingsPage() {
  const { data, loading, error } = useApi<SiteSetting[] | null>("/api/admin/site-settings");
  const [createBusy, setCreateBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setCreateBusy(true);
      setNotice("");
      try {
        const res = await fetch("/api/admin/site-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value: JSON.parse(value || "{}"), description }),
        });
        if (!res.ok) throw new Error("Unable to create setting.");
        setNotice("Setting created.");
        setKey(""); setValue("{}"); setDescription("");
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "Please try again.");
      } finally {
        setCreateBusy(false);
      }
    },
    [key, value, description]
  );

  const updateSetting = useCallback(
    async (id: string, newValue: string) => {
      try {
        const res = await fetch("/api/admin/site-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, value: JSON.parse(newValue || "{}") }),
        });
        if (!res.ok) throw new Error("Unable to update setting.");
        setNotice("Setting updated.");
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "Please try again.");
      }
    },
    []
  );

  const settings = loading ? [] : (data ?? []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">Site Settings</h1>
        <div className="p-6 rounded-sm border line-border bg-surface">
          <div className="skeleton h2 mb-4" />
          <div className="skeleton line w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState title="Unable to load settings" description={error} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-tight font-bold">Site Settings</h1>
        <p className="text-muted text-sm">{settings.length} setting{settings.length !== 1 ? "s" : ""}</p>
      </div>

      <HomepageFeaturedPhotosEditor />

      {notice && <div className="form-notice">{notice}</div>}

      <div className="p-6 rounded-sm border line-border bg-surface space-y-4">
        <h2 className="text-lg font-bold mb-3">Add setting</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input label="Key" name="key" value={key} onChange={(e) => setKey(e.target.value)} placeholder="site_title" required />
          <Input label="Value (JSON)" name="value" value={value} onChange={(e) => setValue(e.target.value)} placeholder='{"title": "PSR"}' required />
          <Input label="Description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="lg:col-span-3">
            {createBusy ? <p>Creating…</p> : null}
            <Button type="submit" variant="primary" disabled={createBusy}>
              Create setting
            </Button>
          </div>
        </form>
      </div>

      <AdminTable
        columns={[
          { key: "key", label: "Key" },
          { key: "value", label: "Value", render: (v) => JSON.stringify(v).slice(0, 60) + (JSON.stringify(v).length > 60 ? "…" : "") },
          { key: "description", label: "Description", render: (v) => String(v || "—") },
          { key: "created_at", label: "Created", render: (v) => new Date(String(v)).toLocaleDateString() },
        ]}
        data={settings}
        loading={loading}
        emptyTitle="No site settings"
        emptyDescription="No site settings have been configured yet."
      />

      <div className="mt-8">
        {settings.map((s) => (
          <div key={s.id} className="p-4 rounded-sm border line-border bg-surface space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">{s.key}</h3>
              <span className="text-[10px] text-muted">{new Date(s.created_at).toLocaleDateString()}</span>
            </div>
            <Input
              label="Value (JSON)"
              value={JSON.stringify(s.value)}
              onChange={(e) => updateSetting(s.id, e.target.value)}
              className="text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
