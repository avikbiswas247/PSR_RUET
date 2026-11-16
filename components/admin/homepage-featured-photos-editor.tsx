"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/use-api";
import {
  DEFAULT_HOMEPAGE_FEATURED_PHOTOS,
  parseHomepageFeaturedPhotos,
  type HomepageFeaturedPhoto,
} from "@/lib/homepage-featured-photos";

const inputClass = "w-full rounded-md border border-line-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-muted focus:border-orange focus:outline-none";

export function HomepageFeaturedPhotosEditor() {
  const { data, loading, error } = useApi<HomepageFeaturedPhoto[] | null>("/api/homepage/featured-photos");
  const [photos, setPhotos] = useState<HomepageFeaturedPhoto[]>(DEFAULT_HOMEPAGE_FEATURED_PHOTOS);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const editingDisabled = loading || busy || uploadingIndex !== null;

  useEffect(() => {
    if (data) setPhotos(data);
  }, [data]);

  const updatePhoto = (index: number, patch: Partial<HomepageFeaturedPhoto>) => {
    setPhotos((current) => current.map((photo, photoIndex) => photoIndex === index ? { ...photo, ...patch } : photo));
  };

  const uploadPhoto = async (index: number, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setNotice("Choose an image smaller than 10 MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setNotice("Choose an image file.");
      return;
    }

    setUploadingIndex(index);
    setNotice("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/media/upload", { method: "POST", body: formData });
      const payload = await response.json();
      const url = payload?.data?.url;
      if (!response.ok || typeof url !== "string") {
        throw new Error(payload?.error?.message || payload?.message || "Image upload failed.");
      }
      updatePhoto(index, { image: url });
      setNotice(`Image uploaded for frame ${index + 1}. Save the homepage frames to publish it.`);
    } catch (uploadError) {
      setNotice(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setUploadingIndex(null);
    }
  };

  const savePhotos = async () => {
    const validated = parseHomepageFeaturedPhotos(photos);
    if (!validated) {
      setNotice("Each frame needs a title, category, and valid HTTPS or site image URL.");
      return;
    }

    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/homepage/featured-photos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: validated }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.message || "Unable to save homepage frames.");
      }
      setPhotos(validated);
      setNotice("Homepage frames saved. The public homepage will now show these photos.");
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : "Unable to save homepage frames.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-5 rounded-xl border border-line-border bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-orange">Homepage content</p>
          <h2 className="text-xl font-bold tracking-tight">Every frame, a point of view</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">Choose the four photos shown on the homepage. Upload a new image or paste an HTTPS image URL, then save your changes.</p>
        </div>
        <Button type="button" variant="primary" onClick={() => void savePhotos()} disabled={loading || busy || uploadingIndex !== null}>
          {busy ? "Saving…" : "Save homepage frames"}
        </Button>
      </div>

      {notice && <p className="rounded-lg border border-line-border bg-surface-2 px-4 py-3 text-sm text-text" role="status">{notice}</p>}
      {error && <p className="rounded-lg border border-orange/20 bg-orange/5 px-4 py-3 text-sm text-orange">Could not load saved homepage frames: {error}</p>}

      <div className="grid gap-4 xl:grid-cols-2">
        {photos.map((photo, index) => (
          <article key={index} className="grid min-w-0 gap-4 rounded-lg border border-line-border bg-bg p-4 sm:grid-cols-[minmax(180px,0.8fr)_minmax(0,1.2fr)]">
            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Frame {String(index + 1).padStart(2, "0")}</h3>
                <span className="text-[10px] uppercase tracking-wider text-muted">{index === 0 ? "Tall" : index === 3 ? "Wide" : "Square"} position</span>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-line-border bg-surface-2">
                <img src={photo.image} alt={`${photo.title} preview`} className="h-full w-full object-cover" />
                <span className="absolute bottom-2 left-2 rounded bg-black/65 px-2 py-1 text-[10px] font-bold text-white">Preview</span>
              </div>
              <label className="mt-3 inline-flex cursor-pointer items-center rounded-md border border-line-border px-3 py-2 text-xs font-semibold text-text transition hover:border-orange hover:text-orange">
                {uploadingIndex === index ? "Uploading…" : "Upload replacement"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  className="sr-only"
                  disabled={editingDisabled}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = "";
                    if (file) void uploadPhoto(index, file);
                  }}
                />
              </label>
            </div>

            <div className="grid content-start gap-3">
              <label className="grid gap-1.5 text-xs font-semibold text-muted">
                Photo title
                <input className={inputClass} value={photo.title} maxLength={100} disabled={editingDisabled} onChange={(event) => updatePhoto(index, { title: event.currentTarget.value })} />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-muted">
                Category / caption
                <input className={inputClass} value={photo.type} maxLength={80} disabled={editingDisabled} onChange={(event) => updatePhoto(index, { type: event.currentTarget.value })} />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-muted">
                Image URL
                <input className={inputClass} value={photo.image} disabled={editingDisabled} onChange={(event) => updatePhoto(index, { image: event.currentTarget.value })} placeholder="HTTPS image URL or /images/photo.jpg" />
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
