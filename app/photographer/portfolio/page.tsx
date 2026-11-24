"use client";

import { FormEvent, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { PublicPortfolio } from "@/lib/types/public";
import Link from "next/link";

export default function PhotographerPortfolioPage() {
  const { data, loading, error } = useApi<PublicPortfolio[] | null>(
    "/api/portfolios"
  );
  const [createBusy, setCreateBusy] = useState(false);
  const [createNotice, setCreateNotice] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const portfolios = loading ? [] : (data ?? []);

  const handleCreate = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setCreateBusy(true);
      setCreateNotice("");
      try {
        const res = await fetch("/api/portfolios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, slug, description: description || null, isPublic: true }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || "Unable to create portfolio.");
        setCreateNotice("Portfolio created.");
        setTitle(""); setSlug(""); setDescription("");
      } catch (err) {
        setCreateNotice(err instanceof Error ? err.message : "Please try again.");
      } finally {
        setCreateBusy(false);
      }
    },
    [title, slug, description]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">Portfolio</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border line-border rounded-sm overflow-hidden p-4">
              <div className="skeleton" style={{ height: "240px", width: "100%" }} />
              <div className="mt-4">
                <div className="skeleton h2 mb-3" />
                <div className="skeleton line" style={{ width: "70%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState title="Unable to load portfolios" description={error} />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-tight font-bold">Portfolio</h1>
        <Link href="/photographer/photos" className="button button-outline">
          Manage photos
        </Link>
      </div>

      <div className="p-6 rounded-sm border line-border bg-surface space-y-4">
        <h2 className="text-lg font-bold mb-3">Create portfolio</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input label="Title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Portfolio title" required />
          <Input label="Slug" name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-portfolio" required />
          <Input label="Description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          <div className="lg:col-span-3">
            {createNotice && <div className="form-notice">{createNotice}</div>}
            <Button type="submit" variant="primary" disabled={createBusy}>
              {createBusy ? "Creating…" : "Create portfolio"}
            </Button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolios.length === 0 ? (
          <div className="lg:col-span-3">
            <EmptyState
              title="No portfolios yet"
              description="Create your first portfolio to organize and showcase your photos."
            />
          </div>
        ) : (
          portfolios.map((p) => (
            <div key={p.id} className="border line-border rounded-sm overflow-hidden">
              <div className="h-48 bg-surface-2 flex items-center justify-center">
                <span className="text-muted">Portfolio</span>
              </div>
              <div className="p-4">
                <Link href={`/portfolios/${p.id}`} className="text-lg font-bold hover:text-orange mb-1 block">
                  {p.title || "Untitled Portfolio"}
                </Link>
                {p.description && <p className="text-sm text-muted mb-3 line-clamp-2">{p.description}</p>}
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className={`text-[10px] uppercase tracking-wider font-bold border rounded px-2 py-0.5 ${p.is_public ? "text-orange border-orange/20 bg-orange/5" : "text-muted border-line-border"}`}>
                    {p.is_public ? "Public" : "Private"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
