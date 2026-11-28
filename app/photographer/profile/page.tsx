"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { PhotographerProfileMe } from "@/lib/types/public";

type Photo = { id: string; title: string | null; image_url: string; thumbnail_url: string | null };

export default function PhotographerProfilePage() {
  const { data, loading } = useApi<PhotographerProfileMe | null>(
    "/api/photographers/me"
  );
  const { data: photosData, loading: photosLoading } =
    useApi<Photo[] | null>("/api/photos");
  const [profile, setProfile] = useState<PhotographerProfileMe | null>(() => data ?? null);
  const [busy, setBusy] = useState(false);
  const [dpBusy, setDpBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [dpPreview, setDpPreview] = useState<string | null>(null);
  const [newPhotoTitle, setNewPhotoTitle] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState("");
  const [modalAlt, setModalAlt] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const photos = useMemo(
    () => ((photosData ?? []) as Photo[]).filter((p) => p.image_url),
    [photosData]
  );

  // Sync profile from API data on load and refetch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(data ?? null);
  }, [data]);

  const openModal = (src: string, alt: string) => {
    setModalSrc(src);
    setModalAlt(alt);
    setModalOpen(true);
  };

  const handleDpChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDpBusy(true);
    setNotice("");
    try {
      const url = URL.createObjectURL(file);
      setDpPreview(url);
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error?.message || "DP upload failed.");
      const avatarUrl = json.data?.url;
      if (!avatarUrl) throw new Error("No image url returned.");

      const userRes = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl }),
      });
      if (!userRes.ok) {
        const errJson = await userRes.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to update user avatar.");
      }

      setProfile((prev) => (prev ? { ...prev, avatar_url: avatarUrl } : ({ avatar_url: avatarUrl } as unknown as PhotographerProfileMe)));
      setNotice("Profile picture updated.");
      setDpPreview(null);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to update DP.");
    } finally {
      setDpBusy(false);
      e.target.value = "";
    }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setBusy(true);
      setNotice("");
      setFieldErrors({});
      const form = new FormData(e.currentTarget);
      const body: Record<string, unknown> = {};
      const fullName = form.get("fullName");
      const title = form.get("title");
      const bio = form.get("bio");
      const location = form.get("location");
      const device = form.get("device");
      const genre = form.get("genre");
      const instagramUrl = form.get("instagramUrl");
      const websiteUrl = form.get("websiteUrl");
      const isAvailable = form.get("isAvailable");
      if (fullName) body.fullName = fullName;
      if (title !== null) body.title = title;
      if (bio !== null) body.bio = bio;
      if (location !== null) body.location = location;
      if (device !== null) body.device = device;
      if (genre !== null) body.photographyGenre = genre;
      if (instagramUrl !== null) body.instagramUrl = instagramUrl;
      if (websiteUrl !== null) body.websiteUrl = websiteUrl;
      if (isAvailable !== null) body.isAvailable = isAvailable === "on";
      try {
        if (body.fullName !== undefined) {
          const res = await fetch("/api/users/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName: body.fullName }),
          });
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.message || "Unable to update name.");
          }
        }
        const profileRes = await fetch("/api/photographers/me/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: body.title,
            bio: body.bio,
            location: body.location,
            device: body.device,
            photographyGenre: body.photographyGenre,
            instagramUrl: body.instagramUrl,
            websiteUrl: body.websiteUrl,
            isAvailable: body.isAvailable,
          }),
        });
        const profileJson = await profileRes.json().catch(() => ({}));
        if (!profileRes.ok) {
          const details = profileJson.error?.details as Record<string, string> | undefined;
          if (details) {
            setFieldErrors(details);
            throw new Error("Please fix the fields marked below.");
          }
          throw new Error(profileJson.message || "Failed to save photographer profile.");
        }

        setProfile((profileJson?.data ?? ({} as unknown as PhotographerProfileMe)) as PhotographerProfileMe);
        setNotice("Profile saved successfully.");
        setEditMode(false);
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "Please try again.");
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    setNotice("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error?.message || "Photo upload failed.");
      const imageUrl = json.data?.url;
      if (!imageUrl) throw new Error("No image url returned.");

      const pres = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newPhotoTitle || "Untitled", imageUrl }),
      });
      const pjson = await pres.json().catch(() => ({}));
      if (!pres.ok) throw new Error(pjson.message || "Unable to publish photo.");
      setNotice("Photo uploaded to your grid.");
      setNewPhotoTitle("");
      e.target.value = "";
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Photo upload failed.");
    } finally {
      setPhotoBusy(false);
    }
  };

  if (loading || photosLoading) {
    return (
      <div className="section-pad max-w-[720px] mx-auto">
        <h1 className="text-[32px] tracking-tight font-bold">Profile</h1>
        <div className="p-6 rounded-sm border line-border bg-surface">
          <div className="h-5 bg-surface-2 mb-4 w-2/3" />
          <div className="h-5 bg-surface-2 w-full" />
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square bg-surface-2 rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const p = profile;
  const avatar = p?.avatar_url
    ? p.avatar_url
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        p?.full_name || "photographer"
      )}`;
  const initials = (p?.full_name || "P")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="section-pad max-w-[936px] mx-auto">
      <nav className="flex items-center gap-4 mb-6">
        <Link href="/photographers" className="text-xs font-bold text-muted hover:text-orange transition-colors">
          &larr; Portfolios
        </Link>
      </nav>

      {notice && (
        <div className="mb-6 p-4 rounded-lg bg-orange/10 border border-orange/20 text-orange text-sm">
          {notice}
        </div>
      )}

      {/* Instagram-style profile header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex-shrink-0">
            <div className="relative group">
              <div className="relative">
                {dpPreview ? (
                  <img src={dpPreview} alt="DP preview" className="w-32 h-32 rounded-full object-cover border line-border" />
                ) : p?.avatar_url ? (
                  <img src={avatar} alt={p?.full_name || "Photographer"} className="w-32 h-32 rounded-full object-cover border line-border" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-surface-2 flex items-center justify-center border line-border">
                    <span className="text-xl font-bold text-muted">{initials}</span>
                  </div>
                )}
                <label className="absolute -bottom-2 -right-2 bg-black/60 backdrop-blur text-white text-[10px] rounded-full px-2.5 py-1 hover:bg-black/80 transition-colors cursor-pointer flex items-center gap-1">
                  <span>Change DP</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDpChange}
                    className="hidden"
                  />
                </label>
              </div>
              {dpBusy && <span className="mt-2 text-[10px] text-muted">Uploading…</span>}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold text-text leading-tight">
                {p?.full_name || "Photographer"}
              </h1>
              <Button
                onClick={() => setEditMode(true)}
                variant="outline"
                className="text-xs px-3 py-1.5"
              >
                Edit profile
              </Button>
            </div>
            {p?.bio && (
              <p className="text-sm text-gray-400 mb-4">{p.bio}</p>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
              {p?.device && (
                <span className="text-xs font-bold text-muted border border-line-border rounded px-2 py-1">
                  {p.device}
                </span>
              )}
              {p?.photography_genre && (
                <span className="text-xs font-bold text-orange border border-orange/20 bg-orange/5 rounded px-2 py-1">
                  {p.photography_genre}
                </span>
              )}
              {p?.is_available && (
                <span className="text-xs font-bold text-green border border-green/20 bg-green/5 rounded px-2 py-1">
                  Available for booking
                </span>
              )}
            </div>
            <div className="flex gap-2 mb-4 text-xs text-muted">
              {p?.instagram_url && (
                <a
                  href={p.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-orange transition-colors"
                >
                  <span>📷</span> Instagram
                </a>
              )}
              {p?.website_url && (
                <a
                  href={p.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-orange transition-colors"
                >
                  <span>🔗</span> Website
                </a>
              )}
            </div>
            <div className="flex gap-8 text-sm">
              <div>
                <div className="text-text font-bold">{photos.length}</div>
                <div className="text-muted text-[10px] uppercase tracking-wider">Posts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Highlights row */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          <span className="text-xs font-bold text-muted shrink-0">Highlights</span>
          <div className="flex gap-3 shrink-0">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="relative w-14 h-14 rounded-full border border-orange/40 bg-surface-2 overflow-hidden shrink-0">
                  <img
                    src={
                      photos[i]?.image_url ||
                      `https://images.unsplash.com/photo-15${1 + i}0000000000000?auto=format&fit=crop&w=200&q=60`
                    }
                    alt={`Highlight ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] text-muted leading-none">Story {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit form (inline when editing) */}
      {editMode && (
        <div className="mb-8 p-6 rounded-2xl border line-border bg-surface">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-6">Edit profile</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full name"
              name="fullName"
              defaultValue={p?.full_name || ""}
              placeholder="Your full name"
            />
            <Input
              label="Title / specialty"
              name="title"
              defaultValue={p?.title || ""}
              placeholder="e.g. Portrait & Street Photography"
            />
            <Input
              label="Camera / device"
              name="device"
              defaultValue={p?.device || ""}
              placeholder="e.g. Canon EOS R5, iPhone 15 Pro"
            />
            <Input
              label="Photography genre"
              name="genre"
              defaultValue={p?.photography_genre || ""}
              placeholder="e.g. Street, Portrait, Landscape"
            />
            <Input
              label="Location"
              name="location"
              defaultValue={p?.location || ""}
              placeholder="Rajshahi, Bangladesh"
            />
            <Input
              label="Bio"
              name="bio"
              defaultValue={p?.bio || ""}
              placeholder="Tell clients about your style…"
              className="mb-6"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Instagram URL"
                name="instagramUrl"
                defaultValue={p?.instagram_url || ""}
                placeholder="https://instagram.com/…"
              />
              {fieldErrors.instagramUrl && (
                <p className="text-[10px] text-red-400 mb-2">{fieldErrors.instagramUrl}</p>
              )}
              <Input
                label="Website URL"
                name="websiteUrl"
                defaultValue={p?.website_url || ""}
                placeholder="https://…"
              />
              {fieldErrors.websiteUrl && (
                <p className="text-[10px] text-red-400 mb-2">{fieldErrors.websiteUrl}</p>
              )}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input
                id="isAvailable"
                type="checkbox"
                name="isAvailable"
                defaultChecked={p?.is_available}
                className="rounded border-line-border text-orange focus:ring-orange"
              />
              <label htmlFor="isAvailable" className="text-sm text-muted cursor-pointer">
                Available for bookings
              </label>
            </div>
            {busy && <span className="text-[10px] text-muted mt-2 block">Saving…</span>}
            <div className="flex gap-3 pt-4">
              <Button type="submit" variant="primary" className="flex-1 py-3 text-lg font-bold tracking-wider" disabled={busy}>
                {busy ? "Saving…" : "Save profile"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditMode(false)} className="flex-1 py-3">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Photo grid */}
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-text">Posts</h2>
          <span className="text-xs text-muted">{photos.length} posts</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
          {photos.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                compact
                title="No photos yet"
                description="Your published work will appear here. Add a photo to start building your profile gallery."
              />
            </div>
          ) : (
            photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden bg-surface-2 group cursor-pointer"
                onClick={() => openModal(photo.image_url, photo.title || "Photo")}
              >
                <img
                  src={photo.image_url || photo.thumbnail_url || "/api/photos/placeholder"}
                  alt={photo.title || "Photo"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/0 transition-opacity duration-300 flex items-center justify-center p-2">
                  {photo.title && (
                    <span className="text-[10px] font-bold text-white bg-black/40 px-2 py-0.5 rounded">
                      {photo.title}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Photo upload (always available at bottom of grid) */}
      <div className="mt-6 p-4 rounded-lg border line-border bg-surface">
        <label className="block text-xs font-bold text-muted mb-3">Upload a new photo to your grid</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="block w-full text-xs text-muted file:mr-2 file:py-2 file:px-4 file:rounded file:border file:border-line-border file:text-orange hover:file:bg-orange/10 cursor-pointer"
          />
          <Input
            label="Title"
            name="photoTitle"
            value={newPhotoTitle}
            onChange={(e) => setNewPhotoTitle(e.target.value)}
            placeholder="e.g. Golden hour portrait"
          />
        </div>
        {photoBusy && <span className="mt-2 text-[10px] text-muted block">Publishing…</span>}
      </div>

      <p className="mt-6 text-xs text-muted text-center">
        Your profile is visible to clients in the Portfolios section so they can
        find and book you.
      </p>

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
