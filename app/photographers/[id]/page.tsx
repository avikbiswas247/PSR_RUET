"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import Image from "next/image";
import { Images } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { useAuth } from "@/components/providers/auth-provider";
import { PublicPhotographer, PublicPhoto } from "@/lib/types/public";

interface AvailabilitySlot {
  id: string;
  available_date: string | Date;
  start_time: string | Date;
  end_time: string | Date;
  is_available: boolean;
}

function localDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function PhotographerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = useAuth();
  const { id: photographerId } = use(params);

  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(photographerId);

  const { data: photographer, loading, error } =
    useApi<PublicPhotographer | null>(isValidUuid ? `/api/photographers/${photographerId}` : "");
  const { data: photos, loading: photosLoading } = useApi<PublicPhoto[] | null>(
    isValidUuid ? `/api/photos?photographer_id=${photographerId}` : ""
  );
  const availabilityUrl = photographer?.user_id
    ? `/api/availability?photographerId=${photographer.user_id}&from=${localDateString(new Date())}&to=9999-12-31&limit=6&openOnly=true`
    : "/api/availability?photographerId=00000000-0000-0000-0000-000000000000&from=2026-01-01&to=2026-01-02";
  const { data: slots } = useApi<AvailabilitySlot[] | null>(availabilityUrl);
  const openSlots = photographer?.is_available ? (slots ?? []).filter((slot) => slot.is_available) : [];
  const canBook = openSlots.length > 0;
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  useEffect(() => {
    if (user && isValidUuid) {
      fetch(`/api/photographers/follow?photographer_id=${encodeURIComponent(photographerId)}`)
        .then((r) => r.json())
        .then((data: { is_following: boolean; follower_count: number }) => {
          setIsFollowing(data.is_following);
          setFollowerCount(data.follower_count);
        });
    }
  }, [photographerId, user, isValidUuid]);

  const isOwn =
    !!user && !!photographer?.user_id && user.id === photographer.user_id;
  const isAdmin = !!user?.roles?.includes("ADMIN");
  const canEdit = isOwn || isAdmin;
  const photosList = photos ?? [];
  const avatarUrl = photographer?.avatar_url
    ? photographer.avatar_url
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        photographer?.full_name || "photographer"
      )}`;
  const initials = (photographer?.full_name || "P")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const toggleFollow = async () => {
    if (!user) return;
    setFollowBusy(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch("/api/photographers/follow", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photographer_id: photographerId }),
      });
      if (res.ok) {
        setIsFollowing(!isFollowing);
        setFollowerCount((prev) => (isFollowing ? prev - 1 : prev + 1));
      }
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setFollowBusy(false);
    }
  };

  const openModal = (src: string, title: string) => {
    setModalSrc(src);
    setModalTitle(title);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [modalOpen]);

  if (!isValidUuid) {
    return (
      <div className="section-pad max-w-[720px] mx-auto text-center">
        <h1 className="text-[40px] tracking-tight font-bold mb-8">Invalid Photographer</h1>
        <p className="text-gray-400 mb-6">The photographer identifier is not valid.</p>
        <Link href="/photographers" className="text-orange font-bold hover:underline">
          Browse photographers
        </Link>
      </div>
    );
  }

  if (loading || photosLoading) {
    return (
      <main className="min-h-[calc(100vh-92px)] w-full">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-7 sm:px-8">
          <div className="mb-8 flex items-center gap-5 sm:gap-8">
            <div className="h-24 w-24 shrink-0 rounded-full bg-surface-2 sm:h-32 sm:w-32" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-5 w-2/3 rounded bg-surface-2" />
              <div className="h-4 w-full max-w-[20rem] rounded bg-surface-2" />
              <div className="h-4 w-1/2 rounded bg-surface-2" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-px sm:gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-square bg-surface-2" />
              ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !photographer) {
    return (
      <main className="flex min-h-[calc(100vh-92px)] w-full items-center justify-center px-5 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-orange/20 bg-orange/5 text-2xl text-orange">&#10006;</div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-text">Profile not found</h1>
          <p className="mb-6 text-sm leading-relaxed text-muted">The profile you&rsquo;re looking for doesn&rsquo;t exist or is no longer available.</p>
          <Link href="/photographers" className="button button-primary">Browse portfolios</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative isolate min-h-[calc(100dvh-72px)] w-full md:min-h-[calc(100dvh-92px)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(255,116,23,0.15),transparent)]"
      />
      <div className="relative z-10 mx-auto w-full max-w-[1280px]">
      <nav className="sticky top-[72px] z-30 flex h-14 items-center justify-between border-b border-line-border bg-bg/95 px-4 backdrop-blur-xl sm:px-8 md:top-[92px]">
        <Link href="/photographers" className="flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-orange">
          <span aria-hidden="true" className="text-lg">&larr;</span> Portfolios
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">PSR / Profile</span>
      </nav>

      {/* Profile header */}
      <section className="px-4 pb-8 pt-7 sm:px-8 sm:pt-10">
        <div className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-10 md:grid-cols-[220px_minmax(0,1fr)] md:gap-14">
          <div className="flex justify-center md:justify-start">
            <div className="relative group rounded-full bg-gradient-to-tr from-orange via-rose-500 to-violet-500 p-[2px] sm:p-[3px]">
              <div className="relative rounded-full bg-bg p-[3px] sm:p-1">
                {photographer.avatar_url ? (
                  <img
                    src={avatarUrl}
                    alt={photographer.full_name || "Photographer"}
                    className="h-[72px] w-[72px] rounded-full object-cover border border-line-border sm:h-36 sm:w-36 md:h-52 md:w-52"
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(photographer.full_name || "photographer")}`;
                    }}
                  />
                ) : (
                  <div className="dp flex h-[72px] w-[72px] items-center justify-center rounded-full border border-line-border bg-surface-2 sm:h-36 sm:w-36 md:h-52 md:w-52">
                    <span className="text-xl font-bold text-muted">{initials}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:gap-4">
              <h1 className="break-words text-xl font-bold leading-tight text-text [overflow-wrap:anywhere]">
                {photographer.full_name || "Photographer"}
              </h1>
              {canEdit ? (
                <Link
                  href="/photographer/profile"
                  className="text-xs font-bold text-orange hover:underline transition-colors"
                >
                  Edit profile
                </Link>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user ? (
                    <button
                      onClick={toggleFollow}
                      disabled={followBusy}
                      className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors disabled:opacity-60 ${isFollowing ? "bg-surface-2 text-text" : "bg-orange text-[#14110f] hover:bg-orange-deep"}`}
                    >
                      {followBusy ? "Please wait..." : isFollowing ? "Following" : "Follow"}
                    </button>
                  ) : (
                    <Link href="/sign-in" className="rounded-lg bg-orange px-4 py-2 text-sm font-bold text-[#14110f] transition hover:bg-orange-deep">Sign in to follow</Link>
                  )}
                  {canBook && <Link href={`/book/${photographerId}`} className="rounded-lg border border-line-border bg-surface-2 px-4 py-2 text-sm font-semibold text-text transition hover:bg-surface-3">Book a session</Link>}
                </div>
              )}
            </div>
            {photographer.bio && (
              <p className="mb-4 text-sm text-muted">
                {photographer.bio}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
              {photographer.device && (
                <span className="text-xs font-bold text-muted border border-line-border rounded px-2 py-1">
                  {photographer.device}
                </span>
              )}
              {photographer.photography_genre && (
                <span className="text-xs font-bold text-orange border border-orange/20 bg-orange/5 rounded px-2 py-1">
                  {photographer.photography_genre}
                </span>
              )}
              {photographer.is_available && (
                <span className="text-xs font-bold text-green border border-green/20 bg-green/5 rounded px-2 py-1">
                  Available for booking
                </span>
              )}
            </div>
            <div className="flex gap-2 mb-4 text-xs text-muted">
              {photographer.instagram_url && (
                <a
                  href={photographer.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-orange transition-colors"
                >
                  Instagram
                </a>
              )}
              {photographer.website_url && (
                <a
                  href={photographer.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-orange transition-colors"
                >
                  Website
                </a>
              )}
            </div>
            <div className="flex gap-8 text-sm">
              <div>
                <div className="font-bold text-text">{photosList.length}</div>
                <div className="text-muted text-[10px] uppercase tracking-wider">Posts</div>
              </div>
              <div>
                <div className="font-bold text-text">{followerCount}</div>
                <div className="text-muted text-[10px] uppercase tracking-wider">Followers</div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {!canEdit && (
        <section className="mx-4 mb-8 rounded-xl border border-line-border bg-surface p-5 sm:mx-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Upcoming availability</h2>
              <p className="mt-1 text-xs text-muted">Upcoming open booking slots.</p>
            </div>
            {canBook && <Link href={`/book/${photographerId}`} className="text-xs font-bold text-orange hover:underline">Book a session</Link>}
          </div>
          {openSlots.length === 0 ? (
            <p className="text-sm text-muted">No open slots are listed right now. Check back later.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {openSlots.slice(0, 6).map((slot) => (
                <div key={slot.id} className="rounded-lg border border-line-border bg-bg p-3">
                  <p className="text-sm font-semibold">{new Date(`${String(slot.available_date).slice(0, 10)}T00:00:00`).toLocaleDateString()}</p>
                  <p className="mt-1 text-xs text-muted">{String(slot.start_time).slice(0, 5)} – {String(slot.end_time).slice(0, 5)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Post gallery */}
      <div className="border-t border-line-border">
        <div className="flex h-12 items-center justify-center gap-2 border-b border-line-border text-xs font-bold uppercase tracking-[0.2em] text-text">
          <span aria-hidden="true">▦</span><span>Posts</span><span className="text-muted">{photosList.length}</span>
        </div>
        <div className="grid grid-cols-3 gap-px bg-line-border">
          {photosList.length === 0 ? (
            <div className="col-span-3 px-4 py-20 text-center text-muted sm:py-28">
              No posts yet. Photos shared by this photographer will appear here.
            </div>
          ) : (
            photosList.map((photo) => (
              <div
                key={photo.id}
                role="button" tabIndex={0} aria-label={"View " + (photo.title || "photo")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openModal(photo.image_url || photo.thumbnail_url || "/api/photos/placeholder", photo.title || "Photo"); } }} className="relative aspect-square overflow-hidden bg-surface-2 group cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange"
                onClick={() => openModal(photo.image_url || photo.thumbnail_url || "/api/photos/placeholder", photo.title || "Photo")}
              >
                <img
                  src={photo.image_url || photo.thumbnail_url || "/api/photos/placeholder"}
                  alt={photo.title || "Photo"}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-300 sm:group-hover:scale-[1.03]"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.src = "/api/photos/placeholder";
                  }}
                />
                <span className="absolute inset-0 hidden items-center justify-center gap-5 bg-black/35 text-sm font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
                  <span>View photo</span>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {modalOpen && modalSrc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${photographer.full_name || "Photographer"}: ${modalTitle}`}
          className="fixed inset-0 z-[70] flex h-[100dvh] flex-col bg-black text-white sm:items-center sm:justify-center sm:bg-black/90 sm:p-6"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#111] sm:h-[min(92dvh,900px)] sm:max-w-6xl sm:flex-row sm:rounded-xl sm:border sm:border-white/10 sm:shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-xl text-white transition hover:bg-black sm:right-4 sm:top-4"
              aria-label="Close photo"
            >
              <span aria-hidden="true">&times;</span>
            </button>
            <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center bg-black pt-[env(safe-area-inset-top)] sm:pt-0">
              <Image
                src={modalSrc}
                alt={modalTitle}
                width={2000}
                height={1600}
                className="h-full w-full object-contain"
                sizes="(max-width: 640px) 100vw, 72vw"
              />
            </div>
            <aside className="max-h-[34dvh] shrink-0 overflow-y-auto border-t border-white/10 bg-[#111] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:max-h-none sm:w-[320px] sm:px-5 sm:pb-5 sm:pt-5 sm:border-l sm:border-t-0">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-xs font-bold">
                  {photographer.avatar_url ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{photographer.full_name || "Photographer"}</p>
                  <p className="text-xs text-white/55">PSR Portfolio</p>
                </div>
              </div>
              <div className="mt-4 border-t border-white/10 pt-4">
                <h2 className="break-words text-sm font-semibold leading-relaxed [overflow-wrap:anywhere]">
                  {modalTitle}
                </h2>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
    </main>
  );
}
