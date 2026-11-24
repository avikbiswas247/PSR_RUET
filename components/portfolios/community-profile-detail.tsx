"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Camera, Globe, MapPin, X } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import type { CommunityProfileDetail, CommunityProfilePhoto } from "@/lib/types/public";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  MEMBER: "Member",
  PHOTOGRAPHER: "Photographer",
};

function safeHttpUrl(value: string | null) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function displayDate(value: string | Date) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function PhotoLightbox({ photo, onClose }: { photo: CommunityProfilePhoto; onClose: () => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.title || "Photo preview"}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-3 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <button type="button" onClick={onClose} aria-label="Close photo" className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange">
        <X size={21} />
      </button>
      <div className="flex max-h-full w-full max-w-6xl flex-col items-center" onClick={(event) => event.stopPropagation()}>
        <img src={photo.image_url} alt={photo.title || "Community photograph"} className="max-h-[82vh] max-w-full rounded-lg object-contain" />
        {(photo.title || photo.description) && (
          <div className="mt-4 w-full max-w-3xl text-center text-white">
            {photo.title && <h2 className="font-semibold">{photo.title}</h2>}
            {photo.description && <p className="mt-1 text-sm text-white/70">{photo.description}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommunityProfileDetail({ userId }: { userId: string }) {
  const { data: profile, loading, error } = useApi<CommunityProfileDetail>(`/api/portfolios/profiles/${userId}`);
  const [activePhoto, setActivePhoto] = useState<CommunityProfilePhoto | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  if (loading) {
    return (
      <PageContainer className="section-pad">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="skeleton mb-5 h-4 w-40" />
          <div className="skeleton h-64 rounded-[28px]" />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((item) => <div key={item} className="skeleton h-24 rounded-2xl" />)}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !profile) {
    return (
      <PageContainer className="section-pad">
        <div className="mx-auto max-w-3xl rounded-2xl border line-border bg-surface-2 p-7 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">Profile unavailable</p>
          <h1 className="mt-3 text-2xl font-bold text-text">We couldn&rsquo;t find this PSR profile.</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{error || "This profile may have been deactivated or removed."}</p>
          <Link href="/portfolios" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-orange hover:underline">
            <ArrowLeft size={15} /> Back to portfolios
          </Link>
        </div>
      </PageContainer>
    );
  }

  const name = profile.full_name?.trim() || "PSR community member";
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const joined = displayDate(profile.created_at);
  const instagramUrl = safeHttpUrl(profile.instagram_url);
  const websiteUrl = safeHttpUrl(profile.website_url);

  return (
    <PageContainer className="section-pad">
      <div className="mx-auto max-w-6xl">
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Portfolios", href: "/portfolios" },
          { label: name, href: `/portfolios/profile/${profile.id}` },
        ]} />

        <Link href="/portfolios" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-orange">
          <ArrowLeft size={15} /> Back to portfolios
        </Link>

        <section className="overflow-hidden rounded-[28px] border line-border bg-surface shadow-sm">
          <div aria-hidden="true" className="relative h-32 overflow-hidden bg-gradient-to-r from-orange/20 via-surface-2 to-surface-3 sm:h-48">
            <div className="absolute -right-12 -top-32 h-80 w-80 rounded-full border border-orange/15" />
            <div className="absolute -right-2 -top-24 h-64 w-64 rounded-full border border-orange/15" />
            <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full border line-border bg-surface/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted backdrop-blur sm:left-8">
              <Camera size={13} className="text-orange" /> PSR community
            </div>
          </div>

          <div className="px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                {profile.avatar_url && !avatarFailed ? (
                  <img src={profile.avatar_url} alt={name} onError={() => setAvatarFailed(true)} className="h-24 w-24 shrink-0 rounded-full border-4 border-surface bg-surface-2 object-contain shadow-xl sm:h-32 sm:w-32" />
                ) : (
                  <span aria-hidden="true" className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-surface bg-orange/15 text-3xl font-bold text-orange shadow-xl sm:h-32 sm:w-32 sm:text-4xl">
                    {initials || "P"}
                  </span>
                )}
                <div className="min-w-0">
                  <h1 className="break-words text-2xl font-bold leading-tight tracking-tight text-text [overflow-wrap:anywhere] sm:text-4xl">{name}</h1>
                  {profile.title && <p className="mt-1 break-words text-sm font-medium text-orange [overflow-wrap:anywhere] sm:text-base">{profile.title}</p>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
                {profile.roles.map((role) => (
                  <span key={role} className="rounded-full border border-orange/20 bg-orange/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-orange">
                    {ROLE_LABELS[role] ?? role}
                  </span>
                ))}
              </div>
            </div>

            {profile.bio && <p className="mt-6 max-w-3xl whitespace-pre-line break-words text-sm leading-7 text-muted sm:text-base">{profile.bio}</p>}

            <div className="mt-7 grid grid-cols-2 gap-3 border-t line-border pt-5 sm:grid-cols-4 sm:gap-5">
              <div><p className="text-xl font-bold text-text">{profile.photo_count}</p><p className="mt-1 text-xs text-muted">Public photos</p></div>
              <div><p className="text-xl font-bold text-text">{profile.portfolio_count}</p><p className="mt-1 text-xs text-muted">Portfolios</p></div>
              {profile.location && <div className="col-span-2 sm:col-span-1"><p className="flex items-center gap-1.5 text-sm font-semibold text-text"><MapPin size={15} className="shrink-0 text-orange" />{profile.location}</p><p className="mt-1 text-xs text-muted">Location</p></div>}
              {joined && <div><p className="text-sm font-semibold text-text">{joined}</p><p className="mt-1 text-xs text-muted">With PSR</p></div>}
            </div>

            {(profile.device || profile.photography_genre || instagramUrl || websiteUrl) && (
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t line-border pt-5">
                {profile.photography_genre && <span className="rounded-full border line-border bg-surface-2 px-3 py-1.5 text-xs text-muted">{profile.photography_genre}</span>}
                {profile.device && <span className="rounded-full border line-border bg-surface-2 px-3 py-1.5 text-xs text-muted">{profile.device}</span>}
                {instagramUrl && <a href={instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border line-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-orange/30 hover:text-orange"><Camera size={14} /> Instagram <ArrowUpRight size={12} /></a>}
                {websiteUrl && <a href={websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border line-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-orange/30 hover:text-orange"><Globe size={14} /> Website <ArrowUpRight size={12} /></a>}
              </div>
            )}
          </div>
        </section>

        <section className="mt-10 sm:mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-orange">Selected work</p>
              <h2 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">Photos</h2>
            </div>
            <span className="text-xs text-muted">{profile.photo_count} public</span>
          </div>

          {profile.photos.length === 0 ? (
            <EmptyState
              compact
              title="No public photos yet"
              description="Photos this member chooses to share will appear here."
            />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {profile.photos.map((photo) => (
                <button key={photo.id} type="button" onClick={() => setActivePhoto(photo)} className="group relative aspect-square overflow-hidden rounded-xl bg-surface-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange">
                  <img src={photo.thumbnail_url || photo.image_url} alt={photo.title || "Community photograph"} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-10 text-left text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">{photo.title || "View photo"}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {activePhoto && <PhotoLightbox photo={activePhoto} onClose={() => setActivePhoto(null)} />}
    </PageContainer>
  );
}
