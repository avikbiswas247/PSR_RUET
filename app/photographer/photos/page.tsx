"use client";

import { FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import Image from "next/image";
import { useApi } from "@/lib/hooks/use-api";
import { PublicPhoto } from "@/lib/types/public";

export default function PhotographerPhotosPage() {
  const [photosVersion, setPhotosVersion] = useState(0);
  const { data, loading, error } = useApi<PublicPhoto[] | null>(`/api/photos?refresh=${photosVersion}`);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadNotice, setUploadNotice] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState("");
  const [modalAlt, setModalAlt] = useState("");
  const [editPhotoId, setEditPhotoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editBusy, setEditBusy] = useState<Set<string>>(new Set());
  const [deleteBusy, setDeleteBusy] = useState<Set<string>>(new Set());

  const photos = loading ? [] : (data ?? []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">Photos</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border line-border rounded-sm overflow-hidden p-4">
              <div className="bg-surface-2" style={{ height: "240px", width: "100%" }} />
              <div className="mt-4">
                <div className="h-5 bg-surface-2 mb-2 w-2/3" />
                <div className="h-5 bg-surface-2 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState title="Unable to load photos" description={error} />
    );
  }

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadBusy(true);
    setUploadNotice("");
    const file = selectedFile;
    if (!file) {
      setUploadNotice("Please select an image file.");
      setUploadBusy(false);
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error?.message || "Upload failed.");
      const imageUrl = json.data?.url;
      if (!imageUrl) throw new Error("No image url returned.");

      const pres = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || "Untitled", description, imageUrl }),
      });
      const pjson = await pres.json().catch(() => ({}));
      if (!pres.ok) throw new Error(pjson.error?.message || pjson.message || "Unable to publish photo.");

      setUploadNotice("Photo uploaded and published.");
      setTitle("");
      setDescription("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPhotosVersion((version) => version + 1);
      window.dispatchEvent(new Event("photos:updated"));
    } catch (err) {
      setUploadNotice(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setUploadBusy(false);
    }
  };

  const handleEditSave = async (photoId: string) => {
    setEditBusy((prev) => new Set([...prev, photoId]));
    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle || null, description: editDesc || null }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error?.message || payload.message || "Unable to update caption.");
      }
      setPhotosVersion((version) => version + 1);
      setEditPhotoId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to update caption.");
    } finally {
      setEditBusy((prev) => {
        const next = new Set(prev);
        next.delete(photoId);
        return next;
      });
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!window.confirm("Delete this photo?")) return;
    setDeleteBusy((prev) => new Set([...prev, photoId]));
    try {
      const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error?.message || payload.message || "Unable to delete photo.");
      }
      setPhotosVersion((version) => version + 1);
      window.dispatchEvent(new Event("photos:updated"));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to delete photo.");
    } finally {
      setDeleteBusy((prev) => {
        const next = new Set(prev);
        next.delete(photoId);
        return next;
      });
    }
  };

  const openModal = (src: string, alt: string) => {
    setModalSrc(src);
    setModalAlt(alt);
    setModalOpen(true);
  };

  const startEdit = (p: PublicPhoto) => {
    setEditPhotoId(p.id);
    setEditTitle(p.title || "");
    setEditDesc(p.description || "");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] tracking-tight font-bold">Photos</h1>
          <p className="text-muted text-sm">
            Upload your work to build your portfolio. Clients browse these in
            the Portfolios section.
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={uploadBusy}>
          Upload photo
        </Button>
      </div>

      <div className="p-6 rounded-2xl border line-border bg-surface space-y-4">
        <h2 className="text-lg font-bold mb-3">Upload a new photo</h2>
        <form onSubmit={handleUpload} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Photo title"
              required
            />
            <Input
              label="Description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
            />
          </div>
          <div className="rounded-lg border-2 border-dashed border-line-border p-5 transition-colors hover:border-orange/50 focus-within:border-orange/70">
            <label htmlFor="file-input" className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">Photo file</label>
            <span className="text-orange font-bold text-sm mb-2">📷 Choose image</span>
            <span className="text-xs text-muted">{selectedFile ? selectedFile.name : "JPEG, PNG, WebP up to 10 MB"}</span>
            <input
              ref={fileInputRef}
              id="file-input"
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              required
              disabled={uploadBusy}
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="block w-full cursor-pointer text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-sm file:border file:border-line-border file:bg-surface-2 file:px-4 file:py-2 file:font-semibold file:text-orange hover:file:border-orange"
            />
            <p className="mt-2 text-xs text-muted">{selectedFile ? `Selected: ${selectedFile.name}` : "Choose a JPEG, PNG, WebP, GIF, or AVIF image up to 10 MB."}</p>
          </div>
          {uploadNotice && (
            <div className="p-3 rounded-lg bg-orange/10 border border-orange/20 text-orange text-sm">
              {uploadNotice}
            </div>
          )}
          <Button type="submit" variant="primary" disabled={uploadBusy} className="w-full py-3">
            {uploadBusy ? "Uploading…" : "Publish photo"}
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {photos.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              compact
              title="No photos yet"
              description="Upload your first photo to build your portfolio."
            />
          </div>
        ) : (
          photos.map((p) => (
            <div
              key={p.id}
              className="relative group overflow-hidden rounded-xl border line-border bg-surface-2"
            >
              <div className="relative h-48 bg-surface-2 overflow-hidden cursor-pointer" onClick={() => openModal(p.image_url, p.title || "Photo")}>
                <Image
                  src={p.image_url}
                  alt={p.title || "Photo"}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 320px, (max-width: 1200px) 400px, 480px"
                  priority={false}
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white font-bold text-sm">View full size</span>
                </div>
                {/* Photo actions overlay */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(p); }}
                    className="p-2 rounded bg-black/60 text-white text-xs hover:bg-black/80 transition-colors"
                    title="Edit caption"
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                    disabled={deleteBusy.has(p.id)}
                    className="p-2 rounded bg-black/60 text-white text-xs hover:bg-orange transition-colors"
                    title="Delete photo"
                  >
                    🗑
                  </button>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-bold text-white truncate">{p.title || "Untitled"}</h3>
                  {editPhotoId === p.id && (
                    <button
                      onClick={() => setEditPhotoId(null)}
                      className="text-[10px] text-orange hover:underline ml-2"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {editPhotoId === p.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Title"
                      className="text-xs"
                    />
                    <Input
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Description"
                      className="text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSave(p.id)}
                        disabled={editBusy.has(p.id)}
                        className="flex-1 button button-primary text-[10px] py-1.5"
                      >
                        {editBusy.has(p.id) ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditPhotoId(null)}
                        className="flex-1 button button-outline text-[10px] py-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted uppercase tracking-wider">{p.visibility}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Full-size lightbox modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="relative max-w-[90vw] max-h-[90vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-0 right-0 z-10 bg-black/60 text-white rounded-full p-2 hover:bg-orange transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
            <Image
              src={modalSrc}
              alt={modalAlt}
              width={1200}
              height={800}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              sizes="90vw"
            />
            <button
              onClick={() => window.open(modalSrc, "_blank")}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 bg-orange text-[#14110f] px-4 py-2 rounded-sm text-sm font-bold hover:bg-orange-deep transition-colors"
            >
              Open image in new tab
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
